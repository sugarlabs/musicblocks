/**
 * Defines the activity module.
 * @module activity
 */
define(["webL10n.sugarizer",
        "sugar-web/activity/shortcut",
        "sugar-web/bus",
        "sugar-web/env",
        "sugar-web/datastore",
		"sugar-web/presence",
        "sugar-web/graphics/icon",
        "sugar-web/graphics/activitypalette"], function (
    l10n, shortcut, bus, env, datastore, presence, icon, activitypalette) {

    'use strict';

    var datastoreObject = null;

	var presenceCallback = null;
	var presenceResponse = null;

    /**
     * Represents the activity module.
     * @namespace activity
     */
    var activity = {};

    /**
     * Sets up the activity, initializing various components and event listeners.
     */
    activity.setup = function () {
        // Listen for bus events
        bus.listen();

        // Start localization
        l10n.start();

        /**
         * Sends a pause event when notified by the bus.
         */
        function sendPauseEvent() {
			var pauseEvent = document.createEvent("CustomEvent");
			pauseEvent.initCustomEvent('activityPause', false, false, {
				'cancelable': true
			});
            window.dispatchEvent(pauseEvent);
        }

        // Listen for 'activity.pause' notification to send pause event
        bus.onNotification("activity.pause", sendPauseEvent);

        // An activity that handles 'activityStop' can also call
        // event.preventDefault() to prevent the close, and explicitly
        // call activity.close() after storing.

        /**
         * Sends a stop event and closes the activity when notified by the bus.
         */
        function sendStopEvent() {
			var stopEvent = document.createEvent("CustomEvent");
			stopEvent.initCustomEvent('activityStop', false, false, {
				'cancelable': true
			});
            var result = window.dispatchEvent(stopEvent);
            if (result) {
                activity.close();
            }
        }

        // Listen for 'activity.stop' notification to send stop event
        bus.onNotification("activity.stop", sendStopEvent);

        // Initialize datastore object
        datastoreObject = new datastore.DatastoreObject();

        // Initialize activity palette
        var activityButton = document.getElementById("activity-button");

        var activityPalette = new activitypalette.ActivityPalette(
            activityButton, datastoreObject);

        // Colorize the activity icon.
        activity.getXOColor(function (error, colors) {
            icon.colorize(activityButton, colors);
            var invokerElem =
                document.querySelector("#activity-palette .palette-invoker");
            icon.colorize(invokerElem, colors);
        });

        // Make the activity stop with the stop button.
        var stopButton = document.getElementById("stop-button");
        stopButton.addEventListener('click', function (e) {
            sendStopEvent();
        });

        // Add shortcut for closing activity
        shortcut.add("Ctrl", "Q", this.close);

        // Get environment information
        env.getEnvironment(function (error, environment) {
            // Set metadata for datastore object
            if (!environment.objectId) {
                datastoreObject.setMetadata({
                    "title": environment.activityName + " Activity",
                    "title_set_by_user": "0",
                    "activity": environment.bundleId,
                    "activity_id": environment.activityId
                });
            }

            // Join network if in Sugarizer environment
			if (env.isSugarizer()) {
				presence.joinNetwork(function(error, presence) {
					if (environment.sharedId) {
						presence.joinSharedActivity(environment.sharedId, function() {
							var group_color = presence.getSharedInfo().colorvalue;
							icon.colorize(activityButton, group_color);
							datastoreObject.setMetadata({"buddy_color":group_color});
							datastoreObject.save(function() {});
						});
					}
					if (presenceCallback) {
						presenceCallback(error, presence);
					} else {
						presenceResponse = {error: error, presence: presence};
					}
				});
			}

            // Save datastore metadata and set title description for activity palette
            datastoreObject.save(function () {
                datastoreObject.getMetadata(function (error, metadata) {
                    activityPalette.setTitleDescription(metadata);
                });
            });
        });
    };

    /**
     * Gets the datastore object.
     * @returns {object} The datastore object.
     */
    activity.getDatastoreObject = function () {
        return datastoreObject;
    };

    /**
     * Gets the presence object.
     * @param {function} connectionCallback - The callback function to handle the presence object.
     * @returns {object} The presence object.
     */
	activity.getPresenceObject = function(connectionCallback) {
		if (presenceResponse == null) {
			presenceCallback = connectionCallback;
		} else {
			connectionCallback(presenceResponse.error, presenceResponse.presence);
			presenceResponse = null;
		}
		return presence;
	};

    /**
     * Retrieves the XO color.
     * @param {function} callback - The callback function to handle the XO color.
     */
    activity.getXOColor = function (callback) {
        function onResponseReceived(error, result) {
            if (error === null) {
                callback(null, {
                    stroke: result[0][0],
                    fill: result[0][1]
                });
            } else {
                callback(null, {
                    stroke: "#00A0FF",
                    fill: "#8BFF7A"
                });
            }
        }

        bus.sendMessage("activity.get_xo_color", [], onResponseReceived);
    };

    /**
     * Closes the activity.
     * @param {function} callback - The callback function to handle the closing of the activity.
     */
    activity.close = function (callback) {
        function onResponseReceived(error, result) {
            if (error === null) {
                callback(null);
            } else {
                callback(error, null);
            }
        }

        bus.sendMessage("activity.close", [], onResponseReceived);
    };

    /**
     * Shows the object chooser.
     * @param {function} callback - The callback function to handle the object chooser.
     */
    activity.showObjectChooser = function (callback) {
        function onResponseReceived(error, result) {
            if (error === null) {
                callback(null, result[0]);
            } else {
                callback(error, null);
            }
        }

        bus.sendMessage("activity.show_object_chooser", [], onResponseReceived);
    };

    return activity;
});
