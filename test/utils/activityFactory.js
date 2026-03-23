function createMockActivity(overrides = {}) {
    return {
        cellSize: 50,
        blocks: {
            protoBlockDict: {},
            makeBlock: jest.fn(() => ({}))
        },
        hideSearchWidget: jest.fn(),
        showSearchWidget: jest.fn(),
        palettes: {},
        beginnerMode: false,
        ...overrides
    };
}

module.exports = { createMockActivity };
