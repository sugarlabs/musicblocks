/**
 * Tooltip data for Music Blocks.
 * decoupled from block logic for easier localization and maintenance.
 */

const TooltipsData = {
    // Block level tooltips
    blocks: {
        vibrato: _("Vibrato adds a pulsating change in pitch (like a singer's voice)."),
        chorus: _("Chorus makes a sound richer by layering it with slightly delayed copies."),
        tremolo: _("Tremolo adds a trembling effect by rapidly changing the volume.")
    },

    // Parameter level tooltips
    parameters: {
        "rate": _("How fast the effect pulsates or repeats."),
        "depth": _("How strong or intense the effect is."),
        "intensity": _("The amount of pitch variation in the vibrato."),
        "delay (ms)": _("The delay time between the original and layered sounds.")
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { TooltipsData };
} else {
    window.TooltipsData = TooltipsData;
}
