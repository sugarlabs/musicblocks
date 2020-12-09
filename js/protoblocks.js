// Copyright (c) 2014-19 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// The ProtoBlock class is defined in this file. Protoblocks are the
// prototypes from which Blocks are created.

// Note that protoblocks.js is largely deprecated. It is only used to
// generate palette blocks.

// Protoblock contain generic information about blocks and some
// methods common to all blocks.
class ProtoBlock {
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

    adjustWidthToLabel() {
        if (this.staticLabels.length === 0) {
            return;
        }
        let c = new createjs.Container();
        let text = new createjs.Text(
            this.staticLabels[0],
            this.fontSize + "px Sans",
            "#000000"
        );
        c.addChild(text);
        let b = c.getBounds();
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
    zeroArgBlock() {
        this.args = 0;
        this.dockTypes.push("out");
        this.dockTypes.push("in");
        this.generator = this.zeroArgBlockGenerator;
    }

    zeroArgBlockGenerator() {
        let svg = new SVG();
        svg.setScale(this.scale);
        svg.setTab(true);
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

    // E.g., hidden (used at end of clamp)
    hiddenBlockFlow() {
        this.args = 0;
        this.size = 0;
        this.dockTypes.push("out");
        this.dockTypes.push("in");
        this.generator = this.hiddenBlockFlowGenerator;
    }

    // E.g., hidden (used at end of no flow clamp)
    hiddenBlockNoFlow() {
        this.args = 0;
        this.size = 0;
        this.dockTypes.push("out");
        this.dockTypes.push("unavailable");
        this.generator = this.hiddenBlockFlowGenerator;
    }

    hiddenBlockFlowGenerator() {
        let svg = new SVG();
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
    basicBlockNoFlow() {
        this.args = 0;
        this.dockTypes.push("out");
        this.dockTypes.push("unavailable");
        this.generator = this.basicBlockNoFlowGenerator;
    }

    basicBlockNoFlowGenerator() {
        let svg = new SVG();
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
    basicBlockCollapsed() {
        this.args = 0;
        this.dockTypes.push("unavailable");
        this.dockTypes.push("unavailable");
        this.generator = this.basicBlockCollapsedGenerator;
    }

    basicBlockCollapsedGenerator() {
        let svg = new SVG();
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

    // E.g., forward, right
    oneArgBlock() {
        this.args = 1;
        this.dockTypes.push("out");
        this.dockTypes.push("numberin");
        this.dockTypes.push("in");
        this.generator = this.oneArgBlockGenerator;
    }

    oneArgBlockGenerator() {
        let svg = new SVG();
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

    // E.g., wait for
    oneBooleanArgBlock() {
        this.args = 1;
        this.size = 1;
        this.dockTypes.push("out");
        this.dockTypes.push("booleanin");
        this.dockTypes.push("in");
        this.generator = this.oneBooleanArgBlockGenerator;
    }

    oneBooleanArgBlockGenerator() {
        let svg = new SVG();
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

    // E.g., setxy. These are expandable.
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

    twoArgBlockGenerator(expandY) {
        let svg = new SVG();
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

    // E.g., ??? These are expandable.
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

    threeArgBlockGenerator(expandY) {
        let svg = new SVG();
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

    fourArgBlockGenerator(expandY) {
        let svg = new SVG();
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

    // E.g., sqrt, box
    oneArgMathBlock() {
        this.style = "arg";
        this.size = 1;
        this.args = 1;
        this.parameter = true;
        this.dockTypes.push("numberout");
        this.dockTypes.push("numberin");
        this.generator = this.oneArgMathBlockGenerator;
    }

    oneArgMathBlockGenerator() {
        let svg = new SVG();
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

    // E.g., plus, minus, multiply, divide, power,distance. These are also expandable.
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

    twoArgMathBlockGenerator(expandY) {
        let svg = new SVG();
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

    //
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

    threeArgMathBlockGenerator(expandY) {
        let svg = new SVG();
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
    // E.g., distance . Distance block will calculate geometrical distance between two pointa
    // by default (cursor x ,cursor y ) and x and y
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

    fourArgMathBlockGenerator(expandY) {
        let svg = new SVG();
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

    // E.g., number, string. Value blocks get DOM textareas associated
    // with them so their values can be edited by the user.
    valueBlock() {
        this.style = "value";
        this.size = 1;
        this.args = 0;
        this.dockTypes.push("numberout");
        this.generator = this.valueBlockGenerator;
    }

    valueBlockGenerator() {
        let svg = new SVG();
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

    // E.g., media. Media blocks invoke a chooser and a thumbnail
    // image is overlayed to represent the data associated with the
    // block.
    mediaBlock() {
        this.style = "value";
        this.size = 2;
        this.args = 0;
        this.dockTypes.push("mediaout");
        this.generator = this.mediaBlockGenerator;
    }

    mediaBlockGenerator() {
        let svg = new SVG();
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

    // E.g., start. A "child" flow is docked in an expandable clamp.
    // There are no additional arguments and no flow above or below.
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

    stackClampZeroArgBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., emptyclamp. Unlike start, there is a flow above and below.
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

    flowClampBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., repeat. Unlike action, there is a flow above and below.
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

    flowClampOneArgBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., tuplet, which takes two args plus an interior flow.
    // There is a flow above and below.
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

    flowClampTwoArgBlockGenerator(slots) {
        let svg = new SVG();
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

    flowClampThreeArgBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., do with args: innies instead of interior slots.
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

    argClampOneArgBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., calculate with args: innies instead of interior slots.
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

    argClampOneArgMathBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., named do with args: innies instead of interior slots.
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

    argClampBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., named calculate with args: innies instead of interior slots.
    argClampMathBlock() {
        this.style = "argclamparg";
        this.expandable = true;
        this.size = 3;
        this.args = 1;
        this.dockTypes.push("anyout");
        this.dockTypes.push("anyin");
        this.generator = this.argClampMathBlockGenerator;
    }

    argClampMathBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., if.  A "child" flow is docked in an expandable clamp. The
    // additional argument is a boolean. There is flow above and below.
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

    flowClampBooleanArgBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., if then else.  Two "child" flows are docked in expandable
    // clamps. The additional argument is a boolean. There is flow
    // above and below.
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

    doubleFlowClampBooleanArgBlockGenerator(bottomSlots,topSlots) {
        let svg = new SVG();
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

    // E.g., forever. Unlike start, there is flow above and below.
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

    flowClampZeroArgBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., count clamp: math block with interior slots
    argFlowClampBlock() {
        this.style = "argflowclamp";
        this.expandable = true;
        this.size = 3;
        this.args = 1;
        this.dockTypes.push("anyout");
        this.dockTypes.push("in");
        this.generator = this.argFlowClampGenerator;
    }

    argFlowClampGenerator(slots) {
        let svg = new SVG();
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

    // E.g., action. A "child" flow is docked in an expandable clamp.
    // The additional argument is a name. Again, no flow above or below.
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

    stackClampOneArgBlockGenerator(slots) {
        let svg = new SVG();
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

    // E.g., mouse button.
    booleanZeroArgBlock() {
        this.style = "arg";
        this.size = 1;
        this.args = 0;
        this.dockTypes.push("booleanout");
        this.generator = this.booleanZeroArgBlockGenerator;
    }

    booleanZeroArgBlockGenerator() {
        let svg = new SVG();
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

    // E.g., named sensor blocks
    booleanOneArgBlock() {
        this.style = "arg";
        this.size = 2;
        this.args = 1;
        this.parameter = true;
        this.dockTypes.push("booleanout");
        this.dockTypes.push("textin");
        this.generator = this.booleanOneArgBlockGenerator;
    }

    booleanOneArgBlockGenerator() {
        let svg = new SVG();
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

    // E.g., not
    booleanOneBooleanArgBlock() {
        this.style = "arg";
        this.size = 2;
        this.args = 1;
        this.parameter = true;
        this.dockTypes.push("booleanout");
        this.dockTypes.push("booleanin");
        this.generator = this.booleanOneBooleanArgBlockGenerator;
    }

    booleanOneBooleanArgBlockGenerator() {
        let svg = new SVG();
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

    // E.g., and, or
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

    booleanTwoBooleanArgBlockGenerator() {
        let svg = new SVG();
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

    // E.g., greater, less, equal
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

    booleanTwoArgBlockGenerator(expandY) {
        let svg = new SVG();
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

    // E.g., color, shade, pensize, ...
    parameterBlock() {
        this.style = "arg";
        this.parameter = true;
        this.size = 1;
        this.args = 0;
        this.dockTypes.push("numberout");
        this.generator = this.parameterBlockGenerator;
    }

    parameterBlockGenerator() {
        let svg = new SVG();
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

function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
}

function mergeDeep(target, ...sources) {
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
}

class BaseBlock extends ProtoBlock {
    constructor(name) {
        super(name);

        this.macroFunc = null;
        this._style = {};
        this.beginnerModeBlock = false;
        this.deprecated = false;
        this.extraSearchTerms = [];
        this.helpString = [];
        this.piemenuValuesC1 = [];
        this.piemenuValuesC2 = [];
        this.piemenuValuesC3 = [];

        // Just for brevity
        this.lang = localStorage.languagePreference || navigator.language;
    }

    setPalette(palette) {
        this.palette = palettes.dict[palette];
    }

    setHelpString(help) {
        this.helpString = help;
    }

    formBlock(style) {
        mergeDeep(this._style, style);
        this._style.args = this._style.args || 0;
        this._style.argTypes = this._style.argTypes || [];
        this._style.argLabels = this._style.argLabels || [];
        this._style.defaults = this._style.defaults || [];
        this._style.flows = this._style.flows || {};
        this._style.flows.labels = this._style.flows.labels || [];

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
        if (this.size === 0) {
        } else {
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

        this.generator = function() {
            let svg = new SVG();
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

    makeMacro(macroFunc) {
        this.macroFunc = macroFunc;
    }

    updateDockValue(slot, value) {
        this.dockTypes[slot] = value;
    }

    changeName(name) {
        this.name = name;
    }

    beginnerBlock(value) {
        this.beginnerModeBlock = value;
    }

    setup() {
        blocks.protoBlockDict[this.name] = this;

        if (beginnerMode && !this.beginnerModeBlock) {
            this.hidden = true;
        }

        if (this._style.name) this.adjustWidthToLabel();
        if (!this.palette)
            console.warn("Block " + this.name + " was not added to a palette!");
        else this.palette.add(this);
    }
}

class ValueBlock extends BaseBlock {
    constructor(name, displayName) {
        super(name);
        displayName = displayName || undefined;

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

class BooleanBlock extends BaseBlock {
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

class BooleanSensorBlock extends BaseBlock {
    constructor(name, displayName) {
        super(name);
        displayName = displayName || undefined;

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

class FlowBlock extends BaseBlock {
    constructor(name, displayName) {
        super(name);
        displayName = displayName || undefined;

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

class LeftBlock extends BaseBlock {
    constructor(name, displayName) {
        super(name);
        displayName = displayName || undefined;

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

class FlowClampBlock extends FlowBlock {
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

class StackClampBlock extends BaseBlock {
    constructor(name) {
        super(name);

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