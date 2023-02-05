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

   _, last, Singer, FlowBlock, ValueBlock, FlowClampBlock,
   DEFAULTDRUM, DEFAULTEFFECT, NOINPUTERRORMSG, DEFAULTNOISE
*/

/* exported setupDrumBlocks */

let setupDrumBlocks = (activity) => {
    class NoiseNameBlock extends ValueBlock {
        constructor() {
            super("noisename", _("noise name"));
            this.setPalette("drum", activity);
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
            this.setHelpString([
                _("The Noise name block is used to select a noise synthesizer."),
                "documentation",
                ""
            ]);
        }
    }

    class DrumNameBlock extends ValueBlock {
        constructor() {
            super("drumname", _("drum name"));
            this.setPalette("drum", activity);
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
            this.setHelpString([
                _("The Drum name block is used to select a drum."),
                "documentation",
                null,
                "note4"
            ]);
        }
    }

    class EffectsNameBlock extends ValueBlock {
        constructor() {
            super("effectsname", _("effects name"));
            this.setPalette("drum", activity);
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
            this.setHelpString([
                _("The Effects name block is used to select a sound effect."),
                "documentation",
                null,
                "effectshelp"
            ]);
        }
    }

    class PlayNoiseBlock extends FlowBlock {
        constructor() {
            super("playnoise", _("noise"));
            this.setPalette("drum", activity);
            this.setHelpString([
                _("The Play noise block will generate white, pink, or brown noise."),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 1,
                defaults: [_("white noise")],
                argTypes: ["anyin"]
            });
            this.makeMacro((x, y) => [
                [0, "playnoise", x, y, [null, 1, null]],
                [1, ["noisename", { value: DEFAULTNOISE }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            let arg = args[0];
            if (args.length !== 1 || arg == null || typeof arg !== "string") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = "noise1";
            }

            Singer.DrumActions.playNoise(arg, turtle, blk);
        }
    }

    let _createPlayDrumMacros = () => {
        class PlayDrumMacroBlock extends FlowBlock {
            constructor(name, displayName, isDrum, drumName) {
                if (displayName === undefined) {
                    super(name, _(name));
                } else {
                    super(name, _(displayName));
                }
                this.setPalette("drum", activity);
                this.formBlock({ args: 1 });
                this.makeMacro((x, y) => [
                    [0, "playdrum", x, y, [null, 1, null]],
                    [
                        1,
                        [
                            isDrum ? "drumname" : "effectsname",
                            {
                                value: drumName || isDrum ? displayName || name : name
                            }
                        ],
                        0,
                        0,
                        [0]
                    ]
                ]);
            }
        }

        new PlayDrumMacroBlock("duck").setup(activity);
        new PlayDrumMacroBlock("cat").setup(activity);
        new PlayDrumMacroBlock("cricket").setup(activity);
        new PlayDrumMacroBlock("dog").setup(activity);
        new PlayDrumMacroBlock("bottle").setup(activity);
        new PlayDrumMacroBlock("bubbles").setup(activity);
        // Legacy typo
        new PlayDrumMacroBlock("chine", "chime", true).setup(activity);
        new PlayDrumMacroBlock("clang").setup(activity);
        new PlayDrumMacroBlock("clap").setup(activity);
        new PlayDrumMacroBlock("slap").setup(activity);
        new PlayDrumMacroBlock("crash").setup(activity);
        new PlayDrumMacroBlock("splash").setup(activity);
        new PlayDrumMacroBlock("cowbell", "cow bell", true).setup(activity);
        new PlayDrumMacroBlock("ridebell", "ride bell", true).setup(activity);
        new PlayDrumMacroBlock("fingercymbals", "finger cymbals", true).setup(activity);
        new PlayDrumMacroBlock("trianglebell", "triangle bell", true).setup(activity);
        new PlayDrumMacroBlock("hihat", "hi hat", true).setup(activity);
        new PlayDrumMacroBlock("darbuka", "darbuka drum", true).setup(activity);
        new PlayDrumMacroBlock("cup", "cup drum", true).setup(activity);
        new PlayDrumMacroBlock("floortom", "floor tom", true, "floor tom tom").setup(activity);
        new PlayDrumMacroBlock("tom", "tom tom", true).setup(activity);
        new PlayDrumMacroBlock("kick", "kick drum", true).setup(activity);
        new PlayDrumMacroBlock("snare", "snare drum", true).setup(activity);
    };

    class MapDrumBlock extends FlowClampBlock {
        constructor() {
            super("mapdrum");
            this.setPalette("drum", activity);
            this.setHelpString([
                _("Replace every instance of a pitch with a drum sound."),
                "documentation",
                null,
                "mapdrumhelp"
            ]);
            this.formBlock({
                //.TRANS: map a pitch to a drum sound
                name: _("map pitch to drum"),
                args: 1,
                argTypes: ["anyin"]
            });
            this.makeMacro((x, y) => [
                [0, "mapdrum", x, y, [null, 1, 3, 2]],
                [1, ["drumname", { value: "kick drum" }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]],
                [3, "pitch", 0, 0, [0, 4, 5, null]],
                [4, ["solfege", { value: "sol" }], 0, 0, [3]],
                [5, ["number", { value: 4 }], 0, 0, [3]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            Singer.DrumActions.mapPitchToDrum(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    class SetDrumBlock extends FlowClampBlock {
        constructor() {
            super("setdrum");
            this.setPalette("drum", activity);
            this.beginnerBlock(true);

            if (activity.beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _(
                        "The Set drum block will select a drum sound to replace the pitch of any contained notes."
                    ),
                    "documentation",
                    null,
                    "rhythmruler2"
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Set drum block will select a drum sound to replace the pitch of any contained notes."
                    ) +
                        " " +
                        _("In the example above, a kick drum sound will be played instead of sol."),
                    "documentation",
                    null,
                    "setdrumhelp"
                ]);
            }

            this.formBlock({
                //.TRANS: set the current drum sound for playback
                name: _("set drum"),
                args: 1,
                argTypes: ["anyin"]
            });
            this.makeMacro((x, y) => [
                [0, "setdrum", x, y, [null, 1, 2, 7]],
                [1, ["drumname", { value: DEFAULTDRUM }], 0, 0, [0]],
                [2, "rhythm2", 0, 0, [0, 3, 4, null]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, "divide", 0, 0, [2, 5, 6]],
                [5, ["number", { value: 1 }], 0, 0, [4]],
                [6, ["number", { value: 1 }], 0, 0, [4]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            Singer.DrumActions.setDrum(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    class PlayEffectBlock extends FlowBlock {
        constructor() {
            super("playeffect", _("sound effect"));
            this.setPalette("drum", activity);
            this.beginnerBlock(true);
            this.formBlock({ args: 1, argTypes: ["anyin"] });
            this.makeMacro((x, y) => [
                [0, "playdrum", x, y, [null, 1, null]],
                [1, ["effectsname", { value: DEFAULTEFFECT }], 0, 0, [0]]
            ]);
        }
    }

    class PlayDrumBlock extends FlowBlock {
        constructor() {
            super("playdrum", _("drum"));
            this.setPalette("drum", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("You can use multiple Drum blocks within a Note block."),
                "documentation",
                null,
                "note4"
            ]);
            this.formBlock({ args: 1, argTypes: ["anyin"] });
            this.makeMacro((x, y) => [
                [0, "playdrum", x, y, [null, 1, null]],
                [1, ["drumname", { value: DEFAULTDRUM }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            let arg = args[0];
            if (args.length !== 1 || arg == null || typeof arg !== "string") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = DEFAULTDRUM;
            }

            let drumname = Singer.DrumActions.GetDrumname(args[0]);

            const tur = activity.turtles.ithTurtle(turtle);
            // If we are in a setdrum clamp, override the drum name
            if (tur.singer.drumStyle.length > 0) {
                drumname = last(tur.singer.drumStyle);
            }

            if (logo.inPitchDrumMatrix) {
                logo.pitchDrumMatrix.drums.push(drumname);
                logo.pitchDrumMatrix.addColBlock(blk);
                if (logo.drumBlocks.indexOf(blk) === -1) {
                    logo.drumBlocks.push(blk);
                }
            } else if (logo.inMatrix) {
                logo.phraseMaker.rowLabels.push(drumname);
                logo.phraseMaker.rowArgs.push(-1);

                logo.phraseMaker.addRowBlock(blk);
                if (logo.drumBlocks.indexOf(blk) === -1) {
                    logo.drumBlocks.push(blk);
                }
            } else if (logo.inMusicKeyboard) {
                logo.musicKeyboard.instruments.push(drumname);
                logo.musicKeyboard.noteNames.push("drum");
                logo.musicKeyboard.octaves.push(null);
                logo.musicKeyboard.addRowBlock(blk);
            } else if (
                tur.singer.inNoteBlock.length > 0 ||
                (activity.blocks.blockList[blk].connections[0] == null &&
                    last(activity.blocks.blockList[blk].connections) == null)
            ) {
                Singer.DrumActions.playDrum(args[0], turtle, blk);
            } else {
                // eslint-disable-next-line no-console
                console.debug("PLAY DRUM ERROR: missing context");
                return;
            }

            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)].push(tur.singer.beatFactor);
            }

            tur.singer.pushedNote = true;
        }
    }

    new NoiseNameBlock().setup(activity);
    new DrumNameBlock().setup(activity);
    new EffectsNameBlock().setup(activity);
    new PlayNoiseBlock().setup(activity);
    _createPlayDrumMacros();
    new MapDrumBlock().setup(activity);
    new SetDrumBlock().setup(activity);
    new PlayEffectBlock().setup(activity);
    new PlayDrumBlock().setup(activity);
};
