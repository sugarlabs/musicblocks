/**
 * MusicBlocks v3.4.1
 *
 * @author Sapnil Biswas
 *
 * @copyright 2026 Music Blocks contributors
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

global._ = jest.fn(str => str);
global.jQuery = jest.fn(() => ({
    modal: jest.fn(),
    material_chip: jest.fn().mockReturnValue([]),
    on: jest.fn()
}));
global.Materialize = {
    updateTextFields: jest.fn()
};

const { Publisher } = require("../Publisher");

describe("Publisher", () => {
    let publisher;
    let mockPlanet;

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = `
            <div id="publisher">
                <div id="publisher-content"></div>
                <form id="publisher-form">
                    <input type="text" id="publish-id" />
                    <input type="text" id="publish-title" />
                    <label id="publish-title-label"></label>
                    <textarea id="publish-description"></textarea>
                    <label id="publish-description-label"></label>
                    <img id="publish-image" />
                    <div id="publisher-ptitle"></div>
                    <div id="publisher-error" style="display:none;"></div>
                    <div id="publisher-progress" style="visibility:hidden;"></div>
                    <button id="publisher-submit"></button>
                    <button id="publisher-cancel"></button>
                </form>
            </div>
        `;

        mockPlanet = {
            IsMusicBlocks: true,
            ConnectedToServer: true,
            TagsManifest: {
                1: { TagName: "Music", IsTagUserAddable: "1" },
                2: { TagName: "Art", IsTagUserAddable: "1" },
                3: { TagName: "System", IsTagUserAddable: "0" }
            },
            LocalPlanet: {
                ProjectTable: {
                    "proj-1": {
                        ProjectName: "My Song",
                        ProjectImage: "song.png",
                        ProjectData:
                            '[[0,"start",100,100,[null,1,null]],[1,"newnote",0,0,[0,2,3,null]]]',
                        PublishedData: null
                    },
                    "proj-2": {
                        ProjectName: "Published Song",
                        ProjectImage: "song2.png",
                        ProjectData: '[[0,"pitch",100,100,[null,null]]]',
                        PublishedData: {
                            ProjectDescription: "A cool song",
                            ProjectTags: ["1"]
                        }
                    }
                },
                updateProjects: jest.fn(),
                Publisher: { open: jest.fn() }
            },
            ProjectStorage: {
                encodeTB: jest.fn(data => "encoded:" + data),
                getDefaultCreatorName: jest.fn().mockReturnValue("Test User"),
                addPublishedData: jest.fn(),
                renameProject: jest.fn()
            },
            ServerInterface: {
                addProject: jest.fn()
            },
            GlobalPlanet: {
                refreshProjects: jest.fn()
            },
            analyzeProject: jest
                .fn()
                .mockReturnValue([
                    false,
                    true,
                    true,
                    true,
                    true,
                    true,
                    false,
                    false,
                    true,
                    false,
                    false
                ])
        };

        publisher = new Publisher(mockPlanet);
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    describe("constructor", () => {
        it("should initialize with correct default values", () => {
            expect(publisher.Planet).toBe(mockPlanet);
            expect(publisher.ChipTags).toBeNull();
            expect(publisher.PlaceholderMBImage).toBe("images/mbgraphic.png");
            expect(publisher.PlaceholderTBImage).toBe("images/tbgraphic.png");
            expect(publisher.TitleLowerBound).toBe(1);
            expect(publisher.TitleUpperBound).toBe(50);
            expect(publisher.DescriptionLowerBound).toBe(1);
            expect(publisher.DescriptionUpperBound).toBe(1000);
            expect(publisher.IsShareLink).toBe(false);
        });

        it("should set ProjectTable from LocalPlanet", () => {
            expect(publisher.ProjectTable).toBe(mockPlanet.LocalPlanet.ProjectTable);
        });
    });

    describe("dataToTags", () => {
        // The shape the git backend's /tagManifest returns: keyed by name, not number.
        const LIVE_MANIFEST = {
            music: { TagName: "Music", IsTagUserAddable: "1" },
            math: { TagName: "Math", IsTagUserAddable: "1" },
            art: { TagName: "Art", IsTagUserAddable: "1" },
            interactive: { TagName: "Interactive", IsTagUserAddable: "1" }
        };

        it("suggests every tag its score earns, by manifest id", () => {
            mockPlanet.TagsManifest = LIVE_MANIFEST;
            // mock score: pitch+tone, mouse+pen, number and sensors are all set
            const tags = publisher.dataToTags('[[0,"start",100,100,[null,1]]]');
            expect(tags).toEqual(["music", "art", "interactive", "math"]);
        });

        it("suggests only the tags the score earns", () => {
            mockPlanet.TagsManifest = LIVE_MANIFEST;
            mockPlanet.analyzeProject.mockReturnValue([0, 1, 1, 0, 0, 4, 0, 0, 0, 0, 0]);
            expect(publisher.dataToTags("[]")).toEqual(["music", "math"]);
        });

        it("leaves out a tag the manifest doesn't have", () => {
            // the default fixture has Music and Art only
            const tags = publisher.dataToTags('[[0,"start",100,100,[null,1]]]');
            expect(tags).toEqual(["1", "2"]);
        });

        it("scores the project's own blocks rather than the open workspace", () => {
            publisher.dataToTags(
                '[[0,"start",100,100,[null,1,null]],[1,["number",{"value":4}],0,0,[0]]]'
            );
            expect(mockPlanet.analyzeProject).toHaveBeenCalledWith({
                blockList: [
                    { name: "start", connections: [null, 1, null] },
                    { name: "number", connections: [0] }
                ]
            });
        });

        it("pre-selects the suggested tags when the publish dialog opens", () => {
            mockPlanet.TagsManifest = LIVE_MANIFEST;
            mockPlanet.analyzeProject.mockReturnValue([0, 1, 1, 0, 0, 4, 0, 0, 0, 0, 0]);
            const setTagInput = jest.spyOn(publisher, "setTagInput").mockImplementation(() => {});

            publisher.open("proj-1");

            expect(setTagInput).toHaveBeenCalledWith([
                { tag: "Music", id: "music" },
                { tag: "Math", id: "math" }
            ]);
        });

        it("should return empty array for invalid JSON", () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const tags = publisher.dataToTags("not json");
            expect(tags).toEqual([]);
            consoleSpy.mockRestore();
        });

        it("should handle empty array data", () => {
            const tags = publisher.dataToTags("[]");
            // analyzeProject still returns mock scores
            expect(Array.isArray(tags)).toBe(true);
        });
    });

    describe("findTagWithName", () => {
        it("should find a tag by name", () => {
            expect(publisher.findTagWithName("Music")).toBe("1");
            expect(publisher.findTagWithName("Art")).toBe("2");
        });

        it("should return null for non-existent tag name", () => {
            expect(publisher.findTagWithName("NonExistent")).toBeNull();
        });

        it("should return null when the tag manifest has not loaded", () => {
            mockPlanet.TagsManifest = null;
            expect(publisher.findTagWithName("Music")).toBeNull();
        });
    });

    describe("addTags", () => {
        it("should build ChipTags from user-addable tags", () => {
            publisher.addTags();
            expect(publisher.ChipTags).toEqual({ Music: null, Art: null });
        });

        it("should not throw when the tag manifest has not loaded", () => {
            mockPlanet.TagsManifest = null;
            expect(() => publisher.addTags()).not.toThrow();
            expect(publisher.ChipTags).toEqual({});
        });
    });

    describe("setTagInput", () => {
        it("should associate the publish tags label with the generated input", () => {
            document.body.innerHTML += `
                <div class="chips chips-initial" id="tagsadd">
                    <input class="input" />
                </div>
                <label id="publish-tags-label"></label>
            `;

            publisher.ChipTags = {
                Music: "1",
                Art: "2"
            };

            publisher.setTagInput([]);

            const input = document.querySelector("#tagsadd input");
            const label = document.getElementById("publish-tags-label");

            expect(input.id).toBe("publish-tags-input");
            expect(input.name).toBe("publish-tags");
            expect(label.htmlFor).toBe("publish-tags-input");
        });
    });

    describe("parseProject", () => {
        it("should extract block names from project JSON", () => {
            const tb = '[[0,"start",100,100,[null,1,null]],[1,"newnote",0,0,[0,2,3,null]]]';
            const result = publisher.parseProject(tb);
            expect(result).toContain("start");
            expect(result).toContain("newnote");
        });

        it("should handle array block names (e.g., [name, value])", () => {
            const tb = '[[0,["number",4],100,100,[null]]]';
            const result = publisher.parseProject(tb);
            expect(result).toContain("number");
        });

        it("should stop parsing when block[1] is a number", () => {
            const tb = '[[0,"start",100,100,[null]],[1,42,100,100,[null]]]';
            const result = publisher.parseProject(tb);
            expect(result).toBe("start");
        });

        it("should return empty string for invalid JSON", () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const result = publisher.parseProject("not json");
            expect(result).toBe("");
            consoleSpy.mockRestore();
        });

        it("should deduplicate block names", () => {
            const tb = '[[0,"start",100,100,[null]],[1,"start",100,100,[null]]]';
            const result = publisher.parseProject(tb);
            // Using a Set internally, so "start" should appear once
            expect(result).toBe("start");
        });
    });

    describe("hideProgressBar", () => {
        it("should hide the progress bar", () => {
            publisher.hideProgressBar();
            expect(document.getElementById("publisher-progress").style.visibility).toBe("hidden");
        });
    });

    describe("throwError", () => {
        it("should display the error message", () => {
            publisher.throwError("Something went wrong");
            const el = document.getElementById("publisher-error");
            expect(el.textContent).toBe("Something went wrong");
            expect(el.style.display).toBe("initial");
        });
    });

    describe("publishProject validation", () => {
        it("should show error when title is empty", () => {
            document.getElementById("publish-title").value = "";
            document.getElementById("publish-description").value = "A description";
            document.getElementById("publish-id").value = "proj-1";

            publisher.publishProject();

            const titleLabel = document.getElementById("publish-title-label");
            expect(titleLabel.getAttribute("data-error")).toBe("This field is required");
        });

        it("should show error when title is too long", () => {
            document.getElementById("publish-title").value = "A".repeat(51);
            document.getElementById("publish-description").value = "A description";
            document.getElementById("publish-id").value = "proj-1";

            publisher.publishProject();

            const titleLabel = document.getElementById("publish-title-label");
            expect(titleLabel.getAttribute("data-error")).toBe("Title too long");
        });

        it("should show error when description is empty", () => {
            document.getElementById("publish-title").value = "Valid Title";
            document.getElementById("publish-description").value = "";
            document.getElementById("publish-id").value = "proj-1";

            publisher.publishProject();

            const descLabel = document.getElementById("publish-description-label");
            expect(descLabel.getAttribute("data-error")).toBe("This field is required");
        });

        it("should show error when description is too long", () => {
            document.getElementById("publish-title").value = "Valid Title";
            document.getElementById("publish-description").value = "D".repeat(1001);
            document.getElementById("publish-id").value = "proj-1";

            publisher.publishProject();

            const descLabel = document.getElementById("publish-description-label");
            expect(descLabel.getAttribute("data-error")).toBe("Description too long");
        });

        it("should hide progress bar on validation errors", () => {
            document.getElementById("publish-title").value = "";
            document.getElementById("publish-description").value = "";
            document.getElementById("publish-id").value = "proj-1";

            publisher.publishProject();

            expect(document.getElementById("publisher-progress").style.visibility).toBe("hidden");
        });
    });

    describe("afterPublishProject", () => {
        it("should update storage and refresh on success", () => {
            publisher.close = jest.fn();
            publisher.afterPublishProject({ success: true }, "proj-1", "New Name", {
                ProjectDescription: "desc",
                ProjectTags: ["1"]
            });

            expect(mockPlanet.ProjectStorage.addPublishedData).toHaveBeenCalledWith("proj-1", {
                ProjectDescription: "desc",
                ProjectTags: ["1"]
            });
            expect(mockPlanet.ProjectStorage.renameProject).toHaveBeenCalledWith(
                "proj-1",
                "New Name"
            );
            expect(publisher.close).toHaveBeenCalled();
            expect(mockPlanet.LocalPlanet.updateProjects).toHaveBeenCalled();
            expect(mockPlanet.GlobalPlanet.refreshProjects).toHaveBeenCalled();
        });

        it("should show error on failure", () => {
            const spy = jest.spyOn(publisher, "throwError");
            publisher.afterPublishProject(
                { success: false, error: "SERVER_DOWN" },
                "proj-1",
                "Name",
                {}
            );

            expect(spy).toHaveBeenCalledWith(expect.stringContaining("Server Error"));
            spy.mockRestore();
        });

        it("should show share box when IsShareLink is true", () => {
            document.body.innerHTML += '<div id="sharebox-proj-1" style="display:none;"></div>';
            publisher.close = jest.fn();
            publisher.IsShareLink = true;

            publisher.afterPublishProject({ success: true }, "proj-1", "Name", {});

            expect(document.getElementById("sharebox-proj-1").style.display).toBe("initial");
        });
    });

    describe("open", () => {
        it("titles the dialog with the translated publish string", () => {
            publisher.open("proj-1");
            expect(global._).toHaveBeenCalledWith("Publish project");
            expect(document.getElementById("publisher-ptitle").textContent).toBe("Publish project");
        });

        it("titles the dialog with the translated republish string", () => {
            publisher.open("proj-2");
            expect(global._).toHaveBeenCalledWith("Republish project");
            expect(document.getElementById("publisher-ptitle").textContent).toBe(
                "Republish project"
            );
        });
    });

    describe("initSubmit", () => {
        it("should add click listener to publisher-submit button", () => {
            const btn = document.getElementById("publisher-submit");
            const spy = jest.spyOn(btn, "addEventListener");

            publisher.initSubmit();

            expect(spy).toHaveBeenCalledWith("click", expect.any(Function));
            spy.mockRestore();
        });
    });
});
