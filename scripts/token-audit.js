#!/usr/bin/env node
/**
 * Token audit — the enforcement tooth for the Ivycoast Hub design system.
 * Reads docs/design/design-tokens.json (the canonical value set) and scans the
 * component CSS in index.html for raw literals that break the cascade:
 *   - raw hex colors used in components (should be var(--token))
 *   - NEAR-MISS hexes: a hex close to a canonical token but not exactly it
 *     (e.g. #0e423c vs the real #0e413b) — the silent drift the research flagged
 *   - raw px values in components (should be a spacing/size token)
 * Token DEFINITIONS live in :root {} blocks — raw values there are allowed.
 * Everything else in <style> is component CSS and must use var().
 *
 * Report mode by default (exit 0). Pass --gate to exit non-zero on NEW violations
 * beyond the recorded baseline (scripts/.token-audit-baseline.json).
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const tokens = require(path.join(ROOT, "docs/design/design-tokens.json"));

// ── canonical value sets from the token JSON ──
const json = JSON.stringify(tokens);
const canonHex = new Set((json.match(/#[0-9a-fA-F]{3,8}/g) || []).map(h => h.toLowerCase()));

// ── extract <style> CSS from index.html ──
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
let css = (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join("\n");
css = css.replace(/\/\*[\s\S]*?\*\//g, ""); // strip comments

// ── separate :root token-definition blocks (raw values allowed) from components ──
const rootBlocks = css.match(/:root\s*\{[^}]*\}/g) || [];
let componentCss = css;
rootBlocks.forEach(b => { componentCss = componentCss.replace(b, ""); });

function hexToRgb(h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  if (h.length > 6) h = h.slice(0, 6);
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function dist(a, b) { const x=hexToRgb(a), y=hexToRgb(b); return Math.sqrt((x[0]-y[0])**2+(x[1]-y[1])**2+(x[2]-y[2])**2); }

// ── scan component CSS ──
const rawHex = {}, nearMiss = [];
(componentCss.match(/#[0-9a-fA-F]{3,8}/g) || []).forEach(h => {
  const hl = h.toLowerCase();
  rawHex[hl] = (rawHex[hl] || 0) + 1;
  if (!canonHex.has(hl)) {
    let best = null, bd = Infinity;
    canonHex.forEach(c => { const d = dist(hl, c); if (d < bd) { bd = d; best = c; } });
    if (best && bd > 0 && bd <= 16) nearMiss.push({ hex: hl, near: best, dist: +bd.toFixed(1) });
  }
});
// raw px in components, excluding 0px and inside var() fallbacks and 1px hairlines
const pxMatches = componentCss.match(/(?<![\w-])\d+px/g) || [];
const rawPx = {};
pxMatches.forEach(p => { const n = parseInt(p); if (n !== 0 && n !== 1) rawPx[p] = (rawPx[p] || 0) + 1; });

const totalRawHex = Object.values(rawHex).reduce((a,b)=>a+b,0);
const uniqNearMiss = [...new Map(nearMiss.map(n=>[n.hex,n])).values()];
const totalRawPx = Object.values(rawPx).reduce((a,b)=>a+b,0);

// ── report ──
console.log("── Ivycoast Hub · token audit ──");
console.log(`canonical colors in token JSON: ${canonHex.size}`);
console.log(`:root definition blocks (raw values allowed): ${rootBlocks.length}`);
console.log("");
console.log(`RAW HEX in component CSS: ${totalRawHex} uses, ${Object.keys(rawHex).length} distinct  →  should be var(--token)`);
console.log(`RAW PX  in component CSS: ${totalRawPx} uses (excl. 0/1px), ${Object.keys(rawPx).length} distinct  →  should be a spacing/size token`);
console.log(`NEAR-MISS HEX (close to a token but not exact — the dangerous drift): ${uniqNearMiss.length}`);
if (uniqNearMiss.length) {
  console.log("");
  console.log("  near-miss hexes (fix these first):");
  uniqNearMiss.slice(0, 25).forEach(n => console.log(`    ${n.hex}  ≈  ${n.near}  (Δ${n.dist})`));
}
console.log("");
const topHex = Object.entries(rawHex).filter(([h])=>!canonHex.has(h)).sort((a,b)=>b[1]-a[1]).slice(0,12);
if (topHex.length) { console.log("  top raw (non-canonical) hexes by use:"); topHex.forEach(([h,c])=>console.log(`    ${h}  ×${c}`)); }

// ══ DS_HARDENING Phase 0 measurements (REPORT-ONLY — not gated yet) ══════════
// The gate above only sees <style> CSS. These sections measure what escapes it.

// 1. Inline-style blind spot: style="…" attributes + JS style writes.
const htmlNoStyleTags = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
const inlineStyleAttrs = (htmlNoStyleTags.match(/\sstyle\s*=\s*"/g) || []).length;
const cssTextWrites = (htmlNoStyleTags.match(/\.style\.cssText\s*=/g) || []).length;
const stylePropWrites = (htmlNoStyleTags.match(/\.style\.[a-zA-Z]+\s*=/g) || []).length - cssTextWrites;
console.log("");
console.log("── Phase 0 blind spots (escape the gate; report-only) ──");
console.log(`INLINE style="…" attributes: ${inlineStyleAttrs}`);
console.log(`JS .style.cssText writes: ${cssTextWrites} · JS .style.prop writes: ${stylePropWrites}`);

// 2. z-index layer inventory (a layer SCALE is the goal; raw spread is the smell).
const zVals = {};
(componentCss.match(/z-index:\s*-?\d+/g) || []).forEach(z => {
  const v = z.replace(/z-index:\s*/, ""); zVals[v] = (zVals[v] || 0) + 1;
});
const zEntries = Object.entries(zVals).sort((a,b)=>parseInt(a[0])-parseInt(b[0]));
console.log(`Z-INDEX: ${Object.values(zVals).reduce((a,b)=>a+b,0)} uses, ${zEntries.length} distinct → ${zEntries.map(([v,c])=>`${v}×${c}`).join(" ")}`);

// 3. Raw font-sizes in component CSS (should be --text-* tokens).
const rawFontPx = (componentCss.match(/font-size:\s*\d+(\.\d+)?px/g) || []).length;
console.log(`RAW FONT-SIZE px in component CSS: ${rawFontPx} → should be var(--text-*)`);

// 4. Flex auto-margin watchlist (defect class 2026-07-16: auto margins beat
//    justify/stretch — THE width bug + the Partners stranded button).
const autoMargins = (componentCss.match(/margin(?:-left|-right|-top|-bottom)?\s*:\s*[^;{}]*\bauto\b[^;{}]*/g) || []);
console.log(`AUTO MARGINS in component CSS: ${autoMargins.length} (each is fine in block flow, a landmine as a flex item — audit on container changes)`);

// 5. JSON ↔ :root sync check (Phase 1 tooling, WARN-only): every ref-token var's
//    value should exist in design-tokens.json, and vice versa for hexes.
const rootVars = {};
rootBlocks.join("\n").replace(/--([\w-]+)\s*:\s*([^;]+);/g, (_, name, val) => { rootVars[name] = val.trim(); return _; });
const jsonValues = new Set([
  ...(json.match(/"\$value"\s*:\s*"([^"]+)"/g) || []).map(m => m.replace(/"\$value"\s*:\s*"/, "").replace(/"$/, "").toLowerCase()),
  ...(json.match(/"\$value"\s*:\s*(-?\d+(?:\.\d+)?)/g) || []).map(m => m.replace(/"\$value"\s*:\s*/, "")) // unquoted numbers (font weights)
]);
const REF_PREFIXES = ["space-", "radius-", "text-", "size-", "weight-", "leading-", "ls-", "control-h-"];
const syncMisses = [];
Object.entries(rootVars).forEach(([name, val]) => {
  if (!REF_PREFIXES.some(p => name.startsWith(p))) return;
  const v = val.toLowerCase();
  if (v.startsWith("var(") || v.startsWith("calc(")) return; // derived — skip
  if (!jsonValues.has(v)) syncMisses.push(`--${name}: ${val} (value not in design-tokens.json)`);
});
const expandHex = h => { let x = h.toLowerCase().replace("#",""); if (x.length === 3) x = x.split("").map(c=>c+c).join(""); return "#"+x; };
const rootHexes = new Set((rootBlocks.join("").match(/#[0-9a-fA-F]{3,8}/g) || []).map(expandHex));
const jsonOnlyHexes = [...canonHex].map(expandHex).filter(h => !rootHexes.has(h));
console.log("");
console.log(`SYNC JSON↔:root: ${syncMisses.length} ref-token value misses · ${jsonOnlyHexes.length} JSON hexes absent from :root`);
syncMisses.slice(0, 10).forEach(m => console.log(`    ⚠ ${m}`));
if (jsonOnlyHexes.length) console.log(`    JSON-only hexes: ${jsonOnlyHexes.slice(0, 10).join(" ")}${jsonOnlyHexes.length > 10 ? " …" : ""}`);

// ── baseline / gate ──
const baselinePath = path.join(__dirname, ".token-audit-baseline.json");
const current = { rawHex: totalRawHex, rawPx: totalRawPx, nearMiss: uniqNearMiss.length };
if (process.argv.includes("--save-baseline")) {
  fs.writeFileSync(baselinePath, JSON.stringify(current, null, 2));
  console.log("\nbaseline saved →", path.relative(ROOT, baselinePath));
}
if (process.argv.includes("--gate") && fs.existsSync(baselinePath)) {
  const base = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const worse = current.rawHex > base.rawHex || current.rawPx > base.rawPx || current.nearMiss > base.nearMiss;
  if (worse) { console.error("\n✗ GATE FAILED: raw-value count increased above baseline. Use a token."); process.exit(1); }
  console.log("\n✓ gate: no new raw-value violations vs baseline.");
}
