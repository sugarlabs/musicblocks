// Copyright (c) 2014-19 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Definition of basic blocks common to all branches

// Some names changed between the Python verison and the
// JS version so look up name in the conversion dictionary.
var NAMEDICT = {
    fullscreen: "vspace",
    fillscreen2: "fillscreen",
    sandwichclampcollapsed: "clamp",
    ifelse: "ifthenelse",
    xcor: "x",
    ycor: "y",
    seth: "setheading",
    remainder2: "mod",
    plus2: "plus",
    product2: "multiply",
    division2: "divide",
    minus2: "minus",
    stack: "do",
    hat: "action",
    stopstack: "break",
    clean: "clear",
    setxy2: "setxy",
    greater2: "greater",
    less2: "less",
    equal2: "equal",
    random2: "random",
    setvalue: "setshade",
    setchroma: "setgrey",
    setgray: "setgrey",
    gray: "grey",
    chroma: "grey",
    value: "shade",
    hue: "color",
    startfill: "beginfill",
    stopfill: "endfill",
    string: "text",
    shell: "turtleshell"
};

// Define blocks here. Note: The blocks are placed on the palettes
// from bottom to top, i.e., the block at the top of a palette will be
// the last block added to a palette.

const initBasicProtoBlocks = (palettes, blocks) => {
    blocks.palettes = palettes;

    setupRhythmBlockPaletteBlocks();
    setupRhythmBlocks();
    setupMeterBlocks();
    setupPitchBlocks();
    setupIntervalsBlocks();
    setupToneBlocks();
    setupOrnamentBlocks();
    setupVolumeBlocks();
    setupDrumBlocks();
    setupWidgetBlocks();
    setupFlowBlocks();
    setupNumberBlocks();
    setupActionBlocks();
    setupBoxesBlocks();
    setupBooleanBlocks();
    setupHeapBlocks();
    setupExtrasBlocks();
    setupGraphicsBlocks();
    setupPenBlocks();
    setupMediaBlocks();
    setupSensorsBlocks();
    setupEnsembleBlocks();

    // Push protoblocks onto their palettes.
    for (let protoblock in blocks.protoBlockDict) {
        if (blocks.protoBlockDict[protoblock].palette != null) {
            blocks.protoBlockDict[protoblock].palette.add(
                blocks.protoBlockDict[protoblock]
            );
        }
    }
}
