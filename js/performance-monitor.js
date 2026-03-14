// Performance Monitor for Music Blocks
// Tracks performance metrics and provides profiling tools

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            memory: [],
            blockExecutionTime: [],
            renderTime: [],
            audioLatency: []
        };
        
        this.isMonitoring = false;
        this.startTime = null;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        
        // Store performance marks
        this.marks = new Map();
        this.measures = [];
    }
    
    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.startTime = performance.now();
        this.frameCount = 0;
        
        // Start FPS monitoring
        this.monitorFPS();
        
        // Start memory monitoring if available
        if (performance.memory) {
            this.monitorMemory();
        }
        
        console.log('Performance monitoring started');
    }
    
    stop() {
        this.isMonitoring = false;
        console.log('Performance monitoring stopped');
        return this.getReport();
    }
    
    monitorFPS() {
        if (!this.isMonitoring) return;
        
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        const fps = 1000 / delta;
        
        this.metrics.fps.push(fps);
        this.frameCount++;
        this.lastFrameTime = now;
        
        // Keep only last 60 frames
        if (this.metrics.fps.length > 60) {
            this.metrics.fps.shift();
        }
        
        requestAnimationFrame(() => this.monitorFPS());
    }
    
    monitorMemory() {
        if (!this.isMonitoring || !performance.memory) return;
        
        const memory = {
            used: performance.memory.usedJSHeapSize / 1048576, // MB
            total: performance.memory.totalJSHeapSize / 1048576,
            limit: performance.memory.jsHeapSizeLimit / 1048576,
            timestamp: performance.now()
        };
        
        this.metrics.memory.push(memory);
        
        // Keep only last 100 samples
        if (this.metrics.memory.length > 100) {
            this.metrics.memory.shift();
        }
        
        setTimeout(() => this.monitorMemory(), 1000);
    }
    
    // Mark a point in time
    mark(name) {
        const timestamp = performance.now();
        this.marks.set(name, timestamp);
        
        if (typeof performance.mark === 'function') {
            performance.mark(name);
        }
    }
    
    // Measure time between two marks
    measure(name, startMark, endMark) {
        const start = this.marks.get(startMark);
        const end = this.marks.get(endMark);
        
        if (start && end) {
            const duration = end - start;
            this.measures.push({ name, duration, start, end });
            
            if (typeof performance.measure === 'function') {
                try {
                    performance.measure(name, startMark, endMark);
                } catch (e) {
                    // Ignore if marks don't exist in Performance API
                }
            }
            
            return duration;
        }
        
        return null;
    }
    
    // Track block execution time
    trackBlockExecution(blockName, duration) {
        this.metrics.blockExecutionTime.push({
            block: blockName,
            duration: duration,
            timestamp: performance.now()
        });
        
        // Keep only last 100
        if (this.metrics.blockExecutionTime.length > 100) {
            this.metrics.blockExecutionTime.shift();
        }
    }
    
    // Track render time
    trackRender(duration) {
        this.metrics.renderTime.push({
            duration: duration,
            timestamp: performance.now()
        });
        
        if (this.metrics.renderTime.length > 100) {
            this.metrics.renderTime.shift();
        }
    }
    
    // Get current FPS
    getCurrentFPS() {
        if (this.metrics.fps.length === 0) return 0;
        return this.metrics.fps[this.metrics.fps.length - 1];
    }
    
    // Get average FPS
    getAverageFPS() {
        if (this.metrics.fps.length === 0) return 0;
        const sum = this.metrics.fps.reduce((a, b) => a + b, 0);
        return sum / this.metrics.fps.length;
    }
    
    // Get memory usage
    getCurrentMemory() {
        if (!performance.memory) return null;
        
        return {
            used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
            total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
            limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
        };
    }
    
    // Get performance report
    getReport() {
        const report = {
            duration: performance.now() - this.startTime,
            frames: this.frameCount,
            fps: {
                current: this.getCurrentFPS().toFixed(2),
                average: this.getAverageFPS().toFixed(2),
                min: Math.min(...this.metrics.fps).toFixed(2),
                max: Math.max(...this.metrics.fps).toFixed(2)
            },
            memory: this.getCurrentMemory(),
            blockExecutions: this.metrics.blockExecutionTime.length,
            renders: this.metrics.renderTime.length,
            measures: this.measures
        };
        
        return report;
    }
    
    // Get slow blocks (execution time > threshold)
    getSlowBlocks(threshold = 16) {
        return this.metrics.blockExecutionTime
            .filter(b => b.duration > threshold)
            .sort((a, b) => b.duration - a.duration);
    }
    
    // Export data for analysis
    exportData() {
        return {
            metrics: this.metrics,
            marks: Array.from(this.marks.entries()),
            measures: this.measures,
            report: this.getReport()
        };
    }
    
    // Clear all data
    clear() {
        this.metrics = {
            fps: [],
            memory: [],
            blockExecutionTime: [],
            renderTime: [],
            audioLatency: []
        };
        this.marks.clear();
        this.measures = [];
        this.frameCount = 0;
    }
    
    // Display performance overlay
    showOverlay() {
        if (document.getElementById('perf-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'perf-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #0f0;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            border-radius: 4px;
            min-width: 200px;
        `;
        
        document.body.appendChild(overlay);
        
        const updateOverlay = () => {
            if (!document.getElementById('perf-overlay')) return;
            
            const fps = this.getCurrentFPS();
            const memory = this.getCurrentMemory();
            
            let html = `<div>FPS: ${fps.toFixed(1)}</div>`;
            
            if (memory) {
                html += `<div>Memory: ${memory.used}MB / ${memory.total}MB</div>`;
            }
            
            html += `<div>Frames: ${this.frameCount}</div>`;
            
            overlay.innerHTML = html;
            
            requestAnimationFrame(updateOverlay);
        };
        
        updateOverlay();
    }
    
    hideOverlay() {
        const overlay = document.getElementById('perf-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.performanceMonitor = new PerformanceMonitor();
    
    // Add console commands
    window.perfStart = () => window.performanceMonitor.start();
    window.perfStop = () => window.performanceMonitor.stop();
    window.perfReport = () => console.table(window.performanceMonitor.getReport());
    window.perfOverlay = () => window.performanceMonitor.showOverlay();
    window.perfHide = () => window.performanceMonitor.hideOverlay();
    window.perfExport = () => window.performanceMonitor.exportData();
    
    console.log('Performance Monitor loaded. Commands:');
    console.log('  perfStart() - Start monitoring');
    console.log('  perfStop() - Stop and get report');
    console.log('  perfReport() - Show current report');
    console.log('  perfOverlay() - Show performance overlay');
    console.log('  perfHide() - Hide overlay');
    console.log('  perfExport() - Export all data');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
