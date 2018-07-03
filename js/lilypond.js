// Copyright (c) 2014-2018 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

var MIDIOutput, guitarOutputHead, guitarOutputEnd;

// This header is prepended to the Lilypond output.
var LILYPONDHEADER = '\\version "2.18.2"\n\n% ****************************************************************\n% \n% WHAT IS THIS? -- This is a LilyPond file generated from Music\n% Blocks software (Read about it at www.musicblocks.net).\n% \n% DOWNLOAD LILYPOND -- In order to create notation with this file,\n% you will need to download and install LilyPond software onto your\n% computer (http://lilypond.org/download.html). Frescobaldi\n% software is also handy for editing LilyPond files\n% (http://frescobaldi.org/download).\n% \n% LILYPOND INSTRUCTIONS -- For instructions on how to further\n% manipulate musical notation using LilyPond software, please\n% read the Introduction (http://lilypond.org/text-input.html) and\n% the Manual\n% (http://lilypond.org/doc/v2.18/Documentation/learning/index.html).\n% \n% GLOSSARY -- A glossary with helpful examples may be found here\n% (http://www.lilypond.org/doc/v2.19/Documentation/music-glossary/).\n% \n% MUTOPIA -- You may also benefit from studying scores from the\n% Mutopia Project website, which has freely sharable music notation\n% generated with LilyPond (http://www.mutopiaproject.org/).\n% \n% LILYBIN -- You can explore your Lilypond output in a web browser at\n% (http://lilybin.com/).\n% \n% COMMENTS -- Some of the code below is commented out. You can\n% enable it by deleting the % that precedes the text or, in the\n% case of a commented section, deleting the %{ and %} that surrounds\n% the section.\n% \n% ****************************************************************\n\n% Please add your own name, the title of your musical creation,\n% and the intended copyright below.\n% The copyright is great for sharing (and re-sharing)!\n% Read more about it here (http://creativecommons.org/licenses/by-sa/4.0/).\n% Of course, you can use any copyright you like -- you made it!\n\\header {\n   dedication = \\markup {\n      \\abs-fontsize #8 \\sans "Made with LilyPond and Music Blocks" \\with-url #"http://musicblocks.sugarlabs.org/" {\n         \\abs-fontsize #8 \\sans "(http://musicblocks.sugarlabs.org/)"\n      }\n   }\n   title = "My Music Blocks Creation"\n%   subtitle = "Subtitle"\n%   instrument = "Instrument"\n   composer = "Mr. Mouse"\n%   arranger = "Arranger"\n   copyright = "Mr. Mouse (c) 2017 -- CC-BY-SA"\n   tagline = "Made from Music Blocks v.2.2"\n   footer = \\markup {\n      \\with-url #"http://musicblocks.sugarlabs.org/" "Made with Music Blocks Software v.2.2" Engraved on \\simple #(strftime "%Y-%m-%d" (localtime (current-time)))\n   }\n   currentYear = \\markup {\n      \\simple #(strftime "%Y" (localtime (current-time)))\n   }\n   copyTag =  " free to distribute, modify, and perform"\n   copyType = \\markup {\n      \\with-url #"http://creativecommons.org/licenses/by-sa/3.0/" "Creative Commons Attribution ShareAlike 3.0 (Unported) License "\n   }\n   copyright = \\markup {\n      \\override #\'(baseline-skip . 0 ) \\right-column {\n         \\sans \\bold \\with-url #"http://musicblocks.net" {\n            \\abs-fontsize #9  "Music " \\concat {\n               \\abs-fontsize #12 \\with-color #white \\char ##x01C0 \\abs-fontsize #9 "Blocks "\n            }\n         }\n      }\n      \\override #\'(baseline-skip . 0 ) \\center-column {\n         \\abs-fontsize #11.9 \\with-color #grey \\bold {\n            \\char ##x01C0 \\char ##x01C0\n         }\n      }\n      \\override #\'(baseline-skip . 0 ) \\column {\n         \\abs-fontsize #8 \\sans \\concat {\n            " Typeset using " \\with-url #"http://www.lilypond.org" "LilyPond software " \\char ##x00A9 " " \\currentYear " by " \\composer " " \\char ##x2014 " " \\footer\n         }\n         \\concat {\n            \\concat {\n               \\abs-fontsize #8 \\sans {\n                  " " \\copyType \\char ##x2014 \\copyTag\n               }\n            }\n            \\abs-fontsize #13 \\with-color #white \\char ##x01C0\n         }\n      }\n   }\n   tagline = ##f\n}\n\n% To change the meter make adjustments in the following section.\n% You must also delete the % before \\meter everywhere it appears below.\nmeter = {\n%   \\time 3/4\n%   \\key c \\minor\n   \\numericTimeSignature\n%   \\partial 4 \n%   \\tempo "Andante" 4=90\n}\n\n';

//.TRANS Animal names used in Lilypond output
const RODENTS = [_('mouse'), _('brown rat'), _('mole'), _('chipmunk'), _('red squirrel'), _('guinea pig'), _('capybara'), _('coypu'), _('black rat'), _('grey squirrel'), _('flying squirrel'), _('bat')];
const RODENTSEN = ['mouse', 'brown rat', 'mole', 'chipmunk', 'red squirrel', 'guinea pig', 'capybara', 'coypu', 'black rat', 'grey squirrel', 'flying squirrel', 'bat'];
const CLEFS = ['treble', 'bass', 'bass_8', 'percussion'];


getLilypondHeader = function () {
    return LILYPONDHEADER;
};


processLilypondNotes = function (lilypond, logo, turtle) {
    // obj = [instructions] or
    // obj = [note, duration, dotCount, tupletValue, roundDown, insideChord, staccato]

    logo.notationNotes[turtle] = '\\meter\n';

    function __toLilynote (note) {
        // Lilypond notes use is for sharp, es for flat,
        // , and ' for shifts in octave.
        // Also, notes must be lowercase.
        // And the octave bounday is at C, not A.

        // Convert frequencies here.
        if (typeof(note) === 'number') {
            var pitchObj = frequencyToPitch(note);
            note = pitchObj[0] + pitchObj[1];
        }

        return note.replace(/♮/g, '!').replace(/♯/g, 'is').replace(/♭/g, 'es').replace(/10/g, "''''''''").replace(/1/g, ',, ').replace(/2/g, ', ').replace(/3/g, '').replace(/4/g, "'").replace(/5/g, "''").replace(/6/g, "'''").replace(/7/g, "''''").replace(/8/g, "''''''").replace(/9/g, "'''''''").toLowerCase();
    };

    var noteCounter = 0;
    var queueSlur = false;
    var articulation = false;
    var targetDuration = 0;
    var tupletDuration = 0;
    var multivoice = false;
    for (var i = 0; i < logo.notationStaging[turtle].length; i++) {
        var obj = logo.notationStaging[turtle][i];
        if (typeof(obj) === 'string') {
            switch (obj) {
            case 'swing':
                logo.notationNotes[turtle] += '\\tempo swing\n';
                break;
            case 'tempo':
                logo.notationNotes[turtle] += '\\tempo ' + logo.notationStaging[turtle][i + 2] + ' = ' + logo.notationStaging[turtle][i + 1] + '\n';
                i += 2;
                break;
            case 'markup':
                logo.notationNotes[turtle] += '^\\markup { \\abs-fontsize #6 { ' + logo.notationStaging[turtle][i + 1] + ' } } ';
                i += 1;
                break;
            case 'markdown':
                logo.notationNotes[turtle] += '_\\markup { ' + logo.notationStaging[turtle][i + 1] + ' } ';
                i += 1;
                break;
            case 'break':
                if (i > 0) {
                    logo.notationNotes[turtle] += '\n';
                }
                noteCounter = 0;
                break;
            case 'begin articulation':
                articulation = true;
                break;
            case 'end articulation':
                articulation = false;
                break;
            case 'begin crescendo':
                logo.notationNotes[turtle] += '\\< ';
                break;
            case 'begin decrescendo':
                logo.notationNotes[turtle] += '\\> ';
                break;
            case 'end crescendo':
                logo.notationNotes[turtle] += '\\! ';
                break;
            case 'end decrescendo':
                logo.notationNotes[turtle] += '\\! ';
                break;
            case 'begin slur':
                // The ( is added after the first note.
                queueSlur = true;
                break;
            case 'end slur':
                logo.notationNotes[turtle] += ') ';
                break;
            case 'begin harmonics':
                logo.notationNotes[turtle] += '\\harmonicsOn ';
                break;
            case 'end harmonics':
                logo.notationNotes[turtle] += '\\harmonicsOff ';
                break;
            case 'tie':
                logo.notationNotes[turtle] += '~';
                break;
            case 'key':
                var keySignature = logo.notationStaging[turtle][i + 1] + ' ' + logo.notationStaging[turtle][i + 2];
                var key = logo.notationStaging[turtle][i + 1].toLowerCase().replace(FLAT, 'es').replace(SHARP, 'is').replace(NATURAL, '').replace(DOUBLESHARP, 'isis').replace(DOUBLEFLAT, 'eses');
                var mode = logo.notationStaging[turtle][i + 2];
                // Lilypond knows about common modes.
                if (['major', 'minor', 'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'].indexOf(mode) !== -1) {

                    logo.notationNotes[turtle] += ' \\key ' + key + ' \\' + mode + '\n';
                } else {
                    var obj = getScaleAndHalfSteps(keySignature)
                    // Check to see if it is possible to construct the mode.
                    // freygish = #`((0 . ,NATURAL) (1 . ,FLAT) (2 . ,NATURAL)
		    // (3 . ,NATURAL) (4 . ,NATURAL) (5 . ,FLAT) (6 . ,FLAT))
                    var modeDef = '\n' + mode.replace(/ /g, '_') + " = #`(";
                    var prevNote = '';
                    var nn = -1;
                    for (var ii = 0; ii < obj[1].length; ii++) {
                        if (obj[1][ii] !== '') {
                            // Are we repeating notes, e.g., Db and D?
                            if (obj[0][ii].substr(0, 1) === prevNote) {
				modeDef = '';
				break;
                            } else {
				prevNote = obj[0][ii].substr(0, 1);
			    }

                            var n = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(obj[0][ii].substr(0, 1));

                            // Did we skip any notes?
                            if (n > nn) {
				if ((n - nn) > 1) {
                                    for (var j = nn + 1; j < n; j++) {
					modeDef += '(' + j + ' . ,NATURAL) ';
				    }
				}

				nn = n;

				if (obj[0][ii].length === 1) {
				    modeDef += '(' + n + ' . ,NATURAL) ';
				} else {
				    if (obj[0][ii].substr(1, 1) === FLAT) {
					modeDef += '(' + n + ' . ,FLAT) ';
				    } else {
					modeDef += '(' + n + ' . ,SHARP) ';
				    }
				}
			    }
			}
                    }

		    if (modeDef !== '') {
			if (n < 6) {
                            for (var j = n + 1; j < 7; j++) {
				modeDef += '(' + j + ' . ,NATURAL) ';
			    }
			}

                        modeDef += ')\n';
                        console.log(modeDef);
			lilypond.freygish += modeDef;
			logo.notationNotes[turtle] += ' \\key ' + key + ' \\' + mode.replace(/ /g,'_') + '\n';
		    } else {
			logo.errorMsg(_('Lilypond ignoring mode') + ' ' + mode);
		    }
                }
                i += 2;
                break;
            case 'meter':
                logo.notationNotes[turtle] += ' \\time ' + logo.notationStaging[turtle][i + 1] + '/' + logo.notationStaging[turtle][i + 2] + '\n';
                i += 2;
                break;
            case 'pickup':
                logo.notationNotes[turtle] += ' \\partial ' + logo.notationStaging[turtle][i + 1] + '\n';
                i += 1;
                break;
            case 'voice one':
                if (multivoice) {
                    logo.notationNotes[turtle] += '}\n\\new Voice { \\voiceOne ';
                } else {
                    logo.notationNotes[turtle] += '<< { \\voiceOne ';
                    multivoice = true;
                }
                break;
            case 'voice two':
                if (multivoice) {
                    logo.notationNotes[turtle] += '}\n\\new Voice { \\voiceTwo ';
                } else {
                    logo.notationNotes[turtle] += '<< { \\voiceTwo ';
                    multivoice = true;
                }
                break;
            case 'voice three':
                if (multivoice) {
                    logo.notationNotes[turtle] += '}\n\\new Voice { \\voiceThree ';
                } else {
                    logo.notationNotes[turtle] += '<< { \\voiceThree ';
                    multivoice = true;
                }
                break;
            case 'voice four':
                if (multivoice) {
                    logo.notationNotes[turtle] += '}\n\\new Voice { \\voiceFour ';
                } else {
                    logo.notationNotes[turtle] += '<< { \\voiceFour ';
                    multivoice = true;
                }
                break;
            case 'one voice':
                logo.notationNotes[turtle] += '}\n>> \\oneVoice\n';
                multivoice = false;
                break;
            default:
                logo.notationNotes[turtle] += obj;
                break;
            }
        } else {
            if (noteCounter % 8 === 0 && noteCounter > 0) {
                logo.notationNotes[turtle] += '\n';
            }

            noteCounter += 1;

            if (typeof(obj[NOTATIONNOTE]) === 'string') {
                var note = __toLilynote(obj[NOTATIONNOTE]);
            } else {
                var notes = obj[NOTATIONNOTE];
                var note = __toLilynote(notes[0]);
            }

            var incompleteTuplet = 0;  // An incomplete tuplet
            var tupletFactor = null;
            var totalTupletDuration = 0;
            var commonTupletNote = null;
            var tupletNoteCounter = 0;

            // If it is a tuplet, look ahead to see if it is complete.
            // While you are at it, add up the durations.
            if (obj[NOTATIONTUPLETVALUE] != null) {
                targetDuration = (1 / logo.notationStaging[turtle][i][NOTATIONDURATION]);
                tupletDuration = (1 / logo.notationStaging[turtle][i][NOTATIONROUNDDOWN]);
                totalTupletDuration = 1 / (obj[NOTATIONTUPLETVALUE][0] * obj[NOTATIONTUPLETVALUE][1]);

                if (commonTupletNote === null) {
                    commonTupletNote = obj[NOTATIONROUNDDOWN];
                    var tupletNoteCounter = 1;
                } else if (obj[NOTATIONROUNDDOWN] > commonTupletNote) {
                    var f = obj[NOTATIONROUNDDOWN] / commonTupletNote;
                    commonTupletNote = obj[NOTATIONROUNDDOWN];
                    tupletNoteCounter *= f;
                    tupletNoteCounter += 1;
                }

                if (tupletFactor === null) {
                    tupletFactor = obj[NOTATIONTUPLETVALUE][1];
                } else if (obj[NOTATIONTUPLETVALUE][1] < tupletFactor) {
                    tupletFactor = obj[NOTATIONTUPLETVALUE][1];
                }

                var j = 1;
                var k = 1;
                while (k < (obj[NOTATIONTUPLETVALUE][0] * obj[NOTATIONTUPLETVALUE][1])) {
                    if (i + j >= logo.notationStaging[turtle].length) {
                        incompleteTuplet = j;
                        break;
                    }

                    if (logo.notationStaging[turtle][i + j] === 'tie') {
                        console.log('saw a tie');
                        k++;  // Increment notes in tuplet.
                        j++;
                    } else if ([1, 0.5, 0.25, 0.125, 0.0625].indexOf(totalTupletDuration) !== -1) {
                        // Break up tuplet on POW2 values
                        incompleteTuplet = j;
                        break;
                    } else if (logo.notationStaging[turtle][i + j][NOTATIONTUPLETVALUE] === null) {
                        incompleteTuplet = j;
                        break;
                    } else if (logo.notationStaging[turtle][i + j][NOTATIONTUPLETVALUE][0] !== obj[NOTATIONTUPLETVALUE][0]) {
                        // Match if sharing same factor, e.g., 1/3, 1/6, 1/12
                        incompleteTuplet = j;
                        break;
                    } else {
                        if (logo.notationStaging[turtle][i + j][NOTATIONROUNDDOWN] > commonTupletNote) {
                            var f = logo.notationStaging[turtle][i + j][NOTATIONROUNDDOWN] / commonTupletNote;
                            commonTupletNote = logo.notationStaging[turtle][i + j][NOTATIONROUNDDOWN];
                            tupletNoteCounter *= f;
                            tupletNoteCounter += 1;
                        } else if (logo.notationStaging[turtle][i + j][NOTATIONROUNDDOWN] < commonTupletNote) {
                            var f = commonTupletNote / logo.notationStaging[turtle][i + j][NOTATIONROUNDDOWN];
                            tupletNoteCounter += f;
                        } else {
                            tupletNoteCounter += 1;
                        }

                        targetDuration += (1 / logo.notationStaging[turtle][i + j][NOTATIONDURATION]);
                        tupletDuration += (1 / logo.notationStaging[turtle][i + j][NOTATIONROUNDDOWN]);

                        totalTupletDuration += (1 / (logo.notationStaging[turtle][i + j][NOTATIONTUPLETVALUE][0] * logo.notationStaging[turtle][i + j][NOTATIONTUPLETVALUE][1]));
                        j++;  // Jump to next note.
                        k++;  // Increment notes in tuplet.
                    }
                }
            }

            function __processTuplet(logo, turtle, i, count) {
                var j = 0;
                var k = 0;

                while (k < count) {
                    var tupletDuration = 2 * logo.notationStaging[turtle][i + j][NOTATIONDURATION];

                    var notes = logo.notationStaging[turtle][i + j][NOTATIONNOTE];
                    if (typeof(notes) === 'object') {
                        if (notes.length > 1) {
                            logo.notationNotes[turtle] += '<';
                        }

                        for (ii = 0; ii < notes.length; ii++) {
                            logo.notationNotes[turtle] += __toLilynote(notes[ii]);
                            if (notes.length === 1 || ii < notes.length - 1) {
                                logo.notationNotes[turtle] += ' ';
                            }
                        }

                        if (obj[NOTATIONSTACCATO]) {
                            logo.notationNotes[turtle] += ' \\staccato ';
                        }

                        if (notes.length > 1) {
                            logo.notationNotes[turtle] += '>';
                        }

                        logo.notationNotes[turtle] += logo.notationStaging[turtle][i + j][NOTATIONROUNDDOWN];
                        j++;  // Jump to next note.
                        k++;  // Increment notes in tuplet.
                    } else if (logo.notationStaging[turtle][i + j] === 'tie') {
                        console.log('adding a tie');
                        logo.notationNotes[turtle] += '~';
                        j++;  // Jump to next note.
                        k++;  // Increment notes in tuplet.
                    } else {
                        console.log('ignoring ' + notes);
                        j++;  // Jump to next note.
                        k++;  // Increment notes in tuplet.
                    }
                }

                if (i + j - 1 < logo.notationStaging[turtle].length - 1) {
                    var nextObj = logo.notationStaging[turtle][i + j];
                    // Workaround to a Lilypond "feature": if a slur
                    // ends on a tuplet, the closing ) must be inside
                    // the closing } of the tuplet. Same for markup.
                    if (typeof(nextObj) === 'string' && nextObj === ')') {
                        logo.notationNotes[turtle] += ')} ';
                        i += 1;
                    } else if (typeof(nextObj) === 'string' && nextObj === 'markup') {
                        logo.notationNotes[turtle] += '^\\markup { \\abs-fontsize #6 { ' + logo.notationStaging[turtle][i + j + 1] + ' } } } ';
                        j += 2;
                    } else if (typeof(nextObj) === 'string' && nextObj === 'markdown') {
                        logo.notationNotes[turtle] += '_\\markup {' + logo.notationStaging[turtle][i + j + 1] + '} } ';
                        j += 2;
                    } else {
                        logo.notationNotes[turtle] += '} ';
                    }
                } else {
                    logo.notationNotes[turtle] += '} ';
                }

                return j;
            };

            if (obj[NOTATIONTUPLETVALUE] != null && (obj[NOTATIONTUPLETVALUE][0] * obj[NOTATIONTUPLETVALUE][1]) > 0) {
                // Lilypond tuplets look like this: \tuplet 3/2 { f8 g a }
                // multiplier = tupletDuration / targetDuration
                // e.g., (3/8) / (1/4) = (3/8) * 4 = 12/8 = 3/2

                if (incompleteTuplet === 0) {
                    var tupletFraction = toFraction(tupletDuration / targetDuration);
                    var a = tupletFraction[0] * targetDuration;
                    var b = tupletFraction[0] * tupletFraction[1];

                    if (Math.floor(a) !== a) {
                        var c = toFraction(a / 1);
                        a = c[0];
                        b = c[1];
                    }

                    logo.notationNotes[turtle] += '\\tuplet ' + a + '/' + b + ' { ';

                    i += __processTuplet(logo, turtle, i, obj[NOTATIONTUPLETVALUE][0] * obj[NOTATIONTUPLETVALUE][1]) - 1;
                } else {
                    // Incomplete tuplets look like this: \tuplet 3/2 { f4 a8 }
                    // for 1/6 1/12
                    // duration = 1/6 + 1/12 ==> 1/4
                    // 3 x 1/8 note in the time of a 1/4 note ==> 3/8 / 1/4 = 3/2

                    var f = (tupletNoteCounter / commonTupletNote) / totalTupletDuration;
                    var tupletFraction = toFraction(f);
                    var a = tupletFraction[0];
                    var b = tupletFraction[1];
                    if (Math.floor(a) !== a) {
                        var c = toFraction(a / 1);
                        a = c[0];
                        b = c[1];
                    }

                    logo.notationNotes[turtle] += '\\tuplet ' + a + '/' + b + ' { ';

                    i += __processTuplet(logo, turtle, i, incompleteTuplet) - 1;
                }

                targetDuration = 0;
                tupletDuration = 0;
            } else {
                if (typeof(notes) === 'object') {
                    if (notes.length > 1) {
                        logo.notationNotes[turtle] += '<';
                    }

                    for (ii = 0; ii < notes.length; ii++) {
                        logo.notationNotes[turtle] += __toLilynote(notes[ii]);
                        if (ii < notes.length - 1) {
                            logo.notationNotes[turtle] += ' ';
                        }
                    }

                    if (notes.length > 1) {
                        logo.notationNotes[turtle] += '>';
                    }

                    logo.notationNotes[turtle] += obj[NOTATIONDURATION];
                    for (var d = 0; d < obj[NOTATIONDOTCOUNT]; d++) {
                        logo.notationNotes[turtle] += '.';
                    }

                    if (articulation) {
                        logo.notationNotes[turtle] += '->';
                    }

                    logo.notationNotes[turtle] += ' ';
                }

                if (obj[NOTATIONSTACCATO]) {
                    logo.notationNotes[turtle] += '\\staccato';
                }

                targetDuration = 0;
                tupletDuration = 0;
            }

            logo.notationNotes[turtle] += ' ';

            if (queueSlur) {
                queueSlur = false;
                logo.notationNotes[turtle] += '(';
            }
        }
    }
};


saveLilypondOutput = function(logo) {
    const NUMBERNAMES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    var turtleCount = 0;
    var clef = [];
    var freygish = '';  // A place to store custom mode definitions

    for (var t in logo.notationStaging) {
        turtleCount += 1;
    }
  
    var startDrums = turtleCount;
    for (var t in logo.notationDrumStaging) {
        // Check to see if there are any notes in the drum staging.
        var foundNotes = false;
        for (var i = 0; i < logo.notationDrumStaging[t].length; i++) {
            var obj = logo.notationDrumStaging[t][i];
            if (typeof(obj) === 'object' && typeof(obj[0]) === 'object' && obj[0][0] !== 'R') {
                foundNotes = true;
            }
        }

        if (foundNotes) {
            logo.notationStaging[turtleCount.toString()] = logo.notationDrumStaging[t];
        } else {
            logo.notationStaging[turtleCount.toString()] = [];
        }
        turtleCount += 1;
    }

    console.log('saving as lilypond: ' + turtleCount);

    logo.notationOutput += '% You can change the MIDI instruments below to anything on this list:\n% (http://lilypond.org/doc/v2.18/documentation/notation/midi-instruments)\n\n';

    var c = 0;
    var occupiedShortNames = [];
    for (var t in logo.notationStaging) {
            console.log('value of t: ' + t);
        if (typeof(t) === 'string') {
            var tNumber = Number(t);
        } else {
            var tNumber = t;
        }

        if (logo.notationStaging[t].length > 0) {
            var octaveTotal = 0;
            var noteCount = 0;
            for (var i = 0; i < logo.notationStaging[t].length; i++) {
                var obj = logo.notationStaging[t][i];
                if (typeof(obj) === 'object') {
                    for (var ii = 0; ii < obj[0].length; ii++) {
                        if (obj[0][ii] === 'R') {
                            continue;
                        } else if (typeof(obj[0][ii]) === 'string') {
                            octaveTotal += Number(obj[0][ii].substr(-1));
                        } else {
                            var pitchObj = frequencyToPitch(obj[0][ii]);
                            octaveTotal += pitchObj[1];
                        }

                        noteCount += 1;
                    }
                }
            }

            if (tNumber > startDrums - 1) {
                clef.push('percussion');
            } else if (noteCount > 0) {
                console.log(octaveTotal + ' ' + noteCount + ' ' + Math.floor(0.5 + (octaveTotal / noteCount)));
                switch (Math.floor(0.5 + (octaveTotal / noteCount))) {
                case 0:
                case 1:
                case 2:
                    clef.push('bass_8');
                    break;
                case 3:
                    clef.push('bass');
                    break;
                default:
                    clef.push('treble');
                    break;
                }
            } else {
                clef.push('treble');
            }

            this.freygish = '';
            processLilypondNotes(this, logo, t);

            if (this.freygish !== '') {
		logo.notationOutput += this.freygish;
	    }

            if (tNumber > startDrums - 1) {
                instrumentName = _('drum') + NUMBERNAMES[tNumber - startDrums];
                instrumentName = instrumentName.replace(/ /g, '_').replace('.', '');
                logo.notationOutput += instrumentName + ' = {\n';
                logo.notationOutput += '\\drummode {\n';
                logo.notationOutput += logo.notationNotes[t];
                // Add bar to last turtle's output.
                if (c === turtleCount - 1) {
                    logo.notationOutput += ' \\bar "|."'
                }

                logo.notationOutput += '\n}\n';
                logo.notationOutput += '\n}\n\n';
            } else {
                if (t in logo.turtles.turtleList) {
                    var turtleNumber = tNumber;

                    var instrumentName = logo.turtles.turtleList[t].name;
                    if (instrumentName === _('start') || instrumentName === _('start drum')) {
                        instrumentName = RODENTS[tNumber % 12];
                    } else if (instrumentName === tNumber.toString()) {
                        instrumentName = RODENTS[tNumber % 12];
                    }
                }

                if (instrumentName === '') {
                    instrumentName = RODENTSEN[tNumber % 12];
                }

                instrumentName = instrumentName.replace(/ /g, '_').replace('.', '');

                logo.notationOutput += instrumentName + ' = {\n';
                logo.notationOutput += logo.notationNotes[t];

                // Add bar to last turtle's output.
                if (c === turtleCount - 1) {
                    logo.notationOutput += ' \\bar "|."'
                }

                logo.notationOutput += '\n}\n\n';

                var shortInstrumentName = '';
                var final = '';
                var firstPart = '';
                var secondPart = '';
                var part1 = '';
                var part2 = '';
                var done = 0;
                var n = instrumentName.indexOf('_');

                // We calculate a unique short name based on the
                // initial characters of the long name. If there is a
                // space in the name, we use the first letter of each
                // word. Otherwise we use the first two letters of the
                // name. If the name is not unique, we keep adding
                // letters.
                if (instrumentName.length === 1) {
                    shortInstrumentName = instrumentName;
                    occupiedShortNames[t] = shortInstrumentName;
                } else if (n === -1) {
                    // no space in instrument name
                    for (var p = 2; p < instrumentName.length; p++) {
                        if (p === 2) {
                            final = instrumentName.slice(0, 2);
                        } else {
                            final = final + instrumentName.charAt(p-1);
                        }

                        if (occupiedShortNames.indexOf(final) === -1) {
                            // not found in array so unique shortname
                            shortInstrumentName = final;
                            occupiedShortNames[t] = shortInstrumentName;
                            break;
                        }
                    }
                } else {
                    // at least 1 space in instrument name
                    firstPart = instrumentName.slice(0, n);
                    secondPart = instrumentName.slice(n+1, instrumentName.length);
                    part1 = firstPart.charAt(0);
                    part2 = secondPart.charAt(0);
                    final = part1 + part2;

                    if (occupiedShortNames.indexOf(final) === -1) {
                        // found unique shortname
                        shortInstrumentName = final;
                        occupiedShortNames[t] = shortInstrumentName;
                        done = 1;
                    } else if (done !== 1) {
                        final = '';
                        for (var q = 1; i < instrumentName.length; i++) {
                            part2 = part2 + secondPart.charAt(q);
                            final = part1 + part2;
                            if (occupiedShortNames.indexOf(final) === -1) {
                                // found unique shortname
                                shortInstrumentName = final;
                                occupiedShortNames[t] = shortInstrumentName;
                                break;
                            } else {
                                part1 = part1 + firstPart.charAt(q);
                                final = part1 + part2;
                                if (occupiedShortNames.indexOf(final) === -1) {
                                    // found unique shortname
                                    shortInstrumentName = final;
                                    occupiedShortNames[t] = shortInstrumentName;
                                    break;
                                }
                            }
                        }
                    }
                }

                console.log('instrumentName: ' + instrumentName);
                console.log('shortInstrumentName: ' + shortInstrumentName);
            }
            
            logo.notationOutput += instrumentName.replace(/ /g, '_').replace('.', '') + 'Voice = ';
            if (tNumber > startDrums - 1) {
                logo.notationOutput += '\\new DrumStaff \\with {\n';
            } else {
                logo.notationOutput += '\\new Staff \\with {\n';
            }
            logo.notationOutput += '   \\clef "' + last(clef) + '"\n';
            logo.notationOutput += '   instrumentName = "' + instrumentName + '"\n';
            if (tNumber > startDrums - 1) {
                logo.notationOutput += '   shortInstrumentName = "' + 'd' + '"\n';
                logo.notationOutput += '   midiInstrument = "snare drum"\n';
            } else {
                logo.notationOutput += '   shortInstrumentName = "' + shortInstrumentName + '"\n';
                logo.notationOutput += '   midiInstrument = "acoustic grand"\n';
            }
            // Automatic note splitting
            // logo.notationOutput += '\n   \\remove "Note_heads_engraver"\n   \\consists "Completion_heads_engraver"\n   \\remove "Rest_engraver"\n   \\consists "Completion_rest_engraver"\n'

            logo.notationOutput += '\n} { \\clef "' + last(clef) + '" \\' + instrumentName.replace(/ /g, '_').replace('.', '') + ' }\n\n';
        } else {
            clef.push('');
        }

        c += 1;
    }

    // Begin the SCORE section.
    logo.notationOutput += '\n\\score {\n';
    logo.notationOutput += '   <<\n';

    // Sort the staffs, treble on top, bass_8 on the bottom.
    for (var c = 0; c < CLEFS.length; c++) {
        var i = 0;
        for (var t in logo.notationNotes) {
            if (typeof(t) === 'string') {
                var tNumber = Number(t);
            } else {
                var tNumber = t;
            }

            if (clef[tNumber] === CLEFS[c]) {
                if (logo.notationStaging[t].length > 0) {
                    if (tNumber > startDrums - 1) {
                        var instrumentName = _('drum') + NUMBERNAMES[tNumber - startDrums];
                    } else {
                        if (t in logo.turtles.turtleList) {
                            var instrumentName = logo.turtles.turtleList[t].name;
                        } else if (tNumber in logo.turtles.turtleList) {
                            var instrumentName = logo.turtles.turtleList[tNumber].name;
                        } else {
                            var instrumentName = _('mouse');
                        }

                        if (instrumentName === _('start') || instrumentName === _('start drum')) {
                            instrumentName = RODENTS[tNumber % 12];
                        } else if (instrumentName === tNumber.toString()) {
                            instrumentName = RODENTS[tNumber % 12];
                        }
                    }

                    instrumentName = instrumentName.replace(/ /g, '_').replace('.', '');
                    logo.notationOutput += '      \\' + instrumentName + 'Voice\n';
                }
            }
        }
    }

    // Add GUITAR TAB in comments.
    logo.notationOutput += guitarOutputHead;
    for (var c = 0; c < CLEFS.length; c++) {
        var i = 0;
        for (var t in logo.notationNotes) {
            if (typeof(t) === 'string') {
                var tNumber = Number(t);
            } else {
                var tNumber = t;
            }

            if (clef[i] === CLEFS[c]) {
                if (logo.notationStaging[t].length > 0) {
                    if (tNumber > startDrums - 1) {
                        var instrumentName = _('drum') + NUMBERNAMES[tNumber - startDrums];
                    } else {
                        if (t in logo.turtles.turtleList) {
                            var instrumentName = logo.turtles.turtleList[t].name;
                        } else if (tNumber in logo.turtles.turtleList) {
                            var instrumentName = logo.turtles.turtleList[tNumber].name;
                        } else {
                            var instrumentName = _('mouse');
                        }

                        if (instrumentName === _('start') || instrumentName === _('start drum')) {
                            instrumentName = RODENTS[tNumber % 12]
                        } else if (instrumentName === tNumber.toString()) {
                            instrumentName = RODENTS[tNumber % 12];
                        }
                    }

                    instrumentName = instrumentName.replace(/ /g, '_').replace('.', '');
                    logo.notationOutput += '         \\context TabVoice = "'+ instrumentName + '" \\' + instrumentName.replace(/ /g, '_').replace('.', '') + '\n';
                }
            }
        }
    }

    // Close the SCORE sections.
    logo.notationOutput += guitarOutputEnd;
    logo.notationOutput += '\n   >>\n   \\layout {}\n\n';

    // Add MIDI OUTPUT in comments.
    logo.notationOutput += MIDIOutput;

    // ADD TURTLE BLOCKS CODE HERE
    logo.notationOutput += '% MUSIC BLOCKS CODE\n';
    logo.notationOutput += '% Below is the code for the Music Blocks project that generated this Lilypond file.\n%{\n\n';
    // prepareExport() returns json-encoded project data.
    var projectData = prepareExport();
    logo.notationOutput += projectData.replace(/]],/g, ']],\n');
    logo.notationOutput += '\n%}\n\n';
    return logo.notationOutput;
};
