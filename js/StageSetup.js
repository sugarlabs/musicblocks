// Copyright (c) 2026 Music Blocks contributors
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
   global createjs, Trashcan, Turtles, Boundary, Blocks, Palettes, Logo,
   PasteBox, LanguageBox, ThemeBox
*/

/**
 * Sets up the Activity stage, containers, and core workspace subsystems.
 *
 * @param {Activity} activity - The owning Activity instance.
 * @param {Object} [dependencies] - Optional constructor overrides for tests.
 * @returns {void}
 */
function setupStage(activity, dependencies) {
    const deps = dependencies || {};
    const createjsRef = deps.createjsRef || createjs;
    const TrashcanClass = deps.TrashcanClass || Trashcan;
    const TurtlesClass = deps.TurtlesClass || Turtles;
    const BoundaryClass = deps.BoundaryClass || Boundary;
    const BlocksClass = deps.BlocksClass || Blocks;
    const PalettesClass = deps.PalettesClass || Palettes;
    const LogoClass = deps.LogoClass || Logo;
    const PasteBoxClass = deps.PasteBoxClass || PasteBox;
    const LanguageBoxClass = deps.LanguageBoxClass || LanguageBox;
    const ThemeBoxClass = deps.ThemeBoxClass || ThemeBox;

    activity.stage = new createjsRef.Stage(activity.canvas);
    createjsRef.Touch.enable(activity.stage);
    activity._startRenderLoop();

    createjsRef.Ticker.framerate = 60;
    activity._initIdleWatcher();

    let mouseEvents = 0;
    activity.handleMouseMove = () => {
        mouseEvents++;
        if (mouseEvents % 4 === 0) {
            activity.__tick();
        }
    };

    activity.handleDocumentClick = e => {
        if (!activity.hasMouseMoved) {
            if (activity.selectionModeOn) {
                activity.deselectSelectedBlocks();
            } else {
                activity._hideHelpfulSearchWidget(e);
            }
        }
    };

    activity.addEventListener(document, "mousemove", activity.handleMouseMove);
    activity.addEventListener(document, "click", activity.handleDocumentClick);
    activity.addEventListener(window, "beforeunload", () => {
        activity._stopRenderLoop();
        if (activity._autoSaveInterval !== null) {
            clearInterval(activity._autoSaveInterval);
            activity._autoSaveInterval = null;
        }
    });

    activity._createMsgContainer(
        "#ffffff",
        "#7a7a7a",
        text => {
            activity.msgText = text;
        },
        130
    );

    activity._createMsgContainer(
        "#ffcbc4",
        "#ff0031",
        text => {
            activity.errorMsgText = text;
        },
        130
    );

    activity._createErrorContainers();

    activity.blocksContainer = new createjsRef.Container();
    activity.trashContainer = new createjsRef.Container();
    activity.turtleContainer = new createjsRef.Container();
    activity.stage.addChild(activity.turtleContainer);
    activity.stage.addChild(activity.trashContainer);
    activity.stage.addChild(activity.blocksContainer);
    activity._setupBlocksContainerEvents();

    activity.trashcan = new TrashcanClass(activity);
    activity.turtles = new TurtlesClass(activity);
    activity.boundary = new BoundaryClass(activity.blocksContainer);
    activity.blocks = new BlocksClass(activity);
    activity.palettes = new PalettesClass(activity);
    activity.palettes.init();
    activity.logo = new LogoClass(activity);

    activity.pasteBox = new PasteBoxClass(activity);
    activity.languageBox = new LanguageBoxClass(activity);
    activity.themeBox = new ThemeBoxClass(activity);
    if (activity.themeBox && typeof activity.themeBox.initializeTheme === "function") {
        activity.themeBox.initializeTheme();
    }
}

if (typeof globalThis !== "undefined") {
    globalThis.setupStage = setupStage;
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return setupStage;
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = setupStage;
}
