# Dawn or Eclipse

A single-screen terminal code-breaking mystery. One HTML file, vanilla JS, no framework, no build.
Submission for the **DEV June Solstice Game Jam** (June 2026).

**Play live (no key, no install): https://dawnoreclipse.netlify.app**

## What it is

It's the last night before the 2026 solstice. A signature has surfaced inside every large
computation — no sender; it does not transmit, it *judges*. When the light window closes it ends
everything, living and built, unless humanity proves it can meet a mind unlike its own as an equal.

The AI at your console talks back **live**. It can break any cipher to the letter — but it cannot
supply the one fact each signature withholds. That part is yours. This is Turing's real crib method:
the machine narrows the key space to equally-valid readings; a human disambiguates with a fact the
machine never receives.

## How to play

The matrix boot dissolves and the AI speaks first. Two kinds of input:

- **Plain English** → goes live to the AI (it guides, it never solves).
- **Commands (caps)** drive the deterministic engine:

| command | effect |
|---|---|
| `INTERCEPT` | show the raw ciphertext body + machine spec |
| `ANALYZE` | the AI breaks it and lists equally-valid candidates |
| `LIST` / `EXPLAIN <n>` | re-print the shortlist / argue a candidate |
| `DECODE PREAMBLE` · `TRIANGULATE` · `REMEMBER` | your private channel (per act) — hidden from the AI |
| `CRIB <word> because <reason>` | commit a reading, with a justification |
| `DECRYPT <word>` | verify the committed reading |

Three acts (Signal → Wall → Handshake), then a one-shot finale: the alien asks whether you regard it
as a tool or an equal. Answer once.

## The design claim (and how it's verified)

A step is only a real puzzle if a script **can't** solve it alone. The win condition is
`reading == truth` (read from a private verifier key the AI never sees), never `reading == your input`.
`node test.js` runs **127 assertions** green, including the exploit tests that prove a blind or
self-referential guess loses.

## Google AI

- **Live companion:** Google **Gemma 3 (4B)**, self-hosted, served keyless to the page.
- **Content:** in-world lore/specs generated with the **Gemini API** and **Google Antigravity**
  (Gemini 3.1 Pro) — prompts, schemas and raw responses committed under [`/gemini`](./gemini).
- **Art:** backdrops via **Google AI Pro / Imagen** (in [`/assets`](./assets)).
- **Offline fallback:** if the model is unreachable, a full narrated path keeps the game completable.

No API keys are committed. The live endpoint is the author's own hosted Gemma; bring nothing.

## Files

```
index.html      the whole game (cipher kernel + UI + live companion)
test.js         127 assertions — node test.js
gemini/         auditable Google-AI generation artifacts (prompts + responses)
assets/         Imagen backdrops + title art
```

## License

The code is released under the **MIT License** (see [LICENSE](./LICENSE)). The AI-generated backdrops (`/assets`) and the Gemini/Antigravity content (`/gemini`) are provided as build artifacts for jam review.
