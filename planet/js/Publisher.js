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

function Publisher(Planet) {
    this.ChipTags = null;
    this.PlaceholderMBImage = 'images/mbgraphic.png';
    this.PlaceholderTBImage = 'images/tbgraphic.png';
    this.PublisherOfflineHTML = '<div>' + _('Feature unavailable - cannot connect to server. Reload Music Blocks to try again.') + '</div>';
    this.TitleLowerBound = 1;
    this.TitleUpperBound = 50;
    this.DescriptionLowerBound = 1;
    this.DescriptionUpperBound = 1000;
    this.ProjectTable = Planet.LocalPlanet.ProjectTable;
    this.IsShareLink = false;

    this.dataToTags = (DATA) => {
        // convert to blocks like structure.
        DATA = JSON.parse(DATA);
        let blocks = {
            blockList: []
        };

        for (let i of DATA) {
            let block = {};
            if (typeof i[1] === "string") {
                block.name = i[1];
            } else {
                block.name = i[1][0];
            }
            block.connections = i[4];
            blocks.blockList.push(block);
        }
        //convert blocks to score.
        let score = Planet.analyzeProject(Planet.activity);

        //0("rhythm"),1("pitch"),2("tone"),3("mouse"),4("pen"),5("number"),
        //6("flow"),7("action"),8("sensors"),9("media"),10("mice")

        //use score to map tags.
        let tags = [];
        //Pitch, Tone, and/or Rhythm
        if (score[1] && score[2]){
            tags.push("2");//music
        }
        //pen,mouse
        if (score[3] && score[4]){
            tags.push("3");//art
        }
        //sensors
        if (score[8]){
            tags.push("5")//interactive;
        }
        //number
        if (score[5]){
            tags.push("4")//math;
        }

        return tags ;
    } 

    this.findTagWithName = function(name) {
        let keys = Object.keys(Planet.TagsManifest);
        for (let i = 0; i < keys.length; i++) {
            if (Planet.TagsManifest[keys[i]].TagName === name) {
                return keys[i];
            }
        }
        return null;
    };

    this.addTags = function() {
        let tags = Planet.TagsManifest;
        this.ChipTags = {};
        let keys = Object.keys(tags);
        for (let i = 0; i < keys.length; i++) {
            if (tags[keys[i]].IsTagUserAddable === '1') {
                this.ChipTags[tags[keys[i]].TagName] = null;
            }
        }

        jQuery('#tagsadd').material_chip({
            autocompleteOptions: {
                data: this.ChipTags,
                limit: Infinity,
                minLength: 1
            }
        });

        let maxLength = 5;
        let that = this;

        jQuery('#tagsadd').on('chip.add', function(e, chip) {
            // you have the added chip here
            let arr = jQuery('#tagsadd').material_chip('data');
            if (!(chip.tag in that.ChipTags)) {
                arr.splice(arr.length - 1, 1);
            } else {
                chip.id = that.findTagWithName(chip.tag);
            }

            if (arr.length>maxLength) {
                arr=arr.slice(0,maxLength);
            }

            that.setTagInput(arr);
            jQuery('#tagsadd :input').focus();
        });
    };

    this.setTagInput = function(arr) {
        jQuery('#tagsadd').material_chip({
            data: arr,
            autocompleteOptions: {
                data: this.ChipTags,
                limit: Infinity,
                minLength: 1
            }
        });
    };

    this.setTags = function(arr) {
        let a = [];
        for (let i = 0; i < arr.length; i++) {
            let o = {};
            o.tag = Planet.TagsManifest[arr[i]].TagName;
            o.id = arr[i];
            a.push(o);
        }
        this.setTagInput(a);
    };

    this.getTags = function() {
        let t = jQuery('#tagsadd').material_chip('data');
        let a = [];
        for (let i = 0; i < t.length; i++) {
            a.push(t[i].id);
        }
        return a;
    };

    this.initSubmit = function() {
        let t = this;
        document.getElementById('publisher-submit').addEventListener('click', this.publishProject.bind(this));
    };

    this.open = function(id, IsShareLink) {
        if (IsShareLink === undefined) {
            IsShareLink = false;
        }

        this.IsShareLink = IsShareLink;
        let name = this.ProjectTable[id].ProjectName;
        let image = this.ProjectTable[id].ProjectImage;
        let published = this.ProjectTable[id].PublishedData;
        let DATA = this.ProjectTable[id].ProjectData;
        let description;
        let tags;
        if (published !== null) {
            description = published.ProjectDescription;
            tags = published.ProjectTags;
            document.getElementById('publisher-ptitle').textContent = _('Republish Project');
        } else {
            description = '';
            tags = this.dataToTags(DATA);
            document.getElementById('publisher-ptitle').textContent = _('Publish Project');
        }

        if (Planet.ConnectedToServer) {
            document.getElementById('publish-description').value = description;
            document.getElementById('publish-description-label').setAttribute('data-error', '');
            this.setTags(tags);
            document.getElementById('publish-id').value = id;
            document.getElementById('publish-title').value = name;
            document.getElementById('publish-title-label').setAttribute('data-error', '');
            if (image === null) {
                if (Planet.IsMusicBlocks) {
                    image = this.PlaceholderMBImage;
                } else {
                    image = this.PlaceholderTBImage;
                }
            }

            document.getElementById('publish-image').src = image;
            document.getElementById('publisher-error').textContent = '';
            document.getElementById('publisher-error').style.display = 'none';
            Materialize.updateTextFields();
        }

        jQuery('#publisher').modal('open');
    };

    this.publishProject = function() {
        document.getElementById('publisher-error').textContent = '';
        document.getElementById('publisher-error').style.display = 'none';
        document.getElementById('publisher-progress').style.visibility = 'visible';

        let errors = false;
        let id = document.getElementById('publish-id').value;
        let title = document.getElementById('publish-title');
        let titlelabel = document.getElementById('publish-title-label');
        if (title.value.length < this.TitleLowerBound) {
            errors = true;
            titlelabel.setAttribute('data-error', _('This field is required'));
            title.classList.add('invalid');
            titlelabel.classList.add('active');
        }

        if (title.value.length > this.TitleUpperBound) {
            errors = true;
            titlelabel.setAttribute('data-error', _('Title too long'));
            title.classList.add('invalid');
            titlelabel.classList.add('active');
        }

        let description = document.getElementById('publish-description');
        let descriptionlabel = document.getElementById('publish-description-label');
        if (description.value.length < this.DescriptionLowerBound) {
            errors = true;
            descriptionlabel.setAttribute('data-error', _('This field is required'));
            description.classList.add('invalid');
            descriptionlabel.classList.add('active');
        }

        if (description.value.length > this.DescriptionUpperBound) {
            errors = true;
            descriptionlabel.setAttribute('data-error', _('Description too long'));
            description.classList.add('invalid');
            descriptionlabel.classList.add('active');
        }

        if (errors === true) {
            this.hideProgressBar();
        } else {
            let submitobj = {};
            submitobj.ProjectID = id;
            submitobj.ProjectName = title.value;
            submitobj.ProjectDescription = description.value;
            //TODO: Convert these into real block names once integrated into MB
            //let obj = palettes.getProtoNameAndPalette('MIDI');
            //console.log(obj[0]);
            //console.log(obj[1]);
            //console.log(obj[2]);
            submitobj.ProjectSearchKeywords = this.parseProject(this.ProjectTable[id].ProjectData);
            submitobj.ProjectData = Planet.ProjectStorage.encodeTB(this.ProjectTable[id].ProjectData);
            submitobj.ProjectImage = this.ProjectTable[id].ProjectImage;
            submitobj.ProjectIsMusicBlocks = (Planet.IsMusicBlocks ? 1 : 0);
            submitobj.ProjectCreatorName = Planet.ProjectStorage.getDefaultCreatorName();
            submitobj.ProjectTags = this.getTags();
            let send = JSON.stringify(submitobj);
            let published = {};
            published.ProjectDescription = description.value;
            published.ProjectTags = this.getTags();
            document.getElementById('publisher-submit').style.cursor = 'wait';
            document.getElementById('publisher-cancel').style.cursor = 'wait';
            for (let i=0; i<document.getElementById('publisher-form').getElementsByTagName("INPUT").length; i++) {
              document.getElementById('publisher-form').getElementsByTagName("INPUT")[i].style.cursor = 'wait';
            }
            for (let i=0; i<document.getElementById('publisher-form').getElementsByTagName("TEXTAREA").length; i++) {
              document.getElementById('publisher-form').getElementsByTagName("TEXTAREA")[i].style.cursor = 'wait';
            }
            document.body.style.cursor = 'wait';
            Planet.ServerInterface.addProject(send, function(data) {
                this.afterPublishProject(data, id, title.value, published);
            }.bind(this));
        }
    };

    this.parseProject = function(tb) {
        try {
            tb = JSON.parse(tb);
        } catch (e) {
            console.log(e);
            return '';
        }

        let words = new Set();
        for (let i = 0; i < tb.length; i++) {
            let block = tb[i];
            if (typeof block[1] === 'string') {
                words.add(block[1]);
            } else if (Array.isArray(block[1])) {
                words.add(block[1][0]);
            } else if (typeof block[1] === 'number') {
                break;
            }
        }

        let s = '';
        for (let item of words) {
            s += item + ' ';
        }

        return s.slice(0, -1);
    };

    this.hideProgressBar = function() {
        document.getElementById('publisher-progress').style.visibility = 'hidden';
    };

    this.afterPublishProject = function(data, id, name, published) {
        if (data.success) {
            Planet.ProjectStorage.addPublishedData(id, published);
            Planet.ProjectStorage.renameProject(id, name);
            this.hideProgressBar();
            this.close();
            Planet.LocalPlanet.updateProjects();
            Planet.GlobalPlanet.refreshProjects();
            if (this.IsShareLink) {
                document.getElementById('sharebox-' + id).style.display = 'initial';
            }
        } else {
            this.throwError(_('Server Error') + ' (' + data.error + ') - ' + _('Try Again'));
            this.hideProgressBar();
        }
        document.getElementById('publisher-submit').style.cursor = 'pointer';
        document.getElementById('publisher-cancel').style.cursor = 'pointer';
        for (let i=0; i<document.getElementById('publisher-form').getElementsByTagName("INPUT").length; i++) {
          document.getElementById('publisher-form').getElementsByTagName("INPUT")[i].style.cursor = 'text';
        }
        for (let i=0; i<document.getElementById('publisher-form').getElementsByTagName("TEXTAREA").length; i++) {
          document.getElementById('publisher-form').getElementsByTagName("TEXTAREA")[i].style.cursor = 'text';
        }
        document.body.style.cursor = 'default';
    };

    this.throwError = function(error) {
        document.getElementById('publisher-error').textContent = error;
        document.getElementById('publisher-error').style.display = 'initial';
    };

    this.close = function() {
        jQuery('#publisher').modal('close');
    };

    this.init = function() {
        if (!Planet.ConnectedToServer) {
            let element = document.getElementById('publisher-form');
            element.parentNode.removeChild(element);
            element = document.getElementById('publisher-submit');
            element.parentNode.removeChild(element);
            let frag = document.createRange().createContextualFragment(this.PublisherOfflineHTML);
            document.getElementById('publisher-content').appendChild(frag);
        } else {
            this.addTags();
            this.initSubmit();
        }
    };
};
