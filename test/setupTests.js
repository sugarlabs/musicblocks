afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    rect: jest.fn(),
    getImageData: jest.fn(() => ({ data: [] })),
    putImageData: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    closePath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    clearRect: jest.fn(),
    canvas: { width: 800, height: 600 }
}));

// Minimal globals (ONLY safe defaults)
global.requestAnimationFrame = cb => setTimeout(cb, 0);
