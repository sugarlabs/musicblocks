/**
 * MusicBlocks v3.6.2
 *
 * @author Aviral Sapra
 *
 * @copyright 2025 Aviral sapra
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


/**
 * Integration-style tests for PitchBlocks.
 * PitchBlocks depend heavily on Logo runtime and Singer state.
 * These tests mock the real execution environment to validate
 * observable behavior rather than isolated units.
 */

describe("PitchBlocks setup", () => {
    let activity;
    let logo;
    let blockRegistry;
    let Singer;
    let setupPitchBlocks;

    const expectedBlocks = [
        "pitch",
        "pitch2",
        "steppitch",
        "nthmodalpitch",
        "scaledegree",
        "scaledegree2",
        "pitchnumber",
        "hertz",
        "sharp",
        "flat",
        "accidental",
        "setscalartransposition",
        "settransposition",
        "setratio",
        "invert",
        "invert1",
        "invert2",
        "register",
        "setpitchnumberoffset",
        "number2pitch",
        "number2octave",
        "solfege",
        "notename",
        "eastindiansolfege",
        "accidentalname",
        "ytopitch",
        "currentpitch",
        "outputtools",
        "mypitch",
        "pitchinhertz",
        "deltapitch",
        "deltapitch2"
    ];

    const setupGlobals = () => {
        blockRegistry = {};

        // Translation function
        global._ = message => message;

        // Error messages
        global.NOINPUTERRORMSG = "NO_INPUT";
        global.NANERRORMSG = "NOT_A_NUMBER";
        global.INVALIDPITCH = "INVALID_PITCH";

        // Musical constants
        global.SHARP = "♯";
        global.FLAT = "♭";
        global.NATURAL = "♮";
        global.DOUBLESHARP = "𝄪";
        global.DOUBLEFLAT = "𝄫";

        global.NOTENAMES = ["C", "D", "E", "F", "G", "A", "B"];
        global.NOTENAMES1 = ["C", "D", "E", "F", "G", "A", "B", "C♯", "D♯", "F♯", "G♯", "A♯"];
        global.ALLNOTENAMES = [...global.NOTENAMES1, "C♭", "D♭", "E♭", "G♭", "A♭", "B♭"];
        
        global.NOTESFLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
        global.NOTESSHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
        global.NOTESTEP = { C: 1, D: 2, E: 3, F: 4, G: 5, A: 6, B: 7 };

        global.SOLFEGENAMES1 = ["do", "re", "mi", "fa", "sol", "la", "ti"];
        global.FIXEDSOLFEGE = {
            do: "C", re: "D", mi: "E", fa: "F", sol: "G", la: "A", ti: "B"
        };
        global.SOLFEGECONVERSIONTABLE = {
            C: "do", D: "re", E: "mi", F: "fa", G: "sol", A: "la", B: "ti"
        };

        global.MUSICALMODES = {
            MAJOR: [0, 2, 4, 5, 7, 9, 11],
            MINOR: [0, 2, 3, 5, 7, 8, 10]
        };

        global.INTERVALVALUES = {
            "perfect 5": [7, "P5", 3/2],
            "perfect 4": [5, "P4", 4/3]
        };

        global.A0 = 27.5;
        global.C8 = 4186;
        
        global.YSTAFFNOTEHEIGHT = 10;
        global.YSTAFFOCTAVEHEIGHT = 70;

        // Mock utility functions
        global.numberToPitch = jest.fn((num) => {
            const pitchNames = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
            const octave = Math.floor(num / 12) + 4;
            const pitch = pitchNames[num % 12];
            return [pitch, octave];
        });

        global.frequencyToPitch = jest.fn((freq) => {
            if (freq <= 0) return ["?", 0, 0];
            const A4 = 440;
            const C0 = A4 * Math.pow(2, -4.75);
            const halfStepsFromC0 = 12 * Math.log2(freq / C0);
            const octave = Math.floor(halfStepsFromC0 / 12);
            const semitone = Math.round(halfStepsFromC0 % 12) % 12;
            const cents = 0;
            const pitchNames = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
            return [pitchNames[semitone], octave, cents];
        });

        global.pitchToNumber = jest.fn((pitch, octave) => {
            const pitchMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
            let num = pitchMap[pitch.charAt(0)] || 0;
            if (pitch.includes(SHARP)) num++;
            if (pitch.includes(FLAT)) num--;
            return num + (octave - 4) * 12;
        });

        global.getNote = jest.fn((pitch, octave) => [pitch, octave]);
        global.calcOctave = jest.fn((currentOct, targetOct) => targetOct || currentOct);
        global.keySignatureToMode = jest.fn(() => [["C", "♮"], "MAJOR"]);
        global.buildScale = jest.fn(() => [["C", "D", "E", "F", "G", "A", "B"]]);
        global.nthDegreeToPitch = jest.fn((keySignature, degree) => {
            const scale = ["C", "D", "E", "F", "G", "A", "B"];
            return scale[(degree - 1) % 7];
        });
        global.scaleDegreeToPitchMapping = jest.fn((keySignature, degree) => {
            const scale = ["C", "D", "E", "F", "G", "A", "B"];
            return scale[(degree - 1) % 7];
        });
        global.getPitchInfo = jest.fn((activity, privateData, notePlayed) => notePlayed);
        global.last = jest.fn((arr) => arr[arr.length - 1]);

        // Mock Singer
        Singer = {
            PitchActions: {
                playPitch: jest.fn((note, octave, cents) => [note, octave, cents]),
                playHertz: jest.fn((freq) => freq),
                playPitchNumber: jest.fn((num) => num),
                playNthModalPitch: jest.fn((degree, octave) => [degree, octave]),
                stepPitch: jest.fn((steps) => steps),
                numToPitch: jest.fn((num, outType) => {
                    const [pitch, octave] = numberToPitch(num);
                    return outType === "pitch" ? pitch : octave;
                }),
                setSemitoneTranspose: jest.fn(),
                setScalarTranspose: jest.fn(),
                setRatioTranspose: jest.fn(),
                setAccidental: jest.fn(),
                setRegister: jest.fn(),
                setPitchNumberOffset: jest.fn(),
                invert: jest.fn(),
                consonantStepSize: jest.fn(() => 2),
                deltaPitch: jest.fn(() => 0)
            },
            playSynthBlock: jest.fn(),
            processPitch: jest.fn((activity, note, octave, cents) => [note, octave, cents])
        };
        global.Singer = Singer;

        // Mock block base classes
        class BaseBlock {
            constructor(name, label) {
                this.name = name;
                this.label = label;
                this.lang = "en";
                this.hidden = false;
                this.deprecated = false;
                this.parameter = false;
                blockRegistry[this.name] = this;
            }

            setPalette(palette, activityRef) {
                this.palette = palette;
                this.activityRef = activityRef;
            }

            setHelpString(help) {
                this.help = help;
            }

            formBlock(schema) {
                this.schema = schema;
            }

            makeMacro(factory) {
                this.macroFactory = factory;
            }

            beginnerBlock(flag) {
                this.beginnerFlag = flag;
            }

            setup(activityRef) {
                this.setupActivity = activityRef;
            }

            set extraWidth(value) {
                this._extraWidth = value;
            }

            get extraWidth() {
                return this._extraWidth;
            }
        }

        global.ValueBlock = class extends BaseBlock {};
        global.LeftBlock = class extends BaseBlock {};
        global.FlowBlock = class extends BaseBlock {};
        global.FlowClampBlock = class extends global.FlowBlock {};
    };

    const setupActivityAndLogo = () => {
        activity = {
            beginnerMode: false,
            blocks: {
                blockList: {}
            },
            turtles: {
                companionTurtle: jest.fn(() => 0),
                ithTurtle: jest.fn(() => ({
                    singer: {
                        lastNotePlayed: ["G4", 4],
                        previousNotePlayed: null,
                        notePitches: {},
                        noteOctaves: {},
                        inNoteBlock: [],
                        keySignature: "C major",
                        currentOctave: 4,
                        movable: false,
                        pitchNumberOffset: 39,
                        transposition: 0,
                        invertList: [],
                        instrumentNames: ["acoustic guitar nylon"]
                    }
                }))
            },
            errorMsg: jest.fn()
        };

        logo = {
            inStatusMatrix: false,
            inMatrix: false,
            inPitchStaircase: false,
            inPitchSlider: false,
            inMusicKeyboard: false,
            inLegoWidget: false,
            stopTurtle: false,
            statusFields: [],
            pitchBlocks: [],
            parseArg: jest.fn((logo, turtle, cblk) => {
                const block = activity.blocks.blockList[cblk];
                return block ? block.value : null;
            }),
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            phraseMaker: {
                addRowBlock: jest.fn(),
                rowLabels: [],
                rowArgs: []
            },
            synth: {
                _getFrequency: jest.fn((note) => {
                    const pitchMap = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.00, A: 440.00, B: 493.88 };
                    return pitchMap[note.charAt(0)] || 440;
                }),
                changeInTemperament: []
            }
        };
    };

    const loadModule = () => {
        setupPitchBlocks = require("../PitchBlocks").setupPitchBlocks; 
        setupPitchBlocks(activity);
    };

    const getBlock = name => blockRegistry[name];

    beforeEach(() => {
        jest.resetModules();
        setupGlobals();
        setupActivityAndLogo();
        loadModule();
    });


    // REGISTRATION TESTS


    it("registers all pitch block prototypes", () => {
        expectedBlocks.forEach(name => {
            expect(getBlock(name)).toBeDefined();
        });
    });

    // PITCHBLOCK TESTS - Core functionality


    it("handles PitchBlock flow with valid solfege and octave", () => {
        const block = getBlock("pitch");
        activity.blocks.blockList.pitchBlk = {
            connections: [null, null, null, null],
            name: "pitch"
        };
        
        const args = ["sol", 4];
        block.flow(args, logo, 0, "pitchBlk");
        
        expect(Singer.PitchActions.playPitch).toHaveBeenCalledWith(
            "sol", 4, 0, 0, "pitchBlk"
        );
    });

    it("handles PitchBlock with null inputs using defaults", () => {
        const block = getBlock("pitch");
        activity.blocks.blockList.pitchBlk = {
            connections: [null, null, null, null],
            name: "pitch"
        };
        
        const args = [null, null];
        block.flow(args, logo, 0, "pitchBlk");
        
        
        expect(Singer.PitchActions.playPitch).toHaveBeenCalledWith(
            "sol", 4, 0, 0, "pitchBlk"
        );
    });

    it("converts note names to pitches", () => {
        const block = getBlock("pitch");
        activity.blocks.blockList.pitchBlk = {
            connections: [null, null, null, null],
            name: "pitch"
        };
        
        const args = ["G", 4];
        block.flow(args, logo, 0, "pitchBlk");
        
        expect(Singer.PitchActions.playPitch).toHaveBeenCalled();
    });

    
    // HERTZBLOCK TESTS


    it("converts 440 Hz to correct pitch", () => {
        const block = getBlock("hertz");
        const args = [440];
        
        block.flow(args, logo, 0, "hertzBlk");
        
        expect(Singer.PitchActions.playHertz).toHaveBeenCalledWith(
            440, 0, "hertzBlk"
        );
    });

    it("handles invalid frequency with error", () => {
        const block = getBlock("hertz");
        const args = [null];
        
        block.flow(args, logo, 0, "hertzBlk");
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            global.NOINPUTERRORMSG,
            "hertzBlk"
        );
    });

    it("rejects frequency below A0", () => {
        const block = getBlock("hertz");
        const args = [20]; 
        
        block.flow(args, logo, 0, "hertzBlk");
        
        
        expect(Singer.PitchActions.playHertz).toHaveBeenCalled();
    });

    
    // PITCHNUMBERBLOCK TESTS
    

    it("converts pitch number to note", () => {
        const block = getBlock("pitchnumber");
        const args = [7]; // G
        
        block.flow(args, logo, 0, "pnBlk");
        
        expect(Singer.PitchActions.playPitchNumber).toHaveBeenCalledWith(
            7, 0, "pnBlk"
        );
    });

    it("rounds float pitch numbers", () => {
        const block = getBlock("pitchnumber");
        const args = [7.8];
        
        block.flow(args, logo, 0, "pnBlk");
        
        expect(Singer.PitchActions.playPitchNumber).toHaveBeenCalledWith(
            8, 0, "pnBlk"
        );
    });

    it("handles null pitch number with error", () => {
        const block = getBlock("pitchnumber");
        const args = [null];
        
        block.flow(args, logo, 0, "pnBlk");
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            global.NOINPUTERRORMSG,
            "pnBlk"
        );
    });

    it("handles NaN pitch number with error", () => {
        const block = getBlock("pitchnumber");
        const args = ["not a number"];
        
        block.flow(args, logo, 0, "pnBlk");
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            global.NANERRORMSG,
            "pnBlk"
        );
    });

    
    // NUMBER2PITCHBLOCK TESTS
    

    it("converts number to pitch name", () => {
        const block = getBlock("number2pitch");
        activity.blocks.blockList.n2pBlk = {
            connections: [null, "numBlk"],
            name: "number2pitch"
        };
        activity.blocks.blockList.numBlk = { value: 55 };
        
        const result = block.arg(logo, 0, "n2pBlk");
        
        expect(Singer.PitchActions.numToPitch).toHaveBeenCalledWith(
            55, "pitch", 0
        );
    });

    it("converts number to octave", () => {
        const block = getBlock("number2octave");
        activity.blocks.blockList.n2oBlk = {
            connections: [null, "numBlk"],
            name: "number2octave"
        };
        activity.blocks.blockList.numBlk = { value: 55 };
        
        const result = block.arg(logo, 0, "n2oBlk");
        
        expect(Singer.PitchActions.numToPitch).toHaveBeenCalledWith(
            55, "octave", 0
        );
    });

    
    // TRANSPOSITION TESTS
    

    it("sets semitone transposition", () => {
        const block = getBlock("settransposition");
        const args = [2, "next"];
        
        const result = block.flow(args, logo, 0, "transBlk");
        
        expect(Singer.PitchActions.setSemitoneTranspose).toHaveBeenCalledWith(
            2, 0, "transBlk"
        );
        expect(result).toEqual(["next", 1]);
    });

    it("sets scalar transposition", () => {
        const block = getBlock("setscalartransposition");
        const args = [1, "next"];
        
        const result = block.flow(args, logo, 0, "scalarBlk");
        
        expect(Singer.PitchActions.setScalarTranspose).toHaveBeenCalledWith(
            1, 0, "scalarBlk"
        );
        expect(result).toEqual(["next", 1]);
    });

    it("handles null scalar transposition with default", () => {
        const block = getBlock("setscalartransposition");
        const args = [null, "next"];
        
        block.flow(args, logo, 0, "scalarBlk");
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            global.NOINPUTERRORMSG,
            "scalarBlk"
        );
        expect(Singer.PitchActions.setScalarTranspose).toHaveBeenCalledWith(
            0, 0, "scalarBlk"
        );
    });

    it("sets ratio transposition", () => {
        const block = getBlock("setratio");
        activity.blocks.blockList.ratioBlk = {
            connections: [null, "ratioVal", "next"]
        };
        activity.blocks.blockList.ratioVal = { value: 1.5, name: "number" };
        
        logo.parseArg.mockReturnValue(1.5);
        const args = [1.5, "next"];
        
        const result = block.flow(args, logo, 0, "ratioBlk");
        
        expect(Singer.PitchActions.setRatioTranspose).toHaveBeenCalledWith(
            1.5, 0, "ratioBlk"
        );
        expect(result).toEqual(["next", 1]);
    });

    
    // ACCIDENTAL TESTS
    

    it("sets sharp accidental", () => {
        const block = getBlock("sharp");
        const args = ["next"];
        
        const result = block.flow(args, logo, 0, "sharpBlk");
        
        expect(result).toEqual(["next", 1]);
    });

    it("sets flat accidental", () => {
        const block = getBlock("flat");
        const args = ["next"];
        
        const result = block.flow(args, logo, 0, "flatBlk");
        
        expect(result).toEqual(["next", 1]);
    });

    it("sets custom accidental", () => {
        const block = getBlock("accidental");
        const args = ["sharp ♯", "next"];
        
        const result = block.flow(args, logo, 0, "accBlk");
        
        expect(Singer.PitchActions.setAccidental).toHaveBeenCalledWith(
            "sharp ♯", 0, "accBlk"
        );
        expect(result).toEqual(["next", 1]);
    });

    it("handles null accidental with error", () => {
        const block = getBlock("accidental");
        const args = [null, "next"];
        
        block.flow(args, logo, 0, "accBlk");
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            global.NOINPUTERRORMSG,
            "accBlk"
        );
    });

    
    // STEPPITCH TESTS
    

    it("steps pitch up by 1", () => {
        const block = getBlock("steppitch");
        const args = [1];
        
        block.flow(args, logo, 0, "stepBlk");
        
        expect(Singer.PitchActions.stepPitch).toHaveBeenCalledWith(
            1, 0, "stepBlk"
        );
    });

    it("steps pitch down by 1", () => {
        const block = getBlock("steppitch");
        const args = [-1];
        
        block.flow(args, logo, 0, "stepBlk");
        
        expect(Singer.PitchActions.stepPitch).toHaveBeenCalledWith(
            -1, 0, "stepBlk"
        );
    });

    
    // NTHMODALPITCH TESTS
    

    it("plays 5th degree of scale", () => {
        const block = getBlock("nthmodalpitch");
        const args = [4, 4]; 
        
        block.flow(args, logo, 0, "modalBlk");
        
        expect(Singer.PitchActions.playNthModalPitch).toHaveBeenCalledWith(
            4, 4, 0, "modalBlk"
        );
    });

    it("handles null modal pitch inputs", () => {
        const block = getBlock("nthmodalpitch");
        const args = [null, null];
        
        block.flow(args, logo, 0, "modalBlk");
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            global.NOINPUTERRORMSG,
            "modalBlk"
        );
    });

    it("handles non-numeric degree with error", () => {
        const block = getBlock("nthmodalpitch");
        const args = ["not a number", 4];
        
        block.flow(args, logo, 0, "modalBlk");
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            global.INVALIDPITCH,
            "modalBlk"
        );
        expect(logo.stopTurtle).toBe(true);
    });

    
    // REGISTER TESTS
    

    it("sets register to 0", () => {
        const block = getBlock("register");
        const args = [0];
        
        block.flow(args, logo, 0);
        
        expect(Singer.PitchActions.setRegister).toHaveBeenCalledWith(0, 0);
    });

    it("sets register to positive value", () => {
        const block = getBlock("register");
        const args = [2];
        
        block.flow(args, logo, 0);
        
        expect(Singer.PitchActions.setRegister).toHaveBeenCalledWith(2, 0);
    });

    it("sets register to negative value", () => {
        const block = getBlock("register");
        const args = [-1];
        
        block.flow(args, logo, 0);
        
        expect(Singer.PitchActions.setRegister).toHaveBeenCalledWith(-1, 0);
    });

    
    // INVERT TESTS
    

    it("inverts around sol 4 (even)", () => {
        const block = getBlock("invert1");
        const args = ["sol", 4, "even", "next"];
        
        const result = block.flow(args, logo, 0, "invertBlk");
        
        expect(Singer.PitchActions.invert).toHaveBeenCalledWith(
            "sol", 4, "even", 0, "invertBlk"
        );
        expect(result).toEqual(["next", 1]);
    });

    it("handles null invert inputs", () => {
        const block = getBlock("invert1");
        const args = [null, null, null, "next"];
        
        block.flow(args, logo, 0, "invertBlk");
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            global.NOINPUTERRORMSG,
            "invertBlk"
        );
    });

    
    // SETPITCHNUMBEROFFSET TESTS
    

    it("sets pitch number offset", () => {
        const block = getBlock("setpitchnumberoffset");
        const args = ["C", 4];
        
        block.flow(args, logo, 0, "offsetBlk");
        
        expect(Singer.PitchActions.setPitchNumberOffset).toHaveBeenCalledWith(
            "C", 4, 0, activity
        );
    });

    it("handles null offset inputs", () => {
        const block = getBlock("setpitchnumberoffset");
        const args = [null, null];
        
        block.flow(args, logo, 0, "offsetBlk");
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            global.NOINPUTERRORMSG,
            "offsetBlk"
        );
    });

    
    // CURRENTPITCH TESTS
    

    it("returns current pitch value", () => {
        const block = getBlock("currentpitch");
        const turtle = activity.turtles.ithTurtle(0);
        turtle.singer.lastNotePlayed = ["G4", 4];
        
        const result = block.arg(logo, 0, "cpBlk");
        
        expect(result).toBe("G4");
    });

    it("returns default when no pitch played", () => {
        const block = getBlock("currentpitch");
        const turtle = activity.turtles.ithTurtle(0);
        turtle.singer.lastNotePlayed = null;
        
        const result = block.arg(logo, 0, "cpBlk");
        
        expect(result).toBe("G4");
    });

    
    // MYPITCH TESTS
    

    it("returns pitch number of last played note", () => {
        const block = getBlock("mypitch");
        activity.blocks.blockList.mpBlk = {
            connections: [null],
            value: 7
        };
        
        const turtle = activity.turtles.ithTurtle(0);
        turtle.singer.lastNotePlayed = ["G4", 4];
        
        logo.inStatusMatrix = false;
        const result = block.arg(logo, 0, "mpBlk");
        
        expect(typeof result).toBe("number");
    });

    
    // PITCHINHERTZ TESTS
    

    it("returns frequency of current pitch", () => {
        const block = getBlock("pitchinhertz");
        activity.blocks.blockList.pihBlk = {
            connections: [null],
            value: 392
        };
        
        const turtle = activity.turtles.ithTurtle(0);
        turtle.singer.lastNotePlayed = ["G4", 4];
        
        logo.inStatusMatrix = false;
        const result = block.arg(logo, 0, "pihBlk");
        
        expect(logo.synth._getFrequency).toHaveBeenCalled();
    });

    
    // CONSONANTSTEPSIZE TESTS
    

    it("calculates step up size", () => {
        const block = getBlock("consonantstepsizeup");
        
        const result = block.arg(logo, 0);
        
        expect(result).toBe(2);
        expect(Singer.PitchActions.consonantStepSize).toHaveBeenCalledWith("up", 0);
    });

    it("calculates step down size", () => {
        const block = getBlock("consonantstepsizedown");
        
        const result = block.arg(logo, 0);
        
        expect(result).toBe(2);
        expect(Singer.PitchActions.consonantStepSize).toHaveBeenCalledWith("down", 0);
    });

    
    // DELTAPITCH TESTS
    

    it("calculates delta pitch in semitones", () => {
        const block = getBlock("deltapitch");
        activity.blocks.blockList.dpBlk = {
            name: "deltapitch",
            value: 0
        };
        
        const result = block.arg(logo, 0, "dpBlk");
        
        expect(Singer.PitchActions.deltaPitch).toHaveBeenCalledWith("deltapitch", 0);
    });

    it("calculates delta pitch in scale steps", () => {
        const block = getBlock("deltapitch2");
        activity.blocks.blockList.dp2Blk = {
            name: "deltapitch2",
            value: 0
        };
        
        const result = block.arg(logo, 0, "dp2Blk");
        
        expect(Singer.PitchActions.deltaPitch).toHaveBeenCalledWith("deltapitch2", 0);
    });

   
});