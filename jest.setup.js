/**
 * Global Jest setup for Music Blocks.
 * This file contains global mocks and configurations for the test environment.
 * Issue: https://github.com/sugarlabs/musicblocks/issues/5972
 */

const originalGetContext = HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.getContext = function (type) {
    // Return null for non-"2d" context types as per spec
    if (type !== "2d") {
        return originalGetContext ? originalGetContext.apply(this, arguments) : null;
    }

    // Guard: avoid overriding if a real implementation is already present
    // jsdom stub usually contains 'Not implemented' or returns null
    const isStub = !originalGetContext || originalGetContext.toString().includes("Not implemented");
    if (!isStub) {
        return originalGetContext.apply(this, arguments);
    }

    return {
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
        canvas: this, // Use actual element reference instead of hardcoded dimensions
    };
};
