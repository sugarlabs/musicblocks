// Copyright (c) 2020 Saksham Mrig

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
    let execution = 1;
    
    this.init = function(logo) {
        this._logo = logo;
        this.pitchAnalysers = {};
        this.playingNow = false;
        if (this.drawVisualIDs) {
            for (let id of Object.keys(this.drawVisualIDs)) {
                cancelAnimationFrame(this.drawVisualIDs[id]);
            }
        }
        this.drawVisualIDs = {};
        var widgetWindow = window.widgetWindows.windowFor(
            this,
            "oscilloscope"
        );
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
            widgetWindow.show();
        
        widgetWindow.onclose = () => {
            for (let turtle of this.divisions) {
                let turtleIdx = logo.turtles.turtleList.indexOf(turtle);
                cancelAnimationFrame(this.drawVisualIDs[turtleIdx]);
            }
            this.pitchAnalysers = {};
            widgetWindow.destroy();
        };

        let step = 10 ;
        this.zoomFactor = 40.0 ;
        this.verticalOffset = 0 ;
        let zoomInButton = widgetWindow.addButton(
            "",
            ICONSIZE,
            _("ZOOM IN")
        );
        zoomInButton.onclick = () => {
            this.zoomFactor += step;
        };
        zoomInButton.children[0].src =
            "data:image/svg+xml;base64," +
            window.btoa(unescape(encodeURIComponent(SMALLERBUTTON)));
        
        let zoomOutButton = widgetWindow.addButton(
            "",
            ICONSIZE,
            _("ZOOM OUT")
            );
        zoomOutButton.onclick = () => {
            this.zoomFactor -= step;
        };

        zoomOutButton.children[0].src =
            "data:image/svg+xml;base64," +
            window.btoa(unescape(encodeURIComponent(BIGGERBUTTON)));

        widgetWindow.sendToCenter();
        this.widgetWindow = widgetWindow;
        this.divisions = [];
        for (let turtle of logo.oscilloscopeTurtles) {
            if (turtle && !turtle.inTrash) this.divisions.push(turtle);
        }
        for (let turtle of this.divisions) {
            turtleIdx = logo.turtles.turtleList.indexOf(turtle);
            this.reconnectSynthsToAnalyser(turtleIdx);
            this.makeCanvas(700, 400 / this.divisions.length, turtle, turtleIdx);
        }
    };

    this.reconnectSynthsToAnalyser = (turtle) => {
        if (this.pitchAnalysers[turtle] === undefined) {
            this.pitchAnalysers[turtle] = new Tone.Analyser({
                type: "waveform",
                size: analyserSize,
            });
        }
        for (let synth in instruments[turtle])
            instruments[turtle][synth].connect(this.pitchAnalysers[turtle]);
    }

    this.makeCanvas = function(WIDTH,HEIGHT,turtle,turtleIdx) {
        let canvas = document.createElement("canvas");
        canvas.height = HEIGHT;
        canvas.width = WIDTH;
        this.widgetWindow.getWidgetBody().appendChild(canvas);
        let canvasCtx = canvas.getContext('2d');
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        let draw = () => {
            // console.debug("oscilloscope running");
            
            this.drawVisualIDs[turtleIdx] = requestAnimationFrame(draw);
            canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            var dataArray = this.pitchAnalysers[turtleIdx].getValue();
            let bufferLength = dataArray.length ;
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
            canvasCtx.lineWidth = 2;
            let rbga = turtle.painter._canvasColor
            canvasCtx.strokeStyle = rbga ;
            canvasCtx.beginPath();
            var sliceWidth = WIDTH * this.zoomFactor / bufferLength;
            var x = 0;  
            for(var i = 0; i < bufferLength; i++) {

                var v = dataArray[i];
                var y = HEIGHT / 2 * (1 - v) + this.verticalOffset;

                if(i === 0) {
                  canvasCtx.moveTo(x, y);
                } else {
                  canvasCtx.lineTo(x, y);
                }
  
                x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };
        if (execution === 1) {
            if (!this.playingNow) {
                console.debug("oscilloscope running");
            }
            draw();
        }
        else {

        }
    }
}
