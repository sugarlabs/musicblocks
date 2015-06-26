
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
	this.oldNotes = [];
	//this.savedMatricesNotes = windosavedMatricesNotes;

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

		this.notesToPlay = [];
		this.i = 0;


	}
	
	this.initMatrix = function(timeSign, octave)
	{
		console.log('time signature '+timeSign +' and octave '+octave);

		this.clearTurtles();
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
		var solfege = ['Do','Re','Mi','Fa','Sol','La','Si'];

		var x = document.createElement("TABLE");
		x.setAttribute("id", "myTable");
		x.style.textAlign = 'center';
		//x.setAttribute("border", "1px solid #fff");
		var w = window.innerWidth;
		x.setAttribute("width", w/2+"px");
		document.body.appendChild(x);
		var table = document.getElementById("myTable");
		var header = table.createTHead();
	    var row = header.insertRow(0);
    	var cell = row.insertCell(-1);
    	cell.innerHTML = '<b>' + 'Solfa' + '</b>';
    	cell.style.height = "40px";
    	cell.style.backgroundColor = '#9ACD32';
    	cell.style.width = "30%";

    	for(var i=0; i<solfege.length; i++)
    	{
    		var row = header.insertRow(i+1);
    		row.id = 'row' + i+1;
    		var cell = row.insertCell(0);
    		cell.style.backgroundColor = '#9ACD32';
    		cell.innerHTML = solfege[solfege.length-1-i];
    		cell.style.height = "30px";
    	}
    	var row = header.insertRow(8);
    	var cell = row.insertCell(0);
    	cell.innerHTML = '<b>'+'Time'+'</b>';
    	cell.style.height = "40px";
    	cell.style.backgroundColor = '#9ACD32';
    	
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
		    	cell.width = 60;
		    	
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
				        	
				        /*	cell.onmouseover = function(){
				        		this.style.backgroundColor = '#9ACD32';
				        	};
				        	cell.onmouseout = function(){
				        		this.style.backgroundColor = '#ADFF2F';
				        	}*/
				        	cell.onclick=function(){
				        		//this.onmouseout=null;
				        		if(this.style.backgroundColor == 'black')
				        		{
				        			this.style.backgroundColor = '#ADFF2F';
				        			that.chkArray[this.id] = 0;
				        		}
				        		else if(that.chkArray[this.id] == 0)
				        		{

				        			this.style.backgroundColor = 'black';
									that.chkArray[this.id] = 1;		        			
				        		}

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

	this.doTransposition = function(note){
		if(this.transposition != null)
		{
			if(this.transposition[0] == '-')
			{
				var factor = this.transposition;
				factor = factor.slice(0,0) + factor.slice(1,factor.length);
				factor = parseInt(factor);
				console.log('factor '+factor);
				var index = this.notes.indexOf(note);
				if(index == 0)
					index = this.notes.length - factor % this.notes.length;
				else
					{
						index = index - ( factor % this.notes.length );
						if(index < 0)
							index = this.notes.length +	 index;
					}
				return this.notes[index];
			}
			else if(this.transposition[0] == '+')
			{
				var factor = this.transposition;
				var index = this.notes.indexOf(note);
				if(index == this.notes.length - 1)
					index = factor % this.notes.length;
				else
					index += factor % this.notes.length;
				index = index % this.notes.length;
				return this.notes[index];

			}
		}
	}

	this.playNote = function(note){
		var duration = this.timeSignDenominator + "n"
		synth = new Tone.MonoSynth();
		synth.toMaster();
        synth.triggerAttackRelease(note, duration);
        Tone.Transport.start();
	};

	this.myLoop = function () {       
		var that = this;

		setTimeout(function () {    
		    that.playNote(that.notesToPlay[that.i]); 
		    that.i++;                     
		    if (that.i < that.notesToPlay.length) {            
		       that.myLoop();              
		   	}       	                 
		    }, this.freetime);
		}

	
		this.musicNotation = function(){
		
			musicnotation.doNotation(this.timeSignNumerator, this.timeSignDenominator, this.octave);
		}


	this.playMatrix = function(time){
		
		if(arguments[1])
		{
			this.oldNotes = arguments[1];
		}
		var that = this;

		setTimeout(function() {
		var table = document.getElementById("myTable");
		if(that.oldNotes.length >0 )
			{
				that.notesToPlay = that.oldNotes;
//				console.log('old nottes '+that.oldNotes);
			}
		if (table != null && that.notesToPlay.length == 0) {
			that.clearTurtles();
		    for (var i = 0; i < table.rows[1].cells.length; i++) {
        		for (var j = 1; j < table.rows.length; j++)
        		{
        			cell = table.rows[j].cells[i];
        			var note;
        			if(cell.style.backgroundColor == 'black')
        			{
        				var solfege = table.rows[j].cells[0].innerHTML;
        				if(solfege == 'Do')
        				{
        					note = 'C' + that.octave;
        				}
        				else if(solfege == 'Re')
        				{
        					note = 'D' + that.octave;
        				}
        				else if(solfege == 'Mi')
        				{
        					note = 'E' + that.octave;
        				}
        				else if(solfege == 'Fa')
        				{
        					note = 'F' + that.octave;
        				}
        				else if(solfege == 'Sol')
        				{
        					note = 'G' + that.octave;
        				}
        				else if(solfege == 'La')
        				{
        					note = 'A' + that.octave;        				}
        				else if(solfege == 'Si')
        				{
        					note = 'B' + that.octave;
        				}
        				that.notesToPlay.push(note);
        				turtles.add(null, null, note);				
        				//console.log('turtles '+turtles.turtleList[1].name);
					}
        		}
        	}
        }
	 
	if(that.notesToPlay.length > 0)
	{
	//	console.log("old "+that.oldNotes);
		if(that.oldNotes.length > 0)
		{
			that.clearTurtles();
			for(var i=0; i<that.oldNotes.length; i++)
				turtles.add(null, null, that.oldNotes[i]);
			that.notesToPlay = that.oldNotes;
    	}
    	if( that.transposition != null )
	    {
	    	var transposedArray = [];
	    	for(var i = 0; i < that.notesToPlay.length; i++)
	    	{
	    		var transposedNote = that.doTransposition(that.notesToPlay[i][0]);
	    		transposedNote += that.octave;
	    		transposedArray.push(transposedNote);
	    	}
	    	
	    	console.log('original notes ' + that.notesToPlay);
	    	that.notesToPlay = transposedArray;
	    	console.log('transposed notes to be played ' + that.notesToPlay);
	    }
	    else
	    	console.log('notes to be played ' + that.notesToPlay);

	    that.myLoop();
	}
    		},time);
	that.notesToPlay = [];
	that.oldNotes = [];
			
    }

    this.saveMatrix = function(){
    	console.log("timeSignDenominator "+this.timeSignDenominator);
    	for(var i=0; i<this.notesToPlay.length; i++)
    	{
    		window.savedMatricesNotes.push(this.notesToPlay[i]);
    	}
    	window.savedMatricesNotes.push('end');
    	window.savedMatricesCount += 1;

    }

    
		
}