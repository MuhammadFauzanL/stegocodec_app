// Calculates CRC32 of an array of bits. Packs bits into bytes first for standard CRC calculation.
export function crc32(bits: Uint8Array): number {
    const byteLength = Math.ceil(bits.length / 8);
    const bytes = new Uint8Array(byteLength);
    
    for (let i = 0; i < byteLength; i++) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
            if (i * 8 + j < bits.length) {
                byte |= (bits[i * 8 + j] << (7 - j));
            }
        }
        bytes[i] = byte;
    }

    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
        crc ^= bytes[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

export function validateCRC(bits: Uint8Array, expected: number): boolean {
    return crc32(bits) === expected;
}
