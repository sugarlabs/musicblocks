function createMockDOM() {
    const container = document.createElement("div");
    container.style.visibility = "visible";
    container.style.top = "100px";

    const body = document.createElement("div");
    const parent = document.createElement("div");
    parent.appendChild(body);

    return { container, body };
}

module.exports = { createMockDOM };
