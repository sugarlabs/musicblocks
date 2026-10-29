// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   globals
   navigator, window
*/

/* exported
   MidiManager, MidiUtils
*/

/**
 * Manages WebMIDI browser access, device lifecycle, and message distribution.
 * Acts as a centralized service allowing both widgets (e.g. MusicKeyboard)
 * and execution runtimes (Logo / turtles) to subscribe to MIDI hardware events.
 */
const MidiManager = {
    midiAccess: null,
    listeners: new Set(),
    _boundInputs: new Set(),

    /**
     * Checks if the WebMIDI API is available in the current runtime environment.
     * @returns {boolean}
     */
    isSupported() {
        return (
            typeof navigator !== "undefined" && typeof navigator.requestMIDIAccess === "function"
        );
    },

    /**
     * Requests browser WebMIDI access and registers device event bindings.
     * @param {object} [options={ sysex: true }]
     * @returns {Promise<MIDIAccess>}
     */
    async requestAccess(options = { sysex: true }) {
        if (!this.isSupported()) {
            return Promise.reject(new Error("WebMIDI is not supported in this environment."));
        }

        const access = await navigator.requestMIDIAccess(options);
        this.midiAccess = access;
        this.bindInputs();

        if (typeof access.onstatechange !== "undefined") {
            access.onstatechange = () => {
                this.bindInputs();
            };
        }

        return access;
    },

    /**
     * Binds input message handlers on all connected MIDI input devices.
     */
    bindInputs() {
        if (!this.midiAccess || !this.midiAccess.inputs) {
            return;
        }

        const handleMessage = event => {
            this.dispatchMessage(event);
        };

        if (typeof this.midiAccess.inputs.forEach === "function") {
            this.midiAccess.inputs.forEach(input => {
                input.onmidimessage = handleMessage;
            });
        } else if (Array.isArray(this.midiAccess.inputs)) {
            for (let i = 0; i < this.midiAccess.inputs.length; i++) {
                this.midiAccess.inputs[i].onmidimessage = handleMessage;
            }
        }
    },

    /**
     * Registers a callback listener to receive dispatched MIDI message events.
     * @param {function} listener
     */
    addListener(listener) {
        if (typeof listener === "function") {
            this.listeners.add(listener);
        }
    },

    /**
     * Removes an active callback listener.
     * @param {function} listener
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    },

    /**
     * Clears all registered callback listeners.
     */
    clearListeners() {
        this.listeners.clear();
    },

    /**
     * Dispatches an incoming MIDI message event to all registered listeners.
     * @param {MIDIMessageEvent} event
     */
    dispatchMessage(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                if (typeof console !== "undefined" && console.error) {
                    console.error("MidiManager listener error:", error);
                }
            }
        });
    },

    /**
     * Checks if any MIDI input devices are currently connected.
     * @returns {boolean}
     */
    hasDevices() {
        if (!this.midiAccess || !this.midiAccess.inputs) {
            return false;
        }
        if (typeof this.midiAccess.inputs.size === "number") {
            return this.midiAccess.inputs.size > 0;
        }
        if (Array.isArray(this.midiAccess.inputs)) {
            return this.midiAccess.inputs.length > 0;
        }
        return false;
    },

    /**
     * Resets active device listeners and clears state.
     */
    reset() {
        if (this.midiAccess && this.midiAccess.inputs) {
            if (typeof this.midiAccess.inputs.forEach === "function") {
                this.midiAccess.inputs.forEach(input => {
                    input.onmidimessage = null;
                });
            } else if (Array.isArray(this.midiAccess.inputs)) {
                for (let i = 0; i < this.midiAccess.inputs.length; i++) {
                    this.midiAccess.inputs[i].onmidimessage = null;
                }
            }
        }
        this.midiAccess = null;
        this.listeners.clear();
    }
};

const MidiUtils = {
    MidiManager
};

if (typeof window !== "undefined") {
    window.MidiManager = MidiManager;
    window.MidiUtils = MidiUtils;
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return MidiUtils;
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        MidiManager,
        MidiUtils
    };
}
