import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";
import wasmSqlite from "@vlcn.io/crsqlite-wasm";
import { Kysely, JSONColumnType, Generated, ColumnType } from 'kysely'
import { createContext, useContext, useEffect, useState } from 'react'
import { SerializePlugin } from 'kysely-plugin-serialize'

import { ObserverableQueryManager, CRDialect } from "~/lib/observable-query";
import { QueryFn } from '~/lib/observable-query/types'
import { ObserverQueryOptions } from '~/lib/observable-query/observable-query'
import { Entity } from '~/types/db-types'

export async function loadWasmDatabase(file: string) {
  const sqlite = await wasmSqlite(() => wasmUrl);
  const database = await sqlite.open(file);
  return database
}

interface DB {
  entity: {
    id: Generated<number>;
    title: string;
    type: 'table' | 'document' | 'table_record';
    data_schema_id: number;
    data: {
      values: {
        [key: string]: string
      }
    } | null;
    updated_at: ColumnType<Date, string | undefined, never>;
    created_at: ColumnType<Date, string | undefined, never>;
  }
}
export type QueryManager = ObserverableQueryManager<DB>
export const queryManager = new ObserverableQueryManager<DB>()
queryManager.buildKysely((db) => new Kysely<DB>({
  dialect: new CRDialect({ database: db }),
  plugins: [new SerializePlugin()],
}))

export const queryManagerContext = createContext<QueryManager>(null)

export const useObservableQuery = <T, A extends any[]>(
  queryFn: QueryFn<T, A, DB>,
  options?: ObserverQueryOptions<DB>,
) => {
  const manager = useContext(queryManagerContext)

  const [query] = useState(() => manager.observableQuery(queryFn, options))
  
  useEffect(() => {
    return () => {
      console.log('unmount beitych')
      query.dispose()
    }
  })

  return query
}