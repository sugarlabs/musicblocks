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
            logo.turtles.turtleList[turtle].doStartFill();
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
            logo.turtles.turtleList[turtle].doEndFill();
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
                var hue = logo.turtles.turtleList[turtle].color;
                var value = logo.turtles.turtleList[turtle].value;
                var chroma = logo.turtles.turtleList[turtle].chroma;
                logo.turtles.turtleList[turtle].doSetHue(args[0]);
                logo.turtles.turtleList[turtle].doSetValue(args[1]);
                logo.turtles.turtleList[turtle].doSetChroma(args[2]);
                logo.setBackgroundColor(turtle);
                logo.turtles.turtleList[turtle].doSetHue(hue);
                logo.turtles.turtleList[turtle].doSetValue(value);
                logo.turtles.turtleList[turtle].doSetChroma(chroma);
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
            return toFixed2(logo.turtles.turtleList[turtle].chroma);
        }

        setter(logo, value, turtle, blk) {
            var turtleObj = logo.turtles.turtleList[turtle];
            turtleObj.doSetChroma(value);
            if (logo.justCounting[turtle].length === 0) {
                logo._playbackPush(turtle, [
                    logo.previousTurtleTime[turtle],
                    "setgrey",
                    value
                ]);
            }
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "grey"]);
            } else {
                return logo.turtles.turtleList[turtle].chroma;
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
            return toFixed2(logo.turtles.turtleList[turtle].value);
        }

        setter(logo, value, turtle, blk) {
            var turtleObj = logo.turtles.turtleList[turtle];
            turtleObj.doSetValue(value);
            if (logo.justCounting[turtle].length === 0) {
                logo._playbackPush(turtle, [
                    logo.previousTurtleTime[turtle],
                    "setshade",
                    value
                ]);
            }
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "shade"]);
            } else {
                return logo.turtles.turtleList[turtle].value;
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
            return toFixed2(logo.turtles.turtleList[turtle].color);
        }

        setter(logo, value, turtle, blk) {
            var turtleObj = logo.turtles.turtleList[turtle];
            turtleObj.doSetColor(value);
            if (logo.justCounting[turtle].length === 0) {
                logo._playbackPush(turtle, [
                    logo.previousTurtleTime[turtle],
                    "setcolor",
                    value
                ]);
            }
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "color"]);
            } else {
                return logo.turtles.turtleList[turtle].color;
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
            return toFixed2(logo.turtles.turtleList[turtle].stroke);
        }

        setter(logo, value, turtle, blk) {
            var turtleObj = logo.turtles.turtleList[turtle];
            turtleObj.doSetPensize(value);
            if (logo.justCounting[turtle].length === 0) {
                logo._playbackPush(turtle, [
                    logo.previousTurtleTime[turtle],
                    "setpensize",
                    value
                ]);
            }
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "pensize"]);
            } else {
                return logo.turtles.turtleList[turtle].stroke;
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
                logo.turtles.turtleList[turtle].doSetFont(args[0]);
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
            logo.setBackgroundColor(turtle);
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

            if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                logo.turtles.turtleList[turtle].doStartHollowLine();
                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "hollowline"
                    ]);
                }
            }

            var listenerName = "_hollowline_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function() {
                if (logo.inNoteBlock[turtle].length > 0) {
                    logo.embeddedGraphics[turtle][
                        last(logo.inNoteBlock[turtle])
                    ].push(blk);
                } else {
                    logo.turtles.turtleList[turtle].doEndHollowLine();
                    if (logo.justCounting[turtle].length === 0) {
                        logo._playbackPush(turtle, [
                            logo.previousTurtleTime[turtle],
                            "hollowline"
                        ]);
                    }
                }
            };

            logo._setListener(turtle, listenerName, __listener);

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

            if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                if (logo.suppressOutput[turtle]) {
                    var savedPenState =
                        logo.turtles.turtleList[turtle].penState;
                    logo.turtles.turtleList[turtle].penState = false;
                    logo.turtles.turtleList[turtle].doStartFill();
                    logo.turtles.turtleList[turtle].penState = savedPenState;
                } else {
                    logo.turtles.turtleList[turtle].doStartFill();
                }

                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "fill"
                    ]);
                }
            }

            var listenerName = "_fill_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function() {
                if (logo.inNoteBlock[turtle].length > 0) {
                    logo.embeddedGraphics[turtle][
                        last(logo.inNoteBlock[turtle])
                    ].push(blk);
                } else {
                    if (logo.suppressOutput[turtle]) {
                        var savedPenState =
                            logo.turtles.turtleList[turtle].penState;
                        logo.turtles.turtleList[turtle].penState = false;
                        logo.turtles.turtleList[turtle].doEndFill();
                        logo.turtles.turtleList[
                            turtle
                        ].penState = savedPenState;
                    } else {
                        logo.turtles.turtleList[turtle].doEndFill();
                    }

                    if (logo.justCounting[turtle].length === 0) {
                        logo._playbackPush(turtle, [
                            logo.previousTurtleTime[turtle],
                            "fill"
                        ]);
                    }
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class PenUpBlock extends FlowBlock {
        constructor() {
            //.TRANS: riase up the pen so logo it does not draw when it is moved
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
            if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                logo.turtles.turtleList[turtle].doPenUp();
                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "penup"
                    ]);
                }
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
            if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                logo.turtles.turtleList[turtle].doPenDown();
                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "pendown"
                    ]);
                }
            }
        }
    }

    class SetPenSizeBlock extends FlowBlock {
        constructor() {
            //.TRANS: set the width of the line drawn by the pen
            super("setpensize", _("set pen size"));
            this.setPalette("pen");
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

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.pitchTimeMatrix.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.pitchTimeMatrix.rowArgs.push(args[0]);
            } else if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                logo.turtles.turtleList[turtle].doSetPensize(args[0]);
                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "setpensize",
                        args[0]
                    ]);
                }
            }
        }
    }

    class SetTranslucencyBlock extends FlowBlock {
        constructor() {
            //.TRANS: set degree of translucence of the pen color
            super("settranslucency", _("set translucency"));
            this.setPalette("pen");
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

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.pitchTimeMatrix.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.pitchTimeMatrix.rowArgs.push(args[0]);
            } else if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                var arg = args[0] % 101;
                var alpha = 1.0 - arg / 100;
                logo.turtles.turtleList[turtle].doSetPenAlpha(alpha);
                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "settranslucency",
                        arg
                    ]);
                }
            }
        }
    }

    class SetHueBlock extends FlowBlock {
        constructor() {
            super("sethue", _("set hue"));
            this.setPalette("pen");
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

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.pitchTimeMatrix.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.pitchTimeMatrix.rowArgs.push(args[0]);
            } else if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                logo.turtles.turtleList[turtle].doSetHue(args[0]);
                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "sethue",
                        args[0]
                    ]);
                }
            }
        }
    }

    class SetShadeBlock extends FlowBlock {
        constructor() {
            super("setshade", _("set shade"));
            this.setPalette("pen");
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

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.pitchTimeMatrix.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.pitchTimeMatrix.rowArgs.push(args[0]);
            } else if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                logo.turtles.turtleList[turtle].doSetValue(args[0]);
                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "setshade",
                        args[0]
                    ]);
                }
            }
        }
    }

    class SetGreyBlock extends FlowBlock {
        constructor() {
            //.TRANS: set the level of vividness of the pen color
            super("setgrey", _("set grey"));
            this.setPalette("pen");
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

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.pitchTimeMatrix.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.pitchTimeMatrix.rowArgs.push(args[0]);
            } else if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                logo.turtles.turtleList[turtle].doSetChroma(args[0]);
                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "setgrey",
                        args[0]
                    ]);
                }
            }
        }
    }

    class SetColorBlock extends FlowBlock {
        constructor() {
            super("setcolor", _("set color"));
            this.setPalette("pen");
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

            if (typeof args[0] === "string") {
                logo.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.pitchTimeMatrix.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.pitchTimeMatrix.rowArgs.push(args[0]);
            } else if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                logo.turtles.turtleList[turtle].doSetColor(args[0]);
                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [
                        logo.previousTurtleTime[turtle],
                        "setcolor",
                        args[0]
                    ]);
                }
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
    new PenUpBlock().setup();
    new PenDownBlock().setup();
    new SetPenSizeBlock().setup();
    new SetTranslucencyBlock().setup();
    new SetHueBlock().setup();
    new SetShadeBlock().setup();
    new SetGreyBlock().setup();
    new SetColorBlock().setup();
}
