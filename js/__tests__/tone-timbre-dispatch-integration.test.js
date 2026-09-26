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
 * Integration test for the Logo -> Singer.ToneActions.setTimbre dispatch seam: real
 * `Logo.runFromBlockNow` (js/logo.js) driving the real `setTimbre`
 * (js/turtleactions/ToneActions.js), extending the pattern `noteclamp-beat-doublequeue.test.js`,
 * `pitch-note-dispatch-integration.test.js`, and `meter-signature-dispatch-integration.test.js`
 * already use. Not a test of SetTimbreBlock's palette registration (already covered, with
 * setTimbre mocked, by js/blocks/__tests__/ToneBlocks.test.js) or of its flow()'s own
 * validation/branching - the "settimbre" fixture block below only calls setTimbre with Logo's
 * evaluated args, it does not reproduce SetTimbreBlock.flow(). It isn't a live protoblock because
 * FlowClampBlock (js/protoblocks.js) is a bare global only in the production script-concatenation
 * build and isn't exported for require() - see meter-signature-dispatch-integration.test.js.
 *
 * setTimbre is a clamp-body action, unlike setMeter's synchronous write: it pushes the resolved
 * synth onto tur.singer.instrumentNames and sets tur.inSetTimbre *before* the clamp's contained
 * blocks run, and only pops/resets them once the real interpreter fires the end-of-clamp listener
 * at the clamp's "hidden" block (the same shape doVibrato/doChorus/doPhaser/doTremolo/
 * doDistortion/doHarmonic share). A "probe" block placed *inside* the clamp snapshots that state
 * mid-lifecycle - the deterministic, timing-independent observable these tests assert on; no
 * Tone.js scheduling or playback is involved or awaited.
 *
 * VOICENAMES is required directly from the real js/utils/synthutils.js, not a fixture. Under the
 * identity `_()` mock below (no i18n bootstrap), every entry's display name equals its synth key,
 * so a recognized voice resolves to the same string it was given - these tests can show real
 * table membership and dispatch timing, not a name transformation. The custom-sample case covers
 * setTimbre's one translation-independent, genuinely transformative branch instead.
 */

global._ = str => str;
global.Notation = jest.fn().mockImplementation(() => ({}));
global.Synth = jest.fn().mockImplementation(() => ({}));
global.Singer = {};
global.last = arr => arr[arr.length - 1];
global.VOICENAMES = require("../utils/synthutils").VOICENAMES;
global.CUSTOMSAMPLES = {};
global.DEFAULTVOICE = "default-voice";

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
// production code does via `Singer.ToneActions = class {...}`. No production code is mocked.
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
        // Mutable globals setTimbre writes into - reset per test so no test's outcome depends on
        // suite/declaration order.
        global.CUSTOMSAMPLES = {};

        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        // logo.synth is a plain instance property (js/logo.js); reassign it to a stand-in exposing
        // just the audio-loading boundary setTimbre calls - loading a real Tone.js synth is the
        // unavoidable audio infrastructure this test cannot run for real.
        logo.synth = { loadSynth: jest.fn(), createSynth: jest.fn() };
        probeCallCount = 0;
        instrumentNamesDuringClamp = null;
        inSetTimbreDuringClamp = null;

        setupToneActions(activity);

        // settimbre (0) -> voice (1, a "voicename" value) -> probe (2, inside the clamp) ->
        // hidden (3, end of clamp). Connections mirror SetTimbreBlock's makeMacro
        // (js/blocks/ToneBlocks.js); "probe" stands in for whatever the user placed inside the
        // clamp and only reads turtle-singer state, so it observes the push before the real
        // end-of-clamp listener (fired when dispatch reaches "hidden") pops it.
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
            // Minimal glue, not a copy of SetTimbreBlock.flow(): hand Logo's evaluated voice arg
            // to the real setTimbre and continue into the clamp body.
            (args, l, t, blk) => {
                Singer.ToneActions.setTimbre(args[0], t, blk);
                return [args[1], 1];
            },
            [null, "anyin", "in", "in"],
            2
        );
        const voice = {
            name: "voicename",
            value: "cello",
            connections: [],
            protoblock: { parameter: false, dockTypes: ["anyout"] },
            isValueBlock: () => true,
            isArgBlock: () => false
        };

        const blocks = [settimbre, voice, probe, hidden];
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    });

    test.each([
        ["cello", "cello"], // a real VOICENAMES entry - resolves to its own synth key
        ["kazoo", "kazoo"] // absent from the real table - falls through unresolved
    ])(
        'pushes %s before the clamp body runs and pops it once dispatch reaches "hidden"',
        (voiceValue, expectedSynth) => {
            activity.blocks.blockList[1].value = voiceValue;

            logo.runFromBlockNow(logo, 0, 0, 1, null);

            expect(probeCallCount).toBe(1);
            expect(instrumentNamesDuringClamp).toEqual([expectedSynth]);
            expect(inSetTimbreDuringClamp).toBe(true);

            // The real Logo interpreter reached "hidden" and fired setTimbre's real dispatch
            // listener, which popped instrumentNames and cleared inSetTimbre - proving the pop is
            // driven by dispatch, not by setTimbre itself.
            expect(turtle.singer.instrumentNames).toEqual([]);
            expect(turtle.inSetTimbre).toBe(false);
            expect(logo.synth.loadSynth).toHaveBeenCalledWith(0, expectedSynth);
        }
    );

    test("a custom-sample instrument is transformed into a distinct synth name, independent of VOICENAMES", () => {
        // setTimbre's one branch that actually changes the input rather than passing it through:
        // an object instrument ([name, data, pitch, octave], the shape a custom-sample voicename
        // block produces) is never matched by the string-keyed VOICENAMES loop, so it falls into
        // the "customsample_" + name branch instead.
        activity.blocks.blockList[1].value = ["mysample", "data:audio/wav;base64,AAAA", "sol", 4];

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        expect(probeCallCount).toBe(1);
        expect(instrumentNamesDuringClamp).toEqual(["customsample_mysample"]);
        expect(inSetTimbreDuringClamp).toBe(true);
        expect(CUSTOMSAMPLES["customsample_mysample"]).toEqual([
            "data:audio/wav;base64,AAAA",
            "sol",
            4
        ]);

        expect(turtle.singer.instrumentNames).toEqual([]);
        expect(turtle.inSetTimbre).toBe(false);
        expect(logo.synth.loadSynth).toHaveBeenCalledWith(0, "customsample_mysample");
    });
});
