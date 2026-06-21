import type { ParsedPayload, BuildPayloadParams } from '../../shared/payload';
import { buildPayload, parsePayloadHeader, HEADER_BIT_LENGTH, parsePayload } from '../../shared/payload';
import { embedLSB, extractLSB } from '../image/image_stego';

// Placeholder for WebCodecs extraction. Currently handles a single keyframe as ImageData.
export function embedVideoKeyframe(frame: ImageData, message: string, params: BuildPayloadParams): ImageData {
    const payloadBits = buildPayload(message, params);
    return embedLSB(frame, payloadBits, 1);
}

export function extractVideoKeyframe(frame: ImageData): ParsedPayload {
    const headerBits = extractLSB(frame, HEADER_BIT_LENGTH, 1);
    const header = parsePayloadHeader(headerBits);
    
    const maxBits = frame.width * frame.height * 3;
    const safeLen = Math.min(header.payload_length_bits, maxBits);
    
    const allBits = extractLSB(frame, HEADER_BIT_LENGTH + safeLen, 1);
    
    return parsePayload(allBits);
}
