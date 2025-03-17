// Copyright (c) 2016-21 Walter Bender
// Copyright (c) 2016 Hemant Kasat
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget enable us to create pitches of different frequency varying
// from given frequency to nextoctave frequency(two times the given frequency)
// in continuous manner.

/* global _, Tone */

/*
   Global locations
    js/utils/utils.js
        _
*/

/* exported PitchSlider */
class PitchSlider {
    static ICONSIZE = 32;
    static SEMITONE = Math.pow(2, 1 / 12);

    /**
     * @constructor
     */
    constructor() {
        this._delta = 0;
        this.sliders = {};
        this._cellScale = 0;
        this.isActive = false; // Flag to indicate if the slider is active
    }

    /**
     * Intializes the pitch/slider
     * @returns {void}
     */
    init(activity) {
        this.activity = activity;
        if (window.widgetWindows.openWindows["slider"]) return;
        if (!this.frequencies || !this.frequencies.length) this.frequencies = [392];

        const oscillators = [];
        for (let i = 0; i < this.frequencies.length; i++) {
            const osc = new Tone.AMSynth().toDestination();
            oscillators.push(osc);
        }

        this._cellScale = 1.0;
        this.widgetWindow = window.widgetWindows.windowFor(this, "pitch slider", "slider", true);
        
        // Set global flag that pitch slider is active
        this.isActive = true;
        
        // Store reference to this pitch slider in the logo object for global access
        activity.logo.pitchSlider = this;
        
        this.widgetWindow.onclose = () => {
            for (const osc of oscillators) osc.triggerRelease();
            this.isActive = false; // Reset flag when widget is closed
            activity.logo.pitchSlider = null; // Remove reference
            this.widgetWindow.destroy();
        };

        // Add global keyboard event listener with the highest capture priority
        const keyHandler = (event) => {
            if (!this.isActive) return;
            
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
                event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        };
        
        // Add the handler to various elements to ensure it's captured
        this.widgetWindow.getWidgetBody().addEventListener('keydown', keyHandler, true);
        document.addEventListener('keydown', keyHandler, true);

        const MakeToolbar = (id) => {
            const toolBarDiv = document.createElement("div");
            this.widgetWindow._toolbar.appendChild(toolBarDiv);
            toolBarDiv.style.float = "left";

            const min = this.frequencies[id] / 2;
            const max = this.frequencies[id] * 2;
            const slider = this.widgetWindow.addRangeSlider(
                this.frequencies[id],
                toolBarDiv,
                min,
                max,
                "pitchSlider"
            );

            // Specifically prevent arrow keys from affecting the slider
            slider.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
                    event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            }, true);

            // label for frequency
            const freqLabel = document.createElement("div");
            freqLabel.className = "wfbtItem";
            toolBarDiv.appendChild(freqLabel);
            freqLabel.innerHTML = `<label>${this.frequencies[id]}</label>`;

            this.sliders[id] = slider;
            const changeFreq = () => {
                this.frequencies[id] = this.sliders[id].value;
                oscillators[id].frequency.linearRampToValueAtTime(
                    this.frequencies[id],
                    Tone.now() + 0.05
                );
                freqLabel.innerHTML = `<label>${this.frequencies[id]}</label>`;
            };

            slider.oninput = () => {
                oscillators[id].triggerAttack(this.frequencies[id]);
                changeFreq();
            };
            slider.onchange = () => {
                // this._save(this.frequencies[id]);
                oscillators[id].triggerRelease();
            };

            this.widgetWindow.addButton(
                "up.svg",
                PitchSlider.ICONSIZE,
                _("Move up"),
                toolBarDiv
            ).onclick = () => {
                slider.value = Math.min(slider.value * PitchSlider.SEMITONE, max); //value is a string
                changeFreq();
                oscillators[id].triggerAttackRelease(this.frequencies[id], "4n");
            };

            this.widgetWindow.addButton(
                "down.svg",
                PitchSlider.ICONSIZE,
                _("Move down"),
                toolBarDiv
            ).onclick = () => {
                slider.value = Math.max(slider.value / PitchSlider.SEMITONE, min); //value is a string
                changeFreq();
                oscillators[id].triggerAttackRelease(this.frequencies[id], "4n");
            };

            this.widgetWindow.addButton(
                "export-chunk.svg",
                PitchSlider.ICONSIZE,
                _("Save"),
                toolBarDiv
            ).onclick = () => {
                this._save(this.frequencies[id]);
            };
        };

        for (const id in this.frequencies) {
            MakeToolbar(id);
        }

        activity.textMsg(_("Use the up/down buttons to change pitch. Arrow keys are disabled."), 3000);
        activity.textMsg(_("Click on the slider to create a note block."), 3000);
        setTimeout(this.widgetWindow.sendToCenter, 0);
    }

    /**
     * @private
     * @param {number} frequency
     * @returns {void}
     */
    _save(frequency) {
        for (const name in this.activity.blocks.palettes.dict) {
            this.activity.blocks.palettes.dict[name].hideMenu(true);
        }

        this.activity.refreshCanvas();

        const newStack = [
            [0, "note", 100 + this._delta, 100 + this._delta, [null, 1, 2, null]],
            [1, ["number", { value: 8 }], 0, 0, [0]]
        ];
        this._delta += 21;

        const previousBlock = 0;

        const hertzIdx = newStack.length;
        const frequencyIdx = hertzIdx + 1;
        const hiddenIdx = hertzIdx + 2;
        newStack.push([hertzIdx, "hertz", 0, 0, [previousBlock, frequencyIdx, hiddenIdx]]);
        newStack.push([frequencyIdx, ["number", { value: frequency }], 0, 0, [hertzIdx]]);
        newStack.push([hiddenIdx, "hidden", 0, 0, [hertzIdx, null]]);

        this.activity.blocks.loadNewBlocks(newStack);
    }
}