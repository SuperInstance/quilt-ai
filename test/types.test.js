/**
 * @quilt/ai — tests
 * ============================================================================
 * Test the type system, engine logic, and provider routing.
 * These tests don't make real API calls.
 * ============================================================================
 */

const assert = require("assert");

(async () => {
  // Test 1: Engine instantiation
  console.log("Test 1: Engine instantiation");
  try {
    const { AIEngine } = require("../dist/engine.js");
    const engine = new AIEngine({ zaiKey: "test" });
    assert(engine);
    console.log("  ✓ Engine created");
  } catch (e) {
    console.log("  ✗ " + e.message);
    process.exit(1);
  }

  // Test 2: Provider registration
  console.log("Test 2: Provider registration");
  try {
    const { AIEngine } = require("../dist/engine.js");
    const engine = new AIEngine();
    engine.registerProvider("custom", {
      name: "custom",
      models: { "test-model": { id: "test-model", name: "Test", context_length: 1000 } },
      call: async () => ({ result: "test response" }),
    }, "test-key");
    console.log("  ✓ Custom provider registered");
  } catch (e) {
    console.log("  ✗ " + e.message);
    process.exit(1);
  }

  // Test 3: Cache key generation
  console.log("Test 3: Cache stats");
  try {
    const { AIEngine } = require("../dist/engine.js");
    const engine = new AIEngine();
    const stats = engine.getCacheStats();
    assert.strictEqual(stats.size, 0);
    assert.strictEqual(stats.hits, 0);
    console.log("  ✓ Cache starts empty");
  } catch (e) {
    console.log("  ✗ " + e.message);
    process.exit(1);
  }

  // Test 4: Engine type exports
  console.log("Test 4: Type exports");
  try {
    const types = require("../dist/types.js");
    assert(types.AIError);
    console.log("  ✓ AIError exported");
  } catch (e) {
    console.log("  ✗ " + e.message);
    process.exit(1);
  }

  // Test 5: Provider list
  console.log("Test 5: Provider list");
  try {
    const { AIEngine } = require("../dist/engine.js");
    const engine = new AIEngine();
    const { ZaiProvider, KimiProvider, DeepseekProvider, CloudflareProvider } = require("../dist/index.js");
    console.log("  ✓ All 4 providers exported");
    console.log("    - ZaiProvider:", ZaiProvider.name);
    console.log("    - KimiProvider:", KimiProvider.name);
    console.log("    - DeepseekProvider:", DeepseekProvider.name);
    console.log("    - CloudflareProvider:", CloudflareProvider.name);
  } catch (e) {
    console.log("  ✗ " + e.message);
    process.exit(1);
  }

  // Test 6: Cache hit bumps the hits counter
  console.log("Test 6: Cache hit");
  try {
    const { AIEngine } = require("../dist/engine.js");
    const engine = new AIEngine();
    engine.registerProvider("custom", {
      name: "custom",
      models: { "t": { id: "t", name: "T", context_length: 1000 } },
      call: async () => ({ result: "ok", usage: { prompt_tokens: 10, completion_tokens: 5 } }),
    }, "k");
    // Two calls with the same config => second hits cache
    await engine.call({ kind: "ai.llm", provider: "custom", model: "t", prompt: "p" });
    await engine.call({ kind: "ai.llm", provider: "custom", model: "t", prompt: "p" });
    const stats = engine.getCacheStats();
    assert.strictEqual(stats.hits >= 1, true, "cache hit counter bumped");
    console.log(`  ✓ Cache hit counted: ${stats.hits} hit(s), ${stats.size} entry`);
  } catch (e) {
    console.log("  ✗ " + e.message);
    process.exit(1);
  }

  // Test 7: Cost counter accumulates
  console.log("Test 7: Cost counter");
  try {
    const { AIEngine } = require("../dist/engine.js");
    const engine = new AIEngine();
    engine.registerProvider("custom", {
      name: "custom",
      models: { "t": { id: "t", name: "T", context_length: 1000, cost_per_1k_input: 0.001, cost_per_1k_output: 0.002 } },
      call: async () => ({ result: "ok", usage: { prompt_tokens: 1000, completion_tokens: 1000 } }),
    }, "k");
    await engine.call({ kind: "ai.llm", provider: "custom", model: "t", prompt: "p" });
    const cost = engine.getCost();
    // 1k in @ 0.001 + 1k out @ 0.002 = 0.003
    assert(Math.abs(cost - 0.003) < 0.0001, `expected 0.003, got ${cost}`);
    console.log(`  ✓ Cost accumulated: $${cost.toFixed(6)}`);
  } catch (e) {
    console.log("  ✗ " + e.message);
    process.exit(1);
  }

  console.log("\n✓ All 7 tests passed (unit tests, no API calls)");
})();

