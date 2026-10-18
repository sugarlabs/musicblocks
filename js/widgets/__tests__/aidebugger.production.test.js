/**
 * Test AIDebuggerWidget hostname resolution for apex musicblocks.sugarlabs.org domain.
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://musicblocks.sugarlabs.org/"}
 */

const AIDebuggerWidget = require("../aidebugger.js");

global._ = str => str;
global._THIS_IS_MUSIC_BLOCKS_ = true;

describe("AIDebuggerWidget Production Apex Backend Resolution", () => {
    afterEach(() => {
        global._THIS_IS_MUSIC_BLOCKS_ = true;
    });

    test("resolves musicblocks.sugarlabs.org to production API", () => {
        const w = new AIDebuggerWidget();
        w.chatLog = document.createElement("div");
        w._showConsentBanner();
        expect(w.chatLog.querySelector("strong").textContent).toBe(
            "https://api.musicblocks.sugarlabs.org"
        );
    });
});
