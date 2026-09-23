// Copyright (c) 2014-25 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   globals

   */

if (typeof module !== "undefined" && module.exports) {
    var UtilsLogic =
        (typeof window !== "undefined" && window.UtilsLogic) ||
        (typeof require !== "undefined" ? require("./utils-logic") : {});
    var { isUnsafeObjectKey } = UtilsLogic;
}

/**
 * Processes macro data, adds macros to the palette, and updates the macro dictionary.
 * @param {string} macroData - JSON-encoded dictionary containing macro data.
 * @param {object} palettes - The palettes object.
 * @param {object} blocks - The blocks object.
 * @param {object} macroDict - The macro dictionary to update.
 */
let processMacroData = (macroData, palettes, blocks, macroDict) => {
    // Macros are stored in a JSON-encoded dictionary.
    if (macroData !== undefined && macroData !== "{}") {
        try {
            const obj = JSON.parse(macroData);
            palettes.add("myblocks", "black", "#a0a0a0");

            for (const name of Object.keys(obj)) {
                if (isUnsafeObjectKey(name)) continue;
                // console.debug("adding " + name + " to macroDict");
                macroDict[name] = obj[name];
                blocks.addToMyPalette(name, macroDict[name]);
            }

            palettes.makePalettes(1);
        } catch (e) {
            console.debug(macroData);

            console.debug(e);
        }
    }
};

/**
 * Prepares macro exports by updating the macro dictionary with the provided macro information.
 * @param {string|null} name - The name of the macro.
 * @param {object} stack - The stack information of the macro.
 * @param {object} macroDict - The macro dictionary to update.
 * @returns {string} The JSON-encoded text of the updated macro dictionary.
 */
let prepareMacroExports = (name, stack, macroDict) => {
    if (name !== null) {
        macroDict[name] = stack;
    }

    return JSON.stringify(macroDict);
};

if (typeof window !== "undefined" && (typeof module === "undefined" || !module.exports)) {
    window.MacroUtils = {
        processMacroData,
        prepareMacroExports
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        processMacroData,
        prepareMacroExports
    };
}
