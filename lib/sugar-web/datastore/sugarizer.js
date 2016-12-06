define(["sugar-web/bus", "sugar-web/env"], function(bus, env) {

    'use strict';

    var datastore = {};

    var html5storage = {};
    var datastorePrefix = 'sugar_datastore_';
    var initialized = false;

    //- Utility function

    // Get parameter from query string
    datastore.getUrlParameter = function(name) {
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    };

    // Create a uuid
    datastore.createUUID = function() {
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    };

    // Callback checker
    datastore.callbackChecker = function(callback) {
        if (callback === undefined || callback === null) {
            callback = function() {};
        }
        return callback;
    };


    //- Static Datastore methods

    // Create a new datastore entry
    datastore.create = function(metadata, callback, text) {
        var callback_c = datastore.callbackChecker(callback);
        var objectId = datastore.createUUID();
        html5storage.setValue(datastorePrefix + objectId, {
            metadata: metadata,
            text: (text === undefined) ? null : text
        });
        callback_c(null, objectId);
    }

    // Find entries matching an activity type
    datastore.find = function(id) {
        var results = [];
        if (!html5storage.test())
            return results;
        for (var key in html5storage.getAll()) {
            if (key.substr(0, datastorePrefix.length) == datastorePrefix) {
                var entry = html5storage.getValue(key);
                entry.objectId = key.substr(datastorePrefix.length);
                if (id === undefined || entry.metadata.activity == id) {
                    results.push(entry);
                }
            }
        }

        return results;
    }
	
	// Remove an entry in the datastore
	datastore.remove = function(objectId) {
		html5storage.removeValue(datastorePrefix + objectId);
	}

    //- Instance datastore methods
    function DatastoreObject(objectId) {
        this.objectId = objectId;
        this.newMetadata = {};
        this.newDataAsText = null;
        this.toload = false;

        // Init environment from query string values
        if (!initialized) {
            env.getEnvironment(function() {
                initialized = true;
            });
        }

        // Init or create objectId if need    
        var that = this;
        if (this.objectId === undefined) {
            var env_objectId = window.top.sugar.environment.objectId;
            if (env_objectId != null) {
                this.objectId = env_objectId;
                this.toload = true;
            }
        }
    }

    // Load metadata
    DatastoreObject.prototype.getMetadata = function(callback) {
        var callback_c = datastore.callbackChecker(callback);
		var result = html5storage.getValue(datastorePrefix + this.objectId);
		if (result != null) {
			this.setMetadata(result.metadata);
			this.setDataAsText(result.text);
			this.toload = false;
			callback_c(null, result.metadata);
		}
    };

    // Load text
    DatastoreObject.prototype.loadAsText = function(callback) {
        var callback_c = datastore.callbackChecker(callback);
        var result = html5storage.getValue(datastorePrefix + this.objectId);
        if (result != null) {
            this.setMetadata(result.metadata);
            this.setDataAsText(result.text);
            this.toload = false;
            callback_c(null, result.metadata, result.text);
        }
    };

    // Set metadata
    DatastoreObject.prototype.setMetadata = function(metadata) {
        for (var key in metadata) {
            this.newMetadata[key] = metadata[key];
        }
    };

    // Set text
    DatastoreObject.prototype.setDataAsText = function(text) {
        this.newDataAsText = text;
    };

    // Save data
    DatastoreObject.prototype.save = function(callback) {
        if (this.objectId === undefined) {
            var that = this;
            this.newMetadata["timestamp"] = this.newMetadata["creation_time"] = new Date().getTime();
            this.newMetadata["file_size"] = 0;
            datastore.create(this.newMetadata, function(error, oid) {
                if (error == null) {
                    that.objectId = oid;
                }
            });
        } else {
            if (this.toload) {
                this.getMetadata(null);
                this.toload = false;
            }
        }
        var callback_c = datastore.callbackChecker(callback);
        this.newMetadata["timestamp"] = new Date().getTime();
		var sugar_settings = html5storage.getValue("sugar_settings");
		if (sugar_settings) {
			this.newMetadata["buddy_name"] = sugar_settings.name;
			this.newMetadata["buddy_color"] = sugar_settings.colorvalue;
		}
        html5storage.setValue(datastorePrefix + this.objectId, {
            metadata: this.newMetadata,
            text: this.newDataAsText
        });
        callback_c(null, this.newMetadata);
    };

    datastore.DatastoreObject = DatastoreObject;
    datastore.localStorage = html5storage;


    // -- HTML5 local storage handling

	// Load storage - Need for Chrome App
	var storageloadedcalls = [];
	html5storage.load = function(then) {
		if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime) {
			var that = this;
			// Currently load, will call then later
			if (storageloadedcalls.length != 0) {
				storageloadedcalls.push(then);
				return;
			}
			storageloadedcalls.push(then);
			chrome.storage.local.get(null, function(values) {
				that.values = values;
				// Call all waiting functions
				for (var i = 0 ; i < storageloadedcalls.length ; i++) {
					if (storageloadedcalls[i]) storageloadedcalls[i]();
				}
			});
		} else {
			if (then) then();
		}
	};
	html5storage.load();
	
    // Test if HTML5 storage is available
    html5storage.test = function() {
		if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime)
			return true;
		else
			return (typeof(Storage) !== "undefined" && typeof(window.localStorage) !== "undefined");
    };

    // Set a value in the storage
    html5storage.setValue = function(key, value) {
        if (this.test()) {
            try {
				if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime) {			
					this.values[key] = JSON.stringify(value);
					var item = {};
					item[key] = this.values[key];					
					chrome.storage.local.set(item);
				} else {
					window.localStorage.setItem(key, JSON.stringify(value));
				}
            } catch (err) {}
        }
    };

    // Get a value in the storage
    html5storage.getValue = function(key) {
        if (this.test()) {
            try {
				if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime) {
					return JSON.parse(this.values[key]);
				} else {
					return JSON.parse(window.localStorage.getItem(key));
				}
            } catch (err) {
                return null;
            }
        }
        return null;
    };
	
	// Remove a value in the storage
	html5storage.removeValue = function(key) {
        if (this.test()) {
            try {
				if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime) {
					this.values[key] = null;
					chrome.store.remove(key);
				} else {
					window.localStorage.removeItem(key);
				}
            } catch (err) {}
        }	
	};
	
	// Get all values
	html5storage.getAll = function() {
        if (this.test()) {
            try {
				if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime) {
					return this.values;
				} else {
					return window.localStorage;
				}
            } catch (err) {
                return null;
            }
        }
        return null;	
	};

    return datastore;
});
