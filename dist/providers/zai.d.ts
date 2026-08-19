/**
 * @quilt/ai — z.ai provider
 * ============================================================================
 * z.ai (Zhipu AI) — GLM models.
 *
 *   - glm-4.5: best general purpose, native chain-of-thought
 *   - glm-4.5-airx: faster, smaller, similar quality
 *   - glm-4-flash: free, very fast
 *   - glm-4-9b: open weights, self-hostable
 *
 * API: https://api.z.ai/api/paas/v4/chat/completions
 * Auth: Bearer token
 * CORS: enabled (browser can call directly)
 * ============================================================================
 */
import type { AIProvider, AIConfig, ProviderResponse, ModelInfo } from "../types.js";
/**
 * z.ai provider implementation.
 *
 * To use:
 *   const provider = new ZaiProvider();
 *   const response = await provider.call(config, { apiKey: process.env.ZAI_TOKEN });
 */
export declare class ZaiProvider implements AIProvider {
    readonly name = "zai";
    readonly models: Record<string, ModelInfo>;
    private endpoint;
    /**
     * Call z.ai with the given config.
     *
     * Handles all 8 cell kinds:
     *   - ai.llm, ai.code, ai.summarize, ai.vision, ai.translate → chat completion
     *   - ai.embed → uses embedding model
     *   - ai.image → not supported on z.ai (throws)
     *   - ai.sentiment → uses chat completion with structured prompt
     */
    call(config: AIConfig, options: {
        apiKey: string;
        signal?: AbortSignal;
    }): Promise<ProviderResponse>;
    /** Internal: chat completion. */
    private chatCompletion;
    /** Internal: translation. */
    private translate;
    /** Internal: sentiment. */
    private sentiment;
    /** Internal: embedding. */
    private embed;
}
//# sourceMappingURL=zai.d.ts.map