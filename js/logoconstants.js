/*
   global
   _
*/

/*
   exported
   DEFAULTVOLUME, PREVIEWVOLUME, DEFAULTDELAY,
   OSCVOLUMEADJUSTMENT, TONEBPM, TARGETBPM, TURTLESTEP, NOTEDIV,
   NOMICERRORMSG, NANERRORMSG, NOSTRINGERRORMSG, NOBOXERRORMSG,
   NOACTIONERRORMSG, NOINPUTERRORMSG, NOSQRTERRORMSG,
   ZERODIVIDEERRORMSG, EMPTYHEAPERRORMSG, INVALIDPITCH, POSNUMBER,
   NOTATIONNOTE, NOTATIONDURATION, NOTATIONDOTCOUNT,
   NOTATIONTUPLETVALUE, NOTATIONROUNDDOWN, NOTATIONINSIDECHORD,
   NOTATIONSTACCATO
 */

var DEFAULTVOLUME = 50;
var PREVIEWVOLUME = 80;
var DEFAULTDELAY = 500; // milliseconds
// The oscillator runs hot. We must scale back its volume.
var OSCVOLUMEADJUSTMENT = 1.5;

var TONEBPM = 240; // seems to be the default
var TARGETBPM = 90; // what we'd like to use for beats per minute
var TURTLESTEP = -1; // run in step-by-step mode
var NOTEDIV = 8; // number of steps to divide turtle graphics

// These error messages don't need translation since they are
// converted into artwork w/o text.
var NOMICERRORMSG = "The microphone is not available.";
var NANERRORMSG = "Not a number.";
var NOSTRINGERRORMSG = "Not a string.";
var NOBOXERRORMSG = "Cannot find box";
var NOACTIONERRORMSG = "Cannot find action.";
var NOINPUTERRORMSG = "Missing argument.";
var NOSQRTERRORMSG = "Cannot take square root of negative number.";
var ZERODIVIDEERRORMSG = "Cannot divide by zero.";
var EMPTYHEAPERRORMSG = "empty heap.";
var POSNUMBER = "Argument must be a positive number";

// NOTE: _() must be available globaly (shimmed or loaded)
var INVALIDPITCH = _("Not a valid pitch name");

var NOTATIONNOTE = 0;
var NOTATIONDURATION = 1;
var NOTATIONDOTCOUNT = 2;
var NOTATIONTUPLETVALUE = 3;
var NOTATIONROUNDDOWN = 4;
var NOTATIONINSIDECHORD = 5; // deprecated
var NOTATIONSTACCATO = 6;

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        DEFAULTVOLUME,
        PREVIEWVOLUME,
        DEFAULTDELAY,
        OSCVOLUMEADJUSTMENT,
        TONEBPM,
        TARGETBPM,
        TURTLESTEP,
        NOTEDIV,
        NOMICERRORMSG,
        NANERRORMSG,
        NOSTRINGERRORMSG,
        NOBOXERRORMSG,
        NOACTIONERRORMSG,
        NOINPUTERRORMSG,
        NOSQRTERRORMSG,
        ZERODIVIDEERRORMSG,
        EMPTYHEAPERRORMSG,
        POSNUMBER,
        INVALIDPITCH,
        NOTATIONNOTE,
        NOTATIONDURATION,
        NOTATIONDOTCOUNT,
        NOTATIONTUPLETVALUE,
        NOTATIONROUNDDOWN,
        NOTATIONINSIDECHORD,
        NOTATIONSTACCATO
    };
}

// AMD module definition
if (typeof define === "function" && define.amd) {
    define("activity/logoconstants", [], function () {
        return {
            DEFAULTVOLUME,
            PREVIEWVOLUME,
            DEFAULTDELAY,
            OSCVOLUMEADJUSTMENT,
            TONEBPM,
            TARGETBPM,
            TURTLESTEP,
            NOTEDIV,
            NOMICERRORMSG,
            NANERRORMSG,
            NOSTRINGERRORMSG,
            NOBOXERRORMSG,
            NOACTIONERRORMSG,
            NOINPUTERRORMSG,
            NOSQRTERRORMSG,
            ZERODIVIDEERRORMSG,
            EMPTYHEAPERRORMSG,
            POSNUMBER,
            INVALIDPITCH,
            NOTATIONNOTE,
            NOTATIONDURATION,
            NOTATIONDOTCOUNT,
            NOTATIONTUPLETVALUE,
            NOTATIONROUNDDOWN,
            NOTATIONINSIDECHORD,
            NOTATIONSTACCATO
        };
    });
}
