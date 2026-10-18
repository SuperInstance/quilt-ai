# witness/ — if it wasn't witnessed, it didn't happen

`ledger.jsonl` is an append-only, hash-chained receipt ledger of this repo's test
suite: one record per test file (path, source sha256, tests run), chained, plus one
`OUTCOME` recording the aggregate.

The idiom is ported from `SuperInstance/AI-Writings` -> `labs/situation-recorder/recorder.py`,
and is the same one already shipped in `SuperInstance/quilt-claw` -> `witness/ledger.js`.
The hash algebra is **byte-compatible** on purpose — same `fnv1a-64`, same canonical
JSON (`sort_keys=True`, compact separators), same `GENESIS = 0x0000000000000000`, same
chain rule:

    hash = "0x%016x" % fnv1a64( canon({ prev, ...envelope_without_hash }) )

Cross-checked against the quilt-claw implementation on 8 vectors — chain hashes and
canonical encodings agree byte-for-byte, including key ordering, astral-plane
unicode, control characters, and quoting.

## What is different here, and why

`ledger.js` is not a copy-paste. Two things are adapted, and only two:

1. **The counter.** This repo's harness is hand-rolled, not `node:test` — it prints
   `All 7 tests passed` rather than emitting TAP. Counting the runner's `# tests`
   would record `1` (one file) and witness a number this repo does not itself claim.
   So `runFile` reads the repo's own tally.
2. **`EXPECTED = 7`.** Claw's is 182. The count is whatever the repo actually asserts.

Everything that makes the chain worth anything — `fnv1a64`, `pyEscape`, `canon`,
`Ledger`, `verifyChain`, the tamper self-test — is byte-identical.

## Re-derive it

```bash
npm run witness            # rebuild the ledger from live test runs, verify, tamper self-test
npm run witness:verify     # re-derive the chain AND re-run every witnessed file
```

or directly:

```bash
node witness/ledger.js --verify             # full: chain + sha256 + live test counts
node witness/ledger.js --verify --chain-only # fast: chain + sha256 only, no test run
node witness/ledger.js                      # rewrite ledger.jsonl from scratch
```

## What breaks it

All four of these were fault-injected and confirmed to fail:

| tamper | detected by | exit |
|---|---|---|
| edit a test file (append a line) | sha256 drift | 1 |
| delete a test file | missing witness record | 1 |
| add an unwitnessed test file | file count mismatch | 1 |
| hand-edit `ledger.jsonl` | hash mismatch at `seq` | 1 |

## Why this exists

`@quilt/ai` declares `@quilt/core` and `@quilt/evolve` as dependencies, and its own
source says of itself:

> The engine is independent of @quilt/core. It can be used standalone

A dependency you never import is a dependency whose breakage you cannot observe. The
witness does not settle that question — but it makes the *actual* reach of this suite
a number you can check, rather than a claim you have to trust.

Note: the ledger records `tests` counts and `sha256`s, not wall-clock time or the
suite's result, so it stays byte-reproducible. Re-running the builder overwrites it
deterministically.
