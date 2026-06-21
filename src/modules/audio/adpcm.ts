import { encodeADPCM, decodeADPCM } from './audio_codec';

/**
 * Robustness Attack Simulator for Audio.
 * Simulates a lossy channel by encoding the PCM audio to N-bit ADPCM,
 * and then immediately decoding it back to PCM.
 */
export function compressADPCM(samples: Float32Array, bits: number = 4): Float32Array {
    // 1. Compression Phase
    const encoded = encodeADPCM(samples, bits);
    
    // 2. Reconstruction Phase
    const decoded = decodeADPCM(encoded, bits);
    
    return decoded;
}
