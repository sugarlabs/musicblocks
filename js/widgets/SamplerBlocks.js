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

   _
*/
/*
    Globals location
    - js/utils/utils.js
        _
*/

/* exported SamplerBlocks */

/**
 * @file SamplerBlocks.js
 * @description Sampler widget saving to blocks: updating the Sampler block's arguments from the widget and saving the sample as a stack.
 *
 * The methods are moved as they were from the SampleWidget constructor. The constructor calls
 * SamplerBlocks.install.call(this), so `this` is still the widget.
 */

const SamplerBlocks = {
    /**
     * Adds these methods to a SampleWidget instance.
     * @returns {void}
     */
    install() {
        /**
         * Updates the blocks related to the sample.
         * @private
         * @returns {void}
         */
        this._updateBlocks = function () {
            let mainSampleBlock;
            let audiofileBlock;
            let solfegeBlock;
            let octaveBlock;
            // Include cent adjustment in the sample array
            this.sampleArray = [
                this.sampleName,
                this.sampleData,
                this.samplePitch,
                this.sampleOctave,
                this.centAdjustmentValue || 0
            ];
            const getBlock = id =>
                id !== null && id !== undefined ? this.activity.blocks.blockList[id] : null;
            const timbreBlk = getBlock(this.timbreBlock);
            if (timbreBlk && timbreBlk.connections) {
                mainSampleBlock = timbreBlk.connections[1];
                const mainBlk = getBlock(mainSampleBlock);
                if (mainBlk) {
                    mainBlk.value = this.sampleArray;
                    mainBlk.updateCache();
                    audiofileBlock = mainBlk.connections && mainBlk.connections[1];
                    solfegeBlock = mainBlk.connections && mainBlk.connections[2];
                    octaveBlock = mainBlk.connections && mainBlk.connections[3];
                    const audioBlk = getBlock(audiofileBlock);
                    if (audioBlk) {
                        audioBlk.value = [this.sampleName, this.sampleData];
                        if (audioBlk.text) audioBlk.text.text = this.sampleName;
                        audioBlk.updateCache();
                    }
                    const solBlk = getBlock(solfegeBlock);
                    if (solBlk) {
                        solBlk.value = this.samplePitch;
                        if (solBlk.text) solBlk.text.text = this.samplePitch;
                        solBlk.updateCache();
                    }
                    const octBlk = getBlock(octaveBlock);
                    if (octBlk) {
                        octBlk.value = this.sampleOctave;
                        if (octBlk.text) octBlk.text.text = this.sampleOctave;
                        octBlk.updateCache();
                    }

                    // Update the block display to show cent adjustment if applicable
                    if (this.centAdjustmentValue && this.centAdjustmentValue !== 0) {
                        const centText =
                            (this.centAdjustmentValue > 0 ? "+" : "") +
                            this.centAdjustmentValue +
                            "¢";
                        if (
                            this.activity.blocks.blockList[mainSampleBlock].text &&
                            this.activity.blocks.blockList[mainSampleBlock].text.text
                        ) {
                            // Append cent adjustment to the block text if possible
                            const currentText =
                                this.activity.blocks.blockList[mainSampleBlock].text.text;
                            if (!currentText.includes("¢")) {
                                this.activity.blocks.blockList[mainSampleBlock].text.text +=
                                    " " + centText;
                            }
                        }
                    }

                    this.activity.refreshCanvas();
                    this.activity.saveLocally();
                }
            }
        };

        /**
         * Saves the sample and generates a new sample block with the provided data.
         * @private
         * @returns {void}
         */
        this.__save = function () {
            const that = this;
            this._setWidgetTimeout(function () {
                that._addSample();

                // Include the cent adjustment value in the sample block
                const centAdjustment = that.centAdjustmentValue || 0;

                const newStack = [
                    [0, "settimbre", 100, 100, [null, 1, null, 5]],
                    [
                        1,
                        [
                            "customsample",
                            {
                                value: [
                                    that.sampleName,
                                    that.sampleData,
                                    that.samplePitch,
                                    that.sampleOctave,
                                    centAdjustment
                                ]
                            }
                        ],
                        100,
                        100,
                        [0, 2, 3, 4]
                    ],
                    [2, ["audiofile", { value: [that.sampleName, that.sampleData] }], 0, 0, [1]],
                    [3, ["solfege", { value: that.samplePitch }], 0, 0, [1]],
                    [4, ["number", { value: that.sampleOctave }], 0, 0, [1]],
                    [5, "hidden", 0, 0, [0, null]]
                ];

                that.activity.blocks.loadNewBlocks(newStack);
                activity.textMsg(_("A new sample block was generated."), 3000);
            }, 1000);
        };

        /**
         * Saves the sample.
         * @private
         * @returns {void}
         */
        this._saveSample = function () {
            this.__save();
        };

        /**
         * Gets the status of the save lock.
         * @private
         * @returns {boolean} The status of the save lock.
         */
        this._get_save_lock = function () {
            return this._save_lock;
        };
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = SamplerBlocks;
}
