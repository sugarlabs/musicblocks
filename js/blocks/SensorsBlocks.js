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
   Tone, platformColor
 */

/* exported setupSensorsBlocks */

function setupSensorsBlocks(activity) {
    class InputBlock extends FlowBlock {
        constructor() {
            super("input");
            this.setPalette("sensors", activity);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Input block prompts for keyboard input."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("input"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Input a value")],
            });

            if (this.lang === "ja") this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            // Pause the flow while we wait for input
            tur.doWait(120);

            // Display the input form.
            docById("labelDiv").innerHTML =
                '<input id="textLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="input" type="text" value="" />';
            const inputElem = docById("textLabel");
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk !== null) {
                inputElem.placeholder = activity.blocks.blockList[cblk].value;
            }
            inputElem.style.left = activity.turtles.turtleList[turtle].container.x + "px";
            inputElem.style.top = activity.turtles.turtleList[turtle].container.y + "px";
            inputElem.focus();

            docById("labelDiv").classList.add("hasKeyboard");

            // Add a handler to continue flow after the input.
            function __keyPressed(event) {
                if (event.keyCode === 13) { // RETURN
                    const inputElem = docById("textLabel");
                    const value = inputElem.value;
                    if (isNaN(value)) {
                        logo.inputValues[turtle] = value;
                    } else {
                        logo.inputValues[turtle] = Number(value);
                    }

                    inputElem.blur();
                    inputElem.style.display = "none";
                    logo.clearTurtleRun(turtle);
                    docById("labelDiv").classList.remove("hasKeyboard");
                }
            };

            docById("textLabel").addEventListener("keypress", __keyPressed);
        };
    }

    class InputValueBlock extends ValueBlock {
        constructor() {
            super("inputvalue", _("input value"));
            this.setPalette("sensors", activity);
            this.parameter = true;

            this.setHelpString([
                _(
                    "The Input-value block stores the input."
                ),
                "documentation",
                null,
                "input"
            ]);

            if (this.lang === "ja") this.hidden = true;
        }

        updateParameter(logo, turtle) {
            if (turtle in logo.inputValues) {
                return logo.inputValues[turtle];
            } else {
                return 0;
            }
        }

        arg(logo, turtle, blk) {
            if (turtle in logo.inputValues) {
                return logo.inputValues[turtle];
            } else {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
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
            if (logo.mic === null || activity._THIS_IS_TURTLE_BLOCKS_) {
                return 440;
            }
            if (logo.pitchAnalyser === null) {
                logo.pitchAnalyser = new Tone.Analyser({
                    type: "fft",
                    size: logo.limit,
                    smoothing : 0
                });
                logo.mic.connect(logo.pitchAnalyser);
            }


            const values = logo.pitchAnalyser.getValue();
            let max = Infinity;
            let idx = 0;                                // frequency bin
            for (let i = 0; i < logo.limit; i++) {
                const v2 = -values[i] ;
                if (v2 < max) {
                    max = v2;
                    idx = i;
                }
            }
            const freq = idx / (logo.pitchAnalyser.sampleTime * logo.limit * 2);
            return freq ;
        }
    }

    class LoudnessBlock extends ValueBlock {
        constructor() {
            super("loudness", _("loudness"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            // Put this block on the beginner palette except in Japanese.
            this.beginnerBlock(!(this.lang === "ja"));

            this.setHelpString([
                _(
                    "The Loudness block returns the volume detected by the microphone."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo) {
            if (logo.mic === null) {
                return 0;
            }
            if (activity._THIS_IS_TURTLE_BLOCKS_) {
                return Math.round(logo.mic.getLevel() * 1000);
            }
            if (logo.volumeAnalyser === null) {
                logo.volumeAnalyser = new Tone.Analyser({
                    type: "waveform",
                    size: logo.limit
                });

                logo.mic.connect(logo.volumeAnalyser);
            }

            const values = logo.volumeAnalyser.getValue();
            let sum = 0;
            for (let k = 0; k < logo.limit; k++) {
                sum += values[k] * values[k];
            }

            const rms = Math.sqrt(sum / logo.limit);
            return Math.round(rms * 100);
        }
    }

    class MyClickBlock extends ValueBlock {
        constructor() {
            super("myclick", _("click"));
            this.setPalette("sensors", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Click block triggers an event if a mouse has been clicked."),
                "documentation",
                null,
                "clickhelp"
            ]);
        }

        arg(logo, turtle) {
            return "click" + activity.turtles.turtleList[turtle].id;
        }
    }

    class MyCursoroverBlock extends ValueBlock {
        constructor() {
            // TRANS: The mouse cursor is over the mouse icon
            super("mycursorover", _("cursor over"));
            this.setPalette("sensors", activity);

            this.setHelpString([
                _("The Cursor over block triggers an event when the cursor is moved over a mouse."),
                "documentation",
                null,
                "cursoroverhelp"
            ]);
        }

        arg(logo, turtle) {
            return "CursorOver" + activity.turtles.turtleList[turtle].id;
        }
    }

    class MyCursoroutBlock extends ValueBlock {
        constructor() {
            // TRANS: The cursor is "out" -- it is no longer over the mouse.
            super("mycursorout", _("cursor out"));
            this.setPalette("sensors", activity);

            this.setHelpString([
                // TRANS: hover
                _("The Cursor out block triggers an event when the cursor is moved off of a mouse."),
                "documentation",
                null,
                "cursorouthelp"
            ]);
        }

        arg(logo, turtle) {
            return "CursorOut" + activity.turtles.turtleList[turtle].id;
        }
    }

    class MyCursordownBlock extends ValueBlock {
        constructor() {
            super("mycursordown", _("cursor button down"));
            this.setPalette("sensors", activity);

            this.setHelpString([
                _("The Cursor button down block triggers an event when the curson button is press on a mouse."),
                "documentation",
                null,
                "cursordownhelp"
            ]);
        }

        arg(logo, turtle) {
            return "CursorDown" + activity.turtles.turtleList[turtle].id;
        }
    }

    class MyCursorupBlock extends ValueBlock {
        constructor() {
            super("mycursorup", _("cursor button up"));
            this.setPalette("sensors", activity);

            this.setHelpString([
                _("The Cursor button up block triggers an event when the cursor button is released while over a mouse."),
                "documentation",
                null,
                "cursoruphelp"
            ]);
        }

        arg(logo, turtle) {
            return "CursorUp" + activity.turtles.turtleList[turtle].id;
        }
    }

    class GetBlueBlock extends ValueBlock {
        constructor() {
            super("getblue", _("blue"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Get blue block returns the blue component of the pixel under the mouse."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle) {
            let colorString = activity.turtles.turtleList[turtle].painter.canvasColor;
            if (colorString[2] === "#")
                colorString = hex2rgb(colorString.split("#")[1]);
            const obj = colorString.split("(")[1].split(",");
            return parseInt(Number(obj[0]) / 2.55);
        }
    }

    class GetGreenBlock extends ValueBlock {
        constructor() {
            super("getgreen", _("green"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Get green block returns the green component of the pixel under the mouse."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle) {
            let colorString = activity.turtles.turtleList[turtle].painter.canvasColor;
            if (colorString[1] === "#")
                colorString = hex2rgb(colorString.split("#")[1]);
            const obj = colorString.split("(")[1].split(",");
            return parseInt(Number(obj[0]) / 2.55);
        }
    }

    class GetRedBlock extends ValueBlock {
        constructor() {
            super("getred", _("red"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Get red block returns the red component of the pixel under the mouse."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle) {
            let colorString = activity.turtles.turtleList[turtle].painter.canvasColor;
            if (colorString[0] === "#")
                colorString = hex2rgb(colorString.split("#")[1]);
            const obj = colorString.split("(")[1].split(",");
            return parseInt(Number(obj[0]) / 2.55);
        }
    }

    class GetColorPixelBlock extends ValueBlock {
        constructor() {
            super("getcolorpixel", _("pixel color"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Get pixel block returns the color of the pixel under the mouse."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle) {
            const wasVisible = activity.turtles.turtleList[turtle].container.visible;
            activity.turtles.turtleList[turtle].container.visible = false;
            const x = activity.turtles.turtleList[turtle].container.x;
            const y = activity.turtles.turtleList[turtle].container.y;
            activity.refreshCanvas();

            const canvas = docById("overlayCanvas");
            const ctx = canvas.getContext("2d");
            const imgData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1)
                .data;
            let color = searchColors(imgData[0], imgData[1], imgData[2]);
            if (imgData[3] === 0) {
                (color = platformColor.background
                    .substring(
                        platformColor.background.indexOf("(") + 1,
                        platformColor.background.lastIndexOf(")")
                    )
                    .split(/,\s*/)),
                (color = searchColors(color[0], color[1], color[2]));
            }

            if (wasVisible) {
                activity.turtles.turtleList[turtle].container.visible = true;
            }
            return color;
        }
    }

    class TimeBlock extends ValueBlock {
        constructor() {
            super("time", _("time"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            // Put this block on the beginner palette except in Japanese.
            this.beginnerBlock(!(this.lang === "ja"));

            this.setHelpString([
                _(
                    "The Time block returns the number of seconds that the program has been running."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo) {
            const d = new Date();
            return (d.getTime() - logo.time) / 1000;
        }
    }

    class MouseYBlock extends ValueBlock {
        constructor() {
            super("mousey", _("cursor y"));
            this.setPalette("sensors", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Cursor Y block returns the vertical position of the mouse."
                ),
                "documentation",
                null,
                "mousebuttonhelp"
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg() {
            return activity.getStageY();
        }
    }

    class MouseXBlock extends ValueBlock {
        constructor() {
            super("mousex", _("cursor x"));
            this.setPalette("sensors", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Cursor X block returns the horizontal position of the mouse."
                ),
                "documentation",
                null,
                "mousebuttonhelp"
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg() {
            return activity.getStageX();
        }
    }

    class MouseButtonBlock extends BooleanSensorBlock {
        constructor() {
            super("mousebutton", _("mouse button"));
            this.setPalette("sensors", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Mouse-button block returns True if the mouse button is pressed."
                ),
                "documentation",
                null,
                "mousebuttonhelp"
            ]);
            this.extraWidth = 20;
        }

        updateParameter(logo, turtle, blk) {
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg() {
            return activity.getStageMouseDown();
        }
    }

    class ToASCIIBlock extends LeftBlock {
        constructor() {
            super("toascii", _("to ASCII"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            this.setHelpString([
                _("The To ASCII block converts numbers to letters."),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 1,
                defaults: [65]
            });
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "toascii"]);
            } else {
                const cblk1 = activity.blocks.blockList[blk].connections[1];
                if (cblk1 === null) {
                    activity.errorMsg(NOINPUTERRORMSG, blk);
                    return "A";
                }
                const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                if (typeof a === "number") {
                    if (a < 1) return 0;
                    else return String.fromCharCode(a);
                } else {
                    activity.errorMsg(NANERRORMSG, blk);
                    return 0;
                }
            }
        }
    }

    class KeyboardBlock extends ValueBlock {
        constructor() {
            super("keyboard", _("keyboard"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            this.setHelpString([
                _("The Keyboard block returns computer keyboard input."),
                "documentation",
                ""
            ]);
            this.makeMacro((x, y) => [
                [0, "toascii", x, y, [null, 1]],
                [1, "keyboard", 0, 0, [0, null]]
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo) {
            logo.lastKeyCode = activity.getCurrentKeyCode();
            const val = logo.lastKeyCode;
            activity.clearCurrentKeyCode();
            return val;
        }
    }

    new GetBlueBlock().setup(activity);
    new GetGreenBlock().setup(activity);
    new GetRedBlock().setup(activity);
    new GetColorPixelBlock().setup(activity);
    new ToASCIIBlock().setup(activity);
    new KeyboardBlock().setup(activity);
    new InputValueBlock().setup(activity);
    new InputBlock().setup(activity);
    new TimeBlock().setup(activity);
    new PitchnessBlock().setup(activity);
    new LoudnessBlock().setup(activity);
    new MyCursoroutBlock().setup(activity);
    new MyCursoroverBlock().setup(activity);
    new MyCursorupBlock().setup(activity);
    new MyCursordownBlock().setup(activity);
    new MyClickBlock().setup(activity);
    new MouseButtonBlock().setup(activity);
    new MouseYBlock().setup(activity);
    new MouseXBlock().setup(activity);
}
