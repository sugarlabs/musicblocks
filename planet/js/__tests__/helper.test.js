global.$ = jest.fn().mockReturnValue({
    modal: jest.fn(),
    ready: jest.fn()
});
const { updateCheckboxes } = require("../helper.js");

describe("helper", () => {
    describe("updateCheckboxes", () => {
        let sharebox;

        beforeEach(() => {
            document.body.innerHTML = `
                <div id="global-sharebox-123" data-projectname="Test Project">
                    <input type="text" name="shareurl" data-originalurl="https://musicblocks.sugarlabs.org/index.html?id=123">
                    <input type="checkbox" name="run" checked>
                    <a class="copyshareurl"></a>
                    <a class="share-twitter"></a>
                    <a class="share-whatsapp"></a>
                </div>
            `;
            sharebox = document.getElementById("global-sharebox-123");
        });

        afterEach(() => {
            document.body.innerHTML = "";
            jest.restoreAllMocks();
        });

        it("should update URL with checked flags", () => {
            updateCheckboxes("global-sharebox-123");
            const urlEl = sharebox.querySelector("input[type=text]");
            expect(urlEl.value).toBe(
                "https://musicblocks.sugarlabs.org/index.html?id=123&run=True"
            );
        });

        it("should update clipboard copy data attribute", () => {
            updateCheckboxes("global-sharebox-123");
            const copyBtn = sharebox.querySelector(".copyshareurl");
            expect(copyBtn.getAttribute("data-clipboard-text")).toBe(
                "https://musicblocks.sugarlabs.org/index.html?id=123&run=True"
            );
        });

        it("should update Twitter/X share link", () => {
            updateCheckboxes("global-sharebox-123");
            const twitterBtn = sharebox.querySelector(".share-twitter");

            const expectedUrl = "https://musicblocks.sugarlabs.org/index.html?id=123&run=True";
            const expectedText = "Check out Test Project on Music Blocks!";

            expect(twitterBtn.href).toBe(
                `https://x.com/intent/tweet?url=${encodeURIComponent(expectedUrl)}&text=${encodeURIComponent(expectedText)}`
            );
        });

        it("should update WhatsApp share link", () => {
            updateCheckboxes("global-sharebox-123");
            const whatsappBtn = sharebox.querySelector(".share-whatsapp");

            const expectedUrl = "https://musicblocks.sugarlabs.org/index.html?id=123&run=True";
            const expectedText = "Check out Test Project on Music Blocks!";

            expect(whatsappBtn.href).toBe(
                `https://api.whatsapp.com/send?text=${encodeURIComponent(expectedText + " " + expectedUrl)}`
            );
        });

        it("should handle missing optional elements safely", () => {
            document.body.innerHTML = `
                <div id="global-sharebox-456" data-projectname="Test Project">
                    <input type="text" name="shareurl" data-originalurl="https://example.com">
                </div>
            `;
            // Should not throw when copy/twitter/whatsapp buttons are missing
            expect(() => updateCheckboxes("global-sharebox-456")).not.toThrow();
        });
    });
});
