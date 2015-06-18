function MusicNotation(turtles, stage)
{
	this.notationIndex = 0;
	this.musicContainer = null;

	
	this.convertCanvasToImage = function(canvas) {
		var image = new Image();
		image.src = canvas.toDataURL("image/png");
		return image;
	}


	this.doNotation = function(timeSignNumerator, timeSignDenominator, octave)
	{
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
				
		   		notes.push(new Vex.Flow.StaveNote({ keys: [note + '/' + octave], duration: "4" }));
	  		}
	    }

	    var voice = new Vex.Flow.Voice({
	    num_beats: timeSignNumerator,
	    beat_value: timeSignDenominator,
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
		
		var notationCanvas = document.getElementById('music1');

		//adding notation canvas canvas together 
		//so that they can be downloaded by converting canvas to image.
		var can = document.getElementById('canvasToSave');
		var ctx = can.getContext('2d');
		ctx.drawImage(notationCanvas, 0, 100*(this.notationIndex));

		//converting notatoin canvas to image and appending them to div, 
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

		/*bitmap.on('mousedown', function(event) {
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
		});*/
	}




}