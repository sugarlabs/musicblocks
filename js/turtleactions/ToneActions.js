/**
 * @file This contains the action methods of the Turtle's Singer component's Tone blocks.
 * @author Anindya Kundu
 * @author Walter Bender
 *
 * @copyright 2014-2020 Walter Bender
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global

   _, Singer, VOICENAMES, MusicBlocks, Mouse, last, instrumentsEffects,
   NOINPUTERRORMSG, CUSTOMSAMPLES, DEFAULTVOICE
*/

/*
   Global Locations
    js/utils/utils.js
        _, last
    js/turtle-singer.js
        Singer
    js/utils/synthutils.js
        VOICENAMES, instrumentsEffects
    js/logo.js
        NOINPUTERRORMSG
    js/js-export/export.js
        MusicBlocks, Mouse
*/

/* exported setupToneActions */

/**
 * Sets up all the methods related to different actions for each block in Tone palette.
 * @returns {void}
 */
function setupToneActions(activity) {
    Singer.ToneActions = class {
        /**
         * Selects a voice for the synthesizer.
         *
         * @param {String} instrument - timbre name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block object in blocks.blockList
         */
        static setTimbre(instrument, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            tur.inSetTimbre = true;

            let accounted = false;
            let synth = instrument;
            for (const voice in VOICENAMES) {
                if (VOICENAMES[voice][0] === instrument) {
                    synth = VOICENAMES[voice][1];
                    accounted = true;
                    break;
                } else if (VOICENAMES[voice][1] === instrument) {
                    synth = instrument;
                    accounted = true;
                    break;
                }
            }

            if (!accounted && typeof instrument === "object") {
                if (instrument[0] != "") {
                    synth = "customsample_" + instrument[0];
                    CUSTOMSAMPLES[synth] = [instrument[1], instrument[2], instrument[3]];
                } else {
                    synth = DEFAULTVOICE;
                }
            }

            if (synth === undefined || synth === null) {
                synth = DEFAULTVOICE;
            }

            if (activity.logo.inMatrix) {
                activity.logo.phraseMaker._instrumentName = synth;
            }

            if (tur.singer.instrumentNames.indexOf(synth) === -1) {
                tur.singer.instrumentNames.push(synth);
                activity.logo.synth.loadSynth(turtle, synth);

                if (tur.singer.synthVolume[synth] === undefined) {
                    // The electronic synthvolume will track any
                    // changes to the master volume, e.g., the
                    // articulation block.
                    tur.singer.synthVolume[synth] = [
                        last(tur.singer.synthVolume[DEFAULTVOICE])
                    ];
                    tur.singer.crescendoInitialVolume[synth] = [
                        last(tur.singer.synthVolume[DEFAULTVOICE])
                    ];
                }
            }

            const listenerName = "_settimbre_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.inSetTimbre = false;
                tur.singer.instrumentNames.pop();
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Adds a rapid, slight variation in pitch.
         *
         * @param {Number} intensity
         * @param {Number} rate
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block object in blocks.blockList
         */
        static doVibrato(intensity, rate, turtle, blk) {
            if (intensity < 1 || intensity > 100) {
                activity.errorMsg(_("Vibrato intensity must be between 1 and 100."), blk);
                activity.logo.stopTurtle = true;
            }

            if (rate <= 0) {
                activity.errorMsg(_("Vibrato rate must be greater than 0."), blk);
                activity.logo.stopTurtle = true;
            }

            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.vibratoIntensity.push(intensity / 100);
            tur.singer.vibratoRate.push(1 / rate);

            const listenerName = "_vibrato_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.vibratoIntensity.pop();
                tur.singer.vibratoRate.pop();
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);

            if (activity.logo.inTimbre) {
                instrumentsEffects[turtle][activity.logo.timbre.instrumentName][
                    "vibratoActive"
                ] = true;
                activity.logo.timbre.vibratoEffect.push(blk);
                activity.logo.timbre.vibratoParams.push(last(tur.singer.vibratoIntensity) * 100);
                instrumentsEffects[turtle][activity.logo.timbre.instrumentName][
                    "vibratoIntensity"
                ] = tur.singer.vibratoIntensity;
                activity.logo.timbre.vibratoParams.push(last(tur.singer.vibratoRate));
                instrumentsEffects[turtle][activity.logo.timbre.instrumentName][
                    "vibratoFrequency"
                ] = rate;
            }
        }

        /**
         * Adds a chorus effect.
         *
         * @param {Number} chorusRate
         * @param {Number} delayTime
         * @param {Number} chorusDepth
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block object in blocks.blockList
         */
        static doChorus(chorusRate, delayTime, chorusDepth, turtle, blk) {
            chorusDepth /= 100;

            if (chorusDepth < 0 || chorusDepth > 1) {
                activity.errorMsg(_("Depth is out of range."), blk);
                activity.logo.stopTurtle = true;
            }

            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.chorusRate.push(chorusRate);
            tur.singer.delayTime.push(delayTime);
            tur.singer.chorusDepth.push(chorusDepth);

            const listenerName = "_chorus_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.chorusRate.pop();
                tur.singer.delayTime.pop();
                tur.singer.chorusDepth.pop();
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Adds a sweeping sound.
         *
         * @param {Number} rate
         * @param {Number} octaves
         * @param {Number} baseFrequency
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block object in blocks.blockList
         */
        static doPhaser(rate, octaves, baseFrequency, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.rate.push(rate);
            tur.singer.octaves.push(octaves);
            tur.singer.baseFrequency.push(baseFrequency);

            const listenerName = "_phaser_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.rate.pop();
                tur.singer.octaves.pop();
                tur.singer.baseFrequency.pop();
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Adds a wavering effect.
         *
         * @param {Number} frequency
         * @param {Number} depth
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block object in blocks.blockList
         */
        static doTremolo(frequency, depth, turtle, blk) {
            depth /= 100;

            if (depth < 0 || depth > 1) {
                //.TRANS: Depth is the intesity of the tremolo or chorus effect.
                activity.errorMsg(_("Depth is out of range."), blk);
                activity.logo.stopTurtle = true;
            }

            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.tremoloFrequency.push(frequency);
            tur.singer.tremoloDepth.push(depth);

            const listenerName = "_tremolo_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.tremoloFrequency.pop();
                tur.singer.tremoloDepth.pop();
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Adds distortion to the pitches.
         *
         * @param {Number} distortion
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block index in blocks.blockList
         */
        static doDistortion(distortion, turtle, blk) {
            distortion /= 100;

            if (distortion < 0 || distortion > 1) {
                activity.errorMsg(_("Distortion must be from 0 to 100."), blk);
                activity.logo.stopTurtle = true;
            }

            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.distortionAmount.push(distortion);

            const listenerName = "_distortion_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            activity.logo.setTurtleListener(turtle, listenerName, () =>
                tur.singer.distortionAmount.pop()
            );
        }

        /**
         * Adds harmonic to the contained notes.
         *
         * @param {Number} harmonic
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block index in blocks.blockList
         */
        static doHarmonic(harmonic, turtle, blk) {
            if (typeof harmonic !== "number" || harmonic < 0) {
                //.TRANS: partials components in a harmonic series
                activity.errorMsg(_("Partial must be greater than or equal to 0."));
                activity.logo.stopTurtle = true;
                return;
            }

            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.inHarmonic.push(blk);
            tur.singer.partials.push([]);
            const n = tur.singer.partials.length - 1;

            for (let i = 0; i < harmonic; i++) {
                tur.singer.partials[n].push(0);
            }

            tur.singer.partials[n].push(1);
            activity.logo.notation.notationBeginHarmonics(turtle);

            const listenerName = "_harmonic_" + turtle + "_" + blk;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.inHarmonic.pop();
                tur.singer.partials.pop();
                activity.logo.notation.notationEndHarmonics(turtle);
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Frequency Modulator used to define a timbre.
         *
         * @param {Number} modulationIndex
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block index in blocks.blockList
         */
        static defFMSynth(modulationIndex, turtle, blk) {
            if (activity.logo.inTimbre) {
                activity.logo.timbre.FMSynthParams = [];
                if (activity.logo.timbre.osc.length != 0) {
                    activity.errorMsg(_("Unable to use synth due to existing oscillator"));
                }
            }

            if (modulationIndex === null || typeof modulationIndex !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                modulationIndex = 10;
            }

            if (modulationIndex < 0) {
                activity.errorMsg(_("The input cannot be negative."));
                modulationIndex = -modulationIndex;
            }

            if (activity.logo.inTimbre) {
                activity.logo.timbre.fmSynthParamvals["modulationIndex"] = modulationIndex;
                activity.logo.synth.createSynth(
                    turtle,
                    activity.logo.timbre.instrumentName,
                    "fmsynth",
                    activity.logo.timbre.fmSynthParamvals
                );

                activity.logo.timbre.FMSynthesizer.push(blk);
                activity.logo.timbre.FMSynthParams.push(modulationIndex);
            }
        }

        /**
         * Amplitude Modulator used to define a timbre.
         *
         * @param {Number} harmonicity
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block index in blocks.blockList
         */
        static defAMSynth(harmonicity, turtle, blk) {
            if (activity.logo.inTimbre) {
                activity.logo.timbre.AMSynthParams = [];
                if (activity.logo.timbre.osc.length != 0) {
                    activity.errorMsg(_("Unable to use synth due to existing oscillator"));
                }
            }

            if (harmonicity === null || typeof harmonicity !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                harmonicity = 1;
            }

            if (harmonicity < 0) {
                activity.errorMsg(_("The input cannot be negative."));
                harmonicity = -harmonicity;
            }

            if (activity.logo.inTimbre) {
                activity.logo.timbre.amSynthParamvals["harmonicity"] = harmonicity;
                activity.logo.synth.createSynth(
                    turtle,
                    activity.logo.timbre.instrumentName,
                    "amsynth",
                    activity.logo.timbre.amSynthParamvals
                );

                activity.logo.timbre.AMSynthesizer.push(blk);
                activity.logo.timbre.AMSynthParams.push(harmonicity);
            }
        }

        /**
         * Duo-frequency Modulator used to define a timbre.
         *
         * @param {Number} synthVibratoRate
         * @param {Number} synthVibratoAmount
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block index in blocks.blockList
         */
        static defDuoSynth(synthVibratoRate, synthVibratoAmount, turtle, blk) {
            if (activity.logo.inTimbre) {
                if (activity.logo.timbre.osc.length != 0) {
                    activity.errorMsg(_("Unable to use synth due to existing oscillator"));
                }
                activity.logo.timbre.duoSynthParams = [];
            }

            if (synthVibratoRate === null || typeof synthVibratoRate !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                synthVibratoRate = 10;
            }

            if (synthVibratoAmount === null || typeof synthVibratoAmount !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                synthVibratoAmount = 50;
            }

            synthVibratoRate = Math.abs(synthVibratoRate);
            synthVibratoAmount = Math.abs(synthVibratoAmount) / 100;

            if (activity.logo.inTimbre) {
                activity.logo.timbre.duoSynthParamVals["vibratoRate"] = synthVibratoRate;
                activity.logo.timbre.duoSynthParamVals["vibratoAmount"] = synthVibratoAmount;
                activity.logo.synth.createSynth(
                    turtle,
                    activity.logo.timbre.instrumentName,
                    "duosynth",
                    activity.logo.timbre.duoSynthParamVals
                );

                activity.logo.timbre.duoSynthesizer.push(blk);
                activity.logo.timbre.duoSynthParams.push(synthVibratoRate);
                activity.logo.timbre.duoSynthParams.push(synthVibratoAmount);
            }
        }
    };
}
