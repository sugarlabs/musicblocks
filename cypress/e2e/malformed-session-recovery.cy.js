// Regression coverage for issue #8855 / PR #8856: a saved session where a
// block past the first chunk (block 21+, index 20) is malformed used to
// throw from inside loadNewBlocks()'s deferred setTimeout chunking with no
// caller left to catch it, silently truncating the project and leaving
// autosave free to persist that truncated state over the last good save.
//
// This drives that exact failure through a real browser load, not a Jest
// mock, so the chunked setTimeout timing, the actual canvas/DOM cleanup, and
// the user-facing error message are all genuinely exercised end to end.
describe("recovery from a malformed session past the first load chunk", () => {
    // blockObjs[20] is the first block of the second, deferred chunk (chunk
    // size is 20, see js/blocks.js loadNewBlocks). Setting its name slot to
    // null makes _processOneBlock's own "typeof blkData[1] === 'object'"
    // check take the object branch, then throw reading ".length" off null,
    // a real throw from real code rather than a stubbed one.
    const buildMalformedSession = () => {
        const blocks = [[0, ["start", { collapsed: false }], 100, 100, [null, 1, null]]];
        for (let i = 1; i <= 19; i++) {
            blocks.push([i, "vspace", 100, 100, [i - 1, i === 19 ? null : i + 1]]);
        }
        blocks.push([20, null, 100, 100, [19, null]]);
        return JSON.stringify(blocks);
    };

    it("clears the partially loaded stack, logs the recovery, and comes up with a clean project", () => {
        // Everything here runs inside onBeforeLoad, i.e. before any of the
        // app's own scripts execute on this navigation. That matters because
        // a *live* app instance's idle-watcher autosave can rewrite
        // "SESSIONMy Project" into IndexedDB in the background at any time;
        // doing this setup against a page that has never booted the app
        // means there is no autosave in flight that could race a
        // localStorage.clear() / IndexedDB delete done afterwards and leave
        // a leftover session behind for _loadStart's idb-vs-local selection,
        // or for recoverFromLoadFailure()'s own fallback, to pick up instead
        // of the malformed one this test seeds.
        const recoverableWarnings = [];
        cy.visit("http://127.0.0.1:3000", {
            onBeforeLoad(win) {
                win.localStorage.clear();
                win.localStorage.setItem("SESSIONMy Project", buildMalformedSession());
                win.localStorage.setItem("SESSION_TIMESTAMPMy Project", Date.now().toString());

                const originalWarn = win.console.warn.bind(win.console);
                win.console.warn = (...args) => {
                    if (args[0] === "[Recoverable]") recoverableWarnings.push(args.join(" "));
                    originalWarn(...args);
                };

                // IndexedDB serializes a deleteDatabase() request against any
                // open() request that comes after it on the same connection
                // queue, so returning this promise (Cypress awaits it before
                // letting the page's own scripts run) guarantees the app's
                // own SessionStorageManager.init() call, made once its
                // scripts do start, opens a database with no leftover
                // "SESSIONMy Project" record in it.
                return new Promise(resolve => {
                    const req = win.indexedDB.deleteDatabase("MusicBlocksSessionDB");
                    req.onsuccess = resolve;
                    req.onerror = resolve;
                    req.onblocked = resolve;
                });
            }
        });

        cy.waitForAppReady();

        // Assert on the recovered block list first, with Cypress's own
        // retry-ability (cy.window().should re-runs this callback until it
        // stops throwing or times out): recoverFromLoadFailure() runs a
        // chain of awaited steps (deleteFromSource, sendAllToTrash, the
        // fallback loadNewBlocks) after the "loadFailed" event fires, so the
        // load-animation overlay hiding (what waitForAppReady checks) can
        // land before that chain has actually finished.
        cy.window().should(win => {
            const { blockList } = win.ActivityContext.getActivity().blocks;
            const nonTrash = blockList.filter(block => !block.trash);

            // Recovery has no IndexedDB fallback to try here (only the local
            // tier was seeded), so it falls back to justLoadStart()
            // (DATAOBJS), the built-in 31-block starter project. Landing on
            // exactly that many non-trash blocks, and exactly one "start"
            // hat, rules out the 19 "vspace" blocks the failed load had
            // already placed before hitting block 20 still being rendered
            // underneath it (the bug reported against the first version of
            // this fix, once the storage-level recovery existed but didn't
            // clear the canvas).
            expect(nonTrash, "should land on exactly the clean DATAOBJS project").to.have.length(
                31
            );
            expect(
                nonTrash.filter(block => block.name === "start"),
                "exactly one start block, not two overlapping stacks"
            ).to.have.length(1);

            // The malformed session's blocks were placed at x:100/y:100;
            // none of DATAOBJS's own blocks use that position, so their
            // absence rules out any of them surviving into the final state.
            const leftoverFromFailedLoad = nonTrash.filter(
                block => block.container && block.container.x === 100 && block.container.y === 100
            );
            expect(
                leftoverFromFailedLoad,
                "no leftover blocks from the failed load"
            ).to.have.length(0);
        });

        // By now recoverFromLoadFailure() (js/project-manager.js) has
        // definitely run to completion (the block-list assertion above only
        // passes once it has), so the ErrorHandler.recoverable() log it
        // makes on its way through should have landed too. Seeing it is
        // direct evidence the deferred-chunk failure was actually caught and
        // routed through recovery, not that the malformed block was somehow
        // silently skipped by some other path that happens to also leave a
        // clean 31-block project behind. cy.wrap(...).should() re-reads the
        // array on retry rather than asserting on a single snapshot of it, in
        // case this console.warn capture itself lands a beat after the
        // block-list state does.
        cy.wrap(recoverableWarnings, { timeout: 10000 }).should(warnings => {
            expect(
                warnings.some(w => w.includes("loadSessionData")),
                "a recoverable loadSessionData warning should have been logged"
            ).to.be.true;
        });

        // The bad session must not still be sitting in storage waiting to
        // fail the same way on the next reload.
        cy.window().then(win => {
            expect(win.localStorage.getItem("SESSIONMy Project")).to.satisfy(
                value => value === null || !value.includes("[20,null,")
            );
        });
    });
});
