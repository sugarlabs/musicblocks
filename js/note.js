class NoteController {
    constructor() {
        console.log("Note created");
    }

    static _playNote(args, logo, turtle, blk, receivedArg) {
        // We queue up the child flow of the note clamp and
        // once all of the children are run, we trigger a
        // _playnote_ event, then wait for the note to play.
        // The note can be specified by pitch or synth blocks.
        // The osctime block specifies the duration in
        // milleseconds while the note block specifies
        // duration as a beat value. Note: we should consider
        // the use of the global timer in Tone.js for more
        // accuracy.
        let childFlow, childFlowCount;
    
        if (args[1] === undefined) {
            // Should never happen, but if it does, nothing to do.
            return;
        }
    
        // Use the outer most note when nesting to determine the beat.
        let beatValue, measureValue;
        if (logo.inNoteBlock[turtle].length === 0) {
            if (
                logo.notesPlayed[turtle][0] / logo.notesPlayed[turtle][1] <
                logo.pickup[turtle]
            ) {
                beatValue = 0;
                measureValue = 0;
            } else {
                beatValue =
                    (((logo.notesPlayed[turtle][0] / logo.notesPlayed[turtle][1] -
                        logo.pickup[turtle]) *
                        logo.noteValuePerBeat[turtle]) %
                        logo.beatsPerMeasure[turtle]) +
                    1;
                measureValue =
                    Math.floor(
                        ((logo.notesPlayed[turtle][0] /
                            logo.notesPlayed[turtle][1] -
                            logo.pickup[turtle]) *
                            logo.noteValuePerBeat[turtle]) /
                            logo.beatsPerMeasure[turtle]
                    ) + 1;
            }
    
            logo.currentBeat[turtle] = beatValue;
            logo.currentMeasure[turtle] = measureValue;
        }
    
        childFlow = args[1];
        childFlowCount = 1;
    
        // And only trigger from the outer most note when nesting.
        if (logo.inNoteBlock[turtle].length === 0) {
            // Queue any beat actions.
            // Put the childFlow into the queue before the beat action
            // so logo the beat action is at the end of the FILO.
            // Note: The offbeat cannot be Beat 1.
            if (logo.beatList[turtle].indexOf("everybeat") !== -1) {
                let queueBlock = new Queue(
                    childFlow,
                    childFlowCount,
                    blk,
                    receivedArg
                );
                logo.parentFlowQueue[turtle].push(blk);
                logo.turtles.turtleList[turtle].queue.push(queueBlock);
                childFlow = null;
    
                let eventName = "__everybeat_" + turtle + "__";
                logo.stage.dispatchEvent(eventName);
            }
    
            if (logo.beatList[turtle].indexOf(beatValue) !== -1) {
                let queueBlock = new Queue(
                    childFlow,
                    childFlowCount,
                    blk,
                    receivedArg
                );
                logo.parentFlowQueue[turtle].push(blk);
                logo.turtles.turtleList[turtle].queue.push(queueBlock);
                childFlow = null;
    
                let eventName = "__beat_" + beatValue + "_" + turtle + "__";
                logo.stage.dispatchEvent(eventName);
            } else if (
                beatValue > 1 &&
                logo.beatList[turtle].indexOf("offbeat") !== -1
            ) {
                let queueBlock = new Queue(
                    childFlow,
                    childFlowCount,
                    blk,
                    receivedArg
                );
                logo.parentFlowQueue[turtle].push(blk);
                logo.turtles.turtleList[turtle].queue.push(queueBlock);
                childFlow = null;
    
                let eventName = "__offbeat_" + turtle + "__";
                logo.stage.dispatchEvent(eventName);
            }
    
            let thisBeat =
                beatValue +
                logo.beatsPerMeasure[turtle] * (logo.currentMeasure[turtle] - 1);
            for (let f = 0; f < logo.factorList[turtle].length; f++) {
                let factor = thisBeat / logo.factorList[turtle][f];
                if (factor === Math.floor(factor)) {
                    let queueBlock = new Queue(
                        childFlow,
                        childFlowCount,
                        blk,
                        receivedArg
                    );
                    logo.parentFlowQueue[turtle].push(blk);
                    logo.turtles.turtleList[turtle].queue.push(queueBlock);
                    childFlow = null;
    
                    let eventName =
                        "__beat_" +
                        logo.factorList[turtle][f] +
                        "_" +
                        turtle +
                        "__";
                    logo.stage.dispatchEvent(eventName);
                }
            }
        }
    
        // A note can contain multiple pitch blocks to create
        // a chord. The chord is accumuated in these arrays,
        // which are used when we play the note.
        logo.clearNoteParams(turtle, blk, []);
        let arg;
        if (args[0] === null || typeof args[0] !== "number") {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            arg = 1 / 4;
        } else {
            arg = args[0];
        }
    
        // Ensure logo note duration is positive.
        let noteBeatValue;
        if (arg > 0) {
            if (logo.blocks.blockList[blk].name === "newnote") {
                noteBeatValue = 1 / arg;
            } else {
                noteBeatValue = arg;
            }
        } else {
            //.TRANS: Note value is the note duration.
            logo.errorMsg(_("Note value must be greater than 0."), blk);
                noteBeatValue = -arg;
        }
    
        logo.inNoteBlock[turtle].push(blk);
        if (logo.inNoteBlock[turtle].length > 1) {
            logo.multipleVoices[turtle] = true;
        }
    
        // Adjust the note value based on the beatFactor.
        logo.noteValue[turtle][last(logo.inNoteBlock[turtle])] =
            1 / (noteBeatValue * logo.beatFactor[turtle]);
    
        let listenerName = "_playnote_" + turtle;
        logo._setDispatchBlock(blk, turtle, listenerName);
    
        let __listener = function(event) {
            if (logo.multipleVoices[turtle]) {
                logo.notationVoices(turtle, logo.inNoteBlock[turtle].length);
            }
    
            if (logo.inNoteBlock[turtle].length > 0) {
                if (logo.inNeighbor[turtle].length > 0) {
                    let neighborNoteValue = logo.neighborNoteValue[turtle];
                    logo.neighborArgBeat[turtle].push(
                        logo.beatFactor[turtle] * (1 / neighborNoteValue)
                    );
    
                    let nextBeat =
                        1 / noteBeatValue - 2 * logo.neighborNoteValue[turtle];
                    logo.neighborArgCurrentBeat[turtle].push(
                        logo.beatFactor[turtle] * (1 / nextBeat)
                    );
                }
    
                logo._processNote(
                    1 / logo.noteValue[turtle][last(logo.inNoteBlock[turtle])],
                    last(logo.inNoteBlock[turtle]),
                    turtle
                );
            }
    
            delete logo.oscList[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteBeat[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteBeatValues[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteValue[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.notePitches[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteCents[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteDrums[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.embeddedGraphics[turtle][last(logo.inNoteBlock[turtle])];
            logo.inNoteBlock[turtle].splice(-1, 1);
    
            if (
                logo.multipleVoices[turtle] &&
                logo.inNoteBlock[turtle].length === 0
            ) {
                logo.notationVoices(turtle, logo.inNoteBlock[turtle].length);
                logo.multipleVoices[turtle] = false;
            }
    
            // FIXME: broken when nesting
            logo.pitchBlocks = [];
            logo.drumBlocks = [];
        };
    
        logo._setListener(turtle, listenerName, __listener);
    
        return [childFlow, childFlowCount];
    }
}
