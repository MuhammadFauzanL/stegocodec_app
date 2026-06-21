// video_codec.ts - Core Video Compression Mathematics

export interface CompressedVideoResidual {
    width: number;
    height: number;
    data: Uint8Array;
}

/**
 * Computes the pixel-by-pixel difference between two frames.
 * Stores difference as (diff + 255) / 2 to fit in Uint8.
 * This is the heart of inter-frame video compression.
 */
export function computeResiduals(keyframe: ImageData, targetFrame: ImageData): Uint8ClampedArray {
    const residuals = new Uint8ClampedArray(keyframe.data.length);
    for (let i = 0; i < residuals.length; i++) {
        // Difference can range from -255 to +255.
        // We shift by 255 (now 0 to 510) and divide by 2 (now 0 to 255) to fit in 8-bit.
        const diff = targetFrame.data[i] - keyframe.data[i];
        residuals[i] = Math.round((diff + 255) / 2);
    }
    return residuals;
}

/**
 * Reconstructs a target frame using the keyframe and the residuals.
 */
export function reconstructFrame(keyframe: ImageData, residuals: Uint8ClampedArray): ImageData {
    const reconstructed = new Uint8ClampedArray(keyframe.data.length);
    for (let i = 0; i < reconstructed.length; i++) {
        const diff = (residuals[i] * 2) - 255;
        const val = keyframe.data[i] + diff;
        reconstructed[i] = Math.max(0, Math.min(255, val));
    }
    return new ImageData(reconstructed, keyframe.width, keyframe.height);
}

/**
 * Compresses an array of bytes (residuals) using Run-Length Encoding (RLE).
 * This acts as the lossless entropy encoder for the video codec.
 */
export function compressRLE(data: Uint8ClampedArray): Uint8Array {
    const out: number[] = [];
    let i = 0;
    while (i < data.length) {
        const val = data[i];
        let count = 1;
        while (i + count < data.length && count < 255 && data[i + count] === val) {
            count++;
        }
        out.push(count, val);
        i += count;
    }
    return new Uint8Array(out);
}

/**
 * Decompresses an RLE encoded Uint8Array back into residuals.
 */
export function decompressRLE(compressed: Uint8Array, originalLength: number): Uint8ClampedArray {
    const out = new Uint8ClampedArray(originalLength);
    let outI = 0;
    let i = 0;
    while (i < compressed.length) {
        const count = compressed[i];
        const val = compressed[i + 1];
        for (let c = 0; c < count; c++) {
            if (outI < originalLength) {
                out[outI++] = val;
            }
        }
        i += 2;
    }
    return out;
}
