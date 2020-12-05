// Copyright (c) 2016-20 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget makes displays the status of selected parameters and
// notes as they are being played.

function StatsWindow() {
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;

    this.init = function(logo) {
        this._logo = logo;
        this.isOpen = true;

        let w = window.innerWidth;
        this._cellScale = w / 1200;
        let iconSize = ICONSIZE * this._cellScale;

        let widgetWindow = window.widgetWindows.windowFor(
            this,
            "stats",
            "stats"
        );
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	    widgetWindow.show();

        let that = this;

        widgetWindow.onclose = function() {
            that.isOpen = false;
            blocks.showBlocks();
            this.destroy();
        };
        this.doAnalytics();

        widgetWindow.sendToCenter();
    };

    /*  
     * Renders and carries out analysis
     * of the MB project
     */
    this.doAnalytics = function() {
        toolbar.closeAuxToolbar(_showHideAuxMenu);
        blocks.activeBlock = null;
        myChart = docById("myChart");

        // if (_isCanvasBlank(myChart) === false) {
        //     return;
        // }

        let ctx = myChart.getContext("2d");
        loading = true;
        document.body.style.cursor = "wait";

        let myRadarChart = null;
        let scores = analyzeProject(blocks);
        runAnalytics(logo)
        let data = scoreToChartData(scores);
        __callback = () => {
            imageData = myRadarChart.toBase64Image();
            img = new Image();
            img.src = imageData;
            img.width =  200;
            this.widgetWindow.getWidgetBody().appendChild(img)
            blocks.hideBlocks();
            logo.showBlocksAfterRun = false;
            document.body.style.cursor = "default";
        };
        options = getChartOptions(__callback);
        myRadarChart = new Chart(ctx).Radar(data, options);
        
        this.jsonObject = document.createElement('ul');
        this.jsonObject.style.float = 'left';
        this.widgetWindow.getWidgetBody().appendChild(this.jsonObject)

    };
    this.displayInfo = (stats) => {
	let lowHertz = stats["lowestNote"][2] + 0.5;
	let highHertz = stats["highestNote"][2] + 0.5;
        this.jsonObject.innerHTML = 
            '<li>duples: ' + stats["duples"] + '</li>'  + 
            '<li>triplets: ' + stats["triplets"] + '</li>'  + 
            '<li>quintuplets: ' + stats["quintuplets"] + '</li>'  + 
            '<li>pitch names: ' + Array.from(stats["pitchNames"]) + '</li>'  + 
            '<li>number of notes: ' + stats["numberOfNotes"] + '</li>'  + 
            '<li>lowest note: ' + stats["lowestNote"][0] + " , " + lowHertz.toFixed(0) + 'Hz</li>'  + 
            '<li>highest note: ' + stats["highestNote"][0] + " , " + highHertz.toFixed(0) + 'Hz</li>'  + 
            '<li>rests used: ' + stats["rests"] + '</li>'  + 
            '<li>ornaments used: ' + stats["ornaments"] + '</li>'
    }

}
