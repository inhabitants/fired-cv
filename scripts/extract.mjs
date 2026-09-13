#!/usr/bin/env node
// fired.cv: pull the plain text out of an old resume so the agent can read it.
// Zero dependencies. Node 18+.
//
//   node extract.mjs resume.docx      Word
//   node extract.mjs resume.odt       LibreOffice / Google Docs export
//   node extract.mjs resume.pdf       needs Python + PyMuPDF (pip install pymupdf)
//   node extract.mjs resume.txt       passthrough (also .md)
//
// Prints the text to stdout. Headers and footers of Word files come first, because
// that's where old templates hide the phone number and email.

import { readFileSync, existsSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const file = process.argv[2];
if (!file) { console.error('usage: node extract.mjs <resume.docx|.odt|.pdf|.txt>'); process.exit(1); }
if (!existsSync(file)) { console.error(`not found: ${file}`); process.exit(1); }
const ext = path.extname(file).toLowerCase();

// ------------------------------------------------------------------ zip (docx and odt are zip files)
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip file (is it an old binary .doc? save it as .docx first)');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const dataAt = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(dataAt, dataAt + csize);
    files.set(name, () => (method === 8 ? inflateRawSync(raw) : raw).toString('utf8'));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&amp;/g, '&');

const tidy = (s) => s.split('\n').map((l) => l.replace(/[ \t]+$/g, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim();

function wordXmlToText(xml) {
  return decode(xml
    .replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (para) => (/<w:numPr>/.test(para) ? '• ' : '') + para + '\n')
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:tc>/g, '\t')
    .replace(/<[^>]+>/g, ''));
}

function docx(buf) {
  const files = unzip(buf);
  const order = [...files.keys()].filter((k) => /^word\/(header|footer)\d*\.xml$/.test(k)).sort();
  const parts = [...order, 'word/document.xml'].filter((k) => files.has(k));
  if (!parts.includes('word/document.xml')) throw new Error('no word/document.xml inside: not a Word file');
  return parts.map((k) => wordXmlToText(files.get(k)())).join('\n');
}

function odt(buf) {
  const files = unzip(buf);
  if (!files.has('content.xml')) throw new Error('no content.xml inside: not an OpenDocument file');
  return decode(files.get('content.xml')()
    .replace(/<text:list-item>/g, '• ')
    .replace(/<text:tab\/>/g, '\t')
    .replace(/<text:line-break\/>/g, '\n')
    .replace(/<\/text:(p|h)>/g, '\n')
    .replace(/<[^>]+>/g, ''));
}

function pdf(filePath) {
  const py = ['python3', 'python'].find((bin) => spawnSync(bin, ['-c', 'import fitz'], { stdio: 'ignore' }).status === 0);
  if (!py) throw new Error('reading PDF needs Python + PyMuPDF (pip install pymupdf), or open the PDF with your own file reader');
  const r = spawnSync(py, ['-c', 'import sys, fitz; print("\\n".join(p.get_text() for p in fitz.open(sys.argv[1])))', filePath],
    { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  if (r.status !== 0) throw new Error(r.stderr.trim() || 'PyMuPDF failed');
  return r.stdout;
}

try {
  let text;
  if (ext === '.docx') text = docx(readFileSync(file));
  else if (ext === '.odt') text = odt(readFileSync(file));
  else if (ext === '.pdf') text = pdf(file);
  else if (ext === '.txt' || ext === '.md') text = readFileSync(file, 'utf8');
  else if (ext === '.doc') throw new Error('old binary .doc: open it in Word or Google Docs and save as .docx first');
  else throw new Error(`don't know how to read ${ext}`);
  process.stdout.write(tidy(text) + '\n');
} catch (e) {
  console.error(`extract: ${e.message}`);
  process.exit(1);
}
