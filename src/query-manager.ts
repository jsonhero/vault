import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";
import wasmSqlite from "@vlcn.io/crsqlite-wasm";
import { Kysely } from 'kysely'
import { SerializePlugin, Deserializer } from 'kysely-plugin-serialize'

import { CRDialect } from "~/lib/observable-query";
import { DB } from '~/types/db'
import { queryManagerFactory, DatabaseQueryManager } from "./lib/observable-query/use-query";

export async function loadWasmDatabase(file: string) {
  const sqlite = await wasmSqlite(() => wasmUrl);
  const database = await sqlite.open(file);
  return database
}

export const {
  QueryManagerProvider,
  queryManager,
  useDbQuery,
  useQueryManager,
  useTakeFirstDbQuery,
} = queryManagerFactory<DB>()

export type QueryManager = DatabaseQueryManager<DB>


export const defaultDeserializer: Deserializer = (parameter) => {
  if (skipTransform(parameter)) {
    return parameter
  }
  if (typeof parameter === 'string') {
    if (/^(true|false)$/.test(parameter)) {
      return parameter === 'true'
    } else {
      try {
        // default deserializer from this plugin was super slow since it tried to JSON parse EVERY string, not just things that looked like objects.
        // may need to handle array parsing here... but I think an array would should be on anested object.
        if (parameter.startsWith('{') && parameter.endsWith('}')) {
          return JSON.parse(parameter)
        }
        return parameter
      } catch (e) {
        return parameter
      }
    }
  }
}

function skipTransform(parameter: unknown) {
  return parameter === undefined
    || parameter === null
    || typeof parameter === 'bigint'
    || typeof parameter === 'number'
    || (typeof parameter === 'object' && 'buffer' in parameter)
}

queryManager.onBuildKysely((db) => new Kysely<DB>({
  dialect: new CRDialect({ database: db }),
  plugins: [new SerializePlugin({
    deserializer: defaultDeserializer
  })],
}))