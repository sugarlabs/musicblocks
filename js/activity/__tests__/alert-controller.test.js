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

const { setupAlertController, AlertController } = require("../alert-controller.js");

function makeMockActivity() {
    return {};
}

// ---------------------------------------------------------------------------
// setupAlertController
// ---------------------------------------------------------------------------

describe("setupAlertController", () => {
    test("attaches alertController instance to activity without passing activity to constructor", () => {
        const activity = makeMockActivity();
        setupAlertController(activity);

        expect(activity.alertController).toBeInstanceOf(AlertController);
    });
});

// ---------------------------------------------------------------------------
// AlertController.showText
// ---------------------------------------------------------------------------

describe("AlertController.showText - timeout calculations", () => {
    let controller;

    beforeEach(() => {
        jest.useFakeTimers();
        const activity = makeMockActivity();
        setupAlertController(activity);
        controller = activity.alertController;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("uses default MSG_TIMEOUT (60000ms) if duration is undefined", () => {
        const onShow = jest.fn();
        const onHide = jest.fn();

        controller.showText(undefined, onShow, onHide);

        expect(onShow).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(59999);
        expect(onHide).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(onHide).toHaveBeenCalledTimes(1);
    });

    test("cancels prior timer and overrides duration when a new text alert is shown", () => {
        const onShow1 = jest.fn();
        const onHide1 = jest.fn();
        const onShow2 = jest.fn();
        const onHide2 = jest.fn();

        controller.showText(1000, onShow1, onHide1);
        controller.showText(2000, onShow2, onHide2);

        jest.advanceTimersByTime(1000);
        expect(onHide1).not.toHaveBeenCalled();
        expect(onHide2).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1000);
        expect(onHide2).toHaveBeenCalledTimes(1);
    });

    test("stops the hide callback from firing when cleared manually", () => {
        const onShow = jest.fn();
        const onHide = jest.fn();

        controller.showText(1000, onShow, onHide);
        controller.clearTextTimeout();

        jest.advanceTimersByTime(1000);
        expect(onHide).not.toHaveBeenCalled();
    });

    test("does not schedule hide if duration is 0", () => {
        const onShow = jest.fn();
        const onHide = jest.fn();

        controller.showText(0, onShow, onHide);

        expect(onShow).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(120000);
        expect(onHide).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// AlertController.showError
// ---------------------------------------------------------------------------

describe("AlertController.showError - timeout calculations", () => {
    let controller;

    beforeEach(() => {
        jest.useFakeTimers();
        const activity = makeMockActivity();
        setupAlertController(activity);
        controller = activity.alertController;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("uses default ERROR_MSG_TIMEOUT (15000ms) if duration is undefined", () => {
        const onShow = jest.fn();
        const onHide = jest.fn();

        controller.showError(undefined, onShow, onHide);

        expect(onShow).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(14999);
        expect(onHide).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(onHide).toHaveBeenCalledTimes(1);
    });

    test("cancels prior timer and overrides duration when a new error alert is shown", () => {
        const onShow1 = jest.fn();
        const onHide1 = jest.fn();
        const onShow2 = jest.fn();
        const onHide2 = jest.fn();

        controller.showError(1000, onShow1, onHide1);
        controller.showError(2000, onShow2, onHide2);

        jest.advanceTimersByTime(1000);
        expect(onHide1).not.toHaveBeenCalled();
        expect(onHide2).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1000);
        expect(onHide2).toHaveBeenCalledTimes(1);
    });

    test("cancels timer when cleared manually", () => {
        const onShow = jest.fn();
        const onHide = jest.fn();

        controller.showError(1000, onShow, onHide);
        controller.clearErrorTimeout();

        jest.advanceTimersByTime(1000);
        expect(onHide).not.toHaveBeenCalled();
    });

    test("does not schedule hide if duration is 0", () => {
        const onShow = jest.fn();
        const onHide = jest.fn();

        controller.showError(0, onShow, onHide);

        expect(onShow).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(30000);
        expect(onHide).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// AlertController.hideAll
// ---------------------------------------------------------------------------

describe("AlertController.hideAll", () => {
    let controller;

    beforeEach(() => {
        jest.useFakeTimers();
        const activity = makeMockActivity();
        setupAlertController(activity);
        controller = activity.alertController;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("clears both text and error timeouts", () => {
        const onShowText = jest.fn();
        const onHideText = jest.fn();
        const onShowError = jest.fn();
        const onHideError = jest.fn();

        controller.showText(1000, onShowText, onHideText);
        controller.showError(1000, onShowError, onHideError);

        controller.hideAll();

        jest.advanceTimersByTime(2000);
        expect(onHideText).not.toHaveBeenCalled();
        expect(onHideError).not.toHaveBeenCalled();
    });

    test("is safe to call when no alerts are active", () => {
        expect(() => controller.hideAll()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// Callback safety and Robustness
// ---------------------------------------------------------------------------

describe("AlertController - Callback Safety", () => {
    let controller;

    beforeEach(() => {
        jest.useFakeTimers();
        const activity = makeMockActivity();
        setupAlertController(activity);
        controller = activity.alertController;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("does not crash when callbacks are omitted", () => {
        expect(() => {
            controller.showText(1000);
        }).not.toThrow();

        expect(() => {
            jest.advanceTimersByTime(1000);
        }).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// Integration: Activity methods delegate to AlertController
// ---------------------------------------------------------------------------

describe("Activity alert method integration", () => {
    let activity;
    let controller;

    function buildFakeActivity() {
        const printText = { classList: { add: jest.fn(), remove: jest.fn() } };
        const printTextContent = { replaceChildren: jest.fn(), textContent: "" };
        const errorText = { classList: { add: jest.fn(), remove: jest.fn() } };
        const errorTextContent = { textContent: "" };

        const act = {
            msgText: {},
            errorMsgText: {},
            printText,
            printTextContent,
            errorText,
            errorTextContent,
            refreshCanvas: jest.fn(),

            textMsg(msg, duration) {
                if (this.msgText === null) return;
                const showMsg = () => {
                    printText.classList.add("show");
                    printTextContent.replaceChildren();
                    if (typeof msg === "string") {
                        printTextContent.textContent = msg;
                    }
                };
                const hideMsg = () => {
                    printText.classList.remove("show");
                };
                if (this.alertController) {
                    this.alertController.showText(duration, showMsg, hideMsg);
                }
            },

            errorMsg(msg, blk, text, timeout) {
                if (this.errorMsgText === null) return;
                const showMsg = () => {
                    errorText.classList.add("show");
                    errorTextContent.textContent = msg;
                    this.refreshCanvas();
                };
                const hideMsg = () => {
                    errorText.classList.remove("show");
                    printText.classList.remove("show");
                };
                if (this.alertController) {
                    this.alertController.showError(timeout, showMsg, hideMsg);
                }
            },

            hideMsgs() {
                if (this.alertController) {
                    this.alertController.hideAll();
                }
                errorText.classList.remove("show");
                printText.classList.remove("show");
            }
        };

        setupAlertController(act);
        return act;
    }

    beforeEach(() => {
        jest.useFakeTimers();
        activity = buildFakeActivity();
        controller = activity.alertController;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("textMsg uses MSG_TIMEOUT (60000ms) default when no duration passed", () => {
        activity.textMsg("Hello default");

        expect(activity.printText.classList.add).toHaveBeenCalledWith("show");

        jest.advanceTimersByTime(60000);
        expect(activity.printText.classList.remove).toHaveBeenCalledWith("show");
    });

    test("textMsg respects an explicit duration", () => {
        activity.textMsg("Short message", 3000);

        jest.advanceTimersByTime(2999);
        expect(activity.printText.classList.remove).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(activity.printText.classList.remove).toHaveBeenCalledWith("show");
    });

    test("errorMsg uses ERROR_MSG_TIMEOUT (15000ms) default when no timeout passed", () => {
        activity.errorMsg("Divide by zero");

        expect(activity.errorText.classList.add).toHaveBeenCalledWith("show");

        jest.advanceTimersByTime(15000);
        expect(activity.errorText.classList.remove).toHaveBeenCalledWith("show");
    });

    test("hideMsgs calls hideAll and clears both active alerts", () => {
        const onShowText = jest.fn();
        const onHideText = jest.fn();
        const onShowError = jest.fn();
        const onHideError = jest.fn();

        controller.showText(1000, onShowText, onHideText);
        controller.showError(1000, onShowError, onHideError);

        activity.hideMsgs();

        jest.advanceTimersByTime(1000);
        expect(onHideText).not.toHaveBeenCalled();
        expect(onHideError).not.toHaveBeenCalled();
        expect(activity.errorText.classList.remove).toHaveBeenCalledWith("show");
        expect(activity.printText.classList.remove).toHaveBeenCalledWith("show");
    });

    test("simultaneous text and error alerts and hideAll / timeout ordering", () => {
        const onShowText = jest.fn();
        const onHideText = jest.fn();
        const onShowError = jest.fn();
        const onHideError = jest.fn();

        controller.showText(1000, onShowText, onHideText);
        controller.showError(2000, onShowError, onHideError);

        jest.advanceTimersByTime(1000);
        expect(onHideText).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1000);
        expect(onHideError).toHaveBeenCalledTimes(1);
    });

    test("repeated hideMsgs() calls are safe and do not throw or duplicate teardown", () => {
        activity.textMsg("Msg");
        activity.errorMsg("Err");

        expect(() => {
            activity.hideMsgs();
            activity.hideMsgs();
        }).not.toThrow();

        expect(activity.errorText.classList.remove).toHaveBeenCalledTimes(2);
        expect(activity.printText.classList.remove).toHaveBeenCalledTimes(2);
    });
});

// ---------------------------------------------------------------------------
// Internal state (timeout ID) management
// ---------------------------------------------------------------------------

describe("AlertController internal timer ID state tracking", () => {
    let controller;

    beforeEach(() => {
        jest.useFakeTimers();
        const activity = makeMockActivity();
        setupAlertController(activity);
        controller = activity.alertController;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("msgTimeoutID and errorMsgTimeoutID are tracked, cleared on expiry, and cleared manually", () => {
        expect(controller.msgTimeoutID).toBeNull();
        expect(controller.errorMsgTimeoutID).toBeNull();

        controller.showText(
            1000,
            () => {},
            () => {}
        );
        controller.showError(
            1000,
            () => {},
            () => {}
        );

        expect(controller.msgTimeoutID).not.toBeNull();
        expect(controller.errorMsgTimeoutID).not.toBeNull();

        controller.clearTextTimeout();
        expect(controller.msgTimeoutID).toBeNull();
        expect(controller.errorMsgTimeoutID).not.toBeNull();

        controller.clearErrorTimeout();
        expect(controller.errorMsgTimeoutID).toBeNull();

        // Reschedule
        controller.showText(
            1000,
            () => {},
            () => {}
        );
        controller.showError(
            1000,
            () => {},
            () => {}
        );

        expect(controller.msgTimeoutID).not.toBeNull();
        expect(controller.errorMsgTimeoutID).not.toBeNull();

        jest.advanceTimersByTime(1000);
        expect(controller.msgTimeoutID).toBeNull();
        expect(controller.errorMsgTimeoutID).toBeNull();
    });
});
