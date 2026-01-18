# MusicBlocks/js

The core code for Music Blocks resides in this directory, the blocks and the turtleactions
subdirectory.

## Testing

For writing unit tests for block files, see [docs/TESTING.md](../docs/TESTING.md).

- `activity.js` -- where the menus are defined

Logo code
- `logo.js` -- the code associated with running blocks
- `turtle.js` -- the code associated with graphics

Blocks code
- `basicblocks.js` -- where the blocks are defined
- `blockfactory.js` -- where the block artwork is created
- `block.js` -- the core class for a block
- `blocks.js` -- utilities for managing the collection of blocks
- `macros.js` -- a collection of blocks associated with an action
- `protoblocks.js` -- the class of block prototypes

Palette-related code
- `artwork.js` -- the palette buttons and colors are defined here
- `palette.js` -- the blocks palettes

Export utilities
- `abc.js` -- save in ABC format
- `lilypond.js` -- save in Lilypond format

Other utilities
- `rubrics.js` -- analyse blocks in project
- `background.js` -- extension utilities
- `boundary.js` -- boundary box for home screen
- `loader.js` -- loader for require
- `sugarizer-compatibility.js` -- datastore utilities used by sugarizer
- `trash.js` -- trash can manager
- `turtledefs.js` -- strings and palettes unique to Music Blocks

In the `blocks` subdirectory is the code for generating blocks and
associating them with some action.

`BaseBlock.js` is the base class for all blocks. All of the other
files define blocks in each of the palettes:

## Music Palette
- `RhythmBlockPaletteBlocks.js`
- `RhythmBlocks.js`
- `MeterBlocks.js`
- `PitchBlocks.js`
- `IntervalsBlocks.js`
- `ToneBlocks.js`
- `OrnamentBlocks.js`
- `VolumeBlocks.js`
- `DrumBlocks.js`
- `WidgetBlocks.js`

## Flow Palette
- `FlowBlocks.js`
- `ActionBlocks.js`
- `BoxesBlocks.js`
- `NumberBlocks.js`
- `BooleanBlocks.js`
- `HeapBlocks.js`
- `ExtrasBlocks.js`

## Graphics Palette
- `GraphicsBlocks.js`
- `PenBlocks.js`
- `MediaBlocks.js`
- `SensorsBlocks.js`
- `EnsembleBlocks.js`

## Subdirectories with additional utilities
- utils -- additional general-purpose utilities
  - `munsell.js` -- Munsell color system used for mice and widgets
  - `musicutils.js` -- related to musical notations
  - `platformstyle.js` -- checking platform that Music Blocks is run in
  - `synthutils.js` -- related to defining synths in tone.js
  - `utils.js` -- general utility functions
- widgets -- widget code
  - `help.js` -- show help for individual blocks and the tour of Music Blocks
  - `modewidget.js` -- explore musical modes
  - `pitchdrummatrix.js` -- map pitches to drum sounds
  - `pitchslider.js` -- generate pitch blocks based on frequency (in Hertz)
  - `pitchstaircase.js` -- generate a collection of pitches based on ratios of frequency (Hertz)
  - `pitchtimematrix.js` -- map pitch to rhythm
  - `rhythmruler.js` -- define rhythms
  - `status.js` -- track the status of parameters
  - `tempo.js` -- change the tempo
  - `timbre.js` -- design new instruments
