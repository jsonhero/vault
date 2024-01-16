import { Kysely } from "kysely";
import  { DB } from "@vlcn.io/crsqlite-wasm";

import type { QueryFn } from './types'
import { InMemoryCache } from './in-memory-cache'
import { ObservableQuery, TakeFirstObservableQuery, ObserverQueryOptions } from './observable-query'

export class ObserverableQueryManager<K = any> {
  private wasmDB?: DB;
  private kyselyBuilder?: (db: DB) => Kysely<K>; 
  private kyselyDb?: Kysely<K>
  queryCache = new InMemoryCache<any>()

  applyDb(db: DB) {
    this.wasmDB = db
    if (this.kyselyBuilder) {
      this.kyselyDb = this.kyselyBuilder(this.wasmDB)
    }
   }

  buildKysely(fn: (db: DB) => Kysely<K>) {
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

  get db(): Kysely<K> {
    if (!this.kyselyDb) {
      throw new Error("Tried to access kysely db before initialization")
    }
    return this.kyselyDb
  }
  

  observableQuery <T, A extends any[]>(queryFn: QueryFn<T, A, K>, options?: ObserverQueryOptions<K>): ObservableQuery<T, A, K> {
    return new ObservableQuery(this, queryFn, options)
  }

  takeFirstObservableQuery <T, A extends any[]>(queryFn: QueryFn<T | null, A, K>, options?: ObserverQueryOptions<K>): TakeFirstObservableQuery<T, A, K> {
    return new TakeFirstObservableQuery(this, queryFn, options)
  }

}
