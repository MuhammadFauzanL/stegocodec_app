import { encodeRepetition3, decodeRepetition3 } from './repetition';
import { encodeHamming74, decodeHamming74 } from './hamming';
import type { ECCMethod } from '../types';

export function encodeECC(bits: Uint8Array, method: ECCMethod): Uint8Array {
    if (method === 'repetition3') {
        return encodeRepetition3(bits);
    } else if (method === 'hamming74') {
        return encodeHamming74(bits);
    }
    return bits;
}

export function decodeECC(bits: Uint8Array, method: ECCMethod, originalLength?: number): Uint8Array {
    if (method === 'repetition3') {
        const decoded = decodeRepetition3(bits);
        return originalLength !== undefined ? decoded.slice(0, originalLength) : decoded;
    } else if (method === 'hamming74') {
        return decodeHamming74(bits, originalLength);
    }
    return bits;
}
