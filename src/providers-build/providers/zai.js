"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZaiProvider = void 0;
/** Models available on z.ai. */
const ZAI_MODELS = {
    "glm-4.5": {
        id: "glm-4.5",
        name: "GLM 4.5",
        context_length: 128000,
        max_output: 16000,
        tools: true,
        stream: true,
        cost_per_1k_input: 0.001,
        cost_per_1k_output: 0.002,
        description: "Best general purpose, native CoT reasoning",
    },
    "glm-4.5-airx": {
        id: "glm-4.5-airx",
        name: "GLM 4.5 AirX",
        context_length: 8000,
        max_output: 4000,
        tools: true,
        stream: true,
        cost_per_1k_input: 0.0001,
        cost_per_1k_output: 0.0001,
        description: "Faster, cheaper, similar quality on most tasks",
    },
    "glm-4-flash": {
        id: "glm-4-flash",
        name: "GLM 4 Flash (free)",
        context_length: 128000,
        max_output: 16000,
        cost_per_1k_input: 0,
        cost_per_1k_output: 0,
        description: "Free tier, very fast, good for simple tasks",
    },
    "glm-4-9b": {
        id: "glm-4-9b",
        name: "GLM 4 9B (open weights)",
        context_length: 8000,
        cost_per_1k_input: 0,
        cost_per_1k_output: 0,
        description: "Open weights, can self-host",
    },
};
/**
 * z.ai provider implementation.
 *
 * To use:
 *   const provider = new ZaiProvider();
 *   const response = await provider.call(config, { apiKey: process.env.ZAI_TOKEN });
 */
class ZaiProvider {
    constructor() {
        this.name = "zai";
        this.models = ZAI_MODELS;
        this.endpoint = "https://api.z.ai/api/paas/v4/chat/completions";
    }
    /**
     * Call z.ai with the given config.
     *
     * Handles all 8 cell kinds:
     *   - ai.llm, ai.code, ai.summarize, ai.vision, ai.translate → chat completion
     *   - ai.embed → uses embedding model
     *   - ai.image → not supported on z.ai (throws)
     *   - ai.sentiment → uses chat completion with structured prompt
     */
    async call(config, options) {
        const { apiKey, signal } = options;
        if (!apiKey)
            throw new AIError("zai", 401, "missing api key");
        // Route by cell kind
        switch (config.kind) {
            case "ai.llm":
            case "ai.code":
            case "ai.summarize":
            case "ai.vision":
                return this.chatCompletion(config, apiKey, signal);
            case "ai.translate":
                return this.translate(config, apiKey, signal);
            case "ai.sentiment":
                return this.sentiment(config, apiKey, signal);
            case "ai.embed":
                return this.embed(config, apiKey, signal);
            case "ai.image":
                throw new AIError("zai", 400, "ai.image not supported on z.ai (use cloudflare or openai)");
            default:
                throw new AIError("zai", 400, `unknown cell kind: ${config.kind}`);
        }
    }
    /** Internal: chat completion. */
    async chatCompletion(config, apiKey, signal) {
        const messages = [];
        if ("system" in config && config.system) {
            messages.push({ role: "system", content: config.system });
        }
        let prompt = "";
        if (config.kind === "ai.llm") {
            prompt = config.prompt;
        }
        else if (config.kind === "ai.code") {
            prompt = `You are a code generator. Write only the ${config.language} code, no explanation, no markdown fences.\n\n${config.input}`;
        }
        else if (config.kind === "ai.summarize") {
            const maxWords = config.max_words || 50;
            prompt = `Summarize the following text in ${maxWords} words or fewer:\n\n${config.input}`;
        }
        else if (config.kind === "ai.vision") {
            // Vision models in chat format
            messages.push({
                role: "user",
                content: JSON.stringify([{ type: "text", text: config.prompt }, { type: "image_url", image_url: { url: config.image } }]),
            });
        }
        if (config.kind !== "ai.vision" && prompt) {
            messages.push({ role: "user", content: prompt });
        }
        if ("messages" in config && config.messages) {
            messages.push(...config.messages);
        }
        const body = {
            model: config.model,
            messages,
        };
        if (config.temperature !== undefined)
            body.temperature = config.temperature;
        if (config.max_tokens !== undefined)
            body.max_tokens = config.max_tokens;
        if (config.stop)
            body.stop = config.stop;
        if ("stream" in config && config.stream)
            body.stream = true;
        const res = await fetch(this.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new AIError("zai", res.status, errText);
        }
        const data = await res.json();
        const choice = data.choices?.[0];
        const content = choice?.message?.content || choice?.message?.reasoning_content || "";
        return {
            result: content,
            usage: data.usage && {
                prompt_tokens: data.usage.prompt_tokens,
                completion_tokens: data.usage.completion_tokens,
                total_tokens: data.usage.total_tokens,
            },
            model: data.model,
        };
    }
    /** Internal: translation. */
    async translate(config, apiKey, signal) {
        if (config.kind !== "ai.translate")
            throw new Error("expected translate");
        const system = `You are a translator. Translate the following text to ${config.target}. Output only the translation, nothing else.`;
        return this.chatCompletion({
            ...config,
            kind: "ai.llm",
            system,
            prompt: config.input,
        }, apiKey, signal);
    }
    /** Internal: sentiment. */
    async sentiment(config, apiKey, signal) {
        if (config.kind !== "ai.sentiment")
            throw new Error("expected sentiment");
        const system = `You are a sentiment classifier. Respond with one word: POSITIVE, NEGATIVE, or NEUTRAL.`;
        const res = await this.chatCompletion({
            ...config,
            kind: "ai.llm",
            system,
            prompt: `Classify the sentiment of: ${config.input}`,
        }, apiKey, signal);
        const label = res.result.trim().toUpperCase();
        const score = label === "POSITIVE" ? 0.9 : label === "NEGATIVE" ? -0.9 : 0;
        return { ...res, result: { label, score } };
    }
    /** Internal: embedding. */
    async embed(config, apiKey, signal) {
        if (config.kind !== "ai.embed")
            throw new Error("expected embed");
        const res = await fetch("https://api.z.ai/api/paas/v4/embeddings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: config.model || "embedding-2",
                input: config.input,
            }),
            signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new AIError("zai", res.status, errText);
        }
        const data = await res.json();
        return {
            result: data.data?.[0]?.embedding || [],
            usage: data.usage && {
                prompt_tokens: data.usage.prompt_tokens,
                completion_tokens: 0,
                total_tokens: data.usage.total_tokens,
            },
            model: data.model,
        };
    }
}
exports.ZaiProvider = ZaiProvider;
