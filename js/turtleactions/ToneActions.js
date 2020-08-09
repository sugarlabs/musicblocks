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

/**
 * Sets up all the methods related to different actions for each block in Tone palette.
 *
 * @returns {void}
 */
function setupToneActions() {
    Singer.ToneActions = class {
        /**
         * Selects a voice for the synthesizer.
         *
         * @param {String} instrument - timbre name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block object in blocks.blockList
         */
        static setTimbre(instrument, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.inSetTimbre = true;

            let synth = instrument;
            for (let voice in VOICENAMES) {
                if (VOICENAMES[voice][0] === instrument) {
                    synth = VOICENAMES[voice][1];
                    break;
                } else if (VOICENAMES[voice][1] === instrument) {
                    synth = instrument;
                    break;
                }
            }

            if (logo.inMatrix) {
                logo.pitchTimeMatrix._instrumentName = synth;
            }

            if (tur.singer.instrumentNames.indexOf(synth) === -1) {
                tur.singer.instrumentNames.push(synth);
                logo.synth.loadSynth(turtle, synth);

                if (tur.singer.synthVolume[synth] === undefined) {
                    tur.singer.synthVolume[synth] = [last(Singer.masterVolume)];
                    tur.singer.crescendoInitialVolume[synth] = [last(Singer.masterVolume)];
                }
            }

            let listenerName = "_settimbre_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                tur.inSetTimbre = false;
                tur.singer.instrumentNames.pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
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
                logo.errorMsg(_("Vibrato intensity must be between 1 and 100."), blk);
                logo.stopTurtle = true;
            }

            if (rate <= 0) {
                logo.errorMsg(_("Vibrato rate must be greater than 0."), blk);
                logo.stopTurtle = true;
            }

            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.vibratoIntensity.push(intensity / 100);
            tur.singer.vibratoRate.push(1 / rate);

            let listenerName = "_vibrato_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                tur.singer.vibratoIntensity.pop();
                tur.singer.vibratoRate.pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (logo.inTimbre) {
                instrumentsEffects[turtle][logo.timbre.instrumentName]["vibratoActive"] = true;
                logo.timbre.vibratoEffect.push(blk);
                logo.timbre.vibratoParams.push(last(tur.singer.vibratoIntensity) * 100);
                instrumentsEffects[turtle][logo.timbre.instrumentName]["vibratoIntensity"] =
                    tur.singer.vibratoIntensity;
                logo.timbre.vibratoParams.push(last(tur.singer.vibratoRate));
                instrumentsEffects[turtle][logo.timbre.instrumentName]["vibratoFrequency"] = rate;
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
                logo.errorMsg(_("Depth is out of range."), blk);
                logo.stopTurtle = true;
            }

            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.chorusRate.push(chorusRate);
            tur.singer.delayTime.push(delayTime);
            tur.singer.chorusDepth.push(chorusDepth);

            let listenerName = "_chorus_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                tur.singer.chorusRate.pop();
                tur.singer.delayTime.pop();
                tur.singer.chorusDepth.pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
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
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.rate.push(rate);
            tur.singer.octaves.push(octaves);
            tur.singer.baseFrequency.push(baseFrequency);

            let listenerName = "_phaser_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                tur.singer.rate.pop();
                tur.singer.octaves.pop();
                tur.singer.baseFrequency.pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
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
                logo.errorMsg(_("Depth is out of range."), blk);
                logo.stopTurtle = true;
            }

            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.tremoloFrequency.push(frequency);
            tur.singer.tremoloDepth.push(depth);

            let listenerName = "_tremolo_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                tur.singer.tremoloFrequency.pop();
                tur.singer.tremoloDepth.pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
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
                logo.errorMsg(_("Distortion must be from 0 to 100."), blk);
                logo.stopTurtle = true;
            }

            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.distortionAmount.push(distortion);

            let listenerName = "_distortion_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            logo.setTurtleListener(
                turtle, listenerName, event => tur.singer.distortionAmount.pop()
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
                logo.errorMsg(_("Partial must be greater than or equal to 0."));
                logo.stopTurtle = true;
                return;
            }

            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.inHarmonic.push(blk);
            tur.singer.partials.push([]);
            let n = tur.singer.partials.length - 1;

            for (let i = 0; i < harmonic; i++) {
                tur.singer.partials[n].push(0);
            }

            tur.singer.partials[n].push(1);
            logo.notation.notationBeginHarmonics(turtle);

            let listenerName = "_harmonic_" + turtle + "_" + blk;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                tur.singer.inHarmonic.pop();
                tur.singer.partials.pop();
                logo.notation.notationEndHarmonics(turtle);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Frequency Modulator used to define a timbre.
         *
         * @param {Number} modulationIndex
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block index in blocks.blockList
         */
        static defFMSynth(modulationIndex, turtle, blk) {
            if (logo.inTimbre) {
                logo.timbre.FMSynthParams = [];
                if (logo.timbre.osc.length != 0) {
                    logo.errorMsg(_("Unable to use synth due to existing oscillator"));
                }
            }

            if (modulationIndex === null || typeof modulationIndex !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                modulationIndex = 10;
            }

            if (modulationIndex < 0) {
                logo.errorMsg(_("The input cannot be negative."));
                modulationIndex = -arg;
            }

            if (logo.inTimbre) {
                logo.timbre.fmSynthParamvals["modulationIndex"] = modulationIndex;
                logo.synth.createSynth(
                    turtle, logo.timbre.instrumentName, "fmsynth", logo.timbre.fmSynthParamvals
                );

                logo.timbre.FMSynthesizer.push(blk);
                logo.timbre.FMSynthParams.push(modulationIndex);
            }
        }
    }
}
