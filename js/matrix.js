// Copyright (c) 2015 Yash Khandelwal
// Copyright (c) 2015 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

//All about Matrix

/*
initMatrix() : Initializes the matrix. Makes the pitches according to
solfegeNotes (contains what is to be displayed in first row),
solfegeTranspositions (contains a transposition), and
solfegeOctaves (contains the octave for each pitch )

addNotes() : Makes the matrix according to each rhythm block.

addTuplet() : Called when tuplet block is attached to the matrix
clamp. Adds the rows and columns required for adding tuplet
functionality to matrix. "Code is little messy" *<==How so? How should
it be improved in the future?*

makeClickable() : Makes the matrix clickable.

setNotes() : Set notes in this.notesToPlay when user clicks onto any
clickable cell.

playMatrix() : Plays the matrix by calling playAll();

savematrix() : Saves the Matrix notes in an array. Part of that array
(between 2 'end') constitutes notes for any chunk.
*/

var MATRIXBUTTONCOLOR = '#c374e9';
var MATRIXLABELCOLOR = '#90c100';
var MATRIXNOTECELLCOLOR = '#b1db00';
var MATRIXTUPLETCELLCOLOR = '#57e751';
var MATRIXRHYTHMCELLCOLOR = '#c8c8c8';

function Matrix() {
    this.arr = [];
    this.secondsPerBeat = 1;
    this.notesToPlay = [];
    this.notesToPlayDirected = [];
    this.numberOfNotesToPlay = 0;
    this.chkArray = null;
    this.octave = 0;
    this.i = 0;
    this.matrixContainer = null;
    this.notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];

    this.transposition = null;
    this.synth = null;

    this.matrixHasTuplets = false;

    Tone.Transport.start();

    this.cellWidth = 0;
    this.solfegeNotes = [];
    this.solfegeTranspositions = [];
    this.solfegeOctaves = [];
    this.noteValue = 4;
    this.notesCounter = 0;
    this.playDirection = 1;

    this.initMatrix = function(logo, PolySynth) {
        // Initializes the matrix. First removes the previous matrix
        // and them make another one in DOM (document object model)
        this.logo = logo;
        this.synth = PolySynth;
        document.getElementById('matrix').style.display = 'inline';
        document.getElementById('matrix').style.visibility = 'visible';
        document.getElementById('matrix').style.border = 2;
        // FIXME: make this number based on canvas size.
        var w = window.innerWidth;
        this.cellScale = w / 1200;
        document.getElementById('matrix').style.width = Math.floor(w / 2) + "px";
        document.getElementById('matrix').style.overflowX = "auto";

        console.log('notes ' + this.solfegeNotes + ' octave ' + this.solfegeOctaves + ' transpositions ' + this.solfegeTranspositions);

        this.notesToPlay = [];
        this.notesToPlayDirected = [];
        this.matrixHasTuplets = false;

        // Used to remove the matrix table
        Element.prototype.remove = function() {
            this.parentElement.removeChild(this);
        }

        NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
            for (var i = 0, len = this.length; i < len; i++)
            {
                if (this[i] && this[i].parentElement) {
                    this[i].parentElement.removeChild(this[i]);
                }
            }
        }
        var table = document.getElementById('myTable');

        if (table != null) {
            table.remove();
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'myTable');

        x.style.textAlign = 'center';

        var matrixDiv = document.getElementById('matrix');
        matrixDiv.appendChild(x);

        var table = document.getElementById('myTable');
        var header = table.createTHead();
        var row = header.insertRow(0);
        var cell = row.insertCell(-1);
        cell.style.fontSize = this.cellScale * 100 + '%';
        cell.innerHTML = '<b>' + _('Solfa') + '</b>';
        cell.style.height = 40 * this.cellScale + 'px';
        cell.style.backgroundColor = MATRIXLABELCOLOR;

        var cell = row.insertCell(1);
        var iconSize = this.cellScale * 24;
        cell.innerHTML = '<img src="header-icons/play-button.svg" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '">';
        cell.style.height = 40 * this.cellScale + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            logo.playMatrix();
        }

        var cell = row.insertCell(2);
        cell.innerHTML = '<img src="header-icons/download.svg" alt="' + _('save') + '" height="' + iconSize + '" width="' + iconSize + '">';
        cell.style.height = 40 * this.cellScale + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            logo.saveMatrix();
        }

        var cell = row.insertCell(3);
        cell.innerHTML = '<img src="header-icons/erase-button.svg" alt="' + _('clear') + '" height="' + iconSize + '" width="' + iconSize + '">';
        cell.style.height = 40 * this.cellScale + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            logo.clearMatrix();
        }

        var cell = row.insertCell(4);
        cell.innerHTML = '<img src="header-icons/close-button.svg" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '">';
        cell.style.height = 40 * this.cellScale + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            document.getElementById('matrix').style.visibility = 'hidden';
            document.getElementById('matrix').style.border = 0;
        }

        for (var i = 0; i < this.solfegeNotes.length; i++) {
            var row = header.insertRow(i+1);
            var cell = row.insertCell(0);
            cell.style.backgroundColor = MATRIXLABELCOLOR;

            // process transpositions
            if (this.solfegeTranspositions[i] != 0) {
                // When we apply a transposition to solfege, convert
                // to note octave format and then convert back to
                // solfege.
                var noteObj = this.logo.getNote(this.solfegeNotes[i], this.solfegeOctaves[i], this.solfegeTranspositions[i], this.logo.keySignature[0]);
                var note = noteObj[0] + noteObj[1];
                this.note2Solfege(note, i);
            }
            cell.style.fontSize = this.cellScale * 100 + '%';
            cell.innerHTML = this.solfegeNotes[i] + this.solfegeOctaves[i].toString().sub();
            cell.style.height = 30 * this.cellScale + 'px';
        }

        var row = header.insertRow(this.solfegeNotes.length + 1);
        var cell = row.insertCell(0);
	cell.style.fontSize = this.cellScale * 50 + '%';
        cell.innerHTML = _('rhythmic note values');
        cell.style.height = 40 * this.cellScale + 'px';
        cell.style.backgroundColor = MATRIXLABELCOLOR;

        this.chkArray = new Array();
        this.chkArray.push(0);
    }

    this.note2Solfege = function(note, index) {
        var solfegeConversionTable = {'C': 'do', 'C♯': 'do♯', 'D': 're', 'D♯': 're♯', 'E': 'mi', 'F': 'fa', 'F♯': 'fa♯', 'G': 'sol', 'G♯': 'sol♯', 'A': 'la', 'A♯': 'la♯', 'B': 'ti', 'D♭': 're♭', 'E♭': 'mi♭', 'G♭': 'sol♭', 'A♭': 'la♭', 'B♭': 'ti♭'};
        if (['♭', '♯'].indexOf(note[1]) == -1) {
            var octave = note[1];
            var newNote = solfegeConversionTable[note[0]];
        } else {
            var octave = note[2];
            var newNote = solfegeConversionTable[note.substr(0,2)];
        }
        console.log(index + ': ' + newNote + '/' + octave);
        this.solfegeNotes[index] = newNote;
        this.solfegeOctaves[index] = octave;
        this.solfegeTranspositions[index] = 0;
    }

    this.addTuplet = function(param) {
        // The first two parameters are the interval for the tuplet,
        // e.g., 1/4; the rest of the parameters are the list of notes
        // to be added to the tuplet, e.g., 1/8, 1/8, 1/8.
        console.log('addTuplet ' + JSON.stringify(param));

        var table = document.getElementById('myTable');
        var tupletTimeFactor = param[0][0] / param[0][1];
        var numberOfNotes = param[1].length;
        var totalNoteInterval = 0;
        for (var i = 0; i < numberOfNotes; i++) {
            totalNoteInterval += 32 / param[1][i];
        }

        // Add the cells for each tuplet note
        if (this.matrixHasTuplets) {
            // Extra rows for tuplets have already been added.
            console.log('matrix already has ' + table.rows.length + ' rows');
            var rowCount = table.rows.length - 3;
        } else {
            var rowCount = table.rows.length - 1;
        }

        for (var i = 1; i < rowCount; i++) {
            row = table.rows[i];
            for (var j = 0; j < numberOfNotes; j++) {
                cell = row.insertCell(-1);
                cell.setAttribute('id', table.rows[i].cells.length - 1);
                cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            }
        }

        // Set the cells to "rest"
        for (var j = 0; j < numberOfNotes; j++) {
            this.chkArray.push(0);
            // The tuplet time factor * percentage of the tuplet that
            // is dedicated to this note
            this.notesToPlay.push([['R'], (totalNoteInterval * param[0][1]) / (32 / param[1][j])]);
        }

        if (this.matrixHasTuplets) {
            var row = table.rows[table.rows.length - 2];
        } else {
            var row = table.insertRow(table.rows.length - 1);
            var cell = row.insertCell(-1);
            cell.style.fontSize = this.cellScale * 50 + '%';
            cell.innerHTML = '<b>' + 'tuplet value' + '</b>';
            cell.style.backgroundColor = MATRIXLABELCOLOR;
        }

        var w = window.innerWidth;
        w = (2 * w) / 5;

        // The bottom row contains the rhythm note values
        cell = table.rows[table.rows.length - 1].insertCell(-1);
        cell.style.height = 30 * this.cellScale + 'px';

        var noteSymbol = {1: '𝅝', 2: '𝅗𝅥', 4: '𝅘𝅥', 8: '𝅘𝅥𝅮', 16: '𝅘𝅥𝅯', 32: '𝅘𝅥𝅰', '64': '𝅘𝅥𝅱', '128': '𝅘𝅥𝅲'};
        var noteValue = param[0][1] / param[0][0];
        var noteValueToDisplay = null;
        if (noteValue in noteSymbol) {
            noteValueToDisplay = '1/' + noteValue.toString() + ' ' + noteSymbol[noteValue];
        } else {
            noteValueToDisplay = '1/' + noteValue.toString();
        }

        // FIXME: DOES NOT WORK FOR DOUBLE DOT
         var dottedNoteSymbol = {1: '𝅝.', 2: '𝅗𝅥.', 4: '𝅘𝅥.', 8: '𝅘𝅥𝅮.', 16: '𝅘𝅥𝅯.', 32: '𝅘𝅥𝅰.', '64': '𝅘𝅥𝅱.', '128': '𝅘𝅥𝅲.'};
        if (parseInt(param[0][1]) < param[0][1]) {
            noteValueToDisplay = noteValue * 1.5;
            if (noteValueToDisplay in dottedNoteSymbol) {
                noteValueToDisplay = '1.5/' + noteValueToDisplay.toString() + ' ' + dottedNoteSymbol[noteValueToDisplay];
            } else {
                noteValueToDisplay = '1.5/' + noteValueToDisplay.toString() + ' (dot)';
            }
        }

        cell.style.fontSize = this.cellScale * 100 + '%';
        cell.innerHTML = noteValueToDisplay;
        // cell.innerHTML = param[0][0].toString() + '/' + param[0][1].toString();

        cell.width = this.cellScale * w * param[0][0] / param[0][1] + 'px';
        cell.colSpan = numberOfNotes;
        cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;

        var tupletCol = table.rows[table.rows.length - 1].cells.length - 2;
        for (var i = 0; i < table.rows[table.rows.length - 1].cells.length - 1; i++) {
            // Add an entry for the tuplet value in any rhythm
            // columns. If we already have tuplets, just add a cell to
            // the new tuplet column.
            if (!this.matrixHasTuplets || i == tupletCol) {
                cell = row.insertCell(i + 1);
                cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
                cell.style.height = 30 * this.cellScale + 'px';
                if (i == tupletCol) {
                    cell.style.fontSize = this.cellScale * 100 + '%';
                    cell.innerHTML = numberOfNotes.toString();
                    cell.colSpan = numberOfNotes;
                }
            }
        }

        if (this.matrixHasTuplets) {
            var row = table.rows[table.rows.length - 3];
        } else {
            // Add row for tuplet note values
            var row = table.insertRow(table.rows.length - 2);
            var cell = row.insertCell(-1);
            cell.style.fontSize = this.cellScale * 50 + '%';
            cell.innerHTML = '<b>' + _('tuplet note values') + '</b>';
            cell.style.backgroundColor = MATRIXLABELCOLOR;
        }

        if (this.matrixHasTuplets) {
            // Just add the new tuplet note values
            var tupletCol = 0;
            var cellCount = param[1].length;
            var firstCell = 0;
        } else {
            // Add cells across all of tuplet note values row.
            var tupletCol = table.rows[table.rows.length - 1].cells.length - 2;
            var cellCount = table.rows[table.rows.length - 4].cells.length - 1;
            var firstCell = 0;
        }

        for (var i = firstCell; i < cellCount; i++) {
            // Add cell for tuplet note values
            cell = row.insertCell(-1);
            cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
            cell.style.height = 30 * this.cellScale + 'px';
            // Add tuplet note values
            if (i >= tupletCol) {
                var j = i - tupletCol;
                console.log(i + ' ' + j + ' ' + param[1][j]);
                var numerator = 32 / param[1][j];
		cell.style.fontSize = this.cellScale * 100 + '%';
                cell.innerHTML = reducedFraction(numerator, totalNoteInterval / tupletTimeFactor);
            }
        }

        this.matrixHasTuplets = true;
    }

    this.addNotes = function(numBeats, noteValue) {
        console.log('addNotes ' + numBeats + ' ' + noteValue);
        var table = document.getElementById('myTable');

        var noteSymbol = {1: '𝅝', 2: '𝅗𝅥', 4: '𝅘𝅥', 8: '𝅘𝅥𝅮', 16: '𝅘𝅥𝅯', 32: '𝅘𝅥𝅰', '64': '𝅘𝅥𝅱', '128': '𝅘𝅥𝅲'};
        var noteValueToDisplay = null;
        if (noteValue in noteSymbol) {
            noteValueToDisplay = '1/' + noteValue.toString() + ' ' + noteSymbol[noteValue];
        } else {
            noteValueToDisplay = '1/' + noteValue.toString();
        }

        // FIXME: DOES NOT WORK FOR DOUBLE DOT
         var dottedNoteSymbol = {1: '𝅝.', 2: '𝅗𝅥.', 4: '𝅘𝅥.', 8: '𝅘𝅥𝅮.', 16: '𝅘𝅥𝅯.', 32: '𝅘𝅥𝅰.', '64': '𝅘𝅥𝅱.', '128': '𝅘𝅥𝅲.'};
        if (parseInt(noteValue) < noteValue) {
            noteValueToDisplay = parseInt((noteValue * 1.5))
            if (noteValueToDisplay in dottedNoteSymbol) {
                noteValueToDisplay = '1.5/' + noteValueToDisplay.toString() + ' ' + dottedNoteSymbol[noteValueToDisplay];
            } else {
                noteValueToDisplay = '1.5/' + noteValueToDisplay.toString() + ' (dot)';
            }
        }

        if (this.noteValue > noteValue) {
            this.noteValue = noteValue;
        }

        for (var i = 0; i < numBeats; i++) {
            this.notesToPlay.push([['R'], noteValue]);
        }

        for (var i = 1; i <= numBeats; i++) {
             this.chkArray.push(0);
        }

        if (this.matrixHasTuplets) {
            var rowCount = this.solfegeNotes.length + 3;
        } else {
            var rowCount = this.solfegeNotes.length + 1
        }

        for (var j = 0; j < numBeats; j++) {
            for (var i = 1; i <= rowCount; i++) {
                var row = table.rows[i];
                var cell = row.insertCell(-1);

                if (i == rowCount) {
		    cell.style.fontSize = this.cellScale * 100 + '%';
                    cell.innerHTML = noteValueToDisplay;
                    cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
                } else if (this.matrixHasTuplets && i > this.solfegeNotes.length) {
                    // We may need to insert some blank cells in the extra rows
                    // added by tuplets.
                    cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
                } else {
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                }

                cell.setAttribute('id', table.rows[1].cells.length - 1);
            }
        }

        var w = window.innerWidth;
        w = (2 * w) / 5;
        this.cellWidth = w / 4;
        for (var i = table.rows[1].cells.length - numBeats; i < table.rows[1].cells.length; i++) {
            table.rows[1].cells[i].width = this.cellScale * w / noteValue + 'px';
        }
    }

    this.makeClickable = function(tuplet, synth) {
        /* Once the entire matrix is generated, this function makes it
         * clickable. */
        var table = document.getElementById('myTable');
        if (this.matrixHasTuplets) {
            var leaveRowsFromBottom = 3;
        } else {
            var leaveRowsFromBottom = 1;
        }
        for (var i = 1; i < table.rows[1].cells.length; i++) {
            for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++) {
                cell = table.rows[j].cells[i];
                if (cell.style.backgroundColor == 'black') {
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    cell.style.backgroundColor = 'black';
                    this.setNotes(i, cell.parentNode.rowIndex, false);
                }
            }
        }
        if (table != null) {
            for (var i = 1; i < table.rows[1].cells.length; i++) {
                for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++) {
                    var cell = table.rows[j].cells[i];
                    var that = this;
                    cell.onclick = function() {
                        if (this.style.backgroundColor == 'black') {
                            this.style.backgroundColor = MATRIXNOTECELLCOLOR;
                            that.chkArray[this.id] = 0;
                            that.notesToPlay[this.id - 1][0] = ['R'];
                            that.setNotes(this.id, this.parentNode.rowIndex, false, tuplet, synth);
                        } else {
                            this.style.backgroundColor = 'black';
                            that.chkArray[this.id] = 1;
                            that.setNotes(this.id, this.parentNode.rowIndex, true, tuplet, synth);
                        }
                    }
                }
            }
        }
    }

    this.setTransposition = function(transposition) {
        console.log('MATRIX:setTransposition');
        this.transposition = transposition;
    }

    this.removeTransposition = function(transposition) {
        console.log('MATRIX:removeTransposition');
        this.transposition = null;
    }

    // DEPRECATED (now handled in getNote)
    this.doTransposition = function(note, octave) {
        /* first setTransposition in called in logo.js and
         * this.transposition shows no. of semitones to be shifted
         * up/down */
        console.log('MATRIX:doTransposition: ' + this.transposition);
        if (this.transposition) {
            var deltaOctave = 0;
            if (this.transposition[0] == '-') {
                var factor = this.transposition;
                factor = factor.slice(0,0) + factor.slice(1,factor.length);
                factor = parseInt(factor);
                var index = this.notes.indexOf(note);
                if (index == 0) {
                    index = this.notes.length - factor % this.notes.length;
                    deltaOctave = -1
                } else {
                    index = index - ( factor % this.notes.length );
                    if(index < 0) {
                        index = this.notes.length + index;
                        deltaOctave = -1;
                    }
                }
                return this.notes[index] + (parseInt(octave) + parseInt(deltaOctave));
            } else if (this.transposition[0] == '+') {
                var factor = this.transposition;
                factor = factor.slice(0,0) + factor.slice(1,factor.length);
                factor = parseInt(factor);
                var index = this.notes.indexOf(note);
                if (index == this.notes.length - 1) {
                    index = factor % this.notes.length - 1;
                    deltaOctave = 1;
                } else {
                    index += factor % this.notes.length;
                }
                if (index >= this.notes.length) {
                    index = index % this.notes.length;
                    deltaOctave = 1;
                }
                var x = this.notes[index] + (parseInt(octave) + parseInt(deltaOctave));
                return this.notes[index] + (parseInt(octave) + parseInt(deltaOctave));
            }
        }
        return note;
    }

    this.playAll = function(synth) {
        var notes = [];
        for (i in this.notesToPlay) {
            notes.push(this.notesToPlay[i]);
        }
        if (this.playDirection > 0) {
            this.notesToPlayDirected = notes;
        } else {
            this.notesToPlayDirected = notes.reverse();
        }
        this.playDirection = 1;
        this.notesCounter = 0;
        var that = this;
        var time = 0;
        var table = document.getElementById('myTable');
        var note = this.notesToPlayDirected[this.notesCounter][0];
        var noteValue = that.notesToPlayDirected[this.notesCounter][1];
        this.notesCounter += 1;
        // Note can be a chord, hence it is an array.
        for (var i = 0; i < note.length; i++) {
            note[i] = note[i].replace(/♭/g, 'b').replace(/♯/g, '#');
        }

        if (note[0] != 'R') {
            synth.triggerAttackRelease(note, this.logo.bpmFactor / noteValue);
        }

        for (var i = 1; i < this.notesToPlayDirected.length; i++) {
            noteValue = this.notesToPlayDirected[i - 1][1];
            time += 1 / noteValue;
            var that = this;

            setTimeout(function() {
                if(that.notesCounter >= that.notesToPlayDirected.length) {
                    that.notesCounter = 1;
                    Tone.Transport.stop();
                }
                note = that.notesToPlayDirected[that.notesCounter][0];
                noteValue = that.notesToPlayDirected[that.notesCounter][1];
                that.notesCounter += 1;
                // Note can be a chord, hence it is an array.
                for (var i = 0; i < note.length; i++) {
                    note[i] = note[i].replace(/♭/g, 'b').replace(/♯/g, '#');
                }
                if(note != 'R') {
                    synth.triggerAttackRelease(note, that.logo.bpmFactor / noteValue);
                }
            }, that.logo.bpmFactor * 1000 * time);
        }
    }

    this.setNotes = function(colIndex, rowIndex, playNote, tuplet, synth) {
        /* Sets corresponding note when user clicks on any cell and
         * plays that note*/
        var leaveRowsFromBottom = 1;
        if(tuplet) {
            leaveRowsFromBottom = 3;
        }
        var table = document.getElementById('myTable');
        var transformed = false;
        this.notesToPlay[colIndex - 1][0] = [];
        if (table != null) {
            for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++) {
                cell = table.rows[j].cells[colIndex];
                if (cell.style.backgroundColor == 'black') {
                    var solfegeHTML = table.rows[j].cells[0].innerHTML;
                    // Both solfege and octave are extracted from HTML by getNote.
                    var noteObj = this.logo.getNote(solfegeHTML, -1, 0, this.logo.keySignature[0]);
                    var note = noteObj[0] + noteObj[1];
                    var noteValue = table.rows[table.rows.length - 1].cells[1].innerHTML;
                    // Remove ' 𝅘𝅥' at the end of the HTML code for the
                    // note value.
                    var len = noteValue.length;
                    // if (len > 2 && noteValue.charAt(len - 3) == ' ') {
                    if (noteValue.indexOf(' ') != -1) {
                        noteValue = noteValue.slice(0, noteValue.length - 2);
                    }
                    var i = 0;
                    if (noteValue.substr(0,3) == '1.5') {
                        while (noteValue[i] != ' ') {
                            i += 1;
                        }
                        noteValue = noteValue.substr(4, i - 4);
                        noteValue = parseInt(noteValue)
                        noteValue = 1.5/noteValue;
                        noteValue = noteValue.toString()
                    }
                    this.notesToPlay[parseInt(colIndex) - 1][0].push(note);

                    if (playNote) {
                        synth.triggerAttackRelease(note.replace(/♭/g, 'b').replace(/♯/g, '#'), noteValue);
                    }
                }
            }
        }
    }

    this.playNotesString = function(time, synth) {
        /*plays the matrix and also the chunks*/
        if (this.transposition != null ) {
            var transposedArray = [];
            for (var i = 0; i < this.notesToPlay.length; i++) {
                var transposedNote = this.doTransposition(this.notesToPlay[i][0], this.octave);
                transposedArray.push(transposedNote);
            }
            console.log('original notes ' + this.notesToPlay);
            this.notesToPlay = transposedArray;
            console.log('transposed notes to be played ' + this.notesToPlay);
        } else {
            console.log('notes to be played ' + JSON.stringify(this.notesToPlay));
        }

        this.i = 0;

        var that = this;
        setTimeout(function() {
            console.log('playing after ' + time + 'ms');
            that.playAll(synth);
        }, time);
    }

    this.clearMatrix = function(synth) {
        // "Unclick" every entry in the matrix.
        var table = document.getElementById('myTable');

        if (this.matrixHasTuplets) {
            var leaveRowsFromBottom = 3;
        } else {
            var leaveRowsFromBottom = 1;
        }

        if (table != null) {
            for (var i = 1; i < table.rows[1].cells.length; i++) {
                for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++) {
                    var cell = table.rows[j].cells[i];
                    if (cell.style.backgroundColor == 'black') {
                        cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                        this.chkArray[cell.id] = 0;
                        this.notesToPlay[cell.id - 1][0] = ['R'];
                        this.setNotes(cell.id, cell.parentNode.rowIndex, false, this.matrixHasTuplets, synth);
                    }
                }
            }
        }
    }

    this.saveMatrix = function() {
        /* Saves the current matrix as an action stack consisting of
         * note and pitch blocks (saving as chunks is deprecated). */
        var noteConversion = {'C': 'do', 'D': 're', 'E': 'mi', 'F': 'fa', 'G': 'sol', 'A': 'la', 'B': 'ti', 'R': 'rest'};
        var newStack = [[0, ["action", {"collapsed":false}], 100, 100, [null, 1, null, null]], [1, ["text", {"value":"chunk"}], 0, 0, [0]]];
        var endOfStackIdx = 0;
        console.log('SAVE MATRIX!!!');
        for (var i = 0; i < this.notesToPlay.length; i++)
        {
            // We want all of the notes in a column.
            // console.log(this.notesToPlay[i]);
            var note = this.notesToPlay[i].slice(0);
            if (note[0] == '') {
                note[0] = 'R';
            }

            // Add the Note block and its value
            var idx = newStack.length;
            newStack.push([idx, 'note', 0, 0, [endOfStackIdx, idx + 1, idx + 2, null]]);
            var n = newStack[idx][4].length;
            if (i == 0) {  // the action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } else { // the previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }
            var endOfStackIdx = idx;
            newStack.push([idx + 1, ['number', {'value': note[1]}], 0, 0, [idx]]);
            // Add the pitch blocks to the Note block
            for (var j = 0; j < note[0].length; j++) {

                var thisBlock = idx + 2 + (j * 3);

                // We need to point to the previous note or pitch block.
                if (j == 0) {
                    var previousBlock = idx;  // Note block
                } else {
                    var previousBlock = thisBlock - 3;  // Pitch block
                }

                // The last connection in last pitch block is null.
                if (note[0].length == 1 || j == note[0].length - 1) {
                    var lastConnection = null;
                } else {
                    var lastConnection = thisBlock + 3;
                }

                newStack.push([thisBlock, 'pitch', 0, 0, [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]]);
                if(['♯', '♭'].indexOf(note[0][j][1]) != -1) {
                    newStack.push([thisBlock + 1, ['solfege', {'value': noteConversion[note[0][j][0]] + note[0][j][1]}], 0, 0, [thisBlock]]);
                    newStack.push([thisBlock + 2, ['number', {'value': note[0][j][2]}], 0, 0, [thisBlock]]);
                } else {
                    if (note[0][0] == 'R') {
                        newStack.push([thisBlock + 1, ['text', {'value': noteConversion[note[0][j][0]]}], 0, 0, [thisBlock]]);
                        newStack.push([thisBlock + 2, ['number', {'value': 4}], 0, 0, [thisBlock]]);
                    } else {
                        newStack.push([thisBlock + 1, ['solfege', {'value': noteConversion[note[0][j][0]]}], 0, 0, [thisBlock]]);
                        newStack.push([thisBlock + 2, ['number', {'value': note[0][j][1]}], 0, 0, [thisBlock]]);
                    }
                }
            }
        }

        // Create a new stack for the chunk.
        console.log(newStack);
        this.logo.blocks.loadNewBlocks(newStack);
    }
}

function reducedFraction(a, b) {
    greatestCommonMultiple = function(a, b) {
        return b == 0 ? a : greatestCommonMultiple(b, a % b);
    }

    var gcm = greatestCommonMultiple(a, b);
    return (a / gcm) + '/' + (b / gcm);
}
