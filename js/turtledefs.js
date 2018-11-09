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

const VERSION = '2.6';

// We don't include 'extras' since we want to be able to delete
// plugins from the extras palette.
const BUILTINPALETTES = ['search', 'rhythm',  'meter', 'pitch', 'intervals', 'tone', 'ornament', 'volume', 'drum', 'flow', 'action', 'boxes', 'widgets', 'graphics', 'pen', 'number', 'boolean', 'media', 'sensors', 'heap', 'ensemble', 'extras'];

const BUILTINPALETTESFORL23N = [_('search'), _('rhythm'), _('meter'), _('pitch'), _('intervals'), _('tone'), _('ornament'), _('volume'), _('drum'), _('flow'), _('action'), _('boxes'), _('widgets'), _('graphics'), _('pen'), _('number'), _('boolean'), _('media'), _('sensors'), _('heap'), _('ensemble'), _('extras')];

// We put the palette buttons into groups.
const MULTIPALETTES = [['rhythm',  'meter', 'pitch', 'intervals', 'tone', 'ornament', 'volume', 'drum', 'widgets'], ['flow', 'action', 'boxes', 'number', 'boolean', 'heap', 'extras'], ['graphics', 'pen', 'media', 'sensors', 'ensemble']];

// Skip these palettes in beginner mode.
const SKIPPALETTES = ['heap', 'extras'];

// Icons used to select between multipalettes.
const MULTIPALETTEICONS = ['music', 'logic', 'artwork'];
const MULTIPALETTENAMES = [_('music'), _('logic'), _('artwork')];

function getMainToolbarButtonNames(name) {
   return (['popdown-palette', 'run', 'step', 'step-music', 'stop-turtle', 'hard-stop-turtle', 'palette', 'help', 'sugarizer-stop', 'beginner', 'advanced', 'planet', 'planet-disabled', 'open', 'save', 'new'].indexOf(name) > -1);
};


function getAuxToolbarButtonNames(name) {
   return (['paste-disabled', 'Cartesian', 'compile', 'utility', 'restore-trash', 'hide-blocks', 'collapse-blocks', 'go-home'].indexOf(name) > -1);
};


function beginnerBlock(name) {
   // Only these blocks appear on the palette in beginner mode.
   return ['newnote', 'note4', 'rest2', 'mynotevalue',  // notes palette
           'meter', 'setbpm3', 'setmasterbpm2', 'everybeatdo', 'beatvalue', 'elapsednotes2', // meter palette
           'pitch', 'pitchnumber', 'hertz', 'steppitch', 'fourth', 'fifth', 'mypitch', 'pitchinhertz', // pitch palette
           'setkey2', 'modelength', 'thirdinterval', 'sixthinterval', 'chordI', 'chordIV', 'chordV', 'settemperament', // interval palette
           'settimbre', 'newstaccato', 'newslur', 'tie', 'vibrato', 'chorus', 'tremolo', 'neighbor2', // tone palette
           'crescendo', 'decrescendo', 'setnotevolume', 'setsynthvolume', 'setdrumvolume', // volume palette
           'playdrum', 'playeffect', 'setdrum', // drum palette
           'if', 'ifthenelse', 'repeat', 'forever', 'backward', // flow palette
           'action', 'start', 'do', 'dispatch', 'listen',  // action palette
           'storebox1', 'box1', 'storebox2', 'box2', 'increment', 'incrementOne', 'storein', 'namedbox',  // boxes palette
           'status', 'matrix', 'rhythmruler2', 'pitchslider', 'rhythm2', 'stuplet', 'musickeyboard', 'tempo', 'modewidget', 'matrixcmajor', 'matrixgmajor', // widgets palette
           'forward', 'back', 'left', 'right', 'setxy', 'arc', 'x', 'y', 'heading', 'scrollxy',  // mouse palette
           'setpensize', 'penup', 'pendown', 'color', 'setcolor', 'setshade',  // pen palette
           'number', 'random', 'oneOf', 'plus', 'minus', 'multiply', 'divide',  // number palette
           'equal', 'less', 'greater',  // boolean palette
           'text', 'media', 'show', 'turtleshell', 'speak', 'height', 'width', 'bottompos', 'toppos', 'leftpos', 'rightpos',  // media palette
           'mousebutton', 'mousex', 'mousey', 'myclick', // sensor palette
           'push', 'pop', 'setHeapEntry', 'indexHeap', 'reverseHeap', 'emptyHeap', 'heapEmpty', 'heapLength', 'showHeap',  // heap palette
           'setturtlename2', 'turtlename', // mice palette
           'print',  // extras palette
          ].indexOf(name) !== -1
};


function createDefaultStack() {
   DATAOBJS =
       [[0, 'start', screen.width / 3, 100, [null, 1, null]],

        [1, 'settimbre', 0, 0, [0, 2, 4, 3]],
        [2, ['voicename', {'value': 'guitar'}], 0, 0, [1]],
        [3, 'hidden', 0, 0, [1, null]],

        [4, 'newnote', 0, 0, [1, 5, 8, 12]],
        [5, 'divide', 0, 0, [4, 6, 7]],
        [6, ['number', {'value': 1}], 0, 0, [5]],
        [7, ['number', {'value': 2}], 0, 0, [5]],
        [8, 'vspace', 0, 0, [4, 9]],
        [9, 'pitch', 0, 0, [8, 10, 11, null]],
        [10, ['solfege', {'value': 'do'}], 0, 0, [9]],
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
        [25, ['number', {'value': 4}], 0, 0, [23]],
        [26, 'vspace', 0, 0, [22, 27]],
        [27, 'pitch', 0, 0, [26, 28, 29, null]],
        [28, ['solfege', {'value': 'sol'}], 0, 0, [27]],
        [29, ['number', {'value': 4}], 0, 0, [27]],
        [30, 'hidden', 0, 0, [22, 31]],

        [31, 'newnote', 0, 0, [30, 32, 35, 39]],
        [32, 'divide', 0, 0, [31, 33, 34]],
        [33, ['number', {'value': 1}], 0, 0, [32]],
        [34, ['number', {'value': 1}], 0, 0, [32]],
        [35, 'vspace', 0, 0, [31, 36]],
        [36, 'pitch', 0, 0, [35, 37, 38, null]],
        [37, ['solfege', {'value': 'do'}], 0, 0, [36]],
        [38, ['number', {'value': 5}], 0, 0, [36]],
        [39, 'hidden', 0, 0, [31, null]]
       ];
};


function createHelpContent() {
    if (beginnerMode) {
        HELPCONTENT = [
            [_('Welcome to Music Blocks'), _('Music Blocks is a collection of manipulative tools for exploring fundamental musical concepts in an integrative and fun way.'), 'images/logo.svg'],
            [_('Meet Mr. Mouse!'), _('Mr Mouse is our Music Blocks conductor.') + ' ' + _('Mr Mouse encourages you to explore Music Blocks.') + ' ' + _('Let us start our tour!'), 'images/logo.svg'],
            [_('Palette buttons'), _('This toolbar contains the palette buttons, including Rhythm Pitch Tone Action and more.') + ' ' + _('Click to show the palettes of blocks and drag blocks from the palettes onto the canvas to use them.'), 'images/icons.svg'],
            [_('Play'), _('Click the run button to run the project in fast mode.'), 'header-icons/run-button.svg'],
            [_('Stop'), _('Stop the music (and the mice).') + ' ' + _('You can also type Alt-S to stop.'), 'header-icons/stop-turtle-button.svg'],
            [_('New Project'), _('Initialise a new project.'), 'header-icons/new-button.svg'],
            [_('Load project from file'), _('You can also load projects from the file system.'), 'header-icons/open-button.svg'],
            [_('Save project'), _('Save your project to a file.'), 'header-icons/save-button.svg'],
            [_('Find and share projects'), _('This button opens a viewer for sharing projects and for finding example projects.'), 'header-icons/planet-button.svg'],
            [_('Expand/collapse option toolbar'), _('Click this button to expand or collapse the auxillary toolbar.'), 'header-icons/menu-button.svg'],
            [_('Help'), _('Show these messages.'), 'header-icons/help-button.svg'],
            [_('Run slow'), _('Click to run the project in slow mode.'), 'header-icons/slow-button.svg'],
            [_('Run step by step'), _('Click to run the project step by step.'), 'header-icons/step-button.svg'],
            [_('Show/hide blocks'), _('Hide or show the blocks and the palettes.'), 'header-icons/hide-blocks-button.svg'],
            [_('Expand/collapse collapsable blocks'), _('Expand or collapse start and action stacks.'), 'header-icons/collapse-blocks-button.svg'],
            [_('Home'), _('Return all blocks to the center of the screen.'), 'header-icons/go-home-button.svg'],
            [_('Cartesian') + '/' + _('Polar'), _('Show or hide a coordinate grid.'), 'header-icons/Cartesian-polar-button.svg'],
            [_('Settings'), _('Open a panel for configuring Music Blocks.'), 'header-icons/utility-button.svg'],
            [_('Restore'), _('Restore blocks from the trash.'), 'header-icons/restore-trash-button.svg'],
            [_('Switch mode'), _('Switch between beginner and advance modes.'), 'header-icons/advanced-button.svg'],
            [_('Select language'), _('Select your language preference.'), 'header-icons/language-button.svg'],
            [_('Decrease block size'), _('Decrease the size of the blocks.'), 'header-icons/smaller-button.svg'],
            [_('Increase block size'), _('Increase the size of the blocks.'), 'header-icons/bigger-button.svg'],
            [_('Clean'), _('Clear the screen and return the mice to their initial positions.'), 'header-icons/clear-button.svg'],
            [_('Collapse'), _('Collapse the graphics window.'), 'header-icons/collapse-button.svg'],
            [_('Keyboard shortcuts'), _('You can type "d" to create a "do" block, "r" to create a "re" block, etc.'), 'header-icons/type-icon.svg'],
            [_('Guide'), _('A detailed guide to Music Blocks is available.'), 'images/logo.svg', 'https://sugarlabs.github.io/musicblocks/guide', _('Music Blocks Guide')],
            [_('About'), _('Music Blocks is an open source collection of tools for exploring musical concepts. A full list of contributors can be found in the Music Blocks GitHub repository. Music Blocks is licensed under the AGPL. The current version is:') + ' ' + VERSION, 'images/logo.svg', 'https://github.com/sugarlabs/musicblocks', _('Music Blocks GitHub repository')],
            [_('Congratulations.'), _('You have finished the tour. Please enjoy Music Blocks!'), 'images/logo.svg']
        ];
    } else {
        HELPCONTENT = [
            [_('Welcome to Music Blocks'), _('Music Blocks is a collection of manipulative tools for exploring fundamental musical concepts in an integrative and fun way.'), 'images/logo.svg'],
            [_('Meet Mr. Mouse!'), _('Mr Mouse is our Music Blocks conductor.') + ' ' + _('Mr Mouse encourages you to explore Music Blocks.') + ' ' + _('Let us start our tour!'), 'images/logo.svg'],
            //.TRANS: the buttons used to open various palettes of blocks
            [_('Palette buttons'),
             //.TRANS: Please add commas to list: Rhythm, Pitch, Tone, Action, and more.
             _('This toolbar contains the palette buttons, including Rhythm Pitch Tone Action and more.') + ' ' + _('Click to show the palettes of blocks and drag blocks from the palettes onto the canvas to use them.'), 'images/icons.svg'],
            // [_('Play music'), _('Click to run the music note by note.') + ' ' + _('Alternatively, you can hit the ENTER or RETURN key.'), 'header-icons/play-button.svg'],
            [_('Run fast'), _('Click the run button to run the project in fast mode.'), 'header-icons/run-button.svg'],
            [_('Run slow'), _('Click to run the project in slow mode.'), 'header-icons/slow-button.svg'],
            // [_('Run music slow'), _('Extra-long press the run button to run the music in slow mode.'), 'header-icons/slow-music-button.svg'],
            [_('Run step by step'), _('Click to run the project step by step.'), 'header-icons/step-button.svg'],
            // [_('Run note by note'), _('Click to run the music note by note.'), 'header-icons/step-music-button.svg'],
            [_('Stop'), _('Stop the music (and the mice).') + ' ' + _('You can also type Alt-S to stop.'), 'header-icons/stop-turtle-button.svg'],
            [_('Expand/collapse option toolbar'), _('Click this button to expand or collapse the auxiliary toolbar.'), 'header-icons/menu-button.svg'],
            [_('Help'), _('Show these messages.'), 'header-icons/help-button.svg'],
            [_('Clean'), _('Clear the screen and return the mice to their initial positions.'), 'header-icons/clear-button.svg'],
            [_('Collapse'), _('Collapse the graphics window.'), 'header-icons/collapse-button.svg'],
            [_('Show/hide blocks'), _('Hide or show the blocks and the palettes.'), 'header-icons/hide-blocks-button.svg'],
            [_('Expand/collapse collapsible blocks'), _('Expand or collapse start and action stacks.'), 'header-icons/collapse-blocks-button.svg'],
            [_('Home'), _('Return all blocks to the center of the screen.'), 'header-icons/go-home-button.svg'],
            [_('Expand/collapse option toolbar'), _('Click this button to expand or collapse the auxiliary toolbar.'), 'header-icons/menu-button.svg'],
            [_('New Project'), _('Initialize a new project.'), 'header-icons/new-button.svg'],
            [_('Load project from file'), _('You can also load projects from the file system.'), 'header-icons/open-button.svg'],
            [_('Save project'), _('Save your project to a file.'), 'header-icons/save-button.svg'],
            [_('Load samples from server'), _('This button opens a viewer for loading example projects.'), 'header-icons/planet-button.svg'],
            [_('Save sheet music'), _('Save your project to as a Lilypond file.'), 'header-icons/lilypond-button.svg'],
            // [_('Copy'), _('To copy a stack to the clipboard, right-click on the stack.') + ' ' + _('You can also use Alt+C to copy a stack of blocks.') + ' ' + _('The Paste Button will highlight.'), 'header-icons/paste-button.svg'],
            // [_('Paste'), _('The paste button is enabled when there are blocks copied onto the clipboard.') + ' ' + _('You can also use Alt+V to paste a stack of blocks. '), 'header-icons/paste-disabled-button.svg'],
            [_('Cartesian') + '/' + _('Polar'), _('Show or hide a coordinate grid.'), 'header-icons/Cartesian-polar-button.svg'],
            // [_('Polar'), _('Show or hide a polar-coordinate grid.'), 'header-icons/polar-button.svg'],
            [_('Settings'), _('Open a panel for configuring Music Blocks.'), 'header-icons/utility-button.svg'],
            [_('Switch mode'), _('Switch between beginner and advance modes.'), 'header-icons/advanced-button.svg'],
            [_('Enable scrolling'), _('You can scroll the blocks on the canvas.'), 'header-icons/scroll-unlock-button.svg'],
            [_('Decrease block size'), _('Decrease the size of the blocks.'), 'header-icons/smaller-button.svg'],
            [_('Increase block size'), _('Increase the size of the blocks.'), 'header-icons/bigger-button.svg'],
            [_('Display statistics'), _('Display statistics about your Music project.'), 'header-icons/stats-button.svg'],
            [_('Delete plugin'), _('Delete a selected plugin.'), 'header-icons/plugins-delete-button.svg'],
            [_('Select language'), _('Select your language preference.'), 'header-icons/language-button.svg'],
            [_('Restore'), _('Restore blocks from the trash.'), 'header-icons/restore-trash-button.svg'],
            [_('Keyboard shortcuts'), _('You can type "d" to create a "do" block, "r" to create a "re" block, etc.'), 'header-icons/type-icon.svg'],
            [_('Guide'), _('A detailed guide to Music Blocks is available.'), 'images/logo.svg', 'https://sugarlabs.github.io/musicblocks/guide', _('Music Blocks Guide')],
            [_('About'), _('Music Blocks is an open source collection of tools for exploring musical concepts. A full list of contributors can be found in the Music Blocks GitHub repository. Music Blocks is licensed under the AGPL. The current version is:') + ' ' + VERSION, 'images/logo.svg', 'https://github.com/sugarlabs/musicblocks', _('Music Blocks GitHub repository')],
            [_('Congratulations.'), _('You have finished the tour. Please enjoy Music Blocks!'), 'images/logo.svg']
        ];
    }

    BLOCKHELP = {
        // Rhythm palette
        'newnote': [_('The Note block is a container for one or more Pitch blocks.') + ' ' + _('The Note block specifies the duration (note value) of its contents.'), 'documentation', 'note-value-block.svg'],
        'playdrum': [_('You can use multiple Drum blocks within a Note block.'), 'documentation', 'drum-block.svg'],
        'rest2': [_('A rest of the specified note value duration can be constructed using a Silence block.'), 'documentation', 'silence-block.svg'],
        'mynotevalue': [_('The Note value block is the value of the duration of the note currently being played.'), 'documentation', 'on-every-beat-do-block.svg'],
        // Meter palette
        'meter': [_('The beat of the music is determined by the Meter block (by default, 4 1/4 notes per measure).'), 'documentation', 'meter-block.svg'],
        'setmasterbpm2': [_('The Master beats per minute block sets the number of 1/4 notes per minute for every voice.'), 'documentation', 'master-beats-per-minute-block.svg'],
        'setbpm3': [_('The Beats per minute block sets the number of 1/4 notes per minute.'), 'documentation', 'bpm.svg'],
        'everybeatdo': [_('The On-every-beat block let you specify actions to take on every beat.'), 'documentation', 'on-every-beat-do-block.svg'],
        'beatvalue': [_('The Beat count block is the number of the current beat,') + ' ' + _('e.g., 1, 2, 3, or 4.') + ' ' + _('In the figure, it is used to take an action on the first beat of each measure.'), 'documentation', 'on-every-beat-do.svg'],
        'elapsednotes2': [_('The Notes played block is the number of notes that have been played.') + ' ' + _('(By default, it counts quarter notes.)'), 'documentation', 'on-every-beat-do.svg'],
        // Pitch palette
        'pitch': [_('The Pitch block specifies the pitch name and octave of a note that together determine the frequency of the note.'), 'documentation', 'note-value-block.svg'],
        'solfege': [_('Pitch can be specified in terms of do re mi fa sol la ti.'), 'documentation', 'note-value-block.svg'],
        'notename': [_('Pitch can be specified in terms of C D E F G A B.'), 'documentation', 'note-name-block.svg'],
        'steppitch': [_('The Scaler Step block (in combination with a Number block) will play the next pitch in a scale,') + ' ' + _('e.g., if the last note played was sol, Scalar Step 1 will play la.'), 'documentation', 'set-key-block.svg'],
        'hertz': [_('The Hertz block (in combination with a Number block) will play a sound at the specified frequency.'), 'documentation', 'hertz-block.svg'],
        'setscalartransposition': [_('The Scalar transposition block will shift the pitches contained inside Note blocks up (or down) the scale.') + ' ' + _('In the example shown above, sol is shifted up to la.'), 'documentation', 'scalar-transpose-block.svg'],
        'pitchinhertz': [_('The Pitch in Hertz block is the value in Hertz of the pitch of the note currently being played.'), 'documentation', 'status-block.svg'],
        'mypitch': [_('The Pitch number block is the value of the pitch of the note currently being played.'), 'documentation', 'on-every-beat-do-block.svg'],
        // Intervals palette
        'setkey2': [_('The Set key block is used to set the key and mode,') + ' ' + _('e.g., C Major'), 'documentation', 'set-key-block.svg'],
        'modelength': [_('The Mode length block is the number of notes in the current scale.') + ' ' + _('Most Western scales have 7 notes.'), 'documentation', 'set-key-block.svg'],
        'interval': [_('The Scalar interval block calculates a relative interval based on the current mode, skipping all notes outside of the mode.') + ' ' + _('In the figure, we add la to sol.'), 'documentation', 'scalar-interval-block.svg'],
        'settemperament': [_('The Set temperament block is used to choose the tuning system used by Music Blocks.'), 'documentation', 'set-temperament-block.svg'],
        // Tone palette
        'settimbre': [_('The Set timbre block selects a voice for the synthesizer,') + ' ' + _('e.g., guitar, piano, violin, or cello.'), 'documentation', 'settimbre.svg'],
        'newstaccato': [_('The Staccato block shortens the length of the actual note while maintaining the specified rhythmic value of the notes.'), 'documentation', 'staccato.svg'],
        'newslur': [_('The Slur block lengthens the sustain of notes while maintaining the specified rhythmic value of the notes.'), 'documentation', 'slur-block.svg'],
        'vibrato': [_('The Vibrato block adds a rapid, slight variation in pitch.'), 'documentation', 'vibrato-block.svg'],
        'neighbor2': [_('The Neighbor block rapidly switches between neighboring pitches.'), 'documentation', 'neighbor-block.svg'],
        // Volume palette
        'crescendo': [_('The Crescendo block will increase the volume of the contained notes by a specified amount for every note played.') + ' ' + _('For example, if you have 7 notes in sequence contained in a Crescendo block with a value of 5, the final note will be at 35% more than the starting volume.'), 'documentation', 'crescendo-block.svg'],
        'decrescendo': [_('The Decrescendo block will decrease the volume of the contained notes by a specified amount for every note played.') + ' ' + _('For example, if you have 7 notes in sequence contained in a Decrescendo block with a value of 5, the final note will be at 35% less than the starting volume.'), 'documentation', 'decrescendo-block.svg'],
        'setsynthvolume': [_('The Set synth volume block will change the volume of a particular synth,') + ' ' + _('e.g., guitar, violin, snare drum, etc.') + ' ' + _('The default volume is 50; the range is 0 (silence) to 100 (full volume).'), 'documentation', 'start-block.svg'],
        'setnotevolume': [_('The Set master volume block sets the volume for all synthesizers.'), 'documentation', 'setmastervolume.svg'],
        // Drum palette
        // 'playdrum' is described on the Rhythm palette.
        'setdrum': [_('The Set drum block will select a drum sound to replace the pitch of any contained notes.') + ' ' + _('In the example above, a kick drum sound will be played instead of sol.'), 'documentation', 'rhythm-ruler-block.svg'],
        // Widgets palette
        'status': [_('The Status block opens a tool for inspecting the status of Music Blocks as it is running.'), 'documentation', 'status-block.svg'],
        'matrix': [_('The Pitch-time Matrix block opens a tool to create musical phrases.'), 'documentation', 'pitch-time-matrix-block.svg'],
        'rhythmruler2': [_('The Rhythm Maker block opens a tool to create drum machines.'), 'documentation', 'rhythm-ruler-block.svg'],
        'pitchslider': [_('The Pitch-slider block opens a tool to generate arbitray pitches.'), 'documentation', 'pitch-slider-block.svg'],
        'rhythm2': [_('The Rhythm block is used to generate rhythm patterns.'), 'documentation', 'rhythm-ruler-block.svg'],
        'stuplet': [_('Tuplets are a collection of notes that get scaled to a specific duration.') + ' ' + _('Using tuplets makes it easy to create groups of notes that are not based on a power of 2.'), 'documentation', 'pitch-time-matrix-block.svg'],
        'musickeyboard': [_('The Music keyboard block opens a piano keyboard that can be used to create notes.'), 'documentation', 'music-keyboard-block.svg'],
        'tempo': [_('The Tempo block opens a metronome to visualize the beat.'), 'documentation', 'tempo-block.svg'],
        'modewidget': [_('The Custom mode block opens a tool to explore musical mode (the spacing of the notes in a scale).'), 'documentation', 'custom-mode-block.svg'],
        // Flow palette
        'repeat': [_('The Repeat block will repeat the contained blocks.') + ' ' + _('In this example the note will be played 4 times.'), 'documentation', 'repeat-block.svg'],
        'forever': [_('The Forever block will repeat the contained blocks forever.') + ' ' + _('In this example, a simple drum machine, a kick drum will play 1/4 notes forever.'), 'documentation', 'forever-block.svg'],
        'if':  [_('Conditionals lets your program take different actions depending on the condition.') + ' ' + _('In this example, if the mouse button is pressed, a snare drum will play.') + ' ' + _('Otherwise (else) a kick drum will play.'), 'documentation', 'conditional-block.svg'],
        'ifthenelse': [_('Conditionals lets your program take different actions depending on the condition.') + ' ' + _('In this example, if the mouse button is pressed, a snare drum will play.') + ' ' + _('Otherwise (else) a kick drum will play.'), 'documentation', 'conditional-block.svg'],
        'backward': [_('The Backward block runs code in reverse order (Musical retrograde).'), 'documentation', 'box-1-block.svg'],
        // Action palette
        'action': [_('The Action block is used to group together blocks so that they can be used more than once.') + ' ' + _('It is often used for storing a phrase of music that is repeated.'), 'documentation', 'action-block.svg'],
        'start': [_('Each Start block is a separate voice.') + ' ' + _('All of the Start blocks run at the same time when the Play button is pressed.'), 'documentation', 'repeat-block.svg'],
        'listen': [_('The Listen block is used to listen for an event such as a mouse click.') + ' ' + _('When the event happens, an action is taken.'), 'documentation', 'broadcast-block.svg'],
        'dispatch': [_('The Dispatch block is used to trigger an event.'), 'documentation', 'broadcast.svg'],
        'do': [_('The Do block is used to initiate an action.') + ' ' + _('In the example, it is used with the One of block to choose a random phase.'), 'documentation', 'do-block.svg'],
        // Boxes palette
        'storebox1': [_('The Store in Box 1 block is used to store a value in Box 1.'), 'documentation', 'box-1-block.svg'],
        'box1': [_('The Box 1 block returns the value stored in Box 1.'), 'documentation', 'box-1-block.svg'],
        'storebox2': [_('The Store in Box 2 block is used to store a value in Box 2.'), 'documentation', 'box-2-block.svg'],
        'box2': [_('The Box 2 block returns the value stored in Box 2.'), 'documentation', 'box-2-block.svg'],
        'increment': [_('The Add-to block is used to add to the value stored in a box.') + ' ' + _('It can also be used with other blocks, such as Color, Pen-size.') + ' ' + _('etc.'), 'documentation', 'box-2-block.svg'],
        'incrementOne': [_('The Add-1-to block adds one to the value stored in a box.'), 'documentation', 'box-1-block.svg'],
        // Number palette
        'number': [_('The Number block holds a number.'), 'documentation', 'repeat-block.svg'],
        'random': [_('The Random block returns a random number.'), 'documentation', 'random-block.svg'],
        'oneOf': [_('The One-of block returns one of two choices.'), 'documentation', 'one-of-block.svg'],
        'plus': [_('The Plus block is used to add.'), 'documentation', 'scalar-transpose-block.svg'],
        'minus': [_('The Minus block is used to subtract.'), 'documentation', ''],
        'multiply': [_('The Multiply block is used to multiply.'), 'documentation', 'scalar-transpose-block.svg'],
        'divide': [_('The Divide block is used to divide.'), 'documentation', 'note-value-block.svg'],
        // Boolean palette
        'greater': [_('The Greater-than block returns True if the top number is greater than the bottom number.'), 'documentation', 'box-2-block.svg'],
        'less': [_('The Less-than block returns True if the top number is less than the bottom number.'), 'documentation', 'box-2-block.svg'],
        'equal': [_('The Equal block returns True if the two numbers are equal.'), 'documentation', 'box-1-block.svg'],
        // Mouse palette
        'forward': [_('The Forward block moves the mouse forward.'), 'documentation', 'forward-block.svg'],
        'back': [_('The Back block moves the mouse backward.'), 'documentation', 'forward-block.svg'],
        'left': [_('The Left block turns the mouse to the left.'), 'documentation', 'forward-block.svg'],
        'right': [_('The Right block turns the mouse to the right.'), 'documentation', 'forward-block.svg'],
        'arc': [_('The Arc block moves the mouse in a arc.'), 'documentation', 'arc-block.svg'],
        'setxy': [_('The Set XY block moves the mouse to a specific position on the screen.'), 'documentation', 'mouse-button-block.svg'],
        'scrollxy': [_('The Scroll XY block moves the canvas.'), 'documentation', 'on-every-beat-do-block.svg'],
        'x': [_('The X block returns the horizontal position of the mouse.'), 'documentation', 'x-block.svg'],
        'y': [_('The Y block returns the vertical position of the mouse.'), 'documentation', 'x-block.svg'],
        'heading': [_('The Heading block returns the orientation of the mouse.'), 'documentation', 'status.svg'],
        // Pen palette
        'setpensize': [_('The Set-pen-size block changes the size of the pen.'), 'documentation', 'set-pen-size-block.svg'],
        'penup': [_('The Pen-up block raises the pen so that it does not draw.'), 'documentation', 'mouse-button-block.svg'],
        'pendown': [_('The Pen-down block lowers the pen so that it draws.'), 'documentation', 'mouse-button-block.svg'],
        'color': [_('The Color block returns the current pen color.'), 'documentation', 'set-color-block.svg'],
        'setcolor': [_('The Set-color block changes the pen color.'), 'documentation', 'set-color-block.svg'],
        // Media palette
        'print': [_('The Print block displays text at the top of the screen.'), 'documentation', 'print-block.svg'],
        'text': [_('The Text block holds a text string.'), 'documentation', 'show-block.svg'],
        'media': [_('The Media block is used to import an image.'), 'documentation', 'avatar-block.svg'],
        'show': [_('The Show block is used to display text or images on the canvas.'), 'documentation', 'show-block.svg'],
        'turtleshell': [_('The Shell block is used to change the appearance of the mouse.'), 'documentation', 'turtleshell.svg'],
        'speak': [_('The Speak block outputs to the text-to-speech synthesizer'), 'documentation', 'speak-block.svg'],
        'height': [_('The Height block returns the height of the canvas.'), 'documentation', 'width-block.svg'],
        'width': [_('The Width block returns the width of the canvas.'), 'documentation', 'width-block.svg'],
        'toppos': [_('The Top block returns the position of the top of the canvas.') + ' ' + _('In this example, the mouse moves upward until it reaches the top edge of the canvas; then it reappears at the bottom of the canvas.'), 'documentation', 'bottom-top-block.svg'],
        'bottompos': [_('The Bottom block returns the position of the bottom of the canvas.') + ' ' + _('In this example, the mouse moves upward until it reaches the top edge of the canvas; then it reappears at the bottom of the canvas.'), 'documentation', 'bottom-top-block.svg'],
        'leftpos': [_('The Left block returns the position of the left of the canvas.') + ' ' + _('In this example, the mouse moves right until it reaches the right edge of the canvas; then it reappears at the left of the canvas.'), 'documentation', 'left-right-block.svg'],
        'rightpos': [_('The Right block returns the position of the right of the canvas.') + ' ' + _('In this example, the mouse moves right until it reaches the right edge of the canvas; then it reappears at the left of the canvas.'), 'documentation', 'left-right-block.svg'],
        // Sensors palette
        'mousebutton': [_('The Mouse-button block returns True if the mouse button is pressed.'), 'documentation', 'mouse-button-block.svg'],
        'mousex': [_('The Cursor X block returns the horizontal position of the mouse.'), 'documentation', 'mouse-button-block.svg'],
        'mousey': [_('The Cursor Y block returns the vertical position of the mouse.'), 'documentation', 'mouse-button-block.svg'],
        'click': [_('The Click block returns True if a mouse has been clicked.'), 'documentation', 'click-block.svg'],
        // Mice palette
        'setturtlename2': [_('The Set-name block is used to name a mouse.'), 'documentation', 'click-block.svg'],
        'turtlename': [_('The Mouse-name block returns the name of a mouse.'), 'documentation', 'click-block.svg'],
        // Advanced blocks
        // Rhythm palette
        'rhythmic2dot': [_('The Dot block extends the duration of a note by 50%.') + ' ' + _('E.g., a dotted quarter note will play for 3/8 (1/4 + 1/8) of a beat.'), 'documentation', 'status.svg'],
        'tie': [_('The Tie block works on pairs of notes, combining them into one note.'), 'documentation', 'status.svg'],
        'multiplybeatfactor': [_('The Multiply note value block changes the duration of notes by changing their note values.'), 'documentation', 'status.svg'],
        'skipnotes': [_('The Skip notes block will cause notes to be skipped.'), 'documentation', 'skip-notes.svg'],
        'newswing2': [_('The Swing block works on pairs of notes (specified by note value), adding some duration (specified by swing value) to the first note and taking the same amount from the second note.'), 'documentation', 'status.svg'],
        'osctime': [_('The Milliseconds block is similar to a Note block except that it uses time (in MS) to specify the note duration.'), 'documentation', 'status.svg'],
        // Meter palette
        'pickup': [_('The Pickup block is used to accommodate any notes that come in before the beat.'), 'documentation', 'status.svg'],
        'bpm': [_('The Beats per minute block changes the beats per minute of any contained notes.'), 'documentation', 'status.svg'],
        'onbeatdo': [_('The On-strong-beat block let you specify actions to take on specified beats.'), 'documentation', 'onstrongbeatdo.svg'],
        'offbeatdo': [_('The On-weak-beat block let you specify actions to take on weak (off) beats.'), 'documentation', 'onweakbeatdo.svg'],
        'no-clock': [_('The No clock block decouples the notes from the master clock.'), 'documentation', 'no-clock.svg'],
        'elapsednotes': [_('The Whole notes played block returns the total number of whole notes played.'), 'documentation', 'status.svg'],
        'notecounter': [_('The Note counter block can be used to count the number of contained notes.'), 'documentation', 'status.svg'],
        'measurevalue': [_('The Measure count block returns the current measure.'), 'documentation', 'status.svg'],
	'bpmfactor': [_('The Beats per minute block returns the current beats per minute.'), 'documentation', 'status.svg'],
        // 'beatfactor': [_(''), 'documentation', 'status.svg'],
        // pitch palette
        'accidental': [_('The Accidental block is used to create sharps and flats'), 'documentation', 'accidental.svg'],
        'settransposition': [_('The Semi-tone transposition block will shift the pitches contained inside Note blocks up (or down) by half steps.') + ' ' + _('In the example shown above, sol is shifted up to sol#.'), 'documentation', 'settransposition.svg'],
        'register': [_('The Register block provides an easy way to modify the register (octave) of the notes that follow it.'), 'documentation', 'status.svg'],
        'invert1': [_('The Invert block rotates any contained notes around a target note.'), 'documentation', 'status.svg'],
        'deltapitch': [_('The Change in pitch block is the difference (in half steps) between the current pitch being played and the previous pitch played.'), 'documentation', 'deltapitch.svg'],
        '// customNote': ['', 'documentation', 'status.svg'],
	//.TRANS: 'ni', 'dha', 'pa', 'ma', 'ga', 're', 'sa' are East Indian note names.
        'eastindiansolfege': [_('Pitch can be specified in terms of ni dha pa ma ga re sa.'), 'documentation', 'status.svg'],
        'accidentalname': [_('The Accidental selector block is used to choose between double-sharp, sharp, natural, flat, and double-flat.'), 'documentation', 'accidental.svg'],
        'number2octave': [_('The Number to octave block will convert a pitch number to an octave.'), 'documentation', 'status.svg'],
        'setpitchnumberoffset': [_('The Set pitch number offset block is used to set the offset for mapping pitch numbers to pitch and octave.'), 'documentation', 'status.svg'],
        'consonantstepsizeup': [_('The Scalar step up block returns the number of semi-tones up to the next note in the current key and mode.'), 'documentation', 'status.svg'],
        'consonantstepsizedown': [_('The Scalar step down block returns the number of semi-tones down to the previous note in the current key and mode.'), 'documentation', 'status.svg'],
        // Intervals palette
        'movable': [_('When Moveable do is false, the solfege note names are always tied to specific pitches,') + ' ' + _('e.g. "do" is always "C-natural"); when Moveable do is true, the solfege note names are assigned to scale degrees ("do" is always the first degree of the major scale).'), 'documentation', 'movable.svg'],
        'definemode': [_('The Define mode block allows you define a custom mode by specifiying pitch numbers.'), 'documentation', 'status.svg'],
        'semitoneinterval': [_('The Semi-tone interval block calculates a relative interval based on half steps.') + ' ' + _('In the figure, we add sol# to sol.'), 'documentation', 'semitoneinterval.svg'],
        'measureintervalscalar': [_('The Scalar interval block measures the distance between two notes in the current key and mode.'), 'documentation', 'status.svg'],
        'measureintervalsemitones': [_('The Scalar interval block measures the distance between two notes in semi-tones.'), 'documentation', 'status.svg'],
        'doubly': [_('The Doubly block will double the size of an interval.'), 'documentation', 'status.svg'],
        // Tone palette
        'voicename': [_('The Set timbre block selects a voice for the synthesizer,') + ' ' + _('e.g., guitar, piano, violin, or cello.'), 'documentation', 'settimbre.svg'],
        'chorus': [_('The Chorus block adds a chorus effect.'), 'documentation', 'chorus.svg'],
        'phaser': [_('The Phaser block adds a sweeping sound.'), 'documentation', 'phaser.svg'],
        'dis': [_('The Distortion block adds distortion to the pitch.'), 'documentation', 'distortion.svg'],
        'tremolo': [_('The Tremolo block adds a wavering effect.'), 'documentation', 'tremolo.svg'],
        'harmonic2': [_('The Harmonic block will add harmonics to the contained notes.'), 'documentation', 'harmonic.svg'],
        'harmonic': [_('The Weighted partials block is used to specify the partials associated with a timbre.'), 'documentation', 'status.svg'],
        'partial': [_('The Partial block is used to specify a weight for a specific partical harmonic.'), 'documentation', 'status.svg'],
        'fmsynth': [_('The FM synth block is a frequency modulator used to define a timbre.'), 'documentation', 'status.svg'],
        'amsynth': [_('The AM synth block is an amplitude modulator used to define a timbre.'), 'documentation', 'status.svg'],
        'duosynth': [_('The Duo synth block is a duo-frequency modulator used to define a timbre.'), 'documentation', 'status.svg'],
        // Volume palette
        'articulation': [_('The Set relative volume block changes the volume of the contained notes.'), 'documentation', 'status.svg'],
        'notevolumefactor': [_('The Note volume block returns the current volume of the current synthesizer.'), 'documentation', 'status.svg'],
        // Drum palette
        'playnoise': [_('The Play noise block will generate white, pink, or brown noise.'), 'documentation', 'status.svg'],
        'drumname': [_('The Drum name block is used to select a drum.'), 'documentation', 'status.svg'],
        'noisename': [_('The Noise name block is used to select a noise synthesizer.'), 'documentation', 'status.svg'],
        // Widgets palette
        'pitchstaircase': [_('The Pitch staircase tool to is used to generate pitches from a given ratio.'), 'documentation', 'status.svg'],
        'pitchdrummatrix': [_('The Pitch drum matrix is used to map pitches to drum sounds.'), 'documentation', 'status.svg'],
        'temperament': [_('The Temperament tool is used to define custom tuning.'), 'documentation', 'status.svg'],
        'temperamentname': [_('The Temperament name block is used to select a tuning method.'), 'documentation', 'status.svg'],
        'tuplet4': [_('The Tuplet block is used to generate a group of notes played in a condensed amount of time.'), 'documentation', 'status.svg'],
        // Flow palette
        'while': [_('The While block will repeat while the condition is true.'), 'documentation', 'status.svg'],
        'until': [_('The Until block will repeat until the condition is true.'), 'documentation', 'status.svg'],
        'waitfor': [_('The Waitfor block will wait until the condition is true.'), 'documentation', 'status.svg'],
        'break': [_('The Stop block will stop a loop') + ': ' + _('Forever, Repeat, While, or Until.'), 'documentation', 'status.svg'],
        'switch': [_('The Switch block will run the code in the matchin Case.'), 'documentation', 'status.svg'],
        'case': [_('The Case block is used inside of a Switch to define matches.'), 'documentation', 'status.svg'],
        'default': [_('The Default block is used inside of a Switch to define a default action.'), 'documentation', 'status.svg'],
        'duplicatenotes': [_('The Duplicate block will run each block multiple times.') + ' ' + _('The output of the example is: Sol, Sol, Sol, Sol, Re, Re, Re, Re, Sol, Sol, Sol, Sol.'), 'documentation', 'status.svg'],
        // Action palette
        'arg': [_('The Arg block contains the value of an argument passed to an action.'), 'documentation', 'status.svg'],
        'namedarg': [_('The Arg block contains the value of an argument passed to an action.'), 'documentation', 'status.svg'],
        'calcArg': [_('The Calculate block returns a value calculated by an action.'), 'documentation', 'status.svg'],
        'doArg': [_('The Do block is used to initiate an action.'), 'documentation', 'status.svg'],
        'namedCalcArg': [_('The Calculate block returns a value calculated by an action.'), 'documentation', 'status.svg'],
        'nameddoArg': [_('The Do block is used to initiate an action.'), 'documentation', 'status.svg'],
        'namedcalc': [_('The Calculate block returns a value calculated by an action.'), 'documentation', 'status.svg'],
        'calc': [_('The Calculate block returns a value calculated by an action.'), 'documentation', 'status.svg'],
        'returnToUrl': [_('The Return to URL block will return a value to a webpage.'), 'documentation', 'status.svg'],
        'return': [_('The Return block will return a value from an action.'), 'documentation', 'status.svg'],
        // Boxes palette
        'storein': [_('The Store in block will store a value in a box.'), 'documentation', 'status.svg'],
        'storein2': [_('The Store in block will store a value in a box.'), 'documentation', 'status.svg'],
        'namedbox': [_('The Box block returns the value stored in a box.'), 'documentation', 'status.svg'],
        // Number palette
        'abs': [_('The Abs block returns the absolute value.'), 'documentation', 'status.svg'],
        'sqrt': [_('The Sqrt block returns the square root.'), 'documentation', 'status.svg'],
        'power': [_('The Power block calculates a power function.'), 'documentation', 'status.svg'],
        'mod': [_('The Mod block returns the remainder from a division.'), 'documentation', 'status.svg'],
        'int': [_('The Int block returns an integer.'), 'documentation', 'status.svg'],
        // Boolean palette
        'not': [_('The Not block is the logical not operator.'), 'documentation', 'status.svg'],
        'and': [_('The And block is the logical and operator.'), 'documentation', 'status.svg'],
        'or': [_('The Or block is the logical or operator.'), 'documentation', 'status.svg'],
        'boolean': [_('The Boolean block is used to specify true or false.'), 'documentation', 'status.svg'],
        // Heap palette
        'push': [_('The Push block adds a value to the top of the heap.'), 'documentation', 'status.svg'],
        'pop': [_('The Pop block removes the value at the top of the heap.'), 'documentation', 'status.svg'],
        'setHeapEntry': [_('The Setheapentry block sets a value in he heap at the specified location.'), 'documentation', 'status.svg'],
        'indexHeap': [_('The Indexheap block returns a value in the heap at a specified location.'), 'documentation', 'status.svg'],
        'reverseHeap': [_('The Reverseheap block reverses the order of the heap.'), 'documentation', 'status.svg'],
        'loadHeap': [_('The Loadheap block loads the heap from a file.'), 'documentation', 'status.svg'],
        'saveHeap': [_('The Saveheap block saves the heap to a file.'), 'documentation', 'status.svg'],
        'emptyHeap': [_('The Emptyheap block empties the heap.'), 'documentation', 'status.svg'],
        'heapEmpty': [_('The Heap empty? block returns true if the heap is emptry.'), 'documentation', 'status.svg'],
        'heapLength': [_('The Heap length block returns the length of the heap.'), 'documentation', 'status.svg'],
        'showHeap': [_('The Show heap block displays the contents of the heap at the top of the screen.'), 'documentation', 'status.svg'],
        'saveHeapToApp': [_('The Save heap to app block saves the heap to a web page.'), 'documentation', 'status.svg'],
        'loadHeapFromApp': [_('The Load heap from app block loads the heap from a web page.'), 'documentation', 'status.svg'],
        // Extras palette
        'comment': [_('The Comment block prints a comment at the top of the screen when the program is running in slow mode.'), 'documentation', 'status.svg'],
        'wait': [_('The Wait block pauses the program for a specified number of seconds.'), 'documentation', 'wait-block.svg'],
        'vspace': [_('The Space block is used to add space between blocks.'), 'documentation', 'status.svg'],
        'hspace': [_('The Space block is used to add space between blocks.'), 'documentation', 'status.svg'],
        'openproject': [_('The Open project block is used to open a project from a web page.'), 'documentation', 'status.svg'],
        'hideblocks': [_('The Hide blocks block hides the blocks.'), 'documentation', 'status.svg'],
        'showblocks': [_('The Show blocks block shows the blocks.'), 'documentation', 'status.svg'],
        'nobackground': [_('The No background block eliminates the background from the saved SVG output.'), 'documentation', 'status.svg'],
        'makeblock': [_('The Make block block creates a new block.'), 'documentation', 'status.svg'],
        'dockblock': [_('The Dock block block connections two blocks.'), 'documentation', 'status.svg'],
        'runblock': [_('The Run block block runs a block.'), 'documentation', 'status.svg'],
        'moveblock': [_('The Move block block moves a block.'), 'documentation', 'status.svg'],
        'deleteblock': [_('The Delete block block removes a block.'), 'documentation', 'status.svg'],
        'openpalette': [_('The Open palette block opens a palette.'), 'documentation', 'status.svg'],
        // Graphics palette
        'setheading': [_('The Set heading block sets the heading of the mouse.'), 'documentation', 'status.svg'],
        'bezier': [_('The Bezier block draws a Bezier curve.'), 'documentation', 'status.svg'],
        'controlpoint1': [_('The Control-point 1 block sets the first control point for the Bezier curve.'), 'documentation', 'status.svg'],
        'controlpoint1': [_('The Control-point 2 block sets the second control point for the Bezier curve.'), 'documentation', 'status.svg'],
        // Pen palette
        'sethue': [_('The Set hue block changes the color of the pen.'), 'documentation', 'status.svg'],
        'setgrey': [_('The Set grey block changes the vividness of the pen color.'), 'documentation', 'status.svg'],
        'settranslucency': [_('The Set translucency block changes the opacity of the pen.'), 'documentation', 'status.svg'],
        'fill': [_('The Fill block fills in a shape with a color.'), 'documentation', 'status.svg'],
        'hollowline': [_('The Hollow line block creates a line with a hollow center.'), 'documentation', 'status.svg'],
        'fillscreen': [_('The Background block sets the background color.'), 'documentation', 'status.svg'],
	'grey': [_('The Grey block returns the current pen grey value.'), 'documentation', 'status.svg'],
	'shade': [_('The Shade block returns the current pen shade value.'), 'documentation', 'status.svg'],
	'pensize': [_('The Pen size block returns the current pen size value.'), 'documentation', 'status.svg'],
        'setfont': [_('The Set font block sets the font used by the Show block.'), 'documentation', 'status.svg'],
        // Media
        'tofrequency': [_('The To frequency block converts a pitch name and octave to Hertz.'), 'documentation', 'status.svg'],
        'stopvideocam': [_('The Stop media block stops audio or video playback.'), 'documentation', 'status.svg'],
        'loadFile': [_('The Open file block opens a file for use with the Show block.'), 'documentation', 'status.svg'],
        'video': [_('The Video block selects video for use with the Show block.'), 'documentation', 'status.svg'],
        'camera': [_('The Camera block connects a webcam to the Show block.'), 'documentation', 'status.svg'],
        // 'playback': [_('The Playback block'), 'documentation', 'status.svg'],
        // 'stopplayback': [_('The Stopplayback block'), 'documentation', 'status.svg'],
        // Sensors palette
        'keyboard': [_('The Keyboard block returns computer keyboard input.'), 'documentation', 'status.svg'],
        'toascii': [_('The To ASCII block converts numbers to letters.'), 'documentation', 'status.svg'],
        'time': [_('The Time block returns the number of seconds that the program has been running.'), 'documentation', 'status.svg'],
        'getcolorpixel': [_('The Get pixel block returns the color of the pixel under the mouse.'), 'documentation', 'status.svg'],
        'getred': [_('The Get red block returns the red component of the pixel under the mouse.'), 'documentation', 'status.svg'],
	'getgreen': [_('The Get green block returns the green component of the pixel under the mouse.'), 'documentation', 'status.svg'],
	'getblue': [_('The Get blue block returns the blue component of the pixel under the mouse.'), 'documentation', 'status.svg'],
        'loudness': [_('The Loudness block returns the volume detected by the microphone.'), 'documentation', 'status.svg'],
        // Ensemble palette
        'newturtle': [_('The New mouse block will create a new mouse.'), 'documentation', 'status.svg'],
        'foundturtle': [_('The Found mouse block will return true if the specified mouse can be found.'), 'documentation', 'status.svg'],
        'turtlesync': [_('The Mouse sync block aligns the beat count between mice.'), 'documentation', 'status.svg'],
        'turtlenote2': [_('The Mouse note block returns the current note value being played by the specified mouse.'), 'documentation', 'status.svg'],
        'turtlepitch': [_('The Mouse pitch block returns the current pitch number being played by the specified mouse.'), 'documentation', 'status.svg'],
        'turtleelapsenotes': [_('The Mouse elapse notes block returns the number of notes played by the specified mouse.'), 'documentation', 'status.svg'],
        'xturtle': [_('The X mouse block returns the X position of the specified mouse.'), 'documentation', 'status.svg'],
        'yturtle': [_('The Y mouse block returns the Y position of the specified mouse.'), 'documentation', 'status.svg'],
        'setturtle': [_('The Set mouse block sends a stack of blocks to be run by the specified mouse.'), 'documentation', 'status.svg'],
        'turtleheading': [_('The Mouse heading block returns the heading of the specified mouse.'), 'documentation', 'status.svg'],
        'turtlecolor': [_('The Mouse color block returns the pen color of the specified mouse.'), 'documentation', 'status.svg'],
        'startturtle': [_('The Start mouse block starts the specified mouse.'), 'documentation', 'status.svg'],
        'stopturtle': [_('The Stop mouse block stops the specified mouse.'), 'documentation', 'status.svg'],
    }
};
