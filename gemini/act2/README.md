# `/gemini/act2` — Antigravity (Gemini 3.1 Pro) provenance for Act 2

This folder is the juror-verifiable artifact behind the **"built with Antigravity"**
bonus evidence for Act 2. It holds the exact prompt, the raw Antigravity CLI
response, and the cleaned fixtures the game replays **deterministically and
offline** as the in-character `GEMINI:` voice. **No live API call happens at
runtime.**

## What tool, what model, what was generated

- **Tool:** Antigravity CLI — `agy` 1.0.10, headless via `agy -p "<prompt>" < /dev/null`
  (Antigravity is named in the jam's bonus text, so "built with Antigravity" is a
  first-class Google-AI-usage signal).
- **Model:** **Gemini 3.1 Pro (High)** (self-reported by `agy`).
- **Date:** 2026-06-19.
- **Calls:** 1 content call for Act 2 (spent sparingly, as instructed).

| Call | Prompt | Raw response | Produced |
|------|--------|--------------|----------|
| 1 | `prompt_act2_analysis.txt` | `raw_act2_analysis.txt` | GEMINI in-character **headline** ("I cannot decide the field") + **subline** (invite the human's external context) + symmetric **EXPLAIN** rationales (one per candidate) + 4 ambient **flavour** lines |

The prompt asked for strict JSON; `agy` returned strict JSON directly.

### Which strings ship in the game

`fixtures.json` is the cleaned, ready-to-use set, structured to match
`_gate0/candidate_B.md`:

- `shortlist` — the four direction readings in canonical ship-order +
  `correct_index: 1` (NEARSIDE). **Provenance: `candidate_B.md`, NOT the AI.**
  The correct index is engineering ground-truth for the deterministic verifier
  only.
- `gemini.headline` / `gemini.subline` / `gemini.explain[]` / `gemini.flavour` —
  from the agy call above, verbatim.

## Payload hygiene — the critical rule

The correct answer is **NEARSIDE / index 1**. agy was **never** told this, and was
never given the private disambiguator: the **bearing** the operator triangulates
in Act 2 (his own parallax measurement). The prompt contained **only** the public
information the in-game AI layer legitimately holds (the four-candidate shortlist +
the public machine framing) — mirroring the adversary test in `candidate_B.md`.

**Result — verified by automated scan (PASS):**

- No agy-authored string references the correct candidate, the bearing, parallax,
  triangulation, the operator's measurement, or any bridge toward the answer.
- Every EXPLAIN rationale is **symmetric and interchangeable**: each names a
  *different* analytical facet of the *same shared* evidence, and none claims its
  direction word is special, near, far, expected, or correct. "NEARSIDE" appears
  only as the literal label of its own candidate line.
- The flavour text contains **zero** direction words / disambiguating info.

The `correct_index` lives only in the non-AI `shortlist` block and is never passed
to any AI layer or rendered as a hint.

## Frictions (honest dev-report material)

- **Antigravity has no image generation** (text only). The four act-art images are
  produced separately (Gemini app / Google AI Pro) — see `game/assets/IMAGE_PROMPTS.md`.
- Antigravity replaced the dead Gemini CLI login path; `agy -p ... < /dev/null` is
  the reliable headless invocation.

## Reproduce

```bash
agy -p "$(cat prompt_act2_analysis.txt)" < /dev/null
```
