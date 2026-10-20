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

   _, CUSTOMSAMPLES
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/utils/synthutils.js
        CUSTOMSAMPLES
*/

/* exported SamplerFiles */

/**
 * @file SamplerFiles.js
 * @description Sampler widget loading samples: file input, drag and drop, adding a sample, and the recording and file type messages.
 *
 * The methods are moved as they were from the SampleWidget constructor. The constructor calls
 * SamplerFiles.install.call(this), so `this` is still the widget.
 */

const SamplerFiles = {
    /**
     * Adds these methods to a SampleWidget instance.
     * @returns {void}
     */
    install() {
        /**
         * Gets the length of the sample and displays a warning if it exceeds 1MB.
         * @returns {void}
         */
        this.getSampleLength = function () {
            if (this.sampleData.length > 1333333) {
                this.activity.errorMsg(_("Warning: Sample is bigger than 1MB."), this.timbreBlock);
            }
        };

        /**
         * Displays a message indicating that recording has started.
         * @returns {void}
         */
        this.displayRecordingStartMessage = function () {
            activity.textMsg(_("Recording started"), 3000);
        };

        /**
         * Displays a message indicating that recording has stopped.
         * @returns {void}
         */
        this.displayRecordingStopMessage = function () {
            activity.textMsg(_("Recording complete"), 3000);
        };

        /**
         * Displays an error message when the uploaded sample is not a .wav file.
         * @returns {void}
         */
        this.showSampleTypeError = function () {
            this.activity.errorMsg(
                _("Upload failed: Sample is not a .wav file."),
                this.timbreBlock
            );
        };

        //To handle sample files
        this.handleFiles = sampleFile => {
            const reader = new FileReader();
            reader.readAsDataURL(sampleFile);

            reader.onload = () => {
                // if the file is of .wav type, save it
                if (
                    reader.result.substring(
                        reader.result.indexOf(":") + 1,
                        reader.result.indexOf(";")
                    ) === "audio/wav"
                ) {
                    if (reader.result.length <= 1333333) {
                        this.sampleData = reader.result;
                        this.sampleName = sampleFile.name;
                        this._addSample();
                    } else {
                        this.activity.errorMsg(
                            _("Warning: Your sample cannot be loaded because it is >1MB."),
                            this.timbreBlock
                        );
                    }
                } else {
                    this.showSampleTypeError();
                }
            };
        };

        //Drag-and-Drop sample files
        this._dragOverHandler = e => {
            e.preventDefault();
        };

        this._dropHandler = e => {
            e.preventDefault();
            const sampleFiles = e.dataTransfer.files[0];
            this.handleFiles(sampleFiles);
        };

        this.drag_and_drop = () => {
            this._dropZone = document.getElementsByClassName("samplerCanvas")[0];
            if (this._dropZone) {
                this._dropZone.addEventListener("dragover", this._dragOverHandler);
                this._dropZone.addEventListener("drop", this._dropHandler);
            }
        };

        /**
         * Adds the current sample to the list of custom samples.
         * @returns {void}
         */
        this._addSample = function () {
            for (let i = 0; i < CUSTOMSAMPLES.length; i++) {
                if (CUSTOMSAMPLES[i][0] === this.sampleName) {
                    // Update existing sample with new data and cent adjustment
                    CUSTOMSAMPLES[i] = [
                        this.sampleName,
                        this.sampleData,
                        this.samplePitch,
                        this.sampleOctave,
                        this.centAdjustmentValue || 0
                    ];
                    return;
                }
            }
            // Add new sample with cent adjustment
            CUSTOMSAMPLES.push([
                this.sampleName,
                this.sampleData,
                this.samplePitch,
                this.sampleOctave,
                this.centAdjustmentValue || 0
            ]);
        };
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = SamplerFiles;
}
