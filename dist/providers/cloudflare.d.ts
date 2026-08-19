/**
 * @quilt/ai — Cloudflare Workers AI provider
 * ============================================================================
 * Cloudflare Workers AI — runs on the edge, free tier available.
 *
 *   - @cf/meta/llama-3.3-70b-instruct-fp8-fast: best general purpose
 *   - @cf/meta/llama-3.1-8b-instruct: fast and small
 *   - @cf/mistral/mistral-7b-instruct-v0.1: classic
 *   - @cf/baai/bge-base-en-v1.5: embeddings (768d)
 *   - @cf/baai/bge-large-en-v1.5: embeddings (1024d)
 *   - @cf/stabilityai/stable-diffusion-xl-base-1.0: image gen
 *   - @cf/meta/m2m100-1.2b: translation (418 languages)
 *   - @cf/huggingface/distilbert-sst-2-int8: sentiment
 *   - @cf/openai/whisper: speech to text
 *   - @cf/llava-hf/llava-1.5-7b-hf: vision
 *
 * API: https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}
 * Auth: Bearer token
 * ============================================================================
 */
import type { AIProvider, AIConfig, ProviderResponse, ModelInfo } from "../types.js";
/** Cloudflare Workers AI provider. */
export declare class CloudflareProvider implements AIProvider {
    readonly name = "cloudflare";
    readonly models: Record<string, ModelInfo>;
    private accountId;
    constructor(accountId?: string);
    private endpoint;
    call(config: AIConfig, options: {
        apiKey: string;
        signal?: AbortSignal;
    }): Promise<ProviderResponse>;
    private llmCall;
    private embedCall;
    private imageCall;
    private translateCall;
    private sentimentCall;
    private visionCall;
}
//# sourceMappingURL=cloudflare.d.ts.map