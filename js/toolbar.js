// Copyright (c) 2018 Austin George
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA


function Toolbar() {
    var $j = jQuery.noConflict();
    var stopIconColorWhenPlaying = '#ea174c';
    var language = localStorage.languagePreference;

    this.renderLogoIcon = function (onclick) {
        var logoIcon = document.getElementById('mb-logo');
        logoIcon.onmouseenter = function () {
            document.body.style.cursor = "pointer";
        };
        logoIcon.onmouseleave = function () {
            document.body.style.cursor = "default";
        };
        logoIcon.onclick = function () {
            onclick();
        };
    };

    this.renderPlayIcon = function (onclick) {
        var playIcon = document.getElementById('play');
        var stopIcon = document.getElementById('stop');
        playIcon.onclick = function () {
            onclick();
            stopIcon.style.color = stopIconColorWhenPlaying;
        };

    };
    this.renderStopIcon = function (onclick) {
        var stopIcon = document.getElementById('stop');
        stopIcon.onclick = function () {
            onclick();
            stopIcon.style.color = 'white';
        };
    };
    this.renderNewProjectIcon = function (onclick) {
        var newProjectIcon = document.getElementById('new-project');
        newProjectIcon.onclick = function () {
            onclick();
        };
    };
    this.renderLoadIcon = function (onclick) {
        var loadIcon = document.getElementById('load');
        loadIcon.onclick = function () {
            onclick();
        };
    };
    this.renderSaveIcons = function (html_onclick, svg_onclick, png_onclick, wave_onclick, ly_onclick, abc_onclick, blockartworksvg_onclick) {
        var saveButton = document.getElementById('saveButton');
        var saveButtonAdvanced = document.getElementById('saveButtonAdvanced');
        if (beginnerMode) {
            saveButtonAdvanced.style.display = 'block';
            saveButtonAdvanced.style.display = 'none';
            saveButton.onclick = function () {
                html_onclick();
            }
        } else {
            saveButton.style.display = 'none';
            saveButtonAdvanced.style.display = 'block';
            saveButtonAdvanced.onclick = function () {

                var saveHTML = document.getElementById('save-html');
                saveHTML.onclick = function () {
                    html_onclick();
                };

                var saveSVG = document.getElementById('save-svg');
                saveSVG.onclick = function () {
                    svg_onclick();
                };

                var savePNG = document.getElementById('save-png');
                savePNG.onclick = function () {
                    png_onclick();
                };

                var saveWAV = document.getElementById('save-wav');
                saveWAV.onclick = function () {
                    wave_onclick();
                };

                var saveLY = document.getElementById('save-ly');
                saveLY.onclick = function () {
                    ly_onclick();
                };

                var saveABC = document.getElementById('save-abc');
                saveABC.onclick = function () {
                    abc_onclick();
                };

                var saveArtworkSVG = document.getElementById('save-blockartwork-svg');
                saveArtworkSVG.onclick = function () {
                    blockartworksvg_onclick();
                };
            }
        }
    };
    this.renderPlanetIcon = function (planet, onclick) {
        var planetIcon = document.getElementById('planetIcon');
        var planetIconDisabled = document.getElementById('planetIconDisabled');

        if (planet) {
            planetIcon.onclick = function () {
                document.getElementById('toolbars').style.display = "none";
                onclick();
            };
        } else {
            planetIcon.style.display = 'none';
            planetIconDisabled.style.display = 'block';
        }
    };



    this.renderMenuIcon = function (onclick) {
        var menuIcon = document.getElementById('menu');
        var auxToolbar = document.getElementById('aux-toolbar');
        menuIcon.onclick = function () {
            if (auxToolbar.style.display == '' || auxToolbar.style.display == 'none') {
                onclick(false);
                auxToolbar.style.display = 'block';
                menuIcon.innerHTML = 'more_vert';
                document.getElementById('toggleAuxBtn').className = 'blue darken-1';
            } else {
                onclick(true);
                auxToolbar.style.display = 'none';
                menuIcon.innerHTML = 'menu';
                document.getElementById('toggleAuxBtn').className -= 'blue darken-1';
            }
        };
    };

    this.renderHelpIcon = function (onclick) {
        var helpIcon = document.getElementById('helpIcon');
        helpIcon.onclick = function () {
            onclick();
        };
    };
    this.renderModeSelectIcon = function (onclick) {
        var begIcon = document.getElementById('beginnerMode');
        var advIcon = document.getElementById('advancedMode');
        if (begIcon.style.display === 'none') {
            advIcon.onclick = function () {
                onclick();
            };
        } else {
            begIcon.onclick = function () {
                onclick();
            }
        }
    };

    this.renderRunSlowlyIcon = function (onclick) {
        var runSlowlyIcon = document.getElementById('runSlowlyIcon');
        if (beginnerMode && language === 'ja') {
            runSlowlyIcon.style.display = 'none';

        }
        runSlowlyIcon.onclick = function () {
            onclick();
            document.getElementById('stop').style.color = stopIconColorWhenPlaying;

        };
    };
    this.renderRunStepIcon = function (onclick) {
        var runStepByStepIcon = document.getElementById('runStepByStepIcon');
        if (beginnerMode && language === 'ja') {
            runStepByStepIcon.style.display = 'none';
        }
        runStepByStepIcon.onclick = function () {
            onclick();
            document.getElementById('stop').style.color = stopIconColorWhenPlaying;
        };
    };
    this.renderAdvancedIcons = function (analytics_onclick, openPlugin_onclick, delPlugin_onclick) {
        var displayStatsIcon = document.getElementById('displayStatsIcon');
        var loadPluginIcon = document.getElementById('loadPluginIcon');
        var delPluginIcon = document.getElementById('delPluginIcon');
        var enableHorizScrollIcon = document.getElementById('enableHorizScrollIcon');


        if (!beginnerMode) {
            displayStatsIcon.onclick = function () {
                analytics_onclick();
            };

            loadPluginIcon.onclick = function () {
                openPlugin_onclick();
            };

            delPluginIcon.onclick = function () {
                delPlugin_onclick();
            };
        } else {
            displayStatsIcon.style.display = "none";
            loadPluginIcon.style.display = "none";
            delPluginIcon.style.display = "none";
            enableHorizScrollIcon.style.display = "none";
        }
    };
    // var scrollEnabled = false;
    // this.renderEnableHorizScrollIcon = function (setScroller, _setupBlocksContainerEvents) {
    //     var enableHorizScrollIcon = document.getElementById('enableHorizScrollIcon');
    //     enableHorizScrollIcon.onclick = function () {
    //         setScroller();
    //         _setupBlocksContainerEvents();
    //     }

    // }

    this.renderMergeIcon = function (onclick) {
        var mergeWithCurrentIcon = document.getElementById('mergeWithCurrentIcon');
        mergeWithCurrentIcon.onclick = function () {
            onclick();
        };
    };
    this.renderRestoreIcon = function (onclick) {
        var restoreIcon = document.getElementById('restoreIcon');
        restoreIcon.onclick = function () {
            onclick();
        };
    };
    this.renderLanguageSelectIcon = function (onclick) {
        var languageSelectIcon = document.getElementById('languageSelectIcon');
        languageSelectIcon.onclick = function () {
            onclick();
        };
    };

    var strings = [
        ["mb-logo", _("About Music Blocks")],
        ["play", _("Play")],
        ["stop", _("Stop")],
        ["newFile", _("New project")],
        ["load", _("Load project from file")],
        ["saveButton", _("Save project")],
        ["saveButtonAdvanced", _("Save project")],
        ["planetIcon", _("Find and share projects")],
        ["planetIconDisabled", _("Offline. Sharing is unavailable")],
        ["toggleAuxBtn", _("Auxilary menu")],
        ["helpIcon", _("Help")],
        ["runSlowlyIcon", _("Run slowly")],
        ["runStepByStepIcon", _("Run step by step")],
        ["displayStatsIcon", _("Display statistics")],
        ["loadPluginIcon", _("Load plugin")],
        ["delPluginIcon", _("Delete plugin")],
        ["enableHorizScrollIcon", _("Enable horizontal scrolling")],
        ["disableHorizScrollIcon", _("Disable horizontal scrolling")],
        ["mergeWithCurrentIcon", _("Merge with current project")],
        ["restoreIcon", _("Restore")],
        ["languageSelectIcon", _("Select language")],
        ["save-html", _("Save as HTML"), 'innerHTML'],
        ["save-svg", _("Save as svg"), 'innerHTML'],
        ["save-png", _("Save as png"), 'innerHTML'],
        ["save-wav", _("Save as wav"), 'innerHTML'],
        ["save-ly", _("Save sheet music"), 'innerHTML'],
        ["save-abc", _("Save as abc"), 'innerHTML'],
        ["save-blockartwork-svg", _("Save block artwork"), 'innerHTML'],
        ["new-project", _("Confirm"), 'innerHTML'],
        ["beginnerMode", _("Switch to beginner mode")],
        ["advancedMode", _("Switch to advanced mode")],

    ];

    // Workaround for FF
    var strings_ = [
        _("About Music Blocks"),
        _("Play"),
        _("Stop"),
        _("New project"),
        _("Load project from file"),
        _("Save project"),
        _("Save project"),
        _("Find and share projects"),
        _("Offline. Sharing is unavailable"),
        _("Auxilary menu"),
        _("Help"),
        _("Run slowly"),
        _("Run step by step"),
        _("Display statistics"),
        _("Load plugin"),
        _("Delete plugin"),
        _("Enable horizontal scrolling"),
        _("Disable horizontal scrolling"),
        _("Merge with current project"),
        _("Restore"),
        _("Select language"),
        _("Save as HTML"),
        _("Save as svg"),
        _("Save as png"),
        _("Save as wav"),
        _("Save sheet music"),
        _("Save as abc"),
        _("Save block artwork"),
        _("Confirm"),
        _("Switch to beginner mode"),
        _("Switch to advanced mode")
    ];


    this.init = function (mode) {
        var beginnerMode = document.getElementById('beginnerMode');
        var advancedMode = document.getElementById('advancedMode');

        if (mode || mode === 'null') {
            advancedMode.style.display = "block";
            beginnerMode.style.display = "none";
        } else {
            advancedMode.style.display = "none";
            beginnerMode.style.display = "display";
        }

        for (var i = 0; i < strings.length; i++) {
            var obj = strings[i];
            var trans = strings_[i];
            var elem = document.getElementById(obj[0]);
            // console.log(obj[0] + " trans: " + trans);
            if (strings[i].length == 3) {
                elem.innerHTML = obj[1];
            } else {
                elem.setAttribute("data-tooltip", trans);
            }
        }
        $j('.tooltipped').tooltip({
            html: true,
            delay: 100
        });

        $j('.materialize-iso, .dropdown-trigger').dropdown({
            constrainWidth: false,
            hover: false, // Activate on hover
            belowOrigin: true, // Displays dropdown below the button
        });
    };
}