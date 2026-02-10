/**
 * @file logoconstants.js
 * @description Core constants for the Logo subsystem (Minimal AMD implementation).
 */

if (typeof define === "function" && define.amd) {
    define("activity/logoconstants", [], function () {
        "use strict";

        const TARGETBPM = 90;
        const TONEBPM = 240;
        const DEFAULTVOLUME = 50;

        const constants = { TARGETBPM, TONEBPM, DEFAULTVOLUME };

        // Legacy window exposure for backward compatibility
        if (typeof window !== "undefined") {
            window.TARGETBPM = TARGETBPM;
            window.TONEBPM = TONEBPM;
            window.DEFAULTVOLUME = DEFAULTVOLUME;
        }

        return constants;
    });
}

// CommonJS export for Node.js test environments
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        TARGETBPM: 90,
        TONEBPM: 240,
        DEFAULTVOLUME: 50
    };
}
