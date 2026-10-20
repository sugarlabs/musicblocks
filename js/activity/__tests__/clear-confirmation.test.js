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

if (typeof global._ !== "function") {
    global._ = s => s;
}

const {
    renderClearConfirmation,
    requestClear,
    dismissClearConfirmation
} = require("../clear-confirmation.js");

function makeActivity() {
    return {
        addEventListener: jest.fn((target, event, handler) => {
            target.addEventListener(event, handler);
        }),
        removeEventListener: jest.fn((target, event, handler) => {
            target.removeEventListener(event, handler);
        })
    };
}

function dispatchKey(key, extra = {}) {
    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            key,
            bubbles: true,
            cancelable: true,
            ...extra
        })
    );
}

describe("renderClearConfirmation", () => {
    let onClearCanvas;

    beforeEach(() => {
        document.body.replaceChildren();
        onClearCanvas = jest.fn();
    });

    afterEach(() => {
        dismissClearConfirmation();
        document.body.replaceChildren();
    });

    test("creates the dialog with confirm and cancel actions", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas });

        const modal = document.getElementById("clear-confirm");
        expect(modal).not.toBeNull();
        expect(modal.getAttribute("role")).toBe("dialog");
        expect(modal.getAttribute("aria-modal")).toBe("true");
        expect(modal.querySelector("h2").textContent).toBe("Clear workspace");
        expect(modal.querySelector(".confirm-button").textContent).toBe("Confirm");
        expect(modal.querySelector(".cancel-button").textContent).toBe("Cancel");
        expect(modal.querySelector(".clear-all-button")).toBeNull();
    });

    test("does not open a second dialog while one is already open", () => {
        const activity = makeActivity();
        renderClearConfirmation(activity, { onClearCanvas });
        renderClearConfirmation(activity, { onClearCanvas });

        expect(document.querySelectorAll("#clear-confirm")).toHaveLength(1);
    });

    test("Confirm closes the dialog and clears the canvas only", () => {
        const activity = makeActivity();
        renderClearConfirmation(activity, { onClearCanvas });

        document.querySelector(".confirm-button").click();

        expect(document.getElementById("clear-confirm")).toBeNull();
        expect(onClearCanvas).toHaveBeenCalledTimes(1);
        expect(activity.removeEventListener).toHaveBeenCalledTimes(2);
    });

    test("Cancel closes the dialog with no side effects", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas });

        document.querySelector(".cancel-button").click();

        expect(document.getElementById("clear-confirm")).toBeNull();
        expect(onClearCanvas).not.toHaveBeenCalled();
    });

    test("moves focus into the dialog and restores it on close", () => {
        const invoker = document.createElement("button");
        invoker.id = "clear-invoker";
        document.body.appendChild(invoker);
        invoker.focus();

        renderClearConfirmation(makeActivity(), { onClearCanvas });

        expect(document.activeElement).toBe(document.querySelector(".confirm-button"));

        document.querySelector(".cancel-button").click();

        expect(document.activeElement).toBe(invoker);
    });

    test("Escape closes the dialog without running a clear action", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas });

        dispatchKey("Escape");

        expect(document.getElementById("clear-confirm")).toBeNull();
        expect(onClearCanvas).not.toHaveBeenCalled();
    });

    test("Tab keeps keyboard focus on the dialog buttons", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas });

        const confirmBtn = document.querySelector(".confirm-button");
        const cancelBtn = document.querySelector(".cancel-button");

        cancelBtn.focus();
        dispatchKey("Tab");
        expect(document.activeElement).toBe(confirmBtn);

        dispatchKey("Tab");
        expect(document.activeElement).toBe(cancelBtn);

        confirmBtn.focus();
        dispatchKey("Tab", { shiftKey: true });
        expect(document.activeElement).toBe(cancelBtn);
    });

    test("binds clicks locally when activity does not track listeners", () => {
        renderClearConfirmation({}, { onClearCanvas });

        document.querySelector(".confirm-button").click();

        expect(document.getElementById("clear-confirm")).toBeNull();
        expect(onClearCanvas).toHaveBeenCalledTimes(1);
    });

    test("ignores a second close after the dialog is already gone", () => {
        const activity = makeActivity();
        renderClearConfirmation(activity, { onClearCanvas });

        const cancelHandler = activity.addEventListener.mock.calls.find(call =>
            call[0].classList.contains("cancel-button")
        )[2];

        cancelHandler();
        cancelHandler();

        expect(document.getElementById("clear-confirm")).toBeNull();
        expect(onClearCanvas).not.toHaveBeenCalled();
    });

    test("ignores non-Tab keys while the dialog is open", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas });

        dispatchKey("ArrowDown");

        expect(document.getElementById("clear-confirm")).not.toBeNull();
        expect(onClearCanvas).not.toHaveBeenCalled();
    });

    test("Tab from the dialog frame focuses the first action", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas });

        document.getElementById("clear-confirm").focus();
        dispatchKey("Tab");

        expect(document.activeElement).toBe(document.querySelector(".confirm-button"));
    });

    test("removes listeners from the buttons when activity cannot untrack them", () => {
        const activity = {
            addEventListener: (target, event, handler) => {
                target.addEventListener(event, handler);
            }
        };

        renderClearConfirmation(activity, { onClearCanvas });
        document.querySelector(".cancel-button").click();

        expect(document.getElementById("clear-confirm")).toBeNull();
    });

    test("renders backdrop overlay and clicking it closes the dialog", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas });

        const modal = document.getElementById("clear-confirm");
        const backdrop = document.getElementById("clear-confirm-backdrop");

        expect(modal).not.toBeNull();
        expect(backdrop).not.toBeNull();
        expect(backdrop.classList.contains("modal-backdrop")).toBe(true);

        // Clicking backdrop closes modal without clearing canvas
        backdrop.click();

        expect(document.getElementById("clear-confirm")).toBeNull();
        expect(document.getElementById("clear-confirm-backdrop")).toBeNull();
        expect(onClearCanvas).not.toHaveBeenCalled();
    });

    test("activities.css defines responsive sizing and backdrop rules for .modalBox", () => {
        const fs = require("fs");
        const path = require("path");
        const activitiesCss = fs.readFileSync(
            path.join(__dirname, "..", "..", "..", "css", "activities.css"),
            "utf8"
        );

        // Modal backdrop overlay
        expect(activitiesCss).toMatch(/\.modal-backdrop/);

        // .modalBox box-sizing, max-width and max-height constraints
        expect(activitiesCss).toMatch(/\.modalBox\s*\{[^}]*box-sizing:\s*border-box/);
        expect(activitiesCss).toMatch(/\.modalBox\s*\{[^}]*max-width:\s*calc\(100vw\s*-\s*32px\)/);
        expect(activitiesCss).toMatch(/\.modalBox\s*\{[^}]*max-height:\s*calc\(100vh\s*-\s*32px\)/);

        // Responsive media query for <= 600px
        expect(activitiesCss).toMatch(/@media\s*\(max-width:\s*600px\)\s*\{[^}]*\.modalBox/);
    });
});

describe("requestClear", () => {
    afterEach(() => {
        dismissClearConfirmation();
        document.body.replaceChildren();
    });

    test("runs the canvas action immediately when confirmation is skipped", () => {
        const onClearCanvas = jest.fn();

        requestClear(makeActivity(), true, onClearCanvas);

        expect(onClearCanvas).toHaveBeenCalledTimes(1);
        expect(document.getElementById("clear-confirm")).toBeNull();
    });

    test("opens the dialog when confirmation is required", () => {
        const onClearCanvas = jest.fn();

        requestClear(makeActivity(), false, onClearCanvas);

        expect(document.getElementById("clear-confirm")).not.toBeNull();
        expect(onClearCanvas).not.toHaveBeenCalled();
    });

    test("dismisses a pending dialog before a skip-confirmation clear", () => {
        const pendingClear = jest.fn();
        const projectLoadClear = jest.fn();
        const activity = makeActivity();

        requestClear(activity, false, pendingClear);
        expect(document.getElementById("clear-confirm")).not.toBeNull();

        requestClear(activity, true, projectLoadClear);

        expect(document.getElementById("clear-confirm")).toBeNull();
        expect(projectLoadClear).toHaveBeenCalledTimes(1);
        expect(pendingClear).not.toHaveBeenCalled();
        expect(activity.removeEventListener).toHaveBeenCalled();
    });
});

describe("AMD export", () => {
    test("registers the dialog helpers on window", () => {
        const previousDefine = global.define;

        try {
            jest.isolateModules(() => {
                const define = jest.fn(factory => factory());
                define.amd = true;
                global.define = define;

                require("../clear-confirmation.js");

                expect(define).toHaveBeenCalledTimes(1);
                expect(typeof window.renderClearConfirmation).toBe("function");
                expect(typeof window.requestClear).toBe("function");
                expect(typeof window.dismissClearConfirmation).toBe("function");
            });
        } finally {
            global.define = previousDefine;
        }
    });
});
