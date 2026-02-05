
describe("Palette Search Functionality", () => {
    let palette;
    let mockActivity;
    let mockPalettes;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="palette">
                <div></div>
            </div>
        `;

        mockActivity = {
            cellSize: 55,
            blocksContainer: { x: 0, y: 0 }
        };

        mockPalettes = {
            activity: mockActivity,
            cellSize: 27,
            top: 75,
            mobile: false
        };

        const Palette = require("../palette.js").Palette;
        palette = new Palette(mockPalettes, "rhythm");
    });

    test("fuzzyMatch should return high score for exact matches", () => {
        const score = palette._fuzzyMatch("note", "note");
        expect(score).toBeGreaterThan(90);
    });

    test("fuzzyMatch should return positive score for fuzzy matches", () => {
        const score = palette._fuzzyMatch("nt", "note");
        expect(score).toBeGreaterThan(0);
    });

    test("fuzzyMatch should return -1 for no match", () => {
        const score = palette._fuzzyMatch("xyz", "note");
        expect(score).toBe(-1);
    });

    test("fuzzyMatch should be case insensitive", () => {
        const score1 = palette._fuzzyMatch("NOTE", "note");
        const score2 = palette._fuzzyMatch("note", "NOTE");
        expect(score1).toBeGreaterThan(0);
        expect(score2).toBeGreaterThan(0);
    });

    test("fuzzyMatch should handle empty pattern", () => {
        const score = palette._fuzzyMatch("", "note");
        expect(score).toBe(100);
    });

    test("fuzzyMatch should prefer substring matches", () => {
        const exactScore = palette._fuzzyMatch("drum", "start drum");
        const fuzzyScore = palette._fuzzyMatch("drm", "start drum");
        expect(exactScore).toBeGreaterThan(fuzzyScore);
    });

    test("filterBlocks should show all blocks when query is empty", () => {
        document.body.innerHTML = `
            <table id="PaletteBody_items">
                <tr>
                    <td data-block-name="note">Block 1</td>
                </tr>
                <tr>
                    <td data-block-name="drum">Block 2</td>
                </tr>
            </table>
        `;

        palette._filterBlocks("");

        const rows = document.querySelectorAll("#PaletteBody_items tr");
        expect(rows[0].style.display).not.toBe("none");
        expect(rows[1].style.display).not.toBe("none");
    });

    test("filterBlocks should hide non-matching blocks", () => {
        document.body.innerHTML = `
            <table id="PaletteBody_items">
                <tr>
                    <td data-block-name="note">Block 1</td>
                </tr>
                <tr>
                    <td data-block-name="drum">Block 2</td>
                </tr>
            </table>
        `;

        palette._filterBlocks("note");

        const rows = document.querySelectorAll("#PaletteBody_items tr");
        expect(rows[0].style.display).not.toBe("none");
        expect(rows[1].style.display).toBe("none");
    });

    test("filterBlocks should show no results message when no matches found", () => {
        document.body.innerHTML = `
            <table id="PaletteBody_items">
                <tr>
                    <td data-block-name="note">Block 1</td>
                </tr>
            </table>
        `;

        palette._filterBlocks("xyz");

        const noResultsMsg = document.getElementById("noResultsMessage");
        expect(noResultsMsg).toBeTruthy();
    });

    test("filterBlocks should remove no results message when matches are found", () => {
        document.body.innerHTML = `
            <table id="PaletteBody_items">
                <tr>
                    <td data-block-name="note">Block 1</td>
                </tr>
                <tr id="noResultsMessage">
                    <td>No results</td>
                </tr>
            </table>
        `;

        palette._filterBlocks("note");

        const noResultsMsg = document.getElementById("noResultsMessage");
        expect(noResultsMsg).toBeFalsy();
    });

    test("fuzzyMatch should handle consecutive character matches", () => {
        const consecutiveScore = palette._fuzzyMatch("drum", "start drum");
        const nonConsecutiveScore = palette._fuzzyMatch("drm", "start drum");
        expect(consecutiveScore).toBeGreaterThan(nonConsecutiveScore);
    });
});
