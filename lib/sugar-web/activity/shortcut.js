define(function () {

    'use strict';

    var shortcut = {};

    shortcut._allShortcuts = [];

    shortcut.add = function (modifiersString, key, callback) {
        // Parse the modifiers.  For example "Ctrl+Alt" will become
        // {'ctrlKey': true, 'altKey': true, 'shiftKey': false}
        var modifiersList = modifiersString.toLowerCase().split("+");
        var modifiers = {
            'ctrlKey': modifiersList.indexOf('ctrl') >= 0,
            'altKey': modifiersList.indexOf('alt') >= 0,
            'shiftKey': modifiersList.indexOf('shift') >= 0
        };

        this._allShortcuts.push({
            'modifiers': modifiers,
            'key': key.toLowerCase(),
            'callback': callback
        });
    };

    document.onkeypress = function (e) {
        e = e || window.event;

        var modifiers = {
            'ctrlKey': e.ctrlKey,
            'altKey': e.altKey,
            'shiftKey': e.shiftKey
        };

        // Obtain the key
        var charCode;
        if (typeof e.which == "number") {
            charCode = e.which;
        } else {
            charCode = e.keyCode;
        }
        var key = String.fromCharCode(charCode).toLowerCase();

        // Search for a matching shortcut
        for (var i = 0; i < shortcut._allShortcuts.length; i += 1) {
            var currentShortcut = shortcut._allShortcuts[i];

            var match = currentShortcut.key == key &&
                currentShortcut.modifiers.ctrlKey == modifiers.ctrlKey &&
                currentShortcut.modifiers.altKey == modifiers.altKey &&
                currentShortcut.modifiers.shiftKey == modifiers.shiftKey;
            if (match) {
                currentShortcut.callback();
                return;
            }
        }
    };

    return shortcut;
});
