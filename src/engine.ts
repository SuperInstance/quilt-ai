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

import type {
  AIConfig,
  AIProvider,
  AIResult,
  ProviderResponse,
  Provider,
} from "./types.js";
import { AIError } from "./types.js";
import { ZaiProvider } from "./providers/zai.js";
import { KimiProvider } from "./providers/kimi.js";
import { DeepseekProvider } from "./providers/deepseek.js";
import { CloudflareProvider } from "./providers/cloudflare.js";

/** Cache entry. */
interface CacheEntry {
  result: AIResult;
  response: ProviderResponse;
  ts: number;
  hits: number;
}

/** The AI Engine. */
export class AIEngine {
  private providers: Map<string, AIProvider> = new Map();
  private apiKeys: Map<string, string> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private totalCost: number = 0;
  private totalTokens: { prompt: number; completion: number } = { prompt: 0, completion: 0 };

  constructor(opts: {
    zaiKey?: string;
    kimiKey?: string;
    deepseekKey?: string;
    cloudflareKey?: string;
    cloudflareAccountId?: string;
  } = {}) {
    // Initialize the 4 built-in providers
    this.providers.set("zai", new ZaiProvider());
    this.providers.set("kimi", new KimiProvider());
    this.providers.set("deepseek", new DeepseekProvider());
    this.providers.set("cloudflare", new CloudflareProvider(opts.cloudflareAccountId));

    // Set API keys
    if (opts.zaiKey) this.apiKeys.set("zai", opts.zaiKey);
    if (opts.kimiKey) this.apiKeys.set("kimi", opts.kimiKey);
    if (opts.deepseekKey) this.apiKeys.set("deepseek", opts.deepseekKey);
    if (opts.cloudflareKey) this.apiKeys.set("cloudflare", opts.cloudflareKey);
  }

  /** Register a custom provider. */
  registerProvider(name: string, provider: AIProvider, apiKey?: string): void {
    this.providers.set(name, provider);
    if (apiKey) this.apiKeys.set(name, apiKey);
  }

  /** Set the API key for a provider. */
  setKey(provider: string, apiKey: string): void {
    this.apiKeys.set(provider, apiKey);
  }

  /** Call an AI cell. Caches by config hash. */
  async call(config: AIConfig, opts: { useCache?: boolean; signal?: AbortSignal } = {}): Promise<AIResult> {
    const { useCache = true, signal } = opts;
    const cacheKey = this.cacheKey(config);

    // Check cache
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        cached.hits++;
        return cached.result;
      }
    }

    // Find the provider
    const provider = this.providers.get(config.provider);
    if (!provider) {
      throw new Error(`Unknown provider: ${config.provider}`);
    }
    const apiKey = this.apiKeys.get(config.provider);
    if (!apiKey) {
      throw new Error(`No API key for provider: ${config.provider}. Call setKey() first.`);
    }

    // Make the call
    const response = await provider.call(config, { apiKey, signal });

    // Update cost tracking
    if (response.usage) {
      this.totalTokens.prompt += response.usage.prompt_tokens;
      this.totalTokens.completion += response.usage.completion_tokens;
      const modelInfo = provider.models[config.model];
      if (modelInfo) {
        const cost =
          (response.usage.prompt_tokens / 1000) * (modelInfo.cost_per_1k_input || 0) +
          (response.usage.completion_tokens / 1000) * (modelInfo.cost_per_1k_output || 0);
        this.totalCost += cost;
      }
    }

    // Cache the result
    if (useCache) {
      this.cache.set(cacheKey, {
        result: response.result,
        response,
        ts: Date.now(),
        hits: 0,
      });
    }

    return response.result;
  }

  /** Get total cost spent (USD). */
  getCost(): number {
    return this.totalCost;
  }

  /** Get total tokens used. */
  getTokens(): { prompt: number; completion: number; total: number } {
    return {
      ...this.totalTokens,
      total: this.totalTokens.prompt + this.totalTokens.completion,
    };
  }

  /** Get cache stats. */
  getCacheStats(): { size: number; hits: number; misses: number } {
    let hits = 0;
    for (const entry of this.cache.values()) {
      hits += entry.hits;
    }
    return {
      size: this.cache.size,
      hits,
      misses: this.cache.size, // approximation
    };
  }

  /** Clear the cache. */
  clearCache(): void {
    this.cache.clear();
  }

  /** Generate a cache key for a config. */
  private cacheKey(config: AIConfig): string {
    // Hash all relevant fields
    const key = JSON.stringify({
      k: config.kind,
      p: config.provider,
      m: config.model,
      // Include all input fields
      ...((config as any).prompt !== undefined && { prompt: (config as any).prompt }),
      ...((config as any).input !== undefined && { input: (config as any).input }),
      ...((config as any).system !== undefined && { system: (config as any).system }),
      ...((config as any).target !== undefined && { target: (config as any).target }),
      ...((config as any).image !== undefined && { image: (config as any).image }),
      ...((config as any).language !== undefined && { language: (config as any).language }),
      ...((config as any).max_words !== undefined && { max_words: (config as any).max_words }),
      t: config.temperature,
    });
    return key;
  }
}
