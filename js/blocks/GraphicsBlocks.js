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

   last, _, ValueBlock, FlowClampBlock, FlowBlock, MusicBlocks, Mouse,
   NOINPUTERRORMSG, NANERRORMSG, toFixed2, _THIS_IS_MUSIC_BLOCKS_
 */

/*
   Global locations
   - js/utils/utils.js
        _
   - js/protoblocks.js 
    ValueBlock, FlowClampBlock
   - js/js-export/export.js
    MusicBlocks, Mouse
   - js/logo.js
    NOINPUTERRORMSG, NANERRORMSG
   - js/utils/utils.js
   toFixed2
 */

/* exported setupGraphicsBlocks */

function setupGraphicsBlocks(activity) {
    /**
     * Represents a block for retrieving the orientation or compass direction.
     * @extends {ValueBlock}
     */
    class HeadingBlock extends ValueBlock {
        /**
         * Constructs a HeadingBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("heading", _("heading"));

            // Set the palette, activity, and beginner block for the heading block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set the help string for the heading block based on the context
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Heading block returns the orientation of the mouse."),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _("The Heading block returns the orientation of the turtle."),
                    "documentation",
                    ""
                ]);
            }
        }

        /**
         * Sets the heading value for the turtle.
         * @param {object} logo - The logo object.
         * @param {number} value - The heading value.
         * @param {object} turtle - The turtle object.
         */
        setter(logo, value, turtle) {
            const turtleObj = activity.turtles.turtleList[activity.turtles.companionTurtle(turtle)];
            turtleObj.painter.doSetHeading(value);
        }

        /**
         * Updates the parameter value for the heading block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @returns {number} - The updated heading value.
         */
        updateParameter(logo, turtle) {
            return toFixed2(
                activity.turtles.turtleList[activity.turtles.companionTurtle(turtle)].orientation
            );
        }

        /**
         * Retrieves the argument value for the heading block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @returns {number} - The heading value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "heading"]);
            } else {
                return activity.turtles.turtleList[activity.turtles.companionTurtle(turtle)]
                    .orientation;
            }
        }
    }

    /**
     * Represents a block for retrieving the vertical position (Y-coordinate).
     * @extends {ValueBlock}
     */
    class YBlock extends ValueBlock {
        /**
         * Constructs a YBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("y");

            // Set the palette, activity, and beginner block for the Y block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set the help string for the Y block based on the context
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Y block returns the vertical position of the mouse."),
                    "documentation",
                    null,
                    "xyhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Y block returns the vertical position of the turtle."),
                    "documentation",
                    null,
                    "xyhelp"
                ]);
            }

            // Form the block with specific parameters
            this.formBlock({
                name: this.lang === "ja" ? _("y3") : _("y")
            });
        }

        /**
         * Sets the Y-coordinate value for the turtle.
         * @param {object} logo - The logo object.
         * @param {number} value - The Y-coordinate value.
         * @param {object} turtle - The turtle object.
         */
        setter(logo, value, turtle) {
            const turtleObj = activity.turtles.turtleList[activity.turtles.companionTurtle(turtle)];
            turtleObj.painter.doSetXY(turtleObj.x, value);
        }

        /**
         * Updates the parameter value for the Y block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @returns {number} - The updated Y-coordinate value.
         */
        updateParameter(logo, turtle) {
            return toFixed2(
                activity.turtles.turtleList[activity.turtles.companionTurtle(turtle)].y
            );
        }

        /**
         * Retrieves the argument value for the Y block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @returns {number} - The Y-coordinate value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "y"]);
            } else {
                return activity.turtles.screenY2turtleY(
                    activity.turtles.turtleList[activity.turtles.companionTurtle(turtle)].container
                        .y
                );
            }
        }
    }

    /**
     * Represents a block for retrieving the horizontal position (X-coordinate).
     * @extends {ValueBlock}
     */
    class XBlock extends ValueBlock {
        /**
         * Constructs an XBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("x");

            // Set the palette, activity, and beginner block for the X block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set the help string for the X block based on the context
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The X block returns the horizontal position of the mouse."),
                    "documentation",
                    null,
                    "xyhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The X block returns the horizontal position of the turtle."),
                    "documentation",
                    null,
                    "xyhelp"
                ]);
            }

            // Form the block with specific parameters
            this.formBlock({
                name: this.lang === "ja" ? _("x3") : _("x")
            });
        }

        /**
         * Sets the X-coordinate value for the turtle.
         * @param {object} logo - The logo object.
         * @param {number} value - The X-coordinate value.
         * @param {object} turtle - The turtle object.
         */
        setter(logo, value, turtle) {
            const turtleObj = activity.turtles.turtleList[activity.turtles.companionTurtle(turtle)];
            turtleObj.painter.doSetXY(value, turtleObj.y);
        }

        /**
         * Updates the parameter value for the X block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @returns {number} - The updated X-coordinate value.
         */
        updateParameter(logo, turtle) {
            return toFixed2(
                activity.turtles.turtleList[activity.turtles.companionTurtle(turtle)].x
            );
        }

        /**
         * Retrieves the argument value for the X block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @returns {number} - The X-coordinate value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "x"]);
            } else {
                return activity.turtles.screenX2turtleX(
                    activity.turtles.turtleList[activity.turtles.companionTurtle(turtle)].container
                        .x
                );
            }
        }
    }

    /**
     * Represents a block for scrolling the canvas by x, y position.
     * @extends {FlowBlock}
     */
    class ScrollXYBlock extends FlowBlock {
        /**
         * Constructs a ScrollXYBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("scrollxy", _("scroll xy"));

            // Set the palette, activity, and beginner block for the Scroll XY block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);

            // Set the help string for the Scroll XY block
            this.setHelpString([
                _("The Scroll XY block moves the canvas."),
                "documentation",
                null,
                "everybeathelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                args: 2,
                defaults: [100, 0],
                argLabels: this.lang === "ja" ? [_("x2"), _("y2")] : [_("x"), _("y")]
            });
        }

        /**
         * Executes the flow of the Scroll XY block.
         * @param {number[]} args - The arguments for scrolling (x, y position).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (args.length === 2) {
                if (typeof args[0] === "string" || typeof args[1] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else if (logo.inMatrix) {
                    logo.phraseMaker.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                    logo.phraseMaker.rowArgs.push([args[0], args[1]]);
                } else if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    if (tur.singer.suppressOutput) {
                        const savedPenState =
                            activity.turtles.turtleList[activity.turtles.companionTurtle(turtle)]
                                .painter.penState;
                        activity.turtles.turtleList[
                            activity.turtles.companionTurtle(turtle)
                        ].painter.penState = false;
                        activity.turtles.turtleList[
                            activity.turtles.companionTurtle(turtle)
                        ].painter.doScrollXY(args[0], args[1]);
                        activity.turtles.turtleList[
                            activity.turtles.companionTurtle(turtle)
                        ].painter.penState = savedPenState;
                    } else {
                        activity.turtles.turtleList[
                            activity.turtles.companionTurtle(turtle)
                        ].painter.doScrollXY(args[0], args[1]);
                    }
                }
            }
        }
    }

    /**
     * Represents a block for clearing the screen and returning the turtle to the center position.
     * @extends {FlowBlock}
     */
    class ClearBlock extends FlowBlock {
        /**
         * Constructs a ClearBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("clear", _("clear"));

            // Set the palette and activity for the Clear block
            this.setPalette("graphics", activity);

            // Set the help string for the Clear block
            this.setHelpString();
        }

        /**
         * Executes the flow of the Clear block.
         * @param {number[]} args - The arguments for clearing (unused).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (logo.inMatrix) {
                // Ignore clear block in matrix
            } else if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                if (tur.singer.suppressOutput) {
                    const savedPenState = tur.painter.penState;
                    tur.painter.penState = false;
                    tur.painter.doSetXY(0, 0);
                    tur.painter.doSetHeading(0);
                    tur.painter.penState = savedPenState;
                } else {
                    logo.svgBackground = true;
                    tur.painter.doClear(true, true, true);
                }
            }
        }
    }

    /**
     * Represents a block for setting the second control point for the Bezier curve.
     * @extends {FlowBlock}
     */
    class ControlPoint2Block extends FlowBlock {
        /**
         * Constructs a ControlPoint2Block instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("controlpoint2");

            // Set the palette, activity, and help string for the Control-point 2 block
            this.setPalette("graphics", activity);
            this.setHelpString([
                _("The Control-point 2 block sets the second control point for the Bezier curve."),
                "documentation",
                ""
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("control point 2"),
                args: 2,
                defaults: [100, 25],
                argLabels: this.lang === "ja" ? [_("x1"), _("y1")] : [_("x"), _("y")]
            });
        }

        /**
         * Executes the flow of the Control-point 2 block.
         * @param {number[]} args - The arguments for the control point (x, y position).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (args.length === 2) {
                if (typeof args[0] === "string" || typeof args[1] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    tur.painter.setControlPoint2(args);
                }
            }
        }
    }

    /**
     * Represents a block for setting the first control point for the Bezier curve.
     * @extends {FlowBlock}
     */
    class ControlPoint1Block extends FlowBlock {
        /**
         * Constructs a ControlPoint1Block instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("controlpoint1");

            // Set the palette, activity, and help string for the Control-point 1 block
            this.setPalette("graphics", activity);
            this.setHelpString([
                _("The Control-point 1 block sets the first control point for the Bezier curve."),
                "documentation",
                ""
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("control point 1"),
                args: 2,
                defaults: [100, 75],
                argLabels: this.lang === "ja" ? [_("x1"), _("y1")] : [_("x"), _("y")]
            });
        }

        /**
         * Executes the flow of the Control-point 1 block.
         * @param {number[]} args - The arguments for the control point (x, y position).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (args.length === 2) {
                if (typeof args[0] === "string" || typeof args[1] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    tur.painter.setControlPoint1(args);
                }
            }
        }
    }

    /**
     * Represents a block for drawing a Bezier curve.
     * @extends {FlowBlock}
     */
    class BezierBlock extends FlowBlock {
        /**
         * Constructs a BezierBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("bezier");

            // Set the palette, activity, and help string for the Bezier block
            this.setPalette("graphics", activity);
            this.setHelpString([_("The Bezier block draws a Bezier curve."), "documentation", ""]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("bezier"),
                args: 2,
                defaults: [0, 100],
                argLabels: this.lang === "ja" ? [_("x1"), _("y1")] : [_("x"), _("y")]
            });
        }

        /**
         * Executes the flow of the Bezier block.
         * @param {number[]} args - The arguments for the Bezier curve (x, y position).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (args.length === 2) {
                if (typeof args[0] === "string" || typeof args[1] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    if (tur.singer.suppressOutput) {
                        const savedPenState = tur.painter.penState;
                        tur.painter.penState = false;
                        tur.painter.doBezier(args[0], args[1]);
                        tur.painter.penState = savedPenState;
                    } else {
                        tur.painter.doBezier(args[0], args[1]);
                    }
                }
            }
        }
    }

    /**
     * Represents a block for moving the turtle or mouse in an arc.
     * @extends {FlowBlock}
     */
    class ArcBlock extends FlowBlock {
        /**
         * Constructs an ArcBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("arc");

            // Set the palette, activity, and beginner block for the Arc block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);

            // Set piemenu values for C1 and C2
            this.piemenuValuesC1 = [
                15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270,
                285, 300, 315, 330, 345, 360
            ];
            this.piemenuValuesC2 = [25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300];

            // Set the help string for the Arc block
            this.setHelpString([
                _("The Arc block moves the turtle in an arc."),
                "documentation",
                null,
                "archelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("arc"),
                args: 2,
                defaults: [90, 100],
                argLabels: [_("angle"), _("radius")]
            });
        }

        /**
         * Executes the flow of the Arc block.
         * @param {number[]} args - The arguments for the arc (angle, radius).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            const isWrap = activity.turtles.ithTurtle(turtle).painter.wrap;

            if (args.length === 2) {
                if ((args[1] > 5000 || args[1] < -5000) && (isWrap == false || isWrap == null)) {
                    activity.errorMsg(_("Value must be within -5000 to 5000 when Wrap Mode is off."), blk);
                } else if ((args[1] > 20000 || args[1] < -20000) && isWrap == true) {
                    activity.errorMsg(_("Value must be within -20000 to 20000 when Wrap Mode is on."), blk);
                } else {
                    if (typeof args[0] === "string" || typeof args[1] === "string") {
                        activity.errorMsg(NANERRORMSG, blk);
                    } else if (logo.inMatrix) {
                        logo.phraseMaker.addRowBlock(blk);
                        if (logo.pitchBlocks.indexOf(blk) === -1) {
                            logo.pitchBlocks.push(blk);
                        }
                        logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                        logo.phraseMaker.rowArgs.push([args[0], args[1]]);
                    } else if (tur.singer.inNoteBlock.length > 0) {
                        tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                    } else {
                        if (tur.singer.suppressOutput) {
                            const savedPenState = tur.painter.penState;
                            tur.painter.penState = false;
                            tur.painter.doArc(args[0], args[1]);
                            tur.painter.penState = savedPenState;
                        } else {
                            tur.painter.doArc(args[0], args[1]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Represents a block for setting the heading of the turtle or mouse.
     * @extends {FlowBlock}
     */
    class SetHeadingBlock extends FlowBlock {
        /**
         * Constructs a SetHeadingBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("setheading", _("set heading"));

            // Set the palette, activity, and beginner block for the Set Heading block
            this.setPalette("graphics", activity);
            this.beginnerBlock(this.lang !== "ja");

            // Set piemenu values for C1
            this.piemenuValuesC1 = [
                0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330
            ];

            // Set the help string for the Set Heading block
            this.setHelpString([
                _("The Set heading block sets the heading of the turtle."),
                "documentation",
                ""
            ]);

            // Form the block with specific parameters
            this.formBlock({
                args: 1,
                defaults: [0]
            });
        }

        /**
         * Executes the flow of the Set Heading block.
         * @param {number[]} args - The arguments for the heading (angle).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (args.length === 1) {
                if (typeof args[0] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else if (logo.inMatrix) {
                    logo.phraseMaker.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                    logo.phraseMaker.rowArgs.push(args[0]);
                } else if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    tur.painter.doSetHeading(args[0]);
                }
            }
        }
    }

    /**
     * Represents a block for setting the XY position of the turtle or mouse.
     * @extends {FlowBlock}
     */
    class SetXYBlock extends FlowBlock {
        /**
         * Constructs a SetXYBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("setxy");

            // Set the palette, activity, and beginner block for the Set XY block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);

            // Set the help string for the Set XY block
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Set XY block moves the mouse to a specific position on the screen."),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _("The Set XY block moves the turtle to a specific position on the screen."),
                    "documentation",
                    ""
                ]);
            }

            // Form the block with specific parameters
            this.formBlock({
                name: _("set xy"),
                args: 2,
                defaults: [0, 0],
                argLabels: this.lang === "ja" ? [_("x1"), _("y1")] : [_("x"), _("y")]
            });
        }

        /**
         * Executes the flow of the Set XY block.
         * @param {number[]} args - The arguments for the XY position (x, y).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            const isWrap = activity.turtles.ithTurtle(turtle).painter.wrap;

            if (args.length === 2) {
                if ((args[0] > 5000 || args[1] > 5000 || args[0] < -5000 || args[1] < -5000) && (isWrap == false || isWrap == null)) {
                    activity.errorMsg(_("Value must be within -5000 to 5000 when Wrap Mode is off."), blk);
                } else if ((args[0] > 20000 || args[1] > 20000 || args[0] < -20000 || args[1] < -20000) && isWrap == true) {
                    activity.errorMsg(_("Value must be within -20000 to 20000 when Wrap Mode is on."), blk);
                } else {
                    if (typeof args[0] === "string" || typeof args[1] === "string") {
                        activity.errorMsg(NANERRORMSG, blk);
                    } else if (logo.inMatrix) {
                        logo.phraseMaker.addRowBlock(blk);
                        if (logo.pitchBlocks.indexOf(blk) === -1) {
                            logo.pitchBlocks.push(blk);
                        }
                        logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                        logo.phraseMaker.rowArgs.push([args[0], args[1]]);
                    } else if (tur.singer.inNoteBlock.length > 0) {
                        tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                    } else {
                        if (tur.singer.suppressOutput) {
                            const savedPenState = tur.painter.penState;
                            tur.painter.penState = false;
                            tur.painter.doSetXY(args[0], args[1]);
                            tur.painter.penState = savedPenState;
                        } else {
                            tur.painter.doSetXY(args[0], args[1]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Represents a block for turning the turtle or mouse to the right.
     * @extends {FlowBlock}
     */
    class RightBlock extends FlowBlock {
        /**
         * Constructs a RightBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("right");

            // Set the palette, activity, and beginner block for the Right block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);

            // Set piemenu values for C1
            this.piemenuValuesC1 = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

            // Set the help string for the Right block
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Right block turns the mouse to the right."),
                    "documentation",
                    null,
                    "forwardhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Right block turns the turtle to the right."),
                    "documentation",
                    null,
                    "forwardhelp"
                ]);
            }

            // Form the block with specific parameters
            this.formBlock({
                name: this.lang === "ja" ? _("right1") : _("right"),
                args: 1,
                defaults: [90]
            });
        }

        /**
         * Executes the flow of the Right block.
         * @param {number[]} args - The arguments for turning right (angle).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (args.length === 1) {
                if (typeof args[0] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else if (logo.inMatrix) {
                    logo.phraseMaker.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                    logo.phraseMaker.rowArgs.push(args[0]);
                } else if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    if (tur.singer.suppressOutput) {
                        const savedPenState = tur.painter.penState;
                        tur.painter.penState = false;
                        tur.painter.doRight(args[0]);
                        tur.painter.penState = savedPenState;
                    } else {
                        tur.painter.doRight(args[0]);
                    }
                }
            }
        }
    }

    /**
     * Represents a block for turning the turtle or mouse to the left.
     * @extends {FlowBlock}
     */
    class MLeftBlock extends FlowBlock {
        /**
         * Constructs an MLeftBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("left");

            // Set the palette, activity, and beginner block for the Left block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);

            // Set piemenu values for C1
            this.piemenuValuesC1 = [330, 300, 270, 240, 210, 180, 150, 120, 90, 60, 30, 0];

            // Set the help string for the Left block
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Left block turns the mouse to the left."),
                    "documentation",
                    null,
                    "forwardhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Left block turns the turtle to the left."),
                    "documentation",
                    null,
                    "forwardhelp"
                ]);
            }

            // Form the block with specific parameters
            this.formBlock({
                name: this.lang === "ja" ? _("left1") : _("left"),
                args: 1,
                defaults: [90]
            });
        }

        /**
         * Executes the flow of the Left block.
         * @param {number[]} args - The arguments for turning left (angle).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (args.length === 1) {
                if (typeof args[0] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else if (logo.inMatrix) {
                    logo.phraseMaker.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                    logo.phraseMaker.rowArgs.push(args[0]);
                } else if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    if (tur.singer.suppressOutput) {
                        const savedPenState = tur.painter.penState;
                        tur.painter.penState = false;
                        tur.painter.doRight(-args[0]);
                        tur.painter.penState = savedPenState;
                    } else {
                        tur.painter.doRight(-args[0]);
                    }
                }
            }
        }
    }

    /**
     * Represents a block for moving the turtle or mouse backward.
     * @extends {FlowBlock}
     */
    class BackBlock extends FlowBlock {
        /**
         * Constructs a BackBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("back", _("back"));

            // Set the palette, activity, and beginner block for the Back block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);

            // Set the help string for the Back block
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Back block moves the mouse backward."),
                    "documentation",
                    null,
                    "forwardhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Back block moves the turtle backward."),
                    "documentation",
                    null,
                    "forwardhelp"
                ]);
            }

            // Form the block with specific parameters
            this.formBlock({
                args: 1,
                defaults: [100]
            });
        }

        /**
         * Executes the flow of the Back block.
         * @param {number[]} args - The arguments for moving backward (distance).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            const isWrap = activity.turtles.ithTurtle(turtle).painter.wrap;

            if (args.length === 1) {
                if ((args[0] > 5000 || args[0] < -5000) && (isWrap ==  false || isWrap == null)) {
                    activity.errorMsg(_("Value must be within -5000 to 5000 when Wrap Mode is off."), blk);
                } else if ((args[0] > 20000 || args[0] < -20000) && isWrap ==  true) {
                    activity.errorMsg(_("Value must be within -20000 to 20000 when Wrap Mode is on."), blk);
                } else {
                    if (typeof args[0] === "string") {
                        activity.errorMsg(NANERRORMSG, blk);
                    } else if (logo.inMatrix) {
                        logo.phraseMaker.addRowBlock(blk);
                        if (logo.pitchBlocks.indexOf(blk) === -1) {
                            logo.pitchBlocks.push(blk);
                        }
                        logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                        logo.phraseMaker.rowArgs.push(args[0]);
                    } else if (tur.singer.inNoteBlock.length > 0) {
                        tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                    } else {
                        if (tur.singer.suppressOutput) {
                            const savedPenState = tur.painter.penState;
                            tur.painter.penState = false;
                            tur.painter.doForward(-args[0]);
                            tur.painter.penState = savedPenState;
                        } else {
                            tur.painter.doForward(-args[0]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Represents a block for moving the turtle or mouse forward.
     * @extends {FlowBlock}
     */
    class ForwardBlock extends FlowBlock {
        /**
         * Constructs a ForwardBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("forward", _("forward"));

            // Set the palette, activity, and beginner block for the Forward block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);

            // Set the help string for the Forward block
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Forward block moves the mouse forward."),
                    "documentation",
                    null,
                    "forwardhelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Forward block moves the turtle forward."),
                    "documentation",
                    null,
                    "forwardhelp"
                ]);
            }

            // Form the block with specific parameters
            this.formBlock({
                args: 1,
                defaults: [100]
            });
        }

        /**
         * Executes the flow of the Forward block.
         * @param {number[]} args - The arguments for moving forward (distance).
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            const isWrap = activity.turtles.ithTurtle(turtle).painter.wrap;

            if (args.length === 1) {
                if ((args[0] > 5000 || args[0] < -5000) && (isWrap ==  false || isWrap == null)) {
                   activity.errorMsg(_("Value must be within -5000 to 5000 when Wrap Mode is off."), blk); 
                } else if ((args[0] > 20000 || args[0] < -20000) && isWrap ==  true) {
                    activity.errorMsg(_("Value must be within -20000 to 20000 when Wrap Mode is on."), blk);
                } else {
                    if (typeof args[0] === "string") {
                        activity.errorMsg(NANERRORMSG, blk);
                    } else if (logo.inMatrix) {
                        logo.phraseMaker.addRowBlock(blk);
                        if (logo.pitchBlocks.indexOf(blk) === -1) {
                            logo.pitchBlocks.push(blk);
                        }
                        logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                        logo.phraseMaker.rowArgs.push(args[0]);
                    } else if (tur.singer.inNoteBlock.length > 0) {
                        tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                    } else {
                        if (tur.singer.suppressOutput) {
                            const savedPenState = tur.painter.penState;
                            tur.painter.penState = false;
                            tur.painter.doForward(args[0]);
                            tur.painter.penState = savedPenState;
                        } else {
                            tur.painter.doForward(args[0]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Represents a block for setting the wrap mode for graphics actions.
     * @extends {ValueBlock}
     */
    class WrapModeBlock extends ValueBlock {
        /**
         * Constructs a WrapModeBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("wrapmode");

            // Set the palette, activity, and form the block with specific parameters
            this.setPalette("graphics", activity);
            this.formBlock({ outType: "textout" });

            // Set the block as hidden
            this.hidden = true;
        }
    }

    /**
     * Represents a block for enabling or disabling screen wrapping for graphics actions.
     * @extends {FlowClampBlock}
     */
    class WrapBlock extends FlowClampBlock {
        /**
         * Constructs a WrapBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("wrap", _("wrap"));

            // Set the palette, activity, and beginner block for the Wrap block
            this.setPalette("graphics", activity);
            this.beginnerBlock(true);

            // Set the help string for the Wrap block
            this.setHelpString([
                _(
                    "The Wrap block enables or disables screen wrapping for the graphics actions within it."
                ),
                "documentation",
                null,
                "wraphelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("wrap"),
                args: 1,
                defaults: ["on"],
                argTypes: ["textin"]
            });

            // Make the block a macro with specific structure
            this.makeMacro((x, y) => [
                [0, "wrap", x, y, [null, 1, null, 2]],
                [1, ["wrapmode", { value: "on" }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the Wrap block.
         * @param {string[]} args - The arguments for setting the wrap mode ("on" or "off").
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         * @returns {Array} - An array containing the output argument and the next block number.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;
            if (args[0] === null) activity.errorMsg(NOINPUTERRORMSG, blk);

            const arg0 = args[0] === null ? "on" : args[0];
            const tur = activity.turtles.ithTurtle(turtle);
            const listenerName = "_wrap_" + turtle;
            tur.painter.wrap = arg0 === "on";

            if (blk !== undefined && blk in activity.blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.painter.wrap = null;
            };
            logo.setTurtleListener(turtle, listenerName, __listener);
            return [args[1], 1];
        }
    }

    new HeadingBlock().setup(activity);
    new YBlock().setup(activity);
    new XBlock().setup(activity);
    new WrapModeBlock().setup(activity);
    new WrapBlock().setup(activity);
    new ScrollXYBlock().setup(activity);
    new ClearBlock().setup(activity);
    new BezierBlock().setup(activity);
    new ControlPoint2Block().setup(activity);
    new ControlPoint1Block().setup(activity);
    new ArcBlock().setup(activity);
    new SetHeadingBlock().setup(activity);
    new SetXYBlock().setup(activity);
    new RightBlock().setup(activity);
    new MLeftBlock().setup(activity);
    new BackBlock().setup(activity);
    new ForwardBlock().setup(activity);
}
