Using Music Blocks
==================

Music Blocks is a fork of Turtle Blocks. It has extensions for
exploring music: pitch and rhythm.

Music Blocks is designed to run in a browser. Most of the development
has been done in Chrome, but it should also work in Firefox. You can
run it directly from index.html, from [GitHub]
(http://walterbender.github.io/musicblocks), or from the [github
repo](http://rawgit.com/walterbender/musicblocks/master/index.html).

Once you've launched it in your browser, start by clicking on (or
dragging) blocks from the Turtle palette. Use multiple blocks to
create drawings; as the turtle moves under your control, colorful
lines are drawn.

You add blocks to your program by clicking on or dragging them from
the palette to the main area. You can delete a block by dragging it
back onto the palette. Click anywhere on a "stack" of blocks to start
executing that stack or by clicking on the rabbit (fast) or snail
(slow) on the Main Toolbar. To maximize screen real estate, Turtle
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

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/stats-button.svg'</img>

Show project statistics.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/plugin-button.png'</img>

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

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/matrix.svg'</img>

Used to define the matrix used to create "chunks" of notes.

Note Palette
------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/set_color.svg'</img>

Used to define individual notes by specifying a note value, e.g.,
whole note (1), half note (2), quarter note (4), etc. and a collection
of pitch blocks to define individual tones or chords.

Tone Palette
------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/documentation/set_shade.svg'</img>

Used to generate notation for the notes contained in the clamp. (Note
that only notes of a value of a power of two will work in the current
implementation.)
