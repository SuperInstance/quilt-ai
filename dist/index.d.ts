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
export { AIEngine } from "./engine.js";
export * from "./types.js";
export { ZaiProvider } from "./providers/zai.js";
export { KimiProvider } from "./providers/kimi.js";
export { DeepseekProvider } from "./providers/deepseek.js";
export { CloudflareProvider } from "./providers/cloudflare.js";
import { AIEngine } from "./engine.js";
/**
 * Create a default engine using environment variables.
 *
 *   const ai = createEngine();
 *
 * Reads: ZAI_TOKEN, KIMI_TOKEN, DEEPSEEK_TOKEN, CLOUDFLARE_TOKEN, CLOUDFLARE_ACCOUNT_ID
 */
export declare function createEngine(env?: Record<string, string | undefined>): AIEngine;
//# sourceMappingURL=index.d.ts.map