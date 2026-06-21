export function encodeRepetition3(bits: Uint8Array): Uint8Array {
    const out = new Uint8Array(bits.length * 3);
    for (let i = 0; i < bits.length; i++) {
        out[i * 3] = bits[i];
        out[i * 3 + 1] = bits[i];
        out[i * 3 + 2] = bits[i];
    }
    return out;
}

export function decodeRepetition3(bits: Uint8Array): Uint8Array {
    const out = new Uint8Array(Math.floor(bits.length / 3));
    for (let i = 0; i < out.length; i++) {
        const sum = bits[i * 3] + bits[i * 3 + 1] + bits[i * 3 + 2];
        out[i] = sum >= 2 ? 1 : 0;
    }
    return out;
}
