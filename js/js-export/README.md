# js/js-export

The core code for the JavaScript based Music Blocks framework resides
in this directory and the API subdirectory.

The JavaScript code is written and viewed on the **JavaScript Editor**
widget which can be opened by pressing on the "*Toggle JavaScript
Editor*" (`<>`) button in the auxilliary menu.

The code corresponding to the JavaScript Editor widget is in
`widgets/jseditor.js`.

* `export.js` — contains the utilities for processing the JavaScript
  based Music Blocks programs.

* `generate.js` — contains the utilities for generating code from the
  block stacks.

* `ASTutils.js` — contains the utilities for generating the *Abstract
  Syntax Tree* (*AST*) in `ESTree` specification, for the corresponding
  code to the block stacks. Used by `JSGenerate` class in `generate.js`.

* `interface.js` — contains lookups tables (to method names) and lists
  of certain block names: used for the *AST* generation. Also contains
  the contraints and logic for argument validation for blocks.

* `constraints.js` — contains the constraint definitions for the API methods'
  arguments, for validation in `interface.js`.

* `sample.js` — contains the help (guide) for the API, and some example codes.

The `API` subdirectory stores the API method definitions of each block.

* `API/RhythmBlocksAPI.js` — pertaining to *Rhythm* palette blocks.

* `API/MeterBlocksAPI.js` — pertaining to *Meter* palette blocks.

* `API/PitchBlocksAPI.js` — pertaining to *Pitch* palette blocks.

* `API/IntervalsBlocksAPI.js` — pertaining to *Intervals* palette blocks.

* `API/ToneBlocksAPI.js` — pertaining to *Tone* palette blocks.

* `API/OrnamentBlocksAPI.js` — pertaining to *Ornament* palette blocks.

* `API/VolumeBlocksAPI.js` — pertaining to *Volume* palette blocks.

* `API/DrumBlocksAPI.js` — pertaining to *Drum* palette blocks.

* `API/GraphicsBlocksAPI.js` — pertaining to *Graphics* palette blocks.

* `API/PenBlocksAPI.js` — pertaining to *Pen* palette blocks.

For the remaining supported blocks, the code is in native JavaScript
syntax. The `getter` and `setter` blocks' `GET`/`SET` definitions are
directly defined in `export.js`.

## Mechanics behind the JavaScript Export framework

There are three crucial component of the JavaScript based Music Blocks
code — a `Mouse` object, `API` methods, and a `MusicBlocks` class.

Each `Mouse` object encapsulates a `Turtle` object, and each `Mouse`
object in turn (internally) points to a `MusicBlocks` object. The
`MusicBlocks` class is responsible for all the functional behavior of
the JavaScript based MusicBlocks code. Each block in Music Blocks
corresponds to either a `method` defined in the `API`, or an ES6
`GET`/`SET` call, or some native JavaScript syntax.

The code generation begins with the parsing of the `start` and
`action` block stacks in the project.  Each stack is parsed to form a
tree structure where at any level, every block entry has the name of
the block, the chain of the arguments, the first flow tree (for a
`clamp` block), and the second flow tree (for a `doubleclamp` block).

The tree structure is then parsed and corresponding *Abstract Syntax
Trees* (*ASTs*) are generated for each code block, recursively. All
the *ASTs* are then put together and serialized to valid JavaScript
code using a library called `AString`. The corresponding code for each
block is in accordance with the ones defined in the `API`. The
`JSInterface` class in `interface.js` acts as the bridge between the
two.

## How to add support of a new palette and blocks

Most all the API members internally call a behavior action
corresponding to its block behavior, mostly defined in
`js/turtleactions/`. On adding a new palette, add the behavior code
for each block in a new file.

e.g. say a new palette is called `MyPalette`, and its blocks are
`myblk1`, `myblk2`.

* Create a file in `js/turtleactions/` as `MyPaletteActions.js`.
* Add the following snippet:

  ```
  function setupMyPaletteActions() {
      // Singer (for music actions) or Painter (for drawing actions) or simply MyPaletteActions
      Singer.MyPaletteActions = class {
          // these functions are the ones to be used by the blocks API in `js/blocks` for their
          // corresponding blocks.

          static myblk1(..., turtle, blk) {
              // behavior code for myblk1
          }

          static myblk2(..., turtle, blk) {
              // behavior code for myblk2
          }
      }
  }
  ```

* Create a file in `js/js-export/API` as `MyPaletteBlocksAPI.js`.
* Add the following snippet:

  ```
  class MyPaletteBlocksAPI {
      // say myblk1 is a flow block
      myblk1(...) {
          // validateArgs will check for the validity of the arguments of "myblk1" according to the
          // constraints provided in `interface.js`. In case of invalidity, it'll change the
          // respective argument to a default value or throw an error.
          // See next section for more details.
          // the first argument is the block name, and the second it the list of arguments.
          let args = JSInterface.validateArgs("myblk1", [...]);
          return this.runCommand("myblk1", [args[0], args..., this.turIndex, MusicBlocks.BLK]);
      }

      // say myblk2 is a clamp block
      async myblk2(..., flow) {
          let args = JSInterface.validateArgs("myblk2", [..., flow]);
          await this.runCommand("myblk2", [args[0], args..., this.turIndex, MusicBlocks.BLK]);
          await last(args)();
          return this.ENDFLOWCOMMAND;
      }
  }
  ```

* If block is to be represented as `GET` or `SET`, add the following
  in `export.js`:

  ```
  // for SET
  set BLOCKNAME(...) {
      let args = JSInterface.validateArgs("BLOCKNAME", [...]);
      Singer.VolumeActions.setMasterVolume(args[0], args..., this.turIndex);
  }

  // for GET
  get BLOCKNAME() {
      return /*Singer or Painter . (dot)*/MyPaletteActions.methodname();
  }
  ```

* Add (`Singer` or `Painter` . [`dot`])`MyPaletteActions` in
 `actionClassNames` in `CreateAPIMethodList` function in `init` method
 of `MusicBlocks` class.

* Add `MyPaletteBlocksAPI` in `APIClassNames` list in the
 `constructor` of `MusicBlocks` class.

If support for a block already part of any existing palette is to be
added, navigate to the file and class for the palette and add the
relevant methods inside it.

## How to add Argument Validation

Argument constraints are added in the `_methodArgConstraints` object
in `interface.js`.

To add constraints for a new block, follow the format:

```
"blockname": [
    {
        "type": "",
        "constraints": {
            "type": "",
            "constraints": {
                ...
            }
        }
    },
    {
        ...
    },
    ...
]
```

Basically, each block maps to a list of JSON-object entries, one for
each argument in the API. Each entry has two top-level keys: `"type"`
and `"constraints"`. `"type"` specifies the data-type: `"string"`,
`"boolean"`, or `"number"`.

The "constraints" formats for each are as follows:

* "boolean": no "constraints" key

* "number":
  ```
  {
      "min": <minimum value>,
      "max": <maximum value>,
      "integer": <true> or <false>  // true means integer number
  }
  ```

* "string":
  * for any string
    ```
    {
        "type": "any"
    }
    ```

  * for special cases
    ```
    {
        "type": "solfegeorletter" // for ["sol", "G", "g", "sol sharp", "sol ♯", "G ♯", etc.]
    }
    ```
    ```
    {
        "type": "accidental"      // for ["sharp", "♯", etc.]
    }
    ```
    ```
    {
        "type": "drum"            // for ["kick drum", "crash", etc.]
    }
    ```
    ```
    {
        "type": "synth"           // for ["electric guitar", "piano", etc.]
    }
    ```
    ```
    {
        "type": "letterkey"       // for ["c", "C", "C ♯", "C sharp", etc.]
    }
    ```

  * for one of a list
    ```
    {
        "type": "oneof",
        "values": ["str1", "srt2", ...],
        "defaultIndex": <index number in "values" list>   // value set if neither matches
    }
    ```

* "function":
  ```
  {
      "async": true
  }
  ```

The cases are handled in the `validateArgs` method. To add support for
more types or subtypes work on the `switch-case` block inside it.

## What is the code syntax?

* for a new `Mouse`
  ```
  new Mouse(async mouse => {
      // statements for the turtle/mouse
  });
  ```

* for an `action` block
  ```
  let action1 = async mouse => {
      // statements for action
  }
  ```

* statements
  * flow block
    ```
    await mouse.methodName(... /*arguments*/);
    ```

  * clamp block
    ```
    await mouse.methodName(... /*value arguments*/, async () => {
        // statements inside the clamp
    });
    ```

  * call `action`
    ```
    await action1(mouse);
    ```

  * setter
    ```
    mouse.SETTERNAME = <value>;
    ```

  * getter (in argument/s)
    ```
    mouse.GETTERNAME
    ```

* (finally) to run
  ```
  MusicBlocks.run();
  ```

### Example code

For the block stacks (and mouse art generated after running),

![Example Project](./samples/mode-up-down.png)

the following code is generated:

```
let action = async mouse => {
    await mouse.playNote(1 / 4, async () => {
        await mouse.playPitch("do", 4);
        console.log(mouse.NOTEVALUE);
        return mouse.ENDFLOW;
    });
    let box1 = 0;
    let box2 = 360 / mouse.MODELENGTH;
    for (let i0 = 0; i0 < mouse.MODELENGTH * 2; i0++) {
        await mouse.playNote(1 / 4, async () => {
            if (box1 < mouse.MODELENGTH) {
                await mouse.stepPitch(1);
                await mouse.turnRight(box2);
            } else {
                await mouse.stepPitch(-1);
                await mouse.turnLeft(box2);
            }
            await mouse.goForward(100);
            return mouse.ENDFLOW;
        });
        box1 = box1 + 1;
    }
    return mouse.ENDFLOW;
};
new Mouse(async mouse => {
    await mouse.clear();
    await mouse.setInstrument("guitar", async () => {
        await mouse.setColor(50);
        await action(mouse);
        return mouse.ENDFLOW;
    });
    return mouse.ENDMOUSE;
});
MusicBlocks.run();
```

Here's the complete [API](./samples/sample.js) of methods, getters, setters.
