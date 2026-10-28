// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * @file Small Markdown renderer for the AI chat widgets (Reflection, AI Debugger).
 *
 * Model replies use headings, bold text, lists and code. The text is escaped
 * before any tag is added, so only the tags made here can appear, and the
 * result then goes through DOMPurify when the page has it.
 */

/* global module, window, DOMPurify */

/**
 * Escapes text for use inside HTML.
 * @param {string} text
 * @returns {string}
 */
function escapeChatText(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Adds inline Markdown to escaped text, which is code, bold, italic and http(s) links.
 * @param {string} text - Escaped text.
 * @returns {string}
 */
function renderInline(text) {
    // Code spans are set aside so ** and * inside them stay as written. They
    // are marked with a private-use character, which is removed from the reply
    // first so the reply cannot contain a marker of its own.
    const marker = String.fromCharCode(0xe000);
    const codes = [];
    let html = text
        .split(marker)
        .join("")
        .replace(/`([^`]+)`/g, (_match, code) => {
            codes.push(`<code>${code}</code>`);
            return `${marker}${codes.length - 1}${marker}`;
        });
    html = html
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, "$1<em>$2</em>")
        .replace(
            /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        );
    return html.replace(
        new RegExp(`${marker}(\\d+)${marker}`, "g"),
        (_match, index) => codes[Number(index)]
    );
}

/**
 * Turns a model reply into safe HTML.
 * @param {string} markdown
 * @returns {string}
 */
function renderChatMarkdown(markdown) {
    const lines = escapeChatText(markdown || "")
        .replace(/\r\n?/g, "\n")
        .split("\n");
    const out = [];
    let paragraph = [];
    let list = null;
    let code = null;

    const closeParagraph = () => {
        if (paragraph.length) {
            out.push(`<p>${paragraph.map(renderInline).join("<br>")}</p>`);
            paragraph = [];
        }
    };
    const closeList = () => {
        if (list) {
            const start = list.start === undefined ? "" : ` start="${list.start}"`;
            out.push(`<${list.tag}${start}>${list.items.join("")}</${list.tag}>`);
            list = null;
        }
    };

    for (const line of lines) {
        if (code !== null) {
            if (/^\s*```/.test(line)) {
                out.push(`<pre><code>${code.join("\n")}</code></pre>`);
                code = null;
            } else {
                code.push(line);
            }
            continue;
        }
        if (/^\s*```/.test(line)) {
            closeParagraph();
            closeList();
            code = [];
            continue;
        }
        const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
        const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
        const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (heading) {
            closeParagraph();
            closeList();
            // Chat bubbles are small, so every heading is a bold line.
            out.push(`<p class="ai-chat-heading"><strong>${renderInline(heading[2])}</strong></p>`);
        } else if (bullet || numbered) {
            closeParagraph();
            const tag = bullet ? "ul" : "ol";
            if (!list || list.tag !== tag) {
                closeList();
                list = { tag, items: [] };
                // Models often put a blank line or a bullet between steps,
                // which starts a new list. Without start every step is 1.
                if (numbered && Number(numbered[1]) !== 1) {
                    list.start = Number(numbered[1]);
                }
            }
            list.items.push(`<li>${renderInline(bullet ? bullet[1] : numbered[2])}</li>`);
        } else if (!line.trim()) {
            closeParagraph();
            closeList();
        } else {
            closeList();
            paragraph.push(line.trim());
        }
    }
    if (code !== null) {
        out.push(`<pre><code>${code.join("\n")}</code></pre>`);
    }
    closeParagraph();
    closeList();

    const html = out.join("");
    const purify =
        (typeof DOMPurify !== "undefined" && DOMPurify) ||
        (typeof window !== "undefined" && window.DOMPurify);
    return purify ? purify.sanitize(html, { ADD_ATTR: ["target"] }) : html;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { renderChatMarkdown, escapeChatText };
} else if (typeof window !== "undefined") {
    window.renderChatMarkdown = renderChatMarkdown;
}
