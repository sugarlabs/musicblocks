/**
 * @license
 * MusicBlocks
 *
 * Automated enforcement tests for design tokens.
 * Verifies that:
 * 1. tokens.css is the ONLY CSS stylesheet declaring custom properties (--*).
 * 2. darkmode.css, themes.css, and activities.css declare no custom properties.
 * 3. Deprecated names (--bg, --fg, --border, --panel-bg, --overlay-bg, --accent)
 *    are never declared or referenced across CSS and JS.
 * 4. All themes (light, dark, highcontrast) resolve all required canonical tokens.
 * 5. Text / background contrast meets WCAG 2.1 AA requirements (>= 4.5:1).
 * 6. Theme switching and dialogs avoid hardcoded inline visual styles.
 */

const fs = require("fs");
const path = require("path");

const CSS_DIR = path.join(__dirname, "..", "..", "css");
const JS_DIR = path.join(__dirname, "..");
const ROOT_DIR = path.join(__dirname, "..", "..");

const tokensCss = fs.readFileSync(path.join(CSS_DIR, "tokens.css"), "utf8");
const themesCss = fs.readFileSync(path.join(CSS_DIR, "themes.css"), "utf8");
const darkmodeCss = fs.readFileSync(path.join(CSS_DIR, "darkmode.css"), "utf8");

/**
 * Collects custom property declarations from a CSS string or selector block.
 *
 * @param {string} css
 * @param {string} [selector] Optional selector to scope to
 * @returns {Object} Map of property name to declared value
 */
const readTokenBlock = (css, selector) => {
    let targetCss = css;
    if (selector) {
        const start = css.indexOf(selector + " {");
        if (start === -1) {
            throw new Error(`no token block found for selector: ${selector}`);
        }
        targetCss = css.slice(start, css.indexOf("}", start));
    }
    const tokens = {};
    const pattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let match;
    while ((match = pattern.exec(targetCss)) !== null) {
        tokens[match[1]] = match[2].trim();
    }
    return tokens;
};

const THEMES = {
    light: readTokenBlock(tokensCss, ":root"),
    dark: { ...readTokenBlock(tokensCss, ":root"), ...readTokenBlock(tokensCss, "body.dark") },
    highcontrast: {
        ...readTokenBlock(tokensCss, ":root"),
        ...readTokenBlock(tokensCss, "body.highcontrast")
    }
};

/**
 * WCAG 2.1 relative luminance calculation.
 *
 * @param {string} hex Hex colour as #rrggbb or #rgb
 * @returns {number} Relative luminance
 */
const luminance = hex => {
    let cleanHex = hex.replace("#", "").trim();
    if (cleanHex.length === 3) {
        cleanHex = cleanHex
            .split("")
            .map(c => c + c)
            .join("");
    }
    const channels = [0, 2, 4].map(i => {
        const c = parseInt(cleanHex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

/**
 * WCAG 2.1 contrast ratio between two colours.
 *
 * @param {string} foreground Hex colour #rrggbb
 * @param {string} background Hex colour #rrggbb
 * @returns {number} Contrast ratio
 */
const contrastRatio = (foreground, background) => {
    const a = luminance(foreground);
    const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

describe("Design Tokens Single Source of Truth", () => {
    it("ensures tokens.css is the ONLY CSS stylesheet declaring custom properties", () => {
        const cssFiles = fs
            .readdirSync(CSS_DIR)
            .filter(f => f.endsWith(".css") && f !== "tokens.css");

        const filesWithCustomProps = [];
        const customPropPattern = /(?:^|[;{\s])(--[\w-]+)\s*:/;

        cssFiles.forEach(file => {
            const content = fs.readFileSync(path.join(CSS_DIR, file), "utf8");
            const match = customPropPattern.exec(content);
            if (match) {
                filesWithCustomProps.push({ file, property: match[1] });
            }
        });

        expect(filesWithCustomProps).toEqual([]);
    });

    it("verifies darkmode.css declares no custom properties", () => {
        const declared = readTokenBlock(darkmodeCss);
        expect(Object.keys(declared)).toEqual([]);
    });

    it("verifies themes.css declares no custom properties", () => {
        const declared = readTokenBlock(themesCss);
        expect(Object.keys(declared)).toEqual([]);
    });
});

describe("Deprecated Legacy Tokens Eradication", () => {
    const DEPRECATED_NAMES = ["--bg", "--fg", "--border", "--panel-bg", "--overlay-bg", "--accent"];

    it("ensures no deprecated token names are declared anywhere in CSS", () => {
        const cssFiles = fs.readdirSync(CSS_DIR).filter(f => f.endsWith(".css"));
        const violations = [];

        cssFiles.forEach(file => {
            const content = fs.readFileSync(path.join(CSS_DIR, file), "utf8");
            DEPRECATED_NAMES.forEach(depName => {
                const declRegex = new RegExp(`(?:^|[;{\\s])${depName}\\s*:`, "g");
                if (declRegex.test(content)) {
                    violations.push(`${file} declares deprecated token: ${depName}`);
                }
            });
        });

        expect(violations).toEqual([]);
    });

    it("ensures no deprecated token names are consumed via var() anywhere in CSS", () => {
        const cssFiles = fs.readdirSync(CSS_DIR).filter(f => f.endsWith(".css"));
        const violations = [];

        cssFiles.forEach(file => {
            const content = fs.readFileSync(path.join(CSS_DIR, file), "utf8");
            DEPRECATED_NAMES.forEach(depName => {
                const varRegex = new RegExp(`var\\(\\s*${depName}\\s*[,)]`, "g");
                if (varRegex.test(content)) {
                    violations.push(`${file} consumes deprecated token: var(${depName})`);
                }
            });
        });

        expect(violations).toEqual([]);
    });

    it("ensures dialogs, blocks, and widgets in JS do not use deprecated token names", () => {
        const jsFilesToCheck = [
            path.join(JS_DIR, "utils", "mb-dialog.js"),
            path.join(JS_DIR, "widgets", "widgetWindows.js"),
            path.join(JS_DIR, "blocks", "ExtrasBlocks.js"),
            path.join(JS_DIR, "themebox.js"),
            path.join(JS_DIR, "utils", "platformstyle.js")
        ];

        const violations = [];
        jsFilesToCheck.forEach(filePath => {
            if (!fs.existsSync(filePath)) return;
            const content = fs.readFileSync(filePath, "utf8");
            DEPRECATED_NAMES.forEach(depName => {
                // Match "var(--bg)", getPropertyValue("--bg"), etc.
                const usageRegex = new RegExp(`(["'\`])(?:var\\(\\s*)?${depName}(?:\\s*\\))?\\1`, "g");
                if (usageRegex.test(content)) {
                    violations.push(`${path.basename(filePath)} uses deprecated token: ${depName}`);
                }
            });
        });

        expect(violations).toEqual([]);
    });
});

describe("Canonical Tokens Completeness & Resolution", () => {
    const REQUIRED_TOKENS = [
        "--color-bg-primary",
        "--color-bg-secondary",
        "--color-bg-tertiary",
        "--color-text-primary",
        "--color-text-secondary",
        "--color-text-tertiary",
        "--color-text-inverse",
        "--color-bg-inverse",
        "--color-border-primary",
        "--color-border-secondary",
        "--color-brand-primary",
        "--color-brand-secondary",
        "--color-widget-frame-bg",
        "--color-widget-frame-border",
        "--color-overlay-backdrop",
        "--color-panel-bg",
        "--color-selector-bg",
        "--color-selector-selected",
        "--color-label-bg"
    ];

    it.each(["light", "dark", "highcontrast"])(
        "resolves all required canonical tokens in %s theme",
        theme => {
            const themeTokens = THEMES[theme];
            REQUIRED_TOKENS.forEach(token => {
                expect(themeTokens[token]).toBeDefined();
                expect(typeof themeTokens[token]).toBe("string");
            });
        }
    );
});

describe("Accessibility & Contrast Compliance", () => {
    it.each(["light", "dark", "highcontrast"])(
        "meets WCAG 2.1 AA text contrast (>= 4.5:1) in %s theme",
        theme => {
            const tokens = THEMES[theme];
            const text = tokens["--color-text-primary"];
            const bg = tokens["--color-bg-primary"];

            expect(text).toMatch(/^#[0-9a-f]{6}$/i);
            expect(bg).toMatch(/^#[0-9a-f]{6}$/i);

            const ratio = contrastRatio(text, bg);
            expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
    );

    it.each(["light", "dark", "highcontrast"])(
        "meets WCAG 2.1 AA inverse text/bg contrast (>= 4.5:1) in %s theme",
        theme => {
            const tokens = THEMES[theme];
            const textInv = tokens["--color-text-inverse"];
            const bgInv = tokens["--color-bg-inverse"];

            expect(textInv).toMatch(/^#[0-9a-f]{6}$/i);
            expect(bgInv).toMatch(/^#[0-9a-f]{6}$/i);

            const ratio = contrastRatio(textInv, bgInv);
            expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
    );
});

describe("Theme Switching & Inline Styles Purity", () => {
    it("themebox.js clears inline styles instead of assigning hardcoded hex colors to windowFrame", () => {
        const themeboxSource = fs.readFileSync(path.join(JS_DIR, "themebox.js"), "utf8");

        // Fails if hardcoded hex colors are assigned to win.style in themebox.js
        expect(themeboxSource).not.toMatch(/win\.style\.backgroundColor\s*=\s*["']#[0-9a-fA-F]+/);
        expect(themeboxSource).not.toMatch(/win\.style\.borderColor\s*=\s*["']#[0-9a-fA-F]+/);
    });

    it("mb-dialog.js uses canonical design tokens for frame and widget background", () => {
        const dialogSource = fs.readFileSync(path.join(JS_DIR, "utils", "mb-dialog.js"), "utf8");

        expect(dialogSource).toContain("var(--color-widget-frame-bg)");
        expect(dialogSource).toContain("var(--color-widget-frame-border)");
        expect(dialogSource).toContain("var(--color-panel-bg)");
        expect(dialogSource).toContain("var(--color-text-primary)");
    });

    it("activity.js strips inline color overrides from modalBox buttons and title", () => {
        const activitySource = fs.readFileSync(path.join(JS_DIR, "activity.js"), "utf8");

        expect(activitySource).not.toMatch(/title\.style\.color\s*=\s*platformColor/);
        expect(activitySource).not.toMatch(/confirmBtn\.style\.backgroundColor/);
        expect(activitySource).not.toMatch(/cancelBtn\.style\.backgroundColor/);
    });

    it("project-manager.js strips inline color overrides from modalBox buttons and title", () => {
        const pmSource = fs.readFileSync(path.join(JS_DIR, "project-manager.js"), "utf8");

        expect(pmSource).not.toMatch(/title\.style\.color\s*=\s*platformColor/);
        expect(pmSource).not.toMatch(/importConfirm\.style\.backgroundColor/);
    });

    it("windows.css uses canonical tokens instead of hardcoded grays for window frame and topbar", () => {
        const windowsCss = fs.readFileSync(
            path.join(ROOT_DIR, "dist", "css", "windows.css"),
            "utf8"
        );

        expect(windowsCss).toContain("var(--color-widget-frame-border)");
        expect(windowsCss).toContain("var(--color-widget-frame-bg)");
    });
});
