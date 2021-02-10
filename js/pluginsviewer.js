// Copyright (c) 2015-2019 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// FIXME: Use busy cursor

// A viewer for Turtle Blocks plugins
class PluginsViewer {
    constructor(canvas, stage, refreshCanvas, close, load) {
        this.canvas = canvas;
        this.stage = stage;
        this.refreshCanvas = refreshCanvas;
        this.closeViewer = close;
        this.loadPlugin = load;
        this.dict = {};
        this.pluginFiles = [];
        this.container = null;
        this.prev = null;
        this.next = null;
        this.page = 0; // 4x4 image matrix per page
        this.server = true;
    }

    setServer(server) {
        this.server = server;
    }

    hide() {
        if (this.container !== null) {
            this.container.visible = false;
            this.refreshCanvas();
        }
    }

    show(scale) {
        this.scale = scale;
        this.page = 0;
        if (this.server) {
            try {
                const rawData = httpGet();
                const obj = JSON.parse(rawData);
                // console.debug('json parse: ' + obj);
                // Look for svg
                for (const file in obj) {
                    if (fileExt(obj[file]) === "svg") {
                        const name = fileBasename(obj[file]);
                        if (this.pluginFiles.indexOf(name) === -1) {
                            this.pluginFiles.push(name);
                        }
                    }
                }
                // and corresponding .json files
                for (const file in this.pluginFiles) {
                    const tbfile = this.pluginFiles[file] + ".json";
                    if (!tbfile in obj) {
                        this.pluginFiles.remove(this.pluginFiles[file]);
                    }
                }
            } catch (e) {
                console.debug(e);
                return false;
            }
        } else {
            // FIXME: grab files from a local server?
            this.pluginFiles = SAMPLEPLUGINS;
        }
        console.debug("found these projects: " + this.pluginFiles.sort());

        if (this.container === null) {
            this.container = new createjs.Container();
            this.stage.addChild(this.container);
            this.container.x = Math.floor(
                (this.canvas.width / scale - 650) / 2
            );
            this.container.y = 27;

            const processBackground = (viewer, name, bitmap, extras) => {
                viewer.container.addChild(bitmap);

                const processPrev = (viewer, name, bitmap, extras) => {
                    viewer.prev = bitmap;
                    viewer.container.addChild(viewer.prev);
                    viewer.prev.x = 270;
                    viewer.prev.y = 535;

                    const processNext = (viewer, name, bitmap, scale) => {
                        viewer.next = bitmap;
                        viewer.container.addChild(viewer.next);
                        viewer.next.x = 325;
                        viewer.next.y = 535;
                        viewer.container.visible = true;
                        viewer.refreshCanvas();
                        viewer.completeInit();
                        loadThumbnailContainerHandler(viewer);
                        return true;
                    };
                    makeViewerBitmap(viewer,NEXTBUTTON,"viewer",processNext,null);
                };
                makeViewerBitmap(viewer,PREVBUTTON,"viewer",processPrev,null);
            };
            makeViewerBitmap(this,BACKGROUND,"viewer",processBackground,null);
        } else {
            this.container.visible = true;
            this.refreshCanvas();
            this.completeInit();
            return true;
        }
    }

    downloadImage(p, prepareNextImage) {
        const header = "data:image/svg+xml;utf8,";
        const name = this.pluginFiles[p] + ".svg";
        // console.debug('getting ' + name + ' from samples');
        let data = header + SAMPLESSVG[name];
        if (this.server) {
            data = header + httpGet(name);
        }
        const image = new Image();
        const viewer = this;

        image.onload = () => {
            bitmap = new createjs.Bitmap(data);
            bitmap.scaleX = 0.5;
            bitmap.scaleY = 0.5;
            viewer.container.addChild(bitmap);
            lastChild = last(viewer.container.children);
            viewer.container.swapChildren(bitmap, lastChild);

            viewer.dict[viewer.pluginFiles[p]] = bitmap;
            x = 5 + (p % 4) * 160;
            y = 55 + Math.floor((p % 16) / 4) * 120;
            viewer.dict[viewer.pluginFiles[p]].x = x;
            viewer.dict[viewer.pluginFiles[p]].y = y;
            viewer.dict[viewer.pluginFiles[p]].visible = true;
            viewer.refreshCanvas();
            if (prepareNextImage !== null) {
                prepareNextImage(viewer, p + 1);
            }
        };

        image.src = data;
    }

    completeInit() {
        const p = 0;
        this.prepareNextImage(this, p);
    }

    prepareNextImage(viewer, p) {
        // TODO: this.pluginFiles.sort()
        // Only download the images on the first page.
        if (p < viewer.pluginFiles.length && p < viewer.page * 16 + 16) {
            if (viewer.pluginFiles[p] in viewer.dict) {
                x = 5 + (p % 4) * 160;
                y = 55 + Math.floor((p % 16) / 4) * 120;
                viewer.dict[viewer.pluginFiles[p]].x = x;
                viewer.dict[viewer.pluginFiles[p]].y = y;
                viewer.dict[viewer.pluginFiles[p]].visible = true;
                viewer.prepareNextImage(viewer, p + 1);
            } else {
                viewer.downloadImage(p, viewer.prepareNextImage);
            }
        } else {
            if (viewer.page === 0) {
                viewer.prev.visible = false;
            }
            if ((viewer.page + 1) * 16 < viewer.pluginFiles.length) {
                viewer.next.visible = true;
            }
            viewer.refreshCanvas();
        }
    }
}

function hideCurrentPage(viewer) {
    let min = viewer.page * 16;
    let max = Math.min(viewer.pluginFiles.length, (viewer.page + 1) * 16);
    // Hide the current page.
    for (let p = min; p < max; p++) {
        viewer.dict[viewer.pluginFiles[p]].visible = false;
    }
    // Go back to previous page.
    viewer.page -= 1;
    if (viewer.page === 0) {
        viewer.prev.visible = false;
    }
    if ((viewer.page + 1) * 16 < viewer.pluginFiles.length) {
        viewer.next.visible = true;
    }
    // Show the current page.
    min = viewer.page * 16;
    max = Math.min(viewer.pluginFiles.length, (viewer.page + 1) * 16);
    for (var p = min; p < max; p++) {
        viewer.dict[viewer.pluginFiles[p]].visible = true;
    }
    viewer.refreshCanvas();
}

function showNextPage(viewer) {
    const min = viewer.page * 16;
    const max = Math.min(viewer.pluginFiles.length, (viewer.page + 1) * 16);
    // Hide the current page.
    for (let p = min; p < max; p++) {
        viewer.dict[viewer.pluginFiles[p]].visible = false;
    }
    // Advance to next page.
    viewer.page += 1;
    viewer.prev.visible = true;
    if ((viewer.page + 1) * 16 + 1 > viewer.pluginFiles.length) {
        viewer.next.visible = false;
    }
    viewer.prepareNextImage(viewer, max);
    viewer.refreshCanvas();
}

function viewerClicked(viewer, event) {
    const x = event.stageX / viewer.scale - viewer.container.x;
    const y = event.stageY / viewer.scale - viewer.container.y;
    if (x > 600 && y < 55) {
        viewer.hide();
        viewer.closeViewer();
    } else if (y > 535) {
        if (viewer.prev.visible && x < 325) {
            hideCurrentPage(viewer);
        } else if (viewer.next.visible && x > 325) {
            showNextPage(viewer);
        }
    } else {
        // Select a plugin.
        const col = Math.floor((x - 5) / 160);
        const row = Math.floor((y - 55) / 120);
        const p = row * 4 + col + 16 * viewer.page;
        if (p < viewer.pluginFiles.length) {
            viewer.hide();
            viewer.closeViewer();
            viewer.loadPlugin(viewer.pluginFiles[p] + ".json");
        }
    }
}

function loadThumbnailContainerHandler(viewer) {
    const hitArea = new createjs.Shape();
    const w = 650;
    const h = 590;
    let startX, startY, endX, endY;
    hitArea.graphics.beginFill("#FFF").drawRect(0, 0, w, h);
    hitArea.x = 0;
    hitArea.y = 0;
    viewer.container.hitArea = hitArea;

    let locked = false;

    viewer.container.on("click", (event) => {
        // We need a lock to "debouce" the click.
        if (locked) {
            console.debug("debouncing click");
            return;
        }
        locked = true;
        setTimeout(() => {
            locked = false;
        }, 500);
        viewerClicked(viewer, event);
    });

    viewer.container.on("mousedown", (event) => {
        startX = event.stageX;
        startY = event.stageY;
        locked = true;
    });

    viewer.container.on("pressup", (event) => {
        endX = event.stageX;
        endY = event.stageY;
        if (endY > startY + 30 || endX > startX + 30) {
            // Down or right
            if (viewer.next.visible) {
                showNextPage(viewer);
            }
        } else if (endY < startY - 30 || endX < startX - 30) {
            // Up or left
            if (viewer.prev.visible) {
                hideCurrentPage(viewer);
            }
        } else {
            locked = false;
            viewerClicked(viewer, event);
        }
    });
}

function makeViewerBitmap(viewer, data, name, callback, extras) {
    // Async creation of bitmap from SVG data
    // Works with Chrome, Safari, Firefox (untested on IE)
    const img = new Image();
    img.onload = () => {
        bitmap = new createjs.Bitmap(img);
        callback(viewer, name, bitmap, extras);
    };

    img.src ="data:image/svg+xml;base64," +
        window.btoa(unescape(encodeURIComponent(data)));
}
