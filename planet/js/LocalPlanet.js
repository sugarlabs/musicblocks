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

function LocalPlanet(Planet) {
    this.CookieDuration = 3650;
    this.ProjectTable = null;
    this.projects = null;
    this.DeleteModalID = null;
    this.Publisher = null;
    this.currentProjectImage = null;
    this.currentProjectID = null;

    this.updateProjects = function() {
        jQuery('.tooltipped').tooltip('remove');
        this.refreshProjectArray();
        this.initCards();
        this.renderAllProjects();
    };

    this.setCurrentProjectImage = function(image) {
        this.currentProjectImage = image;
        this.currentProjectID = Planet.ProjectStorage.getCurrentProjectID();
    };

    this.refreshProjectArray = function() {
        this.projects = [];
        for (var project in this.ProjectTable) {
            if (this.ProjectTable.hasOwnProperty(project)) {
                this.projects.push([project,null]);
            }
        }

        var that = this;

        this.projects.sort(function(a, b) {
            return that.ProjectTable[b[0]].DateLastModified - that.ProjectTable[a[0]].DateLastModified;
	});
    };

    this.initCards = function() {
        for (var i = 0; i < this.projects.length; i++) {
            this.projects[i][1] = new LocalCard(Planet);
            this.projects[i][1].init(this.projects[i][0]);
        }
    };

    this.renderAllProjects = function() {
        document.getElementById('local-projects').innerHTML = '';
        var index = -1;
        for (var i = 0; i < this.projects.length; i++) {
            this.projects[i][1].render();
            if (this.projects[i][0] === this.currentProjectID) {
                index = i;
            }
        }
        if (index!=-1) {
            var id = 'local-project-image-' + this.projects[index][0];
            console.log(id);
            var cardimg = document.getElementById(id);
            cardimg.src=this.currentProjectImage;
        }
        jQuery('.tooltipped').tooltip({delay: 50});
    };

    this.initDeleteModal = function() {
        var t = this;
        document.getElementById('deleter-button').addEventListener('click', function (evt) {
            if (t.DeleteModalID !== null) {
                Planet.ProjectStorage.deleteProject(t.DeleteModalID);
            }
        });
    };

    this.openDeleteModal = function(id) {
        this.DeleteModalID = id;
        var name = this.ProjectTable[id].ProjectName;
        document.getElementById('deleter-title').textContent = name;
        document.getElementById('deleter-name').textContent = name;
        jQuery('#deleter').modal('open');
    };

    this.openProject = function(id) {
        Planet.ProjectStorage.setCurrentProjectID(id);
        Planet.loadProjectFromData(this.ProjectTable[id].ProjectData);
    };

    this.mergeProject = function(id) {
        var d = this.ProjectStorage.getCurrentProjectData();
        if (d === null) {
            this.ProjectStorage.initialiseNewProject();
            Planet.loadProjectFromData(this.ProjectTable[id].ProjectData);
        } else {
            Planet.loadProjectFromData(this.ProjectTable[id].ProjectData, true);
        }
    };

    this.init = function() {
        this.ProjectTable = Planet.ProjectStorage.data.Projects;
        this.refreshProjectArray();
        this.initDeleteModal();
        this.Publisher = new Publisher(Planet);
        this.Publisher.init();
    };
};
