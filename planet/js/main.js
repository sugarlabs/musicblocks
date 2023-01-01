/*
   global

   Planet
*/

window.p;
window.makePlanet = async function(isMusicBlocks,storage,translationFunction) {
    window._=translationFunction;
    window.p = new Planet(isMusicBlocks,storage);
    await window.p.init();
};
