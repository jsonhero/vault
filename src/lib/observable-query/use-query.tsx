import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Kysely, QueryResult, SelectQueryBuilder } from "kysely";
import  { DB } from "@vlcn.io/crsqlite-wasm";
import tblrx from "@vlcn.io/rx-tbl";

import { InMemoryCache } from './in-memory-cache'
import { getUsedTables } from './utils';

export class DatabaseQueryManager<Schema> {
  private wasmDB?: DB;
  private kyselyBuilder?: (db: DB) => Kysely<Schema>; 
  private kyselyDb?: Kysely<Schema>
  queryCache = new InMemoryCache<any>()

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
}

type Wrapper<T, Switch extends [] | null> = Switch extends [] ? T[] : T | null

function createDbQueryHooks<Schema>(context: React.Context<DatabaseQueryManager<Schema>>) {

  function dbQueryFactory<T extends [] | null>(
    resultPicker: (result: QueryResult<unknown>) => unknown,
    defaultValue: any
  ) {
    return <Query, >(params: DbQueryHookParams<Query, Schema>) => {
      const [data, setData] = useState<Wrapper<Query, T>>(defaultValue)
      const [isLoading, setIsLoading] = useState(false)
      const [hasLoaded, setHasLoaded] = useState(false)
      const [isFetching, setIsFetching] = useState(false)
      const [usedTables, setUsedTables] = useState<string[]>([])
      const disposerRef = useRef<(() => void) | null>(null)
  
      const queryManager = useContext(context)

      const jsonKeys = JSON.stringify(params.keys)
  
      const runQuery = useCallback(() => {
        const queryId = { queryId: Math.random().toString(36).slice(2) }
        const node = params.query(queryManager.db).toOperationNode()
        const tables = getUsedTables(node)
  
        setUsedTables(tables)
        const executor = queryManager.db.getExecutor()
  
        const compiledQuery = executor.compileQuery(executor.transformQuery(node, queryId), queryId)
  
        const sql = compiledQuery.sql
  
        const cacheId = `${sql}:${jsonKeys}`

        console.log(cacheId, ':: updating')
  
        if (params.options?.policy !== 'compute-only' && queryManager.queryCache.has(cacheId)) {
          const cachedValue = queryManager.queryCache.get(cacheId)
          setData(cachedValue)
        }
        
  
        if (params.options?.policy !== 'cache-only') {
          if (!hasLoaded) {
            setIsLoading(true)
          }
          setIsFetching(true)
          queryManager.db.executeQuery<Query>(compiledQuery, queryId).then((data) => {
            const result = resultPicker(data)
            queryManager.queryCache.set(cacheId, result)
            setData(result as Wrapper<Query, T>)
            
            setIsFetching(false)
            if (!hasLoaded) {
              setHasLoaded(true)
              setIsLoading(false)
            }
          })
        }
      }, [jsonKeys, params.options])
  
  
      useEffect(() => {
        const rx = tblrx(queryManager.wasmDb);
  
        // dispose old listener 
        if (disposerRef.current) {
          disposerRef.current()
        }
        
        if (params.options?.reactiveRowId !== undefined && params.options.reactiveTableName) {
          disposerRef.current = rx.onPoint(params.options.reactiveTableName as string, params.options.reactiveRowId, () => {
            runQuery()
          })
        } else if (usedTables.length) {
          disposerRef.current = rx.onRange(usedTables, () => {
            runQuery()
          })
        }

        return () => {
          if (disposerRef.current) {
            disposerRef.current()
          }
        }
      }, [usedTables, runQuery, params.options?.reactiveRowId, params.options?.reactiveTableName])
  
      useEffect(() => {
        runQuery()
      }, [runQuery])
  
      return {
        data,
        isLoading,
        isFetching,
      }

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