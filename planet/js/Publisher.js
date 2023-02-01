// Copyright (c) 2017 Euan Ong
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
   global

   _, jQuery, Materialize
*/
/*
   exported

   Publisher
*/

function Publisher(Planet) {
    this.ChipTags = null;
    this.PlaceholderMBImage = "images/mbgraphic.png";
    this.PlaceholderTBImage = "images/tbgraphic.png";
    this.PublisherOfflineHTML = "<div>" + _("Feature unavailable - cannot connect to server. Reload Music Blocks to try again.") + "</div>";
    this.TitleLowerBound = 1;
    this.TitleUpperBound = 50;
    this.DescriptionLowerBound = 1;
    this.DescriptionUpperBound = 1000;
    this.ProjectTable = Planet.LocalPlanet.ProjectTable;
    this.IsShareLink = false;

    this.dataToTags = (DATA) => {
        // convert to blocks like structure.
        DATA = JSON.parse(DATA);
        const blocks = {
            blockList: []
        };

        for (const i of DATA) {
            const block = {};
            if (typeof i[1] === "string") {
                block.name = i[1];
            } else {
                block.name = i[1][0];
            }
            block.connections = i[4];
            blocks.blockList.push(block);
        }
        //convert blocks to score.
        const score = Planet.analyzeProject();

        //0("rhythm"),1("pitch"),2("tone"),3("mouse"),4("pen"),5("number"),
        //6("flow"),7("action"),8("sensors"),9("media"),10("mice")

        //use score to map tags.
        const tags = [];
        //Pitch, Tone, and/or Rhythm
        if (score[1] && score[2]) {
            tags.push("2");  // music
        }
        //pen,mouse
        if (score[3] && score[4]) {
            tags.push("3");  // art
        }
        //sensors
        if (score[8]) {
            tags.push("5");  // interactive
        }
        //number
        if (score[5]) {
            tags.push("4");  // math
        }

        return tags;
    };


    this.findTagWithName = (name) => {
        const keys = Object.keys(Planet.TagsManifest);
        for (let i = 0; i < keys.length; i++) {
            if (Planet.TagsManifest[keys[i]].TagName === name) {
                return keys[i];
            }
        }
        return null;
    };

    this.addTags = () => {
        const tags = Planet.TagsManifest;
        this.ChipTags = {};
        const keys = Object.keys(tags);
        for (let i = 0; i < keys.length; i++) {
            if (tags[keys[i]].IsTagUserAddable === "1") {
                this.ChipTags[tags[keys[i]].TagName] = null;
            }
        }

        jQuery("#tagsadd").material_chip({
            autocompleteOptions: {
                data: this.ChipTags,
                limit: Infinity,
                minLength: 1
            }
        });

        const maxLength = 5;

        jQuery("#tagsadd").on("chip.add", (e, chip) => {
            // you have the added chip here
            let arr = jQuery("#tagsadd").material_chip("data");
            if (!(chip.tag in this.ChipTags)) {
                arr.splice(arr.length - 1, 1);
            } else {
                chip.id = this.findTagWithName(chip.tag);
            }

            if (arr.length>maxLength) {
                arr=arr.slice(0,maxLength);
            }

            this.setTagInput(arr);
            jQuery("#tagsadd :input").focus();
        });
    };

    this.setTagInput = (arr) => {
        jQuery("#tagsadd").material_chip({
            data: arr,
            autocompleteOptions: {
                data: this.ChipTags,
                limit: Infinity,
                minLength: 1
            }
        });
    };


    this.setTags = (arr) => {
        const a = [];
        for (let i = 0; i < arr.length; i++) {
            const o = {};
            o.tag = Planet.TagsManifest[arr[i]].TagName;
            o.id = arr[i];
            a.push(o);
        }
        this.setTagInput(a);
    };

    this.getTags = () => {
        const t = jQuery("#tagsadd").material_chip("data");
        const a = [];
        for (let i = 0; i < t.length; i++) {
            a.push(t[i].id);
        }
        return a;
    };

    this.initSubmit = () => {
        document.getElementById("publisher-submit").addEventListener("click", this.publishProject.bind(this));
    };

    this.open = (id, IsShareLink) => {
        if (IsShareLink === undefined) {
            IsShareLink = false;
        }

        this.IsShareLink = IsShareLink;
        const name = this.ProjectTable[id].ProjectName;
        let image = this.ProjectTable[id].ProjectImage;
        const published = this.ProjectTable[id].PublishedData;
        const DATA = this.ProjectTable[id].ProjectData;
        let description;
        let tags;
        if (published !== null) {
            description = published.ProjectDescription;
            tags = published.ProjectTags;
            document.getElementById("publisher-ptitle").textContent = _("Republish Project");
        } else {
            description = "";
            tags = this.dataToTags(DATA);
            document.getElementById("publisher-ptitle").textContent = _("Publish Project");
        }

        if (Planet.ConnectedToServer) {
            document.getElementById("publish-description").value = description;
            document.getElementById("publish-description-label").setAttribute("data-error", "");
            this.setTags(tags);
            document.getElementById("publish-id").value = id;
            document.getElementById("publish-title").value = name;
            document.getElementById("publish-title-label").setAttribute("data-error", "");
            if (image === null) {
                if (Planet.IsMusicBlocks) {
                    image = this.PlaceholderMBImage;
                } else {
                    image = this.PlaceholderTBImage;
                }
            }

            document.getElementById("publish-image").src = image;
            document.getElementById("publisher-error").textContent = "";
            document.getElementById("publisher-error").style.display = "none";
            Materialize.updateTextFields();
        }

        jQuery("#publisher").modal("open");
    };

    this.publishProject = () => {
        document.getElementById("publisher-error").textContent = "";
        document.getElementById("publisher-error").style.display = "none";
        document.getElementById("publisher-progress").style.visibility = "visible";

        let errors = false;
        const id = document.getElementById("publish-id").value;
        const title = document.getElementById("publish-title");
        const titlelabel = document.getElementById("publish-title-label");
        if (title.value.length < this.TitleLowerBound) {
            errors = true;
            titlelabel.setAttribute("data-error", _("This field is required"));
            title.classList.add("invalid");
            titlelabel.classList.add("active");
        }

        if (title.value.length > this.TitleUpperBound) {
            errors = true;
            titlelabel.setAttribute("data-error", _("Title too long"));
            title.classList.add("invalid");
            titlelabel.classList.add("active");
        }

        const description = document.getElementById("publish-description");
        const descriptionlabel = document.getElementById("publish-description-label");
        if (description.value.length < this.DescriptionLowerBound) {
            errors = true;
            descriptionlabel.setAttribute("data-error", _("This field is required"));
            description.classList.add("invalid");
            descriptionlabel.classList.add("active");
        }

        if (description.value.length > this.DescriptionUpperBound) {
            errors = true;
            descriptionlabel.setAttribute("data-error", _("Description too long"));
            description.classList.add("invalid");
            descriptionlabel.classList.add("active");
        }

        if (errors === true) {
            this.hideProgressBar();
        } else {
            const submitobj = {};
            submitobj.ProjectID = id;
            submitobj.ProjectName = title.value;
            submitobj.ProjectDescription = description.value;
            //TODO: Convert these into real block names once integrated into MB
            //let obj = palettes.getProtoNameAndPalette("MIDI");
            //console.log(obj[0]);
            //console.log(obj[1]);
            //console.log(obj[2]);
            submitobj.ProjectSearchKeywords = this.parseProject(this.ProjectTable[id].ProjectData);
            submitobj.ProjectData = Planet.ProjectStorage.encodeTB(
                this.ProjectTable[id].ProjectData
            );
            submitobj.ProjectImage = this.ProjectTable[id].ProjectImage;
            submitobj.ProjectIsMusicBlocks = (Planet.IsMusicBlocks ? 1 : 0);
            submitobj.ProjectCreatorName = Planet.ProjectStorage.getDefaultCreatorName();
            submitobj.ProjectTags = this.getTags();
            const send = JSON.stringify(submitobj);
            const published = {};
            published.ProjectDescription = description.value;
            published.ProjectTags = this.getTags();
            document.getElementById("publisher-submit").style.cursor = "wait";
            document.getElementById("publisher-cancel").style.cursor = "wait";
            for (let i=0; i<document.getElementById("publisher-form").getElementsByTagName("INPUT").length; i++) {
                document.getElementById("publisher-form").getElementsByTagName("INPUT")[i].style.cursor = "wait";
            }
            for (let i=0; i<document.getElementById("publisher-form").getElementsByTagName("TEXTAREA").length; i++) {
                document.getElementById("publisher-form").getElementsByTagName("TEXTAREA")[i].style.cursor = "wait";
            }
            document.body.style.cursor = "wait";
            Planet.ServerInterface.addProject(send, function(data) {
                this.afterPublishProject(data, id, title.value, published);
            }.bind(this));
        }
    };


    this.parseProject = (tb) => {
        try {
            tb = JSON.parse(tb);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log(e);
            return "";
        }

        const words = new Set();
        for (let i = 0; i < tb.length; i++) {
            const block = tb[i];
            if (typeof block[1] === "string") {
                words.add(block[1]);
            } else if (Array.isArray(block[1])) {
                words.add(block[1][0]);
            } else if (typeof block[1] === "number") {
                break;
            }
        }

        let s = "";
        for (const item of words) {
            s += item + " ";
        }

        return s.slice(0, -1);
    };

    this.hideProgressBar = () => {
        document.getElementById("publisher-progress").style.visibility = "hidden";
    };

    this.afterPublishProject = (data, id, name, published) => {
        if (data.success) {
            Planet.ProjectStorage.addPublishedData(id, published);
            Planet.ProjectStorage.renameProject(id, name);
            this.hideProgressBar();
            this.close();
            Planet.LocalPlanet.updateProjects();
            Planet.GlobalPlanet.refreshProjects();
            if (this.IsShareLink) {
                document.getElementById("sharebox-" + id).style.display = "initial";
            }
        } else {
            this.throwError(_("Server Error") + " (" + data.error + ") - " + _("Try Again"));
            this.hideProgressBar();
        }
        document.getElementById("publisher-submit").style.cursor = "pointer";
        document.getElementById("publisher-cancel").style.cursor = "pointer";
        for (let i=0; i<document.getElementById("publisher-form").getElementsByTagName("INPUT").length; i++) {
            document.getElementById("publisher-form").getElementsByTagName("INPUT")[i].style.cursor = "text";
        }
        for (let i=0; i<document.getElementById("publisher-form").getElementsByTagName("TEXTAREA").length; i++) {
            document.getElementById("publisher-form").getElementsByTagName("TEXTAREA")[i].style.cursor = "text";
        }
        document.body.style.cursor = "default";
    };


    this.throwError = (error) => {
        document.getElementById("publisher-error").textContent = error;
        document.getElementById("publisher-error").style.display = "initial";
    };

    this.close = () => {
        jQuery("#publisher").modal("close");
    };

    this.init = () => {
        if (!Planet.ConnectedToServer) {
            let element = document.getElementById("publisher-form");
            element.parentNode.removeChild(element);
            element = document.getElementById("publisher-submit");
            element.parentNode.removeChild(element);
            const frag = document.createRange().createContextualFragment(this.PublisherOfflineHTML);
            document.getElementById("publisher-content").appendChild(frag);
        } else {
            this.addTags();
            this.initSubmit();
        }
    };
};
