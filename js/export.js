// getting canvs animation for capture
const canvas = document.getElementById("canvas");

// init mediarecorder (for vid)
let stream = canvas.captureStream(30); // 30 FPS recording
let mediaRecorder = new MediaRecorder(stream);
let recordedChunks = [];

mediaRecorder.ondataavailable = function (event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
};

// To start recording animation
function startRecording() {
    recordedChunks = [];
    mediaRecorder.start();
}

// To stop recording
// and save the video
function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.onstop = function () {
        let videoBlob = new Blob(recordedChunks, { type: "video/webm" });
        let videoURL = URL.createObjectURL(videoBlob);

        // Download video file
        let a = document.createElement("a");
        a.href = videoURL;
        a.download = "musicblocks_animation.webm";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
}

// Export Music from Tone.js
async function exportMusic() {
    let recorder = new Tone.Recorder();
    Tone.Master.connect(recorder);

    await recorder.start();
    setTimeout(async () => {
        let wavBlob = await recorder.stop();
        let wavURL = URL.createObjectURL(wavBlob);

        // Download audio file
        let a = document.createElement("a");
        a.href = wavURL;
        a.download = "musicblocks_music.wav";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, 5000);
}

// Merge Video & Audio (Requires FFmpeg.js)
async function mergeAudioVideo(videoBlob, audioBlob) {
    const ffmpeg = await FFmpeg.createFFmpeg({ log: true });
    await ffmpeg.load();

    ffmpeg.FS("writeFile", "video.webm", await fetch(videoBlob).then((res) => res.arrayBuffer()));
    ffmpeg.FS("writeFile", "audio.wav", await fetch(audioBlob).then((res) => res.arrayBuffer()));

    await ffmpeg.run(
        "-i",
        "video.webm",
        "-i",
        "audio.wav",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "output.mp4"
    );

    let mp4Data = ffmpeg.FS("readFile", "output.mp4");
    let mp4Blob = new Blob([mp4Data.buffer], { type: "video/mp4" });
    let mp4URL = URL.createObjectURL(mp4Blob);

    let a = document.createElement("a");
    a.href = mp4URL;
    a.download = "musicblocks_export.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// event listener to the export button
document.getElementById("exportMP4").addEventListener("click", async () => {
    startRecording();
    await exportMusic();
    setTimeout(stopRecording, 5000);
});
