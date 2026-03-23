function setupImageMock() {
    global.Image = function () {
        const img = document.createElement("img");

        img.width = 50;

        if (!img.setAttribute) {
            img.setAttribute = jest.fn();
        }

        if (!img.removeAttribute) {
            img.removeAttribute = jest.fn();
        }

        if (!img.style) {
            img.style = {};
        }

        return img;
    };
}

module.exports = { setupImageMock };
