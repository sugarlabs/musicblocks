class ExportService {
    constructor(activity) {
        this.activity = activity;
        this.isExporting = false;
        this.recorder = null;
        this.recordedChunks = [];
    }

    // Get the main canvas (turtle artwork)
    getCanvas() {
        // Try to find the turtle canvas
        if (this.activity.turtles && this.activity.turtles.turtleCanvas) {
            return this.activity.turtles.turtleCanvas;
        }
        
        // Fallback to any canvas
        const canvases = document.querySelectorAll('canvas');
        for (let canvas of canvases) {
            if (canvas.width > 100 && canvas.height > 100) {
                return canvas;
            }
        }
        
        return document.querySelector('canvas');
    }

    // Export as GIF using gif.js
    async exportAsGIF(options = {}) {
        if (this.isExporting) {
            throw new Error('Already exporting');
        }
        
        this.isExporting = true;
        
        try {
            const canvas = this.getCanvas();
            if (!canvas) {
                throw new Error('No canvas found');
            }

            const { duration = 5, fps = 10, quality = 90 } = options;
            const totalFrames = duration * fps;
            const frameDelay = 1000 / fps;

            // Check if GIF.js is loaded
            if (typeof GIF === 'undefined') {
                throw new Error('GIF.js library not loaded');
            }

            // Create GIF instance
            const gif = new GIF({
                workers: 2,
                quality: quality,
                width: canvas.width,
                height: canvas.height,
                workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
            });

            // Capture frames
            for (let i = 0; i < totalFrames; i++) {
                const frameCanvas = document.createElement('canvas');
                frameCanvas.width = canvas.width;
                frameCanvas.height = canvas.height;
                const ctx = frameCanvas.getContext('2d');
                
                // Draw current canvas state
                ctx.drawImage(canvas, 0, 0);
                
                // Add frame to GIF
                gif.addFrame(ctx, { delay: frameDelay });
                
                // Wait for next frame
                await this.sleep(frameDelay);
            }

            // Render GIF
            return new Promise((resolve, reject) => {
                gif.on('finished', (blob) => {
                    this.downloadFile(blob, 'mouse-artwork.gif', 'image/gif');
                    this.isExporting = false;
                    resolve();
                });

                gif.on('error', (error) => {
                    this.isExporting = false;
                    reject(error);
                });

                gif.render();
            });

        } catch (error) {
            this.isExporting = false;
            throw error;
        }
    }

    // Export as MP4 using MediaRecorder API
    async exportAsMP4(options = {}) {
        if (this.isExporting) {
            throw new Error('Already exporting');
        }
        
        this.isExporting = true;
        
        try {
            const canvas = this.getCanvas();
            if (!canvas) {
                throw new Error('No canvas found');
            }

            const { duration = 5, fps = 30 } = options;
            
            // Get canvas stream
            const stream = canvas.captureStream(fps);
            this.recordedChunks = [];

            // Find supported MIME type
            const mimeType = this.getSupportedMimeType();
            
            // Create media recorder
            this.recorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            });

            // Collect data
            this.recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            // Handle recording stop
            return new Promise((resolve, reject) => {
                this.recorder.onstop = () => {
                    const blob = new Blob(this.recordedChunks, { type: mimeType });
                    const filename = mimeType.includes('webm') ? 'mouse-artwork.webm' : 'mouse-artwork.mp4';
                    this.downloadFile(blob, filename, mimeType);
                    this.isExporting = false;
                    resolve();
                };

                this.recorder.onerror = (error) => {
                    this.isExporting = false;
                    reject(error);
                };

                // Start recording
                this.recorder.start();
                
                // Stop after duration
                setTimeout(() => {
                    if (this.recorder && this.recorder.state === 'recording') {
                        this.recorder.stop();
                    }
                }, duration * 1000);
            });

        } catch (error) {
            this.isExporting = false;
            throw error;
        }
    }

    // Export with audio (combine canvas and audio)
    async exportWithAudio(options = {}) {
        if (this.isExporting) {
            throw new Error('Already exporting');
        }
        
        this.isExporting = true;
        
        try {
            // For now, just export MP4 (audio not implemented)
            // This is the complex part that requires Web Audio API and muxing
            alert('Export with audio is not fully implemented yet. Exporting video only.');
            await this.exportAsMP4(options);
            
        } catch (error) {
            this.isExporting = false;
            throw error;
        }
    }

    // Helper: Get supported MIME type
    getSupportedMimeType() {
        const types = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4'
        ];
        
        for (let type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        
        return 'video/webm'; // Fallback
    }

    // Helper: Download file
    downloadFile(blob, filename, mimeType) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Helper: Sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Stop any ongoing export
    stopExport() {
        if (this.recorder && this.recorder.state === 'recording') {
            this.recorder.stop();
        }
        this.isExporting = false;
    }
}

// Make available globally
if (typeof module !== "undefined" && module.exports) {
    module.exports = ExportService;
}