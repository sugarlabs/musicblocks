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

   GlobalTag
*/

class GlobalTag {

    /* 
     this.tagNames = [
            //.TRANS: On the Planet, we use labels to tag projects.
            _("All Projects"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("My Projects"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Examples"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Music"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Art"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Math"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Interactive"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Design"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Game"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Media"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Sensors"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Effects"),
            //.TRANS: On the Planet, we use labels to tag projects.
            _("Code Snippet"),
        ];
    */

    constructor(Planet) {
        this.Planet = Planet ;
        this.id = null;
        this.name = null;
        this.func = null;
        this.IsDisplayTag = null;
        this.specialTag = null;
        this.tagElement = null;
        this.globalPlanet = Planet.GlobalPlanet;
        this.selected = false;
        this.selectedClass = null;
    }

    render() {
        const tag = document.createElement("div");
        tag.classList.add("chipselect", "cursor") ;

        if (this.selected)
            tag.classList.add(this.selectedClass) ;

        tag.textContent = _(this.name);

        // eslint-disable-next-line no-unused-vars
        tag.addEventListener("click",  (evt) => {
            this.onTagClick();
        });

        const elementTag = `${this.IsDisplayTag ? "primary" : "more"}chips` ;
        document.getElementById(elementTag).appendChild(tag);

        this.tagElement = tag;
    };

    onTagClick() {
        if (this.specialTag && !this.selected)
            this.globalPlanet.selectSpecialTag(this);
                 
        else {
            this.selected ? this.unselect() : this.select() ;
            this.globalPlanet.refreshTagList();
        }
    };

    select() {
        this.tagElement.classList.add(this.selectedClass);
        this.selected = true;
    };

    unselect() {
        this.tagElement.classList.remove(this.selectedClass);
        this.selected = false;
    };

    init(obj) {
        const Planet = this.Planet ;

        if (obj.id !== undefined) {
            this.specialTag = false;
            this.id = obj.id;
            this.name = Planet.TagsManifest[this.id].TagName;
            this.func = null;
            this.IsDisplayTag = Planet.TagsManifest[this.id].IsDisplayTag === "1" ; // ? "true":"false";
            this.selectedClass = "selected";
        }
        else {
            this.specialTag = true;
            this.IsDisplayTag = true;
            this.id = null;
            this.name = obj.name;
            this.func = obj.func;
            this.selectedClass = "selected-special";
        }

        this.render();
    };

}