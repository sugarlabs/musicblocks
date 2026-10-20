// Copyright (c) 2021 Liza Malykhina
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

/*
   global

   _, docById, wheelnav, DRUMS, slicePath, platformColor
*/
/*
    Globals location
    - js/utils/utils.js
        _, docById
    - js/utils/musicutils.js
        DRUMS
    - js/utils/platformstyle.js
        platformColor
    - lib/wheelnav
        wheelnav, slicePath
*/

/* exported SamplerPieMenu */

/**
 * @file SamplerPieMenu.js
 * @description Sampler widget the pitch pie menu for choosing the sample's pitch, accidental and octave.
 *
 * The methods are moved as they were from the SampleWidget constructor. The constructor calls
 * SamplerPieMenu.install.call(this), so `this` is still the widget.
 */

const SamplerPieMenu = {
    /**
     * Adds these methods to a SampleWidget instance.
     * @returns {void}
     */
    install() {
        /**
         * Creates and initializes the pie menu for selecting pitch, accidentals, and octaves.
         * @returns {void}
         */
        this._createPieMenu = function () {
            docById("wheelDivptm").style.display = "";

            const accidentals = ["𝄪", "♯", "♮", "♭", "𝄫"];
            const noteLabels = ["ti", "la", "sol", "fa", "mi", "re", "do"];
            const drumLabels = [];
            let label;
            for (let i = 0; i < DRUMS.length; i++) {
                label = _(DRUMS[i]);
                drumLabels.push(label);
            }

            this._pitchWheel = new wheelnav("wheelDivptm", null, 600, 600);
            this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);

            this._accidentalsWheel = new wheelnav("_accidentalsWheel", this._pitchWheel.raphael);
            this._octavesWheel = new wheelnav("_octavesWheel", this._pitchWheel.raphael);

            wheelnav.cssMode = true;

            this._pitchWheel.keynavigateEnabled = false;
            this._pitchWheel.slicePathFunction = slicePath().DonutSlice;
            this._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();

            this._pitchWheel.colors = platformColor.pitchWheelcolors;
            this._pitchWheel.slicePathCustom.minRadiusPercent = 0.2;
            this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.5;

            this._pitchWheel.sliceSelectedPathCustom = this._pitchWheel.slicePathCustom;
            this._pitchWheel.sliceInitPathCustom = this._pitchWheel.slicePathCustom;

            this._pitchWheel.animatetime = 0; // 300;
            this._pitchWheel.createWheel(noteLabels);

            this._exitWheel.colors = platformColor.exitWheelcolors;
            this._exitWheel.slicePathFunction = slicePath().DonutSlice;
            this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
            this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
            this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
            this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
            this._exitWheel.clickModeRotate = false;
            this._exitWheel.createWheel(["×", " "]);
            if (this._exitWheel.navItems && this._exitWheel.navItems.length > 1) {
                this._exitWheel.navItems[1].enabled = false;
            }
            if (typeof window.configureExitWheel === "function") {
                window.configureExitWheel(this._exitWheel);
            }
            if (this._exitWheel.navItems && this._exitWheel.navItems[0]) {
                const item = this._exitWheel.navItems[0];
                if (item.sliceSelectedAttr) {
                    item.sliceSelectedAttr.cursor = "pointer";
                    item.sliceHoverAttr.cursor = "pointer";
                    item.titleSelectedAttr.cursor = "pointer";
                    item.titleHoverAttr.cursor = "pointer";
                }
            }

            this._accidentalsWheel.colors = platformColor.accidentalsWheelcolors;
            this._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
            this._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.5;
            this._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
            this._accidentalsWheel.sliceSelectedPathCustom = this._accidentalsWheel.slicePathCustom;
            this._accidentalsWheel.sliceInitPathCustom = this._accidentalsWheel.slicePathCustom;

            const accidentalLabels = [];
            for (let i = 0; i < accidentals.length; i++) {
                accidentalLabels.push(accidentals[i]);
            }

            for (let i = 0; i < 9; i++) {
                accidentalLabels.push(null);
                this._accidentalsWheel.colors.push(platformColor.accidentalsWheelcolorspush);
            }

            this._accidentalsWheel.animatetime = 0; // 300;
            this._accidentalsWheel.createWheel(accidentalLabels);
            this._accidentalsWheel.setTooltips([
                _("double sharp"),
                _("sharp"),
                _("natural"),
                _("flat"),
                _("double flat")
            ]);

            this._octavesWheel.colors = platformColor.octavesWheelcolors;
            this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
            this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._octavesWheel.slicePathCustom.minRadiusPercent = 0.75;
            this._octavesWheel.slicePathCustom.maxRadiusPercent = 0.95;
            this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
            this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
            const octaveLabels = [
                "8",
                "7",
                "6",
                "5",
                "4",
                "3",
                "2",
                "1",
                null,
                null,
                null,
                null,
                null,
                null
            ];
            this._octavesWheel.animatetime = 0; // 300;
            this._octavesWheel.createWheel(octaveLabels);

            const x = this.pitchBtn.getBoundingClientRect().x;
            const y = this.pitchBtn.getBoundingClientRect().y;

            docById("wheelDivptm").style.position = "absolute";
            docById("wheelDivptm").style.height = "300px";
            docById("wheelDivptm").style.width = "300px";
            docById("wheelDivptm").style.left =
                Math.min(
                    this.activity.canvas.width - 200,
                    Math.max(0, x * this.activity.getStageScale())
                ) + "px";
            docById("wheelDivptm").style.top =
                Math.min(
                    this.activity.canvas.height - 250,
                    Math.max(0, y * this.activity.getStageScale())
                ) + "px";

            const octaveValue = this.octaveCenter;
            const accidentalsValue = 4 - this.accidentalCenter;
            const noteValue = 6 - this.pitchCenter;

            this._accidentalsWheel.navigateWheel(accidentalsValue);
            this._octavesWheel.navigateWheel(octaveLabels.indexOf(octaveValue.toString()));
            this._pitchWheel.navigateWheel(noteValue);

            const closePieMenu = () => {
                docById("wheelDivptm").style.display = "none";
                if (this._pitchWheel) this._pitchWheel.removeWheel();
                if (this._exitWheel) this._exitWheel.removeWheel();
                if (this._accidentalsWheel) this._accidentalsWheel.removeWheel();
                if (this._octavesWheel) this._octavesWheel.removeWheel();
            };
            this._exitWheel.navItems[0].navigateFunction = closePieMenu;

            const __selectionChanged = () => {
                const label =
                    this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
                const attr =
                    this._accidentalsWheel.navItems[this._accidentalsWheel.selectedNavItemIndex]
                        .title;
                const octave = Number(
                    this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title
                );

                this._usePitch(label);
                this._useAccidental(attr);
                this._useOctave(octave);

                this.getPitchName();
            };

            const __pitchPreview = () => {
                __selectionChanged();
                this._playReferencePitch();
            };

            for (let i = 0; i < noteLabels.length; i++) {
                this._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
            }

            for (let i = 0; i < accidentals.length; i++) {
                this._accidentalsWheel.navItems[i].navigateFunction = __pitchPreview;
            }

            for (let i = 0; i < 8; i++) {
                this._octavesWheel.navItems[i].navigateFunction = __pitchPreview;
            }
        };
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = SamplerPieMenu;
}
