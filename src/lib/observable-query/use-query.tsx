import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Kysely, QueryResult, SelectQueryBuilder } from "kysely";
import  { DB } from "@vlcn.io/crsqlite-wasm";
import tblrx, { TblRx } from "@vlcn.io/rx-tbl";
import _ from 'lodash'

import { InMemoryCache } from './in-memory-cache'
import { getUsedTables, shallowEqualObjects, arraysShallowEqual } from './utils';

export class DatabaseQueryManager<Schema> {
  private wasmDB?: DB;
  private kyselyBuilder?: (db: DB) => Kysely<Schema>; 
  private kyselyDb?: Kysely<Schema>
  queryCache = new InMemoryCache<any>()
  _rx?: TblRx

  applyDb(db: DB) {
    this.wasmDB = db
    if (this.kyselyBuilder) {
      this.kyselyDb = this.kyselyBuilder(this.wasmDB)
    }
   }

  onBuildKysely(fn: (db: DB) => Kysely<Schema>) {
    this.kyselyBuilder = fn
    if (this.wasmDB) {
      this.kyselyDb = this.kyselyBuilder(this.wasmDB)
    }
  }

  get rx() {
    if (!this._rx) {
      this._rx = tblrx(this.wasmDb)
    }
    return this._rx
  }
  

  get wasmDb(): DB {
    if (!this.wasmDB) {
      throw new Error("Tried to access wasm db before initialization")
    }
    return this.wasmDB
  }

  get db(): Kysely<Schema> {
    if (!this.kyselyDb) {
      throw new Error("Tried to access kysely db before initialization")
    }
    return this.kyselyDb
  }
}


export type QueryFn<Query, Schema> = (db: Kysely<Schema>) => SelectQueryBuilder<Kysely<Schema>, any, Query>

export type DbQueryOptions<Query, Schema> = {
  query: QueryFn<Query, Schema>,
  keys?: unknown[],
  policy?: 'compute-only' | 'cache-only' | 'cache-and-compute',
  reactiveRowId?: bigint
  reactiveTableName?: keyof Schema
  enabled?: boolean
}

type Wrapper<T, Switch extends [] | null> = Switch extends [] ? T[] : T | null

type QueryObserverResult<Query, ResultWrap extends [] | null>  = {
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  data: Wrapper<Query, ResultWrap>
}

type QueryState<Query, ResultWrap extends [] | null> = {
  data: Wrapper<Query, ResultWrap>
  hasLoaded: boolean,
  status: 'success' | 'fetching' | 'idle'
  isQueued: boolean
}

class DbQueryObserver<Schema, Query, ResultWrap extends [] | null> {
  
  reactSubscribeListener?: () => void;
  options: DbQueryOptions<Query, Schema>;
  usedTables: string[] = []
  dbListenerDispose?: () => void;

  currentResult: QueryObserverResult<Query, ResultWrap> = undefined!
  queryState: QueryState<Query, ResultWrap>

  
  queryId: string

  perfTime?: number
  

  constructor(
    private readonly manager: DatabaseQueryManager<Schema>,
    options: DbQueryOptions<Query, Schema>,
    private readonly defaultValue: any,
    private readonly resultPicker: (result: QueryResult<unknown>) => unknown
  ) {
    this.queryId = Math.random().toString(36).slice(2)

    this.options = this.defaultOptions(options)
    this.queryState = {
      data: defaultValue,
      status: 'idle',
      hasLoaded: false,
      isQueued: false,
    }

    this.updateResult()
  }

  defaultOptions(options: DbQueryOptions<Query, Schema>) {
    return { enabled: true, ...options }
  }

  setOptions(options: DbQueryOptions<Query, Schema>) {
    const previousOptions = this.options
    this.options = this.defaultOptions(options)

    // I don't think it works for query fn
    if (!arraysShallowEqual(this.options.keys, previousOptions.keys)) {
      this.optionallyExecuteQuery()
    }

  }

  updateResult() {
    const nextResult = this.createResult()

    if (shallowEqualObjects(nextResult, this.currentResult)) return;

    this.currentResult = nextResult

    this.notifyListeners()
  }

  createResult() {
    let data: Wrapper<Query, ResultWrap> = undefined!

    if (this.queryState.hasLoaded) {
      data = this.queryState.data
    }
    
    if (data === undefined && this.options?.policy !== 'compute-only') {
      const compiledQuery = this.getCompiledQuery()
      const jsonKeyBindings = JSON.stringify(this.options.keys)
      const cacheId = `${compiledQuery.sql}:${jsonKeyBindings}`

      if (this.manager.queryCache.has(cacheId)) {
        data = this.manager.queryCache.get(cacheId)
      }
    }

    if (data === undefined) {
      data = this.defaultValue
    }

    const isFetching = this.queryState.status === 'fetching'
    const isLoading = isFetching && !this.queryState.hasLoaded

    return {
      isSuccess: this.queryState.hasLoaded,
      isLoading,
      isFetching,
      data,
    }
  }

  getCompiledQuery() {
    const node = this.options.query(this.manager.db).toOperationNode()
    const executor = this.manager.db.getExecutor()
    const compiledQuery = executor.compileQuery(executor.transformQuery(node, { queryId: this.queryId }), { queryId: this.queryId })
    return compiledQuery
  }

  optionallyExecuteQuery() {
    if (this.options.enabled) {
      this.executeQuery()
    }
  }

  executeQuery() {
    if (this.queryState.status === 'fetching') {
      if (!this.queryState.isQueued) {
        this.queryState.isQueued = true
      }

      console.log('throttled query query', this.queryId)
      // exit out
      return;
    }

    console.log("EXECUTING QUERY!", this.queryId, this.options.query)
    const t1 = performance.now()
    const queryId = { queryId: Math.random().toString(36).slice(2) }
    const node = this.options.query(this.manager.db).toOperationNode()
    const tables = getUsedTables(node)
    const previousTables = this.usedTables
    this.usedTables = tables

    if (!arraysShallowEqual(tables, previousTables)) {
      this.dbSubscribeChanges()
    }

    
    const executor = this.manager.db.getExecutor()

    const compiledQuery = executor.compileQuery(executor.transformQuery(node, queryId), queryId)

    const sql = compiledQuery.sql

    const jsonKeyBindings = JSON.stringify(this.options.keys)

    const cacheId = `${sql}:${jsonKeyBindings}`

  
    this.queryState.status = 'fetching'


    // need to do query queueing, abort new queries if one is being fetched..ca
    this.manager.db.executeQuery<Query>(compiledQuery, queryId).then((data) => {
      const result = this.resultPicker(data)
      this.manager.queryCache.set(cacheId, result)

      const resultData = result as Wrapper<Query, ResultWrap>
      this.queryState.status = 'success'
      this.queryState.data = resultData
      if (!this.queryState.hasLoaded) {
        this.queryState.hasLoaded = true
      }

      const t2 = performance.now()

      console.log(t2 - t1, ':: time to load', this.queryId)

      this.updateResult()

      if (this.queryState.isQueued) {
        this.queryState.isQueued = false
        this.executeQuery()
      }
    })
    
  }

  subscribe(reactSubscribeListener: () => void) {
    this.reactSubscribeListener = reactSubscribeListener

    this.updateResult()
    this.optionallyExecuteQuery()

    // in case tables we're same as before
    this.dbSubscribeChanges()
  }

  dbSubscribeChanges() {
    if (this.dbListenerDispose) {
      this.dbListenerDispose()
      this.dbListenerDispose = undefined
    }

    if (this.options?.reactiveRowId !== undefined && this.options.reactiveTableName) {
      this.dbListenerDispose = this.manager.rx.onPoint(this.options.reactiveTableName as string, this.options.reactiveRowId, () => {
        this.optionallyExecuteQuery()
      })
    } else if (this.usedTables.length) {
      this.dbListenerDispose = this.manager.rx.onRange(this.usedTables, () => {
        console.log('UPDATING:: ', this.options.query)
        this.optionallyExecuteQuery()
      })
    }
  }

  notifyListeners() {
    if (this.reactSubscribeListener) {
      this.reactSubscribeListener()
    }
  }


  getResult = () => {
    return this.currentResult
  }

  unsubscribe = () => {
    if (this.dbListenerDispose) {
      this.dbListenerDispose()
      this.dbListenerDispose = undefined
    }
  }
}

function createDbQueryHooks<Schema>(context: React.Context<DatabaseQueryManager<Schema>>) {

  function dbQueryFactory<T extends [] | null>(
    resultPicker: (result: QueryResult<unknown>) => unknown,
    defaultValue: any
  ) {
    return <Query, >(options: DbQueryOptions<Query, Schema>) => {
      const queryManager = useContext(context)
      const [observer] = useState(() => new DbQueryObserver<Schema, Query, T>(queryManager, options, defaultValue, resultPicker))

      const result = useSyncExternalStore(React.useCallback((listener) => {

        observer.subscribe(listener)

        // observer.updateResult()

        return observer.unsubscribe
      }, [observer]), 
        () => observer.getResult()
      )

      useEffect(() => {
        observer.setOptions(options)
      }, [options, observer])      

      return result
    }

  }

  const useTakeFirstDbQuery = dbQueryFactory<null>((result) => {
    if (result.rows.length) {
      return result.rows[0]
    }
    return null
  }, null)

  const useDbQuery = dbQueryFactory<[]>((result) => {
    if (result.rows.length) {
      return result.rows
    }
    return []
  }, [])


  return { useDbQuery, useTakeFirstDbQuery }

}

type QueryManagerProviderProps = {
  children?: React.ReactNode;
};

export function queryManagerFactory<Schema>() {

  const queryManager = new DatabaseQueryManager<Schema>()
  const queryManagerContext = createContext<DatabaseQueryManager<Schema>>(null)

  const QueryManagerProvider: React.FC<QueryManagerProviderProps> = ({ children }) => {
    return (
      <queryManagerContext.Provider value={queryManager}>
        {children}
      </queryManagerContext.Provider>
    )
  }

  const useQueryManager = () => useContext(queryManagerContext)

  const { useDbQuery, useTakeFirstDbQuery } = createDbQueryHooks<Schema>(queryManagerContext)


  return {
    queryManager,
    QueryManagerProvider,
    useQueryManager,
    useDbQuery,
    useTakeFirstDbQuery
  }
}