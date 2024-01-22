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



export type DbQueryOptions<Schema> = {
  policy?: 'compute-only' | 'cache-only' | 'cache-and-compute',
  reactiveRowId?: bigint
  reactiveTableName?: keyof Schema
}

export type QueryFn<Query, Schema> = (db: Kysely<Schema>) => SelectQueryBuilder<Kysely<Schema>, any, Query>

export type DbQueryHookParams<Query, Schema> = {
  query: QueryFn<Query, Schema>,
  keys?: unknown[],
  options?: DbQueryOptions<Schema>
  policy?: 'compute-only' | 'cache-only' | 'cache-and-compute',
  reactiveRowId?: bigint
  reactiveTableName?: keyof Schema
}

type Wrapper<T, Switch extends [] | null> = Switch extends [] ? T[] : T | null

type QueryObserverResult<Query, ResultWrap extends [] | null>  = {
  isLoading: boolean;
  isFetching: boolean;
  data: Wrapper<Query, ResultWrap>
}

type QueryState<Query, ResultWrap extends [] | null> = {
  data: Wrapper<Query, ResultWrap>
  hasLoaded: boolean,
  status: 'success' | 'fetching' | 'idle'
}

class DbQueryObserver<Schema, Query, ResultWrap extends [] | null> {
  
  reactSubscribeListener?: () => void;
  options;
  usedTables: string[] = []
  dbListenerDispose?: () => void;

  currentResult: QueryObserverResult<Query, ResultWrap> = undefined!
  queryState: QueryState<Query, ResultWrap> 
  
  queryId: string

  constructor(
    private readonly manager: DatabaseQueryManager<Schema>,
    options: DbQueryHookParams<Query, Schema>,
    private readonly defaultValue: any,
    private readonly resultPicker: (result: QueryResult<unknown>) => unknown
  ) {
    this.queryId = Math.random().toString(36).slice(2)

    this.options = options
    this.queryState = {
      data: defaultValue,
      status: 'idle',
      hasLoaded: false,
    }

    this.updateResult()
  }

  setOptions(options: DbQueryHookParams<Query, Schema>) {
    const previousOptions = this.options
    this.options = options

    // I don't think it works for query fn
    if (!shallowEqualObjects(this.options.keys, previousOptions.keys)) {
      this.executeQuery()
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

    if (this.queryState.status === 'success') {
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

  executeQuery() {
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

    this.manager.db.executeQuery<Query>(compiledQuery, queryId).then((data) => {
      const result = this.resultPicker(data)
      this.manager.queryCache.set(cacheId, result)

      const resultData = result as Wrapper<Query, ResultWrap>
      this.queryState.status = 'success'
      this.queryState.data = resultData
      if (!this.queryState.hasLoaded) {
        this.queryState.hasLoaded = true
      }

      this.updateResult()
    })
  }

  subscribe(reactSubscribeListener: () => void) {
    this.reactSubscribeListener = reactSubscribeListener

    this.updateResult()
    this.executeQuery()

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
        this.executeQuery()
      })
    } else if (this.usedTables.length) {
      this.dbListenerDispose = this.manager.rx.onRange(this.usedTables, () => {
        this.executeQuery()
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
    return <Query, >(params: DbQueryHookParams<Query, Schema>) => {
      const queryManager = useContext(context)
      const [observer] = useState(() => new DbQueryObserver<Schema, Query, T>(queryManager, params, defaultValue, resultPicker))

      const result = useSyncExternalStore(React.useCallback((listener) => {
        observer.subscribe(listener)

        // observer.updateResult()

        return observer.unsubscribe
      }, [observer]), 
        () => observer.getResult()
      )

      useEffect(() => {
        observer.setOptions(params)
      }, [params, observer])      

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