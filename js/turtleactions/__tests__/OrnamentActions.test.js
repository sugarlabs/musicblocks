/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 omsuneri
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

const setupOrnamentActions = require("../OrnamentActions");

describe("OrnamentActions", () => {
    let activity,
        turtle,
        dispatchCalls,
        listenerCalls,
        beginSlurCalls,
        endSlurCalls,
        mouseMB,
        listenerFunctions,
        errorMsgCalls;

    beforeEach(() => {
        dispatchCalls = [];
        listenerCalls = [];
        beginSlurCalls = [];
        endSlurCalls = [];
        listenerFunctions = {};
        mouseMB = { listeners: [] };
        global.Singer = { OrnamentActions: null };
        turtle = {
            singer: {
                staccato: [],
                justCounting: [],
                inNeighbor: [],
                neighborStepPitch: [],
                neighborNoteValue: []
            }
        };
        global._ = msg => msg;
        errorMsgCalls = [];
        activity = {
            turtles: { ithTurtle: () => turtle },
            blocks: { blockList: { 1: {}, 2: {}, 3: {}, 4: {} } },
            errorMsg: (msg, blk) => errorMsgCalls.push({ msg, blk }),
            logo: {
                setDispatchBlock: (blk, idx, name) =>
                    dispatchCalls.push({ blk, turtleIndex: idx, listenerName: name }),
                setTurtleListener: (idx, name, fn) => {
                    listenerCalls.push({ turtleIndex: idx, listenerName: name });
                    listenerFunctions[name] = fn;
                },
                notation: {
                    notationBeginSlur: idx => beginSlurCalls.push(idx),
                    notationEndSlur: idx => endSlurCalls.push(idx)
                }
            }
        };
        global.MusicBlocks = { isRun: true };
        global.Mouse = { getMouseFromTurtle: () => ({ MB: mouseMB }) };
        setupOrnamentActions(activity);
    });

    describe("setStaccato", () => {
        const scenarios = [
            {
                desc: "block defined",
                blk: 1,
                expectDispatch: true,
                expectMouseListener: false,
                isRun: true,
                nullMouse: false
            },
            {
                desc: "block undefined",
                blk: undefined,
                expectDispatch: false,
                expectMouseListener: true,
                isRun: true,
                nullMouse: false
            },
            {
                desc: "isRun false",
                blk: undefined,
                expectDispatch: false,
                expectMouseListener: false,
                isRun: false,
                nullMouse: false
            },
            {
                desc: "null mouse",
                blk: undefined,
                expectDispatch: false,
                expectMouseListener: false,
                isRun: true,
                nullMouse: true
            },
            {
                desc: "block defined but not in blockList",
                blk: 99,
                expectDispatch: false,
                expectMouseListener: true,
                isRun: true,
                nullMouse: false
            }
        ];

        scenarios.forEach(
            ({ desc, blk, expectDispatch, expectMouseListener, isRun, nullMouse }) => {
                test(desc, () => {
                    global.MusicBlocks.isRun = isRun;
                    if (nullMouse) global.Mouse.getMouseFromTurtle = () => null;
                    Singer.OrnamentActions.setStaccato(2, 0, blk);
                    const expectedName = "_staccato_0_" + blk;
                    expect(turtle.singer.staccato).toEqual([0.5]);
                    expect(dispatchCalls.length).toBe(expectDispatch ? 1 : 0);
                    expect(listenerCalls.length).toBe(1);
                    if (expectMouseListener) expect(mouseMB.listeners).toContain(expectedName);
                    else expect(mouseMB.listeners).not.toContain(expectedName);
                    listenerFunctions[expectedName]();
                    expect(turtle.singer.staccato).toEqual([]);
                });
            }
        );

        test("dispatches errorMsg when staccato value is zero or invalid", () => {
            [0, null, undefined, NaN, "invalid"].forEach(val => {
                const initialStaccato = [...turtle.singer.staccato];
                Singer.OrnamentActions.setStaccato(val, 0, 1);
                expect(errorMsgCalls.length).toBeGreaterThan(0);
                expect(errorMsgCalls[errorMsgCalls.length - 1].msg).toBe(
                    "Staccato value must be a positive number."
                );
                expect(turtle.singer.staccato).toEqual(initialStaccato);
            });
        });

        test("rejects negative, zero, non-finite, and overflow values with proper side effect suppression", () => {
            const invalidValues = [
                -2,
                -1 / 16,
                0,
                -0,
                NaN,
                Infinity,
                -Infinity,
                null,
                undefined,
                "invalid",
                Number.MIN_VALUE
            ];

            invalidValues.forEach(val => {
                const dispatchCount = dispatchCalls.length;
                const listenerCount = listenerCalls.length;
                const mouseCount = mouseMB.listeners.length;
                const initialStaccato = [...turtle.singer.staccato];
                const initialErrors = errorMsgCalls.length;

                Singer.OrnamentActions.setStaccato(val, 0, 1);

                expect(errorMsgCalls.length).toBe(initialErrors + 1);
                expect(errorMsgCalls[errorMsgCalls.length - 1]).toEqual({
                    msg: "Staccato value must be a positive number.",
                    blk: 1
                });
                expect(turtle.singer.staccato).toEqual(initialStaccato);
                expect(dispatchCalls.length).toBe(dispatchCount);
                expect(listenerCalls.length).toBe(listenerCount);
                expect(mouseMB.listeners.length).toBe(mouseCount);
            });
        });

        test("accepts valid positive values and restores stack on cleanup", () => {
            const initialStaccato = [...turtle.singer.staccato];
            Singer.OrnamentActions.setStaccato(1 / 16, 0, 1);
            expect(turtle.singer.staccato).toEqual([...initialStaccato, 16]);
            expect(listenerCalls.length).toBe(1);
            listenerFunctions["_staccato_0_1"]();
            expect(turtle.singer.staccato).toEqual(initialStaccato);
        });

        test("nested staccato: invalid inner block does not corrupt valid outer block", () => {
            Singer.OrnamentActions.setStaccato(2, 0, 1);
            expect(turtle.singer.staccato).toEqual([0.5]);
            expect(listenerCalls.length).toBe(1);

            const initialErrorCount = errorMsgCalls.length;
            Singer.OrnamentActions.setStaccato(-2, 0, 2);
            expect(errorMsgCalls.length).toBe(initialErrorCount + 1);
            expect(errorMsgCalls[errorMsgCalls.length - 1].msg).toBe(
                "Staccato value must be a positive number."
            );
            expect(turtle.singer.staccato).toEqual([0.5]);
            expect(listenerCalls.length).toBe(1);
            expect(listenerFunctions["_staccato_0_2"]).toBeUndefined();

            listenerFunctions["_staccato_0_1"]();
            expect(turtle.singer.staccato).toEqual([]);
        });

        test("does not throw and skips mouse listener when MusicBlocks is not defined", () => {
            const originalMusicBlocks = global.MusicBlocks;
            delete global.MusicBlocks;
            try {
                expect(() => Singer.OrnamentActions.setStaccato(2, 0, undefined)).not.toThrow();
                expect(dispatchCalls.length).toBe(0);
                expect(mouseMB.listeners.length).toBe(0);
            } finally {
                global.MusicBlocks = originalMusicBlocks;
            }
        });
    });

    describe("setSlur", () => {
        const scenarios = [
            {
                desc: "block defined",
                blk: 1,
                expectDispatch: true,
                expectMouseListener: false,
                isRun: true,
                nullMouse: false,
                justCounting: false,
                expectBeginSlur: true
            },
            {
                desc: "block undefined",
                blk: undefined,
                expectDispatch: false,
                expectMouseListener: true,
                isRun: true,
                nullMouse: false,
                justCounting: false,
                expectBeginSlur: true
            },
            {
                desc: "isRun false",
                blk: undefined,
                expectDispatch: false,
                expectMouseListener: false,
                isRun: false,
                nullMouse: false,
                justCounting: false,
                expectBeginSlur: true
            },
            {
                desc: "null mouse",
                blk: undefined,
                expectDispatch: false,
                expectMouseListener: false,
                isRun: true,
                nullMouse: true,
                justCounting: false,
                expectBeginSlur: true
            },
            {
                desc: "justCounting",
                blk: 1,
                expectDispatch: true,
                expectMouseListener: false,
                isRun: true,
                nullMouse: false,
                justCounting: true,
                expectBeginSlur: false
            },
            {
                desc: "block defined but not in blockList",
                blk: 99,
                expectDispatch: false,
                expectMouseListener: true,
                isRun: true,
                nullMouse: false,
                justCounting: false,
                expectBeginSlur: true
            }
        ];

        scenarios.forEach(
            ({
                desc,
                blk,
                expectDispatch,
                expectMouseListener,
                isRun,
                nullMouse,
                justCounting,
                expectBeginSlur
            }) => {
                test(desc, () => {
                    turtle.singer.justCounting = justCounting ? [1] : [];
                    global.MusicBlocks.isRun = isRun;
                    if (nullMouse) global.Mouse.getMouseFromTurtle = () => null;
                    Singer.OrnamentActions.setSlur(2, 0, blk);
                    expect(turtle.singer.staccato).toEqual([-0.5]);
                    expect(beginSlurCalls.length).toBe(expectBeginSlur ? 1 : 0);
                    expect(dispatchCalls.length).toBe(expectDispatch ? 1 : 0);
                    expect(listenerCalls.length).toBe(1);
                    const expectedName = "_slur_0_" + blk;
                    if (expectMouseListener) expect(mouseMB.listeners).toContain(expectedName);
                    else expect(mouseMB.listeners).not.toContain(expectedName);
                    listenerFunctions[expectedName]();
                    expect(turtle.singer.staccato).toEqual([]);
                    expect(endSlurCalls.length).toBe(expectBeginSlur ? 1 : 0);
                });
            }
        );

        test("dispatches errorMsg when slur value is zero or invalid", () => {
            [0, null, undefined, NaN, "invalid"].forEach(val => {
                const initialStaccato = [...turtle.singer.staccato];
                Singer.OrnamentActions.setSlur(val, 0, 1);
                expect(errorMsgCalls.length).toBeGreaterThan(0);
                expect(errorMsgCalls[errorMsgCalls.length - 1].msg).toBe(
                    "Slur value must be a positive number."
                );
                expect(turtle.singer.staccato).toEqual(initialStaccato);
            });
        });

        test("rejects negative, zero, non-finite, and overflow values with proper side effect suppression", () => {
            const invalidValues = [
                -2,
                -1 / 16,
                0,
                -0,
                NaN,
                Infinity,
                -Infinity,
                null,
                undefined,
                "invalid",
                Number.MIN_VALUE
            ];

            invalidValues.forEach(val => {
                const dispatchCount = dispatchCalls.length;
                const listenerCount = listenerCalls.length;
                const mouseCount = mouseMB.listeners.length;
                const beginCount = beginSlurCalls.length;
                const endCount = endSlurCalls.length;
                const initialStaccato = [...turtle.singer.staccato];
                const initialErrors = errorMsgCalls.length;

                Singer.OrnamentActions.setSlur(val, 0, 1);

                expect(errorMsgCalls.length).toBe(initialErrors + 1);
                expect(errorMsgCalls[errorMsgCalls.length - 1]).toEqual({
                    msg: "Slur value must be a positive number.",
                    blk: 1
                });
                expect(turtle.singer.staccato).toEqual(initialStaccato);
                expect(dispatchCalls.length).toBe(dispatchCount);
                expect(listenerCalls.length).toBe(listenerCount);
                expect(mouseMB.listeners.length).toBe(mouseCount);
                expect(beginSlurCalls.length).toBe(beginCount);
                expect(endSlurCalls.length).toBe(endCount);
            });
        });

        test("accepts valid positive values, starts/ends slur notation, and restores stack", () => {
            const initialStaccato = [...turtle.singer.staccato];
            Singer.OrnamentActions.setSlur(1 / 16, 0, 1);
            expect(turtle.singer.staccato).toEqual([...initialStaccato, -16]);
            expect(beginSlurCalls.length).toBe(1);
            expect(listenerCalls.length).toBe(1);
            listenerFunctions["_slur_0_1"]();
            expect(turtle.singer.staccato).toEqual(initialStaccato);
            expect(endSlurCalls.length).toBe(1);
        });

        test("nested slur and staccato: invalid inner block does not corrupt outer valid blocks", () => {
            Singer.OrnamentActions.setSlur(2, 0, 1);
            expect(turtle.singer.staccato).toEqual([-0.5]);
            expect(beginSlurCalls.length).toBe(1);

            Singer.OrnamentActions.setStaccato(4, 0, 2);
            expect(turtle.singer.staccato).toEqual([-0.5, 0.25]);

            Singer.OrnamentActions.setSlur(-2, 0, 3);
            expect(errorMsgCalls[errorMsgCalls.length - 1].msg).toBe(
                "Slur value must be a positive number."
            );
            expect(turtle.singer.staccato).toEqual([-0.5, 0.25]);
            expect(beginSlurCalls.length).toBe(1);
            expect(listenerFunctions["_slur_0_3"]).toBeUndefined();

            Singer.OrnamentActions.setStaccato(Number.MIN_VALUE, 0, 4);
            expect(errorMsgCalls[errorMsgCalls.length - 1].msg).toBe(
                "Staccato value must be a positive number."
            );
            expect(turtle.singer.staccato).toEqual([-0.5, 0.25]);

            listenerFunctions["_staccato_0_2"]();
            expect(turtle.singer.staccato).toEqual([-0.5]);

            listenerFunctions["_slur_0_1"]();
            expect(turtle.singer.staccato).toEqual([]);
            expect(endSlurCalls.length).toBe(1);
        });

        test("does not throw and skips mouse listener when MusicBlocks is not defined", () => {
            const originalMusicBlocks = global.MusicBlocks;
            delete global.MusicBlocks;
            try {
                expect(() => Singer.OrnamentActions.setSlur(2, 0, undefined)).not.toThrow();
                expect(dispatchCalls.length).toBe(0);
                expect(mouseMB.listeners.length).toBe(0);
            } finally {
                global.MusicBlocks = originalMusicBlocks;
            }
        });

        test("regression: staccato and slur through JS API do not clobber each other", () => {
            // Use undefined for blk to simulate JS API calls. Before the fix, both
            // registered the listener name "_staccato_0_undefined", so the slur's listener
            // overwrote the staccato's. After the fix they have distinct names
            // ("_staccato_0_undefined" vs "_slur_0_undefined"), so both exist
            // and both pop() calls fire, leaving staccato length at 0.
            Singer.OrnamentActions.setStaccato(4, 0, undefined); // pushes 0.25
            Singer.OrnamentActions.setSlur(2, 0, undefined); // pushes -0.5
            expect(turtle.singer.staccato).toEqual([0.25, -0.5]);

            // Fire both cleanup listeners independently
            listenerFunctions["_staccato_0_undefined"]();
            listenerFunctions["_slur_0_undefined"]();

            // Both values must have been popped — staccato array must be empty
            expect(turtle.singer.staccato).toEqual([]);
            // Slur notation should end exactly once
            expect(endSlurCalls.length).toBe(1);
        });
    });

    describe("doNeighbor", () => {
        const scenarios = [
            {
                desc: "block defined",
                blk: 1,
                expectDispatch: true,
                expectMouseListener: false,
                isRun: true,
                nullMouse: false
            },
            {
                desc: "block undefined",
                blk: undefined,
                expectDispatch: false,
                expectMouseListener: true,
                isRun: true,
                nullMouse: false
            },
            {
                desc: "isRun false",
                blk: undefined,
                expectDispatch: false,
                expectMouseListener: false,
                isRun: false,
                nullMouse: false
            },
            {
                desc: "null mouse",
                blk: undefined,
                expectDispatch: false,
                expectMouseListener: false,
                isRun: true,
                nullMouse: true
            },
            {
                desc: "block defined but not in blockList",
                blk: 99,
                expectDispatch: false,
                expectMouseListener: true,
                isRun: true,
                nullMouse: false
            }
        ];

        scenarios.forEach(
            ({ desc, blk, expectDispatch, expectMouseListener, isRun, nullMouse }) => {
                test(desc, () => {
                    global.MusicBlocks.isRun = isRun;
                    if (nullMouse) global.Mouse.getMouseFromTurtle = () => null;
                    Singer.OrnamentActions.doNeighbor(3, 4, 0, blk);
                    expect(turtle.singer.inNeighbor).toEqual([blk]);
                    expect(turtle.singer.neighborStepPitch).toEqual([3]);
                    expect(turtle.singer.neighborNoteValue).toEqual([4]);
                    expect(dispatchCalls.length).toBe(expectDispatch ? 1 : 0);
                    expect(listenerCalls.length).toBe(1);
                    const name = `_neighbor_0_${blk}`;
                    if (expectMouseListener) expect(mouseMB.listeners).toContain(name);
                    else expect(mouseMB.listeners).not.toContain(name);
                    listenerFunctions[name]();
                    expect(turtle.singer.inNeighbor).toEqual([]);
                    expect(turtle.singer.neighborStepPitch).toEqual([]);
                    expect(turtle.singer.neighborNoteValue).toEqual([]);
                });
            }
        );

        test("does not throw and skips mouse listener when MusicBlocks is not defined", () => {
            const originalMusicBlocks = global.MusicBlocks;
            delete global.MusicBlocks;
            try {
                expect(() => Singer.OrnamentActions.doNeighbor(3, 4, 0, undefined)).not.toThrow();
                expect(dispatchCalls.length).toBe(0);
                expect(mouseMB.listeners.length).toBe(0);
            } finally {
                global.MusicBlocks = originalMusicBlocks;
            }
        });

        test("dispatches errorMsg and skips push when noteValue is invalid", () => {
            const invalidNoteValues = [NaN, -1, -0.5, 0, Infinity, null, undefined, "invalid"];
            invalidNoteValues.forEach(val => {
                errorMsgCalls.length = 0;
                const before = {
                    inNeighbor: [...turtle.singer.inNeighbor],
                    neighborStepPitch: [...turtle.singer.neighborStepPitch],
                    neighborNoteValue: [...turtle.singer.neighborNoteValue]
                };
                Singer.OrnamentActions.doNeighbor(3, val, 0, 1);
                expect(errorMsgCalls.length).toBeGreaterThan(0);
                expect(errorMsgCalls[errorMsgCalls.length - 1].msg).toBe(
                    "Neighbor note value must be a positive number."
                );
                expect(turtle.singer.inNeighbor).toEqual(before.inNeighbor);
                expect(turtle.singer.neighborStepPitch).toEqual(before.neighborStepPitch);
                expect(turtle.singer.neighborNoteValue).toEqual(before.neighborNoteValue);
            });
        });

        test("dispatches errorMsg and skips push when interval is non-finite", () => {
            const invalidIntervals = [NaN, Infinity, -Infinity, null, undefined, "bad"];
            invalidIntervals.forEach(val => {
                errorMsgCalls.length = 0;
                const before = {
                    inNeighbor: [...turtle.singer.inNeighbor],
                    neighborStepPitch: [...turtle.singer.neighborStepPitch],
                    neighborNoteValue: [...turtle.singer.neighborNoteValue]
                };
                Singer.OrnamentActions.doNeighbor(val, 4, 0, 1);
                expect(errorMsgCalls.length).toBeGreaterThan(0);
                expect(errorMsgCalls[errorMsgCalls.length - 1].msg).toBe(
                    "Neighbor interval must be a finite number."
                );
                expect(turtle.singer.inNeighbor).toEqual(before.inNeighbor);
                expect(turtle.singer.neighborStepPitch).toEqual(before.neighborStepPitch);
                expect(turtle.singer.neighborNoteValue).toEqual(before.neighborNoteValue);
            });
        });

        test("negative interval is accepted (pitch direction is valid)", () => {
            Singer.OrnamentActions.doNeighbor(-3, 4, 0, 1);
            expect(turtle.singer.neighborStepPitch).toContain(-3);
            expect(turtle.singer.neighborNoteValue).toContain(4);
            expect(errorMsgCalls.length).toBe(0);
        });
    });
});
