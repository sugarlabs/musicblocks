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
        this._renameTimers = {};
        this.CopySuffix = `(${_("Copy")})`;

        this.renderData = `
            <div class="col no-margin-left s12 m6 l4"> 
                    <div class="card"> 
                        <div class="card-badges" id="local-project-badges-{ID}">
                            <a class="published-cloud tooltipped" data-position="top" data-delay="50" data-tooltip="${_(
                                "View published project"
                            )}" style="display:none;" id="local-project-cloud-{ID}">
                                <i class="material-icons small">cloud_done</i>
                            </a>
                            <span class="git-repo-badge tooltipped" data-position="top" data-delay="50" data-tooltip="${_(
                                "Being tracked"
                            )}" style="display:none;" id="local-project-git-{ID}">
                                <!-- git-branch icon (Phosphor, bold weight, MIT licence) — inlined to avoid external CDN dependency -->
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"
                                     class="git-repo-badge-icon" role="img" aria-label="GitHub repository">
                                    <path d="M232,64a32,32,0,1,0-40,30.9V128a8,8,0,0,1-8,8H104a8,8,0,0,1-8-8V94.9a32,32,0,1,0-16,0V128a24,24,0,0,0,24,24h80v33.1a32,32,0,1,0,16,0V152h0V94.9A32.1,32.1,0,0,0,232,64ZM80,64a16,16,0,1,1-16-16A16,16,0,0,1,80,64ZM192,208a16,16,0,1,1-16-16A16,16,0,0,1,192,208ZM200,80a16,16,0,1,1,16-16A16,16,0,0,1,200,80Z"/>
                                </svg>
                            </span>
                        </div>
                        
                        <div class="card-image"> 
                            <img class="project-image project-card-image" alt="${_(
                                "Project thumbnail"
                            )}" id="local-project-image-{ID}"> 
                            <a class="btn-floating halfway-fab waves-effect waves-light orange tooltipped" data-position="top" data-delay="50" data-tooltip="${_(
                                "Publish project"
                            )}" id="local-project-publish-{ID}"><i class="material-icons">cloud_upload</i></a> 
                        </div> 
                            
                        <div class="card-content"> 
                            <input class="card-title grey-text text-darken-4" aria-label="${_(
                                "Project name"
                            )}" id="local-project-input-{ID}" /> 
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
            imageSrc = Planet.IsMusicBlocks ? this.PlaceholderMBImage : this.PlaceholderTBImage;
        }

        const imageId = `local-project-image-${this.id}`;
        frag.getElementById(imageId).src = imageSrc;

        // set input text
        frag.getElementById(`local-project-input-${this.id}`).value = this.ProjectData.ProjectName;

        // set edit modify listener

        frag.getElementById(`local-project-edit-${this.id}`).addEventListener("click", evt => {
            Planet.LocalPlanet.openProject(this.id);
        });

        // set image listener

        frag.getElementById(imageId).addEventListener("click", evt => {
            Planet.LocalPlanet.openProject(this.id);
        });

        // set merge modify listener

        frag.getElementById(`local-project-merge-${this.id}`).addEventListener("click", () => {
            Planet.LocalPlanet.mergeProject(this.id);
        });

        // set input modify listener

        frag.getElementById(`local-project-input-${this.id}`).addEventListener("input", evt => {
            const projectId = this.id;
            const newName = evt.target.value;
            clearTimeout(this._renameTimers[projectId]);
            this._renameTimers[projectId] = setTimeout(() => {
                Planet.ProjectStorage.renameProject(projectId, newName);
                delete this._renameTimers[projectId];
            }, 400);
        });

        // set delete button listener

        frag.getElementById(`local-project-delete-${this.id}`).addEventListener("click", evt => {
            Planet.LocalPlanet.openDeleteModal(this.id);
        });

        // set publish button listener

        frag.getElementById(`local-project-publish-${this.id}`).addEventListener("click", evt => {
            Planet.LocalPlanet.Publisher.open(this.id);
        });

        // set download button listener

        frag.getElementById(`local-project-download-${this.id}`).addEventListener("click", evt => {
            this.download();
        });

        // set duplicate button listener

        frag.getElementById(`local-project-duplicate-${this.id}`).addEventListener("click", evt => {
            this.duplicate();
        });

        // show git-repo badge (static indicator — no link) if project is linked to a GitHub repo
        if (this.ProjectData.GitRepoData && this.ProjectData.GitRepoData.repoName) {
            frag.getElementById(`local-project-git-${this.id}`).style.display = "inline-flex";
        }

        // set published cloud listener
        if (this.ProjectData.PublishedData !== null) {
            const cloudBadge = frag.getElementById(`local-project-cloud-${this.id}`);
            cloudBadge.style.display = "inline-flex";

            cloudBadge.addEventListener("click", evt => {
                const publishedId = this.ProjectData.PublishedData.repoName || this.id;
                document.getElementById("global-tab").click();
                Planet.GlobalPlanet.forceAddToCache(publishedId, () => {
                    Planet.GlobalPlanet.ProjectViewer.open(publishedId);
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

if (typeof module !== "undefined" && module.exports) {
    module.exports = { LocalCard };
}
