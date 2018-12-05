window.p;

window.makePlanet = function(isMusicBlocks,storage,translationFunction) {
    window._=translationFunction;
    window.p = new Planet(isMusicBlocks,storage);
    window.p.init();
};
