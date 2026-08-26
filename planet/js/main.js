/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2018 Euan Ong
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
   global

   Planet
*/

window.p;
window.makePlanet = async (isMusicBlocks, storage, translationFunction) => {
    window._ = translationFunction;
    window.p = new Planet(isMusicBlocks, storage);
    await window.p.init();
};

/**
 * Listens for structured messages from the parent window.
 *
 * This replaces direct window.parent.* access so that the Planet iframe
 * does not need direct references to parent internals. The parent pushes
 * data to the iframe; the iframe never reaches up.
 *
 * Accepted message types:
 *   MB_PLATFORM_COLOR   — theme colors for UI consistency
 *   MB_BLOCK_NAMES      — proto-name to display-name map for search keywords
 *   MB_APPLY_THEME      — CSS class name to apply/toggle on <body>
 */
window.addEventListener("message", event => {
    if (event.source !== window.parent) return;

    const msg = event.data;
    if (!msg || typeof msg.type !== "string") return;

    switch (msg.type) {
        case "MB_PLATFORM_COLOR":
            if (msg.payload && typeof msg.payload === "object") {
                window._mbPlatformColor = msg.payload;
            }
            break;

        case "MB_BLOCK_NAMES":
            if (msg.payload && typeof msg.payload === "object") {
                window._mbBlockDisplayNames = msg.payload;
            }
            break;

        case "MB_APPLY_THEME":
            if (msg.payload && typeof msg.payload === "object") {
                const { add, remove } = msg.payload;
                if (Array.isArray(remove)) {
                    remove.forEach(cls => document.body.classList.remove(cls));
                }
                if (Array.isArray(add)) {
                    add.forEach(cls => document.body.classList.add(cls));
                }
            }
            break;
    }
});
