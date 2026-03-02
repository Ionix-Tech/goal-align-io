import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://drtxejwrlyoxobvkcqrt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydHhlandybHlveG9idmtjcXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NDQwOSwiZXhwIjoyMDg1NTYwNDA5fQ.oKAnjCjg2l6zYZRVmOlJLJIauYSj81lTTNV_a-SigyM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PROJECT_ID = '989e7152-8c36-4756-93b8-662338fb4ebf';
const LEADER_ID = '338f8458-a2d4-40a1-8bb3-82f075b7aaee'; // CEO Compass

// Generate a simple PNG image with text using raw bytes
// This creates a valid 200x150 PNG with a solid color background
function createSimplePNG(r, g, b) {
  // Minimal valid PNG: 200x150 pixels, solid color
  // Using uncompressed IDAT with zlib stored blocks
  const width = 200;
  const height = 150;

  // PNG signature
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = new Uint8Array(25);
  const ihdrData = new DataView(ihdr.buffer);
  ihdrData.setUint32(0, 13); // length
  ihdr[4] = 73; ihdr[5] = 72; ihdr[6] = 68; ihdr[7] = 82; // "IHDR"
  ihdrData.setUint32(8, width);
  ihdrData.setUint32(12, height);
  ihdr[16] = 8;  // bit depth
  ihdr[17] = 2;  // color type (RGB)
  ihdr[18] = 0;  // compression
  ihdr[19] = 0;  // filter
  ihdr[20] = 0;  // interlace
  // CRC - compute manually
  const ihdrCrc = crc32(ihdr.slice(4, 21));
  ihdrData.setUint32(21, ihdrCrc);

  // Create raw image data (filter byte + RGB for each row)
  const rowBytes = 1 + width * 3; // filter byte + pixels
  const rawData = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    rawData[y * rowBytes] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const offset = y * rowBytes + 1 + x * 3;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
    }
  }

  // Compress with zlib (use deflate stored blocks)
  const zlibData = deflateStored(rawData);

  // IDAT chunk
  const idatLength = zlibData.length;
  const idat = new Uint8Array(12 + idatLength);
  const idatView = new DataView(idat.buffer);
  idatView.setUint32(0, idatLength);
  idat[4] = 73; idat[5] = 68; idat[6] = 65; idat[7] = 84; // "IDAT"
  idat.set(zlibData, 8);
  const idatCrc = crc32(idat.slice(4, 8 + idatLength));
  idatView.setUint32(8 + idatLength, idatCrc);

  // IEND chunk
  const iend = new Uint8Array(12);
  const iendView = new DataView(iend.buffer);
  iendView.setUint32(0, 0);
  iend[4] = 73; iend[5] = 69; iend[6] = 78; iend[7] = 68; // "IEND"
  const iendCrc = crc32(iend.slice(4, 8));
  iendView.setUint32(8, iendCrc);

  // Concatenate all
  const png = new Uint8Array(signature.length + ihdr.length + idat.length + iend.length);
  let offset = 0;
  png.set(signature, offset); offset += signature.length;
  png.set(ihdr, offset); offset += ihdr.length;
  png.set(idat, offset); offset += idat.length;
  png.set(iend, offset);

  return png;
}

// Deflate stored (no compression) with zlib wrapper
function deflateStored(data) {
  const maxBlock = 65535;
  const numBlocks = Math.ceil(data.length / maxBlock);
  // zlib header (2) + blocks (5 + data each) + adler32 (4)
  const totalSize = 2 + numBlocks * 5 + data.length + 4;
  const out = new Uint8Array(totalSize);
  let pos = 0;

  // Zlib header (CM=8, CINFO=7, FCHECK)
  out[pos++] = 0x78;
  out[pos++] = 0x01;

  for (let i = 0; i < numBlocks; i++) {
    const start = i * maxBlock;
    const end = Math.min(start + maxBlock, data.length);
    const blockLen = end - start;
    const isLast = (i === numBlocks - 1);

    out[pos++] = isLast ? 0x01 : 0x00; // BFINAL + BTYPE=00
    out[pos++] = blockLen & 0xFF;
    out[pos++] = (blockLen >> 8) & 0xFF;
    out[pos++] = (~blockLen) & 0xFF;
    out[pos++] = ((~blockLen) >> 8) & 0xFF;
    out.set(data.slice(start, end), pos);
    pos += blockLen;
  }

  // Adler32 checksum
  const adler = adler32(data);
  out[pos++] = (adler >> 24) & 0xFF;
  out[pos++] = (adler >> 16) & 0xFF;
  out[pos++] = (adler >> 8) & 0xFF;
  out[pos++] = adler & 0xFF;

  return out.slice(0, pos);
}

function adler32(data) {
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return (b << 16) | a;
}

// CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

async function main() {
  // Create colored placeholder images
  const currentImages = [
    { name: 'estoque-desorganizado.png', color: [220, 80, 60] },    // Red-ish - problem
    { name: 'processo-manual.png', color: [200, 100, 70] },          // Orange-ish - problem
  ];

  const targetImages = [
    { name: 'estoque-organizado.png', color: [60, 180, 100] },       // Green - solution
    { name: 'processo-automatizado.png', color: [50, 160, 120] },    // Teal - solution
  ];

  console.log('Uploading current situation images...');
  for (const img of currentImages) {
    const png = createSimplePNG(...img.color);
    const filePath = `${PROJECT_ID}/current_situation/${img.name}`;

    const { error: uploadError } = await supabase.storage
      .from('project-attachments')
      .upload(filePath, png, { contentType: 'image/png', upsert: true });

    if (uploadError) {
      console.error(`Upload error (${img.name}):`, uploadError);
      continue;
    }

    const { error: dbError } = await supabase.from('project_attachments').insert({
      project_id: PROJECT_ID,
      file_name: img.name,
      file_path: filePath,
      file_type: 'image/png',
      file_size: png.length,
      category: 'current_situation',
      uploaded_by: LEADER_ID,
    });

    if (dbError) {
      console.error(`DB error (${img.name}):`, dbError);
    } else {
      console.log(`  ✓ ${img.name} uploaded`);
    }
  }

  console.log('Uploading target situation images...');
  for (const img of targetImages) {
    const png = createSimplePNG(...img.color);
    const filePath = `${PROJECT_ID}/target_situation/${img.name}`;

    const { error: uploadError } = await supabase.storage
      .from('project-attachments')
      .upload(filePath, png, { contentType: 'image/png', upsert: true });

    if (uploadError) {
      console.error(`Upload error (${img.name}):`, uploadError);
      continue;
    }

    const { error: dbError } = await supabase.from('project_attachments').insert({
      project_id: PROJECT_ID,
      file_name: img.name,
      file_path: filePath,
      file_type: 'image/png',
      file_size: png.length,
      category: 'target_situation',
      uploaded_by: LEADER_ID,
    });

    if (dbError) {
      console.error(`DB error (${img.name}):`, dbError);
    } else {
      console.log(`  ✓ ${img.name} uploaded`);
    }
  }

  // Verify
  const { data: attachments } = await supabase
    .from('project_attachments')
    .select('id, file_name, category, file_path')
    .eq('project_id', PROJECT_ID)
    .in('category', ['current_situation', 'target_situation']);

  console.log('\n=== Attachments in DB ===');
  console.log(JSON.stringify(attachments, null, 2));

  // Test signed URL
  if (attachments?.length) {
    const { data: urlData } = await supabase.storage
      .from('project-attachments')
      .createSignedUrl(attachments[0].file_path, 3600);
    console.log('\nSample signed URL:', urlData?.signedUrl?.substring(0, 80) + '...');
  }

  console.log('\n=== DONE ===');
  console.log(`Abra: http://localhost:8080/execution/${PROJECT_ID}`);
}

main().catch(console.error);
