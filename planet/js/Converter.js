/*
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */



/*
   exported

   Converter
*/

class Converter {
    
    constructor(Planet) {
        this.Planet = Planet ;
        this.ServerInterface = Planet.ServerInterface;
    }

    isConnected() {
        return this.Planet.ConnectedToServer;
    };

    // callbacks: (success, data/error message)
    // Conversion Functions

    ly2pdf(data, callback) {
        this.ServerInterface.convertFile("ly", "pdf", window.btoa(encodeURIComponent(data)), function(result) {
            this.afterly2pdf(result,callback);
        }.bind(this));
    };
    
    afterly2pdf (data, callback) {
        (!data.success) ? callback(false, data.error) :
            callback(true, this.getDataURL(data.data.contenttype, data.data.blob)) ;
    };

    // Ancillary Functions
    getDataURL (mime, data) {
        return `data:${mime};base64,${data}` ;
    };

    // Unused, but might be useful.
    getBlob(mime, data) {
        const rawData = window.atob(data);
        const len = rawData.length;
        const arr = new Uint8Array(len);

        for (let i = 0; i < len; i++)
            arr[i] = rawData.charCodeAt(i);

        const blob = new Blob([arr], {type: mime});
        return blob;
    };

    init() {}

}
