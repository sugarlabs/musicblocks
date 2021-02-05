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
    /**
     * @constructor
     */
    constructor() {
        this.stopIconColorWhenPlaying = "#ea174c";
        this.language = localStorage.languagePreference;
        if (this.language === undefined) {
            this.language = navigator.language;
        }
        this.tooltipsDisabled = false;
    }

    /**
     * Initializes the toolbar
     * @param  {boolean} mode
     * @returns {void}
     */
    init(mode) {
        console.log(mode);
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
                ["save-blockartwork-svg", _("Save block artwork as SVG"), "innerHTML"],
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
                ["save-blockartwork-svg", _("Save block artwork as SVG"), "innerHTML"],
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
            const beginnerMode = docById("beginnerMode");
            const advancedMode = docById("advancedMode");
            if (mode || mode === "null") {
                advancedMode.style.display = "block";
                beginnerMode.style.display = "none";
            } else {
                advancedMode.style.display = "none";
                beginnerMode.style.display = "display";
            }
        }

        for (let i = 0; i < strings.length; i++) {
            const obj = strings[i];
            const trans = strings_[i];
            const elem = docById(obj[0]);
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

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderLogoIcon(onclick) {
        const logoIcon = docById("mb-logo");
        if (this.language === "ja") {
            logoIcon.innerHTML = '<img style="width: 100%;" src="images/logo-ja.svg">';
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

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderPlayIcon(onclick) {
        const playIcon = docById("play");
        const stopIcon = docById("stop");

        playIcon.onclick = () => {
            onclick();
            stopIcon.style.color = this.stopIconColorWhenPlaying;
        };
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderStopIcon(onclick) {
        const stopIcon = docById("stop");

        stopIcon.onclick = () => {
            onclick();
            stopIcon.style.color = "white";
        };
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderNewProjectIcon(onclick) {
        const newProjectIcon = docById("new-project");

        newProjectIcon.onclick = () => {
            onclick();
        };
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderLoadIcon(onclick) {
        const loadIcon = docById("load");

        loadIcon.onclick = () => {
            onclick();
        };
    }

    /**
     * @public
     * @returns {void}
     */
    renderWrapIcon() {
        const wrapIcon = docById("wrapTurtle");
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

    /**
     * @public
     * @param  {Function} html_onclick
     * @param  {Function} doSVG_onclick
     * @param  {Function} svg_onclick
     * @param  {Function} png_onclick
     * @param  {Function} wave_onclick
     * @param  {Function} ly_onclick
     * @param  {Function} abc_onclick
     * @param  {Function} mxml_onclick
     * @param  {Function} blockartworksvg_onclick
     * @returns {void}
     */
    renderSaveIcons(
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
        const saveButton = docById("saveButton");
        const saveButtonAdvanced = docById("saveButtonAdvanced");
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
                    // console.debug(saveHTML);
                    saveHTML.onclick = () => {
                        html_onclick();
                    };

                    savePNG = docById("save-png-beg");
                    // console.debug(savePNG);
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
            // console.debug("ADVANCED MODE BUTTONS");
            saveButton.style.display = "none";
            saveButtonAdvanced.style.display = "block";
            saveButtonAdvanced.onclick = () => {
                saveHTML = docById("save-html");
                // console.debug(saveHTML);

                saveHTML.onclick = () => {
                    html_onclick();
                };

                saveSVG = docById("save-svg");
                savePNG = docById("save-png");
                // console.debug(savePNG);
                svgData = doSVG_onclick(canvas, logo, turtles, canvas.width, canvas.height, 1.0);

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

                const saveArtworkSVG = docById("save-blockartwork-svg");

                saveArtworkSVG.onclick = () => {
                    blockartworksvg_onclick();
                };
            };
        }
    }
    /**
     * @public
     * @param  {} planet
     * @param  {Function} onclick
     * @returns {void}
     */
    renderPlanetIcon(planet, onclick) {
        const planetIcon = docById("planetIcon");
        const planetIconDisabled = docById("planetIconDisabled");
        console.log(planet);
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

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderMenuIcon(onclick) {
        const menuIcon = docById("menu");
        const auxToolbar = docById("aux-toolbar");
        menuIcon.onclick = () => {
            if (auxToolbar.style.display == "" || auxToolbar.style.display == "none") {
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
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderRunSlowlyIcon(onclick) {
        const runSlowlyIcon = docById("runSlowlyIcon");
        if (_THIS_IS_MUSIC_BLOCKS_ && beginnerMode && language === "ja") {
            runSlowlyIcon.style.display = "none";
        }

        runSlowlyIcon.onclick = () => {
            onclick();
            docById("stop").style.color = stopIconColorWhenPlaying;
        };
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderHelpIcon(onclick) {
        const helpIcon = docById("helpIcon");

        helpIcon.onclick = () => {
            onclick();
        };
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderModeSelectIcon(onclick) {
        if (_THIS_IS_MUSIC_BLOCKS_) {
            const begIcon = docById("beginnerMode");
            const advIcon = docById("advancedMode");
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

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderRunSlowlyIcon(onclick) {
        const runSlowlyIcon = docById("runSlowlyIcon");
        if (_THIS_IS_MUSIC_BLOCKS_ && beginnerMode && this.language === "ja") {
            runSlowlyIcon.style.display = "none";
        }

        runSlowlyIcon.onclick = () => {
            onclick();
            docById("stop").style.color = this.stopIconColorWhenPlaying;
        };
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderRunStepIcon(onclick) {
        const runStepByStepIcon = docById("runStepByStepIcon");
        if (_THIS_IS_MUSIC_BLOCKS_ && beginnerMode && this.language === "ja") {
            runStepByStepIcon.style.display = "none";
        }

        runStepByStepIcon.onclick = () => {
            onclick();
            docById("stop").style.color = this.stopIconColorWhenPlaying;
        };
    }
    /**
     * @public
     * @param  {Function} analytics_onclick
     * @param  {Function} openPlugin_onclick
     * @param  {Function} delPlugin_onclick
     * @param  {Function} setScroller
     * @param  {Function} _setupBlocksContainerEvents
     * @returns {void}
     */
    renderAdvancedIcons(
        analytics_onclick,
        openPlugin_onclick,
        delPlugin_onclick,
        setScroller,
        _setupBlocksContainerEvents
    ) {
        const displayStatsIcon = docById("displayStatsIcon");
        const loadPluginIcon = docById("loadPluginIcon");
        const delPluginIcon = docById("delPluginIcon");
        const enableHorizScrollIcon = docById("enableHorizScrollIcon");
        const disableHorizScrollIcon = docById("disableHorizScrollIcon");

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

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderMergeIcon(onclick) {
        const mergeWithCurrentIcon = docById("mergeWithCurrentIcon");

        mergeWithCurrentIcon.onclick = () => {
            onclick();
        };
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderRestoreIcon(onclick) {
        const restoreIcon = docById("restoreIcon");

        restoreIcon.onclick = () => {
            onclick();
        };
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderChooseKeyIcon(onclick) {
        const chooseKeyIcon = docById("chooseKeyIcon");
        docById("chooseKeyDiv").style.display = "none";
        chooseKeyIcon.onclick = () => {
            onclick();
        };
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderJavaScriptIcon(onclick) {
        docById("toggleJavaScriptIcon").onclick = () => onclick();
    }

    /**
     * @param  {Object} languageBox
     */
    renderLanguageSelectIcon(languageBox) {
        console.log(languageBox);
        const languageSelectIcon = docById("languageSelectIcon");
        languageSelectIcon.onclick = () => {
            const enUS = docById("enUS");

            enUS.onclick = () => {
                languageBox.enUS_onclick();
            };

            const enUK = docById("enUK");

            enUK.onclick = () => {
                languageBox.enUK_onclick();
            };

            const es = docById("es");

            es.onclick = () => {
                languageBox.es_onclick();
            };

            const pt = docById("pt");

            pt.onclick = () => {
                languageBox.pt_onclick();
            };

            const ko = docById("ko");

            ko.onclick = () => {
                languageBox.ko_onclick();
            };

            const ja = docById("ja");

            ja.onclick = () => {
                languageBox.ja_onclick();
            };

            const kana = docById("kana");

            kana.onclick = () => {
                languageBox.kana_onclick();
            };

            const zhCN = docById("zhCN");

            zhCN.onclick = () => {
                languageBox.zhCN_onclick();
            };

            const th = docById("th");

            th.onclick = () => {
                languageBox.th_onclick();
            };

            const ayc = docById("ayc");

            ayc.onclick = () => {
                languageBox.ayc_onclick();
            };

            const quz = docById("quz");

            quz.onclick = () => {
                languageBox.quz_onclick();
            };

            const gug = docById("gug");

            gug.onclick = () => {
                languageBox.gug_onclick();
            };

            const hi = docById("hi");

            hi.onclick = () => {
                languageBox.hi_onclick();
            };

            const ibo = docById("ibo");

            ibo.onclick = () => {
                languageBox.ibo_onclick();
            };

            const ar = docById("ar");

            ar.onclick = () => {
                languageBox.ar_onclick();
            };

            const he = docById("he");

            he.onclick = () => {
                languageBox.he_onclick();
            };
        };
    }

    /**
     * @public
     * @param  {Object} jquery
     * @returns {void}
     */
    disableTooltips = (jquery) => {
        console.log(jquery);
        jquery(".tooltipped").tooltip("remove");
        this.tooltipsDisabled = true;
    };

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    closeAuxToolbar = (onclick) => {
        if (auxToolbar.style.display === "block") {
            onclick(false);
            const menuIcon = docById("menu");
            auxToolbar.style.display = "none";
            menuIcon.innerHTML = "menu";
            docById("toggleAuxBtn").className -= "blue darken-1";
        }
    };
}
