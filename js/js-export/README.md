# js/js-export

The core code for the JavaScript based Music Blocks framework resides in this directory and the
API subdirectory.

The JavaScript code is written and viewed on the **JavaScript Editor** widget which can be opened
by pressing on the "*Toggle JavaScript Editor*" (`<>`) button in the auxilliary menu.

The code corresponding to the JavaScript Editor widget is in `widgets/jseditor.js`.

* `export.js` — contains the utilities for processing the JavaScript based Music Blocks programs.

* `generate.js` — contains the utilities for generating code from the block stacks.

* `ASTutils.js` — contains the utilities for generating the *Abstract Syntax Tree* (*AST*) in
`ESTree` specification, for the corresponding code to the block stacks. Used by `JSGenerate` class
in `generate.js`.

* `interface.js` — contains lookups tables (to method names) and lists of certain block names: used
for the *AST* generation. Also contains the contraints and logic for argument validation for blocks.

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

For the remaining supported blocks, the code is in native JavaScript syntax. The `getter` and
`setter` blocks' `GET`/`SET` definitions are directly defined in `export.js`.

## Mechanics behind the JavaScript Export framework

There are three crucial component of the JavaScript based Music Blocks code — a `Mouse` object,
`API` methods, and a `MusicBlocks` class.

Each `Mouse` object encapsulates a `Turtle` object, and each `Mouse` object in turn (internally)
points to a `MusicBlocks` object. The `MusicBlocks` class is responsible for all the functional
behavior of the JavaScript based MusicBlocks code. Each block in Music Blocks corresponds to either
a `method` defined in the `API`, or an ES6 `GET`/`SET` call, or some native JavaScript syntax.

The code generation begins with the parsing of the `start` and `action` block stacks in the project.
Each stack is parsed to form a tree structure where at any level, every block entry has the name of
the block, the chain of the arguments, the first flow tree (for a `clamp` block), and the second flow
tree (for a `doubleclamp` block).

The tree structure is then parsed and corresponding *Abstract Syntax Trees* (*ASTs*) are generated
for each code block, recursively. All the *ASTs* are then put together and serialized to valid
JavaScript code using a library called `AString`. The corresponding code for each block is in
accordance with the ones defined in the `API`. The `JSInterface` class in `interface.js` acts as the
bridge between the two.

## How to add support of a new palette and blocks

Most all the API members internally call a behavior action corresponding to its block behavior,
mostly defined in `js/turtleactions/`. On adding a new palette, add the behavior code for each block
in a new file.

e.g. say a new palette is called `MyPalette`, and its blocks are `myblk1`, `myblk2`.

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
* If block is to be represented as `GET` or `SET`, add the following in `export.js`:
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
* Add (Singer or Painter . [`dot`])`MyPaletteActions` in `actionClassNames` in `CreateAPIMethodList`
function in `init` method of `MusicBlocks` class.
* Add `MyPaletteBlocksAPI` in `APIClassNames` list in the `constructor` of `MusicBlocks` class.
