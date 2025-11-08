// Copyright (c) 2019 Bottersnike
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, FlowBlock, NOINPUTERRORMSG, ValueBlock, docById, toFixed2,
   LeftBlock, BooleanSensorBlock, NANERRORMSG, hex2rgb, searchColors,
   Tone, platformColor, _THIS_IS_MUSIC_BLOCKS_
 */

/* exported setupSensorsBlocks */

function setupSensorsBlocks(activity) {

    // Helper function to remove duplicate logic for color blocks
    function getColorComponent(turtle, index) {
        let colorString = activity.turtles.getTurtle(turtle).painter.canvasColor;
        if (colorString[0] === "#") colorString = hex2rgb(colorString.split("#")[1]);
        const obj = colorString.split("(")[1].split(",");
        return parseInt(Number(obj[index]) / 2.55);
    }

    /**
     * Represents a block that prompts for keyboard input in the logo programming language.
     * @extends {FlowBlock}
     */
    class InputBlock extends FlowBlock {
        constructor() {
            super("input");
            this.setPalette("sensors", activity);
            this.parameter = true;
            this.setHelpString([
                _("The Input block prompts for keyboard input."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("input"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Input a value")]
            });
        }

        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);
            tur.doWait(120);

            docById("labelDiv").innerHTML =
                '<input id="textLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="input" type="text" value="" />';
            const inputElem = docById("textLabel");
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk !== null) inputElem.placeholder = activity.blocks.blockList[cblk].value;

            inputElem.style.left = activity.turtles.getTurtle(turtle).container.x + "px";
            inputElem.style.top = activity.turtles.getTurtle(turtle).container.y + "px";
            inputElem.focus();

            docById("labelDiv").classList.add("hasKeyboard");

            function __keyPressed(event) {
                if (event.keyCode === 13) {
                    const inputElem = docById("textLabel");
                    const value = inputElem.value;
                    logo.inputValues[turtle] = isNaN(value) ? value : Number(value);

                    inputElem.blur();
                    inputElem.style.display = "none";
                    logo.clearTurtleRun(turtle);
                    docById("labelDiv").classList.remove("hasKeyboard");
                }
            }

            docById("textLabel").addEventListener("keypress", __keyPressed);
        }
    }

    class InputValueBlock extends ValueBlock {
        constructor() {
            super("inputvalue", _("input value"));
            this.setPalette("sensors", activity);
            this.parameter = true;

            this.setHelpString([
                _("The Input-value block stores the input."),
                "documentation",
                null,
                "input"
            ]);
        }

        updateParameter(logo, turtle) {
            return turtle in logo.inputValues ? logo.inputValues[turtle] : 0;
        }

        arg(logo, turtle, blk) {
            if (turtle in logo.inputValues) return logo.inputValues[turtle];
            activity.errorMsg(NOINPUTERRORMSG, blk);
            return 0;
        }
    }

    class PitchnessBlock extends ValueBlock {
        constructor() {
            super("pitchness", _("pitch"));
            this.setPalette("sensors", activity);
            this.parameter = true;
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo) {
            if (!logo.mic) return 440;
            if (!logo.pitchAnalyser) {
                logo.pitchAnalyser = new Tone.Analyser({ type: "fft", size: logo.limit, smoothing: 0 });
                logo.mic.connect(logo.pitchAnalyser);
            }

            const values = logo.pitchAnalyser.getValue();
            let max = Infinity;
            let idx = 0;

            for (let i = 0; i < logo.limit; i++) {
                const v2 = -values[i];
                if (v2 < max) {
                    max = v2;
                    idx = i;
                }
            }

            return idx / (logo.pitchAnalyser.sampleTime * logo.limit * 2);
        }
    }

    class LoudnessBlock extends ValueBlock {
        constructor() {
            super("loudness", _("loudness"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            this.beginnerBlock(!(this.lang === "ja"));
            this.setHelpString([
                _("The Loudness block returns the volume detected by the microphone."),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo) {
            if (!logo.mic) return 0;
            if (!logo.volumeAnalyser) {
                logo.volumeAnalyser = new Tone.Analyser({ type: "waveform", size: logo.limit });
                logo.mic.connect(logo.volumeAnalyser);
            }

            const values = logo.volumeAnalyser.getValue();
            let sum = 0;
            for (let k = 0; k < logo.limit; k++) sum += values[k] * values[k];
            return Math.round(Math.sqrt(sum / logo.limit) * 100);
        }
    }

    class GetRedBlock extends ValueBlock {
        constructor() {
            super("getred", _("red"));
            this.setPalette("sensors", activity);
            this.parameter = true;
        }
        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }
        arg(logo, turtle) {
            return getColorComponent(turtle, 0);
        }
    }

    class GetGreenBlock extends ValueBlock {
        constructor() {
            super("getgreen", _("green"));
            this.setPalette("sensors", activity);
            this.parameter = true;
        }
        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }
        arg(logo, turtle) {
            return getColorComponent(turtle, 1);
        }
    }

    class GetBlueBlock extends ValueBlock {
        constructor() {
            super("getblue", _("blue"));
            this.setPalette("sensors", activity);
            this.parameter = true;
        }
        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }
        arg(logo, turtle) {
            return getColorComponent(turtle, 2);
        }
    }

    // ... baaki blocks unchanged, jaise GetColorPixelBlock, ToASCIIBlock, KeyboardBlock, InputBlock, TimeBlock, PitchnessBlock, LoudnessBlock, Cursor & Mouse blocks

    // Setup all blocks
    new GetRedBlock().setup(activity);
    new GetGreenBlock().setup(activity);
    new GetBlueBlock().setup(activity);
    new InputValueBlock().setup(activity);
    new InputBlock().setup(activity);
    new PitchnessBlock().setup(activity);
    new LoudnessBlock().setup(activity);
    // ... baaki setup() calls
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { setupSensorsBlocks };
}
