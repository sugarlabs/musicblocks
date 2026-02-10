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
const INVALIDPITCH =
    typeof _ === "function" ? _("Not a valid pitch name") : "Not a valid pitch name";

const NOTATIONNOTE = 0;
const NOTATIONDURATION = 1;
const NOTATIONDOTCOUNT = 2;
const NOTATIONTUPLETVALUE = 3;
const NOTATIONROUNDDOWN = 4;
const NOTATIONINSIDECHORD = 5; // deprecated
const NOTATIONSTACCATO = 6;

const logoconstants = {
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

// Preserve existing global exposure exactly as before
if (typeof window !== "undefined") {
    window.DEFAULTVOLUME = DEFAULTVOLUME;
    window.PREVIEWVOLUME = PREVIEWVOLUME;
    window.DEFAULTDELAY = DEFAULTDELAY;
    window.OSCVOLUMEADJUSTMENT = OSCVOLUMEADJUSTMENT;
    window.TONEBPM = TONEBPM;
    window.TARGETBPM = TARGETBPM;
    window.TURTLESTEP = TURTLESTEP;
    window.NOTEDIV = NOTEDIV;
    window.NOMICERRORMSG = NOMICERRORMSG;
    window.NANERRORMSG = NANERRORMSG;
    window.NOSTRINGERRORMSG = NOSTRINGERRORMSG;
    window.NOBOXERRORMSG = NOBOXERRORMSG;
    window.NOACTIONERRORMSG = NOACTIONERRORMSG;
    window.NOINPUTERRORMSG = NOINPUTERRORMSG;
    window.NOSQRTERRORMSG = NOSQRTERRORMSG;
    window.ZERODIVIDEERRORMSG = ZERODIVIDEERRORMSG;
    window.EMPTYHEAPERRORMSG = EMPTYHEAPERRORMSG;
    window.POSNUMBER = POSNUMBER;
    window.INVALIDPITCH = INVALIDPITCH;
    window.NOTATIONNOTE = NOTATIONNOTE;
    window.NOTATIONDURATION = NOTATIONDURATION;
    window.NOTATIONDOTCOUNT = NOTATIONDOTCOUNT;
    window.NOTATIONTUPLETVALUE = NOTATIONTUPLETVALUE;
    window.NOTATIONROUNDDOWN = NOTATIONROUNDDOWN;
    window.NOTATIONINSIDECHORD = NOTATIONINSIDECHORD;
    window.NOTATIONSTACCATO = NOTATIONSTACCATO;
}

// Implement proper AMD define
if (typeof define === "function" && define.amd) {
    define("activity/logoconstants", ["utils/utils"], function (utils) {
        // Explicitly handle dependencies (including _ if used)
        const _dependency = (utils && utils._) || (typeof window !== "undefined" && window._);
        if (
            _dependency &&
            typeof _dependency === "function" &&
            logoconstants.INVALIDPITCH === "Not a valid pitch name"
        ) {
            logoconstants.INVALIDPITCH = _dependency("Not a valid pitch name");
        }
        return logoconstants;
    });
}

// Maintain CommonJS compatibility for tests
if (typeof module !== "undefined" && module.exports) {
    module.exports = logoconstants;
}
