/**
 * MusicBlocks
 *
 * @copyright 2025 Diwangshu Kakoty
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/* global escapeHTML, isSafeUrl */
/*
    Globals location
    - js/utils/utils-logic.js
        escapeHTML, isSafeUrl
*/

/* exported ReflectionMarkdown */

/**
 * @file ReflectionMarkdown.js
 * @description Reflection Markdown: turning a mentor's Markdown reply into sanitized HTML.
 *
 * The methods are moved as they were from the ReflectionMatrix class, which copies them onto
 * ReflectionMatrix.prototype (see ReflectionMatrix.installModules), so `this` is still the
 * widget.
 */
class ReflectionMarkdown {
    /**
     * Sanitizes HTML content using DOMParser to prevent XSS.
     * Removes unsafe attributes and ensures links are safe.
     * @param {string} htmlString - The HTML string to sanitize.
     * @returns {string} - The sanitized HTML string.
     */
    sanitizeHTML(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");

        // Sanitize all elements
        const elements = doc.body.querySelectorAll("*");
        for (const el of elements) {
            const tagName = el.tagName.toLowerCase();

            // Remove forbidden tags that can execute code or change page behavior
            const forbiddenTags = ["script", "iframe", "object", "embed", "base", "form"];
            if (forbiddenTags.includes(tagName)) {
                el.remove();
                continue;
            }

            const attrs = el.attributes;

            for (let i = attrs.length - 1; i >= 0; i--) {
                const attrName = attrs[i].name.toLowerCase();
                const attrValue = attrs[i].value;

                // Remove all event handlers
                if (attrName.startsWith("on")) {
                    el.removeAttribute(attrName);
                    continue;
                }

                // Sanitize URL attributes (href, src)
                if (attrName === "href" || attrName === "src") {
                    if (!isSafeUrl(attrValue)) {
                        el.removeAttribute(attrName);
                    } else if (tagName === "a" && attrName === "href") {
                        // Enforce security attributes for external links
                        el.setAttribute("target", "_blank");
                        el.setAttribute("rel", "noopener noreferrer");
                    }
                    continue;
                }

                // Sanitize style attribute
                if (attrName === "style") {
                    // Check for dangerous keywords in style properties
                    const dangerousStyleKeywords = ["javascript:", "url(", "expression", "eval"];
                    if (dangerousStyleKeywords.some(kw => attrValue.toLowerCase().includes(kw))) {
                        el.removeAttribute(attrName);
                    }
                    continue;
                }

                // Remove other potentially dangerous attributes (like action, formaction, etc.)
                const sensitiveAttrs = ["action", "formaction", "data", "codebase"];
                if (sensitiveAttrs.includes(attrName)) {
                    el.removeAttribute(attrName);
                }
            }
        }

        return doc.body.innerHTML;
    }

    /**
     * Checks if a URL is unsafe.
     * @param {string} url - The URL to check.
     * @returns {boolean} - True if unsafe, false otherwise.
     */
    isUnsafeUrl(url) {
        return !isSafeUrl(url);
    }

    /**
     * Converts Markdown text to HTML.
     * @param {string} md - The Markdown text.
     * @returns {string} - The converted HTML text.
     */
    mdToHTML(md) {
        // Step 1: Escape HTML first to prevent XSS attacks from raw tags
        let html = escapeHTML(md);

        // Step 2: Convert Markdown syntax to HTML

        // Headings
        html = html.replace(/^###### (.*$)/gim, "<h6>$1</h6>");
        html = html.replace(/^##### (.*$)/gim, "<h5>$1</h5>");
        html = html.replace(/^#### (.*$)/gim, "<h4>$1</h4>");
        html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
        html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
        html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

        // Bold & Italic
        html = html.replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>");
        html = html.replace(/\*(.*?)\*/gim, "<i>$1</i>");

        // Links - Create raw anchor tags, sanitization happens in Step 3
        html = html.replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>");

        // Line breaks
        html = html.replace(/\n/gim, "<br>");

        // Step 3: Sanitize the generated HTML using DOMParser
        return this.sanitizeHTML(html);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ReflectionMarkdown;
}
