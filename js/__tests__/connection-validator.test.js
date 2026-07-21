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

// Every test below derives its expectations from the real
// ConnectionValidator.ALLOWED_CONNECTIONS Set instead of hardcoding a second
// copy of the dataset, so the suite can't drift out of sync with production
// and still exercises every dock type pair that Blocks actually relies on.
const ALLOWED_PAIRS = [...ConnectionValidator.ALLOWED_CONNECTIONS].map(entry => entry.split(":"));

// Swapping each allowed "type1:type2" pair gives "type2:type1" candidates
// that are only valid if the swapped form is *also* explicitly listed. This
// yields real, meaningful invalid pairs built from production dock-type
// vocabulary rather than an invented, hand-maintained list.
const NON_RECIPROCAL_PAIRS = ALLOWED_PAIRS.map(([type1, type2]) => [type2, type1]).filter(
    ([type1, type2]) => !ConnectionValidator.ALLOWED_CONNECTIONS.has(`${type1}:${type2}`)
);

describe("ConnectionValidator.ALLOWED_CONNECTIONS", () => {
    it("is a non-empty Set", () => {
        expect(ConnectionValidator.ALLOWED_CONNECTIONS).toBeInstanceOf(Set);
        expect(ConnectionValidator.ALLOWED_CONNECTIONS.size).toBeGreaterThan(0);
    });

    it("is frozen so the exported API cannot be reassigned", () => {
        expect(Object.isFrozen(ConnectionValidator)).toBe(true);
    });
});

describe("ConnectionValidator.testConnectionType — returns true for allowed dock pairs", () => {
    it("has at least one allowed pair to exercise", () => {
        expect(ALLOWED_PAIRS.length).toBeGreaterThan(0);
    });

    it.each(ALLOWED_PAIRS)("allows %s -> %s", (type1, type2) => {
        expect(ConnectionValidator.testConnectionType(type1, type2)).toBe(true);
    });
});

describe("ConnectionValidator.testConnectionType — returns false for unsupported dock pairs", () => {
    it("has at least one non-reciprocal pair to exercise", () => {
        expect(NON_RECIPROCAL_PAIRS.length).toBeGreaterThan(0);
    });

    it.each(NON_RECIPROCAL_PAIRS)("rejects %s -> %s", (type1, type2) => {
        expect(ConnectionValidator.testConnectionType(type1, type2)).toBe(false);
    });

    it("rejects dock types that don't appear in the allowed set at all", () => {
        expect(ConnectionValidator.testConnectionType("unknown", "types")).toBe(false);
        expect(ConnectionValidator.testConnectionType("foo", "bar")).toBe(false);
    });
});

describe("ConnectionValidator.testConnectionType — edge cases", () => {
    it("is case-sensitive", () => {
        const [type1, type2] = ALLOWED_PAIRS[0];
        expect(ConnectionValidator.testConnectionType(type1.toUpperCase(), type2)).toBe(false);
        expect(ConnectionValidator.testConnectionType(type1, type2.toUpperCase())).toBe(false);
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
        // Concatenating "in:vspaceout" with an empty second argument must not
        // be confused with the legitimately allowed "in" -> "vspaceout" pair.
        expect(ConnectionValidator.testConnectionType("in:vspaceout", "")).toBe(false);
    });

    it("does not mutate ALLOWED_CONNECTIONS when testing", () => {
        const sizeBefore = ConnectionValidator.ALLOWED_CONNECTIONS.size;
        ConnectionValidator.testConnectionType("in", "out");
        ConnectionValidator.testConnectionType("bogus", "pair");
        expect(ConnectionValidator.ALLOWED_CONNECTIONS.size).toBe(sizeBefore);
    });
});
