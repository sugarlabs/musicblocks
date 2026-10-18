/**
 * Test AIDebuggerWidget hostname resolution for 127.0.0.1 loopback host.
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://127.0.0.1:8000/"}
 */

const AIDebuggerWidget = require("../aidebugger.js");

global._ = str => str;
global._THIS_IS_MUSIC_BLOCKS_ = true;

describe("AIDebuggerWidget Loopback Backend Resolution", () => {
    afterEach(() => {
        global._THIS_IS_MUSIC_BLOCKS_ = true;
    });

    test("resolves 127.0.0.1 to local backend URL", () => {
        const w = new AIDebuggerWidget();
        w.chatLog = document.createElement("div");
        w._showConsentBanner();
        expect(w.chatLog.querySelector("strong").textContent).toBe("http://127.0.0.1:8000");
    });
});
