export function compressRLE(data: Uint8ClampedArray): Uint8Array {
    const compressed: number[] = [];
    let i = 0;
    while (i < data.length) {
        let count = 1;
        while (i + count < data.length && data[i] === data[i + count] && count < 255) {
            count++;
        }
        compressed.push(count);
        compressed.push(data[i]);
        i += count;
    }
    return new Uint8Array(compressed);
}

export function decompressRLE(compressed: Uint8Array, originalLength: number): Uint8ClampedArray {
    const decompressed = new Uint8ClampedArray(originalLength);
    let outIdx = 0;
    for (let i = 0; i < compressed.length; i += 2) {
        const count = compressed[i];
        const value = compressed[i+1];
        for (let j = 0; j < count; j++) {
            if (outIdx < originalLength) {
                decompressed[outIdx++] = value;
            }
        }
    }
    return decompressed;
}
