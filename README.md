# MUSIC-BLOCKS

Music Blocks a collection of manipulative tools for exploring fundamental musical concepts in an integrative and fun way. \

## INTENDED WORKFLOW

1) Users design a matrix using the matrix clamp which will become their 2-D workspace for making simple musical patterns (pitch over time). Users can use "play matrix" block to try their matrix before saving it for the next step.
2) Users then save the working matrix as a "chunk" that they can run operations on (play forwards and backwards, repeat, rhythmic augmentation/diminution (multiply and divide block as of 2015-08-24).
3) In future versions of this software, users should be able to commit complex strings of chunks and other blocks to musical notation and performance with various parameters. It should also be integratable with other TurtleJS (upstream) functions.
4) Students have the freedom to, and should be encouraged to, study and modify the source code for an enriching and empowering interdisciplinary experience.

### USING MUSIC-BLOCKS
Music Blocks is designed to run in a browser. It is derived from Turtle Blocks JS which can be found [here](https://github.com/walterbender/turtleblocksjs). You can run it directly from index.html, from the [github](rawgit.com/khandelwalYash/Music-Blocks/master/index.html) repo, or by setting up a local server.

[Note that all of these links were originally authored into this README on 2015-08-24.]

Once you've launched it in your browser, start by clicking on (or dragging) blocks from the Matrix palette. Use multiple blocks to create Music.

You can add blocks to your program by clicking on or dragging them from the palette to the main area. You can delete a block by dragging it onto the trash can. Click anywhere on a "stack" of blocks to start executing that stack.
![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/screenshot.png)

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/sharp.png)
Makes the pitch sharp/flat

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/play.png)
Playing the matrix/chunk 

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/savematrix.png) 
Saves the Matrix as a chunk 

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/transposition.png) 
Transposes all the notes of the matrix by the input number of semi-tones. 

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/note.png) 
Plays the note. Eg: plays eigth 'sol' note of 4th octave. 

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/show.png)
Displays the corresponding chunk's matrix, which can be edited and saved again as another chunk.

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/tuplet.png)
Adds tuplet functionality to the matrix.
- [How tuplet works](https://drive.google.com/open?id=0B-AbWxHmrKNLRUtnMmhpWFFxT28)


![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/forevernrepeat.png)

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/sequentialChunk.png)
Playing around with Chunks

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/multdiv.png)
Multiplies/divides all the beat values of notes inside the chunk

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/transpose.png)
Transposes all the notes of the input chunk

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/notation.png)
Makes music notations of the corresponding chunk according to the input 'meter'.

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/download-button.svg)
Downloads the notations as png image.

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/play-button.svg)
Plays the start block, like whatever is there inside the start block gets played!

![alt tag](https://rawgithub.com/khandelwalyash/Music-Blocks/master/documentation/square.png)
Plays square wave of particular frequency. Similarly 'sine' and 'sawtooth' block (time in ms)

##### Music-Blocks -> [Blog](https://sugarizingmusic.wordpress.com/)