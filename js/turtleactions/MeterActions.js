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

        static onEveryNoteDo(action, isflow, receivedArg, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            let __listener = event => {
                if (tur.running) {
                    let queueBlock = new Queue(logo.actions[action], 1, blk);
                    tur.parentFlowQueue.push(blk);
                    tur.queue.push(queueBlock);
                } else {
                    // Since the turtle has stopped running, we need to run the stack from here
                    if (isflow) {
                        logo.runFromBlockNow(
                            logo, turtle, logo.actions[action], isflow, receivedArg
                        );
                    } else {
                        logo.runFromBlock(logo, turtle, logo.actions[action], isflow, receivedArg);
                    }
                }
            };

            let turtleID = tur.id;
            let eventName = "__everybeat_" + turtleID + "__";
            logo.setTurtleListener(turtle, eventName, __listener);

            tur.singer.beatList.push("everybeat");
        }

        static onEveryBeatDo(action, isflow, receivedArg, turtle, blk) {
            // Set up a listener for every beat for this turtle.
            let orgTurtle = turtle;
            console.debug("used from: ", orgTurtle)
            if (!turtles.turtleList[orgTurtle].companionTurtle){
                turtle = logo.turtles.turtleList.length;
                turtles.turtleList[orgTurtle].companionTurtle = turtle ;
                logo.turtles.addTurtle(logo.blocks.blockList[blk], []);
                console.debug("beat Turtle: ", turtle);
            }
            turtle = turtles.turtleList[orgTurtle].companionTurtle;

            let tur = logo.turtles.ithTurtle(turtle);

            let __listener = event => {
                if (tur.running) {
                    let queueBlock = new Queue(logo.actions[action], 1, blk);
                    tur.parentFlowQueue.push(blk);
                    tur.queue.push(queueBlock);
                } else {
                    // Since the turtle has stopped running, we need to run the stack from here
                    if (isflow) {
                        logo.runFromBlockNow(
                            logo, turtle, logo.actions[action], isflow, receivedArg
                        );
                    } else {
                        logo.runFromBlock(logo, turtle, logo.actions[action], isflow, receivedArg);
                    }
                }
            };

            let eventName = "__everybeat_" + turtle + "__";
            tur.queue = [];
            tur.parentFlowQueue = [];
            tur.unhighlightQueue = [];
            tur.parameterQueue = [];
            logo.initTurtle(turtle);
            logo.setTurtleListener(turtle, eventName, __listener);

            let turOrg = logo.turtles.ithTurtle(orgTurtle);
            let duration =
                60 / turOrg.singer.bpm.length > 0 ? last(turOrg.singer.bpm) : Singer.masterBPM;
            if (tur.interval !== undefined) {
                clearInterval(tur.interval);
            }
            tur.interval = setInterval(() => logo.stage.dispatchEvent(eventName), duration * 1000);
        }

        static onStrongBeatDo(beat, action, isflow, receivedArg, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            // Set up a listener for this turtle/onbeat combo.
            let __listener = event => {
                if (tur.running) {
                    let queueBlock = new Queue(logo.actions[action], 1, blk);
                    tur.parentFlowQueue.push(blk);
                    tur.queue.push(queueBlock);
                } else {
                    // Since the turtle has stopped running, we need to run the stack from here
                    if (isflow) {
                        logo.runFromBlockNow(
                            logo, turtle, logo.actions[action], isflow, receivedArg
                        );
                    } else {
                        logo.runFromBlock(
                            logo, turtle, logo.actions[action], isflow, receivedArg
                        );
                    }
                }
            };

            let turtleID = tur.id;
            let eventName = "__beat_" + beat + "_" + turtleID + "__";
            logo.setTurtleListener(turtle, eventName, __listener);

            //remove any default strong beats other than "everybeat " or  "offbeat"
            if (tur.singer.defaultStrongBeats) {
                for (let i = 0; i < tur.singer.beatList.length; i++) {
                    if (tur.singer.beatList[i] !== "everybeat" && tur.singer.beatList[i] !== "offbeat") {
                        tur.singer.beatList.splice(i, 1);
                        i--;
                    }
                }
                tur.singer.defaultStrongBeats = false;
            }

            if (beat > tur.singer.beatsPerMeasure) {
                tur.singer.factorList.push(beat);
            } else {
                tur.singer.beatList.push(beat);
            }
        }

        static onWeakBeatDo(action, isflow, receivedArg, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            // Set up a listener for this turtle/offbeat combo
            let __listener = event => {
                if (tur.running) {
                    let queueBlock = new Queue(logo.actions[action], 1, blk);
                    tur.parentFlowQueue.push(blk);
                    tur.queue.push(queueBlock);
                } else {
                    // Since the turtle has stopped running, we need to run the stack from here
                    if (isflow) {
                        logo.runFromBlockNow(
                            logo, turtle, logo.actions[action], isflow, receivedArg
                        );
                    } else {
                        logo.runFromBlock(logo, turtle, logo.actions[action], isflow, receivedArg);
                    }
                }
            };

            let turtleID = tur.id;
            let eventName = "__offbeat_" + turtleID + "__";
            logo.setTurtleListener(turtle, eventName, __listener);

            logo.turtles.ithTurtle(turtle).singer.beatList.push("offbeat");
        }

        static setNoClock(turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.drift++;

            let listenerName = "_drift_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                if (tur.singer.drift > 0)
                    tur.singer.drift--;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        static getNotesPlayed(noteValue, turtle) {
            if (noteValue === null || noteValue === 0)
                return 0;

            let tur = logo.turtles.ithTurtle(turtle);
            return tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] / noteValue;
        }

        static getWholeNotesPlayed(turtle) {
            let tur = logo.turtles.ithTurtle(turtle);
            return tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1];
        }

        static getBeatCount(turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] < tur.singer.pickup)
                return 0;

            return (
                (
                    (
                        tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] - tur.singer.pickup
                    ) * tur.singer.noteValuePerBeat
                ) % tur.singer.beatsPerMeasure
            ) + 1;
        }

        static getMeasureCount(turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] < tur.singer.pickup)
                return 0;

            return (
                Math.floor(
                    (
                        (
                            tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] -
                            tur.singer.pickup
                        ) * tur.singer.noteValuePerBeat
                    ) / tur.singer.beatsPerMeasure
                ) + 1
            );
        }
    }
}
