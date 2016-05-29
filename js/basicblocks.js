// Copyright (c) 2014-16 Walter Bender
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

    // Synth blocks
    var squareBlock = new ProtoBlock('square');
    squareBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['square'] = squareBlock;
    squareBlock.staticLabels.push(_('square'));
    squareBlock.adjustWidthToLabel();
    squareBlock.oneArgBlock();
    squareBlock.defaults.push(440);

    var triangleBlock = new ProtoBlock('triangle');
    triangleBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['triangle'] = triangleBlock;
    triangleBlock.staticLabels.push(_('triangle'));
    triangleBlock.adjustWidthToLabel();
    triangleBlock.oneArgBlock();
    triangleBlock.defaults.push(440);

    var sineBlock = new ProtoBlock('sine');
    sineBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sine'] = sineBlock;
    sineBlock.staticLabels.push(_('sine'));
    sineBlock.adjustWidthToLabel();
    sineBlock.oneArgBlock();
    sineBlock.defaults.push(440);

    var sawtoothBlock = new ProtoBlock('sawtooth');
    sawtoothBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sawtooth'] = sawtoothBlock;
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
    consonantStepDownBlock.staticLabels.push(_('consonant step down'));
    consonantStepDownBlock.adjustWidthToLabel();
    consonantStepDownBlock.parameterBlock();

    var consonantStepUpBlock = new ProtoBlock('consonantstepsizeup');
    consonantStepUpBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['consonantstepsizeup'] = consonantStepUpBlock;
    consonantStepUpBlock.staticLabels.push(_('consonant step up'));
    consonantStepUpBlock.adjustWidthToLabel();
    consonantStepUpBlock.parameterBlock();

    var turtlePitchBlock = new ProtoBlock('turtlepitch');
    turtlePitchBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['turtlepitch'] = turtlePitchBlock;
    turtlePitchBlock.staticLabels.push(_('turtle pitch number'));
    turtlePitchBlock.oneArgMathBlock();
    turtlePitchBlock.adjustWidthToLabel();
    turtlePitchBlock.dockTypes[1] = 'anyin';

    var numberToPitchBlock = new ProtoBlock('number2pitch');
    numberToPitchBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['number2pitch'] = numberToPitchBlock;
    numberToPitchBlock.staticLabels.push(_('number to pitch'));
    numberToPitchBlock.oneArgMathBlock();
    numberToPitchBlock.adjustWidthToLabel();
    numberToPitchBlock.defaults.push(48);

    var numberToOctaveBlock = new ProtoBlock('number2octave');
    numberToOctaveBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['number2octave'] = numberToOctaveBlock;
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

    // Transposition blocks
    var invertblock = new ProtoBlock('invert');
    invertblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert'] = invertblock;
    invertblock.staticLabels.push(_('invert'), _('note'), _('octave'));
    invertblock.adjustWidthToLabel();
    invertblock.flowClampTwoArgBlock();
    invertblock.adjustWidthToLabel();
    invertblock.defaults.push('sol');
    invertblock.defaults.push(4);
    invertblock.dockTypes[1] = 'solfegein';
    invertblock.dockTypes[2] = 'anyin';

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
    
    var pitchStepBlock = new ProtoBlock('steppitch');
    pitchStepBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['steppitch'] = pitchStepBlock;
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
    pitch.dockTypes[2] = 'numberin';

    // MATRIX PALETTE

    var sixtyfourthNoteBlock = new ProtoBlock('sixtyfourthNote');
    sixtyfourthNoteBlock.palette = palettes.dict['matrix'];
    blocks.protoBlockDict['sixtyfourthNote'] = sixtyfourthNoteBlock;
    sixtyfourthNoteBlock.staticLabels.push(_('1/64 note') + ' 𝅘𝅥𝅱');
    sixtyfourthNoteBlock.adjustWidthToLabel();
    sixtyfourthNoteBlock.zeroArgBlock();

    var thirtysecondNoteBlock = new ProtoBlock('thirtysecondNote');
    thirtysecondNoteBlock.palette = palettes.dict['matrix'];
    blocks.protoBlockDict['thirtysecondNote'] = thirtysecondNoteBlock;
    thirtysecondNoteBlock.staticLabels.push(_('1/32 note') + ' 𝅘𝅥𝅰');
    thirtysecondNoteBlock.adjustWidthToLabel();
    thirtysecondNoteBlock.zeroArgBlock();

    var sixteenthNoteBlock = new ProtoBlock('sixteenthNote');
    sixteenthNoteBlock.palette = palettes.dict['matrix'];
    blocks.protoBlockDict['sixteenthNote'] = sixteenthNoteBlock;
    sixteenthNoteBlock.staticLabels.push(_('1/16 note') + ' 𝅘𝅥𝅯');
    sixteenthNoteBlock.adjustWidthToLabel();
    sixteenthNoteBlock.zeroArgBlock();

    var eighthNoteBlock = new ProtoBlock('eighthNote');
    eighthNoteBlock.palette = palettes.dict['matrix'];
    blocks.protoBlockDict['eighthNote'] = eighthNoteBlock;
    eighthNoteBlock.staticLabels.push(_('eighth note') + ' ♪');
    eighthNoteBlock.adjustWidthToLabel();
    eighthNoteBlock.zeroArgBlock();

    var quarterNoteBlock = new ProtoBlock('quarterNote');
    quarterNoteBlock.palette = palettes.dict['matrix'];
    blocks.protoBlockDict['quarterNote'] = quarterNoteBlock;
    quarterNoteBlock.staticLabels.push(_('quarter note') + ' ♩');
    quarterNoteBlock.adjustWidthToLabel();
    quarterNoteBlock.zeroArgBlock();

    var halfNoteBlock = new ProtoBlock('halfNote');
    halfNoteBlock.palette = palettes.dict['matrix'];
    blocks.protoBlockDict['halfNote'] = halfNoteBlock;
    halfNoteBlock.staticLabels.push(_('half note') + ' 𝅗𝅥');
    halfNoteBlock.adjustWidthToLabel();
    halfNoteBlock.zeroArgBlock();

    var wholeNoteBlock = new ProtoBlock('wholeNote');
    wholeNoteBlock.palette = palettes.dict['matrix'];
    blocks.protoBlockDict['wholeNote'] = wholeNoteBlock;
    wholeNoteBlock.staticLabels.push(_('whole note') + ' 𝅝');
    wholeNoteBlock.adjustWidthToLabel();
    wholeNoteBlock.zeroArgBlock();

    var tuplet2Block = new ProtoBlock('tuplet2');
    tuplet2Block.palette = palettes.dict['matrix'];
    blocks.protoBlockDict['tuplet2'] = tuplet2Block;
    // FIXME: Add extra labels to basicClamp blocks when present.
    tuplet2Block.staticLabels.push(_('tuplet'), _('number of notes'), _('note value'));
    tuplet2Block.extraWidth = 20;
    tuplet2Block.adjustWidthToLabel();
    tuplet2Block.flowClampTwoArgBlock();
    tuplet2Block.defaults.push(1);
    tuplet2Block.defaults.push(4);

    var rhythm = new ProtoBlock('rhythm');
    rhythm.palette = palettes.dict['matrix'];
    blocks.protoBlockDict['rhythm'] = rhythm;
    rhythm.staticLabels.push(_('rhythm'), _('number of notes'), _('note value'));
    rhythm.extraWidth = 10;
    rhythm.adjustWidthToLabel();
    rhythm.defaults.push(3);
    rhythm.defaults.push(4);
    rhythm.twoArgBlock();
    rhythm.dockTypes[1] = 'anyin';
    rhythm.dockTypes[2] = 'anyin';

    var matrixBlock = new ProtoBlock('matrix');
    matrixBlock.palette = palettes.dict['matrix'];
    blocks.protoBlockDict['matrix'] = matrixBlock;
    matrixBlock.staticLabels.push(_('pitch-time matrix'));
    matrixBlock.adjustWidthToLabel();
    matrixBlock.stackClampZeroArgBlock();

    // RHYTHM PALETTE

    var turtleNoteBlock = new ProtoBlock('turtlenote');
    turtleNoteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['turtlenote'] = turtleNoteBlock;
    turtleNoteBlock.staticLabels.push(_('turtle note value'));
    turtleNoteBlock.oneArgMathBlock();
    turtleNoteBlock.adjustWidthToLabel();
    turtleNoteBlock.dockTypes[1] = 'anyin';

    var duplicateFactor = new ProtoBlock('duplicatefactor');
    duplicateFactor.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['duplicatefactor'] = duplicateFactor;
    duplicateFactor.staticLabels.push(_('duplicate factor'));
    duplicateFactor.adjustWidthToLabel();
    duplicateFactor.parameterBlock();

    var skipFactor = new ProtoBlock('skipfactor');
    skipFactor.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['skipfactor'] = skipFactor;
    skipFactor.staticLabels.push(_('skip factor'));
    skipFactor.adjustWidthToLabel();
    skipFactor.parameterBlock();

    var beatfactor = new ProtoBlock('beatfactor');
    beatfactor.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['beatfactor'] = beatfactor;
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
    osctimeBlock.staticLabels.push(_('osctime'));
    osctimeBlock.adjustWidthToLabel();
    osctimeBlock.flowClampOneArgBlock();
    osctimeBlock.defaults.push(200);

    var setbpmBlock = new ProtoBlock('setbpm');
    setbpmBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['setbpm'] = setbpmBlock;
    setbpmBlock.staticLabels.push(_('beats per minute'));
    setbpmBlock.adjustWidthToLabel();
    setbpmBlock.flowClampOneArgBlock();
    setbpmBlock.defaults.push(90);

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
    beatFactorBlock.staticLabels.push(_('multiply beat value'));
    beatFactorBlock.adjustWidthToLabel();
    beatFactorBlock.flowClampOneArgBlock();
    beatFactorBlock.defaults.push(2);

    var beatFactorBlock2 = new ProtoBlock('dividebeatfactor');
    beatFactorBlock2.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['dividebeatfactor'] = beatFactorBlock2;
    beatFactorBlock2.staticLabels.push(_('divide beat value'));
    beatFactorBlock2.adjustWidthToLabel();
    beatFactorBlock2.flowClampOneArgBlock();
    beatFactorBlock2.defaults.push(2);

    var tieBlock = new ProtoBlock('tie');
    tieBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['tie'] = tieBlock;
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
    note4Block.staticLabels.push(_('drum'));
    note4Block.adjustWidthToLabel();
    note4Block.zeroArgBlock();

    var note3Block = new ProtoBlock('note3');
    note3Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note3'] = note3Block;
    note3Block.staticLabels.push('440 8');
    note3Block.adjustWidthToLabel();
    note3Block.zeroArgBlock();

    var note2Block = new ProtoBlock('note2');
    note2Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note2'] = note2Block;
    note2Block.staticLabels.push('A4 8');
    note2Block.adjustWidthToLabel();
    note2Block.zeroArgBlock();

    var noteBlock = new ProtoBlock('note');
    noteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note'] = noteBlock;
    noteBlock.staticLabels.push(_('note value'));
    noteBlock.adjustWidthToLabel();
    noteBlock.flowClampOneArgBlock();
    noteBlock.defaults.push(8);

    // TONE (ARTICULATION) PALETTE

    // Deprecated
    var noteVolumeBlock = new ProtoBlock('setnotevolume');
    noteVolumeBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['setnotevolume'] = noteVolumeBlock;
    noteVolumeBlock.hidden = true;
    noteVolumeBlock.staticLabels.push(_('set volume'));
    noteVolumeBlock.adjustWidthToLabel();
    noteVolumeBlock.oneArgBlock();
    noteVolumeBlock.defaults.push(50);

    var staccatoFactor = new ProtoBlock('staccatofactor');
    staccatoFactor.palette = palettes.dict['tone'];
    blocks.protoBlockDict['staccatofactor'] = staccatoFactor;
    staccatoFactor.staticLabels.push(_('staccato factor'));
    staccatoFactor.adjustWidthToLabel();
    staccatoFactor.parameterBlock();

    var slurFactor = new ProtoBlock('slurfactor');
    slurFactor.palette = palettes.dict['tone'];
    blocks.protoBlockDict['slurfactor'] = slurFactor;
    slurFactor.staticLabels.push(_('slur factor'));
    slurFactor.adjustWidthToLabel();
    slurFactor.parameterBlock();

    var notevolumeFactor = new ProtoBlock('notevolumefactor');
    notevolumeFactor.palette = palettes.dict['tone'];
    blocks.protoBlockDict['notevolumefactor'] = notevolumeFactor;
    notevolumeFactor.staticLabels.push(_('note volume'));
    notevolumeFactor.adjustWidthToLabel();
    notevolumeFactor.parameterBlock();

    var playfwdBlock = new ProtoBlock('playfwd');
    playfwdBlock.hidden = true;
    playfwdBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['playfwd'] = playfwdBlock;
    playfwdBlock.hidden = true;
    playfwdBlock.staticLabels.push(_('play forward'));
    playfwdBlock.adjustWidthToLabel();
    playfwdBlock.flowClampZeroArgBlock();

    var playbwdBlock = new ProtoBlock('playbwd');
    playbwdBlock.hidden = true;
    playbwdBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['playbwd'] = playbwdBlock;
    playbwdBlock.hidden = true;
    playbwdBlock.staticLabels.push(_('play backward'));
    playbwdBlock.adjustWidthToLabel();
    playbwdBlock.flowClampZeroArgBlock();

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
    setkey2Block.dockTypes[2] = 'textin';

    var meter = new ProtoBlock('meter');
    meter.palette = palettes.dict['tone'];
    blocks.protoBlockDict['meter'] = meter;
    meter.hidden = true;
    meter.staticLabels.push(_('meter'), _('numerator'), _('denominator'));
    meter.adjustWidthToLabel();
    meter.defaults.push(3);
    meter.defaults.push(4);
    meter.twoArgMathBlock();
    meter.dockTypes[1] = 'number';
    meter.dockTypes[2] = 'number';

    var articulationBlock = new ProtoBlock('articulation');
    articulationBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['articulation'] = articulationBlock;
    articulationBlock.staticLabels.push(_('articulation'));
    articulationBlock.adjustWidthToLabel();
    articulationBlock.flowClampOneArgBlock();
    articulationBlock.defaults.push(25);

    var noteVolumeBlock2 = new ProtoBlock('setnotevolume2');
    noteVolumeBlock2.palette = palettes.dict['tone'];
    blocks.protoBlockDict['setnotevolume2'] = noteVolumeBlock2;
    noteVolumeBlock2.staticLabels.push(_('set volume'));
    noteVolumeBlock2.adjustWidthToLabel();
    noteVolumeBlock2.flowClampOneArgBlock();
    noteVolumeBlock2.defaults.push(50);

    var crescendoBlock = new ProtoBlock('crescendo');
    crescendoBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['crescendo'] = crescendoBlock;
    crescendoBlock.staticLabels.push(_('crescendo'));
    crescendoBlock.adjustWidthToLabel();
    crescendoBlock.flowClampOneArgBlock();
    crescendoBlock.defaults.push(5);

    var thirdsBlock = new ProtoBlock('thirds');
    thirdsBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['thirds'] = thirdsBlock;
    thirdsBlock.staticLabels.push(_('thirds'));
    thirdsBlock.adjustWidthToLabel();
    thirdsBlock.flowClampZeroArgBlock();

    var fourthsBlock = new ProtoBlock('fourths');
    fourthsBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['fourths'] = fourthsBlock;
    fourthsBlock.staticLabels.push(_('fourths'));
    fourthsBlock.adjustWidthToLabel();
    fourthsBlock.flowClampZeroArgBlock();

    // deprecated
    var tritoneBlock = new ProtoBlock('tritone');
    tritoneBlock.hidden = true;
    tritoneBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['tritone'] = tritoneBlock;
    tritoneBlock.staticLabels.push(_('tritone'));
    tritoneBlock.adjustWidthToLabel();
    tritoneBlock.flowClampZeroArgBlock();

    var fifthsBlock = new ProtoBlock('fifths');
    fifthsBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['fifths'] = fifthsBlock;
    fifthsBlock.staticLabels.push(_('fifths'));
    fifthsBlock.adjustWidthToLabel();
    fifthsBlock.flowClampZeroArgBlock();

    var intervalBlock = new ProtoBlock('interval');
    intervalBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['interval'] = intervalBlock;
    intervalBlock.staticLabels.push(_('interval'));
    intervalBlock.adjustWidthToLabel();
    intervalBlock.flowClampOneArgBlock();
    intervalBlock.defaults.push(5);

    var swingBlock = new ProtoBlock('swing');
    swingBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['swing'] = swingBlock;
    swingBlock.staticLabels.push(_('swing'));
    swingBlock.adjustWidthToLabel();
    swingBlock.flowClampOneArgBlock();
    swingBlock.defaults.push(32);

    var slurBlock = new ProtoBlock('slur');
    slurBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['slur'] = slurBlock;
    slurBlock.staticLabels.push(_('slur'));
    slurBlock.adjustWidthToLabel();
    slurBlock.flowClampOneArgBlock();
    slurBlock.defaults.push(32);

    var staccatoBlock = new ProtoBlock('staccato');
    staccatoBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['staccato'] = staccatoBlock;
    staccatoBlock.staticLabels.push(_('staccato'));
    staccatoBlock.adjustWidthToLabel();
    staccatoBlock.flowClampOneArgBlock();
    staccatoBlock.defaults.push(32);

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

    //RHYTHMRULER PALETTE

    var rhythmrulerBlock = new ProtoBlock('rhythmruler');
    rhythmrulerBlock.palette = palettes.dict['rhythmruler'];
    blocks.protoBlockDict['rhythmruler'] = rhythmrulerBlock;
    rhythmrulerBlock.staticLabels.push(_('rhythmruler'));
    rhythmrulerBlock.adjustWidthToLabel();
    rhythmrulerBlock.stackClampZeroArgBlock();
    
    // TURTLE PALETTE

    var headingBlock = new ProtoBlock('heading');
    headingBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['heading'] = headingBlock;
    headingBlock.staticLabels.push(_('heading'));
    headingBlock.adjustWidthToLabel();
    headingBlock.parameterBlock();

    var xBlock = new ProtoBlock('x');
    xBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['x'] = xBlock;
    xBlock.staticLabels.push(_('x'));
    xBlock.adjustWidthToLabel();
    xBlock.parameterBlock();

    var yBlock = new ProtoBlock('y');
    yBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['y'] = yBlock;
    yBlock.staticLabels.push(_('y'));
    yBlock.adjustWidthToLabel();
    yBlock.parameterBlock();

    var clearBlock = new ProtoBlock('clear');
    clearBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['clear'] = clearBlock;
    clearBlock.staticLabels.push(_('clear'));
    clearBlock.adjustWidthToLabel();
    clearBlock.zeroArgBlock();

    var controlPoint2Block = new ProtoBlock('controlpoint2');
    controlPoint2Block.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['controlpoint2'] = controlPoint2Block;
    controlPoint2Block.staticLabels.push(_('control point 2'), _('x'), _('y'));
    controlPoint2Block.adjustWidthToLabel();
    controlPoint2Block.twoArgBlock();
    controlPoint2Block.defaults.push(100);
    controlPoint2Block.defaults.push(25);
    controlPoint2Block.dockTypes[1] = 'numberin';
    controlPoint2Block.dockTypes[2] = 'numberin';

    var controlPoint1Block = new ProtoBlock('controlpoint1');
    controlPoint1Block.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['controlpoint1'] = controlPoint1Block;
    controlPoint1Block.staticLabels.push(_('control point 1'), _('x'), _('y'));
    controlPoint1Block.adjustWidthToLabel();
    controlPoint1Block.twoArgBlock();
    controlPoint1Block.defaults.push(100);
    controlPoint1Block.defaults.push(75);
    controlPoint1Block.dockTypes[1] = 'numberin';
    controlPoint1Block.dockTypes[2] = 'numberin';

    var bezierBlock = new ProtoBlock('bezier');
    bezierBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['bezier'] = bezierBlock;
    bezierBlock.staticLabels.push(_('bezier'), _('x'), _('y'));
    bezierBlock.adjustWidthToLabel();
    bezierBlock.twoArgBlock();
    bezierBlock.defaults.push(0);
    bezierBlock.defaults.push(100);
    bezierBlock.dockTypes[1] = 'numberin';
    bezierBlock.dockTypes[2] = 'numberin';

    var arcBlock = new ProtoBlock('arc');
    arcBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['arc'] = arcBlock;
    arcBlock.staticLabels.push(_('arc'), _('angle'), _('radius'));
    arcBlock.adjustWidthToLabel();
    arcBlock.twoArgBlock();
    arcBlock.defaults.push(90);
    arcBlock.defaults.push(100);
    arcBlock.dockTypes[1] = 'numberin';

    var setheadingBlock = new ProtoBlock('setheading');
    setheadingBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['setheading'] = setheadingBlock;
    setheadingBlock.staticLabels.push(_('set heading'));
    setheadingBlock.adjustWidthToLabel();
    setheadingBlock.oneArgBlock();
    setheadingBlock.defaults.push(0);

    var setxyBlock = new ProtoBlock('setxy');
    setxyBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['setxy'] = setxyBlock;
    setxyBlock.staticLabels.push(_('set xy'), _('x'), _('y'));
    setxyBlock.adjustWidthToLabel();
    setxyBlock.twoArgBlock();
    setxyBlock.defaults.push(0);
    setxyBlock.defaults.push(0);
    setxyBlock.dockTypes[1] = 'numberin';

    var rightBlock = new ProtoBlock('right');
    rightBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['right'] = rightBlock;
    rightBlock.staticLabels.push(_('right'));
    rightBlock.adjustWidthToLabel();
    rightBlock.oneArgBlock();
    rightBlock.defaults.push(90);

    var leftBlock = new ProtoBlock('left');
    leftBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['left'] = leftBlock;
    leftBlock.staticLabels.push(_('left'));
    leftBlock.adjustWidthToLabel();
    leftBlock.oneArgBlock();
    leftBlock.defaults.push(90);

    var backBlock = new ProtoBlock('back');
    backBlock.palette = palettes.dict['turtle'];
    blocks.protoBlockDict['back'] = backBlock;
    backBlock.staticLabels.push(_('back'));
    backBlock.adjustWidthToLabel();
    backBlock.oneArgBlock();
    backBlock.defaults.push(100);

    var forwardBlock = new ProtoBlock('forward');
    forwardBlock.palette = palettes.dict['turtle'];
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

    var modBlock = new ProtoBlock('mod');
    modBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['mod'] = modBlock;
    modBlock.staticLabels.push(_('mod'));
    modBlock.adjustWidthToLabel();
    modBlock.twoArgMathBlock();
    modBlock.defaults.push(100, 10)

    var sqrtBlock = new ProtoBlock('sqrt');
    sqrtBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['sqrt'] = sqrtBlock;
    sqrtBlock.staticLabels.push(_('sqrt'));
    sqrtBlock.adjustWidthToLabel();
    sqrtBlock.oneArgMathBlock();
    sqrtBlock.defaults.push(100)

    var divideBlock = new ProtoBlock('divide');
    divideBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['divide'] = divideBlock;
    divideBlock.fontsize = 14;
    divideBlock.staticLabels.push('/');
    divideBlock.twoArgMathBlock();
    divideBlock.defaults.push(100, 10)

    var multiplyBlock = new ProtoBlock('multiply');
    multiplyBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['multiply'] = multiplyBlock;
    multiplyBlock.fontsize = 14;
    multiplyBlock.staticLabels.push('×');
    multiplyBlock.twoArgMathBlock();
    multiplyBlock.defaults.push(10, 10)

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
    minusBlock.defaults.push(100, 50)

    var plusBlock = new ProtoBlock('plus');
    plusBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['plus'] = plusBlock;
    plusBlock.fontsize = 14;
    plusBlock.staticLabels.push('+');
    plusBlock.twoArgMathBlock();
    plusBlock.dockTypes[0] = 'anyout';
    plusBlock.dockTypes[1] = 'anyin';
    plusBlock.dockTypes[2] = 'anyin';
    plusBlock.defaults.push(100, 100)

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
    randomBlock.defaults.push(0, 100);

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
    storeinBlock.defaults.push(100);
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
    toneBlock.defaults.push(440, 200);
    toneBlock.twoArgBlock();
    toneBlock.dockTypes[1] = 'numberin';
    toneBlock.dockTypes[2] = 'numberin';

    var toFrequencyBlock = new ProtoBlock('tofrequency');
    toFrequencyBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['tofrequency'] = toFrequencyBlock;
    toFrequencyBlock.staticLabels.push(_('note to frequency'), _('note'), _('octave'));
    toFrequencyBlock.adjustWidthToLabel();
    toFrequencyBlock.defaults.push('A');
    toFrequencyBlock.defaults.push('4');
    toFrequencyBlock.twoArgMathBlock();
    toFrequencyBlock.dockTypes[1] = 'anyin';
    toFrequencyBlock.dockTypes[2] = 'numberin';

    var shellBlock = new ProtoBlock('turtleshell');
    shellBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['turtleshell'] = shellBlock;
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

    var hiddenBlock = new ProtoBlock('hidden');
    hiddenBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['hidden'] = hiddenBlock;
    hiddenBlock.hidden = true;  // Now there is a surprise :)
    hiddenBlock.hiddenBlockNoFlow();

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

    var loudnessBlock = new ProtoBlock('loudness');
    loudnessBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['loudness'] = loudnessBlock;
    loudnessBlock.staticLabels.push(_('loudness'));
    loudnessBlock.adjustWidthToLabel();
    loudnessBlock.parameterBlock();

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

    var getxTurtleBlock = new ProtoBlock('xturtle');
    getxTurtleBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['xturtle'] = getxTurtleBlock;
    getxTurtleBlock.staticLabels.push(_('turtle x'));
    getxTurtleBlock.adjustWidthToLabel();
    getxTurtleBlock.oneArgBlock();
    getxTurtleBlock.dockTypes[1] = 'anyin';
    getxTurtleBlock.defaults.push('0');

    var getyTurtleBlock = new ProtoBlock('yturtle');
    getyTurtleBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['yturtle'] = getyTurtleBlock;
    getyTurtleBlock.staticLabels.push(_('turtle y'));
    getyTurtleBlock.adjustWidthToLabel();
    getyTurtleBlock.oneArgBlock();
    getyTurtleBlock.dockTypes[1] = 'anyin';
    getyTurtleBlock.defaults.push('0');

    var startTurtleBlock = new ProtoBlock('startTurtle');
    startTurtleBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['startTurtle'] = startTurtleBlock;
    startTurtleBlock.staticLabels.push(_('start turtle'));
    startTurtleBlock.adjustWidthToLabel();
    startTurtleBlock.oneArgBlock();
    startTurtleBlock.dockTypes[1] = 'anyin';
    startTurtleBlock.defaults.push('0');

    var stopTurtleBlock = new ProtoBlock('stopTurtle');
    stopTurtleBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['stopTurtle'] = stopTurtleBlock;
    stopTurtleBlock.staticLabels.push(_('stop turtle'));
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

    var turtleNameBlock = new ProtoBlock('turtlename');
    turtleNameBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['turtlename'] = turtleNameBlock;
    turtleNameBlock.staticLabels.push(_('turtle name'));
    turtleNameBlock.adjustWidthToLabel();
    turtleNameBlock.parameterBlock();
    turtleNameBlock.dockTypes[0] = 'textout';

    var setTurtleName = new ProtoBlock('setturtlename');
    setTurtleName.palette = palettes.dict['extras'];
    blocks.protoBlockDict['setturtlename'] = setTurtleName;
    setTurtleName.staticLabels.push(_('turtle name'));
    setTurtleName.staticLabels.push(_('source'));
    setTurtleName.staticLabels.push(_('target'));
    setTurtleName.adjustWidthToLabel();
    setTurtleName.twoArgBlock();
    setTurtleName.dockTypes[1] = 'anyin';
    setTurtleName.dockTypes[2] = 'anyin';
    setTurtleName.defaults.push('0');
    setTurtleName.defaults.push('Yertle');

    // SENSORS PALETTE

    // Turtle-specific click event
    var myClickBlock = new ProtoBlock('myclick');
    myClickBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['myclick'] = myClickBlock;
    myClickBlock.staticLabels.push(_('click'));
    myClickBlock.adjustWidthToLabel();
    myClickBlock.parameterBlock();
    myClickBlock.dockTypes[0] = 'textout';

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

    var mousexBlock = new ProtoBlock('mousex');
    mousexBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['mousex'] = mousexBlock;
    mousexBlock.staticLabels.push(_('mouse x'));
    mousexBlock.extraWidth = 15;
    mousexBlock.adjustWidthToLabel();
    mousexBlock.parameterBlock();

    var mouseyBlock = new ProtoBlock('mousey');
    mouseyBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['mousey'] = mouseyBlock;
    mouseyBlock.staticLabels.push(_('mouse y'));
    mouseyBlock.extraWidth = 15;
    mouseyBlock.adjustWidthToLabel();
    mouseyBlock.parameterBlock();

    var mousebuttonBlock = new ProtoBlock('mousebutton');
    mousebuttonBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['mousebutton'] = mousebuttonBlock;
    mousebuttonBlock.staticLabels.push(_('mouse button'));
    mousebuttonBlock.adjustWidthToLabel();
    mousebuttonBlock.booleanZeroArgBlock();

    var keyboardBlock = new ProtoBlock('keyboard');
    keyboardBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['keyboard'] = keyboardBlock;
    keyboardBlock.staticLabels.push(_('keyboard'));
    keyboardBlock.adjustWidthToLabel();
    keyboardBlock.parameterBlock();

    // REMOVED UNTIL WE PLUG THE SECURITY HOLE
    /*
    var evalBlock = new ProtoBlock('eval');
    evalBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['eval'] = evalBlock;
    evalBlock.staticLabels.push(_('eval'));
    evalBlock.staticLabels.push('f(x)');
    evalBlock.staticLabels.push('x');
    evalBlock.adjustWidthToLabel();
    evalBlock.twoArgMathBlock();
    evalBlock.dockTypes[1] = 'textin';
    evalBlock.defaults.push('x');
    evalBlock.defaults.push(100);
    */
    
    // Push protoblocks onto their palettes.
    for (var protoblock in blocks.protoBlockDict) {
        if (blocks.protoBlockDict[protoblock].palette != null) {
            blocks.protoBlockDict[protoblock].palette.add(blocks.protoBlockDict[protoblock]);
        }
    }

    // Populate the lists of block types.
    blocks.findBlockTypes();
}
