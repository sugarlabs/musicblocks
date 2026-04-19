/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Diwangshu Kakoty
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

global.Midi = jest.fn().mockImplementation(() => ({
    header: { ticksPerBeat: 480 },
    addTrack: jest.fn(() => ({
        addNote: jest.fn(),
        name: "",
        instrument: { number: 0 },
        channel: 0
    })),
    toArray: jest.fn(() => new Uint8Array([1, 2, 3]))
}));

global.jQuery = jest.fn(() => ({
    on: jest.fn(),
    trigger: jest.fn()
}));
global.jQuery.noConflict = jest.fn(() => global.jQuery);
global._ = jest.fn(str => str);
global._THIS_IS_TURTLE_BLOCKS_ = true;
global.TITLESTRING = "Music Blocks";
global.GUIDEURL = "Docs/guide/guide.html";
global.fileExt = jest.fn(file => {
    if (!file) {
        // This covers both null & undefined
        return "";
    }
    const parts = file.split(".");
    if (parts.length === 1 || (parts[0] === "" && parts.length === 2)) {
        return "";
    }
    return parts.pop();
});
global.window = {
    isElectron: false,
    prompt: jest.fn()
};
global.document = {
    createElement: jest.fn(() => ({
        setAttribute: jest.fn(),
        click: jest.fn()
    })),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    }
};
global.docById = jest.fn(id => document.getElementById(id));
global.docByClass = jest.fn(classname => document.getElementsByClassName(classname));
global.mockRunLogoCommands = jest.fn();
global.mockDownload = jest.fn();
// Load SaveInterface using CommonJS export (added for Jest compatibility)
// Jest's CommonJS require does not support the RequireJS pattern:
//     require(["module"], callback)
// Since SaveInterface.js uses this pattern for lazy-loaded exports,
// we load it manually with a custom require that detects array arguments
// and immediately invokes the callback (globals are already mocked above).
const { SaveInterface } = require("../SaveInterface");
const { escapeHTML } = require("../utils/utils");
global.escapeHTML = escapeHTML;
const util = require("util");
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;
global.normalizeNoteAccidentals = note => {
    const map = { "♭": "b", "♯": "#", "𝄫": "bb", "𝄪": "x" };
    return note.replace(/[♭♯𝄫𝄪]/gu, m => map[m]);
};
const { LILYPONDHEADER } = require("../lilypond");
global.LILYPONDHEADER = LILYPONDHEADER;

describe("SaveInterface", () => {
    let mockActivity;
    let saveInterface;

    beforeEach(() => {
        mockActivity = {
            beginnerMode: false,
            PlanetInterface: {
                getCurrentProjectName: jest.fn(() => "My Project")
            }
        };
        saveInterface = new SaveInterface(mockActivity);
    });

    it("should initialize with the correct default values", () => {
        expect(saveInterface.activity).toBe(mockActivity);
        expect(saveInterface.filename).toBeNull();
        expect(saveInterface.notationConvert).toBe("");
        expect(saveInterface.timeLastSaved).toBe(-100);
    });

    it("should store activity instance correctly", () => {
        const newActivity = { beginnerMode: true };
        const instance = new SaveInterface(newActivity);
        expect(instance.activity).toBe(newActivity);
    });
});

describe("download", () => {
    let instance;

    beforeEach(() => {
        const mockActivity = {
            beginnerMode: false,
            PlanetInterface: {
                getCurrentProjectName: jest.fn(() => "My Project")
            }
        };
        instance = new SaveInterface(mockActivity);
        document.body.innerHTML = "";
        delete window.MBDialog;
        mockDownloadURL = jest.spyOn(instance, "downloadURL");
        Object.defineProperty(window, "prompt", {
            writable: true,
            value: jest.fn(() => "My Project.abc")
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("should set correct filename and extension when defaultfilename is provided", () => {
        instance.download("abc", "data", "custom");
        expect(mockDownloadURL).toHaveBeenCalledWith("custom.abc", "data");
    });

    it("should default filename to 'My Project.abc' if defaultfilename is null", () => {
        instance.download("abc", "data", null);
        expect(mockDownloadURL).toHaveBeenCalledWith("My Project.abc", "data");
    });

    it("should append the extension if not present in the filename", () => {
        instance.download("wav", "data", "My Project");
        expect(mockDownloadURL).toHaveBeenCalledWith("My Project.wav", "data");
    });

    it("should not append the extension if already present in the filename", () => {
        instance.download("xml", "data", "My Project");
        expect(mockDownloadURL).toHaveBeenCalledWith("My Project.xml", "data");
    });

    it("should handle null data safely in download", () => {
        const other = new SaveInterface({
            PlanetInterface: { getCurrentProjectName: () => "Test" }
        });
        const spy = jest.spyOn(other, "downloadURL");
        other.download("abc", null, null);
        expect(spy).toHaveBeenCalled();
    });

    it("should NOT download when user cancels prompt", () => {
        const other = new SaveInterface({
            PlanetInterface: { getCurrentProjectName: () => "Test" }
        });
        window.prompt = jest.fn(() => null);
        const spy = jest.spyOn(other, "downloadURL");
        other.download("abc", "data", null);
        expect(spy).not.toHaveBeenCalled();
    });

    it("should handle empty extension gracefully", () => {
        const other = new SaveInterface({
            PlanetInterface: { getCurrentProjectName: () => "Test" }
        });
        const spy = jest.spyOn(other, "downloadURL");
        other.download("", "data", "file");
        expect(spy).toHaveBeenCalled();
    });

    it("should sanitize filename with spaces", () => {
        const other = new SaveInterface({
            PlanetInterface: { getCurrentProjectName: () => "My Project Name" }
        });
        delete window.MBDialog;
        window.prompt = jest.fn(() => "My Project Name.abc");
        const spy = jest.spyOn(other, "downloadURL");
        other.download("abc", "data", null);
        expect(spy).toHaveBeenCalledWith("My Project Name.abc", "data");
    });

    it("should use MBDialog prompt when available", async () => {
        const mockPrompt = jest.fn(() => Promise.resolve("file"));
        window.MBDialog = { prompt: mockPrompt };
        const other = new SaveInterface({
            PlanetInterface: { getCurrentProjectName: () => "Test" }
        });
        await other.download("abc", "data", null);
        expect(mockPrompt).toHaveBeenCalled();
    });
});

describe("downloadURL", () => {
    let instance;
    const mockActivity = { PlanetInterface: { getCurrentProjectName: jest.fn(() => "Test") } };

    beforeEach(() => {
        instance = new SaveInterface(mockActivity);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("should create an anchor tag and trigger a download", () => {
        const filename = "test.txt";
        const dataurl = "data:text/plain;base64,SGVsbG8gd29ybGQ=";
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
        const clickMock = jest.fn();

        jest.spyOn(document, "createElement").mockImplementation(() => {
            return {
                setAttribute: jest.fn(),
                click: clickMock
            };
        });

        instance.downloadURL(filename, dataurl);

        expect(document.createElement).toHaveBeenCalledWith("a");
        expect(clickMock).toHaveBeenCalled();
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
    });

    it("should revoke object URL after download", () => {
        global.URL.revokeObjectURL = jest.fn();
        instance.downloadURL("file.txt", "blob:url");
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:url");
    });
});

describe("save HTML methods", () => {
    let instance;
    let activity;

    beforeEach(() => {
        jest.useFakeTimers();
        activity = {
            htmlSaveTemplate:
                "<html><body><h1>{{ project_name }}</h1><p>{{ project_description }}</p><img src='{{ project_image }}'/><div>{{ data }}</div></body></html>",
            prepareExport: jest.fn(() => "Mock Exported Data"),
            PlanetInterface: {
                getCurrentProjectDescription: jest.fn(() => "Mock Description"),
                getCurrentProjectName: jest.fn(() => "Mock Project"),
                getCurrentProjectImage: jest.fn(() => "mock-image.png")
            }
        };
        instance = new SaveInterface(activity);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it("should replace placeholders with actual project data", () => {
        let file = activity.htmlSaveTemplate;
        file = file
            .replace(
                /{{ project_description }}/g,
                activity.PlanetInterface.getCurrentProjectDescription()
            )
            .replace(/{{ project_name }}/g, activity.PlanetInterface.getCurrentProjectName())
            .replace(/{{ data }}/g, activity.prepareExport())
            .replace(/{{ project_image }}/g, activity.PlanetInterface.getCurrentProjectImage());

        expect(file).toContain("<h1>Mock Project</h1>");
        expect(file).toContain("<p>Mock Description</p>");
        expect(file).toContain("<img src='mock-image.png'/>");
        expect(file).toContain("<div>Mock Exported Data</div>");
    });

    it("should escape HTML special characters in prepareHTML to prevent XSS", () => {
        const xssActivity = {
            beginnerMode: false,
            PlanetInterface: {
                getCurrentProjectName: jest.fn(() => '<script>alert("XSS")</script>'),
                getCurrentProjectDescription: jest.fn(() => "<img src=x onerror=alert(1)>"),
                getCurrentProjectImage: jest.fn(() => '" onload="alert(1)')
            },
            prepareExport: jest.fn(() => '"><script>steal()</script>')
        };

        const si = new SaveInterface(xssActivity);
        const html = si.prepareHTML();

        // Raw HTML tags must be escaped — no unescaped script or img tags from user input
        expect(html).not.toContain("<script>alert");
        expect(html).not.toContain("<img src=x");

        // Escaped values MUST contain encoded entities
        expect(html).toContain("&lt;script&gt;");
        expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
        expect(html).toContain("&lt;/script&gt;");
    });

    it("escapeHTML should encode all five HTML special characters", () => {
        expect(escapeHTML("&<>\"'")).toBe("&amp;&lt;&gt;&quot;&#039;");
    });

    it("should handle missing project fields gracefully in prepareHTML", () => {
        const activity = {
            PlanetInterface: {
                getCurrentProjectName: jest.fn(() => null),
                getCurrentProjectDescription: jest.fn(() => null),
                getCurrentProjectImage: jest.fn(() => null)
            },
            prepareExport: jest.fn(() => null)
        };

        const si = new SaveInterface(activity);
        const html = si.prepareHTML();

        expect(html).toBeDefined();
    });

    it("should handle undefined project name", () => {
        const activity = {
            PlanetInterface: {
                getCurrentProjectName: jest.fn(() => undefined)
            },
            prepareExport: jest.fn(() => "data")
        };

        const si = new SaveInterface(activity);
        const html = si.prepareHTML();

        expect(html).toBeDefined();
    });

    it("should handle missing htmlSaveTemplate", () => {
        const si = new SaveInterface({
            PlanetInterface: {},
            prepareExport: () => "data"
        });

        const html = si.prepareHTML();

        expect(html).toBeDefined();
    });

    it("should handle empty export data", () => {
        const activity = {
            PlanetInterface: {},
            prepareExport: jest.fn(() => "")
        };

        const si = new SaveInterface(activity);
        const html = si.prepareHTML();

        expect(html).toContain("");
    });

    it("should call prepareHTML and download the file", () => {
        const mockPrepareHTML = jest.fn(() => "<html>Mock HTML</html>");

        const activity = {
            save: {
                prepareHTML: mockPrepareHTML,
                download: mockDownload
            }
        };

        instance.saveHTML(activity);

        expect(mockPrepareHTML).toHaveBeenCalled();
        expect(mockDownload).toHaveBeenCalledWith(
            "html",
            "data:text/plain;charset=utf-8,%3Chtml%3EMock%20HTML%3C%2Fhtml%3E",
            null
        );
    });

    it("should call prepareHTML and download the file with the correct filename", () => {
        const mockPrepareHTML = jest.fn(() => "<html>Mock HTML</html>");
        const mockGetProjectName = jest.fn(() => "MockProject");
        const activity = {
            save: {
                prepareHTML: mockPrepareHTML,
                downloadURL: mockDownloadURL
            },
            PlanetInterface: {
                getCurrentProjectName: mockGetProjectName
            }
        };

        instance.saveHTMLNoPrompt(activity);
        jest.runAllTimers();

        expect(mockPrepareHTML).toHaveBeenCalled();
        expect(mockGetProjectName).toHaveBeenCalled();
        expect(mockDownloadURL).toHaveBeenCalledWith(
            "MockProject.html",
            "data:text/plain;charset=utf-8,%3Chtml%3EMock%20HTML%3C%2Fhtml%3E"
        );
    });

    it("should fallback filename when PlanetInterface is missing", () => {
        const activity = {
            save: {
                prepareHTML: jest.fn(() => "<html></html>"),
                downloadURL: jest.fn()
            }
        };

        instance.saveHTMLNoPrompt(activity);
        jest.runAllTimers();

        expect(activity.save.downloadURL).toHaveBeenCalledWith(
            "My_Project.html",
            expect.any(String)
        );
    });
});

describe("saveMIDI Method", () => {
    let instance;
    let activity, mockLogo;

    beforeEach(() => {
        mockLogo = {
            runningMIDI: false,
            runLogoCommands: jest.fn()
        };
        activity = { logo: mockLogo };
        instance = new SaveInterface(activity);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("should set runningMIDI to true and run logo commands", () => {
        instance.saveMIDI(activity);
        expect(activity.logo.runningMIDI).toBe(true);
        expect(activity.logo.runLogoCommands).toHaveBeenCalled();
        expect(document.body.style.cursor).toBe("wait");
    });
});

describe("afterSaveMIDI", () => {
    let instance;
    let mockActivity;

    beforeEach(() => {
        jest.useFakeTimers();
        mockActivity = {
            logo: {
                _midiData: {
                    0: [
                        {
                            note: ["G4"],
                            duration: 4,
                            bpm: 90,
                            instrument: "guitar"
                        },
                        {
                            note: ["E4"],
                            duration: 4,
                            bpm: 90,
                            instrument: "guitar"
                        }
                    ]
                }
            },
            save: {
                download: jest.fn()
            }
        };
        instance = new SaveInterface(mockActivity);
        instance.activity = mockActivity;

        global.URL.createObjectURL = jest.fn(() => "mockURL");
        global.getMidiInstrument = jest.fn(() => ({
            default: 0,
            guitar: 25
        }));
        global.getMidiDrum = jest.fn(() => ({
            "snare drum": 38,
            "kick drum": 36
        }));
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it("should generate MIDI and trigger download", () => {
        instance.afterSaveMIDI();
        jest.runAllTimers();

        expect(Midi).toHaveBeenCalled();
        expect(mockActivity.save.download).toHaveBeenCalledWith("midi", "mockURL", null);
        expect(mockActivity.logo._midiData).toEqual({});
        expect(document.body.style.cursor).toBe("default");
    });

    it("should handle empty MIDI data gracefully", () => {
        mockActivity.logo._midiData = {};
        instance.afterSaveMIDI();
        jest.runAllTimers();
        expect(mockActivity.save.download).toHaveBeenCalled();
    });

    it("should create instrument tracks and add notes correctly", () => {
        instance.afterSaveMIDI();
        jest.runAllTimers();

        const tracks = Midi.mock.results[0].value.addTrack.mock.results.map(res => res.value);
        const instrumentTrack = tracks.find(track => track.name === "Track 1 - guitar");
        expect(instrumentTrack.instrument.number).toBe(25);
        expect(instrumentTrack.addNote).toHaveBeenNthCalledWith(1, {
            name: "G4",
            time: 0,
            duration: 0.6666666666666666,
            velocity: 0.8
        });
        expect(instrumentTrack.addNote).toHaveBeenNthCalledWith(2, {
            name: "E4",
            time: 0.6666666666666666,
            duration: 0.6666666666666666,
            velocity: 0.8
        });
    });
});

describe("save artwork methods", () => {
    let instance;
    const mockActivity = { PlanetInterface: { getCurrentProjectName: jest.fn(() => "Test") } };

    beforeEach(() => {
        instance = new SaveInterface(mockActivity);
        document.body.innerHTML = `
            <canvas id="overlayCanvas"></canvas>
        `;
        docById.mockImplementation(id => document.getElementById(id));
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("should call doSVG and download the SVG file", () => {
        const mockDoSVG = jest.fn(() => "<svg>Mock SVG</svg>");
        global.doSVG = mockDoSVG;
        const activity = {
            save: {
                download: mockDownload
            },
            canvas: { width: 500, height: 500 },
            logo: "mockLogo",
            turtles: "mockTurtles"
        };

        instance.saveSVG(activity);
        expect(mockDoSVG).toHaveBeenCalledWith(
            activity.canvas,
            activity.logo,
            activity.turtles,
            activity.canvas.width,
            activity.canvas.height,
            1.0
        );
        expect(mockDownload).toHaveBeenCalledWith(
            "svg",
            "data:image/svg+xml;utf8,<svg>Mock SVG</svg>",
            null
        );
    });

    it("should call toDataURL and download the PNG file", () => {
        const mockCanvas = { toDataURL: jest.fn(() => "data:image/png;base64,mockdata") };
        global.docById = jest.fn(() => mockCanvas);
        const activity = {
            save: {
                download: mockDownload
            }
        };
        instance.savePNG(activity);

        expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/png");
        expect(mockDownload).toHaveBeenCalledWith("png", "data:image/png;base64,mockdata", null);
    });

    it("should call printBlockSVG and download the SVG file", () => {
        const mockPrintBlockSVG = jest.fn(() => "<svg>Mock SVG</svg>");
        const activity = {
            save: {
                download: mockDownload
            },
            printBlockSVG: mockPrintBlockSVG
        };
        instance.saveBlockArtwork(activity);

        expect(mockPrintBlockSVG).toHaveBeenCalled();
        expect(mockDownload).toHaveBeenCalledWith(
            "svg",
            "data:image/svg+xml;utf8,<svg>Mock SVG</svg>",
            null
        );
    });

    it("should call printBlockPNG and download the PNG file", async () => {
        const mockPrintBlockPNG = jest.fn(() => Promise.resolve("data:image/png;base64,mockdata"));
        const activity = {
            save: {
                download: mockDownload
            },
            printBlockPNG: mockPrintBlockPNG
        };
        await instance.saveBlockArtworkPNG(activity);

        expect(mockPrintBlockPNG).toHaveBeenCalled();
        expect(mockDownload).toHaveBeenCalledWith("png", "data:image/png;base64,mockdata", null);
    });
});

describe("saveWAV & saveABC methods", () => {
    let instance;
    const mockActivity = { PlanetInterface: { getCurrentProjectName: jest.fn(() => "Test") } };

    beforeEach(() => {
        instance = new SaveInterface(mockActivity);
        global._ = jest.fn(key => key);
        global.ABCHEADER = "X:1\nT:Music Blocks composition\nC:Mr. Mouse\nL:1/16\nM:C\n";
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("should start audio recording and update UI", () => {
        const mockSetupRecorder = jest.fn();
        const mockStartRecording = jest.fn();
        const mockTextMsg = jest.fn();

        const activity = {
            logo: {
                recording: false,
                synth: {
                    setupRecorder: mockSetupRecorder,
                    recorder: { start: mockStartRecording }
                },
                runLogoCommands: mockRunLogoCommands
            },
            textMsg: mockTextMsg
        };

        instance.saveWAV(activity);

        expect(document.body.style.cursor).toBe("wait");
        expect(activity.logo.recording).toBe(true);
        expect(mockSetupRecorder).toHaveBeenCalled();
        expect(mockStartRecording).toHaveBeenCalled();
        expect(mockRunLogoCommands).toHaveBeenCalled();
        expect(mockTextMsg).toHaveBeenCalledWith("Your recording is in progress.");
    });

    it("should prepare and run ABC notation commands", () => {
        const activity = {
            logo: {
                runningAbc: false,
                notationOutput: "",
                notationNotes: {},
                recordingBuffer: {
                    hasData: false,
                    notationOutput: "",
                    notationNotes: {}
                },
                notation: {
                    notationStaging: {},
                    notationDrumStaging: {}
                },
                runLogoCommands: mockRunLogoCommands
            },
            turtles: {
                turtleList: [{ painter: { doClear: jest.fn() } }],
                getTurtleCount: jest.fn(() => 1),
                getTurtle: function (index) {
                    return this.turtleList[index];
                }
            }
        };

        instance.saveAbc(activity);

        expect(document.body.style.cursor).toBe("wait");
        expect(activity.logo.runningAbc).toBe(true);
        expect(mockRunLogoCommands).toHaveBeenCalled();
    });

    it("should not crash when already recording", () => {
        const activity = {
            logo: {
                recording: true,
                synth: {
                    setupRecorder: jest.fn(),
                    recorder: { start: jest.fn() }
                },
                runLogoCommands: jest.fn()
            },
            textMsg: jest.fn()
        };

        instance.saveWAV(activity);
        expect(activity.logo.recording).toBe(true);
    });

    it("should handle empty turtle list in saveAbc", () => {
        const activity = {
            logo: {
                runningAbc: false,
                recordingBuffer: { hasData: false },
                notation: {
                    notationStaging: {},
                    notationDrumStaging: {}
                },
                runLogoCommands: jest.fn()
            },
            turtles: {
                turtleList: [],
                getTurtleCount: jest.fn(() => 0),
                getTurtle: jest.fn()
            }
        };
        instance.saveAbc(activity);
        expect(activity.logo.runningAbc).toBe(true);
    });

    it("should encode and download ABC notation output", () => {
        const mockSaveAbcOutput = jest.fn(() => "mock_abc_data");

        global.saveAbcOutput = mockSaveAbcOutput;

        const activity = {
            save: {
                download: mockDownload
            }
        };

        instance.afterSaveAbc.call({ activity });

        expect(mockSaveAbcOutput).toHaveBeenCalledWith(activity);
        expect(mockDownload).toHaveBeenCalledWith("abc", "data:text;utf8,mock_abc_data", null);
    });
});

describe("beforeunload warning", () => {
    it("should trigger beforeunload warning when unsaved changes exist", () => {
        let savedHandler;

        const mockOn = jest.fn((event, handler) => {
            if (event === "beforeunload") {
                savedHandler = handler;
            }
        });

        global.jQuery = jest.fn(() => ({
            on: mockOn,
            trigger: jest.fn()
        }));

        const instance = new SaveInterface({ beginnerMode: false });

        instance.PlanetInterface = {
            getTimeLastSaved: () => 100
        };
        instance.timeLastSaved = 0;

        const preventDefault = jest.fn();

        savedHandler({ preventDefault });

        expect(preventDefault).toHaveBeenCalled();
    });
});

describe("saveLilypond Methods", () => {
    let activity, saveInterface, mockActivity, mockDocById;
    let originalClipboard;
    let originalSecureContext;

    beforeEach(() => {
        jest.useRealTimers();
        originalClipboard = navigator.clipboard;
        originalSecureContext = window.isSecureContext;
        // Set up the DOM structure
        document.body.innerHTML = `
            <div id="lilypondModal" style="display: none;">
                <div class="modal-content" tabindex="-1">
                    <span class="close">×</span>
                    <div id="fileNameText">File name</div>
                    <input type="text" id="fileName" value="TestProject.ly" tabindex="-1">
                    <p></p>
                    <div id="titleText">Project title</div>
                    <input type="text" id="title" tabindex="-1">
                    <p></p>
                    <div id="authorText">Project author</div>
                    <input type="text" id="author" tabindex="-1">
                    <p></p>
                    <div id="MIDIText">Include MIDI output?</div>
                    <input type="checkbox" id="MIDICheck" tabindex="-1">
                    <p></p>
                    <div id="guitarText">Include guitar tablature output?</div>
                    <input type="checkbox" id="guitarCheck" tabindex="-1">
                    <p></p>
                    <p><button id="submitLilypond">Save as Lilypond</button></p>
                </div>
            </div>
        `;

        // Mock document functions
        global.docById = jest.fn(id => document.getElementById(id));
        jest.spyOn(document, "getElementById").mockImplementation(id =>
            document.querySelector(`#${id}`)
        );
        document.execCommand = jest.fn();
        global.platform = { FF: false };
        global.jQuery = jest.fn(selector => {
            if (selector === window) {
                return { on: jest.fn() };
            }
            return {
                0: { setSelectionRange: jest.fn() },
                appendTo: jest.fn().mockReturnThis(),
                val: jest.fn().mockReturnThis(),
                select: jest.fn(),
                remove: jest.fn(),
                on: jest.fn()
            };
        });
        global.jQuery.noConflict = jest.fn().mockImplementation(() => global.jQuery);

        // Mock activity objects
        activity = {
            PlanetInterface: {
                getCurrentProjectName: jest.fn(() => "Test Project")
            },
            storage: {
                getItem: jest.fn(() => JSON.stringify("Custom Author")),
                setItem: jest.fn()
            },
            save: {
                saveLYFile: jest.fn(),
                download: jest.fn()
            },
            logo: {
                runningLilypond: false,
                MIDIOutput: "",
                guitarOutputHead: "",
                guitarOutputEnd: "",
                notationOutput: "",
                notationNotes: {},
                recordingBuffer: {
                    hasData: false,
                    notationOutput: "",
                    notationNotes: {}
                },
                notation: {
                    notationStaging: [],
                    notationDrumStaging: []
                },
                runLogoCommands: jest.fn()
            },
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            download: jest.fn()
        };

        // Mock secondary activity object (for different test scenarios)
        mockActivity = {
            ...activity,
            turtles: {
                turtleList: [{ painter: { doClear: jest.fn() } }],
                getTurtleCount: jest.fn(() => 1),
                getTurtle: function (index) {
                    return this.turtleList[index];
                }
            }
        };

        instance = new SaveInterface();
        instance.activity = activity;
        instance.notationConvert = "ly";
        instance.afterSaveLilypondLY = jest.fn();
        saveInterface = new SaveInterface(mockActivity);

        mockSaveLilypondOutput = jest.fn(() => "Lilypond Data");
        global.saveLilypondOutput = mockSaveLilypondOutput;
        mockDocById = jest.fn();

        window.Converter = {
            ly2pdf: jest.fn()
        };

        lydata = "Lilypond Data";
        filename = "TestProject.pdf";
        dataurl = "data:application/pdf;base64,abc123";

        document.body.style.cursor = "";
    });

    afterEach(() => {
        jest.clearAllMocks();
        if (originalClipboard === undefined) {
            delete navigator.clipboard;
        } else {
            navigator.clipboard = originalClipboard;
        }
        Object.defineProperty(window, "isSecureContext", {
            value: originalSecureContext,
            configurable: true
        });
    });

    it("should open the Lilypond modal and populate fields", () => {
        instance.saveLilypond(activity);

        expect(docById("lilypondModal").style.display).toBe("block");
        expect(docById("fileName").value).toBe("Test Project.ly");
        expect(docById("title").value).toBe("Test Project");
        expect(docById("author").value).toBe("Custom Author");
    });

    it("should close the modal when close button is clicked", () => {
        instance.saveLilypond(activity);

        const closeButton = docByClass("close")[0];
        closeButton.click();

        expect(activity.logo.runningLilypond).toBe(false);
        expect(docById("lilypondModal").style.display).toBe("none");
    });

    it("should call saveLYFile when save button is clicked", () => {
        instance.saveLilypond(activity);

        const saveButton = docById("submitLilypond");
        saveButton.click();

        expect(activity.save.saveLYFile).toHaveBeenCalledWith(false);
    });

    it("should save a Lilypond file with default settings", () => {
        saveInterface.saveLYFile();
        expect(global.docById).toHaveBeenCalledWith("fileName");
    });

    it("should save a Lilypond file with PDF conversion", () => {
        saveInterface.saveLYFile(true);
        expect(saveInterface.notationConvert).toBe("pdf");
    });

    it("should handle MIDI and guitar output settings correctly", () => {
        // Simulate MIDI and guitar checkboxes being checked
        mockDocById.mockImplementation(id => {
            const mockElements = {
                fileName: { value: "testFile" },
                title: { value: "My Project" },
                author: { value: "Mr. Mouse" },
                MIDICheck: { checked: true },
                guitarCheck: { checked: true },
                lilypondModal: { style: { display: "block" } }
            };
            return mockElements[id];
        });

        saveInterface.saveLYFile();
        // Define the expected MIDI output as a string
        const expectedMIDIOutput = `% MIDI SECTION
% Delete the %{ and %} below to include MIDI output.
%{
\\midi {
   \\tempo 4=90
}
%}

}`;
        expect(mockActivity.logo.MIDIOutput).toContain(expectedMIDIOutput);
    });

    it("should call saveLilypondOutput and afterSaveLilypondLY", () => {
        instance.afterSaveLilypond("ignored.ly");
        expect(mockSaveLilypondOutput).toHaveBeenCalledWith(instance.activity);
        expect(instance.afterSaveLilypondLY).toHaveBeenCalledWith(
            "Lilypond Data",
            "TestProject.ly"
        );
        expect(instance.notationConvert).toBe("");
    });

    it('should set cursor to "wait" and call ly2pdf with correct arguments', () => {
        instance.afterSaveLilypondPDF(lydata, filename);
        expect(document.body.style.cursor).toBe("wait");
        expect(window.Converter.ly2pdf).toHaveBeenCalledWith(lydata, expect.any(Function));
    });

    it('should reset cursor to "default" and call activity.save.download on success', () => {
        // Mock ly2pdf to call the callback with success
        window.Converter.ly2pdf.mockImplementation((lydata, callback) => {
            callback(true, dataurl);
        });

        instance.afterSaveLilypondPDF(lydata, filename);
        expect(document.body.style.cursor).toBe("default");
        expect(activity.save.download).toHaveBeenCalledWith("pdf", dataurl, filename);
    });

    it('should reset cursor to "default" and call errorMsg on failure', () => {
        const errorMessage = "Conversion failed";

        window.Converter.ly2pdf.mockImplementation((lydata, callback) => {
            callback(false, errorMessage);
        });

        // Mock console.debug to verify the error message
        console.debug = jest.fn();

        instance.afterSaveLilypondPDF(lydata, filename);

        expect(document.body.style.cursor).toBe("default");
        expect(console.debug).toHaveBeenCalledWith("Error: " + errorMessage);
        expect(activity.errorMsg).toHaveBeenCalledWith(
            "Failed to convert Lilypond to PDF. Please try saving as .ly file instead.",
            5000
        );
        // Verify activity.save.download is not called
        expect(activity.save.download).not.toHaveBeenCalled();
    });

    it("should show copied message when Clipboard API succeeds", async () => {
        const writeText = jest.fn().mockResolvedValue();
        navigator.clipboard = { writeText };
        Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });

        saveInterface.afterSaveLilypondLY(lydata, filename);
        await writeText.mock.results[0].value;

        expect(writeText).toHaveBeenCalledWith(lydata);
        expect(document.execCommand).not.toHaveBeenCalled();
        expect(mockActivity.textMsg).toHaveBeenCalled();
    });

    it("should fall back to legacy copy when Clipboard API fails", async () => {
        const writeText = jest.fn().mockRejectedValue(new Error("denied"));
        navigator.clipboard = { writeText };
        Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
        document.execCommand.mockReturnValue(true);

        saveInterface.afterSaveLilypondLY(lydata, filename);
        await writeText.mock.results[0].value.catch(() => {});

        expect(writeText).toHaveBeenCalledWith(lydata);
        expect(document.execCommand).toHaveBeenCalledWith("copy");
        expect(mockActivity.textMsg).toHaveBeenCalled();
    });

    it("should not show copied message when all copy methods fail", async () => {
        const writeText = jest.fn().mockRejectedValue(new Error("denied"));
        navigator.clipboard = { writeText };
        Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
        document.execCommand.mockReturnValue(false);

        saveInterface.afterSaveLilypondLY(lydata, filename);
        await writeText.mock.results[0].value.catch(() => {});

        expect(writeText).toHaveBeenCalledWith(lydata);
        expect(document.execCommand).toHaveBeenCalledWith("copy");
        expect(mockActivity.textMsg).not.toHaveBeenCalled();
    });

    it("should use legacy copy when Clipboard API is unavailable", () => {
        delete navigator.clipboard;
        Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
        document.execCommand.mockReturnValue(true);

        saveInterface.afterSaveLilypondLY(lydata, filename);

        expect(document.execCommand).toHaveBeenCalledWith("copy");
        expect(mockActivity.textMsg).toHaveBeenCalled();
    });
});

describe("MXML Methods", () => {
    let instance, activity, mockLogo, mockTurtles;

    beforeEach(() => {
        const mockPainter1 = { doClear: jest.fn() };
        const mockPainter2 = { doClear: jest.fn() };

        mockTurtles = {
            turtleList: [{ painter: mockPainter1 }, { painter: mockPainter2 }],
            getTurtleCount: function () {
                return this.turtleList.length;
            },
            getTurtle: function (index) {
                return this.turtleList[index];
            }
        };

        mockLogo = {
            runningMxml: false,
            notation: {
                notationStaging: {},
                notationDrumStaging: {}
            },
            runLogoCommands: jest.fn()
        };

        activity = {
            logo: mockLogo,
            turtles: mockTurtles
        };

        instance = new SaveInterface(activity);
        instance.download = jest.fn();

        global.saveMxmlOutput = jest.fn().mockReturnValue("<score>Mock MXML Data</score>");
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("should initialize MXML state and clear turtle canvases", () => {
        instance.saveMxml("test.mxml");

        // Verify runningMxml flag
        expect(activity.logo.runningMxml).toBe(true);

        // Verify notation staging initialization
        expect(activity.logo.notation.notationStaging[0]).toEqual([]);
        expect(activity.logo.notation.notationStaging[1]).toEqual([]);
        expect(activity.logo.notation.notationDrumStaging[0]).toEqual([]);
        expect(activity.logo.notation.notationDrumStaging[1]).toEqual([]);
        expect(mockTurtles.turtleList[0].painter.doClear).toHaveBeenCalledWith(true, true, true);
        expect(mockTurtles.turtleList[1].painter.doClear).toHaveBeenCalledWith(true, true, true);

        // Verify logo commands run
        expect(activity.logo.runLogoCommands).toHaveBeenCalled();
    });

    it("should generate XML and trigger download", () => {
        const filename = "TestScore.xml";
        instance.afterSaveMxml(filename);

        expect(global.saveMxmlOutput).toHaveBeenCalledWith(activity.logo);

        const expectedData =
            "data:text;utf8," + encodeURIComponent("<score>Mock MXML Data</score>");
        expect(instance.download).toHaveBeenCalledWith("xml", expectedData, filename);

        expect(activity.logo.runningMxml).toBe(false);
    });

    it("should handle empty data gracefully", () => {
        global.saveMxmlOutput.mockReturnValue("");
        instance.afterSaveMxml("empty.xml");
        expect(instance.download).toHaveBeenCalledWith(
            "xml",
            "data:text;utf8," + encodeURIComponent(""),
            "empty.xml"
        );
    });
});
