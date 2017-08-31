// Copyright (c) 2017 Walter Bender
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

function blockIsMacro (blkname) {

    const BUILTINMACROS= ['action', 'articulation', 'augmented', 'augmentedx', 'augmented1', 'augmented2', 'augmented4', 'augmented5', 'augmented7','augmented8', 'backward', 'bottle', 'bubbles', 'cat', 'chine', 'clang', 'clap', 'cowbell', 'crash', 'crescendo', 'cricket', 'cup', 'darbuka', 'diminished', 'diminishedx', 'diminished1', 'diminished4', 'diminished5', 'diminished8', 'dividebeatfactor', 'dog', 'drift', 'duck', 'duplicatenotes', 'eighthNote', 'f', 'ff', 'fff', 'fill', 'fingercymbals', 'flat', 'floortom', 'halfNote', 'hihat', 'hollowline', 'invert', 'invert1', 'kick', 'major', 'majorx', 'major2', 'major3', 'major6', 'major7', 'matrix', 'meter', 'mf', 'midi', 'minor', 'minorx', 'minor2', 'minor3', 'minor6', 'minor7', 'mp', 'multiplybeatfactor', 'newnote', 'newslur', 'newstaccato', 'newswing', 'newswing2', 'note', 'note1', 'note2', 'note3', 'note4', 'octave', 'oneOf', 'osctime', 'p', 'perfect', 'perfectx', 'perfect1', 'perfect4', 'perfect5', 'perfect8', 'pickup', 'pitchdrummatrix', 'pitchslider', 'pitchstaircase', 'playdrum', 'pluck', 'pp', 'ppp', 'quarterNote', 'rest2', 'rhythm2', 'rhythmicdot', 'rhythmruler', 'ridebell', 'sawtooth', 'setbpm', 'setdrum', 'setkey2', 'setnotevolume2', 'settransposition', 'setturtlename', 'setvoice', 'sharp', 'sine', 'sixteenthNote', 'sixtyfourthNote', 'skipnotes', 'slap', 'slur', 'snare', 'splash', 'square', 'staccato', 'status', 'steppitch', 'stuplet', 'stuplet3', 'stuplet5', 'stuplet7', 'swing', 'switch', 'tempo', 'thirtysecondNote', 'tie', 'timbre', 'tom', 'tone', 'triangle', 'triangle1', 'tuplet3', 'tuplet4','turtlenote2', 'turtlepitch', 'vibrato', 'wholeNote', 'xturtle', 'yturtle'];

    return BUILTINMACROS.indexOf(blkname) > -1;

};

function getMacroExpansion (blkname, x, y) {
    // Some blocks are expanded on load.
    const ACTIONOBJ = [[0, 'action', x, y, [null, 1, 2, null]], [1, ['text', {'value': _('action')}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const ARTICULATIONOBJ = [[0, 'articulation', x, y, [null, 1, null, 2]], [1, ['number', {'value': 25}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED1OBJ = [[0, 'augmentedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED2OBJ = [[0, 'augmentedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED4OBJ = [[0, 'augmentedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 4}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED5OBJ = [[0, 'augmentedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED7OBJ = [[0, 'augmentedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const AUGMENTED8OBJ = [[0, 'augmentedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const AUGMENTEDOBJ = [[0, 'augmentedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const BACKWARDOBJ = [[0, 'backward', x, y, [null, 1, null]], [1, 'hidden', 0, 0, [0, null]]];
    const BOTTLEOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('bottle')}], 0, 0, [0]]];
    const BPMOBJ = [[0, 'setbpm', x, y, [null, 1, null, 2]], [1, ['number', {'value': 90}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const BUBBLESOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('bubbles')}], 0, 0, [0]]];
    const CATOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('cat')}], 0, 0, [0]]];
    const CHINEOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('chine')}], 0, 0, [0]]];
    const CLANGOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('clang')}], 0, 0, [0]]];
    const CLAPOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('clap')}], 0, 0, [0]]];
    const COWBELLOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('cow bell')}], 0, 0, [0]]];
    const CRASHOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('crash')}], 0, 0, [0]]];
    const CRESCENDOOBJ = [[0, 'crescendo', x, y, [null, 1, null, 2]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const CRICKETOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('cricket')}], 0, 0, [0]]];
    const CUPOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('cup drum')}], 0, 0, [0]]];
    const DARBUKAOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('darbuka drum')}], 0, 0, [0]]];
    const DIMINISHED1OBJ = [[0, 'diminishedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED2OBJ = [[0, 'diminishedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED4OBJ = [[0, 'diminishedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 4}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED5OBJ = [[0, 'diminishedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED7OBJ = [[0, 'diminishedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const DIMINISHED8OBJ = [[0, 'diminishedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const DIMINISHEDOBJ = [[0, 'diminishedx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const DIVBEATOBJ = [[0, 'dividebeatfactor', x, y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const DOGOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('dog')}], 0, 0, [0]]];
    const DOTOBJ = [[0, 'rhythmicdot', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const DRIFTOBJ = [[0, 'drift', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const DUCKOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('duck')}], 0, 0, [0]]];
    const DUPOBJ = [[0, 'duplicatenotes', x, y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const EIGHTHOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 8}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const FILLOBJ = [[0, 'fill', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const FINGERCYMBALSOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('finger cymbals')}], 0, 0, [0]]];
    const FLATOBJ = [[0, 'flat', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const FLOORTOMOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('floor tom tom')}], 0, 0, [0]]];
    const HALFOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const HIHATOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('hi hat')}], 0, 0, [0]]];
    const HOLLOWOBJ = [[0, 'hollowline', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const INVERTOBJ = [[0, 'invert', x, y, [null, 1, 2, null, 3]], [1, ['solfege', {'value': 'sol'}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const INVERT1OBJ = [[0, 'invert1', x, y, [null, 1, 2, 3, null, 4]], [1, ['solfege', {'value': 'sol'}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]], [3, ['text', {'value': _('even')}], 0, 0, [0]], [4, 'hidden', 0, 0, [0, null]]];
    const KICKOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('kick drum')}], 0, 0, [0]]];
    const MAJOR2OBJ = [[0, 'majorx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const MAJOR3OBJ = [[0, 'majorx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const MAJOR6OBJ = [[0, 'majorx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 6}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const MAJOR7OBJ = [[0, 'majorx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const MAJOROBJ = [[0, 'majorx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const MATRIXOBJ = [[0, ['matrix', {'collapsed': false}], x, y, [null, 1, 32]], [1, ['pitch', {}], 0, 0, [0, 2, 3, 4]], [2, ['solfege', {'value': 'ti'}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, ['pitch', {}], 0, 0, [1, 5, 6, 7]], [5, ['solfege', {'value': 'la'}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, ['pitch', {}], 0, 0, [4, 8, 9, 10]], [8, ['solfege', {'value': 'sol'}], 0, 0, [7]], [9, ['number', {'value': 4}], 0, 0, [7]], [10, ['pitch', {}], 0, 0, [7, 11, 12, 13]], [11, ['solfege', {'value': 'mi'}], 0, 0, [10]], [12, ['number', {'value': 4}], 0, 0, [10]], [13, ['pitch', {}], 0, 0, [10, 14, 15, 30]], [14, ['solfege', {'value': 're'}], 0, 0, [13]], [15, ['number', {'value': 4}], 0, 0, [13]], [16, ['rhythm2', {}], 0, 0, [28, 17, 19, 33]], [17, ['number', {'value': 6}], 0, 0, [16]], [18, ['number', {'value': 1}], 0, 0, [19]],[19, 'divide', 0, 0, [16, 18, 20]],[20,['number', {'value': 4}], 0, 0, [19]], [21, ['rhythm2', {}], 0, 0, [33, 22, 24 , null]], [22, ['number', {'value': 1}], 0, 0, [21]], [23, ['number', {'value': 1}], 0, 0, [24]], [24, 'divide', 0, 0, [21, 23, 25]], [25, ['number', {'value':2}], 0, 0, [24]], [26, ['forward', {}], 0, 0, [30, 27, 28]], [27, ['number', {'value': 100}], 0, 0, [26]], [28, ['right', {}], 0, 0, [26, 29, 16]], [29, ['number', {'value': 90}], 0, 0, [28]], [30, ['playdrum', {}], 0, 0, [13, 31, 26]], [31, ['drumname', {'value': _('snare drum')}], 0, 0, [30]], [32, ['hiddennoflow', {}], 0, 0, [0, null]], [33, 'vspace', 0, 0, [16, 21]]];
    const METEROBJ = [[0, 'meter', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 4}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const MIDIOBJ = [[0, 'setpitchnumberoffset', x, y, [null, 1, 2, null]], [1, ['notename', {'value': 'C'}], 0, 0, [0]], [2, ['number', {'value': -1}], 0, 0, [0]]];
    const MINOR2OBJ = [[0, 'minorx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const MINOR3OBJ = [[0, 'minorx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const MINOR6OBJ = [[0, 'minorx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 6}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const MINOR7OBJ = [[0, 'minorx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const MINOROBJ = [[0, 'minorx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const MODEWIDGETOBJ = [[0, 'modewidget', x, y, [null, 1, 4]], [1, 'setkey2', 0, 0, [0, 2, 3, null]], [2, ['notename', {'value': 'C'}], 0, 0, [1]], [3, ['modename', {'value': getModeName(DEFAULTMODE)}], 0, 0, [1]], [4, 'hiddennoflow', 0, 0, [0, null]]];
    const MULTBEATOBJ = [[0, 'multiplybeatfactor', x, y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const NEWNOTEOBJ = [[0, 'newnote', x, y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['solfege', {'value': 'sol'}], 0, 0, [5]], [7, ['number', {'value': 4}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
    const NEWSLUROBJ = [[0, 'newslur', x, y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 16}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
    const NEWSTACCATOOBJ = [[0, 'newstaccato', x, y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 32}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
    const NEWSWING2OBJ = [[0, 'newswing2', x, y, [null, 1, 6, 9, 10]], [1, 'hspace', 0, 0, [0, 2]], [2, 'hspace', 0, 0, [1, 3]], [3, 'divide', 0, 0, [2, 4, 5]], [4, ['number', {'value': 1}], 0, 0, [3]], [5, ['number', {'value': 24}], 0, 0, [3]], [6, 'divide', 0, 0, [0, 7, 8]], [7, ['number', {'value': 1}], 0, 0, [6]], [8, ['number', {'value': 8}], 0, 0, [6]], [9, 'vspace', 0, 0, [0, null]], [10, 'hidden', 0, 0, [0, null]]];
    const NEWSWINGOBJ = [[0, 'newswing', x, y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 16}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
    const NOTE1OBJ = [[0, 'newnote', x, y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['solfege', {'value': 'sol'}], 0, 0, [5]], [7, ['number', {'value': 4}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
    const NOTE2OBJ = [[0, 'newnote', x, y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['notename', {'value': 'G'}], 0, 0, [5]], [7, ['number', {'value': 4}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
    const NOTE3OBJ = [[0, 'newnote', x, y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'hertz', 0, 0, [4, 6, null]], [6, ['number', {'value': 392}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const NOTE4OBJ = [[0, 'newnote', x, y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'playdrum', 0, 0, [4, 6, null]], [6, ['drumname', {'value': _(DEFAULTDRUM)}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const NOTEOBJ = [[0, 'note', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'pitch', 0, 0, [0, 3, 4, null]], [3, ['solfege', {'value': 'sol'}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'hidden', 0, 0, [0, null]]];
    const OCTAVEOBJ = [[0, 'settransposition', x, y, [null, 1, 4, 5]], [1, 'multiply', 0, 0, [0, 2, 3]], [2, ['number', {'value': 12}], 0, 0, [1]], [3, ['number', {'value': 1}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
    const ONEOFOBJ = [[0, 'oneOf',  x, y, [null, 1, 2, null]], [1, ['solfege', {'value': 'do'}], 0, 0, [0]], [2, ['solfege', {'value': 're'}], 0, 0, [0]]];
    const OSCTIMEOBJ = [[0, 'osctime', x, y, [null, 2, 1, 7]], [1, 'vspace', 0, 0, [0, 5]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1000}], 0, 0, [2]], [4, ['number', {'value': 3}], 0, 0, [2]], [5, 'hertz', 0, 0, [1, 6, null]], [6, ['number', {'value': 392}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
    const PERFECT1OBJ = [[0, 'perfectx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const PERFECT4OBJ = [[0, 'perfectx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 4}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const PERFECT5OBJ = [[0, 'perfectx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const PERFECT8OBJ = [[0, 'perfectx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const PERFECTOBJ = [[0, 'perfectx', x, y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
    const PICKUPOBJ = [[0, 'pickup', x, y, [null, 1, 4]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 0}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]]];
    const PITCHDRUMMATRIXOBJ = [[0, 'pitchdrummatrix', x, y, [null, 1, 12]], [1, 'pitch', 0, 0, [0, 2, 3, 4]], [2, ['solfege', {'value': 'sol'}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'pitch', 0, 0, [1, 5, 6, 7]], [5, ['solfege', {'value': 'mi'}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, 'pitch', 0, 0, [4, 8, 9, 10]], [8, ['solfege', {'value': 're'}], 0, 0, [7]], [9, ['number', {'value': 4}], 0, 0, [7]], [10, 'playdrum', 0, 0, [7, 11, null]], [11, ['drumname', {'value': _(DEFAULTDRUM)}], 0, 0, [10]], [12, 'hiddennoflow', 0, 0, [0, null]]];
    const PITCHSLIDEROBJ = [[0, 'pitchslider', x, y, [null, 1, 3]], [1, 'hertz', 0, 0, [0, 2, null]], [2, ['number', {'value': 392}], 0, 0, [1]], [3, 'hiddennoflow', 0, 0, [0, null]]];
    const PITCHSTAIRCASEOBJ = [[0, 'pitchstaircase', x, y, [null, 1, 4]], [1, 'pitch', 0, 0, [0, 2, 3, null]], [2, ['solfege', {'value': 'sol'}], 0, 0, [1]], [3, ['number', {'value': 3}], 0, 0, [1]], [4, 'hiddennoflow', 0, 0, [0, null]]];
    const PLAYDRUMOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _(DEFAULTDRUM)}], 0, 0, [0]]];
    const PLUCKOBJ = [[0, 'pluck', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const QUARTEROBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const RESTOBJ = [[0, 'newnote', x, y, [null, 1, 4, 6]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'rest2', 0, 0, [4, null]], [6, 'hidden', 0, 0, [0, null]]];
    const RHYTHMOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const RHYTHMRULEROBJ = [[0, 'rhythmruler', x, y, [null, 1, 4, 21]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 1}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'setdrum', 0, 0, [4, 6, 7, 12]], [6, ['drumname', {'value': _('snare drum')}], 0, 0, [5]], [7, 'rhythm2', 0, 0, [5, 8, 9, null]], [8, ['number', {'value': 1}], 0, 0, [7]], [9, 'divide', 0, 0, [7, 10, 11]], [10, ['number', {'value': 1}], 0, 0, [9]], [11, ['number', {'value': 1}], 0, 0, [9]], [12, 'hidden', 0, 0, [5, 13]], [13, 'setdrum', 0, 0, [12, 14, 15, 20]], [14, ['drumname', {'value': _('kick drum')}], 0, 0, [13]], [15, 'rhythm2', 0, 0, [13, 16, 17, null]], [16, ['number', {'value': 1}], 0, 0, [15]], [17, 'divide', 0, 0, [15, 18, 19]], [18, ['number', {'value': 1}], 0, 0, [17]], [19, ['number', {'value': 1}], 0, 0, [17]], [20, 'hidden', 0, 0, [13, null]], [21, 'hiddennoflow', 0, 0, [0, null]]];
    const RIDEBELLOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('ride bell')}], 0, 0, [0]]];
    const SAWTOOTHOBJ = [[0, 'note', x, y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'sawtooth', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
    const SETDRUMOBJ = [[0, 'setdrum', x, y, [null, 1, null, 2]], [1, ['drumname', {'value': _(DEFAULTDRUM)}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SETKEYOBJ = [[0, 'setkey2', x, y, [null, 1, 2, null]],  [1, ['notename', {'value': 'C'}], 0, 0, [0]], [2, ['modename', {'value': _('major')}], 0, 0, [0]]];
    const SETTURTLENAMEOBJ = [[0, 'setturtlename', x, y, [null, 1, 2, null]], [1, 'turtlename', 0, 0, [0]], [2, ['text', {'value': 'Mozart'}], 0, 0, [0]]];
    const SETVOICEOBJ = [[0, 'setvoice', x, y, [null, 1, null, 2]], [1, ['voicename', {'value': _('violin')}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SHARPOBJ = [[0, 'sharp', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const SINEOBJ = [[0, 'note', x, y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'sine', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
    const SIXTEENTHOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 16}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const SIXTYFOURTHOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 64}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const SKIPOBJ = [[0, 'skipnotes', x, y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SLAPOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('slap')}], 0, 0, [0]]];
    const SLUROBJ = [[0, 'slur', x, y, [null, 1, null, 2]], [1, ['number', {'value': 16}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SNAREOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('snare drum')}], 0, 0, [0]]];
    const SPLASHOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('splash')}], 0, 0, [0]]];
    const SQUAREOBJ = [[0, 'note', x, y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'square', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
    const STACCATOOBJ = [[0, 'staccato', x, y, [null, 1, null, 2]], [1, ['number', {'value': 32}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
	const STATUSOBJ = [[0, 'status', x, y, [null, 1, 8]], [1, 'hidden', 0, 0, [0, 2]], [2, ['print', {}], 0, 0, [1, 3, 4]], [3, ['beatvalue', {}], 0, 0, [2]], [4, ['print', {}], 0, 0, [2, 5, 6]], [5, ['measurevalue', {}], 0, 0, [4]], [6, ['print', {}], 0, 0, [4, 7, null]], [7, ['elapsednotes', {}], 0, 0, [6]], [8, 'hiddennoflow', 0, 0, [0, null]]];
	const STEPPITCHOBJ = [[0, 'note', x, y, [null, 1, 2, 4]], [1, ['number', {'value': 4}], 0, 0, [0]], [2, 'steppitch', 0, 0, [0, 3, null]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
    const STUPLETOBJ = [[0,'stuplet', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const STUPLET3OBJ = [[0,'stuplet', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const STUPLET5OBJ = [[0,'stuplet', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const STUPLET7OBJ = [[0,'stuplet', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const SWINGOBJ = [[0, 'swing', x, y, [null, 1, null, 2]], [1, ['number', {'value': 32}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const SWITCHOBJ = [[0, 'switch', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'case', 0, 0, [0, 3, null, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, 'defaultcase', 0, 0, [2, null, null]], [5, 'hidden', 0, 0, [0, null]]];
    const TEMPOOBJ = [[0, 'tempo', x, y, [null, 1, 3]], [1, 'setmasterbpm', 0, 0, [0, 2, null]], [2, ['number', {'value': 90}], 0, 0, [1]], [3, 'hiddennoflow', 0, 0, [0, null]]];
    const THIRTYSECONDOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 32}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const TIEOBJ = [[0, 'tie', x, y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
    const TIMBREOBJ = [[0, ['timbre', {'collapsed': false}], x, y, [null, 1, null, 2]], [1, ['text', {'value': 'custom'}], 0, 0, [0]], [2, ['hiddennoflow', {}], 0, 0, [0, null]]];
	const TOMOBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('tom tom')}], 0, 0, [0]]];
    const TONEOBJ = [[0, 'drift', x, y, [null, 1, null]], [1, 'osctime', 0, 0, [0, 3, 2, null]], [2, 'vspace', 0, 0, [1, 6]], [3, 'divide', 0, 0, [1, 4, 5]], [4, ['number', {'value': 1000}], 0, 0, [3]], [5, ['number', {'value': 3}], 0, 0, [3]], [6, 'hertz', 0, 0, [2, 7, null]], [7, ['number', {'value': 392}], 0, 0, [6]]];
    const TRANSPOBJ = [[0, 'settransposition', x, y, [null, 1, null, 2]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const TRIANGLE1OBJ = [[0, 'playdrum', x, y, [null, 1, null]], [1, ['drumname', {'value': _('triangle bell')}], 0, 0, [0]]];
    const TRIANGLEOBJ = [[0, 'note', x, y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'triangle', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
    const TUPLETOBJ = [[0,'tuplet3', x, y, [null, 1, 10, 9, 7]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'rhythm2', 0, 0, [9, 3, 4, 8]], [3, ['number', {'value': 3}], 0, 0, [2]], [4, 'divide', 0, 0, [2, 5, 6]], [5, ['number', {'value': 1}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, 'hidden', 0, 0, [0, null]], [8, 'vspace', 0, 0, [2, null]], [9, 'vspace', 0, 0, [0, 2]], [10, 'divide', 0, 0, [0, 11, 12]], [11, ['number', {'value': 1}], 0, 0, [10]], [12, ['number', {'value': 4}], 0, 0, [10]]];
    const TUPLET4OBJ = [[0,'tuplet4', x, y, [null, 1, 4, 17]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 2}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'rhythm2', 0, 0, [4, 6, 7, 10]], [6, ['number', {'value': 6}], 0, 0, [5]], [7, 'divide', 0, 0, [5, 8, 9]], [8, ['number', {'value': 1}], 0, 0, [7]], [9, ['number', {'value': 16}], 0, 0, [7]], [10, 'vspace', 0, 0, [5, 11]], [11, 'rhythm2', 0, 0, [10, 12, 13, 16]], [12, ['number', {'value': 1}], 0, 0, [11]], [13, 'divide', 0, 0, [11, 14, 15]], [14, ['number', {'value': 1}], 0, 0, [13]], [15, ['number', {'value': 4}], 0, 0, [13]], [16, 'vspace', 0, 0, [11, null]], [17, 'hidden', 0, 0, [0, null]]];
    const TURTLENOTEOBJ = [[0, 'turtlenote2', x, y, [null, 1, null]], [1, 'turtlename', 0, 0, [0]]];
    const TURTLEPITCHOBJ = [[0, 'turtlepitch', x, y, [null, 1, null]], [1, 'turtlename', 0, 0, [0]]];
	const VIBRATOOBJ = [[0, ["vibrato", {}], x, y, [null, 1, 3, 2, 6]], [1, ["number", {"value": 5}], 0, 0, [0]], [2, ["vspace", {}], 0, 0, [0, null]], [3, ["divide", {}], 0, 0, [0, 4, 5]], [4, ["number", {"value": 1}], 0, 0, [3]], [5, ["number", {"value": 16}], 0, 0, [3]], [6, ["hidden", {}], 0, 0, [0, null]]];
	const VOLOBJ = [[0, 'setnotevolume2', x, y, [null, 1, null, 2]], [1, ['number', {'value': 50}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ15 = [[0, 'setnotevolume2', x, y, [null, 1, null, 2]], [1, ['number', {'value': 15}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ25 = [[0, 'setnotevolume2', x, y, [null, 1, null, 2]], [1, ['number', {'value': 25}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ35 = [[0, 'setnotevolume2', x, y, [null, 1, null, 2]], [1, ['number', {'value': 35}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ45 = [[0, 'setnotevolume2', x, y, [null, 1, null, 2]], [1, ['number', {'value': 45}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ55 = [[0, 'setnotevolume2', x, y, [null, 1, null, 2]], [1, ['number', {'value': 55}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ65 = [[0, 'setnotevolume2', x, y, [null, 1, null, 2]], [1, ['number', {'value': 65}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ75 = [[0, 'setnotevolume2', x, y, [null, 1, null, 2]], [1, ['number', {'value': 75}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const VOLOBJ85 = [[0, 'setnotevolume2', x, y, [null, 1, null, 2]], [1, ['number', {'value': 85}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
    const WHOLEOBJ = [[0, 'rhythm2', x, y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 1}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
    const XTURTLEOBJ = [[0, 'xturtle', x, y, [null, 1, null]], [1, 'turtlename', 0, 0, [0]]];
    const YTURTLEOBJ = [[0, 'yturtle', x, y, [null, 1, null]], [1, 'turtlename', 0, 0, [0]]];

    const BUILTINMACROS = {
        'action': ACTIONOBJ,
        'articulation': ARTICULATIONOBJ,
        'augmented1': AUGMENTED1OBJ,
        'augmented2': AUGMENTED2OBJ,
        'augmented4': AUGMENTED4OBJ,
        'augmented5': AUGMENTED5OBJ,
        'augmented7': AUGMENTED7OBJ,
        'augmented8': AUGMENTED8OBJ,
        'augmented': AUGMENTEDOBJ,
        'augmentedx': AUGMENTEDOBJ,
        'backward': BACKWARDOBJ,
        'bottle': BOTTLEOBJ,
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
        'diminished1': DIMINISHED1OBJ,
        'diminished4': DIMINISHED4OBJ,
        'diminished5': DIMINISHED5OBJ,
        'diminished8': DIMINISHED8OBJ,
        'diminished': DIMINISHEDOBJ,
        'diminishedx': DIMINISHEDOBJ,
        'dividebeatfactor': DIVBEATOBJ,
        'dog': DOGOBJ,
        'drift': DRIFTOBJ,
        'duck': DUCKOBJ,
        'duplicatenotes': DUPOBJ,
        'eighthNote': EIGHTHOBJ,
        'fff': VOLOBJ85,
        'ff': VOLOBJ75,
        'fill': FILLOBJ,
        'fingercymbals': FINGERCYMBALSOBJ,
        'flat': FLATOBJ,
        'floortom': FLOORTOMOBJ,
        'f': VOLOBJ65,
        'halfNote': HALFOBJ,
        'hihat': HIHATOBJ,
        'hollowline': HOLLOWOBJ,
        'invert': INVERTOBJ,
        'invert1': INVERT1OBJ,
        'kick': KICKOBJ,
        'major2': MAJOR2OBJ,
        'major3': MAJOR3OBJ,
        'major6': MAJOR6OBJ,
        'major7': MAJOR7OBJ,
        'major': MAJOROBJ,
        'majorx': MAJOROBJ,
        'matrix': MATRIXOBJ,
        'meter': METEROBJ,
        'mf': VOLOBJ55,
        'midi': MIDIOBJ,
        'minor2': MINOR2OBJ,
        'minor3': MINOR3OBJ,
        'minor6': MINOR6OBJ,
        'minor7': MINOR7OBJ,
        'minor': MINOROBJ,
        'minorx': MINOROBJ,
        'modewidget': MODEWIDGETOBJ,
        'mp': VOLOBJ45,
        'multiplybeatfactor': MULTBEATOBJ,
        'newnote': NEWNOTEOBJ,
        'newslur': NEWSLUROBJ,
        'newstaccato': NEWSTACCATOOBJ,
        'newswing2': NEWSWING2OBJ,
        'newswing': NEWSWINGOBJ,
        'note1': NOTE1OBJ,
        'note2': NOTE2OBJ,
        'note3': NOTE3OBJ,
        'note4': NOTE4OBJ,
        'note': NOTEOBJ,
        'octave': OCTAVEOBJ,
        'oneOf': ONEOFOBJ,
        'osctime': OSCTIMEOBJ,
        'perfect1': PERFECT1OBJ,
        'perfect4': PERFECT4OBJ,
        'perfect5': PERFECT5OBJ,
        'perfect8': PERFECT8OBJ,
        'perfect': PERFECTOBJ,
        'perfectx': PERFECTOBJ,
        'pickup': PICKUPOBJ,
        'pitchdrummatrix': PITCHDRUMMATRIXOBJ,
        'pitchslider': PITCHSLIDEROBJ,
        'pitchstaircase': PITCHSTAIRCASEOBJ,
        'playdrum': PLAYDRUMOBJ,
        'pluck': PLUCKOBJ,
        'ppp': VOLOBJ15,
        'pp': VOLOBJ25,
        'p': VOLOBJ35,
        'quarterNote': QUARTEROBJ,
        'rest2': RESTOBJ,
        'rhythm2': RHYTHMOBJ,
        'rhythmicdot': DOTOBJ,
        'rhythmruler': RHYTHMRULEROBJ,
        'ridebell': RIDEBELLOBJ,
        'sawtooth': SAWTOOTHOBJ,
        'setbpm': BPMOBJ,
        'setdrum': SETDRUMOBJ,
        'setkey2': SETKEYOBJ,
        'setnotevolume2': VOLOBJ,
        'settransposition': TRANSPOBJ,
        'setturtlename': SETTURTLENAMEOBJ,
        'setvoice': SETVOICEOBJ,
        'sharp': SHARPOBJ,
        'sine': SINEOBJ,
        'sixteenthNote': SIXTEENTHOBJ,
        'sixtyfourthNote': SIXTYFOURTHOBJ,
        'skipnotes': SKIPOBJ,
        'slap': SLAPOBJ,
        'slur': SLUROBJ,
        'snare': SNAREOBJ,
        'splash': SPLASHOBJ,
        'square': SQUAREOBJ,
        'staccato': STACCATOOBJ,
        'status': STATUSOBJ,
        'steppitch': STEPPITCHOBJ,
        'stuplet': STUPLETOBJ,
        'stuplet3': STUPLET3OBJ,
        'stuplet5': STUPLET5OBJ,
        'stuplet7': STUPLET7OBJ,
        'swing': SWINGOBJ,
		'switch': SWITCHOBJ,
        'tempo': TEMPOOBJ,
        'thirtysecondNote': THIRTYSECONDOBJ,
        'tie': TIEOBJ,
        'timbre': TIMBREOBJ,
		'tom': TOMOBJ,
        'tone': TONEOBJ,
        'triangle1': TRIANGLE1OBJ,
        'triangle': TRIANGLEOBJ,
        'tuplet3': TUPLETOBJ,
        'tuplet4': TUPLET4OBJ,
        'turtlenote2': TURTLENOTEOBJ,
        'turtlepitch': TURTLEPITCHOBJ,
        'vibrato': VIBRATOOBJ,
        'wholeNote': WHOLEOBJ,
        'xturtle': XTURTLEOBJ,
        'yturtle': YTURTLEOBJ,
    };

	if (['namedbox', 'nameddo', 'namedcalc', 'namedarg', 'nameddoArg'].indexOf(blkname) === -1 && blkname in BUILTINMACROS) {
        return BUILTINMACROS[blkname];
    } else {
        return null;
    }
};
