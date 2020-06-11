function _playSynthBlock(args, logo, turtle, blk) {
    if (args.length === 1) {
        let obj = frequencyToPitch(args[0]);
        // obj[2] is cents
        if (logo.inMatrix) {
            logo.pitchTimeMatrix.addRowBlock(blk);
            if (logo.pitchBlocks.indexOf(blk) === -1) {
                logo.pitchBlocks.push(blk);
            }

            logo.pitchTimeMatrix.rowLabels.push(
                logo.blocks.blockList[blk].name
            );
            logo.pitchTimeMatrix.rowArgs.push(args[0]);
        } else if (logo.inPitchSlider) {
            logo.pitchSlider.Sliders.push([args[0], 0, 0]);
        } else {
            logo.oscList[turtle][last(logo.inNoteBlock[turtle])].push(
                logo.blocks.blockList[blk].name
            );

            // We keep track of pitch and octave for notation purposes.
            logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(
                obj[0]
            );
            logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(
                obj[1]
            );
            logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(obj[2]);
            if (obj[2] !== 0) {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(
                    pitchToFrequency(
                        obj[0],
                        obj[1],
                        obj[2],
                        logo.keySignature[turtle]
                    )
                );
            } else {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(0);
            }

            logo.noteBeatValues[turtle][last(logo.inNoteBlock[turtle])].push(
                logo.beatFactor[turtle]
            );
            logo.pushedNote[turtle] = true;
        }
    }
}

function _playPitch(args, logo, turtle, blk) {
    let useSolfegeName = false;
    let note, octave, cents;
    let arg0, arg1;
    if (logo.blocks.blockList[blk].name === "pitchnumber") {
        if (args.length !== 1 || args[0] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            arg0 = 7;
        } else {
            arg0 = args[0];
        }
        // check if arg0 is a float value and round-off to the nearest integer
        if (arg0 % 1 !== 0) {
            arg0 = Math.floor(arg0 + 0.5);
        }

        if (typeof arg0 !== "number") {
            logo.errorMsg(NANERRORMSG, blk);
            arg0 = 7;
        }

        if (logo.inDefineMode[turtle]) {
            logo.defineMode[turtle].push(Math.floor(arg0));
            return;
        } else {
            // In number to pitch we assume A0 == 0. Here we
            // assume logo C4 == 0, so we need an offset of 39.
            let obj = numberToPitch(
                Math.floor(arg0) + logo.pitchNumberOffset[turtle],
                logo.synth.inTemperament,
                logo.synth.startingPitch,
                logo.pitchNumberOffset[turtle]
            );

            if (
                logo.synth.inTemperament === "custom" &&
                logo.scalarTransposition[turtle] +
                    logo.transposition[turtle] !==
                    0
            ) {
                logo.errorMsg(
                    _(
                        "Scalar transpositions are equal to Semitone transpositions for custom temperament."
                    )
                );
            }

            note = obj[0];
            octave = obj[1];
            cents = 0;
            logo.currentNote = note;
        }
    } else if (logo.blocks.blockList[blk].name === "customNote") {
        if (args[0] === null || args[1] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            logo.stopTurtle = true;
            return;
        } else {
            note = args[0];
            octave = args[1];
        }
    } else {
        if (args[0] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            arg0 = "sol";
        } else {
            arg0 = args[0];
        }

        if (args[1] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            arg1 = 4;
        } else {
            arg1 = args[1];
        }

        if (
            typeof arg0 === "number" &&
            logo.blocks.blockList[blk].name === "pitch"
        ) {
            // We interpret numbers two different ways:
            // (1) a positive integer between 1 and 12 is taken to be
            // a moveable solfege, e.g., 1 == do; 2 == re...
            // (2) if frequency is input, ignore octave (arg1).
            // Negative numbers will throw an error.
            let octave, cents;
            if (arg0 < 13) {
                // moveable solfege
                if (arg0 < 1) {
                    console.debug(arg0);
                    logo.errorMsg(INVALIDPITCH, blk);
                    arg0 = 7; // throws an error
                }

                note = scaleDegreeToPitch(
                    logo.keySignature[turtle],
                    Math.floor(arg0)
                );
                logo.currentNote = note;
                octave = Math.floor(
                    calcOctave(
                        logo.currentOctave[turtle],
                        arg1,
                        logo.lastNotePlayed[turtle],
                        logo.currentNote
                    )
                );
                cents = 0;
            } else {
                if (arg0 < A0 || arg0 > C8) {
                    logo.errorMsg(INVALIDPITCH, blk);
                    console.debug(arg0);
                    arg0 = 398;
                }

                let obj = frequencyToPitch(arg0);
                note = obj[0];
                logo.currentNote = note;
                octave = obj[1];
                cents = obj[2];
            }
        } 
        else if (
            Number(arg0[0]) &&
            logo.blocks.blockList[blk].name === "pitch"
        ) {
            let attr, scaledegree;

            if (arg0.indexOf(SHARP) !==-1) {
                attr = SHARP;
            } else if (arg0.indexOf(FLAT) !== -1) {
                attr = FLAT;
            } else if (arg0.indexOf(DOUBLESHARP) !== -1) {
                attr = DOUBLESHARP;
            } else if (arg0.indexOf(DOUBLEFLAT) !== -1) {
                attr = DOUBLEFLAT;
            } else {
                attr = NATURAL;
            }
            scaledegree = Number(arg0.replace(attr, ""));
            note = scaleDegreeToPitch2(logo.keySignature[turtle], scaledegree, logo.moveable[turtle]);

            if(attr != NATURAL) {
                note += attr;
            }
            logo.currentNote = note;

            octave =
                Math.floor(
                    calcOctave(
                        logo.currentOctave[turtle],
                        arg1,
                        logo.lastNotePlayed[turtle],
                        logo.currentNote
                    )
                );
            cents = 0;
        }
        else if (
            typeof arg0 === "number" &&
            (logo.blocks.blockList[blk].name === "nthmodalpitch" || logo.blocks.blockList[blk].name === "scaledegree")
        ) {
            //  (0, 4) --> ti 3; (-1, 4) --> la 3, (-6, 4) --> do 3
            //  (1, 4) --> do 4; ( 2, 4) --> re 4; ( 8, 4) --> do 5
            // if (arg0 < 1) {
            //     arg0 -= 2;
            // }

            // Add a check if arg0 is float
            // round off to closest integer
            if (arg0 % 1 !== 0) {
                arg0 = Math.floor(arg0 + 0.5);
            }

            let neg;
            if (arg0 < 0) {
                neg = true;
                arg0 = -arg0;
            } else {
                neg = false;
            }

            // if (arg0 === 0) {
            //     console.debug(arg0);
            //     logo.errorMsg(INVALIDPITCH, blk);
            //     note = 7;
            // }

            let obj = keySignatureToMode(logo.keySignature[turtle]);
            let modeLength = MUSICALMODES[obj[1]].length;
            let scaleDegree = Math.floor(arg0 - 1) % modeLength;

            /* deltaOctave calculates changes in reference octave which occur a semitone before the reference key
               deltaSemi calculates changes in octave when crossing B.
             */
            let deltaOctave, deltaSemi;
            scaleDegree += 1;

            // Choose a reference based on the key selected. This is based on the position of a note on the circle of fifths e.g C --> 1, G-->8. 
            // Subtract one to make it zero based.
            let ref = NOTESTEP[obj[0].substr(0,1)] -1;
            
            //adjust reference if sharps/flats are present i.e increase by one for a sharp and decrease by one for a flat
            if(obj[0].substr(1) === FLAT) {
                ref--;
            } else if(obj[0].substr(1) === SHARP) {
                ref++;
            }

            /* Number of semitones is used to calculate changes in deltaSemi defined above.
            Semitones is initialised with reference value. e.g If selected key is G, semitone = ref = 7 (8 - 1)
            Now we assume our circle of fifths to start from our ref rather than default C note.
            Whenever a note is played, we add the difference of it's semitones from ref; 
            e.g. If the selected key is G major: ref = 7 and initially semitones = ref = 7.
            G major scale: G A B C D E F# 
            When we play 1st note --> G: semitones = semitones + (position of G on circle of fifths - ref) => 7 + (7 - 7)
            When we play 2nd note -->> A: semitones = semitones + (position of A of circle of fifths - ref) => 7 + (9 - 7)
            And so on. In essence we add the relative difference.
            To change octave we use the following methodology:
            1. If note number input is positive: Whenever the number of semitones will be less than ref, increment deltaSemi by one.
            2. If note number input is negative: Whenever the number of semitones will be greater than ref, increment deltaSemi by one.
            Note that these positions are zero based because we use an array to find indexes.
            
            Notice that deltaSemi will attain values : {0, 1}, so if we play scales of greater length where octave may need to increment/decrement multiple times:
            That is done with the use of deltaOctave: It's value is incremented by one everytime we traverse the modelength of our selected key once. [ e.g 7 in case of any major scale]
            deltaOctave doesn't directly affect the octave that will play; instead it changes what we say is the reference octave i.e the value connected to the octave argument of this block.

            You may see this as a cyclical process: 
            e.g Repeat the scale degree block 14 times while in G major starting from note value --> 1 and octave arg --> 4
            Till we reach B --> Both deltaOctave and deltaSemi are {0,0}
            As we cross B and reach C --> no. of semitones < ref, deltaSemi = 1, deltaOctave = 0 and this causes note C to play in octave 5
            This behavious continues till E, as we reach F# (or Gb) --> deltaOctave becomes 1 and deltaSemi goes back to zero since we've traversed
            our modeLength ( 7 ) once. 
            Again on C deltaSemi will be 1, deltaOctave was already 1 and thus a total change of 2 octaves --> C6. Thus, deltaOctave brings a change
            to the reference octave. 
            So this process can continue indefinitely producing our desired results.
            */
            let semitones = ref;

            if (neg) {  
                // if (scaleDegree > 1) {
                //     scaleDegree = modeLength - scaleDegree + 2;
                // }
                scaleDegree = modeLength - scaleDegree;
                note = scaleDegreeToPitch(
                    logo.keySignature[turtle],
                    scaleDegree
                );
                logo.currentNote = note;
                
                if(NOTESFLAT.indexOf(note) !== -1) {
                    semitones += (NOTESFLAT.indexOf(note) - ref);
                } else {
                    semitones += (NOTESSHARP.indexOf(note) - ref);
                }

                deltaSemi = semitones > ref ? 1 : 0;
                deltaOctave = Math.floor(
                    (arg0) / modeLength
                );
                octave =
                    Math.floor(
                        calcOctave(
                            logo.currentOctave[turtle],
                            arg1,
                            logo.lastNotePlayed[turtle],
                            logo.currentNote
                        )
                    ) - deltaOctave - deltaSemi;
            } else {
                note = scaleDegreeToPitch(
                    logo.keySignature[turtle],
                    scaleDegree
                );
                logo.currentNote = note;
                if(NOTESFLAT.indexOf(note) !== -1) {
                    semitones += (NOTESFLAT.indexOf(note) - ref);
                } else {
                    semitones += (NOTESSHARP.indexOf(note) - ref);
                }
                deltaSemi = semitones < ref? 1:0;
                deltaOctave = Math.floor((arg0) / modeLength);  
                octave =
                    Math.floor(
                        calcOctave(
                            logo.currentOctave[turtle],
                            arg1,
                            logo.lastNotePlayed[turtle],
                            logo.currentNote
                        )
                    ) + deltaOctave + deltaSemi;
            }
            console.debug("logo.currentNote = " + logo.currentNote);
            cents = 0;
        } else {
            cents = 0;
            note = arg0;
            octave;
            if (
                SOLFEGENAMES1.indexOf(arg0) !== -1
            ) {
                useSolfegeName = true;
            }

            logo.currentNote = note;
            if (
                calcOctave(
                    logo.currentOctave[turtle],
                    arg1,
                    logo.lastNotePlayed[turtle],
                    logo.currentNote
                ) < 0
            ) {
                console.debug("minimum allowable octave is 0");
                octave = 0;
            } else if (
                calcOctave(
                    logo.currentOctave[turtle],
                    arg1,
                    logo.lastNotePlayed[turtle],
                    logo.currentNote
                ) > 9
            ) {
                // Humans can only hear 10 octaves.
                console.debug("clipping octave at 9");
                octave = 9;
            } else {
                // Octave must be a whole number.
                octave = Math.floor(
                    calcOctave(
                        logo.currentOctave[turtle],
                        arg1,
                        logo.lastNotePlayed[turtle],
                        logo.currentNote
                    )
                );
            }
        }
    }

    let noteObj = logo._addScalarTransposition(
        turtle,
        note,
        octave,
        logo.scalarTransposition[turtle]
    );
    note = noteObj[0];
    logo.currentNote = note;
    octave = noteObj[1];

    if (logo.inNeighbor[turtle].length > 0) {
        noteObj = getNote(
            note,
            octave,
            logo.transposition[turtle],
            logo.keySignature[turtle],
            logo.moveable[turtle],
            null,
            logo.errorMsg,
            logo.synth.inTemperament
        );
        logo.neighborArgNote1[turtle].push(noteObj[0] + noteObj[1]);
        let noteObj2;
        if (
            logo.blocks.blockList[last(logo.inNeighbor[turtle])].name ===
            "neighbor2"
        ) {
            noteObj2 = logo._addScalarTransposition(
                turtle,
                note,
                octave,
                parseInt(logo.neighborStepPitch[turtle])
            );
            if (logo.transposition[turtle] !== 0) {
                noteObj2 = getNote(
                    noteObj2[0],
                    noteObj2[1],
                    logo.transposition[turtle],
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
            }
        } else {
            noteObj2 = getNote(
                note,
                octave,
                logo.transposition[turtle] +
                    parseInt(logo.neighborStepPitch[turtle]),
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg,
                logo.synth.inTemperament
            );
        }
        logo.neighborArgNote2[turtle].push(noteObj2[0] + noteObj2[1]);
    }

    let delta = 0;

    if (logo.justMeasuring[turtle].length > 0) {
        let transposition = 2 * delta;
        if (turtle in logo.transposition) {
            transposition += logo.transposition[turtle];
        }

        noteObj = getNote(
            note,
            octave,
            transposition,
            logo.keySignature[turtle],
            logo.moveable[turtle],
            null,
            logo.errorMsg,
            logo.synth.inTemperament
        );
        if (!logo.validNote) {
            logo.errorMsg(INVALIDPITCH, blk);
            logo.stopTurtle = true;
            return;
        }

        let n = logo.justMeasuring[turtle].length;
        let pitchNumber =
            pitchToNumber(noteObj[0], noteObj[1], logo.keySignature[turtle]) -
            logo.pitchNumberOffset[turtle];
        if (logo.firstPitch[turtle].length < n) {
            logo.firstPitch[turtle].push(pitchNumber);
        } else if (logo.lastPitch[turtle].length < n) {
            logo.lastPitch[turtle].push(pitchNumber);
        }
    } else if (logo.inPitchDrumMatrix) {
        if (note.toLowerCase() !== "rest") {
            logo.pitchDrumMatrix.addRowBlock(blk);
            if (logo.pitchBlocks.indexOf(blk) === -1) {
                logo.pitchBlocks.push(blk);
            }
        }

        if (!(logo.invertList[turtle].length === 0)) {
            delta += logo._calculateInvert(turtle, note, octave);
        }
        let duplicateFactor;
        if (logo.duplicateFactor[turtle].length > 0) {
            duplicateFactor = logo.duplicateFactor[turtle];
        } else {
            duplicateFactor = 1;
        }

        for (let i = 0; i < duplicateFactor; i++) {
            // Apply transpositions
            let transposition = 2 * delta;
            if (turtle in logo.transposition) {
                transposition += logo.transposition[turtle];
            }

            let nnote = getNote(
                note,
                octave,
                transposition,
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg,
                logo.synth.inTemperament
            );
            if (noteIsSolfege(note)) {
                nnote[0] = getSolfege(nnote[0]);
            }

            if (logo.drumStyle[turtle].length > 0) {
                logo.pitchDrumMatrix.drums.push(last(logo.drumStyle[turtle]));
            } else {
                logo.pitchDrumMatrix.rowLabels.push(nnote[0]);
                logo.pitchDrumMatrix.rowArgs.push(nnote[1]);
            }
        }
    } else if (logo.inMatrix) {
        if (note.toLowerCase() !== "rest") {
            logo.pitchTimeMatrix.addRowBlock(blk);
            if (logo.pitchBlocks.indexOf(blk) === -1) {
                logo.pitchBlocks.push(blk);
            }
        }

        if (!(logo.invertList[turtle].length === 0)) {
            delta += logo._calculateInvert(turtle, note, octave);
        }

        let duplicateFactor;
        if (logo.duplicateFactor[turtle].length > 0) {
            duplicateFactor = logo.duplicateFactor[turtle];
        } else {
            duplicateFactor = 1;
        }

        for (let i = 0; i < duplicateFactor; i++) {
            let transposition = 2 * delta;
            if (turtle in logo.transposition) {
                transposition += logo.transposition[turtle];
            }

            let noteObj = getNote(
                note,
                octave,
                transposition,
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg,
                logo.synth.inTemperament
            );
            logo.previousNotePlayed[turtle] = logo.lastNotePlayed[turtle];
            logo.lastNotePlayed[turtle] = [noteObj[0] + noteObj[1], 4];

            if (
                logo.keySignature[turtle][0] === "C" &&
                logo.keySignature[turtle][1].toLowerCase() === "major" &&
                noteIsSolfege(note)
            ) {
                noteObj[0] = getSolfege(noteObj[0]);
            }

            // If we are in a setdrum clamp, override the pitch.
            if (logo.drumStyle[turtle].length > 0) {
                logo.pitchTimeMatrix.rowLabels.push(
                    last(logo.drumStyle[turtle])
                );
                logo.pitchTimeMatrix.rowArgs.push(-1);
            } else {
                // Was the pitch arg a note name or solfege name?
                if (useSolfegeName && noteObj[0] in SOLFEGECONVERSIONTABLE) {
                    logo.pitchTimeMatrix.rowLabels.push(
                        SOLFEGECONVERSIONTABLE[noteObj[0]]
                    );
                } else {
                    logo.pitchTimeMatrix.rowLabels.push(noteObj[0]);
                }

                logo.pitchTimeMatrix.rowArgs.push(noteObj[1]);
            }
        }
    } else if (logo.inNoteBlock[turtle].length > 0) {
        function addPitch(note, octave, cents, direction) {
            let t = transposition + logo.register[turtle] * 12;
            let noteObj = getNote(
                note,
                octave,
                t,
                logo.keySignature[turtle],
                logo.moveable[turtle],
                direction,
                logo.errorMsg,
                logo.synth.inTemperament
            );
            if (!logo.validNote) {
                logo.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
            }

            if (logo.drumStyle[turtle].length > 0) {
                let drumname = last(logo.drumStyle[turtle]);
                logo.pitchDrumTable[turtle][noteObj[0] + noteObj[1]] = drumname;
            }

            logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(
                noteObj[0]
            );
            logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(
                noteObj[1]
            );
            logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(cents);
            if (cents !== 0) {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(
                    pitchToFrequency(
                        noteObj[0],
                        noteObj[1],
                        cents,
                        logo.keySignature[turtle]
                    )
                );
            } else {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(0);
            }

            return noteObj;
        }

        if (!(logo.invertList[turtle].length === 0)) {
            delta += logo._calculateInvert(turtle, note, octave);
        }

        let transposition = 2 * delta;
        if (turtle in logo.transposition) {
            transposition += logo.transposition[turtle];
        }

        let noteObj1 = addPitch(note, octave, cents);
        // Only apply the transposition to the base note of an interval
        transposition = 0;

        if (turtle in logo.intervals && logo.intervals[turtle].length > 0) {
            for (let i = 0; i < logo.intervals[turtle].length; i++) {
                let ii = getInterval(
                    logo.intervals[turtle][i],
                    logo.keySignature[turtle],
                    noteObj1[0]
                );
                let noteObj2 = getNote(
                    noteObj1[0],
                    noteObj1[1],
                    ii,
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
                addPitch(noteObj2[0], noteObj2[1], cents);
            }
        }

        if (
            turtle in logo.semitoneIntervals &&
            logo.semitoneIntervals[turtle].length > 0
        ) {
            for (let i = 0; i < logo.semitoneIntervals[turtle].length; i++) {
                let noteObj2 = getNote(
                    noteObj1[0],
                    noteObj1[1],
                    logo.semitoneIntervals[turtle][i][0],
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
                addPitch(
                    noteObj2[0],
                    noteObj2[1],
                    cents,
                    logo.semitoneIntervals[turtle][i][1]
                );
            }
        }

        if (logo.inNoteBlock[turtle].length > 0) {
            logo.noteBeatValues[turtle][last(logo.inNoteBlock[turtle])].push(
                logo.beatFactor[turtle]
            );
        }

        logo.pushedNote[turtle] = true;
    } else if (logo.drumStyle[turtle].length > 0) {
        let drumname = last(logo.drumStyle[turtle]);
        let transposition = 0;
        if (turtle in logo.transposition) {
            transposition += logo.transposition[turtle];
        }
        
        let noteObj1 = getNote(
            note,
            octave,
            transposition,
            logo.keySignature[turtle],
            logo.moveable[turtle],
            null,
            logo.errorMsg
        );
        logo.pitchDrumTable[turtle][noteObj1[0] + noteObj1[1]] = drumname;
    } else if (logo.inPitchStaircase) {
        let frequency = pitchToFrequency(
            arg0,
            calcOctave(
                logo.currentOctave[turtle],
                arg1,
                logo.lastNotePlayed[turtle],
                arg0
            ),
            0,
            logo.keySignature[turtle]
        );
        let noteObj1 = getNote(
            arg0,
            calcOctave(
                logo.currentOctave[turtle],
                arg1,
                logo.lastNotePlayed[turtle],
                arg0
            ),
            0,
            logo.keySignature[turtle],
            logo.moveable[turtle],
            null,
            logo.errorMsg
        );

        let flag = 0;

        for (let i = 0; i < logo.pitchStaircase.Stairs.length; i++) {
            if (logo.pitchStaircase.Stairs[i][2] < parseFloat(frequency)) {
                logo.pitchStaircase.Stairs.splice(i, 0, [
                    noteObj1[0],
                    noteObj1[1],
                    parseFloat(frequency),
                    1,
                    1
                ]);
                flag = 1;
                return;
            }

            if (logo.pitchStaircase.Stairs[i][2] === parseFloat(frequency)) {
                logo.pitchStaircase.Stairs.splice(i, 1, [
                    noteObj1[0],
                    noteObj1[1],
                    parseFloat(frequency),
                    1,
                    1
                ]);
                flag = 1;
                return;
            }
        }

        if (flag === 0) {
            logo.pitchStaircase.Stairs.push([
                noteObj1[0],
                noteObj1[1],
                parseFloat(frequency),
                1,
                1
            ]);
        }

        logo.pitchStaircase.stairPitchBlocks.push(blk);
    } else if (logo.inMusicKeyboard) {
        if (!(logo.invertList[turtle].length === 0)) {
            delta += logo._calculateInvert(turtle, note, octave);
        }

        // Apply transpositions
        let transposition = 2 * delta;
        if (turtle in logo.transposition) {
            transposition += logo.transposition[turtle];
        }

        let nnote = getNote(
            note,
            octave,
            transposition,
            logo.keySignature[turtle],
            logo.moveable[turtle],
            null,
            logo.errorMsg
        );
        if (noteIsSolfege(note)) {
            nnote[0] = getSolfege(nnote[0]);
        }

        if (logo.drumStyle[turtle].length === 0) {
            logo.musicKeyboard.instruments.push(
                last(logo.instrumentNames[turtle])
            );
            logo.musicKeyboard.noteNames.push(nnote[0]);
            logo.musicKeyboard.octaves.push(nnote[1]);
            logo.musicKeyboard.addRowBlock(blk);
            logo.lastNotePlayed[turtle] = [noteObj[0] + noteObj[1], 4];
        }
    } else {
        if (true) {
            // logo.blocks.blockList[blk].connections[0] == null && last(logo.blocks.blockList[blk].connections) == null) {
            // Play a stand-alone pitch block as a quarter note.
            logo.clearNoteParams(turtle, blk, []);
            if (logo.currentCalculatedOctave[turtle] === undefined) {
                logo.currentCalculatedOctave[turtle] = 4;
            }

            let noteObj;
            if (logo.blocks.blockList[blk].name === "nthmodalpitch" || logo.blocks.blockList[blk].name === "scaledegree") {
                noteObj = getNote(
                    logo.currentNote,
                    calcOctave(
                        logo.currentCalculatedOctave[turtle],
                        arg1,
                        logo.lastPitchPlayed[turtle],
                        logo.currentNote
                    ),
                    0,
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg
                );
            } else if (logo.blocks.blockList[blk].name === "pitchnumber") {
                //For pitch number, need to translate number value to pitch
                let getNumberToPitch = numberToPitch(
                    Math.floor(arg0) + logo.pitchNumberOffset[turtle],
                    logo.synth.inTemperament,
                    logo.synth.startingPitch,
                    logo.pitchNumberOffset[turtle]
                );
                noteObj = getNote(
                    getNumberToPitch[0],
                    calcOctave(
                        logo.currentCalculatedOctave[turtle],
                        getNumberToPitch[1],
                        logo.lastPitchPlayed[turtle],
                        getNumberToPitch[0]
                    ),
                    0,
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg
                );
            } else {
                noteObj = getNote(
                    arg0,
                    calcOctave(
                        logo.currentCalculatedOctave[turtle],
                        arg1,
                        logo.lastPitchPlayed[turtle],
                        arg0
                    ),
                    0,
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg
                );
            }

            if (!logo.validNote) {
                logo.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
            }

            logo.inNoteBlock[turtle].push(blk);
            logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(
                noteObj[0]
            );
            logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(
                noteObj[1]
            );
            logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(cents);
            if (cents !== 0) {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(
                    pitchToFrequency(
                        noteObj[0],
                        noteObj[1],
                        cents,
                        logo.keySignature[turtle]
                    )
                );
            } else {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(0);
            }

            let bpmFactor;
            if (logo.bpm[turtle].length > 0) {
                bpmFactor = TONEBPM / last(logo.bpm[turtle]);
            } else {
                bpmFactor = TONEBPM / logo._masterBPM;
            }

            let noteBeatValue = 4;
            let beatValue = bpmFactor / noteBeatValue;

            __callback = function() {
                let j = logo.inNoteBlock[turtle].indexOf(blk);
                logo.inNoteBlock[turtle].splice(j, 1);
            };

            NoteController._processNote(logo, noteBeatValue, blk, turtle, __callback);
        } else {
            logo.errorMsg(
                _("Pitch Block: Did you mean to use a Note block?"),
                blk
            );
        }
    }
}

function setupPitchBlocks() {
    class RestBlock extends ValueBlock {
        constructor() {
            super("rest");
            this.setPalette("pitch");
            this.hidden = this.deprecated = true;
        }
    }

    class SquareBlock extends FlowBlock {
        constructor() {
            super("square", _("square"));
            this.setPalette("pitch");
            this.formBlock({ args: 1, defaults: [440] });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "square", 0, 0, [4, 6, null]],
                [6, ["number", { value: 392 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            _playSynthBlock(args, logo, turtle, blk);
        }
    }

    class TriangleBlock extends FlowBlock {
        constructor() {
            super("triangle", _("triangle"));
            this.setPalette("pitch");
            this.formBlock({ args: 1, defaults: [440] });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "triangle", 0, 0, [4, 6, null]],
                [6, ["number", { value: 392 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            _playSynthBlock(args, logo, turtle, blk);
        }
    }

    class SineBlock extends FlowBlock {
        constructor() {
            super("sine", _("sine"));
            this.setPalette("pitch");
            this.formBlock({ args: 1, defaults: [440] });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "sine", 0, 0, [4, 6, null]],
                [6, ["number", { value: 392 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            _playSynthBlock(args, logo, turtle, blk);
        }
    }

    class SawtoothBlock extends FlowBlock {
        constructor() {
            super("sawtooth", _("sawtooth"));
            this.setPalette("pitch");
            this.formBlock({ args: 1, defaults: [440] });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "sawtooth", 0, 0, [4, 6, null]],
                [6, ["number", { value: 392 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            _playSynthBlock(args, logo, turtle, blk);
        }
    }

    class InvertModeBlock extends ValueBlock {
        constructor() {
            super("invertmode");
            this.setPalette("pitch");
            this.formBlock({ outType: "textout" });
            this.hidden = true;
        }
    }

    class TranspositionFactorBlock extends ValueBlock {
        constructor() {
            //.TRANS: musical transposition (adjustment of pitch up or down)
            super("transpositionfactor", _("transposition"));
            this.setPalette("pitch");
            this.hidden = true;
            this.parameter = true;
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "transposition"]);
            } else {
                return logo.transposition[turtle];
            }
        }
    }

    class ConsonantStepSizeDownBlock extends ValueBlock {
        constructor() {
            //.TRANS: step down one note in current musical scale
            super("consonantstepsizedown", _("scalar step down"));
            this.setPalette("pitch");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Scalar step down block returns the number of semi-tones down to the previous note in the current key and mode."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle) {
            if (logo.lastNotePlayed[turtle] !== null) {
                let len = logo.lastNotePlayed[turtle][0].length;
                return getStepSizeDown(
                    logo.keySignature[turtle],
                    logo.lastNotePlayed[turtle][0].slice(0, len - 1)
                );
            } else {
                return getStepSizeDown(logo.keySignature[turtle], "G");
            }
        }
    }

    class ConsonantStepSizeUpBlock extends ValueBlock {
        constructor() {
            //.TRANS: step up one note in current musical scale
            super("consonantstepsizeup", _("scalar step up"));
            this.setPalette("pitch");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Scalar step up block returns the number of semi-tones up to the next note in the current key and mode."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle) {
            if (logo.lastNotePlayed[turtle] !== null) {
                let len = logo.lastNotePlayed[turtle][0].length;
                return getStepSizeUp(
                    logo.keySignature[turtle],
                    logo.lastNotePlayed[turtle][0].slice(0, len - 1)
                );
            } else {
                return getStepSizeUp(logo.keySignature[turtle], "G");
            }
        }
    }

    class DeltaPitchBlock extends ValueBlock {
        constructor(name, displayName) {
            //.TRANS: the change measured in half-steps between the current pitch and the previous pitch
            super(name || "deltapitch", displayName || _("change in pitch"));
            this.setPalette("pitch");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Change in pitch block is the difference (in half steps) between the current pitch being played and the previous pitch played."
                ),
                "documentation",
                null,
                "deltapitchhelp"
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "mypitch"]);
            } else if (logo.previousNotePlayed[turtle] == null) {
                return 0;
            } else {
                let len = logo.previousNotePlayed[turtle][0].length;
                let pitch = logo.previousNotePlayed[turtle][0].slice(
                    0,
                    len - 1
                );
                let octave = parseInt(
                    logo.previousNotePlayed[turtle][0].slice(len - 1)
                );
                let obj = [pitch, octave];
                let previousValue = pitchToNumber(
                    obj[0],
                    obj[1],
                    logo.keySignature[turtle]
                );
                len = logo.lastNotePlayed[turtle][0].length;
                pitch = logo.lastNotePlayed[turtle][0].slice(0, len - 1);
                octave = parseInt(
                    logo.lastNotePlayed[turtle][0].slice(len - 1)
                );
                obj = [pitch, octave];
                let delta =
                    pitchToNumber(obj[0], obj[1], logo.keySignature[turtle]) -
                    previousValue;
                if (logo.blocks.blockList[blk].name === "deltapitch") {
                    // half-step difference
                    return delta;
                } else {
                    // convert to scalar steps
                    let scalarDelta = 0;
                    let i = 0;
                    if (delta > 0) {
                        while (delta > 0) {
                            i += 1;
                            let nhalf = getStepSizeUp(
                                logo.keySignature[turtle],
                                pitch,
                                0,
                                "equal"
                            );
                            delta -= nhalf;
                            scalarDelta += 1;
                            obj = getNote(
                                pitch,
                                octave,
                                nhalf,
                                logo.keySignature[turtle],
                                logo.moveable[turtle],
                                null,
                                logo.errorMsg,
                                logo.synth.inTemperament
                            );
                            pitch = obj[0];
                            octave = obj[1];
                            if (i > 100) {
                                return;
                            }
                        }

                        return scalarDelta;
                    } else {
                        while (delta < 0) {
                            i += 1;
                            let nhalf = getStepSizeDown(
                                logo.keySignature[turtle],
                                pitch,
                                0,
                                "equal"
                            );
                            delta -= nhalf;
                            scalarDelta -= 1;
                            obj = getNote(
                                pitch,
                                octave,
                                nhalf,
                                logo.keySignature[turtle],
                                logo.moveable[turtle],
                                null,
                                logo.errorMsg,
                                logo.synth.inTemperament
                            );
                            pitch = obj[0];
                            octave = obj[1];
                            if (i > 100) {
                                return;
                            }
                        }
                        return scalarDelta;
                    }
                }
            }
        }
    }

    class DeltaPitch2Block extends DeltaPitchBlock {
        constructor() {
            //.TRANS: the change measured in scale-steps between the current pitch and the previous pitch
            super("deltapitch2", _("scalar change in pitch"));
        }
    }

    class MyPitchBlock extends ValueBlock {
        constructor() {
            //.TRANS: convert current note to piano key (1-88)
            super("mypitch", _("pitch number"));
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Pitch number block is the value of the pitch of the note currently being played."
                ),
                "documentation",
                null,
                "everybeathelp"
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        setter(logo, value, turtle, blk) {
            logo.previousNotePlayed[turtle] = logo.lastNotePlayed[turtle];
            let obj = numberToPitch(Math.floor(value) + logo.pitchNumberOffset[turtle]);
            logo.lastNotePlayed[turtle] = [
                obj[0] + obj[1],
                logo.lastNotePlayed[turtle][1]
            ];
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "mypitch"]);
            } else {
                let value = null;
                let obj;
                if (logo.lastNotePlayed[turtle] !== null) {
                    if (typeof logo.lastNotePlayed[turtle][0] === "string") {
                        let len = logo.lastNotePlayed[turtle][0].length;
                        let pitch = logo.lastNotePlayed[turtle][0].slice(
                            0,
                            len - 1
                        );
                        let octave = parseInt(
                            logo.lastNotePlayed[turtle][0].slice(len - 1)
                        );
                        obj = [pitch, octave];
                    } else {
                        // Hertz?
                        obj = frequencyToPitch(
                            logo.lastNotePlayed[turtle][0]
                        );
                    }
                } else if (
                    logo.inNoteBlock[turtle] in logo.notePitches[turtle] &&
                    logo.notePitches[turtle][last(logo.inNoteBlock[turtle])]
                        .length > 0
                ) {
                    obj = getNote(
                        logo.notePitches[turtle][
                            last(logo.inNoteBlock[turtle])
                        ][0],
                        logo.noteOctaves[turtle][
                            last(logo.inNoteBlock[turtle])
                        ][0],
                        0,
                        logo.keySignature[turtle],
                        logo.moveable[turtle],
                        null,
                        logo.errorMsg
                    );
                } else {
                    if (logo.lastNotePlayed[turtle] !== null) {
                        console.debug("Cannot find a note ");
                        logo.errorMsg(INVALIDPITCH, blk);
                    }

                    obj = ["G", 4];
                }

                value =
                    pitchToNumber(obj[0], obj[1], logo.keySignature[turtle]) -
                    logo.pitchNumberOffset[turtle];
                return value;
            }
        }
    }

    class PitchInHertzBlock extends ValueBlock {
        constructor() {
            //.TRANS: the current pitch expressed in Hertz
            super("pitchinhertz", _("pitch in hertz"));
            this.setPalette("pitch");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Pitch in Hertz block is the value in Hertz of the pitch of the note currently being played."
                ),
                "documentation",
                ""
            ]);
            this.beginnerBlock(true);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "pitchinhertz"]);
            } else {
                if (logo.lastNotePlayed[turtle] !== null) {
                    return logo.synth._getFrequency(
                        logo.lastNotePlayed[turtle][0],
                        logo.synth.changeInTemperament
                    );
                }
            }
        }
    }

    class MIDIBlock extends FlowBlock {
        constructor() {
            //.TRANS: MIDI is a technical standard for electronic music
            super("midi", _("MIDI"));
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "setpitchnumberoffset", x, y, [null, 1, 2, null]],
                [1, ["notename", { value: "C" }], 0, 0, [0]],
                [2, ["number", { value: -1 }], 0, 0, [0]]
            ]);
        }
    }

    class SetPitchNumberOffsetBlock extends FlowBlock {
        constructor() {
            //.TRANS: set an offset associated with the numeric piano keyboard mapping
            super("setpitchnumberoffset", _("set pitch number offset"));
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Set pitch number offset block is used to set the offset for mapping pitch numbers to pitch and octave."
                ),
                "documentation",
                null,
                "pitchnumberhelp"
            ]);
            this.formBlock({
                args: 2,
                defaults: ["C", 4],
                argTypes: ["anyin", "anyin"],
                argLabels: [
                    //.TRANS: name2 is name as in name of pitch (JAPANESE ONLY)
                    this.lang === "ja" ? _("name2") : _("name"),
                    _("octave")
                ]
            });
            this.makeMacro((x, y) => [
                [0, "setpitchnumberoffset", x, y, [null, 1, 2]],
                [1, ["notename", { value: "C" }], 0, 0, [0]],
                [2, ["number", { value: 4}], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            let arg0, arg1;
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = "C";
            } else {
                arg0 = args[0];
            }

            if (args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg1 = 4;
            } else {
                arg1 = args[1];
            }

            let octave = Math.floor(
                calcOctave(
                    logo.currentOctave[turtle],
                    arg1,
                    logo.lastNotePlayed[turtle],
                    arg0
                )
            );
            logo.pitchNumberOffset[turtle] = pitchToNumber(
                arg0,
                octave,
                logo.keySignature[turtle]
            );
        }
    }

    class Number2PitchBlock extends LeftBlock {
        constructor(name, displayName) {
            //.TRANS: convert piano key number (1-88) to pitch
            super(name || "number2pitch", displayName || _("number to pitch"));
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Number to pitch block will convert a pitch number to a pich name."
                ),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 1,
                defaults: [55]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk = logo.blocks.blockList[blk].connections[1];
            let num = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            if (num != null && typeof num === "number") {
                let obj = numberToPitch(Math.floor(num) + logo.pitchNumberOffset[turtle]);
                if (logo.blocks.blockList[blk].name === "number2pitch") {
                    return obj[0];
                } else {
                    return obj[1];
                }
            } else {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
            }
        }
    }

    class Number2OctaveBlock extends Number2PitchBlock {
        constructor() {
            //.TRANS: convert piano key number (1-88) to octave
            super("number2octave", _("number to octave"));
            this.setHelpString([
                _(
                    "The Number to octave block will convert a pitch number to an octave."
                ),
                "documentation",
                ""
            ]);
        }
    }

    class AccidentalNameBlock extends ValueBlock {
        constructor() {
            super("accidentalname");
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Accidental selector block is used to choose between double-sharp, sharp, natural, flat, and double-flat."
                ),
                "documentation",
                ""
            ]);
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
        }
    }

    class EastIndianSolfegeBlock extends ValueBlock {
        constructor() {
            super("eastindiansolfege");
            this.setPalette("pitch");
            this.setHelpString([
                _("Pitch can be specified in terms of ni dha pa ma ga re sa."),
                "documentation",
                null,
                "eihelp"
            ]);
            this.formBlock({ outType: "solfegeout" });
        }
    }

    class NoteNameBlock extends ValueBlock {
        constructor() {
            super("notename");
            this.setPalette("pitch");
            this.setHelpString([
                _("Pitch can be specified in terms of C D E F G A B."),
                "documentation",
                null,
                "note2"
            ]);
            this.formBlock({ outType: "noteout" });
        }
    }

    class SolfegeBlock extends ValueBlock {
        constructor() {
            super("solfege");
            this.setPalette("pitch");
            this.setHelpString([
                _("Pitch can be specified in terms of do re mi fa sol la ti."),
                "documentation",
                null,
                "note1"
            ]);
            this.formBlock({ outType: "solfegeout" });
        }
    }

    class CustomNoteBlock extends ValueBlock {
        constructor() {
            super("customNote");
            this.setPalette("pitch");
            this.hidden = true;
        }
    }

    class Invert1Block extends FlowClampBlock {
        constructor() {
            super("invert1");
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Invert block rotates any contained notes around a target note."
                ),
                "documentation",
                null,
                "inverthelp"
            ]);
            this.formBlock({
                //.TRANS: pitch inversion rotates a pitch around another pitch
                name: _("invert"),
                args: 3,
                defaults: ["sol", 4, _("even")],
                argTypes: ["solfegein", "anyin", "anyin"],
                argLabels: [
                    this.lang === "ja" ? _("name2") : _("name"),
                    _("octave"),
                    //.TRANS: invert based on even or odd number or musical scale
                    _("even") + "/" + _("odd") + "/" + _("scalar")
                ]
            });
            this.makeMacro((x, y) => [
                [0, "invert1", x, y, [null, 1, 2, 3, null, 4]],
                [1, ["solfege", { value: "sol" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]],
                [3, ["invertmode", { value: "even" }], 0, 0, [0]],
                [4, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[3] === undefined) {
                // Nothing to do...
                return;
            }

            let arg0, arg1, arg2;
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = "sol";
            } else {
                arg0 = args[0];
            }

            if (args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg1 = 4;
            } else {
                arg1 = args[1];
            }

            if (args[2] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg2 = "even";
            } else {
                arg2 = args[2];
            }

            if (typeof arg2 === "number") {
                if (arg2 % 2 === 0) {
                    arg2 = "even";
                } else {
                    arg2 = "odd";
                }
            }

            if (arg2 === _("even")) {
                arg2 = "even";
            } else if (arg2 === _("odd")) {
                arg2 = "odd";
            } else if (arg2 === _("scalar")) {
                arg2 = "scalar";
            }

            if (arg2 === "even" || arg2 === "odd" || arg2 === "scalar") {
                let octave = calcOctave(
                    logo.currentOctave[turtle],
                    arg1,
                    logo.lastNotePlayed[turtle],
                    arg0
                );
                logo.invertList[turtle].push([arg0, octave, arg2]);
            }

            let listenerName = "_invert_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.invertList[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[3], 1];
        }
    }

    class Invert2Block extends FlowClampBlock {
        constructor(name, displayName) {
            //.TRANS: pitch inversion rotates a pitch around another pitch (odd number)
            super(name || "invert2", displayName || _("invert (odd)"));
            this.setPalette("pitch");
            this.formBlock({
                args: 2,
                defaults: ["sol", 4],
                argTypes: ["solfegein", "anyin"],
                argLabels: [_("note"), _("octave")]
            });
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            if (logo.blocks.blockList[blk].name === "invert") {
                logo.invertList[turtle].push([args[0], args[1], "even"]);
            } else {
                logo.invertList[turtle].push([args[0], args[1], "odd"]);
            }
            let listenerName = "_invert_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.invertList[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[2], 1];
        }
    }

    class InvertBlock extends Invert2Block {
        constructor() {
            //.TRANS: pitch inversion rotates a pitch around another pitch (even number)
            super("invert", _("invert (even)"));
            this.setPalette("pitch");
            this.formBlock({
                args: 2,
                defaults: ["sol", 4],
                argTypes: ["solfegein", "anyin"],
                argLabels: [_("note"), _("octave")]
            });
            this.makeMacro((x, y) => [
                [0, "invert", x, y, [null, 1, 2, null, 3]],
                [1, ["solfege", { value: "sol" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = true;
        }
    }

    class RegisterBlock extends FlowBlock {
        constructor() {
            //.TRANS: register is the octave of the current pitch
            super("register", _("register"));
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Register block provides an easy way to modify the register (octave) of the notes that follow it."
                ),
                "documentation",
                null,
                "registerhelp"
            ]);
            this.formBlock({
                args: 1,
                defaults: [0]
            });
        }

        flow(args, logo, turtle) {
            if (args[0] !== null && typeof args[0] === "number") {
                logo.register[turtle] = Math.floor(args[0]);
            }
        }
    }

    class SetTranspositionBlock extends FlowClampBlock {
        constructor() {
            super("settransposition");
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Semi-tone transposition block will shift the pitches contained inside Note blocks up (or down) by half steps."
                ) +
                    " " +
                    _("In the example shown above, sol is shifted up to sol#."),
                "documentation",
                ""
            ]);
            this.formBlock({
                //.TRANS: adjust the amount of shift (up or down) of a pitch
                name: _("semi-tone transpose"),
                args: 1,
                defaults: ["1"]
            });
            this.makeMacro((x, y) => [
                [0, "settransposition", x, y, [null, 1, 6, 7]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, ["number", { value: 12 }], 0, 0, [3]],
                [6, "vspace", 0, 0, [0, null]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            if (args[0] !== null && typeof args[0] === "number") {
                let transValue = args[0];
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] -= transValue;
                } else {
                    logo.transposition[turtle] += transValue;
                }

                logo.transpositionValues[turtle].push(transValue);

                let listenerName = "_transposition_" + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                let __listener = function(event) {
                    transValue = logo.transpositionValues[turtle].pop();
                    if (!(logo.invertList[turtle].length === 0)) {
                        logo.transposition[turtle] += transValue;
                    } else {
                        logo.transposition[turtle] -= transValue;
                    }
                };

                logo._setListener(turtle, listenerName, __listener);

                return [args[1], 1];
            }
        }
    }

    class OctaveBlock extends FlowBlock {
        constructor() {
            //.TRANS: adjusts the shift up or down by one octave (twelve half-steps in the interval between two notes, one having twice or half the frequency in Hz of the other.)
            super("octave", _("octave"));
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "settransposition", x, y, [null, 1, 4, 5]],
                [1, "multiply", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 12 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class CustomPitchBlock extends FlowBlock {
        constructor() {
            super("custompitch", _("custom pitch"));
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "pitch", x, y, [null, 1, 2, null]],
                [1, ["customNote", { value: "C(+0)" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]]
            ]);
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
            } else {
                note = args[0];
                octave = args[1];
            }
        }
    }

    class DownSixthBlock extends FlowBlock {
        constructor() {
            //.TRANS: down sixth means the note is five scale degrees below current note
            super("downsixth", _("down sixth"));
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "minus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: -5 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class DownThirdBlock extends FlowBlock {
        constructor() {
            //.TRANS: down third means the note is two scale degrees below current note
            super("downthird", _("down third"));
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "minus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: -2 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class SeventhBlock extends FlowBlock {
        constructor() {
            //.TRANS: seventh means the note is the six scale degrees above current note
            super("seventh", _("seventh"));
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 6 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class SixthBlock extends FlowBlock {
        constructor() {
            //.TRANS: sixth means the note is the five scale degrees above current note
            super("sixth", _("sixth"));
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 5 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class FifthBlock extends FlowBlock {
        constructor() {
            //.TRANS: fifth means the note is the four scale degrees above current note
            super("fifth", _("fifth"));
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 4 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class FourthBlock extends FlowBlock {
        constructor() {
            //.TRANS: fourth means the note is three scale degrees above current note
            super("fourth", _("fourth"));
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 7]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 3 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, null]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class ThirdBlock extends FlowBlock {
        constructor() {
            //.TRANS: third means the note is two scale degrees above current note
            super("third", _("third"));
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 2 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class SecondBlock extends FlowBlock {
        constructor() {
            //.TRANS: second means the note is one scale degree above current note
            super("second", _("second"));
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class UnisonBlock extends FlowBlock {
        constructor() {
            //.TRANS: unison means the note is the same as the current note
            super("unison", _("unison"));
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 0 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class SetScalarTranspositionBlock extends FlowClampBlock {
        constructor() {
            super("setscalartransposition");
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Scalar transposition block will shift the pitches contained inside Note blocks up (or down) the scale."
                ) +
                    " " +
                    _("In the example shown above, sol is shifted up to la."),
                "documentation",
                null,
                "scalartranshelp"
            ]);
            this.formBlock({
                //.TRANS: adjust the amount of shift (up or down) of a pitch by musical scale (scalar) steps
                name: _("scalar transpose") + " (+/–)",
                args: 1,
                defaults: ["1"]
            });
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
            // Note: Inverted to usual; only appears in beginner mode.
            if (!beginnerMode || !this.beginnerModeBlock) {
                this.hidden = true;
            }
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            let transValue;
            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                transValue = 0;
            } else {
                transValue = args[0];
            }

            if (!(logo.invertList[turtle].length === 0)) {
                logo.scalarTransposition[turtle] -= transValue;
            } else {
                logo.scalarTransposition[turtle] += transValue;
            }

            logo.scalarTranspositionValues[turtle].push(transValue);

            let listenerName = "_scalar_transposition_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                transValue = logo.scalarTranspositionValues[turtle].pop();
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.scalarTransposition[turtle] += transValue;
                } else {
                    logo.scalarTransposition[turtle] -= transValue;
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class AccidentalBlock extends FlowClampBlock {
        constructor() {
            super("accidental");
            this.setPalette("pitch");
            this.setHelpString([
                _("The Accidental block is used to create sharps and flats"),
                "documentation",
                null,
                "accidental"
            ]);
            this.formBlock({
                //.TRANS: An accidental is a modification to a pitch, e.g., sharp or flat.
                name: _("accidental"),
                args: 1
            });
            this.makeMacro((x, y) => [
                [0, "accidental", x, y, [null, 11, 1, 10]],
                [1, "newnote", x, y, [0, 2, 5, 9]],
                [2, "divide", 0, 0, [1, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [1, 6]],
                [6, "pitch", 0, 0, [5, 7, 8, null]],
                [7, ["solfege", { value: "sol" }], 0, 0, [6]],
                [8, ["number", { value: 4 }], 0, 0, [6]],
                [9, "hidden", 0, 0, [1, null]],
                [10, "hidden", 0, 0, [0, null]],
                [11, ["accidentalname", { value: "natural" + " ♮" }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            let arg, value;
            if (args[0] === null || typeof args[0] !== "string") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = "sharp";
            } else {
                arg = args[0];
            }

            let i = ACCIDENTALNAMES.indexOf(arg);
            if (i === -1) {
                switch (arg) {
                    case _("sharp"):
                        value = 1;
                        return;
                    case _("flat"):
                        value = -1;
                        return;
                    default:
                        value = 0;
                        return;
                }
            } else {
                value = ACCIDENTALVALUES[i];
            }

            if (!(logo.invertList[turtle].length === 0)) {
                logo.transposition[turtle] -= value;
            } else {
                logo.transposition[turtle] += value;
            }

            let listenerName = "_accidental_" + turtle + "_" + blk;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] += value;
                } else {
                    logo.transposition[turtle] -= value;
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class FlatBlock extends FlowClampBlock {
        constructor() {
            super("flat");
            this.setPalette("pitch");
            //.TRANS: flat is a half-step down in pitch
            this.formBlock({ name: _("flat") + " ♭" });
            this.makeMacro((x, y) => [
                [0, "accidental", x, y, [null, 11, 1, 10]],
                [1, "newnote", x, y, [0, 2, 5, 9]],
                [2, "divide", 0, 0, [1, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [1, 6]],
                [6, "pitch", 0, 0, [5, 7, 8, null]],
                [7, ["solfege", { value: "sol" }], 0, 0, [6]],
                [8, ["number", { value: 4 }], 0, 0, [6]],
                [9, "hidden", 0, 0, [1, null]],
                [10, "hidden", 0, 0, [0, null]],
                [11, ["accidentalname", { value: "flat" + " ♭" }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === undefined) {
                // Nothing to do.
                return;
            }

            if (!(logo.invertList[turtle].length === 0)) {
                logo.transposition[turtle] += 1;
            } else {
                logo.transposition[turtle] -= 1;
            }

            let listenerName = "_flat_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] -= 1;
                } else {
                    logo.transposition[turtle] += 1;
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class SharpBlock extends FlowClampBlock {
        constructor() {
            super("sharp");
            this.setPalette("pitch");
            //.TRANS: sharp is a half-step up in pitch
            this.formBlock({ name: _("sharp") + " ♯" });
            this.makeMacro((x, y) => [
                [0, "accidental", x, y, [null, 11, 1, 10]],
                [1, "newnote", x, y, [0, 2, 5, 9]],
                [2, "divide", 0, 0, [1, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [1, 6]],
                [6, "pitch", 0, 0, [5, 7, 8, null]],
                [7, ["solfege", { value: "sol" }], 0, 0, [6]],
                [8, ["number", { value: 4 }], 0, 0, [6]],
                [9, "hidden", 0, 0, [1, null]],
                [10, "hidden", 0, 0, [0, null]],
                [11, ["accidentalname", { value: "sharp" + " ♯" }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === undefined) {
                // Nothing to do.
                return;
            }

            if (!(logo.invertList[turtle].length === 0)) {
                logo.transposition[turtle] -= 1;
            } else {
                logo.transposition[turtle] += 1;
            }

            let listenerName = "_sharp_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] += 1;
                } else {
                    logo.transposition[turtle] -= 1;
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class HertzBlock extends FlowBlock {
        constructor() {
            //.TRANS: a measure of frequency: one cycle per second
            super("hertz", _("hertz"));
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Hertz block (in combination with a Number block) will play a sound at the specified frequency."
                ),
                "documentation",
                null,
                "note3"
            ]);
            this.formBlock({
                args: 1,
                defaults: [this.lang === "ja" ? 440 : 392]
            });
        }

        flow(args, logo, turtle, blk) {
            let arg;
            if (
                args[0] === null ||
                typeof args[0] !== "number" ||
                args[0] <= 0
            ) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 392;
            } else {
                arg = args[0];
            }

            let obj = frequencyToPitch(arg);
            let note = obj[0];
            let octave = obj[1];
            let cents = obj[2];
            let delta = 0;

            function addPitch(note, octave, cents, frequency, direction) {
                let t = transposition + logo.register[turtle] * 12;
                let noteObj = getNote(
                    note,
                    octave,
                    t,
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    direction,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
                if (logo.drumStyle[turtle].length > 0) {
                    let drumname = last(logo.drumStyle[turtle]);
                    logo.pitchDrumTable[turtle][
                        noteObj[0] + noteObj[1]
                    ] = drumname;
                }

                logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(
                    noteObj[0]
                );
                logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(
                    noteObj[1]
                );
                logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(
                    cents
                );
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(
                    frequency
                );
                return noteObj;
            }

            let transposition = 2 * delta;
            if (turtle in logo.transposition) {
                transposition += logo.transposition[turtle];
            }

            if (note === "?") {
                logo.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
            } else if (logo.justMeasuring[turtle].length > 0) {
                // TODO: account for cents
                let noteObj = getNote(
                    note,
                    octave,
                    0,
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg
                );

                let n = logo.justMeasuring[turtle].length;
                let pitchNumber =
                    pitchToNumber(
                        noteObj[0],
                        noteObj[1],
                        logo.keySignature[turtle]
                    ) - logo.pitchNumberOffset[turtle];
                if (logo.firstPitch[turtle].length < n) {
                    logo.firstPitch[turtle].push(pitchNumber);
                } else if (logo.lastPitch[turtle].length < n) {
                    logo.lastPitch[turtle].push(pitchNumber);
                }
            } else if (logo.inMatrix) {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.pitchTimeMatrix.rowLabels.push(
                    logo.blocks.blockList[blk].name
                );
                logo.pitchTimeMatrix.rowArgs.push(arg);
                // convert hertz to note/octave
                let note = frequencyToPitch(arg);
                logo.lastNotePlayed[turtle] = [note[0] + note[1], 4];
            } else if (logo.inMusicKeyboard) {
                logo.musicKeyboard.instruments.push(
                    last(logo.instrumentNames[turtle])
                );
                logo.musicKeyboard.noteNames.push("hertz");
                logo.musicKeyboard.octaves.push(arg);
                logo.musicKeyboard.addRowBlock(blk);
                // convert hertz to note/octave
                let note = frequencyToPitch(arg);
                logo.lastNotePlayed[turtle] = [note[0] + note[1], 4];
            } else if (logo.inNoteBlock[turtle].length > 0) {
                if (!(logo.invertList[turtle].length === 0)) {
                    delta += logo._calculateInvert(turtle, note, octave);
                }

                let noteObj1 = addPitch(note, octave, cents, arg);
                let noteObj2;

                if (
                    turtle in logo.intervals &&
                    logo.intervals[turtle].length > 0
                ) {
                    for (let i = 0; i < logo.intervals[turtle].length; i++) {
                        let ii = getInterval(
                            logo.intervals[turtle][i],
                            logo.keySignature[turtle],
                            noteObj1[0]
                        );
                        noteObj2 = getNote(
                            noteObj1[0],
                            noteObj1[1],
                            ii,
                            logo.keySignature[turtle],
                            logo.moveable[turtle],
                            null,
                            logo.errorMsg,
                            logo.synth.inTemperament
                        );
                        addPitch(noteObj2[0], noteObj2[1], cents, 0);
                    }
                }

                if (
                    turtle in logo.semitoneIntervals &&
                    logo.semitoneIntervals[turtle].length > 0
                ) {
                    for (
                        let i = 0;
                        i < logo.semitoneIntervals[turtle].length;
                        i++
                    ) {
                        noteObj2 = getNote(
                            noteObj1[0],
                            noteObj1[1],
                            logo.semitoneIntervals[turtle][i][0],
                            logo.keySignature[turtle],
                            logo.moveable[turtle],
                            null,
                            logo.errorMsg,
                            logo.synth.inTemperament
                        );
                        addPitch(
                            noteObj2[0],
                            noteObj2[1],
                            cents,
                            0,
                            logo.semitoneIntervals[turtle][i][1]
                        );
                    }
                }

                logo.noteBeatValues[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(logo.beatFactor[turtle]);
                logo.pushedNote[turtle] = true;
            } else if (logo.inPitchStaircase) {
                let frequency = arg;
                let note = frequencyToPitch(arg);
                let flag = 0;

                for (let i = 0; i < logo.pitchStaircase.Stairs.length; i++) {
                    if (
                        logo.pitchStaircase.Stairs[i][2] < parseFloat(frequency)
                    ) {
                        logo.pitchStaircase.Stairs.splice(i, 0, [
                            note[0],
                            note[1],
                            parseFloat(frequency)
                        ]);
                        flag = 1;
                        return;
                    }
                    if (
                        logo.pitchStaircase.Stairs[i][2] ===
                        parseFloat(frequency)
                    ) {
                        logo.pitchStaircase.Stairs.splice(i, 1, [
                            note[0],
                            note[1],
                            parseFloat(frequency)
                        ]);
                        flag = 1;
                        return;
                    }
                }

                if (flag === 0) {
                    logo.pitchStaircase.Stairs.push([
                        note[0],
                        note[1],
                        parseFloat(frequency)
                    ]);
                }

                logo.pitchStaircase.stairPitchBlocks.push(blk);
            } else if (logo.inPitchSlider) {
                logo.pitchSlider.Sliders.push([args[0], 0, 0]);
            } else {
                logo.errorMsg(
                    _("Hertz Block: Did you mean to use a Note block?"),
                    blk
                );
            }
        }
    }

    class PitchNumberBlock extends FlowBlock {
        constructor() {
            //.TRANS: a mapping of pitch to the 88 piano keys
            super("pitchnumber", _("pitch number"));
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Pitch Number block will play a pitch associated by its number eg 0 for C and 7 for G."
                ),
                "documentation",
                null,
                "note5"
            ]);
            this.formBlock({
                args: 1,
                defaults: [7]
            });
        }

        flow(args, logo, turtle, blk) {
            return _playPitch(args, logo, turtle, blk);
        }
    }

    // Used as a support for older projects. New implementation is NthModalPitch
    class ScaleDegreeBlock extends FlowBlock {
        constructor() {
            //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
            super("scaledegree", _("nth modal pitch"));
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "n^th Modal Pitch takes the pattern of pitches in semitones for a mode and makes each point a degree of the mode,"
                ) +
                    " " +
                    _(
                        "starting from 1 and regardless of tonal framework (i.e. not always 8 notes in the octave)"
                    ),
                "documentation",
                ""
            ]);
            // No need to show this in the palette
            this.hidden = true;
            this.formBlock({
                args: 2,
                defaults: [4, 4], // 4 is G in C Major
                argLabels: [_("number"), _("octave")],
                argTypes: ["numberin", "anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            args[0] -= 1;
            return _playPitch(args, logo, turtle, blk);
        }
    }

    class NthModalPitchBlock extends FlowBlock {
        constructor() {
            //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
            super("nthmodalpitch", _("nth modal pitch"));
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "n^th Modal Pitch takes the pattern of pitches in semitones for a mode and makes each point a degree of the mode,"
                ) +
                    " " +
                    _(
                        "starting from 1 and regardless of tonal framework (i.e. not always 8 notes in the octave)"
                    ),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 2,
                defaults: [4, 4], // 4 is G in C Major
                argLabels: [_("number"), _("octave")],
                argTypes: ["numberin", "anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            return _playPitch(args, logo, turtle, blk);
        }
    }

    class ScaleDegree2Block extends ValueBlock {
        constructor() {
            //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
            super("scaledegree2");
            this.setPalette("pitch");
            this.extraWidth = 10;
            this.formBlock({
                outType: "scaledegreeout"
            });
            this.makeMacro((x, y) => [
                [0, "pitch", x, y, [null, 1, 2, null]],
                [1, ["scaledegree2", { value: "5" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]]
            ]);
        }
        arg(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }
    }

    class StepPitchBlock extends FlowBlock {
        constructor() {
            //.TRANS: step some number of notes in current musical scale
            super("steppitch", _("scalar step") + " (+/–)");
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Scalar Step block (in combination with a Number block) will play the next pitch in a scale,"
                ) +
                    " " +
                    _(
                        "eg if the last note played was sol, Scalar Step 1 will play la."
                    ),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 1,
                defaults: [1],
                argTypes: ["anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            // Similar to pitch but calculated from previous note played.
            if (
                !logo.inMatrix &&
                !logo.inMusicKeyboard &&
                logo.inNoteBlock[turtle].length === 0
            ) {
                logo.errorMsg(
                    _(
                        "The Scalar Step Block must be used inside of a Note Block."
                    ),
                    blk
                );
                logo.stopTurtle = true;
                return;
            }

            if (typeof args[0] !== "number") {
                logo.errorMsg(NANERRORMSG, blk);
                logo.stopTurtle = true;
                return;
            }

            // If we are just counting notes we don't care about the pitch.
            if (
                logo.justCounting[turtle].length > 0 &&
                logo.lastNotePlayed[turtle] === null
            ) {
                console.debug("Just counting, so spoofing last note played.");
                logo.previousNotePlayed[turtle] = ["G4", 4];
                logo.lastNotePlayed[turtle] = ["G4", 4];
            }

            if (logo.lastNotePlayed[turtle] === null) {
                logo.errorMsg(
                    _(
                        "The Scalar Step Block must be preceded by a Pitch Block."
                    ),
                    blk
                );
                logo.lastNotePlayed[turtle] = ["G4", 4];
                // logo.stopTurtle = true;
                // return;
            }

            function addPitch(note, octave, cents, direction) {
                let t = transposition + logo.register[turtle] * 12;
                let noteObj = getNote(
                    note,
                    octave,
                    t,
                    logo.keySignature[turtle],
                    true,
                    direction,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );

                if (logo.drumStyle[turtle].length > 0) {
                    let drumname = last(logo.drumStyle[turtle]);
                    if (EFFECTSNAMES.indexOf(drumname) === -1) {
                        logo.pitchDrumTable[turtle][
                            noteObj[0] + noteObj[1]
                        ] = drumname;
                    } else {
                        logo.pitchDrumTable[turtle][
                            noteObj[0] + noteObj[1]
                        ] = effectsname;
                    }
                }

                if (!logo.inMatrix && !logo.inMusicKeyboard) {
                    logo.notePitches[turtle][
                        last(logo.inNoteBlock[turtle])
                    ].push(noteObj[0]);
                    logo.noteOctaves[turtle][
                        last(logo.inNoteBlock[turtle])
                    ].push(noteObj[1]);
                    logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(
                        cents
                    );
                    if (cents !== 0) {
                        logo.noteHertz[turtle][
                            last(logo.inNoteBlock[turtle])
                        ].push(
                            pitchToFrequency(
                                noteObj[0],
                                noteObj[1],
                                cents,
                                logo.keySignature[turtle]
                            )
                        );
                    } else {
                        logo.noteHertz[turtle][
                            last(logo.inNoteBlock[turtle])
                        ].push(0);
                    }
                }

                return noteObj;
            }

            let len = logo.lastNotePlayed[turtle][0].length;

            let noteObj = logo._addScalarTransposition(
                turtle,
                logo.lastNotePlayed[turtle][0].slice(0, len - 1),
                parseInt(logo.lastNotePlayed[turtle][0].slice(len - 1)),
                args[0]
            );

            let delta = 0;
            if (!(logo.invertList[turtle].length === 0)) {
                delta += logo._calculateInvert(turtle, noteObj[0], noteObj[1]);
            }

            let transposition = 2 * delta;
            if (turtle in logo.transposition) {
                transposition += logo.transposition[turtle];
            }

            let noteObj1 = addPitch(noteObj[0], noteObj[1], 0);
            // Only apply the transposition to the base note of an interval
            transposition = 0;

            if (logo.inMatrix) {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                if (logo.pitchTimeMatrix.rowLabels.length > 0) {
                    if (last(logo.pitchTimeMatrix.rowLabels) === "hertz") {
                        let freq = pitchToFrequency(
                            noteObj[0],
                            noteObj[1],
                            0,
                            logo.keySignature[turtle]
                        );
                        logo.pitchTimeMatrix.rowLabels.push("hertz");
                        logo.pitchTimeMatrix.rowArgs.push(parseInt(freq));
                    } else {
                        if (
                            SOLFEGENAMES1.indexOf(
                                last(logo.pitchTimeMatrix.rowLabels)
                            ) !== -1
                        ) {
                            logo.pitchTimeMatrix.rowLabels.push(
                                SOLFEGECONVERSIONTABLE[noteObj1[0]]
                            );
                        } else {
                            logo.pitchTimeMatrix.rowLabels.push(noteObj1[0]);
                        }

                        logo.pitchTimeMatrix.rowArgs.push(noteObj1[1]);
                    }
                } else {
                    logo.pitchTimeMatrix.rowLabels.push(noteObj1[0]);
                    logo.pitchTimeMatrix.rowArgs.push(noteObj1[1]);
                }

                logo.previousNotePlayed[turtle] = logo.lastNotePlayed[turtle];
                logo.lastNotePlayed[turtle] = [noteObj1[0] + noteObj1[1], 4];
            } else if (logo.inMusicKeyboard) {
                if (logo.drumStyle[turtle].length === 0) {
                    logo.musicKeyboard.instruments.push(
                        last(logo.instrumentNames[turtle])
                    );
                    if (logo.musicKeyboard.noteNames.length > 0) {
                        if (last(logo.musicKeyboard.noteNames) === "hertz") {
                            let freq = pitchToFrequency(
                                noteObj[0],
                                noteObj[1],
                                0,
                                logo.keySignature[turtle]
                            );
                            logo.musicKeyboard.noteNames.push("hertz");
                            logo.musicKeyboard.octaves.push(parseInt(freq));
                        } else {
                            if (
                                SOLFEGENAMES1.indexOf(
                                    last(logo.musicKeyboard.noteNames)
                                ) !== -1
                            ) {
                                logo.musicKeyboard.noteNames.push(
                                    SOLFEGECONVERSIONTABLE[noteObj1[0]]
                                );
                            } else {
                                logo.musicKeyboard.noteNames.push(noteObj1[0]);
                            }

                            logo.musicKeyboard.octaves.push(noteObj1[1]);
                        }
                    } else {
                        logo.musicKeyboard.noteNames.push(noteObj1[0]);
                        logo.musicKeyboard.octaves.push(noteObj1[1]);
                    }

                    logo.musicKeyboard.addRowBlock(blk);
                    logo.lastNotePlayed[turtle] = [
                        noteObj1[0] + noteObj1[1],
                        4
                    ];
                }
            }

            let noteObj2;
            if (turtle in logo.intervals && logo.intervals[turtle].length > 0) {
                for (let i = 0; i < logo.intervals[turtle].length; i++) {
                    let ii = getInterval(
                        logo.intervals[turtle][i],
                        logo.keySignature[turtle],
                        noteObj1[0]
                    );
                    noteObj2 = getNote(
                        noteObj1[0],
                        noteObj1[1],
                        ii,
                        logo.keySignature[turtle],
                        logo.moveable[turtle],
                        null,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                    addPitch(noteObj2[0], noteObj2[1], 0);
                }
            }

            if (
                turtle in logo.semitoneIntervals &&
                logo.semitoneIntervals[turtle].length > 0
            ) {
                for (
                    let i = 0;
                    i < logo.semitoneIntervals[turtle].length;
                    i++
                ) {
                    noteObj2 = getNote(
                        noteObj1[0],
                        noteObj1[1],
                        logo.semitoneIntervals[turtle][i][0],
                        logo.keySignature[turtle],
                        logo.moveable[turtle],
                        null,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                    addPitch(
                        noteObj2[0],
                        noteObj2[1],
                        0,
                        logo.semitoneIntervals[turtle][i][1]
                    );
                }
            }

            if (logo.inNoteBlock[turtle].length > 0) {
                logo.noteBeatValues[turtle][
                    last(logo.inNoteBlock[turtle])
                ].push(logo.beatFactor[turtle]);
            }

            logo.pushedNote[turtle] = true;
        }
    }

    class Pitch2Block extends FlowBlock {
        constructor() {
            super("pitch2", _("pitch") + " " + "G4");
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "pitch", x, y, [null, 1, 2, null]],
                [1, ["notename", { value: "G" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]]
            ]);
        }
    }

    class PitchBlock extends FlowBlock {
        constructor() {
            //.TRANS: we specify pitch in terms of a name and an octave. The name can be CDEFGAB or Do Re Mi Fa Sol La Ti. Octave is a number between 1 and 8.
            super("pitch", _("pitch"));
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Pitch block specifies the pitch name and octave of a note that together determine the frequency of the note."
                ),
                "documentation",
                null,
                "note1"
            ]);
            this.formBlock({
                args: 2,
                defaults: ["sol", 4],
                argTypes: ["solfegein", "anyin"],
                argLabels: [
                    this.lang === "ja" ? _("name2") : _("name"),
                    _("octave")
                ]
            });
        }

        flow(args, logo, turtle, blk) {
            return _playPitch(args, logo, turtle, blk);
        }
    }

    new ConsonantStepSizeDownBlock().setup();
    new ConsonantStepSizeUpBlock().setup();
    new RestBlock().setup();
    new SquareBlock().setup();
    new TriangleBlock().setup();
    new SineBlock().setup();
    new SawtoothBlock().setup();
    new InvertModeBlock().setup();
    new TranspositionFactorBlock().setup();
    new DeltaPitchBlock().setup();
    new DeltaPitch2Block().setup();
    new MyPitchBlock().setup();
    new PitchInHertzBlock().setup();
    new MIDIBlock().setup();
    new SetPitchNumberOffsetBlock().setup();
    new Number2PitchBlock().setup();
    new Number2OctaveBlock().setup();
    new AccidentalNameBlock().setup();
    new EastIndianSolfegeBlock().setup();
    new NoteNameBlock().setup();
    new SolfegeBlock().setup();
    new CustomNoteBlock().setup();
    new Invert1Block().setup();
    new Invert2Block().setup();
    new InvertBlock().setup();
    new RegisterBlock().setup();
    new SetTranspositionBlock().setup();
    new OctaveBlock().setup();
    new CustomPitchBlock().setup();
    new DownSixthBlock().setup();
    new DownThirdBlock().setup();
    new SeventhBlock().setup();
    new SixthBlock().setup();
    new FifthBlock().setup();
    new FourthBlock().setup();
    new ThirdBlock().setup();
    new SecondBlock().setup();
    new UnisonBlock().setup();
    new SetScalarTranspositionBlock().setup();
    new AccidentalBlock().setup();
    new FlatBlock().setup();
    new SharpBlock().setup();
    new HertzBlock().setup();
    new PitchNumberBlock().setup();
    new ScaleDegreeBlock().setup();
    new NthModalPitchBlock().setup();
    new ScaleDegree2Block().setup();
    new StepPitchBlock().setup();
    new Pitch2Block().setup();
    new PitchBlock().setup();
}
