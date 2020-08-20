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
 * @classdesc
 * Contains data structures that store the list of start blocks and actions blocks.
 * Conatins utility methods to generate block stack trees of start and action blocks.
 * Contains utility method that generates AST for the corresponding code for the trees.
 *
 * Code is generated from the Abstract Syntax Tree using a library called "Astring".
 *
 * * Internal functions' names are in PascalCase.
 */
class JSGenerate {
    /** list of the Block index numbers of all start blocks */
    static startBlocks = [];
    /** list of the Block index numbers of all action blocks */
    static actionBlocks = [];
    /** list of all the generated trees of start blocks */
    static startTrees = [];
    /** list of all the generated trees of action blocks */
    static actionTrees = [];
    /** Abstract Syntax Tree for the corresponding code to be generated from the stack trees */
    static AST = {};
    /** Final output code generated from the AST of the block stack trees */
    static code = "";

    /**
     * Generates a tree representation of the "start" and "action" block stacks.
     *
     * @static
     * @returns {void}
     */
    static generateStacksTree() {
        blocks.findStacks();

        for (let blk of blocks.stackList) {
            if (blocks.blockList[blk].name === "start" && !blocks.blockList[blk].trash) {
                JSGenerate.startBlocks.push(blk);
            } else if (blocks.blockList[blk].name === "action" && !blocks.blockList[blk].trash) {
                // does the action stack have a name?
                let c = blocks.blockList[blk].connections[1];
                // is there a block in the action clamp?
                let b = blocks.blockList[blk].connections[2];
                if (c !== null && b !== null) {
                    JSGenerate.actionBlocks.push(blk);
                }
            }
        }

        /**
         * Recursively generates a tree representation of the block stack starting with blk.
         *
         * @param {Number} blk - Block representation in blocks.blockList
         * @param {Object} tree - list structure to store tree from blk
         * @param {Number} level - for clamp/doubleclamp blocks: 0/undefined for first flow, 1 for second flow
         * @returns {[*]} tree from blk
         */
        function GenerateStackTree(blk, tree, level) {
            /**
             * Recursively generates a tree representation of the arguments starting with blk.
             *
             * @param {Object} blk - Block object
             * @returns {[*]} tree representation
             */
            function ParseArg(blk) {
                let argLen = blk.protoblock.args;
                if (blk.protoblock.style === "clamp") {
                    argLen -= 1;
                } else if (blk.protoblock.style === "doubleclamp") {
                    argLen -= 2;
                }

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
                // ignore vertical spacers and hidden blocks
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

        for (let blk of JSGenerate.startBlocks)
            JSGenerate.startTrees.push(GenerateStackTree(blocks.blockList[blk], []));

        for (let blk of JSGenerate.actionBlocks)
            JSGenerate.actionTrees.push(GenerateStackTree(blocks.blockList[blk], []));
    }

    /**
     * Prints all the tree representations of start and action block stacks.
     *
     * @static
     * @returns {void}
     */
    static printStacksTree() {
        /**
         * Recursively prints a tree starting from level.
         *
         * @param {[*]} tree - block stack tree
         * @param {Number} level - nesting level
         */
        function PrintTree(tree, level) {
            /**
             * Recursively generates the string of arguments.
             *
             * @param {[*]} args - arguments list
             * @returns {String} serialized arguments
             */
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

        if (JSGenerate.startTrees.length === 0) {
            console.log("%cno start trees generated", "color: tomato");
        } else {
            for (let tree of JSGenerate.startTrees) {
                PrintTree(tree);
                console.log("%c _______________________________________", "color: silver");
            }
        }

        if (JSGenerate.startTrees.length === 0) {
            console.log("%cno action trees generated", "color: tomato");
        } else {
            for (let tree of JSGenerate.actionTrees) {
                PrintTree(tree);
                console.log("%c _______________________________________", "color: silver");
            }
        }
    }

    /**
     * Generates the corresponding code to the generated from the stack trees by structuring the
     * different Abstract Syntax Trees.
     *
     * @static
     * @returns {void}
     */
    static generateCode() {
        JSGenerate.AST = bareboneAST;

        for (let i = 0; i < JSGenerate.startTrees.length; i++) {
            JSGenerate.AST["body"].splice(i, 0, getMouseAST(JSGenerate.startTrees[i]));
        }

        JSGenerate.code = astring.generate(JSGenerate.AST);
    }

    static run() {
        JSGenerate.generateStacksTree();
        // JSGenerate.printStacksTree();
        JSGenerate.generateCode();
        console.log(JSGenerate.code);
    }
}
