/*
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/*
   global browser, chrome
 */

if (navigator.userAgent.search("Firefox") !== -1) {
    // eslint-disable-next-line no-unused-vars
    browser.browserAction.onClicked.addListener((tab) => {
        browser.tabs.create({ url: "index.html" });
    });

    // eslint-disable-next-line no-unused-vars
    browser.runtime.onInstalled.addListener((details) => {
        browser.tabs.create({ url: "index.html" });
    });
} else {
    // eslint-disable-next-line no-unused-vars
    chrome.browserAction.onClicked.addListener((tab) => {
        window.open(chrome.runtime.getURL("index.html"));
    });

    // eslint-disable-next-line no-unused-vars
    chrome.runtime.onInstalled.addListener((details) => {
        window.open(chrome.runtime.getURL("index.html"));
    });
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isFirefox: navigator.userAgent.search("Firefox") !== -1,
        browserAction: navigator.userAgent.search("Firefox") !== -1 ? browser.browserAction : chrome.browserAction,
    };
}
