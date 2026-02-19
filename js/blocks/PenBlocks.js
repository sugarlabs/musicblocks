class FillScreenBlock extends FlowBlock {
    constructor() {
        // FIX: Changed label to avoid duplicate "background"
        super("fillscreen", _("set background color"));
        this.setPalette("pen");
        this.setHelpString(_("Sets the background color using hue, value and chroma."));
        this.formBlock({
            args: 3,
            defaults: [0, 50, 100],
            argLabels: [
                _("hue"),
                _("value"),
                _("chroma")
            ]
        });
    }

    flow(args, logo) {
        if (args.length === 3) {
            logo.stage.setBackgroundColor(args[0], args[1], args[2]);
        }
    }
}

class BackgroundBlock extends FlowBlock {
    constructor() {
        // Keep this simple block as "background"
        super("background", _("background"));
        this.setPalette("pen");
        this.setHelpString(_("Sets the background using the current pen color."));
        this.formBlock({
            args: 0
        });
    }

    flow(args, logo) {
        logo.stage.setBackgroundToCurrentColor();
    }
}
