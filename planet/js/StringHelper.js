// Copyright (c) 2018 Euan Ong
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _
*/
/*
   exported

   StringHelper
*/

class StringHelper {
    constructor(Planet) {
        //[id, string, property (if present)]
        // append to innerhtml

        this.strings = [
            ["logo-container", _("Planet")],
            ["close-planet", _("Close Planet"), "data-tooltip"],
            ["planet-open-file", _("Open project from file"), "data-tooltip"],
            ["planet-new-project", _("New project"), "data-tooltip"],
            ["local-tab", _("Local")],
            ["global-tab", _("Global")],
            ["global-search", _("Search for a project"), "placeholder"],
            ["localtitle", _("My Projects")],
            ["publisher-ptitle", _("Publish project")],
            ["publish-title-label", _("Project title")],
            ["publish-tags-label", _("Tags (max 5)")],
            ["publish-description-label", _("Description")],
            ["publisher-submit", _("Submit")],
            ["publisher-cancel", _("Cancel")],
            ["deleter-confirm", _('Delete "<span id="deleter-title"></span>"?')],
            [
                "deleter-paragraph",
                _('Permanently delete project "<span id="deleter-name"></span>"?')
            ],
            ["deleter-button", _("Delete")],
            ["deleter-cancel", _("Cancel")],
            ["globaltitle", _("Explore Projects")],
            ["view-more-chips", _("Show more tags") + " ▼"],
            ["option-recent", _("Most recent")],
            ["option-liked", _("Most liked")],
            ["option-downloaded", _("Most downloaded")],
            ["option-alphabetical", _("A-Z")],
            ["option-sort-by", _("Sort by")],
            ["load-more-projects", _("Load More Projects")],
            ["projectviewer-last-updated-heading", _("Last Updated")],
            ["projectviewer-date-heading", _("Creation Date")],
            ["projectviewer-downloads-heading", _("Number of Downloads:")],
            ["projectviewer-likes-heading", _("Number of Likes:")],
            ["projectviewer-tags-heading", _("Tags:")],
            ["projectviewer-description-heading", _("Description")],
            ["projectviewer-report-project", _("Report Project"), "data-tooltip"],
            ["projectviewer-report-project-disabled", _("Project Reported"), "data-tooltip"],
            ["projectviewer-report-title", _("Report Project")],
            [
                "projectviewer-report-conduct",
                _(
                    'Report projects which violate the <a href="https://github.com/sugarlabs/sugar-docs/blob/master/CODE_OF_CONDUCT.md" target="_blank" rel="noopener noreferrer">Sugar Labs Code of Conduct</a>.'
                )
            ],
            ["projectviewer-report-reason", _("Reason for reporting project")],
            ["projectviewer-report-submit", _("Submit")],
            ["projectviewer-reportsubmit-title", _("Report Project")],
            ["projectviewer-report-close", _("Close")],
            ["projectviewer-download-file", _("Download as File"), "data-tooltip"],
            ["projectviewer-merge-mb", _("Merge with current project"), "data-tooltip"]
        ];

        this.strings.push([
            "projectviewer-open-mb",
            _(`Open in ${Planet.IsMusicBlocks ? "Music" : "Turtle"} Blocks`),
            "data-tooltip"
        ]);
    }

    init() {
        for (let i = 0; i < this.strings.length; i++) {
            const obj = this.strings[i];
            const elem = document.getElementById(obj[0]);

            if (elem) {
                if (this.strings[i].length === 3) {
                    elem.setAttribute(obj[2], obj[1]);
                } else if (HTML_ALLOWED_IDS.has(obj[0])) {
                    elem.innerHTML = elem.innerHTML + sanitizeAllowedHTML(obj[1]);
                } else {
                    elem.textContent = (elem.textContent || "") + obj[1];
                }
            }
        }
    }
}

// SECURITY: Only allow IDs here when the localized string intentionally
// contains HTML and has been reviewed for safe rendering.
const HTML_ALLOWED_IDS = new Set([
    "deleter-confirm",
    "deleter-paragraph",
    "projectviewer-report-conduct"
]);

const HTML_ALLOWED_TAGS = new Set(["A", "BR", "EM", "I", "SPAN", "STRONG"]);

const HTML_ALLOWED_ATTRIBUTES = {
    A: new Set(["href"]),
    SPAN: new Set(["id"])
};

function isSafeUrl(urlString) {
    if (!urlString || typeof urlString !== "string") return false;

    try {
        let decodedUrl = urlString.trim();
        const parser = new DOMParser();
        const doc = parser.parseFromString(decodedUrl, "text/html");
        decodedUrl = (doc.body.textContent || "").trim();

        // eslint-disable-next-line no-control-regex
        decodedUrl = decodedUrl.replace(/[\u0000-\u0020\u007F]/g, "");

        const parsed = new URL(decodedUrl);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (e) {
        return false;
    }
}

function sanitizeAllowedHTML(htmlString) {
    const input = document.createElement("template");
    input.innerHTML = htmlString;

    const output = document.createElement("template");

    const appendSanitizedNode = (sourceNode, targetParent) => {
        if (sourceNode.nodeType === Node.TEXT_NODE) {
            targetParent.appendChild(document.createTextNode(sourceNode.textContent || ""));
            return;
        }

        if (sourceNode.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        const tagName = sourceNode.tagName.toUpperCase();

        if (!HTML_ALLOWED_TAGS.has(tagName)) {
            for (const child of Array.from(sourceNode.childNodes)) {
                appendSanitizedNode(child, targetParent);
            }
            return;
        }

        const cleanElement = document.createElement(tagName.toLowerCase());

        for (const attr of Array.from(sourceNode.attributes)) {
            const attrName = attr.name.toLowerCase();
            const attrValue = attr.value;
            const allowedAttributes = HTML_ALLOWED_ATTRIBUTES[tagName] || new Set();

            if (attrName.startsWith("on") || !allowedAttributes.has(attrName)) {
                continue;
            }

            if (tagName === "SPAN" && attrName === "id") {
                if (attrValue !== "deleter-title" && attrValue !== "deleter-name") {
                    continue;
                }
            }

            if (tagName === "A" && attrName === "href") {
                if (!isSafeUrl(attrValue)) {
                    continue;
                }

                cleanElement.setAttribute("target", "_blank");
                cleanElement.setAttribute("rel", "noopener noreferrer");
            }

            cleanElement.setAttribute(attr.name, attrValue);
        }

        for (const child of Array.from(sourceNode.childNodes)) {
            appendSanitizedNode(child, cleanElement);
        }

        targetParent.appendChild(cleanElement);
    };

    for (const child of Array.from(input.content.childNodes)) {
        appendSanitizedNode(child, output.content);
    }

    return output.innerHTML;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = StringHelper;
}
