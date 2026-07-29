describe("releaseconfig globals", () => {
    beforeEach(() => {
        jest.resetModules();
        delete window._THIS_IS_MUSIC_BLOCKS_;
        delete window._THIS_IS_TURTLE_BLOCKS_;
        delete window.THIS_IS_MUSIC_BLOCKS;
        delete window.THIS_IS_TURTLE_BLOCKS;
    });

    test("mirrors the turtle query param into the underscored globals", () => {
        window.history.pushState({}, "", "/?turtle");

        require("../releaseconfig");

        expect(window._THIS_IS_MUSIC_BLOCKS_).toBe(false);
        expect(window._THIS_IS_TURTLE_BLOCKS_).toBe(true);
        expect(window.THIS_IS_MUSIC_BLOCKS).toBe(false);
        expect(window.THIS_IS_TURTLE_BLOCKS).toBe(true);
    });
});
