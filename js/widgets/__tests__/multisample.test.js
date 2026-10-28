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
    Frequency: root => {
        const midi =
            { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[root[0]] +
            (root.includes("#") ? 1 : root.includes("b") ? -1 : 0) +
            12 * (Number(root.slice(-1)) + 1);
        return { toMidi: () => midi, toFrequency: () => 440 * Math.pow(2, (midi - 69) / 12) };
    }
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

    test.each(["slider", "7"])(
        "keeps an existing widget %s intact and requires closing it before editing",
        key => {
            const other = { getWidgetFrame: () => document.createElement("div") };
            const samplerWindow = { getWidgetFrame: () => document.createElement("div") };
            activity.logo.sample = {
                widgetWindow: samplerWindow,
                pauseForMultisample: jest.fn()
            };
            window.widgetWindows.openWindows = { sampler: samplerWindow, [key]: other };
            MultisampleEditor.open(activity);
            expect(Boolean(activity.multisampleEditor)).toBe(false);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Close other widgets before editing this instrument."
            );
            expect(window.widgetWindows.openWindows[key]).toBe(other);
            expect(activity.logo.sample.pauseForMultisample).not.toHaveBeenCalled();
            delete window.widgetWindows.openWindows[key];
            MultisampleEditor.open(activity);
            expect(activity.multisampleEditor).toBeInstanceOf(MultisampleEditor);
            expect(activity.logo.sample.pauseForMultisample).toHaveBeenCalledTimes(1);
        }
    );

    test("Listen prepares only an unassigned recording and leaves the draft unchanged", async () => {
        const sampler = {
            toDestination: jest.fn(),
            triggerAttack: jest.fn(),
            context: { lookAhead: 0 }
        };
        activity.logo.synth = {
            registerMultisample: jest.fn(() => "audition"),
            __createSynth: jest.fn().mockResolvedValue(sampler),
            getMultisampleDuration: () => 1,
            setVolume: jest.fn(),
            unregisterMultisample: jest.fn()
        };
        MultisampleEditor.open(activity);
        await upload();
        const session = activity.multisampleEditor;
        const before = JSON.stringify(session.draft);
        expect(button("Preview instrument").disabled).toBe(true);
        await button("Listen").onclick();
        expect(activity.logo.synth.registerMultisample.mock.calls[0][0].samples).toEqual([
            { ...session.draft.samples[0], root: "C4" }
        ]);
        expect(sampler.triggerAttack).toHaveBeenCalledWith("C4");
        expect(sampler.toDestination).toHaveBeenCalled();
        expect(JSON.stringify(session.draft)).toBe(before);
        expect(button("Stop").hidden).toBe(false);
        button("Stop").click();
        expect(activity.logo.synth.unregisterMultisample).toHaveBeenCalledTimes(1);
    });

    describe("audition with shared Synth preparation", () => {
        const { Synth, instruments } = require("../../utils/synthutils.js");
        let originalTone;
        let originalClamp;
        let nodes;
        let decode;
        let synth;
        const pcm = (bytes = 32000) => ({ length: bytes / 4, numberOfChannels: 1, duration: 1 });
        const deferred = () => {
            let resolve, reject;
            const promise = new Promise((yes, no) => {
                resolve = yes;
                reject = no;
            });
            return { promise, resolve, reject };
        };
        const flush = async () => {
            for (let i = 0; i < 12; i++) await Promise.resolve();
        };
        const open = () => {
            const descriptor = value();
            descriptor.samples.push({ ...descriptor.samples[0], name: "high.wav", root: "C4" });
            const owner = { blockIndex: 0, value: descriptor };
            activity.blocks.blockList.push(owner);
            MultisampleEditor.open(activity, owner);
            return activity.multisampleEditor;
        };

        beforeEach(() => {
            jest.useFakeTimers();
            originalClamp = global.clampNumber;
            global.clampNumber = require("../../utils/utils-logic.js").clampNumber;
            originalTone = global.Tone;
            nodes = [];
            decode = jest.fn().mockResolvedValue(pcm());
            global.Tone = {
                ...require("../../utils/__tests__/tonemock.js"),
                Frequency: originalTone.Frequency,
                ToneAudioBuffer: { load: decode },
                start: jest.fn().mockResolvedValue(),
                Sampler: class extends require("../../utils/__tests__/tonemock.js").Sampler {
                    constructor() {
                        super();
                        this.context = { lookAhead: 0 };
                        this.dispose = jest.fn();
                        nodes.push(this);
                    }
                }
            };
            synth = new Synth();
            activity.logo.synth = synth;
        });

        afterEach(() => {
            activity.multisampleEditor?.close();
            synth.disposeAllInstruments();
            global.Tone = originalTone;
            if (originalClamp === undefined) delete global.clampNumber;
            else global.clampNumber = originalClamp;
            jest.useRealTimers();
        });

        test("prepares the whole instrument before one selected note and releases naturally", async () => {
            const session = open();
            const last = deferred();
            decode.mockResolvedValueOnce(pcm()).mockReturnValueOnce(last.promise);
            expect(session.previewPitch.value).toBe("C4");
            session.previewPitch.value = "D4";
            const pending = button("Preview instrument").onclick();
            await flush();
            expect(nodes).toHaveLength(0);
            expect(synth.multisampleBytes).toBe(32000);
            expect(button("Stop").hidden).toBe(false);
            last.resolve(pcm());
            await pending;
            expect(nodes).toHaveLength(1);
            expect(nodes[0].triggerAttack).toHaveBeenCalledWith("D4");
            expect(synth.multisampleBytes).toBe(64000);
            jest.advanceTimersByTime(1001);
            expect(nodes[0].dispose).toHaveBeenCalledTimes(1);
            expect(synth.multisampleBytes).toBe(0);
            expect(button("Stop").hidden).toBe(true);
            expect(jest.getTimerCount()).toBe(0);
        });

        test.each(["resolve", "reject"])("Stop/retry is independent of a late %s", async settle => {
            open();
            const old = deferred();
            decode.mockReturnValueOnce(old.promise);
            const abandoned = button("Listen").onclick();
            button("Stop").click();
            await button("Listen").onclick();
            expect(nodes).toHaveLength(1);
            old[settle](settle === "resolve" ? pcm() : new Error("old decode failure"));
            await abandoned;
            expect(nodes).toHaveLength(1);
            expect(nodes[0].triggerAttack).toHaveBeenCalledTimes(1);
            expect(nodes[0].dispose).not.toHaveBeenCalled();
            expect(synth.multisampleBytes).toBe(32000);
            expect(activity.multisampleEditor.status.textContent).toContain("Playing audition");
        });

        test.each(["name", "root", "target", "remove", "picker", "owner", "close", "project"])(
            "%s stops audition before late preparation can sound",
            async change => {
                const session = open();
                const old = deferred();
                decode.mockReturnValueOnce(old.promise);
                const pending = button("Listen").onclick();
                if (change === "name") session.nameInput.dispatchEvent(new Event("input"));
                if (change === "root")
                    document.querySelector("select").dispatchEvent(new Event("change"));
                if (change === "target") session.previewPitch.dispatchEvent(new Event("input"));
                if (change === "remove") button("Remove").click();
                if (change === "picker") button("Replace…").click();
                if (change === "owner") session.invalidateOwner(session.owner);
                if (change === "close") session.close();
                if (change === "project") {
                    activity.multisampleProjectGeneration =
                        (activity.multisampleProjectGeneration || 0) + 1;
                    session.close();
                }
                old.resolve(pcm());
                await pending;
                expect(nodes).toHaveLength(0);
                expect(synth.multisampleBytes).toBe(0);
                expect(jest.getTimerCount()).toBe(0);
            }
        );

        test("a named decode failure preserves saved audio and permits a complete retry", async () => {
            const session = open();
            const saved = JSON.stringify(session.owner.value);
            decode.mockResolvedValueOnce(pcm()).mockRejectedValueOnce(new Error("bad WAV"));
            await button("Preview instrument").onclick();
            expect(nodes).toHaveLength(0);
            expect(synth.multisampleBytes).toBe(0);
            expect(session.status.textContent).toContain("Original / high.wav");
            expect(JSON.stringify(session.owner.value)).toBe(saved);
            expect(button("Preview instrument").disabled).toBe(false);
            await button("Preview instrument").onclick();
            expect(nodes[0].triggerAttack).toHaveBeenCalledWith("C4");
        });

        test("whole-attempt timeout releases partial PCM and retry never waits for old decoding", async () => {
            const session = open();
            const old = deferred();
            decode.mockResolvedValueOnce(pcm()).mockReturnValueOnce(old.promise);
            const pending = button("Preview instrument").onclick();
            await flush();
            jest.advanceTimersByTime(30000);
            await pending;
            expect(session.status.textContent).toContain("timed out: Original");
            expect(synth.multisampleBytes).toBe(0);
            await button("Listen").onclick();
            old.resolve(pcm());
            await flush();
            expect(nodes).toHaveLength(1);
            expect(nodes[0].triggerAttack).toHaveBeenCalledTimes(1);
        });

        test("audition counts ready and partial owners without evicting either", async () => {
            const session = open();
            const ready = synth.registerMultisample(value());
            decode.mockResolvedValueOnce(pcm(32 * 1024 * 1024));
            const readyNode = await synth.__createSynth(0, ready, ready, {});
            const partial = synth.registerMultisample(session.draft);
            const held = deferred();
            decode.mockResolvedValueOnce(pcm(32 * 1024 * 1024)).mockReturnValueOnce(held.promise);
            const preparing = synth.__createSynth(1, partial, partial, {});
            await flush();
            await button("Listen").onclick();
            expect(session.status.textContent).toContain("memory limit");
            expect(synth.multisampleBytes).toBe(64 * 1024 * 1024);
            expect(readyNode.dispose).not.toHaveBeenCalled();
            synth.releaseMultisample(1, partial);
            await expect(preparing).rejects.toMatchObject({ name: "AbortError" });
            held.resolve(pcm());
            await button("Listen").onclick();
            expect(instruments[0][ready]).toBe(readyNode);
            expect(synth.multisampleBytes).toBe(32 * 1024 * 1024 + 32000);
        });

        test("Apply releases audition before fresh whole-bank preparation", async () => {
            const session = open();
            session.nameInput.value = "Edited";
            session.nameInput.dispatchEvent(new Event("input"));
            await button("Preview instrument").onclick();
            const old = nodes[0];
            const checking = deferred();
            decode.mockReturnValueOnce(checking.promise);
            const pending = button("Apply").onclick();
            expect(old.dispose).toHaveBeenCalledTimes(1);
            expect(synth.multisampleBytes).toBe(0);
            button("Stop").click();
            checking.resolve(pcm());
            await pending;
            expect(session.owner.value.name).toBe("Original");
            expect(synth.multisampleBytes).toBe(0);
            expect(button("Preview instrument").disabled).toBe(false);
            expect(jest.getTimerCount()).toBe(0);
        });

        test("invalid target reports the instrument and pitch without losing recordings", async () => {
            const session = open();
            session.previewPitch.value = "not a pitch";
            await button("Preview instrument").onclick();
            expect(session.status.textContent).toContain("Original / not a pitch");
            expect(nodes[0].triggerAttack).not.toHaveBeenCalled();
            expect(synth.multisampleBytes).toBe(0);
            session.previewPitch.value = "C4";
            await button("Preview instrument").onclick();
            expect(nodes[1].triggerAttack).toHaveBeenCalledWith("C4");
        });

        test("long natural durations cannot overflow browser timers and remain stoppable", async () => {
            open();
            decode.mockResolvedValue({ ...pcm(), duration: 3000000 });
            await button("Listen").onclick();
            jest.advanceTimersByTime(2147483647);
            expect(nodes[0].dispose).not.toHaveBeenCalled();
            expect(button("Stop").hidden).toBe(false);
            button("Stop").click();
            expect(nodes[0].dispose).toHaveBeenCalledTimes(1);
            expect(jest.getTimerCount()).toBe(0);
        });

        test("Escape dismisses native preview suggestions without closing a clean saved draft", () => {
            const session = open();
            const escape = new KeyboardEvent("keydown", {
                key: "Escape",
                bubbles: true,
                cancelable: true
            });
            session.previewPitch.dispatchEvent(escape);
            expect(escape.defaultPrevented).toBe(false);
            expect(activity.multisampleEditor).toBe(session);
            expect(document.querySelector('[role="alertdialog"]')).toBeNull();
        });

        test("repeated auditions and disposal return timers, nodes and accounting to baseline", async () => {
            open();
            for (let i = 0; i < 10; i++) {
                await button("Listen").onclick();
                await button("Preview instrument").onclick();
                expect(nodes[2 * i].dispose).toHaveBeenCalledTimes(1);
                button("Stop").click();
                expect(nodes[2 * i + 1].dispose).toHaveBeenCalledTimes(1);
                expect(synth.multisampleBytes).toBe(0);
                expect(jest.getTimerCount()).toBe(0);
            }
        });
    });

    test("keeps picker order and named failures until each incomplete row is repaired or removed", async () => {
        MultisampleEditor.open(activity);
        const picker = document.querySelector('input[type="file"]');
        expect(picker.multiple).toBe(true);
        Object.defineProperty(picker, "files", {
            value: [
                new File([wav()], "same.wav", { type: "audio/x-pn-wav" }),
                new File([new Uint8Array(16)], "broken.wav", { type: "audio/wav" }),
                new File([wav()], "same.wav", { type: "" })
            ]
        });
        await picker.onchange();
        const session = activity.multisampleEditor;
        expect(session.draft.samples.map(sample => sample.name)).toEqual([
            "same.wav",
            "broken.wav",
            "same.wav"
        ]);
        expect(document.activeElement).toBe(document.querySelector("select"));
        const selects = document.querySelectorAll("select");
        for (const [index, root] of [
            [0, "C3"],
            [2, "C4"]
        ]) {
            selects[index].value = root;
            selects[index].dispatchEvent(new Event("change"));
        }
        expect(button("Apply").disabled).toBe(true);
        expect(session.status.textContent).toContain("broken.wav");
        document.querySelectorAll('button[aria-label^="Remove"]')[1].click();
        expect(button("Apply").disabled).toBe(false);
        button("Undo removal").click();
        expect(button("Apply").disabled).toBe(true);
        expect(session.draft.samples[1].name).toBe("broken.wav");
    });

    test("opens an empty named draft and requires an explicit discard after editing", () => {
        MultisampleEditor.open(activity);
        const name = document.querySelector('input[name="multisample-name"]');
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

    test.each([
        "",
        "application/octet-stream",
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
        "audio/x-pn-wav",
        "audio/vnd.wave"
    ])(
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
        "retains conflicting MIME or spoofed WAV failures for explicit repair",
        async (bytes, type) => {
            MultisampleEditor.open(activity);
            await upload(bytes, type);
            expect(activity.multisampleEditor.draft.samples).toEqual([
                { name: "same.wav", root: "", data: "" }
            ]);
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
        const name = document.querySelector('input[name="multisample-name"]');
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

    test("replacement cancellation and invalid input retain audio; success retains root and position", async () => {
        const owner = { blockIndex: 0, value: value() };
        activity.blocks.blockList.push(owner);
        MultisampleEditor.open(activity, owner);
        const session = activity.multisampleEditor;
        const original = JSON.stringify(session.draft);
        document.querySelector('button[aria-label^="Replace"]').click();
        expect(session.picker.multiple).toBe(false);
        session.picker.oncancel();
        expect(JSON.stringify(session.draft)).toBe(original);
        document.querySelector('button[aria-label^="Replace"]').click();
        await upload(new Uint8Array(16), "audio/wav", "bad.wav");
        expect(JSON.stringify(session.draft)).toBe(original);
        expect(session.status.textContent).toContain("bad.wav");
        expect(button("Apply").disabled).toBe(false);
        document.querySelector('button[aria-label^="Replace"]').click();
        await upload(wav(), "audio/vnd.wave", "new.wav");
        expect(session.draft.samples[0]).toEqual({ ...value().samples[0], name: "new.wav" });
        expect(document.querySelector("select").value).toBe("C3");
        expect(document.querySelector("select").parentElement.parentElement.textContent).toContain(
            "Root kept"
        );
        expect(owner.value).toEqual(value());
        button("Cancel").click();
        button("Discard changes").click();
        expect(owner.value).toEqual(value());
    });

    test("repairs failed audio by replacement without choosing a root", async () => {
        MultisampleEditor.open(activity);
        await upload(new Uint8Array(16), "audio/wav", "broken.wav");
        await button("Apply").onclick();
        expect(document.activeElement).toBe(
            document.querySelector('button[aria-label^="Replace"]')
        );
        document.activeElement.click();
        await upload();
        expect(document.querySelector("select").value).toBe("");
        expect(document.activeElement).toBe(document.querySelector("select"));
        expect(button("Apply").disabled).toBe(true);
        expect(document.querySelector("select").parentElement.parentElement.textContent).toContain(
            "Root kept"
        );
    });

    test("accepts exact original-byte boundaries in order and retains an over-budget placeholder", async () => {
        MultisampleEditor.open(activity);
        const session = activity.multisampleEditor;
        const bytes = new Uint8Array(1000000);
        bytes.set(wav());
        Object.defineProperty(session.picker, "files", {
            configurable: true,
            value: Array.from(
                { length: 9 },
                (_, i) => new File([i < 8 ? bytes : wav()], "part" + i + ".wav")
            )
        });
        await session.picker.onchange();
        expect(
            session.draft.samples.slice(0, 8).every(sample => sample.data.length > 1000000)
        ).toBe(true);
        expect(session.draft.samples[8]).toEqual({ name: "part8.wav", root: "", data: "" });
        expect(session.status.textContent).toContain("part8.wav");
        expect(session.status.textContent).toContain("size limit");
        expect(button("Apply").disabled).toBe(true);
        document.querySelectorAll('button[aria-label^="Remove"]')[0].click();
        // A replacement must account for the retained bank while excluding its own old bytes.
        document.querySelectorAll('button[aria-label^="Replace"]')[7].click();
        await upload(bytes);
        expect(session.draft.samples[7].data.length).toBeGreaterThan(1000000);
        expect(button("Undo removal").disabled).toBe(true);
        button("Undo removal").click();
        expect(session.draft.samples).toHaveLength(8);
    });

    test("removal focuses the nearest row, permits one or zero, and undoes only the latest removal", async () => {
        MultisampleEditor.open(activity);
        await upload();
        await upload(wav(), "audio/wav", "last.wav");
        const selects = document.querySelectorAll("select");
        for (const [index, root] of [
            [0, "C3"],
            [1, "C4"]
        ]) {
            selects[index].value = root;
            selects[index].dispatchEvent(new Event("change"));
        }
        document.querySelectorAll('button[aria-label^="Remove"]')[0].click();
        expect(document.activeElement).toBe(document.querySelector("select"));
        expect(button("Apply").disabled).toBe(false);
        document.querySelector('button[aria-label^="Remove"]').click();
        expect(document.activeElement).toBe(button("Add recordings…"));
        expect(button("Apply").disabled).toBe(true);
        expect(activity.multisampleEditor.status.textContent).toContain(
            "Add at least one recording"
        );
        button("Undo removal").click();
        expect(activity.multisampleEditor.draft.samples.map(sample => sample.name)).toEqual([
            "last.wav"
        ]);
        expect(button("Apply").disabled).toBe(false);
        expect(button("Undo removal").hidden).toBe(true);
    });

    test("reserves pending count and byte capacity before any FileReader can finish", async () => {
        const NativeReader = global.FileReader;
        const reads = [];
        global.FileReader = class {
            readAsDataURL(file) {
                this.file = file;
                reads.push(this);
            }
            abort() {
                this.onabort?.();
            }
        };
        try {
            MultisampleEditor.open(activity);
            const session = activity.multisampleEditor;
            Object.defineProperty(session.picker, "files", {
                configurable: true,
                value: Array.from(
                    { length: 17 },
                    (_, i) => new File([new Uint8Array(1000000)], i + ".wav", { type: "audio/wav" })
                )
            });
            const pending = session.picker.onchange();
            expect(session.draft.samples).toHaveLength(16);
            expect(reads).toHaveLength(1);
            expect(button("Apply").disabled).toBe(true);
            expect(button("Cancel").disabled).toBe(false);
            expect(button("Add recordings…").disabled).toBe(true);
            expect(document.querySelector('button[aria-label^="Remove"]').disabled).toBe(true);
            // A second selection must not compete for the reserved capacity.
            await upload();
            expect(reads).toHaveLength(1);
            button("Cancel").click();
            expect(button("Keep editing")).toBe(document.activeElement);
            button("Keep editing").click();
            await pending;
            expect(session.status.textContent).toContain("16.wav");
            expect(session.status.textContent).toContain("Reading cancelled");
            expect(session.draft.samples).toHaveLength(16);
            expect(reads).toHaveLength(1);
        } finally {
            global.FileReader = NativeReader;
        }
    });

    test.each(["close", "owner", "project", "stop"])(
        "late replacement after %s cannot change saved audio or a later selection",
        async reason => {
            const NativeReader = global.FileReader;
            let reader;
            global.FileReader = class {
                constructor() {
                    reader = this;
                }
                readAsDataURL() {}
                abort() {
                    this.onabort?.();
                }
            };
            try {
                const owner = { blockIndex: 0, value: value() };
                activity.blocks.blockList.push(owner);
                MultisampleEditor.open(activity, owner);
                const session = activity.multisampleEditor;
                document.querySelector('button[aria-label^="Replace"]').click();
                const pending = upload(wav(), "audio/wav", "late.wav");
                const late = reader.onload;
                if (reason === "close") {
                    session.close();
                    MultisampleEditor.open(activity);
                }
                if (reason === "owner") session.invalidateOwner(owner);
                if (reason === "project") activity.multisampleProjectGeneration = 1;
                if (reason === "stop") session.stop();
                reader.result = "data:audio/wav;base64,UklGRjAwMDBXQVZF";
                late();
                await pending;
                expect(owner.value).toEqual(value());
                if (reason === "close")
                    expect(activity.multisampleEditor.draft.samples).toEqual([]);
                else expect(session.draft.samples).toEqual(value().samples);
            } finally {
                global.FileReader = NativeReader;
            }
        }
    );

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

    test("marks both enharmonic roots and focuses the first problem without correcting either pitch", async () => {
        MultisampleEditor.open(activity);
        await upload();
        await upload();
        const [first, second] = document.querySelectorAll("select");
        first.value = "C#3";
        first.dispatchEvent(new Event("change"));
        const flat = document.createElement("option");
        flat.value = flat.textContent = "Db3";
        second.append(flat);
        second.value = "Db3";
        second.dispatchEvent(new Event("change"));
        expect(document.querySelectorAll('select[aria-invalid="true"]')).toHaveLength(2);
        await button("Apply").onclick();
        expect(document.activeElement).toBe(first);
        expect([first.value, second.value]).toEqual(["C#3", "Db3"]);
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
        button("Add recordings…").click();
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
        expect(JSON.stringify(activity.multisampleEditor.draft.samples.slice(0, 1))).toBe(original);
        expect(activity.multisampleEditor.draft.samples[1].data).toBe("");
        expect(document.querySelector('[role="status"]').textContent).toContain("size limit");
        expect(button("Apply").disabled).toBe(true);
        document.querySelectorAll('button[aria-label^="Remove"]')[1].click();
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
        expect(activity.multisampleEditor.draft.samples).toHaveLength(9);
        expect(activity.multisampleEditor.status.textContent).toContain("size limit");
    });

    test("requires a name and rejects the seventeenth recording without merging duplicate filenames", async () => {
        MultisampleEditor.open(activity);
        for (let i = 0; i < 16; i++) await upload();
        expect(button("Add recordings…").disabled).toBe(true);
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
        expect(document.activeElement).toBe(
            document.querySelector('button[aria-label^="Replace"]')
        );
    });

    test("a decode error focuses the exact recording when filenames overlap", async () => {
        const descriptor = value();
        descriptor.samples = [
            { ...descriptor.samples[0], name: "a.wav", root: "C3" },
            { ...descriptor.samples[0], name: "ba.wav", root: "C4" }
        ];
        const owner = { blockIndex: 0, value: descriptor };
        activity.blocks.blockList.push(owner);
        activity.logo.synth = {
            registerMultisample: () => "editor-alias",
            __createSynth: jest
                .fn()
                .mockRejectedValue(new Error("Unable to decode recording: Original / ba.wav")),
            unregisterMultisample: jest.fn()
        };
        MultisampleEditor.open(activity, owner);
        const name = document.querySelector('input[name="multisample-name"]');
        name.value = "Changed";
        name.dispatchEvent(new Event("input"));
        await button("Apply").onclick();
        expect(document.activeElement).toBe(
            document.querySelectorAll('button[aria-label^="Replace"]')[1]
        );
    });
});
