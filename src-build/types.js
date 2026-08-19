"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIError = void 0;
/** An error from a provider. */
class AIError extends Error {
    constructor(provider, status, body, message) {
        super(message || `${provider} ${status}: ${body.slice(0, 200)}`);
        this.provider = provider;
        this.status = status;
        this.body = body;
        this.name = "AIError";
    }
}
exports.AIError = AIError;
