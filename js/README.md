MusicBlocks/js
==============

The core code for Music Blocks resides in this directory.

* `activity.js` -- where the menus are defined

Logo code
* `logo.js` -- the code associated with running blocks
* `turtle.js` -- the code associated with graphics

Blocks code
* `basicblocks.js` -- where the blocks are defined
* `blockfactory.js` -- where the block artwork is created
* `block.js` -- the core class for a block
* `blocks.js` -- utilities for managing the collection of blocks
* `macros.js` -- a collection of blocks associated with an action
* `protoblocks.js` -- the class of block prototypes

Palette-related code
* `artwork.js` -- the palette buttons and colors are defined here
* `palette.js` -- the blocks palettes

Button boxes
* `clearbox.js` -- confirm delete
* `playbackbox.js` -- compile and playback
* `savebox.js` -- save options
* `utilitybox.js` -- settings

Export utilities
* `abc.js` -- save in ABC format
* `lilypond.js` -- save in Lilypond formar

Other utilities
* `analytics.js` -- analyse blocks in project
* `background.js` -- extenstion utilities
* `boundary.js` -- boundary box for home screen
* `loader.js` -- loader for require
* `samplesviewer.js` -- planet interface
* sugarizer-`compatibility.js` -- datastore utilities used by sugarizer
* `trash.js` -- trash can manager
* `turtledefs.js` -- strings and palettes unique to Music Blocks

Subdirectories with additional utilities
* utils -- additional general-purpose utilities
* widgets -- widget code

# __How to add new blocks__

This document describes how to add new blocks in support of additional
functionality. The two files that are most significant are
`basicblocks.js` and `logo.js`. (Note that you may want to write a
[plugin](http://github.com/walterbender/musicblocks/tree/master/plugins)
instead.)

(As with any change, please make your own copy by cloning this
[respository](https://github.com/walterbender/musicblocks.git). Make
your changes, test them, and then make a pull request.)

## How to define a new block in basicblocks.js

[basicblocks.js](https://github.com/walterbender/musicblocks/blob/master/js/basicblocks.js)
is where each block is defined, its palette assigned, its shape and
label defined, and any default arguments assigned.

[logo.js](https://github.com/walterbender/musicblocks/blob/master/js/logo.js)`. `basicblocks.js
is where the code associated with running each block is defined.

Define the type of block

`var uniquenameBlock = new protoBlock('uniquename');`

This creates a new instance of the class protoBlock which is used to
create a new block.

Assign a palette to the block

`uniquenameBlock.palette = palettes.dict['yourpalettename'];`

The palette can be any of the palettes listed in `turtledef.js`. The
color of the block is defined by the palette used.

To add block to the protoblock dictionary

`blocks.protoBlockDict['uniquename'] = uniquenameBlock;`

Define additional block properties, e.g.,

* Define the block prototype

  `uniquenameBlock.oneArgBlock();`

* Add a label to the block

  `uniquenameBlock.staticLabels.push(_('label'));`

* Add any default arguments

  `uniquenameBlock.defaults.push(100);`

* Override the default docktype if necessary

  `uniquenameBlock.dockTypes[1] = 'anyin';

Check
[protoblock.js](https://github.com/walterbender/turtleblocksjs/blob/master/js/protoblocks.js) for additional block properties.

## Macro expansions

In some cases, you may want a block on the palette expand into a stack
of blocks.

To add a macro:

1. be sure that there is a block defined in `basicblocks.js`;

2. add an entry in BLOCKISMACRO array `macros.js` in the blockIsMacro
function below with the block name from basicblocks.js;

3. define the macro (the JSON representation of the blocks that
the macro expands to, where the position is specified as x, y); and

4. add an entry to the BUILTINMACROS dictionary.

More details can be found in the comment at the top of `macros.js`.

## Examples

A flow block:

  ```
    var pitch = new ProtoBlock('pitch');
    pitch.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitch'] = pitch;
    //.TRANS: we specify pitch in terms of a name and an octave.
    //.TRANS: The name can be CDEFGAB or Do Re Mi Fa Sol La Ti.
    //.TRANS: Octave is a number between 1 and 8.
    pitch.staticLabels.push(_('pitch'), _('name'), _('octave'));
    pitch.adjustWidthToLabel();
    pitch.defaults.push('sol');
    pitch.defaults.push(4);
    pitch.twoArgBlock();
    pitch.dockTypes[1] = 'solfegein';
    pitch.dockTypes[2] = 'anyin';
  ```

An arg block:

  ```
    var colorBlock = new ProtoBlock('color');
    colorBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['color'] = colorBlock;
    colorBlock.staticLabels.push(_('color'));
    colorBlock.adjustWidthToLabel();
    colorBlock.parameterBlock();
  ```

A macro as seen in `basicblocks.js`:

  ```
    var newnoteBlock = new ProtoBlock('newnote');
    newnoteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newnote'] = newnoteBlock;
    newnoteBlock.staticLabels.push(_('note value'));
    newnoteBlock.adjustWidthToLabel();
    newnoteBlock.flowClampOneArgBlock();
    newnoteBlock.defaults.push(1 / 4);
  ```

And it definition in `macros.js`:

  ```
    const NEWNOTEOBJ = [[0, 'newnote', x, y, [null, 1, 4, 8]],
                        [1, 'divide', 0, 0, [0, 2, 3]],
			[2, ['number', {'value': 1}], 0, 0, [1]],
			[3, ['number', {'value': 4}], 0, 0, [1]],
			[4, 'vspace', 0, 0, [0, 5]],
			[5, 'pitch', 0, 0, [4, 6, 7, null]],
			[6, ['solfege', {'value': 'sol'}], 0, 0, [5]],
			[7, ['number', {'value': 4}], 0, 0, [5]],
			[8, 'hidden', 0, 0, [0, null]]];
  ```

## How to define block function in [logo.js](https://github.com/walterbender/musicblocks/blob/master/js/logo.js)

There are two basic types of blocks: *flow* blocks, the connect vertically, and *arg* blocks, that connect horizontally into *flow* blocks.

There are switch statements in `logo.js` where the function of *flow* blocks and *arg* blocks are defined. 

  ```
        case 'uniquename':

        Your code here...

            break;
  ```

## Examples

A *flow* block:

  ```
        case 'setturtlename2':
            if (args[0] != null) {
                that.turtles.turtleList[turtle].rename(args[0]);
            }
            break;
  ```

An *arg* block:

  ```
            case 'random':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                that.blocks.blockList[blk].value = that._doRandom(a, b);
                break;
  ```

There are some special *arg* blocks call *parameter* blocks, which can
display their values on their labels and be used with a
*setter*. There are additional switch statements for parameter blocks:

  ```
            case 'color':
                value = toFixed2(this.turtles.turtleList[turtle].color);
                break;
  ```

  ```
        case 'color':
            turtleObj.doSetColor(value);
            break;
  ```

## Odds and ends

* You should add your new block to the analytics found in
  [analytics.js](https://github.com/walterbender/musicblocks/blob/master/js/analytics.js)

* clamp blocks are a bit complicated since they have interior flows
  and need to trigger a listener when that flow completes its
  execution.

## Protoblock types

* `zeroArgBlock`: E.g., penup, pendown
* `basicBlockNoFlow`: E.g., break
* `oneArgBlock`: E.g., forward, right
* `twoArgBlock`: E.g., setxy. These are expandable.
* `oneArgMathBlock`: E.g., sqrt
* `oneArgMathWithLabelBlock`: E.g., box
* `twoArgMathBlock`: E.g., plus, minus, multiply, divide. These are also expandable.
* `valueBlock`: E.g., number, string. Value blocks get DOM textareas associated with them so their values can be edited by the user.
* `mediuniquenameBlock`: E.g., media. Media blocks invoke a chooser and a thumbnail image is overlayed to represent the data associated with the block.
* `flowClampZeroArgBlock`: E.g., start. A "child" flow is docked in an expandable clamp. There are no additional arguments and no flow above or below.
* `flowClampOneArgBlock`: E.g., repeat. Unlike action, there is a flow above and below.
* `flowClampBooleanArgBlock`: E.g., if.  A "child" flow is docked in an expandable clamp. The additional argument is a boolean. There is flow above and below.
* `doubleFlowClampBooleanArgBlock`: E.g., if then else.  Two "child" flows are docked in expandable clamps. The additional argument is a boolean. There is flow above and below.
* `blockClampZeroArgBlock`: E.g., forever. Unlike start, there is flow above and below.
* `blockClampOneArgBlock`: E.g., action. A "child" flow is docked in an expandable clamp. The additional argument is a name. Again, no flow above or below.
* `booleanZeroArgBlock`: E.g., mouse button.
* `booleanOneBooleanArgBlock`: E.g., not
* `booleanTwoBooleanArgBlock`: E.g., and
* `booleanOneArgBlock`: E.g.,
* `booleanTwoArgBlock`: E.g., greater, less, equal.
* `parameterBlock`: E.g., color, shade, pensize
