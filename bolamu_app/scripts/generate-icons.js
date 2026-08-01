/**
 * Génère les icônes de l'app (icon.png, android-icon-foreground.png, favicon.png)
 * à partir de assets/logo.png — pur Node, zéro dépendance.
 *
 * Usage : node scripts/generate-icons.js
 */
'use strict';

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'logo.png');
const BPP = 4; // RGBA
const GREEN = [0x16, 0xa3, 0x4a, 0xff]; // vert Bolamu (#16A34A)

// ── Lecture / décodage PNG ──────────────────────────────────────────────
const data = fs.readFileSync(SRC);

let pos = 8;
const chunks = [];
while (pos < data.length) {
  const len = data.readUInt32BE(pos);
  const type = data.toString('ascii', pos + 4, pos + 8);
  chunks.push({ type, body: data.subarray(pos + 8, pos + 8 + len) });
  pos += 12 + len;
}

const ihdr = chunks.find((c) => c.type === 'IHDR').body;
const width = ihdr.readUInt32BE(0);
const height = ihdr.readUInt32BE(4);
if (ihdr.readUInt8(8) !== 8 || ihdr.readUInt8(9) !== 6) {
  throw new Error('Logo non supporté : attendu PNG 8-bit RGBA');
}

const raw = zlib.inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.body)));
const stride = width * BPP;

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

// Unfilter (filtres PNG 0-4)
const pixels = Buffer.alloc(width * height * BPP);
for (let y = 0; y < height; y++) {
  const filter = raw[y * (stride + 1)];
  const rowStart = y * (stride + 1) + 1;
  for (let x = 0; x < width; x++) {
    const outIdx = y * stride + x * BPP;
    for (let c = 0; c < BPP; c++) {
      const rawV = raw[rowStart + x * BPP + c];
      const left = x > 0 ? pixels[outIdx - BPP + c] : 0;
      const up = y > 0 ? pixels[outIdx - stride + c] : 0;
      const upLeft = x > 0 && y > 0 ? pixels[outIdx - stride - BPP + c] : 0;
      let v;
      switch (filter) {
        case 0: v = rawV; break;
        case 1: v = rawV + left; break;
        case 2: v = rawV + up; break;
        case 3: v = rawV + ((left + up) >> 1); break;
        case 4: v = rawV + paeth(left, up, upLeft); break;
        default: throw new Error('Filtre PNG inconnu : ' + filter);
      }
      pixels[outIdx + c] = v & 0xff;
    }
  }
}

// ── Helpers pixel ───────────────────────────────────────────────────────
function cropSquare(src, w, h) {
  const size = Math.min(w, h);
  const sx = Math.floor((w - size) / 2);
  const sy = Math.floor((h - size) / 2);
  const out = Buffer.alloc(size * size * BPP);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      for (let c = 0; c < BPP; c++) {
        out[(y * size + x) * BPP + c] = src[((y + sy) * w + (x + sx)) * BPP + c];
      }
    }
  }
  return { data: out, size };
}

function scaleNearest(srcData, srcSize, dstSize) {
  const out = Buffer.alloc(dstSize * dstSize * BPP);
  for (let y = 0; y < dstSize; y++) {
    const sy = Math.min(srcSize - 1, Math.floor((y * srcSize) / dstSize));
    for (let x = 0; x < dstSize; x++) {
      const sx = Math.min(srcSize - 1, Math.floor((x * srcSize) / dstSize));
      for (let c = 0; c < BPP; c++) {
        out[(y * dstSize + x) * BPP + c] = srcData[(sy * srcSize + sx) * BPP + c];
      }
    }
  }
  return out;
}

function pasteCentered(srcData, srcSize, canvasSize) {
  const out = Buffer.alloc(canvasSize * canvasSize * BPP); // transparent
  const off = Math.floor((canvasSize - srcSize) / 2);
  for (let y = 0; y < srcSize; y++) {
    for (let x = 0; x < srcSize; x++) {
      for (let c = 0; c < BPP; c++) {
        out[((y + off) * canvasSize + (x + off)) * BPP + c] = srcData[(y * srcSize + x) * BPP + c];
      }
    }
  }
  return out;
}

function pixelAt(src, size, x, y) {
  return [src[(y * size + x) * BPP], src[(y * size + x) * BPP + 1], src[(y * size + x) * BPP + 2], src[(y * size + x) * BPP + 3]];
}

function cornerAlpha(src, size) {
  const pts = [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1], [Math.floor(size / 2), Math.floor(size / 2)]];
  return pts.map(([x, y]) => pixelAt(src, size, x, y)[3]);
}

function roundedRectMask(size, radius) {
  const x0 = radius, y0 = radius, x1 = size - 1 - radius, y1 = size - 1 - radius;
  return (x, y) => {
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return true;
    const cx = x < x0 ? x0 : x > x1 ? x1 : x;
    const cy = y < y0 ? y0 : y > y1 ? y1 : y;
    const dx = x - cx, dy = y - cy;
    return dx * dx + dy * dy <= radius * radius;
  };
}

function compositeOnRoundedGreen(logoData, size) {
  const out = Buffer.alloc(size * size * BPP);
  const inside = roundedRectMask(size, Math.round(size * 0.22));
  const logoSize = Math.round(size * 0.72);
  const scaled = scaleNearest(logoData, size, logoSize);
  const off = Math.floor((size - logoSize) / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * BPP;
      if (!inside(x, y)) { out[o + 3] = 0; continue; }
      // fond vert
      out[o] = GREEN[0]; out[o + 1] = GREEN[1]; out[o + 2] = GREEN[2]; out[o + 3] = 255;
      // logo centré (seulement là où le logo est opaque)
      if (x >= off && x < off + logoSize && y >= off && y < off + logoSize) {
        const lo = ((y - off) * logoSize + (x - off)) * BPP;
        const la = scaled[lo + 3];
        if (la > 0) {
          for (let c = 0; c < 3; c++) out[o + c] = scaled[lo + c];
          out[o + 3] = 255;
        }
      }
    }
  }
  return out;
}

// ── Encodage PNG ────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, 'ascii');
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

function encodePng(size, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const s = size * BPP;
  const rawBuf = Buffer.alloc(size * (s + 1));
  for (let y = 0; y < size; y++) {
    rawBuf[y * (s + 1)] = 0; // filtre None
    px.copy(rawBuf, y * (s + 1) + 1, y * s, (y + 1) * s);
  }
  const idat = zlib.deflateSync(rawBuf, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Pipeline ────────────────────────────────────────────────────────────
const square = cropSquare(pixels, width, height);
const alphas = cornerAlpha(square.data, square.size);
const hasTransparency = alphas.slice(0, 4).every((a) => a === 0);

console.log(`Logo : ${width}x${height} — crop carré ${square.size}x${square.size}`);
console.log(`Transparence aux coins : ${hasTransparency ? 'OUI (fond transparent)' : 'NON (fond opaque)'}`);

const assets = path.join(ROOT, 'assets');

// icon.png — carré plein (ou vert arrondi + logo si fond transparent)
if (hasTransparency) {
  const composed = compositeOnRoundedGreen(square.data, square.size);
  fs.writeFileSync(path.join(assets, 'icon.png'), encodePng(square.size, composed));
  console.log('icon.png : vert arrondi + logo (fond transparent détecté)');
} else {
  fs.writeFileSync(path.join(assets, 'icon.png'), encodePng(square.size, square.data));
  console.log('icon.png : crop direct du logo');
}

// android-icon-foreground.png — logo à ~66% sur canevas transparent 1024 (zone sûre adaptive)
const fgSize = Math.round(square.size * 0.66);
const fg = scaleNearest(square.data, square.size, fgSize);
fs.writeFileSync(path.join(assets, 'android-icon-foreground.png'), encodePng(square.size, pasteCentered(fg, fgSize, square.size)));
console.log('android-icon-foreground.png : logo à 66% sur canevas 1024 transparent');

// favicon.png — 48x48
fs.writeFileSync(path.join(assets, 'favicon.png'), encodePng(48, scaleNearest(square.data, square.size, 48)));
console.log('favicon.png : 48x48');

console.log('✅ Icônes générées dans assets/');
