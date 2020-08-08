// Copyright (c) 2018,19 Austin George
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
let WRAP = true;

function Toolbar() {
    var $j = jQuery.noConflict();
    var stopIconColorWhenPlaying = "#ea174c";
    var language = localStorage.languagePreference;
    if (language === undefined) {
        language = navigator.language;
    }

    var tooltipsDisabled = false;

    this.renderLogoIcon = function(onclick) {
        var logoIcon = docById("mb-logo");
        if (language === "ja") {
            logoIcon.innerHTML =
                '<img style="width: 100%;" src="images/logo-ja.svg">';
        }

        logoIcon.onmouseenter = function() {
            document.body.style.cursor = "pointer";
        };

        logoIcon.onmouseleave = function() {
            document.body.style.cursor = "default";
        };

        logoIcon.onclick = function() {
            onclick();
        };
    };

    this.renderPlayIcon = function(onclick) {
        var playIcon = docById("play");
        var stopIcon = docById("stop");

        playIcon.onclick = function() {
            onclick();
            stopIcon.style.color = stopIconColorWhenPlaying;
        };
    };

    this.renderStopIcon = function(onclick) {
        var stopIcon = docById("stop");

        stopIcon.onclick = function() {
            onclick();
            stopIcon.style.color = "white";
        };
    };

    this.renderNewProjectIcon = function(onclick) {
        var newProjectIcon = docById("new-project");

        newProjectIcon.onclick = function() {
            onclick();
        };
    };

    this.renderLoadIcon = function(onclick) {
        var loadIcon = docById("load");

        loadIcon.onclick = function() {
            onclick();
        };
    };

    // let wrapTurtleTooltipData = "Wrap Turtle Off";
    
    this.renderWrapIcon = function() {
        let wrapIcon = docById("wrapTurtle");
        let wrapButtonTooltipData = "Turtle Wrap Off";

        wrapIcon.setAttribute("data-tooltip", wrapButtonTooltipData);
        $j(".tooltipped").tooltip({
            html: true,
            delay: 100
        });

        wrapIcon.onclick = () => {
            WRAP = !WRAP;
            if (WRAP) {
                wrapButtonTooltipData = "Turtle Wrap Off";
            } else {
                wrapButtonTooltipData = "Turle Wrap On";
            }

            wrapIcon.setAttribute("data-tooltip", wrapButtonTooltipData);
            $j(".tooltipped").tooltip({
                html: true,
                delay: 100
            });
        }
    }

    this.renderSaveIcons = function(
        html_onclick,
        doSVG_onclick,
        svg_onclick,
        png_onclick,
        wave_onclick,
        ly_onclick,
        abc_onclick,
        mxml_onclick,
        blockartworksvg_onclick
    ) {
        var saveButton = docById("saveButton");
        var saveButtonAdvanced = docById("saveButtonAdvanced");
        if (beginnerMode) {
            if (_THIS_IS_MUSIC_BLOCKS_ && language === "ja") {
                saveButton.onclick = function() {
                    html_onclick();
                };
            } else {
                saveButton.style.display = "block";
                saveButtonAdvanced.style.display = "none";

                saveButton.onclick = function() {
                    //html_onclick();
                    var saveHTML = docById("save-html-beg");
                    console.debug(saveHTML);
                    saveHTML.onclick = function() {
                        html_onclick();
                    };

                    var savePNG = docById("save-png-beg");
                    console.debug(savePNG);
                    var svgData = doSVG_onclick(
                        canvas,
                        logo,
                        turtles,
                        canvas.width,
                        canvas.height,
                        1.0
                    );

                    if (svgData == "") {
                        savePNG.disabled = true;
                        savePNG.className = "grey-text inactiveLink";
                    } else {
                        savePNG.disabled = false;
                        savePNG.className = "";
                        savePNG.onclick = function() {
                            png_onclick();
                        };
                    }
                };
            }
        } else {
            console.debug("ADVANCED MODE BUTTONS");
            saveButton.style.display = "none";
            saveButtonAdvanced.style.display = "block";
            saveButtonAdvanced.onclick = function() {
                var saveHTML = docById("save-html");
                console.debug(saveHTML);

                saveHTML.onclick = function() {
                    html_onclick();
                };

                var saveSVG = docById("save-svg");
                var savePNG = docById("save-png");
                console.debug(savePNG);
                var svgData = doSVG_onclick(
                    canvas,
                    logo,
                    turtles,
                    canvas.width,
                    canvas.height,
                    1.0
                );

                // if there is no mouse artwork to save then grey out
                if (svgData == "") {
                    saveSVG.disabled = true;
                    savePNG.disabled = true;
                    saveSVG.className = "grey-text inactiveLink";
                    savePNG.className = "grey-text inactiveLink";
                } else {
                    saveSVG.disabled = false;
                    savePNG.disabled = false;
                    saveSVG.className = "";
                    savePNG.className = "";

                    saveSVG.onclick = function() {
                        svg_onclick();
                    };

                    savePNG.onclick = function() {
                        png_onclick();
                    };
                }

                if (_THIS_IS_MUSIC_BLOCKS_) {
                    var saveWAV = docById("save-wav");

                    // Until we fix #1744, disable recorder on FF
                    // if (platform.FF) {
                    saveWAV.disabled = true;
                    saveWAV.className = "grey-text inactiveLink";
                    // } else {
                    //    saveWAV.onclick = function () {
                    //        wave_onclick();
                    //    };
                    // }

                    var saveLY = docById("save-ly");

                    saveLY.onclick = function() {
                        ly_onclick();
                    };

                    var saveABC = docById("save-abc");

                    saveABC.onclick = function() {
                        abc_onclick();
                    };

                    var saveMXML = docById("save-mxml");

                    saveMXML.onclick = function() {
                        mxml_onclick();
                    };
                }

                var saveArtworkSVG = docById("save-blockartwork-svg");

                saveArtworkSVG.onclick = function() {
                    blockartworksvg_onclick();
                };
            };
        }
    };

    this.renderPlanetIcon = function(planet, onclick) {
        var planetIcon = docById("planetIcon");
        var planetIconDisabled = docById("planetIconDisabled");

        if (planet) {
            planetIcon.onclick = function() {
                docById("toolbars").style.display = "none";
                docById("wheelDiv").style.display = "none";
                docById("contextWheelDiv").style.display = "none";
                onclick();
            };
        } else {
            planetIcon.style.display = "none";
            planetIconDisabled.style.display = "block";
        }
    };

    this.renderMenuIcon = function(onclick) {
        var menuIcon = docById("menu");
        var auxToolbar = docById("aux-toolbar");
        menuIcon.onclick = function() {
            if (
                auxToolbar.style.display == "" ||
                auxToolbar.style.display == "none"
            ) {
                onclick(false);
                auxToolbar.style.display = "block";
                menuIcon.innerHTML = "more_vert";
                docById("toggleAuxBtn").className = "blue darken-1";
            } else {
                onclick(true);
                auxToolbar.style.display = "none";
                menuIcon.innerHTML = "menu";
                docById("toggleAuxBtn").className -= "blue darken-1";
            }
        };
    };

    this.renderHelpIcon = function(onclick) {
        var helpIcon = docById("helpIcon");

        helpIcon.onclick = function() {
            onclick();
        };
    };

    this.renderModeSelectIcon = function(onclick) {
        if (_THIS_IS_MUSIC_BLOCKS_) {
            var begIcon = docById("beginnerMode");
            var advIcon = docById("advancedMode");
            if (begIcon.style.display === "none") {
                advIcon.onclick = function() {
                    onclick();
                };
            } else {
                begIcon.onclick = function() {
                    onclick();
                };
            }
        }
    };

    this.renderRunSlowlyIcon = function(onclick) {
        var runSlowlyIcon = docById("runSlowlyIcon");
        if (_THIS_IS_MUSIC_BLOCKS_ && beginnerMode && language === "ja") {
            runSlowlyIcon.style.display = "none";
        }

        runSlowlyIcon.onclick = function() {
            onclick();
            docById("stop").style.color = stopIconColorWhenPlaying;
        };
    };

    this.renderRunStepIcon = function(onclick) {
        var runStepByStepIcon = docById("runStepByStepIcon");
        if (_THIS_IS_MUSIC_BLOCKS_ && beginnerMode && language === "ja") {
            runStepByStepIcon.style.display = "none";
        }

        runStepByStepIcon.onclick = function() {
            onclick();
            docById("stop").style.color = stopIconColorWhenPlaying;
        };
    };

    this.renderAdvancedIcons = function(
        analytics_onclick,
        openPlugin_onclick,
        delPlugin_onclick,
        setScroller,
        _setupBlocksContainerEvents
    ) {
        var displayStatsIcon = docById("displayStatsIcon");
        var loadPluginIcon = docById("loadPluginIcon");
        var delPluginIcon = docById("delPluginIcon");
        var enableHorizScrollIcon = docById("enableHorizScrollIcon");
        var disableHorizScrollIcon = docById("disableHorizScrollIcon");

        if (!_THIS_IS_MUSIC_BLOCKS_ || !beginnerMode) {
            displayStatsIcon.onclick = function() {
                analytics_onclick();
            };

            loadPluginIcon.onclick = function() {
                openPlugin_onclick();
            };

            delPluginIcon.onclick = function() {
                delPlugin_onclick();
            };

            enableHorizScrollIcon.onclick = function() {
                setScroller();
                _setupBlocksContainerEvents();
            };

            disableHorizScrollIcon.onclick = function() {
                setScroller();
                _setupBlocksContainerEvents();
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
    //     var enableHorizScrollIcon = docById('enableHorizScrollIcon');
    //     enableHorizScrollIcon.onclick = function () {
    //         setScroller();
    //         _setupBlocksContainerEvents();
    //     }

    // }

    this.renderMergeIcon = function(onclick) {
        var mergeWithCurrentIcon = docById("mergeWithCurrentIcon");

        mergeWithCurrentIcon.onclick = function() {
            onclick();
        };
    };

    this.renderRestoreIcon = function(onclick) {
        var restoreIcon = docById("restoreIcon");

        restoreIcon.onclick = function() {
            onclick();
        };
    };

    this.renderChooseKeyIcon = function(onclick) {
        var chooseKeyIcon = docById("chooseKeyIcon");
        docById("chooseKeyDiv").style.display = "none";
        chooseKeyIcon.onclick = () => {
            onclick();
        };
    };

    this.renderLanguageSelectIcon = function(languageBox) {
        var languageSelectIcon = docById("languageSelectIcon");
        languageSelectIcon.onclick = function() {
            var enUS = docById("enUS");

            enUS.onclick = function() {
                languageBox.enUS_onclick();
            };

            var enUK = docById("enUK");

            enUK.onclick = function() {
                languageBox.enUK_onclick();
            };

            var es = docById("es");

            es.onclick = function() {
                languageBox.es_onclick();
            };

            var pt = docById("pt");

            pt.onclick = function() {
                languageBox.pt_onclick();
            };

	    var ko = docById("ko");

	    ko.onclick = function() {
		languageBox.ko_onclick();
	    };

            var ja = docById("ja");

            ja.onclick = function() {
                languageBox.ja_onclick();
            };

            var kana = docById("kana");

            kana.onclick = function() {
                languageBox.kana_onclick();
            };

            var zhCN = docById("zhCN");

            zhCN.onclick = function() {
                languageBox.zhCN_onclick();
            };

            var th = docById("th");

            th.onclick = function() {
                languageBox.th_onclick();
            };

            var ayc = docById("ayc");

            ayc.onclick = function() {
                languageBox.ayc_onclick();
            };

            var quz = docById("quz");

            quz.onclick = function() {
                languageBox.quz_onclick();
            };

            var gug = docById("gug");

            gug.onclick = function() {
                languageBox.gug_onclick();
            };

            var hi = docById("hi");

            hi.onclick = function() {
                languageBox.hi_onclick();
            };

            var ibo = docById("ibo");

            ibo.onclick = function() {
                languageBox.ibo_onclick();
            };

            var ar = docById("ar");

            ar.onclick = function() {
                languageBox.ar_onclick();
            };

            var he = docById("he");

            he.onclick = function() {
                languageBox.he_onclick();
            };
        };
    };

    if (_THIS_IS_MUSIC_BLOCKS_) {
        var strings = [
            ["mb-logo", _("About Music Blocks")],
            ["play", _("Play")],
            ["stop", _("Stop")],
            ["newFile", _("New project")],
            ["load", _("Load project from file")],
            ["saveButton", _("Save project")],
            ["saveButtonAdvanced", _("Save project as HTML")],
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
            ["chooseKeyIcon", _("Set Pitch Preview")],
            ["restoreIcon", _("Restore")],
            ["beginnerMode", _("Switch to beginner mode")],
            ["advancedMode", _("Switch to advanced mode")],
            ["languageSelectIcon", _("Select language")],
            ["save-html-beg", _("Save project as HTML"), "innerHTML"],
            ["save-png-beg", _("Save mouse artwork as PNG"), "innerHTML"],
            ["save-html", _("Save project as HTML"), "innerHTML"],
            ["save-svg", _("Save mouse artwork as SVG"), "innerHTML"],
            ["save-png", _("Save mouse artwork as PNG"), "innerHTML"],
            ["save-wav", _("Save music as WAV"), "innerHTML"],
            ["save-abc", _("Save sheet music as ABC"), "innerHTML"],
            ["save-ly", _("Save sheet music as Lilypond"), "innerHTML"],
            ["save-mxml", _("Save sheet music as MusicXML"), "innerHTML"],
            [
                "save-blockartwork-svg",
                _("Save block artwork as SVG"),
                "innerHTML"
            ],
            ["new-project", _("Confirm"), "innerHTML"],
            ["enUS", _("English (United States)"), "innerHTML"],
            ["enUK", _("English (United Kingdom)"), "innerHTML"],
            ["ja", _("日本語"), "innerHTML"],
	    ["ko", _("한국어"), "innerHTML"],
            ["es", _("español"), "innerHTML"],
            ["pt", _("português"), "innerHTML"],
            ["kana", _("にほんご"), "innerHTML"],
            ["zhCN", _("中文"), "innerHTML"],
            ["th", _("ภาษาไทย"), "innerHTML"],
            ["ayc", _("aymara"), "innerHTML"],
	    ["quz", _("quechua"), "innerHTML"],
            ["gug", _("guarani"), "innerHTML"],
            ["hi", _("हिंदी"), "innerHTML"],
            ["ibo", _("igbo"), "innerHTML"],
            ["ar", _("عربى"), "innerHTML"],
            ["he", _("עִברִית"), "innerHTML"]
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
            _("Set Pitch Preview"),
            _("Restore"),
            _("Switch to beginner mode"),
            _("Switch to advanced mode"),
            _("Select language"),
            _("Save project as HTML"),
            _("Save mouse artwork as SVG"),
            _("Save mouse artwork as PNG"),
            _("Save music as WAV"),
            _("Save sheet music as ABC"),
            _("Save sheet music as Lilypond"),
            _("Save block artwork as SVG"),
            _("Confirm"),
            _("Select language")
        ];
    } else {
        var strings = [
            ["mb-logo", _("About Turtle Blocks")],
            ["play", _("Play")],
            ["stop", _("Stop")],
            ["newFile", _("New project")],
            ["load", _("Load project from file")],
            ["saveButton", _("Save project")],
            ["saveButtonAdvanced", _("Save project as HTML")],
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
            ["chooseKeyIcon", _("Set Pitch Preview")],
            ["restoreIcon", _("Restore")],
            ["languageSelectIcon", _("Select language")],
            ["save-html-beg", _("Save project as HTML"), "innerHTML"],
            ["save-png-beg", _("Save mouse artwork as PNG"), "innerHTML"],
            ["save-html", _("Save project as HTML"), "innerHTML"],
            ["save-svg", _("Save mouse artwork as SVG"), "innerHTML"],
            ["save-png", _("Save mouse artwork as PNG"), "innerHTML"],
            [
                "save-blockartwork-svg",
                _("Save block artwork as SVG"),
                "innerHTML"
            ],
            ["new-project", _("Confirm"), "innerHTML"],
            ["enUS", _("English (United States)"), "innerHTML"],
            ["enUK", _("English (United Kingdom)"), "innerHTML"],
            ["ja", _("日本語"), "innerHTML"],
	    ["ko", _("한국인"), "innerHTML"],
            ["es", _("español"), "innerHTML"],
            ["pt", _("português"), "innerHTML"],
            ["kana", _("にほんご"), "innerHTML"],
            ["zhCN", _("中文"), "innerHTML"],
            ["th", _("ภาษาไทย"), "innerHTML"],
            ["ayc", _("aymara"), "innerHTML"],
            ["quz", _("quechua"), "innerHTML"],
            ["gug", _("guarani"), "innerHTML"],
            ["hi", _("हिंदी"), "innerHTML"],
            ["ibo", _("igbo"), "innerHTML"],
            ["ar", _("عربى"), "innerHTML"],
            ["he", _("עִברִית"), "innerHTML"]
        ];

        // Workaround for FF
        var strings_ = [
            _("About Turtle Blocks"),
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
            _("Set Pitch Preview"),
            _("Restore"),
            _("Select language"),
            _("Save project as HTML"),
            _("Save turtle artwork as SVG"),
            _("Save turtle artwork as PNG"),
            _("Save block artwork as SVG"),
            _("Confirm"),
            _("Select language")
        ];
    }

    this.init = function(mode) {
        if (_THIS_IS_MUSIC_BLOCKS_) {
            var beginnerMode = docById("beginnerMode");
            var advancedMode = docById("advancedMode");
            if (mode || mode === "null") {
                advancedMode.style.display = "block";
                beginnerMode.style.display = "none";
            } else {
                advancedMode.style.display = "none";
                beginnerMode.style.display = "display";
            }
        }

        for (var i = 0; i < strings.length; i++) {
            var obj = strings[i];
            var trans = strings_[i];
            var elem = docById(obj[0]);
            if (strings[i].length === 3) {
                elem.innerHTML = obj[1];
            } else {
                elem.setAttribute("data-tooltip", trans);
            }
        }

        if (!tooltipsDisabled) {
            $j(".tooltipped").tooltip({
                html: true,
                delay: 100
            });
        }

        $j(".materialize-iso, .dropdown-trigger").dropdown({
            constrainWidth: false,
            hover: false, // Activate on hover
            belowOrigin: true // Displays dropdown below the button
        });
    };

    this.disableTooltips = function(jquery) {
        jquery(".tooltipped").tooltip("remove");
        tooltipsDisabled = true;
    };

    this.closeAuxToolbar = function(onclick) {
        if (auxToolbar.style.display === "block") {
            onclick(false);
            var menuIcon = docById("menu");
            auxToolbar.style.display = "none";
            menuIcon.innerHTML = "menu";
            docById("toggleAuxBtn").className -= "blue darken-1";
        }
    };
}
