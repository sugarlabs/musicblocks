# Performance Monitoring and Optimization

This guide explains how to use the performance tools in Music Blocks.

## Performance Monitor

The Performance Monitor tracks FPS, memory usage, and execution times.

### Quick Start

Open the browser console and use these commands:

```javascript
// Start monitoring
perfStart()

// Show live overlay
perfOverlay()

// Stop and get report
perfStop()

// View detailed report
perfReport()

// Hide overlay
perfHide()

// Export all data
const data = perfExport()
```

### What It Tracks

- **FPS**: Frames per second (target: 60fps)
- **Memory**: JavaScript heap usage
- **Block Execution**: Time taken by each block
- **Render Time**: Canvas rendering performance
- **Frame Count**: Total frames rendered

### Reading the Report

```javascript
{
  duration: 5000,        // Total monitoring time (ms)
  frames: 300,           // Frames rendered
  fps: {
    current: 59.8,       // Current FPS
    average: 58.5,       // Average FPS
    min: 45.2,           // Lowest FPS
    max: 60.0            // Highest FPS
  },
  memory: {
    used: "45.23MB",     // Memory in use
    total: "67.50MB",    // Total allocated
    limit: "2048.00MB"   // Browser limit
  }
}
```

### Performance Overlay

The overlay shows real-time metrics in the top-right corner:
- Current FPS
- Memory usage
- Frame count

Good for spotting performance issues while working.

## Performance Utils

Helper functions for optimization.

### Debounce

Limit how often a function runs:

```javascript
const debouncedSave = PerformanceUtils.debounce(saveProject, 500);
// saveProject only runs once every 500ms
```

### Throttle

Ensure function doesn't run too frequently:

```javascript
const throttledUpdate = PerformanceUtils.throttle(updateCanvas, 16);
// updateCanvas runs at most once per 16ms (60fps)
```

### Memoize

Cache function results:

```javascript
const memoizedCalc = PerformanceUtils.memoize(expensiveCalculation);
// Result is cached for same inputs
```

### Measure Time

Check how long something takes:

```javascript
PerformanceUtils.measureTime(() => {
  // Your code here
}, 'My Operation');
// Logs: "My Operation: 12.34ms"
```

### Process in Chunks

Handle large arrays without freezing:

```javascript
await PerformanceUtils.processInChunks(bigArray, item => {
  // Process each item
}, 100); // Process 100 items at a time
```

## Finding Performance Issues

### Slow Blocks

Find blocks that take too long:

```javascript
perfStart()
// Run your project
const slowBlocks = performanceMonitor.getSlowBlocks(16)
console.table(slowBlocks)
```

Blocks taking over 16ms will cause frame drops.

### Memory Leaks

Watch memory over time:

```javascript
perfStart()
perfOverlay()
// Use your project for a while
// If memory keeps growing, you might have a leak
```

### Slow Frames

Detect frames that take too long:

```javascript
PerformanceUtils.detectSlowFrame(16)
// Warns in console when frames exceed 16ms
```

## Optimization Tips

### For Developers

1. **Use throttle/debounce** for frequent events
2. **Memoize** expensive calculations
3. **Batch DOM updates** with requestAnimationFrame
4. **Process large arrays in chunks**
5. **Use passive event listeners** for scroll/touch

### For Users

1. **Close unused browser tabs** (frees memory)
2. **Disable browser extensions** (reduces overhead)
3. **Use Chrome/Firefox** (better performance)
4. **Keep projects simple** (fewer blocks = faster)

## Browser Console Commands

Quick reference:

| Command | Description |
|---------|-------------|
| `perfStart()` | Start monitoring |
| `perfStop()` | Stop and get report |
| `perfReport()` | Show current metrics |
| `perfOverlay()` | Show live overlay |
| `perfHide()` | Hide overlay |
| `perfExport()` | Export all data |

## Performance Targets

- **FPS**: 60 (smooth), 30+ (acceptable)
- **Memory**: Under 100MB (good), under 200MB (ok)
- **Block execution**: Under 16ms per block
- **Frame time**: Under 16ms (60fps)

## Troubleshooting

**Low FPS?**
- Check for slow blocks
- Reduce project complexity
- Close other programs

**High memory?**
- Reload the page
- Simplify your project
- Check for memory leaks

**Stuttering?**
- Look for slow frames
- Optimize event handlers
- Use throttle/debounce

## Advanced Usage

### Custom Marks

Track specific operations:

```javascript
performanceMonitor.mark('start-operation')
// Do something
performanceMonitor.mark('end-operation')
const duration = performanceMonitor.measure('operation', 'start-operation', 'end-operation')
console.log(`Operation took ${duration}ms`)
```

### Export Data

Get all metrics for analysis:

```javascript
const data = perfExport()
// Save to file or send to analytics
console.log(JSON.stringify(data, null, 2))
```

## Future Improvements

These tools lay the groundwork for:
- AI-powered performance optimization
- Automatic bottleneck detection
- Smart resource management
- Predictive performance tuning

The data collected can be used to train models that optimize Music Blocks automatically.
