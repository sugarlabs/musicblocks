// Copyright (c) 2016-18 Walter Bender
// Copyright (c) 2016 Hemant Kasat
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget enable us to create pitches of different frequency varying
// from given frequency to nextoctave frequency(two times the given frequency)
// in continuous manner.

function PitchTracker() {
    const BUTTONDIVWIDTH = 118;  // 2 buttons (55 + 4) * 2
    const BUTTONSIZE = 51;
    const ICONSIZE = 32;
    const SEMITONE = Math.pow(2, 1 / 12);

    this.Sliders = [];
    this._focusedCellIndex = 0;
    this._isKeyPressed = 0;
    this._delta = 0;

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this._play = function (cell) {
        var cellIndex = cell.cellIndex;
        var frequency = this.Sliders[cellIndex][0] * Math.pow(SEMITONE, this.Sliders[cellIndex][1]);
        var obj = frequencyToPitch(frequency);
        var pitchnotes = [];
        var note = obj[0] + obj[1];
        pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
        var slider = docById('slider');
        this._logo.synth.trigger(0, pitchnotes, 1, 'default', null, null);
    };

    this._moveSlider = function (cell, upDown) {
        var cellIndex = cell.cellIndex;
        var sliderrow = docById('slider');
        var cellDiv = sliderrow.cells[cellIndex].childNodes[0];
        var frequencyDiv = cellDiv.childNodes[0];
        var moveValue = parseFloat(Math.floor(SLIDERWIDTH * this._cellScale)) / 3;
        var nextOctave = 2 * this.Sliders[cellIndex][0];

        var idx = this.Sliders[cellIndex][1] + (1 * upDown);
        var frequency = this.Sliders[cellIndex][0] * Math.pow(SEMITONE, idx);

        if (frequency > nextOctave) {
            return;
        } else if (frequency < this.Sliders[cellIndex][0]) {
            return;
        }

        this.Sliders[cellIndex][2] = 0;
        this.Sliders[cellIndex][1] = idx; // += 1 * upDown;

        var top = Number(cellDiv.style.top.replace('px', ''));
        cellDiv.style.top = (top - (upDown * SLIDERHEIGHT / 12)) + 'px';

        frequencyDiv.innerHTML = frequency.toFixed(2);
        this._logo.synth.stop();
        this._play(sliderrow.cells[cellIndex]);
    };

    this._save = function (cell) {
        console.log(cell);
        var that = this;
        var cellIndex = cell.cellIndex;
        var frequency = this.Sliders[cellIndex][0] * Math.pow(SEMITONE, this.Sliders[cellIndex][1]);

        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        var newStack = [[0, 'note', 100 + this._delta, 100 + this._delta, [null, 1, 2, null]], [1, ['number', {'value': 8}], 0, 0, [0]]];
        this._delta += 21;

        var endOfStackIdx = 0;
        var previousBlock = 0;

        var hertzIdx = newStack.length;
        var frequencyIdx = hertzIdx + 1;
        var hiddenIdx = hertzIdx + 2;
        newStack.push([hertzIdx, 'hertz', 0, 0, [previousBlock, frequencyIdx, hiddenIdx]]);
        newStack.push([frequencyIdx, ['number', {'value': frequency.toFixed(2)}], 0, 0, [hertzIdx]]);
        newStack.push([hiddenIdx, 'hidden', 0, 0, [hertzIdx, null]]);

        that._logo.blocks.loadNewBlocks(newStack);
    }

    this._addKeyboardInput = function (cell) {
        const KEYCODE_LEFT = 37;
        const KEYCODE_RIGHT = 39;
        const KEYCODE_UP = 38;
        const KEYCODE_DOWN = 40;
        const RETURN = 13;

        var that = this;
        cell.focus();

        cell.addEventListener('keydown', function(event) {
            that._isKeyPressed = 0;
            if (event.keyCode >= KEYCODE_LEFT && event.keyCode <= KEYCODE_DOWN) {
                that._isKeyPressed = 1;
            } else if (event.keyCode === RETURN) {
                that._isKeyPressed = 1;
            }
        });

        cell.addEventListener('keyup', function(event) {
            if (that._isKeyPressed === 1) {
                that._isKeyPressed = 0;

                if (event.keyCode === KEYCODE_UP) {
                    that._moveSlider(cell, 1);
                }

                if (event.keyCode === KEYCODE_DOWN) {
                    that._moveSlider(cell, -1);
                }

                if (event.keyCode === KEYCODE_LEFT) {
                    that._focusCell(cell, -1);
                }

                if (event.keyCode === KEYCODE_RIGHT) {
                    that._focusCell(cell, 1);
                }

                if (event.keyCode === RETURN) {
                    console.log('RETURN');
                    that._save(cell);
                }
            }
        });
    }

    this._focusCell = function (cell, RightOrLeft) {
        var that = this;
        var cellIndex = cell.cellIndex;
        var toBeFocused = cellIndex + RightOrLeft;

        if (toBeFocused < 0) {
            toBeFocused = this.Sliders.length - 1;
        }

        if (toBeFocused > this.Sliders.length - 1) {
            toBeFocused = 0;
        }

        cell.blur();
        var sliderrow = docById('slider');
        var newCell = sliderrow.cells[toBeFocused];
        this._addKeyboardInput(newCell);
    }

    this.init = function (logo) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = null;
var isPlaying = false;
var sourceNode = null;
var analyser = null;
var theBuffer = null;
var DEBUGCANVAS = null;
var mediaStreamSource = null;
var detectorElem, 
    canvasElem,
    waveCanvas,
    pitchElem,
    noteElem,
    detuneElem,
    detuneAmount;

window.onload = function() {
    audioContext = new AudioContext();
    MAX_SIZE = Math.max(4,Math.floor(audioContext.sampleRate/5000));    // corresponds to a 5kHz signal
    var request = new XMLHttpRequest();
    request.open("GET", "../sounds/whistling3.ogg", true);
    request.responseType = "arraybuffer";
    request.onload = function() {
      audioContext.decodeAudioData( request.response, function(buffer) { 
            theBuffer = buffer;
        } );
    }
    request.send();

    detectorElem = document.getElementById( "detector" );
    canvasElem = document.getElementById( "output" );
    DEBUGCANVAS = document.getElementById( "waveform" );
    if (DEBUGCANVAS) {
        waveCanvas = DEBUGCANVAS.getContext("2d");
        waveCanvas.strokeStyle = "black";
        waveCanvas.lineWidth = 1;
    }
    pitchElem = document.getElementById( "pitch" );
    noteElem = document.getElementById( "note" );
    detuneElem = document.getElementById( "detune" );
    detuneAmount = document.getElementById( "detune_amt" );

    detectorElem.ondragenter = function () { 
        this.classList.add("droptarget"); 
        return false; };
    detectorElem.ondragleave = function () { this.classList.remove("droptarget"); return false; };
    detectorElem.ondrop = function (e) {
        this.classList.remove("droptarget");
        e.preventDefault();
        theBuffer = null;

        var reader = new FileReader();
        reader.onload = function (event) {
            audioContext.decodeAudioData( event.target.result, function(buffer) {
                theBuffer = buffer;
            }, function(){alert("error loading!");} ); 

        };
        reader.onerror = function (event) {
            alert("Error: " + reader.error );
        };
        reader.readAsArrayBuffer(e.dataTransfer.files[0]);
        return false;
    };



}

function error() {
    alert('Stream generation failed.');
}

function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia = 
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    // Connect it to the destination.
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect( analyser );
    updatePitch();
}

function toggleOscillator() {
    if (isPlaying) {
        //stop playing and return
        sourceNode.stop( 0 );
        sourceNode = null;
        analyser = null;
        isPlaying = false;
        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
        window.cancelAnimationFrame( rafID );
        return "play oscillator";
    }
    sourceNode = audioContext.createOscillator();

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode.connect( analyser );
    analyser.connect( audioContext.destination );
    sourceNode.start(0);
    isPlaying = true;
    isLiveInput = false;
    updatePitch();

    return "stop";
}

function toggleLiveInput() {
    if (isPlaying) {
        //stop playing and return
        sourceNode.stop( 0 );
        sourceNode = null;
        analyser = null;
        isPlaying = false;
        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
        window.cancelAnimationFrame( rafID );
    }
    getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream);
}

function togglePlayback() {
    if (isPlaying) {
        //stop playing and return
        sourceNode.stop( 0 );
        sourceNode = null;
        analyser = null;
        isPlaying = false;
        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
        window.cancelAnimationFrame( rafID );
        return "start";
    }

    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = theBuffer;
    sourceNode.loop = true;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode.connect( analyser );
    analyser.connect( audioContext.destination );
    sourceNode.start( 0 );
    isPlaying = true;
    isLiveInput = false;
    updatePitch();

    return "stop";
}

var rafID = null;
var tracks = null;
var buflen = 1024;
var buf = new Float32Array( buflen );

var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteFromPitch( frequency ) {
    var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
    return Math.round( noteNum ) + 69;
}

function frequencyFromNoteNumber( note ) {
    return 440 * Math.pow(2,(note-69)/12);
}

function centsOffFromPitch( frequency, note ) {
    return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note ))/Math.log(2) );
}

// this is a float version of the algorithm below - but it's not currently used.
/*
function autoCorrelateFloat( buf, sampleRate ) {
    var MIN_SAMPLES = 4;    // corresponds to an 11kHz signal
    var MAX_SAMPLES = 1000; // corresponds to a 44Hz signal
    var SIZE = 1000;
    var best_offset = -1;
    var best_correlation = 0;
    var rms = 0;
    if (buf.length < (SIZE + MAX_SAMPLES - MIN_SAMPLES))
        return -1;  // Not enough data
    for (var i=0;i<SIZE;i++)
        rms += buf[i]*buf[i];
    rms = Math.sqrt(rms/SIZE);
    for (var offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
        var correlation = 0;
        for (var i=0; i<SIZE; i++) {
            correlation += Math.abs(buf[i]-buf[i+offset]);
        }
        correlation = 1 - (correlation/SIZE);
        if (correlation > best_correlation) {
            best_correlation = correlation;
            best_offset = offset;
        }
    }
    if ((rms>0.1)&&(best_correlation > 0.1)) {
        console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")");
    }
//  var best_frequency = sampleRate/best_offset;
}
*/

var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.
var GOOD_ENOUGH_CORRELATION = 0.9; // this is the "bar" for how close a correlation needs to be

function autoCorrelate( buf, sampleRate ) {
    var SIZE = buf.length;
    var MAX_SAMPLES = Math.floor(SIZE/2);
    var best_offset = -1;
    var best_correlation = 0;
    var rms = 0;
    var foundGoodCorrelation = false;
    var correlations = new Array(MAX_SAMPLES);

    for (var i=0;i<SIZE;i++) {
        var val = buf[i];
        rms += val*val;
    }
    rms = Math.sqrt(rms/SIZE);
    if (rms<0.01) // not enough signal
        return -1;

    var lastCorrelation=1;
    for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
        var correlation = 0;

        for (var i=0; i<MAX_SAMPLES; i++) {
            correlation += Math.abs((buf[i])-(buf[i+offset]));
        }
        correlation = 1 - (correlation/MAX_SAMPLES);
        correlations[offset] = correlation; // store it, for the tweaking we need to do below.
        if ((correlation>GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
            foundGoodCorrelation = true;
            if (correlation > best_correlation) {
                best_correlation = correlation;
                best_offset = offset;
            }
        } else if (foundGoodCorrelation) {
            // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
            // Now we need to tweak the offset - by interpolating between the values to the left and right of the
            // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
            // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
            // (anti-aliased) offset.

            // we know best_offset >=1, 
            // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and 
            // we can't drop into this clause until the following pass (else if).
            var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];  
            return sampleRate/(best_offset+(8*shift));
        }
        lastCorrelation = correlation;
    }
    if (best_correlation > 0.01) {
        // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
        return sampleRate/best_offset;
    }
    return -1;
//  var best_frequency = sampleRate/best_offset;
}

function updatePitch( time ) {
    var cycles = new Array;
    analyser.getFloatTimeDomainData( buf );
    var ac = autoCorrelate( buf, audioContext.sampleRate );
    // TODO: Paint confidence meter on canvasElem here.

    if (DEBUGCANVAS) {  // This draws the current waveform, useful for debugging
        waveCanvas.clearRect(0,0,512,256);
        waveCanvas.strokeStyle = "red";
        waveCanvas.beginPath();
        waveCanvas.moveTo(0,0);
        waveCanvas.lineTo(0,256);
        waveCanvas.moveTo(128,0);
        waveCanvas.lineTo(128,256);
        waveCanvas.moveTo(256,0);
        waveCanvas.lineTo(256,256);
        waveCanvas.moveTo(384,0);
        waveCanvas.lineTo(384,256);
        waveCanvas.moveTo(512,0);
        waveCanvas.lineTo(512,256);
        waveCanvas.stroke();
        waveCanvas.strokeStyle = "black";
        waveCanvas.beginPath();
        waveCanvas.moveTo(0,buf[0]);
        for (var i=1;i<512;i++) {
            waveCanvas.lineTo(i,128+(buf[i]*128));
        }
        waveCanvas.stroke();
    }

    if (ac == -1) {
        detectorElem.className = "vague";
        pitchElem.innerText = "--";
        noteElem.innerText = "-";
        detuneElem.className = "";
        detuneAmount.innerText = "--";
    } else {
        detectorElem.className = "confident";
        pitch = ac;
        pitchElem.innerText = Math.round( pitch ) ;
        var note =  noteFromPitch( pitch );
        noteElem.innerHTML = noteStrings[note%12];
        var detune = centsOffFromPitch( pitch, note );
        if (detune == 0 ) {
            detuneElem.className = "";
            detuneAmount.innerHTML = "--";
        } else {
            if (detune < 0)
                detuneElem.className = "flat";
            else
                detuneElem.className = "sharp";
            detuneAmount.innerHTML = Math.abs( detune );
        }
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = window.webkitRequestAnimationFrame;
    rafID = window.requestAnimationFrame( updatePitch );
}
    };
};
