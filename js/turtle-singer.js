define(["activity/logoconstants"], function (logoconstants) {
    "use strict";
    const { TARGETBPM, TONEBPM, DEFAULTVOLUME } = logoconstants;
    function Singer() {
        this.masterBPM = TARGETBPM;
        this.defaultBPMFactor = TONEBPM / TARGETBPM;
        this.masterVolume = [DEFAULTVOLUME];
    }
    return Singer;
});
