// Copyright (c) 2019 Bottersnike
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
   global

   _, LeftBlock, FlowBlock, NOINPUTERRORMSG, getTargetTurtle, Turtle
 */

/* exported setupProgramBlocks */

let setupProgramBlocks = (activity) => {
    class LoadHeapFromAppBlock extends FlowBlock {
        constructor() {
            super("loadHeapFromApp");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Load-heap-from-app block loads the heap from a web page."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: load the heap contents from a URL
                name: _("load heap from App"),
                args: 2,
                argTypes: ["textin", "textin"],
                defaults: ["appName", "localhost"]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let data = [];
            const url = args[1];
            const name = args[0];
            const xmlHttp = new XMLHttpRequest();
            let oldHeap = [];
            xmlHttp.open("GET", url, false);
            xmlHttp.send();
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                // eslint-disable-next-line no-console
                console.debug(xmlHttp.responseText);
                try {
                    data = JSON.parse(xmlHttp.responseText);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.debug(e);
                    activity.errorMsg(_("Error parsing JSON data:") + e);
                }
            } else if (xmlHttp.readyState === 4 && xmlHttp.status !== 200) {
                // eslint-disable-next-line no-console
                console.debug("fetched the wrong page or network error...");
                activity.errorMsg(_("404: Page not found"));
                return;
            } else {
                activity.errorMsg("xmlHttp.readyState: " + xmlHttp.readyState);
                return;
            }
            if (name in logo.turtleHeaps) {
                oldHeap = logo.turtleHeaps[turtle];
            }
            try {
                logo.turtleHeaps[name] = data;
            } catch (e) {
                logo.turtleHeaps[name] = oldHeap;
                // eslint-disable-next-line no-console
                console.debug(e);
            }
        }
    }

    class SaveHeapToAppBlock extends FlowBlock {
        constructor() {
            super("saveHeapToApp");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Save-heap-to-app block saves the heap to a web page."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: save the heap contents to a URL
                name: _("save heap to App"),
                args: 2,
                argTypes: ["textin", "textin"],
                defaults: ["appName", "localhost"]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const name = args[0];
            const url = args[1];
            if (name in logo.turtleHeaps) {
                const data = JSON.stringify(logo.turtleHeaps[name]);
                const xmlHttp = new XMLHttpRequest();
                xmlHttp.open("POST", url, true);
                xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xmlHttp.send(data);
            } else {
                activity.errorMsg(_("Cannot find a valid heap for") + " " + name);
            }
        }
    }

    class LoadHeapBlock extends FlowBlock {
        constructor() {
            super("loadHeap");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Load-heap block loads the heap from a file."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: load the heap from a file
                name: _("load heap"),
                args: 1,
                argTypes: ["filein"],
                defaults: [[null, null]]
            });
        }

        flow(args, logo, turtle, blk) {
            const block = activity.blocks.blockList[blk];
            let oldHeap;
            if (turtle in logo.turtleHeaps) {
                oldHeap = logo.turtleHeaps[turtle];
            } else {
                oldHeap = [];
            }

            const c = block.connections[1];
            if (c != null && activity.blocks.blockList[c].name === "loadFile") {
                if (args.length !== 1) {
                    activity.errorMsg(_("You must select a file."));
                } else {
                    try {
                        logo.turtleHeaps[turtle] = JSON.parse(
                            activity.blocks.blockList[c].value[1]
                        );
                        if (!Array.isArray(logo.turtleHeaps[turtle])) {
                            throw "is not array";
                        }
                    } catch (e) {
                        logo.turtleHeaps[turtle] = oldHeap;
                        activity.errorMsg(
                            _("The file you selected does not contain a valid heap.")
                        );
                    }
                }
            } else {
                activity.errorMsg(_("The loadHeap block needs a loadFile block."));
            }
        }
    }

    class SetHeapBlock extends FlowBlock {
        constructor() {
            super("setHeap");
            this.setPalette("program", activity);
            this.setHelpString([_("The Set-heap block loads the heap."), "documentation", ""]);

            this.formBlock({
                //.TRANS: load the heap from a JSON encoding
                name: _("set heap"),
                args: 1,
                argTypes: ["anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            const block = activity.blocks.blockList[blk];
            let oldHeap;
            if (turtle in logo.turtleHeaps) {
                oldHeap = logo.turtleHeaps[turtle];
            } else {
                oldHeap = [];
            }

            const c = block.connections[1];
            if (c !== null) {
                try {
                    logo.turtleHeaps[turtle] = JSON.parse(activity.blocks.blockList[c].value);
                    if (!Array.isArray(logo.turtleHeaps[turtle])) {
                        throw "is not array";
                    }
                } catch (e) {
                    logo.turtleHeaps[turtle] = oldHeap;
                    activity.errorMsg(_("The block you selected does not contain a valid heap."));
                }
            } else {
                activity.errorMsg(_("The Set heap block needs a heap."));
            }
        }
    }

    class LoadDictBlock extends FlowBlock {
        constructor() {
            super("loadDict");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Load-dictionary block loads a dictionary from a file."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: load a dictionary from a file
                name: _("load dictionary"),
                args: 2,
                argTypes: ["textin", "filein"],
                argLabels: [_("name"), _("file")],
                defaults: [_("My Dictionary"), [null, null]]
            });
        }

        flow(args, logo, turtle, blk) {
            const block = activity.blocks.blockList[blk];
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            if (args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const a = args[0];
            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                logo.turtleDicts[turtle] = {};
            }

            const c = block.connections[2];
            if (c != null && activity.blocks.blockList[c].name === "loadFile") {
                if (args.length !== 2) {
                    activity.errorMsg(_("You must select a file."));
                } else {
                    try {
                        const d = JSON.parse(activity.blocks.blockList[c].value[1]);
                        // Is the dictionary the same as a turtle name?
                        const target = getTargetTurtle(activity.turtles, a);
                        if (target !== null) {
                            // Copy any internal entries now.
                            const k = Object.keys(d);
                            for (let i = 0; i < k.length; i++) {
                                Turtle.DictActions.setDictValue(target, turtle, k[i], d[k[i]]);
                            }
                        } else if (!(a in logo.turtleDicts[turtle])) {
                            logo.turtleDicts[turtle][a] = {};
                        }
                    } catch (e) {
                        activity.errorMsg(
                            _("The file you selected does not contain a valid dictionary.")
                        );
                    }
                }
            } else {
                activity.errorMsg(_("The load dictionary block needs a load file block."));
            }
        }
    }

    class SetDictBlock extends FlowBlock {
        constructor() {
            super("setDictionary");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Set-dictionary block loads a dictionary."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: load a dictionary from a JSON encoding
                name: _("set dictionary"),
                args: 2,
                argTypes: ["textin", "anyin"],
                argLabels: [_("name"), _("dictionary")],
                defaults: [_("My Dictionary")]
            });
        }

        flow(args, logo, turtle, blk) {
            const block = activity.blocks.blockList[blk];
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            if (args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const a = args[0];
            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                logo.turtleDicts[turtle] = {};
            }

            const c = block.connections[2];
            if (c != null) {
                try {
                    const d = JSON.parse(activity.blocks.blockList[c].value);
                    // Is the dictionary the same as a turtle name?
                    const target = getTargetTurtle(activity.turtles, a);
                    if (target !== null) {
                        // Copy any internal entries now.
                        const k = Object.keys(d);
                        for (let i = 0; i < k.length; i++) {
                            Turtle.DictActions.setDictValue(target, turtle, k[i], d[k[i]]);
                        }
                    } else if (!(a in logo.turtleDicts[turtle])) {
                        logo.turtleDicts[turtle][a] = {};
                    }
                } catch (e) {
                    activity.errorMsg(
                        _("The block you selected does not contain a valid dictionary.")
                    );
                }
            } else {
                activity.errorMsg(_("The set dictionary block needs a dictionary."));
            }
        }
    }

    class SaveHeapBlock extends FlowBlock {
        constructor() {
            super("saveHeap");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Save-heap block saves the heap to a file."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: save the heap to a file
                name: _("save heap"),
                args: 1,
                argTypes: ["textin"],
                defaults: ["heap.json"]
            });
        }

        flow(args, logo, turtle) {
            if (args[0] !== null && turtle in logo.turtleHeaps) {
                activity.save.download(
                    "json",
                    "data:text/json;charset-utf-8," + JSON.stringify(logo.turtleHeaps[turtle]),
                    args[0]
                );
            }
        }
    }

    class SaveDictBlock extends FlowBlock {
        constructor() {
            super("saveDict");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Save-dictionary block saves a dictionary to a file."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: save a dictionary to a file
                name: _("save dictionary"),
                args: 2,
                argTypes: ["textin", "textin"],
                argLabels: [_("name"), _("file")],
                defaults: [_("My Dictionary"), "dictionary.json"]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            if (args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const a = args[0];
            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                logo.turtleDicts[turtle] = {};
            }
            // Is the dictionary the same as a turtle name?
            const target = getTargetTurtle(activity.turtles, a);
            if (target === null) {
                activity.save.download(
                    "json",
                    "data:text/json;charset-utf-8," + JSON.stringify(logo.turtleDicts[turtle][a]),
                    args[1]
                );
            } else {
                activity.save.download(
                    "json",
                    "data:text/json;charset-utf-8," +
                        Turtle.DictActions.SerializeDict(target, turtle),
                    args[1]
                );
            }
        }
    }

    class OpenPaletteBlock extends FlowBlock {
        constructor() {
            super("openpalette");
            this.setPalette("program", activity);
            this.setHelpString([_("The Open palette block opens a palette."), "documentation", ""]);

            this.formBlock({
                name: _("open palette"),
                args: 1,
                argTypes: ["textin"],
                defaults: [_("rhythm")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length < 1) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            for (const p in activity.blocks.palettes.dict) {
                if (_(activity.blocks.palettes.dict[p].name) === args[0].toLowerCase()) {
                    activity.blocks.palettes.hide();
                    activity.blocks.palettes.dict[p].show();
                    activity.blocks.palettes.show();
                    return;
                }
            }
        }
    }

    class DeleteBlockBlock extends FlowBlock {
        constructor() {
            super("deleteblock");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Delete block block removes a block."),
                "documentation",
                "",
                "deletehelp"
            ]);

            this.formBlock({
                //.TRANS: Move this block to the trash.
                name: _("delete block"),
                args: 1
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length < 1) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
                return;
            }

            if (args[0] < 0 || args[0] > activity.blocks.blockList.length - 1) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            // Is the block already in the trash?
            if (activity.blocks.blockList[args[0]].trash) {
                return;
            }

            // Disconnect the block.
            const c = activity.blocks.blockList[args[0]].connections[0];
            activity.blocks.blockList[args[0]].connections[0] = null;
            if (c !== null) {
                for (let i = 0; i < activity.blocks.blockList[c].connections.length; i++) {
                    if (activity.blocks.blockList[c].connections[i] === args[0]) {
                        activity.blocks.blockList[c].connections[i] = null;
                    }
                }
            }

            // Send it to the trash.
            activity.blocks.sendStackToTrash(activity.blocks.blockList[args[0]]);

            // And adjust the docs of the former connection
            activity.blocks.adjustDocks(c, true);
        }
    }

    class MoveBlockBlock extends FlowBlock {
        constructor() {
            super("moveblock");
            this.setPalette("program", activity);
            this.setHelpString([_("The Move block block moves a block."), "documentation", ""]);

            this.formBlock({
                //.TRANS: Move the position of a block on the screen.
                name: _("move block"),
                args: 3,
                argLabels: [_("block number"), _("x"), _("y")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length < 3) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args[0] < 0 || args[0] > activity.blocks.blockList.length - 1) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const x = activity.turtles.turtleX2screenX(args[1]);
            const y = activity.turtles.turtleY2screenY(args[2]);
            activity.blocks.moveBlock(args[0], x, y);
        }
    }

    class RunBlockBlock extends FlowBlock {
        constructor() {
            super("runblock");
            this.setPalette("program", activity);
            this.setHelpString([
                _(
                    "The Run block block runs a block. It accepts two types of arguments: block number or block name."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: Run program beginning at this block.
                name: _("run block"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [0]
            });
        }

        flow(args, logo, turtle, blk, receivedArg) {
            if (args.length < 1) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (typeof args[0] === "string") {
                // Look for a block with logo name
                for (let i = 0; i < activity.blocks.blockList.length; i++) {
                    if (
                        activity.blocks.blockList[i].protoblock.staticLabels.length > 0 &&
                        activity.blocks.blockList[i].protoblock.staticLabels[0] === args[0]
                    ) {
                        args[0] = i;
                        return;
                    }
                }
            }

            if (typeof args[0] === "string") {
                args[0] = -1;
            }

            if (args[0] < 0 || args[0] > activity.blocks.blockList.length - 1) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (activity.blocks.blockList[args[0]].name === "start") {
                const thisTurtle = activity.blocks.blockList[args[0]].value;
                const tur = activity.turtles.ithTurtle(thisTurtle);
                // eslint-disable-next-line no-console
                console.debug("run start " + thisTurtle);

                logo.initTurtle(thisTurtle);
                tur.queue = [];
                tur.parentFlowQueue = [];
                tur.unhighlightQueue = [];
                tur.parameterQueue = [];
                tur.running = true;
                logo.runFromBlock(logo, thisTurtle, args[0], 0, receivedArg);
            } else {
                return [args[0], 1];
            }
        }
    }

    class DockBlockBlock extends FlowBlock {
        constructor() {
            super("dockblock");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Dock block block connections two blocks."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: We can connect a block to another block.
                name: _("connect blocks"),
                args: 3,
                argLabels: [_("target block"), _("connection number"), _("block number")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length < 3) {
                // eslint-disable-next-line no-console
                console.debug(args.length + " < 3");
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args[0] < 0 || args[0] > activity.blocks.blockList.length - 1) {
                // eslint-disable-next-line no-console
                console.debug(args[0] + " > " + activity.blocks.blockList.length - 1);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args[0] === args[2]) {
                // eslint-disable-next-line no-console
                console.debug(args[0] + " == " + args[2]);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args[2] < 0 || args[2] > activity.blocks.blockList.length - 1) {
                // eslint-disable-next-line no-console
                console.debug(args[2] + " > " + activity.blocks.blockList.length - 1);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args[1] === -1) {
                // Find the last connection.
                args[1] = activity.blocks.blockList[args[0]].connections.length - 1;
            } else if (
                args[1] < 1 ||
                args[1] > activity.blocks.blockList[args[0]].connections.length - 1
            ) {
                // eslint-disable-next-line no-console
                console.debug(args[1] + " out of bounds");
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            // Make sure there is not another block already connected.
            const c = activity.blocks.blockList[args[0]].connections[args[1]];
            if (c !== null) {
                if (activity.blocks.blockList[c].name === "hidden") {
                    // Dock to the hidden block.
                    args[0] = c;
                    args[1] = 1;
                } else {
                    // Or disconnection the old connection.
                    for (let i = 0; i < activity.blocks.blockList[c].connections.length; i++) {
                        if (activity.blocks.blockList[c].connections[i] === args[0]) {
                            activity.blocks.blockList[c].connections[i] = null;
                            return;
                        }
                    }

                    activity.blocks.blockList[args[0]].connections[args][1] = null;
                }
            }

            activity.blocks.blockList[args[0]].connections[args[1]] = args[2];
            activity.blocks.blockList[args[2]].connections[0] = args[0];

            activity.blocks.adjustDocks(args[0], true);
        }
    }

    class MakeBlockBlock extends LeftBlock {
        constructor() {
            super("makeblock");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Make block block creates a new block."),
                "documentation",
                "",
                "makehelp"
            ]);

            this.formBlock({
                //.TRANS: Create a new block programmatically.
                name: _("make block"),
                args: 1,
                argTypes: ["anyin"],
                outType: "numberout",
                flows: {
                    type: "arg",
                    types: ["anyin"],
                    labels: [""]
                },
                defaults: [_("note")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            activity.blocks.showBlocks(); // Force blocks to be visible.
            const blockArgs = [null];
            if (activity.blocks.blockList[blk].argClampSlots.length > 0) {
                for (let i = 0; i < activity.blocks.blockList[blk].argClampSlots.length; i++) {
                    const t = logo.parseArg(
                        logo,
                        turtle,
                        activity.blocks.blockList[blk].connections[i + 2],
                        blk,
                        receivedArg
                    );
                    blockArgs.push(t);
                }
            }
            const cblk = activity.blocks.blockList[blk].connections[1];
            const name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            const blockNumber = activity.blocks.blockList.length;

            const tur = activity.turtles.ithTurtle(turtle);

            const x = activity.turtles.turtleX2screenX(tur.x);
            const y = activity.turtles.turtleY2screenY(tur.y);

            // We need to wait for the new block to load before continuing
            tur.doWait(1);

            // We special case note blocks.
            //.TRANS: a musical note consisting of pitch and duration
            if (name === _("note")) {
                let p, o, v;
                switch (blockArgs.length) {
                    case 1:
                        p = "sol";
                        o = 4;
                        v = 4;
                        break;
                    case 2:
                        p = blockArgs[1];
                        o = 4;
                        v = 4;
                        break;
                    case 3:
                        p = blockArgs[1];
                        o = blockArgs[2];
                        v = 4;
                        break;
                    default:
                        p = blockArgs[1];
                        o = blockArgs[2];
                        v = blockArgs[3];
                        break;
                }

                const newNote = [
                    [0, "newnote", x, y, [null, 1, 4, 8]],
                    [1, "divide", 0, 0, [0, 2, 3]],
                    [2, ["number", { value: 1 }], 0, 0, [1]],
                    [3, ["number", { value: v }], 0, 0, [1]],
                    [4, "vspace", 0, 0, [0, 5]],
                    [5, "pitch", 0, 0, [4, 6, 7, null]],
                    [6, ["solfege", { value: p }], 0, 0, [5]],
                    [7, ["number", { value: o }], 0, 0, [5]],
                    [8, "hidden", 0, 0, [0, null]]
                ];
                activity.blocks.loadNewBlocks(newNote);
                // eslint-disable-next-line no-console
                console.debug("BLOCKNUMBER " + blockNumber);
                return blockNumber;
            } else if (name === _("start")) {
                const newBlock = [[0, "start", x, y, [null, null, null]]];
                activity.blocks.loadNewBlocks(newBlock);
                // eslint-disable-next-line no-console
                console.debug("BLOCKNUMBER " + blockNumber);
                return blockNumber;
            } else if (name === _("silence")) {
                // FIXME: others too
                const newBlock = [[0, "rest2", x, y, [null, null]]];
                activity.blocks.loadNewBlocks(newBlock);
                // eslint-disable-next-line no-console
                console.debug("BLOCKNUMBER " + blockNumber);
                return blockNumber;
            } else {
                const obj = activity.blocks.palettes.getProtoNameAndPalette(name);
                const protoblk = obj[0];
                const protoName = obj[2];
                if (protoblk === null) {
                    activity.errorMsg(_("Cannot find block") + " " + name);
                    // eslint-disable-next-line no-console
                    console.debug("Cannot find block " + name);
                    return 0;
                } else {
                    const newBlock = [[0, protoName, x, y, [null]]];
                    for (
                        let i = 1;
                        i < activity.blocks.protoBlockDict[protoblk].dockTypes.length;
                        i++
                    ) {
                        // FIXME: type check args
                        if (i < blockArgs.length) {
                            if (typeof blockArgs[i] === "number") {
                                if (
                                    ["anyin", "numberin"].indexOf(
                                        activity.blocks.protoBlockDict[protoblk].dockTypes[i]
                                    ) === -1
                                ) {
                                    activity.errorMsg(_("Warning: block argument type mismatch"));
                                }
                                newBlock.push([i, ["number", { value: blockArgs[i] }], 0, 0, [0]]);
                            } else if (typeof blockArgs[i] === "string") {
                                if (
                                    ["anyin", "textin"].indexOf(
                                        activity.blocks.protoBlockDict[protoblk].dockTypes[i]
                                    ) === -1
                                ) {
                                    activity.errorMsg(_("Warning: block argument type mismatch"));
                                }
                                newBlock.push([i, ["string", { value: blockArgs[i] }], 0, 0, [0]]);
                            } else {
                                newBlock[0][4].push(null);
                            }

                            newBlock[0][4].push(i);
                        } else {
                            newBlock[0][4].push(null);
                        }
                    }

                    activity.blocks.loadNewBlocks(newBlock);
                    // eslint-disable-next-line no-console
                    console.debug("BLOCKNUMBER " + blockNumber);
                    return blockNumber;
                }
            }
        }
    }

    class OpenProjectBlock extends FlowBlock {
        constructor() {
            super("openProject");
            this.setPalette("program", activity);
            this.setHelpString([
                _("The Open project block is used to open a project from a web page."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("open project"),
                args: 1,
                argTypes: ["textin"],
                defaults: ["url"]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const url = args[0];

            let ValidURL = (str) => {
                const pattern = new RegExp(
                    "^(https?:\\/\\/)?" + // protocol
                        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
                        "((\\d{1,3}\\.) {3}\\d{1,3}))" + // OR ip (v4) address
                        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
                        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
                        "(\\#[-a-z\\d_]*)?$",
                    "i"
                ); // fragment locator
                if (!pattern.test(str)) {
                    activity.errorMsg(_("Please enter a valid URL."));
                    return false;
                } else {
                    return true;
                }
            };

            if (ValidURL(url)) {
                const win = window.open(url, "_blank");
                if (win) {
                    // Browser has allowed it to be opened.
                    win.focus();
                } else {
                    // Broswer has blocked it.
                    alert("Please allow popups for this site");
                }
            }
        }
    }

    new DeleteBlockBlock().setup(activity);
    new MoveBlockBlock().setup(activity);
    new RunBlockBlock().setup(activity);
    new DockBlockBlock().setup(activity);
    new MakeBlockBlock().setup(activity);
    new OpenProjectBlock().setup(activity);
    new OpenPaletteBlock().setup(activity);
    new LoadHeapFromAppBlock().setup(activity);
    new SaveHeapToAppBlock().setup(activity);
    new SaveDictBlock().setup(activity);
    new LoadDictBlock().setup(activity);
    new SetDictBlock().setup(activity);
    new SaveHeapBlock().setup(activity);
    new LoadHeapBlock().setup(activity);
    new SetHeapBlock().setup(activity);
};
