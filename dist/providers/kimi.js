"use strict";
/**
 * @quilt/ai — Kimi (Moonshot) provider
 * ============================================================================
 * Moonshot AI — Kimi models.
 *
 *   - moonshot-v1-8k:  8k context, fast, cheap
 *   - moonshot-v1-32k: 32k context, medium
 *   - moonshot-v1-128k: 128k context, longest, priciest
 *   - moonshot-v1-auto: auto-routing
 *   - kimi-k2: latest, with tool use
 *
 * API: https://api.moonshot.ai/v1/chat/completions
 * Auth: Bearer token
 * CORS: enabled
 * Note: Use api.moonshot.ai (NOT api.moonshot.cn — that's the Chinese endpoint)
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KimiProvider = void 0;
const types_js_1 = require("../types.js");
const KIMI_MODELS = {
    "moonshot-v1-8k": {
        id: "moonshot-v1-8k",
        name: "Kimi 8k",
        context_length: 8000,
        max_output: 4000,
        stream: true,
        cost_per_1k_input: 0.0001,
        cost_per_1k_output: 0.0001,
        description: "Fast, cheap, good for short conversations",
    },
    "moonshot-v1-32k": {
        id: "moonshot-v1-32k",
        name: "Kimi 32k",
        context_length: 32000,
        max_output: 8000,
        stream: true,
        cost_per_1k_input: 0.0003,
        cost_per_1k_output: 0.0003,
        description: "Medium context, good balance",
    },
    "moonshot-v1-128k": {
        id: "moonshot-v1-128k",
        name: "Kimi 128k",
        context_length: 128000,
        max_output: 8000,
        stream: true,
        cost_per_1k_input: 0.001,
        cost_per_1k_output: 0.001,
        description: "Longest context, priciest, great for long docs",
    },
    "moonshot-v1-auto": {
        id: "moonshot-v1-auto",
        name: "Kimi Auto",
        context_length: 128000,
        stream: true,
        cost_per_1k_input: 0.0003,
        cost_per_1k_output: 0.0003,
        description: "Auto-routing, picks the right model for the input length",
    },
    "kimi-k2": {
        id: "kimi-k2",
        name: "Kimi K2",
        context_length: 128000,
        tools: true,
        stream: true,
        cost_per_1k_input: 0.0006,
        cost_per_1k_output: 0.0006,
        description: "Latest, with native tool use and reasoning",
    },
};
/** Kimi (Moonshot) provider. */
class KimiProvider {
    constructor() {
        this.name = "kimi";
        this.models = KIMI_MODELS;
        this.endpoint = "https://api.moonshot.ai/v1/chat/completions";
    }
    async call(config, options) {
        const { apiKey, signal } = options;
        if (!apiKey)
            throw new types_js_1.AIError("kimi", 401, "missing api key");
        // Kimi supports most cell kinds via chat completion
        let prompt = "";
        const messages = [];
        if ("system" in config && config.system) {
            messages.push({ role: "system", content: config.system });
        }
        switch (config.kind) {
            case "ai.llm":
                prompt = config.prompt;
                break;
            case "ai.code":
                prompt = `You are a code generator. Write only the ${config.language} code.\n\n${config.input}`;
                break;
            case "ai.summarize":
                prompt = `Summarize the following text in ${config.max_words || 50} words or fewer:\n\n${config.input}`;
                break;
            case "ai.translate":
                prompt = `Translate the following text to ${config.target}. Output only the translation:\n\n${config.input}`;
                break;
            case "ai.sentiment":
                prompt = `Classify the sentiment (POSITIVE/NEGATIVE/NEUTRAL) of: ${config.input}`;
                break;
            default:
                throw new types_js_1.AIError("kimi", 400, `cell kind ${config.kind} not supported on kimi`);
        }
        messages.push({ role: "user", content: prompt });
        const body = {
            model: config.model,
            messages,
        };
        if (config.temperature !== undefined)
            body.temperature = config.temperature;
        if (config.max_tokens !== undefined)
            body.max_tokens = config.max_tokens;
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
            throw new types_js_1.AIError("kimi", res.status, errText);
        }
        const data = await res.json();
        let result = data.choices?.[0]?.message?.content || "";
        if (config.kind === "ai.sentiment") {
            const label = String(result).trim().toUpperCase();
            const score = label === "POSITIVE" ? 0.9 : label === "NEGATIVE" ? -0.9 : 0;
            result = { label, score };
        }
        return {
            result,
            usage: data.usage && {
                prompt_tokens: data.usage.prompt_tokens,
                completion_tokens: data.usage.completion_tokens,
                total_tokens: data.usage.total_tokens,
            },
            model: data.model,
        };
    }
}
exports.KimiProvider = KimiProvider;
//# sourceMappingURL=kimi.js.map