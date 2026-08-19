# @quilt/ai — AI cells for Quilt

> **4 providers. 8 cell kinds. 1 uniform interface.**

AI as a first-class cell kind in [Quilt](https://github.com/SuperInstance/quilt). Every LLM call, embedding, image, translation, sentiment, and code generation is a reactive cell that propagates with the rest of your sheet.

```
   ┌──────────────────────────────────────────┐
   │           Quilt Sheet (YAML)             │
   │                                          │
   │  input.text ──▶ ai.embed ──▶ vector.search ──▶ ai.llm ──▶ answer
   │                   (BGE)         (top-K)         (z.ai)      │
   │                                                              │
   │  budget.over ──┐                                            │
   │                ▼                                            │
   │  answer ◀── router ◀── ai.deepseek (cheap) ◀── ai.zai (expensive) │
   │                                                                  │
   └──────────────────────────────────────────┘
```

## Install

```bash
npm install @quilt/ai
```

## Quick start

```typescript
import { AIEngine, createEngine } from '@quilt/ai';

// Option 1: read keys from environment
const ai = createEngine();

// Option 2: pass keys explicitly
const ai = new AIEngine({
  zaiKey: process.env.ZAI_TOKEN,
  kimiKey: process.env.KIMI_TOKEN,
  deepseekKey: process.env.DEEPSEEK_TOKEN,
  cloudflareKey: process.env.CLOUDFLARE_TOKEN,
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
});

// Use it directly
const answer = await ai.call({
  id: 'answer',
  kind: 'ai.llm',
  provider: 'zai',
  model: 'glm-4.5',
  prompt: 'What is Quilt?',
});
console.log(answer);
```

Or wire it into a Quilt sheet:

```typescript
import { Quilt } from '@quilt/core';
import { AIEngine } from '@quilt/ai';

const sheet = new Quilt({ ai: new AIEngine() });

sheet.load({
  cells: [
    { id: 'question', kind: 'value', value: 'What is Quilt?' },
    { id: 'answer', kind: 'ai.llm', provider: 'zai', model: 'glm-4.5', prompt: '{{question}}' },
  ],
});

await sheet.tick();
console.log(sheet.get('answer'));
```

## The 4 providers

| Provider | Best for | Models | Cost |
|----------|----------|--------|------|
| **z.ai** | Coding, reasoning | GLM 4.5, AirX, Flash, 9B | $0.001-$0.002 / 1k |
| **Kimi** | Long context (128k) | v1 8k/32k/128k, K2 | $0.0001-$0.001 / 1k |
| **DeepSeek** | Cheap parallel workers | V3 Flash, R1 Reasoner | $0.0001-$0.002 / 1k |
| **Cloudflare** | Free tier, on-edge | Llama 3.3, Mistral, BGE, SDXL | Free tier 10k neurons/day |

## The 8 cell kinds

| Kind | Input | Output | Example |
|------|-------|--------|---------|
| `ai.llm` | prompt | text | Chat completion |
| `ai.embed` | text | vector | Semantic search |
| `ai.image` | prompt | image URL | Text → image |
| `ai.translate` | text + target | text | Multi-language |
| `ai.sentiment` | text | {label, score} | Classify mood |
| `ai.summarize` | long text | short text | TL;DR |
| `ai.code` | description | code | Code gen |
| `ai.vision` | image + prompt | text | Caption an image |

## The 6 patterns

### 1. Cascade

```yaml
- id: extract
  kind: ai.llm
  prompt: "Extract entities from: {{text}}"

- id: classify
  kind: ai.llm
  prompt: "Classify sentiment of: {{extract}}"
```

### 2. Fan-out (parallel)

```yaml
- id: draft.zai:     { kind: ai.llm, provider: zai, ... }
- id: draft.kimi:    { kind: ai.llm, provider: kimi, ... }
- id: draft.deepseek: { kind: ai.llm, provider: deepseek, ... }
- id: best:
    kind: ai.llm
    prompt: "Pick best of: {{draft.zai}} {{draft.kimi}} {{draft.deepseek}}"
```

### 3. RAG

```yaml
- id: q.embed:  { kind: ai.embed, input: question }
- id: matches:  { kind: vectorize.search, vector: q.embed, top_k: 5 }
- id: answer:   { kind: ai.llm, prompt: "Context: {{matches}}\nQ: {{question}}" }
```

### 4. Agent loop

```yaml
- id: thought:    { kind: ai.llm, prompt: "What's next?" }
- id: action:     { kind: router, when: thought }
- id: step.advance: { kind: listener, when: "step < 10" }
```

### 5. Cost control

```yaml
- id: answer.premium: { kind: ai.llm, provider: zai, ... }
- id: answer.cheap:   { kind: ai.llm, provider: deepseek, ... }
- id: answer:
    kind: router
    routes:
      - when: "total.cost >= budget"
        then: "answer.cheap"
      - then: "answer.premium"
```

### 6. Memoize

Cells cache by input hash automatically. Re-setting a cell with the same value is a no-op.

## API

### `AIEngine`

```typescript
const engine = new AIEngine({
  zaiKey?: string,
  kimiKey?: string,
  deepseekKey?: string,
  cloudflareKey?: string,
  cloudflareAccountId?: string,
});

engine.registerProvider(name, provider, apiKey?);
engine.setKey(provider, apiKey);

const result = await engine.call(config, {
  useCache?: boolean,  // default: true
  signal?: AbortSignal,
});

engine.getCost();      // total USD spent
engine.getTokens();    // { prompt, completion, total }
engine.getCacheStats();
engine.clearCache();
```

### `createEngine()`

Reads keys from `process.env`:
- `ZAI_TOKEN`
- `KIMI_TOKEN`
- `DEEPSEEK_TOKEN`
- `CLOUDFLARE_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Security

**Never put API keys in YAML sheets.** Sheets are typically committed to git. Quilt refuses to load sheets that contain keys.

The 3 layers:

1. **Browser (Quilt Live)**: Calls a proxy URL. Keys never reach the browser.
2. **Cloudflare Worker**: Keys set as Wrangler secrets. Only the Worker has access.
3. **Server (TS / Rust)**: Keys read from environment variables.

## Examples

See the [`examples/`](./examples) directory for complete sheets:

- `01-basic-llm.yaml` — single LLM call
- `02-fanout-3models.yaml` — 3 models in parallel
- `03-rag.yaml` — RAG over a vector store
- `04-agent-loop.yaml` — multi-step agent
- `05-cost-control.yaml` — budget-aware routing
- `06-image-pipeline.yaml` — text → enhanced prompt → image → caption

## Test

```bash
npm test
```

The test suite runs 6 unit tests. To run real API tests, set the env vars first.

## Part of Quilt

`@quilt/ai` is one of 13 packages in the Quilt ecosystem:

| Package | Language | Description |
|---------|----------|-------------|
| [@quilt/core](https://github.com/SuperInstance/quilt) | TS | Reactive engine |
| [@quilt/cli](https://github.com/SuperInstance/quilt) | TS | CLI + MCP server |
| [quilt-rust](https://github.com/SuperInstance/quilt-rust) | Rust | Sync + async engine |
| [quilt-live](https://github.com/SuperInstance/quilt-live) | HTML | Single-file, offline |
| [quilt-cloudflare](https://github.com/SuperInstance/quilt-cloudflare) | Workers | Edge-native with D1, Vectorize |
| **@quilt/ai** (this) | TS | AI cells: 4 providers, 8 kinds |
| [quilt-esp32](https://github.com/SuperInstance/quilt-esp32) | Rust | Microcontroller |
| [quilt-mesh](https://github.com/SuperInstance/quilt-mesh) | TS | CRDT peer-to-peer |
| [quilt-agent](https://github.com/SuperInstance/quilt-agent) | TS | LLM agent sheet |
| [quilt-time](https://github.com/SuperInstance/quilt-time) | TS | Time travel |
| [quilt-vault](https://github.com/SuperInstance/quilt-vault) | TS | Encryption |
| [quilt-vision](https://github.com/SuperInstance/quilt-vision) | TS | Computer vision |
| [quilt-zk](https://github.com/SuperInstance/quilt-zk) | TS | Zero-knowledge proofs |
| [quilt-flow](https://github.com/SuperInstance/quilt-flow) | TS | Visual editor |

## License

MIT
