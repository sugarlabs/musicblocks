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

function PitchSlider() {
    const ICONSIZE = 32;
    this._delta = 0;
    const SEMITONE = Math.pow(2,1/12);

    this._save = function() {
        var that = this;
        var frequency =
            this.frequency;

        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        var newStack = [
            [
                0,
                "note",
                100 + this._delta,
                100 + this._delta,
                [null, 1, 2, null]
            ],
            [1, ["number", { value: 8 }], 0, 0, [0]]
        ];
        this._delta += 21;

        var endOfStackIdx = 0;
        var previousBlock = 0;

        var hertzIdx = newStack.length;
        var frequencyIdx = hertzIdx + 1;
        var hiddenIdx = hertzIdx + 2;
        newStack.push([
            hertzIdx,
            "hertz",
            0,
            0,
            [previousBlock, frequencyIdx, hiddenIdx]
        ]);
        newStack.push([
            frequencyIdx,
            ["number", { value: frequency }],
            0,
            0,
            [hertzIdx]
        ]);
        newStack.push([hiddenIdx, "hidden", 0, 0, [hertzIdx, null]]);

        that._logo.blocks.loadNewBlocks(newStack);
    };

    this.init = function(logo) {
        if (!this.frequency) this.frequency = 392;
        this._logo = logo;
        if (window.widgetWindows.openWindows["slider"])return;
        let osc = new Tone.AMSynth().toDestination();
        osc.triggerAttack(this.frequency);
        for (let turtle in logo.turtles.turtleList){
            if (logo.Oscilloscope && logo.Oscilloscope.pitchAnalysers && logo.Oscilloscope.pitchAnalysers[turtle])
                osc.connect(logo.Oscilloscope.pitchAnalysers[turtle])
        }
        var w = window.innerWidth;
        this._cellScale = 1.0;
        var iconSize = ICONSIZE;

        let min = this.frequency/2;
        let max = this.frequency*2;

        var widgetWindow = window.widgetWindows.windowFor(
            this,
            "pitch slider",
            "slider"
        );
        this.widgetWindow = widgetWindow;
	    widgetWindow.onclose = () => {
            osc.triggerRelease();
            widgetWindow.destroy();
        };
        this.slider = widgetWindow.addRangeSlider(
            this.frequency,
            undefined,
            min,
            max
        );
        let changeFreq = () => {
            this.frequency = this.slider.value;
            osc.frequency.linearRampToValueAtTime(
                this.frequency,
                Tone.now() + 0.05
            );
            freqLabel.innerHTML = '<label>'+this.frequency+'</label>';
        } 
        this.slider.oninput = () => {
            changeFreq();
        };
        this.slider.onchange = () => {
            this._save();
            //osc.triggerRelease();
            //widgetWindow.destroy();
        }

        let freqLabel = document.createElement("div");
        freqLabel.className = "wfbtItem";
        widgetWindow._toolbar.appendChild(freqLabel);
        freqLabel.innerHTML = '<label>'+this.frequency+'</label>';

        widgetWindow.addButton("up.svg",iconSize,_("Move up")).onclick = () => {
            this.slider.value = Math.min(this.slider.value*SEMITONE, max); //value is a string
            changeFreq()
        }
        widgetWindow.addButton("down.svg",iconSize,_("Move down")).onclick = () => {
        this.slider.value = Math.max(this.slider.value/SEMITONE, min); //value is a string
            changeFreq()
        }
        widgetWindow.addButton("export-chunk.svg",ICONSIZE,_("Save")).onclick = () => {
            //osc.triggerRelease();
            this._save();
        }

        this._logo.textMsg(_("Click on the slider to create a note block."));
    };
}
