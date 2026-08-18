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
                                    }
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
                                    }
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
                    projectName: "Offline Track"
                }),
                "*"
            );

            expect(localStorage.getItem("mbGitRepoName")).toBe("offline-track-456");
            expect(localStorage.getItem("mbGitDisplayName")).toBe("Offline Track");
        });
    });

    // ── 3. Save a Moment Flow (Online & Offline) ────────────────────────────
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

            await gitDropdown._doCommit("my-repo", "my-key", "Added baseline melody");

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/api/github/edit"),
                expect.objectContaining({
                    method: "PUT",
                    body: expect.stringContaining("Added baseline melody")
                })
            );

            expect(localStorage.getItem("mbGitLastSavedHash")).toBeTruthy();
            expect(localStorage.getItem("mbGitCurrentSha")).toBeNull();
        });

        test("saves commit draft via MB_OFFLINE_COMMIT when offline", async () => {
            jest.spyOn(gitDropdown, "_isOffline").mockReturnValue(true);

            await gitDropdown._doCommit("my-repo", "my-key", "Offline snapshot 1");

            expect(global.fetch).not.toHaveBeenCalled();
            expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "MB_OFFLINE_COMMIT",
                    repoName: "my-repo",
                    commitMessage: "Offline snapshot 1"
                }),
                "*"
            );
        });
    });

    // ── 4. Time Travel / Restore Commit ─────────────────────────────────────
    describe("Time Travel & Restore Commit", () => {
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
                    }
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

        test("MB_NEW_PROJECT clears all tracking state immediately", () => {
            localStorage.setItem("mbGitRepoName", "old-repo");
            localStorage.setItem("mbGitDisplayName", "Old Project");

            window.dispatchEvent(
                new MessageEvent("message", {
                    data: {
                        type: "MB_NEW_PROJECT"
                    }
                })
            );

            expect(localStorage.getItem("mbGitRepoName")).toBeNull();
            expect(localStorage.getItem("mbGitDisplayName")).toBeNull();
            expect(mockBtn.setAttribute).toHaveBeenCalledWith(
                "data-tooltip",
                "Start tracking my project"
            );
        });

        test("MB_SYNC_COMPLETE invalidates prefetch cache and triggers commits refresh", () => {
            const prefetchSpy = jest.spyOn(gitDropdown, "_prefetchCommits");

            localStorage.setItem("mbGitRepoName", "synced-repo");

            window.dispatchEvent(
                new MessageEvent("message", {
                    data: {
                        type: "MB_SYNC_COMPLETE",
                        synced: 2
                    }
                })
            );

            expect(prefetchSpy).toHaveBeenCalled();
        });
    });
});
