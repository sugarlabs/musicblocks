/* global define, window */
define(["p5.sound.min"], function () {
    // Restore AudioContext if it was overwritten
    if (window.OriginalAudioContext && window.AudioContext !== window.OriginalAudioContext) {
        window.AudioContext = window.OriginalAudioContext;
    }
    if (
        window.OriginalWebkitAudioContext &&
        window.webkitAudioContext !== window.OriginalWebkitAudioContext
    ) {
        window.webkitAudioContext = window.OriginalWebkitAudioContext;
    }

    // Restore Tone.js
    if (window.OriginalTone) {
        if (window.Tone !== window.OriginalTone) {
            window.Tone = window.OriginalTone;
        } else {
            // p5.sound  is not overwriting by Tone
        }
    } else {
        console.warn("p5-sound-adapter: No OriginalTone to restore!");
    }

    // Fix AudioNode.prototype.connect return value
    // We force this patch because p5.sound is known to break chaining,
    // and sometimes the reference check fails (e.g. if p5.sound wraps it in a way that preserves identity or if we missed the timing).
    // The error "s.connect(...) is undefined" confirms we MUST ensure a return value.
    if (window.AudioNode && window.AudioNode.prototype) {
        const currentConnect = window.AudioNode.prototype.connect;

        // Avoid double-patching if we already did it
        if (!currentConnect.isP5AdapterPatched) {
            window.AudioNode.prototype.connect = function () {
                const result = currentConnect.apply(this, arguments);
                // If the result is undefined (which breaks Tone.js chaining), return the destination (arguments[0])
                if (result === undefined) {
                    return arguments[0];
                }
                return result;
            };

            // Mark as patched
            window.AudioNode.prototype.connect.isP5AdapterPatched = true;
        }
    }
});
