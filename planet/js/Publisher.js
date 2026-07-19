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

   _, jQuery, Materialize
*/
/*
   exported

   Publisher
*/

class Publisher {
    constructor(Planet) {
        this.Planet = Planet;
        this.ChipTags = null;
        this.PlaceholderMBImage = "images/mbgraphic.png";
        this.PlaceholderTBImage = "images/tbgraphic.png";
        this.PublisherOfflineHTML =
            "<div>" +
            _("Feature unavailable - cannot connect to server. Reload Music Blocks to try again.") +
            "</div>";
        this.TitleLowerBound = 1;
        this.TitleUpperBound = 50;
        this.DescriptionLowerBound = 1;
        this.DescriptionUpperBound = 1000;
        this.ProjectTable = Planet.LocalPlanet.ProjectTable;
        this.IsShareLink = false;
    }

    dataToTags(DATA) {
        // convert to blocks like structure.
        let parsed;
        try {
            parsed = JSON.parse(DATA);
        } catch (e) {
            console.error("Publisher.dataToTags: Invalid JSON data", e);
            return [];
        }

        const blocks = {
            blockList: []
        };

        for (const i of parsed) {
            const block = {};
            block.name = typeof i[1] === "string" ? i[1] : i[1][0];
            block.connections = i[4];
            blocks.blockList.push(block);
        }

        //convert blocks to score.
        const score = this.Planet.analyzeProject();

        //0("rhythm"),1("pitch"),2("tone"),3("mouse"),4("pen"),5("number"),
        //6("flow"),7("action"),8("sensors"),9("media"),10("mice")

        //use score to map tags.
        const tags = [];

        //Pitch, Tone, and/or Rhythm
        if (score[1] && score[2]) tags.push("music"); // music

        //pen,mouse
        if (score[3] && score[4]) tags.push("art"); // art

        //sensors
        if (score[8]) tags.push("interactive"); // interactive

        //number
        if (score[5]) tags.push("math"); // math

        return tags;
    }

    findTagWithName(name) {
        const Planet = this.Planet;
        const keys = Object.keys(Planet.TagsManifest);

        for (let i = 0; i < keys.length; i++)
            if (Planet.TagsManifest[keys[i]].TagName === name) return keys[i];

        return null;
    }

    addTags() {
        const tags = this.Planet.TagsManifest;
        this.ChipTags = {};
        const keys = Object.keys(tags);

        for (let i = 0; i < keys.length; i++)
            if (tags[keys[i]].IsTagUserAddable === "1") this.ChipTags[tags[keys[i]].TagName] = null;

        const maxLength = 5;

        jQuery(".chips").on("chip.add", (e, chip) => {
            // you have the added chip here
            let arr = jQuery(".chips-initial").material_chip("data");

            if (!(chip.tag in this.ChipTags)) arr.splice(arr.length - 1, 1);
            else chip.id = this.findTagWithName(chip.tag);

            if (arr.length > maxLength) arr = arr.slice(0, maxLength);

            this.setTagInput(arr);
        });

        jQuery(".chips").on("chip.delete", (e, chip) => {
            let arr = jQuery(".chips-initial").material_chip("data");

            if (!(chip.tag in this.ChipTags)) arr.splice(arr.length - 1, 1);
            else chip.id = this.findTagWithName(chip.tag);

            this.setTagInput(arr);
        });
    }

    setTagInput(arr) {
        jQuery(".chips-initial").material_chip({
            data: arr,
            autocompleteOptions: {
                data: this.ChipTags,
                limit: Infinity,
                minLength: 1
            }
        });
    }

    setTags(arr) {
        const a = [];

        for (let i = 0; i < arr.length; i++) {
            if (!this.Planet.TagsManifest || !this.Planet.TagsManifest[arr[i]]) {
                continue; // Skip tag if it's missing from the dynamic manifest
            }
            const o = {};
            o.tag = this.Planet.TagsManifest[arr[i]].TagName;
            o.id = arr[i];
            a.push(o);
        }
        this.setTagInput(a);
    }

    getTags() {
        const t = jQuery(".chips-initial").material_chip("data");
        const a = [];

        for (let i = 0; i < t.length; i++) a.push(t[i].id);

        return a;
    }

    initSubmit() {
        document
            .getElementById("publisher-submit")
            .addEventListener("click", this.publishProject.bind(this));
    }

    open(id, IsShareLink) {
        this.IsShareLink = IsShareLink === undefined ? false : IsShareLink;
        const name = this.ProjectTable[id].ProjectName;
        let image = this.ProjectTable[id].ProjectImage;
        const published = this.ProjectTable[id].PublishedData;
        const gitRepoData = this.ProjectTable[id].GitRepoData || null;
        const DATA = this.ProjectTable[id].ProjectData;

        // Description priority: previously published > git repo (fork source) > empty
        const description =
            published && published.ProjectDescription
                ? published.ProjectDescription
                : gitRepoData && gitRepoData.description
                  ? gitRepoData.description
                  : "";

        // Tags priority: previously published > git repo (fork source) > auto-detected from blocks
        const tags =
            published && published.ProjectTags
                ? published.ProjectTags
                : gitRepoData && gitRepoData.tags && gitRepoData.tags.length
                  ? gitRepoData.tags
                  : this.dataToTags(DATA);

        document.getElementById("publisher-ptitle").textContent = _(
            `${published !== null ? "Republish" : "Publish"}  Project`
        );

        const Planet = this.Planet;

        if (Planet.ConnectedToServer) {
            document.getElementById("publish-description").value = description;
            document.getElementById("publish-description-label").setAttribute("data-error", "");
            this.setTags(tags);
            document.getElementById("publish-id").value = id;
            document.getElementById("publish-title").value = name;
            document.getElementById("publish-title-label").setAttribute("data-error", "");

            if (image === null) {
                image = Planet.IsMusicBlocks ? this.PlaceholderMBImage : this.PlaceholderTBImage;
            }

            document.getElementById("publish-image").src = image;
            document.getElementById("publisher-error").textContent = "";
            document.getElementById("publisher-error").style.display = "none";
            Materialize.updateTextFields();
        }

        jQuery("#publisher").modal("open");
    }

    publishProject() {
        const Planet = this.Planet;

        document.getElementById("publisher-error").textContent = "";
        document.getElementById("publisher-error").style.display = "none";
        document.getElementById("publisher-progress").style.visibility = "visible";

        let errors = false;
        const id = document.getElementById("publish-id").value;
        const title = document.getElementById("publish-title");
        const titlelabel = document.getElementById("publish-title-label");

        if (title.value.length < this.TitleLowerBound) {
            errors = true;
            titlelabel.setAttribute("data-error", _("This field is required"));
            title.classList.add("invalid");
            titlelabel.classList.add("active");
        }

        if (title.value.length > this.TitleUpperBound) {
            errors = true;
            titlelabel.setAttribute("data-error", _("Title too long"));
            title.classList.add("invalid");
            titlelabel.classList.add("active");
        }

        const description = document.getElementById("publish-description");
        const descriptionlabel = document.getElementById("publish-description-label");

        if (description.value.length < this.DescriptionLowerBound) {
            errors = true;
            descriptionlabel.setAttribute("data-error", _("This field is required"));
            description.classList.add("invalid");
            descriptionlabel.classList.add("active");
        }

        if (description.value.length > this.DescriptionUpperBound) {
            errors = true;
            descriptionlabel.setAttribute("data-error", _("Description too long"));
            description.classList.add("invalid");
            descriptionlabel.classList.add("active");
        }

        if (errors === true) this.hideProgressBar();
        else {
            const submitobj = {};
            submitobj.ProjectID = id;
            submitobj.ProjectName = title.value;
            submitobj.ProjectDescription = description.value;
            submitobj.ProjectSearchKeywords = this.parseProject(this.ProjectTable[id].ProjectData);
            // GitServerInterface expects the raw project JSON object, not encoded TB.
            // If ProjectData is a string, parse it; if already an object, use as-is.
            let rawProjectData = this.ProjectTable[id].ProjectData;
            try {
                rawProjectData =
                    typeof rawProjectData === "string"
                        ? JSON.parse(rawProjectData)
                        : rawProjectData;
            } catch (_) {
                /* keep as string */
            }
            submitobj.ProjectData = rawProjectData;
            submitobj.ProjectImage = this.ProjectTable[id].ProjectImage;
            submitobj.ProjectIsMusicBlocks = Planet.IsMusicBlocks ? 1 : 0;
            submitobj.ProjectCreatorName = Planet.ProjectStorage.getDefaultCreatorName();
            // Convert tag objects to comma-separated theme string for the new backend
            const tagArr = this.getTags(); // returns array of tag-id strings
            submitobj.ProjectTags = tagArr; // kept for legacy compat
            submitobj.theme = tagArr.join(","); // new backend field
            submitobj.repoName = title.value;
            submitobj.description = description.value;
            submitobj.creatorName = Planet.ProjectStorage.getDefaultCreatorName();

            const published = {};
            published.ProjectDescription = description.value;
            published.ProjectTags = tagArr;
            document.getElementById("publisher-submit").style.cursor = "wait";
            document.getElementById("publisher-cancel").style.cursor = "wait";

            for (
                let i = 0;
                i < document.getElementById("publisher-form").getElementsByTagName("INPUT").length;
                i++
            )
                document.getElementById("publisher-form").getElementsByTagName("INPUT")[
                    i
                ].style.cursor = "wait";

            for (
                let i = 0;
                i <
                document.getElementById("publisher-form").getElementsByTagName("TEXTAREA").length;
                i++
            )
                document.getElementById("publisher-form").getElementsByTagName("TEXTAREA")[
                    i
                ].style.cursor = "wait";

            document.body.style.cursor = "wait";

            // ── Determine publish path ────────────────────────────────────
            // Check if this project already has a GitHub repo:
            //   1. GitRepoData.repoName — set when a project was forked
            //      (repo exists, visible=0, just needs flipping to 1)
            //   2. PublishedData.repoName — set after a prior successful publish
            //      (repo exists, visible=1, user is re-publishing after an edit)
            // If neither exists, create a fresh repo then publish.
            const projectEntry = this.ProjectTable[id];
            const gitRepoData = projectEntry.GitRepoData;
            const existingPublished = projectEntry.PublishedData;

            const existingRepoName =
                gitRepoData && gitRepoData.repoName
                    ? gitRepoData.repoName
                    : existingPublished && existingPublished.repoName
                      ? existingPublished.repoName
                      : null;
            const existingKey = existingRepoName
                ? Planet.ServerInterface.getKey(existingRepoName)
                : null;

            if (existingRepoName && existingKey) {
                // ── REPO EXISTS: just flip visible=1 ─────────────────────
                // The project is already on GitHub — no new repo needed.
                // Also pass the current title, description, and tags so SQLite
                // is updated to what the student chose before publishing.
                published.repoName = existingRepoName;

                const descriptionVal = document.getElementById("publish-description").value || "";
                const tagsVal = this.getTags();
                // Capture the thumbnail at publish time — this is the canonical image.
                // It is whatever is on the student's canvas right now, which may differ
                // from what was saved at repo-creation time (e.g. blank canvas).
                const thumbnailVal = this.ProjectTable[id].ProjectImage || null;

                Planet.ServerInterface.publishProject(
                    existingRepoName,
                    existingKey,
                    publishData => {
                        const combined = {
                            success: publishData.success,
                            error: publishData.error || null
                        };
                        this.afterPublishProject(combined, id, title.value, published);
                    },
                    title.value, // updated project name
                    descriptionVal, // updated description
                    tagsVal, // updated tags
                    thumbnailVal // canonical thumbnail = canvas state right now
                );
            } else {
                // ── NO REPO YET: create one, then publish ─────────────────
                const send = JSON.stringify(submitobj);

                Planet.ServerInterface.addProject(send, createData => {
                    if (!createData.success) {
                        this.afterPublishProject(createData, id, title.value, published);
                        return;
                    }

                    const repoName = createData.repository;
                    const key = createData.key;

                    // Store the repo slug so LocalCard can link to it later.
                    published.repoName = repoName;

                    const descriptionVal =
                        document.getElementById("publish-description").value || "";
                    const tagsVal = this.getTags();
                    Planet.ProjectStorage.addGitRepoData(id, repoName, descriptionVal, tagsVal, key)
                        .then(() => Planet._postGitState(id))
                        .catch(e => console.error(e));

                    // Capture the thumbnail at publish time (canonical image).
                    const thumbnailVal = this.ProjectTable[id].ProjectImage || null;

                    Planet.ServerInterface.publishProject(
                        repoName,
                        key,
                        publishData => {
                            const combined = {
                                success: publishData.success,
                                error: publishData.error || null
                            };
                            this.afterPublishProject(combined, id, title.value, published);
                        },
                        undefined, // projectName already set during /create
                        undefined, // description already set during /create
                        undefined, // tags already set during /create
                        thumbnailVal // canonical thumbnail = canvas state right now
                    );
                });
            }
        }
    }

    /**
     * parseProject(tb)
     * Convert project TB to a space-separated list of block names suitable for
     * ProjectSearchKeywords. When possible (i.e., when running inside the main
     * Music Blocks iframe) attempt to map proto names to human-friendly display
     * names using the palettes API (getProtoNameAndPalette). If palettes are not
     * available fall back to the raw proto names.
     *
     * @param {string} tb - JSON string of project blocks
     * @returns {string} space-separated block names
     */
    parseProject(tb) {
        try {
            tb = JSON.parse(tb);
        } catch (error) {
            console.error("Publisher: Failed to parse project data for keyword extraction.", error);
            return "";
        }

        const words = new Set();

        for (let i = 0; i < tb.length; i++) {
            const block = tb[i];

            let name = null;

            if (typeof block[1] === "string") {
                name = block[1];
            } else if (Array.isArray(block[1])) {
                name = block[1][0];
            } else if (typeof block[1] === "number") {
                break;
            }

            if (name === null) continue;

            // Resolve proto name to display name using the lookup map provided
            // by the parent via postMessage, instead of directly accessing
            // window.parent.activity.blocks.palettes.
            try {
                if (window._mbBlockDisplayNames && window._mbBlockDisplayNames[name]) {
                    name = window._mbBlockDisplayNames[name];
                }
            } catch (e) {
                // ignore and use raw name
            }

            words.add(name);
        }

        let s = "";
        for (const item of words) s += `${item} `;

        return s.slice(0, -1);
    }

    hideProgressBar() {
        document.getElementById("publisher-progress").style.visibility = "hidden";
    }

    afterPublishProject(data, id, name, published) {
        const Planet = this.Planet;

        if (data.success) {
            Planet.ProjectStorage.addPublishedData(id, published);
            Planet.ProjectStorage.renameProject(id, name);
            this.hideProgressBar();
            this.close();
            Planet.LocalPlanet.updateProjects();
            Planet.GlobalPlanet.refreshProjects();

            if (this.IsShareLink)
                document.getElementById("sharebox-" + id).style.display = "initial";
        } else {
            this.throwError(_("Server Error") + " (" + data.error + ") - " + _("Try Again"));
            this.hideProgressBar();
        }

        document.getElementById("publisher-submit").style.cursor = "pointer";
        document.getElementById("publisher-cancel").style.cursor = "pointer";

        for (
            let i = 0;
            i < document.getElementById("publisher-form").getElementsByTagName("INPUT").length;
            i++
        )
            document.getElementById("publisher-form").getElementsByTagName("INPUT")[
                i
            ].style.cursor = "text";

        for (
            let i = 0;
            i < document.getElementById("publisher-form").getElementsByTagName("TEXTAREA").length;
            i++
        )
            document.getElementById("publisher-form").getElementsByTagName("TEXTAREA")[
                i
            ].style.cursor = "text";

        document.body.style.cursor = "default";
    }

    throwError(error) {
        document.getElementById("publisher-error").textContent = error;
        document.getElementById("publisher-error").style.display = "initial";
    }

    close() {
        jQuery("#publisher").modal("close");
    }

    init() {
        const Planet = this.Planet;

        if (!Planet.ConnectedToServer) {
            let element = document.getElementById("publisher-form");
            element.parentNode.removeChild(element);
            element = document.getElementById("publisher-submit");
            element.parentNode.removeChild(element);
            const frag = document.createRange().createContextualFragment(this.PublisherOfflineHTML);
            document.getElementById("publisher-content").appendChild(frag);
        } else {
            this.addTags();
            this.initSubmit();
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { Publisher };
}
