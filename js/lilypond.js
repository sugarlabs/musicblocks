// Copyright (c) 2014-2016 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This header is prepended to the Lilypond output.
const LILYPONDHEADER = '\\version "2.18.2"\n\n% ****************************************************************\n% \n% WHAT IS THIS? -- This is a LilyPond file generated from Music\n% Blocks software (Read about it at www.musicblocks.net).\n% \n% DOWNLOAD LILYPOND -- In order to create notation with this file,\n% you will need to download and install LilyPond software onto your\n% computer (http://lilypond.org/download.html). Frescobaldi\n% software is also handy for editing LilyPond files\n% (http://frescobaldi.org/download).\n% \n% LILYPOND INSTRUCTIONS -- For instructions on how to further\n% manipulate musical notation using LilyPond software, please\n% read the Introduction (http://lilypond.org/text-input.html) and\n% the Manual\n% (http://lilypond.org/doc/v2.18/Documentation/learning/index.html).\n% \n% GLOSSARY -- A glossary with helpful examples may be found here\n% (http://www.lilypond.org/doc/v2.19/Documentation/music-glossary/).\n% \n% MUTOPIA -- You may also benefit from studying scores from the\n% Mutopia Project website, which has freely sharable music notation\n% generated with LilyPond (http://www.mutopiaproject.org/).\n% \n% LILYBIN -- You can explore your Lilypond output in a web browser at\n% (http://lilybin.com/).\n% \n% COMMENTS -- Some of the code below is commented out. You can\n% enable it by deleting the % that precedes the text or, in the\n% case of a commented section, deleting the %{ and %} that surrounds\n% the section.\n% \n% ****************************************************************\n\n% Please add your own name, the title of your musical creation,\n% and the intended copyright below.\n% The copyright is great for sharing (and re-sharing)!\n% Read more about it here (http://creativecommons.org/licenses/by-sa/4.0/).\n% Of course, you can use any copyright you like -- you made it!\n\\header {\n   dedication = \\markup {\n      \\abs-fontsize #8 \\sans "Made with LilyPond and Music Blocks" \\with-url #"http://walterbender.github.io/musicblocks/" {\n         \\abs-fontsize #8 \\sans "(http://walterbender.github.io/musicblocks/)"\n      }\n   }\n   title = "My Music Blocks Creation"\n%   subtitle = "Subtitle"\n%   instrument = "Instrument"\n   composer = "Mr. Mouse"\n%   arranger = "Arranger"\n   copyright = "Mr. Mouse (c) 2015 -- CC-BY-SA"\n   tagline = "Made from Music Blocks v.0.9"\n   footer = \\markup {\n      \\with-url #"http://walterbender.github.io/musicblocks/" "Made with Music Blocks Software v.0.9." Engraved on \\simple #(strftime "%Y-%m-%d" (localtime (current-time)))\n   }\n   currentYear = \\markup {\n      \\simple #(strftime "%Y" (localtime (current-time)))\n   }\n   copyTag =  " free to distribute, modify, and perform"\n   copyType = \\markup {\n      \\with-url #"http://creativecommons.org/licenses/by-sa/3.0/" "Creative Commons Attribution ShareAlike 3.0 (Unported) License "\n   }\n   copyright = \\markup {\n      \\override #\'(baseline-skip . 0 ) \\right-column {\n         \\sans \\bold \\with-url #"http://musicblocks.net" {\n            \\abs-fontsize #9  "Music " \\concat {\n               \\abs-fontsize #12 \\with-color #white \\char ##x01C0 \\abs-fontsize #9 "Blocks "\n            }\n         }\n      }\n      \\override #\'(baseline-skip . 0 ) \\center-column {\n         \\abs-fontsize #11.9 \\with-color #grey \\bold {\n            \\char ##x01C0 \\char ##x01C0\n         }\n      }\n      \\override #\'(baseline-skip . 0 ) \\column {\n         \\abs-fontsize #8 \\sans \\concat {\n            " Typeset using " \\with-url #"http://www.lilypond.org" "LilyPond software " \\char ##x00A9 " " \\currentYear " by " \\composer " " \\char ##x2014 " " \\footer\n         }\n         \\concat {\n            \\concat {\n               \\abs-fontsize #8 \\sans {\n                  " " \\copyType \\char ##x2014 \\copyTag\n               }\n            }\n            \\abs-fontsize #13 \\with-color #white \\char ##x01C0\n         }\n      }\n   }\n   tagline = ##f\n}\n\n% To change the meter make adjustments in the following section.\n% You must also delete the % before \\meter everywhere it appears below.\nmeter = {\n   \\time 3/4\n   \\key c \\minor\n   \\numericTimeSignature\n   \\partial 4 \n   \\tempo "Andante" 4=90\n}\n\n';

//.TRANS Animal names used in Lilypond output
const RODENTS = [_('mouse'), _('brown rat'), _('mole'), _('chipmunk'), _('red squirrel'), _('guinea pig'), _('capybara'), _('coypu'), _('black rat'), _('grey squirrel'), _('flying squirrel'), _('bat')];
const RODENTSEN = ['mouse', 'brown rat', 'mole', 'chipmunk', 'red squirrel', 'guinea pig', 'capybara', 'coypu', 'black rat', 'grey squirrel', 'flying squirrel', 'bat'];
//.TRANS Abbreviations for names used in Lilypind output, e.g., m for mouse
const RODENTSSHORT = [_('m'), _('br'), _('ml'), _('ch'), _('rs'), _('gp'), _('cb'), _('cp'), _('bk'), _('gs'), _('fs'), _('bt')];
const RODENTSSHORTEN = ['m', 'br', 'ml', 'ch', 'rs', 'gp', 'cb', 'cp', 'bk', 'gs', 'fs', 'bt'];
const LYNOTE = 0;
const LYDURATION = 1;
const LYDOTCOUNT = 2;
const LYTUPLETVALUE = 3;
const LYROUNDDOWN = 4;
const LYINSIDECHORD = 5;
const LYSTACCATO = 6;
const CLEFS = ['treble', 'bass', 'bass_8', 'percussion'];


getLilypondHeader = function () {
    return LILYPONDHEADER;
}


updateLilypondNotation = function (logo, note, duration, turtle, insideChord) {
    var obj = durationToNoteValue(duration);
    if (!(turtle in logo.lilypondStaging)) {
        logo.lilypondStaging[turtle] = [];
    }

    if (logo.turtles.turtleList[turtle].drum) {
        note = "c'";
    }

    logo.lilypondStaging[turtle].push([note, obj[0], obj[1], obj[2], obj[3], insideChord, logo.staccato[turtle].length > 0 && last(logo.staccato[turtle]) > 0]);
};


processLilypondNotes = function (logo, turtle) {
    // TODO: process all the notes together rather than one at a
    // time so that you can generate tuplets.
    
    // obj = [instructions] or
    // obj = [note, duration, dotCount, tupletValue, roundDown, insideChord, staccato, tie]
    
    logo.lilypondNotes[turtle] = '';
    
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
	
        return note.replace(/♯/g, 'is').replace(/♭/g, 'es').replace(/10/g, "''''''''").replace(/1/g, ',,').replace(/2/g, ',').replace(/3/g, '').replace(/4/g, "'").replace(/5/g, "''").replace(/6/g, "'''").replace(/7/g, "''''").replace(/8/g, "''''''").replace(/9/g, "'''''''").toLowerCase();
    };
    
    var counter = 0;
    var queueSlur = false;
    var articulation = false;
    var targetDuration = 0;
    var tupletDuration = 0;
    for (var i = 0; i < logo.lilypondStaging[turtle].length; i++) {
        obj = logo.lilypondStaging[turtle][i];
        if (typeof(obj) === 'string') {
            if (obj === 'break') {
                if (i > 0) {
                    logo.lilypondNotes[turtle] += '\n';
                }
                counter = 0;
            } else {
                if (obj === '(') {
                    // The ( is added after the first note.
                    queueSlur = true;
                } else if (obj === 'begin articulation') {
                    articulation = true;
                } else if (obj === 'end articulation') {
                    articulation = false;
                } else {
                    logo.lilypondNotes[turtle] += obj;
                }
            }
        } else {
            if (counter % 8 === 0 && counter > 0) {
                logo.lilypondNotes[turtle] += '\n';
            }
            counter += 1;
	    
            var note = __toLilynote(obj[LYNOTE]);
            var incompleteTuplet = 0;  // An incomplete tuplet
	    
            // If it is a tuplet, look ahead to see if it is complete.
            // While you are at it, add up the durations.
            if (obj[LYTUPLETVALUE] != null) {
                targetDuration = (1 / logo.lilypondStaging[turtle][i][LYDURATION]);
                tupletDuration = (1 / logo.lilypondStaging[turtle][i][LYROUNDDOWN]);
                var j = 1;
                var k = 1;
                while (k < obj[LYTUPLETVALUE]) {
                    if (i + j >= logo.lilypondStaging[turtle].length) {
                        incompleteTuplet = j;
                        break;
                    }
		    
                    if (logo.lilypondStaging[turtle][i + j][LYINSIDECHORD] > 0 && logo.lilypondStaging[turtle][i + j][LYINSIDECHORD] === logo.lilypondStaging[turtle][i + j - 1][LYINSIDECHORD]) {
                        // In a chord, so jump to next note.
                        j++;
                    } else if (logo.lilypondStaging[turtle][i + j][LYTUPLETVALUE] !== obj[LYTUPLETVALUE]) {
                        incompleteTuplet = j;
                        break;
                    } else {
                        targetDuration += (1 / logo.lilypondStaging[turtle][i + j][LYDURATION]);
                        tupletDuration += (1 / logo.lilypondStaging[turtle][i + j][LYROUNDDOWN]);
                        j++;  // Jump to next note.
                        k++;  // Increment notes in tuplet.
                    }
                }
            }
	    
            function __processTuplet(logo, turtle, i, count) {
                var j = 0;
                var k = 0;
		
                while (k < count) {
                    var tupletDuration = 2 * logo.lilypondStaging[turtle][i + j][LYDURATION];
                    // Are we in a chord?
                    if (logo.lilypondStaging[turtle][i + j][LYINSIDECHORD] > 0) {
                        // Is logo the first note in the chord?
                        if ((i === 0 && j === 0) || logo.lilypondStaging[turtle][i + j - 1][LYINSIDECHORD] !== logo.lilypondStaging[turtle][i + j][LYINSIDECHORD]) {
                            logo.lilypondNotes[turtle] += '<';
                        }
			
                        logo.lilypondNotes[turtle] += __toLilynote(logo.lilypondStaging[turtle][i + j][LYNOTE]);
                        if (obj[LYSTACCATO]) {
                            logo.lilypondNotes[turtle] += '\\staccato';
                        }
			
                        logo.lilypondNotes[turtle] += ' ';
			
                        // Is logo the last note in the chord?
                        if (i + j === logo.lilypondStaging[turtle].length - 1 || logo.lilypondStaging[turtle][i + j + 1][LYINSIDECHORD] !== logo.lilypondStaging[turtle][i + j][LYINSIDECHORD]) {
                            logo.lilypondNotes[turtle] += '>' + logo.lilypondStaging[turtle][i + j + 1][LYROUNDDOWN] + ' ';
                            k++;  // Increment notes in tuplet.
                        }
                        j++;
                    } else {
                        logo.lilypondNotes[turtle] += __toLilynote(logo.lilypondStaging[turtle][i + j][LYNOTE]) + logo.lilypondStaging[turtle][i + j][LYROUNDDOWN];
                        if (obj[LYSTACCATO]) {
                            logo.lilypondNotes[turtle] += '\\staccato';
                        }
			
                        logo.lilypondNotes[turtle] += ' ';
                        j++;  // Jump to next note.
                        k++;  // Increment notes in tuplet.
                    }
                }
		
                // Workaround to a Lilypond "feature": if a slur
                // ends on a tuplet, the closing ) must be inside
                // the closing } of the tuplet.
                if (i + j - 1 < logo.lilypondStaging[turtle].length - 1) {
                    var nextObj = logo.lilypondStaging[turtle][i + j];
                    if (typeof(nextObj) === 'string' && nextObj === ')') {
                        logo.lilypondNotes[turtle] += ')} ';
                        i += 1;
                    } else {
                        logo.lilypondNotes[turtle] += '} ';
                    }
                } else {
                    logo.lilypondNotes[turtle] += '} ';
                }
		
                return j;
            };
	    
            if (obj[LYTUPLETVALUE] > 0) {
                // lilypond tuplets look like logo: \tuplet 3/2 { f8 g a }
                // multiplier = tupletDuration / targetDuration
                // e.g., (3/8) / (1/4) = (3/8) * 4 = 12/8 = 3/2
                // There may be chords embedded.
		
                if (incompleteTuplet === 0) {
                    var tupletFraction = toFraction(tupletDuration / targetDuration);
                    logo.lilypondNotes[turtle] += '\\tuplet ' + tupletFraction[0] + '/' + tupletFraction[1] + ' { ';
		    
                    i += __processTuplet(logo, turtle, i, obj[LYTUPLETVALUE]) - 1;
                } else {
                    var tupletFraction = toFraction(obj[LYTUPLETVALUE] / incompleteTuplet);
                    logo.lilypondNotes[turtle] += '\\tuplet ' + tupletFraction[0] + '/' + tupletFraction[1] + ' { ';
		    
                    i += __processTuplet(logo, turtle, i, incompleteTuplet) - 1;
                }
		
                targetDuration = 0;
                tupletDuration = 0;
            } else {
                if (obj[LYINSIDECHORD] > 0) {
                    // Is logo the first note in the chord?
                    if (i === 0 || logo.lilypondStaging[turtle][i - 1][LYINSIDECHORD] !== obj[LYINSIDECHORD]) {
                        // Open the chord.
                        logo.lilypondNotes[turtle] += '<';
                    }
		    
                    logo.lilypondNotes[turtle] += (note);
		    
                    // Is logo the last note in the chord?
                    if (i === logo.lilypondStaging[turtle].length - 1 || logo.lilypondStaging[turtle][i + 1][LYINSIDECHORD] !== obj[LYINSIDECHORD]) {
                        // Close the chord and add note duration.
                        logo.lilypondNotes[turtle] += '>';
                        logo.lilypondNotes[turtle] += obj[LYDURATION];
                        for (var d = 0; d < obj[LYDOTCOUNT]; d++) {
                            logo.lilypondNotes[turtle] += '.';
                        }
			
                        if (articulation) {
                            logo.lilypondNotes[turtle] += '->';
                        }
			
                        logo.lilypondNotes[turtle] += ' ';
                    }
                } else {
                    logo.lilypondNotes[turtle] += (note + obj[LYDURATION]);
                    for (var d = 0; d < obj[LYDOTCOUNT]; d++) {
                        logo.lilypondNotes[turtle] += '.';
                    }
		    
                    if (articulation) {
                        logo.lilypondNotes[turtle] += '->';
                    }
                }
		
                if (obj[LYSTACCATO]) {
                    logo.lilypondNotes[turtle] += '\\staccato';
                }
		
                targetDuration = 0;
                tupletDuration = 0;
            }
	    
            logo.lilypondNotes[turtle] += ' ';
	    
            if (queueSlur) {
                queueSlur = false;
                logo.lilypondNotes[turtle] += '(';
            }
        }
    }
};


lilypondLineBreak = function(logo, turtle) {
    if (logo.lilypondStaging[turtle] == undefined) {
        logo.lilypondStaging[turtle] = [];
    }
    
    logo.lilypondStaging[turtle].push('break');
};


lilypondBeginArticulation = function(logo, turtle) {
    if (logo.lilypondStaging[turtle] == undefined) {
        logo.lilypondStaging[turtle] = [];
    }
    
    logo.lilypondStaging[turtle].push('begin articulation');
};


lilypondEndArticulation = function(logo, turtle) {
    logo.lilypondStaging[turtle].push('end articulation');
};


lilypondBeginCrescendo = function(logo, turtle, factor) {
    if (logo.lilypondStaging[turtle] == undefined) {
        logo.lilypondStaging[turtle] = [];
    }
    
    if (factor > 0) {
        logo.lilypondStaging[turtle].push('\\< ');
    } else {
        logo.lilypondStaging[turtle].push('\\> ');
    }
};


lilypondEndCrescendo = function(logo, turtle) {
    logo.lilypondStaging[turtle].push('\\! ');
};


lilypondBeginSlur = function(logo, turtle) {
    if (logo.lilypondStaging[turtle] == undefined) {
        logo.lilypondStaging[turtle] = [];
    }
    
    logo.lilypondStaging[turtle].push('(');
};


lilypondEndSlur = function(logo, turtle) {
    logo.lilypondStaging[turtle].push(') ');
};


lilypondInsertTie = function(logo, turtle) {
    if (logo.lilypondStaging[turtle] == undefined) {
        logo.lilypondStaging[turtle] = [];
    }
    
    logo.lilypondStaging[turtle].push('~');
};


lilypondRemoveTie = function(logo, turtle) {
    logo.lilypondStaging[turtle].pop();
};


saveLilypondOutput = function(logo, saveName) {
    var turtleCount = 0;
    var clef = [];
    for (var t in logo.lilypondStaging) {
        turtleCount += 1;
    }
    console.log('saving as lilypond: ' + turtleCount);
    
    logo.lilypondOutput += '% You can change the MIDI instruments below to anything on logo list:\n% (http://lilypond.org/doc/v2.18/documentation/notation/midi-instruments)\n\n';
    
    var c = 0;
    for (var t in logo.lilypondStaging) {
        if (logo.lilypondStaging[t].length > 0) {
            var octaveTotal = 0;
            var noteCount = 0;
            for (var i = 0; i < logo.lilypondStaging[t].length; i++) {
                obj = logo.lilypondStaging[t][i];
                if (typeof(obj) === 'object') {
                    if (obj[0].length < 2) {
                        // Test for rests
                    } else {
                        if (typeof(obj[0]) === 'string') {
                            octaveTotal += Number(obj[0].substr(-1));
                        } else {
                            var pitchObj = frequencyToPitch(obj[0]);
                            octaveTotal += pitchObj[1];
                        }
                        noteCount += 1;
                    }
                }
            }
            if (logo.turtles.turtleList[t].drum) {
                clef.push('percussion');
            } else if (noteCount > 0) {
                // console.log(t + ': ' + octaveTotal + ' ' + noteCount);
                switch (Math.floor(octaveTotal / noteCount)) {
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
	    
            processLilypondNotes(logo, t);
	    
            var instrumentName = logo.turtles.turtleList[t].name;
            if (instrumentName === _('start') || instrumentName === _('start drum')) {
                instrumentName = RODENTS[t % 12];
            } else if (instrumentName === t.toString()) {
                instrumentName = RODENTS[t % 12];
            }

            if (instrumentName === "") {
            	instrumentName = RODENTSEN[t % 12];
            }

            instrumentName = instrumentName.replace(/ /g, '_');
	    
            logo.lilypondOutput += instrumentName + ' = {\n';
            logo.lilypondOutput += '% \\meter\n';
            logo.lilypondOutput += logo.lilypondNotes[t];
	    
            // Add bar to last turtle's output.
            if (c === turtleCount - 1) {
                logo.lilypondOutput += ' \\bar "|."'
            }
            logo.lilypondOutput += '\n}\n\n';
	    
            var shortInstrumentName = RODENTSSHORT[t % 12];

            if (shortInstrumentName === "") {
            	shortInstrumentName = RODENTSSHORTEN[t % 12];
            }

            logo.lilypondOutput += instrumentName.replace(/ /g, '_') + 'Voice = ';
            if (logo.turtles.turtleList[t].drum) {
                logo.lilypondOutput += '\\new DrumStaff \\with {\n';
                // logo.lilypondOutput += '   \\drummode {\n      hihat4 hh bassdrum bd\n   }\n';
            } else {
                logo.lilypondOutput += '\\new Staff \\with {\n';
            }
            logo.lilypondOutput += '   \\clef "' + last(clef) + '"\n';
            logo.lilypondOutput += '   instrumentName = "' + instrumentName + '"\n';
            logo.lilypondOutput += '   shortInstrumentName = "' + shortInstrumentName + '"\n';
            logo.lilypondOutput += '   midiInstrument = "acoustic grand"\n';
            // Automatic note splitting
            logo.lilypondOutput += '\n   \\remove "Note_heads_engraver"\n   \\consists "Completion_heads_engraver"\n   \\remove "Rest_engraver"\n   \\consists "Completion_rest_engraver"\n'
	    
            logo.lilypondOutput += '} { \\clef "' + last(clef) + '" \\' + instrumentName.replace(/ /g, '_') + ' }\n\n';
        }
        c += 1;
    }
    
    // Begin the SCORE section.
    logo.lilypondOutput += '\n\\score {\n';
    logo.lilypondOutput += '   <<\n';
    
    // Sort the staffs, treble on top, bass_8 on the bottom.
    for (var c = 0; c < CLEFS.length; c++) {
        var i = 0;
        for (var t in logo.lilypondNotes) {
            if (clef[i] === CLEFS[c]) {
                if (logo.lilypondStaging[t].length > 0) {
                    var instrumentName = logo.turtles.turtleList[t].name;
                    if (instrumentName === _('start') || instrumentName === _('start drum')) {
                        instrumentName = RODENTS[t % 12];
                    } else if (instrumentName === t.toString()) {
                        instrumentName = RODENTS[t % 12];
                    }
                    instrumentName = instrumentName.replace(/ /g, '_');
                    logo.lilypondOutput += '      \\' + instrumentName + 'Voice\n';
                }
            }
        }
    }
    
    // Add GUITAR TAB in comments.
    logo.lilypondOutput += '\n\n% GUITAR TAB SECTION\n% Delete the %{ and %} below to include guitar tablature output.\n%{\n      \\new TabStaff = "guitar tab" \n      <<\n         \\clef moderntab\n';
    for (var c = 0; c < CLEFS.length; c++) {
        var i = 0;
        for (var t in logo.lilypondNotes) {
            if (clef[i] === CLEFS[c]) {
                if (logo.lilypondStaging[t].length > 0) {
                    var instrumentName = logo.turtles.turtleList[t].name;
                    if (instrumentName === _('start') || instrumentName === _('start drum')) {
                        instrumentName = RODENTS[t % 12]
                    } else if (instrumentName === t.toString()) {
                        instrumentName = RODENTS[t % 12];
                    }
                    instrumentName = instrumentName.replace(/ /g, '_');
                    logo.lilypondOutput += '         \\context TabVoice = "'+ instrumentName + '" \\' + instrumentName.replace(/ /g, '_') + '\n';
                }
            }
        }
    }
    
    // Close the SCORE sections.
    logo.lilypondOutput += '      >>\n%}\n';
    logo.lilypondOutput += '\n   >>\n   \\layout {}\n\n';
    
    // Add MIDI OUTPUT in comments.
    logo.lilypondOutput += '% MIDI SECTION\n% Delete the %{ and %} below to include MIDI output.\n%{\n\\midi {\n   \\tempo 4=90\n}\n%}\n\n}\n\n';
    
    // ADD TURTLE BLOCKS CODE HERE
    logo.lilypondOutput += '% MUSIC BLOCKS CODE\n';
    logo.lilypondOutput += '% Below is the code for the Music Blocks project that generated logo Lilypond file.\n%{\n\n';
    // prepareExport() returns json-encoded project data.
    var projectData = prepareExport();
    logo.lilypondOutput += projectData.replace(/]],/g, ']],\n');
    logo.lilypondOutput += '\n%}\n\n';
    
    doSaveLilypond(logo, saveName);
};
