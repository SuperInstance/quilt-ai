"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareProvider = void 0;
const CLOUDFLARE_MODELS = {
    // LLMs
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
        id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        name: "Llama 3.3 70B (fast)",
        context_length: 24000,
        max_output: 8000,
        stream: true,
        cost_per_1k_input: 0.0003,
        cost_per_1k_output: 0.0027,
        description: "Best general purpose on Workers AI",
    },
    "@cf/meta/llama-3.1-8b-instruct": {
        id: "@cf/meta/llama-3.1-8b-instruct",
        name: "Llama 3.1 8B",
        context_length: 128000,
        max_output: 4000,
        stream: true,
        cost_per_1k_input: 0.0001,
        cost_per_1k_output: 0.0001,
        description: "Fast, cheap, decent quality",
    },
    "@cf/mistral/mistral-7b-instruct-v0.1": {
        id: "@cf/mistral/mistral-7b-instruct-v0.1",
        name: "Mistral 7B v0.1",
        context_length: 8000,
        stream: true,
        cost_per_1k_input: 0.0001,
        cost_per_1k_output: 0.0001,
        description: "Classic open model",
    },
    // Embeddings
    "@cf/baai/bge-base-en-v1.5": {
        id: "@cf/baai/bge-base-en-v1.5",
        name: "BGE base (768d)",
        context_length: 512,
        cost_per_1k_input: 0,
        cost_per_1k_output: 0,
        description: "Best general-purpose English embedding model",
    },
    "@cf/baai/bge-large-en-v1.5": {
        id: "@cf/baai/bge-large-en-v1.5",
        name: "BGE large (1024d)",
        context_length: 512,
        cost_per_1k_input: 0,
        cost_per_1k_output: 0,
        description: "Higher quality, larger vector",
    },
    // Image generation
    "@cf/stabilityai/stable-diffusion-xl-base-1.0": {
        id: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        name: "SDXL base",
        cost_per_1k_input: 0.006,
        cost_per_1k_output: 0.006,
        description: "Text → image, 1024x1024",
    },
    // Translation
    "@cf/meta/m2m100-1.2b": {
        id: "@cf/meta/m2m100-1.2b",
        name: "M2M100 1.2B",
        context_length: 1000,
        cost_per_1k_input: 0,
        cost_per_1k_output: 0,
        description: "418 languages, free",
    },
    // Sentiment
    "@cf/huggingface/distilbert-sst-2-int8": {
        id: "@cf/huggingface/distilbert-sst-2-int8",
        name: "DistilBERT SST-2",
        context_length: 512,
        cost_per_1k_input: 0,
        cost_per_1k_output: 0,
        description: "Fast sentiment classification",
    },
    // Speech
    "@cf/openai/whisper": {
        id: "@cf/openai/whisper",
        name: "Whisper",
        description: "Speech → text",
    },
    // Vision
    "@cf/llava-hf/llava-1.5-7b-hf": {
        id: "@cf/llava-hf/llava-1.5-7b-hf",
        name: "LLaVA 1.5 7B",
        context_length: 4000,
        vision: true,
        cost_per_1k_input: 0.0002,
        cost_per_1k_output: 0.0002,
        description: "Image + text → text",
    },
};
/** Cloudflare Workers AI provider. */
class CloudflareProvider {
    constructor(accountId = "") {
        this.name = "cloudflare";
        this.models = CLOUDFLARE_MODELS;
        this.accountId = accountId;
    }
    endpoint(model) {
        return `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${model}`;
    }
    async call(config, options) {
        const { apiKey, signal } = options;
        if (!apiKey)
            throw new AIError("cloudflare", 401, "missing api token");
        if (!this.accountId)
            throw new AIError("cloudflare", 400, "missing account id");
        const url = this.endpoint(config.model);
        let body;
        switch (config.kind) {
            case "ai.llm":
                body = { messages: [{ role: "user", content: config.prompt }] };
                if (config.system)
                    body.messages.unshift({ role: "system", content: config.system });
                if (config.temperature !== undefined)
                    body.temperature = config.temperature;
                if (config.max_tokens !== undefined)
                    body.max_tokens = config.max_tokens;
                break;
            case "ai.embed":
                body = { text: config.input.split("\n") };
                if (config.input.length > 50000) {
                    throw new AIError("cloudflare", 400, "input too long for embedding model");
                }
                return this.embedCall(url, body, apiKey, signal);
            case "ai.image":
                body = { prompt: config.prompt };
                return this.imageCall(url, body, apiKey, signal);
            case "ai.translate":
                body = { text: config.input, target: config.target, source: config.source || "en" };
                return this.translateCall(url, body, apiKey, signal);
            case "ai.sentiment":
                body = { text: config.input };
                return this.sentimentCall(url, body, apiKey, signal);
            case "ai.code":
                body = { messages: [{ role: "system", content: `You are a ${config.language} code generator. Output only the code, no explanation.` }, { role: "user", content: config.input }] };
                break;
            case "ai.summarize":
                body = { messages: [{ role: "system", content: `You are a summarizer. Output a summary in ${config.max_words || 50} words or fewer.` }, { role: "user", content: config.input }] };
                break;
            case "ai.vision":
                body = { image: config.image, prompt: config.prompt };
                return this.visionCall(url, body, apiKey, signal);
            default:
                throw new AIError("cloudflare", 400, `cell kind ${config.kind} not supported`);
        }
        return this.llmCall(url, body, apiKey, signal, config);
    }
    async llmCall(url, body, apiKey, signal, config) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(body),
            signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new AIError("cloudflare", res.status, errText);
        }
        const data = await res.json();
        return { result: data.response || "", model: config.model };
    }
    async embedCall(url, body, apiKey, signal) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(body),
            signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new AIError("cloudflare", res.status, errText);
        }
        const data = await res.json();
        // Cloudflare returns either { data: [[0.1, 0.2, ...]] } or { result: { data: [...] } }
        const vector = data.data?.[0] || data.result?.data?.[0] || [];
        return { result: vector };
    }
    async imageCall(url, body, apiKey, signal) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(body),
            signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new AIError("cloudflare", res.status, errText);
        }
        const data = await res.json();
        return { result: { url: data.result?.image || data.image, b64: undefined } };
    }
    async translateCall(url, body, apiKey, signal) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(body),
            signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new AIError("cloudflare", res.status, errText);
        }
        const data = await res.json();
        return { result: data.result?.translated_text || data.translated_text || "" };
    }
    async sentimentCall(url, body, apiKey, signal) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(body),
            signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new AIError("cloudflare", res.status, errText);
        }
        const data = await res.json();
        // Cloudflare returns { response: [{ label, score }] }
        const result = data.result || data.response?.[0] || data.response || {};
        return { result: { label: result.label || "NEUTRAL", score: result.score || 0 } };
    }
    async visionCall(url, body, apiKey, signal) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(body),
            signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new AIError("cloudflare", res.status, errText);
        }
        const data = await res.json();
        return { result: data.result?.response || data.response || "" };
    }
}
exports.CloudflareProvider = CloudflareProvider;
