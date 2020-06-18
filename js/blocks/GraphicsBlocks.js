function setupGraphicsBlocks() {
    class HeadingBlock extends ValueBlock {
        constructor() {
            //.TRANS: orientation or compass direction
            super("heading", _("heading"));
            this.setPalette("graphics");
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _("The Heading block returns the orientation of the mouse."),
                "documentation",
                ""
            ]);
        }

        setter(logo, value, turtle, blk) {
            let turtleObj = logo.turtles.turtleList[turtle];
            turtleObj.doSetHeading(value);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.turtles.turtleList[turtle].orientation);
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "heading"]);
            } else {
                return logo.turtles.turtleList[turtle].orientation;
            }
        }
    }

    class YBlock extends ValueBlock {
        constructor() {
            //.TRANS: y coordinate
            super("y");
            this.setPalette("graphics");
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _("The Y block returns the vertical position of the mouse."),
                "documentation",
                null,
                "xyhelp"
            ]);

            this.formBlock({
                name: this.lang === "ja" ? _("y3") : _("y")
            });
        }

        setter(logo, value, turtle, blk) {
            let turtleObj = logo.turtles.turtleList[turtle];
            turtleObj.doSetXY(turtleObj.x, value);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.turtles.turtleList[turtle].y);
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "y"]);
            } else {
                return logo.turtles.screenY2turtleY(
                    logo.turtles.turtleList[turtle].container.y
                );
            }
        }
    }

    class XBlock extends ValueBlock {
        constructor() {
            //.TRANS: x coordinate
            super("x");
            this.setPalette("graphics");
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _("The X block returns the horizontal position of the mouse."),
                "documentation",
                null,
                "xyhelp"
            ]);

            this.formBlock({
                name: this.lang === "ja" ? _("x3") : _("x")
            });
        }

        setter(logo, value, turtle, blk) {
            let turtleObj = logo.turtles.turtleList[turtle];
            turtleObj.doSetXY(value, turtleObj.y);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.turtles.turtleList[turtle].x);
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "x"]);
            } else {
                return logo.turtles.screenX2turtleX(
                    logo.turtles.turtleList[turtle].container.x
                );
            }
        }
    }

    class ScrollXYBlock extends FlowBlock {
        constructor() {
            //.TRANS: scroll canvas image by x, y position
            super("scrollxy", _("scroll xy"));
            this.setPalette("graphics");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Scroll XY block moves the canvas."),
                "documentation",
                null,
                "everybeathelp"
            ]);

            this.formBlock({
                args: 2,
                defaults: [100, 0],
                argLabels:
                    this.lang === "ja" ? [_("x2"), _("y2")] : [_("x"), _("y")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 2) {
                if (
                    typeof args[0] === "string" ||
                    typeof args[1] === "string"
                ) {
                    logo.errorMsg(NANERRORMSG, blk);
                } else if (logo.inMatrix) {
                    logo.pitchTimeMatrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    logo.pitchTimeMatrix.rowLabels.push(
                        logo.blocks.blockList[blk].name
                    );
                    logo.pitchTimeMatrix.rowArgs.push([args[0], args[1]]);
                } else if (logo.inNoteBlock[turtle].length > 0) {
                    logo.embeddedGraphics[turtle][
                        last(logo.inNoteBlock[turtle])
                    ].push(blk);
                } else {
                    if (logo.suppressOutput[turtle]) {
                        let savedPenState =
                            logo.turtles.turtleList[turtle].penState;
                        logo.turtles.turtleList[turtle].penState = false;
                        logo.turtles.turtleList[turtle].doScrollXY(
                            args[0],
                            args[1]
                        );
                        logo.turtles.turtleList[
                            turtle
                        ].penState = savedPenState;
                    } else {
                        logo.turtles.turtleList[turtle].doScrollXY(
                            args[0],
                            args[1]
                        );
                    }
                }
            }
        }
    }

    class ClearBlock extends FlowBlock {
        constructor() {
            //.TRANS: erase the screen and return the mice to the center position
            super("clear", _("clear"));
            this.setPalette("graphics");
            this.setHelpString();
        }

        flow(args, logo, turtle, blk) {
            if (logo.inMatrix) {
                // ignore clear block in matrix
            } else if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(blk);
            } else {
                if (logo.suppressOutput[turtle]) {
                    let savedPenState =
                        logo.turtles.turtleList[turtle].penState;
                    logo.turtles.turtleList[turtle].penState = false;
                    logo.turtles.turtleList[turtle].doSetXY(0, 0);
                    logo.turtles.turtleList[turtle].doSetHeading(0);
                    logo.turtles.turtleList[turtle].penState = savedPenState;
                } else {
                    logo.svgBackground = true;
                    logo.turtles.turtleList[turtle].doClear(true, true, true);
                }
            }
        }
    }

    class ControlPoint2Block extends FlowBlock {
        constructor() {
            super("controlpoint2");
            this.setPalette("graphics");
            this.setHelpString([
                _(
                    "The Control-point 2 block sets the second control point for the Bezier curve."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: control point in a bezier curve
                name: _("control point 2"),
                args: 2,
                defaults: [100, 25],
                argLabels:
                    this.lang === "ja" ? [_("x1"), _("y1")] : [_("x"), _("y")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 2) {
                if (
                    typeof args[0] === "string" ||
                    typeof args[1] === "string"
                ) {
                    logo.errorMsg(NANERRORMSG, blk);
                } else if (logo.inNoteBlock[turtle].length > 0) {
                    logo.embeddedGraphics[turtle][
                        last(logo.inNoteBlock[turtle])
                    ].push(blk);
                } else {
                    logo.cp2x[turtle] = args[0];
                    logo.cp2y[turtle] = args[1];
                }
            }
        }
    }

    class ControlPoint1Block extends FlowBlock {
        constructor() {
            super("controlpoint1");
            this.setPalette("graphics");
            this.setHelpString([
                _(
                    "The Control-point 1 block sets the first control point for the Bezier curve."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: control point in a bezier curve
                name: _("control point 1"),
                args: 2,
                defaults: [100, 75],
                argLabels:
                    this.lang === "ja" ? [_("x1"), _("y1")] : [_("x"), _("y")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 2) {
                if (
                    typeof args[0] === "string" ||
                    typeof args[1] === "string"
                ) {
                    logo.errorMsg(NANERRORMSG, blk);
                } else if (logo.inNoteBlock[turtle].length > 0) {
                    logo.embeddedGraphics[turtle][
                        last(logo.inNoteBlock[turtle])
                    ].push(blk);
                } else {
                    logo.cp1x[turtle] = args[0];
                    logo.cp1y[turtle] = args[1];
                }
            }
        }
    }

    class BezierBlock extends FlowBlock {
        constructor() {
            super("bezier");
            this.setPalette("graphics");
            this.setHelpString([
                _("The Bezier block draws a Bezier curve."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: Bézier curves employ at least three points to define a curve
                name: _("bezier"),
                args: 2,
                defaults: [0, 100],
                argLabels:
                    this.lang === "ja" ? [_("x1"), _("y1")] : [_("x"), _("y")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 2) {
                if (
                    typeof args[0] === "string" ||
                    typeof args[1] === "string"
                ) {
                    logo.errorMsg(NANERRORMSG, blk);
                } else if (logo.inNoteBlock[turtle].length > 0) {
                    logo.embeddedGraphics[turtle][
                        last(logo.inNoteBlock[turtle])
                    ].push(blk);
                } else {
                    if (logo.suppressOutput[turtle]) {
                        let savedPenState =
                            logo.turtles.turtleList[turtle].penState;
                        logo.turtles.turtleList[turtle].penState = false;
                        logo.turtles.turtleList[turtle].doBezier(
                            logo.cp1x[turtle],
                            logo.cp1y[turtle],
                            logo.cp2x[turtle],
                            logo.cp2y[turtle],
                            args[0],
                            args[1]
                        );
                        logo.turtles.turtleList[
                            turtle
                        ].penState = savedPenState;
                    } else {
                        logo.turtles.turtleList[turtle].doBezier(
                            logo.cp1x[turtle],
                            logo.cp1y[turtle],
                            logo.cp2x[turtle],
                            logo.cp2y[turtle],
                            args[0],
                            args[1]
                        );
                    }
                }
            }
        }
    }

    class ArcBlock extends FlowBlock {
        constructor() {
            super("arc");
            this.setPalette("graphics");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Arc block moves the mouse in a arc."),
                "documentation",
                null,
                "archelp"
            ]);

            this.formBlock({
                //.TRANS: draws a part of the circumference of a circle
                name: _("arc"),
                args: 2,
                defaults: [90, 100],
                argLabels: [_("angle"), _("radius")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 2) {
                if (
                    typeof args[0] === "string" ||
                    typeof args[1] === "string"
                ) {
                    logo.errorMsg(NANERRORMSG, blk);
                } else if (logo.inMatrix) {
                    logo.pitchTimeMatrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    logo.pitchTimeMatrix.rowLabels.push(
                        logo.blocks.blockList[blk].name
                    );
                    logo.pitchTimeMatrix.rowArgs.push([args[0], args[1]]);
                } else if (logo.inNoteBlock[turtle].length > 0) {
                    logo.embeddedGraphics[turtle][
                        last(logo.inNoteBlock[turtle])
                    ].push(blk);
                } else {
                    if (logo.suppressOutput[turtle]) {
                        let savedPenState =
                            logo.turtles.turtleList[turtle].penState;
                        logo.turtles.turtleList[turtle].penState = false;
                        logo.turtles.turtleList[turtle].doArc(args[0], args[1]);
                        logo.turtles.turtleList[
                            turtle
                        ].penState = savedPenState;
                    } else {
                        logo.turtles.turtleList[turtle].doArc(args[0], args[1]);
                    }
                }
            }
        }
    }

    class SetHeadingBlock extends FlowBlock {
        constructor() {
            //.TRANS: set compass heading
            super("setheading", _("set heading"));
            this.setPalette("graphics");
            this.setHelpString([
                _("The Set heading block sets the heading of the mouse."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [0]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 1) {
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
                    logo.turtles.turtleList[turtle].doSetHeading(args[0]);
                }
            }
        }
    }

    class SetXYBlock extends FlowBlock {
        constructor() {
            super("setxy");
            this.setPalette("graphics");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Set XY block moves the mouse to a specific position on the screen."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: set xy (Cartesian) position
                name: _("set xy"),
                args: 2,
                defaults: [0, 0],
                argLabels:
                    this.lang === "ja" ? [_("x1"), _("y1")] : [_("x"), _("y")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 2) {
                if (
                    typeof args[0] === "string" ||
                    typeof args[1] === "string"
                ) {
                    logo.errorMsg(NANERRORMSG, blk);
                } else if (logo.inMatrix) {
                    logo.pitchTimeMatrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    logo.pitchTimeMatrix.rowLabels.push(
                        logo.blocks.blockList[blk].name
                    );
                    logo.pitchTimeMatrix.rowArgs.push([args[0], args[1]]);
                } else if (logo.inNoteBlock[turtle].length > 0) {
                    logo.embeddedGraphics[turtle][
                        last(logo.inNoteBlock[turtle])
                    ].push(blk);
                } else {
                    if (logo.suppressOutput[turtle]) {
                        let savedPenState =
                            logo.turtles.turtleList[turtle].penState;
                        logo.turtles.turtleList[turtle].penState = false;
                        logo.turtles.turtleList[turtle].doSetXY(
                            args[0],
                            args[1]
                        );
                        logo.turtles.turtleList[
                            turtle
                        ].penState = savedPenState;
                    } else {
                        logo.turtles.turtleList[turtle].doSetXY(
                            args[0],
                            args[1]
                        );
                    }
                }
            }
        }
    }

    class RightBlock extends FlowBlock {
        constructor() {
            super("right");
            this.setPalette("graphics");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Right block turns the mouse to the right."),
                "documentation",
                null,
                "forwardhelp"
            ]);

            this.formBlock({
                //.TRANS: right1 and right are when turning right (clockwise)
                name: this.lang === "ja" ? _("right1") : _("right"),
                args: 1,
                defaults: [90]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 1) {
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
                    if (logo.suppressOutput[turtle]) {
                        let savedPenState =
                            logo.turtles.turtleList[turtle].penState;
                        logo.turtles.turtleList[turtle].penState = false;
                        logo.turtles.turtleList[turtle].doRight(args[0]);
                        logo.turtles.turtleList[
                            turtle
                        ].penState = savedPenState;
                    } else {
                        logo.turtles.turtleList[turtle].doRight(args[0]);
                    }
                }
            }
        }
    }

    class MLeftBlock extends FlowBlock {
        constructor() {
            super("left");
            this.setPalette("graphics");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Left block turns the mouse to the left."),
                "documentation",
                null,
                "forwardhelp"
            ]);

            this.formBlock({
                //.TRANS: left and left1 are when turning left (counter-clockwise)
                name: this.lang === "ja" ? _("left1") : _("left"),
                args: 1,
                defaults: [90]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 1) {
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
                    if (logo.suppressOutput[turtle]) {
                        let savedPenState =
                            logo.turtles.turtleList[turtle].penState;
                        logo.turtles.turtleList[turtle].penState = false;
                        logo.turtles.turtleList[turtle].doRight(-args[0]);
                        logo.turtles.turtleList[
                            turtle
                        ].penState = savedPenState;
                    } else {
                        logo.turtles.turtleList[turtle].doRight(-args[0]);
                    }
                }
            }
        }
    }

    class BackBlock extends FlowBlock {
        constructor() {
            //.TRANS: move backward (in the opposite direction of the current heading)
            super("back", _("back"));
            this.setPalette("graphics");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Back block moves the mouse backward."),
                "documentation",
                null,
                "forwardhelp"
            ]);

            this.formBlock({
                args: 1,
                defaults: [100]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 1) {
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
                    if (logo.suppressOutput[turtle]) {
                        let savedPenState =
                            logo.turtles.turtleList[turtle].penState;
                        logo.turtles.turtleList[turtle].penState = false;
                        logo.turtles.turtleList[turtle].doForward(-args[0]);
                        logo.turtles.turtleList[
                            turtle
                        ].penState = savedPenState;
                    } else {
                        logo.turtles.turtleList[turtle].doForward(-args[0]);
                    }
                }
            }
        }
    }

    class ForwardBlock extends FlowBlock {
        constructor() {
            //.TRANS: move forward (in the direction of the current heading)
            super("forward", _("forward"));
            this.setPalette("graphics");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Forward block moves the mouse forward."),
                "documentation",
                null,
                "forwardhelp"
            ]);

            this.formBlock({
                args: 1,
                defaults: [100]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 1) {
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
                    if (logo.suppressOutput[turtle]) {
                        let savedPenState =
                            logo.turtles.turtleList[turtle].penState;
                        logo.turtles.turtleList[turtle].penState = false;
                        logo.turtles.turtleList[turtle].doForward(args[0]);
                        logo.turtles.turtleList[
                            turtle
                        ].penState = savedPenState;
                    } else {
                        logo.turtles.turtleList[turtle].doForward(args[0]);
                    }
                }
            }
        }
    }

    new HeadingBlock().setup();
    new YBlock().setup();
    new XBlock().setup();
    new ScrollXYBlock().setup();
    new ClearBlock().setup();
    new ControlPoint1Block().setup();
    new ControlPoint2Block().setup();
    new BezierBlock().setup();
    new ArcBlock().setup();
    new SetHeadingBlock().setup();
    new SetXYBlock().setup();
    new RightBlock().setup();
    new MLeftBlock().setup();
    new BackBlock().setup();
    new ForwardBlock().setup();
}
