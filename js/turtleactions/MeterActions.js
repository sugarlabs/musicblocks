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

/*
   global _, logo, Singer, rationalToFraction, TONEBPM, Queue, turtles, last, MusicBlocks, blocks,
   Mouse
*/

/*
   Global Locations
    js/utils/utils.js
        _, rationalToFraction, last
    js/turtle-singer.js
        Singer
    js/activity.js
        logo, blocks
    js/utils/synthutils.js
        DRUMNAMES,NOISENAMES
    js/utils/musicutils.js
        DEFAULTDRUM
    js/logo.js
        DEFAULTVOLUME, TONEBPM, Queue
    js/activity.js
        turtles
    js/js-export/export.js
        MusicBlocks, Mouse
*/

/* exported setupMeterActions */

/**
 * Sets up all the methods related to different actions for each block in Meter palette.
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
            const tur = logo.turtles.ithTurtle(turtle);

            tur.singer.beatsPerMeasure = beatCount <= 0 ? 4 : beatCount;
            tur.singer.noteValuePerBeat = noteValue <= 0 ? 4 : 1 / noteValue;

            // setup default strong / weak beats until any strong beat block is used
            if (tur.singer.noteValuePerBeat == 4 && tur.singer.beatsPerMeasure == 4) {
                tur.singer.beatList.push(1);
                tur.singer.beatList.push(3);
                tur.singer.defaultStrongBeats = true;
            } else if (tur.singer.noteValuePerBeat == 4 && tur.singer.beatsPerMeasure == 2) {
                tur.singer.beatList.push(1);
                tur.singer.defaultStrongBeats = true;
            } else if (tur.singer.noteValuePerBeat == 4 && tur.singer.beatsPerMeasure == 3) {
                tur.singer.beatList.push(1);
                tur.singer.defaultStrongBeats = true;
            } else if (tur.singer.noteValuePerBeat == 8 && tur.singer.beatsPerMeasure == 6) {
                tur.singer.beatList.push(1);
                tur.singer.beatList.push(4);
                tur.singer.defaultStrongBeats = true;
            }

            logo.notation.notationMeter(
                turtle,
                tur.singer.beatsPerMeasure,
                tur.singer.noteValuePerBeat
            );
        }

        static setPickup(value, turtle) {
            const tur = logo.turtles.ithTurtle(turtle);

            tur.singer.pickup = Math.max(0, value);
            logo.notation.notationPickup(turtle, tur.singer.pickup);
        }

        static setBPM(bpm, beatValue, turtle, blk) {
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
                    blk
                );
                _bpm = 1000;
            }

            logo.turtles.ithTurtle(turtle).singer.bpm.push(_bpm);
        }

        static setMasterBPM(bpm, beatValue, blk) {
            const _bpm = (bpm * beatValue) / 0.25;
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
            const tur = logo.turtles.ithTurtle(turtle);

            const __listener = () => {
                if (tur.running) {
                    const queueBlock = new Queue(logo.actions[action], 1, blk);
                    tur.parentFlowQueue.push(blk);
                    tur.queue.push(queueBlock);
                } else {
                    // Since the turtle has stopped running, we need to run the stack from here
                    if (isflow) {
                        logo.runFromBlockNow(
                            logo,
                            turtle,
                            logo.actions[action],
                            isflow,
                            receivedArg
                        );
                    } else {
                        logo.runFromBlock(logo, turtle, logo.actions[action], isflow, receivedArg);
                    }
                }
            };

            const turtleID = tur.id;
            const eventName = "__everybeat_" + turtleID + "__";
            logo.setTurtleListener(turtle, eventName, __listener);

            tur.singer.beatList.push("everybeat");
        }

        static onEveryBeatDo(action, isflow, receivedArg, turtle, blk) {
            // Set up a listener for every beat for this turtle.
            const orgTurtle = turtle;
            if (!turtles.turtleList[orgTurtle].companionTurtle) {
                turtle = logo.turtles.turtleList.length;
                turtles.turtleList[orgTurtle].companionTurtle = turtle;
                logo.turtles.addTurtle(logo.blocks.blockList[blk], {});
                logo.prepSynths();
            }
            turtle = turtles.turtleList[orgTurtle].companionTurtle;

            const tur = logo.turtles.ithTurtle(turtle);

            const __listener = () => {
                if (tur.running) {
                    const queueBlock = new Queue(logo.actions[action], 1, blk);
                    tur.parentFlowQueue.push(blk);
                    tur.queue.push(queueBlock);
                } else {
                    // Since the turtle has stopped running, we need to run the stack from here
                    if (isflow) {
                        logo.runFromBlockNow(
                            logo,
                            turtle,
                            logo.actions[action],
                            isflow,
                            receivedArg
                        );
                    } else {
                        logo.runFromBlock(logo, turtle, logo.actions[action], isflow, receivedArg);
                    }
                }
            };

            const eventName = "__everybeat_" + turtle + "__";
            tur.queue = [];
            tur.parentFlowQueue = [];
            tur.unhighlightQueue = [];
            tur.parameterQueue = [];
            logo.initTurtle(turtle);
            logo.setTurtleListener(turtle, eventName, __listener);

            const turOrg = logo.turtles.ithTurtle(orgTurtle);
            let duration =
                60 / (turOrg.singer.bpm.length > 0 ? last(turOrg.singer.bpm) : Singer.masterBPM);
            // Consider meter when calculating duration.
            duration = (duration * 4) / turOrg.singer.noteValuePerBeat;
            if (tur.interval !== undefined) {
                clearInterval(tur.interval);
            }
            logo.stage.dispatchEvent(eventName);
            tur.interval = setInterval(() => logo.stage.dispatchEvent(eventName), duration * 1000);
        }

        static onStrongBeatDo(beat, action, isflow, receivedArg, turtle, blk) {
            const tur = logo.turtles.ithTurtle(turtle);

            // Set up a listener for this turtle/onbeat combo.
            const __listener = () => {
                if (tur.running) {
                    const queueBlock = new Queue(logo.actions[action], 1, blk);
                    tur.parentFlowQueue.push(blk);
                    tur.queue.push(queueBlock);
                } else {
                    // Since the turtle has stopped running, we need to run the stack from here
                    if (isflow) {
                        logo.runFromBlockNow(
                            logo,
                            turtle,
                            logo.actions[action],
                            isflow,
                            receivedArg
                        );
                    } else {
                        logo.runFromBlock(logo, turtle, logo.actions[action], isflow, receivedArg);
                    }
                }
            };

            const turtleID = tur.id;
            const eventName = "__beat_" + beat + "_" + turtleID + "__";
            logo.setTurtleListener(turtle, eventName, __listener);

            //remove any default strong beats other than "everybeat " or  "offbeat"
            if (tur.singer.defaultStrongBeats) {
                for (let i = 0; i < tur.singer.beatList.length; i++) {
                    if (
                        tur.singer.beatList[i] !== "everybeat" &&
                        tur.singer.beatList[i] !== "offbeat"
                    ) {
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
            const tur = logo.turtles.ithTurtle(turtle);

            // Set up a listener for this turtle/offbeat combo
            const __listener = () => {
                if (tur.running) {
                    const queueBlock = new Queue(logo.actions[action], 1, blk);
                    tur.parentFlowQueue.push(blk);
                    tur.queue.push(queueBlock);
                } else {
                    // Since the turtle has stopped running, we need to run the stack from here
                    if (isflow) {
                        logo.runFromBlockNow(
                            logo,
                            turtle,
                            logo.actions[action],
                            isflow,
                            receivedArg
                        );
                    } else {
                        logo.runFromBlock(logo, turtle, logo.actions[action], isflow, receivedArg);
                    }
                }
            };

            const turtleID = tur.id;
            const eventName = "__offbeat_" + turtleID + "__";
            logo.setTurtleListener(turtle, eventName, __listener);

            logo.turtles.ithTurtle(turtle).singer.beatList.push("offbeat");
        }

        static setNoClock(turtle, blk) {
            const tur = logo.turtles.ithTurtle(turtle);

            tur.singer.drift++;

            const listenerName = "_drift_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                if (tur.singer.drift > 0) tur.singer.drift--;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        static getNotesPlayed(noteValue, turtle) {
            if (noteValue === null || noteValue === 0) return 0;

            const tur = logo.turtles.ithTurtle(turtle);
            return tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] / noteValue;
        }

        static getWholeNotesPlayed(turtle) {
            const tur = logo.turtles.ithTurtle(turtle);
            return tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1];
        }

        static getBeatCount(turtle) {
            const tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] < tur.singer.pickup) return 0;

            return (
                (((tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] - tur.singer.pickup) *
                    tur.singer.noteValuePerBeat) %
                    tur.singer.beatsPerMeasure) +
                1
            );
        }

        static getMeasureCount(turtle) {
            const tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] < tur.singer.pickup) return 0;

            return (
                Math.floor(
                    ((tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] - tur.singer.pickup) *
                        tur.singer.noteValuePerBeat) /
                        tur.singer.beatsPerMeasure
                ) + 1
            );
        }

        static getBPM(turtle) {
            const tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.bpm.length > 0) {
                return last(tur.singer.bpm);
            } else {
                return Singer.masterBPM;
            }
        }

        static getBeatFactor(turtle) {
            return (
                Singer.RhythmActions.getNoteValue(turtle) *
                logo.turtles.ithTurtle(turtle).singer.noteValuePerBeat
            );
        }

        static getCurrentMeter(turtle) {
            const tur = logo.turtles.ithTurtle(turtle);
            return tur.singer.beatsPerMeasure + ":" + tur.singer.noteValuePerBeat;
        }
    };
}
