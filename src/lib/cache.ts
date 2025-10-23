// src/lib/cache.ts
// Simple in-memory cache for server-side data
// In production, you might want to use Redis or another caching solution

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
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

  // Get cache size for monitoring
  size(): number {
    return this.cache.size;
  }
}

export const cache = new MemoryCache();

// Cache key generators
export const cacheKeys = {
  userProfile: (userId: string) => `user_profile_${userId}`,
  userWorks: (userId: string, role: string, value?: string) => 
    `user_works_${userId}_${role}_${value || 'all'}`,
  progressLogs: (workId?: string) => 
    workId ? `progress_logs_${workId}` : 'progress_logs_all',
  allUsers: () => 'all_users',
  allProfiles: () => 'all_profiles',
};
