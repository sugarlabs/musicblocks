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
		
		console.log('time signature '+timeSign +' and octave '+octave);

		this.clearTurtles();
		this.notesToPlay = [];
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
		var flag = 0 ,flag1 = 1, tsd = 0, tsn = 0;
	    for(var i=0; i<timeSign.length; i++)
	    {
	    	if(flag)
	    	{	
	    		tsd += parseInt(timeSign[i]);
	    		tsd *= 10;

	    	}
	    	if(flag1 && timeSign[i] != '/')
	    	{
	    		tsn += parseInt(timeSign[i]);
	    		tsn *= 10;

	    	}
	    	if(timeSign[i] == '/')
	    	{
	    		flag = 1;
	    		flag1 = 0;
	    	}
	    	
	    }

	    this.timeSignDenominator = tsd/10;
	    this.timeSignNumerator = tsn/10;
	    
		var table = document.getElementById("myTable");


		if(table != null)
		{
			table.remove();
		}
		var solfege = ['Do','Re','Mi','Fa','Sol','La','Si'];

		var x = document.createElement("TABLE");
		x.setAttribute("id", "myTable");
		x.style.textAlign = 'center';
		var w = window.innerWidth;
		w = (2*w)/this.timeSignDenominator;
		this.cellWidth = w/4;

		var matrixDiv = document.getElementById("matrix");
		matrixDiv.appendChild(x);

		var table = document.getElementById("myTable");
		var header = table.createTHead();
	    var row = header.insertRow(0);
    	var cell = row.insertCell(-1);
    	cell.innerHTML = '<b>' + 'Solfa' + '</b>';
    	cell.style.height = "40px";
    	cell.style.backgroundColor = '#9ACD32';
    	cell.style.width = w/4 + 'px';



    	for(var i=0; i<solfege.length; i++)
    	{
    		var row = header.insertRow(i+1);
    		row.id = 'row' + i+1;
    		var cell = row.insertCell(0);
    		//console.log("roww "+row);
    		//cell.onclick = this.addRowUp;	
    		cell.style.backgroundColor = '#9ACD32';
    		cell.innerHTML = solfege[solfege.length-1-i];
    		cell.style.height = "30px";
    	}
    	
    	var row = header.insertRow(8);
    	var cell = row.insertCell(0);
    	cell.innerHTML = '<b>'+'Time'+'</b>';
    	cell.style.height = "40px";
    	cell.style.backgroundColor = '#9ACD32';
    	
	    for(var i=0; i<this.timeSignNumerator; i++)
	    {
	    	this.notesToPlay.push("C4");
	    }

	    if(this.timeSignDenominator == 4)
	    {
	    	this.freetime = 1000;
		}
	    else if(this.timeSignDenominator == 8)
	    {
	    	this.freetime = 500;
		}
		else if(this.timeSignDenominator == 16)
		{
			this.freetime = 250;
		}
		else if(this.timeSignDenominator == 32)
		{
			this.freetime = 125;
		}

 		this.chkArray = new Array(this.timeSignDenominator);
 		for(var i=0; i<=this.timeSignNumerator; i++)
 			this.chkArray[i] = 0;
	    for(var j=0; j<this.timeSignNumerator; j++)
	    {
		    for(var i=1; i<9; i++)
		    {
		    	var table = document.getElementById("myTable");
		    	var row = table.rows[i];
		    	var cell = row.insertCell(-1);
		    	cell.style.backgroundColor = '#ADFF2F';
		    	cell.width = this.cellWidth;
		    	
		    	if(i==8)
		    	{
		    		cell.innerHTML = j+1;
		    		cell.style.backgroundColor = '#AEB404';
		    	}
		    	cell.setAttribute('id', j+1);
		    }
		}
		var table = document.getElementById("myTable");
		var that = this;
				if (table != null) {
				    for (var i = 1; i < table.rows[1].cells.length; i++) {
				    		
				        for (var j = 1; j < table.rows.length - 1; j++)
				        {	
				    		var cell = table.rows[j].cells[i];
				    		var that = this;
				   
				        	cell.onclick=function(){
				        		//this.onmouseout=null;
				        		if (this.style.backgroundColor == 'black')
				        		{
				        			this.style.backgroundColor = '#ADFF2F';
				        			that.chkArray[this.id] = 0;
				        			//that.setNotes(this.id);
				        		}
				        		else if (that.chkArray[this.id] == 0)
				        		{

				        			this.style.backgroundColor = 'black';
									that.chkArray[this.id] = 1;
									that.setNotes(this.id);

				        		}
				        		else if (that.chkArray[this.id] == 1)
				        		{
				        			for (var k = 1; k < table.rows.length - 1; k++)
				        			{
				        				console.log(this.id + "  "+k);
				        				cell = table.rows[k].cells[this.id];
				        				if(cell.style.backgroundColor == 'black')
				        				{
				        					cell.style.backgroundColor = '#ADFF2F';
				        					this.style.backgroundColor = 'black';
											that.setNotes(this.id);
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

	 	this.addRowUp = function(){
		var table = document.getElementById("myTable");
		var index = this.parentNode.rowIndex;
		var row = table.insertRow(index);
		var cell = row.insertCell(0);
		cell.innerHTML = "GOD";
		cell.style.backgroundColor = '#9ACD32';
		cell.style.height = "30px";
		console.log("that "+this.timeSignNumerator);
		for(var j=0; j<this.timeSignNumerator; j++)
		{
			console.log("insidae");
		  	var cell = row.insertCell(j+1);
	    	cell.style.backgroundColor = '#ADFF2F';
	    	cell.width = this.cellWidth;
	    }
    //console.log("in" + this.cellIndex);
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
	var position = 0;

	var that = this;
	var setI = Tone.Transport.setInterval(function(time){
	    var note = notes[position++];
	    //position = position % notes.length;
	    that.synth.triggerAttackRelease(note, 1/that.timeSignDenominator, time);
	    if(position == notes.length )
    	{	Tone.Transport.clearInterval(setI);
    		Tone.Transport.stop();
    	}
	}, 2/that.timeSignDenominator);

	//the transport won't start firing events until it's started
	Tone.Transport.start();
	}

	this.musicNotation = function(){

		musicnotation.doNotation(this.timeSignNumerator, this.timeSignDenominator, this.octave);
	}

	this.setNotes = function(index){
		
		var table = document.getElementById("myTable");
		
		if (table != null) {
			for (var j = 1; j < table.rows.length; j++)
    		{
    			cell = table.rows[j].cells[index];
    			var note;
    			if(cell.style.backgroundColor == 'black')
                {
                    var solfege = table.rows[j].cells[0].innerHTML;
                    if(solfege == 'Do')
                    {
                        note = 'C' + this.octave;
                    }
                    else if(solfege == 'Re')
                    {
                        note = 'D' + this.octave;
                    }
                    else if(solfege == 'Mi')
                    {
                        note = 'E' + this.octave;
                    }
                    else if(solfege == 'Fa')
                    {
                        note = 'F' + this.octave;
                    }
                    else if(solfege == 'Sol')
                    {
                        note = 'G' + this.octave;
                    }
                    else if(solfege == 'La')
                    {
                        note = 'A' + this.octave;                       
                    }
                    else if(solfege == 'Si')
                    {
                        note = 'B' + this.octave;
                    }
                    this.notesToPlay[index - 1] = note;
                    this.clearTurtles();
               	    this.synth.triggerAttackRelease(note, 1/this.timeSignDenominator);
					Tone.Transport.start();

                    for(var i=0; i<this.notesToPlay.length; i++)
                    	turtles.add(null, null, this.notesToPlay[i]);              
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
            console.log('notes to be played ' + this.notesToPlay);

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

    }
		
}