import { calculatePSNR } from '../image/image_metrics';

export function calculateVideoKeyframePSNR(originalKeyframe: ImageData, modifiedKeyframe: ImageData): number {
    return calculatePSNR(originalKeyframe, modifiedKeyframe);
}
