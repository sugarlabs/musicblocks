// Dev-only experimental recorder for Music Blocks
// Exposes window.__startExportRecording() and window.__stopExportRecording()
// Usage (dev):
// window.__startExportRecording({ getCanvas: ()=>..., getAudioContext: ()=>..., connectAudioToDest: (dest)=>{ /* connect masterGain to dest */ } })
// window.__stopExportRecording()
// Strict: re-uses existing AudioContext; does not create new one; WebM only.
// Do not load in Jest / Node test environment
if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
  // Running in Node/Jest — skip loading browser-only recorder
  return;
}

(function () {
  'use strict';

  let mediaRecorder = null;
  let recordedBlobs = null;
  let recordingStream = null;
  let recordingDest = null;

  function chooseMimeType() {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    for (const mime of candidates) {
      try {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) return mime;
      } catch (e) {
        // ignore
      }
    }
    return '';
  }

  function fail(msg) {
    console.error('ExportRecorderError:', msg);
    throw new Error('ExportRecorderError: ' + msg);
  }

  // Start recording (dev-only)
  // options: { frameRate, filename, getCanvas, getAudioContext, connectAudioToDest }
  window.__startExportRecording = async function (options = {}) {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      fail('Recording already in progress');
    }

    const {
      frameRate = 30,
      filename = 'musicblocks-export.webm',
      getCanvas,
      getAudioContext,
      connectAudioToDest
    } = options;

    if (typeof getCanvas !== 'function') {
      // Default getter: Music Blocks primary canvas id is "myCanvas" (do not query generic 'canvas')
      console.warn('No getCanvas provided; defaulting to #myCanvas. Prefer passing a getCanvas function.');
      options.getCanvas = () => document.getElementById('myCanvas');
    }
    const canvas = options.getCanvas();
    if (!canvas || typeof canvas.captureStream !== 'function') {
      fail('Canvas not found or captureStream unsupported. Provide getCanvas() that returns the turtle/mouse canvas element.');
    }

    if (typeof getAudioContext !== 'function') {
      // Default getter: try Tone.context then p5.sound Out then fall back. Prefer passing a getAudioContext function.
      console.warn('No getAudioContext provided; attempting to use Tone.context or p5.soundOut by default. Prefer passing a getAudioContext function.');
      options.getAudioContext = () => {
        if (window.Tone && Tone.context) return Tone.context;
        if (window.p5 && window.p5.soundOut && window.p5.soundOut.audiocontext) return window.p5.soundOut.audiocontext;
        return null;
      };
    }
    const audioCtx = options.getAudioContext();
    if (!audioCtx || typeof audioCtx.createMediaStreamDestination !== 'function') {
      fail('AudioContext not found or invalid. Provide the app AudioContext via getAudioContext().');
    }

    const canvasStream = canvas.captureStream(frameRate);

    // Create a MediaStreamDestination on the existing AudioContext (do NOT create a new AudioContext)
    recordingDest = audioCtx.createMediaStreamDestination();

    if (typeof connectAudioToDest === 'function') {
      try {
        connectAudioToDest(recordingDest);
      } catch (e) {
        fail('connectAudioToDest threw: ' + (e && e.message));
      }
    } else {
      // Try to auto-connect common runtime master outputs (non-invasive tap).
      let autoConnected = false;
      try {
        if (window.Tone && Tone.Destination && typeof Tone.Destination.connect === 'function') {
          Tone.Destination.connect(recordingDest);
          console.log('Recorder: auto-connected Tone.Destination to recording destination.');
          autoConnected = true;
        }
      } catch (e) {
        console.warn('Recorder: failed to auto-connect Tone.Destination:', e);
      }

      try {
        if (window.p5 && window.p5.soundOut && window.p5.soundOut.output && typeof window.p5.soundOut.output.connect === 'function') {
          window.p5.soundOut.output.connect(recordingDest);
          console.log('Recorder: auto-connected p5.soundOut output to recording destination.');
          autoConnected = true;
        }
      } catch (e) {
        console.warn('Recorder: failed to auto-connect p5.soundOut:', e);
      }

      // Howler.js best-effort: some builds expose a master gain; try common properties
      try {
        if (window.Howler && (window.Howler._masterGain || window.Howler._howls)) {
          const mg = window.Howler._masterGain || window.Howler._masterGainNode || null;
          if (mg && typeof mg.connect === 'function') {
            mg.connect(recordingDest);
            console.log('Recorder: auto-connected Howler master gain to recording destination.');
            autoConnected = true;
          }
        }
      } catch (e) {
        console.warn('Recorder: failed to auto-connect Howler master gain (if present):', e);
      }

      if (!autoConnected) {
        console.warn('connectAudioToDest not provided and auto-connect failed. Recording will be silent unless app audio nodes are connected to the provided destination. Provide connectAudioToDest(dest) to __startExportRecording to wire master output.');
      }
    }

    // Attach audio tracks from the destination to the canvas stream
    try {
      const audioTracks = recordingDest.stream.getAudioTracks();
      if (audioTracks && audioTracks.length) {
        audioTracks.forEach((t) => canvasStream.addTrack(t));
      } else {
        console.warn('No audio tracks found on MediaStreamDestination; recording may be silent.');
      }
    } catch (e) {
      fail('Failed to attach audio tracks: ' + (e && e.message));
    }

    recordedBlobs = [];
    const mime = chooseMimeType();
    const optionsRec = mime ? { mimeType: mime } : undefined;
    try {
      mediaRecorder = new MediaRecorder(canvasStream, optionsRec);
    } catch (e) {
      fail('MediaRecorder creation failed: ' + (e && e.message));
    }
    recordingStream = canvasStream;

    mediaRecorder.ondataavailable = function (event) {
      if (event.data && event.data.size > 0) recordedBlobs.push(event.data);
    };

    mediaRecorder.onerror = function (ev) {
      console.error('MediaRecorder error:', ev);
    };

    try {
      mediaRecorder.start();
      console.info('Export recording started (dev-only).');
      console.info('Recording options:', { frameRate, filename, mime: optionsRec && optionsRec.mimeType });
    } catch (e) {
      fail('MediaRecorder.start() failed: ' + (e && e.message));
    }

    return { filename, frameRate, mime: optionsRec && optionsRec.mimeType };
  };

  // Stop recording and trigger download
  window.__stopExportRecording = function (options = {}) {
    if (!mediaRecorder) {
      fail('No recording in progress.');
    }

    const { filename = 'musicblocks-export.webm' } = options;

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = function () {
        try {
          const blob = new Blob(recordedBlobs, { type: recordedBlobs.length ? recordedBlobs[0].type : 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.info('Export recording downloaded:', filename);
            if (recordingStream) recordingStream.getTracks().forEach(t => t.stop());
            if (recordingDest && recordingDest.disconnect) {
              try { recordingDest.disconnect(); } catch (e) { /* ignore */ }
            }
            mediaRecorder = null;
            recordedBlobs = null;
            recordingStream = null;
            recordingDest = null;
            resolve(blob);
          }, 150);
        } catch (err) {
          reject(err);
        }
      };

      try {
        if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
          mediaRecorder.stop();
        } else {
          fail('MediaRecorder is not recording (state=' + mediaRecorder.state + ')');
        }
      } catch (e) {
        reject(e);
      }
    });
  };

  // Optional cancel/cleanup
  window.__cancelExportRecording = function () {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      try { mediaRecorder.stop(); } catch (e) { /* ignore */ }
    }
    if (recordingStream) recordingStream.getTracks().forEach(t => t.stop());
    if (recordingDest && recordingDest.disconnect) {
      try { recordingDest.disconnect(); } catch (e) { /* ignore */ }
    }
    mediaRecorder = null;
    recordedBlobs = null;
    recordingStream = null;
    recordingDest = null;
    console.info('Export recording cancelled and cleaned up.');
  };

})();
