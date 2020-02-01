MusicBlocks/js
==============

The core code for Music Blocks resides in this directory and the
blocks subdirectory.

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
* `lilypond.js` -- save in Lilypond format

Other utilities
* `rubrics.js` -- analyse blocks in project
* `background.js` -- extenstion utilities
* `boundary.js` -- boundary box for home screen
* `loader.js` -- loader for require
* `sugarizer-compatibility.js` -- datastore utilities used by sugarizer
* `trash.js` -- trash can manager
* `turtledefs.js` -- strings and palettes unique to Music Blocks

In the `blocks` subdirectory is the code for generating blocks and
associating them with some action.

`BaseBlock.js` is the base class for all blocks. All of the other
files define blocks in each of the palettes:

`Music Palette`
`   RhythmBlockPaletteBlocks.js`
`   RhythmBlocks.js`
`   MeterBlocks.js`
`   PitchBlocks.js`
`   IntervalsBlocks.js`
`   ToneBlocks.js`
`   OrnamentBlocks.js`
`   VolumeBlocks.js`
`   DrumBlocks.js`
`   WidgetBlocks.js`

`Flow Palette`
`   FlowBlocks.js`
`   ActionBlocks.js`
`   BoxesBlocks.js`
`   NumberBlocks.js`
`   BooleanBlocks.js`
`   HeapBlocks.js`
`   ExtrasBlocks.js`

`Graphics Palette`
`   GraphicsBlocks.js`
`   PenBlocks.js`
`   MediaBlocks.js`
`   SensorsBlocks.js`
`   EnsembleBlocks.js`

Subdirectories with additional utilities
* utils -- additional general-purpose utilities
	* `detectIE.js` -- check if Music Blocks is being run in Internet Explorer
	* `munsell.js` -- Munsell color system used for mice and widgets
	* `musicutils.js` -- related to musical notations
	* `platformstyle.js` -- checking platform that Music Blocks is run in
	* `synthutils.js` -- related to defining synths in tone.js
	* `utils.js` -- general utility functions
* widgets -- widget code
	* `help.js` -- show help for individual blocks and the tour of Music Blocks
	* `modewidget.js` -- explore musical modes
	* `pitchdrummatrix.js` -- map pitches to drum sounds
	* `pitchslider.js` -- generate pitch blocks based on frequency (in Hertz)
	* `pitchstaircase.js` -- generate a collection of pitches based on ratios of frequency (Hertz)
	* `pitchtimematrix.js` -- map pitch to rhythm (create a "chunk" of notes)
	* `rhythmruler.js` -- define rhythms (and drum machines)
	* `status.js` -- track the status of various parameters as the program plays (a useful debugging tool)
	* `tempo.js` -- change the tempo
	* `timbre.js` -- design new instruments

# __How to add new blocks__

This section describes how to add new blocks to Music Blocks in order
to add functionality.

<!-- * You can add an individual block to a palette by modifying two files:
`basicblocks.js` and `logo.js`. -->
* To add a new block you first need to look through `js/blocks/` and determine if a new file is needed or not. If required then go through the section down below on how to declare new files for blocks requiring so.

## How to define new files for blocks

Note: You may skip this section if the block you're trying to add doesn't require a new file.

* Make a new file in `js/blocks` with a meaningful name.

e.g. Current files are named as  `GraphicsBlocks.js` , `MediaBlocks.js`.

* Add that file to `MUSICBLOCKS_EXTRAS` in `js/activity.js`.

* Create a setup function in your new file at the end, with a meaningful name.

e.g. `setupGraphicsBlocks()`.

* Call that setup function in `js/basicblocks.js` inside `initBasicProtoBlocks()` function.

* If the block you are adding needs to expand into a stack of blocks,
you may also need to modify `macro.js`.

* If you want to add a new palette with multiple blocks for a specific
application, you may want to write a plugin. Please see:
[plugin](http://github.com/sugarlabs/musicblocks/tree/master/plugins)
instead.

## How to define a new block in basicblocks.js (deprecated)

Note: New blocks are now added to the appropriate file in the `blocks`
subdirectory. Much of the discussion below is still somewhat relevant
as background reading.

[basicblocks.js](https://github.com/sugarlabs/musicblocks/blob/master/js/basicblocks.js)
is where each block is defined, its palette assigned, its shape and
label defined, and any default arguments assigned.

[logo.js](https://github.com/sugarlabs/musicblocks/blob/master/js/logo.js)
is where the code associated with running each block is defined.

1. Define the type of block

`var uniquenameBlock = new ProtoBlock('uniquename');`

e.g., `var pitchNumberBlock = new ProtoBlock('pitchnumber');`

This creates a new instance of the class protoBlock, which is used to
create instances of the block.

2. Assign a palette to the block

`uniquenameBlock.palette = palettes.dict['yourpalettename'];`

e.g., `pitchNumberBlock.palette = palettes.dict['pitch'];`

The palette can be any of the palettes listed in `turtledef.js`. The
color of the block is defined by the palette used.

3. To add block to the protoblock dictionary

`blocks.protoBlockDict['uniquename'] = uniquenameBlock;`

e.g., `blocks.protoBlockDict['pitchnumber'] = pitchNumberBlock;`

4. Define additional block properties, e.g.,

* Define the block prototype

  `uniquenameBlock.oneArgBlock();`

e.g., `pitchNumberBlock.oneArgBlock();`

* Add a label to the block

  `uniquenameBlock.staticLabels.push(_('label'));`

e.g., `pitchNumberBlock.staticLabels.push(_('pitch number'));`
  
  * Adding more labels:
  
  `uniquenameBlock.staticLabels.push(_('label'), _('label'));`

Note that we use the _ function for marking strings for
translation. You may also want to provide a translation note to
explain to the translators what the label refers to, e.g.,
`//.TRANS: a mapping of pitch to the 88 piano keys`

The translation note should appear in the line above the string it
references.

* Add any default arguments

  Number: `uniquenameBlock.defaults.push(100);`
  
e.g., `pitchNumberBlock.defaults.push(7);`

  Text: `uniquenameBlock.defaults.push(_('label'));`

Note: if you want to add a fraction as an argument, e.g.,
`uniquenameBlock.defaults.push(1 / 4);`, you will need to define a
macro in `macro.js`:

  ```
    const UNIQUENAMEBLOCKOBJ = [
        [0, 'uniquenameblock', x, y, [null, 1, 4]],
        [1, 'divide', 0, 0, [0, 2, 3]],
        [2, ['number', {'value': 1}], 0, 0, [1]],
        [3, ['number', {'value': 4}], 0, 0, [1]],
        [4, 'vspace', 0, 0, [0, null]]
    ];
  ```

The format of a macro is the same as the format of saved projects: a list of blocks, which each block is defined by a list: [block number, block name, block x position, block y position, [list of block connections]]. Block name can also be a list, where the name of the block is the first item in the list and any special block data, e.g., a value in the case of a number block, is stored in a dictionary, e.g., [block name, {value: 123}]

* Override the default docktype if necessary

  Any input: `uniquenameBlock.dockTypes[1] = 'anyin'`;
  
  Text Input: `uniquenameBlock.dockTypes[1] = 'textin'`;
  
  Number Input: `uniquenameBlock.dockTypes[1] = 'numberin'`;

e.g., `pitchNumberBlock.dockTypes[1] = 'numberin';`

Check
[protoblock.js](https://github.com/sugarlabs/turtleblocksjs/blob/master/js/protoblocks.js) for additional block properties.

## Macro expansions

In some cases, you may want a block on the palette to expand into a stack
of blocks.

To add a macro:

1. be sure that there is a block defined in `basicblocks.js`;

2. add an entry in `BLOCKISMACRO` array `macros.js` in the `blockIsMacro`
function below with the block name from `basicblocks.js`;

3. define the macro (the JSON representation of the blocks that
the macro expands to, where the position is specified as x, y); and

4. add an entry to the `BUILTINMACROS` dictionary.

More details can be found in the comment at the top of `macros.js`.

## Examples

### A flow block:

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

### An arg block:

  ```
    var colorBlock = new ProtoBlock('color');
    colorBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['color'] = colorBlock;
    colorBlock.staticLabels.push(_('color'));
    colorBlock.adjustWidthToLabel();
    colorBlock.parameterBlock();
  ```

* A macro as seen in `basicblocks.js`:

  ```
    var newnoteBlock = new ProtoBlock('newnote');
    newnoteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newnote'] = newnoteBlock;
    newnoteBlock.staticLabels.push(_('note value'));
    newnoteBlock.adjustWidthToLabel();
    newnoteBlock.flowClampOneArgBlock();
    newnoteBlock.defaults.push(1 / 4);
  ```

* And it definition in `macros.js`:

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

## How to define block function in [logo.js](https://github.com/sugarlabs/musicblocks/blob/master/js/logo.js)

There are two basic types of blocks: *flow* blocks, that connect vertically, and *arg* blocks, that connect horizontally, into *flow* blocks.

There are switch statements in `logo.js` where the function of *flow* blocks and *arg* blocks are defined. 

  ```
        case 'uniquename':

            Your code here...

            break;
  ```

## Examples

### A *flow* block:

  ```
        case 'setturtlename2':
            if (args[0] != null) {
                that.turtles.turtleList[turtle].rename(args[0]);
            }
            break;
  ```

### An *arg* block:

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
  
### Setting up listeners in clamp blocks

Clamp blocks are a bit complicated since they have interior flows and
need to trigger a listener when that flow completes its execution.

1. ChildFlow and ChildFlowCount

`childFlow = args[n + 1]`, where n is the number of arguments passed to the blocks.

If there are no arguments, `childFlow = args[1]`. (Some blocks, such
as the *Start* block, do not have any external flow, so their
`childFlow = args[0]`.

2. Create a unique listener name

`var listenerName = '_listenername_' + turtle + '_' + blk;`

3. Assign the block that will dispatch the listener. _setDispatchBlock
will make this assignment for you (typically this is the block that
immediately follows the clamp block).

`that._setDispatchBlock(blk, turtle, listenerName);`

4. Create a listener event, where you typically clean up anything
associated with the clamp block's childFlow.

```
var __listener = function (event) {

};

```

## Using tone.js

[Tone.js](https://github.com/Tonejs/Tone.js) is "a framework for
creating interactive music in the browser. It provides advanced
scheduling capabilities, synths and effects, and intuitive musical
abstractions built on top of the Web Audio API."

Music Blocks uses the Tone.js API for many of the synth effects, such
as chorus, vibrato and tremolo.

In order to set up a new synth effect:
1. Add necessary parameters into `paramsEffects` object in `logo.js`
2. Add a boolean variable that triggers the param effects in `__hasParamEffect` function in `logo.js`
3. Add effects by defining parameters values in `logo.js`
4. Modify synth in `synthutils.js` and make sure to `dispose` synth after your effect has run.

## Odds and ends

* You should add your new block to the rubrics found in
  [rubrics.js](https://github.com/sugarlabs/musicblocks/blob/master/js/rubrics.js)

* As mentioned above, if you are adding user-facing strings, be sure
  to add them in this format: `_('string')` This allows the string to
  be set up for translation into other languages.
  
* Before processing the notes, you need to check if the argument is present
  of if the type of argument is correct, else, set `stopTurtle` to true.
  
* If you are changing the functionality of an existing block (adding a
  new arg, etc.) then you probably should mark the existing block as
  hidden and add a new block instead so as to not break existing
  projects that use the old block.

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
* `booleanOneArgBlock`: E.g., found mouse
* `booleanTwoArgBlock`: E.g., greater, less, equal.
* `parameterBlock`: E.g., color, shade, pensize

## FAQ

1. I want to take in a fraction as a single argument but it appears in
decimal with only one input field.

* You are probably missing the relevant parameters in `macro.js`. Take
  a look at other block examples and modify `macro.js` accordingly.

2. How do I get the information for the next note?

`var noteObj = getNote(note, octave, transposition, that.keySignature[turtle], that.movable[turtle], direction, that.errorMsg);`

3. How do I modify the pitch parameters, such as the octave or scalar transposition?
* To modify octave: `that.transposition[turtle] += transValue`
* To modify pitch: Take a look at the `addPitch` function
* To modify scalar transposition: `that.scalarTransposition[turtle] += transValue`
* To modify beat factor: `that.beatFactor[turtle] *= beatFactor`
* In some cases, you need to modify the beat factor accordingly with `bpm`

4. What are some useful functions?

There are many, but here are a few:
* `rationalToFraction`
* `addPitch`
* `lastNotePlayed`
* `pitchToFrequency`
* `pitchToNumber`
* `errorMsg`

## About the internal block format.

In `blocks.js` there is an instance variable, `blockList` that is a list of
the current set of blocks that Music Blocks knows about. There are
methods to add blocks to the list, notably `loadNewBlocks`. There is
even a block that can be used to create new blocks, enabling Music
Blocks programs to self-modify.

The internal format of this list is:

```
[block, block, block, ...]
```

Each block is itself a list of the form:

```
[block number, block name, x position, y position, [connection 0, connection 1...]]
```

where block number and the connections are integer indices into
`blockList`, block name is string that matches one of the blocks
defined in `basicblocks.js`, and the x and y positions are float value
screen coordinates.

For example, a *Note block* might look like this:

```
[[0, 'newnote', 100, 100, [null, 1, 4, null]],
 [1, 'divide', 0, 0, [0, 2, 3]],
 [2, ['number', {'value': 1}], 0, 0, [1]],
 [3, ['number', {'value': 4}], 0, 0, [1]],
 [4, 'vspace', 0, 0, [0, 5]],
 [5, 'pitch', 0, 0, [4, 6, 7, null]]
 [6, ['solfege', {'value': 'sol'}], 0, 0, [5]],
 [7, ['number', {'value': 4}], 0, 0, [5]],
]
```

The block names are the internal names, not the labels shown in the
interface. Hence *Note blocks* are `newnote` blocks.  Note that the
`newnote` block has 4 connections, two of which are null, since there
is no block connected above or below.  Also note that the only x, y
poaition that is relevant is that of the `newnote` block, since the
other blocks will be positioned by where they connect. (Typically, you
only need to worry about the position of the first block in a stack of
blocks. Everything else is calculated for you.)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/block-connections-diagram.svg
 "Blocks maintain a list of connections to other blocks.")

In the figure about and in the code example above, the `divide` block
connection 0 connects to the `newnote` block connection 1, etc.