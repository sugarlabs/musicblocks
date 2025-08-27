<a href="https://github.com//sugarlabs/musicblocks/graphs/contributors" alt="Contributors">
    <img src="https://img.shields.io/github/contributors/sugarlabs/musicblocks" />
</a>

<a href="#license" alt="License">
    <img src="https://img.shields.io/github/license/sugarlabs/musicblocks" />
</a>

# Music Blocks

“_All musicians are subconsciously mathematicians._” — Monk

“_Music is a hidden arithmetic exercise of the soul, which does not
know that it is counting._” — Leibniz

Music Blocks is a _Visual Programming Language_ and collection of
_manipulative tools_ for exploring musical and mathematical concepts
in an integrative and entertaining way.

## Getting Started

Music Blocks is an interactive Web Application &mdash; the interaction
is done via basic mouse events like _click_, _right click_, _click and
drag_, etc. and keyboard events like _hotkey press_.  The application
is audio-visual; it produces graphics, artwork and music. Here are a
couple of screenshots to give you an idea of how the application looks
like:

![alt tag](./screenshots/Screenshot-1.png)

![alt tag](./screenshots/Screenshot-2.png)

Visit the Music Blocks website for a hands on experience:
[https://musicblocks.sugarlabs.org](https://musicblocks.sugarlabs.org).

Or download Music Blocks from the [Google Play Store](https://play.google.com/store/apps/details?id=my.musicblock.sugarlab)

Additional background on why we combine music and programming can be found
[here](./WhyMusicBlocks.md).

**Refer to the following sections to get familiar with this application:**

- [Running Music Blocks](#RUNNING-MUSIC-BLOCKS)
- [How to set up a local server](#HOW-TO-SET-UP-A-LOCAL-SERVER)
- [Using Music Blocks](#USING-MUSIC-BLOCKS)

If you are a developer (beginner, experienced, or pro), you are very
welcome to participate in the evolution of Music Blocks.

**Refer to the following sections to get an idea:**

- [Code of Conduct](#CODE-OF-CONDUCT)
- [Contributing](#CONTRIBUTING)
- [Modifying Music Blocks](#MODIFYING-MUSIC-BLOCKS)
- [Reporting Bugs](#REPORTING-BUGS)

**Refer to the following for more information regarding the evolution
  of this project:**

- [Credits](#CREDITS)
- [Music Blocks in Japan](#MUSIC-BLOCKS-IN-JAPAN)

## <a name="RUNNING_MUSIC_BLOCKS"></a>Running Music Blocks

Music Blocks is available under the _GNU Affero General Public License
(AGPL) v3.0_, a free, copyleft license.

Music Blocks is designed to run on a web browser. The ideal way to run
Music Blocks is to visit the URL
[_musicblocks.sugarlabs.org_](https://musicblocks.sugarlabs.org) in
your browser — _Google Chrome_ (or _Chromium_), _Microsoft Edge_
(_Chromium-based_), _Mozilla Firefox_, and _Opera_ work best.

To run from the most recent master branch (experimental), visit
[_sugarlabs.github.io/musicblocks_](https://sugarlabs.github.io/musicblocks).

## <a name="HOW_TO_SET_UP_A_LOCAL_SERVER"></a>How to set up a _local server_

Music Blocks is written using native browser technologies. The bulk of
the functionality is in vanilla _JavaScript_. Therefore, most of
the functionality can be accessed by launching the
[index.html](./index.html) file in the browser using
`file:///absolute/path/to/index.html`.

However, doing so, some functionality will be unavailable. Therefore, it is
best to launch a _local web server_ from the directory of Music
Blocks.

1. [Download](https://github.com/sugarlabs/musicblocks/archive/master.zip)
Music Blocks, or clone (`https://github.com/sugarlabs/musicblocks.git`
for _HTTPS_, or `gh repo clone sugarlabs/musicblocks` for _GitHub
CLI_), on your local machine.

2. In a terminal, `cd` to the directory where you downloaded/cloned
Music Blocks, using `cd path/to/musicblocks/`.

3. After you are in `path/to/musicblocks/` directory, install the dependencies using the following command

    ```bash
    npm install
    ```

4. After cloning the musicblocks repository, you can start a local server using npm

    ```bash
    npm run dev
    ```

6. You should see a message `Serving HTTP on 127.0.0.1 port 3000
(http://127.0.0.1:3000/) ...` since the HTTP Server is set to start
listening on port 3000.

7. Open your favorite browser and visit `localhost:3000` or `127.0.0.1:3000`.

**NOTE:** _Use `ctrl + c` or `cmd + c` to quit the HTTP Server to avoid
`socket.error:[Errno 48]`_.



## Local Setup with Docker

## Prerequisites

Before you begin, ensure you have Docker installed on your machine. You can download and install Docker from the [official Docker website](https://www.docker.com/get-started).

## Installation

1. Clone the Music Blocks repository to your local machine:

   ```bash
   git clone https://github.com/sugarlabs/musicblocks.git
   ```

2. Navigate to the cloned repository:

   ```bash
   cd musicblocks
   ```

3. Build the Docker image using the provided Dockerfile:

   ```bash
   docker build -t musicblocks .
   ```
## Running Music Blocks

1. Run the Docker container using the built image:

   ```bash
   docker run -p 3000:3000 musicblocks
   ```

   This command will start a Docker container running Music Blocks and expose it on port 3000.

2. Access Music Blocks in your web browser by navigating to `http://localhost:3000`.

## Stopping the Docker container

To stop the Docker container, use `Ctrl + C` in your terminal. This will stop the container and free up the port it was using.

## Additional Notes

- Make sure to replace `musicblocks` with the appropriate image name if you have tagged the Docker image differently.
- You can customize the port mapping (`-p`) if you prefer to use a different port for accessing Music Blocks.

---

This documentation provides a basic setup for running Music Blocks locally using Docker. Feel free to customize it further based on your specific requirements and environment.
## <a name="USING_MUSIC_BLOCKS"></a>Using Music Blocks

Once Music Blocks is running, you'll want suggestions on how to use
it. Follow [Using Music Blocks](./documentation/README.md) and [Music
Blocks Guide](./guide/README.md).

For Scratch and Snap users, you may want to look at [Music Blocks for
Snap Users](./Music_Blocks_for_Snap_Users.md).

Looking for a block? Find it in the
[Palette Tables](./guide/README.md#6-appendix).

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

## <a name="CODEOFCONDUCT"></a>Code of Conduct

The Music Blocks project adheres to the [Sugar Labs Code of
Conduct](https://github.com/sugarlabs/sugar-docs/blob/master/src/CODE_OF_CONDUCT.md)

## <a name="CONTRIBUTING"></a>Contributing

Please consider contributing to the project, with your ideas, your
music, your lesson plans, your artwork, and your code.

### Special Notes

Music Blocks is being built from the ground-up, to address several
architectural problems with this run. Since Music Blocks is a fork of
Turtle Blocks JS, musical functionality was added on top of it.
However, music is fundamental to Music Blocks. Besides, the Turtle
Blocks JS started initially with handful of features and was written
without a complex architecture. As Music Blocks was built on top of
that, it became incrementally complex, but the architecture remained
simple, thus resulting in a monolith. Also, the functionality is
tightly coupled with the interface and native client API (Web API).

Keeping these problems in mind, we have considered a foundational
rebuild that will address all these issues, whilst adding buffers for
future additions. Additionally, we will make use of a more elegant tech-stack to
develop and maintain this project given its scale. After the core is
built, we'll be porting features from this application to it.

Refer to the repository
[**sugarlabs/musicblocks-v4**](https://github.com/sugarlabs/musicblocks-v4)
for more information about the new project &mdash; _Music Blocks 4.0_.

### Tech Stack

Music Blocks is a Web Application and is written using browser
technologies &mdash; `HTML`, `CSS` (`SCSS`), `JavaScript`, `SVG`, etc.

If you're just getting started with development, you may refer to the
following resources:

- [HTML tutorial - w3schools.com](https://www.w3schools.com/html/default.asp)
- [HTML reference - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [CSS tutorial - w3schools.com](https://www.w3schools.com/css/default.asp)
- [CSS reference - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [JavaScript tutorial - w3schools.com](https://www.w3schools.com/js/default.asp)
- [JavaScript reference - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

Programmers, please follow these general [guidelines for
contributions](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md).

### License Header

Music Blocks is licensed under the [AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html).
If you add a new file to the Music Blocks code base, please be
sure to include a license header as per below:

```js
/**
 * MusicBlocks v3.6.2 (ADD THE UP-TO-DATE VERSION)
 *
 * @author Walter Bender (MODIFY THE AUTHOR AS NEEDED)
 *
 * @copyright 2025 Walter Bender (MODIFY THE AUTHOR AND YEAR AS NEEDED)
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
```

This header must be added at the top of **all source code files** to ensure compliance
with the project's open-source license.

### Translators

Music Blocks uses
[PO files](https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html)
to maintain translations of the text strings used in the
interface. The PO files are available through an
[interactive website](https://weblate.sugarlabs.org/projects/music-blocks/music-blocks/).

Alternatively, translators can clone the
[git repo](https://github.com/sugarlabs/musicblocks.git), edit the PO files
locally, and make a pull request.

Note that once the PO files are updated, they are compiled into an INI
file, which is the file used by Music Blocks.

### New Contributors

Use the
[discussions](https://github.com/sugarlabs/musicblocks/discussions)
tab at the top of the repository to:

- Ask questions you’re wondering about.
- Share ideas.
- Engage with other community members.

Feel free. But, please don't spam :p.

### Keep in Mind

1. Your contributions need not necessarily have to address any
discovered issue. If you encounter any, feel free to add a fix through
a PR, or create a new issue ticket.

2. Use [labels](https://github.com/sugarlabs/musicblocks/labels) on
your issues and PRs.

3. Please do not spam with many PRs consisting of little changes.

4. If you are addressing a bulk change, divide your commits across
multiple PRs, and send them one at a time. The fewer the number of
files addressed per PR, the better.

5. Communicate effectively. Go straight to the point. You don't need
to address anyone using '_sir_'. Don't write unnecessary comments;
don't be over-apologetic. There is no superiority hierarchy. Every
single contribution is welcome, as long as it doesn't spam or distract
the flow.

6. Write useful, brief commit messages. Add commit descriptions if
necessary. PR name should speak about what it is addressing and not
the issue. In case a PR fixes an issue, use `fixes #ticketno` or
`closes #ticketno` in the PR's comment. Briefly explain what your PR
is doing.

7. Always test your changes extensively before creating a PR. There's
no sense in merging broken code. If a PR is a _work in progress
(WIP)_, convert it to draft. It'll let the maintainers know it isn't
ready for merging.

8. Read and revise the concepts about programming constructs you're
dealing with. You must be clear about the behavior of the language or
compiler/transpiler. See [JavaScript
docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

9. If you have a question, do a _web search_ first. If you don't find
any satisfactory answer, then ask it in a comment. If it is a general
question about Music Blocks, please use the new
[discussions](https://github.com/sugarlabs/musicblocks/discussions)
tab on top the the repository, or the _Sugar-dev Devel
<[sugar-devel@lists.sugarlabs.org](mailto:sugar-devel@lists.sugarlabs.org)>_
mailing list. Don't ask silly questions (unless you don't know it is
silly ;p) before searching it on the web.

10. Work on things that matter. Follow three milestones: `Port Ready`,
`Migration`, and `Future`.  Those tagged `Port Ready` are
priority. Those tagged with `Migration` will be taken care of during
or after the foundation rebuild. Feel free to participate in the
conversation, adding valuable comments. Those tagged with `Future`
need not be addressed presently.

_Please note there is no need to ask permission to work on an
issue. You should check for pull requests linked to an issue you are
addressing; if there are none, then assume nobody has done
anything. Begin to fix the problem, test, make your commits, push your
commits, then make a pull request. Mention an issue number in the pull
request, but not the commit message. These practices allow the
competition of ideas (Sugar Labs is a meritocracy)._

## <a name="MODIFYING_MUSIC_BLOCKS"></a>Modifying Music Blocks

The core functionality for Music Blocks resides in the [`js/`
directory](./js/). Individual modules are described in more detail in
[js/README.md](./js/README.md).

**NOTE:** As for any changes, please make a local copy by cloning this
[repository](https://github.com/sugarlabs/musicblocks.git). Make your
changes, test them, and only then make a pull request.

[Contributing
Code](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md)
provides a general overview of Sugar Lab's guidelines. See
[Contributing](#CONTRIBUTING) section for specific details about this
repository.

## <a name="REPORTING_BUGS"></a>Reporting Bugs

Bugs can be reported in the [issues
tab](https://github.com/sugarlabs/musicblocks/issues) of this
repository.

If possible, please include the browser _console log output_, and
_steps to reproduce_, when reporting bugs. To access the console, type
`Ctrl-Shift-J`/`F12` on most browsers. Alternately, _right click_ and
select `Inspect`. You may need to set the `Default levels` for the
console to `Verbose` in order to see all of the output, however, in
most cases that won't be required. In fact, it'll only clutter the
list, so select it only when required.

## <a name="CREDITS"></a>Credits

Music Blocks is a fork of [Turtle Blocks
JS](https://github.com/sugarlabs/turtleblocksjs) created by _Walter
Bender ([@walterbender](https://github.com/walterbender))_.

[_Devin Ulibarri_](http://www.devinulibarri.com/) has contributed
functional and user-interface designs. Many of his contributions were
inspired by the music education ideas, representations and practices
(e.g. aspects of matrix, musical cups) developed and published by
[_Larry
Scripp_](https://web.archive.org/web/20160204212801/http://www.larryscripp.net/)
with whom _Devin_ studied at New England Conservatory and for whom he
worked at Affron Scripp & Associates, LLC, [Center for Music and the
Arts in Education
(CMAIE)](https://web.archive.org/web/20210713204847/http://centerformie.org/),
and [Music in
Education](https://web.archive.org/web/20231130103746/http://music-in-education.org/). Some
of the initial graphics were contributed by [_Chie
Yasuda_](https://www.chieyasuda.com).

Much of the initial coding specific to Music Blocks was done by _Yash
Khandelwal ([@khandelwalYash](https://github.com/khandelwalYash))_ as
part of Google Summer of Code (GSoC) 2015. _Hemant Kasat
([@hemantkasat](https://github.com/hemantkasat))_ contributed to
additional widgets as part of GSoC 2016. Additional contributions were
made by _Tayba Wasim ([@Tabs16](https://github.com/Tabs16))_, _Dinuka
Tharangi Jayaweera ([@Tharangi](https://github.com/Tharangi))_,
_Prachi Agrawal
([@prachiagrawal269](https://github.com/prachiagrawal269))_, _Cristina
Del Puerto ([@cristinadp](https://github.com/cristinadp))_, and
_Hrishi Patel ([@Hrishi1999](https://github.com/Hrishi1999))_ as part
of GSoC 2017. During GSoC 2018, _Riya Lohia
([@riyalohia](https://github.com/riyalohia))_ developed a Temperament
widget.  _Ritwik Abhishek ([@a-ritwik](https://github.com/a-ritwik))_
added a keyboard widget and a pitch-tracking widget. During GSoC 2019,
_Favor Kelvin ([@fakela](https://github.com/fakela))_ refactored much
of the code to use promises. During GSoC 2020, _Anindya Kundu
([@meganindya](https://github.com/meganindya))_ did a major
refactoring of the code base to support JavaScript export. _Aviral
Gangwar ([@aviral243](https://github.com/aviral243))_ enhanced the
internal representation of mode and key.  _Saksham Mrig
([@sksum](https://github.com/sksum))_ fixed 70+ bugs and added support
for pitch tracking and MIDI import.

Many students contributed to the project as part of Google Code-in
(2015&ndash;2019).  _Sam Parkinson
([@samdroid-apps](https://github.com/samdroid-apps))_ built the Planet
during GCI.  _Emily Ong ([@EmilyOng](https://github.com/EmilyOng))_
designed our mouse icon and _Euan Ong
([@eohomegrownapps](https://github.com/eohomegrownapps))_ redesigned
the Planet code as a series of GCI tasks.  _Austin George
([@aust-n](https://github.com/aust-n))_ refactored the toolbars as a
series of GCI tasks. _Bottersnike
([@Bottersnike](https://github.com/Bottersnike))_ redesigned the
widgets and the Block API, _Andrea Gonzales
([@AndreaGon](https://github.com/AndreaGon))_ made the widgets
responsive, _Marcus Chong ([@pidddgy](https://github.com/pidddgy))_
refactored the update code, resulting in an order-of-magnitude
improvement in CPU usage, and _Samyok Nepal
([@nepaltechguy2](https://github.com/nepaltechguy2))_ updated the
local storage mechanism to use localForage.

A full list of
[contributors](https://github.com/sugarlabs/musicblocks/graphs/contributors)
is available.

## <a name="MUSIC_BLOCKS_IN_JAPAN"></a>Music Blocks in Japan

[Gakken STEAM](https://gakken-steam.jp/music_blocks/)

## License

Music Blocks is licensed under the
[AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html), which means it
will always be free to copy, modify, and hopefully improve. We respect
your privacy: while Music Blocks stores your session information in
your browser's local storage, it does not and will never access these
data for purposes other than to restore your session. Music Blocks will
never share these data with any third parties.

There is a Planet where you can share your projects with others and
remix projects created by other Music Blocks users. Use of the Planet
is anonymous and not required in order to enjoy Music Blocks.

Have fun, play hard, and learn.
