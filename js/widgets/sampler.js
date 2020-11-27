function SampleWidget() {
    const SAMPLESYNTH = "bottle";
    const BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const SAMPLEWIDTH = 600;
    const SAMPLEHEIGHT = 200;
    const YRADIUS = 75;

    this.sampleData = "";

    this.pause = function() {
        clearInterval(this._intervalID);
    };

    this.resume = function() {
        // Reset widget time since we are restarting.
        // We will no longer keep synch with the turtles.
        var d = new Date();

        this._draw();
    };


    this._draw = function() {

      var canvas = this.sampleCanvas;
      let middle = SAMPLEHEIGHT / 2;

      var ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth = 0;

      for (let x=0; x < SAMPLEWIDTH; x++) {
          let amplitude = (x**2)%50;
          ctx.moveTo(x, middle - amplitude);
          ctx.lineTo(x, middle + amplitude);
          ctx.stroke();
          ctx.fill();
      }
      ctx.closePath();

    }

    this.__save = function() {
        var that = this;
        require("samples/banjo");
        setTimeout(function() {
            console.debug("saving the sample");
            var newStack = [
                [0, ["audiofile", { value: this.sampleData}], 100, 100, [null]]
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
        this.isMoving = true;
        if (this._intervalID != undefined && this._intervalID != null) {
            clearInterval(this._intervalID);
        }

        this._intervalID = null;

        this._logo.synth.loadSynth(0, getDrumSynthName(SAMPLESYNTH));

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
                console.log(sampleFile);

                reader.onload = function(e) {
                    var rawLog = reader.result;
                    that.sampleData = rawLog;
                    console.log(that.sampleData);
                };

                reader.onloadend = function() {
                    if (reader.result) {
                        value = [fileChooser.files[0].name, reader.result];
                        //this.sampleData = value;
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

        widgetWindow.addButton(
            "media-playback-start.svg",
            iconSize,
            _("Play sample"),
            ""
        ).onclick = function() {
            that._logo.synth.trigger(
                0,
                ["C2"],
                0.0625,
                that.sampleData,
                null,
                null,
                false
            );
        }

        this.bodyTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().appendChild(this.bodyTable);

        var r1 = this.bodyTable.insertRow();
        var r2 = this.bodyTable.insertRow();
        var r3 = this.bodyTable.insertRow();

        this.sampleCanvas = document.createElement("canvas");
        this.sampleCanvas.style.width = SAMPLEWIDTH + "px";
        this.sampleCanvas.style.height = SAMPLEHEIGHT + "px";
        this.sampleCanvas.style.margin = "1px";
        this.sampleCanvas.style.background = "rgba(255, 255, 255, 1)";



        var tcCell = r1.insertCell();
        tcCell.appendChild(this.sampleCanvas);
        tcCell.setAttribute("rowspan", "3");

        this._logo.textMsg(_("Record a sample to use as an instrument."));
        this.resume();

        widgetWindow.sendToCenter();
    };
}

async function getBrowserAudio({constraints}) {
  let stream = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    /* use the stream */
  } catch(err) {
    /* handle the error */
  }
}
