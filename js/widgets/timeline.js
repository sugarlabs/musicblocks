/* eslint-disable no-undef */
// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget displays a read-only timeline with a moving playhead
// synchronized to music playback.

/* global _ */

/* exported Timeline */
class Timeline {
    static CANVAS_WIDTH = 800;
    static CANVAS_HEIGHT = 100;
    static TIMELINE_Y = 50;
    static PLAYHEAD_COLOR = "#FF0000";
    static TIMELINE_COLOR = "#333333";

    /**
     * Initializes the timeline widget.
     * @param {Object} activity - The activity object containing turtles and logo
     */
    init(activity) {
        this.activity = activity;
        this.isOpen = true;
        this.playheadPosition = 0;
        this.animationFrameId = null;

        // Create widget window
        this.widgetWindow = window.widgetWindows.windowFor(this, "timeline", "timeline");
        this.widgetWindow.clear();
        this.widgetWindow.show();

        // Create canvas element
        this.canvas = document.createElement("canvas");
        this.canvas.width = Timeline.CANVAS_WIDTH;
        this.canvas.height = Timeline.CANVAS_HEIGHT;
        this.canvas.style.backgroundColor = "#FFFFFF";
        this.canvas.style.border = "1px solid #CCCCCC";

        this.ctx = this.canvas.getContext("2d");

        // Add canvas to widget body
        this.widgetWindow.getWidgetBody().appendChild(this.canvas);

        // Set up close handler
        this.widgetWindow.onclose = () => {
            this.isOpen = false;
            this._stopAnimation();
            this.widgetWindow.destroy();
        };

        // Draw initial timeline
        this._drawTimeline();

        // Start animation loop
        this._startAnimation();

        // Center the widget
        this.widgetWindow.sendToCenter();
    }

    /**
     * Draws the timeline and playhead on the canvas
     * @private
     */
    _drawTimeline() {
        // Clear canvas
        this.ctx.clearRect(0, 0, Timeline.CANVAS_WIDTH, Timeline.CANVAS_HEIGHT);

        // Draw timeline base (horizontal line)
        this.ctx.strokeStyle = Timeline.TIMELINE_COLOR;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(10, Timeline.TIMELINE_Y);
        this.ctx.lineTo(Timeline.CANVAS_WIDTH - 10, Timeline.TIMELINE_Y);
        this.ctx.stroke();

        // Draw playhead (vertical line)
        this.ctx.strokeStyle = Timeline.PLAYHEAD_COLOR;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        const playheadX = 10 + this.playheadPosition;
        this.ctx.moveTo(playheadX, 20);
        this.ctx.lineTo(playheadX, 80);
        this.ctx.stroke();

        // Draw playhead indicator (small circle at top)
        this.ctx.fillStyle = Timeline.PLAYHEAD_COLOR;
        this.ctx.beginPath();
        this.ctx.arc(playheadX, 20, 5, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Updates the playhead position based on current playback state
     * @private
     */
    _updatePlayhead() {
        if (!this.isOpen || !this.activity) {
            return;
        }

        // Get the first turtle's current beat
        // In a more complete implementation, we might track all turtles
        const turtle = this.activity.turtles.ithTurtle(0);
        if (turtle && turtle.singer) {
            const currentBeat = turtle.singer.currentBeat || 0;
            const beatsPerMeasure = turtle.singer.beatsPerMeasure || 4;

            // Calculate playhead position
            // For this minimal version, we'll use a simple linear mapping
            // Assuming a fixed number of measures (e.g., 8 measures visible)
            const totalBeats = beatsPerMeasure * 8;
            const normalizedBeat = currentBeat % totalBeats;
            const maxWidth = Timeline.CANVAS_WIDTH - 20; // Account for margins
            this.playheadPosition = (normalizedBeat / totalBeats) * maxWidth;
        }

        // Redraw timeline with updated playhead
        this._drawTimeline();
    }

    /**
     * Starts the animation loop for playhead updates
     * @private
     */
    _startAnimation() {
        const animate = () => {
            if (this.isOpen) {
                this._updatePlayhead();
                this.animationFrameId = requestAnimationFrame(animate);
            }
        };
        animate();
    }

    /**
     * Stops the animation loop
     * @private
     */
    _stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}
