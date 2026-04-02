class MockSVG {
    constructor() {
        this.docks = [];
    }
    setScale() {}
    setExpand() {}
    setOutie() {}
    basicBox() {
        return "fill_color stroke_color block_label arg_label_0";
    }
    basicBlock() {
        return "fill_color stroke_color block_label";
    }
    getHeight() {
        return 12;
    }
}

function setupSVGMock() {
    global.SVG = MockSVG;
}

module.exports = { setupSVGMock };
