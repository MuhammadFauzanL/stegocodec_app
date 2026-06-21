import { compressImageLossless, decompressImageLossless } from '../src/modules/image/image_codec';
import { embedLSB, extractLSB, embedLSB_OPAP, extractLSB_OPAP } from '../src/modules/image/image_stego';
import { textToBits, bitsToText } from '../src/shared/bit_utils';

// Mock ImageData for Node.js environment
(global as unknown).ImageData = class ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
};

function createDummyImage(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    // some gradient/pattern
    data[i] = (i / 4) % 256;       // R
    data[i+1] = ((i / 4) * 2) % 256; // G
    data[i+2] = 128;               // B
    data[i+3] = 255;               // A
  }
  return new ImageData(data, width, height) as ImageData;
}

function calculateMSE(original: ImageData, modified: ImageData): number {
  let sum = 0;
  for (let i = 0; i < original.data.length; i++) {
    // Only count RGB for Stego error, Alpha is untouched
    if ((i + 1) % 4 !== 0) {
      const diff = original.data[i] - modified.data[i];
      sum += diff * diff;
    }
  }
  // Total pixels * 3 (RGB channels)
  return sum / ((original.data.length / 4) * 3);
}

function calculateBER(originalBits: Uint8Array, extractedBits: Uint8Array): number {
  let errors = 0;
  const total = originalBits.length * 8;
  
  for (let i = 0; i < originalBits.length; i++) {
    let diff = originalBits[i] ^ extractedBits[i];
    while (diff > 0) {
      errors += diff & 1;
      diff >>= 1;
    }
  }
  return errors / total;
}

console.log("=== Verifikasi Tahap 2 & 3 ===");

const width = 100;
const height = 100;
const image = createDummyImage(width, height);

// 1. Verifikasi Lossless (RLE)
const compressed = compressImageLossless(image, 'rle');
const decompressed = decompressImageLossless(compressed);
let isIdentical = true;
for (let i = 0; i < image.data.length; i++) {
  if (image.data[i] !== decompressed.data[i]) {
    isIdentical = false;
    break;
  }
}
console.log(`[RLE] Kompresi dan dekompresi 100% identik: ${isIdentical}`);

// 2. Verifikasi LSB
const message = "Ini adalah pesan rahasia yang disembunyikan di dalam gambar.";
const payloadBits = textToBits(message);
const stegoLSB = embedLSB(image, payloadBits, 3); // using k=3 for noticeable MSE diff
const extractedLSBBits = extractLSB(stegoLSB, payloadBits.length * 8, 3);
const berLSB = calculateBER(payloadBits, extractedLSBBits);
const textLSB = bitsToText(extractedLSBBits);
const mseLSB = calculateMSE(image, stegoLSB);
console.log(`[LSB] Pesan terekstrak utuh: "${textLSB}"`);
console.log(`[LSB] BER (Bit Error Rate): ${berLSB}`);
console.log(`[LSB] MSE terhadap cover: ${mseLSB}`);

// 3. Verifikasi LSB + OPAP
const stegoOPAP = embedLSB_OPAP(image, payloadBits, 3);
const extractedOPAPBits = extractLSB_OPAP(stegoOPAP, payloadBits.length * 8, 3);
const berOPAP = calculateBER(payloadBits, extractedOPAPBits);
const textOPAP = bitsToText(extractedOPAPBits);
const mseOPAP = calculateMSE(image, stegoOPAP);
console.log(`[OPAP] Pesan terekstrak utuh: "${textOPAP}"`);
console.log(`[OPAP] BER (Bit Error Rate): ${berOPAP}`);
console.log(`[OPAP] MSE terhadap cover: ${mseOPAP}`);

console.log(`\nKesimpulan: MSE OPAP (${mseOPAP}) < MSE LSB (${mseLSB}) -> ${mseOPAP < mseLSB ? 'BERHASIL' : 'GAGAL'}`);

// 4. Verifikasi Pipeline Penuh (embedImage & extractImage)
import { embedImage, extractImage } from '../src/modules/image/image_stego';
import type { BuildPayloadParams } from '../src/shared/payload';

const params: BuildPayloadParams = {
    media_type: 'image',
    embedding_method: 'lsb',
    ecc_method: 'none',
    version: '5.0'
};

const stegoFull = embedImage(image, message, params, 1);
let extractedFull;
try {
    extractedFull = extractImage(stegoFull, 1);
    console.log(`[FULL PIPELINE LSB] Header Magic: ${extractedFull.header.MAGIC_CODE}`);
    console.log(`[FULL PIPELINE LSB] Pesan: ${extractedFull.extracted_message}`);
    console.log(`[FULL PIPELINE LSB] Status: BERHASIL`);
} catch (e) {
    console.log(`[FULL PIPELINE LSB] Status: GAGAL - ${e instanceof Error ? e.message : String(e)}`);
}

const paramsDCT: BuildPayloadParams = {
    media_type: 'image',
    embedding_method: 'dct_domain',
    ecc_method: 'none',
    version: '5.0'
};

try {
    const stegoDCT = embedImage(image, message, paramsDCT, 1);
    const extractedDCT = extractImage(stegoDCT, 1);
    console.log(`[FULL PIPELINE DCT] Header Magic: ${extractedDCT.header.MAGIC_CODE}`);
    console.log(`[FULL PIPELINE DCT] Pesan: ${extractedDCT.extracted_message}`);
    console.log(`[FULL PIPELINE DCT] Status: BERHASIL`);
} catch (e) {
    console.log(`[FULL PIPELINE DCT] Status: GAGAL - ${e instanceof Error ? e.message : String(e)}`);
    
    // Let's test the raw DCT bit error rate
    const { embedDCT_domain, extractDCT_domain } = await import('../src/modules/image/image_stego');
    const { buildPayload } = await import('../src/shared/payload');
    const rawPayloadBits = buildPayload(message, paramsDCT);
    const rawStegoDCT = embedDCT_domain(image, rawPayloadBits, 50);
    const rawExtractedDCTBits = extractDCT_domain(rawStegoDCT, rawPayloadBits.length, 50);
    const berDCT = calculateBER(rawPayloadBits, rawExtractedDCTBits);
    console.log(`[RAW DCT TEST] BER: ${berDCT * 100}%`);
}
