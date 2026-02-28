/**
 * Global Jest setup for Music Blocks.
 * This file contains global mocks and configurations for the test environment.
 * Issue: https://github.com/sugarlabs/musicblocks/issues/5972
 */

// Mock HTMLCanvasElement.prototype.getContext to improve test stability and
// reduce console noise from jsdom not implementing canvas rendering.
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
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
        actualBoundingBoxDescent: 0,
    })),
    scale: jest.fn(),
    setTransform: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    font: "10px sans-serif",
    canvas: {
        width: 800,
        height: 600,
    },
}));
