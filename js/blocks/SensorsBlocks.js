setupSensorsBlocks = () => {
    class InputBlock extends FlowBlock {
        constructor() {
            super("input");
            this.setPalette("sensors");
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

            // Pause the flow while we wait for input.
            logo._doWait(turtle, 120);

            // Display the input form.
            docById("labelDiv").innerHTML =
                '<input id="textLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="input" type="text" value="" />';
            let inputElem = docById("textLabel");
            let cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk !== null) {
                inputElem.placeholder = logo.blocks.blockList[cblk].value;
            }
            inputElem.style.left = logo.turtles.turtleList[turtle].container.x + "px";
            inputElem.style.top = logo.turtles.turtleList[turtle].container.y + "px";
            inputElem.focus();

            docById("labelDiv").classList.add("hasKeyboard");

            // Add a handler to continue flow after the input.
            __keyPressed = (event) => {
                if (event.keyCode === 13) { // RETURN
                    let inputElem = docById("textLabel");
                    console.debug(inputElem.value);
                    console.debug('trying a number');
                    let value = inputElem.value;
                    if (isNaN(value)) {
                        logo.inputValues[turtle] = value;
                    } else {
                        logo.inputValues[turtle] = Number(value);
                    }

                    inputElem.blur();
                    inputElem.style.display = "none";
                    logo.clearRunBlock(turtle);
                    docById("labelDiv").classList.remove("hasKeyboard");
                }
            };

            docById("textLabel").addEventListener("keypress", __keyPressed);
        };
    }

    class InputValueBlock extends ValueBlock {
        constructor() {
            super("inputvalue", _("input value"));
            this.setPalette("sensors");
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

        updateParameter(logo, turtle, blk) {
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
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
        }
    }

    class PitchnessBlock extends ValueBlock {
        constructor() {
            super("pitchness", _("pitch"));
            this.setPalette("sensors");
            this.parameter = true;
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk) {
            if (logo.mic === null || _THIS_IS_TURTLE_BLOCKS_) {
                return 440;
            }
            if (logo.pitchAnalyser === null) {
                logo.pitchAnalyser = new Tone.Analyser({
                    type: "fft",
                    size: this.limit
                });

                this.mic.connect(this.pitchAnalyser);
            }

            let values = logo.pitchAnalyser.getValue();
            let max = 0;
            let idx = 0;
            for (let i = 0; i < this.limit; i++) {
                let v2 = values[i] * values[i];
                if (v2 > max) {
                    max = v2;
                    idx = i;
                }
            }

            return idx;
        }
    }

    class LoudnessBlock extends ValueBlock {
        constructor() {
            super("loudness", _("loudness"));
            this.setPalette("sensors");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Loudness block returns the volume detected by the microphone."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo) {
            if (logo.mic === null) {
                return 0;
            }
            if (_THIS_IS_TURTLE_BLOCKS_) {
                return Math.round(logo.mic.getLevel() * 1000);
            }
            if (logo.volumeAnalyser === null) {
                logo.volumeAnalyser = new Tone.Analyser({
                    type: "waveform",
                    size: logo.limit
                });

                logo.mic.connect(logo.volumeAnalyser);
            }

            let values = logo.volumeAnalyser.getValue();
            let sum = 0;
            for (let k = 0; k < logo.limit; k++) {
                sum += values[k] * values[k];
            }

            let rms = Math.sqrt(sum / logo.limit);
            return Math.round(rms * 100);
        }
    }

    class MyClickBlock extends ValueBlock {
        constructor() {
            super("myclick", _("click"));
            this.setPalette("sensors");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Click block returns True if a mouse has been clicked."),
                "documentation",
                null,
                "clickhelp"
            ]);
        }

        arg(logo, turtle) {
            return "click" + logo.turtles.turtleList[turtle].name;
        }
    }

    class GetBlueBlock extends ValueBlock {
        constructor() {
            super("getblue", _("blue"));
            this.setPalette("sensors");
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
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle) {
            let colorString = logo.turtles.turtleList[turtle].canvasColor;
            if (colorString[2] === "#")
                colorString = hex2rgb(colorString.split("#")[1]);
            let obj = colorString.split("(")[1].split(",");
            return parseInt(Number(obj[0]) / 2.55);
        }
    }

    class GetGreenBlock extends ValueBlock {
        constructor() {
            super("getgreen", _("green"));
            this.setPalette("sensors");
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
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle) {
            let colorString = logo.turtles.turtleList[turtle].canvasColor;
            if (colorString[1] === "#")
                colorString = hex2rgb(colorString.split("#")[1]);
            let obj = colorString.split("(")[1].split(",");
            return parseInt(Number(obj[0]) / 2.55);
        }
    }

    class GetRedBlock extends ValueBlock {
        constructor() {
            super("getred", _("red"));
            this.setPalette("sensors");
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
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle) {
            let colorString = logo.turtles.turtleList[turtle].canvasColor;
            if (colorString[0] === "#")
                colorString = hex2rgb(colorString.split("#")[1]);
            let obj = colorString.split("(")[1].split(",");
            return parseInt(Number(obj[0]) / 2.55);
        }
    }

    class GetColorPixelBlock extends ValueBlock {
        constructor() {
            super("getcolorpixel", _("pixel color"));
            this.setPalette("sensors");
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
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle) {
            let wasVisible = logo.turtles.turtleList[turtle].container.visible;
            logo.turtles.turtleList[turtle].container.visible = false;
            let x = logo.turtles.turtleList[turtle].container.x;
            let y = logo.turtles.turtleList[turtle].container.y;
            logo.refreshCanvas();

            let canvas = docById("overlayCanvas");
            let ctx = canvas.getContext("2d");
            let imgData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1)
                .data;
            let color = searchColors(imgData[0], imgData[1], imgData[2]);
            if (imgData[3] === 0) {
                (color = body.style.background
                    .substring(
                        body.style.background.indexOf("(") + 1,
                        body.style.background.lastIndexOf(")")
                    )
                    .split(/,\s*/)),
                    (color = searchColors(color[0], color[1], color[2]));
            }

            if (wasVisible) {
                logo.turtles.turtleList[turtle].container.visible = true;
            }
            return color;
        }
    }

    class TimeBlock extends ValueBlock {
        constructor() {
            super("time", _("time"));
            this.setPalette("sensors");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Time block returns the number of seconds that the program has been running."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo) {
            let d = new Date();
            return (d.getTime() - logo.time) / 1000;
        }
    }

    class MouseYBlock extends ValueBlock {
        constructor() {
            super("mousey", _("cursor y"));
            this.setPalette("sensors");
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
            return logo.blocks.blockList[blk].value;
        }

        arg(logo) {
            return logo.getStageY();
        }
    }

    class MouseXBlock extends ValueBlock {
        constructor() {
            super("mousex", _("cursor x"));
            this.setPalette("sensors");
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
            return logo.blocks.blockList[blk].value;
        }

        arg(logo) {
            return logo.getStageX();
        }
    }

    class MouseButtonBlock extends BooleanSensorBlock {
        constructor() {
            super("mousebutton", _("mouse button"));
            this.setPalette("sensors");
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
            if (logo.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo) {
            return logo.getStageMouseDown();
        }
    }

    class ToASCIIBlock extends LeftBlock {
        constructor() {
            super("toascii", _("to ASCII"));
            this.setPalette("sensors");
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
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "toascii"]);
            } else {
                let cblk1 = logo.blocks.blockList[blk].connections[1];
                if (cblk1 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return "A";
                }
                let a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                if (typeof a === "number") {
                    if (a < 1) return 0;
                    else return String.fromCharCode(a);
                } else {
                    logo.errorMsg(NANERRORMSG, blk);
                    return 0;
                }
            }
        }
    }

    class KeyboardBlock extends ValueBlock {
        constructor() {
            super("keyboard", _("keyboard"));
            this.setPalette("sensors");
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
            return logo.blocks.blockList[blk].value;
        }

        arg(logo) {
            logo.lastKeyCode = logo.getCurrentKeyCode();
            let val = logo.lastKeyCode;
            logo.clearCurrentKeyCode();
            return val;
        }
    }

    new InputValueBlock().setup();
    new InputBlock().setup();
    new PitchnessBlock().setup();
    new LoudnessBlock().setup();
    new MyClickBlock().setup();
    new GetBlueBlock().setup();
    new GetGreenBlock().setup();
    new GetRedBlock().setup();
    new GetColorPixelBlock().setup();
    new TimeBlock().setup();
    new MouseYBlock().setup();
    new MouseXBlock().setup();
    new MouseButtonBlock().setup();
    new ToASCIIBlock().setup();
    new KeyboardBlock().setup();
}
