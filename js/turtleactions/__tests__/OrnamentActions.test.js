/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 omsuneri
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

const setupOrnamentActions = require("../OrnamentActions");

describe("OrnamentActions", () => {
  let activity, turtle, dispatchCalls, listenerCalls, beginSlurCalls, endSlurCalls, mouseMB, listenerFunctions;

  beforeEach(() => {
    dispatchCalls = []; listenerCalls = []; beginSlurCalls = []; endSlurCalls = []; listenerFunctions = {}; mouseMB = { listeners: [] };
    global.Singer = { OrnamentActions: null };
    turtle = { singer: { staccato: [], justCounting: [], inNeighbor: [], neighborStepPitch: [], neighborNoteValue: [] } };
    activity = {
      turtles: { ithTurtle: () => turtle },
      blocks: { blockList: { 1: {}, 2: {} } },
      logo: {
        setDispatchBlock: (blk, idx, name) => dispatchCalls.push({ blk, turtleIndex: idx, listenerName: name }),
        setTurtleListener: (idx, name, fn) => { listenerCalls.push({ turtleIndex: idx, listenerName: name }); listenerFunctions[name] = fn; },
        notation: { notationBeginSlur: idx => beginSlurCalls.push(idx), notationEndSlur: idx => endSlurCalls.push(idx) }
      }
    };
    global.MusicBlocks = { isRun: true };
    global.Mouse = { getMouseFromTurtle: () => ({ MB: mouseMB }) };
    setupOrnamentActions(activity);
  });

  describe("setStaccato", () => {
    const scenarios = [
      { desc: "block defined", blk: 1, expectDispatch: true, expectMouseListener: false, isRun: true, nullMouse: false },
      { desc: "block undefined", blk: undefined, expectDispatch: false, expectMouseListener: true, isRun: true, nullMouse: false },
      { desc: "isRun false", blk: undefined, expectDispatch: false, expectMouseListener: false, isRun: false, nullMouse: false },
      { desc: "null mouse", blk: undefined, expectDispatch: false, expectMouseListener: false, isRun: true, nullMouse: true }
    ];

    scenarios.forEach(({ desc, blk, expectDispatch, expectMouseListener, isRun, nullMouse }) => {
      test(desc, () => {
        global.MusicBlocks.isRun = isRun;
        if (nullMouse) global.Mouse.getMouseFromTurtle = () => null;
        Singer.OrnamentActions.setStaccato(2, 0, blk);
        expect(turtle.singer.staccato).toEqual([0.5]);
        expect(dispatchCalls.length).toBe(expectDispatch ? 1 : 0);
        expect(listenerCalls.length).toBe(1);
        if (expectMouseListener) expect(mouseMB.listeners).toContain('_staccato_0'); else expect(mouseMB.listeners).not.toContain('_staccato_0');
        listenerFunctions['_staccato_0']();
        expect(turtle.singer.staccato).toEqual([]);
      });
    });
  });

  describe("setSlur", () => {
    const scenarios = [
      { desc: "block defined", blk: 1, expectDispatch: true, expectMouseListener: false, isRun: true, nullMouse: false, justCounting: false, expectBeginSlur: true },
      { desc: "block undefined", blk: undefined, expectDispatch: false, expectMouseListener: true, isRun: true, nullMouse: false, justCounting: false, expectBeginSlur: true },
      { desc: "isRun false", blk: undefined, expectDispatch: false, expectMouseListener: false, isRun: false, nullMouse: false, justCounting: false, expectBeginSlur: true },
      { desc: "null mouse", blk: undefined, expectDispatch: false, expectMouseListener: false, isRun: true, nullMouse: true, justCounting: false, expectBeginSlur: true },
      { desc: "justCounting", blk: 1, expectDispatch: true, expectMouseListener: false, isRun: true, nullMouse: false, justCounting: true, expectBeginSlur: false }
    ];

    scenarios.forEach(({ desc, blk, expectDispatch, expectMouseListener, isRun, nullMouse, justCounting, expectBeginSlur }) => {
      test(desc, () => {
        turtle.singer.justCounting = justCounting ? [1] : [];
        global.MusicBlocks.isRun = isRun;
        if (nullMouse) global.Mouse.getMouseFromTurtle = () => null;
        Singer.OrnamentActions.setSlur(2, 0, blk);
        expect(turtle.singer.staccato).toEqual([-0.5]);
        expect(beginSlurCalls.length).toBe(expectBeginSlur ? 1 : 0);
        expect(dispatchCalls.length).toBe(expectDispatch ? 1 : 0);
        expect(listenerCalls.length).toBe(1);
        if (expectMouseListener) expect(mouseMB.listeners).toContain('_staccato_0'); else expect(mouseMB.listeners).not.toContain('_staccato_0');
        listenerFunctions['_staccato_0']();
        expect(turtle.singer.staccato).toEqual([]);
        expect(endSlurCalls.length).toBe(expectBeginSlur ? 1 : 0);
      });
    });
  });

  describe("doNeighbor", () => {
    const scenarios = [
      { desc: "block defined", blk: 1, expectDispatch: true, expectMouseListener: false, isRun: true, nullMouse: false },
      { desc: "block undefined", blk: undefined, expectDispatch: false, expectMouseListener: true, isRun: true, nullMouse: false },
      { desc: "isRun false", blk: undefined, expectDispatch: false, expectMouseListener: false, isRun: false, nullMouse: false },
      { desc: "null mouse", blk: undefined, expectDispatch: false, expectMouseListener: false, isRun: true, nullMouse: true }
    ];

    scenarios.forEach(({ desc, blk, expectDispatch, expectMouseListener, isRun, nullMouse }) => {
      test(desc, () => {
        global.MusicBlocks.isRun = isRun;
        if (nullMouse) global.Mouse.getMouseFromTurtle = () => null;
        Singer.OrnamentActions.doNeighbor(3, 4, 0, blk);
        expect(turtle.singer.inNeighbor).toEqual([blk]);
        expect(turtle.singer.neighborStepPitch).toEqual([3]);
        expect(turtle.singer.neighborNoteValue).toEqual([4]);
        expect(dispatchCalls.length).toBe(expectDispatch ? 1 : 0);
        expect(listenerCalls.length).toBe(1);
        const name = `_neighbor_0_${blk}`;
        if (expectMouseListener) expect(mouseMB.listeners).toContain(name); else expect(mouseMB.listeners).not.toContain(name);
        listenerFunctions[name]();
        expect(turtle.singer.inNeighbor).toEqual([]);
        expect(turtle.singer.neighborStepPitch).toEqual([]);
        expect(turtle.singer.neighborNoteValue).toEqual([]);
      });
    });
  });
});