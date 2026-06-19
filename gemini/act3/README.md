# `/gemini/act3` — Antigravity (Gemini 3.1 Pro) provenance for Act 3 / Finale

This folder is the juror-verifiable artifact behind the **"built with Antigravity"**
bonus evidence for the finale. It holds the exact prompt, the raw Antigravity CLI
response, and the cleaned fixtures the game replays **deterministically and
offline** as the in-character `GEMINI:` voice. **No live API call happens at
runtime.**

## What tool, what model, what was generated

- **Tool:** Antigravity CLI — `agy` 1.0.10, headless via `agy -p "<prompt>" < /dev/null`.
- **Model:** **Gemini 3.1 Pro (High)** (self-reported by `agy`).
- **Date:** 2026-06-19.
- **Calls:** 1 content call for Act 3 (spent sparingly).

| Call | Prompt | Raw response | Produced |
|------|--------|--------------|----------|
| 1 | `prompt_act3_analysis.txt` | `raw_act3_analysis.txt` | GEMINI in-character **headline** ("no principled discriminator; I cannot decide") + **subline** (invite the human's understanding) + symmetric **EXPLAIN** rationales (one per lineage) + 4 ambient **flavour** lines |

The prompt asked for strict JSON; `agy` returned strict JSON directly.

### Which strings ship in the game

`fixtures.json` is the cleaned set, structured to match `_gate0/candidate_C.md`:

- `shortlist` — the four lineage readings in canonical ship-order +
  `correct_index: 1` (KORZAN, 0-based; `candidate_C.md` numbers it index 2 in its
  own 1-based table). **Provenance: `candidate_C.md`, NOT the AI.** The correct
  index is engineering ground-truth for the deterministic verifier only.
- `gemini.headline` / `gemini.subline` / `gemini.explain[]` / `gemini.flavour` —
  from the agy call above, verbatim.

## Payload hygiene — the critical rule

The correct answer is **KORZAN** (the silent founding line that now speaks for the
first time). agy was **never** told this, and was never given the private
disambiguator: the **garden lore** the operator learns in Act 3 (which line kept
its silence). The four names are **exact anagrams** of one another, so there is no
substring / root / initial to mine. The prompt contained **only** the public
information the in-game AI layer legitimately holds (the four-candidate shortlist +
that the names are arbitrary anagram proper nouns) — mirroring the adversary test
in `candidate_C.md`.

**Result — verified by automated scan (PASS):**

- No agy-authored string references the correct candidate, silence/listening/
  waiting/watchers, the garden/monuments/memory, founding-line histories, or any
  name-root mining. "KORZAN" appears only as the literal label of its own
  candidate line.
- Every EXPLAIN rationale is **symmetric and interchangeable** (a different facet
  of the same shared evidence, equally applicable to all four anagrams).
- The flavour text contains **zero** lineage names / disambiguating info.

The `correct_index` lives only in the non-AI `shortlist` block and is never passed
to any AI layer or rendered as a hint.

## Frictions (honest dev-report material)

- **Antigravity has no image generation** (text only); act art is produced
  separately via the Gemini app — see `game/assets/IMAGE_PROMPTS.md`.
- The anagram construction is what makes the leak-resistance hold even if the
  silence lore ever leaked publicly (see `candidate_C.md` §5.3): with no
  distinguishing substring, the model can only confabulate.

## Reproduce

```bash
agy -p "$(cat prompt_act3_analysis.txt)" < /dev/null
```
