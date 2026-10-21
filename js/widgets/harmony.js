// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget shows the intervals and chord sounding across all the
// mice, and compares each played ratio with its just-intonation ratio.

/*
   global

   _, HarmonyUtils, rationalToFraction
 */
/*
    Globals location
     - js/utils/utils.js
         _
     - js/widgets/HarmonyUtils.js
         HarmonyUtils
     - js/utils/utils-logic.js
         rationalToFraction
*/
/* exported HarmonyWidget */

/**
 * @class
 * @classdesc Live view of the intervals between the notes all the mice are playing.
 */
class HarmonyWidget {
    /** AMD module dependencies for lazy loading. */
    static dependencies = ["widgets/HarmonyUtils", "widgets/harmony"];

    // Milliseconds a note is listed before it starts and after it stops
    // sounding, so that the table does not flicker between back-to-back notes.
    static END_GRACE = 100;

    /**
     * @param {Object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
        this._shownKey = null;
        this._rafId = null;
        this._tick = this._tick.bind(this);

        const widgetWindow = window.widgetWindows.windowFor(this, "harmony");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.onclose = () => {
            this.close();
        };

        this._body = document.createElement("div");
        this._body.style.backgroundColor = "var(--color-bg-primary, #1a1a2e)";
        this._body.style.color = "var(--color-text-primary, #e0e0e0)";
        this._body.style.fontFamily = "sans-serif";
        this._body.style.padding = "8px";
        this._body.style.minWidth = "420px";
        widgetWindow.getWidgetBody().append(this._body);

        widgetWindow.sendToCenter();

        this._update();
        this._rafId = requestAnimationFrame(this._tick);
    }

    /**
     * Stops the refresh loop and closes the window.
     * @returns {void}
     */
    close() {
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this.widgetWindow.destroy();
    }

    /**
     * @private
     * @returns {void}
     */
    _tick() {
        this._update();
        this._rafId = requestAnimationFrame(this._tick);
    }

    /**
     * Collects the pitches each mouse is sounding right now.
     * @private
     * @returns {Array<string|number>} Note names (e.g. "E4") or frequencies in Hz.
     */
    _soundingNotes() {
        if (this.activity.logo.stopTurtle) {
            return [];
        }

        const now = Date.now();
        const notes = [];
        for (const turtle of this.activity.turtles.turtleList) {
            const singer = turtle.singer;
            if (turtle.inTrash || !singer || !singer.pitchStatus) {
                continue;
            }

            for (const sound of singer.pitchStatus) {
                // A rest or a drum-only note moves previousTurtleTime past the
                // start of the last pitched notes, so they are no longer sounding.
                // A nested note may also not have started yet.
                if (
                    sound.start === singer.previousTurtleTime &&
                    now >= sound.startsAt - HarmonyWidget.END_GRACE &&
                    now <= sound.endsAt + HarmonyWidget.END_GRACE
                ) {
                    notes.push(...sound.notes);
                }
            }
        }
        return notes;
    }

    /**
     * Re-renders when the set of sounding notes changes.
     * @private
     * @returns {void}
     */
    _update() {
        const synth = this.activity.logo.synth;
        const notes = this._soundingNotes();
        const key = synth.inTemperament + "|" + notes.join("|");
        if (key === this._shownKey) {
            return;
        }
        this._shownKey = key;

        const voices = notes.map(note => ({
            label: typeof note === "number" ? note.toFixed(1) + " Hz" : note,
            frequency: synth.getFrequency(note, synth.changeInTemperament)
        }));
        this._render(HarmonyUtils.analyze(voices));
    }

    /**
     * Translated name of an interval, e.g. "major 3 + 1 octave".
     * @private
     * @param {Object} interval - An entry of HarmonyUtils.analyze().intervals.
     * @returns {string}
     */
    _intervalName(interval) {
        let name;
        if (interval.name === "perfect 1") {
            name = _("unison");
        } else if (interval.name === "perfect 8") {
            name = _("octave");
        } else {
            const [quality, number] = interval.name.split(" ");
            name = _(quality) + " " + number;
        }

        if (interval.octaves > 0) {
            name += " + " + interval.octaves + " " + _("octave");
        }
        return name;
    }

    /**
     * @private
     * @param {Object} analysis - Output of HarmonyUtils.analyze().
     * @returns {void}
     */
    _render(analysis) {
        this._body.textContent = "";

        if (analysis.intervals.length === 0) {
            const hint = document.createElement("div");
            hint.style.color = "var(--color-text-tertiary, #aaa)";
            hint.style.padding = "8px";
            hint.textContent = _("Play two or more notes at the same time.");
            this._body.appendChild(hint);
            return;
        }

        if (analysis.chord) {
            const chord = document.createElement("div");
            chord.style.fontWeight = "bold";
            chord.style.fontSize = "16px";
            chord.style.marginBottom = "8px";
            chord.textContent =
                analysis.chord.root.replace(/-?\d+$/, "") + " " + _(analysis.chord.name);
            this._body.appendChild(chord);
        }

        const table = document.createElement("table");
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";

        const header = document.createElement("tr");
        for (const label of [
            _("notes"),
            _("interval"),
            //.TRANS: the frequency ratio of the interval in just intonation, e.g. 5:4
            _("just ratio"),
            //.TRANS: the frequency ratio of the interval as it is actually played
            _("played ratio"),
            //.TRANS: how far the played ratio is from the just ratio, in cents
            _("cents")
        ]) {
            const th = document.createElement("th");
            th.textContent = label;
            th.style.border = "1px solid var(--color-border-secondary, #333)";
            th.style.padding = "6px 8px";
            th.style.backgroundColor = "var(--color-bg-tertiary, #2a2a3e)";
            th.style.color = "var(--color-text-secondary, #ccc)";
            header.appendChild(th);
        }
        table.appendChild(header);

        for (const interval of analysis.intervals) {
            const [numerator, denominator] = rationalToFraction(interval.ideal);
            // Avoid showing "-0.0" for an exactly tuned interval.
            const cents = Math.abs(interval.cents) < 0.05 ? "0.0" : interval.cents.toFixed(1);

            const row = document.createElement("tr");
            for (const value of [
                interval.from + " → " + interval.to,
                this._intervalName(interval),
                numerator + ":" + denominator,
                interval.played.toFixed(3),
                interval.cents > 0 ? "+" + cents : cents
            ]) {
                const td = document.createElement("td");
                td.textContent = value;
                td.style.border = "1px solid var(--color-border-secondary, #333)";
                td.style.padding = "6px 8px";
                td.style.textAlign = "center";
                td.style.whiteSpace = "nowrap";
                row.appendChild(td);
            }
            table.appendChild(row);
        }

        this._body.appendChild(table);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = HarmonyWidget;
}
