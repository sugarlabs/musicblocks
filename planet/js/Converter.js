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

function Converter(Planet) {
    this.ServerInterface = Planet.ServerInterface;

    this.isConnected = function() {
        return Planet.ConnectedToServer;
    }

    // callbacks: (success, data/error message)
    // Conversion Functions

    this.ly2pdf = function(data, callback) {
        this.ServerInterface.convertFile('ly', 'pdf', window.btoa(encodeURIComponent(data)), function(result) {
	    this.afterly2pdf(result,callback);
	}.bind(this));
    };
    
    this.afterly2pdf = function(data, callback) {
        if (!data.success) {
            callback(false, data.error);
        } else {
            callback(true, this.getDataURL(data.data.contenttype, data.data.blob));
        }
    };
    
    // Ancillary Functions
    this.getDataURL = function(mime, data){
        return 'data:' + mime + ';base64,' + data;
    };

    // Unused, but might be useful.
    this.getBlob = function(mime, data) {
        var rawData = window.atob(data);
        var len = rawData.length;
        var arr = new Uint8Array(len);
        for (var i = 0; i < len; i++){
            arr[i] = rawData.charCodeAt(i);
        }

        var blob = new Blob([arr], {type: mime});
        return blob;
    };

    this.init = function() {
    };
};
