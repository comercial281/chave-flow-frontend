// Gera ícones PNG para o PWA usando apenas Node.js built-ins (sem dependências externas)
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let n = i;
    for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    table[i] = n;
  }
  for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length);
  const crcData = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(crcData));
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function makePNG(size, r, g, b) {
  // IHDR
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);   // width
  ihdr.writeUInt32BE(size, 4);   // height
  ihdr.writeUInt8(8, 8);         // bit depth
  ihdr.writeUInt8(2, 9);         // color type: RGB
  ihdr.writeUInt8(0, 10);        // compression
  ihdr.writeUInt8(0, 11);        // filter
  ihdr.writeUInt8(0, 12);        // interlace

  // Pixel data: each row starts with filter byte (0 = None)
  const rowSize = 1 + size * 3;
  const raw = Buffer.allocUnsafe(size * rowSize);
  for (let y = 0; y < size; y++) {
    const offset = y * rowSize;
    raw[offset] = 0; // filter type None
    for (let x = 0; x < size; x++) {
      raw[offset + 1 + x * 3] = r;
      raw[offset + 1 + x * 3 + 1] = g;
      raw[offset + 1 + x * 3 + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Cor principal: #7c3aed (violeta LM Flow)
const R = 0x7c, G = 0x3a, B = 0xed;
// Cor maskable: mesma, mas safe area é só o centro

const outDir = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512 },
];

for (const { name, size } of sizes) {
  const png = makePNG(size, R, G, B);
  fs.writeFileSync(path.join(outDir, name), png);
  console.log(`✓ ${name} (${size}x${size}, ${png.length} bytes)`);
}

// Apple touch icon 180x180
const apple = makePNG(180, R, G, B);
fs.writeFileSync(path.join(__dirname, 'public', 'apple-touch-icon.png'), apple);
console.log('✓ apple-touch-icon.png (180x180)');

console.log('\nÍcones gerados em public/icons/');
