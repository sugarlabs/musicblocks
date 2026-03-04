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

   _, hideOnClickOutside, updateCheckboxes, ClipboardJS
*/
/*
   exported

   GlobalCard, copyURLToClipboard
*/

class GlobalCard {
    constructor(Planet) {
        this.Planet = Planet;
        this.ProjectData = null;
        this.id = null;
        this.likeTimeout = null;
        this.PlaceholderMBImage = "images/mbgraphic.png";
        this.PlaceholderTBImage = "images/tbgraphic.png";

        this.renderData = `
            <div class="col no-margin-left s12 m6 l4"> 
                <div class="card" style="height:95%;"> 
                
                    <div class="card-image"> 
                        <img class="project-image project-card-image" id="global-project-image-{ID}" src="images/planetgraphic.png"> 
                    </div> 

                    <div class="card-content"> 
                        <span class="card-title global-title grey-text text-darken-4" id="global-project-title-{ID}"></span> 
                        <div id="global-project-tags-{ID}"> 
                        </div> 
                    </div> 

                    <div class="card-action"> 
                        <div class="flexcontainer"> 
                            <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                "More Details"
                            )}" id="global-project-more-details-{ID}"><i class="material-icons">info</i></a> 
                            <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                "Open in Music Blocks"
                            )}" id="global-project-open-{ID}"><i class="material-icons">launch</i></a> 
                            <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                "Merge with current project"
                            )}" id="global-project-merge-{ID}"><i class="material-icons">merge_type</i></a> 
                            <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${`${
                                Planet.ProjectStorage.isLiked(this.id) ? "Unlike" : "Like"
                            } project`}"><i class="material-icons"id="global-like-icon-{ID}"></i><span class="likes-count" id="global-project-likes-{ID}"></span></a>

                            <div id="global-share-{ID}"> 
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                    "Share project"
                                )}" id="global-project-share-{ID}"><i class="material-icons">share</i></a> 
                                
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                    "Share on social media"
                                )}" id="global-project-viral-share-{ID}"><i class="material-icons">ios_share</i></a>
                            
                                <div class="card share-card" id="global-sharebox-{ID}" style="display:none;"> 
                                    <div class="card-content shareurltext"> 
                                            <div class="shareurltitle">${_("Share")}</div> 
                                            <input type="text" name="shareurl" class="shareurlinput" data-originalurl="https://musicblocks.sugarlabs.org/index.html?id={ID}"> 
                                            <a class="copyshareurl tooltipped" onclick="copyURLToClipboard()" data-clipboard-text="https://musicblocks.sugarlabs.org/index.html?id={ID}&run=True" data-delay="50" data-tooltip="${_(
                                                "Copy link to clipboard"
                                            )}"><i class="material-icons"alt="Copy!">file_copy</i></a>
                                            <div class="shareurl-advanced" id="global-advanced-{ID}"> 
                                                    <div class="shareurltitle">${_("Flags")}</div> 
                                                    <div><input type="checkbox" name="run" id="global-checkboxrun-{ID}" checked><label for="global-checkboxrun-{ID}">${_(
                                                        "Run project on startup."
                                                    )}</label></div> 
                                                    <div><input type="checkbox" name="show" id="global-checkboxshow-{ID}"><label for="global-checkboxshow-{ID}">${_(
                                                        "Show code blocks on startup."
                                                    )}</label></div> 
                                                    <div><input type="checkbox" name="collapse" id="global-checkboxcollapse-{ID}"><label for="global-checkboxcollapse-{ID}">${_(
                                                        "Collapse code blocks on startup."
                                                    )}</label></div> 
                                            </div> 
                                    </div> 

                                    <div class="card-action"> 
                                        <a onclick="toggleExpandable('global-advanced-{ID}','shareurl-advanced');">${_(
                                            "Advanced Options"
                                        )}</a> 
                                    </div> 
                                </div> 
                            </div> 
                        </div> 
                    </div> 

                </div> 
            </div> 
         `;
    }

    render() {
        const Planet = this.Planet;
        const html = this.renderData.replace(new RegExp("{ID}", "g"), this.id);
        const frag = document.createRange().createContextualFragment(html);

        // set image
        let source;

        const projectImage = this.ProjectData.ProjectImage;
        if (projectImage !== null && projectImage !== "") source = projectImage;
        else {
            source =
                this.ProjectData.ProjectIsMusicBlocks === 1
                    ? this.PlaceholderMBImage
                    : this.PlaceholderTBImage;
        }

        const imageId = `global-project-image-${this.id}`;
        frag.getElementById(imageId).src = source;

        // set tags
        const tagcontainer = frag.getElementById(`global-project-tags-${this.id}`);
        tagcontainer.classList.add("global-tags-container");

        for (let i = 0; i < this.ProjectData.ProjectTags.length; i++) {
            const chip = document.createElement("div");
            chip.classList.add("chipselect");
            chip.textContent = _(Planet.TagsManifest[this.ProjectData.ProjectTags[i]].TagName);
            tagcontainer.appendChild(chip);
        }

        // set title text
        frag.getElementById(`global-project-title-${this.id}`).textContent =
            this.ProjectData.ProjectName;

        // set number of likes
        frag.getElementById(`global-project-likes-${this.id}`).textContent =
            this.ProjectData.ProjectLikes.toString();

        // set view button listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`global-project-more-details-${this.id}`).addEventListener(
            "click",
            evt => {
                Planet.GlobalPlanet.ProjectViewer.open(this.id);
            }
        );

        // set open button listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`global-project-open-${this.id}`).addEventListener("click", evt => {
            Planet.GlobalPlanet.openGlobalProject(this.id);
        });

        // set image listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`global-project-image-${this.id}`).addEventListener("click", evt => {
            Planet.GlobalPlanet.ProjectViewer.open(this.id);
        });

        // set merge modify listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`global-project-merge-${this.id}`).addEventListener("click", evt => {
            Planet.GlobalPlanet.mergeGlobalProject(this.id);
        });

        // set share button listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`global-project-share-${this.id}`).addEventListener("click", evt => {
            const s = document.getElementById(`global-sharebox-${this.id}`);

            if (s.style.display == "none") {
                s.style.display = "initial";
                hideOnClickOutside(
                    [document.getElementById(`global-share-${this.id}`)],
                    `global-sharebox-${this.id}`
                );
            } else s.style.display = "none";
        });

        // set viral share button listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`global-project-viral-share-${this.id}`).addEventListener("click", evt => {
            if (typeof window.viralLoops !== 'undefined') {
                const projectTitle = this.ProjectData.ProjectName || 'Music Blocks Project';
                const projectImage = this.ProjectData.ProjectImage;
                window.viralLoops.showShareModal(projectTitle, this.id, projectImage);
            }
        });

        // set share checkbox listener
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`global-checkboxrun-${this.id}`).addEventListener("click", evt => {
            updateCheckboxes(`global-sharebox-${this.id}`);
        });
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`global-checkboxshow-${this.id}`).addEventListener("click", evt => {
            updateCheckboxes(`global-sharebox-${this.id}`);
        });
        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`global-checkboxcollapse-${this.id}`).addEventListener("click", evt => {
            updateCheckboxes(`global-sharebox-${this.id}`);
        });

        // set like icon
        const likeIconId = `global-like-icon-${this.id}`;

        frag.getElementById(likeIconId).textContent = Planet.ProjectStorage.isLiked(this.id)
            ? "favorite"
            : "favorite_border";

        // eslint-disable-next-line no-unused-vars
        frag.getElementById(`global-like-icon-${this.id}`).addEventListener("click", evt => {
            this.like();
        });

        document.getElementById("global-projects").appendChild(frag);
        updateCheckboxes(`global-sharebox-${this.id}`);
    }

    like() {
        const Planet = this.Planet;
        clearTimeout(this.likeTimeout);
        let like = true;
        if (Planet.ProjectStorage.isLiked(this.id)) like = false;
        this.likeTimeout = setTimeout(() => {
            Planet.ServerInterface.likeProject(this.id, like, data => {
                this.afterLike(data, like);
            });
        }, 500);
    }

    afterLike(data, like) {
        !data.success && data.error === "ERROR_ACTION_NOT_PERMITTED"
            ? this.setLike(like)
            : this.setLike(like);
    }

    setLike(like) {
        this.Planet.ProjectStorage.like(this.id, like);
        let incr = 1;
        let text = "favorite";

        if (!like) {
            incr = -1;
            text = "favorite_border";
        }

        const l = document.getElementById(`global-project-likes-${this.id}`);
        l.textContent = (parseInt(l.textContent) + incr).toString();
        document.getElementById(`global-like-icon-${this.id}`).textContent = text;
    }

    init(id) {
        this.id = id;
        this.ProjectData = this.Planet.GlobalPlanet.cache[id];
    }
}

function copyURLToClipboard() {
    const clipboard = new ClipboardJS(".copyshareurl");

    clipboard.on("success", e => {
        // eslint-disable-next-line no-console
        console.info("Copied:", e.text);
        e.clearSelection();
    });

    clipboard.on("error", e => {
        alert("Failed to copy!");
        // eslint-disable-next-line no-console
        console.error("Failed to copy:", e.action);
    });
}
