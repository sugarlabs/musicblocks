// Copyright (c) 2014-21 Walter Bender
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

/*
   global

   setupRhythmBlockPaletteBlocks, setupRhythmBlocks, setupMeterBlocks,
   setupPitchBlocks, setupIntervalsBlocks, setupToneBlocks,
   setupOrnamentBlocks, setupVolumeBlocks, setupDrumBlocks,
   setupWidgetBlocks, setupFlowBlocks, setupNumberBlocks,
   setupActionBlocks, setupBoxesBlocks, setupBooleanBlocks,
   setupHeapBlocks, setupDictBlocks, setupExtrasBlocks,
   setupProgramBlocks, setupGraphicsBlocks setupPenBlocks,
   setupMediaBlocks, setupSensorsBlocks, setupEnsembleBlocks
 */

/*
   exported

   initBasicProtoBlocks, BACKWARDCOMPATIBILIYDICT
 */

const BACKWARDCOMPATIBILIYDICT = {
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
/**
 * @public
 * @param  {Object} palettes
 * @param  {Object} blocks
 * @returns {void}
 */
const initBasicProtoBlocks = (activity) => {
    activity.blocks.palettes = activity.palettes;
    setupRhythmBlockPaletteBlocks(activity);
    setupRhythmBlocks(activity);
    setupMeterBlocks(activity);
    setupPitchBlocks(activity);
    setupIntervalsBlocks(activity);
    setupToneBlocks(activity);
    setupOrnamentBlocks(activity);
    setupVolumeBlocks(activity);
    setupDrumBlocks(activity);
    setupWidgetBlocks(activity);
    setupFlowBlocks(activity);
    setupNumberBlocks(activity);
    setupActionBlocks(activity);
    setupBoxesBlocks(activity);
    setupBooleanBlocks(activity);
    setupHeapBlocks(activity);
    setupDictBlocks(activity);
    setupExtrasBlocks(activity);
    setupProgramBlocks(activity);
    setupGraphicsBlocks(activity);
    setupPenBlocks(activity);
    setupMediaBlocks(activity);
    setupSensorsBlocks(activity);
    setupEnsembleBlocks(activity);

    // Push protoblocks onto their palettes.
    for (const protoblock in activity.blocks.protoBlockDict) {
        if (activity.blocks.protoBlockDict[protoblock].palette != null) {
            activity.blocks.protoBlockDict[protoblock].palette.add(
                activity.blocks.protoBlockDict[protoblock]
            );
        }
    }
};
