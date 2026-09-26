/**
 * @file TemperamentUI.test.js
 * @description Unit tests for TemperamentUI module (PR #8815).
 *
 * @license
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library; if not, write to the Free
 * Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

const ManagedTimer = require("../../utils/ManagedTimer");
global.ManagedTimer = ManagedTimer;

const TemperamentUI = require("../TemperamentUI");
const TemperamentWidget = require("../temperament");

describe("TemperamentUI module", () => {
    let mockTW;
    let capturedWheelnavInstances = [];

    const createMockElement = id => ({
        id: id,
        innerHTML: "",
        textContent: "",
        value: "1",
        appendChild: jest.fn(),
        setAttribute: jest.fn(),
        style: {},
        width: 100,
        height: 100,
        dataset: { message: "1" },
        append: jest.fn(),
        remove: jest.fn(),
        getElementsByTagName: jest.fn(() => [createMockElement("img")]),
        addEventListener: jest.fn(),
        getContext: jest.fn(() => ({
            beginPath: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn(),
            stroke: jest.fn(),
            clearRect: jest.fn(),
            fillText: jest.fn(),
            setLineDash: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            lineWidth: 0,
            fillStyle: "",
            strokeStyle: ""
        })),
        getBoundingClientRect: jest.fn(() => ({ left: 0, top: 0 })),
        parentElement: { clientWidth: 400, clientHeight: 500 },
        children: []
    });

    const createMockWheelnav = (divId, p2, p3, p4) => {
        const wheel = {
            divId: divId,
            wheelRadius: 0,
            navItemsEnabled: true,
            navAngle: 0,
            navItemsContinuous: false,
            navItemsCentered: false,
            slicePathFunction: null,
            slicePathCustom: {
                menuRadius: 0,
                titleRadius: 0,
                minRadiusPercent: 0,
                maxRadiusPercent: 0
            },
            sliceSelectedPathCustom: null,
            sliceInitPathCustom: null,
            navItemCount: 0,
            navItems: Array.from({ length: 60 }, () => ({
                fillAttr: "",
                sliceHoverAttr: {},
                slicePathAttr: {},
                sliceSelectedAttr: {},
                titleAttr: { font: "" },
                titleSelectedAttr: { font: "" },
                sliceAngle: 0,
                menuRadius: 0
            })),
            initWheelArgs: null,
            initWheel: jest.fn(labels => {
                wheel.initWheelArgs = labels ? [...labels] : [];
                wheel.navItemCount = labels.length;
            }),
            createWheel: jest.fn(),
            refreshWheel: jest.fn(),
            removeWheel: jest.fn()
        };
        wheel.sliceSelectedPathCustom = wheel.slicePathCustom;
        wheel.sliceInitPathCustom = wheel.slicePathCustom;
        capturedWheelnavInstances.push(wheel);
        return wheel;
    };

    beforeEach(() => {
        capturedWheelnavInstances = [];
        document.body.innerHTML = `
            <div id="userEdit"></div>
            <div id="temperamentTableDiv"></div>
            <div id="wheelDiv2"></div>
            <div id="wheelDiv3"></div>
            <div id="wheelDiv4"></div>
        `;
        global._ = jest.fn(str => str);
        global.platformColor = {
            selectorBackground: "#e0e0e0",
            selectorBackgroundHOVER: "#eee",
            labelColor: "#ddd",
            strokeColor: "#003300"
        };
        global.ratioToWheelAngle = jest.fn((ratio, powerBase) => {
            return 270 + 360 * (Math.log10(ratio) / Math.log10(powerBase || 2));
        });
        global.frequencyToPitch = jest.fn(() => ["C", 4, 0]);
        global.Singer = { defaultBPMFactor: 1, masterVolume: [1] };
        global.slicePath = jest.fn(() => ({
            MenuSliceWithoutLine: jest.fn(),
            MenuSliceCustomization: jest.fn(() => ({ menuRadius: 0, titleRadius: 0 })),
            DonutSlice: jest.fn(),
            DonutSliceCustomization: jest.fn(() => ({ minRadiusPercent: 0, maxRadiusPercent: 0 }))
        }));
        global.wheelnav = jest.fn((divId, p2, p3, p4) => createMockWheelnav(divId, p2, p3, p4));

        global.isCustomTemperament = jest.fn(name => name === "custom");
        global.getTemperamentsList = jest.fn(() => [["Equal (12EDO)", "equal"]]);
        global.getTemperament = jest.fn(() => ({
            interval: ["unison", "octave"],
            pitchNumber: 2,
            unison: 1,
            octave: 2,
            0: 1,
            1: 2,
            noteLabels: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"]
        }));
        global.buildScale = jest.fn(() => [["C"], []]);
        global.getTemperamentRatio = jest.fn(() => 1);
        global.rationalToFraction = jest.fn(() => [1, 1]);
        global.parseNoteString = jest.fn(() => ["C", 4]);
        global.getNoteFromInterval = jest.fn(() => ["C", 4]);
        global._stripCents = jest.fn(s => s);
        global.normalizeNoteAccidentals = jest.fn(s => s);
        global.last = arr => arr[arr.length - 1];

        global.docById = jest.fn(id => {
            const el = document.getElementById(id);
            if (id === "octaveIn" || id === "ratioIn" || id === "startNote") {
                return el;
            }
            return el || createMockElement(id);
        });

        mockTW = {
            activity: {
                errorMsg: jest.fn(),
                textMsg: jest.fn(),
                blocks: {
                    loadNewBlocks: jest.fn()
                },
                logo: {
                    synth: {
                        setMasterVolume: jest.fn(),
                        stop: jest.fn(),
                        trigger: jest.fn(),
                        startingPitch: "C4",
                        _getFrequency: jest.fn(() => 440)
                    },
                    resetSynth: jest.fn(),
                    setUserTemperament: jest.fn()
                }
            },
            _logo: {
                synth: {
                    setMasterVolume: jest.fn(),
                    stop: jest.fn(),
                    trigger: jest.fn(),
                    startingPitch: "C4",
                    _getFrequency: jest.fn(() => 440)
                },
                resetSynth: jest.fn(),
                setUserTemperament: jest.fn()
            },
            inTemperament: "equal",
            ratios: [1, 1.5, 2],
            frequencies: [440, 660, 880],
            cents: [0, 702, 1200],
            notes: [
                ["C", 4],
                ["G", 4],
                ["C", 5]
            ],
            intervals: ["", "", ""],
            ratiosNotesPair: [],
            pitchNumber: 3,
            powerBase: 2,
            typeOfEdit: null,
            editMode: null,
            tempRatios: [],
            tempRatios1: [],
            _playAllRunning: false,
            _playAllTimer: null,
            _lastPlaybackIndex: 0,
            _clearWidgetTimeout: jest.fn(),
            _visualizerView: jest.fn(),
            checkTemperament: jest.fn(),
            equalEdit: jest.fn(),
            ratioEdit: jest.fn(),
            arbitraryEdit: jest.fn(),
            octaveSpaceEdit: jest.fn(),
            createMainWheel: jest.fn((r, p) => TemperamentUI.createMainWheel(mockTW, r, p)),
            _createInnerWheel: jest.fn(),
            _createOuterWheel: jest.fn(),
            _refreshInnerWheel: jest.fn(),
            temperamentTableDiv: document.getElementById("temperamentTableDiv"),
            MAX_DIVISIONS: 57,
            overDivisionCap: jest.fn(() => false),
            ratioToCents: jest.fn((r, b) => (1200 * Math.log(r)) / Math.log(b)),
            trustedKey: jest.fn(t => t),
            computeFrequencies: jest.fn((ratios, base, count) => {
                const out = [];
                for (let i = 0; i < count; i++) {
                    out.push((ratios[i] * base).toFixed(2));
                }
                return out;
            })
        };
    });

    test("exports expected methods as a plain object literal", () => {
        expect(typeof TemperamentUI).toBe("object");
        expect(typeof TemperamentUI.createMainWheel).toBe("function");
        expect(typeof TemperamentUI.createInnerWheel).toBe("function");
        expect(typeof TemperamentUI.createOuterWheel).toBe("function");
        expect(typeof TemperamentUI.arbitraryEditSlider).toBe("function");
        expect(typeof TemperamentUI.refreshInnerWheel).toBe("function");
        expect(typeof TemperamentUI.edit).toBe("function");
        expect(typeof TemperamentUI.equalEdit).toBe("function");
        expect(typeof TemperamentUI.ratioEdit).toBe("function");
        expect(typeof TemperamentUI.arbitraryEdit).toBe("function");
        expect(typeof TemperamentUI.octaveSpaceEdit).toBe("function");
        expect(typeof TemperamentUI._removeWheelIfPresent).toBe("function");
    });

    test("_removeWheelIfPresent hides element and removes wheel if present", () => {
        const mockWheel = { removeWheel: jest.fn() };
        const el = document.getElementById("wheelDiv2");
        TemperamentUI._removeWheelIfPresent("wheelDiv2", mockWheel);
        expect(el.style.display).toBe("none");
        expect(mockWheel.removeWheel).toHaveBeenCalled();
    });

    test("_removeWheelIfPresent does not throw when container element does not exist", () => {
        const mockWheel = { removeWheel: jest.fn() };
        expect(() => {
            TemperamentUI._removeWheelIfPresent("nonExistentDiv", mockWheel);
        }).not.toThrow();
        expect(mockWheel.removeWheel).toHaveBeenCalled();
    });

    test("_removeWheelIfPresent does not throw when wheel instance is null or undefined", () => {
        expect(() => {
            TemperamentUI._removeWheelIfPresent("wheelDiv2", null);
            TemperamentUI._removeWheelIfPresent("wheelDiv2", undefined);
        }).not.toThrow();
    });

    test("equalEdit sets editMode to equal and attaches performEqualEdit", () => {
        TemperamentUI.equalEdit(mockTW);
        expect(mockTW.editMode).toBe("equal");
        expect(typeof mockTW.performEqualEdit).toBe("function");
    });

    test("ratioEdit sets editMode to ratio", () => {
        TemperamentUI.ratioEdit(mockTW);
        expect(mockTW.editMode).toBe("ratio");
    });

    test("arbitraryEdit sets editMode to arbitrary", () => {
        TemperamentUI.arbitraryEdit(mockTW);
        expect(mockTW.editMode).toBe("arbitrary");
        expect(typeof mockTW._createInnerWheel).toBe("function");
        expect(typeof mockTW._createOuterWheel).toBe("function");
    });

    test("octaveSpaceEdit sets editMode to octave", () => {
        TemperamentUI.octaveSpaceEdit(mockTW);
        expect(mockTW.editMode).toBe("octave");
    });

    test("edit resets editMode and builds table menu", () => {
        const spyEqual = jest.spyOn(TemperamentUI, "equalEdit").mockImplementation(() => {});
        mockTW.editMode = "equal";
        TemperamentUI.edit(mockTW);
        expect(spyEqual).toHaveBeenCalled();
        spyEqual.mockRestore();
    });

    test("createMainWheel creates and initializes wheelnav on tw.notesCircle", () => {
        TemperamentUI.createMainWheel(mockTW, [1, 2], 2);
        expect(mockTW.notesCircle).toBeDefined();
        expect(mockTW.notesCircle.initWheel).toHaveBeenCalledWith(["0", "1"]);
        expect(mockTW.notesCircle.slicePathCustom.menuRadius).toBeGreaterThan(0);
        expect(mockTW.notesCircle.navItems[0].sliceAngle).toBe(180);
        expect(mockTW.notesCircle.createWheel).toHaveBeenCalled();
    });

    test("createInnerWheel creates inner wheel on tw.wheel1", () => {
        TemperamentUI.createInnerWheel(mockTW, [1, 2], 2);
        expect(mockTW.wheel1).toBeDefined();
        expect(mockTW.wheel1.initWheel).toHaveBeenCalledWith(["0", "1"]);
        expect(mockTW.wheel1.slicePathCustom.menuRadius).toBeGreaterThan(0);
        expect(mockTW.wheel1.navItems[0].sliceAngle).toBe(180);
        expect(mockTW.wheel1.createWheel).toHaveBeenCalled();
    });

    test("createInnerWheel uses supplied pitchNumber instead of tw.pitchNumber for geometry calculations", () => {
        mockTW.pitchNumber = 12;
        const suppliedPitches = 7;
        const ratios = [1.0, 1.15, 1.3, 1.45, 1.6, 1.75, 1.98];
        TemperamentUI.createInnerWheel(mockTW, ratios, suppliedPitches);

        const expectedFallbackMenuRadius = (2 * Math.PI * 128) / suppliedPitches / 6;
        expect(mockTW.wheel1.slicePathCustom.menuRadius).toBeCloseTo(expectedFallbackMenuRadius, 4);
    });

    test("createOuterWheel creates outer wheel on tw.wheel", () => {
        TemperamentUI.createOuterWheel(mockTW, [1, 2], 2);
        expect(mockTW.wheel).toBeDefined();
        expect(mockTW.wheel.initWheel).toHaveBeenCalledWith(["|", "|"]);
        expect(mockTW.wheel.navItems[0].sliceAngle).toBe(180);
        expect(mockTW.wheel.createWheel).toHaveBeenCalled();
    });

    describe("edit view and mode switching", () => {
        test("edit stops playback if running", () => {
            mockTW._playAllRunning = true;
            mockTW._playAllTimer = 123;
            TemperamentUI.edit(mockTW);
            expect(mockTW._clearWidgetTimeout).toHaveBeenCalledWith(123);
            expect(mockTW._playAllRunning).toBe(false);
            expect(mockTW._playAllTimer).toBeNull();
        });

        test("stops playback correctly against _playAllRunning guards and clears ManagedTimer timers (Amendment 6)", () => {
            jest.useFakeTimers();
            try {
                global.window.widgetWindows = {
                    windowFor: jest.fn(() => ({
                        clear: jest.fn(),
                        show: jest.fn(),
                        getWidgetBody: jest.fn(() => ({ append: jest.fn(), style: {} })),
                        addButton: jest.fn(() => ({
                            onclick: null,
                            getElementsByTagName: () => [{}]
                        })),
                        sendToCenter: jest.fn()
                    }))
                };

                const widget = new TemperamentWidget();
                widget.inTemperament = "equal";
                widget.scale = ["C", "Major"];
                widget.init(mockTW.activity);

                // Start playback
                widget.playAll();
                expect(widget._playAllRunning).toBe(true);

                // Call TemperamentUI.edit
                TemperamentUI.edit(widget);

                // Playback must be stopped
                expect(widget._playAllRunning).toBe(false);
                expect(widget._playAllTimer).toBeNull();
                expect(widget._logo.synth.stop).toHaveBeenCalled();

                // No timers must remain in ManagedTimer
                expect(widget._timerManager.clearAll()).toBe(0);
            } finally {
                jest.useRealTimers();
            }
        });

        test("edit clears _vizToolbar handlers if toolbar exists", () => {
            mockTW._vizToolbar = {
                playAllBtn2: { onclick: jest.fn() },
                addPitchAfterBtn: { onclick: jest.fn() },
                addPitchBeforeBtn: { onclick: jest.fn() },
                removePitchBtn: { onclick: jest.fn() }
            };
            TemperamentUI.edit(mockTW);
            expect(mockTW._vizToolbar.playAllBtn2.onclick).toBeNull();
            expect(mockTW._vizToolbar.addPitchAfterBtn.onclick).toBeNull();
            expect(mockTW._vizToolbar.addPitchBeforeBtn.onclick).toBeNull();
            expect(mockTW._vizToolbar.removePitchBtn.onclick).toBeNull();
        });

        test("edit menu tabs switch between equal, ratio, arbitrary, and octave modes", () => {
            const spyEqual = jest.spyOn(TemperamentUI, "equalEdit");
            const spyRatio = jest.spyOn(TemperamentUI, "ratioEdit");
            const spyArbitrary = jest.spyOn(TemperamentUI, "arbitraryEdit");
            const spyOctave = jest.spyOn(TemperamentUI, "octaveSpaceEdit");

            TemperamentUI.edit(mockTW);
            const menuItems = document.querySelectorAll(".editMenus");
            expect(menuItems.length).toBe(4);

            menuItems[1].onclick();
            expect(spyRatio).toHaveBeenCalled();

            menuItems[2].onclick();
            expect(spyArbitrary).toHaveBeenCalled();

            menuItems[3].onclick();
            expect(spyOctave).toHaveBeenCalled();

            menuItems[0].onclick();
            expect(spyEqual).toHaveBeenCalledTimes(2);

            spyEqual.mockRestore();
            spyRatio.mockRestore();
            spyArbitrary.mockRestore();
            spyOctave.mockRestore();
        });
    });

    describe("wheel creation edge cases", () => {
        test("createMainWheel falls back to widget ratios and pitchNumber if omitted", () => {
            TemperamentUI.createMainWheel(mockTW);
            expect(mockTW.notesCircle).toBeDefined();
            expect(mockTW.notesCircle.initWheel).toHaveBeenCalledWith(["0", "1", "2"]);
        });

        test("createInnerWheel removes previous wheel if wheel1 exists", () => {
            const oldWheel = { removeWheel: jest.fn() };
            mockTW.wheel1 = oldWheel;
            TemperamentUI.createInnerWheel(mockTW);
            expect(oldWheel.removeWheel).toHaveBeenCalled();
        });

        test("createInnerWheel binds oninput to frequencySlider if present", () => {
            const spyRefresh = jest
                .spyOn(TemperamentUI, "refreshInnerWheel")
                .mockImplementation(() => {});
            const slider = document.createElement("input");
            slider.id = "frequencySlider";
            document.body.appendChild(slider);

            TemperamentUI.createInnerWheel(mockTW);
            expect(typeof slider.oninput).toBe("function");
            slider.oninput();
            expect(spyRefresh).toHaveBeenCalled();
            spyRefresh.mockRestore();
        });

        test("createOuterWheel removes previous wheel if wheel exists", () => {
            const oldWheel = { removeWheel: jest.fn() };
            mockTW.wheel = oldWheel;
            TemperamentUI.createOuterWheel(mockTW);
            expect(oldWheel.removeWheel).toHaveBeenCalled();
        });

        test("createOuterWheel mouseover on wheelDiv3 triggers arbitraryEditSlider", () => {
            const spySlider = jest
                .spyOn(TemperamentUI, "arbitraryEditSlider")
                .mockImplementation(() => {});
            TemperamentUI.createOuterWheel(mockTW, [1, 2], 2);
            const wheelDiv3 = document.getElementById("wheelDiv3");
            const mouseEvent = new MouseEvent("mouseover");
            wheelDiv3.dispatchEvent(mouseEvent);
            expect(spySlider).toHaveBeenCalled();
            spySlider.mockRestore();
        });
    });

    describe("equalEdit calculations and callbacks", () => {
        test("performEqualEdit returns early if octaveIn DOM element is missing", () => {
            TemperamentUI.equalEdit(mockTW);
            document.getElementById("octaveIn").remove();
            mockTW.performEqualEdit({ target: { textContent: "done" } });
            expect(mockTW.activity.errorMsg).not.toHaveBeenCalled();
            expect(mockTW.checkTemperament).not.toHaveBeenCalled();
            expect(mockTW._visualizerView).not.toHaveBeenCalled();
            expect(mockTW.typeOfEdit).toBeNull();
        });

        test("performEqualEdit shows error when divisions input is invalid or non-positive", () => {
            TemperamentUI.equalEdit(mockTW);
            document.getElementById("divisions").value = "0";
            mockTW.performEqualEdit({ target: { textContent: "done" } });
            expect(mockTW.activity.errorMsg).toHaveBeenCalledWith(
                "Please enter a valid number of divisions.",
                3000
            );

            document.getElementById("divisions").value = "invalid";
            mockTW.performEqualEdit({ target: { textContent: "done" } });
            expect(mockTW.activity.errorMsg).toHaveBeenCalledTimes(2);
        });

        test("performEqualEdit returns early if overDivisionCap is exceeded", () => {
            TemperamentUI.equalEdit(mockTW);
            mockTW.overDivisionCap.mockReturnValueOnce(true);
            document.getElementById("divisions").value = "60";
            mockTW.performEqualEdit({ target: { textContent: "done" } });
            expect(mockTW.tempRatios).toEqual([]);
        });

        test("performEqualEdit computes equal intervals and commits on done", () => {
            TemperamentUI.equalEdit(mockTW);
            document.getElementById("octaveIn").value = "0";
            document.getElementById("octaveOut").value = "0";
            document.getElementById("divisions").value = "4";

            mockTW.performEqualEdit({ target: { textContent: "done" } });
            expect(mockTW.typeOfEdit).toBe("equal");
            expect(mockTW.divisions).toBe(4);
            expect(mockTW.pitchNumber).toBe(4);
            expect(mockTW.ratios.length).toBe(4);
            expect(mockTW.checkTemperament).toHaveBeenCalled();
            expect(mockTW._visualizerView).toHaveBeenCalled();
        });

        test("performEqualEdit computes unequal divisions when pitchNumber1 !== pitchNumber2", () => {
            mockTW.ratios = [1, 1.25, 1.5, 2];
            mockTW.pitchNumber = 4;
            TemperamentUI.equalEdit(mockTW);
            document.getElementById("octaveIn").value = "0";
            document.getElementById("octaveOut").value = "2";
            document.getElementById("divisions").value = "3";

            mockTW.performEqualEdit({ target: { textContent: "done" } });
            expect(mockTW.typeOfEdit).toBe("nonequal");
            expect(mockTW.checkTemperament).toHaveBeenCalled();
            expect(mockTW._visualizerView).toHaveBeenCalled();
        });

        test("performEqualEdit renders preview and handles preview done/back callbacks", () => {
            const spyMainWheel = jest.spyOn(TemperamentUI, "createMainWheel");
            const spyEqualEdit = jest.spyOn(TemperamentUI, "equalEdit");

            let stateAtVisualizerCall = null;
            mockTW._visualizerView = jest.fn(() => {
                stateAtVisualizerCall = {
                    eqTempPitchNumber: mockTW.eqTempPitchNumber,
                    eqTempHzs: mockTW.eqTempHzs ? [...mockTW.eqTempHzs] : null
                };
            });

            TemperamentUI.equalEdit(mockTW);
            document.getElementById("divisions").value = "3";

            // Click Preview
            mockTW.performEqualEdit({ target: { textContent: "preview" } });
            expect(spyMainWheel).toHaveBeenCalled();
            expect(mockTW.eqTempPitchNumber).toBe(3);
            expect(mockTW.eqTempHzs).toBeDefined();

            // Click Done on preview: asserts both are reset BEFORE _visualizerView ran
            document.getElementById("done_").onclick();
            expect(stateAtVisualizerCall).not.toBeNull();
            expect(stateAtVisualizerCall.eqTempPitchNumber).toBeNull();
            expect(stateAtVisualizerCall.eqTempHzs).toEqual([]);
            expect(mockTW.eqTempPitchNumber).toBeNull();
            expect(mockTW.eqTempHzs).toEqual([]);
            expect(mockTW._visualizerView).toHaveBeenCalled();

            // Test back/preview toggle
            mockTW.eqTempPitchNumber = 3;
            mockTW.eqTempHzs = [440];
            document.getElementById("preview").onclick();
            expect(spyEqualEdit).toHaveBeenCalled();
            expect(mockTW.eqTempPitchNumber).toBeNull();
            expect(mockTW.eqTempHzs).toEqual([]);

            spyMainWheel.mockRestore();
            spyEqualEdit.mockRestore();
        });

        test("equalEdit divAppend click and mouseover handlers work", () => {
            TemperamentUI.equalEdit(mockTW);
            const divAppend = document.getElementById("divAppend");
            divAppend.onmouseover();
            expect(divAppend.style.cursor).toBe("pointer");
        });
    });

    describe("ratioEdit calculations and callbacks", () => {
        test("ratioEdit divAppend mouseover sets pointer cursor", () => {
            TemperamentUI.ratioEdit(mockTW);
            const divAppend = document.getElementById("divAppend");
            divAppend.onmouseover();
            expect(divAppend.style.cursor).toBe("pointer");
        });

        test("ratioEdit returns early if ratioIn is missing", () => {
            TemperamentUI.ratioEdit(mockTW);
            document.getElementById("ratioIn").remove();
            const divAppend = document.getElementById("divAppend");
            divAppend.onclick({ target: { textContent: "done" } });
            expect(mockTW.checkTemperament).not.toHaveBeenCalled();
            expect(mockTW._visualizerView).not.toHaveBeenCalled();
        });

        test("ratioEdit rejects an invalid ratio like 1:54 without corrupting state", () => {
            mockTW.ratios = [1, 2];
            mockTW.frequencies = [440, 880];
            mockTW.powerBase = 2;
            mockTW.checkTemperament = jest.fn();

            TemperamentUI.ratioEdit(mockTW);
            document.getElementById("ratioIn").value = "1";
            document.getElementById("ratioOut").value = "54";
            document.getElementById("recursion").value = "1";

            const divAppend = document.getElementById("divAppend");
            divAppend.onclick({ target: { textContent: "done" } });

            expect(mockTW.activity.errorMsg).toHaveBeenCalledWith(
                "Please enter a valid ratio (e.g. 3:2) within the octave space.",
                3000
            );
            expect(mockTW.ratios).toEqual([1, 2]);
            expect(mockTW.frequencies).toEqual([440, 880]);
            expect(mockTW.checkTemperament).not.toHaveBeenCalled();
            expect(mockTW._visualizerView).not.toHaveBeenCalled();
        });

        test("ratioEdit computes recursive ratios and commits on done", () => {
            mockTW.ratios = [1, 2];
            TemperamentUI.ratioEdit(mockTW);
            document.getElementById("ratioIn").value = "3";
            document.getElementById("ratioOut").value = "2";
            document.getElementById("recursion").value = "2";

            const divAppend = document.getElementById("divAppend");
            divAppend.onclick({ target: { textContent: "done" } });
            expect(mockTW.typeOfEdit).toBe("nonequal");
            expect(mockTW.ratios.length).toBeGreaterThan(2);
            expect(mockTW.checkTemperament).toHaveBeenCalled();
            expect(mockTW._visualizerView).toHaveBeenCalled();
        });

        test("ratioEdit handles overDivisionCap", () => {
            TemperamentUI.ratioEdit(mockTW);
            mockTW.overDivisionCap.mockReturnValueOnce(true);
            document.getElementById("ratioIn").value = "3";
            document.getElementById("ratioOut").value = "2";
            document.getElementById("recursion").value = "1";

            const divAppend = document.getElementById("divAppend");
            divAppend.onclick({ target: { textContent: "done" } });
            expect(mockTW._visualizerView).not.toHaveBeenCalled();
        });

        test("ratioEdit handles preview and preview callbacks", () => {
            const spyMainWheel = jest.spyOn(TemperamentUI, "createMainWheel");
            const spyRatioEdit = jest.spyOn(TemperamentUI, "ratioEdit");
            TemperamentUI.ratioEdit(mockTW);
            document.getElementById("ratioIn").value = "3";
            document.getElementById("ratioOut").value = "2";
            document.getElementById("recursion").value = "1";

            const divAppend = document.getElementById("divAppend");
            divAppend.onclick({ target: { textContent: "preview" } });
            expect(spyMainWheel).toHaveBeenCalled();
            expect(mockTW.NEqTempPitchNumber).toBe(mockTW.tempRatios.length);

            document.getElementById("done_").onclick();
            expect(mockTW.NEqTempPitchNumber).toBeNull();
            expect(mockTW._visualizerView).toHaveBeenCalled();

            mockTW.NEqTempPitchNumber = 4;
            document.getElementById("preview").onclick();
            expect(spyRatioEdit).toHaveBeenCalled();
            expect(mockTW.NEqTempPitchNumber).toBeNull();

            spyMainWheel.mockRestore();
            spyRatioEdit.mockRestore();
        });
    });

    describe("arbitraryEdit, slider, and refreshInnerWheel", () => {
        test("arbitraryEdit done button commits tempRatios1 and redraws visualizer", () => {
            TemperamentUI.arbitraryEdit(mockTW);
            mockTW.tempRatios1 = [1, 1.33, 1.66, 2];
            const divAppend = document.getElementById("divAppend");
            divAppend.onclick();

            expect(mockTW.ratios).toEqual([1, 1.33, 1.66, 2]);
            expect(mockTW.typeOfEdit).toBe("nonequal");
            expect(mockTW.checkTemperament).toHaveBeenCalled();
            expect(mockTW._visualizerView).toHaveBeenCalled();
        });

        test("arbitraryEditSlider creates popup on title hover and wires controls", () => {
            const spyRefresh = jest
                .spyOn(TemperamentUI, "refreshInnerWheel")
                .mockImplementation(() => {});
            const spyOuter = jest
                .spyOn(TemperamentUI, "createOuterWheel")
                .mockImplementation(() => {});
            const spyInner = jest
                .spyOn(TemperamentUI, "createInnerWheel")
                .mockImplementation(() => {});

            const event = {
                target: {
                    parentNode: { id: "wheelnav-wheelDiv3-title-0" }
                }
            };
            TemperamentUI.arbitraryEditSlider(mockTW, event, [270], [1, 1.5, 2], 3);

            const slider = document.getElementById("frequencySlider");
            expect(slider).not.toBeNull();

            slider.oninput();
            expect(spyRefresh).toHaveBeenCalled();

            mockTW.tempRatios = [1, 1.4, 2];
            document.getElementById("done").onclick();
            expect(mockTW.tempRatios1).toEqual([1, 1.4, 2]);
            expect(spyOuter).toHaveBeenCalled();

            mockTW.tempRatios1 = [1, 1.5, 2];
            document.getElementById("close").onclick();
            expect(mockTW.tempRatios).toEqual([1, 1.5, 2]);
            expect(spyInner).toHaveBeenCalled();
            expect(document.getElementById("noteInfo1")).toBeNull();

            spyRefresh.mockRestore();
            spyOuter.mockRestore();
            spyInner.mockRestore();
        });

        test("refreshInnerWheel inserts ratio, triggers synth, and updates inner wheel", () => {
            const spyInner = jest
                .spyOn(TemperamentUI, "createInnerWheel")
                .mockImplementation(() => {});
            const slider = document.createElement("input");
            slider.id = "frequencySlider";
            slider.value = "550";
            document.body.appendChild(slider);

            const freqDiv = document.createElement("div");
            freqDiv.id = "frequencydiv";
            document.body.appendChild(freqDiv);

            mockTW.tempRatios1 = [1, 1.5, 2];
            TemperamentUI.refreshInnerWheel(mockTW);

            expect(mockTW._logo.synth.trigger).toHaveBeenCalled();
            expect(spyInner).toHaveBeenCalled();
            expect(mockTW.tempRatios.length).toBe(4);
            spyInner.mockRestore();
        });

        test("refreshInnerWheel replaces existing ratio when diff is negligible", () => {
            const spyInner = jest
                .spyOn(TemperamentUI, "createInnerWheel")
                .mockImplementation(() => {});
            const slider = document.createElement("input");
            slider.id = "frequencySlider";
            slider.value = "660";
            document.body.appendChild(slider);

            const freqDiv = document.createElement("div");
            freqDiv.id = "frequencydiv";
            document.body.appendChild(freqDiv);

            mockTW.tempRatios1 = [1, 1.5, 2];
            TemperamentUI.refreshInnerWheel(mockTW);

            expect(spyInner).toHaveBeenCalled();
            expect(mockTW.tempRatios.length).toBe(3);
            expect(mockTW.tempRatios[1]).toBe(1.5);
            spyInner.mockRestore();
        });

        test("refreshInnerWheel stops if overDivisionCap is reached", () => {
            const spyInner = jest
                .spyOn(TemperamentUI, "createInnerWheel")
                .mockImplementation(() => {});
            const slider = document.createElement("input");
            slider.id = "frequencySlider";
            slider.value = "500";
            document.body.appendChild(slider);

            const freqDiv = document.createElement("div");
            freqDiv.id = "frequencydiv";
            document.body.appendChild(freqDiv);

            mockTW.overDivisionCap.mockReturnValueOnce(true);
            mockTW.tempRatios1 = [1, 1.5, 2];
            TemperamentUI.refreshInnerWheel(mockTW);

            expect(spyInner).not.toHaveBeenCalled();
            spyInner.mockRestore();
        });

        test("arbitraryEdit divAppend mouseover sets pointer cursor", () => {
            TemperamentUI.arbitraryEdit(mockTW);
            const divAppend = document.getElementById("divAppend");
            divAppend.onmouseover();
            expect(divAppend.style.cursor).toBe("pointer");
        });
    });

    describe("octaveSpaceEdit calculations and warning", () => {
        test("octaveSpaceEdit done button warns on non-standard octave ratio and rescales", () => {
            TemperamentUI.octaveSpaceEdit(mockTW);
            document.getElementById("startNote").value = "3";
            document.getElementById("endNote").value = "1";

            const divAppend = document.getElementById("divAppend");
            divAppend.onclick();

            expect(mockTW.activity.textMsg).toHaveBeenCalledWith(
                "The octave ratio has changed. This changes temperament significantly.",
                3000
            );
            expect(mockTW.powerBase).toBe(3);
            expect(mockTW.octaveChanged).toBe(true);
            expect(mockTW.typeOfEdit).toBe("nonequal");
            expect(mockTW.checkTemperament).toHaveBeenCalled();
            expect(mockTW._visualizerView).toHaveBeenCalled();
        });

        test("octaveSpaceEdit done button does not warn when ratio is 2", () => {
            TemperamentUI.octaveSpaceEdit(mockTW);
            document.getElementById("startNote").value = "2";
            document.getElementById("endNote").value = "1";

            const divAppend = document.getElementById("divAppend");
            divAppend.onclick();

            expect(mockTW.activity.textMsg).not.toHaveBeenCalled();
            expect(mockTW.powerBase).toBe(2);
            expect(mockTW.octaveChanged).toBeUndefined();
            expect(mockTW._visualizerView).toHaveBeenCalled();
        });

        test("octaveSpaceEdit divAppend mouseover sets pointer cursor", () => {
            TemperamentUI.octaveSpaceEdit(mockTW);
            const divAppend = document.getElementById("divAppend");
            divAppend.onmouseover();
            expect(divAppend.style.cursor).toBe("pointer");
        });

        test("octaveSpaceEdit null-guard: safely handles missing startNote input element", () => {
            TemperamentUI.octaveSpaceEdit(mockTW);
            document.getElementById("startNote").remove();
            const divAppend = document.getElementById("divAppend");
            expect(() => {
                divAppend.onclick();
            }).not.toThrow();
            expect(mockTW._visualizerView).not.toHaveBeenCalled();
        });
    });

    describe("Wheel Characterization tests (Master vs Refactor)", () => {
        function getWheelSnapshot(wheelInstance, count) {
            return {
                divId: wheelInstance.divId,
                navAngle: wheelInstance.navAngle,
                initWheelArgs: wheelInstance.initWheelArgs,
                menuRadius: wheelInstance.slicePathCustom
                    ? wheelInstance.slicePathCustom.menuRadius
                    : undefined,
                sliceAngles: wheelInstance.navItems
                    .slice(0, count)
                    .map(item => Number(item.sliceAngle.toFixed(6)))
            };
        }

        test("Case 1: 12 equal pitches matches master values exactly", () => {
            const ratios = Array.from({ length: 12 }, (_, i) => Math.pow(2, i / 12));
            const tw = { pitchNumber: 12, ratios, powerBase: 2 };

            // 1. createMainWheel
            capturedWheelnavInstances = [];
            TemperamentUI.createMainWheel(tw, ratios, 12);
            const mainSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                12
            );
            expect(mainSnap.navAngle).toBe(270);
            expect(mainSnap.menuRadius).toBeCloseTo(26.17993877991494, 6);
            expect(mainSnap.initWheelArgs).toEqual([
                "0",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10",
                "11"
            ]);
            expect(mainSnap.sliceAngles).toEqual(Array(12).fill(30));

            // 2. createInnerWheel (radius 128)
            capturedWheelnavInstances = [];
            TemperamentUI.createInnerWheel(tw, ratios, 12);
            const innerSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                12
            );
            expect(innerSnap.navAngle).toBe(270);
            expect(innerSnap.menuRadius).toBeCloseTo(22.340214425527417, 6);
            expect(innerSnap.initWheelArgs).toEqual([
                "0",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10",
                "11"
            ]);
            expect(innerSnap.sliceAngles).toEqual(Array(12).fill(30));

            // 3. createOuterWheel
            capturedWheelnavInstances = [];
            TemperamentUI.createOuterWheel(tw, ratios, 12);
            const outerSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                12
            );
            expect(outerSnap.navAngle).toBe(285);
            expect(outerSnap.initWheelArgs).toEqual(Array(12).fill("|"));
            expect(outerSnap.sliceAngles.slice(0, 11)).toEqual(Array(11).fill(30));
        });

        test("Case 2: 7 pitches matches master values exactly", () => {
            const ratios = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8];
            const tw = { pitchNumber: 7, ratios, powerBase: 2 };

            // 1. createMainWheel
            capturedWheelnavInstances = [];
            TemperamentUI.createMainWheel(tw, ratios, 7);
            const mainSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                7
            );
            expect(mainSnap.navAngle).toBe(270);
            expect(mainSnap.menuRadius).toBeCloseTo(28.559933214452663, 6);
            expect(mainSnap.initWheelArgs).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
            expect(mainSnap.sliceAngles).toEqual([
                51.428571, 70.91743, 38.524798, 28.513973, 93.832028, 15.6102, 106.735801
            ]);

            // 2. createInnerWheel (radius 128)
            capturedWheelnavInstances = [];
            TemperamentUI.createInnerWheel(tw, ratios, 7);
            const innerSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                7
            );
            expect(innerSnap.navAngle).toBe(270);
            expect(innerSnap.menuRadius).toBeCloseTo(24.371143009666273, 6);
            expect(innerSnap.initWheelArgs).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
            expect(innerSnap.sliceAngles).toEqual([
                51.428571, 70.91743, 38.524798, 28.513973, 93.832028, 15.6102, 106.735801
            ]);

            // 3. createOuterWheel
            capturedWheelnavInstances = [];
            TemperamentUI.createOuterWheel(tw, ratios, 7);
            const outerSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                7
            );
            expect(outerSnap.navAngle).toBeCloseTo(300.58650025961623, 6);
            expect(outerSnap.initWheelArgs).toEqual(["|", "|", "|", "|", "|", "|", "|"]);
            expect(outerSnap.sliceAngles.slice(0, 6)).toEqual([
                51.428571, 64.465543, 23.774956, 70.91743, 44.976685, 43.263815
            ]);
        });

        test("Case 3: Clustered set with gap < 11 deg matches master values exactly", () => {
            const ratios = [1.0, 1.15, 1.3, 1.45, 1.6, 1.75, 1.98];
            const tw = { pitchNumber: 7, ratios, powerBase: 2 };

            // 1. createMainWheel
            capturedWheelnavInstances = [];
            TemperamentUI.createMainWheel(tw, ratios, 7);
            const mainSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                7
            );
            expect(mainSnap.navAngle).toBe(270);
            expect(mainSnap.menuRadius).toBeCloseTo(22.439947525641376, 6);
            expect(mainSnap.initWheelArgs).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
            expect(mainSnap.sliceAngles).toEqual([
                51.428571, 93.747809, 33.60418, 79.825539, 22.428144, 70.655628, 57.609138
            ]);

            // 2. createInnerWheel (radius 128)
            capturedWheelnavInstances = [];
            TemperamentUI.createInnerWheel(tw, ratios, 7);
            const innerSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                7
            );
            expect(innerSnap.navAngle).toBe(270);
            expect(innerSnap.menuRadius).toBeCloseTo(19.148755221880645, 6);
            expect(innerSnap.initWheelArgs).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
            expect(innerSnap.sliceAngles).toEqual([
                51.428571, 93.747809, 33.60418, 79.825539, 22.428144, 70.655628, 57.609138
            ]);

            // 3. createOuterWheel
            capturedWheelnavInstances = [];
            TemperamentUI.createOuterWheel(tw, ratios, 7);
            const outerSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                7
            );
            expect(outerSnap.navAngle).toBeCloseTo(306.29409501053703, 6);
            expect(outerSnap.initWheelArgs).toEqual(["|", "|", "|", "|", "|", "|", "|"]);
            expect(outerSnap.sliceAngles.slice(0, 6)).toEqual([
                51.428571, 84.835613, 35.555241, 72.28646, 25.382268, 26.379464
            ]);
        });

        test("Case 4: Supplied pitchNumber different (tw=12, supplied=7) matches master except inner wheel pitchNumber fix", () => {
            const ratios = [1.0, 1.15, 1.3, 1.45, 1.6, 1.75, 1.98];
            const tw = { pitchNumber: 12, ratios, powerBase: 2 };

            // 1. createMainWheel matches master exactly
            capturedWheelnavInstances = [];
            TemperamentUI.createMainWheel(tw, ratios, 7);
            const mainSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                7
            );
            expect(mainSnap.menuRadius).toBeCloseTo(22.439947525641376, 6);
            expect(mainSnap.sliceAngles).toEqual([
                51.428571, 93.747809, 33.60418, 79.825539, 22.428144, 70.655628, 57.609138
            ]);

            // 2. createOuterWheel matches master exactly
            capturedWheelnavInstances = [];
            TemperamentUI.createOuterWheel(tw, ratios, 7);
            const outerSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                7
            );
            expect(outerSnap.navAngle).toBeCloseTo(306.29409501053703, 6);
            expect(outerSnap.sliceAngles.slice(0, 6)).toEqual([
                51.428571, 84.835613, 35.555241, 72.28646, 25.382268, 26.379464
            ]);

            // 3. createInnerWheel:
            // Master computed buggy menuRadius = 24.371143009666273:
            //   - Missed wrap-around gap < 11 deg because loop index condition checked i === tw.pitchNumber - 1 (11) instead of supplied pitchNumber - 1 (6)
            //   - When clamped, used tw.pitchNumber instead of supplied pitchNumber
            //   - Fell back to (2 * Math.PI * 128) / 33 = 24.371143009666273
            // Refactored correctly computes menuRadius = 19.148755221880645:
            //   - Detects wrap-around gap 5.22 deg < 11 deg using supplied pitchNumber 7
            //   - Computes (2 * Math.PI * 128) / 7 / 6 = 19.148755221880645
            capturedWheelnavInstances = [];
            TemperamentUI.createInnerWheel(tw, ratios, 7);
            const innerSnap = getWheelSnapshot(
                capturedWheelnavInstances[capturedWheelnavInstances.length - 1],
                7
            );

            // Angles, labels, and navAngle still match master exactly:
            expect(innerSnap.navAngle).toBe(270);
            expect(innerSnap.initWheelArgs).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
            expect(innerSnap.sliceAngles).toEqual([
                51.428571, 93.747809, 33.60418, 79.825539, 22.428144, 70.655628, 57.609138
            ]);

            // Intended fix assertion:
            const expectedFixedMenuRadius = (2 * Math.PI * 128) / 7 / 6;
            expect(innerSnap.menuRadius).toBeCloseTo(expectedFixedMenuRadius, 6);
            expect(innerSnap.menuRadius).not.toBeCloseTo(24.371143009666273, 4);
        });
    });
});
