/* global define, window */
define(["p5.min"], function (p5) {
    if (!window.p5 && p5) {
        window.p5 = p5;
    }
    if (window.Tone) {
        window.OriginalTone = window.Tone;
    } else {
        console.warn("p5-adapter: window.Tone not found!");
    }

    // Save original AudioContext constructors to prevent p5.sound from hijacking them
    if (window.AudioContext) {
        window.OriginalAudioContext = window.AudioContext;
    }
    if (window.webkitAudioContext) {
        window.OriginalWebkitAudioContext = window.webkitAudioContext;
    }

    // Save original connect just in case
    if (window.AudioNode && window.AudioNode.prototype) {
        window.OriginalAudioNodeConnect = window.AudioNode.prototype.connect;
    }

    return p5;
});
