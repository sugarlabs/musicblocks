/**
 * Test AIDebuggerWidget hostname resolution for musicblocks.sugarlabs.org subdomains.
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://dev.musicblocks.sugarlabs.org/"}
 */

const AIDebuggerWidget = require("../aidebugger.js");

global._ = str => str;
global._THIS_IS_MUSIC_BLOCKS_ = true;

describe("AIDebuggerWidget Subdomain Backend Resolution", () => {
    test("resolves subdomain.musicblocks.sugarlabs.org to production API", () => {
        const w = new AIDebuggerWidget();
        w.chatLog = document.createElement("div");
        w._showConsentBanner();
        expect(w.chatLog.querySelector("strong").textContent).toBe(
            "https://api.musicblocks.sugarlabs.org"
        );
    });
});
