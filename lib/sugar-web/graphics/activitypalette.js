define(["sugar-web/graphics/palette",
        "text!sugar-web/graphics/activitypalette.html"], (palette, template) => {

    // 'use strict';

    var activitypalette = {};

    activitypalette.ActivityPalette = (activityButton,
        datastoreObject) => {

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

        this.titleElem.onblur = () => {
            datastoreObject.setMetadata({
                "title": this.value,
                "title_set_by_user": "1"
            });
            datastoreObject.save();
        };

        this.descriptionElem.onblur = () => {
            datastoreObject.setMetadata({
                "description": this.value
            });
            datastoreObject.save();
        };
    };

    // Fill the text inputs with the received metadata.
    var setTitleDescription = (metadata) => {
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
