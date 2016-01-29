// Copyright (c) 2014,2015 Walter Bender
// Copyright (c) 2015 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

var TONEBPM = 240;  // Seems to be the default.
var TARGETBPM = 90;  // What we'd like to use for beats per minute
var DEFAULTDELAY = 500; // milleseconds
var TURTLESTEP = -1;  // Run in step-by-step mode
var OSCVOLUMEADJUSTMENT = 1.5  // The oscillator runs hot. We need
                               // to scale back its volume.

// This header is prepended to the Lilypond output.
// Note: We are using URL encoding, e.g., \ (%5C) and newline (%0A)
var LILYPONDHEADER = '%5Cversion "2.18.2"%0A%0A%25 ****************************************************************%0A%25 %0A%25 WHAT IS THIS? -- This is a LilyPond file generated from Music%0A%25 Blocks software (Read about it at www.musicblocks.net).%0A%25 %0A%25 DOWNLOAD LILYPOND -- In order to create notation with this file,%0A%25 you will need to download and install LilyPond software onto your%0A%25 computer (http:%2F%2Flilypond.org%2Fdownload.html). Frescobaldi%0A%25 software is also handy for editing LilyPond files%0A%25 (http:%2F%2Ffrescobaldi.org%2Fdownload).%0A%25 %0A%25 LILYPOND INSTRUCTIONS -- For instructions on how to further%0A%25 manipulate musical notation using LilyPond software, please%0A%25 read the Introduction (http:%2F%2Flilypond.org%2Ftext-input.html) and%0A%25 the Manual%0A%25 (http:%2F%2Flilypond.org%2Fdoc%2Fv2.18%2FDocumentation%2Flearning%2Findex.html).%0A%25 %0A%25 GLOSSARY -- A glossary with helpful examples may be found here%0A%25 (http:%2F%2Fwww.lilypond.org%2Fdoc%2Fv2.19%2FDocumentation%2Fmusic-glossary%2F).%0A%25 %0A%25 MUTOPIA -- You may also benefit from studying scores from the%0A%25 Mutopia Project website, which has freely sharable music notation%0A%25 generated with LilyPond (http:%2F%2Fwww.mutopiaproject.org%2F).%0A%25 %0A%25 TUNEFL -- You can explore your Lilypond output in a web browser at%0A%25 (https://www.tunefl.com/).%0A%25 %0A%25 COMMENTS -- Some of the code below is commented out. You can%0A%25 enable it by deleting the %25 that precedes the text or, in the%0A%25 case of a commented section, deleting the %{ and %} that surrounds%0A%25 the section.%0A%25 %0A%25 ****************************************************************%0A%0A%25 Please add your own name, the title of your musical creation,%0A%25 and the intended copyright below.%0A%25 The copyright is great for sharing (and re-sharing)!%0A%25 Read more about it here (http:%2F%2Fcreativecommons.org%2Flicenses%2Fby-sa%2F4.0%2F).%0A%25 Of course, you can use any copyright you like -- you made it!%0A%5Cheader {%0A   dedication = "Made with LilyPond and Music Blocks (http:%2F%2Fwalterbender.github.io%2Fmusicblocks%2F)"%0A   title = "My Music Blocks Creation"%0A%25   subtitle = "Subtitle"%0A%25   instrument = "Instrument"%0A   composer = "Mr. Mouse"%0A%25   arranger = "Arranger"%0A   copyright = "Mr. Mouse (c) 2015 -- CC-BY-SA"%0A   tagline = "Made from Music Blocks v.0.9"%0A}%0A%0A%25 To change the meter make adjustments in the following section.%0A%25 You must also delete the %25 before %5Cmeter everywhere it appears below.%0Ameter = {%0A   %5Ctime 3%2F4%0A   %5Ckey c %5Cminor%0A   %5CnumericTimeSignature%0A   %5Cpartial 4 %0A   %5Ctempo "Andante" 4=90%0A}%0A%0A'

var NOMICERRORMSG = 'The microphone is not available.';
var NANERRORMSG = 'Not a number.';
var NOSTRINGERRORMSG = 'Not a string.';
var NOBOXERRORMSG = 'Cannot find box';
var NOACTIONERRORMSG = 'Cannot find action.';
var NOINPUTERRORMSG = 'Missing argument.';
var NOSQRTERRORMSG = 'Cannot take square root of negative number.';
var ZERODIVIDEERRORMSG = 'Cannot divide by zero.';
var EMPTYHEAPERRORMSG = 'empty heap.';
var INVALIDPITCH = 'Not a valid pitch name';

function Logo(matrix, canvas, blocks, turtles, stage,
              refreshCanvas, textMsg, errorMsg, hideMsgs, onStopTurtle,
              onRunTurtle, getStageX, getStageY,
              getStageMouseDown, getCurrentKeyCode,
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
    this.evalOnStartList = {};
    this.evalOnStopList = {};
    this.eventList = {};

    this.boxes = {};
    this.actions = {};
    this.returns = [];
    this.turtleHeaps = {};
    this.invertList = {};

    this.endOfFlowSignals = {};
    this.endOfFlowLoops = {};
    this.endOfFlowActions = {};
    this.doBlocks = {};

    this.time = 0;
    this.firstNoteTime = null;
    this.waitTimes = {};
    this.turtleDelay = 0;
    this.sounds = [];
    this.cameraID = null;
    this.stopTurtle = false;
    this.lastKeyCode = null;
    this.saveTimeout = 0;

    // Music-related attributes

    // matrix
    this.showMatrix = false;
    this.inMatrix = false;
    this.keySignature = {};
    this.tupletRhythms = [];
    this.addingNotesToTuplet = false;

    // parameters used by pitch
    this.transposition = {};
    this.beatFactor = {};

    // parameters used by notes
    this.notePitches = {};
    this.noteOctaves = {};
    this.noteTranspositions = {};
    this.noteBeatValues = {};

    // status of note being played
    this.currentNotes = {};
    this.currentOctaves = {};

    // parameters used by the note block
    this.bpm = {};
    this.defaultBPMFactor = TONEBPM / TARGETBPM;
    this.turtleTime = [];
    this.noteDelay = 0;
    this.playedNote = {};
    this.playedNoteTimes = {};
    this.pushedNote = {};
    this.duplicateFactor = {};
    this.skipFactor = {};
    this.skipIndex = {};
    this.tie = {};
    this.tieNote = {};
    this.tieCarryOver = {};
    this.polyVolume = {};
    this.validNote = true;

    // tuplet
    this.tuplet = false;
    this.tupletParams = [];

    // parameters used by notations
    this.lilypondSaveOnly = false;
    this.lilypondNotes = {};
    this.lilypondStaging = {};
    this.lilypondOutput = LILYPONDHEADER;
    this.numerator = 3;
    this.denominator = 4;

    this.polySynth = new Tone.PolySynth(6, Tone.AMSynth).toMaster();
    this.drumSynth = new Tone.DrumSynth().toMaster();

    var toneVol = new Tone.Volume(-20);  // DEFAULT VALUE
    this.polySynth.chain(toneVol, Tone.Master);
    this.drumSynth.chain(toneVol, Tone.Master);

    Tone.Transport.bpm.value = 120;  // Doesn't seem to do anything

    // Oscillator parameters
    this.oscDuration = {};
    this.oscList = {};

    // When running in step-by-step mode, the next command to run is
    // queued here.
    this.stepQueue = {};
    this.unhighlightStepQueue = {};

    this.svgOutput = '';
    this.svgBackground = true;

    /*
    try {
        this.mic = new p5.AudioIn()
    } catch (e) {
        console.log(NOMICERRORMSG);
        this.mic = null;
    }
    */
    this.mic = null;

    this.turtleOscs = {};
    this.notesOscs = {};

    // Used to pause between each block as the program executes.
    this.setTurtleDelay = function(turtleDelay) {
        this.turtleDelay = turtleDelay;
        this.noteDelay = 0;
    }

    // Used to pause between each note as the program executes.
    this.setNoteDelay = function(noteDelay) {
        this.noteDelay = noteDelay;
        this.turtleDelay = 0;
    }

    this.step = function() {
        // Take one step for each turtle in excuting Logo commands.
        for (var turtle in this.stepQueue) {
            if (this.stepQueue[turtle].length > 0) {
                if (turtle in this.unhighlightStepQueue && this.unhighlightStepQueue[turtle] !== null) {
                    this.blocks.unhighlight(this.unhighlightStepQueue[turtle]);
                    this.unhighlightStepQueue[turtle] = null;
                }
                var blk = this.stepQueue[turtle].pop();
                if (blk !== null) {
                    this.runFromBlockNow(this, turtle, blk, 0, null);
                }
            }
        }
    }

    this.stepNote = function() {
        // Step through one note for each turtle in excuting Logo
        // commands, but run through other blocks at full speed.
        var tempStepQueue = {};
        var notesFinish = {};
        var thisNote = {};
        var logo = this;
        stepNote();

        function stepNote() {
            for (var turtle in logo.stepQueue) {
                // Have we already played a note for this turtle?
                if (turtle in logo.playedNote && logo.playedNote[turtle]) {
                    continue;
                }
                if (logo.stepQueue[turtle].length > 0) {
                    if (turtle in logo.unhighlightStepQueue && logo.unhighlightStepQueue[turtle] !== null) {
                        logo.blocks.unhighlight(logo.unhighlightStepQueue[turtle]);
                        logo.unhighlightStepQueue[turtle] = null;
                    }
                    var blk = logo.stepQueue[turtle].pop();
                    if (blk !== null && blk !== notesFinish[turtle]) {
                      var block = logo.blocks.blockList[blk];
                        if (block.name === 'note') {
                          tempStepQueue[turtle] = blk;
                          notesFinish[turtle] = last(block.connections);
                          if (notesFinish[turtle] == null) { // end of flow
                              notesFinish[turtle] = last(logo.turtles.turtleList[turtle].queue) && last(logo.turtles.turtleList[turtle].queue).blk;
                              // catch case of null - end of project
                          }
                            // logo.playedNote[turtle] = true;
                            logo.playedNoteTimes[turtle] = logo.playedNoteTimes[turtle] || 0;
                            thisNote[turtle] = Math.pow(logo.parseArg(logo, turtle, block.connections[1], blk, null), -1);
                            logo.playedNoteTimes[turtle] += thisNote[turtle];
                            // Keep track of how long the note played for, so we can go back and play it again if needed
                        }
                        logo.runFromBlockNow(logo, turtle, blk, 0, null);
                    } else {
                        logo.playedNote[turtle] = true;
                    }
                }
            }
            // At this point, some turtles have played notes and others
            // have not. We need to keep stepping until they all have.
            var keepGoing = false;
            for (turtle in logo.stepQueue) {
                if (logo.stepQueue[turtle].length > 0 && !logo.playedNote[turtle]) {
                    keepGoing = true;
                    break;
                }
            }
            if (keepGoing) {
                stepNote();
                // logo.step();
            } else {
                var notesArray = [];
                for (turtle in logo.playedNote) {
                    logo.playedNote[turtle] = false;
                    notesArray.push(logo.playedNoteTimes[turtle]);
                }
                // If some notes are supposed to play for longer, add them back to the queue
                var shortestNote = Math.min.apply(null, notesArray);
                var continueFrom;
                for (turtle in logo.playedNoteTimes) {
                    if (logo.playedNoteTimes[turtle] > shortestNote) {
                        continueFrom = tempStepQueue[turtle];
                        // Subtract the time, as if we haven't played it yet
                        logo.playedNoteTimes[turtle] -= thisNote[turtle];
                    } else {
                        continueFrom = notesFinish[turtle];
                    }
                    logo.runFromBlock(logo, turtle, continueFrom, 0, null);
                }
                if (shortestNote === Math.max.apply(null, notesArray)) {
                    logo.playedNoteTimes = {};
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

        if (this.cameraID !== null) {
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
                case 'transposition':
                    value = this.transposition[turtle];
                    break;
                case 'beatfactor':
                    value = this.beatFactor[turtle];
                    break;
                case 'duplicatefactor':
                    value = this.duplicateFactor[turtle];
                    break;
                case 'skipfactor':
                    value = this.skipFactor[turtle];
                    break;
                case 'notevolumefactor':
                    value = this.polyVolume[turtle];
                    break;
                case 'currentnote':
                    value = this.currentNotes[turtle];
                    break;
                case 'currentoctave':
                    value = this.currentoctave[turtle];
                    break;
                case 'bpm':
                    if (this.bpm[turtle].length > 0) {
                        value = last(this.bpm[turtle]);
                    } else {
                        value = TARGETBPM;
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
            if (typeof(value) === 'string') {
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

    this.runLogoCommands = function(startHere, env) {
        // Save the state before running.
        this.saveLocally();

        for (var arg in this.evalOnStartList) {
            eval(this.evalOnStartList[arg]);
        }

        this.stopTurtle = false;
        this.blocks.unhighlightAll();
        this.blocks.bringToTop(); // Draw under blocks.

        this.hideMsgs();

        // We run the Logo commands here.
        var d = new Date();
        this.time = d.getTime();
              this.firstNoteTime = null;

        // Ensure we have at least one turtle.
        if (this.turtles.turtleList.length === 0) {
            this.turtles.add(null);
        }

        // Each turtle needs to keep its own wait time and music
        // states.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.turtleTime[turtle] = 0;
            this.waitTimes[turtle] = 0;
            this.endOfFlowSignals[turtle] = {};
            this.endOfFlowLoops[turtle] = {};
            this.endOfFlowActions[turtle] = {};
            this.doBlocks[turtle] = [];
            this.transposition[turtle] = 0;
            this.notePitches[turtle] = [];
            this.noteOctaves[turtle] = [];
            this.currentNotes[turtle] = 'G';
            this.currentOctaves[turtle] = 4;
            this.noteTranspositions[turtle] = [];
            this.noteBeatValues[turtle] = [];
            this.beatFactor[turtle] = 1;
            this.invertList[turtle] = [];
            this.duplicateFactor[turtle] = 1;
            this.skipFactor[turtle] = 1;
            this.skipIndex[turtle] = 0;
            this.keySignature[turtle] = 'C';
            this.pushedNote[turtle] = false;
            this.polyVolume[turtle] = -20;
            this.oscDuration[turtle] = 4;
            this.oscList[turtle] = [];
            this.bpm[turtle] = [];
            this.tie[turtle] = false;
            this.tieNote[turtle] = [];
            this.tieCarryOver[turtle] = 0;
        }

        this.inMatrix = false;
        this.tuplet = false;

        // Remove any listeners that might be still active
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            for (var listener in this.turtles.turtleList[turtle].listeners) {
                // console.log('removing listener ' + listener);
                this.stage.removeEventListener(listener, this.turtles.turtleList[turtle].listeners[listener], false);
            }
            this.turtles.turtleList[turtle].listeners = {};
        }

        // First we need to reconcile the values in all the value
        // blocks with their associated textareas.
        // FIXME: Do we still need this check???
        for (var blk = 0; blk < this.blocks.blockList.length; blk++) {
            if (this.blocks.blockList[blk].label !== null) {
                if (this.blocks.blockList[blk].labelattr !== null && this.blocks.blockList[blk].labelattr.value !== '♮') {
                    this.blocks.blockList[blk].value = this.blocks.blockList[blk].label.value + this.blocks.blockList[blk].labelattr.value;
                } else {
                    this.blocks.blockList[blk].value = this.blocks.blockList[blk].label.value;
                }
            }
        }

        // Init the graphic state.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.turtles.turtleList[turtle].container.x = this.turtles.turtleX2screenX(this.turtles.turtleList[turtle].x);
            this.turtles.turtleList[turtle].container.y = this.turtles.turtleY2screenY(this.turtles.turtleList[turtle].y);
        }

        // Execute turtle code here...  Find the start block (or the
        // top of each stack) and build a list of all of the named
        // action stacks.
        var startBlocks = [];
        this.blocks.findStacks();
        this.actions = {};
        for (var blk = 0; blk < this.blocks.stackList.length; blk++) {
            if (this.blocks.blockList[this.blocks.stackList[blk]].name === 'start' || this.blocks.blockList[this.blocks.stackList[blk]].name === 'drum') {
                // Don't start on a start block in the trash.
                if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                    // Don't start on a start block with no connections.
                    if (this.blocks.blockList[this.blocks.stackList[blk]].connections[1] !== null) {
                        startBlocks.push(this.blocks.stackList[blk]);
                    }
                }
            } else if (this.blocks.blockList[this.blocks.stackList[blk]].name === 'action') {
                // Does the action stack have a name?
                var c = this.blocks.blockList[this.blocks.stackList[blk]].connections[1];
                var b = this.blocks.blockList[this.blocks.stackList[blk]].connections[2];
                if (c !== null && b !== null) {
                    // Don't use an action block in the trash.
                    if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                        this.actions[this.blocks.blockList[c].value] = b;
                    }
                }
            }
        }

        this.svgOutput = '';
        this.svgBackground = true;

        this.parentFlowQueue = {};
        this.unhightlightQueue = {};
        this.parameterQueue = {};

        if (this.turtleDelay === 0) {
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
        if (startHere !== null) {
            console.log('startHere is ' + this.blocks.blockList[startHere].name);

            // If a block to start from was passed, find its
            // associated turtle, i.e., which turtle should we use?
            var turtle = 0;
            if (this.blocks.blockList[startHere].name === 'start' || this.blocks.blockList[startHere].name === 'drum') {
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
            this.runFromBlock(this, turtle, startHere, 0, env);
        } else if (startBlocks.length > 0) {
            // If there are start blocks, run them all.
            for (var b = 0; b < startBlocks.length; b++) {
                var turtle = this.blocks.blockList[startBlocks[b]].value;
                this.turtles.turtleList[turtle].queue = [];
                this.parentFlowQueue[turtle] = [];
                this.unhightlightQueue[turtle] = [];
                this.parameterQueue[turtle] = [];
                if (!this.turtles.turtleList[turtle].trash) {
                    this.turtles.turtleList[turtle].running = true;
                    this.runFromBlock(this, turtle, startBlocks[b], 0, env);
                }
            }
        } else {
            console.log('nothing to run');
        }
        this.refreshCanvas();
    }

    this.runFromBlock = function(logo, turtle, blk, isflow, receivedArg) {
        if (blk == null) {
            return;
        }

        var delay = logo.turtleDelay + logo.waitTimes[turtle];
        logo.waitTimes[turtle] = 0;

        if (!logo.stopTurtle) {
            if (logo.turtleDelay === TURTLESTEP) {
                // Step mode
                if (!(turtle in logo.stepQueue)) {
                    logo.stepQueue[turtle] = [];
                }
                logo.stepQueue[turtle].push(blk);
            } else {
                setTimeout(function() {
                    logo.runFromBlockNow(logo, turtle, blk, isflow, receivedArg);
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
            case 'bpm':
                var len = this.bpm[turtle].length;
                if (len > 0) {
                    this.bpm[turtle][len - 1] = value;
                } else {
                    this.bpm[turtle].push(value);
                }
                break;
            case 'currentnote':
                // A bit ugly because the setter call added the value
                // to the current note.
                var len = this.currentNotes[turtleId].length;
                value = parseInt(value.slice(len));
                var newNoteObj = logo.getNote(this.currentNotes[turtleId], this.currentOctaves[turtleId], value, this.keySignature[turtleId]);
                this.currentNotes[turtleId] = newNoteObj[0];
                this.currentOctaves[turtleId] = newNoteObj[1];
                break;
            case 'currentoctave':
                this.currentOctaves[turtleId] = Math.round(value);
                if (this.currentOctaves[turtleId] < 1) {
                    this.currentOctaves[turtleId] = 1;
                }
                break;
            case 'notevolumefactor':
                // A bit ugly because the setter call already added in
                // the scaled polyVolume value.
                value -= this.polyVolume[turtleId];
                var vol = (this.polyVolume[turtleId] / 0.4) + 100;
                this.setSynthVolume(vol + value, turtleId);
                break;
            default:
                if (this.blocks.blockList[blk].name in this.evalSetterDict) {
                    eval(this.evalSetterDict[this.blocks.blockList[blk].name]);
                    break;
                }
                this.errorMsg('Block does not support incrementing', blk);
        }
    }

    this.runFromBlockNow = function(logo, turtle, blk, isflow, receivedArg, queueStart) {
        // Run a stack of blocks, beginning with blk.

        // Sometimes we don't want to unwind the entire queue.
        if (queueStart === undefined) {
            queueStart = 0;
        }

        // (1) Evaluate any arguments (beginning with connection[1]);
        var args = [];
        if (logo.blocks.blockList[blk].protoblock.args > 0) {
            for (var i = 1; i < logo.blocks.blockList[blk].protoblock.args + 1; i++) {
                args.push(logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i], blk, receivedArg));
            }
        }

        // (2) Run function associated with the block;
        if (logo.blocks.blockList[blk].isValueBlock()) {
            var nextFlow = null;
        } else {
            // All flow blocks have a nextFlow, but it can be null
            // (i.e., end of a flow).
            var nextFlow = last(logo.blocks.blockList[blk].connections);
            if (nextFlow === -1) {
                nextFlow = null;
            }
            var queueBlock = new Queue(nextFlow, 1, blk, receivedArg);
            if (nextFlow !== null) {  // Not sure why this check is needed.
                logo.turtles.turtleList[turtle].queue.push(queueBlock);
            }
        }

        // Some flow blocks have childflows, e.g., repeat.
        var childFlow = null;
        var childFlowCount = 0;
        var actionArgs = [];

        if (logo.turtleDelay !== 0) {
            logo.blocks.highlight(blk, false);
        }
        switch (logo.blocks.blockList[blk].name) {
            case 'dispatch':
                // Dispatch an event.
                if (args.length === 1) {
                    // If the event is not in the event list, add it.
                    if (!(args[0] in logo.eventList)) {
                        var event = new Event(args[0]);
                        logo.eventList[args[0]] = event;
                    }
                    logo.stage.dispatchEvent(args[0]);
                }
                break;
            case 'listen':
                if (args.length === 2) {
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
                                if (isflow) {
                                    console.log('calling runFromBlockNow with ' + logo.actions[args[1]]);
                                    logo.runFromBlockNow(logo, turtle, logo.actions[args[1]], isflow, receivedArg);
                                } else {
                                    console.log('calling runFromBlock with ' + logo.actions[args[1]]);
                                    logo.runFromBlock(logo, turtle, logo.actions[args[1]], isflow, receivedArg);
                                }
                            }
                        }
                        // If there is already a listener, remove it
                        // before adding the new one.
                        logo.setListener(turtle, args[0], listener);
                    }
                }
                break;
            case 'start':
            case 'drum':
                if (args.length === 1) {
                    childFlow = args[0];
                    childFlowCount = 1;
                }
                break;
            case 'nameddo':
                var name = logo.blocks.blockList[blk].privateData;
                if (name in logo.actions) {
                    childFlow = logo.actions[name];
                    // console.log('child flow is ' + logo.actions[name] + ' ' + logo.blocks.blockList[logo.actions[name]].name);
                    childFlowCount = 1;
                    if (logo.doBlocks[turtle].indexOf(blk) === -1) {
                        logo.doBlocks[turtle].push(blk);
                    }
                } else {
                    logo.errorMsg(NOACTIONERRORMSG, blk, name);
                    logo.stopTurtle = true;
                }
                break;
            // If we clicked on an action block, treat it like a do
            // block.
            case 'action':
            case 'do':
                if (args.length === 1) {
                    if (args[0] in logo.actions) {
                        childFlow = logo.actions[args[0]];
                        childFlowCount = 1;
                        if (logo.doBlocks[turtle].indexOf(blk) === -1) {
                            logo.doBlocks[turtle].push(blk);
                        }
                    } else {
                        logo.errorMsg(NOACTIONERRORMSG, blk, args[0]);
                        logo.stopTurtle = true;
                    }
                }
                break;
            case 'nameddoArg':
                var name = logo.blocks.blockList[blk].privateData;
                while(actionArgs.length > 0) {
                    actionArgs.pop();
                }
                if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                    for (var i = 0; i < logo.blocks.blockList[blk].argClampSlots.length; i++){
                        var t = (logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i+1], blk, receivedArg));
                        actionArgs.push(t);
                    }
                }
                if (name in logo.actions) {
                    childFlow = logo.actions[name]
                    childFlowCount = 1;
                    if (logo.doBlocks[turtle].indexOf(blk) === -1) {
                        logo.doBlocks[turtle].push(blk);
                    }
                } else{
                    logo.errorMsg(NOACTIONERRORMSG, blk, name);
                    logo.stopTurtle = true;
                }
                break;
            case 'doArg':
                while(actionArgs.length > 0) {
                    actionArgs.pop();
                }
                if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                    for (var i = 0; i < logo.blocks.blockList[blk].argClampSlots.length; i++){
                        var t = (logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i+2], blk, receivedArg));
                        actionArgs.push(t);
                    }
                }
                if (args.length >= 1) {
                    if (args[0] in logo.actions) {
                        actionName = args[0];
                        childFlow = logo.actions[args[0]];
                        childFlowCount = 1;
                        if (logo.doBlocks[turtle].indexOf(blk) === -1) {
                            logo.doBlocks[turtle].push(blk);
                        }
                    } else {
                        logo.errorMsg(NOACTIONERRORMSG, blk, args[0]);
                        logo.stopTurtle = true;
                    }
                }
                break;
            case 'forever':
                if (args.length === 1) {
                    childFlow = args[0];
                    childFlowCount = -1;
                }
                break;
            case 'break':
                logo.doBreak(turtle);
                // Since we pop the queue, we need to unhighlight our
                // parent.
                var parentBlk = logo.blocks.blockList[blk].connections[0];
                if (parentBlk !== null) {
                    logo.unhightlightQueue[turtle].push(parentBlk);
                }
                break;
            case 'wait':
                if (args.length === 1) {
                    logo.doWait(turtle, args[0]);
                }
                break;
            case 'print':
                if (args.length === 1) {
                    logo.textMsg(args[0].toString());
                }
                break;
            case 'speak':
                if (args.length === 1) {
                    if (logo.meSpeak) {
                        var text = args[0];
                        var new_text = "";
                        for(i=0;i<text.length;i++){
                            if((text[i] >= 'a' && text[i] <= 'z') || (text[i] >= 'A' && text[i] <= 'Z') || text[i] === ',' || text[i] === '.' || text[i] === ' ')
                                new_text += text[i];
                        }
                        logo.meSpeak.speak(new_text);
                    }
                }
                break;
            case 'repeat':
                if (args.length === 2) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        childFlow = args[1];
                        childFlowCount = Math.floor(args[0]);
                    }
                }
                break;
            case 'clamp':
                if (args.length === 1) {
                    childFlow = args[0];
                    childFlowCount = 1;
                }
                break;
            case 'until':
                // Similar to 'while'
                if (args.length === 2) {
                    // Queue the child flow.
                    childFlow = args[1];
                    childFlowCount = 1;
                    if (!args[0]) {
                        // We will add the outflow of the until block
                        // each time through, so we pop it off so as
                        // to not accumulate multiple copies.
                        var queueLength = logo.turtles.turtleList[turtle].queue.length;
                        if (queueLength > 0) {
                            if (logo.turtles.turtleList[turtle].queue[queueLength - 1].parentBlk === blk) {
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
                            if (logo.turtles.turtleList[turtle].queue[i].parentBlk === blk) {
                                logo.turtles.turtleList[turtle].queue.pop();
                            }
                        }
                    }
                }
                break;
            case 'waitFor':
                if (args.length === 1) {
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
                            if (logo.turtles.turtleList[turtle].queue[i].parentBlk === blk) {
                                logo.turtles.turtleList[turtle].queue.pop();
                            }
                        }
                    }
                }
                break;
            case 'if':
                if (args.length === 2) {
                    if (args[0]) {
                        childFlow = args[1];
                        childFlowCount = 1;
                    }
                }
                break;
            case 'ifthenelse':
                if (args.length === 3) {
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
                if (args.length === 2) {
                    if (args[0]) {
                        // We will add the outflow of the while block
                        // each time through, so we pop it off so as
                        // to not accumulate multiple copies.
                        var queueLength = logo.turtles.turtleList[turtle].queue.length;
                        if (queueLength > 0) {
                            if (logo.turtles.turtleList[turtle].queue[queueLength - 1].parentBlk === blk) {
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
                            if (logo.turtles.turtleList[turtle].queue[i].parentBlk === blk) {
                            // if (logo.turtles.turtleList[turtle].queue[i].blk === blk) {
                                logo.turtles.turtleList[turtle].queue.pop();
                            }
                        }
                    }
                }
                break;
            case 'storein':
                if (args.length === 2) {
                    logo.boxes[args[0]] = args[1];
                }
                break;
            case 'incrementOne':
                var i = 1;
            case 'increment':
                // If the 2nd arg is not set, default to 1.
                if (args.length === 2) {
                    var i = args[1];
                }

                if (args.length >= 1) {
                    var settingBlk = logo.blocks.blockList[blk].connections[1];
                    logo.blockSetter(settingBlk, args[0] + i, turtle);
                }
                break;
            case 'clear':
                logo.svgBackground = true;
                logo.turtles.turtleList[turtle].doClear();
                break;
            case 'setxy':
                if (args.length === 2) {
                    if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetXY(args[0], args[1]);
                    }
                }
                break;
            case 'arc':
                if (args.length === 2) {
                    if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doArc(args[0], args[1]);
                    }
                }
                break;
            case 'return':
                if (args.length === 1) {
                    logo.returns.push(args[0]);
                }
                break;
            case 'returnToUrl':
                var URL = window.location.href;
                var urlParts;
                var outurl;
                if (URL.indexOf('?') > 0) {
                    var urlParts = URL.split('?');
                    if (urlParts[1].indexOf('&') >0) {
                        var newUrlParts = urlParts[1].split('&');
                        for (var i = 0; i < newUrlParts.length; i++) {
                            if (newUrlParts[i].indexOf('=') > 0) {
                                var tempargs = newUrlParts[i].split('=');
                                switch (tempargs[0].toLowerCase()) {
                                    case 'outurl':
                                        outurl = tempargs[1];
                                        break;
                                }
                            }
                        }
                    }
                }
                if (args.length === 1) {
                    var jsonRet = {};
                    jsonRet['result'] = args[0];
                    var json= JSON.stringify(jsonRet);
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.open('POST',outurl, true);
                    // Call a function when the state changes.
                    xmlHttp.onreadystatechange = function() {
                        if(xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                            alert(xmlHttp.responseText);
                        }
                    }
                    xmlHttp.send(json);
                }
                break;
            case 'forward':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doForward(args[0]);
                    }
                }
                break;
            case 'back':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doForward(-args[0]);
                    }
                }
                break;
            case 'right':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doRight(args[0]);
                    }
                }
                break;
            case 'left':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doRight(-args[0]);
                    }
                }
                break;
            case 'setheading':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetHeading(args[0]);
                    }
                }
                break;
            case 'show':
                if (args.length === 2) {
                    if (typeof(args[1]) === 'string') {
                        var len = args[1].length;
                        if (len === 14 && args[1].substr(0, 14) === CAMERAVALUE) {
                            doUseCamera(args, logo.turtles, turtle, false, logo.cameraID, logo.setCameraID, logo.errorMsg);
                        } else if (len === 13 && args[1].substr(0, 13) === VIDEOVALUE) {
                            doUseCamera(args, logo.turtles, turtle, true, logo.cameraID, logo.setCameraID, logo.errorMsg);
                        } else if (len > 10 && args[1].substr(0, 10) === 'data:image') {
                            logo.turtles.turtleList[turtle].doShowImage(args[0], args[1]);
                        } else if (len > 8 && args[1].substr(0, 8) === 'https://') {
                            logo.turtles.turtleList[turtle].doShowURL(args[0], args[1]);
                        } else if (len > 7 && args[1].substr(0, 7) === 'http://') {
                            logo.turtles.turtleList[turtle].doShowURL(args[0], args[1]);
                        } else if (len > 7 && args[1].substr(0, 7) === 'file://') {
                            logo.turtles.turtleList[turtle].doShowURL(args[0], args[1]);
                        } else {
                            logo.turtles.turtleList[turtle].doShowText(args[0], args[1]);
                        }
                    } else if (typeof(args[1]) === 'object' && logo.blocks.blockList[logo.blocks.blockList[blk].connections[2]].name === 'loadFile') {
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
                if (args.length === 2) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doTurtleShell(args[0], args[1]);
                    }
                }
                break;
            case 'setturtlename':
                var foundTargetTurtle = false;
                if (args.length === 2) {
                    for (var i = 0; i < logo.turtles.turtleList.length; i++) {
                        if (logo.turtles.turtleList[i].name === args[0]) {
                            logo.turtles.turtleList[i].rename(args[1]);
                            foundTargetTurtle = true;
                            break;
                        }
                    }
                }
                if (!foundTargetTurtle) {
                    logo.errorMsg('Could not find turtle ' + args[0], blk);
                }
                break;
            case 'startTurtle':
                var targetTurtle = logo.getTargetTurtle(args);
                if (targetTurtle == null) {
                    logo.errorMsg('Cannot find turtle: ' + args[0], blk)
                } else {
                    if (logo.turtles.turtleList[targetTurtle].running) {
                        logo.errorMsg('Turtle is already running.', blk);
                        break;
                    }
                    logo.turtles.turtleList[targetTurtle].queue = [];
                    logo.turtles.turtleList[targetTurtle].running = true;
                    logo.parentFlowQueue[targetTurtle] = [];
                    logo.unhightlightQueue[targetTurtle] = [];
                    logo.parameterQueue[targetTurtle] = [];
                    // Find the start block associated with this turtle.
                    var foundStartBlock = false;
                    for (var i = 0; i < logo.blocks.blockList.length; i++) {
                        if (logo.blocks.blockList[i] === logo.turtles.turtleList[targetTurtle].startBlock) {
                            foundStartBlock = true;
                            break;
                        }
                    }
                    if (foundStartBlock) {
                        console.log('calling runFromBlock with ' + i);
                        logo.runFromBlock(logo, targetTurtle, i, isflow, receivedArg);
                    } else {
                        logo.errorMsg('Cannot find start block for turtle: ' + args[0], blk)
                    }
                }
                break;
            case 'stopTurtle':
                var targetTurtle = logo.getTargetTurtle(args);
                if (targetTurtle == null) {
                    logo.errorMsg('Cannot find turtle: ' + args[0], blk)
                } else {
                    logo.turtles.turtleList[targetTurtle].queue = [];
                    logo.parentFlowQueue[targetTurtle] = [];
                    logo.unhightlightQueue[targetTurtle] = [];
                    logo.parameterQueue[targetTurtle] = [];
                    logo.doBreak(targetTurtle);
                }
                break;
            case 'setcolor':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetColor(args[0]);
                    }
                }
                break;
            case 'setfont':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.turtles.turtleList[turtle].doSetFont(args[0]);
                    } else {
                        logo.errorMsg(NOSTRINGERRORMSG, blk);
                        logo.stopTurtle = true;
                    }
                }
                break;
            case 'sethue':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetHue(args[0]);
                    }
                }
                break;
            case 'setshade':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetValue(args[0]);
                    }
                }
                break;
            case 'setgrey':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetChroma(args[0]);
                    }
                }
                break;
            case 'setpensize':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.turtles.turtleList[turtle].doSetPensize(args[0]);
                    }
                }
                break;
            case 'fill':
                logo.turtles.turtleList[turtle].doStartFill();

                childFlow = args[0];
                childFlowCount = 1;

                var listenerName = '_fill_';
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function (event) {
                    logo.turtles.turtleList[turtle].doEndFill();
                }

                logo.setListener(turtle, listenerName, listener);
                break;
            // Deprecated
            case 'beginfill':
                logo.turtles.turtleList[turtle].doStartFill();
                break;
            // Deprecated
            case 'endfill':
                logo.turtles.turtleList[turtle].doEndFill();
                break;
            case 'hollowline':
                logo.turtles.turtleList[turtle].doStartHollowLine();

                childFlow = args[0];
                childFlowCount = 1;

                var listenerName = '_hollowline_';
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function (event) {
                    logo.turtles.turtleList[turtle].doEndHollowLine();
                }

                logo.setListener(turtle, listenerName, listener);
                break;
            // Deprecated
            case 'beginhollowline':
                logo.turtles.turtleList[turtle].doStartHollowLine();
                break;
            // Deprecated
            case 'endhollowline':
                logo.turtles.turtleList[turtle].doEndHollowLine();
                break;
            case 'fillscreen':
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
                break;
            case 'nobackground':
                logo.svgBackground = false;
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
            case 'openProject':
                url = args[0];
                function ValidURL(str) {
                    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
                    if(!pattern.test(str)) {
                        logo.errorMsg('Please enter a valid URL.');
                        return false;
                    } else {
                        return true;
                    }
                }
                if (ValidURL(url)) {
                    var win = window.open(url, '_blank')
                    if (win) {
                        // Browser has allowed it to be opened.
                        win.focus();
                    } else {
                        // Broswer has blocked it.
                        alert('Please allow popups for this site');
                    }
                }
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
                if (cameraID !== null) {
                    doStopVideoCam(logo.cameraID, logo.setCameraID);
                }
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
                if (args.length === 1) {
                    if (logo.svgBackground) {
                        logo.svgOutput = '<rect x="0" y="0" height="' + this.canvas.height + '" width="' + this.canvas.width + '" fill="' + body.style.background + '"/> ' + logo.svgOutput;
                    }
                    doSaveSVG(logo, args[0]);
                }
                break;
            case 'showHeap':
                if (!(turtle in logo.turtleHeaps)) {
                    logo.turtleHeaps[turtle] = [];
                }
                logo.textMsg(JSON.stringify(logo.turtleHeaps[turtle]));
                break;
            case 'emptyHeap':
                logo.turtleHeaps[turtle] = [];
                break;
            case 'push':
                if (args.length === 1) {
                    if (!(turtle in logo.turtleHeaps)) {
                        logo.turtleHeaps[turtle] = [];
                    }
                    logo.turtleHeaps[turtle].push(args[0]);
                }
                break;
            case 'saveHeap':
                function downloadFile(filename, mimetype, content) {
                    var download = document.createElement('a');
                    download.setAttribute('href', 'data:' + mimetype + ';charset-utf-8,' + content);
                    download.setAttribute('download', filename);
                    document.body.appendChild(download);
                    download.click();
                    document.body.removeChild(download);
                }
                if (args[0] && turtle in logo.turtleHeaps) {
                     downloadFile(args[0], 'text/json', JSON.stringify(logo.turtleHeaps[turtle]));
                }
                break;
            case 'loadHeap':
                var block = logo.blocks.blockList[blk];
                if (turtle in logo.turtleHeaps) {
                    var oldHeap = logo.turtleHeaps[turtle];
                } else {
                    var oldHeap = [];
                }
                var c = block.connections[1];
                if (c !== null && blocks.blockList[c].name === 'loadFile') {
                    if (args.length !== 1) {
                        logo.errorMsg(_('You need to select a file.'));
                    } else {
                        try {
                            // console.log(blocks.blockList[c].value);
                            logo.turtleHeaps[turtle] = JSON.parse(blocks.blockList[c].value[1]);
                            if (!Array.isArray(logo.turtleHeaps[turtle])) {
                                throw 'is not array';
                            }
                        } catch (e) {
                            logo.turtleHeaps[turtle] = oldHeap;
                            logo.errorMsg(_('The file you selected does not contain a valid heap.'));
                        }
                    }
                } else {
                     logo.errorMsg(_('The loadHeap block needs a loadFile block.'))
                }
                break;
            case 'loadHeapFromApp':
                var data = [];
                var url = args[1];
                var name = args [0]
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open('GET', url, false );
                xmlHttp.send();
                if (xmlHttp.readyState === 4  && xmlHttp.status === 200){
                    console.log(xmlHttp.responseText);
                    try {
                        var data = JSON.parse(xmlHttp.responseText);
                    } catch (e) {
                        console.log(e);
                        logo.errorMsg(_('Error parsing JSON data:') + e);
                    }
                }
                else if (xmlHttp.readyState === 4 && xmlHttp.status !== 200) {
                    console.log('fetched the wrong page or network error...');
                    logo.errorMsg(_('404: Page not found'));
                    break;
                }
                else {
                    logo.errorMsg('xmlHttp.readyState: ' + xmlHttp.readyState);
                    break;
                }
                if (name in logo.turtleHeaps){
                    var oldHeap = turtleHeaps[turtle];
                } else {
                    var oldHeap = [];
                }
                logo.turtleHeaps[name] = data;
                break;
            case 'saveHeapToApp':
                var name = args[0];
                var url = args[1];
                if (name in logo.turtleHeaps) {
                    var data = JSON.stringify(logo.turtleHeaps[name]);
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.open('POST', url, true);
                    xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                    xmlHttp.send(data);
                } else {
                    logo.errorMsg(_('turtleHeaps does not contain a valid heap for '+name));
                }
                break;
            case 'setHeapEntry':
                if (args.length === 2) {
                    if (!(turtle in logo.turtleHeaps)) {
                        logo.turtleHeaps[turtle] = [];
                    }
                    var idx = Math.floor(args[0]);
                    if (idx < 1) {
                        logo.errorMsg(_('Index must be > 0.'))
                    }
                    // If index > heap length, grow the heap.
                    while (logo.turtleHeaps[turtle].length < idx) {
                        logo.turtleHeaps[turtle].push(null);
                    }
                    logo.turtleHeaps[turtle][idx - 1] = args[1];
                }
                break;

            // Actions for music-related blocks
            case 'savelilypond':
                if (args.length === 1) {
                    logo.saveLilypondOutput(args[0]);
                }
                break;
            case 'setbpm':
                if (args.length === 2 && typeof(args[0] === 'number')) {
                    if (args[0] < 30) {
                        logo.errorMsg(_('Beats per minute must be > 30.'))
                        var bpm = 30;
                    } else if (args[0] > 1000) {
                        logo.errorMsg(_('Maximum beats per minute is 1000.'))
                        var bpm = 1000;
                    } else {
                        var bpm = args[0];
                    }

                    logo.bpm[turtle].push(bpm);

                    childFlow = args[1];
                    childFlowCount = 1;

                    var listenerName = '_bpm_' + turtle;
                    logo.updateEndBlks(childFlow, turtle, listenerName);

                    var listener = function (event) {
                        logo.bpm[turtle].pop();
                    }
                    logo.setListener(turtle, listenerName, listener);
                }
                break;
            case 'setkey':
                if (args.length === 1) {
                    // TODO: test arg type/validity
                    logo.keySignature[turtle] = args[0];
                }
                break;
            case 'matrix':
                if (args.length === 1) {
                    childFlow = args[0];
                    childFlowCount = 1;
                }
                logo.inMatrix = true;
                matrix.solfegeNotes = [];
                matrix.solfegeTranspositions = [];
                matrix.solfegeOctaves = [];

                logo.tupletRhythms = [];
                logo.tupletParams = [];
                logo.addingNotesToTuplet = false;

                var listenerName = '_matrix_';
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function (event) {
                    matrix.initMatrix(logo);
                    var addedTuplet = false;

                    // Process queued up rhythms.
                    for (var i = 0; i < logo.tupletRhythms.length; i++) {
                        // We have two cases: (1) notes in a tuplet;
                        // and (2) rhythm block outside of a
                        // tuplet. Rhythm blocks in a tuplet are
                        // converted to notes.
                        switch (logo.tupletRhythms[i][0]) {
                            case 'notes':
                                addedTuplet = true;
                                var tupletParam = [logo.tupletParams[logo.tupletRhythms[i][1]]];
                                tupletParam.push([]);
                                for (var j = 2; j < logo.tupletRhythms[i].length; j++) {
                                    tupletParam[1].push(logo.tupletRhythms[i][j]);
                                }
                                matrix.addTuplet(tupletParam);
                                break;
                            default:
                                matrix.addNotes(logo.tupletRhythms[i][1], logo.tupletRhythms[i][2]);
                                break;
                        }
                    }
                    matrix.makeClickable(addedTuplet, logo.polySynth);
                }

                logo.setListener(turtle, listenerName, listener);
                break;
            case 'invert':
                logo.invertList[turtle].push([args[0], args[1]]);
                childFlow = args[2];
                childFlowCount = 1;

                var listenerName = '_invert_' + turtle;
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function(event) {
                    logo.invertList[turtle].pop();
                }
                logo.setListener(turtle, listenerName, listener);
                break;
            case 'pitch':
                if (args.length !== 2) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    break;
                }

                if (typeof(args[0]) === 'number') {
                    // If frequency is input, ignore octave (args[1]).
                    var obj = frequencyToNote(args[0]);
                    var note = obj[0];
                    var octave = obj[1];
                    console.log(note + ' ' + octave);
                    if (note === '?') {
                        logo.errorMsg(INVALIDPITCH, blk);
                    }
                } else {
                    var note = args[0];
                    if (args[1] < 1) {
                        var octave = 1;
                    } else if (args[1] > 10) {
                        // Humans can only hear 10 octaves.
                        console.log('clipping octave at 10');
                        var octave = 10;
                    } else {
                        var octave = args[1];
                    }

                    logo.getNote(args[0], args[1], 0, 'C');
                    if (!logo.validNote) {
                        logo.errorMsg(INVALIDPITCH, blk);
                    }
                }

                var delta = 0;

                if (logo.inMatrix) {
                    if (!(logo.invertList[turtle].length === 0)) {
                        var len = logo.invertList[turtle].length;
                        //Gets Anchor Note and it's corresponding number that is used to calculate the difference
                        var note1 = logo.getNote(note, octave, 0, logo.keySignature[turtle]);
                        var num1 = logo.getNumber(note1[0], note1[1]);
                        for (var i = len - 1; i > -1; i--) {
                            console.log(logo.invertList[turtle][0])
                            //Note to which delta is calculated
                            var note2 = logo.getNote(logo.invertList[turtle][i][0], logo.invertList[turtle][i][1], 0, logo.keySignature[turtle]);
                            var num2 = logo.getNumber(note2[0], note2[1]);
                            var a = logo.getNumNote(num1, 0);
                            delta += num2 - num1;
                            num1 += 2 * delta;
                        }
                    }
                    if(logo.duplicateFactor[turtle].length > 0){
                        var duplicateFactor = logo.duplicateFactor[turtle];
                    } else {
                        var duplicateFactor = 1;
                    }
                    for (var i = 0; i < duplicateFactor; i++) {
                        matrix.solfegeNotes.push(note);
                        if (logo.inTranspositionClamp || logo.inFlatClamp || logo.inSharpClamp) {
                            matrix.solfegeTranspositions.push(logo.transposition[turtle] + 2 * delta);
                        } else {
                            matrix.solfegeTranspositions.push(2 * delta);
                        }       
                        matrix.solfegeOctaves.push(octave);
                    }    
                } else {
                    logo.notePitches[turtle].push(note);
                    logo.noteOctaves[turtle].push(octave);
                    if (!(logo.invertList[turtle].length === 0)) {
                        var len = logo.invertList[turtle].length;
                        var note1 = logo.getNote(note, octave, 0, logo.keySignature[turtle]);
                        var num1 = logo.getNumber(note1[0], note1[1]);
                        for (var i = len - 1; i > -1; i--) {
                            var note2 = logo.getNote(logo.invertList[turtle][i][0], logo.invertList[turtle][i][1], 0, logo.keySignature[turtle]);
                            var num2 = logo.getNumber(note2[0], note2[1]);
                            var a = logo.getNumNote(num1, 0);
                            delta += num2 - num1;
                            num1 += 2 * delta;
                        }
                    }
                    if (turtle in logo.transposition) {
                        logo.noteTranspositions[turtle].push(logo.transposition[turtle] + 2 * delta);
                    } else {
                        logo.noteTranspositions[turtle].push(2 * delta);
                    }

                    if (turtle in logo.beatFactor) {
                        logo.noteBeatValues[turtle].push(logo.beatFactor[turtle]);
                    } else {
                        logo.noteBeatValues[turtle].push(1);
                    }

                    logo.pushedNote[turtle] = true;
                }
                break;
            case 'rhythm':
                if (logo.inMatrix) {
                    for (var i = 0; i < args[0]; i++) {
                        logo.processNote(args[1], blk, turtle);
                    }
                } else {
                    console.log('rhythm block only used inside matrix');
                }
                break;
            // FIXME: What is this supposed to do?
            case 'timeSign':
                console.log('Time Signatature' + args[0]);
                break;

            // &#x1D15D; &#x1D15E; &#x1D15F; &#x1D160; &#x1D161; &#x1D162; &#x1D163; &#x1D164;
            case 'wholeNote':
                logo.processNote(1, blk, turtle);
                break;
            case 'halfNote':
                logo.processNote(2, blk, turtle);
                break;
            case 'quarterNote':
                logo.processNote(4, blk, turtle);
                break;
            case 'eighthNote':
                logo.processNote(8, blk, turtle);
                break;
            case 'sixteenthNote':
                logo.processNote(16, blk, turtle);
                break;
            case 'thirtysecondNote':
                logo.processNote(32, blk, turtle);
                break;
            case 'sixtyfourthNote':
                logo.processNote(64, blk, turtle);
                break;
            // FIXME: What is this supposed to do?
            case 'meter':
                break;
            case 'osctime':
            case 'note':
                // We queue up the child flow of the note clamp and
                // once all of the children are run, we trigger a
                // _playnote_ event, then wait for the note to play.
                // The note can be specified by pitch or synth blocks.
                // The osctime block specifies the duration in
                // milleseconds while the note block specifies
                // duration as a beat value. Note: we should consider
                // the use of the global timer in Tone.js for more
                // accuracy.

                // A note can contain multiple pitch blocks to create
                // a chord. The chord is accumuated in these arrays,
                // which are used when we play the note.
                logo.oscList[turtle] = [];
                logo.notePitches[turtle] = [];
                logo.noteOctaves[turtle] = [];
                logo.noteTranspositions[turtle] = [];
                logo.noteBeatValues[turtle] = [];

                // Ensure that note duration is positive.
                if (args[0] < 0) {
                    logo.errorMsg(_('Note value must be greater than 0'), blk);
                    var noteBeatValue = 0;
                } else {
                    var noteBeatValue = args[0];
                }

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_playnote_' + turtle;
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function (event) {
                    logo.processNote(noteBeatValue, blk, turtle);
                }
                logo.setListener(turtle, listenerName, listener);
                break;
            case 'rhythmicdot':
                // Dotting a note will increase its play time by 50%
                // so we divide the beat factor by 1.5.
                logo.beatFactor[turtle] /= 1.5;
                childFlow = args[0];
                childFlowCount = 1;

                var listenerName = '_dot_' + turtle;
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function (event) {
                    logo.beatFactor[turtle] *= 1.5;
                }

                logo.setListener(turtle, listenerName, listener);
                break;
            case 'tie':
                // Tie notes together in pairs.
                logo.tie[turtle] = true;
                logo.tieNote[turtle] = [];
                logo.tieCarryOver[turtle] = 0;
                childFlow = args[0];
                childFlowCount = 1;

                var listenerName = '_tie_' + turtle;
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function (event) {
                    logo.tie[turtle] = false;
                    // If tieCarryOver > 0, we have one more note to
                    // play.
                    if (logo.tieCarryOver[turtle] > 0) {
                        var noteValue = logo.tieCarryOver[turtle];
                        logo.tieCarryOver[turtle] = 0;
                        logo.processNote(noteValue, blk, turtle);
                    }
                    logo.tieNote[turtle] = [];
                }

                logo.setListener(turtle, listenerName, listener);
                break;
            case 'duplicatenotes':
                var factor = args[0];
                if (factor === 0) {
                    logo.errorMsg(ZERODIVIDEERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    logo.duplicateFactor[turtle] *= factor;
                    childFlow = args[1];
                    childFlowCount = 1;

                    var listenerName = '_duplicate_' + turtle;
                    logo.updateEndBlks(childFlow, turtle, listenerName);

                    var listener = function (event) {
                        logo.duplicateFactor[turtle] /= factor;
                    }
                    logo.setListener(turtle, listenerName, listener);
                }
                break;
            case 'skipnotes':
                var factor = args[0];
                if (factor === 0) {
                    logo.errorMsg(ZERODIVIDEERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    logo.skipFactor[turtle] *= factor;
                    childFlow = args[1];
                    childFlowCount = 1;

                    var listenerName = '_skip_' + turtle;
                    logo.updateEndBlks(childFlow, turtle, listenerName);

                    var listener = function (event) {
                        logo.skipFactor[turtle] /= factor;
                        if (logo.skipFactor[turtle] === 1) {
                            logo.skipIndex[turtle] = 0;
                        }
                    }
                    logo.setListener(turtle, listenerName, listener);
                }
                break;
            case 'multiplybeatfactor':
                var factor = args[0];
                if (factor === 0) {
                    logo.errorMsg(ZERODIVIDEERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    logo.beatFactor[turtle] *= factor;
                    childFlow = args[1];
                    childFlowCount = 1;

                    var listenerName = '_multiplybeat_' + turtle;
                    logo.updateEndBlks(childFlow, turtle, listenerName);

                    var listener = function (event) {
                        logo.beatFactor[turtle] /= factor;
                    }

                    logo.setListener(turtle, listenerName, listener);
                }
                break;
            case 'dividebeatfactor':
                var factor = args[0];
                if (factor === 0) {
                    logo.errorMsg(ZERODIVIDEERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    logo.beatFactor[turtle] /= factor;
                    childFlow = args[1];
                    childFlowCount = 1;

                    var listenerName = '_dividebeat_' + turtle;
                    logo.updateEndBlks(childFlow, turtle, listenerName);

                    var listener = function (event) {
                        logo.beatFactor[turtle] /= factor;
                    }

                    logo.setListener(turtle, listenerName, listener);
                }
                break;
            case 'settransposition':
                var transValue = args[0];
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] -= transValue;
                } else {
                    logo.transposition[turtle] += transValue;
                }

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_transposition_' + turtle;
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function(event) {
                    if (!(logo.invertList[turtle].length === 0)) {
                        logo.transposition[turtle] += transValue;
                    } else {
                        logo.transposition[turtle] -= transValue;
                    }
                }

                logo.setListener(turtle, listenerName, listener);
                break;
            case 'sharp':
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] -= 1;
                } else {
                    logo.transposition[turtle] += 1;
                }
                childFlow = args[0];
                childFlowCount = 1;

                var listenerName = '_sharp_' + turtle;
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function(event) {
                    if (!(logo.invertList[turtle].length === 0)) {
                        logo.transposition[turtle] += 1;
                    } else {
                        logo.transposition[turtle] -= 1;
                    }
                }

                logo.setListener(turtle, listenerName, listener);
                break;
            case 'flat':
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] += 1;
                } else {
                    logo.transposition[turtle] -= 1;
                }
                childFlow = args[0];
                childFlowCount = 1;

                var listenerName = '_flat_' + turtle;
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function(event) {
                    if (!(logo.invertList[turtle].length === 0)) {
                        logo.transposition[turtle] -= 1;
                    } else {
                        logo.transposition[turtle] += 1;
                    }
                }

                logo.setListener(turtle, listenerName, listener);
                break;
            case 'setnotevolume':
                if (args.length === 1) {
                    if (typeof(args[0]) === 'string') {
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.stopTurtle = true;
                    } else {
                        logo.setSynthVolume(args[0], turtle);
                    }
                }
                break;
            // DEPRECATED P5 TONE GENERATOR
            case 'tone':
                if (typeof(logo.turtleOscs[turtle]) === 'undefined') {
                    logo.turtleOscs[turtle] = new p5.TriOsc();
                }

                osc = logo.turtleOscs[turtle];
                osc.stop();
                osc.start();
                osc.amp(0);

                osc.freq(args[0]);
                osc.fade(0.5, 0.2);

                setTimeout(function(osc) {
                    osc.fade(0, 0.2);
                }, args[1], osc);

                break;
            case 'triangle':
            case 'sine':
            case 'square':
            case 'sawtooth':
                if (args.length === 1) {
                    logo.oscList[turtle].push([logo.blocks.blockList[blk].name, args[0]]);
                }
                break;
            case 'playfwd':
                matrix.playDirection = 1;
                logo.runFromBlock(logo, turtle, args[0]);
                break;
            case 'playbwd':
                matrix.playDirection = -1;
                logo.runFromBlock(logo, turtle, args[0]);
                break;
            case 'tuplet2':
                // Replaces tupletParamBlock/tuplet combination
                if (logo.inMatrix) {
                    logo.tupletParams.push([args[0], args[1] / logo.beatFactor[turtle]]);
                    logo.tuplet = true;
                    logo.addingNotesToTuplet = false;
                } else {
                    console.log('tuplet only useful inside matrix');
                }
                childFlow = args[2];
                childFlowCount = 1;

                var listenerName = '_tuplet_';
                logo.updateEndBlks(childFlow, turtle, listenerName);

                var listener = function (event) {
                    console.log('tuplet listener');
                    if (logo.inMatrix) {
                        logo.tuplet = false;
                        logo.addingNotesToTuplet = false;
                    } else {
                    }
                }

                logo.setListener(turtle, listenerName, listener);
                break;
            case 'tuplet':
                // DEPRECATED
                if (logo.inMatrix) {
                    console.log('processing tuplet');
                    logo.tuplet = true;
                    logo.addingNotesToTuplet = false;
                } else {
                    console.log('tuplet only meaningful inside matrix');
                }
                childFlow = args[0];
                childFlowCount = 1;
                break;
            case 'tupletParamBlock':
                // DEPRECATED
                if (logo.inMatrix) {
                    console.log('tuplet params are ' + args[0] + ', ' + args[1]);
                    logo.tupletParams.push([args[0], args[1]]);
                } else {
                    console.log('tuplet parameters only useful inside matrix');
                }
                break;
            default:
                if (logo.blocks.blockList[blk].name in logo.evalFlowDict) {
                    eval(logo.evalFlowDict[logo.blocks.blockList[blk].name]);
                } else {
                    // Could be an arg block, so we need to print its value.
                    console.log('running an arg block?');
                    if (logo.blocks.blockList[blk].isArgBlock()) {
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
                break;
        }

        // (3) Queue block below the current block.

        // Is the block in a queued clamp?
        if (blk in logo.endOfFlowSignals[turtle]) {
            // There is a list of signals, loops, and parent
            // clamps. Each needs to be handled separately.
            // If we are at the end of a clamp(s), and
            // if we are at the end of a loop, we need to trigger.
            // else if we are returning from an action, we need to trigger.
            // else trigger.
            var parentActions = [];
            for (var i = logo.endOfFlowSignals[turtle][blk].length - 1; i >= 0; i--) {
                // console.log(i + ': ' + logo.blocks.blockList[blk].name);
                var parentLoop = logo.endOfFlowLoops[turtle][blk][i];
                var parentAction = logo.endOfFlowActions[turtle][blk][i];
                var signal = logo.endOfFlowSignals[turtle][blk][i];
                // console.log('parent loop = ' + parentLoop + ' ' + 'parentAction = ' + parentAction);
                var loopTest = parentLoop !== null && logo.parentFlowQueue[turtle].indexOf(parentLoop) !== -1 && logo.loopBlock(logo.blocks.blockList[parentLoop].name);
                var actionTest = (parentAction !== null && (logo.namedActionBlock(logo.blocks.blockList[parentAction].name) || logo.actionBlock(logo.blocks.blockList[parentAction].name)) && logo.doBlocks[turtle].indexOf(parentAction) === -1);
                var stillInLoop = false;
                if (loopTest) {
                    for (var j = 0; j < logo.turtles.turtleList[turtle].queue.length; j++) {
                        // console.log(logo.turtles.turtleList[turtle].queue[j].parentBlk);
                        if (parentLoop === logo.turtles.turtleList[turtle].queue[j].parentBlk) {
                            stillInLoop = true;
                            break;
                        }
                    }
                }
                if (loopTest && stillInLoop) {
                    // console.log(logo.endOfFlowSignals[turtle][blk][i] + ' still in child flow of loop block');
                } else if (actionTest) {
                    // console.log(logo.endOfFlowSignals[turtle][blk][i] + ' still in child flow of action block');
                } else if (signal !== null) {
                    if (logo.doBlocks[turtle].indexOf(parentAction) !== -1) {
                        // console.log('queuing parent action');
                        if (parentActions.indexOf(parentAction) === -1) {
                            parentActions.push(parentAction);
                        }
                    }
                    console.log(logo.blocks.blockList[blk].name + ' dispatching ' + logo.endOfFlowSignals[turtle][blk][i]);
                    logo.stage.dispatchEvent(logo.endOfFlowSignals[turtle][blk][i]);
                    // Mark issued signals as null
                    logo.endOfFlowSignals[turtle][blk][i] = null;
                    logo.endOfFlowLoops[turtle][blk][i] = null;
                    logo.endOfFlowActions[turtle][blk][i] = null;
                }
            }
            for (var i = 0; i < parentActions.length; i++ ) {
                if (logo.doBlocks[turtle].indexOf(parentAction) !== -1) {
                    // console.log('setting doBlocks[' + logo.doBlocks[turtle][logo.doBlocks[turtle].indexOf(parentAction)] + '] to -1');
                    logo.doBlocks[turtle][logo.doBlocks[turtle].indexOf(parentAction)] = -1;
                }
            }

            // Garbage collection
            // FIXME: reimplement more efficiently

            var cleanSignals = [];
            var cleanLoops = [];
            var cleanActions = [];
            for (var i = 0; i < logo.endOfFlowSignals[turtle][blk].length; i++) {
                if (logo.endOfFlowSignals[turtle][blk][i] !== null) {
                    cleanSignals.push(logo.endOfFlowSignals[turtle][blk][i]);
                    cleanLoops.push(logo.endOfFlowLoops[turtle][blk][i]);
                    cleanActions.push(logo.endOfFlowActions[turtle][blk][i]);
                }
            }
            logo.endOfFlowSignals[turtle][blk] = cleanSignals;
            logo.endOfFlowLoops[turtle][blk] = cleanLoops;
            logo.endOfFlowActions[turtle][blk] = cleanActions;

            var cleanDos = [];
            for (var i = 0; i < logo.doBlocks[turtle].length; i++) {
                if (logo.doBlocks[turtle][i] !== -1) {
                    cleanDos.push(logo.doBlocks[turtle][i]);
                }
            }
            logo.doBlocks[turtle] = cleanDos;

            // console.log(logo.endOfFlowSignals[turtle][blk]);
        }

        // If there is a child flow, queue it.
        if (childFlow) {
            // console.log('child flow is ' + childFlow + ' '  + logo.blocks.blockList[childFlow].name);

            if (logo.blocks.blockList[blk].name==='doArg' || logo.blocks.blockList[blk].name==='nameddoArg') {
                var queueBlock = new Queue(childFlow, childFlowCount, blk, actionArgs);
            } else {
                var queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
            }
            // We need to keep track of the parent block to the child
            // flow so we can unlightlight the parent block after the
            // child flow completes.
            logo.parentFlowQueue[turtle].push(blk);
            logo.turtles.turtleList[turtle].queue.push(queueBlock);
        }

        var nextBlock = null;
        var parentBlk = null;
        // Run the last flow in the queue.
        if (logo.turtles.turtleList[turtle].queue.length > queueStart) {
            nextBlock = last(logo.turtles.turtleList[turtle].queue).blk;
            parentBlk = last(logo.turtles.turtleList[turtle].queue).parentBlk;
            passArg = last(logo.turtles.turtleList[turtle].queue).args;
            // Since the forever block starts at -1, it will never === 1.
            if (last(logo.turtles.turtleList[turtle].queue).count === 1) {
                // Finished child so pop it off the queue.
                logo.turtles.turtleList[turtle].queue.pop();
            } else {
                // Decrement the counter for repeating logo flow.
                last(logo.turtles.turtleList[turtle].queue).count -= 1;
            }
        }

        if (nextBlock !== null) {
            if (parentBlk !== blk) {
                // The wait block waits waitTimes longer than other
                // blocks before it is unhighlighted.
                if (logo.turtleDelay === TURTLESTEP) {
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
                if (logo.parentFlowQueue[turtle].length > 0 && logo.turtles.turtleList[turtle].queue.length > 0 && last(logo.turtles.turtleList[turtle].queue).parentBlk !== last(logo.parentFlowQueue[turtle])) {
                    // console.log('popping parent flow queue for ' + logo.blocks.blockList[blk].name);
                    logo.unhightlightQueue[turtle].push(last(logo.parentFlowQueue[turtle]));

                    // logo.unhightlightQueue[turtle].push(logo.parentFlowQueue[turtle].pop());
                } else if (logo.unhightlightQueue[turtle].length > 0) {
                    // The child flow is finally complete, so unhighlight.
                    if (logo.turtleDelay !== 0) {
                        setTimeout(function() {
                            console.log('popping parent flow queue for ' + logo.blocks.blockList[blk].name);
                            logo.blocks.unhighlight(logo.unhightlightQueue[turtle].pop());
                        }, logo.turtleDelay);
                    }
                }
            }
            if (logo.turtleDelay !== 0) {
                for (var pblk in logo.parameterQueue[turtle]) {
                    logo.updateParameterBlock(logo, turtle, logo.parameterQueue[turtle][pblk]);
                }
            }
            if (isflow){
                logo.runFromBlockNow(logo, turtle, nextBlock, isflow, passArg, queueStart);
            }
            else{
                logo.runFromBlock(logo, turtle, nextBlock, isflow, passArg);
            }
        } else {
            // Make sure any unissued signals are dispatched.
            for (var b in logo.endOfFlowSignals[turtle]) {
                for (var i = 0; i < logo.endOfFlowSignals[turtle][b].length; i++) {
                    if (logo.endOfFlowSignals[turtle][b][i] !== null) {
                        logo.stage.dispatchEvent(logo.endOfFlowSignals[turtle][b][i]);
                        // console.log('dispatching ' + logo.endOfFlowSignals[turtle][b][i]);
                    }
                }
            }
            // Make sure SVG path is closed.
            logo.turtles.turtleList[turtle].closeSVG();
            // Mark the turtle as not running.
            logo.turtles.turtleList[turtle].running = false;
            if (!logo.turtles.running()) {
                logo.onStopTurtle();
            }

            if (logo.lilypondSaveOnly) {
                logo.saveLilypondOutput(_('My Project') + '.ly');
                logo.lilypondSaveOnly = false;
            }

            // Nothing else to do... so cleaning up.
            if (logo.turtles.turtleList[turtle].queue.length === 0 || blk !== last(logo.turtles.turtleList[turtle].queue).parentBlk) {
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

            for (var arg in logo.evalOnStopList) {
                eval(logo.evalOnStopList[arg]);
            }
        }

        clearTimeout(this.saveTimeout);
        var me = this;
        this.saveTimeout = setTimeout(function () {
            // Save at the end to save an image
            me.saveLocally();
        }, DEFAULTDELAY * 1.5)
    }

    this.setSynthVolume = function(vol, turtle) {
        if (vol > 100) {
            vol = 100;
        } else if (vol < 0) {
            vol = 0;
        }
        // Scale runs from 0db (max) to -40db (min)
        // FIXME: db is logarithmic
        console.log(Math.log10(vol));
        vol -= 100;
        vol *= 0.4;
        console.log(vol);
        this.polyVolume[turtle] = vol;
        var toneVol = new Tone.Volume(vol);
        if (this.turtles.turtleList[turtle].drum) {
            this.drumSynth.chain(toneVol, Tone.Master);
        } else {
            this.polySynth.chain(toneVol, Tone.Master);
        }
    }

    this.processNote = function(noteBeatValue, blk, turtle) {
        if (this.inMatrix) {
            noteBeatValue *= this.beatFactor[turtle];
            if (this.tuplet === true) {
                if(this.addingNotesToTuplet) {
                    var i = this.tupletRhythms.length - 1;
                    this.tupletRhythms[i].push(noteBeatValue);
                } else {
                    this.tupletRhythms.push(['notes', this.tupletParams.length - 1, noteBeatValue]);
                    this.addingNotesToTuplet = true;
                }
            } else {
                this.tupletRhythms.push(['', 1, noteBeatValue]);
            }
        } else {
            // We start the music clock as the first note is being
            // played.
            if (this.firstNoteTime == null) {
                var d = new Date();
                this.firstNoteTime = d.getTime();
            }
            // Calculate a lag: In case this turtle has fallen behind,
            // we need to catch up.
            var d = new Date();
            var elapsedTime = (d.getTime() - this.firstNoteTime) / 1000; // (d.getTime() - this.time) / 1000;
            var turtleLag = elapsedTime - this.turtleTime[turtle];
            
            if (this.bpm[turtle].length > 0) {
                var bpmFactor = TONEBPM / last(this.bpm[turtle]);
            } else {
                var bpmFactor = TONEBPM / TARGETBPM;
            }
            
            // If we are in a tie, depending upon parity, we either
            // add the duration from the previous note to the current
            // note, or we cache the duration and set the wait to
            // zero.  FIXME: Will not work when mixing osctimes with
            // noteBeatValues.  FIXME: Will not work when using dup
            // and skip.
            if (this.tie[turtle]) {

                // We need to check to see if we are tying together
                // similar notes.
                if (this.tieCarryOver[turtle] > 0) {
                    var match = true;
                    if (this.tieNote[turtle].length !== this.notePitches[turtle].length) {
                        match = false;
		    } else {
			for (var i = 0; i < this.tieNote[turtle].length; i++) {
                            if (this.tieNote[turtle][i][0] != this.notePitches[turtle][i]) {
				match = false;
				break;
			    }
                            if (this.tieNote[turtle][i][1] != this.noteOctaves[turtle][i]) {
				match = false;
				break;
			    }
			}
          	    }
		    if (!match) {
                        var noteBeatValue = this.tieCarryOver[turtle];
                        this.tieCarryOver[turtle] = 0;
                        this.tie[turtle] = false;

			// Save the current note.
                        var saveNote = [];
                        for (var i = 0; i < this.notePitches[turtle].length; i++) {
                            saveNote.push([this.notePitches[turtle][i], this.noteOctaves[turtle][i]]);
			}

			// Swap in the previous note.
			this.notePitches[turtle] = [];
			this.noteOctaves[turtle] = [];
                        for (var i = 0; i < this.tieNote[turtle].length; i++) {
                            this.notePitches[turtle].push(this.tieNote[turtle][i][0]);
			    this.noteOctaves[turtle].push(this.tieNote[turtle][i][1]);
			}
                        this.tieNote[turtle] = [];
                        this.processNote(noteBeatValue, blk, turtle);

                        // Restore the current note.
                        this.tie[turtle] = true;
			this.notePitches[turtle] = [];
			this.noteOctaves[turtle] = [];
                        for (var i = 0; i < saveNote.length; i++) {
                            this.notePitches[turtle].push(saveNote[i][0]);
			    this.noteOctaves[turtle].push(saveNote[i][1]);
			}
                    }
		}


                if (this.tieCarryOver[turtle] === 0) {
                    this.tieNote[turtle] = [];
                    this.tieCarryOver[turtle] = noteBeatValue;
                    for (var i = 0; i < this.notePitches[turtle].length; i++) {
                        this.tieNote[turtle].push([this.notePitches[turtle][i], this.noteOctaves[turtle][i]]);
		    }
                    noteBeatValue = 0;
                } else {
                    if (this.blocks.blockList[blk].name === 'osctime') {
                        noteBeatValue += this.tieCarryOver[turtle];
                    } else {
                        noteBeatValue = 1 / ((1 / noteBeatValue) + (1 / this.tieCarryOver[turtle]));
                    }
                    this.tieCarryOver[turtle] = 0;
                }
            }
            
            // Duration is the duration of the note to be
            // played. doWait sets the wait time for the turtle before
            // the next block is executed.
            if (this.blocks.blockList[blk].name === 'osctime') {
                var duration = noteBeatValue;  // microseconds
                this.turtleTime[turtle] += ((duration + this.noteDelay) / 1000) * this.duplicateFactor[turtle];
                if (!this.lilypondSaveOnly) {
                    this.doWait(turtle, Math.max(((duration + this.noteDelay) / 1000) * this.duplicateFactor[turtle] - turtleLag, 0));
                }
            } else {
                var duration = noteBeatValue * this.beatFactor[turtle];  // beat value
                if (duration > 0) {
                    this.turtleTime[turtle] += ((bpmFactor / duration) + (this.noteDelay / 1000)) * this.duplicateFactor[turtle];
                }
                if (!this.lilypondSaveOnly) {
                    if (duration > 0) {
                        this.doWait(turtle, Math.max(((bpmFactor / duration) + (this.noteDelay / 1000)) * this.duplicateFactor[turtle] - turtleLag, 0));
                    }
                }
            }
            
            var waitTime = 0;
            for (var j = 0; j < this.duplicateFactor[turtle]; j++) {
                if (this.skipFactor[turtle] > 1 && this.skipIndex[turtle] % this.skipFactor[turtle] > 0) {
                    this.skipIndex[turtle] += 1;
                    // Lessen delay time by one note since we are
                    // skipping a note.
                    // FIXME: TAKE INTO ACCOUNT OSCTIME
                    if (duration > 0) {
                        this.waitTimes[turtle] -= ((bpmFactor / duration) + (this.noteDelay / 1000)) * 1000;
                        if (this.waitTimes[turtle] < 0) {
                            this.waitTimes[turtle] = 0;
                        }
                    }
                    continue;
                }
                if (this.skipFactor[turtle] > 1) {
                    this.skipIndex[turtle] += 1;
                }
                if (j > 0) {
                    if (this.blocks.blockList[blk].name === 'osctime') {
                        waitTime += duration;
                    } else {
                        if (duration > 0) {
                            waitTime += (bpmFactor * 1000 / duration);
                        }
                    }
                }
                
                playnote = function(logo) {
                    var notes = [];
                    var insideChord = -1;
                    if ((logo.notePitches[turtle].length + logo.oscList[turtle].length) > 1) {
                        if (turtle in logo.lilypondStaging) {
                            var insideChord = logo.lilypondStaging[turtle].length + 1;
                        } else {
                            var insideChord = 1;
                        }
                    }
                    
                    var oscillators = [];
                    // FIXME: Add tie to notation
                    if (logo.oscList[turtle].length > 0 && duraction > 0) {
                        for (var i = 0; i < logo.oscList[turtle].length; i++) {
                            if (!logo.lilypondSaveOnly) {
                                oscillators.push(new Tone.Oscillator(logo.oscList[turtle][i][1], logo.oscList[turtle][i][0]).toMaster());
                            }
                            console.log("tone to play " + logo.oscList[turtle][i][1] + ' ' + frequencyToNote(logo.oscList[turtle][i][1])[0] + frequencyToNote(logo.oscList[turtle][i][1])[1]);
                            if (logo.blocks.blockList[blk].name === 'osctime') {
                                logo.updateNotation(frequencyToNote(logo.oscList[turtle][i][1])[0] + frequencyToNote(logo.oscList[turtle][i][1])[1], 1000 / duration, turtle, insideChord);
                            } else {
                                logo.updateNotation(frequencyToNote(logo.oscList[turtle][i][1])[0] + frequencyToNote(logo.oscList[turtle][i][1])[1], duration, turtle, insideChord);
                            }
                        }
                        
                        if (!logo.lilypondSaveOnly && duration > 0) {
                            for (var i = 0; i < oscillators.length; i++) {
                                oscillators[i].volume.value = logo.polyVolume[turtle] * OSCVOLUMEADJUSTMENT;
                                oscillators[i].start();
                            }
                            if (logo.blocks.blockList[blk].name === 'osctime') {
                                var stopTime = duration;
                            } else {
                                if (duration > 0) {
                                    var stopTime = bpmFactor * 1000 / duration;
                                } else {
                                    var stopTime = 0;
                                }
                            }
                            setTimeout(function(){
                                for (var i = 0; i < oscillators.length; i++) {
                                    oscillators[i].stop();
                                }
                            }, stopTime);
                        }
                    }
                    if (logo.notePitches[turtle].length > 0) {
                        if (!logo.lilypondSaveOnly && duration > 0) {
                            if (logo.turtles.turtleList[turtle].drum) {
                                logo.drumSynth.toMaster();
                            } else {
                                logo.polySynth.toMaster();
                            }
                        }
                        
                        for (i in logo.notePitches[turtle]) {
                            var noteObj = logo.getNote(logo.notePitches[turtle][i], logo.noteOctaves[turtle][i], logo.noteTranspositions[turtle][i], logo.keySignature[turtle]);
                            var note = noteObj[0] + noteObj[1];
                            if (note !== 'R') {
                                notes.push(note);
                            }
                            // FIXME: add tie to notation
                            if (duration > 0) {
                                if (logo.blocks.blockList[blk].name === 'osctime') {
                                    logo.updateNotation(note, 1000 / duration, turtle, insideChord);
                                } else {
                                    logo.updateNotation(note, duration, turtle, insideChord);
                                }
                            }
                        }
                        
                        console.log("notes to play " + notes + ' ' + noteBeatValue);
                        if (notes.length > 0) {
                            var len = notes[0].length;
                            logo.currentNotes[turtle] = notes[0].slice(0, len - 1);
                            logo.currentOctaves[turtle] = parseInt(notes[0].slice(len - 1));
                            if (logo.turtles.turtleList[turtle].drum) {
                                for (var i = 0; i < notes.length; i++) {
                                    // Remove pitch
                                    notes[i] = 'C2';
                                }
                            } else {
                                for (var i = 0; i < notes.length; i++) {
                                    notes[i] = notes[i].replace(/♭/g, 'b').replace(/♯/g, '#');
                                }
                            }
                            
                            // Use the beatValue of the first note in
                            // the group since there can only be one.
                            if (logo.blocks.blockList[blk].name === 'osctime') {
                                var beatValue = duration / 1000;
                            } else {
                                var beatValue = bpmFactor / (noteBeatValue * logo.noteBeatValues[turtle][0]);
                            }
                            if (!logo.lilypondSaveOnly && duration > 0) {
                                if (logo.turtles.turtleList[turtle].drum) {
                                    logo.drumSynth.triggerAttackRelease(notes[0], beatValue);
                                } else {
                                    logo.polySynth.triggerAttackRelease(notes, beatValue);
                                }
                                Tone.Transport.start();
                            }
                        }
                    }
                    
                    if (insideChord > 0) {
                        insideChord = -1;
                    }
                    
                }

                if (waitTime === 0 || this.lilypondSaveOnly) {
                    playnote(this);
                } else {
                    setTimeout(function() {
                        playnote(this);
                    }, waitTime + this.noteDelay);
                }
            }
            this.pushedNote[turtle] = false;
        }
    }

    this.setListener = function(turtle, listenerName, listener) {
        if (listenerName in this.turtles.turtleList[turtle].listeners) {
            this.stage.removeEventListener(listenerName, this.turtles.turtleList[turtle].listeners[listenerName], false);
        }
        this.turtles.turtleList[turtle].listeners[listenerName] = listener;
        this.stage.addEventListener(listenerName, listener, false);
    }

    this.updateEndBlks = function(childFlow, turtle, listenerName) {
        if (childFlow == null) {
            console.log('null childFlow sent to updateEndBlks');
            return;
        }
        var blk = this.blocks.blockList[childFlow].connections[0];
        var endBlk = this.getBlockAtEndOfFlow(childFlow, null, null);
        if (endBlk[0] !== null) {
            if (endBlk[0] in this.endOfFlowSignals[turtle]) {
                this.endOfFlowSignals[turtle][endBlk[0]].push(listenerName);
                this.endOfFlowLoops[turtle][endBlk[0]].push(endBlk[1]);
                this.endOfFlowActions[turtle][endBlk[0]].push(endBlk[2]);
            } else {
                this.endOfFlowSignals[turtle][endBlk[0]] = [listenerName];
                this.endOfFlowLoops[turtle][endBlk[0]] = [endBlk[1]];
                this.endOfFlowActions[turtle][endBlk[0]] = [endBlk[2]];
            }
            // console.log(this.blocks.blockList[blk].name + ' ends with ' + this.blocks.blockList[endBlk[0]].name);

        } // else {
            // console.log(this.blocks.blockList[blk].name + ' has no end');
        // }
    }

    this.getBlockAtEndOfFlow = function(blk, loopClamp, doClamp) {
        // This method is used to find the end of a child flow.  blk
        // is the first block in a child flow.  This function returns
        // the blk at the end of the child flow. It follows do blocks
        // through their actions and it keeps track of queues created
        // by loops and actions, which must complete in order to mark
        // a flow as completed.
        var lastBlk = blk;
        var newLoopClamp = null;
        var newdoClamp = null;
        // console.log(blk + ': ' + this.blocks.blockList[blk].name);
        while (blk !== null) {
            if (blk !== null && this.loopBlock(this.blocks.blockList[blk].name)) {
                // console.log(blk + ' is a loopClamp');
                // console.log(last(this.blocks.blockList[blk].connections));
                if (last(this.blocks.blockList[blk].connections) == null) {
                    // console.log(blk + ' ' + this.blocks.blockList[blk].name + ' ' + last(this.blocks.blockList[blk].connections));
                    newLoopClamp = blk;
                }
            }
            var lastBlk = blk;
            blk = last(this.blocks.blockList[blk].connections);
            // console.log(lastBlk + ': ' + this.blocks.blockList[lastBlk].name);
        }

        // We want the parent loop.
        if (loopClamp == null) {
            loopClamp = newLoopClamp;
        }

        // console.log(loopClamp);

        // Do we need to recurse?
        if (this.blocks.blockList[lastBlk].isClampBlock()) {
            // console.log('recursing... ' + this.blocks.blockList[lastBlk].name);
            var i = this.blocks.blockList[lastBlk].protoblock.args;
            return this.getBlockAtEndOfFlow(this.blocks.blockList[lastBlk].connections[i], loopClamp, doClamp);
        } else if (this.actionBlock(this.blocks.blockList[lastBlk].name)) {
            var argBlk = this.blocks.blockList[lastBlk].connections[1];
            if (argBlk !== null) {
                var name = this.blocks.blockList[argBlk].value;
                if (doClamp == null) {
                    doClamp = lastBlk;
                }
                if (name in this.actions) {
                    return this.getBlockAtEndOfFlow(this.actions[name], loopClamp, doClamp);
                }
            }
        } else if (this.namedActionBlock(this.blocks.blockList[lastBlk].name)) {
            var name = this.blocks.blockList[lastBlk].privateData;
            // console.log(name);
            if (doClamp == null) {
                doClamp = lastBlk;
            }
            if (name in this.actions) {
                return this.getBlockAtEndOfFlow(this.actions[name], loopClamp, doClamp);
            }
        }

        // console.log(lastBlk + ' ' + loopClamp + ' ' + doClamp);
        return [lastBlk, loopClamp, doClamp];
    }

    this.getTargetTurtle = function(args) {
        // The target turtle name can be a string or an int. Make
        // sure there is a turtle by this name and then find the
        // associated start block.

        var targetTurtle = args[0];

        // We'll compare the names as strings.
        if (typeof(targetTurtle) === 'number') {
            targetTurtle = targetTurtle.toString();
        }

        for (var i = 0; i < this.turtles.turtleList.length; i++) {
            var turtleName = this.turtles.turtleList[i].name;
            if (typeof(turtleName) === 'number') {
                turtleName = turtleName.toString();
            }
            if (turtleName === targetTurtle) {
                return i;
            }
        }

        return null;
    }

    // FIXME: do we need to worry about calc blocks too?
    this.actionBlock = function(name) {
        return ['do', 'doArg', 'calc', 'calcArg'].indexOf(name) !== -1;
    }

    this.namedActionBlock = function(name) {
        return ['nameddo', 'nameddoArg', 'namedcalc', 'namedcalcArg'].indexOf(name) !== -1;
    }

    this.loopBlock = function(name) {
        return ['forever', 'repeat', 'while', 'until'].indexOf(name) !== -1;
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
            // In this case, we flush the child flow.
            this.turtles.turtleList[turtle].queue.pop();
            return;
        }

        // For while and until, we need to add any childflow from the
        // parent to the queue.
        if (parentLoopBlock.name === 'while' || parentLoopBlock.name === 'until') {
            var childFlow = last(parentLoopBlock.connections);
            if (childFlow !== null) {
                var queueBlock = new Queue(childFlow, 1, loopBlkIdx);
                // We need to keep track of the parent block to the
                // child flow so we can unlightlight the parent block
                // after the child flow completes.
                this.parentFlowQueue[turtle].push(loopBlkIdx);
                this.turtles.turtleList[turtle].queue.push(queueBlock);
            }
        }
    }

    this.parseArg = function(logo, turtle, blk, parentBlk, receivedArg) {
        // Retrieve the value of a block.
        if (blk == null) {
            logo.errorMsg('Missing argument.', parentBlk);
            logo.stopTurtle = true;
            return null
        }

        if (logo.blocks.blockList[blk].protoblock.parameter) {
            if (logo.parameterQueue[turtle].indexOf(blk) === -1) {
                logo.parameterQueue[turtle].push(blk);
            }
        }

        if (logo.blocks.blockList[blk].isValueBlock()) {
            if (logo.blocks.blockList[blk].name === 'number' && typeof(logo.blocks.blockList[blk].value) === 'string') {
                try {
                    logo.blocks.blockList[blk].value = Number(logo.blocks.blockList[blk].value);
                } catch (e) {
                    console.log(e);
                }
            }
            return logo.blocks.blockList[blk].value;
        } else if (logo.blocks.blockList[blk].isArgBlock() || logo.blocks.blockList[blk].isArgClamp()) {
            switch (logo.blocks.blockList[blk].name) {
                case 'loudness':
                    try {  // DEBUGGING P5 MIC
                    if (!logo.mic.enabled) {
                        logo.mic.start();
                        logo.blocks.blockList[blk].value = 0;
                    } else {
                        logo.blocks.blockList[blk].value = Math.round(logo.mic.getLevel() * 1000);
                    }
                    } catch (e) {  // MORE DEBUGGING
                        console.log(e);
                        logo.mic.start();
                        logo.blocks.blockList[blk].value = Math.round(logo.mic.getLevel() * 1000);
                    }
                    break;
                case 'eval':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = Number(eval(a.replace(/x/g, b.toString())));
                    break;
                case 'arg':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    var action_args=receivedArg
                    if(action_args.length >= Number(name)){
                        var value = action_args[Number(name)-1];
                        logo.blocks.blockList[blk].value = value;
                    }else {
                        logo.errorMsg('Invalid argument',blk);
                        logo.stopTurtle = true;
                    }
                    return logo.blocks.blockList[blk].value;
                    break;
                case 'box':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
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
                case 'namedarg' :
                    var name = logo.blocks.blockList[blk].privateData;
                    var action_args = receivedArg;
                    if(action_args.length >= Number(name)){
                        var value = action_args[Number(name)-1];
                        logo.blocks.blockList[blk].value = value;
                    }else {
                        logo.errorMsg('Invalid argument',blk);
                    }
                    return logo.blocks.blockList[blk].value;
                    break;
                case 'sqrt':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    if (a < 0) {
                        logo.errorMsg(NOSQRTERRORMSG, blk);
                        logo.stopTurtle = true;
                        a = -a;
                    }
                    logo.blocks.blockList[blk].value = logo.doSqrt(a);
                    break;
                case 'int':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    logo.blocks.blockList[blk].value = Math.floor(a);
                    break;
                case 'mod':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo.doMod(a, b);
                    break;
                case 'not':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    logo.blocks.blockList[blk].value = !a;
                    break;
                case 'greater':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = (Number(a) > Number(b));
                    break;
                case 'equal':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = (a === b);
                    break;
                case 'less':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    var result = (Number(a) < Number(b));
                    logo.blocks.blockList[blk].value = result;
                    break;
                case 'random':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo.doRandom(a, b);
                    break;
                case 'oneOf':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo.doOneOf(a, b);
                    break;
                case 'plus':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo.doPlus(a, b);
                    break;
                case 'multiply':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo.doMultiply(a, b);
                    break;
                case 'divide':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo.doDivide(a, b);
                    break;
                case 'minus':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo.doMinus(a, b);
                    break;
                case 'neg':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo.doMinus(0, a);
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
                    var targetTurtle = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    for (var i = 0; i < logo.turtles.turtleList.length; i++) {
                        var logoTurtle = logo.turtles.turtleList[i];
                        if (targetTurtle === logoTurtle.name) {
                            if (logo.blocks.blockList[blk].name === 'yturtle') {
                                logo.blocks.blockList[blk].value = logo.turtles.screenY2turtleY(logoTurtle.container.y);
                            } else {
                                logo.blocks.blockList[blk].value = logo.turtles.screenX2turtleX(logoTurtle.container.x);
                            }
                            break;
                        }
                    }
                    if (i === logo.turtles.turtleList.length) {
                        logo.errorMsg('Could not find turtle ' + targetTurtle, blk);
                        logo.blocks.blockList[blk].value = 0;
                    }
                    break;
                case 'bpm':
                    if (logo.bpm[turtle].length > 0) {
                        logo.blocks.blockList[blk].value = last();
                    } else {
                        logo.blocks.blockList[blk].value = TARGETBPM;
                    }
                    break;
                case 'key':
                    logo.blocks.blockList[blk].value = logo.keySignature[turtle];
                    break;
                case 'transposition':
                    logo.blocks.blockList[blk].value = logo.transposition[turtle];
                    break;
                case 'duplicatefactor':
                    logo.blocks.blockList[blk].value = logo.duplicateFactor[turtle];
                    break;
                case 'skipfactor':
                    logo.blocks.blockList[blk].value = logo.skipFactor[turtle];
                    break;
                case 'notevolumefactor':
                    logo.blocks.blockList[blk].value = logo.polyVolume[turtle];
                    break;
                case 'beatfactor':
                    logo.blocks.blockList[blk].value = logo.beatFactor[turtle];
                    break;
                case 'currentnote':
                    logo.blocks.blockList[blk].value = logo.currentNotes[turtle];
                    break;
                case 'currentoctave':
                    logo.blocks.blockList[blk].value = logo.currentOctaves[turtle];
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
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = a && b;
                    break;
                case 'or':
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = a || b;
                    break;
                case 'time':
                    var d = new Date();
                    logo.blocks.blockList[blk].value = (d.getTime() - logo.time) / 1000;
                    break;
                case 'hspace':
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var v = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
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
                    var ctx = this.canvas.getContext('2d');
                    var imgData = ctx.getImageData(x, y, 1, 1).data;
                    var color = searchColors(imgData[0], imgData[1], imgData[2]);
                    if (imgData[3] === 0) {
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
                case 'tofrequency':
                    var block = logo.blocks.blockList[blk];
                    var cblk = block.connections[1];
                    var v = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    try {
                        if (typeof(v) === 'string') {
                            v = v.toUpperCase();
                            var note = ['A', 'A♯/B♭', 'B', 'C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭'].indexOf(v[0]);
                            var octave = v[1];
                            if (note > 2) {
                                octave -= 1;  // New octave starts on C
                            }
                            var i = octave * 12 + note;
                            block.value = 27.5 * Math.pow(1.05946309435929, i);
                        } else {
                            block.value = 440 * Math.pow(2, (v - 69) / 12);
                        }
                    } catch (e) {
                        this.errorMsg(v + ' is not a note.');
                        block.value = 440;
                    }
                    break;
                case 'pop':
                    var block = logo.blocks.blockList[blk];
                    if (turtle in logo.turtleHeaps && logo.turtleHeaps[turtle].length > 0) {
                        block.value = logo.turtleHeaps[turtle].pop();
                    } else {
                        logo.errorMsg(_('empty heap'));
                        block.value = null;
                    }
                    break;
                case 'indexHeap':
                    var block = logo.blocks.blockList[blk];
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    if (!(turtle in logo.turtleHeaps)) {
                        logo.turtleHeaps[turtle] = [];
                    }
                    // If index > heap length, grow the heap.
                    while (logo.turtleHeaps[turtle].length < a) {
                        logo.turtleHeaps[turtle].push(null);
                    }
                    block.value = logo.turtleHeaps[turtle][a - 1];
                    break;
                case 'heapLength':
                    var block = logo.blocks.blockList[blk];
                    if (!(turtle in logo.turtleHeaps)) {
                        logo.turtleHeaps[turtle] = [];
                    }
                    console.log(logo.turtleHeaps[turtle].length);
                    block.value = logo.turtleHeaps[turtle].length;
                    break;
                case 'heapEmpty':
                    var block = logo.blocks.blockList[blk];
                    if (turtle in logo.turtleHeaps) {
                        block.value = (logo.turtleHeaps[turtle].length === 0);
                    } else {
                        block.value = true;
                    }
                    break;
                case 'calc':
                    var actionArgs = [];
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    actionArgs = receivedArg;
                    // logo.getBlockAtStartOfArg(blk);
                    if (name in logo.actions) {
                        logo.runFromBlockNow(logo, turtle, logo.actions[name], true, actionArgs, logo.turtles.turtleList[turtle].queue.length);
                        logo.blocks.blockList[blk].value = logo.returns.shift();
                    } else {
                        logo.errorMsg(NOACTIONERRORMSG, blk, name);
                        logo.stopTurtle = true;
                    }
                    break;
                case 'namedcalc':
                    var name = logo.blocks.blockList[blk].privateData;
                    var actionArgs = [];

                    actionArgs = receivedArg;
                    // logo.getBlockAtStartOfArg(blk);
                    if (name in logo.actions) {
                        logo.runFromBlockNow(logo, turtle, logo.actions[name], true, actionArgs, logo.turtles.turtleList[turtle].queue.length);
                        logo.blocks.blockList[blk].value = logo.returns.shift();
                    } else {
                        logo.errorMsg(NOACTIONERRORMSG, blk, name);
                        logo.stopTurtle = true;
                    }
                    break;
                case 'calcArg':
                    var actionArgs = [];
                    // logo.getBlockAtStartOfArg(blk);
                    if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                        for (var i = 0; i < logo.blocks.blockList[blk].argClampSlots.length; i++){
                            var t = (logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i + 2], blk, receivedArg));
                            actionArgs.push(t);
                        }
                    }
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    if (name in logo.actions) {
                        logo.runFromBlockNow(logo, turtle, logo.actions[name], true, actionArgs, logo.turtles.turtleList[turtle].queue.length);
                        logo.blocks.blockList[blk].value = logo.returns.pop();
                    } else {
                        logo.errorMsg(NOACTIONERRORMSG, blk, name);
                        logo.stopTurtle = true;
                    }
                    break;
                case 'namedcalcArg':
                    var name = logo.blocks.blockList[blk].privateData;
                    var actionArgs = [];
                    // logo.getBlockAtStartOfArg(blk);
                    if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                        for (var i = 0; i < logo.blocks.blockList[blk].argClampSlots.length; i++){
                            var t = (logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i + 1], blk, receivedArg));
                            actionArgs.push(t);
                        }
                    }
                    if (name in logo.actions) {
                        // Just run the stack.
                        logo.runFromBlockNow(logo, turtle, logo.actions[name], true, actionArgs, logo.turtles.turtleList[turtle].queue.length);
                        logo.blocks.blockList[blk].value = logo.returns.pop();
                    } else {
                        logo.errorMsg(NOACTIONERRORMSG, blk, name);
                        logo.stopTurtle = true;
                    }
                    break;
                case 'doArg':
                    return blk;
                    break;
                case 'nameddoArg':
                    return blk;
                    break;
                case 'returnValue':
                    if (logo.returns.length > 0) {
                        logo.blocks.blockList[blk].value = logo.returns.pop();
                    } else {
                        console.log('WARNING: No return value.');
                        logo.blocks.blockList[blk].value = 0;
                    }
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
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        return Math.floor(Math.random() * (Number(b) - Number(a) + 1) + Number(a));
    }

    this.doOneOf = function(a, b) {
        if (Math.random() < 0.5) {
            return a;
        } else {
            return b;
        }
    }

    this.doMod = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        return Number(a) % Number(b);
    }

    this.doSqrt = function(a) {
        if (typeof(a) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        return Math.sqrt(Number(a));
    }

    this.doPlus = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            if (typeof(a) === 'string') {
                var aString = a;
            } else {
                var aString = a.toString();
            }
            if (typeof(b) === 'string') {
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
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        return Number(a) - Number(b);
    }

    this.doMultiply = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        return Number(a) * Number(b);
    }

    this.doDivide = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }
        if (Number(b) === 0) {
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
        if (turtle === -1) {
            var c = platformColor.background;
        } else {
            var c = this.turtles.turtleList[turtle].canvasColor;
        }

        body.style.background = c;
        document.querySelector('.canvasHolder').style.background = c;
        this.svgOutput = '';
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


    // Music extensions
    // WHY ARE THESE HERE? Why not in matrix.js?

    this.playMatrix = function() {
        Tone.Transport.stop();
        matrix.playNotesString(0, this.polySynth);
        this.setTurtleDelay(4500 * parseFloat(1 / this.denominator) * (this.numerator));
        var logo = this;
        setTimeout(function() {logo.setTurtleDelay(0);}, logo.setTurtleDelay(4500 * parseFloat(1 / logo.denominator) * (logo.numerator)));
    }

    this.saveMatrix = function() {
        matrix.saveMatrix();
    }

    this.clearMatrix = function() {
        matrix.clearMatrix(this.polySynth);
    }

    this.getNumber = function(solfege, octave) {
         // converts a note to a number

         if (octave < 1) {
             var num = 0;
         } else if (octave > 10) {
             var num = 9 * 12;
         } else {
             var num = 12 * (octave - 1);
         }
         var notes = {
             'C': 1,
             'D': 3,
             'E': 5,
             'F': 6,
             'G': 8,
             'A': 10,
             'B': 12
         };
         solfege = String(solfege);
         if (solfege.substring(0, 1) in notes) {
             num += notes[solfege.substring(0, 1)];
             if (solfege.length >= 1) {
                 var delta = solfege.substring(1);
                 if (delta === 'bb' || delta === '♭♭') {
                     num -= 2;
                 } else if (delta === '##' || delta === '♯♯') {
                     num += 2;
                 } else if (delta === 'b' || delta === '♭') {
                     num -= 1;
                 } else if (delta === '#' || delta === '♯') {
                     num += 1;
                 }
             }
         }
         return num;
    }

    this.getNumNote = function(value, delta) {
        // Converts from number to note
        var num = value + delta;
        if (num < 0) {
            num = 1;
            var octave = 1;
        } else if (num > 10 * 12) {
            num = 12;
            var octave = 10;
        } else {
            var octave = Math.floor(num / 12);
            num = num % 12;
        }

        var notes = {
            1: "do",
            2: "do♯",
            3: "re",
            4: "re♯",
            5: "mi",
            6: "fa",
            7: "fa♯",
            8: "sol",
            9: "sol♯",
            10: "la",
            11: "la♯",
            0: "ti"
        };
        var note = notes[num];

        if (notes[num] === "ti") {
            octave -= 1;
        }
        return [note, octave + 1];
    }

    this.getNote = function (solfege, octave, transposition, keySignature) {
        SHARP = '♯';
        FLAT = '♭';

        this.validNote = true;
        var sharpFlat = false;

        octave = Math.round(octave);
        transposition = Math.round(transposition);
        if (typeof(solfege) === 'number') {
            solfege = solfege.toString();
        }

        // Check for double flat or double sharp.
        var len = solfege.length;
        if (len > 2) {
            var lastTwo = solfege.slice(len - 2);
            if (lastTwo === 'bb' || lastTwo === '♭♭') {
                solfege = solfege.slice(0, len - 1);
                transposition -= 1;
            } else if (lastTwo === '##' || lastTwo === '♯♯') {
                solfege = solfege.slice(0, len - 1);
                transposition += 1;
            }
        }

        var bToFlat = {'Eb': 'E♭', 'Gb': 'G♭', 'Ab': 'A♭', 'Bb': 'B♭', 'Db': 'D♭', 'Cb': 'C♭', 'Fb': 'F♭', 'eb': 'E♭', 'gb': 'G♭', 'ab': 'A♭', 'bb': 'B♭', 'db': 'D♭', 'cb': 'C♭', 'fb': 'F♭'};
        var notesSharp = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
        var notesFlat = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
        var notesFlat2 = ['c', 'd♭', 'd', 'e♭', 'e', 'f', 'g♭', 'g', 'a♭', 'a', 'b♭', 'b'];
        var extraTranspositions = {'E♯':['F', 0], 'B♯':['C', 1], 'C♭':['B', -1], 'F♭':['E', 0], 'e♯':['F', 0], 'b♯':['C', 1], 'c♭':['B', -1], 'f♭':['E', 0]};
        var majorHalfSteps = {'DO': 0, 'DI': 1, 'RA': 1, 'RE': 2, 'RI': 3, 'MA': 3, 'ME': 3, 'MI': 4, 'FA': 5, 'FI': 6, 'SE': 6, 'SO': 7, 'SOL': 7, 'SI': 8, 'LE': 8, 'LO': 8, 'LA': 9, 'LI': 10, 'TE': 10, 'TA': 10, 'TI': 11};
        // Is this correct, or is minor solfege expressed by using
        // DO RE MA FA SOL LE TE?
        var minorHalfSteps = {'DO': 0, 'DI': 1, 'RA': 1, 'RE': 2, 'RI': 3, 'MA': 2, 'ME': 2, 'MI': 3, 'FA': 5, 'FI': 6, 'SE': 6, 'SO': 7, 'SOL': 7, 'SI': 8, 'LE': 7, 'LO': 7, 'LA': 8, 'LI': 9, 'TE': 9, 'TA': 9,  'TI': 10};

        // Already a note? No need to convert from solfege.
        if (solfege in bToFlat) {
            solfege = bToFlat[solfege];
        }
        if (solfege in extraTranspositions) {
            octave += extraTranspositions[solfege][1];
            note = extraTranspositions[solfege][0];
        } else if (notesSharp.indexOf(solfege.toUpperCase()) !== -1) {
            note = solfege.toUpperCase();
        } else if (notesFlat.indexOf(solfege) !== -1) {
            note = solfege;
        } else if (notesFlat2.indexOf(solfege) !== -1) {
            // Convert to uppercase, e.g., d♭ -> D♭.
            note = notesFlat[notesFlat2.indexOf(solfege)];
        } else {
            // Not a note, so convert from Solfege.
            // Could be mi#<sub>4</sub> (from matrix) or mi# (from note).
            if (solfege.substr(-1) === '>') {
                // Read octave and solfege from HTML
                octave = parseInt(solfege.slice(solfege.indexOf('>') + 1, solfege.indexOf('/') - 1));
                solfege = solfege.substr(0, solfege.indexOf('<'));
            }
            if(['#', '♯', '♭', 'b'].indexOf(solfege.substr(-1)) !== -1) {
                sharpFlat = true;
            }

            if (!keySignature) {
                keySignature = 'C';
            }
            if (keySignature.substr(-1) === 'm' || keySignature.slice(1).toLowerCase() === 'minor') {
                var thisScale = notesFlat;
                var halfSteps = minorHalfSteps;  // 0 2 3 5 7 8 10
                var keySignature = keySignature.substr(0, keySignature.length - 1);
                var major = false;
            } else {
                var thisScale = notesSharp;
                var halfSteps = majorHalfSteps;  // 0 2 4 5 7 9 11
                var keySignature = keySignature;
                var major = true;
            }

            if (keySignature in extraTranspositions) {
                keySignature = extraTranspositions[keySignature][0];
            }

            offset = thisScale.indexOf(keySignature);
            if (offset === -1) {
                console.log('WARNING: Key ' + keySignature + ' not found in ' + thisScale + '. Using default of C');
                var offset = 0;
                var thisScale = notesSharp;
            }

            var twoCharSolfege = solfege.toUpperCase().substr(0,2);
            if(solfege.toUpperCase().substr(0,4) === 'REST') {
                return ['R', ''];
            } else if (twoCharSolfege in halfSteps) {
                var index = halfSteps[twoCharSolfege] + offset;
                // console.log(solfege + ' ' + twoCharSolfege + ' ' + offset + ' ' + index + ' ' + thisScale[index]);
                if (index > 11) {
                    index -= 12;
                    octave += 1;
                }
                note = thisScale[index];
            } else {
                console.log('WARNING: Note ' + solfege + ' not found. Returning C');
                this.validNote = false;
                return ['C', octave];
            }

            if (sharpFlat) {
                if (solfege.substr(-1) === '#') {
                    note = note + '♯';
                } else if (solfege.substr(-1) === '♯') {
                    note = note + '♯';
                } else if (solfege.substr(-1) === '♭') {
                    note = note + '♭';
                } else if(solfege.substr(-1) === 'b') {
                    note = note + '♭';
                }
                if (note in extraTranspositions) {
                    octave += extraTranspositions[note][1];
                    note = extraTranspositions[note][0];
                }
            }
        }

        if (transposition && transposition !== 0) {
            if (transposition < 0) {
                deltaOctave = -Math.floor(-transposition / 12);
                deltaNote = -(-transposition % 12);
            } else {
                deltaOctave = Math.floor(transposition / 12);
                deltaNote = transposition % 12;
            }

            octave += deltaOctave;

            if (notesSharp.indexOf(note) !== -1) {
                i = notesSharp.indexOf(note);
                i += deltaNote;
                if (i < 0) {
                    i += 12;
                    octave -= 1;
                } else if (i > 11) {
                    i -= 12;
                    octave += 1;
                }
                note = notesSharp[i];
            } else if (notesFlat.indexOf(note) !== -1) {
                i = notesFlat.indexOf(note);
                i += deltaNote;
                if (i < 0) {
                    i += 12;
                    octave -= 1;
                } else if (i > 11) {
                    i -= 12;
                    octave += 1;
                }
                note = notesFlat[i];
            } else {
                console.log('note not found? ' + note);
            }
        }

        if (octave < 1) {
            return [note, 1];
        } else if (octave > 10) {
            return [note, 10];
        } else {
            return [note, octave];
        }
    }

    this.stageNotesForLilypond = function (turtle, note, duration, dotted, doubleDotted, tupletValue, insideChord) {
        if (turtle in this.lilypondStaging) {
            this.lilypondStaging[turtle].push([note, duration, dotted, doubleDotted, tupletValue, insideChord]);
        } else {
            this.lilypondStaging[turtle] = [[note, duration, dotted, doubleDotted, tupletValue, insideChord]];
        }
    }

    this.updateNotation = function (note, duration, turtle, insideChord) {
        // FIXME: try approximating duration using ties???

        var POWER2 = [1, 2, 4, 8, 16, 32, 64, 128];
        var dotted = false;
        var doubleDotted = false;
        var tupletValue = -1;

        if (POWER2.indexOf(duration) === -1) {
            if (POWER2.indexOf(duration * 1.5) === -1) {
                if (POWER2.indexOf(duration * 1.75) === -1) {
                    // First, see if the note is a tuplet (has a
                    // factor of 2).
                    var factorOfTwo = 1;
                    console.log(duration + ' ' + Math.floor(duration / 2));
                    while (Math.floor(duration / 2) * 2 === duration) {
                        factorOfTwo *= 2;
                        duration /= 2;
                    }
                    if (factorOfTwo > 1) {
                        // We have a tuplet of sorts
                        console.log('tuplet ' + factorOfTwo + ' ' + duration);
                        tupletValue = duration;
                        duration = factorOfTwo;
                    } else {
                        // Otherwise, find an approximate solution.
                        console.log('cannot convert ' + duration + ' to a note');
                        for (var i = 1; i < POWER2.length; i++) {
                            // Rounding down
                            if (duration < POWER2[i]) {
                                duration = POWER2[i - 1];
                                break;
                            }
                        }
                        if (POWER2.indexOf(duration) === -1) {
                            duration = 128;
                        }
                        console.log('substuting in ' + duration);
                    }
                } else {
                    duration = POWER2[POWER2.indexOf(duration * 1.75)];
                    doubleDotted = true;
                }
            } else {
                duration = POWER2[POWER2.indexOf(duration * 1.5)];
                dotted = true;
            }
        }

        // Push notes for lilypond.
        this.stageNotesForLilypond(turtle, note, duration, dotted, doubleDotted, tupletValue, insideChord);
    }

    this.processLilypondNotes = function (turtle) {
        // TODO: process all the notes together rather than one at a
        // time so that you can generate tuplets.

        // obj = [instructions] or
        // obj = [note, duration, dotted, doubleDotted, tupletValue, insideChord]

        this.lilypondNotes[turtle] = '';

        function toLilynote (note) {
            // Lilypond notes use is for sharp, es for flat,
            // , and ' for shifts in octave.
            // Also, notes must be lowercase.
            return note.replace(/♯/g, 'is').replace(/♭/g, 'es').replace(/10/g, "''''''''").replace(/1/g, ',,').replace(/2/g, ',').replace(/3/g, '').replace(/4/g, "'").replace(/5/g, "''").replace(/6/g, "'''").replace(/7/g, "''''").replace(/8/g, "''''''").replace(/9/g, "'''''''").toLowerCase();
        }

        for (var i = 0; i < this.lilypondStaging[turtle].length; i++) {
            obj = this.lilypondStaging[turtle][i];
            var note = toLilynote(obj[0]);
            var singleton = false;

            // If it is a tuplet, look ahead to see if it is complete.
            if (obj[4] > 0) {  // tupletValue
                var j = 1;
                var k = 1;
                while (k < obj[4]) {
                    if (i + j >= this.lilypondStaging[turtle].length) {
                        singleton = true;
                        break;
                    }
                    if (this.lilypondStaging[turtle][i + j][5] > 0 && this.lilypondStaging[turtle][i + j][5] === this.lilypondStaging[turtle][i + j - 1][5]) {
                        // In a chord, so jump to next note.
                        j++;
                    } else if (this.lilypondStaging[turtle][i + j][4] !== obj[4]) {
                        singleton = true;
                        break;
                    } else {
                        j++;  // Jump to next note.
                        k++;  // Increment notes in tuplet.
                    }
                }
            }

            if (obj[4] > 0 && !singleton) {
                // lilypond tuplets look like this: \tuplet 3/2 { f8 g a }
                // multiplier = tuplet_duration / target_duration
                // e.g., (3/8) / (1/4) = (3/8) * 4 = 12/8 = 3/2
                // There may be chords embedded.
                tuplet_count = obj[4];
                if ((obj[1] / 2) * 2 === obj[1]) {
                    var target_duration = obj[1] / 2;
                } else {
                    tuplet_count *= 2;
                    var target_duration = obj[1];
                }
                this.lilypondNotes[turtle] += '%5Ctuplet ' + tuplet_count + '%2F' + target_duration + ' { ';
                var tuplet_duration = 2 * obj[1];

                var j = 0;
                var k = 0;
                while (k < obj[4]) {
                    var tuplet_duration = 2 * this.lilypondStaging[turtle][i + j][1];
                    // Are we in a chord?
                    if (this.lilypondStaging[turtle][i + j][5] > 0) {
                        // Is this the first note in the chord?
                        if ((i === 0 && j === 0) || this.lilypondStaging[turtle][i + j - 1][5] !== this.lilypondStaging[turtle][i + j][5]) {
                            this.lilypondNotes[turtle] += '< ';
                        }

                        this.lilypondNotes[turtle] += toLilynote(this.lilypondStaging[turtle][i + j][0]) + ' ';

                        // Is this the last note in the chord?
                        if (i + j === this.lilypondStaging[turtle].length - 1 || this.lilypondStaging[turtle][i + j + 1][5] !== this.lilypondStaging[turtle][i + j][5]) {
                            this.lilypondNotes[turtle] += ' > ' + tuplet_duration + ' ';
                            k++;  // Increment notes in tuplet.
                        }
                        j++;
                    } else {
                        this.lilypondNotes[turtle] += toLilynote(this.lilypondStaging[turtle][i + j][0]) + tuplet_duration + ' ';
                        j++;  // Jump to next note.
                        k++;  // Increment notes in tuplet.
                    }
                }

                this.lilypondNotes[turtle] += '} ';
                i += j - 1;
            } else {
                if (obj[5] > 0) {  // insideChord
                    // Is this the first note in the chord?
                    if (i === 0 || this.lilypondStaging[turtle][i - 1][5] !== obj[5]) {
                        this.lilypondNotes[turtle] += '< ';
                    }
                    this.lilypondNotes[turtle] += (note);
                    // Is this the last note in the chord?
                    if (i === this.lilypondStaging[turtle].length - 1 || this.lilypondStaging[turtle][i + 1][5] !== obj[5]) {
                        this.lilypondNotes[turtle] += '> ';
                    }
                } else if (obj[2]) {  // dotted
                    this.lilypondNotes[turtle] += (note + obj[1] + '.');
                } else if (obj[3]) {  // doubleDotted
                    this.lilypondNotes[turtle] += (note + obj[1] + '..');
                } else {
                    this.lilypondNotes[turtle] += (note + obj[1]);
                }
                // singleton (incomplete tuplets)
                if (singleton) {
                    this.lilypondNotes[turtle] += '-' + obj[4];  // tupletValue
                }
            }
            this.lilypondNotes[turtle] += ' ';
        }
    }

    this.saveLilypondOutput = function(saveName) {
        var turtleCount = 0;
        var clef = [];
        var RODENTS = [_('mouse'), _('brown rat'), _('mole'), _('chipmunk'), _('red squirrel'), _('guinea pig'), _('capybara'), _('coypu'), _('black rat'), _('grey squirrel'), _('flying squirrel'), _('bat')];
        var RODENTSSHORT = [_('ra'), _('rb'), _('rc'), _('rd'), _('re'), _('rf'), _('rg'), _('rh'), _('ri'), _('rj'), _('rk'), _('rl')];
        for (var t in this.lilypondStaging) {
            turtleCount += 1;
        }
        console.log('saving as lilypond: ' + turtleCount);

        this.lilypondOutput += '%25 You can change the MIDI instruments below to anything on this list:%0A%25 (http:%2F%2Flilypond.org%2Fdoc%2Fv2.18%2Fdocumentation%2Fnotation%2Fmidi-instruments)%0A%0A';

        var c = 0;
        for (var t in this.lilypondStaging) {
            if (this.lilypondStaging[t].length > 0) {
                var octaveTotal = 0;
                var noteCount = 0;
                for (var i = 0; i < this.lilypondStaging[t].length; i++) {
                    obj = this.lilypondStaging[t][i];
                    if (obj.length > 1) {
                        octaveTotal += parseInt(obj[0].substr(obj[0].length - 1));
                        noteCount += 1;
                    }
                }
                if (noteCount > 0) {
                    switch (Math.floor(octaveTotal / noteCount)) {
                    case 0:
                    case 1:
                    case 2:
                        clef.push('bass_8');
                        break;
                    case 3:
                        clef.push('bass');
                        break;
                    default:
                        clef.push('treble');
                        break;
                    }
                } else {
                    clef.push('treble');
                }
                this.processLilypondNotes(t);
                var instrumentName = this.turtles.turtleList[t].name;
                if (instrumentName === _('start')) {
                    instrumentName = RODENTS[t % 12].replace(/ /g, '_');
                } else if (instrumentName === t.toString()) {
                    instrumentName = RODENTS[t % 12].replace(/ /g, '_');
                }
                this.lilypondOutput += instrumentName + ' = {%0A';
                this.lilypondOutput += '%25 %5Cmeter%0A';
                this.lilypondOutput += this.lilypondNotes[t];

                // Add bar to last turtle's output.
                if (c === turtleCount - 1) {
                    this.lilypondOutput += ' %5Cbar "%7C."'
                }
                this.lilypondOutput += '%0A}%0A%0A';

                var shortInstrumentName = RODENTSSHORT[t % 12];

                this.lilypondOutput += instrumentName.replace(/ /g, '_') + 'Voice = ';
                this.lilypondOutput += '%5Cnew Staff %5Cwith {%0A';
                this.lilypondOutput += '   %5Cclef "' + last(clef) + '"%0A';
                this.lilypondOutput += '   instrumentName = "' + instrumentName + '"%0A';
                this.lilypondOutput += '   shortInstrumentName = "' + shortInstrumentName + '"%0A';
                this.lilypondOutput += '   midiInstrument = "acoustic grand"%0A';
                this.lilypondOutput += '} { %5Cclef ' + last(clef) + ' %5C' + instrumentName.replace(/ /g, '_') + ' }%0A%0A';
            }
            c += 1;
        }

        // Begin the SCORE section.
        this.lilypondOutput += '%0A%5Cscore {%0A';
        this.lilypondOutput += '   <<%0A';

        // Sort the staffs, treble on top, bass_8 on the bottom.
        var CLEFS = ['treble', 'bass', 'bass_8'];
        for (var c = 0; c < CLEFS.length; c++) {
            var i = 0;
            for (var t in this.lilypondNotes) {
                if (clef[i] === CLEFS[c]) {
                    if (this.lilypondStaging[t].length > 0) {
                        var instrumentName = this.turtles.turtleList[t].name;
                        if (instrumentName === _('start')) {
                            instrumentName = RODENTS[t % 12].replace(/ /g, '_');
                        } else if (instrumentName === t.toString()) {
                            instrumentName = RODENTS[t % 12];
                        }
                        this.lilypondOutput += '      %5C' + instrumentName.replace(/ /g, '_') + 'Voice%0A';
                    }
                }
            }
        }

        // Add GUITAR TAB in comments.
        this.lilypondOutput += '%0A%0A%25 GUITAR TAB SECTION%0A%25 Delete the %25{ and %25} below to include guitar tablature output.%0A%25{%0A      %5Cnew TabStaff = "guitar tab" %0A      <<%0A         %5Cclef moderntab%0A';
        for (var c = 0; c < CLEFS.length; c++) {
            var i = 0;
            for (var t in this.lilypondNotes) {
                if (clef[i] === CLEFS[c]) {
                    if (this.lilypondStaging[t].length > 0) {
                        var instrumentName = this.turtles.turtleList[t].name;
                        if (instrumentName === _('start')) {
                            instrumentName = RODENTS[t % 12].replace(/ /g, '_');
                        } else if (instrumentName === t.toString()) {
                            instrumentName = RODENTS[t % 12];
                        }
                        this.lilypondOutput += '         %5Ccontext TabVoice = "'+ instrumentName + '" %5C' + instrumentName.replace(/ /g, '_') + '%0A';
                    }
                }
            }
        }

        // Close the SCORE sections.
        this.lilypondOutput += '      >>%0A%25}%0A';
        this.lilypondOutput += '%0A   >>%0A   %5Clayout {}%0A%0A';

        // Add MIDI OUTPUT in comments.
        this.lilypondOutput += '%25 MIDI SECTION%0A%25 Delete the %25{ and %25} below to include MIDI output.%0A%25{%0A%5Cmidi {%0A   %5Ctempo 4=90%0A}%0A%25}%0A%0A}%0A%0A';

        // ADD TURTLE BLOCKS CODE HERE
        this.lilypondOutput += '%25 MUSIC BLOCKS CODE%0A';
        this.lilypondOutput += '%25 Below is the code for the Music Blocks project that generated this Lilypond file.%0A%25{%0A%0A';
        // prepareExport() returns json-encoded project data.
        var projectData = prepareExport();
        this.lilypondOutput += projectData.replace(/]],/g, ']],%0A');
        this.lilypondOutput += '%0A%25}%0A%0A';

        doSaveLilypond(this, saveName);
    }
}


function frequencyToNote(hz) {
    // Calculate the note and octave based on frequency, rounding to
    // the nearest note.
    var NOTES = ['A', 'B♭', 'B', 'C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭'];
    var TWELTHROOT2 = 1.05946309435929;
    var A0 = 27.5;
    var C8 = 4186.01;

    if (hz < A0) {
        return 'A0';
    } else if (hz > C8) {
        // FIXME: set upper bound of C10
        return 'C8';
    }

    for (var i = 0; i < 88; i++) {
        var f = A0 * Math.pow(TWELTHROOT2, i);
        if (hz < f * 1.03 && hz > f * 0.97) {
            return [NOTES[i % 12], Math.floor(i / 12)];
        }
    }
    console.log('could not find note/octave for ' + hz);
    return ['?', -1];
}


function noteToFrequency(note, octave) {
    // Calculate the frequency based on note and octave.
    var NOTES = ['A', 'B♭', 'B', 'C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭'];
    var TWELTHROOT2 = 1.05946309435929;
    var A0 = 27.5;

    i = octave * 12 + NOTES.index(self._note);
    return A0 * Math.pow(TWELTHROOT2, i);
}
