// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const { MultisampleEditor } = require("../multisample.js");
const { validateMultisample, MULTISAMPLE_LIMITS } = require("../../utils/synthutils.js");
global.validateMultisample = validateMultisample;
global.MULTISAMPLE_LIMITS = MULTISAMPLE_LIMITS;
global.normalizeNoteAccidentals =
    require("../../utils/musicutils-pitch.js").normalizeNoteAccidentals;
global.Tone = {
    Frequency: root => ({
        toMidi: () =>
            ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })[root[0]] +
            (root.includes("#") ? 1 : root.includes("b") ? -1 : 0) +
            12 * (Number(root.slice(-1)) + 1)
    })
};
const wav = () => new Uint8Array([..."RIFF0000WAVE"].map(c => c.charCodeAt(0)));
const value = () => ({
    type: "multisample",
    version: 1,
    name: "Original",
    samples: [{ name: "same.wav", root: "C3", data: "data:audio/wav;base64,UklGRjAwMDBXQVZF" }]
});
const upload = async (bytes = wav(), type = "application/octet-stream", name = "same.wav") => {
    const picker = document.querySelector('input[type="file"]');
    Object.defineProperty(picker, "files", {
        configurable: true,
        value: [new File([bytes], name, { type })]
    });
    await picker.onchange();
};

describe("Focused multisample authoring", () => {
    let activity;
    const button = text =>
        [...document.querySelectorAll("button")].find(b => b.textContent === text);

    beforeEach(() => {
        document.body.replaceChildren();
        window.widgetWindows = {
            windowFor: () => {
                const frame = document.createElement("div");
                document.body.append(frame);
                return {
                    getWidgetBody: () => frame,
                    getWidgetFrame: () => frame,
                    show: jest.fn(),
                    unroll: jest.fn(),
                    takeFocus: jest.fn(),
                    destroy: () => frame.remove()
                };
            }
        };
        activity = {
            blocks: { blockList: [], isLoading: () => false },
            turtles: { running: () => false },
            logo: { synth: {} },
            errorMsg: jest.fn(),
            textMsg: jest.fn()
        };
    });

    afterEach(() => activity.multisampleEditor?.close());

    test("opens an empty named draft and requires an explicit discard after editing", () => {
        MultisampleEditor.open(activity);
        const name = document.querySelector('input[type="text"]');
        expect(name.value).toBe("My instrument");
        expect(document.querySelectorAll("select")).toHaveLength(0);
        expect(button("Apply").disabled).toBe(true);
        name.value = "弦 <b>name</b>";
        name.dispatchEvent(new Event("input"));
        button("Cancel").click();
        expect(document.activeElement).toBe(button("Keep editing"));
        button("Keep editing").click();
        expect(name.value).toBe("弦 <b>name</b>");
        button("Cancel").click();
        button("Discard changes").click();
        expect(activity.multisampleEditor).toBeNull();
        expect(document.querySelector("b")).toBeNull();
    });

    test.each(["", "application/octet-stream", "audio/wav", "audio/x-pn-wav", "audio/vnd.wave"])(
        "adds signature-verified %s audio unchanged with an unassigned explicit root",
        async type => {
            MultisampleEditor.open(activity);
            await upload(wav(), type, "弦 <b>same</b>.wav");
            const selector = document.querySelector("select");
            expect(selector.value).toBe("");
            expect(selector.querySelectorAll("optgroup")).toHaveLength(8);
            expect(document.activeElement).toBe(selector);
            expect(button("Apply").disabled).toBe(true);
            selector.value = "C3";
            selector.dispatchEvent(new Event("change"));
            expect(button("Apply").disabled).toBe(false);
            expect(activity.multisampleEditor.draft.samples[0]).toEqual({
                name: "弦 <b>same</b>.wav",
                root: "C3",
                data: "data:audio/wav;base64,UklGRjAwMDBXQVZF"
            });
            expect(document.querySelector("b")).toBeNull();
        }
    );

    test.each([
        [wav(), "audio/mpeg"],
        [new Uint8Array(16), "audio/wav"]
    ])(
        "rejects conflicting MIME or spoofed WAV bytes without changing the draft",
        async (bytes, type) => {
            MultisampleEditor.open(activity);
            await upload(bytes, type);
            expect(activity.multisampleEditor.draft.samples).toEqual([]);
            expect(document.querySelector('[role="status"]').textContent).toContain("same.wav");
            expect(button("Apply").disabled).toBe(true);
        }
    );

    test("prepares a detached edit completely before replacing its actual owner once", async () => {
        let ready;
        const owner = { blockIndex: 0, value: value(), setMultisampleValue: jest.fn() };
        activity.blocks.blockList.push(owner);
        activity.logo.synth = {
            registerMultisample: jest.fn(() => "editor-alias"),
            __createSynth: jest.fn(
                () =>
                    new Promise(resolve => {
                        ready = resolve;
                    })
            ),
            unregisterMultisample: jest.fn()
        };
        activity.saveLocally = jest.fn().mockResolvedValue(undefined);
        activity.blocks.highlight = jest.fn();
        MultisampleEditor.open(activity, owner);
        const name = document.querySelector('input[type="text"]');
        name.value = "Edited";
        name.dispatchEvent(new Event("input"));
        const applying = button("Apply").onclick();
        expect(document.querySelector('[role="status"]').textContent).toContain(
            "Checking recordings"
        );
        expect(owner.value.name).toBe("Original");
        expect(owner.setMultisampleValue).not.toHaveBeenCalled();
        ready();
        await applying;
        expect(owner.setMultisampleValue).toHaveBeenCalledTimes(1);
        expect(owner.setMultisampleValue).toHaveBeenCalledWith(
            { ...value(), name: "Edited" },
            true
        );
        expect(activity.logo.synth.unregisterMultisample).toHaveBeenCalledTimes(1);
        expect(activity.saveLocally).toHaveBeenCalledWith({ rejectOnProjectSaveError: true });
        expect(activity.multisampleEditor).toBeNull();
    });

    test("an unchanged edit closes without preparation or history", async () => {
        const owner = { blockIndex: 0, value: value(), setMultisampleValue: jest.fn() };
        activity.blocks.blockList.push(owner);
        MultisampleEditor.open(activity, owner);
        await button("Apply").onclick();
        expect(owner.setMultisampleValue).not.toHaveBeenCalled();
        expect(activity.multisampleEditor).toBeNull();
    });

    test("records creation once even when block loading completes synchronously", async () => {
        const { pubsub } = require("../../pubsub.js");
        global.pubsub = pubsub;
        activity.logo.synth = {
            registerMultisample: () => "editor-alias",
            __createSynth: jest.fn().mockResolvedValue(),
            unregisterMultisample: jest.fn()
        };
        activity.saveLocally = jest.fn();
        activity.blocks.highlight = jest.fn();
        activity.blocks.actionHistory = [];
        activity.blocks.loadNewBlocks = stack => {
            activity.blocks.blockList.push(
                { name: "settimbre", blockIndex: 0 },
                {
                    name: "multisample",
                    blockIndex: 1,
                    value: stack[1][1][1].value,
                    _multisampleRevision: 1
                },
                { name: "hidden", blockIndex: 2 }
            );
            pubsub.emit("finishedLoading", { token: 1 });
            return 1;
        };
        MultisampleEditor.open(activity);
        await upload();
        const select = document.querySelector("select");
        select.value = "C3";
        select.dispatchEvent(new Event("change"));
        const applying = button("Apply").onclick();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(activity.multisampleEditor).toBeNull();
        await applying;
        expect(activity.blocks.actionHistory).toEqual([{ type: "restore", blockId: 0 }]);
        expect(activity.saveLocally).toHaveBeenCalledTimes(1);
    });

    test.each(["trash", "replace", "revision"])(
        "refuses %s of a newly created owner before artwork completion without locking Cancel",
        async change => {
            const { pubsub } = require("../../pubsub.js");
            global.pubsub = pubsub;
            activity.logo.synth = {
                registerMultisample: () => "editor-alias",
                __createSynth: jest.fn().mockResolvedValue(),
                unregisterMultisample: jest.fn()
            };
            activity.saveLocally = jest.fn();
            activity.blocks.actionHistory = [];
            activity.blocks.loadNewBlocks = stack => {
                activity.blocks.blockList.push(
                    { name: "settimbre", blockIndex: 0 },
                    {
                        name: "multisample",
                        blockIndex: 1,
                        value: stack[1][1][1].value,
                        _multisampleRevision: 1
                    },
                    { name: "hidden", blockIndex: 2 }
                );
                return 1;
            };
            MultisampleEditor.open(activity);
            await upload();
            const select = document.querySelector("select");
            select.value = "C3";
            select.dispatchEvent(new Event("change"));
            const applying = button("Apply").onclick();
            await new Promise(resolve => setTimeout(resolve, 0));
            const saved = activity.blocks.blockList[1];
            if (change === "trash") saved.trash = true;
            if (change === "replace") activity.blocks.blockList[1] = { ...saved };
            if (change === "revision") saved._multisampleRevision++;
            pubsub.emit("finishedLoading", { token: 1 });
            await applying;
            expect(button("Apply").disabled).toBe(true);
            expect(button("Cancel").disabled).toBe(false);
            expect(activity.blocks.actionHistory).toEqual([]);
            expect(activity.saveLocally).not.toHaveBeenCalled();
            button("Cancel").click();
            button("Discard changes").click();
            expect(activity.multisampleEditor).toBeNull();
        }
    );

    test.each(["stop", "close", "owner", "project", "recycled", "draft"])(
        "%s abandons preparation and late completion cannot publish",
        async reason => {
            let ready;
            const owner = { blockIndex: 0, value: value(), setMultisampleValue: jest.fn() };
            activity.blocks.blockList.push(owner);
            activity.logo.synth = {
                registerMultisample: () => "editor-alias",
                __createSynth: () =>
                    new Promise(resolve => {
                        ready = resolve;
                    }),
                unregisterMultisample: jest.fn()
            };
            MultisampleEditor.open(activity, owner);
            const editor = activity.multisampleEditor;
            editor.nameInput.value = "Changed";
            editor.nameInput.dispatchEvent(new Event("input"));
            const pending = button("Apply").onclick();
            if (reason === "stop") button("Stop").click();
            if (reason === "close") editor.close();
            if (reason === "owner") {
                editor.invalidateOwner(owner);
                owner.value = JSON.parse(JSON.stringify(owner.value));
                expect(button("Apply").disabled).toBe(true);
                expect(editor.status.textContent).toContain("changed or was removed");
            }
            if (reason === "project") activity.multisampleProjectGeneration = 1;
            if (reason === "recycled") activity.blocks.blockList[0] = { ...owner };
            if (reason === "draft") {
                editor.nameInput.value = "Changed again";
                editor.nameInput.dispatchEvent(new Event("input"));
            }
            ready();
            await pending;
            expect(owner.setMultisampleValue).not.toHaveBeenCalled();
            expect(activity.logo.synth.unregisterMultisample).toHaveBeenCalled();
        }
    );

    test("closing abandons a real pending file read without adding a row to a later session", async () => {
        MultisampleEditor.open(activity);
        const pending = upload();
        activity.multisampleEditor.close();
        MultisampleEditor.open(activity);
        await pending;
        expect(activity.multisampleEditor.draft.samples).toEqual([]);
    });

    test("marks both conflicting roots and keeps repeated filenames independent", async () => {
        MultisampleEditor.open(activity);
        await upload();
        await upload();
        for (const select of document.querySelectorAll("select")) {
            select.value = "C3";
            select.dispatchEvent(new Event("change"));
        }
        expect(document.querySelectorAll('select[aria-invalid="true"]')).toHaveLength(2);
        expect(button("Apply").disabled).toBe(true);
        expect(activity.multisampleEditor.draft.samples).toHaveLength(2);
    });

    test("the same owner keeps its draft while another owner requires explicit discard", () => {
        const owner = { blockIndex: 0, value: value() };
        const other = { blockIndex: 1, value: value() };
        activity.blocks.blockList.push(owner, other);
        MultisampleEditor.open(activity, owner);
        const editor = activity.multisampleEditor;
        editor.nameInput.value = "My changes";
        editor.nameInput.dispatchEvent(new Event("input"));
        MultisampleEditor.open(activity, owner);
        expect(activity.multisampleEditor).toBe(editor);
        MultisampleEditor.open(activity, other);
        button("Keep editing").click();
        expect(activity.multisampleEditor).toBe(editor);
        MultisampleEditor.open(activity, other);
        button("Discard changes").click();
        expect(activity.multisampleEditor.owner).toBe(other);
        expect(activity.multisampleEditor.nameInput.value).toBe("Original");
    });

    test("refuses opening during execution or pending preparation without stopping the program", () => {
        activity.logo._executionRequest = { started: false };
        MultisampleEditor.open(activity);
        expect(activity.multisampleEditor).toBeUndefined();
        expect(activity.errorMsg).toHaveBeenCalledWith("Stop the program to edit this instrument.");
    });

    test("requires prior score audio cleanup to finish before opening", () => {
        activity.logo._synthsInitialized = true;
        MultisampleEditor.open(activity);
        expect(activity.multisampleEditor).toBeUndefined();
        activity.logo._synthsInitialized = false;
        MultisampleEditor.open(activity);
        expect(activity.multisampleEditor).toBeDefined();
    });

    test("an externally abandoned preparation restores usable retry controls", async () => {
        const owner = { blockIndex: 0, value: value() };
        activity.blocks.blockList.push(owner);
        activity.logo.synth = {
            registerMultisample: () => "alias",
            __createSynth: jest.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError")),
            unregisterMultisample: jest.fn()
        };
        MultisampleEditor.open(activity, owner);
        activity.multisampleEditor.nameInput.value = "Changed";
        activity.multisampleEditor.nameInput.dispatchEvent(new Event("input"));
        await button("Apply").onclick();
        expect(button("Apply").disabled).toBe(false);
        expect(button("Cancel").disabled).toBe(false);
        expect(activity.multisampleEditor.status.textContent).toBe("");
    });

    test("Escape first dismisses picker interaction and selects keep their native Escape", async () => {
        MultisampleEditor.open(activity);
        const session = activity.multisampleEditor;
        button("Add recording…").click();
        session.nameInput.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
        );
        expect(activity.multisampleEditor).toBe(session);
        await upload();
        const select = document.querySelector("select");
        const escape = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true
        });
        select.dispatchEvent(escape);
        expect(escape.defaultPrevented).toBe(false);
        expect(activity.multisampleEditor).toBe(session);
        session.close();
        expect(session.root).toBeNull();
        expect(session.ownerValue).toBeNull();
    });

    test("rejects an oversized file before reading and preserves an already complete row", async () => {
        MultisampleEditor.open(activity);
        await upload();
        const select = document.querySelector("select");
        select.value = "C1";
        select.dispatchEvent(new Event("change"));
        const original = JSON.stringify(activity.multisampleEditor.draft.samples);
        await upload(new Uint8Array(1000001));
        expect(JSON.stringify(activity.multisampleEditor.draft.samples)).toBe(original);
        expect(document.querySelector('[role="status"]').textContent).toContain("size limit");
        expect(button("Apply").disabled).toBe(false);
    });

    test("checks the total original-byte budget independently of individual file size", async () => {
        const owner = { blockIndex: 0, value: value() };
        const data = "data:audio/wav;base64," + btoa("RIFF0000WAVE" + "\0".repeat(999988));
        owner.value.samples = ["C1", "D1", "E1", "F1", "G1", "A1", "B1", "C2"].map(root => ({
            name: "same.wav",
            root,
            data
        }));
        activity.blocks.blockList.push(owner);
        MultisampleEditor.open(activity, owner);
        await upload();
        expect(activity.multisampleEditor.draft.samples).toHaveLength(8);
        expect(activity.multisampleEditor.status.textContent).toContain("size limit");
    });

    test("requires a name and rejects the seventeenth recording without merging duplicate filenames", async () => {
        MultisampleEditor.open(activity);
        for (let i = 0; i < 16; i++) await upload();
        expect(button("Add recording…").disabled).toBe(true);
        await upload();
        expect(activity.multisampleEditor.draft.samples).toHaveLength(16);
        expect(activity.multisampleEditor.status.textContent).toContain("size limit");
        activity.multisampleEditor.nameInput.value = "   ";
        activity.multisampleEditor.nameInput.dispatchEvent(new Event("input"));
        expect(activity.multisampleEditor.status.textContent).toContain("Enter an instrument name");
        expect(button("Apply").disabled).toBe(true);
    });

    test("a complete-check failure retains the saved value and a repairable draft", async () => {
        const owner = { blockIndex: 0, value: value(), setMultisampleValue: jest.fn() };
        activity.blocks.blockList.push(owner);
        activity.logo.synth = {
            registerMultisample: () => "editor-alias",
            __createSynth: jest
                .fn()
                .mockRejectedValue(new Error("Unable to decode recording: Original / same.wav")),
            unregisterMultisample: jest.fn()
        };
        MultisampleEditor.open(activity, owner);
        activity.multisampleEditor.nameInput.value = "Changed";
        activity.multisampleEditor.nameInput.dispatchEvent(new Event("input"));
        await button("Apply").onclick();
        expect(activity.multisampleEditor.status.textContent).toContain("same.wav");
        expect(owner.value).toEqual(value());
        expect(owner.setMultisampleValue).not.toHaveBeenCalled();
        expect(button("Apply").disabled).toBe(false);
        expect(activity.multisampleEditor.draft.name).toBe("Changed");
    });
});
