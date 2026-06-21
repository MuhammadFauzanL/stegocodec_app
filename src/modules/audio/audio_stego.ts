import type { ParsedPayload, BuildPayloadParams } from '../../shared/payload';
import { buildPayload, parsePayloadHeader, HEADER_BIT_LENGTH, parsePayload } from '../../shared/payload';

export function embedAudio(samples: Float32Array, message: string, params: BuildPayloadParams): Float32Array {
    const payloadBits = buildPayload(message, params);
    if (payloadBits.length > samples.length) {
        throw new Error('Payload too large for audio capacity');
    }
    
    const outSamples = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        let sample16 = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32768)));
        if (i < payloadBits.length) {
            const bit = payloadBits[i];
            sample16 = (sample16 & ~1) | bit;
        }
        outSamples[i] = sample16 / 32768.0;
    }
    return outSamples;
}

export function extractAudio(samples: Float32Array): ParsedPayload {
    const headerBits = new Uint8Array(HEADER_BIT_LENGTH);
    for (let i = 0; i < HEADER_BIT_LENGTH; i++) {
        const sample16 = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32768)));
        headerBits[i] = sample16 & 1;
    }
    
    const header = parsePayloadHeader(headerBits);
    const maxBits = samples.length;
    const safeLen = Math.min(header.payload_length_bits, maxBits - HEADER_BIT_LENGTH);
    const totalBits = HEADER_BIT_LENGTH + safeLen;
    
    const allBits = new Uint8Array(totalBits);
    allBits.set(headerBits, 0);
    for (let i = HEADER_BIT_LENGTH; i < totalBits; i++) {
        const sample16 = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32768)));
        allBits[i] = sample16 & 1;
    }
    
    return parsePayload(allBits);
}
