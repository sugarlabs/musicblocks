Using Music Blocks
==================

Music Blocks is a fork of Turtle Blocks. It has extensions for
exploring music: pitch and rhythm.

Music Blocks is designed to run in a browser. Most of the development
has been done in Chrome, but it should also work in Safari. It may or
may not run in Firefox -- you may find that turning off hardware
acceleration in the **advanced settings** improves experience -- and
it will not run in Internet Explorer at all. You can run it directly
from index.html, from [GitHub]
(http://walterbender.github.io/musicblocks), or from the [github
repo](http://rawgit.com/walterbender/musicblocks/master/index.html).

<img
src='https://rawgithub.com/walterbender/musicblocks/master/documentation/chords.png'</img>

Once you've launched Music Blocks in your browser, start by clicking
on the "Graphical-notation Matrix" block which appears on the screen
of a new session by default. A matrix of pitch (vertical by rows) over
time (horizontal by columns) will appear. Time is divided into
columns, each representing a single note value (length of note), e.g.,
three quarter notes. Click on the boxes in the grid to select specific
pitch(es) with associated note value(s) at a particular place in time
space. (Note that you can play simultaneous notes as chords by
selecting multiple pitches within a single column, or note value.)

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/play-button.svg'
height="36"</img> You can playback the notes in the Graphical-notation
Matrix by clicking on the Play button.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/download.svg'
height="36"</img> Use the Save button to create a stack of blocks that
will recreate the "chunk of notes" you've created in your working
Graphical-notation Matrix. This new stack, labeled as "chunk" by
default, is now a script of actions under control of your program. You
may now manipulate the notes within the chunk clamp much in the same
ways you would for Turtle Blocks software -- you may also integrate
blocks native to Turtle Blocks.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/erase-button.svg'
height="36"</img> You can erase the matrix by clicking on the Erase
button.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/close-button.svg'
height="36"</img> Close the matrix by clicking on the Close button.

To write programs, click on (or drag) blocks from their respective
palettes. Use multiple blocks in stack(s) to create music and
drawings; as the turtle moves under your control, colorful lines are
drawn and plays music of your own creation.

(Note that you can have multiple turtles and that a turtle is
equivalent to a "voice" in music. It can play notes of various pitches
in sequence, and can even play multiple notes of the same "note
value", but no one turtle can do counterpoint by themselves--just like
one turtle cannot draw two lines at the same time. If you want
counterpoint, pull out an additional Start block, which will create a
new turtle that can now perform a new voice.)

Add blocks to your program by clicking on or dragging them from the
palette to the main area. You can delete a block by dragging it back
into the trash area that appear at the bottom of the screen. Click
anywhere on a "stack" of blocks to start executing that stack or by
clicking on the Rabbit button (fast) or Turtle button (slow) on the
Main toolbar.  A third mode, clicking on the Snail button, will step
through your program one block per click. In order to facilitate
debugging your music, a fourth mode, the Turtle button marked with the
eighth note, will play your program at full speed but the music itself
slowly.

To maximize screen real estate, Music Blocks overlays the program
elements (stacks of blocks) on top of the canvas. These blocks can be
hidden at any time will running the program.

Toolbars
--------

There are three toolbars: (1) the Main toolbar across the top of the
screen; (2) the Secondary toolbar on the right side of the screen; and
(3) the Palette toolbar on the right side of the screen. An additional
menu appears when a "long press" is applied to a stack of
blocks. There is also a utility panel with additional controls.

These toolbars are described in detail in the [Turtle Blocks
documentation
pages](http://github.com/walterbender/turtleblocksjs/tree/master/documentation).

Block Palettes
--------------

The block palettes are displayed on the left side of the screen. The
palette button on the Main toolbar show and hide the block
palettes. These palettes contain the blocks used to create
programs. See the [Turtle Blocks Programming Guide]
(http://github.com/walterbender/turtleblocksjs/tree/master/guide) for
general details on how to use the blocks. See the [Music Blocks
Programming
Guide](http://github.com/walterbender/musicblocks/tree/master/guide)
for details specific to music.

All of the other palettes are described in the [Turtle Blocks
documentation
pages](http://github.com/walterbender/turtleblocksjs/tree/master/documentation).

Graphical-notation Matrix Palette
---------------------------------

The blocks on this palette are used to create a graphical notation
matrix of "pitch" and "note value". The matrix is a convenient and
intuitive way for generating short musical gestures, which can be
regenerated as a "chunks of notes" that can be played back
programmatically. Musicians may find it helpful to think of the
pitches within the graphical-notation matrix as being akin to a
bellset which notes may be added and removed as desired. The "note
value" representation acts as a kind of "rhythmic tablature" that
should be readable by both those familiar with the concepts of rhythm
in music and those unfamiliar but familiar with math.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/matrix.svg'</img>

*Graphical-notation Matrix* blocks clamp is used to define the matrix:
A row in the matrix is created for each Pitch block and columns are
created for individual notes, which are created by using Rhythm
blocks, individual note blocks, or the Tuplet block.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/pitch.svg'</img>

The *Pitch* block is used to specify the pitch of a note. By default,
we use traditional western Solfege, i.e., do, re, mi, fa, sol, la, ti,
where do is mapped to C, re is mapped to D, etc. You can also specify
pitch by using a note name, e.g., F#. An octave specification is also
required (as an argument for our pitch block) and changes integers
every cycle of "C" (i.e. C4 is higher than B3). When used with the
*Graphical-notation Matrix* block, a row is created for each Pitch
block.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/solfege.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/pitchname.svg'</img>

Two special blocks can be used with a *Pitch* block to specify the name
of the pitch: the *Solfege* block and the *Pitch-Name* block. The *Solfege*
block uses selectors to scroll through Do, Re, Mi, Fa, Sol, La, and
Ti. A second selector is used for sharps and flats: ##, #, ♮, ♭ and
♭♭. The *Pitch-Name* block is similar in that it lets you scroll through
C, D, E, F, G, A, B. It also uses a second selector for sharps and
flats.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/rhythm.svg'</img>

The *Rhythm* block is used to specify a series of notes of the same
duration (e.g., three quarter notes or seven eighth notes). The number
of notes is the top argument; the bottom argument is the inverse of
the note duration, e.g., 1 for a whole note, 2 for a half note, 4 for
a quarter note, etc. (Recall that in traditional western notation all
note values are (1) in powers of two, and are (2) in relation to the
"whole note", which is in turn (3) defined by tempo, or beats --
usually quarter notes -- per minute) Each note is represented by a
column in the matrix.

Special ratios of the whole note can be created very easily with the
*Rhythm* block by choosing an integer other than the traditional
"powers of two" that standard western music notation affords us. For
example, putting a "5" into the argument for "note value" will create
a note value equal to "one fifth the durational length of a whole
note". This gives the user endless rhythmic possibilities.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/wholenote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/halfnote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/quarternote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/eighthnote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/sixteenthnote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/thirtysecondnote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/sixtyfourthnote.svg'</img>

As a convenience, blocks for the most common note values are also
provided (whole note through 64th note). They also create columns in
the matrix. If you would like multiple note values in a row, simply
use the *Repeat* block clamp or *Duplicate* block clamp.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/tuplet.svg'</img>

The *Tuplet* block clamp is how we create rhythms that do not fit into
a simple "power of two" rhythmic space. A tuplet, mathematically, is a
collection of notes that are scaled to map into a specified
duration. For example, if you would like to script/perform three
unique notes into the duration of a single quarter note you would use
the tuplet block. The *Tuplet* block is able to calculate how many
notes you have inserted into the clamp and will generate the tuplet
accordingly (e.g. if you put three notes in, it will generate a
"triplet". We have designed the tuplet block to allow for any input of
note value, so the triplet can be three quarter notes, three eighth
notes, etc. This design choice allows for maximum flexibility) You can
mix and match *Rhythm* and individual *Note* blocks within a *Tuplet*
block to generate complex rhythms (e.g. two quarter notes plus an
eighth note is possible within the tuplet). Each note is represented
by a column in the matrix.

Note Palette
------------

The Note Palette contains blocks used to play music. Stacks of notes
can be created from the matrix, by clicking on the /Save Button/, or by
direct construction using the *Pitch* block and the blocks on this
palette. In addition to creating notes, you can transform the notes
using blocks such as *Sharp* and *Flat* or *Transposition*.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/note.svg'</img>

The *Note* block clamp is used to define individual notes by
specifying a note value, e.g., whole note (1), half note (2), quarter
note (4), etc. and a collection of pitch blocks to define individual
tones or chords.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/currentpitchname.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/currentpitchoctave.svg'</img>

The *Current-pitch-name* and *Current-pitch-octave* blocks maintain the
state of the note currently being played. (When the note is a chord,
only one of the pitch/octave combinations is available.)

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/flat.svg'</img>

The *Flat* block clamp to lower any contained notes by one step in a
12-step scale (pitch space). The *Flat* block can be nestled inside
other *Flat* blocks to lower a pitch or collection of contained
pitches even further.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/sharp.svg'</img>

The *Sharp* block clamp is used to raise any contained notes by one
step in a 12-step scale (pitch space). The *Sharp* block can be
nestled inside other *Sharp* blocks to raise a pitch or collection of
contained pitches even further.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/adjust-transposition.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/transposition.svg'</img>

The *Adjust Transposition* blocks are used to transpose any contained
notes by an integral step in a 12-step scale (pitch space). The
Transposition block contains the current transposition (the default is
0).

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/multiply-beat.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/divide-beat.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/beat-factor.svg'</img>

The *Multiply/Divide Beat Factor* blocks are used to adjust the beat
of any contained notes. Multiplying the beat will speed things up;
dividing the beat will slow things down. The Beat-factor block
contains the current beat factor (the default is 1).

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/dot.svg'</img>

The *Dot* clamp is used to dot any contained notes. A dotted note
plays for 150% the length of the original note, e.g., a dotted quarter
note is equivalent to a 3/8 note. Double-dotting is not yet
supported. (When used with the Tuplet block, the duration of the
tuplet is extended by 50%.)

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/duplicate-notes.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/duplicate-factor.svg'</img>

The *Duplicate Notes* block is used to repeat any contained
notes. Similar to using a *Repeat* block, but rather than repeating a
sequence of notes multiple times, each note is repeated in turn,
e.g. duplicate x2 of 4 4 8 would result in 4 4 4 4 8 8, where as
repeat x2 of 4 4 8 would result in 4 4 8 4 4 8.

Tone Palette
------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/putting-it-all-together.png'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/setbpm.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/bpm.svg'</img>

The *Set Beats per Minute* block is used to set the beats per minute (in our case, the number of quarter notes per minute).

The *Beats per Minute* block contains the current beats per minutes, which is by default, 90.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/setkey.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/key.svg'</img>

The *Set Key* block is used to set the key for the mapping between the
Solfage and notes using a "movable" system (See
[Solfage](https://en.wikipedia.org/wiki/Solf%C3%A8ge) for more
details).

The *Key* block contains the current Key, by default, C Major.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/osctime.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/sine.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/square.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/triangle.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/sawtooth.svg'</img>

The *OscTime* block lets you specify note duration in milliseconds. It can be used with *Pitch* blocks or one of several built-in synthesizers, e.g., *Sine*, *Square*, *Triangle*, and *Sawtooth* Blocks. These blocks take as their input frequency (in Hertz).

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/lilypond.svg'</img>

The *Save as Lilypond* block saves your composition as a .ly file in your Downloads directory. The .ly file can be used to generate sheet music using [Lilypond](http://www.lilypond.org/).

Blocks Palette
--------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/drum.svg'</img>

Multiple *Start* blocks can be used for multiple voices. Use the
"Rabbit button" on the Main toolbar to run all of the *Start* block
clamps simultaneously. A *Drum* block clamp is provided to create drum
beats (using a separate synthesizer specifically for drum sounds).

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/chunk.svg'</img>

"Chunk" (*Action*) block clamps also found on this palette (at the
bottom). Use them to run the Action stacks created from the Matrix.
