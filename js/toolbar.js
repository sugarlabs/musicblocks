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

    var stopIconColorWhenPlaying = '#ea174c';

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
    this.renderSaveIcons = function (svg_onclick, png_onclick, wave_onclick, ly_onclick, abc_onclick, blockartworksvg_onclick) {
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
    };
    this.renderPlanetIcon = function (onclick) {
        var planetIcon = document.getElementById('planetIcon');
        planetIcon.onclick = function () {
            document.getElementById('toolbars').style.display = "none";
            onclick();
        };
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
                // $('.tooltipped').tooltip();
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
        var modeText = document.getElementById('modeText');
        modeText.onclick = function () {
            onclick();
        };
    };

    this.renderRunSlowlyIcon = function (onclick) {
        var runSlowlyIcon = document.getElementById('runSlowlyIcon');
        runSlowlyIcon.onclick = function () {
            onclick();
            document.getElementById('stop').style.color = stopIconColorWhenPlaying;

        };
    };
    this.renderRunStepIcon = function (onclick) {

        var runStepByStepIcon = document.getElementById('runStepByStepIcon');
        runStepByStepIcon.onclick = function () {
            onclick();
            document.getElementById('stop').style.color = stopIconColorWhenPlaying;
        };
    };
    this.renderAdvancedIcons = function (analytics_onclick, openPlugin_onclick, delPlugin_onclick, scroll_onclick) {
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

            enableHorizScrollIcon.onclick = function () {
                scroll_onclick();
            };
        } else {
            displayStatsIcon.style.display = "none";
            loadPluginIcon.style.display = "none";
            delPluginIcon.style.display = "none";
            enableHorizScrollIcon.style.display = "none";
        }
    };

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
    this.renderLanguageSelectIcon = function (onclick, hideAux_onclick) {
        var auxToolbar = document.getElementById('aux-toolbar');
        var menuIcon = document.getElementById('menu');
        var languageSelectIcon = document.getElementById('languageSelectIcon');
        languageSelectIcon.onclick = function () {
            onclick();
            hideAux_onclick(true);
            auxToolbar.style.display = 'none';
            menuIcon.innerHTML = 'menu';
            document.getElementById('toggleAuxBtn').className -= 'blue darken-1';
        };
    };

}