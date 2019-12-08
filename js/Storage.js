// Copyright (c) 2019 Samyok Nepal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function CustomStorage(options) {
    this.config = options;
    this._forage = localforage.createInstance(this.config);
    this.driver = localforage.driver();
    this.version = "v2";
    this.log = logItem => console.log(`[${this.driver}] ${typeof logItem === "object" ? JSON.stringify(logItem) : logItem}`);

    this.setItem = (key, value, callback) => {
        this._forage.setItem(key, value, (err) => {
            this.log(`Saved ${key} as ${value}`);
            if (err) throw err;
            if (callback) callback(err);
        });
    };

    this.getItem = (key, callback) => {
        this._forage.getItem(key, (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    };

    this.removeItem = (key, callback) => {
        this._forage.removeItem(key, (err) => {
            if (err) throw err;
            else this.log(`Cleared ${key}`);
            if (callback) callback();
        })
    };

    this.port = (callback) => {
        this.getItem("storage_version", (version) => {
            if (version === this.version) {
                this.log(`Storage version ${version}`)
            } else {
                this.log("Storage not ported to v2 (localForage). Porting now...");
                Object.keys(localStorage).forEach(key => {
                    this.setItem(key, localStorage[key], () => {
                        this.setItem(`${key}_storage_version`, "v2", () => {
                            this.log(`Ported ${key} to ${this.version}`);
                            if (callback) callback();
                        });
                    });
                });
                this.setItem("storage_version", "v2", () => {
                    this.log("Ported to v2 (localForage).");
                    if (callback) callback();
                });
            }
        })
    };

    this.portKey = (key, callback) => {
        this.getItem(`${key}_storage_version`, (version) => {
            if (version === this.version) {
                this.log(`Storage version ${version}`);
                if (callback) callback(false);
            } else {
                this.log(`Key ${key} not ported to ${this.version}. Porting now...`);
                this.setItem(key, localStorage[key], () => {
                    this.setItem(`${key}_storage_version`, "v2", () => {
                        this.log(`Ported ${key} to ${this.version}`);
                        if (callback) callback(true);
                    });
                })
            }
        })
    };
}
