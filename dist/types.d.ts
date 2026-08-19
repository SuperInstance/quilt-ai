/**
 * @quilt/ai — types
 * ============================================================================
 * The type definitions for AI cells in Quilt.
 *
 * Every AI interaction in Quilt is a cell. A cell has:
 *   - `kind` — one of the 8 AI cell kinds
 *   - `provider` — which backend (zai, kimi, deepseek, cloudflare, openai, anthropic, ...)
 *   - `model` — which model from that provider
 *   - `input` — either a cell reference (string) or a value
 *   - `prompt` / `output` — for ai.llm, ai.code, ai.summarize, ai.reason
 *   - cell value is the result (string for text, number[] for embeddings, etc.)
 *
 * The cell model is uniform: value cells, formula cells, and AI cells
 * all propagate reactively. The only difference is AI cells are async.
 * ============================================================================
 */
/** The 4 built-in AI providers. Custom providers can extend this. */
export type Provider = "zai" | "kimi" | "deepseek" | "cloudflare";
/** The 8 AI cell kinds. Each has its own output type. */
export type AICellKind = "ai.llm" | "ai.embed" | "ai.image" | "ai.translate" | "ai.sentiment" | "ai.summarize" | "ai.code" | "ai.vision";
/** Base config shared by all AI cells. */
export interface AIConfigBase {
    /** Cell id (must be unique in the sheet). */
    id: string;
    /** The AI cell kind. */
    kind: AICellKind;
    /** Which provider to call. */
    provider: Provider | string;
    /** The model identifier (provider-specific). */
    model: string;
    /** Optional: temperature (0 = deterministic, 2 = creative). */
    temperature?: number;
    /** Optional: max tokens to generate. */
    max_tokens?: number;
    /** Optional: stop sequences. */
    stop?: string[];
    /** Optional: timeout in ms. */
    timeout?: number;
    /** Optional: cache TTL in seconds (0 = forever). */
    cache_ttl?: number;
}
/** ai.llm config. */
export interface AILLMConfig extends AIConfigBase {
    kind: "ai.llm";
    /** The prompt template. {{cell.id}} substitutions. */
    prompt: string;
    /** Optional: system message. */
    system?: string;
    /** Optional: full message history (overrides prompt). */
    messages?: Array<{
        role: "system" | "user" | "assistant";
        content: string;
    }>;
    /** Optional: stream the response. */
    stream?: boolean;
    /** Optional: response format (json, text). */
    response_format?: "json" | "text";
}
/** ai.embed config. */
export interface AIEmbedConfig extends AIConfigBase {
    kind: "ai.embed";
    /** The text to embed (can be a cell reference). */
    input: string;
}
/** ai.image config. */
export interface AIImageConfig extends AIConfigBase {
    kind: "ai.image";
    /** The image prompt. */
    prompt: string;
    /** Image size (1024x1024, 512x512, etc.). */
    size?: string;
    /** Number of images to generate. */
    num_images?: number;
}
/** ai.translate config. */
export interface AITranslateConfig extends AIConfigBase {
    kind: "ai.translate";
    /** The text to translate. */
    input: string;
    /** Source language (auto-detect if not set). */
    source?: string;
    /** Target language code (e.g., "en", "fr", "es"). */
    target: string;
}
/** ai.sentiment config. */
export interface AISentimentConfig extends AIConfigBase {
    kind: "ai.sentiment";
    /** The text to analyze. */
    input: string;
}
/** ai.summarize config. */
export interface AISummarizeConfig extends AIConfigBase {
    kind: "ai.summarize";
    /** The text to summarize. */
    input: string;
    /** Maximum words in the summary. */
    max_words?: number;
}
/** ai.code config. */
export interface AICodeConfig extends AIConfigBase {
    kind: "ai.code";
    /** The code description. */
    input: string;
    /** Target language (python, javascript, rust, typescript, go, sql, bash, ...). */
    language: string;
    /** Optional: include tests in the output. */
    include_tests?: boolean;
}
/** ai.vision config. */
export interface AIVisionConfig extends AIConfigBase {
    kind: "ai.vision";
    /** The image URL or data URL or cell reference. */
    image: string;
    /** The text prompt (e.g., "What is in this image?"). */
    prompt: string;
}
/** Any AI cell config. */
export type AIConfig = AILLMConfig | AIEmbedConfig | AIImageConfig | AITranslateConfig | AISentimentConfig | AISummarizeConfig | AICodeConfig | AIVisionConfig;
/** The output of an AI cell. */
export type AIResult = string | number[] | {
    url: string;
    b64?: string;
} | {
    label: string;
    score: number;
};
/** A single message in a chat conversation. */
export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
/** The response from a provider's API. */
export interface ProviderResponse {
    /** The result. */
    result: AIResult;
    /** Token usage (if available). */
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    /** Model used (may differ from request if provider routed). */
    model?: string;
    /** Provider-specific metadata. */
    metadata?: Record<string, unknown>;
}
/** An error from a provider. */
export declare class AIError extends Error {
    provider: string;
    status: number;
    body: string;
    constructor(provider: string, status: number, body: string, message?: string);
}
/** The interface every provider must implement. */
export interface AIProvider {
    /** Provider name. */
    readonly name: Provider | string;
    /** Available models for this provider. */
    readonly models: Record<string, ModelInfo>;
    /** Call the provider. */
    call(config: AIConfig, options: {
        apiKey: string;
        signal?: AbortSignal;
    }): Promise<ProviderResponse>;
}
/** Information about a model. */
export interface ModelInfo {
    /** Model id. */
    id: string;
    /** Display name. */
    name: string;
    /** Max context length (tokens). */
    context_length?: number;
    /** Max output length (tokens). */
    max_output?: number;
    /** Whether this model supports vision. */
    vision?: boolean;
    /** Whether this model supports tool use. */
    tools?: boolean;
    /** Whether this model supports streaming. */
    stream?: boolean;
    /** Cost per 1k input tokens (USD). */
    cost_per_1k_input?: number;
    /** Cost per 1k output tokens (USD). */
    cost_per_1k_output?: number;
    /** Free description. */
    description?: string;
}
//# sourceMappingURL=types.d.ts.map