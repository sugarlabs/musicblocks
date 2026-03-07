/**
 * Tooltip data for Music Blocks.
 * decoupled from block logic for easier localization and maintenance.
 */

const TooltipsData = {
    // Block level tooltips
    blocks: {
        vibrato: "Vibrato adds a pulsating change in pitch (like a singer's voice).",
        chorus: "Chorus makes a sound richer by layering it with slightly delayed copies.",
        tremolo: "Tremolo adds a trembling effect by rapidly changing the volume."
    },

    // Parameter level tooltips
    parameters: {
        "rate": "How fast the effect pulsates or repeats.",
        "depth": "How strong or intense the effect is.",
        "intensity": "The amount of pitch variation in the vibrato.",
        "delay (ms)": "The delay time between the original and layered sounds."
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { TooltipsData };
} else {
    window.TooltipsData = TooltipsData;
}
