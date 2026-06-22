// Copyright (c) 2014-21 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   exported
   MINIMUMDOCKDISTANCE, LONGSTACK, CAMERAVALUE, VIDEOVALUE,
   NOTEBLOCKS, PITCHBLOCKS, ALLOWED_CONNECTIONS
 */

/**
 * Minimum distance (squared) between two docks required before
 * connecting them.
 */
const MINIMUMDOCKDISTANCE = 400;

/** Soft limit on the number of blocks in a single stack. */
const LONGSTACK = 300;

/** Special value flags to uniquely identify these media blocks. */
const CAMERAVALUE = "##__CAMERA__##";
const VIDEOVALUE = "##__VIDEO__##";

const NOTEBLOCKS = ["newnote", "osctime"];
const PITCHBLOCKS = ["pitch", "steppitch", "hertz", "pitchnumber", "nthmodalpitch", "playdrum"];

const ALLOWED_CONNECTIONS = new Set([
    "vspaceout:vspacein",
    "vspacein:vspaceout",
    "in:out",
    "out:in",
    "in:vspaceout",
    "vspaceout:in",
    "out:vspacein",
    "vspacein:out",
    "numberin:numberout",
    "numberin:anyout",
    "numberout:numberin",
    "anyout:numberin",
    "textin:textout",
    "textin:anyout",
    "textout:textin",
    "anyout:textin",
    "booleanout:booleanin",
    "booleanin:booleanout",
    "mediain:mediaout",
    "mediaout:mediain",
    "mediain:textout",
    "textout:mediain",
    "filein:fileout",
    "fileout:filein",
    "casein:caseout",
    "caseout:casein",
    "vspaceout:casein",
    "casein:vspaceout",
    "vspacein:caseout",
    "caseout:vspacein",
    "solfegein:anyout",
    "solfegein:solfegeout",
    "solfegein:textout",
    "solfegein:noteout",
    "solfegein:scaledegreeout",
    "solfegein:numberout",
    "anyout:solfegein",
    "solfegeout:solfegein",
    "textout:solfegein",
    "noteout:solfegein",
    "scaledegreeout:solfegein",
    "numberout:solfegein",
    "notein:solfegeout",
    "notein:scaledegreeout",
    "notein:textout",
    "notein:noteout",
    "solfegeout:notein",
    "scaledegreeout:notein",
    "textout:notein",
    "noteout:notein",
    "pitchout:anyin",
    "gridout:anyin",
    "anyin:textout",
    "anyin:mediaout",
    "anyin:numberout",
    "anyin:anyout",
    "anyin:fileout",
    "anyin:solfegeout",
    "anyin:scaledegreeout",
    "anyin:noteout",
    "textout:anyin",
    "mediaout:anyin",
    "numberout:anyin",
    "anyout:anyin",
    "fileout:anyin",
    "solfegeout:anyin",
    "scaledegreeout:anyin",
    "noteout:anyin"
]);

const blockConstants = {
    MINIMUMDOCKDISTANCE,
    LONGSTACK,
    CAMERAVALUE,
    VIDEOVALUE,
    NOTEBLOCKS,
    PITCHBLOCKS,
    ALLOWED_CONNECTIONS
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = blockConstants;
}

/* global define */
if (typeof define === "function" && define.amd) {
    define(function () {
        return blockConstants;
    });
}

if (typeof window !== "undefined" && typeof module === "undefined") {
    Object.assign(window, blockConstants);
}
