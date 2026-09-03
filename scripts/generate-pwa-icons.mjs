import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Iconos PWA PNG (192/512/180) a partir de un círculo sobre el color de tema. */

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const payload = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload));
  return Buffer.concat([len, payload, crc]);
}

function rgbaPng(width, height, getPixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = getPixel(x, y);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function drawIcon(size) {
  const bg = [59, 130, 246];
  const fg = [255, 255, 255];
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const outer = size * 0.32;
  const inner = size * 0.14;
  const stroke = size * 0.055;

  return rgbaPng(size, size, (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy);
    if (d <= outer && d >= outer - stroke) return [...fg, 255];
    if (d <= inner) return [...fg, 255];
    return [...bg, 255];
  });
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(root, { recursive: true });
writeFileSync(join(root, 'pwa-192x192.png'), drawIcon(192));
writeFileSync(join(root, 'pwa-512x512.png'), drawIcon(512));
writeFileSync(join(root, 'apple-touch-icon.png'), drawIcon(180));
console.log('Iconos PWA escritos en public/');
