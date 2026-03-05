window._lgDemoBlocks = [];
window._lgRunningDemo = false;
window.GuideDemos = {

    getActivity() {
        return getRealActivity();
    },

    addDemoBlock(name, x = 300, y = 200) {
        const activity = this.getActivity();
        if (!activity) return null;

        const id = activity.blocks.makeNewBlock(name, x, y);
        if (id !== null && id !== undefined) {
            window._lgDemoBlocks.push(id);
        }
        return id;
    },

    clearDemoBlocks() {

        const activity = this.getActivity();
        if (!activity) return;

        const blocks = activity.blocks;

        window._lgDemoBlocks.forEach(id => {

            const block = blocks.blockList[id];

            if (!block) return;

            block.trash = true;

            if (block.container) {
                block.container.visible = false;
            }

            /* remove all connections */
            if (block.connections) {
                block.connections = block.connections.map(() => null);
            }

        });

        window._lgDemoBlocks = [];

        activity.refreshCanvas();
    },
    highlightPaletteBlock(blockName) {

        const paletteBody = document.getElementById("PaletteBody");
        if (!paletteBody) return null;

        const blocks = paletteBody.querySelectorAll("canvas, div");

        for (const el of blocks) {

            if (el.innerText && el.innerText.toLowerCase().includes(blockName)) {

                el.classList.add("lg-palette-highlight");

                return el;
            }
        }

        return null;
    },

    openRhythmPalette() {
        console.log("🎬 Demo: Rhythm palette");

        const activity = getRealActivity();
        if (!activity) return;

        window._lgRunningDemo = true;
        activity.palettes.showPalette("rhythm");

        setTimeout(() => {
            const palette = activity.palettes.dict["rhythm"];
            if (palette && palette.hideMenu){
                palette.hideMenu();
            }
        }, 1000);
    },

    openPitchPalette() {
        const activity = getRealActivity();
        if (!activity) return;

        window._lgRunningDemo = true;
        activity.palettes.showPalette("pitch");

        setTimeout(() => {
            const palette = activity.palettes.dict["pitch"];
            if (palette && palette.hideMenu) {
                palette.hideMenu();
            }
        }, 1000);
    },

    showFlowPalette() {

        const activity = getRealActivity();
        if (!activity) return;

        window._lgRunningDemo = true;

        const blocks = activity.blocks;
        const blockList = blocks.blockList;

        activity.palettes.showPalette("flow");

        setTimeout(() => {

            const before = Object.keys(blockList);

            /* create repeat block */
            blocks.loadNewBlocks([
                [0, "repeat", 250, 180, [null, null, null]]
            ]);

            let repeatId = null;

            for (const id in blockList) {
                if (!before.includes(id) && blockList[id].name === "repeat") {
                    repeatId = id;
                    window._lgDemoBlocks.push(id);
                }
            }

            if (!repeatId) {
                window._lgRunningDemo = false;
                return;
            }

            const repeat = blockList[repeatId];

            /* find note block */

            let noteId = null;

            for (const id in blockList) {
                const b = blockList[id];
                if (b.name === "newnote" && !b.trash) {
                    noteId = id;
                }
            }

            if (!noteId) {
                window._lgRunningDemo = false;
                return;
            }

            const note = blockList[noteId];

            /* animate repeat block entering */

            const startX = repeat.container.x;
            const startY = repeat.container.y;

            const targetX = 420;
            const targetY = 180;

            const duration = 700;
            const startTime = performance.now();

            function dragRepeat(time) {

                const t = Math.min((time - startTime) / duration, 1);
                const ease = 1 - Math.pow(1 - t, 3);

                repeat.container.x = startX + (targetX - startX) * ease;
                repeat.container.y = startY + (targetY - startY) * ease;

                activity.refreshCanvas();

                if (t < 1) {
                    requestAnimationFrame(dragRepeat);
                } else {
                    connectNote();
                }
            }

            requestAnimationFrame(dragRepeat);

            /* move note stack inside repeat */

            function connectNote() {

                blocks.findDragGroup(noteId);

                const dock = repeat.docks[1];

                const tx = repeat.container.x + dock[0];
                const ty = repeat.container.y + dock[1];

                const dx = tx - note.container.x;
                const dy = ty - note.container.y;

                for (const blk of blocks.dragGroup) {
                    blocks.moveBlockRelative(blk, dx, dy);
                }

                blocks.blockMoved(noteId);

                activity.refreshCanvas();

                setTimeout(finishDemo, 2000);
            }

            function finishDemo() {

                GuideDemos.clearDemoBlocks();

                const palette = activity.palettes.dict["flow"];
                if (palette?.hideMenu) palette.hideMenu();

                window._lgRunningDemo = false;
            }

        }, 500);
    },

    showGraphicsPalette() {
        const activity = getRealActivity();
        if (!activity) return;

        window._lgRunningDemo = true;
        activity.palettes.showPalette("graphics");

        setTimeout(() => {
            const palette = activity.palettes.dict["graphics"];
            if (palette && palette.hideMenu) {
                palette.hideMenu();
            }
        }, 1000);
    },

    showTonePalette() {

        const activity = getRealActivity();
        if (!activity) return;

        window._lgRunningDemo = true;

        const blocks = activity.blocks;
        const blockList = blocks.blockList;

        activity.palettes.showPalette("tone");

        setTimeout(() => {

            const before = Object.keys(blockList);

            /* create Set Instrument block */
            blocks.loadNewBlocks([
                [0, "setinstrument", 250, 200, [null, null, null]]
            ]);

            let instId = null;

            for (const id in blockList) {
                if (!before.includes(id) && blockList[id].name === "setinstrument") {
                    instId = id;
                    window._lgDemoBlocks.push(id);
                }
            }

            if (!instId) {
                window._lgRunningDemo = false;
                return;
            }

            const instBlock = blockList[instId];

            /* find existing note block */

            let noteId = null;

            for (const id in blockList) {
                const b = blockList[id];
                if (b.name === "newnote" && !b.trash) {
                    noteId = id;
                }
            }

            if (!noteId) {
                window._lgRunningDemo = false;
                return;
            }

            const note = blockList[noteId];

            /* smooth drag of Set Instrument block */

            const startX = instBlock.container.x;
            const startY = instBlock.container.y;

            const targetX = 420;
            const targetY = 200;

            const duration = 600;
            const startTime = performance.now();

            function dragInstrument(time) {

                const t = Math.min((time - startTime) / duration, 1);
                const ease = 1 - Math.pow(1 - t, 3);

                instBlock.container.x = startX + (targetX - startX) * ease;
                instBlock.container.y = startY + (targetY - startY) * ease;

                activity.refreshCanvas();

                if (t < 1) {
                    requestAnimationFrame(dragInstrument);
                } else {
                    connectNote();
                }
            }

            requestAnimationFrame(dragInstrument);

            /* move note stack into clamp */

            function connectNote() {

                blocks.findDragGroup(noteId);

                const dock = instBlock.docks[1];

                const tx = instBlock.container.x + dock[0];
                const ty = instBlock.container.y + dock[1];

                const dx = tx - note.container.x;
                const dy = ty - note.container.y;

                for (const blk of blocks.dragGroup) {
                    blocks.moveBlockRelative(blk, dx, dy);
                }

                blocks.blockMoved(noteId);

                activity.refreshCanvas();

                highlightInstrument();
            }

            /* highlight and change instrument */

            function highlightInstrument() {

                const instrumentId = instBlock.connections[2];
                if (!instrumentId) return;

                const instValue = blockList[instrumentId];

                instValue.container.scaleX = 1.25;
                instValue.container.scaleY = 1.25;

                activity.refreshCanvas();

                setTimeout(() => {

                    instValue.value = "violin";
                    instValue.text.text = "violin";

                    instValue.container.updateCache();

                    activity.refreshCanvas();

                    instValue.container.scaleX = 1;
                    instValue.container.scaleY = 1;

                    activity.refreshCanvas();

                    finishDemo();

                }, 700);
            }

            function finishDemo() {

                setTimeout(() => {

                    GuideDemos.clearDemoBlocks();

                    const palette = activity.palettes.dict["tone"];
                    if (palette?.hideMenu) palette.hideMenu();

                    window._lgRunningDemo = false;

                }, 2200);
            }

        }, 500);
    },

    showNoteBlock() {
        const activity = getRealActivity();
        if (!activity) return;
        window._lgRunningDemo = true;
        activity.palettes.showPalette("rhythm");

        setTimeout(() => {
            const before = Object.keys(activity.blocks.blockList);
            activity.blocks.loadNewBlocks([
                [0,"newnote", 420, 220, [null, null]]
            ]);
            const blockList = activity.blocks.blockList;
            for (const id in blockList) {
                if (!before.includes(id)) {
                    const block = blockList[id];
                    if (block.name === "newnote") {
                        window._lgDemoBlocks.push(id);
                        if (block.container) {
                            block.container.x = 420;
                            block.container.y = 220;
                            block.container.scaleX = 1.15;
                            block.container.scaleY = 1.15;
                        }
                    }
                }
            }

            activity.refreshCanvas();

            setTimeout(() => {
                this.clearDemoBlocks();
                const palette = activity.palettes.dict["rhythm"];
                if (palette && palette.hideMenu){
                    palette.hideMenu();
                }
                window._lgRunningDemo = false;
            }, 1500);
        }, 500);
    },

    showPitchBlock() {
        const activity = getRealActivity();
        if (!activity) return;
        window._lgRunningDemo = true;
        const blocks = activity.blocks;
        const blockList = blocks.blockList;
        /* find note block */
        let noteId = null;
        for (const id in blockList) {
            const b = blockList[id];
            if (b.name === "newnote" && !b.trash) {
                noteId = id;
            }
        }
        if (!noteId) {
            window._lgRunningDemo = false;
            return;
        }
        const note = blockList[noteId];

        /* highlight palette */
        const paletteBtn =
            document.getElementById("pitchtabbutton") ||
            document.querySelector('[id*="pitch"]');

        if (paletteBtn) paletteBtn.classList.add("lg-pulse");

        activity.palettes.showPalette("pitch");

        /* highlight pitch block inside palette */

        let palettePitchHighlight = null;

        setTimeout(() => {
            palettePitchHighlight = GuideDemos.highlightPaletteBlock("pitch");
        }, 300);

        setTimeout(() => {
            const before = Object.keys(blockList);
            /* create pitch block */
            blocks.loadNewBlocks([
                [0, "pitch", 140, 180, [null, null, null]]
            ]);
            let pitchId = null;
            for (const id in blockList) {
                if (!before.includes(id) && blockList[id].name === "pitch") {
                    pitchId = id;
                    window._lgDemoBlocks.push(id);
                }
            }
            if (!pitchId) {
                window._lgRunningDemo = false;
                return;
            }

            /* wait until container exists */

            const waitForContainer = () => {
                const pitch = blockList[pitchId];
                if (!pitch || !pitch.container) {
                    setTimeout(waitForContainer, 50);
                    return;
                }
                startAnimation(pitch);
            };

            const startAnimation = (pitch) => {
                const dock = note.docks[2];
                const targetX = note.container.x + dock[0];
                const targetY = note.container.y + dock[1];
                const startX = pitch.container.x;
                const startY = pitch.container.y;
                const duration = 800;
                const startTime = performance.now();

                function animate(time) {
                    const t = Math.min((time - startTime) / duration, 1);
                    const ease = 1 - Math.pow(1 - t, 3);
                    const nx = startX + (targetX - startX) * ease;
                    const ny = startY + (targetY - startY) * ease;
                    pitch.container.x = nx;
                    pitch.container.y = ny;
                    activity.refreshCanvas();
                    if (t < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        activity.refreshCanvas();

                        setTimeout(() => {
                            if (paletteBtn)
                                paletteBtn.classList.remove("lg-pulse");
                            if (palettePitchHighlight)
                                palettePitchHighlight.classList.remove("lg-palette-highlight");
                            const palette =
                                activity.palettes.dict["pitch"];
                            if (palette?.hideMenu)
                                palette.hideMenu();
                            window._lgRunningDemo = false;
                            GuideDemos.clearDemoBlocks();
                        }, 1600);
                    }
                }
                requestAnimationFrame(animate);
            };
            waitForContainer();
        }, 500);
    },

    showOctaveChange() {
        const activity = getRealActivity();
        if (!activity) return;
        window._lgRunningDemo = true;
        const blocks = activity.blocks;
        const blockList = blocks.blockList;
        let pitchId = null;
        // find pitch inside note
        for (const id in blockList) {
            const b = blockList[id];
            if (b.name === "pitch" && !b.trash) {
                pitchId = id;
            }
        }
        if (!pitchId) {
            window._lgRunningDemo = false;
            return;
        }
        const octaveId = blockList[pitchId].connections[2];
        if (!octaveId) {
            window._lgRunningDemo = false;
            return;
        }
        const octaveBlock = blockList[octaveId];
        const oldValue = octaveBlock.value;
        octaveBlock.container.scaleX = 1.2;
        octaveBlock.container.scaleY = 1.2;
        activity.refreshCanvas();

        setTimeout(() => {
            const newValue = oldValue + 1;
            octaveBlock.value = newValue;
            octaveBlock.text.text = newValue.toString();
            const z = octaveBlock.container.children.length - 1;
            octaveBlock.container.setChildIndex(octaveBlock.text, z);
            octaveBlock.container.updateCache();
            activity.refreshCanvas();
        }, 500);

        setTimeout(() => {
            octaveBlock.value = oldValue;
            octaveBlock.text.text = oldValue.toString();
            const z = octaveBlock.container.children.length - 1;
            octaveBlock.container.setChildIndex(octaveBlock.text, z);
            octaveBlock.container.updateCache();
            octaveBlock.container.scaleX = 1;
            octaveBlock.container.scaleY = 1;
            activity.refreshCanvas();
            window._lgRunningDemo = false;
        }, 2000);
    },

    showConnection() {

        const activity = getRealActivity();
        if (!activity) return;

        window._lgRunningDemo = true;

        const blocks = activity.blocks;
        const blockList = blocks.blockList;

        let startId = null;
        let noteId = null;

        for (const id in blockList) {
            const block = blockList[id];
            if (block.name === "start") startId = id;
            if (block.name === "newnote" && !block.trash) noteId = id;
        }

        if (!startId || !noteId) {
            window._lgRunningDemo = false;
            return;
        }

        const start = blockList[startId];
        const note = blockList[noteId];

        const dock = start.docks[1];
        const targetX = start.container.x + dock[0];
        const targetY = start.container.y + dock[1];

        const startX = note.container.x;
        const startY = note.container.y;

        const duration = 800;
        const startTime = performance.now();

        blocks.findDragGroup(noteId);

        function animate(time) {

            const t = Math.min((time - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3);

            const nx = startX + (targetX - startX) * ease;
            const ny = startY + (targetY - startY) * ease;

            const dx = nx - note.container.x;
            const dy = ny - note.container.y;

            for (const blk of blocks.dragGroup) {
                blocks.moveBlockRelative(blk, dx, dy);
            }

            activity.refreshCanvas();

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {

                setTimeout(() => {

                    const dx = startX - note.container.x;
                    const dy = startY - note.container.y;

                    for (const blk of blocks.dragGroup) {
                        blocks.moveBlockRelative(blk, dx, dy);
                    }

                    activity.refreshCanvas();
                    window._lgRunningDemo = false;

                }, 1200);
            }
        }
        requestAnimationFrame(animate);
    },

    showPlayButton() {
        const playBtn = document.querySelector("#play, .play-button");
        if (playBtn) this.highlight(playBtn);
    },

    showMelodyExample() {

        const activity = getRealActivity();
        if (!activity) return;

        window._lgRunningDemo = true;

        activity.palettes.showPalette("rhythm");

        setTimeout(() => {

            const before = Object.keys(activity.blocks.blockList);

            /* create 3 note blocks */
            activity.blocks.loadNewBlocks([
                [0, "newnote", 420, 220, [null, null]],
                [1, "newnote", 420, 300, [null, null]],
                [2, "newnote", 420, 380, [null, null]]
            ]);

            const blockList = activity.blocks.blockList;

            for (const id in blockList) {

                if (!before.includes(id)) {

                    const block = blockList[id];

                    if (block.name === "newnote") {

                        window._lgDemoBlocks.push(id);

                        if (block.container) {
                            block.container.scaleX = 1.15;
                            block.container.scaleY = 1.15;
                        }
                    }
                }
            }

            activity.refreshCanvas();

            setTimeout(() => {

                GuideDemos.clearDemoBlocks();

                const palette = activity.palettes.dict["rhythm"];
                if (palette && palette.hideMenu) {
                    palette.hideMenu();
                }

                window._lgRunningDemo = false;

            }, 2000);

        }, 500);
    },

    showSaveButton() {
        const saveBtn = document.querySelector("#saveButton, .save-button");
        if (saveBtn) this.highlight(saveBtn);
    },

    highlight(element) {
        if (!element) return;

        element.classList.add("lg-demo-highlight");

        setTimeout(() => {
            element.classList.remove("lg-demo-highlight");
        }, 4000);
    }

};