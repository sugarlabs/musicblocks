afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

// Minimal globals (ONLY safe defaults)
global.requestAnimationFrame = cb => setTimeout(cb, 0);
