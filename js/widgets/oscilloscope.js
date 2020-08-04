// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function Oscilloscope() {
    const ICONSIZE = 32;
    const analyserSize = 8192;

    var beginnerMode = localStorage.beginnerMode;

    this.init = function(logo) {
        this._logo = logo;

        this.playingNow = false;

        var widgetWindow = window.widgetWindows.windowFor(
            this,
            "oscilloscope"
        );
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	    widgetWindow.show();
        
        let that = this;
        widgetWindow.onclose = function() {
            cancelAnimationFrame(that.drawVisual);
            logo.pitchAnalyser = null;
            this.destroy();
        };

        let options = [];
        for (let i = 0 ;i<logo.turtles.turtleList.length ;i++) options.push(i);

        this.turtleX = widgetWindow.addSelectorButton(
            options,
            0            
        )
        this.turtleX.onchange = () => {
            logo.pitchAnalyser = null;
            this.reconnectSynthsToAnalyser(this.turtleX.value || 0);
        }

        let step = 10 ;
        this.zoomFactor = 40.0 ;
        this.verticalOffset = 0 ;
        widgetWindow.addButton(
            "up.svg",
            ICONSIZE,
            _("UP")
        ).onclick = () => {
            this.verticalOffset -= step;
        };

        widgetWindow.addButton(
            "down.svg",
            ICONSIZE,
            _("DOWN")
        ).onclick = () => {
            this.verticalOffset += step;
        };

        widgetWindow.addButton(
            "",
            ICONSIZE,
            _("ZOOM IN")
        ).onclick = () => {
            this.zoomFactor += step;
        };

        widgetWindow.addButton(
            "",
            ICONSIZE,
            _("ZOOM OUT")
        ).onclick = () => {
            this.zoomFactor -= step;
        };

        // this.channelY = widgetWindow.addButton(
        //     "",
        //     ICONSIZE,
        //     _("start")+'Y'
        // ).onclick = () => {
            
        // };

        widgetWindow.sendToCenter();
        this.widgetWindow = widgetWindow;
        this.reconnectSynthsToAnalyser(this.turtleX.value);
        this.makeCanvas();
    };

    this.reconnectSynthsToAnalyser = (turtle) => {
        if (this._logo.pitchAnalyser === null) {
            this._logo.pitchAnalyser = new Tone.Analyser({
                type: "waveform",
                size: analyserSize,
            });
        }
        for (let synth in instruments[turtle])
            instruments[turtle][synth].connect(this._logo.pitchAnalyser);
    }

    this.makeCanvas = function() {
        let canvas = document.createElement("canvas");
        canvas.height = 400;
        canvas.width = 700;
        this.widgetWindow.getWidgetBody().appendChild(canvas);
        let canvasCtx = canvas.getContext('2d');
        let WIDTH = 700 ,HEIGHT = 400;
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        let draw = () => {
            console.debug("oscilloscope running");
            this.drawVisual = requestAnimationFrame(draw);
            canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            var dataArray = this._logo.pitchAnalyser.getValue();
            let bufferLength = dataArray.length ;
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
            canvasCtx.beginPath();
            var sliceWidth = WIDTH * this.zoomFactor / bufferLength;
            var x = 0;  
            for(var i = 0; i < bufferLength; i++) {

                var v = dataArray[i];
                var y = HEIGHT/2*(1 - v) + this.verticalOffset;

                if(i === 0) {
                  canvasCtx.moveTo(x, y);
                } else {
                  canvasCtx.lineTo(x, y);
                }
  
                x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height/2);
            canvasCtx.stroke();
        };
        draw();
    }
}
