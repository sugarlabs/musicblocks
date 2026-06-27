import * as Tone from 'tone';
import { BLOCK_TYPES } from '../constants';

const synth = new Tone.PolySynth(Tone.Synth).toDestination();

function parseDurationToBeats(durationStr) {
  // Returns number of quarter notes
  if (durationStr === "1") return 4;
  if (durationStr === "1/2") return 2;
  if (durationStr === "1/4") return 1;
  if (durationStr === "1/8") return 0.5;
  return 1; // default 4n
}

function parseDurationToToneStr(durationStr) {
  if (durationStr === "1") return "1n";
  if (durationStr === "1/2") return "2n";
  if (durationStr === "1/4") return "4n";
  if (durationStr === "1/8") return "8n";
  return "4n";
}

export async function playSequence(blocks, onComplete) {
  await Tone.start();
  Tone.Transport.stop();
  Tone.Transport.cancel();
  synth.releaseAll();

  let currentBeat = 0; // Tracks timeline in quarter notes
  let currentDurationStr = "1/4";
  
  Tone.Transport.bpm.value = 120; // Default reset

  function traverse(blockList) {
    for (const block of blockList) {
      if (block.type === BLOCK_TYPES.TEMPO) {
        const bpm = block.data.bpm || 120;
        Tone.Transport.schedule((time) => {
          Tone.Transport.bpm.value = bpm;
        }, `${currentBeat} * 4n`);
      } else if (block.type === BLOCK_TYPES.RHYTHM) {
        currentDurationStr = block.data.duration || "1/4";
      } else if (block.type === BLOCK_TYPES.NOTE) {
        const pitch = block.data.pitch || "C4";
        const toneDur = parseDurationToToneStr(currentDurationStr);
        const beatOffset = currentBeat; // capture current beat
        
        Tone.Transport.schedule((time) => {
          synth.triggerAttackRelease(pitch, toneDur, time);
        }, `${beatOffset} * 4n`);
        
        currentBeat += parseDurationToBeats(currentDurationStr);
      } else if (block.type === BLOCK_TYPES.REPEAT) {
        const times = block.data.times || 1;
        const children = block.data.children || [];
        for (let i = 0; i < times; i++) {
          traverse(children);
        }
      }
    }
  }

  traverse(blocks);

  // Schedule the stop callback after the very last note finishes
  Tone.Transport.schedule((time) => {
    Tone.Transport.stop();
    if (onComplete) {
      // Use Tone.Draw to safely invoke React state changes bound to animation frame
      Tone.Draw.schedule(() => {
        onComplete();
      }, time);
    }
  }, `${currentBeat} * 4n`);

  Tone.Transport.start();
}

export function stopPlayback() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  synth.releaseAll();
}
