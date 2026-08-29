describe("Real project playback", () => {
    before(() => {
        // Start from a clean persistence state: an earlier spec (project-persistence)
        // can leave a saved pi.tb session in localStorage, which the app would restore
        // on visit and load *underneath* the explicit #load below, producing a broken
        // double-loaded stack that never dispatches a note. Visit first so
        // localStorage is cleared on the Music Blocks origin, then reload clean.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();
    });

    // main.cy.js proves the transport toggles the Tone.js audio context on the
    // empty default canvas (no note is ever dispatched); project-loading.cy.js
    // proves a real project parses onto the canvas but never presses Play. This
    // test connects the two: load a real note-producing project, run it via the
    // real #play control, and prove a note from that project reached Tone.js.
    it("runs a loaded note-producing project through the real Logo -> Singer -> Tone.js path", () => {
        // #load clicks the hidden #myOpenFile input; selectFile supplies the
        // project file directly (*.tb are plain JSON block arrays). The fixture
        // is a stable copy of examples/pi.tb owned by this suite, so relocating
        // or removing the example project cannot break this test. pi.tb embeds
        // its pi-digit heap in the loadFile block, so no companion file is
        // needed.
        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/pi.tb", { force: true });

        // Assert the overlay appeared before asserting it cleared, so the
        // "not visible" check can't pass just because loading never started.
        cy.get("#load-container").should("be.visible");
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");

        // A parse/load failure would surface here (ProjectManager.errorMsg).
        cy.get("#errorText").should("not.be.visible");
        cy.get("#canvas").should("be.visible");

        // Confirm the intended pi.tb program is what loaded: it plays digits of
        // pi as pitches, so its block graph must contain the note-producing
        // newnote/scaledegree structure plus its embedded "heap.json" loadFile
        // block. This ties the note dispatched below to this specific project.
        cy.window().should(win => {
            const { blockList } = win.ActivityContext.getActivity().blocks;

            expect(
                blockList.some(b => b.name === "newnote"),
                "pi.tb should contain a newnote block"
            ).to.be.true;
            expect(
                blockList.some(b => b.name === "scaledegree"),
                "pi.tb should contain a scaledegree block"
            ).to.be.true;
            expect(
                blockList.some(b => b.name === "loadFile" && b.value?.[0] === "heap.json"),
                "pi.tb's heap.json loadFile block should be present"
            ).to.be.true;
        });

        // firstNoteAudioTime is reset to null at the start of every run and set
        // to Tone.now() by js/turtle-singer.js only when the interpreter hands
        // the first real note to Tone.js. It must be unset before Play.
        cy.window().then(win => {
            const { logo } = win.ActivityContext.getActivity();
            expect(logo.firstNoteAudioTime, "no note dispatched before Play").to.be.null;
        });

        cy.get("#play").click();

        // A finite positive firstNoteAudioTime is the application-native proof
        // that a note was dispatched through the real Singer/Tone path -- a
        // stronger signal than Tone.context.state, which can be "running" with
        // no note ever scheduled. The generous timeout covers the interpreter
        // loading pi.tb's digit heap and looping to its first note on a busy CI
        // machine; it is Cypress retry polling, not a fixed wait.
        cy.window({ timeout: 20000 }).should(win => {
            const { logo } = win.ActivityContext.getActivity();
            expect(logo.firstNoteAudioTime, "firstNoteAudioTime set by note dispatch").to.be.a(
                "number"
            );
            expect(logo.firstNoteAudioTime).to.be.finite;
            expect(logo.firstNoteAudioTime).to.be.greaterThan(0);
        });

        cy.window().should(win => {
            expect(win.Tone.context.state).to.eq("running");
        });

        // Stop through the real UI; the control is expected to be interactable
        // during playback.
        cy.get("#stop").should("be.visible").click();

        // turtles.running() reflects real per-turtle execution state: proves
        // Stop halted the run, not just that the button was clickable.
        cy.window().should(win => {
            expect(win.ActivityContext.getActivity().turtles.running()).to.be.false;
        });
    });
});
