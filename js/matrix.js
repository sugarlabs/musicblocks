// Copyright (c) 2015 Yash Khandelwal
// Copyright (c) 2015 Walter Bender
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// (at your option) any later version.
//
// You should have received a copy of the GNU General Public License
// along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

//All about Matrix

/*clearTurtles() : There is a corresponding turtle for each note in
 * matrix. Whenever matrix is initialized, the turtles are to be
 * cleared first. *<==Can someone please explain why this is like
 * this??? Thanks! -DU*

initMatrix() : Initializes the matrix. Makes the pitches according to
solfegeNotes(Contains what is to be displayed in first row) and
solfegeOct(contains Octave for each pitch )

makeMatrix() : Makes the matrix according to each rhythm block.

makeClickable() : Makes the matrix clickable.

setNotes() : Set notes in this.notesToPlay when user clicks onto any
clickable cell.

playMatrix() : Plays the matrix as well as chunks by calling playAll();

handleTuplet() : is called when tuplet block is attached to the matrix
clamp. Adds the rows and columns required for adding tuplet
functionality to matrix. "Code is little messy" *<==How so? How should
it be improved in the future?*

savematrix() : Saves the Matrix notes in an array. Part of that array
(between 2 'end') constitutes notes for any chunk.
*/

function Matrix(turtles, musicnotation)
{
    this.arr = [];
    this.secondsPerBeat = 1;
    this.notesToPlay = [];
    this.notesToPlayDirected = [];
    this.numberOfNotesToPlay = 0;
    this.chkArray = null;
    this.octave = 0;
    this.i = 0;
    this.matrixContainer = null;
    this.notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']; // Is there a way to have the input be either sharps or flats? What about "this.notes = ["C", "C#" "Db" , "D", "D#" "Eb", "E", "F", "F#" "Gb", "G", "G#" "Ab", "A", "A#" "Bb", "B"];" <== Basically some of notes are equivalent C#=Db <==Any answer to this question? 2015-08-24
    this.colorCode = ['#F2F5A9' ,'#F3F781', '#F4FA58', '#F7FE2E', '#FFFF00', '#D7DF01', '#AEB404'];
    this.transposition = null;
    this.isMatrix = 0;
    this.freetime = 1000;
    this.synth = null;

    Tone.Transport.start();

    this.cellWidth = 0;
    this.solfegeNotes = [];
    this.solfegeOct = [];
    this.noteValue = 4;
    this.notesCounter = 0;
    this.playDirection = 1;

    this.notationIndex = 0;    

    this.clearTurtles = function()
    {
        for (var i = 0; i < turtles.turtleList.length; i++)
        {
            if (turtles.turtleList[i].name.includes('note'))
            {
                turtles.turtleList[i].trash = true;
                turtles.turtleList[i].container.visible = false;    
                turtles.turtleList.splice(i, 1);
                i -=1 ;
            }
        }
        this.i = 0;
    }
    
    this.initMatrix = function(logo, PolySynth)
    {
        /*Initializes the matrix. First removes the previous matrix
	 * and them make another one in DOM*/ //<==What is DOM? -DU
        
        this.logo = logo;
        this.synth = PolySynth;
        document.getElementById('matrix').style.display = 'inline';
        document.getElementById('matrix').style.visibility = 'visible';
        document.getElementById('matrix').style.border = 2;
        console.log('notes '+this.solfegeNotes +' and octave '+this.solfegeOct);

        this.clearTurtles();
        this.notesToPlay = [];
        this.notesToPlayDirected = [];
        this.isMatrix = 1; //1 if matrix exists

        /*to remove the matrix table*/
        Element.prototype.remove = function()
        {
            this.parentElement.removeChild(this);
        }

        NodeList.prototype.remove = HTMLCollection.prototype.remove = function()
        {
            for (var i = 0, len = this.length; i < len; i++)
            {
                if(this[i] && this[i].parentElement)
                {
                    this[i].parentElement.removeChild(this[i]);
                }
            }
        }
        var table = document.getElementById('myTable');

        if (table != null)
        {
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
        cell.innerHTML = '<b>' + _('Solfa') + '</b>';
        cell.style.height = '40px';
        cell.style.backgroundColor = '#9ACD32';

        var cell = row.insertCell(1);
        cell.innerHTML = _('play');
        cell.style.height = '40px';
        cell.style.backgroundColor = '#9A32CD';
        cell.onclick=function()
        {
            console.log(logo);
            logo.playMatrix();
        }

        var cell = row.insertCell(2);
        cell.innerHTML = _('save');
        cell.style.height = '40px';
        cell.style.backgroundColor = '#9A32CD';
        cell.onclick=function()
        {
            logo.saveMatrix();
        }

        var cell = row.insertCell(3);
        cell.innerHTML = _('close');
        cell.style.height = '40px';
        cell.style.backgroundColor = '#9A32CD';
        cell.onclick=function()
        {
            document.getElementById('matrix').style.visibility = 'hidden';
            document.getElementById('matrix').style.border = 0;
        }

        for (var i=0; i<this.solfegeNotes.length; i++)
        {
            var row = header.insertRow(i+1);
            var cell = row.insertCell(0);
            cell.style.backgroundColor = '#9ACD32';
            cell.innerHTML = this.solfegeNotes[i] + this.solfegeOct[i].toString().sub();
            cell.style.height = '30px';
        }
        
        var row = header.insertRow(this.solfegeNotes.length + 1);
        var cell = row.insertCell(0);
        cell.innerHTML = _('rhythmic note values');
        cell.style.height = '40px';
        cell.style.backgroundColor = '#9ACD32';
        
        this.chkArray = new Array();
        this.chkArray.push(0);
    }

    this.handleTuplet = function(param)
    {
        console.log('parameters ' + JSON.stringify(param));

        var table = document.getElementById('myTable');
        var timeFactor = (param[0][2] / param[1][1]) * (param[1][0] / param[0][1]);
        for (var i=1; i<table.rows.length-1; i++)
        {
            for (var j=0; j<param[1][0]; j++)
            {
                row = table.rows[i];
                cell = row.insertCell(-1)
                cell.setAttribute('id', table.rows[i].cells.length - 1);
                cell.style.backgroundColor = '#ADFF2F';
            }
        }
        for (var j=0; j<param[1][0]; j++)
        {
            this.chkArray.push(0);
            this.notesToPlay.push([['R'],timeFactor*param[1][1]]);
        }
    
        var w = window.innerWidth;
        w = (2 * w) / 5;

        var row = table.insertRow(table.rows.length - 1);
        var cell = row.insertCell(-1);
        cell.innerHTML = '<b>' + 'tuplet value' + '</b>';
        cell.style.backgroundColor = '#9ACD32';
    
        cell = table.rows[table.rows.length - 1].insertCell(-1);
        cell.style.backgroundColor = '#9ACD32';
        cell.style.height = '30px';    
        cell.innerHTML = param[0][1].toString() + '/' + param[0][2].toString();
        cell.width = w*param[0][1]/(param[0][2]) + 'px';
                
        cell.colSpan = param[0][0];        
        cell.style.backgroundColor = 'rgb(174, 174, 174)';
         
        for (var i=0; i < table.rows[table.rows.length - 1].cells.length - 1; i++)
        {
            cell = row.insertCell(i+1);
            cell.style.backgroundColor = 'rgb(4, 255, 174)';
            cell.style.height = '30px';    
            if (i == table.rows[table.rows.length - 1].cells.length - 2)
            {
                cell.style.backgroundColor = 'rgb(4, 255, 174)';
                cell.innerHTML = param[0][0];
                cell.colSpan = param[0][0];
            }
        }

        var row = table.insertRow(table.rows.length - 2);
        var cell = row.insertCell(-1);
        cell.innerHTML = '<b>' + '# tuplet note values' + '</b>';
        cell.style.backgroundColor = '#9ACD32';
        for (var i=0; i<table.rows[table.rows.length - 4].cells.length - 1; i++)
        {    
            cell = row.insertCell(-1);
            cell.style.backgroundColor = 'rgb(4, 255, 174)';
            cell.style.height = '30px';
            if(i >= table.rows[table.rows.length - 1].cells.length - 2)
            {
                cell.innerHTML = '1/' + timeFactor*param[1][1].toString();    
            }

        }    
        
    }

    this.makeMatrix = function(numBeats, noteValue, noteValueNum)
    {
        console.log('makeMatrix ' + numBeats + ' ' + noteValue + ' ' + noteValueNum);
        var table = document.getElementById('myTable');
        console.log(table);
        var noteValueToDisplay = null;
        if (noteValueNum)
        {
            noteValueToDisplay = noteValueNum.toString() + '/' + noteValue.toString();
        }
        else
        {
            noteValueToDisplay = '1/' + noteValue.toString();
        }
        if (parseInt(noteValue) < noteValue)
        {
            noteValueToDisplay = parseInt((noteValue * 1.5))
            noteValueToDisplay = '1.5/' + noteValueToDisplay.toString() + ' (single-dot)'; //<==Rhythmic Dot function does not seem to work anymore (see ownCloud). Did I break it HERE? Thanks and sorry if I did...
        }

        if (this.noteValue > noteValue)
        {
            this.noteValue = noteValue;
        }
        for (var i=0; i<numBeats; i++)
        {
            this.notesToPlay.push([['R'], noteValue]);
        }
        console.log('Rhythm #beats->' + numBeats + ' noteValue->' + noteValue);

        for (var i=1; i<=numBeats; i++)
        {
             this.chkArray.push(0);
        }
        for (var j=0; j<numBeats; j++)
        {
            for (var i=1; i<=this.solfegeNotes.length + 1; i++)
            {    
                var row = table.rows[i];
		console.log(row);
                var cell = row.insertCell(-1);
                cell.style.backgroundColor = '#ADFF2F';
                
                if (i == this.solfegeNotes.length + 1)
                {
                    cell.innerHTML = noteValueToDisplay;
                    cell.style.backgroundColor = 'rgb(174, 174, 174)';
                }
                cell.setAttribute('id', table.rows[1].cells.length - 1);
            }
        }

        var w = window.innerWidth;
        w = (2 * w) / 5;
        this.cellWidth = w/4;
        for (var i = table.rows[1].cells.length - numBeats; i < table.rows[1].cells.length; i++)
        {
            table.rows[1].cells[i].width = w/noteValue + 'px';
        }    
    }

    this.makeClickable = function(tuplet, synth){
        /* Once the entire matrix is generated, this function makes it
	 * clickable. */
        var table = document.getElementById('myTable');
        var that = this;
        var leaveRowsFromBottom = 1;
        if (tuplet)
        {
            leaveRowsFromBottom = 3;
        }
        console.log('isTuplet ' + tuplet);
        for (var i = 1; i < table.rows[1].cells.length; i++) 
        {    
            for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++)
            {                    
                cell = table.rows[j].cells[i];
                if(cell.style.backgroundColor == 'black')
                {
                    cell.style.backgroundColor = '#ADFF2F';
                    cell.style.backgroundColor = 'black';
                    this.setNotes(i, cell.parentNode.rowIndex, false);
                }
            }
        }
        if (table != null) {
            for (var i = 1; i < table.rows[1].cells.length; i++) {
                    
                for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++)
                {    
                    var cell = table.rows[j].cells[i];
                    var that = this;
                    cell.onclick=function(){
                        if (this.style.backgroundColor == 'black')
                        {
                            this.style.backgroundColor = '#ADFF2F';
                            that.chkArray[this.id] = 0;
                            that.notesToPlay[this.id - 1][0] = ['R'];
                            that.setNotes(this.id, this.parentNode.rowIndex, false, tuplet, synth);
                        }
                        else
                        {

                            this.style.backgroundColor = 'black';
                            that.chkArray[this.id] = 1;
                            that.setNotes(this.id, this.parentNode.rowIndex, true, tuplet, synth);
                        }
                    }
                }
            }
        }
    }

    this.setTransposition = function(transposition)
    {
        this.transposition = transposition;
    }

    this.removeTransposition = function(transposition)
    {
        this.transposition = null;
    }

    this.doTransposition = function(note, octave)
    {
        /*first setTransposition in called in logo.js and
	 * this.transposition shows no. of semitones to be shifted
	 * up/down*/
        if (this.transposition)
        {
            var deltaOctave = 0;
            if (this.transposition[0] == '-')
            {
                var factor = this.transposition;
                factor = factor.slice(0,0) + factor.slice(1,factor.length);
                factor = parseInt(factor);
                var index = this.notes.indexOf(note);
                if (index == 0)
                {
                    index = this.notes.length - factor % this.notes.length;
                    deltaOctave = -1
                }
                else
                {
                    index = index - ( factor % this.notes.length );
                    if(index < 0)
                    {
                            index = this.notes.length +     index;
                            deltaOctave = -1;
                    }
                }
                return this.notes[index] + (parseInt(octave) + parseInt(deltaOctave));
            }
            else if (this.transposition[0] == '+')
            {
                var factor = this.transposition;
                factor = factor.slice(0,0) + factor.slice(1,factor.length);
                factor = parseInt(factor);
                var index = this.notes.indexOf(note);
                if (index == this.notes.length - 1)
                {
                    index = factor % this.notes.length - 1;
                    deltaOctave = 1;
                }    
                else
                    {
                        index += factor % this.notes.length;
                    }
                if (index >= this.notes.length)
                {
                    index = index % this.notes.length;
                    deltaOctave = 1;
                }
                var x = this.notes[index] + (parseInt(octave) + parseInt(deltaOctave));
                return this.notes[index] + (parseInt(octave) + parseInt(deltaOctave));
            }
        }
        return note;
    }

    this.playAll = function(synth)
    {
        var notes = [];
        for (i in this.notesToPlay)
        {
            notes.push(this.notesToPlay[i]);
        }
        if (this.playDirection > 0)
        {
            this.notesToPlayDirected = notes;
        }
        else
        {
            this.notesToPlayDirected = notes.reverse();
        }
        this.playDirection = 1;
        this.notesCounter = 0;
        var that = this;
        var time = 0;
        var table = document.getElementById('myTable');
        
        var note  = this.notesToPlayDirected[this.notesCounter][0];
        var noteValue = that.notesToPlayDirected[this.notesCounter][1];
        this.notesCounter += 1;
        if (note != 'R')
        {
            synth.triggerAttackRelease(note, 1 / noteValue);
        }

        for (var i = 1; i < this.notesToPlayDirected.length; i++)
        {
            noteValue = this.notesToPlayDirected[i - 1][1];
            time += 1/noteValue;
            var that = this;
        
            setTimeout(function()
            {
                if(that.notesCounter >= that.notesToPlayDirected.length)
                {
                    that.notesCounter = 1;
                    Tone.Transport.stop();
                }
                note  = that.notesToPlayDirected[that.notesCounter][0];
                noteValue = that.notesToPlayDirected[that.notesCounter][1];
                that.notesCounter += 1;
                if(note != 'R')
                {
                    synth.triggerAttackRelease(note, 1 / noteValue);
                }
            }, 2000 * time);
        }
    }

    this.musicNotation = function(notes, numerator, denominator)
    {
        musicnotation.doNotation(notes, numerator, denominator);
    }

    this.setNotes = function(colIndex, rowIndex, playNote, tuplet, synth)
    {
        /* Sets corresponding note when user clicks on any cell and
	 * plays that note*/

        var leaveRowsFromBottom = 1;
        if(tuplet)
        {
            leaveRowsFromBottom = 3;
        }
        var table = document.getElementById('myTable');
        var octave = this.solfegeOct[rowIndex - 1];
        var transformed = false;
        this.notesToPlay[colIndex - 1][0] = [];
        if (table != null)
        {
            for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++)
            {
                cell = table.rows[j].cells[colIndex];
                var note;
                if (cell.style.backgroundColor == 'black')
                {
                    var solfege = table.rows[j].cells[0].innerHTML;
                    if (solfege.substr(-1) == '#' || 'b')
                        transformed = true;
                    if (solfege.toUpperCase().substr(0,2) == 'DO')
                    {
                        note = 'c' + octave;
                    }
                    else if (solfege.toUpperCase().substr(0,2) == 'RE')
                    {
                        note = 'd' + octave;
                    }
                    else if (solfege.toUpperCase().substr(0,2) == 'MI')
                    {
                        note = 'e' + octave;
                    }
                    else if (solfege.toUpperCase().substr(0,2) == 'FA')
                    {
                        note = 'f' + octave;
                    }
                    else if (solfege.toUpperCase().substr(0,3) == 'SOL')
                    {
                        note = 'g' + octave;
                    }    
                    else if (solfege.toUpperCase().substr(0,2) == 'LA')
                    {
                        note = 'a' + octave;                       
                    }
                    else if (solfege.toUpperCase().substr(0,2) == 'SI')
                    {
                        note = 'b' + octave;
                    }
                    if (transformed)
                    {
                        
                        if (solfege.substr(-1) == '#')
                        {
                            this.transposition = '+1';
                            note = this.doTransposition(note[0], note[1]);
                        }

                        else if (solfege.substr(-1) == 'b')
                        {
                            this.transposition = '-1';
                            note = this.doTransposition(note[0], note[1]);
                        }
                        this.transposition = null;

                    }
                    var noteValue = table.rows[table.rows.length - 1].cells[1].innerHTML;
                    var i = 0;
                    if (noteValue.substr(0,3) == '1.5')
                    {
                        while (noteValue[i] != ' ')
                        {
                            i += 1;
                        }
                        noteValue = noteValue.substr(4, i-4);
                        noteValue = parseInt(noteValue)
                        noteValue = 1.5/noteValue;
                        noteValue = noteValue.toString()
                    }
                    
                    this.notesToPlay[parseInt(colIndex) - 1][0].push(note);
                    this.clearTurtles();
                    if (playNote)
                       {    
                           synth.triggerAttackRelease(note, noteValue);
                    }
                    for (var i=0; i<this.notesToPlay.length; i++)
                    {
                        turtles.add(null, null, this.notesToPlay[i][0]);
                    }
                }
            }        
        }
    }

    this.playNotesString = function(time, synth){
        /*plays the matrix and also the chunks*/
        if (this.transposition != null )
        {
            var transposedArray = [];
            for (var i = 0; i < this.notesToPlay.length; i++)
            {
                var transposedNote = this.doTransposition(this.notesToPlay[i][0], this.octave);
                transposedArray.push(transposedNote);
            }
            
            console.log('original notes ' + this.notesToPlay);
            this.notesToPlay = transposedArray;
            console.log('transposed notes to be played ' + this.notesToPlay);
        }
        else
        {
            console.log('notes to be played ' + JSON.stringify(this.notesToPlay));
        }

        this.i = 0;

        var that = this;
        setTimeout(function()
        {
            console.log('playing after ' + time + 'ms');
            that.playAll(synth);
        },time);
    }

    this.saveMatrix = function()
    {
        /* Saves the current matrix as chunks, saving as a chunk
	 * functionality is implemented in logo js*/

        var noteConversion = {'c': 'do', 'd': 're', 'e': 'mi', 'f': 'fa', 'g': 'sol', 'a': 'la', 'b': 'si', 'R': 'rest'};
        var newStack = [[0, ["action", {"collapsed":false}], 100, 100, [null, 1, null, null]], [1, ["text", {"value":"chunk" + window.savedMatricesCount.toString()}], 0, 0, [0]]];
        var stackIdx = 0;
        console.log('Save Matrix!!!');

        for (var i=0; i<this.notesToPlay.length; i++)
        {
            var note = this.notesToPlay[i].slice(0);
            // console.log(note[0][0] + ' ' + note[1]);
            // if (note[0][0][0] == 'R') {
            //     console.log(noteConversion[note[0][0][0]]);
            // } else {
            //     console.log(noteConversion[note[0][0][0]] + ' ' + note[0][0][1]);
            // }
            window.savedMatricesNotes.push(note);

            // Add the Note block and its value
            var idx = newStack.length;
            newStack.push([idx, 'note', 0, 0, [stackIdx, idx + 1, null]]);
            var n = newStack[idx][4].length;
            newStack[stackIdx][4][n - 1] = idx;
            var stackIdx = idx;
            newStack.push([idx + 1, ['number', {'value': note[1]}], 0, 0, [idx]]);
            // Add the pitch block to the Note block
            newStack.push([idx + 2, 'pitch', 0, 0, [idx, idx + 3, idx + 4]]);
            newStack.push([idx + 3, ['text', {'value': noteConversion[note[0][0][0]]}], 0, 0, [idx + 2]]);
            if (note[0][0][0] == 'R') {
                newStack.push([idx + 4, ['number', {'value': 0}], 0, 0, [idx + 2]]);
            } else {
                newStack.push([idx + 4, ['number', {'value': note[0][0][1]}], 0, 0, [idx + 2]]);
            }
        }
        window.savedMatricesNotes.push('end');
        window.savedMatricesCount += 1;
        console.log(newStack);
        // Create a new stack for the chunk.
        this.logo.blocks.loadNewBlocks(newStack);
    }
}
