function setupVolumeBlocks() {
    class SynthVolumeBlock extends LeftBlock {
        constructor() {
            //.TRANS: the volume for this synth
            super("synthvolumefactor", _("synth volume"));
            this.setPalette("volume");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Synth volume block returns the current volume of the current synthesizer."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("piano")]
            });

            this.makeMacro((x, y) => [
                [0, "synthvolumefactor", x, y, [null, 1]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]]
            ]);
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
                logo.statusFields.push([blk, "synth volume"]);
            } else {
                let cblk = logo.blocks.blockList[blk].connections[1];
                if (cblk !== null) {
                    let targetSynth = logo.parseArg(
                        logo,
                        turtle,
                        cblk,
                        blk,
                        receivedArg
                    );
                    for (let synth in logo.synthVolume[turtle]) {
                        if (synth === targetSynth) {
                            return last(logo.synthVolume[turtle][synth]);
                        }
                    }
                }
                return 0;
            }
        }
    }

    class MasterVolumeBlock extends ValueBlock {
        constructor() {
            //.TRANS: the volume at which notes are played
            super("notevolumefactor", _("master volume"));
            this.setPalette("volume");
            this.parameter = true;
            this.setHelpString([
                _("The Master volume block returns the master volume."),
                "documentation",
                ""
            ]);
        }

        setter(logo, value, turtle, blk) {
            let len = logo.masterVolume.length;
            logo.masterVolume[len - 1] = value;
            if (!logo.suppressOutput[turtle]) {
                logo._setMasterVolume(value);
            }

            if (logo.justCounting[turtle].length === 0) {
                logo._playbackPush(turtle, [
                    logo.previousTurtleTime[turtle],
                    "setvolume",
                    value
                ]);
            }
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "volume"]);
            } else {
                return last(logo.masterVolume);
            }
        }
    }

    class PPPBlock extends FlowBlock {
        constructor() {
            super("ppp", "ppp");
            this.setPalette("volume");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 10 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class PPBlock extends FlowBlock {
        constructor() {
            super("pp", "pp");
            this.setPalette("volume");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 20 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class PBlock extends FlowBlock {
        constructor() {
            super("p", "p");
            this.setPalette("volume");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 30 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class MPBlock extends FlowBlock {
        constructor() {
            super("mp", "mp");
            this.setPalette("volume");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 40 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class MFBlock extends FlowBlock {
        constructor() {
            super("mf", "mf");
            this.setPalette("volume");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 50 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class FBlock extends FlowBlock {
        constructor() {
            super("f", "f");
            this.setPalette("volume");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 60 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class FFBlock extends FlowBlock {
        constructor() {
            super("ff", "ff");
            this.setPalette("volume");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 80 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class FFFBlock extends FlowBlock {
        constructor() {
            super("fff", "fff");
            this.setPalette("volume");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 100 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class SetSynthVolume2Block extends FlowBlock {
        constructor() {
            //.TRANS: a rapid, slight variation in pitch
            super("setsynthvolume2", _("set synth volume"));
            this.setPalette("volume");
            this.setHelpString();
            this.formBlock({
                args: 2,
                defaults: [DEFAULTVOICE, 50],
                argTypes: ["textin", "numberin"],
                argLabels: [_("synth"), _("volume")]
            });
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            // set synth volume in clamp form
            if (args[2] === undefined) {
                // Nothing to do.
                return;
            }

            let arg0, arg1;
            if (args[0] === null || typeof args[0] !== "string") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = "electronic synth";
            } else {
                arg0 = args[0];
            }

            if (args[1] === null || typeof args[1] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg1 = 50;
            } else {
                if (args[1] < 0) {
                    arg1 = 0;
                } else if (args[1] > 100) {
                    arg1 = 100;
                } else {
                    arg1 = args[1];
                }

                if (arg1 === 0) {
                    logo.errorMsg(_("Setting volume to 0."), blk);
                }
            }

            let synth = null;

            if (arg0 === "electronic synth" || arg0 === _("electronic synth")) {
                synth = "electronic synth";
            } else if (arg0 === "custom" || args[0] === _("custom")) {
                synth = "custom";
            }

            if (synth === null) {
                for (let voice in VOICENAMES) {
                    if (VOICENAMES[voice][0] === arg0) {
                        synth = VOICENAMES[voice][1];
                        break;
                    } else if (VOICENAMES[voice][1] === arg0) {
                        synth = arg0;
                        break;
                    }
                }
            }

            if (synth === null) {
                for (let drum in DRUMNAMES) {
                    if (DRUMNAMES[drum][0].replace("-", " ") === arg0) {
                        synth = DRUMNAMES[drum][1];
                        break;
                    } else if (DRUMNAMES[drum][1].replace("-", " ") === arg0) {
                        synth = arg0;
                        break;
                    }
                }
            }

            if (synth === null) {
                logo.errorMsg(_("Synth not found"), blk);
                synth = "electronic synth";
            }

            if (logo.instrumentNames[turtle].indexOf(synth) === -1) {
                logo.instrumentNames[turtle].push(synth);
                logo.synth.loadSynth(turtle, synth);

                if (logo.synthVolume[turtle][synth] === undefined) {
                    logo.synthVolume[turtle][synth] = [DEFAULTVOLUME];
                    logo.crescendoInitialVolume[turtle][synth] = [
                        DEFAULTVOLUME
                    ];
                }
            }

            logo.synthVolume[turtle][synth].push(arg1);
            if (!logo.suppressOutput[turtle]) {
                logo.setSynthVolume(turtle, synth, arg1);
            }

            if (logo.justCounting[turtle].length === 0) {
                logo._playbackPush(turtle, [
                    logo.previousTurtleTime[turtle],
                    "setsynthvolume",
                    synth,
                    arg1
                ]);
            }

            let listenerName = "_synthvolume_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.synthVolume[turtle][synth].pop();
                // Restore previous volume.
                if (
                    logo.justCounting[turtle].length === 0 &&
                    logo.synthVolume[turtle][synth].length > 0
                ) {
                    logo.setSynthVolume(
                        turtle,
                        synth,
                        last(logo.synthVolume[turtle][synth])
                    );
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "setsynthvolume",
                        synth,
                        last(logo.synthVolume[turtle][synth])
                    ]);
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[2], 1];
        }
    }

    class SetDrumVolumeBlock extends FlowBlock {
        constructor() {
            //.TRANS: set the loudness level
            super("setdrumvolume", _("set drum volume"));
            this.setPalette("volume");
            this.beginnerBlock(true);

            this.formBlock({
                args: 2,
                defaults: [DEFAULTDRUM, 50],
                argTypes: ["textin", "numberin"],
                argLabels: [_("drum"), _("volume")]
            });
            this.makeMacro((x, y) => [
                [0, "setsynthvolume", x, y, [null, 1, 2, null]],
                [1, ["drumname", { value: DEFAULTDRUM }], 0, 0, [0]],
                [2, ["number", { value: 50 }], 0, 0, [0, null]]
            ]);
        }
    }

    class SetSynthVolumeBlock extends FlowBlock {
        constructor() {
            //.TRANS: set the loudness level
            super("setsynthvolume", _("set synth volume"));
            this.setPalette("volume");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Set synth volume block will change the volume of a particular synth,"
                ) +
                    " " +
                    _("eg guitar violin snare drum etc.") +
                    " " +
                    _("The default volume is 50.") +
                    " " +
                    _("The range is 0 for silence to 100 for full volume."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 2,
                defaults: [DEFAULTVOICE, 50],
                argTypes: ["textin", "numberin"],
                argLabels: [_("synth"), _("volume")]
            });
            this.makeMacro((x, y) => [
                [0, "setsynthvolume", x, y, [null, 1, 2, null]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 50 }], 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            let arg0, arg1;
            if (args[0] === null || typeof args[0] !== "string") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = "electronic synth";
            } else {
                arg0 = args[0];
            }

            if (args[1] === null || typeof args[1] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg1 = 50;
            } else {
                if (args[1] < 0) {
                    arg1 = 0;
                } else if (args[1] > 100) {
                    arg1 = 100;
                } else {
                    arg1 = args[1];
                }

                if (arg1 === 0) {
                    logo.errorMsg(_("Setting volume to 0."), blk);
                }
            }

            let synth = null;

            if (arg0 === "electronic synth" || arg0 === _("electronic synth")) {
                synth = "electronic synth";
            } else if (arg0 === "custom" || arg0 === _("custom")) {
                synth = "custom";
            }

            if (synth === null) {
                for (let voice in VOICENAMES) {
                    if (VOICENAMES[voice][0] === arg0) {
                        synth = VOICENAMES[voice][1];
                        break;
                    } else if (VOICENAMES[voice][1] === arg0) {
                        synth = arg0;
                        break;
                    }
                }
            }

            if (synth === null) {
                for (let drum in DRUMNAMES) {
                    if (DRUMNAMES[drum][0].replace("-", " ") === arg0) {
                        synth = DRUMNAMES[drum][1];
                        break;
                    } else if (DRUMNAMES[drum][1].replace("-", " ") === arg0) {
                        synth = arg0;
                        break;
                    }
                }
            }

            if (synth === null) {
                logo.errorMsg(synth + "not found", blk);
                synth = "electronic synth";
            }

            if (logo.instrumentNames[turtle].indexOf(synth) === -1) {
                logo.instrumentNames[turtle].push(synth);
                logo.synth.loadSynth(turtle, synth);

                if (logo.synthVolume[turtle][synth] === undefined) {
                    logo.synthVolume[turtle][synth] = [DEFAULTVOLUME];
                    logo.crescendoInitialVolume[turtle][synth] = [
                        DEFAULTVOLUME
                    ];
                }
            }

            logo.synthVolume[turtle][synth].push(args[1]);
            if (!logo.suppressOutput[turtle]) {
                logo.setSynthVolume(turtle, synth, args[1]);
            }

            if (logo.justCounting[turtle].length === 0) {
                logo._playbackPush(turtle, [
                    logo.previousTurtleTime[turtle],
                    "setsynthvolume",
                    synth,
                    arg1
                ]);
            }
        }
    }

    class SetNoteVolumeBlock extends FlowBlock {
        constructor() {
            //.TRANS: set the loudness level
            super("setnotevolume", _("set master volume"));
            this.setPalette("volume");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Set master volume block sets the volume for all synthesizers."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({ args: 1, defaults: [50] });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 1) {
                let arg;
                if (typeof args[0] !== "number") {
                    logo.errorMsg(NANERRORMSG, blk);
                } else {
                    if (args[0] < 0) {
                        arg = 0;
                    } else if (args[0] > 100) {
                        arg = 100;
                    } else {
                        arg = args[0];
                    }

                    if (arg === 0) {
                        logo.errorMsg(_("Setting volume to 0."), blk);
                    }

                    logo.masterVolume.push(arg);
                    if (!logo.suppressOutput[turtle]) {
                        logo._setMasterVolume(arg);
                    }

                    if (logo.justCounting[turtle].length === 0) {
                        logo._playbackPush(turtle, [
                            logo.previousTurtleTime[turtle],
                            "setvolume",
                            arg
                        ]);
                    }
                }
            }
        }
    }

    class SetNoteVolume2Block extends FlowClampBlock {
        constructor() {
            super("setnotevolume2");
            this.setPalette("volume");
            this.setHelpString();
            this.formBlock({
                //.TRANS: set the loudness level
                name: _("set master volume"),
                args: 1,
                defaults: [50]
            });
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 50 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = true;
            this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            // master volume in clamp form
            // Used by fff ff f p pp ppp blocks
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            let arg;
            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 50;
            } else {
                if (args[0] < 0) {
                    arg = 0;
                } else if (args[0] > 100) {
                    arg = 100;
                } else {
                    arg = args[0];
                }

                if (arg === 0) {
                    logo.errorMsg(_("Setting volume to 0."), blk);
                }
            }

            logo.masterVolume.push(arg);
            if (!logo.suppressOutput[turtle]) {
                logo._setMasterVolume(arg);
            }

            if (logo.justCounting[turtle].length === 0) {
                logo._playbackPush(turtle, [
                    logo.previousTurtleTime[turtle],
                    "setvolume",
                    arg
                ]);
            }

            let listenerName = "_volume_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.masterVolume.pop();
                // Restore previous volume.
                if (
                    logo.justCounting[turtle].length === 0 &&
                    logo.masterVolume.length > 0
                ) {
                    logo._setMasterVolume(last(logo.masterVolume));
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class ArticulationBlock extends FlowClampBlock {
        constructor() {
            super("articulation");
            this.setPalette("volume");
            this.setHelpString([
                _(
                    "The Set relative volume block changes the volume of the contained notes."
                ),
                "documentation",
                null,
                "articulationhelp"
            ]);
            this.formBlock({
                //.TRANS: set an articulation (change in volume)
                name: _("set relative volume"),
                args: 1,
                defaults: [50]
            });
            this.makeMacro((x, y) => [
                [0, "articulation", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 25 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            let arg;
            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 0;
            } else {
                arg = args[0];
            }

            for (let synth in logo.synthVolume[turtle]) {
                let newVolume =
                    (last(logo.synthVolume[turtle][synth]) * (100 + arg)) / 100;
                if (newVolume > 100) {
                    console.debug("articulated volume exceeds 100%. clipping");
                    newVolume = 100;
                } else if (newVolume < -100) {
                    console.debug("articulated volume exceeds 100%. clipping");
                    newVolume = -100;
                }

                if (logo.synthVolume[turtle][synth] === undefined) {
                    logo.synthVolume[turtle][synth] = [newVolume];
                } else {
                    logo.synthVolume[turtle][synth].push(newVolume);
                }

                if (!logo.suppressOutput[turtle]) {
                    logo.setSynthVolume(turtle, synth, newVolume);
                }

                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "setsynthvolume",
                        synth,
                        newVolume
                    ]);
                }
            }

            if (logo.justCounting[turtle].length === 0) {
                logo.notationBeginArticulation(turtle);
            }

            let listenerName = "_articulation_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                for (let synth in logo.synthVolume[turtle]) {
                    logo.synthVolume[turtle][synth].pop();
                    logo.setSynthVolume(
                        turtle,
                        synth,
                        last(logo.synthVolume[turtle][synth])
                    );
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "setsynthvolume",
                        synth,
                        last(logo.synthVolume[turtle][synth])
                    ]);
                }

                if (logo.justCounting[turtle].length === 0) {
                    logo.notationEndArticulation(turtle);
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class DecrescendoBlock extends FlowClampBlock {
        constructor(name) {
            super(name || "decrescendo");
            this.setPalette("volume");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Decrescendo block will decrease the volume of the contained notes by a specified amount for every note played."
                ) +
                    " " +
                    _(
                        "For example if you have 7 notes in sequence contained in a Decrescendo block with a value of 5 the final note will be at 35% less than the starting volume."
                    ),
                "documentation",
                null,
                "crescendohelp"
            ]);

            this.formBlock({
                //.TRANS: a gradual increase in loudness
                name: _("decrescendo"),
                args: 1,
                defaults: [5]
            });
            this.makeMacro((x, y) => [
                [0, "decrescendo", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 5 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args.length > 1 && args[0] !== 0) {
                if (logo.blocks.blockList[blk].name === "crescendo") {
                    logo.crescendoDelta[turtle].push(args[0]);
                } else {
                    logo.crescendoDelta[turtle].push(-args[0]);
                }

                for (let synth in logo.synthVolume[turtle]) {
                    let vol = last(logo.synthVolume[turtle][synth]);
                    logo.synthVolume[turtle][synth].push(vol);
                    if (
                        logo.crescendoInitialVolume[turtle][synth] === undefined
                    ) {
                        logo.crescendoInitialVolume[turtle][synth] = [vol];
                    } else {
                        logo.crescendoInitialVolume[turtle][synth].push(vol);
                    }
                }

                logo.inCrescendo[turtle].push(true);

                let listenerName = "_crescendo_" + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                let __listener = function(event) {
                    if (logo.justCounting[turtle].length === 0) {
                        logo.notationEndCrescendo(
                            turtle,
                            last(logo.crescendoDelta[turtle])
                        );
                    }

                    logo.crescendoDelta[turtle].pop();
                    for (let synth in logo.synthVolume[turtle]) {
                        let len = logo.synthVolume[turtle][synth].length;
                        logo.synthVolume[turtle][synth][len - 1] = last(
                            logo.crescendoInitialVolume[turtle][synth]
                        );
                        logo.crescendoInitialVolume[turtle][synth].pop();
                    }
                };

                logo._setListener(turtle, listenerName, __listener);

                return [args[1], 1];
            }
        }
    }

    class CrescendoBlock extends DecrescendoBlock {
        constructor() {
            super("crescendo");
            this.setPalette("volume");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Crescendo block will increase the volume of the contained notes by a specified amount for every note played."
                ) +
                    " " +
                    _(
                        "For example if you have 7 notes in sequence contained in a Crescendo block with a value of 5 the final note will be at 35% more than the starting volume."
                    ),
                "documentation",
                null,
                "crescendohelp"
            ]);

            this.formBlock({
                //.TRANS: a gradual increase in loudness
                name: _("crescendo"),
                args: 1,
                defaults: [5]
            });
            this.makeMacro((x, y) => [
                [0, "crescendo", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 5 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    new MasterVolumeBlock().setup();
    new SynthVolumeBlock().setup();
    new PPPBlock().setup();
    new PPBlock().setup();
    new PBlock().setup();
    new MPBlock().setup();
    new MFBlock().setup();
    new FBlock().setup();
    new FFBlock().setup();
    new FFFBlock().setup();
    new SetSynthVolume2Block().setup();
    new SetDrumVolumeBlock().setup();
    new SetSynthVolumeBlock().setup();
    new SetNoteVolumeBlock().setup();
    new SetNoteVolume2Block().setup();
    new ArticulationBlock().setup();
    new DecrescendoBlock().setup();
    new CrescendoBlock().setup();
}
