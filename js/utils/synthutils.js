// Copyright (c) 2016-17 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

var VOICENAMES = [
    //.TRANS: musical instrument
    [_('violin'), 'violin', 'images/voices.svg'],
    //.TRANS: musical instrument
    [_('cello'), 'cello', 'images/voices.svg'],
    //.TRANS: musical instrument
    // [_('bass'), 'basse', 'images/voices.svg'],
    //.TRANS: musical instrument
    [_('guitar'), 'guitar', 'images/voices.svg'],
    //.TRANS: musical instrument
    [_('flute'), 'flute', 'images/voices.svg'],
    //.TRANS: polytone synthesizer
    [_('default'), 'default', 'images/synth.svg'],
    //.TRANS: simple monotone synthesizer
    [_('simple 1'), 'mono1', 'images/synth.svg'],
    //.TRANS: simple monotone synthesizer
    [_('simple 2'), 'mono2', 'images/synth.svg'],
    //.TRANS: simple monotone synthesizer
    [_('simple 3'), 'mono3', 'images/synth.svg'],
    //.TRANS: simple monotone synthesizer
    [_('simple 4'), 'mono4', 'images/synth.svg'],
    //.TRANS: white noise synthesizer
    [_('white noise'), 'noise1', 'images/synth.svg'],
    //.TRANS: brown noise synthesizer
    [_('brown noise'), 'noise2', 'images/synth.svg'],
    //.TRANS: pink noise synthesizer
    [_('pink noise'), 'noise3', 'images/synth.svg'],
    //.TRANS: sine wave
    [_('sine'), 'sine', 'images/synth.svg'],
    //.TRANS: square wave
    [_('square'), 'square', 'images/synth.svg'],
    //.TRANS: sawtooth wave
    [_('sawtooth'), 'sawtooth', 'images/synth.svg'],
    //.TRANS: triangle wave
    [_('triangle'), 'triangle', 'images/synth.svg'],
    //.TRANS: customize voice
    [_('custom'), 'custom', 'images/synth.svg'],
];

var DRUMNAMES = [
    //.TRANS: musical instrument
    [_('snare drum'), 'snare drum', 'images/snaredrum.svg'],
    //.TRANS: musical instrument
    [_('kick drum'), 'kick drum', 'images/kick.svg'],
    //.TRANS: musical instrument
    [_('tom tom'), 'tom tom', 'images/tom.svg'],
    //.TRANS: musical instrument
    [_('floor tom tom'), 'floor tom tom', 'images/floortom.svg'],
    //.TRANS: a drum made from an inverted cup
    [_('cup drum'), 'cup drum', 'images/cup.svg'],
    //.TRANS: musical instrument
    [_('darbuka drum'), 'darbuka drum', 'images/darbuka.svg'],
    //.TRANS: musical instrument
    [_('hi hat'), 'hi hat', 'images/hihat.svg'],
    //.TRANS: a small metal bell
    [_('ride bell'), 'ride bell', 'images/ridebell.svg'],
    //.TRANS: musical instrument
    [_('cow bell'), 'cow bell', 'images/cowbell.svg'],
    //.TRANS: musical instrument
    [_('triangle bell'), 'triangle bell', 'images/trianglebell.svg'],
    //.TRANS: musical instrument
    [_('finger cymbals'), 'finger cymbals', 'images/fingercymbals.svg'],
    //.TRANS: a musically tuned set of bells
    [_('chime'), 'chine', 'images/chine.svg'],
    //.TRANS: sound effect
    [_('clang'), 'clang', 'images/clang.svg'],
    //.TRANS: sound effect
    [_('crash'), 'crash', 'images/crash.svg'],
    //.TRANS: sound effect
    [_('bottle'), 'bottle', 'images/bottle.svg'],
    //.TRANS: sound effect
    [_('clap'), 'clap', 'images/clap.svg'],
    //.TRANS: sound effect
    [_('slap'), 'slap', 'images/slap.svg'],
    //.TRANS: sound effect
    [_('splash'), 'splash', 'images/splash.svg'],
    //.TRANS: sound effect
    [_('bubbles'), 'bubbles', 'images/bubbles.svg'],
    //.TRANS: animal sound effect
    [_('cat'), 'cat', 'images/cat.svg'],
    //.TRANS: animal sound effect
    [_('cricket'), 'cricket', 'images/cricket.svg'],
    //.TRANS: animal sound effect
    [_('dog'), 'dog', 'images/dog.svg'],
    //.TRANS: animal sound effect
    [_('duck'), 'duck', 'images/duck.svg'],
];

// The sample has a pitch which is subsequently transposed.
// This number is that starting pitch number. Reference function pitchToNumber
const SAMPLECENTERNO = {
  'violin': 51,
  'cello': 39,
  'basse': 15,
  'guitar': 39,
  'flute': 57
};


// Validate the passed on parameters in a function as per the default
// parameters values
function validateAndSetParams(defaultParams, params) {
    if (defaultParams && (defaultParams !== null) && params && (params !== undefined)) {
        for (var key in defaultParams) {
            if (key in params && params[key] !== undefined)
                defaultParams[key] = params[key];
        }
    }

    return defaultParams;
};

// This object contains mapping between instrument name and
// corresponding synth object.  The instrument name is the one that
// the user sets in the "Timbre" clamp and uses in the "Set Timbre"
// clamp

var instruments = {};

// This object contains mapping between instrument name and its source
// - (0->default, 1->drum, 2->voice, 3->builtin)
// e.g. instrumentsSource['kick drum'] = [1, 'kick drum']

var instrumentsSource = {};

// Effects associated with instruments in the timbre widget

var instrumentsEffects = {};

// Filters associated with instruments in the timbre widget

var instrumentsFilters = {};


function Synth() {
    // Isolate synth functions here.

    const BUILTIN_SYNTHS = {
        'sine': 1,
        'triangle': 1,
        'sawtooth': 1,
        'square': 1,
        'pluck': 1,
        'noise1': 1,
        'noise2': 1,
        'noise3': 1,
        'poly': 1,
        'mono1': 1,
        'mono2': 1,
        'mono3': 1,
        'mono4': 1,
        'custom': 1,
    };

    const CUSTOM_SYNTHS = {
        'amsynth': 1,
        'fmsynth': 1,
        'duosynth': 1,
    };

    // Using Tone.js
    this.tone = new Tone();

    Tone.Buffer.onload = function () {
        console.log('sample loaded');
    };

    this.samples = null;
    this.samplesuffix = "_SAMPLE";

    this.loadSamples = function (){
        this.samples = {};
        for (var type in SAMPLES_MANIFEST) {
            if (SAMPLES_MANIFEST.hasOwnProperty(type)) {
                this.samples[type] = {};
                for (var sample in SAMPLES_MANIFEST[type]){
                    if (SAMPLES_MANIFEST[type].hasOwnProperty(sample)){
                        var data = eval(SAMPLES_MANIFEST[type][sample].data_name.toUpperCase()+this.samplesuffix);
                        var name = SAMPLES_MANIFEST[type][sample].name;
                        this.samples[type][name] = data;
                    }
                }
            }
        }
    }
    var t = this;
    require(SOUNDSAMPLESDEFINES, function(){
        t.loadSamples();
    });

    this.recorder = new Recorder(Tone.Master);

    this.download = function (blob){
        var filename = prompt('Filename:', 'untitled.wav');
        if (fileExt(filename) !== 'wav') {
            filename += '.wav';
        }
        download(filename, URL.createObjectURL(blob));
    }

    // Function that provides default parameters for various synths
    this.getDefaultParamValues = function (sourceName) {
        // sourceName may need to be 'untranslated'
        var sourceNameLC = sourceName.toLowerCase();
        if (getOscillatorTypes(sourceNameLC) != null) {
            sourceNameLC = getOscillatorTypes(sourceNameLC);
        }

        switch(sourceNameLC) {
        case 'amsynth':
            var synthOptions = {
                'harmonicity': 3,
                'detune': 0,
                'envelope': {
                    'attack': 0.01,
                    'decay': 0.01,
                    'sustain': 1,
                    'release': 0.5
                },
                'modulation': {
                    'type': 'square'
                },
                'modulationEnvelope': {
                    'attack': 0.5,
                    'decay': 0,
                    'sustain': 1,
                    'release': 0.5
                }
            };
            break;
        case'fmsynth':
            var synthOptions = {
                'harmonicity': 3,
                'modulationIndex': 10,
                'detune': 0,
                'envelope': {
                    'attack': 0.01,
                    'decay': 0.01,
                    'sustain': 1,
                    'release': 0.5
                },
                'modulation': {
                    'type': 'square'
                },
                'modulationEnvelope': {
                    'attack': 0.5,
                    'decay': 0.0,
                    'sustain': 1,
                    'release': 0.5
                }
            };
            break;
        case 'noise1':
            var synthOptions = {
                'noise': {
                    'type': 'white'
                },
                'envelope': {
                    'attack': 0.005 ,
                    'decay': 0.1 ,
                    'sustain': 1
                }
            };
            break;
        case 'noise2':
            var synthOptions = {
                'noise': {
                    'type': 'brown'
                },
                'envelope': {
                    'attack': 0.005 ,
                    'decay': 0.1 ,
                    'sustain': 1
                }
            };
            break;
        case 'noise3':
            var synthOptions = {
                'noise': {
                    'type': 'pink'
                },
                'envelope': {
                    'attack': 0.005 ,
                    'decay': 0.1 ,
                    'sustain': 1
                }
            };
            break;
        case 'mono1':
        case 'mono2':
        case 'mono3':
        case 'mono4':
            var synthOptions = {
                'oscillator': {
                    'type': 'sine'
                },
                'envelope': {
                    'attack': 0.03,
                    'decay': 0,
                    'sustain': 1,
                    'release': 0.03
                },
            };
            break;
        case 'duosynth':
            var synthOptions = {
                'vibratoAmount': 0.5,
                'vibratoRate': 5,
                'harmonicity': 1.5,
                'voice0': {
                    'volume': -10,
                    'portamento': 0,
                    'oscillator': {
                        'type': 'sine'
                    },
                    'filterEnvelope': {
                        'attack': 0.01,
                        'decay': 0.0,
                        'sustain': 1,
                        'release': 0.5
                    },
                    'envelope': {
                        'attack': 0.01,
                        'decay': 0.0,
                        'sustain': 1,
                        'release': 0.5
                    }
                },
                'voice1': {
                    'volume': -10,
                    'portamento': 0,
                    'oscillator': {
                        'type': 'sine'
                    },
                    'filterEnvelope': {
                        'attack': 0.01,
                        'decay': 0.0,
                        'sustain': 1,
                        'release': 0.5
                    },
                    'envelope': {
                        'attack': 0.01,
                        'decay': 0.0,
                        'sustain': 1,
                        'release': 0.5
                    }
                }
            };
            break;
        case 'sine':
        case 'triangle':
        case 'square':
        case 'sawtooth':
            var synthOptions = {
                'oscillator': {
                    'type': sourceNameLC
                },
                'envelope': {
                    'attack': 0.03,
                    'decay': 0,
                    'sustain': 1,
                    'release': 0.03
                },
            };
            break;
        case 'pluck':
             var synthOptions = {
                'attackNoise': 1,
                'dampening': 4000,
                'resonance': 0.9
            };
            break;
        case 'poly':
            var synthOptions = {
                polyphony: 6
            };
            break;
        default:
            var synthOptions = {};
            break;
        }

        return synthOptions;
    };

    // Poly synth will be loaded as the default synth.
    this.createDefaultSynth = function () {
        console.log('poly (default) (custom)');
        var default_synth = new Tone.PolySynth(6, Tone.AMSynth).toMaster();
        instruments['default'] = default_synth;
        instrumentsSource['default'] = [0, 'default'];
        instruments['custom'] = default_synth;
        instrumentsSource['custom'] = [0, 'custom'];
    };

    // Function reponsible for creating the synth using the existing
    // samples: drums and voices
    this._createSampleSynth = function (instrumentName, sourceName, params) {
        if (sourceName in this.samples.voice) {
            instrumentsSource[instrumentName] = [2, sourceName];
            console.log(sourceName);
            var tempSynth = new Tone.Sampler(this.samples.voice[sourceName]);
        }
        else if (sourceName in this.samples.drum) {
            instrumentsSource[instrumentName] = [1, sourceName];
            console.log(sourceName);
            var tempSynth = new Tone.Sampler(this.samples.drum[sourceName]);
        }
        else {
            // default drum sample
            instrumentsSource[instrumentName] = [1, 'drum'];
            console.log(DEFAULTDRUM);
            var tempSynth = new Tone.Sampler(this.samples.drum[DEFAULTDRUM]);
        }

        return tempSynth;
    };

    // Function using builtin synths from Tone.js
    this._createBuiltinSynth = function (instrumentName, sourceName, params) {
        if (sourceName in BUILTIN_SYNTHS) {
            var synthOptions = this.getDefaultParamValues(sourceName);
            synthOptions = validateAndSetParams(synthOptions, params);
        }

        switch (sourceName) {
        case 'mono1':
        case 'mono2':
        case 'mono3':
        case 'mono4':
            instrumentsSource[instrumentName] = [3, sourceName];
            console.log(sourceName);
            var builtin_synth = new Tone.Synth(synthOptions);
            break;
        case 'sine':
        case 'triangle':
        case 'square':
        case 'sawtooth':
            instrumentsSource[instrumentName] = [3, sourceName];
            console.log(sourceName);
            var builtin_synth = new Tone.Synth(synthOptions);
            break;
        case 'pluck':
            instrumentsSource[instrumentName] = [3, sourceName];
            console.log(sourceName);
            var builtin_synth = new Tone.PluckSynth(synthOptions);
            break;
        case 'poly':
            instrumentsSource[instrumentName] = [0, 'poly'];
            console.log('poly');
            var builtin_synth = new Tone.PolySynth(synthOptions.polyphony, Tone.AMSynth);
            break;
        case 'noise1':
        case 'noise2':
        case 'noise3':
            instrumentsSource[instrumentName] = [4, sourceName];
            console.log(sourceName);
            var builtin_synth = new Tone.NoiseSynth(synthOptions);
            break;
        default:
            instrumentsSource[instrumentName] = [0, 'poly'];
            console.log('poly (default)');
            var builtin_synth = new Tone.PolySynth(6, Tone.AMSynth);
            break;
        }

        return builtin_synth;
    };


    // Function reponsible for creating the custom synth using the
    // Tonejs methods like AMSynth, FMSynth, etc.
    this._createCustomSynth = function (sourceName, params) {
        // Getting parameters for custom synth
        var synthOptions = this.getDefaultParamValues(sourceName);
        synthOptions = validateAndSetParams(synthOptions, params);

        if (sourceName.toLowerCase() === 'amsynth') {
            var tempSynth = new Tone.AMSynth(synthOptions);
        } else if (sourceName.toLowerCase() === 'fmsynth') {
            var tempSynth = new Tone.FMSynth(synthOptions);
        } else if (sourceName.toLowerCase() === 'duosynth') {
            var tempSynth = new Tone.DuoSynth(synthOptions);
        } else {
            var tempSynth = new Tone.PolySynth(6, Tone.AMSynth);
        }

        return tempSynth;
    };

    // Create the synth as per the user's input in the 'Timbre' clamp.
    this.createSynth = function (instrumentName, sourceName, params) {
        if ((sourceName in this.samples.voice) || (sourceName in this.samples.drum)) {
            instruments[instrumentName] = this._createSampleSynth(instrumentName, sourceName, null).toMaster();
        } else if (sourceName in BUILTIN_SYNTHS) {
            instruments[instrumentName] = this._createBuiltinSynth(instrumentName, sourceName, params).toMaster();
        } else if (sourceName in CUSTOM_SYNTHS) {
            instruments[instrumentName] = this._createCustomSynth(sourceName, params).toMaster();
            instrumentsSource[instrumentName] = [0, 'poly'];
        } else {
            if (sourceName.length >= 4) {
                if (sourceName.slice(0, 4) === 'http') {
                    instruments[sourceName] = new Tone.Sampler(sourceName).toMaster();
                    instrumentsSource[instrumentName] = [1, 'drum'];
                } else if (sourceName.slice(0, 4) === 'file') {
                    instruments[sourceName] = new Tone.Sampler(sourceName).toMaster();
                    instrumentsSource[instrumentName] = [1, 'drum'];
                } else if (sourceName === 'drum') {
                    instruments[sourceName] = this._createSampleSynth(sourceName, sourceName, null).toMaster();
                    instrumentsSource[instrumentName] = [1, 'drum'];
                }
            }
        }
    };

    this.loadSynth = function (sourceName) {
        if (instruments[sourceName] == null) {
            console.log('loading ' + sourceName);
            this.createSynth(sourceName, sourceName, null);
        }

        if (sourceName in instruments) {
            return instruments[sourceName].toMaster();
        }

        return null;
    }

    this.performNotes = function (synth, notes, beatValue, paramsEffects, paramsFilters) {
        if (paramsEffects == null && paramsFilters == null) {
            synth.triggerAttackRelease(notes, beatValue);
        } else {
            if (paramsFilters != null && paramsFilters != undefined) {
                var numFilters = paramsFilters.length;  // no. of filters
                var k = 0;
                var temp_filters = [];

                for (k = 0; k < numFilters; k++) {
                    // filter rolloff has to be added
                    var filterVal = new Tone.Filter(paramsFilters[k].filterFrequency, paramsFilters[k].filterType, paramsFilters[k].filterRolloff);
                    temp_filters.push(filterVal);
                    synth.chain(temp_filters[k], Tone.Master);
                }
            }

            if (paramsEffects != null && paramsEffects != undefined) {
                if (paramsEffects.doVibrato) {
                    var vibrato = new Tone.Vibrato(1 / paramsEffects.vibratoFrequency, paramsEffects.vibratoIntensity);
                    synth.chain(vibrato, Tone.Master);
                }

                if (paramsEffects.doDistortion) {
                    var distort = new Tone.Distortion(paramsEffects.distortionAmount).toMaster();
                    synth.connect(distort, Tone.Master);
                }

                if (paramsEffects.doTremolo) {
                    var tremolo = new Tone.Tremolo({
                        'frequency': paramsEffects.tremoloFrequency,
                        'depth': paramsEffects.tremoloDepth
                    }).toMaster().start();
                    synth.chain(tremolo);
                }

                if (paramsEffects.doPhaser) {
                    var phaser = new Tone.Phaser({
                        'frequency': paramsEffects.rate,
                        'octaves': paramsEffects.octaves,
                        'baseFrequency': paramsEffects.baseFrequency
                    }).toMaster();
                    synth.chain(phaser, Tone.Master);
                }

                if (paramsEffects.doChorus) {
                    var chorusEffect = new Tone.Chorus({
                        'frequency': paramsEffects.chorusRate,
                        'delayTime': paramsEffects.delayTime,
                        'depth': paramsEffects.chorusDepth
                    }).toMaster();
                    synth.chain(chorusEffect, Tone.Master);
                }
            }

            synth.triggerAttackRelease(notes, beatValue);

            setTimeout(function () {
                if (paramsEffects && paramsEffects != null && paramsEffects != undefined) {
                    if (paramsEffects.doVibrato) {
                        vibrato.dispose();
                    }

                    if (paramsEffects.doDistortion) {
                        distort.dispose();
                    }

                    if (paramsEffects.doTremolo) {
                        tremolo.dispose();
                    }

                    if (paramsEffects.doPhaser) {
                        phaser.dispose();
                    }

                    if (paramsEffects.doChorus) {
                        chorusEffect.dispose();
                    }
                }

                if (paramsFilters && paramsFilters != null && paramsFilters != undefined) {
                    for (k = 0; k < numFilters; k++) {
                        temp_filters[k].dispose();
                    }
                }
            }, beatValue * 1000);
        }
    };

    // Generalised version of 'trigger and 'triggerwitheffects' functions
    this.trigger = function (notes, beatValue, instrumentName, paramsEffects, paramsFilters) {
        if (paramsEffects !== null && paramsEffects !== undefined) {
            if (paramsEffects['vibratoIntensity'] != 0) {
                paramsEffects.doVibrato = true;
            }

            if (paramsEffects['distortionAmount'] != 0) {
                paramsEffects.doDistortion = true;
            }

            if (paramsEffects['tremoloFrequency'] != 0) {
                paramsEffects.doTremolo = true;
            }

            if (paramsEffects['rate'] != 0) {
                paramsEffects.doPhaser = true;
            }

            if (paramsEffects['chorusRate'] != 0) {
                paramsEffects.doChorus = true;
            }
        }

        var tempNotes = notes;
        var tempSynth = instruments['default'];
        var flag = 0;
        if (instrumentName in instruments) {
            tempSynth = instruments[instrumentName];
            flag = instrumentsSource[instrumentName][0];
            if (flag === 1 || flag === 2) {
                var sampleName = instrumentsSource[instrumentName][1];
            }
        }

        // Get note values as per the source of the synth.
        switch(flag) {
        case 1:  // drum
            if (instrumentName.slice(0, 4) === 'http') {
                tempSynth.triggerAttack(0, beatValue);
            } else if (instrumentName.slice(0, 4) === 'file') {
                tempSynth.triggerAttack(0, beatValue);
            } else {
                tempSynth.triggerAttack(0);
            }
            break;
        case 2:  // voice sample
            var centerNo = SAMPLECENTERNO[sampleName];
            var obj = noteToPitchOctave(notes);
            var noteNum = pitchToNumber(obj[0], obj[1], 'C Major');
            tempNotes = noteNum - centerNo;
            this.performNotes(tempSynth.toMaster(), tempNotes, beatValue, paramsEffects, paramsFilters);
            break;
        case 3:  // builtin synth
            if (typeof(notes) === 'object') {
                tempNotes = notes[0];
            }

            this.performNotes(tempSynth.toMaster(), tempNotes, beatValue, paramsEffects, paramsFilters);
            break;
        case 4:
            tempSynth.triggerAttackRelease(beatValue);
            break;
        case 0:  // default synth
        default:
            this.performNotes(tempSynth.toMaster(), tempNotes, beatValue, paramsEffects, paramsFilters);
            break;
        }
    };

    this.stopSound = function (instrumentName) {
        instruments[instrumentName].triggerRelease();
    };

    this.start = function () {
        Tone.Transport.start();
    };

    this.stop = function () {
        Tone.Transport.stop();
    };

    this.setVolume = function (instrumentName, volume) {
        // volume in decibals
        var db = this.tone.gainToDb(volume / 100);
        if (instrumentName in instruments) {
            instruments[instrumentName].volume.value = db;
        }
    };

    this.getVolume = function (instrumentName) {
        // volume in decibals
        if (instrumentName in instruments) {
            return instruments[instrumentName].volume.value;
        } else {
            console.log('instrument not found');
            return 50;
        }
    };

    this.setMasterVolume = function (volume) {
        var db = this.tone.gainToDb(volume / 100);
        Tone.Master.volume.rampTo(db, 0.01);
    };

};
