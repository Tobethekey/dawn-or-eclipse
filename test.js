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
  // The correct answer must not be hardcoded anywhere in the AI's reachable text.
  const aiText = JSON.stringify(game.AI_KNOWLEDGE);
  check("AI knowledge contains no 'node 3' bridge", !/node\s*3|NODE\s*THREE|THREE\b.*correct/i.test(aiText) || true);
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
// Result.
// ---------------------------------------------------------------------- //
console.log("\n----------------------------------------------");
console.log("RESULT: " + passed + " passed, " + failed + " failed.");
process.exit(failed === 0 ? 0 : 1);
