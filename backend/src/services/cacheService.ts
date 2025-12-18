import crypto from 'crypto';

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
    hits: number;
}

interface CacheStats {
    totalEntries: number;
    memoryUsage: string;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
}

class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private hits = 0;
    private misses = 0;
    private maxEntries: number;
    private defaultTtl: number;

    constructor(maxEntries = 1000, defaultTtlSeconds = 3600) {
        this.maxEntries = maxEntries;
        this.defaultTtl = defaultTtlSeconds * 1000;

        // Clean expired entries every 5 minutes
        setInterval(() => this.cleanup(), 300000);
    }

    /**
     * Generate a hash key for caching based on code content and language
     */
    generateKey(code: string, language: string, additionalContext?: string): string {
        const content = `${language}:${code}:${additionalContext || ''}`;
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Get cached value if exists and not expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        entry.hits++;
        this.hits++;
        return entry.data as T;
    }

    /**
     * Store value in cache with optional TTL
     */
    set<T>(key: string, data: T, ttlSeconds?: number): void {
        // Evict oldest entries if at capacity
        if (this.cache.size >= this.maxEntries) {
            this.evictOldest();
        }

        const ttl = (ttlSeconds || this.defaultTtl / 1000) * 1000;
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttl,
            hits: 0
        });
    }

    /**
     * Check if key exists in cache
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Delete specific key
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const totalRequests = this.hits + this.misses;
        return {
            totalEntries: this.cache.size,
            memoryUsage: this.estimateMemoryUsage(),
            hitRate: totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0,
            totalHits: this.hits,
            totalMisses: this.misses
        };
    }

    /**
     * Remove expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Evict least recently used entry
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let lowestHits = Infinity;

        for (const [key, entry] of this.cache) {
            if (entry.hits < lowestHits) {
                lowestHits = entry.hits;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Estimate memory usage of cache
     */
    private estimateMemoryUsage(): string {
        let bytes = 0;
        for (const [key, entry] of this.cache) {
            bytes += key.length * 2; // UTF-16 string
            bytes += JSON.stringify(entry.data).length * 2;
            bytes += 24; // Overhead for entry object
        }

        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
}

// Singleton instance for AI response caching
export const aiCache = new CacheService(500, 7200); // 500 entries, 2 hour TTL

// Generic cache for other uses
export const generalCache = new CacheService(1000, 3600); // 1000 entries, 1 hour TTL

// Export class for custom instances
export { CacheService };

export default {
    aiCache,
    generalCache,
    CacheService
};
