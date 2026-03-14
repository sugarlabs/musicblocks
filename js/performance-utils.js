// Performance Optimization Utilities
// Helper functions for improving Music Blocks performance

const PerformanceUtils = {
    
    // Debounce function calls
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function calls
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Memoize function results
    memoize(func) {
        const cache = new Map();
        return function(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = func.apply(this, args);
            cache.set(key, result);
            return result;
        };
    },
    
    // Batch DOM updates
    batchDOMUpdates(updates) {
        requestAnimationFrame(() => {
            updates.forEach(update => update());
        });
    },
    
    // Lazy load images
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    },
    
    // Measure function execution time
    measureTime(func, label) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${label}: ${(end - start).toFixed(2)}ms`);
        return result;
    },
    
    // Async measure
    async measureTimeAsync(func, label) {
        const start = performance.now();
        const result = await func();
        const end = performance.now();
        console.log(`${label}: ${(end - start).toFixed(2)}ms`);
        return result;
    },
    
    // Check if function is slow
    profileFunction(func, threshold = 16) {
        return function(...args) {
            const start = performance.now();
            const result = func.apply(this, args);
            const duration = performance.now() - start;
            
            if (duration > threshold) {
                console.warn(`Slow function detected: ${func.name || 'anonymous'} took ${duration.toFixed(2)}ms`);
            }
            
            return result;
        };
    },
    
    // Optimize array operations
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },
    
    // Process large arrays in chunks to avoid blocking
    async processInChunks(array, processor, chunkSize = 100) {
        const chunks = this.chunkArray(array, chunkSize);
        const results = [];
        
        for (const chunk of chunks) {
            const chunkResults = chunk.map(processor);
            results.push(...chunkResults);
            
            // Yield to browser
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        return results;
    },
    
    // Check if browser is idle
    whenIdle(callback, timeout = 1000) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(callback, { timeout });
        } else {
            setTimeout(callback, 0);
        }
    },
    
    // Detect performance issues
    detectSlowFrame(threshold = 16) {
        let lastTime = performance.now();
        
        const check = () => {
            const now = performance.now();
            const delta = now - lastTime;
            
            if (delta > threshold) {
                console.warn(`Slow frame detected: ${delta.toFixed(2)}ms`);
            }
            
            lastTime = now;
            requestAnimationFrame(check);
        };
        
        check();
    },
    
    // Get performance metrics
    getMetrics() {
        const metrics = {};
        
        // Navigation timing
        if (performance.timing) {
            const timing = performance.timing;
            metrics.pageLoad = timing.loadEventEnd - timing.navigationStart;
            metrics.domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
            metrics.firstPaint = timing.responseStart - timing.navigationStart;
        }
        
        // Resource timing
        if (performance.getEntriesByType) {
            const resources = performance.getEntriesByType('resource');
            metrics.resourceCount = resources.length;
            metrics.totalResourceTime = resources.reduce((sum, r) => sum + r.duration, 0);
        }
        
        // Memory
        if (performance.memory) {
            metrics.memory = {
                used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB',
                total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + 'MB'
            };
        }
        
        return metrics;
    },
    
    // Clear performance data
    clearMetrics() {
        if (performance.clearMarks) {
            performance.clearMarks();
        }
        if (performance.clearMeasures) {
            performance.clearMeasures();
        }
        if (performance.clearResourceTimings) {
            performance.clearResourceTimings();
        }
    },
    
    // Optimize event listeners
    passiveListener(element, event, handler) {
        element.addEventListener(event, handler, { passive: true });
    },
    
    // Check if feature should be enabled based on performance
    shouldEnableFeature(featureName) {
        const metrics = this.getMetrics();
        
        // Disable heavy features on low-end devices
        if (metrics.memory && parseFloat(metrics.memory.total) < 512) {
            console.log(`Feature ${featureName} disabled due to low memory`);
            return false;
        }
        
        return true;
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.PerformanceUtils = PerformanceUtils;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceUtils;
}
