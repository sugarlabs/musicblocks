// Copyright (c) 2026 Sugar Labs
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

const { Blob } = require("node:buffer");
const { DecompressionStream } = require("node:stream/web");
const { TextDecoder } = require("node:util");
const { extractMXMLFromMXL, MAX_MXL_ARCHIVE_SIZE } = require("../project-manager.js");
const { makeZip, makeMXL } = require("./helpers/mxl.js");

const originalBlob = global.Blob;
const originalDecompressionStream = global.DecompressionStream;
const originalTextDecoder = global.TextDecoder;

beforeAll(() => {
    global.Blob = Blob;
    global.DecompressionStream = DecompressionStream;
    global.TextDecoder = TextDecoder;
});

afterAll(() => {
    global.Blob = originalBlob;
    global.DecompressionStream = originalDecompressionStream;
    global.TextDecoder = originalTextDecoder;
});

describe("extractMXMLFromMXL", () => {
    it("extracts a deflated score using the path in container.xml", async () => {
        const score = "<score-partwise><part-list/></score-partwise>";
        const archive = makeMXL(score);

        await expect(
            extractMXMLFromMXL(
                archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength)
            )
        ).resolves.toBe(score);
    });

    it("extracts a stored score", async () => {
        const score = "<score-partwise/>";
        await expect(extractMXMLFromMXL(makeMXL(score, { method: 0 }))).resolves.toBe(score);
    });

    it.each([
        ["truncated archive", Buffer.from("PK\u0005\u0006")],
        ["missing container", makeZip([{ name: "score.xml", contents: "<score-partwise/>" }])],
        [
            "malformed container",
            makeZip([
                { name: "META-INF/container.xml", contents: "<container>" },
                { name: "score.xml", contents: "<score-partwise/>" }
            ])
        ],
        [
            "missing score",
            makeZip([
                {
                    name: "META-INF/container.xml",
                    contents: "<container><rootfile full-path='missing.xml'/></container>"
                }
            ])
        ],
        [
            "unsafe score path",
            makeZip([
                {
                    name: "META-INF/container.xml",
                    contents: "<container><rootfile full-path='../score.xml'/></container>"
                }
            ])
        ]
    ])("rejects a %s", async (_description, archive) => {
        await expect(extractMXMLFromMXL(archive)).rejects.toThrow();
    });

    it("rejects archives exceeding the input size limit", async () => {
        await expect(extractMXMLFromMXL(new Uint8Array(MAX_MXL_ARCHIVE_SIZE + 1))).rejects.toThrow(
            "20 MiB limit"
        );
    });

    it("rejects scores exceeding the uncompressed size limit", async () => {
        const largeScore = "<score-partwise>" + "x".repeat(20 * 1024 * 1024) + "</score-partwise>";
        await expect(extractMXMLFromMXL(makeMXL(largeScore))).rejects.toThrow("too large");
    });

    it("rejects corrupted score data", async () => {
        const archive = makeMXL("<score-partwise/>");
        const eocdOffset = archive.length - 22;
        const centralOffset = archive.readUInt32LE(eocdOffset + 16);
        const containerNameLength = archive.readUInt16LE(centralOffset + 28);
        const scoreEntryOffset = centralOffset + 46 + containerNameLength;
        archive.writeUInt32LE(
            archive.readUInt32LE(scoreEntryOffset + 16) ^ 1,
            scoreEntryOffset + 16
        );
        await expect(extractMXMLFromMXL(archive)).rejects.toThrow();
    });
});
