Using Turtle Art JS
===================

Turtle Blocks Javascript is designed to run in a browser. Most of the
development has been done in Chrome, but it should also work in
Firefox. You can run it directly from index.html, from a [server
maintained by Sugar Labs](http://turtle.sugarlabs.org), from the
[github
repo](https://rawgit.com/sugarlabs/musicblocks/master/index.html),
or by setting up a [local
server](./server.md).

Once you've launched it in your browser, start by clicking on (or
dragging) blocks from the Turtle palette. Use multiple blocks to
create drawings; as the turtle moves under your control, colorful
lines are drawn.

To write your own programs, drag blocks from their respective palettes
on the left side of the screen. Use multiple blocks in stack(s) to
create drawings; as the turtle moves under your control, colorful
lines are drawn.

Note that blocks either snap together vertically or
horizontally. Vertical connections indicate program (and temporal)
flow. Code is executed from the top to bottom of a stack of
blocks. Horizontal connections are used for parameters and arguments,
e.g., the distance to go forward, the degrees to rotate right, the
numerator and denominator of a division. From the shape of the block,
it should be apparent whether they connect vertically or horizontally.

Some blocks, referred to as "clamp" blocks have an
interior&mdash;child&mdash;flow. This might be code that is run *if* a
condition is true, or, more common, the code that is run over the
duration of a note.

For the most part, any combination of blocks will run (although there
is no guarantee that they will produce music). Illegal combinations
of blocks will be flag by a warning on the screen as the program runs.

You can delete a block by dragging it back into the trash area that
appear at the bottom of the screen.

To maximize screen real estate, Music Blocks overlays the program
elements (stacks of blocks) on top of the canvas. These blocks can be
hidden at any time while running the program.

Toolbars
--------

There are three toolbars: (1) the main toolbar across the top of the
screen; (2) the secondary toolbar on the right side of the screen; and
(3) the palette toolbar on the left side of the screen. An additional
toolbar appears when a "long press" (or "right click") is applied to a stack of
blocks. There is also a utility panel with additional controls.

Main toolbar
------------

The Main toolbar is used to run programs and to save and load projects.

On the left side of the main toolbar:

<img src='./play.png' /> Click on the *Run* button to run the blocks.

<img src='./stop.png' /> Stop running the current project.

Under the secondary toolbar <img src='./hamburger.png' />
are additonal buttons to run the blocks slowly. When running slowly,
the values of parameter boxes are shown as an additional debugging
aid.

<img src='./play-slow.png' /> to play back slowly.

<img src='./step.png' /> to play step-by-step (one block will run with each button press).

On the right side of the main toolbar:

<img src='./new-project.png' /> To start a new project.

<img src='./save-project.png' /> To save a project to the local file system of your computer.

<img src='./open-project.png' /> To open a saved project.

<img src='./planet.png' /> To open a viewer for loading example projects and projects made by other Turtle Blocks users.

<img src='./hamburger.png' /> Expand the auxillary toolbar. The <img src='./secondary-menu.png' /> button closes the auxillary toolbar.


<img src='./help.png' /> Show the help messages.

Canvas Toolbars
---------------

There are some additional buttons at the top of the canvas:

<img src='./erase.png' />

* The Show (or hide) grid button will display a pie menu with a variety of grid options.

* The Erase button will clear the screen and return the turtles to the center of the screen.

* The Screen button will shrink (or expand) the graphics area.

And there are some buttons on the bottom of the canvas:

<img src='./home-hide-collapse.png' />

* The Home buttom returns the blocks the center of the screen.

* The Hide button hides (or reveals) the blocks.

* The Collapse button collapses (or expands) stacks of blocks.

* The Shrink and Grow (magnifying glass) buttons change the size of the blocks.

Auxillary toolbar
-----------------

In addition to the run-slowly and step buttons described above:

<img src='./restore-trash.png' /> Restore blocks from the trash.

<img src='./stats.png' /> Show project statistics.

<img src='./add-plugin.png' /> Load new blocks/palettes from plugins (previously downloaded to the file system).

<img src='./remove-plugin.png' /> Removes a plugin.

<img src='./merge-project.png' /> Load a new project without removing the current blocks (AKA, "merge").

<img src='./horizontal-scrolling.png' /> Enable/disable horizontal scrolling.

<img src='./js.png' /> Open the JavaScript editor. (Your blocks program will be transcribed into JavaScript.)

<img src='./language.png' /> Select a language, e.g., Spanish, for the interface.

Block Pie Menu
--------------

When you "long-press" or "right-click" on a block, a pie menu appears.

<img src='block-pie-menu.png' />

Going clockwise from the top:

* Block help

* Copy block

* Extract block (from a stack of blocks)

* Put block in the trash

* Close the pie menu

Keyboard shortcuts
------------------

There are several keyboard shortcuts:

*PgUp* and *PgDn* will scroll the screen vertically. This is useful for
creating long stacks of blocks.

You can use the arrow keys to move blocks and the *Delete* key to
remove an individual block from a stack.

*Enter* is the equivalent of clicking the *Run* button.

*Alt-C* is copy and *Alt-V* is paste. Be sure that the cursor is
highlighting the block(s) you want to copy.

Block Palettes
--------------

The block palettes are displayed on the left side of the screen. The
palette button on the Main toolbar show and hide the block
palettes. These palettes contain the blocks used to create
programs. See the
[Programming Guide](../guide/README.md)
for more details on how to use the blocks.

Turtle Palette
--------------

<img src='./clear.svg' />

Clear the screen and reset the turtle.

<img src='./forward.svg' />

Move turtle forward.

<img src='./right.svg' />

Turn turtle clockwise (angle in degrees).

<img src='./back.svg' />

Move turtle backward.

<img src='./left.svg' />

Turn turtle counterclockwise (angle in degrees).

<img src='./arc.svg' />

Move turtle along an arc.

<img src='./set_heading.svg' />

Set the heading of the turtle (0 is towards the top of the screen).

<img src='./heading.svg' />

The current heading of the turtle (can be used in place of a number block)

<img src='./setxy.svg' />

Move turtle to position xcor, ycor; (0, 0) is in the center of the screen.

<img src='./x.svg' />

Current x-coordinate value of the turtle (can be used in place of a number block)

<img src='./y.svg' />

Current y-coordinate value of the turtle (can be used in place of a number block)

Pen Palette
-----------

<img src='./set_color.svg' />

Set color of the line drawn by the turtle (hue, shade, and grey).

<img src='./color.svg' />

Current pen color (can be used in place of a number block)

<img src='./set_hue.svg' />

Set hue of the line drawn by the turtle (hue is the spectral color, e.g., red, orange, yellow, green, blue, purple, etc.).

<img src='./set_shade.svg' />

Set shade of the line drawn by the turtle (shade is lightness, e.g., black, grey, white).

<img src='./shade.svg' />

Current pen shade (can be used in place of a number block)

<img src='./set_grey.svg' />

Set grey level of the line drawn by the turtle (grey is vividness or saturation).

<img src='./grey.svg' />

Current grey level (can be used in place of a number block)

<img src='./set_pen_size.svg' />

Set size of the line drawn by the turtle.

<img src='./pen_size.svg' />

Current pen size (can be used in place of a number block)

<img src='./pen_up.svg' />

Turtle will not draw when moved.

<img src='./pen_down.svg' />

Turtle will draw when moved.

<img src='./fill.svg' />

Draw filled polygon.

<img src='./hollow.svg' />

Set pen attribute to hollow line mode (useful for working with 3D printers).

<img src='./set_font.svg' />

Set the font of the text drawn with Show Block.

<img src='./background.svg' />

Set the background color.

Number Palette
--------------

<img src='./number.svg' />

Use as numeric input in mathematic operators (click to change the value).

<img src='./random.svg' />

Returns random number between minimum (top) and maximum (bottom) values

<img src='./one-of.svg' />

Returns one of two inputs as determined by a coin toss (random selection)

<img src='./plus.svg' />

Adds two numeric inputs (also can be used to concatenate two strings)

<img src='./subtract.svg' />

Subtracts bottom numeric input from top numeric input

<img src='./multiply.svg' />

Multiplies two numeric inputs

<img src='./divide.svg' />

Divides top numeric input (numerator) by bottom numeric input (denominator)

<img src='./sqrt.svg' />

Calculates square root

<img src='./int.svg' />

Converts real numbers to integers

<img src='./mod.svg' />

Returns top input modular (remainder) bottom input.

<img src='./eval.svg' />

A programmable block used to add advanced single-variable math equations, e.g., sin(x).

Boolean Palette
---------------

<img src='./greater_than.svg' />

Logical greater-than operator

<img src='./less_than.svg' />

Logical less-than operator

<img src='./equal.svg' />

Logical equal-to operator

<img src='./and.svg' />

Logical AND operator

<img src='./or.svg' />

Logical OR operator

<img src='./not.svg' />

Logical NOT operator

Flow Palette
------------

<img src='./repeat.svg' />

Loops specified number of times through enclosed blocks

<img src='./forever.svg' />

Loops forever through enclosed blocks

<img src='./stop.svg' />

Stops current loop or action

<img src='./if.svg' />

If-then operator that uses boolean operators to determine whether or not to run encloded "flow"

<img src='./until.svg' />

Do-until-True operator that uses boolean operators to determine how long to run enclosed "flow"

<img src='./wait_for.svg' />

Waits for condition

<img src='./while.svg' />

Do-while-True operator that uses boolean operators to determine how long to run enclosed "flow"

<img src='./if_else.svg' />

If-then-else operator that uses boolean operators to determine which encloded "flow" to run

Boxes Palette
-------------

<img src='./storein.svg' />

Stores value in named variable.

<img src='./box_value.svg' />

Named variable

<img src='./add_1_to.svg' />

Adds 1 to named variable

<img src='./add_to.svg' />

Adds numeric value to named variable

<img src='./box.svg' />

Named variable (name is passed as input)

Action Palette
--------------

<img src='./action_flow.svg' />

Top of nameable action stack

<img src='./action.svg' />

Invokes named action stack

<img src='./do_arg.svg' />

Invokes an action stack with arguments (To add more arguments, drag them into the clamp.)

<img src='./calc.svg' />

Invokes an action stack that returns a value

<img src='./calc_arg.svg' />

Invokes an action stack with arguments that returns a value

<img src='./return.svg' />

Returns a value from an action stack

<img src='./arg.svg' />

An argument passed to an action stack

<img src='./arg1.svg' />

The first argument passed to an action stack

<img src='./start.svg' />

Connects action to toolbar run buttons (each Start Block invokes its own turtle)

<img src='./do.svg' />

Invokes named action stack (name is passed as input)

<img src='./event_on_do.svg' />

Connects an action with an event

<img src='./broadcast.svg' />

Broadcasts an event (event name is given as input)

Media Palette
-------------

<img src='./speak.svg' />

Speaks text

<img src='./show.svg' />

Draws text or shows media (from the camera, the Web, or the file system).

<img src='./size_shell_image.svg' />

Puts a custom "shell" on the turtle (used to turn a turtle into a "sprite")

<img src='./text.svg' />

Text (string) value

<img src='./load-media.svg' />

Opens a file-open dialog to load an image (used with Show Block)

<img src='./camera.svg' />

Accesses webcam (used with Show Block)

<img src='./video.svg' />

Opens a file-open dialog to load a video (used with Show Block)

<img src='./open_file.svg' />

Returns the selected file (used with Show Block)

<img src='./stop_media.svg' />

Stops the media being played

<img src='./tone.svg' />

Plays a tone at frequency (Hz) and duration (in seconds)

<img src='./note_to_frequency.svg' />

Converts notes to frequency, e.g., A4 --> 440 Hz.

Sensor Palette
--------------

<img src='./time.svg' />

Elapsed time (in seconds) since program started

<img src='./mouse_x.svg' />

Returns mouse X coordinate

<img src='./mouse_y.svg' />

Returns mouse Y coordinate

<img src='./mouse_button.svg' />

Returns True if mouse button is pressed

<img src='./keyboard.svg' />

Holds results of query-keyboard block as ASCII

<img src='./pixel_color.svg' />

Returns pixel color under turtle

<img src='./loudness.svg' />

Microphone input volume

<img src='./click.svg' />

The "click" event associated with a turtle (used with Do Block)

Heap Palette
------------

<img src='./push.svg' />

Push a value onto the heap.

<img src='./pop.svg' />

Pop a value off of the heap.

<img src='./index_heap.svg' />

Reference an entry in the heap.

<img src='./set_heap_entry.svg' />

Change an entry in the heap.

<img src='./show_heap.svg' />

Display the contents of the heap.

<img src='./heap_length.svg' />

The length of the heap.

<img src='./empty_heap.svg' />

Empty the heap.

<img src='./heap_empty.svg' />

True is the heap is empty.

<img src='./save_heap.svg' />

Save the heap to a file (JSON-encoded).

<img src='./load_heap.svg' />

Load the heap from a file (JSON-encoded).

Extras Palette
--------------

<img src='./vspace.svg' />

Used to layout blocks vertically

<img src='./hspace.svg' />

Used to layout blocks horizontally

<img src='./wait.svg' />

Pauses turtle a specified number of seconds

<img src='./print.svg' />

Prints value

<img src='./save_svg.svg' />

Saves turtle graphics as an SVG file

<img src='./show_blocks.svg' />

Shows blocks and runs slowly (used to isolate code during debugging)

<img src='./hide_blocks.svg' />

Hides blocks and runs at full speed (used to isolate code during debugging)

<img src='./play_back.svg' />

Plays media

<img src='./stop_play.svg' />

Stops playing media
