// src/lib/cache.ts

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

import { CACHE } from './constants';

class MemoryCache {
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, CacheItem<unknown>>();

  private cleanupInterval = setInterval(() => {
    this.cleanup();
  }, 60 * 1000); // Cleanup every minute

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  set<T>(key: string, data: T, ttl = MemoryCache.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

export const cache = new MemoryCache();
