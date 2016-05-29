// Copyright (c) 2016 Walter Bender
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
BUILTINPALETTES = ['rhythm', 'pitch', 'tone', 'drum', 'rhythmruler', 'flow', 'action', 'boxes', 'matrix', 'turtle', 'pen', 'number', 'boolean', 'media', 'sensors', 'heap', 'extras'];

const BUILTINPALETTESFORL23N = [_('rhythm'), _('pitch'), _('tone'), _('drum'), _('rhythmruler'), _('flow'), _('action'), _('boxes'), _('matrix'), _('turtle'), _('pen'), _('number'), _('boolean'), _('media'), _('sensors'), _('heap'), _('extras')];

function getMainToolbarButtonNames(name) {
    return (['fast', 'slow', 'slow-music', 'step', 'step-music', 'stop-turtle', 'clear', 'palette', 'hide-blocks', 'collapse-blocks', 'go-home', 'help'].indexOf(name) > -1);
};


function getAuxToolbarButtonNames(name) {
    return (['planet', 'open', 'save', 'lilypond', 'paste-disabled', 'Cartesian', 'polar', 'utility', 'empty-trash', 'restore-trash'].indexOf(name) > -1);
}


function createDefaultStack() {
    DATAOBJS =
        [[0, 'start', 250, 100, [null, null, null]],
         [1, 'matrix', 800, 100, [null, 2, 25]],

         [2, 'pitch', 0, 0, [1, 3, 4, 5]],
         [3, ['solfege', {value:'ti'}], 0, 0, [2]],
         [4, ['number', {value:'4'}], 0, 0, [2]],

         [5, 'pitch', 0, 0, [2, 6, 7, 8]],
         [6, ['solfege', {value:'la'}], 0, 0, [5]],
         [7, ['number', {value:'4'}], 0, 0, [5]],

         [8, 'pitch', 0, 0, [5, 9, 10, 11]],
         [9, ['solfege', {value:'sol'}], 0, 0, [8]],
         [10, ['number', {value:'4'}], 0, 0, [8]],

         [11, 'pitch', 0, 0, [8, 12, 13, 14]],
         [12, ['solfege', {value:'mi'}], 0, 0, [11]],
         [13, ['number', {value:'4'}], 0, 0, [11]],

         [14, 'pitch', 0, 0, [11, 15, 16, 17]],
         [15, ['solfege', {value:'re'}], 0, 0, [14]],
         [16, ['number', {value:'4'}], 0, 0, [14]],

         [17, "repeat", 0, 0, [14, 18, 19, null]],
         [18, ["number", {"value":2}], 0, 0, [17]],

         [19, "rhythm", 0, 0, [17, 20, 21, 22]],
         [20, ["number", {"value":6}], 0, 0, [19]],
         [21, ["number", {"value":4}], 0, 0, [19]],

         [22, "rhythm", 0, 0, [19, 23, 24, null]],
         [23, ["number", {"value":1}], 0, 0, [22]],
         [24, ["number", {"value":2}], 0, 0, [22]],
         [25, 'hidden', 0, 0, [1, null]]
        ];
};


function createHelpContent() {
    HELPCONTENT = [
        [_('Welcome to Music Blocks'), _('Music Blocks is a collection of manipulative tools for exploring fundamental musical concepts in an integrative and fun way.'), 'activity/activity-icon-mouse-color.svg'],
        [_('Meet Mr. Mouse!'), _('Mr Mouse is our Music Blocks conductor.') + ' ' + _('Mr Mouse encourages you to explore Music Blocks.') + ' ' + _('Let us start our tour!'), 'activity/activity-icon-mouse-color.svg'],
        //.TRANS: Please add commas to list: Matrix, Notes, Tone, Turtle, and more.
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
        [_('Cartesian'), _('Show or hide a Cartesian-coordinate grid.'), 'header-icons/Cartesian-button.svg'],
        [_('Polar'), _('Show or hide a polar-coordinate grid.'), 'header-icons/polar-button.svg'],
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

