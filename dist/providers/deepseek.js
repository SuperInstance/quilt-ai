"use strict";
/**
 * @quilt/ai — DeepSeek provider
 * ============================================================================
 * DeepSeek — V3 Flash (chat) and R1 (reasoner).
 *
 *   - deepseek-chat:    V3 Flash, very fast, very cheap
 *   - deepseek-reasoner: R1, dedicated reasoning model
 *
 * API: https://api.deepseek.com/v1/chat/completions
 * Auth: Bearer token
 * CORS: enabled
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepseekProvider = void 0;
const types_js_1 = require("../types.js");
const DEEPSEEK_MODELS = {
    "deepseek-chat": {
        id: "deepseek-chat",
        name: "DeepSeek V3 Flash",
        context_length: 64000,
        max_output: 8000,
        stream: true,
        cost_per_1k_input: 0.0001,
        cost_per_1k_output: 0.0002,
        description: "Cheapest, fastest, great for parallel workers",
    },
    "deepseek-reasoner": {
        id: "deepseek-reasoner",
        name: "DeepSeek R1 (Reasoner)",
        context_length: 64000,
        max_output: 32000,
        stream: true,
        cost_per_1k_input: 0.0005,
        cost_per_1k_output: 0.002,
        description: "Dedicated reasoning model, exposes chain-of-thought",
    },
};
/** DeepSeek provider. */
class DeepseekProvider {
    constructor() {
        this.name = "deepseek";
        this.models = DEEPSEEK_MODELS;
        this.endpoint = "https://api.deepseek.com/v1/chat/completions";
    }
    async call(config, options) {
        const { apiKey, signal } = options;
        if (!apiKey)
            throw new types_js_1.AIError("deepseek", 401, "missing api key");
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
                prompt = `Summarize in ${config.max_words || 50} words or fewer:\n\n${config.input}`;
                break;
            case "ai.translate":
                prompt = `Translate to ${config.target}:\n\n${config.input}`;
                break;
            case "ai.sentiment":
                prompt = `Sentiment (POSITIVE/NEGATIVE/NEUTRAL): ${config.input}`;
                break;
            default:
                throw new types_js_1.AIError("deepseek", 400, `cell kind ${config.kind} not supported on deepseek`);
        }
        messages.push({ role: "user", content: prompt });
        const body = { model: config.model, messages };
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
            throw new types_js_1.AIError("deepseek", res.status, errText);
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
exports.DeepseekProvider = DeepseekProvider;
//# sourceMappingURL=deepseek.js.map