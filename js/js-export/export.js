/**
 * @file This contains the API classes' defimitions for JavaScript based Music Blocks code.
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
 * Class pertaining to the Mouse (corresponding to Turtle) in JavaScript based Music Blocks programs.
 *
 * @class
 *
 * Private methods' names begin with underscore '_".
 * Unused methods' names begin with double underscore '__'.
 * Internal functions' names are in PascalCase.
 */
class Mouse {
    /**
     * @constructor
     *
     * @param {Function} flow - flow function associated with the Mouse
     */
    constructor(flow) {
        if (Mouse.MouseCount < turtles.turtleList.length) {
            this.turtle = turtles.turtleList[Mouse.MouseCount];
        } else {
            turtles.addTurtle();
            this.turtle = last(turtles.turtleList);
        }

        this.flow = flow;
        this.MB = new MusicBlocks(this.turtle);

        Mouse.MouseCount++;
        Mouse.MouseList.push(this);
    }

    /**
     * Executes the flow of the Mouse object.
     *
     * @returns {void}
     */
    run() {
        this.flow(this.MB);
    }
}

/** number of Mouse objects in program */
Mouse.MouseCount = 0;
/** Mouse objects in program */
Mouse.MouseList = [];

/**
 * Class pertaining to the execution behavior of JavaScript based Music Blocks programs.
 *
 * @class
 *
 * Private methods' names begin with underscore '_".
 * Unused methods' names begin with double underscore '__'.
 * Internal functions' names are in PascalCase.
 */
class MusicBlocks {
    /**
     * @constructor
     *
     * @param {Object} turtle - corresponding Turtle object in turtles.turtleList
     */
    constructor(turtle) {
        this.turtle = turtle;
    }

    /**
     * Executes the Music Blocks program by running all the mice.
     *
     * @returns {void}
     */
    static run() {
        for (let mouse of Mouse.MouseList) {
            mouse.run();
        }
        Mouse.MouseCount = 0;
        Mouse.MouseList = [];
    }

    /**
     * Returns a promise to run a particular instruction.
     *
     * @param {String} command - instruction method name
     * @param {[*]} args - arguments to the method
     * @returns {Promise}
     */
    runCommand(command, args) {
        return new Promise(resolve => {
            if (command === "_anonymous") {
                if (args !== undefined) args();
            } else {
                if (args === undefined || args === []) {
                    this.turtle.painter[command]();
                } else {
                    this.turtle.painter[command](...args);
                }
            }
            setTimeout(resolve, 100);
        });
    }

    /**
     * Returns a Promise for ending each flow.
     * @returns {Promise}
     */
    get ENDFLOW() {
        return new Promise(resolve => resolve());
    }

    goForward(steps) {
        return this.runCommand("doForward", [steps]);
    }

    goBackward(steps) {
        return this.runCommand("doForward", [-steps]);
    }

    turnRight(degrees) {
        return this.runCommand("doRight", [degrees]);
    }

    turnLeft(degrees) {
        return this.runCommand("doRight", [-degrees]);
    }

    setXY(x, y) {
        return this.runCommand("doSetXY", [x, y]);
    }

    setHeading(degrees) {
        return this.runCommand("doSetHeading", [degrees]);
    }

    drawArc(degrees, steps) {
        return this.runCommand("doArc", [degrees, steps]);
    }

    drawBezier(x, y) {
        return this.runCommand("doBezier", [x, y]);
    }

    setBezierControlPoint1(x, y) {
        return this.runCommand("setControlPoint1", [x, y]);
    }

    setBezierControlPoint2(x, y) {
        return this.runCommand("setControlPoint2", [x, y]);
    }

    clear() {
        return this.runCommand("doClear", [true, true, true]);
    }

    scrollXY(x, y) {
        return this.runCommand("doScrollXY", [x, y]);
    }

    get X() {
        return logo.turtles.screenX2turtleX(this.turtle.container.x);
    }

    get Y() {
        return logo.turtles.screenY2turtleY(this.turtle.container.y);
    }

    get HEADING() {
        return this.turtle.orientation;
    }

    setColor(value) {
        value = Math.max(0, Math.min(100, Math.floor(value)));
        return this.runCommand("doSetColor", [value]);
    }

    setGrey(value) {
        value = Math.max(0, Math.min(100, Math.floor(value)));
        return this.runCommand("doSetChroma", [value]);
    }

    setShade(value) {
        value = Math.max(0, Math.min(100, Math.floor(value)));
        return this.runCommand("doSetValue", [value]);
    }

    setHue(value) {
        value = Math.max(0, Math.min(100, Math.floor(value)));
        return this.runCommand("doSetHue", [value]);
    }

    setTranslucency(value) {
        value = Math.max(0, Math.min(100, Math.floor(value)));
        value = 1.0 - arg / 100;
        return this.runCommand("doSetPenAlpha", [value]);
    }

    setPensize(value) {
        value = Math.max(0, Math.min(100, Math.floor(value)));
        return this.runCommand("doSetPensize", [value]);
    }

    penUp() {
        return this.runCommand("doPenUp");
    }

    penDown() {
        return this.runCommand("doPenDown");
    }

    async fillShape(flow) {
        await this.runCommand("doStartFill");
        await flow();
        await this.runCommand("doEndFill");
        turtles.refreshCanvas();

        return this.ENDFLOW;
    }

    async hollowLine(flow) {
        await this.runCommand("doStartHollowLine");
        await flow();
        await this.runCommand("doEndHollowLine");
        turtles.refreshCanvas();

        return this.ENDFLOW;
    }

    fillBackground() {
        return this.runCommand("_anonymous", () => logo.turtles.setBackgroundColor(turtle));
    }

    setFont(fontname) {
        return this.runCommand("doSetFont", [fontname]);
    }

    get PENSIZE() {
        return this.turtle.stroke;
    }

    get COLOR() {
        return this.turtle.color;
    }

    get SHADE() {
        return this.turtle.value;
    }

    get GREY() {
        return this.turtle.chroma;
    }
}
