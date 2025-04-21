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
        // Setup test data and state tracking variables
        dispatchCalls = [];
        listenerCalls = [];
        beginSlurCalls = [];
        endSlurCalls = [];
        listenerFunctions = {};
        mouseMB = { listeners: [] };
        
        global.Singer = { OrnamentActions: null };

        turtle = {
            singer: {
                staccato: [],
                justCounting: [],
                inNeighbor: [],
                neighborStepPitch: [],
                neighborNoteValue: [],
            }
        };

        activity = {
            turtles: {
                ithTurtle: function(index) {
                    return turtle;
                }
            },
            blocks: {
                blockList: { 1: {}, 2: {} }
            },
            logo: {
                setDispatchBlock: function(blk, turtleIndex, listenerName) {
                    dispatchCalls.push({ blk, turtleIndex, listenerName });
                },
                setTurtleListener: function(turtleIndex, listenerName, listener) {
                    listenerCalls.push({ turtleIndex, listenerName });
                    listenerFunctions[listenerName] = listener;
                },
                notation: {
                    notationBeginSlur: function(turtleIndex) {
                        beginSlurCalls.push(turtleIndex);
                    },
                    notationEndSlur: function(turtleIndex) {
                        endSlurCalls.push(turtleIndex);
                    }
                }
            }
        };

        global.MusicBlocks = { isRun: true };
        global.Mouse = {
            getMouseFromTurtle: function(t) {
                return { MB: mouseMB };
            }
        };
        
        setupOrnamentActions(activity);
    });

    // Test setStaccato method
    test("setStaccato with block defined", () => {
        // Call the method
        Singer.OrnamentActions.setStaccato(2, 0, 1);
        
        // Verify state
        expect(turtle.singer.staccato).toEqual([0.5]);
        expect(dispatchCalls).toEqual([{ blk: 1, turtleIndex: 0, listenerName: "_staccato_0" }]);
        expect(listenerCalls).toEqual([{ turtleIndex: 0, listenerName: "_staccato_0" }]);
        
        // Call the listener function to test it
        const listener = listenerFunctions["_staccato_0"];
        listener();
        
        // Verify updated state
        expect(turtle.singer.staccato).toEqual([]);
    });
    
    test("setStaccato with block undefined and MusicBlocks.isRun true", () => {
        // Call the method
        Singer.OrnamentActions.setStaccato(2, 0, undefined);
        
        // Verify state
        expect(turtle.singer.staccato).toEqual([0.5]);
        expect(dispatchCalls).toEqual([]);
        expect(listenerCalls).toEqual([{ turtleIndex: 0, listenerName: "_staccato_0" }]);
        expect(mouseMB.listeners).toContain("_staccato_0");
        
        // Call the listener function to test it
        const listener = listenerFunctions["_staccato_0"];
        listener();
        
        // Verify updated state
        expect(turtle.singer.staccato).toEqual([]);
    });
    
    test("setStaccato with null mouse", () => {
        // Setup Mouse object to return null
        const originalGetMouse = global.Mouse.getMouseFromTurtle;
        global.Mouse.getMouseFromTurtle = function() { return null; };
        
        // Call the method
        Singer.OrnamentActions.setStaccato(2, 0, undefined);
        
        // Verify state
        expect(turtle.singer.staccato).toEqual([0.5]);
        expect(dispatchCalls).toEqual([]);
        expect(listenerCalls).toEqual([{ turtleIndex: 0, listenerName: "_staccato_0" }]);
        
        // Call the listener function to test it
        const listener = listenerFunctions["_staccato_0"];
        listener();
        
        // Verify updated state
        expect(turtle.singer.staccato).toEqual([]);
        
        // Restore original function
        global.Mouse.getMouseFromTurtle = originalGetMouse;
    });

    // Test setSlur method
    test("setSlur with block defined", () => {
        // Call the method
        Singer.OrnamentActions.setSlur(2, 0, 1);
        
        // Verify state
        expect(turtle.singer.staccato).toEqual([-0.5]);
        expect(beginSlurCalls).toEqual([0]);
        expect(dispatchCalls).toEqual([{ blk: 1, turtleIndex: 0, listenerName: "_staccato_0" }]);
        expect(listenerCalls).toEqual([{ turtleIndex: 0, listenerName: "_staccato_0" }]);
        
        // Call the listener function to test it
        const listener = listenerFunctions["_staccato_0"];
        listener();
        
        // Verify updated state
        expect(turtle.singer.staccato).toEqual([]);
        expect(endSlurCalls).toEqual([0]);
    });
    
    test("setSlur with block undefined and MusicBlocks.isRun true", () => {
        // Call the method
        Singer.OrnamentActions.setSlur(2, 0, undefined);
        
        // Verify state
        expect(turtle.singer.staccato).toEqual([-0.5]);
        expect(beginSlurCalls).toEqual([0]);
        expect(dispatchCalls).toEqual([]);
        expect(listenerCalls).toEqual([{ turtleIndex: 0, listenerName: "_staccato_0" }]);
        expect(mouseMB.listeners).toContain("_staccato_0");
        
        // Call the listener function to test it
        const listener = listenerFunctions["_staccato_0"];
        listener();
        
        // Verify updated state
        expect(turtle.singer.staccato).toEqual([]);
        expect(endSlurCalls).toEqual([0]);
    });
    
    test("setSlur with null mouse", () => {
        // Setup Mouse object to return null
        const originalGetMouse = global.Mouse.getMouseFromTurtle;
        global.Mouse.getMouseFromTurtle = function() { return null; };
        
        // Call the method
        Singer.OrnamentActions.setSlur(2, 0, undefined);
        
        // Verify state
        expect(turtle.singer.staccato).toEqual([-0.5]);
        expect(beginSlurCalls).toEqual([0]);
        expect(dispatchCalls).toEqual([]);
        expect(listenerCalls).toEqual([{ turtleIndex: 0, listenerName: "_staccato_0" }]);
        
        // Call the listener function to test it
        const listener = listenerFunctions["_staccato_0"];
        listener();
        
        // Verify updated state
        expect(turtle.singer.staccato).toEqual([]);
        expect(endSlurCalls).toEqual([0]);
        
        // Restore original function
        global.Mouse.getMouseFromTurtle = originalGetMouse;
    });
    
    test("setSlur with justCounting not empty", () => {
        // Setup justCounting
        turtle.singer.justCounting = [1];
        
        // Call the method
        Singer.OrnamentActions.setSlur(2, 0, 1);
        
        // Verify state
        expect(turtle.singer.staccato).toEqual([-0.5]);
        expect(beginSlurCalls).toEqual([]);
        expect(dispatchCalls).toEqual([{ blk: 1, turtleIndex: 0, listenerName: "_staccato_0" }]);
        expect(listenerCalls).toEqual([{ turtleIndex: 0, listenerName: "_staccato_0" }]);
        
        // Call the listener function to test it
        const listener = listenerFunctions["_staccato_0"];
        listener();
        
        // Verify updated state
        expect(turtle.singer.staccato).toEqual([]);
        expect(endSlurCalls).toEqual([]);
    });

    // Test doNeighbor method
    test("doNeighbor with block defined", () => {
        // Call the method
        Singer.OrnamentActions.doNeighbor(3, 4, 0, 1);
        
        // Verify state
        expect(turtle.singer.inNeighbor).toEqual([1]);
        expect(turtle.singer.neighborStepPitch).toEqual([3]);
        expect(turtle.singer.neighborNoteValue).toEqual([4]);
        expect(dispatchCalls).toEqual([{ blk: 1, turtleIndex: 0, listenerName: "_neighbor_0_1" }]);
        expect(listenerCalls).toEqual([{ turtleIndex: 0, listenerName: "_neighbor_0_1" }]);
        
        // Call the listener function to test it
        const listener = listenerFunctions["_neighbor_0_1"];
        listener();
        
        // Verify updated state
        expect(turtle.singer.inNeighbor).toEqual([]);
        expect(turtle.singer.neighborStepPitch).toEqual([]);
        expect(turtle.singer.neighborNoteValue).toEqual([]);
    });
    
    test("doNeighbor with block undefined and MusicBlocks.isRun true", () => {
        // Call the method
        Singer.OrnamentActions.doNeighbor(3, 4, 0, undefined);
        
        // Verify state
        expect(turtle.singer.inNeighbor).toEqual([undefined]);
        expect(turtle.singer.neighborStepPitch).toEqual([3]);
        expect(turtle.singer.neighborNoteValue).toEqual([4]);
        expect(dispatchCalls).toEqual([]);
        expect(listenerCalls).toEqual([{ turtleIndex: 0, listenerName: "_neighbor_0_undefined" }]);
        expect(mouseMB.listeners).toContain("_neighbor_0_undefined");
        
        // Call the listener function to test it
        const listener = listenerFunctions["_neighbor_0_undefined"];
        listener();
        
        // Verify updated state
        expect(turtle.singer.inNeighbor).toEqual([]);
        expect(turtle.singer.neighborStepPitch).toEqual([]);
        expect(turtle.singer.neighborNoteValue).toEqual([]);
    });
    
    test("doNeighbor with null mouse", () => {
        // Setup Mouse object to return null
        const originalGetMouse = global.Mouse.getMouseFromTurtle;
        global.Mouse.getMouseFromTurtle = function() { return null; };
        
        // Call the method
        Singer.OrnamentActions.doNeighbor(3, 4, 0, undefined);
        
        // Verify state
        expect(turtle.singer.inNeighbor).toEqual([undefined]);
        expect(turtle.singer.neighborStepPitch).toEqual([3]);
        expect(turtle.singer.neighborNoteValue).toEqual([4]);
        expect(dispatchCalls).toEqual([]);
        expect(listenerCalls).toEqual([{ turtleIndex: 0, listenerName: "_neighbor_0_undefined" }]);
        
        // Call the listener function to test it
        const listener = listenerFunctions["_neighbor_0_undefined"];
        listener();
        
        // Verify updated state
        expect(turtle.singer.inNeighbor).toEqual([]);
        expect(turtle.singer.neighborStepPitch).toEqual([]);
        expect(turtle.singer.neighborNoteValue).toEqual([]);
        
        // Restore original function
        global.Mouse.getMouseFromTurtle = originalGetMouse;
    });
});
