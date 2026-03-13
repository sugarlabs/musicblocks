/* eslint-disable max-len */
// Copyright (c) 2014-23 Walter Bender
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

/*
   global

   _, platformColor, docById, Singer, slicePath, wheelnav,
   DEFAULTVOICE, getDrumName, getNote, MUSICALMODES last, SHARP, FLAT,
   PREVIEWVOLUME, DEFAULTVOLUME, MODE_PIE_MENUS, HelpWidget,
   INTERVALVALUES, INTERVALS, getDrumSynthName, getVoiceSynthName,
   getMunsellColor, COLORS40, frequencyToPitch, instruments,
   DOUBLESHARP, NATURAL, DOUBLEFLAT, EQUIVALENTACCIDENTALS,
   FIXEDSOLFEGE, NOTENAMES, FIXEDSOLFEGE, NOTENAMES, numberToPitch,
   nthDegreeToPitch, SOLFEGENAMES, buildScale, _THIS_IS_TURTLE_BLOCKS_,
   CHORDNAMES
*/

/*
     Globals location
     - lib/wheelnav
        slicePath, wheelnav
     - js/utils/musicutils.js
        FLAT, SHARP, DEFAULTVOICE, getDrumName, getNote, MODE_PIE_MENUS, MUSICALMODES, INTERVALVALUES,
        INTERVALS, getDrumSynthName, getVoiceSynthName, frequencyToPitch, DOUBLESHARP, NATURAL,
        DOUBLEFLAT, EQUIVALENTACCIDENTALS, FIXEDSOLFEGE, NOTENAMES, FIXEDSOLFEGE, NOTENAMES, numberToPitch,
        nthDegreeToPitch, SOLFEGENAMES, buildScale

     - js/utils/utils.js
        _, last, docById
     - js/turtle-singer.js
        Singer
     - js/utils/munsell.js
        getMunsellColor, COLORS40
     - js/widgets/help.js
        HelpWidget
     - js/utils/platformstyle.js
        platformColorcl
     - js/utils/synthutils.js
        instruments
     - js/logo.js
        PREVIEWVOLUME, DEFAULTVOLUME
 */

/*
   exported

   piemenuModes, piemenuPitches, piemenuCustomNotes, piemenuGrid,
   piemenuBlockContext, piemenuIntervals, piemenuVoices, piemenuBoolean,
   piemenuBasic, piemenuColor, piemenuNumber, piemenuNthModalPitch,
   piemenuNoteValue, piemenuAccidentals, piemenuKey, piemenuChords,
   piemenuDissectNumber
*/

/**
 * Sets the pie menu container size based on the viewport width.
 * Uses the base diameter and scales down for smaller screens.
 * @param diameter Base diameter of the wheel in pixels
 * @returns void
 */
const setWheelSize = (i = 400) => {
    const wheelDiv = document.getElementById("wheelDiv");
    const screenWidth = window.innerWidth;

    if (!wheelDiv) return;

    wheelDiv.style.position = "absolute";
    wheelDiv.style.zIndex = "20000"; // Set z-index higher than floating windows (10000)

    if (screenWidth >= 1200) {
        wheelDiv.style.width = i + "px";
        wheelDiv.style.height = i + "px";
    } else if (screenWidth >= 768) {
        wheelDiv.style.width = i - 50 + "px";
        wheelDiv.style.height = i - 50 + "px";
    } else {
        wheelDiv.style.width = i - 100 + "px";
        wheelDiv.style.height = i - 100 + "px";
    }

    wheelDiv.style.height = wheelDiv.style.width;
};

/**
 * Computes an appropriate pie menu size based on the turtle canvas bounds.
 *
 * @param block Block instance owning the pie menu
 * @returns Minimum of the canvas width and height
 */
const getPieMenuSize = block => {
    const canvas = block.blocks.turtles._canvas;
    return Math.min(canvas.width, canvas.height);
};

// Debounce resize handler for performance
let wheelResizeTimeout;
const debouncedSetWheelSize = () => {
    clearTimeout(wheelResizeTimeout);
    wheelResizeTimeout = setTimeout(setWheelSize, 150);
};

// Call the function initially and whenever the window is resized
setWheelSize();
window.addEventListener("resize", debouncedSetWheelSize);

/**
 * Enables mouse-wheel scrolling to rotate a wheelnav instance
 * without triggering sound previews.
 *
 * @param wheel Wheelnav instance to rotate
 * @param itemCount Total number of selectable items in the wheel
 * @returns void
 */
const enableWheelScroll = (wheel, itemCount) => {
    const wheelDiv = document.getElementById("wheelDiv");
    if (!wheelDiv || !wheel) return;

    // Remove existing scroll handler if any
    if (wheelDiv._scrollHandler) {
        wheelDiv.removeEventListener("wheel", wheelDiv._scrollHandler);
    }

    let isScrolling = false;
    let scrollTimeout = null;

    const scrollHandler = event => {
        event.preventDefault();
        event.stopPropagation();

        // Throttle the scroll events (only process every 150ms)
        if (isScrolling) return;
        isScrolling = true;

        // Calculate the direction and amount to rotate
        const delta = event.deltaY > 0 ? 1 : -1;

        // Get current selected index
        const currentIndex = wheel.selectedNavItemIndex;

        // Calculate next index (with wrapping)
        let nextIndex = currentIndex + delta;
        if (nextIndex < 0) {
            nextIndex = itemCount - 1;
        } else if (nextIndex >= itemCount) {
            nextIndex = 0;
        }

        // Temporarily disable all navigate functions to prevent sound previews
        const originalFunctions = [];
        for (let i = 0; i < wheel.navItems.length; i++) {
            originalFunctions[i] = wheel.navItems[i].navigateFunction;
            wheel.navItems[i].navigateFunction = null;
        }

        // Navigate to the next item
        wheel.navigateWheel(nextIndex);

        // Restore navigate functions after a short delay
        setTimeout(() => {
            for (let i = 0; i < wheel.navItems.length; i++) {
                wheel.navItems[i].navigateFunction = originalFunctions[i];
            }
        }, 50);

        // Reset throttle after 150ms
        setTimeout(() => {
            isScrolling = false;
        }, 150);
    };

    // Store the handler so we can remove it later
    wheelDiv._scrollHandler = scrollHandler;
    wheelDiv.addEventListener("wheel", scrollHandler, { passive: false });
};

// Ensure exit wheels behave like stateless buttons (no sticky selection)
const configureExitWheel = exitWheel => {
    if (!exitWheel || !exitWheel.navItems) {
        return;
    }

    const clearSelection = () => {
        exitWheel.selectedNavItemIndex = null;
        for (let i = 0; i < exitWheel.navItems.length; i++) {
            exitWheel.navItems[i].selected = false;
            exitWheel.navItems[i].hovered = false;
        }
        if (exitWheel.raphael && exitWheel.raphael.canvas) {
            exitWheel.refreshWheel(true);
        }
    };

    clearSelection();

    exitWheel.navigateWheel = clicked => {
        const item = exitWheel.navItems[clicked];
        if (!item || item.enabled === false) {
            return;
        }
        clearSelection();
        if (typeof item.navigateFunction === "function") {
            item.navigateFunction();
        }
    };
};

/**
 * Builds the pitch selection pie menu with optional accidentals
 * and an optional octave wheel.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {string[]} noteLabels Labels shown in the pitch wheel
 * @param {string[]} noteValues Values mapped to labels
 * @param {Array} accidentals Accidental labels/values for the inner wheel
 * @param {string} note Currently selected note value
 * @param {string} accidental Currently selected accidental
 * @param {boolean} [custom=false] Whether to use the custom-note layout
 * @returns {void}
 */
const piemenuPitches = (block, noteLabels, noteValues, accidentals, note, accidental, custom) => {
    let prevPitch = null;
    // wheelNav pie menu for pitch selection
    if (block.blocks.stageClick) {
        return;
    }

    if (custom === undefined) {
        custom = false;
    }

    // Some blocks have both pitch and octave, so we can modify
    // both at once.
    const hasOctaveWheel =
        block.connections[0] !== null &&
        ["pitch", "setpitchnumberoffset", "invert1", "tofrequency"].includes(
            block.blocks.blockList[block.connections[0]].name
        );

    // If we are attached to a set key block, we want to order
    // pitch by fifths.
    if (
        block.connections[0] !== null &&
        ["setkey", "setkey2"].includes(block.blocks.blockList[block.connections[0]].name)
    ) {
        noteLabels = ["C", "G", "D", "A", "E", "B", "F"];
        noteValues = ["C", "G", "D", "A", "E", "B", "F"];
    }

    const wheelDiv = docById("wheelDiv");
    wheelDiv.style.display = ""; // Show the div but keep it invisible initially
    wheelDiv.style.opacity = "0";

    // The pitch selector
    const wheelSize = getPieMenuSize(block);
    block._pitchWheel = new wheelnav("wheelDiv", null, wheelSize, wheelSize);

    if (!custom) {
        // The accidental selector
        block._accidentalsWheel = new wheelnav("_accidentalsWheel", block._pitchWheel.raphael);
    }
    // The octave selector
    if (hasOctaveWheel) {
        block._octavesWheel = new wheelnav("_octavesWheel", block._pitchWheel.raphael);
    }

    // The exit button
    block._exitWheel = new wheelnav("_exitWheel", block._pitchWheel.raphael);

    wheelnav.cssMode = true;

    block._pitchWheel.keynavigateEnabled = false;

    block._pitchWheel.colors = platformColor.pitchWheelcolors;
    block._pitchWheel.slicePathFunction = slicePath().DonutSlice;
    block._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._pitchWheel.slicePathCustom.minRadiusPercent = 0.2;
    if (!custom) {
        block._pitchWheel.slicePathCustom.maxRadiusPercent = 0.5;
    } else {
        block._pitchWheel.slicePathCustom.maxRadiusPercent = 0.75;
    }

    block._pitchWheel.sliceSelectedPathCustom = block._pitchWheel.slicePathCustom;
    block._pitchWheel.sliceInitPathCustom = block._pitchWheel.slicePathCustom;

    block._pitchWheel.animatetime = 0; // 300;
    block._pitchWheel.createWheel(noteLabels);

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", " "]);
    block._exitWheel.navItems[1].enabled = false;
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    if (!custom) {
        block._accidentalsWheel.colors = platformColor.accidentalsWheelcolors;
        block._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
        block._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        block._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.5;
        block._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
        block._accidentalsWheel.sliceSelectedPathCustom = block._accidentalsWheel.slicePathCustom;
        block._accidentalsWheel.sliceInitPathCustom = block._accidentalsWheel.slicePathCustom;

        const accidentalLabels = [];
        for (let i = 0; i < accidentals.length; i++) {
            accidentalLabels.push(accidentals[i]);
        }

        for (let i = 0; i < 9; i++) {
            accidentalLabels.push(null);
            block._accidentalsWheel.colors.push(platformColor.accidentalsWheelcolorspush);
        }

        block._accidentalsWheel.animatetime = 0; // 300;
        block._accidentalsWheel.createWheel(accidentalLabels);
        block._accidentalsWheel.setTooltips([
            _("double sharp"),
            _("sharp"),
            _("natural"),
            _("flat"),
            _("double flat")
        ]);
    }

    if (hasOctaveWheel) {
        block._octavesWheel.colors = platformColor.octavesWheelcolors;
        block._octavesWheel.slicePathFunction = slicePath().DonutSlice;
        block._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        block._octavesWheel.slicePathCustom.minRadiusPercent = 0.75;
        block._octavesWheel.slicePathCustom.maxRadiusPercent = 0.95;
        block._octavesWheel.sliceSelectedPathCustom = block._octavesWheel.slicePathCustom;
        block._octavesWheel.sliceInitPathCustom = block._octavesWheel.slicePathCustom;
        const octaveLabels = [
            "8",
            "7",
            "6",
            "5",
            "4",
            "3",
            "2",
            "1",
            null,
            null,
            null,
            null,
            null,
            null
        ];
        block._octavesWheel.animatetime = 0; // 300;
        block._octavesWheel.createWheel(octaveLabels);
    }

    // Position the widget over the note block.
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    const displaySize = 400;
    setWheelSize(displaySize);
    const halfWheelSize = displaySize / 2;
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - displaySize,
            Math.max(
                0,
                Math.round(
                    (x + block.activity.blocksContainer.x) * block.activity.getStageScale() +
                    canvasLeft
                ) - halfWheelSize
            )
        ) + "px";
    docById("wheelDiv").style.top =
        Math.min(
            block.blocks.turtles._canvas.height - displaySize,
            Math.max(
                0,
                Math.round(
                    (y + block.activity.blocksContainer.y) * block.activity.getStageScale() +
                    canvasTop
                ) - halfWheelSize
            )
        ) + "px";

    // Navigate to a the current note value.
    let i = noteValues.indexOf(note);
    if (i === -1) {
        if (custom) {
            i = 0;
        } else {
            i = 4;
        }
    }

    prevPitch = i;

    block._pitchWheel.navigateWheel(i);

    const OFFSET = {
        major: 1,
        dorian: 2,
        phrygian: 3,
        lydian: 4,
        mixolydian: 5,
        minor: 6,
        locrian: 7
    };

    const ROTATION = { A: 2, B: 1, C: 0, D: 6, E: 5, F: 4, G: 3 };

    const k = OFFSET[block.activity.KeySignatureEnv[1]];

    let key;
    const attrList = ["", SHARP, FLAT];
    for (const j in attrList) {
        for (const i in NOTENAMES) {
            const tempScale = buildScale(NOTENAMES[i] + attrList[j] + " major")[0];
            if (tempScale[k - 1] === block.activity.KeySignatureEnv[0]) {
                key = NOTENAMES[i] + attrList[j];
                break;
            }
        }
        if (key !== undefined) {
            break;
        }
    }
    let scale = buildScale(key + " major")[0];
    scale = scale.splice(0, scale.length - 1);

    for (let j = 0; j < ROTATION[key[0]]; j++) {
        scale.push(scale.shift());
    }

    // Auto-selection of sharps and flats in fixed solfege handles the
    // case of opening the pie-menu, not whilst in the pie-menu.
    // Skip auto-selection if user already has a non-natural accidental (Issue #4886).
    const pitchHasAccidental = accidental !== "" && accidental !== NATURAL;
    if (
        !pitchHasAccidental &&
        ((!block.activity.KeySignatureEnv[2] && block.name === "solfege") ||
            (block.name === "notename" &&
                (block.connections[0] != undefined
                    ? !["setkey", "setkey2"].includes(
                        block.blocks.blockList[block.connections[0]].name
                    )
                    : true)))
    ) {
        if (scale[6 - i][0] === FIXEDSOLFEGE[note] || scale[6 - i][0] === note) {
            accidental = scale[6 - i].substr(1);
        } else {
            accidental = EQUIVALENTACCIDENTALS[scale[6 - i]].substr(1);
        }
        block.value = block.value
            .replace(SHARP, "")
            .replace(FLAT, "")
            .replace(DOUBLESHARP, "")
            .replace(DOUBLEFLAT, "");
        block.value += accidental;
        block.text.text = block.value;
    }

    if (!custom) {
        // Navigate to the current accidental value.
        // Use the accidental parameter directly - it's already correctly parsed from block value.
        let accidentalIndex = 2; // Default to "natural"
        if (accidental === DOUBLESHARP) {
            accidentalIndex = 0;
        } else if (accidental === SHARP) {
            accidentalIndex = 1;
        } else if (accidental === NATURAL || accidental === "") {
            accidentalIndex = 2;
        } else if (accidental === FLAT) {
            accidentalIndex = 3;
        } else if (accidental === DOUBLEFLAT) {
            accidentalIndex = 4;
        }
        block._accidentalsWheel.navigateWheel(accidentalIndex);
    }

    if (hasOctaveWheel) {
        // Use the octave associated with block block, if available.
        const pitchOctave = block.blocks.findPitchOctave(block.connections[0]);

        // Navigate to current octave.
        block._octavesWheel.navigateWheel(8 - pitchOctave);
        // const prevOctave = 8 - pitchOctave;
    }

    // Now that everything is set up, make the wheel visible with a smooth transition
    wheelDiv.style.transition = "opacity 0.15s ease-in";
    setTimeout(() => {
        wheelDiv.style.opacity = "1";
    }, 50);

    // Set up event handlers.
    const that = block;
    const selection = {
        note: note,
        attr: accidental
    };

    /*
     * Preview the selected pitch using the synth
     * @return{void}
     * @private
     */
    const __pitchPreview = async () => {
        try {
            // Ensure audio context is initialized first
            await setupAudioContext();

            // Ensure synth is initialized before proceeding
            if (!that.activity.logo.synth) {
                that.activity.logo.synth = new Synth();
            }

            // Always ensure tone is initialized
            if (!that.activity.logo.synth.tone) {
                that.activity.logo.synth.newTone();
            }

            const label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
            const i = noteLabels.indexOf(label);

            // Are we wrapping across C? We need to compare with the previous pitch
            if (prevPitch === null) {
                prevPitch = i;
            }

            const deltaPitch = i - prevPitch;
            let delta;
            if (deltaPitch > 3) {
                delta = deltaPitch - 7;
            } else if (deltaPitch < -3) {
                delta = deltaPitch + 7;
            } else {
                delta = deltaPitch;
            }

            // If we wrapped across C, we need to adjust the octave.
            let deltaOctave = 0;
            if (prevPitch + delta > 6) {
                deltaOctave = -1;
            } else if (prevPitch + delta < 0) {
                deltaOctave = 1;
            }
            let attr;
            prevPitch = i;
            let note = noteValues[i];
            if (!custom) {
                attr =
                    that._accidentalsWheel.navItems[that._accidentalsWheel.selectedNavItemIndex]
                        .title;
                if (label === " ") {
                    return;
                } else if (attr !== "♮") {
                    note += attr;
                }
            }

            let octave;
            if (hasOctaveWheel) {
                // Always use the current octave from the wheel
                octave = Number(
                    that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title
                );
            } else {
                octave = 4;
            }

            octave += deltaOctave;
            if (octave < 1) {
                octave = 1;
            } else if (octave > 8) {
                octave = 8;
            }

            // Store the final octave back in selection
            selection["octave"] = octave;

            if (hasOctaveWheel && deltaOctave !== 0) {
                that._octavesWheel.navigateWheel(8 - octave);
                that.blocks.setPitchOctave(that.connections[0], octave);
            }

            const keySignature =
                block.activity.KeySignatureEnv[0] + " " + block.activity.KeySignatureEnv[1];

            let obj;
            if (that.name == "scaledegree2") {
                note = note.replace(attr, "");
                note = SOLFEGENAMES[note - 1];
                note += attr;
                obj = getNote(
                    note,
                    octave,
                    0,
                    keySignature,
                    true,
                    null,
                    that.activity.errorMsg,
                    that.activity.logo.synth.inTemperament
                );
            } else {
                obj = getNote(
                    note,
                    octave,
                    0,
                    keySignature,
                    block.activity.KeySignatureEnv[2],
                    null,
                    that.activity.errorMsg,
                    that.activity.logo.synth.inTemperament
                );
            }
            if (!custom) {
                obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");
            }

            // Create and load synth if needed
            if (!instruments[0] || !instruments[0][DEFAULTVOICE]) {
                try {
                    that.activity.logo.synth.createDefaultSynth(0);
                    await that.activity.logo.synth.loadSynth(0, DEFAULTVOICE);
                } catch (e) {
                    return;
                }
            }

            // Ensure synth is properly initialized
            if (!that.activity.logo.synth.tone) {
                that.activity.logo.synth.newTone();
            }

            // Set volume
            try {
                that.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);
                that.activity.logo.synth.setVolume(0, DEFAULTVOICE, PREVIEWVOLUME);
            } catch (e) {
                return;
            }

            // Trigger note with proper error handling
            if (!that._triggerLock) {
                that._triggerLock = true;
                try {
                    await that.activity.logo.synth.trigger(
                        0,
                        [obj[0] + obj[1]],
                        1 / 8,
                        DEFAULTVOICE,
                        null,
                        null,
                        false
                    );
                } catch (e) {
                    // Ensure trigger lock is released after a delay
                    setTimeout(() => {
                        that._triggerLock = false;
                    }, 125); // 1/8 second in milliseconds
                }
            }
        } catch (e) {
            console.error("Error in pitch preview:", e);
        }
    };

    const __selectionChangedSolfege = () => {
        selection["note"] = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
        const i = noteLabels.indexOf(selection["note"]);
        that.value = noteValues[i];

        // Auto-selection of sharps and flats in fixed solfege handles
        // the case of opening the pie-menu, not whilst in the
        // pie-menu. FIXEDSOLFEGE converts solfege to alphabet, needed
        // for solfege pie-menu In. case of alphabet, direct comparison
        // is performed.
        if (
            (!block.activity.KeySignatureEnv[2] && that.name === "solfege") ||
            (that.name === "notename" &&
                (that.connections[0] != undefined
                    ? !["setkey", "setkey2"].includes(
                        that.blocks.blockList[that.connections[0]].name
                    )
                    : true))
        ) {
            let i = scale.indexOf(selection["note"]);
            if (i === -1) {
                i = scale.indexOf(that.value);
            }
            if (i === -1) {
                i = NOTENAMES.indexOf(FIXEDSOLFEGE[selection["note"]]);
            }
            if (i === -1) {
                i = NOTENAMES.indexOf(FIXEDSOLFEGE[that.value]);
            }
            if (
                NOTENAMES.includes(selection["note"]) ||
                scale[i][0] === FIXEDSOLFEGE[selection["note"]] ||
                scale[i][0] === FIXEDSOLFEGE[that.value] ||
                scale[i][0] === selection["note"]
            ) {
                selection["attr"] = scale[i].substr(1);
            } else {
                selection["attr"] = EQUIVALENTACCIDENTALS[scale[i]].substr(1);
            }
            switch (selection["attr"]) {
                case DOUBLEFLAT:
                    that._accidentalsWheel.navigateWheel(4);
                    break;
                case FLAT:
                    that._accidentalsWheel.navigateWheel(3);
                    break;
                case NATURAL:
                    that._accidentalsWheel.navigateWheel(2);
                    break;
                case SHARP:
                    that._accidentalsWheel.navigateWheel(1);
                    break;
                case DOUBLESHARP:
                    that._accidentalsWheel.navigateWheel(0);
                    break;
                default:
                    that._accidentalsWheel.navigateWheel(2);
                    break;
            }
        }
        that.text.text = selection["note"];
        if (selection["attr"] !== "♮") {
            that.text.text += selection["attr"];
        }

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();

        if (hasOctaveWheel) {
            // Set the octave of the pitch block, if available.
            const octave = Number(
                that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title
            );
            that.blocks.setPitchOctave(that.connections[0], octave);
            // Update the state with the current octave
            selection["octave"] = octave;
        }

        if (
            that.connections[0] !== null &&
            ["setkey", "setkey2"].includes(that.blocks.blockList[that.connections[0]].name)
        ) {
            // We may need to update the mode widget.
            that.activity.logo.modeBlock = that.blocks.blockList.indexOf(that);
        }
    };

    const __selectionChangedOctave = () => {
        const octave = Number(
            that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title
        );
        that.blocks.setPitchOctave(that.connections[0], octave);

        // Update the state before preview
        selection["octave"] = octave;
    };

    const __selectionChangedAccidental = () => {
        const i = that._pitchWheel.selectedNavItemIndex;
        selection["note"] = noteLabels[i];
        const selectedNoteValue = noteValues[i];

        selection["attr"] =
            that._accidentalsWheel.navItems[that._accidentalsWheel.selectedNavItemIndex].title;

        if (selection["attr"] === "♮") {
            that.text.text = selection["note"];
            that.value = selectedNoteValue;
        } else {
            that.value = selectedNoteValue + selection["attr"];
            that.text.text = selection["note"] + selection["attr"];
        }

        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();

        // Ensure we have the current octave
        if (hasOctaveWheel) {
            selection["octave"] = Number(
                that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title
            );
        }
    };

    // Set up handlers for pitch preview.
    const setupAudioContext = async () => {
        try {
            await Tone.start();
        } catch (e) {
            // Tone.start() may fail if the user has not interacted with the page yet
            // or if the audio context is already running. We can safely ignore this.
            console.debug("Tone.start() skipped or failed", e);
        }
    };

    const __selectionChangedSolfegeWithAudio = async () => {
        __selectionChangedSolfege();
    };

    const __selectionChangedOctaveWithAudio = async () => {
        __selectionChangedOctave();
    };

    const __selectionChangedAccidentalWithAudio = async () => {
        __selectionChangedAccidental();
    };

    // Set up handlers for pitch preview.
    const __previewWrapper = async () => {
        await setupAudioContext();
        if (!that.activity.logo.synth.tone) {
            that.activity.logo.synth.newTone();
        }
        await __pitchPreview();
    };

    for (let i = 0; i < noteValues.length; i++) {
        block._pitchWheel.navItems[i].navigateFunction = async () => {
            __selectionChangedSolfege();
            await __previewWrapper();
        };
    }

    if (!custom) {
        for (let i = 0; i < accidentals.length; i++) {
            block._accidentalsWheel.navItems[i].navigateFunction = async () => {
                __selectionChangedAccidental();
                await __previewWrapper();
            };
        }
    }

    if (hasOctaveWheel) {
        for (let i = 0; i < 8; i++) {
            block._octavesWheel.navItems[i].navigateFunction = async () => {
                __selectionChangedOctave();
                await __previewWrapper();
            };
        }
    }

    enableWheelScroll(block._pitchWheel, noteLabels.length);

    // Hide the widget when the exit button is clicked.
    block._exitWheel.navItems[0].navigateFunction = () => {
        that._piemenuExitTime = new Date().getTime();
        const selectedNote = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
        const selectedAccidental =
            !custom && that._accidentalsWheel
                ? that._accidentalsWheel.navItems[that._accidentalsWheel.selectedNavItemIndex].title
                : "";

        // Update the block's displayed text with the note and accidental
        const i = that._pitchWheel.selectedNavItemIndex;
        const selectedNoteValue = noteValues[i];

        if (selectedAccidental === "♮" || selectedAccidental === "") {
            // Natural or no accidental: display only the note
            that.text.text = selectedNote;
            that.value = selectedNoteValue;
        } else {
            // Combine note and accidental for display
            that.text.text = selectedNote + selectedAccidental;
            that.value = selectedNoteValue + selectedAccidental;
        }

        // Ensure proper layering of the text element
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        // Refresh the block's cache
        that.updateCache();
        // Hide the pie menu and remove the wheels
        docById("wheelDiv").style.display = "none";
        that._pitchWheel.removeWheel();
        if (!custom) {
            that._accidentalsWheel.removeWheel();
        }
        that._exitWheel.removeWheel();
        if (hasOctaveWheel) {
            that._octavesWheel.removeWheel();
        }
    };
};

/**
 * Builds the custom temperament pie menu with an optional octave wheel.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {Object} noteLabels Custom note label map keyed by temperament
 * @param {string[]} customLabels Identifiers for available custom sets
 * @param {string} selectedCustom Currently selected custom set key
 * @param {number|string} selectedNote Currently selected note within the set
 * @returns {void}
 */
const piemenuCustomNotes = (block, noteLabels, customLabels, selectedCustom, selectedNote) => {
    // pie menu for customNote selection
    if (block.blocks.stageClick) {
        return;
    }

    docById("wheelDiv").style.display = "";

    // Some blocks have both pitch and octave, so we can modify
    // both at once.
    const hasOctaveWheel =
        block.connections[0] !== null &&
        ["pitch", "setpitchnumberoffset", "invert1", "tofrequency"].includes(
            block.blocks.blockList[block.connections[0]].name
        );

    // Use advanced constructor for more wheelnav on same div
    block._customWheel = new wheelnav("wheelDiv", null, 800, 800);

    block._cusNoteWheel = new wheelnav("_cusNoteWheel", block._customWheel.raphael);
    // exit button
    block._exitWheel = new wheelnav("_exitWheel", block._customWheel.raphael);

    // the octave selector
    if (hasOctaveWheel) {
        block._octavesWheel = new wheelnav("_octavesWheel", block._customWheel.raphael);
    }

    wheelnav.cssMode = true;

    block._customWheel.keynavigateEnabled = false;

    //Customize slicePaths for proper size
    block._customWheel.colors = platformColor.intervalNameWheelcolors;
    block._customWheel.slicePathFunction = slicePath().DonutSlice;
    block._customWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._customWheel.slicePathCustom.minRadiusPercent = 0.1;
    block._customWheel.slicePathCustom.maxRadiusPercent = 0.5;
    block._customWheel.sliceSelectedPathCustom = block._customWheel.slicePathCustom;
    block._customWheel.sliceInitPathCustom = block._customWheel.slicePathCustom;
    block._customWheel.titleRotateAngle = 0;
    block._customWheel.animatetime = 0; // 300;
    block._customWheel.clickModeRotate = false;
    block._customWheel.createWheel(customLabels);

    block._cusNoteWheel.colors = platformColor.intervalWheelcolors;
    block._cusNoteWheel.slicePathFunction = slicePath().DonutSlice;
    block._cusNoteWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._cusNoteWheel.slicePathCustom.minRadiusPercent = 0.5;
    block._cusNoteWheel.slicePathCustom.maxRadiusPercent = 0.85;
    //block._cusNoteWheel.titleRotateAngle = 0;
    block._cusNoteWheel.titleFont = "100 24px Impact, sans-serif";
    block._cusNoteWheel.sliceSelectedPathCustom = block._cusNoteWheel.slicePathCustom;
    block._cusNoteWheel.sliceInitPathCustom = block._cusNoteWheel.slicePathCustom;

    if (hasOctaveWheel) {
        block._octavesWheel.colors = platformColor.octavesWheelcolors;
        block._octavesWheel.slicePathFunction = slicePath().DonutSlice;
        block._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        block._octavesWheel.slicePathCustom.minRadiusPercent = 0.85;
        block._octavesWheel.slicePathCustom.maxRadiusPercent = 1;
        block._octavesWheel.sliceSelectedPathCustom = block._octavesWheel.slicePathCustom;
        block._octavesWheel.sliceInitPathCustom = block._octavesWheel.slicePathCustom;
        const octaveLabels = [
            "8",
            "7",
            "6",
            "5",
            "4",
            "3",
            "2",
            "1",
            null,
            null,
            null,
            null,
            null,
            null
        ];
        block._octavesWheel.animatetime = 0; // 300;
        block._octavesWheel.createWheel(octaveLabels);
    }

    //Disable rotation, set navAngle and create the menus
    block._cusNoteWheel.clickModeRotate = false;
    block._cusNoteWheel.titleRotateAngle = 180;
    block._cusNoteWheel.animatetime = 0; // 300;
    const labelsDict = {};
    let labels = [];
    let blockCustom = 0;
    let max = 0;
    for (const t of customLabels) {
        max = max > noteLabels[t]["pitchNumber"] ? max : noteLabels[t]["pitchNumber"];
    }

    // There seems to be two different representations... maybe because
    // of some legacy projects restoring customTemperamentNotes
    for (const t of customLabels) {
        labelsDict[t] = [];
        for (const k in noteLabels[t]) {
            if (k !== "pitchNumber" && k !== "interval") {
                if (typeof noteLabels[t][k] === "number") {
                    // labels.push(k);
                    labelsDict[t].push(k);
                    blockCustom++;
                } else {
                    if (noteLabels[t][k].length === 3) {
                        // labels.push(noteLabels[t][k][1]);
                        labelsDict[t].push(noteLabels[t][k][1]);
                        blockCustom++;
                    } else {
                        for (let ii = 0; ii < noteLabels[t][k].length; ii++) {
                            // labels.push(noteLabels[t][k][ii][1]);
                            labelsDict[t].push(noteLabels[t][k][1]);
                            blockCustom++;
                        }
                    }
                }
            }
        }
        for (let extra = max - blockCustom; extra > 0; extra--) {
            // labels.push("");
        }
        blockCustom = 0;
    }
    if (!(selectedCustom in labelsDict)) {
        selectedCustom = labelsDict[0];
    }
    for (let i = 0; i < max; i++) {
        if (i < labelsDict[selectedCustom].length) {
            labels.push(labelsDict[selectedCustom][i]);
        } else {
            labels.push("");
        }
    }
    block._cusNoteWheel.navAngle = -(180 / customLabels.length) + 180 / labels.length;
    block._cusNoteWheel.createWheel(labels);

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.1;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", " "]);
    block._exitWheel.navItems[1].enabled = false;
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    // Avoid auto-selecting the close button on open.

    const that = block;

    // position widget
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(400);
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 400,
            Math.max(
                0,
                Math.round(
                    (x + block.activity.blocksContainer.x) * block.activity.getStageScale() +
                    canvasLeft
                ) - 200
            )
        ) + "px";
    docById("wheelDiv").style.top =
        Math.min(
            block.blocks.turtles._canvas.height - 450,
            Math.max(
                0,
                Math.round(
                    (y + block.activity.blocksContainer.y) * block.activity.getStageScale() +
                    canvasTop
                ) - 200
            )
        ) + "px";

    if (hasOctaveWheel) {
        // Use the octave associated with block block, if available.
        const pitchOctave = block.blocks.findPitchOctave(block.connections[0]);

        // Navigate to current octave
        block._octavesWheel.navigateWheel(8 - pitchOctave);
    }

    // Add function to each main menu for show/hide sub menus
    const __setupAction = i => {
        that._customWheel.navItems[i].navigateFunction = () => {
            that.customID =
                that._customWheel.navItems[that._customWheel.selectedNavItemIndex].title;
            labels = [];
            for (let ii = 0; ii < max; ii++) {
                if (ii < labelsDict[that._customWheel.navItems[i].title].length) {
                    labels.push(labelsDict[that._customWheel.navItems[i].title][ii]);
                } else {
                    labels.push("");
                }
            }
            // Update the navItems
            for (let ii = 0; ii < labels.length; ii++) {
                if (labels[ii].length === 0) {
                    that._cusNoteWheel.navItems[ii].navItem.hide();
                } else {
                    that._cusNoteWheel.navItems[ii].title = labels[ii];
                    that._cusNoteWheel.navItems[ii].navItem.title = labels[ii];
                    that._cusNoteWheel.navItems[ii].basicNavTitleMax.title = labels[ii];
                    that._cusNoteWheel.navItems[ii].basicNavTitleMin.title = labels[ii];
                    that._cusNoteWheel.navItems[ii].hoverNavTitleMax.title = labels[ii];
                    that._cusNoteWheel.navItems[ii].hoverNavTitleMin.title = labels[ii];
                    that._cusNoteWheel.navItems[ii].selectedNavTitleMax.title = labels[ii];
                    that._cusNoteWheel.navItems[ii].selectedNavTitleMin.title = labels[ii];
                    that._cusNoteWheel.navItems[ii].initNavTitle.title = labels[ii];
                    that._cusNoteWheel.navItems[ii].navItem.show();
                }
            }
            that._customWheel.refreshWheel();
            that._cusNoteWheel.navigateWheel(0);
        };
    };

    // Set up action for interval name so number tabs will
    // initialize on load.
    for (let ii = 0; ii < customLabels.length; ii++) {
        __setupAction(ii);
    }

    // navigate to a specific starting point

    let ii;
    for (ii = 0; ii < customLabels.length; ii++) {
        if (selectedCustom === customLabels[ii]) {
            break;
        }
    }

    if (ii === customLabels.length) {
        ii = 0;
    }

    block._customWheel.navigateWheel(ii);

    let j = selectedNote;
    for (const x in noteLabels[selectedCustom]) {
        if (x != "pitchNumber" && noteLabels[selectedCustom][x][1] == j) {
            j = +x;
            break;
        }
    }

    if (typeof j === "number" && !isNaN(j)) {
        block._cusNoteWheel.navigateWheel(max * customLabels.indexOf(selectedCustom) + j);
    }

    const __exitMenu = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
    };

    const __selectionChanged = () => {
        const label = that._customWheel.navItems[that._customWheel.selectedNavItemIndex].title;
        const note = that._cusNoteWheel.navItems[that._cusNoteWheel.selectedNavItemIndex].title;
        that.value = note;
        that.text.text = note;
        let octave = 4;

        if (hasOctaveWheel) {
            // Set the octave of the pitch block if available
            octave = Number(
                that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title
            );
            that.blocks.setPitchOctave(that.connections[0], octave);
        }

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();

        const obj = getNote(note, octave, 0, "C major", false, null, that.activity.errorMsg, label);
        const tur = that.activity.turtles.ithTurtle(0);

        if (!tur.singer.instrumentNames.includes(DEFAULTVOICE)) {
            that.activity.logo.synth.createDefaultSynth(0);
            that.activity.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);
        that.activity.logo.synth.setVolume(0, DEFAULTVOICE, PREVIEWVOLUME);

        if (!that._triggerLock) {
            that._triggerLock = true;
            // Get the frequency of the custom note for the preview.
            const no = that.activity.logo.synth.getCustomFrequency([note + obj[1]], that.customID);
            if (no !== undefined && no !== "undefined") {
                instruments[0][DEFAULTVOICE].triggerAttackRelease(no, 1 / 8);
            }
        }

        setTimeout(() => {
            that._triggerLock = false;
        }, 125); // 1/8 second in milliseconds
    };

    if (hasOctaveWheel) {
        for (let i = 0; i < 8; i++) {
            block._octavesWheel.navItems[i].navigateFunction = __selectionChanged;
        }
    }

    // Set up handlers for preview.
    for (let i = 0; i < labels.length; i++) {
        block._cusNoteWheel.navItems[i].navigateFunction = __selectionChanged;
    }

    block._exitWheel.navItems[0].navigateFunction = __exitMenu;
};

/**
 * Builds the scale-degree (nth modal pitch) pie menu.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {number[]} noteValues Scale degree values to display
 * @param {number} note Currently selected degree (rounded if fractional)
 * @returns {void}
 */
const piemenuNthModalPitch = (block, noteValues, note) => {
    // wheelNav pie menu for scale degree pitch selection

    // check if a non-integer value is connected to note argument
    // Pie menu would crash; so in such case navigate to closest integer

    if (note % 1 !== 0) {
        note = Math.floor(note + 0.5);
    }

    if (block.blocks.stageClick) {
        return;
    }

    const noteLabels = [];
    for (let i = 0; i < noteValues.length; i++) {
        noteLabels.push(noteValues[i].toString());
    }
    noteLabels.push(null);

    docById("wheelDiv").style.display = "";

    const wheelSize = getPieMenuSize(block);
    block._pitchWheel = new wheelnav("wheelDiv", null, wheelSize, wheelSize);
    block._octavesWheel = new wheelnav("_octavesWheel", block._pitchWheel.raphael);
    block._exitWheel = new wheelnav("_exitWheel", block._pitchWheel.raphael);

    wheelnav.cssMode = true;

    block._pitchWheel.keynavigateEnabled = false;

    block._pitchWheel.colors = platformColor.pitchWheelcolors;
    block._pitchWheel.slicePathFunction = slicePath().DonutSlice;
    block._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._pitchWheel.slicePathCustom.minRadiusPercent = 0.35;
    block._pitchWheel.slicePathCustom.maxRadiusPercent = 0.72;
    block._pitchWheel.sliceSelectedPathCustom = block._pitchWheel.slicePathCustom;
    block._pitchWheel.sliceInitPathCustom = block._pitchWheel.slicePathCustom;

    block._pitchWheel.animatetime = 0; // 300;
    block._pitchWheel.createWheel(noteLabels);

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", " "]);
    block._exitWheel.navItems[1].enabled = false;
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    block._octavesWheel.colors = platformColor.octavesWheelcolors;
    block._octavesWheel.slicePathFunction = slicePath().DonutSlice;
    block._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._octavesWheel.slicePathCustom.minRadiusPercent = 0.8;
    block._octavesWheel.slicePathCustom.maxRadiusPercent = 1.0;
    block._octavesWheel.sliceSelectedPathCustom = block._octavesWheel.slicePathCustom;
    block._octavesWheel.sliceInitPathCustom = block._octavesWheel.slicePathCustom;
    const octaveLabels = [
        "8",
        "7",
        "6",
        "5",
        "4",
        "3",
        "2",
        "1",
        null,
        null,
        null,
        null,
        null,
        null
    ];
    block._octavesWheel.animatetime = 0; // 300;
    block._octavesWheel.createWheel(octaveLabels);

    // enable changing values while pie-menu is open
    const labelElem = docById("labelDiv");
    labelElem.innerHTML = `<input id="numberLabel" style="position: absolute; -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text;" class="number" type="number" value="${note}" />`;
    labelElem.classList.add("hasKeyboard");

    block.label = docById("numberLabel");
    block.label.addEventListener("keypress", block._exitKeyPressed.bind(block));

    // Position the widget above/below note block.
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(300);
    const halfWheelSize = wheelSize / 2;

    const selectorWidth = 150;
    const left = Math.round(
        (x + block.activity.blocksContainer.x) * block.activity.getStageScale() + canvasLeft
    );
    const top = Math.round(
        (y + block.activity.blocksContainer.y) * block.activity.getStageScale() + canvasTop
    );
    block.label.style.left = left + "px";
    block.label.style.top = top + "px";

    docById("wheelDiv").style.left =
        Math.min(
            Math.max(left - (300 - selectorWidth) / 2, 0),
            block.blocks.turtles._canvas.width - 300
        ) + "px";

    if (top - 300 < 0) {
        docById("wheelDiv").style.top = top + 40 + "px";
    } else {
        docById("wheelDiv").style.top = top - 300 + "px";
    }

    block.label.style.width =
        (Math.round(selectorWidth * block.blocks.blockScale) * block.protoblock.scale) / 2 + "px";

    block.label.style.fontSize =
        Math.round((20 * block.blocks.blockScale * block.protoblock.scale) / 2) + "px";

    // Navigate to a the current note value.
    const i = noteValues.indexOf(note);

    block._pitchWheel.navigateWheel(i);

    // Use the octave associated with block block, if available.
    const pitchOctave = block.blocks.findPitchOctave(block.connections[0]);

    // Navigate to current octave
    block._octavesWheel.navigateWheel(8 - pitchOctave);

    // Set up event handlers
    const that = block;

    block.label.addEventListener("change", () => {
        that._labelChanged(false, false);
    });

    /*
     * Change selection and set value to notevalue
     * @return{void}
     * @private
     */
    const __selectionChanged = () => {
        const label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
        const i = noteLabels.indexOf(label);
        that.value = noteValues[i];
        that.text.text = label;

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();

        // Set the octave of the pitch block if available
        const octave = Number(
            that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title
        );
        that.blocks.setPitchOctave(that.connections[0], octave);
    };

    /*
     * Preview pitch
     * @return{void}
     * @private
     */
    const __pitchPreview = () => {
        const label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
        const i = noteLabels.indexOf(label);

        /* We're using a default of C major ==> -7 to -1 should be one octave lower
           than the reference, 0-6 in the same octave and 7 should be once octave higher
        */
        let deltaOctave;
        let note;

        // Use C major as of now; fix block to use current keySignature once that feature is in place
        const keySignature =
            block.activity.KeySignatureEnv[0] + " " + block.activity.KeySignatureEnv[1];
        if (noteValues[i] >= 0) {
            [note, deltaOctave] = nthDegreeToPitch(keySignature, noteValues[i]);
        } else {
            [note, deltaOctave] = nthDegreeToPitch(keySignature, 7 + noteValues[i]);
        }

        let octave = Number(
            that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title
        );
        octave += deltaOctave;
        if (octave < 1) {
            octave = 1;
        } else if (octave > 8) {
            octave = 8;
        }

        const tur = that.activity.turtles.ithTurtle(0);

        if (!tur.singer.instrumentNames.includes(DEFAULTVOICE)) {
            that.activity.logo.synth.createDefaultSynth(0);
            that.activity.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);
        that.activity.logo.synth.setVolume(0, DEFAULTVOICE, PREVIEWVOLUME);

        //Play sample note and prevent extra sounds from playing
        if (!that._triggerLock) {
            that._triggerLock = true;
            that.activity.logo.synth.trigger(
                0,
                [note.replace(SHARP, "#").replace(FLAT, "b") + octave],
                1 / 8,
                DEFAULTVOICE,
                null,
                null
            );
        }

        setTimeout(() => {
            that._triggerLock = false;
        }, 125); // 1/8 second in milliseconds

        __selectionChanged();
    };
    // Set up handlers for pitch preview.
    for (let i = 0; i < noteValues.length; i++) {
        block._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
    }

    for (let i = 0; i < 8; i++) {
        block._octavesWheel.navItems[i].navigateFunction = __pitchPreview;
    }

    // Hide the widget when the exit button is clicked.
    block._exitWheel.navItems[0].navigateFunction = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._pitchWheel.removeWheel();
        that._exitWheel.removeWheel();
        that._octavesWheel.removeWheel();
    };
};

/**
 * Builds the accidental selection pie menu.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {string[]} accidentalLabels Display labels for accidentals
 * @param {Array} accidentalValues Values mapped to labels
 * @param {*} accidental Currently selected accidental
 * @returns {void}
 */
const piemenuAccidentals = (block, accidentalLabels, accidentalValues, accidental) => {
    // wheelNav pie menu for accidental selection

    if (block.blocks.stageClick) {
        return;
    }

    docById("wheelDiv").style.display = "";

    // the accidental selector
    const wheelSize = getPieMenuSize(block);
    block._accidentalWheel = new wheelnav("wheelDiv", null, wheelSize, wheelSize);
    // exit button
    block._exitWheel = new wheelnav("_exitWheel", block._accidentalWheel.raphael);

    const labels = [];
    for (let i = 0; i < accidentalLabels.length; i++) {
        labels.push(last(accidentalLabels[i].split(" ")));
    }

    labels.push(null);

    wheelnav.cssMode = true;

    block._accidentalWheel.keynavigateEnabled = false;

    block._accidentalWheel.colors = platformColor.accidentalsWheelcolors;
    block._accidentalWheel.slicePathFunction = slicePath().DonutSlice;
    block._accidentalWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._accidentalWheel.slicePathCustom.minRadiusPercent = 0.2;
    block._accidentalWheel.slicePathCustom.maxRadiusPercent = 0.6;
    block._accidentalWheel.sliceSelectedPathCustom = block._accidentalWheel.slicePathCustom;
    block._accidentalWheel.sliceInitPathCustom = block._accidentalWheel.slicePathCustom;
    block._accidentalWheel.titleRotateAngle = 0;
    block._accidentalWheel.animatetime = 0; // 300;
    block._accidentalWheel.createWheel(labels);
    block._accidentalWheel.setTooltips(accidentalLabels);

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", " "]);
    block._exitWheel.navItems[1].enabled = false;
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    const that = block;

    const __selectionChanged = () => {
        const label =
            that._accidentalWheel.navItems[that._accidentalWheel.selectedNavItemIndex].title;
        const i = labels.indexOf(label);
        that.value = accidentalValues[i];
        that.text.text = accidentalLabels[i];

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
    };

    /*
     * Exit menu
     * @return{void}
     * @private
     */
    const __exitMenu = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._accidentalWheel.removeWheel();
        that._exitWheel.removeWheel();
    };

    // Position the widget over the note block.
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(300);
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 300,
            Math.max(
                0,
                Math.round(
                    (x + block.activity.blocksContainer.x) * block.activity.getStageScale() +
                    canvasLeft
                ) - 200
            )
        ) + "px";
    docById("wheelDiv").style.top =
        Math.min(
            block.blocks.turtles._canvas.height - 350,
            Math.max(
                0,
                Math.round(
                    (y + block.activity.blocksContainer.y) * block.activity.getStageScale() +
                    canvasTop
                ) - 200
            )
        ) + "px";

    // Navigate to a the current accidental value.
    let i = accidentalValues.indexOf(accidental);
    if (i === -1) {
        i = 2;
    }

    block._accidentalWheel.navigateWheel(i);

    // Hide the widget when the selection is made.
    for (let i = 0; i < accidentalLabels.length; i++) {
        block._accidentalWheel.navItems[i].navigateFunction = () => {
            __selectionChanged();
            __exitMenu();
        };
    }

    // Or use the exit wheel...
    block._exitWheel.navItems[0].navigateFunction = () => {
        __exitMenu();
    };
};

/**
 * Builds the note duration pie menu and its sub-wheel options.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {number} noteValue Currently selected duration value
 * @returns {void}
 */
const piemenuNoteValue = (block, noteValue) => {
    // input form and  wheelNav pie menu for note value selection

    if (block.blocks.stageClick) {
        return;
    }

    docById("wheelDiv").style.display = "";

    // We want powers of two on the bottom, nearest the input box
    // as it is most common.
    const WHEELVALUES = [3, 2, 7, 5];
    let subWheelValues = {
        2: [1, 2, 4, 8, 16, 32],
        3: [1, 3, 6, 9, 12, 27],
        5: [1, 5, 10, 15, 20, 25],
        7: [1, 7, 14, 21, 28, 35]
    };

    let cblk = block.connections[0];
    if (cblk !== null) {
        cblk = block.blocks.blockList[cblk].connections[0];
        if (
            cblk !== null &&
            ["neighbor", "neighbor2"].includes(block.blocks.blockList[cblk].name)
        ) {
            subWheelValues = {
                2: [8, 16, 32, 64],
                3: [9, 12, 27, 54],
                5: [10, 15, 20, 25],
                7: [14, 21, 28, 35]
            };
        }
    }

    // the noteValue selector
    const wheelSize = getPieMenuSize(block);
    block._noteValueWheel = new wheelnav("wheelDiv", null, wheelSize, wheelSize);
    // exit button
    block._exitWheel = new wheelnav("_exitWheel", block._noteValueWheel.raphael);
    // submenu wheel
    block._tabsWheel = new wheelnav("_tabsWheel", block._noteValueWheel.raphael);

    const noteValueLabels = [];
    for (let i = 0; i < WHEELVALUES.length; i++) {
        noteValueLabels.push(WHEELVALUES[i].toString());
    }

    wheelnav.cssMode = true;

    block._noteValueWheel.keynavigateEnabled = false;

    block._noteValueWheel.colors = platformColor.noteValueWheelcolors;
    block._noteValueWheel.slicePathFunction = slicePath().DonutSlice;
    block._noteValueWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._noteValueWheel.slicePathCustom.minRadiusPercent = 0.2;
    block._noteValueWheel.slicePathCustom.maxRadiusPercent = 0.6;
    block._noteValueWheel.sliceSelectedPathCustom = block._noteValueWheel.slicePathCustom;
    block._noteValueWheel.sliceInitPathCustom = block._noteValueWheel.slicePathCustom;
    block._noteValueWheel.animatetime = 0; // 300;
    block._noteValueWheel.clickModeRotate = false;
    block._noteValueWheel.createWheel(noteValueLabels);

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", " "]);
    block._exitWheel.navItems[1].enabled = false;
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    const tabsLabels = [];
    for (let i = 0; i < WHEELVALUES.length; i++) {
        for (let j = 0; j < subWheelValues[WHEELVALUES[i]].length; j++) {
            tabsLabels.push(subWheelValues[WHEELVALUES[i]][j].toString());
        }
    }

    block._tabsWheel.colors = platformColor.tabsWheelcolors;
    block._tabsWheel.slicePathFunction = slicePath().DonutSlice;
    block._tabsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._tabsWheel.slicePathCustom.minRadiusPercent = 0.6;
    block._tabsWheel.slicePathCustom.maxRadiusPercent = 0.8;
    block._tabsWheel.sliceSelectedPathCustom = block._tabsWheel.slicePathCustom;
    block._tabsWheel.sliceInitPathCustom = block._tabsWheel.slicePathCustom;
    block._tabsWheel.clickModeRotate = false;
    block._tabsWheel.navAngle =
        -180 / WHEELVALUES.length +
        180 / (WHEELVALUES.length * subWheelValues[WHEELVALUES[0]].length);
    block._tabsWheel.createWheel(tabsLabels);

    const that = block;

    /*
     * set value to number of text
     * @return{void}
     * @private
     */
    const __selectionChanged = () => {
        that.text.text = that._tabsWheel.navItems[that._tabsWheel.selectedNavItemIndex].title;
        that.value = Number(that.text.text);

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
    };

    /*
     * set pie menu's exit time to current time
     * @return{void}
     * @public
     */
    const __exitMenu = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._noteValueWheel.removeWheel();
        that._exitWheel.removeWheel();
        that.label.style.display = "none";
        if (that._check_meter_block !== null) {
            that.blocks.meter_block_changed(that._check_meter_block);
        }
    };

    const labelElem = docById("labelDiv");
    labelElem.innerHTML = `<input id="numberLabel" style="position: absolute; -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text;" class="number" type="number" value="${noteValue}" />`;
    labelElem.classList.add("hasKeyboard");
    block.label = docById("numberLabel");

    block.label.addEventListener("keypress", block._exitKeyPressed.bind(block));

    block.label.addEventListener("change", () => {
        that._labelChanged(false, false);
    });

    // Position the widget over the note block.
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(300);
    const halfWheelSize = wheelSize / 2;
    const selectorWidth = 150;
    const left = Math.round(
        (x + block.activity.blocksContainer.x) * block.activity.getStageScale() + canvasLeft
    );
    const top = Math.round(
        (y + block.activity.blocksContainer.y) * block.activity.getStageScale() + canvasTop
    );
    block.label.style.left = left + "px";
    block.label.style.top = top + "px";

    docById("wheelDiv").style.left =
        Math.min(
            Math.max(left - (halfWheelSize - selectorWidth / 2), 0),
            block.blocks.turtles._canvas.width - wheelSize
        ) + "px";
    if (top - wheelSize < 0) {
        docById("wheelDiv").style.top = top + 40 + "px";
    } else {
        docById("wheelDiv").style.top = top - wheelSize + "px";
    }

    block.label.style.width =
        (Math.round(selectorWidth * block.blocks.blockScale) * block.protoblock.scale) / 2 + "px";

    const __showHide = () => {
        // const i = that._noteValueWheel.selectedNavItemIndex;
        for (let k = 0; k < WHEELVALUES.length; k++) {
            for (let j = 0; j < subWheelValues[WHEELVALUES[0]].length; j++) {
                const n = k * subWheelValues[WHEELVALUES[0]].length;
                if (that._noteValueWheel.selectedNavItemIndex === k) {
                    that._tabsWheel.navItems[n + j].navItem.show();
                } else {
                    that._tabsWheel.navItems[n + j].navItem.hide();
                }
            }
        }
    };

    for (let i = 0; i < noteValueLabels.length; i++) {
        block._noteValueWheel.navItems[i].navigateFunction = __showHide;
    }

    // Navigate to a the current noteValue value.
    // Special case 1 to use power of 2.
    if (noteValue === 1) {
        block._noteValueWheel.navigateWheel(1);
        block._tabsWheel.navigateWheel(0);
    } else {
        let i;
        for (i = 0; i < WHEELVALUES.length; i++) {
            let j;
            for (j = 0; j < subWheelValues[WHEELVALUES[i]].length; j++) {
                if (subWheelValues[WHEELVALUES[i]][j] === noteValue) {
                    block._noteValueWheel.navigateWheel(i);
                    block._tabsWheel.navigateWheel(i * subWheelValues[WHEELVALUES[i]].length + j);
                    break;
                }
            }

            if (j < subWheelValues[WHEELVALUES[i]].length) {
                break;
            }
        }

        if (i === WHEELVALUES.length) {
            block._noteValueWheel.navigateWheel(1);
            block._tabsWheel.navigateWheel(2);
        }
    }

    block.label.style.fontSize =
        Math.round((20 * block.blocks.blockScale * block.protoblock.scale) / 2) + "px";
    block.label.style.display = "";
    block.label.focus();

    // Hide the widget when the selection is made.
    for (let i = 0; i < tabsLabels.length; i++) {
        block._tabsWheel.navItems[i].navigateFunction = () => {
            __selectionChanged();
            __exitMenu();
        };
    }

    // Or use the exit wheel...
    block._exitWheel.navItems[0].navigateFunction = () => {
        __exitMenu();
    };
};

/**
 * Builds the numeric value pie menu and synchronizes the selected value.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {number[]} wheelValues Values to show on the wheel
 * @param {number} selectedValue Currently selected value
 * @returns {void}
 */
const piemenuNumber = (block, wheelValues, selectedValue) => {
    // input form and  wheelNav pie menu for number selection
    if (block.blocks.stageClick) {
        return;
    }
    docById("wheelDiv").style.display = "";
    // the number selector
    const wheelSize = getPieMenuSize(block);
    block._numberWheel = new wheelnav("wheelDiv", null, wheelSize, wheelSize);
    // exit button
    block._exitWheel = new wheelnav("_exitWheel", block._numberWheel.raphael);
    const wheelLabels = [];
    for (let i = 0; i < wheelValues.length; i++) {
        wheelLabels.push(wheelValues[i].toString());
    }
    // spacer
    wheelLabels.push(null);

    wheelnav.cssMode = true;

    block._numberWheel.keynavigateEnabled = false;

    block._numberWheel.colors = platformColor.numberWheelcolors;
    block._numberWheel.slicePathFunction = slicePath().DonutSlice;
    block._numberWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    if (wheelValues.length > 16) {
        block._numberWheel.slicePathCustom.minRadiusPercent = 0.6;
        block._numberWheel.slicePathCustom.maxRadiusPercent = 1.0;
    } else if (wheelValues.length > 10) {
        block._numberWheel.slicePathCustom.minRadiusPercent = 0.5;
        block._numberWheel.slicePathCustom.maxRadiusPercent = 0.9;
    } else {
        block._numberWheel.slicePathCustom.minRadiusPercent = 0.2;
        block._numberWheel.slicePathCustom.maxRadiusPercent = 0.6;
    }

    block._numberWheel.sliceSelectedPathCustom = block._numberWheel.slicePathCustom;
    block._numberWheel.sliceInitPathCustom = block._numberWheel.slicePathCustom;
    if (
        block.blocks.blockList[block.connections[0]].name === "setbpm3" ||
        block.blocks.blockList[block.connections[0]].name === "setmasterbpm2"
    ) {
        block._numberWheel.titleRotateAngle = 0;
        if (selectedValue === 90) {
            selectedValue = 90;
        } else if (selectedValue < 40) {
            selectedValue = 40;
        } else if (selectedValue < 60) {
            selectedValue = Math.floor(block.value / 2) * 2;
        } else if (selectedValue < 72) {
            selectedValue = Math.floor(block.value / 3) * 3;
        } else if (selectedValue < 120) {
            selectedValue = Math.floor(block.value / 4) * 4;
        } else if (selectedValue < 144) {
            selectedValue = Math.floor(block.value / 6) * 6;
        } else if (selectedValue < 208) {
            selectedValue = Math.floor(block.value / 8) * 8;
        } else {
            selectedValue = 208;
        }
    } else if (block.blocks.blockList[block.connections[0]].name === "setheading") {
        // Set 0 (north) to the top of the wheel.
        block._numberWheel.navAngle = -90;
    }

    block._numberWheel.animatetime = 0; // 300;
    block._numberWheel.createWheel(wheelLabels);

    if (block._numberWheel.navItems.length > 20) {
        for (let i = 0; i < block._numberWheel.navItems.length; i++) {
            block._numberWheel.navItems[i].titleAttr.font = "30 30px sans-serif";
            block._numberWheel.navItems[i].titleSelectedAttr.font = "30 30px sans-serif";
        }
    }

    block._exitWheel.colors = platformColor.exitWheelcolors2;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", "-", "+"]);
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[1].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[1].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[1].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[1].titleHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[2].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[2].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[2].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[2].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    const that = block;

    const __selectionChanged = () => {
        that.value = wheelValues[that._numberWheel.selectedNavItemIndex];
        that.text.text = wheelLabels[that._numberWheel.selectedNavItemIndex];

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
    };

    const __exitMenu = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._numberWheel.removeWheel();
        that._exitWheel.removeWheel();
        that.label.style.display = "none";

        if (that._check_meter_block !== null) {
            that.blocks.meter_block_changed(that._check_meter_block);
        }
    };

    const labelElem = docById("labelDiv");
    labelElem.innerHTML = `<input id="numberLabel" style="position: absolute; -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text;" class="number" type="number" value="${selectedValue}" />`;
    labelElem.classList.add("hasKeyboard");
    block.label = docById("numberLabel");

    block.label.addEventListener("keypress", block._exitKeyPressed.bind(block));

    block.label.addEventListener("change", () => {
        that._labelChanged(false, false);
    });

    // Position the widget over the note block.
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(300);

    const selectorWidth = 150;
    const left = Math.round(
        (x + block.activity.blocksContainer.x) * block.activity.getStageScale() + canvasLeft
    );
    const top = Math.round(
        (y + block.activity.blocksContainer.y) * block.activity.getStageScale() + canvasTop
    );
    block.label.style.left = left + "px";
    block.label.style.top = top + "px";

    docById("wheelDiv").style.left =
        Math.min(
            Math.max(left - (300 - selectorWidth) / 2, 0),
            block.blocks.turtles._canvas.width - 300
        ) + "px";
    if (top - 300 < 0) {
        docById("wheelDiv").style.top = top + 40 + "px";
    } else {
        docById("wheelDiv").style.top = top - 300 + "px";
    }

    block.label.style.width =
        (Math.round(selectorWidth * block.blocks.blockScale) * block.protoblock.scale) / 2 + "px";
    // Navigate to a the current number value.
    let i = wheelValues.indexOf(selectedValue);
    if (i === -1 || selectedValue < 1 || selectedValue > 8) {
        selectedValue = Math.min(Math.max(selectedValue, 1), 8);
        i = wheelValues.indexOf(selectedValue);
    }
    // In case of float value, navigate to the nearest integer within the range
    if (selectedValue % 1 !== 0) {
        selectedValue = Math.min(Math.max(Math.floor(selectedValue + 0.5), 1), 8);
        i = wheelValues.indexOf(selectedValue);
    }
    if (i !== -1) {
        block._numberWheel.navigateWheel(i);
    }
    block.label.style.fontSize =
        Math.round((20 * block.blocks.blockScale * block.protoblock.scale) / 2) + "px";

    block.label.style.display = "";
    block.label.focus();
    // Hide the widget when the selection is made.
    for (let i = 0; i < wheelLabels.length; i++) {
        block._numberWheel.navItems[i].navigateFunction = () => {
            __selectionChanged();
            __exitMenu();
        };
    }
    // Or use the exit wheel...
    block._exitWheel.navItems[0].navigateFunction = () => {
        __exitMenu();
    };
    block._exitWheel.navItems[1].navigateFunction = () => {
        const index = wheelValues.indexOf(that.value);
        if (index === -1) return;

        const isAscending = wheelValues[0] < wheelValues[wheelValues.length - 1];

        if (isAscending) {
            if (index > 0) {
                that.value = wheelValues[index - 1];
            }
        } else {
            if (index < wheelValues.length - 1) {
                that.value = wheelValues[index + 1];
            }
        }

        that.text.text = that.value.toString();
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
        that.label.value = that.value;
    };

    block._exitWheel.navItems[2].navigateFunction = () => {
        const index = wheelValues.indexOf(that.value);
        if (index === -1) return;

        const isAscending = wheelValues[0] < wheelValues[wheelValues.length - 1];

        if (isAscending) {
            if (index < wheelValues.length - 1) {
                that.value = wheelValues[index + 1];
            }
        } else {
            if (index > 0) {
                that.value = wheelValues[index - 1];
            }
        }

        that.text.text = that.value.toString();
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
        that.label.value = that.value;
    };

    const __pitchPreviewForNum = () => {
        const label = that._numberWheel.navItems[that._numberWheel.selectedNavItemIndex].title;
        const i = wheelLabels.indexOf(label);
        const actualPitch = numberToPitch(wheelValues[i] + 3);
        const tur = that.activity.turtles.ithTurtle(0);
        if (!tur.singer.instrumentNames.includes(DEFAULTVOICE)) {
            that.activity.logo.synth.createDefaultSynth(0);
            that.activity.logo.synth.loadSynth(0, DEFAULTVOICE);
        }
        that.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);
        that.activity.logo.synth.setVolume(0, DEFAULTVOICE, PREVIEWVOLUME);
        actualPitch[0] = actualPitch[0].replace(SHARP, "#").replace(FLAT, "b");
        if (!that._triggerLock) {
            that._triggerLock = true;
            that.activity.logo.synth.trigger(
                0,
                actualPitch[0] + (actualPitch[1] + 3),
                1 / 8,
                DEFAULTVOICE,
                null,
                null
            );
        }
        setTimeout(() => {
            that._triggerLock = false;
        }, 125); // 1/8 second in milliseconds

        __selectionChanged();
    };

    const __hertzPreview = () => {
        const label = that._numberWheel.navItems[that._numberWheel.selectedNavItemIndex].title;
        const i = wheelLabels.indexOf(label);
        const actualPitch = frequencyToPitch(wheelValues[i]);
        const tur = that.activity.turtles.ithTurtle(0);
        if (!tur.singer.instrumentNames.includes(DEFAULTVOICE)) {
            that.activity.logo.synth.createDefaultSynth(0);
            that.activity.logo.synth.loadSynth(0, DEFAULTVOICE);
        }
        that.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);
        that.activity.logo.synth.setVolume(0, DEFAULTVOICE, PREVIEWVOLUME);
        actualPitch[0] = actualPitch[0].replace(SHARP, "#").replace(FLAT, "b");
        if (!that._triggerLock) {
            that._triggerLock = true;
            that.activity.logo.synth.trigger(
                0,
                actualPitch[0] + actualPitch[1],
                1 / 8,
                DEFAULTVOICE,
                null,
                null
            );
        }
        setTimeout(() => {
            that._triggerLock = false;
        }, 125); // 1/8 second in milliseconds
        __selectionChanged();
    };
    // Handler for pitchnumber preview. Block is to ensure that
    // only pitchnumber block's pie menu gets a sound preview
    if (
        block._usePieNumberC1() &&
        block.blocks.blockList[block.connections[0]].name === "pitchnumber"
    ) {
        for (let i = 0; i < wheelValues.length; i++) {
            block._numberWheel.navItems[i].navigateFunction = __pitchPreviewForNum;
        }
    }
    // Handler for Hertz preview. Need to also ensure that
    // only hertz block gets a different sound preview
    if (block._usePieNumberC1() && block.blocks.blockList[block.connections[0]].name === "hertz") {
        for (let i = 0; i < wheelValues.length; i++) {
            block._numberWheel.navItems[i].navigateFunction = __hertzPreview;
        }
    }
};

/**
 * Builds the color-selection pie menu for turtle and paint blocks.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {number[]} wheelValues Numeric values mapped to colors
 * @param {number} selectedValue Currently selected value
 * @param {string} mode Color mode (e.g. setcolor, setturtlecolor, sethue)
 * @returns {void}
 */
const piemenuColor = (block, wheelValues, selectedValue, mode) => {
    // input form and  wheelNav pie menu for setcolor selection

    if (block.blocks.stageClick) {
        return;
    }

    docById("wheelDiv").style.display = "";

    // the number selector
    const wheelSize = getPieMenuSize(block);
    block._numberWheel = new wheelnav("wheelDiv", null, wheelSize, wheelSize);
    // exit button
    block._exitWheel = new wheelnav("_exitWheel", block._numberWheel.raphael);

    const wheelLabels = [];
    for (let i = 0; i < wheelValues.length; i++) {
        wheelLabels.push(wheelValues[i].toString());
    }

    wheelnav.cssMode = true;

    block._numberWheel.keynavigateEnabled = false;

    block._numberWheel.colors = [];
    if (mode === "setcolor" || mode === "setturtlecolor") {
        for (let i = 0; i < wheelValues.length; i++) {
            block._numberWheel.colors.push(COLORS40[Math.floor(wheelValues[i] / 2.5)][2]);
        }
    } else if (mode === "sethue") {
        for (let i = 0; i < wheelValues.length; i++) {
            block._numberWheel.colors.push(getMunsellColor(wheelValues[i], 50, 50));
        }
    } else {
        if (mode === "setshade") {
            for (let i = 0; i < wheelValues.length; i++) {
                block._numberWheel.colors.push(getMunsellColor(0, wheelValues[i], 0));
            }
        } else if (mode === "settranslucency") {
            for (let i = 0; i < wheelValues.length; i++) {
                block._numberWheel.colors.push(getMunsellColor(35, 70, 100 - wheelValues[i]));
            }
        } else {
            for (let i = 0; i < wheelValues.length; i++) {
                block._numberWheel.colors.push(getMunsellColor(60, 60, wheelValues[i]));
            }
        }

        for (let i = 0; i < wheelValues.length; i++) {
            wheelLabels.push(null);
        }
    }

    block._numberWheel.slicePathFunction = slicePath().DonutSlice;
    block._numberWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._numberWheel.slicePathCustom.minRadiusPercent = 0.6;
    block._numberWheel.slicePathCustom.maxRadiusPercent = 1.0;

    block._numberWheel.sliceSelectedPathCustom = block._numberWheel.slicePathCustom;
    block._numberWheel.sliceInitPathCustom = block._numberWheel.slicePathCustom;
    // block._numberWheel.titleRotateAngle = 0;
    block._numberWheel.animatetime = 0; // 300;
    block._numberWheel.createWheel(wheelLabels);

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", " "]);
    block._exitWheel.navItems[1].enabled = false;
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    const that = block;

    const __selectionChanged = () => {
        that.value = wheelValues[that._numberWheel.selectedNavItemIndex];
        that.text.text = wheelLabels[that._numberWheel.selectedNavItemIndex];

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
    };

    const __exitMenu = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._numberWheel.removeWheel();
        that._exitWheel.removeWheel();
        that.label.style.display = "none";
    };

    const labelElem = docById("labelDiv");
    labelElem.innerHTML = `<input id="numberLabel" style="position: absolute; -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text;" class="number" type="number" value="${selectedValue}" />`;
    labelElem.classList.add("hasKeyboard");
    block.label = docById("numberLabel");

    block.label.addEventListener("keypress", block._exitKeyPressed.bind(block));

    block.label.addEventListener("change", () => {
        that._labelChanged(false, false);
    });

    // Position the widget over the note block.
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(300);

    const selectorWidth = 150;
    const left = Math.round(
        (x + block.activity.blocksContainer.x) * block.activity.getStageScale() + canvasLeft
    );
    const top = Math.round(
        (y + block.activity.blocksContainer.y) * block.activity.getStageScale() + canvasTop
    );
    block.label.style.left = left + "px";
    block.label.style.top = top + "px";

    docById("wheelDiv").style.left =
        Math.min(
            Math.max(left - (300 - selectorWidth) / 2, 0),
            block.blocks.turtles._canvas.width - 300
        ) + "px";
    if (top - 300 < 0) {
        docById("wheelDiv").style.top = top + 40 + "px";
    } else {
        docById("wheelDiv").style.top = top - 300 + "px";
    }

    block.label.style.width =
        (Math.round(selectorWidth * block.blocks.blockScale) * block.protoblock.scale) / 2 + "px";

    // Navigate to a the current number value.
    let i = wheelValues.indexOf(selectedValue);
    if (i === -1) {
        i = 0;
    }

    block._numberWheel.navigateWheel(i);
    // docById('wheelDiv').style.display = '';

    block.label.style.fontSize =
        Math.round((20 * block.blocks.blockScale * block.protoblock.scale) / 2) + "px";
    block.label.style.display = "";
    block.label.focus();

    // Hide the widget when the selection is made.
    for (let i = 0; i < wheelLabels.length; i++) {
        block._numberWheel.navItems[i].navigateFunction = () => {
            __selectionChanged();
            __exitMenu();
        };
    }

    // Or use the exit wheel...
    block._exitWheel.navItems[0].navigateFunction = () => {
        __exitMenu();
    };
};

/**
 * Builds a generic pie menu with arbitrary labels and values.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {Array} menuLabels Labels rendered on the wheel
 * @param {Array} menuValues Values corresponding to each label
 * @param {*} selectedValue Currently selected value
 * @param {Array} [colors] Optional override colors for the wheel
 * @returns {void}
 */
const piemenuBasic = (block, menuLabels, menuValues, selectedValue, colors) => {
    // basic wheelNav pie menu

    if (block.blocks.stageClick) {
        return;
    }

    if (colors === undefined) {
        colors = platformColor.piemenuBasicundefined;
    }

    docById("wheelDiv").style.display = "";

    // reference to diameter of the basic wheel
    let size = 800;
    if (block.name === "outputtools" || block.name === "grid") {
        // slightly larger menu
        size = 1000;
    } else if (block.name === "temperamentname") {
        // slightly larger wheel size for the Temperament Menu
        size = 1200;
    }

    // the selectedValueh selector
    block._basicWheel = new wheelnav("wheelDiv", null, size, size);
    block._exitWheel = new wheelnav("_exitWheel", block._basicWheel.raphael);

    const labels = [];
    for (let i = 0; i < menuLabels.length; i++) {
        labels.push(menuLabels[i]);
    }

    wheelnav.cssMode = true;

    block._basicWheel.keynavigateEnabled = false;

    block._basicWheel.colors = colors;
    block._basicWheel.slicePathFunction = slicePath().DonutSlice;
    block._basicWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._basicWheel.slicePathCustom.minRadiusPercent = 0.2;
    block._basicWheel.slicePathCustom.maxRadiusPercent = 1.0;
    block._basicWheel.sliceSelectedPathCustom = block._basicWheel.slicePathCustom;
    block._basicWheel.sliceInitPathCustom = block._basicWheel.slicePathCustom;
    block._basicWheel.animatetime = 0; // 300;
    if (block.name !== "wrapmode") {
        block._basicWheel.titleRotateAngle = 0;
    }
    block._basicWheel.createWheel(labels);

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", " "]);
    block._exitWheel.navItems[1].enabled = false;
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    const that = block;

    const __selectionChanged = () => {
        const label = that._basicWheel.navItems[that._basicWheel.selectedNavItemIndex].title;
        const i = labels.indexOf(label);
        if (that.name === "outputtools") {
            that.overrideName = menuValues[i];
            that.privateData = menuValues[i];
            that.text.text = menuLabels[i];
        } else {
            that.value = menuValues[i];
            that.text.text = menuLabels[i];
        }
        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
    };

    const __exitMenu = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._basicWheel.removeWheel();
    };

    // Position the widget over the note block.
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(300);
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 300,
            Math.max(
                0,
                Math.round(
                    (x + block.activity.blocksContainer.x) * block.activity.getStageScale() +
                    canvasLeft
                ) - 200
            )
        ) + "px";
    docById("wheelDiv").style.top =
        Math.min(
            block.blocks.turtles._canvas.height - 350,
            Math.max(
                0,
                Math.round(
                    (y + block.activity.blocksContainer.y) * block.activity.getStageScale() +
                    canvasTop
                ) - 200
            )
        ) + "px";

    // Navigate to a the current selectedValue value.
    let i = menuValues.indexOf(selectedValue);
    if (i === -1) {
        i = 1;
    }

    block._basicWheel.navigateWheel(i);

    // Hide the widget when the selection is made.
    for (let i = 0; i < menuLabels.length; i++) {
        block._basicWheel.navItems[i].navigateFunction = () => {
            __selectionChanged();
            __exitMenu();
        };
    }

    block._exitWheel.navItems[0].navigateFunction = () => {
        __exitMenu();
    };
};

/**
 * Builds the boolean selection pie menu.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {string[]} booleanLabels Display labels for each option
 * @param {boolean[]} booleanValues Values mapped to each label
 * @param {boolean} boolean Currently selected value
 * @returns {void}
 */
const piemenuBoolean = (block, booleanLabels, booleanValues, boolean) => {
    // wheelNav pie menu for boolean selection

    if (block.blocks.stageClick) {
        return;
    }

    docById("wheelDiv").style.display = "";

    // the boolean selector
    const wheelSize = getPieMenuSize(block);
    block._booleanWheel = new wheelnav("wheelDiv", null, wheelSize, wheelSize);

    const labels = [];
    for (let i = 0; i < booleanLabels.length; i++) {
        labels.push(booleanLabels[i]);
    }

    wheelnav.cssMode = true;

    block._booleanWheel.keynavigateEnabled = false;

    block._booleanWheel.colors = platformColor.booleanWheelcolors;
    block._booleanWheel.slicePathFunction = slicePath().DonutSlice;
    block._booleanWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._booleanWheel.slicePathCustom.minRadiusPercent = 0;
    block._booleanWheel.slicePathCustom.maxRadiusPercent = 0.6;
    block._booleanWheel.sliceSelectedPathCustom = block._booleanWheel.slicePathCustom;
    block._booleanWheel.sliceInitPathCustom = block._booleanWheel.slicePathCustom;
    // block._booleanWheel.titleRotateAngle = 0;
    block._booleanWheel.animatetime = 0; // 300;
    block._booleanWheel.createWheel(labels);

    const that = block;

    const __selectionChanged = () => {
        const label = that._booleanWheel.navItems[that._booleanWheel.selectedNavItemIndex].title;
        const i = labels.indexOf(label);
        that.value = booleanValues[i];
        that.text.text = booleanLabels[i];

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
    };

    const __exitMenu = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._booleanWheel.removeWheel();
    };

    // Position the widget over the note block.
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(300);
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 300,
            Math.max(
                0,
                Math.round(
                    (x + block.activity.blocksContainer.x) * block.activity.getStageScale() +
                    canvasLeft
                ) - 200
            )
        ) + "px";
    docById("wheelDiv").style.top =
        Math.min(
            block.blocks.turtles._canvas.height - 350,
            Math.max(
                0,
                Math.round(
                    (y + block.activity.blocksContainer.y) * block.activity.getStageScale() +
                    canvasTop
                ) - 200
            )
        ) + "px";

    // Navigate to a the current boolean value.
    let i = booleanValues.indexOf(boolean);
    if (i === -1) {
        i = 0;
    }

    block._booleanWheel.navigateWheel(i);

    // Hide the widget when the selection is made.
    block._booleanWheel.navItems[0].navigateFunction = () => {
        __selectionChanged();
        __exitMenu();
    };

    block._booleanWheel.navItems[1].navigateFunction = () => {
        __selectionChanged();
        __exitMenu();
    };
};

/**
 * Builds the chord selection pie menu.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {string} selectedChord Currently selected chord label
 * @returns {void}
 */
const piemenuChords = (block, selectedChord) => {
    // wheelNav pie menu for chord selection

    if (block.blocks.stageClick) {
        return;
    }

    docById("wheelDiv").style.display = "";

    // the chord selector
    block._chordWheel = new wheelnav("wheelDiv", null, 1000, 1000);
    block._exitWheel = new wheelnav("_exitWheel", block._chordWheel.raphael);

    const chordLabels = [];
    for (let i = 0; i < CHORDNAMES.length; i++) {
        const name = _(CHORDNAMES[i]);
        if (name.length === 0) {
            chordLabels.push(CHORDNAMES[i]); // In case i18n fails
        } else {
            chordLabels.push(name);
        }
    }
    wheelnav.cssMode = true;

    block._chordWheel.keynavigateEnabled = false;

    block._chordWheel.colors = platformColor.modeWheelcolors;
    block._chordWheel.slicePathFunction = slicePath().DonutSlice;
    block._chordWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._chordWheel.slicePathCustom.minRadiusPercent = 0.2;
    block._chordWheel.slicePathCustom.maxRadiusPercent = 1.0;
    block._chordWheel.sliceSelectedPathCustom = block._chordWheel.slicePathCustom;
    block._chordWheel.sliceInitPathCustom = block._chordWheel.slicePathCustom;
    block._chordWheel.titleRotateAngle = 0;
    block._chordWheel.animatetime = 0;
    block._chordWheel.createWheel(chordLabels);

    for (let i = 0; i < block._chordWheel.navItems.length; i++) {
        block._chordWheel.navItems[i].titleAttr.font = "32 32px sans-serif";
        block._chordWheel.navItems[i].titleSelectedAttr.font = "32 32px sans-serif";
    }

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", " "]);
    block._exitWheel.navItems[1].enabled = false;
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    const that = block;

    const __selectionChanged = () => {
        that.text.text = that._chordWheel.navItems[that._chordWheel.selectedNavItemIndex].title;
        that.value = CHORDNAMES[that._chordWheel.selectedNavItemIndex];

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
    };

    const __exitMenu = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._chordWheel.removeWheel();
    };

    // Position the widget over the note block.
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(400);
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 300,
            Math.max(
                0,
                Math.round(
                    (x + block.activity.blocksContainer.x) * block.activity.getStageScale() +
                    canvasLeft
                ) - 200
            )
        ) + "px";
    docById("wheelDiv").style.top =
        Math.min(
            block.blocks.turtles._canvas.height - 350,
            Math.max(
                0,
                Math.round(
                    (y + block.activity.blocksContainer.y) * block.activity.getStageScale() +
                    canvasTop
                ) - 200
            )
        ) + "px";

    // Navigate to a the current chord value.
    let i = chordLabels.indexOf(selectedChord);
    if (i === -1) {
        i = 0;
    }

    block._chordWheel.navigateWheel(i);

    // Enable scroll-to-rotate
    enableWheelScroll(block._chordWheel, chordLabels.length);

    // Hide the widget when the selection is made.
    for (let i = 0; i < chordLabels.length; i++) {
        block._chordWheel.navItems[i].navigateFunction = () => {
            __selectionChanged();
            __exitMenu();
        };
    }

    block._exitWheel.navItems[0].navigateFunction = () => {
        __exitMenu();
    };
};

/**
 * Builds the voice/instrument selection pie menu.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {string[]} voiceLabels Labels shown in the wheel
 * @param {Array} voiceValues Values mapped to labels
 * @param {number[]} categories Category indices for color grouping
 * @param {*} voice Currently selected voice value
 * @param {number} [rotate] Optional title rotation angle
 * @returns {void}
 */
const piemenuVoices = (block, voiceLabels, voiceValues, categories, voice, rotate) => {
    // wheelNav pie menu for voice selection

    if (block.blocks.stageClick) {
        return;
    }

    const COLORS = platformColor.piemenuVoicesColors;
    const colors = [];

    for (let i = 0; i < voiceLabels.length; i++) {
        colors.push(COLORS[categories[i] % COLORS.length]);
    }

    docById("wheelDiv").style.display = "";

    // the voice selector
    if (localStorage.kanaPreference === "kana") {
        block._voiceWheel = new wheelnav("wheelDiv", null, 1200, 1200);
    } else {
        block._voiceWheel = new wheelnav("wheelDiv", null, 800, 800);
    }

    // exit button
    block._exitWheel = new wheelnav("_exitWheel", block._voiceWheel.raphael);

    wheelnav.cssMode = true;

    block._voiceWheel.keynavigateEnabled = false;

    block._voiceWheel.colors = colors;
    block._voiceWheel.slicePathFunction = slicePath().DonutSlice;
    block._voiceWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._voiceWheel.slicePathCustom.minRadiusPercent = 0.2;
    block._voiceWheel.slicePathCustom.maxRadiusPercent = 1;
    block._voiceWheel.sliceSelectedPathCustom = block._voiceWheel.slicePathCustom;
    block._voiceWheel.sliceInitPathCustom = block._voiceWheel.slicePathCustom;
    if (rotate === undefined) {
        block._voiceWheel.titleRotateAngle = 0;
    } else {
        block._voiceWheel.titleRotateAngle = rotate;
    }

    block._voiceWheel.animatetime = 0; // 300;
    block._voiceWheel.createWheel(voiceLabels);

    // Special case for Japanese
    // const language = localStorage.languagePreference;
    // if (language === 'ja') {
    for (let i = 0; i < block._voiceWheel.navItems.length; i++) {
        block._voiceWheel.navItems[i].titleAttr.font = "30 30px sans-serif";
        block._voiceWheel.navItems[i].titleSelectedAttr.font = "30 30px sans-serif";
    }
    // }

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", " "]);
    block._exitWheel.navItems[1].enabled = false;
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    const that = block;

    const __selectionChanged = () => {
        const label = that._voiceWheel.navItems[that._voiceWheel.selectedNavItemIndex].title;
        const i = voiceLabels.indexOf(label);
        that.value = voiceValues[i];
        that.text.text = label;

        if (getDrumName(that.value) === null) {
            that.activity.logo.synth.loadSynth(0, getVoiceSynthName(that.value));
        } else {
            that.activity.logo.synth.loadSynth(0, getDrumSynthName(that.value));
        }

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
    };

    /*
     * Preview voice
     * @return{void}
     * @private
     */
    const __voicePreview = () => {
        const label = that._voiceWheel.navItems[that._voiceWheel.selectedNavItemIndex].title;
        const i = voiceLabels.indexOf(label);
        const voice = voiceValues[i];
        let timeout = 0;

        const tur = that.activity.turtles.ithTurtle(0);

        if (!tur.singer.instrumentNames.includes(voice)) {
            tur.singer.instrumentNames.push(voice);
            if (voice === DEFAULTVOICE) {
                that.activity.logo.synth.createDefaultSynth(0);
            }

            that.activity.logo.synth.loadSynth(0, voice);
            // give the synth time to load
            timeout = 500;
        }

        setTimeout(() => {
            that.activity.logo.deps.Singer.setSynthVolume(that.activity.logo, 0, voice, DEFAULTVOLUME);
            that.activity.logo.synth.trigger(0, "G4", 1 / 4, voice, null, null, false);
            that.activity.logo.synth.start();
        }, timeout);

        __selectionChanged();
    };

    // position widget
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(400);
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 400,
            Math.max(
                0,
                Math.round(
                    (x + block.activity.blocksContainer.x) * block.activity.getStageScale() +
                    canvasLeft
                ) - 200
            )
        ) + "px";
    docById("wheelDiv").style.top =
        Math.min(
            block.blocks.turtles._canvas.height - 450,
            Math.max(
                0,
                Math.round(
                    (y + block.activity.blocksContainer.y) * block.activity.getStageScale() +
                    canvasTop
                ) - 200
            )
        ) + "px";

    // navigate to a specific starting point
    let i = voiceValues.indexOf(voice);
    if (i === -1) {
        i = 0;
    }

    block._voiceWheel.navigateWheel(i);

    // Enable scroll-to-rotate
    enableWheelScroll(block._voiceWheel, voiceLabels.length);

    // Set up handlers for voice preview.
    for (let i = 0; i < voiceValues.length; i++) {
        block._voiceWheel.navItems[i].navigateFunction = __voicePreview;
    }

    // Hide the widget when the exit button is clicked.
    block._exitWheel.navItems[0].navigateFunction = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
    };
};

/**
 * Builds the interval selection pie menu.
 * @param {Object} block Block instance invoking the menu
 * @param {string} selectedInterval Currently selected interval value
 * @returns {void}
 */
const piemenuIntervals = (block, selectedInterval) => {
    // pie menu for interval selection

    if (block.blocks.stageClick) {
        return;
    }

    docById("wheelDiv").style.display = "";

    // Use advanced constructor for more wheelnav on same div
    const language = localStorage.languagePreference;
    if (language === "ja") {
        block._intervalNameWheel = new wheelnav("wheelDiv", null, 1500, 1500);
    } else {
        block._intervalNameWheel = new wheelnav("wheelDiv", null, 800, 800);
    }

    block._intervalWheel = new wheelnav("block._intervalWheel", block._intervalNameWheel.raphael);
    // exit button
    block._exitWheel = new wheelnav("_exitWheel", block._intervalNameWheel.raphael);

    wheelnav.cssMode = true;

    block._intervalNameWheel.keynavigateEnabled = false;

    //Customize slicePaths for proper size
    block._intervalNameWheel.colors = platformColor.intervalNameWheelcolors;
    block._intervalNameWheel.slicePathFunction = slicePath().DonutSlice;
    block._intervalNameWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._intervalNameWheel.slicePathCustom.minRadiusPercent = 0.2;
    block._intervalNameWheel.slicePathCustom.maxRadiusPercent = 0.8;
    block._intervalNameWheel.sliceSelectedPathCustom = block._intervalNameWheel.slicePathCustom;
    block._intervalNameWheel.sliceInitPathCustom = block._intervalNameWheel.slicePathCustom;
    block._intervalNameWheel.titleRotateAngle = 0;
    block._intervalNameWheel.clickModeRotate = false;
    // block._intervalNameWheel.clickModeRotate = false;
    const labels = [];
    for (let i = 0; i < INTERVALS.length; i++) {
        labels.push(_(INTERVALS[i][1]));
    }

    block._intervalNameWheel.animatetime = 0; // 300;
    block._intervalNameWheel.createWheel(labels);

    block._intervalWheel.colors = platformColor.intervalWheelcolors;
    block._intervalWheel.slicePathFunction = slicePath().DonutSlice;
    block._intervalWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._intervalWheel.slicePathCustom.minRadiusPercent = 0.8;
    block._intervalWheel.slicePathCustom.maxRadiusPercent = 1;
    block._intervalWheel.sliceSelectedPathCustom = block._intervalWheel.slicePathCustom;
    block._intervalWheel.sliceInitPathCustom = block._intervalWheel.slicePathCustom;

    //Disable rotation, set navAngle and create the menus
    block._intervalWheel.clickModeRotate = false;
    // Align each set of numbers with its corresponding interval
    block._intervalWheel.navAngle = -(180 / labels.length) + 180 / (8 * labels.length);
    block._intervalWheel.animatetime = 0; // 300;

    const numbers = [];
    for (let i = 0; i < INTERVALS.length; i++) {
        for (let j = 1; j < 9; j++) {
            numbers.push(j.toString());
        }
    }
    block._intervalWheel.createWheel(numbers);

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", " "]);
    block._exitWheel.navItems[1].enabled = false;
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    const that = block;

    // position widget
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(400);
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 400,
            Math.max(
                0,
                Math.round(
                    (x + block.activity.blocksContainer.x) * block.activity.getStageScale() +
                    canvasLeft
                ) - 200
            )
        ) + "px";
    docById("wheelDiv").style.top =
        Math.min(
            block.blocks.turtles._canvas.height - 450,
            Math.max(
                0,
                Math.round(
                    (y + block.activity.blocksContainer.y) * block.activity.getStageScale() +
                    canvasTop
                ) - 200
            )
        ) + "px";

    // Add function to each main menu for show/hide sub menus
    // TODO: Add all tabs to each interval
    const __setupAction = (i, activeTabs) => {
        that._intervalNameWheel.navItems[i].navigateFunction = () => {
            for (let l = 0; l < labels.length; l++) {
                for (let j = 0; j < 8; j++) {
                    if (l !== i) {
                        that._intervalWheel.navItems[l * 8 + j].navItem.hide();
                    } else if (!activeTabs.includes(j + 1)) {
                        that._intervalWheel.navItems[l * 8 + j].navItem.hide();
                    } else {
                        that._intervalWheel.navItems[l * 8 + j].navItem.show();
                    }
                }
            }
        };
    };

    // Set up action for interval name so number tabs will
    // initialize on load.
    for (let i = 0; i < INTERVALS.length; i++) {
        __setupAction(i, INTERVALS[i][2]);
    }

    // navigate to a specific starting point
    const obj = selectedInterval.split(" ");
    let i;
    for (i = 0; i < INTERVALS.length; i++) {
        if (obj[0] === INTERVALS[i][1]) {
            break;
        }
    }

    if (i === INTERVALS.length) {
        i = 0;
    }

    block._intervalNameWheel.navigateWheel(i);

    // Enable scroll-to-rotate
    enableWheelScroll(block._intervalNameWheel, labels.length);

    const j = Number(obj[1]);
    if (INTERVALS[i][2].includes(j)) {
        block._intervalWheel.navigateWheel(j - 1);
    } else {
        block._intervalWheel.navigateWheel(INTERVALS[i][2][0] - 1);
    }

    const __exitMenu = () => {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
    };

    const __selectionChanged = () => {
        const label =
            that._intervalNameWheel.navItems[that._intervalNameWheel.selectedNavItemIndex].title;
        const number = that._intervalWheel.navItems[that._intervalWheel.selectedNavItemIndex].title;

        that.value = INTERVALS[that._intervalNameWheel.selectedNavItemIndex][1] + " " + number;
        if (label === "perfect 1") {
            that.text.text = _("unison");
        } else {
            that.text.text = label + " " + number;
        }

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();

        const obj = getNote("C", 4, INTERVALVALUES[that.value][0], "C major", false, null, null);
        obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");

        const tur = that.activity.turtles.ithTurtle(0);

        if (!tur.singer.instrumentNames.includes(DEFAULTVOICE)) {
            that.activity.logo.synth.createDefaultSynth(0);
            that.activity.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.activity.logo.synth.setMasterVolume(DEFAULTVOLUME);
        that.activity.logo.deps.Singer.setSynthVolume(that.activity.logo, 0, DEFAULTVOICE, DEFAULTVOLUME);

        if (!that._triggerLock) {
            that._triggerLock = true;

            that.activity.logo.synth.trigger(
                0,
                ["C4", obj[0] + obj[1]],
                1 / 8,
                DEFAULTVOICE,
                null,
                null
            );
        }

        setTimeout(() => {
            that._triggerLock = false;
        }, 125); // 1/8 second in milliseconds
    };

    // Set up handlers for preview.
    for (let i = 0; i < 8 * labels.length; i++) {
        block._intervalWheel.navItems[i].navigateFunction = __selectionChanged;
    }

    block._exitWheel.navItems[0].navigateFunction = __exitMenu;
};

/**
 * Builds the musical mode selection pie menu.
 *
 * @param {Object} block Block instance invoking the menu
 * @param {string} selectedMode Currently selected mode value
 * @returns {void}
 */
const piemenuModes = (block, selectedMode) => {
    // pie menu for mode selection

    if (block.blocks.stageClick) {
        return;
    }

    // Look for a key block
    let key = "C";
    let modeGroup = "7"; // default mode group
    let octave = false;

    const c = block.connections[0];
    if (c !== null) {
        if (block.blocks.blockList[c].name === "setkey2") {
            const c1 = block.blocks.blockList[c].connections[1];
            if (c1 !== null) {
                if (block.blocks.blockList[c1].name === "notename") {
                    key = block.blocks.blockList[c1].value;
                }
            }
        }
    }

    docById("wheelDiv").style.display = "";

    //Use advanced constructor for more wheelnav on same div
    block._modeWheel = new wheelnav("wheelDiv", null, 1200, 1200);
    block._modeGroupWheel = new wheelnav("_modeGroupWheel", block._modeWheel.raphael);
    block._modeNameWheel = null; // We build block wheel based on the group selection.
    // exit button
    block._exitWheel = new wheelnav("_exitWheel", block._modeWheel.raphael);

    wheelnav.cssMode = true;

    block._modeWheel.colors = platformColor.modeWheelcolors;
    block._modeWheel.slicePathFunction = slicePath().DonutSlice;
    block._modeWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._modeWheel.slicePathCustom.minRadiusPercent = 0.85;
    block._modeWheel.slicePathCustom.maxRadiusPercent = 1;
    block._modeWheel.sliceSelectedPathCustom = block._modeWheel.slicePathCustom;
    block._modeWheel.sliceInitPathCustom = block._modeWheel.slicePathCustom;

    // Disable rotation, set navAngle and create the menus
    block._modeWheel.clickModeRotate = false;
    block._modeWheel.navAngle = -90;
    // block._modeWheel.selectedNavItemIndex = 2;
    block._modeWheel.animatetime = 0; // 300;
    block._modeWheel.createWheel(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]);

    block._modeGroupWheel.colors = platformColor.modeGroupWheelcolors;
    block._modeGroupWheel.slicePathFunction = slicePath().DonutSlice;
    block._modeGroupWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._modeGroupWheel.slicePathCustom.minRadiusPercent = 0.15;
    block._modeGroupWheel.slicePathCustom.maxRadiusPercent = 0.3;
    block._modeGroupWheel.sliceSelectedPathCustom = block._modeGroupWheel.slicePathCustom;
    block._modeGroupWheel.sliceInitPathCustom = block._modeGroupWheel.slicePathCustom;

    // Disable rotation, set navAngle and create the menus
    // block._modeGroupWheel.clickModeRotate = false;
    block._modeGroupWheel.navAngle = -90;
    // block._modeGroupWheel.selectedNavItemIndex = 2;
    block._modeGroupWheel.animatetime = 0; // 300;

    const xlabels = [];
    for (const modegroup in MODE_PIE_MENUS) {
        xlabels.push(modegroup);
    }

    block._modeGroupWheel.createWheel(xlabels);

    block._exitWheel.colors = platformColor.exitWheelcolors;
    block._exitWheel.slicePathFunction = slicePath().DonutSlice;
    block._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    block._exitWheel.slicePathCustom.maxRadiusPercent = 0.15;
    block._exitWheel.sliceSelectedPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.sliceInitPathCustom = block._exitWheel.slicePathCustom;
    block._exitWheel.clickModeRotate = false;
    block._exitWheel.initWheel(["×", "▶"]); // imgsrc:header-icons/play-button.svg']);
    block._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[1].sliceSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[1].sliceHoverAttr.cursor = "pointer";
    block._exitWheel.navItems[1].titleSelectedAttr.cursor = "pointer";
    block._exitWheel.navItems[1].titleHoverAttr.cursor = "pointer";
    block._exitWheel.createWheel();
    configureExitWheel(block._exitWheel);

    const that = block;

    const __selectionChanged = () => {
        const title = that._modeNameWheel.navItems[that._modeNameWheel.selectedNavItemIndex].title;
        if (title === " ") {
            that._modeNameWheel.navigateWheel(
                (that._modeNameWheel.selectedNavItemIndex + 1) % that._modeNameWheel.navItems.length
            );
        } else {
            that.text.text =
                that._modeNameWheel.navItems[that._modeNameWheel.selectedNavItemIndex].title;

            if (that.text.text === _("major") + " / " + _("ionian")) {
                that.value = "major";
            } else if (that.text.text === _("minor") + " / " + _("aeolian")) {
                that.value = "aeolian";
            } else {
                for (let i = 0; i < MODE_PIE_MENUS[modeGroup].length; i++) {
                    const modename = MODE_PIE_MENUS[modeGroup][i];

                    if (_(modename) === that.text.text) {
                        that.value = modename;
                        break;
                    }
                }
            }

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();
        }
    };

    // Add function to each main menu for show/hide sub menus
    const __setupAction = (i, activeTabs) => {
        that._modeNameWheel.navItems[i].navigateFunction = () => {
            for (let j = 0; j < 12; j++) {
                if (!activeTabs.includes(j)) {
                    that._modeWheel.navItems[j].navItem.hide();
                } else {
                    that._modeWheel.navItems[j].navItem.show();
                }
            }

            __selectionChanged();
        };
    };

    // Build a pie menu of modes based on the current mode group.
    const __buildModeNameWheel = grp => {
        let newWheel = false;
        if (that._modeNameWheel === null) {
            that._modeNameWheel = new wheelnav("_modeNameWheel", that._modeWheel.raphael);
            newWheel = true;
        }

        that._modeNameWheel.keynavigateEnabled = false;

        // Customize slicePaths
        const colors = [];
        for (let i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
            const modename = MODE_PIE_MENUS[grp][i];
            if (modename === " ") {
                colors.push(platformColor.modePieMenusIfColorPush);
            } else {
                colors.push(platformColor.modePieMenusElseColorPush);
            }
        }

        that._modeNameWheel.colors = colors;
        that._modeNameWheel.slicePathFunction = slicePath().DonutSlice;
        that._modeNameWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        that._modeNameWheel.slicePathCustom.minRadiusPercent = 0.3; //0.15;
        that._modeNameWheel.slicePathCustom.maxRadiusPercent = 0.85;
        that._modeNameWheel.sliceSelectedPathCustom = that._modeNameWheel.slicePathCustom;
        that._modeNameWheel.sliceInitPathCustom = that._modeNameWheel.slicePathCustom;
        that._modeNameWheel.titleRotateAngle = 0;
        // that._modeNameWheel.clickModeRotate = false;
        that._modeNameWheel.navAngle = -90;
        const labels = new Array();
        for (let i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
            const modename = MODE_PIE_MENUS[grp][i];
            switch (modename) {
                case "ionian":
                case "major":
                    labels.push(_("major") + " / " + _("ionian"));
                    break;
                case "aeolian":
                case "minor":
                    labels.push(_("minor") + " / " + _("aeolian"));
                    break;
                default:
                    if (modename === " ") {
                        labels.push(" ");
                    } else {
                        labels.push(_(modename));
                    }
                    break;
            }
        }

        that._modeNameWheel.animatetime = 0; // 300;
        if (newWheel) {
            that._modeNameWheel.createWheel(labels);
        } else {
            for (let i = 0; i < that._modeNameWheel.navItems.length; i++) {
                // Maybe there is a method that does this?
                that._modeNameWheel.navItems[i].title = labels[i];
                that._modeNameWheel.navItems[i].basicNavTitleMax.title = labels[i];
                that._modeNameWheel.navItems[i].basicNavTitleMin.title = labels[i];
                that._modeNameWheel.navItems[i].hoverNavTitleMax.title = labels[i];
                that._modeNameWheel.navItems[i].hoverNavTitleMin.title = labels[i];
                that._modeNameWheel.navItems[i].selectedNavTitleMax.title = labels[i];
                that._modeNameWheel.navItems[i].selectedNavTitleMin.title = labels[i];
                that._modeNameWheel.navItems[i].initNavTitle.title = labels[i];
                that._modeNameWheel.navItems[i].fillAttr = colors[i];
                that._modeNameWheel.navItems[i].sliceHoverAttr.fill = colors[i];
                that._modeNameWheel.navItems[i].slicePathAttr.fill = colors[i];
                that._modeNameWheel.navItems[i].sliceSelectedAttr.fill = colors[i];
            }

            that._modeNameWheel.refreshWheel();
        }

        // Special case for Japanese
        const language = localStorage.languagePreference;
        if (language === "ja") {
            for (let i = 0; i < that._modeNameWheel.navItems.length; i++) {
                that._modeNameWheel.navItems[i].titleAttr.font = "30 30px sans-serif";
                that._modeNameWheel.navItems[i].titleSelectedAttr.font = "30 30px sans-serif";
            }
        }

        // Set up tabs for each mode.
        let i = 0;
        for (let j = 0; j < MODE_PIE_MENUS[grp].length; j++) {
            const modename = MODE_PIE_MENUS[grp][j];
            const activeTabs = [0];
            if (modename !== " ") {
                const mode = MUSICALMODES[modename];
                for (let k = 0; k < mode.length; k++) {
                    activeTabs.push(last(activeTabs) + mode[k]);
                }
            }

            __setupAction(i, activeTabs);
            i += 1;
        }

        // Look for the selected mode.
        for (i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
            if (MODE_PIE_MENUS[grp][i] === selectedMode) {
                break;
            }
        }

        // if we didn't find the mode, use a default
        if (i === labels.length) {
            i = 0; // major/ionian
        }

        that._modeNameWheel.navigateWheel(i);
    };

    let timeout;

    const __exitMenu = () => {
        if (timeout) {
            clearTimeout(timeout);
        }
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        if (that._modeNameWheel !== null) {
            that._modeNameWheel.removeWheel();
        }
    };

    const __playNote = () => {
        let o = 0;
        if (octave) {
            o = 12;
        }

        const i = that._modeWheel.selectedNavItemIndex;
        // The mode doesn't matter here, since we are using semi-tones
        const obj = getNote(key, 4, i + o, key + " chromatic", false, null, null);
        obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");

        const tur = that.activity.turtles.ithTurtle(0);

        if (!tur.singer.instrumentNames.includes(DEFAULTVOICE)) {
            that.activity.logo.synth.createDefaultSynth(0);
            that.activity.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.activity.logo.synth.setMasterVolume(DEFAULTVOLUME);
        that.activity.logo.synth.setVolume(0, DEFAULTVOICE, DEFAULTVOLUME);
        that.activity.logo.synth.trigger(0, [obj[0] + obj[1]], 1 / 12, DEFAULTVOICE, null, null);
    };

    const __playScale = (activeTabs, idx) => {
        // loop through selecting modeWheel slices with a delay.
        if (idx < activeTabs.length) {
            if (activeTabs[idx] < 12) {
                octave = false;
                that._modeWheel.navigateWheel(activeTabs[idx]);
            } else {
                octave = true;
                that._modeWheel.navigateWheel(0);
            }

            timeout = setTimeout(() => {
                __playScale(activeTabs, idx + 1);
            }, 1000 / 10); // slight delay between notes
        }
    };

    /*
     * prepare scale
     * @return{void}
     * @private
     */
    const __prepScale = () => {
        const activeTabs = [0];
        const mode = MUSICALMODES[that.value];
        for (let k = 0; k < mode.length - 1; k++) {
            activeTabs.push(last(activeTabs) + mode[k]);
        }

        activeTabs.push(12);
        activeTabs.push(12);

        for (let k = mode.length - 1; k >= 0; k--) {
            activeTabs.push(last(activeTabs) - mode[k]);
        }

        docById("wheelnav-_exitWheel-title-1").style.fill = "#ffffff";
        docById("wheelnav-_exitWheel-title-1").style.pointerEvents = "none";
        docById("wheelnav-_exitWheel-slice-1").style.pointerEvents = "none";
        setTimeout(() => {
            const playButtonTitle = docById("wheelnav-_exitWheel-title-1");
            const playButtonSlice = docById("wheelnav-_exitWheel-slice-1");
            if (playButtonTitle && playButtonSlice) {
                playButtonTitle.style.fill = "#000000";
                playButtonTitle.style.pointerEvents = "auto";
                playButtonSlice.style.pointerEvents = "auto";
            }
        }, (20 * 1000) / 10);

        __playScale(activeTabs, 0);
    };

    // position widget
    const x = block.container.x;
    const y = block.container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.blocks.blockScale;
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.blocks.blockScale;

    docById("wheelDiv").style.position = "absolute";
    setWheelSize(600);

    // Block widget is large. Be sure it fits on the screen.
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 600,
            Math.max(
                0,
                Math.round(
                    (x + block.activity.blocksContainer.x) * block.activity.getStageScale() +
                    canvasLeft
                ) - 200
            )
        ) + "px";
    docById("wheelDiv").style.top =
        Math.min(
            block.blocks.turtles._canvas.height - 650,
            Math.max(
                0,
                Math.round(
                    (y + block.activity.blocksContainer.y) * block.activity.getStageScale() +
                    canvasTop
                ) - 200
            )
        ) + "px";

    for (let i = 0; i < 12; i++) {
        that._modeWheel.navItems[i].navigateFunction = __playNote;
    }

    // navigate to a specific starting point
    for (modeGroup in MODE_PIE_MENUS) {
        let j;
        for (j = 0; j < MODE_PIE_MENUS[modeGroup].length; j++) {
            const modename = MODE_PIE_MENUS[modeGroup][j];
            if (modename === selectedMode) {
                break;
            }
        }

        if (j < MODE_PIE_MENUS[modeGroup].length) {
            break;
        }
    }

    if (selectedMode === "major") {
        modeGroup = "7";
    }

    const __buildModeWheel = () => {
        const i = that._modeGroupWheel.selectedNavItemIndex;
        modeGroup = that._modeGroupWheel.navItems[i].title;
        __buildModeNameWheel(modeGroup);
    };

    for (let i = 0; i < block._modeGroupWheel.navItems.length; i++) {
        block._modeGroupWheel.navItems[i].navigateFunction = __buildModeWheel;
    }

    for (let i = 0; i < block._modeGroupWheel.navItems.length; i++) {
        if (block._modeGroupWheel.navItems[i].title === modeGroup) {
            block._modeGroupWheel.navigateWheel(i);
            break;
        }
    }

    block._exitWheel.navItems[0].navigateFunction = __exitMenu;
    block._exitWheel.navItems[1].navigateFunction = __prepScale;
};

/*
 * Sets up context menu for each block
 */
const piemenuBlockContext = block => {
    if (block.blocks.activeBlock === null) {
        return;
    }

    let pasteDx = 0;
    let pasteDy = 0;

    const that = block;
    const blockBlock = block.blocks.blockList.indexOf(block);

    // Position the widget centered over the active block.
    docById("contextWheelDiv").style.position = "absolute";

    const x = block.blocks.blockList[blockBlock].container.x;
    const y = block.blocks.blockList[blockBlock].container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.activity.getStageScale();
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.activity.getStageScale();

    docById("contextWheelDiv").style.left =
        Math.round(
            (x + block.activity.blocksContainer.x) * block.activity.getStageScale() + canvasLeft
        ) -
        150 +
        "px";
    docById("contextWheelDiv").style.top =
        Math.round(
            (y + block.activity.blocksContainer.y) * block.activity.getStageScale() + canvasTop
        ) -
        150 +
        "px";

    docById("contextWheelDiv").style.display = "";

    const labels = [
        "imgsrc:header-icons/copy-button.svg",
        "imgsrc:header-icons/extract-button.svg",
        "imgsrc:header-icons/empty-trash-button.svg",
        "imgsrc:header-icons/cancel-button.svg"
    ];

    const topBlock = block.blocks.findTopBlock(blockBlock);
    if (
        ["customsample", "temperament1", "definemode", "show", "turtleshell", "action"].includes(
            block.name
        )
    ) {
        labels.push("imgsrc:header-icons/save-blocks-button.svg");
    }

    const message = block.blocks.blockList[block.blocks.activeBlock].protoblock.helpString;

    let helpButton;
    if (message) {
        labels.push("imgsrc:header-icons/help-button.svg");
        helpButton = labels.length - 1;
    } else {
        helpButton = null;
    }

    const wheel = new wheelnav("contextWheelDiv", null, 250, 250);
    wheel.colors = platformColor.wheelcolors;
    wheel.slicePathFunction = slicePath().DonutSlice;
    wheel.slicePathCustom = slicePath().DonutSliceCustomization();
    wheel.slicePathCustom.minRadiusPercent = 0.2;
    wheel.slicePathCustom.maxRadiusPercent = 0.6;
    wheel.sliceSelectedPathCustom = wheel.slicePathCustom;
    wheel.sliceInitPathCustom = wheel.slicePathCustom;
    wheel.clickModeRotate = false;
    wheel.initWheel(labels);
    wheel.createWheel();

    wheel.navItems[0].setTooltip(_("Duplicate"));
    wheel.navItems[1].setTooltip(_("Extract"));
    wheel.navItems[2].setTooltip(_("Move to trash"));
    wheel.navItems[3].setTooltip(_("Close"));
    if (
        ["customsample", "temperament1", "definemode", "show", "turtleshell", "action"].includes(
            block.blocks.blockList[topBlock].name
        )
    ) {
        wheel.navItems[4].setTooltip(_("Save stack"));
    }

    if (helpButton !== null) {
        wheel.navItems[helpButton].setTooltip(_("Help"));
    }

    wheel.navItems[0].selected = false;

    const stackPasting = function () {
        that.blocks.activeBlock = blockBlock;
        that.blocks.prepareStackForCopy();
        that.blocks.pasteDx = pasteDx;
        that.blocks.pasteDy = pasteDy;
        that.blocks.pasteStack();
        pasteDx += 21;
        pasteDy += 21;

        that.activity.helpfulWheelItems.forEach(ele => {
            if (ele.label === "Paste previous stack") {
                ele.display = true;
                ele.fn = stackPasting.bind(that);
            }
        });
    };

    wheel.navItems[0].navigateFunction = () => {
        if ("customsample" === block.blocks.blockList[topBlock].name) {
            that.activity.errorMsg(
                _(
                    "In order to copy a sample, you must reload the widget, import the sample again, and export it."
                )
            );
        } else {
            stackPasting();
        }
    };

    wheel.navItems[1].navigateFunction = () => {
        that.blocks.activeBlock = blockBlock;
        that.blocks.extract();
        docById("contextWheelDiv").style.display = "none";
    };

    wheel.navItems[2].navigateFunction = () => {
        that.blocks.activeBlock = blockBlock;
        that.blocks.extract();
        that.blocks.sendStackToTrash(that.blocks.blockList[blockBlock]);
        docById("contextWheelDiv").style.display = "none";
        // prompting a notification on deleting any block
        activity.textMsg(
            _("You can restore deleted blocks from the trash with the Restore From Trash button."),
            3000
        );
    };

    wheel.navItems[3].navigateFunction = () => {
        docById("contextWheelDiv").style.display = "none";
    };

    // Named function for proper cleanup
    const hideContextWheelOnClick = event => {
        const wheelElement = document.getElementById("contextWheelDiv");
        const displayStyle = window.getComputedStyle(wheelElement).display;
        if (displayStyle === "block") {
            wheelElement.style.display = "none";
            // Remove listener after hiding to prevent memory leak
            document.body.removeEventListener("click", hideContextWheelOnClick);
        }
    };

    // Remove any existing listener before adding a new one
    document.body.removeEventListener("click", hideContextWheelOnClick);
    document.body.addEventListener("click", hideContextWheelOnClick);

    if (
        ["customsample", "temperament1", "definemode", "show", "turtleshell", "action"].includes(
            block.name
        )
    ) {
        wheel.navItems[4].navigateFunction = () => {
            that.blocks.activeBlock = blockBlock;
            that.blocks.prepareStackForCopy();
            that.blocks.saveStack();
        };
    }

    if (helpButton !== null) {
        wheel.navItems[helpButton].navigateFunction = () => {
            that.blocks.activeBlock = blockBlock;
            new HelpWidget(that, true);
            docById("contextWheelDiv").style.display = "none";
        };
    }

    setTimeout(() => {
        that.blocks.stageClick = false;
    }, 500);
};

/**
 * Creates pie menu for Grid selection.
 *
 * @returns {void}
 */
const piemenuGrid = activity => {
    docById("wheelDivptm").style.display = "none";
    const x = activity.turtles.gridButton.getBoundingClientRect().x;
    const y = activity.turtles.gridButton.getBoundingClientRect().y;
    docById("wheelDivptm").style.position = "absolute";
    docById("wheelDivptm").style.height = "400px";
    docById("wheelDivptm").style.width = "400px";
    docById("wheelDivptm").style.left =
        Math.min(activity.turtles._canvas.width - 200, Math.max(0, x * activity.getStageScale())) -
        350 +
        "px";
    docById("wheelDivptm").style.top =
        Math.min(activity.turtles._canvas.height - 250, Math.max(0, y * activity.getStageScale())) +
        "px";
    docById("wheelDivptm").style.display = "";

    let grids, gridLabels;
    if (_THIS_IS_TURTLE_BLOCKS_) {
        grids = [
            "imgsrc: images/grid/blank.svg",
            "imgsrc: images/grid/Cartesian.svg",
            "imgsrc: images/grid/Cartesian polar.svg",
            "imgsrc: images/grid/Polar.svg",
            ""
        ];

        gridLabels = ["Blank", "Cartesian", "Cartesian/Polar", "Polar", "Blank"];
    } else {
        grids = [
            "imgsrc: images/grid/blank.svg",
            "imgsrc: images/grid/Cartesian.svg",
            "imgsrc: images/grid/Cartesian polar.svg",
            "imgsrc: images/grid/Polar.svg",
            "imgsrc: images/grid/Treble.svg",
            "imgsrc: images/grid/Grand.svg",
            "imgsrc: images/grid/Mezzo-soprano.svg",
            "imgsrc: images/grid/Alto.svg",
            "imgsrc: images/grid/Tenor.svg",
            "imgsrc: images/grid/Bass.svg"
        ];

        gridLabels = [
            "Blank",
            "Cartesian",
            "Cartesian/Polar",
            "Polar",
            "Treble",
            "Grand",
            "Mezzo Soprano",
            "Alto",
            "Tenor",
            "Bass"
        ];
    }

    activity.turtles.gridWheel = new wheelnav("wheelDivptm", null, 300, 300);
    activity.turtles._exitWheel = new wheelnav("_exitWheel", activity.turtles.gridWheel.raphael);

    activity.turtles.gridWheel.keynavigateEnabled = false;
    activity.turtles.gridWheel.slicePathFunction = slicePath().DonutSlice;
    activity.turtles.gridWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    activity.turtles.gridWheel.colors = platformColor.gridWheelcolors.wheel;
    activity.turtles.gridWheel.slicePathCustom.minRadiusPercent = 0.3;
    activity.turtles.gridWheel.slicePathCustom.maxRadiusPercent = 1;
    activity.turtles.gridWheel.sliceSelectedPathCustom = activity.turtles.gridWheel.slicePathCustom;
    activity.turtles.gridWheel.sliceInitPathCustom = activity.turtles.gridWheel.slicePathCustom;
    activity.turtles.gridWheel.animatetime = 0; // 300;
    activity.turtles.gridWheel.clickModeRotate = true;
    const { fill, stroke } = platformColor.gridWheelcolors.selected;
    activity.turtles.gridWheel.sliceHoverAttr = { fill, stroke, "stroke-width": 2 };
    activity.turtles.gridWheel.sliceSelectedAttr = { fill, stroke, "stroke-width": 2 };

    activity.turtles.gridWheel.clockwise = false;
    activity.turtles.gridWheel.initWheel(grids);
    activity.turtles.gridWheel.createWheel();
    const storedGrid = activity.turtles.currentGrid ?? 0;
    activity.turtles.gridWheel.navigateWheel(storedGrid);

    for (let i = 0; i < gridLabels.length; i++) {
        activity.turtles.gridWheel.navItems[i].navigateFunction = function () {
            activity.hideGrids();
            activity.turtles.currentGrid = i;
            activity.turtles.doGrid(i);
        };
        activity.turtles.gridWheel.navItems[i].setTooltip(gridLabels[i]);
    }

    activity.turtles._exitWheel.colors = platformColor.exitWheelcolors;
    activity.turtles._exitWheel.slicePathFunction = slicePath().DonutSlice;
    activity.turtles._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    activity.turtles._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    activity.turtles._exitWheel.slicePathCustom.maxRadiusPercent = 0.3;
    activity.turtles._exitWheel.sliceSelectedPathCustom =
        activity.turtles._exitWheel.slicePathCustom;
    activity.turtles._exitWheel.sliceInitPathCustom = activity.turtles._exitWheel.slicePathCustom;
    activity.turtles._exitWheel.clickModeRotate = false;
    activity.turtles._exitWheel.createWheel(["×", " "]);
    configureExitWheel(activity.turtles._exitWheel);

    activity.turtles._exitWheel.navItems[0].navigateFunction = () => {
        hidePiemenu(activity);
    };

    if (docById("helpfulWheelDiv").style.display !== "none") {
        docById("helpfulWheelDiv").style.display = "none";
    }

    const hidePiemenu = activity => {
        docById("wheelDivptm").style.display = "none";
        activity.turtles.gridWheel.removeWheel();
        activity.turtles._exitWheel.removeWheel();
    };

    const clickOutsideHandler = event => {
        const piemenu = docById("wheelDivptm");
        if (!piemenu.contains(event.target)) {
            hidePiemenu(activity);
            document.removeEventListener("mousedown", clickOutsideHandler);
        }
    };

    document.addEventListener("mousedown", clickOutsideHandler);
};

const piemenuKey = activity => {
    docById("chooseKeyDiv").style.display = "block";
    docById("movable").style.display = "block";

    const keyNameWheel = new wheelnav("chooseKeyDiv", null, 1300, 1300);
    const keyNameWheel2 = new wheelnav("keyNameWheel2", keyNameWheel.raphael);
    const keys = [
        "C",
        "G",
        "D",
        "A",
        "E",
        "B/C♭",
        "F♯/G♭",
        "C♯/D♭",
        "G♯/A♭",
        "D♯/E♭",
        "A♯/B♭",
        "F"
    ];

    wheelnav.cssMode = true;

    keyNameWheel.slicePathFunction = slicePath().DonutSlice;
    keyNameWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    keyNameWheel.slicePathCustom.minRadiusPercent = 0.6;
    keyNameWheel.slicePathCustom.maxRadiusPercent = 0.9;
    keyNameWheel.sliceSelectedPathCustom = keyNameWheel.slicePathCustom;
    keyNameWheel.sliceInitPathCustom = keyNameWheel.slicePathCustom;
    keyNameWheel.titleRotateAngle = 0;
    keyNameWheel.colors = platformColor.pitchWheelcolors;
    keyNameWheel.animatetime = 0;

    keyNameWheel.createWheel(keys);

    keyNameWheel2.colors = platformColor.pitchWheelcolors;
    keyNameWheel2.slicePathFunction = slicePath().DonutSlice;
    keyNameWheel2.slicePathCustom = slicePath().DonutSliceCustomization();
    keyNameWheel2.slicePathCustom.minRadiusPercent = 0.9;
    keyNameWheel2.slicePathCustom.maxRadiusPercent = 1;
    keyNameWheel2.sliceSelectedPathCustom = keyNameWheel2.slicePathCustom;
    keyNameWheel2.sliceInitPathCustom = keyNameWheel2.slicePathCustom;

    const keys2 = [];
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].length > 2) {
            const obj = keys[i].split("/");
            keys2.push(obj[0]);
            keys2.push(obj[1]);
        } else {
            keys2.push("");
            keys2.push("");
        }
    }

    keyNameWheel2.navAngle = -7.45;
    keyNameWheel2.animatetime = 0;
    keyNameWheel2.createWheel(keys2);

    const modenameWheel = new wheelnav("modenameWheel", keyNameWheel.raphael);
    const modes = ["major", "dorian", "phrygian", "lydian", "mixolydian", "minor", "locrian"];
    modenameWheel.slicePathFunction = slicePath().DonutSlice;
    modenameWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    modenameWheel.slicePathCustom.minRadiusPercent = 0.2;
    modenameWheel.slicePathCustom.maxRadiusPercent = 0.6;
    modenameWheel.sliceSelectedPathCustom = modenameWheel.slicePathCustom;
    modenameWheel.sliceInitPathCustom = modenameWheel.slicePathCustom;
    modenameWheel.titleRotateAngle = 0;
    modenameWheel.colors = platformColor.modeGroupWheelcolors;
    modenameWheel.animatetime = 0;
    modenameWheel.createWheel(modes);

    const exitWheel = new wheelnav("exitWheel", keyNameWheel.raphael);
    exitWheel.slicePathFunction = slicePath().DonutSlice;
    exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    exitWheel.sliceSelectedPathCustom = exitWheel.slicePathCustom;
    exitWheel.sliceInitPathCustom = exitWheel.slicePathCustom;
    exitWheel.titleRotateAngle = 0;
    exitWheel.clickModeRotate = false;
    exitWheel.colors = platformColor.exitWheelcolors;
    exitWheel.animatetime = 0;
    exitWheel.createWheel(["×", " "]);
    configureExitWheel(exitWheel);

    const x = event.clientX;
    const y = event.clientY;

    docById("chooseKeyDiv").style.left = x - 175 + "px";
    docById("chooseKeyDiv").style.top = y + 50 + "px";
    docById("movable").style.left = x - 110 + "px";
    docById("movable").style.top = y + 400 + "px";

    const __generateSetKeyBlocks = () => {
        // Find all setkey blocks in the code.
        let isSetKeyBlockPresent = false;
        const setKeyBlocks = [];
        for (const i in activity.blocks.blockList) {
            if (
                activity.blocks.blockList[i].name === "setkey2" &&
                !activity.blocks.blockList[i].trash
            ) {
                isSetKeyBlockPresent = true;
                setKeyBlocks.push(i);
            }
        }

        if (!isSetKeyBlockPresent) {
            activity.blocks.findStacks();
            const stacks = activity.blocks.stackList;
            stacks.sort();
            let connectionsSetKey;
            let movable;
            for (const i in stacks) {
                if (activity.blocks.blockList[stacks[i]].name === "start") {
                    const bottomBlock = activity.blocks.blockList[stacks[i]].connections[1];
                    if (activity.KeySignatureEnv[2]) {
                        activity.blocks._makeNewBlockWithConnections(
                            "movable",
                            0,
                            [stacks[i], null, null],
                            null,
                            null
                        );
                        movable = activity.logo.blocks.blockList.length - 1;
                        activity.blocks._makeNewBlockWithConnections(
                            "boolean",
                            0,
                            [movable],
                            null,
                            null
                        );
                        activity.blocks.blockList[movable].connections[1] =
                            activity.blocks.blockList.length - 1;
                        connectionsSetKey = [movable, null, null, bottomBlock];
                    } else {
                        connectionsSetKey = [stacks[i], null, null, bottomBlock];
                    }

                    activity.blocks._makeNewBlockWithConnections(
                        "setkey2",
                        0,
                        connectionsSetKey,
                        null,
                        null
                    );

                    const setKey = activity.blocks.blockList.length - 1;
                    activity.blocks.blockList[bottomBlock].connections[0] = setKey;

                    if (activity.KeySignatureEnv[2]) {
                        activity.blocks.blockList[stacks[i]].connections[1] = movable;
                        activity.blocks.blockList[movable].connections[2] = setKey;
                    } else {
                        activity.blocks.blockList[stacks[i]].connections[1] = setKey;
                    }

                    activity.blocks.adjustExpandableClampBlock();

                    activity.blocks._makeNewBlockWithConnections(
                        "notename",
                        0,
                        [setKey],
                        null,
                        null
                    );
                    activity.blocks.blockList[setKey].connections[1] =
                        activity.blocks.blockList.length - 1;
                    activity.blocks.blockList[activity.blocks.blockList.length - 1].value =
                        activity.KeySignatureEnv[0];
                    activity.blocks._makeNewBlockWithConnections(
                        "modename",
                        0,
                        [setKey],
                        null,
                        null
                    );
                    activity.blocks.blockList[setKey].connections[2] =
                        activity.blocks.blockList.length - 1;
                    activity.blocks.blockList[activity.blocks.blockList.length - 1].value =
                        activity.KeySignatureEnv[1];
                    activity.textMsg(
                        _("You have chosen key for your pitch preview.") +
                        activity.KeySignatureEnv[0] +
                        " " +
                        activity.KeySignatureEnv[1]
                    );
                }
            }
        }
    };

    const __exitMenu = () => {
        docById("chooseKeyDiv").style.display = "none";
        docById("movable").style.display = "none";
        const ele = document.getElementsByName("movable");
        for (let i = 0; i < ele.length; i++) {
            if (ele[i].checked) {
                activity.KeySignatureEnv[2] = ele[i].value == "true" ? true : false;
            }
        }
        keyNameWheel.removeWheel();
        keyNameWheel2.removeWheel();
        modenameWheel.removeWheel();
        activity.storage.KeySignatureEnv = activity.KeySignatureEnv;
        __generateSetKeyBlocks();
    };

    exitWheel.navItems[0].navigateFunction = __exitMenu;

    const __playNote = note => {
        const obj = getNote(
            note,
            4,
            null,
            note + " " + activity.KeySignatureEnv[1],
            false,
            null,
            null
        );
        obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");

        const tur = activity.turtles.ithTurtle(0);
        if (!tur.singer.instrumentNames.includes(DEFAULTVOICE)) {
            tur.singer.instrumentNames.push(DEFAULTVOICE);
            activity.logo.synth.createDefaultSynth(0);
            activity.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        activity.logo.synth.setMasterVolume(DEFAULTVOLUME);
        activity.logo.deps.Singer.setSynthVolume(activity.logo, 0, DEFAULTVOICE, DEFAULTVOLUME);
        activity.logo.synth.trigger(0, [obj[0] + obj[1]], 1 / 12, DEFAULTVOICE, null, null);
    };

    const __selectionChangedKey = () => {
        const selection = keyNameWheel.navItems[keyNameWheel.selectedNavItemIndex].title;
        keyNameWheel2.navigateWheel(2 * keyNameWheel.selectedNavItemIndex);
        if (selection === "") {
            keyNameWheel.navigateWheel(
                (keyNameWheel.selectedNavItemIndex + 1) % keyNameWheel.navItems.length
            );
        } else if (selection.length <= 2) {
            activity.KeySignatureEnv[0] = selection;
        }
        activity.storage.KeySignatureEnv = activity.KeySignatureEnv;
    };

    const __setupActionKey = i => {
        keyNameWheel.navItems[i].navigateFunction = () => {
            for (let j = 0; j < keys2.length; j++) {
                if (Math.floor(j / 2) != i) {
                    keyNameWheel2.navItems[j].navItem.hide();
                } else {
                    if (keys[i].length > 2) {
                        keyNameWheel2.navItems[j].navItem.show();
                    }
                }
            }
            __selectionChangedKey();
            if ((i >= 0 && i < 5) || (i > 9 && i < 12)) {
                __playNote(activity.KeySignatureEnv[0]);
            } else {
                let selection = keyNameWheel.navItems[keyNameWheel.selectedNavItemIndex].title;
                selection = selection.split("/");
                __playNote(selection[0]);
            }
        };
    };

    for (let i = 0; i < keys.length; i++) {
        __setupActionKey(i);
    }

    const __selectionChangedMode = () => {
        const selection = modenameWheel.navItems[modenameWheel.selectedNavItemIndex].title;
        if (selection === "") {
            modenameWheel.navigateWheel(
                (modenameWheel.selectedNavItemIndex + 1) % modenameWheel.navItems.length
            );
        } else {
            activity.KeySignatureEnv[1] = selection;
        }
        activity.storage.KeySignatureEnv = activity.KeySignatureEnv;
    };

    for (let i = 0; i < modes.length; i++) {
        modenameWheel.navItems[i].navigateFunction = () => {
            __selectionChangedMode();
        };
    }

    const __selectionChangedKey2 = () => {
        const selection = keyNameWheel2.navItems[keyNameWheel2.selectedNavItemIndex].title;
        activity.KeySignatureEnv[0] = selection;
        activity.storage.KeySignatureEnv = activity.KeySignatureEnv;
    };

    for (let i = 0; i < keys2.length; i++) {
        keyNameWheel2.navItems[i].navigateFunction = () => {
            __selectionChangedKey2();
        };
    }

    if (activity.storage.KeySignatureEnv !== undefined) {
        const ks = activity.storage.KeySignatureEnv.split(",");
        activity.KeySignatureEnv[0] = ks[0];
        activity.KeySignatureEnv[1] = ks[1];
        activity.KeySignatureEnv[2] = ks[2] == "true" ? true : false;
        activity.storage.KeySignatureEnv = activity.KeySignatureEnv;
    } else {
        activity.KeySignatureEnv = ["C", "major", false];
        activity.storage.KeySignatureEnv = activity.KeySignatureEnv;
    }

    let i = keys.indexOf(activity.KeySignatureEnv[0]);
    if (i === -1) {
        i = keys2.indexOf(activity.KeySignatureEnv[0]);
        if (i !== -1) {
            keyNameWheel.navigateWheel(Math.floor(i / 2));
            keyNameWheel2.navigateWheel(i);
            for (let j = 0; j < keys2.length; j++) {
                keyNameWheel2.navItems[j].navItem.hide();
                if (i % 2 == 0) {
                    keyNameWheel2.navItems[i].navItem.show();
                    keyNameWheel2.navItems[i + 1].navItem.show();
                } else {
                    keyNameWheel2.navItems[i].navItem.show();
                    keyNameWheel2.navItems[i - 1].navItem.show();
                }
            }
        }
    } else {
        keyNameWheel.navigateWheel(i);
        keyNameWheel2.navItems[2 * i].navItem.hide();
        keyNameWheel2.navItems[2 * i + 1].navItem.hide();
    }

    const j = modes.indexOf(activity.KeySignatureEnv[1]);
    if (j !== -1) {
        modenameWheel.navigateWheel(j);
    }
};

/**
 * Shows a pie menu for selecting the rhythm dissect number.
 * Displays different options based on beginner mode.
 * @param {Object} widget - The widget instance (RhythmRuler).
 * @returns {void}
 */
const piemenuDissectNumber = widget => {
    // Use activity.beginnerMode as the global beginnerMode variable references the DOM element
    const isBeginnerMode = widget.activity.beginnerMode;

    // Determine wheel values based on beginner mode
    const wheelValues = isBeginnerMode ? [2, 3, 4] : [2, 3, 4, 5, 7];

    const currentValue = parseInt(widget._dissectNumber.value) || 2;

    // Show the wheel div
    docById("wheelDiv").style.display = "";

    // Create the number wheel
    const wheelSize = getPieMenuSize({ blocks: widget.activity.logo.blocks });
    const numberWheel = new wheelnav("wheelDiv", null, wheelSize, wheelSize);
    const exitWheel = new wheelnav("_exitWheel", numberWheel.raphael);

    // Prepare labels with spacer
    const wheelLabels = wheelValues.map(v => v.toString());
    wheelLabels.push(null); // spacer

    wheelnav.cssMode = true;
    numberWheel.keynavigateEnabled = false;
    numberWheel.colors = platformColor.numberWheelcolors;
    numberWheel.slicePathFunction = slicePath().DonutSlice;
    numberWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    numberWheel.slicePathCustom.minRadiusPercent = 0.2;
    numberWheel.slicePathCustom.maxRadiusPercent = 0.6;
    numberWheel.sliceSelectedPathCustom = numberWheel.slicePathCustom;
    numberWheel.sliceInitPathCustom = numberWheel.slicePathCustom;
    numberWheel.animatetime = 0;
    numberWheel.createWheel(wheelLabels);

    // Create exit wheel with close, minus, and plus buttons
    exitWheel.colors = platformColor.exitWheelcolors2;
    exitWheel.slicePathFunction = slicePath().DonutSlice;
    exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    exitWheel.slicePathCustom.minRadiusPercent = 0.0;
    exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
    exitWheel.sliceSelectedPathCustom = exitWheel.slicePathCustom;
    exitWheel.sliceInitPathCustom = exitWheel.slicePathCustom;
    exitWheel.clickModeRotate = false;
    exitWheel.initWheel(["×", "-", "+"]); // Close, minus, plus
    exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
    exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
    exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
    exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
    exitWheel.navItems[1].sliceSelectedAttr.cursor = "pointer";
    exitWheel.navItems[1].sliceHoverAttr.cursor = "pointer";
    exitWheel.navItems[1].titleSelectedAttr.cursor = "pointer";
    exitWheel.navItems[1].titleHoverAttr.cursor = "pointer";
    exitWheel.navItems[2].sliceSelectedAttr.cursor = "pointer";
    exitWheel.navItems[2].sliceHoverAttr.cursor = "pointer";
    exitWheel.navItems[2].titleSelectedAttr.cursor = "pointer";
    exitWheel.navItems[2].titleHoverAttr.cursor = "pointer";
    exitWheel.createWheel();
    configureExitWheel(exitWheel);

    // Handle selection
    const __selectionChanged = () => {
        const selectedIndex = numberWheel.selectedNavItemIndex;
        const newValue = wheelValues[selectedIndex];
        widget._dissectNumber.value = newValue;
    };

    // Handle exit
    const __exitMenu = () => {
        docById("wheelDiv").style.display = "none";
        numberWheel.removeWheel();
        exitWheel.removeWheel();
    };

    // Get button position for positioning the pie menu
    const buttonRect = widget._dissectNumber.getBoundingClientRect();
    const canvasLeft = widget.activity.canvas.offsetLeft + 28;
    const canvasTop = widget.activity.canvas.offsetTop + 6;

    // Position the wheel
    docById("wheelDiv").style.position = "absolute";
    setWheelSize(300);

    const left = Math.round(buttonRect.left - canvasLeft);
    const top = Math.round(buttonRect.top - canvasTop);

    // Position to the left of the button as shown in user image
    // left - 300 (wheel size) - 10px padding
    // top + half button height - 150 (half wheel size) for vertical centering
    docById("wheelDiv").style.left = Math.max(0, left - 300 - 10) + "px";
    docById("wheelDiv").style.top = Math.max(0, top + buttonRect.height / 2 - 150) + "px";

    // Navigate to current value
    const currentIndex = wheelValues.indexOf(currentValue);
    if (currentIndex !== -1) {
        numberWheel.navigateWheel(currentIndex);
    }

    // Set up click handlers for number selections
    for (let i = 0; i < wheelValues.length; i++) {
        numberWheel.navItems[i].navigateFunction = () => {
            __selectionChanged();
            __exitMenu();
        };
    }

    // Set up exit button (×)
    exitWheel.navItems[0].navigateFunction = () => {
        __exitMenu();
    };

    // Set up decrement button (-)
    exitWheel.navItems[1].navigateFunction = () => {
        const currentVal = parseInt(widget._dissectNumber.value);
        const currentIdx = wheelValues.indexOf(currentVal);

        // Move to previous value in the array, or stay at first
        if (currentIdx > 0) {
            const newValue = wheelValues[currentIdx - 1];
            widget._dissectNumber.value = newValue;
        }
    };

    // Set up increment button (+)
    exitWheel.navItems[2].navigateFunction = () => {
        const currentVal = parseInt(widget._dissectNumber.value);
        const currentIdx = wheelValues.indexOf(currentVal);

        // Move to next value in the array, or stay at last
        if (currentIdx < wheelValues.length - 1) {
            const newValue = wheelValues[currentIdx + 1];
            widget._dissectNumber.value = newValue;
        }
    };
};
