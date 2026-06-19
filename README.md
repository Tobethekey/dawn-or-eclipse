# Enigma-Challenge — Full Three-Act Build

A single-screen, green-on-black **terminal decrypt mystery**. One self-contained
`index.html`, vanilla JS, no build, no framework, no network, no service worker.
All in-game text is **English** (the docs are German).

## What it is

A failsafe signature has surfaced inside every powerful computation on Earth at
the 2026 summer solstice. You and **GEMINI** — the AI of humanity — have to
decrypt **three** signatures before the closing light window runs out. One crib
mechanic, escalated three times:

- **Act 1 — The Signal (MATCH).** GEMINI breaks the polyalphabetic body to a
  shortlist of five number-word readings and states it **cannot decide which is
  meant**. You decode a **separate** routing-tag cipher (`DECODE PREAMBLE`) that
  GEMINI never receives → the sender is **node 3**. Commit `RELAY NODE THREE`.
- **Act 2 — The Wall (MEASURE).** GEMINI breaks the body to four `-side`
  direction readings, all equally valid. You **triangulate the source yourself**
  (`TRIANGULATE`): the parallax barely shifts, so the source is near. Your own
  bearing names **NEARSIDE** — a measurement GEMINI never receives.
- **Act 3 — The Handshake (UNDERSTAND).** GEMINI breaks the body to four founding
  lineage names that are **exact anagrams** of one another — no morphological
  handle, no statistical hook. You **walk the memory garden** (`REMEMBER`) and
  learn which line kept its silence; the line now speaking for the first time is
  that silent line → **KORZAN**. The disarm is a Shamir-flavour handshake: your
  meaning × GEMINI's compute. Win → **SIGNAL LOCKED / DAWN RETURNS**.

The machine closes the possibility space; you close the meaning, from knowledge
it structurally never had — Turing's real crib method, three times over.

## How to start

- **Double-click `index.html`** (runs from `file://`), or
- paste the file into **StackBlitz / CodePen** and run it in any browser.

No server, no install, no key required. The game runs **with or without** the
optional act-art images (see below) — missing image files degrade silently.

## Command set (act-aware)

| Command | Effect |
| --- | --- |
| `HELP` | List the commands (shows the active act's private channel). |
| `INTERCEPT` | Show the active act's raw ciphertext + the public machine spec. |
| `ANALYZE` | GEMINI breaks the body, presents the shortlist, says it cannot decide. |
| `LIST` | Re-print the shortlist with indices. |
| `EXPLAIN <n>` | GEMINI argues for candidate `<n>` — proof it can rationalise any of them. |
| `DECODE PREAMBLE` | **Act 1** private channel: the routing tag → node 3. |
| `TRIANGULATE` | **Act 2** private channel: your own bearing → NEARSIDE. |
| `REMEMBER` | **Act 3** private channel: the garden lore → KORZAN. |
| `CRIB <value> because <reason>` | Set + justify your crib (justification required). |
| `DECRYPT <n>` | Commit a reading. Only verifiable once a crib is set. |
| `CLEAR` | Clear the screen. |

A full solving run: `ANALYZE` → `DECODE PREAMBLE` → `CRIB 3 because OL-03 names
node 3` → `DECRYPT THREE` → `ANALYZE` → `TRIANGULATE` → `CRIB NEARSIDE because my
bearing puts it near` → `DECRYPT NEARSIDE` → `ANALYZE` → `REMEMBER` → `CRIB KORZAN
because the silent line now speaks` → `DECRYPT KORZAN`.

**Lose:** the solstice countdown spans all three acts; each wrong `DECRYPT` jumps
it forward. Reaching `T-00` is a **CSS blackout** (no image; reload to retry).

## The architecture guarantee (the whole point)

`askAI(query, bodyOnly)` is handed **exactly one** data argument — the active
act's body stream (ciphertext + public spec + derived shortlist). It has **no
access** to any private stream (preamble / bearing / garden) or to
`PRIVATE_CHANNEL`, neither as a parameter nor via closure. The player obtains
each act's disambiguator through a *different* code path. That separation is the
in-code proof that the AI cannot solve **any** act alone, and the test suite
proves it statically and at runtime, per act.

GEMINI's lines are **pre-baked / deterministic** (no live call), inlined as
`AI_KNOWLEDGE`, scrubbed of any bridge to the private datum (payload hygiene):

| Act | Provenance | Tool / model |
| --- | --- | --- |
| 1 | `gemini/fixtures.json` | Google Gemini `gemini-2.5-flash` (API) |
| 2 | `gemini/act2/fixtures.json` | **Antigravity** (`agy`) → **Gemini 3.1 Pro (High)** |
| 3 | `gemini/act3/fixtures.json` | **Antigravity** (`agy`) → **Gemini 3.1 Pro (High)** |

Each `gemini/*` folder holds the exact prompt, the raw model response, the
cleaned fixtures, and a payload-hygiene note — juror-verifiable artifacts behind
"Best Google AI Usage" / "built with Antigravity".

## Optional act art

The game references four images that the player supplies later; it runs **now**
without them. Save into `game/assets/` (see `assets/IMAGE_PROMPTS.md`):
`title.jpg`, `signature.jpg`, `terminal-bg.jpg`, `win.jpg`. Any missing file is
hidden cleanly (the `<img>` `error` handler removes the card; the background
plate falls back to flat near-black). The lose state uses **no image** (pure CSS
blackout).

## Test

```
node test.js
```

The test loads the **shipped `index.html`**, extracts the inline `<script>`, and
runs its kernel under Node (the DOM code is guarded by
`typeof document !== "undefined"`). It asserts, for all three acts: the cipher is
real (round-trips), the analysis breaks the body to the derived shortlist with
the field genuinely underdetermined, only the act's own private-channel datum
wins, a crib from the wrong act does not cross-solve, and `askAI` is body-only
(static scan + runtime spy + negative control) in **every** act.

Result: **109 checks, all passing** (54 original Act-1 checks + 55 new).

## Scope

Full three-act build per the manuscript arc (Manuscript §3, WEG D14/D24).
Not included: sound, BYOK live chat. Act art is optional and player-supplied.
