/**
 * Test AIDebuggerWidget handling of unrecognized hosts.
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://unrecognized-host.org/"}
 */

const AIDebuggerWidget = require("../aidebugger.js");

global._ = str => str;
global._THIS_IS_MUSIC_BLOCKS_ = true;

describe("AIDebuggerWidget Unknown Host Handling", () => {
    let warnSpy;

    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
        global._THIS_IS_MUSIC_BLOCKS_ = true;
    });

    test("logs warning, sets null BASE_URL, and disables network actions", () => {
        const w = new AIDebuggerWidget();
        w.chatLog = document.createElement("div");
        w.widgetWindow = {};
        w.activity = { textMsg: jest.fn() };
        w._lifecycle.mount();

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("AI Debugger: unrecognized host 'unrecognized-host.org'")
        );

        // When BASE_URL is null, _sendToBackend adds system message and resets _isProcessing
        w._isProcessing = true;
        w._sendToBackend("Test prompt");
        expect(w._isProcessing).toBe(false);
        expect(w.chatLog.textContent).toContain(
            "AI Debugger backend is not configured for this host."
        );

        // When BASE_URL is null, _initializeBackendWithProject adds system message
        w._initializeBackendWithProject("[]");
        expect(w.chatLog.textContent).toContain(
            "AI Debugger is not available on this host. The backend URL could not be determined."
        );
    });
});
