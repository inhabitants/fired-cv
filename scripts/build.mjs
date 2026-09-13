#!/usr/bin/env node
// fired.cv: resume HTML -> one-page A4 PDF (+ PNG preview) with headless Chrome or Edge.
// Zero dependencies. Node 18+.
//
//   node build.mjs resume.html
//   node build.mjs resume.html --photo me.jpg --pos "center 30%"
//   node build.mjs resume.html --out ./out --no-png
//   node build.mjs resume.html --theme jade        render with one color theme (file gets -jade)
//   node build.mjs resume.html --themes            PNG of every theme + one side-by-side sheet
//
// What it checks, because these break with no error:
//   1. letter-spacing too wide  -> the PDF text layer reads "E X P E R I E N C E"
//   2. text-shadow on text      -> the text layer carries every word twice
//   3. more than one page       -> the resume is not a resume anymore
//   4. (if Python + PyMuPDF are installed) the real extracted text, looking for 1

import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir, platform } from 'node:os';
import path from 'node:path';

// ------------------------------------------------------------------ args
const argv = process.argv.slice(2);
const WITH_VALUE = new Set(['photo', 'pos', 'out', 'theme']);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) { positional.push(a); continue; }
  const name = a.slice(2);
  flags[name] = WITH_VALUE.has(name) ? (argv[++i] ?? null) : true;
}

const input = positional[0];
if (!input || flags.help) {
  console.log('usage: node build.mjs <resume.html> [--photo file] [--pos "center 22%"] [--theme name | --themes] [--out dir] [--no-png]');
  process.exit(input ? 0 : 1);
}
const src = path.resolve(input);
if (!existsSync(src)) { console.error(`not found: ${src}`); process.exit(1); }

const outDir = path.resolve(flags.out || path.dirname(src));
let base = path.basename(src).replace(/\.html?$/i, '');
let html = readFileSync(src, 'utf8');
let failed = false;

// ------------------------------------------------------------------ lint
// Only the <style> blocks matter. Each rule is checked with its own font-size when it has one.
const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');

const toMm = (num, unit) => {
  const n = parseFloat(num);
  switch ((unit || '').toLowerCase()) {
    case 'mm': return n;
    case 'cm': return n * 10;
    case 'px': return n * 0.264583;
    case 'pt': return n * 0.352778;
    default: return null; // em, rem, % -> relative, handled apart
  }
};

for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selector = rule[1].trim().split('\n').pop().trim();
  const body = rule[2];

  const shadow = body.match(/text-shadow\s*:\s*([^;]+)/i);
  if (shadow && !/^\s*none\s*$/i.test(shadow[1])) {
    console.error(`ERROR  ${selector}: text-shadow draws the text twice in the PDF. Use box-shadow on a box, never on letters.`);
    failed = true;
  }

  const ls = body.match(/letter-spacing\s*:\s*(-?[\d.]+)\s*(mm|cm|px|pt|em|rem)?/i);
  if (!ls || parseFloat(ls[1]) <= 0) continue;
  const fs = body.match(/font-size\s*:\s*([\d.]+)\s*(mm|cm|px|pt)/i);
  let ratio = null;
  if (/r?em/i.test(ls[2] || '')) ratio = parseFloat(ls[1]);
  else if (fs) ratio = toMm(ls[1], ls[2]) / toMm(fs[1], fs[2]);
  const absMm = toMm(ls[1], ls[2]);
  const tooWide = ratio !== null ? ratio > 0.13 : absMm !== null && absMm > 0.38;
  if (tooWide) {
    const how = ratio !== null ? `${(ratio).toFixed(2)}em` : `${absMm.toFixed(2)}mm`;
    console.error(`ERROR  ${selector}: letter-spacing ${how} splits words letter by letter in the PDF text layer. Keep it at or under 0.1em.`);
    failed = true;
  }
}

// ------------------------------------------------------------------ photo
if (flags.photo) {
  const photoPath = path.resolve(flags.photo);
  if (!existsSync(photoPath)) { console.error(`photo not found: ${photoPath}`); process.exit(1); }
  const buf = readFileSync(photoPath);
  if (buf.length > 4 * 1024 * 1024) { console.error('photo over 4MB: export a ~800px square crop and try again'); process.exit(1); }
  const mime =
    buf[0] === 0x89 && buf[1] === 0x50 ? 'image/png' :
    buf[0] === 0xff && buf[1] === 0xd8 ? 'image/jpeg' :
    buf.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : null;
  if (!mime) { console.error('photo must be PNG, JPEG or WebP'); process.exit(1); }
  const pos = flags.pos || 'center 22%';
  const img = `<img class="photo" style="object-position:${pos}" src="data:${mime};base64,${buf.toString('base64')}" alt="">`;
  // only inside <body>: the template's instructions comment mentions both tags too
  const cut = Math.max(0, html.search(/<body[\s>]/i));
  const head = html.slice(0, cut);
  const bodyPart = html.slice(cut);
  const slot = /<div class="monogram">[^<]*<\/div>/.test(bodyPart) ? /<div class="monogram">[^<]*<\/div>/ : /<img class="photo"[^>]*>/;
  const swapped = bodyPart.replace(slot, img);
  const before = html;
  html = head + swapped;
  if (html === before) console.warn('warning: no photo slot in this template (classic has none by design); photo ignored');
  else console.log(`photo: ${path.basename(photoPath)} (${(buf.length / 1024).toFixed(0)} KB), framed at "${pos}"`);
}

if (failed) {
  console.error('\nFix the errors above and build again. Nothing was rendered.');
  process.exit(2);
}

// ------------------------------------------------------------------ browser
function findBrowser() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const os = platform();
  const candidates = os === 'win32' ? [
    `${process.env['PROGRAMFILES']}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${process.env['PROGRAMFILES']}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ] : os === 'darwin' ? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ] : [];
  const hit = candidates.find((p) => p && existsSync(p));
  if (hit) return hit;
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    const r = spawnSync(os === 'win32' ? 'where' : 'which', [bin], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0];
  }
  return null;
}

const browser = findBrowser();
if (!browser) {
  console.error('No Chrome, Chromium or Edge found. Set CHROME_PATH, or open the .html in a browser and print to PDF (A4, margins: none).');
  process.exit(1);
}

// ------------------------------------------------------------------ render
mkdirSync(outDir, { recursive: true });
const run = (args) => execFileSync(browser, args, { stdio: ['ignore', 'ignore', 'ignore'] });
const fileUrl = (p) => 'file:///' + p.replace(/\\/g, '/').replace(/^\/+/, '');

// Writes the HTML to a temp dir and asks the browser for a PDF and/or a PNG screenshot.
function render(page, name, { pdf = true, png = true, size = '794,1123' } = {}) {
  const work = mkdtempSync(path.join(tmpdir(), 'fired-cv-'));
  const built = path.join(work, `${name}.html`);
  writeFileSync(built, page, 'utf8');
  const common = ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--user-data-dir=${path.join(work, 'profile')}`, '--virtual-time-budget=15000'];
  const out = { pdf: path.join(outDir, `${name}.pdf`), png: path.join(outDir, `${name}.png`) };
  if (pdf) run([...common, '--no-pdf-header-footer', `--print-to-pdf=${out.pdf}`, fileUrl(built)]);
  if (png) run([...common, `--window-size=${size}`, `--screenshot=${out.png}`, fileUrl(built)]);
  rmSync(work, { recursive: true, force: true });
  return out;
}

// ------------------------------------------------------------------ themes
// Theme names come from the template's own CSS: html[data-theme="name"]{...}
const themes = [...new Set([...html.matchAll(/data-theme="([\w-]+)"\]/g)].map((m) => m[1]))];
// The templates' instruction comment mentions <html data-theme> too: touch only the real tag.
const withTheme = (page, name) => {
  const tags = [...page.matchAll(/<html\b[^>]*>/gi)];
  const real = tags.find((m) => page.lastIndexOf('<!--', m.index) <= page.lastIndexOf('-->', m.index));
  if (!real) return page;
  const tag = /\bdata-theme="/i.test(real[0])
    ? real[0].replace(/\bdata-theme="[^"]*"/i, `data-theme="${name}"`)
    : real[0].replace(/<html\b/i, `<html data-theme="${name}"`);
  return page.slice(0, real.index) + tag + page.slice(real.index + real[0].length);
};

if (flags.theme || flags.themes) {
  if (!themes.length) { console.error('this template defines no themes (look for html[data-theme="..."] in its CSS)'); process.exit(1); }
  if (flags.theme && !themes.includes(flags.theme)) { console.error(`unknown theme "${flags.theme}". available: ${themes.join(', ')}`); process.exit(1); }
}

if (flags.themes) {
  // A preview for the person to choose from: one PNG per theme and a side-by-side sheet.
  const shots = themes.map((t) => {
    const { png } = render(withTheme(html, t), `${base}-${t}`, { pdf: false });
    console.log(`PNG: ${png}`);
    return { t, png };
  });
  const W = 300, H = Math.round(W * 1123 / 794), GAP = 22;
  const sheet = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#F3F2F0;font:600 15px system-ui,sans-serif;color:#3A3A3A">
<div style="display:flex;gap:${GAP}px;padding:${GAP}px">${shots.map(({ t, png }) =>
    `<figure style="margin:0;text-align:center"><img src="${fileUrl(png)}" width="${W}" height="${H}" style="display:block;border-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,.14)"><figcaption style="margin-top:10px">${t}</figcaption></figure>`).join('')}</div>`;
  const { png } = render(sheet, `${base}-themes`, { pdf: false, size: `${GAP + shots.length * (W + GAP)},${H + 2 * GAP + 30}` });
  console.log(`sheet: ${png}`);
  process.exit(0);
}

if (flags.theme) {
  html = withTheme(html, flags.theme);
  base = `${base}-${flags.theme}`;
}

const { pdf, png } = render(html, base, { png: !flags['no-png'] });

// ------------------------------------------------------------------ verify
let pages = (readFileSync(pdf).toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length || null;

// The text layer is what an applicant tracking system actually reads. Python + PyMuPDF
// (pip install pymupdf) turn on the real check; without them only the lint above ran.
const py = ['python3', 'python'].find((bin) => spawnSync(bin, ['-c', 'import fitz'], { stdio: 'ignore' }).status === 0);
if (!py) {
  console.log('text layer not checked (optional: pip install pymupdf)');
} else {
  const code = [
    'import sys, fitz, json',
    'd = fitz.open(sys.argv[1])',
    'print(json.dumps({"pages": d.page_count, "text": "\\n".join(p.get_text() for p in d)}))',
  ].join('\n');
  const r = spawnSync(py, ['-c', code, pdf], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  if (r.status === 0) {
    const { pages: n, text } = JSON.parse(r.stdout);
    pages = n;
    const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const flat = norm(text);

    // 1. letter-spaced words
    const spaced = text.match(/(?:\b\w ){4,}\w\b/g) || [];
    if (spaced.length) { console.error(`ERROR  letter-spaced words in the text layer: ${spaced.slice(0, 3).join(' | ')}`); failed = true; }

    // 2. the same line twice in a row (text-shadow draws it twice)
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 12);
    const dup = [...new Set(lines.filter((l, i) => i && lines[i - 1] === l))];
    if (dup.length) { console.error(`ERROR  repeated lines in the text layer (text-shadow?): ${dup.slice(0, 3).join(' | ')}`); failed = true; }

    // 3. reading order: headings, titles and bullets must come out in the order they are written
    const decode = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
    const body = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, '');
    const anchors = [...body.matchAll(/<(h1|h2|h3|li)\b[^>]*>([\s\S]*?)<\/\1>|<div class="(?:job-title|name)"[^>]*>([\s\S]*?)<\/div>/gi)]
      .map((m) => norm(decode(m[2] ?? m[3])).slice(0, 28))
      .filter((a) => a.length >= 4);
    let at = 0;
    for (const a of anchors) {
      const next = flat.indexOf(a, at);
      if (next === -1) {
        if (flat.includes(a)) {
          console.error(`ERROR  reading order broken near "${a}": it comes out earlier in the PDF text than in the page. Usually a position:relative on some blocks and not their siblings.`);
          failed = true;
          break;
        }
        continue; // not found at all (ligature, hyphenation): skip, don't guess
      }
      at = next + a.length;
    }
    if (!failed) console.log(`text layer OK (${anchors.length} anchors in order), starts with: ${JSON.stringify(flat.slice(0, 70))}`);
  }
}

console.log(`PDF: ${pdf}  (${pages ?? '?'} page${pages === 1 ? '' : 's'})`);
if (!flags['no-png']) console.log(`PNG: ${png}`);
if (pages && pages > 1) {
  console.error('ERROR  more than one page. Tighten spacing in this order: bullet line-height, gap between jobs, top padding, then cut the weakest bullet.');
  failed = true;
}
process.exit(failed ? 3 : 0);
