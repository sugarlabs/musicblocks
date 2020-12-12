function setupPenBlocks() {
    class PurpleBlock extends FlowBlock {
        constructor() {
            super("purple", _("purple"));
            this.setPalette("pen");
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 90 }], 0, 0, [0]]
            ]);
        }
    }

    class BlueBlock extends FlowBlock {
        constructor() {
            super("blue", _("blue"));
            this.setPalette("pen");
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 70 }], 0, 0, [0]]
            ]);
        }
    }

    class GreenBlock extends FlowBlock {
        constructor() {
            super("green", _("green"));
            this.setPalette("pen");
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 40 }], 0, 0, [0]]
            ]);
        }
    }

    class YellowBlock extends FlowBlock {
        constructor() {
            super("yellow", _("yellow"));
            this.setPalette("pen");
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 20 }], 0, 0, [0]]
            ]);
        }
    }

    class OrangeBlock extends FlowBlock {
        constructor() {
            super("orange", _("orange"));
            this.setPalette("pen");
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 10 }], 0, 0, [0]]
            ]);
        }
    }

    class RedBlock extends FlowBlock {
        constructor() {
            super("red", _("red"));
            this.setPalette("pen");
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 0 }], 0, 0, [0]]
            ]);
        }
    }

    class WhiteBlock extends FlowBlock {
        constructor() {
            super("white", _("white"));
            this.setPalette("pen");
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setshade", x, y, [null, 1, null]],
                [1, ["number", { value: 100 }], 0, 0, [0]]
            ]);
        }
    }

    class BlackBlock extends FlowBlock {
        constructor() {
            super("black", _("black"));
            this.setPalette("pen");
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setshade", x, y, [null, 1, null]],
                [1, ["number", { value: 0 }], 0, 0, [0]]
            ]);
        }
    }

    class BeginFillBlock extends FlowBlock {
        constructor() {
            super("beginfill", _("begin fill"));
            this.setPalette("pen");
            this.setHelpString();
            this.hidden = true;
        }

        flow(args, logo, turtle) {
            logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.doStartFill();
        }
    }

    class EndFillBlock extends FlowBlock {
        constructor() {
            super("endfill", _("end fill"));
            this.setPalette("pen");
            this.setHelpString();
            this.hidden = true;
        }

        flow(args, logo, turtle) {
            logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.doEndFill();
        }
    }

    class FillScreenBlock extends FlowBlock {
        constructor() {
            //.TRANS: set the background color
            super("fillscreen", _("background"));
            this.setPalette("pen");
            this.setHelpString();

            this.formBlock({
                args: 3
            });
            this.hidden = true;
        }

        flow(args, logo, turtle) {
            if (args.length === 3) {
                let hue = logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.color;
                let value = logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.value;
                let chroma = logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.chroma;
                logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.doSetHue(args[0]);
                logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.doSetValue(args[1]);
                logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.doSetChroma(args[2]);
                logo.turtles.setBackgroundColor(logo.turtles.companionTurtle(turtle));
                logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.doSetHue(hue);
                logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.doSetValue(value);
                logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.doSetChroma(chroma);
                logo.svgOutput = "";
            }
        }
    }

    class GreyBlock extends ValueBlock {
        constructor() {
            super("grey", _("grey"));
            this.setPalette("pen");
            this.parameter = true;
            this.setHelpString([
                _("The Grey block returns the current pen grey value."),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.chroma);
        }

        setter(logo, value, turtle, blk) {
            let turtleObj = logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)];
            turtleObj.painter.doSetChroma(value);
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "grey"]);
            } else {
                return logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.chroma;
            }
        }
    }

    class ShadeBlock extends ValueBlock {
        constructor() {
            super("shade", _("shade"));
            this.setPalette("pen");
            this.parameter = true;
            this.setHelpString([
                _("The Shade block returns the current pen shade value."),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.value);
        }

        setter(logo, value, turtle, blk) {
            let turtleObj = logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)];
            turtleObj.painter.doSetValue(value);
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "shade"]);
            } else {
                return logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.value;
            }
        }
    }

    class ColorBlock extends ValueBlock {
        constructor() {
            super("color", _("color"));
            this.setPalette("pen");
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _("The Color block returns the current pen color."),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.color);
        }

        setter(logo, value, turtle, blk) {
            let turtleObj = logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)];
            turtleObj.painter.doSetColor(value);
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "color"]);
            } else {
                return logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.color;
            }
        }
    }

    class PenSizeBlock extends ValueBlock {
        constructor() {
            super("pensize", _("pen size"));
            this.setPalette("pen");
            this.parameter = true;
            this.setHelpString([
                _("The Pen size block returns the current pen size value."),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.stroke);
        }

        setter(logo, value, turtle, blk) {
            let turtleObj = logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)];
            turtleObj.painter.doSetPensize(value);
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "pensize"]);
            } else {
                return logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.stroke;
            }
        }
    }

    class SetFontBlock extends FlowBlock {
        constructor() {
            super("setfont", _("set font"));
            this.setPalette("pen");
            this.setHelpString([
                _("The Set font block sets the font used by the Show block."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [DEFAULTFONT],
                argTypes: ["textin"]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (typeof args[0] === "string") {
                logo.turtles.turtleList[logo.turtles.companionTurtle(turtle)].painter.doSetFont(args[0]);
            }
        }
    }

    class BackgroundBlock extends FlowBlock {
        constructor() {
            super("background", _("background"));
            this.setPalette("pen");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Background block sets the window background color."),
                "documentation",
                ""
            ]);
        }

        flow(args, logo, turtle) {
            logo.turtles.setBackgroundColor(logo.turtles.companionTurtle(turtle));
            logo.svgOutput = "";
        }
    }

    class HollowLineBlock extends FlowClampBlock {
        constructor() {
            super("hollowline");
            this.setPalette("pen");
            this.setHelpString([
                _("The Hollow line block creates a line with a hollow center."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: draw a line logo has a hollow space down its center
                name: _("hollow line")
            });

            this.makeMacro((x, y) => [
                [0, "hollowline", x, y, [null, null, 1]],
                [1, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === undefined) {
                // nothing to do
                return;
            }

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doStartHollowLine();
            }

            let listenerName = "_hollowline_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = () => {
                if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    tur.painter.doEndHollowLine();
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class FillBlock extends FlowClampBlock {
        constructor() {
            super("fill");
            this.setPalette("pen");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Fill block fills in a shape with a color."),
                "documentation",
                null,
                "fillhelp"
            ]);

            this.formBlock({
                //.TRANS: fill in as a solid color
                name: _("fill")
            });

            this.makeMacro((x, y) => [
                [0, "fill", x, y, [null, null, 1]],
                [1, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === undefined) {
                // nothing to do
                return;
            }

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                if (tur.singer.suppressOutput) {
                    let savedPenState = tur.painter.penState;
                    tur.painter.penState = false;
                    tur.painter.doStartFill();
                    tur.painter.penState = savedPenState;
                } else {
                    tur.painter.doStartFill();
                }
            }

            let listenerName = "_fill_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = () => {
                if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    if (tur.singer.suppressOutput) {
                        let savedPenState = tur.painter.penState;
                        tur.painter.penState = false;
                        tur.painter.doEndFill();
                        tur.painter.penState = savedPenState;
                    } else {
                        tur.painter.doEndFill();
                    }
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class PenUpBlock extends FlowBlock {
        constructor() {
            //.TRANS: raise up the pen so logo it does not draw when it is moved
            super("penup", _("pen up"));
            this.setPalette("pen");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Pen-up block raises the pen so that it does not draw."),
                "documentation",
                ""
            ]);
        }

        flow(args, logo, turtle, blk) {
            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doPenUp();
            }
        }
    }

    class PenDownBlock extends FlowBlock {
        constructor() {
            //.TRANS: put down the pen so logo it draws when it is moved
            super("pendown", _("pen down"));
            this.setPalette("pen");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Pen-down block lowers the pen so that it draws."),
                "documentation",
                ""
            ]);
        }

        flow(args, logo, turtle, blk) {
            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doPenDown();
            }
        }
    }

    class SetPenSizeBlock extends FlowBlock {
        constructor() {
            //.TRANS: set the width of the line drawn by the pen
            super("setpensize", _("set pen size"));
            this.setPalette("pen");
            this.piemenuValuesC1 = [1, 2, 3, 5, 10, 15, 25, 50, 100];
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Set-pen-size block changes the size of the pen."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [5]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doSetPensize(args[0]);
            }
        }
    }

    class SetTranslucencyBlock extends FlowBlock {
        constructor() {
            //.TRANS: set degree of translucence of the pen color
            super("settranslucency", _("set translucency"));
            this.setPalette("pen");
            this.piemenuValuesC1 = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
            this.setHelpString([
                _("The Set translucency block changes the opacity of the pen."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [50]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                let arg = args[0] % 101;
                let alpha = 1.0 - arg / 100;
                tur.painter.doSetPenAlpha(alpha);
            }
        }
    }

    class SetHueBlock extends FlowBlock {
        constructor() {
            super("sethue", _("set hue"));
            this.setPalette("pen");
            this.piemenuValuesC1 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
            this.setHelpString([
                _("The Set hue block changes the color of the pen."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [0]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doSetHue(args[0]);
            }
        }
    }

    class SetShadeBlock extends FlowBlock {
        constructor() {
            super("setshade", _("set shade"));
            this.setPalette("pen");
            this.piemenuValuesC1 = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Set-shade block changes the pen color from dark to light."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [50]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doSetValue(args[0]);
            }
        }
    }

    class SetGreyBlock extends FlowBlock {
        constructor() {
            //.TRANS: set the level of vividness of the pen color
            super("setgrey", _("set grey"));
            this.setPalette("pen");
            this.piemenuValuesC1 = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
            this.setHelpString([
                _("The Set grey block changes the vividness of the pen color."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [100]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doSetChroma(args[0]);
            }
        }
    }

    class SetColorBlock extends FlowBlock {
        constructor() {
            super("setcolor", _("set color"));
            this.setPalette("pen");
            this.piemenuValuesC1 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Set-color block changes the pen color."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [0]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doSetColor(args[0]);
            }
        }
    }

    new PurpleBlock().setup();
    new BlueBlock().setup();
    new GreenBlock().setup();
    new YellowBlock().setup();
    new OrangeBlock().setup();
    new RedBlock().setup();
    new WhiteBlock().setup();
    new BlackBlock().setup();
    new BeginFillBlock().setup();
    new EndFillBlock().setup();
    new FillScreenBlock().setup();
    new GreyBlock().setup();
    new ShadeBlock().setup();
    new ColorBlock().setup();
    new PenSizeBlock().setup();
    new SetFontBlock().setup();
    new BackgroundBlock().setup();
    new HollowLineBlock().setup();
    new FillBlock().setup();
    new PenDownBlock().setup();
    new PenUpBlock().setup();
    new SetPenSizeBlock().setup();
    new SetTranslucencyBlock().setup();
    new SetHueBlock().setup();
    new SetShadeBlock().setup();
    new SetGreyBlock().setup();
    new SetColorBlock().setup();
}
