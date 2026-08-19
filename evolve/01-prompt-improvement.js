/**
 * @quilt/ai — evolve example: prompt improvement
 * ============================================================================
 * Use the @quilt/evolve loop to improve an AI cell's prompt over time.
 *
 * The system being evolved is a function that summarizes text.
 * The mutator rewrites the prompt template to get better scores.
 *
 * Run:
 *   ZAI_TOKEN=... node evolve/01-prompt-improvement.js
 * ============================================================================
 */

const { AIEngine } = require('../dist/index.js');
const {
  evolve, FunctionSystem, LLMGenerator, LLMJudge, LLMMutator, HeuristicJudge,
  summarize,
} = require('@quilt/evolve');

(async () => {
  const ai = new AIEngine({ zaiKey: process.env.ZAI_TOKEN });

  // The system: a summarizer function (this is what gets evolved)
  let currentPrompt = 'Summarize the following text:';
  const system = new FunctionSystem({
    name: 'summarizer',
    fn: async (input) => {
      const result = await ai.call({
        id: 'sum',
        kind: 'ai.llm',
        provider: 'zai',
        model: 'glm-4.5',
        prompt: `${currentPrompt}\n\n${input.text}`,
        max_tokens: 200,
      });
      return { summary: result, usedPrompt: currentPrompt };
    },
  });

  // The judge: a simple heuristic (no LLM call) — score on conciseness
  const judge = new HeuristicJudge({
    fn: (input, output) => {
      if (!output.summary) return 0;
      const words = output.summary.trim().split(/\s+/).length;
      // Reward 20-40 words
      if (words >= 20 && words <= 40) return 1;
      if (words >= 10 && words <= 60) return 0.7;
      return 0.3;
    },
    reasoningFn: (input, output) => {
      if (!output.summary) return 'no summary';
      return `${output.summary.trim().split(/\s+/).length} words`;
    },
  });

  // The mutator: rewrites the prompt
  const mutator = new LLMMutator({
    ai,
    task: 'Summarize the given text in 20-40 words',
    capabilities: ['prompt'],
    threshold: 0.95,
  });

  // The generator: a fixed pool (no LLM cost) — we'd swap in LLMGenerator for adversarial
  const { SeededGenerator } = require('@quilt/evolve');
  const generator = new SeededGenerator([
    { text: 'Quilt is a reactive, typed, cellular runtime. It takes the spreadsheet model — a grid of named, reactive cells — and turns it into a general-purpose runtime. A cell can be a value, a formula, a program, a sensor, an API, a listener, a router, or an IO port. The same sheet can be deployed to a browser, a server, an edge function, a microcontroller, or a peer-to-peer mesh. The cell model is uniform across all of them.' },
    { text: 'Climate change is accelerating. Global average temperatures have risen 1.1°C since pre-industrial times. Reducing emissions requires coordinated action across governments, businesses, and individuals.' },
    { text: 'The factory pattern uses factory methods to create objects. Instead of calling a constructor directly, you call a function that returns a new object. This decouples object creation from the specific class.' },
  ]);

  // Run the loop
  const { FullSheetScope } = require('@quilt/evolve');
  const result = await evolve({
    system, generator, judge, mutator,
    scope: new FullSheetScope(),
    iterations: 5,
    populationSize: 3,
    verbose: true,
  });

  console.log('\n' + summarize(result));
  console.log('\nFinal prompt:', currentPrompt);
  console.log('Score progression:', result.scoreProgression.map(s => s.toFixed(3)).join(' → '));
})();
