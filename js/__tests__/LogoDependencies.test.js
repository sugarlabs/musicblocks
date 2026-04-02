/**
 * MusicBlocks v3.6.2
 *
 * @author abhnish
 *
 * @copyright 2026 abhnish
 *
 * @license
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

const LogoDependencies = require("../LogoDependencies");

const makeDeps = (overrides = {}) => ({
    blocks: { blockList: [], unhighlightAll: jest.fn() },
    turtles: { turtleList: [], ithTurtle: jest.fn() },
    stage: { addEventListener: jest.fn() },
    errorHandler: jest.fn(),
    messageHandler: { hide: jest.fn() },
    storage: { saveLocally: jest.fn() },
    config: { showBlocksAfterRun: false },
    callbacks: { onStopTurtle: jest.fn(), onRunTurtle: jest.fn() },
    ...overrides
});

describe("LogoDependencies", () => {
    describe("constructor", () => {
        test("creates instance with valid deps", () => {
            const deps = new LogoDependencies(makeDeps());
            expect(deps).toBeInstanceOf(LogoDependencies);
        });

        test("stores blocks correctly", () => {
            const blocks = { blockList: [1, 2], unhighlightAll: jest.fn() };
            const deps = new LogoDependencies(makeDeps({ blocks }));
            expect(deps.blocks).toBe(blocks);
        });

        test("stores turtles correctly", () => {
            const turtles = { turtleList: [], ithTurtle: jest.fn() };
            const deps = new LogoDependencies(makeDeps({ turtles }));
            expect(deps.turtles).toBe(turtles);
        });

        test("stores stage correctly", () => {
            const stage = { addEventListener: jest.fn() };
            const deps = new LogoDependencies(makeDeps({ stage }));
            expect(deps.stage).toBe(stage);
        });

        test("stores errorHandler correctly", () => {
            const errorHandler = jest.fn();
            const deps = new LogoDependencies(makeDeps({ errorHandler }));
            expect(deps.errorHandler).toBe(errorHandler);
        });

        test("stores messageHandler correctly", () => {
            const messageHandler = { hide: jest.fn() };
            const deps = new LogoDependencies(makeDeps({ messageHandler }));
            expect(deps.messageHandler).toBe(messageHandler);
        });

        test("stores storage correctly", () => {
            const storage = { saveLocally: jest.fn() };
            const deps = new LogoDependencies(makeDeps({ storage }));
            expect(deps.storage).toBe(storage);
        });

        test("stores config correctly", () => {
            const config = { showBlocksAfterRun: true };
            const deps = new LogoDependencies(makeDeps({ config }));
            expect(deps.config).toBe(config);
        });

        test("stores callbacks correctly", () => {
            const callbacks = { onStopTurtle: jest.fn(), onRunTurtle: jest.fn() };
            const deps = new LogoDependencies(makeDeps({ callbacks }));
            expect(deps.callbacks).toBe(callbacks);
        });

        test("defaults optional deps to null", () => {
            const deps = new LogoDependencies(makeDeps());
            expect(deps.instruments == null).toBe(true);
            expect(deps.instrumentsFilters == null).toBe(true);
            expect(deps.instrumentsEffects == null).toBe(true);
            expect(deps.widgetWindows == null).toBe(true);
            expect(deps.Singer == null).toBe(true);
            expect(deps.Tone == null).toBe(true);
        });

        test("stores optional deps when provided", () => {
            const Singer = { masterBPM: 90 };
            const Tone = { start: jest.fn() };
            const deps = new LogoDependencies(makeDeps({ Singer, Tone }));
            expect(deps.Singer).toBe(Singer);
            expect(deps.Tone).toBe(Tone);
        });

        test("throws when blocks is missing", () => {
            expect(() => new LogoDependencies(makeDeps({ blocks: null }))).toThrow(
                "LogoDependencies: 'blocks' is required"
            );
        });

        test("throws when turtles is missing", () => {
            expect(() => new LogoDependencies(makeDeps({ turtles: null }))).toThrow(
                "LogoDependencies: 'turtles' is required"
            );
        });

        test("throws when stage is missing", () => {
            expect(() => new LogoDependencies(makeDeps({ stage: null }))).toThrow(
                "LogoDependencies: 'stage' is required"
            );
        });

        test("throws when errorHandler is missing", () => {
            expect(() => new LogoDependencies(makeDeps({ errorHandler: null }))).toThrow(
                "LogoDependencies: 'errorHandler' is required"
            );
        });
    });

    describe("isLogoDependencies", () => {
        test("returns true for LogoDependencies instance", () => {
            const deps = new LogoDependencies(makeDeps());
            expect(LogoDependencies.isLogoDependencies(deps)).toBe(true);
        });

        test("returns false for plain object", () => {
            expect(LogoDependencies.isLogoDependencies({})).toBe(false);
        });

        test("returns false for null", () => {
            expect(LogoDependencies.isLogoDependencies(null)).toBe(false);
        });

        test("returns false for undefined", () => {
            expect(LogoDependencies.isLogoDependencies(undefined)).toBe(false);
        });

        test("returns false for string", () => {
            expect(LogoDependencies.isLogoDependencies("deps")).toBe(false);
        });
    });
});

describe("LogoDependencies.fromActivity", () => {
    let activity;

    beforeEach(() => {
        activity = {
            blocks: { blockList: [], unhighlightAll: jest.fn() },
            turtles: { turtleList: [], ithTurtle: jest.fn() },
            stage: { addEventListener: jest.fn() },
            errorMsg: jest.fn(),
            hideMsgs: jest.fn(),
            saveLocally: jest.fn(),
            showBlocksAfterRun: false,
            onStopTurtle: jest.fn(),
            onRunTurtle: jest.fn()
        };
    });

    test("creates LogoDependencies from activity", () => {
        const deps = LogoDependencies.fromActivity(activity);
        expect(deps).toBeInstanceOf(LogoDependencies);
    });

    test("blocks and turtles are set from activity", () => {
        const deps = LogoDependencies.fromActivity(activity);
        expect(deps.blocks).toBe(activity.blocks);
        expect(deps.turtles).toBe(activity.turtles);
    });

    test("errorHandler calls activity.errorMsg", () => {
        const deps = LogoDependencies.fromActivity(activity);
        deps.errorHandler("test error");
        expect(activity.errorMsg).toHaveBeenCalledWith("test error");
    });

    test("messageHandler.hide calls activity.hideMsgs", () => {
        const deps = LogoDependencies.fromActivity(activity);
        deps.messageHandler.hide();
        expect(activity.hideMsgs).toHaveBeenCalled();
    });

    test("storage.saveLocally calls activity.saveLocally", () => {
        const deps = LogoDependencies.fromActivity(activity);
        deps.storage.saveLocally();
        expect(activity.saveLocally).toHaveBeenCalled();
    });

    test("config.showBlocksAfterRun getter returns activity value", () => {
        activity.showBlocksAfterRun = true;
        const deps = LogoDependencies.fromActivity(activity);
        expect(deps.config.showBlocksAfterRun).toBe(true);
    });

    test("config.showBlocksAfterRun setter updates activity value", () => {
        const deps = LogoDependencies.fromActivity(activity);
        deps.config.showBlocksAfterRun = true;
        expect(activity.showBlocksAfterRun).toBe(true);
    });

    test("callbacks are set from activity", () => {
        const deps = LogoDependencies.fromActivity(activity);
        expect(deps.callbacks.onStopTurtle).toBe(activity.onStopTurtle);
        expect(deps.callbacks.onRunTurtle).toBe(activity.onRunTurtle);
    });
});
