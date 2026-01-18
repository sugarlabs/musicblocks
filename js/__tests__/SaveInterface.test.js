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

const { SaveInterface } = require("../SaveInterface");
const { LILYPONDHEADER } = require("../lilypond");
global.LILYPONDHEADER = LILYPONDHEADER;
global.instance = new SaveInterface();

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
        mockDownloadURL = jest.spyOn(instance, "downloadURL"); // Spy on downloadURL
        Object.defineProperty(window, "prompt", {
            writable: true,
            value: jest.fn(() => "My Project.abc")
        });
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

    instance = new SaveInterface();

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
    afterEach(() => {
        jest.restoreAllMocks();
    });
});

describe("save HTML methods", () => {
    let activity;

    beforeEach(() => {
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

    jest.useFakeTimers();

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

    it("should use default filename when PlanetInterface is undefined", () => {
        const mockPrepareHTML = jest.fn(() => "<html>Mock HTML</html>");
        const activity = {
            save: {
                prepareHTML: mockPrepareHTML,
                downloadURL: mockDownloadURL
            },
            PlanetInterface: undefined
        };

        instance.saveHTMLNoPrompt(activity);
        jest.runAllTimers();

        expect(mockDownloadURL).toHaveBeenCalledWith(
            "My_Project.html",
            expect.any(String)
        );
    });
});

describe("downloadURL", () => {
    let instance;

    beforeEach(() => {
        instance = new SaveInterface({});
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
    });

    it("should create anchor element with correct attributes", () => {
        const mockClick = jest.fn();
        const mockSetAttribute = jest.fn();
        jest.spyOn(document, "createElement").mockReturnValue({
            setAttribute: mockSetAttribute,
            click: mockClick
        });

        instance.downloadURL("test.txt", "data:text/plain,hello");

        expect(document.createElement).toHaveBeenCalledWith("a");
        expect(mockSetAttribute).toHaveBeenCalledWith("href", "data:text/plain,hello");
        expect(mockSetAttribute).toHaveBeenCalledWith("download", "test.txt");
        expect(mockClick).toHaveBeenCalled();
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
    });
});

describe("saveMIDI Method", () => {
    let activity, mockLogo;

    beforeEach(() => {
        mockLogo = {
            runningMIDI: false,
            runLogoCommands: jest.fn()
        };
        activity = {
            logo: mockLogo
        };
    });

    it("should set runningMIDI to true and run logo commands", () => {
        instance.saveMIDI(activity);
        expect(activity.logo.runningMIDI).toBe(true);
        expect(activity.logo.runLogoCommands).toHaveBeenCalled();
        expect(document.body.style.cursor).toBe("wait");
    });
});

describe("afterSaveMIDI", () => {
    beforeEach(() => {
        global.activity = {
            logo: {
                _midiData: {
                    "0": [
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

        global.URL.createObjectURL = jest.fn(() => "mockURL");
        jest.useFakeTimers();

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
    });

    it("should generate MIDI and trigger download", () => {
        instance.afterSaveMIDI();
        jest.runAllTimers();

        expect(Midi).toHaveBeenCalled();
        expect(activity.save.download).toHaveBeenCalledWith("midi", "mockURL", null);
        expect(activity.logo._midiData).toEqual({});
        expect(document.body.style.cursor).toBe("default");
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
    beforeEach(() => {
        document.body.innerHTML = `
            <canvas id="overlayCanvas"></canvas>
        `;

        docById.mockImplementation(id => document.getElementById(id));
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
    beforeEach(() => {
        global._ = jest.fn(key => key);
        global.ABCHEADER = "X:1\nT:Music Blocks composition\nC:Mr. Mouse\nL:1/16\nM:C\n";
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

describe("saveLilypond Methods", () => {
    let activity, saveInterface, mockActivity, mockDocById;

    beforeEach(() => {
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

    afterEach(() => {
        jest.clearAllMocks();
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
});

describe("prepareHTML", () => {
    let instance, activity;

    beforeEach(() => {
        activity = {
            prepareExport: jest.fn(() => '{"blocks":"mockdata"}'),
            PlanetInterface: {
                getCurrentProjectDescription: jest.fn(() => "A test project description"),
                getCurrentProjectName: jest.fn(() => "TestProject"),
                getCurrentProjectImage: jest.fn(() => "data:image/png;base64,testimage")
            }
        };
        instance = new SaveInterface(activity);
    });

    it("should replace all placeholders with project data", () => {
        const result = instance.prepareHTML();

        expect(result).toContain("TestProject");
        expect(result).toContain("A test project description");
        expect(result).toContain('{"blocks":"mockdata"}');
        expect(result).toContain("data:image/png;base64,testimage");
        expect(activity.prepareExport).toHaveBeenCalled();
    });

    it("should use default description when PlanetInterface is undefined", () => {
        instance.activity.PlanetInterface = undefined;
        const result = instance.prepareHTML();

        expect(result).toContain("No description provided");
        expect(result).toContain("My Project");
    });

    it("should use default name when PlanetInterface is undefined", () => {
        instance.activity.PlanetInterface = undefined;
        const result = instance.prepareHTML();

        expect(result).toContain("My Project");
    });
});

describe("download edge cases", () => {
    let instance;

    beforeEach(() => {
        const mockActivity = {
            beginnerMode: false,
            PlanetInterface: {
                getCurrentProjectName: jest.fn(() => "My Project")
            }
        };
        instance = new SaveInterface(mockActivity);
        instance.downloadURL = jest.fn();
    });

    it("should return early when filename is null after prompt", () => {
        global.window.prompt = jest.fn(() => null);
        global.window.isElectron = false;
        
        const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
        instance.download("abc", "data", null);
        
        expect(consoleSpy).toHaveBeenCalledWith("save cancelled");
        consoleSpy.mockRestore();
    });

    it("should use default filename in Electron mode without prompt", () => {
        global.window.isElectron = true;
        instance.download("abc", "data", null);
        
        expect(instance.downloadURL).toHaveBeenCalledWith("My Project.abc", "data");
        global.window.isElectron = false;
    });

    it("should use default project name when PlanetInterface is undefined", () => {
        instance.activity.PlanetInterface = undefined;
        global.window.prompt = jest.fn(() => "My Project.abc");
        
        instance.download("abc", "data", null);
        
        expect(instance.downloadURL).toHaveBeenCalledWith("My Project.abc", "data");
    });
});

describe("afterSaveMIDI edge cases", () => {
    beforeEach(() => {
        global.activity = {
            logo: {
                _midiData: {}
            },
            save: {
                download: jest.fn()
            }
        };

        global.URL.createObjectURL = jest.fn(() => "mockURL");
        jest.useFakeTimers();

        global.getMidiInstrument = jest.fn(() => ({
            default: 0,
            guitar: 25,
            piano: 0
        }));

        global.getMidiDrum = jest.fn(() => ({
            "snare drum": 38,
            "kick drum": 36
        }));
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it("should handle drum tracks correctly", () => {
        global.activity.logo._midiData = {
            "0": [
                {
                    note: [],
                    drum: "snare drum",
                    duration: 4,
                    bpm: 90
                }
            ]
        };

        instance.afterSaveMIDI();
        jest.runAllTimers();

        expect(Midi).toHaveBeenCalled();
        expect(activity.save.download).toHaveBeenCalledWith("midi", "mockURL", null);
    });

    it("should handle rest notes (notes containing 'R')", () => {
        global.activity.logo._midiData = {
            "0": [
                {
                    note: ["R"],
                    duration: 4,
                    bpm: 90,
                    instrument: "piano"
                }
            ]
        };

        instance.afterSaveMIDI();
        jest.runAllTimers();

        expect(Midi).toHaveBeenCalled();
    });

    it("should handle empty note arrays", () => {
        global.activity.logo._midiData = {
            "0": [
                {
                    note: [],
                    duration: 4,
                    bpm: 90,
                    instrument: "piano"
                }
            ]
        };

        instance.afterSaveMIDI();
        jest.runAllTimers();

        expect(activity.save.download).toHaveBeenCalled();
    });

    it("should handle multiple tracks with different instruments", () => {
        global.activity.logo._midiData = {
            "0": [
                {
                    note: ["C4"],
                    duration: 4,
                    bpm: 90,
                    instrument: "piano"
                },
                {
                    note: ["E4"],
                    duration: 4,
                    bpm: 90,
                    instrument: "guitar"
                }
            ],
            "1": [
                {
                    note: ["G4"],
                    duration: 2,
                    bpm: 120,
                    instrument: "piano"
                }
            ]
        };

        instance.afterSaveMIDI();
        jest.runAllTimers();

        expect(Midi).toHaveBeenCalled();
        expect(activity.save.download).toHaveBeenCalled();
    });

    it("should normalize notes with sharps and flats", () => {
        global.activity.logo._midiData = {
            "0": [
                {
                    note: ["C♯4", "D♭4"],
                    duration: 4,
                    bpm: 90,
                    instrument: "piano"
                }
            ]
        };

        instance.afterSaveMIDI();
        jest.runAllTimers();

        expect(Midi).toHaveBeenCalled();
    });

    it("should use default instrument when instrument is not specified", () => {
        global.activity.logo._midiData = {
            "0": [
                {
                    note: ["C4"],
                    duration: 4,
                    bpm: 90
                    // No instrument specified
                }
            ]
        };

        instance.afterSaveMIDI();
        jest.runAllTimers();

        expect(Midi).toHaveBeenCalled();
    });
});

describe("saveAbc with buffered data", () => {
    let instance, activity;

    beforeEach(() => {
        jest.useFakeTimers();
        activity = {
            logo: {
                runningAbc: false,
                notationOutput: "",
                notationNotes: {},
                recordingBuffer: {
                    hasData: true,
                    notationOutput: "X:1\nBuffered ABC Data",
                    notationNotes: { 0: ["C4", "E4"] },
                    notationStaging: { 0: ["staging data"] },
                    notationDrumStaging: { 0: ["drum staging"] }
                },
                notation: {
                    notationStaging: {},
                    notationDrumStaging: {}
                },
                runLogoCommands: jest.fn()
            },
            turtles: {
                getTurtleCount: jest.fn(() => 1),
                getTurtle: jest.fn(() => ({ painter: { doClear: jest.fn() } }))
            },
            save: {
                afterSaveAbc: jest.fn()
            }
        };
        instance = new SaveInterface(activity);
        instance.activity = activity;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should use buffered data when available", () => {
        instance.saveAbc(activity);
        
        expect(activity.logo.notationOutput).toBe("X:1\nBuffered ABC Data");
        expect(activity.logo.notationNotes).toEqual({ 0: ["C4", "E4"] });
        expect(activity.logo.notation.notationStaging[0]).toEqual(["staging data"]);
        expect(activity.logo.notation.notationDrumStaging[0]).toEqual(["drum staging"]);
        
        jest.runAllTimers();
        expect(activity.save.afterSaveAbc).toHaveBeenCalled();
    });

    it("should run logo commands when no buffered data", () => {
        activity.logo.recordingBuffer.hasData = false;
        
        instance.saveAbc(activity);
        
        expect(activity.logo.runningAbc).toBe(true);
        expect(activity.logo.runLogoCommands).toHaveBeenCalled();
    });
});

describe("saveLilypond with buffered data", () => {
    let instance, activity;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="lilypondModal" style="display: none;">
                <span class="close">×</span>
                <input type="text" id="fileName" value="">
                <input type="text" id="title" value="">
                <input type="text" id="author" value="">
                <input type="checkbox" id="MIDICheck">
                <input type="checkbox" id="guitarCheck">
                <button id="submitLilypond"></button>
                <div id="fileNameText"></div>
                <div id="titleText"></div>
                <div id="authorText"></div>
                <div id="MIDIText"></div>
                <div id="guitarText"></div>
            </div>
        `;
        global.docById = jest.fn(id => document.getElementById(id));
        global.docByClass = jest.fn(className => document.getElementsByClassName(className));
        
        activity = {
            PlanetInterface: {
                getCurrentProjectName: jest.fn(() => "BufferedProject")
            },
            storage: {
                getItem: jest.fn(() => null),
                setItem: jest.fn()
            },
            logo: {
                runningLilypond: false,
                recordingBuffer: {
                    hasData: true,
                    notationOutput: "Buffered Lilypond",
                    notationNotes: {},
                    notationStaging: { 0: [] },
                    notationDrumStaging: { 0: [] }
                },
                notation: {
                    notationStaging: {},
                    notationDrumStaging: {}
                },
                runLogoCommands: jest.fn()
            },
            turtles: {
                getTurtleCount: jest.fn(() => 1),
                getTurtle: jest.fn(() => ({ painter: { doClear: jest.fn() } }))
            },
            save: {
                saveLYFile: jest.fn()
            }
        };
        instance = new SaveInterface(activity);
    });

    it("should restore buffered notation data when available", () => {
        instance.saveLilypond(activity);
        
        expect(activity.logo.notationOutput).toBe("Buffered Lilypond");
    });

    it("should use default author when no custom author in storage", () => {
        instance.saveLilypond(activity);
        
        expect(docById("author").value).toBe("Mr. Mouse");
    });
});

describe("saveLYFile comprehensive", () => {
    let instance, activity;

    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = `
            <div id="lilypondModal" style="display: block;">
                <input type="text" id="fileName" value="testfile">
                <input type="text" id="title" value="Test Title">
                <input type="text" id="author" value="Test Author">
                <input type="checkbox" id="MIDICheck" checked>
                <input type="checkbox" id="guitarCheck" checked>
            </div>
        `;
        global.docById = jest.fn(id => document.getElementById(id));
        global.LILYPONDHEADER = "\\header { title = \"My Music Blocks Creation\" composer = \"Mr. Mouse\" }";
        
        activity = {
            storage: {
                setItem: jest.fn()
            },
            logo: {
                MIDIOutput: "",
                guitarOutputHead: "",
                guitarOutputEnd: "",
                notationOutput: "",
                notationNotes: {},
                runningLilypond: false,
                recordingBuffer: {
                    hasData: false
                },
                notation: {
                    notationStaging: {},
                    notationDrumStaging: {}
                },
                runLogoCommands: jest.fn()
            },
            turtles: {
                getTurtleCount: jest.fn(() => 2),
                getTurtle: jest.fn(() => ({ painter: { doClear: jest.fn() } }))
            }
        };
        instance = new SaveInterface(activity);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should set MIDI output when MIDICheck is checked", () => {
        instance.saveLYFile(false);
        
        expect(activity.logo.MIDIOutput).toContain("MIDI Output included!");
    });

    it("should set guitar output when guitarCheck is checked", () => {
        instance.saveLYFile(false);
        
        expect(activity.logo.guitarOutputHead).toContain("Guitar tablature output included!");
    });

    it("should set notationConvert to pdf when isPDF is true", () => {
        instance.saveLYFile(true);
        
        expect(instance.notationConvert).toBe("pdf");
    });

    it("should append .ly extension if not present", () => {
        document.getElementById("fileName").value = "myproject";
        instance.saveLYFile(false);
        
        expect(activity.logo.runningLilypond).toBe(true);
    });

    it("should save author to storage", () => {
        instance.saveLYFile(false);
        
        expect(activity.storage.setItem).toHaveBeenCalledWith(
            "customAuthor",
            JSON.stringify("Test Author")
        );
    });

    it("should handle buffered data and save immediately", () => {
        activity.logo.recordingBuffer.hasData = true;
        activity.logo.notationOutput = "Existing notation";
        instance.afterSaveLilypond = jest.fn();
        
        instance.saveLYFile(false);
        jest.runAllTimers();
        
        expect(instance.afterSaveLilypond).toHaveBeenCalled();
    });

    it("should replace title and author in header", () => {
        activity.logo.recordingBuffer.hasData = true;
        activity.logo.notationOutput = "My Music Blocks Creation by Mr. Mouse";
        instance.afterSaveLilypond = jest.fn();
        
        instance.saveLYFile(false);
        
        expect(activity.logo.notationOutput).toContain("Test Title");
        expect(activity.logo.notationOutput).toContain("Test Author");
    });
});

describe("afterSaveLilypondLY", () => {
    let instance, activity;

    beforeEach(() => {
        document.body.innerHTML = `<input type="text" id="fileName" value="test.ly">`;
        global.docById = jest.fn(id => document.getElementById(id));
        global.platform = { FF: false };
        const jQueryMock = jest.fn(() => ({
            appendTo: jest.fn().mockReturnThis(),
            val: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            remove: jest.fn(),
            on: jest.fn(),
            0: { setSelectionRange: jest.fn() }
        }));
        jQueryMock.noConflict = jest.fn(() => jQueryMock);
        global.jQuery = jQueryMock;
        document.execCommand = jest.fn();
        
        activity = {
            textMsg: jest.fn()
        };
        instance = new SaveInterface(activity);
        instance.download = jest.fn();
    });

    it("should copy lilypond code to clipboard and show message", () => {
        const lydata = "\\relative c' { c4 d e f }";
        
        instance.afterSaveLilypondLY(lydata, "test.ly");
        
        expect(document.execCommand).toHaveBeenCalledWith("copy");
        expect(activity.textMsg).toHaveBeenCalled();
        expect(instance.download).toHaveBeenCalledWith(
            "ly",
            expect.stringContaining("data:text;utf8,"),
            "test.ly"
        );
    });

    it("should skip clipboard on Firefox", () => {
        global.platform.FF = true;
        const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
        
        instance.afterSaveLilypondLY("data", "test.ly");
        
        expect(consoleSpy).toHaveBeenCalledWith('execCommand("copy") does not work on FireFox');
        expect(instance.download).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});

describe("afterSaveLilypond", () => {
    let instance, activity;

    beforeEach(() => {
        document.body.innerHTML = `<input type="text" id="fileName" value="output.ly">`;
        global.docById = jest.fn(id => document.getElementById(id));
        global.saveLilypondOutput = jest.fn(() => "Lilypond output data");
        const jQueryMock = jest.fn(() => ({ on: jest.fn() }));
        jQueryMock.noConflict = jest.fn(() => jQueryMock);
        global.jQuery = jQueryMock;
        
        activity = {};
        instance = new SaveInterface(activity);
        instance.afterSaveLilypondLY = jest.fn();
        instance.afterSaveLilypondPDF = jest.fn();
    });

    it("should call afterSaveLilypondLY when notationConvert is empty", () => {
        instance.notationConvert = "";
        
        instance.afterSaveLilypond();
        
        expect(instance.afterSaveLilypondLY).toHaveBeenCalledWith("Lilypond output data", "output.ly");
        expect(instance.notationConvert).toBe("");
    });

    it("should call afterSaveLilypondPDF when notationConvert is pdf", () => {
        instance.notationConvert = "pdf";
        
        instance.afterSaveLilypond();
        
        expect(instance.afterSaveLilypondPDF).toHaveBeenCalledWith("Lilypond output data", "output.ly");
    });
});

describe("MXML Methods", () => {
    let instance, activity, mockLogo, mockTurtles;

    beforeEach(() => {
        // Mock jQuery
        const jQueryMock = jest.fn(() => ({ on: jest.fn() }));
        jQueryMock.noConflict = jest.fn(() => jQueryMock);
        global.jQuery = jQueryMock;

        // Mock turtleList with painters
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

        // Mock logo object
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

        // Create SaveInterface instance
        instance = new SaveInterface(activity);
        instance.download = jest.fn();

        // Mock saveMxmlOutput
        global.saveMxmlOutput = jest.fn().mockReturnValue("<score>Mock MXML Data</score>");
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
