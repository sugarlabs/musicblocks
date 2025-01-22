// Copyright (c) 2018,19 Euan Ong
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
   globals

   _, TITLESTRING, GUIDEURL, jQuery, docById, docByClass, doSVG,
   fileExt, ABCHEADER, LILYPONDHEADER, platform, saveAbcOutput,
   saveLilypondOutput, saveMxmlOutput
 */

/**
 * Class representing the SaveInterface.
 * @class
 */
class SaveInterface {
    /**
     * Creates an instance of SaveInterface.
     * @constructor
     * @param {*} activity - The main activity object.
     */
    constructor(activity) {
        /**
         * The main activity object.
         * @member {object}
         */
        this.activity = activity;
        /**
         * The file name of the saved project
         * @member {string}
         */
        this.filename = null;
        /**
         * The notation conversion type
         * @member {object}
         */
        this.notationConvert = "";
        /**
         * The timestamp of the last save
         * @member {number}
         */
        this.timeLastSaved = -100;
        
        /**
         * HTML template for saving projects.
         * @member {string}
         * @private
         */
        this.htmlSaveTemplate =
            '<!DOCTYPE html><html lang="en"><head> <meta charset="utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="description" content="{{ project_description }}"> <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0"> <title>{{ project_name }}</title> <meta property="og:site_name" content="Music Blocks"/> <meta property="og:type" content="website"/> <meta property="og:title" content="' +
            _("Music Blocks Project") +
            ' - {{ project_name }}"/> <meta property="og:description" content="{{ project_description }}"/> <style>body{background-color: #dbf0fb;}#main{background-color: white; padding: 5%; position: fixed; width: 80vw; height: max-content; margin: auto; top: 0; left: 0; bottom: 0; right: 0; display: flex; flex-direction: column; justify-content: center; text-align: center; color: #424242; box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23); font-family: "Roboto", "Helvetica","Arial",sans-serif;}h3{font-weight: 400; font-size: 36px; margin-top: 10px;}hr{border-top: 0px solid #ccc; margin: 1em;}.btn{border: solid; border-color: #96D3F3; padding: 5px 10px; line-height: 50px; color: #0a3e58;}.btn:hover{transition: 0.4s; -webkit-transition: 0.3s; -moz-transition: 0.3s; background-color: #96D3F3;}.code{word-break: break-all; height: 15vh; background: #f6f8fa; color: #494949; text-align: justify; margin-right: 10vw; margin-left: 10vw; padding: 16px; overflow: auto; line-height: 1.45; background-color: #f6f8fa; border-radius: 3px; font-family: "SFMono-Regular",Consolas,"Liberation Mono",Menlo,Courier,monospace;}.image{border-radius: 2px 2px 0 0; position: relative; background-color: #96D3F3;}.image-div{margin-bottom: 10px;}.moreinfo-div{margin-top: 20px;}h4{font-weight: 500; font-size: 1.4em; margin-top: 10px; margin-bottom: 10px;}.tbcode{margin-bottom: 10px;}</style></head><body> <div id="main"> <div class="image-div"><img class="image" id="project-image" src="{{ project_image }}"></div><h3 id="title">' +
            _("Music Blocks Project") +
            ' - {{ project_name }}</h3> <p>{{ project_description }}</p><hr> <div> <div style="color: #9E9E9E"><p>' +
            _("This project was created in Music Blocks") +
            ' (<a href="https://musicblocks.sugarlabs.org" target="_blank">https://musicblocks.sugarlabs.org</a>). ' +
            TITLESTRING +
            " " +
            _("Music Blocks is a Free/Libre Software application.") +
            " " +
            _("The source code can be accessed at") +
            ' <a href="https://github.com/sugarlabs/musicblocks" target="_blank">https://github.com/sugarlabs/musicblocks</a>.' +
            " " +
            _("For more information, please consult the") +
            ' <a href="' +
            GUIDEURL +
            '" target="_blank">' +
            _("Music Blocks Guide") +
            "</a>." +
            "</p><p>" +
            _(
                "To run this project, open Music Blocks in a web browser and drag and drop this file into the browser window."
            ) +
            " " +
            _("Alternatively, open the file in Music Blocks using the Load project button.") +
            '</p></div><div class="moreinfo-div"> <div class="tbcode"><h4>' +
            _("Project Code") +
            "</h4>" +
            _("This code stores data about the blocks in a project.") +
            ' <a href="javascript:toggle();" id="showhide">' +
            _("Show") +
            '</a></div> <div class="code">{{ data }}</div></div></div></div><script type="text/javascript">function toggle(){if (document.getElementsByClassName("code")[0].style.display=="none"){document.getElementsByClassName("code")[0].style.display="flex";document.getElementById("showhide").textContent = "' +
            _("Hide") +
            '";} else {document.getElementsByClassName("code")[0].style.display="none";document.getElementById("showhide").textContent = "Show";}} var name=decodeURIComponent(window.location.pathname.split("/").pop().slice(0, -5)); var prefix="' +
            _("Music Blocks Project") +
            ' - "; var title=prefix+name; document.querySelector(' +
            "'" +
            'meta[property="og:title"]' +
            "'" +
            ').content=title; document.title=name; document.getElementById("title").textContent=title; document.getElementsByClassName("code")[0].style.display = "none";</script></body></html>';

        this.timeLastSaved = -100;
        const $j = jQuery.noConflict();
        $j(window).on("beforeunload", (event) => {
            let saveButton = "#saveButtonAdvanced";
            if (this.activity.beginnerMode) {
                saveButton = "#saveButton";
            }

            if (
                typeof this.PlanetInterface !== 'undefined' &&
                this.PlanetInterface.getTimeLastSaved() !== this.timeLastSaved
            ) {
                event.preventDefault();
                // Will trigger when exit/reload cancelled.
                $j(saveButton).trigger("mouseenter");
                return "";
            }
        });
    }

    /**
    * Download a file to the user's computer.
    * @param {string} extension - The file extension (including the dot).
    * @param {string} dataurl - The base64 data url of the file.
    * @param {string} defaultfilename - The default filename to be used.
    * @returns {void}
    */
    download(extension, dataurl, defaultfilename) {
        let filename = null;
        if (defaultfilename === undefined || defaultfilename === null) {
            if (this.activity.PlanetInterface === undefined) {
                defaultfilename = _("My Project");
            } else {
                defaultfilename = this.activity.PlanetInterface.getCurrentProjectName();
            }

            if (fileExt(defaultfilename) != extension) {
                defaultfilename += "." + extension;
            }

            if (window.isElectron == true) {
                filename = defaultfilename;
            } else {
                filename = prompt("Filename:", defaultfilename);
            }
        } else {
            if (fileExt(defaultfilename) != extension) {
                defaultfilename += "." + extension;
            }
            filename = defaultfilename;
        }

        // eslint-disable-next-line no-console
        console.debug("saving to " + filename);
        if (filename === null) {
            // eslint-disable-next-line no-console
            console.debug("save cancelled");
            return;
        }

        if (fileExt(filename) != extension) {
            filename += "." + extension;
        }

        this.downloadURL(filename, dataurl);
    }

    /**
     * Saves the provided data as a file.
     * @param {string} filename - The name of the file to save.
     * @param {string} dataurl - The data to save in the file.
     * @returns {void}
     * @memberof SaveInterface
     */
    downloadURL(filename, dataurl) {
        const a = document.createElement("a");
        a.setAttribute("href", dataurl);
        a.setAttribute("download", filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }


    /**
     * Prepare HTML content for export.
     *
     * This method generates HTML content for export, including project details, description, name,
     * data, and project image. It uses a template and replaces placeholders with actual values.
     *
     * @returns {string} The HTML content prepared for export.
     * @memberof SaveInterface
     * @method
     * @instance
     */
    prepareHTML() {
        let file = this.htmlSaveTemplate;
        let description = _("No description provided");
        if (this.activity.PlanetInterface !== undefined) {
            description = this.activity.PlanetInterface.getCurrentProjectDescription();
        }

        // let author = '';
        // Currently we're using anonymous for authors - not storing names.
        let name = _("My Project");
        if (this.activity.PlanetInterface !== undefined) {
            name = this.activity.PlanetInterface.getCurrentProjectName();
        }

        const data = this.activity.prepareExport();
        let image = "";
        if (this.activity.PlanetInterface !== undefined) {
            image = this.activity.PlanetInterface.getCurrentProjectImage();
        }

        file = file
            .replace(new RegExp("{{ project_description }}", "g"), description)
            .replace(new RegExp("{{ project_name }}", "g"), name)
            .replace(new RegExp("{{ data }}", "g"), data)
            .replace(new RegExp("{{ project_image }}", "g"), image);
        return file;
    }

    /**
     * Save HTML representation of an activity.
     *
     * This method generates and downloads the HTML representation of the provided activity.
     *
     * @param {SaveInterface} activity - The activity object to save.
     * @returns {void}
     * @memberof SaveInterface
     * @method
     * @instance
     */
    saveHTML(activity) {
        const html =
            "data:text/plain;charset=utf-8," + encodeURIComponent(activity.save.prepareHTML());
        activity.save.download("html", html, null);
    }

    /**
     * Save HTML representation of an activity without prompting the user.
     *
     * This method generates and downloads the HTML representation of the provided activity without
     * prompting the user. It uses a setTimeout to delay the execution by 500 milliseconds.
     *
     * @param {SaveInterface} activity - The activity object to save.
     * @returns {void}
     * @memberof SaveInterface
     * @method
     * @instance
     */
    saveHTMLNoPrompt(activity) {
        setTimeout(() => {
            const html =
                "data:text/plain;charset=utf-8," + encodeURIComponent(activity.save.prepareHTML());
            if (activity.PlanetInterface !== undefined) {
                activity.save.downloadURL(
                    activity.PlanetInterface.getCurrentProjectName() + ".html",
                    html
                );
            } else {
                activity.save.downloadURL(_("My Project").replace(" ", "_") + ".html", html);
            }
        }, 500);
    }

    /**
     * This method is to save SVG representation of an activity
     * 
     * @param {SaveInterface} activity -The activity object to save
     * @returns {void}
     * @method
     * @instance
     */
    saveSVG(activity) {
        const svg =
            "data:image/svg+xml;utf8," +
            doSVG(
                activity.canvas,
                activity.logo,
                activity.turtles,
                activity.canvas.width,
                activity.canvas.height,
                1.0
            );
        activity.save.download("svg", svg, null);
    }

    /**
     * This method is to save PNG representation of an activity
     * 
     * @param {SaveInterface} activity -The activity object to save
     * @returns {void}
     * @method
     * @instance
     */
    savePNG(activity) {
        const png = docById("overlayCanvas").toDataURL("image/png");
        activity.save.download("png", png, null);
    }

    /**
     * This method is to save BlockArtwork and download the SVG representation of block artwork from the provided activity.
     * 
     * @param {SaveInterface} activity - The activity object containing block artwork to save.
     * @returns {void}
     * @method
     * @instance
     */   
    saveBlockArtwork(activity) {
        const svg = "data:image/svg+xml;utf8," + activity.printBlockSVG();
        activity.save.download("svg", svg, null);
    }
   
    /**
     * This method is to save BlockArtwork and download the PNG representation of block artwork from the provided activity.
     * 
     * @param {SaveInterface} activity - The activity object containing block artwork to save.
     * @returns {void}
     * @method
     * @instance
     */ 
    saveBlockArtworkPNG(activity) {
        activity.printBlockPNG().then((pngDataUrl) => {
        activity.save.download("png", pngDataUrl, null);
        })
    }

    /**
    * Save audio recording in WAV format.
    *
    * This method initiates the process of recording audio in WAV format within the provided activity.
    *
    * @param {SaveInterface} activity - The activity object for which audio recording is to be saved.
    * @returns {void}
    * @memberof SaveInterface
    * @method
    * @instance
    */
    saveWAV(activity) {
        document.body.style.cursor = "wait";
        activity.logo.recording = true;
        activity.logo.synth.setupRecorder();
        activity.logo.synth.recorder.start();
        activity.logo.runLogoCommands();
        activity.textMsg(_("Your recording is in progress."));
    }

    /**
     * Save ABC notation representation of an activity.
     *
     * This method generates and prepares ABC notation output for the provided activity.
     *
     * @param {SaveInterface} activity - The activity object to save as ABC notation.
     * @returns {void}
     * @memberof SaveInterface
     * @method
     * @instance
     */
    saveAbc(activity) {
        document.body.style.cursor = "wait";
        //Suppress music and turtle output when generating
        // Abc output.
        activity.logo.runningAbc = true;
        activity.logo.notationOutput = ABCHEADER;
        activity.logo.notationNotes = {};
        for (let t = 0; t < activity.turtles.turtleList.length; t++) {
            activity.logo.notation.notationStaging[t] = [];
            activity.logo.notation.notationDrumStaging[t] = [];
            activity.turtles.turtleList[t].painter.doClear(true, true, true);
        }
        activity.logo.runLogoCommands();
    }

    /**
     * Perform actions after saving an ABC notation file.
     *
     * This method handles the post-processing steps after saving ABC notation.
     *
     * @returns {void}
     * @memberof SaveInterface
     * @method
     * @instance
     */
    afterSaveAbc() {
        const abc = encodeURIComponent(saveAbcOutput(this.activity));
        this.activity.save.download("abc", "data:text;utf8," + abc, null);
    }

    /**
     * Save Lilypond representation of an activity.
     *
     * This method initiates the process of saving Lilypond representation of the provided activity.
     *
     * @param {SaveInterface} activity - The activity object to save as Lilypond.
     * @returns {void}
     * @memberof SaveInterface
     * @method
     * @instance
     */
    saveLilypond(activity) {
        const lyext = "ly";
        let filename = _("My Project");
        if (activity.PlanetInterface !== undefined) {
            filename = activity.PlanetInterface.getCurrentProjectName();
        }

        if (fileExt(filename) != lyext) {
            filename += "." + lyext;
        }

        docById("lilypondModal").style.display = "block";

        //.TRANS: File name prompt for save as Lilypond
        docById("fileNameText").textContent = _("File name");
        //.TRANS: Project title prompt for save as Lilypond
        docById("titleText").textContent = _("Project title");
        //.TRANS: Project title prompt for save as Lilypond
        docById("authorText").textContent = _("Project author");
        //.TRANS: MIDI prompt for save as Lilypond
        docById("MIDIText").textContent = _("Include MIDI output?");
        //.TRANS: Guitar prompt for save as Lilypond
        docById("guitarText").textContent = _("Include guitar tablature output?");
        //.TRANS: Lilypond is a scripting language for generating sheet music
        docById("submitLilypond").textContent = _("Save as Lilypond");
        docById("fileName").value = filename;
        if (activity.PlanetInterface !== undefined) {
            docById("title").value = activity.PlanetInterface.getCurrentProjectName();
        } else {
            //.TRANS: default project title when saving as Lilypond
            docById("title").value = _("My Project");
        }

        // Load custom author saved in local storage.
        const customAuthorData = activity.storage.getItem("customAuthor");
        if (customAuthorData != undefined) {
            docById("author").value = JSON.parse(customAuthorData);
        } else {
            //.TRANS: default project author when saving as Lilypond
            docById("author").value = _("Mr. Mouse");
        }

        docById("submitLilypond").onclick = () => {
            activity.save.saveLYFile(false);
        };
        // if (this.planet){
        //     docById('submitPDF').onclick = function(){this.saveLYFile(true);}.bind(this);
        //     docById('submitPDF').disabled = false;
        // } else {
        //     docById('submitPDF').disabled = true;
        // }
        docByClass("close")[0].onclick = () => {
            activity.logo.runningLilypond = false;
            docById("lilypondModal").style.display = "none";
        };
    }
    /**
     * Save Lilypond file with optional PDF conversion.
     *
     * This method handles the saving of Lilypond files with optional PDF conversion based on user preferences.
     *
     * @param {boolean} [isPDF=false] - Flag indicating whether to generate a PDF along with the Lilypond file.
     * @returns {void}
     * @memberof SaveInterface
     * @method
     * @instance
     */
    saveLYFile(isPDF) {
        if (isPDF === undefined) {
            isPDF = false;
        }
        let filename = docById("fileName").value;
        const projectTitle = docById("title").value;
        const projectAuthor = docById("author").value;

        // Save the author in local storage.
        this.activity.storage.setItem("customAuthor", JSON.stringify(projectAuthor));

        const MIDICheck = docById("MIDICheck").checked;
        const guitarCheck = docById("guitarCheck").checked;

        if (filename != null) {
            if (fileExt(filename) !== "ly") {
                filename += ".ly";
            }
        }

        const mapLilypondObj = {
            "My Music Blocks Creation": projectTitle,
            "Mr. Mouse": projectAuthor
        };

        const lyheader = LILYPONDHEADER.replace(
            /My Music Blocks Creation|Mr. Mouse/gi,
            (matched) => mapLilypondObj[matched]
        );

        if (MIDICheck) {
            this.activity.logo.MIDIOutput =
                "% MIDI SECTION\n% MIDI Output included! \n\n\\midi {\n   \\tempo 4=90\n}\n\n\n}\n\n";
        } else {
            this.activity.logo.MIDIOutput =
                "% MIDI SECTION\n% Delete the %{ and %} below to include MIDI output.\n%{\n\\midi {\n   \\tempo 4=90\n}\n%}\n\n}\n\n";
        }

        if (guitarCheck) {
            this.activity.logo.guitarOutputHead =
                '\n\n% GUITAR TAB SECTION\n% Guitar tablature output included!\n\n      \\new TabStaff = "guitar tab" \n      <<\n         \\clef moderntab\n';
            this.activity.logo.guitarOutputEnd = "      >>\n\n";
        } else {
            this.activity.logo.guitarOutputHead =
                '\n\n% GUITAR TAB SECTION\n% Delete the %{ and %} below to include guitar tablature output.\n%{\n      \\new TabStaff = "guitar tab" \n      <<\n         \\clef moderntab\n';
            this.activity.logo.guitarOutputEnd = "      >>\n%}\n";
        }

        // Suppress music and turtle output when generating
        // Lilypond output.
        this.activity.logo.runningLilypond = true;
        if (isPDF) {
            this.notationConvert = "pdf";
        } else {
            this.notationConvert = "";
        }
        this.activity.logo.notationOutput = lyheader;
        this.activity.logo.notationNotes = {};
        for (let t = 0; t < this.activity.turtles.turtleList.length; t++) {
            this.activity.logo.notation.notationStaging[t] = [];
            this.activity.logo.notation.notationDrumStaging[t] = [];
            this.activity.turtles.turtleList[t].painter.doClear(true, true, true);
        }
        document.body.style.cursor = "wait";
        this.activity.logo.runLogoCommands();

        // Close the dialog box after hitting button.
        docById("lilypondModal").style.display = "none";
    }

    /** 
    * Perform actions after saving a Lilypond file.
    *
    * This method handles post-processing steps after saving a Lilypond file, such as handling PDF conversion.
    *
    * @param {string} filename - The name of the Lilypond file.
    * @returns {void}
    * @memberof SaveInterface
    * @method
    * @instance
    */
    afterSaveLilypond(filename) {
        filename = docById("fileName").value;
        const ly = saveLilypondOutput(this.activity);
        switch (this.notationConvert) {
            case "pdf":
                this.afterSaveLilypondPDF(ly, filename);
                break;
            default:
                this.afterSaveLilypondLY(ly, filename);
                break;
        }
        this.notationConvert = "";
    }

    /**
     * Perform actions after saving a Lilypond file in LY format.
     *
     * This method handles post-processing steps specific to saving a Lilypond file in LY format.
     *
     * @param {string} lydata - The Lilypond data.
     * @param {string} filename - The name of the Lilypond file.
     * @returns {void}
     * @memberof SaveInterface
     * @method
     * @instance
     */

    afterSaveLilypondLY(lydata, filename) {
        filename = docById("fileName").value;
        if (platform.FF) {
            // eslint-disable-next-line no-console
            console.debug('execCommand("copy") does not work on FireFox');
        } else {
            const tmp = jQuery("<textarea />").appendTo(document.body);
            tmp.val(lydata);
            tmp.select();
            tmp[0].setSelectionRange(0, lydata.length);
            document.execCommand("copy");
            tmp.remove();
            this.activity.textMsg(
                _("The Lilypond code is copied to clipboard. You can paste it here: ") +
                    "<a href='http://hacklily.org' target='_blank'>http://hacklily.org</a> "
            );
        }
        this.download("ly", "data:text;utf8," + encodeURIComponent(lydata), filename);
    }


    /**
     * Perform actions after saving a Lilypond file in PDF format.
     *
     * This method handles post-processing steps specific to saving a Lilypond file in PDF format.
     *
     * @param {string} lydata - The Lilypond data.
     * @param {string} filename - The name of the Lilypond file.
     * @returns {void}
     * @memberof SaveInterface
     * @method
     * @instance
     */
    afterSaveLilypondPDF(lydata, filename) {
        document.body.style.cursor = "wait";
        window.Converter.ly2pdf(lydata, (success, dataurl) => {
            document.body.style.cursor = "default";
            if (!success) {
                // eslint-disable-next-line no-console
                console.debug("Error: " + dataurl);
                //TODO: Error message box
            } else {
                this.activity.save.download("pdf", dataurl, filename);
            }
        });
    }

    /**
    * 
    * Save MXML file.
    *
    * This method initiates the process of saving an MXML file.
    *
    * @param {string} filename - The name of the MXML file.
    * @returns {void}
    * @memberof SaveInterface
    * @method
    * @instance
    *
    */
    // eslint-disable-next-line no-unused-vars
    saveMxml(filename) {
        this.activity.logo.runningMxml = true;
        for (let t = 0; t < this.activity.turtles.turtleList.length; t++) {
            this.activity.logo.notation.notationStaging[t] = [];
            this.activity.logo.notation.notationDrumStaging[t] = [];
            this.activity.turtles.turtleList[t].painter.doClear(true, true, true);
        }

        this.activity.logo.runLogoCommands();
    }

    /** 
    * Perform actions after saving an MXML file.
    *
    * This method handles post-processing steps after saving an MXML file.
    *
    * @param {string} filename - The name of the MXML file.
    * @returns {void}
    * @memberof SaveInterface
    * @method
    * @instance
    *
    */
    afterSaveMxml(filename) {
        const data = saveMxmlOutput(this.activity.logo);
        this.download("xml", "data:text;utf8," + encodeURIComponent(data), filename);
        this.activity.logo.runningMxml = false;
    }
}
