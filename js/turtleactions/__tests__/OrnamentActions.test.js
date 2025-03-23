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
    let activity, turtleMock;

    beforeEach(() => {
        global.Singer = {
            OrnamentActions: null,
        };

        turtleMock = {
            singer: {
                staccato: [],
                justCounting: [],
                inNeighbor: [],
                neighborStepPitch: [],
                neighborNoteValue: [],
            },
        };

        activity = {
            turtles: {
                ithTurtle: jest.fn(() => turtleMock),
            },
            blocks: {
                blockList: { 1: {} },
            },
            logo: {
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                notation: {
                    notationBeginSlur: jest.fn(),
                    notationEndSlur: jest.fn(),
                },
            },
        };

        global.MusicBlocks = { isRun: true };
        global.Mouse = {
            getMouseFromTurtle: jest.fn(() => ({
                MB: { listeners: [] },
            })),
        };
        setupOrnamentActions(activity);
    });

    test("setStaccato sets up staccato properly", () => {
        Singer.OrnamentActions.setStaccato(2, 0, 1);
        expect(turtleMock.singer.staccato).toContain(1 / 2);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_staccato_0");
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            0,
            "_staccato_0",
            expect.any(Function)
        );
    });

    test("setSlur sets up slur properly", () => {
        Singer.OrnamentActions.setSlur(2, 0, 1);
        expect(turtleMock.singer.staccato).toContain(-1 / 2);
        expect(activity.logo.notation.notationBeginSlur).toHaveBeenCalledWith(0);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_staccato_0");
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            0,
            "_staccato_0",
            expect.any(Function)
        );
    });

    test("doNeighbor sets up neighbor action properly", () => {
        Singer.OrnamentActions.doNeighbor(3, 4, 0, 1);
        expect(turtleMock.singer.inNeighbor).toContain(1);
        expect(turtleMock.singer.neighborStepPitch).toContain(3);
        expect(turtleMock.singer.neighborNoteValue).toContain(4);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_neighbor_0_1");
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            0,
            "_neighbor_0_1",
            expect.any(Function)
        );
    });
});

