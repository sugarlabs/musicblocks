function SampleWidget() {
    const BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const SAMPLEWIDTH = 400;
    const SAMPLEHEIGHT = 160;
    const RENDERINTERVAL = 50;

    const DEFAULTSAMPLE = "electronic synth";
    const CENTERPITCHHERTZ = 262;

    this.sampleData = "";
    this.freqArray = new Uint8Array();
    this.sampleName = DEFAULTSAMPLE;
    this.pitchAdjustment = 0;

    this.sampleBlock;

    this._updateBlocks = function (i) {

        let blockNumber;
        if (this.sampleBlock != null) {
            blockNumber = this._logo.blocks.blockList[this.sampleBlock].connections[1];
            if (blockNumber != null) {
                this._logo.blocks.blockList[blockNumber].value = [this.sampleName, this.sampleData];
                this._logo.blocks.blockList[blockNumber].updateCache();

                numberBlockNumber = this._logo.blocks.blockList[blockNumber].connections[0];
                if (numberBlockNumber != null) {
                    this._logo.blocks.blockList[numberBlockNumber].value = this.pitchAdjustment;

                    this._logo.blocks.blockList[numberBlockNumber].updateCache();
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
        this.pitchAdjustment++;
        this.pitchInput.value = this.pitchAdjustment;
        this._updateBlocks();
    };

    this.pitchDown = function () {
        this._usePitch(this.pitchInput.value);
        this.pitchAdjustment--;
        this.pitchInput.value = this.pitchAdjustment;
        this._updateBlocks();
    };

    this._usePitch = function () {
        this.pitchAdjustment = this.pitchInput.value;
        this.pitchInput.value = this.pitchAdjustment;
        this._updateBlocks();
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

            var newStack = [
                [0, ["audiofile", { value: [that.sampleName, that.sampleData]}], 0, 0, [null, 1]],
                [0, ["number", {value: that.pitchAdjustment}], 0, 0, [0]]
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

        for (i=0;i<CUSTOMSAMPLES.length;i++) {
            if (CUSTOMSAMPLES[i][0] == this.sampleName) {
                this.sampleData = CUSTOMSAMPLES[i][1];
            }
        }

        if (this._intervalID != null) {
            clearInterval(this._intervalID);
        }

        var w = window.innerWidth;
        var iconSize = ICONSIZE;

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
                if (!(this.sampleName == "")) {
                    this._usePitch(this.pitchInput.value);
                    this._logo.synth.loadSynth(0, getVoiceSynthName(this.sampleName));
                    let finalAdjustment = 0;
                    if (!isNaN(this.pitchAdjustment)) {
                        finalAdjustment = this.pitchAdjustment;
                    }
                    let finalpitch = Math.floor(CENTERPITCHHERTZ * Math.pow(2, finalAdjustment/12));
                    console.log(finalpitch);
                    this._logo.synth.trigger(
                        0,
                        [finalpitch],
                        1,
                        this.sampleName,
                        null,
                        null,
                        false);
                    this.isMoving = true;
                }
            }
        };

        widgetWindow.addButton(
            "load-media.svg",
            iconSize,
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
            iconSize,
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

            this.pitchInput = widgetWindow.addInputButton(this.pitchAdjustment, r2.insertCell());

            widgetWindow.addButton(
                "down.svg",
                ICONSIZE,
                _("pitch down"),
                r3.insertCell()
            ).onclick = ((i) => () => this.pitchDown(i))(i);

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
        for (i=0; i < CUSTOMSAMPLES.length; i++) {
            if (CUSTOMSAMPLES[i][0] == this.sampleName) {
                return;
            }
        }
        CUSTOMSAMPLES.push([this.sampleName, this.sampleData]);
        console.log(CUSTOMSAMPLES);
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
