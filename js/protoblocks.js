// Copyright (c) 2014-21 Walter Bender
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

   createjs, SVG, DEFAULTBLOCKSCALE, STANDARDBLOCKHEIGHT
*/

/*
   exported

   ProtoBlock, ValueBlock, BooleanBlock, BooleanSensorBlock,
   LeftBlock, FlowClampBlock, StackClampBlock
*/

// The ProtoBlock class is defined in this file. Protoblocks are the
// prototypes from which Blocks are created.

// Note that protoblocks.js is largely deprecated. It is only used to
// generate palette blocks.

// Protoblock contain generic information about blocks and some
// methods common to all blocks.
class ProtoBlock {
    /**
     * Creates an instance of ProtoBlock.
     * @param {string} name - The name of the block.
     */
    constructor(name) {
        // Name is used run-dictionary index, and palette label.
        this.name = name;
        // The palette to which this block is assigned.
        this.palette = null;
        // The graphic style used by the block.
        this.style = null;
        // The generator function used to create the artwork
        this.generator = null;
        // Does the block expand (or collapse) when other blocks are
        // attached? e.g., start, repeat...
        this.expandable = false;
        // Is this block a parameter? Parameters have their labels
        // overwritten with their current value.
        this.parameter = false;
        // How many "non-flow" arguments does a block have? (flow is
        // vertical down a stack; args are horizontal. The pendown block
        // has 0 args; the forward block has 1 arg; the setxy block has 2
        // args.
        this.args = 0;
        // Default values for block parameters, e.g., forward 100 or right 90.
        this.defaults = [];
        // What is the size of the block prior to any expansion?
        this.size = 1.0;
        // Dock types are a list of the types associated with the docking points.
        this.dockTypes = [];
        // Static labels are generated as part of the inline SVG.
        this.staticLabels = [];
        // Default fontsize used for static labels.
        this.fontsize = null;
        // Extra block width for long labels
        this.extraWidth = 0;
        // Block scale
        this.scale = DEFAULTBLOCKSCALE;
        // The filepath of the image.
        this.image = null;
        // Hidden: don't show on any palette
        this.hidden = false;
        // Disabled: use inactive colors
        this.disabled = false;
        // Deprecated
        this.deprecated = false;
        //Stores the width of the text component
        this.textWidth = 0;
        this.labelOffset = 0;
        this.beginnerModeBlock = false;
    }

    /**
     * Adjusts the block width based on the label size.
     */
    adjustWidthToLabel() {
        if (this.staticLabels.length === 0) {
            return;
        }
        const c = new createjs.Container();
        const text = new createjs.Text(
            this.staticLabels[0],
            this.fontSize + "px Sans",
            "#000000"
        );
        c.addChild(text);
        const b = c.getBounds();
        this.textWidth = b.width;
        this.extraWidth += Math.max(b.width - 30, 0);
    }

    // What follows are the initializations for different block
    // styles.

    // The generator methods return the svg artwork, the dock
    // positions, and the width and height, and the height used to
    // calculate the hit area for the block. (Note that clamp blocks
    // only extend their hit area to the top of the clamp.)

    // E.g., penup, pendown
    /**
     * Initializes a zero-argument block.
     */
    zeroArgBlock() {
        this.args = 0;
        this.dockTypes.push("out");
        this.dockTypes.push("in");
        this.generator = this.zeroArgBlockGenerator;
    }

    /**
     * Generates SVG artwork for a zero-argument block.
     * @returns {array} - An array containing SVG artwork, dock positions, width, height, and hit area height.
     */
    zeroArgBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setSlot(true);
        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }
        svg.setExpand(10 + this.extraWidth, 0, 0, 0);
        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    // E.g., hidden (used at end of clamp)
    /**
     * Sets up a hidden block with flow.
     * Used at the end of a clamp.
     */
    hiddenBlockFlow() {
        this.args = 0;
        this.size = 0;
        this.dockTypes.push("out");
        this.dockTypes.push("in");
        this.generator = this.hiddenBlockFlowGenerator;
    }

    // E.g., hidden (used at end of no flow clamp)
    /**
     * Sets up a hidden block with no flow.
     * Used at the end of a no flow clamp.
     */
    hiddenBlockNoFlow() {
        this.args = 0;
        this.size = 0;
        this.dockTypes.push("out");
        this.dockTypes.push("unavailable");
        this.generator = this.hiddenBlockFlowGenerator;
    }

    /**
     * Generates SVG artwork and docks for a hidden block with flow.
     * @returns {array} - Array containing SVG artwork, docks, width, height, and hitHeight.
     */
    hiddenBlockFlowGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setSlot(true);
        svg.setTab(true);
        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }
        // We need to generate the artwork in order to generate the dock.
        let artwork = svg.basicBlock();
        // Then we replace the artwork with a single pixel.
        artwork =
            '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><text style="font-size:10px;fill:#000000;font-family:sans-serif;text-anchor:end"><tspan x="46.333333333333336" y="13.5">block_label</tspan></text></svg>';
        // And bring the last dock position to the top.
        svg.docks[1][1] = svg.docks[0][1];
        return [artwork, svg.docks, 0, 0, 0];
    }

    // E.g., break
    /**
     * Sets up a basic block with no flow.
     * Used for breaks.
     */
    basicBlockNoFlow() {
        this.args = 0;
        this.dockTypes.push("out");
        this.dockTypes.push("unavailable");
        this.generator = this.basicBlockNoFlowGenerator;
    }

    /**
     * Generates SVG artwork and docks for a basic block with no flow.
     * @returns {array} - Array containing SVG artwork, docks, width, height, and hitHeight.
     */
    basicBlockNoFlowGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setSlot(true);
        svg.setTail(true);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    // E.g., collapsed
    /**
     * Sets up a collapsed basic block.
     */
    basicBlockCollapsed() {
        this.args = 0;
        this.dockTypes.push("unavailable");
        this.dockTypes.push("unavailable");
        this.generator = this.basicBlockCollapsedGenerator;
    }

    /**
     * Generates SVG artwork and docks for a collapsed basic block.
     * @returns {array} - Array containing SVG artwork, docks, width, height, and hitHeight.
     */
    basicBlockCollapsedGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setCap(true);
        svg.setTail(true);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Sets up a one-argument block.
     * E.g., forward, right.
     */
    oneArgBlock() {
        this.args = 1;
        this.dockTypes.push("out");
        this.dockTypes.push("numberin");
        this.dockTypes.push("in");
        this.generator = this.oneArgBlockGenerator;
    }

    /**
     * Generates SVG artwork and docks for a one-argument block.
     * @returns {array} - Array containing SVG artwork, docks, width, height, and hitHeight.
     */
    oneArgBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setInnies([true]);
        svg.setSlot(true);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Sets up a block with one boolean argument.
     * E.g., wait for
     */
    oneBooleanArgBlock() {
        this.args = 1;
        this.size = 1;
        this.dockTypes.push("out");
        this.dockTypes.push("booleanin");
        this.dockTypes.push("in");
        this.generator = this.oneBooleanArgBlockGenerator;
    }

    /**
     * Generates a block with one boolean argument.
     * @returns {array} - An array containing SVG representation, docks, width, and height of the block.
     */
    oneBooleanArgBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setSlot(true);
        svg.setBoolean(true);
        svg.setClampCount(0);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Sets up an expandable block with two arguments.
     * E.g., setxy. These are expandable.
     */
    twoArgBlock() {
        this.expandable = true;
        this.style = "twoarg";
        this.size = 2;
        this.args = 2;
        this.dockTypes.push("out");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("in");
        this.generator = this.twoArgBlockGenerator;
    }

    /**
     * Generates an expandable block with two arguments.
     * @param {number} expandY - The expansion along the Y-axis.
     * @returns {array} - An array containing SVG representation, docks, width, and height of the block.
     */
    twoArgBlockGenerator(expandY) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setInnies([true, true]);
        svg.setSlot(true);

        if (expandY) {
            svg.setExpand(
                30 + this.extraWidth,
                ((expandY - 1) * STANDARDBLOCKHEIGHT) / 2, 0, 0);
        } else {
            svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Sets up an expandable block with three arguments.
     * E.g., ??? These are expandable.
     */
    threeArgBlock() {
        this.expandable = true;
        this.style = "twoarg";
        this.size = 3;
        this.args = 3;
        this.dockTypes.push("out");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("in");
        this.generator = this.threeArgBlockGenerator;
    }

    /**
     * Generates an expandable block with three arguments.
     * @param {number} expandY - The expansion along the Y-axis.
     * @returns {array} - An array containing SVG representation, docks, width, and height of the block.
     */
    threeArgBlockGenerator(expandY) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setInnies([true, true, true]);
        svg.setSlot(true);

        if (expandY) {
            svg.setExpand(
                30 + this.extraWidth,
                ((expandY - 1) * STANDARDBLOCKHEIGHT) / 2, 0, 0);
        } else {
            svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Sets up a block with four arguments.
     * This block is expandable and follows the 'twoarg' style.
     */
    fourArgBlock() {
        this.expandable = true;
        this.style = "twoarg";
        this.size = 4;
        this.args = 4;
        this.dockTypes.push("out");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("in");
        this.generator = this.fourArgBlockGenerator;
    }

    /**
     * Generates a block with four arguments.
     * @param {number} expandY - Expansion factor for the Y dimension (optional).
     * @returns {array} - An array containing block SVG, docks, width, and height.
     */
    fourArgBlockGenerator(expandY) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setInnies([true, true, true, true]);
        svg.setSlot(true);

        if (expandY) {
            svg.setExpand(
                30 + this.extraWidth,
                ((expandY - 1) * STANDARDBLOCKHEIGHT) / 2, 0, 0);
        } else {
            svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Sets up a block with one argument for mathematical operations.
     * This block follows the 'arg' style and has a single argument.
     * E.g., sqrt, box
     */
    oneArgMathBlock() {
        this.style = "arg";
        this.size = 1;
        this.args = 1;
        this.parameter = true;
        this.dockTypes.push("numberout");
        this.dockTypes.push("numberin");
        this.generator = this.oneArgMathBlockGenerator;
    }

    /**
     * Generates a block with one argument for mathematical operations.
     * @returns {array} - An array containing block SVG, docks, width, and height.
     */
    oneArgMathBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setSlot(false);
        svg.setInnies([true]);
        svg.setOutie(true);
        svg.setTab(false);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Sets up a block with two arguments for mathematical operations.
     * This block is expandable, follows the 'arg' style, and has two arguments.
     * E.g., plus, minus, multiply, divide, power,distance. These are also expandable.
     */
    twoArgMathBlock() {
        this.expandable = true;
        this.style = "arg";
        this.size = 2;
        this.args = 2;
        this.parameter = true;
        this.dockTypes.push("numberout");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.generator = this.twoArgMathBlockGenerator;
    }

    /**
     * Generates a block with two arguments for mathematical operations.
     * @param {number} expandY - Expansion factor for the Y dimension (optional).
     * @returns {array} - An array containing block SVG, docks, width, and height.
     */
    twoArgMathBlockGenerator(expandY) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setSlot(false);
        svg.setInnies([true, true]);
        svg.setOutie(true);
        svg.setTab(false);

        if (expandY) {
            svg.setExpand(
                30 + this.extraWidth,
                ((expandY - 1) * STANDARDBLOCKHEIGHT) / 2, 0, 0);
        } else {
            svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Configures a three-argument math block.
     */
    threeArgMathBlock() {
        this.expandable = true;
        this.style = "arg";
        this.size = 3;
        this.args = 3;
        this.parameter = true;
        this.dockTypes.push("numberout");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.generator = this.threeArgMathBlockGenerator;
    }

    /**
     * Generates SVG for a three-argument math block.
     * @param {number} expandY - The expansion factor for Y-axis.
     * @returns {array} - Array containing SVG elements and dimensions.
     */
    threeArgMathBlockGenerator(expandY) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setSlot(false);
        svg.setInnies([true, true, true]);
        svg.setOutie(true);
        svg.setTab(false);

        if (expandY) {
            svg.setExpand(
                30 + this.extraWidth,
                ((expandY - 1) * STANDARDBLOCKHEIGHT) / 2, 0, 0);
        } else {
            svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }
    
    /**
     * Configures a four-argument math block.
     * E.g., distance . Distance block will calculate geometrical distance between two points
     * by default (cursor x ,cursor y ) and x and y
     */
    fourArgMathBlock() {
        this.expandable = true;
        this.style = "arg";
        this.size = 4;
        this.args = 4;
        this.parameter = true;
        this.dockTypes.push("numberout");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.generator = this.fourArgMathBlockGenerator;
    }

    /**
     * Generates SVG for a four-argument math block.
     * @param {number} expandY - The expansion factor for Y-axis.
     * @returns {array} - Array containing SVG elements and dimensions.
     */
    fourArgMathBlockGenerator(expandY) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setSlot(false);
        svg.setInnies([true, true, true, true]);
        svg.setOutie(true);
        svg.setTab(false);

        if (expandY) {
            svg.setExpand(
                30 + this.extraWidth,
                ((expandY - 1) * STANDARDBLOCKHEIGHT) / 2, 0, 0);
        } else {
            svg.setExpand(30 + this.extraWidth, 0, 0, 0);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicBlock(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Configures a value block.
     * E.g., number, string. Value blocks get DOM textareas associated
     * with them so their values can be edited by the user.
     */
    valueBlock() {
        this.style = "value";
        this.size = 1;
        this.args = 0;
        this.dockTypes.push("numberout");
        this.generator = this.valueBlockGenerator;
    }

    /**
     * Generates SVG for a value block.
     * @returns {array} - Array containing SVG elements and dimensions.
     */
    valueBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        // Extra room for parameter label
        svg.setExpand(60 + this.extraWidth, 0, 0, 0);
        svg.setOutie(true);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicBox(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Sets up a media block. Media blocks invoke a chooser and a thumbnail
     * image is overlayed to represent the data associated with the block.
     */
    mediaBlock() {
        this.style = "value";
        this.size = 2;
        this.args = 0;
        this.dockTypes.push("mediaout");
        this.generator = this.mediaBlockGenerator;
    }

    /**
     * Generates SVG for a media block.
     * @returns {Array} - An array containing SVG components.
     */
    mediaBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        // Extra room for graphics
        svg.setExpand(60 + this.extraWidth, 23, 0, 0);
        svg.setOutie(true);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicBox(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Sets up a stack clamp block with zero arguments. A "child" flow is docked
     * in an expandable clamp. There are no additional arguments and no flow
     * above or below.
     * E.g., start. A "child" flow is docked in an expandable clamp.
     * There are no additional arguments and no flow above or below.
     */
    stackClampZeroArgBlock() {
        this.style = "clamp";
        this.expandable = true;
        this.size = 3;
        this.args = 1;
        this.dockTypes.push("unavailable");
        this.dockTypes.push("in");
        this.dockTypes.push("unavailable");
        this.generator = this.stackClampZeroArgBlockGenerator;
    }

    /**
     * Generates SVG for a stack clamp block with zero arguments.
     * @param {number} [slots] - Number of available slots (optional).
     * @returns {Array} - An array containing SVG components.
     */
    stackClampZeroArgBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setCap(true);
        svg.setTail(true);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);
        svg.setLabelOffset(this.labelOffset);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, 1);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.docks[1][1]
        ];
    }

    /**
     * Sets up a flow clamp block. Unlike start, there is a flow above and below.
     * E.g., emptyclamp. Unlike start, there is a flow above and below.
     */
    flowClampBlock() {
        this.style = "clamp";
        this.expandable = true;
        this.size = 2;
        this.args = 1;
        this.dockTypes.push("out");
        this.dockTypes.push("in");
        this.dockTypes.push("in");
        this.generator = this.flowClampBlockGenerator;
    }

    /**
     * Generates SVG for a flow clamp block.
     * @param {number} [slots] - Number of available slots (optional).
     * @returns {Array} - An array containing SVG components.
     */
    flowClampBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);

        svg.setSlot(true);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, 1);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.docks[1][1]
        ];
    }

    /**
     * Sets up a flow clamp block with one argument.
     * E.g., repeat. Unlike action, there is a flow above and below.
     */
    flowClampOneArgBlock() {
        this.style = "clamp";
        this.expandable = true;
        this.size = 2;
        this.args = 2;
        this.dockTypes.push("out");
        this.dockTypes.push("numberin");
        this.dockTypes.push("in");
        this.dockTypes.push("in");
        this.generator = this.flowClampOneArgBlockGenerator;
    }

    /**
     * Generates SVG for a flow clamp block with one argument.
     * @param {number} slots - The number of slots.
     * @returns {Array} - Array containing SVG, docks, width, height, and input y-coordinate.
     */
    flowClampOneArgBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setSlot(true);
        svg.setInnies([true]);
        svg.setLabelOffset(this.labelOffset);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, 1);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.docks[2][1]
        ];
    }

    /**
     * Sets up a flow clamp block with two arguments.
     * There is a flow above and below.
     * E.g., tuplet, which takes two args plus an interior flow.
     */
    flowClampTwoArgBlock() {
        this.style = "clamp";
        this.expandable = true;
        this.size = 3;
        this.args = 3;
        this.dockTypes.push("out");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("in");
        this.dockTypes.push("in");
        this.generator = this.flowClampTwoArgBlockGenerator;
    }

    /**
     * Generates SVG for a flow clamp block with two arguments.
     * @param {number} slots - The number of slots.
     * @returns {Array} - Array containing SVG, docks, width, height, and input y-coordinate.
     */
    flowClampTwoArgBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setSlot(true);
        svg.setInnies([true, true]);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, 1);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.docks[3][1]
        ];
    }

    /**
     * Sets up a flow clamp block with three arguments.
     */
    flowClampThreeArgBlock() {
        this.style = "clamp";
        this.expandable = true;
        this.size = 4;
        this.args = 4;
        this.dockTypes.push("out");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.dockTypes.push("textin");
        this.dockTypes.push("in");
        this.dockTypes.push("in");
        this.generator = this.flowClampThreeArgBlockGenerator;
    }

    /**
     * Generates a basic clamp block with three argument slots.
     * @param {number} slots - The number of slots for clamping (optional, defaults to 1 if not provided).
     * @returns {Array} - An array containing SVG representation, docks, width, height, and hit area.
     */
    flowClampThreeArgBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setSlot(true);
        svg.setInnies([true, true, true]);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, 1);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.docks[4][1]
        ];
    }

    /**
     * Sets up a clamp block with one argument slot.
     * E.g., do with args: innies instead of interior slots.
     */
    argClampOneArgBlock() {
        this.style = "argclamp";
        this.expandable = true;
        this.size = 3;
        this.args = 2;
        this.dockTypes.push("out");
        this.dockTypes.push("textin");
        this.dockTypes.push("anyin");
        this.dockTypes.push("in");
        this.generator = this.argClampOneArgBlockGenerator;
    }

    /**
     * Generates a clamp block with one argument slot.
     * @param {number} slots - The number of slots for clamping (optional, defaults to 1 if not provided).
     * @returns {Array} - An array containing SVG representation, docks, width, height, and hit area.
     */
    argClampOneArgBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setSlot(true);
        svg.setInnies([true]);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, [1]);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        // The hit area extends halfway between the label dock and the
        // first innie arg dock.
        return [
            svg.argClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            (svg.docks[1][1] + svg.docks[2][1]) / 2
        ];
    }

    /**
     * Sets up a clamp block with one argument slot for mathematical operations.
     * E.g., calculate with args: innies instead of interior slots.
     */
    argClampOneArgMathBlock() {
        this.style = "argclamparg";
        this.expandable = true;
        this.size = 3;
        this.args = 2;
        this.dockTypes.push("anyout");
        this.dockTypes.push("textin");
        this.dockTypes.push("anyin");
        this.generator = this.argClampOneArgMathBlockGenerator;
    }

    /**
     * Generates a clamp block with one argument slot for mathematical operations.
     * @param {number} slots - The number of slots for clamping (optional, defaults to 1 if not provided).
     * @returns {Array} - An array containing SVG representation, docks, width, height, and hit area.
     */
    argClampOneArgMathBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setInnies([true]);
        svg.setOutie(true);
        svg.setTab(false);
        svg.setSlot(false);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, [1]);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        // The hit area extends halfway between the label dock and the
        // first innie arg dock.
        return [
            svg.argClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            (svg.docks[1][1] + svg.docks[2][1]) / 2
        ];
    }

    /**
     * Sets up an argument clamp block.
     * E.g., named do with args: innies instead of interior slots.
     */
    argClampBlock() {
        this.style = "argclamp";
        this.expandable = true;
        this.size = 3;
        this.args = 1;
        this.dockTypes.push("out");
        this.dockTypes.push("anyin");
        this.dockTypes.push("in");
        this.generator = this.argClampBlockGenerator;
    }

    /**
     * Generates SVG for an argument clamp block.
     * @param {number[]} slots - Array of slots for clamping.
     * @returns {Array} - Array containing SVG, docks, width, height, and hitHeight.
     */
    argClampBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setSlot(true);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);
        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, [1]);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.argClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            (svg.docks[1][1] * 2) / 3
        ];
    }

    /**
     * Sets up an argument clamp math block.
     * E.g., named calculate with args: innies instead of interior slots.
     */
    argClampMathBlock() {
        this.style = "argclamparg";
        this.expandable = true;
        this.size = 3;
        this.args = 1;
        this.dockTypes.push("anyout");
        this.dockTypes.push("anyin");
        this.generator = this.argClampMathBlockGenerator;
    }

    /**
     * Generates SVG for an argument clamp math block.
     * @param {number[]} slots - Array of slots for clamping.
     * @returns {Array} - Array containing SVG, docks, width, height, and hitHeight.
     */
    argClampMathBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setOutie(true);
        svg.setTab(false);
        svg.setSlot(false);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, [1]);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.argClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            (svg.docks[1][1] * 2) / 3
        ];
    }

    /**
     * Sets up a flow clamp boolean argument block.
     * E.g., if.  A "child" flow is docked in an expandable clamp. The
     * additional argument is a boolean. There is flow above and below.
     */
    flowClampBooleanArgBlock() {
        this.style = "clamp";
        this.expandable = true;
        this.size = 3;
        this.args = 2;
        this.dockTypes.push("out");
        this.dockTypes.push("booleanin");
        this.dockTypes.push("in");
        this.dockTypes.push("in");
        this.generator = this.flowClampBooleanArgBlockGenerator;
    }

    /**
     * Generates SVG for a flow clamp boolean argument block.
     * @param {number} slots - Number of slots for clamping.
     * @returns {Array} - Array containing SVG, docks, width, height, and hitHeight.
     */
    flowClampBooleanArgBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setBoolean(true);
        svg.setSlot(true);
        svg.setExpand(this.extraWidth, 0, 0, 0);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, 1);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.docks[2][1]
        ];
    }

    /**
     * Represents a block with two "child" flows docked in expandable clamps, with an additional boolean argument.
     * E.g., if then else.  Two "child" flows are docked in expandable
     * clamps. The additional argument is a boolean. There is flow
     * above and below.
     * @constructor
     */
    doubleFlowClampBooleanArgBlock() {
        this.style = "doubleclamp";
        this.expandable = true;
        this.size = 4;
        this.args = 3;
        this.dockTypes.push("out");
        this.dockTypes.push("booleanin");
        this.dockTypes.push("in");
        this.dockTypes.push("in");
        this.dockTypes.push("in");
        this.generator = this.doubleFlowClampBooleanArgBlockGenerator;
    }

    /**
     * Generates the block for doubleFlowClampBooleanArgBlock.
     * @param {number} bottomSlots - The number of bottom slots.
     * @param {number} topSlots - The number of top slots.
     * @returns {Array} - Array containing SVG elements and block dimensions.
     */
    doubleFlowClampBooleanArgBlockGenerator(bottomSlots,topSlots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setSlot(true);
        svg.setBoolean(true);
        svg.setClampCount(2);

        if (topSlots) {
            svg.setClampSlots(0, topSlots);
        } else {
            svg.setClampSlots(0, 1);
        }

        if (bottomSlots) {
            svg.setClampSlots(1, bottomSlots);
        } else {
            svg.setClampSlots(1, 1);
        }

        svg.setExpand(this.extraWidth, 0, 0, 0);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.docks[2][1]
        ];
    }

    /**
     * Represents a block with flow above and below, e.g., forever.
     * E.g., forever. Unlike start, there is flow above and below.
     * @constructor
     */
    flowClampZeroArgBlock() {
        this.style = "clamp";
        this.expandable = true;
        this.size = 2;
        this.args = 1;
        this.dockTypes.push("out");
        this.dockTypes.push("in");
        this.dockTypes.push("in");
        this.generator = this.flowClampZeroArgBlockGenerator;
    }

    /**
     * Generates the block for flowClampZeroArgBlock.
     * @param {number} slots - The number of slots.
     * @returns {Array} - Array containing SVG elements and block dimensions.
     */
    flowClampZeroArgBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setSlot(true);
        svg.setExpand(10 + this.extraWidth, 0, 0, 0);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, 1);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.docks[1][1]
        ];
    }

    /**
     * Represents a block like count clamp: math block with interior slots.
     * E.g., count clamp: math block with interior slots
     * @constructor
     */
    argFlowClampBlock() {
        this.style = "argflowclamp";
        this.expandable = true;
        this.size = 3;
        this.args = 1;
        this.dockTypes.push("anyout");
        this.dockTypes.push("in");
        this.generator = this.argFlowClampGenerator;
    }

    /**
     * Generates the block for argFlowClampBlock.
     * @param {number} slots - The number of slots.
     * @returns {Array} - Array containing SVG elements and block dimensions.
     */
    argFlowClampGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setSlot(false);
        svg.setOutie(true);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, [1]);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.docks[1][1]
        ];
    }

    /**
     * Represents a block with a "child" flow docked in an expandable clamp, with an additional argument as a name.
     * E.g., action. A "child" flow is docked in an expandable clamp.
     * The additional argument is a name. Again, no flow above or below.
     * @constructor
     */
    stackClampOneArgBlock() {
        this.style = "clamp";
        this.expandable = true;
        this.size = 3;
        this.args = 2;
        this.dockTypes.push("unavailable");
        this.dockTypes.push("anyin");
        this.dockTypes.push("in");
        this.dockTypes.push("unavailable");
        this.generator = this.stackClampOneArgBlockGenerator;
    }

    /**
     * Generates a stack clamp block with one argument.
     * @param {number} [slots=1] - The number of slots for clamping (optional, default is 1).
     * @returns {Array} - An array containing SVG representation of the block, docks, width, height, and hit height.
     */
    stackClampOneArgBlockGenerator(slots) {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setCap(true);
        svg.setTail(true);
        svg.setInnies([true]);
        svg.setExpand(10 + this.extraWidth, 0, 0, 0);
        svg.setLabelOffset(this.labelOffset);

        if (slots) {
            svg.setClampSlots(0, slots);
        } else {
            svg.setClampSlots(0, 1);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicClamp(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.docks[2][1]
        ];
    }

    /**
     * Generates a boolean zero-argument block.
     * E.g., mouse button.
     */
    booleanZeroArgBlock() {
        this.style = "arg";
        this.size = 1;
        this.args = 0;
        this.dockTypes.push("booleanout");
        this.generator = this.booleanZeroArgBlockGenerator;
    }

    /**
     * Generates SVG representation of a boolean zero-argument block.
     * @returns {Array} - An array containing SVG representation of the block, docks, width, height, and hit height.
     */
    booleanZeroArgBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setExpand(60 + this.extraWidth, 0, 0, 4);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.booleanNot(true),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Generates a boolean one-argument block.
     * E.g., named sensor blocks
     */
    booleanOneArgBlock() {
        this.style = "arg";
        this.size = 2;
        this.args = 1;
        this.parameter = true;
        this.dockTypes.push("booleanout");
        this.dockTypes.push("textin");
        this.generator = this.booleanOneArgBlockGenerator;
    }

    /**
     * Generates SVG representation of a boolean one-argument block.
     * @returns {Array} - An array containing SVG representation of the block, docks, width, height, and hit height.
     */
    booleanOneArgBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        svg.setInnies([true]);
        return [
            svg.booleanNot(true),  // OneArg
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Generates a boolean one-argument block with a boolean input.
     * E.g., not
     */
    booleanOneBooleanArgBlock() {
        this.style = "arg";
        this.size = 2;
        this.args = 1;
        this.parameter = true;
        this.dockTypes.push("booleanout");
        this.dockTypes.push("booleanin");
        this.generator = this.booleanOneBooleanArgBlockGenerator;
    }

    /**
     * Generates SVG representation of a boolean one-argument block with a boolean input.
     * @returns {Array} - An array containing SVG representation of the block, docks, width, height, and hit height.
     */
    booleanOneBooleanArgBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.booleanNot(false),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Generates a boolean two-argument block with boolean inputs.
     * E.g., and, or
     */
    booleanTwoBooleanArgBlock() {
        this.style = "arg";
        this.size = 3;
        this.args = 2;
        this.parameter = true;
        this.dockTypes.push("booleanout");
        this.dockTypes.push("booleanin");
        this.dockTypes.push("booleanin");
        this.generator = this.booleanTwoBooleanArgBlockGenerator;
    }

    /**
     * Generates SVG representation of a boolean two-argument block with boolean inputs.
     * @returns {Array} - An array containing SVG representation of the block, docks, width, height, and hit height.
     */
    booleanTwoBooleanArgBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setExpand(20 + this.extraWidth, 0, 0, 0);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.booleanAndOr(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Represents a block with two boolean arguments.
     * E.g., greater, less, equal
     */
    booleanTwoArgBlock() {
        this.style = "arg";
        this.size = 2;
        this.args = 2;
        this.parameter = true;
        this.expandable = true;
        this.dockTypes.push("booleanout");
        this.dockTypes.push("numberin");
        this.dockTypes.push("numberin");
        this.generator = this.booleanTwoArgBlockGenerator;
    }

    /**
     * Generates the block with two boolean arguments.
     * @param {number} expandY - Expansion factor for Y dimension (optional).
     * @returns {Array} - An array containing generated SVG, docks, width, and height.
     */
    booleanTwoArgBlockGenerator(expandY) {
        const svg = new SVG();
        svg.setScale(this.scale);

        if (expandY) {
            svg.setExpand(
                10 + this.extraWidth,
                ((expandY - 1) * STANDARDBLOCKHEIGHT) / 2, 0, 0);
        } else {
            svg.setExpand(10 + this.extraWidth, 0, 0, 0);
        }

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.booleanCompare(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Represents a block with a parameter (e.g., color, shade, pensize).
     * E.g., color, shade, pensize, ...
     */
    parameterBlock() {
        this.style = "arg";
        this.parameter = true;
        this.size = 1;
        this.args = 0;
        this.dockTypes.push("numberout");
        this.generator = this.parameterBlockGenerator;
    }

    /**
     * Generates the parameter block.
     * @returns {Array} - An array containing generated SVG, docks, width, and height.
     */
    parameterBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        // Extra room for parameter label
        svg.setExpand(70 + this.extraWidth, 0, 0, 0);
        svg.setOutie(true);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        return [
            svg.basicBox(),
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }
}

/**
 * Checks if the given item is an object.
 * @param {*} item - The item to check.
 * @returns {boolean} - True if the item is an object, otherwise false.
 */
const isObject = (item) => {
    return item && typeof item === "object" && !Array.isArray(item);
};

/**
 * Merges multiple objects deeply.
 * @param {object} target - The target object to merge into.
 * @param {...object} sources - The source objects to merge from.
 * @returns {object} - The merged object.
 */
const mergeDeep = (target, ...sources) => {
    // From https://stackoverflow.com/a/34749873
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
};

/**
 * Represents a base block used as a foundation for other blocks.
 * @extends ProtoBlock
 */
class BaseBlock extends ProtoBlock {
    /**
     * Creates an instance of BaseBlock.
     * @param {string} name - The name of the block.
     */
    constructor(name) {
        super(name);

        /**
         * The macro function associated with the block.
         * @type {function|null}
         */
        this.macroFunc = null;

        /**
         * The style properties of the block.
         * @type {object}
         * @private
         */
        this._style = {};

        /**
         * Indicates if the block is designed for beginner mode.
         * @type {boolean}
         */
        this.beginnerModeBlock = false;

        /**
         * Indicates if the block is deprecated.
         * @type {boolean}
         */
        this.deprecated = false;

        /**
         * Additional search terms for the block.
         * @type {Array<string>}
         */
        this.extraSearchTerms = [];

        /**
         * Help strings associated with the block.
         * @type {Array<string>}
         */
        this.helpString = [];

        /**
         * Values for the piemenu's first column.
         * @type {Array}
         */
        this.piemenuValuesC1 = [];

        /**
         * Values for the piemenu's second column.
         * @type {Array}
         */
        this.piemenuValuesC2 = [];

        /**
         * Values for the piemenu's third column.
         * @type {Array}
         */
        this.piemenuValuesC3 = [];

        /**
         * Labels for the piemenu.
         * @type {Array}
         */
        this.piemenuLabels = [];

        // Just for brevity
        /**
         * Language preference for the block.
         * @type {string}
         */
        this.lang = localStorage.languagePreference || navigator.language;
    }

    /**
     * Sets the palette of the block.
     * @param {string} palette - The palette name.
     * @param {object} activity - The activity associated with the block.
     */
    setPalette(palette, activity) {
        this.palette = activity.palettes.dict[palette];
    }

    /**
     * Sets the help string of the block.
     * @param {Array<string>} help - The help string to set.
     */
    setHelpString(help) {
        this.helpString = help;
    }

    /**
     * Forms the block with the given style.
     * @param {object} style - The style properties of the block.
     */
    formBlock(style) {
        mergeDeep(this._style, style);
        this._style.args ||= 0;
        this._style.argTypes ||= [];
        this._style.argLabels ||= [];
        this._style.defaults ||= [];
        this._style.flows ||= {};
        this._style.flows.labels ||= [];

        if (this._style.args > 1) {
            this.expandable = true;
        }

        if (this._style.flows.labels.length > 0) {
            if (this._style.flows.type === "arg") this.style = "argclamp";
            else if (this._style.flows.type === "value") this.style = "value";
            else if (this._style.flows.labels.length == 2)
                this.style = "doubleclamp";
            else this.style = "clamp";
            this.expandable = true;
        } else {
            if (this._style.flows.type === "value") this.style = "value";
            else if (this._style.flows.left) {
                this.style = "arg";
                this.parameter = true;
            } else if (this._style.args === 2) this.style = "twoarg";
        }

        if (this._style.flows.type === "value" && this._style.args === 2)
            this.expandable = true;

        this.args = this._style.flows.labels.length + this._style.args;
        if (this.size !== 0) {
            this.size = 1 + this._style.flows.labels.length;
        }
        if (this._style.argTypes[0] === "booleanin") this.size++;
        else if (this._style.argTypes[1] === "booleanin") this.size++;
        else this.size += Math.max(0, this._style.args - 1);
        if (this._style.flows.type === "arg") this.size++;
        if (this._style.image) {
            this.size++;
            this.image = this._style.image;
        }

        this.staticLabels = [this._style.name || ""];
        this.dockTypes = [];
        this.defaults = [];
        this._style.argLabels.forEach(i => this.staticLabels.push(i));
        this._style.flows.labels.forEach(i => this.staticLabels.push(i));

        if (this._style.flows.left)
            this.dockTypes.push(this._style.outType || "numberout");
        if (this._style.flows.top)
            this.dockTypes.push(
                this._style.flows.top === "cap" ? "unavailable" : "out"
            );
        if (typeof this._style.args === "number")
            for (let i = 0; i < this._style.args; i++) {
                this.dockTypes.push(this._style.argTypes[i] || "numberin");
                if (i < this._style.defaults.length)
                    this.defaults.push(this._style.defaults[i]);
            }
        if (this._style.flows.type === "arg")
            for (let i = 0; i < this._style.flows.labels.length; i++)
                this.dockTypes.push(this._style.flows.types[i] || "numberin");
        for (let i = 0; i < this._style.flows.labels.length; i++)
            this.dockTypes.push("in");
        if (this._style.flows.bottom)
            this.dockTypes.push(
                this._style.flows.bottom === "tail" ? "unavailable" : "in"
            );

        /**
         * Generates SVG artwork and dock layout for the block.
         * @returns {Array} An array containing the SVG artwork, dock layout, width, height, and click height.
         */
        this.generator = function() {
            const svg = new SVG();
            svg.setScale(this.scale);

            if (this._style.flows.top === "cap") svg.setCap(true);
            else svg.setSlot(this._style.flows.top);

            if (this._style.flows.bottom === "tail") svg.setTail(true);
            else if (this._style.flows.bottom) svg.setTab(true);
            if (this._style.flows.left) svg.setOutie(true);

            let pad = this._style.flows.type === "value" ? 60 : 20;
            if (!this._style.flows.type) pad += 10;
            if (this._style.outType === "booleanout" && this._style.args === 2)
                pad -= 30;
            else if (this._style.argTypes[0] === "booleanin") pad -= 5;
            if (this.size !== 0)
                svg.setExpand(
                    pad + this.extraWidth,
                    this.image ? 23 : 0,
                    0,
                    this._style.outType === "booleanout" && !this._style.args
                        ? 4
                        : 0
                );

            for (
                let i = arguments.length;
                i < this._style.flows.labels.length;
                i++
            )
                svg.setClampSlots(i, 1);
            svg.setClampCount(this._style.flows.labels.length);

            for (let i = 0; i < arguments.length; i++) {
                if (this._style.flows.type == undefined) {
                    svg.setExpand(
                        30 + this.extraWidth,
                        ((arguments[arguments.length - i - 1] - 1) *
                            STANDARDBLOCKHEIGHT) /
                            2,
                        0,
                        0
                    );
                } else if (this._style.flows.type == "value") {
                    svg.setExpand(
                        60 + this.extraWidth,
                        ((arguments[arguments.length - i - 1] - 1) *
                            STANDARDBLOCKHEIGHT) /
                            2,
                        0,
                        0
                    );
                } else {
                    svg.setClampSlots(
                        i,
                        arguments[arguments.length - i - 1] || 1
                    );
                }
            }

            if (this._style.argTypes[0] === "booleanin") {
                svg.setBoolean(true);
            } else if (typeof this._style.args === "number") {
                svg.setInnies(Array(this._style.args).fill(true));
            }

            // Make space for the expand icon
            if (this._style.canCollapse) svg.setLabelOffset(15);

            if (this.fontsize) svg.setFontSize(this.fontsize);

            let artwork;
            if (this._style.flows.type === "arg") {
                artwork = svg.argClamp();
            } else if (this._style.flows.type === "flow") {
                artwork = svg.basicClamp();
            } else if (this._style.outType === "booleanout") {
                if (this._style.args === 1 || !this._style.args) {
                    artwork = svg.booleanNot(!this._style.args);
                } else if (this._style.argTypes[0] === "booleanin") {
                    artwork = svg.booleanAndOr();
                } else {
                    artwork = svg.booleanCompare();
                }
            } else if (this._style.flows.type === "value") {
                artwork = svg.basicBox();
            } else {
                artwork = svg.basicBlock();
            }
            // If the block has 0 size, clear out the artwork
            if (this.size === 0) {
                artwork =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><text style="font-size:10px;fill:#000000;font-family:sans-serif;text-anchor:end"><tspan x="46.333333333333336" y="13.5">block_label</tspan></text></svg>';
                svg.docks[1][1] = svg.docks[0][1];
            }
            let clickHeight;
            this.isLeftClamp = this.style === "clamp" &&
                this._style.flows.left == true &&
                this._style.args === 0 &&
                this._style.flows.type == "flow" ;

            if (this._style.flows.top || this._style.flows.bottom)
                clickHeight =
                    svg.docks[
                        svg.docks.length - this._style.flows.labels.length - 1
                    ][1];
            else if (this.isLeftClamp)
                clickHeight =               // special Case with no .top and .bottom .
                    svg.docks[
                        svg.docks.length - this._style.flows.labels.length
                    ][1];
            else clickHeight = svg.getHeight();
            if (this.size === 0) return [artwork, svg.docks, 0, 0, 0];

            // Special case for one argument boolean output blocks e.g found mouse
            
            if(this._style.flows.left === "bool") {
                artwork = svg.booleanNot(true); // OneArg
            }

            return [
                artwork,
                svg.docks,
                svg.getWidth(),
                svg.getHeight(),
                clickHeight
            ];
        };
    }

    /**
     * Associates a macro function with the block.
     * @param {Function} macroFunc - The macro function to associate.
     */
    makeMacro(macroFunc) {
        this.macroFunc = macroFunc;
    }

    /**
     * Updates the type of dock at the specified slot.
     * @param {number} slot - The slot index of the dock.
     * @param {string} value - The value to update the dock with.
     */
    updateDockValue(slot, value) {
        this.dockTypes[slot] = value;
    }

    /**
     * Changes the name of the block.
     * @param {string} name - The new name of the block.
     */
    changeName(name) {
        this.name = name;
    }

    /**
     * Sets whether the block is a beginner mode block or not.
     * @param {boolean} value - Indicates if the block is a beginner mode block.
     */
    beginnerBlock(value) {
        this.beginnerModeBlock = value;
    }

    /**
     * Used for blocks that need custom SVG note symbols (Apple Devices only).
     */
    appleNoteBlock() {
        this.style = "basic";
        this.size = 1;
        this.args = 0;
        this.dockTypes.push("out");
        this.dockTypes.push("in");
        this.generator = this.appleNoteBlockGenerator;
    }

    /**
     * Generates SVG for a note block with custom musical notation.
     * @returns {array} - Array containing SVG elements and dimensions.
     */
    appleNoteBlockGenerator() {
        const svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
        svg.setSlot(true);
        svg.setExpand(30 + this.extraWidth, 0, 0, 0);

        if (this.fontsize) {
            svg.setFontSize(this.fontsize);
        }

        // Get the basic block shape
        const block = svg.basicBlock();
        
        // Add the note symbol as SVG based on the block name
        let noteSymbol;
        switch(this.name) {
            case "wholeNote":
                noteSymbol = `<g transform="translate(-312.0000,-493.37592) scale(1.1)">
                    <g transform="translate(7.9606,5.6125499)" style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1">
                        <path d="m 369.80263,457.99537 q 1.104,0 1.872,0.432 0.768,0.416 0.768,1.2 0,0.752 -0.752,1.168 -0.752,0.4 -1.808,0.4 -1.104,0 -1.856,-0.416 -0.752,-0.416 -0.752,-1.232 0,-0.576 0.464,-0.944 0.48,-0.368 1.008,-0.48 0.528,-0.128 1.056,-0.128 z m -0.864,1.136 q 0,0.672 0.304,1.184 0.304,0.512 0.784,0.512 0.736,0 0.736,-0.8 0,-0.64 -0.304,-1.136 -0.288,-0.512 -0.8,-0.512 -0.72,0 -0.72,0.752 z" />
                    </g>
                </g>`;
                break;
            case "halfNote":
                noteSymbol = `<g transform="translate(-290.23523,-445.37592)">
                    <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1">
                        <path d="m 375.23523,465.70392 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-9.472 0.352,0 0,10.352 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 0.736,0.48 q 0.848,0 1.712,-0.72 0.88,-0.72 0.88,-1.072 0,-0.224 -0.192,-0.224 -0.592,0 -1.632,0.688 -1.024,0.672 -1.024,1.12 0,0.208 0.256,0.208 z" />
                    </g>
                </g>`;
                break;
            case "sixteenthNote":
                noteSymbol = `<g transform="translate(-92.21292,-422.51877)">
                    <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1">
                        <path d="m 182.21292,442.84677 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-9.472 0.336,0 q 0.064,0.56 0.4,1.088 0.352,0.512 0.8,0.944 0.448,0.416 0.88,0.864 0.448,0.432 0.752,1.024 0.304,0.576 0.304,1.232 0,0.544 -0.256,1.104 0.304,0.448 0.304,1.184 0,1.232 -0.608,2.24 l -0.384,0 q 0.56,-1.12 0.56,-2.032 0,-0.512 -0.256,-0.96 -0.24,-0.448 -0.752,-0.816 -0.496,-0.368 -0.832,-0.56 -0.32,-0.192 -0.896,-0.48 l 0,5.52 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.464,-5.904 q 0,-1.648 -2.624,-3.072 0,0.464 0.192,0.88 0.192,0.416 0.512,0.752 0.32,0.32 0.656,0.592 0.336,0.272 0.688,0.608 0.352,0.32 0.544,0.608 0.032,-0.256 0.032,-0.368 z" />
                    </g>
                </g>`;
                break;
            case "thirtysecondNote":
                noteSymbol = `<g transform="translate(-540.78433,-233.88335)">
                    <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1">
                        <path d="m 630.78433,254.27535 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-11.536 0.352,0 q 0.048,0.56 0.384,1.072 0.336,0.496 0.768,0.912 0.432,0.4 0.864,0.848 0.432,0.448 0.72,1.104 0.304,0.656 0.304,1.456 0,0.48 -0.16,1.056 0.224,0.416 0.224,0.912 0,0.512 -0.24,0.976 0.304,0.448 0.304,1.168 0,1.232 -0.608,2.24 l -0.384,0 q 0.56,-1.12 0.56,-2.032 0,-0.512 -0.256,-0.96 -0.24,-0.448 -0.752,-0.816 -0.496,-0.368 -0.832,-0.56 -0.32,-0.192 -0.896,-0.48 l 0,5.52 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.448,-7.872 q 0,-0.496 -0.208,-0.928 -0.192,-0.432 -0.64,-0.832 -0.432,-0.416 -0.784,-0.672 -0.352,-0.256 -0.976,-0.656 0.032,0.448 0.352,0.896 0.32,0.432 0.704,0.752 0.4,0.32 0.848,0.8 0.464,0.464 0.704,0.912 l 0,-0.272 z m 0,2.096 q 0,-0.4 -0.16,-0.768 -0.144,-0.368 -0.32,-0.608 -0.16,-0.256 -0.592,-0.608 -0.416,-0.352 -0.672,-0.528 -0.256,-0.176 -0.848,-0.576 0.064,0.48 0.4,0.976 0.336,0.48 0.72,0.816 0.4,0.336 0.832,0.784 0.448,0.432 0.64,0.784 l 0,-0.272 z" />
                    </g>
                </g>`;
                break;
            case "sixtyfourthNote":
                noteSymbol = `<g transform="translate(-255.3223,-318.39492)">
                    <g transform="translate(3.1093785,1.6864426)" style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1">
                        <path d="m 342.21292,337.13248 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-11.568 0.336,0 q 0.064,0.64 0.384,1.104 0.336,0.464 0.752,0.768 0.416,0.304 0.832,0.656 0.416,0.336 0.688,0.928 0.288,0.592 0.288,1.44 0,0.24 -0.144,0.768 0.256,0.608 0.256,1.376 0,0.32 -0.16,0.896 0.224,0.416 0.224,0.912 0,0.496 -0.24,0.96 0.304,0.448 0.304,1.024 0,0.384 -0.08,0.688 -0.08,0.304 -0.16,0.448 -0.08,0.144 -0.368,0.608 l -0.384,0 q 0.08,-0.16 0.192,-0.368 0.112,-0.224 0.16,-0.32 0.064,-0.096 0.112,-0.24 0.064,-0.144 0.08,-0.288 0.016,-0.144 0.016,-0.32 0,-0.272 -0.096,-0.512 -0.08,-0.256 -0.176,-0.432 -0.096,-0.192 -0.32,-0.4 -0.224,-0.208 -0.368,-0.32 -0.144,-0.128 -0.464,-0.304 -0.304,-0.192 -0.432,-0.256 -0.128,-0.064 -0.48,-0.224 -0.336,-0.176 -0.4,-0.208 l 0,4.064 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.352,-8.384 q 0,-0.352 -0.144,-0.688 -0.128,-0.352 -0.288,-0.576 -0.16,-0.224 -0.48,-0.496 -0.32,-0.272 -0.512,-0.4 -0.192,-0.144 -0.592,-0.384 -0.384,-0.24 -0.496,-0.32 0.032,0.432 0.352,0.832 0.32,0.384 0.704,0.656 0.4,0.272 0.816,0.72 0.432,0.432 0.624,0.912 0.016,-0.176 0.016,-0.256 z m 0.016,2.128 q 0,-0.208 -0.048,-0.4 -0.032,-0.192 -0.08,-0.336 -0.048,-0.16 -0.176,-0.336 -0.128,-0.176 -0.208,-0.288 -0.08,-0.112 -0.272,-0.272 -0.192,-0.176 -0.288,-0.256 -0.096,-0.08 -0.352,-0.256 -0.24,-0.176 -0.336,-0.224 -0.096,-0.064 -0.384,-0.24 -0.288,-0.192 -0.384,-0.256 0.032,0.464 0.368,0.88 0.336,0.416 0.736,0.704 0.4,0.272 0.816,0.688 0.416,0.416 0.576,0.864 0.032,-0.192 0.032,-0.272 z m -0.016,1.936 q 0,-0.848 -0.624,-1.504 -0.608,-0.672 -1.872,-1.392 0.064,0.464 0.384,0.896 0.336,0.416 0.72,0.688 0.4,0.272 0.8,0.704 0.4,0.416 0.576,0.88 0.016,-0.064 0.016,-0.272 z" />
                    </g>
                </g>`;
                break;
        }

        // Insert the note symbol after the text
        const blockWithNote = block.replace("</svg>", `${noteSymbol}</svg>`);

        return [
            blockWithNote,
            svg.docks,
            svg.getWidth(),
            svg.getHeight(),
            svg.getHeight()
        ];
    }

    /**
     * Performs setup for the block within the provided activity.
     * @param {object} activity - The activity context to set up the block in.
     */
    setup(activity) {
        activity.blocks.protoBlockDict[this.name] = this;

        if (activity.beginnerMode && !this.beginnerModeBlock) {
            this.hidden = true;
        }

        if (this._style.name) this.adjustWidthToLabel();
        if (!this.palette)
            // eslint-disable-next-line no-console
            console.warn("Block " + this.name + " was not added to a palette!");
        else this.palette.add(this);
    }
}

/**
 * Represents a block that outputs a value.
 * @extends BaseBlock
 */
class ValueBlock extends BaseBlock {
    /**
     * Creates a ValueBlock instance with the given name and optional display name.
     * @param {string} name - The name of the block.
     * @param {string} [displayName] - The display name of the block.
     */
    constructor(name, displayName) {
        super(name);
        displayName ||= undefined;

        this.formBlock(
            {
                name: displayName,
                flows: {
                    left: true,
                    type: "value"
                }
            },
            !!displayName
        );
    }
}

/**
 * Represents a block that outputs a boolean value.
 * @extends BaseBlock
 */
class BooleanBlock extends BaseBlock {
    /**
     * Creates a BooleanBlock instance with the given name.
     * @param {string} name - The name of the block.
     */
    constructor(name) {
        super(name);

        this.formBlock({
            flows: {
                left: true,
                type: "value"
            },
            outType: "booleanout"
        });
    }
}

/**
 * Represents a block that outputs a boolean sensor value.
 * @extends BaseBlock
 */
class BooleanSensorBlock extends BaseBlock {
    /**
     * Creates a BooleanSensorBlock instance with the given name and optional display name.
     * @param {string} name - The name of the block.
     * @param {string} [displayName] - The display name of the block.
     */
    constructor(name, displayName) {
        super(name);
        displayName ||= undefined;

        this.formBlock({
            name: displayName,
            flows: {
                left: true,
                type: "value"
            },
            outType: "booleanout"
        });
    }
}

/**
 * Represents a block with flow inputs and/or outputs.
 * @extends BaseBlock
 */
class FlowBlock extends BaseBlock {
    /**
     * Creates a FlowBlock instance with the given name and optional display name.
     * @param {string} name - The name of the block.
     * @param {string} [displayName] - The display name of the block.
     */
    constructor(name, displayName) {
        super(name);
        displayName ||= undefined;

        this.formBlock(
            {
                name: displayName,
                flows: {
                    top: true,
                    bottom: true
                }
            },
            !!displayName
        );
    }
}

/**
 * Represents a block with leftward flow only.
 * @extends BaseBlock
 */
class LeftBlock extends BaseBlock {
    /**
     * Creates a LeftBlock instance with the given name and optional display name.
     * @param {string} name - The name of the block.
     * @param {string} [displayName] - The display name of the block.
     */
    constructor(name, displayName) {
        super(name);
        displayName ||= undefined;

        this.formBlock(
            {
                name: displayName,
                flows: {
                    left: true,
                    type: null
                }
            },
            !!displayName
        );
    }
}

/**
 * Represents a flow clamp block.
 * @extends FlowBlock
 */
class FlowClampBlock extends FlowBlock {
    /**
     * Creates an instance of FlowClampBlock.
     * @param {string} name - The name of the block.
     */
    constructor(name) {
        super(name);

        this.extraWidth = 20;
        this.formBlock({
            flows: {
                type: "flow",
                labels: [""]
            }
        });
    }
}

/**
 * Represents a stack clamp block.
 * @extends BaseBlock
 */
class StackClampBlock extends BaseBlock {
    /**
     * Creates an instance of StackClampBlock.
     * @param {string} name - The name of the block.
     */
    constructor(name) {
        super(name);

        /**
         * Additional width for the block.
         * @type {number}
         */
        this.extraWidth = 40;
        
        this.formBlock({
            flows: {
                top: "cap",
                bottom: "tail",
                type: "flow",
                labels: [""]
            }
        });
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ProtoBlock;
}
