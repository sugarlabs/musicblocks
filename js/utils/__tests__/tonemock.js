/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Shyam Raghuwanshi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

class Sampler {
    constructor(noteDict) {
        this.noteDict = noteDict;
        this.toDestination = jest.fn().mockReturnThis();
        this.connect = jest.fn().mockReturnThis();
        this.start = jest.fn().mockReturnThis();
        this.stop = jest.fn().mockReturnThis();
        this.triggerAttack = jest.fn().mockReturnThis();
        this.volume = {
            value: 0,
            cancelScheduledValues: jest.fn().mockReturnThis(),
            setValueAtTime: jest.fn().mockReturnThis(),
            linearRampToValueAtTime: jest.fn().mockImplementation(val => {
                this.volume.value = val;
            }),
            rampTo: jest.fn().mockImplementation(val => {
                this.volume.value = val;
            })
        };
        this.triggerRelease = jest.fn().mockReturnThis();
        this.triggerAttackRelease = jest.fn().mockReturnThis();
        this.chain = jest.fn().mockReturnThis();
        this.playbackRate = { value: 1 };
        this.loaded = true;
    }
}

class Player {
    constructor(sample) {
        this.sample = sample;
        this.toDestination = jest.fn().mockReturnThis();
        this.connect = jest.fn().mockReturnThis();
        this.load = jest.fn().mockResolvedValue(this);
        this.start = jest.fn().mockReturnThis();
        this.stop = jest.fn().mockReturnThis();
        this.dispose = jest.fn().mockReturnThis();
        this.triggerAttackRelease = jest.fn().mockReturnThis();
        this.volume = {
            value: 0,
            cancelScheduledValues: jest.fn().mockReturnThis(),
            setValueAtTime: jest.fn().mockReturnThis(),
            linearRampToValueAtTime: jest.fn().mockReturnThis(),
            rampTo: jest.fn().mockImplementation(val => {
                this.volume.value = val;
            })
        };
        this.playbackRate = { value: 1 };
        this.loaded = true;
    }
}

class AMSynth {
    toDestination() {
        return this;
    }
}
class FMSynth {
    toDestination() {
        return this;
    }
}
class DuoSynth {
    toDestination() {
        return this;
    }
}

class PluckSynth {
    constructor(synthOptions) {
        this.synthOptions = synthOptions;
        this.triggerAttackRelease = jest.fn().mockReturnThis();
    }
    toDestination() {
        return this;
    }
}

class Synth {
    constructor(synthOptions) {
        this.synthOptions = synthOptions;
        this.triggerAttackRelease = jest.fn().mockReturnThis();
        this.stop = jest.fn().mockReturnThis();
        this.triggerAttack = jest.fn().mockReturnThis();
        this.triggerRelease = jest.fn().mockReturnThis();
        this.start = jest.fn().mockReturnThis();
        this.chain = jest.fn().mockReturnThis();
        this.volume = {
            value: 0,
            cancelScheduledValues: jest.fn().mockReturnThis(),
            setValueAtTime: jest.fn().mockReturnThis(),
            linearRampToValueAtTime: jest.fn().mockImplementation(val => {
                this.volume.value = val;
            }),
            rampTo: jest.fn().mockImplementation(val => {
                this.volume.value = val;
            })
        };
    }
    toDestination() {
        return this;
    }
}
class NoiseSynth {
    constructor(synthOptions) {
        this.synthOptions = synthOptions;
    }
    toDestination() {
        return this;
    }
}

class PolySynth {
    constructor(synth, count) {
        this.synth = synth;
        this.count = count;
        // Mirrors Tone.js: dispose() flips `disposed`, and triggering a disposed
        // node throws "Synth was already disposed". Without this the mock silently
        // tolerates use-after-dispose and such bugs pass unnoticed.
        this.disposed = false;
        this.dispose = jest.fn().mockImplementation(() => {
            this.disposed = true;
            return this;
        });
        const assertLive = () => {
            if (this.disposed) {
                throw new Error("Synth was already disposed");
            }
        };
        this.triggerAttack = jest.fn().mockImplementation(assertLive);
        this.start = jest.fn().mockImplementation(assertLive);
        this.triggerRelease = jest.fn().mockImplementation(assertLive);
        this.triggerAttackRelease = jest.fn().mockImplementation(assertLive);
        this.volume = {
            value: 0,
            cancelScheduledValues: jest.fn().mockReturnThis(),
            setValueAtTime: jest.fn().mockReturnThis(),
            linearRampToValueAtTime: jest.fn().mockImplementation(val => {
                this.volume.value = val;
            }),
            rampTo: jest.fn().mockImplementation(val => {
                this.volume.value = val;
            })
        };
    }

    toDestination() {
        return this;
    }
    connect() {
        return this;
    }
}

class context {
    static state = "running";
    static resume() {}
}

class Transport {
    static _state = "started";
    static start() {}
    static stop() {}
    static schedule() {}
    static cancel() {}
    static clear() {}
    static getSecondsAtTime() {
        return 0;
    }
    static _seconds = 0;
    static get seconds() {
        return Transport._seconds;
    }
    static set seconds(value) {
        Transport._seconds = value;
    }
    static get state() {
        return Transport._state;
    }
    static set state(v) {
        Transport._state = v;
    }
}

class ToneAudioBuffer {
    static async loaded() {
        return this;
    }
}

class UserMedia {
    constructor() {
        this.connect = jest.fn().mockReturnThis();
        this.disconnect = jest.fn().mockReturnThis();
        this.open = jest.fn().mockResolvedValue();
        this.close = jest.fn();
        this.dispose = jest.fn();
    }
}

class Recorder {
    constructor() {
        this.start = jest.fn().mockResolvedValue();
        this.stop = jest.fn().mockResolvedValue(new Blob());
        this.connect = jest.fn().mockReturnThis();
        this.dispose = jest.fn();
    }
}

class Analyser {
    constructor(type, size) {
        this.type = type;
        this.size = size;
        this.getValue = jest.fn().mockReturnValue(new Float32Array(128));
        this.connect = jest.fn().mockReturnThis();
        this.disconnect = jest.fn();
        this.dispose = jest.fn();
    }
}

const Tone = {
    AMSynth,
    PolySynth,
    Player,
    Sampler,
    Synth,
    PluckSynth,
    NoiseSynth,
    DuoSynth,
    context,
    FMSynth,
    Transport,
    ToneAudioBuffer,
    UserMedia,
    Recorder,
    Analyser,
    Frequency: jest.fn(() => {
        return {
            toFrequency: jest.fn().mockReturnThis()
        };
    }),
    getContext: jest.fn(() => {
        return {
            createMediaStreamDestination: jest.fn().mockReturnThis()
        };
    }),
    gainToDb: jest.fn(() => {
        return 4;
    }),
    start: jest.fn().mockResolvedValue(),
    now: jest.fn(() => {
        return new Date().getTime();
    }),
    Context: jest.fn().mockReturnThis(),
    Loop: jest.fn((callback, interval) => ({
        start: jest.fn(start => {
            callback(start); // Simulate immediate execution of the callback
            return {}; // Mocked loop instance
        })
    })),
    Instrument: jest.fn().mockImplementation(() => ({
        toDestination: jest.fn()
    })),
    doNeighbor: jest.fn().mockReturnThis(),
    Destination: { volume: { rampTo: jest.fn() } },
    console: { debug: jest.fn() },
    Vibrato: jest.fn().mockReturnThis(),
    Distortion: jest.fn().mockReturnThis(),
    Buffer: jest.fn(() => {
        return {
            onload: jest.fn().mockReturnThis()
        };
    })
};

module.exports = Tone;
