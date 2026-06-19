# `/gemini` — Build-time Gemini provenance (Best Google AI Usage)

This folder is the **juror-verifiable artifact** behind the "Best Google AI Usage" bonus.
It holds the exact prompts, the raw Google Gemini API responses, and the cleaned
fixtures that the game replays **deterministically and offline** as "humanity's AI"
(the in-character `GEMINI:` voice). **No live API call happens at runtime** — see
MANUSKRIPT §6 (Pre-Bake-Default, Cache-First) and the honesty note below.

## What model, what was generated

- **Model:** `gemini-2.5-flash`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **Date:** 2026-06-19
- **Calls:** 3 successful content calls (+ 1 trivial connectivity ping). All returned HTTP 200.
  Spent sparingly, as instructed.

| Call | Prompt | Raw response | Produced |
|------|--------|--------------|----------|
| 1 | `prompts/01_gemini_analysis.txt` | `raw/01_gemini_analysis.json` | GEMINI in-character **headline** ("I cannot decide which is meant") + **subline** (invite the human) + a first symmetric `EXPLAIN` set |
| 2 | `prompts/02_signal_flavour.txt` | `raw/02_signal_flavour.json` | **signal_flavour** (6 ambient lines), **intro_beats** (3 opening cards), **carrier_hum** (4 noise fragments) |
| 3 | `prompts/03_explain_variants.txt` | `raw/03_explain_variants.json` | the **canonical `EXPLAIN <n>` rationales** — one per candidate, each highlighting a *different* analytical facet of the *same shared* evidence, so the lines are varied yet strictly interchangeable |

Each call used `responseMimeType: application/json` so Gemini returned strict JSON
directly — this is the structured-output path described in the manuscript.

### Which strings ship in the game

`fixtures.json` is the cleaned, ready-to-use set, structured to match
`_gate0/candidate_A.md`:

- `shortlist` — the five candidates in canonical ship-order + `correct_index: 1`.
  **Provenance: `candidate_A.md`, NOT Gemini.** The correct index is engineering
  ground-truth for the deterministic verifier only.
- `gemini.headline` / `gemini.subline` — from Call 1.
- `gemini.explain[]` — from **Call 3** (Call 1's first `EXPLAIN` set was set aside:
  it numbered candidates with ordinals like "Candidate three…", which is UI-confusing
  next to a node word — see Frictions).
- `gemini.signal_flavour` / `gemini.intro_beats` / `gemini.carrier_hum` — from Call 2.

## Payload hygiene — the critical rule

The correct answer is **THREE / node 3 / index 1**. Gemini was **never** told this,
and was never given the private disambiguator (the carrier signature `OL-03/Δ`, the
preamble, or any sender identity). Each prompt contained **only** the public
information the in-game AI layer legitimately holds (ciphertext body + frequency
stats + the five-candidate shortlist) — mirroring the adversary test in
`candidate_A.md`.

**Result — verified by automated scan (PASS):**

- No Gemini-authored string references the correct candidate, the sender node 3,
  the preamble, `OL-03`, or any bridge toward the answer.
- Every `EXPLAIN` rationale is **symmetric and interchangeable**: no line claims its
  node is special, salient, expected, favored, or numerologically meaningful. The
  number word "THREE" appears only as the literal label of its own candidate line.
- The atmospheric flavour text contains **zero** node numbers / disambiguating info.

The scan checks for leak patterns, asymmetry/singling-out language, and the
`correct_index` value living only in the non-Gemini `shortlist` block. The `correct_index`
must **never** be passed to any AI layer or rendered as a hint by the build.

## Frictions (honest dev-report material)

- **Image APIs are Free-Tier-locked.** Imagen / Gemini image generation is not
  available on the unrestricted free tier we used here, so the four planned act-art
  images were **not** generatable through this same key path. Text generation on
  `gemini-2.5-flash` worked cleanly; images need AI Studio / a paid path. This is the
  "image-API gated" friction to put in the post.
- **The 19.06.2026 key restriction** (two days before the jam deadline Google stopped
  issuing unrestricted Gemini keys) is exactly why the public build ships
  **cached/deterministic** fixtures and embeds **no** live key. The open code embed
  would otherwise expose any key.
- **Symmetry vs. variety tension.** Call 1 produced five near-identical rationales
  (good for honesty, dull for UI). Call 3 fixed this by rotating the *analytical
  angle* per line while keeping every angle equally applicable to all five — the
  correct way to get variety without leaking a preference. Call 1's `EXPLAIN` set
  also used ordinal phrasing ("Candidate three…") that collides with the node word
  "THREE"; that set was dropped from the fixtures for that reason.
- **Env loading gotcha.** `~/.secrets/gemini.env` uses `KEY=value` without `export`;
  it must be loaded with `set -a; . gemini.env; set +a` to reach a subprocess. (No
  bearing on output, logged only so the next builder doesn't trip on it.)

## Reproduce

```bash
set -a; . ~/.secrets/gemini.env; set +a   # sets $GEMINI_API_KEY (never commit it)
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{\"contents\":[{\"parts\":[{\"text\":\"$(cat prompts/03_explain_variants.txt)\"}]}],\"generationConfig\":{\"responseMimeType\":\"application/json\"}}"
```

The key is supplied via env at request time only. It is **not** present in any file in
this folder (prompts, raw, fixtures) — verified.
