export function encodeHamming74(bits: Uint8Array): Uint8Array {
    const paddedLength = Math.ceil(bits.length / 4) * 4;
    const dataBits = new Uint8Array(paddedLength);
    dataBits.set(bits);
    
    const out = new Uint8Array((paddedLength / 4) * 7);
    
    for (let i = 0; i < paddedLength / 4; i++) {
        const d1 = dataBits[i * 4];
        const d2 = dataBits[i * 4 + 1];
        const d3 = dataBits[i * 4 + 2];
        const d4 = dataBits[i * 4 + 3];
        
        const p1 = d1 ^ d2 ^ d4;
        const p2 = d1 ^ d3 ^ d4;
        const p3 = d2 ^ d3 ^ d4;
        
        const outIdx = i * 7;
        out[outIdx] = p1;
        out[outIdx + 1] = p2;
        out[outIdx + 2] = d1;
        out[outIdx + 3] = p3;
        out[outIdx + 4] = d2;
        out[outIdx + 5] = d3;
        out[outIdx + 6] = d4;
    }
    return out;
}

export function decodeHamming74(bits: Uint8Array, originalDataLength?: number): Uint8Array {
    const blocks = Math.floor(bits.length / 7);
    const out = new Uint8Array(blocks * 4);
    
    for (let i = 0; i < blocks; i++) {
        const idx = i * 7;
        const p1 = bits[idx];
        const p2 = bits[idx + 1];
        let d1 = bits[idx + 2];
        const p3 = bits[idx + 3];
        let d2 = bits[idx + 4];
        let d3 = bits[idx + 5];
        let d4 = bits[idx + 6];
        
        const s1 = p1 ^ d1 ^ d2 ^ d4;
        const s2 = p2 ^ d1 ^ d3 ^ d4;
        const s3 = p3 ^ d2 ^ d3 ^ d4;
        
        const syndrome = (s3 << 2) | (s2 << 1) | s1;
        
        // Parity bit corrections (syndromes 1, 2, 4) are omitted 
        // since we only extract data bits (d1, d2, d3, d4) into the output.
        if (syndrome === 3) d1 ^= 1;
        else if (syndrome === 5) d2 ^= 1;
        else if (syndrome === 6) d3 ^= 1;
        else if (syndrome === 7) d4 ^= 1;
        
        out[i * 4] = d1;
        out[i * 4 + 1] = d2;
        out[i * 4 + 2] = d3;
        out[i * 4 + 3] = d4;
    }
    
    if (originalDataLength !== undefined) {
        return out.slice(0, originalDataLength);
    }
    return out;
}
