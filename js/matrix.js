
function Matrix(Mcanvas, stage, turtles, trashcan)
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

	this.musicContainer = null;
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
		//x.setAttribute("border", "1px solid #fff");
		x.setAttribute("width", "600px");
		document.body.appendChild(x);
		var table = document.getElementById("myTable");
		var header = table.createTHead();
	    var row = header.insertRow(0);
    	var cell = row.insertCell(-1);
    	cell.innerHTML = '<b>' + 'Solfa' + '</b>';
    	cell.style.backgroundColor = '#9ACD32';
    	for(var i=0; i<solfege.length; i++)
    	{
    		var row = header.insertRow(i+1);
    		row.id = 'row' + i+1;
    		var cell = row.insertCell(0);
    		cell.style.backgroundColor = '#9ACD32';
    		cell.innerHTML = solfege[solfege.length-1-i];
    	}
    	var row = header.insertRow(8);
    	var cell = row.insertCell(0);
    	cell.innerHTML = '<b>'+'Time'+'</b>';
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


 		this.chkArray = new Array(this.timeSignDenominator);
 		for(var i=0; i<=this.timeSignDenominator; i++)
 			this.chkArray[i] = 0;
	    for(var j=0; j<this.timeSignDenominator; j++)
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
		    }, 1000)
		}

	
	this.convertCanvasToImage = function(canvas) {
		var image = new Image();
		image.src = canvas.toDataURL("image/png");
		return image;
	}

	this.musicNotation = function(){

		if (this.musicContainer == null) {
			this.musicContainer = new createjs.Container();
			this.musicContainer.name = 'musicNotation';
		}
		stage.addChild(this.musicContainer);
		
	    var canvas = document.getElementById("music1");
	    var context = canvas.getContext("2d");
	    context.clearRect(0, 0, canvas.width, canvas.height);
	    var renderer = new Vex.Flow.Renderer(canvas,
	    Vex.Flow.Renderer.Backends.CANVAS);
	    
	    var ctx = renderer.getContext();
	    var stave = new Vex.Flow.Stave(10, 0, 500);
	    stave.addClef("treble").setContext(ctx).draw();

	    //Create the notes
	    var notes = [];

	 	for(var i = 0; i < turtles.turtleList.length; i++)
		{
		    if(turtles.turtleList[i].name.includes('note'))
		    {
				var note = turtles.turtleList[i].name.substring(0, 1);
				
		   		notes.push(new Vex.Flow.StaveNote({ keys: [note + '/' + this.octave], duration: "4" }));
	  		}
	    }

	    var voice = new Vex.Flow.Voice({
	    num_beats: this.timeSignNumerator,
	    beat_value: this.timeSignDenominator,
	    resolution: Vex.Flow.RESOLUTION
	    });
	    console.log('notes '+notes);
	    // Add notes to voice
	    voice.addTickables(notes);

	    // Format and justify the notes to 500 pixels
	    var formatter = new Vex.Flow.Formatter().
	    joinVoices([voice]).format([voice], 500);
	    // Render voice
		voice.draw(ctx, stave);

		var img = this.convertCanvasToImage(canvas);
		var bitmap = new createjs.Bitmap(img);
		bitmap.x = 1150;
		bitmap.y = 70*(1 + this.notationIndex);
		
		bitmap.name = 'notation' + this.notationIndex;
		this.musicContainer.addChild(bitmap);

		this.notationIndex += 1;

		bitmap.on('mousedown', function(event) {
			trashcan.show();
			var offset = {
			x: bitmap.x - Math.round(event.stageX ),
			y: bitmap.y - Math.round(event.stageY )

			};

			bitmap.on('pressup', function(event) {
		    if (trashcan.overTrashcan(event.stageX , event.stageY )) {
		        bitmap.visible = false;
		    }
		    trashcan.hide();
			});

			bitmap.on('mouseout', function(event) {
			   	if (trashcan.overTrashcan(event.stageX , event.stageY )) {
			        bitmap.visible = false;
			    }
			    trashcan.hide();
			});

			bitmap.on('pressmove', function(event) {
			    var oldX = bitmap.x;
			    var oldY = bitmap.y;
			    bitmap.x = event.stageX + offset.x;//Math.round(event.stageX / palette.palettes.scale) + offset.x;
			    bitmap.y = event.stageY + offset.y;//Math.round(event.stageY / palette.palettes.scale) + offset.y;
			   
			    // If we are over the trash, warn the user.
			    if (trashcan.overTrashcan(event.stageX , event.stageY )) {
			        trashcan.highlight();
			    } else {
			        trashcan.unhighlight();
			    }

			});
		});
    }

	this.playMatrix = function(time){
		var that = this;
		setTimeout(function() {
		that.clearTurtles();
		var table = document.getElementById("myTable");
		if (table != null) {
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
			
    }
    
		
}