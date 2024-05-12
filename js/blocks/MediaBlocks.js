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

   _, ValueBlock, LeftBlock, FlowBlock, NOINPUTERRORMSG, NANERRORMSG,
   toFixed2, Howl, last, calcOctave, pitchToFrequency, doStopVideoCam,
   _THIS_IS_MUSIC_BLOCKS_
 */

/* exported setupMediaBlocks */

function setupMediaBlocks(activity) {
    /**
     * Represents a block that returns the position of the right side of the screen.
     * @class
     * @extends ValueBlock
     */
    class RightPosBlock extends ValueBlock {
        /**
         * Constructs a RightPosBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: right side of the screen
            super("rightpos", _("right (screen)"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set help string for the block based on context
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Right block returns the position of the right of the canvas.") +
                        " " +
                        _(
                            "In this example, the mouse moves right until it reaches the right edge of the canvas; then it reappears at the left of the canvas."
                        ),
                    "documentation",
                    null,
                    "lrhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Right block returns the position of the right of the canvas.") +
                        " " +
                        _(
                            "In this example, the turtle moves right until it reaches the right edge of the canvas; then it reappears at the left of the canvas."
                        ),
                    "documentation",
                    null,
                    "lrhelp"
                ]);
            }
        }

        /**
         * Updates the parameter of the block.
         * @returns {number} - The updated parameter value.
         */
        updateParameter() {
            return toFixed2(activity.turtles._canvas.width / (2.0 * activity.turtles.scale));
        }

        /**
         * Returns the argument value for the block.
         * @returns {number} - The argument value.
         */
        arg() {
            return activity.turtles._canvas.width / (2.0 * activity.turtles.scale);
        }
    }

    /**
     * Represents a block that returns the position of the left side of the screen.
     * @class
     * @extends ValueBlock
     */
    class LeftPosBlock extends ValueBlock {
        /**
         * Constructs a LeftPosBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: left side of the screen
            super("leftpos", _("left (screen)"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set help string for the block based on context
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Left block returns the position of the left of the canvas.") +
                        " " +
                        _(
                            "In this example, the mouse moves right until it reaches the right edge of the canvas; then it reappears at the left of the canvas."
                        ),
                    "documentation",
                    null,
                    "lrhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Left block returns the position of the left of the canvas.") +
                        " " +
                        _(
                            "In this example, the turtle moves right until it reaches the right edge of the canvas; then it reappears at the left of the canvas."
                        ),
                    "documentation",
                    null,
                    "lrhelp"
                ]);
            }
        }

        /**
         * Updates the parameter of the block.
         * @returns {number} - The updated parameter value.
         */
        updateParameter() {
            return toFixed2(-1 * (activity.turtles._canvas.width / (2.0 * activity.turtles.scale)));
        }

        /**
         * Returns the argument value for the block.
         * @returns {number} - The argument value.
         */
        arg() {
            return -1 * (activity.turtles._canvas.width / (2.0 * activity.turtles.scale));
        }
    }

    /**
     * Represents a block that returns the position of the top of the screen.
     * @class
     * @extends ValueBlock
     */
    class TopPosBlock extends ValueBlock {
        /**
         * Constructs a TopPosBlock instance.
         * @constructor
         */
        constructor() {
            super("toppos", _("top (screen)"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set help string for the block based on context
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Top block returns the position of the top of the canvas.") +
                        " " +
                        _(
                            "In this example, the mouse moves upward until it reaches the top edge of the canvas; then it reappears at the bottom of the canvas."
                        ),
                    "documentation",
                    null,
                    "bottomposhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Top block returns the position of the top of the canvas.") +
                        " " +
                        _(
                            "In this example, the turtle moves upward until it reaches the top edge of the canvas; then it reappears at the bottom of the canvas."
                        ),
                    "documentation",
                    null,
                    "bottomposhelp"
                ]);
            }
        }

        /**
         * Updates the parameter of the block.
         * @returns {number} - The updated parameter value.
         */
        updateParameter() {
            return toFixed2(activity.turtles._canvas.height / (2.0 * activity.turtles.scale));
        }

        /**
         * Returns the argument value for the block.
         * @returns {number} - The argument value.
         */
        arg() {
            return activity.turtles._canvas.height / (2.0 * activity.turtles.scale);
        }
    }

    /**
     * Represents a block that returns the position of the bottom of the screen.
     * @class
     * @extends ValueBlock
     */
    class BottomPosBlock extends ValueBlock {
        /**
         * Constructs a BottomPosBlock instance.
         * @constructor
         */
        constructor() {
            super("bottompos", _("bottom (screen)"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set help string for the block based on context
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Bottom block returns the position of the bottom of the canvas.") +
                        " " +
                        _(
                            "In this example, the mouse moves upward until it reaches the top edge of the canvas; then it reappears at the bottom of the canvas."
                        ),
                    "documentation",
                    null,
                    "bottomposhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Bottom block returns the position of the bottom of the canvas.") +
                        " " +
                        _(
                            "In this example, the turtle moves upward until it reaches the top edge of the canvas; then it reappears at the bottom of the canvas."
                        ),
                    "documentation",
                    null,
                    "bottomposhelp"
                ]);
            }
        }

        /**
         * Updates the parameter of the block.
         * @returns {number} - The updated parameter value.
         */
        updateParameter() {
            return toFixed2(
                -1 * (activity.turtles._canvas.height / (2.0 * activity.turtles.scale))
            );
        }

        /**
         * Returns the argument value for the block.
         * @returns {number} - The argument value.
         */
        arg() {
            return -1 * (activity.turtles._canvas.height / (2.0 * activity.turtles.scale));
        }
    }

    /**
     * Represents a block that returns the width of the canvas.
     * @class
     * @extends ValueBlock
     */
    class WidthBlock extends ValueBlock {
        /**
         * Constructs a WidthBlock instance.
         * @constructor
         */
        constructor() {
            super("width", _("width"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString([
                _("The Width block returns the width of the canvas."),
                "documentation",
                ""
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @returns {number} - The updated parameter value.
         */
        updateParameter() {
            return toFixed2(activity.turtles._canvas.width / activity.turtles.scale);
        }

        /**
         * Returns the argument value for the block.
         * @returns {number} - The argument value.
         */
        arg() {
            return activity.turtles._canvas.width / activity.turtles.scale;
        }
    }

    /**
     * Represents a block that returns the height of the canvas.
     * @class
     * @extends ValueBlock
     */
    class HeightBlock extends ValueBlock {
        /**
         * Constructs a HeightBlock instance.
         * @constructor
         */
        constructor() {
            super("height", _("height"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString([
                _("The Height block returns the height of the canvas."),
                "documentation",
                ""
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @returns {number} - The updated parameter value.
         */
        updateParameter() {
            return toFixed2(activity.turtles._canvas.height / activity.turtles.scale);
        }

        /**
         * Returns the argument value for the block.
         * @returns {number} - The argument value.
         */
        arg() {
            return activity.turtles._canvas.height / activity.turtles.scale;
        }
    }

    /**
     * Represents a block that stops playback of an audio recording.
     * @class
     * @extends FlowBlock
     */
    class StopPlaybackBlock extends FlowBlock {
        /**
         * Constructs a StopPlaybackBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: stops playback of an audio recording
            super("stopplayback", _("stop play"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.setHelpString();

            // Set the block as hidden
            this.hidden = true;
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         */
        flow(args, logo) {
            for (const sound in logo.sounds) {
                logo.sounds[sound].stop();
            }
            logo.sounds = [];
        }
    }

    /**
     * Represents a block that erases text and images.
     * @class
     * @extends FlowBlock
     */
    class ClearMediaBlock extends FlowBlock {
        /**
         * Constructs a ClearMediaBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: Erases the images and text
            super("erasemedia", _("erase media"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.setHelpString([
                _("The Erase Media block erases text and images."),
                "documentation",
                ""
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         */
        flow(args, logo, turtle) {
            const tur = activity.turtles.ithTurtle(turtle);
            tur.painter.doClearMedia();
        }
    }

    /**
     * Represents a block that plays back an audio recording.
     * @class
     * @extends FlowBlock
     */
    class PlaybackBlock extends FlowBlock {
        /**
         * Constructs a PlaybackBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: play an audio recording
            super("playback", _("play back"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.setHelpString();
            this.formBlock({
                args: 1,
                defaults: [null],
                argTypes: ["mediain"]
            });

            // Set the block as hidden
            this.hidden = true;
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const sound = new Howl({
                urls: [args[0]]
            });
            logo.sounds.push(sound);
            sound.play();
        }
    }

    /**
     * Represents a block that outputs to the text-to-speech synthesizer.
     * @class
     * @extends FlowBlock
     */
    class SpeakBlock extends FlowBlock {
        // Eliminating until we find a better option.
        /**
         * Constructs a SpeakBlock instance.
         * @constructor
         */
        constructor() {
            super("speak", _("speak"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString([
                _("The Speak block outputs to the text-to-speech synthesizer"),
                "documentation",
                ""
            ]);

            // Form block with arguments and default values
            this.formBlock({
                args: 1,
                defaults: ["hello"],
                argTypes: ["textin"]
            });

            // Set the block as hidden
            this.hidden = true;
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            if (args.length === 1) {
                if (logo.meSpeak !== null) {
                    if (tur.singer.inNoteBlock.length > 0) {
                        tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                    } else {
                        if (!tur.singer.suppressOutput) {
                            logo.processSpeak(args[0]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Represents a block that connects a webcam to the Show block.
     * @class
     * @extends ValueBlock
     */
    class CameraBlock extends ValueBlock {
        /**
         * Constructs a CameraBlock instance.
         * @constructor
         */
        constructor() {
            super("camera", _("camera"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.setHelpString([
                _("The Camera block connects a webcam to the Show block."),
                "documentation",
                ""
            ]);

            // Form block with image
            this.formBlock({
                image: "images/camera.svg"
            });
        }
    }

    /**
     * Represents a block that selects video for use with the Show block.
     * @class
     * @extends ValueBlock
     */
    class VideoBlock extends ValueBlock {
        /**
         * Constructs a VideoBlock instance.
         * @constructor
         */
        constructor() {
            super("video", _("video"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.setHelpString([
                _("The Video block selects video for use with the Show block."),
                "documentation",
                ""
            ]);

            // Form block with image
            this.formBlock({
                image: "images/video.svg"
            });
        }
    }

    /**
     * Represents a block that opens a file for use with the Show block.
     * @class
     * @extends ValueBlock
     */
    class LoadFileBlock extends ValueBlock {
        /**
         * Constructs a LoadFileBlock instance.
         * @constructor
         */
        constructor() {
            super("loadFile", _("open file"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.setHelpString([
                _("The Open file block opens a file for use with the Show block."),
                "documentation",
                ""
            ]);

            // Form block with output type
            this.formBlock({
                outType: "fileout"
            });

            // Set parameter flag
            this.parameter = false;
        }

        // eslint-disable-next-line no-unused-vars
        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {string} - The argument value.
         */
        arg(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }
    }

    /**
     * Represents a block that stops audio or video playback.
     * @class
     * @extends FlowBlock
     */
    class StopVideoCamBlock extends FlowBlock {
        /**
         * Constructs a StopVideoCamBlock instance.
         * @constructor
         */
        constructor() {
            super("stopvideocam", _("stop media"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.setHelpString([
                _("The Stop media block stops audio or video playback."),
                "documentation",
                ""
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         */
        flow(args, logo) {
            if (logo.cameraID != null) {
                doStopVideoCam(logo.cameraID, logo.setCameraID);
            }
        }
    }

    /**
     * Represents a block that produces a tone.
     * @class
     * @extends FlowBlock
     */
    class ToneBlock extends FlowBlock {
        /**
         * Constructs a ToneBlock instance.
         * @constructor
         */
        constructor() {
            super("tone", _("hertz"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.piemenuValuesC1 = [
                220, 247, 262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784, 880
            ];
            this.setHelpString();

            // Form block with arguments and default values
            this.formBlock({
                args: 2,
                defaults: [392, 1000 / 3],
                argLabels: [_("frequency"), _("duration (ms)")]
            });

            // Form block with specified connections
            this.formBlock((x, y) => [
                [0, "drift", x, y, [null, 1, null]],
                [1, "osctime", 0, 0, [0, 3, 2, null]],
                [2, "vspace", 0, 0, [1, 6]],
                [3, "divide", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 1000 }], 0, 0, [3]],
                [5, ["number", { value: 3 }], 0, 0, [3]],
                [6, "hertz", 0, 0, [2, 7, null]],
                [7, ["number", { value: 392 }], 0, 0, [6]]
            ]);
        }

        /**
         * Executes the flow of the block.
         */
        flow() {
            return;
        }
    }

    /**
     * Represents a block that converts a note into hertz.
     * @class
     * @extends LeftBlock
     */
    class ToFrequencyBlock extends LeftBlock {
        /**
         * Constructs a ToFrequencyBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: translate a note into hertz, e.g., A4 -> 440HZ
            super("tofrequency", _("note to frequency"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString([
                _("The To frequency block converts a pitch name and octave to Hertz."),
                "documentation",
                ""
            ]);

            // Form block with arguments, default values, and labels
            this.formBlock({
                args: 2,
                defaults: ["G", 4],
                argTypes: ["notein", "anyin"],
                argLabels: [this.lang === "ja" ? _("name2") : _("name"), _("octave")]
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {number} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {*} receivedArg - The received argument.
         * @returns {number} - The argument value.
         */
        arg(logo, turtle, blk, receivedArg) {
            const tur = activity.turtles.ithTurtle(turtle);

            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 392;
            }
            const note = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const octave = Math.floor(
                calcOctave(
                    tur.singer.currentOctave,
                    logo.parseArg(logo, turtle, cblk2, blk, receivedArg),
                    tur.singer.lastNotePlayed,
                    note
                )
            );
            return Math.round(pitchToFrequency(note, octave, 0, tur.singer.keySignature));
        }
    }

    /**
     * Represents a block that changes the appearance of the mouse or turtle.
     * @class
     * @extends FlowBlock
     */
    class TurtleShellBlock extends FlowBlock {
        /**
         * Constructs a TurtleShellBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: Avatar is the image used to determine the appearance of the mouse.
            super("turtleshell", _("avatar"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);

            // Set help string for the block
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Avatar block is used to change the appearance of the mouse."),
                    "documentation",
                    null,
                    "turtleshell"
                ]);
            } else {
                this.setHelpString([
                    _("The Avatar block is used to change the appearance of the turtle."),
                    "documentation",
                    null,
                    "turtleshell"
                ]);
            }

            // Form block with arguments, default values, and labels
            this.formBlock({
                args: 2,
                defaults: [55, null],
                argTypes: ["numberin", "anyin"],
                argLabels: [_("size"), _("image")]
            });

            // Make macro for the block
            this.makeMacro((x, y) => [
                [0, "turtleshell", x, y, [null, 1, 2, 3]],
                [1, ["number", { value: 55 }], 0, 0, [0]],
                [2, "media", 0, 0, [0]],
                [3, "vspace", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args.length === 2) {
                if (typeof args[0] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else {
                    activity.turtles.turtleList[turtle].doTurtleShell(args[0], args[1]);
                }
            }
        }
    }

    /**
     * Represents a block that displays text or images on the canvas.
     * @class
     * @extends FlowBlock
     */
    class ShowBlock extends FlowBlock {
        /**
         * Constructs a ShowBlock instance.
         * @constructor
         */
        constructor() {
            super("show");

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString([
                _("The Show block is used to display text or images on the canvas."),
                "documentation",
                ""
            ]);

            // Form block with name, arguments, default values, and labels
            this.formBlock({
                //.TRANS: show1 is show as in display an image or text on the screen.
                name: this.lang === "ja" ? _("show1") : _("show"),
                //.TRANS: a media object
                args: 2,
                argLabels: [_("size"), _("obj")],
                defaults: [24, _("text")],
                argTypes: ["numberin", "anyin"]
            });
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            if (args.length === 2) {
                if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    if (!tur.singer.suppressOutput) {
                        logo.processShow(turtle, blk, args[0], args[1]);
                    }
                }
            }
        }
    }

    /**
     * Represents a block that imports an image.
     * @class
     * @extends ValueBlock
     */
    class MediaBlock extends ValueBlock {
        /**
         * Constructs a MediaBlock instance.
         * @constructor
         */
        constructor() {
            super("media", _("media"));

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString([
                _("The Media block is used to import an image."),
                "documentation",
                null,
                "turtleshell"
            ]);

            // Form block with image and output type
            this.formBlock({
                image: "images/load-media.svg",
                outType: "mediaout"
            });
        }
    }

    /**
     * Represents a block that holds a text string.
     * @class
     * @extends ValueBlock
     */
    class TextBlock extends ValueBlock {
        /**
         * Constructs a TextBlock instance.
         * @constructor
         */
        constructor() {
            super("text", _("text"));

            // Set extra width for the block
            this.extraWidth = 30;

            // Set palette and activity for the block
            this.setPalette("media", activity);
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString([_("The Text block holds a text string."), "documentation", ""]);

            // Form block with output type
            this.formBlock({
                outType: "textout"
            });
        }
    }

    new RightPosBlock().setup(activity);
    new LeftPosBlock().setup(activity);
    new TopPosBlock().setup(activity);
    new BottomPosBlock().setup(activity);
    new WidthBlock().setup(activity);
    new HeightBlock().setup(activity);
    new CameraBlock().setup(activity);
    new StopPlaybackBlock().setup(activity);
    new PlaybackBlock().setup(activity);
    new SpeakBlock().setup(activity);
    new VideoBlock().setup(activity);
    new LoadFileBlock().setup(activity);
    new StopVideoCamBlock().setup(activity);
    new ToneBlock().setup(activity);
    new ToFrequencyBlock().setup(activity);
    new TurtleShellBlock().setup(activity);
    new ClearMediaBlock().setup(activity);
    new ShowBlock().setup(activity);
    new MediaBlock().setup(activity);
    new TextBlock().setup(activity);
}
