How to add a new sample sound
=============================

* Find a sample under a free/libre open-source (FOSS) license.

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

* Add you new sample name to the list of string that need translation
in `js/utils/musicutils.js`

   ```
   // Musical terms that need translations
   const SELECTORSTRINGS = [
       _('piano'),
   ```
