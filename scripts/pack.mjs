#!/usr/bin/env node
// fired.cv: build fired-cv.zip, the installable skill.
// Zero dependencies. Node 18+.
//
//   node scripts/pack.mjs
//
// The zip holds one folder, fired-cv/, with only what an agent needs to run
// the skill (no examples, no site). Upload it where your app takes skills, or unzip it
// into your agent's skills folder (Claude Code: ~/.claude/skills/).

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'fired-cv';
const INCLUDE = ['SKILL.md', 'LICENSE', 'templates', 'scripts/build.mjs', 'scripts/extract.mjs'];

const walk = (rel) => statSync(path.join(ROOT, rel)).isDirectory()
  ? readdirSync(path.join(ROOT, rel)).sort().flatMap((f) => walk(`${rel}/${f}`))
  : [rel];
const files = INCLUDE.flatMap(walk);

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const now = new Date();
const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

const locals = [];
const centrals = [];
let offset = 0;
for (const rel of files) {
  const data = readFileSync(path.join(ROOT, rel));
  const packed = deflateRawSync(data, { level: 9 });
  const name = Buffer.from(`${NAME}/${rel}`, 'utf8');
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8); local.writeUInt16LE(dosTime, 10); local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
  locals.push(local, name, packed);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(8, 10); central.writeUInt16LE(dosTime, 12);
  central.writeUInt16LE(dosDate, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(packed.length, 20);
  central.writeUInt32LE(data.length, 24); central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  centrals.push(central, name);

  offset += local.length + name.length + packed.length;
}

const cd = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);

const out = path.join(ROOT, `${NAME}.zip`);
writeFileSync(out, Buffer.concat([...locals, cd, end]));
console.log(`${out}  (${files.length} files, ${(statSync(out).size / 1024).toFixed(0)} KB)`);
files.forEach((f) => console.log(`  ${NAME}/${f}`));
