// Copyright (c) 2016,17 Walter Bender
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

// We don't include 'extras' since we want to be able to delete
// plugins from the extras palette.
BUILTINPALETTES = ['rhythm', 'pitch', 'tone', 'intervals', 'drum', 'flow', 'action', 'boxes', 'widgets', 'mouse', 'pen', 'number', 'boolean', 'media', 'sensors', 'heap', 'mice', 'extras'];

const BUILTINPALETTESFORL23N = [_('rhythm'), _('pitch'), _('tone'), _('intervals'), _('drum'), _('flow'), _('action'), _('boxes'), _('widgets'), _('mouse'), _('pen'), _('number'), _('boolean'), _('media'), _('sensors'), _('heap'), _('mice'), _('extras')];


function getMainToolbarButtonNames(name) {
    return (['popdown-palette', 'run', 'step', 'step-music', 'stop-turtle', 'clear', 'palette', 'hide-blocks', 'collapse-blocks', 'go-home', 'help'].indexOf(name) > -1);
};


function getAuxToolbarButtonNames(name) {
    return (['planet', 'open', 'save', 'lilypond', 'paste-disabled', 'Cartesian', 'compile', 'utility', 'empty-trash', 'restore-trash'].indexOf(name) > -1);
}


function createDefaultStack() {
    DATAOBJS =
        [[0, 'start', screen.width / 3, 75, [null, 1, null]],

         [1, 'newnote', 0, 0, [0, 2, 5, 9]],
         [2, 'divide', 0, 0, [1, 3, 4]],
         [3, ['number', {'value': 1}], 0, 0, [2]],
         [4, ['number', {'value': 4}], 0, 0, [2]],
         [5, 'vspace', 0, 0, [1, 6]],
         [6, 'pitch', 0, 0, [5, 7, 8, null]],
         [7, ['solfege', {'value': 'sol'}], 0, 0, [6]],
         [8, ['number', {'value': 4}], 0, 0, [6]],
         [9, 'hidden', 0, 0, [1, 10]],

         [10, 'newnote', 0, 0, [9, 11, 14, 18]],
         [11, 'divide', 0, 0, [10, 12, 13]],
         [12, ['number', {'value': 1}], 0, 0, [11]],
         [13, ['number', {'value': 4}], 0, 0, [11]],
         [14, 'vspace', 0, 0, [10, 15]],
         [15, 'pitch', 0, 0, [14, 16, 17, null]],
         [16, ['solfege', {'value': 'mi'}], 0, 0, [15]],
         [17, ['number', {'value': 4}], 0, 0, [15]],
         [18, 'hidden', 0, 0, [10, 19]],

         [19, 'newnote', 0, 0, [18, 20, 23, 27]],
         [20, 'divide', 0, 0, [19, 21, 22]],
         [21, ['number', {'value': 1}], 0, 0, [20]],
         [22, ['number', {'value': 2}], 0, 0, [20]],
         [23, 'vspace', 0, 0, [19, 24]],
         [24, 'pitch', 0, 0, [23, 25, 26, null]],
         [25, ['solfege', {'value': 'sol'}], 0, 0, [24]],
         [26, ['number', {'value': 4}], 0, 0, [24]],
         [27, 'hidden', 0, 0, [19, null]],
        ];
};


function createHelpContent() {
    HELPCONTENT = [
        [_('Welcome to Music Blocks'), _('Music Blocks is a collection of manipulative tools for exploring fundamental musical concepts in an integrative and fun way.'), 'activity/activity-icon-mouse-color.svg'],
        [_('Meet Mr. Mouse!'), _('Mr Mouse is our Music Blocks conductor.') + ' ' + _('Mr Mouse encourages you to explore Music Blocks.') + ' ' + _('Let us start our tour!'), 'activity/activity-icon-mouse-color.svg'],
        //.TRANS: Please add commas to list: Matrix, Notes, Tone, Turtle, and more.
	//.TRANS: the buttons used to open various palettes of blocks
        [_('Palette buttons'), _('This toolbar contains the palette buttons Matrix Notes Tone Turtle and more.') + ' ' + _('Click to show the palettes of blocks and drag blocks from the palettes onto the canvas to use them.'), 'images/icons.svg'],
        [_('Run fast'), _('Click to run the project in fast mode.'), 'header-icons/fast-button.svg'],
        [_('Run slow'), _('Click to run the project in slow mode.'), 'header-icons/slow-button.svg'],
        [_('Run music slow'), _('Click to run just the music in slow mode.'), 'header-icons/slow-music-button.svg'],
        [_('Run step by step'), _('Click to run the project step by step.'), 'header-icons/step-button.svg'],
        [_('Run note by note'), _('Click to run the music note by note.'), 'header-icons/step-music-button.svg'],
        [_('Stop'), _('Stop the music (and the turtles).'), 'header-icons/stop-turtle-button.svg'],
        [_('Clean'), _('Clear the screen and return the turtles to their initial positions.'), 'header-icons/clear-button.svg'],
        [_('Show/hide palettes'), _('Hide or show the block palettes.'), 'header-icons/palette-button.svg'],
        [_('Show/hide blocks'), _('Hide or show the blocks and the palettes.'), 'header-icons/hide-blocks-button.svg'],
        [_('Expand/collapse collapsable blocks'), _('Expand or collapse start and action stacks.'), 'header-icons/collapse-blocks-button.svg'],
        [_('Home'), _('Return all blocks to the center of the screen.'), 'header-icons/go-home-button.svg'],
        [_('Help'), _('Show these messages.'), 'header-icons/help-button.svg'],
        [_('Expand/collapse option toolbar'), _('Click this button to expand or collapse the auxillary toolbar.'), 'header-icons/menu-button.svg'],
        [_('Load samples from server'), _('This button opens a viewer for loading example projects.'), 'header-icons/planet-button.svg'],
        [_('Load project from files'), _('You can also load projects from the file system.'), 'header-icons/open-button.svg'],
        [_('Save project'), _('Save your project to a file.'), 'header-icons/save-button.svg'],
        [_('Save sheet music'), _('Save your project to as a Lilypond file.'), 'header-icons/lilypond-button.svg'],
        [_('Copy'), _('To copy a stack to the clipboard, do a long press on the stack.') + ' ' + _('The Paste Button will highlight.'), 'header-icons/paste-button.svg'],
        [_('Paste'), _('The paste button is enabled when there are blocks copied onto the clipboard.'), 'header-icons/paste-disabled-button.svg'],
        [_('Save stack'), _('The save-stack button saves a stack onto a custom palette.') + ' ' + _('It appears after a long press on a stack.'), 'header-icons/save-blocks-button.svg'],
        [_('Cartesian') + '/' + _('Polar'), _('Show or hide a coordinate grid.'), 'header-icons/Cartesian-polar-button.svg'],
        // [_('Polar'), _('Show or hide a polar-coordinate grid.'), 'header-icons/polar-button.svg'],
        [_('Settings'), _('Open a panel for configuring Music Blocks.'), 'header-icons/utility-button.svg'],
        [_('Decrease block size'), _('Decrease the size of the blocks.'), 'header-icons/smaller-button.svg'],
        [_('Increase block size'), _('Increase the size of the blocks.'), 'header-icons/bigger-button.svg'],
        [_('Display statistics'), _('Display statistics about your Music project.'), 'header-icons/stats-button.svg'],
        [_('Load plugin from file'), _('You can load new blocks from the file system.'), 'header-icons/plugins-button.svg'],
        [_('Enable scrolling'), _('You can scroll the blocks on the canvas.'), 'header-icons/scroll-unlock-button.svg'],
        [_('Delete all'), _('Remove all content on the canvas, including the blocks.'), 'header-icons/empty-trash-button.svg'],
        [_('Undo'), _('Restore blocks from the trash.'), 'header-icons/restore-trash-button.svg'],
        [_('Congratulations.'), _('You have finished the tour. Please enjoy Music Blocks!'), 'activity/activity-icon-mouse-color.svg']
    ];
};
