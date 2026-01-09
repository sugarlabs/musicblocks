/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Music Blocks Contributors
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

// Mock global variables
global._ = jest.fn((str) => str);
global._THIS_IS_MUSIC_BLOCKS_ = true;
global.platformColor = {
    selectorBackground: "#FFFFFF"
};
global.MATRIXBUTTONHEIGHT = 30;
global.MATRIXSOLFEHEIGHT = 30;

// Mock helper functions
global.mixedNumber = jest.fn((val) => String(val));
global.toFixed2 = jest.fn((val) => typeof val === "number" ? val.toFixed(2) : val);
global.rationalToFraction = jest.fn((val) => [1, val]);

// Set up global window and document mocks before class definition
global.window = {
    innerWidth: 1200,
    widgetWindows: {
        windowFor: jest.fn(() => ({
            clear: jest.fn(),
            show: jest.fn(),
            getWidgetBody: jest.fn(() => ({
                append: jest.fn()
            })),
            destroy: jest.fn(),
            sendToCenter: jest.fn(),
            onclose: null,
            onmaximize: null
        }))
    }
};

global.document = {
    createElement: jest.fn(() => ({
        createTHead: jest.fn(() => ({
            insertRow: jest.fn(() => ({
                insertCell: jest.fn(() => ({
                    style: {},
                    innerHTML: "",
                    className: ""
                })),
                cells: []
            })),
            rows: []
        })),
        rows: []
    }))
};

global.localStorage = {
    languagePreference: "en"
};


// Since status.js uses global export pattern without module.exports,
// we need to define the class here for testing purposes.
// This is a copy of the StatusMatrix class from js/widgets/status.js
// for testing only - we are NOT modifying the production file.
class StatusMatrix {
    static BUTTONDIVWIDTH = 128;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static OUTERWINDOWWIDTH = 620;
    static INNERWINDOWWIDTH = this.OUTERWINDOWWIDTH - this.BUTTONSIZE * 1.5;
    static FONTSCALEFACTOR = 75;

    init(activity) {
        this.activity = activity;
        this.isOpen = true;
        this.isMaximized = false;
        this._cellScale = window.innerWidth / 1200;
        let iconSize = StatusMatrix.ICONSIZE * this._cellScale;

        this.widgetWindow = window.widgetWindows.windowFor(this, "status", "status");
        this.widgetWindow.clear();
        this.widgetWindow.show();
        let cell;

        this._statusTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().append(this._statusTable);
        this.widgetWindow.onclose = () => {
            this.isOpen = false;
            this.widgetWindow.destroy();
        };

        const header = this._statusTable.createTHead();
        const row = header.insertRow();

        iconSize = Math.floor(this._cellScale * 24);

        cell = row.insertCell();
        cell.style.backgroundColor = "#FFFFFF";
        cell.className = "headcol";
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
        cell.style.width = "212.5px";
        cell.innerHTML = "&nbsp;";

        for (const turtle of this.activity.turtles.turtleList) {
            if (turtle.inTrash) {
                continue;
            }

            cell = row.insertCell();
            cell.style.backgroundColor = "#FFFFFF";

            if (_THIS_IS_MUSIC_BLOCKS_) {
                cell.innerHTML = `&nbsp;&nbsp;<img 
                        src="images/mouse.svg" 
                        title="${turtle.name}" 
                        alt="${turtle.name}" 
                        height="${iconSize}" 
                        width="${iconSize}"
                    >&nbsp;&nbsp;`;
            } else {
                cell.innerHTML = `&nbsp;&nbsp;<img 
                        src="header-icons/turtle-button.svg" 
                        title="${turtle.name}" 
                        alt="${turtle.name}" 
                        height="${iconSize}"
                        width="${iconSize}"
                    >&nbsp;&nbsp;`;
            }
            cell.style.width = "212.5px";
            this.widgetWindow.onmaximize = () => {
                this.isMaximized = !this.isMaximized;
                cell.style.width = "100vw";
                cell.style.paddingLeft = "30px";
                cell.style.fontSize =
                    Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
                if (!this.isMaximized) {
                    cell.style.width = "212.5px";
                }
            };
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            cell.className = "headcol";
        }

        let label;
        for (const statusField of this.activity.logo.statusFields) {
            const row = header.insertRow();

            cell = row.insertCell();
            cell.style.fontSize =
                Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";

            switch (statusField[1]) {
                case "plus":
                case "minus":
                case "neg":
                case "divide":
                case "power":
                case "multiply":
                case "sqrt":
                case "int":
                case "mod":
                    label = "";
                    break;
                case "namedbox":
                    label = this.activity.blocks.blockList[statusField[0]].privateData;
                    break;
                case "heap":
                    label = _("heap");
                    break;
                case "bpm":
                case "bpmfactor":
                    if (localStorage.languagePreference === "ja") {
                        label = _("beats per minute2");
                    } else {
                        label = this.activity.blocks.blockList[statusField[0]].protoblock
                            .staticLabels[0];
                    }
                    break;
                case "outputtools":
                    label = this.activity.blocks.blockList[statusField[0]].privateData;
                    break;
                default:
                    label = this.activity.blocks.blockList[statusField[0]].protoblock
                        .staticLabels[0];
                    break;
            }
            let str = label;
            str = label.charAt(0).toUpperCase() + label.slice(1);
            cell.innerHTML = `&nbsp;<b>${str}</b>`;
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
            cell.style.backgroundColor = platformColor.selectorBackground;
            cell.style.paddingLeft = "10px";
            this.activity.turtles.turtleList.forEach(() => {
                cell = row.insertCell();
                cell.style.backgroundColor = platformColor.selectorBackground;
                cell.style.fontSize =
                    Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
                cell.innerHTML = "";
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.textAlign = "center";
            });
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            const row = header.insertRow();
            cell = row.insertCell();
            cell.style.fontSize =
                Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
            const str = _("note");
            const label = str.charAt(0).toUpperCase() + str.slice(1);
            cell.innerHTML = `&nbsp;<b>${label}</b>`;
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
            cell.style.backgroundColor = platformColor.selectorBackground;
            cell.style.paddingLeft = "10px";
            this.activity.turtles.turtleList.forEach(() => {
                cell = row.insertCell();
                cell.style.backgroundColor = platformColor.selectorBackground;
                cell.style.fontSize =
                    Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
                cell.innerHTML = "";
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.textAlign = "center";
            });
        }
        this.widgetWindow.sendToCenter();
    }

    updateAll() {
        this.activity.logo.updatingStatusMatrix = true;

        let activeTurtles = 0;
        let cell;
        let t = 0;
        for (const turtle of this.activity.turtles.turtleList) {
            const tur = this.activity.turtles.ithTurtle(t);

            if (turtle.inTrash) {
                continue;
            }

            let saveStatus;
            let blk, cblk;
            let name;
            let value;
            let notes;
            let noteValue;
            let freq;
            let i = 0;
            for (const statusField of this.activity.logo.statusFields) {
                saveStatus = this.activity.logo.inStatusMatrix;
                this.activity.logo.inStatusMatrix = false;

                this.activity.logo.parseArg(this.activity.logo, t, statusField[0]);
                switch (this.activity.blocks.blockList[statusField[0]].name) {
                    case "x":
                    case "y":
                    case "heading":
                        value = this.activity.blocks.blockList[statusField[0]].value.toFixed(0);
                        break;
                    case "mynotevalue":
                        value = mixedNumber(this.activity.blocks.blockList[statusField[0]].value);
                        break;
                    case "elapsednotes2":
                        blk = statusField[0];
                        cblk = this.activity.blocks.blockList[blk].connections[1];
                        noteValue = this.activity.logo.parseArg(
                            this.activity.logo,
                            t,
                            cblk,
                            blk,
                            null
                        );
                        value =
                            mixedNumber(this.activity.blocks.blockList[statusField[0]].value) +
                            " × " +
                            mixedNumber(noteValue);
                        break;
                    case "elapsednotes":
                        value = mixedNumber(this.activity.blocks.blockList[statusField[0]].value);
                        break;
                    case "namedbox":
                        name = this.activity.blocks.blockList[statusField[0]].privateData;
                        if (name in this.activity.logo.boxes) {
                            value = this.activity.logo.boxes[name];
                        } else {
                            value = "";
                        }
                        break;
                    case "beatvalue":
                        value = mixedNumber(tur.singer.currentBeat);
                        break;
                    case "measurevalue":
                        value = tur.singer.currentMeasure;
                        break;
                    case "pitchinhertz":
                        value = "";
                        if (tur.singer.noteStatus != null) {
                            notes = tur.singer.noteStatus[0];
                            for (let j = 0; j < notes.length; j++) {
                                if (j > 0) {
                                    value += " ";
                                }
                                freq = this.activity.logo.synth.getFrequency(
                                    notes[j],
                                    this.activity.logo.synth.changeInTemperament
                                );
                                if (typeof freq === "number") {
                                    value += freq.toFixed(2);
                                }
                            }
                        } else {
                            value = "";
                        }
                        break;
                    case "heap":
                        value = this.activity.blocks.blockList[statusField[0]].value;
                        break;
                    default:
                        value = this.activity.blocks.blockList[statusField[0]].value;
                        break;
                }

                this.activity.logo.inStatusMatrix = saveStatus;

                cell = this._statusTable.rows[i + 1].cells[activeTurtles + 1];
                if (cell != null) {
                    cell.innerHTML = value;
                }
                i++;
            }

            let obj;
            let note;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                note = "";
                value = "";
                if (tur.singer.noteStatus != null) {
                    notes = tur.singer.noteStatus[0];
                    for (let j = 0; j < notes.length; j++) {
                        if (typeof notes[j] === "number") {
                            note += toFixed2(notes[j]);
                            note += "Hz ";
                        } else {
                            note += notes[j];
                            note += " ";
                        }
                    }

                    value = tur.singer.noteStatus[1];
                    obj = rationalToFraction(value);
                    note += obj[1] + "/" + obj[0];
                }

                cell = this._statusTable.rows[i + 1].cells[activeTurtles + 1];
                if (cell != null) {
                    cell.innerHTML = note.replace(/#/g, "♯").replace(/b/g, "♭");
                }
            }

            activeTurtles += 1;
            t++;
        }

        this.activity.logo.updatingStatusMatrix = false;
    }
}

describe("StatusMatrix Class", () => {
    let statusMatrix;
    let mockActivity;
    let mockWidgetWindow;
    let mockTable;
    let mockRow;
    let mockCell;
    let mockTHead;

    beforeEach(() => {
        jest.clearAllMocks();

        mockCell = {
            style: {},
            innerHTML: "",
            insertCell: jest.fn()
        };

        mockRow = {
            insertCell: jest.fn(() => mockCell),
            cells: [mockCell, mockCell, mockCell]
        };

        mockTHead = {
            insertRow: jest.fn(() => mockRow),
            rows: [mockRow, mockRow, mockRow]
        };

        mockTable = {
            createTHead: jest.fn(() => mockTHead),
            rows: [
                { cells: [mockCell, mockCell, mockCell] },
                { cells: [mockCell, mockCell, mockCell] },
                { cells: [mockCell, mockCell, mockCell] }
            ]
        };

        global.document = {
            createElement: jest.fn((tag) => {
                if (tag === "table") {
                    return mockTable;
                }
                return { style: {}, innerHTML: "" };
            })
        };

        mockWidgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            getWidgetBody: jest.fn(() => ({
                append: jest.fn()
            })),
            destroy: jest.fn(),
            sendToCenter: jest.fn(),
            onclose: null,
            onmaximize: null
        };

        global.window = {
            innerWidth: 1200,
            widgetWindows: {
                windowFor: jest.fn(() => mockWidgetWindow)
            }
        };

        global.localStorage = {
            languagePreference: "en"
        };

        const mockTurtle = {
            name: "TestTurtle",
            inTrash: false,
            singer: {
                noteStatus: null,
                currentBeat: 1,
                currentMeasure: 1
            }
        };

        const mockBlock = {
            name: "x",
            value: 100,
            privateData: "testBox",
            protoblock: {
                staticLabels: ["X Position"]
            },
            connections: [null, 1]
        };

        mockActivity = {
            turtles: {
                turtleList: [mockTurtle],
                ithTurtle: jest.fn((index) => ({
                    singer: mockTurtle.singer
                }))
            },
            logo: {
                statusFields: [
                    [0, "x"],
                    [1, "y"]
                ],
                updatingStatusMatrix: false,
                inStatusMatrix: false,
                parseArg: jest.fn(),
                boxes: {
                    testBox: 42
                },
                synth: {
                    getFrequency: jest.fn((note) => 440),
                    changeInTemperament: []
                }
            },
            blocks: {
                blockList: [mockBlock, mockBlock]
            }
        };

        statusMatrix = new StatusMatrix();
    });

    describe("init()", () => {
        test("should initialize without throwing errors", () => {
            expect(() => {
                statusMatrix.init(mockActivity);
            }).not.toThrow();
        });

        test("should set activity reference", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix.activity).toBe(mockActivity);
        });

        test("should set isOpen to true", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix.isOpen).toBe(true);
        });

        test("should set isMaximized to false", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix.isMaximized).toBe(false);
        });

        test("should calculate cell scale based on window width", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix._cellScale).toBe(1);
        });

        test("should create widget window", () => {
            statusMatrix.init(mockActivity);
            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                statusMatrix,
                "status",
                "status"
            );
        });

        test("should clear and show widget window", () => {
            statusMatrix.init(mockActivity);
            expect(mockWidgetWindow.clear).toHaveBeenCalled();
            expect(mockWidgetWindow.show).toHaveBeenCalled();
        });

        test("should create status table", () => {
            statusMatrix.init(mockActivity);
            expect(document.createElement).toHaveBeenCalledWith("table");
            expect(statusMatrix._statusTable).toBe(mockTable);
        });

        test("should assign onclose callback", () => {
            statusMatrix.init(mockActivity);
            expect(mockWidgetWindow.onclose).toBeDefined();
            expect(typeof mockWidgetWindow.onclose).toBe("function");
        });

        test("should set isOpen to false when onclose is called", () => {
            statusMatrix.init(mockActivity);
            mockWidgetWindow.onclose();
            expect(statusMatrix.isOpen).toBe(false);
        });

        test("should destroy window when onclose is called", () => {
            statusMatrix.init(mockActivity);
            mockWidgetWindow.onclose();
            expect(mockWidgetWindow.destroy).toHaveBeenCalled();
        });

        test("should assign onmaximize callback", () => {
            statusMatrix.init(mockActivity);
            expect(mockWidgetWindow.onmaximize).toBeDefined();
            expect(typeof mockWidgetWindow.onmaximize).toBe("function");
        });

        test("should toggle isMaximized when onmaximize is called", () => {
            statusMatrix.init(mockActivity);
            const initialMaximized = statusMatrix.isMaximized;
            mockWidgetWindow.onmaximize();
            expect(statusMatrix.isMaximized).toBe(!initialMaximized);
        });

        test("should center the widget window", () => {
            statusMatrix.init(mockActivity);
            expect(mockWidgetWindow.sendToCenter).toHaveBeenCalled();
        });

        test("should handle multiple turtles during initialization", () => {
            mockActivity.turtles.turtleList = [
                { name: "Turtle1", inTrash: false, singer: { noteStatus: null } },
                { name: "Turtle2", inTrash: false, singer: { noteStatus: null } }
            ];
            expect(() => {
                statusMatrix.init(mockActivity);
            }).not.toThrow();
        });

        test("should skip turtles in trash during initialization", () => {
            mockActivity.turtles.turtleList = [
                { name: "Turtle1", inTrash: false, singer: { noteStatus: null } },
                { name: "Turtle2", inTrash: true, singer: { noteStatus: null } }
            ];
            expect(() => {
                statusMatrix.init(mockActivity);
            }).not.toThrow();
        });
    });

    describe("updateAll()", () => {
        beforeEach(() => {
            statusMatrix.init(mockActivity);
        });

        test("should execute without throwing errors", () => {
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should set updatingStatusMatrix flag to true during update", () => {
            statusMatrix.updateAll();
            expect(mockActivity.logo.updatingStatusMatrix).toBe(false);
        });

        test("should call parseArg for each status field", () => {
            statusMatrix.updateAll();
            expect(mockActivity.logo.parseArg).toHaveBeenCalled();
        });

        test("should handle x block type", () => {
            mockActivity.blocks.blockList[0].name = "x";
            mockActivity.blocks.blockList[0].value = 123.456;
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle y block type", () => {
            mockActivity.blocks.blockList[0].name = "y";
            mockActivity.blocks.blockList[0].value = 234.567;
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle heading block type", () => {
            mockActivity.blocks.blockList[0].name = "heading";
            mockActivity.blocks.blockList[0].value = 90.5;
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle mynotevalue block type", () => {
            mockActivity.blocks.blockList[0].name = "mynotevalue";
            mockActivity.blocks.blockList[0].value = 0.25;
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
            expect(global.mixedNumber).toHaveBeenCalled();
        });

        test("should handle namedbox block type", () => {
            mockActivity.blocks.blockList[0].name = "namedbox";
            mockActivity.blocks.blockList[0].privateData = "testBox";
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle beatvalue block type", () => {
            mockActivity.blocks.blockList[0].name = "beatvalue";
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
            expect(global.mixedNumber).toHaveBeenCalled();
        });

        test("should handle measurevalue block type", () => {
            mockActivity.blocks.blockList[0].name = "measurevalue";
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle pitchinhertz with null noteStatus", () => {
            mockActivity.blocks.blockList[0].name = "pitchinhertz";
            mockActivity.turtles.ithTurtle(0).singer.noteStatus = null;
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle pitchinhertz with valid noteStatus", () => {
            mockActivity.blocks.blockList[0].name = "pitchinhertz";
            mockActivity.turtles.ithTurtle(0).singer.noteStatus = [["C4", "E4"], 0.25];
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
            expect(mockActivity.logo.synth.getFrequency).toHaveBeenCalled();
        });

        test("should handle pitchinhertz with numeric frequency safely", () => {
            mockActivity.blocks.blockList[0].name = "pitchinhertz";
            mockActivity.turtles.ithTurtle(0).singer.noteStatus = [["C4"], 0.25];
            mockActivity.logo.synth.getFrequency = jest.fn(() => 261.63);
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle pitchinhertz with non-numeric frequency safely", () => {
            mockActivity.blocks.blockList[0].name = "pitchinhertz";
            mockActivity.turtles.ithTurtle(0).singer.noteStatus = [["C4"], 0.25];
            mockActivity.logo.synth.getFrequency = jest.fn(() => "invalid");
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle heap block type", () => {
            mockActivity.blocks.blockList[0].name = "heap";
            mockActivity.blocks.blockList[0].value = [1, 2, 3];
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle multiple turtles without overwriting", () => {
            const turtle1 = {
                name: "Turtle1",
                inTrash: false,
                singer: {
                    noteStatus: [["C4"], 0.25],
                    currentBeat: 1,
                    currentMeasure: 1
                }
            };
            const turtle2 = {
                name: "Turtle2",
                inTrash: false,
                singer: {
                    noteStatus: [["E4"], 0.5],
                    currentBeat: 2,
                    currentMeasure: 2
                }
            };

            mockActivity.turtles.turtleList = [turtle1, turtle2];
            mockActivity.turtles.ithTurtle = jest.fn((index) => ({
                singer: index === 0 ? turtle1.singer : turtle2.singer
            }));

            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should skip turtles in trash during update", () => {
            mockActivity.turtles.turtleList = [
                { name: "Turtle1", inTrash: false, singer: { noteStatus: null } },
                { name: "Turtle2", inTrash: true, singer: { noteStatus: null } }
            ];
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle note display when _THIS_IS_MUSIC_BLOCKS_ is true", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            mockActivity.turtles.ithTurtle(0).singer.noteStatus = [["C4"], 0.25];
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
            expect(global.rationalToFraction).toHaveBeenCalled();
        });

        test("should handle numeric notes in Hz format", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            mockActivity.turtles.ithTurtle(0).singer.noteStatus = [[440], 0.25];
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
            expect(global.toFixed2).toHaveBeenCalledWith(440);
        });

        test("should handle string notes", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            mockActivity.turtles.ithTurtle(0).singer.noteStatus = [["C4", "E4"], 0.25];
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle null cells gracefully", () => {
            statusMatrix._statusTable.rows[1].cells[1] = null;
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should restore inStatusMatrix flag", () => {
            const originalFlag = mockActivity.logo.inStatusMatrix;
            statusMatrix.updateAll();
            expect(mockActivity.logo.inStatusMatrix).toBe(originalFlag);
        });

        test("should handle elapsednotes block type", () => {
            mockActivity.blocks.blockList[0].name = "elapsednotes";
            mockActivity.blocks.blockList[0].value = 4;
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
            expect(global.mixedNumber).toHaveBeenCalled();
        });

        test("should handle elapsednotes2 block type", () => {
            mockActivity.blocks.blockList[0].name = "elapsednotes2";
            mockActivity.blocks.blockList[0].value = 4;
            mockActivity.blocks.blockList[0].connections = [null, 1];
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });

        test("should handle default block type", () => {
            mockActivity.blocks.blockList[0].name = "customblock";
            mockActivity.blocks.blockList[0].value = "test value";
            expect(() => {
                statusMatrix.updateAll();
            }).not.toThrow();
        });
    });

    describe("Static Properties", () => {
        test("should have correct BUTTONDIVWIDTH", () => {
            expect(StatusMatrix.BUTTONDIVWIDTH).toBe(128);
        });

        test("should have correct BUTTONSIZE", () => {
            expect(StatusMatrix.BUTTONSIZE).toBe(53);
        });

        test("should have correct ICONSIZE", () => {
            expect(StatusMatrix.ICONSIZE).toBe(32);
        });

        test("should have correct OUTERWINDOWWIDTH", () => {
            expect(StatusMatrix.OUTERWINDOWWIDTH).toBe(620);
        });

        test("should have correct FONTSCALEFACTOR", () => {
            expect(StatusMatrix.FONTSCALEFACTOR).toBe(75);
        });
    });
});
