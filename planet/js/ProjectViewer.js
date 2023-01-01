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

function ProjectViewer(Planet) {
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

    this.open = function(id) {
        this.id = id;
        const proj = this.ProjectCache[id];
        document.getElementById("projectviewer-title").textContent = proj.ProjectName;
        document.getElementById("projectviewer-last-updated").textContent = proj.ProjectLastUpdated;
        document.getElementById("projectviewer-date").textContent = proj.ProjectCreatedDate;
        document.getElementById("projectviewer-downloads").textContent = proj.ProjectDownloads;
        document.getElementById("projectviewer-likes").textContent = proj.ProjectLikes;
        let img = proj.ProjectImage;
        if (img === "" || img === null) {
            if (proj.ProjectIsMusicBlocks==1) {
                img = this.PlaceholderMBImage;
            } else {
                img = this.PlaceholderTBImage;
            }
        }

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
        } else {
            document.getElementById("projectviewer-report-project").style.display = "block";
            document.getElementById("projectviewer-report-project-disabled").style.display = "none";
        }

        jQuery("#projectviewer").modal("open");
    };

    this.download = function() {
        Planet.GlobalPlanet.getData(this.id,this.afterDownload.bind(this));
    };

    this.afterDownload = function(data) {
        const proj = this.ProjectCache[this.id];
        let image = Planet.ProjectStorage.ImageDataURL;
        if (proj.ProjectImage !== "") {
            image = proj.ProjectImage;
        }

        Planet.SaveInterface.saveHTML(
            proj.ProjectName,
            data,
            image,
            proj.ProjectDescription,
            this.id
        );
    };

    this.openProject = function() {
        // newPageTitle = proj.ProjectName;
        // document.title = newPageTitle;
        Planet.GlobalPlanet.openGlobalProject(this.id);
    };

    this.mergeProject = function() {
        // newPageTitle = proj.ProjectName;
        // document.title = newPageTitle;
        Planet.GlobalPlanet.mergeGlobalProject(this.id);
    };

    this.openReporter = function() {
        // eslint-disable-next-line no-console
        console.log("load");
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

    this.submitReporter = function() {
        const text = document.getElementById("reportdescription").value;
        if (text === ""){
            document.getElementById("report-error").textContent = this.ReportDescriptionError;
            document.getElementById("report-error").style.display = "block";
            return;
        } else if (text.length > 1000){
            document.getElementById("report-error").textContent = this.ReportDescriptionTooLongError;
            document.getElementById("report-error").style.display = "block";
            return;
        } else {
            document.getElementById("projectviewer-report-progress").style.visibility = "hidden";
            Planet.ServerInterface.reportProject(this.id, text, this.afterReport.bind(this));
        }
    };

    this.afterReport = function(data) {
        if (data.success) {
            document.getElementById("submittext").textContent = this.ReportSuccess;
            Planet.ProjectStorage.report(this.id,true);
            document.getElementById("projectviewer-report-project").style.display = "none";
            document.getElementById("projectviewer-report-project-disabled").style.display = "block";
        } else {
            document.getElementById("submittext").textContent = this.ReportError;
        }

        document.getElementById("projectviewer-report-content").style.display = "none";
        document.getElementById("projectviewer-report-progress").style.visibility = "hidden";
        document.getElementById("projectviewer-reportsubmit-content").style.display = "block";
    };

    this.closeReporter = function() {
        document.getElementById("projectviewer-report-card").style.display = "none";
    };

    this.init = function(){
        const that = this;

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-download-file").addEventListener("click", function (evt) {
            that.download();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-open-mb").addEventListener("click", function (evt) {
            that.openProject();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-merge-mb").addEventListener("click", function (evt) {
            that.mergeProject();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-report-project").addEventListener("click", function (evt) {
            that.openReporter();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-report-submit").addEventListener("click", function (evt) {
            that.submitReporter();
        });

        // eslint-disable-next-line no-unused-vars
        document.getElementById("projectviewer-report-close").addEventListener("click", function (evt) {
            that.closeReporter();
        });
    };
};
