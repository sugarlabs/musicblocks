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

const DEFAULTVOLUME = 50;
const PREVIEWVOLUME = 80;
const DEFAULTDELAY = 500; // milliseconds
// The oscillator runs hot. We must scale back its volume.
const OSCVOLUMEADJUSTMENT = 1.5;

const TONEBPM = 240; // seems to be the default
const TARGETBPM = 90; // what we'd like to use for beats per minute
const TURTLESTEP = -1; // run in step-by-step mode
const NOTEDIV = 8; // number of steps to divide turtle graphics

// These error messages don't need translation since they are
// converted into artwork w/o text.
const NOMICERRORMSG = "The microphone is not available.";
const NANERRORMSG = "Not a number.";
const NOSTRINGERRORMSG = "Not a string.";
const NOBOXERRORMSG = "Cannot find box";
const NOACTIONERRORMSG = "Cannot find action.";
const NOINPUTERRORMSG = "Missing argument.";
const NOSQRTERRORMSG = "Cannot take square root of negative number.";
const ZERODIVIDEERRORMSG = "Cannot divide by zero.";
const EMPTYHEAPERRORMSG = "empty heap.";
const POSNUMBER = "Argument must be a positive number";

// NOTE: _() must be available globaly (shimmed or loaded)
const INVALIDPITCH = _("Not a valid pitch name");

const NOTATIONNOTE = 0;
const NOTATIONDURATION = 1;
const NOTATIONDOTCOUNT = 2;
const NOTATIONTUPLETVALUE = 3;
const NOTATIONROUNDDOWN = 4;
const NOTATIONINSIDECHORD = 5; // deprecated
const NOTATIONSTACCATO = 6;

const exportsObj = {
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

if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
} else if (typeof window !== "undefined") {
    Object.assign(window, exportsObj);
}
