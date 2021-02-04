function SampleWidget() {
    const BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const SAMPLEWIDTH = 400;
    const SAMPLEHEIGHT = 160;
    const RENDERINTERVAL = 50;

    const TRUEACCIDENTALNAMES = ["𝄫", "♭", "♮", "♯", "𝄪"];
    //using these characters can cause issues.
    const ACCIDENTALNAMES = ["bb", "b", "", "#", "x"];
    const SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti", "do"];
    const MAJORSCALE = [0, 2, 4, 5, 7, 9, 11];
    const DEFAULTACCIDENTAL = "";
    const DEFAULTSOLFEGE = "do";

    const REFERENCESAMPLE = "electronic synth";
    const DEFAULTSAMPLE = "electronic synth";
    const CENTERPITCHHERTZ = 220;

    const MAXOCTAVE = 10;

    this.timbreBlock;
    this.sampleArray;

    this.sampleData = "";
    this.sampleName = DEFAULTSAMPLE;

    this.samplePitch = "sol";
    this.pitchCenter = 9;

    this.accidentalCenter = 2;
    this.octaveCenter = 4;

    this.freqArray = new Uint8Array();


    this._updateBlocks = function (i) {

        let mainSampleBlock;
        let audiofileBlock;
        let solfegeBlock;
        let octaveBlock;

        this.sampleArray = [this.sampleName, this.sampleData, this.samplePitch, this.octaveCenter];

        if (this.timbreBlock != null) {
            mainSampleBlock = this._logo.blocks.blockList[this.timbreBlock].connections[1];;
            if (mainSampleBlock != null) {
                this._logo.blocks.blockList[mainSampleBlock].value = this.sampleArray;
                this._logo.blocks.blockList[mainSampleBlock].updateCache();

                audiofileBlock = this._logo.blocks.blockList[mainSampleBlock].connections[1];
                solfegeBlock = this._logo.blocks.blockList[mainSampleBlock].connections[2];
                octaveBlock = this._logo.blocks.blockList[mainSampleBlock].connections[3];

                if (audiofileBlock != null) {
                    this._logo.blocks.blockList[audiofileBlock].value = [this.sampleName, this.sampleData];
                    this._logo.blocks.blockList[audiofileBlock].text.text = this.sampleName;
                    this._logo.blocks.blockList[audiofileBlock].updateCache();
                }
                if (solfegeBlock != null) {
                    this._logo.blocks.blockList[solfegeBlock].value = this.pitchInput.value;
                    this._logo.blocks.blockList[solfegeBlock].text.text = this.pitchInput.value;
                    this._logo.blocks.blockList[solfegeBlock].updateCache();
                }
                if (octaveBlock != null) {
                    this._logo.blocks.blockList[octaveBlock].value = this.octaveCenter.toString();
                    this._logo.blocks.blockList[octaveBlock].text.text = this.octaveCenter.toString();
                    this._logo.blocks.blockList[octaveBlock].updateCache();
                }

                this._logo.refreshCanvas();
                saveLocally();
            }
        }
    };

    this.pause = function() {
        clearInterval(this._intervalID);
    };

    this.resume = function() {
        // Reset widget time since we are restarting.
        // We will no longer keep synch with the turtles.
        var d = new Date();

        //this.getBrowserAudio();

        //if (this._intervalID !== null) {
        //    clearInterval(this._intervalID);
        //}

        //this._intervalID = setInterval(() => {
        //    this._draw();
        //}, RENDERINTERVAL);

    };

    this.pitchUp = function () {
        this._usePitch(this.pitchInput.value);
        this.pitchCenter++;
        if (this.pitchCenter > 6) {
            this.octaveCenter++;
            if (this.octaveCenter > MAXOCTAVE) {
                this.octaveCenter = MAXOCTAVE;
            }
            this.octaveInput.value = this.octaveCenter;
        }
        this.pitchCenter%=7;
        this.pitchInput.value = SOLFEGENAMES[this.pitchCenter];
        this._updateBlocks();
        this._playReferencePitch();
    };

    this.pitchDown = function () {
        this._usePitch(this.pitchInput.value);
        this.pitchCenter--;
        if (this.pitchCenter < 0) {
            this.pitchCenter = 6;
            this.octaveCenter--;
            if (this.octaveCenter < 0) {
                this.octaveCenter = 0;
            }
            this.octaveInput.value = this.octaveCenter;
        }
        this.pitchCenter%=7;
        console.log(this.pitchCenter);
        this.pitchInput.value = SOLFEGENAMES[this.pitchCenter];
        this._updateBlocks();
        this._playReferencePitch();
    };

    this.accidentalUp = function () {
        this._useAccidental(this.accidentalInput.value);
        if (this.accidentalCenter < 4) {
            this.accidentalCenter++;
        }
        this.accidentalInput.value = ACCIDENTALNAMES[this.accidentalCenter];
        this._updateBlocks();
        this._playReferencePitch();
    };

    this.accidentalDown = function () {
        this._useAccidental(this.accidentalInput.value);
        if (this.accidentalCenter > 0) {
            this.accidentalCenter--;
        }
        this.accidentalInput.value = ACCIDENTALNAMES[this.accidentalCenter];
        this._updateBlocks();
        this._playReferencePitch();
    };

    this.octaveUp = function () {
        this._useOctave(this.octaveInput.value);
        this.octaveCenter++;
        if (this.octaveCenter > MAXOCTAVE) {
            this.octaveCenter = MAXOCTAVE;
        }
        this.octaveInput.value = this.octaveCenter;
        this._updateBlocks();
        this._playReferencePitch();
    };

    this.octaveDown = function () {
        this._useOctave(this.octaveInput.value);
        this.octaveCenter--;
        if (this.octaveCenter < 0) {
            this.octaveCenter = 0;
        }
        this.octaveInput.value = this.octaveCenter;
        this._updateBlocks();
        this._playReferencePitch();
    };


    this._usePitch = function () {
        let number = SOLFEGENAMES.indexOf(this.pitchInput.value);
        this.pitchCenter = (number==-1) ? 0 : number;
        this.pitchInput.value = SOLFEGENAMES[this.pitchCenter];
    }

    this._useAccidental = function () {
        let number = ACCIDENTALNAMES.indexOf(this.accidentalInput.value);
        this.accidentalCenter = (number==-1) ? 2 : number;
        this.accidentalInput.value = ACCIDENTALNAMES[this.accidentalCenter];
    }

    this._useOctave = function () {
        this.octaveCenter = this.octaveInput.value;
        this.octaveInput.value = this.octaveCenter;
    }


    this._draw = function() {

      let d = new Date();
      var canvas = this.sampleCanvas;
      let middle = SAMPLEHEIGHT / 2 - 15;

      var ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth = 0;

      let period = Math.floor(this.sampleData.length / SAMPLEWIDTH);

      for (let x=0; x < SAMPLEWIDTH; x++) {
          let amplitude = 0;
          let index = x*period+24;
          //if (index < this.sampleData.length) {
          //    amplitude = this.sampleData.charCodeAt(index) - 64;
          //}
          if (x < this.freqArray.length) {
              amplitude = this.freqArray[x];
          }
          ctx.moveTo(x, middle - amplitude);
          ctx.lineTo(x, middle + amplitude);
          ctx.stroke();
          ctx.fill();
      }
      ctx.closePath();

      ctx.font = "10px Verdana";
      ctx.fillText(this.sampleName, 10, 10);
    }

    this.__save = function() {
        var that = this;
        setTimeout(function() {
            console.debug("saving the sample");
            that._addSample();
            let value = { value: [that.sampleName, that.sampleData, that.samplePitch, that.octaveCenter]};
            var newStack = [
                [0, ["customsample", value], x, y, [null, 1, 2, 3]],
                [1, ["audiofile", {value: [that.sampleName, that.sampleData]}], 0 ,0, [0]],
                [2, ["solfege", {value: that.samplePitch}], 0, 0, [0]],
                [3, ["number", {value: that.octaveCenter}], 0, 0, [0]]
            ];

            that._logo.blocks.loadNewBlocks(newStack);
            that._logo.textMsg(_("New sample block generated!"));
        }, 200 * i);
    };

    this._saveSample = function() {
            this.__save();
    };

    this._get_save_lock = function() {
        return this._save_lock;
    };

    this.init = function(logo) {
        this._logo = logo;
        this._directions = [];
        this._widgetFirstTimes = [];
        this._widgetNextTimes = [];
        this._firstClickTimes = null;
        this._intervals = [];
        this.isMoving = false;
        if (this._intervalID != undefined && this._intervalID != null) {
            clearInterval(this._intervalID);
        }

        this._intervalID = null;

        this._logo.synth.loadSynth(0, getVoiceSynthName(DEFAULTSAMPLE));


        for (let key in CUSTOMSAMPLES) {
            if (CUSTOMSAMPLES.hasOwnProperty(key)) {
                if (this.sampleName == key) {
                    this.sampleData = CUSTOMSAMPLES[key];
                }
            }
        }

        this._parseSamplePitch();


        if (this._intervalID != null) {
            clearInterval(this._intervalID);
        }

        var w = window.innerWidth;

        var widgetWindow = window.widgetWindows.windowFor(this, "sample");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	      widgetWindow.show();

        // For the button callbacks
        var that = this;

        widgetWindow.onclose = function() {
            if (that._intervalID != null) {
                clearInterval(that._intervalID);
            }
            this.destroy();
        };

        let playBtn = widgetWindow.addButton("play-button.svg", ICONSIZE, _("Play"));
        playBtn.onclick = () => {
            if (this.isMoving) {
                this.pause();
                playBtn.innerHTML =
                    '<img src="header-icons/play-button.svg" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    ICONSIZE +
                    '" width="' +
                    ICONSIZE +
                    '" vertical-align="middle">';
                this.isMoving = false;
            } else {
                if (!(this.sampleName == "")) {
                    this.resume();
                    playBtn.innerHTML =
                        '<img src="header-icons/pause-button.svg" title="' +
                        _("Pause") +
                        '" alt="' +
                        _("Pause") +
                        '" height="' +
                        ICONSIZE +
                        '" width="' +
                        ICONSIZE +
                        '" vertical-align="middle">';
                    this._playReferencePitch();
                }
            }
        };

        widgetWindow.addButton(
            "load-media.svg",
            ICONSIZE,
            _("Upload sample"),
            ""
        ).onclick = function() {
            let fileChooser = docById("myOpenAll");

            let __readerAction = function(event) {
                window.scroll(0, 0);
                var sampleFile = fileChooser.files[0];
                var reader = new FileReader;
                reader.readAsDataURL(sampleFile);

                reader.onload = function(e) {
                    var rawLog = reader.result;
                    that.sampleData = rawLog;
                    that.sampleName = fileChooser.files[0].name;
                    that._addSample();
                    that._draw();
                };

                reader.onloadend = function() {
                    if (reader.result) {
                        value = [fileChooser.files[0].name, reader.result];


                        that.resume();
                  } else {
                  }
              };
              fileChooser.removeEventListener("change", __readerAction);
          };

          fileChooser.addEventListener("change", __readerAction, false);
          fileChooser.focus();
          fileChooser.click();
          window.scroll(0, 0);
        }

        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            ICONSIZE,
            _("Save sample"),
            ""
        ).onclick = function() {
            // Debounce button
            if (!that._get_save_lock()) {
                that._save_lock = true;
                that._saveSample();
                setTimeout(function() {
                    that._save_lock = false;
                }, 1000);
            }
        };

        this.bodyTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().appendChild(this.bodyTable);

        this.bodyTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().appendChild(this.bodyTable);

        let r1, r2, r3, vCell;
        for (let i = 0; i < 1; i++) {
            this._directions.push(1);
            this._widgetFirstTimes.push(this._logo.firstNoteTime);

            r1 = this.bodyTable.insertRow();
            r2 = this.bodyTable.insertRow();
            r3 = this.bodyTable.insertRow();

            widgetWindow.addButton(
                "up.svg",
                ICONSIZE,
                _("pitch up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.pitchUp(i))(i);

            this.pitchInput = widgetWindow.addInputButton(this.pitchCenter, r2.insertCell());
            this._usePitch(this.pitchInput.value);

            widgetWindow.addButton(
                "down.svg",
                ICONSIZE,
                _("pitch down"),
                r3.insertCell()
            ).onclick = ((i) => () => this.pitchDown(i))(i);


            widgetWindow.addButton(
                "up.svg",
                ICONSIZE,
                _("accidental up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.accidentalUp(i))(i);

            this.accidentalInput = widgetWindow.addInputButton(this.accidentalCenter, r2.insertCell());
            this._useAccidental(this.accidentalInput.value);

            widgetWindow.addButton(
                "down.svg",
                ICONSIZE,
                _("accidental down"),
                r3.insertCell()
            ).onclick = ((i) => () => this.accidentalDown(i))(i);

            widgetWindow.addButton(
                "up.svg",
                ICONSIZE,
                _("octave up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.octaveUp(i))(i);

            this.octaveInput = widgetWindow.addInputButton(this.octaveCenter, r2.insertCell());
            this._useOctave(this.octaveInput.value);

            widgetWindow.addButton(
                "down.svg",
                ICONSIZE,
                _("octave down"),
                r3.insertCell()
            ).onclick = ((i) => () => this.octaveDown(i))(i);

            this.sampleCanvas = document.createElement("canvas");
            this.sampleCanvas.style.width = SAMPLEWIDTH + "px";
            this.sampleCanvas.style.height = SAMPLEHEIGHT + "px";
            this.sampleCanvas.style.margin = "1px";
            this.sampleCanvas.style.background = "rgba(255, 255, 255, 1)";
            vCell = r1.insertCell();
            vCell.appendChild(this.sampleCanvas);
            vCell.setAttribute("rowspan", "3");

            this.pitchInput.addEventListener(
                "keyup",
                ((id) => (e) => {
                    if (e.keyCode === 13) {
                        console.log("use pitch");
                        this._usePitch(id);
                    }
                })
            );
        }

        this._logo.textMsg(_("Record a sample to use as an instrument."));
        this._draw();
        this.resume();

        widgetWindow.sendToCenter();
    };

    this._addSample = function() {

        if (CUSTOMSAMPLES.hasOwnProperty(this.sampleName)) {
            return;
        }
        CUSTOMSAMPLES[this.sampleName] = this.sampleData;
        CUSTOMSAMPLECENTERNO[this.sampleName] = [this.samplePitch, this.octaveCenter];
    }

    this._playReferencePitch = function() {
        this._usePitch(this.pitchInput.value);
        this._useAccidental(this.accidentalInput.value);
        this._useOctave(this.octaveInput.value);

        this.sampleArray = [this.sampleName, this.sampleData, this.samplePitch, this.octaveCenter];

        let finalCenter = 0;

        finalCenter += isNaN(this.octaveCenter)     ? 0 : this.octaveCenter*12;
        finalCenter += isNaN(this.pitchCenter)      ? 0 : MAJORSCALE[this.pitchCenter];
        finalCenter += isNaN(this.accidentalCenter) ? 0 : this.accidentalCenter-2;


        //Convert MIDI number to hertz, given a MIDI number of 57 is 440 Hz.
        let netChange = finalCenter-57;
        let reffinalpitch = Math.floor(440 * Math.pow(2, netChange/12));


        this._logo.synth.trigger(
            0,
            [reffinalpitch],
            0.25,
            REFERENCESAMPLE,
            null,
            null,
            false);
        this.isMoving = true;

        this._logo.synth.loadSynth(0, this.sampleArray);

        let finalpitch = CENTERPITCHHERTZ;
        this._logo.synth.trigger(
            0,
            [finalpitch],
            1,
            this.sampleName,
            null,
            null,
            false);
    }

    this._parseSamplePitch = function () {
        this.pitchCenter = this.samplePitch;

    }


    this.webaudio_tooling_obj = function () {
        var audioContext = new AudioContext();
        console.log("audio is starting up ...");

        var BUFF_SIZE = 16384;

        var audioInput = null,
            microphone_stream = null,
            gain_node = null,
            script_processor_node = null,
            script_processor_fft_node = null,
            analyserNode = null;

        if (!navigator.getUserMedia)
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia || navigator.msGetUserMedia;

        if (navigator.getUserMedia){

            navigator.getUserMedia({audio:true},
              function(stream) {
                  start_microphone(stream);
              },
              function(e) {
                alert('Error capturing audio.');
              }
            );

        } else { alert('getUserMedia not supported in this browser.'); }

        function show_some_data(given_typed_array, num_row_to_display, label) {

            var size_buffer = given_typed_array.length;
            var index = 0;
            var max_index = num_row_to_display;

            console.log("__________ " + label);

            for (; index < max_index && index < size_buffer; index += 1) {

                console.log(given_typed_array[index]);
            }
        }

        function process_microphone_buffer(event) { // invoked by event loop

            var i, N, inp, microphone_output_buffer;

            microphone_output_buffer = event.inputBuffer.getChannelData(0); // just mono - 1 channel for now

            // microphone_output_buffer  <-- this buffer contains current gulp of data size BUFF_SIZE

            show_some_data(microphone_output_buffer, 5, "from getChannelData");
        }

        function start_microphone(stream){

          gain_node = audioContext.createGain();
          gain_node.connect( audioContext.destination );

          microphone_stream = audioContext.createMediaStreamSource(stream);
          microphone_stream.connect(gain_node);

          script_processor_node = audioContext.createScriptProcessor(BUFF_SIZE, 1, 1);
          script_processor_node.onaudioprocess = process_microphone_buffer;

          microphone_stream.connect(script_processor_node);

          //enable volume control for output speakers

          // setup FFT

          script_processor_fft_node = audioContext.createScriptProcessor(2048, 1, 1);
          script_processor_fft_node.connect(gain_node);

          analyserNode = audioContext.createAnalyser();
          analyserNode.smoothingTimeConstant = 0;
          analyserNode.fftSize = 2048;

          microphone_stream.connect(analyserNode);

          analyserNode.connect(script_processor_fft_node);

          script_processor_fft_node.onaudioprocess = function() {

            // get the average for the first channel
            array = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(array);

            // draw the spectrogram
            if (microphone_stream.playbackState == microphone_stream.PLAYING_STATE) {

                show_some_data(array, 5, "from fft");
            }
          };
        }
    }
}
