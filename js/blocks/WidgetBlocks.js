function setupWidgetBlocks() {
    class EnvelopeBlock extends FlowBlock {
        constructor() {
            //.TRANS: sound envelope (ADSR)
            super("envelope", _("envelope"));
            this.setPalette("widgets");
            this.setHelpString();
            this.formBlock({
                args: 4,
                defaults: [1, 50, 60, 1],
                argLabels: [
                    //.TRANS: Attack time is the time taken for initial run-up of level from nil to peak, beginning when the key is first pressed.
                    _("attack"),
                    //.TRANS: Decay time is the time taken for the subsequent run down from the attack level to the designated sustain level.
                    _("decay"),
                    //.TRANS: Sustain level is the level during the main sequence of the sound's duration, until the key is released.
                    _("sustain"),
                    //.TRANS: Release time is the time taken for the level to decay from the sustain level to zero after the key is released.
                    _("release")
                ]
            });
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            if (args.length === 4 && typeof args[0] === "number") {
                if (args[0] < 0 || args[0] > 100) {
                    logo.errorMsg(_("Attack value should be from 0 to 100."));
                }
                if (args[1] < 0 || args[1] > 100) {
                    logo.errorMsg(_("Decay value should be from 0 to 100."));
                }
                if (args[2] < 0 || args[2] > 100) {
                    logo.errorMsg(_("Sustain value should be from 0 to 100."));
                }
                if (args[3] < 0 || args[3] > 100) {
                    logo.errorMsg(_("Release value should be from 0-100."));
                }

                turtle.singer.attack.push(args[0] / 100);
                turtle.singer.decay.push(args[1] / 100);
                turtle.singer.sustain.push(args[2] / 100);
                turtle.singer.release.push(args[3] / 100);
            }

            if (logo.inTimbre) {
                logo.timbre.synthVals["envelope"]["attack"] = last(tur.singer.attack);
                logo.timbre.synthVals["envelope"]["decay"] = last(tur.singer.decay);
                logo.timbre.synthVals["envelope"]["sustain"] = last(tur.singer.sustain);
                logo.timbre.synthVals["envelope"]["release"] = last(tur.singer.release);

                if (logo.timbre.env.length != 0) {
                    logo.errorMsg(
                        _("You are adding multiple envelope blocks.")
                    );
                } else {
                    // Create the synth for the instrument.
                    logo.synth.createSynth(
                        turtle,
                        logo.timbre.instrumentName,
                        logo.timbre.synthVals["oscillator"]["source"],
                        logo.timbre.synthVals
                    );
                }

                logo.timbre.env.push(blk);
                logo.timbre.ENVs.push(Math.round(last(tur.singer.attack) * 100));
                logo.timbre.ENVs.push(Math.round(last(tur.singer.decay) * 100));
                logo.timbre.ENVs.push(Math.round(last(tur.singer.sustain) * 100));
                logo.timbre.ENVs.push(Math.round(last(tur.singer.release) * 100));
            }
        }
    }

    class FilterBlock extends FlowBlock {
        constructor() {
            //.TRANS: a filter removes some unwanted components from a signal
            super("filter", _("filter"));
            this.setPalette("widgets");
            this.setHelpString();
            this.formBlock({
                args: 3,
                defaults: [_("highpass"), -12, 392],
                argLabels: [
                    //.TRANS: type of filter, e.g., lowpass, highpass, etc.
                    _("type"),
                    //.TRANS: rolloff is the steepness of a change in frequency.
                    _("rolloff"),
                    _("frequency")
                ],
                argTypes: ["anyin", "numberin", "numberin"]
            });
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            let filtertype = DEFAULTFILTERTYPE;
            let freq;
            let rollOff;

            if (args.length === 3 && typeof args[1] === "number") {
                for (let ftype in FILTERTYPES) {
                    if (FILTERTYPES[ftype][0] === args[0]) {
                        filtertype = FILTERTYPES[ftype][1];
                    } else if (FILTERTYPES[ftype][1] === args[0]) {
                        filtertype = args[0];
                    }
                }

                if ([-12, -24, -48, -96].indexOf(args[1]) === -1) {
                    //.TRANS: rolloff is the steepness of a change in frequency.
                    logo.errorMsg(
                        _(
                            "Rolloff value should be either -12, -24, -48, or -96 decibels/octave."
                        )
                    );
                }

                rollOff = args[1];
                freq = args[2];

                if (logo.inTimbre) {
                    if (
                        !(
                            logo.timbre.instrumentName in
                            instrumentsFilters[turtle]
                        )
                    ) {
                        instrumentsFilters[turtle][
                            logo.timbre.instrumentName
                        ] = [];
                    }
                    // Add the filter to the instrument
                    instrumentsFilters[turtle][logo.timbre.instrumentName].push(
                        {
                            filterType: filtertype,
                            filterRolloff: rollOff,
                            filterFrequency: freq
                        }
                    );

                    logo.timbre.fil.push(blk);
                    logo.timbre.filterParams.push(filtertype);
                    logo.timbre.filterParams.push(rollOff);
                    logo.timbre.filterParams.push(freq);
                }
            }
        }
    }

    class TemperamentBlock extends StackClampBlock {
        constructor() {
            super("temperament");
            this.setPalette("widgets");
            this.setHelpString([
                _("The Temperament tool is used to define custom tuning."),
                "documentation",
                null,
                "temperament"
            ]);
            this.formBlock({
                args: 1,
                name: _("temperament"),
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "temperament", x, y, [null, 1, 2, 8]],
                [1, ["temperamentname", { value: "equal" }], 0, 0, [0]],
                [2, "pitch", 0, 0, [0, 3, 4, 5]],
                [3, ["notename", { value: "C" }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "setkey2", 0, 0, [2, 6, 7, null]],
                [6, ["notename", { value: "C" }], 0, 0, [5]],
                [7, ["modename", { value: DEFAULTMODE }], 0, 0, [5]],
                [8, "hiddennoflow", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (logo.temperament === null) {
                logo.temperament = new TemperamentWidget();
            }

            logo.insideTemperament = true;
            logo.temperament.inTemperament = args[0];
            let scale = [];

            if (
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[2]]
                    .name === "pitch"
            ) {
                let pitchBlock =
                    logo.blocks.blockList[
                        logo.blocks.blockList[blk].connections[2]
                    ];
                let note =
                    logo.blocks.blockList[pitchBlock.connections[1]].value;
                let octave =
                    logo.blocks.blockList[pitchBlock.connections[2]].value;
                let setKey = logo.blocks.blockList[pitchBlock.connections[3]];
                scale[0] = logo.blocks.blockList[setKey.connections[1]].value;
                scale[1] = logo.blocks.blockList[setKey.connections[2]].value;
                logo.synth.startingPitch = note + octave;
                logo.temperament.scale = scale;
            }

            let listenerName = "_temperament_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.temperament.init(logo);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }
    }

    class TimbreBlock extends StackClampBlock {
        constructor() {
            super("timbre");
            this.setPalette("widgets");
            this.setHelpString();

            this.formBlock({
                //.TRANS: timbre is the character or quality of a musical sound
                name: _("timbre"),
                args: 1,
                defaults: [_("custom")],
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "timbre", x, y, [null, 1, 3, 2]],
                [1, ["text", { value: _("custom") }], 0, 0, [0]],
                [2, "hiddennoflow", 0, 0, [0, null]],
                [3, "newnote", 0, 0, [0, 4, 7, 11]],
                [4, "divide", 0, 0, [3, 5, 6]],
                [5, ["number", { value: 1 }], 0, 0, [4]],
                [6, ["number", { value: 4 }], 0, 0, [4]],
                [7, "vspace", 0, 0, [3, 8]],
                [8, "pitch", 0, 0, [7, 9, 10, null]],
                [9, ["solfege", { value: "sol" }], 0, 0, [8]],
                [10, ["number", { value: 4 }], 0, 0, [8]],
                [11, "hidden", 0, 0, [3, 12]],
                [12, "newnote", 0, 0, [11, 13, 16, 20]],
                [13, "divide", 0, 0, [12, 14, 15]],
                [14, ["number", { value: 1 }], 0, 0, [13]],
                [15, ["number", { value: 4 }], 0, 0, [13]],
                [16, "vspace", 0, 0, [12, 17]],
                [17, "pitch", 0, 0, [16, 18, 19, null]],
                [18, ["solfege", { value: "mi" }], 0, 0, [17]],
                [19, ["number", { value: 4 }], 0, 0, [17]],
                [20, "hidden", 0, 0, [12, 21]],
                [21, "newnote", 0, 0, [20, 22, 25, 29]],
                [22, "divide", 0, 0, [21, 23, 24]],
                [23, ["number", { value: 1 }], 0, 0, [22]],
                [24, ["number", { value: 2 }], 0, 0, [22]],
                [25, "vspace", 0, 0, [21, 26]],
                [26, "pitch", 0, 0, [25, 27, 28, null]],
                [27, ["solfege", { value: "sol" }], 0, 0, [26]],
                [28, ["number", { value: 4 }], 0, 0, [26]],
                [29, "hidden", 0, 0, [21, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (logo.timbre === null) {
                logo.timbre = new TimbreWidget();
            }

            logo.inTimbre = true;

            if (typeof args[0] === "string") {
                // CLear out the instrument because we will recreate it in the widget.
                logo.timbre.instrumentName = args[0];
            } else {
                logo.timbre.instrumentName = DEFAULTVOICE;
                logo.errorMsg(NOINPUTERRORMSG, blk);
            }

            instrumentsEffects[turtle][logo.timbre.instrumentName] = {};
            instrumentsEffects[turtle][logo.timbre.instrumentName][
                "vibratoActive"
            ] = false;
            instrumentsEffects[turtle][logo.timbre.instrumentName][
                "distortionActive"
            ] = false;
            instrumentsEffects[turtle][logo.timbre.instrumentName][
                "tremoloActive"
            ] = false;
            instrumentsEffects[turtle][logo.timbre.instrumentName][
                "phaserActive"
            ] = false;
            instrumentsEffects[turtle][logo.timbre.instrumentName][
                "chorusActive"
            ] = false;
            instrumentsFilters[turtle][logo.timbre.instrumentName] = [];

            logo.timbre.blockNo = blk;
            logo.timbre.env = [];
            logo.timbre.ENVs = [];
            logo.timbre.fil = [];
            logo.timbre.filterParams = [];
            logo.timbre.osc = [];
            logo.timbre.oscParams = [];
            logo.timbre.tremoloEffect = [];
            logo.timbre.tremoloParams = [];
            logo.timbre.vibratoEffect = [];
            logo.timbre.vibratoParams = [];
            logo.timbre.chorusEffect = [];
            logo.timbre.chorusParams = [];
            logo.timbre.phaserEffect = [];
            logo.timbre.phaserParams = [];
            logo.timbre.distortionEffect = [];
            logo.timbre.distortionParams = [];
            logo.timbre.AMSynthesizer = [];
            logo.timbre.AMSynthParams = [];
            logo.timbre.FMSynthesizer = [];
            logo.timbre.FMSynthParams = [];
            logo.timbre.duoSynthesizer = [];
            logo.timbre.duoSynthParams = [];
            logo.timbre.notesToPlay = [];

            let listenerName = "_timbre_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.timbre.init(logo);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class MeterWidgetBlock extends StackClampBlock {
        constructor() {
            super("meterwidget");
            this.setPalette("widgets");
            this.setHelpString([
                _(
                    "The Meter block opens a tool to select strong beats for the meter."
                ),
                "documentation",
                null,
                "meterwidget"
            ]);
            this.formBlock({ name: _("meter"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, ["meterwidget", { collapsed: false }], x, y, [null, 1, 7]],
                [1, "meter", 0, 0, [0, 2, 3, 6]],
                [2, ["number", { value: 4 }], 0, 0, [1]],
                [3, "divide", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, ["number", { value: 4 }], 0, 0, [3]],
                [6, "vspace", 0, 0, [1, null]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (logo.meterWidget === null) {
                logo.meterWidget = new MeterWidget();
            }

            logo.insideMeterWidget = true;

            let listenerName = "_meterwidget_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.meterWidget.init(logo, logo._meterBlock ,blk);
                logo.insideMeterWidget = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    class oscilloscopeWidgetBlock extends StackClampBlock {
        constructor() {
            super("oscilloscope");
            this.setPalette("widgets");
            this.setHelpString([
                _(
                    "The oscilloscope block opens a tool to visualize waveforms."
                ),
                "documentation",
                null,
                "oscilloscope"
            ]);
            this.formBlock({ name: _("oscilloscope"), canCollapse: true });
            let addPrintTurtle = (blocks,turtle,prev,last) => {
                let len = blocks.length;
                let next = last ? null : len+2
                blocks.push([len, "print", 0, 0, [prev, len + 1, next]]);
                blocks.push([len + 1, ["text", { value: turtle.name}], 0, 0, [len, null]]);
                return blocks;
            }

            this.makeMacro((x, y) => {
                let blocks = [[0,"oscilloscope", x, y, [null, 1, null]]];
                for (let turtle of turtles.turtleList) {
                    if (!turtle.inTrash)
                        blocks = addPrintTurtle(blocks, turtle, Math.max(0, blocks.length - 2), turtle == last(turtles.turtleList));
                }
                blocks[0][4][2]=blocks.length;
                blocks.push([blocks.length, "hiddennoflow", 0, 0, [0, null]]);
                return blocks;
            });
        }

        flow(args, logo, turtle, blk) {
            if (logo.Oscilloscope === null) {
                logo.Oscilloscope = new Oscilloscope();
            }
            logo.oscilloscopeTurtles = [];
            logo.inOscilloscope = true;

            let listenerName = "_oscilloscope_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.Oscilloscope.init(logo);
                logo.inOscilloscope = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    class ModeWidgetBlock extends StackClampBlock {
        constructor() {
            super("modewidget");
            this.setPalette("widgets");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Custom mode block opens a tool to explore musical mode (the spacing of the notes in a scale)."
                ),
                "documentation",
                ""
            ]);

            //.TRANS: musical mode is the pattern of half-steps in an octave, e.g., Major or Minor modes
            this.formBlock({ name: _("custom mode"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, "modewidget", x, y, [null, 1, 4]],
                [1, "setkey2", 0, 0, [0, 2, 3, null]],
                [2, ["notename", { value: "C" }], 0, 0, [1]],
                [3, ["modename", { value: DEFAULTMODE }], 0, 0, [1]],
                [4, "hiddennoflow", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (logo.modeWidget === null) {
                logo.modeWidget = new ModeWidget();
            }

            logo.insideModeWidget = true;

            let listenerName = "_modewidget_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.modeWidget.init(logo, logo._modeBlock);
                logo.insideModeWidget = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    class TempoBlock extends StackClampBlock {
        constructor() {
            super("tempo");
            this.setPalette("widgets");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Tempo block opens a metronome to visualize the beat."),
                "documentation",
                null,
                "tempo"
            ]);

            //.TRANS: the speed at music is should be played.
            this.formBlock({ name: _("tempo"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, "tempo", x, y, [null, 1, 6]],
                [1, "setmasterbpm2", 0, 0, [0, 2, 3, 7]],
                [2, ["number", { value: 90 }], 0, 0, [1]],
                [3, "divide", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, ["number", { value: 4 }], 0, 0, [3]],
                [6, "hiddennoflow", 0, 0, [0, null]],
                [7, "vspace", 0, 0, [1, null]]
            ]);
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            if (logo.tempo === null) {
                logo.tempo = new Tempo();
            }

            logo.inTempo = true;
            logo.tempo.BPMBlocks = [];
            logo.tempo.BPMs = [];

            let listenerName = "_tempo_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.tempo.init(logo);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class PitchDrumMatrixBlock extends StackClampBlock {
        constructor() {
            super("pitchdrummatrix");
            this.setPalette("widgets");
            this.setHelpString([
                _(
                    "The Pitch drum matrix is used to map pitches to drum sounds."
                ),
                "documentation",
                ""
            ]);
            //.TRANS: makes a mapping between pitches and drum sounds
            this.formBlock({ name: _("pitch-drum mapper"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, "pitchdrummatrix", x, y, [null, 1, 16]],
                [1, "pitch", 0, 0, [0, 2, 3, 4]],
                [2, ["solfege", { value: "sol" }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "pitch", 0, 0, [1, 5, 6, 7]],
                [5, ["solfege", { value: "mi" }], 0, 0, [4]],
                [6, ["number", { value: 4 }], 0, 0, [4]],
                [7, "pitch", 0, 0, [4, 8, 9, 10]],
                [8, ["solfege", { value: "re" }], 0, 0, [7]],
                [9, ["number", { value: 4 }], 0, 0, [7]],
                [10, "playdrum", 0, 0, [7, 11, 12]],
                [11, ["drumname", { value: "kick drum" }], 0, 0, [10]],
                [12, "playdrum", 0, 0, [10, 13, 14]],
                [13, ["drumname", { value: "snare drum" }], 0, 0, [12]],
                [14, "playdrum", 0, 0, [12, 15, null]],
                [15, ["drumname", { value: "ride bell" }], 0, 0, [14]],
                [16, "hiddennoflow", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (logo.pitchDrumMatrix === null) {
                logo.pitchDrumMatrix = new PitchDrumMatrix();
            }

            logo.inPitchDrumMatrix = true;
            logo.pitchDrumMatrix.rowLabels = [];
            logo.pitchDrumMatrix.rowArgs = [];
            logo.pitchDrumMatrix.drums = [];
            logo.pitchDrumMatrix.clearBlocks();

            let listenerName = "_pitchdrummatrix_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                if (
                    logo.pitchDrumMatrix.drums.length === 0 ||
                    logo.pitchDrumMatrix.rowLabels.length === 0
                ) {
                    logo.errorMsg(
                        _(
                            "You must have at least one pitch block and one drum block in the matrix."
                        ),
                        blk
                    );
                } else {
                    // Process queued up rhythms.
                    logo.pitchDrumMatrix.init(logo);
                    logo.pitchDrumMatrix.makeClickable();
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    class PitchSliderBlock extends StackClampBlock {
        constructor() {
            super("pitchslider");
            this.setPalette("widgets");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Pitch slider tool to is used to generate pitches at selected frequencies."
                ),
                "documentation",
                ""
            ]);
            //.TRANS: widget to generate pitches using a slider
            this.formBlock({ name: _("pitch slider"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, "pitchslider", x, y, [null, 1, 3]],
                [1, "hertz", 0, 0, [0, 2, null]],
                [2, ["number", { value: 392 }], 0, 0, [1]],
                [3, "hiddennoflow", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (logo.pitchSlider === null) {
                logo.pitchSlider = new PitchSlider();
            }

            logo.inPitchSlider = true;
            logo.pitchSlider.frequencies = [];

            let listenerName = "_pitchslider_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.pitchSlider.init(logo);
                logo.inPitchSlider = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class ChromaticBlock extends StackClampBlock {
        constructor() {
            super("chromatic");
            this.setPalette("widgets");
            this.setHelpString();
            this.formBlock({
                name: _("chromatic keyboard"),
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [
                    0,
                    ["musickeyboard", { collapsed: false }],
                    x,
                    y,
                    [null, 2, 1]
                ],
                [1, ["hiddennoflow", {}], 0, 0, [0, null]],
                [2, ["setkey2", {}], 0, 0, [0, 3, 4, 5]],
                [3, ["notename", { value: "C" }], 0, 0, [2]],
                [4, ["modename", { value: "chromatic" }], 0, 0, [2]],
                [5, ["pitch", {}], 0, 0, [2, 6, 7, 8]],
                [6, ["solfege", { value: "do" }], 0, 0, [5]],
                [7, ["number", { value: 5 }], 0, 0, [5]],
                [8, ["repeat", {}], 0, 0, [5, 9, 10, null]],
                [9, ["modelength", {}], 0, 0, [8]],
                [10, ["steppitch", {}], 0, 0, [8, 11, null]],
                [11, ["number", { value: -1 }], 0, 0, [10]]
            ]);

            if (this.lang !== "ja") this.hidden = true;
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {}
    }

    class MusicKeyboard2Block extends StackClampBlock {
        constructor() {
            super("musickeyboard2");
            this.setPalette("widgets");
            this.setHelpString();
            this.formBlock({ name: _("music keyboard"), canCollapse: true });
            if (this.lang === "ja")
                this.makeMacro((x, y) => [
                    [0, "musickeyboard", x, y, [null, 1, 16]],
                    [1, "pitch", 0, 0, [0, 2, 3, 4]],
                    [2, ["solfege", { value: "sol" }], 0, 0, [1]],
                    [3, ["number", { value: 4 }], 0, 0, [1]],
                    [4, "pitch", 0, 0, [1, 5, 6, 7]],
                    [5, ["solfege", { value: "fa" }], 0, 0, [4]],
                    [6, ["number", { value: 4 }], 0, 0, [4]],
                    [7, "pitch", 0, 0, [4, 8, 9, 10]],
                    [8, ["solfege", { value: "mi" }], 0, 0, [7]],
                    [9, ["number", { value: 4 }], 0, 0, [7]],
                    [10, "pitch", 0, 0, [7, 11, 12, 13]],
                    [11, ["solfege", { value: "re" }], 0, 0, [10]],
                    [12, ["number", { value: 4 }], 0, 0, [10]],
                    [13, "pitch", 0, 0, [10, 14, 15, null]],
                    [14, ["solfege", { value: "do" }], 0, 0, [13]],
                    [15, ["number", { value: 4 }], 0, 0, [13]],
                    [16, "hiddennoflow", 0, 0, [0, null]]
                ]);
            else
                this.makeMacro((x, y) => [
                    [0, "musickeyboard", x, y, [null, 1, 16]],
                    [1, "pitch", 0, 0, [0, 2, 3, 4]],
                    [2, ["solfege", { value: "sol" }], 0, 0, [1]],
                    [3, ["number", { value: 4 }], 0, 0, [1]],
                    [4, "pitch", 0, 0, [1, 5, 6, 7]],
                    [5, ["solfege", { value: "fa" }], 0, 0, [4]],
                    [6, ["number", { value: 4 }], 0, 0, [4]],
                    [7, "pitch", 0, 0, [4, 8, 9, 10]],
                    [8, ["solfege", { value: "mi" }], 0, 0, [7]],
                    [9, ["number", { value: 4 }], 0, 0, [7]],
                    [10, "pitch", 0, 0, [7, 11, 12, 13]],
                    [11, ["solfege", { value: "re" }], 0, 0, [10]],
                    [12, ["number", { value: 4 }], 0, 0, [10]],
                    [13, "pitch", 0, 0, [10, 14, 15, null]],
                    [14, ["solfege", { value: "do" }], 0, 0, [13]],
                    [15, ["number", { value: 4 }], 0, 0, [13]],
                    [16, "hiddennoflow", 0, 0, [0, null]]
                ]);
        }
    }

    class MusicKeyboardBlock extends StackClampBlock {
        constructor() {
            super("musickeyboard");
            this.setPalette("widgets");
            this.beginnerBlock(true);

            if (beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _(
                        "The Music keyboard block opens a piano keyboard that can be used to create notes."
                    ),
                    "documentation",
                    null,
                    "musickeyboardja"
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Music keyboard block opens a piano keyboard that can be used to create notes."
                    ),
                    "documentation",
                    null,
                    "musickeyboard2"
                ]);
            }

            //.TRANS: widget to generate pitches using a slider
            this.formBlock({ name: _("music keyboard"), canCollapse: true });
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (logo.musicKeyboard === null) {
                logo.musicKeyboard = new MusicKeyboard();
            }

            logo.inMusicKeyboard = true;
            logo.musicKeyboard.instruments = [];
            logo.musicKeyboard.noteNames = [];
            logo.musicKeyboard.octaves = [];
            logo.musicKeyboard._rowBlocks = [];

            let listenerName = "_musickeyboard_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.musicKeyboard.init(logo);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    class PitchStaircaseBlock extends StackClampBlock {
        constructor() {
            super("pitchstaircase");
            this.setPalette("widgets");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Pitch staircase tool to is used to generate pitches from a given ratio."
                ),
                "documentation",
                null,
                "pitchstaircase"
            ]);

            //.TRANS: generate a progressive sequence of pitches
            this.formBlock({ name: _("pitch staircase"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, "pitchstaircase", x, y, [null, 1, 4]],
                [1, "pitch", 0, 0, [0, 2, 3, null]],
                [2, ["solfege", { value: "sol" }], 0, 0, [1]],
                [3, ["number", { value: 3 }], 0, 0, [1]],
                [4, "hiddennoflow", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (logo.pitchStaircase === null) {
                logo.pitchStaircase = new PitchStaircase();
            }

            logo.pitchStaircase.Stairs = [];
            logo.pitchStaircase.stairPitchBlocks = [];

            logo.inPitchStaircase = true;

            let listenerName = "_pitchstaircase_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.pitchStaircase.init(logo);
                logo.inPitchStaircase = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class RhythmRuler3Block extends StackClampBlock {
        constructor() {
            super("rhythmruler3");
            this.setPalette("widgets");
            this.setHelpString();
            //.TRANS: widget for subdividing a measure into distinct rhythmic elements
            this.formBlock({ name: _("rhythm maker"), canCollapse: true });
            this.beginnerBlock(true);

            this.makeMacro((x, y) => [
                [0, "rhythmruler2", x, y, [null, 1, 9]],
                [1, "setdrum", 0, 0, [0, 2, 3, 8]],
                [2, ["drumname", { value: "snare drum" }], 0, 0, [1]],
                [3, "rhythm2", 0, 0, [1, 4, 5, null]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, "divide", 0, 0, [3, 6, 7]],
                [6, ["number", { value: 1 }], 0, 0, [5]],
                [7, ["number", { value: 1 }], 0, 0, [5]],
                [8, "hidden", 0, 0, [1, null]],
                [9, "hiddennoflow", 0, 0, [0, null]]
            ]);
            this.hidden = !beginnerMode;
        }
    }

    class RhythmRuler2Block extends StackClampBlock {
        constructor() {
            super("rhythmruler2");
            this.setPalette("widgets");

            this.setHelpString([
                _(
                    "The Rhythm Maker block opens a tool to create drum machines."
                ),
                "documentation",
                null,
                "rhythmruler2"
            ]);

            this.formBlock({ name: _("rhythm maker"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, "rhythmruler2", x, y, [null, 1, 17]],
                [1, "setdrum", 0, 0, [0, 2, 3, 8]],
                [2, ["drumname", { value: "snare drum" }], 0, 0, [1]],
                [3, "rhythm2", 0, 0, [1, 4, 5, null]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, "divide", 0, 0, [3, 6, 7]],
                [6, ["number", { value: 1 }], 0, 0, [5]],
                [7, ["number", { value: 1 }], 0, 0, [5]],
                [8, "hidden", 0, 0, [1, 9]],
                [9, "setdrum", 0, 0, [8, 10, 11, 16]],
                [10, ["drumname", { value: "kick drum" }], 0, 0, [9]],
                [11, "rhythm2", 0, 0, [9, 12, 13, null]],
                [12, ["number", { value: 1 }], 0, 0, [11]],
                [13, "divide", 0, 0, [11, 14, 15]],
                [14, ["number", { value: 1 }], 0, 0, [13]],
                [15, ["number", { value: 1 }], 0, 0, [13]],
                [16, "hidden", 0, 0, [9, null]],
                [17, "hiddennoflow", 0, 0, [0, null]]
            ]);
            this.hidden = beginnerMode;
        }

        flow(args, logo, turtle, blk) {
            if (logo.rhythmRuler == null) {
                logo.rhythmRuler = new RhythmRuler();
            }

            logo.rhythmRuler.Rulers = [];
            logo.rhythmRuler.Drums = [];
            logo.inRhythmRuler = true;

            let listenerName = "_rhythmruler_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.rhythmRuler.init(logo);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class MatrixGMajorBlock extends FlowBlock {
        constructor() {
            super("matrixgmajor", _("G major scale"));
            this.setPalette("widgets");
            this.beginnerBlock(true);

            this.makeMacro((x, y) => [
                [0, ["matrix", { collapsed: false }], x, y, [null, 5, 16]],
                [1, ["solfege", { value: "sol" }], 0, 0, [10]],
                [2, ["number", { value: 5 }], 0, 0, [10]],
                [3, "steppitch", 0, 0, [8, 4, null]],
                [4, ["number", { value: -1 }], 0, 0, [3]],
                [5, "setkey2", 0, 0, [0, 6, 7, 10]],
                [6, ["notename", { value: "G" }], 0, 0, [5]],
                [7, ["modename", { value: "major" }], 0, 0, [5]],
                [8, "repeat", 0, 0, [10, 9, 3, 11]],
                [9, "modelength", 0, 0, [8]],
                [10, "pitch", 0, 0, [5, 1, 2, 8]],
                [11, "rhythm2", 0, 0, [8, 12, 14, null]],
                [12, ["number", { value: 8 }], 0, 0, [11]],
                [13, ["number", { value: 1 }], 0, 0, [14]],
                [14, "divide", 0, 0, [11, 13, 15]],
                [15, ["number", { value: 4 }], 0, 0, [14]],
                [16, "hiddennoflow", 0, 0, [0, null]]
            ]);
        }
    }

    class MatrixCMajorBlock extends FlowBlock {
        constructor() {
            super("matrixcmajor", _("C major scale"));
            this.setPalette("widgets");
            this.beginnerBlock(true);

            this.makeMacro((x, y) => [
                [0, ["matrix", { collapsed: false }], x, y, [null, 5, 16]],
                [1, ["solfege", { value: "do" }], 0, 0, [10]],
                [2, ["number", { value: 5 }], 0, 0, [10]],
                [3, "steppitch", 0, 0, [8, 4, null]],
                [4, ["number", { value: -1 }], 0, 0, [3]],
                [5, "setkey2", 0, 0, [0, 6, 7, 10]],
                [6, ["notename", { value: "C" }], 0, 0, [5]],
                [7, ["modename", { value: "major" }], 0, 0, [5]],
                [8, "repeat", 0, 0, [10, 9, 3, 11]],
                [9, "modelength", 0, 0, [8]],
                [10, "pitch", 0, 0, [5, 1, 2, 8]],
                [11, "rhythm2", 0, 0, [8, 12, 14, null]],
                [12, ["number", { value: 8 }], 0, 0, [11]],
                [13, ["number", { value: 1 }], 0, 0, [14]],
                [14, "divide", 0, 0, [11, 13, 15]],
                [15, ["number", { value: 4 }], 0, 0, [14]],
                [16, "hiddennoflow", 0, 0, [0, null]]
            ]);
        }
    }

    class MatrixBlock extends StackClampBlock {
        constructor() {
            super("matrix");
            this.setPalette("widgets");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Phrase Maker block opens a tool to create musical phrases."
                ),
                "documentation",
                null,
                "matrix"
            ]);

            //.TRANS: assigns pitch to a sequence of beats to generate a melody
            this.formBlock({ name: _("phrase maker"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, "matrix", x, y, [null, 1, 33]],
                [1, "pitch", 0, 0, [0, 2, 3, 4]],
                [2, ["solfege", { value: "ti" }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "pitch", 0, 0, [1, 5, 6, 7]],
                [5, ["solfege", { value: "la" }], 0, 0, [4]],
                [6, ["number", { value: 4 }], 0, 0, [4]],
                [7, "pitch", 0, 0, [4, 8, 9, 10]],
                [8, ["solfege", { value: "sol" }], 0, 0, [7]],
                [9, ["number", { value: 4 }], 0, 0, [7]],
                [10, "pitch", 0, 0, [7, 11, 12, 13]],
                [11, ["solfege", { value: "mi" }], 0, 0, [10]],
                [12, ["number", { value: 4 }], 0, 0, [10]],
                [13, "pitch", 0, 0, [10, 14, 15, 16]],
                [14, ["solfege", { value: "re" }], 0, 0, [13]],
                [15, ["number", { value: 4 }], 0, 0, [13]],
                [16, "playdrum", 0, 0, [13, 17, 18]],
                [17, ["drumname", { value: "snare drum" }], 0, 0, [16]],
                [18, "forward", 0, 0, [16, 19, 20]],
                [19, ["number", { value: 100 }], 0, 0, [18]],
                [20, "right", 0, 0, [18, 21, 22]],
                [21, ["number", { value: 90 }], 0, 0, [20]],
                [22, "rhythm2", 0, 0, [20, 23, 24, 27]],
                [23, ["number", { value: 6 }], 0, 0, [22]],
                [24, "divide", 0, 0, [22, 25, 26]],
                [25, ["number", { value: 1 }], 0, 0, [24]],
                [26, ["number", { value: 4 }], 0, 0, [24]],
                [27, "vspace", 0, 0, [22, 28]],
                [28, "rhythm2", 0, 0, [27, 29, 30, null]],
                [29, ["number", { value: 1 }], 0, 0, [28]],
                [30, "divide", 0, 0, [28, 31, 32]],
                [31, ["number", { value: 1 }], 0, 0, [30]],
                [32, ["number", { value: 2 }], 0, 0, [30]],
                [33, "hiddennoflow", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            logo.inMatrix = true;

            if (logo.pitchTimeMatrix === null) {
                logo.pitchTimeMatrix = new PitchTimeMatrix();
            }

            logo.pitchTimeMatrix._instrumentName = DEFAULTVOICE;

            logo.pitchTimeMatrix.rowLabels = [];
            logo.pitchTimeMatrix.rowArgs = [];
            logo.pitchTimeMatrix.graphicsBlocks = [];
            logo.pitchTimeMatrix.clearBlocks();

            logo.tupletRhythms = [];
            logo.tupletParams = [];
            logo.addingNotesToTuplet = false;

            let listenerName = "_matrix_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                if (
                    logo.tupletRhythms.length === 0 ||
                    logo.pitchTimeMatrix.rowLabels.length === 0
                ) {
                    logo.errorMsg(
                        _(
                            "You must have at least one pitch block and one rhythm block in the matrix."
                        ),
                        blk
                    );
                } else {
                    // Process queued up rhythms.
                    logo.pitchTimeMatrix.blockNo = blk;
                    logo.pitchTimeMatrix.sorted = false;
                    logo.pitchTimeMatrix.init(logo);

                    for (let i = 0; i < logo.tupletRhythms.length; i++) {
                        // We have two cases: (1) notes in a tuplet;
                        // and (2) rhythm block outside of a
                        // tuplet. Rhythm blocks in a tuplet are
                        // converted to notes.
                        switch (logo.tupletRhythms[i][0]) {
                            case "notes":
                            case "simple":
                                let tupletParam = [logo.tupletParams[logo.tupletRhythms[i][1]]];
                                tupletParam.push([]);
                                for (
                                    let j = 2;
                                    j < logo.tupletRhythms[i].length;
                                    j++
                                ) {
                                    tupletParam[1].push(
                                        logo.tupletRhythms[i][j]
                                    );
                                }

                                logo.pitchTimeMatrix.addTuplet(tupletParam);
                                break;
                            default:
                                logo.pitchTimeMatrix.addNotes(
                                    logo.tupletRhythms[i][1],
                                    logo.tupletRhythms[i][2]
                                );
                                break;
                        }
                    }

                    logo.pitchTimeMatrix.makeClickable();
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    class StatusBlock extends StackClampBlock {
        constructor() {
            super("status");
            this.setPalette("widgets");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Status block opens a tool for inspecting the status of Music Blocks as it is running."
                ),
                "documentation",
                null,
                "status"
            ]);

            this.formBlock({ name: _("status"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, "status", x, y, [null,1,11]],
                [1, "hidden", 0, 0, [0,10]],
                [2, "print",  0, 0, [10,3,4]],
                [3, "beatvalue" , 0, 0, [2]],
                [4, "print", 0, 0, [2,5,6]],
                [5, "measurevalue", 0, 0,[4]],
                [6, "print",0,0,[4,7,8]],
                [7, "elapsednotes" , 0 , 0 ,[6]],
                [8, "print",0,0,[6,9,null]],
                [9, "bpmfactor", 0, 0,[8]],
                [10, "print",0 ,0 ,[1,12,2]],
                [11, "hiddennoflow", 0, 0,[0,null]],
                [12, ["outputtools",{"value":"letter class"}], 0, 0,[10,13]],
                [13, "currentpitch", 0, 0,[12]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (logo.statusMatrix === null) {
                logo.statusMatrix = new StatusMatrix();
            }

            logo.statusMatrix.init(logo);
            logo.statusFields = [];

            logo.inStatusMatrix = true;

            let listenerName = "_status_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.statusMatrix.init(logo);
                logo.inStatusMatrix = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    new EnvelopeBlock().setup();
    new FilterBlock().setup();
    new TemperamentBlock().setup();
    new TimbreBlock().setup();
    new MeterWidgetBlock().setup();
    new ModeWidgetBlock().setup();
    new TempoBlock().setup();
    new PitchDrumMatrixBlock().setup();
    new oscilloscopeWidgetBlock().setup();
    new PitchSliderBlock().setup();
    new ChromaticBlock().setup();
    new MusicKeyboard2Block().setup();
    new MusicKeyboardBlock().setup();
    new PitchStaircaseBlock().setup();
    new RhythmRuler3Block().setup();
    new RhythmRuler2Block().setup();
    new MatrixGMajorBlock().setup();
    new MatrixCMajorBlock().setup();
    new MatrixBlock().setup();
    new StatusBlock().setup();
}
