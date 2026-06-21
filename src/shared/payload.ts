import type { MediaType, ECCMethod } from './types';
import { crc32 } from './crc';
import { textToBits, bitsToText } from './bit_utils';
import { encodeECC, decodeECC } from './ecc/ecc_manager';

export interface PayloadHeaderParams {
  media_type: MediaType;
  embedding_method: string;
  ecc_method: ECCMethod;
  payload_length_bits: number;
  crc32_checksum: number;
}

export interface ParsedPayloadHeader extends PayloadHeaderParams {
  MAGIC_CODE: string;
  version: string;
}

export interface BuildPayloadParams {
  media_type: MediaType;
  embedding_method: string;
  ecc_method: ECCMethod;
  version: string;
}

export interface ParsedPayload {
  header: ParsedPayloadHeader;
  payload_data: Uint8Array;
  is_crc_valid: boolean;
  extracted_message: string;
}

export const HEADER_BYTE_LENGTH = 64;
export const HEADER_BIT_LENGTH = HEADER_BYTE_LENGTH * 8 * 3; // Hardcoded Repetition3 for Header robustnes
export const MAGIC_CODE = 'STEGOCODEC_V5';

function writeStringToView(view: DataView, offset: number, str: string, maxLength: number) {
  for (let i = 0; i < maxLength; i++) {
    if (i < str.length) {
      view.setUint8(offset + i, str.charCodeAt(i));
    } else {
      view.setUint8(offset + i, 0); // padding
    }
  }
}

function readStringFromView(view: DataView, offset: number, maxLength: number): string {
  let str = '';
  for (let i = 0; i < maxLength; i++) {
    const charCode = view.getUint8(offset + i);
    if (charCode !== 0) {
      str += String.fromCharCode(charCode);
    }
  }
  return str;
}

export function createPayloadHeader(params: PayloadHeaderParams): Uint8Array {
  const buffer = new ArrayBuffer(HEADER_BYTE_LENGTH);
  const view = new DataView(buffer);
  
  let offset = 0;
  writeStringToView(view, offset, MAGIC_CODE, 13); offset += 13;
  writeStringToView(view, offset, '5.0', 3); offset += 3;
  writeStringToView(view, offset, params.media_type, 5); offset += 5;
  writeStringToView(view, offset, params.embedding_method, 20); offset += 20;
  writeStringToView(view, offset, params.ecc_method, 15); offset += 15;
  
  view.setUint32(offset, params.payload_length_bits, false); offset += 4;
  view.setUint32(offset, params.crc32_checksum, false);
  
  const headerBytes = new Uint8Array(buffer);
  const rawHeaderBits = new Uint8Array(HEADER_BYTE_LENGTH * 8);
  for (let i = 0; i < headerBytes.length; i++) {
    for (let j = 0; j < 8; j++) {
      rawHeaderBits[i * 8 + j] = (headerBytes[i] >> (7 - j)) & 1;
    }
  }
  return encodeECC(rawHeaderBits, 'repetition3');
}

export function parsePayloadHeader(bits: Uint8Array): ParsedPayloadHeader {
  if (bits.length < HEADER_BIT_LENGTH) {
    throw new Error('Bits too short to contain a valid header.');
  }
  
  const rawHeaderBits = decodeECC(bits.slice(0, HEADER_BIT_LENGTH), 'repetition3');
  
  const headerBytes = new Uint8Array(HEADER_BYTE_LENGTH);
  for (let i = 0; i < HEADER_BYTE_LENGTH; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte |= (rawHeaderBits[i * 8 + j] << (7 - j));
    }
    headerBytes[i] = byte;
  }
  
  const view = new DataView(headerBytes.buffer);
  let offset = 0;
  
  const magic = readStringFromView(view, offset, 13); offset += 13;
  const version = readStringFromView(view, offset, 3); offset += 3;
  const media_type = readStringFromView(view, offset, 5) as MediaType; offset += 5;
  const embedding_method = readStringFromView(view, offset, 20); offset += 20;
  const ecc_method = readStringFromView(view, offset, 15) as ECCMethod; offset += 15;
  const payload_length_bits = view.getUint32(offset, false); offset += 4;
  const crc32_checksum = view.getUint32(offset, false);
  
  return {
    MAGIC_CODE: magic,
    version,
    media_type,
    embedding_method,
    ecc_method,
    payload_length_bits,
    crc32_checksum
  };
}

export function buildPayload(message: string, params: BuildPayloadParams): Uint8Array {
  const payloadBits = textToBits(message);
  const encodedBits = encodeECC(payloadBits, params.ecc_method);
  const checksum = crc32(encodedBits);
  
  const headerParams: PayloadHeaderParams = {
    ...params,
    payload_length_bits: encodedBits.length,
    crc32_checksum: checksum
  };
  
  const headerBits = createPayloadHeader(headerParams);
  
  const combined = new Uint8Array(headerBits.length + encodedBits.length);
  combined.set(headerBits, 0);
  combined.set(encodedBits, headerBits.length);
  
  return combined;
}

export function parsePayload(bits: Uint8Array): ParsedPayload {
  const header = parsePayloadHeader(bits.slice(0, HEADER_BIT_LENGTH));
  
  let matchCount = 0;
  for (let i = 0; i < Math.min(header.MAGIC_CODE.length, MAGIC_CODE.length); i++) {
      if (header.MAGIC_CODE[i] === MAGIC_CODE[i]) matchCount++;
  }
  
  if (matchCount < 8) { // Tolerate up to 5 character errors
    throw new Error(`Invalid MAGIC_CODE (Matched ${matchCount}/${MAGIC_CODE.length}). Header parse failed.`);
  }
  
  const startIdx = HEADER_BIT_LENGTH;
  let safeLen = header.payload_length_bits;
  if (startIdx + safeLen > bits.length) {
      safeLen = bits.length - startIdx;
  }
  const endIdx = startIdx + safeLen;
  
  const payload_bits = bits.slice(startIdx, endIdx);
  const calculatedCrc = crc32(payload_bits);
  const crcValid = calculatedCrc === header.crc32_checksum;
    
  const eccMethodStr = header.ecc_method.replace(/\0/g, '');
  let messageStr: string;
    
  try {
      const decodedBits = decodeECC(payload_bits, eccMethodStr as ECCMethod);
      messageStr = bitsToText(decodedBits);
  } catch {
      messageStr = bitsToText(payload_bits); // fallback
  }

  return {
      header,
      payload_data: payload_bits,
      is_crc_valid: crcValid,
      extracted_message: messageStr
  };
}
