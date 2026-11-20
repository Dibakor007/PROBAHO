/**
 * In-Memory TTL Cache with Stale Fallback & Timestamps
 * Ensures resilient external API integrations without crashing if third-party services timeout.
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set cache entry
   * @param {string} key 
   * @param {*} value 
   * @param {number} ttlMs Default 1 hour
   * @param {string} source External source name
   */
  set(key, value, ttlMs = 3600000, source = 'External API') {
    const expiresAt = Date.now() + ttlMs;
    const timestamp = new Date().toISOString();
    this.cache.set(key, {
      value,
      expiresAt,
      timestamp,
      ttlMs,
      source
    });
  }

  /**
   * Get cache entry
   * @param {string} key 
   * @returns {{ data: *, isCached: boolean, isStale: boolean, timestamp: string } | null}
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isStale = Date.now() > entry.expiresAt;
    return {
      data: entry.value,
      isCached: true,
      isStale,
      timestamp: entry.timestamp,
      source: entry.source
    };
  }

  /**
   * Wrap an async fetch function with caching and fallback
   * @param {string} key 
   * @param {Function} fetchFn Async function returning fresh data
   * @param {number} ttlMs TTL in milliseconds
   * @param {string} source Source name
   * @param {*} fallbackData Optional static fallback if both fetch & cache fail
   */
  async getOrFetch(key, fetchFn, ttlMs = 3600000, source = 'External API', fallbackData = null) {
    const cached = this.get(key);
    if (cached && !cached.isStale) {
      return {
        ...cached,
        cacheStatus: 'HIT'
      };
    }

    try {
      const freshData = await fetchFn();
      this.set(key, freshData, ttlMs, source);
      return {
        data: freshData,
        isCached: false,
        isStale: false,
        timestamp: new Date().toISOString(),
        source,
        cacheStatus: 'MISS'
      };
    } catch (err) {
      console.warn(`[Cache Warning] Failed to fetch fresh data for '${key}': ${err.message}`);
      
      // If we have stale cached data, return it
      if (cached) {
        return {
          data: cached.data,
          isCached: true,
          isStale: true,
          timestamp: cached.timestamp,
          source: cached.source,
          cacheStatus: 'STALE_FALLBACK',
          warning: `Using cached data from ${cached.timestamp} due to network timeout: ${err.message}`
        };
      }

      // If fallback data was provided, return it
      if (fallbackData !== null) {
        return {
          data: fallbackData,
          isCached: false,
          isStale: true,
          timestamp: new Date().toISOString(),
          source: `${source} (Offline Fallback)`,
          cacheStatus: 'FALLBACK',
          warning: `External service unavailable: ${err.message}`
        };
      }

      throw err;
    }
  }

  clear() {
    this.cache.clear();
  }
}

export const externalCache = new MemoryCache();
export default externalCache;

