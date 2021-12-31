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
   toFixed2, Howl, last, calcOctave, pitchToFrequency, doStopVideoCam
 */

/* exported setupMediaBlocks */

function setupMediaBlocks(activity) {
    class RightPosBlock extends ValueBlock {
        constructor() {
            //.TRANS: right side of the screen
            super("rightpos", _("right (screen)"));
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Right block returns the position of the right of the canvas."
                ) +
                    " " +
                    _(
                        "In this example, the mouse moves right until it reaches the right edge of the canvas; then it reappears at the left of the canvas."
                    ),
                "documentation",
                null,
                "lrhelp"
            ]);
        }

        updateParameter() {
            return toFixed2(
                activity.turtles._canvas.width / (2.0 * activity.turtles.scale)
            );
        }

        arg() {
            return activity.turtles._canvas.width / (2.0 * activity.turtles.scale);
        }
    }

    class LeftPosBlock extends ValueBlock {
        constructor() {
            //.TRANS: left side of the screen
            super("leftpos", _("left (screen)"));
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Left block returns the position of the left of the canvas."
                ) +
                    " " +
                    _(
                        "In this example, the mouse moves right until it reaches the right edge of the canvas; then it reappears at the left of the canvas."
                    ),
                "documentation",
                null,
                "lrhelp"
            ]);
        }

        updateParameter() {
            return toFixed2(
                -1 * (activity.turtles._canvas.width / (2.0 * activity.turtles.scale))
            );
        }

        arg() {
            return (
                -1 * (activity.turtles._canvas.width / (2.0 * activity.turtles.scale))
            );
        }
    }

    class TopPosBlock extends ValueBlock {
        constructor() {
            super("toppos", _("top (screen)"));
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Top block returns the position of the top of the canvas."
                ) +
                    " " +
                    _(
                        "In this example, the mouse moves upward until it reaches the top edge of the canvas; then it reappears at the bottom of the canvas."
                    ),
                "documentation",
                null,
                "bottomposhelp"
            ]);
        }

        updateParameter() {
            return toFixed2(
                activity.turtles._canvas.height / (2.0 * activity.turtles.scale)
            );
        }

        arg() {
            return activity.turtles._canvas.height / (2.0 * activity.turtles.scale);
        }
    }

    class BottomPosBlock extends ValueBlock {
        constructor() {
            super("bottompos", _("bottom (screen)"));
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Bottom block returns the position of the bottom of the canvas."
                ) +
                    " " +
                    _(
                        "In this example, the mouse moves upward until it reaches the top edge of the canvas; then it reappears at the bottom of the canvas."
                    ),
                "documentation",
                null,
                "bottomposhelp"
            ]);
        }

        updateParameter() {
            return toFixed2(
                -1 * (activity.turtles._canvas.height / (2.0 * activity.turtles.scale))
            );
        }

        arg() {
            return (
                -1 * (activity.turtles._canvas.height / (2.0 * activity.turtles.scale))
            );
        }
    }

    class WidthBlock extends ValueBlock {
        constructor() {
            super("width", _("width"));
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _("The Width block returns the width of the canvas."),
                "documentation",
                ""
            ]);
        }

        updateParameter() {
            return toFixed2(activity.turtles._canvas.width / activity.turtles.scale);
        }

        arg() {
            return activity.turtles._canvas.width / activity.turtles.scale;
        }
    }

    class HeightBlock extends ValueBlock {
        constructor() {
            super("height", _("height"));
            this.setPalette("media", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _("The Height block returns the height of the canvas."),
                "documentation",
                ""
            ]);
        }

        updateParameter() {
            return toFixed2(activity.turtles._canvas.height / activity.turtles.scale);
        }

        arg() {
            return activity.turtles._canvas.height / activity.turtles.scale;
        }
    }

    class StopPlaybackBlock extends FlowBlock {
        constructor() {
            //.TRANS: stops playback of an audio recording
            super("stopplayback", _("stop play"));
            this.setPalette("media", activity);
            this.setHelpString();

            this.hidden = true;
        }

        flow(args, logo) {
            for (const sound in logo.sounds) {
                logo.sounds[sound].stop();
            }
            logo.sounds = [];
        }
    }

    class ClearMediaBlock extends FlowBlock {
        constructor() {
            //.TRANS: Erases the images and text
            super("erasemedia", _("erase media"));
            this.setPalette("media", activity);
            this.setHelpString([
                _("The Erase Media block erases text and images."),
                "documentation",
                ""
            ]);
        }

        flow(args, logo, turtle) {
            const tur = activity.turtles.ithTurtle(turtle);
            tur.painter.doClearMedia();
        }
    }

    class PlaybackBlock extends FlowBlock {
        constructor() {
            //.TRANS: play an audio recording
            super("playback", _("play back"));
            this.setPalette("media", activity);
            this.setHelpString();
            this.formBlock({
                args: 1,
                defaults: [null],
                argTypes: ["mediain"]
            });

            this.hidden = true;
        }

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

    class SpeakBlock extends FlowBlock {
        // Eliminating until we find a better option.
        constructor() {
            super("speak", _("speak"));
            this.setPalette("media", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Speak block outputs to the text-to-speech synthesizer"),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: ["hello"],
                argTypes: ["textin"]
            });

            this.hidden = true;
        }

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

    class CameraBlock extends ValueBlock {
        constructor() {
            super("camera");
            this.setPalette("media", activity);
            this.setHelpString([
                _("The Camera block connects a webcam to the Show block."),
                "documentation",
                ""
            ]);
            this.formBlock({
                image: "images/camera.svg"
            });
        }
    }

    class VideoBlock extends ValueBlock {
        constructor() {
            super("video");
            this.setPalette("media", activity);
            this.setHelpString([
                _("The Video block selects video for use with the Show block."),
                "documentation",
                ""
            ]);
            this.formBlock({
                image: "images/video.svg"
            });
        }
    }

    class LoadFileBlock extends ValueBlock {
        constructor() {
            super("loadFile", "");
            this.setPalette("media", activity);
            this.setHelpString([
                _(
                    "The Open file block opens a file for use with the Show block."
                ),
                "documentation",
                ""
            ]);
            this.formBlock({
                outType: "fileout"
            });
            this.parameter = false;
        }

        // eslint-disable-next-line no-unused-vars
        arg(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }
    }

    class StopVideoCamBlock extends FlowBlock {
        constructor() {
            super("stopvideocam", _("stop media"));
            this.setPalette("media", activity);
            this.setHelpString([
                _("The Stop media block stops audio or video playback."),
                "documentation",
                ""
            ]);
        }

        flow(args, logo) {
            if (logo.cameraID != null) {
                doStopVideoCam(logo.cameraID, logo.setCameraID);
            }
        }
    }

    class ToneBlock extends FlowBlock {
        constructor() {
            super("tone", _("hertz"));
            this.setPalette("media", activity);
            this.piemenuValuesC1 = [220, 247, 262, 294, 330, 349, 392, 440, 494, 523,
                587, 659, 698, 784, 880];
            this.setHelpString();
            this.formBlock({
                args: 2,
                defaults: [392, 1000 / 3],
                argLabels: [_("frequency"), _("duration (ms)")]
            });
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

        flow() {
            return;
        }
    }

    class ToFrequencyBlock extends LeftBlock {
        constructor() {
            //.TRANS: translate a note into hertz, e.g., A4 -> 440HZ
            super("tofrequency", _("note to frequency"));
            this.setPalette("media", activity);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The To frequency block converts a pitch name and octave to Hertz."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 2,
                defaults: ["G", 4],
                argTypes: ["notein", "anyin"],
                argLabels: [
                    this.lang === "ja" ? _("name2") : _("name"),
                    _("octave")
                ]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

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

    class TurtleShellBlock extends FlowBlock {
        constructor() {
            //.TRANS: Avatar is the image used to determine the appearance of the mouse.
            super("turtleshell", _("avatar"));
            this.setPalette("media", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Shell block is used to change the appearance of the mouse."
                ),
                "documentation",
                null,
                "turtleshell"
            ]);

            this.formBlock({
                args: 2,
                defaults: [55, null],
                argTypes: ["numberin", "anyin"],
                argLabels: [_("size"), _("image")]
            });
            this.makeMacro((x, y) => [
                [0, "turtleshell", x, y, [null, 1, 2, 3]],
                [1, ["number", { value: 55 }], 0, 0, [0]],
                [2, "media", 0, 0, [0]],
                [3, "vspace", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 2) {
                if (typeof args[0] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else {
                    activity.turtles.turtleList[turtle].doTurtleShell(
                        args[0],
                        args[1]
                    );
                }
            }
        }
    }

    class ShowBlock extends FlowBlock {
        constructor() {
            super("show");
            this.setPalette("media", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Show block is used to display text or images on the canvas."
                ),
                "documentation",
                ""
            ]);

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

    class MediaBlock extends ValueBlock {
        constructor() {
            super("media");
            this.setPalette("media", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Media block is used to import an image."),
                "documentation",
                null,
                "turtleshell"
            ]);

            /*
        if (language === 'ja') {
            //.TRANS: "video material" is used instead of an image in Japanese
            newblock.staticLabels.push(_('video material'));
            newblock.extraWidth = 10;
        } else {
            newblock.image = 'images/load-media.svg'
        }
        */

            this.formBlock({
                image: "images/load-media.svg",
                outType: "mediaout"
            });
        }
    }

    class TextBlock extends ValueBlock {
        constructor() {
            super("text");
            this.extraWidth = 30;
            this.setPalette("media", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Text block holds a text string."),
                "documentation",
                ""
            ]);

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
