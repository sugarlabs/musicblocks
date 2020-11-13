function SampleWidget() {
    const SAMPLESYNTH = "bottle";
    const TEMPOINTERVAL = 5;
    const BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const SAMPLEWIDTH = 300;
    const TEMPOHEIGHT = 100;
    const YRADIUS = 75;

    this._xradius = YRADIUS / 3;

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

      var ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.fillStyle = "rgba(0,0,0,0)";

      ctx.ellipse(
          0,
          0,
          100,
          100,
          0,
          0,
          Math.PI * 2
      );

      ctx.fill();
      ctx.closePath();


    }

    this.__save = function() {
        var that = this;
        require("samples/banjo");
        setTimeout(function() {
            console.debug("saving the sample");
            var newStack = [
                [0, ["media", { value: "images/soundfile.svg", sample: BANJO_SAMPLE}], 100, 100, [null]]
            ];
            that._logo.blocks.loadNewBlocks(newStack);
            that._logo.textMsg(_("New sample block generated!"));
        }, 200 * i);
    };

    this._saveSample = function() {
        // Save a BPM block for each tempo.
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

        this.bodyTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().appendChild(this.bodyTable);

        var r1 = this.bodyTable.insertRow();
        var r2 = this.bodyTable.insertRow();
        var r3 = this.bodyTable.insertRow();

        this.sampleCanvas = document.createElement("canvas");
        this.sampleCanvas.style.width = SAMPLEWIDTH + "px";
        this.sampleCanvas.style.height = TEMPOHEIGHT + "px";
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
