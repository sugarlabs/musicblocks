class Sampler {
  constructor(noteDict) {
    this.noteDict = noteDict;
    this.toDestination = jest.fn().mockReturnThis();
    this.connect = jest.fn().mockReturnThis();
    this.start = jest.fn().mockReturnThis();
    this.stop = jest.fn().mockReturnThis();
    this.triggerAttack = jest.fn().mockReturnThis();
    this.volume = {
      linearRampToValueAtTime: jest.fn().mockImplementation()
    }
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
    this.synthOptions = synthOptions
    this.triggerAttackRelease = jest.fn().mockReturnThis();
  }
  toDestination() {
    return this;
  }
}

class Synth {
  constructor(synthOptions) {
    this.synthOptions = synthOptions
    this.triggerAttackRelease = jest.fn().mockReturnThis();
    this.chain = jest.fn().mockReturnThis();
  }
  toDestination() {
    return this;
  }
}
class NoiseSynth {
  constructor(synthOptions) {
    this.synthOptions = synthOptions
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
  }

  toDestination() {
    return this;
  }
  connect() {
    return this
  }
}

class context {
  static resume() {
  }
}

class Transport {
  static start() {
  }
  static stop() {
  }
}

class ToneAudioBuffer {
  static async loaded() {
    return this
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
    }
  }),
  getContext: jest.fn(() => {
    return {
      createMediaStreamDestination: jest.fn().mockReturnThis()
    }
  }),
  gainToDb: jest.fn(() => {
    return 4
  }),
  start: jest.fn(),
  now: jest.fn(() => {
    return new Date().getTime()
  }),
  Context: jest.fn().mockReturnThis(),
  Loop: jest.fn((callback, interval) => ({
    start: jest.fn((start) => {
      callback(start); // Simulate immediate execution of the callback
      return {}; // Mocked loop instance
    }),
  })),
  Instrument: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn(),
  })),
  doNeighbor: jest.fn().mockReturnThis(),
  Destination: { volume: { rampTo: jest.fn() } },
  console: { debug: jest.fn() },
  Vibrato: jest.fn().mockReturnThis(),
  Distortion: jest.fn().mockReturnThis(),
  Buffer: jest.fn(() => {
    return {
      onload: jest.fn().mockReturnThis()
    }
  })
};

module.exports = Tone;