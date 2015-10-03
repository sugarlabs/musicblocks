Using Music Blocks
==================

Music Blocks is a fork of Turtle Blocks. It has extensions for
exploring music: pitch and rhythm.

Music Blocks is designed to run in a browser. Most of the development
has been done in Chrome, but it should also work in Firefox. You can
run it directly from index.html, from [GitHub]
(http://walterbender.github.io/musicblocks), or from the [github
repo](http://rawgit.com/walterbender/musicblocks/master/index.html).

Once you've launched it in your browser, start by clicking on the
Matrix Block. A matrix of pitch (vertical) vs time (horizontal) will
appear. Time is broken into columns, each representing a single note,
e.g., three quarter notes. Click on boxes in the grid to select which
pitches will be associated with each note. (Note that you can play
chords by selecting multiple pitches within a single column.)

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/play-button.svg'
height="36"</img> You can playback the notes in the matrix by clicking
on the Play Button.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/download.svg'
height="36"</img> Use the Save Button to create a stack of blocks that
will recreate the "chunk of notes" you've created under control of
your program.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/erase-button.svg' height="36"</img> You can erase the matrix by clicking on the Erase Button.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/close-button.svg' height="36"</img> Close the matrix by clicking on the Close Button.

To write programs, click on (or dragging) blocks from the various
palettes.  Use multiple blocks to create music and drawings; as the
turtle moves under your control, colorful lines are drawn and plays
music of your own creation.

You add blocks to your program by clicking on or dragging them from
the palette to the main area. You can delete a block by dragging it
back onto the palette. Click anywhere on a "stack" of blocks to start
executing that stack or by clicking on the rabbit (fast) or snail
(slow) on the Main Toolbar. To maximize screen real estate, Music
Blocks overlays the program elements (stacks of blocks) on top of the
canvas. These blocks can be hidden at any time will running the program.

Toolbars
--------

There are three toolbars: (1) the main toolbar across the top of the
screen; (2) the secondary toolbar on the right side of the screen; and
(3) the palette toolbar on the right side of the screen. An additional
menu appears when a "long press" is applied to a stack of
blocks. There is also a utility panel with additional controls.

Main toolbar
------------

The Main toolbar is used to run programs, erase the screen, and hide
the palettes and blocks.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/fast-button.png'</img>

Run the blocks fast.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/slow-button.png'</img>

Run the blocks slowly. When running slowly, the values of parameter
boxes are shown as an additional debugging aid.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/step-button.png'</img>

Run the blocks step by step (one block is executed per turtle per click).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/stop-turtle-button.png'</img>

Stop running the current project.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/clear-button.png'</img>

Clear the screen and return the turtles to their initial positions in
the center of the screen.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/palette-button.png'</img>

Hide or show the block palettes.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/hide-blocks-button.png'</img>

Hide or show the blocks and the block palettes.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/collapse-blocks-button.png'</img>

Expand or collapse stacks of blocks (start and action stacks).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/help-button.png'</img>

Show the help messages.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/menu-button.png'</img>

Expand or collapse the auxillary toolbar.

Auxillary toolbar
-----------------

The Auxillary toolbar, displayed on the right side of the screen, has
buttons for various utilities such as accessing the planet for saving
programs, overlaying grids, and accessing the utility panel. The
Auxillary toolbar button on the Main toolbar (top right) is used to
show/hide the Auxillary toolbar.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/planet-button.png'</img>

Open a viewer for loading example projects.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/copy-button.png'</img>

Copy blocks onto the clipboard. (This button appears at the top of a
stack after a "long press".)

Also shown on after a long press is the Save Action-stack button. This
will save an action stack on the custom palette for use in other
projects.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/paste-button.png'</img>

Paste blocks from the clipboard. (This button is highlighted only when
there are blocks available on the clipboard to paste.)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/Cartesian-button.png'</img>

Show or hide a Cartesian-coordinate grid.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/polar-button.png'</img>

Show or hide a polar-coordinate grid.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/utility-button.svg'</img>

Open utility panel to access controls for changing block size, loading
plugins, looking at project statistics, and enabling/disabling
scrolling.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/empty-trash-button.png'</img>

Remove all blocks.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/restore-trash-button.png'</img>

Restore blocks from the trash.

Utility panel
-------------

The utility panel has some useful but seldom used controls.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/smaller-button.svg'</img>

Decrease the size of the blocks.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/bigger-button.svg'</img>

Increase the size of the blocks.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/stats-button.png'</img>

Show project statistics.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/plugin-button.svg'</img>

Load new blocks from plugins (previously downloaded to the file system).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/scrolllock-button.svg'</img>

Enable/disable scrolling.

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

Matrix Palette
--------------

The blocks on this palette are used to create a matrix for generating
"chunks of notes" that can be played back programmatically.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/matrix.svg'</img>

Used to define the matrix used to create "chunks" of notes. The matrix
is organized by pitch and rhythm. A row in the matrix is created for
each Pitch Block and columns are created for individual notes, which
are created by using Rhythm Blocks, individual note blocks, or the
Tuplet Block.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/pitch.svg'</img>

The Pitch Block is used to specify the pitch of a note. By default, we
use Solfage, i.e., do, re, mi, fa, sol, la, ti, where do is mapped to
C, re is mapped to D, etc. You can also specify pitch by using a note
name, e.g., F#. An octave specification is also required. When used
with the Matrix Block, a row is created for each Pitch Block.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/rhythm.svg'</img>

The Rhythm Block is used to specify a series of notes of the same
duration, e.g., three quarter notes or seven eighth notes. The number
of notes is the top argument; the bottom argument is the inverse of
the note duration, e.g., 1 for a whole note, 2 for a half note, 4 for
a quarter note, etc. Each note is represented by a column in the
matrix.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/wholenote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/halfnote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/quarternote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/eighthnote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/sixteenthnote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/thirtysecondnote.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/sixtyfourthnote.svg'</img>

As a convenience, blocks for some individual notes are also
provided. They also create columns in the matrix.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/tuplet.svg'</img>

A tuplet is a collection of notes that are scaled to map into a
specified duration. For example, you can pack three quarter notes into
the duration of a single quarter note to get three twelfth notes. You
can mix and match Rhythm and individual note blocks within a Tuplet
Block to generate complex rhythms. Each note is represented by a
column in the matrix.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/setkey.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/key.svg'</img>

The Set Key Block is used to set the key for the mapping between the Solfage and notes using a "movable" system (See [Solfage](https://en.wikipedia.org/wiki/Solf%C3%A8ge) for more details).

The Key Block contains the current Key, by default, C Major.

Note Palette
------------

The Note Palette contains blocks used to play music. Stacks of notes
can be created from the matrix, by clicking on the Save Button, or by
direct construction using the Pitch Block and the blocks on this
palette. In addition to creating notes, you can transform the notes
using blocks such as Sharp and Flat or Transposition.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/note.svg'</img>

Used to define individual notes by specifying a note value, e.g.,
whole note (1), half note (2), quarter note (4), etc. and a collection
of pitch blocks to define individual tones or chords.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/flat.svg'</img>

Used to lower any contained notes by one step in a 12-step scale.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/sharp.svg'</img>

Used to raise any contained notes by one step in a 12-step scale.

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/adjust-transposition.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/transposition.svg'</img>

Used to transpose any contained notes by an integral step in a 12-step scale. The Transposition Block contains the current transposition (the default is 0).

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/multiply-beat.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/divide-beat.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/beat-factor.svg'</img>

Used to adjust the beat of any contained notes. Multiplying the beat will speed things up; dividing the beat will slow things down. The Beat-factor Block contains the current beat factor (the default is 1).

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/dot.svg'</img>

Used to dot any contained notes. A dotted note plays for 50% longer than the original note, e.g., a dotted quarter note is equivalent to a 3/8 note. Double-dotting is not yet supported. (When used with the Tuplet Block, the duration of the tuplet is extended by 50%.)

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/duplicate-notes.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/duplicate-factor.svg'</img>

Used to repeat any contained notes. Similar to using a Repeat block, but rather than repeating a sequence of notes multiple times, each note is repeated in turn, e.g. duplicate x2 of 4 4 8 would result in 4 4 4 4 8 8, where as repeat x2 of 4 4 8 would result in 4 4 8 4 4 8.

Tone Palette
------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/notation.svg'</img>

Used to generate notation for the notes contained in the clamp. (Note
that only notes of a value of a power of two will work in the current
implementation.)
