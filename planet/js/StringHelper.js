// Copyright (c) 2018 Euan Ong
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function StringHelper(Planet) {
    //[id, string, property (if present)]
    // append to innerhtml
    this.strings = [
        ["logo-container",_("Planet")],
        ["close-planet",_("Close Planet"),"data-tooltip"],
        ["planet-open-file",_("Open project from file"),"data-tooltip"],
        ["planet-new-project",_("New project"),"data-tooltip"],
        ["local-tab",_("Local")],
        ["global-tab",_("Global")],
        ["global-search",_("Search for a project"),"placeholder"],
        ["localtitle",_("My Projects")],
        ["publisher-ptitle",_("Publish Project")],
        ["publish-title-label",_("Project title")],
        ["publish-tags-label",_("Tags (max 5)")],
        ["publish-description-label",_("Description")],
        ["publisher-submit",_("Submit")],
        ["publisher-cancel",_("Cancel")],
        ["deleter-confirm",_("Delete \"<span id=\"deleter-title\"></span>\"?")],
        ["deleter-paragraph",_("Permanently delete project \"<span id=\"deleter-name\"></span>\"?")],
        ["deleter-button",_("Delete")],
        ["deleter-cancel",_("Cancel")],
        ["globaltitle",_("Explore Projects")],
        ["view-more-chips",_("View More")],
        ["option-recent",_("Most recent")],
        ["option-liked",_("Most liked")],
        ["option-downloaded",_("Most downloaded")],
        ["option-alphabetical",_("A-Z")],
        ["option-sort-by",_("Sort by")],
        ["load-more-projects",_("Load More Projects")],
        ["projectviewer-last-updated-heading",_("Last Updated")],
        ["projectviewer-date-heading",_("Creation Date")],
        ["projectviewer-downloads-heading",_("Number of Downloads:")],
        ["projectviewer-likes-heading",_("Number of Likes:")],
        ["projectviewer-tags-heading",_("Tags:")],
        ["projectviewer-description-heading",_("Description")],
        ["projectviewer-report-project",_("Report Project")],
        ["projectviewer-report-title",_("Report Project")],
        ["projectviewer-report-conduct",_("Report projects which violate the <a href=\"https://github.com/sugarlabs/sugar-docs/blob/master/CODE_OF_CONDUCT.md\" target=\"_blank\">Sugar Labs Code of Conduct</a>.")],
        ["projectviewer-report-reason",_("Reason for reporting project")],
        ["projectviewer-report-submit",_("Submit")],
        ["projectviewer-reportsubmit-title",_("Report Project")],
        ["projectviewer-report-close",_("Close")],
        ["projectviewer-download-file",_("Download as File")],
        ["projectviewer-open-mb",_("Open in Music Blocks")]
    ]

    this.init = function(){
        for (var i = 0; i<this.strings.length; i++){
            var obj = this.strings[i];
            var elem = document.getElementById(obj[0]);
            if (this.strings[i].length==3){
                elem.setAttribute(obj[2],obj[1]);
            } else {
                elem.innerHTML+=obj[1];
            }
        }
    };
};
