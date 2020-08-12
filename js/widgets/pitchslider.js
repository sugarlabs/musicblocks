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
    const BUTTONDIVWIDTH = 118; // 2 buttons (55 + 4) * 2
    const BUTTONSIZE = 51;
    const ICONSIZE = 32;
    const SEMITONE = Math.pow(2, 1 / 12);

    this.Sliders = [];
    this._focusedCellIndex = 0;
    this._isKeyPressed = 0;
    this._delta = 0;
    this._slider = null;

    this._save = function(cell) {
        var that = this;
        var cellIndex = cell.cellIndex;
        var frequency =
            this.Sliders[cellIndex][0] *
            Math.pow(SEMITONE, this.Sliders[cellIndex][1]);

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
            ["number", { value: frequency.toFixed(this.places) }],
            0,
            0,
            [hertzIdx]
        ]);
        newStack.push([hiddenIdx, "hidden", 0, 0, [hertzIdx, null]]);

        that._logo.blocks.loadNewBlocks(newStack);
    };

    this.init = function(logo) {
        this._logo = logo;
        let audioCtx = new AudioContext();
        let osc = audioCtx.createOscillator();
        osc.frequency.value = 440;
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 60);

        var w = window.innerWidth;
        this._cellScale = 1.0;
        var iconSize = ICONSIZE;

        var widgetWindow = window.widgetWindows.windowFor(
            this,
            "pitch slider",
            "slider"
        );
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	    widgetWindow.show();
        let that = this;
        this.slider = widgetWindow.addRangeSlider(
            440,undefined,240,700
        );
        this.slider.oninput = () => {
            this.frequency = this.slider.value;
            osc.frequency.linearRampToValueAtTime(
                this.frequency,
                audioCtx.currentTime + 0.05
            );
        };

        this._logo.textMsg(_("Click on the slider to create a note block."));
    };
}
