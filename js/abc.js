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

// This header is prepended to the Abc output.
const ABCHEADER = 'X:1\nT:Music Blocks composition\nC:Mr. Mouse\nL:1/16\nM:C\n';


getABCHeader = function () {
    return ABCHEADER;
};


processAbcNotes = function (logo, turtle) {
    // obj = [instructions] or
    // obj = [[notes], duration, dotCount, tupletValue, roundDown, insideChord, staccato]

    logo.notationNotes[turtle] = '';

    function __convertDuration (duration) {
        var returnString = '';
        switch(duration) {
        case 64:
            returnString = '1/4';
            break;
        case 32:
            returnString = '1/2';
            break;
        case 16:
            returnString = '1';
            break;
        case 8:
            returnString = '2';
            break;
        case 4:
            returnString = '4';
            break;
        case 2:
            returnString = '8';
            break;
        case 1:
            returnString = '16';
            break;
        default:
            returnString = duration;
            break;
        }

        return returnString;
    };

    function __toABCnote (note) {
        // beams -- no space between notes
        // ties use ()
        // % comment

        // Abc notes use is for sharp, es for flat,
        // , and ' for shifts in octave.
        // Also, notes must be lowercase.
        // And the octave bounday is at C, not A.

        // Convert frequencies here.
        if (typeof(note) === 'number') {
            var pitchObj = frequencyToPitch(note);
            note = pitchObj[0] + pitchObj[1];
        }

        if (note.indexOf('♯') > -1) {
            note = '^' + note.replace('♯', '')
        }
        // check for double sharp
        if (note.indexOf('♯') > -1) {
            note = '^' + note.replace(/♯/g, '')
        }

        if (note.indexOf('♭') > -1) {
            note = '_' + note.replace('♭', '')
        }
        // check for double flat
        if (note.indexOf('♭') > -1) {
            note = '_' + note.replace(/♭/g, '')
        }

        if (note.indexOf('10') > -1) {
            return note.replace('10', "'''''").toLowerCase();
        }

        if (note.indexOf('9') > -1) {
            return note.replace('9', "''''").toLowerCase();
        }

        if (note.indexOf('8') > -1) {
            return note.replace('8', "'''").toLowerCase();
        }

        if (note.indexOf('7') > -1) {
            return note.replace('7', "''").toLowerCase();
        }

        if (note.indexOf('6') > -1) {
            return note.replace('6', "'").toLowerCase();
        }

        if (note.indexOf('5') > -1) {
            return note.replace('5', "").toLowerCase();
        }

        if (note.indexOf('4') > -1) {
            return note.replace('4', "").toUpperCase();
        }

        if (note.indexOf('3') > -1) {
            return note.replace('3', ",").toUpperCase();
        }

        if (note.indexOf('2') > -1) {
            return note.replace('2', ",,").toUpperCase();
        }

        if (note.indexOf('1') > -1) {
            return note.replace('1', ",,,").toUpperCase();
        }

        return note.toUpperCase();
    };

    var counter = 0;
    var queueSlur = false;
    var articulation = false;
    var targetDuration = 0;
    var tupletDuration = 0;
    for (var i = 0; i < logo.notationStaging[turtle].length; i++) {
        obj = logo.notationStaging[turtle][i];
        if (typeof(obj) === 'string') {
            switch (obj) {
            case 'break':
                if (i > 0) {
                    logo.notationNotes[turtle] += '\n';
                }
                counter = 0;
                break;
            case 'begin articulation':
                articulation = true;
                break;
            case 'end articulation':
                articulation = false;
                break;
            case 'begin crescendo':
                logo.notationNotes[turtle] += '!\<(!';
                break;
            case 'end crescendo':
                logo.notationNotes[turtle] +=  '!\<)!';
                break;
            case 'begin decrescendo':
                logo.notationNotes[turtle] += '!\>(!';
                break;
            case 'end decrescendo':
                logo.notationNotes[turtle] += '!\<(!';
                break;
            case 'begin slur':
                queueSlur = true;
                break;
            case 'end slur':
                logo.notationNotes[turtle] += '';
                break;
            case 'tie':
                logo.notationNotes[turtle] += '';
                break;
            case 'meter':
                logo.notationNotes[turtle] += 'M:' + logo.notationStaging[turtle][i + 1] + '/' + logo.notationStaging[turtle][i + 2] + '\n';
                i += 2;
                break;
            case 'pickup':
                // FIXME: how does one define pickup in ABC notation?
                i += 1;
                break;
            case 'voice one':
            case 'voice two':
            case 'voice three':
            case 'voice four':
            case 'one voice':
                // FIXME: how does one define multi-voice in ABC notation?
                break;
            default:
                logo.notationNotes[turtle] += obj;
                break;
            }
        } else {
            if (counter % 8 === 0 && counter > 0) {
                logo.notationNotes[turtle] += '\n';
            }
            counter += 1;

            if (typeof(obj[NOTATIONNOTE]) === 'string') {
                var note = __toABCnote(obj[NOTATIONNOTE]);
            } else {
                var notes = obj[NOTATIONNOTE];
                var note = __toABCnote(notes[0]);
            }

            var incompleteTuplet = 0;  // An incomplete tuplet

            // If it is a tuplet, look ahead to see if it is complete.
            // While you are at it, add up the durations.
            if (obj[NOTATIONTUPLETVALUE] != null) {
                targetDuration = (1 / logo.notationStaging[turtle][i][NOTATIONDURATION]);
                tupletDuration = (1 / logo.notationStaging[turtle][i][NOTATIONROUNDDOWN]);
                var j = 1;
                var k = 1;
                while (k < obj[NOTATIONTUPLETVALUE]) {
                    if (i + j >= logo.notationStaging[turtle].length) {
                        incompleteTuplet = j;
                        break;
                    }

                    if (logo.notationStaging[turtle][i + j][NOTATIONINSIDECHORD] > 0 && logo.notationStaging[turtle][i + j][NOTATIONINSIDECHORD] === logo.notationStaging[turtle][i + j - 1][NOTATIONINSIDECHORD]) {
                        // In a chord, so jump to next note.
                        j++;
                    } else if (logo.notationStaging[turtle][i + j][NOTATIONTUPLETVALUE] !== obj[NOTATIONTUPLETVALUE]) {
                        incompleteTuplet = j;
                        break;
                    } else {
                        targetDuration += (1 / logo.notationStaging[turtle][i + j][NOTATIONDURATION]);
                        tupletDuration += (1 / logo.notationStaging[turtle][i + j][NOTATIONROUNDDOWN]);
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

                    if (typeof(notes) === 'object') {
                        if (notes.length > 1) {
                            logo.notationNotes[turtle] += '[';
                        }

                        for (ii = 0; ii < notes.length; ii++) {
                            logo.notationNotes[turtle] += __toABCnote(notes[ii]);
                            logo.notationNotes[turtle] += ' ';
                        }

                        if (obj[NOTATIONSTACCATO]) {
                            logo.notationNotes[turtle] += '.';
                        }

                        if (notes.length > 1) {
                            logo.notationNotes[turtle] += ']';
                        }

                        logo.notationNotes[turtle] += logo.notationStaging[turtle][i + j][NOTATIONROUNDDOWN];
                        j++;  // Jump to next note.
                        k++;  // Increment notes in tuplet.
                    } else {
                        console.log('ignoring ' + notes);
                        j++;  // Jump to next note.
                        k++;  // Increment notes in tuplet.
                    }
                }

                // FIXME: Debug for ABC
                if (i + j - 1 < logo.notationStaging[turtle].length - 1) {
                    var nextObj = logo.notationStaging[turtle][i + j];
                    if (typeof(nextObj) === 'string' && nextObj === ')') {
                        // logo.notationNotes[turtle] += '';
                        i += 1;
                    } else {
                        logo.notationNotes[turtle] += ' ';
                    }
                } else {
                    logo.notationNotes[turtle] += ' ';
                }

                return j;
            };

            if (obj[NOTATIONTUPLETVALUE] > 0) {
                if (incompleteTuplet === 0) {
                    var tupletFraction = toFraction(tupletDuration / targetDuration);
                    logo.notationNotes[turtle] += '(' + tupletFraction[0] + ':' + tupletFraction[1] + '';

                    i += __processTuplet(logo, turtle, i, obj[NOTATIONTUPLETVALUE]) - 1;
                } else {
                    var tupletFraction = toFraction(obj[NOTATIONTUPLETVALUE] / incompleteTuplet);
                    logo.notationNotes[turtle] += '(' + tupletFraction[0] + ':' + tupletFraction[1] + '';

                    i += __processTuplet(logo, turtle, i, incompleteTuplet) - 1;
                }

                targetDuration = 0;
                tupletDuration = 0;
            } else {
                if (typeof(notes) === 'object') {
                    if (notes.length > 1) {
                        logo.notationNotes[turtle] += '[';
                    }

                    for (ii = 0; ii < notes.length; ii++) {
                        logo.notationNotes[turtle] += __toABCnote(notes[ii]);
                        logo.notationNotes[turtle] += ' ';
                    }

                    if (notes.length > 1) {
                        logo.notationNotes[turtle] += ']';
                    }

                    logo.notationNotes[turtle] += obj[NOTATIONDURATION];
                    for (var d = 0; d < obj[NOTATIONDOTCOUNT]; d++) {
                        logo.notationNotes[turtle] += '.';
                    }

                    logo.notationNotes[turtle] += ' ';
                }

                if (obj[NOTATIONSTACCATO]) {
                    logo.notationNotes[turtle] += '.';
                }

                if (obj[NOTATIONINSIDECHORD] > 0) {
                    // Is logo the first note in the chord?
                    if (i === 0 || logo.notationStaging[turtle][i - 1][NOTATIONINSIDECHORD] !== obj[NOTATIONINSIDECHORD]) {
                        // Open the chord.
                        logo.notationNotes[turtle] += '[';
                    }

                    logo.notationNotes[turtle] += (note);

                    // Is logo the last note in the chord?
                    if (i === logo.notationStaging[turtle].length - 1 || logo.notationStaging[turtle][i + 1][NOTATIONINSIDECHORD] !== obj[NOTATIONINSIDECHORD]) {
                        // Close the chord and add note duration.
                        logo.notationNotes[turtle] += ']';
                        logo.notationNotes[turtle] += __convertDuration(obj[NOTATIONDURATION]);
                        for (var d = 0; d < obj[NOTATIONDOTCOUNT]; d++) {
                            logo.notationNotes[turtle] += ' ';
                        }

                        if (articulation) {
                            logo.notationNotes[turtle] += ' ';
                        }

                        logo.notationNotes[turtle] += ' ';
                    }
                } else {
                    logo.notationNotes[turtle] += note;
                    logo.notationNotes[turtle] += __convertDuration(obj[NOTATIONDURATION]);
                    for (var d = 0; d < obj[NOTATIONDOTCOUNT]; d++) {
                        logo.notationNotes[turtle] += '.';
                    }

                    if (articulation) {
                        logo.notationNotes[turtle] += '';
                    }
                }

                if (obj[NOTATIONSTACCATO]) {
                    logo.notationNotes[turtle] += '.';
                }

                targetDuration = 0;
                tupletDuration = 0;
            }

            logo.notationNotes[turtle] += ' ';

            if (queueSlur) {
                queueSlur = false;
                logo.notationNotes[turtle] += '';
            }
        }
    }
};


saveAbcOutput = function(logo) {
    var turtleCount = 0;
    var clef = [];

    logo.notationOutput = getABCHeader();

    for (var t in logo.notationStaging) {
        turtleCount += 1;
    }
    console.log('saving as abc: ' + turtleCount);

    var c = 0;
    for (var t in logo.notationStaging) {
        logo.notationOutput += 'K:' + logo.keySignature[t].toUpperCase().replace(' ', '').replace('♭', 'b').replace('♯', '#') + '\n';
        processAbcNotes(logo, t);
        logo.notationOutput += logo.notationNotes[t];
        c += 1;
    }

    logo.notationOutput += '\n';
    return logo.notationOutput;
};
