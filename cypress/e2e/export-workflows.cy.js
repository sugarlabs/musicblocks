/* global cy, beforeEach, describe, it, expect */

// Parses Note On events out of a Standard MIDI File's binary content (as
// returned by cy.readFile(path, "binary")). This walks real SMF chunk/event
// structure - variable-length delta-times, MIDI running status, and
// meta/sysex event skipping - rather than searching for a byte pattern, so
// it can't be fooled by an incidental byte sequence elsewhere in the file.
// Verified against @tonejs/midi's own decode of export-note-minimal.tb's
// MIDI export (both agree the fixture's "sol"/octave-4 note is note 67).
const extractMidiNoteOns = binary => {
    const bytes = [];
    for (let i = 0; i < binary.length; i++) bytes.push(binary.charCodeAt(i) & 0xff);

    const readVarLen = pos => {
        let value = 0;
        let p = pos;
        while (p < bytes.length) {
            const b = bytes[p++];
            value = (value << 7) | (b & 0x7f);
            if ((b & 0x80) === 0) return [value, p];
        }
        throw new Error("Invalid MIDI variable-length value");
    };

    const noteOns = [];
    // Skip the MThd header chunk using its own declared length (4-byte id +
    // 4-byte length + N bytes of data) rather than assuming N is always 6.
    const headerLength = ((bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7]) >>> 0;
    let pos = 8 + headerLength;
    while (pos < bytes.length) {
        const chunkId = String.fromCharCode(
            bytes[pos],
            bytes[pos + 1],
            bytes[pos + 2],
            bytes[pos + 3]
        );
        if (chunkId !== "MTrk") break;

        const trackLength =
            ((bytes[pos + 4] << 24) |
                (bytes[pos + 5] << 16) |
                (bytes[pos + 6] << 8) |
                bytes[pos + 7]) >>>
            0;
        let p = pos + 8;
        const trackEnd = p + trackLength;
        let runningStatus = null;

        while (p < trackEnd) {
            let delta;
            [delta, p] = readVarLen(p);

            let statusByte = bytes[p];
            if (statusByte & 0x80) {
                runningStatus = statusByte;
                p++;
            } else {
                statusByte = runningStatus;
            }
            const type = statusByte & 0xf0;

            if (statusByte === 0xff) {
                p++; // meta event type byte
                let len;
                [len, p] = readVarLen(p);
                p += len;
            } else if (statusByte === 0xf0 || statusByte === 0xf7) {
                let len;
                [len, p] = readVarLen(p);
                p += len;
            } else if (type === 0x90 || type === 0x80) {
                const note = bytes[p++];
                const velocity = bytes[p++];
                if (type === 0x90 && velocity > 0) {
                    noteOns.push(note);
                }
            } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) {
                p += 2;
            } else if (type === 0xc0 || type === 0xd0) {
                p += 1;
            } else {
                break; // unrecognized status - stop parsing this track defensively
            }
        }
        pos = trackEnd;
    }
    return noteOns;
};

const loadFixtureProject = fixtureName => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile(`cypress/fixtures/${fixtureName}`, { force: true });

    // Assert the visible state first so the later "not visible" isn't
    // trivially true because loading never started (see the identical
    // guard in project-loading.cy.js).
    cy.get("#load-container").should("be.visible");
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

// The MIDI/LilyPond save options only exist in the advanced-mode save
// dropdown (index.html #saveddropdown) - beginner mode's #saveddropdownbeg
// only offers HTML/PNG (js/toolbar-ui.js renderSaveIcons).
const switchToAdvancedModeAndOpenSaveMenu = () => {
    cy.get("#toggleAuxBtn").click();
    cy.get("#advancedMode").click();
    cy.get("#saveButtonAdvanced").should("be.visible").click();
    cy.get("#saveddropdown").should("be.visible");
};

describe("Export workflows", () => {
    beforeEach(() => {
        // Each test gets its own fresh app load, matching the isolation
        // rationale in maker-widgets.cy.js: Music Blocks auto-saves the
        // working project to localStorage and restores it on the next
        // load, so state from one export must not leak into the next.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide, a widget window that
        // would otherwise collide with the ".windowFrame" selectors used
        // for the MIDI save dialog below.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });

        loadFixtureProject("export-note-minimal.tb");
    });

    it("exports a MIDI file for a real note program through the Save menu", () => {
        switchToAdvancedModeAndOpenSaveMenu();

        // js/toolbar-ui.js wires #save-midi to SaveInterface.saveMIDI, which
        // runs the loaded program (populating Logo's MIDI track data) and
        // then, via SaveInterface.download, opens the app's own MBDialog
        // filename prompt (js/utils/mb-dialog.js) rather than a native
        // window.prompt.
        cy.get("#save-midi").click();

        cy.get(".mb-system-dialog input[type='text']", { timeout: 30000 })
            .should("be.visible")
            .invoke("val")
            .should("match", /\.midi$/)
            .then(filename => {
                cy.get(".mb-system-dialog button.confirm-button").click();

                // SaveInterface.downloadURL (js/SaveInterface.js) writes the
                // file via a Blob object URL and an <a download> click, which
                // Cypress saves under its default downloadsFolder
                // (cypress/downloads). A Standard MIDI File always starts
                // with the 4-byte "MThd" header chunk id, so reading it back
                // verifies real, well-formed MIDI content was generated -
                // not just that a click occurred.
                cy.readFile(`cypress/downloads/${filename}`, "binary", { timeout: 30000 }).then(
                    content => {
                        expect(content.slice(0, 4)).to.equal("MThd");

                        // export-note-minimal.tb's only note is a "sol"
                        // (G) pitch block at octave 4 - MIDI note 67 in
                        // scientific pitch notation - so beyond a valid
                        // header, the file must actually contain that
                        // note's Note On event, proving the loaded note
                        // was exported and not just a structurally valid
                        // but musically empty MIDI file.
                        const noteOns = extractMidiNoteOns(content);
                        expect(noteOns).to.include(67);
                    }
                );
            });
    });

    it("exports a LilyPond file for a real note program through the Save menu", () => {
        switchToAdvancedModeAndOpenSaveMenu();

        // js/toolbar-ui.js wires #save-ly to SaveInterface.saveLilypond,
        // which opens the #lilypondModal dialog (index.html) prefilled with
        // a default filename, rather than downloading immediately.
        cy.get("#save-ly").click();

        cy.get("#lilypondModal").should("be.visible");
        cy.get("#fileName")
            .invoke("val")
            .should("match", /\.ly$/)
            .then(filename => {
                // #submitLilypond runs SaveInterface.saveLYFile, which
                // re-runs the program to build real notation output and
                // downloads it via the same Blob/<a download> mechanism as
                // MIDI export (js/SaveInterface.js afterSaveLilypondLY).
                cy.get("#submitLilypond").click();

                // js/lilypond.js's LILYPONDHEADER constant, reused verbatim
                // by every generated .ly file (also asserted in the Jest
                // unit test js/__tests__/lilypond.test.js), gives a stable,
                // implementation-independent way to verify real LilyPond
                // content was written to disk.
                cy.readFile(`cypress/downloads/${filename}`, { timeout: 30000 }).then(content => {
                    expect(content).to.contain('\\version "2.18.2"');
                    expect(content).to.contain("Made with LilyPond and Music Blocks");

                    // export-note-minimal.tb's only note - "sol" (G) at
                    // octave 4, a quarter note - renders in LilyPond
                    // pitch/duration notation as g'4, so this proves the
                    // composition itself was transcribed, not just that a
                    // file with the expected header was written.
                    expect(content).to.contain("g'4");
                });
            });
    });
});
