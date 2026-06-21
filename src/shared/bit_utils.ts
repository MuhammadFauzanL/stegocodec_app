/**
 * Utility functions for bit-level operations and text conversion.
 */

export function textToBits(message: string): Uint8Array {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message);
  const bits = new Uint8Array(bytes.length * 8);

  for (let i = 0; i < bytes.length; i++) {
    for (let j = 0; j < 8; j++) {
      bits[i * 8 + j] = (bytes[i] >> (7 - j)) & 1;
    }
  }
  return bits;
}

export function bitsToText(bits: Uint8Array): string {
  if (bits.length % 8 !== 0) {
    throw new Error('Bit array length must be a multiple of 8 to convert to text.');
  }
  const bytes = new Uint8Array(bits.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte |= (bits[i * 8 + j] << (7 - j));
    }
    bytes[i] = byte;
  }
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

export function measureProcessingTime<T>(fn: () => T): { result: T; durationMs: number } {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return {
    result,
    durationMs: end - start,
  };
}
