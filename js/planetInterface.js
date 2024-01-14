// Copyright (c) 2021 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
//
// Note: This code is inspired by the Python Turtle Blocks project
// (https://github.com/walterbender/turtleart), but implemented from
// scratch. -- Walter Bender, October 2014.

/*
   globals _, docById, platformColor, doSVG, createjs, _THIS_IS_MUSIC_BLOCKS_
 */

/*
   exported PlanetInterface
 */

class PlanetInterface {
    constructor(activity) {
        this.planet = null;
        this.iframe = null;
        this.mainCanvas = null;
        this.activity = activity;

        this.hideMusicBlocks = () => {
            this.activity.hideSearchWidget();
            window.widgetWindows.hideAllWindows();

            this.activity.logo.doStopTurtles();
            docById("helpElem").style.visibility = "hidden";
            document.querySelector(".canvasHolder").classList.add("hide");
            document.querySelector("#canvas").style.display = "none";
            document.querySelector("#theme-color").content = "#8bc34a";
            const that = this;
            setTimeout(() => {
                // Time to release the mouse
                that.activity.stage.enableDOMEvents(false);
            }, 250);
            window.scroll(0, 0);
        };

        this.showMusicBlocks = () => {
            document.title = this.activity.planet.getCurrentProjectName();
            document.getElementById("toolbars").style.display = "block";
            document.getElementById("palette").style.display = "block";

            this.activity.prepSearchWidget();
            window.widgetWindows.showWindows();

            document.querySelector(".canvasHolder").classList.remove("hide");
            document.querySelector("#canvas").style.display = "";
            document.querySelector("#theme-color").content = platformColor.header;
            this.activity.stage.enableDOMEvents(true);
            window.scroll(0, 0);
            docById("buttoncontainerBOTTOM").style.display = "block";
            docById("buttoncontainerTOP").style.display = "block";
        };

        this.showPlanet = () => {
            const png = docById("overlayCanvas").toDataURL("image/png");
            this.planet.open(png);  // this.mainCanvas.toDataURL("image/png"));
            this.iframe.style.display = "block";
            this.iframe.style.zIndex = "9999" ;
            try {
                this.iframe.contentWindow.document.getElementById("local-tab").click();
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
            }
        };

        this.hidePlanet = () => {
            this.iframe.style.display = "none";
        };

        this.openPlanet = () => {
            this.saveLocally();
            this.hideMusicBlocks();
            this.showPlanet();
        };

        this.closePlanet = () => {
            this.hidePlanet();
            this.showMusicBlocks();
        };

        this.loadProjectFromData = (data, merge) => {
            if (merge === undefined) {
                merge = false;
            }

            this.closePlanet();
            if (!merge) {
                this.activity.sendAllToTrash(false, true);
            }

            if (data === undefined) {
                this.errorMsg(_("project undefined"));
                return;
            }
            this.activity.textMsg(this.getCurrentProjectName());
            this.activity.loading = true;
            document.body.style.cursor = "wait";
            this.activity.doLoadAnimation();
            this.activity._allClear(false);

            // First, hide the palettes as they will need updating.
            this.activity.blocks.palettes._hideMenus(true);

            const __afterLoad = () => {
                document.removeEventListener("finishedLoading", __afterLoad);
            };

            if (document.addEventListener) {
                document.addEventListener("finishedLoading", __afterLoad);
            } else {
                document.attachEvent("finishedLoading", __afterLoad);
            }

            try {
                const obj = JSON.parse(data);
                this.activity.blocks.loadNewBlocks(obj);
            } catch (e) {
                this.errorMsg(e);
            }

            this.activity.loading = false;
            document.body.style.cursor = "default";
        };

        this.loadProjectFromFile = () => {
            document.querySelector("#myOpenFile").focus();
            document.querySelector("#myOpenFile").click();
            window.scroll(0, 0);
        };

        this.newProject = () => {
            this.closePlanet();
            this.initialiseNewProject();
            this.activity._loadStart();
            this.saveLocally();
        };

        this.initialiseNewProject = (name) => {
            this.planet.ProjectStorage.initialiseNewProject(name);
            this.activity.sendAllToTrash();
            this.activity.refreshCanvas();
            this.activity.blocks.trashStacks = [];
        };

        this.saveLocally = () => {
            this.activity.stage.update(event);
            const data = this.activity.prepareExport();
            const svgData = doSVG(
                this.activity.canvas,
                this.activity.logo,
                this.activity.turtles,
                320,
                240,
                320 / this.activity.canvas.width
            );
            try {
                if (svgData == null || svgData === "") {
                    this.planet.ProjectStorage.saveLocally(data, null);
                } else {
                    const img = new Image();
                    const t = this;
                    img.onload = () => {
                        const bitmap = new createjs.Bitmap(img);
                        const bounds = bitmap.getBounds();
                        bitmap.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                        t.planet.ProjectStorage.saveLocally(data, bitmap.bitmapCache.getCacheDataURL());
                    };
                    img.src =
                        "data:image/svg+xml;base64," +
                        window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(svgData)))));
                }
            } catch (e) {
                if (
                    e.code === DOMException.QUOTA_EXCEEDED_ERR ||
                    e.message === "Not enough space to save locally"
                )
                    this.activity.textMsg(
                        _(
                            "Error: Unable to save because you ran out of local storage. Try deleting some saved projects."
                        )
                    );
                else {
                    // eslint-disable-next-line no-console
                    console.error(e);
                    throw e;
                }
            }
        };

        this.openCurrentProject = async () => {
            return await this.planet.ProjectStorage.getCurrentProjectData();
        };

        this.openProjectFromPlanet = (id, error) => {
            this.planet.openProjectFromPlanet(id, error);
        };

        this.onConverterLoad = () => {
            window.Converter = this.planet.Converter;
        };

        this.getCurrentProjectName = () => {
            return this.planet.ProjectStorage.getCurrentProjectName();
        };

        this.getCurrentProjectDescription = () => {
            return this.planet.ProjectStorage.getCurrentProjectDescription();
        };

        this.getCurrentProjectImage = () => {
            return this.planet.ProjectStorage.getCurrentProjectImage();
        };

        this.getTimeLastSaved = () => {
            return this.planet.ProjectStorage.TimeLastSaved;
        };

        this.init = async () => {
            this.iframe = document.getElementById("planet-iframe");
            try {
                await this.iframe.contentWindow.makePlanet(
                    _THIS_IS_MUSIC_BLOCKS_,
                    this.activity.storage,
                    window._
                );
                this.planet = this.iframe.contentWindow.p;
                this.planet.setLoadProjectFromData(this.loadProjectFromData.bind(this));
                this.planet.setPlanetClose(this.closePlanet.bind(this));
                this.planet.setLoadNewProject(this.newProject.bind(this));
                this.planet.setLoadProjectFromFile(this.loadProjectFromFile.bind(this));
                this.planet.setOnConverterLoad(this.onConverterLoad.bind(this));
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
                this.planet = null;
            }

            window.Converter = this.planet.Converter;
            this.mainCanvas = this.activity.canvas;
        };
    }
}
