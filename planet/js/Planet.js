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

   _, setCookie, getCookie, StringHelper, ProjectStorage, ServerInterface,
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
            console.warn("Local Planet unavailable");
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
        // Remove existing confirmation if one is already open
        const existing = document.getElementById("new-project-confirmation");
        if (existing) existing.remove();

        const isDark = document.body.classList.contains("dark");
        const isHighContrast = document.body.classList.contains("highcontrast");

        // Overlay to block interaction behind the modal
        const overlay = document.createElement("div");
        overlay.id = "new-project-confirmation";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
        overlay.style.zIndex = "9999";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";

        // Modal container — colors match Planet's theme palette
        const modal = document.createElement("div");
        modal.style.borderRadius = "8px";
        modal.style.padding = "24px";
        modal.style.width = "400px";
        modal.style.maxWidth = "90%";
        modal.style.textAlign = "left";
        modal.style.fontFamily = "sans-serif";

        if (isHighContrast) {
            modal.style.backgroundColor = "#000000";
            modal.style.color = "#ffff00";
            modal.style.border = "2px solid #ffff00";
            modal.style.boxShadow = "0 0 10px rgba(255, 255, 0, 0.3)";
        } else if (isDark) {
            modal.style.backgroundColor = "#424242";
            modal.style.color = "#e0e0e0";
            modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.4)";
        } else {
            modal.style.backgroundColor = "#fff";
            modal.style.color = "#000";
            modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        }

        // Title — uses Planet's light-green accent
        const title = document.createElement("h4");
        title.textContent = _("New Project");
        title.style.fontSize = "24px";
        title.style.margin = "0 0 16px 0";
        if (isHighContrast) {
            title.style.color = "#ffff00";
        } else if (isDark) {
            title.style.color = "#a8d5a8";
        } else {
            title.style.color = "#558b2f";
        }
        modal.appendChild(title);

        // Message
        const message = document.createElement("p");
        message.textContent = _("Unsaved changes will be lost. Are you sure?");
        message.style.fontSize = "16px";
        message.style.marginBottom = "24px";
        if (isHighContrast) {
            message.style.color = "#ffff00";
        } else if (isDark) {
            message.style.color = "#e0e0e0";
        } else {
            message.style.color = "#000";
        }
        modal.appendChild(message);

        // Button container
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "flex-start";

        // Confirm button — matches Planet's green nav/button colors
        const confirmBtn = document.createElement("button");
        confirmBtn.textContent = _("Confirm");
        confirmBtn.style.border = "none";
        confirmBtn.style.borderRadius = "4px";
        confirmBtn.style.padding = "8px 16px";
        confirmBtn.style.fontWeight = "bold";
        confirmBtn.style.cursor = "pointer";
        confirmBtn.style.marginRight = "16px";
        if (isHighContrast) {
            confirmBtn.style.backgroundColor = "#000000";
            confirmBtn.style.color = "#ffff00";
            confirmBtn.style.border = "2px solid #ffff00";
        } else if (isDark) {
            confirmBtn.style.backgroundColor = "#2f6b2f";
            confirmBtn.style.color = "#ffffff";
        } else {
            confirmBtn.style.backgroundColor = "#8bc34a";
            confirmBtn.style.color = "#ffffff";
        }
        confirmBtn.addEventListener("click", () => {
            overlay.remove();
            this.loadNewProject();
        });

        // Cancel button
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = _("Cancel");
        cancelBtn.style.border = "none";
        cancelBtn.style.borderRadius = "4px";
        cancelBtn.style.padding = "8px 16px";
        cancelBtn.style.fontWeight = "bold";
        cancelBtn.style.cursor = "pointer";
        if (isHighContrast) {
            cancelBtn.style.backgroundColor = "#000000";
            cancelBtn.style.color = "#ffff00";
            cancelBtn.style.border = "2px solid #ffff00";
        } else if (isDark) {
            cancelBtn.style.backgroundColor = "#555555";
            cancelBtn.style.color = "#e0e0e0";
        } else {
            cancelBtn.style.backgroundColor = "#e0e0e0";
            cancelBtn.style.color = "#000";
        }
        cancelBtn.addEventListener("click", () => {
            overlay.remove();
        });

        buttonContainer.appendChild(confirmBtn);
        buttonContainer.appendChild(cancelBtn);
        modal.appendChild(buttonContainer);
        overlay.appendChild(modal);

        // Click on overlay background to dismiss
        overlay.addEventListener("click", e => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        document.body.appendChild(overlay);
    }

    async init() {
        this.StringHelper = new StringHelper(this);
        this.StringHelper.init();
        this.ProjectStorage = new ProjectStorage(this);
        await this.ProjectStorage.init();
        this.prepareUserID();
        this.ServerInterface = new ServerInterface(this);
        this.ServerInterface.init();

        document.getElementById("close-planet").addEventListener("click", evt => {
            this.closeButton();
        });

        document.getElementById("planet-open-file").addEventListener("click", evt => {
            this.loadProjectFromFile();
        });

        document.getElementById("planet-new-project").addEventListener("click", evt => {
            this.showNewProjectConfirmation();
        });

        this.ServerInterface.getTagManifest(
            function (data) {
                this.initPlanets(data);
            }.bind(this)
        );
    }

    async closeButton() {
        if (this.ProjectStorage.getCurrentProjectID() !== this.oldCurrentProjectID) {
            const data = await this.ProjectStorage.getCurrentProjectData();
            !data ? this.loadNewProject() : this.loadProjectFromData(data);
        } else this.planetClose();
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
    let themes = ["light", "dark", "highcontrast"];
    for (let i = 0; i < themes.length; i++) {
        if (themes[i] === localStorage.getItem("themePreference")) {
            document.body.classList.add(themes[i]);
        } else {
            document.body.classList.remove(themes[i]);
        }
    }
});
