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

function initBasicProtoBlocks(palettes, blocks, beginnerMode) {
    blocks.palettes = palettes;

    // PITCH PALETTE

    // deprecated
    var newblock = new ProtoBlock('rest');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['rest'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    newblock.hidden = true;

    // deprecated
    // macro
    var newblock = new ProtoBlock('square');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['square'] = newblock;
    //.TRANS: square wave
    newblock.staticLabels.push(_('square'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(440);
    newblock.hidden = true;

    // deprecated
    // macro
    var newblock = new ProtoBlock('triangle');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['triangle'] = newblock;
    //.TRANS: triangle wave
    newblock.staticLabels.push(_('triangle'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(440);
    newblock.hidden = true;

    // deprecated
    // macro
    var newblock = new ProtoBlock('sine');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sine'] = newblock;
    //.TRANS: sine wave
    newblock.staticLabels.push(_('sine'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(440);
    newblock.hidden = true;

    // deprecated
    // macro
    var newblock = new ProtoBlock('sawtooth');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sawtooth'] = newblock;
    //.TRANS: sawtooth wave
    newblock.staticLabels.push(_('sawtooth'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(440);
    newblock.hidden = true;

    // Status blocks
    var newblock = new ProtoBlock('invertmode');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invertmode'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    newblock.extraWidth = 50;
    if (beginnerMode && !beginnerBlock('invertmode')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('transpositionfactor');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['transpositionfactor'] = newblock;
    //.TRANS: musical transposition (adjustment of pitch up or down)
    newblock.staticLabels.push(_('transposition'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('transpositionfactor')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('consonantstepsizedown');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['consonantstepsizedown'] = newblock;
    //.TRANS: step down one note in current musical scale
    newblock.staticLabels.push(_('scalar step down'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('consonantstepsizedown')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('consonantstepsizeup');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['consonantstepsizeup'] = newblock;
    //.TRANS: step up one note in current musical scale
    newblock.staticLabels.push(_('scalar step up'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('consonantstepsizeup')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('deltapitch');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['deltapitch'] = newblock;
    //.TRANS: the change meaused in half-steps between the current pitch and the previous pitch
    newblock.staticLabels.push(_('change in pitch'));
    newblock.parameterBlock();
    newblock.adjustWidthToLabel();
    if (beginnerMode && !beginnerBlock('deltapitch')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('mypitch');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['mypitch'] = newblock;
    //.TRANS: convert current note to piano key (1-88)
    newblock.staticLabels.push(_('pitch number'));
    newblock.parameterBlock();
    newblock.adjustWidthToLabel();
    if (beginnerMode && !beginnerBlock('mypitch')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('midi');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['midi'] = newblock;
    //.TRANS: MIDI is a technical standard for electronic music
    newblock.staticLabels.push('MIDI');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('midi')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setpitchnumberoffset');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['setpitchnumberoffset'] = newblock;
    //.TRANS: set an offset associated with the numeric piano keyboard mapping
    newblock.staticLabels.push(_('set pitch number offset'));
    newblock.staticLabels.push(_('name'), _('octave'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push('C');
    newblock.defaults.push(4);
    newblock.dockTypes[1] = 'notein';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('setpitchnumberoffset')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('number2pitch');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['number2pitch'] = newblock;
    //.TRANS: convert piano key number (1-88) to pitch
    newblock.staticLabels.push(_('number to pitch'));
    newblock.oneArgMathBlock();
    newblock.adjustWidthToLabel();
    newblock.defaults.push(48);
    if (beginnerMode && !beginnerBlock('number2pitch')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('number2octave');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['number2octave'] = newblock;
    //.TRANS: convert piano key number (1-88) to octave
    newblock.staticLabels.push(_('number to octave'));
    newblock.oneArgMathBlock();
    newblock.adjustWidthToLabel();
    newblock.defaults.push(48);
    if (beginnerMode && !beginnerBlock('number2octave')) {
        newblock.hidden = true;
    }

    // Value blocks
    var newblock = new ProtoBlock('accidentalname');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['accidentalname'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    newblock.extraWidth = 50;
    if (beginnerMode && !beginnerBlock('accidentalname')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('eastindiansolfege');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['eastindiansolfege'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'solfegeout';
    if (beginnerMode && !beginnerBlock('eastindiansolfege')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('notename');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['notename'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'noteout';
    if (beginnerMode && !beginnerBlock('notename')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('solfege');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['solfege'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'solfegeout';
    if (beginnerMode && !beginnerBlock('solfege')) {
        newblock.hidden = true;
    }

    // Transposition blocks
    // macro
    var newblock = new ProtoBlock('invert1');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert1'] = newblock;
    //.TRANS: pitch inversion rotates a pitch around another pitch
    newblock.staticLabels.push(_('invert'));
    newblock.staticLabels.push(_('name'), _('octave'));
    //.TRANS: invert based on even or odd number or musical scale
    newblock.staticLabels.push(_('even') + '/' + _('odd') + '/' + _('scalar'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.flowClampThreeArgBlock();
    newblock.adjustWidthToLabel();
    newblock.defaults.push('sol');
    newblock.defaults.push(4);
    newblock.defaults.push(_('even'));
    newblock.dockTypes[1] = 'solfegein';
    newblock.dockTypes[2] = 'anyin';
    newblock.dockTypes[3] = 'anyin';
    if (beginnerMode && !beginnerBlock('invert1')) {
        newblock.hidden = true;
    }

    // deprecated
    var newblock = new ProtoBlock('invert2');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert2'] = newblock;
    //.TRANS: pitch inversion rotates a pitch around another pitch (odd number)
    newblock.staticLabels.push(_('invert (odd)'));
    newblock.staticLabels.push(_('note'), _('octave'));
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.adjustWidthToLabel();
    newblock.defaults.push('sol');
    newblock.defaults.push(4);
    newblock.dockTypes[1] = 'solfegein';
    newblock.dockTypes[2] = 'anyin';
    newblock.hidden = true;

    // deprecated
    // macro
    var newblock = new ProtoBlock('invert');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert'] = newblock;
    //.TRANS: pitch inversion rotates a pitch around another pitch (even number)
    newblock.staticLabels.push(_('invert (even)'));
    newblock.staticLabels.push(_('note'), _('octave'));
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.adjustWidthToLabel();
    newblock.defaults.push('sol');
    newblock.defaults.push(4);
    newblock.dockTypes[1] = 'solfegein';
    newblock.dockTypes[2] = 'anyin';
    newblock.hidden = true;

    var newblock = new ProtoBlock('register');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['register'] = newblock;
    //.TRANS: register is the octave of the current pitch
    newblock.staticLabels.push(_('register'));
    newblock.defaults.push(0);
    newblock.oneArgBlock();
    newblock.adjustWidthToLabel();
    if (beginnerMode && !beginnerBlock('register')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('settransposition');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['settransposition'] = newblock;
    //.TRANS: adjust the amount of shift (up or down) of a pitch
    newblock.staticLabels.push(_('semi-tone transpose'));
    newblock.adjustWidthToLabel();
    newblock.defaults.push('1');
    newblock.flowClampOneArgBlock();
    if (beginnerMode && !beginnerBlock('settransposition')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('octave');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['octave'] = newblock;
    //.TRANS: adjusts the shift up or down by one octave (twelve half-steps in the interval between two notes, one having twice or half the frequency in Hz of the other.)
    newblock.staticLabels.push(_('octave'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('octave')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('downsixth');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['downsixth'] = newblock;
    //.TRANS: down sixth means the note is five scale degrees below current note
    newblock.staticLabels.push(_('down sixth'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('downsixth')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('downthird');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['downthird'] = newblock;
    //.TRANS: down third means the note is two scale degrees below current note
    newblock.staticLabels.push(_('down third'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('downthird')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('seventh');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['seventh'] = newblock;
    //.TRANS: seventh means the note is the six scale degrees above current note
    newblock.staticLabels.push(_('seventh'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('seventh')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('sixth');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sixth'] = newblock;
    //.TRANS: sixth means the note is the five scale degrees above current note
    newblock.staticLabels.push(_('sixth'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('sixth')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('fifth');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['fifth'] = newblock;
    //.TRANS: fifth means the note is the four scale degrees above current note
    newblock.staticLabels.push(_('fifth'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('fifth')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('fourth');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['fourth'] = newblock;
    //.TRANS: fourth means the note is three scale degrees above current note
    newblock.staticLabels.push(_('fourth'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('fourth')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('third');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['third'] = newblock;
    //.TRANS: third means the note is two scale degrees above current note
    newblock.staticLabels.push(_('third'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('third')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('second');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['second'] = newblock;
    //.TRANS: second means the note is one scale degree above current note
    newblock.staticLabels.push(_('second'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('second')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('unison');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['unison'] = newblock;
    //.TRANS: unison means the note is the same as the current note
    newblock.staticLabels.push(_('unison'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('unison')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('setscalartransposition');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['setscalartransposition'] = newblock;
    //.TRANS: adjust the amount of shift (up or down) of a pitch by musical scale (scalar) steps
    newblock.staticLabels.push(_('scalar transpose') + ' (+/–)');
    newblock.adjustWidthToLabel();
    newblock.defaults.push('1');
    newblock.flowClampOneArgBlock();
    if (!beginnerMode || !beginnerBlock('setscalartransposition')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('accidental');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['accidental'] = newblock;
    //.TRANS: An accidental is a modification to a pitch, e.g., sharp or flat.
    newblock.staticLabels.push(_('accidental'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'textin';
    if (beginnerMode && !beginnerBlock('accidental')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('flat');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['flat'] = newblock;
    //.TRANS: flat is a half-step down in pitch
    newblock.staticLabels.push(_('flat') + ' ♭');
    newblock.adjustWidthToLabel();
    newblock.flowClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('flat')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('sharp');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['sharp'] = newblock;
    //.TRANS: sharp is a half-step up in pitch
    newblock.staticLabels.push(_('sharp') + ' ♯');
    newblock.adjustWidthToLabel();
    newblock.flowClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('sharp')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('hertz');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['hertz'] = newblock;
    //.TRANS: a measure of frequency: one cycle per second
    newblock.staticLabels.push(_('hertz'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(392);
    if (beginnerMode && !beginnerBlock('hertz')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('pitchnumber');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitchnumber'] = newblock;
    //.TRANS: a mapping of pitch to the 88 piano keys
    newblock.staticLabels.push(_('pitch number'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(7);
    newblock.dockTypes[1] = 'numberin';
    if (beginnerMode && !beginnerBlock('pitchnumber')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('scaledegree');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['scaledegree'] = newblock;
    //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
    newblock.staticLabels.push(_('scale degree'));
    newblock.staticLabels.push(_('number'), _('octave'));
    newblock.adjustWidthToLabel();
    newblock.defaults.push(5);  // G in C Major
    newblock.defaults.push(4);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('scaledegree')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('steppitch');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['steppitch'] = newblock;
    //.TRANS: step some number of notes in current musical scale
    newblock.staticLabels.push(_('scalar step') + ' (+/–)');
    newblock.oneArgBlock();
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(1);
    if (beginnerMode && !beginnerBlock('steppitch')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('pitch2');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitch2'] = newblock;
    newblock.staticLabels.push(_('pitch') + ' ' + 'G4');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('pitch2')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('pitch');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitch'] = newblock;
    //.TRANS: we specify pitch in terms of a name and an octave. The name can be CDEFGAB or Do Re Mi Fa Sol La Ti. Octave is a number between 1 and 8.
    newblock.staticLabels.push(_('pitch'));
    newblock.staticLabels.push(_('name'), _('octave'));
    newblock.adjustWidthToLabel();
    newblock.defaults.push('sol');
    newblock.defaults.push(4);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'solfegein';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('pitch')) {
        newblock.hidden = true;
    }

    // MATRIX PALETTE

    var newblock = new ProtoBlock('oscillator');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['oscillator'] = newblock;
    //.TRANS: there are different types (sine, triangle, square...) of oscillators.
    newblock.staticLabels.push(_('oscillator'));
    newblock.staticLabels.push(_('type'));
    //.TRANS: Partials refers to the number of sine waves combined into the sound.
    newblock.staticLabels.push(_('partials'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    //.TRANS: triangle wave
    newblock.defaults.push(_('triangle'));
    newblock.defaults.push(6);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'numberin';
    newblock.hidden = true;

    var newblock = new ProtoBlock('filtertype');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['filtertype'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    newblock.hidden = true;

    var newblock = new ProtoBlock('oscillatortype');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['oscillatortype'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    newblock.hidden = true;

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

    // macro
    var newblock = new ProtoBlock('sixtyfourthNote');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['sixtyfourthNote'] = newblock;
    newblock.staticLabels.push(_('1/64 note') + ' 𝅘𝅥𝅱');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('sixtyfourthNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('thirtysecondNote');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['thirtysecondNote'] = newblock;
    newblock.staticLabels.push(_('1/32 note') + ' 𝅘𝅥𝅰');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('thirtysecondNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('sixteenthNote');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['sixteenthNote'] = newblock;
    newblock.staticLabels.push(_('1/16 note') + ' 𝅘𝅥𝅯');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('sixteenthNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('eighthNote');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['eighthNote'] = newblock;
    newblock.staticLabels.push(_('eighth note') + ' ♪');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('eighthNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('quarterNote');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['quarterNote'] = newblock;
    newblock.staticLabels.push(_('quarter note') + ' ♩');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('quarterNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('halfNote');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['halfNote'] = newblock;
    newblock.staticLabels.push(_('half note') + ' 𝅗𝅥');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('halfNote')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('wholeNote');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['wholeNote'] = newblock;
    newblock.staticLabels.push(_('whole note') + ' 𝅝');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('wholeNote')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('tuplet2');
    newblock.palette = palettes.dict['widgets'];
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
    var tuplet3Block = new ProtoBlock('tuplet3');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['tuplet3'] = tuplet3Block;
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
    newblock.palette = palettes.dict['widgets'];
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
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet7'] = newblock;
    //.TRANS: A tuplet divided into 7 time values.
    newblock.staticLabels.push(_('septuplet'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('stuplet7')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('stuplet5');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet5'] = newblock;
    //.TRANS: A tuplet divided into 5 time values.
    newblock.staticLabels.push(_('quintuplet'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('stuplet5')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('stuplet3');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['stuplet3'] = newblock;
    //.TRANS: A tuplet divided into 3 time values.
    newblock.staticLabels.push(_('triplet'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('stuplet3')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('stuplet');
    newblock.palette = palettes.dict['widgets'];
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

    // deprecated
    var newblock = new ProtoBlock('rhythm');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['rhythm'] = newblock;
    //.TRANS: an arrangement of notes based on duration
    newblock.staticLabels.push(_('rhythm'));
    newblock.staticLabels.push(_('number of notes'), _('note value'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.defaults.push(3);
    newblock.defaults.push(4);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.hidden = true;

    var newblock = new ProtoBlock('rhythm2');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['rhythm2'] = newblock;
    //.TRANS: an arrangement of notes based on duration
    newblock.staticLabels.push(_('rhythm'));
    newblock.staticLabels.push(_('number of notes'), _('note value'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.defaults.push(3);
    newblock.defaults.push(4);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('rhythm2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('timbre');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['timbre'] = newblock;
    //.TRANS: timbre is the character or quality of a musical sound
    newblock.staticLabels.push(_('timbre'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.stackClampOneArgBlock();
    newblock.defaults.push(_('custom'));
    if (beginnerMode && !beginnerBlock('timbre')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('modewidget');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['modewidget'] = newblock;
    //.TRANS: musical mode is the pattern of half-steps in an octave, e.g., Major or Minor modes
    newblock.staticLabels.push(_('custom mode'));
    newblock.adjustWidthToLabel();
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
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
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
    newblock.adjustWidthToLabel();
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('pitchslider')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('pitchstaircase');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['pitchstaircase'] = newblock;
    //.TRANS: generate a progressive sequence of pitches
    newblock.staticLabels.push(_('pitch staircase'));
    newblock.adjustWidthToLabel();
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('pitchstaircase')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('rhythmruler2');
    newblock.palette = palettes.dict['widgets'];
    blocks.protoBlockDict['rhythmruler2'] = newblock;
    //.TRANS: widget for subdividing a measure into distinct rhythmic elements
    newblock.staticLabels.push(_('rhythm ruler'));
    newblock.adjustWidthToLabel();
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('rhythmruler2')) {
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
    newblock.staticLabels.push(_('pitch-time matrix'));
    newblock.adjustWidthToLabel();
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
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('status')) {
        newblock.hidden = true;
    }

    // RHYTHM PALETTE

    var newblock = new ProtoBlock('mynotevalue');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['mynotevalue'] = newblock;
    //.TRANS: the value (e.g., 1/4 note) of the note being played.
    newblock.staticLabels.push(_('note value'));
    newblock.parameterBlock();
    newblock.adjustWidthToLabel();
    if (beginnerMode && !beginnerBlock('mynotevalue')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('duplicatefactor');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['duplicatefactor'] = newblock;
    //.TRANS: factor used in determining how many duplications to make
    newblock.staticLabels.push(_('duplicate factor'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('duplicatefactor')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('skipfactor');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['skipfactor'] = newblock;
    newblock.staticLabels.push('skip factor');
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('osctime');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['osctime'] = newblock;
    //.TRANS: oscillator time (in micro seconds)
    newblock.staticLabels.push(_('osctime'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(200);
    if (beginnerMode && !beginnerBlock('osctime')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('swing');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['swing'] = newblock;
    //.TRANS: swing is a rhythmic variation that emphasises the offbeat
    newblock.staticLabels.push(_('swing'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(32);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('newswing');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newswing'] = newblock;
    //.TRANS: swing is a rhythmic variation that emphasises the offbeat
    newblock.staticLabels.push(_('swing'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(1 / 24);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('newswing2');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newswing2'] = newblock;
    newblock.staticLabels.push(_('swing'));
    //.TRANS: the amount to shift to the offbeat note
    newblock.staticLabels.push(_('swing value'));
    newblock.staticLabels.push(_('note value'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.defaults.push(1 / 24);
    newblock.defaults.push(1 / 8);
    if (beginnerMode && !beginnerBlock('newswing2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('backward');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['backward'] = newblock;
    //.TRANS: play music backward
    newblock.staticLabels.push(_('backward'));
    newblock.adjustWidthToLabel();
    newblock.flowClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('backward')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('skipnotes');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['skipnotes'] = newblock;
    //.TRANS: substitute rests on notes being skipped
    newblock.staticLabels.push(_('skip notes'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(2);
    if (beginnerMode && !beginnerBlock('skipnotes')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('duplicatenotes');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['duplicatenotes'] = newblock;
    //.TRANS: play each note more than once
    newblock.staticLabels.push(_('duplicate'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(2);
    if (beginnerMode && !beginnerBlock('duplicatenotes')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('multiplybeatfactor');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['multiplybeatfactor'] = newblock;
    //.TRANS: speed up note duration by some factor, e.g. convert 1/4 to 1/8 notes by using a factor of 2
    newblock.staticLabels.push(_('multiply note value'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(2);
    if (beginnerMode && !beginnerBlock('multiplybeatfactor')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('tie');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['tie'] = newblock;
    //.TRANS: tie notes together into one longer note
    newblock.staticLabels.push(_('tie'));
    newblock.adjustWidthToLabel();
    newblock.flowClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('tie')) {
        newblock.hidden = true;
    }

    // Deprecated
    // macro
    var newblock = new ProtoBlock('rhythmicdot');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['rhythmicdot'] = newblock;
    //.TRANS: a dotted note is played for 1.5x its value, e.g., 1/8. --> 3/16
    newblock.staticLabels.push(_('dot'));
    newblock.adjustWidthToLabel();
    newblock.flowClampZeroArgBlock();
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('rhythmicdot2');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['rhythmicdot2'] = newblock;
    //.TRANS: a dotted note is played for 1.5x its value, e.g., 1/8. --> 3/16
    newblock.staticLabels.push(_('dot'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(1);
    newblock.dockTypes[1] = 'numberin';
    if (beginnerMode && !beginnerBlock('rhythmicdot2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('rest2');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['rest2'] = newblock;
    newblock.staticLabels.push(_('silence'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('rest2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('note4');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note4'] = newblock;
    newblock.staticLabels.push(_('note value') + ' ' + _('drum'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('note4')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('note3');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note3'] = newblock;
    newblock.staticLabels.push(_('note value') + ' ' + _('392 hertz'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('note3')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('note5');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note5'] = newblock;
    newblock.staticLabels.push(_('note value') + ' 7');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('note5')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('note7');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note7'] = newblock;
    newblock.staticLabels.push(_('note value') + ' 5 4');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('note7')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('note6');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note6'] = newblock;
    newblock.staticLabels.push(_('note value') + ' +1');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('note6')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('note2');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note2'] = newblock;
    newblock.staticLabels.push(_('note value') + ' ' + 'G4');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('note2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('note1');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note1'] = newblock;
    newblock.staticLabels.push(_('note value') + ' ' + i18nSolfege('sol') + '4');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('note1')) {
        newblock.hidden = true;
    }

    // macro
    // deprecated
    var newblock = new ProtoBlock('note');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['note'] = newblock;
    newblock.staticLabels.push('deprecated note value');
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(4);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('newnote');
    newblock.palette = palettes.dict['rhythm'];
    blocks.protoBlockDict['newnote'] = newblock;
    newblock.staticLabels.push(_('note'));
    newblock.staticLabels.push(_('value'));
    newblock.extraWidth = 40;
    newblock.adjustWidthToLabel();
    newblock.labelOffset = 15;
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(1 / 4);
    if (beginnerMode && !beginnerBlock('newnote')) {
        newblock.hidden = true;
    }

    // METER PALETTE

    var newblock = new ProtoBlock('beatfactor');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['beatfactor'] = newblock;
    //.TRANS: number of beats per minute
    newblock.staticLabels.push(_('beat factor'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('beatfactor')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('bpmfactor');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['bpmfactor'] = newblock;
    //.TRANS: number of beats played per minute
    newblock.staticLabels.push(_('beats per minute'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('bpmfactor')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('measurevalue');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['measurevalue'] = newblock;
    //.TRANS: count of current measure in meter
    newblock.staticLabels.push(_('measure count'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('measurevalue')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('beatvalue');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['beatvalue'] = newblock;
    //.TRANS: count of current beat in meter
    newblock.staticLabels.push(_('beat count'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('beatvalue')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('notecounter');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['notecounter'] = newblock;
    //.TRANS: count the number of notes
    newblock.staticLabels.push(_('note counter'));
    newblock.argFlowClampBlock();
    newblock.adjustWidthToLabel();
    if (beginnerMode && !beginnerBlock('notecounter')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('elapsednotes');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['elapsednotes'] = newblock;
    //.TRANS: number of whole notes that have been played
    newblock.staticLabels.push(_('whole notes played'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('elapsednotes')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('elapsednotes2');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['elapsednotes2'] = newblock;
    //.TRANS: number of notes that have been played
    newblock.staticLabels.push(_('notes played'));
    newblock.adjustWidthToLabel();
    newblock.oneArgMathBlock();
    if (beginnerMode && !beginnerBlock('elapsednotes2')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('pitchinhertz');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['pitchinhertz'] = newblock;
    //.TRANS: the current pitch expressed in Hertz
    newblock.staticLabels.push(_('pitch in hertz'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('pitchinhertz')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('drift');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['drift'] = newblock;
    //.TRANS: don't lock notes to master clock
    newblock.staticLabels.push(_('no clock'));
    newblock.adjustWidthToLabel();
    newblock.flowClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('drift')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('offbeatdo');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['offbeatdo'] = newblock;
    // #TRANS: on musical 'offbeat' do some action
    newblock.staticLabels.push(_('on weak beat do'));
    newblock.oneArgBlock();
    newblock.defaults.push(_('action'));
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'textin';
    if (beginnerMode && !beginnerBlock('offbeatdo')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('onbeatdo');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['onbeatdo'] = newblock;
    // #TRANS: 'on' musical 'beat' 'do' some action
    newblock.staticLabels.push(_('on strong beat'), _('beat'), _('do'));
    newblock.twoArgBlock();
    newblock.defaults.push(1);
    newblock.defaults.push(_('action'));
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'textin';
    newblock.adjustWidthToLabel();
    if (beginnerMode && !beginnerBlock('onbeatdo')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('everybeatdo');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['everybeatdo'] = newblock;
    // #TRANS: on every musical 'beat' do some action
    newblock.staticLabels.push(_('on every beat do'));
    newblock.oneArgBlock();
    newblock.defaults.push(_('action'));
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'textin';
    if (beginnerMode && !beginnerBlock('everybeatdo')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('setmasterbpm2');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['setmasterbpm2'] = newblock;
    //.TRANS: sets tempo by defniing a beat and beats per minute
    newblock.staticLabels.push(_('master beats per minute'));
    newblock.staticLabels.push(_('bpm'), _('beat value'));
    newblock.extraWidth = 15;
    newblock.adjustWidthToLabel();
    newblock.defaults.push(90);
    newblock.defaults.push(1 / 4);
    newblock.twoArgBlock();
    if (beginnerMode && !beginnerBlock('setmasterbpm2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('setmasterbpm');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['setmasterbpm'] = newblock;
    //.TRANS: old block to set master tempo which doesn't set value of beat
    newblock.staticLabels.push(_('master beats per minute'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(90);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('setbpm2');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['setbpm2'] = newblock;
    // .TRANS: sets tempo for notes contained in block
    newblock.staticLabels.push(_('beats per minute'));
    newblock.staticLabels.push(_('bpm'), _('beat value'));
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.defaults.push(90);
    newblock.defaults.push(1 / 4);
    if (beginnerMode && !beginnerBlock('setbpm2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('setbpm');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['setbpm'] = newblock;
    // .TRANS: old block to set tempo using only bpm for notes contained in block
    newblock.staticLabels.push(_('beats per minute'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(90);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('pickup');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['pickup'] = newblock;
    //.TRANS: anacrusis
    newblock.staticLabels.push(_('pickup'));
    newblock.oneArgBlock();
    newblock.defaults.push(0);
    newblock.extraWidth = 15;
    if (beginnerMode && !beginnerBlock('pickup')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('meter');
    newblock.palette = palettes.dict['meter'];
    blocks.protoBlockDict['meter'] = newblock;
    //.TRANS: musical meter (time signature)
    newblock.staticLabels.push(_('meter'));
    newblock.staticLabels.push(_('number of beats'), _('note value'));
    newblock.extraWidth = 15;
    newblock.adjustWidthToLabel();
    newblock.defaults.push(4);
    newblock.defaults.push(0.25);
    newblock.twoArgBlock();
    if (beginnerMode && !beginnerBlock('meter')) {
        newblock.hidden = true;
    }

    // TONE (ARTICULATION) PALETTE

    var newblock = new ProtoBlock('staccatofactor');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['staccatofactor'] = newblock;
    //.TRANS: the duration of a note played as staccato
    newblock.staticLabels.push(_('staccato factor'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('staccatofactor')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('slurfactor');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['slurfactor'] = newblock;
    //.TRANS: the degree of overlap of notes played as legato
    newblock.staticLabels.push(_('slur factor'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('slurfactor')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('amsynth');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['amsynth'] = newblock;
    //.TRANS: AM (amplitude modulation) synthesizer
    newblock.staticLabels.push(_('AM synth'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.defaults.push(1);
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'numberin';
    if (beginnerMode && !beginnerBlock('amsynth')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('fmsynth');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['fmsynth'] = newblock;
    //.TRANS: FM (frequency modulation) synthesizer
    newblock.staticLabels.push(_('FM synth'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.defaults.push(10);
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'numberin';
    if (beginnerMode && !beginnerBlock('fmsynth')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('duosynth');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['duosynth'] = newblock;
    //.TRANS: a duo synthesizer combines a synth with a sequencer
    newblock.staticLabels.push(_('duo synth'));
    newblock.staticLabels.push(_('vibrato rate'), _('vibrato intensity'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.defaults.push(10);
    newblock.defaults.push(6);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    if (beginnerMode && !beginnerBlock('duosynth')) {
        newblock.hidden = true;
    }

    var partialBlock = new ProtoBlock('partial');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['partial'] = partialBlock;
    //.TRANS: partials are weighted components in a harmonic series
    newblock.staticLabels.push(_('partial'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(1);
    if (beginnerMode && !beginnerBlock('partial')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('harmonic');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['harmonic'] = newblock;
    //.TRANS: partials are weighted components in a harmonic series
    newblock.staticLabels.push(_('weighted partials'));
    newblock.adjustWidthToLabel();
    newblock.flowClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('harmonic')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('harmonic2');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['harmonic2'] = newblock;
    //.TRANS: A harmonic is a overtone.
    newblock.staticLabels.push(_('harmonic'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.defaults.push(1);
    if (beginnerMode && !beginnerBlock('harmonic2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('neighbor');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['neighbor'] = newblock;
    //.TRANS: the neigbor refers to a neighboring note, e.g., D is a neighbor of C
    newblock.staticLabels.push(_('neighbor') + ' (+/–)');
    newblock.staticLabels.push(_('semi-tone interval'), _('note value'));
    newblock.extraWidth = 15;
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    newblock.defaults.push(1);
    newblock.defaults.push(1 / 16);
    if (beginnerMode && !beginnerBlock('neighbor')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('neighbor2');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['neighbor2'] = newblock;
    //.TRANS: the neigbor refers to a neighboring note, e.g., D is a neighbor of C
    newblock.staticLabels.push(_('neighbor') + ' (+/–)');
    newblock.staticLabels.push(_('scalar interval'), _('note value'));
    newblock.extraWidth = 15;
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    newblock.defaults.push(1);
    newblock.defaults.push(1 / 16);
    if (beginnerMode && !beginnerBlock('neighbor2')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('dis');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['dis'] = newblock;
    //.TRANS: distortion is an alteration in the sound
    newblock.staticLabels.push(_('distortion'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.defaults.push(40);
    if (beginnerMode && !beginnerBlock('dis')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('tremolo');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['tremolo'] = newblock;
    //.TRANS: a wavering effect in a musical tone
    newblock.staticLabels.push(_('tremolo'));
    //.TRANS: rate at which tremolo wavers
    newblock.staticLabels.push(_('rate'));
    //.TRANS: amplitude of tremolo waver
    newblock.staticLabels.push(_('depth'));
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    newblock.defaults.push(10);
    newblock.defaults.push(50);
    if (beginnerMode && !beginnerBlock('tremolo')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('phaser');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['phaser'] = newblock;
    //.TRANS: alter the phase of the sound
    newblock.staticLabels.push(_('phaser'));
    newblock.staticLabels.push(_('rate'), _('octaves'), _('base frequency'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.flowClampThreeArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    newblock.dockTypes[3] = 'numberin';
    newblock.defaults.push(0.5);
    newblock.defaults.push(3);
    newblock.defaults.push(350);
    if (beginnerMode && !beginnerBlock('phaser')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('chorus');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['chorus'] = newblock;
    //.TRANS: musical effect to simulate a choral sound
    newblock.staticLabels.push(_('chorus'));
    newblock.staticLabels.push(_('rate'), _('delay') + ' (MS)', _('depth'));
    newblock.adjustWidthToLabel();
    newblock.flowClampThreeArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    newblock.dockTypes[3] = 'numberin';
    newblock.defaults.push(1.5);
    newblock.defaults.push(3.5);
    newblock.defaults.push(70);
    if (beginnerMode && !beginnerBlock('chorus')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('vibrato');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['vibrato'] = newblock;
    //.TRANS: a rapid, slight variation in pitch
    newblock.staticLabels.push(_('vibrato'));
    newblock.staticLabels.push(_('intensity'), _('rate'));
    newblock.adjustWidthToLabel();
    newblock.flowClampTwoArgBlock();
    newblock.defaults.push(5);
    newblock.defaults.push(1 / 16);
    if (beginnerMode && !beginnerBlock('vibrato')) {
        newblock.hidden = true;
    }

    // deprecated by set timbre block
    // macro
    var newblock = new ProtoBlock('setvoice');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['setvoice'] = newblock;
    //.TRANS: select synthesizer
    newblock.staticLabels.push(_('set synth'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'textin';
    newblock.defaults.push('violin');
    newblock.hidden = true;
    if (beginnerMode && !beginnerBlock('setvoice')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('glide');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['glide'] = newblock;
   //.TRANS: glide (glissando) is a blended overlap successive notes
    newblock.staticLabels.push(_('glide'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(1 / 16);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('slur');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['slur'] = newblock;
    //.TRANS: slur or legato is an overlap successive notes
    newblock.staticLabels.push(_('slur'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(16);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('staccato');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['staccato'] = newblock;
    //.TRANS: play each note sharply detached from the others
    newblock.staticLabels.push(_('staccato'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(32);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('newslur');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['newslur'] = newblock;
    //.TRANS: legato: overlap successive notes
    newblock.staticLabels.push(_('slur'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(1 / 16);
    if (beginnerMode && !beginnerBlock('newslur')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('newstaccato');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['newstaccato'] = newblock;
    //.TRANS: play each note sharply detached from the others
    newblock.staticLabels.push(_('staccato'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(1 / 32);
    if (beginnerMode && !beginnerBlock('newstaccato')) {
        newblock.hidden = true;
    }

    // deprecated
    var newblock = new ProtoBlock('synthname');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['synthname'] = newblock;
    newblock.staticLabels.push(_('synth name'));
    newblock.adjustWidthToLabel();
    newblock.dockTypes[0] = 'textout';
    newblock.parameterBlock();
    newblock.hidden = true;

    var newblock = new ProtoBlock('voicename');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['voicename'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    newblock.extraWidth = 50;
    if (beginnerMode && !beginnerBlock('voicename')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('settimbre');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['settimbre'] = newblock;
    //.TRANS: set the characteristics of a custom instrument
    newblock.staticLabels.push(_('set timbre'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'textin';
    //.TRANS: user-defined
    newblock.defaults.push(_('custom'));   
    if (beginnerMode && !beginnerBlock('settimbre')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('settemperament');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['settemperament'] = newblock;
    newblock.staticLabels.push(_('set temperament'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('settemperament')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('temperamentname');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['temperamentname'] = newblock;
    newblock.valueBlock();
    newblock.hidden = true; 
    newblock.extraWidth = 50;
    newblock.dockTypes[0] = 'anyout';   
    if (beginnerMode && !beginnerBlock('temperamentname')) {
        newblock.hidden = true;
    }

    // INTERVALS (PITCH TRANSFORMS) PALETTE

    var newblock = new ProtoBlock('modename');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['modename'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    newblock.extraWidth = 50;  // 150;
    if (beginnerMode && !beginnerBlock('modename')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('doubly');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['doubly'] = newblock;
    // TRANS: doubly means to apply an augmentation or diminishment twice
    newblock.staticLabels.push(_('doubly'));
    newblock.oneArgMathBlock();
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('doubly')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('intervalname');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['intervalname'] = newblock;
    newblock.valueBlock();
    newblock.extraWidth = 50;
    newblock.adjustWidthToLabel();
    newblock.dockTypes[0] = 'numberout';
    if (beginnerMode && !beginnerBlock('intervalname')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('measureintervalsemitones');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['measureintervalsemitones'] = newblock;
    //.TRANS: measure the distance between two pitches in semi-tones
    newblock.staticLabels.push(_('semi-tone interval measure'));
    newblock.argFlowClampBlock();
    newblock.adjustWidthToLabel();
    if (beginnerMode && !beginnerBlock('measureintervalsemitones')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('measureintervalscalar');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['measureintervalscalar'] = newblock;
    //.TRANS: measure the distance between two pitches in steps of musical scale
    newblock.staticLabels.push(_('scalar interval measure'));
    newblock.argFlowClampBlock();
    newblock.adjustWidthToLabel();
    if (beginnerMode && !beginnerBlock('measureintervalscalar')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('diminished8');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished8'] = newblock;
    newblock.staticLabels.push(_('diminished') + ' 8');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('diminished8')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('diminished7');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished7'] = newblock;
    newblock.staticLabels.push(_('diminished') + ' 7');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('diminished7')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('diminished6');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished6'] = newblock;
    newblock.staticLabels.push(_('diminished') + ' 6');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('diminished6')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('diminished5');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished5'] = newblock;
    newblock.staticLabels.push(_('diminished') + ' 5');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('diminished5')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('diminished4');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished4'] = newblock;
    newblock.staticLabels.push(_('diminished') + ' 4');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('diminished4')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('diminished3');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished3'] = newblock;
    newblock.staticLabels.push(_('diminished') + ' 3');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('diminished3')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('diminished2');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['diminished2'] = newblock;
    newblock.staticLabels.push(_('diminished') + ' 2');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('diminished2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('augmented8');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented8'] = newblock;
    newblock.staticLabels.push(_('augmented') + ' 8');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('augmented8')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('augmented7');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented7'] = newblock;
    newblock.staticLabels.push(_('augmented') + ' 7');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('augmented7')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('augmented6');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented6'] = newblock;
    newblock.staticLabels.push(_('augmented') + ' 6');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('augmented6')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('augmented5');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented5'] = newblock;
    newblock.staticLabels.push(_('augmented') + ' 5');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('augmented5')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('augmented4');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented4'] = newblock;
    newblock.staticLabels.push(_('augmented') + ' 4');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('augmented4')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('augmented3');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented3'] = newblock;
    newblock.staticLabels.push(_('augmented') + ' 3');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('augmented3')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('augmented2');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented2'] = newblock;
    newblock.staticLabels.push(_('augmented') + ' 2');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('augmented2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('augmented1');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['augmented1'] = newblock;
    newblock.staticLabels.push(_('augmented') + ' 1');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('augmented1')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('perfect8');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect8'] = newblock;
    newblock.staticLabels.push(_('perfect') + ' 8');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('perfect8')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('perfect5');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect5'] = newblock;
    newblock.staticLabels.push(_('perfect') + ' 5');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('perfect5')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('perfect4');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect4'] = newblock;
    newblock.staticLabels.push(_('perfect') + ' 4');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('perfect4')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('perfect');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['perfect'] = newblock;
    newblock.staticLabels.push(_('perfect'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(5);
    newblock.hidden = true;
    if (beginnerMode && !beginnerBlock('perfect')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('downminor6');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downminor6'] = newblock;
    newblock.staticLabels.push(_('down minor') + ' 6');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('downminor6')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('downminor3');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downminor3'] = newblock;
    newblock.staticLabels.push(_('down minor') + ' 3');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('downminor3')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('minor7');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor7'] = newblock;
    newblock.staticLabels.push(_('minor') +  ' 7');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('minor7')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('minor6');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor6'] = newblock;
    newblock.staticLabels.push(_('minor') + ' 6');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('minor6')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('minor3');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor3'] = newblock;
    newblock.staticLabels.push(_('minor') + ' 3');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('minor3')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('minor2');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['minor2'] = newblock;
    newblock.staticLabels.push(_('minor') + ' 2');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('minor2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('downmajor6');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downmajor6'] = newblock;
    newblock.staticLabels.push(_('down major') + ' 6');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('downmajor6')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('downmajor3');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downmajor3'] = newblock;
    newblock.staticLabels.push(_('down major') + ' 3');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('downmajor3')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('major7');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major7'] = newblock;
    newblock.staticLabels.push(_('major') + ' 7');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('major7')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('major6');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major6'] = newblock;
    newblock.staticLabels.push(_('major') + ' 6');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('major6')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('major3');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major3'] = newblock;
    newblock.staticLabels.push(_('major') + ' 3');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('major3')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('major2');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['major2'] = newblock;
    newblock.staticLabels.push(_('major') + ' 2');
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('major2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('semitoneinterval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['semitoneinterval'] = newblock;
    //.TRANS: calculate a relative step between notes based on semi-tones
    newblock.staticLabels.push(_('semi-tone interval') + ' (+/–)');
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(5);
    if (!beginnerMode && !beginnerBlock('semitoneinterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('downsixthinterval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downsixthinterval'] = newblock;
    //.TRANS: down sixth means the note is five scale degrees below current note
    newblock.staticLabels.push(_('down sixth'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('downsixthinterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('downthirdinterval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['downthirdinterval'] = newblock;
    //.TRANS: down third means the note is two scale degrees below current note
    newblock.staticLabels.push(_('down third'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('downthirdinterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('seventhinterval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['seventhinterval'] = newblock;
    //.TRANS: seventh means the note is the six scale degrees above current note
    newblock.staticLabels.push(_('seventh'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('seventhinterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('sixthinterval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['sixthinterval'] = newblock;
    //.TRANS: sixth means the note is the five scale degrees above current note
    newblock.staticLabels.push(_('sixth'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('sixthinterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('fifthinterval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['fifthinterval'] = newblock;
    //.TRANS: fifth means the note is the four scale degrees above current note
    newblock.staticLabels.push(_('fifth'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('fifthinterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('fourthinterval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['fourthinterval'] = newblock;
    //.TRANS: fourth means the note is three scale degrees above current note
    newblock.staticLabels.push(_('fourth'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('fourthinterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('thirdinterval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['thirdinterval'] = newblock;
    //.TRANS: third means the note is two scale degrees above current note
    newblock.staticLabels.push(_('third'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('thirdinterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('secondinterval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['secondinterval'] = newblock;
    //.TRANS: second means the note is one scale degree above current note
    newblock.staticLabels.push(_('second'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('secondinterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('unisoninterval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['unisoninterval'] = newblock;
    //.TRANS: unison means the note is the same as the current note
    newblock.staticLabels.push(_('unison'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('unisoninterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('interval');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['interval'] = newblock;
    //.TRANS: calculate a relative step between notes based on the current musical scale
    newblock.staticLabels.push(_('scalar interval') + ' (+/–)');
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(5);
    if (!beginnerMode && !beginnerBlock('interval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('definemode');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['definemode'] = newblock;
    //.TRANS: define a custom mode
    newblock.staticLabels.push(_('define mode'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(_('custom'));
    newblock.dockTypes[1] = 'textin';
    if (beginnerMode && !beginnerBlock('definemode')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('movable');  // legacy typo
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['movable'] = newblock;
    newblock.staticLabels.push(_('moveable'));
    newblock.adjustWidthToLabel();
    newblock.oneBooleanArgBlock();
    if (beginnerMode && !beginnerBlock('movable')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('modelength');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['modelength'] = newblock;
    //.TRANS:  mode length is the number of notes in the mode, e.g., 7 for major and minor scales; 12 for chromatic scales
    newblock.staticLabels.push(_('mode length'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('modelength')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('key');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['key'] = newblock;
    //.TRANS: the key is a group of pitches with which a music composition is created
    newblock.staticLabels.push(_('key'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('key')) {
        newblock.hidden = true;
    }

    // Deprecated
    var newblock = new ProtoBlock('setkey');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['setkey'] = newblock;
    //.TRANS: set the key and mode, e.g. C Major
    newblock.staticLabels.push(_('set key'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'textin';
    newblock.defaults.push('C');
    newblock.hidden = true;

    var newblock = new ProtoBlock('setkey2');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['setkey2'] = newblock;
    //.TRANS: set the key and mode, e.g. C Major
    newblock.staticLabels.push(_('set key'));
    //.TRANS: key, e.g., C in C Major
    newblock.staticLabels.push(_('key'));
    //.TRANS: mode, e.g., Major in C Major
    newblock.staticLabels.push(_('mode'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('setkey2')) {
        newblock.hidden = true;
    }

    // DRUM PALETTE
    var newblock = new ProtoBlock('drumname');
    newblock.palette = palettes.dict['drum'];
    blocks.protoBlockDict['drumname'] = newblock;
    newblock.valueBlock();
    newblock.extraWidth = 50;
    newblock.dockTypes[0] = 'textout';
    if (beginnerMode && !beginnerBlock('drumname')) {
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
    newblock.staticLabels.push(_('floor tom tom'));
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

    // TURTLE PALETTE

    var newblock = new ProtoBlock('heading');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['heading'] = newblock;
    //.TRANS: orientation or compass direction
    newblock.staticLabels.push(_('heading'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('heading')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('y');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['y'] = newblock;
    //.TRANS: y coordinate
    newblock.staticLabels.push(_('y'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('y')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('x');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['x'] = newblock;
    //.TRANS: x coordinate
    newblock.staticLabels.push(_('x'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('x')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('clear');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['clear'] = newblock;
    //.TRANS: erase the screen and return the mice to the center position
    newblock.staticLabels.push(_('clear'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('clear')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('controlpoint2');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['controlpoint2'] = newblock;
    //.TRANS: control point in a bezier curve
    newblock.staticLabels.push(_('control point 2'))
    newblock.staticLabels.push(_('x'), _('y'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push(100);
    newblock.defaults.push(25);
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    if (beginnerMode && !beginnerBlock('controlpoint2')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('controlpoint1');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['controlpoint1'] = newblock;
    //.TRANS: control point in a Bezier curve
    newblock.staticLabels.push(_('control point 1'));
    newblock.staticLabels.push(_('x'), _('y'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push(100);
    newblock.defaults.push(75);
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    if (beginnerMode && !beginnerBlock('controlpoint1')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('bezier');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['bezier'] = newblock;
    //.TRANS: Bézier curves employ at least three points to define a curve
    newblock.staticLabels.push(_('bezier'));
    newblock.staticLabels.push(_('x'), _('y'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push(0);
    newblock.defaults.push(100);
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    if (beginnerMode && !beginnerBlock('bezier')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('arc');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['arc'] = newblock;
    //.TRANS: draws a part of the circumference of a circle
    newblock.staticLabels.push(_('arc'));
    newblock.staticLabels.push(_('angle'), _('radius'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push(90);
    newblock.defaults.push(100);
    newblock.dockTypes[1] = 'numberin';
    if (beginnerMode && !beginnerBlock('arc')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setheading');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['setheading'] = newblock;
    //.TRANS: set compass heading
    newblock.staticLabels.push(_('set heading'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(0);
    if (beginnerMode && !beginnerBlock('setheading')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setxy');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['setxy'] = newblock;
    //.TRANS: set xy position
    newblock.staticLabels.push(_('set xy'));
    newblock.staticLabels.push(_('x'), _('y'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push(0);
    newblock.defaults.push(0);
    newblock.dockTypes[1] = 'numberin';
    if (beginnerMode && !beginnerBlock('setxy')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('right');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['right'] = newblock;
    //.TRANS: turn right (clockwise)
    newblock.staticLabels.push(_('right'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(90);
    if (beginnerMode && !beginnerBlock('right')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('left');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['left'] = newblock;
    //.TRANS: turn left (counter-clockwise)
    newblock.staticLabels.push(_('left'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(90);
    if (beginnerMode && !beginnerBlock('left')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('back');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['back'] = newblock;
    //.TRANS: move backward (in the opposite direction of the current heading)
    newblock.staticLabels.push(_('back'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(100);
    if (beginnerMode && !beginnerBlock('back')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('forward');
    newblock.palette = palettes.dict['mouse'];
    blocks.protoBlockDict['forward'] = newblock;
    //.TRANS: move forward (in the same direction of the current heading)
    newblock.staticLabels.push(_('forward'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(100);
    if (beginnerMode && !beginnerBlock('forward')) {
        newblock.hidden = true;
    }

    // PEN PALETTE

    // macro
    var newblock = new ProtoBlock('purple');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['purple'] = newblock;
    newblock.staticLabels.push(_('purple'));
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('purple')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('blue');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['blue'] = newblock;
    newblock.staticLabels.push(_('blue'));
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('blue')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('green');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['green'] = newblock;
    newblock.staticLabels.push(_('green'));
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('green')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('yellow');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['yellow'] = newblock;
    newblock.staticLabels.push(_('yellow'));
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('yellow')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('orange');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['orange'] = newblock;
    newblock.staticLabels.push(_('orange'));
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('orange')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('red');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['red'] = newblock;
    newblock.staticLabels.push(_('red'));
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('red')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('white');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['white'] = newblock;
    newblock.staticLabels.push(_('white'));
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('white')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('black');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['black'] = newblock;
    newblock.staticLabels.push(_('black'));
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('black')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('beginfill');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['beginfill'] = newblock;
    newblock.staticLabels.push(_('begin fill'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    newblock.hidden = true;
    if (beginnerMode && !beginnerBlock('beginfill')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('endfill');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['endfill'] = newblock;
    newblock.staticLabels.push(_('end fill'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    newblock.hidden = true;

    var newblock = new ProtoBlock('fillscreen');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['fillscreen'] = newblock;
    //.TRANS: set the background color
    newblock.staticLabels.push(_('background'));
    newblock.adjustWidthToLabel();
    newblock.threeArgBlock();
    newblock.hidden = true;

    var newblock = new ProtoBlock('grey');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['grey'] = newblock;
    newblock.staticLabels.push(_('grey'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('grey')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('shade');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['shade'] = newblock;
    newblock.staticLabels.push(_('shade'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('shade')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('color');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['color'] = newblock;
    newblock.staticLabels.push(_('color'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('color')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('pensize');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['pensize'] = newblock;
    newblock.staticLabels.push(_('pen size'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('pensize')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setfont');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setfont'] = newblock;
    newblock.staticLabels.push(_('set font'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(DEFAULTFONT);
    newblock.dockTypes[1] = 'textin';
    if (beginnerMode && !beginnerBlock('setfont')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('background');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['background'] = newblock;
    newblock.staticLabels.push(_('background'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('background')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('hollowline');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['hollowline'] = newblock;
    //.TRANS: draw a line that has a hollow space down its center
    newblock.staticLabels.push(_('hollow line'));
    newblock.adjustWidthToLabel();
    newblock.flowClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('hollowline')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('fill');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['fill'] = newblock;
    //.TRANS: fill in as a solid color
    newblock.staticLabels.push(_('fill'));
    newblock.adjustWidthToLabel();
    newblock.flowClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('fill')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('penup');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['penup'] = newblock;
    //.TRANS: riase up the pen so that it does not draw when it is moved
    newblock.staticLabels.push(_('pen up'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('penup')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('pendown');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['pendown'] = newblock;
    //.TRANS: put down the pen so that it draws when it is moved
    newblock.staticLabels.push(_('pen down'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('pendown')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setpensize');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setpensize'] = newblock;
    //.TRANS: set the width of the line drawn by the pen
    newblock.staticLabels.push(_('set pen size'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(5);
    if (beginnerMode && !beginnerBlock('setpensize')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('settranslucency');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['settranslucency'] = newblock;
    //.TRANS: set degree of translucence of the pen color
    newblock.staticLabels.push(_('set translucency'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(50);
    if (beginnerMode && !beginnerBlock('settranslucency')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('sethue');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['sethue'] = newblock;
    newblock.staticLabels.push(_('set hue'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(0);
    if (beginnerMode && !beginnerBlock('sethue')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setshade');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setshade'] = newblock;
    newblock.staticLabels.push(_('set shade'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(50);
    if (beginnerMode && !beginnerBlock('setshade')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setgrey');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setgrey'] = newblock;
    //.TRANS: set the level of vividness of the pen color
    newblock.staticLabels.push(_('set grey'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(100);
    if (beginnerMode && !beginnerBlock('setgrey')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setcolor');
    newblock.palette = palettes.dict['pen'];
    blocks.protoBlockDict['setcolor'] = newblock;
    newblock.staticLabels.push(_('set color'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(0);
    if (beginnerMode && !beginnerBlock('setcolor')) {
        newblock.hidden = true;
    }

    // NUMBERS PALETTE

    var newblock = new ProtoBlock('int');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['int'] = newblock;
    //.TRANS: convert a real number to an integer
    newblock.staticLabels.push(_('int'));
    newblock.adjustWidthToLabel();
    newblock.oneArgMathBlock();
    newblock.defaults.push(100)
    if (beginnerMode && !beginnerBlock('int')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('not');
    newblock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['not'] = newblock;
    newblock.extraWidth = 30;
    newblock.staticLabels.push(_('not'));
    newblock.booleanOneBooleanArgBlock();
    if (beginnerMode && !beginnerBlock('not')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('and');
    newblock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['and'] = newblock;
    newblock.extraWidth = 10;
    newblock.staticLabels.push(_('and'));
    newblock.booleanTwoBooleanArgBlock();
    if (beginnerMode && !beginnerBlock('and')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('or');
    newblock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['or'] = newblock;
    newblock.extraWidth = 10;
    newblock.staticLabels.push(_('or'));
    newblock.booleanTwoBooleanArgBlock();
    if (beginnerMode && !beginnerBlock('or')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('greater');
    newblock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['greater'] = newblock;
    newblock.fontsize = 14;
    newblock.staticLabels.push('>');
    newblock.extraWidth = 20;
    newblock.booleanTwoArgBlock();
    if (beginnerMode && !beginnerBlock('greater')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('less');
    newblock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['less'] = newblock;
    newblock.fontsize = 14;
    newblock.staticLabels.push('<');
    newblock.extraWidth = 20;
    newblock.booleanTwoArgBlock();
    if (beginnerMode && !beginnerBlock('less')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('equal');
    newblock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['equal'] = newblock;
    newblock.fontsize = 14;
    newblock.staticLabels.push('=');
    newblock.extraWidth = 20;
    newblock.booleanTwoArgBlock();
    newblock.dockTypes[0] = 'booleanout';
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('equal')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('boolean');
    newblock.palette = palettes.dict['boolean'];
    blocks.protoBlockDict['boolean'] = newblock;
    newblock.booleanZeroArgBlock();
    if (beginnerMode && !beginnerBlock('boolean')) {
        newblock.hidden = true;
    }

    // Only used to excute methods in the Math library
    /*
    var newblock = new ProtoBlock('eval');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['eval'] = newblock;
    //.TRANS: evaluate some math functions, e.g., absolute value, sine, exponential, etc.
    newblock.staticLabels.push(_('eval'));
    newblock.staticLabels.push('f(x)');
    newblock.staticLabels.push('x');
    newblock.adjustWidthToLabel();
    newblock.twoArgMathBlock();
    newblock.dockTypes[1] = 'textin';
    newblock.defaults.push('abs(x)');
    newblock.hidden = true;  // security hole
    newblock.defaults.push(-100);
    */

    var newblock = new ProtoBlock('mod');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['mod'] = newblock;
    newblock.staticLabels.push(_('mod'));
    newblock.adjustWidthToLabel();
    newblock.twoArgMathBlock();
    newblock.defaults.push(100, 10)
    if (beginnerMode && !beginnerBlock('mod')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('power');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['power'] = newblock;
    newblock.fontsize = 14;
    newblock.staticLabels.push('^');
    newblock.twoArgMathBlock();
    newblock.defaults.push(2, 4)
    if (beginnerMode && !beginnerBlock('power')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('sqrt');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['sqrt'] = newblock;
    // TRANS: square root function in mathematics
    newblock.staticLabels.push(_('sqrt'));
    newblock.adjustWidthToLabel();
    newblock.oneArgMathBlock();
    newblock.defaults.push(64)
    if (beginnerMode && !beginnerBlock('sqrt')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('abs');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['abs'] = newblock;
    // TRANS: absolute value function in mathematics
    newblock.staticLabels.push(_('abs'));
    newblock.adjustWidthToLabel();
    newblock.oneArgMathBlock();
    if (beginnerMode && !beginnerBlock('abs')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('divide');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['divide'] = newblock;
    newblock.fontsize = 14;
    newblock.staticLabels.push('/');
    newblock.twoArgMathBlock();
    newblock.defaults.push(1, 4)
    if (beginnerMode && !beginnerBlock('divide')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('multiply');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['multiply'] = newblock;
    newblock.fontsize = 14;
    newblock.staticLabels.push('×');
    newblock.twoArgMathBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.defaults.push(1, 12)
    if (beginnerMode && !beginnerBlock('multiply')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('neg');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['neg'] = newblock;
    newblock.fontsize = 14;
    newblock.staticLabels.push('–');
    newblock.oneArgMathBlock();
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('neg')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('minus');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['minus'] = newblock;
    newblock.fontsize = 14;
    newblock.staticLabels.push('–');
    newblock.twoArgMathBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.defaults.push(8, 4)
    if (beginnerMode && !beginnerBlock('minus')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('plus');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['plus'] = newblock;
    newblock.fontsize = 14;
    newblock.staticLabels.push('+');
    newblock.twoArgMathBlock();
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.defaults.push(2, 2)
    if (beginnerMode && !beginnerBlock('plus')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('oneOf');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['oneOf'] = newblock;
    newblock.staticLabels.push(_('one of'), _('this'), _('that'));
    newblock.adjustWidthToLabel();
    newblock.twoArgMathBlock();
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.defaults.push(-90, 90);
    if (beginnerMode && !beginnerBlock('oneOf')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('random');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['random'] = newblock;
    newblock.staticLabels.push(_('random'), _('min'), _('max'));
    newblock.adjustWidthToLabel();
    newblock.twoArgMathBlock();
    newblock.defaults.push(0, 12);
    if (beginnerMode && !beginnerBlock('random')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('number');
    newblock.palette = palettes.dict['number'];
    blocks.protoBlockDict['number'] = newblock;
    newblock.valueBlock();
    if (beginnerMode && !beginnerBlock('number')) {
        newblock.hidden = true;
    }

    // BLOCKS PALETTE

    var newblock = new ProtoBlock('incrementOne');
    newblock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['incrementOne'] = newblock;
    newblock.staticLabels.push(_('add 1 to'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    if (beginnerMode && !beginnerBlock('incrementOne')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('increment');
    newblock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['increment'] = newblock;
    newblock.staticLabels.push(_('add'), _('to'), _('value'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('increment')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('box');
    if (beginnerMode && !beginnerBlock('box')) {
	newblock.palette = palettes.dict['extras'];
    } else {
	newblock.palette = palettes.dict['boxes'];
    }
    blocks.protoBlockDict['box'] = newblock;
    //.TRANS: a container into which to put something
    newblock.staticLabels.push(_('box'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.oneArgMathBlock();
    newblock.defaults.push(_('box'));
    newblock.dockTypes[0] = 'anyout';
    // Show the value in the box as if it were a parameter.
    newblock.parameter = true;
    newblock.dockTypes[1] = 'anyin';

    var newblock = new ProtoBlock('namedbox');
    if (beginnerMode && !beginnerBlock('namedbox')) {
	newblock.palette = palettes.dict['extras'];
    } else {
	newblock.palette = palettes.dict['boxes'];
    }
    blocks.protoBlockDict['namedbox'] = newblock;
    newblock.staticLabels.push(_('box'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.dockTypes[0] = 'anyout';

    var newblock = new ProtoBlock('storein2');
    if (beginnerMode && !beginnerBlock('storein2')) {
	newblock.palette = palettes.dict['extras'];
    } else {
	newblock.palette = palettes.dict['boxes'];
    }
    blocks.protoBlockDict['storein2'] = newblock;
    newblock.staticLabels.push(_('store in box'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(4);
    newblock.dockTypes[1] = 'anyin';

    var newblock = new ProtoBlock('storein');
    if (beginnerMode && !beginnerBlock('storein')) {
	newblock.palette = palettes.dict['extras'];
    } else {
	newblock.palette = palettes.dict['boxes'];
    }
    blocks.protoBlockDict['storein'] = newblock;
    //.TRANS: put something into a container for later reference
    newblock.staticLabels.push(_('store in'));
    newblock.staticLabels.push(_('name'), _('value'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push(_('box'));
    newblock.defaults.push(4);
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';

    // macro
    var newblock = new ProtoBlock('box2');
    newblock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['box2'] = newblock;
    newblock.staticLabels.push(_('box 2'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.dockTypes[0] = 'anyout';
    if (beginnerMode && !beginnerBlock('box2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('storebox2');
    newblock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['storebox2'] = newblock;
    newblock.staticLabels.push(_('store in box 2'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(4);
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('storebox2')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('box1');
    newblock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['box1'] = newblock;
    newblock.staticLabels.push(_('box 1'));
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.dockTypes[0] = 'anyout';
    if (beginnerMode && !beginnerBlock('box1')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('storebox1');
    newblock.palette = palettes.dict['boxes'];
    blocks.protoBlockDict['storebox1'] = newblock;
    newblock.staticLabels.push(_('store in box 1'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(4);
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('storebox1')) {
        newblock.hidden = true;
    }

    // ACTIONS PALETTE

    var newblock = new ProtoBlock('do');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['do'] = newblock;
    newblock.staticLabels.push(_('do'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    //.TRANS: a stack of blocks to run (an action to take)
    newblock.defaults.push(_('action'));
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('do')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('return');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['return'] = newblock;
    //.TRANS: return value from a function
    newblock.staticLabels.push(_('return'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(100);
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('return')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('returnToUrl');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['returnToUrl'] = newblock;
    //.TRANS: return value from a function to a URL
    newblock.staticLabels.push(_('return to URL'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(_('100'));
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('returnToUrl')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('calc');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['calc'] = newblock;
    newblock.staticLabels.push(_('calculate'));
    newblock.adjustWidthToLabel();
    newblock.oneArgMathBlock();
    newblock.defaults.push(_('action'));
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('calc')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('namedcalc');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['namedcalc'] = newblock;
    newblock.staticLabels.push(_('action'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('namedcalc')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('nameddoArg');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['nameddoArg'] = newblock;
    //.TRANS: take (do) some action
    newblock.staticLabels.push(_('do'));
    newblock.adjustWidthToLabel();
    newblock.argClampBlock();
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('nameddoArg')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('namedcalcArg');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['namedcalcArg'] = newblock;
    newblock.staticLabels.push(_('calculate'));
    newblock.adjustWidthToLabel();
    newblock.argClampMathBlock();
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('namedcalcArg')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('doArg');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['doArg'] = newblock;
    newblock.staticLabels.push(_('do'));
    newblock.adjustWidthToLabel();
    newblock.argClampOneArgBlock();
    newblock.defaults.push(_('action'));
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('doArg')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('calcArg');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['calcArg'] = newblock;
    newblock.staticLabels.push(_('calculate'));
    newblock.adjustWidthToLabel();
    newblock.argClampOneArgMathBlock();
    newblock.defaults.push(_('action'));
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('calcArg')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('arg');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['arg'] = newblock;
    newblock.staticLabels.push('arg');
    newblock.adjustWidthToLabel();
    newblock.oneArgMathBlock();
    newblock.defaults.push(1);
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'numberin';
    if (beginnerMode && !beginnerBlock('arg')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('namedarg');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['namedarg'] = newblock;
    newblock.staticLabels.push('arg ' + 1);
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('namedarg')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('listen');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['listen'] = newblock;
    //.TRANS: an event, such as user actions (mouse clicks, key presses)
    newblock.staticLabels.push(_('on'));
    newblock.staticLabels.push(_('event'), _('do'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    //.TRANS: a condition that is broadcast in order to trigger a listener to take an action
    newblock.defaults.push(_('event'));
    newblock.defaults.push(_('action'));
    newblock.dockTypes[1] = 'textin';
    newblock.dockTypes[2] = 'textin';
    if (beginnerMode && !beginnerBlock('listen')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('dispatch');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['dispatch'] = newblock;
    //.TRANS: dispatch an event to trigger a listener
    newblock.staticLabels.push(_('broadcast'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(_('event'));
    newblock.dockTypes[1] = 'textin';
    if (beginnerMode && !beginnerBlock('dispatch')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('startdrum');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['startdrum'] = newblock;
    //.TRANS: start block with an embedded set drum block
    newblock.staticLabels.push(_('start drum'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.stackClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('startdrum')) {
        newblock.hidden = true;
    }

    // Deprecated
    var newblock = new ProtoBlock('drum');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['drum'] = newblock;
    newblock.staticLabels.push(_('start drum'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.stackClampZeroArgBlock();
    newblock.hidden = true;

    var newblock = new ProtoBlock('start');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['start'] = newblock;
    newblock.staticLabels.push(_('start'));
    newblock.extraWidth = 40;
    newblock.labelOffset = 15;
    newblock.adjustWidthToLabel();
    newblock.stackClampZeroArgBlock();

    var newblock = new ProtoBlock('action');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['action'] = newblock;
    newblock.staticLabels.push(_('action'));
    newblock.extraWidth = 42;
    newblock.labelOffset = 15;
    newblock.adjustWidthToLabel();
    newblock.stackClampOneArgBlock();
    newblock.defaults.push(_('action'));

    var newblock = new ProtoBlock('nameddo');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['nameddo'] = newblock;
    newblock.staticLabels.push(_('action'));
    newblock.extraWidth = 40;
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    // nameddo stays hidden until first action block is used.
    if (!beginnerMode) {
        newblock.hidden = true;
    }

    // HEAP PALETTE

    var newblock = new ProtoBlock('loadHeapFromApp');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['loadHeapFromApp'] = newblock;
    //.TRANS: load the heap contents from a URL
    newblock.staticLabels.push(_('load heap from App'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'textin';
    newblock.dockTypes[2] = 'textin';
    newblock.defaults.push('appName')
    newblock.defaults.push('localhost');
    if (beginnerMode && !beginnerBlock('loadHeapFromApp')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('saveHeapToApp');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['saveHeapToApp'] = newblock;
    //.TRANS: save the heap contents to a URL
    newblock.staticLabels.push(_('save heap to App'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'textin';
    newblock.dockTypes[2] = 'textin';
    newblock.defaults.push('appName')
    newblock.defaults.push('localhost');
    if (beginnerMode && !beginnerBlock('saveHeapToApp')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('showHeap');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['showHeap'] = newblock;
    //.TRANS: Display the heap contents
    newblock.staticLabels.push(_('show heap'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('showHeap')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('heapLength');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['heapLength'] = newblock;
    //.TRANS: How many entries are in the heap?
    newblock.staticLabels.push(_('heap length'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.dockTypes[0] = 'numberout';
    if (beginnerMode && !beginnerBlock('heapLength')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('heapEmpty');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['heapEmpty'] = newblock;
    //.TRANS: Is the heap empty?
    newblock.staticLabels.push(_('heap empty?'));
    newblock.adjustWidthToLabel();
    newblock.booleanZeroArgBlock();
    if (beginnerMode && !beginnerBlock('heapEmpty')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('emptyHeap');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['emptyHeap'] = newblock;
    //.TRANS: empty the heap
    newblock.staticLabels.push(_('empty heap'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('emptyHeap')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('saveHeap');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['saveHeap'] = newblock;
    //.TRANS: save the heap to a file
    newblock.staticLabels.push(_('save heap'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push('heap.json');
    newblock.dockTypes[1] = 'textin';
    if (beginnerMode && !beginnerBlock('saveHeap')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('loadHeap');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['loadHeap'] = newblock;
    //.TRANS: load the heap from a file
    newblock.staticLabels.push(_('load heap'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'filein';
    newblock.defaults = [[null, null]];
    if (beginnerMode && !beginnerBlock('loadHeap')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('reverseHeap');
    newblock.palette = palettes.dict['heap'];
    //.TRANS: reverse the order of the heap
    blocks.protoBlockDict['reverseHeap'] = newblock;
    newblock.staticLabels.push(_('reverse heap'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('reverseHeap')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('indexHeap');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['indexHeap'] = newblock;
    //.TRANS: retrieve a value from the heap at index position in the heap
    newblock.staticLabels.push(_('index heap'));
    newblock.adjustWidthToLabel();
    newblock.oneArgMathBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.defaults.push(1);
    if (beginnerMode && !beginnerBlock('indexHeap')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setHeapEntry');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['setHeapEntry'] = newblock;
    //.TRANS: set a value in the heap
    newblock.staticLabels.push(_('set heap'), _('index'), _('value'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'anyin';
    newblock.defaults.push(1);
    newblock.defaults.push(100);
    if (beginnerMode && !beginnerBlock('setHeapEntry')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('pop');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['pop'] = newblock;
    //.TRANS: pop a value off the top of the heap
    newblock.staticLabels.push(_('pop'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('pop')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('push');
    newblock.palette = palettes.dict['heap'];
    blocks.protoBlockDict['push'] = newblock;
    //.TRANS: push a value onto the top of the heap
    newblock.staticLabels.push(_('push'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(1);
    if (beginnerMode && !beginnerBlock('push')) {
        newblock.hidden = true;
    }

    // MEDIA PALETTE

    var newblock = new ProtoBlock('rightpos');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['rightpos'] = newblock;
    newblock.staticLabels.push(_('right'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('rightpos')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('leftpos');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['leftpos'] = newblock;
    newblock.staticLabels.push(_('left'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('leftpos')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('toppos');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['toppos'] = newblock;
    newblock.staticLabels.push(_('top'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('toppos')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('bottompos');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['bottompos'] = newblock;
    newblock.staticLabels.push(_('bottom'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('bottompos')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('width');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['width'] = newblock;
    newblock.staticLabels.push(_('width'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('width')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('height');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['height'] = newblock;
    newblock.staticLabels.push(_('height'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('height')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('stopplayback');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['stopplayback'] = newblock;
    //.TRANS: stops playback of an audio recording
    newblock.staticLabels.push(_('stop play'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('stopplayback')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('playback');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['playback'] = newblock;
    newblock.defaults.push(null);
    //.TRANS: play an audio recording
    newblock.staticLabels.push(_('play back'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'mediain';
    if (beginnerMode && !beginnerBlock('playback')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('speak');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['speak'] = newblock;
    newblock.staticLabels.push(_('speak'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push('hello');
    newblock.dockTypes[1] = 'textin';
    if (beginnerMode && !beginnerBlock('speak')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('camera');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['camera'] = newblock;
    newblock.image = 'images/camera.svg'
    newblock.mediaBlock();
    if (beginnerMode && !beginnerBlock('camera')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('video');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['video'] = newblock;
    newblock.image = 'images/video.svg'
    newblock.mediaBlock();
    if (beginnerMode && !beginnerBlock('video')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('loadFile');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['loadFile'] = newblock;
    newblock.staticLabels.push('');
    newblock.parameterBlock();
    newblock.dockTypes[0] = 'fileout';
    if (beginnerMode && !beginnerBlock('loadFile')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('stopvideocam');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['stopvideocam'] = newblock;
    newblock.staticLabels.push(_('stop media'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('stopvideocam')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('tone');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['tone'] = newblock;
    newblock.staticLabels.push(_('hertz'),  _('frequency'), _('duration (ms)'));
    newblock.adjustWidthToLabel();
    newblock.defaults.push(392, 1000 / 3);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    if (beginnerMode && !beginnerBlock('tone')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('tofrequency');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['tofrequency'] = newblock;
    //.TRANS: translate a note into hertz, e.g., A4 -> 440HZ
    newblock.staticLabels.push(_('note to frequency'), _('name'), _('octave'));
    newblock.adjustWidthToLabel();
    newblock.defaults.push('G');
    newblock.defaults.push(4);
    newblock.twoArgMathBlock();
    newblock.dockTypes[1] = 'notein';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('tofrequency')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('turtleshell');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['turtleshell'] = newblock;
    //.TRANS: Shell is the shell of a turtle (used as a metaphor for changing the appearance of a sprite)
    newblock.staticLabels.push(_('shell'), _('size'), _('image'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push(55);
    newblock.defaults.push(null);
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'mediain';
    if (beginnerMode && !beginnerBlock('turtleshell')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('show');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['show'] = newblock;
    //.TRANS: a media object
    newblock.staticLabels.push(_('show'), _('size'), _('obj'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push(24);
    newblock.defaults.push(_('text'));
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('show')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('media');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['media'] = newblock;
    newblock.image = 'images/load-media.svg'
    newblock.mediaBlock();
    newblock.dockTypes[0] = 'mediaout';
    if (beginnerMode && !beginnerBlock('media')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('text');
    newblock.palette = palettes.dict['media'];
    blocks.protoBlockDict['text'] = newblock;
    newblock.extraWidth = 30;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    if (beginnerMode && !beginnerBlock('text')) {
        newblock.hidden = true;
    }

    // FLOW PALETTE

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

    var newblock = new ProtoBlock('defaultcase');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['defaultcase'] = newblock;
    //.TRANS: the default case used in a switch statement in programming
    newblock.staticLabels.push(_('default'));
    newblock.adjustWidthToLabel();
    newblock.flowClampBlock();
    if (beginnerMode && !beginnerBlock('defaultcase')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('case');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['case'] = newblock;
    //.TRANS: the case statement used in a switch statement in programming
    newblock.staticLabels.push(_('case'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('case')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('switch');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['switch'] = newblock;
    //.TRANS: the switch statement used in programming
    newblock.staticLabels.push(_('switch'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('switch')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('clamp');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['clamp'] = newblock;
    newblock.flowClampBlock();
    newblock.hidden = true;
    if (beginnerMode && !beginnerBlock('clamp')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('break');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['break'] = newblock;
    newblock.staticLabels.push(_('stop'));
    newblock.adjustWidthToLabel();
    newblock.basicBlockNoFlow();
    if (beginnerMode && !beginnerBlock('break')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('waitFor');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['waitFor'] = newblock;
    newblock.staticLabels.push(_('wait for'));
    newblock.adjustWidthToLabel();
    newblock.oneBooleanArgBlock();
    if (beginnerMode && !beginnerBlock('waitFor')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('until');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['until'] = newblock;
    newblock.staticLabels.push(_('until'), _('do'));
    newblock.extraWidth = 15;
    newblock.adjustWidthToLabel();
    newblock.flowClampBooleanArgBlock();
    if (beginnerMode && !beginnerBlock('until')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('while');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['while'] = newblock;
    newblock.staticLabels.push(_('while'), _('do'));
    newblock.extraWidth = 15;
    newblock.adjustWidthToLabel();
    newblock.flowClampBooleanArgBlock();
    if (beginnerMode && !beginnerBlock('while')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('ifthenelse');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['ifthenelse'] = newblock;
    newblock.staticLabels.push(_('if'), _('then'), _('else'));
    newblock.extraWidth = 15;
    newblock.adjustWidthToLabel();
    newblock.doubleFlowClampBooleanArgBlock();
    if (beginnerMode && !beginnerBlock('ifthenelse')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('if');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['if'] = newblock;
    newblock.staticLabels.push(_('if'), _('then'));
    newblock.extraWidth = 15;
    newblock.adjustWidthToLabel();
    newblock.flowClampBooleanArgBlock();
    if (beginnerMode && !beginnerBlock('if')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('forever');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['forever'] = newblock;
    newblock.staticLabels.push(_('forever'));
    newblock.adjustWidthToLabel();
    newblock.flowClampZeroArgBlock();
    if (beginnerMode && !beginnerBlock('forever')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('repeat');
    newblock.palette = palettes.dict['flow'];
    blocks.protoBlockDict['repeat'] = newblock;
    newblock.staticLabels.push(_('repeat'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(4);
    if (beginnerMode && !beginnerBlock('repeat')) {
        newblock.hidden = true;
    }

    // EXTRAS PALETTE

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

    var newblock = new ProtoBlock('openpalette');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['openpalette'] = newblock;
    //.TRANS: Open a palette of blocks.
    newblock.staticLabels.push(_('open palette'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'textin';
    newblock.defaults.push(_('Rhythm'));
    if (beginnerMode && !beginnerBlock('openpalette')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('deleteblock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['deleteblock'] = newblock;
    //.TRANS: Move this block to the trash.
    newblock.staticLabels.push(_('delete block'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'numberin';
    if (beginnerMode && !beginnerBlock('deleteblock')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('moveblock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['moveblock'] = newblock;
    //.TRANS: Move the position of a block on the screen.
    newblock.staticLabels.push(_('move block'), _('block number'), _('x'), _('y'));
    newblock.adjustWidthToLabel();
    newblock.threeArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    newblock.dockTypes[3] = 'numberin';
    if (beginnerMode && !beginnerBlock('moveblock')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('runblock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['runblock'] = newblock;
    //.TRANS: Run program beginning at this block.
    newblock.staticLabels.push(_('run block'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'numberin';
    if (beginnerMode && !beginnerBlock('runblock')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('dockblock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['dockblock'] = newblock;
    //.TRANS: We can connect a block to another block.
    newblock.staticLabels.push(_('connect blocks'), _('target block'), _('connection number'), _('block number'));
    newblock.adjustWidthToLabel();
    newblock.threeArgBlock();
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    newblock.dockTypes[3] = 'numberin';
    if (beginnerMode && !beginnerBlock('dockblock')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('makeblock');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['makeblock'] = newblock;
    //.TRANS: Create a new block programmatically.
    newblock.staticLabels.push(_('make block'));
    newblock.adjustWidthToLabel();
    newblock.argClampOneArgMathBlock();
    newblock.defaults.push(_('note'));
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('makeblock')) {
        newblock.hidden = true;
    }

    // deprecated in favor of save button
    var newblock = new ProtoBlock('saveabc');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['saveabc'] = newblock;
    newblock.staticLabels.push(_('save as ABC'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(_('title') + '.abc');
    newblock.dockTypes[1] = 'textin';
    newblock.hidden = true;
    if (beginnerMode && !beginnerBlock('saveabc')) {
        newblock.hidden = true;
    }

    // deprecated in favor of save button
    var newblock = new ProtoBlock('savelilypond');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['savelilypond'] = newblock;
    newblock.staticLabels.push(_('save as lilypond'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(_('title') + '.ly');
    newblock.dockTypes[1] = 'textin';
    newblock.hidden = true;
    if (beginnerMode && !beginnerBlock('savelilypond')) {
        newblock.hidden = true;
    }

    // deprecated in favor of save button
    var newblock = new ProtoBlock('savesvg');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['savesvg'] = newblock;
    newblock.staticLabels.push(_('save svg'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(_('title') + '.svg');
    newblock.dockTypes[1] = 'textin';
    newblock.hidden = true;
    if (beginnerMode && !beginnerBlock('savesvg')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('nobackground');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['nobackground'] = newblock;
    newblock.staticLabels.push(_('no background'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('nobackground')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('showblocks');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['showblocks'] = newblock;
    newblock.staticLabels.push(_('show blocks'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('showblocks')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('hideblocks');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['hideblocks'] = newblock;
    newblock.staticLabels.push(_('hide blocks'));
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('hideblocks')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('openProject');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['openProject'] = newblock;
    newblock.staticLabels.push(_('open project'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push('url');
    newblock.dockTypes[1] = 'textin';
    if (beginnerMode && !beginnerBlock('openProject')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('vspace');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['vspace'] = newblock;
    newblock.staticLabels.push('↓');
    newblock.extraWidth = -10;
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('vspace')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('hspace');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['hspace'] = newblock;
    newblock.staticLabels.push('←');
    newblock.oneArgMathBlock();
    newblock.dockTypes[0] = 'anyout';
    newblock.dockTypes[1] = 'anyin';
    if (beginnerMode && !beginnerBlock('hspace')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('wait');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['wait'] = newblock;
    newblock.staticLabels.push(_('wait'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.defaults.push(1);
    if (beginnerMode && !beginnerBlock('wait')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('comment');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['comment'] = newblock;
    newblock.staticLabels.push(_('comment'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Music Blocks'));
    if (beginnerMode && !beginnerBlock('comment')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('print');
    newblock.palette = palettes.dict['extras'];
    blocks.protoBlockDict['print'] = newblock;
    newblock.staticLabels.push(_('print'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Music Blocks'));
    if (beginnerMode && !beginnerBlock('print')) {
        newblock.hidden = true;
    }

    // SENSORS PALETTE

    var newblock = new ProtoBlock('pitchness');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['pitchness'] = newblock;
    newblock.staticLabels.push(_('pitch'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('pitchness')) {
        newblock.hidden = true;
    }
    newblock.hidden = true;

    var newblock = new ProtoBlock('loudness');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['loudness'] = newblock;
    newblock.staticLabels.push(_('loudness'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('loudness')) {
        newblock.hidden = true;
    }

    // Turtle-specific click event
    var newblock = new ProtoBlock('myclick');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['myclick'] = newblock;
    newblock.staticLabels.push(_('click'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.dockTypes[0] = 'textout';
    if (beginnerMode && !beginnerBlock('myclick')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('getblue');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['getblue'] = newblock;
    newblock.staticLabels.push(_('blue'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('getblue')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('getgreen');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['getgreen'] = newblock;
    newblock.staticLabels.push(_('green'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('getgreen')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('getred');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['getred'] = newblock;
    newblock.staticLabels.push(_('red'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('getred')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('getcolorpixel');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['getcolorpixel'] = newblock;
    newblock.staticLabels.push(_('pixel color'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('getcolorpixel')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('time');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['time'] = newblock;
    newblock.staticLabels.push(_('time'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('time')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('mousey');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['mousey'] = newblock;
    newblock.staticLabels.push(_('cursor y'));
    newblock.extraWidth = 15;
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('mousey')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('mousex');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['mousex'] = newblock;
    newblock.staticLabels.push(_('cursor x'));
    newblock.extraWidth = 15;
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('mousex')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('mousebutton');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['mousebutton'] = newblock;
    newblock.staticLabels.push(_('mouse button'));
    newblock.adjustWidthToLabel();
    newblock.booleanZeroArgBlock();
    if (beginnerMode && !beginnerBlock('mousebutton')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('toascii');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['toascii'] = newblock;
    newblock.staticLabels.push(_('to ASCII'));
    newblock.defaults.push(65);
    newblock.oneArgMathBlock();
    if (beginnerMode && !beginnerBlock('toascii')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('keyboard');
    newblock.palette = palettes.dict['sensors'];
    blocks.protoBlockDict['keyboard'] = newblock;
    newblock.staticLabels.push(_('keyboard'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('keyboard')) {
        newblock.hidden = true;
    }

    // Mice palette (blocks for interacting between mice)

    var newblock = new ProtoBlock('stopTurtle');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['stopTurtle'] = newblock;
    newblock.staticLabels.push(_('stop mouse'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('stopTurtle')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('startTurtle');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['startTurtle'] = newblock;
    newblock.staticLabels.push(_('start mouse'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('startTurtle')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('turtlecolor');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlecolor'] = newblock;
    //.TRANS: pen color for this mouse
    newblock.staticLabels.push(_('mouse color'));
    newblock.adjustWidthToLabel();
    newblock.oneArgMathBlock();;
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('turtlecolor')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('turtleheading');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtleheading'] = newblock;
    //.TRANS: heading (compass direction) for this mouse
    newblock.staticLabels.push(_('mouse heading'));
    newblock.oneArgMathBlock();;
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('turtleheading')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setxyturtle');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['setxyturtle'] = newblock;
    //.TRANS: set xy position for this mouse
    newblock.staticLabels.push(_('set mouse'), _('name'), _('x'), _('y'));
    newblock.threeArgBlock();
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'numberin';
    newblock.dockTypes[3] = 'numberin';
    newblock.defaults.push(_('Mr. Mouse'), 0, 0);
    newblock.hidden = true;
    if (beginnerMode && !beginnerBlock('setxyturtle')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setturtle');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['setturtle'] = newblock;
    newblock.staticLabels.push(_('set mouse'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('setturtle')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('yturtle');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['yturtle'] = newblock;
    //.TRANS: y position for this mouse
    newblock.staticLabels.push(_('mouse y'));
    newblock.oneArgMathBlock();
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('yturtle')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('xturtle');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['xturtle'] = newblock;
    //.TRANS: x position for this mouse
    newblock.staticLabels.push(_('mouse x'));
    newblock.oneArgMathBlock();
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('xturtle')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('turtleelapsednotes');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtleelapsednotes'] = newblock;
    //.TRANS: notes played by this mouse
    newblock.staticLabels.push(_('mouse notes played'));
    newblock.oneArgMathBlock();
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('turtleelapsednotes')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('turtlepitch');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlepitch'] = newblock;
    //.TRANS: convert current note for this turtle to piano key (1-88)
    newblock.staticLabels.push(_('mouse pitch number'));
    newblock.oneArgMathBlock();
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('turtlepitch')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('turtlenote');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlenote'] = newblock;
    newblock.staticLabels.push(_('mouse note value'));
    newblock.oneArgMathBlock();
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'anyin';
    newblock.hidden = true;
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('turtlenote')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('turtlenote2');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlenote2'] = newblock;
    newblock.staticLabels.push(_('mouse note value'));
    newblock.oneArgMathBlock();
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('turtlenote2')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('turtlesync');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlesync'] = newblock;
    newblock.staticLabels.push(_('mouse sync'));
    newblock.oneArgBlock();
    newblock.adjustWidthToLabel();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('turtlesync')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('foundturtle');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['foundturtle'] = newblock;
    newblock.staticLabels.push(_('found mouse'));
    newblock.adjustWidthToLabel();
    newblock.extraWidth = 50;
    newblock.booleanOneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('foundturtle')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('newturtle');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['newturtle'] = newblock;
    newblock.staticLabels.push(_('new mouse'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('newturtle')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('turtlename');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['turtlename'] = newblock;
    newblock.staticLabels.push(_('mouse name'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.dockTypes[0] = 'textout';
    if (beginnerMode && !beginnerBlock('turtlename')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setturtlename');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['setturtlename'] = newblock;
    newblock.staticLabels.push(_('set name'));
    newblock.staticLabels.push(_('source'));
    newblock.staticLabels.push(_('target'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.defaults.push(-1);
    newblock.defaults.push(_('Mr. Mouse'));
    newblock.hidden = true;
    if (beginnerMode && !beginnerBlock('setturtlename')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('setturtlename2');
    newblock.palette = palettes.dict['mice'];
    blocks.protoBlockDict['setturtlename2'] = newblock;
    newblock.staticLabels.push(_('set name'));
    newblock.adjustWidthToLabel();
    newblock.oneArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.defaults.push(_('Mr. Mouse'));
    if (beginnerMode && !beginnerBlock('setturtlename2')) {
        newblock.hidden = true;
    }

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
    newblock.defaults.push('default');
    newblock.defaults.push(50);
    newblock.hidden = true;

    var newblock = new ProtoBlock('setsynthvolume');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['setsynthvolume'] = newblock;
    //.TRANS: set the loudness level
    newblock.staticLabels.push(_('set synth volume'), _('synth'), _('volume'));
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'textin';
    newblock.defaults.push('default');
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
    var newblock = new ProtoBlock('crescendo');
    newblock.palette = palettes.dict['volume'];
    blocks.protoBlockDict['crescendo'] = newblock;
    //.TRANS: a gradual increase in loudness
    newblock.staticLabels.push(_('crescendo') + ' (+/–)');
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
