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

   jQuery
*/
/*
   exported

   ServerInterface
*/

// eslint-disable-next-line no-unused-vars
let ServerInterface = (Planet) => {
    this.ServerURL = "https://musicblocks.sugarlabs.org/planet-server/index.php";
    this.ConnectionFailureData = {"success": false, "error": "ERROR_CONNECTION_FAILURE"};
    this.APIKey = "3f2d3a4c-c7a4-4c3c-892e-ac43784f7381";

    this.request = (data, callback) => {
        data["api-key"] = this.APIKey;

        // eslint-disable-next-line no-unused-vars
        const req = jQuery.ajax({
            type: "POST",
            url: this.ServerURL,
            data: data
        })
            .done(data => {
                callback(data);
            })
            .fail(() => {
                callback(this.ConnectionFailureData);
            });
    };

    this.getTagManifest = callback => {
        const obj = {"action": "getTagManifest"};
        this.request(obj, callback);
    };

    this.addProject = (data, callback) => {
        const obj = {"action": "addProject", "ProjectJSON": data};
        this.request(obj, callback);
    };

    this.downloadProjectList = (ProjectTags, ProjectSort, Start, End, callback) => {
        const obj = {"action": "downloadProjectList", "ProjectTags": ProjectTags, "ProjectSort": ProjectSort, "Start": Start, "End": End};
        this.request(obj, callback);
    };

    this.getProjectDetails = (ProjectID, callback) => {
        const obj = {"action": "getProjectDetails", "ProjectID": ProjectID};
        this.request(obj, callback);
    };

    this.searchProjects = (Search, ProjectSort, Start, End, callback) => {
        const obj = {"action": "searchProjects", "Search": Search, "ProjectSort": ProjectSort, "Start": Start, "End": End};
        this.request(obj, callback);
    };

    this.downloadProject = (ProjectID, callback) => {
        const obj = {"action": "downloadProject", "ProjectID": ProjectID};
        this.request(obj, callback);
    };

    this.likeProject = (ProjectID, Like, callback) => {
        const obj = {"action": "likeProject", "ProjectID": ProjectID, "Like": ((Like) ? "true" : "false")};
        this.request(obj, callback);
    };

    this.reportProject = (ProjectID, Description, callback) => {
        const obj = {"action": "reportProject", "ProjectID": ProjectID, "Description": Description};
        this.request(obj, callback);
    };

    this.convertFile = (From, To, Data, callback) => {
        const obj = {"action": "convertData", "From": From, "To": To, "Data": Data};
        this.request(obj, callback);
    };

    this.init = () => {
    };
};
