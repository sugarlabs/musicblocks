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
    constructor() {
        this.ICONSIZE = 32;
        this._delta = 0;
        this.SEMITONE = Math.pow(2, 1 / 12);
    }

    _save(frequency){
        for (let name in this._logo.blocks.palettes.dict) {
                this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        let newStack = [
                [0, "note", 100 + this._delta, 100 + this._delta, [null, 1, 2, null]],
                [1, ["number", { value: 8 }], 0, 0, [0]]
        ];
        this._delta += 21;

        let endOfStackIdx = 0;
        let previousBlock = 0;

        let hertzIdx = newStack.length;
        let frequencyIdx = hertzIdx + 1;
        let hiddenIdx = hertzIdx + 2;
        newStack.push([hertzIdx, "hertz", 0, 0, [previousBlock, frequencyIdx, hiddenIdx]]);
        newStack.push([frequencyIdx, ["number", { value: frequency }], 0, 0, [hertzIdx]]);
        newStack.push([hiddenIdx, "hidden", 0, 0, [hertzIdx, null]]);

        this._logo.blocks.loadNewBlocks(newStack);
    };

    init(logo){
        if (window.widgetWindows.openWindows["slider"])
            return;
        if (!this.frequencies || !this.frequencies.length)
            this.frequencies = [392];
            this._logo = logo;

        let oscillators = [];
        this.sliders = {};
        for (let freq in this.frequencies) {
            let osc = new Tone.AMSynth().toDestination();
            oscillators.push(osc);
            }
        this._cellScale = 1.0;
        let iconSize = this.ICONSIZE;
        let widgetWindow = window.widgetWindows.windowFor(this, "pitch slider", "slider");            
        this.widgetWindow = widgetWindow;
        
        widgetWindow.onclose = () => {
            for (let osc of oscillators)
                osc.triggerRelease();
            widgetWindow.destroy();
        };

        const makeToolbar = (id) => {
            let toolBarDiv = document.createElement("div");
            widgetWindow._toolbar.appendChild(toolBarDiv);
            toolBarDiv.style.float = "left";

            let min = this.frequencies[id] / 2;
            let max = this.frequencies[id] * 2;

            let slider = widgetWindow.addRangeSlider(
                this.frequencies[id],
                toolBarDiv,
                min,
                max,
                "pitchSlider"
            );
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
                    _save(this.frequencies[id]);
                    oscillators[id].triggerRelease();
                };
                // label for frequency
                let freqLabel = document.createElement("div");
                freqLabel.className = "wfbtItem";
                toolBarDiv.appendChild(freqLabel);
                freqLabel.innerHTML = "<label>" + this.frequencies[id] + "</label>";

                widgetWindow.addButton("up.svg", iconSize, _("Move up"), toolBarDiv).onclick = () => {
                    slider.value = Math.min(slider.value * this.SEMITONE, max); //value is a string
                    changeFreq();
                    oscillators[id].triggerAttackRelease(this.frequencies[id], "4n");
                };

                widgetWindow.addButton(
                    "down.svg",
                    iconSize,
                    _("Move down"),
                    toolBarDiv
                ).onclick = () => {
                    slider.value = Math.max(slider.value / this.SEMITONE, min); //value is a string
                    changeFreq();
                    oscillators[id].triggerAttackRelease(this.frequencies[id], "4n");
                };

                widgetWindow.addButton(
                    "export-chunk.svg",
                    this.ICONSIZE,
                    _("Save"),
                    toolBarDiv
                ).onclick = () => {
                    //osc.triggerRelease();
                    _save(this.frequencies[id]);
                };
            };

            for (let id in this.frequencies) {
                makeToolbar(id);
            }

            this._logo.textMsg(_("Click on the slider to create a note block."));
        
    };
    
}
