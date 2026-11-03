// Copyright (c) 2026 Harihara Vardhan
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

const GitDropdownUI = require("../gitDropdown");

describe("GitDropdownUI - Complete Git Features Test Suite", () => {
    let gitDropdown;
    let mockActivity;
    let mockBtn;
    let mockItemCreate;
    let mockItemCommit;
    let mockItemHistory;
    let mockTooltipEl;
    let mockTooltipSpan;
    let iframeMessages;
    let mockIframe;

    beforeEach(() => {
        localStorage.clear();
        iframeMessages = [];

        global.window.MBDialog = {
            alert: jest.fn().mockResolvedValue(true),
            prompt: jest.fn().mockResolvedValue("Test Input")
        };

        mockBtn = {
            id: "gitProjectBtn",
            style: {},
            setAttribute: jest.fn(),
            getAttribute: jest.fn(attr => {
                if (attr === "data-tooltip-id") return "tooltip-123";
                return null;
            }),
            addEventListener: jest.fn()
        };

        mockItemCreate = { id: "git-item-create", style: {} };
        mockItemCommit = { id: "git-item-commit", style: {} };
        mockItemHistory = { id: "git-item-history", style: {} };

        mockTooltipSpan = { textContent: "" };
        mockTooltipEl = {
            id: "tooltip-123",
            querySelector: jest.fn(selector => {
                if (selector === "span") return mockTooltipSpan;
                return null;
            })
        };

        mockIframe = {
            id: "planet-iframe",
            contentWindow: {
                postMessage: jest.fn(msg => {
                    iframeMessages.push(msg);
                    // Automatically simulate offline responses from iframe
                    if (msg.type === "MB_OFFLINE_CREATE") {
                        setTimeout(() => {
                            window.dispatchEvent(
                                new MessageEvent("message", {
                                    data: {
                                        type: "MB_OFFLINE_CREATE_RESULT",
                                        success: true,
                                        repository: msg.repoName
                                    },
                                    origin: window.location.origin
                                })
                            );
                        }, 5);
                    } else if (msg.type === "MB_OFFLINE_COMMIT") {
                        setTimeout(() => {
                            window.dispatchEvent(
                                new MessageEvent("message", {
                                    data: {
                                        type: "MB_OFFLINE_COMMIT_RESULT",
                                        success: true
                                    },
                                    origin: window.location.origin
                                })
                            );
                        }, 5);
                    }
                })
            }
        };

        document.getElementById = jest.fn(id => {
            if (id === "gitProjectBtn") return mockBtn;
            if (id === "git-item-create") return mockItemCreate;
            if (id === "git-item-commit") return mockItemCommit;
            if (id === "git-item-history") return mockItemHistory;
            if (id === "tooltip-123") return mockTooltipEl;
            if (id === "planet-iframe") return mockIframe;
            return null;
        });

        mockActivity = {
            planet: {
                getCurrentProjectName: jest.fn(() => "")
            },
            saveLocally: jest.fn().mockResolvedValue(undefined),
            canvas: {
                toDataURL: jest.fn(() => "data:image/png;base64,abc")
            },
            prepareExport: jest.fn(() => JSON.stringify({ blocks: ["note1"] })),
            turtles: {
                running: jest.fn(() => false)
            },
            _doHardStopButton: jest.fn(),
            sendAllToTrash: jest.fn(),
            _allClear: jest.fn(),
            blocks: {
                loadNewBlocks: jest.fn()
            }
        };

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve({
                        success: true,
                        repository: "test-repo",
                        key: "key-123",
                        sha: "sha-new"
                    })
            })
        );

        gitDropdown = new GitDropdownUI();
        gitDropdown.init(mockActivity);
    });

    // ── 1. Toolbar State & Dynamic Tooltips ──────────────────────────────────
    describe("Toolbar Button & Tooltip Sync", () => {
        test("displays 'Start tracking my project' and create item when project is untracked", () => {
            gitDropdown._syncMenuState();

            expect(mockBtn.setAttribute).toHaveBeenCalledWith(
                "data-tooltip",
                "Start tracking my project"
            );
            expect(mockBtn.setAttribute).toHaveBeenCalledWith(
                "aria-label",
                "Start tracking my project"
            );
            expect(mockTooltipSpan.textContent).toBe("Start tracking my project");

            expect(mockItemCreate.style.display).toBe("list-item");
            expect(mockItemCommit.style.display).toBe("none");
            expect(mockItemHistory.style.display).toBe("none");
        });

        test("displays 'My project: <name>' and commit/history items when project is tracked", () => {
            localStorage.setItem("mbGitRepoName", "synth-beat");
            localStorage.setItem("mbGitDisplayName", "Synth Beat");

            gitDropdown._syncMenuState();

            expect(mockBtn.setAttribute).toHaveBeenCalledWith(
                "data-tooltip",
                "My project: Synth Beat"
            );
            expect(mockTooltipSpan.textContent).toBe("My project: Synth Beat");

            expect(mockItemCreate.style.display).toBe("none");
            expect(mockItemCommit.style.display).toBe("list-item");
            expect(mockItemHistory.style.display).toBe("list-item");
        });

        test("resolves display name from planet.getCurrentProjectName dynamically", () => {
            localStorage.setItem("mbGitRepoName", "my-track");
            mockActivity.planet.getCurrentProjectName.mockReturnValue("Live Canvas Song");

            gitDropdown._syncMenuState();

            expect(mockBtn.setAttribute).toHaveBeenCalledWith(
                "data-tooltip",
                "My project: Live Canvas Song"
            );
            expect(mockTooltipSpan.textContent).toBe("My project: Live Canvas Song");
        });

        test("hover (mouseenter) and focus events recalculate and update tooltip immediately", () => {
            const hoverListener = mockBtn.addEventListener.mock.calls.find(
                c => c[0] === "mouseenter"
            )[1];
            const focusListener = mockBtn.addEventListener.mock.calls.find(
                c => c[0] === "focus"
            )[1];

            // Change name behind the scenes
            localStorage.setItem("mbGitRepoName", "hover-test");
            mockActivity.planet.getCurrentProjectName.mockReturnValue("Hovered Name");

            hoverListener();
            expect(mockBtn.setAttribute).toHaveBeenCalledWith(
                "data-tooltip",
                "My project: Hovered Name"
            );
            expect(mockTooltipSpan.textContent).toBe("My project: Hovered Name");

            mockActivity.planet.getCurrentProjectName.mockReturnValue("Focused Name");
            focusListener();
            expect(mockBtn.setAttribute).toHaveBeenCalledWith(
                "data-tooltip",
                "My project: Focused Name"
            );
            expect(mockTooltipSpan.textContent).toBe("My project: Focused Name");
        });

        test("clearForNewProject removes all session keys and resets button immediately", () => {
            localStorage.setItem("mbGitRepoName", "active-repo");
            localStorage.setItem("mbGitHashedKey", "active-key");
            localStorage.setItem("mbGitDisplayName", "Active Name");
            localStorage.setItem("mbGitLastSavedHash", "hash-1");
            localStorage.setItem("mbGitCurrentSha", "sha-1");
            localStorage.setItem("mbGitCurrentDraftId", "draft-1");
            localStorage.setItem("mbGitCurrentProjectId", "proj-1");

            gitDropdown.clearForNewProject();

            expect(localStorage.getItem("mbGitRepoName")).toBeNull();
            expect(localStorage.getItem("mbGitHashedKey")).toBeNull();
            expect(localStorage.getItem("mbGitDisplayName")).toBeNull();
            expect(localStorage.getItem("mbGitLastSavedHash")).toBeNull();
            expect(localStorage.getItem("mbGitCurrentSha")).toBeNull();
            expect(localStorage.getItem("mbGitCurrentDraftId")).toBeNull();
            expect(localStorage.getItem("mbGitCurrentProjectId")).toBeNull();

            expect(mockBtn.setAttribute).toHaveBeenCalledWith(
                "data-tooltip",
                "Start tracking my project"
            );
            expect(mockTooltipSpan.textContent).toBe("Start tracking my project");
        });
    });

    // ── 2. Track My Project Flow (Online & Offline) ──────────────────────────
    describe("Track My Project (_doCreate)", () => {
        test("creates repo online and dispatches MB_GIT_CREATED to iframe", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(false);

            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: () =>
                    Promise.resolve({
                        success: true,
                        repository: "my-track-123",
                        key: "secret-key-123"
                    })
            });

            await gitDropdown._doCreate("my-track-123", "My Track", "A cool track");

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/api/github/create"),
                expect.objectContaining({
                    method: "POST",
                    body: expect.stringContaining("my-track-123")
                })
            );

            expect(localStorage.getItem("mbGitRepoName")).toBe("my-track-123");
            expect(localStorage.getItem("mbGitHashedKey")).toBe("secret-key-123");
            expect(localStorage.getItem("mbGitDisplayName")).toBe("My Track");

            expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "MB_GIT_CREATED",
                    repoName: "my-track-123",
                    hashedKey: "secret-key-123",
                    displayName: "My Track"
                }),
                "*"
            );
        });

        test("queues repo creation offline via MB_OFFLINE_CREATE when offline", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(true);

            await gitDropdown._doCreate("offline-track-456", "Offline Track", "Made offline");

            expect(global.fetch).not.toHaveBeenCalled();
            expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "MB_OFFLINE_CREATE",
                    repoName: "offline-track-456",
                    projectName: "Offline Track",
                    thumbnail: "data:image/png;base64,abc"
                }),
                "*"
            );

            expect(localStorage.getItem("mbGitRepoName")).toBe("offline-track-456");
            expect(localStorage.getItem("mbGitDisplayName")).toBe("Offline Track");
        });

        test("preserves the thumbnail when creation falls back offline", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(false);
            global.fetch.mockRejectedValueOnce(new TypeError("Network failed"));

            await gitDropdown._doCreate("fallback-track", "Fallback Track", "Made offline");

            expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "MB_OFFLINE_CREATE",
                    thumbnail: "data:image/png;base64,abc"
                }),
                "*"
            );
        });

        test("saves a fresh project before queuing offline tracking", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(true);
            let finishSave;
            mockActivity.saveLocally = jest.fn(
                () => new Promise(resolve => (finishSave = resolve))
            );

            const create = gitDropdown._doCreate("first-track", "First Track", "Made offline");
            await Promise.resolve();

            expect(mockActivity.saveLocally).toHaveBeenCalledTimes(1);
            expect(mockIframe.contentWindow.postMessage).not.toHaveBeenCalled();
            expect(mockActivity.canvas.toDataURL).not.toHaveBeenCalled();

            finishSave();
            await create;
            expect(mockActivity.canvas.toDataURL).toHaveBeenCalledWith("image/png");
            expect(localStorage.getItem("mbGitRepoName")).toBe("first-track");
        });

        test("reports a failed save without queuing offline tracking", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(true);
            const showToast = jest.spyOn(gitDropdown, "_showToast");
            mockActivity.saveLocally.mockRejectedValue(new Error("Storage unavailable"));

            await gitDropdown._doCreate("failed-track", "Failed Track", "Made offline");

            expect(mockIframe.contentWindow.postMessage).not.toHaveBeenCalled();
            expect(showToast).toHaveBeenCalledWith(
                "Could not save your project. Please try again.",
                "error"
            );
        });

        test("does not queue when local storage reports a failed save", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(true);
            const showToast = jest.spyOn(gitDropdown, "_showToast");
            mockActivity.saveLocally.mockResolvedValue(false);

            await gitDropdown._doCreate("failed-track", "Failed Track", "Made offline");

            expect(mockIframe.contentWindow.postMessage).not.toHaveBeenCalled();
            expect(showToast).toHaveBeenCalledWith(
                "Could not save your project. Please try again.",
                "error"
            );
        });

        describe("when the repo name is already taken", () => {
            const taken = () =>
                Promise.resolve({ ok: false, status: 422, json: () => Promise.resolve({}) });
            const created = repository =>
                Promise.resolve({
                    ok: true,
                    status: 201,
                    json: () => Promise.resolve({ success: true, repository, key: "key-1" })
                });
            const sentNames = () =>
                global.fetch.mock.calls
                    .filter(c => String(c[0]).endsWith("/create"))
                    .map(c => JSON.parse(c[1].body).repoName);

            beforeEach(() => {
                jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(false);
            });

            test("does not retry when the first name is free", async () => {
                global.fetch.mockImplementationOnce(() => created("my-song"));

                await gitDropdown._doCreate("my-song", "My Song", "desc");

                expect(sentNames()).toEqual(["my-song"]);
                expect(localStorage.getItem("mbGitRepoName")).toBe("my-song");
            });

            test("retries once with a short suffix and keeps the display name", async () => {
                jest.spyOn(Math, "random").mockReturnValue(0.5);
                global.fetch
                    .mockImplementationOnce(taken)
                    .mockImplementationOnce(() => created(undefined));

                await gitDropdown._doCreate("my-song", "My Song", "desc");

                const names = sentNames();
                expect(names).toHaveLength(2);
                expect(names[0]).toBe("my-song");
                expect(names[1]).toMatch(/^my-song-[a-z0-9]{4}$/);
                expect(localStorage.getItem("mbGitRepoName")).toBe(names[1]);
                expect(localStorage.getItem("mbGitDisplayName")).toBe("My Song");
                expect(window.MBDialog.alert).not.toHaveBeenCalled();
            });

            test("keeps the name within 100 characters when adding the suffix", async () => {
                global.fetch
                    .mockImplementationOnce(taken)
                    .mockImplementationOnce(() => created(undefined));

                await gitDropdown._doCreate("a".repeat(100), "Long", "desc");

                expect(sentNames()[1].length).toBeLessThanOrEqual(100);
            });

            test("still asks the user to rename when the retry is taken too", async () => {
                global.fetch.mockImplementationOnce(taken).mockImplementationOnce(taken);

                await gitDropdown._doCreate("my-song", "My Song", "desc");

                expect(sentNames()).toHaveLength(2);
                expect(window.MBDialog.alert).toHaveBeenCalledWith(
                    expect.stringContaining("That name is already taken"),
                    "Name Already Taken"
                );
                expect(localStorage.getItem("mbGitRepoName")).toBeNull();
            });
        });
    });

    // ── 3. Save a Moment Flow (Online & Offline) ────────────────────────────
    describe("Repo name from the project name (_sanitizeRepoName)", () => {
        test("keeps latin names as before", () => {
            expect(gitDropdown._sanitizeRepoName("My Song!")).toBe("my-song");
        });

        test("drops accents instead of splitting the word", () => {
            expect(gitDropdown._sanitizeRepoName("Canción")).toBe("cancion");
            expect(gitDropdown._sanitizeRepoName("Café Crème")).toBe("cafe-creme");
        });

        test("maps letters that NFKD does not split", () => {
            expect(gitDropdown._sanitizeRepoName("Łódź")).toBe("lodz");
            expect(gitDropdown._sanitizeRepoName("Ørsted")).toBe("orsted");
            expect(gitDropdown._sanitizeRepoName("Straße")).toBe("strasse");
            expect(gitDropdown._sanitizeRepoName("Đorđe")).toBe("dorde");
            expect(gitDropdown._sanitizeRepoName("Æsir")).toBe("aesir");
            expect(gitDropdown._sanitizeRepoName("Cœur")).toBe("coeur");
        });

        test("returns an empty string for names with no latin letters or digits", () => {
            expect(gitDropdown._sanitizeRepoName("私の曲")).toBe("");
            expect(gitDropdown._sanitizeRepoName("Мой проект")).toBe("");
        });

        test("gives the same result for the same name", () => {
            expect(gitDropdown._sanitizeRepoName("Łódź Song")).toBe(
                gitDropdown._sanitizeRepoName("Łódź Song")
            );
        });

        test("never ends with a dash after cutting to 100 characters", () => {
            const slug = gitDropdown._sanitizeRepoName("a".repeat(99) + " b");
            expect(slug.length).toBeLessThanOrEqual(100);
            expect(slug.endsWith("-")).toBe(false);
        });
    });

    describe("Fallback repo name (_fallbackRepoName)", () => {
        test("gives two different names even in the same millisecond", () => {
            const now = jest.spyOn(Date, "now").mockReturnValue(1000);
            const random = jest.spyOn(Math, "random");
            random.mockReturnValueOnce(0.1).mockReturnValueOnce(0.2);

            const first = gitDropdown._fallbackRepoName();
            const second = gitDropdown._fallbackRepoName();

            expect(first).toMatch(/^my-music-project-[a-z0-9]+-[a-z0-9]{4}$/);
            expect(second).toMatch(/^my-music-project-[a-z0-9]+-[a-z0-9]{4}$/);
            expect(first).not.toBe(second);
            now.mockRestore();
            random.mockRestore();
        });

        test("never ends with a dash, even if Math.random returns 0", () => {
            const random = jest.spyOn(Math, "random").mockReturnValue(0);
            expect(gitDropdown._fallbackRepoName()).toMatch(/^my-music-project-[a-z0-9]+-0000$/);
            random.mockRestore();
        });

        test("is used by the create flow when the name has no latin letters", async () => {
            window.MBDialog.prompt
                .mockResolvedValueOnce("私の曲")
                .mockResolvedValueOnce("my description");
            jest.spyOn(gitDropdown, "_fallbackRepoName").mockReturnValue("fallback-name");
            const create = jest.spyOn(gitDropdown, "_doCreate").mockResolvedValue();

            await gitDropdown._showCreateFlow();

            expect(create).toHaveBeenCalledWith("fallback-name", "私の曲", "my description");
        });

        test("is used when only digits are left of a non-latin name", async () => {
            window.MBDialog.prompt
                .mockResolvedValueOnce("私の曲 1")
                .mockResolvedValueOnce("my description");
            jest.spyOn(gitDropdown, "_fallbackRepoName").mockReturnValue("fallback-name");
            const create = jest.spyOn(gitDropdown, "_doCreate").mockResolvedValue();

            await gitDropdown._showCreateFlow();

            expect(create).toHaveBeenCalledWith("fallback-name", "私の曲 1", "my description");
        });

        test("is not used by the create flow for latin names", async () => {
            window.MBDialog.prompt
                .mockResolvedValueOnce("My Song")
                .mockResolvedValueOnce("my description");
            const fallback = jest.spyOn(gitDropdown, "_fallbackRepoName");
            const create = jest.spyOn(gitDropdown, "_doCreate").mockResolvedValue();

            await gitDropdown._showCreateFlow();

            expect(fallback).not.toHaveBeenCalled();
            expect(create).toHaveBeenCalledWith("my-song", "My Song", "my description");
        });
    });

    describe("Save a Moment (_doCommit)", () => {
        test("commits to backend online and updates session hashes", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(false);

            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve({
                        success: true,
                        sha: "commit-sha-789"
                    })
            });

            const saved = await gitDropdown._doCommit("my-repo", "my-key", "Added baseline melody");

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/api/github/edit"),
                expect.objectContaining({
                    method: "PUT",
                    body: expect.stringContaining("Added baseline melody")
                })
            );

            expect(localStorage.getItem("mbGitLastSavedHash")).toBeTruthy();
            expect(localStorage.getItem("mbGitCurrentSha")).toBeNull();
            expect(saved).toBe(true);
        });

        test("saves commit draft via MB_OFFLINE_COMMIT when offline", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(true);

            const saved = await gitDropdown._doCommit("my-repo", "my-key", "Offline snapshot 1");

            expect(global.fetch).not.toHaveBeenCalled();
            expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "MB_OFFLINE_COMMIT",
                    repoName: "my-repo",
                    commitMessage: "Offline snapshot 1"
                }),
                "*"
            );
            expect(saved).toBe(true);
        });

        test("reports a failed offline draft when the five-draft limit is reached", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(true);
            jest.spyOn(gitDropdown, "_waitForMessage").mockResolvedValue({
                success: false,
                error: "OFFLINE_DRAFT_CAP_REACHED"
            });

            const saved = await gitDropdown._doCommit("my-repo", "my-key", "Sixth snapshot");

            expect(saved).toBe(false);
            expect(localStorage.getItem("mbGitLastSavedHash")).toBeNull();
        });

        test("falls back to an offline draft when the network drops mid-commit", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(false);
            global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

            const saved = await gitDropdown._doCommit("my-repo", "my-key", "Network drop");

            expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "MB_OFFLINE_COMMIT",
                    commitMessage: "Network drop"
                }),
                "*"
            );
            expect(saved).toBe(true);
        });

        test("reports a permission failure when the server rejects the commit", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(false);
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ message: "Unauthorized" })
            });
            const showToast = jest.spyOn(gitDropdown, "_showToast");

            const saved = await gitDropdown._doCommit("my-repo", "my-key", "Denied moment");

            expect(saved).toBe(false);
            expect(showToast).toHaveBeenCalledWith(
                "You don't have permission to save this project.",
                "error"
            );
        });

        test("reports a server failure when the commit returns an error status", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(false);
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: "Server exploded" })
            });
            const showToast = jest.spyOn(gitDropdown, "_showToast");

            const saved = await gitDropdown._doCommit("my-repo", "my-key", "Broken moment");

            expect(saved).toBe(false);
            expect(showToast).toHaveBeenCalledWith(
                "Could not save this moment — the server returned an error.",
                "error"
            );
        });

        test("reports a failed offline draft when the planet frame is unavailable", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(true);
            const showToast = jest.spyOn(gitDropdown, "_showToast").mockImplementation(() => {});
            document.getElementById.mockReturnValueOnce(null);

            const saved = await gitDropdown._doCommit("my-repo", "my-key", "No frame");

            expect(saved).toBe(false);
            expect(showToast).toHaveBeenCalledWith(
                "Could not save offline — planet frame unavailable.",
                "error"
            );
        });
    });

    // ── 4. Time Travel / Restore Commit ─────────────────────────────────────
    describe("Time Travel & Restore Commit", () => {
        test("keeps current blocks when saving before time travel fails", async () => {
            localStorage.setItem("mbGitRepoName", "my-repo");
            jest.spyOn(gitDropdown, "_hasUnsavedChanges").mockReturnValue(true);
            let saveFirst;
            jest.spyOn(gitDropdown, "_showUnsavedGuard").mockImplementation(onSave => {
                saveFirst = onSave;
            });
            jest.spyOn(gitDropdown, "_doCommit").mockResolvedValue(false);
            const restore = jest.spyOn(gitDropdown, "_restoreCommit").mockResolvedValue();

            await gitDropdown._confirmTimeTravel({ sha: "old-sha" }, "Old moment");
            await saveFirst();

            expect(restore).not.toHaveBeenCalled();
        });

        test("restores after saving before time travel succeeds", async () => {
            localStorage.setItem("mbGitRepoName", "my-repo");
            jest.spyOn(gitDropdown, "_hasUnsavedChanges").mockReturnValue(true);
            let saveFirst;
            jest.spyOn(gitDropdown, "_showUnsavedGuard").mockImplementation(onSave => {
                saveFirst = onSave;
            });
            jest.spyOn(gitDropdown, "_doCommit").mockResolvedValue(true);
            const restore = jest.spyOn(gitDropdown, "_restoreCommit").mockResolvedValue();
            const target = { sha: "old-sha" };

            await gitDropdown._confirmTimeTravel(target, "Old moment");
            await saveFirst();

            expect(restore).toHaveBeenCalledWith(target, "Old moment");
        });

        test("keeps current blocks when saving before undo fails", async () => {
            localStorage.setItem("mbGitRepoName", "my-repo");
            const widget = document.createElement("div");
            jest.spyOn(gitDropdown, "_buildSystemDialog").mockReturnValue({
                frame: document.createElement("div"),
                widget,
                cleanup: jest.fn()
            });
            jest.spyOn(gitDropdown, "_centerFrame").mockImplementation(() => {});
            jest.spyOn(gitDropdown, "_doCommit").mockResolvedValue(false);
            const restore = jest.spyOn(gitDropdown, "_restoreCommit").mockResolvedValue();

            await gitDropdown._clearChanges({ sha: "old-sha" }, "Old moment");
            widget.querySelector(".confirm-button").click();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(restore).not.toHaveBeenCalled();
        });

        test("_restoreCommit loads project blocks into workspace", async () => {
            const projectData = { blocks: [["start", [0, 0], null]] };

            await gitDropdown._restoreCommit({
                sha: "target-sha-123",
                message: "Moment 1",
                projectData
            });

            expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalledWith(projectData);
            expect(localStorage.getItem("mbGitCurrentSha")).toBe("target-sha-123");
        });
    });

    // ── 5. Iframe Message Handlers ──────────────────────────────────────────
    describe("Iframe Message Listeners", () => {
        test("MB_GIT_STATE updates active repo credentials and syncs menu", () => {
            window.dispatchEvent(
                new MessageEvent("message", {
                    data: {
                        type: "MB_GIT_STATE",
                        repoName: "planet-project-xyz",
                        hashedKey: "planet-key-xyz",
                        projectName: "Planet Project",
                        projectId: "p99"
                    },
                    origin: window.location.origin,
                    source: mockIframe.contentWindow
                })
            );

            expect(localStorage.getItem("mbGitRepoName")).toBe("planet-project-xyz");
            expect(localStorage.getItem("mbGitHashedKey")).toBe("planet-key-xyz");
            expect(localStorage.getItem("mbGitDisplayName")).toBe("Planet Project");
            expect(localStorage.getItem("mbGitCurrentProjectId")).toBe("p99");

            expect(mockBtn.setAttribute).toHaveBeenCalledWith(
                "data-tooltip",
                "My project: Planet Project"
            );
        });

        test("MB_GIT_STATE updates git state when active project is deleted and replaced by a tracked project", async () => {
            // Project A was active and had Git state
            localStorage.setItem("mbGitRepoName", "project-a-repo");
            localStorage.setItem("mbGitHashedKey", "project-a-key");
            localStorage.setItem("mbGitDisplayName", "Project A");
            localStorage.setItem("mbGitCurrentProjectId", "proj-a");

            // Project A is deleted and project B becomes active, sending MB_GIT_STATE
            window.dispatchEvent(
                new MessageEvent("message", {
                    data: {
                        type: "MB_GIT_STATE",
                        repoName: "project-b-repo",
                        hashedKey: "project-b-key",
                        projectName: "Project B",
                        projectId: "proj-b"
                    },
                    origin: window.location.origin,
                    source: mockIframe.contentWindow
                })
            );

            // Git menu receives project B's credentials rather than retaining project A's
            expect(localStorage.getItem("mbGitRepoName")).toBe("project-b-repo");
            expect(localStorage.getItem("mbGitHashedKey")).toBe("project-b-key");
            expect(localStorage.getItem("mbGitDisplayName")).toBe("Project B");
            expect(localStorage.getItem("mbGitCurrentProjectId")).toBe("proj-b");

            // Subsequent Git actions commit to project B's repository, NOT project A's
            const doCommitSpy = jest.spyOn(gitDropdown, "_doCommit").mockResolvedValue();
            await gitDropdown._showCommitFlow();
            expect(doCommitSpy).toHaveBeenCalledWith(
                "project-b-repo",
                "project-b-key",
                expect.any(String)
            );
            expect(doCommitSpy).not.toHaveBeenCalledWith(
                "project-a-repo",
                expect.anything(),
                expect.anything()
            );
        });

        test("MB_GIT_STATE clears git state when active project is deleted and replacement project is untracked", async () => {
            // Project A was active and had Git state
            localStorage.setItem("mbGitRepoName", "project-a-repo");
            localStorage.setItem("mbGitHashedKey", "project-a-key");
            localStorage.setItem("mbGitDisplayName", "Project A");
            localStorage.setItem("mbGitCurrentProjectId", "proj-a");

            // Project A is deleted and replacement Project B has no git state
            window.dispatchEvent(
                new MessageEvent("message", {
                    data: {
                        type: "MB_GIT_STATE",
                        repoName: "",
                        hashedKey: "",
                        projectName: "Project B",
                        projectId: "proj-b"
                    },
                    origin: window.location.origin,
                    source: mockIframe.contentWindow
                })
            );

            // Git menu clears project A's credentials rather than retaining them
            expect(localStorage.getItem("mbGitRepoName")).toBeNull();
            expect(localStorage.getItem("mbGitHashedKey")).toBeNull();
            expect(localStorage.getItem("mbGitDisplayName")).toBeNull();

            // Subsequent Git actions cannot accidentally associate project B's data with project A's repository
            const doCommitSpy = jest.spyOn(gitDropdown, "_doCommit");
            await gitDropdown._showCommitFlow();
            expect(window.MBDialog.alert).toHaveBeenCalledWith(
                'Start tracking your project first by clicking "Track my project".',
                "Not Tracking Yet"
            );
            expect(doCommitSpy).not.toHaveBeenCalled();
        });

        test("MB_NEW_PROJECT clears all tracking state immediately and prevents committing to old repo", async () => {
            localStorage.setItem("mbGitRepoName", "old-repo");
            localStorage.setItem("mbGitHashedKey", "old-key");
            localStorage.setItem("mbGitDisplayName", "Old Project");
            localStorage.setItem("mbGitLastSavedHash", "hash123");
            localStorage.setItem("mbGitCurrentSha", "sha123");
            localStorage.setItem("mbGitCurrentDraftId", "draft123");
            localStorage.setItem("mbGitCurrentProjectId", "proj123");

            const clearSpy = jest.spyOn(gitDropdown, "clearForNewProject");

            window.dispatchEvent(
                new MessageEvent("message", {
                    data: {
                        type: "MB_NEW_PROJECT"
                    },
                    origin: window.location.origin,
                    source: mockIframe.contentWindow
                })
            );

            expect(localStorage.getItem("mbGitRepoName")).toBeNull();
            expect(localStorage.getItem("mbGitHashedKey")).toBeNull();
            expect(localStorage.getItem("mbGitDisplayName")).toBeNull();
            expect(localStorage.getItem("mbGitLastSavedHash")).toBeNull();
            expect(localStorage.getItem("mbGitCurrentSha")).toBeNull();
            expect(localStorage.getItem("mbGitCurrentDraftId")).toBeNull();
            expect(localStorage.getItem("mbGitCurrentProjectId")).toBeNull();
            expect(clearSpy).toHaveBeenCalled();
            expect(mockBtn.setAttribute).toHaveBeenCalledWith(
                "data-tooltip",
                "Start tracking my project"
            );

            // Subsequent commit flow cannot commit to deleted project
            const doCommitSpy = jest.spyOn(gitDropdown, "_doCommit");
            await gitDropdown._showCommitFlow();
            expect(window.MBDialog.alert).toHaveBeenCalledWith(
                'Start tracking your project first by clicking "Track my project".',
                "Not Tracking Yet"
            );
            expect(doCommitSpy).not.toHaveBeenCalled();
        });

        test("MB_SYNC_COMPLETE invalidates prefetch cache and triggers commits refresh", () => {
            const prefetchSpy = jest.spyOn(gitDropdown, "_prefetchCommits");

            localStorage.setItem("mbGitRepoName", "synced-repo");

            window.dispatchEvent(
                new MessageEvent("message", {
                    data: {
                        type: "MB_SYNC_COMPLETE",
                        synced: 2
                    },
                    origin: window.location.origin,
                    source: mockIframe.contentWindow
                })
            );

            expect(prefetchSpy).toHaveBeenCalled();
        });
    });

    describe("_makeDraggable", () => {
        test("handles drag and drop correctly with requestAnimationFrame", () => {
            const previousRaf = window.requestAnimationFrame;
            const previousCancelRaf = window.cancelAnimationFrame;

            let rafCallback = null;
            window.requestAnimationFrame = jest.fn(cb => {
                rafCallback = cb;
                return 456;
            });
            window.cancelAnimationFrame = jest.fn();

            try {
                const frame = document.createElement("div");
                frame.getBoundingClientRect = () => ({ left: 10, top: 20 });
                Object.defineProperty(frame, "offsetWidth", { value: 100 });
                Object.defineProperty(frame, "offsetHeight", { value: 100 });
                frame.style.left = "0px";
                frame.style.top = "0px";
                const handle = document.createElement("div");

                gitDropdown._makeDraggable(frame, handle);

                const mousedown = new MouseEvent("mousedown", { clientX: 50, clientY: 60 });
                handle.dispatchEvent(mousedown);

                const mousemove = new MouseEvent("mousemove", { clientX: 100, clientY: 120 });
                document.dispatchEvent(mousemove);

                expect(window.requestAnimationFrame).toHaveBeenCalled();
                expect(rafCallback).not.toBeNull();

                const mouseup = new MouseEvent("mouseup");
                document.dispatchEvent(mouseup);

                expect(window.cancelAnimationFrame).toHaveBeenCalledWith(456);

                expect(frame.style.left).toBe("60px");
                expect(frame.style.top).toBe("80px");
            } finally {
                window.requestAnimationFrame = previousRaf;
                window.cancelAnimationFrame = previousCancelRaf;
            }
        });
    });
});
