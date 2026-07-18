// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

/* global describe, it, expect */

const ConnectionValidator = require("../connection-validator.js");

// The full list of dock-type pairs allowed to connect, mirrored here so
// the test suite fails loudly if connection-validator.js and this list
// ever drift apart.
const VALID_CONNECTIONS = [
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
];

describe("ConnectionValidator.ALLOWED_CONNECTIONS", () => {
    it("is a Set", () => {
        expect(ConnectionValidator.ALLOWED_CONNECTIONS).toBeInstanceOf(Set);
    });

    it("contains exactly the known set of allowed dock connections", () => {
        expect(ConnectionValidator.ALLOWED_CONNECTIONS.size).toBe(VALID_CONNECTIONS.length);
        for (const pair of VALID_CONNECTIONS) {
            expect(ConnectionValidator.ALLOWED_CONNECTIONS.has(pair)).toBe(true);
        }
    });
});

describe("ConnectionValidator.testConnectionType — valid connections", () => {
    it.each(VALID_CONNECTIONS.map(pair => pair.split(":")))("allows %s -> %s", (type1, type2) => {
        expect(ConnectionValidator.testConnectionType(type1, type2)).toBe(true);
    });
});

describe("ConnectionValidator.testConnectionType — invalid connections", () => {
    const INVALID_PAIRS = [
        ["numberin", "textout"],
        ["booleanin", "numberout"],
        ["mediain", "fileout"],
        ["filein", "mediaout"],
        ["casein", "textout"],
        ["solfegein", "fileout"],
        ["notein", "mediaout"],
        ["pitchout", "anyout"],
        ["gridout", "gridout"],
        ["out", "out"],
        ["in", "in"],
        ["vspacein", "vspacein"],
        ["unknown", "types"]
    ];

    it.each(INVALID_PAIRS)("rejects %s -> %s", (type1, type2) => {
        expect(ConnectionValidator.testConnectionType(type1, type2)).toBe(false);
    });

    it("rejects a connection whose reverse pairing is not itself listed", () => {
        // "pitchout:anyin" is allowed, but its reverse is not.
        expect(ConnectionValidator.testConnectionType("anyin", "pitchout")).toBe(false);
    });
});

describe("ConnectionValidator.testConnectionType — edge cases", () => {
    it("is case-sensitive", () => {
        expect(ConnectionValidator.testConnectionType("In", "Out")).toBe(false);
        expect(ConnectionValidator.testConnectionType("IN", "OUT")).toBe(false);
    });

    it("returns false for empty string dock types", () => {
        expect(ConnectionValidator.testConnectionType("", "")).toBe(false);
        expect(ConnectionValidator.testConnectionType("in", "")).toBe(false);
        expect(ConnectionValidator.testConnectionType("", "out")).toBe(false);
    });

    it("returns false for undefined or null dock types instead of throwing", () => {
        expect(ConnectionValidator.testConnectionType(undefined, "out")).toBe(false);
        expect(ConnectionValidator.testConnectionType("in", undefined)).toBe(false);
        expect(ConnectionValidator.testConnectionType(null, null)).toBe(false);
    });

    it("does not treat a colon embedded in a dock type as a separator", () => {
        // "in:vspaceout" collapsing "in" and "vspaceout" via a raw colon must
        // not be confused with a single dock type literally named "in:vspaceout".
        expect(ConnectionValidator.testConnectionType("in:vspaceout", "")).toBe(false);
    });

    it("does not mutate ALLOWED_CONNECTIONS when testing", () => {
        const sizeBefore = ConnectionValidator.ALLOWED_CONNECTIONS.size;
        ConnectionValidator.testConnectionType("in", "out");
        ConnectionValidator.testConnectionType("bogus", "pair");
        expect(ConnectionValidator.ALLOWED_CONNECTIONS.size).toBe(sizeBefore);
    });
});
