function setupToneBlocks() {
    class OscillatorBlock extends FlowBlock {
        constructor() {
            super("oscillator", _("oscillator"));
            this.setPalette("tone");
            this.setHelpString();
            this.formBlock({
                args: 2,
                defaults: [_("triangle"), 6],
                argLabels: [
                    //.TRANS: there are different types (sine, triangle, square...) of oscillators.
                    _("type"),
                    //.TRANS: Partials refers to the number of sine waves combined into the sound.
                    _("partials")
                ],
                argTypes: ["anyin", "numberin"]
            });
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            let oscillatorType = DEFAULTOSCILLATORTYPE;
            let partials = 0;

            if (args.length === 2 && typeof args[1] === "number") {
                for (let otype in OSCTYPES) {
                    if (OSCTYPES[otype][0] === args[0]) {
                        oscillatorType = OSCTYPES[otype][1];
                    } else if (OSCTYPES[otype][1] === args[0]) {
                        oscillatorType = args[0];
                    }
                }

                partials = args[1];
            }

            if (logo.inTimbre) {
                if (logo.timbre.osc.length != 0) {
                    logo.errorMsg(
                        _("You are adding multiple oscillator blocks.")
                    );
                } else {
                    logo.timbre.oscParams = [];
                    logo.synth.createSynth(
                        turtle,
                        logo.timbre.instrumentName,
                        oscillatorType,
                        logo.timbre.synthVals
                    );
                }

                logo.timbre.osc.push(blk);
                logo.timbre.oscParams.push(oscillatorType);
                logo.timbre.oscParams.push(partials);
            }
        }
    }

    class FillerTypeBlock extends ValueBlock {
        constructor() {
            super("filtertype");
            this.setPalette("tone");
            this.setHelpString();
            this.formBlock({ outType: "textout" });
            this.hidden = true;
        }
    }

    class OscillatorTypeBlock extends ValueBlock {
        constructor() {
            super("oscillatortype");
            this.setPalette("tone");
            this.setHelpString();
            this.formBlock({ outType: "textout" });
            this.hidden = true;
        }
    }

    class DuoSynthBlock extends FlowBlock {
        constructor() {
            //.TRANS: a duo synthesizer combines a synth with a sequencer
            super("duosynth", _("duo synth"));
            this.setPalette("tone");
            this.piemenuValuesC1 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            this.piemenuValuesC2 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            this.setHelpString([
                _(
                    "The Duo synth block is a duo-frequency modulator used to define a timbre."
                ),
                "documentation",
                null,
                "duosynthhelp"
            ]);
            this.formBlock({
                args: 2,
                defaults: [10, 5],
                argLabels: [_("vibrato rate"), _("vibrato intensity")]
            });
        }

        flow(args, logo, turtle, blk) {
            Singer.ToneActions.defDuoSynth(args[0], args[1], turtle, blk);
        }
    }

    class AMSynth extends FlowBlock {
        constructor() {
            //.TRANS: AM (amplitude modulation) synthesizer
            super("amsynth", _("AM synth"));
            this.setPalette("tone");
            this.piemenuValuesC1 = [1, 2];
            this.setHelpString([
                _(
                    "The AM synth block is an amplitude modulator used to define a timbre."
                ),
                "documentation",
                null,
                "amsynthhelp"
            ]);
            this.formBlock({
                args: 1,
                defaults: [1]
            });
        }

        flow(args, logo, turtle, blk) {
            Singer.ToneActions.defAMSynth(args[0], turtle, blk);
        }
    }

    class FMSynth extends FlowBlock {
        constructor() {
            //.TRANS: FM (frequency modulation) synthesizer
            super("fmsynth", _("FM synth"));
            this.setPalette("tone");
            this.piemenuValuesC1 = [1, 5, 10, 15, 20, 25];
            this.setHelpString([
                _(
                    "The FM synth block is a frequency modulator used to define a timbre."
                ),
                "documentation",
                null,
                "fmsynthhelp"
            ]);
            this.formBlock({
                args: 1,
                defaults: [10]
            });
        }

        flow(args, logo, turtle, blk) {
            Singer.ToneActions.defFMSynth(args[0], turtle, blk);
        }
    }

    class PartialBlock extends FlowBlock {
        constructor() {
            super("partial", _("partial"));
            this.setPalette("tone");
            this.setHelpString([
                _(
                    "The Partial block is used to specify a weight for a specific partical harmonic."
                ),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 1,
                defaults: [10]
            });
        }

        flow(args, logo, turtle) {
            if (typeof args[0] !== "number" || args[0] > 1 || args[0] < 0) {
                //.TRANS: partials are weighted components in a harmonic series
                logo.errorMsg(_("Partial weight must be between 0 and 1."));
                logo.stopTurtle = true;
                return;
            }

            let tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.inHarmonic.length > 0) {
                let n = tur.singer.inHarmonic.length - 1;
                tur.singer.partials[n].push(args[0]);
            } else {
                //.TRANS: partials are weighted components in a harmonic series
                logo.errorMsg(
                    _(
                        "Partial block should be used inside of a Weighted-partials block."
                    )
                );
            }
        }
    }

    class HarmonicBlock extends FlowClampBlock {
        constructor() {
            super("harmonic");
            this.setPalette("tone");
            this.setHelpString([
                _(
                    "The Weighted partials block is used to specify the partials associated with a timbre."
                ),
                "documentation",
                ""
            ]);
            this.formBlock({
                //.TRANS: partials are weighted components in a harmonic series
                name: _("weighted partials")
            });
            this.makeMacro((x, y) => [
                [0, "harmonic", x, y, [null, 2, 1]],
                [1, "hidden", 0, 0, [0, null]],
                [2, "partial", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, "partial", 0, 0, [2, 5, 6]],
                [5, ["number", { value: 0.2 }], 0, 0, [4]],
                [6, "partial", 0, 0, [4, 7, null]],
                [7, ["number", { value: 0.01 }], 0, 0, [6]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.inHarmonic.push(blk);
            tur.singer.partials.push([]);

            let listenerName = "_harmonic_" + turtle + "_" + blk;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                tur.singer.inHarmonic.pop();
                tur.singer.partials.pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class Harmonic2Block extends FlowClampBlock {
        constructor() {
            super("harmonic2");
            this.piemenuValuesC1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            this.setPalette("tone");
            this.setHelpString([
                _(
                    "The Harmonic block will add harmonics to the contained notes."
                ),
                "documentation",
                null,
                "harmonichelp"
            ]);
            this.formBlock({
                //.TRANS: A harmonic is a overtone.
                name: _("harmonic"),
                args: 1,
                defaults: [1]
            });
            this.makeMacro((x, y) => [
                [0, "harmonic2", x, y, [null, 2, null, 1]],
                [1, "hidden", 0, 0, [0, null]],
                [2, ["number", { value: 1 }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            Singer.ToneActions.doHarmonic(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    class DisBlock extends FlowClampBlock {
        constructor() {
            super("dis");
            this.setPalette("tone");
            this.piemenuValuesC1 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            this.setHelpString([
                _("The Distortion block adds distortion to the pitch."),
                "documentation",
                null,
                "dishelp"
            ]);
            this.formBlock({
                //.TRANS: distortion is an alteration in the sound
                name: _("distortion"),
                args: 1,
                defaults: [40]
            });
        }

        flow(args, logo, turtle, blk) {
            Singer.ToneActions.doDistortion(args[0], turtle, blk);

            if (logo.inTimbre) {
                instrumentsEffects[turtle][logo.timbre.instrumentName]["distortionActive"] = true;
                logo.timbre.distortionEffect.push(blk);
                logo.timbre.distortionParams.push(last(tur.singer.distortionAmount) * 100);
                instrumentsEffects[turtle][logo.timbre.instrumentName]["distortionAmount"] =
                    distortion;
            }

            return [args[1], 1];
        }
    }

    class TremoloBlock extends FlowClampBlock {
        constructor() {
            super("tremolo");
            this.setPalette("tone");
            this.piemenuValuesC1 = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 10, 20];
            this.piemenuValuesC2 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Tremolo block adds a wavering effect."),
                "documentation",
                null,
                "tremolohelp"
            ]);

            this.formBlock({
                //.TRANS: a wavering effect in a musical tone
                name: _("tremolo"),
                args: 2,
                defaults: [10, 50],
                argLabels: [
                    //.TRANS: rate at which tremolo wavers
                    _("rate"),
                    //.TRANS: amplitude of tremolo waver
                    _("depth")
                ]
            });
            this.formBlock((x, y) => [
                [0, "tremolo", 0, 0, [null, 1, 2, null, 3]],
                [1, ["number", { value: 10 }], 0, 0, [0]],
                [2, ["number", { value: 50 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            Singer.ToneActions.doTremolo(args[0], args[1], turtle, blk);

            if (logo.inTimbre) {
                instrumentsEffects[turtle][logo.timbre.instrumentName]["tremoloActive"] = true;
                logo.timbre.tremoloEffect.push(blk);
                logo.timbre.tremoloParams.push(last(tur.singer.tremoloFrequency));
                instrumentsEffects[turtle][logo.timbre.instrumentName]["tremoloFrequency"] =
                    frequency;
                logo.timbre.tremoloParams.push(last(tur.singer.tremoloDepth) * 100);
                instrumentsEffects[turtle][logo.timbre.instrumentName]["tremoloDepth"] = depth;
            }

            return [args[2], 1];
        }
    }

    class PhaserBlock extends FlowClampBlock {
        constructor() {
            super("phaser");
            this.setPalette("tone");
            this.piemenuValuesC1 = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5,
                                    10, 20];
            this.piemenuValuesC2 = [1, 2, 3];
            this.piemenuValuesC3 = [220, 247, 262, 294, 330, 349, 392, 440,
                                    494, 523, 587, 659, 698, 783, 880];
            this.setHelpString([
                _("The Phaser block adds a sweeping sound."),
                "documentation",
                null,
                "phaserhelp"
            ]);
            this.formBlock({
                //.TRANS: alter the phase of the sound
                name: _("phaser"),
                args: 3,
                defaults: [0.5, 3, 392],
                argLabels: [_("rate"), _("octaves"), _("base frequency")]
            });
        }

        flow(args, logo, turtle, blk) {
            Singer.ToneActions.doPhaser(args[0], args[1], args[2], turtle, blk);

            if (logo.inTimbre) {
                instrumentsEffects[turtle][logo.timbre.instrumentName]["phaserActive"] = true;
                logo.timbre.phaserEffect.push(blk);
                logo.timbre.phaserParams.push(last(tur.singer.rate));
                instrumentsEffects[turtle][logo.timbre.instrumentName]["rate"] = rate;
                logo.timbre.phaserParams.push(last(tur.singer.octaves));
                instrumentsEffects[turtle][logo.timbre.instrumentName]["octaves"] = octaves;
                logo.timbre.phaserParams.push(last(tur.signer.baseFrequency));
                instrumentsEffects[turtle][logo.timbre.instrumentName]["baseFrequency"] =
                    baseFrequency;
            }

            return [args[3], 1];
        }
    }

    class ChorusBlock extends FlowClampBlock {
        constructor() {
            super("chorus");
            this.setPalette("tone");
            this.piemenuValuesC1 = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
            this.piemenuValuesC2 = [2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10];
            this.piemenuValuesC3 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Chorus block adds a chorus effect."),
                "documentation",
                null,
                "chorushelp"
            ]);

            this.formBlock({
                //.TRANS: musical effect to simulate a choral sound
                name: _("chorus"),
                args: 3,
                defaults: [1.5, 3.5, 70],
                argLabels: [_("rate"), _("delay") + " (MS)", _("depth")]
            });
        }

        flow(args, logo, turtle, blk) {
            Singer.ToneActions.doChorus(args[0], args[1], args[2], turtle, blk);

            if (logo.inTimbre) {
                instrumentsEffects[turtle][logo.timbre.instrumentName]["chorusActive"] = true;
                logo.timbre.chorusEffect.push(blk);
                logo.timbre.chorusParams.push(last(tur.singer.chorusRate));
                instrumentsEffects[turtle][logo.timbre.instrumentName]["chorusRate"] = chorusRate;
                logo.timbre.chorusParams.push(last(tur.singer.delayTime));
                instrumentsEffects[turtle][logo.timbre.instrumentName]["delayTime"] = delayTime;
                logo.timbre.chorusParams.push(last(tur.singer.chorusDepth) * 100);
                instrumentsEffects[turtle][logo.timbre.instrumentName]["chorusDepth"] = chorusDepth;
            }

            return [args[3], 1];
        }
    }

    class VibratoBlock extends FlowClampBlock {
        constructor() {
            super("vibrato");
            this.setPalette("tone");
            this.piemenuValuesC1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Vibrato block adds a rapid, slight variation in pitch."),
                "documentation",
                null,
                "vibratohelp"
            ]);

            this.formBlock({
                //.TRANS: a rapid, slight variation in pitch
                name: _("vibrato"),
                args: 2,
                defaults: [5, 1 / 16],
                argLabels: [_("intensity"), _("rate")]
            });
            this.makeMacro((x, y) => [
                [0, "vibrato", x, y, [null, 1, 3, 2, 6]],
                [1, ["number", { value: 5 }], 0, 0, [0]],
                [2, "vspace", 0, 0, [0, null]],
                [3, "divide", 0, 0, [0, 4, 5]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, ["number", { value: 16 }], 0, 0, [3]],
                [6, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            Singer.ToneActions.doVibrato(args[0], args[1], turtle, blk);

            return [args[2], 1];
        }
    }

    class SetVoiceBlock extends FlowClampBlock {
        constructor() {
            super("setvoice");
            this.setPalette("tone");
            this.setHelpString();
            this.formBlock({
                //.TRANS: select synthesizer
                name: _("set synth"),
                args: 1,
                argTypes: ["textin"],
                defaults: ["violin"]
            });
            this.makeMacro((x, y) => [
                [0, "setvoice", x, y, [null, 1, null, 2]],
                [1, ["voicename", { value: "violin" }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            let voicename = null;
            for (let voice in VOICENAMES) {
                if (VOICENAMES[voice][0] === args[0]) {
                    voicename = VOICENAMES[voice][1];
                } else if (VOICENAMES[voice][1] === args[0]) {
                    voicename = args[0];
                }
            }

            // Maybe it is a drum?
            if (voicename === null) {
                for (let drum in DRUMNAMES) {
                    if (DRUMNAMES[drum][0] === args[0]) {
                        voicename = DRUMNAMES[drum][1];
                    } else if (DRUMNAMES[drum][1] === args[0]) {
                        voicename = args[0];
                    }
                }
            }

            let tur = logo.turtles.ithTurtle(turtle);

            if (voicename === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
            } else {
                tur.singer.voices.push(voicename);
                let listenerName = "_setvoice_" + turtle;
                logo.setDispatchBlock(blk, turtle, listenerName);

                let __listener = event => tur.singer.voices.pop();

                logo.setTurtleListener(turtle, listenerName, __listener);
            }

            return [args[1], 1];
        }
    }

    class SynthNameBlock extends ValueBlock {
        constructor() {
            super("synthname", _("synth name"));
            this.setPalette("tone");
            this.setHelpString();
            this.formBlock({ outType: "textout" });
            this.hidden = this.deprecated = true;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "synthname"]);
            } else {
                return last(logo.turtles.ithTurtle(turtle).singer.instrumentNames);
            }
        }
    }

    class VoiceNameBlock extends ValueBlock {
        constructor() {
            super("voicename");
            this.setPalette("tone");
            this.setHelpString([
                _(
                    "The Set instrument block selects a voice for the synthesizer,"
                ) +
                    " " +
                    _("eg guitar piano violin or cello."),
                "documentation",
                ""
            ]);
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
        }
    }

    class SetTimbreBlock extends FlowClampBlock {
        constructor() {
            super("settimbre");
            this.setPalette("tone");
            this.beginnerBlock(true);

            if (beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _(
                        "The Set instrument block selects a voice for the synthesizer,"
                    ),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Set instrument block selects a voice for the synthesizer,"
                    ) +
                        " " +
                        _("eg guitar piano violin or cello."),
                    "documentation",
                    null,
                    "settimbrehelp"
                ]);
            }

            this.formBlock({
                //.TRANS: set the characteristics of a custom instrument
                name: _("set instrument"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("custom")]
            });
            this.makeMacro((x, y) => [
                [0, "settimbre", x, y, [null, 1, null, 2]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
            } else {
                if (logo.inRhythmRuler) {
                    logo._currentDrumBlock = blk;
                    logo.rhythmRuler.Drums.push(blk);
                    logo.rhythmRuler.Rulers.push([[], []]);
                }

                Singer.ToneActions.setTimbre(args[0], turtle, blk);
            }

            return [args[1], 1];
        }
    }

    new OscillatorBlock().setup();
    new FillerTypeBlock().setup();
    new OscillatorTypeBlock().setup();
    new DuoSynthBlock().setup();
    new AMSynth().setup();
    new FMSynth().setup();
    new PartialBlock().setup();
    new HarmonicBlock().setup();
    new Harmonic2Block().setup();
    new DisBlock().setup();
    new TremoloBlock().setup();
    new PhaserBlock().setup();
    new ChorusBlock().setup();
    new VibratoBlock().setup();
    new SetVoiceBlock().setup();
    new SynthNameBlock().setup();
    new VoiceNameBlock().setup();
    new SetTimbreBlock().setup();
}
