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

   GlobalCard
*/

class GlobalCard {
    constructor(Planet) {
        this.Planet = Planet;
        this.ProjectData = null;
        this.id = null;
        this.likeTimeout = null;
        this.likePending = false;
        this.clipboard = null;
        this.PlaceholderMBImage = "images/mbgraphic.png";
        this.PlaceholderTBImage = "images/tbgraphic.png";

        /** @type {IntersectionObserver|null} — disconnected once thumbnail loads */
        this._thumbObserver = null;

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
                                "Fork project"
                            )}" id="global-project-fork-{ID}"><i class="material-icons">call_split</i></a>
                            <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                "Merge with current project"
                            )}" id="global-project-merge-{ID}"><i class="material-icons">merge_type</i></a> 
                            <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${`${
                                Planet.ProjectStorage.isLiked(this.id) ? "Unlike" : "Like"
                            } project`}"><i class="material-icons" id="global-like-icon-{ID}"></i><span class="likes-count" id="global-project-likes-{ID}"></span></a>

                            <div id="global-share-{ID}"> 
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="${_(
                                    "Share project"
                                )}" id="global-project-share-{ID}"><i class="material-icons">share</i></a> 
                            
                                <div class="card share-card" id="global-sharebox-{ID}" style="display:none;"> 
                                    <div class="card-content shareurltext"> 
                                            <div class="shareurltitle">${_("Share")}</div> 
                                            <input type="text" name="shareurl" class="shareurlinput" data-originalurl="https://musicblocks.sugarlabs.org/index.html?repo={ID}"> 
                                            <a class="copyshareurl tooltipped" data-clipboard-text="https://musicblocks.sugarlabs.org/index.html?repo={ID}&run=True" data-delay="50" data-tooltip="${_(
                                                "Copy link to clipboard"
                                            )}"><i class="material-icons" alt="Copy!">file_copy</i></a>
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

    showToast(message, isError = false) {
        // Reuse existing SaveInterface.showToast but add error styling if needed
        if (this.Planet && this.Planet.SaveInterface) {
            this.Planet.SaveInterface.showToast(message);

            // If it's an error, modify the toast to be red
            if (isError) {
                setTimeout(() => {
                    const toasts = document.querySelectorAll(".toast");
                    if (toasts.length > 0) {
                        const lastToast = toasts[toasts.length - 1];
                        lastToast.style.background = "#f44336"; // Red for errors
                    }
                }, 10);
            }
        }
    }

    render() {
        const Planet = this.Planet;
        const html = this.renderData.replace(new RegExp("{ID}", "g"), this.id);
        const frag = document.createRange().createContextualFragment(html);

        // ── Thumbnail (lazy) ─────────────────────────────────────────────
        // Cards render immediately with a shimmer placeholder.
        // The real thumbnail URL is only fetched when the card scrolls
        // into view (via IntersectionObserver), keeping initial render fast.
        const imageId  = `global-project-image-${this.id}`;
        const imgEl    = frag.getElementById(imageId);
        const placeholder = this.ProjectData.ProjectIsMusicBlocks === 1
            ? this.PlaceholderMBImage
            : this.PlaceholderTBImage;

        const hasThumbnail = this.ProjectData.hasThumbnail;
        const dataUrl      = this.ProjectData.ProjectImage;

        if (dataUrl && dataUrl !== "" && !hasThumbnail) {
            // Already in memory (data-URL from migrated project) — apply immediately.
            imgEl.src = dataUrl;
        } else {
            // Show the placeholder + shimmer; lazy-load the real image on scroll.
            imgEl.src = placeholder;
            imgEl.classList.add("mb-thumb-loading");

            if (hasThumbnail === 1 && Planet.ServerInterface.getThumbnailUrl) {
                const realSrc = Planet.ServerInterface.getThumbnailUrl(this.id);
                this._lazyLoadImage(imgEl, realSrc);
            } else {
                // No thumbnail available — remove shimmer right away.
                imgEl.classList.remove("mb-thumb-loading");
            }
        }

        // set tags
        // ProjectTags is now an array of lowercase topic strings (e.g. ["music","math"]).
        // Planet.TagsManifest keys are those same lowercase strings.
        const tagcontainer = frag.getElementById(`global-project-tags-${this.id}`);
        tagcontainer.classList.add("global-tags-container");

        for (let i = 0; i < this.ProjectData.ProjectTags.length; i++) {
            const tag = this.ProjectData.ProjectTags[i];
            const chip = document.createElement("div");
            chip.classList.add("chipselect");
            const entry = Planet.TagsManifest && Planet.TagsManifest[tag];
            chip.textContent = entry
                ? _(entry.TagName)
                : _(tag.charAt(0).toUpperCase() + tag.slice(1));
            tagcontainer.appendChild(chip);
        }

        // set project title text and tooltip
        const titleEl = frag.getElementById(`global-project-title-${this.id}`);
        titleEl.textContent = this.ProjectData.ProjectName;
        titleEl.title = this.ProjectData.ProjectName;
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

        // set fork button listener
        frag.getElementById(`global-project-fork-${this.id}`).addEventListener("click", evt => {
            Planet.GlobalPlanet.forkGlobalProject(this.id, evt.currentTarget);
        });

        // set merge modify listener

        frag.getElementById(`global-project-merge-${this.id}`).addEventListener("click", evt => {
            Planet.GlobalPlanet.mergeGlobalProject(this.id);
        });

        // set share button listener

        frag.getElementById(`global-project-share-${this.id}`).addEventListener("click", evt => {
            const s = document.getElementById(`global-sharebox-${this.id}`);

            if (s.style.display === "none") {
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
            console.info("Copied:", e.text);
            this.showToast(_("Link copied to clipboard!"));
            e.clearSelection();
        });

        this.clipboard.on("error", e => {
            console.warn("Failed to copy to clipboard");
            console.error("Failed to copy:", e.action);
            this.showToast(_("Failed to copy link to clipboard"), true);
        });
    }

    /**
     * Attaches a one-shot IntersectionObserver to the image element.
     * Once the element enters the viewport, the real src is applied
     * and the observer immediately disconnects.
     *
     * @param {HTMLImageElement} imgEl
     * @param {string}           realSrc
     */
    _lazyLoadImage(imgEl, realSrc) {
        if (this._thumbObserver) {
            this._thumbObserver.disconnect();
        }

        this._thumbObserver = new IntersectionObserver(
            (entries, observer) => {
                const entry = entries[0];
                if (!entry.isIntersecting) return;

                // Swap in the real URL.
                const image = entry.target;
                image.src = realSrc;
                image.onload = () => {
                    image.classList.remove("mb-thumb-loading");
                    image.classList.add("mb-thumb-loaded");
                };
                image.onerror = () => {
                    // Network failure — silently keep the placeholder.
                    image.classList.remove("mb-thumb-loading");
                };

                // One-shot: stop observing after the first intersection.
                observer.disconnect();
                this._thumbObserver = null;
            },
            { rootMargin: "100px" }
        );

        this._thumbObserver.observe(imgEl);
    }

    cleanup() {
        if (this._thumbObserver) {
            this._thumbObserver.disconnect();
            this._thumbObserver = null;
        }

        if (this.likeTimeout) {
            clearTimeout(this.likeTimeout);
            this.likeTimeout = null;
        }

        if (this.clipboard) {
            this.clipboard.destroy();
            this.clipboard = null;
        }

        this.ProjectData = null;
        this.Planet = null;
    }

    like() {
        if (this.likePending) return;
        const Planet = this.Planet;
        clearTimeout(this.likeTimeout);
        const like = !Planet.ProjectStorage.isLiked(this.id);
        this.likePending = true;
        // Optimistic UI update before the round-trip
        this.setLike(like);
        this.likeTimeout = setTimeout(() => {
            // GitServerInterface.likeProject uses repoName (this.id) directly
            Planet.ServerInterface.likeProject(this.id, like, data => {
                this.likePending = false;
                if (!data.success) {
                    // Roll back optimistic update on failure
                    this.setLike(!like);
                }
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

if (typeof module !== "undefined" && module.exports) {
    module.exports = { GlobalCard };
}
