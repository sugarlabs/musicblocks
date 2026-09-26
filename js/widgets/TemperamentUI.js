/**
 * @file TemperamentUI.js
 * @description UI and rendering logic for TemperamentWidget.
 *   Extracted from js/widgets/temperament.js as a plain-object module
 *   following the PhraseMakerUI pattern (PR #8616, issue #8815).
 *
 * @copyright 2018 Riya Lohia
 *
 * @license
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the The GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library; if not, write to the Free
 * Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/* global
   _, docById, platformColor, wheelnav, slicePath, ratioToWheelAngle,
   frequencyToPitch,
   Singer
 */
/* exported TemperamentUI */

// ---------------------------------------------------------------------------
// Constants for UI dimensions
// ---------------------------------------------------------------------------

const BUTTONDIVWIDTH = 430;
const MAIN_WHEEL_RADIUS = 150;
const INNER_WHEEL_RADIUS = 128;

// ---------------------------------------------------------------------------
// Private UI helpers (module-level)
// ---------------------------------------------------------------------------

/**
 * Sets fill, hover, path, and selected colors on a wheelnav navigation item.
 * @param {Object} navObj - The wheelnav wheel instance containing navItems.
 * @param {number} index - Index of the navigation item slice to update.
 * @param {string} color - CSS color value to apply.
 * @returns {void}
 */
const _setNavItemColor = (navObj, index, color) => {
    navObj.navItems[index].fillAttr = color;
    navObj.navItems[index].sliceHoverAttr.fill = color;
    navObj.navItems[index].slicePathAttr.fill = color;
    navObj.navItems[index].sliceSelectedAttr.fill = color;
};

/**
 * Attaches an onmouseover pointer cursor style handler to an element.
 * @param {HTMLElement} el - Element to attach pointer cursor behavior to.
 * @returns {void}
 */
const _setPointerCursor = el => {
    el.onmouseover = function () {
        this.style.cursor = "pointer";
    };
};

/**
 * Builds and attaches the "preview" / "done" button pair for temperament editing views.
 * @param {HTMLElement} divAppend - The button wrapper container element.
 * @param {HTMLElement} container - Parent element to append the button container into.
 * @param {string} marginLeft - Left margin CSS offset string for button alignment.
 * @param {boolean} preview - Whether preview mode is currently active (toggles "back" vs "preview").
 * @returns {void}
 */
const _addPreviewDoneButtonPair = (divAppend, container, marginLeft, preview) => {
    divAppend.id = "divAppend";
    divAppend.textContent = "";
    const previewDiv = document.createElement("div");
    previewDiv.id = "preview";
    previewDiv.style.cssFloat = "left";
    previewDiv.textContent = preview ? _("back") : _("preview");
    const doneDiv = document.createElement("div");
    doneDiv.id = "done_";
    doneDiv.style.cssFloat = "right";
    doneDiv.textContent = _("done");
    divAppend.appendChild(previewDiv);
    divAppend.appendChild(doneDiv);
    divAppend.style.textAlign = "center";
    divAppend.style.marginLeft = marginLeft;
    divAppend.style.height = "32px";
    divAppend.style.marginTop = "40px";
    divAppend.style.overflow = "auto";
    container.append(divAppend);

    const divAppend1 = docById("preview");
    divAppend1.style.height = "30px";
    divAppend1.style.marginLeft = "3px";
    divAppend1.style.backgroundColor = platformColor.selectorBackground;
    divAppend1.style.width = "215px";

    const divAppend2 = docById("done_");
    divAppend2.style.height = "30px";
    divAppend2.style.marginRight = "3px";
    divAppend2.style.backgroundColor = platformColor.selectorBackground;
    divAppend2.style.width = "205px";
};

/**
 * Recolors all slices of a preview wheelnav wheel back to the default background color.
 * @param {Object} navObj - The wheelnav wheel instance to recolor.
 * @param {number} pitchNumber - Total number of pitch slices to update.
 * @returns {void}
 */
const _paintPreviewWheelColors = (navObj, pitchNumber) => {
    for (let i = 0; i < pitchNumber; i++) {
        _setNavItemColor(navObj, i, platformColor.selectorBackground || "#e0e0e0");
    }
    navObj.refreshWheel();
};

/**
 * Creates and mounts a single "done" button container used in arbitrary and octave space edit views.
 * @param {HTMLElement} container - Parent container element to append into.
 * @param {string} [marginLeft] - Optional left margin offset for alignment.
 * @returns {HTMLElement} The created done button element.
 */
const _createDoneButton = (container, marginLeft) => {
    const divAppend = document.createElement("div");
    divAppend.id = "divAppend";
    divAppend.textContent = _("done");
    divAppend.style.textAlign = "center";
    divAppend.style.paddingTop = "5px";
    if (marginLeft) {
        divAppend.style.marginLeft = marginLeft;
    }
    divAppend.style.backgroundColor = platformColor.selectorBackground;
    divAppend.style.height = "25px";
    divAppend.style.marginTop = "40px";
    divAppend.style.overflow = "auto";
    container.append(divAppend);
    _setPointerCursor(divAppend);
    return divAppend;
};

/**
 * Mounts the preview wheelnav container, renders the main wheel, and positions preview/done buttons.
 * @param {TemperamentWidget} tw - The TemperamentWidget instance.
 * @param {number} pitchNumber - Total pitch count to render.
 * @param {Function} addButtonsFn - Callback to render preview/done buttons.
 * @param {string} previewMarginLeft - Margin offset for preview button.
 * @returns {void}
 */
const _mountPreviewWheel = (tw, pitchNumber, addButtonsFn, previewMarginLeft) => {
    docById("userEdit").textContent = "";
    const wheelDiv2 = document.createElement("div");
    wheelDiv2.id = "wheelDiv2";
    wheelDiv2.className = "wheelNav";
    docById("userEdit").appendChild(wheelDiv2);
    TemperamentUI.createMainWheel(tw, tw.tempRatios, pitchNumber);
    _paintPreviewWheelColors(tw.notesCircle, pitchNumber);
    docById("userEdit").style.paddingLeft = "0px";
    addButtonsFn(true);
    docById("divAppend").style.marginTop = docById("wheelDiv2").style.height;
    docById("preview").style.marginLeft = previewMarginLeft;
};

/**
 * Updates edit tab backgrounds so that only the selected tab index is highlighted.
 * @param {HTMLElement[]} menuItems - Array of tab td elements.
 * @param {number} activeIndex - Index of the active tab.
 * @returns {void}
 */
const _highlightTab = (menuItems, activeIndex) => {
    for (let i = 0; i < menuItems.length; i++) {
        menuItems[i].style.background =
            i === activeIndex
                ? platformColor.selectorBackground || "#c8C8C8"
                : platformColor.selectorBackground;
    }
};

/**
 * Computes angular differences between consecutive wheel angles and wrap-around gap.
 * @param {number[]} angle - Array of wheel angles in degrees.
 * @param {number} pitchNumber - Number of pitches in the temperament.
 * @returns {number[]} Array of angle differences of length pitchNumber - 1.
 */
const _computeAngleDiffs = (angle, pitchNumber) => {
    const angleDiff = [];
    for (let i = 1; i < pitchNumber; i++) {
        if (i === pitchNumber - 1) {
            angleDiff[i - 1] = angle[0] + 360 - angle[i];
        } else {
            angleDiff[i - 1] = angle[i] - angle[i - 1];
        }
    }
    return angleDiff;
};

/**
 * Computes slice angles, base angles, and menu radius for main and inner wheels.
 * @param {Object} wheelInstance - The wheelnav instance.
 * @param {number[]} ratios - Pitch ratios array.
 * @param {number} powerBase - Base of the octave ratio space (e.g. 2).
 * @param {number} pitchNumber - Number of pitches.
 * @param {number} radius - Wheel radius for menu size calculation.
 * @returns {void}
 */
const _applyWheelGeometry = (wheelInstance, ratios, powerBase, pitchNumber, radius) => {
    const angle = [];
    const baseAngle = [];
    const sliceAngle = [];
    for (let i = 0; i < wheelInstance.navItemCount; i++) {
        angle[i] = ratioToWheelAngle(ratios[i], powerBase);
        if (i === 0) {
            sliceAngle[i] = 360 / pitchNumber;
            baseAngle[i] = wheelInstance.navAngle - sliceAngle[0] / 2;
        } else {
            baseAngle[i] = baseAngle[i - 1] + sliceAngle[i - 1];
            sliceAngle[i] = 2 * (angle[i] - baseAngle[i]);
        }
        wheelInstance.navItems[i].sliceAngle = sliceAngle[i];
    }

    const angleDiff = _computeAngleDiffs(angle, pitchNumber);

    let menuRadius = (2 * Math.PI * radius) / pitchNumber / 3;
    for (let i = 0; i < angleDiff.length; i++) {
        if (angleDiff[i] < 11) {
            menuRadius = (2 * Math.PI * radius) / pitchNumber / 6;
        }
    }
    if (menuRadius > 29) {
        menuRadius = (2 * Math.PI * radius) / 33;
    }
    wheelInstance.slicePathCustom.menuRadius = menuRadius;
};

/**
 * Commits equal temperament ratio updates, recomputing frequencies, cents, and notes.
 * @param {TemperamentWidget} tw - The TemperamentWidget instance.
 * @param {number} pitchNumber - Number of pitches.
 * @param {string[]} compareRatios - Formatted ratio strings for temperament dictionary checking.
 * @returns {void}
 */
const _commitEqualEdit = (tw, pitchNumber, compareRatios) => {
    tw.ratios = tw.tempRatios.slice();
    const frequency = tw.frequencies[0];
    tw.frequencies = tw.computeFrequencies(tw.ratios, frequency, pitchNumber);
    tw.pitchNumber = pitchNumber;
    for (let k = 0; k < pitchNumber; k++) {
        tw.cents[k] = tw.ratioToCents(tw.ratios[k], tw.powerBase);
        const f = Number(tw.frequencies[0]) * tw.ratios[k];
        const o = frequencyToPitch(f, tw.trustedKey(tw.inTemperament));
        tw.notes[k] = [o[0], o[1]];
        tw.intervals[k] = "";
        tw.ratiosNotesPair[k] = [tw.ratios[k], tw.notes[k]];
    }
    tw.checkTemperament(compareRatios);
    tw._visualizerView();
};

/**
 * Formats an array of ratios to 2 decimal places using r.toFixed(2).
 * @param {number[]} ratios - Array of numeric ratio values.
 * @returns {string[]} Array of formatted ratio strings.
 */
const _buildCompareRatios = ratios => {
    const compareRatios = [];
    for (let i = 0; i < ratios.length; i++) {
        compareRatios[i] = ratios[i].toFixed(2);
    }
    return compareRatios;
};

// ---------------------------------------------------------------------------
// TemperamentUI plain-object module
// Each method receives the TemperamentWidget instance as `tw`.
// ---------------------------------------------------------------------------

const TemperamentUI = {
    /**
     * Hides and removes a wheelnav wheel instance if its container element is present in the DOM.
     * @param {string} divId - The DOM ID of the container element.
     * @param {Object} [wheel] - The wheelnav instance to remove.
     * @returns {void}
     */
    _removeWheelIfPresent(divId, wheel) {
        const el = docById(divId);
        if (el !== null) {
            el.style.display = "none";
            if (wheel && wheel.removeWheel) wheel.removeWheel();
        }
    },

    /**
     * Creates and initializes the main interactive wheelnav wheel for the circle of notes.
     * Note: Lives in TemperamentUI.js as part of the view split (issue #8815) because it
     * handles DOM container sizing, wheelnav instantiation, slice geometry, and canvas rendering.
     * @param {TemperamentWidget} tw - The TemperamentWidget instance.
     * @param {number[]} [ratios] - Pitch ratios for slice angle calculations (defaults to tw.ratios).
     * @param {number} [pitchNumber] - Total pitch count for the wheel (defaults to tw.pitchNumber).
     * @returns {void}
     */
    createMainWheel(tw, ratios, pitchNumber) {
        if (ratios === undefined) {
            ratios = tw.ratios;
        }
        if (pitchNumber === undefined) {
            pitchNumber = tw.pitchNumber;
        }
        const radius = MAIN_WHEEL_RADIUS;
        const height = 2 * radius + 60;

        const labels = [];
        for (let j = 0; j < pitchNumber; j++) {
            labels.push(j.toString());
        }

        tw.notesCircle = new wheelnav("wheelDiv2", null, 350, 350);
        tw.notesCircle.wheelRadius = 230;
        tw.notesCircle.navItemsEnabled = false;
        tw.notesCircle.navAngle = 270;
        tw.notesCircle.navItemsContinuous = true;
        tw.notesCircle.navItemsCentered = false;
        tw.notesCircle.slicePathFunction = slicePath().MenuSliceWithoutLine;
        tw.notesCircle.slicePathCustom = slicePath().MenuSliceCustomization();
        tw.notesCircle.sliceSelectedPathCustom = tw.notesCircle.slicePathCustom;
        tw.notesCircle.sliceInitPathCustom = tw.notesCircle.slicePathCustom;
        tw.notesCircle.initWheel(labels);

        for (let i = 0; i < tw.notesCircle.navItemCount; i++) {
            tw.notesCircle.navItems[i].fillAttr = platformColor.selectorBackground || "#c8C8C8";
            tw.notesCircle.navItems[i].titleAttr.font = "20 20px Impact, Charcoal, sans-serif";
            tw.notesCircle.navItems[i].titleSelectedAttr.font =
                "20 20px Impact, Charcoal, sans-serif";
        }

        _applyWheelGeometry(tw.notesCircle, ratios, tw.powerBase, pitchNumber, radius);
        tw.notesCircle.createWheel();

        docById("wheelDiv2").style.position = "absolute";
        docById("wheelDiv2").style.height = height + "px";
        docById("wheelDiv2").style.width = BUTTONDIVWIDTH + "px";
        docById("wheelDiv2").style.zIndex = 5;
    },

    /**
     * Creates the inner wheelnav wheel used in arbitrary edit view.
     * Note: Lives in TemperamentUI.js as part of the view split (issue #8815) because it
     * constructs the wheel container DOM, configures slice styling, and binds slider input handlers.
     * @param {TemperamentWidget} tw - The TemperamentWidget instance.
     * @param {number[]} [ratios] - Pitch ratios for slice angle calculations (defaults to tw.ratios).
     * @param {number} [pitchNumber] - Total pitch count for the wheel (defaults to tw.pitchNumber).
     * @returns {void}
     */
    createInnerWheel(tw, ratios, pitchNumber) {
        if (tw.wheel1 !== undefined) {
            docById("wheelDiv4").display = "none";
            tw.wheel1.removeWheel();
        }
        if (ratios === undefined) {
            ratios = tw.ratios;
        }
        if (pitchNumber === undefined) {
            pitchNumber = tw.pitchNumber;
        }
        const radius = INNER_WHEEL_RADIUS;
        const labels = [];
        for (let j = 0; j < pitchNumber; j++) {
            labels.push(j.toString());
        }
        docById("wheelDiv4").style.display = "";
        docById("wheelDiv4").style.background = "none";
        docById("wheelDiv4").style.position = "relative";
        docById("wheelDiv4").style.zIndex = 5;
        tw.wheel1 = new wheelnav("wheelDiv4");
        tw.wheel1.wheelRadius = 200;
        tw.wheel1.navItemsEnabled = false;
        tw.wheel1.navAngle = 270;
        tw.wheel1.navItemsContinuous = true;
        tw.wheel1.navItemsCentered = false;
        tw.wheel1.slicePathFunction = slicePath().MenuSliceWithoutLine;
        tw.wheel1.slicePathCustom = slicePath().MenuSliceCustomization();
        tw.wheel1.sliceSelectedPathCustom = tw.wheel1.slicePathCustom;
        tw.wheel1.sliceInitPathCustom = tw.wheel1.slicePathCustom;
        tw.wheel1.initWheel(labels);

        for (let i = 0; i < tw.wheel1.navItemCount; i++) {
            tw.wheel1.navItems[i].fillAttr = platformColor.selectorBackground || "#e0e0e0";
            tw.wheel1.navItems[i].titleAttr.font = "20 20px Impact, Charcoal, sans-serif";
            tw.wheel1.navItems[i].titleSelectedAttr.font = "20 20px Impact, Charcoal, sans-serif";
        }

        _applyWheelGeometry(tw.wheel1, ratios, tw.powerBase, pitchNumber, radius);

        if (docById("frequencySlider") !== null) {
            docById("frequencySlider").oninput = function () {
                TemperamentUI.refreshInnerWheel(tw);
            };
        }
        tw.wheel1.createWheel();
    },

    /**
     * Creates the outer donut wheelnav wheel in arbitrary edit view.
     * Note: Lives in TemperamentUI.js as part of the view split (issue #8815) because it
     * initializes donut-slice geometry, sets wheelnav DOM styles, and attaches hover slider listeners.
     * @param {TemperamentWidget} tw - The TemperamentWidget instance.
     * @param {number[]} [ratios] - Pitch ratios for slice angle calculations (defaults to tw.ratios).
     * @param {number} [pitchNumber] - Total pitch count for the wheel (defaults to tw.pitchNumber).
     * @returns {void}
     */
    createOuterWheel(tw, ratios, pitchNumber) {
        if (tw.wheel !== undefined) {
            docById("wheelDiv3").display = "none";
            tw.wheel.removeWheel();
        }
        if (pitchNumber === undefined) {
            pitchNumber = tw.pitchNumber;
        }
        if (ratios === undefined) {
            ratios = tw.ratios;
        }
        docById("wheelDiv3").style.display = "";
        docById("wheelDiv3").style.background = "none";
        tw.wheel = new wheelnav("wheelDiv3", null, 600, 600);
        tw.wheel.wheelRadius = 300;
        tw.wheel.slicePathFunction = slicePath().DonutSlice;
        tw.wheel.slicePathCustom = slicePath().DonutSliceCustomization();
        tw.wheel.slicePathCustom.minRadiusPercent = 0.9;
        tw.wheel.slicePathCustom.maxRadiusPercent = 1.0;
        tw.wheel.sliceSelectedPathCustom = tw.wheel.slicePathCustom;
        tw.wheel.sliceInitPathCustom = tw.wheel.slicePathCustom;
        tw.wheel.colors = [
            platformColor.selectorBackground || "#c0c0c0",
            platformColor.selectorBackground || "#e0e0e0"
        ];
        tw.wheel.titleRotateAngle = 90;
        tw.wheel.navItemsEnabled = false;

        const minutes = [];
        const angle = [];
        const baseAngle1 = [];
        const sliceAngle1 = [];
        const angle1 = [];
        for (let i = 0; i <= pitchNumber; i++) {
            if (i !== pitchNumber) {
                minutes.push("|");
            }
            angle[i] = ratioToWheelAngle(ratios[i], tw.powerBase);
        }

        const angleDiff1 = _computeAngleDiffs(angle, pitchNumber);
        for (let i = 0; i < angleDiff1.length; i++) {
            angle1[i] = angle[i] + angleDiff1[i] / 2;
        }

        tw.wheel.navAngle = 270 + angleDiff1[0] / 2;
        tw.wheel.initWheel(minutes);
        for (let i = 0; i < pitchNumber; i++) {
            if (i === 0) {
                sliceAngle1[i] = 360 / pitchNumber;
                baseAngle1[i] = tw.wheel.navAngle - sliceAngle1[0] / 2;
            } else {
                baseAngle1[i] = baseAngle1[i - 1] + sliceAngle1[i - 1];
                sliceAngle1[i] = 2 * (angle1[i] - baseAngle1[i]);
            }
            tw.wheel.navItems[i].sliceAngle = sliceAngle1[i];
        }
        tw.wheel.createWheel();
        docById("wheelDiv3").style.position = "absolute";
        docById("wheelDiv3").style.zIndex = 10;
        docById("wheelDiv3").style.marginTop = 15 + "px";
        docById("wheelDiv3").style.marginLeft = 37 + "px";
        docById("wheelDiv3").addEventListener("mouseover", function (e) {
            TemperamentUI.arbitraryEditSlider(tw, e, angle1, ratios, pitchNumber);
        });
    },

    /**
     * Handles the frequency slider popup when hovering over a slice in arbitrary edit mode.
     * Note: Lives in TemperamentUI.js as part of the view split (issue #8815) because it
     * constructs the popup DOM, range input, close button, and binds user interaction events.
     * @param {TemperamentWidget} tw - The TemperamentWidget instance.
     * @param {Event} event - The mouseover event triggered on the wheel slice title.
     * @param {number[]} angle - Wheel slice angle coordinates.
     * @param {number[]} ratios - Pitch ratios representing the temperament.
     * @param {number} pitchNumber - Number of pitches in the temperament.
     * @returns {void}
     */
    arbitraryEditSlider(tw, event, angle, ratios, pitchNumber) {
        const frequency = tw.frequencies[0];
        const frequencies = tw.computeFrequencies(ratios, frequency, pitchNumber);
        for (let i = 0; i < pitchNumber; i++) {
            if (event.target.parentNode.id === "wheelnav-wheelDiv3-title-" + i) {
                if (docById("noteInfo1") !== null) {
                    docById("noteInfo1").remove();
                }
                const noteInfo1 = document.createElement("div");
                noteInfo1.className = "popup";
                noteInfo1.id = "noteInfo1";
                noteInfo1.style.width = "180px";
                noteInfo1.style.height = "135px";
                const myPopup = document.createElement("span");
                myPopup.className = "popuptext";
                myPopup.id = "myPopup";
                noteInfo1.appendChild(myPopup);
                docById("wheelDiv3").appendChild(noteInfo1);

                const closeImg = document.createElement("img");
                closeImg.src = "header-icons/close-button.svg";
                closeImg.id = "close";
                closeImg.title = _("Close");
                closeImg.alt = _("Close");
                closeImg.setAttribute("height", "20px");
                closeImg.setAttribute("width", "20px");
                closeImg.setAttribute("align", "right");
                noteInfo1.appendChild(closeImg);

                noteInfo1.appendChild(document.createElement("br"));
                const centerNode = document.createElement("center");
                const slider = document.createElement("input");
                slider.type = "range";
                slider.className = "sliders";
                slider.id = "frequencySlider";
                slider.style.width = "170px";
                slider.style.background = "white";
                slider.style.border = "0";
                slider.setAttribute("min", frequencies[i]);
                slider.setAttribute("max", frequencies[i + 1]);
                slider.setAttribute("value", "30");
                centerNode.appendChild(slider);
                noteInfo1.appendChild(centerNode);

                noteInfo1.appendChild(
                    document.createTextNode("\u00A0\u00A0" + _("frequency") + " : ")
                );
                const freqSpan = document.createElement("span");
                freqSpan.className = "rangeslidervalue";
                freqSpan.id = "frequencydiv";
                freqSpan.textContent = frequencies[i];
                noteInfo1.appendChild(freqSpan);

                noteInfo1.appendChild(document.createElement("br"));
                noteInfo1.appendChild(document.createElement("br"));
                const doneDiv = document.createElement("div");
                doneDiv.id = "done";
                doneDiv.style.background = "rgb(196, 196, 196)";
                const doneCenter = document.createElement("center");
                doneCenter.textContent = _("done");
                doneDiv.appendChild(doneCenter);
                noteInfo1.appendChild(doneDiv);

                docById("noteInfo1").style.top = "100px";
                docById("noteInfo1").style.left = "90px";

                docById("frequencySlider").oninput = function () {
                    TemperamentUI.refreshInnerWheel(tw);
                };
                docById("done").onclick = function () {
                    tw.tempRatios1 = tw.tempRatios.slice();
                    const pn = tw.tempRatios1.length;
                    TemperamentUI.createOuterWheel(tw, tw.tempRatios1, pn);
                };
                docById("close").onclick = function () {
                    tw.tempRatios = tw.tempRatios1.slice();
                    const pn = tw.tempRatios.length;
                    TemperamentUI.createInnerWheel(tw, tw.tempRatios, pn);
                    docById("noteInfo1").remove();
                };
            }
        }
    },

    /**
     * Refreshes the inner wheel and plays audio preview based on frequency slider input.
     * Note: Lives in TemperamentUI.js as part of the view split (issue #8815) because it
     * coordinates frequency slider DOM reading, audio preview trigger, and inner wheel redraw.
     * @param {TemperamentWidget} tw - The TemperamentWidget instance.
     * @returns {void}
     */
    refreshInnerWheel(tw) {
        docById("frequencydiv").textContent = docById("frequencySlider").value;
        const frequency = docById("frequencySlider").value;
        const ratio = frequency / tw.frequencies[0];
        tw.tempRatios = tw.tempRatios1.slice();

        const EPS = 1e-6;
        for (let j = 0; j < tw.tempRatios.length; j++) {
            const diff = ratio - tw.tempRatios[j];
            if (diff < -EPS) {
                if (tw.overDivisionCap(tw.activity, tw.tempRatios.length)) return;
                tw.tempRatios.splice(j, 0, ratio);
                break;
            } else if (Math.abs(diff) < EPS) {
                tw.tempRatios.splice(j, 1, ratio);
                break;
            }
        }
        const pitchNumber = tw.tempRatios.length;
        tw._logo.resetSynth(0);
        tw._logo.synth.trigger(
            0,
            frequency,
            Singer.defaultBPMFactor * 0.01,
            "electronic synth",
            null,
            null
        );
        TemperamentUI.createInnerWheel(tw, tw.tempRatios, pitchNumber);
    },

    /**
     * Builds the tabbed temperament edit menu and initializes the default equal edit view.
     * Note: Lives in TemperamentUI.js as part of the view split (issue #8815) because it
     * manages edit menu DOM construction, active tab styling, and mode transitions.
     * @param {TemperamentWidget} tw - The TemperamentWidget instance.
     * @returns {void}
     */
    edit(tw) {
        if (tw._playAllRunning) {
            tw._clearWidgetTimeout(tw._playAllTimer);
            tw._playAllTimer = null;
            tw._playAllRunning = false;
        }
        if (typeof tw._clearWidgetTimers === "function") {
            tw._clearWidgetTimers();
        }
        tw._lastPlaybackIndex = 0;
        tw.editMode = null;
        tw._logo.synth.setMasterVolume(0);
        tw._logo.synth.stop();
        if (tw._vizToolbar) {
            tw._vizToolbar.playAllBtn2.onclick = null;
            tw._vizToolbar.addPitchAfterBtn.onclick = null;
            tw._vizToolbar.addPitchBeforeBtn.onclick = null;
            tw._vizToolbar.removePitchBtn.onclick = null;
        }

        TemperamentUI._removeWheelIfPresent("wheelDiv2", tw.notesCircle);
        const tableDiv = tw.temperamentTableDiv;
        const editOctaveTable = document.createElement("table");
        editOctaveTable.id = "editOctave";
        editOctaveTable.setAttribute("width", BUTTONDIVWIDTH);
        const editOctaveTbody = document.createElement("tbody");
        const editOctaveTr = document.createElement("tr");
        editOctaveTr.id = "menu";
        editOctaveTbody.appendChild(editOctaveTr);
        editOctaveTable.appendChild(editOctaveTbody);
        if (tableDiv) {
            tableDiv.textContent = "";
            tableDiv.appendChild(editOctaveTable);
        }

        const editMenus = [_("equal"), _("ratios"), _("arbitrary"), _("octave space")];

        const menuItems = [];
        for (let i = 0; i < editMenus.length; i++) {
            const td = document.createElement("td");
            td.className = "editMenus";
            td.textContent = editMenus[i];
            td.style.background = platformColor.selectorBackground;
            td.style.height = 30 + "px";
            td.style.textAlign = "center";
            td.style.fontWeight = "bold";
            menuItems.push(td);
            editOctaveTr.appendChild(td);
        }

        const userEditTr = document.createElement("tr");
        const userEditTd = document.createElement("td");
        userEditTd.setAttribute("colspan", "4");
        userEditTd.id = "userEdit";
        userEditTr.appendChild(userEditTd);
        editOctaveTbody.appendChild(userEditTr);

        _highlightTab(menuItems, 0);
        TemperamentUI.equalEdit(tw);

        menuItems[0].onclick = function () {
            _highlightTab(menuItems, 0);
            TemperamentUI.equalEdit(tw);
        };

        menuItems[1].onclick = function () {
            _highlightTab(menuItems, 1);
            TemperamentUI.ratioEdit(tw);
        };

        menuItems[2].onclick = function () {
            _highlightTab(menuItems, 2);
            TemperamentUI.arbitraryEdit(tw);
        };

        menuItems[3].onclick = function () {
            _highlightTab(menuItems, 3);
            TemperamentUI.octaveSpaceEdit(tw);
        };
    },

    /**
     * Enters the equal temperament edit mode, rendering form inputs and preview/done controls.
     * Note: Lives in TemperamentUI.js as part of the view split (issue #8815) because it
     * manages edit form DOM construction, preview wheel mounting, and user commit callbacks.
     * @param {TemperamentWidget} tw - The TemperamentWidget instance.
     * @returns {void}
     */
    equalEdit(tw) {
        tw.editMode = "equal";
        docById("userEdit").textContent = "";
        const equalEdit = docById("userEdit");
        equalEdit.style.backgroundColor = platformColor.selectorBackground || "#c8C8C8";
        equalEdit.appendChild(document.createElement("br"));
        equalEdit.appendChild(
            document.createTextNode(_("pitch number") + "\u00A0\u00A0\u00A0\u00A0 ")
        );
        const octaveIn = document.createElement("input");
        octaveIn.type = "text";
        octaveIn.id = "octaveIn";
        octaveIn.value = "0";
        equalEdit.appendChild(octaveIn);
        equalEdit.appendChild(
            document.createTextNode(" \u00A0\u00A0 " + _("to") + "\u00A0\u00A0 ")
        );
        const octaveOut = document.createElement("input");
        octaveOut.type = "text";
        octaveOut.id = "octaveOut";
        octaveOut.value = "0";
        equalEdit.appendChild(octaveOut);
        equalEdit.appendChild(document.createElement("br"));
        equalEdit.appendChild(document.createElement("br"));
        equalEdit.appendChild(
            document.createTextNode(_("number of divisions") + " \u00A0\u00A0\u00A0\u00A0 ")
        );
        const divisions = document.createElement("input");
        divisions.type = "number";
        divisions.id = "divisions";
        divisions.min = "1";
        divisions.max = String(tw.MAX_DIVISIONS);
        divisions.step = "1";
        divisions.title = _("Maximum 57 divisions");
        divisions.value = tw.pitchNumber;
        equalEdit.appendChild(divisions);
        equalEdit.style.paddingLeft = "80px";

        const divAppend = document.createElement("div");

        /**
         * Renders the preview/done button pair for equal temperament editing.
         * @param {boolean} preview - Whether preview mode is currently active.
         * @returns {void}
         */
        function addDivision(preview) {
            _addPreviewDoneButtonPair(divAppend, equalEdit, "-80px", preview);
        }

        addDivision(false);
        _setPointerCursor(divAppend);

        let pitchNumber = tw.pitchNumber;
        const ratio = [];
        const compareRatios = [];
        tw.tempRatios = [];

        divAppend.addEventListener("click", function (event) {
            tw.performEqualEdit(event);
        });

        /**
         * Validates division inputs and applies equal temperament edits on done or preview click.
         * @param {Event} event - The click event from the preview/done buttons.
         * @returns {void}
         */
        tw.performEqualEdit = function (event) {
            if (!docById("octaveIn")) return;
            const pitchNumber1 = Number(docById("octaveIn").value);
            const pitchNumber2 = Number(docById("octaveOut").value);
            const numDivs = Number(docById("divisions").value);
            if (!Number.isFinite(numDivs) || !Number.isInteger(numDivs) || numDivs < 1) {
                tw.activity.errorMsg(_("Please enter a valid number of divisions."), 3000);
                return;
            }
            if (tw.overDivisionCap(tw.activity, numDivs)) return;
            tw.tempRatios = tw.ratios.slice();
            if (pitchNumber1 === pitchNumber2) {
                for (let i = 0; i < numDivs; i++) {
                    ratio[i] = Math.pow(tw.powerBase, i / numDivs);
                }
                tw.tempRatios = ratio.slice(0, numDivs);
                tw.tempRatios.sort(function (a, b) {
                    return a - b;
                });
                pitchNumber = tw.tempRatios.length;
                tw.typeOfEdit = "equal";
                tw.divisions = numDivs;
            } else {
                pitchNumber = numDivs + Number(pitchNumber) - Math.abs(pitchNumber1 - pitchNumber2);
                const angle1 =
                    270 +
                    360 * (Math.log10(tw.tempRatios[pitchNumber1]) / Math.log10(tw.powerBase));
                const angle2 =
                    270 +
                    360 * (Math.log10(tw.tempRatios[pitchNumber2]) / Math.log10(tw.powerBase));
                const divisionAngle = Math.abs(angle2 - angle1) / numDivs;
                tw.tempRatios.splice(pitchNumber1 + 1, Math.abs(pitchNumber1 - pitchNumber2) - 1);
                for (let i = 0; i < numDivs - 1; i++) {
                    const power = (Math.min(angle1, angle2) + divisionAngle * (i + 1) - 270) / 360;
                    ratio[i] = Math.pow(tw.powerBase, power);
                    tw.tempRatios.splice(pitchNumber1 + 1 + i, 0, ratio[i]);
                    compareRatios[i] = tw.tempRatios[i].toFixed(2);
                }
                tw.typeOfEdit = "nonequal";
            }

            if (event.target.textContent === _("done")) {
                _commitEqualEdit(tw, pitchNumber, compareRatios);
            } else if (event.target.textContent === _("preview")) {
                _mountPreviewWheel(tw, pitchNumber, addDivision, "80px");

                const ratios = tw.tempRatios.slice();
                const freq = tw.frequencies[0];
                tw.eqTempHzs = tw.computeFrequencies(ratios, freq, pitchNumber);
                tw.eqTempPitchNumber = pitchNumber;
                tw.checkTemperament(compareRatios);

                docById("done_").onclick = function () {
                    tw.eqTempPitchNumber = null;
                    tw.eqTempHzs = [];
                    _commitEqualEdit(tw, pitchNumber, compareRatios);
                };

                docById("preview").onclick = function () {
                    TemperamentUI.equalEdit(tw);
                    tw.eqTempPitchNumber = null;
                    tw.eqTempHzs = [];
                };
            }
        };
    },

    /**
     * Enters the ratio edit mode, rendering ratio and recursion inputs and preview/done controls.
     * Note: Lives in TemperamentUI.js as part of the view split (issue #8815) because it
     * manages edit form DOM construction, preview wheel mounting, and user commit callbacks.
     * @param {TemperamentWidget} tw - The TemperamentWidget instance.
     * @returns {void}
     */
    ratioEdit(tw) {
        tw.editMode = "ratio";
        docById("userEdit").textContent = "";
        const ratioEdit = docById("userEdit");
        ratioEdit.style.backgroundColor = platformColor.selectorBackground || "#c8C8C8";
        ratioEdit.appendChild(document.createElement("br"));
        ratioEdit.appendChild(document.createTextNode(_("ratio") + " \u00A0\u00A0\u00A0\u00A0 "));
        const ratioIn = document.createElement("input");
        ratioIn.type = "text";
        ratioIn.id = "ratioIn";
        ratioIn.value = "1";
        ratioEdit.appendChild(ratioIn);
        ratioEdit.appendChild(document.createTextNode(" \u00A0\u00A0 : \u00A0\u00A0 "));
        const ratioOut = document.createElement("input");
        ratioOut.type = "text";
        ratioOut.id = "ratioOut";
        ratioOut.value = "1";
        ratioEdit.appendChild(ratioOut);
        ratioEdit.appendChild(document.createElement("br"));
        ratioEdit.appendChild(document.createElement("br"));
        ratioEdit.appendChild(
            document.createTextNode(_("recursion") + " \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 ")
        );
        const recursion = document.createElement("input");
        recursion.type = "number";
        recursion.min = "1";
        recursion.max = "56";
        recursion.id = "recursion";
        recursion.value = "1";
        ratioEdit.appendChild(recursion);
        ratioEdit.style.paddingLeft = "100px";

        const divAppend = document.createElement("div");

        /**
         * Renders the preview/done button pair for ratio editing.
         * @param {boolean} preview - Whether preview mode is currently active.
         * @returns {void}
         */
        function addButtons(preview) {
            _addPreviewDoneButtonPair(divAppend, ratioEdit, "-100px", preview);
        }

        addButtons(false);
        _setPointerCursor(divAppend);

        divAppend.onclick = function (event) {
            if (!docById("ratioIn")) return;
            const input1 = docById("ratioIn").value;
            const input2 = docById("ratioOut").value;
            const rec = docById("recursion").value;
            const len = tw.frequencies.length;
            const ratio1 = input1 / input2;
            if (
                !isFinite(input1) ||
                !isFinite(input2) ||
                input1 <= 0 ||
                input2 <= 0 ||
                !isFinite(ratio1) ||
                ratio1 <= 0 ||
                ratio1 >= tw.powerBase ||
                input2 > input1 * tw.powerBase
            ) {
                tw.activity.errorMsg(
                    _("Please enter a valid ratio (e.g. 3:2) within the octave space."),
                    3000
                );
                return;
            }
            const ratio = [];
            const frequency = [];
            const ratioDifference = [];
            const index = [];
            tw.tempRatios = tw.ratios.slice();

            /**
             * Recursively folds generated ratios into the active octave space.
             * @param {number} i - The current recursion step index.
             * @returns {void}
             */
            const calculateRatios = function (i) {
                if (frequency[i] < tw.frequencies[len - 1]) {
                    for (let j = 0; j < tw.tempRatios.length; j++) {
                        ratioDifference[j] = ratio[i] - tw.tempRatios[j];
                        if (ratioDifference[j] < 0) {
                            index.push(j);
                            tw.tempRatios.splice(index[i], 0, ratio[i]);
                            break;
                        }
                        if (ratioDifference[j] === 0) {
                            index.push(j);
                            tw.tempRatios.splice(index[i], 1, ratio[i]);
                            break;
                        }
                    }
                } else {
                    ratio[i] = ratio[i] / 2;
                    frequency[i] = tw.frequencies[0] * ratio[i];
                    calculateRatios(i);
                }
            };

            for (let i = 0; i < rec; i++) {
                ratio[i] = Math.pow(ratio1, i + 1);
                frequency[i] = tw.frequencies[0] * ratio[i];
                calculateRatios(i);
            }
            tw.tempRatios.sort(function (a, b) {
                return a - b;
            });
            if (tw.overDivisionCap(tw.activity, tw.tempRatios.length)) return;
            const pitchNumber = tw.tempRatios.length;
            if (event.target.textContent === _("done")) {
                tw.ratios = tw.tempRatios.slice();
                tw.typeOfEdit = "nonequal";
                tw.pitchNumber = tw.ratios.length;
                const frequency1 = tw.frequencies[0];
                tw.frequencies = tw.computeFrequencies(tw.ratios, frequency1, tw.pitchNumber);
                const compareRatios = _buildCompareRatios(tw.ratios);
                tw.checkTemperament(compareRatios);
                tw._visualizerView();
            } else if (event.target.textContent === _("preview")) {
                _mountPreviewWheel(tw, pitchNumber, addButtons, "100px");

                const ratios = tw.tempRatios.slice();
                tw.typeOfEdit = "nonequal";
                tw.NEqTempPitchNumber = ratios.length;
                const frequency1 = tw.frequencies[0];
                tw.NEqTempHzs = tw.computeFrequencies(ratios, frequency1, tw.NEqTempPitchNumber);
                const compareRatios = _buildCompareRatios(ratios);
                tw.checkTemperament(compareRatios);

                docById("done_").onclick = function () {
                    tw.ratios = tw.tempRatios.slice();
                    tw.pitchNumber = tw.ratios.length;
                    const frequencyDone = tw.frequencies[0];
                    tw.frequencies = tw.computeFrequencies(
                        tw.ratios,
                        frequencyDone,
                        tw.pitchNumber
                    );
                    const compareRatiosDone = _buildCompareRatios(tw.ratios);
                    tw.checkTemperament(compareRatiosDone);
                    tw._visualizerView();
                    tw.NEqTempPitchNumber = null;
                    tw.NEqTempHzs = [];
                };

                docById("preview").onclick = function () {
                    TemperamentUI.ratioEdit(tw);
                    tw.NEqTempPitchNumber = null;
                    tw.NEqTempHzs = [];
                };
            }
        };
    },

    /**
     * Enters the arbitrary edit mode, rendering interactive inner and outer wheels on canvas.
     * Note: Lives in TemperamentUI.js as part of the view split (issue #8815) because it
     * coordinates multi-wheel DOM layout, 2D canvas circle rendering, and slice editing.
     * @param {TemperamentWidget} tw - The TemperamentWidget instance.
     * @returns {void}
     */
    arbitraryEdit(tw) {
        tw.editMode = "arbitrary";
        docById("userEdit").textContent = "";
        const arbitraryEdit = docById("userEdit");
        arbitraryEdit.appendChild(document.createElement("br"));
        const wheelDiv3 = document.createElement("div");
        wheelDiv3.id = "wheelDiv3";
        wheelDiv3.className = "wheelNav";
        arbitraryEdit.appendChild(wheelDiv3);
        arbitraryEdit.style.paddingLeft = "0px";

        const radius = INNER_WHEEL_RADIUS;
        const height = 2 * radius;
        tw.tempRatios1 = tw.ratios.slice();

        const wheelDiv4 = document.createElement("div");
        wheelDiv4.id = "wheelDiv4";
        wheelDiv4.className = "wheelNav";
        arbitraryEdit.appendChild(wheelDiv4);
        TemperamentUI.createInnerWheel(tw);

        const canvas1 = document.createElement("canvas");
        canvas1.id = "circ1";
        canvas1.setAttribute("width", BUTTONDIVWIDTH);
        canvas1.setAttribute("height", height);
        arbitraryEdit.appendChild(canvas1);

        const canvas = docById("circ1");
        canvas.style.position = "absolute";
        canvas.style.zIndex = 1;
        canvas.style.marginTop = "-305px";
        const ctx = canvas.getContext("2d");
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(204, 0, 102, 0)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = platformColor.strokeColor || "#003300";
        ctx.stroke();

        TemperamentUI.createOuterWheel(tw);

        const divAppend = _createDoneButton(arbitraryEdit);

        divAppend.onclick = function () {
            tw.ratios = tw.tempRatios1.slice();
            tw.typeOfEdit = "nonequal";
            tw.pitchNumber = tw.ratios.length;
            const frequency1 = tw.frequencies[0];
            tw.frequencies = tw.computeFrequencies(tw.ratios, frequency1, tw.ratios.length);
            const compareRatios = _buildCompareRatios(tw.ratios);
            tw.checkTemperament(compareRatios);
            tw._visualizerView();
        };
    },

    /**
     * Enters the octave space edit mode, rendering octave boundary inputs and done controls.
     * Note: Lives in TemperamentUI.js as part of the view split (issue #8815) because it
     * manages octave form DOM construction and user-driven octave space recalculations.
     * @param {TemperamentWidget} tw - The TemperamentWidget instance.
     * @returns {void}
     */
    octaveSpaceEdit(tw) {
        tw.editMode = "octave";
        docById("userEdit").textContent = "";
        const len = tw.ratios.length;
        const octaveRatio = tw.ratios[len - 1];
        const octaveSpaceEdit = docById("userEdit");
        octaveSpaceEdit.style.backgroundColor = platformColor.selectorBackground || "#c8C8C8";
        octaveSpaceEdit.appendChild(document.createElement("br"));
        octaveSpaceEdit.appendChild(document.createElement("br"));
        octaveSpaceEdit.appendChild(
            document.createTextNode(_("octave space") + " \u00A0\u00A0\u00A0\u00A0 ")
        );
        const startNote = document.createElement("input");
        startNote.type = "text";
        startNote.id = "startNote";
        startNote.value = octaveRatio;
        startNote.style.width = "50px";
        octaveSpaceEdit.appendChild(startNote);
        octaveSpaceEdit.appendChild(document.createTextNode(" \u00A0\u00A0 : \u00A0\u00A0 "));
        const endNote = document.createElement("input");
        endNote.type = "text";
        endNote.id = "endNote";
        endNote.value = "1";
        endNote.style.width = "50px";
        octaveSpaceEdit.appendChild(endNote);
        octaveSpaceEdit.appendChild(document.createElement("br"));
        octaveSpaceEdit.appendChild(document.createElement("br"));
        octaveSpaceEdit.style.paddingLeft = "70px";

        const divAppend = _createDoneButton(octaveSpaceEdit, "-70px");

        divAppend.onclick = function () {
            if (!docById("startNote") || !docById("endNote")) return;
            const startRatio = docById("startNote").value;
            const endRatio = docById("endNote").value;
            const ratio = startRatio / endRatio;
            if (ratio !== 2) {
                tw.activity.textMsg(
                    _("The octave ratio has changed. This changes temperament significantly."),
                    3000
                );
            }
            const powers = [];
            const compareRatios = [];
            const frequency = tw.frequencies[0];
            tw.frequencies = [];
            for (let i = 0; i < len; i++) {
                powers[i] = tw.pitchNumber * (Math.log10(tw.ratios[i]) / Math.log10(tw.powerBase));
                tw.ratios[i] = Math.pow(ratio, powers[i] / tw.pitchNumber);
                compareRatios[i] = tw.ratios[i].toFixed(2);
                tw.frequencies[i] = tw.ratios[i] * frequency;
                tw.frequencies[i] = tw.frequencies[i].toFixed(2);
            }
            tw.powerBase = ratio;
            tw.typeOfEdit = "nonequal";
            tw.checkTemperament(compareRatios);
            if (ratio !== 2) {
                tw.octaveChanged = true;
            }
            tw._visualizerView();
        };
    }
};

// Export for global use (browser)
if (typeof window !== "undefined") {
    window.TemperamentUI = TemperamentUI;
}

// Export for RequireJS/AMD
if (typeof define === "function" && define.amd) {
    define([], function () {
        return TemperamentUI;
    });
}

// Export for Node.js/CommonJS (for testing)
if (typeof module !== "undefined" && module.exports) {
    module.exports = TemperamentUI;
}
