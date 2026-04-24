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
   global BACKWARDCOMPATIBILITYDICT, COLLAPSIBLES, DEFAULTDRUM, DEFAULTEFFECT,
   DEFAULTNOISE, DEFAULTVOICE, addTemperamentToDictionary, deleteTemperamentFromList,
   getDrumSynthName, getNoiseSynthName, getVoiceSynthName, last, setOctaveRatio,
   updateTemperaments, _
*/

const BLOCK_SERIALIZER_CAMERA_VALUE = "##__CAMERA__##";
const BLOCK_SERIALIZER_VIDEO_VALUE = "##__VIDEO__##";

/**
 * Owns Blocks load finalization and action-stack metadata helpers.
 */
class BlockSerializer {
    /**
     * @param {Blocks} blocks - The owning Blocks instance.
     */
    constructor(blocks) {
        this.blocks = blocks;
    }

    /**
     * Load new blocks.
     * @param {Array} blockObjs - Block objects to load.
     * @returns {void}
     */
    loadNewBlocks(blockObjs) {
        const blocks = this.blocks;

        /**
         * Playback Queue has been deprecated, but some old projects
         * may still have playback blocks appended, which we will
         * remove.
         */
        let playbackQueueStartsHere = null;
        for (let b = 0; b < blockObjs.length; b++) {
            const blkData = blockObjs[b];
            if (typeof blkData[1] === "number") {
                playbackQueueStartsHere = b;
                break;
            }
        }

        if (playbackQueueStartsHere !== null) {
            console.debug("Removing deprecated playback queue from project");
            blockObjs.splice(playbackQueueStartsHere, blockObjs.length - playbackQueueStartsHere);
        }

        for (let b = 0; b < blockObjs.length; b++) {
            const blkData = blockObjs[b];

            for (const c in blkData[4]) {
                if (blkData[4][c] === blkData[0]) {
                    console.debug("Circular connection in block data: " + blkData);
                    console.debug("Punting loading of new blocks!");
                    console.debug(blockObjs);
                    return;
                }
            }
        }

        const currentActionNames = [];
        const currentStoreinNames = [];
        for (let b = 0; b < blocks.blockList.length; b++) {
            if (blocks.blockList[b].trash) {
                continue;
            }

            if (blocks.blockList[b].name === "action") {
                if (blocks.blockList[b].connections[1] !== null) {
                    currentActionNames.push(
                        blocks.blockList[blocks.blockList[b].connections[1]].value
                    );
                }
            } else if (blocks.blockList[b].name === "storein") {
                if (blocks.blockList[b].connections[1] !== null) {
                    currentStoreinNames.push(
                        blocks.blockList[blocks.blockList[b].connections[1]].value
                    );
                }
            }
        }

        blocks._checkTwoArgBlocks = [];
        blocks._checkArgClampBlocks = [];

        const stringValues = {};
        const actionNames = {};
        const storeinNames = {};
        const doNames = {};

        blocks.blocksToCollapse = [];

        let name;
        for (let b = 0; b < blockObjs.length; b++) {
            const blkData = blockObjs[b];
            if (typeof blkData[1] === "string") {
                name = blkData[1];
            } else {
                name = blkData[1][0];
            }

            if (!(name in blocks.protoBlockDict)) {
                switch (name) {
                    case "hat":
                        name = "action";
                        break;
                    case "string":
                        name = "text";
                        break;
                    default:
                        console.debug("skipping " + name);
                        continue;
                }
            }

            if (["arg", "twoarg"].includes(blocks.protoBlockDict[name].style)) {
                if (blocks.protoBlockDict[name].expandable) {
                    blocks._checkTwoArgBlocks.push(blocks.blockList.length + b);
                }
            }

            if (
                ["clamp", "argclamp", "argclamparg", "doubleclamp", "argflowclamp"].includes(
                    blocks.protoBlockDict[name].style
                )
            ) {
                blocks._checkArgClampBlocks.push(blocks.blockList.length + b);
            }

            let key;
            switch (name) {
                case "text":
                    key = blkData[1][1];
                    if (stringValues[key] === undefined) {
                        stringValues[key] = [];
                    }
                    stringValues[key].push(b);
                    break;
                case "action":
                case "hat":
                    if (blkData[4][1] !== null) {
                        actionNames[b] = blkData[4][1];
                    }
                    break;
                case "storein":
                    if (blkData[4][1] !== null) {
                        storeinNames[b] = blkData[4][1];
                    }
                    break;
                case "nameddo":
                case "namedcalc":
                case "nameddoArg":
                case "namedcalcArg":
                    doNames[b] = blkData[1][1]["value"];
                    break;
                case "do":
                case "stack":
                    if (blkData[4][1] !== null) {
                        doNames[b] = blkData[4][1];
                    }
                    break;
                default:
                    break;
            }

            if (COLLAPSIBLES.includes(name)) {
                if (
                    typeof blkData[1] === "object" &&
                    blkData[1].length > 1 &&
                    typeof blkData[1][1] === "object" &&
                    "collapsed" in blkData[1][1]
                ) {
                    if (blkData[1][1]["collapsed"]) {
                        blocks.blocksToCollapse.push(blocks.blockList.length + b);
                    }
                }
            }
        }

        let updatePalettes = false;
        for (const b in storeinNames) {
            const blkData = blockObjs[storeinNames[b]];
            if (!currentStoreinNames.includes(blkData[1][1])) {
                if (typeof blkData[1][1] === "string") {
                    name = blkData[1][1];
                } else {
                    name = blkData[1][1]["value"];
                }

                blocks.newStorein2Block(name);
                blocks.newNamedboxBlock(name);
                updatePalettes = true;
            }
        }

        for (const b in actionNames) {
            const blkData = blockObjs[actionNames[b]];
            if (typeof blkData[1][1] === "string") {
                name = blkData[1][1];
            } else {
                name = blkData[1][1]["value"];
            }

            if (name === _("action")) {
                blocks.setActionProtoVisibility(true);
            }

            const oldName = name;
            let i = 1;
            while (currentActionNames.includes(name)) {
                name = oldName + i.toString();
                i += 1;
                if (i > blocks.blockList.length) {
                    console.debug("Could not generate unique action name.");
                    break;
                }
            }

            currentActionNames.push(name);

            if (oldName !== name) {
                console.debug("action " + oldName + " is being renamed " + name);
                blkData[1][1] = { value: name };
            }

            let blkName;
            for (const d in doNames) {
                const thisBlkData = blockObjs[d];
                if (typeof thisBlkData[1] === "string") {
                    blkName = thisBlkData[1];
                } else {
                    blkName = thisBlkData[1][0];
                }

                if (["nameddo", "namedcalc", "nameddoArg", "namedcalcArg"].includes(blkName)) {
                    if (thisBlkData[1][1]["value"] === oldName) {
                        thisBlkData[1][1] = { value: name };
                    }
                } else {
                    const doBlkData = blockObjs[doNames[d]];
                    if (typeof doBlkData[1][1] === "string") {
                        if (doBlkData[1][1] === oldName) {
                            doBlkData[1][1] = name;
                        }
                    } else {
                        if (doBlkData[1][1]["value"] === oldName) {
                            doBlkData[1][1] = { value: name };
                        }
                    }
                }
            }
        }

        if (updatePalettes) {
            blocks.activity.palettes.updatePalettes("action");
        }

        const blockObjsLength = blockObjs.length;
        let extraBlocksLength = 0;
        let len;

        for (let b = 0; b < blockObjsLength; b++) {
            if (typeof blockObjs[b][1] === "object") {
                name = blockObjs[b][1][0];
            } else {
                name = blockObjs[b][1];
            }

            switch (name) {
                case "arpeggio":
                case "articulation":
                case "backward":
                case "crescendo":
                case "drift":
                case "duplicatenotes":
                case "interval":
                case "invert1":
                case "fill":
                case "flat":
                case "hollowline":
                case "multiplybeatfactor":
                case "note":
                case "newnote":
                case "newslur":
                case "newstaccato":
                case "newswing":
                case "newswing2":
                case "osctime":
                case "pluck":
                case "ratiointerval":
                case "rhythmicdot":
                case "semitoneinterval":
                case "setbpm":
                case "setnotevolume2":
                case "setratio":
                case "setscalartransposition":
                case "settransposition":
                case "setvoice":
                case "sharp":
                case "skipnotes":
                case "slur":
                case "staccato":
                case "swing":
                case "tie":
                case "tuplet2":
                case "vibrato":
                    len = blockObjs[b][4].length;
                    if (last(blockObjs[b][4]) === null) {
                        console.debug(
                            "last connection of " + name + " is null: adding hidden block"
                        );

                        console.debug(blockObjs[b][4]);
                        blockObjs[b][4][len - 1] = blockObjsLength + extraBlocksLength;
                        blockObjs.push([
                            blockObjsLength + extraBlocksLength,
                            "hidden",
                            0,
                            0,
                            [b, null]
                        ]);
                        extraBlocksLength += 1;
                    } else {
                        const nextBlock = blockObjs[b][4][len - 1];
                        let nextName;
                        if (typeof blockObjs[nextBlock][1] === "object") {
                            nextName = blockObjs[nextBlock][1][0];
                        } else {
                            nextName = blockObjs[nextBlock][1];
                        }

                        if (nextName !== "hidden") {
                            console.debug(
                                "last connection of " +
                                    name +
                                    " is " +
                                    nextName +
                                    ": adding hidden block"
                            );
                            blockObjs[b][4][len - 1] = blockObjsLength + extraBlocksLength;
                            blockObjs[nextBlock][4][0] = blockObjsLength + extraBlocksLength;
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "hidden",
                                0,
                                0,
                                [b, nextBlock]
                            ]);
                            extraBlocksLength += 1;
                        }
                    }

                    if (["note", "slur", "staccato", "swing"].includes(name)) {
                        const clampBlock = blockObjs[b][4][2];
                        blockObjs[b][4][2] = blockObjsLength + extraBlocksLength;
                        if (clampBlock === null) {
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "vspace",
                                0,
                                0,
                                [b, null]
                            ]);
                        } else {
                            blockObjs[clampBlock][4][0] = blockObjsLength + extraBlocksLength;
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "vspace",
                                0,
                                0,
                                [b, clampBlock]
                            ]);
                        }

                        extraBlocksLength += 1;

                        const argBlock = blockObjs[b][4][1];
                        blockObjs[b][4][1] = blockObjsLength + extraBlocksLength;
                        if (argBlock === null) {
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "divide",
                                0,
                                0,
                                [
                                    b,
                                    blockObjsLength + extraBlocksLength + 1,
                                    blockObjsLength + extraBlocksLength + 2
                                ]
                            ]);
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength + 1,
                                ["number", { value: 1 }],
                                0,
                                0,
                                [blockObjsLength + extraBlocksLength]
                            ]);
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength + 2,
                                ["number", { value: 1 }],
                                0,
                                0,
                                [blockObjsLength + extraBlocksLength]
                            ]);
                            extraBlocksLength += 3;
                        } else {
                            blockObjs[argBlock][4][0] = blockObjsLength + extraBlocksLength;
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "divide",
                                0,
                                0,
                                [b, blockObjsLength + extraBlocksLength + 1, argBlock]
                            ]);
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength + 1,
                                ["number", { value: 1 }],
                                0,
                                0,
                                [blockObjsLength + extraBlocksLength]
                            ]);
                            extraBlocksLength += 2;
                        }

                        if (typeof blockObjs[b][1] === "object") {
                            blockObjs[b][1][0] = "new" + name;
                        } else {
                            blockObjs[b][1] = "new" + name;
                        }
                    }
                    break;
                case "action":
                    len = blockObjs[b][4].length;
                    if (blockObjs[b][4][2] === null) {
                        console.debug(
                            "last connection of " + name + " is null: adding hidden block"
                        );
                        blockObjs[b][4][2] = blockObjsLength + extraBlocksLength;
                        blockObjs.push([
                            blockObjsLength + extraBlocksLength,
                            "hidden",
                            0,
                            0,
                            [b, null]
                        ]);
                        extraBlocksLength += 1;
                    } else {
                        const nextBlock = blockObjs[b][4][2];
                        let nextName;
                        if (typeof blockObjs[nextBlock][1] === "object") {
                            nextName = blockObjs[nextBlock][1][0];
                        } else {
                            nextName = blockObjs[nextBlock][1];
                        }

                        if (nextName !== "hidden") {
                            console.debug(
                                "last connection of " +
                                    name +
                                    " is " +
                                    nextName +
                                    ": adding hidden block"
                            );
                            blockObjs[b][4][2] = blockObjsLength + extraBlocksLength;
                            blockObjs[nextBlock][4][0] = blockObjsLength + extraBlocksLength;
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "hidden",
                                0,
                                0,
                                [b, nextBlock]
                            ]);
                            extraBlocksLength += 1;
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        blocks._adjustTheseStacks = [];
        blocks._adjustTheseDocks = [];
        blocks._loadCounter = blockObjs.length;

        if (blocks.activity && blocks.activity.logo && blocks.activity.logo.synth) {
            blocks.activity.logo.synth.preloadProjectSamples(blockObjs);
        }

        const blockOffset = blocks.blockList.length;
        const firstBlock = blocks.blockList.length;

        const CHUNK_SIZE = 20;
        const totalBlocks = blocks._loadCounter;
        let bIndex = 0;

        const processChunk = () => {
            const chunkEnd = Math.min(bIndex + CHUNK_SIZE, totalBlocks);
            for (let b = bIndex; b < chunkEnd; b++) {
                blocks._processOneBlock(b, blockObjs, blockOffset, firstBlock);
            }

            bIndex = chunkEnd;
            if (bIndex < totalBlocks) {
                setTimeout(processChunk, 0);
            }
        };

        processChunk();
    }

    /**
     * Process a single block during project load.
     * @param {number} b - The block object index.
     * @param {Array} blockObjs - Project block objects.
     * @param {number} blockOffset - Destination block offset.
     * @param {number} firstBlock - First appended block index.
     * @returns {void}
     */
    processOneBlock(b, blockObjs, blockOffset, firstBlock) {
        const blocks = this.blocks;
        const thisBlock = blockOffset + b;
        const blkData = blockObjs[b];
        let blkInfo;

        if (typeof blkData[1] === "object") {
            if (blkData[1].length === 1) {
                blkInfo = [blkData[1][0], { value: null }];
            } else if (["number", "string"].includes(typeof blkData[1][1])) {
                blkInfo = [blkData[1][0], { value: blkData[1][1] }];
                if (COLLAPSIBLES.includes(blkData[1][0])) {
                    blkInfo[1]["collapsed"] = false;
                }
            } else {
                blkInfo = blkData[1];
            }
        } else {
            blkInfo = [blkData[1], { value: null }];
            if (COLLAPSIBLES.includes(blkData[1])) {
                blkInfo[1]["collapsed"] = false;
            }
        }

        let name = blkInfo[0];
        let value;
        let text;
        if (blkInfo[1] === null) {
            value = null;
            text = "";
        } else {
            value = blkInfo[1]["value"];
            text = blkInfo[1]["text"];
            if (text === null) {
                text = "";
            }
        }

        if (name in BACKWARDCOMPATIBILITYDICT) {
            name = BACKWARDCOMPATIBILITYDICT[name];
        }

        const that = blocks;

        if (blocks.findBlockInstance("temperament1")) {
            blocks.customTemperamentDefined = true;
        }

        let postProcess;
        switch (name) {
            case "start":
                blkData[4][0] = null;
                blkData[4][2] = null;
                postProcess = args => {
                    const thisBlock = args[0];
                    const blkInfo = args[1];
                    that.blockList[thisBlock].value = that.turtles.getTurtleCount();
                    that.turtles.addTurtle(that.blockList[thisBlock], blkInfo);
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    blkInfo[1]
                ]);
                break;
            case "action":
            case "hat":
                blkData[4][0] = null;
                blkData[4][3] = null;
                blocks._makeNewBlockWithConnections("action", blockOffset, blkData[4], null, null);
                break;
            case "temperament1":
                postProcess = args => {
                    const value = args[1];
                    let customName = "custom";
                    if (value.customName !== undefined) {
                        customName = value.customName;
                    }
                    if (value.customTemperamentNotes !== undefined) {
                        deleteTemperamentFromList(customName);
                        addTemperamentToDictionary(customName, value.customTemperamentNotes);
                        updateTemperaments();
                    }
                    if (value.startingPitch !== undefined) {
                        that.activity.logo.synth.startingPitch = value.startingPitch;
                    }
                    if (value.octaveSpace !== undefined) {
                        setOctaveRatio(value.octaveSpace);
                    }
                    that.activity.logo.customTemperamentDefined = true;
                    that.protoBlockDict["custompitch"].hidden = false;
                    that.activity.palettes.updatePalettes("pitch");
                };
                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    blkInfo[1]
                ]);
                break;
            case "storein2":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].value = null;
                    if (value === "box1") {
                        that.blockList[thisBlock].overrideName = _("box1");
                    } else if (value === "box2") {
                        that.blockList[thisBlock].overrideName = _("box2");
                    } else {
                        that.blockList[thisBlock].overrideName = value;
                    }
                    that.blockList[thisBlock].regenerateArtwork();
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);
                break;
            case "namedbox":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].privateData = value;

                    if (value === "box1") {
                        that.blockList[thisBlock].overrideName = _("box1");
                    } else if (value === "box2") {
                        that.blockList[thisBlock].overrideName = _("box2");
                    } else {
                        that.blockList[thisBlock].overrideName = value;
                    }

                    that.blockList[thisBlock].value = null;
                    that.blockList[thisBlock].regenerateArtwork();
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);
                break;
            case "namedarg":
            case "namedcalc":
            case "nameddo":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].value = null;
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);
                break;
            case "doArg":
                postProcess = args => {
                    const thisBlock = args[0];
                    const extraSlots = args[1].length - 4;
                    if (extraSlots > 0) {
                        const slotList = that.blockList[thisBlock].argClampSlots;
                        for (let i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            that._newLocalArgBlock(slotList.length);
                            that.blockList[thisBlock].connections.push(null);
                        }
                        that.blockList[thisBlock].updateArgSlots(slotList);
                        for (let i = 0; i < args[1].length; i++) {
                            if (args[1][i] !== null) {
                                that.blockList[thisBlock].connections[i] = args[1][i] + firstBlock;
                            } else {
                                that.blockList[thisBlock].connections[i] = args[1][i];
                            }
                        }
                    }
                    that._checkArgClampBlocks.push(thisBlock);
                };

                blocks._makeNewBlockWithConnections("doArg", blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    blkData[4]
                ]);
                break;
            case "nameddoArg":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].value = null;
                    const extraSlots = args[2].length - 3;
                    if (extraSlots > 0) {
                        const slotList = that.blockList[thisBlock].argClampSlots;
                        for (let i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            that._newLocalArgBlock(slotList.length);
                            that.blockList[thisBlock].connections.push(null);
                        }
                        that.blockList[thisBlock].updateArgSlots(slotList);
                        for (let i = 0; i < args[2].length; i++) {
                            if (args[2][i] !== null) {
                                that.blockList[thisBlock].connections[i] = args[2][i] + firstBlock;
                            } else {
                                that.blockList[thisBlock].connections[i] = args[2][i];
                            }
                        }
                    }
                    that._checkArgClampBlocks.push(thisBlock);
                };

                blocks._makeNewBlockWithConnections(
                    "nameddoArg",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    [thisBlock, value, blkData[4]]
                );
                break;
            case "calcArg":
                postProcess = args => {
                    const thisBlock = args[0];
                    const extraSlots = args[1].length - 3;
                    if (extraSlots > 0) {
                        const slotList = that.blockList[thisBlock].argClampSlots;
                        for (let i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            that._newLocalArgBlock(slotList.length);
                            that.blockList[thisBlock].connections.push(null);
                        }
                        that.blockList[thisBlock].updateArgSlots(slotList);
                        for (let i = 0; i < args[1].length; i++) {
                            if (args[1][i] !== null) {
                                that.blockList[thisBlock].connections[i] = args[1][i] + firstBlock;
                            } else {
                                that.blockList[thisBlock].connections[i] = args[1][i];
                            }
                        }
                    }
                    that._checkArgClampBlocks.push(thisBlock);
                };

                blocks._makeNewBlockWithConnections(
                    "calcArg",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    [thisBlock, blkData[4]]
                );
                break;
            case "namedcalcArg":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].value = null;
                    const extraSlots = args[2].length - 2;
                    if (extraSlots > 0) {
                        const slotList = that.blockList[thisBlock].argClampSlots;
                        for (let i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            that._newLocalArgBlock(slotList.length);
                            that.blockList[thisBlock].connections.push(null);
                        }
                        that.blockList[thisBlock].updateArgSlots(slotList);
                        for (let i = 0; i < args[2].length; i++) {
                            if (args[2][i] !== null) {
                                that.blockList[thisBlock].connections[i] = args[2][i] + firstBlock;
                            } else {
                                that.blockList[thisBlock].connections[i] = args[2][i];
                            }
                        }
                    }
                    that._checkArgClampBlocks.push(thisBlock);
                };

                blocks._makeNewBlockWithConnections(
                    "namedcalcArg",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    [thisBlock, value, blkData[4]]
                );
                break;
            case "makeblock":
                postProcess = args => {
                    const thisBlock = args[0];
                    const extraSlots = args[1].length - 3;
                    if (extraSlots > 0) {
                        const slotList = that.blockList[thisBlock].argClampSlots;
                        for (let i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            that.blockList[thisBlock].connections.push(null);
                        }
                        that.blockList[thisBlock].updateArgSlots(slotList);
                        for (let i = 0; i < args[1].length; i++) {
                            if (args[1][i] !== null) {
                                that.blockList[thisBlock].connections[i] = args[1][i] + firstBlock;
                            } else {
                                that.blockList[thisBlock].connections[i] = args[1][i];
                            }
                        }
                    }
                    that._checkArgClampBlocks.push(thisBlock);
                };

                blocks._makeNewBlockWithConnections(
                    "makeblock",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    [thisBlock, blkData[4]]
                );
                break;
            case "number":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].value = Number(value);
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);
                break;
            case "outputtools":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].overrideName = value;
                };

                blocks._makeNewBlockWithConnections(
                    "outputtools",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    [thisBlock, blockObjs[b][1][1].value]
                );
                break;
            case "text":
            case "solfege":
            case "scaledegree2":
            case "customNote":
            case "eastindiansolfege":
            case "notename":
            case "modename":
            case "chordname":
            case "temperamentname":
            case "invertmode":
            case "filtertype":
            case "oscillatortype":
            case "accidentalname":
            case "intervalname":
            case "grid":
            case "boolean":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);
                break;
            case "drumname":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);

                if (value === null) value = DEFAULTDRUM;
                that.activity.logo.synth.loadSynth(0, getDrumSynthName(value));
                break;
            case "effectsname":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);

                if (value === null) value = DEFAULTEFFECT;
                that.activity.logo.synth.loadSynth(0, getDrumSynthName(value));
                break;
            case "voicename":
                postProcess = args => {
                    const thisBlock = args[0];
                    let value = args[1];
                    if (["simple 1", "simple 2", "simple 3", "simple 4"].includes(value)) {
                        value = "sine";
                    }

                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);

                try {
                    if (value === null) {
                        value = DEFAULTVOICE;
                    }
                    blocks.activity.logo.synth.loadSynth(0, getVoiceSynthName(value));
                } catch (e) {
                    console.debug(e);
                }
                break;
            case "noisename":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);

                try {
                    if (value === null) {
                        value = DEFAULTNOISE;
                    }
                    blocks.activity.logo.synth.loadSynth(0, getNoiseSynthName(value));
                } catch (e) {
                    console.debug(e);
                }
                break;
            case "loudness":
            case "pitchness":
                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], null, []);
                blocks.activity.logo.initMediaDevices();
                break;
            case "media":
                postProcess = args => {
                    const thisBlock = args[0];
                    const value = args[1];
                    that.blockList[thisBlock].value = value;
                    if (value !== null) {
                        that.blockList[thisBlock].loadThumbnail(null);
                    }
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);
                break;
            case "camera":
                postProcess = args => {
                    const thisBlock = args[0];
                    that.blockList[thisBlock].value = BLOCK_SERIALIZER_CAMERA_VALUE;
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);
                break;
            case "video":
                postProcess = args => {
                    const thisBlock = args[0];
                    that.blockList[thisBlock].value = BLOCK_SERIALIZER_VIDEO_VALUE;
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);
                break;
            case "red":
            case "black":
                postProcess = thisBlock => {
                    that.blockList[thisBlock].value = 0;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(
                    "number",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    thisBlock
                );
                break;
            case "white":
                postProcess = thisBlock => {
                    that.blockList[thisBlock].value = 100;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(
                    "number",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    thisBlock
                );
                break;
            case "orange":
                postProcess = thisBlock => {
                    that.blockList[thisBlock].value = 10;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(
                    "number",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    thisBlock
                );
                break;
            case "yellow":
                postProcess = thisBlock => {
                    that.blockList[thisBlock].value = 20;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(
                    "number",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    thisBlock
                );
                break;
            case "green":
                postProcess = thisBlock => {
                    that.blockList[thisBlock].value = 40;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(
                    "number",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    thisBlock
                );
                break;
            case "blue":
                postProcess = thisBlock => {
                    that.blockList[thisBlock].value = 70;
                    that.updateBlockText(thisBlock);
                };

                blocks._makeNewBlockWithConnections(
                    "number",
                    blockOffset,
                    blkData[4],
                    postProcess,
                    thisBlock
                );
                break;
            case "loadFile":
            case "wrapmode":
            case "audiofile":
                postProcess = args => {
                    that.blockList[args[0]].value = args[1];
                    that.updateBlockText(args[0]);
                };

                blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [
                    thisBlock,
                    value
                ]);
                break;
            default:
                if (!(name in blocks.protoBlockDict) || blocks.protoBlockDict[name] === null) {
                    const postProcessUnknownBlock = args => {
                        that.blockList[args[0]].privateData = args[1];
                    };

                    let newName = name;
                    const n = blkData[4].length;
                    let flowBlock = true;
                    const c = blkData[4][0];
                    if (c !== null) {
                        const cc = blockObjs[c][4].indexOf(b);
                        if (typeof blockObjs[c][1] === "string") {
                            if (blocks.protoBlockDict[blockObjs[c][1]] !== undefined) {
                                if (blocks.protoBlockDict[blockObjs[c][1]].dockTypes[cc] !== "in") {
                                    flowBlock = false;
                                }
                            }
                        } else {
                            if (blocks.protoBlockDict[blockObjs[c][1][0]] !== undefined) {
                                if (
                                    blocks.protoBlockDict[blockObjs[c][1][0]].dockTypes[cc] !== "in"
                                ) {
                                    flowBlock = false;
                                }
                            }
                        }
                    } else {
                        const c = last(blkData[4]);
                        if (c !== null) {
                            const cc = blockObjs[c][4].indexOf(b);
                            if (typeof blockObjs[c][1] === "string") {
                                if (blocks.protoBlockDict[blockObjs[c][1]] !== undefined) {
                                    if (
                                        blocks.protoBlockDict[blockObjs[c][1]].dockTypes[cc] !==
                                        "out"
                                    ) {
                                        flowBlock = false;
                                    }
                                } else {
                                    if (blocks.protoBlockDict[blockObjs[c][1][0]] !== undefined) {
                                        if (
                                            blocks.protoBlockDict[blockObjs[c][1][0]].dockTypes[
                                                cc
                                            ] !== "out"
                                        ) {
                                            flowBlock = false;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (flowBlock) {
                        console.debug(n + ": substituting nop flow block for " + name);
                    } else {
                        console.debug(n + ": substituting nop arg block for " + name);
                    }

                    switch (n) {
                        case 1:
                            newName = "nopValueBlock";
                            break;
                        case 2:
                            if (flowBlock) {
                                newName = "nopZeroArgBlock";
                            } else {
                                newName = "nopOneArgMathBlock";
                            }
                            break;
                        case 3:
                            if (flowBlock) {
                                newName = "nopOneArgBlock";
                            } else {
                                newName = "nopTwoArgMathBlock";
                            }
                            break;
                        case 4:
                            newName = "nopTwoArgBlock";
                            break;
                        case 5:
                        default:
                            if (n > 5) {
                                console.debug("WARNING: arg count exceed.");
                            }
                            newName = "nopThreeArgBlock";
                            break;
                    }

                    blocks._makeNewBlockWithConnections(
                        newName,
                        blockOffset,
                        blkData[4],
                        postProcessUnknownBlock,
                        [thisBlock, name]
                    );
                } else {
                    blocks._makeNewBlockWithConnections(name, blockOffset, blkData[4], null);
                }
                break;
        }

        if (thisBlock === blocks.blockList.length - 1) {
            if (blocks.blockList[thisBlock].connections[0] === null) {
                blocks.blockList[thisBlock].container.x = blkData[2];
                blocks.blockList[thisBlock].container.y = blkData[3];
                blocks._adjustTheseDocks.push(thisBlock);
                if (blkData[4][0] === null) {
                    blocks._adjustTheseStacks.push(thisBlock);
                }
                if (
                    blkData[2] < 0 ||
                    blkData[3] < 0 ||
                    blkData[2] > blocks.activity.canvas.width ||
                    blkData[3] > blocks.activity.canvas.height
                ) {
                    blocks.activity.setHomeContainers(true);
                }
            }
        }
    }

    /**
     * If all the blocks are loaded, make the final adjustments.
     * @returns {Promise<void>}
     */
    async cleanupAfterLoad() {
        const blocks = this.blocks;

        blocks._loadCounter -= 1;
        if (blocks._loadCounter > 0) {
            return;
        }

        blocks._findDrumURLs();
        blocks.updateBlockPositions();
        this.cleanupStacks();

        for (let i = 0; i < blocks.blocksToCollapse.length; i++) {
            blocks.blockList[blocks.blocksToCollapse[i]].collapseToggle();
        }

        blocks.blocksToCollapse = [];
        blocks.activity.refreshCanvas();

        let updatePalettes = false;
        for (const blk in blocks.blockList) {
            if (!blocks.blockList[blk].trash && blocks.blockList[blk].name === "action") {
                const myBlock = blocks.blockList[blk];
                const c = myBlock.connections[1];
                if (c !== null && blocks.blockList[c].value !== _("action")) {
                    const metadata = this.actionMetadata(blk);
                    if (
                        blocks.newNameddoBlock(
                            blocks.blockList[c].value,
                            metadata.hasReturn,
                            metadata.hasArgs
                        )
                    ) {
                        updatePalettes = true;
                    }
                }
            }
        }

        if (updatePalettes) {
            blocks.activity.palettes.updatePalettes("action");
        }

        updatePalettes = false;
        for (const blk in blocks.blockList) {
            if (!blocks.blockList[blk].trash && blocks.blockList[blk].name === "storein") {
                const myBlock = blocks.blockList[blk];
                const c = myBlock.connections[1];
                if (c !== null && blocks.blockList[c].value !== _("box")) {
                    const name = blocks.blockList[c].value;
                    if (name !== null) {
                        if (
                            blocks.protoBlockDict["myStorein_" + name] === undefined ||
                            blocks.protoBlockDict["yourStorein2_" + name] === undefined
                        ) {
                            blocks.newStorein2Block(blocks.blockList[c].value);
                            blocks.newNamedboxBlock(blocks.blockList[c].value);
                            updatePalettes = true;
                        }
                    }
                }
            }
        }

        document.body.style.cursor = "default";
        document.getElementById("load-container").style.display = "none";
        if (blocks.activity.stopLoadAnimation) {
            blocks.activity.stopLoadAnimation();
        }

        const myCustomEvent = new Event("finishedLoading");
        document.dispatchEvent(myCustomEvent);
    }

    /**
     * Cleanup the stacks after load.
     * @returns {void}
     */
    cleanupStacks() {
        const blocks = this.blocks;
        let blocksToCheck = [];

        for (let b = 0; b < blocks._checkArgClampBlocks.length; b++) {
            const bb = blocks._checkArgClampBlocks[b];
            blocksToCheck.push([bb, blocks._getNestingDepth(bb), "1arg"]);
        }

        for (let b = 0; b < blocks._checkTwoArgBlocks.length; b++) {
            const bb = blocks._checkTwoArgBlocks[b];
            blocksToCheck.push([bb, blocks._getNestingDepth(bb), "2arg"]);
        }

        blocksToCheck = blocksToCheck.sort((a, b) => {
            return a[1] - b[1];
        });

        blocksToCheck = blocksToCheck.reverse();

        for (let i = 0; i < blocksToCheck.length; i++) {
            if (blocksToCheck[i][2] === "1arg") {
                blocks._adjustArgClampBlock([blocksToCheck[i][0]]);
            } else {
                blocks._adjustExpandableTwoArgBlock([blocksToCheck[i][0]]);
            }
        }

        for (let blk = 0; blk < blocks._adjustTheseDocks.length; blk++) {
            blocks.adjustDocks(blocks._adjustTheseDocks[blk], true);
            blocks._expandClamps();
        }

        for (let blk = 0; blk < blocks._adjustTheseStacks.length; blk++) {
            blocks.raiseStackToTop(blocks._adjustTheseStacks[blk]);
        }
    }

    /**
     * Look for Return and Arg blocks in an action stack.
     * @param {*} blk - Block id.
     * @returns {{ hasReturn: boolean, hasArgs: boolean }}
     */
    actionMetadata(blk) {
        const blocks = this.blocks;

        if (blocks.blockList[blk].name !== "action") {
            return { hasReturn: false, hasArgs: false };
        }

        blocks.findDragGroup(blk);
        let hasReturn = false;
        let hasArgs = false;
        for (let b = 0; b < blocks.dragGroup.length; b++) {
            const name = blocks.blockList[blocks.dragGroup[b]].name;
            if (name === "return") {
                hasReturn = true;
            } else if (name === "arg" || name === "namedarg") {
                hasArgs = true;
            }

            if (hasReturn && hasArgs) {
                break;
            }
        }

        return { hasReturn, hasArgs };
    }

    /**
     * @param {*} blk - Block id.
     * @returns {boolean}
     */
    actionHasReturn(blk) {
        return this.actionMetadata(blk).hasReturn;
    }

    /**
     * @param {*} blk - Block id.
     * @returns {boolean}
     */
    actionHasArgs(blk) {
        return this.actionMetadata(blk).hasArgs;
    }
}

if (typeof globalThis !== "undefined") {
    globalThis.BlockSerializer = BlockSerializer;
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return BlockSerializer;
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = BlockSerializer;
}
