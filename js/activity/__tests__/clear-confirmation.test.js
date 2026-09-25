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

const { renderClearConfirmation } = require("../clear-confirmation.js");

function makeActivity() {
    return {
        addEventListener: jest.fn((target, event, handler) => {
            target.addEventListener(event, handler);
        })
    };
}

describe("renderClearConfirmation", () => {
    let onClearCanvas;
    let onClearAll;

    beforeEach(() => {
        document.body.replaceChildren();
        onClearCanvas = jest.fn();
        onClearAll = jest.fn();
    });

    test("creates the dialog with canvas, all, and cancel actions", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas, onClearAll });

        const modal = document.getElementById("clear-confirm");
        expect(modal).not.toBeNull();
        expect(modal.getAttribute("role")).toBe("dialog");
        expect(modal.querySelector("h2").textContent).toBe("Clear workspace");
        expect(modal.querySelector(".confirm-button").textContent).toBe("Clear canvas");
        expect(modal.querySelector(".clear-all-button").textContent).toBe("Clear all");
        expect(modal.querySelector(".cancel-button").textContent).toBe("Cancel");
    });

    test("does not open a second dialog while one is already open", () => {
        const activity = makeActivity();
        renderClearConfirmation(activity, { onClearCanvas, onClearAll });
        renderClearConfirmation(activity, { onClearCanvas, onClearAll });

        expect(document.querySelectorAll("#clear-confirm")).toHaveLength(1);
    });

    test("Clear canvas closes the dialog and leaves blocks alone", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas, onClearAll });

        document.querySelector(".confirm-button").click();

        expect(document.getElementById("clear-confirm")).toBeNull();
        expect(onClearCanvas).toHaveBeenCalledTimes(1);
        expect(onClearAll).not.toHaveBeenCalled();
    });

    test("Clear all closes the dialog and asks to trash blocks", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas, onClearAll });

        document.querySelector(".clear-all-button").click();

        expect(document.getElementById("clear-confirm")).toBeNull();
        expect(onClearAll).toHaveBeenCalledTimes(1);
        expect(onClearCanvas).not.toHaveBeenCalled();
    });

    test("Cancel closes the dialog with no side effects", () => {
        renderClearConfirmation(makeActivity(), { onClearCanvas, onClearAll });

        document.querySelector(".cancel-button").click();

        expect(document.getElementById("clear-confirm")).toBeNull();
        expect(onClearCanvas).not.toHaveBeenCalled();
        expect(onClearAll).not.toHaveBeenCalled();
    });
});
