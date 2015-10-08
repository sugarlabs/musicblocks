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
the [github
repo](http://rawgit.com/walterbender/musicblocks/master/index.html) or
github io](http://walterbender.github.io/musicblocks) or by
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
run. Look for RUN LIVE links that will take you to
http://turtle.sugarlabs.org.

THE GRAPHICAL NOTATION MATRIX
-----------------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix1.svg'</img>

Once you've launched Music Blocks in your browser, start by clicking
on the Graphical Notation Matrix that appears in the middle of the
screen. (For the moment, ignore the Start block.) You'll see a grid
organized vertically by pitch and horizontally by rhythm.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix2.svg'</img>

Because the matrix had three pitch blocks, you see three rows, one for
each pitch. (A fourth row at the bottom is used for specifying the
rhythms associated with each note.)

Because there is just one Rhythm block, which specifies three quarter
notes, there are just three columns for selecting notes.

By clicking on individual cells in the grid, you should hear
individual notes (or chords if you click on more than one cell in a
column).

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/play-button.svg'
height="36"</img> If you click on the Play button (found in the top
row of the grid), you will hear a sequence of notes played (from left
to right).

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/download.svg'
height="36"</img> Once you have a group of notes (a "chunk") that you like, click on the
Save button (just to the right of the Play button). This will create a
stack of blocks that can used to play these same notes
programtically. (More on that below.)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide/matrix3.svg'</img>

You can rearrange the selected notes in the grid and safe other chunks
as well.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/close-button.svg' height="36"</img> Or hide the grid by clicking on the Close button (the
right-most button in the top row of the grid.)

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/erase-button.svg' height="36"</img> There is also an Erase
button that will clear the grid.

Don't worry. You can reopen the grid at anytime and since you can
define as many chunks as you want, feel free to experiment.

About the Pitch Block
---------------------

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/guide/matrix4.svg'</img>

About the Rhythm Block
----------------------

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/guide/matrix5.svg'</img>

Creating Tuplets
----------------

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/guide/matrix6.svg'</img>

Using individual notes in the matrix
------------------------------------

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/guide/matrix7.svg'</img>

PROGRAMMING WITH MUSIC
----------------------

The remainder of this guide discusses how to use the chunks created by
the Graphical-notation matrix when programming (You can also program with chunks you create and/or modify by hand).

1. A chunck of notes
--------------------

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/guide/matrix8.svg'</img>

There are several ways to play a chunk...

