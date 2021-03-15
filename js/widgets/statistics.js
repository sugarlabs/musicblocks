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

/*
  global logo, blocks, docById, _showHideAuxMenu, analyzeProject, runAnalytics, scoreToChartData,
  getChartOptions, loading:writable, Chart
*/
/*
Globals location
- js/activity.js
    logo, blocks, _showHideAuxMenu
- js/utils/utils.js
    docById
- js/rubrics.js
    analyzeProject, runAnalytics, scoreToChartData, getChartOptions
/* exported StatsWindow */

/** This widget displays the status of selected parameters and notes as they are being played. */
class StatsWindow {
    /**
     * @constructor
     */
    constructor() {
        this.widgetWindow = window.widgetWindows.windowFor(this, "stats", "stats");
        this.widgetWindow.clear();
        this.widgetWindow.show();
        this.widgetWindow.onclose = () => {
            blocks.showBlocks();
            this.widgetWindow.destroy();
            logo.statsWindow = undefined;
        };
        this.doAnalytics();

        this.widgetWindow.onmaximize = () => {
            this.widgetWindow.getWidgetBody().innerHTML = "";
            if (this.widgetWindow.isMaximized()) {
                this.widgetWindow.getWidgetBody().style.display = "flex";
                this.widgetWindow.getWidgetBody().style.justifyContent = "space-between";
                this.widgetWindow.getWidgetBody().style.padding = "0 2vw";
            } else {
                this.widgetWindow.getWidgetBody().style.padding = "0 0";
            }
            this.doAnalytics();
        };
        this.widgetWindow.sendToCenter();
    }

    /**
     * Renders and carries out analysis of the MB project.
     * @public
     * @returns {void}
     */
    doAnalytics() {
        toolbar.closeAuxToolbar(_showHideAuxMenu);
        blocks.activeBlock = null;
        const myChart = docById("myChart");
        const ctx = myChart.getContext("2d");
        loading = true;
        document.body.style.cursor = "wait";

        let myRadarChart = null;
        const scores = analyzeProject(blocks);
        runAnalytics(logo);
        const data = scoreToChartData(scores);
        const __callback = () => {
            const imageData = myRadarChart.toBase64Image();
            const img = new Image();
            img.src = imageData;
            if (this.widgetWindow.isMaximized()) {
                img.width = this.widgetWindow.getWidgetFrame().getBoundingClientRect().height - 80;
            } else {
                img.width = 200;
            }
            this.widgetWindow.getWidgetBody().appendChild(img);
            logo.showBlocksAfterRun = false;
            document.body.style.cursor = "default";
        };
        const options = getChartOptions(__callback);
        myRadarChart = new Chart(ctx).Radar(data, options);

        this.jsonObject = document.createElement("ul");
        this.jsonObject.style.float = "left";
        this.jsonObject.style.listStyleType = "none";
        this.widgetWindow.getWidgetBody().appendChild(this.jsonObject);
    }

    /**
     * @public
     * @param {Array} stats
     * @returns {void}
     */
    displayInfo(stats) {
        const lowHertz = stats["lowestNote"][2] + 0.5;
        const highHertz = stats["highestNote"][2] + 0.5;
        this.jsonObject.innerHTML =
            "<li>duples: " +
            stats["duples"] +
            "</li>" +
            "<li>triplets: " +
            stats["triplets"] +
            "</li>" +
            "<li>quintuplets: " +
            stats["quintuplets"] +
            "</li>" +
            "<li>pitch names: " +
            Array.from(stats["pitchNames"]) +
            "</li>" +
            "<li>number of notes: " +
            stats["numberOfNotes"] +
            "</li>" +
            "<li>lowest note: " +
            stats["lowestNote"][0] +
            " , " +
            lowHertz.toFixed(0) +
            "Hz</li>" +
            "<li>highest note: " +
            stats["highestNote"][0] +
            " , " +
            highHertz.toFixed(0) +
            "Hz</li>" +
            "<li>rests used: " +
            stats["rests"] +
            "</li>" +
            "<li>ornaments used: " +
            stats["ornaments"] +
            "</li>";
    }
}
