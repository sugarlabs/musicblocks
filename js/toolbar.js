// COPYRIGHT (c) 2018,19 Austin George
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
  global _, jQuery, _THIS_IS_MUSIC_BLOCKS_, docById, doSVG, fnBrowserDetect,
  RECORDBUTTON
 */

/* exported Toolbar */

let WRAP = true;
const $j = jQuery.noConflict();
let play_button_debounce_timeout = null;
class Toolbar {
    /**
    * Constructs a new Toolbar instance.
    * 
    * @constructor
    */
    constructor() {
        this.stopIconColorWhenPlaying = window.platformColor.stopIconcolor;
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
    init(activity) {
        this.activity = activity;
        let strings;
        let strings_;
        if (_THIS_IS_MUSIC_BLOCKS_) {
            strings = [
                ["mb-logo", _("About Music Blocks")],
                ["play", _("Play")],
                ["stop", _("Stop")],
                ["record",_("Record")],
                ["Full Screen", _("Full screen")],
                ["FullScreen", _("Full screen")],
                ["Toggle Fullscreen", _("Toggle Fullscreen")],
                ["newFile", _("New project")],
                ["load", _("Load project from file")],
                ["saveButton", _("Save project")],
                ["saveButtonAdvanced", _("Save project as HTML")],
                ["planetIcon", _("Find and share projects")],
                ["planetIconDisabled", _("Offline. Sharing is unavailable")],
                ["toggleAuxBtn", _("Auxiliary menu")],
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
                ["toggleJavaScriptIcon", _("JavaScript Editor")],
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
                ["te", _("తెలుగు"), "innerHTML"],
                ["he", _("עִברִית"), "innerHTML"]
            ];

            // Workaround for FF
            strings_ = [
                _("About Music Blocks"),
                _("Play"),
                _("Stop"),
                _("Record"),
                _("Full Screen"),
                _("Full Screen"),
                _("Toggle Fullscreen"),
                _("New project"),
                _("Load project from file"),
                _("Save project"),
                _("Save project"),
                _("Find and share projects"),
                _("Offline. Sharing is unavailable"),
                _("Auxiliary menu"),
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
                _("JavaScript Editor"),
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
                _("Select language"),
                _("Save project as HTML"),
                _("Save turtle artwork as PNG"),
                _("Save project as HTML"),
                _("Save turtle artwork as SVG"),
                _("Save turtle artwork as PNG"),
                _("Save block artwork as SVG"),
                _("Confirm"),
                _("English (United States)"),
                _("English (United Kingdom)"),
                _("日本語"),
                _("한국인"),
                _("español"),
                _("português"),
                _("にほんご"),
                _("中文"),
                _("ภาษาไทย"),
                _("aymara"),
                _("quechua"),
                _("guarani"),
                _("हिंदी"),
                _("తెలుగు"),
                _("igbo"),
                _("عربى"),
                _("עִברִית")
            ];
        } else {
            strings = [
                ["mb-logo", _("About Turtle Blocks")],
                ["play", _("Play")],
                ["stop", _("Stop")],
                ["record", _("Record")],
                ["Full Screen", _("Full Screen")],
                ["FullScreen", _("Full Screen")],
                ["Toggle Fullscreen", _("Toggle Fullscreen")],
                ["newFile", _("New project")],
                ["load", _("Load project from file")],
                ["saveButton", _("Save project")],
                ["saveButtonAdvanced", _("Save project as HTML")],
                ["planetIcon", _("Find and share projects")],
                ["planetIconDisabled", _("Offline. Sharing is unavailable")],
                ["toggleAuxBtn", _("Auxiliary menu")],
                ["helpIcon", _("Help")],
                ["runSlowlyIcon", _("Run slowly")],
                ["runStepByStepIcon", _("Run step by step")],
                ["displayStatsIcon", _("Display statistics")],
                ["loadPluginIcon", _("Load plugin")],
                ["delPluginIcon", _("Delete plugin")],
                ["enableHorizScrollIcon", _("Enable horizontal scrolling")],
                ["disableHorizScrollIcon", _("Disable horizontal scrolling")],
                ["mergeWithCurrentIcon", _("Merge with current project")],
                ["toggleJavaScriptIcon", _("JavaScript Editor")],
                ["restoreIcon", _("Restore")],
                ["beginnerMode", _("Switch to beginner mode")],
                ["advancedMode", _("Switch to advanced mode")],
                ["languageSelectIcon", _("Select language")],
                ["save-html-beg", _("Save project as HTML"), "innerHTML"],
                ["save-png-beg", _("Save turtle artwork as PNG"), "innerHTML"],
                ["save-html", _("Save project as HTML"), "innerHTML"],
                ["save-svg", _("Save turtle artwork as SVG"), "innerHTML"],
                ["save-png", _("Save turtle artwork as PNG"), "innerHTML"],
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
                ["te", _("తెలుగు"), "innerHTML"],
                ["he", _("עִברִית"), "innerHTML"]
            ];

            // Workaround for FF
            strings_ = [
                _("About Turtle Blocks"),
                _("Play"),
                _("Stop"),
                _("Record"),
                _("Full Screen"),
                _("Full Screen"),
                _("Toggle Fullscreen"),
                _("New project"),
                _("Load project from file"),
                _("Save project"),
                _("Save project as HTML"),
                _("Find and share projects"),
                _("Offline. Sharing is unavailable"),
                _("Auxiliary menu"),
                _("Help"),
                _("Run slowly"),
                _("Run step by step"),
                _("Display statistics"),
                _("Load plugin"),
                _("Delete plugin"),
                _("Enable horizontal scrolling"),
                _("Disable horizontal scrolling"),
                _("Merge with current project"),
                _("JavaScript Editor"),
                _("Restore"),
                _("Switch to beginner mode"),
                _("Switch to advanced mode"),
                _("Select language"),
                _("Save project as HTML"),
                _("Save turtle artwork as PNG"),
                _("Save project as HTML"),
                _("Save turtle artwork as SVG"),
                _("Save turtle artwork as PNG"),
                _("Save block artwork as SVG"),
                _("Confirm"),
                _("English (United States)"),
                _("English (United Kingdom)"),
                _("日本語"),
                _("한국인"),
                _("español"),
                _("português"),
                _("にほんご"),
                _("中文"),
                _("ภาษาไทย"),
                _("aymara"),
                _("quechua"),
                _("guarani"),
                _("हिंदी"),
                _("తెలుగు"),
                _("igbo"),
                _("عربى"),
                _("עִברִית")
            ];
        }

        const beginnerMode = docById("beginnerMode");
        const advancedMode = docById("advancedMode");
        if (this.activity.beginnerMode) { // || mode === "null") {
            advancedMode.style.display = "block";
            beginnerMode.style.display = "none";
        } else {
            advancedMode.style.display = "none";
            beginnerMode.style.display = "display";
        }

        for (let i = 0; i < strings.length; i++) {
            const obj = strings[i];
            const trans = strings_[i];
            const elem = docById(obj[0]);
            if (strings[i].length === 3) {
                if (elem !== undefined && elem !== null) {
                    elem.innerHTML = obj[1];
                }
            } else {
                if (elem !== undefined && elem !== null) {
                    elem.setAttribute("data-tooltip", trans);
                }
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
            onclick(this.activity);
        };
    }

    /**
     * Renders the play icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the play icon.
     * @returns {void}
     */
    renderPlayIcon(onclick) {
        const playIcon = docById("play");
        const stopIcon = docById("stop");

        let isPlayIconRunning = false;

        function handleClick() {
            if (!isPlayIconRunning) {
                playIcon.onclick = null;
                // eslint-disable-next-line no-console
                console.log("Wait for next 2 seconds to play the music");
            } else {
                // eslint-disable-next-line no-use-before-define
                playIcon.onclick = tempClick;
                isPlayIconRunning = false;
            }
        }

        var tempClick = playIcon.onclick = () => {
            const hideMsgs = () => {
                this.activity.hideMsgs();
            };
            isPlayIconRunning = false;
            onclick(this.activity);
            handleClick();
            stopIcon.style.color = this.stopIconColorWhenPlaying;
            isPlayIconRunning = true;
            play_button_debounce_timeout = setTimeout(function() { handleClick(); }, 2000);

            stopIcon.addEventListener("click", function(){
                clearTimeout(play_button_debounce_timeout);
                isPlayIconRunning = true;
                hideMsgs();
                handleClick();
            });
        };
    }

    /**
     * Renders the stop icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the stop icon.
     * @returns {void}
     */
    renderStopIcon(onclick) {
        const stopIcon = docById("stop");
        stopIcon.onclick = () => {
            onclick(this.activity);
            stopIcon.style.color = "white";
        };
    }

    /**
     * Renders the new project icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the new project icon.
     * @returns {void}
     */
    renderNewProjectIcon(onclick) {
        const newProjectIcon = docById("new-project");

        newProjectIcon.onclick = () => {
            onclick(this.activity);
        };
    }

    /**
     * Renders the load icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the load icon.
     * @returns {void}
     */
    renderLoadIcon(onclick) {
        const loadIcon = docById("load");

        loadIcon.onclick = () => {
            onclick(this.activity);
        };
    }

    /**
     * Renders the wrap icon.
     * 
     * @public
     * @returns {void}
     */
    renderWrapIcon() {
        const wrapIcon = docById("wrapTurtle");
        let wrapButtonTooltipData = _("Turtle Wrap Off");

        wrapIcon.setAttribute("data-tooltip", wrapButtonTooltipData);
        $j(".tooltipped").tooltip({
            html: true,
            delay: 100
        });

        wrapIcon.onclick = () => {
            WRAP = !WRAP;
            if (WRAP) {
                wrapButtonTooltipData = _("Turtle Wrap Off");
                this.activity.helpfulWheelItems.forEach(ele => {
                    if (ele.label === "Turtle Wrap Off") {
                        ele.display = true;
                    } else if (ele.label === "Turtle Wrap On") {
                        ele.display = false;
                    }
                });
            } else {
                wrapButtonTooltipData = _("Turtle Wrap On");
                this.activity.helpfulWheelItems.forEach(ele => {
                    if (ele.label === "Turtle Wrap Off") {
                        ele.display = false;
                    } else if (ele.label === "Turtle Wrap On") {
                        ele.display = true;
                    }
                });
            }

            wrapIcon.setAttribute("data-tooltip", wrapButtonTooltipData);
            $j(".tooltipped").tooltip({
                html: true,
                delay: 100
            });
        };
    }

    /**
     * Toggles the turtle wrap functionality.
     * 
     * @public
     * @param  {Object} activity - The activity object containing details of the current activity.
     * @returns {void}
     */
    changeWrap(activity) {
        const wrapIcon = docById("wrapTurtle");
        let wrapButtonTooltipData = "";

        WRAP = !WRAP;
        if (WRAP) {
            wrapButtonTooltipData = _("Turtle Wrap Off");
            activity.helpfulWheelItems.forEach(ele => {
                if (ele.label === "Turtle Wrap Off") {
                    ele.display = true;
                } else if (ele.label === "Turtle Wrap On") {
                    ele.display = false;
                }
            });
        } else {
            wrapButtonTooltipData = _("Turtle Wrap On");
            activity.helpfulWheelItems.forEach(ele => {
                if (ele.label === "Turtle Wrap Off") {
                    ele.display = false;
                } else if (ele.label === "Turtle Wrap On") {
                    ele.display = true;
                }
            });
        }

        wrapIcon.setAttribute("data-tooltip", wrapButtonTooltipData);
        $j(".tooltipped").tooltip({
            html: true,
            delay: 100
        });

        if (docById("helpfulWheelDiv").style.display !== "none") {
            docById("helpfulWheelDiv").style.display = "none";
        }
    }

    /**
     * Renders the save icons based on the provided onclick handlers.
     * 
     * @public
     * @param  {Function} html_onclick - The onclick handler for HTML.
     * @param  {Function} doSVG_onclick - The onclick handler for SVG.
     * @param  {Function} svg_onclick - The onclick handler for SVG.
     * @param  {Function} png_onclick - The onclick handler for PNG.
     * @param  {Function} wave_onclick - The onclick handler for Wave.
     * @param  {Function} ly_onclick - The onclick handler for LY.
     * @param  {Function} abc_onclick - The onclick handler for ABC.
     * @param  {Function} mxml_onclick - The onclick handler for MXML.
     * @param  {Function} blockartworksvg_onclick - The onclick handler for Block Artwork SVG.
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

        if (this.activity.beginnerMode) {
            if (this.language === "ja") {
                saveButton.onclick = () => {
                    html_onclick(this.activity);
                };
            } else {
                saveButton.style.display = "block";
                saveButtonAdvanced.style.display = "none";

                saveButton.onclick = () => {
                    saveHTML = docById("save-html-beg");
                    saveHTML.onclick = () => {
                        html_onclick(this.activity);
                    };

                    savePNG = docById("save-png-beg");
                    svgData = doSVG(
                        this.activity.canvas,
                        this.activity.logo,
                        this.activity.turtles,
                        this.activity.canvas.width,
                        this.activity.canvas.height,
                        1.0
                    );

                    if (svgData == "") {
                        savePNG.disabled = true;
                        savePNG.className = "grey-text inactiveLink";
                    } else {
                        savePNG.disabled = false;
                        savePNG.className = "";
                        savePNG.onclick = () => {
                            png_onclick(this.activity);
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
                    html_onclick(this.activity);
                };

                saveSVG = docById("save-svg");
                savePNG = docById("save-png");
                svgData = doSVG(
                    this.activity.canvas,
                    this.activity.logo,
                    this.activity.turtles,
                    this.activity.canvas.width,
                    this.activity.canvas.height,
                    1.0);

                // If there is no mouse artwork to save then grey out.
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
                        svg_onclick(this.activity);
                    };

                    savePNG.onclick = () => {
                        png_onclick(this.activity);
                    };
                }

                if (_THIS_IS_MUSIC_BLOCKS_) {
                    saveWAV = docById("save-wav");

                    saveWAV.onclick = () => {
                        wave_onclick(this.activity);
                    };

                    saveLY = docById("save-ly");

                    saveLY.onclick = () => {
                        ly_onclick(this.activity);
                    };

                    saveABC = docById("save-abc");

                    saveABC.onclick = () => {
                        abc_onclick(this.activity);
                    };

                    saveMXML = docById("save-mxml");

                    saveMXML.onclick = () => {
                        mxml_onclick(this.activity);
                    };
                }

                const saveArtworkSVG = docById("save-blockartwork-svg");

                saveArtworkSVG.onclick = () => {
                    blockartworksvg_onclick(this.activity);
                };
            };
        }
    }

    /**
     * @public
     * @param  {Object} planet
     * @param  {Function} onclick
     * @returns {void}
     */
    renderPlanetIcon(planet, onclick) {
        const planetIcon = docById("planetIcon");
        const planetIconDisabled = docById("planetIconDisabled");
        if (planet) {
            planetIcon.onclick = () => {
                docById("toolbars").style.display = "none";
                docById("wheelDiv").style.display = "none";
                docById("contextWheelDiv").style.display = "none";
                onclick(this.activity);
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
            var searchBar = docById("search");
            searchBar.classList.toggle("open");
            if (auxToolbar.style.display == "" || auxToolbar.style.display == "none") {
                onclick(this.activity, false);
                auxToolbar.style.display = "block";
                menuIcon.innerHTML = "more_vert";
                docById("toggleAuxBtn").className = "blue darken-1";
            } else {
                onclick(this.activity, true);
                auxToolbar.style.display = "none";
                menuIcon.innerHTML = "menu";
                docById("toggleAuxBtn").className -= "blue darken-1";
                docById("chooseKeyDiv").style.display = "none";
                docById("movable").style.display = "none";
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
        if (this.activity.beginnerMode && this.language === "ja") {
            runSlowlyIcon.style.display = "none";
        }

        runSlowlyIcon.onclick = () => {
            onclick(this.activity);
            docById("stop").style.color = this.stopIconColorWhenPlaying;
        };
    }

    /**
     * Renders the help icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the help icon.
     * @returns {void}
     */
    renderHelpIcon(onclick) {
        const helpIcon = docById("helpIcon");

        helpIcon.onclick = () => {
            onclick(this.activity);
        };
    }

    /**
     * Renders the mode select icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the mode select icon.
     * @returns {void}
     */
    renderModeSelectIcon(onclick) {
        const begIcon = docById("beginnerMode");
        const advIcon = docById("advancedMode");
        if (begIcon.style.display === "none") {
            advIcon.onclick = () => {
                onclick(this.activity);
            };
        } else {
            begIcon.onclick = () => {
                onclick(this.activity);
            };
        }
    }

    /**
     * Renders the run step-by-step icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the run step-by-step icon.
     * @returns {void}
     */
    renderRunStepIcon(onclick) {
        const runStepByStepIcon = docById("runStepByStepIcon");
        if (this.activity.beginnerMode && this.language === "ja") {
            runStepByStepIcon.style.display = "none";
        }

        runStepByStepIcon.onclick = () => {
            onclick(this.activity);
            docById("stop").style.color = this.stopIconColorWhenPlaying;
        };
    }
    /**
     * Renders the advanced icons with the provided onclick handlers.
     * 
     * @public
     * @param  {Function} rec_onclick - The onclick handler for the record icon.
     * @param  {Function} analytics_onclick - The onclick handler for the analytics icon.
     * @param  {Function} openPlugin_onclick - The onclick handler for the open plugin icon.
     * @param  {Function} delPlugin_onclick - The onclick handler for the delete plugin icon.
     * @param  {Function} setScroller - The function to set the scroller.
     * @returns {void}
     */
    renderAdvancedIcons(
        rec_onclick,
        analytics_onclick,
        openPlugin_onclick,
        delPlugin_onclick,
        setScroller
    ) {
        const RecIcon = docById("record");
        const displayStatsIcon = docById("displayStatsIcon");
        const loadPluginIcon = docById("loadPluginIcon");
        const delPluginIcon = docById("delPluginIcon");
        const enableHorizScrollIcon = docById("enableHorizScrollIcon");
        const disableHorizScrollIcon = docById("disableHorizScrollIcon");
        const toggleJavaScriptIcon = docById("toggleJavaScriptIcon");
        const browser = fnBrowserDetect();
        const btn = document.getElementById("record");
        const hideIn = ["firefox", "safari"];
        if (hideIn.includes(browser)) {
            btn.classList.add("hide");
        }

        if (!this.activity.beginnerMode) {
            RecIcon.innerHTML= `<i class=""material-icons main">${RECORDBUTTON}</i>`;
            RecIcon.onclick = () => {
                rec_onclick(this.activity);
            };

            displayStatsIcon.onclick = () => {
                analytics_onclick(this.activity);
            };

            loadPluginIcon.onclick = () => {
                openPlugin_onclick(this.activity);
            };

            delPluginIcon.onclick = () => {
                delPlugin_onclick(this.activity);
            };

            enableHorizScrollIcon.onclick = () => {
                setScroller(this.activity);
            };

            disableHorizScrollIcon.onclick = () => {
                setScroller(this.activity);
            };
        } else {
            displayStatsIcon.style.display = "none";
            loadPluginIcon.style.display = "none";
            delPluginIcon.style.display = "none";
            enableHorizScrollIcon.style.display = "none";
            toggleJavaScriptIcon.style.display = "none";
        }
    }

    /**
     * Renders the merge icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the merge icon.
     * @returns {void}
     */
    renderMergeIcon(onclick) {
        const mergeWithCurrentIcon = docById("mergeWithCurrentIcon");

        mergeWithCurrentIcon.onclick = () => {
            onclick(this.activity);
        };
    }

    /**
     * Renders the restore icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the restore icon.
     * @returns {void}
     */
    renderRestoreIcon(onclick) {
        const restoreIcon = docById("restoreIcon");

        restoreIcon.onclick = () => {
            onclick(this.activity);
        };
    }

    /**
     * Renders the choose key icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the choose key icon.
     * @returns {void}
     */
    renderChooseKeyIcon(onclick) {
        if (_THIS_IS_MUSIC_BLOCKS_) {
            const chooseKeyIcon = docById("chooseKeyIcon");
            docById("chooseKeyDiv").style.display = "none";
            chooseKeyIcon.onclick = () => {
                onclick(this.activity);
            };
        }
    }

    /**
     * Renders the JavaScript icon with the provided onclick handler.
     * 
     * @public
     * @param {Function} onclick - The onclick handler for the JavaScript icon.
     * @returns {void}
     */
    renderJavaScriptIcon(onclick) {
        docById("toggleJavaScriptIcon").onclick = () => onclick(this.activity);
    }

    /**
     * Renders the language select icon with the provided languageBox object.
     * 
     * @public
     * @param  {Object} languageBox - The languageBox object containing language options.
     * @returns {void}
     */
    renderLanguageSelectIcon(languageBox) {
        const languageSelectIcon = docById("languageSelectIcon");
        const languages = [
            "enUS", "enUK", "es", "pt", "ko", "ja", "kana", "zhCN", "th",
            "ayc", "quz", "gug", "hi", "ibo", "ar", "te", "he"
        ];
    
        languageSelectIcon.onclick = () => {
            languages.forEach(lang => {
                docById(lang).onclick = () => languageBox[`${lang}_onclick`](this.activity);
            });
        };
    }

    /**
     * @public
     * @param  {Object} jquery
     * @returns {void}
     */
    disableTooltips = (jquery) => {
        jquery(".tooltipped").tooltip("remove");
        this.tooltipsDisabled = true;
    };

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    closeAuxToolbar = (onclick) => {
        const auxToolbar = docById("aux-toolbar");
        if (auxToolbar.style.display === "block") {
            onclick(this.activity, false);
            const menuIcon = docById("menu");
            auxToolbar.style.display = "none";
            menuIcon.innerHTML = "menu";
            docById("toggleAuxBtn").className -= "blue darken-1";
        }
    };
}
