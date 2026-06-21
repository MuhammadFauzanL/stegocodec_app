import { forwardDCT, inverseDCT, getScaledQuantizationMatrix, quantizeBlock, dequantizeBlock } from './image_codec';

export function compressDCT(image: ImageData, quality: number = 50): ImageData {
    const qMatrix = getScaledQuantizationMatrix(quality);
    const width = image.width;
    const height = image.height;
    const outData = new Uint8ClampedArray(image.data);
    
    // Process in 8x8 blocks
    for (let by = 0; by < height; by += 8) {
        for (let bx = 0; bx < width; bx += 8) {
            
            // For each color channel (R, G, B)
            for (let c = 0; c < 3; c++) {
                const block = new Float32Array(64);
                
                // Extract 8x8 block
                for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 8; x++) {
                        const px = bx + x;
                        const py = by + y;
                        if (px < width && py < height) {
                            const idx = (py * width + px) * 4 + c;
                            block[y * 8 + x] = outData[idx] - 128.0; // Level shift
                        }
                    }
                }
                
                // Forward Transform and Quantization (Compression Phase)
                const dctBlock = forwardDCT(block);
                const quantBlock = quantizeBlock(dctBlock, qMatrix);
                
                // Inverse Transform (Reconstruction Phase)
                const dequantBlock = dequantizeBlock(quantBlock, qMatrix);
                const idctBlock = inverseDCT(dequantBlock);
                
                // Write back
                for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 8; x++) {
                        const px = bx + x;
                        const py = by + y;
                        if (px < width && py < height) {
                            const idx = (py * width + px) * 4 + c;
                            const val = Math.round(idctBlock[y * 8 + x] + 128.0);
                            outData[idx] = Math.max(0, Math.min(255, val));
                        }
                    }
                }
            }
        }
    }
    
    return new ImageData(outData, width, height);
}
