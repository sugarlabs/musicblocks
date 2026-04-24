/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks contributors
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

const EventManager = require("../EventManager");

describe("EventManager", () => {
    let eventManager;
    let target;
    let listener;

    beforeEach(() => {
        eventManager = new EventManager();
        target = document.createElement("div");
        listener = jest.fn();
    });

    test("tracks listeners when added", () => {
        eventManager.addEventListener(target, "click", listener);

        expect(eventManager.listeners).toHaveLength(1);
        expect(eventManager.listeners[0]).toEqual(
            expect.objectContaining({
                target,
                type: "click",
                listener
            })
        );
    });

    test("removes listeners from tracking when removed", () => {
        eventManager.addEventListener(target, "click", listener);
        eventManager.removeEventListener(target, "click", listener);

        expect(eventManager.listeners).toHaveLength(0);
    });

    test("matches equivalent capture options during removal", () => {
        eventManager.addEventListener(target, "click", listener, true);
        eventManager.removeEventListener(target, "click", listener, { capture: true });

        expect(eventManager.listeners).toHaveLength(0);
    });

    test("cleans up all tracked listeners", () => {
        eventManager.addEventListener(target, "click", listener);

        eventManager.cleanup();

        expect(eventManager.listeners).toHaveLength(0);
    });
});
