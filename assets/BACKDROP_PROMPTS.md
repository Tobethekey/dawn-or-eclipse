# Enigma-Challenge — apokalyptische Hintergrund-Bilder (CI-Backdrops)

Vier full-bleed Backdrops, die je Spielphase hinter der **zentrierten Konsole** liegen.
Das Spiel dunkelt sie schon kräftig ab (52–72 % Void-Overlay + farbiger Wash + Vignette +
Scanlines), darum müssen sie **nicht** vorab dunkel sein — aber moody/low-key hilft.
Wichtig für Lesbarkeit: **die Bildmitte ruhiger/dunkler** halten (dort sitzt die Textspalte),
Drama eher an den Rändern.

- **Format:** Querformat 16:9 (z. B. 1920×1080). Quadrat geht auch — die Engine croppt mit `cover`.
- **Kein** Text, keine Buchstaben, keine Logos/Wasserzeichen, keine Menschen, keine Gesichter.
- **Stil durchziehen** (alle vier = dieselbe Welt): filmisch, körnig, entsättigt, Retro-Sci-Fi /
  Bletchley-trifft-2026, kein Kitsch, kein Glanz.
- Erzeugt in der **Gemini-App (Google AI Pro)** → zählt für „Best Google AI Usage". `✦`-Wasserzeichen
  darf drin bleiben (Provenienz). Nach der Abgabe nichts rotieren (sind nur Bilder).

Dateinamen **exakt** so ablegen in `game/assets/` (sonst greift der Fallback = nur Verlauf):

| Datei | Phase im Spiel |
|-------|----------------|
| `bg-station.jpg` | Briefing + Akt I (THE SIGNAL) |
| `bg-wall.jpg`    | Akt II (THE WALL) + Akt III (THE HANDSHAKE) |
| `bg-alien.jpg`   | Finale-Dialog (die fremde Signatur) |
| `bg-dawn.jpg`    | DAWN (Sieg) |

---

## 1 · `bg-station.jpg` — die einsame Station (Briefing/Akt I)

> Cinematic apocalyptic matte painting, widescreen 16:9. The interior of a lone radio operator's
> wooden shack at the dead of night during a planetary emergency — the last lit room on Earth.
> A single small window reveals the final blood-orange sliver of a solstice horizon beneath a vast,
> oppressive dark sky. Faint amber glow of old vacuum-tube radio equipment along the walls; tangled
> cables; dust in still air. Everything is swallowed in cold green-black shadow, with heavy darkness
> and empty negative space in the centre of the frame, deep vignette. Desaturated, low-key, heavy
> film grain, profound isolation and quiet dread. No people, no text, no letters, no watermark.

## 2 · `bg-wall.jpg` — die Wand am Himmel (Akt II/III)

> Cinematic apocalyptic matte painting, widescreen 16:9. A monumental, impossible structure of light
> fills the night sky above a dead, blacked-out landscape: a colossal geometric "signature" — a wall
> of faint, cold cyan-violet glyphic light, like an aurora made of pure logic — hangs over a silent,
> ruined horizon. The world below is tiny, dwarfed, powerless beneath it. Vast scale, oppressive awe.
> The centre of the frame stays darker and calmer; the light concentrates toward the upper edges.
> Desaturated, filmic grain, cold palette, end-of-the-world stillness. No people, no text, no
> letters, no watermark.

## 3 · `bg-alien.jpg` — die fremde Intelligenz (Finale)

> Cinematic, unsettling, widescreen 16:9. An uncanny non-human presence made of cold violet and
> magenta light emerging from absolute darkness — a vast, intricate, fractal-geometric form, part
> eye, part lattice, ancient and patient, beautiful and wrong, regarding the viewer in silence.
> It glows from within against a near-black void; the darkness presses in around a luminous centre.
> Mystical, alien, deep violet on black, faint volumetric haze, filmic grain. No human face, no
> people, no text, no letters, no watermark.

## 4 · `bg-dawn.jpg` — die Sonnenwende kehrt um (DAWN)

> Cinematic, widescreen 16:9. A pale gold dawn breaks slowly over a quiet, surviving Earth after the
> long night — the first warm light returning across a still, hushed landscape; soft golden haze,
> low sun, gentle relief, the days growing longer again. Calm and reverent, NOT triumphant or
> glossy — quiet survival, a held breath released. Muted gold, amber and soft grey, filmic grain,
> wide empty sky. No people, no text, no letters, no watermark.

---

### Hinweis zur Generierung
- Free-Tier der Gemini-**API** ist für Bilder gesperrt (429, „limit: 0" — braucht Billing). Darum
  die **App**. (Stand 20.06.2026, vgl. Logbuch D22/D36.)
- Falls die App nur 1:1 liefert: passt trotzdem (Engine croppt mittig). 16:9 ist nur schöner.
- Nach dem Ablegen einfach das Spiel neu laden — die Backdrops blenden je Phase ein.
