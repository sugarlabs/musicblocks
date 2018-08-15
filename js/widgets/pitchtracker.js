// Copyright (c) 2016-18 Walter Bender
// Copyright (c) 2018 Ritwik Abhishek
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget enable us to create pitches of different frequency
// using microphone input

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = null;
var isPlaying = false;
var sourceNode = null;
var analyser = null;
var theBuffer = null;
var DEBUGCANVAS = null;
var mediaStreamSource = null;
var detectorElem, canvasElem, waveCanvas, pitchElem, noteElem, detuneElem, detuneAmount;

const BUTTONDIVWIDTH = 476;  // 8 buttons 476 = (55 + 4) * 8
const OUTERWINDOWWIDTH = 675;
const INNERWINDOWWIDTH = 600;
const RULERHEIGHT = 70;
const BUTTONSIZE = 51;
const ICONSIZE = 32;

    
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



var keepRecording = 1;

function PitchTracker() {


    const BUTTONDIVWIDTH = 118;  // 2 buttons (55 + 4) * 2
    const BUTTONSIZE = 51;
    const ICONSIZE = 32;
    const SEMITONE = Math.pow(2, 1 / 12);
    const DEL = 46;

    var numberGInput = 2;
    var numberHInput = 4;

    this.Sliders = [];
    this._focusedCellIndex = 0;
    this._isKeyPressed = 0;
    this._delta = 0;
    var frequencyContainer = [];

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
        keepRecording = 1;

        // Position the widget and make it visible.
        var trackerDiv = docById('trackerDiv');

        trackerDiv.style.visibility = 'visible';
        trackerDiv.setAttribute('draggable', 'true');
        trackerDiv.style.left = '200px';
        trackerDiv.style.top = '150px';

        // The widget buttons
        var widgetButtonsDiv = docById('trackerButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table id="trackerButtonTable"></table>';

        var buttonTable = docById('trackerButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        

        // var cell = this._addButton(row, 'speak.svg', iconSize, _('Start Recording'), '');
        // cell.onclick = function () {
        //     beep();
        //     beep();
        //     toggleLiveInput();
        // };


        // var cell = this._addButton(row, 'pause-button.svg', iconSize, _('Stop Recording'), '');
        // cell.onclick = function () {
        //     keepRecording = 0;
            
            
        // };

        this.isRecording = false;


        var cell = this._addButton(row, 'speak.svg', ICONSIZE, _('Start Recording'));

        cell.onclick=function() {
            if (that.isRecording) {
                keepRecording = 0;
                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/speak.svg" title="' + _('Start Recording') + '" alt="' + _('Start Recording') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle">&nbsp;&nbsp;';
                that.isRecording = false;
            } else {
                beep();
        	    toggleLiveInput();
                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('Stop Recording') + '" alt="' + _('Stop Recording') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle">&nbsp;&nbsp;';
                that.isRecording = true;
            }
        };



        // An input for setting BPM of pitch tracker
        var cell = row.insertCell();
        cell.innerHTML = '<input id="BPMTracker" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="BPMTracker" type="BPMTracker" value="' + 120 + '" />';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        var numberInput = docById('BPMTracker');

        numberInput.onkeydown = function (event) {
            if (event.keyCode === DEL) {
                numberInput.value = numberInput.value.substring(0, numberInput.value.length - 1);
            }   
        };

        numberInput.oninput = function (event) {
            // Put a limit on the size (60 <--> 240).
            numberInput.onmouseout = function(){
                if (numberInput.value < 60) {
                    numberInput.value = 60;
                } 
            };

            if (numberInput.value > 240) {
                numberInput.value = 240;
            }
        };
        numberGInput = numberInput;



        // An input for setting note size of pitch tracker
        var cell = row.insertCell();
        cell.innerHTML = '<input id="NoteSizeTracker" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="NoteSizeTracker" type="NoteSizeTracker" value="' + 2 + '" />';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        var numberInp = docById('NoteSizeTracker');

        numberInp.onkeydown = function (event) {
            if (event.keyCode === DEL) {
                numberInp.value = numberInp.value.substring(0, numberInp.value.length - 1);
            }   
        };

        numberInp.oninput = function (event) {
            // Put a limit on the size (2 <--> 128).
            numberInp.onmouseout = function(){
                if (numberInp.value < 1) {
                    numberInp.value = 1;
                } 
            };

            if (numberInp.value > 16) {
                numberInp.value = 16;
            }
        };
        numberHInput = numberInp;




        var cell = this._addButton(row, 'export-chunk.svg', iconSize, _('save rhythms'), '');
        cell.onclick = function () {
            
            var pitches = [];


            for(var f = 0;f<frequencyContainer.length;f++){
                var temp3 = frequencyContainer[f];
                pitches.push(noteProvider(temp3));
            }




            console.log("generating keyboard pitches for: " + pitches);
            //copy and pasted from matrix.saveMatrix (), the original had too many array dimensions so the forloop has been removed
            var noteConversion = {'C': 'do', 'D': 're', 'E': 'mi', 'F': 'fa', 'G': 'sol', 'A': 'la', 'B': 'ti', 'R': 'rest'};
            var newStack = [[0, ["action", {"collapsed":false}], 100, 100, [null, 1, null, null]], [1, ["text", {"value":"chunk"}], 0, 0, [0]]];
            var endOfStackIdx = 0;
            for (var i = 0; i < pitches.length; i++) {
            // We want all of the notes in a column.
                var note = pitches[i].slice(0);
         
            // Add the Note block and its value
                var idx = newStack.length;
                newStack.push([idx, 'note', 0, 0, [endOfStackIdx, idx + 1, idx + 2, null]]);
                var n = newStack[idx][4].length;
                if (i == 0) {  // the action block
                    newStack[endOfStackIdx][4][n - 2] = idx;
                } 
                else { // the previous note block
                    newStack[endOfStackIdx][4][n - 1] = idx;
                }
                var endOfStackIdx = idx;
                newStack.push([idx + 1, ['number', {'value': "4"}], 0, 0, [idx]]);
                // Add the pitch blocks to the Note block
                var  notePitch = note.substring(0,note.length-1);  //i.e. D or D# not D#1
                var thisBlock = idx + 2;
         
                // We need to point to the previous note or pitch block.
                var previousBlock = idx;  // Note block
          
          
                // The last connection in last pitch block is null.
                var lastConnection = null;

                newStack.push([thisBlock, 'pitch', 0, 0, [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]]);
                if(['♯', '♭'].indexOf(notePitch[1]) != -1) {
                    newStack.push([thisBlock + 1, ['solfege', {'value': noteConversion[note[0]] + note[1]}], 0, 0, [thisBlock]]);
                    newStack.push([thisBlock + 2, ['number', {'value': note[note.length-1]}], 0, 0, [thisBlock]]);
                } 
                else {
                    newStack.push([thisBlock + 1, ['solfege', {'value': noteConversion[notePitch[0]]}], 0, 0, [thisBlock]]);
                    newStack.push([thisBlock + 2, ['number', {'value': note[note.length-1]}], 0, 0, [thisBlock]]);
                }
            }
            console.log(newStack);
            logo.blocks.loadNewBlocks(newStack);


        };


        var cell = this._addButton(row, 'erase-button.svg', iconSize, _('clear'), '');
        cell.onclick = function () {
        	frequencyContainer = [];
       //     that._clear();
        };


        var cell = this._addButton(row, 'close-button.svg', iconSize, _('close'));
        cell.onclick = function() {
            trackerDiv.style.visibility = 'hidden';
            widgetButtonsDiv.style.visibility = 'hidden';
            trackerTableDiv.style.visibility = 'hidden'; 
            keepRecording = 0;
            frequencyContainer = [];
       //     docById('BPMTracker').classList.add('hasKeyboard');
            console.log("numberGInput " +numberGInput.value);
            console.log("numberInput " +numberInput.value);
            console.log("numberHInput " +numberHInput.value);
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

        this._dx = cell.getBoundingClientRect().left - trackerDiv.getBoundingClientRect().left;
        this._dy = cell.getBoundingClientRect().top - trackerDiv.getBoundingClientRect().top;
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
                trackerDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                trackerDiv.style.top = y + 'px';
                cell.innerHTML = that._dragCellHTML;
            }
        };

        trackerDiv.ondragover = function(e) {
            e.preventDefault();
        };

        trackerDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                trackerDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                trackerDiv.style.top = y + 'px';
                cell.innerHTML = that._dragCellHTML;
            }
        };

        trackerDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        trackerDiv.ondragstart = function(e) {
            if (cell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };






        
        var trackerTableDiv = docById('trackerTableDiv');
        trackerTableDiv.style.display = 'inline';
        trackerTableDiv.style.visibility = 'visible';
        trackerTableDiv.style.border = '2px';
        trackerTableDiv.innerHTML = 'Click on record';


        
    };

    this._noteWidth = function (noteValue) {
        return Math.floor(EIGHTHNOTEWIDTH * (8 / Math.abs(noteValue)) * 3);
    };
    
    
    function noteProvider(frequen){

        if(frequen < 63){
            return "B2";    
        } else if(frequen >= 63 && frequen < 67){
            return "C2";
        } else if(frequen >= 67 && frequen < 71){
            return "C♯2";
        } else if(frequen >= 71 && frequen < 75){
            return "D2" ;
        } else if(frequen >= 75 && frequen < 79){
            return "D♯2";
        } else if(frequen >= 79 && frequen < 84){
            return "E2";
        } else if(frequen >= 84 && frequen < 89){
            return "F2";
        } else if(frequen >= 89 && frequen < 95){
            return "F♯2";
        } else if(frequen >= 95 && frequen < 100){
            return "G2";
        } else if(frequen >= 100 && frequen < 107){
            return "G♯2";
        } else if(frequen >= 107 && frequen < 113){
            return "A2";
        } else if(frequen >= 113 && frequen < 120){
            return "A♯2";
        } else if(frequen >= 120 && frequen < 127){
            return "B2";
        }

        else if(frequen >= 127 && frequen < 134){
            return "C3";
        } else if(frequen >= 134 && frequen < 142){
            return "C♯3";
        } else if(frequen >= 142 && frequen < 150){
            return "D3" ;
        } else if(frequen >= 150 && frequen < 160){
            return "D♯3";
        } else if(frequen >= 160 && frequen < 170){
            return "E3";
        } else if(frequen >= 170 && frequen < 180){
            return "F3";
        } else if(frequen >= 180 && frequen < 190){
            return "F♯3";
        } else if(frequen >= 190 && frequen < 201){
            return "G3";
        } else if(frequen >= 201 && frequen < 213){
            return "G♯3";
        } else if(frequen >= 213 && frequen < 226){
            return "A3";
        } else if(frequen >= 226 && frequen < 239){
            return "A♯3";
        } else if(frequen >= 239 && frequen < 253){
            return "B3";
        }

        else if(frequen >= 253 && frequen < 269){
            return "C4";
        } else if(frequen >= 269 && frequen < 285){
            return "C♯4";
        } else if(frequen >= 285 && frequen < 302){
            return "D4" ;
        } else if(frequen >= 302 && frequen < 320){
            return "D♯4";
        } else if(frequen >= 320 && frequen < 340){
            return "E4";
        } else if(frequen >= 340 && frequen < 360){
            return "F4";
        } else if(frequen >= 360 && frequen < 381){
            return "F♯4";
        } else if(frequen >= 381 && frequen < 403){
            return "G4";
        } else if(frequen >= 403 && frequen < 427){
            return "G♯4";
        } else if(frequen >= 427 && frequen < 453){
            return "A4";
        } else if(frequen >= 453 && frequen < 480){
            return "A♯4";
        } else if(frequen >= 453 && frequen < 480){
            return "B4";
        }

        else if(frequen >= 480 && frequen < 538){
            return "C5";
        } else if(frequen >= 538 && frequen < 570){
            return "C♯5";
        } else if(frequen >= 570 && frequen < 604){
            return "D5" ;
        } else if(frequen >= 604 && frequen < 640){
            return "D♯5";
        } else if(frequen >= 640 && frequen < 680){
            return "E5";
        } else if(frequen >= 680 && frequen < 720){
            return "F5";
        } else if(frequen >= 720 && frequen < 762){
            return "F♯5";
        } else if(frequen >= 762 && frequen < 806){
            return "G5";
        } else if(frequen >= 806 && frequen < 854){
            return "G♯5";
        } else if(frequen >= 854 && frequen < 906){
            return "A5";
        } else if(frequen >= 906 && frequen < 960){
            return "A♯5";
        } else if(frequen >= 960 && frequen < 1016){
            return "B5";
        }

        else if(frequen >= 1016 && frequen < 1076){
            return "C6";
        } else if(frequen >= 1076 && frequen < 1130){
            return "C♯6";
        } else if(frequen >= 1130 && frequen < 1208){
            return "D6" ;
        } else if(frequen >= 1208 && frequen < 1280){
            return "D♯6";
        } else if(frequen >= 1280 && frequen < 1360){
            return "E6";
        } else if(frequen >= 1360 && frequen < 1440){
            return "F6";
        } else if(frequen >= 1440 && frequen < 1524){
            return "F♯6";
        } else if(frequen >= 1524 && frequen < 1612){
            return "G6";
        } else if(frequen >= 1612 && frequen < 1708){
            return "G♯6";
        } else if(frequen >= 1708 && frequen < 1812){
            return "A6";
        } else if(frequen >= 1812 && frequen < 1920){
            return "A♯6";
        } else if(frequen >= 1920 && frequen < 2032){
            return "B6";
        }

        else if(frequen >= 2032 && frequen < 2152){
            return "C7";
        } else if(frequen >= 2152 && frequen < 2260){
            return "C♯7";
        } else if(frequen >= 2260 && frequen < 2416){
            return "D7" ;
        } else if(frequen >= 2416 && frequen < 2560){
            return "D♯7";
        } else if(frequen >= 2560 && frequen < 2720){
            return "E7";
        } else if(frequen >= 2720 && frequen < 2880){
            return "F7";
        } else if(frequen >= 2880 && frequen < 3048){
            return "F♯7";
        } else if(frequen >= 3048 && frequen < 3224){
            return "G7";
        } else if(frequen >= 3224 && frequen < 3416){
            return "G♯7";
        } else if(frequen >= 3416 && frequen < 3624){
            return "A7";
        } else if(frequen >= 3624 && frequen < 3840){
            return "A♯7";
        } else if(frequen >= 3840 && frequen < 4064){
            return "B7";
        }

        else if(frequen >= 4064 && frequen < 4304){
            return "C8";
        } else if(frequen >= 4304 && frequen < 4520){
            return "C♯8";
        } else if(frequen >= 4520 && frequen < 4832){
            return "D8" ;
        } else if(frequen >= 4832 && frequen < 5120){
            return "D♯8";
        } else if(frequen >= 5120 && frequen < 5440){
            return "E8";
        } else if(frequen >= 5440 && frequen < 5760){
            return "F8";
        } else if(frequen >= 5760 && frequen < 6096){
            return "F♯8";
        } else if(frequen >= 6096 && frequen < 6448){
            return "G8";
        } else if(frequen >= 6448 && frequen < 6832){
            return "G♯8";
        } else if(frequen >= 6832 && frequen < 7248){
            return "A8";
        } else if(frequen >= 7248 && frequen < 7680){
            return "A♯8";
        } else if(frequen >= 7680 && frequen < 8128){
            return "B8";
        } else {
            return "C8";
        }
        
    }

    function beep() {
        var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
        snd.play();
    }   


    function error() {
        alert('Stream generation failed.');
    }

    function getUserMedia(dictionary, callback) {
        try {
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
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
        console.log("Inside toggleLiveInput");
        if (isPlaying) {
            //stop playing and return
            sourceNode.stop( 0 );
            sourceNode = null;
            analyser = null;
            isPlaying = false;
            if (!window.cancelAnimationFrame)
                window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
            window.cancelAnimationFrame( rafID );
            return "use live input";
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
        console.log("g = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")");
        return -1;

       //   var best_frequency = sampleRate/best_offset;
    }



    function updatePitch( time ) {
        if(keepRecording == 0){
            return;    
        }
        setTimeout(function(){
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
                console.log(Math.round( pitch ));
                noteElem.innerHTML = noteStrings[note%12];
                frequencyContainer.push(Math.round( pitch ));
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
        },240000/(numberGInput.value * numberHInput.value));
        trackerTableDiv.innerHTML = noteProvider(Math.round( pitch ));
        
    }

    

};
