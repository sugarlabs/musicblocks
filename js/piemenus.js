// Copyright (c) 2014-20 Walter Bender
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

piemenuPitches = function(
    block, noteLabels, noteValues, accidentals, note, accidental, custom) {
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
    let hasOctaveWheel = block.connections[0] !== null &&
        ["pitch", "setpitchnumberoffset", "invert1", "tofrequency"].indexOf(
            block.blocks.blockList[block.connections[0]].name) !== -1;
    
    // If we are attached to a set key block, we want to order
    // pitch by fifths.
    if (block.connections[0] !== null &&
        ["setkey", "setkey2"].indexOf(block.blocks.blockList[block.connections[0]].name
                                     ) !== -1) {
        noteLabels = ["C", "G", "D", "A", "E", "B", "F"];
        noteValues = ["C", "G", "D", "A", "E", "B", "F"];
    }
    
    docById("wheelDiv").style.display = "";
    
    // the pitch selector
    block._pitchWheel = new wheelnav("wheelDiv", null, 600, 600);
    
    if (!custom) {
        // the accidental selector
        block._accidentalsWheel = new wheelnav("_accidentalsWheel",
                                               block._pitchWheel.raphael);
    }
    // the octave selector
    if (hasOctaveWheel) {
        block._octavesWheel = new wheelnav("_octavesWheel", block._pitchWheel.raphael);
    }
    
    // exit button
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
    block._exitWheel.createWheel(["×", " "]);
    
    if (!custom) {
        block._accidentalsWheel.colors = platformColor.accidentalsWheelcolors;
        block._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
        block._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        block._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.5;
        block._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
        block._accidentalsWheel.sliceSelectedPathCustom =
            block._accidentalsWheel.slicePathCustom;
        block._accidentalsWheel.sliceInitPathCustom =
            block._accidentalsWheel.slicePathCustom;

        let accidentalLabels = [];
        for (let i = 0; i < accidentals.length; i++) {
            accidentalLabels.push(accidentals[i]);
        }

        for (let i = 0; i < 9; i++) {
            accidentalLabels.push(null);
            block._accidentalsWheel.colors.push(
                platformColor.accidentalsWheelcolorspush
            );
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
        let octaveLabels = ["8", "7", "6", "5", "4", "3", "2", "1",
                            null, null, null, null, null, null];
        block._octavesWheel.animatetime = 0; // 300;
        block._octavesWheel.createWheel(octaveLabels);
    }
    
    // Position the widget over the note block.
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft = block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop = block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "300px";
    docById("wheelDiv").style.width = "300px";
    docById("wheelDiv").style.left = Math.min(
        block.blocks.turtles._canvas.width - 300, Math.max(0, Math.round(
            (x + block.blocks.stage.x) * block.blocks.getStageScale() + canvasLeft) - 200)
    ) + "px";
    docById("wheelDiv").style.top = Math.min(
        block.blocks.turtles._canvas.height - 350, Math.max(0, Math.round(
            (y + block.blocks.stage.y) * block.blocks.getStageScale() + canvasTop) - 200)
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
    
    const OFFSET = {"major": 1, "dorian": 2, "phrygian": 3, "lydian": 4,
                    "mixolydian": 5, "minor": 6, "locrian": 7};
    
    const ROTATION = {"A" : 2, "B" : 1, "C" : 0, "D" : 6, "E" : 5, "F" : 4, "G" : 3};
    
    let k = OFFSET[KeySignatureEnv[1]];
    
    let key;
    let attrList = ["", SHARP, FLAT];
    for (let j in attrList) {
        for (let i in NOTENAMES) {
            let tempScale = _buildScale(NOTENAMES[i] + attrList[j] + " major")[0];
            if (tempScale[k-1] == KeySignatureEnv[0]) {
                key = NOTENAMES[i] + attrList[j];
                console.debug(key);
                break;
            }
        }
        if (key != undefined) {
            break;
        }
    }
    let scale = _buildScale(key + " major")[0];
    scale = scale.splice(0, scale.length - 1);
    
    for (let j = 0; j < ROTATION[key[0]]; j++) {
        scale.push(scale.shift());
    }
    
    // auto selection of sharps and flats in fixed solfege
    // handles the case of opening the pie-menu, not whilst in the pie-menu
    if ((!KeySignatureEnv[2] && block.name === "solfege") ||
        (block.name === "notename") &&
        (block.connections[0] != undefined ? ["setkey", "setkey2"].indexOf(
            block.blocks.blockList[block.connections[0]].name) === -1: true)) {
        if (scale[6 - i][0] == FIXEDSOLFEGE[note] || scale[6 - i][0] == note) {
            accidental = scale[6 - i].substr(1);
        } else {
            accidental = EQUIVALENTACCIDENTALS[scale[6-i]].substr(1);
        }
        block.value = block.value.replace(SHARP, "").replace(FLAT, "");
        block.value += accidental;
        block.text.text = block.value;
    }
    
    if (!custom) {
        // Navigate to a the current accidental value.
        if (accidental === "") {
            block._accidentalsWheel.navigateWheel(2);
        } else {
            switch (accidental) {
            case DOUBLEFLAT:
                block._accidentalsWheel.navigateWheel(4);
                break;
            case FLAT:
                block._accidentalsWheel.navigateWheel(3);
                break;
            case NATURAL:
                block._accidentalsWheel.navigateWheel(2);
                break;
            case SHARP:
                block._accidentalsWheel.navigateWheel(1);
                break;
            case DOUBLESHARP:
                block._accidentalsWheel.navigateWheel(0);
                break;
            default:
                block._accidentalsWheel.navigateWheel(2);
                break;
            }
        }
    }
    
    if (hasOctaveWheel) {
        // Use the octave associated with block block, if available.
        let pitchOctave = block.blocks.findPitchOctave(block.connections[0]);

        // Navigate to current octave
        block._octavesWheel.navigateWheel(8 - pitchOctave);
        prevOctave = 8 - pitchOctave;
    }
    
    // Set up event handlers
    let that = block;
    let selection = {
        "note": note,
        "attr": accidental
    };
    
    let __selectionChangedSolfege = function() {
        selection["note"] =
            that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
        let i = noteLabels.indexOf(selection["note"]);
        that.value = noteValues[i];

        // auto selection of sharps and flats in fixed solfege
        // handles the case of opening the pie-menu, not whilst in the pie-menu
        // FIXEDSOLFEGE converts solfege to alphabet, needed for solfege pie-menu
        // In case of alphabet, direct comparison is performed

        if ((!KeySignatureEnv[2] && that.name == "solfege") ||
            (that.name == "notename") &&
            (that.connections[0] != undefined ? ["setkey", "setkey2"].indexOf(
                that.blocks.blockList[that.connections[0]].name) === -1: true)) {
            let i = NOTENAMES.indexOf(FIXEDSOLFEGE[selection["note"]]);
            if (i == -1) {
                i = NOTENAMES.indexOf(selection["note"]);
            }
            if (scale[i][0] == FIXEDSOLFEGE[selection["note"]] ||
                scale[i][0] == selection["note"]) {
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
            // Set the octave of the pitch block if available
            let octave = Number(
                that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex
                                           ].title);
            that.blocks.setPitchOctave(that.connections[0], octave);
        }

        if (that.connections[0] !== null && ["setkey", "setkey2"].indexOf(
            that.blocks.blockList[that.connections[0]].name) !== -1) {
            // We may need to update the mode widget.
            that.blocks.logo._modeBlock = that.blocks.blockList.indexOf(that);
        }
        __pitchPreview();
    };
    
    let __selectionChangedOctave = () => {
        let octave = Number(
            that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex
                                       ].title);
        that.blocks.setPitchOctave(that.connections[0], octave);
        __pitchPreview();
    }
    
    let __selectionChangedAccidental = () => {
        selection["attr"] =
            that._accidentalsWheel.navItems[that._accidentalsWheel.selectedNavItemIndex
                                           ].title;
        if (selection["attr"] !== "♮") {
            that.value = selection["note"] + selection["attr"];
        } else {
            that.value = selection["note"];
        }
        that.text.text = that.value;
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
        __pitchPreview();
    };
    
    /*
     * Preview the selected pitch using the synth
     * @return{void}
     * @private
     */
    let __pitchPreview = function() {
        let label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
        let i = noteLabels.indexOf(label);

        // Are we wrapping across C? We need to compare with the previous pitch
        if (prevPitch === null) {
            prevPitch = i;
        }

        let deltaPitch = i - prevPitch;
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
            attr = that._accidentalsWheel.navItems[
                that._accidentalsWheel.selectedNavItemIndex].title;
            if (label === " ") {
                return;
            } else if (attr !== "♮") {
                note += attr;
            }
        }

        let octave;
        if (hasOctaveWheel) {
            octave = Number(that._octavesWheel.navItems[
                that._octavesWheel.selectedNavItemIndex].title);
        } else {
            octave = 4;
        }

        octave += deltaOctave;
        if (octave < 1) {
            octave = 1;
        } else if (octave > 8) {
            octave = 8;
        }

        if (hasOctaveWheel && deltaOctave !== 0) {
            that._octavesWheel.navigateWheel(8 - octave);
            that.blocks.setPitchOctave(that.connections[0], octave);
        }
        
        let keySignature = KeySignatureEnv[0] + " " + KeySignatureEnv[1];

        let obj;
        if (that.name == "scaledegree2") {
            note = note.replace(attr, "");
            note = SOLFEGENAMES[note - 1];
            note += attr;
            obj = getNote(note, octave, 0, keySignature, true, null,
                          that.blocks.errorMsg, that.blocks.logo.synth.inTemperament);
        } else {
            // console.debug(note);
            obj = getNote(note, octave, 0, keySignature, KeySignatureEnv[2], null,
                          that.blocks.errorMsg, that.blocks.logo.synth.inTemperament);
        }
        if (!custom) {
            obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");
        }

        let tur = that.blocks.logo.turtles.ithTurtle(0);

        if (tur.singer.instrumentNames.length === 0 ||
            tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1) {
            tur.singer.instrumentNames.push(DEFAULTVOICE);
            that.blocks.logo.synth.createDefaultSynth(0);
            that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.blocks.logo.synth.setMasterVolume(PREVIEWVOLUME);
        Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);

        if (!that._triggerLock) {
            that._triggerLock = true;
            that.blocks.logo.synth.trigger(0, [obj[0] + obj[1]], 1 / 8, DEFAULTVOICE,
                                           null, null);
        }

        setTimeout(function() {
            that._triggerLock = false;
        }, 1 / 8);
    };
    
    // Set up handlers for pitch preview.
    for (let i = 0; i < noteValues.length; i++) {
        block._pitchWheel.navItems[i].navigateFunction = __selectionChangedSolfege;
    }
    
    if (!custom) {
        for (let i = 0; i < accidentals.length; i++) {
            block._accidentalsWheel.navItems[i].navigateFunction =
                __selectionChangedAccidental;
        }
    }
    
    if (hasOctaveWheel) {
        for (let i = 0; i < 8; i++) {
            block._octavesWheel.navItems[i].navigateFunction = __selectionChangedOctave;
        }
    }
    
    // Hide the widget when the exit button is clicked.
    block._exitWheel.navItems[0].navigateFunction = function() {
        that._piemenuExitTime = new Date().getTime();
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


piemenuCustomNotes = function(block, noteLabels, customLabels, selectedCustom, selectedNote) {
    // pie menu for customNote selection
    if (block.blocks.stageClick) {
        return;
    }
    
    docById("wheelDiv").style.display = "";
    
    // Some blocks have both pitch and octave, so we can modify
    // both at once.
    let hasOctaveWheel = block.connections[0] !== null &&
        ["pitch", "setpitchnumberoffset", "invert1", "tofrequency"].indexOf(
            block.blocks.blockList[block.connections[0]].name) !== -1;
    
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
    block._cusNoteWheel.titleFont = '100 24px Impact, sans-serif';
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
        let octaveLabels = ["8", "7", "6", "5", "4", "3", "2", "1",
                            null, null, null, null, null, null];
        block._octavesWheel.animatetime = 0; // 300;
        block._octavesWheel.createWheel(octaveLabels);
    }
    
    //Disable rotation, set navAngle and create the menus
    block._cusNoteWheel.clickModeRotate = false;
    block._cusNoteWheel.animatetime = 0; // 300;
    let labels = [];
    let blockCustom=0;
    let max =0 ;
    for (let t of customLabels) {
        max = max > noteLabels[t]["pitchNumber"] ? max : noteLabels[t]["pitchNumber"] ;
    }
    for (let t of customLabels) {
        for(let k =noteLabels[t].length -1 ; k>=0 ;k--) {
            if (k !== "pitchNumber") {
                labels.push(noteLabels[t][k][1]);
                blockCustom ++ ;
            }
        }
        for (let extra = max - blockCustom ; extra > 0 ;extra--){
            labels.push("");
        }
        blockCustom = 0 ;
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
    block._exitWheel.createWheel(["×", " "]);
    
    let that = block;
    
    // position widget
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft = block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop = block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "400px";
    docById("wheelDiv").style.width = "400px";
    docById("wheelDiv").style.left = Math.min(
        block.blocks.turtles._canvas.width - 400,
        Math.max(0, Math.round(
            (x + block.blocks.stage.x) * block.blocks.getStageScale() + canvasLeft
        ) - 200)) + "px";
    docById("wheelDiv").style.top = Math.min(
        block.blocks.turtles._canvas.height - 450,
        Math.max(0, Math.round(
            (y + block.blocks.stage.y) * block.blocks.getStageScale() + canvasTop
        ) - 200)) + "px";
    
    if (hasOctaveWheel) {
        // Use the octave associated with block block, if available.
        let pitchOctave = block.blocks.findPitchOctave(block.connections[0]);

        // Navigate to current octave
        block._octavesWheel.navigateWheel(8 - pitchOctave);
    }
    
    // Add function to each main menu for show/hide sub menus
    // FIXME: Add all tabs to each interval
    let __setupAction = function(i) {
        that._customWheel.navItems[i].navigateFunction = function() {
            that.customID =
                that._customWheel.navItems[that._customWheel.selectedNavItemIndex
                                          ].title;
            for (let l = 0; l < customLabels.length; l++) {
                for (let j = 0; j < max; j++) {
                    if (l !== i) {
                        that._cusNoteWheel.navItems[l * max + j].navItem.hide();
                    } else if (labels[l * max + j] == "") {
                        that._cusNoteWheel.navItems[l * max + j].navItem.hide();
                    } else {
                        that._cusNoteWheel.navItems[l * max + j].navItem.show();
                    }
                }
            }
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
    
    let j = selectedNote ;
    for (let x in noteLabels[selectedCustom]){
        if (x != "pitchNumber" && noteLabels[selectedCustom][x][1] == j) {
            j = +x ; break ;
        }
    }
    
    if (typeof j  == "number")
        block._cusNoteWheel.navigateWheel(max * customLabels.indexOf(selectedCustom) + j);
    
    let __exitMenu = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
    };
    
    let __selectionChanged = function() {
        let label = that._customWheel.navItems[that._customWheel.selectedNavItemIndex
                                              ].title;
        let note = that._cusNoteWheel.navItems[that._cusNoteWheel.selectedNavItemIndex
                                              ].title;

        that.value = note;
        that.text.text =note;
        let octave = 4 ;

        if (hasOctaveWheel) {
            // Set the octave of the pitch block if available
            octave = Number(that._octavesWheel.navItems[
                that._octavesWheel.selectedNavItemIndex].title);
            that.blocks.setPitchOctave(that.connections[0], octave);
        }

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();

        let obj = getNote(note, octave, 0, "C major", false, null,
                          that.blocks.errorMsg, label);
        let tur = that.blocks.logo.turtles.ithTurtle(0);

        if (tur.singer.instrumentNames.length === 0 ||
            tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1) {
            tur.singer.instrumentNames.push(DEFAULTVOICE);
            that.blocks.logo.synth.createDefaultSynth(0);
            that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.blocks.logo.synth.setMasterVolume(PREVIEWVOLUME);
        Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);

        if (!that._triggerLock) {
            //preview :
            that._triggerLock = true;
            let no = [obj[0]+obj[1]];
            let notes1 = no ;
            no = that.blocks.logo.synth.getCustomFrequency(no,that.customID);
            if (no === undefined) {
                no = notes1;
            }
            instruments[0][DEFAULTVOICE].triggerAttackRelease(no, 1/8);
        }

        setTimeout(function() {
            that._triggerLock = false;
        }, 1 / 8);
    }

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


piemenuNthModalPitch = function(block, noteValues, note) {
    // wheelNav pie menu for scale degree pitch selection
    
    // check if a non-integer value is connected to note argument
    // Pie menu would crash; so in such case navigate to closest integer
    
    if (note % 1 !== 0) {
        note = Math.floor(note + 0.5);
    }
    
    if (block.blocks.stageClick) {
        return;
    }
    
    let noteLabels = [];
    for (let i = 0; i < noteValues.length; i++) {
        noteLabels.push(noteValues[i].toString());
    }
    noteLabels.push(null);
    
    docById("wheelDiv").style.display = "";
    
    block._pitchWheel = new wheelnav("wheelDiv", null, 600, 600);
    block._octavesWheel = new wheelnav(
        "_octavesWheel",
        block._pitchWheel.raphael
    );
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
    block._exitWheel.createWheel(["×", " "]);
    
    block._octavesWheel.colors = platformColor.octavesWheelcolors;
    block._octavesWheel.slicePathFunction = slicePath().DonutSlice;
    block._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
    block._octavesWheel.slicePathCustom.minRadiusPercent = 0.80;
    block._octavesWheel.slicePathCustom.maxRadiusPercent = 1.00;
    block._octavesWheel.sliceSelectedPathCustom = block._octavesWheel.slicePathCustom;
    block._octavesWheel.sliceInitPathCustom = block._octavesWheel.slicePathCustom;
    let octaveLabels = [
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
    let labelElem = docById("labelDiv");
    labelElem.innerHTML =
        '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' +
        note +
        '" />';
    labelElem.classList.add("hasKeyboard");
    
    block.label = docById("numberLabel");
    block.label.addEventListener(
        "keypress",
        block._exitKeyPressed.bind(block)
    );
    
    block.label.addEventListener("change", function() {
        that._labelChanged(false, false);
    });
    
    // Position the widget above/below note block.
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft =
        block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop =
        block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "300px";
    docById("wheelDiv").style.width = "300px";
    
    let selectorWidth = 150;
    let left = Math.round(
        (x + block.blocks.stage.x) * block.blocks.getStageScale() + canvasLeft
    );
    let top = Math.round(
        (y + block.blocks.stage.y) * block.blocks.getStageScale() + canvasTop
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
        (Math.round(selectorWidth * block.blocks.blockScale) *
         block.protoblock.scale) /
        2 +
        "px";
    
    block.label.style.fontSize =
        Math.round(
            (20 * block.blocks.blockScale * block.protoblock.scale) / 2
        ) + "px";
    
    // Navigate to a the current note value.
    let i = noteValues.indexOf(note);
    
    block._pitchWheel.navigateWheel(i);
    
    // Use the octave associated with block block, if available.
    let pitchOctave = block.blocks.findPitchOctave(block.connections[0]);
    
    // Navigate to current octave
    block._octavesWheel.navigateWheel(8 - pitchOctave);
    
    // Set up event handlers
    let that = block;
    
    /*
     * Change selection and set value to notevalue
     * @return{void}
     * @private
     */
    let __selectionChanged = function() {
        let label =
            that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex]
            .title;
        let i = noteLabels.indexOf(label);
        that.value = noteValues[i];
        that.text.text = label;

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();

        // Set the octave of the pitch block if available
        let octave = Number(
            that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex
                                       ].title
        );
        that.blocks.setPitchOctave(that.connections[0], octave);
    };
    
    /*
     * Preview pitch
     * @return{void}
     * @private
     */
    let __pitchPreview = function() {
        let label =
            that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex]
            .title;
        let i = noteLabels.indexOf(label);

        /* We're using a default of C major ==> -7 to -1 should be one octave lower
           than the reference, 0-6 in the same octave and 7 should be once octave higher
        */
        let deltaOctave = 0;
        if (noteLabels[i] == 7) {
            deltaOctave = 1;
        } else if (noteLabels[i] < 0) {
            deltaOctave = -1;
        }

        // prevPitch = i;
        let octave = Number(
            that._octavesWheel.navItems[
                that._octavesWheel.selectedNavItemIndex
            ].title
        );
        octave += deltaOctave;
        if (octave < 1) {
            octave = 1;
        } else if (octave > 8) {
            octave = 8;
        }

        let note;

        // Use C major as of now; fix block to use current keySignature once that feature is in place
        let keySignature = KeySignatureEnv[0] + " " + KeySignatureEnv[1];
        if (noteValues[i] >= 0) {
            note = nthDegreeToPitch(keySignature, noteValues[i]);
        } else {
            note = nthDegreeToPitch(keySignature, 7 + noteValues[i]);
        }

        let tur = that.blocks.logo.turtles.ithTurtle(0);

        if (
            tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
        ) {
            tur.singer.instrumentNames.push(DEFAULTVOICE);
            that.blocks.logo.synth.createDefaultSynth(0);
            that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.blocks.logo.synth.setMasterVolume(PREVIEWVOLUME);
        Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);

        //Play sample note and prevent extra sounds from playing
        if (!that._triggerLock) {
            that._triggerLock = true;
            that.blocks.logo.synth.trigger(
                0,
                [note.replace(SHARP, "#").replace(FLAT, "b") + octave],
                1 / 8,
                DEFAULTVOICE,
                null,
                null
            );
        }

        setTimeout(function() {
            that._triggerLock = false;
        }, 1 / 8);

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
    block._exitWheel.navItems[0].navigateFunction = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._pitchWheel.removeWheel();
        that._exitWheel.removeWheel();
        that._octavesWheel.removeWheel();
    };
};


piemenuAccidentals = function(
    block, accidentalLabels, accidentalValues, accidental) {
    // wheelNav pie menu for accidental selection
    
    if (block.blocks.stageClick) {
        return;
    }
    
    docById("wheelDiv").style.display = "";
    
    // the accidental selector
    block._accidentalWheel = new wheelnav("wheelDiv", null, 600, 600);
    // exit button
    block._exitWheel = new wheelnav(
        "_exitWheel",
        block._accidentalWheel.raphael
    );
    
    let labels = [];
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
    block._exitWheel.createWheel(["×", " "]);
    
    let that = block;
    
    let __selectionChanged = function() {
        let label =
            that._accidentalWheel.navItems[
                that._accidentalWheel.selectedNavItemIndex
            ].title;
        let i = labels.indexOf(label);
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
    let __exitMenu = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._accidentalWheel.removeWheel();
        that._exitWheel.removeWheel();
    };
    
    // Position the widget over the note block.
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft =
        block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop =
        block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "300px";
    docById("wheelDiv").style.width = "300px";
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 300,
            Math.max(
                0,
                Math.round(
                    (x + block.blocks.stage.x) *
                        block.blocks.getStageScale() +
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
                    (y + block.blocks.stage.y) *
                        block.blocks.getStageScale() +
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
        block._accidentalWheel.navItems[i].navigateFunction = function() {
            __selectionChanged();
            __exitMenu();
        };
    }
    
    // Or use the exit wheel...
    block._exitWheel.navItems[0].navigateFunction = function() {
        __exitMenu();
    };
};


piemenuNoteValue = function(block, noteValue) {
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
                ["neighbor", "neighbor2"].indexOf(
                    block.blocks.blockList[cblk].name
                ) !== -1
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
    block._noteValueWheel = new wheelnav("wheelDiv", null, 600, 600);
    // exit button
    block._exitWheel = new wheelnav(
        "_exitWheel",
        block._noteValueWheel.raphael
    );
    // submenu wheel
    block._tabsWheel = new wheelnav(
        "_tabsWheel",
        block._noteValueWheel.raphael
    );
    
    let noteValueLabels = [];
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
    block._exitWheel.createWheel(["×", " "]);
    
    let tabsLabels = [];
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
    
    let that = block;
    
    /*
     * set value to number of text
     * @return{void}
     * @private
     */
    let __selectionChanged = function() {
        that.text.text =
            that._tabsWheel.navItems[
                that._tabsWheel.selectedNavItemIndex
            ].title;
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
    let __exitMenu = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._noteValueWheel.removeWheel();
        that._exitWheel.removeWheel();
        that.label.style.display = "none";
        if (that._check_meter_block !== null) {
            that.blocks.meter_block_changed(that._check_meter_block);
        }
    };
    
    let labelElem = docById("labelDiv");
    labelElem.innerHTML =
        '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' +
        noteValue +
        '" />';
    labelElem.classList.add("hasKeyboard");
    block.label = docById("numberLabel");
    
    block.label.addEventListener(
        "keypress",
        block._exitKeyPressed.bind(block)
    );
    
    block.label.addEventListener("change", function() {
        that._labelChanged(false, false);
    });
    
    // Position the widget over the note block.
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft =
        block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop =
        block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "300px";
    docById("wheelDiv").style.width = "300px";
    
    let selectorWidth = 150;
    let left = Math.round(
        (x + block.blocks.stage.x) * block.blocks.getStageScale() + canvasLeft
    );
    let top = Math.round(
        (y + block.blocks.stage.y) * block.blocks.getStageScale() + canvasTop
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
        (Math.round(selectorWidth * block.blocks.blockScale) *
         block.protoblock.scale) /
        2 +
        "px";
    
    let __showHide = function() {
        let i = that._noteValueWheel.selectedNavItemIndex;
        for (let k = 0; k < WHEELVALUES.length; k++) {
            for (
                let j = 0;
                j < subWheelValues[WHEELVALUES[0]].length;
                j++
            ) {
                let n = k * subWheelValues[WHEELVALUES[0]].length;
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
        for (let i = 0; i < WHEELVALUES.length; i++) {
	    let j;
            for (j = 0; j < subWheelValues[WHEELVALUES[i]].length; j++) {
                if (subWheelValues[WHEELVALUES[i]][j] === noteValue) {
                    block._noteValueWheel.navigateWheel(i);
                    block._tabsWheel.navigateWheel(
                        i * subWheelValues[WHEELVALUES[i]].length + j);
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
        Math.round(
            (20 * block.blocks.blockScale * block.protoblock.scale) / 2
        ) + "px";
    block.label.style.display = "";
    block.label.focus();
    
    // Hide the widget when the selection is made.
    for (let i = 0; i < tabsLabels.length; i++) {
        block._tabsWheel.navItems[i].navigateFunction = function() {
            __selectionChanged();
            __exitMenu();
        };
    }
    
    // Or use the exit wheel...
    block._exitWheel.navItems[0].navigateFunction = function() {
        __exitMenu();
    };
};

piemenuNumber = function(block, wheelValues, selectedValue) {
    // input form and  wheelNav pie menu for number selection
    
    if (block.blocks.stageClick) {
        return;
    }
    
    docById("wheelDiv").style.display = "";
    
    // the number selector
    block._numberWheel = new wheelnav("wheelDiv", null, 600, 600);
    // exit button
    block._exitWheel = new wheelnav("_exitWheel", block._numberWheel.raphael);
    
    let wheelLabels = [];
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
    if (block.blocks.blockList[
        block.connections[0]].name === "setbpm3" ||
        block.blocks.blockList[
            block.connections[0]].name === "setmasterbpm2") {
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
    } else if (block.blocks.blockList[
        block.connections[0]].name === "setheading") {
        // Set 0 (north) to the top of the wheel.
        block._numberWheel.navAngle = -90;
    }
    
    block._numberWheel.animatetime = 0; // 300;
    block._numberWheel.createWheel(wheelLabels);
    
    if (block._numberWheel.navItems.length > 20) {
        for (let i = 0; i < block._numberWheel.navItems.length; i++) {
            block._numberWheel.navItems[i].titleAttr.font =
                "30 30px sans-serif";
            block._numberWheel.navItems[i].titleSelectedAttr.font =
                "30 30px sans-serif";
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
    block._exitWheel.createWheel(["×", "-", "+"]);
    
    let that = block;
    
    let __selectionChanged = function() {
        that.value = wheelValues[that._numberWheel.selectedNavItemIndex];
        that.text.text =
            wheelLabels[that._numberWheel.selectedNavItemIndex];

        // Make sure text is on top.
        that.container.setChildIndex(that.text,  that.container.children.length - 1);
        that.updateCache();
    };
    
    let __exitMenu = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._numberWheel.removeWheel();
        that._exitWheel.removeWheel();
        that.label.style.display = "none";

        if (that._check_meter_block !== null) {
            that.blocks.meter_block_changed(that._check_meter_block);
        }
    };
    
    let labelElem = docById("labelDiv");
    labelElem.innerHTML =
        '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' +
        selectedValue +
        '" />';
    labelElem.classList.add("hasKeyboard");
    block.label = docById("numberLabel");
    
    block.label.addEventListener(
        "keypress",
        block._exitKeyPressed.bind(block)
    );
    
    block.label.addEventListener("change", function() {
        that._labelChanged(false, false);
    });
    
    // Position the widget over the note block.
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft =
        block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop =
        block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "300px";
    docById("wheelDiv").style.width = "300px";
    
    let selectorWidth = 150;
    let left = Math.round(
        (x + block.blocks.stage.x) * block.blocks.getStageScale() + canvasLeft
    );
    let top = Math.round(
        (y + block.blocks.stage.y) * block.blocks.getStageScale() + canvasTop
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
        (Math.round(selectorWidth * block.blocks.blockScale) *
         block.protoblock.scale) / 2 + "px";
    // Navigate to a the current number value.
    let i = wheelValues.indexOf(selectedValue);
    if (i === -1) {
        i = 0;
    }
    
    // In case of float value, navigate to the nearest integer
    if (selectedValue % 1 !== 0) {
        i = wheelValues.indexOf(Math.floor(selectedValue + 0.5));
    }
    
    if (i !== -1) {
        block._numberWheel.navigateWheel(i);
    }
    
    block.label.style.fontSize =
        Math.round(
            (20 * block.blocks.blockScale * block.protoblock.scale) / 2
        ) + "px";
    
    block.label.style.display = "";
    block.label.focus();
    
    // Hide the widget when the selection is made.
    for (let i = 0; i < wheelLabels.length; i++) {
        block._numberWheel.navItems[i].navigateFunction = function() {
            __selectionChanged();
            __exitMenu();
        };
    }
    
    // Or use the exit wheel...
    block._exitWheel.navItems[0].navigateFunction = function() {
        __exitMenu();
    };
    
    block._exitWheel.navItems[1].navigateFunction = function () {
        let cblk1 = that.connections[0];
        let cblk2 = that.blocks.blockList[cblk1].connections[0];

        // Check if the number block is connected to a note value and prevent the value to go below zero
        if ((that.value < 1) && (that.blocks.blockList[cblk1].name === 'newnote' || (cblk2 && that.blocks.blockList[cblk2].name == 'newnote'))) {
            that.value = 0;
        } else {
            that.value -= 1;
        }

        that.text.text = that.value.toString();

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();

        that.label.value = that.value;
    };
    
    block._exitWheel.navItems[2].navigateFunction = function() {
        that.value += 1;
        that.text.text = that.value.toString();

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();

        that.label.value = that.value;
    };
    
    let __pitchPreviewForNum = function() {
        let label = that._numberWheel.navItems[that._numberWheel.selectedNavItemIndex].title;
        let i = wheelLabels.indexOf(label);
        let actualPitch = numberToPitch(wheelValues[i] + 3);

        let tur = that.blocks.logo.turtles.ithTurtle(0);

        if (
            tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
        ) {
            tur.singer.instrumentNames.push(DEFAULTVOICE);
            that.blocks.logo.synth.createDefaultSynth(0);
            that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.blocks.logo.synth.setMasterVolume(PREVIEWVOLUME);
        Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);

        actualPitch[0] = actualPitch[0]
            .replace(SHARP, "#")
            .replace(FLAT, "b");
        if (!that._triggerLock) {
            that._triggerLock = true;
            that.blocks.logo.synth.trigger(
                0,
                actualPitch[0] + (actualPitch[1] + 3),
                1 / 8,
                DEFAULTVOICE,
                null,
                null
            );
        }

        setTimeout(function() {
            that._triggerLock = false;
        }, 1 / 8);

        __selectionChanged();
    };
    
    let __hertzPreview = function() {
        let label = that._numberWheel.navItems[that._numberWheel.selectedNavItemIndex].title;
        let i = wheelLabels.indexOf(label);
        let actualPitch = frequencyToPitch(wheelValues[i]);

        let tur = that.blocks.logo.turtles.ithTurtle(0);

        if (
            tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
        ) {
            tur.singer.instrumentNames.push(DEFAULTVOICE);
            that.blocks.logo.synth.createDefaultSynth(0);
            that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.blocks.logo.synth.setMasterVolume(PREVIEWVOLUME);
        Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);

        actualPitch[0] = actualPitch[0]
            .replace(SHARP, "#")
            .replace(FLAT, "b");
        if (!that._triggerLock) {
            that._triggerLock = true;
            that.blocks.logo.synth.trigger(
                0,
                actualPitch[0] + actualPitch[1],
                1 / 8,
                DEFAULTVOICE,
                null,
                null
            );
        }

        setTimeout(function() {
            that._triggerLock = false;
        }, 1 / 8);

        __selectionChanged();
    };
    
    // Handler for pitchnumber preview. Block is to ensure that
    // only pitchnumber block's pie menu gets a sound preview
    if (
        block._usePieNumberC1() &&
            block.blocks.blockList[block.connections[0]].name === "pitchnumber"
    ) {
        for (let i = 0; i < wheelValues.length; i++) {
            block._numberWheel.navItems[
                i
            ].navigateFunction = __pitchPreviewForNum;
        }
    }
    
    // Handler for Hertz preview. Need to also ensure that
    // only hertz block gets a different sound preview
    if (
        block._usePieNumberC1() &&
            block.blocks.blockList[block.connections[0]].name === "hertz"
    ) {
        for (let i = 0; i < wheelValues.length; i++) {
            block._numberWheel.navItems[i].navigateFunction = __hertzPreview;
        }
    }
};


piemenuColor = function(block, wheelValues, selectedValue, mode) {
    // input form and  wheelNav pie menu for setcolor selection
    
    if (block.blocks.stageClick) {
        return;
    }
    
    docById("wheelDiv").style.display = "";
    
    // the number selector
    block._numberWheel = new wheelnav("wheelDiv", null, 600, 600);
    // exit button
    block._exitWheel = new wheelnav("_exitWheel", block._numberWheel.raphael);
    
    let wheelLabels = [];
    for (let i = 0; i < wheelValues.length; i++) {
        wheelLabels.push(wheelValues[i].toString());
    }
    
    wheelnav.cssMode = true;
    
    block._numberWheel.keynavigateEnabled = false;
    
    block._numberWheel.colors = [];
    if (mode === "setcolor") {
        for (let i = 0; i < wheelValues.length; i++) {
            block._numberWheel.colors.push(
                COLORS40[Math.floor(wheelValues[i] / 2.5)][2]
            );
        }
    } else if (mode === "sethue") {
        for (let i = 0; i < wheelValues.length; i++) {
            block._numberWheel.colors.push(
                getMunsellColor(wheelValues[i], 50, 50)
            );
        }
    } else {
        if (mode === "setshade") {
            for (let i = 0; i < wheelValues.length; i++) {
                block._numberWheel.colors.push(
                    getMunsellColor(0, wheelValues[i], 0)
                );
            }
        } else if (mode === "settranslucency") {
            for (let i = 0; i < wheelValues.length; i++) {
                block._numberWheel.colors.push(
                    getMunsellColor(35, 70, 100 - wheelValues[i])
                );
            }
        } else {
            for (let i = 0; i < wheelValues.length; i++) {
                block._numberWheel.colors.push(
                    getMunsellColor(60, 60, wheelValues[i])
                );
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
    block._exitWheel.createWheel(["×", " "]);
    
    let that = block;
    
    let __selectionChanged = function() {
        that.value = wheelValues[that._numberWheel.selectedNavItemIndex];
        that.text.text =
            wheelLabels[that._numberWheel.selectedNavItemIndex];

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
    };
    
    let __exitMenu = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._numberWheel.removeWheel();
        that._exitWheel.removeWheel();
        that.label.style.display = "none";
    };
    
    let labelElem = docById("labelDiv");
    labelElem.innerHTML =
        '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' +
        selectedValue +
        '" />';
    labelElem.classList.add("hasKeyboard");
    block.label = docById("numberLabel");
    
    block.label.addEventListener(
        "keypress",
        block._exitKeyPressed.bind(block)
    );
    
    block.label.addEventListener("change", function() {
        that._labelChanged(false, false);
    });
    
    // Position the widget over the note block.
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft =
        block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop =
        block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "300px";
    docById("wheelDiv").style.width = "300px";
    
    let selectorWidth = 150;
    let left = Math.round(
        (x + block.blocks.stage.x) * block.blocks.getStageScale() + canvasLeft
    );
    let top = Math.round(
        (y + block.blocks.stage.y) * block.blocks.getStageScale() + canvasTop
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
        (Math.round(selectorWidth * block.blocks.blockScale) *
         block.protoblock.scale) /
        2 +
        "px";
    
    // Navigate to a the current number value.
    let i = wheelValues.indexOf(selectedValue);
    if (i === -1) {
        i = 0;
    }
    
    block._numberWheel.navigateWheel(i);
    // docById('wheelDiv').style.display = '';
    
    block.label.style.fontSize =
        Math.round(
            (20 * block.blocks.blockScale * block.protoblock.scale) / 2
        ) + "px";
    block.label.style.display = "";
    block.label.focus();
    
    // Hide the widget when the selection is made.
    for (let i = 0; i < wheelLabels.length; i++) {
        block._numberWheel.navItems[i].navigateFunction = function() {
            __selectionChanged();
            __exitMenu();
        };
    }
    
    // Or use the exit wheel...
    block._exitWheel.navItems[0].navigateFunction = function() {
        __exitMenu();
    };
};


piemenuBasic = function(
    block, menuLabels, menuValues, selectedValue, colors) {
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
    }
    
    // the selectedValueh selector
    block._basicWheel = new wheelnav("wheelDiv", null, size, size);
    
    let labels = [];
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
    block._basicWheel.titleRotateAngle = 0;
    block._basicWheel.animatetime = 0; // 300;
    block._basicWheel.createWheel(labels);
    
    let that = block;
    
    let __selectionChanged = function() {
        let label =
            that._basicWheel.navItems[that._basicWheel.selectedNavItemIndex]
            .title;
        let i = labels.indexOf(label);
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
    
    let __exitMenu = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._basicWheel.removeWheel();
    };
    
    // Position the widget over the note block.
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft =
        block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop =
        block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "300px";
    docById("wheelDiv").style.width = "300px";
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 300,
            Math.max(
                0,
                Math.round(
                    (x + block.blocks.stage.x) *
                        block.blocks.getStageScale() +
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
                    (y + block.blocks.stage.y) *
                        block.blocks.getStageScale() +
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
        block._basicWheel.navItems[i].navigateFunction = function() {
            __selectionChanged();
            __exitMenu();
        };
    }
};


piemenuBoolean = function(block, booleanLabels, booleanValues, boolean) {
    // wheelNav pie menu for boolean selection
    
    if (block.blocks.stageClick) {
        return;
    }
    
    docById("wheelDiv").style.display = "";
    
    // the booleanh selector
    block._booleanWheel = new wheelnav("wheelDiv", null, 600, 600);
    
    let labels = [];
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
    
    let that = block;
    
    let __selectionChanged = function() {
        let label =
            that._booleanWheel.navItems[
                that._booleanWheel.selectedNavItemIndex
            ].title;
        let i = labels.indexOf(label);
        that.value = booleanValues[i];
        that.text.text = booleanLabels[i];

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();
    };
    
    let __exitMenu = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        that._booleanWheel.removeWheel();
    };
    
    // Position the widget over the note block.
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft =
        block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop =
        block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "300px";
    docById("wheelDiv").style.width = "300px";
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 300,
            Math.max(
                0,
                Math.round(
                    (x + block.blocks.stage.x) *
                        block.blocks.getStageScale() +
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
                    (y + block.blocks.stage.y) *
                        block.blocks.getStageScale() +
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
    block._booleanWheel.navItems[0].navigateFunction = function() {
        __selectionChanged();
        __exitMenu();
    };
    
    block._booleanWheel.navItems[1].navigateFunction = function() {
        __selectionChanged();
        __exitMenu();
    };
};


piemenuVoices = function(
    block, voiceLabels, voiceValues, categories, voice, rotate) {
    // wheelNav pie menu for voice selection
    
    if (block.blocks.stageClick) {
        return;
    }
    
    const COLORS = platformColor.piemenuVoicesColors;
    let colors = [];
    
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
    let language = localStorage.languagePreference;
    // if (language === 'ja') {
    for (let i = 0; i < block._voiceWheel.navItems.length; i++) {
        block._voiceWheel.navItems[i].titleAttr.font = "30 30px sans-serif";
        block._voiceWheel.navItems[i].titleSelectedAttr.font =
            "30 30px sans-serif";
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
    block._exitWheel.createWheel(["×", " "]);
    
    let that = block;
    
    let __selectionChanged = function() {
        let label =
            that._voiceWheel.navItems[that._voiceWheel.selectedNavItemIndex]
            .title;
        let i = voiceLabels.indexOf(label);
        that.value = voiceValues[i];
        that.text.text = label;

        if (getDrumName(that.value) === null) {
            that.blocks.logo.synth.loadSynth(
                0,
                getVoiceSynthName(that.value)
            );
        } else {
            that.blocks.logo.synth.loadSynth(
                0,
                getDrumSynthName(that.value)
            );
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
    let __voicePreview = function() {
        let label = that._voiceWheel.navItems[that._voiceWheel.selectedNavItemIndex].title;
        let i = voiceLabels.indexOf(label);
        let voice = voiceValues[i];
        let timeout = 0;

        let tur = that.blocks.logo.turtles.ithTurtle(0);

        if (
            tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(voice) === -1
        ) {
            tur.singer.instrumentNames.push(voice);
            if (voice === DEFAULTVOICE) {
                that.blocks.logo.synth.createDefaultSynth(0);
            }
    
            that.blocks.logo.synth.loadSynth(0, voice);
            // give the synth time to load
            timeout = 500;
        }

        setTimeout(function() {
            that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
            Singer.setSynthVolume(that.blocks.logo, 0, voice, DEFAULTVOLUME);
            that.blocks.logo.synth.trigger(
                0,
                "G4",
                1 / 4,
                voice,
                null,
                null,
                false
            );
            that.blocks.logo.synth.start();
        }, timeout);

        __selectionChanged();
    };
    
    // position widget
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft =
        block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop =
        block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "400px";
    docById("wheelDiv").style.width = "400px";
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 400,
            Math.max(
                0,
                Math.round(
                    (x + block.blocks.stage.x) *
                        block.blocks.getStageScale() +
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
                    (y + block.blocks.stage.y) *
                        block.blocks.getStageScale() +
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
    
    // Set up handlers for voice preview.
    for (let i = 0; i < voiceValues.length; i++) {
        block._voiceWheel.navItems[i].navigateFunction = __voicePreview;
    }
    
    // Hide the widget when the exit button is clicked.
    block._exitWheel.navItems[0].navigateFunction = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
    };
};


piemenuIntervals = function(block, selectedInterval) {
    // pie menu for interval selection
    
    if (block.blocks.stageClick) {
        return;
    }
    
    docById("wheelDiv").style.display = "";
    
    // Use advanced constructor for more wheelnav on same div
    let language = localStorage.languagePreference;
    if (language === "ja") {
        block._intervalNameWheel = new wheelnav(
            "wheelDiv",
            null,
            1500,
            1500
        );
    } else {
        block._intervalNameWheel = new wheelnav("wheelDiv", null, 800, 800);
    }
    
    block._intervalWheel = new wheelnav(
        "block._intervalWheel",
        block._intervalNameWheel.raphael
    );
    // exit button
    block._exitWheel = new wheelnav(
        "_exitWheel",
        block._intervalNameWheel.raphael
    );
    
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
    let labels = [];
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
    block._intervalWheel.navAngle =
        -(180 / labels.length) + 180 / (8 * labels.length);
    block._intervalWheel.animatetime = 0; // 300;
    
    let numbers = [];
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
    block._exitWheel.createWheel(["×", " "]);
    
    let that = block;
    
    // position widget
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft =
        block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop =
        block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "400px";
    docById("wheelDiv").style.width = "400px";
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 400,
            Math.max(
                0,
                Math.round(
                    (x + block.blocks.stage.x) *
                        block.blocks.getStageScale() +
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
                    (y + block.blocks.stage.y) *
                        block.blocks.getStageScale() +
                        canvasTop
                ) - 200
            )
        ) + "px";
    
    // Add function to each main menu for show/hide sub menus
    // FIXME: Add all tabs to each interval
    let __setupAction = function(i, activeTabs) {
        that._intervalNameWheel.navItems[i].navigateFunction = function() {
            for (let l = 0; l < labels.length; l++) {
                for (let j = 0; j < 8; j++) {
                    if (l !== i) {
                        that._intervalWheel.navItems[
                            l * 8 + j
                        ].navItem.hide();
                    } else if (activeTabs.indexOf(j + 1) === -1) {
                        that._intervalWheel.navItems[
                            l * 8 + j
                        ].navItem.hide();
                    } else {
                        that._intervalWheel.navItems[
                            l * 8 + j
                        ].navItem.show();
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
    let obj = selectedInterval.split(" ");
    for (let i = 0; i < INTERVALS.length; i++) {
        if (obj[0] === INTERVALS[i][1]) {
            break;
        }
    }
    
    if (i === INTERVALS.length) {
        i = 0;
    }
    
    block._intervalNameWheel.navigateWheel(i);
    
    let j = Number(obj[1]);
    if (INTERVALS[i][2].indexOf(j) !== -1) {
        block._intervalWheel.navigateWheel(j - 1);
    } else {
        block._intervalWheel.navigateWheel(INTERVALS[i][2][0] - 1);
    }
    
    let __exitMenu = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
    };
    
    let __selectionChanged = function() {
        let label =
            that._intervalNameWheel.navItems[
                that._intervalNameWheel.selectedNavItemIndex
            ].title;
        let number =
            that._intervalWheel.navItems[that._intervalWheel.selectedNavItemIndex].title;

        that.value = INTERVALS[that._intervalNameWheel.selectedNavItemIndex][1] + " " + number;
        if (label === "perfect 1") {
            that.text.text = _("unison");
        } else {
            that.text.text = label + " " + number;
        }

        // Make sure text is on top.
        that.container.setChildIndex(that.text, that.container.children.length - 1);
        that.updateCache();

        let obj = getNote("C", 4, INTERVALVALUES[that.value][0], "C major", false, null, null);
        obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");

        let tur = that.blocks.logo.turtles.ithTurtle(0);

        if (
            tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
        ) {
            tur.singer.instrumentNames.push(DEFAULTVOICE);
            that.blocks.logo.synth.createDefaultSynth(0);
            that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
        Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, DEFAULTVOLUME);

        if (!that._triggerLock) {
            that._triggerLock = true;
    
            that.blocks.logo.synth.trigger(
                0,
                ["C4", obj[0] + obj[1]],
                1 / 8,
                DEFAULTVOICE,
                null,
                null
            );
        }

        setTimeout(function() {
            that._triggerLock = false;
        }, 1 / 8);
    };
    
    // Set up handlers for preview.
    for (let i = 0; i < 8 * labels.length; i++) {
        block._intervalWheel.navItems[
            i
        ].navigateFunction = __selectionChanged;
    }
    
    block._exitWheel.navItems[0].navigateFunction = __exitMenu;
};


piemenuModes = function(block, selectedMode) {
    // pie menu for mode selection
    
    if (block.blocks.stageClick) {
        return;
    }
    
    // Look for a key block
    let key = "C";
    let modeGroup = "7"; // default mode group
    let octave = false;
    
    let c = block.connections[0];
    if (c !== null) {
        if (block.blocks.blockList[c].name === "setkey2") {
            let c1 = block.blocks.blockList[c].connections[1];
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
    block._modeGroupWheel = new wheelnav(
        "_modeGroupWheel",
        block._modeWheel.raphael
    );
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
    block._modeWheel.createWheel([
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
    ]);
    
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
    
    let xlabels = [];
    for (modegroup in MODE_PIE_MENUS) {
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
    block._exitWheel.createWheel(["×", "▶"]); // imgsrc:header-icons/play-button.svg']);
    
    let that = block;
    
    let __selectionChanged = function() {
        let title =
            that._modeNameWheel.navItems[
                that._modeNameWheel.selectedNavItemIndex
            ].title;
        if (title === " ") {
            that._modeNameWheel.navigateWheel(
                (that._modeNameWheel.selectedNavItemIndex + 1) %
                    that._modeNameWheel.navItems.length
            );
        } else {
            that.text.text =
                that._modeNameWheel.navItems[
                    that._modeNameWheel.selectedNavItemIndex
                ].title;
    
            if (that.text.text === _("major") + " / " + _("ionian")) {
                that.value = "major";
            } else if (
                that.text.text ===
                    _("minor") + " / " + _("aeolian")
            ) {
                that.value = "aeolian";
            } else {
                for (let i = 0; i < MODE_PIE_MENUS[modeGroup].length; i++) {
                    let modename = MODE_PIE_MENUS[modeGroup][i];
    
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
    let __setupAction = function(i, activeTabs) {
        that._modeNameWheel.navItems[i].navigateFunction = function() {
            for (let j = 0; j < 12; j++) {
                if (activeTabs.indexOf(j) === -1) {
                    that._modeWheel.navItems[j].navItem.hide();
                } else {
                    that._modeWheel.navItems[j].navItem.show();
                }
            }
    
            __selectionChanged();
        };
    };
    
    // Build a pie menu of modes based on the current mode group.
    let __buildModeNameWheel = function(grp) {
        let newWheel = false;
        if (that._modeNameWheel === null) {
            that._modeNameWheel = new wheelnav(
                "_modeNameWheel",
                that._modeWheel.raphael
            );
            newWheel = true;
        }

        that._modeNameWheel.keynavigateEnabled = false;

        // Customize slicePaths
        let colors = [];
        for (let i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
            let modename = MODE_PIE_MENUS[grp][i];
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
        that._modeNameWheel.sliceSelectedPathCustom =
            that._modeNameWheel.slicePathCustom;
        that._modeNameWheel.sliceInitPathCustom =
            that._modeNameWheel.slicePathCustom;
        that._modeNameWheel.titleRotateAngle = 0;
        // that._modeNameWheel.clickModeRotate = false;
        that._modeNameWheel.navAngle = -90;
        let labels = new Array();
        for (let i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
            let modename = MODE_PIE_MENUS[grp][i];
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
                // Maybe there is a method that does block.
                that._modeNameWheel.navItems[i].title = labels[i];
                that._modeNameWheel.navItems[i].basicNavTitleMax.title =
                    labels[i];
                that._modeNameWheel.navItems[i].basicNavTitleMin.title =
                    labels[i];
                that._modeNameWheel.navItems[i].hoverNavTitleMax.title =
                    labels[i];
                that._modeNameWheel.navItems[i].hoverNavTitleMin.title =
                    labels[i];
                that._modeNameWheel.navItems[i].selectedNavTitleMax.title =
                    labels[i];
                that._modeNameWheel.navItems[i].selectedNavTitleMin.title =
                    labels[i];
                that._modeNameWheel.navItems[i].initNavTitle.title =
                    labels[i];
                that._modeNameWheel.navItems[i].fillAttr = colors[i];
                that._modeNameWheel.navItems[i].sliceHoverAttr.fill =
                    colors[i];
                that._modeNameWheel.navItems[i].slicePathAttr.fill =
                    colors[i];
                that._modeNameWheel.navItems[i].sliceSelectedAttr.fill =
                    colors[i];
            }
    
            that._modeNameWheel.refreshWheel();
        }

        // Special case for Japanese
        let language = localStorage.languagePreference;
        if (language === "ja") {
            for (let i = 0; i < that._modeNameWheel.navItems.length; i++) {
                that._modeNameWheel.navItems[i].titleAttr.font =
                    "30 30px sans-serif";
                that._modeNameWheel.navItems[i].titleSelectedAttr.font =
                    "30 30px sans-serif";
            }
        }

        // Set up tabs for each mode.
        let i = 0;
        for (let j = 0; j < MODE_PIE_MENUS[grp].length; j++) {
            let modename = MODE_PIE_MENUS[grp][j];
            let activeTabs = [0];
            if (modename !== " ") {
                let mode = MUSICALMODES[modename];
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
    
    let __exitMenu = function() {
        that._piemenuExitTime = new Date().getTime();
        docById("wheelDiv").style.display = "none";
        if (that._modeNameWheel !== null) {
            that._modeNameWheel.removeWheel();
        }
    };
    
    let __playNote = function() {
        let o = 0;
        if (octave) {
            o = 12;
        }

        let i = that._modeWheel.selectedNavItemIndex;
        // The mode doesn't matter here, since we are using semi-tones
        let obj = getNote(key, 4, i + o, key + " chromatic", false, null, null);
        obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");

        let tur = that.blocks.logo.turtles.ithTurtle(0);

        if (
            tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
        ) {
            tur.singer.instrumentNames.push(DEFAULTVOICE);
            that.blocks.logo.synth.createDefaultSynth(0);
            that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
        }

        that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
        Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, DEFAULTVOLUME);
        that.blocks.logo.synth.trigger(
            0,
            [obj[0] + obj[1]],
            1 / 12,
            DEFAULTVOICE,
            null,
            null
        );
    };
    
    let __playScale = function(activeTabs, idx) {
        // loop through selecting modeWheel slices with a delay.
        if (idx < activeTabs.length) {
            if (activeTabs[idx] < 12) {
                octave = false;
                that._modeWheel.navigateWheel(activeTabs[idx]);
            } else {
                octave = true;
                that._modeWheel.navigateWheel(0);
            }
    
            setTimeout(function() {
                __playScale(activeTabs, idx + 1);
            }, 1000 / 10); // slight delay between notes
        }
    };
    
    /*
     * prepare scale
     * @return{void}
     * @private
     */
    let __prepScale = function() {
        let activeTabs = [0];
        let mode = MUSICALMODES[that.value];
        for (let k = 0; k < mode.length - 1; k++) {
            activeTabs.push(last(activeTabs) + mode[k]);
        }

        activeTabs.push(12);
        activeTabs.push(12);

        for (let k = mode.length - 1; k >= 0; k--) {
            activeTabs.push(last(activeTabs) - mode[k]);
        }

        __playScale(activeTabs, 0);
    };
    
    // position widget
    let x = block.container.x;
    let y = block.container.y;
    
    let canvasLeft =
        block.blocks.canvas.offsetLeft + 28 * block.blocks.blockScale;
    let canvasTop =
        block.blocks.canvas.offsetTop + 6 * block.blocks.blockScale;
    
    docById("wheelDiv").style.position = "absolute";
    docById("wheelDiv").style.height = "600px";
    docById("wheelDiv").style.width = "600px";
    
    // Block widget is large. Be sure it fits on the screen.
    docById("wheelDiv").style.left =
        Math.min(
            block.blocks.turtles._canvas.width - 600,
            Math.max(
                0,
                Math.round(
                    (x + block.blocks.stage.x) *
                        block.blocks.getStageScale() +
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
                    (y + block.blocks.stage.y) *
                        block.blocks.getStageScale() +
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
            let modename = MODE_PIE_MENUS[modeGroup][j];
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
    
    let __buildModeWheel = function() {
        let i = that._modeGroupWheel.selectedNavItemIndex;
        modeGroup = that._modeGroupWheel.navItems[i].title;
        __buildModeNameWheel(modeGroup);
    };
    
    for (let i = 0; i < block._modeGroupWheel.navItems.length; i++) {
        block._modeGroupWheel.navItems[
            i
        ].navigateFunction = __buildModeWheel;
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
piemenuBlockContext = function(block) {
    if (block.blocks.activeBlock === null) {
        return;
    }

    let pasteDx = 0;
    let pasteDy = 0;

    let that = block;
    let blockBlock = block.blocks.blockList.indexOf(block);

    // Position the widget centered over the active block.
    docById("contextWheelDiv").style.position = "absolute";

    let x = block.blocks.blockList[blockBlock].container.x;
    let y = block.blocks.blockList[blockBlock].container.y;

    let canvasLeft = block.blocks.canvas.offsetLeft + 28 * block.blocks.getStageScale();
    let canvasTop = block.blocks.canvas.offsetTop + 6 * block.blocks.getStageScale();

    docById("contextWheelDiv").style.left =
        Math.round((x + block.blocks.stage.x) * block.blocks.getStageScale() +
                   canvasLeft) - 150 + "px";
    docById("contextWheelDiv").style.top =
        Math.round((y + block.blocks.stage.y) * block.blocks.getStageScale() +
                   canvasTop) - 150 + "px";

    docById("contextWheelDiv").style.display = "";

    labels = [
        "imgsrc:header-icons/copy-button.svg",
        "imgsrc:header-icons/extract-button.svg",
        "imgsrc:header-icons/empty-trash-button.svg",
        "imgsrc:header-icons/cancel-button.svg"
    ];

    let topBlock = block.blocks.findTopBlock(blockBlock);
    if (block.name === 'action') {
        labels.push('imgsrc:header-icons/save-blocks-button.svg');
    }
    let message =
        block.blocks.blockList[block.blocks.activeBlock].protoblock.helpString;
    let helpButton;
    if (message) {
        labels.push("imgsrc:header-icons/help-button.svg");
        helpButton = labels.length - 1;
    } else {
        helpButton = null;
    }

    let wheel = new wheelnav("contextWheelDiv", null, 250, 250);
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
    if (block.blocks.blockList[topBlock].name === "action") {
        wheel.navItems[4].setTooltip(_("Save stack"));
    }

    if (helpButton !== null) {
        wheel.navItems[helpButton].setTooltip(_("Help"));
    }

    wheel.navItems[0].selected = false;

    wheel.navItems[0].navigateFunction = function() {
        that.blocks.activeBlock = blockBlock;
        that.blocks.prepareStackForCopy();
        that.blocks.pasteDx = pasteDx;
        that.blocks.pasteDy = pasteDy;
        that.blocks.pasteStack();
        pasteDx += 21;
        pasteDy += 21;
        // docById('contextWheelDiv').style.display = 'none';
    };

    wheel.navItems[1].navigateFunction = function() {
        that.blocks.activeBlock = blockBlock;
        that.blocks.extract();
        docById("contextWheelDiv").style.display = "none";
    };

    wheel.navItems[2].navigateFunction = function() {
        that.blocks.activeBlock = blockBlock;
        that.blocks.extract();
        that.blocks.sendStackToTrash(that.blocks.blockList[blockBlock]);
        docById("contextWheelDiv").style.display = "none";
    };

    wheel.navItems[3].navigateFunction = function() {
        docById("contextWheelDiv").style.display = "none";
    };

    if (block.name === "action") {
        wheel.navItems[4].navigateFunction = function() {
            that.blocks.activeBlock = blockBlock;
            that.blocks.prepareStackForCopy();
            that.blocks.saveStack();
        };
    }

    if (helpButton !== null) {
        wheel.navItems[helpButton].navigateFunction = function() {
            that.blocks.activeBlock = blockBlock;
            let helpWidget = new HelpWidget(blocks);
            docById("contextWheelDiv").style.display = "none";
        };
    }

    setTimeout(function() {
        that.blocks.stageClick = false;
    }, 500);
};
