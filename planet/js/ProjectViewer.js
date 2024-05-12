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

   _, jQuery, hideOnClickOutside
*/
/*
   exported

   ProjectViewer
*/

class ProjectViewer {
    
    constructor(Planet) {
        this.Planet = Planet ;
        this.ProjectCache = Planet.GlobalPlanet.cache;
        this.PlaceholderMBImage = "images/mbgraphic.png";
        this.PlaceholderTBImage = "images/tbgraphic.png";
        this.ReportError = _("Error: Report could not be submitted. Try again later.");
        this.ReportSuccess = _("Thank you for reporting this project. A moderator will review the project shortly, to verify violation of the Sugar Labs Code of Conduct.");
        this.ReportEnabledButton = _("Report Project");
        this.ReportDisabledButton = _("Project Reported");
        this.ReportDescriptionError = _("Report description required");
        this.ReportDescriptionTooLongError = _("Report description too long");
        this.id = null;
    }

    open(id) {
        const Planet = this.Planet ;
        this.id = id;
        const proj = this.ProjectCache[id];
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        const last_updated_timestamp = proj.ProjectLastUpdated;
        const formatted_LastUpdated = new Date(last_updated_timestamp).toLocaleString(undefined, options);
        const created_timestamp = proj.ProjectCreatedDate;
        const formatted_CreatedDate = new Date(created_timestamp).toLocaleString(undefined, options);

        document.getElementById("projectviewer-title").textContent = proj.ProjectName;
        document.getElementById("projectviewer-last-updated").innerHTML = `<b>${formatted_LastUpdated}</b>`;
        document.getElementById("projectviewer-date").innerHTML =`<b>${formatted_CreatedDate}</b>`;
        document.getElementById("projectviewer-downloads").innerHTML = `<b>${proj.ProjectDownloads}</b>`;
        document.getElementById("projectviewer-likes").innerHTML = `<b>${proj.ProjectLikes}</b>`;

        let img = proj.ProjectImage;
        if (img === "" || img === null)
            img = (proj.ProjectIsMusicBlocks==1) ?
                this.PlaceholderMBImage : this.PlaceholderTBImage ;

        document.getElementById("projectviewer-image").src = img;
        document.getElementById("projectviewer-description").textContent = proj.ProjectDescription;
        const tagcontainer = document.getElementById("projectviewer-tags");
        tagcontainer.innerHTML = "";
        for (let i = 0; i < proj.ProjectTags.length; i++) {
            const chip = document.createElement("div");
            chip.classList.add("chipselect");
            chip.textContent = _(Planet.TagsManifest[proj.ProjectTags[i]].TagName);
            tagcontainer.appendChild(chip);
        }

        if (Planet.ProjectStorage.isReported(this.id)){
            document.getElementById("projectviewer-report-project").style.display = "none";
            document.getElementById("projectviewer-report-project-disabled").style.display = "block";
        }
        else {
            document.getElementById("projectviewer-report-project").style.display = "block";
            document.getElementById("projectviewer-report-project-disabled").style.display = "none";
        }

        jQuery("#projectviewer").modal("open");
    };

    download() {
        this.Planet.GlobalPlanet.getData(this.id,this.afterDownload.bind(this));
    };

    afterDownload (data) {
        const Planet = this.Planet ;

        const proj = this.ProjectCache[this.id];
        let image = Planet.ProjectStorage.ImageDataURL;
        if (proj.ProjectImage !== "")
            image = proj.ProjectImage;

        Planet.SaveInterface.saveHTML(
            proj.ProjectName,
            data,
            image,
            proj.ProjectDescription,
            this.id
        );
    };

    openProject() {
        // newPageTitle = proj.ProjectName;
        // document.title = newPageTitle;
        this.Planet.GlobalPlanet.openGlobalProject(this.id);
    };

    mergeProject() {
        // newPageTitle = proj.ProjectName;
        // document.title = newPageTitle;
        this.Planet.GlobalPlanet.mergeGlobalProject(this.id);
    };

    openReporter() {
        // eslint-disable-next-line no-console
        document.getElementById("reportdescription").value = "";
        document.getElementById("projectviewer-report-content").style.display = "block";
        document.getElementById("projectviewer-reportsubmit-content").style.display = "none";
        document.getElementById("projectviewer-report-progress").style.visibility = "hidden";
        document.getElementById("report-error").style.display = "none";
        document.getElementById("projectviewer-report-card").style.display = "block";
        
        hideOnClickOutside(
            [
                document.getElementById("projectviewer-report-card"),
                document.getElementById("projectviewer-report-project")
            ],
            "projectviewer-report-card"
        );
    };

    submitReporter() {
        const text = document.getElementById("reportdescription").value;

        if (text === ""){
            document.getElementById("report-error").textContent = this.ReportDescriptionError;
            document.getElementById("report-error").style.display = "block";
            return;
        }
        else if (text.length > 1000){
            document.getElementById("report-error").textContent = this.ReportDescriptionTooLongError;
            document.getElementById("report-error").style.display = "block";
            return;
        }
        else {
            document.getElementById("projectviewer-report-progress").style.visibility = "hidden";
            this.Planet.ServerInterface.reportProject(this.id, text, this.afterReport.bind(this));
        }
    };

    afterReport(data) {
        if (data.success) {
            document.getElementById("submittext").textContent = this.ReportSuccess;
            this.Planet.ProjectStorage.report(this.id,true);
            document.getElementById("projectviewer-report-project").style.display = "none";
            document.getElementById("projectviewer-report-project-disabled").style.display = "block";
        }
        else document.getElementById("submittext").textContent = this.ReportError;

        document.getElementById("projectviewer-report-content").style.display = "none";
        document.getElementById("projectviewer-report-progress").style.visibility = "hidden";
        document.getElementById("projectviewer-reportsubmit-content").style.display = "block";
    };

    closeReporter() {
        document.getElementById("projectviewer-report-card").style.display = "none";
    };

    init() {

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-download-file").addEventListener("click", evt => {
            this.download();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-open-mb").addEventListener("click", evt => {
            this.openProject();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-merge-mb").addEventListener("click", evt => {
            this.mergeProject();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-report-project").addEventListener("click", evt => {
            this.openReporter();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-report-submit").addEventListener("click", evt => {
            this.submitReporter();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-report-close").addEventListener("click", evt => {
            this.closeReporter();
        });
    };

}