describe("Project persistence", () => {
    // #load-container hides as soon as parsing/creation starts, before every block
    // has finished its own asynchronous setup (image bitmaps, docks, etc.), and
    // right after a reload blocks._loadCounter (js/blocks.js) briefly still holds
    // its pre-load default of 0 before the session-restore even begins. It's also
    // not strictly monotonic: the file-load handler (js/project-manager.js) defers
    // blocks.loadNewBlocks() behind a "trashsignal" event whose dispatch is itself
    // setTimeout-scheduled, so a stray pending dispatch can occasionally trigger a
    // second load pass shortly after the first one finishes, briefly resetting
    // _loadCounter back up. Requiring the "fully loaded" signal (_loadCounter at 0
    // and pi.tb's distinctive loadFile block present) to hold for several
    // consecutive retries -- not just once -- filters out both the "not started
    // yet" state and this transient re-load window, using only Cypress's own
    // retry polling rather than an arbitrary wait.
    const waitForPiFullyLoaded = () => {
        let stableObservations = 0;
        cy.window({ timeout: 60000 }).should(win => {
            const { blocks } = win.ActivityContext.getActivity();
            const nonTrash = blocks.blockList.filter(block => !block.trash);
            const fullyLoaded =
                blocks._loadCounter === 0 && nonTrash.some(block => block.name === "loadFile");
            stableObservations = fullyLoaded ? stableObservations + 1 : 0;
            expect(
                stableObservations,
                "pi.tb's fully-loaded state should hold across repeated checks"
            ).to.be.at.least(3);
        });
    };

    // "start"/"drum" hat blocks store the owning turtle's index as .value, which
    // depends on turtle-creation order/history rather than the project's own
    // content (js/project-manager.js's prepareExport() doesn't even export .value
    // for these blocks -- it exports id/xcor/ycor/etc. instead). Normalizing it
    // out avoids a false mismatch between a fresh load (which may land on a turtle
    // index left over from an earlier default project) and a clean session restore.
    const captureBlockState = win => {
        const { blockList } = win.ActivityContext.getActivity().blocks;
        return blockList
            .filter(block => !block.trash)
            .map(block => ({
                name: block.name,
                value: ["start", "drum"].includes(block.name) ? null : block.value
            }))
            .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    };

    before(() => {
        // Visit first so localStorage is cleared on the Music Blocks origin itself,
        // then reload so the app initializes against a genuinely clean persistence
        // state rather than whatever a previous test session left behind.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();
    });

    it("restores a loaded project's blocks after a page reload", () => {
        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/pi.tb", { force: true });

        cy.get("#load-container").should("be.visible");
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        cy.get("#errorText").should("not.be.visible");

        waitForPiFullyLoaded();

        let blockStateBeforeReload = [];
        cy.window().then(win => {
            blockStateBeforeReload = captureBlockState(win);
        });

        // Reloading fires the app's own beforeunload handler (js/activity.js), which
        // synchronously calls ProjectManager.saveLocally() to write the current project
        // to localStorage under "SESSION<project>". On the next load, Activity.init()
        // (js/project-manager.js) reads that same key and restores the blocks via
        // blocks.loadNewBlocks(). This is the app's real persistence path: the toolbar
        // "Save" button (js/toolbar-ui.js) only exports HTML/PNG and never writes
        // session data, so it cannot be used to trigger this workflow.
        cy.reload();
        cy.waitForAppReady();

        // Restoring from session data goes through the same chunked, asynchronous
        // block-creation path as a fresh load, so it needs the same completion check.
        waitForPiFullyLoaded();

        cy.window().should(win => {
            expect(
                captureBlockState(win),
                "restored blocks should match the pre-reload stack"
            ).to.deep.equal(blockStateBeforeReload);
        });
    });
});
