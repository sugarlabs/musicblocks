/* global cy, beforeEach, describe, it */

describe("JavaScript editor and block search", () => {
    beforeEach(() => {
        // Fresh app state per test: JSEditor and the search widget both
        // touch global singletons (window.jsEditor, activity.searchWidget)
        // that persist across interactions, so tests are isolated the same
        // way cypress/e2e/maker-widgets.cy.js resets between widget tests.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide, which is itself a
        // widget window (js/widgets/widgetWindows.js) and would otherwise
        // collide with the ".windowFrame" selectors used below.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
    });

    it("opens the JavaScript editor through the real UI with a working, error-free editor surface", () => {
        // The JavaScript icon (js/toolbar-ui.js renderJavaScriptIcon) lives in
        // the auxiliary toolbar, which is hidden until #toggleAuxBtn is
        // clicked - the same pattern already exercised in main.cy.js's
        // "should toggle the toolbar menu" test.
        cy.get("#toggleAuxBtn").click();
        cy.get("#aux-toolbar").should("be.visible");

        // The icon only renders (js/toolbar-ui.js updateUIForMode, the
        // "JavaScript Toggle" block) once the app is in Advanced mode - a
        // fresh app starts in Beginner mode, so switch first via the real
        // #advancedMode toggle before the icon can be clicked.
        cy.get("#advancedMode").click();
        cy.get("#toggleJavaScriptIcon").should("be.visible").click();

        // JSEditor opens through the shared WidgetWindow component
        // (js/widgets/widgetWindows.js), the same mechanism asserted on in
        // cypress/e2e/maker-widgets.cy.js. Opening it also lazy-loads several
        // js-export modules (js/activity/help-controller.js toggleJSEditor),
        // so give it room to finish.
        cy.get(".windowFrame .wftTitle", { timeout: 10000 })
            .should("be.visible")
            .and("contain.text", "JavaScript Editor");

        // js/widgets/jseditor.js _setup() builds a CodeJar-backed code box
        // (".editor.language-javascript"), a line-number gutter
        // ("#editorLines"), a debug-button gutter ("#debugButtons"), and a
        // console pane ("#console_label" / "#editorConsole") - DOM that only
        // exists once _setup() has completed successfully.
        cy.get(".windowFrame .wfbWidget .editor.language-javascript").should("be.visible");
        cy.get("#editorLines").should("exist");
        cy.get("#debugButtons").should("exist");
        cy.get("#console_label").should("be.visible").and("contain.text", "CONSOLE");

        // _generateCode() (called from the JSEditor constructor) fills the
        // editor with JavaScript generated from the current block stacks, so
        // a non-empty code box proves initialization actually produced code
        // rather than leaving the editor blank.
        cy.get(".windowFrame .wfbWidget .editor.language-javascript")
            .invoke("text")
            .should("have.length.greaterThan", 0);

        // A fresh open never calls _runCode()/_codeToBlocks() - the only
        // methods that write to the console via JSEditor.logConsole - so the
        // console pane should still be empty, confirming no JS/editor error
        // was raised during initialization.
        cy.get("#editorConsole").invoke("text").should("eq", "");

        // _highlightErrors() (run from CodeJar's highlight callback on every
        // update, including the initial one) only ever adds ".error" spans
        // when acorn.parse() fails on the editor contents, so their absence
        // confirms the freshly generated code parses cleanly.
        cy.get(".windowFrame .wfbWidget .editor.language-javascript .error").should("not.exist");

        // highlight.js (loaded optionally from a CDN - see js/loader.js)
        // marks any element it has processed by adding its own "hljs" class
        // (js/widgets/jseditor.js highlight() calls hljs.highlightElement()
        // on the code box). Verify that stable signal when the library
        // actually loaded, without hard-failing the test in an offline
        // environment where that optional load never happens.
        cy.window().then(win => {
            if (win.hljs) {
                cy.get(".windowFrame .wfbWidget .editor.language-javascript").should(
                    "have.class",
                    "hljs"
                );
            } else {
                cy.log("highlight.js did not load (offline?) - skipping syntax highlighting check");
            }
        });
    });

    it("finds a real block through the palette search and shows matching results", () => {
        // The Search entry is always the first row inserted into the
        // palette's category list (js/palette.js makePalettes() calls
        // makeSearchButton() before the per-category makeButton() calls), so
        // it is reliably identified by its rendered label.
        cy.contains("#palette tbody tr", "Search").click();
        cy.get("#search").should("be.visible");

        // SearchController.showSearchWidget() focuses #search and calls
        // doSearch() (which lazily binds jQuery-UI autocomplete) back to
        // back inside the same setTimeout callback, so waiting for real
        // focus to land on #search also guarantees autocomplete is bound -
        // no arbitrary wait needed.
        cy.focused().should("have.id", "search").type("forward");

        // "forward" (js/blocks/GraphicsBlocks.js ForwardBlock) is a core,
        // always-present block, so its label is guaranteed to appear in the
        // live autocomplete results built from the real protoBlockDict
        // (SearchController.prepSearchWidget/filterSuggestions) - not a
        // mocked or hand-authored result list. The dropdown is the real
        // jQuery-UI autocomplete menu (appendTo: "body"), distinguishable
        // from #search itself (which also carries a "ui-autocomplete" class)
        // by its <ul> tag.
        cy.get("ul.ui-autocomplete", { timeout: 10000 })
            .should("be.visible")
            .within(() => {
                cy.contains("li", "forward").should("be.visible");
            });

        // js/utils/jquery-setup.js fixSearchAutocompletePosition() (added for
        // issue #8069, a jQuery-update regression where the results dropdown
        // could render detached from the input after the jQuery-UI/
        // Materialize bridge was upgraded) re-anchors the dropdown under
        // #search on every render. Confirming the dropdown still renders
        // below the input - rather than overlapping it or landing elsewhere
        // on the page - guards against that regression recurring.
        cy.get("#search").then($search => {
            const searchTop = $search[0].getBoundingClientRect().top;
            cy.get("ul.ui-autocomplete").should($ul => {
                const dropdownTop = $ul[0].getBoundingClientRect().top;
                expect(
                    dropdownTop,
                    "search results dropdown should be anchored below the search input"
                ).to.be.greaterThan(searchTop);
            });
        });
    });
});
