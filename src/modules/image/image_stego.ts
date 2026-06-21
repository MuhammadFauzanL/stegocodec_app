import { type ParsedPayload, type BuildPayloadParams, buildPayload, parsePayloadHeader, HEADER_BIT_LENGTH, parsePayload, MAGIC_CODE } from '../../shared/payload';
import { forwardDCT, inverseDCT, getScaledQuantizationMatrix, quantizeBlock, dequantizeBlock } from './image_codec';

// Helper to set k-LSB
function setLSBs(value: number, bitsToEmbed: number, k: number): number {
    const mask = ~((1 << k) - 1);
    return (value & mask) | bitsToEmbed;
}

// Helper to get k-LSB
function getLSBs(value: number, k: number): number {
    const mask = (1 << k) - 1;
    return value & mask;
}

export function embedLSB(image: ImageData, bits: Uint8Array, k: number = 1): ImageData {
    const outData = new Uint8ClampedArray(image.data);
    let bitIndex = 0;
    const totalBits = bits.length;
    
    for (let i = 0; i < outData.length && bitIndex < totalBits; i++) {
        if ((i + 1) % 4 === 0) continue; // Skip Alpha channel
        
        let bitsToEmbed = 0;
        let bitsExtracted = 0;
        for (let j = 0; j < k && bitIndex < totalBits; j++) {
            const bit = bits[bitIndex];
            bitsToEmbed = (bitsToEmbed << 1) | bit;
            bitsExtracted++;
            bitIndex++;
        }
        
        if (bitsExtracted < k) {
             bitsToEmbed = bitsToEmbed << (k - bitsExtracted);
        }

        outData[i] = setLSBs(outData[i], bitsToEmbed, k);
    }
    
    return new ImageData(outData, image.width, image.height);
}

export function extractLSB(image: ImageData, bitCount: number, k: number = 1): Uint8Array {
    const outBits = new Uint8Array(bitCount);
    let bitIndex = 0;
    
    for (let i = 0; i < image.data.length && bitIndex < bitCount; i++) {
        if ((i + 1) % 4 === 0) continue; // Skip Alpha
        
        const pixelValue = image.data[i];
        const lsbs = getLSBs(pixelValue, k);
        
        for (let j = 0; j < k && bitIndex < bitCount; j++) {
            const bit = (lsbs >> (k - 1 - j)) & 1;
            outBits[bitIndex] = bit;
            bitIndex++;
        }
    }
    return outBits;
}

export function embedLSB_OPAP(image: ImageData, bits: Uint8Array, k: number = 1): ImageData {
    const outData = new Uint8ClampedArray(image.data);
    let bitIndex = 0;
    const totalBits = bits.length;
    
    for (let i = 0; i < outData.length && bitIndex < totalBits; i++) {
        if ((i + 1) % 4 === 0) continue; // Skip Alpha
        
        let bitsToEmbed = 0;
        let bitsExtracted = 0;
        for (let j = 0; j < k && bitIndex < totalBits; j++) {
            const bit = bits[bitIndex];
            bitsToEmbed = (bitsToEmbed << 1) | bit;
            bitsExtracted++;
            bitIndex++;
        }
        if (bitsExtracted < k) {
             bitsToEmbed = bitsToEmbed << (k - bitsExtracted);
        }

        const x = outData[i];
        const x_prime = setLSBs(x, bitsToEmbed, k);
        
        // OPAP Logic
        const d = x_prime - x;
        
        if (d > Math.pow(2, k - 1) && x_prime >= Math.pow(2, k)) {
            outData[i] = x_prime - Math.pow(2, k);
        } else if (d < -Math.pow(2, k - 1) && x_prime < (256 - Math.pow(2, k))) {
            outData[i] = x_prime + Math.pow(2, k);
        } else {
            outData[i] = x_prime;
        }
    }
    
    return new ImageData(outData, image.width, image.height);
}

export function extractLSB_OPAP(image: ImageData, bitCount: number, k: number = 1): Uint8Array {
    return extractLSB(image, bitCount, k);
}

// --- DCT DOMAIN EMBEDDING ---
// Coordinates in 8x8 block for mid-frequency embedding.
const DCT_EMBED_COORDS = [
    [1, 2], [2, 1], [0, 3], [3, 0], [2, 2], [1, 3], [3, 1], [0, 4], [4, 0], [1, 4]
];

export function embedDCT_domain(image: ImageData, bits: Uint8Array, quality: number = 50): ImageData {
    const qMatrix = getScaledQuantizationMatrix(quality);
    const width = image.width;
    const height = image.height;
    const outData = new Uint8ClampedArray(image.data);
    
    let bitIndex = 0;
    const totalBits = bits.length;

    for (let by = 0; by < height; by += 8) {
        for (let bx = 0; bx < width; bx += 8) {
            for (let c = 0; c < 3; c++) {
                const block = new Float32Array(64);
                
                for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 8; x++) {
                        const px = bx + x;
                        const py = by + y;
                        if (px < width && py < height) {
                            const idx = (py * width + px) * 4 + c;
                            block[y * 8 + x] = outData[idx] - 128.0;
                        }
                    }
                }
                
                const dctBlock = forwardDCT(block);
                const quantBlock = quantizeBlock(dctBlock, qMatrix);
                
                // Embed bits into LSB of quantized mid-frequency coefficients
                for (const [u, v] of DCT_EMBED_COORDS) {
                    if (bitIndex < totalBits) {
                        const idx = v * 8 + u;
                        let val = quantBlock[idx];
                        const bitToEmbed = bits[bitIndex];
                        
                        let absVal = Math.abs(val);
                        const target = bitToEmbed === 1 ? 2 : 0;
                        absVal = Math.round((absVal - target) / 4) * 4 + target;
                        quantBlock[idx] = val < 0 ? -absVal : absVal;
                        bitIndex++;
                    }
                }
                
                const dequantBlock = dequantizeBlock(quantBlock, qMatrix);
                const idctBlock = inverseDCT(dequantBlock);
                
                for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 8; x++) {
                        const px = bx + x;
                        const py = by + y;
                        if (px < width && py < height) {
                            const idx = (py * width + px) * 4 + c;
                            const val = Math.round(idctBlock[y * 8 + x] + 128.0);
                            outData[idx] = Math.max(0, Math.min(255, val));
                        }
                    }
                }
            }
        }
    }
    
    if (bitIndex < totalBits) {
        throw new Error("Payload too large for DCT embedding at this resolution.");
    }
    
    return new ImageData(outData, width, height);
}

export function extractDCT_domain(image: ImageData, bitCount: number, quality: number = 50): Uint8Array {
    const qMatrix = getScaledQuantizationMatrix(quality);
    const width = image.width;
    const height = image.height;
    
    const outBits = new Uint8Array(bitCount);
    let bitIndex = 0;

    for (let by = 0; by < height; by += 8) {
        for (let bx = 0; bx < width; bx += 8) {
            for (let c = 0; c < 3; c++) {
                const block = new Float32Array(64);
                
                for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 8; x++) {
                        const px = bx + x;
                        const py = by + y;
                        if (px < width && py < height) {
                            const idx = (py * width + px) * 4 + c;
                            block[y * 8 + x] = image.data[idx] - 128.0;
                        }
                    }
                }
                
                const dctBlock = forwardDCT(block);
                const quantBlock = quantizeBlock(dctBlock, qMatrix);
                
                for (const [u, v] of DCT_EMBED_COORDS) {
                    if (bitIndex < bitCount) {
                        const idx = v * 8 + u;
                        const absVal = Math.abs(quantBlock[idx]);
                        const rem = absVal % 4;
                        outBits[bitIndex] = (rem === 2 || rem === 3) ? 1 : 0;
                        bitIndex++;
                    }
                }
            }
        }
    }
    return outBits;
}

// --- ORCHESTRATOR ---

export function embedImage(image: ImageData, message: string, params: BuildPayloadParams, k: number = 1): ImageData {
    const payloadBits = buildPayload(message, params);
    
    if (params.embedding_method === 'dct_domain') {
        return embedDCT_domain(image, payloadBits, 50); // Using default Q=50 for stego codec
    } else if (params.embedding_method === 'lsb_opap') {
        return embedLSB_OPAP(image, payloadBits, k);
    }
    return embedLSB(image, payloadBits, k);
}

function isMagicCodeValid(actual: string, expected: string): boolean {
    if (!actual || typeof actual !== 'string') return false;
    let matchCount = 0;
    for (let i = 0; i < Math.min(actual.length, expected.length); i++) {
        if (actual[i] === expected[i]) matchCount++;
    }
    return matchCount >= 8;
}

export function extractImage(image: ImageData, k: number = 1): ParsedPayload {
    // Try LSB / OPAP first
    let headerBits = extractLSB(image, HEADER_BIT_LENGTH, k);
    let header;
    try {
        header = parsePayloadHeader(headerBits);
        if (isMagicCodeValid(header.MAGIC_CODE, MAGIC_CODE)) {
             const maxBits = image.width * image.height * 3 * k;
             const safeLen = Math.min(header.payload_length_bits, maxBits);
             const allBits = extractLSB(image, HEADER_BIT_LENGTH + safeLen, k);
             return parsePayload(allBits);
        }
    } catch {
        // Fallthrough to try next method
    }

    // Try DCT Domain
    try {
        headerBits = extractDCT_domain(image, HEADER_BIT_LENGTH, 50);
        header = parsePayloadHeader(headerBits);
        if (isMagicCodeValid(header.MAGIC_CODE, MAGIC_CODE)) {
             const maxBits = Math.floor((image.width * image.height) / 64) * 3 * 10;
             const safeLen = Math.min(header.payload_length_bits, maxBits);
             const allBits = extractDCT_domain(image, HEADER_BIT_LENGTH + safeLen, 50);
             return parsePayload(allBits);
        }
    } catch {
        // Fallthrough
    }

    throw new Error("Failed to extract valid header using any known method (LSB/DCT).");
}
