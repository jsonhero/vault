import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";
import wasmSqlite from "@vlcn.io/crsqlite-wasm";
import { Kysely } from 'kysely'
import { SerializePlugin } from 'kysely-plugin-serialize'

import { CRDialect } from "~/lib/observable-query";
import { DB } from '~/types/db'
import { queryManagerFactory } from "./lib/observable-query/use-query";

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

queryManager.onBuildKysely((db) => new Kysely<DB>({
  dialect: new CRDialect({ database: db }),
  plugins: [new SerializePlugin()],
}))