// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

const { setupAlertRenderer, AlertRenderer } = require("../alert-renderer.js");
const { setupAlertController } = require("../alert-controller.js");

// Setup globals before loading or running the tests
global.MSGBLOCK = "fill_color stroke_color";
global.base64Encode = s => s;
global.NOMICERRORMSG = "nomic";
global.NOSTRINGERRORMSG = "nostring";
global.EMPTYHEAPERRORMSG = "emptyheap";
global.NOSQRTERRORMSG = "nosqrt";
global.NOACTIONERRORMSG = "noaction";
global.NOBOXERRORMSG = "nobox";
global.ZERODIVIDEERRORMSG = "zerodivide";
global.NANERRORMSG = "nan";
global.NOINPUTERRORMSG = "noinput";

// Mock window.btoa
global.window = {
    btoa: s => s
};

// Mock Image
global.Image = class {
    constructor() {
        this.onload = null;
        this._src = "";
    }
    get src() {
        return this._src;
    }
    set src(val) {
        this._src = val;
        // Instantly trigger onload asynchronously
        setTimeout(() => {
            if (this.onload) this.onload();
        }, 0);
    }
};

// Mock createjs
global.createjs = {
    Container: class {
        constructor() {
            this.children = [];
            this.visible = true;
            this.x = 0;
            this.y = 0;
            this.hitArea = null;
            this._listeners = {};
        }
        addChild(child) {
            child.parent = this;
            this.children.push(child);
        }
        removeChild(child) {
            const idx = this.children.indexOf(child);
            if (idx > -1) {
                this.children.splice(idx, 1);
                child.parent = null;
            }
        }
        removeAllChildren() {
            this.children.forEach(c => {
                c.parent = null;
            });
            this.children = [];
        }
        cache() {}
        getBounds() {
            return { x: 0, y: 0, width: 100, height: 100 };
        }
        setChildIndex(child, index) {
            const idx = this.children.indexOf(child);
            if (idx > -1) {
                this.children.splice(idx, 1);
                this.children.splice(index, 0, child);
            }
        }
        on(evt, handler) {
            this._listeners[evt] = handler;
        }
        trigger(evt) {
            if (this._listeners[evt]) {
                this._listeners[evt]();
            }
        }
    },
    Bitmap: class {
        constructor(img) {
            this.image = img;
            this.parent = null;
        }
    },
    Text: class {
        constructor(text, font, color) {
            this.text = text;
            this.font = font;
            this.color = color;
            this.parent = null;
            this.x = 0;
            this.y = 0;
        }
    },
    Shape: class {
        constructor() {
            this.parent = null;
            this.x = 0;
            this.y = 0;
            this.rotation = 0;
            this.graphics = {
                beginFill: () => this.graphics,
                drawRect: () => this.graphics,
                setStrokeStyle: () => this.graphics,
                beginStroke: () => this.graphics,
                moveTo: () => this.graphics,
                lineTo: () => this.graphics
            };
        }
    }
};

function makeMockActivity() {
    return {
        stage: new global.createjs.Container(),
        canvas: { width: 1000 },
        msgText: null,
        errorMsgText: null,
        errorArtwork: {},
        errorMsgArrow: null,
        blocksContainer: { x: 10, y: 20 },
        blocks: {
            blockList: {
                "block-1": {
                    collapsed: false,
                    container: { x: 100, y: 200 }
                },
                "block-collapsed": {
                    collapsed: true,
                    container: { x: 300, y: 400 }
                }
            }
        },
        printText: { classList: { add: jest.fn(), remove: jest.fn() } },
        printTextContent: {
            replaceChildren: jest.fn(),
            appendChild: jest.fn(),
            textContent: ""
        },
        errorText: { classList: { add: jest.fn(), remove: jest.fn() } },
        errorTextContent: { textContent: "" },
        refreshCanvas: jest.fn()
    };
}

describe("setupAlertRenderer", () => {
    test("attaches alertRenderer instance and wraps functions on activity", () => {
        const activity = makeMockActivity();
        setupAlertRenderer(activity);

        expect(activity.alertRenderer).toBeInstanceOf(AlertRenderer);
        expect(typeof activity._createMsgContainer).toBe("function");
        expect(typeof activity._createErrorContainers).toBe("function");
        expect(typeof activity._makeErrorArtwork).toBe("function");
        expect(typeof activity._hideAlertUI).toBe("function");
        expect(typeof activity._hideArrows).toBe("function");
    });
});

describe("AlertRenderer creation and caching", () => {
    let activity;
    let renderer;

    beforeEach(() => {
        activity = makeMockActivity();
        setupAlertRenderer(activity);
        renderer = activity.alertRenderer;
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("createMsgContainer loads image and registers message callback", () => {
        const callback = jest.fn();
        renderer.createMsgContainer("#ffffff", "#7a7a7a", callback, 130);

        jest.advanceTimersByTime(1);

        expect(callback).toHaveBeenCalled();
        expect(activity.msgText).toBeInstanceOf(global.createjs.Text);
        expect(activity.stage.children.length).toBe(1);

        const container = activity.stage.children[0];
        expect(container.x).toBe(500);
        expect(container.y).toBe(130);
    });

    test("clicking container hides it and clears error arrow", () => {
        const callback = jest.fn();
        renderer.createMsgContainer("#ffffff", "#7a7a7a", callback, 130);
        activity.errorMsgArrow = { removeAllChildren: jest.fn() };

        jest.advanceTimersByTime(1);

        const container = activity.stage.children[0];
        container.visible = true;

        container.trigger("click");
        expect(container.visible).toBe(false);
        expect(activity.errorMsgArrow.removeAllChildren).toHaveBeenCalled();
        expect(activity.update).toBe(true);
    });

    test("createErrorContainers builds all required error containers", () => {
        renderer.createErrorContainers();
        jest.advanceTimersByTime(1);

        const expectedKeys = [
            "emptybox",
            "emptyheap",
            "negroot",
            "noinput",
            "zerodivide",
            "notanumber",
            "nostack",
            "notastring",
            "nomicrophone"
        ];
        expectedKeys.forEach(key => {
            expect(activity.errorArtwork[key]).toBeInstanceOf(global.createjs.Container);
        });
    });
});

describe("AlertRenderer message display logic", () => {
    let activity;
    let renderer;

    beforeEach(() => {
        activity = makeMockActivity();
        setupAlertRenderer(activity);
        renderer = activity.alertRenderer;
    });

    test("showTextMsg guards against uninitialized msgText", () => {
        activity.msgText = null;
        renderer.showTextMsg("test");
        expect(activity.printText.classList.add).not.toHaveBeenCalled();
    });

    test("showTextMsg displays simple string msg", () => {
        activity.msgText = {};
        renderer.showTextMsg("test-message");
        expect(activity.printText.classList.add).toHaveBeenCalledWith("show");
        expect(activity.printTextContent.replaceChildren).toHaveBeenCalled();
        expect(activity.printTextContent.textContent).toBe("test-message");
    });

    test("showTextMsg displays HTML element / fragment", () => {
        activity.msgText = {};
        const div = document.createElement("div");
        renderer.showTextMsg(div);
        expect(activity.printText.classList.add).toHaveBeenCalledWith("show");
        expect(activity.printTextContent.replaceChildren).toHaveBeenCalled();
        expect(activity.printTextContent.appendChild).toHaveBeenCalledWith(div);
    });

    test("showTextMsg parses links safely", () => {
        activity.msgText = {};
        renderer.showTextMsg('<a class="custom-link">Reload</a>');
        expect(activity.printText.classList.add).toHaveBeenCalledWith("show");
        expect(activity.printTextContent.appendChild).toHaveBeenCalled();
    });

    test("hideTextMsg removes show class", () => {
        renderer.hideTextMsg();
        expect(activity.printText.classList.remove).toHaveBeenCalledWith("show");
    });
});

describe("AlertRenderer error message display logic", () => {
    let activity;
    let renderer;

    beforeEach(() => {
        activity = makeMockActivity();
        setupAlertRenderer(activity);
        renderer = activity.alertRenderer;
        activity.errorMsgText = { parent: { visible: false } };
        activity.errorArtwork = {
            nomicrophone: { visible: false },
            notastring: { visible: false },
            emptyheap: { visible: false },
            negroot: { visible: false },
            nostack: { visible: false, children: [{}, { text: "" }], updateCache: jest.fn() },
            emptybox: { visible: false, children: [{}, { text: "" }], updateCache: jest.fn() },
            zerodivide: { visible: false },
            notanumber: { visible: false },
            noinput: { visible: false }
        };
    });

    test("showErrorMsg displays arrow pointing to uncollapsed block", () => {
        renderer.showErrorMsg("nomic", "block-1");
        expect(activity.errorMsgArrow).toBeInstanceOf(global.createjs.Container);
        expect(activity.errorMsgArrow.children.length).toBe(2); // line and head
    });

    test("showErrorMsg does not show arrow pointing to collapsed block", () => {
        renderer.showErrorMsg("nomic", "block-collapsed");
        expect(activity.errorMsgArrow).toBeNull();
    });

    test("showErrorMsg displays specific artwork for NOMICERRORMSG", () => {
        renderer.showErrorMsg("nomic");
        expect(activity.errorArtwork.nomicrophone.visible).toBe(true);
    });

    test("showErrorMsg displays specific text for NOACTIONERRORMSG", () => {
        renderer.showErrorMsg("noaction", null, "custom-action-err");
        expect(activity.errorArtwork.nostack.visible).toBe(true);
        expect(activity.errorArtwork.nostack.children[1].text).toBe("custom-action-err");
    });

    test("showErrorMsg falls back to text block for unknown error", () => {
        renderer.showErrorMsg("An unknown error occurred");
        expect(activity.errorText.classList.add).toHaveBeenCalledWith("show");
        expect(activity.errorTextContent.textContent).toBe("An unknown error occurred");
    });
});

describe("AlertRenderer hide methods", () => {
    let activity;
    let renderer;

    beforeEach(() => {
        activity = makeMockActivity();
        setupAlertRenderer(activity);
        renderer = activity.alertRenderer;
        activity.msgText = { parent: { visible: true } };
        activity.errorMsgText = { parent: { visible: true } };
        activity.errorMsgArrow = { removeAllChildren: jest.fn() };
        activity.errorArtwork = {
            nomicrophone: { visible: true },
            notastring: { visible: true }
        };
    });

    test("hideAlertUI clears all visibility states and arrows", () => {
        renderer.hideAlertUI();

        expect(activity.msgText.parent.visible).toBe(false);
        expect(activity.errorMsgText.parent.visible).toBe(false);
        expect(activity.errorText.classList.remove).toHaveBeenCalledWith("show");
        expect(activity.printText.classList.remove).toHaveBeenCalledWith("show");
        expect(activity.errorArtwork.nomicrophone.visible).toBe(false);
        expect(activity.errorArtwork.notastring.visible).toBe(false);
        expect(activity.errorMsgArrow.removeAllChildren).toHaveBeenCalled();
        expect(activity.refreshCanvas).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Controller & Renderer Architectural Boundary Integration
// ---------------------------------------------------------------------------

describe("AlertController and AlertRenderer architectural boundary integration", () => {
    let activity;
    let controller;
    let renderer;

    beforeEach(() => {
        jest.useFakeTimers();

        // 1. Build an activity instance similar to activity.js
        activity = {
            stage: new global.createjs.Container(),
            canvas: { width: 1000 },
            msgText: {},
            errorMsgText: { parent: { visible: false } },
            errorArtwork: {},
            errorMsgArrow: null,
            blocksContainer: { x: 10, y: 20 },
            blocks: { blockList: {} },
            printText: { classList: { add: jest.fn(), remove: jest.fn() } },
            printTextContent: { replaceChildren: jest.fn(), textContent: "" },
            errorText: { classList: { add: jest.fn(), remove: jest.fn() } },
            errorTextContent: { textContent: "" },
            refreshCanvas: jest.fn(),

            textMsg(msg, duration) {
                if (this.msgText === null) return;
                const showMsg = () => {
                    this.alertRenderer.showTextMsg(msg);
                };
                const hideMsg = () => {
                    this.alertRenderer.hideTextMsg();
                };
                if (this.alertController) {
                    this.alertController.showText(duration, showMsg, hideMsg);
                } else {
                    showMsg();
                }
            },

            errorMsg(msg, blk, text, timeout) {
                if (this.errorMsgText === null) return;
                const showMsg = () => {
                    this.alertRenderer.showErrorMsg(msg, blk, text);
                };
                const hideMsg = () => {
                    this.alertRenderer.hideErrorMsg();
                };
                if (this.alertController) {
                    this.alertController.showError(timeout, showMsg, hideMsg);
                } else {
                    showMsg();
                }
            },

            hideMsgs() {
                if (this.alertController) {
                    this.alertController.hideAll();
                }
                this._hideAlertUI();
            }
        };

        // 2. Initialize both controller and renderer
        setupAlertController(activity);
        setupAlertRenderer(activity);

        controller = activity.alertController;
        renderer = activity.alertRenderer;

        // Mock the renderer presentation-only methods to avoid triggering unmocked createjs/Image logic
        renderer.showTextMsg = jest.fn();
        renderer.hideTextMsg = jest.fn();
        renderer.showErrorMsg = jest.fn();
        renderer.hideErrorMsg = jest.fn();
        renderer.hideAlertUI = jest.fn();
        renderer.hideArrows = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("AlertRenderer contains no internal state and does not manage timeouts/visibility flags", () => {
        // Assert that the renderer instance is stateless (only holds the activity reference)
        const rendererKeys = Object.keys(renderer);
        expect(rendererKeys).toEqual(["activity"]);
        expect(renderer.activity).toBe(activity);
    });

    test("Showing a text alert updates controller timer state, invokes renderer via callbacks, and does not mutate controller state during rendering", () => {
        expect(controller.msgTimeoutID).toBeNull();
        expect(renderer.showTextMsg).not.toHaveBeenCalled();

        activity.textMsg("Hello World", 5000);

        // Controller state updated (timer scheduled)
        expect(controller.msgTimeoutID).not.toBeNull();
        const initialTimeoutID = controller.msgTimeoutID;

        // Renderer invoked via controller callbacks
        expect(renderer.showTextMsg).toHaveBeenCalledWith("Hello World");

        // Verify renderer invocation did not alter the scheduled controller state
        expect(controller.msgTimeoutID).toBe(initialTimeoutID);
    });

    test("Showing an error alert updates controller state and calls renderer showErrorMsg", () => {
        expect(controller.errorMsgTimeoutID).toBeNull();
        expect(renderer.showErrorMsg).not.toHaveBeenCalled();

        activity.errorMsg("Error details", "block-x", "context", 3000);

        // Controller state updated (timer scheduled)
        expect(controller.errorMsgTimeoutID).not.toBeNull();
        const initialErrorTimeoutID = controller.errorMsgTimeoutID;

        // Renderer invoked via controller callbacks
        expect(renderer.showErrorMsg).toHaveBeenCalledWith("Error details", "block-x", "context");

        // Verify renderer invocation did not alter the scheduled controller state
        expect(controller.errorMsgTimeoutID).toBe(initialErrorTimeoutID);
    });

    test("Hiding alerts clears controller state first and schedules renderer cleanup", () => {
        activity.textMsg("Message", 1000);
        activity.errorMsg("Error", null, null, 1000);

        expect(controller.msgTimeoutID).not.toBeNull();
        expect(controller.errorMsgTimeoutID).not.toBeNull();

        activity.hideMsgs();

        // Controller timeouts are cleared (source of truth updated)
        expect(controller.msgTimeoutID).toBeNull();
        expect(controller.errorMsgTimeoutID).toBeNull();

        // Renderer hide/cleanup called
        expect(renderer.hideAlertUI).toHaveBeenCalledTimes(1);
    });

    test("Closing alert by timeout triggers callbacks and flows through controller", () => {
        activity.textMsg("Message", 1000);
        expect(renderer.hideTextMsg).not.toHaveBeenCalled();

        // Advancing time triggers the timeout callback owned by controller
        jest.advanceTimersByTime(1000);

        expect(controller.msgTimeoutID).toBeNull();
        expect(renderer.hideTextMsg).toHaveBeenCalledTimes(1);
    });
});
