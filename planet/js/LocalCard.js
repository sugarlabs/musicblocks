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

   _
*/
/*
   exported

   LocalCard
*/

class LocalCard {
    constructor(Planet) {
        this.Planet = Planet;
        this.PlaceholderMBImage = "images/mbgraphic.png";
        this.PlaceholderTBImage = "images/tbgraphic.png";
        this.id = null;
        this.ProjectData = null;
        this.CopySuffix = `(${_("Copy")})`;

        this.renderData = `
            <div class="col no-margin-left s12 m6 l4"> 
                    <div class="card"> 
                    <a class="published-cloud tooltipped" data-position="top" data-delay="50" data-tooltip="${_(
                        "View published project"
                    )}" style="display:none;" id="local-project-cloud-{ID}">
                        <i class="material-icons small">cloud_done</i>
                    </a>
                        
                        <div class="card-image"> 
                            <img class="project-image project-card-image" id="local-project-image-{ID}"> 
                            <a class="btn-floating halfway-fab waves-effect waves-light orange tooltipped" data-position="top" data-delay="50" data-tooltip="${_(
                                "Publish project"
                            )}" id="local-project-publish-{ID}"><i class="material-icons">cloud_upload</i></a> 
                        </div> 
                            
                        <div class="card-content"> 
                            <input class="card-title grey-text text-darken-4" id="local-project-input-{ID}" /> 
                        </div> 
                            
                        <div class="card-action"> 
                            <div class="flexcontainer"> 
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                    "Edit project"
                                )}" id="local-project-edit-{ID}"><i class="material-icons">edit</i></a> 
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                    "Delete project"
                                )}" id="local-project-delete-{ID}"><i class="material-icons">delete</i></a> 
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                    "Download project"
                                )}" id="local-project-download-{ID}"><i class="material-icons">file_download</i></a> 
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                    "Share on social media"
                                )}" id="local-project-viral-share-{ID}"><i class="material-icons">ios_share</i></a> 
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                    "Merge with current project"
                                )}" id="local-project-merge-{ID}"><i class="material-icons">merge_type</i></a> 
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                    "Duplicate project"
                                )}" id="local-project-duplicate-{ID}"><i class="material-icons">content_copy</i></a> 
                            </div> 
                        </div> 
                    </div>  
            </div>
        `;
    }

    download() {
        const Planet = this.Planet;

        let image = Planet.ProjectStorage.ImageDataURL;
        if (this.ProjectData.ProjectImage !== null) image = this.ProjectData.ProjectImage;

        let description = null;
        if (this.ProjectData.PublishedData !== null)
            description = this.ProjectData.PublishedData.ProjectDescription;

        Planet.SaveInterface.saveHTML(
            this.ProjectData.ProjectName,
            this.ProjectData.ProjectData,
            image,
            description
        );
    }

    duplicate() {
        const Planet = this.Planet;
        Planet.ProjectStorage.initialiseNewProject(
            this.ProjectData.ProjectName + " " + this.CopySuffix,
            this.ProjectData.ProjectData,
            this.ProjectData.ProjectImage
        );
        Planet.LocalPlanet.updateProjects();
    }

    render() {
        const Planet = this.Planet;

        const html = this.renderData.replace(new RegExp("{ID}", "g"), this.id);
        const frag = document.createRange().createContextualFragment(html);

        // set image
        let imageSrc;

        if (this.ProjectData.ProjectImage !== null) imageSrc = this.ProjectData.ProjectImage;
        else {
            imageSrc =
                Planet.IsMusicBlocks == 1 ? this.PlaceholderMBImage : this.PlaceholderTBImage;
        }

        const imageId = `local-project-image-${this.id}`;
        frag.getElementById(imageId).src = imageSrc;

        // set input text
        frag.getElementById(`local-project-input-${this.id}`).value = this.ProjectData.ProjectName;

        // set edit modify listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`local-project-edit-${this.id}`).addEventListener("click", evt => {
            Planet.LocalPlanet.openProject(this.id);
        });

        // set image listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(imageId).addEventListener("click", evt => {
            Planet.LocalPlanet.openProject(this.id);
        });

        // set merge modify listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`local-project-merge-${this.id}`).addEventListener("click", evt => {
            Planet.LocalPlanet.openProject(this.id);
        });

        // set input modify listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`local-project-input-${this.id}`).addEventListener("input", evt => {
            Planet.ProjectStorage.renameProject(this.id, evt.target.value);
        });

        // set delete button listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`local-project-delete-${this.id}`).addEventListener("click", evt => {
            Planet.LocalPlanet.openDeleteModal(this.id);
        });

        // set publish button listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`local-project-publish-${this.id}`).addEventListener("click", evt => {
            Planet.LocalPlanet.Publisher.open(this.id);
        });

        // set download button listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`local-project-download-${this.id}`).addEventListener("click", evt => {
            this.download();
        });

        // set viral share button listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`local-project-viral-share-${this.id}`).addEventListener("click", evt => {
            if (typeof window.viralLoops !== 'undefined') {
                const projectTitle = this.ProjectData.ProjectName || 'Music Blocks Project';
                const projectImage = this.ProjectData.ProjectImage;
                const projectId = this.ProjectData.PublishedData ? this.id : null;
                window.viralLoops.showShareModal(projectTitle, projectId, projectImage);
            }
        });

        // set duplicate button listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`local-project-duplicate-${this.id}`).addEventListener("click", evt => {
            this.duplicate();
        });

        // set published cloud listener
        if (this.ProjectData.PublishedData !== null) {
            frag.getElementById(`local-project-cloud-${this.id}`).style.display = "initial";
            // eslint-disable-next-line no-unused-vars
            frag.getElementById(`local-project-cloud-${this.id}`).addEventListener("click", evt => {
                document.getElementById("global-tab").click();
                Planet.GlobalPlanet.forceAddToCache(this.id, () => {
                    Planet.GlobalPlanet.ProjectViewer.open(this.id);
                });
            });
        }

        document.getElementById("local-projects").appendChild(frag);
    }

    init(id) {
        const Planet = this.Planet;
        this.id = id;
        this.ProjectData = Planet.LocalPlanet.ProjectTable[this.id];
    }
}
