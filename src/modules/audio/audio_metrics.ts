export function calculateAudioSNR(original: Float32Array, modified: Float32Array): number {
    let signalPower = 0;
    let noisePower = 0;
    
    const len = Math.min(original.length, modified.length);
    for (let i = 0; i < len; i++) {
        signalPower += original[i] * original[i];
        const diff = original[i] - modified[i];
        noisePower += diff * diff;
    }
    
    if (noisePower === 0) return 100; // Perfect match
    return 10 * Math.log10(signalPower / noisePower);
}
