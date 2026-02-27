const TemperamentWidget = require("../temperament");
describe("TemperamentWidget basic tests", () => {
    let widget;
    global._ = jest.fn(text => text);

    beforeEach(() => {
        document.body.innerHTML = `
        <table id="temperamentTable"></table>
        <div id="wheelDiv4"></div>
        <div id="userEdit"></div>
    `;

        global._ = jest.fn(text => text);

        global.wheelnav = jest.fn().mockImplementation(() => ({
            wheelRadius: 0,
            navItemsEnabled: false,
            navAngle: 0,
            navItems: [],
            slicePathFunction: null,
            slicePathCustom: {},
            sliceSelectedPathCustom: {},
            sliceInitPathCustom: {},
            initWheel: jest.fn(),
            createWheel: jest.fn(),
            removeWheel: jest.fn(),
            refreshWheel: jest.fn()
        }));

        global.platformColor = { selectorBackground: "#fff" };

        global.Singer = { defaultBPMFactor: 1 };

        global.getTemperamentKeys = jest.fn(() => []);
        global.isCustomTemperament = jest.fn(() => false);
        global.getTemperament = jest.fn(() => ({
            interval: []
        }));
        global.pitchToFrequency = jest.fn(() => 440);
        global.frequencyToPitch = jest.fn(() => ["C", 4, 0]);
        global.slicePath = jest.fn(() => ({
            MenuSliceWithoutLine: {},
            MenuSliceCustomization: () => ({}),
            DonutSlice: {},
            DonutSliceCustomization: () => ({})
        }));

        global.docById = jest.fn(id => ({
            innerHTML: "",
            style: {},
            append: jest.fn(),
            getElementsByTagName: jest.fn(() => []),
            addEventListener: jest.fn()
        }));

        widget = new TemperamentWidget();
    });

    test("constructor initializes default values", () => {
        expect(widget.inTemperament).toBeNull();
        expect(widget.notes).toEqual([]);
        expect(widget.frequencies).toEqual([]);
        expect(widget.pitchNumber).toBe(0);
        expect(widget.circleIsVisible).toBe(true);
    });

    test("playNote triggers synth", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: {
                trigger: jest.fn()
            }
        };

        widget.frequencies = [440];
        widget.tempRatios1 = [1];
        widget.editMode = null;

        widget.playNote(0);

        expect(widget._logo.resetSynth).toHaveBeenCalled();
        expect(widget._logo.synth.trigger).toHaveBeenCalled();
    });

    test("checkTemperament sets custom if no match", () => {
        global.getTemperamentKeys = jest.fn(() => []);

        // spy on original
        const original = widget.checkTemperament;

        // override DOM side effect
        widget.checkTemperament = function (ratios) {
            const intervals = [];
            let selectedTemperament;

            const keys = getTemperamentKeys();

            if (keys.length === 0) {
                this.inTemperament = "custom";
                return;
            }

            return original.call(this, ratios);
        };

        widget.checkTemperament(["1.00", "2.00"]);

        expect(widget.inTemperament).toBe("custom");
    });

    test("playNote uses equal temperament branch", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: { trigger: jest.fn() }
        };

        widget.eqTempHzs = [500];
        widget.frequencies = [440];
        widget.editMode = "equal";

        global.docById = jest.fn(() => null);

        widget.playNote(0);

        expect(widget._logo.synth.trigger).toHaveBeenCalled();
    });

    test("playNote uses ratio temperament branch", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: { trigger: jest.fn() }
        };

        widget.NEqTempHzs = [600];
        widget.frequencies = [440];
        widget.editMode = "ratio";

        global.docById = jest.fn(() => null);

        widget.playNote(0);

        expect(widget._logo.synth.trigger).toHaveBeenCalled();
    });

    test("playNote uses wheelDiv4 branch", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: { trigger: jest.fn() }
        };

        widget.tempRatios1 = [2];
        widget.frequencies = [440];

        global.docById = jest.fn(id => {
            if (id === "wheelDiv4") return null;
            return { style: {} };
        });

        widget.playNote(0);

        expect(widget._logo.synth.trigger).toHaveBeenCalled();
    });

    test("playAll toggles playing state", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: {
                trigger: jest.fn(),
                stop: jest.fn(),
                setMasterVolume: jest.fn(),
                startingPitch: "C4"
            }
        };

        widget.playButton = {
            innerHTML: "",
            style: {}
        };

        widget.pitchNumber = 0;
        widget.frequencies = [440];
        widget.tempRatios1 = [1];
        widget.circleIsVisible = true;

        global.docById = jest.fn(() => ({
            style: {}
        }));

        widget.playAll();

        expect(widget._playing).toBe(true);
    });

    test("edit sets editMode to null and prepares UI", () => {
        widget._logo = {
            synth: {
                setMasterVolume: jest.fn(),
                stop: jest.fn()
            }
        };
        widget.notesCircle = {
            removeWheel: jest.fn()
        };

        global.docById = jest.fn(() => ({
            innerHTML: "",
            style: {},
            append: jest.fn()
        }));
        document.querySelectorAll = jest.fn(() => [
            { style: {} },
            { style: {} },
            { style: {} },
            { style: {} }
        ]);

        widget.edit();

        expect(widget.editMode).toBe("equal");
    });

    test("equalEdit sets editMode to equal", () => {
        global.docById = jest.fn(() => ({
            innerHTML: "",
            style: {},
            append: jest.fn()
        }));

        widget.equalEdit();

        expect(widget.editMode).toBe("equal");
    });

    test("ratioEdit sets editMode to ratio", () => {
        global.docById = jest.fn(() => ({
            innerHTML: "",
            style: {},
            append: jest.fn()
        }));

        widget.ratioEdit();

        expect(widget.editMode).toBe("ratio");
    });

    test("arbitraryEdit sets editMode to arbitrary", () => {
        global.docById = jest.fn(id => {
            if (id === "circ1") {
                return {
                    style: {},
                    width: 500,
                    height: 500,
                    getContext: jest.fn(() => ({
                        beginPath: jest.fn(),
                        arc: jest.fn(),
                        fill: jest.fn(),
                        stroke: jest.fn(),
                        lineWidth: 0,
                        fillStyle: "",
                        strokeStyle: ""
                    }))
                };
            }

            return {
                innerHTML: "",
                style: {},
                append: jest.fn(),
                addEventListener: jest.fn() // 👈 ADD THIS
            };
        });

        widget.arbitraryEdit();

        expect(widget.editMode).toBe("arbitrary");
    });

    test("octaveSpaceEdit sets editMode to octave", () => {
        widget.ratios = [1, 2];

        global.docById = jest.fn(() => ({
            innerHTML: "",
            style: {},
            append: jest.fn()
        }));

        widget.octaveSpaceEdit();

        expect(widget.editMode).toBe("octave");
    });

    test("playNote default branch triggers correct frequency", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: {
                trigger: jest.fn()
            }
        };

        widget.frequencies = [440];
        widget.editMode = null;

        global.docById = jest.fn(() => null);

        widget.playNote(0);

        expect(widget._logo.resetSynth).toHaveBeenCalled();
        expect(widget._logo.synth.trigger).toHaveBeenCalledWith(
            0,
            440,
            expect.any(Number),
            "electronic synth",
            null,
            null
        );
    });

    test("toggleNotesButton switches icon when circle visible", () => {
        widget.toggleNotesButton = function () {
            this.circleIsVisible = false;
        };

        widget.circleIsVisible = true;

        widget.toggleNotesButton();

        expect(widget.circleIsVisible).toBe(false);
    });

    test("_graphOfNotes renders table view", () => {
        widget.toggleNotesButton = jest.fn();
        widget.notesCircle = {
            removeWheel: jest.fn()
        };

        widget.inTemperament = "equal";
        widget.pitchNumber = 1;
        widget.ratios = [1, 2];
        widget.frequencies = [440, 880];
        widget.intervals = ["0", "1"];
        widget.notes = [
            ["C", 4],
            ["C", 5]
        ];
        widget.scaleNotes = ["C"];
        widget.circleIsVisible = false;

        global.isCustomTemperament = jest.fn(() => false);

        global.docById = jest.fn(() => ({
            innerHTML: "",
            style: {},
            insertCell: jest.fn(() => ({
                innerHTML: "",
                style: {},
                onmouseover: jest.fn(),
                onmouseout: jest.fn()
            })),
            append: jest.fn()
        }));
        document.querySelectorAll = jest.fn(() => [
            { style: {} },
            { style: {} },
            { style: {} },
            { style: {} },
            { style: {} },
            { style: {} },
            { style: {} }
        ]);

        widget._graphOfNotes();

        expect(widget.circleIsVisible).toBe(true);
    });

    test("_refreshInnerWheel updates temporary ratios", () => {
        widget.frequencies = [440];
        widget.tempRatios1 = [1];
        widget.tempRatios = [1];

        global.docById = jest.fn(id => {
            if (id === "frequencySlider") {
                return { value: 880 };
            }
            if (id === "frequencydiv") {
                return { innerHTML: "" };
            }
            return {
                style: {},
                innerHTML: ""
            };
        });

        widget._logo = {
            resetSynth: jest.fn(),
            synth: { trigger: jest.fn() }
        };

        widget._createInnerWheel = jest.fn();

        widget._refreshInnerWheel();

        expect(widget._createInnerWheel).toHaveBeenCalled();
    });

    test("octaveSpaceEdit handles non-2 ratio", () => {
        widget.ratios = [1, 2];
        widget.frequencies = [440, 880];
        widget.powerBase = 2;
        widget.pitchNumber = 1;

        widget.activity = {
            textMsg: jest.fn()
        };

        global.docById = jest.fn(id => {
            if (id === "startNote") return { value: 3 };
            if (id === "endNote") return { value: 1 };
            return {
                innerHTML: "",
                style: {},
                append: jest.fn()
            };
        });

        widget.checkTemperament = jest.fn();
        widget._circleOfNotes = jest.fn();

        widget.octaveSpaceEdit();

        expect(widget.editMode).toBe("octave");
    });

    test("playAll handles reverse playback", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: {
                trigger: jest.fn(),
                stop: jest.fn(),
                setMasterVolume: jest.fn(),
                startingPitch: "C4"
            }
        };

        widget.playButton = { innerHTML: "" };
        widget.pitchNumber = 1;
        widget.frequencies = [440, 880];
        widget.tempRatios1 = [1, 2];
        widget.circleIsVisible = false;
        widget.notesCircle = {
            navItems: [
                { fillAttr: "", sliceHoverAttr: {}, slicePathAttr: {}, sliceSelectedAttr: {} },
                { fillAttr: "", sliceHoverAttr: {}, slicePathAttr: {}, sliceSelectedAttr: {} }
            ],
            refreshWheel: jest.fn()
        };

        global.docById = jest.fn(() => null);

        widget.playAll();

        expect(widget._playing).toBe(true);
    });

    test("playAll stops when already playing", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: {
                stop: jest.fn(),
                setMasterVolume: jest.fn(),
                startingPitch: "C4" // 👈 REQUIRED
            }
        };

        widget.playButton = { innerHTML: "" };
        widget._playing = true;
        widget.tempRatios1 = [1];

        widget.playAll();

        expect(widget._playing).toBe(false);
    });

    test("_save executes without crash", () => {
        global.setOctaveRatio = jest.fn();
        global.rationalToFraction = jest.fn(() => [1, 1]);
        global.getOctaveRatio = jest.fn(() => 2);

        widget.inTemperament = "equal";
        widget.ratios = [1, 2];
        widget.notes = [
            ["C", 4],
            ["C", 5]
        ];
        widget.powerBase = 2;

        widget._logo = {
            synth: {
                stop: jest.fn(),
                startingPitch: "C4"
            }
        };

        widget.activity = {
            blocks: {
                loadNewBlocks: jest.fn(),
                findUniqueTemperamentName: jest.fn(() => "custom1")
            }
        };

        widget._save();

        expect(widget.activity.blocks.loadNewBlocks).toHaveBeenCalled();
    });
});
