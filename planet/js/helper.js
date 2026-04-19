// Copyright (c) 2017 Euan Ong
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// https://davidwalsh.name/javascript-debounce-function
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.

/*
   global

   _, $
*/
/*
   exported

   debounce, getCookie, setCookie, hideOnClickOutside,
   updateCheckboxes, buildShareURL, buildEmbedSnippet
*/

function debounce(func, wait, immediate) {
    let timeout;
    return () => {
        const context = this,
            args = arguments;

        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function getCookie(cname) {
    // from W3Schools
    const name = `${cname}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];

        while (c.charAt(0) === " ") c = c.substring(1);

        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    // from W3Schools
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${cname}=${cvalue};${expires};path=/`;
}

function toggleSearch(on) {
    const displayValue = on ? "block" : "none";
    document.getElementById("searchcontainer").style.display = displayValue;
}

function toggleText(id, a, b) {
    const el = document.getElementById(id);

    const prevHTML = el.innerHTML;
    const updatedHTML = prevHTML.includes(a) ? prevHTML.replace(a, b) : prevHTML.replace(b, a);

    el.innerHTML = "";
    el.insertAdjacentHTML("afterbegin", updatedHTML);
}

function toggleExpandable(id, c) {
    const el = document.getElementById(id);
    el.className = el.className === `${c} open` ? c : `${c} open`;
}

function hideOnClickOutside(eles, other) {
    // if click not in id, hide
    const outsideClickListener = event => {
        const path =
            event.path ||
            (event.composedPath && event.composedPath()) ||
            event.composedPath(event.target);
        let ok = false;

        for (let i = 0; i < eles.length; i++) if (path.includes(eles[i])) ok = true;

        if (ok === false) {
            document.getElementById(other).style.display = "none";

            removeClickListener();
        }
    };

    const removeClickListener = () => {
        document.removeEventListener("click", outsideClickListener);
    };

    document.addEventListener("click", outsideClickListener);
}

/**
 * buildShareURL(id, options)
 * Construct a Music Blocks share URL for a given project id.
 *
 * @param {string} id - Project ID
 * @param {object} [options] - Optional flags
 * @param {boolean} [options.run]      - Append &run=True
 * @param {boolean} [options.show]     - Append &show=True
 * @param {boolean} [options.collapse] - Append &collapse=True
 * @returns {string} Full share URL
 */
function buildShareURL(id, options) {
    let url = `https://musicblocks.sugarlabs.org/index.html?id=${encodeURIComponent(id)}`;
    if (options) {
        if (options.run) url += "&run=True";
        if (options.show) url += "&show=True";
        if (options.collapse) url += "&collapse=True";
    }
    return url;
}

/**
 * isSafeMusicBlocksURL(url)
 * Validate that a URL is a safe https Music Blocks origin URL.
 * Rejects javascript:, data:, vbscript:, and any non-https schemes.
 *
 * @param {string} url
 * @returns {boolean}
 */
function isSafeMusicBlocksURL(url) {
    try {
        const parsed = new URL(url);
        return (
            parsed.protocol === "https:" &&
            parsed.hostname === "musicblocks.sugarlabs.org"
        );
    } catch (e) {
        return false;
    }
}

/**
 * buildEmbedSnippet(url, projectName)
 * Build an <iframe> embed snippet string for the given share URL.
 * Returns an empty string if the URL fails validation.
 *
 * @param {string} url         - A Music Blocks share URL
 * @param {string} [projectName] - Optional project name for the iframe title
 * @returns {string} Ready-to-paste iframe HTML, or "" if URL is unsafe
 */
function buildEmbedSnippet(url, projectName) {
    if (!isSafeMusicBlocksURL(url)) return "";
    const title = projectName
        ? `Music Blocks Project: ${projectName}`
        : "Music Blocks Project";
    return (
        `<iframe src="${url}" ` +
        `title="${title}" ` +
        `width="400" height="300" ` +
        `frameborder="0" ` +
        `allowfullscreen ` +
        `sandbox="allow-scripts allow-same-origin">` +
        `</iframe>`
    );
}

function updateCheckboxes(id) {
    const elements = document.getElementById(id).querySelectorAll("input:checked");
    const urlel = document.getElementById(id).querySelectorAll("input[type=text]")[0];
    let url = urlel.getAttribute("data-originalurl");

    for (let i = 0; i < elements.length; i++) url += `&${elements[i].name}=True`;

    urlel.value = url;

    // Sync social share buttons if present
    const projectId = id.replace("global-sharebox-", "");
    const shareboxEl = document.getElementById(id);
    const projectName = shareboxEl ? shareboxEl.getAttribute("data-projectname") || "" : "";
    const socialText = projectName
        ? `${_("Check out this Music Blocks project")} "${projectName}"!`
        : _("Check out this Music Blocks project!");

    const twitterBtn = document.getElementById(`global-share-twitter-${projectId}`);
    if (twitterBtn) {
        twitterBtn.href = `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(socialText)}`;
    }

    const whatsappBtn = document.getElementById(`global-share-whatsapp-${projectId}`);
    if (whatsappBtn) {
        whatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(`${socialText} ${url}`)}`;
    }

    // Sync embed snippet textarea and copy button
    const embedArea = document.getElementById(`global-embed-${projectId}`);
    if (embedArea) {
        embedArea.value = buildEmbedSnippet(url, projectName);
    }

    const embedCopyBtn = document.getElementById(`global-copy-embed-${projectId}`);
    if (embedCopyBtn) {
        embedCopyBtn.setAttribute("data-clipboard-text", buildEmbedSnippet(url, projectName));
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { buildShareURL, buildEmbedSnippet, isSafeMusicBlocksURL };
}

$(document).ready(() => {
    $("#publisher").modal();
    $("#deleter").modal();
    $("#projectviewer").modal();

    document.getElementById("global-search").addEventListener("input", evt => {
        document.getElementById("search-close").style.display =
            evt.target.value === "" ? "none" : "initial";
    });

    document.getElementById("local-tab").addEventListener("click", evt => {
        toggleSearch(false);
    });

    document.getElementById("global-tab").addEventListener("click", evt => {
        toggleSearch(true);
    });

    document.getElementById("view-more-chips").addEventListener("click", evt => {
        const showMore = _("Show more tags") + " ▼";
        const showLess = _("Show fewer tags") + " ▲";
        toggleExpandable("morechips", "flexchips");
        toggleText("view-more-chips", showMore, showLess);
    });
});
