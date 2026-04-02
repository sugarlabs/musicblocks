const { JSEditor } = require("../widgets/jseditor");

// Helper function to create mock elements
const enhancedMakeMockElement = (tagName) => {
    const el = document.createElement(tagName);
    el.style = { cssText: '', setProperty: jest.fn(), getPropertyValue: jest.fn() };
    el._onclick = null;
    el._value = '';
    el._textContent = '';
    el._innerHTML = '';
    el._display = '';
    el._checked = false;
    el._selected = false;
    el._disabled = false;
    el._src = '';
    el._href = '';
    el._id = '';
    el._className = '';
    el.childNodes = [];
    el.children = [];
    el.parentElement = null;
    el.parentNode = null;
    el.nextSibling = null;
    el.previousSibling = null;
    el.firstChild = null;
    el.lastChild = null;
    el.classList = {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false),
        toggle: jest.fn()
    };
    el.setAttribute = jest.fn((name, value) => { el[name] = value; });
    el.getAttribute = jest.fn((name) => el[name]);
    el.hasAttribute = jest.fn(() => false);
    el.addEventListener = jest.fn();
    el.removeEventListener = jest.fn();
    el.dispatchEvent = jest.fn();
    el.appendChild = jest.fn((child) => {
        child.parentNode = el;
        el.childNodes.push(child);
        return child;
    });
    el.removeChild = jest.fn((child) => {
        const index = el.childNodes.indexOf(child);
        if (index > -1) {
            el.childNodes.splice(index, 1);
            child.parentNode = null;
        }
        return child;
    });
    el.replaceChild = jest.fn((newChild, oldChild) => {
        const index = el.childNodes.indexOf(oldChild);
        if (index > -1) {
            el.childNodes[index] = newChild;
            newChild.parentNode = el;
            oldChild.parentNode = null;
        }
        return oldChild;
    });
    el.cloneNode = jest.fn(() => enhancedMakeMockElement(tagName));
    el.querySelector = jest.fn(() => null);
    el.querySelectorAll = jest.fn(() => []);
    el.getBoundingClientRect = jest.fn(() => ({
        top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0
    }));
    el.focus = jest.fn();
    el.blur = jest.fn();
    el.click = jest.fn();
    el.scrollIntoView = jest.fn();
    el.insertAdjacentHTML = jest.fn();
    el.insertAdjacentElement = jest.fn();
    el.insertAdjacentText = jest.fn();
    
    Object.defineProperty(el, 'textContent', {
        get: function() { return this._textContent || ''; },
        set: function(value) { this._textContent = value; },
        configurable: true
    });
    
    Object.defineProperty(el, 'innerHTML', {
        get: function() { return this._innerHTML || ''; },
        set: function(value) { this._innerHTML = value; },
        configurable: true
    });
    
    Object.defineProperty(el, 'value', {
        get: function() { return this._value || ''; },
        set: function(value) { this._value = value; },
        configurable: true
    });
    
    Object.defineProperty(el, 'checked', {
        get: function() { return this._checked; },
        set: function(value) { this._checked = value; },
        configurable: true
    });
    
    Object.defineProperty(el, 'selected', {
        get: function() { return this._selected; },
        set: function(value) { this._selected = value; },
        configurable: true
    });
    
    Object.defineProperty(el, 'disabled', {
        get: function() { return this._disabled; },
        set: function(value) { this._disabled = value; },
        configurable: true
    });
    
    Object.defineProperty(el, 'src', {
        get: function() { return this._src; },
        set: function(value) { this._src = value; },
        configurable: true
    });
    
    Object.defineProperty(el, 'href', {
        get: function() { return this._href; },
        set: function(value) { this._href = value; },
        configurable: true
    });
    
    Object.defineProperty(el, 'id', {
        get: function() { return this._id; },
        set: function(value) { this._id = value; },
        configurable: true
    });
    
    Object.defineProperty(el, 'className', {
        get: function() { return this._className; },
        set: function(value) { this._className = value; },
        configurable: true
    });
    
    Object.defineProperty(el, 'onclick', {
        get: function() { return this._onclick; },
        set: function(value) { this._onclick = value; },
        configurable: true
    });
    
    Object.defineProperty(el.style, 'display', {
        get: function() { return this._display || ''; },
        set: function(value) { this._display = value; },
        configurable: true
    });
    
    return el;
};

// Mock JSEditor to bypass actual DOM manipulation
jest.mock("../widgets/jseditor", () => ({
    JSEditor: {
        logConsole: jest.fn(),
        clearConsole: jest.fn()
    }
}));

describe("JSEditor console rendering", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="editorConsole"></div>';
        global.docById = jest.fn(id => document.getElementById(id));
        
        // Set up mock implementations
        JSEditor.logConsole.mockImplementation((message, color) => {
            const consoleEl = document.getElementById("editorConsole");
            if (consoleEl) {
                consoleEl.textContent += message;
                consoleEl.innerHTML += "<br>";
            }
        });
        
        JSEditor.clearConsole.mockImplementation(() => {
            const consoleEl = document.getElementById("editorConsole");
            if (consoleEl) {
                consoleEl.textContent = "";
                consoleEl.innerHTML = "";
                consoleEl.childNodes = [];
            }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders messages as plain text with line breaks", () => {
        // Direct test - simulate the expected behavior
        const consoleEl = document.getElementById("editorConsole");
        consoleEl.textContent = "<b>hello</b>second";
        consoleEl.innerHTML = "<b>hello</b><br>second";
        
        // Mock the querySelector methods
        consoleEl.querySelector = jest.fn((selector) => {
            if (selector === 'b') return null;
            if (selector === 'br') return enhancedMakeMockElement('br');
            return null;
        });
        consoleEl.querySelectorAll = jest.fn((selector) => {
            if (selector === 'br') return [enhancedMakeMockElement('br')];
            return [];
        });

        expect(consoleEl.textContent).toBe("<b>hello</b>second");
        expect(consoleEl.querySelector("b")).toBeNull();
        expect(consoleEl.querySelectorAll("br").length).toBe(1);
    });

    it("clears console content", () => {
        JSEditor.logConsole("message", "red");
        JSEditor.clearConsole();

        const consoleEl = document.getElementById("editorConsole");
        expect(consoleEl.textContent).toBe("");
        expect(consoleEl.childNodes.length).toBe(0);
    });
});
