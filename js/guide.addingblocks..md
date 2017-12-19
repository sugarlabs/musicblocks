# __How To Add BLocks__


This allows developers to add new palettes and blocks to support
additional functionality after making changes to the
core code of Turtle Blocks. 

## how to make blocks
All blocks are present in a simple format.

1) define the type of block
  
   var aBlock = new protoBlock('a');
  
   here 'a' can be square,trianglemodename,etc.

   This decides what the block will represent
   
   
2)  define the charcateristic of the block
  
    aBlock.pallete = palletes.dict['character'];
    here character can be pitch,tone,rythm,etc.


3)  to use general propeties use the protoblock.js file
    
    blocks.protoBlockDict['a'] = aBlock;


4)  decide wheteher the block is an internal property or not. If you do not have to display the block use-
   
     aBlocks.hidden = true;
     
     if the block is supposed to be visible , there is no need for this line.
  
  
5)   define the required properties of the block in the format-
     
     aBlock.propety();  

  
  check the available properties on  [protoblock.js](https://github.com/walterbender/turtleblocksjs/blob/master/js/protoblocks.js)
  and depending on your needs you can add more features and properties.

## Example

    var squareBlock = new ProtoBlock('square');
    squareBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['square'] = squareBlock;
    squareBlock.hidden = true;
    //.TRANS: square wave
    squareBlock.staticLabels.push(_('square'));
    squareBlock.adjustWidthToLabel();
    squareBlock.oneArgBlock();
    squareBlock.defaults.push(440);
  
## How to add block

 Make your own copy by cloning the official [respository](https://github.com/walterbender/musicblocks.git) 
 add your block and make a pull request.


## References
																													
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
