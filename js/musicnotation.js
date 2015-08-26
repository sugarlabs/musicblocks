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

//All about notation generation

function MusicNotation(turtles, stage)
{
	this.notationIndex = 0;
	this.musicContainer = null;

	
	this.convertCanvasToImage = function(canvas) {
		var image = new Image();
		image.src = canvas.toDataURL("image/png");
		return image;
	}


	this.doNotation = function(notes, timeSignNumerator, timeSignDenominator)
	{
		if (this.musicContainer == null) {
			this.musicContainer = new createjs.Container();
			this.musicContainer.name = 'musicNotation';
		}
		stage.addChild(this.musicContainer);
		
	    var canvas = document.getElementById("music");
	    var context = canvas.getContext("2d");
	    context.clearRect(0, 0, canvas.width, canvas.height);
	    var renderer = new Vex.Flow.Renderer(canvas,
	    Vex.Flow.Renderer.Backends.CANVAS);
	    
	    var ctx = renderer.getContext();
	    var stave = new Vex.Flow.Stave(10, 0, 1000);
	    stave.addClef("treble");
	    stave.addTimeSignature(timeSignNumerator + "/" + timeSignDenominator);
	    stave.setContext(ctx).draw();

	    //Create the notes
	    var vexNotes = [];
	 	var notesToNotation = [];
	 	for(i in notes)
		{	
				var note = [];
		    	var octave = notes[i][0][0].substring(1, 2);
				var noteArr = notes[i][0]	
		    	for(j in noteArr)
		    	{	
		    		var toPush = noteArr[j].substring(0, 1) + '/' + octave;	
		    		note.push(toPush.toString());
		    	}
		    	notesToNotation.push(note)
		    	console.log("note "+JSON.stringify(notesToNotation) + " note[0] "+note)
		    	if(note == 'R')
		    	{
		    		vexNotes.push(new Vex.Flow.StaveNote({ keys: ['g/' + octave], duration: notes[i][1].toString()+'r' }));	
		    	}
		    	else{
		   		vexNotes.push(new Vex.Flow.StaveNote({ keys: note, duration: notes[i][1].toString() }));
	  			}
	    }

	    var voice = new Vex.Flow.Voice({
	    num_beats: 4,
	    beat_value: 4,
	    resolution: Vex.Flow.RESOLUTION
	    });
	    // turn off tick counter
    voice.setStrict(false)

    // Add notes to voice
    voice.addTickables(vexNotes);

    // Format and justify the notes to 700 pixels
    var formatter = new Vex.Flow.Formatter().
    joinVoices([voice]).format([voice], 700);
    //ToDo : Add bar line to the notations <==How would this be done? Also, how do we get notes to "roll-over" into the next measure?

    // Render voice
    voice.draw(ctx, stave);
		var notationCanvas = document.getElementById('music');

		//adding notation canvas canvas together 
		//so that they can be downloaded by converting canvas to image.
		var can = document.getElementById('canvasToSave');
		var ctx = can.getContext('2d');
		ctx.drawImage(notationCanvas, 0, 100*(this.notationIndex));

		//converting notation canvas to image and appending them to div, 
		//to get scrollable functionality
		var img = this.convertCanvasToImage(canvas);
		var bitmap = new createjs.Bitmap(img);
		bitmap.x = 1150;
		bitmap.y = 70*(1 + this.notationIndex);
		bitmap.visible = false;	
		var notdiv = document.getElementById('musicNotation');
		var base64Notation = canvas.toDataURL();
		notdiv.innerHTML +=  "<img width=100% src=" + base64Notation + ">";

		document.getElementById('musicNotation').style.display = 'block';
		
		bitmap.name = 'notation' + this.notationIndex;
		this.musicContainer.addChild(bitmap);

		this.notationIndex += 1;

	}
}
