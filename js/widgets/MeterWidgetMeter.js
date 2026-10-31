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
   clampNumber, rationalToFraction
 */

/*
   Globals location
    - js/utils/utils-logic.js
        clampNumber, rationalToFraction
*/

/* exported MeterWidgetMeter */

/**
 * @file MeterWidgetMeter.js
 * @description Meter widget meter block: reading the number of beats and the beat value from the
 * Meter block the widget was opened with, and writing the toolbar values back on Reset.
 *
 * The methods are moved from the MeterWidget class, which copies them onto
 * MeterWidget.prototype (see MeterWidget.installModules), so `this` is still the widget.
 */
class MeterWidgetMeter {
    /**
     * Reads the Meter block and sets the beat value from it.
     *
     * @private
     * @returns {{beats: (number|undefined), beatCountBlock: (number|null),
     *     beatValueBlock: (number|null), noteValueBlock: (number|null)}} The number of beats (not
     *     set when there is no Meter block) and the blocks Reset writes to: the number of beats,
     *     the beat value and, when the beat value is a fraction, its denominator.
     */
    _readMeterBlock() {
        const blockList = this.activity.blocks.blockList;
        const meter = {
            beats: undefined,
            beatCountBlock: null,
            beatValueBlock: null,
            noteValueBlock: null
        };

        // this._meterBlock is a raw blockList index captured when the widget
        // was requested; if that block has since been disposed (e.g. evicted
        // by the trash undo history), blockList[this._meterBlock] is null, so
        // guard the lookup itself rather than just the index being non-null.
        if (this._meterBlock === null || !blockList[this._meterBlock]) {
            return meter;
        }

        const c1 = blockList[this._meterBlock].connections[1];
        let v1 = c1 !== null ? blockList[c1].value : 4;
        v1 = isNaN(v1) ? 4 : clampNumber(v1, 1, 16);
        const c2 = blockList[this._meterBlock].connections[2];
        const c3 =
            c2 !== null && blockList[c2] && blockList[c2].connections
                ? blockList[c2].connections[2]
                : null;
        if (c2 !== null && blockList[c2]) {
            this._beatValue = blockList[c2].value;
        }

        meter.beats = v1;
        meter.beatCountBlock = c1;
        meter.beatValueBlock = c2 !== undefined ? c2 : null;
        meter.noteValueBlock = c3 !== undefined ? c3 : null;
        return meter;
    }

    /**
     * The beat note value shown in the toolbar: the denominator of the beat value, which is what
     * Reset changes, so 3/8 shows 8 rather than 1 / (3/8).
     *
     * @private
     * @param {object} meter - What _readMeterBlock returned.
     * @returns {number}
     */
    _noteValue(meter) {
        const blockList = this.activity.blocks.blockList;
        const denominator = meter.noteValueBlock !== null ? blockList[meter.noteValueBlock] : null;
        if (denominator && typeof denominator.value === "number") {
            return denominator.value;
        }
        if (typeof this._beatValue === "number" && this._beatValue > 0) {
            return rationalToFraction(this._beatValue)[1];
        }
        return 1 / this._beatValue;
    }

    /**
     * Writes the number of beats and the beat note value into the Meter block. The beat note
     * value replaces the denominator of the beat value and keeps its numerator, so 3/8 with a
     * note value of 4 becomes 3/4.
     *
     * @private
     * @param {object} meter - What _readMeterBlock returned.
     * @param {number} beats
     * @param {number} noteValue
     * @returns {void}
     */
    _writeMeterBlock(meter, beats, noteValue) {
        const blockList = this.activity.blocks.blockList;

        if (meter.beatCountBlock !== null) {
            this._setBlockValue(blockList[meter.beatCountBlock], beats);
        }

        if (meter.noteValueBlock !== null) {
            this._setBlockValue(blockList[meter.noteValueBlock], noteValue);
        } else if (meter.beatValueBlock !== null) {
            // A plain number beat value, such as 0.375 for 3/8.
            const beatValueBlock = blockList[meter.beatValueBlock];
            if (
                beatValueBlock &&
                beatValueBlock.name === "number" &&
                typeof beatValueBlock.value === "number" &&
                beatValueBlock.value > 0
            ) {
                const numerator = rationalToFraction(beatValueBlock.value)[0];
                this._setBlockValue(beatValueBlock, numerator / noteValue);
            }
        }
    }

    /**
     * Sets the value of a number block and the label drawn on it.
     *
     * @private
     * @param {object} blk - The block.
     * @param {number} value
     * @returns {void}
     */
    _setBlockValue(blk, value) {
        if (!blk) {
            return;
        }

        blk.value = value;
        if (blk.text) blk.text.text = String(value);
        if (blk.container && blk.container.children) {
            blk.container.setChildIndex(blk.text, blk.container.children.length - 1);
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = MeterWidgetMeter;
}
