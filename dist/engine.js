"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIEngine = void 0;
const zai_js_1 = require("./providers/zai.js");
const kimi_js_1 = require("./providers/kimi.js");
const deepseek_js_1 = require("./providers/deepseek.js");
const cloudflare_js_1 = require("./providers/cloudflare.js");
/** The AI Engine. */
class AIEngine {
    constructor(opts = {}) {
        this.providers = new Map();
        this.apiKeys = new Map();
        this.cache = new Map();
        this.totalCost = 0;
        this.totalTokens = { prompt: 0, completion: 0 };
        // Initialize the 4 built-in providers
        this.providers.set("zai", new zai_js_1.ZaiProvider());
        this.providers.set("kimi", new kimi_js_1.KimiProvider());
        this.providers.set("deepseek", new deepseek_js_1.DeepseekProvider());
        this.providers.set("cloudflare", new cloudflare_js_1.CloudflareProvider(opts.cloudflareAccountId));
        // Set API keys
        if (opts.zaiKey)
            this.apiKeys.set("zai", opts.zaiKey);
        if (opts.kimiKey)
            this.apiKeys.set("kimi", opts.kimiKey);
        if (opts.deepseekKey)
            this.apiKeys.set("deepseek", opts.deepseekKey);
        if (opts.cloudflareKey)
            this.apiKeys.set("cloudflare", opts.cloudflareKey);
    }
    /** Register a custom provider. */
    registerProvider(name, provider, apiKey) {
        this.providers.set(name, provider);
        if (apiKey)
            this.apiKeys.set(name, apiKey);
    }
    /** Set the API key for a provider. */
    setKey(provider, apiKey) {
        this.apiKeys.set(provider, apiKey);
    }
    /** Call an AI cell. Caches by config hash. */
    async call(config, opts = {}) {
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
                const cost = (response.usage.prompt_tokens / 1000) * (modelInfo.cost_per_1k_input || 0) +
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
    getCost() {
        return this.totalCost;
    }
    /** Get total tokens used. */
    getTokens() {
        return {
            ...this.totalTokens,
            total: this.totalTokens.prompt + this.totalTokens.completion,
        };
    }
    /** Get cache stats. */
    getCacheStats() {
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
    clearCache() {
        this.cache.clear();
    }
    /** Generate a cache key for a config. */
    cacheKey(config) {
        // Hash all relevant fields
        const key = JSON.stringify({
            k: config.kind,
            p: config.provider,
            m: config.model,
            // Include all input fields
            ...(config.prompt !== undefined && { prompt: config.prompt }),
            ...(config.input !== undefined && { input: config.input }),
            ...(config.system !== undefined && { system: config.system }),
            ...(config.target !== undefined && { target: config.target }),
            ...(config.image !== undefined && { image: config.image }),
            ...(config.language !== undefined && { language: config.language }),
            ...(config.max_words !== undefined && { max_words: config.max_words }),
            t: config.temperature,
        });
        return key;
    }
}
exports.AIEngine = AIEngine;
//# sourceMappingURL=engine.js.map