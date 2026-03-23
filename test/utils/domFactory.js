function createPaletteDOM() {
    const paletteElement = document.createElement("div");
    paletteElement.style.visibility = "visible";
    paletteElement.style.top = "100px";

    const paletteBody = document.createElement("div");
    const parent = document.createElement("div");
    parent.appendChild(paletteBody);

    return { paletteElement, paletteBody };
}

module.exports = { createPaletteDOM };
