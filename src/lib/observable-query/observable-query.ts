import { 
  CompiledQuery,
} from "kysely";
import { observable, runInAction, makeObservable, onBecomeObserved, onBecomeUnobserved } from 'mobx'
import tblrx from "@vlcn.io/rx-tbl";
import _ from 'lodash'

import type { ObserverableQueryManager } from './observable-query-manager'
import { QueryId, QueryFn } from './types'
import { getUsedTables } from './utils'

export type ObserverQueryOptions<KyselySchema> = {
  policy?: 'compute-only' | 'cache-only' | 'cache-and-compute',
  autoLoad?: boolean
  reactiveRowId?: bigint
  reactiveTableName?: keyof KyselySchema
}

const defaultObserverOptions: ObserverQueryOptions<unknown> = {
  policy: 'cache-and-compute',
  autoLoad: false,
}

abstract class ObservableBaseQuery<T, A extends any[], K, R = T> {
  // api
  isLoading = true; // start in loading state
  isFetching = false;
  data: R;


  // hidden
  protected hasLoaded = false;
  protected isQuerying = false;
  protected activeQueries = new Set<string>()
  private tables: string[] = [];
  private id: QueryId;
  private disposer: (() => void) | null;
  private query?: CompiledQuery<T>;
  private queryParams: A | undefined
  private cacheId?: string
  private querySql?: string;

  constructor(
    initialData: R,
    protected readonly manager: ObserverableQueryManager<K>,
    private readonly queryFn: QueryFn<T, A, K>,
    readonly options: ObserverQueryOptions<K> = defaultObserverOptions,
  ) {
    this.data = initialData;
    this.disposer = null;
    this.id = { queryId: Math.random().toString(36).slice(2) }

    makeObservable(this, {
      data: observable,
      isLoading: observable,
      isFetching: observable,
    })
    onBecomeObserved(this, 'data', this.resume)
    onBecomeUnobserved(this, 'data', this.suspend)
    console.log("creating!")
  }

  private buildQuery(...args: A) {
    this.queryParams = args
    const node = this.queryFn(this.manager.db, ...args).toOperationNode()
    const tables = getUsedTables(node)
    const executor = this.manager.db.getExecutor()
    this.query = executor.compileQuery(executor.transformQuery(node, this.id), this.id)
    this.querySql = this.query.sql

    this.updateUsedTables(tables)
    return { query: this.query, queryId: this.id }
  }

  private updateUsedTables(tables: string[]) {
    if (!_.isEqual(tables, this.tables)) {
      this.tables = tables;
      // rebuild subscriber b/c tables changed
      this.rebuildSubscriber()
    }
  }

  buildCacheId(...args: A) {
    return `${this.querySql}:${JSON.stringify(args)}`
  }

  getQuery(...args: A) {
    if (this.query) {
      const cacheId = this.buildCacheId(...args)
      if (this.cacheId === cacheId) {
        return { query: this.query, queryId: this.id, cacheId: this.cacheId}
      }
    }

    const { query, queryId } = this.buildQuery(...args);
    this.cacheId = this.buildCacheId(...args)
    return { query, queryId, cacheId: this.cacheId }
  }

  private resume = () => {
    console.log('resuming')
    if (!this.disposer) {
      if (this.options.autoLoad) {

        console.log("AUTO LOADING!")
        this.autoFetch() // fetch with 0 params... maybe turn off autoFetch param when no props
      }
      this.subscribe()
    }

  }

  private autoFetch() {
    if (this.queryParams) {
      this.internalFetch(...this.queryParams as A)
    } else {
      this.internalFetch(...[] as unknown as A)
    }
  }

  private internalFetch(...args: A) {
    const { query, queryId, cacheId } = this.getQuery(...args)

    if (this.options.policy !== 'compute-only' && this.manager.queryCache.has(cacheId)) {
      const cachedValue = this.manager.queryCache.get(cacheId)
      if (cachedValue !== this.data) {
        runInAction(() => {
          this.data = cachedValue
        })
      }
    }

    // support query canceling once this passes: https://github.com/kysely-org/kysely/issues/783
    // should cancel all previous active queries and not cause data updates for cancelled
    if (this.options.policy !== 'cache-only' && !this.activeQueries.has(cacheId)) {
      this.activeQueries.add(cacheId)
      runInAction(() => {
        if (!this.hasLoaded) {
          this.isLoading = true
        }
        this.isFetching = true
      })

      this.customFetch(query!, queryId).then((value) => {
        this.manager.queryCache.set(cacheId, value)
        this.activeQueries.delete(cacheId)
        runInAction(() => {
          if (!this.hasLoaded) {
            this.hasLoaded = true
            this.isLoading = false
          }
          this.isFetching = false
          this.data = value as unknown as R
        })
      })
    }
  }

  private suspend = () => {
    console.log('suspending')
    if (this.disposer) this.disposer();
  }

  public dispose = () => {
    this.suspend()
  }

  abstract customFetch(query: CompiledQuery<T>, queryId: QueryId): Promise<R>;

  public updateFetchParams(...args: A) {
    this.internalFetch(...args)
  }

  private rebuildSubscriber() {
    const previousDisposer = this.disposer
    // only rebuild if currently subscribed
    if (previousDisposer) {
      this.subscribe()
      previousDisposer()
    }
  }

  private subscribe() {
    const rx = tblrx(this.manager.wasmDb);

    if (this.options.reactiveRowId !== undefined && this.options.reactiveTableName !== undefined) {
      this.disposer = rx.onPoint(this.options.reactiveTableName.toString(), this.options.reactiveRowId, () => {
        this.autoFetch()
      })
    } else {
      this.disposer = rx.onRange(this.tables, () => {
        this.autoFetch()
      })
    }

  }
}

export class ObservableQuery<T, A extends any[], K, R = T[]> extends ObservableBaseQuery<T, A, K, R> {

  constructor(
    manager: ObserverableQueryManager<K>,
    queryFn: QueryFn<T, A, K>,
    options: ObserverQueryOptions<K> = defaultObserverOptions,
  ) {
    super([] as R, manager, queryFn, options);
  }

  customFetch(query: CompiledQuery<T>, queryId: QueryId) {
    return this.manager.db.executeQuery<T>(query, queryId).then((results) => {
      return results.rows as R
    })
  }
}

export class TakeFirstObservableQuery<T, A extends any[], K> extends ObservableBaseQuery<T | null, A, K> {
  constructor(
    manager: ObserverableQueryManager<K>,
    queryFn: QueryFn<T | null, A, K>,
    options: ObserverQueryOptions<K> = defaultObserverOptions,
  ) {
    super(null, manager, queryFn, options);
  }

  customFetch(query: CompiledQuery<T>, queryId: QueryId) {
    return this.manager.db.executeQuery<T>(query, queryId).then((results) => {
      if (results.rows.length) {
        return results.rows[0]
      }
      return null
    })
  }
}
