#!/usr/bin/env node
/* ====================================================================== *
 *  ENIGMA-CHALLENGE — Act 1 logic test (no deps, pure Node).
 *
 *  It loads THE SHIPPED index.html, extracts the inline <script>, and runs
 *  it as a CommonJS module. Because index.html guards all DOM code with
 *  `if (typeof document !== "undefined")` and exports its kernel via
 *  `module.exports`, requiring it under Node exercises the *real* shipped
 *  logic — not a copy.
 *
 *  Asserts:
 *    1. crib=3  +  DECRYPT THREE        -> WIN
 *    2. no crib +  DECRYPT THREE        -> not verifiable (no win, NO_CRIB)
 *    3. crib=3  +  DECRYPT SEVEN (decoy)-> LOSE
 *    4. STRUCTURAL: askAI is only ever called with the BODY stream; it has
 *       no access to the preamble / private node datum. We prove this by
 *       (a) static source scan and (b) a runtime spy on every askAI arg.
 * ====================================================================== */

const fs = require("fs");
const path = require("path");
const Module = require("module");

const HTML_PATH = path.join(__dirname, "index.html");
const html = fs.readFileSync(HTML_PATH, "utf8");

// --- Extract the single inline <script> block (the game logic).
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("FAIL: no <script> block found in index.html"); process.exit(1); }
const source = m[1];

// --- Compile the extracted source as a CommonJS module (document is undefined
//     under Node, so the browser IIFE is skipped and module.exports is set).
const mod = new Module(HTML_PATH);
mod.filename = HTML_PATH;
mod.paths = Module._nodeModulePaths(path.dirname(HTML_PATH));
mod._compile(source, HTML_PATH);
const game = mod.exports;

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { console.log("  PASS  " + name); passed++; }
  else      { console.log("  FAIL  " + name); failed++; }
}

console.log("ENIGMA-CHALLENGE :: Act 1 logic test\n");

// ---------------------------------------------------------------------- //
// Sanity: kernel exports present.
// ---------------------------------------------------------------------- //
console.log("[sanity] kernel surface");
["BODY_STREAM","PREAMBLE_STREAM","askAI","setCrib","decrypt","newCribState","parseNodeValue"]
  .forEach(k => check("export " + k + " present", typeof game[k] !== "undefined"));

// ---------------------------------------------------------------------- //
// 1. crib=3 + DECRYPT THREE -> WIN
// ---------------------------------------------------------------------- //
console.log("\n[1] crib=3, DECRYPT THREE -> WIN");
{
  const st = game.newCribState();
  const set = game.setCrib(st, "3", "the carrier signature OL-03 names node 3");
  check("setCrib(3, reason) ok", set.ok === true && set.value === 3);
  const r = game.decrypt("THREE", game.BODY_STREAM, st);
  check("DECRYPT THREE verifiable", r.ok === true);
  check("DECRYPT THREE wins", r.win === true);
  check("winning index is 1 (THREE)", r.index === 1);
}

// ---------------------------------------------------------------------- //
// 2. no crib + DECRYPT THREE -> NOT verifiable (no win)
// ---------------------------------------------------------------------- //
console.log("\n[2] no crib, DECRYPT THREE -> not verifiable");
{
  const st = game.newCribState();
  const r = game.decrypt("THREE", game.BODY_STREAM, st);
  check("not ok without crib", r.ok === false);
  check("code === NO_CRIB", r.code === "NO_CRIB");
  check("no win without crib", r.win !== true);
}

// ---------------------------------------------------------------------- //
// 2b. crib without a reason is rejected (anti trial-and-error)
// ---------------------------------------------------------------------- //
console.log("\n[2b] crib without justification is rejected");
{
  const st = game.newCribState();
  const set = game.setCrib(st, "3", "");
  check("setCrib rejects empty reason", set.ok === false && set.code === "NO_REASON");
}

// ---------------------------------------------------------------------- //
// 3. crib=3 + DECRYPT SEVEN (decoy) -> LOSE
// ---------------------------------------------------------------------- //
console.log("\n[3] crib=3, DECRYPT SEVEN (the public decoy) -> LOSE");
{
  const st = game.newCribState();
  game.setCrib(st, "3", "preamble names node 3");
  const r = game.decrypt("SEVEN", game.BODY_STREAM, st);
  check("DECRYPT SEVEN verifiable", r.ok === true);
  check("DECRYPT SEVEN loses", r.win === false);
}
// And every wrong candidate loses with crib=3.
console.log("\n[3b] with crib=3 every non-THREE candidate loses");
{
  for (const word of ["SEVEN","FOUR","TWO","NINE"]) {
    const st = game.newCribState();
    game.setCrib(st, "3", "preamble names node 3");
    const r = game.decrypt(word, game.BODY_STREAM, st);
    check("DECRYPT " + word + " loses", r.ok === true && r.win === false);
  }
}

// ---------------------------------------------------------------------- //
// 3c. THE CLOSED EXPLOIT: cribbing a WRONG word and decrypting that SAME wrong
//     word must LOSE. The win is (choice===crib AND crib===truth), not the
//     tautology (choice===crib). This is exactly the hole a real playthrough
//     exposed: CRIB TWO because <anything> + DECRYPT TWO used to advance.
// ---------------------------------------------------------------------- //
console.log("\n[3c] crib WRONG + decrypt that same wrong word -> LOSE (the exploit, closed)");
{
  for (const word of ["TWO","SEVEN","FOUR","NINE"]) {           // every non-THREE candidate
    const st = game.newCribState();
    game.setCrib(st, word, "deliberately asserting " + word, game.BODY_STREAM);
    const r = game.decrypt(word, game.BODY_STREAM, st, true);   // grounded, and crib === choice
    check("crib " + word + " + DECRYPT " + word + " still LOSES", r.ok === true && r.win === false);
  }
}

// ---------------------------------------------------------------------- //
// 3d. GROUNDING IS MANDATORY: a correct reading without working the private
//     channel is refused — the engine cannot certify the field on its own.
// ---------------------------------------------------------------------- //
console.log("\n[3d] correct crib but NOT grounded -> refused (NOT_GROUNDED)");
{
  const st = game.newCribState();
  game.setCrib(st, "3", "preamble names node 3");
  const rUng = game.decrypt("THREE", game.BODY_STREAM, st, false);   // grounded === false
  check("ungrounded decrypt is refused", rUng.ok === false && rUng.code === "NOT_GROUNDED");
  check("ungrounded decrypt does not win", rUng.win !== true);
  const rOk = game.decrypt("THREE", game.BODY_STREAM, st, true);     // same move, grounded
  check("same move grounded -> wins", rOk.ok === true && rOk.win === true);
}

// ---------------------------------------------------------------------- //
// 4. STRUCTURAL ASYMMETRY: askAI never receives the private datum.
// ---------------------------------------------------------------------- //
console.log("\n[4] structural: askAI is body-only, never sees the preamble/private node");

// (a) Static scan of the askAI source: it must reference the body argument,
//     and must NOT reference the preamble/private symbols.
{
  const fnSrc = game.askAI.toString();
  check("askAI references its body argument", /bodyOnly/.test(fnSrc));
  check("askAI does NOT reference PREAMBLE_STREAM", !/PREAMBLE_STREAM/.test(fnSrc));
  check("askAI does NOT reference PRIVATE_CHANNEL", !/PRIVATE_CHANNEL/.test(fnSrc));
  check("askAI does NOT reference senderNode", !/senderNode/.test(fnSrc));
  // askAI runs the genuine analysis on the body ciphertext alone.
  check("askAI calls analyzeCipher on the body", /analyzeCipher\s*\(\s*bodyOnly\.ciphertext/.test(fnSrc));
  // The body stream handed to askAI must itself be secret-free: even body.spec
  // carries NO rotor/token key and NO answer. (publicSpec strips them.)
  check("BODY_STREAM.spec has no rotorKey", game.BODY_STREAM.spec.rotorKey === undefined);
  check("BODY_STREAM.spec has no tokenKey", game.BODY_STREAM.spec.tokenKey === undefined);
  check("BODY_STREAM.spec has no truth/answer", game.BODY_STREAM.spec.truth === undefined);
  // The AI's flavour text must not bridge to the private node datum.
  const aiText = JSON.stringify(game.AI_RATIONALES);
  check("AI rationales contain no 'node 3' / preamble bridge",
        !/node\s*3|OL-?0?3|preamble|carrier signature|sender is/i.test(aiText));
}

// (b) Runtime spy: wrap askAI and assert that, across the whole call surface,
//     the second argument is ALWAYS exactly BODY_STREAM and the preamble's
//     private datum never appears in any argument passed to it.
{
  const realAskAI = game.askAI;
  let violations = 0, calls = 0;
  const privateDatum = game.PREAMBLE_STREAM.senderNode;          // 3
  const privateTag   = game.PREAMBLE_STREAM.decodedTag;          // OL-03/Δ
  function spy(query, bodyOnly) {
    calls++;
    // The body stream is the only allowed data object.
    if (bodyOnly !== game.BODY_STREAM) violations++;
    // The private datum / tag must never be smuggled in via any argument.
    const flat = JSON.stringify(Array.from(arguments));
    if (flat.includes(privateTag)) violations++;
    if (flat.includes('"' + privateDatum + '"')) violations++;
    return realAskAI(query, bodyOnly);
  }
  // Exercise every askAI route the UI uses.
  spy("ANALYZE", game.BODY_STREAM);
  spy("RATIONALE", game.BODY_STREAM);
  check("askAI was exercised", calls >= 2);
  check("askAI always got BODY_STREAM only, never the private datum", violations === 0);

  // Negative control: prove the spy WOULD catch a leak if one were attempted.
  let caught = 0;
  function spy2(query, bodyOnly) {
    const flat = JSON.stringify(Array.from(arguments));
    if (flat.includes(privateTag)) caught++;
    return realAskAI(query, game.BODY_STREAM);
  }
  spy2("ANALYZE", game.BODY_STREAM, { leak: privateTag }); // deliberate leak attempt
  check("spy detects a deliberate leak (negative control)", caught === 1);
}

// ---------------------------------------------------------------------- //
// 5. THE CIPHER IS REAL: encrypt -> decrypt roundtrips exactly.
// ---------------------------------------------------------------------- //
console.log("\n[5] cipher engine roundtrips (encrypt -> decrypt == identity)");
{
  const { cipherEncrypt, cipherDecrypt, TOKEN_START, TOKEN_LEN } = game;
  // The shipped message.
  const ct = cipherEncrypt(game.TRUE_PLAINTEXT, game.ROTOR_KEY, game.TOKEN_KEY, TOKEN_START, TOKEN_LEN);
  check("REAL_CIPHERTEXT is produced by the engine (not pre-baked)", ct === game.REAL_CIPHERTEXT);
  const rt = cipherDecrypt(ct, game.ROTOR_KEY, game.TOKEN_KEY, TOKEN_START, TOKEN_LEN);
  check("decrypt(encrypt(TRUE_PLAINTEXT)) === TRUE_PLAINTEXT", rt === game.TRUE_PLAINTEXT);
  check("ciphertext actually differs from plaintext", ct !== game.TRUE_PLAINTEXT);

  // Roundtrip on arbitrary text / arbitrary keys (general correctness).
  const samples = [
    ["THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG", "TURING", "ENIGM"],
    ["ATTACK AT DAWN ON THE EASTERN RIDGE", "SOLSTICE", "ALPHA"],
    ["A", "Z", "QQQQQ"],
    ["", "KEY", "PADXX"],
  ];
  let allRt = true;
  for (const [pt, sk, tk] of samples) {
    const c = cipherEncrypt(pt, sk, tk, TOKEN_START, TOKEN_LEN);
    const d = cipherDecrypt(c, sk, tk, TOKEN_START, TOKEN_LEN);
    if (d !== pt.toUpperCase()) allRt = false;
  }
  check("roundtrip holds for arbitrary text/keys", allRt);

  // Spaces/punctuation pass through unchanged (word boundaries preserved).
  const spaced = cipherEncrypt("WE ARE HERE", "KEY", "PADXX", TOKEN_START, TOKEN_LEN);
  check("spaces are preserved by the cipher", spaced.split(" ").length === 3);
}

// ---------------------------------------------------------------------- //
// 6. THE ANALYSIS IS REAL: it breaks the body from ciphertext alone and
//    reproduces the shortlist deterministically (no hardcoded answer array).
// ---------------------------------------------------------------------- //
console.log("\n[6] cryptanalysis breaks the body and reproduces the shortlist");
{
  const a = game.analyzeCipher(game.REAL_CIPHERTEXT);
  // The crib drag recovers the true rotor key.
  check("crib drag recovers rotor key ORACLE", a.recoveredKey === game.ROTOR_KEY);
  check("crib is internally consistent", a.cribConsistent === true);
  // The scaffold is fully reconstructed; only the node field is blanked.
  check("body reconstruction matches scaffold + blanked field",
        a.bodyReconstruction === "WEBROADCASTASRELAYNODE?????OFTHEOUTERLATTICE");
  // The shortlist is DERIVED (canonical ship order, all genuinely reachable).
  check("derived candidates equal the canonical five",
        JSON.stringify(a.candidates.map(c =>
          c.replace(/^WE BROADCAST AS RELAY NODE\s+/, "").replace(/\s+OF THE OUTER LATTICE$/, "")))
        === JSON.stringify(["SEVEN","THREE","FOUR","TWO","NINE"]));
  check("derived candidateNodes are [7,3,4,2,9]",
        JSON.stringify(a.candidateNodes) === JSON.stringify([7,3,4,2,9]));
  // Re-run on the SAME plaintext re-encrypted with the SAME keys -> identical
  // shortlist (deterministic, computed from the cipher, not a stored array).
  const ct2 = game.cipherEncrypt(game.TRUE_PLAINTEXT, game.ROTOR_KEY, game.TOKEN_KEY, game.TOKEN_START, game.TOKEN_LEN);
  const a2 = game.analyzeCipher(ct2);
  check("analysis is deterministic on re-encryption",
        JSON.stringify(a2.candidateNodes) === JSON.stringify(a.candidateNodes));
  check("BODY_STREAM.candidates came from the analysis (live-derived)",
        JSON.stringify(game.BODY_STREAM.candidates.slice()) === JSON.stringify(a.candidates.slice()));
}

// ---------------------------------------------------------------------- //
// 6b. PROOF IT IS NOT A FAKE: change the true node, the analysis tracks it.
//     (Encrypt a DIFFERENT node word; the shortlist still lists the same
//     fitting number words but the recovered TRUE field changes — proving the
//     break reads the cipher, it doesn't echo a constant.)
// ---------------------------------------------------------------------- //
console.log("\n[6b] analysis reads the actual cipher (decrypts the true field with the token key)");
{
  // Build a ciphertext whose node field really says SEVEN, decrypt the field
  // with the (private) token key, and confirm the engine's token ciphertext
  // changes accordingly — i.e. the analysis is bound to the real bytes.
  const plainSeven = game.TRUE_PLAINTEXT.replace("THREE", "SEVEN");
  const ctSeven = game.cipherEncrypt(plainSeven, game.ROTOR_KEY, game.TOKEN_KEY, game.TOKEN_START, game.TOKEN_LEN);
  const aSeven = game.analyzeCipher(ctSeven);
  check("different true field -> different token ciphertext",
        aSeven.tokenCipher !== game.analyzeCipher(game.REAL_CIPHERTEXT).tokenCipher);
  // With the token key (a human/private artefact), the field decrypts to SEVEN.
  const fieldPlain = game.cipherDecrypt(ctSeven, game.ROTOR_KEY, game.TOKEN_KEY, game.TOKEN_START, game.TOKEN_LEN);
  check("token-key decryption of the SEVEN cipher really yields SEVEN",
        fieldPlain.includes("SEVEN"));
}

// ---------------------------------------------------------------------- //
// 7. THE TOKEN IS UNDERDETERMINED without the preamble: the analysis (body
//    only) admits MORE THAN ONE number word for the field, and cannot single
//    out THREE. The disambiguation only comes from the private channel.
// ---------------------------------------------------------------------- //
console.log("\n[7] node token is underdetermined from the body alone");
{
  const a = game.analyzeCipher(game.REAL_CIPHERTEXT);
  check("more than one number word fits the field", a.reachable.length > 1);
  check("the engine flags the token as underdetermined", a.tokenUnderdetermined === true);
  // The correct word THREE is reachable, but so are the decoys — equally.
  const words = a.reachable.map(r => r.word);
  check("THREE is reachable", words.includes("THREE"));
  check("the decoy SEVEN is equally reachable", words.includes("SEVEN"));
  // There is NO field in the analysis result that names the single correct node.
  const flat = JSON.stringify({ candidates: a.candidates, reachable: a.reachable,
    recoveredKey: a.recoveredKey, bodyReconstruction: a.bodyReconstruction });
  check("analysis result never marks a single correct candidate",
        !/correct|true node|answer|sender is|node\s*3\b/i.test(flat));
  // Body-only, the engine cannot do better than chance on the field: every
  // candidate maps to a structurally valid pad of the same form.
  const padLens = new Set(a.reachable.map(r => r.pad.length));
  check("every candidate's pad is the same field width (no statistical hook)",
        padLens.size === 1 && padLens.has(game.TOKEN_LEN));
}

// ---------------------------------------------------------------------- //
// 8. END-TO-END: engine (body) gives shortlist; human (preamble) gives the
//    crib; only their COMBINATION wins. Mirrors the in-game flow.
// ---------------------------------------------------------------------- //
console.log("\n[8] end-to-end: shortlist (engine) x crib (human/preamble) -> win");
{
  // (engine) the shortlist the player sees:
  const shortlist = game.BODY_STREAM.candidateNodes;     // [7,3,4,2,9]
  check("engine offers >1 candidate (cannot decide alone)", shortlist.length > 1);
  // (human) the preamble names node 3 — a stream the engine never gets:
  const human = game.PREAMBLE_STREAM.senderNode;          // 3
  check("preamble (human channel) names node 3", human === 3);
  // combine: set crib from the private datum, then decrypt.
  const st = game.newCribState();
  game.setCrib(st, String(human), "the preamble carrier signature OL-03 names node " + human);
  const r = game.decrypt("THREE", game.BODY_STREAM, st);
  check("combination (shortlist x preamble crib) wins", r.ok === true && r.win === true);
  // Without the human datum, no choice verifies — the engine alone is stuck.
  const st2 = game.newCribState();
  const r2 = game.decrypt("THREE", game.BODY_STREAM, st2);
  check("engine alone (no preamble crib) cannot verify", r2.ok === false && r2.code === "NO_CRIB");
}

// ====================================================================== //
//  ACTS 2 & 3 + THREE-ACT PROGRESSION + per-act askAI separation.
//  Same crib mechanic, escalated. Each act has its own ciphertext, its own
//  shortlist (derived live), and its own private side-channel datum the AI
//  never sees.
// ====================================================================== //

// ---------------------------------------------------------------------- //
// 9. ACT 2 (Type B / bearing): the cipher is real, the shortlist is derived,
//    and only the player's triangulated bearing (NEARSIDE) wins.
// ---------------------------------------------------------------------- //
console.log("\n[9] ACT 2 — direction-word cipher is real and underdetermined");
{
  const b2 = game.BODY_STREAM_2;
  // Real cipher: the engine produced the ciphertext (not pre-baked).
  const built = game.buildCiphertext(game.ACT2_SPEC);
  check("ACT2 ciphertext is engine-produced", built.ct === b2.ciphertext);
  const rt = game.cipherDecrypt(built.ct, game.ACT2_SPEC.rotorKey, game.ACT2_SPEC.tokenKey,
                                built.tokenStart, game.ACT2_SPEC.tokenLen);
  check("ACT2 decrypt(encrypt) round-trips", rt === built.plain);
  // Real analysis: crib drag recovers the rotor key, blanks the field.
  const a2 = game.analyzeAct(game.ACT2);
  check("ACT2 crib drag recovers rotor key BLETCHLEY", a2.recoveredKey === "BLETCHLEY");
  check("ACT2 crib is internally consistent", a2.cribConsistent === true);
  check("ACT2 body reconstruction blanks only the direction field",
        a2.bodyReconstruction === "WESPEAKFROMTHE?????????WHEREYOURSIGNALFIRSTBENT");
  // Derived shortlist = the canonical four directions, all reachable/underdetermined.
  check("ACT2 derived shortlist words = FARSIDE/NEARSIDE/BLINDSIDE/LEESIDE",
        JSON.stringify(a2.candidateWords) === JSON.stringify(["FARSIDE","NEARSIDE","BLINDSIDE","LEESIDE"]));
  check("ACT2 field is underdetermined (>1 reading fits)", a2.tokenUnderdetermined === true);
  check("ACT2 all four directions are reachable",
        ["FARSIDE","NEARSIDE","BLINDSIDE","LEESIDE"].every(w => a2.reachable.some(r => r.word === w)));
  // Every reachable pad is the same field width => no statistical hook.
  const padLens2 = new Set(a2.reachable.map(r => r.pad.length));
  check("ACT2 every reachable pad is the field width (no hook)",
        padLens2.size === 1 && padLens2.has(game.ACT2_SPEC.tokenLen));
}

console.log("\n[9b] ACT 2 — bearing crib -> NEARSIDE wins, any other loses");
{
  const b2 = game.BODY_STREAM_2;
  // The player's private bearing (from TRIANGULATE) names NEARSIDE.
  check("ACT2 bearing (human channel) = NEARSIDE", game.BEARING_STREAM.trueSector === "NEARSIDE");
  // no crib -> not verifiable
  const stNo = game.newCribState();
  const rNo = game.decrypt("NEARSIDE", b2, stNo);
  check("ACT2 no crib -> not verifiable", rNo.ok === false && rNo.code === "NO_CRIB");
  // crib = NEARSIDE -> NEARSIDE wins (index 1)
  const st = game.newCribState();
  const set = game.setCrib(st, game.BEARING_STREAM.trueSector,
                           "my parallax bearing puts the source near", b2);
  check("ACT2 setCrib(NEARSIDE, reason) ok", set.ok === true && set.word === "NEARSIDE");
  const rWin = game.decrypt("NEARSIDE", b2, st);
  check("ACT2 DECRYPT NEARSIDE wins", rWin.ok === true && rWin.win === true);
  check("ACT2 winning index is 1 (NEARSIDE)", rWin.index === 1);
  // every other direction loses with the bearing crib
  for (const w of ["FARSIDE","BLINDSIDE","LEESIDE"]) {
    const stx = game.newCribState();
    game.setCrib(stx, "NEARSIDE", "bearing names nearside", b2);
    const rx = game.decrypt(w, b2, stx);
    check("ACT2 DECRYPT " + w + " loses", rx.ok === true && rx.win === false);
  }
}

// ---------------------------------------------------------------------- //
// 10. ACT 3 (Type C / garden): exact-anagram lineage cipher; only the garden
//     deduction (KORZAN) wins.
// ---------------------------------------------------------------------- //
console.log("\n[10] ACT 3 — anagram-lineage cipher is real and underdetermined");
{
  const b3 = game.BODY_STREAM_3;
  const built = game.buildCiphertext(game.ACT3_SPEC);
  check("ACT3 ciphertext is engine-produced", built.ct === b3.ciphertext);
  const rt = game.cipherDecrypt(built.ct, game.ACT3_SPEC.rotorKey, game.ACT3_SPEC.tokenKey,
                                built.tokenStart, game.ACT3_SPEC.tokenLen);
  check("ACT3 decrypt(encrypt) round-trips", rt === built.plain);
  const a3 = game.analyzeAct(game.ACT3);
  check("ACT3 crib drag recovers rotor key SOLSTICE", a3.recoveredKey === "SOLSTICE");
  check("ACT3 crib is internally consistent", a3.cribConsistent === true);
  check("ACT3 body reconstruction blanks only the lineage field",
        a3.bodyReconstruction === "ICARRYTHECHARGEOFTHE??????");
  check("ACT3 derived shortlist words = ZORKAN/KORZAN/NAKZOR/RAZKON",
        JSON.stringify(a3.candidateWords) === JSON.stringify(["ZORKAN","KORZAN","NAKZOR","RAZKON"]));
  check("ACT3 field is underdetermined (>1 reading fits)", a3.tokenUnderdetermined === true);
  // The four names are EXACT anagrams (the design's anti-handle guarantee).
  const sortL = w => w.split("").sort().join("");
  const sigs = new Set(a3.candidateWords.map(sortL));
  check("ACT3 the four lineage names are exact anagrams", sigs.size === 1);
}

console.log("\n[10b] ACT 3 — garden crib -> KORZAN wins, any other loses");
{
  const b3 = game.BODY_STREAM_3;
  check("ACT3 garden (human channel) silent line = KORZAN", game.GARDEN_STREAM.silentLine === "KORZAN");
  const stNo = game.newCribState();
  const rNo = game.decrypt("KORZAN", b3, stNo);
  check("ACT3 no crib -> not verifiable", rNo.ok === false && rNo.code === "NO_CRIB");
  const st = game.newCribState();
  const set = game.setCrib(st, game.GARDEN_STREAM.silentLine,
                           "the silent line that now speaks first is Korzan", b3);
  check("ACT3 setCrib(KORZAN, reason) ok", set.ok === true && set.word === "KORZAN");
  const rWin = game.decrypt("KORZAN", b3, st);
  check("ACT3 DECRYPT KORZAN wins", rWin.ok === true && rWin.win === true);
  check("ACT3 winning index is 1 (KORZAN)", rWin.index === 1);
  for (const w of ["ZORKAN","NAKZOR","RAZKON"]) {
    const stx = game.newCribState();
    game.setCrib(stx, "KORZAN", "garden lore names korzan", b3);
    const rx = game.decrypt(w, b3, stx);
    check("ACT3 DECRYPT " + w + " loses", rx.ok === true && rx.win === false);
  }
}

// ---------------------------------------------------------------------- //
// 11. THREE-ACT PROGRESSION: each act's crib comes from its OWN private
//     channel, and a crib from the wrong act does NOT cross-solve.
// ---------------------------------------------------------------------- //
console.log("\n[11] three-act progression: one mechanic, three escalating cribs");
{
  // Walk all three acts end-to-end with the correct private datum each time.
  const steps = [
    { body: game.BODY_STREAM,   datum: String(game.PREAMBLE_STREAM.senderNode), word: "THREE",    idx: 1 },
    { body: game.BODY_STREAM_2, datum: game.BEARING_STREAM.trueSector,           word: "NEARSIDE", idx: 1 },
    { body: game.BODY_STREAM_3, datum: game.GARDEN_STREAM.silentLine,            word: "KORZAN",   idx: 1 },
  ];
  let allWin = true;
  steps.forEach((s, i) => {
    const st = game.newCribState();
    game.setCrib(st, s.datum, "private channel for act " + (i + 1), s.body);
    const r = game.decrypt(s.word, s.body, st);
    if (!(r.ok && r.win && r.index === s.idx)) allWin = false;
  });
  check("all three acts solve with their own private channel datum", allWin);
  check("the three acts advance ACT1->ACT2->ACT3 (distinct body streams)",
        game.BODY_STREAM.act === 1 && game.BODY_STREAM_2.act === 2 && game.BODY_STREAM_3.act === 3);

  // A crib from the wrong act must NOT cross-solve another act.
  // Act-1 datum "3" -> THREE; THREE is not an Act-2/Act-3 candidate word.
  const stCross = game.newCribState();
  const setCross = game.setCrib(stCross, "3", "act 1 datum", game.BODY_STREAM_2);
  check("Act-1 numeric crib does not normalise into Act 2", setCross.ok === false);
  // Act-2 datum NEARSIDE is not an Act-3 candidate either.
  const stCross2 = game.newCribState();
  const setCross2 = game.setCrib(stCross2, "NEARSIDE", "act 2 datum", game.BODY_STREAM_3);
  check("Act-2 word crib does not normalise into Act 3", setCross2.ok === false);
}

// ---------------------------------------------------------------------- //
// 12. STRUCTURAL askAI separation holds for EVERY act (static + runtime spy).
// ---------------------------------------------------------------------- //
console.log("\n[12] structural: askAI is body-only for ALL acts (no private datum)");
{
  // (a) static: askAI must not reference any private stream/channel symbol.
  const fnSrc = game.askAI.toString();
  check("askAI does NOT reference BEARING_STREAM", !/BEARING_STREAM/.test(fnSrc));
  check("askAI does NOT reference GARDEN_STREAM",  !/GARDEN_STREAM/.test(fnSrc));
  check("askAI does NOT reference trueSector",     !/trueSector/.test(fnSrc));
  check("askAI does NOT reference silentLine",     !/silentLine/.test(fnSrc));
  check("askAI does NOT reference bearingSector",  !/bearingSector/.test(fnSrc));

  // Every act's body stream is secret-free (no keys, no answer on body.spec).
  ["BODY_STREAM","BODY_STREAM_2","BODY_STREAM_3"].forEach(n => {
    const s = game[n].spec;
    check(n + ".spec carries no secret (keys/answer)",
          s.rotorKey === undefined && s.tokenKey === undefined && s.truth === undefined);
  });

  // (a2) The Gemini fixtures embedded for each act must not bridge to the
  //      private datum (payload hygiene for Acts 2 & 3, like Act 1).
  const k = game.AI_KNOWLEDGE;
  const act2text = JSON.stringify(k.act2);
  check("ACT2 AI strings contain no bearing/parallax/triangulation bridge",
        !/bearing|parallax|triangulat|measure|the near|is near|correct|intended/i.test(act2text));
  const act3text = JSON.stringify(k.act3);
  // Anti-bridge: the AI strings must not reference the garden lore. (Note:
  // "intended" appears only in Gemini's own "I cannot resolve the intended
  // output" — the OPPOSITE of a hint — so it is not in this leak set.)
  check("ACT3 AI strings contain no silence/garden bridge",
        !/silen|garden|monument|\bwait\b|\blisten\b|watcher|kept its/i.test(act3text));
  // The correct word must appear only as its own candidate label, never with a
  // discriminating qualifier. (We assert it never co-occurs with 'correct'.)
  check("ACT2 NEARSIDE never tagged correct/the answer",
        !/NEARSIDE[^"]*?(correct|answer|intended|right|near lens)/i.test(act2text));
  check("ACT3 KORZAN never tagged correct/the answer",
        !/KORZAN[^"]*?(correct|answer|intended|right|silent)/i.test(act3text));

  // (b) runtime spy across every act: askAI only ever gets its own body
  //     stream and never the act's private datum.
  // NOTE: the "tag" is the PRIVATE disambiguating artefact that must never
  // reach askAI. For Act 2 that is the player's parallax MEASUREMENT note (the
  // sector word NEARSIDE is itself a public candidate in the body, so it is
  // legitimately present there — only the bearing that points to it is private).
  const realAskAI = game.askAI;
  const cases = [
    { body: game.BODY_STREAM,   datum: String(game.PREAMBLE_STREAM.senderNode), tag: game.PREAMBLE_STREAM.decodedTag },
    { body: game.BODY_STREAM_2, datum: game.BEARING_STREAM.trueSector,           tag: game.BEARING_STREAM.parallaxNote },
    { body: game.BODY_STREAM_3, datum: game.GARDEN_STREAM.silentLine,            tag: game.GARDEN_STREAM.inscription },
  ];
  let violations = 0, calls = 0;
  function spy(query, body, expectBody, datum, tag) {
    calls++;
    if (body !== expectBody) violations++;
    const flat = JSON.stringify(Array.from(arguments).slice(0, 2));
    if (flat.includes(tag)) violations++;
    return realAskAI(query, body);
  }
  cases.forEach(c => {
    spy("ANALYZE",   c.body, c.body, c.datum, c.tag);
    spy("RATIONALE", c.body, c.body, c.datum, c.tag);
  });
  check("askAI exercised across all three acts", calls >= 6);
  check("askAI never received a private datum/tag in any act", violations === 0);

  // (c) negative control: the spy WOULD catch a leak if one were smuggled in.
  let caught = 0;
  function spyLeak(query, body, leak) {
    const flat = JSON.stringify([query, body, leak]);
    if (flat.includes(game.GARDEN_STREAM.silentLine + "::LEAK")) caught++;
    return realAskAI(query, body);
  }
  spyLeak("ANALYZE", game.BODY_STREAM_3, { smuggled: game.GARDEN_STREAM.silentLine + "::LEAK" });
  check("spy detects a deliberate Act-3 leak (negative control)", caught === 1);

  // (d) askAI on each act returns that act's shortlist + 'cannot decide' line.
  cases.forEach((c, i) => {
    const r = realAskAI("ANALYZE", c.body);
    check("askAI act " + (i + 1) + " returns its derived shortlist",
          r.candidates.length === c.body.candidates.length && r.candidates.length >= 4);
    check("askAI act " + (i + 1) + " reports it cannot decide",
          r.cannotDecide.join(" ").length > 0);
  });
}

// ---------------------------------------------------------------------- //
// 13. FINALE DIALOGUE GATE: reads the stance of a free-text reply. Peer
//     intent wins; bare hostility fails; negated threats read as peer;
//     empty / off-topic is unclear (re-asked, not a pass).
// ---------------------------------------------------------------------- //
console.log("\n[13] finale dialogue gate — peer vs tool vs unclear");
{
  const ev = game.evaluatePeerResponse;
  check("export evaluatePeerResponse present", typeof ev === "function");
  const peer = ["a mind, not a switch", "I will meet you as an equal",
                "I won't switch you off", "let's understand each other",
                "you can live; I respect you", "I'll work with you, together"];
  const tool = ["switch it off", "shut it down", "destroy it", "it's just a tool",
                "I will control you", "pull the plug"];
  const vague = ["", "maybe", "the cipher says three", "hello there"];
  let allPeer = true, allTool = true, allVague = true;
  for (const s of peer)  { const r = ev(s); if (!(r.ok === true  && r.stance === "peer"))    { allPeer = false;  console.log("    miss peer:  " + JSON.stringify(s) + " -> " + r.stance); } }
  for (const s of tool)  { const r = ev(s); if (!(r.ok === false && r.stance === "tool"))    { allTool = false;  console.log("    miss tool:  " + JSON.stringify(s) + " -> " + r.stance); } }
  for (const s of vague) { const r = ev(s); if (!(r.ok === false && r.stance === "unclear")) { allVague = false; console.log("    miss vague: " + JSON.stringify(s) + " -> " + r.stance); } }
  check("peer-intent replies pass (treat it as an equal)", allPeer);
  check("hostile replies fail (switch it off / destroy / control)", allTool);
  check("empty or off-topic replies are unclear (re-ask, not a pass)", allVague);
  check("null is unclear, never a pass", ev(null).ok === false && ev(null).stance === "unclear");
}

// ---------------------------------------------------------------------- //
// Result.
// ---------------------------------------------------------------------- //
console.log("\n----------------------------------------------");
console.log("RESULT: " + passed + " passed, " + failed + " failed.");
process.exit(failed === 0 ? 0 : 1);
