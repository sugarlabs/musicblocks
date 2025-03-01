const LanguageBox = require("../languagebox"); 

const mockActivity = {
    storage: {
        languagePreference: "enUS",
        kanaPreference: null,
    },
    textMsg: jest.fn(),
};

Object.defineProperty(global, "localStorage", {
    value: {
        getItem: jest.fn(), 
        setItem: jest.fn(), 
    },
    writable: true,
});

delete global.window.location; 
global.window.location = {
    reload: jest.fn(), 
};

document.querySelectorAll = jest.fn(() => []);

global._ = jest.fn((str) => str); 

describe("LanguageBox Class", () => {
    let languageBox;

    beforeEach(() => {
        jest.clearAllMocks();
        languageBox = new LanguageBox(mockActivity);
    });

    it("should reload the window when OnClick is called", () => {
        languageBox.OnClick();
        expect(global.window.location.reload).toHaveBeenCalled();
    });

    it("should display 'already set' message when the selected language is the same", () => {
        localStorage.getItem.mockReturnValue("enUS");
        mockActivity.textMsg.mockImplementation();

        languageBox._language = "enUS";
        languageBox.hide();

        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            "Music Blocks is already set to this language."
        );
    });

    it("should display the refresh message when a new language is selected", () => {
        localStorage.getItem.mockReturnValue("ja");
        mockActivity.textMsg.mockImplementation();

        languageBox._language = "enUS";
        languageBox.hide();

        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            expect.stringContaining("Refresh your browser to change your language preference.")
        );
    });

    it("should display the correct message when hide is called for 'ja'", () => {
        localStorage.getItem.mockReturnValue("enUS");
        mockActivity.textMsg.mockImplementation();

        languageBox._language = "ja";
        languageBox.hide();

        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            expect.stringContaining("言語を変えるには、ブラウザをこうしんしてください。")
        );
    });

    it("should attach click listeners to language links when hide is called", () => {
        const mockLinks = [{ addEventListener: jest.fn() }, { addEventListener: jest.fn() }];
        document.querySelectorAll.mockReturnValue(mockLinks);

        languageBox.hide();

        mockLinks.forEach((link) => {
            expect(link.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
        });
    });
});
