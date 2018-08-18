== How to add a new sample sound ==

1. Find a sample under a FOSS license.

2. `base64` encode the sample data

3. Embedded the sample data into a .js file as per:

   piano.js

   PIANO_SAMPLE = function () {
    return "data:audio/wav;base64,BASE64ENCODEDSAMPLEDATA";
   };

4. Add you new sample to `js/utils/synthutils.js`

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

5. Add you new sample name to the list of string that need translation
in `js/utils/musicutils.js`

   // Musical terms that need translations
   const SELECTORSTRINGS = [
       _('piano'),

