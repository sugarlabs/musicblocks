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

/**
 * Integration test for the Logo interpreter's argument-evaluation/dispatch path
 * (`runFromBlockNow`/`parseArg`, js/logo.js) driving the real
 * `Singer.ToneActions.setTimbre` (js/turtleactions/ToneActions.js) - extending the pattern
 * `noteclamp-beat-doublequeue.test.js`, `pitch-note-dispatch-integration.test.js`, and
 * `meter-signature-dispatch-integration.test.js` already use.
 *
 * Scope: the Logo-dispatch <-> ToneActions seam only, not SetTimbreBlock's own palette
 * registration (already covered, with setTimbre mocked, by js/blocks/__tests__/ToneBlocks.test.js).
 * `Logo.runFromBlockNow` and `setTimbre` run for real; the "settimbre" block below is a minimal
 * stand-in copied from SetTimbreBlock.flow (js/blocks/ToneBlocks.js), not a live protoblock - see
 * meter-signature-dispatch-integration.test.js for why (protoblocks.js/blocks.js are
 * DOM/canvas-heavy and disproportionate to this one behavior). LIMITATION: because the flow body
 * is copied rather than exercised from the real block class, a regression in
 * SetTimbreBlock.flow itself (as opposed to setTimbre or the Logo dispatch machinery around it)
 * would not be caught here - see the inline comment at the copy site below.
 *
 * Unlike setMeter (a synchronous write, no clamp), setTimbre is a clamp-body action: it pushes
 * the resolved synth onto tur.singer.instrumentNames and sets tur.inSetTimbre *before* the
 * clamp's contained blocks run, and only pops/resets them once the real interpreter fires the
 * end-of-clamp listener at the clamp's "hidden" block (the same shape doVibrato/doChorus/
 * doPhaser/doTremolo/doDistortion/doHarmonic share). A "probe" block placed *inside* the clamp
 * snapshots that state mid-lifecycle - the deterministic, timing-independent observable this test
 * asserts on; no Tone.js scheduling or playback is involved or awaited.
 */

// Setup global mocks BEFORE requiring the module (mirror of meter-signature-dispatch-integration.test.js).
global._ = str => str;
global.Notation = jest.fn().mockImplementation(() => ({}));
global.Synth = jest.fn().mockImplementation(() => ({}));
global.Singer = {};
global.last = arr => arr[arr.length - 1];
global.VOICENAMES = {
    Piano: ["piano", "grand-piano"]
};
global.CUSTOMSAMPLES = {};
global.DEFAULTVOICE = "default-voice";

// setTimbre's fallback dispatch path (via a global MusicBlocks/Mouse, used only when blk isn't a
// registered block) is unreachable here: blk 0 is always present in activity.blocks.blockList
// below, so MusicBlocks/Mouse are intentionally left undefined rather than mocked unused.

jest.mock("tone", () => ({
    UserMedia: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
}));

global.EmbeddedGraphicsScheduler =
    require("../embedded-graphics-scheduler").EmbeddedGraphicsScheduler;

const logoconstants = require("../logoconstants");
Object.assign(global, logoconstants);

const { Logo } = require("../logo");

// Singer.ToneActions is attached to the module-level `Singer` mock above, exactly as
// production code does via `Singer.ToneActions = class {...}` (js/turtleactions/ToneActions.js).
// No production code is mocked: setTimbre runs for real.
const setupToneActions = require("../turtleactions/ToneActions");

function createTurtle() {
    return {
        inSetTimbre: false,
        singer: {
            instrumentNames: [],
            synthVolume: { "default-voice": [1] },
            crescendoInitialVolume: { "default-voice": [1] },
            inNoteBlock: [],
            inDuplicate: false,
            backward: [],
            suppressOutput: true,
            justCounting: []
        },
        painter: { closeSVG: jest.fn() },
        queue: [],
        parentFlowQueue: [],
        listeners: {},
        endOfClampSignals: {}
    };
}

function createActivity(turtle) {
    return {
        blocks: {
            blockList: [],
            sameGeneration: jest.fn(() => false)
        },
        turtles: {
            turtleList: [turtle],
            ithTurtle: jest.fn(() => turtle),
            getTurtle: jest.fn(() => turtle),
            running: jest.fn(() => false)
        },
        stage: {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(name => {
                if (typeof name === "string" && turtle.listeners[name]) {
                    turtle.listeners[name]();
                }
            })
        },
        onStopTurtle: jest.fn()
    };
}

function makeFlowBlock(name, connections, flow, dockTypes, args) {
    return {
        name,
        connections,
        protoblock: {
            args: args || 0,
            dockTypes: dockTypes || [null],
            flow: flow || (() => null)
        },
        isValueBlock: () => false,
        isArgBlock: () => false
    };
}

describe("Logo dispatch drives the real Singer.ToneActions.setTimbre", () => {
    let logo;
    let turtle;
    let activity;
    let probeCallCount;
    let instrumentNamesDuringClamp;
    let inSetTimbreDuringClamp;

    beforeEach(() => {
        jest.clearAllMocks();
        global.document.body.style.cursor = "default";
        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        // logo.synth is a plain instance property (js/logo.js) backed by the global Synth mock,
        // which returns {} - reassign it to a stand-in exposing just the audio-loading boundary
        // setTimbre calls, since loading a real Tone.js synth is the unavoidable audio
        // infrastructure this test cannot run for real.
        logo.synth = { loadSynth: jest.fn(), createSynth: jest.fn() };
        probeCallCount = 0;
        instrumentNamesDuringClamp = null;
        inSetTimbreDuringClamp = null;

        setupToneActions(activity);

        // settimbre (0): connections [prev, voiceArg, clampEntry, next] - the connections shape
        // produced when the "settimbre" block is dragged from the Tone palette (see
        // SetTimbreBlock's own makeMacro, js/blocks/ToneBlocks.js).
        // voice (1):     voicename value "piano" (resolves through the real VOICENAMES lookup
        //                 to synth "grand-piano", proving this reaches the real mapping in
        //                 setTimbre rather than a hardcoded pass-through).
        // probe (2):      synthetic leaf block standing in for "whatever block(s) the user placed
        //                 inside the settimbre clamp" - it does not exist as a real MB block; it
        //                 only reads turtle-singer state so the push (already applied by the time
        //                 it runs) is observable before the real end-of-clamp listener pops it.
        // hidden (3):     connections [prev, null] (end of clamp) - reaching this block is what
        //                 fires setTimbre's real dispatch listener.
        const hidden = makeFlowBlock("hidden", [0, null], null);
        const probe = makeFlowBlock("probe", [0, null], () => {
            probeCallCount++;
            instrumentNamesDuringClamp = [...turtle.singer.instrumentNames];
            inSetTimbreDuringClamp = turtle.inSetTimbre;
            return null;
        });
        const settimbre = makeFlowBlock(
            "settimbre",
            [null, 1, 2, 3],
            (args, l, t, blk) => {
                // Copied verbatim from SetTimbreBlock.flow (js/blocks/ToneBlocks.js), minus the
                // inRhythmRuler/inSample branches - see the file-level comment above for why this
                // isn't a live protoblock. LIMITATION: because it's a copy, a regression in the
                // real SetTimbreBlock.flow (e.g. a bad edit to this branching) would not fail
                // this test - only ToneBlocks.test.js (mocked setTimbre) guards that class
                // directly. activity.errorMsg is intentionally left unmocked below: neither test
                // input ("piano"/"kazoo") is null, so this branch never runs.
                if (args[0] === null) {
                    activity.errorMsg(NOINPUTERRORMSG, blk);
                } else {
                    Singer.ToneActions.setTimbre(args[0], t, blk);
                }
                return [args[1], 1];
            },
            [null, "anyin", "in", "in"],
            2
        );
        const voice = {
            name: "voicename",
            value: "piano",
            connections: [],
            protoblock: { parameter: false, dockTypes: ["anyout"] },
            isValueBlock: () => true,
            isArgBlock: () => false
        };

        const blocks = [settimbre, voice, probe, hidden];
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    });

    test("pushes the real resolved synth and inSetTimbre flag before the clamp body runs, and pops them after", () => {
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        expect(probeCallCount).toBe(1);

        // While the clamp body ran, the real setTimbre had already resolved "piano" through the
        // real VOICENAMES table to "grand-piano" and pushed it/flagged inSetTimbre.
        expect(instrumentNamesDuringClamp).toEqual(["grand-piano"]);
        expect(inSetTimbreDuringClamp).toBe(true);

        // The real Logo interpreter reached the clamp's "hidden" block and fired setTimbre's
        // real dispatch listener, which popped instrumentNames and cleared inSetTimbre - proving
        // the pop is driven by dispatch, not by setTimbre itself.
        expect(turtle.singer.instrumentNames).toEqual([]);
        expect(turtle.inSetTimbre).toBe(false);

        // The audio-loading boundary was reached with the same resolved synth name.
        expect(logo.synth.loadSynth).toHaveBeenCalledWith(0, "grand-piano");
    });

    test("an unknown voice name falls through to itself as the synth, still driven end-to-end by dispatch", () => {
        const blocks = activity.blocks.blockList;
        blocks[1].value = "kazoo";

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        expect(probeCallCount).toBe(1);

        // Same push-before/pop-after clamp lifecycle as the known-voice case above, just with
        // "kazoo" falling through VOICENAMES unresolved to become its own synth name.
        expect(instrumentNamesDuringClamp).toEqual(["kazoo"]);
        expect(inSetTimbreDuringClamp).toBe(true);

        expect(turtle.singer.instrumentNames).toEqual([]);
        expect(turtle.inSetTimbre).toBe(false);

        expect(logo.synth.loadSynth).toHaveBeenCalledWith(0, "kazoo");
    });
});
