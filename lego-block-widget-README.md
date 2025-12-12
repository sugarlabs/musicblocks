## <a name="LEGO_BRICKS_WIDGET"></a>LEGO Bricks Widget

The LEGO Bricks Widget is an innovative musical tool that combines visual image scanning with musical phrase creation. It allows users to upload images or use a webcam to scan visual content and convert color patterns into musical sequences. This widget represents a breakthrough in accessible music education, enabling users to create music through visual interaction.

### Core Architecture and Data Structures

The widget is built around a sophisticated matrix data structure that dynamically adapts to the pitch blocks provided by Music Blocks:

```javascript
this.matrixData = {
    rows: [
        { type: 'pitch', label: 'High C (Do)', icon: 'HighC.png', color: 'pitch-row', note: 'C5' },
        { type: 'pitch', label: 'B (Ti)', icon: 'B.png', color: 'pitch-row', note: 'B4' },
        // ... additional pitch rows based on user's pitch blocks
        { type: 'control', label: 'Zoom Controls', icon: 'zoom.svg', color: 'control-row' }
    ],
    columns: 8,
    selectedCells: new Set()
};
```

The widget maintains several key properties for managing state:
- **Widget Window Management**: Handles the visual interface and user interactions
- **Audio Synthesis**: Integrated piano synthesizer for real-time note playback
- **Image Processing**: Canvas-based color detection and analysis
- **Animation Control**: Vertical scanning line animation system
- **Data Storage**: Arrays for storing detected color patterns and musical notes

### Widget Initialization and Setup

The initialization process involves multiple stages of setup to create a fully functional musical interface:

```javascript
this.init = function(activity) {
    this.activity = activity;
    this.running = true;

    // Initialize audio synthesizer with piano samples
    this._initAudio();
    
    // Create the main widget window
    const widgetWindow = window.widgetWindows.windowFor(this, "LEGO BRICKS");
    this.widgetWindow = widgetWindow;
    
    // Add control buttons for various functions
    this.playButton = widgetWindow.addButton("play-button.svg", ICONSIZE, _("Play"));
    this.saveButton = widgetWindow.addButton("save-button.svg", ICONSIZE, _("Save"));
    this.uploadButton = widgetWindow.addButton("upload-button.svg", ICONSIZE, _("Upload Image"));
    this.webcamButton = widgetWindow.addButton("webcam-button.svg", ICONSIZE, _("Webcam"));
    
    // Generate dynamic rows based on pitch blocks from Music Blocks
    this._generateRowsFromPitchBlocks();
    
    // Initialize the user interface components
    this._initializeRowHeaders();
    this.createMainContainer();
}
```

### Dynamic Row Generation System

The widget intelligently generates its musical rows based on the pitch blocks connected to it in Music Blocks:

```javascript
this._generateRowsFromPitchBlocks = function() {
    this.matrixData.rows = [];
    
    // Process each pitch block received from Music Blocks
    for (let i = 0; i < this.rowLabels.length; i++) {
        const pitchName = this.rowLabels[i];
        const octave = this.rowArgs[i];
        
        // Only process valid pitch blocks (skip drum blocks)
        if (octave !== -1) {
            const noteString = pitchName + octave;
            const displayName = this._getDisplayName(pitchName, octave);
            
            this.matrixData.rows.push({
                type: 'pitch',
                label: displayName,
                icon: 'pitch.svg',
                color: 'pitch-row',
                note: noteString
            });
        }
    }
    
    // Add control row for zoom and spacing controls
    this.matrixData.rows.push({
        type: 'control',
        label: 'Zoom Controls',
        icon: 'zoom.svg',
        color: 'control-row'
    });
};
```

### Advanced Color Detection System

The color detection system is the heart of the widget, using sophisticated algorithms to analyze images:

```javascript
this._sampleAndDetectColor = function(line, now) {
    // Create temporary canvas for pixel-level analysis
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // Set canvas dimensions to match media element
    tempCanvas.width = mediaElement.naturalWidth || mediaElement.videoWidth || mediaRect.width;
    tempCanvas.height = mediaElement.naturalHeight || mediaElement.videoHeight || mediaRect.height;
    
    // Draw the current frame/image to canvas for analysis
    ctx.drawImage(mediaElement, 0, 0);
    
    // Sample multiple points along the vertical scanning line
    const samplePoints = 32;
    const colorCounts = {};
    let totalSamples = 0;
    
    for (let i = 0; i < samplePoints; i++) {
        const y = canvasY1 + (i * (canvasY2 - canvasY1)) / samplePoints;
        
        // Extract RGBA pixel data
        const pixelData = ctx.getImageData(canvasX, y, 1, 1).data;
        const [r, g, b, a] = pixelData;
        
        // Skip transparent pixels
        if (a < 128) continue;
        
        // Convert RGB to color family
        const colorFamily = this._getColorFamily(r, g, b);
        colorCounts[colorFamily.name] = (colorCounts[colorFamily.name] || 0) + 1;
        totalSamples++;
    }
    
    // Determine dominant color (must be at least 25% of samples)
    let dominantColor = null;
    let maxCount = 0;
    const minThreshold = Math.max(1, Math.floor(totalSamples * 0.25));
    
    for (const [colorName, count] of Object.entries(colorCounts)) {
        if (count > maxCount && count >= minThreshold) {
            maxCount = count;
            dominantColor = this._getColorFamilyByName(colorName);
        }
    }
    
    // Record significant color changes
    if (dominantColor && (!line.currentColor || !this._colorsAreSimilar(line.currentColor, dominantColor))) {
        this._addColorSegment(line.rowIndex, dominantColor, now - line.lastColorTime);
        line.currentColor = dominantColor;
        line.lastColorTime = now;
    }
};
```

### HSL Color Space Conversion and Analysis

The widget uses HSL (Hue, Saturation, Lightness) color space for more accurate color classification:

```javascript
this._getColorFamily = function(r, g, b) {
    // Convert RGB values to HSL for better color analysis
    const hsl = this._rgbToHsl(r, g, b);
    const [hue, saturation, lightness] = hsl;
    
    // Handle grayscale colors first (low saturation)
    if (saturation < 15) {
        if (lightness > 85) return { name: 'white', hue: 0 };
        if (lightness < 15) return { name: 'black', hue: 0 };
        return { name: 'gray', hue: 0 };
    }
    
    // Classify saturated colors by hue ranges
    if (hue >= 345 || hue < 15) return { name: 'red', hue: 0 };
    if (hue >= 15 && hue < 45) return { name: 'orange', hue: 30 };
    if (hue >= 45 && hue < 75) return { name: 'yellow', hue: 60 };
    if (hue >= 75 && hue < 165) return { name: 'green', hue: 120 };
    if (hue >= 165 && hue < 195) return { name: 'cyan', hue: 180 };
    if (hue >= 195 && hue < 255) return { name: 'blue', hue: 240 };
    if (hue >= 255 && hue < 285) return { name: 'purple', hue: 270 };
    if (hue >= 285 && hue < 315) return { name: 'magenta', hue: 300 };
    if (hue >= 315 && hue < 345) return { name: 'pink', hue: 330 };
    
    return { name: 'unknown', hue: hue };
};

this._rgbToHsl = function(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }

    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
};
```

### Temporal Analysis and Musical Timing

The widget converts time-based color segments into musical note durations using sophisticated filtering:

```javascript
this._collectNotesToPlay = function() {
    this._notesToPlay = [];
    
    // Analyze all color segment boundaries across rows
    const columnBoundaries = this._analyzeColumnBoundaries();
    
    // Filter out segments shorter than 350ms to eliminate noise
    const filteredBoundaries = this._filterSmallSegments(columnBoundaries);
    
    // Convert each time segment into a musical note
    for (let colIndex = 0; colIndex < filteredBoundaries.length - 1; colIndex++) {
        const startTime = filteredBoundaries[colIndex];
        const endTime = filteredBoundaries[colIndex + 1];
        const duration = endTime - startTime;
        
        // Map duration to musical note values
        let noteValue;
        if (duration < 750) noteValue = 8;        // 1/8 note (350-750ms)
        else if (duration < 1500) noteValue = 4;  // 1/4 note (750-1500ms)
        else if (duration < 3000) noteValue = 2;  // 1/2 note (1500-3000ms)
        else noteValue = 1;                       // whole note (3000ms+)
        
        // Collect all pitches that should sound during this time segment
        const pitches = [];
        let hasNonGreenColor = false;
        
        this.colorData.forEach((rowData, rowIndex) => {
            if (rowData.note && this._hasNonGreenColorInTimeRange(rowData, startTime, endTime)) {
                const pitchInfo = this._convertRowToPitch(rowData);
                if (pitchInfo) {
                    pitches.push(pitchInfo);
                    hasNonGreenColor = true;
                }
            }
        });
        
        // Add note or rest to the musical sequence
        this._notesToPlay.push({
            pitches: pitches,
            noteValue: noteValue,
            duration: duration,
            isRest: !hasNonGreenColor || pitches.length === 0
        });
    }
};

this._filterSmallSegments = function(boundaries) {
    const minDuration = 350; // Minimum duration for valid musical segments
    const filteredBoundaries = [boundaries[0]];
    
    for (let i = 1; i < boundaries.length; i++) {
        const segmentDuration = boundaries[i] - filteredBoundaries[filteredBoundaries.length - 1];
        
        // Only keep boundaries that create segments meeting minimum duration
        if (segmentDuration >= minDuration) {
            filteredBoundaries.push(boundaries[i]);
        }
        // Small segments are absorbed into adjacent larger segments
    }
    
    return filteredBoundaries;
};
```

### Interactive Control System

The widget provides comprehensive controls for fine-tuning the scanning process:

```javascript
this.createZoomControls = function() {
    this.zoomControls = document.createElement("div");
    this.zoomControls.style.position = "absolute";
    this.zoomControls.style.bottom = "0";
    this.zoomControls.style.display = "flex";
    this.zoomControls.style.alignItems = "center";
    this.zoomControls.style.gap = "8px";
    this.zoomControls.style.backgroundColor = "#f0f0f0";
    this.zoomControls.style.padding = "10px";
    this.zoomControls.style.borderTop = "1px solid #888";

    // Zoom control slider (0.1x to 3.0x magnification)
    this.zoomSlider = document.createElement("input");
    this.zoomSlider.type = "range";
    this.zoomSlider.min = "0.1";
    this.zoomSlider.max = "3";
    this.zoomSlider.step = "0.01";
    this.zoomSlider.value = "1";
    this.zoomSlider.oninput = () => this._handleZoom();

    // Column spacing control (20px to 200px spacing)
    this.spacingSlider = document.createElement("input");
    this.spacingSlider.type = "range";
    this.spacingSlider.min = "20";
    this.spacingSlider.max = "200";
    this.spacingSlider.step = "1";
    this.spacingSlider.value = "50";
    this.spacingSlider.oninput = () => this._handleVerticalSpacing();
    
    // Fine adjustment buttons for precise control
    const zoomOut = document.createElement("button");
    zoomOut.textContent = "−";
    zoomOut.onclick = () => this._adjustZoom(-0.01);
    
    const zoomIn = document.createElement("button");
    zoomIn.textContent = "+";
    zoomIn.onclick = () => this._adjustZoom(0.01);
};

this._handleZoom = function() {
    if (this.imageWrapper) {
        this.currentZoom = parseFloat(this.zoomSlider.value);
        this.imageWrapper.style.transform = `scale(${this.currentZoom})`;
        this.zoomValue.textContent = Math.round(this.currentZoom * 100) + '%';
        
        // Redraw grid lines to match new zoom level
        setTimeout(() => this._drawGridLines(), 50);
    }
};
```

### Grid Overlay and Visual Feedback System

The widget provides real-time visual feedback through an overlay grid system:

```javascript
this._drawGridLines = function() {
    if (!this.rowHeaderTable.rows.length || !this.gridOverlay) return;

    this.gridOverlay.innerHTML = '';
    const numRows = this.matrixData.rows.length;
    
    // Draw horizontal red lines for each musical row
    for (let i = 0; i < numRows; i++) {
        const line = document.createElement('div');
        line.style.position = 'absolute';
        line.style.left = '0px';
        line.style.right = '0px';
        line.style.height = '2px';
        line.style.backgroundColor = 'red';
        line.style.zIndex = '5';
        
        const position = (i + 1) * ROW_HEIGHT;
        line.style.top = `${position}px`;
        
        this.gridOverlay.appendChild(line);
    }
    
    // Draw vertical blue lines for timing columns
    const overlayRect = this.gridOverlay.getBoundingClientRect();
    const overlayWidth = overlayRect.width || 800;
    const numVerticalLines = Math.floor(overlayWidth / this.verticalSpacing);
    
    for (let i = 1; i <= numVerticalLines; i++) {
        const verticalLine = document.createElement('div');
        verticalLine.style.position = 'absolute';
        verticalLine.style.top = '0px';
        verticalLine.style.bottom = '0px';
        verticalLine.style.width = '1px';
        verticalLine.style.backgroundColor = 'blue';
        verticalLine.style.left = `${i * this.verticalSpacing}px`;
        
        this.gridOverlay.appendChild(verticalLine);
    }
};
```

### Animation and Scanning System

The scanning animation system creates moving vertical lines that analyze color patterns:

```javascript
this._playPhrase = function() {
    this._stopPlayback();
    this.activity.textMsg(_("Scanning image with vertical lines..."));
    
    // Create scanning lines for each musical note row
    this.scanningLines = [];
    this.colorData = [];
    
    // Initialize scanning line for each note row
    this.matrixData.rows.forEach((row, index) => {
        if (row.note) { // Only create lines for musical notes
            const scanLine = document.createElement('div');
            scanLine.style.position = 'absolute';
            scanLine.style.width = '2px';
            scanLine.style.backgroundColor = '#FF0000';
            scanLine.style.zIndex = '15';
            scanLine.style.left = '0px';
            
            // Position line within the row bounds
            const topPos = index * ROW_HEIGHT;
            const bottomPos = (index + 1) * ROW_HEIGHT;
            scanLine.style.top = `${topPos}px`;
            scanLine.style.height = `${ROW_HEIGHT}px`;
            
            this.gridOverlay.appendChild(scanLine);
            
            // Track line properties for animation
            this.scanningLines.push({
                element: scanLine,
                currentX: 0,
                rowIndex: index,
                topPos: topPos,
                bottomPos: bottomPos,
                currentColor: null,
                lastColorTime: performance.now()
            });
            
            // Initialize color data storage
            this.colorData.push({
                note: row.note,
                colorSegments: []
            });
        }
    });
    
    // Start animation
    this.isPlaying = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this._animateLines();
};

this._animateLines = function() {
    if (!this.isPlaying) return;
    
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    
    // Calculate scan speed (500ms between column markers)
    const timeBetweenColumns = 0.5;
    const scanSpeed = this.verticalSpacing / timeBetweenColumns;
    
    let allLinesCompleted = true;
    
    // Update each scanning line
    this.scanningLines.forEach(line => {
        if (line.completed) return;
        
        // Move line horizontally
        line.currentX += scanSpeed * deltaTime;
        line.element.style.left = `${line.currentX}px`;
        
        // Sample color at current position
        this._sampleAndDetectColor(line, now);
        
        // Check if line has completed scanning
        if (this._isLineBeyondImageHorizontally(line)) {
            line.completed = true;
            line.element.style.display = 'none';
        } else {
            allLinesCompleted = false;
        }
    });
    
    if (allLinesCompleted) {
        this._stopPlayback();
    } else {
        requestAnimationFrame(() => this._animateLines());
    }
};
```

### Audio Synthesis and Playback System

The widget includes a sophisticated audio system for real-time note playback:

```javascript
this._initAudio = function() {
    // Create synthesizer instance with piano samples
    this.synth = new Synth();
    this.synth.loadSamples();
    
    // Configure piano synthesizer for all pitch playback
    this.synth.createSynth(0, "piano", "piano", null);
};

this._playNote = function(note, duration = 0.5) {
    if (!this.synth) return;
    
    try {
        // Trigger note playback with specified parameters
        this.synth.trigger(0, note, duration, "piano", null, null, false, 0);
    } catch (e) {
        console.error("Error playing note:", e);
        this.activity.textMsg(_("Audio playback error: ") + e.message);
    }
};

// Polyphonic playback system for multiple simultaneous notes
this.playColorMusicPolyphonic = async function(colorData) {
    if (!this.synth) return;
    
    // Use filtered boundaries for consistent timing
    const columnBoundaries = this._analyzeColumnBoundaries();
    const filteredBoundaries = this._filterSmallSegments(columnBoundaries);
    
    let events = [];
    
    // Build timeline of note events
    for (let colIndex = 0; colIndex < filteredBoundaries.length - 1; colIndex++) {
        const startTime = filteredBoundaries[colIndex];
        const endTime = filteredBoundaries[colIndex + 1];
        const duration = endTime - startTime;
        
        // Check each row for notes to play
        this.colorData.forEach((rowData, rowIndex) => {
            if (rowData.note && this._hasNonGreenColorInTimeRange(rowData, startTime, endTime)) {
                events.push({
                    type: 'noteOn',
                    time: startTime,
                    note: rowData.note,
                    duration: duration
                });
                
                events.push({
                    type: 'noteOff',
                    time: startTime + duration,
                    note: rowData.note
                });
            }
        });
    }
    
    // Play events in chronological order
    events.sort((a, b) => a.time - b.time);
    
    let playingNotes = new Set();
    let lastTime = 0;
    
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const delay = Math.max(0, event.time - lastTime);
        
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        if (event.type === 'noteOn') {
            this._playNote(event.note, event.duration / 1000);
            playingNotes.add(event.note);
        } else {
            playingNotes.delete(event.note);
        }
        
        lastTime = event.time;
    }
};
```

### Export System and Music Blocks Integration

The widget creates proper Music Blocks action blocks from detected musical patterns:

```javascript
this._savePhrase = function() {
    if (!this.colorData || this.colorData.length === 0) {
        this.activity.textMsg(_("No color data to save. Please scan an image first."));
        return;
    }

    // Collect and analyze musical notes from color data
    this._collectNotesToPlay();
    
    if (this._notesToPlay.length === 0) {
        this.activity.textMsg(_("No notes detected from color scanning."));
        return;
    }

    // Hide palettes during block creation
    for (const name in this.activity.blocks.palettes.dict) {
        this.activity.blocks.palettes.dict[name].hideMenu(true);
    }
    this.activity.refreshCanvas();

    // Create Music Blocks action block structure
    const newStack = [
        [0, ["action", { collapsed: true }], 100, 100, [null, 1, null, null]],
        [1, ["text", { value: _("LEGO phrase") }], 0, 0, [0]]
    ];
    let endOfStackIdx = 0;

    // Convert each detected note into Music Blocks note blocks
    for (let i = 0; i < this._notesToPlay.length; i++) {
        const note = this._notesToPlay[i];
        const idx = newStack.length;
        
        // Create new note block
        newStack.push([idx, "newnote", 0, 0, [endOfStackIdx, idx + 1, idx + 2, null]]);
        
        // Set up block connections
        if (i === 0) {
            newStack[0][4][2] = idx; // Connect to action block
        } else {
            newStack[endOfStackIdx][4][3] = idx; // Connect to previous note
        }
        endOfStackIdx = idx;

        // Add note duration as fraction
        const delta = 5;
        newStack.push([idx + 1, "vspace", 0, 0, [idx, idx + delta]]);
        
        // Convert note value to fraction format
        let numerator, denominator;
        if (note.noteValue === 1.5) {
            numerator = 3; denominator = 2; // dotted half note
        } else {
            numerator = 1; denominator = note.noteValue;
        }
        
        newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
        newStack.push([idx + 3, ["number", { value: numerator }], 0, 0, [idx + 2]]);
        newStack.push([idx + 4, ["number", { value: denominator }], 0, 0, [idx + 2]]);

        // Connect note duration blocks
        newStack[idx][4][1] = idx + 2; // divide block
        newStack[idx][4][2] = idx + 1; // vspace block

        // Add pitch information for non-rest notes
        if (!note.isRest && note.pitches.length > 0) {
            let lastConnection = idx + 1; // vspace block
            
            note.pitches.forEach((pitch, pitchIndex) => {
                const pitchIdx = newStack.length;
                
                // Create pitch block with solfege and octave
                newStack.push([pitchIdx, "pitch", 0, 0, [lastConnection, pitchIdx + 1, pitchIdx + 2, null]]);
                newStack.push([pitchIdx + 1, ["solfege", { value: pitch.solfege }], 0, 0, [pitchIdx]]);
                newStack.push([pitchIdx + 2, ["number", { value: pitch.octave }], 0, 0, [pitchIdx]]);
                
                // Update connection chain
                if (lastConnection !== null) {
                    newStack[lastConnection][4][newStack[lastConnection][4].length - 1] = pitchIdx;
                }
                lastConnection = pitchIdx;
            });
        }
    }

    // Load the completed block structure into Music Blocks
    this.activity.blocks.loadNewBlocks(newStack);
    this.activity.textMsg(_("LEGO phrase saved as action blocks with ") + this._notesToPlay.length + _(" notes"));
};
```

### Data Visualization and Debugging

The widget generates visual representations of detected color patterns for analysis:

```javascript
this._generateColorVisualization = function() {
    if (!this.colorData || this.colorData.length === 0) return;
    
    // Create high-resolution canvas for visualization
    const canvasWidth = 800;
    const rowHeight = 50;
    const canvasHeight = this.colorData.length * rowHeight;
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    // Color mapping for visualization
    const colorMap = {
        'red': '#FF0000', 'orange': '#FFA500', 'yellow': '#FFFF00',
        'green': '#00FF00', 'blue': '#0000FF', 'purple': '#800080',
        'pink': '#FFC0CB', 'cyan': '#00FFFF', 'magenta': '#FF00FF',
        'white': '#FFFFFF', 'black': '#000000', 'gray': '#808080',
        'unknown': '#C0C0C0'
    };
    
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Render each row's color segments
    this.colorData.forEach((rowData, rowIndex) => {
        const y = rowIndex * rowHeight;
        
        // Draw row label
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${rowData.note || 'Unknown'}`, 10, y + 25);
        
        // Draw color segments
        if (rowData.colorSegments && rowData.colorSegments.length > 0) {
            let currentX = 150; // Start after label area
            const availableWidth = canvasWidth - 150 - 20;
            
            // Calculate total duration for proportional sizing
            const totalDuration = rowData.colorSegments.reduce((sum, seg) => sum + seg.duration, 0);
            
            rowData.colorSegments.forEach(segment => {
                const segmentWidth = (segment.duration / totalDuration) * availableWidth;
                
                ctx.fillStyle = colorMap[segment.color] || colorMap.unknown;
                ctx.fillRect(currentX, y + 5, segmentWidth, rowHeight - 10);
                
                // Add segment border
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1;
                ctx.strokeRect(currentX, y + 5, segmentWidth, rowHeight - 10);
                
                currentX += segmentWidth;
            });
        }
    });
    
    // Add column boundary lines
    this._drawColumnLines(ctx, canvasWidth, canvasHeight, 150, canvasWidth - 170);
    
    // Export as downloadable PNG
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lego-bricks-color-analysis.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
};
```

### Usage Workflow and Best Practices

1. **Widget Initialization**: Open the LEGO Bricks widget from Music Blocks after connecting pitch blocks
2. **Content Loading**: Upload a high-contrast image or start webcam with clear color patterns
3. **Image Positioning**: Use drag functionality to position the image optimally within the scanning area
4. **Settings Adjustment**: Fine-tune zoom (0.1x to 3.0x) and column spacing (20px to 200px) for optimal scanning
5. **Scanning Process**: Click the play button to initiate vertical line scanning with real-time color detection
6. **Results Analysis**: Review the generated color visualization PNG and listen to polyphonic playback
7. **Musical Export**: Save the detected musical phrase as Music Blocks action blocks for further editing

### Technical Requirements and Browser Compatibility

- **WebRTC Support**: Essential for webcam functionality in modern browsers
- **HTML5 Canvas API**: Required for pixel-level image analysis and color detection
- **Web Audio API**: Needed for real-time audio synthesis and note playback
- **File API**: Necessary for image upload and PNG export functionality
- **ES6+ JavaScript**: Modern JavaScript features for optimal performance
- **Minimum Browser Versions**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+

### Performance Optimization Features

- **Efficient Color Sampling**: 32-point vertical sampling reduces computational overhead
- **Temporal Filtering**: 350ms minimum duration eliminates noise and improves musical quality
- **Canvas Optimization**: Temporary canvas creation and disposal prevents memory leaks
- **Animation Frame Management**: RequestAnimationFrame ensures smooth 60fps scanning animation
- **Memory Management**: Automatic cleanup of scanning lines and color data after processing

### Accessibility and Inclusive Design

The LEGO Bricks widget incorporates comprehensive accessibility features:

- **Visual-to-Audio Conversion**: Transforms visual content into musical sequences for visually impaired users
- **High Contrast Interface**: Red horizontal lines and blue vertical lines provide clear visual guidance
- **Keyboard Navigation**: All controls accessible via keyboard shortcuts and tab navigation
- **Screen Reader Compatibility**: Semantic HTML structure with proper ARIA labels
- **Color-blind Accessibility**: Uses multiple visual cues including position, timing, and contrast
- **Customizable Interface**: Adjustable zoom and spacing accommodate different visual needs
- **Real-time Feedback**: Audio confirmation of detected colors and musical notes
- **Error Handling**: Comprehensive error messages guide users through troubleshooting
