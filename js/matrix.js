// Copyright (c) 2015 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// (at your option) any later version.
//
// You should have received a copy of the GNU General Public License
// along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function Matrix(Mcanvas, stage, turtles, trashcan, musicnotation)
{
	this.timeSignDenominator = 4;
	this.timeSignNumerator = 4;
	this.tempo = 60;
	this.frequency = 500;
	this.secondsPerBeat = 1;
	this.notesToPlay = [];
	this.notesToPlayBeatValue = [];
	this.numberOfNotesToPlay = 0;
	this.chkArray = null;
	this.octave = 0;
	this.i = 0;
	this.matrixContainer = null;
	this.notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	this.colorCode = ['#F2F5A9' ,'#F3F781', '#F4FA58', '#F7FE2E', '#FFFF00', '#D7DF01', '#AEB404'];
	this.transposition = null;
	this.isMatrix = 0;
	this.freetime = 1000;
	this.synth = 0;
	this.oldNotes = [];
	this.cellWidth = 0;
	this.solfegeNotes = [];
	this.solfegeOct = [];
	this.beatValue = 4;
	this.rhythm = [];
	this.notesCounter = 0;

	this.notationIndex = 0;	
	this.clearTurtles = function()
	{
		for(var i = 0; i < turtles.turtleList.length; i++)
		{
			if(turtles.turtleList[i].name.includes('note'))
			{
				turtles.turtleList[i].trash = true;
                turtles.turtleList[i].container.visible = false;	
				turtles.turtleList.splice(i, 1);
				i -=1 ;
			}
		}
		this.i = 0;


	}
	
	this.initMatrix = function(timeSign, octave)
	{
		document.getElementById('matrix').style.display = 'inline';
		
		console.log('notes '+this.solfegeNotes +' and octave '+this.solfegeOct);

		this.clearTurtles();
		this.notesToPlay = [];
		this.notesToPlayBeatValue = [];
		this.isMatrix = 1;
		this.octave = octave;
		this.rhythm = [];

		Element.prototype.remove = function() {
 	    this.parentElement.removeChild(this);
		}
		NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    		for(var i = 0, len = this.length; i < len; i++) {
        		if(this[i] && this[i].parentElement) {
            	this[i].parentElement.removeChild(this[i]);
        		}
    		}
		}
		var table = document.getElementById("myTable");


		if(table != null)
		{console.log("in remove");
			table.remove();
		}
		//var solfege = this.solfegeNotes;//['Do','Re','Mi','Fa','Sol','La','Si'];

		var x = document.createElement("TABLE");
		x.setAttribute("id", "myTable");
		
		x.style.textAlign = 'center';
		
		var matrixDiv = document.getElementById("matrix");
		matrixDiv.appendChild(x);
		
		var table = document.getElementById("myTable");
		var header = table.createTHead();
	    var row = header.insertRow(0);
    	var cell = row.insertCell(-1);
    	cell.innerHTML = '<b>' + 'Solfa' + '</b>';
    	cell.style.height = "40px";
    	cell.style.backgroundColor = '#9ACD32';
    	//cell.style.width = w/4 + 'px';

    	for(var i=0; i<this.solfegeNotes.length; i++)
    	{
    		var row = header.insertRow(i+1);
    		var cell = row.insertCell(0);
    		cell.style.backgroundColor = '#9ACD32';
    		cell.innerHTML = this.solfegeNotes[i];
    		cell.style.height = "30px";
    	}
    	
    	var row = header.insertRow(this.solfegeNotes.length + 1);
    	var cell = row.insertCell(0);
    	cell.innerHTML = '<b>'+'Time'+'</b>';
    	cell.style.height = "40px";
    	cell.style.backgroundColor = '#9ACD32';
    	
 		this.chkArray = new Array();
 		this.chkArray.push(0);

	}

	this.makeMatrix = function(numBeats, beatValue, addToRhythm)
	{
		if(addToRhythm)
			this.rhythm.push([numBeats, beatValue]);
		var table = document.getElementById("myTable");
		
		if(this.beatValue > beatValue)
			this.beatValue = beatValue;
	    for(var i=0; i<numBeats; i++)
	    {
	    	this.notesToPlay.push(["R",beatValue]);
	    	this.notesToPlayBeatValue.push(beatValue);
	    }
	    console.log("Rhythm #beats->"+numBeats+" beatValue->"+beatValue);

 		for(var i=1; i<=numBeats; i++)
 			this.chkArray.push(0);
	    for(var j=0; j<numBeats; j++)
	    {
		    for(var i=1; i<=this.solfegeNotes.length + 1; i++)
		    {	
		    	var row = table.rows[i];
		    	var cell = row.insertCell(-1);
		    	cell.style.backgroundColor = '#ADFF2F';
		    	//cell.width = this.cellWidth;
		    	
		    	if(i==this.solfegeNotes.length + 1)
		    	{
		    		cell.innerHTML = beatValue;
		    		cell.style.backgroundColor = '#AEB404';
		    	}
		    	cell.setAttribute('id', table.rows[1].cells.length - 1);
		    }
		}
		var w = window.innerWidth;
		w = (2*w)/table.rows[1].cells.length;
		this.cellWidth = w/4;
		for(var i = 1; i < table.rows[1].cells.length; i++)
		{
			table.rows[1].cells[i].width = w/table.rows[table.rows.length - 1].cells[i].innerHTML + 'px';
		}
				
	}

	this.makeClickable = function(){
		var table = document.getElementById("myTable");
		console.log('chk arr '+this.chkArray)
		var that = this;
		for (var i = 1; i < table.rows[1].cells.length; i++) 
		{	
	        for (var j = 1; j < table.rows.length - 1; j++)
	        {			    	
				cell = table.rows[j].cells[i];
				if(cell.style.backgroundColor == 'black')
				{
					cell.style.backgroundColor = '#ADFF2F';
					cell.style.backgroundColor = 'black';
					this.setNotes(i, cell.parentNode.rowIndex, false);
					break;
				}
			}
		}

		if (table != null) {
		    for (var i = 1; i < table.rows[1].cells.length; i++) {
		    		
		        for (var j = 1; j < table.rows.length - 1; j++)
		        {	
		    		var cell = table.rows[j].cells[i];
		    		var that = this;
		        	cell.onclick=function(){
		        			console.log("here here "+ that.chkArray[this.id]  + "   "+that.chkArray );
		        		//this.onmouseout=null;
		        		if (this.style.backgroundColor == 'black')
		        		{
		        			this.style.backgroundColor = '#ADFF2F';
		        			that.chkArray[this.id] = 0;
		        			that.notesToPlay[this.id - 1] = 'R'	;
		        		}
		        		else if (that.chkArray[this.id] == 0)
		        		{

		        			this.style.backgroundColor = 'black';
							that.chkArray[this.id] = 1;
							that.setNotes(this.id, this.parentNode.rowIndex, true);

		        		}
		        		else if (that.chkArray[this.id] == 1)
		        		{
		        			for (var k = 1; k < table.rows.length - 1; k++)
		        			{	
		        				cell = table.rows[k].cells[this.id];
		        				if(cell.style.backgroundColor == 'black')
		        				{
		        					cell.style.backgroundColor = '#ADFF2F';
		        					this.style.backgroundColor = 'black';
									that.setNotes(this.id, this.parentNode.rowIndex, true);
		        					break;
		        				}
		        			}
		        		}
		        	};
		    	}
		    }
 	 	}
 	 
		this.synth = new Tone.AMSynth().toMaster();
	}

	this.setTempo = function(timeSign){
		//var this.tempo = 60;
    	//var secondsPerBeat = 60 / this.tempo;

	}

	this.setPitch = function(timeSign){
		this.frequency = 500;

	}

	this.setTransposition = function(transposition){
		this.transposition = transposition;

	}

	this.removeTransposition = function(transposition){
		this.transposition = null;

	}

	this.doTransposition = function(note, octave){
		if(this.transposition)
		{

			var deltaOctave = 0;
			if(this.transposition[0] == '-')
			{
				var factor = this.transposition;
				factor = factor.slice(0,0) + factor.slice(1,factor.length);
				factor = parseInt(factor);
				var index = this.notes.indexOf(note);
				if(index == 0)
				{
					index = this.notes.length - factor % this.notes.length;
					deltaOctave = -1
				}
				else
				{
					index = index - ( factor % this.notes.length );
					if(index < 0)
					{
							index = this.notes.length +	 index;
							deltaOctave = -1;
					}
				}
				return this.notes[index] + (parseInt(octave) + parseInt(deltaOctave));
			}
			else if(this.transposition[0] == '+')
			{
				var factor = this.transposition;
				factor = factor.slice(0,0) + factor.slice(1,factor.length);
				factor = parseInt(factor);
				var index = this.notes.indexOf(note);
				if(index == this.notes.length - 1)
				{
					index = factor % this.notes.length - 1;
					deltaOctave = 1;
				}	
				else
					{
						index += factor % this.notes.length;
					}
				if(index >= this.notes.length)
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

	this.playAll = function(){
	
	var notes = this.notesToPlay;
	this.notesCounter = 0;
	var that = this;
	var time = 0;
	var table = document.getElementById("myTable");
		
	for(i in this.notesToPlay)
	{
	    var beatValue = 4;
		time += 1/beatValue;
		var that = this;
		
		setTimeout(function(){
			if(that.notesCounter >= that.notesToPlay.length)
				that.notesCounter = 0;
			note  = that.notesToPlay[that.notesCounter][0];
			beatValue = that.notesToPlay[that.notesCounter][1];
			that.notesCounter += 1;
			if(note != 'R')
		    	that.synth.triggerAttackRelease(note, 1/beatValue);
		}, 2000*time);
	}
//the transport won't start firing events until it's started
	Tone.Transport.start();
	}

	this.musicNotation = function(notes, beatValue, numerator, denominator){

		musicnotation.doNotation(notes, beatValue, numerator, denominator);
	}

	this.setNotes = function(colIndex, rowIndex, playNote){
		
		var table = document.getElementById("myTable");
		var octave = this.solfegeOct[rowIndex - 1];
		var transformed = false;
		if (table != null) {
			for (var j = 1; j < table.rows.length; j++)
    		{
    			cell = table.rows[j].cells[colIndex];
    			var note;

    			if(cell.style.backgroundColor == 'black')
                {
                    var solfege = table.rows[j].cells[0].innerHTML;
                    if(solfege.substr(-1) == '#' || '♭')
                    	transformed = true;
                    if(solfege.toUpperCase().substr(0,2) == 'DO')
                    {
                        note = 'C' + octave;
                    }
                    else if(solfege.toUpperCase().substr(0,2) == 'RE')
                    {
                        note = 'D' + octave;
                    }
                    else if(solfege.toUpperCase().substr(0,2) == 'MI')
                    {
                        note = 'E' + octave;
                    }
                    else if(solfege.toUpperCase().substr(0,2) == 'FA')
                    {
                        note = 'F' + octave;
                    }
                    else if(solfege.toUpperCase().substr(0,3) == 'SOL')
                    {
                        note = 'G' + octave;
                    }	
                    else if(solfege.toUpperCase().substr(0,2) == 'LA')
                    {
                        note = 'A' + octave;                       
                    }
                    else if(solfege.toUpperCase().substr(0,2) == 'SI')
                    {
                        note = 'B' + octave;
                    }
                    if(transformed)
                    {
                    	
                    	if(solfege.substr(-1) == '#')
                    	{
                    		this.transposition = '+1';
                    		note = this.doTransposition(note[0], note[1]);
                    	}

                    	else if(solfege.substr(-1) == '♭')
                    	{
                    		this.transposition = '-1';
                    		note = this.doTransposition(note[0], note[1]);
                    	}
                    	this.transposition = null;

                    }
                    var beatValue = table.rows[table.rows.length-1].cells[cell.cellIndex].innerHTML;
                    this.notesToPlay[parseInt(colIndex) - 1] = [note, beatValue];
                    this.clearTurtles();
                    if(playNote)
               	    {
               	    	this.synth.triggerAttackRelease(note, 1/beatValue);
						Tone.Transport.start();
					}
                    for(var i=0; i<this.notesToPlay.length; i++)
                    	turtles.add(null, null, this.notesToPlay[i][0]);
                    	//console.log('turtles '+	turtles.turtleList);              
                }
    		}    	
        }
    }

    this.playMatrix = function(time){
    	if( this.transposition != null )
        {
            var transposedArray = [];
            for(var i = 0; i < this.notesToPlay.length; i++)
            {
                var transposedNote = this.doTransposition(this.notesToPlay[i][0], this.octave);
                transposedArray.push(transposedNote);
            }
            
            console.log('original notes ' + this.notesToPlay);
            this.notesToPlay = transposedArray;
            console.log('transposed notes to be played ' + this.notesToPlay);
        }
        else
            console.log('notes to be played ' + this.notesToPlay[0]);

    	this.i = 0;
    	var that = this;
    	setTimeout(function(){ console.log('playing after' + time + 'ms');

    		that.playAll(); },time);
    }

    this.saveMatrix = function(){
    	for(var i=0; i<this.notesToPlay.length; i++)
    	{
    		window.savedMatricesNotes.push(this.notesToPlay[i]);
    	}
    	window.savedMatricesNotes.push('end');
    	window.savedMatricesCount += 1;
    	console.log("saved "+JSON.stringify(window.savedMatricesNotes));
    }
		
}