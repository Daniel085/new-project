/**
 * Simple in-memory cache for API responses
 * Reduces redundant API calls and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number; // Time to live in milliseconds

  constructor(ttlMinutes: number = 60) {
    this.defaultTTL = ttlMinutes * 60 * 1000;
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(prefix: string, params: Record<string, any>): T | null {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache entry has expired
    if (age > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    console.log(`Cache HIT: ${key} (age: ${Math.round(age / 1000)}s)`);
    return entry.data;
  }

  /**
   * Store data in cache
   */
  set<T>(prefix: string, params: Record<string, any>, data: T): void {
    const key = this.generateKey(prefix, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    console.log(`Cache SET: ${key}`);
  }

  /**
   * Check if cached data exists and is valid
   */
  has(prefix: string, params: Record<string, any>): boolean {
    return this.get(prefix, params) !== null;
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  /**
   * Clear expired entries (cleanup)
   */
  clearExpired(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`Cleared ${cleared} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance with 60-minute TTL
export const recipeCache = new Cache(60);

// Periodically clean up expired entries (every 10 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    recipeCache.clearExpired();
  }, 10 * 60 * 1000);
}