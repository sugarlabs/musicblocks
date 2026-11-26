/**
 * MusicBlocks
 *
 * @copyright 2019-21 Walter Bender
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global
   platformColor, docById, wheelnav, slicePath
 */

/*
   Globals location
    - lib/wheelnav
        slicePath, wheelnav
    - js/utils/utils.js
        docById
    - js/utils/platformstyle.js
        platformColor
*/

/* exported MeterWidgetWheel */

/**
 * @file MeterWidgetWheel.js
 * @description Meter widget pie menu: the wheel of beats, the strong beat ring the child clicks
 * and the default strong beats of common meters.
 *
 * The methods are moved from the MeterWidget class, which copies them onto
 * MeterWidget.prototype (see MeterWidget.installModules), so `this` is still the widget.
 */
class MeterWidgetWheel {
    /**
     * Private method to create and initialize the pie menu for strong beat selection.
     *
     * @private
     * @param {number} numberOfBeats - The number of beats to be displayed.
     * @param {number} beatValue - The value of each beat.
     * @returns {void}
     */
    _piemenuMeter(numberOfBeats, beatValue) {
        // pie menu for strong beat selection

        docById("meterWheelDiv").style.display = "flex";
        docById("meterWheelDiv").style.justifyContent = "center";

        // Use advanced constructor for multiple wheelnavs in the same div.
        // The meterWheel is used to hold the strong beats.
        this._meterWheel = new wheelnav("meterWheelDiv", null, 400, 400);
        // Strong beat is shown on this wheel
        this._beatWheel = new wheelnav("_beatWheel", this._meterWheel.raphael);
        // Play wheel is to show which beat is playing at any one time.
        this._playWheel = new wheelnav("_playWheel", this._meterWheel.raphael);

        wheelnav.cssMeter = true;

        // Use the mode wheel color scheme
        this._meterWheel.colors = platformColor.modeWheelcolors;

        this._meterWheel.slicePathFunction = slicePath().DonutSlice;
        this._meterWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._meterWheel.slicePathCustom.minRadiusPercent = 0.4;
        this._meterWheel.slicePathCustom.maxRadiusPercent = 0.75;
        this._meterWheel.sliceSelectedPathCustom = this._meterWheel.slicePathCustom;
        this._meterWheel.sliceInitPathCustom = this._meterWheel.slicePathCustom;

        // Disable rotation, set navAngle and create the menus
        this._meterWheel.clickModeRotate = false;
        this._meterWheel.navAngle = -90;
        // this._meterWheel.selectedNavItemIndex = 2;
        this._meterWheel.animatetime = 0; // 300;

        if (numberOfBeats > 16) {
            numberOfBeats = 16;
        }

        const labels = [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16"
        ];
        let beatList = [];
        this._strongBeats = [];
        for (let i = 0; i < numberOfBeats; i++) {
            beatList.push(labels[i]);
            this._strongBeats.push(false);
        }

        this._meterWheel.createWheel(beatList);

        this._beatWheel.colors = platformColor.modeWheelcolors;
        this._beatWheel.slicePathFunction = slicePath().DonutSlice;
        this._beatWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._beatWheel.slicePathCustom.minRadiusPercent = 0.75;
        this._beatWheel.slicePathCustom.maxRadiusPercent = 0.9;
        this._beatWheel.sliceSelectedPathCustom = this._beatWheel.slicePathCustom;
        this._beatWheel.sliceInitPathCustom = this._beatWheel.slicePathCustom;
        this._beatWheel.clickModeRotate = false;
        this._beatWheel.navAngle = -90;
        this._beatWheel.titleRotateAngle = 90;

        beatList = [];
        for (let i = 0; i < numberOfBeats; i++) {
            beatList.push("x");
        }

        this._beatWheel.createWheel(beatList);

        this._playWheel.colors = [platformColor.orange];
        this._playWheel.slicePathFunction = slicePath().DonutSlice;
        this._playWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._playWheel.slicePathCustom.minRadiusPercent = 0.3;
        this._playWheel.slicePathCustom.maxRadiusPercent = 0.4;
        this._playWheel.sliceSelectedPathCustom = this._playWheel.slicePathCustom;
        this._playWheel.sliceInitPathCustom = this._playWheel.slicePathCustom;
        this._playWheel.clickModeRotate = false;
        this._playWheel.navAngle = -90;
        this._playWheel.titleRotateAngle = 90;

        beatList = [];
        for (let i = 0; i < numberOfBeats; i++) {
            beatList.push(" ");
        }

        this._playWheel.createWheel(beatList);

        for (let i = 0; i < numberOfBeats; i++) {
            this._playWheel.navItems[i].navItem.hide();
        }

        // If a meterWheel sector is selected, show the corresponding
        // beat wheel sector.
        const __setBeat = () => {
            const i = this._meterWheel.selectedNavItemIndex;
            this._strongBeats[i] = true;
            this._beatWheel.navItems[i].navItem.show();
        };

        // If a beatWheel sector is selected, hide it.
        const __clearBeat = () => {
            const i = this._beatWheel.selectedNavItemIndex;
            this._beatWheel.navItems[i].navItem.hide();
            this._strongBeats[i] = false;
        };

        for (let i = 0; i < numberOfBeats; i++) {
            this._meterWheel.navItems[i].navigateFunction = __setBeat;
            this._beatWheel.navItems[i].navigateFunction = __clearBeat;
            // Start with all beats hidden , except default strong/weak .
            this._beatWheel.navItems[i].navItem.hide();
        }

        this._setupDefaultStrongWeakBeats(numberOfBeats, beatValue);
    }

    /**
     * Private method to set up default strong and weak beats based on the beat value and number of beats.
     *
     * @private
     * @param {number} numberOfBeats - The number of beats to be displayed.
     * @param {number} beatValue - The value of each beat.
     * @returns {void}
     */
    _setupDefaultStrongWeakBeats(numberOfBeats, beatValue) {
        if (beatValue === 0.25 && numberOfBeats === 4) {
            this._strongBeats[0] = true;
            this._strongBeats[2] = true;
            this._beatWheel.navItems[0].navItem.show();
            this._beatWheel.navItems[2].navItem.show();
        } else if (beatValue === 0.25 && numberOfBeats === 2) {
            this._strongBeats[0] = true;
            this._beatWheel.navItems[0].navItem.show();
        } else if (beatValue === 0.25 && numberOfBeats === 3) {
            this._strongBeats[0] = true;
            this._beatWheel.navItems[0].navItem.show();
        } else if (beatValue === 0.125 && numberOfBeats === 6) {
            this._strongBeats[0] = true;
            this._strongBeats[3] = true;
            this._beatWheel.navItems[0].navItem.show();
            this._beatWheel.navItems[3].navItem.show();
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = MeterWidgetWheel;
}
