/**
 * MusicBlocks v3.6.2
 *
 * @author Divyam Agarwal
 *
 * @copyright 2026 Divyam Agarwal
 *
 * @license
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

const Tempo = require("./tempo.js");

// --- 1. Global Mocks (Fake the Browser Environment) ---
global._ = msg => msg; // Mock translation function
global.getDrumSynthName = jest.fn();

// Mock the Window Manager
global.window = {
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            addButton: jest.fn().mockReturnValue({ onclick: () => {} }),
            addInputButton: jest.fn().mockImplementation(val => ({
                value: val,
                addEventListener: jest.fn()
            })),
            getWidgetBody: jest.fn().mockReturnValue({
                appendChild: jest.fn(),
                insertRow: jest.fn().mockReturnValue({
                    insertCell: jest.fn().mockReturnValue({
                        appendChild: jest.fn(),
                        setAttribute: jest.fn()
                    })
                })
            }),
            sendToCenter: jest.fn()
        })
    }
};

// Mock Document (for creating the canvas)
global.document = {
    createElement: jest.fn().mockReturnValue({
        style: {},
        getContext: jest.fn().mockReturnValue({
            clearRect: jest.fn(),
            beginPath: jest.fn(),
            fillStyle: "",
            ellipse: jest.fn(),
            fill: jest.fn(),
            closePath: jest.fn()
        })
    })
};

describe("Tempo Widget", () => {
    let tempoWidget;
    let mockActivity;

    beforeEach(() => {
        tempoWidget = new Tempo();

        // Mock the Music Blocks Activity object
        mockActivity = {
            logo: {
                synth: { loadSynth: jest.fn() },
                firstNoteTime: 1000
            },
            blocks: {
                blockList: {}, // Empty block list for now
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn(),
            saveLocally: jest.fn(),
            textMsg: jest.fn(),
            errorMsg: jest.fn() // This is what the code calls!
        };

        // --- FIX 1: Set the Global 'activity' variable ---
        // The widget code calls 'activity.errorMsg', relying on it being global.
        global.activity = mockActivity;

        // Manually setup initial state usually handled by init()
        tempoWidget.activity = mockActivity;
        tempoWidget.BPMs = [100]; // Start at 100 BPM
        tempoWidget.BPMInputs = [{ value: 100 }]; // Fake input element
        tempoWidget._intervals = [600];
        tempoWidget.BPMBlocks = [null];

        // --- FIX 2: Initialize 'isMoving' ---
        tempoWidget.isMoving = true;
    });

    test("should initialize with default values", () => {
        expect(tempoWidget.BPMs[0]).toBe(100);
        expect(tempoWidget.isMoving).toBe(true);
    });

    test("speedUp() should increase BPM by 10%", () => {
        // 100 + 10% = 110
        tempoWidget.speedUp(0);
        expect(tempoWidget.BPMs[0]).toBe(110);
        expect(tempoWidget.BPMInputs[0].value).toBe(110);
    });

    test("slowDown() should decrease BPM by 10%", () => {
        // 100 - 10% = 90
        tempoWidget.slowDown(0);
        expect(tempoWidget.BPMs[0]).toBe(90);
        expect(tempoWidget.BPMInputs[0].value).toBe(90);
    });

    test("should not exceed maximum BPM of 1000", () => {
        tempoWidget.BPMs[0] = 950;
        // 950 + 95 = 1045 -> Should clamp to 1000
        tempoWidget.speedUp(0);

        expect(tempoWidget.BPMs[0]).toBe(1000);
        expect(mockActivity.errorMsg).toHaveBeenCalled();
    });

    test("should not go below minimum BPM of 30", () => {
        tempoWidget.BPMs[0] = 32;
        // 32 - 3.2 = 28.8 -> Should clamp to 30
        tempoWidget.slowDown(0);

        expect(tempoWidget.BPMs[0]).toBe(30);
        expect(mockActivity.errorMsg).toHaveBeenCalled();
    });
});
