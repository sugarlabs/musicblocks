function setupPaletteGlobals() {
    global.LEADING = 10;
    global.DEFAULTPALETTE = "default";

    global.MULTIPALETTES = [
        ["rhythm", "pitch"],
        ["flow", "action"],
        ["graphics", "pen"]
    ];

    global.PALETTEICONS = {
        search: "<svg></svg>",
        rhythm: "<svg></svg>",
        pitch: "<svg></svg>",
        flow: "<svg></svg>",
        action: "<svg></svg>",
        graphics: "<svg></svg>",
        pen: "<svg></svg>",
        myblocks: "<svg></svg>",
        music: "<svg background_fill_color stroke_color fill_color></svg>",
        logic: "<svg background_fill_color stroke_color fill_color></svg>",
        artwork: "<svg background_fill_color stroke_color fill_color></svg>"
    };
    global.MULTIPALETTEICONS = ["music", "logic", "artwork"];
    global.SKIPPALETTES = ["heap", "dictionary"];

    global.platformColor = {
        selectorSelected: "#000",
        paletteBackground: "#fff",
        strokeColor: "#333",
        fillColor: "#666",
        paletteLabelBackground: "#ccc",
        paletteLabelSelected: "#aaa",
        hoverColor: "#ddd",
        paletteText: "#000",
        textColor: "#111"
    };

    global.PALETTEFILLCOLORS = { test: "test_fill" };
    global.PALETTESTROKECOLORS = { test: "test_stroke" };

    global.DISABLEDFILLCOLOR = "disabled_fill";
    global.DISABLEDSTROKECOLOR = "disabled_stroke";

    global.NUMBERBLOCKDEFAULT = 1;
    global.TEXTWIDTH = 100;
    global.STRINGLEN = 10;
    global.DEFAULTBLOCKSCALE = 1;
    global.STANDARDBLOCKHEIGHT = 18;
    global.CLOSEICON = "<svg fill_color></svg>";

    global.toTitleCase = str => str.charAt(0).toUpperCase() + str.slice(1);
    global._ = str => str;
    global.base64Encode = str => str;
    global.last = arr => arr[arr.length - 1];
    global.safeSVG = str => str;

    global.getTextWidth = jest.fn(() => 10);
    global.i18nSolfege = jest.fn(() => "sol");

    global.blockIsMacro = jest.fn(() => false);
    global.getMacroExpansion = jest.fn();
}

module.exports = { setupPaletteGlobals };
