"use strict";
/**
 * @quilt/ai
 * ============================================================================
 * AI cells for Quilt — 4 providers, 8 cell kinds, one uniform interface.
 *
 *   import { AIEngine } from '@quilt/ai';
 *
 *   const engine = new AIEngine({
 *     zaiKey: process.env.ZAI_TOKEN,
 *     kimiKey: process.env.KIMI_TOKEN,
 *     deepseekKey: process.env.DEEPSEEK_TOKEN,
 *   });
 *
 *   // Use it as a regular AI client
 *   const result = await engine.call({
 *     id: 'answer',
 *     kind: 'ai.llm',
 *     provider: 'zai',
 *     model: 'glm-4.5',
 *     prompt: 'What is Quilt?',
 *   });
 *
 *   // Or wire it into a Quilt sheet
 *   import { Quilt } from '@quilt/core';
 *   const sheet = new Quilt({ ai: engine });
 *   sheet.load({
 *     cells: [
 *       { id: 'question', kind: 'value', value: 'What is Quilt?' },
 *       { id: 'answer', kind: 'ai.llm', provider: 'zai', model: 'glm-4.5', prompt: '{{question}}' },
 *     ],
 *   });
 *   await sheet.tick();
 *   console.log(sheet.get('answer')); // The model's response
 *
 * The 4 providers:
 *   - zai         (GLM 4.5, AirX, Flash, 9B)
 *   - kimi        (Moonshot v1 8k/32k/128k, K2)
 *   - deepseek    (V3 Flash, R1 Reasoner)
 *   - cloudflare  (Llama 3.3 70B, Mistral, BGE, SDXL, M2M100, Whisper, LLaVA)
 *
 * The 8 cell kinds:
 *   - ai.llm       — chat completion
 *   - ai.embed     — text → vector
 *   - ai.image     — text → image
 *   - ai.translate — text → translated text
 *   - ai.sentiment — text → { label, score }
 *   - ai.summarize — long text → short text
 *   - ai.code      — description → code
 *   - ai.vision    — image + text → text
 * ============================================================================
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEngine = exports.CloudflareProvider = exports.DeepseekProvider = exports.KimiProvider = exports.ZaiProvider = exports.AIEngine = void 0;
var engine_js_1 = require("./engine.js");
Object.defineProperty(exports, "AIEngine", { enumerable: true, get: function () { return engine_js_1.AIEngine; } });
__exportStar(require("./types.js"), exports);
var zai_js_1 = require("./providers/zai.js");
Object.defineProperty(exports, "ZaiProvider", { enumerable: true, get: function () { return zai_js_1.ZaiProvider; } });
var kimi_js_1 = require("./providers/kimi.js");
Object.defineProperty(exports, "KimiProvider", { enumerable: true, get: function () { return kimi_js_1.KimiProvider; } });
var deepseek_js_1 = require("./providers/deepseek.js");
Object.defineProperty(exports, "DeepseekProvider", { enumerable: true, get: function () { return deepseek_js_1.DeepseekProvider; } });
var cloudflare_js_1 = require("./providers/cloudflare.js");
Object.defineProperty(exports, "CloudflareProvider", { enumerable: true, get: function () { return cloudflare_js_1.CloudflareProvider; } });
const engine_js_2 = require("./engine.js");
/**
 * Create a default engine using environment variables.
 *
 *   const ai = createEngine();
 *
 * Reads: ZAI_TOKEN, KIMI_TOKEN, DEEPSEEK_TOKEN, CLOUDFLARE_TOKEN, CLOUDFLARE_ACCOUNT_ID
 */
function createEngine(env = process.env) {
    return new engine_js_2.AIEngine({
        zaiKey: env.ZAI_TOKEN,
        kimiKey: env.KIMI_TOKEN,
        deepseekKey: env.DEEPSEEK_TOKEN,
        cloudflareKey: env.CLOUDFLARE_TOKEN,
        cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID,
    });
}
exports.createEngine = createEngine;
