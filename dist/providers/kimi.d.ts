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
import type { AIProvider, AIConfig, ProviderResponse, ModelInfo } from "../types.js";
/** Kimi (Moonshot) provider. */
export declare class KimiProvider implements AIProvider {
    readonly name = "kimi";
    readonly models: Record<string, ModelInfo>;
    private endpoint;
    call(config: AIConfig, options: {
        apiKey: string;
        signal?: AbortSignal;
    }): Promise<ProviderResponse>;
}
//# sourceMappingURL=kimi.d.ts.map