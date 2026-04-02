function setupImageMock() {
    global.Image = function () {
        const img = document.createElement("img");
        img.width = 50;
        return img;
    };
}

module.exports = { setupImageMock };
