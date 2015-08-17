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

function Matrix(turtles, musicnotation)
{
	this.tempo = 60;
	this.frequency = 500;
	this.secondsPerBeat = 1;
	this.notesToPlay = [];
	this.notesToPlayDirected = [];
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
	this.synth = new Tone.PolySynth(4, Tone.AMSynth).toMaster();
	Tone.Transport.start();

	this.oldNotes = [];
	this.cellWidth = 0;
	this.solfegeNotes = [];
	this.solfegeOct = [];
	this.beatValue = 4;
	this.notesCounter = 0;
	this.playDirection = 1;

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
		this.notesToPlayDirected = [];
		this.isMatrix = 1;
		this.octave = octave;

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
		{
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
    	cell.innerHTML = '<b>'+'#-of-Notes / Note-Value'+'</b>';
    	cell.style.height = "40px";
    	cell.style.backgroundColor = '#9ACD32';
    	
 		this.chkArray = new Array();
 		this.chkArray.push(0);

	}

	this.handleTuplet = function(param)
	{
		console.log("parameters "+JSON.stringify(param));
		
		//this.makeMatrix(1, param[0][2], param[0][1]);
		var table = document.getElementById("myTable");
	    var timeFactor = (param[0][2]/param[1][1])* (param[1][0]/param[0][1]);
	    for(var i=1; i<table.rows.length-1; i++)
    	{
    	//	for(var k=1; k<param.length; k++)
    		for(var j=0; j<param[1][0]; j++)
    		{
    			row = table.rows[i];
	    		cell = row.insertCell(-1)
	    		//cell.width = '75px';
	    		cell.setAttribute('id', table.rows[i].cells.length - 1);
		    	cell.style.backgroundColor = '#ADFF2F';
    		}
    	}
    		for(var j=0; j<param[1][0]; j++)
    		{
    			this.chkArray.push(0);
				this.notesToPlay.push([["R"],timeFactor*param[1][1]]);
	    	}

	
 		var w = window.innerWidth;
		w = (2*w)/5;

	    var row = table.insertRow(table.rows.length - 1);
    	var cell = row.insertCell(-1);
    	cell.innerHTML = '<b>' + 'Tuplet Value' + '</b>';
    	cell.style.backgroundColor = '#9ACD32';
	
	   	cell =table.rows[table.rows.length - 1].insertCell(-1);
		cell.style.backgroundColor = '#9ACD32';
		cell.style.height = "30px";	
		cell.innerHTML = param[0][1].toString() + "/" +param[0][2].toString() ;
		cell.width = w*param[0][1]/(param[0][2]) + 'px';
    			
		cell.colSpan = param[0][0];		
		cell.style.backgroundColor = 'rgb(174, 174, 174)';
 		
		for(var i=0; i < table.rows[table.rows.length - 1].cells.length - 1; i++)
    	{
    		cell =row.insertCell(i+1);
    		cell.style.backgroundColor = 'rgb(4, 255, 174)';
    		cell.style.height = "30px";	
    		if(i == table.rows[table.rows.length - 1].cells.length - 2)
			{
				cell.style.backgroundColor = 'rgb(4, 255, 174)';
				cell.innerHTML = param[0][0];
				//cell.width = "200px";
				cell.colSpan = param[0][0];
			}
    	}

    	var row = table.insertRow(table.rows.length - 2);
    	var cell = row.insertCell(-1);
    	cell.innerHTML = '<b>' + '# notes/Notes-Value 2' + '</b>';
    	cell.style.backgroundColor = '#9ACD32';
    	for(var i=0; i<table.rows[table.rows.length - 4].cells.length - 1; i++)
    	{	
    		cell =row.insertCell(-1);
    		cell.style.backgroundColor = 'rgb(4, 255, 174)';
    		cell.style.height = "30px";
    		if(i >= table.rows[table.rows.length - 1].cells.length - 2)
    		{
    			cell.innerHTML = "1/" + timeFactor*param[1][1].toString();	
    		}

    	}	
    	
    	//waitTime = 1/param[1][1]      param[0][1]/param[0][1]
    	//cell.style.width = w/4 + 'px';

    	
	}

	this.makeMatrix = function(numBeats, beatValue, beatValueNum)
	{

		var table = document.getElementById("myTable");
		var beatValueToDisplay = null;
		if(beatValueNum)
			beatValueToDisplay = beatValueNum.toString() + '/' + beatValue.toString();
		else
			beatValueToDisplay = "1/" + beatValue.toString();
		if(parseInt(beatValue) < beatValue)
		{
			beatValueToDisplay = parseInt((beatValue*1.5))
			//beatValue = parseInt((beatValue*1.5));
			beatValueToDisplay = "1/" + beatValueToDisplay.toString() + 'dot.';
		}	
		
		if(this.beatValue > beatValue)
			this.beatValue = beatValue;
	    for(var i=0; i<numBeats; i++)
	    {
	    	this.notesToPlay.push([["R"],beatValue]);
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
		    		cell.innerHTML = beatValueToDisplay;
		    		cell.style.backgroundColor = 'rgb(174, 174, 174)';
		    	}
		    	cell.setAttribute('id', table.rows[1].cells.length - 1);
		    }
		}
		var w = window.innerWidth;
		w = (2*w)/5;//table.rows[1].cells.length;
		this.cellWidth = w/4;
		for(var i = table.rows[1].cells.length - numBeats; i < table.rows[1].cells.length; i++)
		{
			table.rows[1].cells[i].width = w/beatValue + 'px';
		}
				
	}

	this.makeClickable = function(tuplet){
		var table = document.getElementById("myTable");
		var that = this;
		var leaveRowsFromBottom = 1;
		if(tuplet)
			leaveRowsFromBottom = 3;
		console.log("isTuplet "+tuplet);
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
					//break;
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
		        		//this.onmouseout=null;
		        		var oldBeatVal = 4;
		        		if (this.style.backgroundColor == 'black')
		        		{
		        			this.style.backgroundColor = '#ADFF2F';
		        			that.chkArray[this.id] = 0;
		        			that.notesToPlay[this.id - 1][0] = ['R'];
							that.setNotes(this.id, this.parentNode.rowIndex, false, tuplet);
		        		}
		        		else //if (that.chkArray[this.id] == 0)
		        		{

		        			this.style.backgroundColor = 'black';
							that.chkArray[this.id] = 1;
							that.setNotes(this.id, this.parentNode.rowIndex, true, tuplet);
		        		}
		        		/*else if (that.chkArray[this.id] == 1)
		        		{
		        			for (var k = 1; k < table.rows.length - 1; k++)
		        			{	
		        				cell = table.rows[k].cells[this.id];
		        				if(cell.style.backgroundColor == 'black')
		        				{
		        					cell.style.backgroundColor = '#ADFF2F';
		        					this.style.backgroundColor = 'black';
									that.setNotes(this.id, this.parentNode.rowIndex, true);
		        					//break;
		        				}
		        			}
		        		}*/
		        	};
		    	}
		    }
 	 	}
 	 
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
	var notes = [];
	for(i in this.notesToPlay)
		notes.push(this.notesToPlay[i]);
	if(this.playDirection > 0)
		this.notesToPlayDirected = notes;
	else
		this.notesToPlayDirected = notes.reverse();
	this.playDirection = 1;
	this.notesCounter = 0;
	var that = this;
	var time = 0;
	var table = document.getElementById("myTable");
		
	var note  = this.notesToPlayDirected[this.notesCounter][0];
	var	beatValue = that.notesToPlayDirected[this.notesCounter][1];
	this.notesCounter += 1;
	if(note != 'R')
	    	this.synth.triggerAttackRelease(note, 1/beatValue);

	for(var i = 1; i < this.notesToPlayDirected.length; i++)
	{
	    beatValue = this.notesToPlayDirected[i - 1][1];
		time += 1/beatValue;
		var that = this;
		
		setTimeout(function(){
			if(that.notesCounter >= that.notesToPlayDirected.length)
			{
				that.notesCounter = 1;
				Tone.Transport.stop();
			}
			note  = that.notesToPlayDirected[that.notesCounter][0];
			beatValue = that.notesToPlayDirected[that.notesCounter][1];
			that.notesCounter += 1;
			if(note != 'R')
		    	that.synth.triggerAttackRelease(note, 1/beatValue);
		}, 2000*time);
	}
	}

	this.musicNotation = function(notes, beatValue, numerator, denominator){

		musicnotation.doNotation(notes, beatValue, numerator, denominator);
	}

	this.setNotes = function(colIndex, rowIndex, playNote, tuplet){
		var leaveRowsFromBottom = 1;
		if(tuplet)
			leaveRowsFromBottom = 3;
		var table = document.getElementById("myTable");
		var octave = this.solfegeOct[rowIndex - 1];
		var transformed = false;
		this.notesToPlay[colIndex - 1][0] = [];
		if (table != null) {
			for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++)
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
                    var beatValue = table.rows[table.rows.length - 1].cells[1].innerHTML;
                    
                    this.notesToPlay[parseInt(colIndex) - 1][0].push(note);
                    this.clearTurtles();
                    if(playNote)
               	    {	
               	    	this.synth.triggerAttackRelease(note, beatValue);
					}
                    for(var i=0; i<this.notesToPlay.length; i++)
                    	turtles.add(null, null, this.notesToPlay[i][0]);
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
            console.log('notes to be played ' + JSON.stringify(this.notesToPlay));

    	this.i = 0;
    	var that = this;
    	setTimeout(function(){ console.log('playing after ' + time + 'ms');

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