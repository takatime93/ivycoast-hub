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
