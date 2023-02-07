define(["sugar-web/graphics/palette"], (palette) => {

    'use strict';

    describe("palette", () => {
        it("should start down", () => {
            var invoker = document.createElement('button');
            var myPalette = new palette.Palette(invoker);
            expect(myPalette.isDown()).toBe(true);
        });

        it("should toggle", () => {
            var invoker = document.createElement('button');
            var myPalette = new palette.Palette(invoker);
            myPalette.toggle();
            expect(myPalette.isDown()).toBe(false);
            myPalette.toggle();
            expect(myPalette.isDown()).toBe(true);
        });

        it("if one palette in a group popups, the others popdown", () => {
            var invokerA = document.createElement('button');
            var invokerB = document.createElement('button');
            var myPaletteA = new palette.Palette(invokerA);
            var myPaletteB = new palette.Palette(invokerB);
            myPaletteA.toggle();
            expect(myPaletteA.isDown()).toBe(false);
            expect(myPaletteB.isDown()).toBe(true);
            myPaletteB.toggle();
            expect(myPaletteA.isDown()).toBe(true);
            expect(myPaletteB.isDown()).toBe(false);
        });

    });

});
