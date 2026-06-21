import type { ExperimentRecord, ECCMethod } from '../shared/types';
import { generateExperimentId } from '../shared/experiment_id';
import { calculateCapacity } from '../shared/capacity';
import { createExperimentRecord } from '../shared/metrics_logger';
import { determineIntegrityBadge } from '../shared/integrity';
import { buildPayload } from '../shared/payload';

// Image
import { embedImage, extractImage } from './image/image_stego';
import { compressDCT } from './image/dct';

// Audio
import { embedAudio, extractAudio } from './audio/audio_stego';
import { compressADPCM } from './audio/adpcm';
import { float32ToWav } from '../shared/audio_utils';

// Video
import { embedVideoKeyframe, extractVideoKeyframe } from './video/video_stego';
import { extractVideoKeyframe as getVideoKeyframe } from '../shared/video_utils';
import { computeResiduals, compressRLE, decompressRLE, reconstructFrame } from './video/video_codec';

// Metrics
import { calculatePSNR } from './image/image_metrics';
import { calculateAudioSNR } from './audio/audio_metrics';
import { calculateVideoKeyframePSNR } from './video/video_metrics';

export async function runImageExperiment(
    file: File,
    message: string,
    embeddingMethod: string,
    eccMethod: ECCMethod,
    compressionMethod: string
): Promise<{ record: ExperimentRecord, stegoBlob: Blob, extractedMessage: string }> {
    
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const capacityBits = calculateCapacity('image', imageData.data.length, embeddingMethod);
    const startTime = performance.now();
    
    const params = {
        media_type: 'image' as const,
        embedding_method: embeddingMethod,
        ecc_method: eccMethod,
        version: '5.0'
    };
    const payloadBits = buildPayload(message, params);
    const actualPayloadSize = payloadBits.length;

    let stegoImageData = embedImage(imageData, message, params, 1);

    if (compressionMethod === 'dct') {
        stegoImageData = compressDCT(stegoImageData, 50);
    } else if (compressionMethod.startsWith('jpeg_q')) {
        const quality = parseInt(compressionMethod.replace('jpeg_q', ''), 10) / 100;
        ctx.putImageData(stegoImageData, 0, 0);
        const jpegBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality));
        
        const img = new Image();
        img.src = URL.createObjectURL(jpegBlob);
        await new Promise<void>((resolve) => { img.onload = () => resolve(); });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        stegoImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(img.src);
    }

    let parsed;
    let extractionSuccess = true;
    try {
        parsed = extractImage(stegoImageData, 1);
    } catch (e) {
        extractionSuccess = false;
        parsed = {
             header: { payload_length_bits: 0 },
             is_crc_valid: false,
             extracted_message: ''
        };
    }

    const duration = performance.now() - startTime;

    ctx.putImageData(stegoImageData, 0, 0);
    const stegoBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    
    const record = createExperimentRecord({
         experiment_id: generateExperimentId('image'),
         media_type: 'image',
         compression_method: compressionMethod,
         embedding_method: embeddingMethod,
         payload_size_bits: actualPayloadSize,
         payload_capacity_bits: capacityBits,
         ecc_mode: eccMethod === 'none' ? 'manual' : 'adaptive',
         preset_mode: 'manual'
    });
    
    record.crc_valid = parsed.is_crc_valid;
    record.extraction_success = extractionSuccess;
    record.processing_time_total_ms = duration;
    record.file_size_bytes_before = file.size;
    record.file_size_bytes_after = stegoBlob.size;
    record.compression_ratio = record.file_size_bytes_after / record.file_size_bytes_before;
    record.integrity_badge = determineIntegrityBadge(parsed.is_crc_valid, parsed.is_crc_valid ? 0 : 0.5);
    record.psnr_db = calculatePSNR(imageData, stegoImageData);
    
    return { record, stegoBlob, extractedMessage: parsed.extracted_message || '' };
}

export async function runAudioExperiment(
    file: File,
    message: string,
    embeddingMethod: string,
    eccMethod: ECCMethod,
    compressionMethod: string
): Promise<{ record: ExperimentRecord, stegoBlob: Blob, extractedMessage: string }> {
    
    const audioCtx = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const samples = audioBuffer.getChannelData(0);
    const capacityBits = calculateCapacity('audio', samples.length, embeddingMethod);
    
    const startTime = performance.now();
    
    const params = {
        media_type: 'audio' as const,
        embedding_method: embeddingMethod,
        ecc_method: eccMethod,
        version: '5.0'
    };
    const payloadBits = buildPayload(message, params);
    const actualPayloadSize = payloadBits.length;
    
    let stegoSamples = embedAudio(samples, message, params);
    
    if (compressionMethod === 'adpcm_4bit') {
        stegoSamples = compressADPCM(stegoSamples, 4);
    } else if (compressionMethod === 'adpcm_6bit') {
        stegoSamples = compressADPCM(stegoSamples, 6);
    } else if (compressionMethod === 'adpcm_8bit') {
        stegoSamples = compressADPCM(stegoSamples, 8);
    }
    
    let parsed;
    let extractionSuccess = true;
    try {
        parsed = extractAudio(stegoSamples);
    } catch (e) {
        extractionSuccess = false;
        parsed = {
             header: { payload_length_bits: 0 },
             is_crc_valid: false,
             extracted_message: ''
        };
    }
    
    const duration = performance.now() - startTime;
    
    const stegoBlob = float32ToWav(stegoSamples, audioBuffer.sampleRate);
    
    const record = createExperimentRecord({
         experiment_id: generateExperimentId('audio'),
         media_type: 'audio',
         compression_method: compressionMethod,
         embedding_method: embeddingMethod,
         payload_size_bits: actualPayloadSize,
         payload_capacity_bits: capacityBits,
         ecc_mode: eccMethod === 'none' ? 'manual' : 'adaptive',
         preset_mode: 'manual'
    });
    record.crc_valid = parsed.is_crc_valid;
    record.extraction_success = extractionSuccess;
    record.processing_time_total_ms = duration;
    record.file_size_bytes_before = file.size;
    record.file_size_bytes_after = stegoBlob.size;
    record.compression_ratio = record.file_size_bytes_after / record.file_size_bytes_before;
    record.integrity_badge = determineIntegrityBadge(parsed.is_crc_valid, parsed.is_crc_valid ? 0 : 0.5);
    record.snr_db = calculateAudioSNR(samples, stegoSamples);
    
    return { record, stegoBlob, extractedMessage: parsed.extracted_message || '' };
}

export async function runVideoExperiment(
    file: File,
    message: string,
    embeddingMethod: string,
    eccMethod: ECCMethod,
    compressionMethod: string
): Promise<{ record: ExperimentRecord, stegoBlob: Blob, extractedMessage: string }> {
    
    const keyframe = await getVideoKeyframe(file);
    const capacityBits = calculateCapacity('video', keyframe.data.length, embeddingMethod);
    
    const startTime = performance.now();
    
    const params = {
        media_type: 'video' as const,
        embedding_method: embeddingMethod,
        ecc_method: eccMethod,
        version: '5.0'
    };
    const payloadBits = buildPayload(message, params);
    const actualPayloadSize = payloadBits.length;

    let stegoKeyframe = embedVideoKeyframe(keyframe, message, params);
    
    let compressedSize = 0;
    
    if (compressionMethod === 'frame_diff_rle') {
        // Simulate inter-frame compression by differencing Keyframe with itself
        const residuals = computeResiduals(stegoKeyframe, stegoKeyframe);
        const compressed = compressRLE(residuals);
        compressedSize = compressed.length;
        
        // Reconstruct to simulate exact pipeline (lossless step)
        const decompressed = decompressRLE(compressed, residuals.length);
        stegoKeyframe = reconstructFrame(stegoKeyframe, decompressed);
    }
    
    let parsed;
    let extractionSuccess = true;
    try {
        parsed = extractVideoKeyframe(stegoKeyframe);
    } catch (e) {
        extractionSuccess = false;
        parsed = {
             header: { payload_length_bits: 0 },
             is_crc_valid: false,
             extracted_message: ''
        };
    }
    
    const duration = performance.now() - startTime;
    
    const canvas = document.createElement('canvas');
    canvas.width = stegoKeyframe.width;
    canvas.height = stegoKeyframe.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(stegoKeyframe, 0, 0);
    const stegoBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    
    const record = createExperimentRecord({
         experiment_id: generateExperimentId('video'),
         media_type: 'video',
         compression_method: compressionMethod,
         embedding_method: embeddingMethod,
         payload_size_bits: actualPayloadSize,
         payload_capacity_bits: capacityBits,
         ecc_mode: eccMethod === 'none' ? 'manual' : 'adaptive',
         preset_mode: 'manual'
    });
    
    record.crc_valid = parsed.is_crc_valid;
    record.extraction_success = extractionSuccess;
    record.processing_time_total_ms = duration;
    record.file_size_bytes_before = file.size;
    record.file_size_bytes_after = compressedSize > 0 ? compressedSize : stegoBlob.size;
    record.compression_ratio = record.file_size_bytes_after / record.file_size_bytes_before;
    record.integrity_badge = determineIntegrityBadge(parsed.is_crc_valid, parsed.is_crc_valid ? 0 : 0.5);
    record.psnr_db = calculateVideoKeyframePSNR(keyframe, stegoKeyframe);
    
    return { record, stegoBlob, extractedMessage: parsed.extracted_message || '' };
}

// ==========================================
// PURE EXTRACTION PIPELINES
// ==========================================

export async function extractImagePipeline(file: File): Promise<{ message: string, isValid: boolean }> {
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    try {
        const parsed = extractImage(imageData, 1);
        return { message: parsed.extracted_message || '', isValid: parsed.is_crc_valid };
    } catch {
        return { message: '', isValid: false };
    }
}

export async function extractAudioPipeline(file: File): Promise<{ message: string, isValid: boolean }> {
    const audioCtx = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const samples = audioBuffer.getChannelData(0);
    try {
        const parsed = extractAudio(samples);
        return { message: parsed.extracted_message || '', isValid: parsed.is_crc_valid };
    } catch {
        return { message: '', isValid: false };
    }
}

export async function runCodecExperiment(file: File): Promise<{
    file_size_bytes_before: number;
    file_size_bytes_after: number;
    compression_ratio: number;
    processing_time_ms: number;
    reconstructedBlob: Blob;
}> {
    const start = performance.now();
    
    // Read Image
    const imgBitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imgBitmap, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Import dynamically to avoid circular deps if any
    const { compressRLE, decompressRLE } = await import('./rle_codec');
    
    // Compress
    const compressed = compressRLE(imgData.data);
    
    // Decompress
    const decompressed = decompressRLE(compressed, imgData.data.length);
    
    // Reconstruct Image
    const newImgData = new ImageData(decompressed as any, canvas.width, canvas.height);
    ctx.putImageData(newImgData, 0, 0);
    const reconstructedBlob = await canvas.convertToBlob({ type: 'image/png' });
    
    const end = performance.now();

    return {
        file_size_bytes_before: file.size,
        file_size_bytes_after: compressed.length,
        compression_ratio: compressed.length / file.size,
        processing_time_ms: end - start,
        reconstructedBlob
    };
}

export async function extractVideoPipeline(file: File): Promise<{ message: string, isValid: boolean }> {
    const keyframe = await getVideoKeyframe(file);
    try {
        const parsed = extractVideoKeyframe(keyframe);
        return { message: parsed.extracted_message || '', isValid: parsed.is_crc_valid };
    } catch {
        return { message: '', isValid: false };
    }
}
