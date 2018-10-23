How to add a new sample sound
=============================

* Find a sample under a free/libre open-source (FOSS) license.

Let's say you are adding a new piano sound from a .wav (or .mp3) file.

NOTE: The instructions for encoding and utilizing a .mp3 sound are exactly the same, just replace every instance of .wav with .mp3

* `base64` encode the sample data

  ```
  base64 piano.wav > piano.b64encoded
  ```

* Embedded the sample data into a .js file as per:

   ```
   piano.js

   PIANO_SAMPLE = function () {
    return "data:audio/wav;base64,BASE64ENCODEDSAMPLEDATA";
   };
   ```
(Replace `BASE64ENCODEDSAMPLEDATA` with the data from your exported *.b64encoded file. If using an mp3 file, replace `wav` with `mp3`.)

NOTE: You must replace all line breaks. As a "regular expression" a line break is `\n`. You can do a find and replace for these characters within a text editor to replace all line breaks.

* Include a comment in the code (e.g. piano.js) regarding the sample source and license.
  // Piano sample from
  // https://github.com/sugarlabs/tamtam/blob/master/common/Resources/Sounds/piano
  // License: GPL-v2

* Add your new sample to `js/utils/synthutils.js`

   ```
   var VOICENAMES = [
    //.TRANS: musical instrument
    [_('piano'), 'piano', 'images/voices.svg', 'string'],

   var SOUNDSAMPLESDEFINES = [
    "samples/piano",

   const SAMPLECENTERNO = {
    'piano': ['C4', 39], // pitchToNumber('C', 4, 'C Major')],

   this.loadSamples = function () {
       this.samplesManifest = {
           'voice': [
               {'name': 'piano', 'data': PIANO_SAMPLE},
   ```

* Add your new sample name to the list of string that need translation
in `js/utils/musicutils.js`

   ```
   // Musical terms that need translations
   const SELECTORSTRINGS = [
       _('piano'),
   ```

* Other notes:

Sometimes a sample is not perfectly pitched (ie tuned to A440). In this case, you should use a sound editor to modify the pitch of the sample. Audacity has a tool called "change pitch" that can help with this.