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
const $j = jQuery.noConflict();

class Toolbar {
    constructor() {
        this.stopIconColorWhenPlaying = "#ea174c";
        this.language = localStorage.languagePreference;
        if (this.language === undefined) {
            this.language = navigator.language;
        }
        this.tooltipsDisabled = false;
    }

    renderLogoIcon(onclick) {
        let logoIcon = docById("mb-logo");
        if (this.language === "ja") {
            logoIcon.innerHTML =
                '<img style="width: 100%;" src="images/logo-ja.svg">';
        }

        logoIcon.onmouseenter = () => {
            document.body.style.cursor = "pointer";
        };

        logoIcon.onmouseleave = () => {
            document.body.style.cursor = "default";
        };

        logoIcon.onclick = () => {
            onclick();
        };
    }

    renderPlayIcon(onclick) {
        let playIcon = docById("play");
        let stopIcon = docById("stop");

        playIcon.onclick = () => {
            onclick();
            stopIcon.style.color = this.stopIconColorWhenPlaying;
        };
    }

    renderStopIcon(onclick) {
        let stopIcon = docById("stop");

        stopIcon.onclick = () => {
            onclick();
            stopIcon.style.color = "white";
        };
    }

    renderNewProjectIcon(onclick) {
        let newProjectIcon = docById("new-project");

        newProjectIcon.onclick = () => {
            onclick();
        };
    }

    renderLoadIcon(onclick) {
        let loadIcon = docById("load");

        loadIcon.onclick = () => {
            onclick();
        };
    }

    // let wrapTurtleTooltipData = "Wrap Turtle Off";
    renderWrapIcon() {
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
        };
    }

    renderSaveIcons(
        html_onclick,
        doSVG_onclick,
        svg_onclick,
        png_onclick,
        wave_onclick,
        ly_onclick,
        abc_onclick,
        mxml_onclick,
        blockartworksvg_onclick) {
        let saveButton = docById("saveButton");
        let saveButtonAdvanced = docById("saveButtonAdvanced");
        let saveHTML;
        let savePNG;
        let saveWAV;
        let saveSVG;
        let saveLY;
        let saveABC;
        let saveMXML;
        let svgData;

        if (beginnerMode) {
            if (_THIS_IS_MUSIC_BLOCKS_ && this.language === "ja") {
                saveButton.onclick = () => {
                    html_onclick();
                };
            } else {
                saveButton.style.display = "block";
                saveButtonAdvanced.style.display = "none";

                saveButton.onclick = () => {
                    //html_onclick();
                    saveHTML = docById("save-html-beg");
                    console.debug(saveHTML);
                    saveHTML.onclick = () => {
                        html_onclick();
                    };

                    savePNG = docById("save-png-beg");
                    console.debug(savePNG);
                    svgData = doSVG_onclick(
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
                        savePNG.onclick = () => {
                            png_onclick();
                        };
                    }
                };
            }
        } else {
            console.debug("ADVANCED MODE BUTTONS");
            saveButton.style.display = "none";
            saveButtonAdvanced.style.display = "block";
            saveButtonAdvanced.onclick = () => {
                saveHTML = docById("save-html");
                console.debug(saveHTML);

                saveHTML.onclick = () => {
                    html_onclick();
                };

                saveSVG = docById("save-svg");
                savePNG = docById("save-png");
                console.debug(savePNG);
                svgData = doSVG_onclick(
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

                    saveSVG.onclick = () => {
                        svg_onclick();
                    };

                    savePNG.onclick = () => {
                        png_onclick();
                    };
                }

                if (_THIS_IS_MUSIC_BLOCKS_) {
                    saveWAV = docById("save-wav");

                    saveWAV.onclick = wave_onclick;

                    saveLY = docById("save-ly");

                    saveLY.onclick = () => {
                        ly_onclick();
                    };

                    saveABC = docById("save-abc");

                    saveABC.onclick = () => {
                        abc_onclick();
                    };

                    saveMXML = docById("save-mxml");

                    saveMXML.onclick = () => {
                        mxml_onclick();
                    };
                }

                let saveArtworkSVG = docById("save-blockartwork-svg");

                saveArtworkSVG.onclick = () => {
                    blockartworksvg_onclick();
                };
            };
        }
    }

    renderPlanetIcon(planet, onclick) {
        let planetIcon = docById("planetIcon");
        let planetIconDisabled = docById("planetIconDisabled");

        if (planet) {
            planetIcon.onclick = () => {
                docById("toolbars").style.display = "none";
                docById("wheelDiv").style.display = "none";
                docById("contextWheelDiv").style.display = "none";
                onclick();
            };
        } else {
            planetIcon.style.display = "none";
            planetIconDisabled.style.display = "block";
        }
    }

    renderMenuIcon(onclick) {
        let menuIcon = docById("menu");
        let auxToolbar = docById("aux-toolbar");
        menuIcon.onclick = () => {
            if (auxToolbar.style.display == "" ||
                auxToolbar.style.display == "none") {
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
        }
    }

    renderRunSlowlyIcon(onclick) {
        let runSlowlyIcon = docById("runSlowlyIcon");
        if (_THIS_IS_MUSIC_BLOCKS_ && beginnerMode && language === "ja") {
            runSlowlyIcon.style.display = "none";
        }

        runSlowlyIcon.onclick = () => {
            onclick();
            docById("stop").style.color = stopIconColorWhenPlaying;
        };
    }

    renderHelpIcon(onclick) {
        let helpIcon = docById("helpIcon");

        helpIcon.onclick = () => {
            onclick();
        };
    }

    renderModeSelectIcon(onclick) {
        if (_THIS_IS_MUSIC_BLOCKS_) {
            let begIcon = docById("beginnerMode");
            let advIcon = docById("advancedMode");
            if (begIcon.style.display === "none") {
                advIcon.onclick = () => {
                    onclick();
                };
            } else {
                begIcon.onclick = () => {
                    onclick();
                };
            }
        }
    }

    renderRunSlowlyIcon(onclick) {
        let runSlowlyIcon = docById("runSlowlyIcon");
        if (_THIS_IS_MUSIC_BLOCKS_ && beginnerMode && this.language === "ja") {
            runSlowlyIcon.style.display = "none";
        }

        runSlowlyIcon.onclick = () => {
            onclick();
            docById("stop").style.color = this.stopIconColorWhenPlaying;
        };
    }

    renderRunStepIcon(onclick) {
        let runStepByStepIcon = docById("runStepByStepIcon");
        if (_THIS_IS_MUSIC_BLOCKS_ && beginnerMode && this.language === "ja") {
            runStepByStepIcon.style.display = "none";
        }

        runStepByStepIcon.onclick = () => {
            onclick();
            docById("stop").style.color = this.stopIconColorWhenPlaying;
        };
    }

    renderAdvancedIcons(
        analytics_onclick,
        openPlugin_onclick,
        delPlugin_onclick,
        setScroller,
        _setupBlocksContainerEvents) {
        let displayStatsIcon = docById("displayStatsIcon");
        let loadPluginIcon = docById("loadPluginIcon");
        let delPluginIcon = docById("delPluginIcon");
        let enableHorizScrollIcon = docById("enableHorizScrollIcon");
        let disableHorizScrollIcon = docById("disableHorizScrollIcon");

        if (!_THIS_IS_MUSIC_BLOCKS_ || !beginnerMode) {
            displayStatsIcon.onclick = () => {
                analytics_onclick();
            };

            loadPluginIcon.onclick = () => {
                openPlugin_onclick();
            };

            delPluginIcon.onclick = () => {
                delPlugin_onclick();
            };

            enableHorizScrollIcon.onclick = () => {
                setScroller();
                _setupBlocksContainerEvents();
            };

            disableHorizScrollIcon.onclick = () => {
                setScroller();
                _setupBlocksContainerEvents();
            };
        } else {
            displayStatsIcon.style.display = "none";
            loadPluginIcon.style.display = "none";
            delPluginIcon.style.display = "none";
            enableHorizScrollIcon.style.display = "none";
        }
    }

    // let scrollEnabled = false;
    // renderEnableHorizScrollIcon(setScroller, _setupBlocksContainerEvents) {
    //     let enableHorizScrollIcon = docById('enableHorizScrollIcon');
    //     enableHorizScrollIcon.onclick = () => {
    //         setScroller();
    //         _setupBlocksContainerEvents();
    //     }
    // }
    renderMergeIcon(onclick) {
        let mergeWithCurrentIcon = docById("mergeWithCurrentIcon");

        mergeWithCurrentIcon.onclick = () => {
            onclick();
        };
    }

    renderRestoreIcon(onclick) {
        let restoreIcon = docById("restoreIcon");

        restoreIcon.onclick = () => {
            onclick();
        };
    }

    renderChooseKeyIcon(onclick) {
        let chooseKeyIcon = docById("chooseKeyIcon");
        docById("chooseKeyDiv").style.display = "none";
        chooseKeyIcon.onclick = () => {
            onclick();
        };
    }

    renderJavaScriptIcon(onclick) {
        docById("toggleJavaScriptIcon").onclick = () => onclick();
    }

    renderLanguageSelectIcon(languageBox) {
        let languageSelectIcon = docById("languageSelectIcon");
        languageSelectIcon.onclick = () => {
            let enUS = docById("enUS");

            enUS.onclick = () => {
                languageBox.enUS_onclick();
            };

            let enUK = docById("enUK");

            enUK.onclick = () => {
                languageBox.enUK_onclick();
            };

            let es = docById("es");

            es.onclick = () => {
                languageBox.es_onclick();
            };

            let pt = docById("pt");

            pt.onclick = () => {
                languageBox.pt_onclick();
            };

            let ko = docById("ko");

            ko.onclick = () => {
                languageBox.ko_onclick();
            };

            let ja = docById("ja");

            ja.onclick = () => {
                languageBox.ja_onclick();
            };

            let kana = docById("kana");

            kana.onclick = () => {
                languageBox.kana_onclick();
            };

            let zhCN = docById("zhCN");

            zhCN.onclick = () => {
                languageBox.zhCN_onclick();
            };

            let th = docById("th");

            th.onclick = () => {
                languageBox.th_onclick();
            };

            let ayc = docById("ayc");

            ayc.onclick = () => {
                languageBox.ayc_onclick();
            };

            let quz = docById("quz");

            quz.onclick = () => {
                languageBox.quz_onclick();
            };

            let gug = docById("gug");

            gug.onclick = () => {
                languageBox.gug_onclick();
            };

            let hi = docById("hi");

            hi.onclick = () => {
                languageBox.hi_onclick();
            };

            let ibo = docById("ibo");

            ibo.onclick = () => {
                languageBox.ibo_onclick();
            };

            let ar = docById("ar");

            ar.onclick = () => {
                languageBox.ar_onclick();
            };

            let he = docById("he");

            he.onclick = () => {
                languageBox.he_onclick();
            };
        };
    }

    init(mode) {
        let strings;
        let strings_;
        if (_THIS_IS_MUSIC_BLOCKS_) {
            strings = [
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
                ["toggleJavaScriptIcon", _("Toggle JavaScript Editor")],
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
            strings_ = [
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
                _("Toggle JavaScript Editor"),
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
            strings = [
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
                ["toggleJavaScriptIcon", _("Toggle JavaScript Editor")],
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
            strings_ = [
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
                _("Toggle JavaScript Editor"),
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

        if (_THIS_IS_MUSIC_BLOCKS_) {
            let beginnerMode = docById("beginnerMode");
            let advancedMode = docById("advancedMode");
            if (mode || mode === "null") {
                advancedMode.style.display = "block";
                beginnerMode.style.display = "none";
            } else {
                advancedMode.style.display = "none";
                beginnerMode.style.display = "display";
            }
        }

        for (let i = 0; i < strings.length; i++) {
            let obj = strings[i];
            let trans = strings_[i];
            let elem = docById(obj[0]);
            if (strings[i].length === 3) {
                elem.innerHTML = obj[1];
            } else {
                elem.setAttribute("data-tooltip", trans);
            }
        }

        if (!this.tooltipsDisabled) {
            $j(".tooltipped").tooltip({
                html: true,
                delay: 100
            });
        }

        $j(".materialize-iso, .dropdown-trigger").dropdown({
            constrainWidth: false,
            hover: false,
            belowOrigin: true // Displays dropdown below the button
        });
    }

    disableTooltips = (jquery) => {
        jquery(".tooltipped").tooltip("remove");
        this.tooltipsDisabled = true;
    }

    closeAuxToolbar = (onclick) => {
        if (auxToolbar.style.display === "block") {
            onclick(false);
            let menuIcon = docById("menu");
            auxToolbar.style.display = "none";
            menuIcon.innerHTML = "menu";
            docById("toggleAuxBtn").className -= "blue darken-1";
        }
    }
}
