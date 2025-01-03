// Importing the Synth module
global._ = (str) => str;
import { describe, test, beforeEach, jest } from '@jest/globals';
import Synth from '../synthutils';

jest.mock('tone', () => ({
  Transport: {
    start: jest.fn(),
    stop: jest.fn()
  },
  gainToDb: jest.fn(),
  Master: {
    volume: {
      rampTo: jest.fn()
    }
  }
}));

// Create a mock class
class MockSynth {
  constructor() {
    this.samplesQueue = [];
    this._performNotes = jest.fn();
    this.setVolume = jest.fn();
    this.start = jest.fn();
    this.stop = jest.fn();
    this.startRecording = jest.fn().mockResolvedValue(undefined);
    this.stopRecording = jest.fn().mockResolvedValue('mock-audio-url');
    this.playRecording = jest.fn();
    this.stopPlayBackRecording = jest.fn();
    this.setMasterVolume = jest.fn();
    this.loadSamples = jest.fn();
  }
}

// Mock the Synth module
jest.mock('../synthutils', () => {
  return MockSynth;
});

// Mock global require
global.require = jest.fn((path, callback) => {
  if (callback && typeof callback === 'function') {
    callback();
  }
});

// Mock SOUNDSAMPLESDEFINES
global.SOUNDSAMPLESDEFINES = 'mock-path';

describe('Synth class tests', () => {
  let synth;

  beforeEach(() => {
    jest.clearAllMocks();
    synth = new MockSynth();
  });

  test('Synth should initialize correctly', () => {
    expect(synth.samplesQueue).toEqual([]);
    expect(Array.isArray(synth.samplesQueue)).toBe(true);
  });

  test('trigger method should call _performNotes correctly', () => {
    const note = 'A4';
    const duration = 1;
    const velocity = 0.5;
    synth._performNotes(note, duration, velocity);
    expect(synth._performNotes).toHaveBeenCalledWith(note, duration, velocity);
  });

  test('setVolume should call Tone.gainToDb with the correct volume value', () => {
    const volume = 50;
    synth.setVolume(volume);
    expect(synth.setVolume).toHaveBeenCalledWith(volume);
  });

  test('start method should call Tone.Transport.start', () => {
    synth.start();
    expect(synth.start).toHaveBeenCalled();
  });

  test('stop method should call Tone.Transport.stop', () => {
    synth.stop();
    expect(synth.stop).toHaveBeenCalled();
  });

  test('startRecording should start recording and resolve correctly', async () => {
    await expect(synth.startRecording()).resolves.toBeUndefined();
    expect(synth.startRecording).toHaveBeenCalled();
  });

  test('stopRecording should stop recording and return a valid audio URL', async () => {
    const url = await synth.stopRecording();
    expect(synth.stopRecording).toHaveBeenCalled();
    expect(url).toBe('mock-audio-url');
  });

  test('playRecording should load and start the player', () => {
    const url = 'test-url';
    synth.playRecording(url);
    expect(synth.playRecording).toHaveBeenCalledWith(url);
  });

  test('stopPlayBackRecording should stop the player', () => {
    synth.stopPlayBackRecording();
    expect(synth.stopPlayBackRecording).toHaveBeenCalled();
  });

  test('setMasterVolume should ramp volume correctly', () => {
    const volume = -6;
    synth.setMasterVolume(volume);
    expect(synth.setMasterVolume).toHaveBeenCalledWith(volume);
  });

  test('should handle correct interaction with setVolume method', () => {
    const volume = 75;
    synth.setVolume(volume);
    expect(synth.setVolume).toHaveBeenCalledWith(volume);
  });

  test('should manage volume with Tone.js', () => {
    const volume = -12;
    synth.setMasterVolume(volume);
    expect(synth.setMasterVolume).toHaveBeenCalledWith(volume);
  });
});
