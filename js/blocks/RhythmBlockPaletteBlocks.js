let language = localStorage.languagePreference || navigator.language;
let rhythmBlockPalette = language === "ja" ? "rhythm" : "widgets";

function setupRhythmBlockPaletteBlocks() {
    class RhythmBlock extends FlowBlock {
        constructor(name) {
            super(name || "rhythm");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.formBlock({
                name:
                    this.lang === "ja"
                        ? //.TRANS: rhythm block
                          _("rhythm1")
                        : //.TRANS: an arrangement of notes based on duration
                          _("rhythm"),
                args: 2,
                defaults: [3, 4],
                argLabels: [_("number of notes"), _("note value")],
                argTypes: ["anyin", "anyin"]
            });
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            if (
                args[0] === null ||
                typeof args[0] !== "number" ||
                args[0] < 1
            ) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 3;
            } else {
                var arg0 = args[0];
            }

            if (
                args[1] === null ||
                typeof args[1] !== "number" ||
                args[1] <= 0
            ) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 1 / 4;
            } else {
                var arg1 = args[1];
            }

            if (logo.blocks.blockList[blk].name === "rhythm2") {
                var noteBeatValue = 1 / arg1;
            } else {
                var noteBeatValue = arg1;
            }

            if (logo.inMatrix || logo.tuplet) {
                if (logo.inMatrix) {
                    logo.pitchTimeMatrix.addColBlock(blk, arg0);
                }

                for (var i = 0; i < args[0]; i++) {
                    logo._processNote(noteBeatValue, blk, turtle);
                }
            } else if (logo.inRhythmRuler) {
                // We don't check for balance since we want to support
                // polyphonic rhythms.
                if (logo.rhythmRulerMeasure === null) {
                    logo.rhythmRulerMeasure = arg0 * arg1;
                } else if (logo.rhythmRulerMeasure != arg0 * arg1) {
                    logo.textMsg(_("polyphonic rhythm"));
                }

                // Since there maybe more than one instance of the
                // same drum, e.g., if a repeat is used, we look from
                // end of the list instead of the beginning of the
                // list.

                var drumIndex = -1;
                for (var i = 0; i < logo.rhythmRuler.Drums.length; i++) {
                    var j = logo.rhythmRuler.Drums.length - i - 1;
                    if (logo.rhythmRuler.Drums[j] === logo._currentDrumBlock) {
                        drumIndex = j;
                        break;
                    }
                }

                if (drumIndex !== -1) {
                    for (var i = 0; i < arg0; i++) {
                        logo.rhythmRuler.Rulers[drumIndex][0].push(
                            noteBeatValue
                        );
                    }
                }
            } else {
                if (logo.drumStyle[turtle].length > 0) {
                    // Play rhythm block as if it were a drum.
                    logo.clearNoteParams(turtle, blk, logo.drumStyle[turtle]);
                    logo.inNoteBlock[turtle].push(blk);
                } else {
                    // Or use the current synth.
                    logo.clearNoteParams(turtle, blk, []);
                    logo.inNoteBlock[turtle].push(blk);
                    logo.notePitches[turtle][last(logo.inNoteBlock[turtle])] = [
                        "G"
                    ];
                    logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])] = [
                        4
                    ];
                    logo.noteCents[turtle][last(logo.inNoteBlock[turtle])] = [
                        0
                    ];
                }

                if (logo.bpm[turtle].length > 0) {
                    var bpmFactor = TONEBPM / last(logo.bpm[turtle]);
                } else {
                    var bpmFactor = TONEBPM / logo._masterBPM;
                }

                var beatValue = bpmFactor / noteBeatValue;

                let __rhythmPlayNote = function(
                    thisBeat,
                    blk,
                    turtle,
                    callback,
                    timeout
                ) {
                    setTimeout(function() {
                        logo._processNote(thisBeat, blk, turtle, callback);
                    }, timeout);
                };
                let __callback;

                for (var i = 0; i < arg0; i++) {
                    if (i === arg0 - 1) {
                        __callback = function() {
                            delete logo.noteDrums[turtle][blk];
                            var j = logo.inNoteBlock[turtle].indexOf(blk);
                            logo.inNoteBlock[turtle].splice(j, 1);
                        };
                    } else {
                        __callback = null;
                    }

                    __rhythmPlayNote(
                        noteBeatValue,
                        blk,
                        turtle,
                        __callback,
                        i * beatValue * 1000
                    );
                }

                logo._doWait(turtle, (arg0 - 1) * beatValue);
            }
        }
    }

    class Rhythm2Block extends RhythmBlock {
        constructor() {
            super("rhythm2");
            this.setPalette(rhythmBlockPalette);
            this.beginnerBlock(true);
            this.setHelpString([
                _("The Rhythm block is used to generate rhythm patterns."),
                "documentation",
                null,
                "rhythm2"
            ]);

            this.formBlock({
                name:
                    this.lang === "ja"
                        ? //.TRANS: rhythm block
                          _("rhythm1")
                        : //.TRANS: an arrangement of notes based on duration
                          _("rhythm"),
                args: 2,
                defaults: [3, 4],
                argLabels: [_("number of notes"), _("note value")],
                argTypes: ["anyin", "anyin"]
            });
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 3 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class SixtyFourthNoteBlock extends FlowBlock {
        constructor() {
            super("sixtyfourthNote", _("1/64 note") + " 𝅘𝅥𝅱");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 64 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class ThirtySecondNoteBlock extends FlowBlock {
        constructor() {
            super("thirtysecondNote", _("1/32 note") + " 𝅘𝅥𝅰");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 32 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class SixteenthNoteBlock extends FlowBlock {
        constructor() {
            super("sixteenthNote", _("1/16 note") + " 𝅘𝅥𝅯");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 16 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class EighthNoteBlock extends FlowBlock {
        constructor() {
            super("eighthNote", _("eighth note") + " ♪");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 8 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class QuarterNoteBlock extends FlowBlock {
        constructor() {
            super("quarterNote", _("quarter note") + " ♩");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class HalfNoteBlock extends FlowBlock {
        constructor() {
            super("halfNote", _("half note") + " 𝅗𝅥");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 2 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class WholeNoteBlock extends FlowBlock {
        constructor() {
            super("wholeNote", _("whole note") + " 𝅝");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 1 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class Tuplet2Block extends FlowClampBlock {
        constructor(name) {
            super(name || "tuplet2");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.formBlock({
                //.TRANS: A tuplet is a note value divided into irregular time values.
                name: _("tuplet"),
                args: 2,
                defaults: [1, 4],
                argLabels: [_("number of notes"), _("note value")]
            });
            this.hidden = true;
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            if (logo.inMatrix) {
                if (logo.blocks.blockList[blk].name === "tuplet3") {
                    logo.tupletParams.push([
                        args[0],
                        (1 / args[1]) * logo.beatFactor[turtle]
                    ]);
                } else {
                    logo.tupletParams.push([
                        args[0],
                        args[1] * logo.beatFactor[turtle]
                    ]);
                }

                logo.tuplet = true;
                logo.addingNotesToTuplet = false;
            }

            var listenerName = "_tuplet_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                if (logo.inMatrix) {
                    logo.tuplet = false;
                    logo.addingNotesToTuplet = false;
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[2], 1];
        }
    }

    class Tuplet3Block extends Tuplet2Block {
        constructor() {
            super("tuplet3");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.formBlock({
                name: _("tuplet"),
                args: 2,
                defaults: [1, 4],
                argLabels: [_("number of notes"), _("note value")]
            });
            this.makeMacro((x, y) => [
                [0, "tuplet3", x, y, [null, 1, 10, 9, 7]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "rhythm2", 0, 0, [9, 3, 4, 8]],
                [3, ["number", { value: 3 }], 0, 0, [2]],
                [4, "divide", 0, 0, [2, 5, 6]],
                [5, ["number", { value: 1 }], 0, 0, [4]],
                [6, ["number", { value: 4 }], 0, 0, [4]],
                [7, "hidden", 0, 0, [0, null]],
                [8, "vspace", 0, 0, [2, null]],
                [9, "vspace", 0, 0, [0, 2]],
                [10, "divide", 0, 0, [0, 11, 12]],
                [11, ["number", { value: 1 }], 0, 0, [10]],
                [12, ["number", { value: 4 }], 0, 0, [10]]
            ]);
            this.hidden = true;
        }
    }

    class Tuplet4Block extends FlowClampBlock {
        constructor() {
            super("tuplet4");
            this.setPalette(rhythmBlockPalette);
            this.setHelpString([
                _(
                    "The Tuplet block is used to generate a group of notes played in a condensed amount of time."
                ),
                "documentation",
                null,
                "tuplet4"
            ]);
            this.extraWidth = 20;
            this.formBlock({
                name: _("tuplet"),
                args: 1,
                defaults: [1 / 4],
                argLabels: [_("note value")]
            });
            this.makeMacro((x, y) => [
                [0, "tuplet4", x, y, [null, 1, 4, 17]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 2 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "rhythm2", 0, 0, [4, 6, 7, 10]],
                [6, ["number", { value: 6 }], 0, 0, [5]],
                [7, "divide", 0, 0, [5, 8, 9]],
                [8, ["number", { value: 1 }], 0, 0, [7]],
                [9, ["number", { value: 16 }], 0, 0, [7]],
                [10, "vspace", 0, 0, [5, 11]],
                [11, "rhythm2", 0, 0, [10, 12, 13, 16]],
                [12, ["number", { value: 1 }], 0, 0, [11]],
                [13, "divide", 0, 0, [11, 14, 15]],
                [14, ["number", { value: 1 }], 0, 0, [13]],
                [15, ["number", { value: 4 }], 0, 0, [13]],
                [16, "vspace", 0, 0, [11, null]],
                [17, "hidden", 0, 0, [0, 18]],
                [18, "hidden", 0, 0, [17, null]]
            ]);
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            if (args[1] === undefined) {
                // nothing to do
                return;
            }

            if (
                args[0] === null ||
                typeof args[0] !== "number" ||
                args[0] <= 0
            ) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 1 / 2;
            } else {
                var arg = args[0];
            }

            if (!logo.inMatrix) {
                logo.tupletRhythms = [];
                logo.tupletParams = [];
            }

            logo.tuplet = true;
            logo.addingNotesToTuplet = false;
            logo.tupletParams.push([1, (1 / arg) * logo.beatFactor[turtle]]);

            var listenerName = "_tuplet_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                logo.tuplet = false;
                logo.addingNotesToTuplet = false;
                if (!logo.inMatrix) {
                    var beatValues = [];

                    for (var i = 0; i < logo.tupletRhythms.length; i++) {
                        var tupletParam = [
                            logo.tupletParams[logo.tupletRhythms[i][1]]
                        ];
                        tupletParam.push([]);
                        var tupletBeats = 0;
                        for (var j = 2; j < logo.tupletRhythms[i].length; j++) {
                            tupletBeats += 1 / logo.tupletRhythms[i][j];
                            tupletParam[1].push(logo.tupletRhythms[i][j]);
                        }

                        var factor =
                            tupletParam[0][0] /
                            (tupletParam[0][1] * tupletBeats);
                        for (var j = 2; j < logo.tupletRhythms[i].length; j++) {
                            beatValues.push(logo.tupletRhythms[i][j] / factor);
                        }
                    }

                    // Play rhythm block as if it were a drum.
                    if (logo.drumStyle[turtle].length > 0) {
                        logo.clearNoteParams(
                            turtle,
                            blk,
                            logo.drumStyle[turtle]
                        );
                    } else {
                        logo.clearNoteParams(turtle, blk, [DEFAULTDRUM]);
                    }

                    logo.inNoteBlock[turtle].push(blk);

                    if (logo.bpm[turtle].length > 0) {
                        var bpmFactor = TONEBPM / last(logo.bpm[turtle]);
                    } else {
                        var bpmFactor = TONEBPM / logo._masterBPM;
                    }

                    var totalBeats = 0;

                    __tupletPlayNote = function(
                        thisBeat,
                        blk,
                        turtle,
                        callback,
                        timeout
                    ) {
                        setTimeout(function() {
                            logo._processNote(thisBeat, blk, turtle, callback);
                        }, timeout);
                    };

                    var timeout = 0;
                    for (var i = 0; i < beatValues.length; i++) {
                        var thisBeat = beatValues[i];
                        var beatValue = bpmFactor / thisBeat;

                        if (i === beatValues.length - 1) {
                            __callback = function() {
                                delete logo.noteDrums[turtle][blk];
                                var j = logo.inNoteBlock[turtle].indexOf(blk);
                                logo.inNoteBlock[turtle].splice(j, 1);
                            };
                        } else {
                            __callback = null;
                        }

                        __tupletPlayNote(
                            thisBeat,
                            blk,
                            turtle,
                            __callback,
                            timeout
                        );

                        timeout += beatValue * 1000;
                        totalBeats += beatValue;
                    }

                    logo._doWait(turtle, totalBeats - beatValue);
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class SeptupletBlock extends FlowBlock {
        constructor() {
            //.TRANS: A tuplet divided into 7 time values.
            super("stuplet7", _("septuplet"));
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "stuplet", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 7 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 2 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class QuintupletBlock extends FlowBlock {
        constructor() {
            //.TRANS: A tuplet divided into 5 time values.
            super("stuplet5", _("quintuplet"));
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "stuplet", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 5 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 2 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class TripletBlock extends FlowBlock {
        constructor() {
            //.TRANS: A tuplet divided into 3 time values.
            super("stuplet3", _("triplet"));
            this.setPalette(rhythmBlockPalette);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "stuplet", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 3 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 2 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    class STupletBlock extends FlowBlock {
        constructor() {
            super("stuplet", _("simple tuplet"));
            this.setPalette(rhythmBlockPalette);
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "Tuplets are a collection of notes that get scaled to a specific duration."
                ) +
                    " " +
                    _(
                        "Using tuplets makes it easy to create groups of notes that are not based on a power of 2."
                    ),
                "documentation",
                null,
                "matrix"
            ]);

            this.formBlock({
                args: 2,
                defaults: [3, 1 / 2],
                argLabels: [_("number of notes"), _("note value")]
            });
            this.makeMacro((x, y) => [
                [0, "stuplet", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 3 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 2 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            if (
                args[0] === null ||
                typeof args[0] !== "number" ||
                args[0] <= 0
            ) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 3;
            } else {
                var arg0 = args[0];
            }

            if (
                args[1] === null ||
                typeof args[1] !== "number" ||
                args[1] <= 0
            ) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 1 / 2;
            } else {
                var arg1 = args[1];
            }

            var noteBeatValue = (1 / arg1) * logo.beatFactor[turtle];
            if (logo.inMatrix || logo.tuplet) {
                logo.pitchTimeMatrix.addColBlock(blk, arg0);
                if (logo.tuplet) {
                    // The simple-tuplet block is inside.
                    for (var i = 0; i < arg0; i++) {
                        if (!logo.addingNotesToTuplet) {
                            logo.tupletRhythms.push(["notes", 0]);
                            logo.addingNotesToTuplet = true;
                        }

                        logo._processNote(noteBeatValue, blk, turtle);
                    }
                } else {
                    logo.tupletParams.push([1, noteBeatValue]);
                    var obj = ["simple", 0];
                    for (var i = 0; i < arg0; i++) {
                        obj.push((1 / arg1) * logo.beatFactor[turtle]);
                    }
                    logo.tupletRhythms.push(obj);
                }
            } else {
                // Play rhythm block as if it were a drum.
                if (logo.drumStyle[turtle].length > 0) {
                    logo.clearNoteParams(turtle, blk, logo.drumStyle[turtle]);
                } else {
                    logo.clearNoteParams(turtle, blk, [DEFAULTDRUM]);
                }

                logo.inNoteBlock[turtle].push(blk);

                if (logo.bpm[turtle].length > 0) {
                    var bpmFactor = TONEBPM / last(logo.bpm[turtle]);
                } else {
                    var bpmFactor = TONEBPM / logo._masterBPM;
                }

                var beatValue = bpmFactor / noteBeatValue / arg0;

                __rhythmPlayNote = function(
                    thisBeat,
                    blk,
                    turtle,
                    callback,
                    timeout
                ) {
                    setTimeout(function() {
                        logo._processNote(thisBeat, blk, turtle, callback);
                    }, timeout);
                };

                for (var i = 0; i < arg0; i++) {
                    if (i === arg0 - 1) {
                        __callback = function() {
                            delete logo.noteDrums[turtle][blk];
                            var j = logo.inNoteBlock[turtle].indexOf(blk);
                            logo.inNoteBlock[turtle].splice(j, 1);
                        };
                    } else {
                        __callback = null;
                    }

                    __rhythmPlayNote(
                        noteBeatValue * arg0,
                        blk,
                        turtle,
                        __callback,
                        i * beatValue * 1000
                    );
                }

                logo._doWait(turtle, (arg0 - 1) * beatValue);
            }
        }
    }

    new RhythmBlock().setup();
    new Rhythm2Block().setup();
    new SixtyFourthNoteBlock().setup();
    new ThirtySecondNoteBlock().setup();
    new SixteenthNoteBlock().setup();
    new EighthNoteBlock().setup();
    new QuarterNoteBlock().setup();
    new HalfNoteBlock().setup();
    new WholeNoteBlock().setup();
    new Tuplet2Block().setup();
    new Tuplet3Block().setup();
    new Tuplet4Block().setup();
    new SeptupletBlock().setup();
    new QuintupletBlock().setup();
    new TripletBlock().setup();
    new STupletBlock().setup();
}
