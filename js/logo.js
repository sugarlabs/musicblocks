// Copyright (c) 2014,2015 Walter Bender
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// (at your option) any later version.
//
// You should have received a copy of the GNU General Public License
// along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

var DEFAULTDELAY = 500; // milleseconds
var TURTLESTEP = -1;  // Run in step-by-step mode

var NOMICERRORMSG = 'The microphone is not available.';
var NANERRORMSG = 'Not a number.';
var NOSTRINGERRORMSG = 'Not a string.';
var NOBOXERRORMSG = 'Cannot find box';
var NOACTIONERRORMSG = 'Cannot find action.';
var NOINPUTERRORMSG = 'Missing argument.';
var NOSQRTERRORMSG = 'Cannot take square root of negative number.';
var ZERODIVIDEERRORMSG = 'Cannot divide by zero.';
var EMPTYHEAPERRORMSG = 'empty heap.';

function Logo(matrix, canvas, blocks, turtles, stage, refreshCanvas, textMsg, errorMsg,
              hideMsgs, onStopTurtle, onRunTurtle, prepareExport, getStageX,
              getStageY, getStageMouseDown, getCurrentKeyCode,
              clearCurrentKeyCode, meSpeak, saveLocally) {

    this.canvas = canvas;
    this.blocks = blocks;
    this.turtles = turtles;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;
    this.textMsg = textMsg;
    this.errorMsg = errorMsg;
    this.hideMsgs = hideMsgs;
    this.onStopTurtle = onStopTurtle;
    this.onRunTurtle = onRunTurtle;
    this.prepareExport = prepareExport;
    this.getStageX = getStageX;
    this.getStageY = getStageY;
    this.getStageMouseDown = getStageMouseDown;
    this.getCurrentKeyCode = getCurrentKeyCode;
    this.clearCurrentKeyCode = clearCurrentKeyCode;
    this.meSpeak = meSpeak;
    this.saveLocally = saveLocally;

    this.evalFlowDict = {};
    this.evalArgDict = {};
    this.evalParameterDict = {};
    this.evalSetterDict = {};
    this.eventList = {};

    this.boxes = {};
    this.actions = {};

    this.time = 0;
    this.waitTimes = {};
    this.turtleDelay = 0;
    this.sounds = [];
    this.cameraID = null;
    this.stopTurtle = false;
    this.lastKeyCode = null;
    this.saveTimeout = 0;

    // Matrix
    this.octave = 4;
    this.showMatrix = false;
    this.notation = false;
    this.sharp = false;
    this.flat = false;
    this.flatClampCount = 0;
    this.sharpClampCount = 0;
    this.notesList = [];
    this.inNote = false;
    this.noteBlockNotes = [];
    this.noteBlockOct = [];

    this.multiplyBeatValueBy = 1;
    this.divideBeatValueBy = 1;

    //tuplet
    this.tuplet = 0;
    this.tupletParam = [];
    this.tupletRhythmCount = 0;
    this.rhythmInsideTuplet = 0;

    //notations
    this.num = 3;
    this.deno = 4;

    this.polySynth = new Tone.PolySynth(6, Tone.AMSynth).toMaster();
                
    //Play with chunks
    this.chunktranspose = false;

    //tone
    this.startTime = 0;
    this.stopTime = 1000;

    // When running in step-by-step mode, the next command to run is
    // queued here.
    this.stepQueue = {};
    this.unhighlightStepQueue = {};

    this.svgOutput = '<rect x="0" y="0" height="' + this.canvas.height + '" width="' + this.canvas.width + '" fill="' + body.style.background + '"/>\n';

    this.turtleOscs = {};
    this.noteOscs = {};

    this.setTurtleDelay = function(turtleDelay) {
        this.turtleDelay = turtleDelay;
    }

    this.step = function() {
        // Take one step for each turtle in excuting Logo commands.
        for (turtle in this.stepQueue) {
            if (this.stepQueue[turtle].length > 0) {
                if (turtle in this.unhighlightStepQueue && this.unhighlightStepQueue[turtle] != null) {
                    this.blocks.unhighlight(this.unhighlightStepQueue[turtle]);
                    this.unhighlightStepQueue[turtle] = null;
                }
                var blk = this.stepQueue[turtle].pop();
                if (blk != null) {
                    this.runFromBlockNow(this, turtle, blk);
                }
            }
        }
    }

    this.doStopTurtle = function() {
        // The stop button was pressed. Stop the turtle and clean up a
        // few odds and ends.
        this.stopTurtle = true;
        this.turtles.markAsStopped();

        for (var sound in this.sounds) {
            this.sounds[sound].stop();
        }
        this.sounds = [];
        
        Tone.Transport.stop();

        if (this.cameraID != null) {
            doStopVideoCam(this.cameraID, this.setCameraID);
        }

        this.onStopTurtle();
        this.blocks.bringToTop();

        this.stepQueue = {};
        this.unhighlightQueue = {};
    }

    this.clearParameterBlocks = function() {
        for (var blk in this.blocks.blockList) {
            if (this.blocks.blockList[blk].parameter) {
                this.blocks.blockList[blk].text.text = '';
                this.blocks.blockList[blk].container.updateCache();
            }
        }
        this.refreshCanvas();
    }

    this.updateParameterBlock = function(logo, turtle, blk) {
        // Update the label on parameter blocks.
        if (this.blocks.blockList[blk].protoblock.parameter) {
            var name = this.blocks.blockList[blk].name;
            var value = 0;
            switch (name) {
                case 'and':
                case 'or':
                case 'not':
                case 'less':
                case 'greater':
                case 'equal':
                    if (this.blocks.blockList[blk].value) {
                        value = _('true');
                    } else {
                        value = _('false');
                    }
                    break;
                case 'random':
                case 'mod':
                case 'sqrt':
                case 'int':
                case 'plus':
                case 'minus':
                case 'multiply':
                case 'divide':
                    value = this.blocks.blockList[blk].value;
                    break;
                case 'namedbox':
                    var name = this.blocks.blockList[blk].privateData;
                    if (name in this.boxes) {
                        value = this.boxes[name];
                    } else {
                        this.errorMsg(NOBOXERRORMSG, blk, name);
                    }
                    break;
                case 'box':
                    var cblk = this.blocks.blockList[blk].connections[1];
                    var boxname = this.parseArg(logo, turtle, cblk, blk);
                    if (boxname in this.boxes) {
                        value = this.boxes[boxname];
                    } else {
                        this.errorMsg(NOBOXERRORMSG, blk, boxname);
                    }
                    break;
                case 'x':
                    value = this.turtles.turtleList[turtle].x;
                    break;
                case 'y':
                    value = this.turtles.turtleList[turtle].y;
                    break;
                case 'heading':
                    value = this.turtles.turtleList[turtle].orientation;
                    break;
                case 'color':
                case 'hue':
                    value = this.turtles.turtleList[turtle].color;
                    break;
                case 'shade':
                    value = this.turtles.turtleList[turtle].value;
                    break;
                case 'grey':
                    value = this.turtles.turtleList[turtle].chroma;
                    break;
                case 'pensize':
                    value = this.turtles.turtleList[turtle].stroke;
                    break;
                case 'time':
                    var d = new Date();
                    value = (d.getTime() - this.time) / 1000;
                    break;
                case 'mousex':
                    value = this.getStageX();
                    break;
                case 'mousey':
                    value = this.getStageY();
                    break;
                case 'keyboard':
                    value = this.lastKeyCode;
                    break;
                case 'loudness':
                    if (logo.mic == null) {
                        logo.errorMsg(NOMICERRORMSG);
                        value = 0;
                    } else {
                        value = Math.round(logo.mic.getLevel() * 1000);
                    }
                    break;
                default:
                    if (name in this.evalParameterDict) {
                        eval(this.evalParameterDict[name]);
                    } else {
                        return;
                    }
                    break;
            }
            if (typeof(value) == 'string') {
                if (value.length > 6) {
                    value = value.substr(0, 5) + '...';
                }
                this.blocks.blockList[blk].text.text = value;
            } else {
                this.blocks.blockList[blk].text.text = Math.round(value).toString();
            }
            this.blocks.blockList[blk].container.updateCache();
            this.refreshCanvas();
        }
    }

    this.runLogoCommands = function(startHere) {
        // Save the state before running.
        //console.log("name name " + this.blocks.blockList[startHere].name);
        if startHere && this.blocks.blockList[startHere].name.substring(0,15) != 'namedsavematrix' && this.blocks.blockList[startHere].name != 'showmatrix') {
           this.saveLocally();
        }
        this.stopTurtle = false;
        this.blocks.unhighlightAll();
        this.blocks.bringToTop(); // Draw under blocks.

        this.hideMsgs();

        // We run the Logo commands here.
        var d = new Date();
        this.time = d.getTime();

        // Each turtle needs to keep its own wait time.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.waitTimes[turtle] = 0;
        }

        // Remove any listeners that might be still active
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            for (var listener in this.turtles.turtleList[turtle].listeners) {
                console.log('removing listener ' + listener);
                this.stage.removeEventListener(listener, this.turtles.turtleList[turtle].listeners[listener], false);
            }
            this.turtles.turtleList[turtle].listeners = {};
        }

        // First we need to reconcile the values in all the value
        // blocks with their associated textareas.
        for (var blk = 0; blk < this.blocks.blockList.length; blk++) {
            if (this.blocks.blockList[blk].label != null) {
                this.blocks.blockList[blk].value = this.blocks.blockList[blk].label.value;
            }
        }

        // Init the graphic state.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.turtles.turtleList[turtle].container.x =200//= this.turtles.turtleX2screenX(this.turtles.turtleList[turtle].x);
            this.turtles.turtleList[turtle].container.y = this.turtles.turtleY2screenY(this.turtles.turtleList[turtle].y);
        }

        // Execute turtle code here...  Find the start block (or the
        // top of each stack) and build a list of all of the named
        // action stacks.
        var startBlocks = [];
        this.blocks.findStacks();
        this.actions = {};
        for (var blk = 0; blk < this.blocks.stackList.length; blk++) {
            if (this.blocks.blockList[this.blocks.stackList[blk]].name == 'start') {
                // Don't start on a start block in the trash.
                if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                    // Don't start on a start block with no connections.
                    if (this.blocks.blockList[this.blocks.stackList[blk]].connections[1] != null) {
                        startBlocks.push(this.blocks.stackList[blk]);
                    }
                }
            } else if (this.blocks.blockList[this.blocks.stackList[blk]].name == 'action') {
                // Does the action stack have a name?
                var c = this.blocks.blockList[this.blocks.stackList[blk]].connections[1];
                var b = this.blocks.blockList[this.blocks.stackList[blk]].connections[2];
                if (c != null && b != null) {
                    // Don't use an action block in the trash.
                    if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                        this.actions[this.blocks.blockList[c].value] = b;
                    }
                }
            }
        }

        this.svgOutput = '<rect x="0" y="0" height="' + this.canvas.height + '" width="' + this.canvas.width + '" fill="' + body.style.background + '"/>\n';

        this.parentFlowQueue = {};
        this.unhightlightQueue = {};
        this.parameterQueue = {};

        if (this.turtleDelay == 0) {
            // Don't update parameters when running full speed.
            this.clearParameterBlocks();
        }

        this.onRunTurtle();

        // And mark all turtles as not running.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.turtles.turtleList[turtle].running = false;
        }

        // (2) Execute the stack.
        // A bit complicated because we have lots of corner cases:
        if (startHere != null) {
            console.log('startHere is ' + this.blocks.blockList[startHere].name);
            // If a block to start from was passed, find its
            // associated turtle, i.e., which turtle should we use?
            var turtle = 0;
            if (this.blocks.blockList[startHere].name == 'start') {
                var turtle = this.blocks.blockList[startHere].value;
                console.log('starting on start with turtle ' + turtle);
            } else {
                console.log('starting on ' + this.blocks.blockList[startHere].name + ' with turtle ' + turtle);
            }

            this.turtles.turtleList[turtle].queue = [];
            this.parentFlowQueue[turtle] = [];
            this.unhightlightQueue[turtle] = [];
            this.parameterQueue[turtle] = [];
            this.turtles.turtleList[turtle].running = true;
            this.runFromBlock(this, turtle, startHere);
        } else if (startBlocks.length > 0) {
            // If there are start blocks, run them all.
            for (var b = 0; b < startBlocks.length; b++) {
                var turtle = this.blocks.blockList[startBlocks[b]].value;
                this.turtles.turtleList[turtle].queue = [];
                this.parentFlowQueue[turtle] = [];
                this.unhightlightQueue[turtle] = [];
                this.parameterQueue[turtle] = [];
                if (!this.turtles.turtleList[turtle].trash) {
                    console.log('running from turtle ' + turtle);
                    this.turtles.turtleList[turtle].running = true;
                    this.runFromBlock(this, turtle, startBlocks[b]);
                }
            }
        } else {
            // Or run from the top of each stack.
            // Find a turtle.
            var turtle = null;
            for (var t = 0; t < this.turtles.turtleList.length; t++) {
                if (!this.turtles.turtleList[t].trash) {
                    console.log('found turtle ' + t);
                    turtle = t;
                    break;
                }
            }

            if (turtle == null) {
                console.log('could not find a turtle');
                turtle = this.turtles.turtleList.length;
                this.turtles.add(null);
            }

            // Make sure the turtle we "found" exisits.
            if(this.turtles.turtleList.length < turtle + 1) {
                turtle = 0;
            }

            console.log('running with turtle ' + turtle);

            this.turtles.turtleList[turtle].queue = [];
            this.parentFlowQueue[turtle] = [];
            this.unhightlightQueue[turtle] = [];
            this.parameterQueue[turtle] = [];

            for (var blk = 0; blk < this.blocks.stackList.length; blk++) {
                if (this.blocks.blockList[blk].isNoRunBlock()) {
                    continue;
                } else {
                    if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                        if (this.blocks.blockList[this.blocks.stackList[blk]].name == 'start' && this.blocks.blockList[this.blocks.stackList[blk]].connections[1] == null) {
                            continue;
                        }
                        // This is a degenerative case.
                        this.turtles.turtleList[0].running = true;
                        this.runFromBlock(this, 0, this.blocks.stackList[blk]);
                    }
                }
            }
        }
        this.refreshCanvas();
    }

    this.runFromBlock = function(logo, turtle, blk) {
        if (blk == null) {
            return;
        }

        var delay = logo.turtleDelay + logo.waitTimes[turtle];
        logo.waitTimes[turtle] = 0;

        if (!logo.stopTurtle) {
            if (logo.turtleDelay == TURTLESTEP) {
                // Step mode
                if (!(turtle in logo.stepQueue)) {
                    logo.stepQueue[turtle] = [];
                }
                logo.stepQueue[turtle].push(blk);
            } else {
                setTimeout(function() {
                    logo.runFromBlockNow(logo, turtle, blk);
                }, delay);
            }
        }
    }

    this.blockSetter = function(blk, value, turtleId) {
        var turtle = this.turtles.turtleList[turtleId];

        switch (this.blocks.blockList[blk].name) {
            case 'x':
                turtle.doSetXY(value, turtle.x);
                break;
            case 'y':
                turtle.doSetXY(turtle.y, value);
                break;
            case 'heading':
                turtle.doSetHeading(value);
                break;
            case 'color':
                turtle.doSetColor(value);
                break;
            case 'shade':
                turtle.doSetValue(value);
                break;
            case 'grey':
                turtle.doSetChroma(value);
                break;
            case 'pensize':
                turtle.doSetPensize(value);
                break;
            case 'namedbox':
                var name = this.blocks.blockList[blk].privateData;
                if (name in this.boxes) {
                    this.boxes[name] = value;
                } else {
                    this.errorMsg(NOBOXERRORMSG, blk, name);
                }
                break;
            case 'box':
                var cblk = this.blocks.blockList[blk].connections[1];
                var name = this.parseArg(this, turtle, cblk, blk);
                if (name in this.boxes) {
                    this.boxes[name] = value;
                } else {
                    this.errorMsg(NOBOXERRORMSG, blk, name);
                }
                break;
            default:
                if (this.blocks.blockList[blk].name in this.evalSetterDict) {
                    eval(this.evalSetterDict[this.blocks.blockList[blk].name]);
                    break;
                }
                this.errorMsg('Block does not support incrementing', blk);
        }
    }

    this.runFromBlockNow = function(logo, turtle, blk) {
        var noSession = 0;
        // Run a stack of blocks, beginning with blk.
        // (1) Evaluate any arguments (beginning with connection[1]);
        var args = [];
        if (logo.blocks.blockList[blk].protoblock.args > 0) {
            for (var i = 1; i < logo.blocks.blockList[blk].protoblock.args + 1; i++) {
                args.push(logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i], blk));
            }
        }

        // (2) Run function associated with the block;
        if (logo.blocks.blockList[blk].isValueBlock()) {
            var nextFlow = null;
        } else {
            // All flow blocks have a nextFlow, but it can be null
            // (i.e., end of a flow).
            var nextFlow = last(logo.blocks.blockList[blk].connections);
            var queueBlock = new Queue(nextFlow, 1, blk);
            if (nextFlow != null) {  // Not sure why this check is needed.
                logo.turtles.turtleList[turtle].queue.push(queueBlock);
            }
        }

        // Some flow blocks have childflows, e.g., repeat.
        var childFlow = null;
        var childFlowCount = 0;

        if (logo.turtleDelay != 0) {
            logo.blocks.highlight(blk, false);
        }

        if(logo.blocks.blockList[blk].name == 'pitch')
        {
            //To apply flat/sharp to all the pitches inside clamp
            if(this.flatClampCount == 0)
            {
                this.flat = false;
                this.flatForNoteBlock = false;
            }
            else if(this.flatClampCount > 0)
                this.flatClampCount -= 2;
            if(this.sharpClampCount == 0)
            {
                this.sharp = false;
                this.sharpForNoteBlock = false;
            }
            else if(this.sharpClampCount > 0)
                this.sharpClampCount -= 2;
        }

        switch (logo.blocks.blockList[blk].name)
        {
            case 'dispatch':
                // Dispatch an event.
                if (args.length == 1) {
                    // If the event is not in the event list, add it.
                    if (!(args[0] in logo.eventList)) {
                        var event = new Event(args[0]);
                        logo.eventList[args[0]] = event;
                    }
                    logo.stage.dispatchEvent(args[0]);
                }
                break;
            case 'listen':
                if (args.length == 2) {
                    if (!(args[1] in logo.actions)) {
                        logo.errorMsg(NOACTIONERRORMSG, blk, args[1]);
                        logo.stopTurtle = true;
                    } else {
                        var listener = function (event) {
                            if (logo.turtles.turtleList[turtle].running) {
                                var queueBlock = new Queue(logo.actions[args[1]], 1, blk);
                                logo.parentFlowQueue[turtle].push(blk);
                                logo.turtles.turtleList[turtle].queue.push(queueBlock);
                            } else {
                                // Since the turtle has stopped
                                // running, we need to run the stack
                                // from here.
                                logo.runFromBlock(logo, turtle, logo.actions[args[1]]);
                            }
                        }
                        // If there is already a listener, remove it
                        // before adding the new one.
                        if (args[0] in logo.turtles.turtleList[turtle].listeners) {
                            logo.stage.removeEventListener(args[0], logo.turtles.turtleList[turtle].listeners[args[0]], false);
                        }
                        logo.turtles.turtleList[turtle].listeners[args[0]] = listener;
                        logo.stage.addEventListener(args[0], listener, false);
                    }
                }
                break;
            case 'start':
                if (args.length == 1) {
                    childFlow = args[0];
                    childFlowCount = 1; 
                }
                break;
            case 'matrix':
                if (args.length == 1) {
                    childFlow = args[0];
                    childFlowCount = 1; 
                }
                matrix.solfegeNotes = [];
                matrix.solfegeOct = [];
                setTimeout(function()
                {
                    matrix.initMatrix(logo);
                }, 1500);
                var that = this;
                setTimeout(function()
                {
                    if(that.tuplet)
                    {
                        matrix.makeClickable(true, that.polySynth);
                        that.tuplet = 0;
                    }

                    else
                        matrix.makeClickable(false, that.polySynth);
                }, 2000);
                break;
            case 'pitch':
                if(logo.sharp)
                {
                    args[0] += '#';
                }
                else if(logo.flat)
                {
                    args[0] += 'b';
                }
                if(logo.inNote)
                {
                    logo.noteBlockNotes.push(args[0]);
                    logo.noteBlockOct.push(args[1]);
                }
                else
                {
                    matrix.solfegeNotes.push(args[0]);
                    matrix.solfegeOct.push(args[1]);
                }
                break;
            case 'rhythm':
                if(logo.rhythmicValueParameter == 'rhythmicdot')
                {
                    args[1] = (2/3)*args[1];
                    logo.rhythmicValueParameter = null;
                }
                console.log('blk is ' + blk + ' and rhythmInsideTuplet is ' + logo.rhythmInsideTuplet);
                if(blk == logo.rhythmInsideTuplet)
                {
                    logo.tupletRhythmCount -= 2;
                    logo.tupletParam.push([args[0], args[1]]);
                    var that = this;
                    setTimeout(function(){
                        matrix.handleTuplet(that.tupletParam);
                    },1500)
                } else {
                    setTimeout(function(){
                        matrix.makeMatrix(args[0], args[1]);
                    }, 1500);
                }
                break;
            case 'nameddo':
                var name = logo.blocks.blockList[blk].privateData;
                if (name in logo.actions) {
                    childFlow = logo.actions[name];
                    childFlowCount = 1;
                } else {
                    logo.errorMsg(NOACTIONERRORMSG, blk, name);
                    logo.stopTurtle = true;
                }
                break;
            // if we clicked on an action block, treat it like a do block.
            case 'action':
            case 'do':
                if (args.length == 1) {
                    if (args[0] in logo.actions) {
                        childFlow = logo.actions[args[0]];
                        childFlowCount = 1;
                    } else {
                       logo.errorMsg(NOACTIONERRORMSG, blk, args[0]);
                        logo.stopTurtle = true;
                    }
                }
                break;
            case 'forever':
                if (args.length == 1) {
                    childFlow = args[0];
                    childFlowCount = -1;
                }
                break;
            case 'break':
                logo.doBreak(turtle);
                // Since we pop the queue, we need to unhighlight our parent.
                var parentBlk = logo.blocks.blockList[blk].connections[0];
                if (parentBlk != null) {
                    logo.unhightlightQueue[turtle].push(parentBlk);
                }
                break;
            case 'wait':
                if (args.length == 1) {
                    logo.doWait(turtle, args[0]);
                }
                break;
            case 'print':
                if (args.length == 1) {
                    logo.textMsg(args[0].toString());
                }
                break;
            case 'speak':
                if (args.length == 1) {
                    if (logo.meSpeak) {
                        logo.meSpeak.speak(args[0]);
                    }
                }
                break;
            case 'repeat':
                if (args.length == 2) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        childFlow = args[1];
                        childFlowCount = Math.floor(args[0]);
                    }
                }
                break;
            case 'clamp':
                if (args.length == 1) {
                    childFlow = args[0];
                    childFlowCount = 1;
                }
                break;
            case 'until':
                // Similar to 'while'
                if (args.length == 2) {
                    // Queue the child flow.
                    childFlow = args[1];
                    childFlowCount = 1;
                    if (!args[0]) {
                        // We will add the outflow of the until block
                        // each time through, so we pop it off so as
                        // to not accumulate multiple copies.
                        var queueLength = logo.turtles.turtleList[turtle].queue.length;
                        if (queueLength > 0) {
                            if (logo.turtles.turtleList[turtle].queue[queueLength - 1].parentBlk == blk) {
                                logo.turtles.turtleList[turtle].queue.pop();
                            }
                        }
                        // Requeue.
                        var parentBlk = logo.blocks.blockList[blk].connections[0];
                        var queueBlock = new Queue(blk, 1, parentBlk);
                        logo.parentFlowQueue[turtle].push(parentBlk);
                        logo.turtles.turtleList[turtle].queue.push(queueBlock);
                    } else {
                        // Since an until block was requeued each
                        // time, we need to flush the queue of all but
                        // the last one, otherwise the child of the
                        // until block is executed multiple times.
                        var queueLength = logo.turtles.turtleList[turtle].queue.length;
                        for (var i = queueLength - 1; i > 0; i--) {
                            if (logo.turtles.turtleList[turtle].queue[i].parentBlk == blk) {
                                logo.turtles.turtleList[turtle].queue.pop();
                            }
                        }
                    }
                }
                break;
            case 'waitFor':
                if (args.length == 1) {
                    if (!args[0]) {
                        // Requeue.
                        var parentBlk = logo.blocks.blockList[blk].connections[0];
                        var queueBlock = new Queue(blk, 1, parentBlk);
                        logo.parentFlowQueue[turtle].push(parentBlk);
                        logo.turtles.turtleList[turtle].queue.push(queueBlock);
                        logo.doWait(0.05);
                    } else {
                        // Since a wait for block was requeued each
                        // time, we need to flush the queue of all but
                        // the last one, otherwise the child of the
                        // while block is executed multiple times.
                        var queueLength = logo.turtles.turtleList[turtle].queue.length;
                        for (var i = queueLength - 1; i > 0; i--) {
                            if (logo.turtles.turtleList[turtle].queue[i].parentBlk == blk) {
                                logo.turtles.turtleList[turtle].queue.pop();
                            }
                        }
                    }
                }
                break;
            case 'if':
                if (args.length == 2) {
                    if (args[0]) {
                        childFlow = args[1];
                        childFlowCount = 1;
                    }
                }
                break;
            case 'ifthenelse':
                if (args.length == 3) {
                    if (args[0]) {
                        childFlow = args[1];
                        childFlowCount = 1;
                    } else {
                        childFlow = args[2];
                        childFlowCount = 1;
                    }
                }
                break;
            case 'while':
                // While is tricky because we need to recalculate
                // args[0] each time, so we requeue the While block
                // itself. 
                if (args.length == 2) {
                    if (args[0]) {
                        // We will add the outflow of the while block
                        // each time through, so we pop it off so as
                        // to not accumulate multiple copies.
                        var queueLength = logo.turtles.turtleList[turtle].queue.
length;
                        if (queueLength > 0) {
                            if (logo.turtles.turtleList[turtle].queue[queueLength - 1].parentBlk == blk) {
                                logo.turtles.turtleList[turtle].queue.pop();
                            }
                        }

                        var parentBlk = logo.blocks.blockList[blk].connections[0];
                        var queueBlock = new Queue(blk, 1, parentBlk);
                        logo.parentFlowQueue[turtle].push(parentBlk);
                        logo.turtles.turtleList[turtle].queue.push(queueBlock);

                        // and queue the interior child flow.
                        childFlow = args[1];
                        childFlowCount = 1;
                    } else {
                        // Since a while block was requeued each time,
                        // we need to flush the queue of all but the
                        // last one, otherwise the child of the while
                        // block is executed multiple times.
                        var queueLength = logo.turtles.turtleList[turtle].queue.length;
                        for (var i = queueLength - 1; i > 0; i--) {
                            if (logo.turtles.turtleList[turtle].queue[i].parentBlk == blk) {
                            // if (logo.turtles.turtleList[turtle].queue[i].blk == blk) {
                                logo.turtles.turtleList[turtle].queue.pop();
                            }
                        }
                    }
                }
                break;
            case 'storein':
                if (args.length == 2) {
                    logo.boxes[args[0]] = args[1];
                }
                break;
            case 'incrementOne':
                var i = 1;
            case 'increment':
                // If the 2nd arg is not set, default to 1.
                if (args.length == 2) {
                    var i = args[1];
                }

                if (args.length >= 1) {
                    var settingBlk = logo.blocks.blockList[blk].connections[1];
                    logo.blockSetter(settingBlk, args[0] + i, turtle);
                }
                break;
            case 'clear':
                logo.turtles.turtleList[turtle].doClear();
                break;
            case 'setxy':
                if (args.length == 2) {
                    if (typeof(args[0]) == 'string' || typeof(args[1]) == 'sting') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetXY(args[0], args[1]);
                    }
                }
                break;
            case 'arc':
                if (args.length == 2) {
                    if (typeof(args[0]) == 'string' || typeof(args[1]) == 'sting') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doArc(args[0], args[1]);
                    }
                }
                break;
            case 'forward':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doForward(args[0]);
                    }
                }
                break;
            case 'back':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doForward(-args[0]);
                    }
                }
                break;
            case 'right':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doRight(args[0]);
                    }
                }
                break;
            case 'left':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doRight(-args[0]);
                    }
                }
                break;
            case 'setheading':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetHeading(args[0]);
                    }
                }
                break;
            case 'show':
                if (args.length == 2) {
                    if (typeof(args[1]) == 'string') {
                        var len = args[1].length;
                        if (len == 14 && args[1].substr(0, 14) == CAMERAVALUE) {
                            doUseCamera(args, logo.turtles, turtle, false, logo.cameraID, logo.setCameraID, logo.errorMsg);
                        } else if (len == 13 && args[1].substr(0, 13) == VIDEOVALUE) {
                            doUseCamera(args, logo.turtles, turtle, true, logo.cameraID, logo.setCameraID, logo.errorMsg);
                        } else if (len > 10 && args[1].substr(0, 10) == 'data:image') {
                            logo.turtles.turtleList[turtle].doShowImage(args[0], args[1]);
                        } else if (len > 8 && args[1].substr(0, 8) == 'https://') {
                            logo.turtles.turtleList[turtle].doShowURL(args[0], args[1]);
                        } else if (len > 7 && args[1].substr(0, 7) == 'http://') {
                            logo.turtles.turtleList[turtle].doShowURL(args[0], args[1]);
                        } else if (len > 7 && args[1].substr(0, 7) == 'file://') {
                            logo.turtles.turtleList[turtle].doShowURL(args[0], args[1]);
                        } else {
                            logo.turtles.turtleList[turtle].doShowText(args[0], args[1]);
                        }
                    } else if (typeof(args[1]) == 'object' && logo.blocks.blockList[logo.blocks.blockList[blk].connections[2]].name == 'loadFile') {
                        if (args[1]) {
                            logo.turtles.turtleList[turtle].doShowText(args[0], args[1][1]);
                        } else {
                            logo.errorMsg(_('You must select a file.'));
                        }
                    } else {
                        logo.turtles.turtleList[turtle].doShowText(args[0], args[1]);
                    }
                }
                break;
            case 'turtleshell':
                if (args.length == 2) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doTurtleShell(args[0], args[1]);
                    }
                }
                break;
            case 'setcolor':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetColor(args[0]);
                    }
                }
                break;

            case 'setfont':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.turtles.turtleList[turtle].doSetFont(args[0]);                        
                    } else {
                        logo.errorMsg(NOSTRINGERRORMSG, blk);
                        logo.stopTurtle = true;
                    }
                }
                break;                
            case 'sethue':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetHue(args[0]);
                    }
                }
                break;
            case 'setshade':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetValue(args[0]);
                    }
                }
                break;
            case 'setgrey':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetChroma(args[0]);
                    }
                }
                break;
            case 'setpensize':
                if (args.length == 1) {
                    if (typeof(args[0]) == 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetPensize(args[0]);
                    }
                }
                break;
            case 'beginfill':
                logo.turtles.turtleList[turtle].doStartFill();
                break;
            case 'endfill':
                logo.turtles.turtleList[turtle].doEndFill();
                break;
            case 'fillscreen':
                if (args.length == 3) {
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
                break;
            case 'background':
                logo.setBackgroundColor(turtle);
                break;
            case 'penup':
                logo.turtles.turtleList[turtle].doPenUp();
                break;
            case 'pendown':
                logo.turtles.turtleList[turtle].doPenDown();
                break;
            case 'vspace':
                break;
            case 'playback':
                sound = new Howl({
                    urls: [args[0]]
                });
                logo.sounds.push(sound);
                sound.play();
                break;
            case 'stopplayback':
                for (sound in logo.sounds) {
                    logo.sounds[sound].stop();
                }
                logo.sounds = [];
                break;
            case 'stopvideocam':
                if (cameraID != null) {
                    doStopVideoCam(logo.cameraID, logo.setCameraID);
                }
                break;
            case 'startTurtle':
                var startHere = logo.getTargetTurtle(args);

                if (!startHere) {
                    logo.errorMsg('Cannot find turtle: ' + args[0], blk)
                } else {
                    var targetTurtle = logo.blocks.blockList[startHere].value;
                    if (logo.turtles.turtleList[targetTurtle].running) {
                        logo.errorMsg('Turtle is already running.', blk);
                        break;
                    }
                    logo.turtles.turtleList[targetTurtle].queue = [];
                    logo.turtles.turtleList[targetTurtle].running = true;
                    logo.parentFlowQueue[targetTurtle] = [];
                    logo.unhightlightQueue[targetTurtle] = [];
                    logo.parameterQueue[targetTurtle] = [];
                    runFromBlock(logo, targetTurtle, startHere);
                }
                break;
            case 'stopTurtle':
                var startHere = logo.getTargetTurtle(args);
                var targetTurtle = logo.blocks.blockList[startHere].value;
                logo.turtles.turtleList[targetTurtle].queue = [];
                logo.parentFlowQueue[targetTurtle] = [];
                logo.unhightlightQueue[targetTurtle] = [];
                logo.parameterQueue[targetTurtle] = [];
                logo.doBreak(targetTurtle);
                break;
            case 'showblocks':
                logo.showBlocks();
                logo.setTurtleDelay(DEFAULTDELAY);
                break;
            case 'hideblocks':
                logo.hideBlocks();
                logo.setTurtleDelay(0);
                break;
            case 'savesvg':
                if (args.length == 1) {
                    doSaveSVG(logo, args[0]);
                }
                break;

            // Actions for music-related blocks
            case 'timeSign':
                console.log('Time Signatature' + args[0]);
                break;
            case 'transposition':
                console.log('transposition by scaling ' + args[0]);
                matrix.setTransposition(args[0]);
                break;
            case 'playmatrix':
                logo.playMatrix();
                break;
            case 'rhythmicdot':
                logo.rhythmicValueParameter = 'rhythmicdot';
                logo.runFromBlock(logo, turtle, args[0]);
                break;
            case 'notation':
                var flagN = 0, flagD = 1, tsd = 0, tsn = 0;
                for (var i=0; i<args[0].length; i++)
                {
                    console.log(args[0] +"fhf")
                    if (flagN)
                    {   
                        tsd += parseInt(args[0][i]);
                        tsd *= 10;

                    }
                    if (flagD && args[0][i] != '/')
                    {
                        tsn += parseInt(args[0][i]);
                        tsn *= 10;

                    }
                    if (args[0][i] == '/')
                    {
                        flagN = 1;
                        flagD = 0;
                    }
                }
                logo.num = tsn/10;
                logo.deno = tsd/10;
                logo.notation = true;
                logo.runFromBlock(logo, turtle, args[1]);
                console.log('Generating Music Notation');
                break;
            case 'meter':
                break;
            case 'savematrix':
                logo.saveMatrix();
                break;
            case 'note':
                logo.inNote = true;
                logo.noteBlockNotes = [];
                logo.noteBlockOct = [];
                
                logo.runFromBlock(logo, turtle, args[1]);
                var that=this;
                setTimeout(function() {
                    console.log("notes " + that.noteBlockNotes + " oct " + that.noteBlockOct);
                    var notes = [];
                    that.polySynth.toMaster();
                    var beatValue = args[0];
                    for (i in that.noteBlockNotes)
                    {
                        note = that.getNote(that.noteBlockNotes[i], that.noteBlockOct[i]);
                        notes.push(note);
                    }
                    console.log("note play" + notes);
                    that.polySynth.triggerAttackRelease(notes, 1/beatValue);
                    Tone.Transport.start();
                    that.inNote = false;
                }, 1000);
            case 'showmatrix':
                logo.showMatrix = true;
                noSession = 1;
                logo.runFromBlock(logo, turtle, args[0]);
                break;
            case 'multiplybeatvalue':
                logo.multiplyBeatValueBy *= args[0];
                logo.runFromBlock(logo, turtle, args[1]);
                break;
            case 'dividebeatvalue':
                logo.divideBeatValueBy *= args[0];
                logo.runFromBlock(logo, turtle, args[1]);
                break;
            case 'sharp':
                logo.sharpClampCount = logo.blocks.blockList[blk].clampCount[0]; 
                logo.sharp = true;
                logo.sharpForNoteBlock = true;
                logo.runFromBlock(logo, turtle, args[0]);
                break;
            case 'flat':
                logo.flatClampCount = logo.blocks.blockList[blk].clampCount[0];
                logo.flat = true;
                logo.flatForNoteBlock = true;
                logo.runFromBlock(logo, turtle, args[0]);
                break;
            case 'osctime':
                break;
            case 'sine':
            case 'square':
            case 'sawtooth':
                var oscName = logo.blocks.blockList[blk].name; 
                console.log(oscName + " start time " + logo.startTime + " end time " + logo.stopTime);    
                var sineOsc = new Tone.Oscillator(args[0], oscName).toMaster();
                //connected to the master output
                setTimeout(function(osc){
                    sineOsc.start();
                }, logo.startTime);
                console.log( sineOsc);
                setTimeout(function(osc){
                    sineOsc.stop();
                }, logo.stopTime);
                break;
            case 'chunkTranspose':
                logo.chunktranspose = true;
                matrix.setTransposition(args[0]);
                logo.runFromBlock(logo, turtle, args[1]);
                break;
            case 'playfwd':
                matrix.playDirection = 1;
                logo.runFromBlock(logo, turtle, args[0]);
                break;
            case 'playbwd':
                matrix.playDirection = -1;
                logo.runFromBlock(logo, turtle, args[0]);  
                break;
            case 'tuplet':
                logo.runFromBlock(logo, turtle, args[0]);
                logo.tuplet = 2;
                logo.tupletRhythmCount = logo.blocks.blockList[blk].clampCount[0] - 3;
                break;
            case 'tupletParamBlock':
                logo.tupletParam = [];
                logo.tupletParam.push([args[0], args[1], args[2]]);
                console.log('assigning rhythmInsideTuplet to ' +  logo.blocks.blockList[blk].connections[4]);
                logo.rhythmInsideTuplet = logo.blocks.blockList[blk].connections[4];
                break;
            default:
                if(logo.blocks.blockList[blk].name.substring(0,15) == 'namedsavematrix')
                {
                    console.log('namedsavematrix');
                    noSession = 1; //nosession changed to 1, because we don't want namedsavematrix 
                                   //block to be saved locally;
                    var index = logo.blocks.blockList[blk].name[15];
                    var notes = window.savedMatricesNotes;
                    matrix.notesToPlay = [];
                    var count = 0, j=0, temp = 0;
                    for (var i=0; i<notes.length; i++)
                    {
                        if (notes[i] == 'end')
                        {
                            count += 1;
                        }
                    } 
                    
                    count = 1;
                    while (count < index)
                    {
                        if (window.savedMatricesNotes[j] == 'end')
                        {
                            count += 1;
                        }
                        j += 1;             
                    }
                    temp = j;
                    var factor = logo.multiplyBeatValueBy/logo.divideBeatValueBy;
                    while (window.savedMatricesNotes[j] != 'end')
                    {
                        matrix.notesToPlay.push([window.savedMatricesNotes[j][0], (window.savedMatricesNotes[j][1])*factor]);
                        j += 1;
                    }
                    logo.multiplyBeatValueBy = 1;
                    logo.divideBeatValueBy = 1;
                    var notesToPlayCopy = [];
                    for (k in matrix.notesToPlay)
                        {
                            notesToPlayCopy.push(matrix.notesToPlay[k])
                        }
                    var trNote;
                    if(logo.chunktranspose)
                    {
                        var transposedNotes = [];
                        j -= 1;
                        var i = notesToPlayCopy.length;
                        i -= 1;                        
                        while (window.savedMatricesNotes[j] != 'end' && i>=0)
                        {
                            for (var k in notesToPlayCopy[i][0])
                            {
                                var len = notesToPlayCopy[i][0][k].length;
                                len -= 1;
                                var note = notesToPlayCopy[i][0][k].substring(0, len);
                                var trNote = matrix.doTransposition(note, notesToPlayCopy[i][0][k][len]);
                                console.log(note + " transposed to " + trNote)
                                window.savedMatricesNotes[j][0][k] = trNote ;
                            }
                            i -= 1;
                            j -= 1;
                        }
                        logo.chunktranspose = false;
                        matrix.removeTransposition();
                    } else if (logo.notation)
                    {
                        console.log('logo.notation');
                        matrix.musicNotation(notesToPlayCopy, logo.num, logo.deno);
                        console.log("to notations " + notesToPlayCopy);
                        logo.notation = false;
                    } else if (logo.showMatrix)
                    {
                        console.log('logo.showMatrix');
                        matrix.solfegeNotes = [];
                        matrix.solfegeOct = [];
                        matrix.notesToPlay = notesToPlayCopy;
                        var solfaDisplay = [0,0,0,0,0,0,0];
                        var notesPosition = [];
                        console.log('notes to show ' + matrix.notesToPlay);
                        var table = document.getElementById("myTable");
                        Element.prototype.remove = function()
                        {
                            logo.parentElement.removeChild(this);
                        }
                        NodeList.prototype.remove = HTMLCollection.prototype.remove = function()
                        {
                            for (var i = 0, len = logo.length; i < len; i++)
                            {
                                if(this[i] && this[i].parentElement)
                                {
                                    this[i].parentElement.removeChild(this[i]);
                                }
                            }
                        }
                        var solfegeArr = [];
                        var arr = [];
                        for (k in matrix.notesToPlay)
                        {
                            arr.push([]);
                        }
                        if (table != null) 
                        {
                            table.remove();
                        }
                        for (var k=0; k<matrix.notesToPlay.length; k++)
                        {   
                            for(var i in matrix.notesToPlay[k][0])
                            {
                                switch(matrix.notesToPlay[k][0][i][0])
                                {
                                case 'B':
                                    arr[k].push('si');
                                    if (!solfaDisplay[0])
                                    {
                                        solfegeArr.push(['si',matrix.notesToPlay[k][0][i][1], 7]);
                                        solfaDisplay[0] = 1;
                                    }
                                    notesPosition.push('si');
                                    
                                    break;
                                case 'A':
                                    arr[k].push('la');
                                    if (!solfaDisplay[1])
                                    {
                                        solfegeArr.push(['la',matrix.notesToPlay[k][0][i][1], 6]);
                                        solfaDisplay[1] = 1;
                                    }
                                    notesPosition.push('la');
                                    
                                    break;
                                case 'G':
                                    arr[k].push('sol');
                                    if (!solfaDisplay[2])
                                    {
                                        solfegeArr.push(['sol',matrix.notesToPlay[k][0][i][1], 5]);
                                        solfaDisplay[2] = 1;
                                    }
                                    notesPosition.push('sol');
                                    break;
                                case 'F':
                                    arr[k].push('fa');
                                    if (!solfaDisplay[3])
                                    {
                                        solfegeArr.push(['fa',matrix.notesToPlay[k][0][i][1], 4]);
                                        solfaDisplay[3] = 1;
                                    }
                                    notesPosition.push('fa');
                                    break;
                                case 'E':
                                    arr[k].push('mi');
                                    if (!solfaDisplay[4])
                                    {
                                        solfegeArr.push(['mi',matrix.notesToPlay[k][0][i][1], 3]);
                                        solfaDisplay[4] = 1;
                                    }
                                    notesPosition.push('mi');
                                    break;
                                case 'D':
                                    arr[k].push('re');
                                    if (!solfaDisplay[5])
                                    {
                                        solfegeArr.push(['re',matrix.notesToPlay[k][0][i][1], 2]);
                                        solfaDisplay[5] = 1;
                                    }
                                    notesPosition.push('re');
                                    
                                    break;
                                case 'C':
                                    arr[k].push('do');
                                    if (!solfaDisplay[6])
                                    {
                                        solfegeArr.push(['do', matrix.notesToPlay[k][0][i][1], 1]);
                                        solfaDisplay[6] = 1;
                                    }
                                    notesPosition.push('do');
                                    break;
                                default:
                                    break;
                                }
                            }   
                        } 
                        solfegeArr.sort(function(a, b)
                        {
                            return parseFloat(a[2]) - parseFloat(b[2]);
                        });
                        matrix.solfegeNotes = [];
                        matrix.solfegeOct = [];
                        for (i in solfegeArr)
                        {
                            matrix.solfegeNotes.push(solfegeArr[i][0]);
                            matrix.solfegeOct.push(solfegeArr[i][1]);
                        }
                        matrix.initMatrix(this, logo.polySynth);
                        for (i in notesToPlayCopy)
                        {
                           matrix.makeMatrix(1, notesToPlayCopy[i][1]);
                        }
                        var table = document.getElementById("myTable");
                        for (var k=0; k<matrix.notesToPlay.length; k++)
                        {
                            for (var i=1; i<table.rows.length-1; i++)
                            {
                                for (j=0; j<arr[k].length; j++)
                                {
                                    console.log("inner "+table.rows[i].cells[0].innerHTML + " arr[k][j] "+arr[k][j])
                                    if (table.rows[i].cells[0].innerHTML.substr(0,2) == arr[k][j] || table.rows[i].cells[0].innerHTML.substr(0,3) == arr[k][j])
                                    {
                                        var cell = table.rows[i].cells[k+1];
                                        cell.style.backgroundColor = 'black';
                                        matrix.chkArray[cell.id] = 1;
                                    }                                    
                                }
                            }
                        }
                        matrix.makeClickable(false, logo.polySynth);
                        logo.showMatrix = false;
                        } else {
                            var delayFactor = 0;
                            matrix.playNotesString(0, logo.polySynth);
                            for (i in matrix.notesToPlay)
                            {
                                delayFactor += 1/matrix.notesToPlay[i][1];
                            }
                            logo.setTurtleDelay(2000*delayFactor + 200);
                            setTimeout(function()
                            {
                                logo.setTurtleDelay(0);
                            }, 2000*delayFactor + 200);
                        }
                    } else { 
                        if (logo.blocks.blockList[blk].name in logo.evalFlowDict)
                        {
                            eval(logo.evalFlowDict[logo.blocks.blockList[blk].name]);
                        } else {
                            // Could be an arg block, so we need to print its value.
                            console.log('running an arg block?');
                            if (logo.blocks.blockList[blk].isArgBlock())
                            {
                                args.push(logo.parseArg(logo, turtle, blk));
                                console.log('block: ' + blk + ' turtle: ' + turtle);
                                console.log('block name: ' + logo.blocks.blockList[blk].name);
                                console.log('block value: ' + logo.blocks.blockList[blk].value);
                                if (logo.blocks.blockList[blk].value == null) {
                                logo.textMsg('null block value');
                            } else {
                                logo.textMsg(logo.blocks.blockList[blk].value.toString());
                            }
                        } else {
                            logo.errorMsg('I do not know how to ' + logo.blocks.blockList[blk].name + '.', blk);
                        }
                        logo.stopTurtle = true;
                    }
                }
                break;
        }

        // (3) Queue block below the current block.

        // If there is a child flow, queue it.
        if (childFlow != null) {
            var queueBlock = new Queue(childFlow, childFlowCount, blk);
            // We need to keep track of the parent block to the child
            // flow so we can unlightlight the parent block after the
            // child flow completes.
            logo.parentFlowQueue[turtle].push(blk);
            logo.turtles.turtleList[turtle].queue.push(queueBlock);
        }

        var nextBlock = null;
        // Run the last flow in the queue.
        if (logo.turtles.turtleList[turtle].queue.length > 0) {
            nextBlock = last(logo.turtles.turtleList[turtle].queue).blk;
            // Since the forever block starts at -1, it will never == 1.
            if (last(logo.turtles.turtleList[turtle].queue).count == 1) {
                // Finished child so pop it off the queue.
                logo.turtles.turtleList[turtle].queue.pop();
            } else {
                // Decrement the counter for repeating logo flow.
                last(logo.turtles.turtleList[turtle].queue).count -= 1;
            }
        }

        if (nextBlock != null) {
            parentBlk = null;
            if (logo.turtles.turtleList[turtle].queue.length > 0) {
                parentBlk = last(logo.turtles.turtleList[turtle].queue).parentBlk;
            }

            if (parentBlk != blk) {
                // The wait block waits waitTimes longer than other
                // blocks before it is unhighlighted.
                if (logo.turtleDelay == TURTLESTEP) {
                    logo.unhighlightStepQueue[turtle] = blk;
                } else if (logo.turtleDelay > 0) {
                    setTimeout(function() {
                        logo.blocks.unhighlight(blk);
                    }, logo.turtleDelay + logo.waitTimes[turtle]);
                }
            }

            if (last(logo.blocks.blockList[blk].connections) == null) {
                // If we are at the end of the child flow, queue the
                // unhighlighting of the parent block to the flow.
                if (logo.parentFlowQueue[turtle].length > 0 && logo.turtles.turtleList[turtle].queue.length > 0 && last(logo.turtles.turtleList[turtle].queue).parentBlk != last(logo.parentFlowQueue[turtle])) {
                    logo.unhightlightQueue[turtle].push(logo.parentFlowQueue[turtle].pop());
                } else if (logo.unhightlightQueue[turtle].length > 0) {
                    // The child flow is finally complete, so unhighlight.
                    if (logo.turtleDelay != 0) {
                        setTimeout(function() {
                            logo.blocks.unhighlight(logo.unhightlightQueue[turtle].pop());
                        }, logo.turtleDelay);
                    }
                }
            }
            if (logo.turtleDelay != 0) {
                for (var pblk in logo.parameterQueue[turtle]) {
                    logo.updateParameterBlock(logo, turtle, logo.parameterQueue[turtle][pblk]);
                }
            }
            logo.runFromBlock(logo, turtle, nextBlock);
        } else {
            // Make sure SVG path is closed.
            logo.turtles.turtleList[turtle].closeSVG();
            // Mark the turtle as not running.
            logo.turtles.turtleList[turtle].running = false;
            if (!logo.turtles.running()) {
                logo.onStopTurtle();
            }

            // Nothing else to do... so cleaning up.
            if (logo.turtles.turtleList[turtle].queue.length == 0 || blk != last(logo.turtles.turtleList[turtle].queue).parentBlk) {
                setTimeout(function() {
                    logo.blocks.unhighlight(blk);
                }, logo.turtleDelay);
            }

            // Unhighlight any parent blocks still highlighted.
            for (var b in logo.parentFlowQueue[turtle]) {
                logo.blocks.unhighlight(logo.parentFlowQueue[turtle][b]);
            }

            // Make sure the turtles are on top.
            var i = logo.stage.getNumChildren() - 1;
            logo.stage.setChildIndex(logo.turtles.turtleList[turtle].container, i);
            logo.refreshCanvas();
        }

        clearTimeout(this.saveTimeout);
        var me = this;
        this.saveTimeout = setTimeout(function () {
            // Save at the end to save an image
            if(!noSession)
            {
                me.saveLocally();
            }
        }, DEFAULTDELAY * 1.5)
    }

    this.getNote = function(solfege, octave)
    {
        var transformed = false;
        solfege = solfege.toString();   
        if(solfege.substr(-1) == '#' || 'b')
        {
            transformed = true;
        }
        var note = 'C4';
        if(solfege.toUpperCase().substr(0,2) == 'DO')
        {
            note = 'C' + octave;
        } else if(solfege.toUpperCase().substr(0,2) == 'RE')
        {
            note = 'D' + octave;
        } else if(solfege.toUpperCase().substr(0,2) == 'MI')
        {
            note = 'E' + octave;
        } else if(solfege.toUpperCase().substr(0,2) == 'FA')
        {
            note = 'F' + octave;
        } else if(solfege.toUpperCase().substr(0,3) == 'SOL')
        {
            note = 'G' + octave;
        } else if(solfege.toUpperCase().substr(0,2) == 'LA')
        {
            note = 'A' + octave;                       
        } else if(solfege.toUpperCase().substr(0,2) == 'SI')
        {
            note = 'B' + octave;
        }
        if (transformed)
        {
            if (solfege.substr(-1) == '#')
            {
                matrix.transposition = '+1';
                note = matrix.doTransposition(note[0], note[1]);
            } else if(solfege.substr(-1) == 'b')
            {
                matrix.transposition = '-1';
                note = matrix.doTransposition(note[0], note[1]);
            }
            matrix.transposition = null;

        }
        return note;
    }

    this.getTargetTurtle = function(args) {
        // The target turtle name can be a string or an int.
        if (typeof(args[0]) == 'string') {
            var targetTurtleName = parseInt(args[0])
        } else {
            var targetTurtleName = args[0];
        }

        var startHere = null;

        for (var blk in this.blocks.blockList) {
            var name = this.blocks.blockList[blk].name;
            var targetTurtle = this.blocks.blockList[blk].value;
            if (name == 'start' && targetTurtle == targetTurtleName) {
                startHere = blk;
                break;
            }
        }
        
        return startHere;
    }

    this.loopBlock = function(name) {
        return ['forever', 'repeat', 'while', 'until'].indexOf(name) != -1;
    }

    this.doBreak = function(turtle) {
        // Look for a parent loopBlock in queue and set its count to 1.

        var parentLoopBlock = null;
        var loopBlkIdx = -1;
        var queueLength = this.turtles.turtleList[turtle].queue.length;
        for (var i = queueLength - 1; i > -1; i--) {
            if (this.loopBlock(this.blocks.blockList[this.turtles.turtleList[turtle].queue[i].blk].name)) {
                // while or until
                loopBlkIdx = this.turtles.turtleList[turtle].queue[i].blk;
                parentLoopBlock = this.blocks.blockList[loopBlkIdx];
                // Flush the parent from the queue.
                this.turtles.turtleList[turtle].queue.pop();
                break;
            } else if (this.loopBlock(this.blocks.blockList[this.turtles.turtleList[turtle].queue[i].parentBlk].name)) {
                // repeat or forever
                loopBlkIdx = this.turtles.turtleList[turtle].queue[i].parentBlk;
                parentLoopBlock = this.blocks.blockList[loopBlkIdx];
                // Flush the parent from the queue.
                this.turtles.turtleList[turtle].queue.pop();
                break;
            }
        }
        if (parentLoopBlock == null) {
            return;
        }

        // For while and until, we need to add any childflow from the
        // parent to the queue.
        if (parentLoopBlock.name == 'while' || parentLoopBlock.name == 'until') {
            var childFlow = last(parentLoopBlock.connections);
            if (childFlow != null) {
                var queueBlock = new Queue(childFlow, 1, loopBlkIdx);
                // We need to keep track of the parent block to the
                // child flow so we can unlightlight the parent block
                // after the child flow completes.
                this.parentFlowQueue[turtle].push(loopBlkIdx);
                this.turtles.turtleList[turtle].queue.push(queueBlock);
            }
        }
    }

    this.parseArg = function(logo, turtle, blk, parentBlk) {
        // Retrieve the value of a block.
        if (blk == null) {
            logo.errorMsg('Missing argument.', parentBlk);
            logo.stopTurtle = true;
            return null
        }

        if (logo.blocks.blockList[blk].protoblock.parameter) {
            if (logo.parameterQueue[turtle].indexOf(blk) == -1) {
                logo.parameterQueue[turtle].push(blk);
            }
        }

        if (logo.blocks.blockList[blk].isValueBlock()) {
            if (logo.blocks.blockList[blk].name == 'number' && typeof(logo.blocks.blockList[blk].value) == 'string') {
                try {
                    logo.blocks.blockList[blk].value = Number(logo.blocks.blockList[blk].value);
                } catch (e) {
                    console.log(e);
                }
            }
            return logo.blocks.blockList[blk].value;
        } else if (logo.blocks.blockList[blk].isArgBlock()) {
            switch (logo.blocks.blockList[blk].name) {
                case 'loudness':
                    if (!logo.mic.enabled) {
                        logo.mic.start();
                        logo.blocks.blockList[blk].value = 0;
                    } else {
                        logo.blocks.blockList[blk].value = Math.round(logo.mic.getLevel() * 1000);
                    }
                    break;
                case 'eval':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = Number(eval(a.replace(/x/g, b.toString())));
                    break;
                case 'box':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var name = logo.parseArg(logo, turtle, cblk, blk);
                    if (name in logo.boxes) {
                        logo.blocks.blockList[blk].value = logo.boxes[name];
                    } else {
                        logo.errorMsg(NOBOXERRORMSG, blk, name);
                        logo.stopTurtle = true;
                        logo.blocks.blockList[blk].value = null;
                    }
                    break;
                case 'turtlename':
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].name;
                    break;
                case 'namedbox':
                    var name = logo.blocks.blockList[blk].privateData;
                    if (name in logo.boxes) {
                        logo.blocks.blockList[blk].value = logo.boxes[name];
                    } else {
                        logo.errorMsg(NOBOXERRORMSG, blk, name);
                        logo.stopTurtle = true;
                        logo.blocks.blockList[blk].value = null;
                    }
                    break;
                case 'sqrt':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var a = logo.parseArg(logo, turtle, cblk, blk);
                    if (a < 0) {
                        logo.errorMsg(NOSQRTERRORMSG, blk);
                        logo.stopTurtle = true;
                        a = -a;
                    }
                    logo.blocks.blockList[blk].value = logo.doSqrt(a);
                    break;
                case 'int':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var a = logo.parseArg(logo, turtle, cblk, blk);
                    logo.blocks.blockList[blk].value = Math.floor(a);
                    break;
                case 'mod':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = logo.doMod(a, b);
                    break;
                case 'not':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var a = logo.parseArg(logo, turtle, cblk, blk);
                    logo.blocks.blockList[blk].value = !a;
                    break;
                case 'greater':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = (Number(a) > Number(b));
                    break;
                case 'equal':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = (a == b);
                    break;
                case 'less':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    var result = (Number(a) < Number(b));
                    logo.blocks.blockList[blk].value = result;
                    break;
                case 'random':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = logo.doRandom(a, b);
                    break;
                case 'plus':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = logo.doPlus(a, b);
                    break;
                case 'multiply':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = logo.doMultiply(a, b);
                    break;
                case 'divide':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = logo.doDivide(a, b);
                    break;
                case 'minus':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = logo.doMinus(a, b);
                    break;
                case 'myclick':
                    logo.blocks.blockList[blk].value = 'click' + logo.turtles.turtleList[turtle].name;
                    break;
                case 'heading':
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].orientation;
                    break;
                case 'x':
                    logo.blocks.blockList[blk].value = logo.turtles.screenX2turtleX(logo.turtles.turtleList[turtle].container.x);
                    break;
                case 'y':
                    logo.blocks.blockList[blk].value = logo.turtles.screenY2turtleY(logo.turtles.turtleList[turtle].container.y);
                    break;
                case 'xturtle':
                case 'yturtle':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var targetTurtle = logo.parseArg(logo, turtle, cblk, blk);
                    for (var i = 0; i < logo.turtles.turtleList.length; i++) {
                        var logoTurtle = logo.turtles.turtleList[i];
                        if (targetTurtle == logoTurtle.name) {
                            if (logo.blocks.blockList[blk].name == 'yturtle') {
                                logo.blocks.blockList[blk].value = logo.turtles.screenY2turtleY(logoTurtle.container.y);
                            } else {
                                logo.blocks.blockList[blk].value = logo.turtles.screenX2turtleX(logoTurtle.container.x);
                            }
                            break;
                        }
                    }
                    if (i == logo.turtles.turtleList.length) {
                        logo.errorMsg('Could not find turtle ' + targetTurtle, blk);
                        logo.blocks.blockList[blk].value = 0;
                    }
                    break;
                case 'color':
                case 'hue':
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].color;
                    break;
                case 'shade':
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].value;
                    break;
                case 'grey':
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].chroma;
                    break;
                case 'pensize':
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].stroke;
                    break;
                case 'and':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = a && b;
                    break;
                case 'or':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk);
                    var b = logo.parseArg(logo, turtle, cblk2, blk);
                    logo.blocks.blockList[blk].value = a || b;
                    break;
                case 'time':
                    var d = new Date();
                    logo.blocks.blockList[blk].value = (d.getTime() - logo.time) / 1000;
                    break;
                case 'hspace':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var v = logo.parseArg(logo, turtle, cblk, blk);
                    logo.blocks.blockList[blk].value = v;
                    break;
                case 'mousex':
                    logo.blocks.blockList[blk].value = logo.getStageX();
                    break;
                case 'mousey':
                    logo.blocks.blockList[blk].value = logo.getStageY();
                    break;
                case 'mousebutton':
                    logo.blocks.blockList[blk].value = logo.getStageMouseDown();
                    break;
                case 'keyboard':
                    logo.lastKeyCode = logo.getCurrentKeyCode();
                    logo.blocks.blockList[blk].value = logo.lastKeyCode;
                    logo.clearCurrentKeyCode();
                    break;
                case 'getcolorpixel':
                    var wasVisible = logo.turtles.turtleList[turtle].container.visible;
                    logo.turtles.turtleList[turtle].container.visible = false;
                    var x = logo.turtles.turtleList[turtle].container.x;
                    var y = logo.turtles.turtleList[turtle].container.y;
                    logo.refreshCanvas();
                    var ctx = this.canvas.getContext("2d");
                    var imgData = ctx.getImageData(x, y, 1, 1).data;
                    var color = searchColors(imgData[0], imgData[1], imgData[2]);
                    if (imgData[3] == 0) {
                        color = body.style.background.substring(body.style.background.indexOf('(') + 1, body.style.background.lastIndexOf(')')).split(/,\s*/),
                        color = searchColors(color[0], color[1], color[2]);
                    }
                    logo.blocks.blockList[blk].value = color;
                    if (wasVisible) {
                        logo.turtles.turtleList[turtle].container.visible = true;
                    }
                    break;
                case 'loadFile':
                    // No need to do anything here.
                    break;
                case 'meter':
                    var block = logo.blocks.blockList[blk];
                    var a = block.connections[1];
                    var b = block.connections[2];
                    var c = logo.parseArg(logo, turtle, a, blk);
                    var d = logo.parseArg(logo, turtle, b, blk);
                    logo.blocks.blockList[blk].value = c.toString() + '/' + d.toString();
                    break;
                case 'osctime':
                    var block = logo.blocks.blockList[blk];
                    var a = block.connections[1];
                    var b = block.connections[2];
                    var c = logo.parseArg(logo, turtle, a, blk);
                    var d = logo.parseArg(logo, turtle, b, blk);
                    this.startTime = c;
                    this.stopTime = d;
                    break;

                default:
                    if (logo.blocks.blockList[blk].name in logo.evalArgDict) {
                        eval(logo.evalArgDict[logo.blocks.blockList[blk].name]);
                    } else {
                        console.log('ERROR: I do not know how to ' + logo.blocks.blockList[blk].name);
                    }
                    break;
            }
            return logo.blocks.blockList[blk].value;
        } else {
            return blk;
        }
    }

    this.doWait = function(turtle, secs) {
        this.waitTimes[turtle] = Number(secs) * 1000;
    }

    // Math functions
    this.doRandom = function(a, b) {
        if (typeof(a) == 'string' || typeof(b) == 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        return Math.floor(Math.random() * (Number(b) - Number(a) + 1) + Number(a));
    }

    this.doMod = function(a, b) {
        if (typeof(a) == 'string' || typeof(b) == 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        return Number(a) % Number(b);
    }

    this.doSqrt = function(a) {
        if (typeof(a) == 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        return Math.sqrt(Number(a));
    }

    this.doPlus = function(a, b) {
        if (typeof(a) == 'string' || typeof(b) == 'string') {
            if (typeof(a) == 'string') {
                var aString = a;
            } else {
                var aString = a.toString();
            }
            if (typeof(b) == 'string') {
                var bString = b;
            } else {
                var bString = b.toString();
            }
            return aString + bString;
        } else {
            return Number(a) + Number(b);
        }
    }

    this.doMinus = function(a, b) {
        if (typeof(a) == 'string' || typeof(b) == 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        return Number(a) - Number(b);
    }

    this.doMultiply = function(a, b) {
        if (typeof(a) == 'string' || typeof(b) == 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        return Number(a) * Number(b);
    }

    this.doDivide = function(a, b) {
        if (typeof(a) == 'string' || typeof(b) == 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        if (Number(b) == 0) {
            this.errorMsg(ZERODIVIDEERRORMSG);
            this.stopTurtle = true;
            return 0;
        } else {
            return Number(a) / Number(b);
        }
    }

    this.setBackgroundColor = function(turtle) {
        /// Change body background in DOM to current color.
        var body = document.body;
        if (turtle == -1) {
            var c = platformColor.background;
        } else {
            var c = this.turtles.turtleList[turtle].canvasColor;
        }

        body.style.background = c;
        document.querySelector('.canvasHolder').style.background = c;
        this.svgOutput = '<rect x="0" y="0" height="' + this.canvas.height + '" width="' + this.canvas.width + '" fill="' + body.style.background + '"/>\n';
    }

    this.setCameraID = function(id) {
        this.cameraID = id;
    }

    this.hideBlocks = function() {
            // Hide all the blocks.
            this.blocks.hide();
            // And hide some other things.
            // for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
                // this.turtles.turtleList[turtle].container.visible = false;
            // }
            //trashcan.hide();
            //palettes.hide();
            this.refreshCanvas();
        }

    this.showBlocks = function() {
            // Show all the blocks.
            this.blocks.show();
            this.blocks.bringToTop();
            // And show some other things.
            // for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
                // this.turtles.turtleList[turtle].container.visible = true;
            // }
            // trashcan.show();
            this.refreshCanvas();
        }

    this.playMatrix = function() {
        Tone.Transport.stop();
        matrix.playNotesString(0, this.polySynth);
        this.setTurtleDelay(4500 * parseFloat(1 / this.deno) * (this.num));
        var that = this;
        setTimeout(function()
        {
            console.log(that);
            that.setTurtleDelay(0);
        }, this.setTurtleDelay(4500 * parseFloat(1 / this.deno) * (this.num)));
    }

    this.saveMatrix = function() {
        matrix.saveMatrix();
        var index = window.savedMatricesCount;
        var myDoBlock = new ProtoBlock('namedsavematrix' + index);
        this.blocks.protoBlockDict['namedsavematrix' + index] = myDoBlock;
        myDoBlock.zeroArgBlock();
        myDoBlock.palette = this.blocks.palettes.dict['chunk'];
        myDoBlock.staticLabels.push('Chunk' + index);
        myDoBlock.palette.add(myDoBlock);
        //this.blocks.palettes.dict['assemble'].add(myDoBlock);
        // this.blocks.palettes.updatePalettes('matrix');  
        this.blocks.palettes.updatePalettes('chunk');
    }
}
