export function calculateBER(originalBits: Uint8Array, extractedBits: Uint8Array): number {
    const length = Math.min(originalBits.length, extractedBits.length);
    if (length === 0) return 0;
    
    let errors = 0;
    for (let i = 0; i < length; i++) {
        if (originalBits[i] !== extractedBits[i]) {
            errors++;
        }
    }
    
    errors += Math.abs(originalBits.length - extractedBits.length);
    
    return errors / Math.max(originalBits.length, extractedBits.length);
}
