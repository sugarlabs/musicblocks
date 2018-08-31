# __How To Add BLocks__

This document describes for developers how to add new blocks in
support of additional functionality by changes to the core code of
Music and Turtle Blocks.

A complete block is made in two steps: (1) defining the new block in
basicblocks.js; and (2) and writing the corresponding code to be run
when the block is run in logo.js.

## How to make your block a part of the main repository

1. Make your own copy of the musicblocks git repository by cloning the
official [respository](https://github.com/sugarlabs/musicblocks.git)

2. Create your block and make a pull request.

## How to create new blocks
All blocks are present in a simple format.

For most blocks, there are two files that need to be edited in order
to add a block:
[basicblocks.js](https://github.com/sugarlabs/musicblocks/blob/master/js/basicblocks.js)
and
[logo.js](https://github.com/sugarlabs/musicblocks/blob/master/js/logo.js).
`basicblocks.js` is where the block is defined, its palette assigned,
its shape and label defined, and any default arguments
assigned. `logo.js` is where the code associated with running the
block is defined.

1. Define the type of block.
  
   `var newblock = new protoBlock('uniquename');`
  
   This creates a new instance of the class protoBlock which is used
   to create a new block. Unique name cannot match the name of any
   other block.
   
2. Assign the block to a palette.
  
   `newlock.palette = palettes.dict['palettename'];`

   Palettename can be pitch, tone, rythm, etc. The color of the block
   is determined by the palette to which it is assigned. A complete
   list of available palettes is found in
   [turtledef.js](https://github.com/sugarlabs/musicblocks/blob/master/js/turtledefs.js).

3. To add block to the protoblock dictionary.
    
    `blocks.protoBlockDict['uniquename'] = newblock;`

4. Decide whether the block should appear on the palette. 
   
     `newblock.hidden = true;`
     
     When true, the block is not shown on the palette. (Generally, you
     would not use this feature.)
  
5. Define the required properties of the block.
     
     Here are some examples of properties you can add to the block:
     
     * Add static labels to the block with `newblock.staticLabels.push(_('label'));` 
     * Adjust width of block to label size with `newblock.adjustWidthToLabel()`

  You can check the available properties on
  [protoblock.js](https://github.com/sugarlabs/turtleblocksjs/blob/master/js/protoblocks.js).
  Depending on your needs, you can add more features and properties.

6. Macro expansions

 Sometimes it is desirable to expand a block into a stack of blocks
 upon loading. For example, when you load a `note value` block, you
 also get a pitch block included. We do this by defining `macros`.

 To add a macro:

 (1) you need to ensure that there is a block defined in
 `basicblocks.js`;
 
 (2) add an entry in BLOCKISMACRO array in the blockIsMacro function
 below with the block name from basicblocks.js;

 (3) define the macro (the JSON representation of the blocks that
 the macro expands to, where the position is specified as x, y); and

 (4) add an entry to the BUILTINMACROS dictionary.  

#### Example

    var newblock = new ProtoBlock('square');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['square'] = newblock;
    newblock.hidden = true;
    //.TRANS: square wave
    newblock.staticLabels.push(_('square'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(440);

## Making your block do something.

Once you create a block, you will want to associate some functionality
to it. This is done in
[logo.js](https://github.com/sugarlabs/musicblocks/blob/master/js/logo.js).
     
There are two different places to add your code, depending upon
whether you block is a `flow` block, with in-flow and out-flow
connections for vertical connections, or an `arg` block, which only
connects horizonally into flow blocks or other arg blocks. For
example, the `setcolor' block is a flow block that can connect
veritcally in a stack of blocks. The number block that connects to it
horizontally is an arg block.

There are two switch statements in `logo.js`, one for flow blocks
and one for arg blocks. Be sure to add your code to the proper
switch statement.

     `case 'uniquename':`
          Here the uniquename is the same as the one in basicblocks.js.
	  `break;`

#### Examples

Several flow blocks associated with the heap are shown below. Many
take arguments as inputs, e.g., `push`, which takes an argument to
push onto the heap.

        case 'showHeap':
            if (!(turtle in that.turtleHeaps)) {
                that.turtleHeaps[turtle] = [];
            }
            that.textMsg(JSON.stringify(that.turtleHeaps[turtle]));
            break;
        case 'emptyHeap':
            that.turtleHeaps[turtle] = [];
            break;
        case 'reverseHeap':
            that.turtleHeaps[turtle] = that.turtleHeaps[turtle].reverse();
            break;
        case 'push':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (!(turtle in that.turtleHeaps)) {
                that.turtleHeaps[turtle] = [];
            }

            that.turtleHeaps[turtle].push(args[0]);
            break;

`pop` is an arg block. Arg blocks assign their results to the block
`value`.

            case 'pop':
                var block = that.blocks.blockList[blk];
                if (turtle in that.turtleHeaps && that.turtleHeaps[turtle].length > 0) {
                    block.value = that.turtleHeaps[turtle].pop();
                } else {
                    that.errorMsg(_('empty heap'));
                    block.value = 0;
                }
                break;

## Assigning your block in [rubrics.js](https://github.com/sugarlabs/musicblocks/blob/master/js/rubrics.js)

Here you assign a block according to its bin.

Check which bin belongs to which pallete, and then according to assign your block to the bin.

Example:
    ```
    'forward': 'forward', 'back': 'forward','
    ```

Here both forward and backward blocks are mentioned together,they are
both responsible for movement;sos
     
## References
Sample block artwork

![pitch name](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/pitchname.svg)

![note value](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/notevalue.svg)

Valid blocks styles in turtleblocksjs:
* `zeroArgBlock`: E.g., penup, pendown
* `basicBlockNoFlow`: E.g., break
* `oneArgBlock`: E.g., forward, right
* `twoArgBlock`: E.g., setxy. These are expandable.
* `oneArgMathBlock`: E.g., sqrt
* `oneArgMathWithLabelBlock`: E.g., box
* `twoArgMathBlock`: E.g., plus, minus, multiply, divide. These are also expandable.
* `valueBlock`: E.g., number, string. Value blocks get DOM textareas associated with them so their values can be edited by the user.
* `mediaBlock`: E.g., media. Media blocks invoke a chooser and a thumbnail image is overlayed to represent the data associated with the block.
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

Information about new block and protoblock types will be added soon.

