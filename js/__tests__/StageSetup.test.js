/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const setupStage = require("../StageSetup");

describe("setupStage", () => {
    let activity;
    let stageAddChild;
    let StageClass;
    let ContainerClass;

    beforeEach(() => {
        stageAddChild = jest.fn();
        StageClass = jest.fn(() => ({
            addChild: stageAddChild
        }));
        ContainerClass = jest.fn(() => ({}));

        activity = {
            canvas: {},
            hasMouseMoved: false,
            selectionModeOn: false,
            _autoSaveInterval: null,
            addEventListener: jest.fn(),
            _startRenderLoop: jest.fn(),
            _initIdleWatcher: jest.fn(),
            __tick: jest.fn(),
            deselectSelectedBlocks: jest.fn(),
            _hideHelpfulSearchWidget: jest.fn(),
            _stopRenderLoop: jest.fn(),
            _createMsgContainer: jest.fn(),
            _createErrorContainers: jest.fn(),
            _setupBlocksContainerEvents: jest.fn()
        };
    });

    test("creates stage containers and initializes core workspace subsystems", () => {
        const Touch = { enable: jest.fn() };
        const Ticker = {};
        const TrashcanClass = jest.fn();
        const TurtlesClass = jest.fn();
        const BoundaryClass = jest.fn();
        const BlocksClass = jest.fn();
        const PalettesClass = jest.fn(() => ({
            init: jest.fn()
        }));
        const LogoClass = jest.fn();
        const PasteBoxClass = jest.fn();
        const LanguageBoxClass = jest.fn();
        const initializeTheme = jest.fn();
        const ThemeBoxClass = jest.fn(() => ({
            initializeTheme
        }));

        setupStage(activity, {
            createjsRef: {
                Stage: StageClass,
                Container: ContainerClass,
                Touch,
                Ticker
            },
            TrashcanClass,
            TurtlesClass,
            BoundaryClass,
            BlocksClass,
            PalettesClass,
            LogoClass,
            PasteBoxClass,
            LanguageBoxClass,
            ThemeBoxClass
        });

        expect(StageClass).toHaveBeenCalledWith(activity.canvas);
        expect(Touch.enable).toHaveBeenCalledWith(activity.stage);
        expect(activity._startRenderLoop).toHaveBeenCalled();
        expect(activity._initIdleWatcher).toHaveBeenCalled();
        expect(Ticker.framerate).toBe(60);
        expect(stageAddChild).toHaveBeenCalledTimes(3);
        expect(activity._setupBlocksContainerEvents).toHaveBeenCalled();
        expect(TrashcanClass).toHaveBeenCalledWith(activity);
        expect(TurtlesClass).toHaveBeenCalledWith(activity);
        expect(BoundaryClass).toHaveBeenCalledWith(activity.blocksContainer);
        expect(BlocksClass).toHaveBeenCalledWith(activity);
        expect(PalettesClass).toHaveBeenCalledWith(activity);
        expect(activity.palettes.init).toHaveBeenCalled();
        expect(LogoClass).toHaveBeenCalledWith(activity);
        expect(PasteBoxClass).toHaveBeenCalledWith(activity);
        expect(LanguageBoxClass).toHaveBeenCalledWith(activity);
        expect(ThemeBoxClass).toHaveBeenCalledWith(activity);
        expect(initializeTheme).toHaveBeenCalled();
        expect(activity._createMsgContainer).toHaveBeenCalledTimes(2);
        expect(activity._createErrorContainers).toHaveBeenCalled();
    });

    test("registers the shared stage event handlers", () => {
        setupStage(activity, {
            createjsRef: {
                Stage: StageClass,
                Container: ContainerClass,
                Touch: { enable: jest.fn() },
                Ticker: {}
            },
            TrashcanClass: jest.fn(),
            TurtlesClass: jest.fn(),
            BoundaryClass: jest.fn(),
            BlocksClass: jest.fn(),
            PalettesClass: jest.fn(() => ({
                init: jest.fn()
            })),
            LogoClass: jest.fn(),
            PasteBoxClass: jest.fn(),
            LanguageBoxClass: jest.fn(),
            ThemeBoxClass: jest.fn(() => ({}))
        });

        expect(activity.addEventListener).toHaveBeenCalledTimes(3);
        expect(typeof activity.handleMouseMove).toBe("function");
        expect(typeof activity.handleDocumentClick).toBe("function");
    });
});
