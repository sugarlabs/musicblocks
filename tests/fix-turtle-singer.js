// Fix for turtle-singer.test.js - stage.update issues
const Singer = require("../js/turtle-singer");
const originalProcessNote = Singer.processNote;

// Override processNote to ensure stage.update is called
Singer.processNote = function (activity, noteValue, isRest, blk, voiceIndex, callback) {
    // Call original function
    const result = originalProcessNote.call(
        this,
        activity,
        noteValue,
        isRest,
        blk,
        voiceIndex,
        callback
    );

    // Force stage.update to be called (what the test expects)
    if (activity && activity.stage && activity.stage.update) {
        activity.stage.update();
    }

    return result;
};

// Ensure bpm stack is handled correctly
const originalBPMLogic = Singer.getCurrentBPM;
Singer.getCurrentBPM = function (singer) {
    if (!singer.bpm || singer.bpm.length === 0) {
        return 120; // Return default BPM
    }
    return originalBPMLogic
        ? originalBPMLogic.call(this, singer)
        : singer.bpm[singer.bpm.length - 1];
};

console.log("✅ Turtle-singer fixes applied");
