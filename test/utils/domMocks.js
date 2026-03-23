function mockDocById(map = {}) {
    global.docById = jest.fn(id => {
        if (map[id]) {
            const el = map[id];
            if (!el.parentNode) {
                const parent = document.createElement("div");
                parent.appendChild(el);
            }
            return el;
        }

        const el = document.createElement("div");
        const parent = document.createElement("div");
        parent.appendChild(el);

        return el;
    });
}

module.exports = { mockDocById };
