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

   jQuery, LocalCard, Publisher
*/
/*
   exported

   LocalPlanet
*/

class LocalPlanet {

    constructor(Planet) {
        this.Planet = Planet ;
        this.CookieDuration = 3650;
        this.ProjectTable = null;
        this.projects = null;
        this.DeleteModalID = null;
        this.Publisher = null;
        this.currentProjectImage = null;
        this.currentProjectID = null;
    }

    updateProjects() {
        jQuery(".tooltipped").tooltip("remove");
        this.refreshProjectArray();
        this.initCards();
        this.renderAllProjects();
    };

    setCurrentProjectImage(image)  {
        this.currentProjectImage = image;
        this.currentProjectID = this.Planet.ProjectStorage.getCurrentProjectID();
    };

    refreshProjectArray() {
        this.projects = [];

        for (const project in this.ProjectTable) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.ProjectTable.hasOwnProperty(project)) {
                this.projects.push([project,null]);
            }
        }

        this.projects.sort((a, b) => {
            // eslint-disable-next-line max-len
            return this.ProjectTable[b[0]].DateLastModified - this.ProjectTable[a[0]].DateLastModified;
        });
    };

    initCards() {
        for (let i = 0; i < this.projects.length; i++) {
            const Planet = this.Planet ;
            this.projects[i][1] = new LocalCard(Planet);
            this.projects[i][1].init(this.projects[i][0]);
        }
    };

    renderAllProjects() {
        document.getElementById("local-projects").innerHTML = "";

        let index = -1;
        for (let i = 0; i < this.projects.length; i++) {
            this.projects[i][1].render();
            if (this.projects[i][0] === this.currentProjectID)
                index = i;
        }

        if (index!=-1) {
            const id = `local-project-image-${this.projects[index][0]}`;
            // eslint-disable-next-line no-console
            const cardimg = document.getElementById(id);
            cardimg.src=this.currentProjectImage;
        }

        jQuery(".tooltipped").tooltip({delay: 50});
    };

    initDeleteModal() {
        const t = this;

        document.getElementById("deleter-button").addEventListener(
            "click",
            // eslint-disable-next-line no-unused-vars
            function (evt) {
                if (t.DeleteModalID !== null) {
                    t.Planet.ProjectStorage.deleteProject(t.DeleteModalID);
                }
            }
        );
    };

    openDeleteModal(id)  {
        this.DeleteModalID = id;
        const name = this.ProjectTable[id].ProjectName;
        document.getElementById("deleter-title").textContent = name;
        document.getElementById("deleter-name").textContent = name;
        jQuery("#deleter").modal("open");
    };

    openProject(id) {
        const Planet = this.Planet ;
        Planet.ProjectStorage.setCurrentProjectID(id);
        Planet.loadProjectFromData(this.ProjectTable[id].ProjectData);
    };

    mergeProject(id) {
        const Planet = this.Planet ;
        const d = this.ProjectStorage.getCurrentProjectData();

        if (d === null) {
            this.ProjectStorage.initialiseNewProject();
            Planet.loadProjectFromData(this.ProjectTable[id].ProjectData);
        }
        else Planet.loadProjectFromData(this.ProjectTable[id].ProjectData, true);
    };

    init() {
        const Planet = this.Planet ;

        this.ProjectTable = Planet.ProjectStorage.data.Projects;
        this.refreshProjectArray();
        this.initDeleteModal();
        this.Publisher = new Publisher(Planet);
        this.Publisher.init();
    };

}