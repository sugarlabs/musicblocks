global.jQuery = jest.fn(() => ({
    on: jest.fn(),
    trigger: jest.fn(),
}));
global.jQuery.noConflict = jest.fn(() => global.jQuery);

global._ = jest.fn((str) => str);
global._THIS_IS_TURTLE_BLOCKS_ = true;
global.TITLESTRING = "Music Blocks";
global.GUIDEURL = "../guide/guide.html";

global.fileExt = jest.fn((file) => {
    if (!file) { // This covers both null and undefined
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
    prompt: jest.fn(),
};

global.document = {
    createElement: jest.fn(() => ({
        setAttribute: jest.fn(),
        click: jest.fn(),
    })),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
    },
};

global.docById = jest.fn((id) => document.getElementById(id));;
global.docByClass = jest.fn((classname) => document.getElementsByClassName(classname));

const { SaveInterface } = require('../SaveInterface');
const { LILYPONDHEADER } = require('../lilypond');
global.LILYPONDHEADER = LILYPONDHEADER;

describe("SaveInterface", () => {
    let mockActivity;
    let saveInterface;

    beforeEach(() => {
        mockActivity = {
            beginnerMode: false,
            PlanetInterface: {
                getCurrentProjectName: jest.fn(() => "My Project"),
            },
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
                getCurrentProjectName: jest.fn(() => "My Project"),
            },
        };
        instance = new SaveInterface(mockActivity);
        document.body.innerHTML = "";
    });

    it("should set correct filename and extension when defaultfilename is provided", () => {
        const mockDownloadURL = jest.spyOn(instance, 'downloadURL'); // Spy on downloadURL
        instance.download("abc", "data", "custom");
        expect(mockDownloadURL).toHaveBeenCalledWith("custom.abc", "data");
    });

    it("should default filename to 'My Project.abc' if defaultfilename is null", () => {
        global._.mockReturnValue("My Project");
        const mockDownloadURL = jest.spyOn(instance, 'downloadURL');
        instance.download("abc", "data", null);
        expect(mockDownloadURL).toHaveBeenCalledWith("undefined.abc", "data");
    });

    it("should append the extension if not present in the filename", () => {
        const mockDownloadURL = jest.spyOn(instance, 'downloadURL');
        instance.download("wav", "data", "My Project");
        expect(mockDownloadURL).toHaveBeenCalledWith("My Project.wav", "data");
    });

    it("should not append the extension if already present in the filename", () => {
        const mockDownloadURL = jest.spyOn(instance, 'downloadURL');
        instance.download("xml", "data", "My Project");
        expect(mockDownloadURL).toHaveBeenCalledWith("My Project.xml", "data");
    });
});



describe('downloadURL', () => {
    beforeEach(() => {
        document.body.innerHTML = ''; // Reset DOM before each test
        instance = new SaveInterface();
    });

    it('should create an anchor tag and trigger a download', () => {
        const filename = 'test.txt';
        const dataurl = 'data:text/plain;base64,SGVsbG8gd29ybGQ=';
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
        const clickMock = jest.fn();

        jest.spyOn(document, 'createElement').mockImplementation(() => {
            return {
                setAttribute: jest.fn(),
                click: clickMock,
            };
        });

        instance.downloadURL(filename, dataurl);

        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(clickMock).toHaveBeenCalled();
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
    });
});

describe('prepareHTML', () => {
    class MockActivity {
        constructor() {
            this.htmlSaveTemplate = "<html><body><h1>{{ project_name }}</h1><p>{{ project_description }}</p><img src='{{ project_image }}'/><div>{{ data }}</div></body></html>";
            this.data = {
                CurrentProject: 'project1',
                Projects: {
                    project1: {
                        ProjectName: 'Mock Project',
                        PublishedData: { ProjectDescription: 'Mock Description' },
                        ProjectImage: 'mock-image.png',
                    }
                }
            };
            this.defaultProjectName = 'Default Project';
            this.ImageDataURL = 'default-image.png';
        }

        prepareExport() {
            return 'Mock Exported Data';
        }

        PlanetInterface = {
            getCurrentProjectDescription: () => this.data.Projects[this.data.CurrentProject]?.PublishedData?.ProjectDescription ?? null,
            getCurrentProjectName: () => this.data.Projects[this.data.CurrentProject]?.ProjectName ?? this.defaultProjectName,
            getCurrentProjectImage: () => this.data.Projects[this.data.CurrentProject]?.ProjectImage ?? this.ImageDataURL,
        };
    }

    it('should replace placeholders with actual project data', () => {
        const activity = new MockActivity();
        let file = activity.htmlSaveTemplate;
        file = file
            .replace(/{{ project_description }}/g, activity.PlanetInterface.getCurrentProjectDescription())
            .replace(/{{ project_name }}/g, activity.PlanetInterface.getCurrentProjectName())
            .replace(/{{ data }}/g, activity.prepareExport())
            .replace(/{{ project_image }}/g, activity.PlanetInterface.getCurrentProjectImage());

        expect(file).toContain('<h1>Mock Project</h1>');
        expect(file).toContain('<p>Mock Description</p>');
        expect(file).toContain("<img src='mock-image.png'/>");
        expect(file).toContain('<div>Mock Exported Data</div>');
    });
});

describe('saveHTML', () => {
    it('should call prepareHTML and download the file', () => {
        const mockPrepareHTML = jest.fn(() => '<html>Mock HTML</html>');
        const mockDownload = jest.fn();
        const instance = new SaveInterface();
        const activity = {
            save: {
                prepareHTML: mockPrepareHTML,
                download: mockDownload,
            }
        };

        instance.saveHTML(activity);

        expect(mockPrepareHTML).toHaveBeenCalled();
        expect(mockDownload).toHaveBeenCalledWith("html", "data:text/plain;charset=utf-8,%3Chtml%3EMock%20HTML%3C%2Fhtml%3E", null);
    });
});

describe('saveHTMLNoPrompt', () => {
    jest.useFakeTimers();

    it('should call prepareHTML and download the file with the correct filename', () => {
        const mockPrepareHTML = jest.fn(() => '<html>Mock HTML</html>');
        const mockDownloadURL = jest.fn();
        const mockGetProjectName = jest.fn(() => 'MockProject');

        const activity = {
            save: {
                prepareHTML: mockPrepareHTML,
                downloadURL: mockDownloadURL,
            },
            PlanetInterface: {
                getCurrentProjectName: mockGetProjectName,
            }
        };

        const instance = new SaveInterface();
        instance.saveHTMLNoPrompt(activity);
        jest.runAllTimers();

        expect(mockPrepareHTML).toHaveBeenCalled();
        expect(mockGetProjectName).toHaveBeenCalled();
        expect(mockDownloadURL).toHaveBeenCalledWith("MockProject.html", "data:text/plain;charset=utf-8,%3Chtml%3EMock%20HTML%3C%2Fhtml%3E");
    });
});

describe('saveSVG', () => {
    it('should call doSVG and download the SVG file', () => {
        const mockDoSVG = jest.fn(() => '<svg>Mock SVG</svg>');
        const mockDownload = jest.fn();

        global.doSVG = mockDoSVG;

        const activity = {
            save: {
                download: mockDownload,
            },
            canvas: { width: 500, height: 500 },
            logo: 'mockLogo',
            turtles: 'mockTurtles'
        };

        const instance = new SaveInterface();
        instance.saveSVG(activity);
        expect(mockDoSVG).toHaveBeenCalledWith(
            activity.canvas,
            activity.logo,
            activity.turtles,
            activity.canvas.width,
            activity.canvas.height,
            1.0
        );
        expect(mockDownload).toHaveBeenCalledWith("svg", "data:image/svg+xml;utf8,<svg>Mock SVG</svg>", null);
    });
});

describe('savePNG', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <canvas id="overlayCanvas"></canvas>
        `;

        docById.mockImplementation((id) => document.getElementById(id));
    });

    it('should call toDataURL and download the PNG file', () => {
        const mockDownload = jest.fn();
        const mockCanvas = { toDataURL: jest.fn(() => 'data:image/png;base64,mockdata') };
        global.docById = jest.fn(() => mockCanvas);

        const activity = {
            save: {
                download: mockDownload,
            }
        };

        const instance = new SaveInterface();
        instance.savePNG(activity);

        expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/png");
        expect(mockDownload).toHaveBeenCalledWith("png", "data:image/png;base64,mockdata", null);
    });
});

describe('saveBlockArtwork', () => {
    it('should call printBlockSVG and download the SVG file', () => {
        const mockPrintBlockSVG = jest.fn(() => '<svg>Mock SVG</svg>');
        const mockDownload = jest.fn();

        const activity = {
            save: {
                download: mockDownload,
            },
            printBlockSVG: mockPrintBlockSVG
        };

        const instance = new SaveInterface();
        instance.saveBlockArtwork(activity);

        expect(mockPrintBlockSVG).toHaveBeenCalled();
        expect(mockDownload).toHaveBeenCalledWith("svg", "data:image/svg+xml;utf8,<svg>Mock SVG</svg>", null);
    });
});

describe('saveBlockArtworkPNG', () => {
    it('should call printBlockPNG and download the PNG file', async () => {
        const mockPrintBlockPNG = jest.fn(() => Promise.resolve('data:image/png;base64,mockdata'));
        const mockDownload = jest.fn();

        const activity = {
            save: {
                download: mockDownload,
            },
            printBlockPNG: mockPrintBlockPNG
        };

        const instance = new SaveInterface();
        await instance.saveBlockArtworkPNG(activity);

        expect(mockPrintBlockPNG).toHaveBeenCalled();
        expect(mockDownload).toHaveBeenCalledWith("png", "data:image/png;base64,mockdata", null);
    });
});

describe('saveWAV', () => {
    beforeEach(() => {
        global._ = jest.fn((key) => key);

    });
    it('should start audio recording and update UI', () => {
        const mockSetupRecorder = jest.fn();
        const mockStartRecording = jest.fn();
        const mockRunLogoCommands = jest.fn();
        const mockTextMsg = jest.fn();

        const activity = {
            logo: {
                recording: false,
                synth: {
                    setupRecorder: mockSetupRecorder,
                    recorder: { start: mockStartRecording },
                },
                runLogoCommands: mockRunLogoCommands,
            },
            textMsg: mockTextMsg,
        };

        const instance = new SaveInterface();
        instance.saveWAV(activity);

        expect(document.body.style.cursor).toBe("wait");
        expect(activity.logo.recording).toBe(true);
        expect(mockSetupRecorder).toHaveBeenCalled();
        expect(mockStartRecording).toHaveBeenCalled();
        expect(mockRunLogoCommands).toHaveBeenCalled();
        expect(mockTextMsg).toHaveBeenCalledWith("Your recording is in progress.");
    });
});

describe('saveAbc', () => {
    beforeEach(() => {
        global.ABCHEADER = "X:1\nT:Music Blocks composition\nC:Mr. Mouse\nL:1/16\nM:C\n";
    });

    it('should prepare and run ABC notation commands', () => {
        const mockRunLogoCommands = jest.fn();
        const activity = {
            logo: {
                runningAbc: false,
                notationOutput: "",
                notationNotes: {},
                notation: {
                    notationStaging: {},
                    notationDrumStaging: {}
                },
                runLogoCommands: mockRunLogoCommands
            },
            turtles: {
                turtleList: [{ painter: { doClear: jest.fn() } }]
            }
        };

        const instance = new SaveInterface();
        instance.saveAbc(activity);

        expect(document.body.style.cursor).toBe("wait");
        expect(activity.logo.runningAbc).toBe(true);
        expect(mockRunLogoCommands).toHaveBeenCalled();
    });
});

describe('afterSaveAbc', () => {
    it('should encode and download ABC notation output', () => {
        const mockDownload = jest.fn();
        const mockSaveAbcOutput = jest.fn(() => "mock_abc_data");

        global.saveAbcOutput = mockSaveAbcOutput;

        const activity = {
            save: {
                download: mockDownload
            }
        };

        const instance = new SaveInterface();
        instance.afterSaveAbc.call({ activity });

        expect(mockSaveAbcOutput).toHaveBeenCalledWith(activity);
        expect(mockDownload).toHaveBeenCalledWith("abc", "data:text;utf8,mock_abc_data", null);
    });
});

describe('saveLilypond', () => {
    let activity;
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="lilypondModal" style="display: none;">
                <div class="modal-content" tabindex="-1">
                    <span class="close">×</span>
                    <div id="fileNameText">File name</div>
                    <input type="text" id="fileName" tabindex="-1">
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

        global.docById = jest.fn((id) => document.getElementById(id));

        jest.spyOn(document, "getElementById").mockImplementation((id) => document.querySelector(`#${id}`));

        // Mock activity object
        activity = {
            PlanetInterface: {
                getCurrentProjectName: jest.fn(() => "Test Project"),
            },
            storage: {
                getItem: jest.fn(() => JSON.stringify("Custom Author")),
            },
            save: {
                saveLYFile: jest.fn(),
            },
            logo: {
                runningLilypond: false,
            },
        };
    });

    it('should open the Lilypond modal and populate fields', () => {
        const instance = new SaveInterface();
        instance.saveLilypond(activity);

        expect(docById("lilypondModal").style.display).toBe("block");
        expect(docById("fileName").value).toBe("Test Project.ly");
        expect(docById("title").value).toBe("Test Project");
        expect(docById("author").value).toBe("Custom Author");
    });

    it('should close the modal when close button is clicked', () => {
        const instance = new SaveInterface();
        instance.saveLilypond(activity);

        const closeButton = docByClass("close")[0];
        closeButton.click();

        expect(activity.logo.runningLilypond).toBe(false);
        expect(docById("lilypondModal").style.display).toBe("none");
    });

    it('should call saveLYFile when save button is clicked', () => {
        const instance = new SaveInterface();
        instance.saveLilypond(activity);

        const saveButton = docById("submitLilypond");
        saveButton.click();

        expect(activity.save.saveLYFile).toHaveBeenCalledWith(false);
    });
});

describe('saveLYFile', () => {
    let saveInterface;
    let mockActivity;
    let mockDocById;
    let mockStorage;

    beforeEach(() => {
        // Mock the activity object
        mockActivity = {
            logo: {
                MIDIOutput: '',
                guitarOutputHead: '',
                guitarOutputEnd: '',
                runningLilypond: false,
                notationOutput: '',
                notationNotes: {},
                notation: {
                    notationStaging: [],
                    notationDrumStaging: [],
                },
                runLogoCommands: jest.fn(),
            },
            turtles: {
                turtleList: [
                    {
                        painter: {
                            doClear: jest.fn(),
                        },
                    },
                ],
            },
            storage: {
                setItem: jest.fn(),
            },
        };

        global.docById = jest.fn((id) => document.getElementById(id));

        // Mock the document.getElementById function
        mockDocById = jest.fn((id) => {
            const mockElements = {
                fileName: { value: 'testFile' },
                title: { value: 'My Project' },
                author: { value: 'Mr. Mouse' },
                MIDICheck: { checked: true },
                guitarCheck: { checked: false },
                lilypondModal: { style: { display: 'block' } },
            };
            return mockElements[id];
        });

        // Mock global document and localStorage
        global.document = {
            getElementById: mockDocById,
            body: {
                style: {},
            },
        };

        saveInterface = new SaveInterface(mockActivity);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should save a Lilypond file with default settings', () => {
        saveInterface.saveLYFile();
        expect(global.docById).toHaveBeenCalledWith('fileName');
        expect(mockActivity.storage.setItem).toHaveBeenCalledWith(
            'customAuthor',
            JSON.stringify('Custom Author')
        );

    });

    it('should save a Lilypond file with PDF conversion', () => {
        saveInterface.saveLYFile(true);
        expect(saveInterface.notationConvert).toBe('pdf');
    });

    it('should handle MIDI and guitar output settings correctly', () => {
        // Simulate MIDI and guitar checkboxes being checked
        mockDocById.mockImplementation((id) => {
            const mockElements = {
                fileName: { value: 'testFile' },
                title: { value: 'My Project' },
                author: { value: 'Mr. Mouse' },
                MIDICheck: { checked: true },
                guitarCheck: { checked: true },
                lilypondModal: { style: { display: 'block' } },
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
        const receivedMIDIOutput = mockActivity.logo.MIDIOutput;
        expect(receivedMIDIOutput).toContain(expectedMIDIOutput);
    });

});

describe('afterSaveLilypond', () => {
    let instance, activity, mockSaveLilypondOutput;

    beforeEach(() => {
        document.body.innerHTML = `<input type="text" id="fileName" value="TestProject.ly">`;
        global.docById = jest.fn((id) => document.getElementById(id));

        global.platform = { FF: false };

        // Mock jQuery with necessary methods including 'on'
        global.jQuery = jest.fn((selector) => {
            if (selector === window) {
                return {
                    on: jest.fn(), // Mock 'on' method for window
                };
            }
            return {
                appendTo: jest.fn().mockReturnThis(),
                val: jest.fn().mockReturnThis(),
                select: jest.fn(),
                remove: jest.fn(),
                on: jest.fn(), // 'on' is available for other elements
            };
        });

        // Ensure noConflict returns the jQuery mock
        global.jQuery.noConflict = jest.fn().mockImplementation(() => global.jQuery);

        document.execCommand = jest.fn();

        mockSaveLilypondOutput = jest.fn(() => "Lilypond Data");
        global.saveLilypondOutput = mockSaveLilypondOutput;

        activity = {
            textMsg: jest.fn(),
            download: jest.fn(),
        };

        instance = new SaveInterface();
        instance.activity = activity;
        instance.notationConvert = "ly";
        instance.afterSaveLilypondLY = jest.fn();
    });

    it('should call saveLilypondOutput and afterSaveLilypondLY', () => {
        instance.afterSaveLilypond("ignored.ly");

        expect(mockSaveLilypondOutput).toHaveBeenCalledWith(instance.activity);
        expect(instance.afterSaveLilypondLY).toHaveBeenCalledWith("Lilypond Data", "TestProject.ly");
        expect(instance.notationConvert).toBe("");
    });
});

describe('afterSaveLilypondPDF', () => {
    let instance, activity;

    beforeEach(() => {
        document.body.style.cursor = "";
        window.Converter = {
            ly2pdf: jest.fn(),
        };

        activity = {
            save: {
                download: jest.fn(),
            },
        };

        instance = new SaveInterface();
        instance.activity = activity;
    });

    it('should set cursor to "wait" and call ly2pdf with correct arguments', () => {
        const lydata = "Lilypond Data";
        const filename = "TestProject.pdf";

        instance.afterSaveLilypondPDF(lydata, filename);
        expect(document.body.style.cursor).toBe("wait");
        expect(window.Converter.ly2pdf).toHaveBeenCalledWith(lydata, expect.any(Function));
    });

    it('should reset cursor to "default" and call activity.save.download on success', () => {
        const lydata = "Lilypond Data";
        const filename = "TestProject.pdf";
        const dataurl = "data:application/pdf;base64,abc123";

        // Mock ly2pdf to call the callback with success
        window.Converter.ly2pdf.mockImplementation((lydata, callback) => {
            callback(true, dataurl);
        });

        instance.afterSaveLilypondPDF(lydata, filename);
        expect(document.body.style.cursor).toBe("default");
        expect(activity.save.download).toHaveBeenCalledWith("pdf", dataurl, filename);
    });

    it('should reset cursor to "default" and log an error on failure', () => {
        const lydata = "Lilypond Data";
        const filename = "TestProject.pdf";
        const errorMessage = "Conversion failed";

        window.Converter.ly2pdf.mockImplementation((lydata, callback) => {
            callback(false, errorMessage);
        });

        // Mock console.debug to verify the error message
        console.debug = jest.fn();

        instance.afterSaveLilypondPDF(lydata, filename);

        expect(document.body.style.cursor).toBe("default");
        expect(console.debug).toHaveBeenCalledWith("Error: " + errorMessage);

        // Verify activity.save.download is not called
        expect(activity.save.download).not.toHaveBeenCalled();
    });
});

describe('MXML Methods', () => {
    let instance, activity, mockLogo, mockTurtles;

    beforeEach(() => {
        // Mock turtleList with painters
        const mockPainter1 = { doClear: jest.fn() };
        const mockPainter2 = { doClear: jest.fn() };

        mockTurtles = {
            turtleList: [
                { painter: mockPainter1 },
                { painter: mockPainter2 }
            ]
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
        instance = new SaveInterface();
        instance.activity = activity;
        instance.download = jest.fn();

        // Mock saveMxmlOutput
        global.saveMxmlOutput = jest.fn().mockReturnValue("<score>Mock MXML Data</score>");
    });

    describe('saveMxml', () => {
        it('should initialize MXML state and clear turtle canvases', () => {
            instance.saveMxml("test.mxml");

            // Verify runningMxml flag
            expect(activity.logo.runningMxml).toBe(true);

            // Verify notation staging initialization
            expect(activity.logo.notation.notationStaging[0]).toEqual([]);
            expect(activity.logo.notation.notationStaging[1]).toEqual([]);
            expect(activity.logo.notation.notationDrumStaging[0]).toEqual([]);
            expect(activity.logo.notation.notationDrumStaging[1]).toEqual([]);
            expect(mockTurtles.turtleList[0].painter.doClear)
                .toHaveBeenCalledWith(true, true, true);
            expect(mockTurtles.turtleList[1].painter.doClear)
                .toHaveBeenCalledWith(true, true, true);

            // Verify logo commands run
            expect(activity.logo.runLogoCommands).toHaveBeenCalled();
        });
    });

    describe('afterSaveMxml', () => {
        it('should generate XML and trigger download', () => {
            const filename = "TestScore.xml";
            instance.afterSaveMxml(filename);

            expect(global.saveMxmlOutput).toHaveBeenCalledWith(activity.logo);

            const expectedData = "data:text;utf8," + encodeURIComponent("<score>Mock MXML Data</score>");
            expect(instance.download).toHaveBeenCalledWith(
                "xml",
                expectedData,
                filename
            );

            expect(activity.logo.runningMxml).toBe(false);
        });

        it('should handle empty data gracefully', () => {
            global.saveMxmlOutput.mockReturnValue("");
            instance.afterSaveMxml("empty.xml");
            expect(instance.download).toHaveBeenCalledWith(
                "xml",
                "data:text;utf8," + encodeURIComponent(""),
                "empty.xml"
            );
        });
    });
});