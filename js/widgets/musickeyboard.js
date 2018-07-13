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
    const BUTTONDIVWIDTH = 295;  // 5 buttons
    const DRUMNAMEWIDTH = 50;
    const OUTERWINDOWWIDTH = 128;
    const INNERWINDOWWIDTH = 50;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    

    var keyboard = document.getElementById("keyboard");
    var keyboardHolder = document.getElementById("keyboardHolder");
    var firstOctave = document.getElementById("firstOctave");
    var firstNote = document.getElementById("firstNote");
    var secondOctave = document.getElementById("secondOctave");
    var secondNote = document.getElementById("secondNote");
    var whiteKeys = document.getElementById("white");
    var blackKeys = document.getElementById("black");

    var keyboard2 = document.getElementById("keyboard2");
    var keyboardHolder2 = document.getElementById("keyboardHolder2");
    var firstOctave2 = document.getElementById("firstOctave2");
    var firstNote2 = document.getElementById("firstNote2");
    var secondOctave2 = document.getElementById("secondOctave2");
    var secondNote2 = document.getElementById("secondNote2");
    var whiteKeys2 = document.getElementById("white2");
    var blackKeys2 = document.getElementById("black2");

    var whiteNoteEnums = ['C','D','E','F','G','A','B'];
    var blackNoteEnums = ['C♯', 'D♯', 'SKIP', 'F♯', 'G♯', 'A♯', 'SKIP'];

    var selected = [];

    this._rowBlocks1 = [];
    this.rowLabels1 = [];
    this.rowArgs1 = [];

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

    this.clearBlocks = function() {
        this._rowBlocks1 = [];
        this._colBlocks1 = [];
    };

    this.addRowBlock = function(pitchBlock) {
        this._rowBlocks1.push(pitchBlock);
    };

    this.init = function(logo) {
        // Initializes the pitch/drum matrix. First removes the
        // previous matrix and them make another one in DOM (document
        // object model)
        this._logo = logo; 
        console.log('rowLabels1 = ' +this.rowLabels1);
        console.log('rowArgs1 = ' +this.rowArgs1);
        if(this.rowLabels1.length == 0){
            document.getElementById("keyboardHolder").style.display = "block";
        } else {
            document.getElementById("keyboardHolder2").style.display = "block";
        }
        

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var mkbDiv = docById('mkbDiv');
        mkbDiv.style.visibility = 'visible';
        mkbDiv.setAttribute('draggable', 'true');
        mkbDiv.style.left = '200px';
        mkbDiv.style.top = '150px';

    


        // The mkb buttons
        var mkbButtonsDiv = docById('mkbButtonsDiv');
        mkbButtonsDiv.style.display = 'inline';
        mkbButtonsDiv.style.visibility = 'visible';
        mkbButtonsDiv.style.width = BUTTONDIVWIDTH;
        mkbButtonsDiv.innerHTML = '<table cellpadding="0px" id="mkbButtonTable"></table>';

        var buttonTable1 = docById('mkbButtonTable');           //doubt
        var header1 = buttonTable1.createTHead();
        var row1 = header1.insertRow(0);

        // For the button callbacks
        var that = this;

        var cell1 = this._addButton(row1, 'play-button.svg', ICONSIZE, _('play'));

        cell1.onclick=function() {
            that._logo.setTurtleDelay(0);
            that._playAll();
        }

        var cell1 = this._addButton(row1, 'export-chunk.svg', ICONSIZE, _('save'));

        cell1.onclick=function() {
            that._save();
        }

        var cell1 = this._addButton(row1, 'erase-button.svg', ICONSIZE, _('clear'));

        cell1.onclick=function() {
            that._clear();
        }

        var cell1 = this._addButton(row1,'close-button.svg', ICONSIZE, _('close'));

        cell1.onclick=function() {
            mkbDiv.style.visibility = 'hidden';
            mkbButtonsDiv.style.visibility = 'hidden';
            mkbTableDiv.style.visibility = 'hidden';
            document.getElementById("keyboardHolder").style.display = "none";
            document.getElementById("keyboardHolder2").style.display = "none";
        }


    };

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    function handleKeyboard (key) {
        //Tone can't do special sharps, need # instead of ♯
        console.log('Key pressed ' +key[0]+ ' ' +key[1]+ ' ' +key[2]);
        var noSharp = key;
        if(key[1] == "♯") {
            noSharp = key[0]+"#"+key[2];
        }
        console.log('noSharp after ' +noSharp[0]+ ' ' +noSharp[1]+ ' ' +noSharp[2]);
        
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
     