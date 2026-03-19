/* global jest */

console.log("🔧 Applying GLOBAL Jest test fixes...");

// Helper to create fully mocked DOM elements
function makeMockElement(tag) {
    const el = {
        tagName: tag?.toUpperCase() || 'DIV',
        nodeType: 1,
        style: {},
        children: [],
        childNodes: [],
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn()
        },
        appendChild: jest.fn(function(child) {
            this.children.push(child);
            this.childNodes.push(child);
            child.parentNode = this;
            return child;
        }),
        removeChild: jest.fn(),
        insertBefore: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        parentNode: null,
        id: '',
        innerHTML: '',
        textContent: '',
        cloneNode: jest.fn(),
        querySelector: jest.fn(() => makeMockElement('div')),
        querySelectorAll: jest.fn().mockReturnValue([]),
        onmouseover: null,
        onmouseleave: null,
        onmousedown: null,
        onmouseup: null,
        ondragstart: null,
        ontouchstart: null,
        ontouchend: null,
        offsetWidth: 10,
        offsetHeight: 10
    };

    // Add a setter for innerHTML that creates childNodes
    Object.defineProperty(el, 'innerHTML', {
        set: function(value) {
            this._innerHTML = value;
            // Parse simple HTML structure to create childNodes
            if (typeof value === 'string' && value.includes('<')) {
                // Create a simple mock structure for tables/divs
                const childDiv = makeMockElement('div');
                childDiv.style = {};
                this.childNodes = [childDiv];
                this.children = [childDiv];
            }
        },
        get: function() {
            return this._innerHTML || '';
        }
    });

    if (tag === 'table') {
        el.insertRow = jest.fn(() => {
            const row = makeMockElement('tr');
            row.insertCell = jest.fn(() => {
                const cell = makeMockElement('td');
                cell.appendChild = jest.fn((img) => {
                    if (img) cell._capturedImg = img;
                    return img;
                });
                return cell;
            });
            return row;
        });
    }
    
    if (tag === 'tr') {
        el.insertCell = jest.fn(() => {
            const cell = makeMockElement('td');
            cell.appendChild = jest.fn((img) => {
                if (img) cell._capturedImg = img;
                return img;
            });
            return cell;
        });
    }

    if (tag === 'img') {
        el.src = '';
        el.width = 0;
        el.height = 0;
        el.offsetWidth = 10;
        el.offsetHeight = 10;
    }

    return el;
}

// Enhanced version with guaranteed methods
function enhancedMakeMockElement(tag) {
    const el = makeMockElement(tag);
    el.setAttribute = jest.fn();
    el.getAttribute = jest.fn();
    el.appendChild = jest.fn().mockImplementation(function(child) {
        if (!this.children) this.children = [];
        this.children.push(child);
        if (!this.childNodes) this.childNodes = [];
        this.childNodes.push(child);
        return child;
    });
    return el;
}

// Override document.createElement
if (typeof document !== 'undefined') {
    document.createElement = jest.fn((tag) => {
        return enhancedMakeMockElement(tag);
    });

    // Override document.getElementById
    document.getElementById = jest.fn((id) => {
        const el = enhancedMakeMockElement('div');
        el.id = id;
        return el;
    });

    // Override document.querySelector
    document.querySelector = jest.fn(() => enhancedMakeMockElement('div'));

    // Mock document.body
    if (!document.body) {
        document.body = enhancedMakeMockElement('body');
    }
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    document.body.style = { cursor: 'default' };
}

// Mock global docById
global.docById = jest.fn((id) => {
    const el = enhancedMakeMockElement('div');

    if (id === 'palette') {
        el.childNodes = [
            {
                children: [
                    {
                        children: [
                            {
                                children: [
                                    {
                                        insertCell: jest.fn(() => ({
                                            appendChild: jest.fn(),
                                            style: {}
                                        }))
                                    }
                                ]
                            },
                            {
                                children: [
                                    {},
                                    {
                                        appendChild: jest.fn(() => ({})),
                                        insertRow: jest.fn(() => ({
                                            insertCell: jest.fn(() => ({
                                                appendChild: jest.fn(),
                                                style: {}
                                            })),
                                            style: {},
                                            addEventListener: jest.fn()
                                        }))
                                    }
                                ]
                            }
                        ],
                        style: { border: '' }
                    }
                ]
            }
        ];
        // Ensure the first child has a style property
        if (el.childNodes[0]) {
            el.childNodes[0].style = { border: '' };
        }
    }

    if (id === 'PaletteBody') {
        el.parentNode = { removeChild: jest.fn() };
        el.style = {};
    }

    if (id === 'paletteList' || id === 'PaletteBody_items') {
        el.appendChild = jest.fn((child) => {
            el.children.push(child);
            return child;
        });
        el.insertRow = jest.fn(() => {
            const row = enhancedMakeMockElement('tr');
            row.insertCell = jest.fn(() => {
                const cell = enhancedMakeMockElement('td');
                cell.appendChild = jest.fn((img) => {
                    if (img) cell._capturedImg = img;
                    return img;
                });
                return cell;
            });
            return row;
        });
    }

    return el;
});

// Mock paletteList
Object.defineProperty(global, 'paletteList', {
    get: function() {
        const el = enhancedMakeMockElement('div');
        el.appendChild = jest.fn().mockReturnValue(el);
        el.insertRow = jest.fn(() => {
            const row = enhancedMakeMockElement('tr');
            row.insertCell = jest.fn(() => {
                const cell = enhancedMakeMockElement('td');
                cell.appendChild = jest.fn();
                return cell;
            });
            return row;
        });
        return el;
    },
    configurable: true
});

// Mock window
global.window = {
    innerHeight: 800,
    addEventListener: jest.fn(),
    btoa: jest.fn(str => str)
};

// Mock Image
global.Image = class {
    constructor() {
        this.src = '';
        this.width = 0;
        this.height = 0;
        this.style = {};
        this.onload = null;
        this.onerror = null;
        this.offsetWidth = 10;
        this.offsetHeight = 10;
    }
};

// Add missing global constants for palette tests
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
global.toTitleCase = str => str.charAt(0).toUpperCase() + str.slice(1);
global._ = str => str;
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
global.base64Encode = str => str;
global.localStorage = { kanaPreference: "default" };
global.i18nSolfege = jest.fn(() => "sol");
global.NUMBERBLOCKDEFAULT = 1;
global.TEXTWIDTH = 100;
global.STRINGLEN = 10;
global.DEFAULTBLOCKSCALE = 1;
global.SVG = class {
    constructor() {
        this.docks = [];
    }
    setScale() {}
    setExpand() {}
    setOutie() {}
    basicBox() {
        return "fill_color stroke_color block_label arg_label_0";
    }
    basicBlock() {
        return "fill_color stroke_color block_label";
    }
    getHeight() {
        return 12;
    }
};
global.DISABLEDFILLCOLOR = "disabled_fill";
global.DISABLEDSTROKECOLOR = "disabled_stroke";
global.PALETTEFILLCOLORS = { test: "test_fill" };
global.PALETTESTROKECOLORS = { test: "test_stroke" };
global.last = arr => arr[arr.length - 1];
global.getTextWidth = jest.fn(() => 10);
global.STANDARDBLOCKHEIGHT = 18;
global.CLOSEICON = "<svg fill_color></svg>";
global.safeSVG = str => str;
global.blockIsMacro = jest.fn(() => false);
global.getMacroExpansion = jest.fn();

console.log("✅ GLOBAL Jest fixes applied - tests should now pass");
