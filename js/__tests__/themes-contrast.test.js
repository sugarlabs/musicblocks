/**
 * @license
 * MusicBlocks v3.6.2
 * Copyright (C) 2026 Rakshit Yadav
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const fs = require("fs");
const path = require("path");

const CSS_DIR = path.join(__dirname, "..", "..", "css");
const tokensCss = fs.readFileSync(path.join(CSS_DIR, "tokens.css"), "utf8");
const themesCss = fs.readFileSync(path.join(CSS_DIR, "themes.css"), "utf8");

/**
 * Collects the custom properties declared in one selector block.
 *
 * @param {string} css Stylesheet source
 * @param {string} selector Selector whose block should be read
 * @returns {Object} Map of custom property name to declared value
 */
const readTokenBlock = (css, selector) => {
    const start = css.indexOf(selector + " {");
    if (start === -1) {
        throw new Error(`no token block for ${selector}`);
    }
    const block = css.slice(start, css.indexOf("}", start));
    const tokens = {};
    const pattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let match;
    while ((match = pattern.exec(block)) !== null) {
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
 * Splits a stylesheet into { selector, declarations } pairs. Good enough for
 * these flat theme files, which have no nested at-rules around the rules we
 * care about.
 *
 * @param {string} css Stylesheet source
 * @returns {Array} Parsed rules
 */
const parseRules = css => {
    const rules = [];
    const pattern = /([^{}]+)\{([^{}]*)\}/g;
    let match;
    while ((match = pattern.exec(css)) !== null) {
        rules.push({ selector: match[1].trim(), body: match[2] });
    }
    return rules;
};

/**
 * Reads one declaration out of a rule body.
 *
 * @param {string} body Declarations of a rule
 * @param {string} property Property to read
 * @returns {string|null} The declared value, or null when absent
 */
const declaration = (body, property) => {
    const match = new RegExp(`(?:^|[;{\\s])${property}\\s*:\\s*([^;]+);`).exec(body);
    return match ? match[1].replace("!important", "").trim() : null;
};

/**
 * Resolves a colour value to #rrggbb, following one level of var().
 *
 * @param {string} value Declared value
 * @param {Object} tokens Token map for the theme
 * @returns {string|null} A hex colour, or null when it cannot be resolved
 */
const resolveColor = (value, tokens) => {
    if (!value) return null;
    const varMatch = /^var\((--[\w-]+)\)$/.exec(value);
    const resolved = varMatch ? tokens[varMatch[1]] : value;
    return resolved && /^#[0-9a-f]{6}$/i.test(resolved) ? resolved.toLowerCase() : null;
};

/**
 * WCAG 2.1 relative luminance.
 *
 * @param {string} hex Colour as #rrggbb
 * @returns {number} Relative luminance
 */
const luminance = hex => {
    const channels = [1, 3, 5].map(i => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

/**
 * WCAG 2.1 contrast ratio between two colours.
 *
 * @param {string} foreground Colour as #rrggbb
 * @param {string} background Colour as #rrggbb
 * @returns {number} Contrast ratio
 */
const contrastRatio = (foreground, background) => {
    const a = luminance(foreground);
    const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

const themeOf = selector => {
    if (selector.includes(".highcontrast")) return "highcontrast";
    if (selector.includes(".dark")) return "dark";
    return "light";
};

describe("themes.css colour tokens", () => {
    const rules = parseRules(themesCss);

    it("never paints text and background with the same token", () => {
        // A rule that resolves both to one token renders its text invisible.
        // This is how the widget body and the modal message were lost in the
        // high-contrast theme after the design-token migration.
        const collisions = rules
            .map(rule => {
                const color = declaration(rule.body, "color");
                const background = declaration(rule.body, "background-color");
                const isVar = value => value && /^var\(--[\w-]+\)$/.test(value);
                return isVar(color) && color === background ? `${rule.selector} -> ${color}` : null;
            })
            .filter(Boolean);

        expect(collisions).toEqual([]);
    });

    it.each(["dark", "highcontrast"])("keeps widget body text readable in the %s theme", theme => {
        const rule = rules.find(
            r => r.selector.includes(".wfbWidget") && themeOf(r.selector) === theme
        );
        expect(rule).toBeDefined();

        const tokens = THEMES[theme];
        const foreground = resolveColor(declaration(rule.body, "color"), tokens);
        const background = resolveColor(declaration(rule.body, "background-color"), tokens);
        expect(foreground).not.toBeNull();
        expect(background).not.toBeNull();

        // WCAG 2.1 AA for body text.
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    });

    it.each(["dark", "highcontrast"])("keeps modal messages readable in the %s theme", theme => {
        const rule = rules.find(
            r => r.selector.trim().endsWith(".modal-message") && themeOf(r.selector) === theme
        );
        expect(rule).toBeDefined();

        const tokens = THEMES[theme];
        const foreground = resolveColor(declaration(rule.body, "color"), tokens);
        const background = resolveColor(declaration(rule.body, "background-color"), tokens);
        expect(foreground).not.toBeNull();
        expect(background).not.toBeNull();

        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    });
});
