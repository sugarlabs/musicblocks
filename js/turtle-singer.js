/**
 * @file turtle-singer.js
 * @description Minimal AMD implementation of the Singer module.
 */

if (typeof define === "function" && define.amd) {
    define("activity/turtle-singer", ["activity/logoconstants"], function (logoconstants) {
        "use strict";

        const { TARGETBPM, TONEBPM, DEFAULTVOLUME } = logoconstants;

        /**
         * Singer constructor
         * @constructor
         */
        function Singer() {
            this.masterBPM = TARGETBPM;
            this.defaultBPMFactor = TONEBPM / TARGETBPM;
            this.masterVolume = [DEFAULTVOLUME];
        }

        // Maintain legacy window.Singer exposure
        if (typeof window !== "undefined") {
            window.Singer = Singer;
        }

        return Singer;
    });
}

// CommonJS export for Node.js test environments
if (typeof module !== "undefined" && module.exports) {
    const Singer = function Singer() {
        this.masterBPM = 90;
        this.defaultBPMFactor = 240 / 90;
        this.masterVolume = [50];
    };

    module.exports = Singer;
}
