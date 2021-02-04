/**
 * @file This contains the API classes' definitions and utilities for JavaScript based Music Blocks code.
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
 *
 * Private methods' names begin with underscore '_".
 * Unused methods' names begin with double underscore '__'.
 * Internal functions' names are in PascalCase.
 */

/**
 * @class
 * @classdesc pertains to the Mouse (corresponding to Turtle) in JavaScript based Music Blocks programs.
 */

/*global JSEditor, turtles, last, importMembers, logo, Singer, JSInterface*/
class Mouse {
    /** Mouse objects in program */
    static MouseList = [];
    /** maps Turtle object (turtle ID) to Mouse object */
    static TurtleMouseMap = {};
    /** list of Turtle objects created by JavaScript based Music Blocks programs */
    static AddedTurtles = [];

    /**
     * @constructor
     * @param {Function} flow - flow function associated with the Mouse
     */
    constructor(flow) {
        if (Mouse.MouseList.length < turtles.turtleList.length) {
            this.turtle = turtles.turtleList[Mouse.MouseList.length];
        } else {
            turtles.addTurtle();
            this.turtle = last(turtles.turtleList);
            Mouse.AddedTurtles.push(this.turtle);
        }

        this.turtle.initTurtle(false);

        this.flow = flow;
        // eslint-disable-next-line no-use-before-define
        this.MB = new MusicBlocks(this); // associate a MusicBlocks object with each Mouse

        Mouse.MouseList.push(this);
        Mouse.TurtleMouseMap[this.turtle.id] = this;
    }

    /**
     * Returns corresponding Mouse object from a Turtle object.
     *
     * @static
     * @param {Object} turtle - Turtle object
     * @returns {Object|null} Mouse object
     */
    static getMouseFromTurtle(turtle) {
        return turtle.id in Mouse.TurtleMouseMap ? Mouse.TurtleMouseMap[turtle.id] : null;
    }

    /**
     * Executes the flow of the Mouse object.
     * @returns {void}
     */
    run() {
        this.turtle.doWait(0);
        this.flow(this.MB);
    }
}

/**
 * @class
 * @classdesc pertains to the execution behavior of JavaScript based Music Blocks programs.
 */
class MusicBlocks {
    /** contains list of methods corresponding to each Action class */
    static _methodList = {};
    /** custom block numbers for JavaScript based Music Blocks programs */
    static _blockNo = -1;
    /** whether program is running */
    static isRun = false;

    /**
     * @constructor
     * @param {Object} mouse - corresponding Mouse object in Mouse.MouseList
     */
    constructor(mouse) {
        this.mouse = mouse;
        this.turtle = mouse.turtle;
        this.turIndex = turtles.turtleList.indexOf(this.turtle);

        this.listeners = [];

        if (MusicBlocks._blockNo === -1) {
            MusicBlocks._blockNo = 0;
        }

        [
            "GraphicsBlocksAPI",
            "PenBlocksAPI",
            "RhythmBlocksAPI",
            "MeterBlocksAPI",
            "PitchBlocksAPI",
            "IntervalsBlocksAPI",
            "ToneBlocksAPI",
            "OrnamentBlocksAPI",
            "VolumeBlocksAPI",
            "DrumBlocksAPI",
            "DictBlocksAPI"
        ].forEach((className) => importMembers(this, className));
    }

    /**
     * Returns the next custom block number.
     *
     * @static
     * @returns {String} block number
     */
    static get BLK() {
        return "B" + MusicBlocks._blockNo++;
    }

    /**
     * Initializes the JavaScript based Music BLocks program's global state at start and end of run.
     *
     * @static
     * @param {Boolean} start - whether starting to run
     */
    static init(start) {
        /**
         * Creates a JSON object that maps API actions' class name to list of corresponding methods.
         * Invoked at start of run.
         * @returns {void}
         */
        function CreateAPIMethodList() {
            [
                "Painter",
                // "Painter.GraphicsActions",
                // "Painter.PenActions",
                "Singer.RhythmActions",
                "Singer.MeterActions",
                "Singer.PitchActions",
                "Singer.IntervalsActions",
                "Singer.ToneActions",
                "Singer.OrnamentActions",
                "Singer.VolumeActions",
                "Singer.DrumActions",
                "Turtle.DictActions"
            ].forEach((className) => {
                MusicBlocks._methodList[className] = [];

                if (className === "Painter") {
                    for (const methodName of Object.getOwnPropertyNames(
                        eval(className + ".prototype")
                    )) {
                        if (methodName !== "constructor" && !methodName.startsWith("_"))
                            MusicBlocks._methodList[className].push(methodName);
                    }
                    return;
                }

                for (const methodName of Object.getOwnPropertyNames(eval(className))) {
                    if (methodName !== "length" && methodName !== "prototype")
                        MusicBlocks._methodList[className].push(methodName);
                }
            });
        }

        if (start) {
            MusicBlocks.isRun = true;
            CreateAPIMethodList();
        } else {
            MusicBlocks.isRun = false;
            MusicBlocks._methodList = {};
        }

        for (const turtle of Mouse.AddedTurtles) {
            turtle.container.visible = false;
            turtle.inTrash = true;
            const turIndex = turtles.turtleList.indexOf(turtle);
            turtles.turtleList.splice(turIndex, 1);
        }

        MusicBlocks._blockNo = -1;

        Mouse.MouseList = [];
        Mouse.TurtleMouseMap = {};
    }

    /**
     * Executes the Music Blocks program by running all the mice.
     *
     * @static
     * @returns {void}
     */
    static run() {
        // Remove any listeners that might be still active
        for (const mouse of Mouse.MouseList) {
            for (const listener in mouse.turtle.listeners) {
                logo.stage.removeEventListener(listener, mouse.turtle.listeners[listener], false);
            }
            mouse.turtle.listeners = {};
        }

        logo.prepSynths();
        logo.firstNoteTime = null;

        Mouse.MouseList.forEach((mouse) => mouse.run());
    }

    /**
     * Returns a promise to run a particular instruction.
     *
     * @param {String} command - instruction method name
     * @param {[*]} args - arguments to the method
     * @returns {Promise}
     */
    runCommand(command, args) {
        return new Promise((resolve) => {
            let returnVal;

            if (command === "_anonymous") {
                if (args !== undefined) args();
            } else {
                let cname = null;
                for (const className in MusicBlocks._methodList) {
                    if (MusicBlocks._methodList[className].indexOf(command) !== -1) {
                        cname = className;
                        break;
                    }
                }

                cname = cname === "Painter" ? this.turtle.painter : eval(cname);

                returnVal =
                    args === undefined || args === [] ? cname[command]() : cname[command](...args);
            }

            const delay = this.turtle.waitTime;
            this.turtle.doWait(0);
            setTimeout(() => resolve(returnVal), delay);
        });
    }

    /**
     * Returns a Promise for ending each flow.
     * @returns {Promise}
     */
    get ENDFLOW() {
        return new Promise((resolve) => resolve());
    }

    /**
     * Returns a Promise for ending a clamp block command.
     * Executes the listener created at the initiation of the corresponding command.
     * @returns {Promise}
     */
    get ENDFLOWCOMMAND() {
        return new Promise((resolve) => {
            const signal = this.listeners.pop();
            if (signal !== null && signal !== undefined) {
                logo.stage.dispatchEvent(signal);
            }

            const delay = this.turtle.waitTime;
            this.turtle.doWait(0);
            setTimeout(resolve, delay);
        });
    }

    /**
     * Returns a Promise for ending a mouse flow.
     * @returns {Promise}
     */
    get ENDMOUSE() {
        return new Promise((resolve) => {
            Mouse.MouseList.splice(Mouse.MouseList.indexOf(this.mouse), 1);
            if (Mouse.MouseList.length === 0) MusicBlocks.init(false);

            resolve();
        });
    }

    // ========= Special Instructions ==============================================================

    print(message) {
        JSEditor.logConsole(
            `Mouse "${this.turtle.name}" (${turtles.turtleList.indexOf(this.turtle)}): ${message}`
        );
        if (message === undefined) {
            logo.textMsg("undefined");
        } else if (message === null) {
            logo.textMsg("null");
        } else {
            logo.textMsg(message.toString());
        }
    }

    // ========= Getters/Setters ===================================================================

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
        return this.turtle.painter.stroke;
    }

    get COLOR() {
        return this.turtle.painter.color;
    }

    get SHADE() {
        return this.turtle.painter.value;
    }

    get GREY() {
        return this.turtle.painter.chroma;
    }

    // ============================== RHYTHM ==================================

    get NOTEVALUE() {
        return Singer.RhythmActions.getNoteValue(this.turIndex);
    }

    // ============================== METER ===================================

    set PICKUP(value) {
        const args = JSInterface.validateArgs("PICKUP", [value]);
        Singer.MeterActions.setPickup(args[0], this.turIndex);
    }

    get WHOLENOTESPLAYED() {
        return Singer.MeterActions.getWholeNotesPlayed(this.turIndex);
    }

    get BEATCOUNT() {
        return Singer.MeterActions.getBeatCount(this.turIndex);
    }

    get MEASURECOUNT() {
        return Singer.MeterActions.getMeasureCount(this.turIndex);
    }

    get BPM() {
        return Singer.MeterActions.getBPM(this.turIndex);
    }

    get BEATFACTOR() {
        return Singer.MeterActions.getBeatFactor(this.turIndex);
    }

    get CURRENTMETER() {
        return Singer.MeterActions.getCurrentMeter(this.turIndex);
    }

    // ============================== PITCH ===================================

    get SCALARCHANGEINPITCH() {
        return Singer.PitchActions.deltaPitch("deltapitch2", this.turIndex);
    }

    get CHANGEINPITCH() {
        return Singer.PitchActions.deltaPitch("deltapitch", this.turIndex);
    }

    get SCALARSTEPUP() {
        return Singer.PitchActions.consonantStepSize("up", this.turIndex);
    }

    get SCALARSTEPDOWN() {
        return Singer.PitchActions.consonantStepSize("down", this.turIndex);
    }

    // ============================ INTERVALS =================================

    set MOVEABLEDO(moveable) {
        const args = JSInterface.validateArgs("MOVEABLEDO", [moveable]);
        Singer.IntervalsActions.setMoveableDo(args[0], this.turIndex);
    }

    get CURRENTKEY() {
        return Singer.IntervalsActions.getCurrentKey(this.turIndex);
    }

    get CURRENTMODE() {
        return Singer.IntervalsActions.getCurrentMode(this.turIndex);
    }

    get MODELENGTH() {
        return Singer.IntervalsActions.getModeLength(this.turIndex);
    }

    // ============================== VOLUME ==================================

    set PANNING(value) {
        const args = JSInterface.validateArgs("PANNING", [value]);
        Singer.VolumeActions.setPanning(args[0], this.turIndex);
    }

    set MASTERVOLUME(volume) {
        const args = JSInterface.validateArgs("MASTERVOLUME", [volume]);
        Singer.VolumeActions.setMasterVolume(args[0], this.turIndex);
    }

    get MASTERVOLUME() {
        return Singer.VolumeActions.masterVolume;
    }
}
