var getStream = document.getElementById("overlayCanvas").captureStream(20); //The canvas to record. Captures the animation by 20 fps
var mediaChunks = []; //This is where the recorded media goes
var options = {mimeType: "video/webm; codecs=vp9"};
var record = new MediaRecorder(getStream, options);

startRecord = function(){
    console.debug("Recording");
    record.ondataavailable = handleDataAvailable;

    record.start();

    function handleDataAvailable(e){
      if (e.data.size > 0 && mediaChunks.length < 1){
        mediaChunks.push(e.data);
      }
      else{

        //Reset mediaChunks to prevent multiple blobs
        mediaChunks = [];
        mediaChunks.push(e.data);
      }

    }

}

stopRecord = function(){

  //Wait for 1 second before stopping to ensure that all animation are captured
  setTimeout(function(){
    try{
      console.debug("Stopping...")
      record.stop();
    }
    catch(e){
      console.debug("Media Recorder is Inactive");
    }
  }, 1000);

}

saveVideo = function(){
  blob = new Blob(mediaChunks, {type: "video/webm"});
  mediaChunks = [];
  return blob;
}
