// Copyright (c) 2014-22 Walter Bender
// Copyright (c) Yash Khandelwal, GSoC'15
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global
   _THIS_IS_MUSIC_BLOCKS_,
   DATAOBJS,
   ErrorHandler,
   doSVG,
   _,
   pubsub,
   Midi,
   ABCJS,
   ensureABCJS,
   extractProjectDataFromHTML,
   unescapeHTML,
   getTemperament,
   getOctaveRatio,
   debugLog,
   platformColor,
   transcribeMidi,
   base64Encode,
   require
*/

/* exported setupProjectManager, ProjectManager */

const _STANDARD_DURATIONS = [
    { value: "1/1", duration: 1 },
    { value: "1/2", duration: 0.5 },
    { value: "1/4", duration: 0.25 },
    { value: "1/8", duration: 0.125 },
    { value: "1/16", duration: 0.0625 },
    { value: "1/32", duration: 0.03125 },
    { value: "1/64", duration: 0.015625 },
    { value: "1/128", duration: 0.0078125 }
];

class ProjectManager {
    constructor(activity) {
        this.activity = activity;
        this._loadAnimationIntervalId = null;
    }

    // -----------------------------------------------------------------------
    // Loading animation
    // -----------------------------------------------------------------------

    doLoadAnimation() {
        const messages = {
            load_messages: [
                _("Catching mice"),
                _("Cleaning the instruments"),
                _("Testing key pieces"),
                _("Sight-reading"),
                _("Combining math and music"),
                _("Generating more blocks"),
                _("Do Re Mi Fa Sol La Ti Do"),
                _("Tuning string instruments"),
                _("Pressing random keys")
            ]
        };

        document.getElementById("load-container").style.display = "block";

        let counter = 0;

        const changeText = () => {
            const randomLoadMessage =
                messages.load_messages[Math.floor(Math.random() * messages.load_messages.length)];
            document.getElementById("messageText").textContent = randomLoadMessage + "...";
            counter++;
            if (counter >= messages.load_messages.length) {
                counter = 0;
            }
        };

        this._loadAnimationIntervalId = setInterval(changeText, 2000);
    }

    stopLoadAnimation() {
        if (this._loadAnimationIntervalId !== null) {
            clearInterval(this._loadAnimationIntervalId);
            this._loadAnimationIntervalId = null;
        }
        const loadContainer = document.getElementById("load-container");
        if (loadContainer) {
            loadContainer.style.display = "none";
        }
    }

    showContents() {
        clearInterval(window.intervalId);
        document.getElementById("loadingText").textContent = _("Loading Complete!");

        setTimeout(() => {
            const loadingText = document.getElementById("loadingText");
            if (loadingText) loadingText.textContent = null;

            const loadingImageContainer = document.getElementById("loading-image-container");
            if (loadingImageContainer) loadingImageContainer.style.display = "none";

            const loadContainer = document.getElementById("load-container");
            if (loadContainer) loadContainer.style.display = "none";

            const bottomRightLogo = document.getElementById("bottom-right-logo");
            if (bottomRightLogo) bottomRightLogo.style.display = "none";

            const palette = document.getElementById("palette");
            if (palette) palette.style.display = "block";

            const hideContents = document.getElementById("hideContents");
            if (hideContents) hideContents.style.display = "block";

            const btnBottom = document.getElementById("buttoncontainerBOTTOM");
            if (btnBottom) btnBottom.style.display = "block";

            const btnTop = document.getElementById("buttoncontainerTOP");
            if (btnTop) btnTop.style.display = "block";
        }, 500);
    }

    // -----------------------------------------------------------------------
    // Load-start orchestration
    // -----------------------------------------------------------------------

    async loadStartWrapper(func, arg1, arg2, arg3) {
        await func(this.activity, arg1, arg2, arg3);
        this.showContents();
    }

    justLoadStart() {
        this.activity.blocks.loadNewBlocks(DATAOBJS);
    }

    async _loadStart(that) {
        if (!that) that = this.activity;

        const __afterLoad = async () => {
            if (!that.turtles.running()) {
                /* istanbul ignore next -- _loadStart's __afterLoad runs post-project-load in a browser-only path; inaccessible from Jest */
                that.stage.update();
                for (let turtle = 0; turtle < that.turtles.getTurtleCount(); turtle++) {
                    that.logo.turtleHeaps[turtle] = [];
                    that.logo.turtleDicts[turtle] = {};
                    that.logo.notation.notationStaging[turtle] = [];
                    that.logo.notation.notationDrumStaging[turtle] = [];
                    that.turtles.getTurtle(turtle).painter.doClear(true, true, false);
                }
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    const imgUrl =
                        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+IDxzdmcgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgaWQ9InN2ZzExMjEiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDM0LjEzMTI0OSAxNC41NTIwODkiIGhlaWdodD0iNTUuMDAwMDE5IiB3aWR0aD0iMTI5Ij4gPGRlZnMgaWQ9ImRlZnMxMTE1Ij4gPGNsaXBQYXRoIGlkPSJjbGlwUGF0aDQzMzciIGNsaXBQYXRoVW5pdHM9InVzZXJTcGFjZU9uVXNlIj4gPHJlY3QgeT0iNTUyIiB4PSI1ODgiIGhlaWdodD0iMTQzNiIgd2lkdGg9IjE5MDAiIGlkPSJyZWN0NDMzOSIgc3R5bGU9ImZpbGw6I2EzYjVjNDtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MTU7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDwvY2xpcFBhdGg+IDwvZGVmcz4gPG1ldGFkYXRhIGlkPSJtZXRhZGF0YTExMTgiPiA8cmRmOlJERj4gPGNjOldvcmsgcmRmOmFib3V0PSIiPiA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4gPGRjOnR5cGUgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4gPGRjOnRpdGxlPjwvZGM6dGl0bGU+IDwvY2M6V29yaz4gPC9yZGY6UkRGPiA8L21ldGFkYXRhPiA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgxLjA4Njc4MiwwLDAsMS4wODY3ODIsLTEuNTQ3MzI0NSwtMS4zMDU3OTkpIiBpZD0iZzE4MTIiPiA8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgwLjAxMDQ2MDk5LDAsMCwwLjAxMDQ2MDk5LDEuMDE2NzM4OSwtNi4yMDQ4NTI5KSIgY2xpcC1wYXRoPSJ1cmwoI2NsaXBQYXRoNDMzNykiIHJ5PSI3NjgiIHJ4PSI3NDgiIGN5PSIxNDc2IiBjeD0iMTU0MCIgaWQ9InBhdGg0MzMzIiBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojYTNiNWM0O2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDoxNTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIgLz4gPGVsbGlwc2Ugcnk9IjEuNzgyNjg1OSIgcng9IjEuNjkzOTIxNiIgY3k9IjguODM0MzUzNCIgY3g9IjE2LjQ0NjczOSIgaWQ9InBhdGg0MjU2IiBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojYzlkYWQ4O2ZpbGwtb3BhY2l0eToxO3N0cm9rZTojYzlkYWQ4O3N0cm9rZS13aWR0aDowLjEwNDYwOTk7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNDMyOCIgZD0ibSAxNy42MzAyNjYsMTMuNDg3MDkgMC4zMjU0NywwLjM5MjA0NCAwLjM0NzY2LDAuMjczNjkgMC4zMTA2NzYsMC4xMTA5NTUgMC4yMzY3MDUsLTAuMDUxNzggMC4xNDA1NDQsLTAuMTg0OTI2IDAuMTk5NzIsMC4wODEzNyAwLjE1NTMzOCwwLjA0NDM4IDAuNjEzOTU0LC0wLjQyMTYzMiAwLjQyMTYzMSwtMC4yNTE0OTkgYyAwLDAgMC44ODc2NDUsLTAuMDA3NCAxLjYwNTE1NywtMC41NTQ3NzcgMC43MTc1MTMsLTAuNTQ3MzgxIDAuNDk1NjAyLC0wLjY1MDkzOSAwLjQ5NTYwMiwtMC42NTA5MzkgbCAtMC4wMzY5OSwtMC40MjkwMjkgLTAuNTM5OTg0LC0wLjcxNzUxMyAtMC41NTQ3NzcsLTAuNTY5NTcxIC0wLjIyOTMwOSwtMC4xNDc5NDEgYyAwLDAgLTAuMDIyMTksLTAuMDQ0MzggLTAuMDczOTcsLTAuMDQ0MzggLTAuMDUxNzgsMCAtMC4yNDQxMDMsLTAuMDczOTcgLTAuNTE3NzkzLDAuMDQ0MzggLTAuMjczNjkxLDAuMTE4MzUzIC0wLjQ2NjAxNCwwLjE3MDEzMiAtMC44NDMyNjMsMC4zODQ2NDYgLTAuMzc3MjQ4LDAuMjE0NTE0IC0wLjcxMDExNSwwLjQyMTYzMSAtMC44MzU4NjUsMC40OTU2MDIgLTAuMTI1NzUsMC4wNzM5NyAtMC43NDcxLDAuNDI5MDI4IC0wLjc0NzEsMC40MjkwMjggbCAtMC4wOTYxNiwwLjY1ODMzNiB6IiBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojZjhmOGY4O2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDowLjAxMDQ2MDk5cHg7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW9wYWNpdHk6MSIgLz4gPHBhdGggaWQ9InBhdGg0MzMwIiBkPSJtIDE4LjA4MTQ4NSwxMy4xMTcyMzkgYyAwLDAgMS4wMTcyMDIsMC4yMTk4MDggMS40OTA2MTMsLTAuMTM1MjUgMC42ODI1NSwtMC42NzQwOTcgMS42NTU4OTMsLTEuMTU0NzMxIDEuODcwMzU1LC0xLjc0NTMwOCAwLjEwODI1NywtMC4yOTgxMTYgMC4wOTI2NSwtMC4zNzIzNzcgLTAuMDgwMTgsLTAuNjM3MTkxIC0wLjc4NDA4NSwtMS4xMTY5NTIzIC0yLjE4NjAyMywwLjQ4MzU2MyAtMi4xODYwMjMsMC40ODM1NjMgbCAtMS4yMjA1MTEsMS4wNDI5ODMgeiIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6I2M5ZGFkODtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4wMTA0NjA5OXB4O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNDI4MSIgZD0ibSAxOC45MjM2MzgsMTEuOTExMTY2IGMgMCwwIC0yLjI2MjA3MywwLjM2MDA3MyAtMS4yNDU4MDcsMS42MzE0MjYgMS4wMTYyNjgsMS4yNzEzNTQgMS4zMzE1OSwwLjQ2ODQxNSAxLjMzMTU5LDAuNDY4NDE1IDAsMCAwLjIzNzM2NCwwLjI4NDAyMSAwLjU1MDIyMSwtMC4wMTI4OSAwLjMxMjg1NywtMC4yOTY5MSAwLjgwMTY1NywtMC40ODY1NjMgMC44MDE2NTcsLTAuNDg2NTYzIDAsMCAwLjgzMzQxOSwtMC4wODE1OCAxLjcyODg1MSwtMC42NDAzNDUgMC44OTU0MzIsLTAuNTU4NzY5IDAuMDI1NDUsLTEuNDk0NjQ0IDAuMDI1NDUsLTEuNDk0NjQ0IDAsMCAtMC43MDQwMDIsLTAuOTE0MzA1IC0xLjE5MTE1OCwtMS4wNjIwMDQgLTAuNDg3MTU1LC0wLjE0NzY5OSAtMS4yNjAyMDYsLTAuMjA1OTYzIC0xLjI2MDIwNiwtMC4yMDU5NjMgeiIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6bm9uZTtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6IzUwNTA1MDtzdHJva2Utd2lkdGg6MC4xMDQ2MDk5O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDwvZz4gPC9zdmc+";

                    console.log(
                        "%cMusic Blocks",
                        "font-size: 24px; font-weight: bold; font-family: sans-serif; padding:20px 0 0 110px; background: url(" +
                            imgUrl +
                            ") no-repeat;"
                    );

                    console.log(
                        "%cMusic Blocks is a collection of tools for exploring fundamental musical concepts in a fun way.",
                        "font-size: 16px; font-family: sans-serif; font-weight: bold;"
                    );
                } else {
                    console.log(
                        "%cTurtle Blocks is a collection of tools for exploring  concepts from Logo in a fun way.",
                        "font-size: 16px; font-family: sans-serif; font-weight: bold;"
                    );
                }
                that.keyboardEnableFlag = 1;
            }

            pubsub.off("finishedLoading", __afterLoad);
        };

        that.keyboardEnableFlag = 0;

        that.sessionData = null;
        const currentProject = that.storage.currentProject;
        const sessionKey = currentProject !== undefined ? "SESSION" + currentProject : null;

        if (that.planet) {
            that.sessionData = await that.planet.openCurrentProject();
            if (!that.sessionData) {
                if (currentProject !== undefined) {
                    that.sessionData = that.storage[sessionKey];
                }
            }
        } else {
            if (sessionKey !== null) {
                that.sessionData = that.storage[sessionKey];
            }
        }

        pubsub.on("finishedLoading", __afterLoad);

        if (that.sessionData) {
            that.doLoadAnimation();
            try {
                if (that.sessionData === "undefined" || that.sessionData === "[]") {
                    that.justLoadStart();
                } else {
                    window.loadedSession = that.sessionData;
                    that.blocks.loadNewBlocks(JSON.parse(that.sessionData));
                }
            } catch (e) {
                ErrorHandler.recoverable(e, { operation: "loadSessionData" });
                if (sessionKey !== null) {
                    try {
                        if (typeof that.storage.removeItem === "function") {
                            that.storage.removeItem(sessionKey);
                        } else {
                            delete that.storage[sessionKey];
                        }
                    } catch (storageError) {
                        ErrorHandler.recoverable(storageError, {
                            operation: "removeBadSessionKey"
                        });
                    }
                }
                that.justLoadStart();
            }
        } else {
            that.justLoadStart();
        }

        that.update = true;
    }

    _loadProject(projectID, flags) {
        const that = this.activity;

        if (that.planet === undefined) {
            return;
        }

        flags =
            typeof flags !== "undefined"
                ? flags
                : {
                      run: false,
                      show: false,
                      collapse: false
                  };
        that.loading = true;
        document.body.style.cursor = "wait";
        that.doLoadAnimation();

        try {
            const projectName =
                that.planet && typeof that.planet.getCurrentProjectName === "function"
                    ? that.planet.getCurrentProjectName()
                    : _("My Project");
            that.textMsg(projectName);
        } catch (e) {
            ErrorHandler.recoverable(e, { operation: "loadProjectName" });
            that.textMsg(_("My Project"));
        }

        const pm = this;
        setTimeout(() => {
            const finishLoading = () => {
                that.loading = false;
                document.body.style.cursor = "default";
                that.update = true;
            };

            try {
                if (that.planet && typeof that.planet.openProjectFromPlanet === "function") {
                    that.planet.openProjectFromPlanet(projectID, () => {
                        that.loadStartWrapper((act, ...args) => pm._loadStart(act, ...args));
                    });
                } else {
                    throw new Error("Planet openProjectFromPlanet is unavailable.");
                }
            } catch (e) {
                ErrorHandler.recoverable(e, { operation: "openProjectFromPlanet" });
                that.loadStartWrapper((act, ...args) => pm._loadStart(act, ...args));
            }

            if (that.planet && typeof that.planet.initialiseNewProject === "function") {
                try {
                    that.planet.initialiseNewProject();
                } catch (e) {
                    ErrorHandler.recoverable(e, { operation: "planetInitialiseNewProject" });
                }
            } else {
                ErrorHandler.warn("Planet initialiseNewProject is unavailable.", {
                    operation: "loadFromPlanet"
                });
            }

            finishLoading();
        }, 2500);

        const run = flags.run;
        const show = flags.show;
        const collapse = flags.collapse;

        const __functionload = () => {
            setTimeout(() => {
                if (!collapse && that.firstRun) {
                    that._toggleCollapsibleStacks();
                }

                if (run && that.firstRun) {
                    for (let turtle = 0; turtle < that.turtles.getTurtleCount(); turtle++) {
                        that.turtles.getTurtle(turtle).painter.doClear(true, true, false);
                    }

                    that.textMsg(_("Click the run button to run the project."));

                    if (show) {
                        that._changeBlockVisibility();
                    }

                    if (!collapse) {
                        that._toggleCollapsibleStacks();
                    }
                } else if (!show) {
                    that._changeBlockVisibility();
                }

                pubsub.off("finishedLoading", __functionload);
                that.firstRun = false;
            }, 1000);
        };

        pubsub.on("finishedLoading", __functionload);
    }

    loadFromPlanet(projectID, flags, env) {
        return this._loadProject(projectID, flags, env);
    }

    // -----------------------------------------------------------------------
    // New project
    // -----------------------------------------------------------------------

    _afterDelete() {
        const that = this.activity;
        const pm = this;

        if (that.turtles.running()) {
            that._doHardStopButton();
        }

        // Clear the Git tracking for the new project — mirrors the
        // same cleanup done in activity.js _afterDelete (which is only
        // reached via a different code path).
        localStorage.removeItem("mbGitRepoName");
        localStorage.removeItem("mbGitHashedKey");
        localStorage.removeItem("mbGitLastSavedHash");
        localStorage.removeItem("mbGitCurrentSha");
        if (that.gitDropdownUI && typeof that.gitDropdownUI.clearForNewProject === "function") {
            that.gitDropdownUI.clearForNewProject();
        } else if (that.gitDropdownUI && typeof that.gitDropdownUI._syncMenuState === "function") {
            that.gitDropdownUI._syncMenuState();
        }

        if (that.planet !== undefined && that.planet.planet !== null) {
            // Save the current project before switching away from it.
            that.planet.saveLocally();
            // Create the new project slot and clear the canvas synchronously.
            that.planet.initialiseNewProject();
            // _loadStart is async: it fires loadNewBlocks and then emits
            // "finishedLoading". We save the NEW project only after that
            // event fires so we capture the fresh start blocks, not stale data.
            pm._loadStart(that)
                .then(() => {
                    that.planet.saveLocally();
                })
                .catch(() => {
                    // Best-effort — ignore if _loadStart rejects unexpectedly.
                    that.planet.saveLocally();
                });
        } else {
            that.toolbar.closeAuxToolbar((act, resize) => act._showHideAuxMenu(resize));

            setTimeout(() => {
                that.sendAllToTrash(false, false);
                that.blocks.loadNewBlocks(DATAOBJS);
            }, 1000);
        }
    }

    newProject() {
        this._afterDelete();
    }

    // -----------------------------------------------------------------------
    // File loading (chooser + merge)
    // -----------------------------------------------------------------------

    _doLoad(merge) {
        const that = this.activity;

        that.toolbar.closeAuxToolbar((act, resize) => act._showHideAuxMenu(resize));
        if (merge === undefined) {
            merge = false;
        }

        if (merge) {
            that.merging = true;
        } else {
            that.merging = false;
        }

        document.querySelector("#myOpenFile").focus();
        document.querySelector("#myOpenFile").click();
        window.scroll(0, 0);
        that._doHardStopButton();
        that._allClear(true, true);
    }

    doLoad() {
        this._doLoad(false);
    }

    doMergeLoad() {
        this._doLoad(true);
    }

    // -----------------------------------------------------------------------
    // Export / save
    // -----------------------------------------------------------------------

    prepareExport() {
        const activity = this.activity;
        const blockMap = [];
        const blockIndexById = new Map();
        activity.hasMatrixDataBlock = false;
        for (let blk = 0; blk < activity.blocks.blockList.length; blk++) {
            const myBlock = activity.blocks.blockList[blk];
            if (myBlock && myBlock.trash) {
                continue;
            } else if (!myBlock) {
                continue;
            }

            blockIndexById.set(blk, blockMap.length);
            blockMap.push(blk);
        }

        const data = [];
        for (let blk = 0; blk < activity.blocks.blockList.length; blk++) {
            const myBlock = activity.blocks.blockList[blk];
            if (!myBlock || myBlock.trash) {
                continue;
            }

            let args = null;
            let exportName = myBlock.name;

            if (
                myBlock.isValueBlock() ||
                myBlock.name === "loadFile" ||
                myBlock.name === "boolean"
            ) {
                switch (myBlock.name) {
                    case "namedbox":
                    case "namedarg":
                        args = {
                            value: myBlock.privateData
                        };
                        break;
                    default:
                        args = {
                            value: myBlock.value
                        };
                }
            } else {
                switch (myBlock.name) {
                    case "start":
                    case "drum": {
                        const turtle =
                            myBlock.value !== null && myBlock.value !== undefined
                                ? activity.turtles.getTurtle(myBlock.value)
                                : null;
                        if (turtle === null || turtle === undefined) {
                            args = {
                                id: activity.turtles.getTurtleCount(),
                                collapsed: false,
                                xcor: 0,
                                ycor: 0,
                                heading: 0,
                                color: 0,
                                shade: 50,
                                pensize: 5,
                                grey: 100
                            };
                        } else {
                            args = {
                                id: turtle.id,
                                collapsed: myBlock.collapsed,
                                xcor: turtle.x,
                                ycor: turtle.y,
                                heading: turtle.orientation,
                                color: turtle.painter.color,
                                shade: turtle.painter.value,
                                pensize: turtle.painter.stroke,
                                grey: turtle.painter.chroma
                            };
                        }
                        break;
                    }
                    case "temperament1":
                        if (activity.blocks.customTemperamentDefined) {
                            let customName = "custom";
                            if (myBlock.connections[1] !== null) {
                                customName =
                                    activity.blocks.blockList[myBlock.connections[1]].value;
                            }

                            debugLog(customName);
                            args = {
                                customName: customName,
                                customTemperamentNotes: getTemperament(customName),
                                startingPitch: activity.logo?.synth?.startingPitch || 392,
                                octaveSpace: getOctaveRatio()
                            };
                        }
                        break;
                    case "interval":
                    case "newnote":
                    case "action":
                    case "matrix":
                    case "pitchdrummatrix":
                    case "rhythmruler":
                    case "timbre":
                    case "pitchstaircase":
                    case "tempo":
                    case "pitchslider":
                    case "musickeyboard":
                        args = {
                            collapsed: myBlock.collapsed
                        };
                        break;
                    case "storein2":
                    case "nameddo":
                    case "nameddoArg":
                    case "namedcalc":
                    case "namedcalcArg":
                    case "outputtools":
                        args = {
                            value: myBlock.privateData
                        };
                        break;
                    case "nopValueBlock":
                    case "nopZeroArgBlock":
                    case "nopOneArgBlock":
                    case "nopTwoArgBlock":
                    case "nopThreeArgBlock":
                        exportName = myBlock.privateData;
                        break;
                    case "matrixData":
                        args = {
                            notes: window.savedMatricesNotes,
                            count: window.savedMatricesCount
                        };
                        activity.hasMatrixDataBlock = true;
                        break;
                    case "wrapmode":
                        args = {
                            value: myBlock.value
                        };
                        break;
                    default:
                        break;
                }
            }

            const connections = [];
            for (let c = 0; c < myBlock.connections.length; c++) {
                const connection = myBlock.connections[c];
                const mapConnection = blockIndexById.get(connection);
                if (connection === null || mapConnection === undefined) {
                    connections.push(null);
                } else {
                    connections.push(mapConnection);
                }
            }

            const blockIndex = blockIndexById.get(blk);
            if (args === null) {
                data.push([
                    blockIndex,
                    exportName,
                    myBlock.container.x,
                    myBlock.container.y,
                    connections
                ]);
            } else {
                data.push([
                    blockIndex,
                    [exportName, args],
                    myBlock.container.x,
                    myBlock.container.y,
                    connections
                ]);
            }
        }

        return JSON.stringify(data);
    }

    saveLocally() {
        const activity = this.activity;
        const data = this.prepareExport();

        if (activity.storage.currentProject === undefined) {
            try {
                activity.storage.currentProject = "My Project";
                activity.storage.allProjects = JSON.stringify(["My Project"]);
            } catch (e) {
                ErrorHandler.recoverable(e, { operation: "saveLocally_setCurrentProject" });
            }
        }

        let p = "";
        try {
            p = activity.storage.currentProject;
            activity.storage["SESSION" + p] = data;
        } catch (e) {
            ErrorHandler.recoverable(e, { operation: "saveLocally_saveSession" });
        }

        const img = new Image();
        const svgData = doSVG(
            activity.canvas,
            activity.logo,
            activity.turtles,
            320,
            240,
            320 / activity.canvas.width
        );

        img.onload = () => {
            try {
                if (!img.naturalWidth || !img.naturalHeight) {
                    return;
                }

                const w = img.naturalWidth;
                const h = img.naturalHeight;
                const offscreen = document.createElement("canvas");
                offscreen.width = w;
                offscreen.height = h;
                offscreen.getContext("2d").drawImage(img, 0, 0);
                activity.storage["SESSIONIMAGE" + p] = offscreen.toDataURL("image/png");
            } catch (e) {
                ErrorHandler.recoverable(e, { operation: "saveLocally_thumbnail" });
            }
        };

        img.src = "data:image/svg+xml;base64," + window.btoa(base64Encode(svgData));
    }

    // -----------------------------------------------------------------------
    // MIDI import
    // -----------------------------------------------------------------------

    _midiImportBlocks(midi) {
        if (document.getElementById("import-midi")) return;

        const modal = document.createElement("div");
        modal.classList.add("modalBox");
        modal.id = "import-midi";
        const title = document.createElement("h2");
        title.textContent = _("Import MIDI");
        title.classList.add("modal-title");
        title.style.color = platformColor.headingColor;
        modal.appendChild(title);

        const container = document.createElement("div");
        container.classList.add("message-container");
        const message = document.createElement("p");
        message.textContent = _("Set the max blocks to generate:");
        message.classList.add("modal-message");
        container.appendChild(message);

        const select = document.createElement("select");
        select.classList.add("block-count-dropdown");

        for (let i = 1; i <= 12; i++) {
            const option = document.createElement("option");
            option.value = i * 100;
            option.textContent = i * 100;
            select.appendChild(option);
        }

        container.appendChild(select);
        modal.appendChild(container);

        const importConfirm = document.createElement("button");
        importConfirm.classList.add("confirm-button");
        importConfirm.textContent = _("Confirm");
        importConfirm.style.backgroundColor = platformColor.blueButton;
        importConfirm.style.color = platformColor.blueButtonText;
        importConfirm.style.border = "none";
        importConfirm.style.borderRadius = "4px";
        importConfirm.style.padding = "8px 16px";
        importConfirm.style.fontWeight = "bold";
        importConfirm.style.cursor = "pointer";
        importConfirm.style.marginRight = "16px";
        importConfirm.addEventListener("click", () => {
            const maxNoteBlocks = select.value;
            require(["activity/midi"], function () {
                transcribeMidi(midi, maxNoteBlocks);
            });
            document.body.removeChild(modal);
        });
        modal.appendChild(importConfirm);

        const cancelBtn = document.createElement("button");
        cancelBtn.classList.add("cancel-button");
        cancelBtn.textContent = _("Cancel");
        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
        });
        modal.appendChild(cancelBtn);

        document.body.appendChild(modal);
    }

    // -----------------------------------------------------------------------
    // Run
    // -----------------------------------------------------------------------

    runProject(env) {
        pubsub.off("finishedLoading", this.runProject);

        const that = this.activity;
        setTimeout(() => {
            that._changeBlockVisibility();
            that._doFastButton(env);
        }, 5000);
    }

    // -----------------------------------------------------------------------
    // Note value helper
    // -----------------------------------------------------------------------

    getClosestStandardNoteValue(duration) {
        let closest = _STANDARD_DURATIONS[0];
        let minDiff = Math.abs(duration - closest.duration);

        for (let i = 1; i < _STANDARD_DURATIONS.length; i++) {
            let diff = Math.abs(duration - _STANDARD_DURATIONS[i].duration);
            if (diff < minDiff) {
                closest = _STANDARD_DURATIONS[i];
                minDiff = diff;
            }
        }

        return closest.value.split("/").map(Number);
    }

    // -----------------------------------------------------------------------
    // File chooser and drag-and-drop handlers
    // -----------------------------------------------------------------------

    _setupFileHandlers() {
        const that = this.activity;
        const pm = this;

        that.fileChooser.addEventListener("click", event => {
            event.currentTarget.value = "";
        });

        that.fileChooser.addEventListener(
            "change",
            () => {
                const reader = new FileReader();
                const midiReader = new FileReader();

                reader.onload = () => {
                    that.loading = true;
                    document.body.style.cursor = "wait";
                    that.doLoadAnimation();

                    setTimeout(() => {
                        const rawData = reader.result;
                        if (rawData === null || rawData === "") {
                            that.errorMsg(
                                _("Cannot load project from the file. Please check the file type.")
                            );
                        } else {
                            /* istanbul ignore next -- file-chooser change handler is browser-only; inaccessible from Jest */
                            const cleanData = rawData.replace(/\n/g, " ");
                            let obj;
                            try {
                                if (cleanData.includes("html")) {
                                    let extracted;
                                    extracted = extractProjectDataFromHTML(cleanData);
                                    if (!extracted) {
                                        that.errorMsg(
                                            _("Cannot find project data in this HTML file.")
                                        );
                                        finishLoading();
                                        return;
                                    }
                                    obj = JSON.parse(unescapeHTML(extracted));
                                } else {
                                    obj = JSON.parse(cleanData);
                                }
                                for (const name in that.palettes.dict) {
                                    that.palettes.dict[name].hideMenu(true);
                                }

                                that.stage.removeAllEventListeners("trashsignal");

                                if (!that.merging) {
                                    const __listener = () => {
                                        that.blocks.loadNewBlocks(obj);
                                        that.stage.removeAllEventListeners("trashsignal");
                                        if (that.planet) {
                                            that.planet.saveLocally();
                                        }
                                    };

                                    that.stage.addEventListener("trashsignal", __listener, false);
                                    that.sendAllToTrash(false, false);
                                    that._allClear(false, true);
                                    if (that.planet) {
                                        that.planet.closePlanet();
                                        that.planet.initialiseNewProject(
                                            that.fileChooser.files[0].name.substr(
                                                0,
                                                that.fileChooser.files[0].name.lastIndexOf(".")
                                            )
                                        );
                                    }
                                } else {
                                    that.merging = false;
                                    that.blocks.loadNewBlocks(obj);
                                }

                                that.loading = false;
                                that.refreshCanvas();
                            } catch (e) {
                                that.errorMsg(
                                    _(
                                        "Cannot load project from the file. Please check the file type."
                                    )
                                );

                                ErrorHandler.capture(e, { operation: "loadProjectFromFile" });
                                document.body.style.cursor = "default";
                                that.loading = false;
                            }
                        }
                    }, 200);
                };

                midiReader.onload = e => {
                    try {
                        const midi = new Midi(e.target.result);
                        console.debug(midi);
                        pm._midiImportBlocks(midi);
                    } catch (err) {
                        ErrorHandler.capture(err, { operation: "midiImport" });
                        if (that && typeof that.errorMsg === "function") {
                            that.errorMsg(
                                _("Cannot load project from the file. Please check the file type.")
                            );
                        }
                    }
                };

                const file = that.fileChooser.files[0];
                if (file) {
                    const extension = file.name.split(".").pop().toLowerCase();
                    const isMidi = extension === "mid" || extension === "midi";
                    if (isMidi) {
                        midiReader.readAsArrayBuffer(file);
                    } else {
                        reader.readAsText(file);
                    }
                }
            },
            false
        );

        const __handleFileSelect = event => {
            event.stopPropagation();
            event.preventDefault();

            const files = event.dataTransfer.files;
            const reader = new FileReader();
            const midiReader = new FileReader();

            const abcReader = new FileReader();
            reader.onload = () => {
                that.loading = true;
                document.body.style.cursor = "wait";

                setTimeout(() => {
                    const rawData = reader.result;
                    if (rawData === null || rawData === "") {
                        that.errorMsg(
                            _("Cannot load project from the file. Please check the file type.")
                        );
                    } else {
                        /* istanbul ignore next -- drag-and-drop file handler is browser-only; inaccessible from Jest */
                        const cleanData = rawData.replace(/\n/g, " ");
                        let obj;
                        try {
                            if (cleanData.includes("html")) {
                                let extracted;
                                extracted = extractProjectDataFromHTML(cleanData);
                                if (!extracted) {
                                    that.errorMsg(_("Cannot find project data in this HTML file."));
                                    finishLoading();
                                    return;
                                }
                                obj = JSON.parse(unescapeHTML(extracted));
                            } else {
                                obj = JSON.parse(cleanData);
                            }
                            for (const name in that.blocks.palettes.dict) {
                                that.palettes.dict[name].hideMenu(true);
                            }

                            that.stage.removeAllEventListeners("trashsignal");

                            const __afterLoad = () => {
                                pubsub.off("finishedLoading", __afterLoad);
                            };

                            const __listener = () => {
                                that.blocks.loadNewBlocks(obj);
                                that.stage.removeAllEventListeners("trashsignal");

                                pubsub.on("finishedLoading", __afterLoad);
                            };

                            that.stage.addEventListener("trashsignal", __listener, false);
                            that.sendAllToTrash(false, false);
                            if (that.planet !== undefined) {
                                that.planet.initialiseNewProject(
                                    files[0].name.substr(0, files[0].name.lastIndexOf("."))
                                );
                            }

                            that.loading = false;
                            that.refreshCanvas();
                        } catch (e) {
                            ErrorHandler.capture(e, { operation: "loadFromFile" });
                            that.errorMsg(
                                _("Cannot load project from the file. Please check the file type.")
                            );
                            document.body.style.cursor = "default";
                            that.loading = false;
                        }
                    }
                }, 200);
            };
            midiReader.onload = e => {
                try {
                    const midi = new Midi(e.target.result);
                    console.debug(midi);
                    pm._midiImportBlocks(midi);
                } catch (err) {
                    ErrorHandler.capture(err, { operation: "midiImportBlocks" });
                    if (that && typeof that.errorMsg === "function") {
                        that.errorMsg(
                            _("Cannot load project from the file. Please check the file type.")
                        );
                    }
                }
            };

            abcReader.onload = async event => {
                let abcData = event.target.result;
                abcData = abcData.replace(/\\/g, "");

                await ensureABCJS();
                const tunebook = new ABCJS.parseOnly(abcData);

                debugLog(tunebook);
                tunebook.forEach(tune => {
                    that.parseABC(tune);
                });
            };

            if (files[0] !== undefined) {
                const extension = files[0].name.split(".").pop().toLowerCase();

                const isMidi = extension === "mid" || extension === "midi";
                if (isMidi) {
                    midiReader.readAsArrayBuffer(files[0]);
                    return;
                }

                const isABC = extension === "abc";
                if (isABC) {
                    abcReader.readAsText(files[0]);
                    return;
                }
                reader.readAsText(files[0]);
                window.scroll(0, 0);
            }
        };

        const __handleDragOver = event => {
            event.stopPropagation();
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
        };

        const dropZone = document.getElementById("canvasHolder");
        dropZone.addEventListener("dragover", __handleDragOver, false);
        dropZone.addEventListener("drop", __handleFileSelect, false);
    }

    // -----------------------------------------------------------------------
    // Startup: URL params + initial load
    // -----------------------------------------------------------------------

    start() {
        const that = this.activity;
        const pm = this;

        this._setupFileHandlers();

        const URL = window.location.href;
        const flags = {
            run: false,
            show: false,
            collapse: false
        };

        let urlParts;
        const env = [];

        if (URL.indexOf("?") > 0) {
            let args, url;
            urlParts = URL.split("?");
            if (urlParts[1].indexOf("&") > 0) {
                const newUrlParts = urlParts[1].split("&");
                for (let i = 0; i < newUrlParts.length; i++) {
                    if (newUrlParts[i].indexOf("=") > 0) {
                        args = newUrlParts[i].split("=");
                        switch (args[0].toLowerCase()) {
                            case "file":
                                break;
                            case "id":
                                that.projectID = args[1];
                                break;
                            case "run":
                                if (args[1].toLowerCase() === "true") flags.run = true;
                                break;
                            case "show":
                                if (args[1].toLowerCase() === "true") flags.show = true;
                                break;
                            case "collapse":
                                if (args[1].toLowerCase() === "true") flags.collapse = true;
                                break;
                            case "inurl":
                                url = args[1];
                                // eslint-disable-next-line no-case-declarations
                                const getJSON = u => {
                                    return new Promise((resolve, reject) => {
                                        const xhr = new XMLHttpRequest();
                                        xhr.open("get", u, true);
                                        xhr.responseType = "json";
                                        xhr.onload = () => {
                                            const status = xhr.status;
                                            if (status === 200) {
                                                resolve(xhr.response);
                                            } else {
                                                reject(status);
                                            }
                                        };
                                        xhr.send();
                                    });
                                };

                                getJSON(url).then(
                                    data => {
                                        const n = data.arg;
                                        env.push(parseInt(n, 10));
                                    },
                                    () => {
                                        alert(
                                            _(
                                                "Something went wrong reading JSON-encoded project data."
                                            )
                                        );
                                    }
                                );
                                break;
                            case "outurl":
                                url = args[1];
                                break;
                            default:
                                that.errorMsg(_("Invalid parameters"));
                                break;
                        }
                    }
                }
            } else {
                if (urlParts[1].indexOf("=") > 0) {
                    args = urlParts[1].split("=");
                }

                if (args[0].toLowerCase() === "id") {
                    that.projectID = args[1];
                }
            }
        }

        if (that.projectID !== null) {
            setTimeout(() => {
                that.loadStartWrapper(
                    (act, pID, f, e) => pm._loadProject(pID, f, e),
                    that.projectID,
                    flags,
                    env
                );
            }, 200);
        } else {
            setTimeout(() => {
                that.loadStartWrapper((act, ...args) => pm._loadStart(act, ...args));
            }, 200);
        }
    }
}

const setupProjectManager = activity => {
    const manager = new ProjectManager(activity);
    activity.projectManager = manager;
    return manager;
};

if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupProjectManager = setupProjectManager;
        return { setupProjectManager, ProjectManager };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { setupProjectManager, ProjectManager };
}
