export function calculateMSE(original: ImageData, modified: ImageData): number {
    let mse = 0;
    const len = original.data.length;
    for (let i = 0; i < len; i += 4) {
        const rDiff = original.data[i] - modified.data[i];
        const gDiff = original.data[i+1] - modified.data[i+1];
        const bDiff = original.data[i+2] - modified.data[i+2];
        mse += (rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
    }
    return mse / ((len / 4) * 3); // Average over R,G,B channels
}

export function calculatePSNR(original: ImageData, modified: ImageData): number {
    const mse = calculateMSE(original, modified);
    if (mse === 0) return 100; // Perfect match
    const maxVal = 255;
    return 10 * Math.log10((maxVal * maxVal) / mse);
}
