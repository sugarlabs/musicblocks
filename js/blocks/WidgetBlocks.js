// Copyright (c) 2019 Bottersnike
// Copyright (c) 2019-22 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   last, _, FlowBlock, NOINPUTERRORMSG, MeterWidget,
   DEFAULTVOICE, instrumentsEffects, StackClampBlock, Oscilloscope,
   DEFAULTMODE, Tempo, PitchDrumMatrix, PhraseMaker, StatusMatrix,
   RhythmRuler, FILTERTYPES, instrumentsFilters, DEFAULTFILTERTYPE,
   TemperamentWidget, TimbreWidget, ModeWidget, PitchSlider,
   MusicKeyboard, PitchStaircase, SampleWidget, _THIS_IS_MUSIC_BLOCKS_,
   Arpeggio
 */

/*
   Global locations
   - js/utils/utils.js
        _
   - js/logo.js
    NOINPUTERRORMSG
   - js/widgets/meterwidget.js
    MeterWidget
   - js/utils/musicutils.js
    DEFAULTVOICE, DEFAULTMODE, FILTERTYPES, DEFAULTFILTERTYPE
   - js/utils/synthutils.js
    instrumentsEffects, instrumentsFilters
   - js/protoblocks.js
    StackClampBlock
   - js/widgets/oscilloscope.js
    Oscilloscope
   - js/widgets/tempo.js
    Tempo
   - js/widgets/pitchdrummatrix.js
    PitchDrumMatrix
   - js/widgets/phrasemaker.js
    PhraseMaker
   - js/widgets/status.js
    StatusMatrix
   - js/widgets/rhythmruler.js
    RhythmRuler
   - js/widgets/temperament.js
    TemperamentWidget
   - js/widgets/timbre.js
    TimbreWidget
   - js/widgets/modewidget.js
    ModeWidget
   - js/widgets/pitchslider.js
    PitchSlider
   - js/widgets/musickeyboard.js
    MusicKeyboard
   - js/widgets/pitchstaircase.js
    PitchStaircase
 */

/* exported setupWidgetBlocks */

/**
 * @param {string} activity - The activity for which blocks are being set up.
 */
function setupWidgetBlocks(activity) {
    /**
     * Represents a block for controlling sound envelope (ADSR).
     * @extends FlowBlock
     */
    class EnvelopeBlock extends FlowBlock {
        /**
         * Creates an EnvelopeBlock instance.
         */
        constructor() {
            //.TRANS: sound envelope (ADSR)
            super("envelope", _("envelope"));
            this.setPalette("widgets", activity);
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

        /**
         * Handles the flow of data for the sound envelope block.
         * @param {number[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            if (args.length === 4 && typeof args[0] === "number") {
                if (args[0] < 0 || args[0] > 100) {
                    activity.errorMsg(_("Attack value should be from 0 to 100."));
                }
                if (args[1] < 0 || args[1] > 100) {
                    activity.errorMsg(_("Decay value should be from 0 to 100."));
                }
                if (args[2] < 0 || args[2] > 100) {
                    activity.errorMsg(_("Sustain value should be from 0 to 100."));
                }
                if (args[3] < 0 || args[3] > 100) {
                    activity.errorMsg(_("Release value should be from 0-100."));
                }

                // Push envelope values to corresponding arrays
                tur.singer.attack.push(args[0] / 100);
                tur.singer.decay.push(args[1] / 100);
                tur.singer.sustain.push(args[2] / 100);
                tur.singer.release.push(args[3] / 100);
            }

            if (logo.inTimbre) {
                // Update timbre object with envelope values
                logo.timbre.synthVals["envelope"]["attack"] = last(tur.singer.attack);
                logo.timbre.synthVals["envelope"]["decay"] = last(tur.singer.decay);
                logo.timbre.synthVals["envelope"]["sustain"] = last(tur.singer.sustain);
                logo.timbre.synthVals["envelope"]["release"] = last(tur.singer.release);

                if (logo.timbre.env.length != 0) {
                    activity.errorMsg(_("You are adding multiple envelope blocks."));
                } else {
                    // Create the synth for the instrument.
                    logo.synth.createSynth(
                        turtle,
                        logo.timbre.instrumentName,
                        logo.timbre.synthVals["oscillator"]["source"],
                        logo.timbre.synthVals
                    );
                }

                // Push envelope block and values to timbre object
                logo.timbre.env.push(blk);
                logo.timbre.ENVs.push(Math.round(last(tur.singer.attack) * 100));
                logo.timbre.ENVs.push(Math.round(last(tur.singer.decay) * 100));
                logo.timbre.ENVs.push(Math.round(last(tur.singer.sustain) * 100));
                logo.timbre.ENVs.push(Math.round(last(tur.singer.release) * 100));
            }
        }
    }

    /**
     * Represents a block for applying filters to sound.
     * @extends FlowBlock
     */
    class FilterBlock extends FlowBlock {
        /**
         * Creates a FilterBlock instance.
         */
        constructor() {
            //.TRANS: a filter removes some unwanted components from a signal
            super("filter", _("filter"));
            this.setPalette("widgets", activity);
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

        /**
         * Handles the flow of data for the filter block.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         */
        flow(args, logo, turtle, blk) {
            let filtertype = DEFAULTFILTERTYPE;
            let freq;
            let rollOff;

            if (args.length === 3 && typeof args[1] === "number") {
                for (const ftype in FILTERTYPES) {
                    if (FILTERTYPES[ftype][0] === args[0]) {
                        filtertype = FILTERTYPES[ftype][1];
                    } else if (FILTERTYPES[ftype][1] === args[0]) {
                        filtertype = args[0];
                    }
                }

                if ([-12, -24, -48, -96].indexOf(args[1]) === -1) {
                    //.TRANS: rolloff is the steepness of a change in frequency.
                    activity.errorMsg(
                        _("Rolloff value should be either -12, -24, -48, or -96 decibels/octave.")
                    );
                }

                rollOff = args[1];
                freq = args[2];

                if (logo.inTimbre) {
                    if (!(logo.timbre.instrumentName in instrumentsFilters[turtle])) {
                        instrumentsFilters[turtle][logo.timbre.instrumentName] = [];
                    }
                    // Add the filter to the instrument
                    instrumentsFilters[turtle][logo.timbre.instrumentName].push({
                        filterType: filtertype,
                        filterRolloff: rollOff,
                        filterFrequency: freq
                    });

                    logo.timbre.fil.push(blk);
                    logo.timbre.filterParams.push(filtertype);
                    logo.timbre.filterParams.push(rollOff);
                    logo.timbre.filterParams.push(freq);
                }
            }
        }
    }

    /**
     * Represents a block for defining custom tuning (temperament).
     * @extends StackClampBlock
     */
    class TemperamentBlock extends StackClampBlock {
        /**
         * Creates a TemperamentBlock instance.
         */
        constructor() {
            super("temperament");
            this.setPalette("widgets", activity);
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

        /**
         * Handles the flow of data for the temperament block.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         */
        flow(args, logo, turtle, blk) {
            if (logo.temperament === null) {
                logo.temperament = new TemperamentWidget();
            }

            logo.insideTemperament = true;
            logo.temperament.inTemperament = args[0];
            const scale = [];

            if (
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[2]].name ===
                "pitch"
            ) {
                const pitchBlock =
                    activity.blocks.blockList[activity.blocks.blockList[blk].connections[2]];
                const note = activity.blocks.blockList[pitchBlock.connections[1]].value;
                const octave = activity.blocks.blockList[pitchBlock.connections[2]].value;
                const setKey = activity.blocks.blockList[pitchBlock.connections[3]];
                scale[0] = activity.blocks.blockList[setKey.connections[1]].value;
                scale[1] = activity.blocks.blockList[setKey.connections[2]].value;
                logo.synth.startingPitch = note + octave;
                logo.temperament.scale = scale;
            }

            const listenerName = "_temperament_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.temperament.init(activity);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }
    }

    /**
     * Represents a block for sampling audio.
     * @extends StackClampBlock
     */
    class SamplerBlock extends StackClampBlock {
        /**
         * Creates a SamplerBlock instance.
         */
        constructor() {
            super("sampler");
            this.setPalette("widgets", activity);
            this.parameter = true;
            this.beginnerBlock(false);

            this.setHelpString([
                _("Upload a sample and adjust its pitch center."),
                "documentation",
                null,
                "sampler"
            ]);

            //.TRANS: the speed at music is should be played.
            this.formBlock({ name: _("sampler"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, "sampler", x, y, [null, 1, 8]],
                [1, "settimbre", 0, 0, [0, 2, 6, 7]],
                [2, ["customsample", { value: ["", "", "do", 4] }], 0, 0, [1, 3, 4, 5]],
                [3, ["audiofile", { value: null }], 0, 0, [2]],
                [4, ["solfege", { value: "do" }], 0, 0, [2]],
                [5, ["number", { value: 4 }], 0, 0, [2]],
                [6, "vspace", 0, 0, [1, null]],
                [7, "hidden", 0, 0, [1, null]],
                [8, "hiddennoflow", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handles the flow of data for the sampler block.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {number[]} - The output values.
         */
        flow(args, logo, turtle, blk) {
            if (logo.sample === null) {
                logo.sample = new SampleWidget();
            }
            logo.inSample = true;
            logo.sample = new SampleWidget();

            const listenerName = "_sampler_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = event => {
                logo.sample.init(activity);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    /**
     * Represents a block for defining timbre (sound character).
     * @extends StackClampBlock
     */
    class TimbreBlock extends StackClampBlock {
        /**
         * Creates a TimbreBlock instance.
         */
        constructor() {
            super("timbre");
            this.setPalette("widgets", activity);
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

        /**
         * Handles the flow of data for the timbre block.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {number[]} - The output values.
         */
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
                activity.errorMsg(NOINPUTERRORMSG, blk);
            }

            instrumentsEffects[turtle][logo.timbre.instrumentName] = {};
            instrumentsEffects[turtle][logo.timbre.instrumentName]["vibratoActive"] = false;
            instrumentsEffects[turtle][logo.timbre.instrumentName]["distortionActive"] = false;
            instrumentsEffects[turtle][logo.timbre.instrumentName]["tremoloActive"] = false;
            instrumentsEffects[turtle][logo.timbre.instrumentName]["phaserActive"] = false;
            instrumentsEffects[turtle][logo.timbre.instrumentName]["chorusActive"] = false;
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

            const listenerName = "_timbre_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.timbre.init(activity);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    /**
     * Represents a block for setting up Meter Widget in the workspace.
     * @extends StackClampBlock
     */
    class MeterWidgetBlock extends StackClampBlock {
        /**
         * Creates a MeterWidgetBlock instance.
         */
        constructor() {
            super("meterwidget");
            this.setPalette("widgets", activity);
            this.setHelpString([
                _("The Meter block opens a tool to select strong beats for the meter."),
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

        /**
         * Handles the flow of data for the MeterWidgetBlock.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {number[]} - The processed arguments.
         */
        flow(args, logo, turtle, blk) {
            logo.insideMeterWidget = true;

            const listenerName = "_meterwidget_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.meterWidget = new MeterWidget(activity, blk);

                logo.insideMeterWidget = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    /**
     * Represents a block for setting up Oscilloscope Widget in the workspace.
     * @extends StackClampBlock
     */
    class oscilloscopeWidgetBlock extends StackClampBlock {
        /**
         * Creates an OscilloscopeWidgetBlock instance.
         */
        constructor() {
            super("oscilloscope");
            this.setPalette("widgets", activity);
            this.setHelpString([
                _("The oscilloscope block opens a tool to visualize waveforms."),
                "documentation",
                null,
                "oscilloscope"
            ]);
            this.formBlock({ name: _("oscilloscope"), canCollapse: true });
            const addPrintTurtle = (blocks, turtle, prev, last) => {
                const len = blocks.length;
                const next = last ? null : len + 2;
                blocks.push([len, "print", 0, 0, [prev, len + 1, next]]);
                blocks.push([len + 1, ["text", { value: turtle.name }], 0, 0, [len, null]]);
                return blocks;
            };

            this.makeMacro((x, y) => {
                let blocks = [[0, "oscilloscope", x, y, [null, 1, null]]];
                for (const turtle of activity.turtles.turtleList) {
                    if (!turtle.inTrash)
                        // eslint-disable-next-line max-len
                        blocks = addPrintTurtle(
                            blocks,
                            turtle,
                            Math.max(0, blocks.length - 2),
                            turtle == last(activity.turtles.turtleList)
                        );
                }
                blocks[0][4][2] = blocks.length;
                blocks.push([blocks.length, "hiddennoflow", 0, 0, [0, null]]);
                return blocks;
            });
        }

        /**
         * Handles the flow of data for the OscilloscopeWidgetBlock.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {number[]} - The processed arguments.
         */
        flow(args, logo, turtle, blk) {
            logo.oscilloscopeTurtles = [];
            logo.inOscilloscope = true;

            const listenerName = "_oscilloscope_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.Oscilloscope = new Oscilloscope(activity);
                logo.inOscilloscope = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    /**
     * Represents a block for selecting a custom musical mode.
     * @extends StackClampBlock
     */
    class ModeWidgetBlock extends StackClampBlock {
        /**
         * Creates a ModeWidgetBlock instance.
         */
        constructor() {
            super("modewidget");
            this.setPalette("widgets", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Custom mode block opens a tool to explore musical mode (the spacing of the notes in a scale)."),
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

        /**
         * Handles the flow of data for the ModeWidget block.
         * @param {number[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {number[]} - The output values.
         */
        flow(args, logo, turtle, blk) {
            logo.insideModeWidget = true;

            const listenerName = "_modewidget_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.modeWidget = new ModeWidget(activity);
                logo.insideModeWidget = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    /**
     * Represents a block for setting the tempo.
     * @extends StackClampBlock
     */
    class TempoBlock extends StackClampBlock {
        /**
         * Creates a TempoBlock instance.
         */
        constructor() {
            super("tempo");
            this.setPalette("widgets", activity);
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

        /**
         * Handles the flow of data for the Tempo block.
         * @param {number[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {number[]} - The output values.
         */
        flow(args, logo, turtle, blk) {
            if (logo.tempo === null) {
                logo.tempo = new Tempo();
            }

            logo.inTempo = true;
            logo.tempo.BPMBlocks = [];
            logo.tempo.BPMs = [];

            const listenerName = "_tempo_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.tempo.init(activity);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    /**
     * Represents a block for composing chord sequences using the Arpeggio Widget.
     * @extends StackClampBlock
     */
    class ArpeggioMatrixBlock extends StackClampBlock {
        /**
         * Creates an ArpeggioMatrixBlock instance.
         */
        constructor() {
            super("arpeggiomatrix");
            this.setPalette("widgets", activity);
            this.setHelpString([
                _("The Arpeggio Widget is used to compose chord sequences."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("arpeggio"),
                canCollapse: true,
                args: 1,
                defaults: [4]
            });

            this.makeMacro((x, y) => [
                [0, "arpeggiomatrix", x, y, [null, 1, 3, 2]],
                [1, ["number", { value: 4 }], 0, 0, [0]],
                [2, "hiddennoflow", 0, 0, [0, null]],
                [3, "newnote", 0, 0, [0, 4, 7, null]],
                [4, "divide", 0, 0, [3, 5, 6]],
                [5, ["number", { value: 1 }], 0, 0, [4]],
                [6, ["number", { value: 16 }], 0, 0, [4]],
                [7, "vspace", 0, 0, [3, 8]],
                [8, "pitch", 0, 0, [7, 9, 10, null]],
                [9, ["solfege", { value: "do" }], 0, 0, [8]],
                [10, ["number", { value: 4 }], 0, 0, [8]]
            ]);
        }

        /**
         * Handles the flow of data for the ArpeggioMatrix block.
         * @param {number[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {number[]} - The output values.
         */
        flow(args, logo, turtle, blk) {
            if (logo.arpeggio === null) {
                logo.arpeggio = new Arpeggio();
            }

            logo.inArpeggio = true;

            if (args.length > 0) {
                if (args[0] > 1 && args[0] < 21) {
                    logo.arpeggio.defaultCols = args[0];
                }
            }

            logo.arpeggio.notesToPlay = [];

            const listenerName = "_arpeggio_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.arpeggio.init(activity);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    /**
     * Represents a block for mapping pitches to drum sounds using a matrix.
     * @extends StackClampBlock
     */
    class PitchDrumMatrixBlock extends StackClampBlock {
        /**
         * Creates a PitchDrumMatrixBlock instance.
         */
        constructor() {
            super("pitchdrummatrix");
            this.setPalette("widgets", activity);
            this.setHelpString([
                _("The Pitch drum matrix is used to map pitches to drum sounds."),
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

        /**
         * Handles the flow of data for the pitch drum matrix block.
         * @param {array} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         */
        flow(args, logo, turtle, blk) {
            if (logo.pitchDrumMatrix === null) {
                logo.pitchDrumMatrix = new PitchDrumMatrix();
            }

            logo.inPitchDrumMatrix = true;
            logo.pitchDrumMatrix.rowLabels = [];
            logo.pitchDrumMatrix.rowArgs = [];
            logo.pitchDrumMatrix.drums = [];
            logo.pitchDrumMatrix.clearBlocks();

            const listenerName = "_pitchdrummatrix_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                if (
                    logo.pitchDrumMatrix.drums.length === 0 ||
                    logo.pitchDrumMatrix.rowLabels.length === 0
                ) {
                    activity.errorMsg(
                        _("You must have at least one pitch block and one drum block in the matrix."),
                        blk
                    );
                } else {
                    // Process queued up rhythms.
                    logo.pitchDrumMatrix.init(activity);
                    logo.pitchDrumMatrix.makeClickable();
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    /**
     * Represents a block for generating pitches at selected frequencies using a slider.
     * @extends StackClampBlock
     */
    class PitchSliderBlock extends StackClampBlock {
        /**
         * Creates a PitchSliderBlock instance.
         */
        constructor() {
            super("pitchslider");
            this.setPalette("widgets", activity);
            this.beginnerBlock(true);
            this.setHelpString([
                _("The Pitch slider tool to is used to generate pitches at selected frequencies."),
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

        /**
         * Handles the flow of data for the pitch slider block.
         * @param {array} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {array} - The output array.
         */
        flow(args, logo, turtle, blk) {
            if (logo.pitchSlider === null) {
                logo.pitchSlider = new PitchSlider();
            }

            logo.inPitchSlider = true;
            logo.pitchSlider.frequencies = [];

            const listenerName = "_pitchslider_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.pitchSlider.init(activity);
                logo.inPitchSlider = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    /**
     * Represents a block for controlling a chromatic keyboard.
     * @extends StackClampBlock
     */
    class ChromaticBlock extends StackClampBlock {
        /**
         * Creates a ChromaticBlock instance.
         */
        constructor() {
            super("chromatic");
            this.setPalette("widgets", activity);
            this.setHelpString();
            this.formBlock({
                name: _("chromatic keyboard"),
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, ["musickeyboard", { collapsed: false }], x, y, [null, 2, 1]],
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
        }

        flow() {}
    }

    /**
     * Represents a block for controlling a music keyboard.
     * @extends StackClampBlock
     */
    class MusicKeyboard2Block extends StackClampBlock {
        /**
         * Creates a MusicKeyboard2Block instance.
         */
        constructor() {
            super("musickeyboard2");
            this.setPalette("widgets", activity);
            this.setHelpString();
            this.formBlock({ name: _("music keyboard"), canCollapse: true });
            this.beginnerBlock(this.lang !== "ja");
            this.makeMacro((x, y) => [
                [0, "setbpm3", 0, 0, [12, 1, 2, 5]],
                [1, ["number", { value: 90 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, 6]],
                [6, "meter", 0, 0, [5, 7, 8, 11]],
                [7, ["number", { value: 4 }], 0, 0, [6]],
                [8, "divide", 0, 0, [6, 9, 10]],
                [9, ["number", { value: 1 }], 0, 0, [8]],
                [10, ["number", { value: 4 }], 0, 0, [8]],
                [11, "vspace", 0, 0, [6, 13]],
                [12, ["musickeyboard", { collapsed: false }], x, y, [null, 0, 28]],
                [13, "pitch", 0, 0, [11, 14, 15, 16]],
                [14, ["solfege", { value: "sol" }], 0, 0, [13]],
                [15, ["number", { value: 4 }], 0, 0, [13]],
                [16, "pitch", 0, 0, [13, 17, 18, 19]],
                [17, ["solfege", { value: "fa" }], 0, 0, [16]],
                [18, ["number", { value: 4 }], 0, 0, [16]],
                [19, "pitch", 0, 0, [16, 20, 21, 22]],
                [20, ["solfege", { value: "mi" }], 0, 0, [19]],
                [21, ["number", { value: 4 }], 0, 0, [19]],
                [22, "pitch", 0, 0, [19, 23, 24, 25]],
                [23, ["solfege", { value: "re" }], 0, 0, [22]],
                [24, ["number", { value: 4 }], 0, 0, [22]],
                [25, "pitch", 0, 0, [22, 26, 27, null]],
                [26, ["solfege", { value: "do" }], 0, 0, [25]],
                [27, ["number", { value: 4 }], 0, 0, [25]],
                [28, "hiddennoflow", 0, 0, [12, null]]
            ]);
        }
    }

    /**
     * Represents a block for creating a music keyboard.
     * @extends StackClampBlock
     */
    class MusicKeyboardBlock extends StackClampBlock {
        /**
         * Creates a MusicKeyboardBlock instance.
         */
        constructor() {
            super("musickeyboard");
            this.setPalette("widgets", activity);
            this.beginnerBlock(true);

            if (activity.beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _("The Music keyboard block opens a piano keyboard that can be used to create notes."),
                    "documentation",
                    null,
                    "musickeyboardja"
                ]);
            } else {
                this.setHelpString([
                    _("The Music keyboard block opens a piano keyboard that can be used to create notes."),
                    "documentation",
                    null,
                    "musickeyboard2"
                ]);
            }

            //.TRANS: widget to generate pitches using a slider
            this.formBlock({ name: _("music keyboard"), canCollapse: true });
            this.hidden = true;
        }

        /**
         * Handles the flow of data for the music keyboard block.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {any[]} - Returns an array of arguments.
         */
        flow(args, logo, turtle, blk) {
            if (logo.musicKeyboard === null) {
                logo.musicKeyboard = new MusicKeyboard(activity);
            }

            logo.inMusicKeyboard = true;
            logo.musicKeyboard.blockNo = blk;
            logo.musicKeyboard.instruments = [];
            logo.musicKeyboard.noteNames = [];
            logo.musicKeyboard.octaves = [];
            logo.musicKeyboard._rowBlocks = [];

            const listenerName = "_musickeyboard_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.musicKeyboard.init(logo);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    /**
     * Represents a block for generating pitches using a staircase pattern.
     * @extends StackClampBlock
     */
    class PitchStaircaseBlock extends StackClampBlock {
        /**
         * Creates a PitchStaircaseBlock instance.
         */
        constructor() {
            super("pitchstaircase");
            this.setPalette("widgets", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Pitch staircase tool to is used to generate pitches from a given ratio."),
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

        /**
         * Handles the flow of data for the pitch staircase block.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {any[]} - Returns an array of arguments.
         */
        flow(args, logo, turtle, blk) {
            if (logo.pitchStaircase === null) {
                logo.pitchStaircase = new PitchStaircase();
            }

            logo.pitchStaircase.Stairs = [];
            logo.pitchStaircase.stairPitchBlocks = [];

            logo.inPitchStaircase = true;

            const listenerName = "_pitchstaircase_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.pitchStaircase.init(activity);
                logo.inPitchStaircase = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    /**
     * Represents a block for subdividing a measure into distinct rhythmic elements.
     * @extends StackClampBlock
     */
    class RhythmRuler3Block extends StackClampBlock {
        /**
         * Creates a RhythmRuler3Block instance.
         */
        constructor() {
            super("rhythmruler3");
            this.setPalette("widgets", activity);
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
            this.hidden = !activity.beginnerMode;
        }
    }

    /**
     * Represents a block for creating drum machines.
     * @extends StackClampBlock
     */
    class RhythmRuler2Block extends StackClampBlock {
        /**
         * Creates a RhythmRuler2Block instance.
         */
        constructor() {
            super("rhythmruler2");
            this.setPalette("widgets", activity);

            this.setHelpString([
                _("The Rhythm Maker block opens a tool to create drum machines."),
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
            this.hidden = activity.beginnerMode;
        }

        /**
         * Handles the flow of data for the rhythm ruler block.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         * @returns {any[]} - Returns an array of arguments.
         */
        flow(args, logo, turtle, blk) {
            if (logo.rhythmRuler == null) {
                logo.rhythmRuler = new RhythmRuler();
            }

            logo.rhythmRuler.Rulers = [];
            logo.rhythmRuler.Drums = [];
            logo.inRhythmRuler = true;

            const listenerName = "_rhythmruler_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.rhythmRuler.init(activity);
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    /**
     * Represents a block for generating a G major scale matrix.
     * @extends FlowBlock
     */
    class MatrixGMajorBlock extends FlowBlock {
        /**
         * Creates a MatrixGMajorBlock instance.
         */
        constructor() {
            super("matrixgmajor", _("G major scale"));
            this.setPalette("widgets", activity);
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

    /**
     * Represents a block for generating the C major scale matrix.
     * @extends FlowBlock
     */
    class MatrixCMajorBlock extends FlowBlock {
        /**
         * Creates a MatrixCMajorBlock instance.
         */
        constructor() {
            super("matrixcmajor", _("C major scale"));
            this.setPalette("widgets", activity);
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

    /**
     * Represents a block for generating a musical phrase matrix.
     * @extends StackClampBlock
     */
    class MatrixBlock extends StackClampBlock {
        /**
         * Creates a MatrixBlock instance.
         */
        constructor() {
            super("matrix");
            this.setPalette("widgets", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Phrase Maker block opens a tool to create musical phrases."),
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

        /**
         * Handles the flow of data for the matrix block.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         */
        flow(args, logo, turtle, blk) {
            logo.inMatrix = true;

            if (logo.phraseMaker === null) {
                logo.phraseMaker = new PhraseMaker();
            }
            logo.phraseMaker.blockNo = blk;

            logo.phraseMaker._instrumentName = DEFAULTVOICE;

            logo.phraseMaker.rowLabels = [];
            logo.phraseMaker.rowArgs = [];
            logo.phraseMaker.graphicsBlocks = [];
            logo.phraseMaker.clearBlocks();

            logo.tupletRhythms = [];
            logo.tupletParams = [];
            logo.addingNotesToTuplet = false;

            const listenerName = "_matrix_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                if (logo.tupletRhythms.length === 0 || logo.phraseMaker.rowLabels.length === 0) {
                    activity.errorMsg(
                        _("You must have at least one pitch block and one rhythm block in the matrix."),
                        blk
                    );
                } else {
                    // Process queued up rhythms.
                    logo.phraseMaker.blockNo = blk;
                    logo.phraseMaker.sorted = false;
                    logo.phraseMaker.init(activity);

                    for (let i = 0; i < logo.tupletRhythms.length; i++) {
                        // We have two cases: (1) notes in a tuplet;
                        // and (2) rhythm block outside of a
                        // tuplet. Rhythm blocks in a tuplet are
                        // converted to notes.
                        switch (logo.tupletRhythms[i][0]) {
                            case "notes":
                            case "simple":
                                // eslint-disable-next-line no-case-declarations
                                const tupletParam = [logo.tupletParams[logo.tupletRhythms[i][1]]];
                                tupletParam.push([]);
                                for (let j = 2; j < logo.tupletRhythms[i].length; j++) {
                                    tupletParam[1].push(logo.tupletRhythms[i][j]);
                                }

                                logo.phraseMaker.addTuplet(tupletParam);
                                break;
                            default:
                                logo.phraseMaker.addNotes(
                                    logo.tupletRhythms[i][1],
                                    logo.tupletRhythms[i][2]
                                );
                                break;
                        }
                    }

                    logo.phraseMaker.makeClickable();
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    /**
     * Represents a block for inspecting the status of Music Blocks during execution.
     * @extends StackClampBlock
     */
    class StatusBlock extends StackClampBlock {
        /**
         * Creates a StatusBlock instance.
         */
        constructor() {
            super("status");
            this.setPalette("widgets", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Status block opens a tool for inspecting the status of Music Blocks as it is running."),
                "documentation",
                null,
                "status"
            ]);

            this.formBlock({ name: _("status"), canCollapse: true });
            this.makeMacro((x, y) => [
                [0, "status", x, y, [null, 1, 11]],
                [1, "hidden", 0, 0, [0, 10]],
                [2, "print", 0, 0, [10, 3, 4]],
                [3, "beatvalue", 0, 0, [2]],
                [4, "print", 0, 0, [2, 5, 6]],
                [5, "measurevalue", 0, 0, [4]],
                [6, "print", 0, 0, [4, 7, 8]],
                [7, "elapsednotes", 0, 0, [6]],
                [8, "print", 0, 0, [6, 9, null]],
                [9, "bpmfactor", 0, 0, [8]],
                [10, "print", 0, 0, [1, 12, 2]],
                [11, "hiddennoflow", 0, 0, [0, null]],
                [12, ["outputtools", { value: "letter class" }], 0, 0, [10, 13]],
                [13, "currentpitch", 0, 0, [12]]
            ]);
        }

        /**
         * Handles the flow of data for the status block.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {object} blk - The block object.
         */
        flow(args, logo, turtle, blk) {
            if (logo.statusMatrix === null) {
                logo.statusMatrix = new StatusMatrix();
            }

            logo.statusMatrix.init(activity);
            logo.statusFields = [];

            logo.inStatusMatrix = true;

            const listenerName = "_status_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __listener = () => {
                logo.statusMatrix.init(activity);
                logo.inStatusMatrix = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            if (args.length === 1) return [args[0], 1];
        }
    }

    // Set up blocks if this is Music Blocks environment
    if (_THIS_IS_MUSIC_BLOCKS_) {
        new EnvelopeBlock().setup(activity);
        new FilterBlock().setup(activity);
        new TemperamentBlock().setup(activity);
        new TimbreBlock().setup(activity);
        new MeterWidgetBlock().setup(activity);
        new ModeWidgetBlock().setup(activity);
        new TempoBlock().setup(activity);
        new SamplerBlock().setup(activity);
        new ArpeggioMatrixBlock().setup(activity);
        new PitchDrumMatrixBlock().setup(activity);
        new oscilloscopeWidgetBlock().setup(activity);
        new PitchSliderBlock().setup(activity);
        new ChromaticBlock().setup(activity);
        new MusicKeyboard2Block().setup(activity);
        new MusicKeyboardBlock().setup(activity);
        new PitchStaircaseBlock().setup(activity);
        new RhythmRuler3Block().setup(activity);
        new RhythmRuler2Block().setup(activity);
        new MatrixGMajorBlock().setup(activity);
        new MatrixCMajorBlock().setup(activity);
        new MatrixBlock().setup(activity);
    }
    // Instantiate and set up the StatusBlock
    new StatusBlock().setup(activity);
}
