// video_utils.ts - Video Frame Extraction Utilities

/**
 * Extracts the first frame (keyframe) of a video file as an ImageData object.
 * This runs entirely client-side using hidden video and canvas elements.
 */
export async function extractVideoKeyframe(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.style.display = 'none';
        video.muted = true;
        
        const url = URL.createObjectURL(file);
        
        video.onloadeddata = () => {
            // Seek to the first frame (0.1 seconds to avoid black initial frames on some codecs)
            video.currentTime = 0.1;
        };
        
        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Failed to get 2D context from canvas"));
                return;
            }
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            URL.revokeObjectURL(url);
            resolve(imageData);
        };
        
        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load video file."));
        };
        
        video.src = url;
        video.load();
    });
}
