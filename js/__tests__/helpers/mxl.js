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

const { deflateRawSync } = require("node:zlib");

const crc32 = bytes => {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) {
            crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
};

const makeZip = entries => {
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;

    for (const { name, contents, method = 8 } of entries) {
        const nameBytes = Buffer.from(name);
        const contentBytes = Buffer.from(contents);
        const compressed = method === 8 ? deflateRawSync(contentBytes) : contentBytes;
        const crc = crc32(contentBytes);
        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0x0800, 6);
        localHeader.writeUInt16LE(method, 8);
        localHeader.writeUInt32LE(crc, 14);
        localHeader.writeUInt32LE(compressed.length, 18);
        localHeader.writeUInt32LE(contentBytes.length, 22);
        localHeader.writeUInt16LE(nameBytes.length, 26);
        localParts.push(localHeader, nameBytes, compressed);

        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0x0800, 8);
        centralHeader.writeUInt16LE(method, 10);
        centralHeader.writeUInt32LE(crc, 16);
        centralHeader.writeUInt32LE(compressed.length, 20);
        centralHeader.writeUInt32LE(contentBytes.length, 24);
        centralHeader.writeUInt16LE(nameBytes.length, 28);
        centralHeader.writeUInt32LE(localOffset, 42);
        centralParts.push(centralHeader, nameBytes);
        localOffset += localHeader.length + nameBytes.length + compressed.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralDirectory.length, 12);
    eocd.writeUInt32LE(localOffset, 16);
    return Buffer.concat([...localParts, centralDirectory, eocd]);
};

const makeMXL = (score, options = {}) => {
    const scorePath = options.scorePath || "scores/main.musicxml";
    const container = `<container><rootfiles><rootfile full-path="${scorePath}" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>`;
    return makeZip([
        { name: "META-INF/container.xml", contents: container, method: 0 },
        { name: scorePath, contents: score, method: options.method ?? 8 }
    ]);
};

module.exports = { makeZip, makeMXL };
