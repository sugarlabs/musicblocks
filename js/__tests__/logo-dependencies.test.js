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
global.EmbeddedGraphicsScheduler =
    require("../embedded-graphics-scheduler").EmbeddedGraphicsScheduler;

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
        refreshCanvas: jest.fn(),
        textMsg: jest.fn(),
        markStageDirty: jest.fn(),
        save: {
            afterSaveLilypond: jest.fn(),
            afterSaveAbc: jest.fn(),
            afterSaveMxml: jest.fn(),
            afterSaveMIDI: jest.fn()
        },
        statsWindow: { displayInfo: jest.fn() },
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
        expect(activity.errorMsg).toHaveBeenCalledWith("boom", undefined);
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

// ─── New optional deps: refreshCanvas, textMsg, markStageDirty, save, statsWindow ─

describe("LogoDependencies — new optional dependency defaults", () => {
    test("refreshCanvas defaults to a no-op when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ refreshCanvas: undefined }));
        expect(deps.refreshCanvas).toBeDefined();
        expect(() => deps.refreshCanvas()).not.toThrow();
    });

    test("textMsg defaults to a no-op when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ textMsg: undefined }));
        expect(deps.textMsg).toBeDefined();
        expect(() => deps.textMsg("hello")).not.toThrow();
    });

    test("markStageDirty defaults to a no-op when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ markStageDirty: undefined }));
        expect(deps.markStageDirty).toBeDefined();
        expect(() => deps.markStageDirty()).not.toThrow();
    });

    test("save defaults to no-op object when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ save: undefined }));
        expect(deps.save).toBeDefined();
        expect(() => deps.save.afterSaveLilypond()).not.toThrow();
        expect(() => deps.save.afterSaveAbc()).not.toThrow();
        expect(() => deps.save.afterSaveMxml()).not.toThrow();
        expect(() => deps.save.afterSaveMIDI()).not.toThrow();
    });

    test("statsWindow defaults to no-op object when omitted", () => {
        const deps = new LogoDependencies(createValidDeps({ statsWindow: undefined }));
        expect(deps.statsWindow).toBeDefined();
        expect(() => deps.statsWindow.displayInfo({})).not.toThrow();
    });

    test("explicit refreshCanvas is stored and callable", () => {
        const refreshCanvas = jest.fn();
        const deps = new LogoDependencies(createValidDeps({ refreshCanvas }));
        deps.refreshCanvas();
        expect(refreshCanvas).toHaveBeenCalledTimes(1);
    });

    test("explicit textMsg is stored and callable", () => {
        const textMsg = jest.fn();
        const deps = new LogoDependencies(createValidDeps({ textMsg }));
        deps.textMsg("test message");
        expect(textMsg).toHaveBeenCalledWith("test message");
    });

    test("explicit markStageDirty is stored and callable", () => {
        const markStageDirty = jest.fn();
        const deps = new LogoDependencies(createValidDeps({ markStageDirty }));
        deps.markStageDirty();
        expect(markStageDirty).toHaveBeenCalledTimes(1);
    });

    test("explicit save callbacks are stored and callable", () => {
        const save = {
            afterSaveLilypond: jest.fn(),
            afterSaveAbc: jest.fn(),
            afterSaveMxml: jest.fn(),
            afterSaveMIDI: jest.fn()
        };
        const deps = new LogoDependencies(createValidDeps({ save }));
        deps.save.afterSaveLilypond();
        deps.save.afterSaveAbc();
        deps.save.afterSaveMxml();
        deps.save.afterSaveMIDI();
        expect(save.afterSaveLilypond).toHaveBeenCalledTimes(1);
        expect(save.afterSaveAbc).toHaveBeenCalledTimes(1);
        expect(save.afterSaveMxml).toHaveBeenCalledTimes(1);
        expect(save.afterSaveMIDI).toHaveBeenCalledTimes(1);
    });

    test("explicit statsWindow.displayInfo is stored and callable", () => {
        const statsWindow = { displayInfo: jest.fn() };
        const deps = new LogoDependencies(createValidDeps({ statsWindow }));
        deps.statsWindow.displayInfo({ notes: 10 });
        expect(statsWindow.displayInfo).toHaveBeenCalledWith({ notes: 10 });
    });
});

// ─── fromActivity — new deps delegation ──────────────────────────────────────

describe("LogoDependencies.fromActivity — new dependency delegation", () => {
    function createFullMockActivity(overrides = {}) {
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
            refreshCanvas: jest.fn(),
            textMsg: jest.fn(),
            save: {
                afterSaveLilypond: jest.fn(),
                afterSaveAbc: jest.fn(),
                afterSaveMxml: jest.fn(),
                afterSaveMIDI: jest.fn()
            },
            statsWindow: { displayInfo: jest.fn() },
            ...overrides
        };
    }

    test("refreshCanvas delegates to activity.refreshCanvas", () => {
        const activity = createFullMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.refreshCanvas();
        expect(activity.refreshCanvas).toHaveBeenCalledTimes(1);
    });

    test("textMsg delegates to activity.textMsg", () => {
        const activity = createFullMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.textMsg("hello");
        expect(activity.textMsg).toHaveBeenCalledWith("hello");
    });

    test("markStageDirty sets activity.stageDirty = true", () => {
        const activity = createFullMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.markStageDirty();
        expect(activity.stageDirty).toBe(true);
    });

    test("save.afterSaveLilypond delegates to activity.save.afterSaveLilypond", () => {
        const activity = createFullMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.save.afterSaveLilypond();
        expect(activity.save.afterSaveLilypond).toHaveBeenCalledTimes(1);
    });

    test("save.afterSaveAbc delegates to activity.save.afterSaveAbc", () => {
        const activity = createFullMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.save.afterSaveAbc();
        expect(activity.save.afterSaveAbc).toHaveBeenCalledTimes(1);
    });

    test("save.afterSaveMxml delegates to activity.save.afterSaveMxml", () => {
        const activity = createFullMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.save.afterSaveMxml();
        expect(activity.save.afterSaveMxml).toHaveBeenCalledTimes(1);
    });

    test("save.afterSaveMIDI delegates to activity.save.afterSaveMIDI", () => {
        const activity = createFullMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.save.afterSaveMIDI();
        expect(activity.save.afterSaveMIDI).toHaveBeenCalledTimes(1);
    });

    test("statsWindow.displayInfo delegates to activity.statsWindow.displayInfo", () => {
        const activity = createFullMockActivity();
        const deps = LogoDependencies.fromActivity(activity);
        deps.statsWindow.displayInfo({ count: 5 });
        expect(activity.statsWindow.displayInfo).toHaveBeenCalledWith({ count: 5 });
    });

    test("refreshCanvas is safe when activity.refreshCanvas is missing", () => {
        const activity = createFullMockActivity({ refreshCanvas: undefined });
        const deps = LogoDependencies.fromActivity(activity);
        expect(() => deps.refreshCanvas()).not.toThrow();
    });

    test("textMsg is safe when activity.textMsg is missing", () => {
        const activity = createFullMockActivity({ textMsg: undefined });
        const deps = LogoDependencies.fromActivity(activity);
        expect(() => deps.textMsg("msg")).not.toThrow();
    });

    test("save callbacks are safe when activity.save is missing", () => {
        const activity = createFullMockActivity({ save: undefined });
        const deps = LogoDependencies.fromActivity(activity);
        expect(() => deps.save.afterSaveLilypond()).not.toThrow();
        expect(() => deps.save.afterSaveAbc()).not.toThrow();
    });

    test("statsWindow.displayInfo is safe when activity.statsWindow is missing", () => {
        const activity = createFullMockActivity({ statsWindow: undefined });
        const deps = LogoDependencies.fromActivity(activity);
        expect(() => deps.statsWindow.displayInfo({})).not.toThrow();
    });
});

// ─── Logo uses deps for injected operations ───────────────────────────────────

describe("Logo uses injected deps (not activity facade) for operations", () => {
    test("deps.refreshCanvas is called when logo.deps.refreshCanvas() is invoked", () => {
        const deps = createValidDeps();
        const logo = new Logo(new LogoDependencies(deps));
        logo.deps.refreshCanvas();
        expect(deps.refreshCanvas).toHaveBeenCalledTimes(1);
    });

    test("deps.textMsg is called when logo.deps.textMsg() is invoked", () => {
        const deps = createValidDeps();
        const logo = new Logo(new LogoDependencies(deps));
        logo.deps.textMsg("test");
        expect(deps.textMsg).toHaveBeenCalledWith("test");
    });

    test("deps.markStageDirty is called when logo.deps.markStageDirty() is invoked", () => {
        const deps = createValidDeps();
        const logo = new Logo(new LogoDependencies(deps));
        logo.deps.markStageDirty();
        expect(deps.markStageDirty).toHaveBeenCalledTimes(1);
    });

    test("deps.save callbacks are accessible via logo.deps.save", () => {
        const deps = createValidDeps();
        const logo = new Logo(new LogoDependencies(deps));
        logo.deps.save.afterSaveLilypond();
        expect(deps.save.afterSaveLilypond).toHaveBeenCalledTimes(1);
    });

    test("deps.statsWindow.displayInfo is accessible via logo.deps.statsWindow", () => {
        const deps = createValidDeps();
        const logo = new Logo(new LogoDependencies(deps));
        logo.deps.statsWindow.displayInfo({ x: 1 });
        expect(deps.statsWindow.displayInfo).toHaveBeenCalledWith({ x: 1 });
    });

    test("old-pattern: Activity deps.config.showBlocksAfterRun getter reads from activity", () => {
        const mockActivity = {
            blocks: createMockBlocks(),
            turtles: createMockTurtles(),
            stage: createMockStage(),
            errorMsg: jest.fn(),
            hideMsgs: jest.fn(),
            saveLocally: jest.fn(),
            showBlocksAfterRun: true,
            onStopTurtle: jest.fn(),
            onRunTurtle: jest.fn()
        };
        const logo = new Logo(mockActivity);
        expect(logo.deps.config.showBlocksAfterRun).toBe(true);
    });

    test("old-pattern: Activity deps.config.showBlocksAfterRun setter writes to activity", () => {
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
        logo.deps.config.showBlocksAfterRun = true;
        expect(mockActivity.showBlocksAfterRun).toBe(true);
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
