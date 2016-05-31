Guide to Programming with Music Blocks
======================================

Music Blocks is a programming environment for children interested in
music and graphics. It expands upon Turtle Blocks in that it has a
collection of features relating to pitch and rhythm.

The Turtle Blocks guide is a good place to start learning about the
basics. In this guide, we illustrate the music features walking the
reader through numerous examples.

Getting Started
---------------

Music Blocks is designed to run in a browser. Most of the development
has been done in Chrome, but it should also work in Firefox (although
you may need to disable hardware acceleration). You can run it from
[github io](http://walterbender.github.io/musicblocks) or by
downloading a copy of the code and running directly from the file
system of your computer.

For more details on how to use Music Blocks, see [Using Music
Blocks](http://github.com/walterbender/musicblocks/tree/master/documentation)
and for more details on how to use Turtle Blocks, see [Using Turtle
Blocks
JS](http://github.com/walterbender/turtleblocksjs/tree/master/documentation).

ABOUT THIS GUIDE
----------------

Many of the examples given in the guide have links to code you can
run. Look for RUN LIVE links.

NOTES
-----

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/note1.svg'</img>

At the heart of Music Blocks is the *Note value* block. The *Note
value* block is a container for a pitch that specifies the duration
(note value) of the pitch.

At the top of the example above, a single *Note value* block is
shown. The `4` is the note value, in this case, a quarter note. The
pitch, specified by the *Pitch* block, contains a pitch, `Re` at
`Octave 4`. At the bottom, two consecutive notes are shown.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/note2.svg'</img>

In this example, different note values are shown. From top to bottom,
`8` for an eighth note, `16` for a sixteenth note, and `2` for a half
note.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/note3.svg'</img>

In this example, different ways to specify the pitch are shown. From
top to bottom, `Sol` in `Octave 6`, `B flat` in `Octave 4`, and `440`
hertz (the octave is ignored when the frequency is assigned).

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/note4.svg'</img>

A chord (multiple, simultaneous pitches) can be specified by add
multiple *Pitch* blocks to a *Note value* container.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/silence.svg'</img>

A rest of duration note value can be constructed using a *Silence* block.

Using drums
-----------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/drum1.svg'</img>

Anywhere you can use a *Pitch* block--e.g., inside of the matrix or a
*Note value* block--you can also specify a drum sample. Currently there
about two dozen different samples from which to choose. The default
drum is a kick drum.


THE PITCH-TIME MATRIX
---------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix1.svg'</img>

Music Blocks provides a widget, the *Pitch-time Matrix*, as a scaffold
for getting started.

Once you've launched Music Blocks in your browser, start by clicking
on the *Pitch-time Matrix* stack that appears in the middle of the
screen. (For the moment, ignore the *Start* block.) You'll see a grid
organized vertically by pitch and horizontally by rhythm.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix2.svg'</img>

The matrix in the figure above has three *Pitch* blocks and one
*Rhythm* block, which is used to create a 3 x 3 grid of pitch and
time.

Note that the default matrix has five *Pitch* blocks, hence, you will
see five rows, one for each pitch. (A sixth row at the bottom is used
for specifying the rhythms associated with each note.) Also by
default, there are two *Rhythm* blocks, which specifies six quarter
notes followed by one half note. Since the *Rhythm* blocks are inside
of a *Repeat* block, there are fourteen (2 x 7) columns for selecting
notes.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix3.svg'</img>

By clicking on individual cells in the grid, you should hear
individual notes (or chords if you click on more than one cell in a
column). In the figure, three quarter notes are selected (black
cells). First `Re 4`, followed by `Mi 4`, followed by `Sol 4`.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/play-button.svg'
height="36"</img>

If you click on the *Play* button (found in the top row of the grid),
you will hear a sequence of notes played (from left to right): `Re 4`,
`Mi 4`, `Sol 4`.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/export-chunk.svg'
height="36"</img>

Once you have a group of notes (a "chunk") that you like, click on the
*Save* button (just to the right of the *Play* button). This will
create a stack of blocks that can used to play these same notes
programmatically. (More on that below.)

You can rearrange the selected notes in the grid and safe other chunks
as well.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/close-button.svg'
height="36"</img>

Or hide the matrix by clicking on the *Close* button (the right-most
button in the top row of the grid.)

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/erase-button.svg'
height="36"</img>

There is also an Erase button that will clear the grid.

Don't worry. You can reopen the matrix at anytime (it will remember
its previous state) and since you can define as many chunks as you
want, feel free to experiment.

Tip: You can put a chunk inside a *Pitch-time Matrix* block to generate
the matrix to corresponds to that chunk.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix4.svg'</img>

The chunk created when you click on the matrix is a stack of
blocks. The blocks are nested: an *Action* block contains three *Note value*
blocks, each of which contains a *Pitch* block. The *Action* block has a
name automatically generated by the matrix, in this case, chunk. (You
can rename the action by clicking on the name.). Each note has a
duration (in this case 4, which represents a quarter note). Try
putting different numbers in and see (hear) what happens. Each note
block also has a pitch block (if it were a chord, there would be
multiple *Pitch* blocks nested inside the Note block's clamp). Each
pitch block has a pitch name (`Re`, `Mi`, and `Sol`), and a pitch octave; in
this example, the octave is 4 for each pitch. (Try changing the pitch
names and the pitch octaves.)

To play the chuck, simply click on the action block (on the word
action). You should hear the notes play, ordered from top to bottom.

More regarding the Pitch Block
------------------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix5.svg'</img>

As we have seen, *Pitch* blocks are used inside the *Note value*
blocks and the *Pitch-time Matrix* block to indicate pitches you may
want to select or play.

You can plug different values into the *Pitch* block name and octave
slots. Some examples are shown above. Starting from the top, the pitch
name block is specified using a *Solfege* block; the pitch name is
specified using a *Pitch-name* block; the pitch name is specified using
a *Number* block (frequency in Hertz); the pitch name is specified using
a *Text* block.

The octave is specified using a number block and is restricted to
whole numbers. In the case where the pitch name is specified by
frequency, the octave is ignored.

About the Rhythm Block
----------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix6.svg'</img>

*Rhythm* blocks are used to generate rhythm patterns in the
*Pitch-time Matrix* block. The top argument to the *Rhythm* block
*is the number of notes. The bottom argument is the duration of the
*note. In the top example above, three columns for quarter notes
*would be generated in the matrix. In the middle example, one column
*for an eighth note would be generated. In the bottom example, seven
*columns for 16th notes would be generated.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix7.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix8.svg'</img>

You can use as many *Rhythm* blocks as you'd like inside the
*Pitch-time Matrix* block. In the above example, two *Rhythm*
blocks are used, resulting in three quarter notes and six eighth
notes.

Creating Tuplets
----------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix9.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix10.svg'</img>

Tuplets are a collection of notes that get scaled to a specific
duration. Using tuplets makes it easy to create groups of notes that
are not based on a power of 2. In the example above, three quarter
notes--defined in the *Rhythm* block--are played in the time of a
single quarter note. The result is three twelfth notes.

You can mix and match *Rhythm* blocks and *Tuplet* blocks when
defining your matrix.

Using individual notes in the matrix
------------------------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix11.svg'</img>

You can also use individual notes when defining the grid. These blocks
will expand into *Rhythm* blocks with corresponding values.

PROGRAMMING WITH MUSIC
----------------------

The remainder of this guide discusses how to use the chunks created by
the *Pitch-time Matrix* when programming (You can also program with
chunks you create and/or modify by hand).

1. A chunk of notes
--------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix4.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/chunk1.svg'</img>

Every time you create a new *Action* stack, Music Blocks creates a new
block specific to that stack. (The new block is found at the top of
the *Block* palette, found on the left edge of the screen.) Clicking
on this block is the same as clicking on your stack. By default, the
new blocks are named `chunk`, `chunk1`, `chunk2`... but you can rename
them by editing the labels on the *Action* blocks.

In the example above, the *Chunk* block is inside of a *Start* block,
which ties it to the *Run* button in the upper-left corner of the
screen (the "rabbit"). Try clicking on the *Run* button. Also try the
*Run Slow* button (the "turtle") and the *Step* button (the "snail"),
which steps through the program one block per button press. There are
also buttons for playing the music back slowly and for stepping one
note per button press.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/chunk2.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/chunk3.svg'</img>

You can repeat chunks either by using multiple *Chunk* blocks or using a
*Repeat* block.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/chunk4.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/chunk5.svg'</img>

You can also mix and match chunks. Here we play chunk, followed by
chunk1 twice, and then chunk again.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/chunk6.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/chunk7.svg'</img>

A few more chunks and we can make a song. (Can you read the block
notation in order to guess what song we've programmed?)

2. Transformations
------------------

There are many ways to transform pitch, rhythm, and other qualities of
the sound.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform0.svg'</img>

The *Step Pitch* block will move up or down notes in a scale from the
current note. In the example above, *Step Pitch* blocks are used inside
of *Repeat* blocks to play up and down a scale.

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_scales.tb&run=true)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform1.svg'</img>

The *Sharp* and *Flat* blocks can be wrapped around *Pitch*
blocks, *Note value* blocks, or chunks. A sharp will raise the pitch by
one half step. A flat will lower by one half step. In the example, on
the left, just the *Pitch* block `Mi` is lowered by one half step;
on the right, both pitch blocks are raised by one half step.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform2.svg'</img>

The *Adjust-transposition* block can be used to make larger shifts in
pitch. To shift an entire octave, transpose by 12 half-steps up. -12
will shift an octave down.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform3.svg'</img>

In the example above, we take the song we programmed previously and
raise it by one octave.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform4.svg'</img>

You can "dot" notes using the *Dot* block. A dotted note extends by
50%. E.g., a dotted quarter note will play for 3/8 (1/4 + 1/8) of a
beat. A dotted eighth note will play for 3/16 (1/8 + 1/16) of a beat.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform5.svg'</img>

You can also multiply (or divide) the beat value, which will speed up
or slowdown the notes.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform6.svg'</img>

There are several ways to repeat notes. The *Repeat* block will play a
sequence of notes multiple times; the *Duplicate* block will repeat each
note in a sequence.

In the example, on the left, the result would be `Sol, Re, Sol, Sol,
Re, Sol, Sol, Re, Sol, Sol, Re, Sol`; on the right the result would be
`Sol, Sol, Sol, Sol, Re, Re, Re, Re, Sol, Sol, Sol, Sol`.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform7.svg'</img>

The *Swing* block works on pairs of notes, adding some duration to the
first note and taking the same amount from the second note.

Tie also works on pairs of notes, combining them into one note. (The
notes must be identical in pitch, but can vary in rhythm.)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform8.svg'</img>

The *Set volume* block will change the volume of the notes. The
default is 50; the range is 0 (silence) to 100 (full volume).

The *Crescendo* block will increase (or decrease) the volume of the
contained notes by an amount specified.

The *Staccato* block will play back notes in tight bursts while
maintaining the specified rhymic value of the notes.

The *Slur* block will run a note past its noted duration, blending
it into the next note.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform9.svg'</img>

The *Interval* block calculates an interval, e.g., a fifth, and adds
the additional pitches to a note. In the figure, we add `Sol` to `Do` and
`Do` to `Fa`.

The *Articulation* block changes the volume of a group of notes.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/transform10.svg'</img>

The *Set Key* block will change the key and mode of the mapping
between solfege, e.g., `Do`, `Re`, `Mi`, to note names, e.g., `C`,
`D`, `E`, when in C Major. Modes include Major and Minor, Chromatic,
and a number of more exotic modes, such as Bebop, Geez, Maqam, et al.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/drum2.svg'</img>

The *Set Drum* block is used to convert the enclosed notes into drum
sounds. Drum sounds are played in a monopitch using the specified drum
sample. In the example above, two quaternotes of a kick drum will be
played.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/drum4.svg'</img>

In the above example, the sequence of drum beats is increased over time.

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_drumexample.tb&run=true)

3. Voices
---------

Each *Start* block runs as a separate voice in Music Blocks. (When
you click on the Run button, all of the *Start* blocks are run
concurrently.)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/voices1.svg'</img>

If we put our song into an action...

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/voices2.svg'</img>

...we can run it from multiple *Start* blocks.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/voices3.svg'</img>

It gets more interesting if we shift up and down octaves.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/voices4.svg'</img>

And even more interesting if we bring the various voices offset in time.

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_frerejacques.tb&run=true)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/drum3.svg'</img>

A special "drum" version of the *Start* block is available for laying
down a drum track. Any pitch blocks encounted while starting from a
drum will be played as `C2` with the default drum sample. In the
example above, all of the notes in `chunk` will be played with a kick
drum.

4. Adding graphics
------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/graphics1.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/graphics2.png'</img>

Turtle graphics can be combined with the music blocks. By placing
graphics blocks, e.g., *Forward* and *Right*, inside of *Note value*
blocks, the graphics stay in sync with the music. In this example, the
turtle moves forward each time a quarter note is played. It turns
right during the eighth note. The pitch is raised by one half step,
the pen size decreases, and the pen color increases at each step in
the inner repeat loop.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/graphics3.svg'</img>

In this example, the graphics are synchronized to the music by placing
the graphics commands inside of *Note value* blocks.

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_sync_graphics.tb&run=true)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/fibonacci3.svg'</img>

In this example, because the computation and graphics are more
complex, a *Free-time* block is used to decouple the graphics from
the master clock.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/graphics4.png'</img>

5. Interaction
--------------

There are many ways to interactive with Music Blocks, including
tracking the mouse position to impact some aspect of the music.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/interactive.svg'</img>

For example, we can launch the phrases (chunks) interactively. When
the mouse is in the lower-left quadrant, `chunk` is played;
lower-right quadrant, `chunk1`; upper-left quadrant, `chunk2`; and
upper-right quadrant, `chunk3`.

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_interactivefrerejacques.tb&run=true)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/interactive2.svg'</img>

In the example above, a simple two-key piano is created by associating
*click* events on two different turtles with individual notes. Can you
make an 8-key piano?

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_twokey_piano.tb&run=true)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/interactive3.svg'</img>

You can also add a bit of randomness to your music. In the top example
above, the *One-of* block is used to randomly assign either `Do` or
`Re` each time the *Note value* block is played. In the bottom example
above, the *One-of* block is used to randomly select between `chunk1`
and `chunk2`.

6. Beyond Music Blocks
----------------------

Music Blocks is a waypoint, not a destination. One of the goals is to
point the learner towards other powerful tools. One such tool is
[Lilypond](http://lilypond.org), a music engraving program.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/lilypond1.svg'</img>

The *Save as Lilypond* block will transcribe your composition. The
output of the program above is saved to `Downloads/hotdog.ly`. There is
also a *Save as Lilypond* button on the secondary toolbar.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/lilypond2.svg'</img>

```
\version "2.18.2"

mouse = {
c'8 c'8 c'8 c'8 c'4 c'4 g'8 g'8 g'8 g'8 g'4 g'4 a'8 a'8 a'8 a'8 a'4
a'4 g'8 g'8 g'8 g'8 g'4 g'4 f'8 f'8 f'8 f'8 f'4 f'4 e'8 e'8 e'8 e'8
e'4 e'4 d'8 d'8 d'8 d'8 d'4 d'4 c'8 c'8 c'8 c'8 c'4 c'4
}

\score {
<<
\new Staff = "treble" {
\clef "treble"
\set Staff.instrumentName = #"mouse" \mouse
}
>>
\layout { }
}
```

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/hotdog.png'</img>

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_hotdog.tb&run=true)
