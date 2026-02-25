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

class Planet {
    constructor(isMusicBlocks, storage) {
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
    }

    prepareUserID() {
        let id = getCookie(this.UserIDCookie);

        if (id === "") {
            id = this.ProjectStorage.generateID();
            setCookie(this.UserIDCookie, id, 3650);
        }

        this.UserID = id;
    }

    open(image) {
        if (this.LocalPlanet === null) {
            console.log("Local Planet unavailable");
        } else {
            this.LocalPlanet.setCurrentProjectImage(image);
            this.LocalPlanet.updateProjects();
            this.oldCurrentProjectID = this.ProjectStorage.getCurrentProjectID();
        }
    }

    saveLocally(data, image) {
        this.ProjectStorage.saveLocally(data, image);
    }

    setAnalyzeProject(func) {
        this.analyzeProject = func;
    }

    setLoadProjectFromData(func) {
        this.loadProjectFromData = func;
    }

    setPlanetClose(func) {
        this.planetClose = func;
    }

    setLoadNewProject(func) {
        this.loadNewProject = func;
    }

    setLoadProjectFromFile(func) {
        this.loadProjectFromFile = func;
    }

    setOnConverterLoad(func) {
        this.onConverterLoad = func;
    }

    openProjectFromPlanet(id, error) {
        this.GlobalPlanet.openGlobalProject(id, error);
    }

showNewProjectConfirmation() {
    const button = document.getElementById("planet-new-project");
    const rect = button.getBoundingClientRect();

    // Remove existing confirmation if any
    const old = document.getElementById("new-project-confirmation");
    if (old) old.remove();

    const modal = document.createElement("div");
    modal.id = "new-project-confirmation";
    modal.style.position = "absolute";
    modal.style.top = rect.bottom + window.scrollY + 8 + "px";
    modal.style.left = rect.left + window.scrollX + "px";
    modal.style.background = "#1b5e20"; // dark green
    modal.style.color = "#ffffff";
    modal.style.padding = "16px";
    modal.style.borderRadius = "10px";
    modal.style.width = "260px";
    modal.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
    modal.style.zIndex = "10000";
    modal.style.fontFamily = "sans-serif";
    modal.style.animation = "fadeIn 0.15s ease-out";

    modal.innerHTML = `
        <div style="font-size:15px; font-weight:600; margin-bottom:6px;">
            Start New Project?
        </div>
        <div style="font-size:13px; opacity:0.85; margin-bottom:12px;">
            Unsaved changes will be lost.
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button id="cancel-new"
                style="padding:6px 12px; border:none; background:#2e7d32; color:#fff; border-radius:6px; cursor:pointer;">
                No
            </button>
            <button id="confirm-new"
                style="padding:6px 12px; border:none; background:#66bb6a; color:#000; font-weight:600; border-radius:6px; cursor:pointer;">
                Yes
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Cancel
    modal.querySelector("#cancel-new").onclick = (e) => {
        e.stopPropagation();
        modal.remove();
    };

    // Confirm
    modal.querySelector("#confirm-new").onclick = () => {
        modal.remove();
        this.loadNewProject();
    };

    // Click outside to close
    document.addEventListener("click", function handler(e) {
        if (!modal.contains(e.target) && e.target !== button) {
            modal.remove();
            document.removeEventListener("click", handler);
        }
    });
}

    async init() {
        this.StringHelper = new StringHelper(this);
        this.StringHelper.init();
        this.ProjectStorage = new ProjectStorage(this);
        await this.ProjectStorage.init();
        this.prepareUserID();
        this.ServerInterface = new ServerInterface(this);
        this.ServerInterface.init();

        // eslint-disable-next-line no-unused-vars
        document.getElementById("close-planet").addEventListener("click", evt => {
            this.closeButton();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("planet-open-file").addEventListener("click", evt => {
            this.loadProjectFromFile();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("planet-new-project").addEventListener("click", evt => {
            evt.preventDefault(); 
            evt.stopPropagation(); 
            this.showNewProjectConfirmation();
        });

        this.ServerInterface.getTagManifest(
            function (data) {
                this.initPlanets(data);
            }.bind(this)
        );
    }

    closeButton() {
        this.planetClose();
    }

    initPlanets(tags) {
        const status = tags.success || false;
        this.ConnectedToServer = status;
        if (status) this.TagsManifest = tags.data;

        this.Converter = new Converter(this);
        this.Converter.init();
        this.onConverterLoad();
        this.SaveInterface = new SaveInterface(this);
        this.SaveInterface.init();
        this.LocalPlanet = new LocalPlanet(this);
        this.LocalPlanet.init();
        this.GlobalPlanet = new GlobalPlanet(this);
        this.GlobalPlanet.init();
    }
}

// sync the dark mode of the planet with the main page and themePreference
document.addEventListener("DOMContentLoaded", function () {
    let themes = ["light", "dark"];
    for (let i = 0; i < themes.length; i++) {
        if (themes[i] === localStorage.getItem("themePreference")) {
            document.body.classList.add(themes[i]);
        } else {
            document.body.classList.remove(themes[i]);
        }
    }
});
