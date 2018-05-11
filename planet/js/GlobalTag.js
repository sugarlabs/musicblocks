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

function GlobalTag(Planet) {
    this.id = null;
    this.name = null;
    this.func = null;
    this.IsDisplayTag = null;
    this.specialTag = null;
    this.tagElement = null;
    this.globalPlanet = Planet.GlobalPlanet;
    this.selected = false;
    this.selectedClass = null;

    this.render = function() {
        var tag = document.createElement('div');
        tag.classList.add('chipselect');
        tag.classList.add('cursor');
        if (this.selected){
            tag.classList.add(this.selectedClass);
        }

        tag.textContent = this.name;

        var that = this;

        tag.addEventListener('click', function (evt) {
            that.onTagClick();
        });

        var el = document.getElementById('morechips');
        if (this.IsDisplayTag){
            el = document.getElementById('primarychips');
        }

        el.appendChild(tag);
        this.tagElement = tag;
    };

    this.onTagClick = function() {
        if (this.specialTag){
            if (!this.selected) {
                this.globalPlanet.selectSpecialTag(this);
            }
        } else {
            if (this.selected) {
                this.unselect();
            } else {
                this.select();
            }

            this.globalPlanet.refreshTagList();
        }
    };

    this.select = function() {
        this.tagElement.classList.add(this.selectedClass);
        this.selected = true;
    };

    this.unselect = function() {
        this.tagElement.classList.remove(this.selectedClass);
        this.selected = false;
    };

    this.init = function(obj){
        if (obj.id !== undefined) {
            this.specialTag = false;
            this.id = obj.id;
            this.name = Planet.TagsManifest[this.id].TagName;
            this.func = null;
            if (Planet.TagsManifest[this.id].IsDisplayTag === '1') {
                this.IsDisplayTag = true;
            } else {
                this.IsDisplayTag = false;
            }

            this.selectedClass = 'selected'
        } else {
            this.specialTag = true;
            this.IsDisplayTag = true;
            this.id = null;
            this.name = obj.name;
            this.func = obj.func;
            this.selectedClass = 'selected-special'
        }

        this.render();
    };
};
