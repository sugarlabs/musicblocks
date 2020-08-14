/**
 * @file This contains the action methods of the Turtle's Singer component's Meter blocks.
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
 * Sets up all the methods related to different actions for each block in Meter palette.
 *
 * @returns {void}
 */
function setupMeterActions() {
    Singer.MeterActions = class {
        /**
         * @param {Number} beatCount
         * @param {Number} noteValue
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {void}
         */
        static setMeter(beatCount, noteValue, turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.beatsPerMeasure = beatCount <= 0 ? 4 : beatCount;
            tur.singer.noteValuePerBeat = noteValue <= 0 ? 4 : 1 / noteValue;

            // setup default strong / weak beats until any strong beat block is used

            if (tur.singer.noteValuePerBeat == 4 && tur.singer.beatsPerMeasure == 4) {
                tur.singer.beatList.push(1);
                tur.singer.beatList.push(3);
                tur.singer.defaultStrongBeats = true;
            }
            else if (tur.singer.noteValuePerBeat == 4 && tur.singer.beatsPerMeasure == 2) {
                tur.singer.beatList.push(1);
                tur.singer.defaultStrongBeats = true;
            }
            else if (tur.singer.noteValuePerBeat == 4 && tur.singer.beatsPerMeasure == 3) {
                tur.singer.beatList.push(1);
                tur.singer.defaultStrongBeats = true;
            }
            else if (tur.singer.noteValuePerBeat == 8 && tur.singer.beatsPerMeasure == 6) {
                tur.singer.beatList.push(1);
                tur.singer.beatList.push(4);
                tur.singer.defaultStrongBeats = true;
            }

            logo.notation.notationMeter(
                turtle, tur.singer.beatsPerMeasure, tur.singer.noteValuePerBeat
            );
        }

        static setPickup(value, turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.pickup = Math.max(0, value);
            logo.notation.notationPickup(turtle, tur.singer.pickup);
        }

        static setBPM(bpm, beatValue, turtle) {
            let _bpm = (bpm * beatValue) / 0.25;
            let obj, target;
            if (_bpm < 30) {
                obj = rationalToFraction(beatValue);
                target = (30 * 0.25) / beatValue;
                logo.errorMsg(
                    obj[0] +
                        "/" +
                        obj[1] +
                        " " +
                        _("beats per minute must be greater than") +
                        " " +
                        target,
                    blk
                );
                _bpm = 30;
            } else if (_bpm > 1000) {
                obj = rationalToFraction(beatValue);
                target = (1000 * 0.25) / beatValue;
                logo.errorMsg(
                    _("maximum") +
                        " " +
                        obj[0] +
                        "/" +
                        obj[1] +
                        " " +
                        _("beats per minute is") +
                        " " +
                        target,
                    _blk
                );
                _bpm = 1000;
            }

            logo.turtles.ithTurtle(turtle).singer.bpm.push(_bpm);
        }

        static setMasterBPM(bpm, beatValue, blk) {
            let _bpm = (bpm * beatValue) / 0.25;
            let obj, target;
            if (_bpm < 30) {
                obj = rationalToFraction(beatValue);
                target = (30 * 0.25) / beatValue;
                logo.errorMsg(
                    obj[0] +
                        "/" +
                        obj[1] +
                        " " +
                        _("beats per minute must be greater than") +
                        " " +
                        target,
                    blk
                );
                Singer.masterBPM = 30;
            } else if (_bpm > 1000) {
                obj = rationalToFraction(beatValue);
                target = (1000 * 0.25) / beatValue;
                logo.errorMsg(
                    _("maximum") +
                        " " +
                        obj[0] +
                        "/" +
                        obj[1] +
                        " " +
                        _("beats per minute is") +
                        " " +
                        target,
                    blk
                );
                Singer.masterBPM = 1000;
            } else {
                Singer.masterBPM = _bpm;
            }

            Singer.defaultBPMFactor = TONEBPM / Singer.masterBPM;
        }
    }
}
