// audio_codec.ts - Core Audio Codec Mathematics

/**
 * Custom N-Bit Adaptive Differential Pulse-Code Modulation (ADPCM) Encoder.
 * 
 * This is an academic implementation designed to allow variable bit-depths
 * (e.g. 4-bit, 6-bit, 8-bit) unlike standard IMA ADPCM which is strictly 4-bit.
 * 
 * It features:
 * - Signal prediction (DPCM)
 * - Difference quantization
 * - Dynamic Step-Size Adaptation
 */
export function encodeADPCM(samples: Float32Array, bits: number): Int32Array {
    const encoded = new Int32Array(samples.length);
    
    // Calculate quantization bounds for N-bits
    const maxVal = Math.pow(2, bits - 1) - 1; // e.g., 4-bit -> 7
    const minVal = -Math.pow(2, bits - 1);    // e.g., 4-bit -> -8

    let predicted = 0.0;
    let stepSize = 0.05; // Initial step size for normalized float audio

    for (let i = 0; i < samples.length; i++) {
        const diff = samples[i] - predicted;
        
        // 1. Quantize the difference
        let quant = Math.round(diff / stepSize);
        quant = Math.max(minVal, Math.min(maxVal, quant));
        encoded[i] = quant;
        
        // 2. Reconstruct signal for next prediction (Encoder must track Decoder state)
        const dequant = quant * stepSize;
        predicted += dequant;
        predicted = Math.max(-1.0, Math.min(1.0, predicted));
        
        // 3. Adapt step size dynamically
        const magnitude = Math.abs(quant);
        if (magnitude > maxVal * 0.5) {
            stepSize *= 1.2; // Expand step size if difference is large
        } else if (magnitude < maxVal * 0.2) {
            stepSize *= 0.8; // Shrink step size if difference is small
        }
        
        // Clamp step size to prevent math explosion
        stepSize = Math.max(0.001, Math.min(1.0, stepSize));
    }
    
    return encoded;
}

/**
 * Custom N-Bit ADPCM Decoder.
 * Must mathematically mirror the Encoder's state tracking.
 */
export function decodeADPCM(encoded: Int32Array, bits: number): Float32Array {
    const decoded = new Float32Array(encoded.length);
    const maxVal = Math.pow(2, bits - 1) - 1;
    
    let predicted = 0.0;
    let stepSize = 0.05;

    for (let i = 0; i < encoded.length; i++) {
        const quant = encoded[i];
        
        // 1. Dequantize
        const dequant = quant * stepSize;
        
        // 2. Reconstruct signal
        predicted += dequant;
        predicted = Math.max(-1.0, Math.min(1.0, predicted));
        decoded[i] = predicted;
        
        // 3. Adapt step size dynamically (Mirroring Encoder)
        const magnitude = Math.abs(quant);
        if (magnitude > maxVal * 0.5) {
            stepSize *= 1.2;
        } else if (magnitude < maxVal * 0.2) {
            stepSize *= 0.8;
        }
        
        stepSize = Math.max(0.001, Math.min(1.0, stepSize));
    }
    
    return decoded;
}
