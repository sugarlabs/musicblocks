/**
 * Test AIDebuggerWidget hostname resolution for the GitHub Pages site, sugarlabs.github.io.
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://sugarlabs.github.io/musicblocks/"}
 */

const AIDebuggerWidget = require("../aidebugger.js");

global._ = str => str;
global._THIS_IS_MUSIC_BLOCKS_ = true;

describe("AIDebuggerWidget GitHub Pages Backend Resolution", () => {
    afterEach(() => {
        global._THIS_IS_MUSIC_BLOCKS_ = true;
    });

    test("resolves sugarlabs.github.io to production API", () => {
        const w = new AIDebuggerWidget();
        w.chatLog = document.createElement("div");
        w._showConsentBanner();
        expect(w.chatLog.querySelector("strong").textContent).toBe(
            "https://api.musicblocks.sugarlabs.org"
        );
    });
});
