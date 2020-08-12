/**
 * @file This contains the API classes' defimitions and utilities for JavaScript based Music Blocks code.
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

/** contains list of methods corresponding to each Action class */
let methodList = {};

/**
 * Creates a JSON object that maps API actions' class name to list of corresponding methods.
 * Invoked when JSEditor is initialized.
 */
function createAPIMethodList() {
    let actionClassNames = [
        "Painter",
        // "Painter.GraphicsActions",
        // "Painter.PenActions",
        // "Singer.RhythmActions",
        // "Singer.MeterActions",
        "Singer.PitchActions",
        // "Singer.IntervalsActions",
        "Singer.ToneActions",
        "Singer.OrnamentActions",
        "Singer.VolumeActions",
        "Singer.DrumActions"
    ];
    for (let className of actionClassNames) {
        methodList[className] = [];

        if (className === "Painter") {
            for (let methodName of Object.getOwnPropertyNames(eval(className + ".prototype"))) {
                if (methodName !== "constructor" && !methodName.startsWith("_"))
                    methodList[className].push(methodName);
            }
            continue;
        }

        for (let methodName of Object.getOwnPropertyNames(eval(className))) {
            if (methodName !== "length" && methodName !== "prototype")
                methodList[className].push(methodName);
        }
    }
}

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

        let APIClassNames = [
            "GraphicsBlocksAPI",
            "PenBlocksAPI"
        ];
        for (let className of APIClassNames)
            importMembers(this, className);
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
                let cname = null;
                for (let className in methodList) {
                    if (command in methodList[className]) {
                        cname = className;
                        break;
                    }
                }

                cname = "Painter" ? this.turtle.painter : eval(cname);

                if (args === undefined || args === []) {
                    cname[command]();
                } else {
                    cname[command](...args);
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

    // ========= Getters ==========================================================================

    // ============================== GRAPHICS ================================

    get X() {
        return turtles.screenX2turtleX(this.turtle.container.x);
    }

    get Y() {
        return turtles.screenY2turtleY(this.turtle.container.y);
    }

    get HEADING() {
        return this.turtle.orientation;
    }

    // ================================ PEN ===================================

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
