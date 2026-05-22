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

/* global jest, describe, it, expect, beforeEach */

const {
    AIWidget,
    adjustPitch,
    abcToStandardValue,
    createPitchBlocks,
    searchIndexForMusicBlock
} = require("../aiwidget");

// Mock globals
global._ = jest.fn(str => str);
global.docById = jest.fn(() => ({
    style: {},
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    innerHTML: ""
}));
global.toFraction = jest.fn(d => [1, d]); // Simple mock: 1/d
global.ensureABCJS = jest.fn(() => Promise.resolve());
global.Tone = {
    Analyser: jest.fn(() => ({
        connect: jest.fn(),
        dispose: jest.fn()
    }))
};
global.ABCJS = {
    parseOnly: jest.fn(() => [])
};
global.getVoiceSynthName = jest.fn(() => "mock-synth");
global.platformColor = jest.fn(() => "#000000");
global.slicePath = jest.fn(p => p);
global.DOUBLEFLAT = "𝄫";
global.FLAT = "♭";
global.NATURAL = "♮";
global.SHARP = "♯";
global.DOUBLESHARP = "𝄪";
global.instruments = [{}];
global.REFERENCESAMPLE = "electronic synth";

describe("AIWidget Utilities", () => {
    describe("adjustPitch", () => {
        it("should return the note name unchanged if no accidental matches in key signature", () => {
            const keySignature = { accidentals: [] };
            expect(adjustPitch("C", keySignature)).toBe("C");
        });

        it("should append sharp if note is in key signature as sharp", () => {
            const keySignature = {
                accidentals: [{ note: "F", acc: "sharp" }]
            };
            expect(adjustPitch("F", keySignature)).toBe("F♯");
        });

        it("should append flat if note is in key signature as flat", () => {
            const keySignature = {
                accidentals: [{ note: "B", acc: "flat" }]
            };
            expect(adjustPitch("B", keySignature)).toBe("B♭");
        });

        it("should be case-insensitive for note matching", () => {
            const keySignature = {
                accidentals: [{ note: "f", acc: "sharp" }]
            };
            expect(adjustPitch("F", keySignature)).toBe("F♯");
        });

        it("should return note unchanged for unsupported accidental types", () => {
            const keySignature = {
                accidentals: [{ note: "C", acc: "natural" }]
            };
            expect(adjustPitch("C", keySignature)).toBe("C");
        });
    });

    describe("abcToStandardValue", () => {
        it("should map pitch value to octave (Math.floor(p/7) + 4)", () => {
            expect(abcToStandardValue(0)).toBe(4);
            expect(abcToStandardValue(7)).toBe(5);
            expect(abcToStandardValue(14)).toBe(6);
            expect(abcToStandardValue(-7)).toBe(3);
        });
    });

    describe("searchIndexForMusicBlock", () => {
        it("should find the index of a block by its ID", () => {
            const array = [
                [10, "start"],
                [20, "pitch"],
                [30, "hidden"]
            ];
            expect(searchIndexForMusicBlock(array, 20)).toBe(1);
            expect(searchIndexForMusicBlock(array, 30)).toBe(2);
            expect(searchIndexForMusicBlock(array, 40)).toBe(-1);
        });

        it("should handle empty or malformed arrays", () => {
            expect(searchIndexForMusicBlock([], 10)).toBe(-1);
            expect(searchIndexForMusicBlock([null, [10]], 10)).toBe(1);
        });
    });

    describe("createPitchBlocks", () => {
        it("should push the correct block structure to actionBlock", () => {
            const actionBlock = [];
            const pitches = { name: "C", pitch: 0 };
            const keySignature = { accidentals: [] };

            createPitchBlocks(pitches, 100, 4, keySignature, actionBlock, null, 4);

            // Should add 9 blocks based on the implementation
            expect(actionBlock.length).toBe(9);

            // Check newnote block
            expect(actionBlock[0][0]).toBe(100);
            expect(actionBlock[0][1][0]).toBe("newnote");

            // Check pitch block and its values
            const pitchBlock = actionBlock.find(b => b[1] === "pitch");
            expect(pitchBlock).toBeDefined();

            const notenameBlock = actionBlock.find(b => b[1].length && b[1][0] === "notename");
            expect(notenameBlock[1][1].value).toBe("C");
        });

        it("should handle triplets correctly", () => {
            const actionBlock = [];
            const pitches = { name: "C", pitch: 0 };
            const keySignature = { accidentals: [] };

            // triplet = 3, meterDen = 4. Duration becomes [1, 4 * 3]
            createPitchBlocks(pitches, 100, 4, keySignature, actionBlock, 3, 4);

            const divideBlock = actionBlock.find(b => b[1] === "divide");
            const denominatorBlockId = divideBlock[4][2];
            const denominatorBlock = actionBlock.find(b => b[0] === denominatorBlockId);

            expect(denominatorBlock[1][1].value).toBe(12); // 4 * 3
        });
    });
});

describe("AIWidget Instance", () => {
    let aiWidget;
    let mockActivity;
    let originalFetch;

    beforeEach(() => {
        mockActivity = {
            logo: {
                synth: {
                    loadSynth: jest.fn()
                },
                textMsg: jest.fn()
            },
            blocks: {
                loadNewBlocks: jest.fn()
            },
            errorMsg: jest.fn(),
            textMsg: jest.fn()
        };

        // Setup widgetWindows on the global window object
        global.window.widgetWindows = {
            windowFor: jest.fn(() => ({
                clear: jest.fn(),
                show: jest.fn(),
                destroy: jest.fn(),
                sendToCenter: jest.fn(),
                isMaximized: jest.fn(() => false),
                getWidgetFrame: jest.fn(() => ({
                    getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 }))
                })),
                getWidgetBody: jest.fn(() => {
                    const div = document.createElement("div");
                    div.getBoundingClientRect = jest.fn(() => ({ width: 800, height: 600 }));
                    return div;
                }),
                addButton: jest.fn(() => ({
                    onclick: null
                })),
                addCheckbox: jest.fn(() => ({
                    onclick: null
                })),
                addSlider: jest.fn(() => ({
                    oninput: null
                })),
                addLabel: jest.fn(() => ({})),
                onclose: null,
                onmaximize: null,
                onresize: null
            }))
        };

        aiWidget = new AIWidget();
        // Since aiwidget.js uses wheelnav as a global if present
        global.wheelnav = jest.fn();
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it("should initialize correctly", () => {
        aiWidget.init(mockActivity);
        expect(aiWidget.activity).toBe(mockActivity);
        expect(mockActivity.logo.synth.loadSynth).toHaveBeenCalled();
    });

    it("should handle sample length warnings", () => {
        aiWidget.init(mockActivity);
        aiWidget.sampleData = "a".repeat(1333334); // Just over the limit
        aiWidget.getSampleLength();
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(
            "Warning: Sample is bigger than 1MB.",
            undefined
        );
    });

    it("should debounce generate blocks action and prevent duplicate saves", () => {
        jest.useFakeTimers();
        let generateButtonHandler;
        mockActivity.storage = {
            groq_api_key: "test-key"
        };
        global.window.widgetWindows.windowFor = jest.fn(() => ({
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            sendToCenter: jest.fn(),
            isMaximized: jest.fn(() => false),
            getWidgetFrame: jest.fn(() => ({
                getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 }))
            })),
            getWidgetBody: jest.fn(() => {
                const div = document.createElement("div");
                div.getBoundingClientRect = jest.fn(() => ({
                    width: 800,
                    height: 600
                }));
                return div;
            }),
            addButton: jest.fn(iconName => {
                const button = { onclick: null };
                if (iconName === "export-chunk.svg") {
                    generateButtonHandler = button;
                }
                return button;
            })
        }));
        aiWidget = new AIWidget();
        aiWidget._saveSample = jest.fn();
        aiWidget.init(mockActivity);
        generateButtonHandler.onclick();
        generateButtonHandler.onclick();
        generateButtonHandler.onclick();
        expect(aiWidget._saveSample).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(1000);
        generateButtonHandler.onclick();
        expect(aiWidget._saveSample).toHaveBeenCalledTimes(2);
        jest.useRealTimers();
    });

    it("should clean up analysers and animation frames on widget close", () => {
        const cancelAnimationFrameMock = jest.fn();
        global.cancelAnimationFrame = cancelAnimationFrameMock;
        const disposeMock = jest.fn();
        global.Tone.Analyser = jest.fn(() => ({
            dispose: disposeMock
        }));
        global.instruments = [
            {
                piano: {
                    disconnect: jest.fn(),
                    connect: jest.fn()
                }
            }
        ];
        let widgetInstance;
        global.window.widgetWindows.windowFor = jest.fn(() => {
            widgetInstance = {
                clear: jest.fn(),
                show: jest.fn(),
                destroy: jest.fn(),
                sendToCenter: jest.fn(),
                isMaximized: jest.fn(() => false),
                getWidgetFrame: jest.fn(() => ({
                    getBoundingClientRect: jest.fn(() => ({
                        width: 800,
                        height: 600
                    }))
                })),
                getWidgetBody: jest.fn(() => {
                    const div = document.createElement("div");
                    div.getBoundingClientRect = jest.fn(() => ({
                        width: 800,
                        height: 600
                    }));
                    return div;
                }),
                addButton: jest.fn(() => ({ onclick: null })),
                onclose: null
            };
            return widgetInstance;
        });
        aiWidget = new AIWidget();
        aiWidget.drawVisualIDs = {
            one: 11,
            two: 22
        };
        aiWidget.pitchAnalysers = {
            0: {
                dispose: disposeMock
            }
        };
        aiWidget.init(mockActivity);
        aiWidget.drawVisualIDs = {
            one: 11,
            two: 22
        };
        aiWidget.pitchAnalysers = {
            0: {
                dispose: disposeMock
            }
        };
        widgetInstance.onclose();
        expect(cancelAnimationFrameMock).toHaveBeenCalledWith(11);
        expect(cancelAnimationFrameMock).toHaveBeenCalledWith(22);
        expect(disposeMock).toHaveBeenCalled();
        expect(widgetInstance.destroy).toHaveBeenCalled();
        expect(aiWidget.pitchAnalysers).toEqual({});
    });

    it("should handle synth initialization failures gracefully", async () => {
        const resumeMock = jest.fn(() => Promise.resolve());
        const initMock = jest.fn(() => Promise.reject(new Error("init failed")));
        global.ABCJS = {
            renderAbc: jest.fn(() => [
                {
                    millisecondsPerMeasure: jest.fn(() => 1000)
                }
            ]),
            synth: {
                supportsAudio: jest.fn(() => true),
                CreateSynth: jest.fn(() => ({
                    init: initMock,
                    prime: jest.fn(),
                    start: jest.fn(),
                    stop: jest.fn()
                }))
            }
        };
        aiWidget = new AIWidget();
        mockActivity.logo.synth = {
            tone: {
                context: {
                    resume: resumeMock
                }
            }
        };
        aiWidget.activity = mockActivity;
        await aiWidget._playABCSong();
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(
            expect.stringContaining("Synth error: init failed")
        );
    });

    it("should prevent submission when API key is missing", () => {
        global.alert = jest.fn();
        aiWidget = new AIWidget();
        mockActivity.storage = {};
        const widgetBody = document.createElement("div");
        const widgetWindowMock = {
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            sendToCenter: jest.fn(),
            isMaximized: jest.fn(() => false),
            getWidgetFrame: jest.fn(() => ({
                getBoundingClientRect: jest.fn(() => ({
                    width: 800,
                    height: 600
                }))
            })),
            getWidgetBody: jest.fn(() => widgetBody),
            addButton: jest.fn(() => ({ onclick: null }))
        };
        aiWidget.widgetWindow = widgetWindowMock;
        aiWidget.activity = mockActivity;
        aiWidget.makeCanvas(800, 400);
        const input = widgetBody.querySelector(".inputField");
        const submitButton = widgetBody.querySelector(".submitButton");
        input.value = "generate melody";
        global.fetch = jest.fn();
        submitButton.onclick();
        expect(global.alert).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should display API error messages from Groq responses", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        error: {
                            message: "invalid api key"
                        }
                    })
            })
        );
        aiWidget = new AIWidget();
        mockActivity.storage = {
            groq_api_key: "test-key"
        };
        const widgetBody = document.createElement("div");
        aiWidget.widgetWindow = {
            getWidgetBody: jest.fn(() => widgetBody)
        };
        aiWidget.activity = mockActivity;
        aiWidget.makeCanvas(800, 400);
        const input = widgetBody.querySelector(".inputField");
        const submitButton = widgetBody.querySelector(".submitButton");
        const textarea = widgetBody.querySelector(".samplerTextarea");
        input.value = "generate melody";
        submitButton.onclick();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(textarea.value).toContain("Groq API Error: invalid api key");
        expect(submitButton.disabled).toBe(false);
    });

    it("should handle malformed AI responses without choices", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({})
            })
        );
        aiWidget = new AIWidget();
        mockActivity.storage = {
            groq_api_key: "test-key"
        };
        const widgetBody = document.createElement("div");
        aiWidget.widgetWindow = {
            getWidgetBody: jest.fn(() => widgetBody)
        };
        aiWidget.activity = mockActivity;
        aiWidget.makeCanvas(800, 400);
        const input = widgetBody.querySelector(".inputField");
        const submitButton = widgetBody.querySelector(".submitButton");
        const textarea = widgetBody.querySelector(".samplerTextarea");
        input.value = "generate melody";
        submitButton.onclick();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(textarea.value).toContain("Error: Unexpected response format from AI.");
        expect(submitButton.disabled).toBe(false);
    });

    it("should show an error when audio is not supported", async () => {
        global.ABCJS = {
            renderAbc: jest.fn(() => [
                {
                    millisecondsPerMeasure: jest.fn(() => 1000)
                }
            ]),
            synth: {
                supportsAudio: jest.fn(() => false)
            }
        };
        aiWidget = new AIWidget();
        aiWidget.activity = mockActivity;
        await aiWidget._playABCSong();
        expect(mockActivity.errorMsg).toHaveBeenCalledWith("Audio not supported in this browser.");
    });

    it("should remove old interface containers before rerendering", () => {
        aiWidget = new AIWidget();
        const widgetBody = document.createElement("div");
        const oldContainer1 = document.createElement("div");
        oldContainer1.className = "ai-interface-container";
        const oldContainer2 = document.createElement("div");
        oldContainer2.className = "ai-interface-container";
        widgetBody.appendChild(oldContainer1);
        widgetBody.appendChild(oldContainer2);
        const makeCanvasSpy = jest.spyOn(aiWidget, "makeCanvas").mockImplementation(() => {});
        aiWidget.widgetWindow = {
            getWidgetBody: jest.fn(() => widgetBody),
            getWidgetFrame: jest.fn(() => ({
                getBoundingClientRect: jest.fn(() => ({
                    height: 600
                }))
            })),
            isMaximized: jest.fn(() => false)
        };
        aiWidget.reconnectSynthsToAnalyser = jest.fn();
        aiWidget._scale();
        expect(widgetBody.getElementsByClassName("ai-interface-container").length).toBe(0);
        expect(makeCanvasSpy).toHaveBeenCalled();
        expect(aiWidget.reconnectSynthsToAnalyser).toHaveBeenCalled();
    });

    it("should normalize markdown-wrapped AI responses before displaying ABC notation", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        choices: [
                            {
                                message: {
                                    content: "```abc\nX:1\nT:Test\nK:C\nC D E F\n```"
                                }
                            }
                        ]
                    })
            })
        );
        aiWidget = new AIWidget();
        mockActivity.storage = {
            groq_api_key: "test-key"
        };
        const widgetBody = document.createElement("div");
        aiWidget.widgetWindow = {
            getWidgetBody: jest.fn(() => widgetBody)
        };

        aiWidget.activity = mockActivity;
        aiWidget.makeCanvas(800, 400);
        const input = widgetBody.querySelector(".inputField");
        const submitButton = widgetBody.querySelector(".submitButton");
        const textarea = widgetBody.querySelector(".samplerTextarea");

        input.value = "generate melody";
        submitButton.onclick();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(textarea.value).toContain("X:1");
        expect(textarea.value).not.toContain("```");
        expect(submitButton.disabled).toBe(false);
    });

    it("should extract ABC notation from mixed AI responses", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        choices: [
                            {
                                message: {
                                    content: "Here is your melody:\n\nX:1\nT:Demo\nK:C\nC D E F"
                                }
                            }
                        ]
                    })
            })
        );
        aiWidget = new AIWidget();
        mockActivity.storage = {
            groq_api_key: "test-key"
        };
        const widgetBody = document.createElement("div");
        aiWidget.widgetWindow = {
            getWidgetBody: jest.fn(() => widgetBody)
        };
        aiWidget.activity = mockActivity;
        aiWidget.makeCanvas(800, 400);
        const input = widgetBody.querySelector(".inputField");
        const submitButton = widgetBody.querySelector(".submitButton");
        const textarea = widgetBody.querySelector(".samplerTextarea");
        input.value = "generate melody";
        submitButton.onclick();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(textarea.value.startsWith("X:1")).toBe(true);
        expect(textarea.value).not.toContain("Here is your melody");
        expect(submitButton.disabled).toBe(false);
    });

    it("should use maximized dimensions during scale recalculation", () => {
        aiWidget = new AIWidget();
        const widgetBody = document.createElement("div");
        const makeCanvasSpy = jest.spyOn(aiWidget, "makeCanvas").mockImplementation(() => {});
        aiWidget.widgetWindow = {
            getWidgetBody: jest.fn(() => widgetBody),
            getWidgetFrame: jest.fn(() => ({
                getBoundingClientRect: jest.fn(() => ({
                    height: 900
                }))
            })),
            isMaximized: jest.fn(() => true)
        };
        const originalWidth = global.window.innerWidth;
        const originalHeight = global.window.innerHeight;

        global.window.innerWidth = 1600;
        global.window.innerHeight = 1000;
        aiWidget.reconnectSynthsToAnalyser = jest.fn();
        aiWidget._scale();
        expect(makeCanvasSpy).toHaveBeenCalledWith(0, 830, 0, true);
        global.window.innerWidth = originalWidth;
        global.window.innerHeight = originalHeight;
    });

    describe("_parseABC", () => {
        it("should organize staffs by staff index across multiple lines", async () => {
            aiWidget = new AIWidget();
            aiWidget.activity = mockActivity;
            const tune = {
                lines: [
                    {
                        staff: [
                            {
                                voices: [
                                    [
                                        {
                                            el_type: "note",
                                            pitches: [
                                                {
                                                    name: "C",
                                                    pitch: 0
                                                }
                                            ],
                                            duration: 0.25
                                        }
                                    ]
                                ],
                                key: {
                                    accidentals: []
                                },
                                meter: {
                                    value: [
                                        {
                                            num: 4,
                                            den: 4
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                    {
                        staff: [
                            {
                                voices: [
                                    [
                                        {
                                            el_type: "note",
                                            pitches: [
                                                {
                                                    name: "C",
                                                    pitch: 0
                                                }
                                            ],
                                            duration: 0.25
                                        }
                                    ]
                                ],
                                key: {
                                    accidentals: []
                                },
                                meter: {
                                    value: [
                                        {
                                            num: 4,
                                            den: 4
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ],
                metaText: {
                    title: "Test Tune"
                }
            };

            await aiWidget._parseABC(tune);
            expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalledTimes(1);
        });
    });
});
