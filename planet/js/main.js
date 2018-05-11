window.p;

function _(text) {
    return text;
};

window.makePlanet = function(isMusicBlocks,storage) {
    window.p = new Planet(isMusicBlocks,storage);
    window.p.init();
};
