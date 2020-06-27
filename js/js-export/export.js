class MusicBlocks {
    constructor() {
        this.turtle = turtles.turtleList[0];
        // this.flowList = [];
    }

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
            setTimeout(resolve, 250);
        });
    }

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
        return this.runCommand("doBezier", [
            logo.cp1x[this.turtle],
            logo.cp1y[this.turtle],
            logo.cp2x[this.turtle],
            logo.cp2y[this.turtle],
            x, y
        ]);
    }

    setBezierControlPoint1(x, y) {
        return this.runCommand(
            "_anonymous",
            () => [logo.cp1x[this.turtle], logo.cp1y[this.turtle]] = [x, y]
        );
    }

    setBezierControlPoint2(x, y) {
        return this.runCommand(
            "_anonymous",
            () => [logo.cp2x[this.turtle], logo.cp2y[this.turtle]] = [x, y]
        );
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
        return this.runCommand("_anonymous", () => logo.setBackgroundColor(turtle));
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

    // play(delay) {
    //     let timer = setInterval(() => {
    //         if (this.flowList.length) {
    //             let entry = this.flowList.shift();
    //             if (entry[0] !== "_anonymous") {
    //                 this.turtle[entry[0]](...entry[1]);
    //             } else {
    //                 entry[1]();
    //             }
    //         } else {
    //             clearInterval(timer);
    //         }
    //     }, delay);
    // }

    // goForward(steps) {
    //     if (typeof steps === "number") {
    //         steps = Math.floor(steps);
    //         this.flowList.push(["doForward", [steps]]);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof steps);
    //     }
    // }

    // goBackward(steps) {
    //     if (typeof steps === "number") {
    //         steps = Math.floor(steps);
    //         this.flowList.push(["doForward", [-steps]]);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof steps);
    //     }
    // }

    // turnLeft(degrees) {
    //     if (typeof degrees === "number") {
    //         this.flowList.push(["doRight", [-degrees]]);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof degrees);
    //     }
    // }

    // turnRight(degrees) {
    //     if (typeof degrees === "number") {
    //         this.flowList.push(["doRight", [degrees]]);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof degrees);
    //     }
    // }

    // setXY(x, y) {
    //     if (typeof x === "number" && typeof y === "number") {
    //         this.flowList.push(["doSetXY", [x, y]]);
    //     } else {
    //         throw Error(
    //             'Invalid argument: expected "number", "number" but received ' +
    //             typeof x + ", " + typeof y
    //         );
    //     }
    // }

    // setHeading(degrees) {
    //     if (typeof degrees === "number") {
    //         this.flowList.push(["doSetHeading", [degrees]]);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof degrees);
    //     }
    // }

    // drawArc(degrees, steps) {
    //     if (typeof degrees === "number" && typeof steps === "number") {
    //         this.flowList.push(["doArc", [degrees, steps]]);
    //     } else {
    //         throw Error(
    //             'Invalid argument: expected "number", "number" but received ' +
    //             typeof degrees + ", " + typeof steps
    //         );
    //     }
    // }

    // drawBezier(x, y) {
    //     if (typeof x === "number" && typeof y === "number") {
    //         this.flowList.push(["doBezier", [
    //             logo.cp1x[this.turtle],
    //             logo.cp1y[this.turtle],
    //             logo.cp2x[this.turtle],
    //             logo.cp2y[this.turtle],
    //             x, y
    //         ]]);
    //     } else {
    //         throw Error(
    //             'Invalid argument: expected "number", "number" but received ' +
    //             typeof x + ", " + typeof y
    //         );
    //     }
    // }

    // setBezierControlPoint1(x, y) {
    //     if (typeof x === "number" && typeof y === "number") {
    //         this.flowList.push([
    //             "_anonymous",
    //             () => [logo.cp1x[this.turtle], logo.cp1y[this.turtle]] = [x, y]
    //         ]);
    //     } else {
    //         throw Error(
    //             'Invalid argument: expected "number", "number" but received ' +
    //             typeof x + ", " + typeof y
    //         );
    //     }
    // }

    // setBezierControlPoint2(x, y) {
    //     if (typeof x === "number" && typeof y === "number") {
    //         this.flowList.push([
    //             "_anonymous",
    //             () => [logo.cp2x[this.turtle], logo.cp2y[this.turtle]] = [x, y]
    //         ]);
    //     } else {
    //         throw Error(
    //             'Invalid argument: expected "number", "number" but received ' +
    //             typeof x + ", " + typeof y
    //         );
    //     }
    // }

    // clear() {
    //     this.turtle.doClear(true, true, true);
    // }

    // scrollXY(x, y) {
    //     if (typeof x === "number" && typeof y === "number") {
    //         this.flowList.push(["doScrollXY", [x, y]]);
    //     } else {
    //         throw Error(
    //             'Invalid argument: expected "number", "number" but received ' +
    //             typeof x + ", " + typeof y
    //         );
    //     }
    // }

    // get X() {
    //     return logo.turtles.screenX2turtleX(this.turtle.container.x);
    // }

    // get Y() {
    //     return logo.turtles.screenX2turtleX(this.turtle.container.y);
    // }

    // get HEADING() {
    //     return this.turtle.orientation;
    // }

    // setColor(value) {
    //     if (typeof value === "number") {
    //         value = Math.floor(value);
    //         value = Math.max(0, Math.min(100, value));
    //         this.turtle.doSetColor(value);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof value);
    //     }
    // }

    // setGrey(value) {
    //     if (typeof value === "number") {
    //         value = Math.floor(value);
    //         value = Math.max(0, Math.min(100, value));
    //         this.turtle.doSetChroma(value);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof value);
    //     }
    // }

    // setShade(value) {
    //     if (typeof value === "number") {
    //         value = Math.floor(value);
    //         value = Math.max(0, Math.min(100, value));
    //         this.turtle.doSetValue(value);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof value);
    //     }
    // }

    // setHue(value) {
    //     if (typeof value === "number") {
    //         value = Math.floor(value);
    //         value = Math.max(0, Math.min(100, value));
    //         this.turtle.doSetHue(value);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof value);
    //     }
    // }

    // setTranslucency(value) {
    //     if (typeof value === "number") {
    //         value = Math.floor(value);
    //         value = Math.max(0, Math.min(100, value));
    //         this.turtle.doSetPenAlpha(value);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof value);
    //     }
    // }

    // setPenSize(value) {
    //     if (typeof value === "number") {
    //         value = Math.floor(value);
    //         value = Math.max(0, Math.min(100, value));
    //         this.turtle.doSetPenSize(value);
    //     } else {
    //         throw Error('Invalid argument: expected "number" but received ' + typeof value);
    //     }
    // }

    // penUp() {
    //     this.turtle.doPenUp();
    // }

    // penDown() {
    //     this.turtle.doPenDown();
    // }

    // fillBackground() {
    //     logo.setBackgroundColor(this.turtle);
    // }

    // setFont(font) {
    //     if (typeof font === "string") {
    //         try {
    //             this.doSetFont(font);
    //         } catch (e) {
    //             throw new Error("Font not found");
    //         }
    //     } else {
    //         throw new Error('Invalid argument: expected "string" but received ' + typeof font);
    //     }
    // }

    // get PENSIZE() {
    //     return this.turtle.stroke;
    // }

    // get COLOR() {
    //     return this.turtle.color;
    // }

    // get SHADE() {
    //     return this.turtle.value;
    // }

    // get GREY() {
    //     return this.turtle.chroma;
    // }
}