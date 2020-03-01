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
            var oscillatorType = DEFAULTOSCILLATORTYPE;
            var partials = 0;

            if (args.length === 2 && typeof args[1] === "number") {
                for (var otype in OSCTYPES) {
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
            var synthVibratoRate;
            var synthVibratoAmount;
            if (logo.inTimbre) {
                if (logo.timbre.osc.length != 0) {
                    logo.errorMsg(
                        _("Unable to use synth due to existing oscillator")
                    );
                }

                logo.timbre.duoSynthParams = [];
            }

            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 10;
            } else {
                var arg0 = args[0];
            }

            if (args[1] === null || typeof args[1] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 50;
            } else {
                var arg1 = args[1];
            }

            synthVibratoRate = Math.abs(arg0);
            synthVibratoAmount = Math.abs(arg1) / 100;

            if (logo.inTimbre) {
                logo.timbre.duoSynthParamVals["vibratoRate"] = synthVibratoRate;
                logo.timbre.duoSynthParamVals[
                    "vibratoAmount"
                ] = synthVibratoAmount;
                logo.synth.createSynth(
                    turtle,
                    logo.timbre.instrumentName,
                    "duosynth",
                    logo.timbre.duoSynthParamVals
                );

                logo.timbre.duoSynthesizer.push(blk);
                logo.timbre.duoSynthParams.push(synthVibratoRate);
                logo.timbre.duoSynthParams.push(synthVibratoAmount);
            }
        }
    }

    class AMSynth extends FlowBlock {
        constructor() {
            //.TRANS: AM (amplitude modulation) synthesizer
            super("amsynth", _("AM synth"));
            this.setPalette("tone");
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
            var harmonicity;
            if (logo.inTimbre) {
                logo.timbre.AMSynthParams = [];
                if (logo.timbre.osc.length != 0) {
                    logo.errorMsg(
                        _("Unable to use synth due to existing oscillator")
                    );
                }
            }

            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 1;
            } else {
                var arg = args[0];
            }

            if (arg < 0) {
                logo.errorMsg(_("The input cannot be negative."));
                harmonicity = -arg;
            } else {
                harmonicity = arg;
            }

            if (logo.inTimbre) {
                logo.timbre.amSynthParamvals["harmonicity"] = harmonicity;
                logo.synth.createSynth(
                    turtle,
                    logo.timbre.instrumentName,
                    "amsynth",
                    logo.timbre.amSynthParamvals
                );

                logo.timbre.AMSynthesizer.push(blk);
                logo.timbre.AMSynthParams.push(harmonicity);
            }
        }
    }

    class FMSynth extends FlowBlock {
        constructor() {
            //.TRANS: FM (frequency modulation) synthesizer
            super("fmsynth", _("FM synth"));
            this.setPalette("tone");
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
            var modulationIndex;
            if (logo.inTimbre) {
                logo.timbre.FMSynthParams = [];
                if (logo.timbre.osc.length != 0) {
                    logo.errorMsg(
                        _("Unable to use synth due to existing oscillator")
                    );
                }
            }

            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 10;
            } else {
                var arg = args[0];
            }

            if (arg < 0) {
                logo.errorMsg(_("The input cannot be negative."));
                modulationIndex = -arg;
            } else {
                modulationIndex = arg;
            }

            if (logo.inTimbre) {
                logo.timbre.fmSynthParamvals[
                    "modulationIndex"
                ] = modulationIndex;
                logo.synth.createSynth(
                    turtle,
                    logo.timbre.instrumentName,
                    "fmsynth",
                    logo.timbre.fmSynthParamvals
                );

                logo.timbre.FMSynthesizer.push(blk);
                logo.timbre.FMSynthParams.push(modulationIndex);
            }
        }
    }

    class PartialBlock extends FlowBlock {
        constructor() {
            //.TRANS: partials are weighted components in a harmonic series
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

            if (logo.inHarmonic[turtle].length > 0) {
                var n = logo.inHarmonic[turtle].length - 1;
                logo.partials[turtle][n].push(args[0]);
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
            logo.inHarmonic[turtle].push(blk);
            logo.partials[turtle].push([]);

            var listenerName = "_harmonic_" + turtle + "_" + blk;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                logo.inHarmonic[turtle].pop();
                logo.partials[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class Harmonic2Block extends FlowClampBlock {
        constructor() {
            super("harmonic2");
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
            if (typeof args[0] !== "number" || args[0] < 0) {
                //.TRANS: partials components in a harmonic series
                logo.errorMsg(_("Partial must be greater than or equal to 0."));
                logo.stopTurtle = true;
                return;
            }

            logo.inHarmonic[turtle].push(blk);
            logo.partials[turtle].push([]);
            var n = logo.partials[turtle].length - 1;

            for (var i = 0; i < args[0]; i++) {
                logo.partials[turtle][n].push(0);
            }

            logo.partials[turtle][n].push(1);
            logo.notationBeginHarmonics(turtle);

            var listenerName = "_harmonic_" + turtle + "_" + blk;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                logo.inHarmonic[turtle].pop();
                logo.partials[turtle].pop();
                logo.notationEndHarmonics(turtle);
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class DisBlock extends FlowClampBlock {
        constructor() {
            super("dis");
            this.setPalette("tone");
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
            var distortion = args[0] / 100;
            if (distortion < 0 || distortion > 1) {
                logo.errorMsg(_("Distortion must be from 0 to 100."), blk);
                logo.stopTurtle = true;
            }

            logo.distortionAmount[turtle].push(distortion);

            var listenerName = "_distortion_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                logo.distortionAmount[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);

            if (logo.inTimbre) {
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "distortionActive"
                ] = true;
                logo.timbre.distortionEffect.push(blk);
                logo.timbre.distortionParams.push(
                    last(logo.distortionAmount[turtle]) * 100
                );
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "distortionAmount"
                ] = distortion;
            }

            return [args[1], 1];
        }
    }

    class TremoloBlock extends FlowClampBlock {
        constructor() {
            super("tremolo");
            this.setPalette("tone");
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
            var frequency = args[0];
            var depth = args[1] / 100;

            if (depth < 0 || depth > 1) {
                //.TRANS: Depth is the intesity of the tremolo effect.
                logo.errorMsg(_("Depth is out of range."), blk);
                logo.stopTurtle = true;
            }

            logo.tremoloFrequency[turtle].push(frequency);
            logo.tremoloDepth[turtle].push(depth);

            var listenerName = "_tremolo_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                logo.tremoloFrequency[turtle].pop();
                logo.tremoloDepth[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);
            if (logo.inTimbre) {
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "tremoloActive"
                ] = true;
                logo.timbre.tremoloEffect.push(blk);
                logo.timbre.tremoloParams.push(
                    last(logo.tremoloFrequency[turtle])
                );
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "tremoloFrequency"
                ] = frequency;
                logo.timbre.tremoloParams.push(
                    last(logo.tremoloDepth[turtle]) * 100
                );
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "tremoloDepth"
                ] = depth;
            }

            return [args[2], 1];
        }
    }

    class PhaserBlock extends FlowClampBlock {
        constructor() {
            super("phaser");
            this.setPalette("tone");
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
            var rate = args[0];
            var octaves = args[1];
            var baseFrequency = args[2];

            logo.rate[turtle].push(rate);
            logo.octaves[turtle].push(octaves);
            logo.baseFrequency[turtle].push(baseFrequency);

            var listenerName = "_phaser_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                logo.rate[turtle].pop();
                logo.octaves[turtle].pop();
                logo.baseFrequency[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);
            if (logo.inTimbre) {
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "phaserActive"
                ] = true;
                logo.timbre.phaserEffect.push(blk);
                logo.timbre.phaserParams.push(last(logo.rate[turtle]));
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "rate"
                ] = rate;
                logo.timbre.phaserParams.push(last(logo.octaves[turtle]));
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "octaves"
                ] = octaves;
                logo.timbre.phaserParams.push(last(logo.baseFrequency[turtle]));
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "baseFrequency"
                ] = baseFrequency;
            }

            return [args[3], 1];
        }
    }

    class ChorusBlock extends FlowClampBlock {
        constructor() {
            super("chorus");
            this.setPalette("tone");
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
            var chorusRate = args[0];
            var delayTime = args[1];
            var chorusDepth = args[2] / 100;

            if (chorusDepth < 0 || chorusDepth > 1) {
                //.TRANS: Depth is the intesity of the chorus effect.
                logo.errorMsg(_("Depth is out of range."), blk);
                logo.stopTurtle = true;
            }

            logo.chorusRate[turtle].push(chorusRate);
            logo.delayTime[turtle].push(delayTime);
            logo.chorusDepth[turtle].push(chorusDepth);

            var listenerName = "_chorus_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                logo.chorusRate[turtle].pop();
                logo.delayTime[turtle].pop();
                logo.chorusDepth[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);

            if (logo.inTimbre) {
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "chorusActive"
                ] = true;
                logo.timbre.chorusEffect.push(blk);
                logo.timbre.chorusParams.push(last(logo.chorusRate[turtle]));
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "chorusRate"
                ] = chorusRate;
                logo.timbre.chorusParams.push(last(logo.delayTime[turtle]));
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "delayTime"
                ] = delayTime;
                logo.timbre.chorusParams.push(
                    last(logo.chorusDepth[turtle]) * 100
                );
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "chorusDepth"
                ] = chorusDepth;
            }

            return [args[3], 1];
        }
    }

    class VibratoBlock extends FlowClampBlock {
        constructor() {
            super("vibrato");
            this.setPalette("tone");
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

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            var intensity = args[0];
            var rate = args[1];

            if (intensity < 1 || intensity > 100) {
                logo.errorMsg(
                    _("Vibrato intensity must be between 1 and 100."),
                    blk
                );
                logo.stopTurtle = true;
            }

            if (rate <= 0) {
                logo.errorMsg(_("Vibrato rate must be greater than 0."), blk);
                logo.stopTurtle = true;
            }

            logo.vibratoIntensity[turtle].push(intensity / 100);
            logo.vibratoRate[turtle].push(1 / rate);

            var listenerName = "_vibrato_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                logo.vibratoIntensity[turtle].pop();
                logo.vibratoRate[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);

            if (logo.inTimbre) {
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "vibratoActive"
                ] = true;
                logo.timbre.vibratoEffect.push(blk);
                logo.timbre.vibratoParams.push(
                    last(logo.vibratoIntensity[turtle]) * 100
                );
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "vibratoIntensity"
                ] = logo.vibratoIntensity[turtle];
                logo.timbre.vibratoParams.push(last(logo.vibratoRate[turtle]));
                instrumentsEffects[turtle][logo.timbre.instrumentName][
                    "vibratoFrequency"
                ] = rate;
            }

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
            var voicename = null;
            for (var voice in VOICENAMES) {
                if (VOICENAMES[voice][0] === args[0]) {
                    voicename = VOICENAMES[voice][1];
                } else if (VOICENAMES[voice][1] === args[0]) {
                    voicename = args[0];
                }
            }

            // Maybe it is a drum?
            if (voicename == null) {
                for (var drum in DRUMNAMES) {
                    if (DRUMNAMES[drum][0] === args[0]) {
                        voicename = DRUMNAMES[drum][1];
                    } else if (DRUMNAMES[drum][1] === args[0]) {
                        voicename = args[0];
                    }
                }
            }

            if (voicename == null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
            } else {
                logo.voices[turtle].push(voicename);
                var listenerName = "_setvoice_" + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function(event) {
                    logo.voices[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
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
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "synthname"]);
            } else {
                return last(logo.instrumentNames[turtle]);
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
                logo.inSetTimbre[turtle] = true;

                var synth = args[0];
                for (var voice in VOICENAMES) {
                    if (VOICENAMES[voice][0] === args[0]) {
                        synth = VOICENAMES[voice][1];
                        break;
                    } else if (VOICENAMES[voice][1] === args[0]) {
                        synth = args[0];
                        break;
                    }
                }

                if (logo.inMatrix) {
                    logo.pitchTimeMatrix._instrumentName = synth;
                }

                if (logo.instrumentNames[turtle].indexOf(synth) === -1) {
                    // console.debug('pushing ' + synth + ' to instrumentNames');
                    logo.instrumentNames[turtle].push(synth);
                    logo.synth.loadSynth(turtle, synth);

                    if (logo.synthVolume[turtle][synth] == undefined) {
                        logo.synthVolume[turtle][synth] = [DEFAULTVOLUME];
                        logo.crescendoInitialVolume[turtle][synth] = [
                            DEFAULTVOLUME
                        ];
                    }
                }

                var listenerName = "_settimbre_" + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function(event) {
                    logo.inSetTimbre[turtle] = false;
                    // console.debug('popping ' + logo.instrumentNames[turtle].pop() + ' from instrumentNames');
                    logo.instrumentNames[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);

                if (logo.inRhythmRuler) {
                    logo._currentDrumBlock = blk;
                    logo.rhythmRuler.Drums.push(blk);
                    logo.rhythmRuler.Rulers.push([[], []]);
                }
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
