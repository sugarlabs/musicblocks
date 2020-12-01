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

function GlobalPlanet(Planet) {
    this.ProjectViewer = null;
    this.offlineHTML = '<div class="container center-align">' + _('Feature unavailable - cannot connect to server. Reload Music Blocks to try again.') + '</div>';
    this.noProjects = '<div class="container center-align">' + _('No results found.') + '</div>';
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
    this.searchString = '';
    this.oldSearchString = '';
    this.remixPrefix = _('Remix of');

    this.initTagList = function() {
        let t;
        for (let i = 0; i < this.specialTags.length; i++) {
            t = new GlobalTag(Planet);
            t.init(this.specialTags[i]);
            this.tags.push(t);
            if (this.specialTags[i].defaultTag === true) {
                this.defaultTag = t;
            }
        }

        let tagsToInitialise = [];

        let keys = Object.keys(Planet.TagsManifest);
        for (let i = 0; i < keys.length; i++) {
            t = new GlobalTag(Planet);
            t.init({'id': keys[i]});
            this.tags.push(t);
            if (this.defaultMainTags.indexOf(Planet.TagsManifest[keys[i]].TagName)!=-1){
                t.selected=true;  
                tagsToInitialise.push(t);
            }
        }

        this.sortBy = document.getElementById('sort-select').value;
        if (this.defaultTag!=false){
            this.selectSpecialTag(this.defaultTag);
        }

        for (let i = 0; i<tagsToInitialise.length; i++){
            tagsToInitialise[i].select();
        }
        this.refreshTagList();
    };

    this.selectSpecialTag = function(tag) {
        for (let i = 0; i < this.tags.length; i++) {
            this.tags[i].unselect();
        }
        tag.select();
        tag.func();
    };

    this.unselectSpecialTags = function() {
        for (let i = 0; i < this.tags.length; i++) {
            if (this.tags[i].specialTag) {
                this.tags[i].unselect();
            }
        }
    };

    this.refreshTagList = function() {
        let tagids = [];
        for (let i = 0; i < this.tags.length; i++) {
            if (this.tags[i].specialTag === false && this.tags[i].selected === true) {
                tagids.push(this.tags[i].id);
            }
        }

        if (tagids.length === 0) {
            this.selectSpecialTag(this.defaultTag);
        } else {
            this.unselectSpecialTags();
            this.searchTags(tagids);
        }
    };

    this.searchAllProjects = function() {
        this.searchMode = 'ALL_PROJECTS';
        this.refreshProjects();
    };

    this.searchMyProjects = function() {
        this.searchMode = 'USER_PROJECTS';
        this.refreshProjects();
    };

    this.searchTags = function(tagids) {
        this.searchMode = JSON.stringify(tagids);
        this.refreshProjects();
    };

    this.refreshProjects = function() {
        this.index = 0;
        this.cards = [];
        document.getElementById('global-projects').innerHTML = '';
        this.showLoading();
        this.hideLoadMore();
        if (this.oldSearchString !== '') {
            Planet.ServerInterface.searchProjects(this.oldSearchString, this.sortBy, this.index, this.index + this.page + 1, this.afterRefreshProjects.bind(this));
        } else {
            Planet.ServerInterface.downloadProjectList(this.searchMode, this.sortBy, this.index, this.index + this.page + 1, this.afterRefreshProjects.bind(this));
        }
    };

    this.loadMoreProjects = function() {
        this.showLoading();
        this.hideLoadMore();
        if (this.oldSearchString !== '') {
            Planet.ServerInterface.searchProjects(this.oldSearchString, this.sortBy, this.index, this.index + this.page + 1, this.afterRefreshProjects.bind(this));
        } else {
            Planet.ServerInterface.downloadProjectList(this.searchMode, this.sortBy, this.index, this.index + this.page + 1, this.afterRefreshProjects.bind(this));
        }
    };

    this.search = function() {
        if (!this.searching) {
            if (this.searchString === '') {
                this.oldSearchString = '';
                this.searching = false;
                this.showTags();
            } else {
                this.searching = true;
                this.hideTags();
            }

            this.oldSearchString = this.searchString;
            this.index = 0;
            this.cards = [];
            document.getElementById('global-projects').innerHTML = '';
            this.showLoading();
            this.hideLoadMore();
            Planet.ServerInterface.searchProjects(this.oldSearchString, this.sortBy, this.index, this.index + this.page + 1, this.afterRefreshProjects.bind(this));
        }
    };

    this.afterSearch = function() {
        this.searching = false;
        if (this.searchString !== this.oldSearchString) {
            this.search();
        }
    };

    this.afterRefreshProjects = function(data) {
        if (data.success) {
            this.addProjects(data.data);
        } else {
            this.throwOfflineError();
        }
    };

    this.addProjects = function(data) {
        let toDownload = [];
        for (let i = 0; i < data.length; i++) {
            if (this.cache.hasOwnProperty(data[i][0])) {
                if (this.cache[data[i][0]].ProjectLastUpdated !== data[i][1]) {
                    toDownload.push(data[i]);
                }
            } else {
                toDownload.push(data[i]);
            }
        }

        this.loadCount = toDownload.length;
        let l = data.length;
        if (l === this.page + 1) {
            data.pop();
        }

        if (l === 0) {
            this.throwNoProjectsError();
            this.afterAddProjects();
        } else if (this.loadCount === 0) {
            this.render(data);
            if (l === this.page + 1) {
                this.showLoadMore();
            } else {
                this.hideLoadMore();
            }
        } else if (l === this.page + 1) {
            this.downloadProjectsToCache(toDownload, function() {
                this.render(data);this.showLoadMore();
            }.bind(this));
        } else {
            this.downloadProjectsToCache(toDownload, function() {
                this.render(data);this.hideLoadMore();
            }.bind(this));
        }
    };

    this.downloadProjectsToCache = function(data, callback) {
        this.loadCount = data.length;
        for (let i = 0; i < data.length; i++) {
            (function() {
                let id = data[i][0];
                Planet.ServerInterface.getProjectDetails(id, function(d) {
                    let tempid = id;
                    this.addProjectToCache(tempid, d, callback)
                }.bind(this));
            }.bind(this))();
        }
    };

    this.addProjectToCache = function(id, data, callback) {
        if (data.success) {
            this.cache[id] = data.data;
            this.cache[id].ProjectData = null;
            this.loadCount -= 1;
            if (this.loadCount <= 0) {
                callback();
            }
        } else {
            this.throwOfflineError();
        }
    };

    this.forceAddToCache = function(id, callback) {
        Planet.ServerInterface.getProjectDetails(id, function(d) {
            this.addProjectToCache(id, d, callback)
        }.bind(this));
    };

    this.afterForceAddToCache = function(id, data, callback) {
        if (data.success) {
            this.cache[id] = data.data;
            this.cache[id].ProjectData = null;
            callback();
        } else {
            this.throwOfflineError();
        }
    };

    this.getData = function(id, callback, error) {
        if (error === undefined) {
            error = null;
        }

        if (this.cache[id] === undefined || this.cache[id].ProjectData === null) {
            this.downloadDataToCache(id, callback, error);
        } else {
            callback(this.cache[id].ProjectData);
        }
    };

    this.downloadDataToCache = function(id, callback, error) {
        if (error === undefined) {
            error = null;
        }
    
        Planet.ServerInterface.downloadProject(id, function(data) {
            this.afterDownloadData(id, data, callback, error)
        }.bind(this));
    };

    this.afterDownloadData = function(id, data, callback, error) {
        if (error === undefined) {
            error = null;
        }

        if (data.success) {
            if (id in this.cache) {
                this.cache[id].ProjectData = Planet.ProjectStorage.decodeTB(data.data);
                callback(this.cache[id].ProjectData);
            } else {
                callback(Planet.ProjectStorage.decodeTB(data.data));
            }
        } else {
            if (error !== null) {
                error();
            }
        }
    };

    this.render = function(data) {
        for (let i = 0; i < data.length; i++) {
            if (this.cache.hasOwnProperty(data[i][0])) {
                let g = new GlobalCard(Planet);
                g.init(data[i][0]);
                g.render();
                this.cards.push(g);
            } else {
                this.throwOfflineError();
                return;
            }
        }

        jQuery('.tooltipped').tooltip({delay: 50});
        this.afterAddProjects();
    };

    this.afterAddProjects = function() {
        this.index += this.page;
        this.hideLoading();
        if (this.oldSearchString !== '') {
            this.afterSearch();
        }
    };

    this.throwOfflineError = function() {
        this.hideLoading();
        this.hideLoadMore();
        document.getElementById('global-projects').innerHTML = this.offlineHTML;
    };

    this.throwNoProjectsError = function() {
        this.hideLoading();
        this.hideLoadMore();
        document.getElementById('global-projects').innerHTML = this.noProjects;
    };

    this.hideLoading = function() {
        document.getElementById('global-load').style.display = 'none';
    };

    this.showLoading = function() {
        document.getElementById('global-load').style.display = 'block';
    };

    this.hideLoadMore = function() {
        document.getElementById('load-more-projects').style.display = 'none';
        this.loadButtonShown = false;
    };

    this.showLoadMore = function() {
        let l = document.getElementById('load-more-projects');
        l.style.display = 'block';
        l.classList.remove('disabled');
        this.loadButtonShown = true;
    };

    this.hideTags = function() {
        document.getElementById('tagscontainer').style.display = 'none';
    };

    this.showTags = function() {
        document.getElementById('tagscontainer').style.display = 'block';
    };

    this.openGlobalProject = function(id, error) {
        if (error === undefined) {
            error = null;
        }

        let that = this;
        this.getData(id, function(data) {
            let remixedName;
            if (id in that.cache) {
                remixedName = that.remixPrefix + ' ' + that.cache[id].ProjectName;
                Planet.ProjectStorage.initialiseNewProject(remixedName, data, that.cache[id].ProjectImage);
            } else {
                remixedName = that.remixPrefix + ' ' + _('My Project');
                Planet.ProjectStorage.initialiseNewProject(remixedName, data, null);
            }

            Planet.loadProjectFromData(data);
        }, error);
    };

    this.mergeGlobalProject = function(id, error) {
        if (error === undefined) {
            error = null;
        }

        let that = this;
        this.getData(id, function(data) {
            let remixedName;
            if (id in that.cache) {
                remixedName = Planet.ProjectStorage.getCurrentProjectName();
                Planet.ProjectStorage.initialiseNewProject(remixedName, data, that.cache[id].ProjectImage);
            } else {
                remixedName = that.remixPrefix + ' ' + _('My Project');
                Planet.ProjectStorage.initialiseNewProject(remixedName, data, null);
            }

            Planet.loadProjectFromData(data, true);
        }, error);
    };
    
    this.init = function() {
        if (!Planet.ConnectedToServer) {
            document.getElementById('globaltitle').textContent = _('Cannot connect to server');
            document.getElementById('globalcontents').innerHTML = this.offlineHTML;
        } else {
            let that = this;

            jQuery('#sort-select').material_select(function (evt) {
                that.sortBy = document.getElementById('sort-select').value;
                that.refreshProjects();
            });


            if (Planet.IsMusicBlocks){
                this.defaultMainTags = ["Music"];
                this.specialTags = 
                [{'name': 'All Projects', 'func': this.searchAllProjects.bind(this), 'defaultTag': true}, 
                 {'name': 'My Projects', 'func': this.searchMyProjects.bind(this), 'defaultTag': false}];
            } else {
                this.defaultMainTags = [];
                this.specialTags = 
                [{'name': 'All Projects', 'func': this.searchAllProjects.bind(this), 'defaultTag': true}, 
                 {'name': 'My Projects', 'func': this.searchMyProjects.bind(this), 'defaultTag': false}];
            }

            this.initTagList();

            document.getElementById('load-more-projects').addEventListener('click',  function (evt) {
                if (that.loadButtonShown) {
                    that.loadMoreProjects();
                }
            });

            let debouncedfunction = debounce(this.search.bind(this), 250);

            document.getElementById('global-search').addEventListener('input',  function (evt) {
                that.searchString = this.value;
                debouncedfunction();
            });

            document.getElementById('search-close').addEventListener('click', function (evt) {
                document.getElementById('global-search').value = '';
                that.searchString = '';
                this.style.display = 'none';
                debouncedfunction();
            });
            
            document.body.onscroll = function () {
                currentUserScrollPos = window.pageYOffset || document.documentElement.scrollTop;
                maxScrollPos = Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
                
                if ((currentUserScrollPos/maxScrollPos) * 100 >= 75) {
                    if (that.loadButtonShown) {
                        that.loadMoreProjects();
                    }
               }
            };

            this.ProjectViewer = new ProjectViewer(Planet);
            this.ProjectViewer.init();
        }
    };
};
