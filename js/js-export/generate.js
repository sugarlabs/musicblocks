/**
 * @file This contains the utilities for generating code from block stacks for JS Editor widget.
 * @author Anindya Kundu
 *
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
*/

/**
 * @class
 */
class JSGenerate {
    /**
     * Generates a JSON of the tree representation of the "start" and "action" block stacks.
     *
     * @static
     */
    static generateStacksTree() {
        blocks.findStacks();
        let startBlocks = [], actionBlocks = [];

        for (let blk of blocks.stackList) {
            if (blocks.blockList[blk].name === "start" && !blocks.blockList[blk].trash) {
                startBlocks.push(blk);
            } else if (blocks.blockList[blk].name === "action" && !blocks.blockList[blk].trash) {
                // does the action stack have a name?
                let c = blocks.blockList[blk].connections[1];
                // is there a block in the action clamp?
                let b = blocks.blockList[blk].connections[2];
                if (c !== null && b !== null) {
                    actionBlocks.push(blk);
                }
            }
        }

        /**
         * Generates a tree representation of the block stack starting with blk.
         *
         * @param {Number} blk - Block representation in blocks.blockList
         * @param {Object} tree - list structure to store tree from blk
         * @param {Number} level - for clamp/doubleclamp blocks: 0/undefined for first flow, 1 for second flow
         * @returns {Object} tree from blk
         */
        function GenerateStackTree(blk, tree, level) {
            function ParseArg(blk) {
                let argLen = blk.protoblock.args;
                if (blk.protoblock.style === "clamp")
                    argLen -= 1;
                else if (blk.protoblock.style === "doubleclamp")
                    argLen -= 2;

                let args = [];
                for (let i = 1; i <= argLen; i++) {
                    let arg = blocks.blockList[blk.connections[i]];
                    if (arg === undefined) {
                        args.push(null);
                        continue;
                    }

                    if (
                        arg.protoblock.style === "clamp" &&
                        arg.protoblock._style.flows.left === true
                    ) {
                        console.warn(`CANNOT PROCESS "${arg.name}" BLOCK`);
                        args.push(null);
                        continue;
                    }

                    // ignore horizontal spacers
                    while (arg.name === "hspace") {
                        arg = blocks.blockList[arg.connections[1]];
                    }

                    if (arg.protoblock.style === "value") {
                        if (
                            arg.protoblock.__proto__.__proto__.constructor.name === "BooleanBlock"
                        ) {
                            if (arg.name === "boolean") {
                                args.push(arg.value);
                            } else {
                                args.push([arg.name, ParseArg(arg)]);
                            }
                        } else {
                            if (arg.name === "namedbox") {
                                args.push(arg.privateData);
                            } else {
                                args.push(arg.value);
                            }
                        }
                    } else if (arg.protoblock.style === "arg") {
                        args.push([arg.name, ParseArg(arg)]);
                    }
                }

                return args;
            }

            if (level === undefined)
                level = 0;
            let nextBlk = blk.connections[blk.connections.length - 2 - level];
            nextBlk = blocks.blockList[nextBlk];
            while (nextBlk !== undefined) {
                if (nextBlk.name !== "hidden" && nextBlk.name !== "vspace") {
                    if (nextBlk.name === "storein2") {
                        tree.push([nextBlk.name + "_" + nextBlk.privateData]);
                    } else {
                        tree.push([nextBlk.name]);
                    }

                    let args = ParseArg(nextBlk);
                    last(tree).push(args.length === 0 ? null : args);

                    if (nextBlk.protoblock.style === "clamp") {
                        last(tree).push(GenerateStackTree(nextBlk, []));
                    } else if (nextBlk.protoblock.style === "doubleclamp") {
                        last(tree).push(GenerateStackTree(nextBlk, [], 1));
                        last(tree).push(GenerateStackTree(nextBlk, [], 0));
                    } else {
                        last(tree).push(null);
                    }
                }

                if (nextBlk.connections.length > 0) {
                    nextBlk = blocks.blockList[last(nextBlk.connections)];
                    if (nextBlk === undefined)
                        break;
                } else {
                    break;
                }
            }

            return tree;
        }

        function PrintTree(tree, level) {
            function PrintArgs(args) {
                if (args === null || args.length === 0) {
                    return "none";
                } else {
                    let str = "(";
                    for (let arg of args) {
                        if (arg === null) {
                            str += "null";
                        } else if (typeof arg === "object") {
                            str += arg[0] + PrintArgs(arg[1]);
                        } else {
                            str += arg;
                        }
                        str += ", ";
                    }
                    str = str.substring(0, str.length - 2) + ")";
                    return str;
                }
            }

            if (level === undefined)
                level = 0;

            for (let i of tree) {
                let spaces = "";
                for (let j = 0; j < 4 * level; j++)
                    spaces += " ";
                console.log(
                    "%c" + spaces + "%c" + i[0] + " : " + "%c" + PrintArgs(i[1]),
                    "background: mediumslateblue", "background; none", "color: dodgerblue"
                );
                if (i[2] !== null) {
                    PrintTree(i[2], level + 1);
                    if (i.length === 4 && i[3] !== null) {
                        console.log("%c" + spaces + "** NEXTFLOW **", "color: green");
                        PrintTree(i[3], level + 1);
                    }
                }
            }
        }

        for (let blk of startBlocks) {
            let tree = GenerateStackTree(blocks.blockList[blk], []);
            PrintTree(tree);
            console.log("%c _______________________________________", "color: silver");
        }

        for (let blk of actionBlocks) {
            let tree = GenerateStackTree(blocks.blockList[blk], []);
            PrintTree(tree);
            console.log("%c _______________________________________", "color: silver");
        }
    }
}
