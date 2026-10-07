/**
 * MusicBlocks
 *
 * @copyright 2025-26 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global

   _, piemenuVoices, LegoWidget
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/piemenus.js
        piemenuVoices
    - js/widgets/legobricks.js
        LegoWidget
*/

/* exported LegoBricksPlayback */

/**
 * @file LegoBricksPlayback.js
 * @description LEGO Bricks playback: the widget timers, the synth and instrument menu, the scanning
 * lines and polyphonic playback.
 *
 * The methods are moved as they were from the LegoWidget constructor. LegoWidget calls this
 * function with the widget as `this` (see LegoWidget.installModules), so every method is still
 * set on the widget instance and `this` inside it is still the widget.
 */
function LegoBricksPlayback() {
    /**
     * Schedules a timeout owned by the widget lifecycle.
     * @private
     * @param {Function} callback - Callback to run after the delay.
     * @param {number} delay - Delay in milliseconds.
     * @returns {number} Timer ID.
     */
    this._setWidgetTimeout = function (callback, delay) {
        if (this._timerManager !== null) {
            return this._timerManager.setTimeout(callback, delay);
        }

        let id;
        id = setTimeout(() => {
            this._activeTimeouts.delete(id);
            callback();
        }, delay);
        this._activeTimeouts.add(id);
        return id;
    };

    /**
     * Clears a timeout owned by the widget lifecycle.
     * @private
     * @param {number} id - Timer ID returned by _setWidgetTimeout.
     * @returns {boolean} Whether the timeout was tracked and cleared.
     */
    this._clearWidgetTimeout = function (id) {
        if (id === null || id === undefined) {
            return false;
        }

        if (this._timerManager !== null && this._timerManager.clearTimeout(id)) {
            return true;
        }

        if (this._activeTimeouts.has(id)) {
            clearTimeout(id);
            this._activeTimeouts.delete(id);
            return true;
        }

        return false;
    };

    /**
     * Clears all timers owned by the widget lifecycle.
     * @private
     * @returns {number} Number of tracked timers cleared.
     */
    this._clearWidgetTimers = function () {
        let count = 0;

        if (this._timerManager !== null) {
            count += this._timerManager.clearAll();
        }

        for (const id of this._activeTimeouts) {
            clearTimeout(id);
            count++;
        }
        this._activeTimeouts.clear();

        if (this._polyphonicTimeout !== null) {
            this._clearWidgetTimeout(this._polyphonicTimeout);
            this._polyphonicTimeout = null;
        }

        return count;
    };

    /**
     * Initializes the audio synthesizer.
     * @private
     */
    this._initAudio = function () {
        // Create a new synthesizer instance
        this.synth = new Synth();
        this.synth.loadSamples();

        // Create the default electronic synth for all pitch playback
        this.synth.createSynth(0, this.selectedInstrument, this.selectedInstrument, null);
    };

    /**
     * Plays a note when a pitch row is clicked.
     * @private
     * @param {string} note - The note to play (e.g., "C4")
     * @param {number} duration - Duration in seconds (default 0.5)
     */
    this._playNote = function (note, duration = 0.5) {
        if (!this.synth) return;

        try {
            // Play the note using the selected instrument
            this.synth.trigger(0, note, duration, this.selectedInstrument, null, null, false, 0);
        } catch (e) {
            console.error("Error playing note:", e);
        }
    };

    /**
     * Changes the selected instrument for playback.
     * @private
     * @returns {void}
     */
    this._changeInstrument = function () {
        this.selectedInstrument = this.instrumentSelect.value;

        // Recreate the synth with the new instrument
        if (this.synth) {
            this.synth.createSynth(0, this.selectedInstrument, this.selectedInstrument, null);
        }

        // Show a message indicating the instrument change
        this.activity.textMsg(
            _("Instrument changed to: %s").replace(/%s/g, this.selectedInstrument)
        );
    };

    /**
     * Creates a pie menu for instrument selection.
     * @private
     * @returns {void}
     */
    this._createInstrumentPieMenu = function () {
        // Define instrument options
        const voiceLabels = [
            _("electronic synth"),
            _("piano"),
            _("guitar"),
            _("acoustic guitar"),
            _("electric guitar"),
            _("violin"),
            _("viola"),
            _("cello"),
            _("bass"),
            _("flute"),
            _("clarinet"),
            _("saxophone"),
            _("trumpet"),
            _("trombone"),
            _("oboe"),
            _("tuba"),
            _("banjo"),
            _("sine"),
            _("square"),
            _("sawtooth"),
            _("triangle")
        ];

        const voiceValues = [
            "electronic synth",
            "piano",
            "guitar",
            "acoustic guitar",
            "electric guitar",
            "violin",
            "viola",
            "cello",
            "bass",
            "flute",
            "clarinet",
            "saxophone",
            "trumpet",
            "trombone",
            "oboe",
            "tuba",
            "banjo",
            "sine",
            "square",
            "sawtooth",
            "triangle"
        ];

        const categories = []; // No categories needed for instruments

        // Create a mock block object for the pie menu
        const mockBlock = {
            // Position the pie menu near the button
            container: {
                x: this.instrumentButton.offsetLeft + this.instrumentButton.offsetWidth / 2,
                y: this.instrumentButton.offsetTop + this.instrumentButton.offsetHeight / 2,
                children: [], // Mock children array for setChildIndex
                setChildIndex: (child, index) => {} // Mock function
            },

            // Mock text object that the pie menu expects
            text: {
                _text: this.selectedInstrument,
                get text() {
                    return this._text;
                },
                set text(value) {
                    this._text = value;
                    // Update the button text when the pie menu updates the text
                    if (this._updateCallback) {
                        this._updateCallback(value);
                    }
                },
                _updateCallback: null
            },

            value: this.selectedInstrument,

            activity: {
                canvas: {
                    offsetLeft: 0,
                    offsetTop: 0
                },
                blocksContainer: {
                    x: 0,
                    y: 0
                },
                getStageScale: () => 1,
                logo: {
                    synth: this.synth
                },
                turtles: {
                    ithTurtle: index => {
                        return {
                            singer: {
                                instrumentNames: [this.selectedInstrument]
                            }
                        };
                    }
                }
            },

            blocks: {
                blockScale: 1,
                turtles: {
                    _canvas: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                }
            },

            // Mock methods needed by piemenu
            updateCache: () => {},
            updateValue: newValue => {
                // Update the instrument when selection is made
                this.selectedInstrument = newValue;
                this.instrumentButton.textContent =
                    newValue.charAt(0).toUpperCase() + newValue.slice(1);

                // Recreate the synth with the new instrument
                if (this.synth) {
                    this.synth.createSynth(
                        0,
                        this.selectedInstrument,
                        this.selectedInstrument,
                        null
                    );
                }

                // Show a message indicating the instrument change
                this.activity.textMsg(
                    _("Instrument changed to: %s").replace(/%s/g, this.selectedInstrument)
                );

                // Update the mock block's value and text
                mockBlock.value = newValue;
                mockBlock.text.text = newValue;
            }
        };

        // Set up the text update callback to update our button
        mockBlock.text._updateCallback = newText => {
            // Update the instrument when text is set by pie menu
            const newInstrument =
                voiceValues[
                    voiceLabels.findIndex(label => label.toLowerCase() === newText.toLowerCase())
                ] || newText.toLowerCase();

            this.selectedInstrument = newInstrument;
            this.instrumentButton.textContent =
                newInstrument.charAt(0).toUpperCase() + newInstrument.slice(1);

            // Recreate the synth with the new instrument
            if (this.synth) {
                this.synth.createSynth(0, this.selectedInstrument, this.selectedInstrument, null);
            }

            // Show a message indicating the instrument change
            this.activity.textMsg(
                _("Instrument changed to: %s").replace(/%s/g, this.selectedInstrument)
            );
        };

        // Call the pie menu function
        piemenuVoices(
            mockBlock,
            voiceLabels,
            voiceValues,
            categories,
            this.selectedInstrument,
            false
        );
    };

    /**
     * Plays the current musical phrase with vertical scanning lines.
     * @private
     */
    this._playPhrase = function () {
        // Clear any existing animation
        this._stopPlayback();
        this.activity.textMsg(_("Scanning image with vertical lines..."));

        // Reset the visualization flag to allow new download
        this.hasGeneratedVisualization = false;

        // Get all grid lines (sorted by position)
        const gridLines = Array.from(this.gridOverlay.querySelectorAll("div"))
            .filter(el => el.style.backgroundColor === "red")
            .sort((a, b) => {
                const aTop = parseFloat(a.style.top);
                const bTop = parseFloat(b.style.top);
                return aTop - bTop;
            });

        // Create scanning lines for each musical note row
        this.scanningLines = [];
        this.colorData = [];

        // Get the actual canvas/overlay dimensions
        const overlayRect = this.gridOverlay.getBoundingClientRect();
        const canvasHeight =
            overlayRect.height || this.matrixData.rows.length * LegoWidget.ROW_HEIGHT;
        const totalNoteRows = this.matrixData.rows.filter(row => row.note).length;

        // Create entries and scanning lines for each musical note
        this.matrixData.rows.forEach((row, index) => {
            if (!row.note) return; // Skip non-note rows

            this.colorData[index] = {
                note: row.note,
                label: row.label,
                colorSegments: []
            };

            // Calculate vertical position for this note - fixed to canvas grid
            const topPos = index * LegoWidget.ROW_HEIGHT;
            const bottomPos = (index + 1) * LegoWidget.ROW_HEIGHT;

            // Ensure we don't go beyond canvas boundaries
            const clampedTopPos = Math.max(0, Math.min(topPos, canvasHeight));
            const clampedBottomPos = Math.max(0, Math.min(bottomPos, canvasHeight));

            // Skip if this row is completely outside canvas bounds
            if (clampedTopPos >= canvasHeight || clampedBottomPos <= 0) {
                // Fill this row with selected background color for the entire duration
                this.colorData[index].colorSegments.push({
                    color: this.selectedBackgroundColor.name,
                    duration: 5000, // Default scan duration
                    timestamp: performance.now()
                });
                return;
            }

            // Create vertical scanning line
            const line = document.createElement("div");
            line.style.position = "absolute";
            line.style.width = "3px"; // Slightly thicker line for better visibility
            line.style.height = clampedBottomPos - clampedTopPos + "px";
            line.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
            line.style.zIndex = "20";
            line.style.left = "0px";
            line.style.top = clampedTopPos + "px";
            line.dataset.lineId = index;
            this.gridOverlay.appendChild(line);

            this.scanningLines.push({
                element: line,
                topPos: clampedTopPos,
                bottomPos: clampedBottomPos,
                currentX: 0,
                currentColor: null,
                colorStartTime: null,
                completed: false,
                rowIndex: index
            });
        });

        // Animation variables
        this.isPlaying = true;
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;

        // Start animation
        this._animateLines();
    };

    /**
     * Animates all scanning lines with improved color detection
     * @private
     */
    this._animateLines = function () {
        if (!this.isPlaying) return;

        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        const containerRect = this.gridOverlay.getBoundingClientRect();
        // Keep consistent time between vertical blue lines (column spacing)
        // Target: 500ms between each vertical line for instructor predictability
        const timeBetweenColumns = 0.5; // seconds per column spacing
        const scanSpeed = this.verticalSpacing / timeBetweenColumns; // pixels per second

        let allLinesCompleted = true;

        this.scanningLines.forEach(line => {
            if (line.completed) return;

            // Update horizontal position
            line.currentX += scanSpeed * deltaTime;
            const maxX = containerRect.width;

            // Check if we've reached the container boundary or the right edge of the actual image
            if (line.currentX > maxX || this._isLineBeyondImageHorizontally(line)) {
                this._finishScanLine(line, now);
                return;
            }

            allLinesCompleted = false;

            // Update line position
            line.element.style.left = line.currentX + "px";

            // Sample colors across the entire vertical line
            this._sampleAndDetectColor(line, now);
        });

        if (allLinesCompleted) {
            this._stopPlayback();
        } else {
            this._animationFrameId = requestAnimationFrame(() => this._animateLines());
        }
    };

    /**
     * Marks a scanning line as done and saves the color it was on. _sampleAndDetectColor only
     * saves a segment when the color changes, so without this the color a row ends on, or a
     * row's only color, would be lost.
     * @private
     * @param {object} line - The scanning line object
     * @param {number} now - The current time in milliseconds
     * @returns {void}
     */
    this._finishScanLine = function (line, now) {
        line.completed = true;
        if (line.currentColor && line.colorStartTime) {
            const duration = now - line.colorStartTime;
            // Same minimum as the segments saved on a color change.
            if (duration > 1000) {
                this._addColorSegment(line.rowIndex, line.currentColor, duration);
            }
        }
    };

    /**
     * Checks if the scanning line has moved beyond the right edge of the actual image
     * @private
     * @param {object} line - The scanning line object
     * @returns {boolean} True if line is beyond image's right edge
     */
    this._isLineBeyondImageHorizontally = function (line) {
        // Get the image or video element
        let mediaElement = null;
        if (this.imageWrapper) {
            mediaElement =
                this.imageWrapper.querySelector("img") || this.imageWrapper.querySelector("video");
        }

        if (!mediaElement) {
            return false; // If no image, let it continue scanning the container
        }

        // Get the actual image display area
        const imageRect = mediaElement.getBoundingClientRect();
        const overlayRect = this.gridOverlay.getBoundingClientRect();

        // Calculate image position relative to overlay (account for positioning/dragging)
        const imageLeft = imageRect.left - overlayRect.left;
        const imageRight = imageLeft + imageRect.width;

        // Check if the scanning line is beyond the right edge of the image
        const lineX = line.currentX;

        if (lineX >= imageRight) {
            return true;
        }

        return false;
    };

    /**
     * Stops ongoing polyphonic audio playback, cancels pending note timers,
     * and silences any currently playing synthesizer notes.
     * @private
     * @returns {void}
     */
    this._stopPolyphonicPlayback = function () {
        this._polyphonicPlaybackId++;
        if (this._polyphonicTimeout) {
            this._clearWidgetTimeout(this._polyphonicTimeout);
            this._polyphonicTimeout = null;
        }
        if (typeof this._resolvePolyphonicWait === "function") {
            const resolve = this._resolvePolyphonicWait;
            this._resolvePolyphonicWait = null;
            resolve();
        }
        if (this._playingNotes && this._playingNotes.size > 0 && this.synth) {
            this._playingNotes.forEach(note => {
                this.synth.stopSound(0, this.selectedInstrument, note);
            });
            this._playingNotes.clear();
        }
    };

    /**
     * Stops the current playback animation.
     * @private
     */
    this._stopPlayback = function () {
        this.isPlaying = false;
        this._stopPolyphonicPlayback();

        this.activity.hideMsgs();

        if (this.playButton) {
            const img = this.playButton.querySelector("img");
            if (img) img.src = "header-icons/play-button.svg";
        }

        // Save final color segments for all lines
        if (this.scanningLines) {
            const now = performance.now();
            this.scanningLines.forEach(line => {
                // Save the final color segment if it exists
                if (line.currentColor && line.colorStartTime) {
                    const duration = now - line.colorStartTime;
                    if (duration > 1000) {
                        // Save final segment if long enough (increased from 400ms)
                        this._addColorSegment(line.rowIndex, line.currentColor, duration);
                    }
                }

                // Remove the scanning line element
                if (line.element && line.element.parentNode) {
                    line.element.parentNode.removeChild(line.element);
                }
            });
            this.scanningLines = null;
        }

        // Only generate color visualization PNG if scanning was actually completed and not generated yet
        // This prevents the double download issue where _stopPlayback() is called at the start for cleanup
        if (!this.hasGeneratedVisualization && this.colorData && this.colorData.length > 0) {
            // Check if any colorData actually has color segments (indicating scanning occurred)
            const hasScannedData = this.colorData.some(
                row => row && row.colorSegments && row.colorSegments.length > 0
            );

            if (hasScannedData) {
                // Merge consecutive segments with same colors
                this._mergeConsecutiveColorSegments();

                this.hasGeneratedVisualization = true; // Set flag to prevent double generation
                this._setWidgetTimeout(() => {
                    this._generateColorVisualization();
                    this._drawColumnLinesOnCanvas(); // Draw column lines on the overlay
                }, 100); // Small delay to ensure all data is processed
            }
        }
    };

    /**
     * Plays all detected notes simultaneously, using filtered column boundaries.
     * Only plays when color is NOT the selected background color.
     * Updated to use same filtering logic as export (350ms minimum).
     * @param {Array} colorData - The colorData array from scanning.
     */
    this.playColorMusicPolyphonic = async function (colorData) {
        this._stopPolyphonicPlayback();
        const currentPlaybackId = this._polyphonicPlaybackId;

        if (!this.synth) this._initAudio();

        // Use the same boundary analysis and filtering as export
        const columnBoundaries = this._analyzeColumnBoundaries();
        const filteredBoundaries = this._filterSmallSegments(columnBoundaries);

        // Build timeline using filtered boundaries instead of raw segments
        let events = [];

        // For each filtered time column, check which notes should play
        for (let colIndex = 0; colIndex < filteredBoundaries.length - 1; colIndex++) {
            const startTime = filteredBoundaries[colIndex];
            const endTime = filteredBoundaries[colIndex + 1];
            const duration = endTime - startTime;

            // Check each row for non-background colors in this time range
            colorData.forEach((rowData, rowIndex) => {
                if (rowData && rowData.colorSegments && rowData.note) {
                    let currentTime = 0;
                    let hasNonBackgroundColor = false;

                    // Check if this time column overlaps with any non-background segments
                    for (const segment of rowData.colorSegments) {
                        const segmentStart = currentTime;
                        const segmentEnd = currentTime + segment.duration;

                        // Check if this segment overlaps with our time column
                        if (segmentStart < endTime && segmentEnd > startTime) {
                            // Calculate the actual overlap duration
                            const overlapStart = Math.max(segmentStart, startTime);
                            const overlapEnd = Math.min(segmentEnd, endTime);
                            const overlapDuration = overlapEnd - overlapStart;

                            // Only count as significant if overlap is substantial (>350ms)
                            // This prevents spillovers <350ms across blue lines from creating duplicate notes
                            if (
                                overlapDuration > 1000 &&
                                segment.color !== this.selectedBackgroundColor.name
                            ) {
                                hasNonBackgroundColor = true;
                                break;
                            } else if (
                                overlapDuration <= 350 &&
                                segment.color !== this.selectedBackgroundColor.name
                            ) {
                                // Ignore small overlaps during playback
                            }
                        }
                        currentTime += segment.duration;
                    }

                    // If we found non-background color, add note on/off events
                    if (hasNonBackgroundColor) {
                        events.push({
                            time: startTime,
                            type: "on",
                            note: rowData.note,
                            rowIdx: rowIndex
                        });
                        events.push({
                            time: endTime,
                            type: "off",
                            note: rowData.note,
                            rowIdx: rowIndex
                        });
                    }
                }
            });
        }

        // Sort events by time
        events.sort((a, b) => a.time - b.time);

        // Track which notes are currently playing
        this._playingNotes = new Set();
        let lastTime = 0;

        for (let i = 0; i < events.length; i++) {
            if (currentPlaybackId !== this._polyphonicPlaybackId) {
                return;
            }

            const evt = events[i];
            const waitTime = evt.time - lastTime;
            if (waitTime > 0) {
                // Wait for the time until the next event
                await new Promise(resolve => {
                    this._resolvePolyphonicWait = resolve;
                    this._polyphonicTimeout = this._setWidgetTimeout(() => {
                        this._polyphonicTimeout = null;
                        this._resolvePolyphonicWait = null;
                        resolve();
                    }, waitTime);
                });
                if (currentPlaybackId !== this._polyphonicPlaybackId) {
                    return;
                }
            }
            if (evt.type === "on") {
                // Start note (if not already playing)
                if (!this._playingNotes.has(evt.note)) {
                    this.synth.trigger(
                        0,
                        evt.note,
                        999,
                        this.selectedInstrument,
                        null,
                        null,
                        false,
                        0
                    ); // Long duration, will stop manually
                    this._playingNotes.add(evt.note);
                }
            } else if (evt.type === "off") {
                // Stop note
                this.synth.stopSound(0, this.selectedInstrument, evt.note);
                this._playingNotes.delete(evt.note);
            }
            lastTime = evt.time;
        }

        if (currentPlaybackId !== this._polyphonicPlaybackId) {
            return;
        }

        // Ensure all notes are stopped at the end
        if (this._playingNotes && this.synth) {
            this._playingNotes.forEach(note => {
                this.synth.stopSound(0, this.selectedInstrument, note);
            });
            this._playingNotes.clear();
        }
    };
}

if (typeof module !== "undefined") {
    module.exports = LegoBricksPlayback;
}
