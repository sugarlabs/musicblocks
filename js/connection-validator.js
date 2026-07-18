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

/**
 * Test for a valid connection between two dock types.
 * @param - type1 - dock type 1
 * @param - type2 - dock type 2
 * @returns boolean
 */
function testConnectionType(type1, type2) {
    /** Can these two blocks dock? */
    return ALLOWED_CONNECTIONS.has(type1 + ":" + type2);
}

/**
 * Validates dock connection compatibility between blocks.
 * @public
 */
const ConnectionValidator = {
    ALLOWED_CONNECTIONS,
    testConnectionType
};

// Export ConnectionValidator
if (typeof define === "function" && define.amd) {
    define([], function () {
        return ConnectionValidator;
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ConnectionValidator;
}

if (typeof window !== "undefined") {
    window.ConnectionValidator = ConnectionValidator;
}
