/**
 * @quilt/ai — tests
 * ============================================================================
 * Test the type system, engine logic, and provider routing.
 * These tests don't make real API calls.
 * ============================================================================
 */

const assert = require("assert");

// We'll test the compiled output. For now, do basic JS-side tests.

// Test 1: Engine instantiation
console.log("Test 1: Engine instantiation");
try {
  const { AIEngine } = require("../src/engine.js");
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
  const { AIEngine } = require("../src/engine.js");
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
  const { AIEngine } = require("../src/engine.js");
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
  const types = require("../src/types.js");
  assert(types.AIError);
  console.log("  ✓ AIError exported");
} catch (e) {
  console.log("  ✗ " + e.message);
  process.exit(1);
}

// Test 5: Provider list
console.log("Test 5: Provider list");
try {
  const { AIEngine } = require("../src/engine.js");
  const engine = new AIEngine();
  const { ZaiProvider, KimiProvider, DeepseekProvider, CloudflareProvider } = require("../src/index.js");
  console.log("  ✓ All 4 providers exported");
  console.log("    - ZaiProvider:", ZaiProvider.name);
  console.log("    - KimiProvider:", KimiProvider.name);
  console.log("    - DeepseekProvider:", DeepseekProvider.name);
  console.log("    - CloudflareProvider:", CloudflareProvider.name);
} catch (e) {
  console.log("  ✗ " + e.message);
  process.exit(1);
}

console.log("\n✓ All 5 tests passed (unit tests, no API calls)");
