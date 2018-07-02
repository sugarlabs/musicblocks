// Copyright (c) 2015 Jefferson Lee
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA


function MusicKeyboard() {

    var keyboard = document.getElementById("keyboard");
    var keyboardHolder = document.getElementById("keyboardHolder");
    var firstOctave = document.getElementById("firstOctave");
    var firstNote = document.getElementById("firstNote");
    var secondOctave = document.getElementById("secondOctave");
    var secondNote = document.getElementById("secondNote");
    var whiteKeys = document.getElementById("white");
    var blackKeys = document.getElementById("black");

    var whiteNoteEnums = ['C','D','E','F','G','A','B'];
    var blackNoteEnums = ['C♯', 'D♯', 'SKIP', 'F♯', 'G♯', 'A♯', 'SKIP'];

    var selected = [];

    //configure defaults
    changeKeys();

    function changeKeys() {
        whiteKeys.innerHTML = "";
        blackKeys.innerHTML = "";
        var note1 = firstNote.value;
        var note2 = secondNote.value;
        var oct1 = firstOctave.value;
        var oct2 = secondOctave.value;
        //sanity checks
        //missing values
        if(note1 == "" || note2 == "" || oct1 == "" || oct2 == "") {
            return;
        }
        //2nd octave < 1st octave
        if(oct2 < oct1) {
            var tmp = oct1;
            oct1 = oct2;
            oct2 = tmp;
        }
        //2nd key comes before 1st key on same octave
        if(oct1 == oct2 && whiteNoteEnums.indexOf(note1) > whiteNoteEnums.indexOf(note2)) {
            var tmp = note1;
            note1 = note2;
            note2 = tmp;
        }
        //reflect sanity changes
        firstNote.value = note1;
        secondNote.value = note2;
        firstOctave.value = oct1;
        secondOctave.value = oct2;
        
        //first key -> end of first octave
        for(var j = whiteNoteEnums.indexOf(note1); j < whiteNoteEnums.length; j++) {
            whiteKeys.innerHTML += "<td>"+whiteNoteEnums[j]+oct1+"</td>";
        }
        for(var j = whiteNoteEnums.indexOf(note1); j < blackNoteEnums.length; j++) {
            if(blackNoteEnums[j] != 'SKIP') {
                blackKeys.innerHTML += "<td>"+blackNoteEnums[j]+oct1+"</td>";
            }
            else {
                blackKeys.innerHTML += "<td style='visibility: hidden'></td>";
            }
        }
        //2nd octave -> second to last octave
        for(var i = parseInt(oct1)+1; i <= oct2-1; i++) {
            for(var j = 0; j < whiteNoteEnums.length; j++) {
                whiteKeys.innerHTML += "<td>"+whiteNoteEnums[j]+i+"</td>";
            }
            for(var j = 0; j < blackNoteEnums.length; j++) {
                if(blackNoteEnums[j] != 'SKIP') {
                    blackKeys.innerHTML += "<td>"+blackNoteEnums[j]+i+"</td>";
                }
                else {
                blackKeys.innerHTML += "<td style='visibility: hidden'></td>";
                }
            }
        }
        //last octave -> last key
        for(var j = 0; j < whiteNoteEnums.indexOf(note2)+1; j++) {
            whiteKeys.innerHTML += "<td>"+whiteNoteEnums[j]+oct2+"</td>";
        }
        for(var j = 0; j < whiteNoteEnums.indexOf(note2); j++) {
            if(blackNoteEnums[j] != 'SKIP') {
                blackKeys.innerHTML += "<td>"+blackNoteEnums[j]+oct2+"</td>";
            }
            else {
                blackKeys.innerHTML += "<td style='visibility: hidden'></td>";
            }
        }
        //assign the IDs (for clearing)
        for(var i = 0; i < whiteKeys.children.length; i++) {
            whiteKeys.children[i].id = whiteKeys.children[i].textContent;
        }
        for(var i = 0; i < blackKeys.children.length; i++) {
            blackKeys.children[i].id = blackKeys.children[i].textContent;
        }
        console.log(note1+oct1+"-"+note2+oct2);
    }

    keyboard.addEventListener("mousedown", function (e) {
        var target = e.target;
        if(target.tagName == "TD") {
            if((target.style.backgroundColor != "lightgrey") && (target.style.backgroundColor != "rgb(72,72,72)")) {
                selected.push(target.textContent);
                if(target.parentNode == whiteKeys) {
                    target.style.backgroundColor = "lightgrey";
                }
                else {
                    target.style.backgroundColor = "rgb(72,72,72)";
                }
            }
            handleKeyboard(target.textContent);
        }
    });

    keyboard.addEventListener("mouseup", function (f) {
        var target = f.target;
        if(target.tagName == "TD") {   
                if(target.parentNode == whiteKeys) {
                    target.style.backgroundColor = "white";
                }
                else {
                    target.style.backgroundColor = "black";
                }
        }
        
    });


    function deselect () {
        for(var i = 0; i < selected.length; i++) {
            var tmp = document.getElementById(selected[i]);
            if (tmp.parentElement == whiteKeys) {
                tmp.style.backgroundColor = "white";
            }
            else {
                tmp.style.backgroundColor = "black";
            }
        }
        selected = [];
    }

    var keyboardShown = true;

    function toggleKeyboard() {
        if(keyboardShown) {
            keyboardHolder.style.display = 'none';
        }
        else {
            keyboardHolder.style.display = 'inline';
        }
     
        keyboardShown = !keyboardShown;
    }
     
    function handleKeyboard (key) {
        //Tone can't do special sharps, need # isntead of ♯
        console.log('IIIInside handleKeyboard function... value of key ' +key);
        var noSharp = key;
        if(key[1] == "♯") {
            noSharp = key[0]+"#"+key[2];
        }


        synth.triggerAttackRelease(noSharp, "8n");
    }
     
    function handleKeyboardPitches (pitches) {
        console.log("generating keyboard pitches for: " + pitches);
        //copy and pasted from matrix.saveMatrix (), the original had too many array dimensions so the forloop has been removed
        var noteConversion = {'C': 'do', 'D': 're', 'E': 'mi', 'F': 'fa', 'G': 'sol', 'A': 'la', 'B': 'ti', 'R': 'rest'};
        var newStack = [[0, ["action", {"collapsed":false}], 100, 100, [null, 1, null, null]], [1, ["text", {"value":"chunk"}], 0, 0, [0]]];
        var endOfStackIdx = 0;
        for (var i = 0; i < pitches.length; i++) {
        // We want all of the notes in a column.
        // console.log(this.notesToPlay[i]);
            var note = pitches[i].slice(0);
     
        // Add the Note block and its value
            var idx = newStack.length;
            newStack.push([idx, 'note', 0, 0, [endOfStackIdx, idx + 1, idx + 2, null]]);
            var n = newStack[idx][4].length;
            if (i == 0) {  // the action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } 
            else { // the previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }
            var endOfStackIdx = idx;
            newStack.push([idx + 1, ['number', {'value': "4"}], 0, 0, [idx]]);
            // Add the pitch blocks to the Note block
            var  notePitch = note.substring(0,note.length-1);  //i.e. D or D# not D#1
            var thisBlock = idx + 2;
     
            // We need to point to the previous note or pitch block.
            var previousBlock = idx;  // Note block
      
      
            // The last connection in last pitch block is null.
            var lastConnection = null;

            newStack.push([thisBlock, 'pitch', 0, 0, [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]]);
            if(['♯', '♭'].indexOf(notePitch[1]) != -1) {
                newStack.push([thisBlock + 1, ['solfege', {'value': noteConversion[note[0]] + note[1]}], 0, 0, [thisBlock]]);
                newStack.push([thisBlock + 2, ['number', {'value': note[note.length-1]}], 0, 0, [thisBlock]]);
            } 
            else {
                newStack.push([thisBlock + 1, ['solfege', {'value': noteConversion[notePitch[0]]}], 0, 0, [thisBlock]]);
                newStack.push([thisBlock + 2, ['number', {'value': note[note.length-1]}], 0, 0, [thisBlock]]);
            }
        }
        console.log(newStack);
        blocks.logo.blocks.loadNewBlocks(newStack);
    }

       //not sure if there's a synth already in the program
       var synth = new Tone.Synth().toMaster();
}
     