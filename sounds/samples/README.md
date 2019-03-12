How to add a new sample sound
=============================

* Find a sample under a free/libre open-source (FOSS) license.

* The sample has to have only one note (pitch) through out the audio and the volume has to be 50 . The longer the sample, the better it is.

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

Be sure to remove the newlines in your sample data: it should all be
on one line.

* Include a comment in the code regarding the sample source and license.
  // Piano sample from
  // https://github.com/sugarlabs/tamtam/blob/master/common/Resources/Sounds/piano
  // License: GPL-v2

* Add you new sample to `js/utils/synthutils.js`

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

Note: To deterine the center pitch of your sample, you may find the
"change pitch" feature of
[Audacity](https://manual.audacityteam.org/man/change_pitch.html)
useful.


* Add your new sample name to the list of string that need translation
in `js/utils/musicutils.js`

   ```
   // Musical terms that need translations
   const SELECTORSTRINGS = [
       _('piano'),
   ```
