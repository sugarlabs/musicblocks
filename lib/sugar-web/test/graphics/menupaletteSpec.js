define(["sugar-web/graphics/menupalette", "sugar-web/graphics/palette"], (menupalette, palette) => {

    'use strict';

    describe("menupalette", () => {

        var invoker;
        var menuData;
        var menuPalette;

        beforeEach(() => {
            invoker = document.createElement('button');

            menuData = [
                {
                    label: "One",
                    id: "one-button",
                    icon: true
                },
                {
                    label: "Two",
                    id: "two-button",
                    icon: true
                },
                {
                    label: "Three",
                    id: "three-button",
                    icon: true
                }
            ];

            menuPalette = new menupalette.MenuPalette(invoker, undefined,
                menuData);
        });

        it("should have a fixed number of clickable items", () => {
            var buttons = menuPalette.getPalette().
                querySelectorAll('.container button');
            expect(buttons.length).toBe(menuData.length);
        });

        it("should emit a signal with the clicked item", () => {
            var button;
            var buttonSelected;

            function onItemSelected(event) {
                button = event.detail.target;
                buttonSelected = true;
            }

            runs(() => {
                buttonSelected = false;
                menuPalette.addEventListener('selectItem', onItemSelected);

                var buttons = menuPalette.getPalette().
                    querySelectorAll('.container button');
                buttons[1].click();
            });

            waitsFor(() => {
                return buttonSelected;
            }, "should have selected a button");

            runs(() => {
                expect(button.id).toBe("two-button");
            });
        });

        it("should be an instance of the child class", () => {
            expect(menuPalette instanceof menupalette.MenuPalette).toBe(true);
        });

        it("should be an instance of the parent class", () => {
            expect(menuPalette instanceof palette.Palette).toBe(true);
        });

    });
});
