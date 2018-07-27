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



    

function PitchTracker() {
    console.log("Hiii");


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

    this.init = function (logo) {
        this._logo = logo;

        var w = window.innerWidth;
        this._cellScale = 1.0;
        var iconSize = ICONSIZE;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var sliderDiv = docById('sliderDiv');

        sliderDiv.style.visibility = 'visible';
        sliderDiv.setAttribute('draggable', 'true');
        sliderDiv.style.left = '200px';
        sliderDiv.style.top = '150px';

        // The widget buttons
        var widgetButtonsDiv = docById('sliderButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table id="sliderButtonTable"></table>';

        var buttonTable = docById('sliderButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        var cell = this._addButton(row, 'close-button.svg', iconSize, _('close'));

        cell.onclick = function() {
            sliderDiv.style.visibility = 'hidden';
            widgetButtonsDiv.style.visibility = 'hidden';
            sliderTableDiv.style.visibility = 'hidden';
        };

        var cell = this._addButton(row, 'export-chunk.svg', iconSize, _('save rhythms'), '');
        cell.onclick = function () {
            toggleLiveInput();
        };

        cell.onmouseover = function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout = function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        // We use this cell as a handle for dragging.
        var cell = this._addButton(row, 'grab.svg', iconSize, _('drag'));

        cell.style.cursor = 'move';

        this._dx = cell.getBoundingClientRect().left - sliderDiv.getBoundingClientRect().left;
        this._dy = cell.getBoundingClientRect().top - sliderDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = cell.innerHTML;

        cell.onmouseover = function(e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
            cell.innerHTML = '';
        };

        cell.onmouseout = function(e) {
            if (!that._dragging) {
                cell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                sliderDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                sliderDiv.style.top = y + 'px';
                cell.innerHTML = that._dragCellHTML;
            }
        };

        sliderDiv.ondragover = function(e) {
            e.preventDefault();
        };

        sliderDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                sliderDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                sliderDiv.style.top = y + 'px';
                cell.innerHTML = that._dragCellHTML;
            }
        };

        sliderDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        sliderDiv.ondragstart = function(e) {
            if (cell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        // The slider table
        var sliderTableDiv = docById('sliderTableDiv');
        sliderTableDiv.style.display = 'inline';
        sliderTableDiv.style.visibility = 'visible';
        sliderTableDiv.style.border = '2px';
        sliderTableDiv.innerHTML = '';

        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.
        sliderTableDiv.innerHTML = '<div id="sliderOuterDiv"><div id="sliderInnerDiv"><table id="sliderSliderTable"></table></div></div>';

        var sliderOuterDiv = docById('sliderOuterDiv');
        sliderOuterDiv.style.width = Math.min((11 + this.Sliders.length * SLIDERWIDTH), w / 2) + 'px';
        sliderOuterDiv.style.height = (11 + SLIDERHEIGHT + 3 * BUTTONSIZE) + 'px';

        var sliderInnerDiv = docById('sliderInnerDiv');
        sliderInnerDiv.style.width = (10 + this.Sliders.length * SLIDERWIDTH)+ 'px';
        sliderInnerDiv.style.height = (10 + SLIDERHEIGHT + 3 * BUTTONSIZE) + 'px';

        // Each column in the table has a slider row, and up row, and a down row.
        var sliderTable = docById('sliderSliderTable');
        var sliderRow = sliderTable.insertRow();
        sliderRow.setAttribute('id', 'slider');
        var upRow = sliderTable.insertRow();
        var downRow = sliderTable.insertRow();

        for (var i = 0; i < this.Sliders.length; i++) {
            var sliderCell = sliderRow.insertCell();

            sliderCell.style.width = SLIDERWIDTH * this._cellScale + 'px';
            sliderCell.style.minWidth = sliderCell.style.width;
            sliderCell.style.maxWidth = sliderCell.style.width;
            sliderCell.style.height = (BUTTONSIZE + SLIDERHEIGHT) * this._cellScale + 'px';
            sliderCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            sliderCell.setAttribute('tabIndex', 1);

            // Add a div to hold the slider.
            var cellDiv = document.createElement('div');
            cellDiv.setAttribute('id', 'sliderInCell');
            cellDiv.setAttribute('position', 'absolute');
            cellDiv.style.height = Math.floor(w / SLIDERHEIGHT) + 'px';
            cellDiv.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
            cellDiv.style.top = SLIDERHEIGHT + 'px';
            cellDiv.style.backgroundColor = MATRIXBUTTONCOLOR;
            sliderCell.appendChild(cellDiv);

            // Add a paragraph element for the slider value.
            var slider = document.createElement('P');
            slider.innerHTML = this.Sliders[i][0].toFixed(2);
            cellDiv.appendChild(slider);

            sliderCell.onmouseover = function(event) {
                that._addKeyboardInput(this);
            };

            sliderCell.onmouseout = function() {
                this.blur();
            };

            sliderCell.onmousemove = function(event) {
                var cellDiv = this.childNodes[0];

                // Using event.offsetY was too noisy. This is more robust.
                var offset = event.pageY - this.getBoundingClientRect().top;
                if (offset > SLIDERHEIGHT) {
                    var offset = SLIDERHEIGHT;
                } else if (offset < 0) {
                    var offset = 0;
                }

                var cellIndex = this.cellIndex;
                var sliderrow = docById('slider');
                var cellDiv = sliderrow.cells[cellIndex].childNodes[0];
                cellDiv.style.top = offset + 'px';

                var distanceFromBottom = Math.max(SLIDERHEIGHT - offset, 0);
                var frequencyOffset = parseFloat(that.Sliders[cellIndex][0]) / SLIDERHEIGHT * distanceFromBottom;

                that.Sliders[cellIndex][1] = parseInt(Math.log2(parseFloat(that.Sliders[cellIndex][0] + frequencyOffset) / that.Sliders[cellIndex][0]) * 12);
                that.Sliders[cellIndex][2] = frequencyOffset - that.Sliders[cellIndex][0] * Math.pow(SEMITONE, that.Sliders[cellIndex][1]);

                var frequencyDiv = cellDiv.childNodes[0];
                var frequency = that.Sliders[cellIndex][0] * Math.pow(SEMITONE, that.Sliders[cellIndex][1]);
                frequencyDiv.innerHTML = frequency.toFixed(2);
                that._play(this);
            };

            sliderCell.onclick = function() {
                that._save(this);
            };

            var upCell = this._addButton(upRow, 'up.svg', iconSize, _('move up'));

            upCell.onclick = function() {
                that._moveSlider(this, 1);
            };

            upCell.onmouseover = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            };

            upCell.onmouseout = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLOR;
            };

            var downCell = this._addButton(downRow, 'down.svg', iconSize, _('move down'));

            downCell.onclick = function() {
                that._moveSlider(this, -1);
            };

            downCell.onmouseover = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            };

            downCell.onmouseout = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLOR;
            };
        }
    };
    

    

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
            console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")");
            return sampleRate/best_offset;
        }
        console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")");
        return -1;

       //   var best_frequency = sampleRate/best_offset;
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
            console.log(pitch);
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
