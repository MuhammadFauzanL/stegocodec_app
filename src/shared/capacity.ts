export interface CapacityResult {
  is_valid: boolean;
  payload_capacity_bits: number;
  payload_used_bits: number;
  payload_utilization_ratio: number;
}

export function calculateImageCapacity(image: ImageData, method: string): number {
  if (method === 'lsb' || method === 'lsb_opap') {
    // 3 channels (RGB), alpha ignored
    const pixelCount = image.width * image.height;
    return pixelCount * 3; // k=1 default
  }
  if (method === 'dct_domain') {
    // 1 bit per 8x8 block (since we embed in a specific mid-frequency coefficient)
    // Actually we can embed 1 bit per Y-channel 8x8 block.
    // Luma channel only -> (width * height) / 64
    return Math.floor((image.width * image.height) / 64);
  }
  return 0;
}

export function calculateAudioCapacity(samples: Float32Array, method: string): number {
  if (method === 'pcm_lsb') {
    return samples.length; // 1 bit per sample
  }
  return 0;
}

export function calculateVideoKeyframeCapacity(frame: ImageData, method: string): number {
  return calculateImageCapacity(frame, method);
}

export function calculateCapacity(mediaType: 'image'|'audio'|'video', dataLengthOrSamples: number, method: string = 'lsb'): number {
  // A simplified wrapper for pipeline.ts since it doesn't pass the ImageData directly to calculateCapacity
  if (mediaType === 'image' || mediaType === 'video') {
       // dataLength is imageData.data.length (width*height*4). 
       // So width*height = dataLength / 4.
       const pixelCount = dataLengthOrSamples / 4;
       if (method === 'dct_domain') {
           return Math.floor(pixelCount / 64);
       }
       // Default LSB
       return pixelCount * 3;
  } else if (mediaType === 'audio') {
       // dataLengthOrSamples is samples.length
       return dataLengthOrSamples;
  }
  return 0;
}

export function validatePayloadCapacity(payloadBits: number, capacityBits: number): CapacityResult {
  const is_valid = payloadBits <= capacityBits;
  const ratio = capacityBits === 0 ? 0 : payloadBits / capacityBits;
  return {
    is_valid,
    payload_capacity_bits: capacityBits,
    payload_used_bits: payloadBits,
    payload_utilization_ratio: ratio
  };
}
