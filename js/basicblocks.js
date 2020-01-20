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

function initBasicProtoBlocks(palettes, blocks, beginnerMode) {
    blocks.palettes = palettes;
    var language = localStorage.languagePreference;
    if (language === undefined) {
        language = navigator.language;
    }

    console.debug('language setting is ' + language);

    setupRhythmBlocks();
    setupMeterBlocks();
    setupPitchBlocks();
    setupIntervalsBlocks();
    setupToneBlocks();
    setupOrnamentBlocks();
    
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

    if (language === 'ja') {
        var rhythmBlockPalette = 'rhythm';
    } else {
        var rhythmBlockPalette = 'widgets';
    }

    var newblock = new ProtoBlock('rhythm');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    //.TRANS: an arrangement of notes based on duration
    if (language === 'ja') {
        //.TRANS: rhythm block
        newblock.staticLabels.push(_('rhythm1'));
    } else {
        newblock.staticLabels.push(_('rhythm'));
    }
    newblock.staticLabels.push(_('number of notes'), _('note value'));
    newblock.extraWidth = 10;
    newblock.defaults.push(3);
    newblock.defaults.push(4);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.hidden = true;
    newblock.deprecated = true;
    
    var newblock = new ProtoBlock('rhythm2');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    //.TRANS: an arrangement of notes based on duration
    if (language === 'ja') {
        //.TRANS: rhythm block
        newblock.staticLabels.push(_('rhythm1'));
    } else {
        newblock.staticLabels.push(_('rhythm'));
    }
    newblock.staticLabels.push(_('number of notes'), _('note value'));
    newblock.extraWidth = 10;
    newblock.defaults.push(3);
    newblock.defaults.push(4);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';

    // macro
    var newblock = new ProtoBlock('sixtyfourthNote');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['sixtyfourthNote'] = newblock;
    newblock.staticLabels.push(_('1/64 note') + ' 𝅘𝅥𝅱');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('sixtyfourthNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('thirtysecondNote');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['thirtysecondNote'] = newblock;
    newblock.staticLabels.push(_('1/32 note') + ' 𝅘𝅥𝅰');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('thirtysecondNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('sixteenthNote');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['sixteenthNote'] = newblock;
    newblock.staticLabels.push(_('1/16 note') + ' 𝅘𝅥𝅯');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('sixteenthNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('eighthNote');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['eighthNote'] = newblock;
    newblock.staticLabels.push(_('eighth note') + ' ♪');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('eighthNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('quarterNote');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['quarterNote'] = newblock;
    newblock.staticLabels.push(_('quarter note') + ' ♩');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('quarterNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('halfNote');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['halfNote'] = newblock;
    newblock.staticLabels.push(_('half note') + ' 𝅗𝅥');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('halfNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('wholeNote');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['wholeNote'] = newblock;
    newblock.staticLabels.push(_('whole note') + ' 𝅝');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('wholeNote')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('tuplet2');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['tuplet2'] = newblock;
    //.TRANS: A tuplet is a note value divided into irregular time values.
    newblock.staticLabels.push(_('tuplet'));
    newblock.staticLabels.push(_('number of notes'));
    newblock.staticLabels.push(_('note value'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.defaults.push(1);
    newblock.defaults.push(4);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('tuplet3');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['tuplet3'] = newblock;
    newblock.staticLabels.push(_('tuplet'));
    newblock.staticLabels.push(_('number of notes'), _('note value'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.defaults.push(1);
    newblock.defaults.push(4);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('tuplet4');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['tuplet4'] = newblock;
    newblock.staticLabels.push(_('tuplet'));
    newblock.staticLabels.push(_('note value'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(1 / 4);
    if (beginnerMode && !beginnerBlock('tuplet4')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('stuplet7');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['stuplet7'] = newblock;
    //.TRANS: A tuplet divided into 7 time values.
    newblock.staticLabels.push(_('septuplet'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('stuplet7')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('stuplet5');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['stuplet5'] = newblock;
    //.TRANS: A tuplet divided into 5 time values.
    newblock.staticLabels.push(_('quintuplet'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('stuplet5')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('stuplet3');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['stuplet3'] = newblock;
    //.TRANS: A tuplet divided into 3 time values.
    newblock.staticLabels.push(_('triplet'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('stuplet3')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('stuplet');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['stuplet'] = newblock;
    newblock.staticLabels.push(_('simple tuplet'));
    newblock.staticLabels.push(_('number of notes'), _('note value'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push(3);
    newblock.defaults.push(1 / 2);
    if (beginnerMode && !beginnerBlock('stuplet')) {
        newblock.hidden = true;
    }

    // WIDGETS PALETTE

    var newblock = new ProtoBlock('envelope');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['envelope'] = newblock;
    //.TRANS: sound envelope (ADSR)
    newblock.staticLabels.push(_('envelope'));
    //.TRANS: Attack time is the time taken for initial run-up of level from nil to peak, beginning when the key is first pressed.
    newblock.staticLabels.push(_('attack'));
    //.TRANS: Decay time is the time taken for the subsequent run down from the attack level to the designated sustain level.
    newblock.staticLabels.push(_('decay'));
    //.TRANS: Sustain level is the level during the main sequence of the sound's duration, until the key is released.
    newblock.staticLabels.push(_('sustain'));
    //.TRANS: Release time is the time taken for the level to decay from the sustain level to zero after the key is released.
    newblock.staticLabels.push(_('release'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.defaults.push(1);
    newblock.defaults.push(50);
    newblock.defaults.push(60);
    newblock.defaults.push(1);
    newblock.fourArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    newblock.dockTypes[3] = 'numberin';
    newblock.dockTypes[4] = 'numberin';
    newblock.hidden = true;

    var newblock = new ProtoBlock('filter');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['filter'] = newblock;
    //.TRANS: a filter removes some unwanted components from a signal
    newblock.staticLabels.push(_('filter'));
    //.TRANS: type of filter, e.g., lowpass, highpass, etc.
    newblock.staticLabels.push(_('type'));
    //.TRANS: rolloff is the steepness of a change in frequency.
    newblock.staticLabels.push(_('rolloff'));
    newblock.staticLabels.push(_('frequency'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    //.TRANS: highpass filter
    newblock.defaults.push(_('highpass'));
    newblock.defaults.push(-12);
    newblock.defaults.push(392);
    newblock.threeArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'numberin';
    newblock.dockTypes[3] = 'numberin';
    newblock.hidden = true;

    var newblock = new ProtoBlock('temperament');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['temperament'] = newblock;
    newblock.staticLabels.push(_('temperament'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampOneArgBlock();
    if (beginnerMode && !beginnerBlock('temperament')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('timbre');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['timbre'] = newblock;
    //.TRANS: timbre is the character or quality of a musical sound
    newblock.staticLabels.push(_('timbre'));
    newblock.extraWidth = 50;
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampOneArgBlock();
    newblock.defaults.push(_('custom'));
    if (beginnerMode && !beginnerBlock('timbre')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('meterwidget');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['meterwidget'] = newblock;
    //.TRANS: musical meter, e.g., 4:4
    newblock.staticLabels.push(_('meter'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('meterwidget')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('modewidget');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['modewidget'] = newblock;
    //.TRANS: musical mode is the pattern of half-steps in an octave, e.g., Major or Minor modes
    newblock.staticLabels.push(_('custom mode'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('modewidget')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('tempo');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['tempo'] = newblock;
    //.TRANS: the speed at music is should be played.
    newblock.staticLabels.push(_('tempo'));
    newblock.extraWidth = 40;
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('tempo')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('pitchdrummatrix');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['pitchdrummatrix'] = newblock;
    //.TRANS: makes a mapping between pitches and drum sounds
    newblock.staticLabels.push(_('pitch-drum mapper'));
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('pitchdrummatrix')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('pitchslider');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['pitchslider'] = newblock;
    //.TRANS: widget to generate pitches using a slider
    newblock.staticLabels.push(_('pitch slider'));
    newblock.extraWidth = 40;
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('pitchslider')) {
        newblock.hidden = true;
    }

    if (language !== 'ja') {
	// macro
	var newblock = new ProtoBlock('chromatic');
	newblock.palette = palettes.dict['widgets'];
	blocks.protoBlockDict['chromatic'] = newblock;
	newblock.staticLabels.push(_('chromatic keyboard'));
	newblock.adjustWidthToLabel();
	newblock.stackClampZeroArgBlock();
	if (beginnerMode && !beginnerBlock('chromatic')) {
            newblock.hidden = true;
	}
    }
    
    if (language === 'ja') {
        // macro
        var newblock = new ProtoBlock('musickeyboardja');
        newblock.palette = palettes.dict['widgets'];
        blocks.protoBlockDict['musickeyboardja'] = newblock;
        newblock.staticLabels.push(_('music keyboard'));
        newblock.adjustWidthToLabel();
        newblock.labelOffset = 15;
        newblock.stackClampZeroArgBlock();
        if (beginnerMode && !beginnerBlock('musickeyboard')) {
            newblock.hidden = true;
        }
    } else {
        // macro
        var newblock = new ProtoBlock('musickeyboard2');
        newblock.palette = palettes.dict['widgets'];
        blocks.protoBlockDict['musickeyboard2'] = newblock;
        newblock.staticLabels.push(_('music keyboard'));
        newblock.adjustWidthToLabel();
        newblock.labelOffset = 15;
        newblock.stackClampZeroArgBlock();
        if (beginnerMode && !beginnerBlock('musickeyboard')) {
            newblock.hidden = true;
        }
    }

    var newblock = new ProtoBlock('musickeyboard');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['musickeyboard'] = newblock;
    //.TRANS: widget to generate pitches using a slider
    newblock.staticLabels.push(_('music keyboard'));
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampZeroArgBlock();
    newblock.hidden = true;

    var newblock = new ProtoBlock('pitchstaircase');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['pitchstaircase'] = newblock;
    //.TRANS: generate a progressive sequence of pitches
    newblock.staticLabels.push(_('pitch staircase'));
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('pitchstaircase')) {
        newblock.hidden = true;
    }

    if (beginnerMode) {
        // macro
        var newblock = new ProtoBlock('rhythmruler3');
        newblock.palette = palettes.dict['widgets'];
        blocks.protoBlockDict['rhythmruler3'] = newblock;
        //.TRANS: widget for subdividing a measure into distinct rhythmic elements
        newblock.staticLabels.push(_('rhythm maker'));
        newblock.extraWidth = 20;
        newblock.adjustWidthToLabel();
        newblock.labelOffset = 15;
        newblock.stackClampZeroArgBlock();
    }

    // macro
    var newblock = new ProtoBlock('rhythmruler2');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['rhythmruler2'] = newblock;
    //.TRANS: widget for subdividing a measure into distinct rhythmic elements
    newblock.staticLabels.push(_('rhythm maker'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampZeroArgBlock();
    if (beginnerMode) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('matrixgmajor');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['matrixgmajor'] = newblock;
    newblock.staticLabels.push(_('G major scale'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('matrixgmajor')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('matrixcmajor');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['matrixcmajor'] = newblock;
    newblock.staticLabels.push(_('C major scale'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('matrixcmajor')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('matrix');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['matrix'] = newblock;
    //.TRANS: assigns pitch to a sequence of beats to generate a melody
    newblock.staticLabels.push(_('phrase maker'));
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('matrix')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('status');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['status'] = newblock;
    newblock.staticLabels.push(_('status'));
    newblock.extraWidth = 40;
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('status')) {
        newblock.hidden = true;
    }

    // DRUM PALETTE
    var newblock = new ProtoBlock('noisename');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['noisename'] = newblock;
    newblock.valueBlock();
    newblock.extraWidth = 50;
    newblock.dockTypes[0] = 'textout';
    if (beginnerMode && !beginnerBlock('noisename')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('drumname');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['drumname'] = newblock;
    newblock.valueBlock();
    newblock.extraWidth = 50;
    newblock.dockTypes[0] = 'textout';
    if (beginnerMode && !beginnerBlock('drumname')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('effectsname');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['effectsname'] = newblock;
    newblock.valueBlock();
    newblock.extraWidth = 50;
    newblock.dockTypes[0] = 'textout';
    if (beginnerMode && !beginnerBlock('effectsname')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('playnoise');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['playnoise'] = newblock;
    newblock.staticLabels.push(_('noise'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('white noise'));
    if (beginnerMode && !beginnerBlock('playnoise')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('duck');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['duck'] = newblock;
    newblock.staticLabels.push(_('duck'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('duck')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('cat');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cat'] = newblock;
    newblock.staticLabels.push(_('cat'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('cat')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('cricket');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cricket'] = newblock;
    newblock.staticLabels.push(_('cricket'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('cricket')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('dog');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['dog'] = newblock;
    newblock.staticLabels.push(_('dog'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('dog')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('bottle');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['bottle'] = newblock;
    newblock.staticLabels.push(_('bottle'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('bottle')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('bubbles');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['bubbles'] = newblock;
    newblock.staticLabels.push(_('bubbles'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('bubbles')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('chine');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['chine'] = newblock;
    newblock.staticLabels.push(_('chime'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('chine')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('clang');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['clang'] = newblock;
    newblock.staticLabels.push(_('clang'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('clang')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('clap');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['clap'] = newblock;
    newblock.staticLabels.push(_('clap'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('clap')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('slap');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['slap'] = newblock;
    newblock.staticLabels.push(_('slap'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('slap')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('crash');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['crash'] = newblock;
    newblock.staticLabels.push(_('crash'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('crash')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('tom');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['tom'] = newblock;
    newblock.staticLabels.push(_('splash'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('tom')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('cowbell');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cowbell'] = newblock;
    newblock.staticLabels.push(_('cow bell'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('cowbell')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('ridebell');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['ridebell'] = newblock;
    newblock.staticLabels.push(_('ride bell'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('ridebell')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('fingercymbals');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['fingercymbals'] = newblock;
    newblock.staticLabels.push(_('finger cymbals'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('fingercymbals')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('trianglebell');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['trianglebell'] = newblock;
    newblock.staticLabels.push(_('triangle bell'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('trianglebell')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('hihat');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['hihat'] = newblock;
    newblock.staticLabels.push(_('hi hat'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('hihat')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('darbuka');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['darbuka'] = newblock;
    newblock.staticLabels.push(_('darbuka drum'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('darbuka')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('cup');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cup'] = newblock;
    newblock.staticLabels.push(_('cup drum'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('cup')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('floortom');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['floortom'] = newblock;
    newblock.staticLabels.push(_('floor tom'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('floortom')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('tom');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['tom'] = newblock;
    newblock.staticLabels.push(_('tom tom'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('tom')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('kick');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['kick'] = newblock;
    newblock.staticLabels.push(_('kick drum'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('kick')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('snare');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['snare'] = newblock;
    newblock.staticLabels.push(_('snare drum'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('snare')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('mapdrum');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['mapdrum'] = newblock;
    //.TRANS: map a pitch to a drum sound
    newblock.staticLabels.push(_('map pitch to drum'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('mapdrum')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('setdrum');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['setdrum'] = newblock;
    //.TRANS: set the current drum sound for playback
    newblock.staticLabels.push(_('set drum'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('setdrum')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('playeffect');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['playeffect'] = newblock;
    newblock.staticLabels.push(_('sound effect'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('playeffect')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('playdrum');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['playdrum'] = newblock;
    newblock.staticLabels.push(_('drum'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('playdrum')) {
        newblock.hidden = true;
    }

    // ACTIONS PALETTE

    var newblock = new ProtoBlock('drum');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['drum'] = newblock;
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

    // Volume palette
    var newblock = new ProtoBlock('notevolumefactor');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['notevolumefactor'] = newblock;
    //.TRANS: the volume at which notes are played
    newblock.staticLabels.push(_('master volume'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('notevolumefactor')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('ppp');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['ppp'] = newblock;
    newblock.staticLabels.push('ppp');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('ppp')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('pp');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['pp'] = newblock;
    newblock.staticLabels.push('pp');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('pp')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('p');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['p'] = newblock;
    newblock.staticLabels.push('p');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('p')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('mp');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['mp'] = newblock;
    newblock.staticLabels.push('mp');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('mp')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('mf');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['mf'] = newblock;
    newblock.staticLabels.push('mf');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('mf')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('f');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['f'] = newblock;
    newblock.staticLabels.push('f');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('f')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('ff');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['ff'] = newblock;
    newblock.staticLabels.push('ff');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('ff')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('fff');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['fff'] = newblock;
    newblock.staticLabels.push('fff');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('fff')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setsynthvolume2');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['setsynthvolume2'] = newblock;
    //.TRANS: a rapid, slight variation in pitch
    newblock.staticLabels.push(_('set synth volume'), _('synth'), _('volume'));
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.dockTypes[1] = 'textin';
    newblock.defaults.push(DEFAULTVOICE);
    newblock.defaults.push(50);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('setdrumvolume');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['setdrumvolume'] = newblock;
    //.TRANS: set the loudness level
    newblock.staticLabels.push(_('set drum volume'), _('drum'), _('volume'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'textin';
    newblock.defaults.push(DEFAULTDRUM);
    newblock.defaults.push(50);
    if (beginnerMode && !beginnerBlock('setdrumvolume')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('setsynthvolume');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['setsynthvolume'] = newblock;
    //.TRANS: set the loudness level
    newblock.staticLabels.push(_('set synth volume'), _('synth'), _('volume'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'textin';
    newblock.defaults.push(DEFAULTVOICE);
    newblock.defaults.push(50);
    if (beginnerMode && !beginnerBlock('setsynthvolume')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setnotevolume');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['setnotevolume'] = newblock;
    //.TRANS: set the loudness level
    newblock.staticLabels.push(_('set master volume'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(50);
    if (beginnerMode && !beginnerBlock('setnotevolume')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setnotevolume2');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['setnotevolume2'] = newblock;
    //.TRANS: set the loudness level
    newblock.staticLabels.push(_('set master volume'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(50);
    newblock.hidden = true;
    newblock.deprecated = true;

    // macro
    var newblock = new ProtoBlock('articulation');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['articulation'] = newblock;
    //.TRANS: set an articulation (change in volume)
    newblock.staticLabels.push(_('set relative volume'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(25);
    if (beginnerMode && !beginnerBlock('articulation')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('decrescendo');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['decrescendo'] = newblock;
    //.TRANS: a gradual increase in loudness
    newblock.staticLabels.push(_('decrescendo'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(5);
    if (beginnerMode && !beginnerBlock('decrescendo')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('crescendo');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['crescendo'] = newblock;
    //.TRANS: a gradual increase in loudness
    newblock.staticLabels.push(_('crescendo'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(5);
    if (beginnerMode && !beginnerBlock('crescendo')) {
        newblock.hidden = true;
    }

    // Push protoblocks onto their palettes.
    for (var protoblock in blocks.protoBlockDict) {
        if (blocks.protoBlockDict[protoblock].palette != null) {
            blocks.protoBlockDict[protoblock].palette.add(blocks.protoBlockDict[protoblock]);
        }
    }
}
