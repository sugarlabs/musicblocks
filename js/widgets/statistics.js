// Copyright (c) 2016-21 Walter Bender
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
   global

   docById, analyzeProject, runAnalytics, scoreToChartData,
   getChartOptions
 */

/* exported StatsWindow */

/** This widget displays the status of selected parameters and notes as they are being played. */
class StatsWindow {
    /**
     * @constructor
     */
    constructor(activity) {
        this.activity = activity;
        this.isOpen = true;
        this._inFlight = false;

        this.widgetWindow = window.widgetWindows.windowFor(this, "stats", "stats");
        this.widgetWindow.clear();
        this.widgetWindow.show();
        this.widgetWindow.addButton("reload.svg", 32, _("Refresh")).onclick = () => {
            this.refresh();
        };
        this.widgetWindow.onclose = () => {
            this.isOpen = false;
            this._inFlight = false;
            this.activity.blocks.showBlocks();
            this.widgetWindow.destroy();
            this.activity.logo.statsWindow = null;
        };

        // Lazy-load Chart.js on demand instead of eagerly at startup.
        // This saves ~3-5 MB of heap memory when the statistics widget
        // is never opened (the common case).
        // If Chart is already loaded (e.g. previously used), call synchronously.
        if (typeof window.Chart !== "undefined") {
            this.doAnalytics();
        } else {
            this._ensureChartLoaded()
                .then(() => {
                    this.doAnalytics();
                })
                .catch(err => {
                    console.error("Failed to load Chart.js:", err);
                });
        }

        this.widgetWindow.onmaximize = () => {
            this.widgetWindow.getWidgetBody().textContent = "";
            if (this.widgetWindow.isMaximized()) {
                this.widgetWindow.getWidgetBody().style.display = "flex";
                this.widgetWindow.getWidgetBody().style.justifyContent = "space-between";
                this.widgetWindow.getWidgetBody().style.padding = "0px 2vw";
            } else {
                this.widgetWindow.getWidgetBody().style.padding = "0px";
            }
            this.doAnalytics();
        };
        this.widgetWindow.sendToCenter();
    }

    /**
     * Re-runs analytics and updates the chart display.
     * @public
     * @returns {void}
     */
    refresh() {
        if (this._inFlight) {
            return;
        }
        this._inFlight = true;
        this.widgetWindow.getWidgetBody().replaceChildren();
        if (typeof window.Chart !== "undefined") {
            this.doAnalytics();
        } else {
            this._ensureChartLoaded()
                .then(() => {
                    this.doAnalytics();
                })
                .catch(err => {
                    this._inFlight = false;
                    console.error("Failed to load Chart.js:", err);
                });
        }
    }

    /**
     * Lazily loads Chart.js via RequireJS if not already available.
     * @returns {Promise<void>}
     */
    _ensureChartLoaded() {
        if (typeof window.Chart !== "undefined") {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            require(["Chart"], () => {
                if (typeof window.Chart !== "undefined") {
                    resolve();
                } else {
                    reject(new Error("Chart global not found after loading"));
                }
            }, reject);
        });
    }

    /**
     * Renders and carries out analysis of the MB project.
     * @public
     * @returns {void}
     */
    doAnalytics() {
        this.activity.blocks.activeBlock = null;
        const myChart = docById("myChart");

        const ctx = myChart.getContext("2d");
        this.activity.loading = true;
        document.body.style.cursor = "wait";

        let myRadarChart = null;
        const scores = analyzeProject(this.activity);
        runAnalytics(this.activity);
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
            this.activity.blocks.hideBlocks();
            this.activity.showBlocksAfterRun = false;
            document.body.style.cursor = "default";
            this._inFlight = false;
        };
        const options = getChartOptions(__callback);
        myRadarChart = new window.Chart(ctx).Radar(data, options);

        this.jsonObject = document.createElement("ul");
        this.jsonObject.style.float = "left";
        this.widgetWindow.getWidgetBody().appendChild(this.jsonObject);
    }

    /**
     * @public
     * @param {Array} stats
     * @returns {void}
     */
    displayInfo(stats) {
        const lowestNote = stats["lowestNote"];
        const highestNote = stats["highestNote"];
        const lowestNoteLabel = lowestNote
            ? `${lowestNote[0]},${(lowestNote[2] + 0.5).toFixed(0)}Hz`
            : "N/A";
        const highestNoteLabel = highestNote
            ? `${highestNote[0]},${(highestNote[2] + 0.5).toFixed(0)}Hz`
            : "N/A";
        const items = [
            ["duples", stats["duples"]],
            ["triplets", stats["triplets"]],
            ["quintuplets", stats["quintuplets"]],
            ["pitch names", Array.from(stats["pitchNames"]).join(", ")],
            ["number of notes", stats["numberOfNotes"]],
            ["lowest note", lowestNoteLabel],
            ["highest note", highestNoteLabel],
            ["rests used", stats["rests"]],
            ["ornaments used", stats["ornaments"]]
        ];

        if (stats["totalSeconds"] !== undefined) {
            const formatSecs =
                typeof formatSeconds === "function"
                    ? formatSeconds
                    : typeof UtilsLogic !== "undefined" && UtilsLogic.formatSeconds
                      ? UtilsLogic.formatSeconds
                      : sec => sec;
            items.push(["total duration", formatSecs(stats["totalSeconds"])]);
        }

        this.jsonObject.replaceChildren(
            ...items.map(([label, value], index) => {
                const li = document.createElement("li");
                li.textContent = `${label}: ${value}`;
                if (index === 3 || index === 5 || index === 6) {
                    li.style.whiteSpace = "pre-wrap";
                    li.style.width = "150px";
                }
                return li;
            })
        );
    }
}
/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = StatsWindow;
}
