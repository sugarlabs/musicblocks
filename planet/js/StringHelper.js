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
        ["logo-container","Planet"],
        ["close-planet","Close Planet","data-tooltip"],
        ["planet-open-file","Open project from file","data-tooltip"],
        ["planet-new-project","New project","data-tooltip"],
        ["local-tab","Local"],
        ["global-tab","Global"],
        ["global-search","Search for a project","placeholder"],
        ["localtitle","My Projects"],
        ["publisher-ptitle","Publish Project"],
        ["publish-title-label","Project title"],
        ["publish-tags-label","Tags (max 5)"],
        ["publish-description-label","Description"],
        ["publisher-submit","Submit"],
        ["publisher-cancel","Cancel"],
        ["deleter-confirm","Delete \"<span id=\"deleter-title\"></span>\"?"],
        ["deleter-paragraph","Permanently delete project \"<span id=\"deleter-name\"></span>\"?"],
        ["deleter-button","Delete"],
        ["deleter-cancel","Cancel"],
        ["globaltitle","Explore Projects"],
        ["view-more-chips","View More"],
        ["option-recent","Most recent"],
        ["option-liked","Most liked"],
        ["option-downloaded","Most downloaded"],
        ["option-alphabetical","A-Z"],
        ["option-sort-by","Sort by"],
        ["load-more-projects","Load More Projects"],
        ["projectviewer-last-updated-heading","Last Updated"],
        ["projectviewer-date-heading","Creation Date"],
        ["projectviewer-downloads-heading","Number of Downloads:"],
        ["projectviewer-likes-heading","Number of Likes:"],
        ["projectviewer-tags-heading","Tags:"],
        ["projectviewer-description-heading","Description"],
        ["projectviewer-report-project","Report Project"],
        ["projectviewer-report-title","Report Project"],
        ["projectviewer-report-conduct","Report projects which violate the <a href=\"https://github.com/sugarlabs/sugar-docs/blob/master/CODE_OF_CONDUCT.md\" target=\"_blank\">Sugar Labs Code of Conduct</a>."],
        ["projectviewer-report-reason","Reason for reporting project"],
        ["projectviewer-report-submit","Submit"],
        ["projectviewer-reportsubmit-title","Report Project"],
        ["projectviewer-report-close","Close"],
        ["projectviewer-download-file","Download as File"],
        ["projectviewer-open-mb","Open in Music Blocks"]    
    ]

    this.init = function(){
        for (var i = 0; i<this.strings.length; i++){
            var obj = this.strings[i];
            var elem = document.getElementById(obj[0]);
            if (this.strings[i].length==3){
                elem.setAttribute(obj[2],_(obj[1]));
            } else {
                elem.innerHTML+=_(obj[1]);
            }
        }
    };
};
