class CacheEntry<T> {
  value: T;
  expirationTime: number;

  constructor(value: T, ttlInSeconds = -1) {
    this.value = value;
    this.expirationTime = ttlInSeconds !== -1 ? Date.now() + ttlInSeconds * 1000 : -1;
  }

  isExpired(): boolean {
    if (this.expirationTime === -1) return false
    return Date.now() > this.expirationTime;
  }
}

export class InMemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();

  set(key: string, value: T, ttlInSeconds = -1): void {
    this.cache.set(key, new CacheEntry(value, ttlInSeconds))
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry && !entry.isExpired()) {
      return entry.value;
    } else {
      // Remove expired entry
      this.cache.delete(key);
      return undefined;
    }
  }

  has(key: string): boolean {
    return this.cache.has(key) && !this.cache.get(key)!.isExpired();
  }

  remove(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache = new Map();
  }
}
