// Copyright (c) 2017,18 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Macro expansions

// To add a macro:
// (1) you need to ensure that there is a block defined in
// basicblocks.js;
// (2) add an entry in BLOCKISMACRO array in the blockIsMacro function
// below with the block name from basicblocks.js;
// (3) define the macro (the JSON representation of the blocks that
// the macro expands to, where the position is specified as x, y); and
// (4) add an entry to the BUILTINMACROS dictionary.

// Regarding Step 3 above, the easiest way to generate the JSON code
// is to generate the blocks you need and save them in a project,
// which saves them in the same JSON format as used below. You may
// need to change the block numbers as they should start with Block 0.

// Note that the numbers at the beginning of each block need to
// adjusted so the first block starts at 0. If you remove all of
// the blocks except the ones you want in your macro (and one start
// block, since that is required) then add a start block and remove
// the start block you had saved, it will ensure that the macro
// numbering begins with Block 0 and all of the "connections" are
// correct.

function blockIsMacro (blkname) {
    const BLOCKISMACRO = ['accidental', 'action', 'articulation', 'augmented1', 'augmented2', 'augmented3', 'augmented4', 'augmented5', 'augmented6', 'augmented7', 'augmented8', 'backward', 'bottle', 'box1', 'box2', 'bubbles', 'cat', 'chine', 'clang', 'clap', 'cowbell', 'crash', 'crescendo', 'cricket', 'cup', 'darbuka', 'definemode', 'diminished2', 'diminished3', 'diminished4', 'diminished5', 'diminished6', 'diminished7', 'diminished8', 'dog', 'downsixthinterval', 'downthirdinterval', 'downmajor3', 'downmajor6', 'downminor3', 'downminor6', 'downsixth', 'downthird', 'drift', 'duck', 'duplicatenotes', 'eighthNote', 'elapsednotes2', 'f', 'ff', 'fff', 'fill', 'fingercymbals', 'fifth',, 'fifthinterval', 'flat', 'floortom', 'fourth', 'fourthinterval', 'glide', 'halfNote', 'harmonic', 'harmonic2', 'hihat', 'hollowline', 'interval', 'invert', 'invert1', 'kick', 'major2', 'major3', 'major6', 'major7', 'matrix', 'matrixcmajor', 'matrixgmajor', 'meter', 'mf', 'midi', 'minor2', 'minor3', 'minor6', 'minor7', 'movable', 'mp', 'multiplybeatfactor', 'neighbor', 'neighbor2', 'newnote', 'newslur', 'newstaccato', 'newswing', 'newswing2', 'note', 'note1', 'note2', 'note3', 'note4', 'note5', 'note6', 'note7', 'octave', 'oneOf', 'osctime', 'p', 'perfect4', 'perfect5', 'perfect8', 'pickup', 'pitch2', 'pitchdrummatrix', 'pitchslider', 'pitchstaircase', 'playdrum', 'pp', 'ppp', 'quarterNote', 'rest2', 'rhythm2', 'rhythmicdot', 'rhythmicdot2', 'rhythmruler2', 'ridebell', 'sawtooth', 'second', 'secondinterval', 'semitoneinterval', 'setbpm', 'setbpm2', 'setdrum', 'setkey2', 'setnotevolume2', 'setsynthvolume', 'setmasterbpm', 'setmasterbpm2', 'settimbre', 'settemperament', 'setscalartransposition', 'settransposition', 'setvoice', 'seventh', 'seventhinterval', 'sharp', 'sine', 'sixteenthNote', 'sixth', 'sixthinterval', 'sixtyfourthNote', 'skipnotes', 'slap', 'slur', 'snare', 'splash', 'square', 'staccato', 'startdrum', 'status', 'storebox1', 'storebox2', 'stuplet', 'stuplet3', 'stuplet5', 'stuplet7', 'swing', 'switch', 'tempo', 'third', 'thirtysecondNote', 'tie', 'timbre', 'tom', 'tone', 'triangle', 'trianglebell', 'tuplet3', 'tuplet4', 'unison', 'unisoninterval', 'vibrato', 'wholeNote', 'black', 'white', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    return BLOCKISMACRO.indexOf(blkname) > -1;
};

function getMacroExpansion (blkname, x, y) {
    // Some blocks are expanded on load.
    const ACCIDENTALOBJ = [[0, 'accidental', x, y, [null, 11, 1, 10]], [1, 'newnote', x, y, [0, 2, 5, 9]], [2, 'divide', 0, 0, [1, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [1, 6]], [6, 'pitch', 0, 0, [5, 7, 8, null]], [7, ['solfege', {'value': 'sol'}], 0, 0, [6]], [8, ['number', {'value': 4}], 0, 0, [6]], [9, 'hidden', 0, 0, [1, null]], [10, 'hidden', 0, 0, [0, null]], [11, ['accidentalname', {value: 'natural' + ' ♮'}], 0, 0, [0]]];
    const ACTIONOBJ = [[0, 'action', x, y, [null, 1, 2, null]], [1, ['text', {'value': _('action')}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const ARTICULATIONOBJ = [[0, 'articulation', x, y, [null, 1, null, 2]], [1, ['number', {'value': 25}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED1OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'augmented 1'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED2OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'augmented 2'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED3OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'augmented 3'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED4OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'augmented 4'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED5OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'augmented 5'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED6OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'augmented 6'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED7OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'augmented 7'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED8OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'augmented 8'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const BACKWARDOBJ = [[0, 'backward', x, y, [null, 1, null]], [1, 'hidden', 0, 0, [0, null]]];
    const BOTTLEOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'bottle'}], 0, 0, [0]]];
    const BOX1 = [[0, ['namedbox', {'value': 'box1'}], x, y, [null]]];
    const BOX2 = [[0, ['namedbox', {'value': 'box2'}], x, y, [null]]];
    const BPMOBJ = [[0, 'setbpm', x, y, [null, 1, null, 2]], [1, ['number', {'value': 90}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const BPMOBJ2 = [[0, 'setbpm2', x, y, [null, 1, 3, 2, 6]], [1, ['number', {'value': 90}], 0, 0, [0]], [2, 'vspace', 0, 0, [0, null]], [3, 'divide', 0, 0, [0, 4, 5]], [4, ['number', {'value': 1}], 0, 0, [3]], [5, ['number', {'value': 4}], 0, 0, [3]], [6, 'hidden', 0, 0, [0, null]]];
    const BUBBLESOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'bubbles'}], 0, 0, [0]]];
    const CATOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'cat'}], 0, 0, [0]]];
    const CHINEOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'chime'}], 0, 0, [0]]];
    const CLANGOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'clang'}], 0, 0, [0]]];
    const CLAPOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'clap'}], 0, 0, [0]]];
    const COWBELLOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'cow bell'}], 0, 0, [0]]];
    const CRASHOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'crash'}], 0, 0, [0]]];
    const CRESCENDOOBJ = [[0, 'crescendo', x, y, [null, 1, null, 2]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const CRICKETOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'cricket'}], 0, 0, [0]]];
    const CUPOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'cup drum'}], 0, 0, [0]]];
    const DARBUKAOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'darbuka drum'}], 0, 0, [0]]];
    const DEFINEMODEOBJ = [[0, 'definemode', x, y, [null, 1, 2, 16]], [1, ['modename', {'value': 'custom'}], 0, 0, [0]], [2, 'pitchnumber', 0, 0, [0, 3, 4]], [3, ['number', {'value': 0}], 0, 0, [2]], [4, 'pitchnumber', 0, 0, [2, 5, 6]], [5, ['number', {'value': 2}], 0, 0, [4]], [6, 'pitchnumber', 0, 0, [4, 7, 8]], [7, ['number', {'value': 4}], 0, 0, [6]], [8, 'pitchnumber', 0, 0, [6, 9, 10]], [9, ['number', {'value': 5}], 0, 0, [8]], [10, 'pitchnumber', 0, 0, [8, 11, 12]], [11, ['number', {'value': 7}], 0, 0, [10]], [12, 'pitchnumber', 0, 0, [10, 13, 14]], [13, ['number', {'value': 9}], 0, 0, [12]], [14, 'pitchnumber', 0, 0, [12, 15, null]], [15, ['number', {'value': 11}], 0, 0, [14]], [16, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED2OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'diminished 2'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED3OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'diminished 3'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED4OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'diminished 4'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED5OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'diminished 5'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED6OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'diminished 6'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED7OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'diminished 7'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED8OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'diminished 8'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DOGOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'dog'}], 0, 0, [0]]];
    const DOWNMAJOR3OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'minus', 0, 0, [0, 8, 3]], [2, ['intervalname', {'value': 'major 3'}], 0, 0, [8]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]], [8, 'neg', 0, 0, [1, 2]]];
    const DOWNMAJOR6OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'minus', 0, 0, [0, 8, 3]], [2, ['intervalname', {'value': 'major 6'}], 0, 0, [8]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]], [8, 'neg', 0, 0, [1, 2]]];
    const DOWNMINOR3OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'minus', 0, 0, [0, 8, 3]], [2, ['intervalname', {'value': 'minor 3'}], 0, 0, [8]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]], [8, 'neg', 0, 0, [1, 2]]];
    const DOWNMINOR6OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'minus', 0, 0, [0, 8, 3]], [2, ['intervalname', {'value': 'minor 6'}], 0, 0, [8]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]], [8, 'neg', 0, 0, [1, 2]]];
    const DOWNSIXTHINTERVALOBJ = [[0, 'interval', x, y, [null, 1, 6, 7]], [1, 'minus', 0, 0, [0, 2, 3]], [2, ['number', {'value': -5}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DOWNTHIRDINTERVALOBJ = [[0, 'interval', x, y, [null, 1, 6, 7]], [1, 'minus', 0, 0, [0, 2, 3]], [2, ['number', {'value': -2}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DOWNSIXTHOBJ = [[0, 'setscalartransposition', x, y, [null, 1, 6, 7]], [1, 'minus', 0, 0, [0, 2, 3]], [2, ['number', {'value': -5}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DOWNTHIRDOBJ = [[0, 'setscalartransposition', x, y, [null, 1, 6, 7]], [1, 'minus', 0, 0, [0, 2, 3]], [2, ['number', {'value': -2}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const DOTOBJ = [[0, 'rhythmicdot', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const DOTOBJ2 = [[0, 'rhythmicdot2', x, y, [null, 1, null, 2]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const DRIFTOBJ = [[0, 'drift', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const DUCKOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'duck'}], 0, 0, [0]]];
    const DUPOBJ = [[0, 'duplicatenotes', x, y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const ELAPSEDNOTESOBJ = [[0, 'elapsednotes2', x, y, [null, 1]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]]];
    const EIGHTHOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 8}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const FIFTHOBJ = [[0, 'setscalartransposition', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 4}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const FIFTHINTERVALOBJ = [[0, 'interval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 4}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const FILLOBJ = [[0, 'fill', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const FINGERCYMBALSOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'finger cymbals'}], 0, 0, [0]]];
    const FLATOBJ = [[0, 'accidental', x, y, [null, 11, 1, 10]], [1, 'newnote', x, y, [0, 2, 5, 9]], [2, 'divide', 0, 0, [1, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [1, 6]], [6, 'pitch', 0, 0, [5, 7, 8, null]], [7, ['solfege', {'value': 'sol'}], 0, 0, [6]], [8, ['number', {'value': 4}], 0, 0, [6]], [9, 'hidden', 0, 0, [1, null]], [10, 'hidden', 0, 0, [0, null]], [11, ['accidentalname', {value: 'flat' + ' ♭'}], 0, 0, [0]]];
    const FLOORTOMOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'floor tom tom'}], 0, 0, [0]]];
    const FOURTHOBJ = [[0, 'setscalartransposition', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 3}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const FOURTHINTERVALOBJ = [[0, 'interval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 3}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const GLIDEOBJ = [[0, 'glide', x, y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 16}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
    const HALFOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const HARMONICOBJ = [[0, 'harmonic', x, y, [null, 2, 1]], [1, 'hidden', 0, 0, [0, null]], [2, 'partial', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, 'partial', 0, 0, [2, 5, 6]], [5, ['number', {'value': 0.2}], 0, 0, [4]], [6, 'partial', 0, 0, [4, 7, null]], [7, ['number', {'value': 0.01}], 0, 0, [6]]];
    const HARMONIC2OBJ = [[0, 'harmonic2', x, y, [null, 2, null, 1]], [1, 'hidden', 0, 0, [0, null]], [2, ['number', {'value': 1}], 0, 0, [0]]];
    const HIHATOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'hi hat'}], 0, 0, [0]]];
    const HOLLOWOBJ = [[0, 'hollowline', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const INTERVALOBJ = [[0, 'interval', x, y, [null, 1, null, 2]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const INVERTOBJ = [[0, 'invert', x, y, [null, 1, 2, null, 3]], [1, ['solfege', {'value': 'sol'}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const INVERT1OBJ = [[0, 'invert1', x, y, [null, 1, 2, 3, null, 4]], [1, ['solfege', {'value': 'sol'}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]], [3, ['invertmode', {'value': 'even'}], 0, 0, [0]], [4, 'hidden', 0, 0, [0, null]]];
    const KICKOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'kick drum'}], 0, 0, [0]]];
    const MAJOR2OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'major 2'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const MAJOR3OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'major 3'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const MAJOR6OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'major 6'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const MAJOR7OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'major 7'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const MATRIXOBJ = [[0, 'matrix', x, y, [null, 1, 33]], [1, 'pitch', 0, 0, [0, 2, 3, 4]], [2, ['solfege', {'value': 'ti'}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'pitch', 0, 0, [1, 5, 6, 7]], [5, ['solfege', {'value': 'la'}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, 'pitch', 0, 0, [4, 8, 9, 10]], [8, ['solfege', {'value': 'sol'}], 0, 0, [7]], [9, ['number', {'value': 4}], 0, 0, [7]], [10, 'pitch', 0, 0, [7, 11, 12, 13]], [11, ['solfege', {'value': 'mi'}], 0, 0, [10]], [12, ['number', {'value': 4}], 0, 0, [10]], [13, 'pitch', 0, 0, [10, 14, 15, 16]], [14, ['solfege', {'value': 're'}], 0, 0, [13]], [15, ['number', {'value': 4}], 0, 0, [13]], [16, 'playdrum', 0, 0, [13, 17, 18]], [17, ['drumname', {'value': 'snare drum'}], 0, 0, [16]], [18, 'forward', 0, 0, [16, 19, 20]], [19, ['number', {'value': 100}], 0, 0, [18]], [20, 'right', 0, 0, [18, 21, 22]], [21, ['number', {'value': 90}], 0, 0, [20]], [22, 'rhythm2', 0, 0, [20, 23, 24, 27]], [23, ['number', {'value': 6}], 0, 0, [22]], [24, 'divide', 0, 0, [22, 25, 26]], [25, ['number', {'value': 1}], 0, 0, [24]], [26, ['number', {'value': 4}], 0, 0, [24]], [27, 'vspace', 0, 0, [22, 28]], [28, 'rhythm2', 0, 0, [27, 29, 30 , null]], [29, ['number', {'value': 1}], 0, 0, [28]], [30, 'divide', 0, 0, [28, 31, 32]], [31, ['number', {'value': 1}], 0, 0, [30]], [32, ['number', {'value': 2}], 0, 0, [30]], [33, 'hiddennoflow', 0, 0, [0, null]]];
    const MATRIXCMAJOBJ = [[0, ['matrix', {'collapsed': false}], x, y, [null, 5, 21]], [1, ['solfege', {'value': 'do'}], 0, 0, [10]], [2, ['number', {'value': 5}], 0, 0, [10]], [3, 'steppitch', 0, 0, [8, 4, null]], [4, ['number', {'value': -1}], 0, 0, [3]], [5, 'setkey2', 0, 0, [0, 6, 7, 10]], [6, ['notename', {'value': 'C'}], 0, 0, [5]], [7, ['modename', {'value': 'major'}], 0, 0, [5]], [8, 'repeat', 0, 0, [10, 9, 3, 11]], [9, 'modelength', 0, 0, [8]], [10, 'pitch', 0, 0, [5, 1, 2, 8]], [11, 'rhythm2', 0, 0, [8, 12, 14, 22]], [12, ['number', {'value': 6}], 0, 0, [11]], [13, ['number', {'value': 1}], 0, 0, [14]], [14, 'divide', 0, 0, [11, 13, 15]], [15, ['number', {'value': 4}], 0, 0, [14]], [16, 'rhythm2', 0, 0, [22, 17, 19, null]], [17, ['number', {'value': 1}], 0, 0, [16]], [18, ['number', {'value': 1}], 0, 0, [19]], [19, 'divide', 0, 0, [16, 18, 20]], [20, ['number', {'value': 2}], 0, 0.5, [19]], [21, 'hiddennoflow', 0, 0, [0, null]], [22, 'vspace', 0, 0, [11, 16]]];
    const MATRIXGMAJOBJ = [[0, ['matrix', {'collapsed': false}], x, y, [null, 5, 21]], [1, ['solfege', {'value': 'sol'}], 0, 0, [10]], [2, ['number', {'value': 5}], 0, 0, [10]], [3, 'steppitch', 0, 0, [8, 4, null]], [4, ['number', {'value': -1}], 0, 0, [3]], [5, 'setkey2', 0, 0, [0, 6, 7, 10]], [6, ['notename', {'value': 'G'}], 0, 0, [5]], [7, ['modename', {'value': 'major'}], 0, 0, [5]], [8, 'repeat', 0, 0, [10, 9, 3, 11]], [9, 'modelength', 0, 0, [8]], [10, 'pitch', 0, 0, [5, 1, 2, 8]], [11, 'rhythm2', 0, 0, [8, 12, 14, 22]], [12, ['number', {'value': 6}], 0, 0, [11]], [13, ['number', {'value': 1}], 0, 0, [14]], [14, 'divide', 0, 0, [11, 13, 15]], [15, ['number', {'value': 4}], 0, 0, [14]], [16, 'rhythm2', 0, 0, [22, 17, 19, null]], [17, ['number', {'value': 1}], 0, 0, [16]], [18, ['number', {'value': 1}], 0, 0, [19]], [19, 'divide', 0, 0, [16, 18, 20]], [20, ['number', {'value': 2}], 0, 0.5, [19]], [21, 'hiddennoflow', 0, 0, [0, null]], [22, 'vspace', 0, 0, [11, 16]]];
    const METEROBJ = [[0, 'meter', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 4}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const MIDIOBJ = [[0, 'setpitchnumberoffset', x, y, [null, 1, 2, null]], [1, ['notename', {'value': 'C'}], 0, 0, [0]], [2, ['number', {'value': -1}], 0, 0, [0]]];
    const MINOR2OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'minor 2'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const MINOR3OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'minor 3'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const MINOR6OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'minor 6'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const MINOR7OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'minor 7'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const MODEWIDGETOBJ = [[0, 'modewidget', x, y, [null, 1, 4]], [1, 'setkey2', 0, 0, [0, 2, 3, null]], [2, ['notename', {'value': 'C'}], 0, 0, [1]], [3, ['modename', {'value': DEFAULTMODE}], 0, 0, [1]], [4, 'hiddennoflow', 0, 0, [0, null]]];
    const MOVABLEOBJ = [[0, 'movable', x, y, [null, 1, null]], [1, ['boolean', {'value': true}], 0, 0, [0]]];
    const MULTBEATOBJ = [[0, 'multiplybeatfactor', x, y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 2}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
    const NEIGHBOROBJ = [[0, 'neighbor', x, y, [null, 1, 3, 2, 6]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'vspace', 0, 0, [0, null]], [3, 'divide', 0, 0, [0, 4, 5]], [4, ['number', {'value': 1}], 0, 0, [3]], [5, ['number', {'value': 16}], 0, 0, [3]], [6, 'hidden', 0, 0, [0, null]]];
    const NEIGHBOR2OBJ = [[0, 'neighbor2', x, y, [null, 1, 3, 2, 6]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'vspace', 0, 0, [0, null]], [3, 'divide', 0, 0, [0, 4, 5]], [4, ['number', {'value': 1}], 0, 0, [3]], [5, ['number', {'value': 16}], 0, 0, [3]], [6, 'hidden', 0, 0, [0, null]]];
    const NEWNOTEOBJ = [[0, 'newnote', x, y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['solfege', {'value': 'sol'}], 0, 0, [5]], [7, ['number', {'value': 4}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
    const NEWSLUROBJ = [[0, 'newslur', x, y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 16}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
    const NEWSTACCATOOBJ = [[0, 'newstaccato', x, y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 32}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
    const NEWSWING2OBJ = [[0, 'newswing2', x, y, [null, 1, 6, 9, 10]], [1, 'hspace', 0, 0, [0, 2]], [2, 'hspace', 0, 0, [1, 3]], [3, 'divide', 0, 0, [2, 4, 5]], [4, ['number', {'value': 1}], 0, 0, [3]], [5, ['number', {'value': 24}], 0, 0, [3]], [6, 'divide', 0, 0, [0, 7, 8]], [7, ['number', {'value': 1}], 0, 0, [6]], [8, ['number', {'value': 8}], 0, 0, [6]], [9, 'vspace', 0, 0, [0, null]], [10, 'hidden', 0, 0, [0, null]]];
    const NEWSWINGOBJ = [[0, 'newswing', x, y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 16}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
    const NOTE1OBJ = [[0, 'newnote', x, y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['solfege', {'value': 'sol'}], 0, 0, [5]], [7, ['number', {'value': 4}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
    const NOTE2OBJ = [[0, 'newnote', x, y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['notename', {'value': 'G'}], 0, 0, [5]], [7, ['number', {'value': 4}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
    const NOTE3OBJ = [[0, 'newnote', x, y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'hertz', 0, 0, [4, 6, null]], [6, ['number', {'value': 392}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const NOTE4OBJ = [[0, 'newnote', x, y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'playdrum', 0, 0, [4, 6, null]], [6, ['drumname', {'value': DEFAULTDRUM}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const NOTE5OBJ = [[0, 'newnote', x, y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitchnumber', 0, 0, [4, 6, null]], [6, ['number', {'value': 7}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const NOTE6OBJ = [[0, 'newnote', x, y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'steppitch', 0, 0, [4, 6, null]], [6, ['number', {'value': 1}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const NOTE7OBJ = [[0, 'newnote', x, y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'scaledegree', 0, 0, [4, 6, 7, null]], [6, ['number', {'value': 5}], 0, 0, [5]], [7, ['number', {'value': 4}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
    const NOTEOBJ = [[0, 'newnote', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'pitch', 0, 0, [0, 3, 4, null]], [3, ['solfege', {'value': 'sol'}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'hidden', 0, 0, [0, null]]];
    const OCTAVEOBJ = [[0, 'settransposition', x, y, [null, 1, 4, 5]], [1, 'multiply', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 12}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
    const ONEOFOBJ = [[0, 'oneOf',  x, y, [null, 1, 2, null]], [1, ['solfege', {'value': 'do'}], 0, 0, [0]], [2, ['solfege', {'value': 're'}], 0, 0, [0]]];
    const OSCTIMEOBJ = [[0, 'osctime', x, y, [null, 2, 1, 7]], [1, 'vspace', 0, 0, [0, 5]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1000}], 0, 0, [2]], [4, 'divide', 0, 0, [2, 8, 9]], [5, 'hertz', 0, 0, [1, 6, null]], [6, ['number', {'value': 392}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]], [8, ['number', {'value': 3}], 0, 0, [4]], [9, ['number', {'value': 2}], 0, 0, [4]]];
    const PERFECT4OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'perfect 4'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const PERFECT5OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'perfect 5'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const PERFECT8OBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['intervalname', {'value': 'perfect 8'}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const PICKUPOBJ = [[0, 'pickup', x, y, [null, 1, 4]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 0}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]]];
    const PITCH2OBJ = [[0, 'pitch', x, y, [null, 1, 2, null]], [1, ['notename', {'value': 'G'}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]]];
    const PITCHDRUMMATRIXOBJ = [[0, 'pitchdrummatrix', x, y, [null, 1, 12]], [1, 'pitch', 0, 0, [0, 2, 3, 4]], [2, ['solfege', {'value': 'sol'}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'pitch', 0, 0, [1, 5, 6, 7]], [5, ['solfege', {'value': 'mi'}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, 'pitch', 0, 0, [4, 8, 9, 10]], [8, ['solfege', {'value': 're'}], 0, 0, [7]], [9, ['number', {'value': 4}], 0, 0, [7]], [10, 'playdrum', 0, 0, [7, 11, null]], [11, ['drumname', {'value': DEFAULTDRUM}], 0, 0, [10]], [12, 'hiddennoflow', 0, 0, [0, null]]];
    const PITCHSLIDEROBJ = [[0, 'pitchslider', x, y, [null, 1, 3]], [1, 'hertz', 0, 0, [0, 2, null]], [2, ['number', {'value': 392}], 0, 0, [1]], [3, 'hiddennoflow', 0, 0, [0, null]]];
    const PITCHSTAIRCASEOBJ = [[0, 'pitchstaircase', x, y, [null, 1, 4]], [1, 'pitch', 0, 0, [0, 2, 3, null]], [2, ['solfege', {'value': 'sol'}], 0, 0, [1]], [3, ['number', {'value': 3}], 0, 0, [1]], [4, 'hiddennoflow', 0, 0, [0, null]]];
    const PLAYDRUMOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': DEFAULTDRUM}], 0, 0, [0]]];
    const QUARTEROBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const RESTOBJ = [[0, 'newnote', x, y, [null, 1, 4, 6]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'rest2', 0, 0, [4, null]], [6, 'hidden', 0, 0, [0, null]]];
    const RHYTHMOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const RHYTHMRULER2OBJ = [[0, 'rhythmruler2', x, y, [null, 1, 17]], [1, 'setdrum', 0, 0, [0, 2, 3, 8]], [2, ['drumname', {'value': 'snare drum'}], 0, 0, [1]], [3, 'rhythm2', 0, 0, [1, 4, 5, null]], [4, ['number', {'value': 1}], 0, 0, [3]], [5, 'divide', 0, 0, [3, 6, 7]], [6, ['number', {'value': 1}], 0, 0, [5]], [7, ['number', {'value': 1}], 0, 0, [5]], [8, 'hidden', 0, 0, [1, 9]], [9, 'setdrum', 0, 0, [8, 10, 11, 16]], [10, ['drumname', {'value': 'kick drum'}], 0, 0, [9]], [11, 'rhythm2', 0, 0, [9, 12, 13, null]], [12, ['number', {'value': 1}], 0, 0, [11]], [13, 'divide', 0, 0, [11, 14, 15]], [14, ['number', {'value': 1}], 0, 0, [13]], [15, ['number', {'value': 1}], 0, 0, [13]], [16, 'hidden', 0, 0, [9, null]], [17, 'hiddennoflow', 0, 0, [0, null]]];
    const RIDEBELLOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'ride bell'}], 0, 0, [0]]];
    const SAWTOOTHOBJ = [[0, 'newnote', x, y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'sawtooth', 0, 0, [4, 6, null]], [6, ['number', {'value': 392}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const SECONDOBJ = [[0, 'setscalartransposition', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const SECONDINTERVALOBJ = [[0, 'interval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const SEMITONEINTERVALOBJ = [[0, 'semitoneinterval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 5}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const SETDRUMOBJ = [[0, 'setdrum', x, y, [null, 1, null, 2]], [1, ['drumname', {'value': DEFAULTDRUM}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SETKEYOBJ = [[0, 'setkey2', x, y, [null, 1, 2, null]],  [1, ['notename', {'value': 'C'}], 0, 0, [0]], [2, ['modename', {'value': 'major'}], 0, 0, [0]]];
    const SETSCALARTRANSPOBJ = [[0, 'setscalartransposition', x, y, [null, 1, null, 2]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SETSYNTHVOLUMEOBJ = [[0, 'setsynthvolume', x, y, [null, 1, 2, null]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, ['number', {'value': 50}], 0, 0, [0, null]]];
    const SETTIMBREOBJ = [[0, 'settimbre', x, y, [null, 1, null, 2]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SETTEMPERAMENTOBJ = [[0,'settemperament',x,y,[null,1,null]],[1,['temperamentname',{'value':'equal'}],0,0,[0]]];
    const SETTRANSPOSITIONOBJ = [[0, 'settransposition', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, ['number', {'value': 12}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const SETVOICEOBJ = [[0, 'setvoice', x, y, [null, 1, null, 2]], [1, ['voicename', {'value': 'violin'}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SEVENTHOBJ = [[0, 'setscalartransposition', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 6}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const SEVENTHINTERVALOBJ = [[0, 'interval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 6}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const SHARPOBJ = [[0, 'accidental', x, y, [null, 11, 1, 10]], [1, 'newnote', x, y, [0, 2, 5, 9]], [2, 'divide', 0, 0, [1, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [1, 6]], [6, 'pitch', 0, 0, [5, 7, 8, null]], [7, ['solfege', {'value': 'sol'}], 0, 0, [6]], [8, ['number', {'value': 4}], 0, 0, [6]], [9, 'hidden', 0, 0, [1, null]], [10, 'hidden', 0, 0, [0, null]], [11, ['accidentalname', {value: 'sharp' + ' ♯'}], 0, 0, [0]]];
    const SINEOBJ = [[0, 'newnote', x, y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'sine', 0, 0, [4, 6, null]], [6, ['number', {'value': 392}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const SIXTEENTHOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 16}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const SIXTHOBJ = [[0, 'setscalartransposition', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 5}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const SIXTHINTERVALOBJ = [[0, 'interval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 5}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const SIXTYFOURTHOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 64}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const SKIPOBJ = [[0, 'skipnotes', x, y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SLAPOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'slap'}], 0, 0, [0]]];
    const SLUROBJ = [[0, 'slur', x, y, [null, 1, null, 2]], [1, ['number', {'value': 16}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SNAREOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'snare drum'}], 0, 0, [0]]];
    const SPLASHOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'splash'}], 0, 0, [0]]];
    const SQUAREOBJ = [[0, 'newnote', x, y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'square', 0, 0, [4, 6, null]], [6, ['number', {'value': 392}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const STACCATOOBJ = [[0, 'staccato', x, y, [null, 1, null, 2]], [1, ['number', {'value': 32}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const STARTDRUMOBJ = [[0, 'start', x, y, [null, 1, null]], [1, 'setdrum', 0, 0,[0, 2, null, 3]], [2, ['drumname', {'value': 'kick drum'}], 0, 0, [1]], [3, 'hidden', 0, 0, [1, null]]];
    const STATUSOBJ = [[0, 'status', x, y, [null, 1, 12]], [1, 'hidden', 0, 0, [0,10]], [2, 'print', 0, 0, [10,3,4]], [3, 'beatvalue', 0, 0, [2]], [4, 'print', 0, 0, [2,5,6]], [5, 'measurevalue', 0, 0, [4]], [6, 'print', 0, 0, [4,7,8]], [7, 'elapsednotes', 0, 0, [6]], [8, 'print', 0, 0, [6,9,null]], [9, 'bpmfactor', 0, 0, [8]], [10, 'print', 0, 0, [1,11,2]], [11, 'pitchinhertz', 0, 0, [10]], [12, 'hiddennoflow', 0, 0, [0,null]]];
    const STOREIN1 = [[0, ['storein2', {'value': 'box1'}], x, y, [null, 1, null]], [1, ['number', {'value': 4}], x, y, [0]]];
    const STOREIN2 = [[0, ['storein2', {'value': 'box2'}], x, y, [null, 1, null]], [1, ['number', {'value': 4}], x, y, [0]]];
    const STUPLETOBJ = [[0, 'stuplet', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const STUPLET3OBJ = [[0, 'stuplet', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const STUPLET5OBJ = [[0, 'stuplet', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const STUPLET7OBJ = [[0, 'stuplet', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const SWINGOBJ = [[0, 'swing', x, y, [null, 1, null, 2]], [1, ['number', {'value': 32}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SWITCHOBJ = [[0, 'switch', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'case', 0, 0, [0, 3, null, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, 'defaultcase', 0, 0, [2, null, null]], [5, 'hidden', 0, 0, [0, null]]];
    const TEMPOOBJ = [[0, 'tempo', x, y, [null, 1, 6]], [1, 'setmasterbpm2', 0, 0, [0, 2, 3, 7]], [2, ['number', {'value': 90}], 0, 0, [1]], [3, 'divide', 0, 0, [1, 4, 5]], [4, ['number', {'value': 1}], 0, 0, [3]], [5, ['number', {'value': 4}], 0, 0, [3]], [6, 'hiddennoflow', 0, 0, [0, null]], [7, 'vspace', 0, 0, [1, null]]];
    const TEMPOOBJ2 = [[0, 'setmasterbpm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 90}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const THIRDOBJ = [[0, 'setscalartransposition', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 2}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const THIRDINTERVALOBJ = [[0, 'interval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 2}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const THIRTYSECONDOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 32}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const TIEOBJ = [[0, 'tie', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const TIMBREOBJ = [[0, 'timbre', x, y, [null, 1, 3, 2]], [1, ['text', {'value': _('custom')}], 0, 0, [0]], [2, 'hiddennoflow', 0, 0, [0, null]], [3, 'newnote', 0, 0, [0, 4, 7, 11]], [4, 'divide', 0, 0, [3, 5, 6]], [5, ['number', {'value': 1}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, 'vspace', 0, 0, [3, 8]], [8, 'pitch', 0, 0, [7, 9, 10, null]], [9, ['solfege', {'value': 'sol'}], 0, 0, [8]], [10, ['number', {'value': 4}], 0, 0, [8]], [11, 'hidden', 0, 0, [3, 12]], [12, 'newnote', 0, 0, [11, 13, 16, 20]], [13, 'divide', 0, 0, [12, 14, 15]], [14, ['number', {'value': 1}], 0, 0, [13]], [15, ['number', {'value': 4}], 0, 0, [13]], [16, 'vspace', 0, 0, [12, 17]], [17, 'pitch', 0, 0, [16, 18, 19, null]], [18, ['solfege', {'value': 'mi'}], 0, 0, [17]], [19, ['number', {'value': 4}], 0, 0, [17]], [20, 'hidden', 0, 0, [12, 21]], [21, 'newnote', 0, 0, [20, 22, 25, 29]], [22, 'divide', 0, 0, [21, 23, 24]], [23, ['number', {'value': 1}], 0, 0, [22]], [24, ['number', {'value': 2}], 0, 0, [22]], [25, 'vspace', 0, 0, [21, 26]], [26, 'pitch', 0, 0, [25, 27, 28, null]], [27, ['solfege', {'value': 'sol'}], 0, 0, [26]], [28, ['number', {'value': 4}], 0, 0, [26]], [29, 'hidden', 0, 0, [21, null]]];
    const TOMOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'tom tom'}], 0, 0, [0]]];
    const TONEOBJ = [[0, 'drift', x, y, [null, 1, null]], [1, 'osctime', 0, 0, [0, 3, 2, null]], [2, 'vspace', 0, 0, [1, 6]], [3, 'divide', 0, 0, [1, 4, 5]], [4, ['number', {'value': 1000}], 0, 0, [3]], [5, ['number', {'value': 3}], 0, 0, [3]], [6, 'hertz', 0, 0, [2, 7, null]], [7, ['number', {'value': 392}], 0, 0, [6]]];
    const TRIANGLE1OBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': 'triangle bell'}], 0, 0, [0]]];
    const TRIANGLEOBJ = [[0, 'newnote', x, y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'triangle', 0, 0, [4, 6, null]], [6, ['number', {'value': 392}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const TUPLETOBJ = [[0, 'tuplet3', x, y, [null, 1, 10, 9, 7]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'rhythm2', 0, 0, [9, 3, 4, 8]], [3, ['number', {'value': 3}], 0, 0, [2]], [4, 'divide', 0, 0, [2, 5, 6]], [5, ['number', {'value': 1}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, 'hidden', 0, 0, [0, null]], [8, 'vspace', 0, 0, [2, null]], [9, 'vspace', 0, 0, [0, 2]], [10, 'divide', 0, 0, [0, 11, 12]], [11, ['number', {'value': 1}], 0, 0, [10]], [12, ['number', {'value': 4}], 0, 0, [10]]];
    const TUPLET4OBJ = [[0, 'tuplet4', x, y, [null, 1, 4, 17]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 2}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'rhythm2', 0, 0, [4, 6, 7, 10]], [6, ['number', {'value': 6}], 0, 0, [5]], [7, 'divide', 0, 0, [5, 8, 9]], [8, ['number', {'value': 1}], 0, 0, [7]], [9, ['number', {'value': 16}], 0, 0, [7]], [10, 'vspace', 0, 0, [5, 11]], [11, 'rhythm2', 0, 0, [10, 12, 13, 16]], [12, ['number', {'value': 1}], 0, 0, [11]], [13, 'divide', 0, 0, [11, 14, 15]], [14, ['number', {'value': 1}], 0, 0, [13]], [15, ['number', {'value': 4}], 0, 0, [13]], [16, 'vspace', 0, 0, [11, null]], [17, 'hidden', 0, 0, [0, 18]], [18, 'hidden', 0, 0, [17, null]]];
    const UNISONOBJ = [[0, 'setscalartransposition', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 0}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const UNISONINTERVALOBJ = [[0, 'interval', x, y, [null, 1, 6, 7]], [1, 'plus', 0, 0, [0, 2, 3]], [2, ['number', {'value': 0}], 0, 0, [1]], [3, 'multiply', 0, 0, [1, 4, 5]], [4, ['number', {'value': 0}], 0, 0, [3]], [5, 'modelength', 0, 0, [3]], [6, 'vspace', 0, 0, [0, null]], [7, 'hidden', 0, 0, [0, null]]];
    const VIBRATOOBJ = [[0, 'vibrato', x, y, [null, 1, 3, 2, 6]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, 'vspace', 0, 0, [0, null]], [3, 'divide', 0, 0, [0, 4, 5]], [4, ['number', {'value': 1}], 0, 0, [3]], [5, ['number', {'value': 16}], 0, 0, [3]], [6, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ = [[0, 'setsynthvolume2', x, y, [null, 1, 2, null, 3]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, ['number', {'value': 50}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ15 = [[0, 'setsynthvolume2', x, y, [null, 1, 2, null, 3]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, ['number', {'value': 15}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ25 = [[0, 'setsynthvolume2', x, y, [null, 1, 2, null, 3]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, ['number', {'value': 25}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ35 = [[0, 'setsynthvolume2', x, y, [null, 1, 2, null, 3]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, ['number', {'value': 35}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ45 = [[0, 'setsynthvolume2', x, y, [null, 1, 2, null, 3]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, ['number', {'value': 45}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ55 = [[0, 'setsynthvolume2', x, y, [null, 1, 2, null, 3]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, ['number', {'value': 55}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ65 = [[0, 'setsynthvolume2', x, y, [null, 1, 2, null, 3]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, ['number', {'value': 65}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ75 = [[0, 'setsynthvolume2', x, y, [null, 1, 2, null, 3]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, ['number', {'value': 75}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ85 = [[0, 'setsynthvolume2', x, y, [null, 1, 2, null, 3]], [1, ['voicename', {'value': 'default'}], 0, 0, [0]], [2, ['number', {'value': 85}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const WHOLEOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 1}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const BLACKOBJ = [[0, 'setshade', x, y, [null, 1, null]], [1, ['number', {'value': 0}], 0, 0, [0]]];
    const WHITEOBJ = [[0, 'setshade', x, y, [null, 1, null]], [1, ['number', {'value': 100}], 0, 0, [0]]];
    const REDOBJ = [[0, 'setcolor', x, y, [null, 1, null]], [1, ['number', {'value': 0}], 0, 0, [0]]];
    const ORANGEOBJ = [[0, 'setcolor', x, y, [null, 1, null]], [1, ['number', {'value': 10}], 0, 0, [0]]];
    const YELLOWOBJ = [[0, 'setcolor', x, y, [null, 1, null]], [1, ['number', {'value': 20}], 0, 0, [0]]];
    const GREENOBJ = [[0, 'setcolor', x, y, [null, 1, null]], [1, ['number', {'value': 40}], 0, 0, [0]]];
    const BLUEOBJ = [[0, 'setcolor', x, y, [null, 1, null]], [1, ['number', {'value': 70}], 0, 0, [0]]];
    const PURPLEOBJ = [[0, 'setcolor', x, y, [null, 1, null]], [1, ['number', {'value': 90}], 0, 0, [0]]];

    const BUILTINMACROS = {
        'accidental': ACCIDENTALOBJ,
        'action': ACTIONOBJ,
        'articulation': ARTICULATIONOBJ,
        'augmented1': AUGMENTED1OBJ,
        'augmented2': AUGMENTED2OBJ,
        'augmented3': AUGMENTED3OBJ,
        'augmented4': AUGMENTED4OBJ,
        'augmented5': AUGMENTED5OBJ,
        'augmented6': AUGMENTED6OBJ,
        'augmented7': AUGMENTED7OBJ,
        'augmented8': AUGMENTED8OBJ,
        'backward': BACKWARDOBJ,
        'bottle': BOTTLEOBJ,
        'box1': BOX1,
        'box2': BOX2,
        'bubbles': BUBBLESOBJ,
        'cat': CATOBJ,
        'chine': CHINEOBJ,
        'clang': CLANGOBJ,
        'clap': CLAPOBJ,
        'cowbell': COWBELLOBJ,
        'crash': CRASHOBJ,
        'crescendo': CRESCENDOOBJ,
        'cricket': CRICKETOBJ,
        'cup': CUPOBJ,
        'darbuka': DARBUKAOBJ,
        'definemode': DEFINEMODEOBJ,
        'diminished2': DIMINISHED2OBJ,
        'diminished3': DIMINISHED3OBJ,
        'diminished4': DIMINISHED4OBJ,
        'diminished5': DIMINISHED5OBJ,
        'diminished6': DIMINISHED6OBJ,
        'diminished7': DIMINISHED7OBJ,
        'diminished8': DIMINISHED8OBJ,
        'dog': DOGOBJ,
        'downmajor3': DOWNMAJOR3OBJ,
        'downmajor6': DOWNMAJOR6OBJ,
        'downminor3': DOWNMINOR3OBJ,
        'downminor6': DOWNMINOR6OBJ,
        'downsixthinterval': DOWNSIXTHINTERVALOBJ,
        'downthirdinterval': DOWNTHIRDINTERVALOBJ,
        'downsixth': DOWNSIXTHOBJ,
        'downthird': DOWNTHIRDOBJ,
        'drift': DRIFTOBJ,
        'duck': DUCKOBJ,
        'duplicatenotes': DUPOBJ,
        'eighthNote': EIGHTHOBJ,
        'elapsednotes2': ELAPSEDNOTESOBJ,
        'f': VOLOBJ65,
        'ff': VOLOBJ75,
        'fff': VOLOBJ85,
        'fifth': FIFTHOBJ,
        'fifthinterval': FIFTHINTERVALOBJ,
        'fill': FILLOBJ,
        'fingercymbals': FINGERCYMBALSOBJ,
        'flat': FLATOBJ,
        'floortom': FLOORTOMOBJ,
        'fourth': FOURTHOBJ,
        'fourthinterval': FOURTHINTERVALOBJ,
        'glide': GLIDEOBJ,
        'halfNote': HALFOBJ,
        'harmonic': HARMONICOBJ,
        'harmonic2': HARMONIC2OBJ,
        'hihat': HIHATOBJ,
        'hollowline': HOLLOWOBJ,
        'interval': INTERVALOBJ,
        'invert': INVERTOBJ,
        'invert1': INVERT1OBJ,
        'kick': KICKOBJ,
        'major2': MAJOR2OBJ,
        'major3': MAJOR3OBJ,
        'major6': MAJOR6OBJ,
        'major7': MAJOR7OBJ,
        'matrix': MATRIXOBJ,
        'matrixcmajor': MATRIXCMAJOBJ,
        'matrixgmajor': MATRIXGMAJOBJ,
        'meter': METEROBJ,
        'mf': VOLOBJ55,
        'midi': MIDIOBJ,
        'minor2': MINOR2OBJ,
        'minor3': MINOR3OBJ,
        'minor6': MINOR6OBJ,
        'minor7': MINOR7OBJ,
        'modewidget': MODEWIDGETOBJ,
        'movable': MOVABLEOBJ,
        'mp': VOLOBJ45,
        'multiplybeatfactor': MULTBEATOBJ,
        'neighbor': NEIGHBOROBJ,
        'neighbor2': NEIGHBOR2OBJ,
        'newnote': NEWNOTEOBJ,
        'newslur': NEWSLUROBJ,
        'newstaccato': NEWSTACCATOOBJ,
        'newswing2': NEWSWING2OBJ,
        'newswing': NEWSWINGOBJ,
        'note1': NOTE1OBJ,  // sol 4
        'note2': NOTE2OBJ,  // G 4
        'note3': NOTE3OBJ,  // 392 hertz
        'note4': NOTE4OBJ,  // drum
        'note5': NOTE5OBJ,  // pitch number 7
        'note6': NOTE6OBJ,  // step pitch +1
        'note7': NOTE7OBJ,  // scale degree 5 4
        'note': NOTEOBJ,
        'octave': OCTAVEOBJ,
        'oneOf': ONEOFOBJ,
        'osctime': OSCTIMEOBJ,
        'perfect4': PERFECT4OBJ,
        'perfect5': PERFECT5OBJ,
        'perfect8': PERFECT8OBJ,
        'pickup': PICKUPOBJ,
        'pitch2': PITCH2OBJ,
        'pitchdrummatrix': PITCHDRUMMATRIXOBJ,
        'pitchslider': PITCHSLIDEROBJ,
        'pitchstaircase': PITCHSTAIRCASEOBJ,
        'playdrum': PLAYDRUMOBJ,
        'ppp': VOLOBJ15,
        'pp': VOLOBJ25,
        'p': VOLOBJ35,
        'quarterNote': QUARTEROBJ,
        'rest2': RESTOBJ,
        'rhythm2': RHYTHMOBJ,
        'rhythmicdot': DOTOBJ,
        'rhythmicdot2': DOTOBJ2,
        'rhythmruler2': RHYTHMRULER2OBJ,
        'ridebell': RIDEBELLOBJ,
        'sawtooth': SAWTOOTHOBJ,
        'second': SECONDOBJ,
        'secondinterval': SECONDINTERVALOBJ,
        'semitoneinterval': SEMITONEINTERVALOBJ,
        'setbpm': BPMOBJ,
        'setbpm2': BPMOBJ2,
        'setdrum': SETDRUMOBJ,
        'setkey2': SETKEYOBJ,
        'setnotevolume2': VOLOBJ,
        'setsynthvolume': SETSYNTHVOLUMEOBJ,
        'setscalartransposition': SETSCALARTRANSPOBJ,
        'settransposition': SETTRANSPOSITIONOBJ,
        'settimbre': SETTIMBREOBJ,
        'settemperament':SETTEMPERAMENTOBJ,
        'setvoice': SETVOICEOBJ,
        'seventh': SEVENTHOBJ,
        'seventhinterval': SEVENTHINTERVALOBJ,
        'sharp': SHARPOBJ,
        'sine': SINEOBJ,
        'sixteenthNote': SIXTEENTHOBJ,
        'sixth': SIXTHOBJ,
        'sixthinterval': SIXTHINTERVALOBJ,
        'sixtyfourthNote': SIXTYFOURTHOBJ,
        'skipnotes': SKIPOBJ,
        'slap': SLAPOBJ,
        'slur': SLUROBJ,
        'snare': SNAREOBJ,
        'splash': SPLASHOBJ,
        'square': SQUAREOBJ,
        'staccato': STACCATOOBJ,
        'startdrum': STARTDRUMOBJ,
        'status': STATUSOBJ,
        'storebox1': STOREIN1,
        'storebox2': STOREIN2,
        'stuplet': STUPLETOBJ,
        'stuplet3': STUPLET3OBJ,
        'stuplet5': STUPLET5OBJ,
        'stuplet7': STUPLET7OBJ,
        'swing': SWINGOBJ,
        'switch': SWITCHOBJ,
        'setmasterbpm2': TEMPOOBJ2,
        'tempo': TEMPOOBJ,
        'third': THIRDOBJ,
        'thirdinterval': THIRDINTERVALOBJ,
        'thirtysecondNote': THIRTYSECONDOBJ,
        'tie': TIEOBJ,
        'timbre': TIMBREOBJ,
        'tom': TOMOBJ,
        'tone': TONEOBJ,
        'triangle': TRIANGLEOBJ,
        'trianglebell': TRIANGLE1OBJ,
        'tuplet3': TUPLETOBJ,
        'tuplet4': TUPLET4OBJ,
        'unison': UNISONOBJ,
        'unisoninterval': UNISONINTERVALOBJ,
        'vibrato': VIBRATOOBJ,
        'wholeNote': WHOLEOBJ,

        'black': BLACKOBJ,
        'white': WHITEOBJ,
        'red': REDOBJ,
        'orange': ORANGEOBJ,
        'yellow': YELLOWOBJ,
        'green': GREENOBJ,
        'blue': BLUEOBJ,
        'purple': PURPLEOBJ,
    };

    console.log(blkname);
    if (['namedbox', 'nameddo', 'namedcalc', 'namedarg', 'nameddoArg'].indexOf(blkname) === -1 && blkname in BUILTINMACROS) {
	return BUILTINMACROS[blkname];
    } else {
        return null;
    }
};
