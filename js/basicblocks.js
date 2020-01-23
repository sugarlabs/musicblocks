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
    'fullscreen': 'vspace',
    'fillscreen2': 'fillscreen',
    'sandwichclampcollapsed': 'clamp',
    'ifelse': 'ifthenelse',
    'xcor': 'x',
    'ycor': 'y',
    'seth': 'setheading',
    'remainder2': 'mod',
    'plus2': 'plus',
    'product2': 'multiply',
    'division2': 'divide',
    'minus2': 'minus',
    'stack': 'do',
    'hat': 'action',
    'stopstack': 'break',
    'clean': 'clear',
    'setxy2': 'setxy',
    'greater2': 'greater',
    'less2': 'less',
    'equal2': 'equal',
    'random2': 'random',
    'setvalue': 'setshade',
    'setchroma': 'setgrey',
    'setgray': 'setgrey',
    'gray': 'grey',
    'chroma': 'grey',
    'value': 'shade',
    'hue': 'color',
    'startfill': 'beginfill',
    'stopfill': 'endfill',
    'string': 'text',
    'shell': 'turtleshell'
};


// Define blocks here. Note: The blocks are placed on the palettes
// from bottom to top, i.e., the block at the top of a palette will be
// the last block added to a palette.

function initBasicProtoBlocks(palettes, blocks) {
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

    // RHYTHM PALETTE

    // WIDGETS PALETTE

    // ACTIONS PALETTE

    var newblock = new ProtoBlock('drum');
    newblock.palette = palettes.dict['extras'];
    newblock.staticLabels.push(_('start drum'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.stackClampZeroArgBlock();
    newblock.hidden = true;
    newblock.deprecated = true;

    // FLOW PALETTE

    var newblock = new ProtoBlock('duplicatefactor');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['duplicatefactor'] = newblock;
    //.TRANS: factor used in determining how many duplications to make
    newblock.staticLabels.push(_('duplicate factor'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.hidden = true;

    var newblock = new ProtoBlock('hiddennoflow');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['hiddennoflow'] = newblock;
    newblock.hiddenNoFlow = true;
    newblock.hiddenBlockNoFlow();
    newblock.hidden = true;

    var newblock = new ProtoBlock('hidden');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['hidden'] = newblock;
    newblock.hiddenBlockFlow();
    newblock.hidden = true;

    // NOP blocks (used as placeholders when loaded blocks not found)
    var newblock = new ProtoBlock('nopValueBlock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['nopValueBlock'] = newblock;
    newblock.staticLabels.push(_('unknown'));
    newblock.adjustWidthToLabel();
    newblock.valueBlock();
    newblock.dockTypes[0] = 'anyout';
    newblock.hidden = true;

    var newblock = new ProtoBlock('nopOneArgMathBlock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['nopOneArgMathBlock'] = newblock;
    newblock.oneArgMathBlock();
    newblock.staticLabels.push(_('unknown'));
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    newblock.hidden = true;

    var newblock = new ProtoBlock('nopTwoArgMathBlock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['nopTwoArgMathBlock'] = newblock;
    newblock.twoArgMathBlock();
    newblock.staticLabels.push(_('unknown'));
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.hidden = true;

    var newblock = new ProtoBlock('nopZeroArgBlock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['nopZeroArgBlock'] = newblock;
    newblock.staticLabels.push(_('unknown'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    newblock.hidden = true;

    var newblock = new ProtoBlock('nopOneArgBlock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['nopOneArgBlock'] = newblock;
    newblock.staticLabels.push(_('unknown'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.hidden = true;

    var newblock = new ProtoBlock('nopTwoArgBlock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['nopTwoArgBlock'] = newblock;
    newblock.staticLabels.push(_('unknown'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.hidden = true;

    var newblock = new ProtoBlock('nopThreeArgBlock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['nopThreeArgBlock'] = newblock;
    newblock.staticLabels.push(_('unknown'));
    newblock.adjustWidthToLabel();
    newblock.threeArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.dockTypes[3] = 'anyin';
    newblock.hidden = true;

    // Push protoblocks onto their palettes.
    for (var protoblock in blocks.protoBlockDict) {
        if (blocks.protoBlockDict[protoblock].palette != null) {
            blocks.protoBlockDict[protoblock].palette.add(blocks.protoBlockDict[protoblock]);
        }
    }
}
