// Copyright (c) 2016-2018 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
//

const NUMBERBLOCKDEFAULT = 4;

const DEFAULTPALETTE = 'rhythm';

const TITLESTRING = _('Music Blocks is a collection of tools for exploring musical concepts.');

// We don't include 'extras' since we want to be able to delete
// plugins from the extras palette.
BUILTINPALETTES = ['search', 'rhythm',  'meter', 'pitch', 'intervals', 'tone', 'volume', 'drum', 'flow', 'action', 'boxes', 'widgets', 'mouse', 'pen', 'number', 'boolean', 'media', 'sensors', 'heap', 'mice', 'extras'];

const BUILTINPALETTESFORL23N = [_('search'), _('rhythm'), _('meter'), _('pitch'), _('intervals'), _('tone'), _('volume'), _('drum'), _('flow'), _('action'), _('boxes'), _('widgets'), _('mouse'), _('pen'), _('number'), _('boolean'), _('media'), _('sensors'), _('heap'), _('mice'), _('extras')];


function getMainToolbarButtonNames(name) {
    return (['popdown-palette', 'run', 'step', 'step-music', 'stop-turtle', 'hard-stop-turtle', 'clear', 'palette', 'hide-blocks', 'collapse-blocks', 'go-home', 'help', 'sugarizer-stop', 'beginner', 'advanced'].indexOf(name) > -1);
};


function getAuxToolbarButtonNames(name) {
    return (['planet', 'planet-disabled', 'open', 'save', 'paste-disabled', 'Cartesian', 'compile', 'utility', 'new', 'restore-trash'].indexOf(name) > -1);
};


function beginnerBlock(name) {
    // Only these blocks appear on the palette in beginner mode.
    return ['newnote', 'note4', 'rest2', 'mynotevalue',  // notes palette
            'meter', 'setmasterbpm2', 'everybeatdo', 'onbeatdo', 'offbeatdo', 'drift', // meter palette
            'pitch', 'pitch2', 'steppitch', 'hertz', 'flat', 'sharp', 'setscalartransposition', 'settransposition', 'deltapitch', // pitch palette
            'setkey2', 'modelength', 'movable', 'definemode', 'interval', 'semitoneinterval', // interval palette
            'settimbre', 'newstaccato', 'newslur', // tone palette
            'crescendo', 'setsynthvolume', // volume palette
            'playdrum', 'setdrum', // drum palette
            'if', 'ifthenelse', 'repeat', 'forever', // flow palette
            'action', 'start', 'dispatch', 'listen', // action palette
            'storebox1', 'box1', 'storebox2', 'box2', 'increment', 'incrementOne',  // boxes palette
            'status', 'matrix', 'rhythmruler2', 'tempo', 'modewidget', 'rhythm2', 'stuplet', // widgets palette
            'forward', 'left', 'right', 'setxy', 'setheading', 'arc', 'clear', 'x', 'y', 'heading', // mouse palette
            'setcolor', 'setshade', 'setpensize', 'penup', 'pendown', 'fill', 'background', 'color', 'shade', 'pensize', // pen palette
            'number', 'random', 'oneOf', 'plus', 'minus', 'multiply', 'divide', // number palette
            'equal', 'less', 'greater', // boolean palette
            'text', 'media', 'show', 'turtleshell', 'speak', 'height', 'width', 'bottompos', 'toppos', 'leftpos', 'rightpos', // media palette
            'mousebutton', 'mousex', 'mousey', 'time', 'myclick', 'loudness', // sensor palette
            'push', 'pop', 'setHeapEntry', 'indexHeap', 'reverseHeap', 'emptyHeap', 'heapEmpty', 'heapLength', 'showHeap', // heap palette
            'setturtlename2', 'turtlename', 'turtlesync', // mice palette
            'print', 'hspace', 'vspace' // extras palette
           ].indexOf(name) !== -1
};


function createDefaultStack() {
    DATAOBJS =
        [[0, 'start', screen.width / 3, 75, [null, 1, null]],

         [1, 'settimbre', 0, 0, [0, 2, 4, 3]],
         [2, ['voicename', {'value': 'guitar'}], 0, 0, [1]],
         [3, 'hidden', 0, 0, [1, null]],

         [4, 'newnote', 0, 0, [1, 5, 8, 12]],
         [5, 'divide', 0, 0, [4, 6, 7]],
         [6, ['number', {'value': 1}], 0, 0, [5]],
         [7, ['number', {'value': 4}], 0, 0, [5]],
         [8, 'vspace', 0, 0, [4, 9]],
         [9, 'pitch', 0, 0, [8, 10, 11, null]],
         [10, ['solfege', {'value': 'sol'}], 0, 0, [9]],
         [11, ['number', {'value': 4}], 0, 0, [9]],
         [12, 'hidden', 0, 0, [4, 13]],

         [13, 'newnote', 0, 0, [12, 14, 17, 21]],
         [14, 'divide', 0, 0, [13, 15, 16]],
         [15, ['number', {'value': 1}], 0, 0, [14]],
         [16, ['number', {'value': 4}], 0, 0, [14]],
         [17, 'vspace', 0, 0, [13, 18]],
         [18, 'pitch', 0, 0, [17, 19, 20, null]],
         [19, ['solfege', {'value': 'mi'}], 0, 0, [18]],
         [20, ['number', {'value': 4}], 0, 0, [18]],
         [21, 'hidden', 0, 0, [13, 22]],

         [22, 'newnote', 0, 0, [21, 23, 26, 30]],
         [23, 'divide', 0, 0, [22, 24, 25]],
         [24, ['number', {'value': 1}], 0, 0, [23]],
         [25, ['number', {'value': 2}], 0, 0, [23]],
         [26, 'vspace', 0, 0, [22, 27]],
         [27, 'pitch', 0, 0, [26, 28, 29, null]],
         [28, ['solfege', {'value': 'sol'}], 0, 0, [27]],
         [29, ['number', {'value': 4}], 0, 0, [27]],
         [30, 'hidden', 0, 0, [22, null]]
        ];
};


function createHelpContent() {
    HELPCONTENT = [
        [_('Welcome to Music Blocks'), _('Music Blocks is a collection of manipulative tools for exploring fundamental musical concepts in an integrative and fun way.'), 'activity/activity-icon-mouse-color.svg'],
        [_('Meet Mr. Mouse!'), _('Mr Mouse is our Music Blocks conductor.') + ' ' + _('Mr Mouse encourages you to explore Music Blocks.') + ' ' + _('Let us start our tour!'), 'activity/activity-icon-mouse-color.svg'],
        //.TRANS: the buttons used to open various palettes of blocks
        [_('Palette buttons'),
        //.TRANS: Please add commas to list: Rhythm, Pitch, Tone, Action, and more.
         _('This toolbar contains the palette buttons, including Rhythm Pitch Tone Action and more.') + ' ' + _('Click to show the palettes of blocks and drag blocks from the palettes onto the canvas to use them.'), 'images/icons.svg'],
        [_('Play music'), _('Click to run the music note by note.') + ' ' + _('Alternatively, you can hit the ENTER or RETURN key.'), 'header-icons/play-button.svg'],
        [_('Run fast'), _('Click the run button to run the project in fast mode.'), 'header-icons/run-button.svg'],
        [_('Run slow'), _('Long press the run button to run the project in slow mode.'), 'header-icons/slow-button.svg'],
        [_('Run music slow'), _('Extra-long press the run button to run the music in slow mode.'), 'header-icons/slow-music-button.svg'],
        [_('Run step by step'), _('Click to run the project step by step.'), 'header-icons/step-button.svg'],
        [_('Run note by note'), _('Click to run the music note by note.'), 'header-icons/step-music-button.svg'],
        [_('Stop'), _('Stop the music (and the turtles).') + ' ' + _('You can also type Alt-S to stop.'), 'header-icons/stop-turtle-button.svg'],
        [_('Clean'), _('Clear the screen and return the turtles to their initial positions.'), 'header-icons/clear-button.svg'],
        [_('Show/hide blocks'), _('Hide or show the blocks and the palettes.'), 'header-icons/hide-blocks-button.svg'],
        [_('Expand/collapse collapsable blocks'), _('Expand or collapse start and action stacks.'), 'header-icons/collapse-blocks-button.svg'],
        [_('Home'), _('Return all blocks to the center of the screen.'), 'header-icons/go-home-button.svg'],
        [_('Switch mode'), _('Switch between beginner and advance modes.'), 'header-icons/advanced-button.svg'],
        [_('Help'), _('Show these messages.'), 'header-icons/help-button.svg'],
        [_('Expand/collapse option toolbar'), _('Click this button to expand or collapse the auxillary toolbar.'), 'header-icons/menu-button.svg'],
        [_('Load samples from server'), _('This button opens a viewer for loading example projects.'), 'header-icons/planet-button.svg'],
        [_('Load project from files'), _('You can also load projects from the file system.'), 'header-icons/open-button.svg'],
        [_('Save project'), _('Save your project to a file.'), 'header-icons/save-button.svg'],
        [_('Save sheet music'), _('Save your project to as a Lilypond file.'), 'header-icons/lilypond-button.svg'],
        [_('Copy'), _('To copy a stack to the clipboard, do a long press on the stack.') + ' ' + _('You can also use Alt+C to copy a stack of blocks.') + ' ' + _('The Paste Button will highlight.'), 'header-icons/paste-button.svg'],
        [_('Paste'), _('The paste button is enabled when there are blocks copied onto the clipboard.') + ' ' + _('You can also use Alt+V to paste a stack of blocks. '), 'header-icons/paste-disabled-button.svg'],
        [_('Cartesian') + '/' + _('Polar'), _('Show or hide a coordinate grid.'), 'header-icons/Cartesian-polar-button.svg'],
        // [_('Polar'), _('Show or hide a polar-coordinate grid.'), 'header-icons/polar-button.svg'],
        [_('Settings'), _('Open a panel for configuring Music Blocks.'), 'header-icons/utility-button.svg'],
        [_('Search'), _('You can search for blocks by name.'), 'header-icons/search-button.svg'],
        [_('Enable scrolling'), _('You can scroll the blocks on the canvas.'), 'header-icons/scroll-unlock-button.svg'],
        [_('Decrease block size'), _('Decrease the size of the blocks.'), 'header-icons/smaller-button.svg'],
        [_('Increase block size'), _('Increase the size of the blocks.'), 'header-icons/bigger-button.svg'],
        [_('Display statistics'), _('Display statistics about your Music project.'), 'header-icons/stats-button.svg'],
        [_('Load plugin from file'), _('You can load new blocks from the file system.'), 'header-icons/plugins-button.svg'],
        [_('Delete plugin'), _('Delete a selected plugin.'), 'header-icons/plugins-delete-button.svg'],
        [_('Select language'), _('Select your language preference.'), 'header-icons/language-button.svg'],
        [_('New Project'), _('Initialise a new project.'), 'header-icons/new-project-button.svg'],
        [_('Restore'), _('Restore blocks from the trash.'), 'header-icons/restore-trash-button.svg'],
        [_('Keyboard shortcuts'), _('You can type "d" to create a "do" block, "r" to create a "re" block, etc.'), 'header-icons/type-icon.svg'],
        [_('Guide'), _('A detailed guide to Music Blocks is available.'), 'activity/activity-icon-mouse-color.svg', 'https://sugarlabs.github.io/musicblocks/guide', _('Music Blocks Guide')],
        [_('Congratulations.'), _('You have finished the tour. Please enjoy Music Blocks!'), 'activity/activity-icon-mouse-color.svg']
    ];
};
