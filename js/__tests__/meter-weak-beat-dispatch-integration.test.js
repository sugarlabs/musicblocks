/**
 * @license
 * MusicBlocks
 * Copyright (C) 2026 Music Blocks Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const setupMeterActions = require("../turtleactions/MeterActions");
const setupRhythmActions = require("../turtleactions/RhythmActions");
const { getMeasurePosition, getMeterAnchor } = require("../utils/musicutils-rhythm");

describe("weak beat dispatch across meter changes", () => {
    let activity;
    let turtle;
    let listeners;

    beforeAll(() => {
        global._ = msg => msg;
        global.last = arr => arr[arr.length - 1];
        global.TONEBPM = 120;
        global.getMeasurePosition = getMeasurePosition;
        global.getMeterAnchor = getMeterAnchor;
        global.rationalToFraction = value => [value * 4, 4];
        global.Queue = jest.fn((action, duration, blk) => ({ action, duration, blk }));
        global.MusicBlocks = { isRun: false };
        global.Mouse = {
            getMouseFromTurtle: jest.fn(() => ({ MB: { listeners: [] } }))
        };

        global.Singer = {
            processNote: jest.fn()
        };
    });

    beforeEach(() => {
        listeners = {};

        turtle = {
            id: 0,
            singer: {
                inNoteBlock: [],
                notesPlayed: [0, 1],
                pickup: 0,
                meterAnchor: null,
                noteValuePerBeat: 4,
                beatsPerMeasure: 4,
                beatList: [],
                factorList: [],
                defaultStrongBeats: false,
                bpm: [],
                beatFactor: 1,
                beatFactorValues: [],
                dotCount: 0,
                currentBeat: null,
                currentMeasure: null,
                noteValue: {},
                multipleVoices: false,
                inNeighbor: [],
                neighborArgBeat: [],
                neighborArgCurrentBeat: [],
                oscList: {},
                noteBeat: {},
                noteBeatValues: {},
                notePitches: {},
                noteOctaves: {},
                noteCents: {},
                noteHertz: {},
                noteDrums: {},
                embeddedGraphics: {}
            },
            queue: [],
            parentFlowQueue: []
        };

        activity = {
            turtles: {
                ithTurtle: jest.fn(() => turtle)
            },
            blocks: {
                blockList: { 1: {} }
            },
            stage: {
                dispatchEvent: jest.fn(eventName => {
                    if (listeners[eventName]) {
                        listeners[eventName]();
                    }
                })
            },
            logo: {
                actions: {
                    testAction: "testAction"
                },
                clearNoteParams: jest.fn(),
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn((turtleId, eventName, listener) => {
                    listeners[eventName] = listener;
                }),
                notation: {
                    notationMeter: jest.fn(),
                    notationVoices: jest.fn()
                },
                pitchBlocks: [],
                drumBlocks: []
            }
        };

        setupMeterActions(activity);
        setupRhythmActions(activity);
    });

    function playFourQuarterNotes(startQuarter) {
        const weakBeats = [];

        for (let beat = 1; beat <= 4; beat++) {
            turtle.singer.notesPlayed = [startQuarter + beat - 1, 4];
            turtle.singer.inNoteBlock = [];
            activity.stage.dispatchEvent.mockClear();

            Singer.RhythmActions.playNote(1 / 4, "note", 0, 1);

            const firedWeakBeat = activity.stage.dispatchEvent.mock.calls.some(
                ([eventName]) => eventName === "__offbeat_0__"
            );

            if (firedWeakBeat) {
                weakBeats.push(turtle.singer.currentBeat);
            }
        }

        return weakBeats;
    }

    test("keeps weak beats on 2 and 4 after 4/4 -> 3/4 -> 4/4", () => {
        Singer.MeterActions.setMeter(4, 1 / 4, 0);
        Singer.MeterActions.onWeakBeatDo("testAction", false, null, 0, 1);

        expect(playFourQuarterNotes(0)).toEqual([2, 4]);

        // Move to the end of the first 4/4 measure before changing meter.
        turtle.singer.notesPlayed = [1, 1];

        Singer.MeterActions.setMeter(3, 1 / 4, 0);
        Singer.MeterActions.setMeter(4, 1 / 4, 0);

        expect(turtle.singer.beatList).toEqual(["offbeat", 1, 3]);
        expect(playFourQuarterNotes(4)).toEqual([2, 4]);

        // Two weak beats before and two after the meter transition.
        expect(turtle.queue).toHaveLength(4);
    });
});
