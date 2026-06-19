# Enigma-Challenge — Act 1 Walking Skeleton

A single-screen, green-on-black **terminal decrypt mystery**. This is the
Phase-1 walking skeleton: **Act 1, end-to-end, fully playable**. One self-
contained `index.html`, vanilla JS, no build, no framework, no network, no
service worker. All in-game text is **English** (the docs are German).

## What it is

A failsafe signature has surfaced inside every powerful computation on Earth
at the 2026 summer solstice. You and **GEMINI** — the AI of humanity — have to
decrypt it before the closing light window runs out.

- **GEMINI** (the machine) breaks the polyalphabetic *body* down to a shortlist
  of five grammatically valid, statistically near-equivalent readings — and
  states plainly that it **cannot decide which one is meant**. It can even argue
  for every candidate, which is exactly why it can decide none.
- **You** (the human) decode a **separate** routing-tag cipher (`DECODE
  PREAMBLE`) that GEMINI never receives. It reveals the carrier signature
  `OL-03/Δ` → the sender is **node 3**. That fact is the crib.
- Set the crib, commit the only reading consistent with it (`RELAY NODE
  THREE`), and the signal locks. The machine closes the possibility space; you
  close the meaning, from knowledge it structurally never had.

This is Turing's real crib method: the bombe never heard the operational
context — humans fed in cribs from outside the ciphertext.

## How to start

- **Double-click `index.html`** (runs from `file://`), or
- paste the file into **StackBlitz / CodePen** and run it in any browser.

No server, no install, no key required.

## Command set (Act 1)

| Command | Effect |
| --- | --- |
| `HELP` | List the commands. |
| `ANALYZE` | GEMINI breaks the body and presents the 5-candidate shortlist; says it cannot decide. |
| `LIST` | Re-print the shortlist with indices. |
| `EXPLAIN <n>` | GEMINI argues for candidate `<n>` (0–4) — shows it can rationalise any of them. |
| `DECODE PREAMBLE` | **You** decode the separate routing tag (`OL-03/Δ`) → sender = node 3. Human-only path. |
| `CRIB <value> because <reason>` | Set your crib, e.g. `CRIB 3 because the preamble names node 3`. A justification is required. |
| `DECRYPT <n>` | Commit a reading, e.g. `DECRYPT THREE` or `DECRYPT 3`. Only verifiable once a crib is set. |
| `CLEAR` | Clear the screen. |

**Win:** `DECRYPT THREE` with crib = 3. **Lose:** any other reading destabilises
the signal and jumps the solstice countdown forward; reaching `T-00` is a
blackout (reload to retry).

A typical solving run:
`ANALYZE` → `EXPLAIN 0` → `DECODE PREAMBLE` → `CRIB 3 because OL-03 names node 3` → `DECRYPT THREE`.

## The architecture guarantee (the whole point)

The function `askAI(query, bodyOnly)` is handed **exactly one** data argument —
the body stream (ciphertext + candidate shortlist). It has **no access** to the
preamble stream or to the private node datum, neither as a parameter nor via
closure. The player obtains the node number through a *different* code path
(`DECODE PREAMBLE` → `PRIVATE_CHANNEL`). That separation is the in-code proof
that the AI cannot solve Act 1 alone.

GEMINI's lines are **pre-baked / deterministic** (no live call). In the full
build they come from build-time Gemini JSON fixtures committed to the repo;
here they are inlined as `AI_KNOWLEDGE`, scrubbed of any bridge to the private
datum (payload hygiene).

## Test

```
node test.js
```

The test loads the **shipped `index.html`**, extracts the inline `<script>`,
and runs its kernel under Node (the DOM code is guarded by
`typeof document !== "undefined"`). It asserts:

1. crib = 3 + `DECRYPT THREE` → **win** (index 1);
2. no crib → not verifiable; wrong reading → lose; crib without a reason is rejected;
3. **structural**: `askAI` is body-only — static scan + a runtime spy prove it
   never receives the preamble tag or the private node datum (with a negative
   control proving the spy would catch a leak).

Result: 29 checks, all passing.

## Scope

This build is **Act 1 only**, per the manuscript scope cut. Not included:
Acts 2–3, images, sound, BYOK live chat, multiple puzzle types.
