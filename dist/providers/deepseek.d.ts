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
import type { AIProvider, AIConfig, ProviderResponse, ModelInfo } from "../types.js";
/** DeepSeek provider. */
export declare class DeepseekProvider implements AIProvider {
    readonly name = "deepseek";
    readonly models: Record<string, ModelInfo>;
    private endpoint;
    call(config: AIConfig, options: {
        apiKey: string;
        signal?: AbortSignal;
    }): Promise<ProviderResponse>;
}
//# sourceMappingURL=deepseek.d.ts.map