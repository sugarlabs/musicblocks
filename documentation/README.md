Using Turtle Art JS
===================

Turtle Blocks Javascript is designed to run in a browser. Most of the
development has been done in Chrome, but it should also work in
Firefox. You can run it directly from index.html, from a [server
maintained by Sugar Labs](http://turtle.sugarlabs.org), from the
[github
repo](http://rawgit.com/walterbender/turtleblocksjs/master/index.html),
or by setting up a [local
server](https://github.com/walterbender/turtleblocksjs/blob/master/server.md).

Once you've launched it in your browser, start by clicking on (or
dragging) blocks from the Turtle palette. Use multiple blocks to
create drawings; as the turtle moves under your control, colorful
lines are drawn.

You add blocks to your program by clicking on or dragging them from
the palette to the main area. You can delete a block by dragging it
back onto the palette. Click anywhere on a "stack" of blocks to start
executing that stack or by clicking in the Rabbit (fast) or Turtle
(slow) on the Main Toolbar.

Toolbar Buttons
---------------

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/fast-button.png'</img>
Run the blocks fast.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/slow-button.png'</img>
Run the blocks slowly.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/step-button.png'</img>
Run the blocks step by step (one block per turtle per click).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/stop-turtle-button.png'</img>
Stop running the current project.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/clear-button.png'</img>
Clear the screen and return the turtles to their initial positions.

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

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/planet-button.png'</img>
Open a viewer for loading example projects.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/copy-button.png'</img>
Copy blocks onto the clipboard.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/paste-button.png'</img>
Paste blocks from the clipboard.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/Cartesian-button.png'</img>
Show or hide a Cartesian-coordinate grid.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/polar-button.png'</img>
Show or hide a polar-coordinate grid.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/plugin-button.png'</img>
Load new blocks from plugins (previously downloaded to the file system).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/empty-trash-button.png'</img>
Remove all blocks.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/restore-trash-button.png'</img>
Restore blocks from the trash.

Basic Blocks
------------

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/clear.svg'</img>
Clear the screen and reset the turtle.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/forward.svg'</img>
Move turtle forward.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/right.svg'</img>
Turn turtle clockwise (angle in degrees).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/back.svg'</img>
Move turtle backward.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/left.svg'</img>
Turn turtle counterclockwise (angle in degrees).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/arc.svg'</img>
Move turtle along an arc.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/set_heading.svg'</img>
Set the heading of the turtle (0 is towards the top of the screen).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/heading.svg'</img>
The current heading of the turtle (can be used in place of a number block)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/setxy.svg'</img>
Move turtle to position xcor, ycor; (0, 0) is in the center of the screen.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/x.svg'</img>
Current x-coordinate value of the turtle (can be used in place of a number block)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/y.svg'</img>
Current y-coordinate value of the turtle (can be used in place of a number block)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/set_color.svg'</img>
Set color of the line drawn by the turtle (hue, shade, and grey).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/color.svg'</img>
Current pen color (can be used in place of a number block)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/set_hue.svg'</img>
Set hue of the line drawn by the turtle (hue is the spectral color, e.g., red, orange, yellow, green, blue, purple, etc.).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/set_shade.svg'</img>
Set shade of the line drawn by the turtle (shade is lightness, e.g., black, grey, white).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/shade.svg'</img>
Current pen shade (can be used in place of a number block)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/set_grey.svg'</img>
Set grey level of the line drawn by the turtle (grey is vividness or saturation).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/grey.svg'</img>
Current grey level (can be used in place of a number block)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/set_pen_size.svg'</img>
Set size of the line drawn by the turtle.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/pen_size.svg'</img>
Current pen size (can be used in place of a number block)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/pen_up.svg'</img>
Turtle will not draw when moved.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/pen_down.svg'</img>
Turtle will draw when moved.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/begin_fill.svg'</img>
Start filled polygon (used with end fill block).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/end_fill.svg'</img>
Complete filled polygon (any shape drawn bewteen start fill and end fill will be filled with the current color).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/set_font.svg'</img>
Set the font of the text drawn with Show Block.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/background.svg'</img>
Set the background color.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/number.svg'</img>
Use as numeric input in mathematic operators (click to change the value).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/random.svg'</img>
Returns random number between minimum (top) and maximum (bottom) values

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/plus.svg'</img>
Adds two numeric inputs (also can be used to concatenate two strings)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/subtract.svg'</img>
Subtracts bottom numeric input from top numeric input

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/multiply.svg'</img>
Multiplies two numeric inputs

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/divide.svg'</img>
Divides top numeric input (numerator) by bottom numeric input (denominator)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/sqrt.svg'</img>
Calculates square root

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/int.svg'</img>
Converts real numbers to integers

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/mod.svg'</img>
Returns top input modular (remainder) bottom input.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/eval.svg'</img>
A programmable block used to add advanced single-variable math equations, e.g., sin(x).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/greater_than.svg'</img>
Logical greater-than operator

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/less_than.svg'</img>
Logical less-than operator

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/equal.svg'</img>
Logical equal-to operator

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/and.svg'</img>
Logical AND operator

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/or.svg'</img>
Logical OR operator

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/not.svg'</img>
Logical NOT operator

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/repeat.svg'</img>
Loops specified number of times through enclosed blocks

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/forever.svg'</img>
Loops forever through enclosed blocks

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/stop.svg'</img>
Stops current loop or action

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/if.svg'</img>
If-then operator that uses boolean operators to determine whether or not to run encloded "flow"

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/until.svg'</img>
Do-until-True operator that uses boolean operators to determine how long to run enclosed "flow"

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/wait_for.svg'</img>
Waits for condition

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/while.svg'</img>
Do-while-True operator that uses boolean operators to determine how long to run enclosed "flow"

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/if_else.svg'</img>
If-then-else operator that uses boolean operators to determine which encloded "flow" to run

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/name_box_value.svg'</img>
Stores value in named variable.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/box_value.svg'</img>
Named variable

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/add_1_to.svg'</img>
Adds 1 to named variable

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/add_to.svg'</img>
Adds numeric value to named variable

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/box.svg'</img>
Named variable (name is passed as input)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/action_flow.svg'</img>
Top of nameable action stack

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/action.svg'</img>
Invokes named action stack

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/start.svg'</img>
Connects action to toolbar run buttons (each Start Block invokes its own turtle)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/do.svg'</img>
Invokes named action stack (name is passed as input)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/event_on_do.svg'</img>
Connects an action with an event

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/broadcast.svg'</img>
Broadcasts an event (event name is given as input)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/speak.svg'</img>
Speaks text

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/show.svg'</img>
Draws text or shows media (from the camera, the Web, or the file system).

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/size_shell_image.svg'</img>
Puts a custom "shell" on the turtle (used to turn a turtle into a "sprite")

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/text.svg'</img>
Text (string) value

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/open_file.svg'</img>
Returns the selected file (used with Show Block)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/stop_media.svg'</img>
Stops the media being played

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/tone.svg'</img>
Plays a tone at frequency (Hz) and duration (in seconds)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/note_to_frequency.svg'</img>
Converts notes to frequency, e.g., A4 --> 440 Hz.

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/time.svg'</img>
Elapsed time (in seconds) since program started

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/mouse_x.svg'</img>
Returns mouse X coordinate

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/mouse_y.svg'</img>
Returns mouse Y coordinate

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/mouse_button.svg'</img>
Returns True if mouse button is pressed

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/keyboard.svg'</img>
Holds results of query-keyboard block as ASCII

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/pixel_color.svg'</img>
Returns pixel color under turtle

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/loudness.svg'</img>
Microphone input volume

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/click.svg'</img>
The "click" event associated with a turtle (used with Do Block)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/vspace.svg'</img>
Used to layout blocks vertically

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/hspace.svg'</img>
Used to layout blocks horizontally

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/wait.svg'</img>
Pauses turtle a specified number of seconds

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/print.svg'</img>
Prints value

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/save_svg.svg'</img>
Saves turtle graphics as an SVG file

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/show_blocks.svg'</img>
Shows blocks and runs slowly (used to isolate code during debugging)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/hide_blocks.svg'</img>
Hides blocks and runs at full speed (used to isolate code during debugging)

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/play_back.svg'</img>
Plays media

<img src='https://rawgithub.com/walterbender/turtleblocksjs/master/documentation/stop_play.svg'</img>
Stops playing media
