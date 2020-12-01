// Copyright (c) 2018 Riya Lohia
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function TemperamentWidget() {
    const BUTTONDIVWIDTH = 430;
    const OUTERWINDOWWIDTH = 685;
    const INNERWINDOWWIDTH = 600;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    var temperamentTableDiv = document.createElement("div");
    var temperamentCell = null;
    this.inTemperament = null;
    this.lastTriggered = null;
    this.notes = [];
    this.frequencies = [];
    this.intervals = [];
    this.ratios = [];
    this.scale = [];
    this.cents = [];
    this.scaleNotes = [];
    this.pitchNumber = 0;
    this.circleIsVisible = true;
    this.playbackForward = true;

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML =
            '&nbsp;&nbsp;<img src="header-icons/' +
            icon +
            '" title="' +
            label +
            '" alt="' +
            label +
            '" height="' +
            iconSize +
            '" width="' +
            iconSize +
            '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover = function() {
            this.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        };

        cell.onmouseout = function() {
            this.style.backgroundColor = platformColor.selectorBackground;
        };

        return cell;
    };

    this._circleOfNotes = function() {
        this.circleIsVisible = false;
        this.toggleNotesButton();
        temperamentTableDiv.style.display = "inline";
        temperamentTableDiv.style.visibility = "visible";
        temperamentTableDiv.style.border = "0px";
        temperamentTableDiv.style.overflow = "auto";
        temperamentTableDiv.style.backgroundColor = "white";
        temperamentTableDiv.style.height = "300px";
        temperamentTableDiv.innerHTML = '<div id="temperamentTable"></div>';
        var temperamentTable = docById("temperamentTable");
        temperamentTable.style.position = "relative";

        var radius = 150;
        var height = 2 * radius + 60;

        var html =
            '<canvas id="circ" width = ' +
            BUTTONDIVWIDTH +
            "px height = " +
            height +
            "px></canvas>";
        html += '<div id="wheelDiv2" class="wheelNav"></div>';
        html += '<div id ="information"></div>';

        temperamentTable.innerHTML = html;
        temperamentTable.style.width = "300px";

        var canvas = docById("circ");
        canvas.style.position = "absolute";
        canvas.style.zIndex = 1;
        canvas.style.background = "rgba(255, 255, 255, 0.85)";
        var ctx = canvas.getContext("2d");
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(204, 0, 102, 0)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#003300";
        ctx.stroke();

        var angle = [];
        docById("wheelDiv2").style.display = "";
        docById("wheelDiv2").style.background = "none";

        this.createMainWheel = function(ratios, pitchNumber) {
            if (ratios === undefined) {
                ratios = this.ratios;
            }
            if (pitchNumber === undefined) {
                pitchNumber = this.pitchNumber;
            }

            var labels = [];
            for (var j = 0; j < pitchNumber; j++) {
                var label = j.toString();
                labels.push(label);
            }

            this.notesCircle = new wheelnav("wheelDiv2", null, 350, 350);
            this.notesCircle.wheelRadius = 230;
            this.notesCircle.navItemsEnabled = false;
            this.notesCircle.navAngle = 270;
            this.notesCircle.navItemsContinuous = true;
            this.notesCircle.navItemsCentered = false;
            this.notesCircle.slicePathFunction = slicePath().MenuSliceWithoutLine;
            this.notesCircle.slicePathCustom = slicePath().MenuSliceCustomization();
            this.notesCircle.sliceSelectedPathCustom = this.notesCircle.slicePathCustom;
            this.notesCircle.sliceInitPathCustom = this.notesCircle.slicePathCustom;
            this.notesCircle.initWheel(labels);
            angle = [];
            var baseAngle = [];
            var sliceAngle = [];
            var angleDiff = [];
            for (var i = 0; i < this.notesCircle.navItemCount; i++) {
                this.notesCircle.navItems[i].fillAttr = "#c8C8C8";
                this.notesCircle.navItems[i].titleAttr.font =
                    "20 20px Impact, Charcoal, sans-serif";
                this.notesCircle.navItems[i].titleSelectedAttr.font =
                    "20 20px Impact, Charcoal, sans-serif";
                angle[i] =
                    270 +
                    360 * (Math.log10(ratios[i]) / Math.log10(this.powerBase));
                if (i !== 0) {
                    if (i == pitchNumber - 1) {
                        angleDiff[i - 1] = angle[0] + 360 - angle[i];
                    } else {
                        angleDiff[i - 1] = angle[i] - angle[i - 1];
                    }
                }
                if (i === 0) {
                    sliceAngle[i] = 360 / pitchNumber;
                    baseAngle[i] =
                        this.notesCircle.navAngle - sliceAngle[0] / 2;
                } else {
                    baseAngle[i] = baseAngle[i - 1] + sliceAngle[i - 1];
                    sliceAngle[i] = 2 * (angle[i] - baseAngle[i]);
                }
                this.notesCircle.navItems[i].sliceAngle = sliceAngle[i];
            }

            var menuRadius = (2 * Math.PI * radius) / pitchNumber / 3;
            for (var i = 0; i < angleDiff.length; i++) {
                if (angleDiff[i] < 11) {
                    menuRadius = (2 * Math.PI * radius) / pitchNumber / 6;
                }
            }
            if (menuRadius > 29) {
                menuRadius = (2 * Math.PI * radius) / 33;
            }
            this.notesCircle.slicePathCustom.menuRadius = menuRadius;
            this.notesCircle.createWheel();

            docById("wheelDiv2").style.position = "absolute";
            docById("wheelDiv2").style.height = height + "px";
            docById("wheelDiv2").style.width = BUTTONDIVWIDTH + "px";
            docById("wheelDiv2").style.zIndex = 5;
        };

        this.createMainWheel();

        var that = this;

        if (this.octaveChanged) {
            var divAppend = document.createElement("div");
            divAppend.id = "divAppend";
            divAppend.innerHTML =
                '<div id="clearNotes" style="float:left;">Clear</div><div id="standardOctave" style="float:right;">Back to 2:1 Octave Space</div>';
            divAppend.style.textAlign = "center";
            divAppend.style.position = "absolute";
            divAppend.style.zIndex = 2;
            divAppend.style.height = "33px";
            divAppend.style.width = docById("wheelDiv2").style.width;
            divAppend.style.marginTop = height + "px";
            divAppend.style.background = "rgba(255, 255, 255, 0.85)";
            divAppend.style.overflow = "auto";
            docById("temperamentTable").append(divAppend);

            var divAppend1 = docById("clearNotes");
            divAppend1.style.height = "30px";
            divAppend1.style.marginLeft = "3px";
            divAppend1.style.backgroundColor = platformColor.selectorBackground;
            divAppend1.style.width = "212px";

            var divAppend2 = docById("standardOctave");
            divAppend2.style.height = "30px";
            divAppend2.style.marginRight = "3px";
            divAppend2.style.backgroundColor = platformColor.selectorBackground;
            divAppend2.style.width = BUTTONDIVWIDTH / 2 - 8 + "px";
        } else {
            var divAppend1 = document.createElement("div");
            divAppend1.id = "divAppend";
            divAppend1.innerHTML = "Clear";
            divAppend1.style.textAlign = "center";
            divAppend1.style.position = "absolute";
            divAppend1.style.zIndex = 2;
            divAppend1.style.paddingTop = "5px";
            divAppend1.style.backgroundColor = platformColor.selectorBackground;
            divAppend1.style.height = "25px";
            divAppend1.style.width = docById("wheelDiv2").style.width;
            divAppend1.style.marginTop = docById("wheelDiv2").style.height;
            divAppend1.style.overflow = "auto";
            docById("temperamentTable").append(divAppend1);
        }

        if (divAppend1 !== undefined) {
            divAppend1.onclick = function() {
                var ratio = that.ratios[0];
                that.ratios = [];
                that.ratios[0] = ratio;
                that.ratios[1] = that.powerBase;
                var frequency = that.frequencies[0];
                that.frequencies = [];
                that.frequencies[0] = frequency;
                that.frequencies[1] = frequency * that.powerBase;
                that.pitchNumber = 1;
                that.checkTemperament(that.ratios);
                that._circleOfNotes();
            };
        }

        if (divAppend2 !== undefined) {
            divAppend2.onclick = function() {
                var powers = [];
                var compareRatios = [];
                var frequency = that.frequencies[0];
                that.frequencies = [];

                for (var i = 0; i < that.ratios.length; i++) {
                    powers[i] =
                        12 *
                        (Math.log10(that.ratios[i]) /
                            Math.log10(that.powerBase));
                    that.ratios[i] = Math.pow(2, powers[i] / 12);
                    compareRatios[i] = that.ratios[i].toFixed(2);
                    that.frequencies[i] = that.ratios[i] * frequency;
                    that.frequencies[i] = that.frequencies[i].toFixed(2);
                }
                that.powerBase = 2;
                that.checkTemperament(compareRatios);
                that.octaveChanged = false;
                that._circleOfNotes();
            };
        }

        docById("temperamentTable").addEventListener("click", function(e) {
            that.showNoteInfo(e, angle);
        });
    };

    this.showNoteInfo = function(event, angle) {
        for (var i = 0; i < this.notesCircle.navItemCount; i++) {
            if (
                event.target.id == "wheelnav-wheelDiv2-slice-" + i ||
                (event.target.innerHTML == i && event.target.innerHTML !== "")
            ) {
                var x =
                    event.clientX -
                    docById("wheelDiv2").getBoundingClientRect().left;
                var y =
                    event.clientY -
                    docById("wheelDiv2").getBoundingClientRect().top;
                var frequency = this.frequencies[i];
                var that = this;
                if (docById("noteInfo") !== null) {
                    docById("noteInfo").remove();
                }

                docById("information").innerHTML +=
                    '<div class="popup" id="noteInfo" style=" left: ' +
                    x +
                    "px; top: " +
                    y +
                    'px;"><span class="popuptext" id="myPopup"></span></div>';
                if (i !== 0) {
                    docById("noteInfo").innerHTML +=
                        '<img src="header-icons/edit.svg" id="edit" title="edit" alt="edit" height=20px width=20px data-message="' +
                        i +
                        '">';
                }
                docById("noteInfo").innerHTML +=
                    '<img src="header-icons/close-button.svg" id="close" title="close" alt="close" height=20px width=20px align="right"><br>';
                var noteDefined = false;
                for (var j = 0; j < this.ratiosNotesPair.length; j++) {
                    if (this.ratios[i] == this.ratiosNotesPair[j][0]) {
                        noteDefined = true;
                        docById("noteInfo").innerHTML +=
                            '<div id="note">&nbsp; Note : ' +
                            this.ratiosNotesPair[j][1] +
                            "</div>";
                        break;
                    }
                }
                if (noteDefined == false) {
                    var cents =
                        1200 * (Math.log10(this.ratios[i]) / Math.log10(2));
                    var centsDiff = [];
                    var centsDiff1 = [];
                    for (var j = 0; j < this.cents.length; j++) {
                        centsDiff[j] = cents - this.cents[j];
                        centsDiff1[j] = Math.abs(cents - this.cents[j]);
                    }
                    var min = centsDiff1.reduce(function(a, b) {
                        return Math.min(a, b);
                    });
                    var index = centsDiff1.indexOf(min);

                    if (centsDiff[index] < 0) {
                        docById("noteInfo").innerHTML +=
                            '<div id="note">&nbsp; Note : ' +
                            this.ratiosNotesPair[index][1] +
                            "(- " +
                            centsDiff1[index].toFixed(2) +
                            ")" +
                            "</div>";
                    } else {
                        docById("noteInfo").innerHTML +=
                            '<div id="note">&nbsp; Note : ' +
                            this.ratiosNotesPair[index][1] +
                            "(+ " +
                            centsDiff1[index].toFixed(2) +
                            ")" +
                            "</div>";
                    }
                }
                docById("noteInfo").innerHTML +=
                    '<div id="frequency">&nbsp Frequency : ' +
                    frequency +
                    "</div>";

                docById("noteInfo").style.top = "130px";
                docById("noteInfo").style.left = "132px";
                docById("noteInfo").style.position = "absolute";
                docById("noteInfo").style.zIndex = 10;
                docById("close").onclick = function() {
                    docById("noteInfo").remove();
                };

                if (docById("edit") !== null) {
                    docById("edit").addEventListener("click", function(e) {
                        that.editFrequency(e);
                    });
                }
            }
        }
    };

    this.editFrequency = function(event) {
        var i = Number(event.target.dataset.message);
        var that = this;

        docById("noteInfo").style.width = "180px";
        docById("noteInfo").style.height = "130px";
        docById("note").innerHTML = "";
        docById("frequency").innerHTML = "";
        docById("noteInfo").innerHTML +=
            '<center><input type="range" class="sliders" id = "frequencySlider1" style="width:170px; background:white; border:0;" min="' +
            this.frequencies[i - 1] +
            '" max="' +
            this.frequencies[i + 1] +
            '"></center>';
        docById("noteInfo").innerHTML +=
            '<br>&nbsp;&nbsp;Frequency : <span class="rangeslidervalue" id="frequencydiv1">' +
            this.frequencies[i] +
            "</span>";
        docById("noteInfo").innerHTML +=
            '<br><br><div id="done" style="background:rgb(196, 196, 196);"><center>Done</center><div>';

        docById("frequencySlider1").oninput = function() {
            docById("frequencydiv1").innerHTML = docById(
                "frequencySlider1"
            ).value;
            var frequency = docById("frequencySlider1").value;
            var ratio = frequency / that.frequencies[0];
            var labels = [];
            var ratioDifference = [];
            that.temporaryRatios = that.ratios.slice();
            that.temporaryRatios[i] = ratio;
            that._logo.resetSynth(0);
            that._logo.synth.trigger(
                0, frequency, Singer.defaultBPMFactor * 0.01, "electronic synth", null, null
            );
            that.createMainWheel(that.temporaryRatios);
        };

        docById("done").onclick = function() {
            that.ratios = that.temporaryRatios.slice();
            that.typeOfEdit = "nonequal";
            that.createMainWheel();
            var frequency1 = that.frequencies[0];
            that.frequencies = [];
            for (var j = 0; j < that.ratios.length; j++) {
                that.frequencies[j] = that.ratios[j] * frequency1;
                that.frequencies[j] = that.frequencies[j].toFixed(2);
            }
            that.checkTemperament(that.ratios);
            docById("noteInfo").remove();
        };
        docById("close").onclick = function() {
            that.temporaryRatios = that.ratios.slice();
            that.createMainWheel();
            docById("noteInfo").remove();
        };
    };

    this._graphOfNotes = function() {
        this.circleIsVisible = true;
        this.toggleNotesButton();
        temperamentTableDiv.innerHTML = "";
        if (docById("wheelDiv2") != null) {
            docById("wheelDiv2").style.display = "none";
            this.notesCircle.removeWheel();
        }

        temperamentTableDiv.innerHTML = '<table id="notesGraph"></table>';
        var notesGraph = docById("notesGraph");
        var headerNotes = notesGraph.createTHead();
        var rowNotes = headerNotes.insertRow(0);
        var menuLabels = [];
        if (isCustom(this.inTemperament)) {
            menuLabels = ["Play", "Pitch Number", "Ratio", "Frequency"];
        } else {
            menuLabels = [
                "Play",
                "Pitch Number",
                "Ratio",
                "Interval",
                "Note",
                "Frequency"
            ];
            menuLabels.splice(5, 0, this.scale);
        }
        notesGraph.innerHTML =
            '<thead id="tablehead"><tr id="menu"></tr></thead><tbody id="tablebody"></tbody>';
        var menus = "";

        for (var i = 0; i < menuLabels.length; i++) {
            menus += '<th id="menuLabels">' + menuLabels[i] + "</th>";
        }

        docById("menu").innerHTML = menus;

        var menuItems = document.querySelectorAll("#menuLabels");
        for (var i = 0; i < menuLabels.length; i++) {
            menuItems[i].style.background = platformColor.labelColor;
            menuItems[i].style.height = 30 + "px";
            menuItems[i].style.textAlign = "center";
            menuItems[i].style.fontWeight = "bold";
            if (isCustom(this.inTemperament)) {
                menuItems[0].style.width = 40 + "px";
                menuItems[1].style.width = 120 + "px";
                menuItems[2].style.width = 120 + "px";
                menuItems[3].style.width = 140 + "px";
            } else {
                menuItems[0].style.width = 40 + "px";
                menuItems[1].style.width = 40 + "px";
                menuItems[2].style.width = 60 + "px";
                menuItems[3].style.width = 120 + "px";
                menuItems[4].style.width = 50 + "px";
                menuItems[5].style.width = 100 + "px";
                menuItems[6].style.width = 95 + "px";
            }
        }
        var pitchNumberColumn = "";
        for (var i = 0; i <= this.pitchNumber; i++) {
            pitchNumberColumn += '<tr id="notes_' + i + '"></tr>';
        }

        docById("tablebody").innerHTML +=
            '<tr><td colspan="7"><div id="graph"><table id="tableOfNotes"></table></div></td></tr>';
        docById("tableOfNotes").innerHTML = pitchNumberColumn;

        var startingPitch = this._logo.synth.startingPitch;
        var that = this;
        var notesRow = [];
        var notesCell = [];
        var noteToPlay = [];
        var ratios = [];

        for (var i = 0; i <= this.pitchNumber; i++) {
            notesRow[i] = docById("notes_" + i);

            notesCell[(i, 0)] = notesRow[i].insertCell(-1);
            notesCell[(i, 0)].innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="play" alt="play" height="20px" width="20px" id="play_' +
                i +
                '" data-id="' +
                i +
                '">&nbsp;&nbsp;';
            notesCell[(i, 0)].style.width = 40 + "px";
            notesCell[(i, 0)].style.backgroundColor =
                platformColor.selectorBackground;
            notesCell[(i, 0)].style.textAlign = "center";

            notesCell[(i, 0)].onmouseover = function() {
                this.style.backgroundColor =
                    platformColor.selectorBackgroundHOVER;
            };

            notesCell[(i, 0)].onmouseout = function() {
                this.style.backgroundColor = platformColor.selectorBackground;
            };

            var playImage = docById("play_" + i);

            playImage.onmouseover = function(event) {
                this.style.cursor = "pointer";
            };

            playImage.onclick = function(event) {
                var pitchNumber = event.target.dataset.id;
                that.playNote(pitchNumber);
            };

            //Pitch Number
            notesCell[(i, 1)] = notesRow[i].insertCell(-1);
            notesCell[(i, 1)].id = "pitchNumber_" + i;
            notesCell[(i, 1)].innerHTML = i;
            notesCell[(i, 1)].style.backgroundColor =
                platformColor.selectorBackground;
            notesCell[(i, 1)].style.textAlign = "center";

            ratios[i] = this.ratios[i];
            ratios[i] = ratios[i].toFixed(2);

            //Ratio
            notesCell[(i, 2)] = notesRow[i].insertCell(-1);
            notesCell[(i, 2)].innerHTML = ratios[i];
            notesCell[(i, 2)].style.backgroundColor =
                platformColor.selectorBackground;
            notesCell[(i, 2)].style.textAlign = "center";

            if (!isCustom(this.inTemperament)) {
                //Interval
                notesCell[(i, 3)] = notesRow[i].insertCell(-1);
                notesCell[(i, 3)].innerHTML = this.intervals[i];
                notesCell[(i, 3)].style.width = 120 + "px";
                notesCell[(i, 3)].style.backgroundColor =
                    platformColor.selectorBackground;
                notesCell[(i, 3)].style.textAlign = "center";

                //Notes
                notesCell[(i, 4)] = notesRow[i].insertCell(-1);
                notesCell[(i, 4)].innerHTML = this.notes[i];
                notesCell[(i, 4)].style.width = 50 + "px";
                notesCell[(i, 4)].style.backgroundColor =
                    platformColor.selectorBackground;
                notesCell[(i, 4)].style.textAlign = "center";

                //Mode
                notesCell[(i, 5)] = notesRow[i].insertCell(-1);
                for (var j = 0; j < this.scaleNotes.length; j++) {
                    if (this.notes[i][0] == this.scaleNotes[j]) {
                        notesCell[(i, 5)].innerHTML = j;
                        break;
                    }
                }
                if (notesCell[(i, 5)].innerHTML === "") {
                    notesCell[(i, 5)].innerHTML = "Non Scalar";
                }
                notesCell[(i, 5)].style.width = 100 + "px";
                notesCell[(i, 5)].style.backgroundColor =
                    platformColor.selectorBackground;
                notesCell[(i, 5)].style.textAlign = "center";
            }

            //Frequency
            notesCell[(i, 6)] = notesRow[i].insertCell(-1);
            notesCell[(i, 6)].innerHTML = this.frequencies[i];
            notesCell[(i, 6)].style.backgroundColor =
                platformColor.selectorBackground;
            notesCell[(i, 6)].style.textAlign = "center";

            if (isCustom(this.inTemperament)) {
                notesCell[(i, 1)].style.width = 130 + "px";
                notesCell[(i, 6)].style.width = 130 + "px";
                notesCell[(i, 2)].style.width = 130 + "px";
            } else {
                notesCell[(i, 1)].style.width = 60 + "px";
                notesCell[(i, 6)].style.width = 80 + "px";
                notesCell[(i, 2)].style.width = 60 + "px";
            }
        }
    };

    this.edit = function() {
        this.editMode = null ;
        this._logo.synth.setMasterVolume(0);
        this._logo.synth.stop();
        var that = this;
        if (docById("wheelDiv2") != null) {
            docById("wheelDiv2").style.display = "none";
            this.notesCircle.removeWheel();
        }
        temperamentTableDiv.innerHTML = "";
        temperamentTableDiv.innerHTML =
            '<table id="editOctave" width="' +
            BUTTONDIVWIDTH +
            '"><tbody><tr id="menu"></tr></tbody></table>';
        var editMenus = ["Equal", "Ratios", "Arbitrary", "Octave Space"];
        var menus = "";

        for (var i = 0; i < editMenus.length; i++) {
            menus += '<td id="editMenus">' + editMenus[i] + "</td>";
        }

        docById("menu").innerHTML = menus;
        docById("editOctave").innerHTML +=
            '<tr><td colspan="4" id="userEdit"></td></tr>';
        var menuItems = document.querySelectorAll("#editMenus");
        for (var i = 0; i < editMenus.length; i++) {
            menuItems[i].style.background = platformColor.selectorBackground;
            menuItems[i].style.height = 30 + "px";
            menuItems[i].style.textAlign = "center";
            menuItems[i].style.fontWeight = "bold";
        }

        menuItems[0].style.background = "#c8C8C8";
        that.equalEdit();

        menuItems[0].onclick = function(event) {
            menuItems[1].style.background = platformColor.selectorBackground;
            menuItems[2].style.background = platformColor.selectorBackground;
            menuItems[3].style.background = platformColor.selectorBackground;
            menuItems[0].style.background = "#c8C8C8";
            that.equalEdit();
        };

        menuItems[1].onclick = function(event) {
            menuItems[0].style.background = platformColor.selectorBackground;
            menuItems[2].style.background = platformColor.selectorBackground;
            menuItems[3].style.background = platformColor.selectorBackground;
            menuItems[1].style.background = "#c8C8C8";
            that.ratioEdit();
        };

        menuItems[2].onclick = function(event) {
            menuItems[0].style.background = platformColor.selectorBackground;
            menuItems[1].style.background = platformColor.selectorBackground;
            menuItems[3].style.background = platformColor.selectorBackground;
            menuItems[2].style.background = "#c8C8C8";
            that.arbitraryEdit();
        };

        menuItems[3].onclick = function(event) {
            menuItems[0].style.background = platformColor.selectorBackground;
            menuItems[1].style.background = platformColor.selectorBackground;
            menuItems[2].style.background = platformColor.selectorBackground;
            menuItems[3].style.background = "#c8C8C8";
            that.octaveSpaceEdit();
        };
    };

    this.equalEdit = function() {
        this.editMode = "equal";
        docById("userEdit").innerHTML = "";
        var equalEdit = docById("userEdit");
        equalEdit.style.backgroundColor = "#c8C8C8";
        equalEdit.innerHTML =
            '<br>Pitch Number &nbsp;&nbsp;&nbsp;&nbsp; <input type="text" id="octaveIn" value="0"></input> &nbsp;&nbsp; To &nbsp;&nbsp; <input type="text" id="octaveOut" value="0"></input><br><br>';
        equalEdit.innerHTML +=
            'Number of Divisions &nbsp;&nbsp;&nbsp;&nbsp; <input type="text" id="divisions" value="' +
            this.pitchNumber +
            '"></input>';
        equalEdit.style.paddingLeft = "80px";
        var that = this;

        function addDivision(preview) {
            // Add Buttons
            var divAppend = document.createElement("div");
            divAppend.id = "divAppend";
            if (preview) {
                divAppend.innerHTML =
                    '<div id="preview" style="float:left;">Back</div><div id="done_" style="float:right;">Done</div>';
            } else {
                divAppend.innerHTML =
                    '<div id="preview" style="float:left;">Preview</div><div id="done_" style="float:right;">Done</div>';
            }
            divAppend.style.textAlign = "center";
            divAppend.style.marginLeft = "-80px";
            divAppend.style.height = "32px";
            divAppend.style.marginTop = "40px";
            divAppend.style.overflow = "auto";
            equalEdit.append(divAppend);

            var divAppend1 = docById("preview");
            divAppend1.style.height = "30px";
            divAppend1.style.marginLeft = "3px";
            divAppend1.style.backgroundColor = platformColor.selectorBackground;
            divAppend1.style.width = "215px";

            var divAppend2 = docById("done_");
            divAppend2.style.height = "30px";
            divAppend2.style.marginRight = "3px";
            divAppend2.style.backgroundColor = platformColor.selectorBackground;
            divAppend2.style.width = "205px";
        }

        addDivision(false);

        divAppend.onmouseover = function() {
            this.style.cursor = "pointer";
        };

        var pitchNumber = this.pitchNumber;
        var pitchNumber1 = Number(docById("octaveIn").value);
        var pitchNumber2 = Number(docById("octaveOut").value);
        var divisions = Number(docById("divisions").value);
        var ratio = [];
        var compareRatios = [];
        var ratio1 = [];
        var ratio2 = [];
        var ratio3 = [];
        var index = [];
        this.tempRatios = [];

        divAppend.addEventListener("click", function(event) {
            that.performEqualEdit(event);
        });

        this.performEqualEdit = function(event) {
            pitchNumber1 = Number(docById("octaveIn").value);
            pitchNumber2 = Number(docById("octaveOut").value);
            divisions = Number(docById("divisions").value);
            this.tempRatios = this.ratios.slice();
            if (pitchNumber1 === pitchNumber2) {
                for (var i = 0; i < divisions; i++) {
                    ratio[i] = Math.pow(this.powerBase, i / divisions);
                    ratio1[i] = ratio[i].toFixed(2);
                }
                for (var i = 0; i < this.tempRatios.length; i++) {
                    ratio2[i] = this.tempRatios[i];
                    ratio2[i] = ratio2[i].toFixed(2);
                }
                var ratio4 = ratio1.filter(function(val) {
                    return ratio2.indexOf(val) == -1;
                });

                for (var i = 0; i < ratio4.length; i++) {
                    index[i] = ratio1.indexOf(ratio4[i]);
                    ratio3[i] = ratio[index[i]];
                }

                this.tempRatios = this.tempRatios.concat(ratio3);
                this.tempRatios.sort(function(a, b) {
                    return a - b;
                });
                pitchNumber = this.tempRatios.length - 1;
                this.typeOfEdit = "equal";
                this.divisions = divisions;
            } else {
                pitchNumber =
                    divisions +
                    Number(pitchNumber) -
                    Math.abs(pitchNumber1 - pitchNumber2);
                var angle1 =
                    270 +
                    360 *
                        (Math.log10(this.tempRatios[pitchNumber1]) /
                            Math.log10(this.powerBase));
                var angle2 =
                    270 +
                    360 *
                        (Math.log10(this.tempRatios[pitchNumber2]) /
                            Math.log10(this.powerBase));
                var divisionAngle = Math.abs(angle2 - angle1) / divisions;
                this.tempRatios.splice(
                    pitchNumber1 + 1,
                    Math.abs(pitchNumber1 - pitchNumber2) - 1
                );
                for (var i = 0; i < divisions - 1; i++) {
                    var power =
                        (Math.min(angle1, angle2) +
                            divisionAngle * (i + 1) -
                            270) /
                        360;
                    ratio[i] = Math.pow(this.powerBase, power);
                    this.tempRatios.splice(pitchNumber1 + 1 + i, 0, ratio[i]);
                    compareRatios[i] = this.tempRatios[i];
                    compareRatios[i] = compareRatios[i].toFixed(2);
                }
                this.typeOfEdit = "nonequal";
            }

            if (event.target.innerHTML === "Done") {
                //Go to main Circle of Notes
                this.ratios = this.tempRatios.slice();
                var frequency = this.frequencies[0];
                this.frequencies = [];
                for (var i = 0; i <= pitchNumber; i++) {
                    this.frequencies[i] = this.ratios[i] * frequency;
                    this.frequencies[i] = this.frequencies[i].toFixed(2);
                }

                this.pitchNumber = pitchNumber;
                this.checkTemperament(compareRatios);
                this._circleOfNotes();
            } else if (event.target.innerHTML === "Preview") {
                //Preview Notes
                docById("userEdit").innerHTML =
                    '<div id="wheelDiv2" class="wheelNav"></div>';
                this.createMainWheel(this.tempRatios, pitchNumber);
                for (var i = 0; i < pitchNumber; i++) {
                    this.notesCircle.navItems[i].fillAttr = "#e0e0e0";
                    this.notesCircle.navItems[i].sliceHoverAttr.fill =
                        "#e0e0e0";
                    this.notesCircle.navItems[i].slicePathAttr.fill = "#e0e0e0";
                    this.notesCircle.navItems[i].sliceSelectedAttr.fill =
                        "#e0e0e0";
                }
                this.notesCircle.refreshWheel();
                docById("userEdit").style.paddingLeft = "0px";
                addDivision(true);
                divAppend.style.marginTop = docById("wheelDiv2").style.height;
                docById("preview").style.marginLeft = "80px";

                //make temperary
                ratios = this.tempRatios.slice();
                var frequency = this.frequencies[0];
                this.eqTempHzs = [];
                for (var i = 0; i <= pitchNumber; i++) {
                    this.eqTempHzs[i] = ratios[i] * frequency;
                    this.eqTempHzs[i] = this.eqTempHzs[i].toFixed(2);
                }
                this.eqTempPitchNumber = pitchNumber;
                this.checkTemperament(compareRatios);

                docById("done_").onclick = function() {
                    //Go to main Circle of Notes
                    that.ratios = that.tempRatios.slice();
                    var frequency = that.frequencies[0];
                    that.frequencies = [];
                    for (var i = 0; i <= pitchNumber; i++) {
                        that.frequencies[i] = that.ratios[i] * frequency;
                        that.frequencies[i] = that.frequencies[i].toFixed(2);
                    }

                    that.pitchNumber = pitchNumber;
                    that.eqTempPitchNumber = null ; 
                    that.eqTempHzs = [] ; 
                    that.checkTemperament(compareRatios);
                    that._circleOfNotes();
                };

                docById("preview").onclick = function() {
                    that.equalEdit();
                    that.eqTempPitchNumber = null ; 
                    that.eqTempHzs = [] ; 
                };
            }
        };
    };

    this.ratioEdit = function() {
        this.editMode = "ratio";
        docById("userEdit").innerHTML = "";
        var ratioEdit = docById("userEdit");
        ratioEdit.style.backgroundColor = "#c8C8C8";
        ratioEdit.innerHTML =
            '<br>Ratio &nbsp;&nbsp;&nbsp;&nbsp; <input type="text" id="ratioIn" value="1"></input> &nbsp;&nbsp; : &nbsp;&nbsp; <input type="text" id="ratioOut" value="1"></input><br><br>';
        ratioEdit.innerHTML +=
            'Recursion &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <input type="text" id="recursion" value="1"></input>';
        ratioEdit.style.paddingLeft = "100px";
        var that = this;

        function addButtons(preview) {
            var divAppend = document.createElement("div");
            divAppend.id = "divAppend";
            if (preview) {
                divAppend.innerHTML =
                    '<div id="preview" style="float:left;">Back</div><div id="done_" style="float:right;">Done</div>';
            } else {
                divAppend.innerHTML =
                    '<div id="preview" style="float:left;">Preview</div><div id="done_" style="float:right;">Done</div>';
            }
            divAppend.style.textAlign = "center";
            divAppend.style.marginLeft = "-100px";
            divAppend.style.height = "32px";
            divAppend.style.marginTop = "40px";
            divAppend.style.overflow = "auto";
            ratioEdit.append(divAppend);

            var divAppend1 = docById("preview");
            divAppend1.style.height = "30px";
            divAppend1.style.marginLeft = "3px";
            divAppend1.style.backgroundColor = platformColor.selectorBackground;
            divAppend1.style.width = "215px";

            var divAppend2 = docById("done_");
            divAppend2.style.height = "30px";
            divAppend2.style.marginRight = "3px";
            divAppend2.style.backgroundColor = platformColor.selectorBackground;
            divAppend2.style.width = "205px";
        }

        addButtons(false);

        divAppend.onmouseover = function() {
            this.style.cursor = "pointer";
        };

        divAppend.onclick = function(event) {
            var input1 = docById("ratioIn").value;
            var input2 = docById("ratioOut").value;
            var recursion = docById("recursion").value;
            var len = that.frequencies.length;
            var ratio1 = input1 / input2;
            var ratio = [];
            var frequency = [];
            var ratioDifference = [];
            var index = [];
            var compareRatios = [];
            that.tempRatios = that.ratios.slice();

            calculateRatios = function(i) {
                if (frequency[i] < that.frequencies[len - 1]) {
                    for (var j = 0; j < that.tempRatios.length; j++) {
                        ratioDifference[j] = ratio[i] - that.tempRatios[j];
                        if (ratioDifference[j] < 0) {
                            index.push(j);
                            that.tempRatios.splice(index[i], 0, ratio[i]);
                            break;
                        }
                        if (ratioDifference[j] == 0) {
                            index.push(j);
                            that.tempRatios.splice(index[i], 1, ratio[i]);
                            break;
                        }
                    }
                } else {
                    ratio[i] = ratio[i] / 2;
                    frequency[i] = that.frequencies[0] * ratio[i];
                    calculateRatios(i);
                }
            };

            for (var i = 0; i < recursion; i++) {
                ratio[i] = Math.pow(ratio1, i + 1);
                frequency[i] = that.frequencies[0] * ratio[i];
                calculateRatios(i);
            }
            that.tempRatios.sort(function(a, b) {
                return a - b;
            });
            var pitchNumber = that.tempRatios.length - 1;

            if (event.target.innerHTML == "Done") {
                that.ratios = that.tempRatios.slice();
                that.typeOfEdit = "nonequal";
                that.pitchNumber = that.ratios.length - 1;
                var frequency1 = that.frequencies[0];
                that.frequencies = [];
                for (var i = 0; i <= that.pitchNumber; i++) {
                    that.frequencies[i] = that.ratios[i] * frequency1;
                    that.frequencies[i] = that.frequencies[i].toFixed(2);
                }

                for (var i = 0; i < that.ratios.length; i++) {
                    compareRatios[i] = that.ratios[i];
                    compareRatios[i] = compareRatios[i].toFixed(2);
                }

                that.checkTemperament(compareRatios);
                that._circleOfNotes();
            } else if (event.target.innerHTML == "Preview") {
                //Preview Notes
                docById("userEdit").innerHTML =
                    '<div id="wheelDiv2" class="wheelNav"></div>';
                that.createMainWheel(that.tempRatios, pitchNumber);
                for (var i = 0; i < pitchNumber; i++) {
                    that.notesCircle.navItems[i].fillAttr = "#e0e0e0";
                    that.notesCircle.navItems[i].sliceHoverAttr.fill =
                        "#e0e0e0";
                    that.notesCircle.navItems[i].slicePathAttr.fill = "#e0e0e0";
                    that.notesCircle.navItems[i].sliceSelectedAttr.fill =
                        "#e0e0e0";
                }
                that.notesCircle.refreshWheel();
                docById("userEdit").style.paddingLeft = "0px";
                addButtons(true);
                divAppend.style.marginTop = docById("wheelDiv2").style.height;
                docById("preview").style.marginLeft = "100px";
                
                //make temperary
                var ratios = that.tempRatios.slice();
                that.typeOfEdit = "nonequal";
                that.NEqTempPitchNumber = ratios.length - 1;
                var frequency1 = that.frequencies[0];
                that.NEqTempHzs = [];
                for (var i = 0; i <= that.NEqTempPitchNumber; i++) {
                    that.NEqTempHzs[i] = ratios[i] * frequency1;
                    that.NEqTempHzs[i] = that.NEqTempHzs[i].toFixed(2);
                }

                for (var i = 0; i < ratios.length; i++) {
                    compareRatios[i] = ratios[i];
                    compareRatios[i] = compareRatios[i].toFixed(2);
                }
                that.checkTemperament(compareRatios);
                
                docById("done_").onclick = function() {
                    //Go to main Circle of Notes
                    that.ratios = that.tempRatios.slice();
                    that.pitchNumber = that.ratios.length - 1;
                    var frequency1 = that.frequencies[0];
                    that.frequencies = [];
                    for (var i = 0; i <= that.pitchNumber; i++) {
                        that.frequencies[i] = that.ratios[i] * frequency1;
                        that.frequencies[i] = that.frequencies[i].toFixed(2);
                    }

                    for (var i = 0; i < that.ratios.length; i++) {
                        compareRatios[i] = that.ratios[i];
                        compareRatios[i] = compareRatios[i].toFixed(2);
                    }

                    that.checkTemperament(compareRatios);
                    that._circleOfNotes();
                    that.NEqTempPitchNumber = null ;
                    that.NEqTempHzs = [] ;
                };

                docById("preview").onclick = function() {
                    that.ratioEdit();
                    that.NEqTempPitchNumber = null ;
                    that.NEqTempHzs = [] ;
                };
            }
        };
    };

    this.arbitraryEdit = function() {
        this.editMode = "arbitrary" ;        
        docById("userEdit").innerHTML = "";
        var arbitraryEdit = docById("userEdit");
        arbitraryEdit.innerHTML =
            '<br><div id="wheelDiv3" class="wheelNav"></div>';
        arbitraryEdit.style.paddingLeft = "0px";

        var radius = 128;
        var height = 2 * radius;
        var angle1 = [];
        this.tempRatios1 = this.ratios.slice();

        this._createInnerWheel = function(ratios, pitchNumber) {
            if (this.wheel1 !== undefined) {
                docById("wheelDiv4").display = "none";
                this.wheel1.removeWheel();
            }
            if (ratios == undefined) {
                ratios = this.ratios;
            }
            if (pitchNumber == undefined) {
                pitchNumber = this.pitchNumber;
            }
            var labels = [];
            for (var j = 0; j < pitchNumber; j++) {
                var label = j.toString();
                labels.push(label);
            }
            docById("wheelDiv4").style.display = "";
            docById("wheelDiv4").style.background = "none";
            docById("wheelDiv4").style.position = "relative";
            docById("wheelDiv4").style.zIndex = 5;
            this.wheel1 = new wheelnav("wheelDiv4");
            this.wheel1.wheelRadius = 200;
            this.wheel1.navItemsEnabled = false;
            this.wheel1.navAngle = 270;
            this.wheel1.navItemsContinuous = true;
            this.wheel1.navItemsCentered = false;
            this.wheel1.slicePathFunction = slicePath().MenuSliceWithoutLine;
            this.wheel1.slicePathCustom = slicePath().MenuSliceCustomization();
            this.wheel1.sliceSelectedPathCustom = this.wheel1.slicePathCustom;
            this.wheel1.sliceInitPathCustom = this.wheel1.slicePathCustom;
            this.wheel1.initWheel(labels);

            var baseAngle = [];
            var sliceAngle = [];
            var angle = [];
            var angleDiff = [];
            for (var i = 0; i < this.wheel1.navItemCount; i++) {
                this.wheel1.navItems[i].fillAttr = "#e0e0e0";
                this.wheel1.navItems[i].titleAttr.font =
                    "20 20px Impact, Charcoal, sans-serif";
                this.wheel1.navItems[i].titleSelectedAttr.font =
                    "20 20px Impact, Charcoal, sans-serif";
                angle[i] =
                    270 +
                    360 * (Math.log10(ratios[i]) / Math.log10(this.powerBase));
                if (i !== 0) {
                    if (i == this.pitchNumber - 1) {
                        angleDiff[i - 1] = angle[0] + 360 - angle[i];
                    } else {
                        angleDiff[i - 1] = angle[i] - angle[i - 1];
                    }
                }
                if (i === 0) {
                    sliceAngle[i] = 360 / pitchNumber;
                    baseAngle[i] = this.wheel1.navAngle - sliceAngle[0] / 2;
                } else {
                    baseAngle[i] = baseAngle[i - 1] + sliceAngle[i - 1];
                    sliceAngle[i] = 2 * (angle[i] - baseAngle[i]);
                }
                this.wheel1.navItems[i].sliceAngle = sliceAngle[i];
            }
            var menuRadius = (2 * Math.PI * radius) / pitchNumber / 3;
            for (var i = 0; i < angleDiff.length; i++) {
                if (angleDiff[i] < 11) {
                    menuRadius = (2 * Math.PI * radius) / this.pitchNumber / 6;
                }
            }
            if (menuRadius > 29) {
                menuRadius = (2 * Math.PI * radius) / 33;
            }
            this.wheel1.slicePathCustom.menuRadius = menuRadius;

            if (docById("frequencySlider") !== null) {
                docById("frequencySlider").oninput = function() {
                    that._refreshInnerWheel();
                };
            }
            this.wheel1.createWheel();
        };
        arbitraryEdit.innerHTML +=
            '<div id="wheelDiv4" class="wheelNav"></div>';
        this._createInnerWheel();

        arbitraryEdit.innerHTML +=
            '<canvas id="circ1" width = ' +
            BUTTONDIVWIDTH +
            "px height = " +
            height +
            "px></canvas>";

        var canvas = docById("circ1");
        canvas.style.position = "absolute";
        canvas.style.zIndex = 1;
        canvas.style.marginTop = "-305px";
        var ctx = canvas.getContext("2d");
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(204, 0, 102, 0)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#003300";
        ctx.stroke();

        this._createOuterWheel = function(ratios, pitchNumber) {
            if (this.wheel !== undefined) {
                docById("wheelDiv3").display = "none";
                this.wheel.removeWheel();
            }
            if (pitchNumber == undefined) {
                pitchNumber = this.pitchNumber;
            }
            if (ratios == undefined) {
                ratios = this.ratios;
            }
            docById("wheelDiv3").style.display = "";
            docById("wheelDiv3").style.background = "none";
            this.wheel = new wheelnav("wheelDiv3", null, 600, 600);
            this.wheel.wheelRadius = 300;
            this.wheel.slicePathFunction = slicePath().DonutSlice;
            this.wheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this.wheel.slicePathCustom.minRadiusPercent = 0.9;
            this.wheel.slicePathCustom.maxRadiusPercent = 1.0;
            this.wheel.sliceSelectedPathCustom = this.wheel.slicePathCustom;
            this.wheel.sliceInitPathCustom = this.wheel.slicePathCustom;
            this.wheel.colors = ["#c0c0c0", "#e0e0e0"];
            this.wheel.titleRotateAngle = 90;
            this.wheel.navItemsEnabled = false;

            var minutes = [];
            var angle = [];
            var angleDiff1 = [];
            var baseAngle1 = [];
            var sliceAngle1 = [];
            angle1 = [];
            for (i = 0; i <= pitchNumber; i++) {
                if (i !== pitchNumber) {
                    minutes.push("|");
                }
                //Change angles of outer circle
                angle[i] =
                    270 +
                    360 * (Math.log10(ratios[i]) / Math.log10(this.powerBase));
                if (i !== 0) {
                    if (i == pitchNumber - 1) {
                        angleDiff1[i - 1] = angle[0] + 360 - angle[i];
                    } else {
                        angleDiff1[i - 1] = angle[i] - angle[i - 1];
                    }
                    angle1[i - 1] = angle[i - 1] + angleDiff1[i - 1] / 2;
                }
            }
            this.wheel.navAngle = 270 + angleDiff1[0] / 2;
            this.wheel.initWheel(minutes);
            for (var i = 0; i < pitchNumber; i++) {
                if (i === 0) {
                    sliceAngle1[i] = 360 / pitchNumber;
                    baseAngle1[i] = this.wheel.navAngle - sliceAngle1[0] / 2;
                } else {
                    baseAngle1[i] = baseAngle1[i - 1] + sliceAngle1[i - 1];
                    sliceAngle1[i] = 2 * (angle1[i] - baseAngle1[i]);
                }
                this.wheel.navItems[i].sliceAngle = sliceAngle1[i];
            }
            this.wheel.createWheel();
            docById("wheelDiv3").style.position = "absolute";
            docById("wheelDiv3").style.zIndex = 10;
            docById("wheelDiv3").style.marginTop = 15 + "px";
            docById("wheelDiv3").style.marginLeft = 37 + "px";
            docById("wheelDiv3").addEventListener("mouseover", function(e) {
                that.arbitraryEditSlider(e, angle1, ratios, pitchNumber);
            });
        };

        this._createOuterWheel();

        var that = this;

        var divAppend = document.createElement("div");
        divAppend.id = "divAppend";
        divAppend.innerHTML = "Done";
        divAppend.style.textAlign = "center";
        divAppend.style.paddingTop = "5px";
        divAppend.style.backgroundColor = platformColor.selectorBackground;
        divAppend.style.height = "25px";
        divAppend.style.marginTop = "40px";
        divAppend.style.overflow = "auto";
        arbitraryEdit.append(divAppend);

        divAppend.onmouseover = function() {
            this.style.cursor = "pointer";
        };

        divAppend.onclick = function() {
            that.ratios = that.tempRatios1.slice();
            that.typeOfEdit = "nonequal";
            that.pitchNumber = that.ratios.length - 1;
            var compareRatios = [];
            var frequency1 = that.frequencies[0];
            that.frequencies = [];
            for (var i = 0; i < that.ratios.length; i++) {
                that.frequencies[i] = that.ratios[i] * frequency1;
                that.frequencies[i] = that.frequencies[i].toFixed(2);
            }

            for (var i = 0; i < that.ratios.length; i++) {
                compareRatios[i] = that.ratios[i];
                compareRatios[i] = compareRatios[i].toFixed(2);
            }

            that.checkTemperament(compareRatios);
            that._circleOfNotes();
        };
    };

    this.arbitraryEditSlider = function(event, angle, ratios, pitchNumber) {
        var frequency = this.frequencies[0];
        var frequencies = [];
        for (var j = 0; j <= pitchNumber; j++) {
            frequencies[j] = ratios[j] * frequency;
            frequencies[j] = frequencies[j].toFixed(2);
        }
        for (var i = 0; i < pitchNumber; i++) {
            if (event.target.parentNode.id == "wheelnav-wheelDiv3-title-" + i) {
                var x =
                    event.clientX -
                    docById("wheelDiv3").getBoundingClientRect().left;
                var y =
                    event.clientY -
                    docById("wheelDiv3").getBoundingClientRect().top;
                var that = this;
                if (docById("noteInfo1") !== null) {
                    docById("noteInfo1").remove();
                }
                docById("wheelDiv3").innerHTML +=
                    '<div class="popup" id="noteInfo1" style="width:180px; height:135px;"><span class="popuptext" id="myPopup"></span></div>';
                docById("noteInfo1").innerHTML +=
                    '<img src="header-icons/close-button.svg" id="close" title="close" alt="close" height=20px width=20px align="right">';
                docById("noteInfo1").innerHTML +=
                    '<br><center><input type="range" class="sliders" id = "frequencySlider" style="width:170px; background:white; border:0;" min="' +
                    frequencies[i] +
                    '" max="' +
                    frequencies[i + 1] +
                    '" value="30"></center>';
                docById("noteInfo1").innerHTML +=
                    '&nbsp;&nbsp;Frequency : <span class="rangeslidervalue" id="frequencydiv">' +
                    frequencies[i] +
                    "</span>";
                docById("noteInfo1").innerHTML +=
                    '<br><br><div id="done" style="background:rgb(196, 196, 196);"><center>Done</center><div>';

                docById("noteInfo1").style.top = "100px";
                docById("noteInfo1").style.left = "90px";

                docById("frequencySlider").oninput = function() {
                    that._refreshInnerWheel();
                };
                docById("done").onclick = function() {
                    that.tempRatios1 = that.tempRatios.slice();
                    var pitchNumber = that.tempRatios1.length - 1;
                    that._createOuterWheel(that.tempRatios1, pitchNumber);
                };
                docById("close").onclick = function() {
                    that.tempRatios = that.tempRatios1.slice();
                    var pitchNumber = that.tempRatios.length - 1;
                    that._createInnerWheel(that.tempRatios, pitchNumber);
                    docById("noteInfo1").remove();
                };
            }
        }
    };

    this._refreshInnerWheel = function() {
        docById("frequencydiv").innerHTML = docById("frequencySlider").value;
        var frequency = docById("frequencySlider").value;
        var ratio = frequency / this.frequencies[0];
        var labels = [];
        var ratioDifference = [];
        this.tempRatios = this.tempRatios1.slice();

        for (var j = 0; j < this.tempRatios.length; j++) {
            ratioDifference[j] = ratio - this.tempRatios[j];
            ratioDifference[j] = ratioDifference[j].toFixed(2);
            if (ratioDifference[j] < 0) {
                var index = j;
                this.tempRatios.splice(index, 0, ratio);
                break;
            }
            if (ratioDifference[j] == 0) {
                var index = j;
                this.tempRatios.splice(index, 1, ratio);
                break;
            }
        }
        var pitchNumber = this.tempRatios.length - 1;
        this._logo.resetSynth(0);
        this._logo.synth.trigger(
            0, frequency, Singer.defaultBPMFactor * 0.01, "electronic synth", null, null
        );
        this._createInnerWheel(this.tempRatios, pitchNumber);
    };

    this.octaveSpaceEdit = function() {
        this.editMode = "octave" ;        
        docById("userEdit").innerHTML = "";
        var len = this.ratios.length;
        var octaveRatio = this.ratios[len - 1];
        var octaveSpaceEdit = docById("userEdit");
        octaveSpaceEdit.style.backgroundColor = "#c8C8C8";
        octaveSpaceEdit.innerHTML =
            '<br><br>Octave Space &nbsp;&nbsp;&nbsp;&nbsp; <input type="text" id="startNote" value="' +
            octaveRatio +
            '" style="width:50px;"></input> &nbsp;&nbsp; : &nbsp;&nbsp; <input type="text" id="endNote" value="1" style="width:50px;"></input><br><br>';
        octaveSpaceEdit.style.paddingLeft = "70px";
        var that = this;

        var divAppend = document.createElement("div");
        divAppend.id = "divAppend";
        divAppend.innerHTML = "Done";
        divAppend.style.textAlign = "center";
        divAppend.style.paddingTop = "5px";
        divAppend.style.marginLeft = "-70px";
        divAppend.style.backgroundColor = platformColor.selectorBackground;
        divAppend.style.height = "25px";
        divAppend.style.marginTop = "40px";
        divAppend.style.overflow = "auto";
        octaveSpaceEdit.append(divAppend);

        divAppend.onmouseover = function() {
            this.style.cursor = "pointer";
        };

        divAppend.onclick = function() {
            var startRatio = docById("startNote").value;
            var endRatio = docById("endNote").value;
            var ratio = startRatio / endRatio;
            if (ratio != 2) {
                var msg =
                    "Octave Space has changed. This changes temperament significantly";
                if (!confirm(msg)) {
                    return;
                }
            }
            var powers = [];
            var compareRatios = [];
            var frequency = that.frequencies[0];
            that.frequencies = [];

            for (var i = 0; i < len; i++) {
                powers[i] =
                    12 *
                    (Math.log10(that.ratios[i]) / Math.log10(that.powerBase));
                that.ratios[i] = Math.pow(ratio, powers[i] / 12);
                compareRatios[i] = that.ratios[i].toFixed(2);
                that.frequencies[i] = that.ratios[i] * frequency;
                that.frequencies[i] = that.frequencies[i].toFixed(2);
            }
            that.powerBase = ratio;
            that.typeOfEdit = "nonequal";
            that.checkTemperament(compareRatios);
            if (ratio != 2) {
                that.octaveChanged = true;
            }
            that._circleOfNotes();
        };
    };

    this.checkTemperament = function(ratios) {
        var intervals = [];
        var selectedTemperament;

        for (var temperament in TEMPERAMENT) {
            if (!isCustom(temperament)) {
                var t = TEMPERAMENT[temperament];
                var temperamentRatios = [];
                for (var j = 0; j < t.interval.length; j++) {
                    intervals[j] = t.interval[j];
                    temperamentRatios[j] = t[intervals[j]];
                    temperamentRatios[j] = temperamentRatios[j].toFixed(2);
                }
                var ratiosEqual =
                    ratios.length == temperamentRatios.length &&
                    ratios.every(function(element, index) {
                        return element === temperamentRatios[index];
                    });

                if (ratiosEqual) {
                    selectedTemperament = temperament;
                    this.inTemperament = temperament;
                    temperamentCell.innerHTML = this.inTemperament;
                    break;
                }
            }
        }

        if (selectedTemperament === undefined) {
            this.inTemperament = "custom";
            temperamentCell.innerHTML = this.inTemperament;
        }
    };

    this._save = function() {
        var notesMatch = false;
        var index = [];
        this.notes = [];

        if (isCustom(this.inTemperament)) {
            for (var i = 0; i < this.ratios.length; i++) {
                for (var j = 0; j < this.ratiosNotesPair.length; j++) {
                    notesMatch = false;
                    if (this.ratios[i] == this.ratiosNotesPair[j][0]) {
                        notesMatch = true;
                        this.notes[i] =
                            this.ratiosNotesPair[j][1][0] +
                            "(+0)" +
                            this.ratiosNotesPair[j][1][1];
                        break;
                    }
                }
                if (!notesMatch) {
                    var cents =
                        1200 * (Math.log10(this.ratios[i]) / Math.log10(2));
                    var centsDiff = [];
                    var centsDiff1 = [];
                    for (var j = 0; j < this.cents.length; j++) {
                        centsDiff[j] = cents - this.cents[j];
                        centsDiff1[j] = Math.abs(cents - this.cents[j]);
                    }
                    var min = centsDiff1.reduce(function(a, b) {
                        return Math.min(a, b);
                    });
                    var index = centsDiff1.indexOf(min);

                    if (centsDiff[index] < 0) {
                        this.notes[i] =
                            this.ratiosNotesPair[index][1][0] +
                            "(-" +
                            centsDiff1[index].toFixed(0) +
                            ")" +
                            this.ratiosNotesPair[index][1][1];
                    } else {
                        this.notes[i] =
                            this.ratiosNotesPair[index][1][0] +
                            "(+" +
                            centsDiff1[index].toFixed(0) +
                            ")" +
                            this.ratiosNotesPair[index][1][1];
                    }
                }
            }
        }
        OCTAVERATIO = this.powerBase;
        var value = this._logo.blocks.findUniqueTemperamentName(
            this.inTemperament
        );
        this.inTemperament = value ; // change from temporary "custom" to "custom1" or "custom2" .. 
        var newStack = [
            [0, "temperament1", 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: value }], 0, 0, [0]],
            [2, ["storein"], 0, 0, [0, 3, 4, 5]],
            [3, ["text", { value: this._logo.synth.startingPitch }], 0, 0, [2]],
            [4, ["number", { value: this.frequencies[0] }], 0, 0, [2]],
            [5, ["octavespace"], 0, 0, [2, 6, 9]],
            [6, ["divide"], 0, 0, [5, 7, 8]],
            [
                7,
                ["number", { value: rationalToFraction(OCTAVERATIO)[0] }],
                0,
                0,
                [6]
            ],
            [
                8,
                ["number", { value: rationalToFraction(OCTAVERATIO)[1] }],
                0,
                0,
                [6]
            ],
            [9, "vspace", 0, 0, [5, 10]]
        ];
        var previousBlock = 9;

        for (var i = 0; i < this.pitchNumber; i++) {
            var idx = newStack.length;
            if (
                this.inTemperament === "equal" ||
                this.inTemperament === "1/3 comma meantone" ||
                (this.typeOfEdit === "equal" &&
                    this.divisions === this.pitchNumber)
            ) {
                newStack.push([
                    idx,
                    "definefrequency",
                    0,
                    0,
                    [previousBlock, idx + 1, idx + 8, idx + 12]
                ]);
                newStack.push([
                    idx + 1,
                    "multiply",
                    0,
                    0,
                    [idx, idx + 2, idx + 3]
                ]);
                newStack.push([
                    idx + 2,
                    ["namedbox", { value: this._logo.synth.startingPitch }],
                    0,
                    0,
                    [idx + 1]
                ]);
                newStack.push([
                    idx + 3,
                    ["power"],
                    0,
                    0,
                    [idx + 1, idx + 4, idx + 5]
                ]);
                newStack.push([
                    idx + 4,
                    ["number", { value: this.powerBase }],
                    0,
                    0,
                    [idx + 3]
                ]);
                newStack.push([
                    idx + 5,
                    ["divide"],
                    0,
                    0,
                    [idx + 3, idx + 6, idx + 7]
                ]);
                newStack.push([
                    idx + 6,
                    ["number", { value: i }],
                    0,
                    0,
                    [idx + 5]
                ]);
                newStack.push([
                    idx + 7,
                    ["number", { value: this.pitchNumber }],
                    0,
                    0,
                    [idx + 5]
                ]);
                newStack.push([idx + 8, "vspace", 0, 0, [idx, idx + 9]]);
                newStack.push([
                    idx + 9,
                    ["pitch"],
                    0,
                    0,
                    [idx + 8, idx + 10, idx + 11, null]
                ]);
                if (!isCustom(this.inTemperament)) {
                    newStack.push([
                        idx + 10,
                        ["notename", { value: this.ratiosNotesPair[i][1][0] }],
                        0,
                        0,
                        [idx + 9]
                    ]);
                    newStack.push([
                        idx + 11,
                        ["number", { value: this.ratiosNotesPair[i][1][1] }],
                        0,
                        0,
                        [idx + 9]
                    ]);
                } else {
                    newStack.push([
                        idx + 10,
                        [
                            "text",
                            {
                                value: this.notes[i].substring(
                                    0,
                                    this.notes[i].length - 1
                                )
                            }
                        ],
                        0,
                        0,
                        [idx + 9]
                    ]);
                    newStack.push([
                        idx + 11,
                        ["number", { value: this.notes[i].slice(-1) }],
                        0,
                        0,
                        [idx + 9]
                    ]);
                }

                if (i == this.pitchNumber - 1) {
                    newStack.push([idx + 12, "hidden", 0, 0, [idx, null]]);
                } else {
                    newStack.push([idx + 12, "hidden", 0, 0, [idx, idx + 13]]);
                }
                previousBlock = idx + 12;
            } else {
                newStack.push([
                    idx,
                    "definefrequency",
                    0,
                    0,
                    [previousBlock, idx + 1, idx + 6, idx + 10]
                ]);
                newStack.push([
                    idx + 1,
                    "multiply",
                    0,
                    0,
                    [idx, idx + 2, idx + 3]
                ]);
                newStack.push([
                    idx + 2,
                    ["namedbox", { value: this._logo.synth.startingPitch }],
                    0,
                    0,
                    [idx + 1]
                ]);
                newStack.push([
                    idx + 3,
                    ["divide"],
                    0,
                    0,
                    [idx + 1, idx + 4, idx + 5]
                ]);
                newStack.push([
                    idx + 4,
                    [
                        "number",
                        { value: rationalToFraction(this.ratios[i])[0] }
                    ],
                    0,
                    0,
                    [idx + 3]
                ]);
                newStack.push([
                    idx + 5,
                    [
                        "number",
                        { value: rationalToFraction(this.ratios[i])[1] }
                    ],
                    0,
                    0,
                    [idx + 3]
                ]);
                newStack.push([idx + 6, "vspace", 0, 0, [idx, idx + 7]]);
                newStack.push([
                    idx + 7,
                    ["pitch"],
                    0,
                    0,
                    [idx + 6, idx + 8, idx + 9, null]
                ]);

                if (!isCustom(this.inTemperament)) {
                    newStack.push([
                        idx + 8,
                        ["notename", { value: this.ratiosNotesPair[i][1][0] }],
                        0,
                        0,
                        [idx + 7]
                    ]);
                    newStack.push([
                        idx + 9,
                        ["number", { value: this.ratiosNotesPair[i][1][1] }],
                        0,
                        0,
                        [idx + 7]
                    ]);
                } else {
                    newStack.push([
                        idx + 8,
                        [
                            "text",
                            {
                                value: this.notes[i].substring(
                                    0,
                                    this.notes[i].length - 1
                                )
                            }
                        ],
                        0,
                        0,
                        [idx + 7]
                    ]);
                    newStack.push([
                        idx + 9,
                        ["number", { value: this.notes[i].slice(-1) }],
                        0,
                        0,
                        [idx + 7]
                    ]);
                }

                if (i == this.pitchNumber - 1) {
                    newStack.push([idx + 10, "hidden", 0, 0, [idx, null]]);
                } else {
                    newStack.push([idx + 10, "hidden", 0, 0, [idx, idx + 11]]);
                }
                previousBlock = idx + 10;
            }
        }
        this._logo.blocks.loadNewBlocks(newStack);
        this._logo.textMsg(_("New action block generated!"));

        var len = this._logo.synth.startingPitch.length;
        var note = this._logo.synth.startingPitch.substring(0, len - 1);
        var octave = this._logo.synth.startingPitch.slice(-1);
        var newStack1 = [
            [0, "settemperament", 100, 100, [null, 1, 2, 3, null]],
            [1, ["temperamentname", { value: this.inTemperament }], 0, 0, [0]],
            [2, ["notename", { value: note }], 0, 0, [0]],
            [3, ["number", { value: octave }], 0, 0, [0]]
        ];
        this._logo.blocks.loadNewBlocks(newStack1);
        this._logo.textMsg(_("New action block generated!"));

        if (isCustom(this.inTemperament)) {   
            TEMPERAMENT[this.inTemperament] = [];
            TEMPERAMENT[this.inTemperament]["pitchNumber"] = this.pitchNumber;
            updateTemperaments();
            for (var i = 0; i < this.pitchNumber; i++) {
                var number = "" + i;
                TEMPERAMENT[this.inTemperament][number] = [
                    this.ratios[i],
                    this.notes[i].substring(0, this.notes[i].length - 1),
                    this.notes[i].slice(-1)
                ];
            }
        }

        if (isCustom(this.inTemperament)) {
            this._logo.customTemperamentDefined = true;
            this._logo.blocks.protoBlockDict["custompitch"].hidden = false;
            this._logo.blocks.palettes.updatePalettes("pitch");
        }
    };

    this.playNote = function(pitchNumber) {
        this._logo.resetSynth(0);
        var duration = 1 / 2;

        if (docById("wheelDiv4") == null) {
            var notes = this.frequencies[pitchNumber];
            if (this.editMode=="equal" && this.eqTempHzs && this.eqTempHzs.length) notes = this.eqTempHzs[pitchNumber] ;
            else if (this.editMode=="ratio" && this.NEqTempHzs && this.NEqTempHzs.length) notes = this.NEqTempHzs[pitchNumber] ;
        } else {
            var notes = this.tempRatios1[pitchNumber] * this.frequencies[0];
        }

        this._logo.synth.trigger(
            0, notes, Singer.defaultBPMFactor * duration, "electronic synth", null, null
        );
    };

    this.playAll = function() {
        var p = 0;
        this.playbackForward = true;
        this._playing = !this._playing;

        this._logo.resetSynth(0);

        var cell = this.playButton;
        if (this._playing) {
            cell.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "stop-button.svg" +
                '" title="' +
                _("Stop") +
                '" alt="' +
                _("Stop") +
                '" height="' +
                ICONSIZE +
                '" width="' +
                ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        } else {
            this._logo.synth.setMasterVolume(0);
            this._logo.synth.stop();
            cell.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "play-button.svg" +
                '" title="' +
                _("Play") +
                '" alt="' +
                _("Play") +
                '" height="' +
                ICONSIZE +
                '" width="' +
                ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        }

        var duration = 1 / 2;
        var startingPitch = this._logo.synth.startingPitch;
        var startingPitchOcatve = Number(startingPitch.slice(-1));
        var octave = startingPitchOcatve - 1;
        var startPitch = pitchToFrequency(
            startingPitch.substring(0, startingPitch.length - 1),
            octave,
            0,
            "C Major"
        );
        var that = this;
        var pitchNumber = this.pitchNumber;
        if (this.editMode == "equal" && this.eqTempPitchNumber) pitchNumber = this.eqTempPitchNumber ;
        else if  (this.editMode == "ratio" && this.NEqTempPitchNumber) pitchNumber = this.NEqTempPitchNumber ;
        if (docById("wheelDiv4") !== null) {
            pitchNumber = this.tempRatios1.length - 1;
        }

        __playLoop = function(i) {
            if (i === pitchNumber) {
                that.playbackForward = false;
            }
            if (i === 0) {
                p++;
            }
            if (that._playing) {
                that._logo.synth.trigger(
                    0,
                    startPitch,
                    Singer.defaultBPMFactor * duration,
                    "electronic synth",
                    null,
                    null
                );
                that.playNote(i);
            }

            if (that.circleIsVisible == false && docById("wheelDiv4") == null) {
                if (i === pitchNumber) {
                    that.notesCircle.navItems[0].fillAttr = "#808080";
                    that.notesCircle.navItems[0].sliceHoverAttr.fill =
                        "#808080";
                    that.notesCircle.navItems[0].slicePathAttr.fill = "#808080";
                    that.notesCircle.navItems[0].sliceSelectedAttr.fill =
                        "#808080";
                } else {
                    that.notesCircle.navItems[i].fillAttr = "#808080";
                    that.notesCircle.navItems[i].sliceHoverAttr.fill =
                        "#808080";
                    that.notesCircle.navItems[i].slicePathAttr.fill = "#808080";
                    that.notesCircle.navItems[i].sliceSelectedAttr.fill =
                        "#808080";
                }

                if (that.playbackForward == false && i < pitchNumber) {
                    if (i === pitchNumber - 1) {
                        that.notesCircle.navItems[0].fillAttr = "#c8C8C8";
                        that.notesCircle.navItems[0].sliceHoverAttr.fill =
                            "#c8C8C8";
                        that.notesCircle.navItems[0].slicePathAttr.fill =
                            "#c8C8C8";
                        that.notesCircle.navItems[0].sliceSelectedAttr.fill =
                            "#c8C8C8";
                    } else {
                        that.notesCircle.navItems[i + 1].fillAttr = "#c8C8C8";
                        that.notesCircle.navItems[i + 1].sliceHoverAttr.fill =
                            "#c8C8C8";
                        that.notesCircle.navItems[i + 1].slicePathAttr.fill =
                            "#c8C8C8";
                        that.notesCircle.navItems[
                            i + 1
                        ].sliceSelectedAttr.fill = "#c8C8C8";
                    }
                } else {
                    if (i !== 0) {
                        that.notesCircle.navItems[i - 1].fillAttr = "#c8C8C8";
                        that.notesCircle.navItems[i - 1].sliceHoverAttr.fill =
                            "#c8C8C8";
                        that.notesCircle.navItems[i - 1].slicePathAttr.fill =
                            "#c8C8C8";
                        that.notesCircle.navItems[
                            i - 1
                        ].sliceSelectedAttr.fill = "#c8C8C8";
                    }
                }

                that.notesCircle.refreshWheel();
            } else if (
                that.circleIsVisible == true &&
                docById("wheelDiv4") == null
            ) {
                docById("pitchNumber_" + i).style.background =
                    platformColor.labelColor;
                if (that.playbackForward == false && i < pitchNumber) {
                    var j = i + 1;
                    docById("pitchNumber_" + j).style.background =
                        platformColor.selectorBackground;
                } else {
                    if (i !== 0) {
                        var j = i - 1;
                        docById("pitchNumber_" + j).style.background =
                            platformColor.selectorBackground;
                    }
                }
            } else if (docById("wheelDiv4") !== null) {
                if (i === pitchNumber) {
                    that.wheel1.navItems[0].fillAttr = "#808080";
                    that.wheel1.navItems[0].sliceHoverAttr.fill = "#808080";
                    that.wheel1.navItems[0].slicePathAttr.fill = "#808080";
                    that.wheel1.navItems[0].sliceSelectedAttr.fill = "#808080";
                } else {
                    that.wheel1.navItems[i].fillAttr = "#808080";
                    that.wheel1.navItems[i].sliceHoverAttr.fill = "#808080";
                    that.wheel1.navItems[i].slicePathAttr.fill = "#808080";
                    that.wheel1.navItems[i].sliceSelectedAttr.fill = "#808080";
                }

                if (that.playbackForward == false && i < pitchNumber) {
                    if (i === pitchNumber - 1) {
                        that.wheel1.navItems[0].fillAttr = "#e0e0e0";
                        that.wheel1.navItems[0].sliceHoverAttr.fill = "#e0e0e0";
                        that.wheel1.navItems[0].slicePathAttr.fill = "#e0e0e0";
                        that.wheel1.navItems[0].sliceSelectedAttr.fill =
                            "#e0e0e0";
                    } else {
                        that.wheel1.navItems[i + 1].fillAttr = "#e0e0e0";
                        that.wheel1.navItems[i + 1].sliceHoverAttr.fill =
                            "#e0e0e0";
                        that.wheel1.navItems[i + 1].slicePathAttr.fill =
                            "#e0e0e0";
                        that.wheel1.navItems[i + 1].sliceSelectedAttr.fill =
                            "#e0e0e0";
                    }
                } else {
                    if (i !== 0) {
                        that.wheel1.navItems[i - 1].fillAttr = "#e0e0e0";
                        that.wheel1.navItems[i - 1].sliceHoverAttr.fill =
                            "#e0e0e0";
                        that.wheel1.navItems[i - 1].slicePathAttr.fill =
                            "#e0e0e0";
                        that.wheel1.navItems[i - 1].sliceSelectedAttr.fill =
                            "#e0e0e0";
                    }
                }

                that.wheel1.refreshWheel();
            }

            if (that.playbackForward) {
                i += 1;
            } else {
                i -= 1;
            }

            if (i <= pitchNumber && i >= 0 && that._playing && p < 2) {
                setTimeout(function() {
                    __playLoop(i);
                }, Singer.defaultBPMFactor * 1000 * duration);
            } else {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/' +
                    "play-button.svg" +
                    '" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    ICONSIZE +
                    '" width="' +
                    ICONSIZE +
                    '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
                if (i !== -1) {
                    setTimeout(function() {
                        if (
                            that.circleIsVisible == false &&
                            docById("wheelDiv4") == null
                        ) {
                            that.notesCircle.navItems[i - 1].fillAttr =
                                "#c8C8C8";
                            that.notesCircle.navItems[
                                i - 1
                            ].sliceHoverAttr.fill = "#c8C8C8";
                            that.notesCircle.navItems[
                                i - 1
                            ].slicePathAttr.fill = "#c8C8C8";
                            that.notesCircle.navItems[
                                i - 1
                            ].sliceSelectedAttr.fill = "#c8C8C8";
                            that.notesCircle.refreshWheel();
                        } else if (
                            that.circleIsVisible == true &&
                            docById("wheelDiv4") == null
                        ) {
                            var j = i - 1;
                            docById("pitchNumber_" + j).style.background =
                                platformColor.selectorBackground;
                        } else if (docById("wheelDiv4") !== null) {
                            that.wheel1.navItems[i - 1].fillAttr = "#e0e0e0";
                            that.wheel1.navItems[i - 1].sliceHoverAttr.fill =
                                "#e0e0e0";
                            that.wheel1.navItems[i - 1].slicePathAttr.fill =
                                "#e0e0e0";
                            that.wheel1.navItems[i - 1].sliceSelectedAttr.fill =
                                "#e0e0e0";
                            that.wheel1.refreshWheel();
                        }
                    }, Singer.defaultBPMFactor * 1000 * duration);
                }
                that._playing = false;
            }
        };
        if (this._playing) {
            __playLoop(0);
        }
    };

    this.init = function(logo) {
        this._logo = logo;

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var widgetWindow = window.widgetWindows.windowFor(this, "temperament");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	widgetWindow.show();

        widgetWindow.getWidgetBody().append(temperamentTableDiv);
        widgetWindow.getWidgetBody().style.height = "500px";
        widgetWindow.getWidgetBody().style.width = "500px";

        var that = this;

        widgetWindow.onclose = function() {
            that._logo.synth.setMasterVolume(0);
            that._logo.synth.stop();
            if (docById("wheelDiv2") != null) {
                docById("wheelDiv2").style.display = "none";
                that.notesCircle.removeWheel();
            }
            if (docById("wheelDiv3") != null) {
                docById("wheelDiv3").style.display = "none";
                that.wheel.removeWheel();
            }
            if (docById("wheelDiv4") != null) {
                docById("wheelDiv4").style.display = "none";
                that.wheel1.removeWheel();
            }

            this.destroy();
        };

        this._playing = false;

        var buttonTable = document.createElement("table");
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);
        row.id = "buttonsRow";

        temperamentCell = row.insertCell();
        temperamentCell.innerHTML = this.inTemperament;
        temperamentCell.style.width = 2 * BUTTONSIZE + "px";
        temperamentCell.style.minWidth = temperamentCell.style.width;
        temperamentCell.style.maxWidth = temperamentCell.style.width;
        temperamentCell.style.height = BUTTONSIZE + "px";
        temperamentCell.style.minHeight = temperamentCell.style.height;
        temperamentCell.style.maxHeight = temperamentCell.style.height;
        temperamentCell.style.textAlign = "center";
        temperamentCell.style.backgroundColor =
            platformColor.selectorBackground;

        this.playButton = widgetWindow.addButton(
            "play-button.svg",
            ICONSIZE,
            _("Play all")
        );
        this.playButton.onclick = function() {
            that.playAll();
        };

        widgetWindow.addButton(
            "export-chunk.svg",
            ICONSIZE,
            _("Save")
        ).onclick = function() {
            that._save();
        };

        var noteCell = widgetWindow.addButton(
            "play-button.svg",
            ICONSIZE,
            _("Table")
        );

        var t = TEMPERAMENT[this.inTemperament];
        this.pitchNumber = t.pitchNumber;
        this.octaveChanged = false;
        this.scale = this.scale[0] + " " + this.scale[1];
        this.scaleNotes = _buildScale(this.scale);
        this.scaleNotes = this.scaleNotes[0];
        this.powerBase = 2;
        var startingPitch = this._logo.synth.startingPitch;
        var str = [];
        var note = [];
        this.notes = [];
        this.frequencies = [];
        this.cents = [];
        this.intervals = [];
        this.ratios = [];
        this.ratiosNotesPair = [];

        for (var i = 0; i <= this.pitchNumber; i++) {
            if (
                isCustom(this.inTemperament) &&
                TEMPERAMENT[this.inTemperament]["0"][1] !== undefined
            ) {
                //If temperament selected is custom and it is defined by user.
                var pitchNumber = i + "";
                if (i === this.pitchNumber) {
                    this.notes[i] = [
                        TEMPERAMENT[this.inTemperament]["0"][1],
                        Number(TEMPERAMENT[this.inTemperament]["0"][2]) + 1
                    ];
                    this.ratios[i] = this.powerBase;
                } else {
                    this.notes[i] = [
                        TEMPERAMENT[this.inTemperament][pitchNumber][1],
                        TEMPERAMENT[this.inTemperament][pitchNumber][2]
                    ];
                    this.ratios[i] = TEMPERAMENT[this.inTemperament][pitchNumber][0];
                }
                this.frequencies[i] = this._logo.synth
                    .getCustomFrequency((this.notes[i][0] + this.notes[i][1] + "") ,this.inTemperament  )
                    .toFixed(2);
                this.cents[i] =
                    1200 * (Math.log10(this.ratios[i]) / Math.log10(2));
                this.ratiosNotesPair[i] = [this.ratios[i], this.notes[i]];
            } else {
                if (isCustom(this.inTemperament)) {
                    // If temperament selected is custom and it is not defined by user
                    // then custom temperament behaves like equal temperament.
                    t = TEMPERAMENT["equal"];
                }
                str[i] = getNoteFromInterval(startingPitch, t.interval[i]);
                this.notes[i] = str[i];
                note[i] = str[i][0];

                if (
                    str[i][0].substring(1, str[i][0].length) === FLAT ||
                    str[i][0].substring(1, str[i][0].length) === "b"
                ) {
                    note[i] = str[i][0].replace(FLAT, "b");
                } else if (
                    str[i][0].substring(1, str[i][0].length) === SHARP ||
                    str[i][0].substring(1, str[i][0].length) === "#"
                ) {
                    note[i] = str[i][0].replace(SHARP, "#");
                }

                str[i] = note[i] + str[i][1];
                this.frequencies[i] = this._logo.synth
                    ._getFrequency(str[i], true, this.inTemperament)
                    .toFixed(2);
                this.intervals[i] = t.interval[i];
                this.ratios[i] = t[this.intervals[i]];
                this.cents[i] =
                    1200 * (Math.log10(this.ratios[i]) / Math.log10(2));
                this.ratiosNotesPair[i] = [this.ratios[i], this.notes[i]];
            }
        }
        this.toggleNotesButton = function() {
            if (this.circleIsVisible) {
                noteCell.getElementsByTagName("img")[0].src =
                    "header-icons/circle.svg";
                noteCell.getElementsByTagName("img")[0].title = "circle";
                noteCell.getElementsByTagName("img")[0].alt = "circle";
            } else {
                noteCell.getElementsByTagName("img")[0].src =
                    "header-icons/table.svg";
                noteCell.getElementsByTagName("img")[0].title = "table";
                noteCell.getElementsByTagName("img")[0].alt = "table";
            }
        };

        this._circleOfNotes();

        noteCell.onclick = function(event) {
            that.editMode = null ;            
            if (that.circleIsVisible) {
                that._circleOfNotes();
            } else {
                that._graphOfNotes();
            }
        };

        widgetWindow.addButton(
            "add2.svg",
            ICONSIZE,
            _("Add pitches")
        ).onclick = function(event) {
            that.edit();
        };

        widgetWindow.sendToCenter();
    };
}
