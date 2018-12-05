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

function LocalCard(Planet){
    this.PlaceholderMBImage = 'images/mbgraphic.png';
    this.PlaceholderTBImage = 'images/tbgraphic.png';
    this.id = null;
    this.ProjectData = null;
    this.CopySuffix = '(' + _('Copy') + ')';
    this.renderData = '\
<div class="col no-margin-left s12 m6 l4"> \
        <div class="card"> \
                <a class="published-cloud tooltipped" data-position="top" data-delay="50" data-tooltip="'+_('View published project')+'" style="display:none;" id="local-project-cloud-{ID}"><i class="material-icons small">cloud_done</i></a>\
                <div class="card-image"> \
                        <img class="project-image project-card-image" id="local-project-image-{ID}"> \
                        <a class="btn-floating halfway-fab waves-effect waves-light orange tooltipped" data-position="top" data-delay="50" data-tooltip="'+_('Publish project')+'" id="local-project-publish-{ID}"><i class="material-icons">cloud_upload</i></a> \
                </div> \
                <div class="card-content"> \
                        <input class="card-title grey-text text-darken-4" id="local-project-input-{ID}" /> \
                </div> \
                <div class="card-action"> \
                        <div class="flexcontainer"> \
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="'+_('Edit project')+'" id="local-project-edit-{ID}"><i class="material-icons">edit</i></a> \
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="'+_('Delete project')+'" id="local-project-delete-{ID}"><i class="material-icons">delete</i></a> \
                                <div id="share-{ID}"> \
                                        <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="'+_('Share project')+'" id="local-project-share-{ID}"><i class="material-icons">share</i></a> \
                                        <div class="card share-card" id="sharebox-{ID}" style="display:none;"> \
                                                <div class="card-content shareurltext"> \
                                                        <div class="shareurltitle">'+_('Share')+'</div> \
                                                        <input type="text" name="shareurl" class="shareurlinput" data-originalurl="https://musicblocks.sugarlabs.org/index.html?id={ID}"> \
                                                        <div class="shareurl-advanced" id="advanced-{ID}"> \
                                                                <div class="shareurltitle">'+_('Flags')+'</div> \
                                                                <div><input type="checkbox" name="run" id="checkboxrun-{ID}" checked><label for="checkboxrun-{ID}">'+_('Run project on startup.')+'</label></div> \
                                                                <div><input type="checkbox" name="show" id="checkboxshow-{ID}"><label for="checkboxshow-{ID}">'+_('Show code blocks on startup.')+'</label></div> \
                                                                <div><input type="checkbox" name="collapse" id="checkboxcollapse-{ID}"><label for="checkboxcollapse-{ID}">'+_('Collapse code blocks on startup.')+'</label></div> \
                                                        </div> \
                                                </div> \
                                                <div class="card-action"> \
                                                        <a onclick="toggleExpandable(\'advanced-{ID}\',\'shareurl-advanced\');">'+_('Advanced Options')+'</a> \
                                                </div> \
                                        </div> \
                                </div> \
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="'+_('Download project')+'" id="local-project-download-{ID}"><i class="material-icons">file_download</i></a> \
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="'+_('Merge with current project')+'" id="local-project-merge-{ID}"><i class="material-icons">merge_type</i></a> \
                                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="'+_('Duplicate project')+'" id="local-project-duplicate-{ID}"><i class="material-icons">content_copy</i></a> \
                        </div> \
                </div> \
        </div>  \
</div>';

    this.download = function() {
        var image = Planet.ProjectStorage.ImageDataURL;
        if (this.ProjectData.ProjectImage !== null){
            image = this.ProjectData.ProjectImage;
        }

        var description = null;
        if (this.ProjectData.PublishedData !== null){
            description = this.ProjectData.PublishedData.ProjectDescription;
        }

        Planet.SaveInterface.saveHTML(this.ProjectData.ProjectName, this.ProjectData.ProjectData, image, description);
    };

    this.duplicate = function() {
        Planet.ProjectStorage.initialiseNewProject(this.ProjectData.ProjectName + ' ' + this.CopySuffix, this.ProjectData.ProjectData, this.ProjectData.ProjectImage);
        Planet.LocalPlanet.updateProjects();
    };

    this.render = function() {
        // TODO: Have a TB placeholder image specific to TB projects
        var html = this.renderData.replace(new RegExp('\{ID\}', 'g'), this.id);
        var frag = document.createRange().createContextualFragment(html);

        // set image
        if (this.ProjectData.ProjectImage !== null){
            frag.getElementById('local-project-image-' + this.id).src = this.ProjectData.ProjectImage;
        } else if (Planet.IsMusicBlocks==1){
            frag.getElementById('local-project-image-' + this.id).src = this.PlaceholderMBImage;
        } else {
            frag.getElementById('local-project-image-' + this.id).src = this.PlaceholderTBImage;
        }
                
        // set input text
        frag.getElementById('local-project-input-' + this.id).value = this.ProjectData.ProjectName;

        var that = this;

        // set edit modify listener
        frag.getElementById('local-project-edit-' + this.id).addEventListener('click', function (evt) {
            Planet.LocalPlanet.openProject(that.id);
        });

        // set image listener
        frag.getElementById('local-project-image-' + this.id).addEventListener('click', function (evt) {
            Planet.LocalPlanet.openProject(that.id);
        });

        // set merge modify listener
        frag.getElementById('local-project-merge-' + this.id).addEventListener('click', function (evt) {
            Planet.LocalPlanet.openProject(that.id);
        });

        // set input modify listener
        frag.getElementById('local-project-input-' + this.id).addEventListener('input', function (evt) {
            Planet.ProjectStorage.renameProject(that.id, this.value);
        });

        // set delete button listener
        frag.getElementById('local-project-delete-' + this.id).addEventListener('click', function (evt) {
            Planet.LocalPlanet.openDeleteModal(that.id);
        });
                
        // set publish button listener
        frag.getElementById('local-project-publish-' + this.id).addEventListener('click', function (evt) {
            Planet.LocalPlanet.Publisher.open(that.id);
        });

        // set download button listener
        frag.getElementById('local-project-download-' + this.id).addEventListener('click', function (evt) {
            that.download();
        });

        // set duplicate button listener
        frag.getElementById('local-project-duplicate-' + this.id).addEventListener('click', function (evt) {
            that.duplicate();
        });

        // set share button listener
        frag.getElementById('local-project-share-' + this.id).addEventListener('click', function (evt) {
            var s = document.getElementById('sharebox-' + that.id);
            if (s.style.display === 'none') {
                if (that.ProjectData.PublishedData !== null) {
                    s.style.display = 'initial';
                    hideOnClickOutside([document.getElementById('share-' + that.id)], 'sharebox-' + that.id);
                } else {
                    Planet.LocalPlanet.Publisher.open(that.id, true);
                }
            } else {
                s.style.display = 'none';
            }
        });

        // set share checkbox listener
        frag.getElementById('checkboxrun-' + this.id).addEventListener('click', function (evt) {
            updateCheckboxes('sharebox-' + that.id);
        });

        frag.getElementById('checkboxshow-' + this.id).addEventListener('click', function (evt) {
            updateCheckboxes('sharebox-' + that.id);
        });

        frag.getElementById('checkboxcollapse-' + this.id).addEventListener('click', function (evt) {
            updateCheckboxes('sharebox-' + that.id);
        });

        // set published cloud listener
        if (this.ProjectData.PublishedData !== null){
            frag.getElementById('local-project-cloud-' + this.id).style.display = 'initial';
            frag.getElementById('local-project-cloud-' + this.id).addEventListener('click', function (evt) {
                // TODO: Implement view-published-project thing
                document.getElementById('global-tab').click();
                Planet.GlobalPlanet.forceAddToCache(that.id, function() {
                    Planet.GlobalPlanet.ProjectViewer.open(that.id);
                });
            });
        }

        document.getElementById('local-projects').appendChild(frag);
        updateCheckboxes('sharebox-' + that.id);
    };

    this.init = function(id) {
        this.id = id;
        this.ProjectData = Planet.LocalPlanet.ProjectTable[this.id];
    };
};
