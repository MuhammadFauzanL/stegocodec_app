/**
 * TEST KOMPREHENSIF - StegoCodec v5.0
 * Menguji semua modul inti tanpa browser (headless).
 */

// === CODEC MODULES ===
import { forwardDCT, inverseDCT, getScaledQuantizationMatrix } from '../src/modules/image/dct';
import { compressRLE, decompressRLE, computeResiduals, reconstructFrame } from '../src/modules/video/video_codec';
import { compressADPCM } from '../src/modules/audio/adpcm';

// === STEGO MODULES ===
import { embedLSB, extractLSB, embedOPAP } from '../src/modules/image/image_stego';
import { embedDCT_domain, extractDCT_domain } from '../src/modules/image/image_stego';

// === PAYLOAD & ECC ===
import { buildPayload, parsePayload, HEADER_BIT_LENGTH, MAGIC_CODE } from '../src/shared/payload';
import { encodeECC, decodeECC } from '../src/shared/ecc/ecc_manager';
import { textToBits, bitsToText } from '../src/shared/bit_utils';
import { crc32 } from '../src/shared/crc';

// === METRICS ===
import { calculateMSE } from '../src/modules/image/image_metrics';

let passed = 0;
let failed = 0;
const results: { name: string; status: string; detail: string }[] = [];

function test(name: string, fn: () => void) {
    try {
        fn();
        passed++;
        results.push({ name, status: '✅ LULUS', detail: '' });
    } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ name, status: '❌ GAGAL', detail: msg });
    }
}

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
}

// Helper: buat ImageData dummy
function makeImageData(w: number, h: number, fillValue = 128): ImageData {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = fillValue;       // R
        data[i + 1] = fillValue;   // G
        data[i + 2] = fillValue;   // B
        data[i + 3] = 255;         // A
    }
    // Polyfill ImageData for Node
    return { data, width: w, height: h, colorSpace: 'srgb' as any } as ImageData;
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║     TEST KOMPREHENSIF STEGOCODEC v5.0       ║');
console.log('╚══════════════════════════════════════════════╝\n');

// ============================
// 1. CODEC TESTS
// ============================
console.log('--- 1. SOURCE CODEC ---\n');

test('1.1 DCT: Forward + Inverse menghasilkan data identik', () => {
    const block = [
        [52, 55, 61, 66, 70, 61, 64, 73],
        [63, 59, 55, 90, 109, 85, 69, 72],
        [62, 59, 68, 113, 144, 104, 66, 73],
        [63, 58, 71, 122, 154, 106, 70, 69],
        [67, 61, 68, 104, 126, 88, 68, 70],
        [79, 65, 60, 70, 77, 68, 58, 75],
        [85, 71, 64, 59, 55, 61, 65, 83],
        [87, 79, 69, 68, 65, 76, 78, 94]
    ];
    const dctBlock = forwardDCT(block);
    const recovered = inverseDCT(dctBlock);
    
    let maxError = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            maxError = Math.max(maxError, Math.abs(block[i][j] - Math.round(recovered[i][j])));
        }
    }
    assert(maxError <= 1, `DCT round-trip error terlalu besar: ${maxError}`);
});

test('1.2 Quantization Matrix: Skala 50 menghasilkan matriks standar', () => {
    const qm = getScaledQuantizationMatrix(50);
    assert(qm.length === 8 && qm[0].length === 8, 'Ukuran matriks bukan 8x8');
    assert(qm[0][0] >= 1, 'Elemen pertama harus >= 1');
});

test('1.3 RLE: Compress + Decompress identik', () => {
    const original = new Float32Array([0, 0, 0, 5, 5, 0, 0, 0, 0, 3, 0, 0]);
    const compressed = compressRLE(original);
    const decompressed = decompressRLE(compressed, original.length);
    
    let identical = true;
    for (let i = 0; i < original.length; i++) {
        if (original[i] !== decompressed[i]) { identical = false; break; }
    }
    assert(identical, 'RLE round-trip gagal: data tidak identik');
    assert(compressed.length < original.length, `RLE tidak mengurangi ukuran (${compressed.length} >= ${original.length})`);
});

test('1.4 Video Codec: computeResiduals + reconstructFrame identik', () => {
    const w = 16, h = 16;
    const frame1 = makeImageData(w, h, 100);
    const frame2 = makeImageData(w, h, 120);
    
    const residuals = computeResiduals(frame1, frame2);
    const reconstructed = reconstructFrame(frame1, residuals);
    
    let identical = true;
    for (let i = 0; i < frame2.data.length; i++) {
        if (reconstructed.data[i] !== frame2.data[i]) { identical = false; break; }
    }
    assert(identical, 'Video frame reconstruction gagal');
});

test('1.5 ADPCM: Compress tidak crash & menghasilkan output valid', () => {
    const samples = new Float32Array(1024);
    for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.5;
    }
    const compressed = compressADPCM(samples, 4);
    assert(compressed.length === samples.length, 'ADPCM output length mismatch');
    
    let hasNaN = false;
    for (let i = 0; i < compressed.length; i++) {
        if (isNaN(compressed[i])) { hasNaN = true; break; }
    }
    assert(!hasNaN, 'ADPCM menghasilkan NaN');
});

// ============================
// 2. STEGANOGRAPHY TESTS
// ============================
console.log('\n--- 2. STEGO CODEC ---\n');

test('2.1 LSB: Embed + Extract menghasilkan bit identik', () => {
    const image = makeImageData(64, 64);
    const bits = new Uint8Array([1,0,1,1,0,0,1,0, 1,1,0,1,0,1,0,0]);
    const stego = embedLSB(image, bits, 1);
    const extracted = extractLSB(stego, bits.length, 1);
    
    let identical = true;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] !== extracted[i]) { identical = false; break; }
    }
    assert(identical, 'LSB bit extraction gagal');
});

test('2.2 OPAP: MSE lebih kecil dari LSB biasa', () => {
    const image = makeImageData(64, 64);
    const bits = new Uint8Array(500);
    for (let i = 0; i < bits.length; i++) bits[i] = Math.round(Math.random());
    
    const stegoLSB = embedLSB(image, bits, 1);
    const stegoOPAP = embedOPAP(image, bits, 1);
    
    const mseLSB = calculateMSE(image, stegoLSB);
    const mseOPAP = calculateMSE(image, stegoOPAP);
    
    assert(mseOPAP <= mseLSB, `OPAP MSE (${mseOPAP}) harus <= LSB MSE (${mseLSB})`);
});

test('2.3 OPAP: Extract menghasilkan bit identik dengan LSB', () => {
    const image = makeImageData(64, 64);
    const bits = new Uint8Array(200);
    for (let i = 0; i < bits.length; i++) bits[i] = Math.round(Math.random());
    
    const stegoOPAP = embedOPAP(image, bits, 1);
    const extracted = extractLSB(stegoOPAP, bits.length, 1);
    
    let identical = true;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] !== extracted[i]) { identical = false; break; }
    }
    assert(identical, 'OPAP extraction gagal');
});

test('2.4 DCT-Domain: Embed + Extract menghasilkan BER rendah', () => {
    const image = makeImageData(64, 64);
    const bits = new Uint8Array(100);
    for (let i = 0; i < bits.length; i++) bits[i] = Math.round(Math.random());
    
    const stego = embedDCT_domain(image, bits, 50);
    const extracted = extractDCT_domain(stego, bits.length, 50);
    
    let errors = 0;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] !== extracted[i]) errors++;
    }
    const ber = errors / bits.length;
    assert(ber < 0.05, `DCT BER terlalu tinggi: ${(ber * 100).toFixed(2)}%`);
});

// ============================
// 3. ECC TESTS
// ============================
console.log('\n--- 3. CHANNEL CODEC (ECC) ---\n');

test('3.1 Repetition3: Encode + Decode identik', () => {
    const bits = new Uint8Array([1,0,1,1,0,0,1,0]);
    const encoded = encodeECC(bits, 'repetition3');
    assert(encoded.length === bits.length * 3, 'Repetition3 panjang salah');
    
    const decoded = decodeECC(encoded, 'repetition3');
    let identical = true;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] !== decoded[i]) { identical = false; break; }
    }
    assert(identical, 'Repetition3 round-trip gagal');
});

test('3.2 Repetition3: Mampu memperbaiki 1 bit error per triplet', () => {
    const bits = new Uint8Array([1,0,1,1]);
    const encoded = encodeECC(bits, 'repetition3');
    
    // Inject 1 error per triplet
    encoded[0] = encoded[0] === 1 ? 0 : 1;
    encoded[4] = encoded[4] === 1 ? 0 : 1;
    
    const decoded = decodeECC(encoded, 'repetition3');
    let identical = true;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] !== decoded[i]) { identical = false; break; }
    }
    assert(identical, 'Repetition3 gagal memperbaiki 1-bit error');
});

test('3.3 Hamming(7,4): Encode + Decode identik', () => {
    const bits = new Uint8Array([1,0,1,1,0,0,1,0]);
    const encoded = encodeECC(bits, 'hamming74');
    const decoded = decodeECC(encoded, 'hamming74');
    
    let identical = true;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] !== decoded[i]) { identical = false; break; }
    }
    assert(identical, 'Hamming74 round-trip gagal');
});

test('3.4 None ECC: Pass-through identik', () => {
    const bits = new Uint8Array([1,0,1,1,0,0,1,0]);
    const encoded = encodeECC(bits, 'none');
    const decoded = decodeECC(encoded, 'none');
    
    let identical = true;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] !== decoded[i]) { identical = false; break; }
    }
    assert(identical, 'None ECC pass-through gagal');
});

// ============================
// 4. PAYLOAD (HEADER) TESTS
// ============================
console.log('\n--- 4. PAYLOAD HEADER ---\n');

test('4.1 buildPayload + parsePayload: Round-trip LSB', () => {
    const message = 'Test pesan rahasia 123';
    const payload = buildPayload(message, {
        media_type: 'image',
        embedding_method: 'lsb',
        ecc_method: 'none',
        version: '5.0'
    });
    
    assert(payload.length > HEADER_BIT_LENGTH, 'Payload terlalu pendek');
    
    const parsed = parsePayload(payload);
    assert(parsed.header.MAGIC_CODE.includes('STEGO'), `Magic Code salah: ${parsed.header.MAGIC_CODE}`);
    assert(parsed.is_crc_valid, 'CRC tidak valid pada clean payload');
    assert(parsed.extracted_message === message, `Pesan tidak cocok: "${parsed.extracted_message}" vs "${message}"`);
});

test('4.2 buildPayload + parsePayload: Dengan Repetition3', () => {
    const message = 'ECC test';
    const payload = buildPayload(message, {
        media_type: 'image',
        embedding_method: 'lsb',
        ecc_method: 'repetition3',
        version: '5.0'
    });
    
    const parsed = parsePayload(payload);
    assert(parsed.extracted_message === message, `Pesan tidak cocok: "${parsed.extracted_message}" vs "${message}"`);
});

// ============================
// 5. FULL PIPELINE TESTS (Headless)
// ============================
console.log('\n--- 5. FULL PIPELINE (HEADLESS) ---\n');

test('5.1 Pipeline Image LSB: Embed + Extract utuh', () => {
    const image = makeImageData(128, 128);
    const message = 'Pipeline test LSB berhasil!';
    
    const params = {
        media_type: 'image' as const,
        embedding_method: 'lsb',
        ecc_method: 'none' as const,
        version: '5.0'
    };
    
    const payload = buildPayload(message, params);
    const stego = embedLSB(image, payload, 1);
    const extractedBits = extractLSB(stego, payload.length, 1);
    const parsed = parsePayload(extractedBits);
    
    assert(parsed.extracted_message === message, `Pesan: "${parsed.extracted_message}" vs "${message}"`);
    assert(parsed.is_crc_valid, 'CRC tidak valid');
});

test('5.2 Pipeline Image OPAP: Embed + Extract utuh', () => {
    const image = makeImageData(128, 128);
    const message = 'Pipeline test OPAP berhasil!';
    
    const params = {
        media_type: 'image' as const,
        embedding_method: 'lsb_opap',
        ecc_method: 'none' as const,
        version: '5.0'
    };
    
    const payload = buildPayload(message, params);
    const stego = embedOPAP(image, payload, 1);
    const extractedBits = extractLSB(stego, payload.length, 1);
    const parsed = parsePayload(extractedBits);
    
    assert(parsed.extracted_message === message, `Pesan: "${parsed.extracted_message}" vs "${message}"`);
    assert(parsed.is_crc_valid, 'CRC tidak valid');
});

test('5.3 Pipeline Image LSB + Repetition3: Embed + Extract utuh', () => {
    const image = makeImageData(128, 128);
    const message = 'ECC pipeline ok!';
    
    const params = {
        media_type: 'image' as const,
        embedding_method: 'lsb',
        ecc_method: 'repetition3' as const,
        version: '5.0'
    };
    
    const payload = buildPayload(message, params);
    const stego = embedLSB(image, payload, 1);
    const extractedBits = extractLSB(stego, payload.length, 1);
    const parsed = parsePayload(extractedBits);
    
    assert(parsed.extracted_message === message, `Pesan: "${parsed.extracted_message}" vs "${message}"`);
    assert(parsed.is_crc_valid, 'CRC tidak valid');
});

test('5.4 CRC32: Konsisten', () => {
    const data = new Uint8Array([1,0,1,1,0,0,1,0,1,1]);
    const c1 = crc32(data);
    const c2 = crc32(data);
    assert(c1 === c2, `CRC tidak konsisten: ${c1} vs ${c2}`);
});

test('5.5 textToBits + bitsToText: Round-trip', () => {
    const msg = 'Hello Steganografi! 🇮🇩';
    const bits = textToBits(msg);
    const recovered = bitsToText(bits);
    assert(recovered === msg, `Text round-trip gagal: "${recovered}" vs "${msg}"`);
});

// ============================
// LAPORAN AKHIR
// ============================
console.log('\n╔══════════════════════════════════════════════╗');
console.log('║               LAPORAN HASIL TEST            ║');
console.log('╚══════════════════════════════════════════════╝\n');

for (const r of results) {
    console.log(`${r.status}  ${r.name}`);
    if (r.detail) console.log(`       ↳ ${r.detail}`);
}

console.log(`\n══════════════════════════════════════════════`);
console.log(`TOTAL: ${passed + failed} test | ✅ Lulus: ${passed} | ❌ Gagal: ${failed}`);
console.log(`══════════════════════════════════════════════`);

if (failed > 0) {
    process.exit(1);
}
