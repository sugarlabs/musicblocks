/**
 * @license
 * MusicBlocks v3.4.1
 */

/*
   global
   Planet
*/

window.p;
window.makePlanet = async (isMusicBlocks, storage, translationFunction) => {
    // FIX: Define toTitleCase globally before Planet initializes
    window.toTitleCase = (str) => {
        if (!str) return "";
        return str.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
    };

    window._ = translationFunction;
    window.p = new Planet(isMusicBlocks, storage);
    await window.p.init();
};