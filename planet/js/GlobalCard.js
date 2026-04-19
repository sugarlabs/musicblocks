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

   _, hideOnClickOutside, updateCheckboxes, ClipboardJS,
   buildShareURL, buildEmbedSnippet
*/
/*
   exported

   GlobalCard
*/

class GlobalCard {
    constructor(Planet) {
        this.Planet = Planet;
        this.ProjectData = null;
        this.id = null;
        this.likeTimeout = null;
        this.clipboard = null;
        this.embedClipboard = null;
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
                            
                                <div class="card share-card" id="global-sharebox-{ID}" data-projectname="" style="display:none;"> 
                                    <div class="card-content shareurltext"> 
                                            <div class="shareurltitle">${_("Share")}</div> 
                                            <input type="text" name="shareurl" class="shareurlinput" data-originalurl="https://musicblocks.sugarlabs.org/index.html?id={ID}"> 
                                            <a class="copyshareurl tooltipped" data-clipboard-text="https://musicblocks.sugarlabs.org/index.html?id={ID}&run=True" data-delay="50" data-tooltip="${_(
                                                "Copy link to clipboard"
                                            )}"><i class="material-icons"alt="Copy!">file_copy</i></a>

                                            <div class="share-social-row">
                                                <a class="share-social-btn share-twitter tooltipped"
                                                   id="global-share-twitter-{ID}"
                                                   href="#"
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   data-delay="50"
                                                   data-tooltip="${_("Share on Twitter/X")}"
                                                   aria-label="${_("Share on Twitter/X")}">
                                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.735-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                                </a>
                                                <a class="share-social-btn share-whatsapp tooltipped"
                                                   id="global-share-whatsapp-{ID}"
                                                   href="#"
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   data-delay="50"
                                                   data-tooltip="${_("Share on WhatsApp")}"
                                                   aria-label="${_("Share on WhatsApp")}">
                                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                </a>
                                            </div>

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

                                            <div class="embed-section">
                                                <div class="shareurltitle embed-title">${_("Embed")}</div>
                                                <div class="embed-row">
                                                    <textarea class="embed-snippetarea" id="global-embed-{ID}" rows="3" readonly></textarea>
                                                    <a class="copyembed tooltipped"
                                                       id="global-copy-embed-{ID}"
                                                       data-clipboard-text=""
                                                       data-delay="50"
                                                       data-tooltip="${_("Copy embed code")}"
                                                       aria-label="${_("Copy embed code")}">
                                                        <i class="material-icons">file_copy</i>
                                                    </a>
                                                </div>
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

        // store project name on the sharebox for use in social share text
        frag.getElementById(`global-sharebox-${this.id}`).setAttribute(
            "data-projectname",
            this.ProjectData.ProjectName
        );

        // set number of likes
        frag.getElementById(`global-project-likes-${this.id}`).textContent =
            this.ProjectData.ProjectLikes.toString();

        // set view button listener

        frag.getElementById(`global-project-more-details-${this.id}`).addEventListener(
            "click",
            evt => {
                Planet.GlobalPlanet.ProjectViewer.open(this.id);
            }
        );

        // set open button listener

        frag.getElementById(`global-project-open-${this.id}`).addEventListener("click", evt => {
            Planet.GlobalPlanet.openGlobalProject(this.id);
        });

        // set image listener

        frag.getElementById(`global-project-image-${this.id}`).addEventListener("click", evt => {
            Planet.GlobalPlanet.ProjectViewer.open(this.id);
        });

        // set merge modify listener

        frag.getElementById(`global-project-merge-${this.id}`).addEventListener("click", evt => {
            Planet.GlobalPlanet.mergeGlobalProject(this.id);
        });

        // set share button listener

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

        // set share checkbox listener

        frag.getElementById(`global-checkboxrun-${this.id}`).addEventListener("click", evt => {
            updateCheckboxes(`global-sharebox-${this.id}`);
        });

        frag.getElementById(`global-checkboxshow-${this.id}`).addEventListener("click", evt => {
            updateCheckboxes(`global-sharebox-${this.id}`);
        });

        frag.getElementById(`global-checkboxcollapse-${this.id}`).addEventListener("click", evt => {
            updateCheckboxes(`global-sharebox-${this.id}`);
        });

        // set like icon
        const likeIconId = `global-like-icon-${this.id}`;

        frag.getElementById(likeIconId).textContent = Planet.ProjectStorage.isLiked(this.id)
            ? "favorite"
            : "favorite_border";

        frag.getElementById(`global-like-icon-${this.id}`).addEventListener("click", evt => {
            this.like();
        });

        document.getElementById("global-projects").appendChild(frag);
        updateCheckboxes(`global-sharebox-${this.id}`);

        if (this.clipboard) {
            this.clipboard.destroy();
        }

        this.clipboard = new ClipboardJS(`.copyshareurl[data-clipboard-text*="${this.id}"]`);

        this.clipboard.on("success", e => {
            // eslint-disable-next-line no-console
            console.info("Copied:", e.text);
            e.clearSelection();
        });

        this.clipboard.on("error", e => {
            alert("Failed to copy!");
            // eslint-disable-next-line no-console
            console.error("Failed to copy:", e.action);
        });

        if (this.embedClipboard) {
            this.embedClipboard.destroy();
        }

        this.embedClipboard = new ClipboardJS(`#global-copy-embed-${this.id}`);

        this.embedClipboard.on("success", e => {
            // eslint-disable-next-line no-console
            console.info("Embed copied:", e.text);
            e.clearSelection();
        });

        this.embedClipboard.on("error", e => {
            alert(_("Failed to copy!"));
            // eslint-disable-next-line no-console
            console.error("Failed to copy embed:", e.action);
        });
    }

    cleanup() {
        if (this.likeTimeout) {
            clearTimeout(this.likeTimeout);
            this.likeTimeout = null;
        }

        if (this.clipboard) {
            this.clipboard.destroy();
            this.clipboard = null;
        }

        if (this.embedClipboard) {
            this.embedClipboard.destroy();
            this.embedClipboard = null;
        }

        this.ProjectData = null;
        this.Planet = null;
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
