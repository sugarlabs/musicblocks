// Copyright (c) 2014-18 Walter Bender
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

    // PITCH PALETTE

    // deprecated
    var restBlock = new ProtoBlock('rest');
    restBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['rest'] = restBlock;
    restBlock.hidden = true;
    restBlock.valueBlock();
    restBlock.dockTypes[0] = 'textout';

    // deprecated
    // macro
    var squareBlock = new ProtoBlock('square');
    squareBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['square'] = squareBlock;
    squareBlock.hidden = true;
    //.TRANS: square wave
    squareBlock.staticLabels.push(_('square'));
    squareBlock.adjustWidthToLabel();
    squareBlock.oneArgBlock();
    squareBlock.defaults.push(440);

    // deprecated
    // macro
    var triangleBlock = new ProtoBlock('triangle');
    triangleBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['triangle'] = triangleBlock;
    triangleBlock.hidden = true;
    //.TRANS: triangle wave
    triangleBlock.staticLabels.push(_('triangle'));
    triangleBlock.adjustWidthToLabel();
    triangleBlock.oneArgBlock();
    triangleBlock.defaults.push(440);

    // deprecated
    // macro
    var sineBlock = new ProtoBlock('sine');
    sineBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sine'] = sineBlock;
    sineBlock.hidden = true;
    //.TRANS: sine wave
    sineBlock.staticLabels.push(_('sine'));
    sineBlock.adjustWidthToLabel();
    sineBlock.oneArgBlock();
    sineBlock.defaults.push(440);

    // deprecated
    // macro
    var sawtoothBlock = new ProtoBlock('sawtooth');
    sawtoothBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sawtooth'] = sawtoothBlock;
    sawtoothBlock.hidden = true;
    //.TRANS: sawtooth wave
    sawtoothBlock.staticLabels.push(_('sawtooth'));
    sawtoothBlock.adjustWidthToLabel();
    sawtoothBlock.oneArgBlock();
    sawtoothBlock.defaults.push(440);

    // Status blocks
    var invertmodeBlock = new ProtoBlock('invertmode');
    invertmodeBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invertmode'] = invertmodeBlock;
    invertmodeBlock.valueBlock();
    invertmodeBlock.dockTypes[0] = 'textout';
    invertmodeBlock.extraWidth = 50;

    var transposition = new ProtoBlock('transpositionfactor');
    transposition.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['transpositionfactor'] = transposition;
    //.TRANS: musical transposition (adjustment of pitch up or down)
    transposition.staticLabels.push(_('transposition'));
    transposition.adjustWidthToLabel();
    transposition.parameterBlock();

    var consonantStepDownBlock = new ProtoBlock('consonantstepsizedown');
    consonantStepDownBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['consonantstepsizedown'] = consonantStepDownBlock;
    //.TRANS: step down one note in current musical scale
    consonantStepDownBlock.staticLabels.push(_('scalar step down'));
    consonantStepDownBlock.adjustWidthToLabel();
    consonantStepDownBlock.parameterBlock();

    var consonantStepUpBlock = new ProtoBlock('consonantstepsizeup');
    consonantStepUpBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['consonantstepsizeup'] = consonantStepUpBlock;
    //.TRANS: step up one note in current musical scale
    consonantStepUpBlock.staticLabels.push(_('scalar step up'));
    consonantStepUpBlock.adjustWidthToLabel();
    consonantStepUpBlock.parameterBlock();

    var myDeltaPitchBlock = new ProtoBlock('deltapitch');
    myDeltaPitchBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['deltapitch'] = myDeltaPitchBlock;
    //.TRANS: the change meaused in half-steps between the current pitch and the previous pitch
    myDeltaPitchBlock.staticLabels.push(_('change in pitch'));
    myDeltaPitchBlock.parameterBlock();
    myDeltaPitchBlock.adjustWidthToLabel();

    var myPitchBlock = new ProtoBlock('mypitch');
    myPitchBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['mypitch'] = myPitchBlock;
    //.TRANS: convert current note to piano key (1-88)
    myPitchBlock.staticLabels.push(_('pitch number'));
    myPitchBlock.parameterBlock();
    myPitchBlock.adjustWidthToLabel();

    var midiBlock = new ProtoBlock('midi');
    midiBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['midi'] = midiBlock;
    //.TRANS: MIDI is a technical standard for electronic music
    midiBlock.staticLabels.push('MIDI');
    midiBlock.adjustWidthToLabel();
    midiBlock.zeroArgBlock();

    var setPitchNumberOffsetBlock = new ProtoBlock('setpitchnumberoffset');
    setPitchNumberOffsetBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['setpitchnumberoffset'] = setPitchNumberOffsetBlock;
    //.TRANS: set an offset associated with the numeric piano keyboard mapping
    setPitchNumberOffsetBlock.staticLabels.push(_('set pitch number offset'));
    setPitchNumberOffsetBlock.staticLabels.push(_('name'), _('octave'));
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
    var accidentalnameBlock = new ProtoBlock('accidentalname');
    accidentalnameBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['accidentalname'] = accidentalnameBlock;
    accidentalnameBlock.valueBlock();
    accidentalnameBlock.dockTypes[0] = 'textout';
    accidentalnameBlock.extraWidth = 50;

    var eastindiansolfegeBlock = new ProtoBlock('eastindiansolfege');
    eastindiansolfegeBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['eastindiansolfege'] = eastindiansolfegeBlock;
    eastindiansolfegeBlock.valueBlock();
    eastindiansolfegeBlock.dockTypes[0] = 'solfegeout';

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

    var customNoteBlock = new ProtoBlock('customNote');
    customNoteBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['customNote'] = customNoteBlock;
    customNoteBlock.valueBlock();

    // Transposition blocks
    // macro
    var invertBlock = new ProtoBlock('invert1');
    invertBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert1'] = invertBlock;
    //.TRANS: pitch inversion rotates a pitch around another pitch
    invertBlock.staticLabels.push(_('invert'));
    invertBlock.staticLabels.push(_('name'), _('octave'));
    //.TRANS: invert based on even or odd number or musical scale
    invertBlock.staticLabels.push(_('even') + '/' + _('odd') + '/' + _('scalar'));
    invertBlock.extraWidth = 10;
    invertBlock.adjustWidthToLabel();
    invertBlock.flowClampThreeArgBlock();
    invertBlock.adjustWidthToLabel();
    invertBlock.defaults.push('sol');
    invertBlock.defaults.push(4);
    invertBlock.defaults.push(_('even'));
    invertBlock.dockTypes[1] = 'solfegein';
    invertBlock.dockTypes[2] = 'anyin';
    invertBlock.dockTypes[3] = 'anyin';

    // deprecated
    var invertBlock2 = new ProtoBlock('invert2');
    invertBlock2.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert2'] = invertBlock2;
    //.TRANS: pitch inversion rotates a pitch around another pitch (odd number)
    invertBlock2.staticLabels.push(_('invert (odd)'));
    invertBlock2.staticLabels.push(_('note'), _('octave'));
    invertBlock2.adjustWidthToLabel();
    invertBlock2.flowClampTwoArgBlock();
    invertBlock2.adjustWidthToLabel();
    invertBlock2.defaults.push('sol');
    invertBlock2.defaults.push(4);
    invertBlock2.dockTypes[1] = 'solfegein';
    invertBlock2.dockTypes[2] = 'anyin';
    invertBlock2.hidden = true;

    // deprecated
    // macro
    var invertBlock = new ProtoBlock('invert');
    invertBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert'] = invertBlock;
    //.TRANS: pitch inversion rotates a pitch around another pitch (even number)
    invertBlock.staticLabels.push(_('invert (even)'));
    invertBlock.staticLabels.push(_('note'), _('octave'));
    invertBlock.adjustWidthToLabel();
    invertBlock.flowClampTwoArgBlock();
    invertBlock.adjustWidthToLabel();
    invertBlock.defaults.push('sol');
    invertBlock.defaults.push(4);
    invertBlock.dockTypes[1] = 'solfegein';
    invertBlock.dockTypes[2] = 'anyin';
    invertBlock.hidden = true;

    var registerBlock = new ProtoBlock('register');
    registerBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['register'] = registerBlock;
    //.TRANS: register is the octave of the current pitch
    registerBlock.staticLabels.push(_('register'));
    registerBlock.defaults.push(0);
    registerBlock.oneArgBlock();
    registerBlock.adjustWidthToLabel();

    var transpositionBlock = new ProtoBlock('settransposition');
    transpositionBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['settransposition'] = transpositionBlock;
    //.TRANS: adjust the amount of shift (up or down) of a pitch
    transpositionBlock.staticLabels.push(_('semi-tone transpose'));
    transpositionBlock.adjustWidthToLabel();
    transpositionBlock.defaults.push('1');
    transpositionBlock.flowClampOneArgBlock();

    var octaveBlock = new ProtoBlock('octave');
    octaveBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['octave'] = octaveBlock;
    //.TRANS: adjusts the shift up or down by one octave (twelve half-steps in the interval between two notes, one having twice or half the frequency in Hz of the other.)
    octaveBlock.staticLabels.push(_('octave'));
    octaveBlock.adjustWidthToLabel();
    octaveBlock.zeroArgBlock();

    // macro
    var customPitchBlock = new ProtoBlock('custompitch');
    customPitchBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['custompitch'] = customPitchBlock;
    //.TRANS: unison means the note is the same as the current note
    customPitchBlock.staticLabels.push(_('custom note'));
    customPitchBlock.adjustWidthToLabel();
    customPitchBlock.zeroArgBlock();
    customPitchBlock.hidden = true;

    // macro
    var downsixthBlock = new ProtoBlock('downsixth');
    downsixthBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['downsixth'] = downsixthBlock;
    //.TRANS: down sixth means the note is five scale degrees below current note
    downsixthBlock.staticLabels.push(_('down sixth'));
    downsixthBlock.adjustWidthToLabel();
    downsixthBlock.zeroArgBlock();

    // macro
    var downthirdBlock = new ProtoBlock('downthird');
    downthirdBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['downthird'] = downthirdBlock;
    //.TRANS: down third means the note is two scale degrees below current note
    downthirdBlock.staticLabels.push(_('down third'));
    downthirdBlock.adjustWidthToLabel();
    downthirdBlock.zeroArgBlock();

    // macro
    var seventhBlock = new ProtoBlock('seventh');
    seventhBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['seventh'] = seventhBlock;
    //.TRANS: seventh means the note is the six scale degrees above current note
    seventhBlock.staticLabels.push(_('seventh'));
    seventhBlock.adjustWidthToLabel();
    seventhBlock.zeroArgBlock();

    // macro
    var sixthBlock = new ProtoBlock('sixth');
    sixthBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sixth'] = sixthBlock;
    //.TRANS: sixth means the note is the five scale degrees above current note
    sixthBlock.staticLabels.push(_('sixth'));
    sixthBlock.adjustWidthToLabel();
    sixthBlock.zeroArgBlock();

    // macro
    var fifthBlock = new ProtoBlock('fifth');
    fifthBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['fifth'] = fifthBlock;
    //.TRANS: fifth means the note is the four scale degrees above current note
    fifthBlock.staticLabels.push(_('fifth'));
    fifthBlock.adjustWidthToLabel();
    fifthBlock.zeroArgBlock();

    // macro
    var fourthBlock = new ProtoBlock('fourth');
    fourthBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['fourth'] = fourthBlock;
    //.TRANS: fourth means the note is three scale degrees above current note
    fourthBlock.staticLabels.push(_('fourth'));
    fourthBlock.adjustWidthToLabel();
    fourthBlock.zeroArgBlock();

    // macro
    var thirdBlock = new ProtoBlock('third');
    thirdBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['third'] = thirdBlock;
    //.TRANS: third means the note is two scale degrees above current note
    thirdBlock.staticLabels.push(_('third'));
    thirdBlock.adjustWidthToLabel();
    thirdBlock.zeroArgBlock();

    // macro
    var secondBlock = new ProtoBlock('second');
    secondBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['second'] = secondBlock;
    //.TRANS: second means the note is one scale degree above current note
    secondBlock.staticLabels.push(_('second'));
    secondBlock.adjustWidthToLabel();
    secondBlock.zeroArgBlock();

    // macro
    var unisonBlock = new ProtoBlock('unison');
    unisonBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['unison'] = unisonBlock;
    //.TRANS: unison means the note is the same as the current note
    unisonBlock.staticLabels.push(_('unison'));
    unisonBlock.adjustWidthToLabel();
    unisonBlock.zeroArgBlock();

    // macro
    var scalarTranspositionBlock = new ProtoBlock('setscalartransposition');
    scalarTranspositionBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['setscalartransposition'] = scalarTranspositionBlock;
    //.TRANS: adjust the amount of shift (up or down) of a pitch by musical scale (scalar) steps
    scalarTranspositionBlock.staticLabels.push(_('scalar transpose') + ' (+/–)');
    scalarTranspositionBlock.adjustWidthToLabel();
    scalarTranspositionBlock.defaults.push('1');
    scalarTranspositionBlock.flowClampOneArgBlock();
    //scalarTranspositionBlock.hidden = true;

    // macro
    var accidentalBlock = new ProtoBlock('accidental');
    accidentalBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['accidental'] = accidentalBlock;
    //.TRANS: An accidental is a modification to a pitch, e.g., sharp or flat.
    accidentalBlock.staticLabels.push(_('accidental'));
    accidentalBlock.adjustWidthToLabel();
    accidentalBlock.flowClampOneArgBlock();
    accidentalBlock.dockTypes[1] = 'textin';

    // macro
    var flatBlock = new ProtoBlock('flat');
    flatBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['flat'] = flatBlock;
    //.TRANS: flat is a half-step down in pitch
    flatBlock.staticLabels.push(_('flat') + ' ♭');
    flatBlock.adjustWidthToLabel();
    flatBlock.flowClampZeroArgBlock();

    // macro
    var sharpBlock = new ProtoBlock('sharp');
    sharpBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sharp'] = sharpBlock;
    //.TRANS: sharp is a half-step up in pitch
    sharpBlock.staticLabels.push(_('sharp') + ' ♯');
    sharpBlock.adjustWidthToLabel();
    sharpBlock.flowClampZeroArgBlock();

    var hertzBlock = new ProtoBlock('hertz');
    hertzBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['hertz'] = hertzBlock;
    //.TRANS: a measure of frequency: one cycle per second
    hertzBlock.staticLabels.push(_('hertz'));
    hertzBlock.adjustWidthToLabel();
    hertzBlock.oneArgBlock();
    hertzBlock.defaults.push(392);

    var pitchNumberBlock = new ProtoBlock('pitchnumber');
    pitchNumberBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitchnumber'] = pitchNumberBlock;
    //.TRANS: a mapping of pitch to the 88 piano keys
    pitchNumberBlock.staticLabels.push(_('pitch number'));
    pitchNumberBlock.adjustWidthToLabel();
    pitchNumberBlock.oneArgBlock();
    pitchNumberBlock.defaults.push(7);
    pitchNumberBlock.dockTypes[1] = 'numberin';

    var scaleDegree = new ProtoBlock('scaledegree');
    scaleDegree.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['scaledegree'] = scaleDegree;
    //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
    scaleDegree.staticLabels.push(_('scale degree'));
    scaleDegree.staticLabels.push(_('number'), _('octave'));
    scaleDegree.adjustWidthToLabel();
    scaleDegree.defaults.push(5);  // G in C Major
    scaleDegree.defaults.push(4);
    scaleDegree.twoArgBlock();
    scaleDegree.dockTypes[1] = 'numberin';
    scaleDegree.dockTypes[2] = 'anyin';

    var pitchStepBlock = new ProtoBlock('steppitch');
    pitchStepBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['steppitch'] = pitchStepBlock;
    //.TRANS: step some number of notes in current musical scale
    pitchStepBlock.staticLabels.push(_('scalar step') + ' (+/–)');
    pitchStepBlock.oneArgBlock();
    pitchStepBlock.adjustWidthToLabel();
    pitchStepBlock.dockTypes[1] = 'anyin';
    pitchStepBlock.defaults.push(1);

    // macro
    var pitch2Block = new ProtoBlock('pitch2');
    pitch2Block.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitch2'] = pitch2Block;
    pitch2Block.staticLabels.push(_('pitch') + ' ' + 'G4');
    pitch2Block.adjustWidthToLabel();
    pitch2Block.zeroArgBlock();

    var pitch = new ProtoBlock('pitch');
    pitch.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitch'] = pitch;
    //.TRANS: we specify pitch in terms of a name and an octave. The name can be CDEFGAB or Do Re Mi Fa Sol La Ti. Octave is a number between 1 and 8.
    pitch.staticLabels.push(_('pitch'));
    pitch.staticLabels.push(_('name'), _('octave'));
    pitch.adjustWidthToLabel();
    pitch.defaults.push('sol');
    pitch.defaults.push(4);
    pitch.twoArgBlock();
    pitch.dockTypes[1] = 'solfegein';
    pitch.dockTypes[2] = 'anyin';

    // MATRIX PALETTE

    var oscillatorBlock = new ProtoBlock('oscillator');
    oscillatorBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['oscillator'] = oscillatorBlock;
    //.TRANS: there are different types (sine, triangle, square...) of oscillators.
    oscillatorBlock.staticLabels.push(_('oscillator'));
    oscillatorBlock.staticLabels.push(_('type'));
    //.TRANS: Partials refers to the number of sine waves combined into the sound.
    oscillatorBlock.staticLabels.push(_('partials'));
    oscillatorBlock.extraWidth = 10;
    oscillatorBlock.adjustWidthToLabel();
    //.TRANS: triangle wave
    oscillatorBlock.defaults.push(_('triangle'));
    oscillatorBlock.defaults.push(6);
    oscillatorBlock.hidden = true;
    oscillatorBlock.twoArgBlock();
    oscillatorBlock.dockTypes[1] = 'anyin';
    oscillatorBlock.dockTypes[2] = 'numberin';

    var filtertypeBlock = new ProtoBlock('filtertype');
    filtertypeBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['filtertype'] = filtertypeBlock;
    filtertypeBlock.hidden = true;
    filtertypeBlock.valueBlock();
    filtertypeBlock.dockTypes[0] = 'textout';

    var oscillatortypeBlock = new ProtoBlock('oscillatortype');
    oscillatortypeBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['oscillatortype'] = oscillatortypeBlock;
    oscillatortypeBlock.hidden = true;
    oscillatortypeBlock.valueBlock();
    oscillatortypeBlock.dockTypes[0] = 'textout';

    var envelopeBlock = new ProtoBlock('envelope');
    envelopeBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['envelope'] = envelopeBlock;
    //.TRANS: sound envelope (ADSR)
    envelopeBlock.staticLabels.push(_('envelope'));
    //.TRANS: Attack time is the time taken for initial run-up of level from nil to peak, beginning when the key is first pressed.
    envelopeBlock.staticLabels.push(_('attack'));
    //.TRANS: Decay time is the time taken for the subsequent run down from the attack level to the designated sustain level.
    envelopeBlock.staticLabels.push(_('decay'));
    //.TRANS: Sustain level is the level during the main sequence of the sound's duration, until the key is released.
    envelopeBlock.staticLabels.push(_('sustain'));
    //.TRANS: Release time is the time taken for the level to decay from the sustain level to zero after the key is released.
    envelopeBlock.staticLabels.push(_('release'));
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
    //.TRANS: a filter removes some unwanted components from a signal
    filterBlock.staticLabels.push(_('filter'));
    //.TRANS: type of filter, e.g., lowpass, highpass, etc.
    filterBlock.staticLabels.push(_('type'));
    //.TRANS: rolloff is the steepness of a change in frequency.
    filterBlock.staticLabels.push(_('rolloff'));
    filterBlock.staticLabels.push(_('frequency'));
    filterBlock.extraWidth = 10;
    filterBlock.adjustWidthToLabel();
    //.TRANS: highpass filter
    filterBlock.defaults.push(_('highpass'));
    filterBlock.defaults.push(-12);
    filterBlock.defaults.push(392);
    filterBlock.threeArgBlock();
    filterBlock.hidden = true;
    filterBlock.dockTypes[1] = 'anyin';
    filterBlock.dockTypes[2] = 'numberin';
    filterBlock.dockTypes[3] = 'numberin';

    // macro
    var sixtyfourthNoteBlock = new ProtoBlock('sixtyfourthNote');
    sixtyfourthNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['sixtyfourthNote'] = sixtyfourthNoteBlock;
    sixtyfourthNoteBlock.staticLabels.push(_('1/64 note') + ' 𝅘𝅥𝅱');
    sixtyfourthNoteBlock.adjustWidthToLabel();
    sixtyfourthNoteBlock.zeroArgBlock();

    // macro
    var thirtysecondNoteBlock = new ProtoBlock('thirtysecondNote');
    thirtysecondNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['thirtysecondNote'] = thirtysecondNoteBlock;
    thirtysecondNoteBlock.staticLabels.push(_('1/32 note') + ' 𝅘𝅥𝅰');
    thirtysecondNoteBlock.adjustWidthToLabel();
    thirtysecondNoteBlock.zeroArgBlock();

    // macro
    var sixteenthNoteBlock = new ProtoBlock('sixteenthNote');
    sixteenthNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['sixteenthNote'] = sixteenthNoteBlock;
    sixteenthNoteBlock.staticLabels.push(_('1/16 note') + ' 𝅘𝅥𝅯');
    sixteenthNoteBlock.adjustWidthToLabel();
    sixteenthNoteBlock.zeroArgBlock();

    // macro
    var eighthNoteBlock = new ProtoBlock('eighthNote');
    eighthNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['eighthNote'] = eighthNoteBlock;
    eighthNoteBlock.staticLabels.push(_('eighth note') + ' ♪');
    eighthNoteBlock.adjustWidthToLabel();
    eighthNoteBlock.zeroArgBlock();

    // macro
    var quarterNoteBlock = new ProtoBlock('quarterNote');
    quarterNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['quarterNote'] = quarterNoteBlock;
    quarterNoteBlock.staticLabels.push(_('quarter note') + ' ♩');
    quarterNoteBlock.adjustWidthToLabel();
    quarterNoteBlock.zeroArgBlock();

    // macro
    var halfNoteBlock = new ProtoBlock('halfNote');
    halfNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['halfNote'] = halfNoteBlock;
    halfNoteBlock.staticLabels.push(_('half note') + ' 𝅗𝅥');
    halfNoteBlock.adjustWidthToLabel();
    halfNoteBlock.zeroArgBlock();

    // macro
    var wholeNoteBlock = new ProtoBlock('wholeNote');
    wholeNoteBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['wholeNote'] = wholeNoteBlock;
    wholeNoteBlock.staticLabels.push(_('whole note') + ' 𝅝');
    wholeNoteBlock.adjustWidthToLabel();
    wholeNoteBlock.zeroArgBlock();

    var tuplet2Block = new ProtoBlock('tuplet2');
    tuplet2Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['tuplet2'] = tuplet2Block;
    //.TRANS: A tuplet is a note value divided into irregular time values.
    tuplet2Block.staticLabels.push(_('tuplet'));
    tuplet2Block.staticLabels.push(_('number of notes'));
    tuplet2Block.staticLabels.push(_('note value'));
    tuplet2Block.extraWidth = 20;
    tuplet2Block.adjustWidthToLabel();
    tuplet2Block.flowClampTwoArgBlock();
    tuplet2Block.defaults.push(1);
    tuplet2Block.defaults.push(4);
    tuplet2Block.hidden = true;

    // macro
    var tuplet3Block = new ProtoBlock('tuplet3');
    tuplet3Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['tuplet3'] = tuplet3Block;
    tuplet3Block.staticLabels.push(_('tuplet'));
    tuplet3Block.staticLabels.push(_('number of notes'), _('note value'));
    tuplet3Block.extraWidth = 20;
    tuplet3Block.adjustWidthToLabel();
    tuplet3Block.flowClampTwoArgBlock();
    tuplet3Block.defaults.push(1);
    tuplet3Block.defaults.push(4);
    tuplet3Block.hidden = true;

    // macro
    var tuplet4Block = new ProtoBlock('tuplet4');
    tuplet4Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['tuplet4'] = tuplet4Block;
    tuplet4Block.staticLabels.push(_('tuplet'));
    tuplet4Block.staticLabels.push(_('note value'));
    tuplet4Block.extraWidth = 20;
    tuplet4Block.adjustWidthToLabel();
    tuplet4Block.flowClampOneArgBlock();
    tuplet4Block.defaults.push(1 / 4);

    var simpleTuplet7Block = new ProtoBlock('stuplet7');
    simpleTuplet7Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet7'] = simpleTuplet7Block;
    //.TRANS: A tuplet divided into 7 time values.
    simpleTuplet7Block.staticLabels.push(_('septuplet'));
    simpleTuplet7Block.adjustWidthToLabel();
    simpleTuplet7Block.zeroArgBlock();

    var simpleTuplet5Block = new ProtoBlock('stuplet5');
    simpleTuplet5Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet5'] = simpleTuplet5Block;
    //.TRANS: A tuplet divided into 5 time values.
    simpleTuplet5Block.staticLabels.push(_('quintuplet'));
    simpleTuplet5Block.adjustWidthToLabel();
    simpleTuplet5Block.zeroArgBlock();

    var simpleTuplet3Block = new ProtoBlock('stuplet3');
    simpleTuplet3Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet3'] = simpleTuplet3Block;
    //.TRANS: A tuplet divided into 3 time values.
    simpleTuplet3Block.staticLabels.push(_('triplet'));
    simpleTuplet3Block.adjustWidthToLabel();
    simpleTuplet3Block.zeroArgBlock();

    var simpleTupletBlock = new ProtoBlock('stuplet');
    simpleTupletBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet'] = simpleTupletBlock;
    simpleTupletBlock.staticLabels.push(_('simple tuplet'));
    simpleTupletBlock.staticLabels.push(_('number of notes'), _('note value'));
    simpleTupletBlock.adjustWidthToLabel();
    simpleTupletBlock.twoArgBlock();
    simpleTupletBlock.defaults.push(3);
    simpleTupletBlock.defaults.push(1 / 2);

    // deprecated
    var rhythm = new ProtoBlock('rhythm');
    rhythm.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['rhythm'] = rhythm;
    //.TRANS: an arrangement of notes based on duration
    rhythm.staticLabels.push(_('rhythm'));
    rhythm.staticLabels.push(_('number of notes'), _('note value'));
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
    //.TRANS: an arrangement of notes based on duration
    rhythm2.staticLabels.push(_('rhythm'));
    rhythm2.staticLabels.push(_('number of notes'), _('note value'));
    rhythm2.extraWidth = 10;
    rhythm2.adjustWidthToLabel();
    rhythm2.defaults.push(3);
    rhythm2.defaults.push(4);
    rhythm2.twoArgBlock();
    rhythm2.dockTypes[1] = 'anyin';
    rhythm2.dockTypes[2] = 'anyin';

    var temperamentBlock = new ProtoBlock('temperament');
    temperamentBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['temperament'] = temperamentBlock;
    temperamentBlock.staticLabels.push(_('temperament'));
    temperamentBlock.extraWidth = 20;
    temperamentBlock.adjustWidthToLabel();
    temperamentBlock.stackClampOneArgBlock();

    // macro
    var timbreBlock = new ProtoBlock('timbre');
    timbreBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['timbre'] = timbreBlock;
    //.TRANS: timbre is the character or quality of a musical sound
    timbreBlock.staticLabels.push(_('timbre'));
    timbreBlock.extraWidth = 20;
    timbreBlock.adjustWidthToLabel();
    timbreBlock.stackClampOneArgBlock();
    timbreBlock.defaults.push(_('custom'));

    var modewidgetBlock = new ProtoBlock('modewidget');
    modewidgetBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['modewidget'] = modewidgetBlock;
    //.TRANS: musical mode is the pattern of half-steps in an octave, e.g., Major or Minor modes
    modewidgetBlock.staticLabels.push(_('custom mode'));
    modewidgetBlock.adjustWidthToLabel();
    modewidgetBlock.stackClampZeroArgBlock();

    // macro
    var tempoBlock = new ProtoBlock('tempo');
    tempoBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['tempo'] = tempoBlock;
    //.TRANS: the speed at music is should be played.
    tempoBlock.staticLabels.push(_('tempo'));
    tempoBlock.extraWidth = 20;
    tempoBlock.adjustWidthToLabel();
    tempoBlock.stackClampZeroArgBlock();

    // macro
    var pitchDrumMatrixBlock = new ProtoBlock('pitchdrummatrix');
    pitchDrumMatrixBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['pitchdrummatrix'] = pitchDrumMatrixBlock;
    //.TRANS: makes a mapping between pitches and drum sounds
    pitchDrumMatrixBlock.staticLabels.push(_('pitch-drum mapper'));
    pitchDrumMatrixBlock.adjustWidthToLabel();
    pitchDrumMatrixBlock.stackClampZeroArgBlock();

    // macro
    var pitchsliderBlock = new ProtoBlock('pitchslider');
    pitchsliderBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['pitchslider'] = pitchsliderBlock;
    //.TRANS: widget to generate pitches using a slider
    pitchsliderBlock.staticLabels.push(_('pitch slider'));
    pitchsliderBlock.adjustWidthToLabel();
    pitchsliderBlock.stackClampZeroArgBlock();

    // macro
    var pitchstaircaseBlock = new ProtoBlock('pitchstaircase');
    pitchstaircaseBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['pitchstaircase'] = pitchstaircaseBlock;
    //.TRANS: generate a progressive sequence of pitches
    pitchstaircaseBlock.staticLabels.push(_('pitch staircase'));
    pitchstaircaseBlock.adjustWidthToLabel();
    pitchstaircaseBlock.stackClampZeroArgBlock();

    // macro
    var rhythmrulerBlock = new ProtoBlock('rhythmruler');
    rhythmrulerBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['rhythmruler'] = rhythmrulerBlock;
    //.TRANS: widget for subdividing a measure into distinct rhythmic elements
    rhythmrulerBlock.staticLabels.push(_('rhythm ruler'));
    rhythmrulerBlock.adjustWidthToLabel();
    rhythmrulerBlock.stackClampOneArgBlock();
    rhythmrulerBlock.defaults.push(1);
    rhythmrulerBlock.hidden = true;

    // macro
    var rhythmruler2Block = new ProtoBlock('rhythmruler2');
    rhythmruler2Block.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['rhythmruler2'] = rhythmruler2Block;
    rhythmruler2Block.staticLabels.push(_('rhythm ruler'));
    rhythmruler2Block.adjustWidthToLabel();
    rhythmruler2Block.stackClampZeroArgBlock();

    // macro
    var matrixgMBlock = new ProtoBlock('matrixgmajor');
    matrixgMBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['matrixgmajor'] = matrixgMBlock;
    matrixgMBlock.staticLabels.push(_('G major scale'));
    matrixgMBlock.adjustWidthToLabel();
    matrixgMBlock.zeroArgBlock();

    // macro
    var matrixcMBlock = new ProtoBlock('matrixcmajor');
    matrixcMBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['matrixcmajor'] = matrixcMBlock;
    matrixcMBlock.staticLabels.push(_('C major scale'));
    matrixcMBlock.adjustWidthToLabel();
    matrixcMBlock.zeroArgBlock();

    // macro
    var matrixBlock = new ProtoBlock('matrix');
    matrixBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['matrix'] = matrixBlock;
    //.TRANS: assigns pitch to a sequence of beats to generate a melody
    matrixBlock.staticLabels.push(_('pitch-time matrix'));
    matrixBlock.adjustWidthToLabel();
    matrixBlock.stackClampZeroArgBlock();

    // macro
    var statusBlock = new ProtoBlock('status');
    statusBlock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['status'] = statusBlock;
    statusBlock.staticLabels.push(_('status'));
    statusBlock.extraWidth = 10;
    statusBlock.adjustWidthToLabel();
    statusBlock.stackClampZeroArgBlock();

    // RHYTHM PALETTE

    var myNoteBlock = new ProtoBlock('mynotevalue');
    myNoteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['mynotevalue'] = myNoteBlock;
    //.TRANS: the value (e.g., 1/4 note) of the note being played.
    myNoteBlock.staticLabels.push(_('note value'));
    myNoteBlock.parameterBlock();
    myNoteBlock.adjustWidthToLabel();

    var duplicateFactor = new ProtoBlock('duplicatefactor');
    duplicateFactor.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['duplicatefactor'] = duplicateFactor;
    //.TRANS: factor used in determining how many duplications to make
    duplicateFactor.staticLabels.push(_('duplicate factor'));
    duplicateFactor.adjustWidthToLabel();
    duplicateFactor.parameterBlock();
    // duplicateFactor.hidden = true;

    var skipFactor = new ProtoBlock('skipfactor');
    skipFactor.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['skipfactor'] = skipFactor;
    skipFactor.staticLabels.push('skip factor');
    skipFactor.adjustWidthToLabel();
    skipFactor.parameterBlock();
    skipFactor.hidden = true;

    // macro
    var osctimeBlock = new ProtoBlock('osctime');
    osctimeBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['osctime'] = osctimeBlock;
    //.TRANS: oscillator time (in micro seconds)
    osctimeBlock.staticLabels.push(_('osctime'));
    osctimeBlock.adjustWidthToLabel();
    osctimeBlock.flowClampOneArgBlock();
    osctimeBlock.defaults.push(200);

    // macro
    var swingBlock = new ProtoBlock('swing');
    swingBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['swing'] = swingBlock;
    //.TRANS: swing is a rhythmic variation that emphasises the offbeat
    swingBlock.staticLabels.push(_('swing'));
    swingBlock.adjustWidthToLabel();
    swingBlock.flowClampOneArgBlock();
    swingBlock.defaults.push(32);
    swingBlock.hidden = true;

    // macro
    var newswingBlock = new ProtoBlock('newswing');
    newswingBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newswing'] = newswingBlock;
    //.TRANS: swing is a rhythmic variation that emphasises the offbeat
    newswingBlock.staticLabels.push(_('swing'));
    newswingBlock.adjustWidthToLabel();
    newswingBlock.flowClampOneArgBlock();
    newswingBlock.defaults.push(1 / 24);
    newswingBlock.hidden = true;

    // macro
    var newswingBlock = new ProtoBlock('newswing2');
    newswingBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newswing2'] = newswingBlock;
    newswingBlock.staticLabels.push(_('swing'));
    //.TRANS: the amount to shift to the offbeat note
    newswingBlock.staticLabels.push(_('swing value'));
    newswingBlock.staticLabels.push(_('note value'));
    newswingBlock.extraWidth = 20;
    newswingBlock.adjustWidthToLabel();
    newswingBlock.flowClampTwoArgBlock();
    newswingBlock.defaults.push(1 / 24);
    newswingBlock.defaults.push(1 / 8);

    // macro
    var backwardBlock = new ProtoBlock('backward');
    backwardBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['backward'] = backwardBlock;
    //.TRANS: play music backward
    backwardBlock.staticLabels.push(_('backward'));
    backwardBlock.adjustWidthToLabel();
    backwardBlock.flowClampZeroArgBlock();

    // macro
    var skipNotesBlock = new ProtoBlock('skipnotes');
    skipNotesBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['skipnotes'] = skipNotesBlock;
    //.TRANS: substitute rests on notes being skipped
    skipNotesBlock.staticLabels.push(_('skip notes'));
    skipNotesBlock.adjustWidthToLabel();
    skipNotesBlock.flowClampOneArgBlock();
    skipNotesBlock.defaults.push(2);

    // macro
    var duplicateNotesBlock = new ProtoBlock('duplicatenotes');
    duplicateNotesBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['duplicatenotes'] = duplicateNotesBlock;
    //.TRANS: play each note more than once
    duplicateNotesBlock.staticLabels.push(_('duplicate'));
    duplicateNotesBlock.adjustWidthToLabel();
    duplicateNotesBlock.flowClampOneArgBlock();
    duplicateNotesBlock.defaults.push(2);

    var beatFactorBlock = new ProtoBlock('multiplybeatfactor');
    beatFactorBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['multiplybeatfactor'] = beatFactorBlock;
    //.TRANS: speed up note duration by some factor, e.g. convert 1/4 to 1/8 notes by using a factor of 2
    beatFactorBlock.staticLabels.push(_('multiply note value'));
    beatFactorBlock.adjustWidthToLabel();
    beatFactorBlock.flowClampOneArgBlock();
    beatFactorBlock.defaults.push(2);

    // macro
    var tieBlock = new ProtoBlock('tie');
    tieBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['tie'] = tieBlock;
    //.TRANS: tie notes together into one longer note
    tieBlock.staticLabels.push(_('tie'));
    tieBlock.adjustWidthToLabel();
    tieBlock.flowClampZeroArgBlock();

    // Deprecated
    // macro
    var rhythmicdotBlock = new ProtoBlock('rhythmicdot');
    rhythmicdotBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['rhythmicdot'] = rhythmicdotBlock;
    //.TRANS: a dotted note is played for 1.5x its value, e.g., 1/8. --> 3/16
    rhythmicdotBlock.staticLabels.push(_('dot'));
    rhythmicdotBlock.adjustWidthToLabel();
    rhythmicdotBlock.flowClampZeroArgBlock();
    rhythmicdotBlock.hidden = true;

    // macro
    var rhythmicdotBlock2 = new ProtoBlock('rhythmicdot2');
    rhythmicdotBlock2.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['rhythmicdot2'] = rhythmicdotBlock2;
    //.TRANS: a dotted note is played for 1.5x its value, e.g., 1/8. --> 3/16
    rhythmicdotBlock2.staticLabels.push(_('dot'));
    rhythmicdotBlock2.adjustWidthToLabel();
    rhythmicdotBlock2.flowClampOneArgBlock();
    rhythmicdotBlock2.defaults.push(1);
    rhythmicdotBlock2.dockTypes[1] = 'numberin';

    // macro
    var rest2Block = new ProtoBlock('rest2');
    rest2Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['rest2'] = rest2Block;
    rest2Block.staticLabels.push(_('silence'));
    rest2Block.adjustWidthToLabel();
    rest2Block.zeroArgBlock();

    // macro
    var note4Block = new ProtoBlock('note4');
    note4Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note4'] = note4Block;
    note4Block.staticLabels.push(_('note value') + ' ' + _('drum'));
    note4Block.adjustWidthToLabel();
    note4Block.zeroArgBlock();

    // macro
    var note3Block = new ProtoBlock('note3');
    note3Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note3'] = note3Block;
    note3Block.staticLabels.push(_('note value') + ' ' + _('392 hertz'));
    note3Block.adjustWidthToLabel();
    note3Block.zeroArgBlock();

    // macro
    var note5Block = new ProtoBlock('note5');
    note5Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note5'] = note5Block;
    note5Block.staticLabels.push(_('note value') + ' 7');
    note5Block.adjustWidthToLabel();
    note5Block.zeroArgBlock();

    // macro
    var note7Block = new ProtoBlock('note7');
    note7Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note7'] = note7Block;
    note7Block.staticLabels.push(_('note value') + ' 5 4');
    note7Block.adjustWidthToLabel();
    note7Block.zeroArgBlock();

    // macro
    var note6Block = new ProtoBlock('note6');
    note6Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note6'] = note6Block;
    note6Block.staticLabels.push(_('note value') + ' +1');
    note6Block.adjustWidthToLabel();
    note6Block.zeroArgBlock();

    // macro
    var note2Block = new ProtoBlock('note2');
    note2Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note2'] = note2Block;
    note2Block.staticLabels.push(_('note value') + ' ' + 'G4');
    note2Block.adjustWidthToLabel();
    note2Block.zeroArgBlock();

    // macro
    var note1Block = new ProtoBlock('note1');
    note1Block.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note1'] = note1Block;
    note1Block.staticLabels.push(_('note value') + ' ' + i18nSolfege('sol') + '4');
    note1Block.adjustWidthToLabel();
    note1Block.zeroArgBlock();

    // macro
    var noteBlock = new ProtoBlock('note');
    noteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note'] = noteBlock;
    noteBlock.hidden = true;
    noteBlock.staticLabels.push('deprecated note value');
    noteBlock.adjustWidthToLabel();
    noteBlock.flowClampOneArgBlock();
    noteBlock.defaults.push(4);

    // macro
    var newnoteBlock = new ProtoBlock('newnote');
    newnoteBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newnote'] = newnoteBlock;
    newnoteBlock.staticLabels.push(_('note value'));
    newnoteBlock.adjustWidthToLabel();
    newnoteBlock.flowClampOneArgBlock();
    newnoteBlock.defaults.push(1 / 4);

    // macro
    var defineFrequencyBlock = new ProtoBlock('definefrequency');
    defineFrequencyBlock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['definefrequency'] = defineFrequencyBlock;
    defineFrequencyBlock.staticLabels.push(_('define Frequency'));
    defineFrequencyBlock.adjustWidthToLabel();
    defineFrequencyBlock.flowClampOneArgBlock();
    defineFrequencyBlock.hidden = true;

    // METER PALETTE

    var beatfactor = new ProtoBlock('beatfactor');
    beatfactor.palette = palettes.dict['meter'];
    blocks.protoBlockDict['beatfactor'] = beatfactor;
    //.TRANS: number of beats per minute
    beatfactor.staticLabels.push(_('beat factor'));
    beatfactor.adjustWidthToLabel();
    beatfactor.parameterBlock();

    var bpmBlock = new ProtoBlock('bpmfactor');
    bpmBlock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['bpmfactor'] = bpmBlock;
    //.TRANS: number of beats played per minute
    bpmBlock.staticLabels.push(_('beats per minute'));
    bpmBlock.adjustWidthToLabel();
    bpmBlock.parameterBlock();

    var measureValueBlock = new ProtoBlock('measurevalue');
    measureValueBlock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['measurevalue'] = measureValueBlock;
    //.TRANS: count of current measure in meter
    measureValueBlock.staticLabels.push(_('measure count'));
    measureValueBlock.adjustWidthToLabel();
    measureValueBlock.parameterBlock();

    var beatValueBlock = new ProtoBlock('beatvalue');
    beatValueBlock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['beatvalue'] = beatValueBlock;
    //.TRANS: count of current beat in meter
    beatValueBlock.staticLabels.push(_('beat count'));
    beatValueBlock.adjustWidthToLabel();
    beatValueBlock.parameterBlock();

    var noteCounter = new ProtoBlock('notecounter');
    noteCounter.palette = palettes.dict['meter'];
    blocks.protoBlockDict['notecounter'] = noteCounter;
    //.TRANS: count the number of notes
    noteCounter.staticLabels.push(_('note counter'));
    noteCounter.argFlowClampBlock();
    noteCounter.adjustWidthToLabel();

    // deprecated
    var elapsedNotes = new ProtoBlock('elapsednotes');
    elapsedNotes.palette = palettes.dict['meter'];
    blocks.protoBlockDict['elapsednotes'] = elapsedNotes;
    //.TRANS: number of whole notes that have been played
    elapsedNotes.staticLabels.push(_('whole notes played'));
    elapsedNotes.adjustWidthToLabel();
    elapsedNotes.parameterBlock();

    var elapsedNotes2 = new ProtoBlock('elapsednotes2');
    elapsedNotes2.palette = palettes.dict['meter'];
    blocks.protoBlockDict['elapsednotes2'] = elapsedNotes2;
    //.TRANS: number of notes that have been played
    elapsedNotes2.staticLabels.push(_('notes played'));
    elapsedNotes2.adjustWidthToLabel();
    elapsedNotes2.oneArgMathBlock();

    var pitchInHertzBlock = new ProtoBlock('pitchinhertz');
    pitchInHertzBlock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['pitchinhertz'] = pitchInHertzBlock;
    //.TRANS: the current pitch expressed in Hertz
    pitchInHertzBlock.staticLabels.push(_('pitch in hertz'));
    pitchInHertzBlock.adjustWidthToLabel();
    pitchInHertzBlock.parameterBlock();

    var driftBlock = new ProtoBlock('drift');
    driftBlock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['drift'] = driftBlock;
    //.TRANS: don't lock notes to master clock
    driftBlock.staticLabels.push(_('no clock'));
    driftBlock.adjustWidthToLabel();
    driftBlock.flowClampZeroArgBlock();

    var offBeatDoBlock = new ProtoBlock('offbeatdo');
    offBeatDoBlock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['offbeatdo'] = offBeatDoBlock;
    // #TRANS: on musical 'offbeat' do some action
    offBeatDoBlock.staticLabels.push(_('on offbeat do'));
    offBeatDoBlock.oneArgBlock();
    offBeatDoBlock.defaults.push(_('action'));
    offBeatDoBlock.adjustWidthToLabel();
    offBeatDoBlock.dockTypes[1] = 'textin';

    var onBeatDoBlock = new ProtoBlock('onbeatdo');
    onBeatDoBlock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['onbeatdo'] = onBeatDoBlock;
    // #TRANS: 'on' musical 'beat' 'do' some action
    onBeatDoBlock.staticLabels.push(_('on beat'), _('beat'), _('do'));
    onBeatDoBlock.twoArgBlock();
    onBeatDoBlock.defaults.push(1);
    onBeatDoBlock.defaults.push(_('action'));
    onBeatDoBlock.dockTypes[1] = 'numberin';
    onBeatDoBlock.dockTypes[2] = 'textin';
    onBeatDoBlock.adjustWidthToLabel();

    // macro
    var setMasterBPMBlock2 = new ProtoBlock('setmasterbpm2');
    setMasterBPMBlock2.palette = palettes.dict['meter'];
    blocks.protoBlockDict['setmasterbpm2'] = setMasterBPMBlock2;
    //.TRANS: sets tempo by defniing a beat and beats per minute
    setMasterBPMBlock2.staticLabels.push(_('master beats per minute'));
    setMasterBPMBlock2.staticLabels.push(_('bpm'), _('beat value'));
    setMasterBPMBlock2.extraWidth = 15;
    setMasterBPMBlock2.adjustWidthToLabel();
    setMasterBPMBlock2.defaults.push(90);
    setMasterBPMBlock2.defaults.push(1 / 4);
    setMasterBPMBlock2.twoArgBlock();

    // macro
    var setMasterBPMBlock = new ProtoBlock('setmasterbpm');
    setMasterBPMBlock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['setmasterbpm'] = setMasterBPMBlock;
    //.TRANS: old block to set master tempo which doesn't set value of beat
    setMasterBPMBlock.staticLabels.push(_('master beats per minute'));
    setMasterBPMBlock.adjustWidthToLabel();
    setMasterBPMBlock.oneArgBlock();
    setMasterBPMBlock.defaults.push(90);
    setMasterBPMBlock.hidden = true;

    // macro
    var setbpmBlock2 = new ProtoBlock('setbpm2');
    setbpmBlock2.palette = palettes.dict['meter'];
    blocks.protoBlockDict['setbpm2'] = setbpmBlock2;
    // .TRANS: sets tempo for notes contained in block
    setbpmBlock2.staticLabels.push(_('beats per minute'));
    setbpmBlock2.staticLabels.push(_('bpm'), _('beat value'));
    setbpmBlock2.adjustWidthToLabel();
    setbpmBlock2.flowClampTwoArgBlock();
    setbpmBlock2.defaults.push(90);
    setbpmBlock2.defaults.push(1 / 4);

    // macro
    var setbpmBlock = new ProtoBlock('setbpm');
    setbpmBlock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['setbpm'] = setbpmBlock;
    // .TRANS: old block to set tempo using only bpm for notes contained in block
    setbpmBlock.staticLabels.push(_('beats per minute'));
    setbpmBlock.adjustWidthToLabel();
    setbpmBlock.flowClampOneArgBlock();
    setbpmBlock.defaults.push(90);
    setbpmBlock.hidden = true;

    // macro
    var pickupBlock = new ProtoBlock('pickup');
    pickupBlock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['pickup'] = pickupBlock;
    //.TRANS: anacrusis
    pickupBlock.staticLabels.push(_('pickup'));
    pickupBlock.oneArgBlock();
    pickupBlock.defaults.push(0);

    // macro
    var meter = new ProtoBlock('meter');
    meter.palette = palettes.dict['meter'];
    blocks.protoBlockDict['meter'] = meter;
    //.TRANS: musical meter (time signature)
    meter.staticLabels.push(_('meter'));
    meter.staticLabels.push(_('number of beats'), _('note value'));
    meter.extraWidth = 15;
    meter.adjustWidthToLabel();
    meter.defaults.push(4);
    meter.defaults.push(0.25);
    meter.twoArgBlock();

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

    var amSynthBlock = new ProtoBlock('amsynth');
    amSynthBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['amsynth'] = amSynthBlock;
    //.TRANS: AM (amplitude modulation) synthesizer
    amSynthBlock.staticLabels.push(_('AM synth'));
    amSynthBlock.extraWidth = 10;
    amSynthBlock.adjustWidthToLabel();
    amSynthBlock.defaults.push(1);
    amSynthBlock.oneArgBlock();
    amSynthBlock.dockTypes[1] = 'numberin';

    var fmSynthBlock = new ProtoBlock('fmsynth');
    fmSynthBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['fmsynth'] = fmSynthBlock;
    //.TRANS: FM (frequency modulation) synthesizer
    fmSynthBlock.staticLabels.push(_('FM synth'));
    fmSynthBlock.extraWidth = 10;
    fmSynthBlock.adjustWidthToLabel();
    fmSynthBlock.defaults.push(10);
    fmSynthBlock.oneArgBlock();
    fmSynthBlock.dockTypes[1] = 'numberin';

    var duoSynthBlock = new ProtoBlock('duosynth');
    duoSynthBlock.palette = palettes.dict['tone'];

    blocks.protoBlockDict['duosynth'] = duoSynthBlock;
    //.TRANS: a duo synthesizer combines a synth with a sequencer
    duoSynthBlock.staticLabels.push(_('duo synth'));
    duoSynthBlock.staticLabels.push(_('vibrato rate'), _('vibrato intensity'));
    duoSynthBlock.extraWidth = 10;
    duoSynthBlock.adjustWidthToLabel();
    duoSynthBlock.defaults.push(10);
    duoSynthBlock.defaults.push(6);
    duoSynthBlock.twoArgBlock();
    duoSynthBlock.dockTypes[1] = 'numberin';
    duoSynthBlock.dockTypes[2] = 'numberin';

    var partialBlock = new ProtoBlock('partial');
    partialBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['partial'] = partialBlock;
    //.TRANS: partials are weighted components in a harmonic series
    partialBlock.staticLabels.push(_('partial'));
    partialBlock.adjustWidthToLabel();
    partialBlock.oneArgBlock();
    partialBlock.defaults.push(1);

    // macro
    var harmonicBlock = new ProtoBlock('harmonic');
    harmonicBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['harmonic'] = harmonicBlock;
    //.TRANS: partials are weighted components in a harmonic series
    harmonicBlock.staticLabels.push(_('weighted partials'));
    harmonicBlock.adjustWidthToLabel();
    harmonicBlock.flowClampZeroArgBlock();

    // macro
    var harmonic2Block = new ProtoBlock('harmonic2');
    harmonic2Block.palette = palettes.dict['tone'];
    blocks.protoBlockDict['harmonic2'] = harmonic2Block;
    //.TRANS: A harmonic is a overtone.
    harmonic2Block.staticLabels.push(_('harmonic'));
    harmonic2Block.adjustWidthToLabel();
    harmonic2Block.flowClampOneArgBlock();
    harmonic2Block.dockTypes[1] = 'numberin';
    harmonic2Block.defaults.push(1);

    // macro
    var neighborBlock = new ProtoBlock('neighbor');
    neighborBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['neighbor'] = neighborBlock;
    //.TRANS: the neigbor refers to a neighboring note, e.g., D is a neighbor of C
    neighborBlock.staticLabels.push(_('neighbor') + ' (+/–)');
    neighborBlock.staticLabels.push(_('semi-tone interval'), _('note value'));
    neighborBlock.extraWidth = 15;
    neighborBlock.adjustWidthToLabel();
    neighborBlock.flowClampTwoArgBlock();
    neighborBlock.dockTypes[1] = 'numberin';
    neighborBlock.dockTypes[2] = 'numberin';
    neighborBlock.defaults.push(1);
    neighborBlock.defaults.push(1 / 16);

    // macro
    var neighbor2Block = new ProtoBlock('neighbor2');
    neighbor2Block.palette = palettes.dict['tone'];
    blocks.protoBlockDict['neighbor2'] = neighbor2Block;
    //.TRANS: the neigbor refers to a neighboring note, e.g., D is a neighbor of C
    neighbor2Block.staticLabels.push(_('neighbor') + ' (+/–)');
    neighbor2Block.staticLabels.push(_('scalar interval'), _('note value'));
    neighbor2Block.extraWidth = 15;
    neighbor2Block.adjustWidthToLabel();
    neighbor2Block.flowClampTwoArgBlock();
    neighbor2Block.dockTypes[1] = 'numberin';
    neighbor2Block.dockTypes[2] = 'numberin';
    neighbor2Block.defaults.push(1);
    neighbor2Block.defaults.push(1 / 16);

    var distortionBlock = new ProtoBlock('dis');
    distortionBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['dis'] = distortionBlock;
    //.TRANS: distortion is an alteration in the sound
    distortionBlock.staticLabels.push(_('distortion'));
    distortionBlock.adjustWidthToLabel();
    distortionBlock.flowClampOneArgBlock();
    distortionBlock.dockTypes[1] = 'numberin';
    distortionBlock.defaults.push(40);

    var tremoloBlock = new ProtoBlock('tremolo');
    tremoloBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['tremolo'] = tremoloBlock;
    //.TRANS: a wavering effect in a musical tone
    tremoloBlock.staticLabels.push(_('tremolo'));
    //.TRANS: rate at which tremolo wavers
    tremoloBlock.staticLabels.push(_('rate'));
    //.TRANS: amplitude of tremolo waver
    tremoloBlock.staticLabels.push(_('depth'));
    tremoloBlock.adjustWidthToLabel();
    tremoloBlock.flowClampTwoArgBlock();
    tremoloBlock.dockTypes[1] = 'numberin';
    tremoloBlock.dockTypes[2] = 'numberin';
    tremoloBlock.defaults.push(10);
    tremoloBlock.defaults.push(50);

    var phaserBlock = new ProtoBlock('phaser');
    phaserBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['phaser'] = phaserBlock;
    //.TRANS: alter the phase of the sound
    phaserBlock.staticLabels.push(_('phaser'));
    phaserBlock.staticLabels.push(_('rate'), _('octaves'), _('base frequency'));
    phaserBlock.extraWidth = 10;
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
    //.TRANS: musical effect to simulate a choral sound
    chorusBlock.staticLabels.push(_('chorus'));
    chorusBlock.staticLabels.push(_('rate'), _('delay') + ' (MS)', _('depth'));
    chorusBlock.adjustWidthToLabel();
    chorusBlock.flowClampThreeArgBlock();
    chorusBlock.dockTypes[1] = 'numberin';
    chorusBlock.dockTypes[2] = 'numberin';
    chorusBlock.dockTypes[3] = 'numberin';
    chorusBlock.defaults.push(1.5);
    chorusBlock.defaults.push(3.5);
    chorusBlock.defaults.push(70);

    // macro
    var vibratoBlock = new ProtoBlock('vibrato');
    vibratoBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['vibrato'] = vibratoBlock;
    //.TRANS: a rapid, slight variation in pitch
    vibratoBlock.staticLabels.push(_('vibrato'));
    vibratoBlock.staticLabels.push(_('intensity'), _('rate'));
    vibratoBlock.adjustWidthToLabel();
    vibratoBlock.flowClampTwoArgBlock();
    vibratoBlock.defaults.push(5);
    vibratoBlock.defaults.push(1 / 16);

    // deprecated by set timbre block
    // macro
    var voiceBlock = new ProtoBlock('setvoice');
    voiceBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['setvoice'] = voiceBlock;
    //.TRANS: select synthesizer
    voiceBlock.staticLabels.push(_('set synth'));
    voiceBlock.adjustWidthToLabel();
    voiceBlock.flowClampOneArgBlock();
    voiceBlock.dockTypes[1] = 'textin';
    voiceBlock.defaults.push('violin');
    voiceBlock.hidden = true;

    // macro
    var glideBlock = new ProtoBlock('glide');
    glideBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['glide'] = glideBlock;
    //.TRANS: glide (glissando) is a blended overlap successive notes
    glideBlock.staticLabels.push(_('glide'));
    glideBlock.adjustWidthToLabel();
    glideBlock.flowClampOneArgBlock();
    glideBlock.defaults.push(1 / 16);
    glideBlock.hidden = true;

    // macro
    var slurBlock = new ProtoBlock('slur');
    slurBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['slur'] = slurBlock;
    //.TRANS: slur or legato is an overlap successive notes
    slurBlock.staticLabels.push(_('slur'));
    slurBlock.adjustWidthToLabel();
    slurBlock.flowClampOneArgBlock();
    slurBlock.defaults.push(16);
    slurBlock.hidden = true;

    // macro
    var staccatoBlock = new ProtoBlock('staccato');
    staccatoBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['staccato'] = staccatoBlock;
    //.TRANS: play each note sharply detached from the others
    staccatoBlock.staticLabels.push(_('staccato'));
    staccatoBlock.adjustWidthToLabel();
    staccatoBlock.flowClampOneArgBlock();
    staccatoBlock.defaults.push(32);
    staccatoBlock.hidden = true;

    // macro
    var newslurBlock = new ProtoBlock('newslur');
    newslurBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['newslur'] = newslurBlock;
    //.TRANS: legato: overlap successive notes
    newslurBlock.staticLabels.push(_('slur'));
    newslurBlock.adjustWidthToLabel();
    newslurBlock.flowClampOneArgBlock();
    newslurBlock.defaults.push(1 / 16);

    // macro
    var newstaccatoBlock = new ProtoBlock('newstaccato');
    newstaccatoBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['newstaccato'] = newstaccatoBlock;
    //.TRANS: play each note sharply detached from the others
    newstaccatoBlock.staticLabels.push(_('staccato'));
    newstaccatoBlock.adjustWidthToLabel();
    newstaccatoBlock.flowClampOneArgBlock();
    newstaccatoBlock.defaults.push(1 / 32);

    // deprecated
    var synthnameBlock = new ProtoBlock('synthname');
    synthnameBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['synthname'] = synthnameBlock;
    synthnameBlock.staticLabels.push(_('synth name'));
    synthnameBlock.adjustWidthToLabel();
    synthnameBlock.dockTypes[0] = 'textout';
    synthnameBlock.parameterBlock();
    synthnameBlock.hidden = true;

    var voicenameBlock = new ProtoBlock('voicename');
    voicenameBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['voicename'] = voicenameBlock;
    voicenameBlock.valueBlock();
    voicenameBlock.dockTypes[0] = 'textout';
    voicenameBlock.extraWidth = 50;

    // macro
    var setTimbreBlock = new ProtoBlock('settimbre');
    setTimbreBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['settimbre'] = setTimbreBlock;
    //.TRANS: set the characteristics of a custom instrument
    setTimbreBlock.staticLabels.push(_('set timbre'));
    setTimbreBlock.adjustWidthToLabel();
    setTimbreBlock.flowClampOneArgBlock();
    setTimbreBlock.dockTypes[1] = 'textin';
    //.TRANS: user-defined
    setTimbreBlock.defaults.push(_('custom'));   

    var setTemperamentBlock = new ProtoBlock('settemperament');
    setTemperamentBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['settemperament'] = setTemperamentBlock;
    setTemperamentBlock.staticLabels.push(_('set temperament'));
    setTemperamentBlock.adjustWidthToLabel();
    setTemperamentBlock.oneArgBlock();

    var temperamentNameBlock = new ProtoBlock('temperamentname');
    temperamentNameBlock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['temperamentname'] = temperamentNameBlock;
    temperamentNameBlock.valueBlock();
    temperamentNameBlock.hidden = true; 
    temperamentNameBlock.extraWidth = 50;
    temperamentNameBlock.dockTypes[0] = 'anyout';

    var temperament1Block = new ProtoBlock('temperament1');
    temperament1Block.palette = palettes.dict['action'];
    blocks.protoBlockDict['temperament1'] = temperament1Block;
    temperament1Block.staticLabels.push(_('temperament'));
    temperament1Block.hidden = true; 
    temperament1Block.extraWidth = 20;
    temperament1Block.adjustWidthToLabel();
    temperament1Block.stackClampOneArgBlock();   

    // INTERVALS (PITCH TRANSFORMS) PALETTE

    var modenameBlock = new ProtoBlock('modename');
    modenameBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['modename'] = modenameBlock;
    modenameBlock.valueBlock();
    modenameBlock.dockTypes[0] = 'textout';
    modenameBlock.extraWidth = 50;  // 150;

    var doublyBlock = new ProtoBlock('doubly');
    doublyBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['doubly'] = doublyBlock;
    // TRANS: doubly means to apply an augmentation or diminishment twice
    doublyBlock.staticLabels.push(_('doubly'));
    doublyBlock.oneArgMathBlock();
    doublyBlock.dockTypes[0] = 'anyout';
    doublyBlock.dockTypes[1] = 'anyin';

    var intervalnameBlock = new ProtoBlock('intervalname');
    intervalnameBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['intervalname'] = intervalnameBlock;
    intervalnameBlock.valueBlock();
    intervalnameBlock.extraWidth = 50;
    intervalnameBlock.adjustWidthToLabel();
    intervalnameBlock.dockTypes[0] = 'numberout';

    var intervalMeasure = new ProtoBlock('measureintervalsemitones');
    intervalMeasure.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['measureintervalsemitones'] = intervalMeasure;
    //.TRANS: measure the distance between two pitches in semi-tones
    intervalMeasure.staticLabels.push(_('semi-tone interval measure'));
    intervalMeasure.argFlowClampBlock();
    intervalMeasure.adjustWidthToLabel();

    var intervalMeasure2 = new ProtoBlock('measureintervalscalar');
    intervalMeasure2.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['measureintervalscalar'] = intervalMeasure2;
    //.TRANS: measure the distance between two pitches in steps of musical scale
    intervalMeasure2.staticLabels.push(_('scalar interval measure'));
    intervalMeasure2.argFlowClampBlock();
    intervalMeasure2.adjustWidthToLabel();

    // macro
    var diminished8Block = new ProtoBlock('diminished8');
    diminished8Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished8'] = diminished8Block;
    diminished8Block.staticLabels.push(_('diminished') + ' 8');
    diminished8Block.adjustWidthToLabel();
    diminished8Block.zeroArgBlock();

    // macro
    var diminished7Block = new ProtoBlock('diminished7');
    diminished7Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished7'] = diminished7Block;
    diminished7Block.staticLabels.push(_('diminished') + ' 7');
    diminished7Block.adjustWidthToLabel();
    diminished7Block.zeroArgBlock();

    // macro
    var diminished6Block = new ProtoBlock('diminished6');
    diminished6Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished6'] = diminished6Block;
    diminished6Block.staticLabels.push(_('diminished') + ' 6');
    diminished6Block.adjustWidthToLabel();
    diminished6Block.zeroArgBlock();

    // macro
    var diminished5Block = new ProtoBlock('diminished5');
    diminished5Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished5'] = diminished5Block;
    diminished5Block.staticLabels.push(_('diminished') + ' 5');
    diminished5Block.adjustWidthToLabel();
    diminished5Block.zeroArgBlock();

    // macro
    var diminished4Block = new ProtoBlock('diminished4');
    diminished4Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished4'] = diminished4Block;
    diminished4Block.staticLabels.push(_('diminished') + ' 4');
    diminished4Block.adjustWidthToLabel();
    diminished4Block.zeroArgBlock();

    // macro
    var diminished3Block = new ProtoBlock('diminished3');
    diminished3Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished3'] = diminished3Block;
    diminished3Block.staticLabels.push(_('diminished') + ' 3');
    diminished3Block.adjustWidthToLabel();
    diminished3Block.zeroArgBlock();

    // macro
    var diminished2Block = new ProtoBlock('diminished2');
    diminished2Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished2'] = diminished2Block;
    diminished2Block.staticLabels.push(_('diminished') + ' 2');
    diminished2Block.adjustWidthToLabel();
    diminished2Block.zeroArgBlock();

    // macro
    var augmented8Block = new ProtoBlock('augmented8');
    augmented8Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented8'] = augmented8Block;
    augmented8Block.staticLabels.push(_('augmented') + ' 8');
    augmented8Block.adjustWidthToLabel();
    augmented8Block.zeroArgBlock();

    // macro
    var augmented7Block = new ProtoBlock('augmented7');
    augmented7Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented7'] = augmented7Block;
    augmented7Block.staticLabels.push(_('augmented') + ' 7');
    augmented7Block.adjustWidthToLabel();
    augmented7Block.zeroArgBlock();

    // macro
    var augmented6Block = new ProtoBlock('augmented6');
    augmented6Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented6'] = augmented6Block;
    augmented6Block.staticLabels.push(_('augmented') + ' 6');
    augmented6Block.adjustWidthToLabel();
    augmented6Block.zeroArgBlock();

    // macro
    var augmented5Block = new ProtoBlock('augmented5');
    augmented5Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented5'] = augmented5Block;
    augmented5Block.staticLabels.push(_('augmented') + ' 5');
    augmented5Block.adjustWidthToLabel();
    augmented5Block.zeroArgBlock();

    // macro
    var augmented4Block = new ProtoBlock('augmented4');
    augmented4Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented4'] = augmented4Block;
    augmented4Block.staticLabels.push(_('augmented') + ' 4');
    augmented4Block.adjustWidthToLabel();
    augmented4Block.zeroArgBlock();

    // macro
    var augmented3Block = new ProtoBlock('augmented3');
    augmented3Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented3'] = augmented3Block;
    augmented3Block.staticLabels.push(_('augmented') + ' 3');
    augmented3Block.adjustWidthToLabel();
    augmented3Block.zeroArgBlock();

    // macro
    var augmented2Block = new ProtoBlock('augmented2');
    augmented2Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented2'] = augmented2Block;
    augmented2Block.staticLabels.push(_('augmented') + ' 2');
    augmented2Block.adjustWidthToLabel();
    augmented2Block.zeroArgBlock();

    // macro
    var augmented1Block = new ProtoBlock('augmented1');
    augmented1Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented1'] = augmented1Block;
    augmented1Block.staticLabels.push(_('augmented') + ' 1');
    augmented1Block.adjustWidthToLabel();
    augmented1Block.zeroArgBlock();

    // macro
    var perfect8Block = new ProtoBlock('perfect8');
    perfect8Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect8'] = perfect8Block;
    perfect8Block.staticLabels.push(_('perfect') + ' 8');
    perfect8Block.adjustWidthToLabel();
    perfect8Block.zeroArgBlock();

    // macro
    var perfect5Block = new ProtoBlock('perfect5');
    perfect5Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect5'] = perfect5Block;
    perfect5Block.staticLabels.push(_('perfect') + ' 5');
    perfect5Block.adjustWidthToLabel();
    perfect5Block.zeroArgBlock();

    // macro
    var perfect4Block = new ProtoBlock('perfect4');
    perfect4Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect4'] = perfect4Block;
    perfect4Block.staticLabels.push(_('perfect') + ' 4');
    perfect4Block.adjustWidthToLabel();
    perfect4Block.zeroArgBlock();

    var perfectBlock = new ProtoBlock('perfect');
    perfectBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect'] = perfectBlock;
    perfectBlock.staticLabels.push(_('perfect'));
    perfectBlock.adjustWidthToLabel();
    perfectBlock.flowClampOneArgBlock();
    perfectBlock.defaults.push(5);
    perfectBlock.hidden = true;

    // macro
    var downminor6Block = new ProtoBlock('downminor6');
    downminor6Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downminor6'] = downminor6Block;
    downminor6Block.staticLabels.push(_('down minor') + ' 6');
    downminor6Block.adjustWidthToLabel();
    downminor6Block.zeroArgBlock();

    // macro
    var downminor3Block = new ProtoBlock('downminor3');
    downminor3Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downminor3'] = downminor3Block;
    downminor3Block.staticLabels.push(_('down minor') + ' 3');
    downminor3Block.adjustWidthToLabel();
    downminor3Block.zeroArgBlock();

    // macro
    var minor7Block = new ProtoBlock('minor7');
    minor7Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor7'] = minor7Block;
    minor7Block.staticLabels.push(_('minor') +  ' 7');
    minor7Block.adjustWidthToLabel();
    minor7Block.zeroArgBlock();

    // macro
    var minor6Block = new ProtoBlock('minor6');
    minor6Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor6'] = minor6Block;
    minor6Block.staticLabels.push(_('minor') + ' 6');
    minor6Block.adjustWidthToLabel();
    minor6Block.zeroArgBlock();

    // macro
    var minor3Block = new ProtoBlock('minor3');
    minor3Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor3'] = minor3Block;
    minor3Block.staticLabels.push(_('minor') + ' 3');
    minor3Block.adjustWidthToLabel();
    minor3Block.zeroArgBlock();

    // macro
    var minor2Block = new ProtoBlock('minor2');
    minor2Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor2'] = minor2Block;
    minor2Block.staticLabels.push(_('minor') + ' 2');
    minor2Block.adjustWidthToLabel();
    minor2Block.zeroArgBlock();

    // macro
    var downmajor6Block = new ProtoBlock('downmajor6');
    downmajor6Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downmajor6'] = downmajor6Block;
    downmajor6Block.staticLabels.push(_('down major') + ' 6');
    downmajor6Block.adjustWidthToLabel();
    downmajor6Block.zeroArgBlock();

    // macro
    var downmajor3Block = new ProtoBlock('downmajor3');
    downmajor3Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downmajor3'] = downmajor3Block;
    downmajor3Block.staticLabels.push(_('down major') + ' 3');
    downmajor3Block.adjustWidthToLabel();
    downmajor3Block.zeroArgBlock();

    // macro
    var major7Block = new ProtoBlock('major7');
    major7Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major7'] = major7Block;
    major7Block.staticLabels.push(_('major') + ' 7');
    major7Block.adjustWidthToLabel();
    major7Block.zeroArgBlock();

    // macro
    var major6Block = new ProtoBlock('major6');
    major6Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major6'] = major6Block;
    major6Block.staticLabels.push(_('major') + ' 6');
    major6Block.adjustWidthToLabel();
    major6Block.zeroArgBlock();

    // macro
    var major3Block = new ProtoBlock('major3');
    major3Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major3'] = major3Block;
    major3Block.staticLabels.push(_('major') + ' 3');
    major3Block.adjustWidthToLabel();
    major3Block.zeroArgBlock();

    // macro
    var major2Block = new ProtoBlock('major2');
    major2Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major2'] = major2Block;
    major2Block.staticLabels.push(_('major') + ' 2');
    major2Block.adjustWidthToLabel();
    major2Block.zeroArgBlock();

    // macro
    var semitoneintervalBlock = new ProtoBlock('semitoneinterval');
    semitoneintervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['semitoneinterval'] = semitoneintervalBlock;
    //.TRANS: calculate a relative step between notes based on semi-tones
    semitoneintervalBlock.staticLabels.push(_('semi-tone interval') + ' (+/–)');
    semitoneintervalBlock.adjustWidthToLabel();
    semitoneintervalBlock.flowClampOneArgBlock();
    semitoneintervalBlock.defaults.push(5);
    semitoneintervalBlock.hidden = true;

    // macro
    var downsixthIntervalBlock = new ProtoBlock('downsixthinterval');
    downsixthIntervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downsixthinterval'] = downsixthIntervalBlock;
    //.TRANS: down sixth means the note is five scale degrees below current note
    downsixthIntervalBlock.staticLabels.push(_('down sixth'));
    downsixthIntervalBlock.adjustWidthToLabel();
    downsixthIntervalBlock.zeroArgBlock();

    // macro
    var downthirdIntervalBlock = new ProtoBlock('downthirdinterval');
    downthirdIntervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downthirdinterval'] = downthirdIntervalBlock;
    //.TRANS: down third means the note is two scale degrees below current note
    downthirdIntervalBlock.staticLabels.push(_('down third'));
    downthirdIntervalBlock.adjustWidthToLabel();
    downthirdIntervalBlock.zeroArgBlock();

    // macro
    var seventhIntervalBlock = new ProtoBlock('seventhinterval');
    seventhIntervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['seventhinterval'] = seventhIntervalBlock;
    //.TRANS: seventh means the note is the six scale degrees above current note
    seventhIntervalBlock.staticLabels.push(_('seventh'));
    seventhIntervalBlock.adjustWidthToLabel();
    seventhIntervalBlock.zeroArgBlock();

    // macro
    var sixthIntervalBlock = new ProtoBlock('sixthinterval');
    sixthIntervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['sixthinterval'] = sixthIntervalBlock;
    //.TRANS: sixth means the note is the five scale degrees above current note
    sixthIntervalBlock.staticLabels.push(_('sixth'));
    sixthIntervalBlock.adjustWidthToLabel();
    sixthIntervalBlock.zeroArgBlock();

    // macro
    var fifthIntervalBlock = new ProtoBlock('fifthinterval');
    fifthIntervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['fifthinterval'] = fifthIntervalBlock;
    //.TRANS: fifth means the note is the four scale degrees above current note
    fifthIntervalBlock.staticLabels.push(_('fifth'));
    fifthIntervalBlock.adjustWidthToLabel();
    fifthIntervalBlock.zeroArgBlock();

    // macro
    var fourthIntervalBlock = new ProtoBlock('fourthinterval');
    fourthIntervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['fourthinterval'] = fourthIntervalBlock;
    //.TRANS: fourth means the note is three scale degrees above current note
    fourthIntervalBlock.staticLabels.push(_('fourth'));
    fourthIntervalBlock.adjustWidthToLabel();
    fourthIntervalBlock.zeroArgBlock();

    // macro
    var thirdIntervalBlock = new ProtoBlock('thirdinterval');
    thirdIntervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['thirdinterval'] = thirdIntervalBlock;
    //.TRANS: third means the note is two scale degrees above current note
    thirdIntervalBlock.staticLabels.push(_('third'));
    thirdIntervalBlock.adjustWidthToLabel();
    thirdIntervalBlock.zeroArgBlock();

    // macro
    var secondIntervalBlock = new ProtoBlock('secondinterval');
    secondIntervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['secondinterval'] = secondIntervalBlock;
    //.TRANS: second means the note is one scale degree above current note
    secondIntervalBlock.staticLabels.push(_('second'));
    secondIntervalBlock.adjustWidthToLabel();
    secondIntervalBlock.zeroArgBlock();

    // macro
    var unisonIntervalBlock = new ProtoBlock('unisoninterval');
    unisonIntervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['unisoninterval'] = unisonIntervalBlock;
    //.TRANS: unison means the note is the same as the current note
    unisonIntervalBlock.staticLabels.push(_('unison'));
    unisonIntervalBlock.adjustWidthToLabel();
    unisonIntervalBlock.zeroArgBlock();

    // macro
    var intervalBlock = new ProtoBlock('interval');
    intervalBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['interval'] = intervalBlock;
    //.TRANS: calculate a relative step between notes based on the current musical scale
    intervalBlock.staticLabels.push(_('scalar interval') + ' (+/–)');
    intervalBlock.adjustWidthToLabel();
    intervalBlock.flowClampOneArgBlock();
    intervalBlock.defaults.push(5);
    intervalBlock.hidden = true;

    // macro
    var defineModeBlock = new ProtoBlock('definemode');
    defineModeBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['definemode'] = defineModeBlock;
    //.TRANS: define a custom mode
    defineModeBlock.staticLabels.push(_('define mode'));
    defineModeBlock.adjustWidthToLabel();
    defineModeBlock.flowClampOneArgBlock();
    defineModeBlock.defaults.push(_('custom'));
    defineModeBlock.dockTypes[1] = 'textin';

    // macro
    var movableBlock = new ProtoBlock('movable');  // legacy typo
    movableBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['movable'] = movableBlock;
    movableBlock.staticLabels.push(_('moveable'));
    movableBlock.adjustWidthToLabel();
    movableBlock.oneBooleanArgBlock();

    var modeBlock = new ProtoBlock('modelength');
    modeBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['modelength'] = modeBlock;
    //.TRANS:  mode length is the number of notes in the mode, e.g., 7 for major and minor scales; 12 for chromatic scales
    modeBlock.staticLabels.push(_('mode length'));
    modeBlock.adjustWidthToLabel();
    modeBlock.parameterBlock();

    var keyBlock = new ProtoBlock('key');
    keyBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['key'] = keyBlock;
    //.TRANS: the key is a group of pitches with which a music composition is created
    keyBlock.staticLabels.push(_('key'));
    keyBlock.adjustWidthToLabel();
    keyBlock.parameterBlock();

    // Deprecated
    var setkeyBlock = new ProtoBlock('setkey');
    setkeyBlock.hidden = true;
    setkeyBlock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['setkey'] = setkeyBlock;
    //.TRANS: set the key and mode, e.g. C Major
    setkeyBlock.staticLabels.push(_('set key'));
    setkeyBlock.adjustWidthToLabel();
    setkeyBlock.oneArgBlock();
    setkeyBlock.dockTypes[1] = 'textin';
    setkeyBlock.defaults.push('C');

    // macro
    var setkey2Block = new ProtoBlock('setkey2');
    setkey2Block.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['setkey2'] = setkey2Block;
    //.TRANS: set the key and mode, e.g. C Major
    setkey2Block.staticLabels.push(_('set key'));
    //.TRANS: key, e.g., C in C Major
    setkey2Block.staticLabels.push(_('key'));
    //.TRANS: mode, e.g., Major in C Major
    setkey2Block.staticLabels.push(_('mode'));
    setkey2Block.adjustWidthToLabel();
    setkey2Block.twoArgBlock();
    setkey2Block.dockTypes[1] = 'anyin';
    setkey2Block.dockTypes[2] = 'anyin';

    // DRUM PALETTE
    var drumnameBlock = new ProtoBlock('drumname');
    drumnameBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['drumname'] = drumnameBlock;
    drumnameBlock.valueBlock();
    drumnameBlock.extraWidth = 50;
    drumnameBlock.dockTypes[0] = 'textout';

    // macro
    var duckBlock = new ProtoBlock('duck');
    duckBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['duck'] = duckBlock;
    duckBlock.staticLabels.push(_('duck'));
    duckBlock.adjustWidthToLabel();
    duckBlock.oneArgBlock();

    // macro
    var catBlock = new ProtoBlock('cat');
    catBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cat'] = catBlock;
    catBlock.staticLabels.push(_('cat'));
    catBlock.adjustWidthToLabel();
    catBlock.oneArgBlock();

    // macro
    var cricketBlock = new ProtoBlock('cricket');
    cricketBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cricket'] = cricketBlock;
    cricketBlock.staticLabels.push(_('cricket'));
    cricketBlock.adjustWidthToLabel();
    cricketBlock.oneArgBlock();

    // macro
    var dogBlock = new ProtoBlock('dog');
    dogBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['dog'] = dogBlock;
    dogBlock.staticLabels.push(_('dog'));
    dogBlock.adjustWidthToLabel();
    dogBlock.oneArgBlock();

    // macro
    var bottleBlock = new ProtoBlock('bottle');
    bottleBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['bottle'] = bottleBlock;
    bottleBlock.staticLabels.push(_('bottle'));
    bottleBlock.adjustWidthToLabel();
    bottleBlock.oneArgBlock();

    // macro
    var bubblesBlock = new ProtoBlock('bubbles');
    bubblesBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['bubbles'] = bubblesBlock;
    bubblesBlock.staticLabels.push(_('bubbles'));
    bubblesBlock.adjustWidthToLabel();
    bubblesBlock.oneArgBlock();

    // macro
    var chineBlock = new ProtoBlock('chine');
    chineBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['chine'] = chineBlock;
    chineBlock.staticLabels.push(_('chime'));
    chineBlock.adjustWidthToLabel();
    chineBlock.oneArgBlock();

    // macro
    var clangBlock = new ProtoBlock('clang');
    clangBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['clang'] = clangBlock;
    clangBlock.staticLabels.push(_('clang'));
    clangBlock.adjustWidthToLabel();
    clangBlock.oneArgBlock();

    // macro
    var clapBlock = new ProtoBlock('clap');
    clapBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['clap'] = clapBlock;
    clapBlock.staticLabels.push(_('clap'));
    clapBlock.adjustWidthToLabel();
    clapBlock.oneArgBlock();

    // macro
    var slapBlock = new ProtoBlock('slap');
    slapBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['slap'] = slapBlock;
    slapBlock.staticLabels.push(_('slap'));
    slapBlock.adjustWidthToLabel();
    slapBlock.oneArgBlock();

    // macro
    var crashBlock = new ProtoBlock('crash');
    crashBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['crash'] = crashBlock;
    crashBlock.staticLabels.push(_('crash'));
    crashBlock.adjustWidthToLabel();
    crashBlock.oneArgBlock();

    // macro
    var splashBlock = new ProtoBlock('tom');
    splashBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['tom'] = splashBlock;
    splashBlock.staticLabels.push(_('splash'));
    splashBlock.adjustWidthToLabel();
    splashBlock.oneArgBlock();

    // macro
    var cowbellBlock = new ProtoBlock('cowbell');
    cowbellBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cowbell'] = cowbellBlock;
    cowbellBlock.staticLabels.push(_('cow bell'));
    cowbellBlock.adjustWidthToLabel();
    cowbellBlock.oneArgBlock();

    // macro
    var ridebellBlock = new ProtoBlock('ridebell');
    ridebellBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['ridebell'] = ridebellBlock;
    ridebellBlock.staticLabels.push(_('ride bell'));
    ridebellBlock.adjustWidthToLabel();
    ridebellBlock.oneArgBlock();

    // macro
    var fingercymbalsBlock = new ProtoBlock('fingercymbals');
    fingercymbalsBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['fingercymbals'] = fingercymbalsBlock;
    fingercymbalsBlock.staticLabels.push(_('finger cymbals'));
    fingercymbalsBlock.adjustWidthToLabel();
    fingercymbalsBlock.oneArgBlock();

    // macro
    var trianglebellBlock = new ProtoBlock('trianglebell');
    trianglebellBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['trianglebell'] = trianglebellBlock;
    trianglebellBlock.staticLabels.push(_('triangle bell'));
    trianglebellBlock.adjustWidthToLabel();
    trianglebellBlock.oneArgBlock();

    // macro
    var hihatBlock = new ProtoBlock('hihat');
    hihatBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['hihat'] = hihatBlock;
    hihatBlock.staticLabels.push(_('hi hat'));
    hihatBlock.adjustWidthToLabel();
    hihatBlock.oneArgBlock();

    // macro
    var darbukaBlock = new ProtoBlock('darbuka');
    darbukaBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['darbuka'] = darbukaBlock;
    darbukaBlock.staticLabels.push(_('darbuka drum'));
    darbukaBlock.adjustWidthToLabel();
    darbukaBlock.oneArgBlock();

    // macro
    var cupBlock = new ProtoBlock('cup');
    cupBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['cup'] = cupBlock;
    cupBlock.staticLabels.push(_('cup drum'));
    cupBlock.adjustWidthToLabel();
    cupBlock.oneArgBlock();

    // macro
    var floortomBlock = new ProtoBlock('floortom');
    floortomBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['floortom'] = floortomBlock;
    floortomBlock.staticLabels.push(_('floor tom tom'));
    floortomBlock.adjustWidthToLabel();
    floortomBlock.oneArgBlock();

    // macro
    var tomBlock = new ProtoBlock('tom');
    tomBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['tom'] = tomBlock;
    tomBlock.staticLabels.push(_('tom tom'));
    tomBlock.adjustWidthToLabel();
    tomBlock.oneArgBlock();

    // macro
    var kickBlock = new ProtoBlock('kick');
    kickBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['kick'] = kickBlock;
    kickBlock.staticLabels.push(_('kick drum'));
    kickBlock.adjustWidthToLabel();
    kickBlock.oneArgBlock();

    // macro
    var snareBlock = new ProtoBlock('snare');
    snareBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['snare'] = snareBlock;
    snareBlock.staticLabels.push(_('snare drum'));
    snareBlock.adjustWidthToLabel();
    snareBlock.oneArgBlock();

    // macro
    var setdrumBlock = new ProtoBlock('setdrum');
    setdrumBlock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['setdrum'] = setdrumBlock;
    //.TRANS: set the current drum sound for playback
    setdrumBlock.staticLabels.push(_('set drum'));
    setdrumBlock.adjustWidthToLabel();
    setdrumBlock.flowClampOneArgBlock();
    setdrumBlock.dockTypes[1] = 'anyin';

    // macro
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
    //.TRANS: orientation or compass direction
    blocks.protoBlockDict['heading'] = headingBlock;
    headingBlock.staticLabels.push(_('heading'));
    headingBlock.adjustWidthToLabel();
    headingBlock.parameterBlock();

    var yBlock = new ProtoBlock('y');
    yBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['y'] = yBlock;
    //.TRANS: y coordinate
    yBlock.staticLabels.push(_('y'));
    yBlock.adjustWidthToLabel();
    yBlock.parameterBlock();

    var xBlock = new ProtoBlock('x');
    xBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['x'] = xBlock;
    //.TRANS: x coordinate
    xBlock.staticLabels.push(_('x'));
    xBlock.adjustWidthToLabel();
    xBlock.parameterBlock();

    var clearBlock = new ProtoBlock('clear');
    clearBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['clear'] = clearBlock;
    //.TRANS: erase the screen and return the mice to the center position
    clearBlock.staticLabels.push(_('clear'));
    clearBlock.adjustWidthToLabel();
    clearBlock.zeroArgBlock();

    var controlPoint2Block = new ProtoBlock('controlpoint2');
    controlPoint2Block.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['controlpoint2'] = controlPoint2Block;
    //.TRANS: control point in a bezier curve
    controlPoint2Block.staticLabels.push(_('control point 2'))
    controlPoint2Block.staticLabels.push(_('x'), _('y'));
    controlPoint2Block.adjustWidthToLabel();
    controlPoint2Block.twoArgBlock();
    controlPoint2Block.defaults.push(100);
    controlPoint2Block.defaults.push(25);
    controlPoint2Block.dockTypes[1] = 'numberin';
    controlPoint2Block.dockTypes[2] = 'numberin';

    var controlPoint1Block = new ProtoBlock('controlpoint1');
    controlPoint1Block.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['controlpoint1'] = controlPoint1Block;
    //.TRANS: control point in a Bezier curve
    controlPoint1Block.staticLabels.push(_('control point 1'));
    controlPoint1Block.staticLabels.push(_('x'), _('y'));
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
    bezierBlock.staticLabels.push(_('bezier'));
    bezierBlock.staticLabels.push(_('x'), _('y'));
    bezierBlock.adjustWidthToLabel();
    bezierBlock.twoArgBlock();
    bezierBlock.defaults.push(0);
    bezierBlock.defaults.push(100);
    bezierBlock.dockTypes[1] = 'numberin';
    bezierBlock.dockTypes[2] = 'numberin';

    var arcBlock = new ProtoBlock('arc');
    arcBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['arc'] = arcBlock;
    //.TRANS: draws a part of the circumference of a circle
    arcBlock.staticLabels.push(_('arc'));
    arcBlock.staticLabels.push(_('angle'), _('radius'));
    arcBlock.adjustWidthToLabel();
    arcBlock.twoArgBlock();
    arcBlock.defaults.push(90);
    arcBlock.defaults.push(100);
    arcBlock.dockTypes[1] = 'numberin';

    var setheadingBlock = new ProtoBlock('setheading');
    setheadingBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['setheading'] = setheadingBlock;
    //.TRANS: set compass heading
    setheadingBlock.staticLabels.push(_('set heading'));
    setheadingBlock.adjustWidthToLabel();
    setheadingBlock.oneArgBlock();
    setheadingBlock.defaults.push(0);

    var setxyBlock = new ProtoBlock('setxy');
    setxyBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['setxy'] = setxyBlock;
    //.TRANS: set xy position
    setxyBlock.staticLabels.push(_('set xy'));
    setxyBlock.staticLabels.push(_('x'), _('y'));
    setxyBlock.adjustWidthToLabel();
    setxyBlock.twoArgBlock();
    setxyBlock.defaults.push(0);
    setxyBlock.defaults.push(0);
    setxyBlock.dockTypes[1] = 'numberin';

    var rightBlock = new ProtoBlock('right');
    rightBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['right'] = rightBlock;
    //.TRANS: turn right (clockwise)
    rightBlock.staticLabels.push(_('right'));
    rightBlock.adjustWidthToLabel();
    rightBlock.oneArgBlock();
    rightBlock.defaults.push(90);

    var leftBlock = new ProtoBlock('left');
    leftBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['left'] = leftBlock;
    //.TRANS: turn left (counter-clockwise)
    leftBlock.staticLabels.push(_('left'));
    leftBlock.adjustWidthToLabel();
    leftBlock.oneArgBlock();
    leftBlock.defaults.push(90);

    var backBlock = new ProtoBlock('back');
    backBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['back'] = backBlock;
    //.TRANS: move backward (in the opposite direction of the current heading)
    backBlock.staticLabels.push(_('back'));
    backBlock.adjustWidthToLabel();
    backBlock.oneArgBlock();
    backBlock.defaults.push(100);

    var forwardBlock = new ProtoBlock('forward');
    forwardBlock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['forward'] = forwardBlock;
    //.TRANS: move forward (in the same direction of the current heading)
    forwardBlock.staticLabels.push(_('forward'));
    forwardBlock.adjustWidthToLabel();
    forwardBlock.oneArgBlock();
    forwardBlock.defaults.push(100);

    // PEN PALETTE

    // macro
    var purpleBlock = new ProtoBlock('purple');
    purpleBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['purple'] = purpleBlock;
    purpleBlock.staticLabels.push(_('purple'));
    purpleBlock.zeroArgBlock();

    // macro
    var blueBlock = new ProtoBlock('blue');
    blueBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['blue'] = blueBlock;
    blueBlock.staticLabels.push(_('blue'));
    blueBlock.zeroArgBlock();

    // macro
    var greenBlock = new ProtoBlock('green');
    greenBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['green'] = greenBlock;
    greenBlock.staticLabels.push(_('green'));
    greenBlock.zeroArgBlock();

    // macro
    var yellowBlock = new ProtoBlock('yellow');
    yellowBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['yellow'] = yellowBlock;
    yellowBlock.staticLabels.push(_('yellow'));
    yellowBlock.zeroArgBlock();

    // macro
    var orangeBlock = new ProtoBlock('orange');
    orangeBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['orange'] = orangeBlock;
    orangeBlock.staticLabels.push(_('orange'));
    orangeBlock.zeroArgBlock();

    // macro
    var redBlock = new ProtoBlock('red');
    redBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['red'] = redBlock;
    redBlock.staticLabels.push(_('red'));
    redBlock.zeroArgBlock();

    // macro
    var whiteBlock = new ProtoBlock('white');
    whiteBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['white'] = whiteBlock;
    whiteBlock.staticLabels.push(_('white'));
    whiteBlock.zeroArgBlock();

    // macro
    var blackBlock = new ProtoBlock('black');
    blackBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['black'] = blackBlock;
    blackBlock.staticLabels.push(_('black'));
    blackBlock.zeroArgBlock();

    var beginFillBlock = new ProtoBlock('beginfill');
    beginFillBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['beginfill'] = beginFillBlock;
    beginFillBlock.hidden = true;
    beginFillBlock.staticLabels.push(_('begin fill'));
    beginFillBlock.adjustWidthToLabel();
    beginFillBlock.zeroArgBlock();

    var endFillBlock = new ProtoBlock('endfill');
    endFillBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['endfill'] = endFillBlock;
    endFillBlock.hidden = true;
    endFillBlock.staticLabels.push(_('end fill'));
    endFillBlock.adjustWidthToLabel();
    endFillBlock.zeroArgBlock();

    var fillscreenBlock = new ProtoBlock('fillscreen');
    fillscreenBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['fillscreen'] = fillscreenBlock;
    fillscreenBlock.hidden = true;
    //.TRANS: set the background color
    fillscreenBlock.staticLabels.push(_('background'));
    fillscreenBlock.adjustWidthToLabel();
    fillscreenBlock.threeArgBlock();

    var chromaBlock = new ProtoBlock('grey');
    chromaBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['grey'] = chromaBlock;
    chromaBlock.staticLabels.push(_('grey'));
    chromaBlock.adjustWidthToLabel();
    chromaBlock.parameterBlock();

    var shadeBlock = new ProtoBlock('shade');
    shadeBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['shade'] = shadeBlock;
    shadeBlock.staticLabels.push(_('shade'));
    shadeBlock.adjustWidthToLabel();
    shadeBlock.parameterBlock();

    var colorBlock = new ProtoBlock('color');
    colorBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['color'] = colorBlock;
    colorBlock.staticLabels.push(_('color'));
    colorBlock.adjustWidthToLabel();
    colorBlock.parameterBlock();

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

    // macro
    var hollowBlock = new ProtoBlock('hollowline');
    hollowBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['hollowline'] = hollowBlock;
    //.TRANS: draw a line that has a hollow space down its center
    hollowBlock.staticLabels.push(_('hollow line'));
    hollowBlock.adjustWidthToLabel();
    hollowBlock.flowClampZeroArgBlock();

    // macro
    var fillBlock = new ProtoBlock('fill');
    fillBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['fill'] = fillBlock;
    //.TRANS: fill in as a solid color
    fillBlock.staticLabels.push(_('fill'));
    fillBlock.adjustWidthToLabel();
    fillBlock.flowClampZeroArgBlock();

    var penupBlock = new ProtoBlock('penup');
    penupBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['penup'] = penupBlock;
    //.TRANS: riase up the pen so that it does not draw when it is moved
    penupBlock.staticLabels.push(_('pen up'));
    penupBlock.adjustWidthToLabel();
    penupBlock.zeroArgBlock();

    var pendownBlock = new ProtoBlock('pendown');
    pendownBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['pendown'] = pendownBlock;
    //.TRANS: put down the pen so that it draws when it is moved
    pendownBlock.staticLabels.push(_('pen down'));
    pendownBlock.adjustWidthToLabel();
    pendownBlock.zeroArgBlock();

    var setpensizeBlock = new ProtoBlock('setpensize');
    setpensizeBlock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setpensize'] = setpensizeBlock;
    //.TRANS: set the width of the line drawn by the pen
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

    var notBlock = new ProtoBlock('not');
    notBlock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['not'] = notBlock;
    notBlock.extraWidth = 30;
    notBlock.staticLabels.push(_('not'));
    notBlock.booleanOneBooleanArgBlock();

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

    var greaterBlock = new ProtoBlock('greater');
    greaterBlock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['greater'] = greaterBlock;
    greaterBlock.fontsize = 14;
    greaterBlock.staticLabels.push('>');
    greaterBlock.extraWidth = 20;
    greaterBlock.booleanTwoArgBlock();

    var lessBlock = new ProtoBlock('less');
    lessBlock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['less'] = lessBlock;
    lessBlock.fontsize = 14;
    lessBlock.staticLabels.push('<');
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

    var trueFalseBlock = new ProtoBlock('boolean');
    trueFalseBlock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['boolean'] = trueFalseBlock;
    trueFalseBlock.booleanZeroArgBlock();

    // Only used to excute methods in the Math library
    /*
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
    evalBlock.hidden = true;  // security hole
    evalBlock.defaults.push(-100);
    */

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
    multiplyBlock.dockTypes[1] = 'anyin';
    multiplyBlock.dockTypes[2] = 'anyin';
    multiplyBlock.defaults.push(1, 12)

    var negBlock = new ProtoBlock('neg');
    negBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['neg'] = negBlock;
    negBlock.fontsize = 14;
    negBlock.staticLabels.push('–');
    negBlock.oneArgMathBlock();
    negBlock.dockTypes[0] = 'anyout';
    negBlock.dockTypes[1] = 'anyin';

    var minusBlock = new ProtoBlock('minus');
    minusBlock.palette = palettes.dict['number'];
    blocks.protoBlockDict['minus'] = minusBlock;
    minusBlock.fontsize = 14;
    minusBlock.staticLabels.push('–');
    minusBlock.twoArgMathBlock();
    minusBlock.dockTypes[1] = 'anyin';
    minusBlock.dockTypes[2] = 'anyin';
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

    // macro
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
    //.TRANS: a container into which to put something
    boxBlock.staticLabels.push(_('box'));
    boxBlock.extraWidth = 10;
    boxBlock.adjustWidthToLabel();
    boxBlock.oneArgMathBlock();
    boxBlock.defaults.push(_('box'));
    boxBlock.dockTypes[0] = 'anyout';
    // Show the value in the box as if it were a parameter.
    boxBlock.parameter = true;
    boxBlock.dockTypes[1] = 'anyin';

    var namedBoxBlock = new ProtoBlock('namedbox');
    namedBoxBlock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['namedbox'] = namedBoxBlock;
    namedBoxBlock.staticLabels.push(_('box'));
    namedBoxBlock.extraWidth = 20;
    namedBoxBlock.adjustWidthToLabel();
    namedBoxBlock.parameterBlock();
    namedBoxBlock.dockTypes[0] = 'anyout';

    var storein2Block = new ProtoBlock('storein2');
    storein2Block.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['storein2'] = storein2Block;
    storein2Block.staticLabels.push(_('store in box'));
    storein2Block.adjustWidthToLabel();
    storein2Block.oneArgBlock();
    storein2Block.defaults.push(4);
    storein2Block.dockTypes[1] = 'anyin';

    var storeinBlock = new ProtoBlock('storein');
    storeinBlock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['storein'] = storeinBlock;
    //.TRANS: put something into a container for later reference
    storeinBlock.staticLabels.push(_('store in'));
    storeinBlock.staticLabels.push(_('name'), _('value'));
    storeinBlock.adjustWidthToLabel();
    storeinBlock.twoArgBlock();
    storeinBlock.defaults.push(_('box'));
    storeinBlock.defaults.push(4);
    storeinBlock.dockTypes[1] = 'anyin';
    storeinBlock.dockTypes[2] = 'anyin';

    // ACTIONS PALETTE

    var doBlock = new ProtoBlock('do');
    doBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['do'] = doBlock;
    doBlock.staticLabels.push(_('do'));
    doBlock.adjustWidthToLabel();
    doBlock.oneArgBlock();
    //.TRANS: a stack of blocks to run (an action to take)
    doBlock.defaults.push(_('action'));
    doBlock.dockTypes[1] = 'anyin';

    var returnBlock = new ProtoBlock('return');
    returnBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['return'] = returnBlock;
    //.TRANS: return value from a function
    returnBlock.staticLabels.push(_('return'));
    returnBlock.extraWidth = 10;
    returnBlock.adjustWidthToLabel();
    returnBlock.oneArgBlock();
    returnBlock.defaults.push(100);
    returnBlock.dockTypes[1] = 'anyin';

    var returnToUrlBlock = new ProtoBlock('returnToUrl');
    returnToUrlBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['returnToUrl'] = returnToUrlBlock;
    //.TRANS: return value from a function to a URL
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
    //.TRANS: take (do) some action
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
    listenBlock.staticLabels.push(_('on'));
    listenBlock.staticLabels.push(_('event'), _('do'));
    listenBlock.adjustWidthToLabel();
    listenBlock.twoArgBlock();
    //.TRANS: a condition that is broadcast in order to trigger a listener to take an action
    listenBlock.defaults.push(_('event'));
    listenBlock.defaults.push(_('action'));
    listenBlock.dockTypes[1] = 'textin';
    listenBlock.dockTypes[2] = 'textin';

    var dispatchBlock = new ProtoBlock('dispatch');
    dispatchBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['dispatch'] = dispatchBlock;
    //.TRANS: dispatch an event to trigger a listener
    dispatchBlock.staticLabels.push(_('broadcast'));
    dispatchBlock.adjustWidthToLabel();
    dispatchBlock.oneArgBlock();
    dispatchBlock.defaults.push(_('event'));
    dispatchBlock.dockTypes[1] = 'textin';

    // macro
    var drum2Block = new ProtoBlock('startdrum');
    drum2Block.palette = palettes.dict['action'];
    blocks.protoBlockDict['startdrum'] = drum2Block;
    //.TRANS: start block with an embedded set drum block
    drum2Block.staticLabels.push(_('start drum'));
    drum2Block.extraWidth = 10;
    drum2Block.adjustWidthToLabel();
    drum2Block.stackClampZeroArgBlock();

    // Deprecated
    var drumBlock = new ProtoBlock('drum');
    drumBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['drum'] = drumBlock;
    drumBlock.staticLabels.push(_('start drum'));
    drumBlock.extraWidth = 10;
    drumBlock.adjustWidthToLabel();
    drumBlock.stackClampZeroArgBlock();
    drumBlock.hidden = true;

    var startBlock = new ProtoBlock('start');
    startBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['start'] = startBlock;
    startBlock.staticLabels.push(_('start'));
    startBlock.extraWidth = 40;
    startBlock.adjustWidthToLabel();
    startBlock.stackClampZeroArgBlock();

    var actionBlock = new ProtoBlock('action');
    actionBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['action'] = actionBlock;
    actionBlock.staticLabels.push(_('action'));
    actionBlock.extraWidth = 42;
    actionBlock.adjustWidthToLabel();
    actionBlock.stackClampOneArgBlock();
    actionBlock.defaults.push(_('action'));

    var namedDoBlock = new ProtoBlock('nameddo');
    namedDoBlock.palette = palettes.dict['action'];
    blocks.protoBlockDict['nameddo'] = namedDoBlock;
    namedDoBlock.hidden = true;
    namedDoBlock.staticLabels.push(_('action'));
    namedDoBlock.extraWidth = 40;
    namedDoBlock.adjustWidthToLabel();
    namedDoBlock.zeroArgBlock();

    // HEAP PALETTE

    var loadHeapFromApp = new ProtoBlock('loadHeapFromApp');
    loadHeapFromApp.palette = palettes.dict['heap'];
    blocks.protoBlockDict['loadHeapFromApp'] = loadHeapFromApp;
    //.TRANS: load the heap contents from a URL
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
    //.TRANS: save the heap contents to a URL
    saveHeapToApp.staticLabels.push(_('save heap to App'));
    saveHeapToApp.adjustWidthToLabel();
    saveHeapToApp.twoArgBlock();
    saveHeapToApp.dockTypes[1] = 'textin';
    saveHeapToApp.dockTypes[2] = 'textin';
    saveHeapToApp.defaults.push('appName')
    saveHeapToApp.defaults.push('localhost');

    var showHeap = new ProtoBlock('showHeap');
    showHeap.palette = palettes.dict['heap'];
    blocks.protoBlockDict['showHeap'] = showHeap;
    //.TRANS: Display the heap contents
    showHeap.staticLabels.push(_('show heap'));
    showHeap.adjustWidthToLabel();
    showHeap.zeroArgBlock();

    var heapLength = new ProtoBlock('heapLength');
    heapLength.palette = palettes.dict['heap'];
    blocks.protoBlockDict['heapLength'] = heapLength;
    //.TRANS: How many entries are in the heap?
    heapLength.staticLabels.push(_('heap length'));
    heapLength.adjustWidthToLabel();
    heapLength.parameterBlock();
    heapLength.dockTypes[0] = 'numberout';

    var heapEmpty = new ProtoBlock('heapEmpty');
    heapEmpty.palette = palettes.dict['heap'];
    blocks.protoBlockDict['heapEmpty'] = heapEmpty;
    //.TRANS: Is the heap empty?
    heapEmpty.staticLabels.push(_('heap empty?'));
    heapEmpty.adjustWidthToLabel();
    heapEmpty.booleanZeroArgBlock();

    var emptyHeap = new ProtoBlock('emptyHeap');
    emptyHeap.palette = palettes.dict['heap'];
    blocks.protoBlockDict['emptyHeap'] = emptyHeap;
    //.TRANS: empty the heap
    emptyHeap.staticLabels.push(_('empty heap'));
    emptyHeap.adjustWidthToLabel();
    emptyHeap.zeroArgBlock();

    var saveHeap = new ProtoBlock('saveHeap');
    saveHeap.palette = palettes.dict['heap'];
    blocks.protoBlockDict['saveHeap'] = saveHeap;
    //.TRANS: save the heap to a file
    saveHeap.staticLabels.push(_('save heap'));
    saveHeap.adjustWidthToLabel();
    saveHeap.oneArgBlock();
    saveHeap.defaults.push('heap.json');
    saveHeap.dockTypes[1] = 'textin';

    var loadHeap = new ProtoBlock('loadHeap');
    loadHeap.palette = palettes.dict['heap'];
    blocks.protoBlockDict['loadHeap'] = loadHeap;
    //.TRANS: load the heap from a file
    loadHeap.staticLabels.push(_('load heap'));
    loadHeap.adjustWidthToLabel();
    loadHeap.oneArgBlock();
    loadHeap.dockTypes[1] = 'filein';
    loadHeap.defaults = [[null, null]];

    var reverseHeap = new ProtoBlock('reverseHeap');
    reverseHeap.palette = palettes.dict['heap'];
    //.TRANS: reverse the order of the heap
    blocks.protoBlockDict['reverseHeap'] = reverseHeap;
    reverseHeap.staticLabels.push(_('reverse heap'));
    reverseHeap.adjustWidthToLabel();
    reverseHeap.zeroArgBlock();

    var indexHeap = new ProtoBlock('indexHeap');
    indexHeap.palette = palettes.dict['heap'];
    blocks.protoBlockDict['indexHeap'] = indexHeap;
    //.TRANS: retrieve a value from the heap at index position in the heap
    indexHeap.staticLabels.push(_('index heap'));
    indexHeap.adjustWidthToLabel();
    indexHeap.oneArgMathBlock();
    indexHeap.dockTypes[1] = 'numberin';
    indexHeap.defaults.push(1);

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

    var popBlk = new ProtoBlock('pop');
    popBlk.palette = palettes.dict['heap'];
    blocks.protoBlockDict['pop'] = popBlk;
    //.TRANS: pop a value off the top of the heap
    popBlk.staticLabels.push(_('pop'));
    popBlk.adjustWidthToLabel();
    popBlk.parameterBlock();

    var pushBlk = new ProtoBlock('push');
    pushBlk.palette = palettes.dict['heap'];
    blocks.protoBlockDict['push'] = pushBlk;
    //.TRANS: push a value onto the top of the heap
    pushBlk.staticLabels.push(_('push'));
    pushBlk.adjustWidthToLabel();
    pushBlk.oneArgBlock();
    pushBlk.dockTypes[1] = 'anyin';

    // MEDIA PALETTE

    var rightposBlock = new ProtoBlock('rightpos');
    rightposBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['rightpos'] = rightposBlock;
    rightposBlock.staticLabels.push(_('right'));
    rightposBlock.adjustWidthToLabel();
    rightposBlock.parameterBlock();

    var leftposBlock = new ProtoBlock('leftpos');
    leftposBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['leftpos'] = leftposBlock;
    leftposBlock.staticLabels.push(_('left'));
    leftposBlock.adjustWidthToLabel();
    leftposBlock.parameterBlock();

    var topposBlock = new ProtoBlock('toppos');
    topposBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['toppos'] = topposBlock;
    topposBlock.staticLabels.push(_('top'));
    topposBlock.adjustWidthToLabel();
    topposBlock.parameterBlock();

    var bottomposBlock = new ProtoBlock('bottompos');
    bottomposBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['bottompos'] = bottomposBlock;
    bottomposBlock.staticLabels.push(_('bottom'));
    bottomposBlock.adjustWidthToLabel();
    bottomposBlock.parameterBlock();

    var widthBlock = new ProtoBlock('width');
    widthBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['width'] = widthBlock;
    widthBlock.staticLabels.push(_('width'));
    widthBlock.adjustWidthToLabel();
    widthBlock.parameterBlock();

    var heightBlock = new ProtoBlock('height');
    heightBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['height'] = heightBlock;
    heightBlock.staticLabels.push(_('height'));
    heightBlock.adjustWidthToLabel();
    heightBlock.parameterBlock();

    var audioStopBlock = new ProtoBlock('stopplayback');
    audioStopBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['stopplayback'] = audioStopBlock;
    //.TRANS: stops playback of an audio recording
    audioStopBlock.staticLabels.push(_('stop play'));
    audioStopBlock.adjustWidthToLabel();
    audioStopBlock.zeroArgBlock();

    var audioBlock = new ProtoBlock('playback');
    audioBlock.palette = palettes.dict['media'];
    blocks.protoBlockDict['playback'] = audioBlock;
    audioBlock.defaults.push(null);
    //.TRANS: play an audio recording
    audioBlock.staticLabels.push(_('play back'));
    audioBlock.adjustWidthToLabel();
    audioBlock.oneArgBlock();
    audioBlock.dockTypes[1] = 'mediain';

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
    toneBlock.staticLabels.push(_('hertz'),  _('frequency'), _('duration (ms)'));
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
    toFrequencyBlock.defaults.push(4);
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
    textBlock.extraWidth = 30;
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
    //.TRANS: the default case used in a switch statement in programming
    defaultBlock.staticLabels.push(_('default'));
    defaultBlock.adjustWidthToLabel();
    defaultBlock.flowClampBlock();

    var caseBlock = new ProtoBlock('case');
    caseBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['case'] = caseBlock;
    //.TRANS: the case statement used in a switch statement in programming
    caseBlock.staticLabels.push(_('case'));
    caseBlock.adjustWidthToLabel();
    caseBlock.flowClampOneArgBlock();
    caseBlock.dockTypes[1] = 'anyin';

    var switchBlock = new ProtoBlock('switch');
    switchBlock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['switch'] = switchBlock;
    //.TRANS: the switch statement used in programming
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

    var openPaletteBlock = new ProtoBlock('openpalette');
    openPaletteBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['openpalette'] = openPaletteBlock;
    //.TRANS: Open a palette of blocks.
    openPaletteBlock.staticLabels.push(_('open palette'));
    openPaletteBlock.adjustWidthToLabel();
    openPaletteBlock.oneArgBlock();
    openPaletteBlock.dockTypes[1] = 'textin';
    openPaletteBlock.defaults.push(_('Rhythm'));

    var deleteBlock = new ProtoBlock('deleteblock');
    deleteBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['deleteblock'] = deleteBlock;
    //.TRANS: Move this block to the trash.
    deleteBlock.staticLabels.push(_('delete block'));
    deleteBlock.adjustWidthToLabel();
    deleteBlock.oneArgBlock();
    deleteBlock.dockTypes[1] = 'numberin';

    var moveBlock = new ProtoBlock('moveblock');
    moveBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['moveblock'] = moveBlock;
    //.TRANS: Move the position of a block on the screen.
    moveBlock.staticLabels.push(_('move block'), _('block number'), _('x'), _('y'));
    moveBlock.adjustWidthToLabel();
    moveBlock.threeArgBlock();
    moveBlock.dockTypes[1] = 'numberin';
    moveBlock.dockTypes[2] = 'numberin';
    moveBlock.dockTypes[3] = 'numberin';

    var runBlock = new ProtoBlock('runblock');
    runBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['runblock'] = runBlock;
    //.TRANS: Run program beginning at this block.
    runBlock.staticLabels.push(_('run block'));
    runBlock.adjustWidthToLabel();
    runBlock.oneArgBlock();
    runBlock.dockTypes[1] = 'numberin';

    var dockBlock = new ProtoBlock('dockblock');
    dockBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['dockblock'] = dockBlock;
    //.TRANS: We can connect a block to another block.
    dockBlock.staticLabels.push(_('connect blocks'), _('target block'), _('connection number'), _('block number'));
    dockBlock.adjustWidthToLabel();
    dockBlock.threeArgBlock();
    dockBlock.dockTypes[1] = 'numberin';
    dockBlock.dockTypes[2] = 'numberin';
    dockBlock.dockTypes[3] = 'numberin';

    var makeBlock = new ProtoBlock('makeblock');
    makeBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['makeblock'] = makeBlock;
    //.TRANS: Create a new block programmatically.
    makeBlock.staticLabels.push(_('make block'));
    makeBlock.adjustWidthToLabel();
    makeBlock.argClampOneArgMathBlock();
    makeBlock.defaults.push(_('note'));
    makeBlock.dockTypes[0] = 'anyout';
    makeBlock.dockTypes[1] = 'anyin';
    makeBlock.dockTypes[2] = 'anyin';

    // deprecated in favor of save button
    var abcBlock = new ProtoBlock('saveabc');
    abcBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['saveabc'] = abcBlock;
    abcBlock.staticLabels.push(_('save as ABC'));
    abcBlock.adjustWidthToLabel();
    abcBlock.oneArgBlock();
    abcBlock.defaults.push(_('title') + '.abc');
    abcBlock.dockTypes[1] = 'textin';
    abcBlock.hidden = true;

    // deprecated in favor of save button
    var lilypondBlock = new ProtoBlock('savelilypond');
    lilypondBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['savelilypond'] = lilypondBlock;
    lilypondBlock.staticLabels.push(_('save as lilypond'));
    lilypondBlock.adjustWidthToLabel();
    lilypondBlock.oneArgBlock();
    lilypondBlock.defaults.push(_('title') + '.ly');
    lilypondBlock.dockTypes[1] = 'textin';
    lilypondBlock.hidden = true;

    // deprecated in favor of save button
    var svgBlock = new ProtoBlock('savesvg');
    svgBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['savesvg'] = svgBlock;
    svgBlock.staticLabels.push(_('save svg'));
    svgBlock.adjustWidthToLabel();
    svgBlock.oneArgBlock();
    svgBlock.defaults.push(_('title') + '.svg');
    svgBlock.dockTypes[1] = 'textin';
    svgBlock.hidden = true;

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

    var commentBlock = new ProtoBlock('comment');
    commentBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['comment'] = commentBlock;
    commentBlock.staticLabels.push(_('comment'));
    commentBlock.adjustWidthToLabel();
    commentBlock.oneArgBlock();
    commentBlock.dockTypes[1] = 'anyin';
    commentBlock.defaults.push(_('Music Blocks'));

    var printBlock = new ProtoBlock('print');
    printBlock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['print'] = printBlock;
    printBlock.staticLabels.push(_('print'));
    printBlock.adjustWidthToLabel();
    printBlock.oneArgBlock();
    printBlock.dockTypes[1] = 'anyin';
    printBlock.defaults.push(_('Music Blocks'));

    // SENSORS PALETTE

    var pitchnessBlock = new ProtoBlock('pitchness');
    pitchnessBlock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['pitchness'] = pitchnessBlock;
    pitchnessBlock.staticLabels.push(_('pitch'));
    pitchnessBlock.adjustWidthToLabel();
    pitchnessBlock.parameterBlock();
    // pitchnessBlock.hidden = true;

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

    // Mice palette (blocks for interacting between mice)

    var stopTurtleBlock = new ProtoBlock('stopTurtle');
    stopTurtleBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['stopTurtle'] = stopTurtleBlock;
    stopTurtleBlock.staticLabels.push(_('stop mouse'));
    stopTurtleBlock.adjustWidthToLabel();
    stopTurtleBlock.oneArgBlock();
    stopTurtleBlock.dockTypes[1] = 'anyin';
    stopTurtleBlock.defaults.push(_('Mr. Mouse'));

    var startTurtleBlock = new ProtoBlock('startTurtle');
    startTurtleBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['startTurtle'] = startTurtleBlock;
    startTurtleBlock.staticLabels.push(_('start mouse'));
    startTurtleBlock.adjustWidthToLabel();
    startTurtleBlock.oneArgBlock();
    startTurtleBlock.dockTypes[1] = 'anyin';
    startTurtleBlock.defaults.push(_('Mr. Mouse'));

    var turtlecolorBlock = new ProtoBlock('turtlecolor');
    turtlecolorBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlecolor'] = turtlecolorBlock;
    //.TRANS: pen color for this mouse
    turtlecolorBlock.staticLabels.push(_('mouse color'));
    turtlecolorBlock.adjustWidthToLabel();
    turtlecolorBlock.oneArgMathBlock();;
    turtlecolorBlock.dockTypes[1] = 'anyin';
    turtlecolorBlock.defaults.push(_('Mr. Mouse'));

    var turtleheadingBlock = new ProtoBlock('turtleheading');
    turtleheadingBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtleheading'] = turtleheadingBlock;
    //.TRANS: heading (compass direction) for this mouse
    turtleheadingBlock.staticLabels.push(_('mouse heading'));
    turtleheadingBlock.oneArgMathBlock();;
    turtleheadingBlock.adjustWidthToLabel();
    turtleheadingBlock.dockTypes[1] = 'anyin';
    turtleheadingBlock.defaults.push(_('Mr. Mouse'));

    var setTurtleXYBlock = new ProtoBlock('setxyturtle');
    setTurtleXYBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['setxyturtle'] = setTurtleXYBlock;
    //.TRANS: set xy position for this mouse
    setTurtleXYBlock.staticLabels.push(_('set mouse'), _('name'), _('x'), _('y'));
    setTurtleXYBlock.threeArgBlock();
    setTurtleXYBlock.adjustWidthToLabel();
    setTurtleXYBlock.dockTypes[1] = 'anyin';
    setTurtleXYBlock.dockTypes[2] = 'numberin';
    setTurtleXYBlock.dockTypes[3] = 'numberin';
    setTurtleXYBlock.defaults.push(_('Mr. Mouse'), 0, 0);
    setTurtleXYBlock.hidden = true;

    var setTurtleBlock = new ProtoBlock('setturtle');
    setTurtleBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['setturtle'] = setTurtleBlock;
    setTurtleBlock.staticLabels.push(_('set mouse'));
    setTurtleBlock.adjustWidthToLabel();
    setTurtleBlock.flowClampOneArgBlock();
    setTurtleBlock.dockTypes[1] = 'anyin';
    setTurtleBlock.defaults.push(_('Mr. Mouse'));

    var turtleyBlock = new ProtoBlock('yturtle');
    turtleyBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['yturtle'] = turtleyBlock;
    //.TRANS: y position for this mouse
    turtleyBlock.staticLabels.push(_('mouse y'));
    turtleyBlock.oneArgMathBlock();
    turtleyBlock.adjustWidthToLabel();
    turtleyBlock.dockTypes[1] = 'anyin';
    turtleyBlock.defaults.push(_('Mr. Mouse'));

    var turtlexBlock = new ProtoBlock('xturtle');
    turtlexBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['xturtle'] = turtlexBlock;
    //.TRANS: x position for this mouse
    turtlexBlock.staticLabels.push(_('mouse x'));
    turtlexBlock.oneArgMathBlock();
    turtlexBlock.adjustWidthToLabel();
    turtlexBlock.dockTypes[1] = 'anyin';
    turtlexBlock.defaults.push(_('Mr. Mouse'));

    var turtleElapsedNotes = new ProtoBlock('turtleelapsednotes');
    turtleElapsedNotes.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtleelapsednotes'] = turtleElapsedNotes;
    //.TRANS: notes played by this mouse
    turtleElapsedNotes.staticLabels.push(_('mouse notes played'));
    turtleElapsedNotes.oneArgMathBlock();
    turtleElapsedNotes.adjustWidthToLabel();
    turtleElapsedNotes.dockTypes[1] = 'anyin';
    turtleElapsedNotes.defaults.push(_('Mr. Mouse'));

    var turtlePitchBlock = new ProtoBlock('turtlepitch');
    turtlePitchBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlepitch'] = turtlePitchBlock;
    //.TRANS: convert current note for this turtle to piano key (1-88)
    turtlePitchBlock.staticLabels.push(_('mouse pitch number'));
    turtlePitchBlock.oneArgMathBlock();
    turtlePitchBlock.adjustWidthToLabel();
    turtlePitchBlock.dockTypes[1] = 'anyin';
    turtlePitchBlock.defaults.push(_('Mr. Mouse'));

    var turtleNoteBlock = new ProtoBlock('turtlenote');
    turtleNoteBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlenote'] = turtleNoteBlock;
    turtleNoteBlock.staticLabels.push(_('mouse note value'));
    turtleNoteBlock.oneArgMathBlock();
    turtleNoteBlock.adjustWidthToLabel();
    turtleNoteBlock.dockTypes[1] = 'anyin';
    turtleNoteBlock.hidden = true;
    turtleNoteBlock.defaults.push(_('Mr. Mouse'));

    var turtleNoteBlock2 = new ProtoBlock('turtlenote2');
    turtleNoteBlock2.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlenote2'] = turtleNoteBlock2;
    turtleNoteBlock2.staticLabels.push(_('mouse note value'));
    turtleNoteBlock2.oneArgMathBlock();
    turtleNoteBlock2.adjustWidthToLabel();
    turtleNoteBlock2.dockTypes[1] = 'anyin';
    turtleNoteBlock2.defaults.push(_('Mr. Mouse'));

    var turtleSyncBlock = new ProtoBlock('turtlesync');
    turtleSyncBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlesync'] = turtleSyncBlock;
    turtleSyncBlock.staticLabels.push(_('mouse sync'));
    turtleSyncBlock.oneArgBlock();
    turtleSyncBlock.adjustWidthToLabel();
    turtleSyncBlock.dockTypes[1] = 'anyin';
    turtleSyncBlock.defaults.push(_('Mr. Mouse'));

    var foundTurtleBlock = new ProtoBlock('foundturtle');
    foundTurtleBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['foundturtle'] = foundTurtleBlock;
    foundTurtleBlock.staticLabels.push(_('found mouse'));
    foundTurtleBlock.adjustWidthToLabel();
    foundTurtleBlock.extraWidth = 50;
    foundTurtleBlock.booleanOneArgBlock();
    foundTurtleBlock.dockTypes[1] = 'anyin';
    foundTurtleBlock.defaults.push(_('Mr. Mouse'));

    var newTurtle = new ProtoBlock('newturtle');
    newTurtle.palette = palettes.dict['mice'];
    blocks.protoBlockDict['newturtle'] = newTurtle;
    newTurtle.staticLabels.push(_('new mouse'));
    newTurtle.adjustWidthToLabel();
    newTurtle.oneArgBlock();
    newTurtle.dockTypes[1] = 'anyin';
    newTurtle.defaults.push(_('Mr. Mouse'));

    var turtleNameBlock = new ProtoBlock('turtlename');
    turtleNameBlock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlename'] = turtleNameBlock;
    turtleNameBlock.staticLabels.push(_('mouse name'));
    turtleNameBlock.adjustWidthToLabel();
    turtleNameBlock.parameterBlock();
    turtleNameBlock.dockTypes[0] = 'textout';

    var setTurtleName = new ProtoBlock('setturtlename');
    setTurtleName.palette = palettes.dict['mice'];
    blocks.protoBlockDict['setturtlename'] = setTurtleName;
    setTurtleName.staticLabels.push(_('set name'));
    setTurtleName.staticLabels.push(_('source'));
    setTurtleName.staticLabels.push(_('target'));
    setTurtleName.adjustWidthToLabel();
    setTurtleName.twoArgBlock();
    setTurtleName.dockTypes[1] = 'anyin';
    setTurtleName.dockTypes[2] = 'anyin';
    setTurtleName.defaults.push(-1);
    setTurtleName.defaults.push(_('Mr. Mouse'));
    setTurtleName.hidden = true;

    var setTurtleName2 = new ProtoBlock('setturtlename2');
    setTurtleName2.palette = palettes.dict['mice'];
    blocks.protoBlockDict['setturtlename2'] = setTurtleName2;
    setTurtleName2.staticLabels.push(_('set name'));
    setTurtleName2.adjustWidthToLabel();
    setTurtleName2.oneArgBlock();
    setTurtleName2.dockTypes[1] = 'anyin';
    setTurtleName2.defaults.push(_('Mr. Mouse'));

    // Volume palette
    var notevolumeFactor = new ProtoBlock('notevolumefactor');
    notevolumeFactor.palette = palettes.dict['volume'];
    blocks.protoBlockDict['notevolumefactor'] = notevolumeFactor;
    //.TRANS: the volume at which notes are played
    notevolumeFactor.staticLabels.push(_('master volume'));
    notevolumeFactor.adjustWidthToLabel();
    notevolumeFactor.parameterBlock();

    // macro
    var pppBlock = new ProtoBlock('ppp');
    pppBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['ppp'] = pppBlock;
    pppBlock.staticLabels.push('ppp');
    pppBlock.adjustWidthToLabel();
    pppBlock.zeroArgBlock();

    // macro
    var ppBlock = new ProtoBlock('pp');
    ppBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['pp'] = ppBlock;
    ppBlock.staticLabels.push('pp');
    ppBlock.adjustWidthToLabel();
    ppBlock.zeroArgBlock();

    // macro
    var pBlock = new ProtoBlock('p');
    pBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['p'] = pBlock;
    pBlock.staticLabels.push('p');
    pBlock.adjustWidthToLabel();
    pBlock.zeroArgBlock();

    // macro
    var mpBlock = new ProtoBlock('mp');
    mpBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['mp'] = mpBlock;
    mpBlock.staticLabels.push('mp');
    mpBlock.adjustWidthToLabel();
    mpBlock.zeroArgBlock();

    // macro
    var mfBlock = new ProtoBlock('mf');
    mfBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['mf'] = mfBlock;
    mfBlock.staticLabels.push('mf');
    mfBlock.adjustWidthToLabel();
    mfBlock.zeroArgBlock();

    // macro
    var fBlock = new ProtoBlock('f');
    fBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['f'] = fBlock;
    fBlock.staticLabels.push('f');
    fBlock.adjustWidthToLabel();
    fBlock.zeroArgBlock();

    // macro
    var ffBlock = new ProtoBlock('ff');
    ffBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['ff'] = ffBlock;
    ffBlock.staticLabels.push('ff');
    ffBlock.adjustWidthToLabel();
    ffBlock.zeroArgBlock();

    // macro
    var fffBlock = new ProtoBlock('fff');
    fffBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['fff'] = fffBlock;
    fffBlock.staticLabels.push('fff');
    fffBlock.adjustWidthToLabel();
    fffBlock.zeroArgBlock();

    var synthVolume2Block = new ProtoBlock('setsynthvolume2');
    synthVolume2Block.palette = palettes.dict['volume'];
    blocks.protoBlockDict['setsynthvolume2'] = synthVolume2Block;
    //.TRANS: a rapid, slight variation in pitch
    synthVolume2Block.staticLabels.push(_('set synth volume'), _('synth'), _('volume'));
    synthVolume2Block.adjustWidthToLabel();
    synthVolume2Block.flowClampTwoArgBlock();
    synthVolume2Block.dockTypes[1] = 'textin';
    synthVolume2Block.defaults.push('default');
    synthVolume2Block.defaults.push(50);
    synthVolume2Block.hidden = true;

    var synthVolumeBlock = new ProtoBlock('setsynthvolume');
    synthVolumeBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['setsynthvolume'] = synthVolumeBlock;
    //.TRANS: set the loudness level
    synthVolumeBlock.staticLabels.push(_('set synth volume'), _('synth'), _('volume'));
    synthVolumeBlock.adjustWidthToLabel();
    synthVolumeBlock.twoArgBlock();
    synthVolumeBlock.dockTypes[1] = 'textin';
    synthVolumeBlock.defaults.push('default');
    synthVolumeBlock.defaults.push(50);

    var noteVolumeBlock = new ProtoBlock('setnotevolume');
    noteVolumeBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['setnotevolume'] = noteVolumeBlock;
    //.TRANS: set the loudness level
    noteVolumeBlock.staticLabels.push(_('set master volume'));
    noteVolumeBlock.adjustWidthToLabel();
    noteVolumeBlock.oneArgBlock();
    noteVolumeBlock.defaults.push(50);

    var noteVolumeBlock2 = new ProtoBlock('setnotevolume2');
    noteVolumeBlock2.palette = palettes.dict['volume'];
    blocks.protoBlockDict['setnotevolume2'] = noteVolumeBlock2;
    //.TRANS: set the loudness level
    noteVolumeBlock2.staticLabels.push(_('set master volume'));
    noteVolumeBlock2.adjustWidthToLabel();
    noteVolumeBlock2.flowClampOneArgBlock();
    noteVolumeBlock2.defaults.push(50);
    noteVolumeBlock2.hidden = true;

    // macro
    var articulationBlock = new ProtoBlock('articulation');
    articulationBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['articulation'] = articulationBlock;
    //.TRANS: set an articulation (change in volume)
    articulationBlock.staticLabels.push(_('set relative volume'));
    articulationBlock.adjustWidthToLabel();
    articulationBlock.flowClampOneArgBlock();
    articulationBlock.defaults.push(25);

    // macro
    var crescendoBlock = new ProtoBlock('crescendo');
    crescendoBlock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['crescendo'] = crescendoBlock;
    //.TRANS: a gradual increase in loudness
    crescendoBlock.staticLabels.push(_('crescendo') + ' (+/–)');
    crescendoBlock.adjustWidthToLabel();
    crescendoBlock.flowClampOneArgBlock();
    crescendoBlock.defaults.push(5);

    // Push protoblocks onto their palettes.
    for (var protoblock in blocks.protoBlockDict) {
        if (blocks.protoBlockDict[protoblock].palette != null) {
            blocks.protoBlockDict[protoblock].palette.add(blocks.protoBlockDict[protoblock]);
        }
    }
}
