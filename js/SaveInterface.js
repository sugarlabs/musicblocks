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

class SaveInterface {
    constructor(PlanetInterface) {
        this.PlanetInterface = PlanetInterface;
        this.logo = null;
        this.turtles = null;
        this.storage = null;
        this.planet = null;
        this.printBlockSVG = null;

        this.filename = null;
        this.notationConvert = "";
        this.timeLastSaved = -100;

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
            _("To run this project, open Music Blocks in a web browser and drag and drop this file into the browser window.") +
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
        $j(window).bind("beforeunload", (event) => {
            let saveButton = "#saveButtonAdvanced";
            if (beginnerMode) {
                saveButton = "#saveButton";
            }

            if (this.PlanetInterface.getTimeLastSaved() !== this.timeLastSaved && this.PlanetInterface !== undefined) {
                event.preventDefault();
                event.returnValue = "";
                // Will trigger when exit/reload cancelled.
                $j(saveButton).trigger("mouseenter");
                return "";
            }
        });
    }

    download(extension, dataurl, defaultfilename) {
        let filename = null;
        if (defaultfilename === undefined || defaultfilename === null) {
            if (this.PlanetInterface === undefined) {
                defaultfilename = _("My Project");
            } else {
                defaultfilename = this.PlanetInterface.getCurrentProjectName();
            }

            console.debug(defaultfilename);

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

        console.debug(filename);
        if (filename === null) {
            console.debug("save cancelled");
            return;
        }

        if (fileExt(filename) != extension) {
            filename += "." + extension;
        }

        this.downloadURL(filename, dataurl);
    }

    downloadURL(filename, dataurl) {
        const a = document.createElement("a");
        a.setAttribute("href", dataurl);
        a.setAttribute("download", filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    setVariables(vars) {
        for (let i = 0; i < vars.length; i++) {
            this[vars[i][0]] = vars[i][1];
        }
    }

    //Save Functions - n.b. include filename parameter - can be left blank / undefined
    prepareHTML() {
        let file = this.htmlSaveTemplate;
        let description = _("No description provided");
        if (this.PlanetInterface !== undefined) {
            description = this.PlanetInterface.getCurrentProjectDescription();
        }

        //let author = ''; //currently we're using anonymous for authors - not storing names
        let name = _("My Project");
        if (this.PlanetInterface !== undefined) {
            name = this.PlanetInterface.getCurrentProjectName();
        }

        const data = prepareExport();
        let image = "";
        if (this.PlanetInterface !== undefined) {
            image = this.PlanetInterface.getCurrentProjectImage();
        }

        file = file
            .replace(new RegExp("{{ project_description }}", "g"), description)
            .replace(new RegExp("{{ project_name }}", "g"), name)
            .replace(new RegExp("{{ data }}", "g"), data)
            .replace(new RegExp("{{ project_image }}", "g"), image);
        return file;
    }

    saveHTML(filename) {
        const html = "data:text/plain;charset=utf-8," +
            encodeURIComponent(this.prepareHTML());
        console.debug(filename);
        this.download("html", html, filename);
    }

    saveHTMLNoPrompt() {
        setTimeout(() => {
            const html = "data:text/plain;charset=utf-8," +
                    encodeURIComponent(this.prepareHTML());
            if (this.PlanetInterface !== undefined) {
                this.downloadURL(
                    this.PlanetInterface.getCurrentProjectName() + ".html",
                    html);
            } else {
                this.downloadURL(
                    _("My Project").replace(" ", "_") + ".html",
                    html);
            }
        },500);
    }

    saveSVG(filename) {
        const svg = "data:image/svg+xml;utf8," +
            doSVG(
                this.logo.canvas,
                this.logo,
                this.logo.turtles,
                this.logo.canvas.width,
                this.logo.canvas.height,
                1.0
            );
        this.download("svg", svg, filename);
    }

    savePNG(filename) {
        const png = docById("overlayCanvas").toDataURL("image/png");
        this.download("png", png, filename);
    }

    saveBlockArtwork(filename) {
        const svg = "data:image/svg+xml;utf8," + this.printBlockSVG();
        this.download("svg", svg, filename);
    }

    saveWAV(filename) {
        document.body.style.cursor = "wait";
        this.filename = filename;
        this.logo.recording = true;
        console.debug("DURING SAVE WAV");
        this.logo.synth.setupRecorder();
        this.logo.synth.recorder.start();
        this.logo.runLogoCommands();
        this.logo.textMsg(_("Your recording is in progress."));
    }

    saveAbc(filename) {
        document.body.style.cursor = "wait";
        this.filename = filename;
        console.debug("Saving .abc file");
        //Suppress music and turtle output when generating
        // Abc output.
        this.logo.runningAbc = true;
        this.logo.notationOutput = ABCHEADER;
        this.logo.notationNotes = {};
        for (let t = 0; t < this.turtles.turtleList.length; t++) {
            this.logo.notation.notationStaging[t] = [];
            this.logo.notation.notationDrumStaging[t] = [];
            this.turtles.turtleList[t].painter.doClear(true, true, true);
        }
        this.logo.runLogoCommands();
    }

    afterSaveAbc(filename) {
        const abc = encodeURIComponent(saveAbcOutput(this.logo));
        this.download("abc", "data:text;utf8," + abc, filename);
    }

    saveLilypond(filename) {
        const lyext = "ly";
        if (filename === undefined) {
            if (this.PlanetInterface !== undefined) {
                filename = this.PlanetInterface.getCurrentProjectName();
            } else {
                filename = _("My Project");
            }
        }

        if (fileExt(filename) != lyext) {
            filename += "." + lyext;
        }

        console.debug("Saving .ly file");
        docById("lilypondModal").style.display = "block";
        let projectTitle, projectAuthor, MIDICheck, guitarCheck;

        //.TRANS: File name prompt for save as Lilypond
        docById("fileNameText").textContent = _("File name");
        //.TRANS: Project title prompt for save as Lilypond
        docById("titleText").textContent = _("Project title");
        //.TRANS: Project title prompt for save as Lilypond
        docById("authorText").textContent = _("Project author");
        //.TRANS: MIDI prompt for save as Lilypond
        docById("MIDIText").textContent = _("Include MIDI output?");
        //.TRANS: Guitar prompt for save as Lilypond
        docById("guitarText").textContent = _(
            "Include guitar tablature output?"
        );
        //.TRANS: Lilypond is a scripting language for generating sheet music
        docById("submitLilypond").textContent = _("Save as Lilypond");
        docById("fileName").value = filename;
        if (this.PlanetInterface !== undefined) {
            docById("title").value =
                this.PlanetInterface.getCurrentProjectName();
        } else {
            //.TRANS: default project title when saving as Lilypond
            docById("title").value = _("My Project");
        }

        // Load custom author saved in local storage.
        const customAuthorData = this.storage.getItem("customAuthor");
        if (customAuthorData != undefined) {
            docById("author").value = JSON.parse(customAuthorData);
        } else {
            //.TRANS: default project author when saving as Lilypond
            docById("author").value = _("Mr. Mouse");
        }

        docById("submitLilypond").onclick = () => {
            this.saveLYFile(false);
        };
        // if (this.planet){
        //     docById('submitPDF').onclick = function(){this.saveLYFile(true);}.bind(this);
        //     docById('submitPDF').disabled = false;
        // } else {
        //     docById('submitPDF').disabled = true;
        // }
        docByClass("close")[0].onclick = () => {
            this.logo.runningLilypond = false;
            docById("lilypondModal").style.display = "none";
        };
    }

    saveLYFile(isPDF) {
        if (isPDF === undefined) {
            isPDF = false;
        }
        let filename = docById("fileName").value;
        const projectTitle = docById("title").value;
        const projectAuthor = docById("author").value;

        // Save the author in local storage.
        this.storage.setItem("customAuthor", JSON.stringify(projectAuthor));

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
            MIDIOutput =
                "% MIDI SECTION\n% MIDI Output included! \n\n\\midi {\n   \\tempo 4=90\n}\n\n\n}\n\n";
        } else {
            MIDIOutput =
                "% MIDI SECTION\n% Delete the %{ and %} below to include MIDI output.\n%{\n\\midi {\n   \\tempo 4=90\n}\n%}\n\n}\n\n";
        }

        if (guitarCheck) {
            guitarOutputHead =
                '\n\n% GUITAR TAB SECTION\n% Guitar tablature output included!\n\n      \\new TabStaff = "guitar tab" \n      <<\n         \\clef moderntab\n';
            guitarOutputEnd = "      >>\n\n";
        } else {
            guitarOutputHead =
                '\n\n% GUITAR TAB SECTION\n% Delete the %{ and %} below to include guitar tablature output.\n%{\n      \\new TabStaff = "guitar tab" \n      <<\n         \\clef moderntab\n';
            guitarOutputEnd = "      >>\n%}\n";
        }

        // Suppress music and turtle output when generating
        // Lilypond output.
        this.logo.runningLilypond = true;
        if (isPDF) {
            this.notationConvert = "pdf";
        } else {
            this.notationConvert = "";
        }
        this.logo.notationOutput = lyheader;
        this.logo.notationNotes = {};
        for (let t = 0; t < this.turtles.turtleList.length; t++) {
            this.logo.notation.notationStaging[t] = [];
            this.logo.notation.notationDrumStaging[t] = [];
            this.turtles.turtleList[t].painter.doClear(true, true, true);
        }
        document.body.style.cursor = "wait";
        this.logo.runLogoCommands();

        // Close the dialog box after hitting button.
        docById("lilypondModal").style.display = "none";
    }

    afterSaveLilypond(filename) {
        const ly = saveLilypondOutput(this.logo);
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

    afterSaveLilypondLY(lydata, filename) {
        if (platform.FF) {
            console.debug('execCommand("copy") does not work on FireFox');
        } else {
            const tmp = jQuery("<textarea />").appendTo(document.body);
            tmp.val(lydata);
            tmp.select();
            tmp[0].setSelectionRange(0, lydata.length);
            document.execCommand("copy");
            tmp.remove();
            textMsg(
                _("The Lilypond code is copied to clipboard. You can paste it here: ") +
                "<a href='http://hacklily.org' target='_blank'>http://hacklily.org</a> "
                + "or "
                + "<a href='http://lilybin.com/' target='_blank'>http://lilybin.com</a>.");
        }

        this.download(
            "ly", "data:text;utf8," + encodeURIComponent(lydata), filename);
    }

    afterSaveLilypondPDF(lydata, filename) {
        document.body.style.cursor = "wait";
        window.Converter.ly2pdf(lydata, (success, dataurl) => {
            document.body.style.cursor = "default";
            if (!success) {
                console.debug("Error: " + dataurl);
                //TODO: Error message box
            } else {
                save.download("pdf", dataurl, filename);
            }
        });
    }

    saveMxml(filename) {
        this.logo.runningMxml = true;
        for (let t = 0; t < this.turtles.turtleList.length; t++) {
            this.logo.notation.notationStaging[t] = [];
            this.logo.notation.notationDrumStaging[t] = [];
            this.turtles.turtleList[t].painter.doClear(true, true, true);
        }

        this.logo.runLogoCommands();
        // this.download('musicxml', 'data:text;utf8,'+data);
    }

    afterSaveMxml(filename) {
        let data = saveMxmlOutput(this.logo);
        data = saveMxmlOutput(this.logo);

        console.log("data is:");
        console.log(data);
        this.download(
            "xml", "data:text;utf8," + encodeURIComponent(data), filename);
        this.logo.runningMxml = false;
    }
}
