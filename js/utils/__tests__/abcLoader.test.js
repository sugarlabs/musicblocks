// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * @jest-environment jsdom
 */

describe("ensureABCJS", () => {
    let ensureABCJS;

    beforeEach(() => {
        // Reset require module cache to ensure clean state per test if needed
        jest.resetModules();

        // Load the module properly
        ensureABCJS = require("../abcLoader");

        // Clean up mutations on window and document
        delete window.ABCJS;
        document.head.innerHTML = "";
    });

    it("should resolve immediately and do nothing if window.ABCJS already exists", async () => {
        window.ABCJS = {}; // Mock ABCJS being already present

        const appendChildSpy = jest.spyOn(document.head, "appendChild");

        await expect(ensureABCJS()).resolves.toBeUndefined();
        expect(appendChildSpy).not.toHaveBeenCalled();

        appendChildSpy.mockRestore();
    });

    it("should create and append a script tag if one doesn't exist", async () => {
        // We capture the script element that gets added
        let injectedScript = null;
        const appendChildSpy = jest.spyOn(document.head, "appendChild").mockImplementation(node => {
            injectedScript = node;
            // Native append child logic bypasses actual loading in jsdom, but we capture the element
        });

        const promise = ensureABCJS();

        // It should have created the script
        expect(appendChildSpy).toHaveBeenCalled();
        expect(injectedScript).not.toBeNull();
        expect(injectedScript.tagName).toBe("SCRIPT");
        expect(injectedScript.src).toMatch(/lib\/abc\.min\.js$/);

        // Simulate successful load
        injectedScript.onload();

        await expect(promise).resolves.toBeUndefined();
        expect(injectedScript.getAttribute("data-loaded")).toBe("true");

        appendChildSpy.mockRestore();
    });

    it("should reject if the script fails to load", async () => {
        let injectedScript = null;
        const appendChildSpy = jest.spyOn(document.head, "appendChild").mockImplementation(node => {
            injectedScript = node;
        });

        const promise = ensureABCJS();

        const mockError = new Error("Failed to load script");
        injectedScript.onerror(mockError);

        await expect(promise).rejects.toBe(mockError);

        appendChildSpy.mockRestore();
    });

    it("should reuse an existing script tag that has already loaded", async () => {
        // Pre-inject a loaded script into the head
        const existingScript = document.createElement("script");
        existingScript.src = "lib/abc.min.js";
        existingScript.setAttribute("data-loaded", "true");
        document.head.appendChild(existingScript);

        const appendChildSpy = jest.spyOn(document.head, "appendChild");

        // Should resolve immediately without adding a new script
        await expect(ensureABCJS()).resolves.toBeUndefined();

        expect(appendChildSpy).not.toHaveBeenCalled();

        appendChildSpy.mockRestore();
    });

    it("should wait for an existing script tag to load if it's not loaded yet", async () => {
        // Pre-inject an existing script that is currently loading
        const existingScript = document.createElement("script");
        existingScript.src = "lib/abc.min.js";
        document.head.appendChild(existingScript);

        const appendChildSpy = jest.spyOn(document.head, "appendChild");
        const addEventListenerSpy = jest.spyOn(existingScript, "addEventListener");

        const promise = ensureABCJS();

        // Should not append another script
        expect(appendChildSpy).not.toHaveBeenCalled();

        // Should attach an event listener to wait for loading
        expect(addEventListenerSpy).toHaveBeenCalledWith("load", expect.any(Function));

        // Get the resolved callback function and call it manually
        const onloadCallback = addEventListenerSpy.mock.calls[0][1];
        onloadCallback();

        await expect(promise).resolves.toBeUndefined();

        appendChildSpy.mockRestore();
        addEventListenerSpy.mockRestore();
    });
});
