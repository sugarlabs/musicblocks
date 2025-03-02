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
define(function(){'use strict';var shortcut={};shortcut._allShortcuts=[];shortcut.add=function(modifiersString,key,callback){var modifiersList=modifiersString.toLowerCase().split("+");var modifiers={'ctrlKey':modifiersList.indexOf('ctrl')>=0,'altKey':modifiersList.indexOf('alt')>=0,'shiftKey':modifiersList.indexOf('shift')>=0};this._allShortcuts.push({'modifiers':modifiers,'key':key.toLowerCase(),'callback':callback});};document.onkeypress=function(e){e=e||window.event;var modifiers={'ctrlKey':e.ctrlKey,'altKey':e.altKey,'shiftKey':e.shiftKey};var charCode;if(typeof e.which=="number"){charCode=e.which;}else{charCode=e.keyCode;}
var key=String.fromCharCode(charCode).toLowerCase();for(var i=0;i<shortcut._allShortcuts.length;i+=1){var currentShortcut=shortcut._allShortcuts[i];var match=currentShortcut.key==key&&currentShortcut.modifiers.ctrlKey==modifiers.ctrlKey&&currentShortcut.modifiers.altKey==modifiers.altKey&&currentShortcut.modifiers.shiftKey==modifiers.shiftKey;if(match){currentShortcut.callback();return;}}};return shortcut;});