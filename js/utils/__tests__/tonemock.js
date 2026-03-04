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
    }
}

class Player {
    constructor(sample) {
        this.sample = sample;
        this.toDestination = jest.fn().mockReturnThis();
        this.connect = jest.fn().mockReturnThis();
        this.start = jest.fn().mockReturnThis();
        this.triggerAttackRelease = jest.fn().mockReturnThis();
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
        this.triggerAttack = jest.fn().mockReturnThis();
        this.start = jest.fn().mockReturnThis();
        this.triggerAttackRelease = jest.fn().mockReturnThis();
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
    static resume() {}
}

class Transport {
    static start() {}
    static stop() {}
}

class ToneAudioBuffer {
    static async loaded() {
        return this;
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
