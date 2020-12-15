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
    this.sampleName = DEFAULTSAMPLE;
    this.pitchAdjustment = 0;

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

    this.pitchUp = function (i) {
        this.pitchAdjustment++;
        this.pitchInput.value = this.pitchAdjustment;
    };

    this.pitchDown = function (i) {
        this.pitchAdjustment--;
        this.pitchInput.value = this.pitchAdjustment;
    };

    this._usePitch = function (i) {
        this.pitchAdjustment = this.pitchInput.value;
        this.pitchInput.value = this.pitchAdjustment;
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

      for (let x=0; x < SAMPLEWIDTH; x++) {
          let period = Math.floor(this.sampleData.length / SAMPLEWIDTH);
          let amplitude = 0;
          let index = x*period+24;
          if (index < this.sampleData.length) {
              amplitude = this.sampleData.charCodeAt(index) - 64;
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

            this._addSample();

            var newStack = [
                [0, ["audiofile", {value: this.sampleName}], 100, 100, [null]]
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
                this._logo.synth.loadSynth(0, getVoiceSynthName(this.sampleName));
                this._logo.synth.trigger(
                    0,
                    [CENTERPITCHHERTZ + this.pitchAdjustment],
                    1,
                    this.sampleName,
                    null,
                    null,
                    false);
                this.isMoving = true;
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
                _("speed up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.pitchUp(i))(i);

            this.pitchInput = widgetWindow.addInputButton(this.pitchAdjustment, r2.insertCell());

            widgetWindow.addButton(
                "down.svg",
                ICONSIZE,
                _("slow down"),
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
                        this._usePitch(id);
                    }
                })(i)
            );
        }

        this._logo.textMsg(_("Record a sample to use as an instrument."));
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


    this.getBrowserAudio = async function() {
      let stream = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia();
        /* use the stream */
      } catch(err) {
        /* handle the error */
      }
    }
}
