/**
 * MusicBlocks v3.4.1
 *
 * @author Aditya Mishra
 *
 * @copyright 2026 Aditya Mishra
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

jest.mock("fs");

describe("minify.js", () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it("reads ast2blocks.json and writes minified output to ast2blocks.min.json", () => {
        const fs = require("fs");
        fs.readFileSync.mockReturnValue('{"key":"value","arr":[1,2,3]}');
        fs.writeFileSync.mockImplementation(() => {});
        require("../minify");
        expect(fs.readFileSync).toHaveBeenCalledWith("ast2blocks.json", "utf8");
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            "ast2blocks.min.json",
            '{"key":"value","arr":[1,2,3]}'
        );
    });

    it("minifies JSON by removing whitespace", () => {
        const fs = require("fs");
        fs.readFileSync.mockReturnValue('{\n  "key": "value",\n  "num": 42\n}');
        fs.writeFileSync.mockImplementation(() => {});
        require("../minify");
        const written = fs.writeFileSync.mock.calls[0][1];
        expect(written).toBe('{"key":"value","num":42}');
        expect(written).not.toContain("\n");
        expect(written).not.toContain("  ");
    });
});