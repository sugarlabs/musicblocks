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

//All about notation generation

/*
keyword	values
notation	true/false
tablature	true/false
clef	treble, alto, tenor, bass, percussion
key	C, Am, F, Dm, Bb, Gm, Eb, Cm, Ab, Fm, Db, Bbm, Gb, Ebm, Cb, Abm, G, Em, D, Bm, A, F#m, E, C#m, B, G#m, F#, D#m, C#, A#m
time	C, C|, #/#
tuning	standard, dropd, eb, E/5,B/4,G/4,D/4,A/3,E/3

|    Bar
=||  Double Bar 
=|:  Repeat Begin 
=:|  Repeat End 
=::  Double Repeat 
=|=  End Bar 

Use parens for multiple pitches in a note.
d for dot
*/

// tabstave notation=true key=C time=4/4 tablature=false
// notes C/4 D/4 E/4 F#/5 | G/4 A/4 B/4 F#/5
// @ for flats

function MusicNotation(turtles, stage) {
    this.notationIndex = 0;
    this.musicContainer = null;

    this.convertCanvasToImage = function(canvas) {
        var image = new Image();
        image.src = canvas.toDataURL("image/png");
        return image;
    }

    this.doNotation = function(notes, timeSignNumerator, timeSignDenominator) {
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

        // We treat each call to donotation as a single measure.
        console.log(notes);
        for (i = 0; i < notes.length; i++) {
            // Each entry in notes is an array of notes and durations.
            // [[C4, 8], [E4, 8]]...
            console.log('note ' + i + ' has ' + notes[i].length + ' components');
            console.log(notes[i]);
            var noteArray = []
            for (j = 0; j < notes[i].length; j++) {
                console.log(notes[i][j]);
                var octave = notes[i][j][0].substr(-1);
                var pitch = notes[i][j][0].substr(0, notes[i][j][0].length - 1);
                console.log(j + ': ' + pitch + '/' + octave);
                noteArray.push(pitch.toLowerCase() + '/' + octave);
            }
            console.log(noteArray);

            if(noteArray[0].substr(-1) == 'R')
            {
                vexNotes.push(new Vex.Flow.StaveNote({ keys: ['g/4'], duration: notes[i][0][1].toString()+'r' }));
            } else {
                console.log(notes[i][0][1]);
                var tmp = new Vex.Flow.StaveNote({ keys: noteArray, duration: notes[i][0][1].toString() });
                // Add sharps and flats here
                // tmp.addAccidental(0, new Vex.Flow.Accidental("#"));
                vexNotes.push(tmp);
            }
        }

        var voice = new Vex.Flow.Voice({ num_beats: 4, beat_value: 4, resolution: Vex.Flow.RESOLUTION });
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
