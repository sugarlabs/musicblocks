// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global FileReader, Midi, ABCJS, ensureABCJS, preparePluginExports,
   processRawPluginData, _, debugLog
*/

/**
 * Owns file chooser, drag-drop, and plugin file import bindings for Activity.
 */
class FileIOHandler {
    constructor(activity, dependencies) {
        this.activity = activity;
        this.dependencies = dependencies || {};
    }

    _makeReader() {
        const FileReaderRef = this.dependencies.FileReaderRef || FileReader;
        return new FileReaderRef();
    }

    _makeMidi(arrayBuffer) {
        const MidiRef = this.dependencies.MidiRef || Midi;
        return new MidiRef(arrayBuffer);
    }

    async _ensureABCJS() {
        const ensureABCJSFn = this.dependencies.ensureABCJSFn || ensureABCJS;
        return ensureABCJSFn();
    }

    _getABCJS() {
        return this.dependencies.ABCJSRef || ABCJS;
    }

    async _processRawPluginData(rawData, sourceName) {
        const processRawPluginDataFn =
            this.dependencies.processRawPluginDataFn || processRawPluginData;
        return processRawPluginDataFn(this.activity, rawData, sourceName);
    }

    _preparePluginExports(pluginObj) {
        const preparePluginExportsFn =
            this.dependencies.preparePluginExportsFn || preparePluginExports;
        return preparePluginExportsFn(this.activity, pluginObj);
    }

    _basename(fileName) {
        return fileName.substr(0, fileName.lastIndexOf("."));
    }

    _projectLoadError() {
        return _("Cannot load project from the file. Please check the file type.");
    }

    _parseProjectData(rawData, allowCodeBlockId) {
        if (rawData === null || rawData === "") {
            throw new Error(this._projectLoadError());
        }

        const cleanData = rawData.replace("\n", " ");
        if (cleanData.includes("html")) {
            if (allowCodeBlockId && cleanData.includes('id="codeBlock"')) {
                return JSON.parse(
                    cleanData.match('<div class="code" id="codeBlock">(.+?)</div>')[1]
                );
            }

            return JSON.parse(cleanData.match('<div class="code">(.+?)</div>')[1]);
        }

        return JSON.parse(cleanData);
    }

    _hidePalettes() {
        for (const name in this.activity.palettes.dict) {
            this.activity.palettes.dict[name].hideMenu(true);
        }
    }

    _loadProjectFromChooser(rawData, fileName) {
        const activity = this.activity;
        activity.loading = true;
        document.body.style.cursor = "wait";
        activity.doLoadAnimation();

        setTimeout(() => {
            try {
                const obj = this._parseProjectData(rawData, true);
                this._hidePalettes();
                activity.stage.removeAllEventListeners("trashsignal");

                if (!activity.merging) {
                    const __listener = () => {
                        activity.blocks.loadNewBlocks(obj);
                        activity.stage.removeAllEventListeners("trashsignal");
                        if (activity.planet) {
                            activity.planet.saveLocally();
                        }
                    };

                    activity.stage.addEventListener("trashsignal", __listener, false);
                    activity.sendAllToTrash(false, false);
                    activity._allClear(false, true);
                    if (activity.planet) {
                        activity.planet.closePlanet();
                        activity.planet.initialiseNewProject(this._basename(fileName));
                    }
                } else {
                    activity.merging = false;
                    activity.blocks.loadNewBlocks(obj);
                }

                activity.loading = false;
                activity.refreshCanvas();
            } catch (error) {
                activity.errorMsg(this._projectLoadError());
                console.error(error);
                document.body.style.cursor = "default";
                activity.loading = false;
            }
        }, 200);
    }

    _loadProjectFromDrop(rawData, fileName) {
        const activity = this.activity;
        activity.loading = true;
        document.body.style.cursor = "wait";

        setTimeout(() => {
            try {
                const obj = this._parseProjectData(rawData, false);
                this._hidePalettes();
                activity.stage.removeAllEventListeners("trashsignal");

                const __afterLoad = () => {
                    document.removeEventListener("finishedLoading", __afterLoad);
                };

                const __listener = () => {
                    activity.blocks.loadNewBlocks(obj);
                    activity.stage.removeAllEventListeners("trashsignal");

                    if (document.addEventListener) {
                        document.addEventListener("finishedLoading", __afterLoad);
                    } else {
                        document.attachEvent("finishedLoading", __afterLoad);
                    }
                };

                activity.stage.addEventListener("trashsignal", __listener, false);
                activity.sendAllToTrash(false, false);
                if (activity.planet !== undefined) {
                    activity.planet.initialiseNewProject(this._basename(fileName));
                }

                activity.loading = false;
                activity.refreshCanvas();
            } catch (error) {
                console.error(error);
                activity.errorMsg(this._projectLoadError());
                document.body.style.cursor = "default";
                activity.loading = false;
            }
        }, 200);
    }

    _handleMidiLoad(arrayBuffer, midiImportBlocks) {
        try {
            const midi = this._makeMidi(arrayBuffer);
            console.debug(midi);
            midiImportBlocks(midi);
        } catch (err) {
            console.error("MIDI import failed:", err);
            if (this.activity && typeof this.activity.errorMsg === "function") {
                this.activity.errorMsg(this._projectLoadError());
            }
        }
    }

    async _handleABCDrop(abcData) {
        let sanitizedABC = abcData.replace(/\\/g, "");

        await this._ensureABCJS();
        const tunebook = new (this._getABCJS().parseOnly)(sanitizedABC);

        debugLog(tunebook);
        tunebook.forEach(tune => {
            this.activity.parseABC(tune);
        });
    }

    bind(midiImportBlocks) {
        const activity = this.activity;

        activity.fileChooser.addEventListener("click", () => {
            activity.value = null;
        });

        activity.fileChooser.addEventListener(
            "change",
            () => {
                const reader = this._makeReader();
                const midiReader = this._makeReader();

                reader.onload = () => {
                    const file = activity.fileChooser.files[0];
                    if (file) {
                        this._loadProjectFromChooser(reader.result, file.name);
                    }
                };

                midiReader.onload = e => {
                    this._handleMidiLoad(e.target.result, midiImportBlocks);
                };

                const file = activity.fileChooser.files[0];
                if (file) {
                    const extension = file.name.split(".").pop().toLowerCase();
                    if (extension === "mid" || extension === "midi") {
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
            const reader = this._makeReader();
            const midiReader = this._makeReader();
            const abcReader = this._makeReader();

            reader.onload = () => {
                this._loadProjectFromDrop(reader.result, files[0].name);
            };

            midiReader.onload = e => {
                this._handleMidiLoad(e.target.result, midiImportBlocks);
            };

            abcReader.onload = async event => {
                await this._handleABCDrop(event.target.result);
            };

            if (files[0] !== undefined) {
                const extension = files[0].name.split(".").pop().toLowerCase();
                if (extension === "mid" || extension === "midi") {
                    midiReader.readAsArrayBuffer(files[0]);
                    return;
                }

                if (extension === "abc") {
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

        activity.allFilesChooser.addEventListener("click", () => {
            activity.value = null;
        });

        activity.pluginChooser.addEventListener("click", () => {
            window.scroll(0, 0);
            activity.value = null;
        });

        activity.pluginChooser.addEventListener(
            "change",
            () => {
                window.scroll(0, 0);

                const reader = this._makeReader();
                const pluginFile = activity.pluginChooser.files[0];

                reader.onload = () => {
                    activity.loading = true;
                    document.body.style.cursor = "wait";

                    setTimeout(async () => {
                        const obj = await this._processRawPluginData(
                            reader.result,
                            pluginFile && pluginFile.name
                                ? "file:" + pluginFile.name
                                : "file:local-file"
                        );
                        if (obj !== null) {
                            activity.storage.plugins = this._preparePluginExports(obj);
                        }

                        setTimeout(() => {
                            if (activity.palettes.visible) {
                                activity.palettes.hide();
                            }
                        }, 1000);

                        document.body.style.cursor = "default";
                        activity.loading = false;
                    }, 200);
                };

                reader.readAsText(pluginFile);
            },
            false
        );
    }
}

if (typeof globalThis !== "undefined") {
    globalThis.FileIOHandler = FileIOHandler;
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return FileIOHandler;
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = FileIOHandler;
}
