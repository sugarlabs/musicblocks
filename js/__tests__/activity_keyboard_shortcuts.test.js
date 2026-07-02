/**
 * @license
 * MusicBlocks v3.6.2
 *
 * @copyright 2026 Music Blocks Contributors
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

/**
 * Regression test for sugarlabs/musicblocks#4788.
 *
 * Background — the bug the user reported was "typing into the Width block's
 * value bar duplicates blocks". Mechanically, the canvas-dimension blocks
 * (width, height, rightpos, leftpos, toppos, bottompos) display their value
 * via the popup `printText` bar, and that bar visually resembles a text
 * input. Users tried to type into it. With no input focused, those
 * keystrokes reached the document-level `__keyPressed` handler in
 * activity.js, which used to map the lowercase letters d/r/m/f/s/l/t (and
 * their Shift+ variants) to "create a solfege note block at octave 4 (or
 * 5)". Each letter typed produced a fresh `do`/`re`/`mi`/… block on the
 * workspace.
 *
 * Two PRs jointly resolved this:
 *   - #4931 / fd18c0d12 — added the value-bar visibility guard:
 *         if (this.printText && this.printText.classList.contains("show"))
 *             return;
 *     and a label prefix ("width: 1536") so the bar reads as a label.
 *   - #5228 / ebef222b1 — removed the d/r/m/f/s/l/t -> __makeNewNote
 *     shortcuts entirely, since spam-creation in classrooms was the
 *     dominant complaint.
 *
 * Neither fix has a test. This file pins both contracts by reading
 * js/activity.js as text and asserting the structural invariants. If a
 * future change re-introduces the solfege shortcuts or removes the guard,
 * these assertions fail before the regression reaches users.
 */

const fs = require("fs");
const path = require("path");

const ACTIVITY_JS = path.join(__dirname, "..", "activity.js");

describe("activity.js keyboard-shortcut regression guards (fixes #4788)", () => {
    let source;

    beforeAll(() => {
        source = fs.readFileSync(ACTIVITY_JS, "utf8");
    });

    test("does not invoke __makeNewNote — solfege-key block creation was removed by #5228", () => {
        // The dropped shortcuts called this method to spawn solfege blocks.
        // Any call site means a regression toward the original bug.
        expect(source).not.toMatch(/__makeNewNote\s*\(/);
    });

    test("does not declare KEYCODE_D/R/M/F/S/L/T constants from the removed shortcut block", () => {
        // These constants only existed to switch on solfege letters.
        // The arrow-key constants (KEYCODE_LEFT/RIGHT/UP/DOWN) are unrelated
        // and must remain — assert each removed one individually so a future
        // diff that re-introduces just one is still caught.
        const removed = [
            "KEYCODE_D",
            "KEYCODE_R",
            "KEYCODE_M",
            "KEYCODE_F",
            "KEYCODE_S",
            "KEYCODE_L",
            "KEYCODE_T"
        ];
        for (const name of removed) {
            const declRe = new RegExp(`\\bconst\\s+${name}\\b`);
            const caseRe = new RegExp(`case\\s+${name}\\b`);
            expect(source).not.toMatch(declRe);
            expect(source).not.toMatch(caseRe);
        }
    });

    test("preserves the printText.show guard so hotkeys are skipped while the value bar is visible", () => {
        // The guard suppresses the global hotkey handler whenever the popup
        // value bar (printText) is showing. It's the second line of defence:
        // even with the solfege shortcuts gone, any future hotkey added to
        // __keyPressed must respect this guard.
        const guardRe =
            /this\.printText\s*&&\s*this\.printText\.classList\.contains\(\s*["']show["']\s*\)/;
        expect(source).toMatch(guardRe);
    });

    test("the printText.show guard returns before reaching the hotkey switch", () => {
        // Locate the guard and the first switch on event.keyCode that the
        // guard is meant to short-circuit. The guard's `return` must come
        // before any keyCode dispatch in the file, otherwise it can't
        // actually suppress hotkeys.
        const guardIdx = source.search(
            /this\.printText\.classList\.contains\(\s*["']show["']\s*\)/
        );
        const switchIdx = source.search(/switch\s*\(\s*event\.keyCode\s*\)/);
        expect(guardIdx).toBeGreaterThan(-1);
        expect(switchIdx).toBeGreaterThan(-1);
        expect(guardIdx).toBeLessThan(switchIdx);
    });
});
