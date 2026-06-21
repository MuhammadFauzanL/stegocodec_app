export interface CompressedImage {
  width: number;
  height: number;
  data: Uint8Array;
  method: 'rle' | 'qoi' | 'huffman';
}

export function compressImageLossless(image: ImageData, method: 'rle' | 'huffman' | 'qoi'): CompressedImage {
  if (method === 'rle') {
    // Simple Run-Length Encoding over RGBA values
    const pixels = image.data;
    const out: number[] = [];
    let i = 0;
    while (i < pixels.length) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      let count = 1;
      let nextI = i + 4;
      while (nextI < pixels.length && count < 255) {
        if (pixels[nextI] === r && pixels[nextI + 1] === g && pixels[nextI + 2] === b && pixels[nextI + 3] === a) {
          count++;
          nextI += 4;
        } else {
          break;
        }
      }
      out.push(count, r, g, b, a);
      i = nextI;
    }
    return {
      width: image.width,
      height: image.height,
      data: new Uint8Array(out),
      method: 'rle'
    };
  }
  throw new Error(`Method ${method} not fully implemented yet.`);
}

export function decompressImageLossless(data: CompressedImage): ImageData {
  if (data.method === 'rle') {
    const pixels = new Uint8ClampedArray(data.width * data.height * 4);
    let outI = 0;
    let i = 0;
    const compressed = data.data;
    while (i < compressed.length) {
      const count = compressed[i];
      const r = compressed[i + 1];
      const g = compressed[i + 2];
      const b = compressed[i + 3];
      const a = compressed[i + 4];
      
      for (let c = 0; c < count; c++) {
        pixels[outI++] = r;
        pixels[outI++] = g;
        pixels[outI++] = b;
        pixels[outI++] = a;
      }
      i += 5;
    }
    return new ImageData(pixels, data.width, data.height);
  }
  throw new Error(`Method ${data.method} not fully implemented yet.`);
}

// --- DCT Mathematics ---
const Q_MATRIX = [
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99]
];

// Precompute cosine tables for 8x8 DCT
const COS_TABLE = new Float32Array(8 * 8);
for (let x = 0; x < 8; x++) {
    for (let u = 0; u < 8; u++) {
        COS_TABLE[x * 8 + u] = Math.cos(((2 * x + 1) * u * Math.PI) / 16.0);
    }
}

const C = (u: number) => (u === 0 ? 1.0 / Math.SQRT2 : 1.0);

export function getScaledQuantizationMatrix(quality: number): Int32Array {
    let scale: number;
    if (quality < 50) {
        scale = Math.floor(5000 / quality);
    } else {
        scale = Math.floor(200 - 2 * quality);
    }
    
    const scaled = new Int32Array(64);
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let val = Math.floor((Q_MATRIX[i][j] * scale + 50) / 100);
            val = Math.max(1, Math.min(255, val));
            scaled[i * 8 + j] = val;
        }
    }
    return scaled;
}

export function forwardDCT(block: Float32Array): Float32Array {
    const output = new Float32Array(64);
    for (let u = 0; u < 8; u++) {
        for (let v = 0; v < 8; v++) {
            let sum = 0;
            for (let x = 0; x < 8; x++) {
                for (let y = 0; y < 8; y++) {
                    sum += block[y * 8 + x] * COS_TABLE[x * 8 + u] * COS_TABLE[y * 8 + v];
                }
            }
            output[v * 8 + u] = 0.25 * C(u) * C(v) * sum;
        }
    }
    return output;
}

export function inverseDCT(block: Float32Array): Float32Array {
    const output = new Float32Array(64);
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            let sum = 0;
            for (let u = 0; u < 8; u++) {
                for (let v = 0; v < 8; v++) {
                    sum += C(u) * C(v) * block[v * 8 + u] * COS_TABLE[x * 8 + u] * COS_TABLE[y * 8 + v];
                }
            }
            output[y * 8 + x] = 0.25 * sum;
        }
    }
    return output;
}

export function quantizeBlock(dctBlock: Float32Array, qMatrix: Int32Array): Int32Array {
    const output = new Int32Array(64);
    for (let i = 0; i < 64; i++) {
        output[i] = Math.round(dctBlock[i] / qMatrix[i]);
    }
    return output;
}

export function dequantizeBlock(quantBlock: Int32Array, qMatrix: Int32Array): Float32Array {
    const output = new Float32Array(64);
    for (let i = 0; i < 64; i++) {
        output[i] = quantBlock[i] * qMatrix[i];
    }
    return output;
}
