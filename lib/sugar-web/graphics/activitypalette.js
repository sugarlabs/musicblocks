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
define(["sugar-web/graphics/palette",
        "text!sugar-web/graphics/activitypalette.html"], function (palette, template) {

    // 'use strict';

    var activitypalette = {};

    activitypalette.ActivityPalette = function (activityButton,
        datastoreObject) {

        palette.Palette.call(this, activityButton);

        var activityTitle;
        var descriptionLabel;
        var descriptionBox;

        this.getPalette().id = "activity-palette";

        var containerElem = document.createElement('div');
        containerElem.innerHTML = template;
        this.setContent([containerElem]);

        this.titleElem = containerElem.querySelector('#title');
        this.descriptionElem = containerElem.querySelector('#description');

        this.titleElem.onblur = function () {
            datastoreObject.setMetadata({
                "title": this.value,
                "title_set_by_user": "1"
            });
            datastoreObject.save();
        };

        this.descriptionElem.onblur = function () {
            datastoreObject.setMetadata({
                "description": this.value
            });
            datastoreObject.save();
        };
    };

    // Fill the text inputs with the received metadata.
    var setTitleDescription = function (metadata) {
        this.titleElem.value = metadata.title;

        if (metadata.description !== undefined) {
            this.descriptionElem.value = metadata.description;
        }
    };

    activitypalette.ActivityPalette.prototype =
        Object.create(palette.Palette.prototype, {
            setTitleDescription: {
                value: setTitleDescription,
                enumerable: true,
                configurable: true,
                writable: true
            }
        });

    return activitypalette;
});
