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

function GlobalCard(Planet) {
    this.ProjectData = null;
    this.id = null;
    this.PlaceholderMBImage = 'images/mbgraphic.png';
    this.PlaceholderTBImage = 'images/tbgraphic.png';
    this.renderData = '\
<div class="col no-margin-left s12 m6 l4"> \
    <div class="card"> \
        <div class="card-image"> \
            <img class="project-image project-card-image" id="global-project-image-{ID}" src="images/planetgraphic.png"> \
        </div> \
        <div class="card-content"> \
            <span class="card-title global-title grey-text text-darken-4" id="global-project-title-{ID}"></span> \
            <div id="global-project-tags-{ID}"> \
            </div> \
        </div> \
        <div class="card-action"> \
            <div class="flexcontainer"> \
                <a class="project-icon" id="global-project-more-details-{ID}">'+_('More Details')+'</a> \
                <a class="project-icon"></a> \
                <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="'+_('Like project')+'"><i class="material-icons"id="global-like-icon-{ID}"></i><span class="likes-count" id="global-project-likes-{ID}"></span></a> \
                    <div id="global-share-{ID}"> \
                                        <a class="project-icon tooltipped" data-position="bottom" data-delay="50" data-tooltip="'+_('Share project')+'" id="global-project-share-{ID}"><i class="material-icons">share</i></a> \
                                        <div class="card share-card" id="global-sharebox-{ID}" style="display:none;"> \
                                                <div class="card-content shareurltext"> \
                                                        <div class="shareurltitle">'+_('Share')+'</div> \
                                                        <input type="text" name="shareurl" class="shareurlinput" data-originalurl="https://musicblocks.sugarlabs.org/index.html?id={ID}"> \
                                                        <div class="shareurl-advanced" id="global-advanced-{ID}"> \
                                                                <div class="shareurltitle">'+_('Flags')+'</div> \
                                                                <div><input type="checkbox" name="run" id="global-checkboxrun-{ID}" checked><label for="global-checkboxrun-{ID}">'+_('Run project on startup.')+'</label></div> \
                                                                <div><input type="checkbox" name="show" id="global-checkboxshow-{ID}"><label for="global-checkboxshow-{ID}">'+_('Show code blocks on startup.')+'</label></div> \
                                                                <div><input type="checkbox" name="collapse" id="global-checkboxcollapse-{ID}"><label for="global-checkboxcollapse-{ID}">'+_('Collapse code blocks on startup.')+'</label></div> \
                                                        </div> \
                                                </div> \
                                                <div class="card-action"> \
                                                        <a onclick="toggleExpandable(\'global-advanced-{ID}\',\'shareurl-advanced\');">'+_('Advanced Options')+'</a> \
                                                </div> \
                                        </div> \
                                </div> \
            </div> \
        </div> \
    </div> \
</div>';

    this.render = function() {
        //TODO: Have a TB placeholder image specific to TB projects
        var html = this.renderData.replace(new RegExp('\{ID\}', 'g'), this.id);
        var frag = document.createRange().createContextualFragment(html);
        
        // set image
        if (this.ProjectData.ProjectImage !== null && this.ProjectData.ProjectImage !== ''){
            frag.getElementById('global-project-image-' + this.id).src = this.ProjectData.ProjectImage;
        } else if (this.ProjectData.ProjectIsMusicBlocks === 1){
            frag.getElementById('global-project-image-' + this.id).src = this.PlaceholderMBImage;
        } else {
            frag.getElementById('global-project-image-' + this.id).src = this.PlaceholderTBImage;
        }
        
        // set tags
        var tagcontainer = frag.getElementById('global-project-tags-' + this.id);
        for (var i = 0; i < this.ProjectData.ProjectTags.length; i++){
            var chip = document.createElement('div');
            chip.classList.add('chipselect');
            chip.textContent = Planet.TagsManifest[this.ProjectData.ProjectTags[i]].TagName;
            tagcontainer.appendChild(chip);
        }
        
        // set title text
        frag.getElementById('global-project-title-' + this.id).textContent = this.ProjectData.ProjectName;
        
        // set number of likes
        frag.getElementById('global-project-likes-' + this.id).textContent = this.ProjectData.ProjectLikes.toString();
        
        var that = this;

        // set view button listener
        frag.getElementById('global-project-more-details-' + this.id).addEventListener('click', function (evt) {
            Planet.GlobalPlanet.ProjectViewer.open(that.id);
        });
        
        // set image listener
        frag.getElementById('global-project-image-' + this.id).addEventListener('click', function (evt) {
            Planet.GlobalPlanet.ProjectViewer.open(that.id);
        });
        
        // set share button listener
        frag.getElementById('global-project-share-' + this.id).addEventListener('click', function (evt) {
            var s = document.getElementById('global-sharebox-' + that.id);
            if (s.style.display=='none') {
                s.style.display = 'initial';
                hideOnClickOutside([document.getElementById('global-share-' + that.id)], 'global-sharebox-' + that.id);
            } else {
                s.style.display = 'none';
            }
        });
        
        // set share checkbox listener
        frag.getElementById('global-checkboxrun-' + this.id).addEventListener('click', function (evt) {
            updateCheckboxes('global-sharebox-' + that.id);
        });
        frag.getElementById('global-checkboxshow-' + this.id).addEventListener('click', function (evt) {
            updateCheckboxes('global-sharebox-' + that.id);
        });
        frag.getElementById('global-checkboxcollapse-' + this.id).addEventListener('click', function (evt) {
            updateCheckboxes('global-sharebox-' + that.id);
        });
        
        // set like icon
        if (Planet.ProjectStorage.isLiked(this.id)){
            frag.getElementById('global-like-icon-' + this.id).textContent = 'favorite';
        } else {
            frag.getElementById('global-like-icon-' + this.id).textContent = 'favorite_border';
        }
        
        frag.getElementById('global-like-icon-' + this.id).addEventListener('click', function (evt) {
            that.like();
        });
        
        document.getElementById('global-projects').appendChild(frag);
        updateCheckboxes('global-sharebox-' + that.id);
    };

    this.like = function() {
        var like = true;
        if (Planet.ProjectStorage.isLiked(this.id)) {
            like = false;
        }

        Planet.ServerInterface.likeProject(this.id, like, function(data) {
            this.afterLike(data,like);
        }.bind(this));
    };

    this.afterLike = function(data, like) {
        if (!data.success) {
            if (data.error === 'ERROR_ACTION_NOT_PERMITTED') {
                this.setLike(like);
            }
        } else {
            this.setLike(like);
        }
    };

    this.setLike = function(like) {
        Planet.ProjectStorage.like(this.id,like);
        var incr = 1;
        var text = 'favorite';
        if (!like) {
            incr = -1;
            text = 'favorite_border';
        }

        var l = document.getElementById('global-project-likes-' + this.id);
        l.textContent = (parseInt(l.textContent) + incr).toString();
        document.getElementById('global-like-icon-' + this.id).textContent = text;
    };

    this.init = function(id){
        this.id = id;
        this.ProjectData = Planet.GlobalPlanet.cache[id];
    };
};
