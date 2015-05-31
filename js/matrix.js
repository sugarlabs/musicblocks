
function Matrix(timeSign, octave)
{
	this.tsDen = 4;
	this.tempo = 60;
	this.frequency = 500;
	this.secondsPerBeat = 1;
	this.notes = [];
	this.i = 0;
	this.chkArray = null;
	this.j = 0;
	console.log('time signature '+timeSign +' and octave'+octave);
	this.initMatrix = function()
	{
		this.notes = [];
	
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
		x.setAttribute("border", "1px");
		x.setAttribute("width", "600px");
		document.body.appendChild(x);
		var table = document.getElementById("myTable");
//		table.style.border = "1px solid #000";
	//	table.style.width = 600;
		var header = table.createTHead();
	    var row = header.insertRow(0);
    	var cell = row.insertCell(0);
    	cell.innerHTML = 'Solfa';
    	for(var i=0; i<solfege.length; i++)
    	{
    		var row = header.insertRow(i+1);
    		row.id = 'row' + i+1;
    		var cell = row.insertCell(0);
    		cell.innerHTML = solfege[solfege.length-1-i];
    	}
    	var row = header.insertRow(8);
    	var cell = row.insertCell(0);
    	cell.innerHTML = '<b>'+'Time'+'</b>';


	    var flag=0, ts=0;
	    for(var i=0; i<timeSign.length; i++)
	    {
	    	if(flag)
	    	{	
	    		ts += parseInt(timeSign[i]);
	    		ts *= 10;

	    	}
	    	if(timeSign[i] == '/')
	    	{
	    		flag=1;
	    	}
	    	
	    }

	    this.tsDen = ts/10;


  	/*	for (var i = 0; i < 7; i++) {
    		this.chkArray[i] = new Array(this.tsDen);
 		}
 		for(var i=0; i<7; i++)
 		{
 			for(var j=0; j<this.tsDen; j++)
 			{
 				this.chkArray[i][j] = 0;
 			}
 		}*/
 		this.chkArray = new Array(this.tsDen);
 		for(var i=0; i<this.tsDen; i++)
 			this.chkArray[i] = 0;
	    //timeSig = 16;
	    for(var j=0; j<ts/10; j++)
	    {
		    for(var i=1; i<9; i++)
		    {
		    	var table = document.getElementById("myTable");
		    	var row = table.rows[i];
		    	var cell = row.insertCell(-1);
		    	cell.width = 60;
		    	
				
		    	if(i==8)
		    	{
		    		cell.innerHTML = j+1;
		    	}
		    }
		}
		flag = 1;
		var table = document.getElementById("myTable");
		var that = this;
				if (table != null) {
				    for (var i = 1; i < table.rows[1].cells.length; i++) {
				    		
				        for (var j = 1; j < table.rows.length - 1; j++)
				        {	
				    		var cell = table.rows[j].cells[i];
				    		var that = this;
				    		that.j = j;
				        	cell.onclick=function(){
				        		if(this.style.backgroundColor == 'black')
				        		{
				        			this.style.backgroundColor = null;	
				        			//that.chkArray[j-1] = 0;
				        		}
				        		else //if(that.chkArray[j-1] == 0)
				        		{

				        			this.style.backgroundColor = 'black';
									//that.chkArray[j-1] = 1;		        			
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

	this.playNote = function(note){

		var duration = this.tsDen + "n"
		synth = new Tone.MonoSynth();
		synth.toMaster();
        synth.triggerAttackRelease(note, duration);
        Tone.Transport.start();
	};

	this.myLoop = function () {       
		var that = this;    
		setTimeout(function () {    
		    that.playNote(that.notes[that.i]);          
		    that.i++;                     
		    if (that.i < that.notes.length) {            
		       that.myLoop();              
		   	}                        
		    }, 1000)
		}


	this.playMatrix = function(){
		
		var table = document.getElementById("myTable");
		if (table != null) {
		    for (var i = 1; i < table.rows[1].cells.length; i++) {
        		for (var j = 1; j < table.rows.length; j++)
        		{
        			cell = table.rows[j].cells[i];
        			var note;
        			if(cell.style.backgroundColor == 'black')
        			{
        				var solfege = table.rows[j].cells[0].innerHTML;
        				if(solfege == 'Do')
        				{
        					note = 'C' + octave;
        				}
        				else if(solfege == 'Re')
        				{
        					note = 'D' + octave;
        				}
        				else if(solfege == 'Mi')
        				{
        					note = 'E' + octave;
        				}
        				else if(solfege == 'Fa')
        				{
        					note = 'F' + octave;
        				}
        				else if(solfege == 'Sol')
        				{
        					note = 'G' + octave;
        				}
        				else if(solfege == 'La')
        				{
        					note = 'A' + octave;        				}
        				else if(solfege == 'Si')
        				{
        					note = 'B' + octave;
        				}
        				this.notes.push(note);
					}
        		}
        	}
    	}
		  
    	console.log('notes to be played ' + this.notes);
    	if(this.notes.length > 1)
    		this.myLoop();
	}
	
}