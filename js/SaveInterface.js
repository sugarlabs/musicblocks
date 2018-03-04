// Copyright (c) 2018 Euan Ong
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function SaveInterface(PlanetInterface) {
    this.PlanetInterface = PlanetInterface;
    this.logo = null;
    this.turtles = null;
    this.storage = null;
    this.printBlockSVG = null;

    this.filename = null;
    this.notationConvert = "";

    this.download = function(extension, dataurl, defaultfilename){
        var filename = null;
        if (defaultfilename===undefined){
            defaultfilename = this.PlanetInterface.getCurrentProjectName();
            if (fileExt(defaultfilename) != extension) {
                defaultfilename += '.'+extension;
            }
            filename = prompt('Filename:', defaultfilename);
        } else {
            if (fileExt(defaultfilename) != extension) {
                defaultfilename += '.'+extension;
            }
            filename = defaultfilename;
        }
        if (fileExt(filename) != extension) {
            filename += '.'+extension;
        }
        this.downloadURL(filename,dataurl);
    }

    this.downloadURL = function(filename, dataurl){
        var a = document.createElement('a');
        a.setAttribute('href', dataurl);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    this.setVariables = function(vars){
        for (var i = 0; i<vars.length; i++){
            this[vars[i][0]]=vars[i][1];
        }
    }

    //Save Functions - n.b. include filename parameter - can be left blank / undefined
    this.saveTB = function(filename){
        var tb = 'data:text/plain;charset=utf-8,' + encodeURIComponent(prepareExport());
        this.download("tb", tb, filename);
    }

    this.saveSVG = function(filename){
        var svg = 'data:image/svg+xml;utf8,' + doSVG(this.logo.canvas, this.logo, this.logo.turtles, this.logo.canvas.width, this.logo.canvas.height, 1.0);
        this.download("svg", svg, filename);
    }

    this.savePNG = function(filename){
        var png = docById('overlayCanvas').toDataURL('image/png');
        this.download("png", png, filename);
    }

    this.saveBlockArtwork = function(filename){
        var svg = 'data:image/svg+xml;utf8,' + this.printBlockSVG();
        this.download("svg", svg, filename);
    }

    this.saveWAV = function(filename){
        document.body.style.cursor = 'wait';
        this.filename = filename;
        this.logo.playbackQueue = {};
        this.logo.playbackTime = 0;
        this.logo.compiling = true;
        this.logo.recording = true;
        this.logo.runLogoCommands();
    }

    this.afterSaveWAV = function(blob){
        //don't reset cursor
        this.download("wav",URL.createObjectURL(blob));
    }

    this.saveAbc = function(filename){
        document.body.style.cursor = 'wait';
        this.filename = filename;
        console.log('Saving .abc file');
        //Suppress music and turtle output when generating
        // Abc output.
        this.logo.runningAbc = true;
        this.logo.notationOutput = ABCHEADER;
        this.logo.notationNotes = {};
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.logo.notationStaging[turtle] = [];
            this.logo.notationDrumStaging[turtle] = [];
            this.turtles.turtleList[turtle].doClear(true, true, true);
        }
        this.logo.runLogoCommands();
    }

    this.afterSaveAbc = function(filename){
        var abc = encodeURIComponent(saveAbcOutput(this.logo));
        this.download("abc", 'data:text;utf8,' + abc, filename);
    }

    this.saveLilypond = function(filename) {
        var lyext = "ly";
        if (filename===undefined){
            filename = this.PlanetInterface.getCurrentProjectName();
        }
        if (fileExt(filename) != lyext) {
            filename += '.'+lyext;
        }
        console.log('Saving .ly file');
        docById('lilypondModal').style.display = 'block';
        var projectTitle, projectAuthor, MIDICheck, guitarCheck;

        //.TRANS: File name prompt for save as Lilypond
        docById('fileNameText').textContent = _('File name');
        //.TRANS: Project title prompt for save as Lilypond
        docById('titleText').textContent = _('Project title');
        //.TRANS: Project title prompt for save as Lilypond
        docById('authorText').textContent = _('Project author');
        //.TRANS: MIDI prompt for save as Lilypond
        docById('MIDIText').textContent = _('Include MIDI output?');
        //.TRANS: Guitar prompt for save as Lilypond
        docById('guitarText').textContent = _('Include guitar tablature output?');
        //.TRANS: Lilypond is a scripting language for generating sheet music
        docById('submitLilypond').textContent = _('Save as Lilypond');
        //.TRANS: PDF --> Portable Document Format - a typeset version of the Lilypond file
        docById('submitPDF').textContent = _('Save as PDF');

        //TRANS: default file name when saving as Lilypond
        docById('fileName').value = filename;
        //TRANS: default project title when saving as Lilypond
        docById('title').value = this.PlanetInterface.getCurrentProjectName();

        // Load custom author saved in local storage.
        var customAuthorData = this.storage.getItem('customAuthor');
        if (customAuthorData != undefined) {
            docById('author').value = JSON.parse(customAuthorData);
        } else {
            //.TRANS: default project author when saving as Lilypond
            docById('author').value = _('Mr. Mouse');
        }

        docById('submitLilypond').onclick = function(){this.saveLYFile(false);}.bind(this);
        if (window.Converter.isConnected()){
            docById('submitPDF').onclick = function(){this.saveLYFile(true);}.bind(this);
            docById('submitPDF').disabled = false;
        } else {
            docById('submitPDF').disabled = true;
        }

        docByClass('close')[0].onclick = function () {
            this.logo.runningLilypond = false;
            docById('lilypondModal').style.display = 'none';
        }
    }

    this.saveLYFile = function(isPDF) {
        if (isPDF===undefined){
            isPDF = false;
        }
        var filename = docById('fileName').value;
        var projectTitle = docById('title').value;
        var projectAuthor = docById('author').value;

        // Save the author in local storage.
        this.storage.setItem('customAuthor', JSON.stringify(projectAuthor));

        var MIDICheck = docById('MIDICheck').checked;
        var guitarCheck = docById('guitarCheck').checked;

        if (filename != null) {
            if (fileExt(filename) !== 'ly') {
                filename += '.ly';
            }
        }

        var mapLilypondObj = {
            'My Music Blocks Creation': projectTitle,
            'Mr. Mouse': projectAuthor
        };

        var lyheader = LILYPONDHEADER.replace(/My Music Blocks Creation|Mr. Mouse/gi, function(matched){
            return mapLilypondObj[matched];
        });

        if (MIDICheck) {
            MIDIOutput = '% MIDI SECTION\n% MIDI Output included! \n\n\\midi {\n   \\tempo 4=90\n}\n\n\n}\n\n';
        } else {
            MIDIOutput = '% MIDI SECTION\n% Delete the %{ and %} below to include MIDI output.\n%{\n\\midi {\n   \\tempo 4=90\n}\n%}\n\n}\n\n';
        }

        if (guitarCheck) {
            guitarOutputHead = '\n\n% GUITAR TAB SECTION\n% Guitar tablature output included!\n\n      \\new TabStaff = "guitar tab" \n      <<\n         \\clef moderntab\n';
            guitarOutputEnd = '      >>\n\n';
        } else {
            guitarOutputHead = '\n\n% GUITAR TAB SECTION\n% Delete the %{ and %} below to include guitar tablature output.\n%{\n      \\new TabStaff = "guitar tab" \n      <<\n         \\clef moderntab\n';
            guitarOutputEnd = '      >>\n%}\n';
        }

        // Suppress music and turtle output when generating
        // Lilypond output.
        this.logo.runningLilypond = true;
        if (isPDF){
            this.notationConvert = "pdf";
        } else {
            this.notationConvert = "";
        }
        this.logo.notationOutput = lyheader;
        this.logo.notationNotes = {};
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.logo.notationStaging[turtle] = [];
            this.logo.notationDrumStaging[turtle] = [];
            this.turtles.turtleList[turtle].doClear(true, true, true);
        }
        document.body.style.cursor = 'wait';
        this.logo.runLogoCommands();

        // Close the dialog box after hitting button.
        docById('lilypondModal').style.display = 'none';
    }

    this.afterSaveLilypond = function(filename){
        var ly = saveLilypondOutput(this.logo);
        switch(this.notationConvert){
            case "pdf":
                this.afterSaveLilypondPDF(ly, filename);
                break;
            default:
                this.afterSaveLilypondLY(ly, filename);
                break;
        }
        this.notationConvert = "";
    }

    this.afterSaveLilypondLY = function(lydata, filename){
        this.download("ly", 'data:text;utf8,' + encodeURIComponent(lydata), filename);
    }

    this.afterSaveLilypondPDF = function(lydata, filename) {
        document.body.style.cursor = 'wait';
        window.Converter.ly2pdf(lydata,function(success,dataurl){
            document.body.style.cursor = 'default';
            if (!success){
                console.log("Error: "+dataurl);
                //TODO: Error message box
            } else {
                save.download("pdf", dataurl, filename);
            }
        });
    }

    this.init = function(){

    }
}