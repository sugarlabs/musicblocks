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
    /**
     * Represents a block that prompts for keyboard input in the logo programming language.
     * @extends {FlowBlock}
     */
    class InputBlock extends FlowBlock {
        /**
         * Constructs a new InputBlock instance.
         */
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
                /**
                 * The name of the block.
                 * @type {string}
                 */
                name: _("input"),

                /**
                 * The number of arguments expected by the block.
                 * @type {number}
                 */
                args: 1,

                /**
                 * The type of the argument.
                 * @type {string}
                 */
                argTypes: ["anyin"],

                /**
                 * The default values for the arguments.
                 * @type {Array}
                 */
                defaults: [_("Input a value")]
            });
        }

        /**
         * Handles the flow of the InputBlock.
         * @param {Array} args - The arguments provided to the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {number} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            // Pause the flow while waiting for input
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

            // Add a handler to continue the flow after the input.
            function __keyPressed(event) {
                if (event.keyCode === 13) {
                    // RETURN
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
            }

            docById("textLabel").addEventListener("keypress", __keyPressed);
        }
    }
    /**
     * Represents a block that stores the input value in the logo programming language.
     * @extends {ValueBlock}
     */
    class InputValueBlock extends ValueBlock {
        /**
         * Constructs a new InputValueBlock instance.
         */
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

        /**
         * Updates the parameter of the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @returns {number} - The updated parameter value.
         */
        updateParameter(logo, turtle) {
            if (turtle in logo.inputValues) {
                return logo.inputValues[turtle];
            } else {
                return 0;
            }
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {number} blk - The block identifier.
         * @returns {number} - The argument value.
         */
        arg(logo, turtle, blk) {
            if (turtle in logo.inputValues) {
                return logo.inputValues[turtle];
            } else {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
        }
    }

    /**
     * Represents a block that measures the pitch in the logo programming language.
     * @extends {ValueBlock}
     */
    class PitchnessBlock extends ValueBlock {
        /**
         * Constructs a new PitchnessBlock instance.
         */
        constructor() {
            super("pitchness", _("pitch"));
            this.setPalette("sensors", activity);
            this.parameter = true;
        }

        /**
         * Updates the parameter of the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {number} blk - The block identifier.
         * @returns {number} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @returns {number} - The argument value representing the pitch.
         */
        arg(logo) {
            if (logo.mic === null) {
                return 440;
            }
            if (logo.pitchAnalyser === null) {
                logo.pitchAnalyser = new Tone.Analyser({
                    type: "fft",
                    size: logo.limit,
                    smoothing: 0
                });
                logo.mic.connect(logo.pitchAnalyser);
            }

            const values = logo.pitchAnalyser.getValue();
            let max = Infinity;
            let idx = 0; // frequency bin

            for (let i = 0; i < logo.limit; i++) {
                const v2 = -values[i];
                if (v2 < max) {
                    max = v2;
                    idx = i;
                }
            }

            const freq = idx / (logo.pitchAnalyser.sampleTime * logo.limit * 2);
            return freq;
        }
    }

    /**
     * Represents a block that measures the loudness in the logo programming language.
     * @extends {ValueBlock}
     */
    class LoudnessBlock extends ValueBlock {
        /**
         * Constructs a new LoudnessBlock instance.
         */
        constructor() {
            super("loudness", _("loudness"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            // Put this block on the beginner palette except in Japanese.
            this.beginnerBlock(!(this.lang === "ja"));

            this.setHelpString([
                _("The Loudness block returns the volume detected by the microphone."),
                "documentation",
                ""
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {number} blk - The block identifier.
         * @returns {number} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @returns {number} - The argument value representing the loudness.
         */
        arg(logo) {
            if (logo.mic === null) {
                return 0;
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

    /**
     * Represents a block that triggers an event if a mouse or turtle has been clicked.
     * @extends {ValueBlock}
     */
    class MyClickBlock extends ValueBlock {
        /**
         * Constructs a new MyClickBlock instance.
         */
        constructor() {
            super("myclick", _("click"));
            this.setPalette("sensors", activity);
            this.beginnerBlock(true);

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Click block triggers an event if a mouse has been clicked."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Click block triggers an event if a turtle has been clicked."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            }
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @returns {string} - The argument value representing the click event.
         */
        arg(logo, turtle) {
            return "click" + activity.turtles.turtleList[turtle].id;
        }
    }

    /**
     * Represents a block that triggers an event when the cursor is moved over a mouse or turtle.
     * @extends {ValueBlock}
     */
    class MyCursoroverBlock extends ValueBlock {
        /**
         * Constructs a new MyCursoroverBlock instance.
         */
        constructor() {
            // TRANS: The mouse cursor is over the mouse icon
            super("mycursorover", _("cursor over"));
            this.setPalette("sensors", activity);

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _(
                        "The Cursor over block triggers an event when the cursor is moved over a mouse."
                    ),
                    "documentation",
                    null,
                    "cursoroverhelp"
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Cursor over block triggers an event when the cursor is moved over a turtle."
                    ),
                    "documentation",
                    null,
                    "cursoroverhelp"
                ]);
            }
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @returns {string} - The argument value representing the cursor-over event.
         */
        arg(logo, turtle) {
            return "CursorOver" + activity.turtles.turtleList[turtle].id;
        }
    }

    /**
     * Represents a block that triggers an event when the cursor is moved off of a mouse or turtle.
     * @extends {ValueBlock}
     */
    class MyCursoroutBlock extends ValueBlock {
        /**
         * Constructs a new MyCursoroutBlock instance.
         */
        constructor() {
            // TRANS: The cursor is "out" -- it is no longer over the mouse.
            super("mycursorout", _("cursor out"));
            this.setPalette("sensors", activity);

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    // TRANS: hover
                    _(
                        "The Cursor out block triggers an event when the cursor is moved off of a mouse."
                    ),
                    "documentation",
                    null,
                    "cursorouthelp"
                ]);
            } else {
                this.setHelpString([
                    // TRANS: hover
                    _(
                        "The Cursor out block triggers an event when the cursor is moved off of a turtle."
                    ),
                    "documentation",
                    null,
                    "cursorouthelp"
                ]);
            }
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @returns {string} - The argument value representing the cursor-out event.
         */
        arg(logo, turtle) {
            return "CursorOut" + activity.turtles.turtleList[turtle].id;
        }
    }

    /**
     * Represents a block that triggers an event when the cursor button is pressed on a mouse or turtle.
     * @extends {ValueBlock}
     */
    class MyCursordownBlock extends ValueBlock {
        /**
         * Constructs a new MyCursordownBlock instance.
         */
        constructor() {
            super("mycursordown", _("cursor button down"));
            this.setPalette("sensors", activity);

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _(
                        "The Cursor button down block triggers an event when the cursor button is pressed on a mouse."
                    ),
                    "documentation",
                    null,
                    "cursordownhelp"
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Cursor button down block triggers an event when the cursor button is pressed on a turtle."
                    ),
                    "documentation",
                    null,
                    "cursordownhelp"
                ]);
            }
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @returns {string} - The argument value representing the cursor button-down event.
         */
        arg(logo, turtle) {
            return "CursorDown" + activity.turtles.turtleList[turtle].id;
        }
    }

    /**
     * Represents a block that triggers an event when the cursor button is released while over a mouse or turtle.
     * @extends {ValueBlock}
     */
    class MyCursorupBlock extends ValueBlock {
        /**
         * Constructs a new MyCursorupBlock instance.
         */
        constructor() {
            super("mycursorup", _("cursor button up"));
            this.setPalette("sensors", activity);

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _(
                        "The Cursor button up block triggers an event when the cursor button is released while over a mouse."
                    ),
                    "documentation",
                    null,
                    "cursoruphelp"
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Cursor button up block triggers an event when the cursor button is released while over a turtle."
                    ),
                    "documentation",
                    null,
                    "cursoruphelp"
                ]);
            }
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @returns {string} - The argument value representing the cursor button-up event.
         */
        arg(logo, turtle) {
            return "CursorUp" + activity.turtles.turtleList[turtle].id;
        }
    }

    /**
     * Represents a block that returns the blue component of the pixel under the mouse or turtle.
     * @extends {ValueBlock}
     */
    class GetBlueBlock extends ValueBlock {
        /**
         * Constructs a new GetBlueBlock instance.
         */
        constructor() {
            super("getblue", _("blue"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _(
                        "The Get blue block returns the blue component of the pixel under the mouse."
                    ),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Get blue block returns the blue component of the pixel under the turtle."
                    ),
                    "documentation",
                    ""
                ]);
            }
        }

        /**
         * Updates the parameter value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @param {number} blk - The identifier of the block.
         * @returns {number} - The updated parameter value representing the blue component.
         */
        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @returns {number} - The argument value representing the blue component.
         */
        arg(logo, turtle) {
            let colorString = activity.turtles.turtleList[turtle].painter.canvasColor;
            if (colorString[2] === "#") colorString = hex2rgb(colorString.split("#")[1]);
            const obj = colorString.split("(")[1].split(",");
            return parseInt(Number(obj[0]) / 2.55);
        }
    }

    /**
     * Represents a block that returns the green component of the pixel under the mouse or turtle.
     * @extends {ValueBlock}
     */
    class GetGreenBlock extends ValueBlock {
        /**
         * Constructs a new GetGreenBlock instance.
         */
        constructor() {
            super("getgreen", _("green"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _(
                        "The Get green block returns the green component of the pixel under the mouse."
                    ),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Get green block returns the green component of the pixel under the turtle."
                    ),
                    "documentation",
                    ""
                ]);
            }
        }

        /**
         * Updates the parameter value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @param {number} blk - The identifier of the block.
         * @returns {number} - The updated parameter value representing the green component.
         */
        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @returns {number} - The argument value representing the green component.
         */
        arg(logo, turtle) {
            let colorString = activity.turtles.turtleList[turtle].painter.canvasColor;
            if (colorString[1] === "#") colorString = hex2rgb(colorString.split("#")[1]);
            const obj = colorString.split("(")[1].split(",");
            return parseInt(Number(obj[0]) / 2.55);
        }
    }

    /**
     * Represents a block that returns the red component of the pixel under the mouse or turtle.
     * @extends {ValueBlock}
     */
    class GetRedBlock extends ValueBlock {
        /**
         * Constructs a new GetRedBlock instance.
         */
        constructor() {
            super("getred", _("red"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Get red block returns the red component of the pixel under the mouse."),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _("The Get red block returns the red component of the pixel under the turtle."),
                    "documentation",
                    ""
                ]);
            }
        }

        /**
         * Updates the parameter value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @param {number} blk - The identifier of the block.
         * @returns {number} - The updated parameter value representing the red component.
         */
        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @returns {number} - The argument value representing the red component.
         */
        arg(logo, turtle) {
            let colorString = activity.turtles.turtleList[turtle].painter.canvasColor;
            if (colorString[0] === "#") colorString = hex2rgb(colorString.split("#")[1]);
            const obj = colorString.split("(")[1].split(",");
            return parseInt(Number(obj[0]) / 2.55);
        }
    }

    /**
     * Represents a block that returns the color of the pixel under the mouse or turtle.
     * @extends {ValueBlock}
     */
    class GetColorPixelBlock extends ValueBlock {
        /**
         * Constructs a new GetColorPixelBlock instance.
         */
        constructor() {
            super("getcolorpixel", _("pixel color"));
            this.setPalette("sensors", activity);
            this.parameter = true;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Get pixel block returns the color of the pixel under the mouse."),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _("The Get pixel block returns the color of the pixel under the turtle."),
                    "documentation",
                    ""
                ]);
            }
        }

        /**
         * Updates the parameter value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @param {number} blk - The identifier of the block.
         * @returns {number} - The updated parameter value representing the color.
         */
        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @returns {number} - The argument value representing the color.
         */
        arg(logo, turtle) {
            const wasVisible = activity.turtles.turtleList[turtle].container.visible;
            activity.turtles.turtleList[turtle].container.visible = false;
            const x = activity.turtles.turtleList[turtle].container.x;
            const y = activity.turtles.turtleList[turtle].container.y;
            activity.refreshCanvas();

            const canvas = docById("overlayCanvas");
            const ctx = canvas.getContext("2d");
            const imgData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
            let color = searchColors(imgData[0], imgData[1], imgData[2]);

            if (imgData[3] === 0) {
                color = platformColor.background
                    .substring(
                        platformColor.background.indexOf("(") + 1,
                        platformColor.background.lastIndexOf(")")
                    )
                    .split(/,\s*/);
                color = searchColors(color[0], color[1], color[2]);
            }

            if (wasVisible) {
                activity.turtles.turtleList[turtle].container.visible = true;
            }
            return color;
        }
    }

    /**
     * Represents a block that returns the number of seconds that the program has been running.
     * @extends {ValueBlock}
     */
    class TimeBlock extends ValueBlock {
        /**
         * Constructs a new TimeBlock instance.
         */
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

        /**
         * Updates the parameter value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @param {number} blk - The identifier of the block.
         * @returns {number} - The updated parameter value representing the time.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Retrieves the argument value of the block.
         * @param {Object} logo - The logo object.
         * @returns {number} - The argument value representing the time.
         */
        arg(logo) {
            const d = new Date();
            return (d.getTime() - logo.time) / 1000;
        }
    }

    /**
     * Represents a block that returns the vertical position of the mouse cursor.
     * @extends {ValueBlock}
     */
    class MouseYBlock extends ValueBlock {
        /**
         * Constructs a new MouseYBlock instance.
         */
        constructor() {
            super("mousey", _("cursor y"));
            this.setPalette("sensors", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _("The Cursor Y block returns the vertical position of the mouse."),
                "documentation",
                null,
                "mousebuttonhelp"
            ]);
        }

        /**
         * Updates the parameter value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} turtle - The identifier of the turtle.
         * @param {number} blk - The identifier of the block.
         * @returns {number} - The updated parameter value representing the mouse cursor's vertical position.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Retrieves the argument value of the block.
         * @returns {number} - The argument value representing the mouse cursor's vertical position.
         */
        arg() {
            return activity.getStageY();
        }
    }

    /**
     * Represents a block that returns the horizontal position of the mouse.
     * @extends {ValueBlock}
     */
    class MouseXBlock extends ValueBlock {
        /**
         * Constructs a new MouseXBlock instance.
         */
        constructor() {
            super("mousex", _("cursor x"));
            this.setPalette("sensors", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _("The Cursor X block returns the horizontal position of the mouse."),
                "documentation",
                null,
                "mousebuttonhelp"
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The Logo object.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @returns {number} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Retrieves the argument value for the block.
         * @returns {number} - The horizontal position of the mouse.
         */
        arg() {
            return activity.getStageX();
        }
    }

    /**
     * Represents a block that returns `true` if the mouse button is pressed.
     * @extends {BooleanSensorBlock}
     */
    class MouseButtonBlock extends BooleanSensorBlock {
        /**
         * Constructs a new MouseButtonBlock instance.
         */
        constructor() {
            super("mousebutton", _("mouse button"));
            this.setHelpString([
                _("The Mouse-button block returns True if the mouse button is pressed."),
                "documentation",
                null,
                "mousebuttonhelp"
            ]);

            this.setPalette("sensors", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            this.extraWidth = 20;
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The Logo object.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @returns {string} - The updated parameter value (`"true"` or `"false"`).
         */
        updateParameter(logo, turtle, blk) {
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        /**
         * Retrieves the argument value for the block.
         * @returns {boolean} - `true` if the mouse button is pressed, otherwise `false`.
         */
        arg() {
            return activity.getStageMouseDown();
        }
    }

    /**
     * Represents a block that converts numbers to letters using ASCII encoding.
     * @extends {LeftBlock}
     */
    class ToASCIIBlock extends LeftBlock {
        /**
         * Constructs a new ToASCIIBlock instance.
         */
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

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The Logo object.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @returns {number} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Retrieves the argument value for the block.
         * @param {Logo} logo - The Logo object.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @param {any} receivedArg - The received argument (not used in this method).
         * @returns {string|number} - The converted letter or 0 in case of an error.
         */
        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
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

    /**
     * Represents a block that returns computer keyboard input.
     * @extends {ValueBlock}
     */
    class KeyboardBlock extends ValueBlock {
        /**
         * Constructs a new KeyboardBlock instance.
         */
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

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The Logo object.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @returns {number} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Retrieves the argument value for the block.
         * @param {Logo} logo - The Logo object.
         * @returns {number} - The last key code pressed.
         */
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
