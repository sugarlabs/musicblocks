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

        // Use platformColor from the parent window for theme-aware colors
        const colors = window.parent.platformColor;

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

        // Modal container
        const modal = document.createElement("div");
        modal.style.borderRadius = "8px";
        modal.style.padding = "24px";
        modal.style.width = "400px";
        modal.style.maxWidth = "90%";
        modal.style.textAlign = "left";
        modal.style.fontFamily = "sans-serif";
        modal.style.backgroundColor = colors.dialogueBox;
        modal.style.color = colors.textColor;
        modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";

        // Title
        const title = document.createElement("h4");
        title.textContent = _("New Project");
        title.style.fontSize = "24px";
        title.style.margin = "0 0 16px 0";
        title.style.color = colors.textColor;
        modal.appendChild(title);

        // Message
        const message = document.createElement("p");
        message.textContent = _("Unsaved changes will be lost. Are you sure?");
        message.style.fontSize = "16px";
        message.style.marginBottom = "24px";
        message.style.color = colors.textColor;
        modal.appendChild(message);

        // Button container
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "flex-start";

        // Confirm button
        const confirmBtn = document.createElement("button");
        confirmBtn.textContent = _("Confirm");
        confirmBtn.style.backgroundColor = colors.blueButton;
        confirmBtn.style.color = colors.blueButtonText;
        confirmBtn.style.border = "none";
        confirmBtn.style.borderRadius = "4px";
        confirmBtn.style.padding = "8px 16px";
        confirmBtn.style.fontWeight = "bold";
        confirmBtn.style.cursor = "pointer";
        confirmBtn.style.marginRight = "16px";
        confirmBtn.addEventListener("click", () => {
            overlay.remove();
            this.loadNewProject();
        });

        // Cancel button
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = _("Cancel");
        cancelBtn.style.backgroundColor = colors.cancelButton;
        cancelBtn.style.color = "black";
        cancelBtn.style.border = "none";
        cancelBtn.style.borderRadius = "4px";
        cancelBtn.style.padding = "8px 16px";
        cancelBtn.style.fontWeight = "bold";
        cancelBtn.style.cursor = "pointer";
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
