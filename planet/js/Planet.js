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

   setCookie, getCookie, StringHelper, ProjectStorage, ServerInterface,
   Converter, SaveInterface, LocalPlanet, GlobalPlanet
*/
/*
   exported

   Planet
*/

function Planet(isMusicBlocks, storage) {
    this.LocalPlanet = null;
    this.GlobalPlanet = null;
    this.ProjectStorage = null;
    this.ServerInterface = null;
    this.Converter = null;
    this.SaveInterface = null;
    this.LocalStorage = storage;
    this.ConnectedToServer = null;
    this.TagsManifest = null;
    this.IsMusicBlocks = isMusicBlocks;
    this.UserIDCookie = "UserID";
    this.UserID = null;
    this.loadProjectFromData = null;
    this.loadNewProject = null;
    this.planetClose = null;
    this.oldCurrentProjectID = null;
    this.loadProjectFromFile = null;

    this.prepareUserID = function() {
        let id = getCookie(this.UserIDCookie);
        if (id === ""){
            id = this.ProjectStorage.generateID();
            setCookie(this.UserIDCookie, id, 3650);
        }
        this.UserID = id;
    };

    this.open = function(image) {
        this.LocalPlanet.setCurrentProjectImage(image);
        this.LocalPlanet.updateProjects();
        this.oldCurrentProjectID = this.ProjectStorage.getCurrentProjectID();
    };

    this.saveLocally = function(data, image) {
        this.ProjectStorage.saveLocally(data, image);
    };

    this.setAnalyzeProject = function(func) {
        this.analyzeProject = func;
    };

    this.setLoadProjectFromData = function(func) {
        this.loadProjectFromData = func;
    };

    this.setPlanetClose = function(func) {
        this.planetClose = func;
    };

    this.setLoadNewProject = function(func) {
        this.loadNewProject = func;
    };

    this.setLoadProjectFromFile = function(func) {
        this.loadProjectFromFile = func;
    };

    this.setOnConverterLoad = function(func) {
        this.onConverterLoad = func;
    };

    this.openProjectFromPlanet = function(id,error) {
        this.GlobalPlanet.openGlobalProject(id,error);
    };

    this.init = async function() {
        this.StringHelper = new StringHelper(this);
        this.StringHelper.init();
        this.ProjectStorage = new ProjectStorage(this);
        await this.ProjectStorage.init();
        this.prepareUserID();
        this.ServerInterface = new ServerInterface(this);
        this.ServerInterface.init();

        const that = this;

        // eslint-disable-next-line no-unused-vars
        document.getElementById("close-planet").addEventListener("click", function (evt) {
            that.closeButton();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("planet-open-file").addEventListener("click", function (evt) {
            that.loadProjectFromFile();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("planet-new-project").addEventListener("click", function (evt) {
            that.loadNewProject();
        });

        this.ServerInterface.getTagManifest(
            function(data) {
                this.initPlanets(data);
            }.bind(this)
        );
    };

    this.closeButton = function() {
        if (this.ProjectStorage.getCurrentProjectID() !== this.oldCurrentProjectID) {
            const d = this.ProjectStorage.getCurrentProjectData();
            if (d === null){
                this.loadNewProject();
            } else {
                this.loadProjectFromData(d);
            }
        } else {
            this.planetClose();
        }
    };

    this.initPlanets = function(tags) {
        if (!tags.success){
            this.ConnectedToServer = false;
        } else {
            this.ConnectedToServer = true;
            this.TagsManifest = tags.data;
        }

        this.Converter = new Converter(this);
        this.Converter.init();
        this.onConverterLoad();
        this.SaveInterface = new SaveInterface(this);
        this.SaveInterface.init();
        this.LocalPlanet = new LocalPlanet(this);
        this.LocalPlanet.init();
        this.GlobalPlanet = new GlobalPlanet(this);
        this.GlobalPlanet.init();
    };
};
