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

    // PITCH PALETTE

    var newblock = new ProtoBlock('rest');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['rest'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    newblock.hidden = true;
    newblock.deprecated = true;

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
    newblock.deprecated = true;

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
    newblock.deprecated = true;

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
    newblock.deprecated = true;

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
    newblock.deprecated = true;

    // Status blocks
    var newblock = new ProtoBlock('invertmode');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invertmode'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    newblock.extraWidth = 50;
    newblock.hidden = true;

    var newblock = new ProtoBlock('transpositionfactor');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['transpositionfactor'] = newblock;
    //.TRANS: musical transposition (adjustment of pitch up or down)
    newblock.staticLabels.push(_('transposition'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.hidden = true;

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
    //.TRANS: the change measured in half-steps between the current pitch and the previous pitch
    newblock.staticLabels.push(_('change in pitch'));
    newblock.parameterBlock();
    newblock.adjustWidthToLabel();
    if (language === 'ja' && beginnerMode && !beginnerBlock('deltapitch')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('deltapitch2');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['deltapitch2'] = newblock;
    //.TRANS: the change measured in scale-steps between the current pitch and the previous pitch
    newblock.staticLabels.push(_('scalar change in pitch'));
    newblock.parameterBlock();
    newblock.adjustWidthToLabel();
    if (language === 'ja' && beginnerMode && !beginnerBlock('deltapitch2')) {
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

    var newblock = new ProtoBlock('pitchinhertz');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitchinhertz'] = newblock;
    //.TRANS: the current pitch expressed in Hertz
    newblock.staticLabels.push(_('pitch in hertz'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('pitchinhertz')) {
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
    if (language === 'ja') {
        //.TRANS: name2 is name as in name of pitch (JAPANESE ONLY)
        newblock.staticLabels.push(_('name2'));
        newblock.staticLabels.push(_('octave'));
    } else {
        newblock.staticLabels.push(_('name'), _('octave'));
    }
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
    newblock.defaults.push(55);
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
    newblock.defaults.push(55);
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

    var newblock = new ProtoBlock('customNote');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['customNote'] = newblock;
    newblock.valueBlock();
    newblock.hidden = true;

    // Transposition blocks
    // macro
    var newblock = new ProtoBlock('invert1');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['invert1'] = newblock;
    //.TRANS: pitch inversion rotates a pitch around another pitch
    newblock.staticLabels.push(_('invert'));
    if (language === 'ja') {
        //.TRANS: name2 is name as in name of pitch (JAPANESE ONLY)
        newblock.staticLabels.push(_('name2'));
        newblock.staticLabels.push(_('octave'));
    } else {
        newblock.staticLabels.push(_('name'), _('octave'));
    }
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
    newblock.deprecated = true;

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

    var customPitchBlock = new ProtoBlock('custompitch');
    customPitchBlock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['custompitch'] = customPitchBlock;
    //.TRANS: unison means the note is the same as the current note
    customPitchBlock.staticLabels.push(_('custom pitch'));
    customPitchBlock.adjustWidthToLabel();
    customPitchBlock.zeroArgBlock();
    customPitchBlock.hidden = true;

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
    if (language === 'ja') {
        newblock.defaults.push(440);
    } else {
        newblock.defaults.push(392);
    }

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
    if (language === 'ja' && beginnerMode && !beginnerBlock('pitch2')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('pitch');
    newblock.palette = palettes.dict['pitch'];
    blocks.protoBlockDict['pitch'] = newblock;
    //.TRANS: we specify pitch in terms of a name and an octave. The name can be CDEFGAB or Do Re Mi Fa Sol La Ti. Octave is a number between 1 and 8.
    newblock.staticLabels.push(_('pitch'));
    if (language === 'ja') {
        //.TRANS: name2 is name as in name of pitch (JAPANESE ONLY)
        newblock.staticLabels.push(_('name2'));
        newblock.staticLabels.push(_('octave'));
    } else {
        newblock.staticLabels.push(_('name'), _('octave'));
    }
    newblock.adjustWidthToLabel();
    newblock.defaults.push('sol');
    newblock.defaults.push(4);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'solfegein';
    newblock.dockTypes[2] = 'anyin';
    if (beginnerMode && !beginnerBlock('pitch')) {
        newblock.hidden = true;
    }

    // RHYTHM PALETTE

    if (language === 'ja') {
        var rhythmBlockPalette = 'rhythm';
    } else {
        var rhythmBlockPalette = 'widgets';
    }

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

    // TONE (ARTICULATION) PALETTE

    var newblock = new ProtoBlock('staccatofactor');
    newblock.palette = palettes.dict['ornament'];
    blocks.protoBlockDict['staccatofactor'] = newblock;
    //.TRANS: the duration of a note played as staccato
    newblock.staticLabels.push(_('staccato factor'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.hidden = true;

    var newblock = new ProtoBlock('slurfactor');
    newblock.palette = palettes.dict['ornament'];
    blocks.protoBlockDict['slurfactor'] = newblock;
    //.TRANS: the degree of overlap of notes played as legato
    newblock.staticLabels.push(_('slur factor'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    newblock.hidden = true;

    var newblock = new ProtoBlock('duosynth');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['duosynth'] = newblock;
    //.TRANS: a duo synthesizer combines a synth with a sequencer
    newblock.staticLabels.push(_('duo synth'));
    newblock.staticLabels.push(_('vibrato rate'), _('vibrato intensity'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.twoArgBlock();
    newblock.defaults.push(10);
    newblock.defaults.push(5);
    newblock.dockTypes[1] = 'numberin';
    newblock.dockTypes[2] = 'numberin';
    if (beginnerMode && !beginnerBlock('duosynth')) {
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

    var newblock = new ProtoBlock('partial');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['partial'] = newblock;
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
    newblock.palette = palettes.dict['ornament'];
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
    newblock.palette = palettes.dict['ornament'];
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
    newblock.defaults.push(392);
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
    newblock.deprecated = true;
    if (beginnerMode && !beginnerBlock('setvoice')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('glide');
    newblock.palette = palettes.dict['ornament'];
    blocks.protoBlockDict['glide'] = newblock;
   //.TRANS: glide (glissando) is a blended overlap successive notes
    newblock.staticLabels.push(_('glide'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(1 / 16);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('slur');
    newblock.palette = palettes.dict['ornament'];
    blocks.protoBlockDict['slur'] = newblock;
    //.TRANS: slur or legato is an overlap successive notes
    newblock.staticLabels.push(_('slur'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(16);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('staccato');
    newblock.palette = palettes.dict['ornament'];
    blocks.protoBlockDict['staccato'] = newblock;
    //.TRANS: play each note sharply detached from the others
    newblock.staticLabels.push(_('staccato'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(32);
    newblock.hidden = true;

    // macro
    var newblock = new ProtoBlock('newslur');
    newblock.palette = palettes.dict['ornament'];
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
    newblock.palette = palettes.dict['ornament'];
    blocks.protoBlockDict['newstaccato'] = newblock;
    //.TRANS: play each note sharply detached from the others
    newblock.staticLabels.push(_('staccato'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(1 / 32);
    if (beginnerMode && !beginnerBlock('newstaccato')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('synthname');
    newblock.palette = palettes.dict['tone'];
    blocks.protoBlockDict['synthname'] = newblock;
    newblock.staticLabels.push(_('synth name'));
    newblock.adjustWidthToLabel();
    newblock.dockTypes[0] = 'textout';
    newblock.parameterBlock();
    newblock.hidden = true;
    newblock.deprecated = true;

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
    newblock.staticLabels.push(_('set instrument'));
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.dockTypes[1] = 'textin';
    //.TRANS: user-defined
    newblock.defaults.push(_('custom'));
    if (beginnerMode && !beginnerBlock('settimbre')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('settemperament');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['settemperament'] = newblock;
    newblock.staticLabels.push(_('set temperament'));
    newblock.staticLabels.push(_('temperament'));
    newblock.staticLabels.push(_('pitch'), _('octave'));
    newblock.adjustWidthToLabel();
    newblock.threeArgBlock();
    if (beginnerMode && !beginnerBlock('settemperament')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('rhythm');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['rhythm'] = newblock;
    //.TRANS: an arrangement of notes based on duration
    if (language === 'ja') {
        //.TRANS: rhythm block
        newblock.staticLabels.push(_('rhythm1'));
    } else {
        newblock.staticLabels.push(_('rhythm'));
    }
    newblock.staticLabels.push(_('number of notes'), _('note value'));
    newblock.extraWidth = 10;
    newblock.adjustWidthToLabel();
    newblock.defaults.push(3);
    newblock.defaults.push(4);
    newblock.twoArgBlock();
    newblock.dockTypes[1] = 'anyin';
    newblock.dockTypes[2] = 'anyin';
    newblock.hidden = true;
    newblock.deprecated = true;

    var newblock = new ProtoBlock('rhythm2');
    newblock.palette = palettes.dict[rhythmBlockPalette];
    blocks.protoBlockDict['rhythm2'] = newblock;
    //.TRANS: an arrangement of notes based on duration
    if (language === 'ja') {
        //.TRANS: rhythm block
        newblock.staticLabels.push(_('rhythm1'));
    } else {
        newblock.staticLabels.push(_('rhythm'));
    }
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

    var newblock = new ProtoBlock('temperament1');
    newblock.palette = palettes.dict['action'];
    blocks.protoBlockDict['temperament1'] = newblock;
    newblock.staticLabels.push(_('define temperament'));
    newblock.hidden = true;
    newblock.extraWidth = 20;
    newblock.adjustWidthToLabel();
    newblock.stackClampOneArgBlock();

    // INTERVALS (PITCH TRANSFORMS) PALETTE

    var newblock = new ProtoBlock('modename');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['modename'] = newblock;
    newblock.valueBlock();
    newblock.dockTypes[0] = 'textout';
    newblock.extraWidth = 50;  // 150;
    // if (beginnerMode && !beginnerBlock('modename')) {
        newblock.hidden = true;
    // }

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
    if (beginnerMode && !beginnerBlock('semitoneinterval')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('chordV');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['chordV'] = newblock;
    //.TRANS: a chord is a group fo three or more notes.
    if (language === 'ja') {
        newblock.staticLabels.push(_('chord5'));
    } else {
        newblock.staticLabels.push(_('chord') + ' ' + 'V');
    }
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('chordV')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('chordIV');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['chordIV'] = newblock;
    //.TRANS: a chord is a group fo three or more notes.
    if (language === 'ja') {
        newblock.staticLabels.push(_('chord4'));
    } else {
        newblock.staticLabels.push(_('chord') + ' ' + 'IV');
    }
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('chordIV')) {
        newblock.hidden = true;
    }

    // macro
    var newblock = new ProtoBlock('chordI');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['chordI'] = newblock;
    //.TRANS: a chord is a group fo three or more notes.
    if (language === 'ja') {
        newblock.staticLabels.push(_('chord1'));
    } else {
        newblock.staticLabels.push(_('chord') + ' ' + 'I');
    }
    newblock.adjustWidthToLabel();
    newblock.zeroArgBlock();
    if (beginnerMode && !beginnerBlock('chordI')) {
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
    newblock.labelOffset = 15;
    newblock.extraWidth = 40;
    newblock.adjustWidthToLabel();
    newblock.flowClampOneArgBlock();
    newblock.defaults.push(5);
    if (beginnerMode && !beginnerBlock('interval')) {
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
    newblock.staticLabels.push(_('moveable Do'));
    newblock.adjustWidthToLabel();
    newblock.oneBooleanArgBlock();
    if (language === 'ja' && beginnerMode && !beginnerBlock('movable')) {
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

    var newblock = new ProtoBlock('currentmode');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['currentmode'] = newblock;
    //.TRANS: the mode in music is 'major', 'minor', etc.
    newblock.staticLabels.push(_('current mode'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('currentmode')) {
        newblock.hidden = true;
    }

    var newblock = new ProtoBlock('key');
    newblock.palette = palettes.dict['intervals'];
    blocks.protoBlockDict['key'] = newblock;
    //.TRANS: the key is a group of pitches with which a music composition is created
    newblock.staticLabels.push(_('current key'));
    newblock.adjustWidthToLabel();
    newblock.parameterBlock();
    if (beginnerMode && !beginnerBlock('key')) {
        newblock.hidden = true;
    }

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
    newblock.deprecated = true;

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
