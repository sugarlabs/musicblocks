// Copyright (c) 2016-19 Walter Bender
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

class PitchSlider {
    static ICONSIZE = 32;
    static SEMITONE = Math.pow(2, 1 / 12);

    constructor() {
        this._delta = 0;
        this.sliders = {};
        this._cellScale = 0;
    }

    init() {
        if (window.widgetWindows.openWindows["slider"]) return;
        if (!this.frequencies || !this.frequencies.length) this.frequencies = [392];

        const oscillators = [];
        for (const _ in this.frequencies) {
            const osc = new Tone.AMSynth().toDestination();
            oscillators.push(osc);
        }

        this._cellScale = 1.0;
        this.widgetWindow = window.widgetWindows.windowFor(this, "pitch slider", "slider");
        this.widgetWindow.onclose = () => {
            for (const osc of oscillators) osc.triggerRelease();
            this.widgetWindow.destroy();
        };

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

            // label for frequency
            const freqLabel = document.createElement("div");
            freqLabel.className = "wfbtItem";
            toolBarDiv.appendChild(freqLabel);
            freqLabel.innerHTML = "<label>" + this.frequencies[id] + "</label>";

            this.sliders[id] = slider;
            const changeFreq = () => {
                this.frequencies[id] = this.sliders[id].value;
                oscillators[id].frequency.linearRampToValueAtTime(
                    this.frequencies[id],
                    Tone.now() + 0.05
                );
                freqLabel.innerHTML = "<label>" + this.frequencies[id] + "</label>";
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

        logo.textMsg(_("Click on the slider to create a note block."));
        setTimeout(this.widgetWindow.sendToCenter, 0);
    }

    _save(frequency) {
        for (const name in logo.blocks.palettes.dict) {
            logo.blocks.palettes.dict[name].hideMenu(true);
        }

        logo.refreshCanvas();

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

        logo.blocks.loadNewBlocks(newStack);
    }
}
