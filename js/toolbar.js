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
    var tooltipsDisabled = false;

    this.renderLogoIcon = function (onclick) {
        var logoIcon = document.getElementById('mb-logo');
        logoIcon.onmouseenter = function () {
            document.body.style.cursor = 'pointer';
        };

        logoIcon.onmouseleave = function () {
            document.body.style.cursor = 'default';
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
            };
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
                document.getElementById('toolbars').style.display = 'none';
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
            };
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
            displayStatsIcon.style.display = 'none';
            loadPluginIcon.style.display = 'none';
            delPluginIcon.style.display = 'none';
            enableHorizScrollIcon.style.display = 'none';
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

    this.renderLanguageSelectIcon = function (languageBox) {
        var languageSelectIcon = document.getElementById('languageSelectIcon');
        languageSelectIcon.onclick = function () {
            var enUS = document.getElementById('enUS');

            enUS.onclick = function () {
                languageBox.enUS_onclick();
            };

            var enUK = document.getElementById('enUK');

            enUK.onclick = function () {
                languageBox.enUK_onclick();
            };

            var es = document.getElementById('es');

            es.onclick = function () {
                languageBox.es_onclick();
            };

            var ja = document.getElementById('ja');

            ja.onclick = function () {
                languageBox.ja_onclick();
            };

            var kana = document.getElementById('kana');

            kana.onclick = function () {
                languageBox.kana_onclick();
            };

            var zhCN = document.getElementById('zhCN');

            zhCN.onclick = function () {
                languageBox.zhCN_onclick();
            };

            var th = document.getElementById('th');

            th.onclick = function () {
                languageBox.th_onclick();
            };

            var ayc = document.getElementById('ayc');

            ayc.onclick = function () {
                languageBox.ayc_onclick();
            };

            var gug = document.getElementById('gug');

            gug.onclick = function () {
                languageBox.gug_onclick();
            };

            var hi = document.getElementById('hi');

            hi.onclick = function () {
                languageBox.hi_onclick();
            };

            var ibo = document.getElementById('ibo');

            ibo.onclick = function () {
                languageBox.ibo_onclick();
            };

            var ar = document.getElementById('ar');

            ar.onclick = function () {
                languageBox.ar_onclick();
            };

            var he = document.getElementById('he');

            he.onclick = function () {
                languageBox.he_onclick();
            };
        }
    };

    var strings = [
        ['mb-logo', _('About Music Blocks')],
        ['play', _('Play')],
        ['stop', _('Stop')],
        ['newFile', _('New project')],
        ['load', _('Load project from file')],
        ['saveButton', _('Save project')],
        ['saveButtonAdvanced', _('Save project')],
        ['planetIcon', _('Find and share projects')],
        ['planetIconDisabled', _('Offline. Sharing is unavailable')],
        ['toggleAuxBtn', _('Auxilary menu')],
        ['helpIcon', _('Help')],
        ['runSlowlyIcon', _('Run slowly')],
        ['runStepByStepIcon', _('Run step by step')],
        ['displayStatsIcon', _('Display statistics')],
        ['loadPluginIcon', _('Load plugin')],
        ['delPluginIcon', _('Delete plugin')],
        ['enableHorizScrollIcon', _('Enable horizontal scrolling')],
        ['disableHorizScrollIcon', _('Disable horizontal scrolling')],
        ['mergeWithCurrentIcon', _('Merge with current project')],
        ['restoreIcon', _('Restore')],
        ['beginnerMode', _('Switch to beginner mode')],
        ['advancedMode', _('Switch to advanced mode')],
        ['languageSelectIcon', _('Select language')],
        ['save-html', _('Save as HTML'), 'innerHTML'],
        ['save-svg', _('Save as SVG'), 'innerHTML'],
        ['save-png', _('Save as PNG'), 'innerHTML'],
        ['save-wav', _('Save as WAV'), 'innerHTML'],
        ['save-abc', _('Save as ABC'), 'innerHTML'],
        ['save-ly', _('Save sheet music'), 'innerHTML'],
        ['save-blockartwork-svg', _('Save block artwork'), 'innerHTML'],
        ['new-project', _('Confirm'), 'innerHTML'],
        ['enUS', _('English (United States)'), 'innerHTML'],
        ['enUK', _('English (United Kingdom)'), 'innerHTML'],
        ['ja', _('日本語'), 'innerHTML'],
        ['es', _('español'), 'innerHTML'],
        ['kana', _('にほんご'), 'innerHTML'],
        ['zhCN', _('中文'), 'innerHTML'],
        ['th', _('ภาษาไทย'), 'innerHTML'],
        ['ayc', _('aymara'), 'innerHTML'],
        ['gug', _('guarani'), 'innerHTML'],
        ['hi', _('हिंदी'), 'innerHTML'],
        ['ibo', _('igbo'), 'innerHTML'],
        ['ar', _('عربى'), 'innerHTML'],
        ['he', _('עִברִית'), 'innerHTML'],
    ];

    // Workaround for FF
    var strings_ = [
        _('About Music Blocks'),
        _('Play'),
        _('Stop'),
        _('New project'),
        _('Load project from file'),
        _('Save project'),
        _('Save project'),
        _('Find and share projects'),
        _('Offline. Sharing is unavailable'),
        _('Auxilary menu'),
        _('Help'),
        _('Run slowly'),
        _('Run step by step'),
        _('Display statistics'),
        _('Load plugin'),
        _('Delete plugin'),
        _('Enable horizontal scrolling'),
        _('Disable horizontal scrolling'),
        _('Merge with current project'),
        _('Restore'),
        _('Switch to beginner mode'),
        _('Switch to advanced mode'),
        _('Select language'),
        _('Save as HTML'),
        _('Save as SVG'),
        _('Save as PNG'),
        _('Save as WAV'),
        _('Save as ABC'),
        _('Save sheet music'),
        _('Save block artwork'),
        _('Confirm'),
        _('Select language'),
    ];

    this.init = function (mode) {
        var beginnerMode = document.getElementById('beginnerMode');
        var advancedMode = document.getElementById('advancedMode');
        if (mode || mode === 'null') {
            advancedMode.style.display = 'block';
            beginnerMode.style.display = 'none';
        } else {
            advancedMode.style.display = 'none';
            beginnerMode.style.display = 'display';
        }

        for (var i = 0; i < strings.length; i++) {
            var obj = strings[i];
            var trans = strings_[i];
            var elem = document.getElementById(obj[0]);
            if (strings[i].length === 3) {
                elem.innerHTML = obj[1];
            } else {
                elem.setAttribute('data-tooltip', trans);
            }
        }

        if (!tooltipsDisabled) {
            $j('.tooltipped').tooltip({
                html: true,
                delay: 100
            });
        }

        $j('.materialize-iso, .dropdown-trigger').dropdown({
            constrainWidth: false,
            hover: false, // Activate on hover
            belowOrigin: true, // Displays dropdown below the button
        });
    };

    this.disableTooltips = function (jquery) {
        jquery('.tooltipped').tooltip('remove');
        tooltipsDisabled = true;
    }
};
