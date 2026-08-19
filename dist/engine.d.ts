/**
 * @quilt/ai — AI Engine
 * ============================================================================
 * The main AI Engine — manages all 4 providers, handles caching, routing,
 * fallback, and cost tracking.
 *
 * The engine is independent of @quilt/core. It can be used standalone
 * (just pass it a cell config) or wired into a Quilt sheet (where AI cells
 * are evaluated as part of the reactive graph).
 * ============================================================================
 */
import type { AIConfig, AIProvider, AIResult } from "./types.js";
/** The AI Engine. */
export declare class AIEngine {
    private providers;
    private apiKeys;
    private cache;
    private totalCost;
    private totalTokens;
    constructor(opts?: {
        zaiKey?: string;
        kimiKey?: string;
        deepseekKey?: string;
        cloudflareKey?: string;
        cloudflareAccountId?: string;
    });
    /** Register a custom provider. */
    registerProvider(name: string, provider: AIProvider, apiKey?: string): void;
    /** Set the API key for a provider. */
    setKey(provider: string, apiKey: string): void;
    /** Call an AI cell. Caches by config hash. */
    call(config: AIConfig, opts?: {
        useCache?: boolean;
        signal?: AbortSignal;
    }): Promise<AIResult>;
    /** Get total cost spent (USD). */
    getCost(): number;
    /** Get total tokens used. */
    getTokens(): {
        prompt: number;
        completion: number;
        total: number;
    };
    /** Get cache stats. */
    getCacheStats(): {
        size: number;
        hits: number;
        misses: number;
    };
    /** Clear the cache. */
    clearCache(): void;
    /** Generate a cache key for a config. */
    private cacheKey;
}
//# sourceMappingURL=engine.d.ts.map