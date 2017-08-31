// Copyright (c) 2014-17 Walter Bender
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
    'comment': 'print',
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

    // PITCH PALETTE

    // deprecated
    var restBlock = new ProtoBlock('rest');
    restBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['rest'] = restBlock;
    restBlock.hidden = true;
    restBlock.valueBlock();
    restBlock.dockTypes[0] = 'textout';

    // deprecated
    var currentNoteBlock = new ProtoBlock('currentnote');
    currentNoteBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['currentnote'] = currentNoteBlock;
    currentNoteBlock.staticLabels.push(_('current pitch name'));
    currentNoteBlock.hidden = true;
    currentNoteBlock.adjustWidthToLabel();
    currentNoteBlock.parameterBlock();

    // deprecated
    var currentOctaveBlock = new ProtoBlock('currentoctave');
    currentOctaveBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['currentoctave'] = currentOctaveBlock;
    currentOctaveBlock.staticLabels.push(_('current pitch octave'));
    currentOctaveBlock.hidden = true;
    currentOctaveBlock.adjustWidthToLabel();
    currentOctaveBlock.parameterBlock();

    // deprecated
    var squareBlock = new ProtoBlock('square');
    squareBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['square'] = squareBlock;
    squareBlock.hidden = true;
    squareBlock.staticLabels.push(_('square'));
    squareBlock.adjustWidthToLabel();
    squareBlock.oneArgBlock();
    squareBlock.defaults.push(440);

    // deprecated
    var triangleBlock = new ProtoBlock('triangle');
    triangleBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['triangle'] = triangleBlock;
    triangleBlock.hidden = true;
    triangleBlock.staticLabels.push(_('triangle'));
    triangleBlock.adjustWidthToLabel();
    triangleBlock.oneArgBlock();
    triangleBlock.defaults.push(440);

    // deprecated
    var sineBlock = new ProtoBlock('sine');
    sineBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sine'] = sineBlock;
    sineBlock.hidden = true;
    sineBlock.staticLabels.push(_('sine'));
    sineBlock.adjustWidthToLabel();
    sineBlock.oneArgBlock();
    sineBlock.defaults.push(440);

    // deprecated
    var sawtoothBlock = new ProtoBlock('sawtooth');
    sawtoothBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sawtooth'] = sawtoothBlock;
    sawtoothBlock.hidden = true;
    sawtoothBlock.staticLabels.push(_('sawtooth'));
    sawtoothBlock.adjustWidthToLabel();
    sawtoothBlock.oneArgBlock();
    sawtoothBlock.defaults.push(440);

    // Status blocks
    var transposition = new ProtoBlock('transpositionfactor');
    transposition.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['transpositionfactor'] = transposition;
    transposition.staticLabels.push(_('transposition'));
    transposition.adjustWidthToLabel();
    transposition.parameterBlock();

    var consonantStepDownBlock = new ProtoBlock('consonantstepsizedown');
    consonantStepDownBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['consonantstepsizedown'] = consonantStepDownBlock;
    //.TRANS: step down one note in current mode
    consonantStepDownBlock.staticLabels.push(_('consonant step down'));
    consonantStepDownBlock.adjustWidthToLabel();
    consonantStepDownBlock.parameterBlock();

    var consonantStepUpBlock = new ProtoBlock('consonantstepsizeup');
    consonantStepUpBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['consonantstepsizeup'] = consonantStepUpBlock;
    //.TRANS: step up one note in current mode
    consonantStepUpBlock.staticLabels.push(_('consonant step up'));
    consonantStepUpBlock.adjustWidthToLabel();
    consonantStepUpBlock.parameterBlock();

    var turtlePitchBlock = new ProtoBlock('turtlepitch');
    turtlePitchBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['turtlepitch'] = turtlePitchBlock;
    //.TRANS: convert current note for this turtle to piano key (1-88)
    turtlePitchBlock.staticLabels.push(_('mouse pitch number'));
    turtlePitchBlock.oneArgMathBlock();
    turtlePitchBlock.adjustWidthToLabel();
    turtlePitchBlock.dockTypes[1] = 'anyin';

    var midiBlock = new ProtoBlock('midi');
    midiBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['midi'] = midiBlock;
    midiBlock.staticLabels.push('MIDI');
    midiBlock.adjustWidthToLabel();
    midiBlock.zeroArgBlock();

    var setPitchNumberOffsetBlock = new ProtoBlock('setpitchnumberoffset');
    setPitchNumberOffsetBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['setpitchnumberoffset'] = setPitchNumberOffsetBlock;
    setPitchNumberOffsetBlock.staticLabels.push(_('set pitch number offset'), _('name'), _('octave'));
    setPitchNumberOffsetBlock.adjustWidthToLabel();
    setPitchNumberOffsetBlock.twoArgBlock();
    setPitchNumberOffsetBlock.defaults.push('C');
    setPitchNumberOffsetBlock.defaults.push(4);
    setPitchNumberOffsetBlock.dockTypes[1] = 'notein';
    setPitchNumberOffsetBlock.dockTypes[2] = 'anyin';

    var numberToPitchBlock = new ProtoBlock('number2pitch');
    numberToPitchBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['number2pitch'] = numberToPitchBlock;
    //.TRANS: convert piano key number (1-88) to pitch
    numberToPitchBlock.staticLabels.push(_('number to pitch'));
    numberToPitchBlock.oneArgMathBlock();
    numberToPitchBlock.adjustWidthToLabel();
    numberToPitchBlock.defaults.push(48);

    var numberToOctaveBlock = new ProtoBlock('number2octave');
    numberToOctaveBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['number2octave'] = numberToOctaveBlock;
    //.TRANS: convert piano key number (1-88) to octave
    numberToOctaveBlock.staticLabels.push(_('number to octave'));
    numberToOctaveBlock.oneArgMathBlock();
    numberToOctaveBlock.adjustWidthToLabel();
    numberToOctaveBlock.defaults.push(48);

    // Value blocks
    var modenameBlock = new ProtoBlock('modename');
    modenameBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['modename'] = modenameBlock;
    modenameBlock.valueBlock();
    modenameBlock.dockTypes[0] = 'textout';

    var notenameBlock = new ProtoBlock('notename');
    notenameBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['notename'] = notenameBlock;
    notenameBlock.valueBlock();
    notenameBlock.dockTypes[0] = 'noteout';

    var solfegeBlock = new ProtoBlock('solfege');
    solfegeBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['solfege'] = solfegeBlock;
    solfegeBlock.valueBlock();
    solfegeBlock.dockTypes[0] = 'solfegeout';

    var eastindiansolfegeBlock = new ProtoBlock('eastindiansolfege');
    eastindiansolfegeBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['eastindiansolfege'] = eastindiansolfegeBlock;
    eastindiansolfegeBlock.valueBlock();
    eastindiansolfegeBlock.dockTypes[0] = 'solfegeout';

    // Transposition blocks
    var invertBlock = new ProtoBlock('invert1');
    invertBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert1'] = invertBlock;
    invertBlock.staticLabels.push(_('invert'), _('name'), _('octave'), _('even') + '/' + _('odd'));
    invertBlock.adjustWidthToLabel();
    invertBlock.flowClampThreeArgBlock();
    invertBlock.adjustWidthToLabel();
    invertBlock.defaults.push('sol');
    invertBlock.defaults.push(4);
    invertBlock.defaults.push(_('even'));
    invertBlock.dockTypes[1] = 'solfegein';
    invertBlock.dockTypes[2] = 'anyin';
    invertBlock.dockTypes[3] = 'anyin';

    var invertBlock2 = new ProtoBlock('invert2');
    invertBlock2.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert2'] = invertBlock2;
    invertBlock2.staticLabels.push(_('invert (odd)'), _('note'), _('octave'));
    invertBlock2.adjustWidthToLabel();
    invertBlock2.flowClampTwoArgBlock();
    invertBlock2.adjustWidthToLabel();
    invertBlock2.defaults.push('sol');
    invertBlock2.defaults.push(4);
    invertBlock2.dockTypes[1] = 'solfegein';
    invertBlock2.dockTypes[2] = 'anyin';
    invertBlock2.hidden = true;

    var invertBlock = new ProtoBlock('invert');
    invertBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert'] = invertBlock;
    invertBlock.staticLabels.push(_('invert (even)'), _('note'), _('octave'));
    invertBlock.adjustWidthToLabel();
    invertBlock.flowClampTwoArgBlock();
    invertBlock.adjustWidthToLabel();
    invertBlock.defaults.push('sol');
    invertBlock.defaults.push(4);
    invertBlock.dockTypes[1] = 'solfegein';
    invertBlock.dockTypes[2] = 'anyin';
    invertBlock.hidden = true;

    var transpositionBlock = new ProtoBlock('settransposition');
    transpositionBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['settransposition'] = transpositionBlock;
    transpositionBlock.staticLabels.push(_('adjust transposition'));
    transpositionBlock.adjustWidthToLabel();
    transpositionBlock.defaults.push('1');
    transpositionBlock.flowClampOneArgBlock();

    var octaveBlock = new ProtoBlock('octave');
    octaveBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['octave'] = octaveBlock;
    octaveBlock.staticLabels.push(_('octave'));
    octaveBlock.adjustWidthToLabel();
    octaveBlock.zeroArgBlock();

    var flatBlock = new ProtoBlock('flat');
    flatBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['flat'] = flatBlock;
    flatBlock.staticLabels.push(_('flat'));
    flatBlock.adjustWidthToLabel();
    flatBlock.flowClampZeroArgBlock();

    var sharpBlock = new ProtoBlock('sharp');
    sharpBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sharp'] = sharpBlock;
    sharpBlock.staticLabels.push(_('sharp'));
    sharpBlock.adjustWidthToLabel();
    sharpBlock.flowClampZeroArgBlock();

    var hertzBlock = new ProtoBlock('hertz');
    hertzBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['hertz'] = hertzBlock;
    hertzBlock.staticLabels.push(_('hertz'));
    hertzBlock.adjustWidthToLabel();
    hertzBlock.oneArgBlock();
    hertzBlock.defaults.push(392);

    var pitchNumberBlock = new ProtoBlock('pitchnumber');
    pitchNumberBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitchnumber'] = pitchNumberBlock;
    pitchNumberBlock.staticLabels.push(_('pitch number'));
    pitchNumberBlock.adjustWidthToLabel();
    pitchNumberBlock.oneArgBlock();
    pitchNumberBlock.defaults.push(7);
    pitchNumberBlock.dockTypes[1] = 'numberin';

    var scaleDegree = new ProtoBlock('scaledegree');
    scaleDegree.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['scaledegree'] = scaleDegree;
    scaleDegree.staticLabels.push(_('scale degree'), _('number'), _('octave'));
    scaleDegree.adjustWidthToLabel();
    scaleDegree.defaults.push(5); // G in C Major
    scaleDegree.defaults.push(4);
    scaleDegree.twoArgBlock();
    scaleDegree.dockTypes[1] = 'numberin';
    scaleDegree.dockTypes[2] = 'anyin';

    var pitchStepBlock = new ProtoBlock('steppitch');
    pitchStepBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['steppitch'] = pitchStepBlock;
    //.TRANS: step some number of notes in current mode
    pitchStepBlock.staticLabels.push(_('step pitch'));
    pitchStepBlock.oneArgBlock();
    pitchStepBlock.adjustWidthToLabel();
    pitchStepBlock.dockTypes[1] = 'anyin';
    pitchStepBlock.defaults.push(1);

    var pitch = new ProtoBlock('pitch');
    pitch.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitch'] = pitch;
    pitch.staticLabels.push(_('pitch'), _('name'), _('octave'));
    pitch.adjustWidthToLabel();
    pitch.defaults.push('sol');
    pitch.defaults.push(4);
    pitch.twoArgBlock();
    pitch.dockTypes[1] = 'solfegein';
    pitch.dockTypes[2] = 'anyin';

    // MATRIX PALETTE

    var oscillatorBlock = new ProtoBlock('oscillator');
    oscillatorBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['oscillator'] = oscillatorBlock;
    oscillatorBlock.staticLabels.push(_('oscillator'), _('type'), _('partials'));
    oscillatorBlock.extraWidth = 10;
    oscillatorBlock.adjustWidthToLabel();
    oscillatorBlock.defaults.push(_('triangle'));
    oscillatorBlock.defaults.push(6);
    oscillatorBlock.hidden = true;
    oscillatorBlock.twoArgBlock();
    oscillatorBlock.dockTypes[1] = 'anyin';
    oscillatorBlock.dockTypes[2] = 'numberin';

    var filtertypeBlock = new ProtoBlock('filtertype');
    filtertypeBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['filtertype'] = filtertypeBlock;
    filtertypeBlock.hidden = true;
    filtertypeBlock.valueBlock();
    filtertypeBlock.dockTypes[0] = 'textout';

    var oscillatortypeBlock = new ProtoBlock('oscillatortype');
    oscillatortypeBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['oscillatortype'] = oscillatortypeBlock;
    oscillatortypeBlock.hidden = true;
    oscillatortypeBlock.valueBlock();
    oscillatortypeBlock.dockTypes[0] = 'textout';

    var envelopeBlock = new ProtoBlock('envelope');
    envelopeBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['envelope'] = envelopeBlock;
    envelopeBlock.staticLabels.push(_('envelope'), _('attack'), _('decay'), _('sustain'), _('release'));
    envelopeBlock.extraWidth = 10;
    envelopeBlock.adjustWidthToLabel();
    envelopeBlock.defaults.push(1);
    envelopeBlock.defaults.push(50);
    envelopeBlock.defaults.push(60);
    envelopeBlock.defaults.push(1);
    envelopeBlock.hidden = true;
    envelopeBlock.fourArgBlock();
    envelopeBlock.dockTypes[1] = 'numberin';
    envelopeBlock.dockTypes[2] = 'numberin';
    envelopeBlock.dockTypes[3] = 'numberin';
    envelopeBlock.dockTypes[4] = 'numberin';

    var filterBlock = new ProtoBlock('filter');
    filterBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['filter'] = filterBlock;
    filterBlock.staticLabels.push(_('filter'), _('type'), _('rolloff'), _('frequency'));
    filterBlock.extraWidth = 10;
    filterBlock.adjustWidthToLabel();
    filterBlock.defaults.push(_('highpass'));
    filterBlock.defaults.push(-12);
    filterBlock.defaults.push(392);
    filterBlock.threeArgBlock();
    filterBlock.hidden = true;
    filterBlock.dockTypes[1] = 'anyin';
    filterBlock.dockTypes[2] = 'numberin';
    filterBlock.dockTypes[3] = 'numberin';
    
    var sixtyfourthNoteBlock = new ProtoBlock('sixtyfourthNote');
    sixtyfourthNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['sixtyfourthNote'] = sixtyfourthNoteBlock;
    sixtyfourthNoteBlock.staticLabels.push(_('1/64 note') + ' 𝅘𝅥𝅱');
    sixtyfourthNoteBlock.adjustWidthToLabel();
    sixtyfourthNoteBlock.zeroArgBlock();

    var thirtysecondNoteBlock = new ProtoBlock('thirtysecondNote');
    thirtysecondNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['thirtysecondNote'] = thirtysecondNoteBlock;
    thirtysecondNoteBlock.staticLabels.push(_('1/32 note') + ' 𝅘𝅥𝅰');
    thirtysecondNoteBlock.adjustWidthToLabel();
    thirtysecondNoteBlock.zeroArgBlock();

    var sixteenthNoteBlock = new ProtoBlock('sixteenthNote');
    sixteenthNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['sixteenthNote'] = sixteenthNoteBlock;
    sixteenthNoteBlock.staticLabels.push(_('1/16 note') + ' 𝅘𝅥𝅯');
    sixteenthNoteBlock.adjustWidthToLabel();
    sixteenthNoteBlock.zeroArgBlock();

    var eighthNoteBlock = new ProtoBlock('eighthNote');
    eighthNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['eighthNote'] = eighthNoteBlock;
    eighthNoteBlock.staticLabels.push(_('eighth note') + ' ♪');
    eighthNoteBlock.adjustWidthToLabel();
    eighthNoteBlock.zeroArgBlock();

    var quarterNoteBlock = new ProtoBlock('quarterNote');
    quarterNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['quarterNote'] = quarterNoteBlock;
    quarterNoteBlock.staticLabels.push(_('quarter note') + ' ♩');
    quarterNoteBlock.adjustWidthToLabel();
    quarterNoteBlock.zeroArgBlock();

    var halfNoteBlock = new ProtoBlock('halfNote');
    halfNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['halfNote'] = halfNoteBlock;
    halfNoteBlock.staticLabels.push(_('half note') + ' 𝅗𝅥');
    halfNoteBlock.adjustWidthToLabel();
    halfNoteBlock.zeroArgBlock();

    var wholeNoteBlock = new ProtoBlock('wholeNote');
    wholeNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['wholeNote'] = wholeNoteBlock;
    wholeNoteBlock.staticLabels.push(_('whole note') + ' 𝅝');
    wholeNoteBlock.adjustWidthToLabel();
    wholeNoteBlock.zeroArgBlock();

    var tuplet2Block = new ProtoBlock('tuplet2');
    tuplet2Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['tuplet2'] = tuplet2Block;
    tuplet2Block.staticLabels.push(_('tuplet'), _('number of notes'), _('note value'));
    tuplet2Block.extraWidth = 20;
    tuplet2Block.adjustWidthToLabel();
    tuplet2Block.flowClampTwoArgBlock();
    tuplet2Block.defaults.push(1);
    tuplet2Block.defaults.push(4);
    tuplet2Block.hidden = true;

    var tuplet3Block = new ProtoBlock('tuplet3');
    tuplet3Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['tuplet3'] = tuplet3Block;
    tuplet3Block.staticLabels.push(_('tuplet'), _('number of notes'), _('note value'));
    tuplet3Block.extraWidth = 20;
    tuplet3Block.adjustWidthToLabel();
    tuplet3Block.flowClampTwoArgBlock();
    tuplet3Block.defaults.push(1);
    tuplet3Block.defaults.push(4);
    tuplet3Block.hidden = true;

    var tuplet4Block = new ProtoBlock('tuplet4');
    tuplet4Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['tuplet4'] = tuplet4Block;
    tuplet4Block.staticLabels.push(_('tuplet'), _('note value'));
    tuplet4Block.extraWidth = 20;
    tuplet4Block.adjustWidthToLabel();
    tuplet4Block.flowClampOneArgBlock();
    tuplet4Block.defaults.push(1 / 4);

    var simpleTuplet7Block = new ProtoBlock('stuplet7');
    simpleTuplet7Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet7'] = simpleTuplet7Block;
    simpleTuplet7Block.staticLabels.push(_('septuplet'));
    simpleTuplet7Block.adjustWidthToLabel();
    simpleTuplet7Block.zeroArgBlock();

    var simpleTuplet5Block = new ProtoBlock('stuplet5');
    simpleTuplet5Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet5'] = simpleTuplet5Block;
    simpleTuplet5Block.staticLabels.push(_('quintuplet'));
    simpleTuplet5Block.adjustWidthToLabel();
    simpleTuplet5Block.zeroArgBlock();

    var simpleTuplet3Block = new ProtoBlock('stuplet3');
    simpleTuplet3Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet3'] = simpleTuplet3Block;
    simpleTuplet3Block.staticLabels.push(_('triplet'));
    simpleTuplet3Block.adjustWidthToLabel();
    simpleTuplet3Block.zeroArgBlock();

    var simpleTupletBlock = new ProtoBlock('stuplet');
    simpleTupletBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet'] = simpleTupletBlock;
    simpleTupletBlock.staticLabels.push(_('simple tuplet'), _('number of notes'), _('note value'));
    simpleTupletBlock.adjustWidthToLabel();
    simpleTupletBlock.twoArgBlock();
    simpleTupletBlock.defaults.push(3);
    simpleTupletBlock.defaults.push(1 / 2);

    // deprecated
    var rhythm = new ProtoBlock('rhythm');
    rhythm.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['rhythm'] = rhythm;
    rhythm.staticLabels.push(_('rhythm'), _('number of notes'), _('note value'));
    rhythm.extraWidth = 10;
    rhythm.adjustWidthToLabel();
    rhythm.defaults.push(3);
    rhythm.defaults.push(4);
    rhythm.twoArgBlock();
    rhythm.dockTypes[1] = 'anyin';
    rhythm.dockTypes[2] = 'anyin';
    rhythm.hidden = true;

    var rhythm2 = new ProtoBlock('rhythm2');
    rhythm2.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['rhythm2'] = rhythm2;
    rhythm2.staticLabels.push(_('rhythm'), _('number of notes'), _('note value'));
    rhythm2.extraWidth = 10;
    rhythm2.adjustWidthToLabel();
    rhythm2.defaults.push(3);
    rhythm2.defaults.push(4);
    rhythm2.twoArgBlock();
    rhythm2.dockTypes[1] = 'anyin';
    rhythm2.dockTypes[2] = 'anyin';

    var timbreBlock = new ProtoBlock('timbre');
    timbreBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['timbre'] = timbreBlock;
    timbreBlock.staticLabels.push(_('timbre'));
    timbreBlock.extraWidth = 20;
    timbreBlock.adjustWidthToLabel();
    timbreBlock.stackClampOneArgBlock();
    timbreBlock.defaults.push(_('custom'));

    var modewidgetBlock = new ProtoBlock('modewidget');
    modewidgetBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['modewidget'] = modewidgetBlock;
    modewidgetBlock.staticLabels.push(_('custom mode'));
    modewidgetBlock.adjustWidthToLabel();
    modewidgetBlock.stackClampZeroArgBlock();

    var tempoBlock = new ProtoBlock('tempo');
    tempoBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['tempo'] = tempoBlock;
    tempoBlock.staticLabels.push(_('tempo'));
    tempoBlock.extraWidth = 20;
    tempoBlock.adjustWidthToLabel();
    tempoBlock.stackClampZeroArgBlock();

    var pitchDrumMatrixBlock = new ProtoBlock('pitchdrummatrix');
    pitchDrumMatrixBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['pitchdrummatrix'] = pitchDrumMatrixBlock;
    pitchDrumMatrixBlock.staticLabels.push(_('pitch-drum mapper'));
    pitchDrumMatrixBlock.adjustWidthToLabel();
    pitchDrumMatrixBlock.stackClampZeroArgBlock();

    var pitchsliderBlock = new ProtoBlock('pitchslider');
    pitchsliderBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['pitchslider'] = pitchsliderBlock;
    //.TRANS: widget to generate pitches using a slider
    pitchsliderBlock.staticLabels.push(_('pitchslider'));
    pitchsliderBlock.adjustWidthToLabel();
    pitchsliderBlock.stackClampZeroArgBlock();

    var pitchstaircaseBlock = new ProtoBlock('pitchstaircase');
    pitchstaircaseBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['pitchstaircase'] = pitchstaircaseBlock;
    pitchstaircaseBlock.staticLabels.push(_('pitch staircase'));
    pitchstaircaseBlock.adjustWidthToLabel();
    pitchstaircaseBlock.stackClampZeroArgBlock();

    var rhythmrulerBlock = new ProtoBlock('rhythmruler');
    rhythmrulerBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['rhythmruler'] = rhythmrulerBlock;
    //.TRANS: widget for subdividing a measure into distinct rhythmic elements
    rhythmrulerBlock.staticLabels.push(_('rhythm ruler'));
    rhythmrulerBlock.adjustWidthToLabel();
    rhythmrulerBlock.stackClampOneArgBlock();
    rhythmrulerBlock.defaults.push(1);

    var matrixBlock = new ProtoBlock('matrix');
    matrixBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['matrix'] = matrixBlock;
    matrixBlock.staticLabels.push(_('pitch-time matrix'));
    matrixBlock.adjustWidthToLabel();
    matrixBlock.stackClampZeroArgBlock();

    var statusBlock = new ProtoBlock('status');
    statusBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['status'] = statusBlock;
    statusBlock.staticLabels.push(_('status'));
    statusBlock.extraWidth = 10;
    statusBlock.adjustWidthToLabel();
    statusBlock.stackClampZeroArgBlock();

    // RHYTHM PALETTE

    var offBeatDoBlock = new ProtoBlock('offbeatdo');
    offBeatDoBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['offbeatdo'] = offBeatDoBlock;
    // #TRANS: on musical 'offbeat' do some action
    offBeatDoBlock.staticLabels.push(_('offbeat do'));
    offBeatDoBlock.oneArgBlock();
    offBeatDoBlock.defaults.push(_('action'));
    offBeatDoBlock.dockTypes[1] = 'textin';

    var onBeatDoBlock = new ProtoBlock('onbeatdo');
    onBeatDoBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['onbeatdo'] = onBeatDoBlock;
    // #TRANS: 'on' musical 'beat' 'do' some action
    onBeatDoBlock.staticLabels.push(_('on'), _('beat'), _('do'));
    onBeatDoBlock.twoArgBlock();
    onBeatDoBlock.defaults.push(1);
    onBeatDoBlock.defaults.push(_('action'));
    onBeatDoBlock.dockTypes[1] = 'numberin';
    onBeatDoBlock.dockTypes[2] = 'textin';

    var measureValueBlock = new ProtoBlock('measurevalue');
    measureValueBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['measurevalue'] = measureValueBlock;
    // .TRANS: count of current measure in meter
    measureValueBlock.staticLabels.push(_('measure count'));
    measureValueBlock.adjustWidthToLabel();
    measureValueBlock.parameterBlock();

    var beatValueBlock = new ProtoBlock('beatvalue');
    beatValueBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['beatvalue'] = beatValueBlock;
    // .TRANS: count of current beat in meter
    beatValueBlock.staticLabels.push(_('beat count'));
    beatValueBlock.adjustWidthToLabel();
    beatValueBlock.parameterBlock();

    var pickupBlock = new ProtoBlock('pickup');
    pickupBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['pickup'] = pickupBlock;
    // .TRANS: anacrusis
    pickupBlock.staticLabels.push(_('pickup'));
    pickupBlock.oneArgBlock();
    pickupBlock.defaults.push(0);

    var meter = new ProtoBlock('meter');
    meter.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['meter'] = meter;
    // .TRANS: musical meter (time signature)
    meter.staticLabels.push(_('meter'), _('number of beats'), _('note value'));
    meter.extraWidth = 15;
    meter.adjustWidthToLabel();
    meter.defaults.push(4);
    meter.defaults.push(0.25);
    meter.twoArgBlock();

    var noteCounter = new ProtoBlock('notecounter');
    noteCounter.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['notecounter'] = noteCounter;
    noteCounter.staticLabels.push(_('note counter'));
    noteCounter.argFlowClampBlock();
    noteCounter.adjustWidthToLabel();

    var turtleNoteBlock = new ProtoBlock('turtlenote');
    turtleNoteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['turtlenote'] = turtleNoteBlock;
    turtleNoteBlock.staticLabels.push(_('mouse note value'));
    turtleNoteBlock.oneArgMathBlock();
    turtleNoteBlock.adjustWidthToLabel();
    turtleNoteBlock.dockTypes[1] = 'anyin';
    turtleNoteBlock.hidden = true;

    var turtleNoteBlock2 = new ProtoBlock('turtlenote2');
    turtleNoteBlock2.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['turtlenote2'] = turtleNoteBlock2;
    turtleNoteBlock2.staticLabels.push(_('mouse note value'));
    turtleNoteBlock2.oneArgMathBlock();
    turtleNoteBlock2.adjustWidthToLabel();
    turtleNoteBlock2.dockTypes[1] = 'anyin';

    var myNoteBlock = new ProtoBlock('mynotevalue');
    myNoteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['mynotevalue'] = myNoteBlock;
    myNoteBlock.staticLabels.push(_('note value'));
    myNoteBlock.parameterBlock();
    myNoteBlock.adjustWidthToLabel();

    var duplicateFactor = new ProtoBlock('duplicatefactor');
    duplicateFactor.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['duplicatefactor'] = duplicateFactor;
    duplicateFactor.staticLabels.push(_('duplicate factor'));
    duplicateFactor.adjustWidthToLabel();
    duplicateFactor.parameterBlock();
    duplicateFactor.hidden = true;

    var skipFactor = new ProtoBlock('skipfactor');
    skipFactor.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['skipfactor'] = skipFactor;
    skipFactor.staticLabels.push(_('skip factor'));
    skipFactor.adjustWidthToLabel();
    skipFactor.parameterBlock();
    skipFactor.hidden = true;

    var elapsedNotes = new ProtoBlock('elapsednotes');
    elapsedNotes.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['elapsednotes'] = elapsedNotes;
    //.TRANS: number of whole notes that have been played
    elapsedNotes.staticLabels.push(_('notes played'));
    elapsedNotes.adjustWidthToLabel();
    elapsedNotes.parameterBlock();

    var beatfactor = new ProtoBlock('beatfactor');
    beatfactor.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['beatfactor'] = beatfactor;
    //.TRANS: number of beats per minute
    beatfactor.staticLabels.push(_('beat factor'));
    beatfactor.adjustWidthToLabel();
    beatfactor.parameterBlock();

    var bpmBlock = new ProtoBlock('bpmfactor');
    bpmBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['bpmfactor'] = bpmBlock;
    bpmBlock.staticLabels.push(_('beats per minute'));
    bpmBlock.adjustWidthToLabel();
    bpmBlock.parameterBlock();

    var driftBlock = new ProtoBlock('drift');
    driftBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['drift'] = driftBlock;
    driftBlock.staticLabels.push(_('free time'));
    driftBlock.adjustWidthToLabel();
    driftBlock.flowClampZeroArgBlock();

    var osctimeBlock = new ProtoBlock('osctime');
    osctimeBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['osctime'] = osctimeBlock;
    //.TRANS: oscillator time (in micro seconds)
    osctimeBlock.staticLabels.push(_('osctime'));
    osctimeBlock.adjustWidthToLabel();
    osctimeBlock.flowClampOneArgBlock();
    osctimeBlock.defaults.push(200);

    var swingBlock = new ProtoBlock('swing');
    swingBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['swing'] = swingBlock;
    swingBlock.staticLabels.push(_('swing'));
    swingBlock.adjustWidthToLabel();
    swingBlock.flowClampOneArgBlock();
    swingBlock.defaults.push(32);
    swingBlock.hidden = true;

    var newswingBlock = new ProtoBlock('newswing');
    newswingBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newswing'] = newswingBlock;
    newswingBlock.staticLabels.push(_('swing'));
    newswingBlock.adjustWidthToLabel();
    newswingBlock.flowClampOneArgBlock();
    newswingBlock.defaults.push(1 / 24);
    newswingBlock.hidden = true;

    var newswingBlock = new ProtoBlock('newswing2');
    newswingBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newswing2'] = newswingBlock;
    newswingBlock.staticLabels.push(_('swing'), _('swing value'), _('note value'));
    newswingBlock.extraWidth = 20;
    newswingBlock.adjustWidthToLabel();
    newswingBlock.flowClampTwoArgBlock();
    newswingBlock.defaults.push(1 / 24);
    newswingBlock.defaults.push(1 / 8);

    var setbpmBlock = new ProtoBlock('setbpm');
    setbpmBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['setbpm'] = setbpmBlock;
    setbpmBlock.staticLabels.push(_('beats per minute'));
    setbpmBlock.adjustWidthToLabel();
    setbpmBlock.flowClampOneArgBlock();
    setbpmBlock.defaults.push(90);

    var backwardBlock = new ProtoBlock('backward');
    backwardBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['backward'] = backwardBlock;
    backwardBlock.staticLabels.push(_('backward'));
    backwardBlock.adjustWidthToLabel();
    backwardBlock.flowClampZeroArgBlock();

    var skipNotesBlock = new ProtoBlock('skipnotes');
    skipNotesBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['skipnotes'] = skipNotesBlock;
    skipNotesBlock.staticLabels.push(_('skip notes'));
    skipNotesBlock.adjustWidthToLabel();
    skipNotesBlock.flowClampOneArgBlock();
    skipNotesBlock.defaults.push(2);

    var duplicateNotesBlock = new ProtoBlock('duplicatenotes');
    duplicateNotesBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['duplicatenotes'] = duplicateNotesBlock;
    duplicateNotesBlock.staticLabels.push(_('duplicate notes'));
    duplicateNotesBlock.adjustWidthToLabel();
    duplicateNotesBlock.flowClampOneArgBlock();
    duplicateNotesBlock.defaults.push(2);

    var beatFactorBlock = new ProtoBlock('multiplybeatfactor');
    beatFactorBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['multiplybeatfactor'] = beatFactorBlock;
    //.TRANS: speed up note duration by some factor, e.g. convert 1/4 to 1/8 notes by using a factor of 2
    beatFactorBlock.staticLabels.push(_('multiply beat value'));
    beatFactorBlock.adjustWidthToLabel();
    beatFactorBlock.flowClampOneArgBlock();
    beatFactorBlock.defaults.push(2);

    var beatFactorBlock2 = new ProtoBlock('dividebeatfactor');
    beatFactorBlock2.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['dividebeatfactor'] = beatFactorBlock2;
    //.TRANS: slow down note duration by some factor, e.g. convert 1/8 to 1/4 notes by using a factor of 2
    beatFactorBlock2.staticLabels.push(_('divide beat value'));
    beatFactorBlock2.adjustWidthToLabel();
    beatFactorBlock2.flowClampOneArgBlock();
    beatFactorBlock2.defaults.push(2);

    var tieBlock = new ProtoBlock('tie');
    tieBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['tie'] = tieBlock;
    //.TRANS: tie notes together into one longer note
    tieBlock.staticLabels.push(_('tie'));
    tieBlock.adjustWidthToLabel();
    tieBlock.flowClampZeroArgBlock();

    var rhythmicdotBlock = new ProtoBlock('rhythmicdot');
    rhythmicdotBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['rhythmicdot'] = rhythmicdotBlock;
    rhythmicdotBlock.staticLabels.push(_('dot'));
    rhythmicdotBlock.adjustWidthToLabel();
    rhythmicdotBlock.flowClampZeroArgBlock();

    var rest2Block = new ProtoBlock('rest2');
    rest2Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['rest2'] = rest2Block;
    rest2Block.staticLabels.push(_('silence'));
    rest2Block.adjustWidthToLabel();
    rest2Block.zeroArgBlock();

    var note4Block = new ProtoBlock('note4');
    note4Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note4'] = note4Block;
    note4Block.staticLabels.push(_('note value') + ' ' + _('drum'));
    note4Block.adjustWidthToLabel();
    note4Block.zeroArgBlock();

    var note3Block = new ProtoBlock('note3');
    note3Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note3'] = note3Block;
    note3Block.staticLabels.push(_('note value') + ' ' + _('392 hertz'));
    note3Block.adjustWidthToLabel();
    note3Block.zeroArgBlock();

    var note2Block = new ProtoBlock('note2');
    note2Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note2'] = note2Block;
    note2Block.staticLabels.push(_('note value') + ' ' + 'G4');
    note2Block.adjustWidthToLabel();
    note2Block.zeroArgBlock();

    var note1Block = new ProtoBlock('note1');
    note1Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note1'] = note1Block;
    note1Block.staticLabels.push(_('note value') + ' ' + i18nSolfege('sol') + '4');
    note1Block.adjustWidthToLabel();
    note1Block.zeroArgBlock();

    var noteBlock = new ProtoBlock('note');
    noteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note'] = noteBlock;
    noteBlock.hidden = true;
    noteBlock.staticLabels.push('deprecated ' + _('note value'));
    noteBlock.adjustWidthToLabel();
    noteBlock.flowClampOneArgBlock();
    noteBlock.defaults.push(4);

    var newnoteBlock = new ProtoBlock('newnote');
    newnoteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newnote'] = newnoteBlock;
    newnoteBlock.staticLabels.push(_('note value'));
    newnoteBlock.adjustWidthToLabel();
    newnoteBlock.flowClampOneArgBlock();
    newnoteBlock.defaults.push(1 / 4);

    // TONE (ARTICULATION) PALETTE

    var staccatoFactor = new ProtoBlock('staccatofactor');
    staccatoFactor.palette = palettes.dict['tone'];
    blocks.protoBlockDict['staccatofactor'] = staccatoFactor;
    //.TRANS: the duration of a note played as staccato
    staccatoFactor.staticLabels.push(_('staccato factor'));
    staccatoFactor.adjustWidthToLabel();
    staccatoFactor.parameterBlock();

    var slurFactor = new ProtoBlock('slurfactor');
    slurFactor.palette = palettes.dict['tone'];
    blocks.protoBlockDict['slurfactor'] = slurFactor;
    //.TRANS: the degree of overlap of notes played as legato
    slurFactor.staticLabels.push(_('slur factor'));
    slurFactor.adjustWidthToLabel();
    slurFactor.parameterBlock();

    var notevolumeFactor = new ProtoBlock('notevolumefactor');
    notevolumeFactor.palette = palettes.dict['tone'];
    blocks.protoBlockDict['notevolumefactor'] = notevolumeFactor;
    //.TRANS: the volume at which notes are played
    notevolumeFactor.staticLabels.push(_('note volume'));
    notevolumeFactor.adjustWidthToLabel();
    notevolumeFactor.parameterBlock();

    var keyBlock = new ProtoBlock('key');
    keyBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['key'] = keyBlock;
    keyBlock.staticLabels.push(_('key'));
    keyBlock.adjustWidthToLabel();
    keyBlock.parameterBlock();

    // Deprecated
    var setkeyBlock = new ProtoBlock('setkey');
    setkeyBlock.hidden = true;
    setkeyBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['setkey'] = setkeyBlock;
    //.TRANS: set the key and mode, e.g. C Major
    setkeyBlock.staticLabels.push(_('set key'));
    setkeyBlock.adjustWidthToLabel();
    setkeyBlock.oneArgBlock();
    setkeyBlock.dockTypes[1] = 'textin';
    setkeyBlock.defaults.push('C');

    var setkey2Block = new ProtoBlock('setkey2');
    setkey2Block.palette = palettes.dict['tone'];
    blocks.protoBlockDict['setkey2'] = setkey2Block;
    setkey2Block.staticLabels.push(_('set key'), _('key'), _('mode'));
    setkey2Block.adjustWidthToLabel();
    setkey2Block.twoArgBlock();
    setkey2Block.dockTypes[1] = 'anyin';
    setkey2Block.dockTypes[2] = 'anyin';

    var setMasterBPMBlock = new ProtoBlock('setmasterbpm');
    setMasterBPMBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['setmasterbpm'] = setMasterBPMBlock;
    setMasterBPMBlock.staticLabels.push(_('master beats per minute'));
    setMasterBPMBlock.adjustWidthToLabel();
    setMasterBPMBlock.oneArgBlock();
    setMasterBPMBlock.defaults.push(90);

    var amSynthBlock = new ProtoBlock('amsynth');
    amSynthBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['amsynth'] = amSynthBlock;
    amSynthBlock.staticLabels.push(_('AM synth'));
    amSynthBlock.extraWidth = 10;
    amSynthBlock.adjustWidthToLabel();
    amSynthBlock.defaults.push(1);
    amSynthBlock.oneArgBlock();
    amSynthBlock.dockTypes[1] = 'numberin';

    var fmSynthBlock = new ProtoBlock('fmsynth');
    fmSynthBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['fmsynth'] = fmSynthBlock;
    fmSynthBlock.staticLabels.push(_('FM synth'));
    fmSynthBlock.extraWidth = 10;
    fmSynthBlock.adjustWidthToLabel();
    fmSynthBlock.defaults.push(10);
    fmSynthBlock.oneArgBlock();
    fmSynthBlock.dockTypes[1] = 'numberin';

    var duoSynthBlock = new ProtoBlock('duosynth');
    duoSynthBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['duosynth'] = duoSynthBlock;
    duoSynthBlock.staticLabels.push(_('duo synth'), _('vibrato rate'), _('vibrato intensity'));
    duoSynthBlock.extraWidth = 10;
    duoSynthBlock.adjustWidthToLabel();
    duoSynthBlock.defaults.push(10);
    duoSynthBlock.defaults.push(6);
    duoSynthBlock.twoArgBlock();
    duoSynthBlock.dockTypes[1] = 'numberin';
    duoSynthBlock.dockTypes[2] = 'numberin';

    var voicenameBlock = new ProtoBlock('voicename');
    voicenameBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['voicename'] = voicenameBlock;
    voicenameBlock.valueBlock();
    voicenameBlock.dockTypes[0] = 'textout';

    var distortionBlock = new ProtoBlock('dis');
    distortionBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['dis'] = distortionBlock;
    distortionBlock.staticLabels.push(_('distortion'));
    distortionBlock.adjustWidthToLabel();
    distortionBlock.flowClampOneArgBlock();
    distortionBlock.dockTypes[1] = 'numberin';
    distortionBlock.defaults.push(40);

    var tremoloBlock = new ProtoBlock('tremolo');
    tremoloBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['tremolo'] = tremoloBlock;
    tremoloBlock.staticLabels.push(_('tremolo'), _('rate'), _('depth'));
    tremoloBlock.adjustWidthToLabel();
    tremoloBlock.flowClampTwoArgBlock();
    tremoloBlock.dockTypes[1] = 'numberin';
    tremoloBlock.dockTypes[2] = 'numberin';
    tremoloBlock.defaults.push(10);
    tremoloBlock.defaults.push(50);

    var phaserBlock = new ProtoBlock('phaser');
    phaserBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['phaser'] = phaserBlock;
    phaserBlock.staticLabels.push(_('phaser'), _('rate'), _('octaves'), _('base frequency'));
    phaserBlock.adjustWidthToLabel();
    phaserBlock.flowClampThreeArgBlock();
    phaserBlock.dockTypes[1] = 'numberin';
    phaserBlock.dockTypes[2] = 'numberin';
    phaserBlock.dockTypes[3] = 'numberin';
    phaserBlock.defaults.push(0.5);
    phaserBlock.defaults.push(3);
    phaserBlock.defaults.push(350);

    var chorusBlock = new ProtoBlock('chorus');
    chorusBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['chorus'] = chorusBlock;
    chorusBlock.staticLabels.push(_('chorus'), _('rate'), _('delay') + ' (MS)', _('depth'));
    chorusBlock.adjustWidthToLabel();
    chorusBlock.flowClampThreeArgBlock();
    chorusBlock.dockTypes[1] = 'numberin';
    chorusBlock.dockTypes[2] = 'numberin';
    chorusBlock.dockTypes[3] = 'numberin';
    chorusBlock.defaults.push(1.5);
    chorusBlock.defaults.push(3.5);
    chorusBlock.defaults.push(70);

    var vibratoBlock = new ProtoBlock('vibrato');
    vibratoBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['vibrato'] = vibratoBlock;
    vibratoBlock.staticLabels.push(_('vibrato'), _('intensity'), _('rate'));
    vibratoBlock.adjustWidthToLabel();
    vibratoBlock.flowClampTwoArgBlock();
    vibratoBlock.defaults.push(10);
    vibratoBlock.defaults.push(1 / 16);

    var voiceBlock = new ProtoBlock('setvoice');
    voiceBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['setvoice'] = voiceBlock;
    voiceBlock.staticLabels.push(_('set synth'));
    voiceBlock.adjustWidthToLabel();
    voiceBlock.flowClampOneArgBlock();
    voiceBlock.dockTypes[1] = 'textin';
    voiceBlock.defaults.push(_('violin'));

    var articulationBlock = new ProtoBlock('articulation');
    articulationBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['articulation'] = articulationBlock;
    articulationBlock.staticLabels.push(_('set relative volume'));
    articulationBlock.adjustWidthToLabel();
    articulationBlock.flowClampOneArgBlock();
    articulationBlock.defaults.push(25);

    var pppBlock = new ProtoBlock('ppp');
    pppBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['ppp'] = pppBlock;
    pppBlock.staticLabels.push('ppp');
    pppBlock.adjustWidthToLabel();
    pppBlock.zeroArgBlock();

    var ppBlock = new ProtoBlock('pp');
    ppBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['pp'] = ppBlock;
    ppBlock.staticLabels.push('pp');
    ppBlock.adjustWidthToLabel();
    ppBlock.zeroArgBlock();

    var pBlock = new ProtoBlock('p');
    pBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['p'] = pBlock;
    pBlock.staticLabels.push('p');
    pBlock.adjustWidthToLabel();
    pBlock.zeroArgBlock();

    var mpBlock = new ProtoBlock('mp');
    mpBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['mp'] = mpBlock;
    mpBlock.staticLabels.push('mp');
    mpBlock.adjustWidthToLabel();
    mpBlock.zeroArgBlock();

    var mfBlock = new ProtoBlock('mf');
    mfBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['mf'] = mfBlock;
    mfBlock.staticLabels.push('mf');
    mfBlock.adjustWidthToLabel();
    mfBlock.zeroArgBlock();

    var fBlock = new ProtoBlock('f');
    fBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['f'] = fBlock;
    fBlock.staticLabels.push('f');
    fBlock.adjustWidthToLabel();
    fBlock.zeroArgBlock();

    var ffBlock = new ProtoBlock('ff');
    ffBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['ff'] = ffBlock;
    ffBlock.staticLabels.push('ff');
    ffBlock.adjustWidthToLabel();
    ffBlock.zeroArgBlock();

    var fffBlock = new ProtoBlock('fff');
    fffBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['fff'] = fffBlock;
    fffBlock.staticLabels.push('fff');
    fffBlock.adjustWidthToLabel();
    fffBlock.zeroArgBlock();

    var noteVolumeBlock = new ProtoBlock('setnotevolume');
    noteVolumeBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['setnotevolume'] = noteVolumeBlock;
    noteVolumeBlock.staticLabels.push(_('set volume'));
    noteVolumeBlock.adjustWidthToLabel();
    noteVolumeBlock.oneArgBlock();
    noteVolumeBlock.defaults.push(50);

    var noteVolumeBlock2 = new ProtoBlock('setnotevolume2');
    noteVolumeBlock2.palette = palettes.dict['tone'];
    blocks.protoBlockDict['setnotevolume2'] = noteVolumeBlock2;
    noteVolumeBlock2.staticLabels.push(_('set volume'));
    noteVolumeBlock2.adjustWidthToLabel();
    noteVolumeBlock2.flowClampOneArgBlock();
    noteVolumeBlock2.defaults.push(50);
    noteVolumeBlock2.hidden = true;

    var crescendoBlock = new ProtoBlock('crescendo');
    crescendoBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['crescendo'] = crescendoBlock;
    crescendoBlock.staticLabels.push(_('crescendo')+" +/-");
    crescendoBlock.adjustWidthToLabel();
    crescendoBlock.flowClampOneArgBlock();
    crescendoBlock.defaults.push(5);

    var slurBlock = new ProtoBlock('slur');
    slurBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['slur'] = slurBlock;
    //.TRANS: legato: overlap successive notes
    slurBlock.staticLabels.push(_('slur'));
    slurBlock.adjustWidthToLabel();
    slurBlock.flowClampOneArgBlock();
    slurBlock.defaults.push(16);
    slurBlock.hidden = true;

    var staccatoBlock = new ProtoBlock('staccato');
    staccatoBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['staccato'] = staccatoBlock;
    //.TRANS: play each note sharply detached from the others
    staccatoBlock.staticLabels.push(_('staccato'));
    staccatoBlock.adjustWidthToLabel();
    staccatoBlock.flowClampOneArgBlock();
    staccatoBlock.defaults.push(32);
    staccatoBlock.hidden = true;

    var setTimbreBlock = new ProtoBlock('settimbre');
    setTimbreBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['settimbre'] = setTimbreBlock;
    setTimbreBlock.staticLabels.push(_('set timbre'));
    setTimbreBlock.adjustWidthToLabel();
    setTimbreBlock.flowClampOneArgBlock();
    setTimbreBlock.dockTypes[1] = 'textin';
    setTimbreBlock.defaults.push(_('custom'));
    
    /*var setTimbreBlock = new ProtoBlock('settimbre');
    setTimbreBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['settimbre'] = setTimbreBlock;
    setTimbreBlock.staticLabels.push(_('set timbre'));
    setTimbreBlock.adjustWidthToLabel();
    setTimbreBlock.flowClampOneArgBlock();
    setTimbreBlock.defaults.push(_('custom'));
    */

    var newslurBlock = new ProtoBlock('newslur');
    newslurBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['newslur'] = newslurBlock;
    newslurBlock.staticLabels.push(_('slur'));
    newslurBlock.adjustWidthToLabel();
    newslurBlock.flowClampOneArgBlock();
    newslurBlock.defaults.push(1 / 16);

    var newstaccatoBlock = new ProtoBlock('newstaccato');
    newstaccatoBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['newstaccato'] = newstaccatoBlock;
    newstaccatoBlock.staticLabels.push(_('staccato'));
    newstaccatoBlock.adjustWidthToLabel();
    newstaccatoBlock.flowClampOneArgBlock();
    newstaccatoBlock.defaults.push(1 / 32);

    // INTERVALS (PITCH TRANSFORMS) PALETTE

    var diminished8Block = new ProtoBlock('diminished8');
    diminished8Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished8'] = diminished8Block;
    diminished8Block.staticLabels.push(_('diminished') + ' 8');
    diminished8Block.adjustWidthToLabel();
    diminished8Block.zeroArgBlock();

    var diminished5Block = new ProtoBlock('diminished5');
    diminished5Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished5'] = diminished5Block;
    diminished5Block.staticLabels.push(_('diminished') + ' 5');
    diminished5Block.adjustWidthToLabel();
    diminished5Block.zeroArgBlock();

    var diminished4Block = new ProtoBlock('diminished4');
    diminished4Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished4'] = diminished4Block;
    diminished4Block.staticLabels.push(_('diminished') + ' 4');
    diminished4Block.adjustWidthToLabel();
    diminished4Block.zeroArgBlock();

    var diminished1Block = new ProtoBlock('diminished1');
    diminished1Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished1'] = diminished1Block;
    diminished1Block.staticLabels.push(_('diminished') + ' 1');
    diminished1Block.adjustWidthToLabel();
    diminished1Block.zeroArgBlock();

    var diminishedBlock = new ProtoBlock('diminished');
    diminishedBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished'] = diminishedBlock;
    diminishedBlock.staticLabels.push(_('diminished'));
    diminishedBlock.adjustWidthToLabel();
    diminishedBlock.flowClampOneArgBlock();
    diminishedBlock.defaults.push(5);
    diminishedBlock.hidden = true;

    var diminishedxBlock = new ProtoBlock('diminishedx');
    diminishedxBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminishedx'] = diminishedxBlock;
    diminishedxBlock.staticLabels.push(_('diminished'), _('interval'), _('octave') + '+/-');
    diminishedxBlock.extraWidth = 20;
    diminishedxBlock.adjustWidthToLabel();
    diminishedxBlock.flowClampTwoArgBlock();
    diminishedxBlock.dockTypes[2] = 'anyin';
    diminishedxBlock.defaults.push(5);
    diminishedxBlock.defaults.push(0);

    var augmented8Block = new ProtoBlock('augmented8');
    augmented8Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented8'] = augmented8Block;
    augmented8Block.staticLabels.push(_('augmented') + ' 8');
    augmented8Block.adjustWidthToLabel();
    augmented8Block.zeroArgBlock();

    var augmented7Block = new ProtoBlock('augmented7');
    augmented7Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented7'] = augmented7Block;
    augmented7Block.staticLabels.push(_('augmented') + ' 7');
    augmented7Block.adjustWidthToLabel();
    augmented7Block.zeroArgBlock();

    var augmented5Block = new ProtoBlock('augmented5');
    augmented5Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented5'] = augmented5Block;
    augmented5Block.staticLabels.push(_('augmented') + ' 5');
    augmented5Block.adjustWidthToLabel();
    augmented5Block.zeroArgBlock();

    var augmented4Block = new ProtoBlock('augmented4');
    augmented4Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented4'] = augmented4Block;
    augmented4Block.staticLabels.push(_('augmented') + ' 4');
    augmented4Block.adjustWidthToLabel();
    augmented4Block.zeroArgBlock();

     var augmented2Block = new ProtoBlock('augmented2');
    augmented2Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented2'] = augmented2Block;
    augmented2Block.staticLabels.push(_('augmented') + ' 2');
    augmented2Block.adjustWidthToLabel();
    augmented2Block.zeroArgBlock();

    var augmented1Block = new ProtoBlock('augmented1');
    augmented1Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented1'] = augmented1Block;
    augmented1Block.staticLabels.push(_('augmented') + ' 1');
    augmented1Block.adjustWidthToLabel();
    augmented1Block.zeroArgBlock();

    var augmentedBlock = new ProtoBlock('augmented');
    augmentedBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented'] = augmentedBlock;
    augmentedBlock.staticLabels.push(_('augmented'));
    augmentedBlock.adjustWidthToLabel();
    augmentedBlock.flowClampOneArgBlock();
    augmentedBlock.defaults.push(5);
    augmentedBlock.hidden = true;

    var augmentedxBlock = new ProtoBlock('augmentedx');
    augmentedxBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmentedx'] = augmentedxBlock;
    augmentedxBlock.staticLabels.push(_('augmented'), _('interval'), _('octave') + '+/-');
    augmentedxBlock.extraWidth = 20;
    augmentedxBlock.adjustWidthToLabel();
    augmentedxBlock.flowClampTwoArgBlock();
    augmentedxBlock.dockTypes[2] = 'anyin';
    augmentedxBlock.defaults.push(5);
    augmentedxBlock.defaults.push(0);

    var perfect8Block = new ProtoBlock('perfect8');
    perfect8Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect8'] = perfect8Block;
    perfect8Block.staticLabels.push(_('perfect') + ' 8');
    perfect8Block.adjustWidthToLabel();
    perfect8Block.zeroArgBlock();

    var perfect5Block = new ProtoBlock('perfect5');
    perfect5Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect5'] = perfect5Block;
    perfect5Block.staticLabels.push(_('perfect') + ' 5');
    perfect5Block.adjustWidthToLabel();
    perfect5Block.zeroArgBlock();

    var perfect4Block = new ProtoBlock('perfect4');
    perfect4Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect4'] = perfect4Block;
    perfect4Block.staticLabels.push(_('perfect') + ' 4');
    perfect4Block.adjustWidthToLabel();
    perfect4Block.zeroArgBlock();

    var perfect1Block = new ProtoBlock('perfect1');
    perfect1Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect1'] = perfect1Block;
    perfect1Block.staticLabels.push(_('perfect') + ' 1');
    perfect1Block.adjustWidthToLabel();
    perfect1Block.zeroArgBlock();

    var perfectBlock = new ProtoBlock('perfect');
    perfectBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect'] = perfectBlock;
    perfectBlock.staticLabels.push(_('perfect'));
    perfectBlock.adjustWidthToLabel();
    perfectBlock.flowClampOneArgBlock();
    perfectBlock.defaults.push(5);
    perfectBlock.hidden = true;

    var perfectxBlock = new ProtoBlock('perfectx');
    perfectxBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfectx'] = perfectxBlock;
    perfectxBlock.staticLabels.push(_('perfect'), _('interval'), _('octave') + '+/-');
    perfectxBlock.extraWidth = 20;
    perfectxBlock.adjustWidthToLabel();
    perfectxBlock.flowClampTwoArgBlock();
    perfectxBlock.dockTypes[2] = 'anyin';
    perfectxBlock.defaults.push(5);
    perfectxBlock.defaults.push(0);

    var minor7Block = new ProtoBlock('minor7');
    minor7Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor7'] = minor7Block;
    minor7Block.staticLabels.push(_('minor') +  ' 7');
    minor7Block.adjustWidthToLabel();
    minor7Block.zeroArgBlock();

    var minor6Block = new ProtoBlock('minor6');
    minor6Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor6'] = minor6Block;
    minor6Block.staticLabels.push(_('minor') + ' 6');
    minor6Block.adjustWidthToLabel();
    minor6Block.zeroArgBlock();

    var minor3Block = new ProtoBlock('minor3');
    minor3Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor3'] = minor3Block;
    minor3Block.staticLabels.push(_('minor') + ' 3');
    minor3Block.adjustWidthToLabel();
    minor3Block.zeroArgBlock();

    var minor2Block = new ProtoBlock('minor2');
    minor2Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor2'] = minor2Block;
    minor2Block.staticLabels.push(_('minor') + ' 2');
    minor2Block.adjustWidthToLabel();
    minor2Block.zeroArgBlock();

    var minorBlock = new ProtoBlock('minor');
    minorBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor'] = minorBlock;
    minorBlock.staticLabels.push(_('minor'));
    minorBlock.adjustWidthToLabel();
    minorBlock.flowClampOneArgBlock();
    minorBlock.defaults.push(3);
    minorBlock.hidden = true;

    var minorxBlock = new ProtoBlock('minorx');
    minorxBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minorx'] = minorxBlock;
    minorxBlock.staticLabels.push(_('minor'), _('interval'), _('octave') + '+/-');
    minorxBlock.extraWidth = 20;
    minorxBlock.adjustWidthToLabel();
    minorxBlock.flowClampTwoArgBlock();
    minorxBlock.dockTypes[2] = 'anyin';
    minorxBlock.defaults.push(3);
    minorxBlock.defaults.push(0);

    var major7Block = new ProtoBlock('major7');
    major7Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major7'] = major7Block;
    major7Block.staticLabels.push(_('major') + ' 7');
    major7Block.adjustWidthToLabel();
    major7Block.zeroArgBlock();

    var major6Block = new ProtoBlock('major6');
    major6Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major6'] = major6Block;
    major6Block.staticLabels.push(_('major') + ' 6');
    major6Block.adjustWidthToLabel();
    major6Block.zeroArgBlock();

    var major3Block = new ProtoBlock('major3');
    major3Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major3'] = major3Block;
    major3Block.staticLabels.push(_('major') + ' 3');
    major3Block.adjustWidthToLabel();
    major3Block.zeroArgBlock();

    var major2Block = new ProtoBlock('major2');
    major2Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major2'] = major2Block;
    major2Block.staticLabels.push(_('major') + ' 2');
    major2Block.adjustWidthToLabel();
    major2Block.zeroArgBlock();

    var majorBlock = new ProtoBlock('major');
    majorBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major'] = majorBlock;
    majorBlock.staticLabels.push(_('major'));
    majorBlock.adjustWidthToLabel();
    majorBlock.flowClampOneArgBlock();
    majorBlock.defaults.push(3);
    majorBlock.hidden = true;

    var majorxBlock = new ProtoBlock('majorx');
    majorxBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['majorx'] = majorxBlock;
    majorxBlock.staticLabels.push(_('major'), _('interval'), _('octave') + '+/-');
    majorxBlock.extraWidth = 20;
    majorxBlock.adjustWidthToLabel();
    majorxBlock.flowClampTwoArgBlock();
    majorxBlock.dockTypes[2] = 'anyin';
    majorxBlock.defaults.push(3);
    majorxBlock.defaults.push(0);

    var intervalBlock = new ProtoBlock('interval');
    intervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['interval'] = intervalBlock;
    //.TRANS: calculate a relative step between notes based on the current mode
    intervalBlock.staticLabels.push(_('relative interval'));
    intervalBlock.adjustWidthToLabel();
    intervalBlock.flowClampOneArgBlock();
    intervalBlock.defaults.push(5);

    // DRUM PALETTE
    var drumnameBlock = new ProtoBlock('drumname');
    drumnameBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['drumname'] = drumnameBlock;
    drumnameBlock.valueBlock();
    drumnameBlock.dockTypes[0] = 'textout';

    var duckBlock = new ProtoBlock('duck');
    duckBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['duck'] = duckBlock;
    duckBlock.staticLabels.push(_('duck'));
    duckBlock.adjustWidthToLabel();
    duckBlock.oneArgBlock();

    var catBlock = new ProtoBlock('cat');
    catBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cat'] = catBlock;
    catBlock.staticLabels.push(_('cat'));
    catBlock.adjustWidthToLabel();
    catBlock.oneArgBlock();

    var cricketBlock = new ProtoBlock('cricket');
    cricketBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cricket'] = cricketBlock;
    cricketBlock.staticLabels.push(_('cricket'));
    cricketBlock.adjustWidthToLabel();
    cricketBlock.oneArgBlock();

    var dogBlock = new ProtoBlock('dog');
    dogBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['dog'] = dogBlock;
    dogBlock.staticLabels.push(_('dog'));
    dogBlock.adjustWidthToLabel();
    dogBlock.oneArgBlock();

    var pluckBlock = new ProtoBlock('pluck');
    pluckBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['pluck'] = pluckBlock;
    pluckBlock.staticLabels.push(_('pluck'));
    pluckBlock.adjustWidthToLabel();
    pluckBlock.oneArgBlock();

    var bottleBlock = new ProtoBlock('bottle');
    bottleBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['bottle'] = bottleBlock;
    bottleBlock.staticLabels.push(_('bottle'));
    bottleBlock.adjustWidthToLabel();
    bottleBlock.oneArgBlock();

    var bubblesBlock = new ProtoBlock('bubbles');
    bubblesBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['bubbles'] = bubblesBlock;
    bubblesBlock.staticLabels.push(_('bubbles'));
    bubblesBlock.adjustWidthToLabel();
    bubblesBlock.oneArgBlock();

    var chineBlock = new ProtoBlock('chine');
    chineBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['chine'] = chineBlock;
    chineBlock.staticLabels.push(_('chine'));
    chineBlock.adjustWidthToLabel();
    chineBlock.oneArgBlock();

    var clangBlock = new ProtoBlock('clang');
    clangBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['clang'] = clangBlock;
    clangBlock.staticLabels.push(_('clang'));
    clangBlock.adjustWidthToLabel();
    clangBlock.oneArgBlock();

    var clapBlock = new ProtoBlock('clap');
    clapBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['clap'] = clapBlock;
    clapBlock.staticLabels.push(_('clap'));
    clapBlock.adjustWidthToLabel();
    clapBlock.oneArgBlock();

    var slapBlock = new ProtoBlock('slap');
    slapBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['slap'] = slapBlock;
    slapBlock.staticLabels.push(_('slap'));
    slapBlock.adjustWidthToLabel();
    slapBlock.oneArgBlock();

    var crashBlock = new ProtoBlock('crash');
    crashBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['crash'] = crashBlock;
    crashBlock.staticLabels.push(_('crash'));
    crashBlock.adjustWidthToLabel();
    crashBlock.oneArgBlock();

    var splashBlock = new ProtoBlock('tom');
    splashBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['tom'] = splashBlock;
    splashBlock.staticLabels.push(_('splash'));
    splashBlock.adjustWidthToLabel();
    splashBlock.oneArgBlock();

    var cowbellBlock = new ProtoBlock('cowbell');
    cowbellBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cowbell'] = cowbellBlock;
    cowbellBlock.staticLabels.push(_('cow bell'));
    cowbellBlock.adjustWidthToLabel();
    cowbellBlock.oneArgBlock();

    var ridebellBlock = new ProtoBlock('ridebell');
    ridebellBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['ridebell'] = ridebellBlock;
    ridebellBlock.staticLabels.push(_('ride bell'));
    ridebellBlock.adjustWidthToLabel();
    ridebellBlock.oneArgBlock();

    var fingercymbalsBlock = new ProtoBlock('fingercymbals');
    fingercymbalsBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['fingercymbals'] = fingercymbalsBlock;
    fingercymbalsBlock.staticLabels.push(_('finger cymbals'));
    fingercymbalsBlock.adjustWidthToLabel();
    fingercymbalsBlock.oneArgBlock();

    var trianglebellBlock = new ProtoBlock('trianglebell');
    trianglebellBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['trianglebell'] = trianglebellBlock;
    trianglebellBlock.staticLabels.push(_('triangle bell'));
    trianglebellBlock.adjustWidthToLabel();
    trianglebellBlock.oneArgBlock();

    var hihatBlock = new ProtoBlock('hihat');
    hihatBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['hihat'] = hihatBlock;
    hihatBlock.staticLabels.push(_('hi hat'));
    hihatBlock.adjustWidthToLabel();
    hihatBlock.oneArgBlock();

    var darbukaBlock = new ProtoBlock('darbuka');
    darbukaBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['darbuka'] = darbukaBlock;
    darbukaBlock.staticLabels.push(_('darbuka drum'));
    darbukaBlock.adjustWidthToLabel();
    darbukaBlock.oneArgBlock();

    var cupBlock = new ProtoBlock('cup');
    cupBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cup'] = cupBlock;
    cupBlock.staticLabels.push(_('cup drum'));
    cupBlock.adjustWidthToLabel();
    cupBlock.oneArgBlock();

    var floortomBlock = new ProtoBlock('floortom');
    floortomBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['floortom'] = floortomBlock;
    floortomBlock.staticLabels.push(_('floor tom tom'));
    floortomBlock.adjustWidthToLabel();
    floortomBlock.oneArgBlock();

    var tomBlock = new ProtoBlock('tom');
    tomBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['tom'] = tomBlock;
    tomBlock.staticLabels.push(_('tom tom'));
    tomBlock.adjustWidthToLabel();
    tomBlock.oneArgBlock();

    var kickBlock = new ProtoBlock('kick');
    kickBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['kick'] = kickBlock;
    kickBlock.staticLabels.push(_('kick drum'));
    kickBlock.adjustWidthToLabel();
    kickBlock.oneArgBlock();

    var snareBlock = new ProtoBlock('snare');
    snareBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['snare'] = snareBlock;
    snareBlock.staticLabels.push(_('snare drum'));
    snareBlock.adjustWidthToLabel();
    snareBlock.oneArgBlock();

    var setdrumBlock = new ProtoBlock('setdrum');
    setdrumBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['setdrum'] = setdrumBlock;
    //.TRANS: set the current drum sound for playback
    setdrumBlock.staticLabels.push(_('set drum'));
    setdrumBlock.adjustWidthToLabel();
    setdrumBlock.flowClampOneArgBlock();
    setdrumBlock.dockTypes[1] = 'anyin';

    var playdrumBlock = new ProtoBlock('playdrum');
    playdrumBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['playdrum'] = playdrumBlock;
    playdrumBlock.staticLabels.push(_('drum'));
    playdrumBlock.adjustWidthToLabel();
    playdrumBlock.oneArgBlock();
    playdrumBlock.dockTypes[1] = 'anyin';

    // TURTLE PALETTE

    var headingBlock = new ProtoBlock('heading');
    headingBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['heading'] = headingBlock;
    headingBlock.staticLabels.push(_('heading'));
    headingBlock.adjustWidthToLabel();
    headingBlock.parameterBlock();

    var xBlock = new ProtoBlock('x');
    xBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['x'] = xBlock;
    xBlock.staticLabels.push(_('x'));
    xBlock.adjustWidthToLabel();
    xBlock.parameterBlock();

    var yBlock = new ProtoBlock('y');
    yBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['y'] = yBlock;
    yBlock.staticLabels.push(_('y'));
    yBlock.adjustWidthToLabel();
    yBlock.parameterBlock();

    var clearBlock = new ProtoBlock('clear');
    clearBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['clear'] = clearBlock;
    clearBlock.staticLabels.push(_('clear'));
    clearBlock.adjustWidthToLabel();
    clearBlock.zeroArgBlock();

    var controlPoint2Block = new ProtoBlock('controlpoint2');
    controlPoint2Block.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['controlpoint2'] = controlPoint2Block;
    controlPoint2Block.staticLabels.push(_('control point 2'), _('x'), _('y'));
    controlPoint2Block.adjustWidthToLabel();
    controlPoint2Block.twoArgBlock();
    controlPoint2Block.defaults.push(100);
    controlPoint2Block.defaults.push(25);
    controlPoint2Block.dockTypes[1] = 'numberin';
    controlPoint2Block.dockTypes[2] = 'numberin';

    var controlPoint1Block = new ProtoBlock('controlpoint1');
    controlPoint1Block.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['controlpoint1'] = controlPoint1Block;
    controlPoint1Block.staticLabels.push(_('control point 1'), _('x'), _('y'));
    controlPoint1Block.adjustWidthToLabel();
    controlPoint1Block.twoArgBlock();
    controlPoint1Block.defaults.push(100);
    controlPoint1Block.defaults.push(75);
    controlPoint1Block.dockTypes[1] = 'numberin';
    controlPoint1Block.dockTypes[2] = 'numberin';

    var bezierBlock = new ProtoBlock('bezier');
    bezierBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['bezier'] = bezierBlock;
    //.TRANS: Bézier curves employ at least three points to define a curve
    bezierBlock.staticLabels.push(_('bezier'), _('x'), _('y'));
    bezierBlock.adjustWidthToLabel();
    bezierBlock.twoArgBlock();
    bezierBlock.defaults.push(0);
    bezierBlock.defaults.push(100);
    bezierBlock.dockTypes[1] = 'numberin';
    bezierBlock.dockTypes[2] = 'numberin';

    var arcBlock = new ProtoBlock('arc');
    arcBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['arc'] = arcBlock;
    arcBlock.staticLabels.push(_('arc'), _('angle'), _('radius'));
    arcBlock.adjustWidthToLabel();
    arcBlock.twoArgBlock();
    arcBlock.defaults.push(90);
    arcBlock.defaults.push(100);
    arcBlock.dockTypes[1] = 'numberin';

    var setheadingBlock = new ProtoBlock('setheading');
    setheadingBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['setheading'] = setheadingBlock;
    setheadingBlock.staticLabels.push(_('set heading'));
    setheadingBlock.adjustWidthToLabel();
    setheadingBlock.oneArgBlock();
    setheadingBlock.defaults.push(0);

    var setxyBlock = new ProtoBlock('setxy');
    setxyBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['setxy'] = setxyBlock;
    setxyBlock.staticLabels.push(_('set xy'), _('x'), _('y'));
    setxyBlock.adjustWidthToLabel();
    setxyBlock.twoArgBlock();
    setxyBlock.defaults.push(0);
    setxyBlock.defaults.push(0);
    setxyBlock.dockTypes[1] = 'numberin';

    var rightBlock = new ProtoBlock('right');
    rightBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['right'] = rightBlock;
    rightBlock.staticLabels.push(_('right'));
    rightBlock.adjustWidthToLabel();
    rightBlock.oneArgBlock();
    rightBlock.defaults.push(90);

    var leftBlock = new ProtoBlock('left');
    leftBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['left'] = leftBlock;
    leftBlock.staticLabels.push(_('left'));
    leftBlock.adjustWidthToLabel();
    leftBlock.oneArgBlock();
    leftBlock.defaults.push(90);

    var backBlock = new ProtoBlock('back');
    backBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['back'] = backBlock;
    backBlock.staticLabels.push(_('back'));
    backBlock.adjustWidthToLabel();
    backBlock.oneArgBlock();
    backBlock.defaults.push(100);

    var forwardBlock = new ProtoBlock('forward');
    forwardBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['forward'] = forwardBlock;
    forwardBlock.staticLabels.push(_('forward'));
    forwardBlock.adjustWidthToLabel();
    forwardBlock.oneArgBlock();
    forwardBlock.defaults.push(100);

    // PEN PALETTE

    var fillscreenBlock = new ProtoBlock('fillscreen');
    fillscreenBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['fillscreen'] = fillscreenBlock;
    fillscreenBlock.hidden = true;
    fillscreenBlock.staticLabels.push(_('background'));
    fillscreenBlock.adjustWidthToLabel();
    fillscreenBlock.threeArgBlock();

    var colorBlock = new ProtoBlock('color');
    colorBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['color'] = colorBlock;
    colorBlock.staticLabels.push(_('color'));
    colorBlock.adjustWidthToLabel();
    colorBlock.parameterBlock();

    var shadeBlock = new ProtoBlock('shade');
    shadeBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['shade'] = shadeBlock;
    shadeBlock.staticLabels.push(_('shade'));
    shadeBlock.adjustWidthToLabel();
    shadeBlock.parameterBlock();

    var chromaBlock = new ProtoBlock('grey');
    chromaBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['grey'] = chromaBlock;
    chromaBlock.staticLabels.push(_('grey'));
    chromaBlock.adjustWidthToLabel();
    chromaBlock.parameterBlock();

    var pensizeBlock = new ProtoBlock('pensize');
    pensizeBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['pensize'] = pensizeBlock;
    pensizeBlock.staticLabels.push(_('pen size'));
    pensizeBlock.adjustWidthToLabel();
    pensizeBlock.parameterBlock();

    var setfontBlock = new ProtoBlock('setfont');
    setfontBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setfont'] = setfontBlock;
    setfontBlock.staticLabels.push(_('set font'));
    setfontBlock.adjustWidthToLabel();
    setfontBlock.oneArgBlock();
    setfontBlock.defaults.push(DEFAULTFONT);
    setfontBlock.dockTypes[1] = 'textin';

    var backgroundBlock = new ProtoBlock('background');
    backgroundBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['background'] = backgroundBlock;
    backgroundBlock.staticLabels.push(_('background'));
    backgroundBlock.adjustWidthToLabel();
    backgroundBlock.zeroArgBlock();

    var hollowBlock = new ProtoBlock('hollowline');
    hollowBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['hollowline'] = hollowBlock;
    //.TRANS: draw a line that has a hollow space down its center
    hollowBlock.staticLabels.push(_('hollow line'));
    hollowBlock.adjustWidthToLabel();
    hollowBlock.flowClampZeroArgBlock();

    var fillBlock = new ProtoBlock('fill');
    fillBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['fill'] = fillBlock;
    fillBlock.staticLabels.push(_('fill'));
    fillBlock.adjustWidthToLabel();
    fillBlock.flowClampZeroArgBlock();

    var penupBlock = new ProtoBlock('penup');
    penupBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['penup'] = penupBlock;
    penupBlock.staticLabels.push(_('pen up'));
    penupBlock.adjustWidthToLabel();
    penupBlock.zeroArgBlock();

    var pendownBlock = new ProtoBlock('pendown');
    pendownBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['pendown'] = pendownBlock;
    pendownBlock.staticLabels.push(_('pen down'));
    pendownBlock.adjustWidthToLabel();
    pendownBlock.zeroArgBlock();

    var setpensizeBlock = new ProtoBlock('setpensize');
    setpensizeBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setpensize'] = setpensizeBlock;
    setpensizeBlock.staticLabels.push(_('set pen size'));
    setpensizeBlock.adjustWidthToLabel();
    setpensizeBlock.oneArgBlock();
    setpensizeBlock.defaults.push(5);

    var settranslucencyBlock = new ProtoBlock('settranslucency');
    settranslucencyBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['settranslucency'] = settranslucencyBlock;
    //.TRANS: set degree of translucence of the pen color
    settranslucencyBlock.staticLabels.push(_('set translucency'));
    settranslucencyBlock.adjustWidthToLabel();
    settranslucencyBlock.oneArgBlock();
    settranslucencyBlock.defaults.push(50);

    var sethueBlock = new ProtoBlock('sethue');
    sethueBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['sethue'] = sethueBlock;
    sethueBlock.staticLabels.push(_('set hue'));
    sethueBlock.adjustWidthToLabel();
    sethueBlock.oneArgBlock();
    sethueBlock.defaults.push(0);

    var setshadeBlock = new ProtoBlock('setshade');
    setshadeBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setshade'] = setshadeBlock;
    setshadeBlock.staticLabels.push(_('set shade'));
    setshadeBlock.adjustWidthToLabel();
    setshadeBlock.oneArgBlock();
    setshadeBlock.defaults.push(50);

    var setchromaBlock = new ProtoBlock('setgrey');
    setchromaBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setgrey'] = setchromaBlock;
    //.TRANS: set the level of vividness of the pen color
    setchromaBlock.staticLabels.push(_('set grey'));
    setchromaBlock.adjustWidthToLabel();
    setchromaBlock.oneArgBlock();
    setchromaBlock.defaults.push(100);

    var setcolorBlock = new ProtoBlock('setcolor');
    setcolorBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setcolor'] = setcolorBlock;
    setcolorBlock.staticLabels.push(_('set color'));
    setcolorBlock.adjustWidthToLabel();
    setcolorBlock.oneArgBlock();
    setcolorBlock.defaults.push(0);

    // NUMBERS PALETTE

    var intBlock = new ProtoBlock('int');
    intBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['int'] = intBlock;
    //.TRANS: convert a real number to an integer
    intBlock.staticLabels.push(_('int'));
    intBlock.adjustWidthToLabel();
    intBlock.oneArgMathBlock();
    intBlock.defaults.push(100)

    var greaterBlock = new ProtoBlock('greater');
    greaterBlock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['greater'] = greaterBlock;
    greaterBlock.fontsize = 14;
    greaterBlock.staticLabels.push('&gt;');
    greaterBlock.extraWidth = 20;
    greaterBlock.booleanTwoArgBlock();

    var lessBlock = new ProtoBlock('less');
    lessBlock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['less'] = lessBlock;
    lessBlock.fontsize = 14;
    lessBlock.staticLabels.push('&lt;');
    lessBlock.extraWidth = 20;
    lessBlock.booleanTwoArgBlock();

    var equalBlock = new ProtoBlock('equal');
    equalBlock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['equal'] = equalBlock;
    equalBlock.fontsize = 14;
    equalBlock.staticLabels.push('=');
    equalBlock.extraWidth = 20;
    equalBlock.booleanTwoArgBlock();
    equalBlock.dockTypes[0] = 'booleanout';
    equalBlock.dockTypes[1] = 'anyin';
    equalBlock.dockTypes[2] = 'anyin';

    var andBlock = new ProtoBlock('and');
    andBlock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['and'] = andBlock;
    andBlock.extraWidth = 10;
    andBlock.staticLabels.push(_('and'));
    andBlock.booleanTwoBooleanArgBlock();

    var orBlock = new ProtoBlock('or');
    orBlock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['or'] = orBlock;
    orBlock.extraWidth = 10;
    orBlock.staticLabels.push(_('or'));
    orBlock.booleanTwoBooleanArgBlock();

    var notBlock = new ProtoBlock('not');
    notBlock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['not'] = notBlock;
    notBlock.extraWidth = 30;
    notBlock.staticLabels.push(_('not'));
    notBlock.booleanOneBooleanArgBlock();

    // Only used to excute methods in the Math library
    var evalBlock = new ProtoBlock('eval');
    evalBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['eval'] = evalBlock;
    //.TRANS: evaluate some math functions, e.g., absolute value, sine, exponential, etc.
    evalBlock.staticLabels.push(_('eval'));
    evalBlock.staticLabels.push('f(x)');
    evalBlock.staticLabels.push('x');
    evalBlock.adjustWidthToLabel();
    evalBlock.twoArgMathBlock();
    evalBlock.dockTypes[1] = 'textin';
    evalBlock.defaults.push('abs(x)');
    evalBlock.defaults.push(-100);

    var modBlock = new ProtoBlock('mod');
    modBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['mod'] = modBlock;
    modBlock.staticLabels.push(_('mod'));
    modBlock.adjustWidthToLabel();
    modBlock.twoArgMathBlock();
    modBlock.defaults.push(100, 10)

    var powerBlock = new ProtoBlock('power');
    powerBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['power'] = powerBlock;
    powerBlock.fontsize = 14;
    powerBlock.staticLabels.push('^');
    powerBlock.twoArgMathBlock();
    powerBlock.defaults.push(2, 4)

    var sqrtBlock = new ProtoBlock('sqrt');
    sqrtBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['sqrt'] = sqrtBlock;
    // TRANS: square root function in mathematics
    sqrtBlock.staticLabels.push(_('sqrt'));
    sqrtBlock.adjustWidthToLabel();
    sqrtBlock.oneArgMathBlock();
    sqrtBlock.defaults.push(64)

    var absBlock = new ProtoBlock('abs');
    absBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['abs'] = absBlock;
    // TRANS: absolute value function in mathematics
    absBlock.staticLabels.push(_('abs'));
    absBlock.adjustWidthToLabel();
    absBlock.oneArgMathBlock();

    var divideBlock = new ProtoBlock('divide');
    divideBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['divide'] = divideBlock;
    divideBlock.fontsize = 14;
    divideBlock.staticLabels.push('/');
    divideBlock.twoArgMathBlock();
    divideBlock.defaults.push(1, 4)

    var multiplyBlock = new ProtoBlock('multiply');
    multiplyBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['multiply'] = multiplyBlock;
    multiplyBlock.fontsize = 14;
    multiplyBlock.staticLabels.push('×');
    multiplyBlock.twoArgMathBlock();
    multiplyBlock.defaults.push(1, 12)

    var negBlock = new ProtoBlock('neg');
    negBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['neg'] = negBlock;
    negBlock.fontsize = 14;
    negBlock.staticLabels.push('–');
    negBlock.oneArgMathBlock();

    var minusBlock = new ProtoBlock('minus');
    minusBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['minus'] = minusBlock;
    minusBlock.fontsize = 14;
    minusBlock.staticLabels.push('–');
    minusBlock.twoArgMathBlock();
    minusBlock.defaults.push(8, 4)

    var plusBlock = new ProtoBlock('plus');
    plusBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['plus'] = plusBlock;
    plusBlock.fontsize = 14;
    plusBlock.staticLabels.push('+');
    plusBlock.twoArgMathBlock();
    plusBlock.dockTypes[0] = 'anyout';
    plusBlock.dockTypes[1] = 'anyin';
    plusBlock.dockTypes[2] = 'anyin';
    plusBlock.defaults.push(2, 2)

    var oneOfBlock = new ProtoBlock('oneOf');
    oneOfBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['oneOf'] = oneOfBlock;
    oneOfBlock.staticLabels.push(_('one of'), _('this'), _('that'));
    oneOfBlock.adjustWidthToLabel();
    oneOfBlock.twoArgMathBlock();
    oneOfBlock.dockTypes[0] = 'anyout';
    oneOfBlock.dockTypes[1] = 'anyin';
    oneOfBlock.dockTypes[2] = 'anyin';
    oneOfBlock.defaults.push(-90, 90);

    var randomBlock = new ProtoBlock('random');
    randomBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['random'] = randomBlock;
    randomBlock.staticLabels.push(_('random'), _('min'), _('max'));
    randomBlock.adjustWidthToLabel();
    randomBlock.twoArgMathBlock();
    randomBlock.defaults.push(0, 12);

    var numberBlock = new ProtoBlock('number');
    numberBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['number'] = numberBlock;
    numberBlock.valueBlock();

    // BLOCKS PALETTE

    var incrementOneBlock = new ProtoBlock('incrementOne');
    incrementOneBlock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['incrementOne'] = incrementOneBlock;
    incrementOneBlock.staticLabels.push(_('add 1 to'));
    incrementOneBlock.adjustWidthToLabel();
    incrementOneBlock.oneArgBlock();

    var incrementBlock = new ProtoBlock('increment');
    incrementBlock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['increment'] = incrementBlock;
    incrementBlock.staticLabels.push(_('add'), _('to'), _('value'));
    incrementBlock.adjustWidthToLabel();
    incrementBlock.twoArgBlock();
    incrementBlock.dockTypes[1] = 'anyin';
    incrementBlock.dockTypes[2] = 'anyin';

    var boxBlock = new ProtoBlock('box');
    boxBlock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['box'] = boxBlock;
    boxBlock.staticLabels.push(_('box'));
    boxBlock.extraWidth = 10;
    boxBlock.adjustWidthToLabel();
    boxBlock.oneArgMathBlock();
    boxBlock.defaults.push(_('box'));
    boxBlock.dockTypes[0] = 'anyout';
    // Show the value in the box as if it were a parameter.
    boxBlock.parameter = true;
    boxBlock.dockTypes[1] = 'anyin';

    var storeinBlock = new ProtoBlock('storein');
    storeinBlock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['storein'] = storeinBlock;
    storeinBlock.staticLabels.push(_('store in'), _('name'), _('value'));
    storeinBlock.adjustWidthToLabel();
    storeinBlock.twoArgBlock();
    storeinBlock.defaults.push(_('box'));
    storeinBlock.defaults.push(4);
    storeinBlock.dockTypes[1] = 'anyin';
    storeinBlock.dockTypes[2] = 'anyin';

    var namedBoxBlock = new ProtoBlock('namedbox');
    namedBoxBlock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['namedbox'] = namedBoxBlock;
    namedBoxBlock.staticLabels.push(_('box'));
    namedBoxBlock.extraWidth = 10;
    namedBoxBlock.adjustWidthToLabel();
    namedBoxBlock.parameterBlock();
    namedBoxBlock.dockTypes[0] = 'anyout';

    // ACTIONS PALETTE

    var doBlock = new ProtoBlock('do');
    doBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['do'] = doBlock;
    doBlock.staticLabels.push(_('do'));
    doBlock.adjustWidthToLabel();
    doBlock.oneArgBlock();
    doBlock.defaults.push(_('action'));
    doBlock.dockTypes[1] = 'anyin';

    var returnBlock = new ProtoBlock('return');
    returnBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['return'] = returnBlock;
    returnBlock.staticLabels.push(_('return'));
    returnBlock.extraWidth = 10;
    returnBlock.adjustWidthToLabel();
    returnBlock.oneArgBlock();
    returnBlock.defaults.push(100);
    returnBlock.dockTypes[1] = 'anyin';

    var returnToUrlBlock = new ProtoBlock('returnToUrl');
    returnToUrlBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['returnToUrl'] = returnToUrlBlock;
    returnToUrlBlock.staticLabels.push(_('return to URL'));
    returnToUrlBlock.extraWidth = 10;
    returnToUrlBlock.adjustWidthToLabel();
    returnToUrlBlock.oneArgBlock();
    returnToUrlBlock.defaults.push(_('100'));
    returnToUrlBlock.dockTypes[1] = 'anyin';

    var calcBlock = new ProtoBlock('calc');
    calcBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['calc'] = calcBlock;
    calcBlock.staticLabels.push(_('calculate'));
    calcBlock.adjustWidthToLabel();
    calcBlock.oneArgMathBlock();
    calcBlock.defaults.push(_('action'));
    calcBlock.dockTypes[0] = 'anyout';
    calcBlock.dockTypes[1] = 'anyin';

    var namedCalcBlock = new ProtoBlock('namedcalc');
    namedCalcBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['namedcalc'] = namedCalcBlock;
    namedCalcBlock.staticLabels.push(_('action'));
    namedCalcBlock.extraWidth = 10;
    namedCalcBlock.adjustWidthToLabel();
    namedCalcBlock.parameterBlock();

    var namedDoArgBlock = new ProtoBlock('nameddoArg');
    namedDoArgBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['nameddoArg'] = namedDoArgBlock;
    namedDoArgBlock.staticLabels.push(_('do'));
    namedDoArgBlock.adjustWidthToLabel();
    namedDoArgBlock.argClampBlock();
    namedDoArgBlock.dockTypes[1] = 'anyin';

    var namedCalcArgBlock = new ProtoBlock('namedcalcArg');
    namedCalcArgBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['namedcalcArg'] = namedCalcArgBlock;
    namedCalcArgBlock.staticLabels.push(_('calculate'));
    namedCalcArgBlock.adjustWidthToLabel();
    namedCalcArgBlock.argClampMathBlock();
    namedCalcArgBlock.dockTypes[0] = 'anyout';
    namedCalcArgBlock.dockTypes[1] = 'anyin';

    var doArgBlock = new ProtoBlock('doArg');
    doArgBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['doArg'] = doArgBlock;
    doArgBlock.staticLabels.push(_('do'));
    doArgBlock.adjustWidthToLabel();
    doArgBlock.argClampOneArgBlock();
    doArgBlock.defaults.push(_('action'));
    doArgBlock.dockTypes[1] = 'anyin';
    doArgBlock.dockTypes[2] = 'anyin';

    var calcArgBlock = new ProtoBlock('calcArg');
    calcArgBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['calcArg'] = calcArgBlock;
    calcArgBlock.staticLabels.push(_('calculate'));
    calcArgBlock.adjustWidthToLabel();
    calcArgBlock.argClampOneArgMathBlock();
    calcArgBlock.defaults.push(_('action'));
    calcArgBlock.dockTypes[0] = 'anyout';
    calcArgBlock.dockTypes[1] = 'anyin';
    calcArgBlock.dockTypes[2] = 'anyin';

    var argBlock = new ProtoBlock('arg');
    argBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['arg'] = argBlock;
    argBlock.staticLabels.push('arg');
    argBlock.adjustWidthToLabel();
    argBlock.oneArgMathBlock();
    argBlock.defaults.push(1);
    argBlock.dockTypes[0] = 'anyout';
    argBlock.dockTypes[1] = 'numberin';

    var namedArgBlock = new ProtoBlock('namedarg');
    namedArgBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['namedarg'] = namedArgBlock;
    namedArgBlock.staticLabels.push('arg ' + 1);
    namedArgBlock.adjustWidthToLabel();
    namedArgBlock.parameterBlock();

    var listenBlock = new ProtoBlock('listen');
    listenBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['listen'] = listenBlock;
    //.TRANS: an event, such as user actions (mouse clicks, key presses)
    listenBlock.staticLabels.push(_('on'), _('event'), _('do'));
    listenBlock.adjustWidthToLabel();
    listenBlock.twoArgBlock();
    listenBlock.defaults.push(_('event'));
    listenBlock.defaults.push(_('action'));
    listenBlock.dockTypes[1] = 'textin';
    listenBlock.dockTypes[2] = 'textin';

    var dispatchBlock = new ProtoBlock('dispatch');
    dispatchBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['dispatch'] = dispatchBlock;
    dispatchBlock.staticLabels.push(_('broadcast'));
    dispatchBlock.adjustWidthToLabel();
    dispatchBlock.oneArgBlock();
    dispatchBlock.defaults.push(_('event'));
    dispatchBlock.dockTypes[1] = 'textin';

    var drumBlock = new ProtoBlock('drum');
    drumBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['drum'] = drumBlock;
    drumBlock.staticLabels.push(_('start drum'));
    drumBlock.extraWidth = 10;
    drumBlock.adjustWidthToLabel();
    drumBlock.stackClampZeroArgBlock();

    var startBlock = new ProtoBlock('start');
    startBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['start'] = startBlock;
    startBlock.staticLabels.push(_('start'));
    startBlock.extraWidth = 10;
    startBlock.adjustWidthToLabel();
    startBlock.stackClampZeroArgBlock();

    var actionBlock = new ProtoBlock('action');
    actionBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['action'] = actionBlock;
    actionBlock.staticLabels.push(_('action'));
    actionBlock.extraWidth = 25;
    actionBlock.adjustWidthToLabel();
    actionBlock.stackClampOneArgBlock();
    actionBlock.defaults.push(_('action'));

    var namedDoBlock = new ProtoBlock('nameddo');
    namedDoBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['nameddo'] = namedDoBlock;
    namedDoBlock.hidden = true;
    namedDoBlock.staticLabels.push(_('action'));
    namedDoBlock.extraWidth = 10;
    namedDoBlock.adjustWidthToLabel();
    namedDoBlock.zeroArgBlock();

    // HEAP PALETTE

    var loadHeapFromApp = new ProtoBlock('loadHeapFromApp');
    loadHeapFromApp.palette = palettes.dict['heap'];
    blocks.protoBlockDict['loadHeapFromApp'] = loadHeapFromApp;
    loadHeapFromApp.staticLabels.push(_('load heap from App'));
    loadHeapFromApp.adjustWidthToLabel();
    loadHeapFromApp.twoArgBlock();
    loadHeapFromApp.dockTypes[1] = 'textin';
    loadHeapFromApp.dockTypes[2] = 'textin';
    loadHeapFromApp.defaults.push('appName')
    loadHeapFromApp.defaults.push('localhost');

    var saveHeapToApp = new ProtoBlock('saveHeapToApp');
    saveHeapToApp.palette = palettes.dict['heap'];
    blocks.protoBlockDict['saveHeapToApp'] = saveHeapToApp;
    saveHeapToApp.staticLabels.push(_('save heap to App'));
    saveHeapToApp.adjustWidthToLabel();
    saveHeapToApp.twoArgBlock();
    saveHeapToApp.dockTypes[1] = 'textin';
    saveHeapToApp.dockTypes[2] = 'textin';
    saveHeapToApp.defaults.push('appName')
    saveHeapToApp.defaults.push('localhost');

    var setHeapEntry = new ProtoBlock('setHeapEntry');
    setHeapEntry.palette = palettes.dict['heap'];
    blocks.protoBlockDict['setHeapEntry'] = setHeapEntry;
    //.TRANS: set a value in the heap
    setHeapEntry.staticLabels.push(_('set heap'), _('index'), _('value'));
    setHeapEntry.adjustWidthToLabel();
    setHeapEntry.twoArgBlock();
    setHeapEntry.dockTypes[1] = 'numberin';
    setHeapEntry.dockTypes[2] = 'anyin';
    setHeapEntry.defaults.push(1);
    setHeapEntry.defaults.push(100);

    var showHeap = new ProtoBlock('showHeap');
    showHeap.palette = palettes.dict['heap'];
    blocks.protoBlockDict['showHeap'] = showHeap;
    showHeap.staticLabels.push(_('show heap'));
    showHeap.adjustWidthToLabel();
    showHeap.zeroArgBlock();

    var heapLength = new ProtoBlock('heapLength');
    heapLength.palette = palettes.dict['heap'];
    blocks.protoBlockDict['heapLength'] = heapLength;
    heapLength.staticLabels.push(_('heap length'));
    heapLength.adjustWidthToLabel();
    heapLength.parameterBlock();
    heapLength.dockTypes[0] = 'numberout';

    var heapEmpty = new ProtoBlock('heapEmpty');
    heapEmpty.palette = palettes.dict['heap'];
    blocks.protoBlockDict['heapEmpty'] = heapEmpty;
    heapEmpty.staticLabels.push(_('heap empty?'));
    heapEmpty.adjustWidthToLabel();
    heapEmpty.booleanZeroArgBlock();

    var emptyHeap = new ProtoBlock('emptyHeap');
    emptyHeap.palette = palettes.dict['heap'];
    blocks.protoBlockDict['emptyHeap'] = emptyHeap;
    emptyHeap.staticLabels.push(_('empty heap'));
    emptyHeap.adjustWidthToLabel();
    emptyHeap.zeroArgBlock();

    var saveHeap = new ProtoBlock('saveHeap');
    saveHeap.palette = palettes.dict['heap'];
    blocks.protoBlockDict['saveHeap'] = saveHeap;
    saveHeap.staticLabels.push(_('save heap'));
    saveHeap.adjustWidthToLabel();
    saveHeap.oneArgBlock();
    saveHeap.defaults.push('heap.json');
    saveHeap.dockTypes[1] = 'textin';

    var loadHeap = new ProtoBlock('loadHeap');
    loadHeap.palette = palettes.dict['heap'];
    blocks.protoBlockDict['loadHeap'] = loadHeap;
    loadHeap.staticLabels.push(_('load heap'));
    loadHeap.adjustWidthToLabel();
    loadHeap.oneArgBlock();
    loadHeap.dockTypes[1] = 'filein';
    loadHeap.defaults = [[null, null]];

    var indexHeap = new ProtoBlock('indexHeap');
    indexHeap.palette = palettes.dict['heap'];
    blocks.protoBlockDict['indexHeap'] = indexHeap;
    //.TRANS: retrieve a value from the heap at index position in the heap
    indexHeap.staticLabels.push(_('index heap'));
    indexHeap.adjustWidthToLabel();
    indexHeap.oneArgMathBlock();
    indexHeap.dockTypes[1] = 'numberin';
    indexHeap.defaults.push(1);

    var pushBlk = new ProtoBlock('push');
    pushBlk.palette = palettes.dict['heap'];
    blocks.protoBlockDict['push'] = pushBlk;
    pushBlk.staticLabels.push(_('push'));
    pushBlk.adjustWidthToLabel();
    pushBlk.oneArgBlock();
    pushBlk.dockTypes[1] = 'anyin';

    var popBlk = new ProtoBlock('pop');
    popBlk.palette = palettes.dict['heap'];
    blocks.protoBlockDict['pop'] = popBlk;
    popBlk.staticLabels.push(_('pop'));
    popBlk.adjustWidthToLabel();
    popBlk.parameterBlock();

    // MEDIA PALETTE

    var speakBlock = new ProtoBlock('speak');
    speakBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['speak'] = speakBlock;
    speakBlock.staticLabels.push(_('speak'));
    speakBlock.adjustWidthToLabel();
    speakBlock.oneArgBlock();
    speakBlock.defaults.push('hello');
    speakBlock.dockTypes[1] = 'textin';

    var cameraBlock = new ProtoBlock('camera');
    cameraBlock.palette = palettes.dict['media'];
    cameraBlock.image = 'images/camera.svg'
    blocks.protoBlockDict['camera'] = cameraBlock;
    cameraBlock.mediaBlock();

    var videoBlock = new ProtoBlock('video');
    videoBlock.palette = palettes.dict['media'];
    videoBlock.image = 'images/video.svg'
    blocks.protoBlockDict['video'] = videoBlock;
    videoBlock.mediaBlock();

    var loadFile = new ProtoBlock('loadFile');
    loadFile.palette = palettes.dict['media'];
    blocks.protoBlockDict['loadFile'] = loadFile;
    loadFile.staticLabels.push('');
    loadFile.parameterBlock();
    loadFile.dockTypes[0] = 'fileout';

    var stopVideoCamBlock = new ProtoBlock('stopvideocam');
    stopVideoCamBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['stopvideocam'] = stopVideoCamBlock;
    stopVideoCamBlock.staticLabels.push(_('stop media'));
    stopVideoCamBlock.adjustWidthToLabel();
    stopVideoCamBlock.zeroArgBlock();

    var toneBlock = new ProtoBlock('tone');
    toneBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['tone'] = toneBlock;
    toneBlock.staticLabels.push(_('tone'),  _('frequency'), _('duration (ms)'));
    toneBlock.adjustWidthToLabel();
    toneBlock.defaults.push(392, 1000 / 3);
    toneBlock.twoArgBlock();
    toneBlock.dockTypes[1] = 'numberin';
    toneBlock.dockTypes[2] = 'numberin';

    var toFrequencyBlock = new ProtoBlock('tofrequency');
    toFrequencyBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['tofrequency'] = toFrequencyBlock;
    //.TRANS: translate a note into hertz, e.g., A4 -> 440HZ
    toFrequencyBlock.staticLabels.push(_('note to frequency'), _('name'), _('octave'));
    toFrequencyBlock.adjustWidthToLabel();
    toFrequencyBlock.defaults.push('G');
    toFrequencyBlock.defaults.push('4');
    toFrequencyBlock.twoArgMathBlock();
    toFrequencyBlock.dockTypes[1] = 'notein';
    toFrequencyBlock.dockTypes[2] = 'anyin';

    var shellBlock = new ProtoBlock('turtleshell');
    shellBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['turtleshell'] = shellBlock;
    //.TRANS: Shell is the shell of a turtle (used as a metaphor for changing the appearance of a sprite)
    shellBlock.staticLabels.push(_('shell'), _('size'), _('image'));
    shellBlock.adjustWidthToLabel();
    shellBlock.twoArgBlock();
    shellBlock.defaults.push(55);
    shellBlock.defaults.push(null);
    shellBlock.dockTypes[1] = 'numberin';
    shellBlock.dockTypes[2] = 'mediain';

    var showBlock = new ProtoBlock('show');
    showBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['show'] = showBlock;
    //.TRANS: a media object
    showBlock.staticLabels.push(_('show'), _('size'), _('obj'));
    showBlock.adjustWidthToLabel();
    showBlock.twoArgBlock();
    showBlock.defaults.push(24);
    showBlock.defaults.push(_('text'));
    showBlock.dockTypes[1] = 'numberin';
    showBlock.dockTypes[2] = 'anyin';

    var mediaBlock = new ProtoBlock('media');
    mediaBlock.palette = palettes.dict['media'];
    mediaBlock.image = 'images/load-media.svg'
    blocks.protoBlockDict['media'] = mediaBlock;
    mediaBlock.mediaBlock();
    mediaBlock.dockTypes[0] = 'mediaout';

    var textBlock = new ProtoBlock('text');
    textBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['text'] = textBlock;
    textBlock.valueBlock();
    textBlock.dockTypes[0] = 'textout';

    // FLOW PALETTE

    var hiddenNoFlowBlock = new ProtoBlock('hiddennoflow');
    hiddenNoFlowBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['hiddennoflow'] = hiddenNoFlowBlock;
    hiddenNoFlowBlock.hiddenNoFlow = true;
    hiddenNoFlowBlock.hiddenBlockNoFlow();
    hiddenNoFlowBlock.hidden = true;

    var hiddenBlock = new ProtoBlock('hidden');
    hiddenBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['hidden'] = hiddenBlock;
    hiddenBlock.hidden = true;
    hiddenBlock.hiddenBlockFlow();

    var defaultBlock = new ProtoBlock('defaultcase');
    defaultBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['defaultcase'] = defaultBlock;
    defaultBlock.staticLabels.push(_('default'));
    defaultBlock.adjustWidthToLabel();
    defaultBlock.flowClampBlock();

    var caseBlock = new ProtoBlock('case');
    caseBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['case'] = caseBlock;
    caseBlock.staticLabels.push(_('case'));
    caseBlock.adjustWidthToLabel();
    caseBlock.flowClampOneArgBlock();
    caseBlock.dockTypes[1] = 'anyin';

    var switchBlock = new ProtoBlock('switch');
    switchBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['switch'] = switchBlock;
    switchBlock.staticLabels.push(_('switch'));
    switchBlock.adjustWidthToLabel();
    switchBlock.flowClampOneArgBlock();
    switchBlock.dockTypes[1] = 'anyin';

    var clampBlock = new ProtoBlock('clamp');
    clampBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['clamp'] = clampBlock;
    clampBlock.hidden = true;
    clampBlock.flowClampBlock();

    var breakBlock = new ProtoBlock('break');
    breakBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['break'] = breakBlock;
    breakBlock.staticLabels.push(_('stop'));
    breakBlock.adjustWidthToLabel();
    breakBlock.basicBlockNoFlow();

    var waitForBlock = new ProtoBlock('waitFor');
    waitForBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['waitFor'] = waitForBlock;
    waitForBlock.staticLabels.push(_('wait for'));
    waitForBlock.adjustWidthToLabel();
    waitForBlock.oneBooleanArgBlock();

    var untilBlock = new ProtoBlock('until');
    untilBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['until'] = untilBlock;
    untilBlock.staticLabels.push(_('until'), _('do'));
    untilBlock.adjustWidthToLabel();
    untilBlock.flowClampBooleanArgBlock();

    var whileBlock = new ProtoBlock('while');
    whileBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['while'] = whileBlock;
    whileBlock.staticLabels.push(_('while'), _('do'));
    whileBlock.adjustWidthToLabel();
    whileBlock.flowClampBooleanArgBlock();

    var ifthenelseBlock = new ProtoBlock('ifthenelse');
    ifthenelseBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['ifthenelse'] = ifthenelseBlock;
    ifthenelseBlock.staticLabels.push(_('if'), _('then'), _('else'));
    ifthenelseBlock.adjustWidthToLabel();
    ifthenelseBlock.doubleFlowClampBooleanArgBlock();

    var ifBlock = new ProtoBlock('if');
    ifBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['if'] = ifBlock;
    ifBlock.staticLabels.push(_('if'), _('then'));
    ifBlock.adjustWidthToLabel();
    ifBlock.flowClampBooleanArgBlock();

    var foreverBlock = new ProtoBlock('forever');
    foreverBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['forever'] = foreverBlock;
    foreverBlock.staticLabels.push(_('forever'));
    foreverBlock.adjustWidthToLabel();
    foreverBlock.flowClampZeroArgBlock();

    var repeatBlock = new ProtoBlock('repeat');
    repeatBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['repeat'] = repeatBlock;
    repeatBlock.staticLabels.push(_('repeat'));
    repeatBlock.adjustWidthToLabel();
    repeatBlock.flowClampOneArgBlock();
    repeatBlock.defaults.push(4);

    // EXTRAS PALETTE

    // NOP blocks (used as placeholders when loaded blocks not found)
    var nopValueBlock = new ProtoBlock('nopValueBlock');
    blocks.protoBlockDict['nopValueBlock'] = nopValueBlock;
    nopValueBlock.hidden = true;
    nopValueBlock.palette = palettes.dict['extras'];
    nopValueBlock.staticLabels.push(_('unknown'));
    nopValueBlock.adjustWidthToLabel();
    nopValueBlock.valueBlock();
    nopValueBlock.dockTypes[0] = 'anyout';

    /*
    var nopOneArgMathBlock = new ProtoBlock('nopOneArgMathBlock');
    blocks.protoBlockDict['nopOneArgMathBlock'] = nopOneArgMathBlock;
    nopOneArgMathBlock.hidden = true;
    nopOneArgMathBlock.palette = palettes.dict['extras'];
    nopOneArgMathBlock.oneArgMathBlock();
    nopOneArgMathBlock.staticLabels.push(_('unknown'));
    nopOneArgMathBlock.dockTypes[0] = 'anyout';
    nopOneArgMathBlock.dockTypes[1] = 'anyin';

    var nopTwoArgMathBlock = new ProtoBlock('nopTwoArgMathBlock');
    blocks.protoBlockDict['nopTwoArgMathBlock'] = nopTwoArgMathBlock;
    nopTwoArgMathBlock.twoArgMathBlock();
    nopTwoArgMathBlock.hidden = true;
    nopTwoArgMathBlock.palette = palettes.dict['extras'];
    nopTwoArgMathBlock.staticLabels.push(_('unknown'));
    nopTwoArgMathBlock.dockTypes[0] = 'anyout';
    nopTwoArgMathBlock.dockTypes[1] = 'anyin';
    nopTwoArgMathBlock.dockTypes[2] = 'anyin';
    */

    var nopZeroArgBlock = new ProtoBlock('nopZeroArgBlock');
    blocks.protoBlockDict['nopZeroArgBlock'] = nopZeroArgBlock;
    nopZeroArgBlock.hidden = true;
    nopZeroArgBlock.palette = palettes.dict['extras'];
    nopZeroArgBlock.staticLabels.push(_('unknown'));
    nopZeroArgBlock.adjustWidthToLabel();
    nopZeroArgBlock.zeroArgBlock();

    var nopOneArgBlock = new ProtoBlock('nopOneArgBlock');
    blocks.protoBlockDict['nopOneArgBlock'] = nopOneArgBlock;
    nopOneArgBlock.hidden = true;
    nopOneArgBlock.palette = palettes.dict['extras'];
    nopOneArgBlock.staticLabels.push(_('unknown'));
    nopOneArgBlock.adjustWidthToLabel();
    nopOneArgBlock.oneArgBlock();
    nopOneArgBlock.dockTypes[1] = 'anyin';

    var nopTwoArgBlock = new ProtoBlock('nopTwoArgBlock');
    blocks.protoBlockDict['nopTwoArgBlock'] = nopTwoArgBlock;
    nopTwoArgBlock.hidden = true;
    nopTwoArgBlock.palette = palettes.dict['extras'];
    nopTwoArgBlock.staticLabels.push(_('unknown'));
    nopTwoArgBlock.adjustWidthToLabel();
    nopTwoArgBlock.twoArgBlock();
    nopTwoArgBlock.dockTypes[1] = 'anyin';
    nopTwoArgBlock.dockTypes[2] = 'anyin';

    var nopThreeArgBlock = new ProtoBlock('nopThreeArgBlock');
    blocks.protoBlockDict['nopThreeArgBlock'] = nopThreeArgBlock;
    nopThreeArgBlock.hidden = true;
    nopThreeArgBlock.palette = palettes.dict['extras'];
    nopThreeArgBlock.staticLabels.push(_('unknown'));
    nopThreeArgBlock.adjustWidthToLabel();
    nopThreeArgBlock.threeArgBlock();
    nopThreeArgBlock.dockTypes[1] = 'anyin';
    nopThreeArgBlock.dockTypes[2] = 'anyin';
    nopThreeArgBlock.dockTypes[3] = 'anyin';

    var audioBlock = new ProtoBlock('playback');
    audioBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['playback'] = audioBlock;
    audioBlock.defaults.push(null);
    //.TRANS: play an audio recording
    audioBlock.staticLabels.push(_('play back'));
    audioBlock.adjustWidthToLabel();
    audioBlock.oneArgBlock();
    audioBlock.dockTypes[1] = 'mediain';

    var audioStopBlock = new ProtoBlock('stopplayback');
    audioStopBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['stopplayback'] = audioStopBlock;
    audioStopBlock.staticLabels.push(_('stop play'));
    audioStopBlock.adjustWidthToLabel();
    audioStopBlock.zeroArgBlock();

    var abcBlock = new ProtoBlock('saveabc');
    abcBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['saveabc'] = abcBlock;
    abcBlock.staticLabels.push(_('save as ABC'));
    abcBlock.adjustWidthToLabel();
    abcBlock.oneArgBlock();
    abcBlock.defaults.push(_('title') + '.abc');
    abcBlock.dockTypes[1] = 'textin';

    var lilypondBlock = new ProtoBlock('savelilypond');
    lilypondBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['savelilypond'] = lilypondBlock;
    lilypondBlock.staticLabels.push(_('save as lilypond'));
    lilypondBlock.adjustWidthToLabel();
    lilypondBlock.oneArgBlock();
    lilypondBlock.defaults.push(_('title') + '.ly');
    lilypondBlock.dockTypes[1] = 'textin';

    var svgBlock = new ProtoBlock('savesvg');
    svgBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['savesvg'] = svgBlock;
    svgBlock.staticLabels.push(_('save svg'));
    svgBlock.adjustWidthToLabel();
    svgBlock.oneArgBlock();
    svgBlock.defaults.push(_('title') + '.svg');
    svgBlock.dockTypes[1] = 'textin';

    var getyTurtleBlock = new ProtoBlock('yturtle');
    getyTurtleBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['yturtle'] = getyTurtleBlock;
    getyTurtleBlock.staticLabels.push(_('mouse y'));
    getyTurtleBlock.adjustWidthToLabel();
    getyTurtleBlock.oneArgMathBlock();
    getyTurtleBlock.dockTypes[1] = 'anyin';
    getyTurtleBlock.defaults.push('0');

    var getxTurtleBlock = new ProtoBlock('xturtle');
    getxTurtleBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['xturtle'] = getxTurtleBlock;
    getxTurtleBlock.staticLabels.push(_('mouse x'));
    getxTurtleBlock.adjustWidthToLabel();
    getxTurtleBlock.oneArgMathBlock();
    getxTurtleBlock.dockTypes[1] = 'anyin';
    getxTurtleBlock.defaults.push('0');

    var startTurtleBlock = new ProtoBlock('startTurtle');
    startTurtleBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['startTurtle'] = startTurtleBlock;
    startTurtleBlock.staticLabels.push(_('start mouse'));
    startTurtleBlock.adjustWidthToLabel();
    startTurtleBlock.oneArgBlock();
    startTurtleBlock.dockTypes[1] = 'anyin';
    startTurtleBlock.defaults.push('0');

    var stopTurtleBlock = new ProtoBlock('stopTurtle');
    stopTurtleBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['stopTurtle'] = stopTurtleBlock;
    stopTurtleBlock.staticLabels.push(_('stop mouse'));
    stopTurtleBlock.adjustWidthToLabel();
    stopTurtleBlock.oneArgBlock();
    stopTurtleBlock.dockTypes[1] = 'anyin';
    stopTurtleBlock.defaults.push('0');

    var noBackgroundBlock = new ProtoBlock('nobackground');
    blocks.protoBlockDict['nobackground'] = noBackgroundBlock;
    noBackgroundBlock.palette = palettes.dict['extras'];
    noBackgroundBlock.staticLabels.push(_('no background'));
    noBackgroundBlock.adjustWidthToLabel();
    noBackgroundBlock.zeroArgBlock();

    var showBlocks = new ProtoBlock('showblocks');
    showBlocks.palette = palettes.dict['extras'];
    blocks.protoBlockDict['showblocks'] = showBlocks;
    showBlocks.staticLabels.push(_('show blocks'));
    showBlocks.adjustWidthToLabel();
    showBlocks.zeroArgBlock();

    var hideBlocks = new ProtoBlock('hideblocks');
    hideBlocks.palette = palettes.dict['extras'];
    blocks.protoBlockDict['hideblocks'] = hideBlocks;
    hideBlocks.staticLabels.push(_('hide blocks'));
    hideBlocks.adjustWidthToLabel();
    hideBlocks.zeroArgBlock();

    var openProjectBlock = new ProtoBlock('openProject');
    openProjectBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['openProject'] = openProjectBlock;
    openProjectBlock.staticLabels.push(_('open project'));
    openProjectBlock.adjustWidthToLabel();
    openProjectBlock.oneArgBlock();
    openProjectBlock.defaults.push('url');
    openProjectBlock.dockTypes[1] = 'textin';

    var vspaceBlock = new ProtoBlock('vspace');
    vspaceBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['vspace'] = vspaceBlock;
    vspaceBlock.staticLabels.push('↓');
    vspaceBlock.extraWidth = -10;
    vspaceBlock.zeroArgBlock();

    var hspaceBlock = new ProtoBlock('hspace');
    hspaceBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['hspace'] = hspaceBlock;
    hspaceBlock.staticLabels.push('←');
    hspaceBlock.oneArgMathBlock();
    hspaceBlock.dockTypes[0] = 'anyout';
    hspaceBlock.dockTypes[1] = 'anyin';

    var waitBlock = new ProtoBlock('wait');
    waitBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['wait'] = waitBlock;
    waitBlock.staticLabels.push(_('wait'));
    waitBlock.adjustWidthToLabel();
    waitBlock.oneArgBlock();
    waitBlock.defaults.push(1);

    var printBlock = new ProtoBlock('print');
    printBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['print'] = printBlock;
    printBlock.staticLabels.push(_('print'));
    printBlock.adjustWidthToLabel();
    printBlock.oneArgBlock();
    printBlock.dockTypes[1] = 'anyin';
    printBlock.defaults.push(_("Music Blocks"));

    var turtleNameBlock = new ProtoBlock('turtlename');
    turtleNameBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['turtlename'] = turtleNameBlock;
    turtleNameBlock.staticLabels.push(_('mouse name'));
    turtleNameBlock.adjustWidthToLabel();
    turtleNameBlock.parameterBlock();
    turtleNameBlock.dockTypes[0] = 'textout';

    var setTurtleName = new ProtoBlock('setturtlename');
    setTurtleName.palette = palettes.dict['extras'];
    blocks.protoBlockDict['setturtlename'] = setTurtleName;
    setTurtleName.staticLabels.push(_('mouse name'));
    setTurtleName.staticLabels.push(_('source'));
    setTurtleName.staticLabels.push(_('target'));
    setTurtleName.adjustWidthToLabel();
    setTurtleName.twoArgBlock();
    setTurtleName.dockTypes[1] = 'anyin';
    setTurtleName.dockTypes[2] = 'anyin';
    setTurtleName.defaults.push('0');
    setTurtleName.defaults.push('Mozart');

    // SENSORS PALETTE

    var pitchnessBlock = new ProtoBlock('pitchness');
    pitchnessBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['pitchness'] = pitchnessBlock;
    pitchnessBlock.staticLabels.push(_('pitch'));
    pitchnessBlock.adjustWidthToLabel();
    pitchnessBlock.parameterBlock();
    pitchnessBlock.hidden = true;

    var loudnessBlock = new ProtoBlock('loudness');
    loudnessBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['loudness'] = loudnessBlock;
    loudnessBlock.staticLabels.push(_('loudness'));
    loudnessBlock.adjustWidthToLabel();
    loudnessBlock.parameterBlock();

    // Turtle-specific click event
    var myClickBlock = new ProtoBlock('myclick');
    myClickBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['myclick'] = myClickBlock;
    myClickBlock.staticLabels.push(_('click'));
    myClickBlock.adjustWidthToLabel();
    myClickBlock.parameterBlock();
    myClickBlock.dockTypes[0] = 'textout';

    var getBlue = new ProtoBlock('getblue');
    getBlue.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['getblue'] = getBlue;
    getBlue.staticLabels.push(_('blue'));
    getBlue.adjustWidthToLabel();
    getBlue.parameterBlock();

    var getGreen = new ProtoBlock('getgreen');
    getGreen.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['getgreen'] = getGreen;
    getGreen.staticLabels.push(_('green'));
    getGreen.adjustWidthToLabel();
    getGreen.parameterBlock();

    var getRed = new ProtoBlock('getred');
    getRed.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['getred'] = getRed;
    getRed.staticLabels.push(_('red'));
    getRed.adjustWidthToLabel();
    getRed.parameterBlock();

    var getColorPixel = new ProtoBlock('getcolorpixel');
    getColorPixel.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['getcolorpixel'] = getColorPixel;
    getColorPixel.staticLabels.push(_('pixel color'));
    getColorPixel.adjustWidthToLabel();
    getColorPixel.parameterBlock();

    var timeBlock = new ProtoBlock('time');
    timeBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['time'] = timeBlock;
    timeBlock.staticLabels.push(_('time'));
    timeBlock.adjustWidthToLabel();
    timeBlock.parameterBlock();

    var mouseyBlock = new ProtoBlock('mousey');
    mouseyBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['mousey'] = mouseyBlock;
    mouseyBlock.staticLabels.push(_('cursor y'));
    mouseyBlock.extraWidth = 15;
    mouseyBlock.adjustWidthToLabel();
    mouseyBlock.parameterBlock();

    var mousexBlock = new ProtoBlock('mousex');
    mousexBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['mousex'] = mousexBlock;
    mousexBlock.staticLabels.push(_('cursor x'));
    mousexBlock.extraWidth = 15;
    mousexBlock.adjustWidthToLabel();
    mousexBlock.parameterBlock();

    var mousebuttonBlock = new ProtoBlock('mousebutton');
    mousebuttonBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['mousebutton'] = mousebuttonBlock;
    mousebuttonBlock.staticLabels.push(_('mouse button'));
    mousebuttonBlock.adjustWidthToLabel();
    mousebuttonBlock.booleanZeroArgBlock();

    var toASCIIBlock = new ProtoBlock('toascii');
    toASCIIBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['toascii'] = toASCIIBlock;
    toASCIIBlock.staticLabels.push(_('to ASCII'));
    toASCIIBlock.defaults.push(65);
    toASCIIBlock.oneArgMathBlock();

    var keyboardBlock = new ProtoBlock('keyboard');
    keyboardBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['keyboard'] = keyboardBlock;
    keyboardBlock.staticLabels.push(_('keyboard'));
    keyboardBlock.adjustWidthToLabel();
    keyboardBlock.parameterBlock();

    // Push protoblocks onto their palettes.
    for (var protoblock in blocks.protoBlockDict) {
        if (blocks.protoBlockDict[protoblock].palette != null) {
            blocks.protoBlockDict[protoblock].palette.add(blocks.protoBlockDict[protoblock]);
        }
    }

    // Populate the lists of block types.
    blocks.findBlockTypes();
}
