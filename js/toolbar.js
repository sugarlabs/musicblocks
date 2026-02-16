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
const $j = window.jQuery;
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
                ["record", _("Record")],
                ["Full screen", _("Full screen")],
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
                ["themeSelectIcon", _("Change theme")],
                ["light", _("Light Mode")],
                ["dark", _("Dark Mode")],
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
                ["save-midi", _("Save project as MIDI"), "innerHTML"],
                ["save-svg", _("Save mouse artwork as SVG"), "innerHTML"],
                ["save-png", _("Save mouse artwork as PNG"), "innerHTML"],
                ["save-wav", _("Save music as WAV"), "innerHTML"],
                ["save-abc", _("Save sheet music as ABC"), "innerHTML"],
                ["save-ly", _("Save sheet music as Lilypond"), "innerHTML"],
                ["save-mxml", _("Save sheet music as MusicXML"), "innerHTML"],
                ["save-blockartwork-svg", _("Save block artwork as SVG"), "innerHTML"],
                ["save-blockartwork-png", _("Save block artwork as PNG"), "innerHTML"],
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
                ["tr", _("Turkish"), "innerHTML"],
                ["ayc", _("aymara"), "innerHTML"],
                ["quz", _("quechua"), "innerHTML"],
                ["gug", _("guarani"), "innerHTML"],
                ["hi", _("हिंदी"), "innerHTML"],
                ["ibo", _("igbo"), "innerHTML"],
                ["ar", _("عربى"), "innerHTML"],
                ["te", _("తెలుగు"), "innerHTML"],
                ["bn", _("বাংলা"), "innerHTML"],
                ["he", _("עִברִית"), "innerHTML"],
                ["ur", _("اردو"), "innerHTML"]
            ];

            // Workaround for FF
            strings_ = [
                _("About Music Blocks"),
                _("Play"),
                _("Stop"),
                _("Record"),
                _("Full screen"),
                _("Full screen"),
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
                _("Change theme"),
                _("Light Mode"),
                _("Dark Mode"),
                _("Merge with current project"),
                _("Set Pitch Preview"),
                _("JavaScript Editor"),
                _("Restore"),
                _("Switch to beginner mode"),
                _("Switch to advanced mode"),
                _("Select language"),
                _("Save project as HTML"),
                _("Save project as MIDI"),
                _("Save mouse artwork as SVG"),
                _("Save mouse artwork as PNG"),
                _("Save music as WAV"),
                _("Save sheet music as ABC"),
                _("Save sheet music as Lilypond"),
                _("Save block artwork as SVG"),
                _("Save block artwork as PNG"),
                _("Confirm"),
                _("Select language"),
                _("Save project as HTML"),
                _("Save turtle artwork as PNG"),
                _("Save project as HTML"),
                _("Save turtle artwork as SVG"),
                _("Save turtle artwork as PNG"),
                _("Save block artwork as SVG"),
                _("Save block artwork as PNG"),
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
                _("Turkish"),
                _("aymara"),
                _("quechua"),
                _("guarani"),
                _("हिंदी"),
                _("తెలుగు"),
                _("igbo"),
                _("عربى"),
                _("עִברִית"),
                _("اردو")
            ];
        } else {
            strings = [
                ["mb-logo", _("About Turtle Blocks")],
                ["play", _("Play")],
                ["stop", _("Stop")],
                ["record", _("Record")],
                ["Full screen", _("Full screen")],
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
                ["themeSelectIcon", _("Change theme")],
                ["light", _("Light Mode")],
                ["dark", _("Dark Mode")],
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
                ["save-blockartwork-png", _("Save block artwork as PNG"), "innerHTML"],
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
                ["tr", _("Turkish"), "innerHTML"],
                ["ayc", _("aymara"), "innerHTML"],
                ["quz", _("quechua"), "innerHTML"],
                ["gug", _("guarani"), "innerHTML"],
                ["hi", _("हिंदी"), "innerHTML"],
                ["ibo", _("igbo"), "innerHTML"],
                ["ar", _("عربى"), "innerHTML"],
                ["te", _("తెలుగు"), "innerHTML"],
                ["bn", _("বাংলা"), "innerHTML"],
                ["he", _("עִברִית"), "innerHTML"],
                ["ur", _("اردو"), "innerHTML"]
            ];

            // Workaround for FF
            strings_ = [
                _("About Turtle Blocks"),
                _("Play"),
                _("Stop"),
                _("Record"),
                _("Full screen"),
                _("Full screen"),
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
                _("Change theme"),
                _("Light Mode"),
                _("Dark Mode"),
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
                _("Save block artwork as PNG"),
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
                _("Turkish"),
                _("aymara"),
                _("quechua"),
                _("guarani"),
                _("हिंदी"),
                _("తెలుగు"),
                _("igbo"),
                _("عربى"),
                _("עִברִית"),
                _("اردو")
            ];
        }

        const beginnerMode = docById("beginnerMode");
        const advancedMode = docById("advancedMode");
        if (this.activity.beginnerMode) {
            // || mode === "null") {
            advancedMode.style.display = "block";
            beginnerMode.style.display = "none";
        } else {
            advancedMode.style.display = "none";
            beginnerMode.style.display = "block";
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

        $j(".tooltipped").on("click", function () {
            $j(this).tooltip("close");
        });

        $j(".materialize-iso, .dropdown-trigger").dropdown({
            constrainWidth: false,
            hover: false,
            belowOrigin: true // Displays dropdown below the button
        });

        // Setup keyboard navigation for toolbar
        this.setupKeyboardNavigation();
    }

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    renderLogoIcon(onclick) {
        const logoIcon = docById("mb-logo");
        if (this.language === "ja") {
            logoIcon.innerHTML =
                '<img style="width: 100%; transform: scale(0.85);" src="images/logo-ja.svg">';
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
        const recordButton = docById("record");
        let isPlayIconRunning = false;

        function handleClick() {
            if (!isPlayIconRunning) {
                playIcon.onclick = null;
            } else {
                // eslint-disable-next-line no-use-before-define
                playIcon.onclick = tempClick;
                isPlayIconRunning = false;
            }
        }

        // Named handler to prevent memory leak from duplicate listeners
        const stopClickHandler = () => {
            clearTimeout(play_button_debounce_timeout);
            isPlayIconRunning = true;
            this.activity.hideMsgs();
            handleClick();
        };

        var tempClick = (playIcon.onclick = () => {
            const hideMsgs = () => {
                this.activity.hideMsgs();
            };
            isPlayIconRunning = false;
            onclick(this.activity);
            handleClick();
            stopIcon.style.color = this.stopIconColorWhenPlaying;
            saveButton.disabled = true;
            saveButtonAdvanced.disabled = true;
            saveButton.className = "grey-text inactiveLink";
            saveButtonAdvanced.className = "grey-text inactiveLink";
            recordButton.className = "grey-text inactiveLink";
            isPlayIconRunning = true;
            play_button_debounce_timeout = setTimeout(function () {
                handleClick();
            }, 2000);

            // Remove existing listener before adding to prevent accumulation
            stopIcon.removeEventListener("click", stopClickHandler);
            stopIcon.addEventListener("click", stopClickHandler);
        });
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
        const recordButton = docById("record");
        stopIcon.onclick = () => {
            onclick(this.activity);
            stopIcon.style.color = "white";
            saveButton.disabled = false;
            saveButtonAdvanced.disabled = false;
            saveButton.className = "";
            saveButtonAdvanced.className = "";
            recordButton.className = "";
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
        const modalContainer = docById("modal-container");
        const newDropdown = docById("newdropdown");

        newDropdown.innerHTML = "";
        const title = document.createElement("div");
        title.classList.add("new-project-title");
        title.textContent = _("New project");
        newDropdown.appendChild(title);

        const confirmationMessage = document.createElement("div");
        confirmationMessage.id = "confirmation-message";
        confirmationMessage.textContent = _("Are you sure you want to create a new project?");
        newDropdown.appendChild(confirmationMessage);

        const buttonRowLi = document.createElement("li");
        buttonRowLi.classList.add("button-row");

        const confirmationButton = document.createElement("div");
        confirmationButton.classList.add("confirm-button");
        confirmationButton.id = "new-project";
        confirmationButton.setAttribute("tabindex", "0"); // Make focusable
        confirmationButton.textContent = _("Confirm");

        const cancelButton = document.createElement("div");
        cancelButton.classList.add("cancel-button");
        cancelButton.id = "cancel-project";
        cancelButton.textContent = _("Cancel");

        buttonRowLi.appendChild(confirmationButton);
        buttonRowLi.appendChild(cancelButton);
        newDropdown.appendChild(buttonRowLi);

        modalContainer.style.display = "flex";
        confirmationButton.onclick = () => {
            modalContainer.style.display = "none";
            onclick(this.activity);
        };

        // Add tabindex for accessibility
        cancelButton.setAttribute("tabindex", "0"); // Make focusable

        cancelButton.onclick = () => {
            modalContainer.style.display = "none";
        };
        modalContainer.style.display = "flex";

        // Make modal container focusable
        modalContainer.setAttribute("tabindex", "-1");

        // Setup keyboard navigation for modal
        const modalButtons = [confirmationButton, cancelButton];
        let currentModalFocusIndex = 0;

        // Handle keyboard events for modal
        const modalKeyHandler = e => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    e.stopPropagation();
                    // Move to next button (Cancel)
                    modalButtons[currentModalFocusIndex].classList.remove("modal-btn-focused");
                    currentModalFocusIndex = (currentModalFocusIndex + 1) % modalButtons.length;
                    modalButtons[currentModalFocusIndex].focus();
                    modalButtons[currentModalFocusIndex].classList.add("modal-btn-focused");
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    e.stopPropagation();
                    // Move to previous button (Confirm)
                    modalButtons[currentModalFocusIndex].classList.remove("modal-btn-focused");
                    currentModalFocusIndex =
                        (currentModalFocusIndex - 1 + modalButtons.length) % modalButtons.length;
                    modalButtons[currentModalFocusIndex].focus();
                    modalButtons[currentModalFocusIndex].classList.add("modal-btn-focused");
                    break;
                case "Enter":
                    e.preventDefault();
                    e.stopPropagation();
                    // Trigger click on currently focused button
                    modalButtons[currentModalFocusIndex].click();
                    break;
                case "Escape":
                    e.preventDefault();
                    e.stopPropagation();
                    // Close modal
                    modalContainer.style.display = "none";
                    break;
            }
        };

        // Add event listeners to each button AND the modal container
        modalButtons.forEach(btn => {
            btn.addEventListener("keydown", modalKeyHandler);
            // Track focus changes
            btn.addEventListener("focus", () => {
                const index = modalButtons.indexOf(btn);
                if (index >= 0) {
                    currentModalFocusIndex = index;
                    modalButtons.forEach(b => b.classList.remove("modal-btn-focused"));
                    btn.classList.add("modal-btn-focused");
                }
            });
        });
        modalContainer.addEventListener("keydown", modalKeyHandler);

        // Auto-focus the Confirm button when modal opens
        setTimeout(() => {
            confirmationButton.focus();
            confirmationButton.classList.add("modal-btn-focused");
        }, 150);

        // Clean up listener when modal closes
        const closeModal = () => {
            modalButtons.forEach(btn => {
                btn.removeEventListener("keydown", modalKeyHandler);
                btn.classList.remove("modal-btn-focused");
            });
            modalContainer.removeEventListener("keydown", modalKeyHandler);
        };

        // Update onclick handlers to clean up
        const originalConfirmClick = confirmationButton.onclick;
        confirmationButton.onclick = () => {
            closeModal();
            originalConfirmClick();
        };

        const originalCancelClick = cancelButton.onclick;
        cancelButton.onclick = () => {
            closeModal();
            originalCancelClick();
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

    renderThemeSelectIcon(themeBox, themes) {
        const icon = document.getElementById("themeSelectIcon");
        themes.forEach(theme => {
            if (localStorage.themePreference === theme) {
                icon.innerHTML = document.getElementById(theme).innerHTML;
            }
        });
        const themeSelectIcon = docById("themeSelectIcon");
        const themeList = themes;
        themeSelectIcon.onclick = () => {
            themeList.forEach(theme => {
                docById(theme).onclick = () => themeBox[`${theme}_onclick`](this.activity);
            });
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
                this.activity.textMsg(_("Turtle Wrap On"), 3000);
                this.activity.helpfulWheelItems.forEach(ele => {
                    if (ele.label === "Turtle Wrap Off") {
                        ele.display = true;
                    } else if (ele.label === "Turtle Wrap On") {
                        ele.display = false;
                    }
                });
            } else {
                wrapButtonTooltipData = _("Turtle Wrap On");
                this.activity.textMsg(_("Turtle Wrap Off"), 3000);
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
            activity.textMsg(_("Turtle Wrap On"), 3000);
            activity.helpfulWheelItems.forEach(ele => {
                if (ele.label === "Turtle Wrap Off") {
                    ele.display = true;
                } else if (ele.label === "Turtle Wrap On") {
                    ele.display = false;
                }
            });
        } else {
            wrapButtonTooltipData = _("Turtle Wrap On");
            activity.textMsg(_("Turtle Wrap Off"), 3000);
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
     * @param  {Function} midi_onclick - The onclick handler for MIDI.
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
        midi_onclick,
        png_onclick,
        wave_onclick,
        ly_onclick,
        abc_onclick,
        mxml_onclick,
        blockartworksvg_onclick,
        blockartworkpng_onclick
    ) {
        const saveButton = docById("saveButton");
        const saveButtonAdvanced = docById("saveButtonAdvanced");
        if (this.activity.beginnerMode) {
            if (this.language === "ja") {
                saveButton.onclick = () => {
                    html_onclick(this.activity);
                };
            } else {
                saveButton.style.display = "block";
                saveButtonAdvanced.style.display = "none";
                saveButton.onclick = () => {
                    const saveHTML = docById("save-html-beg");
                    console.debug(saveHTML);
                    saveHTML.onclick = () => {
                        html_onclick(this.activity);
                    };

                    const savePNG = docById("save-png-beg");
                    console.debug(savePNG);
                    const svgData = doSVG_onclick(
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
            console.debug("ADVANCED MODE BUTTONS");
            saveButton.style.display = "none";
            saveButtonAdvanced.style.display = "block";
            saveButtonAdvanced.onclick = () => {
                const saveHTML = docById("save-html");
                //console.debug(saveHTML);

                saveHTML.onclick = () => {
                    html_onclick(this.activity);
                };
                const saveSVG = docById("save-svg");
                const savePNG = docById("save-png");
                console.debug(savePNG);
                const svgData = doSVG_onclick(
                    this.activity.canvas,
                    this.activity.logo,
                    this.activity.turtles,
                    this.activity.canvas.width,
                    this.activity.canvas.height,
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
                        svg_onclick(this.activity);
                    };

                    savePNG.onclick = () => {
                        png_onclick(this.activity);
                    };
                }

                if (_THIS_IS_MUSIC_BLOCKS_) {
                    const saveMIDI = docById("save-midi");
                    saveMIDI.onclick = () => {
                        midi_onclick(this.activity);
                    };

                    const saveWAV = docById("save-wav");
                    saveWAV.onclick = () => {
                        wave_onclick(this.activity);
                    };

                    const saveLY = docById("save-ly");
                    saveLY.onclick = () => {
                        ly_onclick(this.activity);
                    };
                    const saveABC = docById("save-abc");
                    saveABC.onclick = () => {
                        abc_onclick(this.activity);
                    };
                    const saveMXML = docById("save-mxml");
                    saveMXML.onclick = () => {
                        mxml_onclick(this.activity);
                    };
                }
                const saveArtworkSVG = docById("save-blockartwork-svg");
                saveArtworkSVG.onclick = () => {
                    blockartworksvg_onclick(this.activity);
                };
                const saveArtworkPNG = docById("save-blockartwork-png");
                saveArtworkPNG.onclick = () => {
                    blockartworkpng_onclick(this.activity);
                };
            };
        }
    }

    /**
     * Renders Record button style
     *
     * @public
     * @param {Function} rec_onclick
     * @returns {void}
     */
    updateRecordButton(rec_onclick) {
        const Record = docById("record");
        const RecordDropdownArrow = docById("recordDropdownArrow");
        const browser = fnBrowserDetect();
        const hideIn = ["firefox", "safari"];

        if (hideIn.includes(browser)) {
            Record.classList.add("hide");
            if (RecordDropdownArrow) RecordDropdownArrow.classList.add("hide");
            return;
        }

        if (!Record) {
            return;
        }

        // Check beginner mode before showing buttons
        if (!this.activity.beginnerMode) {
            Record.classList.remove("hide");
            Record.style.display = "block";
        }
        Record.innerHTML = `<i class="material-icons main">${RECORDBUTTON}</i>`;

        // Remove any existing onclick handler
        Record.onclick = null;

        // Set the onclick handler
        Record.onclick = function () {
            const savedMode = localStorage.getItem("musicBlocksRecordMode") || "screen";
            rec_onclick();
        };

        if (RecordDropdownArrow) {
            // Check beginner mode before showing buttons
            if (!this.activity.beginnerMode) {
                RecordDropdownArrow.classList.remove("hide");
                RecordDropdownArrow.style.display = "block";
            }
            RecordDropdownArrow.innerHTML = `<i class="material-icons main" style="font-size: 28px;">arrow_drop_down</i>`;

            // Toggle arrow on click
            RecordDropdownArrow.addEventListener("click", function () {
                setTimeout(() => {
                    const dropdown = docById("recorddropdown");
                    const arrowIcon = RecordDropdownArrow.querySelector("i");
                    if (
                        dropdown &&
                        dropdown.style.display !== "none" &&
                        dropdown.offsetParent !== null
                    ) {
                        arrowIcon.textContent = "arrow_drop_up";
                    } else {
                        arrowIcon.textContent = "arrow_drop_down";
                    }
                }, 50);
            });

            // Reset arrow when clicking outside (close dropdown)
            document.addEventListener("click", function (e) {
                const dropdown = docById("recorddropdown");
                const arrowIcon = RecordDropdownArrow.querySelector("i");
                if (
                    arrowIcon &&
                    !RecordDropdownArrow.contains(e.target) &&
                    !dropdown.contains(e.target)
                ) {
                    arrowIcon.textContent = "arrow_drop_down";
                }
            });
        }

        // Set up click handlers for dropdown options
        const recordWithMenus = docById("record-with-menus");
        const recordCanvasOnly = docById("record-canvas-only");

        // Function to update highlighting based on current mode
        const updateModeHighlight = () => {
            const currentMode = localStorage.getItem("musicBlocksRecordMode") || "screen";

            // Remove highlight from both
            if (recordWithMenus) {
                recordWithMenus.style.backgroundColor = "";
                recordWithMenus.style.fontWeight = "";
            }
            if (recordCanvasOnly) {
                recordCanvasOnly.style.backgroundColor = "";
                recordCanvasOnly.style.fontWeight = "";
            }

            // Add highlight to current mode
            if (currentMode === "screen" && recordWithMenus) {
                recordWithMenus.style.backgroundColor = "#e3f2fd";
                recordWithMenus.style.fontWeight = "bold";
            } else if (currentMode === "canvas" && recordCanvasOnly) {
                recordCanvasOnly.style.backgroundColor = "#e3f2fd";
                recordCanvasOnly.style.fontWeight = "bold";
            }
        };

        // Initialize highlighting on page load
        updateModeHighlight();

        if (recordWithMenus) {
            recordWithMenus.onclick = e => {
                e.preventDefault();
                localStorage.setItem("musicBlocksRecordMode", "screen");
                updateModeHighlight();
                // Reset arrow after selection
                const arrowIcon = RecordDropdownArrow.querySelector("i");
                if (arrowIcon) arrowIcon.textContent = "arrow_drop_down";
            };
        }

        if (recordCanvasOnly) {
            recordCanvasOnly.onclick = e => {
                e.preventDefault();
                localStorage.setItem("musicBlocksRecordMode", "canvas");
                updateModeHighlight();

                // Reset arrow after selection
                const arrowIcon = RecordDropdownArrow.querySelector("i");
                if (arrowIcon) arrowIcon.textContent = "arrow_drop_down";
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
            const searchBar = docById("search");
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
     * Renders the mode changes with the provided onclick handler.
     *
     * @public
     * @param  {Function} rec_onclick - The onclick handler for the record icon.
     * @param  {Function} analytics_onclick - The onclick handler for the analytics icon.
     * @param  {Function} openPlugin_onclick - The onclick handler for the open plugin icon.
     * @param  {Function} delPlugin_onclick - The onclick handler for the delete plugin icon.
     * @param  {Function} setScroller - The function to set the scroller.
     * @returns {void}
     */
    renderModeSelectIcon(
        onclick,
        rec_onclick,
        analytics_onclick,
        openPlugin_onclick,
        delPlugin_onclick,
        setScroller
    ) {
        const begIcon = docById("beginnerMode");
        const advIcon = docById("advancedMode");

        // Update UI based on current mode
        const updateUIForMode = () => {
            begIcon.style.display = this.activity.beginnerMode ? "none" : "block";
            advIcon.style.display = this.activity.beginnerMode ? "block" : "none";

            // Update record button
            const recordButton = docById("record");
            const recordDropdownArrow = docById("recordDropdownArrow");
            const recordDropdown = docById("recorddropdown");
            if (recordButton) {
                if (!this.activity.beginnerMode) {
                    recordButton.style.display = "block";
                    if (recordButton.classList) recordButton.classList.remove("hide");
                    if (recordDropdownArrow) {
                        recordDropdownArrow.style.display = "block";
                        if (recordDropdownArrow.classList)
                            recordDropdownArrow.classList.remove("hide");
                    }
                    if (recordDropdown) {
                        if (recordDropdown.classList) recordDropdown.classList.remove("hide");
                        // Let Materialize handle the display, don't force it
                    }
                    this.updateRecordButton(rec_onclick);
                } else {
                    recordButton.style.display = "none";
                    if (recordButton.classList) recordButton.classList.add("hide");
                    if (recordDropdownArrow) {
                        recordDropdownArrow.style.display = "none";
                        if (recordDropdownArrow.classList)
                            recordDropdownArrow.classList.add("hide");
                    }
                    if (recordDropdown) {
                        recordDropdown.style.display = "none";
                        if (recordDropdown.classList) recordDropdown.classList.add("hide");
                    }
                }
            }

            if (!this.activity.beginnerMode) {
                // Display Stats
                const displayStatsIcon = docById("displayStatsIcon");
                if (displayStatsIcon) {
                    displayStatsIcon.style.display = "block";
                    displayStatsIcon.onclick = () => analytics_onclick(this.activity);
                }

                // Load Plugin
                const loadPluginIcon = docById("loadPluginIcon");
                if (loadPluginIcon) {
                    loadPluginIcon.style.display = "block";
                    loadPluginIcon.onclick = () => openPlugin_onclick(this.activity);
                }

                // Delete Plugin
                const delPluginIcon = docById("delPluginIcon");
                if (delPluginIcon) {
                    delPluginIcon.style.display = "block";
                    delPluginIcon.onclick = () => delPlugin_onclick(this.activity);
                }

                // Horizontal Scroll
                const enableHorizScrollIcon = docById("enableHorizScrollIcon");
                const disableHorizScrollIcon = docById("disableHorizScrollIcon");

                if (enableHorizScrollIcon) {
                    enableHorizScrollIcon.style.display = "block";
                    enableHorizScrollIcon.onclick = () => {
                        setScroller(this.activity);
                    };
                }

                if (disableHorizScrollIcon) {
                    disableHorizScrollIcon.onclick = () => {
                        setScroller(this.activity);
                    };
                }

                // JavaScript Toggle
                const toggleJavaScriptIcon = docById("toggleJavaScriptIcon");
                if (toggleJavaScriptIcon) {
                    toggleJavaScriptIcon.style.display = "block";
                }

                // Update helpful wheel items visibility for advanced mode
                if (this.activity.helpfulWheelItems) {
                    this.activity.helpfulWheelItems.forEach(item => {
                        if (item.label === "Enable horizontal scrolling") {
                            item.display = true;
                        }
                    });
                }
            } else {
                // Hide all advanced icons in beginner mode
                const advancedIcons = [
                    "displayStatsIcon",
                    "loadPluginIcon",
                    "delPluginIcon",
                    "enableHorizScrollIcon",
                    "disableHorizScrollIcon",
                    "toggleJavaScriptIcon"
                ];

                advancedIcons.forEach(iconId => {
                    const icon = docById(iconId);
                    if (icon) {
                        icon.style.display = "none";
                    }
                });

                // Update helpful wheel items visibility for beginner mode
                if (this.activity.helpfulWheelItems) {
                    this.activity.helpfulWheelItems.forEach(item => {
                        if (item.label === "Enable horizontal scrolling") {
                            item.display = false;
                        }
                    });
                }
            }

            // Update save buttons
            const saveButton = docById("saveButton");
            const saveButtonAdvanced = docById("saveButtonAdvanced");
            if (saveButton)
                saveButton.style.display = this.activity.beginnerMode ? "block" : "none";
            if (saveButtonAdvanced)
                saveButtonAdvanced.style.display = this.activity.beginnerMode ? "none" : "block";
            this.activity.toolbar.renderSaveIcons(
                this.activity.save.saveHTML.bind(this.activity.save),
                doSVG,
                this.activity.save.saveSVG.bind(this.activity.save),
                this.activity.save.saveMIDI.bind(this.activity.save),
                this.activity.save.savePNG.bind(this.activity.save),
                this.activity.save.saveWAV.bind(this.activity.save),
                this.activity.save.saveLilypond.bind(this.activity.save),
                this.activity.save.saveAbc.bind(this.activity.save),
                this.activity.save.saveMxml.bind(this.activity.save),
                this.activity.save.saveBlockArtwork.bind(this.activity.save),
                this.activity.save.saveBlockArtworkPNG.bind(this.activity.save)
            );
        };

        // Handle mode switching
        const handleModeSwitch = event => {
            this.activity.beginnerMode = !this.activity.beginnerMode;

            try {
                localStorage.setItem("beginnerMode", this.activity.beginnerMode.toString());
            } catch (e) {
                console.error(e);
            }

            // Disable horizontal scrolling when switching to beginner mode
            if (this.activity.beginnerMode && this.activity.scrollBlockContainer) {
                setScroller(this.activity);
            }

            updateUIForMode();

            // Reinitialize tooltips after mode switch
            if (!this.tooltipsDisabled) {
                $j(".tooltipped").tooltip({
                    html: true,
                    delay: 100
                });
            }

            // Reinitialize dropdowns
            $j(".materialize-iso, .dropdown-trigger").dropdown({
                constrainWidth: false,
                hover: false,
                belowOrigin: true
            });

            if (onclick) {
                onclick(this.activity);
            }

            if (this.activity.palettes?.updatePalettes) {
                this.activity.palettes.updatePalettes();
            }

            if (this.activity.refreshCanvas) {
                this.activity.refreshCanvas();
            }
        };

        begIcon.onclick = null;
        advIcon.onclick = null;

        begIcon.onclick = handleModeSwitch;
        advIcon.onclick = handleModeSwitch;

        updateUIForMode();
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
        };
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
            "enUS",
            "enUK",
            "es",
            "pt",
            "ko",
            "ja",
            "kana",
            "zhCN",
            "th",
            "tr",
            "ayc",
            "quz",
            "gug",
            "hi",
            "ibo",
            "ar",
            "te",
            "bn",
            "he",
            "ur"
        ];

        /**
         * Updates the selected-language class to highlight the currently selected language.
         * @param {string} selectedLang - The language code to highlight.
         */
        const updateSelectedLanguageHighlight = selectedLang => {
            // Remove existing selection from all language items
            languages.forEach(lang => {
                const langElem = docById(lang);
                if (langElem) {
                    langElem.classList.remove("selected-language");
                }
            });

            // Handle special cases for language preference storage values and browser language codes
            let langToHighlight = selectedLang;

            // Map browser language codes to dropdown IDs
            const browserLangMap = {
                "en-US": "enUS",
                "en-GB": "enUK",
                "en-UK": "enUK",
                "zh-CN": "zhCN",
                "zh": "zhCN"
            };

            // Check if it's a browser language code that needs mapping
            if (selectedLang && browserLangMap[selectedLang]) {
                langToHighlight = browserLangMap[selectedLang];
            }

            // Handle Japanese variants (ja-kanji, ja-kana stored vs ja/kana displayed)
            if (selectedLang && selectedLang.startsWith("ja")) {
                if (selectedLang === "ja-kana" || localStorage.kanaPreference === "kana") {
                    langToHighlight = "kana";
                } else {
                    langToHighlight = "ja";
                }
            }

            // Handle zh_CN to zhCN mapping (stored preference format)
            if (selectedLang === "zh_CN") {
                langToHighlight = "zhCN";
            }

            // Fallback: if language starts with "en" but not mapped, default to enUS
            if (
                selectedLang &&
                selectedLang.startsWith("en") &&
                !languages.includes(langToHighlight)
            ) {
                langToHighlight = "enUS";
            }

            const selectedElem = docById(langToHighlight);
            if (selectedElem) {
                selectedElem.classList.add("selected-language");
            }
        };

        languageSelectIcon.onclick = () => {
            // Get current language preference
            const currentLang = localStorage.languagePreference || navigator.language;

            // Highlight the currently selected language
            updateSelectedLanguageHighlight(currentLang);

            // Set up click handlers for each language
            languages.forEach(lang => {
                docById(lang).onclick = () => {
                    // Update highlight to newly selected language
                    updateSelectedLanguageHighlight(lang);

                    // Call the original language change handler
                    languageBox[`${lang}_onclick`](this.activity);
                };
            });
        };
    }

    /**
     * @public
     * @param  {Object} jquery
     * @returns {void}
     */
    disableTooltips = jquery => {
        jquery(".tooltipped").tooltip("remove");
        this.tooltipsDisabled = true;
    };

    /**
     * @public
     * @param {Function} onclick
     * @returns {void}
     */
    /**
     * Sets up keyboard navigation for the toolbar.
     * Allows users to navigate toolbar buttons using arrow keys (left/right),
     * activate buttons with Enter, and provides visual feedback for focused buttons.
     *
     * @public
     * @returns {void}
     */
    setupKeyboardNavigation() {
        const toolbars = docById("toolbars");
        if (!toolbars) return;

        toolbars.setAttribute("tabindex", "0");

        // STATE MANAGEMENT
        let currentFocusIndex = -1;
        let buttons = { mainButtons: [], auxButtons: [], allButtons: [] };

        // BUTTON SELECTION
        /**
         * Gets all navigable buttons from both main and auxiliary toolbars
         * @returns {{mainButtons: HTMLElement[], auxButtons: HTMLElement[], allButtons: HTMLElement[]}}
         */
        const getNavigableButtons = () => {
            // Main toolbar button selectors
            const mainSelectors =
                "#play, #stop, #record, #FullScreen, #newFile, #load, " +
                "#saveButton, #saveButtonAdvanced, #planetIcon, #toggleAuxBtn, #helpIcon";

            // Aux toolbar button selectors
            const auxSelectors =
                "#runSlowlyIcon, #runStepByStepIcon, #displayStatsIcon, " +
                "#loadPluginIcon, #delPluginIcon, #enableHorizScrollIcon, " +
                "#disableHorizScrollIcon, #themeSelectIcon, #mergeWithCurrentIcon, " +
                "#wrapTurtle, #chooseKeyIcon, #toggleJavaScriptIcon, #restoreIcon, " +
                "#beginnerMode, #advancedMode, #languageSelectIcon";

            const isVisible = btn => {
                const style = window.getComputedStyle(btn);
                return style.display !== "none" && style.visibility !== "hidden";
            };

            const mainButtons = Array.from(toolbars.querySelectorAll(mainSelectors)).filter(
                isVisible
            );

            let auxButtons = [];
            const auxToolbar = docById("aux-toolbar");
            if (auxToolbar && auxToolbar.style.display !== "none") {
                auxButtons = Array.from(auxToolbar.querySelectorAll(auxSelectors)).filter(
                    isVisible
                );
            }

            return { mainButtons, auxButtons, allButtons: [...mainButtons, ...auxButtons] };
        };

        /**
         * Updates the buttons list and attaches click handlers for mouse support
         */
        const updateButtonsList = () => {
            buttons = getNavigableButtons();

            // Add click handlers for mouse support - clicking a button sets keyboard focus
            buttons.allButtons.forEach((btn, index) => {
                // Avoid adding duplicate listeners
                if (!btn.hasAttribute("data-kb-nav-listener")) {
                    btn.setAttribute("data-kb-nav-listener", "true");
                    btn.addEventListener("click", () => {
                        // Check if this is a mode toggle button
                        const isModeToggle = btn.id === "beginnerMode" || btn.id === "advancedMode";

                        if (isModeToggle) {
                            // After mode switch, refocus on the new mode button
                            setTimeout(() => {
                                updateButtonsList();
                                // Find the new mode button (it will be the opposite one)
                                const newModeBtn =
                                    docById("beginnerMode") || docById("advancedMode");
                                if (newModeBtn) {
                                    const newIndex = buttons.allButtons.indexOf(newModeBtn);
                                    if (newIndex >= 0) {
                                        setFocus(newIndex);
                                    }
                                }
                            }, 100);
                        } else {
                            currentFocusIndex = buttons.allButtons.indexOf(btn);
                            clearFocus();
                            setFocus(currentFocusIndex);
                        }
                    });
                }
            });

            // Clamp currentFocusIndex to valid range
            if (currentFocusIndex >= buttons.allButtons.length) {
                currentFocusIndex = buttons.allButtons.length - 1;
            }
        };

        // FOCUS MANAGEMENT
        /**
         * Removes focus class from all buttons
         */
        const clearFocus = () => {
            buttons.allButtons.forEach(btn => btn.classList.remove("toolbar-btn-focused"));
        };

        /**
         * Sets focus on a specific button by index
         * @param {number} index - The index in allButtons array
         */
        const setFocus = index => {
            clearFocus();
            if (index >= 0 && index < buttons.allButtons.length) {
                currentFocusIndex = index;
                const targetButton = buttons.allButtons[currentFocusIndex];
                targetButton.classList.add("toolbar-btn-focused");
                // Also set actual DOM focus
                targetButton.focus();
            }
        };

        //  NAVIGATION HELPERS
        /**
         * Closes all open dropdown menus
         */
        const closeAllDropdowns = () => {
            // Find all open Materialize dropdowns and close them
            const openDropdowns = document.querySelectorAll(".dropdown-content");
            openDropdowns.forEach(dropdown => {
                // Materialize dropdowns use 'display: block' when open
                if (dropdown.style.display === "block") {
                    dropdown.style.display = "none";
                    dropdown.classList.remove("active");
                }
            });
        };

        /**
         * Navigates horizontally within the current toolbar (main or aux)
         * @param {number} direction - 1 for right, -1 for left
         */
        const navigateHorizontal = direction => {
            // Close any open dropdowns when navigating
            closeAllDropdowns();

            if (currentFocusIndex < 0) {
                setFocus(direction > 0 ? 0 : buttons.allButtons.length - 1);
                return;
            }

            const isOnMainToolbar = currentFocusIndex < buttons.mainButtons.length;

            if (isOnMainToolbar) {
                // Loop within main toolbar only
                const newIndex =
                    (currentFocusIndex + direction + buttons.mainButtons.length) %
                    buttons.mainButtons.length;
                setFocus(newIndex);
            } else {
                // Loop within aux toolbar only
                const auxIndex = currentFocusIndex - buttons.mainButtons.length;
                const newAuxIndex =
                    (auxIndex + direction + buttons.auxButtons.length) % buttons.auxButtons.length;
                setFocus(buttons.mainButtons.length + newAuxIndex);
            }
        };

        /**
         * Finds the button with the closest horizontal position (spatial mapping)
         * @param {HTMLElement[]} targetButtons - Array of buttons to search
         * @param {HTMLElement} currentButton - Current focused button
         * @returns {number} Index in targetButtons array
         */
        const findNearestButtonHorizontally = (targetButtons, currentButton) => {
            const currentRect = currentButton.getBoundingClientRect();
            const currentCenter = currentRect.left + currentRect.width / 2;

            let closestIndex = 0;
            let closestDistance = Infinity;

            targetButtons.forEach((btn, idx) => {
                const btnRect = btn.getBoundingClientRect();
                const btnCenter = btnRect.left + btnRect.width / 2;
                const distance = Math.abs(btnCenter - currentCenter);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = idx;
                }
            });

            return closestIndex;
        };

        /**
         * Navigates vertically between main and aux toolbars
         * @param {boolean} goingDown - true for down (main→aux), false for up (aux→main)
         */
        const navigateVertical = goingDown => {
            // Close any open dropdowns when navigating
            closeAllDropdowns();

            if (goingDown) {
                // From main toolbar to aux toolbar
                const isOnMainToolbar = currentFocusIndex < buttons.mainButtons.length;
                if (isOnMainToolbar && buttons.auxButtons.length > 0) {
                    const currentButton = buttons.allButtons[currentFocusIndex];
                    const nearestAuxIndex = findNearestButtonHorizontally(
                        buttons.auxButtons,
                        currentButton
                    );
                    setFocus(buttons.mainButtons.length + nearestAuxIndex);
                }
            } else {
                // From aux toolbar to main toolbar
                const isOnAuxToolbar = currentFocusIndex >= buttons.mainButtons.length;
                if (isOnAuxToolbar) {
                    const currentButton = buttons.allButtons[currentFocusIndex];
                    const nearestMainIndex = findNearestButtonHorizontally(
                        buttons.mainButtons,
                        currentButton
                    );
                    setFocus(nearestMainIndex);
                }
            }
        };

        /**
         * Activates the currently focused button and handles special cases
         */
        const activateFocusedButton = event => {
            if (currentFocusIndex < 0 || currentFocusIndex >= buttons.allButtons.length) return;

            const button = buttons.allButtons[currentFocusIndex];
            const toggleAuxBtn = docById("toggleAuxBtn");
            const isTogglingAux = button === toggleAuxBtn;

            // Check if button is a Materialize dropdown trigger or has a target
            const dropdownId = button.getAttribute("data-activates");
            // If it has a target ID, we treat it as a dropdown even if class is missing (defensive)
            const isValidDropdown = !!dropdownId;

            // Check if this is a mode toggle button
            const isModeToggle = button.id === "beginnerMode" || button.id === "advancedMode";

            if (isValidDropdown) {
                // For Materialize dropdowns, manually trigger the dropdown
                if (dropdownId) {
                    // Defensive: If class is missing, add it and re-init (Materialize depends on this class)
                    if (!button.classList.contains("dropdown-trigger")) {
                        button.classList.add("dropdown-trigger");
                        if (typeof $j !== "undefined") {
                            // Use the same options as the original initialization
                            $j(button).dropdown({
                                constrainWidth: false,
                                hover: false,
                                belowOrigin: true
                            });
                        }
                    }

                    // Trigger click to open dropdown using jQuery to ensure Materialize listeners capture it
                    if (typeof $j !== "undefined") {
                        $j(button).trigger("click");
                    } else {
                        button.click();
                    }

                    // After dropdown opens, focus first menu item
                    setTimeout(() => {
                        const dropdownMenu = docById(dropdownId);
                        if (dropdownMenu) {
                            const menuItems = Array.from(dropdownMenu.querySelectorAll("li a"));
                            if (menuItems.length > 0) {
                                // Enable keyboard navigation in dropdown
                                enableDropdownNavigation(dropdownMenu, menuItems);
                                // Focus first item
                                menuItems[0].focus();
                                menuItems[0].classList.add("dropdown-item-focused");
                            }
                        }
                    }, 50);
                }
            } else if (isModeToggle) {
                // Special handling for mode toggle - activate and refocus on star
                button.click();
                setTimeout(() => {
                    updateButtonsList();
                    // Find the new mode button (whichever is visible)
                    const newModeBtn = docById("beginnerMode") || docById("advancedMode");
                    if (newModeBtn) {
                        const newIndex = buttons.allButtons.indexOf(newModeBtn);
                        if (newIndex >= 0) {
                            setFocus(newIndex);
                        }
                    }
                }, 150);
            } else {
                // Trigger onclick handler (supports both direct onclick and child onclick)
                if (button.onclick) {
                    button.onclick.call(button, event);
                } else {
                    const childWithOnclick = button.querySelector('[onclick], [id="menu"]');
                    if (childWithOnclick && childWithOnclick.onclick) {
                        childWithOnclick.onclick.call(childWithOnclick, event);
                    } else {
                        button.click();
                    }
                }
            }

            // Special handling: When opening aux toolbar, auto-focus the star button
            if (isTogglingAux) {
                setTimeout(() => {
                    updateButtonsList();
                    if (buttons.auxButtons.length > 0) {
                        // Find the visible mode button (either beginnerMode or advancedMode)
                        const starBtn = docById("beginnerMode") || docById("advancedMode");
                        if (starBtn) {
                            const starIndex = buttons.allButtons.indexOf(starBtn);
                            if (starIndex >= 0) {
                                setFocus(starIndex);
                            }
                        }
                    }
                }, 100);
            }
        };

        /**
         * Enables keyboard navigation within a dropdown menu
         */
        const enableDropdownNavigation = (dropdownMenu, menuItems) => {
            let currentMenuIndex = 0;

            // Make all menu items focusable
            menuItems.forEach((item, idx) => {
                item.setAttribute("tabindex", "0");
            });

            const clearMenuFocus = () => {
                menuItems.forEach(item => item.classList.remove("dropdown-item-focused"));
            };

            const setMenuFocus = index => {
                clearMenuFocus();
                if (index >= 0 && index < menuItems.length) {
                    currentMenuIndex = index;
                    menuItems[currentMenuIndex].classList.add("dropdown-item-focused");
                    menuItems[currentMenuIndex].focus();
                }
            };

            // Add keydown handler to each menu item (handles focus better)
            const dropdownKeyHandler = e => {
                switch (e.key) {
                    case "ArrowDown":
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuFocus((currentMenuIndex + 1) % menuItems.length);
                        break;
                    case "ArrowUp":
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuFocus((currentMenuIndex - 1 + menuItems.length) % menuItems.length);
                        break;
                    case "Enter":
                        e.preventDefault();
                        e.stopPropagation();
                        if (currentMenuIndex >= 0 && currentMenuIndex < menuItems.length) {
                            menuItems[currentMenuIndex].click();
                        }
                        break;
                    case "Escape":
                        e.preventDefault();
                        e.stopPropagation();
                        // Close dropdown and return focus to toolbar
                        toolbars.focus();
                        break;
                }
            };

            // Add listener to each menu item
            menuItems.forEach((item, idx) => {
                item.addEventListener("keydown", dropdownKeyHandler);
                // Track which item has focus
                item.addEventListener("focus", () => {
                    currentMenuIndex = idx;
                    clearMenuFocus();
                    item.classList.add("dropdown-item-focused");
                });
            });

            // Also add to dropdown menu itself as fallback
            dropdownMenu.addEventListener("keydown", dropdownKeyHandler);

            // Clean up listeners when dropdown closes
            const cleanup = () => {
                menuItems.forEach(item => {
                    item.removeEventListener("keydown", dropdownKeyHandler);
                    item.classList.remove("dropdown-item-focused");
                });
                dropdownMenu.removeEventListener("keydown", dropdownKeyHandler);
            };

            // Watch for dropdown close
            const observer = new MutationObserver(() => {
                if (
                    dropdownMenu.style.display === "none" ||
                    !dropdownMenu.classList.contains("active")
                ) {
                    cleanup();
                    observer.disconnect();
                }
            });

            observer.observe(dropdownMenu, {
                attributes: true,
                attributeFilter: ["style", "class"]
            });
        };

        //  EVENT HANDLERS
        /**
         * Handles keyboard navigation
         */
        toolbars.addEventListener("keydown", event => {
            updateButtonsList();
            if (buttons.allButtons.length === 0) return;

            switch (event.key) {
                case "ArrowRight":
                    event.preventDefault();
                    event.stopPropagation();
                    navigateHorizontal(1);
                    break;

                case "ArrowLeft":
                    event.preventDefault();
                    event.stopPropagation();
                    navigateHorizontal(-1);
                    break;

                case "ArrowDown":
                    event.preventDefault();
                    event.stopPropagation();
                    navigateVertical(true);
                    break;

                case "ArrowUp":
                    event.preventDefault();
                    event.stopPropagation();
                    navigateVertical(false);
                    break;

                case "Enter":
                    event.preventDefault();
                    event.stopPropagation();
                    activateFocusedButton(event);
                    break;

                case "Escape":
                    clearFocus();
                    currentFocusIndex = -1;
                    toolbars.blur();
                    break;
            }
        });

        /**
         * Restores focus when toolbar receives focus (Tab or click)
         */
        toolbars.addEventListener("focus", () => {
            updateButtonsList();
            if (buttons.allButtons.length > 0) {
                // Restore to last focused button if valid
                if (currentFocusIndex >= 0 && currentFocusIndex < buttons.allButtons.length) {
                    setFocus(currentFocusIndex);
                } else if (
                    currentFocusIndex >= buttons.allButtons.length &&
                    buttons.allButtons.length > 0
                ) {
                    // Index out of bounds (e.g., aux closed) - go to last available
                    setFocus(buttons.allButtons.length - 1);
                } else {
                    // First time - start at first button
                    setFocus(0);
                }
            }
        });

        /**
         * Clears visual focus but remembers position when toolbar loses focus
         */
        toolbars.addEventListener("blur", () => {
            clearFocus();
            // Keep currentFocusIndex for memory
        });

        /**
         * Allows clicking on toolbar background to focus it
         */
        toolbars.addEventListener("click", event => {
            if (event.target === toolbars || event.target.closest("nav")) {
                toolbars.focus();
            }
        });

        /**
         * Exits focus mode when clicking outside toolbar
         */
        document.addEventListener("click", event => {
            if (!toolbars.contains(event.target)) {
                clearFocus();
                toolbars.blur(); // Fully exit focus mode
                // Keep currentFocusIndex for memory
            }
        });
    }

    closeAuxToolbar = onclick => {
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

if (typeof module !== "undefined" && module.exports) {
    module.exports = Toolbar;
}
