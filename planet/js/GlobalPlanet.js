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

   _, GlobalTag, GlobalCard, jQuery, currentUserScrollPos:true,
   maxScrollPos:true, ProjectViewer, debounce
*/
/*
   exported

   GlobalPlanet
*/

class GlobalPlanet {
    
    constructor(Planet) {
        this.Planet = Planet ;
        this.ProjectViewer = null;

        this.offlineHTML = `<div class= "container center-align">
                            ${_(`Feature unavailable - cannot connect to server. Reload ${Planet.IsMusicBlocks ? "Music" : "Turtle"} Blocks to try again.`)}
                            </div>`;
    
        this.noProjects  = `<div class= "container center-align">${_("No results found.")}</div>` ;
        this.tags = [];
        this.specialTags = null;
        this.defaultTag = false;
        this.defaultMainTags = [];
        this.searchMode = null;
        this.index = 0;
        this.page = 24;
        this.sortBy = null;
        this.cache = {};
        this.loadCount = 0;
        this.cards = [];
        this.loadButtonShown = true;
        this.searching = false;
        this.searchString = "";
        this.oldSearchString = "";
        this.remixPrefix = _("Remix of");
    }

    initTagList() {
        const Planet = this.Planet ;
        let t;

        for (let i = 0; i < this.specialTags.length; i++) {
            t = new GlobalTag(Planet);
            t.init(this.specialTags[i]);
            this.tags.push(t);

            if (this.specialTags[i].defaultTag === true)
                this.defaultTag = t;
        }

        const tagsToInitialise = [];

        const keys = Object.keys(Planet.TagsManifest);
        for (let i = 0; i < keys.length; i++) {
            t = new GlobalTag(Planet);
            t.init({"id": keys[i]});
            this.tags.push(t);
            if (this.defaultMainTags.indexOf(Planet.TagsManifest[keys[i]].TagName)!=-1){
                t.selected=true;
                tagsToInitialise.push(t);
            }
        }

        this.sortBy = document.getElementById("sort-select").value;

        if (this.defaultTag!=false)
            this.selectSpecialTag(this.defaultTag);

        for (let i = 0; i<tagsToInitialise.length; i++)
            tagsToInitialise[i].select();
        
        this.refreshTagList();
    };

    selectSpecialTag(tag) {
        for (let i = 0; i < this.tags.length; i++)
            this.tags[i].unselect();

        tag.select();
        tag.func();
    };

    unselectSpecialTags() {
        for (let i = 0; i < this.tags.length; i++)
            if (this.tags[i].specialTag)
                this.tags[i].unselect();
    };

    refreshTagList() {
        const tagids = [];

        for (let i = 0; i < this.tags.length; i++)
            if (this.tags[i].specialTag === false && this.tags[i].selected === true) 
                tagids.push(this.tags[i].id);

        if (tagids.length === 0)
            this.selectSpecialTag(this.defaultTag);

        else {
            this.unselectSpecialTags();
            this.searchTags(tagids);
        }
    };

    searchAllProjects() {
        this.searchMode = "ALL_PROJECTS";
        this.refreshProjects();
    };

    searchMyProjects() {
        this.searchMode = "USER_PROJECTS";
        this.refreshProjects();
    };

    searchTags(tagids) {
        this.searchMode = JSON.stringify(tagids);
        this.refreshProjects();
    };

    refreshProjects() {
        const Planet = this.Planet ;

        this.index = 0;
        this.cards = [];
        document.getElementById("global-projects").innerHTML = "";
        this.showLoading();
        this.hideLoadMore();

        if (this.oldSearchString !== "") {
            Planet.ServerInterface.searchProjects(
                this.oldSearchString,
                this.sortBy,
                this.index,
                this.index + this.page + 1,
                this.afterRefreshProjects.bind(this)
            );
        }
        else {
            Planet.ServerInterface.downloadProjectList(
                this.searchMode,
                this.sortBy,
                this.index,
                this.index + this.page + 1,
                this.afterRefreshProjects.bind(this)
            );
        }
    };
    
    loadMoreProjects() {
        const Planet = this.Planet ; 

        this.showLoading();
        this.hideLoadMore();

        if (this.oldSearchString !== "") {
            Planet.ServerInterface.searchProjects(
                this.oldSearchString,
                this.sortBy,
                this.index,
                this.index + this.page + 1,
                this.afterRefreshProjects.bind(this)
            );
        } 
        else {
            Planet.ServerInterface.downloadProjectList(
                this.searchMode,
                this.sortBy,
                this.index,
                this.index + this.page + 1,
                this.afterRefreshProjects.bind(this)
            );
        }
    };

    search() {
        const Planet = this.Planet ; 

        if (!this.searching) {
            if (this.searchString === "") {
                this.oldSearchString = "";
                this.searching = false;
                this.showTags();
            } 
            else {
                this.searching = true;
                this.hideTags();
            }

            this.oldSearchString = this.searchString;
            this.index = 0;
            this.cards = [];
            document.getElementById("global-projects").innerHTML = "";
            this.showLoading();
            this.hideLoadMore();
            Planet.ServerInterface.searchProjects(
                this.oldSearchString,
                this.sortBy,
                this.index,
                this.index + this.page + 1,
                this.afterRefreshProjects.bind(this)
            );
        }
    };

    afterSearch() {
        this.searching = false;

        if (this.searchString !== this.oldSearchString)
            this.search();
    };

    afterRefreshProjects(data) {
        data.success ? this.addProjects(data.data) : this.throwOfflineError() ;
    };

    addProjects(data) {
        const toDownload = [];

        for (let i = 0; i < data.length; i++) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.cache.hasOwnProperty(data[i][0])){
                if (this.cache[data[i][0]].ProjectLastUpdated !== data[i][1])
                    toDownload.push(data[i]);
            }
            
            else toDownload.push(data[i]);
        }

        this.loadCount = toDownload.length;
        const l = data.length;

        if (l === this.page + 1)
            data.pop();

        if (l === 0) {
            this.throwNoProjectsError();
            this.afterAddProjects();
        }

        else if (this.loadCount === 0) {
            this.render(data);
            (l === this.page + 1) ? this.showLoadMore() : this.hideLoadMore();
        }

        else if (l === this.page + 1) {
            this.downloadProjectsToCache(toDownload, function() {
                this.render(data);this.showLoadMore();
            }.bind(this));
        }

        else {
            this.downloadProjectsToCache(toDownload, function() {
                this.render(data);this.hideLoadMore();
            }.bind(this));
        }
    };

    downloadProjectsToCache(data, callback) {
        const Planet = this.Planet ;
        this.loadCount = data.length;

        for (let i = 0; i < data.length; i++) {
            (function() {
                const id = data[i][0];
                Planet.ServerInterface.getProjectDetails(id, function(d) {
                    const tempid = id;
                    this.addProjectToCache(tempid, d, callback);
                }.bind(this));
            }.bind(this))();
        }
    };

    addProjectToCache(id, data, callback) {
        if (data.success) {
            this.cache[id] = data.data;
            this.cache[id].ProjectData = null;
            this.loadCount -= 1;

            if (this.loadCount <= 0)
                callback();
        } 
        else this.throwOfflineError();
    };

    forceAddToCache(id, callback) {
        this.Planet.ServerInterface.getProjectDetails(id, function(d) {
            this.addProjectToCache(id, d, callback);
        }.bind(this));
    };

    afterForceAddToCache (id, data, callback) {
        if (data.success) {
            this.cache[id] = data.data;
            this.cache[id].ProjectData = null;
            callback();
        } 
        
        else this.throwOfflineError();
    };

    getData(id, callback, error) {
        if (error === undefined)
            error = null;

        if (this.cache[id] === undefined || this.cache[id].ProjectData === null)
            this.downloadDataToCache(id, callback, error);

        else  callback(this.cache[id].ProjectData);
    };

    downloadDataToCache(id, callback, error) {
        if (error === undefined)
            error = null;
    
        this.Planet.ServerInterface.downloadProject(id, function(data) {
            this.afterDownloadData(id, data, callback, error);
        }.bind(this));
    };

    afterDownloadData(id, data, callback, error) {
        const Planet = this.Planet ;

        if (error === undefined)
            error = null;

        if (data.success) {
            if (id in this.cache) {
                this.cache[id].ProjectData = Planet.ProjectStorage.decodeTB(data.data);
                callback(this.cache[id].ProjectData);
            }

            else callback(Planet.ProjectStorage.decodeTB(data.data));
        }
        
        else {
            if (error !== null)
                error();
        }
    };

    cleanContainer() {
        const element = document.getElementById("global-projects").firstElementChild ;
        const list = element?.classList ?? "empty" ;

        if (list === "empty")
            return ;

        list.forEach(name => {
            if (name === "container" || name === "center-align") {
                element.remove() ;
                return ;
            }
        });
    } ;

    render(data) {
        // Make sure the container doesn't display the offlineHTML or noProjectsHTML even when cards are being rendered.
        this.cleanContainer() ;

        for (let i = 0; i < data.length; i++) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.cache.hasOwnProperty(data[i][0])) {
                const g = new GlobalCard(this.Planet);
                g.init(data[i][0]);
                g.render();
                this.cards.push(g);
            } else {
                this.throwOfflineError();
                return;
            }
        }

        jQuery(".tooltipped").tooltip({delay: 50});
        this.afterAddProjects();
    };

    afterAddProjects() {
        this.index += this.page;
        this.hideLoading();

        if (this.oldSearchString !== "")
            this.afterSearch();
    };

    throwOfflineError() {
        this.hideLoading();
        this.hideLoadMore();

        const element = document.getElementById("global-projects") ;
        element.innerHTML = "";
        element.insertAdjacentHTML("afterbegin", this.offlineHTML);
    };

    throwNoProjectsError() {
        this.hideLoading();
        this.hideLoadMore();

        const element = document.getElementById("global-projects") ;
        element.innerHTML = "";
        element.insertAdjacentHTML("afterbegin", this.noProjects);
    };

    hideLoading() {
        document.getElementById("global-load").style.display = "none";
    };

    showLoading() {
        document.getElementById("global-load").style.display = "block";
    };

    hideLoadMore() {
        document.getElementById("load-more-projects").style.display = "none";
        this.loadButtonShown = false;
    };

    showLoadMore() {
        const l = document.getElementById("load-more-projects");
        l.style.display = "block";
        l.classList.remove("disabled");
        this.loadButtonShown = true;
    };

    hideTags() {
        document.getElementById("tagscontainer").style.display = "none";
    };

    showTags() {
        document.getElementById("tagscontainer").style.display = "block";
    };

    openGlobalProject (id, error) {
        const Planet = this.Planet ; 

        if (error === undefined)
            error = null;

        this.getData(id, (data) => {
            let remixedName;
            if (id in this.cache) {
                remixedName = `${this.remixPrefix} ${this.cache[id].ProjectName}`;
                Planet.ProjectStorage.initialiseNewProject(
                    remixedName, data, this.cache[id].ProjectImage
                );
            } else {
                remixedName = `${this.remixPrefix}  ${_("My Project")}` ;
                Planet.ProjectStorage.initialiseNewProject(
                    remixedName, data, null
                );
            }

            Planet.loadProjectFromData(data);
        }, error);
    };

    mergeGlobalProject (id, error) {
        const Planet = this.Planet ; 

        if (error === undefined)
            error = null;

        this.getData(id, (data) => {
            let remixedName;
            if (id in this.cache) {
                remixedName = Planet.ProjectStorage.getCurrentProjectName();
                Planet.ProjectStorage.initialiseNewProject(
                    remixedName, data, this.cache[id].ProjectImage
                );
            }
            else {
                remixedName = `${this.remixPrefix}  ${_("My Project")}` ;
                Planet.ProjectStorage.initialiseNewProject(
                    remixedName, data, null
                );
            }

            Planet.loadProjectFromData(data, true);
        }, error);
    };
    
    init() {
        const Planet = this.Planet ;
        
        if (!Planet.ConnectedToServer) {
            document.getElementById("globaltitle").textContent = _("Cannot connect to server");
            document.getElementById("globalcontents").innerHTML = "" ;
            document.getElementById("globalcontents").insertAdjacentHTML("afterbegin",this.offlineHTML);
        }
        else {
            // eslint-disable-next-line no-unused-vars
            jQuery("#sort-select").material_select( (evt) => {
                this.sortBy = document.getElementById("sort-select").value;
                this.refreshProjects();
            });


            if (Planet.IsMusicBlocks){
                this.defaultMainTags = ["Music"];
                this.specialTags = [
                    {"name": "All Projects", "func": this.searchAllProjects.bind(this), "defaultTag": true},
                    {"name": "My Projects", "func": this.searchMyProjects.bind(this), "defaultTag": false}
                ];
            } else {
                this.defaultMainTags = [];
                this.specialTags = [
                    {"name": "All Projects", "func": this.searchAllProjects.bind(this), "defaultTag": true},
                    {"name": "My Projects", "func": this.searchMyProjects.bind(this), "defaultTag": false}
                ];
            }

            this.initTagList();

            // eslint-disable-next-line no-unused-vars
            document.getElementById("load-more-projects").addEventListener("click",  (evt) => {
                if (this.loadButtonShown) {
                    this.loadMoreProjects();
                }
            });

            const debouncedfunction = debounce(this.search.bind(this), 250);

            // eslint-disable-next-line no-unused-vars
            document.getElementById("global-search").addEventListener("input",  (evt) => {
                this.searchString = document.getElementById("global-search").value;
                debouncedfunction();
            });

            // eslint-disable-next-line no-unused-vars
            document.getElementById("search-close").addEventListener("click",  (evt) => {
                document.getElementById("global-search").value = "";
                this.searchString = "";
                document.getElementById("search-close").style.display = "none";
                debouncedfunction();
            });
            
            document.body.onscroll = () => {
                const currentUserScrollPos = window.pageYOffset ||
                                                    document.documentElement.scrollTop;

                const maxScrollPos = Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight
                );
                
                if (((currentUserScrollPos/maxScrollPos) * 100 >= 75) && this.loadButtonShown)
                    this.loadMoreProjects();
            };

            this.ProjectViewer = new ProjectViewer(Planet);
            this.ProjectViewer.init();
        }
    };

}