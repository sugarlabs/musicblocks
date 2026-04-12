// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Provide global mocks for logo.js dependencies
global._ = jest.fn(str => str);
global.Notation = jest.fn();
global.Synth = jest.fn(() => ({
    newTone: jest.fn(),
    createDefaultSynth: jest.fn(),
    start: jest.fn()
}));
global.instruments = {};
global.instrumentsFilters = {};
global.instrumentsEffects = {};
global.Singer = {
    setSynthVolume: jest.fn(),
    setMasterVolume: jest.fn()
};
global.Tone = {
    UserMedia: jest.fn(() => ({
        open: jest.fn()
    }))
};
global.CAMERAVALUE = "camera";
global.doUseCamera = jest.fn();
global.VIDEOVALUE = "video";
global.last = jest.fn(arr => arr[arr.length - 1]);
global.getIntervalDirection = jest.fn();
global.getIntervalNumber = jest.fn();
global.mixedNumber = jest.fn();
global.rationalToFraction = jest.fn();
global.doStopVideoCam = jest.fn();
global.StatusMatrix = jest.fn();
global.getStatsFromNotation = jest.fn();
global.delayExecution = jest.fn();
global.DEFAULTVOICE = "default";

const Logo = require("../logo").Logo;
const LogoDependencies = require("../LogoDependencies");

// ─── Shared factory helpers ───────────────────────────────────────────────────

function createMockBlocks() {
    return {
        blockList: [],
        unhighlightAll: jest.fn(),
        bringToTop: jest.fn(),
        showBlocks: jest.fn(),
        hideBlocks: jest.fn(),
        sameGeneration: jest.fn(() => false),
        visible: true
    };
}

function createMockTurtles() {
    return {
        turtleList: [],
        ithTurtle: jest.fn(() => ({
            listeners: {},
            singer: {
                inDuplicate: false,
                backward: [],
                synthVolume: {}
            },
            endOfClampSignals: {},
            parameterQueue: []
        })),
        getTurtle: jest.fn(() => ({
            painter: { color: 50 },
            companionTurtle: null,
            running: false
        })),
        getTurtleCount: jest.fn(() => 0),
        add: jest.fn(),
        markAllAsStopped: jest.fn()
    };
}

function createMockStage() {
    return {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    };
}

/** Minimal valid deps object — individual tests omit fields to test validation. */
function createValidDeps(overrides = {}) {
    return {
        blocks: createMockBlocks(),
        turtles: createMockTurtles(),
        stage: createMockStage(),
        errorHandler: jest.fn(),
        messageHandler: { hide: jest.fn() },
        storage: { saveLocally: jest.fn() },
        config: { showBlocksAfterRun: false },
        callbacks: { onStopTurtle: jest.fn(), onRunTurtle: jest.fn() },
        instruments: {},
        Singer: { setSynthVolume: jest.fn() },
        Tone: {},
        utils: { last: jest.fn() },
        classes: {
            Notation: jest.fn(),
            Synth: jest.fn(),
            StatusMatrix: jest.fn()
        },
        ...overrides
    };
}

// ─── Constructor validation (lines 87, 90, 93, 96) ───────────────────────────

describe("LogoDependencies constructor — required dependency validation", () => {
    test("throws when 'blocks' is missing", () => {
        expect(() => new LogoDependencies(createValidDeps({ blocks: undefined }))).toThrow(
            "LogoDependencies: 'blocks' is required"
        );
    });

    test("throws when 'turtles' is missing", () => {
        expect(() => new LogoDependencies(createValidDeps({ turtles: undefined }))).toThrow(
            "LogoDependencies: 'turtles' is required"
        );
    });

    test("throws when 'stage' is missing", () => {
        expect(() => new LogoDependencies(createValidDeps({ stage: undefined }))).toThrow(
            "LogoDependencies: 'stage' is required"
        );
    });

    test("throws when 'errorHandler' is missing", () => {
        expect(() => new LogoDependencies(createValidDeps({ errorHandler: undefined }))).toThrow(
            "LogoDependencies: 'errorHandler' is required"
        );
    });
});

// ─── Constructor optional defaults ───────────────────────────────────────────

describe("LogoDependencies constructor — optional dependency defaults", () => {
    test("messageHandler defaults to no-op when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ messageHandler: undefined }));
        expect(deps.messageHandler).toBeDefined();
        expect(() => deps.messageHandler.hide()).not.toThrow();
    });

    test("storage defaults to no-op when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ storage: undefined }));
        expect(deps.storage).toBeDefined();
        expect(() => deps.storage.saveLocally()).not.toThrow();
    });

    test("config defaults to { showBlocksAfterRun: false } when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ config: undefined }));
        expect(deps.config.showBlocksAfterRun).toBe(false);
    });

    test("callbacks defaults to { onStopTurtle: null, onRunTurtle: null } when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ callbacks: undefined }));
        expect(deps.callbacks.onStopTurtle).toBeNull();
        expect(deps.callbacks.onRunTurtle).toBeNull();
    });

    test("audio/utility deps fall back to globals when omitted", () => {
        const deps = new LogoDependencies(
            createValidDeps({
                instruments: undefined,
                instrumentsFilters: undefined,
                instrumentsEffects: undefined,
                Singer: undefined,
                Tone: undefined
            })
        );
        // Should pick up from global (set at top of this file)
        expect(deps.instruments).toBe(global.instruments);
        expect(deps.instrumentsFilters).toBe(global.instrumentsFilters);
        expect(deps.instrumentsEffects).toBe(global.instrumentsEffects);
        expect(deps.Singer).toBe(global.Singer);
        expect(deps.Tone).toBe(global.Tone);
    });

    test("utils falls back to globals when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ utils: undefined }));
        expect(deps.utils.last).toBe(global.last);
        expect(deps.utils.doUseCamera).toBe(global.doUseCamera);
        expect(deps.utils.doStopVideoCam).toBe(global.doStopVideoCam);
        expect(deps.utils.getIntervalDirection).toBe(global.getIntervalDirection);
        expect(deps.utils.getIntervalNumber).toBe(global.getIntervalNumber);
        expect(deps.utils.mixedNumber).toBe(global.mixedNumber);
        expect(deps.utils.rationalToFraction).toBe(global.rationalToFraction);
        expect(deps.utils.getStatsFromNotation).toBe(global.getStatsFromNotation);
        expect(deps.utils.delayExecution).toBe(global.delayExecution);
    });

    test("classes falls back to globals when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ classes: undefined }));
        expect(deps.classes.Notation).toBe(global.Notation);
        expect(deps.classes.Synth).toBe(global.Synth);
        expect(deps.classes.StatusMatrix).toBe(global.StatusMatrix);
    });

    test("explicit deps are stored as-is", () => {
        const validDeps = createValidDeps();
        const deps = new LogoDependencies(validDeps);
        expect(deps.blocks).toBe(validDeps.blocks);
        expect(deps.turtles).toBe(validDeps.turtles);
        expect(deps.stage).toBe(validDeps.stage);
        expect(deps.errorHandler).toBe(validDeps.errorHandler);
        expect(deps.instruments).toBe(validDeps.instruments);
        expect(deps.Singer).toBe(validDeps.Singer);
        expect(deps.Tone).toBe(validDeps.Tone);
        expect(deps.utils).toBe(validDeps.utils);
        expect(deps.classes).toBe(validDeps.classes);
    });
});

// ─── isLogoDependencies ───────────────────────────────────────────────────────

describe("LogoDependencies.isLogoDependencies", () => {
    test("returns true for a LogoDependencies instance", () => {
        const deps = new LogoDependencies(createValidDeps());
        expect(LogoDependencies.isLogoDependencies(deps)).toBe(true);
    });

    test("returns false for a plain object", () => {
        expect(LogoDependencies.isLogoDependencies({})).toBe(false);
    });

    test("returns false for null", () => {
        expect(LogoDependencies.isLogoDependencies(null)).toBe(false);
    });

    test("returns false for undefined", () => {
        expect(LogoDependencies.isLogoDependencies(undefined)).toBe(false);
    });
});

// ─── fromActivity (lines 197–257) ────────────────────────────────────────────

describe("LogoDependencies.fromActivity", () => {
    function createMockActivity(overrides = {}) {
        return {
            blocks: createMockBlocks(),
            turtles: createMockTurtles(),
            stage: createMockStage(),
            errorMsg: jest.fn(),
            hideMsgs: jest.fn(),
            saveLocally: jest.fn(),
            showBlocksAfterRun: false,
            onStopTurtle: jest.fn(),
            onRunTurtle: jest.fn(),
            ...overrides
        };
    }

    test("creates a LogoDependencies instance", () => {
        const deps = LogoDependencies.fromActivity(createMockActivity());
        expect(deps).toBeInstanceOf(LogoDependencies);
    });

    test("maps blocks, turtles, and stage from the activity", () => {
        const activity = createMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        expect(deps.blocks).toBe(activity.blocks);
        expect(deps.turtles).toBe(activity.turtles);
        expect(deps.stage).toBe(activity.stage);
    });

    test("errorHandler delegates to activity.errorMsg", () => {
        const activity = createMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.errorHandler("boom");
        expect(activity.errorMsg).toHaveBeenCalledWith("boom");
    });

    test("messageHandler.hide delegates to activity.hideMsgs", () => {
        const activity = createMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.messageHandler.hide();
        expect(activity.hideMsgs).toHaveBeenCalled();
    });

    test("storage.saveLocally delegates to activity.saveLocally", () => {
        const activity = createMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.storage.saveLocally();
        expect(activity.saveLocally).toHaveBeenCalled();
    });

    test("config.showBlocksAfterRun getter reflects activity value", () => {
        const activity = createMockActivity({ showBlocksAfterRun: true });
        const deps = LogoDependencies.fromActivity(activity);
        expect(deps.config.showBlocksAfterRun).toBe(true);
    });

    test("config.showBlocksAfterRun setter updates activity value", () => {
        const activity = createMockActivity({ showBlocksAfterRun: false });
        const deps = LogoDependencies.fromActivity(activity);
        deps.config.showBlocksAfterRun = true;
        expect(activity.showBlocksAfterRun).toBe(true);
    });

    test("callbacks are mapped from activity", () => {
        const activity = createMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        expect(deps.callbacks.onStopTurtle).toBe(activity.onStopTurtle);
        expect(deps.callbacks.onRunTurtle).toBe(activity.onRunTurtle);
    });

    test("global audio deps (instruments, Singer, Tone) are picked up", () => {
        const deps = LogoDependencies.fromActivity(createMockActivity());
        expect(deps.instruments).toBe(global.instruments);
        expect(deps.Singer).toBe(global.Singer);
        expect(deps.Tone).toBe(global.Tone);
    });

    test("global util functions are picked up", () => {
        const deps = LogoDependencies.fromActivity(createMockActivity());
        expect(deps.utils.last).toBe(global.last);
        expect(deps.utils.doUseCamera).toBe(global.doUseCamera);
        expect(deps.utils.doStopVideoCam).toBe(global.doStopVideoCam);
        expect(deps.utils.getIntervalDirection).toBe(global.getIntervalDirection);
        expect(deps.utils.getIntervalNumber).toBe(global.getIntervalNumber);
        expect(deps.utils.mixedNumber).toBe(global.mixedNumber);
        expect(deps.utils.rationalToFraction).toBe(global.rationalToFraction);
        expect(deps.utils.getStatsFromNotation).toBe(global.getStatsFromNotation);
        expect(deps.utils.delayExecution).toBe(global.delayExecution);
    });

    test("global classes are picked up", () => {
        const deps = LogoDependencies.fromActivity(createMockActivity());
        expect(deps.classes.Notation).toBe(global.Notation);
        expect(deps.classes.Synth).toBe(global.Synth);
        expect(deps.classes.StatusMatrix).toBe(global.StatusMatrix);
    });
});

// ─── Module export (lines 263–264) ───────────────────────────────────────────

describe("LogoDependencies module export", () => {
    test("module.exports is the LogoDependencies class", () => {
        // Re-require to exercise the module.exports branch
        jest.resetModules();
        const LD = require("../LogoDependencies");
        expect(typeof LD).toBe("function");
        expect(LD.name).toBe("LogoDependencies");
    });
});

// ─── Logo integration (original suite, retained) ─────────────────────────────

describe("Logo with LogoDependencies", () => {
    let mockDeps;

    beforeEach(() => {
        mockDeps = createValidDeps();
    });

    test("Logo accepts LogoDependencies object", () => {
        const logo = new Logo(mockDeps);
        expect(logo.deps).toBe(mockDeps);
        expect(logo.activity.blocks).toBe(mockDeps.blocks);
    });

    test("Logo maintains backward compatibility with Activity facade", () => {
        const mockActivity = {
            blocks: createMockBlocks(),
            turtles: createMockTurtles(),
            stage: createMockStage(),
            errorMsg: jest.fn(),
            hideMsgs: jest.fn(),
            saveLocally: jest.fn(),
            showBlocksAfterRun: false,
            onStopTurtle: jest.fn(),
            onRunTurtle: jest.fn()
        };

        const logo = new Logo(mockActivity);
        expect(logo.activity).toBe(mockActivity);
        expect(logo.deps.blocks).toBe(mockActivity.blocks);
    });

    test("Error handler is called correctly", () => {
        const deps = new LogoDependencies(mockDeps);
        const logo = new Logo(deps);
        logo.activity.errorMsg("Test error");
        expect(mockDeps.errorHandler).toHaveBeenCalledWith("Test error", undefined);
    });

    test("Config properties work with getters/setters", () => {
        const logo = new Logo(mockDeps);
        expect(logo.activity.showBlocksAfterRun).toBe(false);
        logo.activity.showBlocksAfterRun = true;
        expect(mockDeps.config.showBlocksAfterRun).toBe(true);
    });

    test("Audio dependencies are correctly injected", () => {
        const logo = new Logo(mockDeps);
        expect(logo.deps.instruments).toBe(mockDeps.instruments);
        expect(logo.deps.Singer).toBe(mockDeps.Singer);
    });
});
