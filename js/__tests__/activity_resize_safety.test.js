/**
 * @license
 * MusicBlocks v3.4.1
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const fs = require("fs");
const path = require("path");

describe("Activity resize safety guards", () => {
    let activitySource;

    beforeAll(() => {
        activitySource = fs.readFileSync(path.join(__dirname, "..", "activity.js"), "utf8");
    });

    it("defines a viewport dimension validator", () => {
        expect(activitySource).toContain("this._isValidViewportDimensions = (width, height) =>");
    });

    it("skips resize work for hidden tabs or invalid viewport dimensions", () => {
        expect(activitySource).toMatch(
            /document\.visibilityState === "hidden"[\s\S]*!this\._isValidViewportDimensions\(w, h\)/
        );
    });

    it("calls saveLocally only when it is a function", () => {
        expect(activitySource).toContain(
            'if (!force && typeof this.saveLocally === "function") {'
        );
    });

    it("guards save preview scale math when canvas dimensions are invalid", () => {
        expect(activitySource).toMatch(
            /const canvasWidth = this\.canvas \? this\.canvas\.width : 0;[\s\S]*!this\._isValidViewportDimensions\(canvasWidth, canvasHeight\)[\s\S]*320 \/ canvasWidth/
        );
    });
});
