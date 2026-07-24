/**
 * MusicBlocks v3.4.1
 *
 * @author Music Blocks Contributors
 *
 * @copyright 2026 Music Blocks Contributors
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

// Provide ErrorHandler global for tests
global.ErrorHandler = {
    capture: jest.fn(),
    warn: jest.fn(),
    recoverable: jest.fn(),
    userFacing: jest.fn()
};

// Mock HTMLCanvasElement.getContext to suppress jsdom warnings

const mockContext = {
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    closePath: jest.fn(),
    ellipse: jest.fn(),
    arc: jest.fn(),
    drawImage: jest.fn(),
    measureText: jest.fn(() => ({
        width: 0,
        actualBoundingBoxAscent: 0,
        actualBoundingBoxDescent: 0
    })),
    scale: jest.fn(),
    setTransform: jest.fn(),
    save: jest.fn(),
    restore: jest.fn()
};

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    writable: true,
    value: jest.fn(type => {
        // Return null for non-2d contexts
        if (type !== "2d") return null;

        return mockContext;
    })
});

// Minimal globals (ONLY safe defaults)
global.requestAnimationFrame = cb => setTimeout(cb, 0);
