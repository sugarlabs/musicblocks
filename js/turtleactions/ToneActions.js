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
         * @param {*} rate
         * @param {*} octaves
         * @param {*} baseFrequency
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
    }
}
