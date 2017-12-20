# __How To Add BLocks__
This document describes for developers how to add new blocks in support
of additional functionality by changes to the
core code of Turtle Blocks. 

## How to make your block a part of the main repository

 Make your own copy by cloning the official [respository](https://github.com/walterbender/musicblocks.git) 
 Create your block and make a pull request.

## How to create new blocks
All blocks are present in a simple format.

For most blocks, there are two files that need to be edited in order to add a block: `[basicblocks.js](https://github.com/walterbender/musicblocks/blob/master/js/basicblocks.js)` and `[logo.js](https://github.com/walterbender/musicblocks/blob/master/js/logo.js)`. `basicblocks.js` is where the block is defined, its palette assigned, its shape and label defined, and any default arguments assigned. logo.js is where the code associated with running the block is defined.

1) Define the type of block
  
   `var uniquenameBlock = new protoBlock('uniquename');`
  
   This creates a new instance of the class protoBlock which is used to create a new block.
   
2)  Assign a palette to the block
  
    `uniquenameBlock.palette = palettes.dict['character'];`
    Here character can be pitch,tone,rythm etc.. Colour of the block is decided by the palette used.


3)  To add block to the protoblock dictionary
    
    `blocks.protoBlockDict['uniquename'] = uniquenameBlock;`


4)  Decide whether the block should appear on the palette. 
   
     `uniquenameBlock.hidden = true;`
     
     This is a hidden flag used to hide such a block.
  
  
5)  Define the required properties of the block
     
     Here are some examples of properties you can add to the block:
     
     1. Add static labels to the block
        `uniquenameBlock.staticLabels.push(_('label'));` 
     2. Adjust width of block to label size
        `uniquenameBlock.adjustWidthToLabel()`

  
  check the available properties on [protoblock.js](https://github.com/walterbender/turtleblocksjs/blob/master/js/protoblocks.js)
  and depending on your needs you can add more features and properties.

 Macro expansions

 To add a macro:
 (1) you need to ensure that there is a block defined in
 basicblocks.js;
 (2) add an entry in BLOCKISMACRO array in the blockIsMacro function
 below with the block name from basicblocks.js;
 (3) define the macro (the JSON representation of the blocks that
 the macro expands to, where the position is specified as x, y); and
 (4) add an entry to the BUILTINMACROS dictionary.  

## Example
  ```
    var squareBlock = new ProtoBlock('square');
    squareBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['square'] = squareBlock;
    squareBlock.hidden = true;
    //.TRANS: square wave
    squareBlock.staticLabels.push(_('square'));
    squareBlock.adjustWidthToLabel();
    squareBlock.oneArgBlock();
    squareBlock.defaults.push(440);
  ```


## References
Sample block artwork
![Empty block](https://github.com/walterbender/musicblocks/blob/master/images/emptybox.svg)

![Current pitch name](https://github.com/walterbender/musicblocks/blob/master/documentation/currentpitchname.svg)												

![Note](https://github.com/walterbender/musicblocks/blob/master/documentation/note.svg)																	


Valid blocks styles in turtleblocksjs:
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

Information about new block and protoblock types will be added soon.