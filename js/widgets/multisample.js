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

/* global _, validateMultisample, MULTISAMPLE_LIMITS, Tone, normalizeNoteAccidentals, pubsub */
/* exported MultisampleEditor */

/** One detached authoring session. Saved blocks remain the source of truth. */
class MultisampleEditor {
    static open(activity, owner = null, origin = document.activeElement) {
        if (
            activity.turtles.running() ||
            activity.logo._synthsInitialized ||
            (activity.logo._executionRequest && !activity.logo._executionRequest.queuesReady) ||
            activity.blocks.isLoading()
        ) {
            activity.errorMsg(_("Stop the program to edit this instrument."));
            return;
        }
        const current = activity.multisampleEditor;
        if (current) {
            if (owner && current.owner === owner) current.bringForward();
            else current.requestClose(() => MultisampleEditor.open(activity, owner, origin));
            return;
        }
        let value = { type: "multisample", version: 1, name: _("My instrument"), samples: [] };
        if (owner) {
            try {
                value = validateMultisample(owner.value);
            } catch (error) {
                activity.errorMsg(error.message);
                return;
            }
        }
        const editor = new MultisampleEditor(activity, owner, value, origin);
        activity.multisampleEditor = editor;
        activity.logo.sample?.pauseForMultisample?.();
        editor.bringForward();
    }

    constructor(activity, owner, value, origin) {
        this.activity = activity;
        this.owner = owner;
        this.origin = origin;
        this.draft = value;
        this.initial = JSON.stringify(value);
        this.draftRevision = 0;
        this.closed = false;
        this.projectGeneration = activity.multisampleProjectGeneration || 0;
        this.ownerValue = owner?.value;
        this.ownerRevision = owner?._multisampleRevision || 0;
        this.rows = value.samples.map(() => ({}));
        this.widgetWindow = window.widgetWindows.windowFor(
            this,
            "Multisample instrument",
            "multisample"
        );
        this.widgetWindow.onclose = () => this.requestClose();
        this.widgetWindow.multisampleEditor = this;
        const body = this.widgetWindow.getWidgetBody();
        this.root = document.createElement("div");
        this.root.dataset.multisampleEditor = "";
        this.root.style.cssText =
            "padding:16px;box-sizing:border-box;width:min(600px,90vw);max-height:calc(100vh - 150px);overflow:auto;color:var(--color-text);background:var(--color-background);";
        body.append(this.root);
        const label = this.element("label", _("Instrument name"));
        this.nameInput = document.createElement("input");
        this.nameInput.type = "text";
        this.nameInput.style.cssText = "display:block;width:100%;box-sizing:border-box;";
        this.nameInput.value = value.name;
        this.nameInput.oninput = () => {
            this.draft.name = this.nameInput.value;
            this.draftRevision++;
            this.stop();
        };
        label.append(this.nameInput);
        this.element("p", _("Saves to blocks in this project."));
        this.element(
            "p",
            _("WAV only: up to 16 recordings, 1,000,000 bytes each, 8,000,000 bytes total.")
        );
        this.picker = document.createElement("input");
        this.picker.type = "file";
        this.picker.accept = ".wav,audio/wav,audio/x-wav,audio/x-pn-wav,audio/vnd.wave";
        this.picker.hidden = true;
        this.picker.setAttribute("aria-label", _("Add recording"));
        this.root.append(this.picker);
        this.picker.onchange = () => {
            this.pickerOpen = false;
            return this.addRecording(this.picker.files[0]);
        };
        this.picker.oncancel = () => {
            this.pickerOpen = false;
        };
        this.addButton = this.button(_("Add recording…"), () => {
            this.picker.value = "";
            this.pickerOpen = true;
            this.picker.click();
        });
        this.list = this.element("div");
        this.status = this.element("p");
        this.status.setAttribute("role", "status");
        this.status.setAttribute("aria-live", "polite");
        this.actions = this.element("div");
        this.applyButton = this.button(_("Apply"), () => this.apply(), this.actions);
        this.stopButton = this.button(_("Stop"), () => this.stop(), this.actions);
        this.cancelButton = this.button(_("Cancel"), () => this.requestClose(), this.actions);
        this.element(
            "p",
            _(
                "Use with Set Instrument in ordinary note programs. Widget capture and JavaScript export are not supported yet. Native project save/export includes the recordings."
            )
        );
        this.root.onkeydown = event => this.handleKeyDown(event);
        this.focusHandler = () => this.widgetWindow.takeFocus();
        this.root.addEventListener("focusin", this.focusHandler);
        this.renderRows();
        this.widgetWindow.sendToCenter?.();
    }

    element(tag, text = "", parent = this.root) {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.append(element);
        return element;
    }

    button(text, action, parent = this.root) {
        const button = this.element("button", text, parent);
        button.type = "button";
        button.onclick = action;
        return button;
    }

    update() {
        const problems = [];
        if (!this.draft.name.trim()) problems.push(_("Enter an instrument name."));
        if (!this.draft.samples.length) problems.push(_("Add at least one recording."));
        this.draft.samples.forEach((sample, index) => {
            const row = this.rows[index];
            let message = !sample.root ? _("Choose a root pitch.") : "";
            if (
                sample.root &&
                this.draft.samples.some(
                    (other, i) =>
                        i !== index &&
                        other.root &&
                        Tone.Frequency(normalizeNoteAccidentals(other.root)).toMidi() ===
                            Tone.Frequency(normalizeNoteAccidentals(sample.root)).toMidi()
                )
            ) {
                message = _("Recordings must have different root pitches.");
            }
            row.problem.textContent = message;
            row.select.setAttribute("aria-invalid", String(Boolean(message)));
            row.select.disabled = Boolean(this.busy);
            if (message) problems.push(sample.name + ": " + message);
        });
        if (!problems.length) {
            try {
                validateMultisample(this.draft);
            } catch (error) {
                problems.push(error.message);
            }
        }
        this.problem = problems.join(" ");
        this.applyButton.disabled = Boolean(this.problem || this.busy || this.invalid);
        this.nameInput.disabled = Boolean(this.busy);
        this.addButton.disabled = Boolean(
            this.busy || this.invalid || this.draft.samples.length >= MULTISAMPLE_LIMITS.samples
        );
        this.status.textContent = this.invalid || this.busy || this.problem;
        this.applyButton.title = this.status.textContent;
        this.stopButton.hidden = !this.busy || this.publishing;
        this.cancelButton.disabled = Boolean(this.publishing);
    }

    renderRows() {
        this.list.replaceChildren();
        this.draft.samples.forEach((sample, index) => {
            const row = this.rows[index];
            const section = this.element("div", "", this.list);
            section.style.cssText = "padding:8px 0;border-bottom:1px solid currentColor;";
            this.element("p", sample.name, section);
            const label = this.element("label", _("Root pitch") + " — " + sample.name, section);
            const select = this.element("select", "", label);
            select.style.cssText = "display:block;width:10em;max-width:100%;";
            this.element("option", _("Choose root…"), select).value = "";
            for (let octave = 1; octave <= 8; octave++) {
                const group = this.element("optgroup", "", select);
                group.label = _("Octave") + " " + octave;
                for (const pitch of [
                    "C",
                    "C#",
                    "D",
                    "D#",
                    "E",
                    "F",
                    "F#",
                    "G",
                    "G#",
                    "A",
                    "A#",
                    "B"
                ]) {
                    this.element(
                        "option",
                        _(pitch[0]) + (pitch.length > 1 ? "♯" : "") + octave,
                        group
                    ).value = pitch + octave;
                }
            }
            if (sample.root && ![...select.options].some(option => option.value === sample.root)) {
                this.element("option", sample.root, select).value = sample.root;
            }
            select.value = sample.root;
            select.onchange = () => {
                sample.root = select.value;
                this.draftRevision++;
                this.stop();
            };
            row.select = select;
            row.problem = this.element("p", "", section);
        });
        this.update();
    }

    async addRecording(file) {
        if (!file || this.closed || this.busy || this.invalid) return;
        const work = {};
        this.work = work;
        this.busy = _("Reading recording…");
        this.update();
        try {
            const mime = file.type.toLowerCase();
            const total = this.draft.samples.reduce((sum, sample) => {
                const base64 = sample.data.split(",")[1];
                return sum + (base64.length / 4) * 3 - (base64.match(/=+$/)?.[0].length || 0);
            }, 0);
            if (
                this.draft.samples.length >= MULTISAMPLE_LIMITS.samples ||
                file.size > MULTISAMPLE_LIMITS.fileBytes ||
                total + file.size > MULTISAMPLE_LIMITS.totalBytes
            )
                throw new Error(_("Multisample audio exceeds the file or instrument size limit."));
            if (
                mime &&
                mime !== "application/octet-stream" &&
                !/^audio\/(wav|wave|x-wav|x-pn-wav|vnd\.wave)$/.test(mime)
            ) {
                throw new Error(_("Recordings must contain embedded WAV audio."));
            }
            const data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                work.reader = reader;
                reader.onload = () =>
                    resolve("data:audio/wav;base64," + reader.result.split(",")[1]);
                reader.onerror = () => reject(new Error(_("Unable to read recording.")));
                reader.onabort = () => reject(new DOMException("Cancelled", "AbortError"));
                reader.readAsDataURL(file);
            });
            if (this.work !== work || !this.isCurrent()) return;
            // Validate only the upload here; the draft root remains explicitly unassigned.
            validateMultisample({
                type: "multisample",
                version: 1,
                name: "upload",
                samples: [{ name: file.name, root: "C1", data }]
            });
            this.draft.samples.push({ name: file.name, root: "", data });
            this.draftRevision++;
            this.rows.push({});
            this.busy = null;
            this.renderRows();
            this.rows[this.rows.length - 1].select.focus();
        } catch (error) {
            if (this.work === work && !this.closed && error.name !== "AbortError") {
                this.busy = null;
                this.update();
                this.status.textContent = file.name + ": " + error.message;
            }
        } finally {
            if (work.reader) {
                work.reader.onload = work.reader.onerror = work.reader.onabort = null;
                work.reader = null;
            }
            if (this.work === work) {
                this.work = null;
                this.busy = null;
            }
        }
    }

    bringForward() {
        this.widgetWindow.show();
        this.widgetWindow.unroll();
        this.widgetWindow.takeFocus();
        this.nameInput.focus();
    }

    isCurrent() {
        return (
            !this.closed &&
            !this.invalid &&
            this.activity.multisampleEditor === this &&
            (this.activity.multisampleProjectGeneration || 0) === this.projectGeneration &&
            (!this.owner ||
                (this.activity.blocks.blockList[this.owner.blockIndex] === this.owner &&
                    !this.owner.trash &&
                    this.owner.value === this.ownerValue &&
                    (this.owner._multisampleRevision || 0) === this.ownerRevision))
        );
    }

    invalidateOwner(owner) {
        if (this.publishing || !this.owner || owner !== this.owner || this.closed) return;
        this.stop();
        this.invalid = _("This instrument changed or was removed. Close and reopen it to edit.");
        this.update();
    }

    stop() {
        const work = this.work;
        this.work = null;
        if (work?.reader) work.reader.abort();
        if (work?.descriptor) this.activity.logo.synth.unregisterMultisample(work.descriptor);
        this.busy = null;
        if (!this.closed) this.update();
    }

    async apply() {
        if (!this.isCurrent() || this.busy || this.choice) return;
        this.update();
        if (this.problem) {
            (
                this.rows.find(row => row.select.getAttribute("aria-invalid") === "true")?.select ||
                this.nameInput
            ).focus();
            return;
        }
        const snapshot = validateMultisample(this.draft);
        if (this.owner && JSON.stringify(snapshot) === this.initial) {
            this.close();
            return;
        }
        const work = { descriptor: snapshot, revision: this.draftRevision };
        this.work = work;
        this.busy = _("Checking recordings…");
        this.update();
        try {
            const synth = this.activity.logo.synth;
            const current = () =>
                this.isCurrent() && this.work === work && work.revision === this.draftRevision;
            const alias = synth.registerMultisample(snapshot, current);
            await synth.__createSynth("multisample-editor", alias, alias, {});
            if (!current()) return;
            synth.unregisterMultisample(snapshot);
            work.descriptor = null;
            if (this.activity.blocks.isLoading())
                throw new Error(_("Wait for blocks to finish loading, then Apply again."));
            this.publishing = true;
            this.busy = _("Applying to blocks…");
            this.update();
            let saved = this.owner;
            if (saved) {
                saved.setMultisampleValue(snapshot, true);
            } else {
                saved = await this.createStack(snapshot);
            }
            if (this.closed || !saved) return;
            const activity = this.activity;
            this.close(false);
            activity.blocks.highlight(saved.blockIndex);
            saved.accessibleElement?.focus();
            activity.refreshCanvas?.();
            activity.textMsg(_("Instrument applied to blocks in this project."), 3000);
            return MultisampleEditor.saveAppliedProject(activity, this.projectGeneration);
        } catch (error) {
            if (this.work === work && !this.closed) {
                this.busy = null;
                this.publishing = false;
                this.update();
                if (error.name !== "AbortError") this.status.textContent = error.message;
            }
        } finally {
            if (work.descriptor) this.activity.logo.synth.unregisterMultisample(work.descriptor);
            if (this.work === work) {
                this.work = null;
                this.busy = null;
            }
        }
    }

    static async saveAppliedProject(activity, generation) {
        // Publication is complete. Storage failure must never roll back the blocks.
        try {
            const result = await activity.saveLocally({ rejectOnProjectSaveError: true });
            if (result === false) throw new Error("Local save failed");
        } catch {
            if ((activity.multisampleProjectGeneration || 0) !== generation) return;
            activity.textMsg(
                _(
                    "Blocks were applied, but local saving failed. Retry saving or export a Music Blocks project to keep your recordings."
                )
            );
        }
    }

    createStack(snapshot) {
        const blocks = this.activity.blocks;
        const first = blocks.blockList.length;
        return new Promise((resolve, reject) => {
            let token = null;
            let earlyCompletion = null;
            let created;
            let initialValue;
            const cleanup = () => {
                pubsub.off("finishedLoading", finished);
                pubsub.off("loadFailed", failed);
                this.cancelPublication = null;
            };
            const finished = payload => {
                if (token === null) {
                    earlyCompletion = payload;
                    return;
                }
                if (payload?.token !== token) return;
                cleanup();
                if (this.closed) {
                    resolve(null);
                    return;
                }
                const saved = created[1];
                if (
                    !this.isCurrent() ||
                    created.length !== 3 ||
                    !created.every(
                        (block, index) =>
                            block && blocks.blockList[first + index] === block && !block.trash
                    ) ||
                    saved.name !== "multisample" ||
                    saved._multisampleRevision !== 1 ||
                    (initialValue && saved.value !== initialValue) ||
                    JSON.stringify(saved.value) !== JSON.stringify(snapshot)
                ) {
                    this.invalid = _(
                        "This instrument changed or was removed. Close and reopen it to edit."
                    );
                    reject(new Error(this.invalid));
                    return;
                }
                blocks.actionHistory.push({ type: "restore", blockId: first });
                blocks.redoActionHistory = [];
                resolve(saved);
            };
            const failed = payload => {
                if (payload?.token !== token) return;
                cleanup();
                reject(payload.error);
            };
            this.cancelPublication = () => {
                cleanup();
                resolve(null);
            };
            pubsub.on("finishedLoading", finished);
            pubsub.on("loadFailed", failed);
            try {
                token = blocks.loadNewBlocks([
                    [0, "settimbre", 100, 100, [null, 1, null, 2]],
                    [1, ["multisample", { value: snapshot }], 0, 0, [0]],
                    [2, "hidden", 0, 0, [0, null]]
                ]);
                created = blocks.blockList.slice(first, first + 3);
                initialValue = created[1]?._multisampleRevision ? created[1].value : null;
                if (earlyCompletion) finished(earlyCompletion);
            } catch (error) {
                cleanup();
                reject(error);
            }
        });
    }

    handleKeyDown(event) {
        if (event.key === "Escape") {
            if (this.pickerOpen) {
                this.pickerOpen = false;
                event.stopPropagation();
                return;
            }
            if (
                !["SELECT", "OPTION"].includes(event.target.tagName) &&
                event.target.type !== "file"
            ) {
                event.preventDefault();
                this.requestClose();
            }
        }
        event.stopPropagation();
    }

    requestClose(afterClose) {
        if (this.closed) return;
        if (this.publishing) return;
        this.stop();
        if (this.initial === JSON.stringify(this.draft)) {
            this.close();
            afterClose?.();
            return;
        }
        this.bringForward();
        if (this.choice) {
            this.choice.querySelector("button").focus();
            return;
        }
        this.choice = this.element("div");
        this.choice.setAttribute("role", "alertdialog");
        this.choice.setAttribute("aria-label", _("Discard changes?"));
        this.element("p", _("Discard changes?"), this.choice);
        this.button(
            _("Keep editing"),
            () => {
                this.choice.remove();
                this.choice = null;
                this.nameInput.focus();
            },
            this.choice
        ).focus();
        this.button(
            _("Discard changes"),
            () => {
                this.close();
                afterClose?.();
            },
            this.choice
        );
    }

    close(returnFocus = true) {
        if (this.closed) return;
        this.stop();
        this.cancelPublication?.();
        this.closed = true;
        this.activity.multisampleEditor = null;
        this.widgetWindow.multisampleEditor = null;
        this.widgetWindow.destroy();
        this.root.onkeydown = null;
        this.root.removeEventListener("focusin", this.focusHandler);
        this.nameInput.oninput = this.picker.onchange = this.picker.oncancel = null;
        for (const row of this.rows) row.select.onchange = null;
        this.root.replaceChildren();
        const samplerFrame = this.activity.logo.sample?.widgetWindow?.getWidgetFrame();
        if (samplerFrame) samplerFrame.inert = false;
        if (returnFocus) this.origin?.focus?.();
        this.draft = null;
        this.rows = [];
        this.owner = null;
        this.ownerValue = null;
        this.initial = null;
        this.origin = null;
        this.root = this.list = this.nameInput = this.picker = this.actions = this.status = null;
        this.applyButton =
            this.stopButton =
            this.cancelButton =
            this.addButton =
            this.choice =
                null;
        this.widgetWindow = this.focusHandler = null;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { MultisampleEditor };
}
