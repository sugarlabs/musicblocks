# How to Customize Theme in Music Blocks?

This guide explains how you can add your own custom theme or customize an existing one in Music Blocks!

---

### How themes work in Music Blocks

1. On first load, the theme is chosen from `localStorage.themePreference` or the system color-scheme preference.

2. Theme styling now comes from `css/tokens.css`. The active theme is applied by toggling `body.dark` or `body.highcontrast`, which updates CSS custom properties immediately.

3. `js/utils/platformstyle.js` still exposes a compatibility `window.platformColor` object for legacy JS, but new styling should read CSS custom properties instead of hardcoded colors.

4. Most of the Music Blocks theme styles are defined in:
    1. css/tokens.css
    2. css/themes.css
    3. planet/css/planetThemes.css

5. Theme switches are applied instantly. Prefer CSS classes and tokens over `element.style.*` assignments when adding or updating UI.

---

### Steps on Theme Customization:

Note: If you want to customise an existing theme, update the token values in `css/tokens.css` and the theme-specific overrides in `css/themes.css` or `planet/css/planetThemes.css`.

1.  **Adding your theme's icon to the list in index.html**

    Go to index.html from root, and add your theme's icon to the list (please follow the conventions used by other themes for proper implementation)
    Add your theme's icon to the bottom of the list, you can find icons in [Material Icons](https://materializecss.com/icons.html).

    ```javascript
    <ul style="display: none;" id="themedropdown" class="dropdown-content">
        <a id="light" class="tooltipped" data-tooltip="Light Mode">
            <i class="material-icons">brightness_7</i>
        </a>
        <a id="dark" class="tooltipped" data-tooltip="Dark Mode">
            <i class="material-icons">brightness_4</i>
        </a>
        <a id="custom" class="tooltipped" data-tooltip="Custom Theme">
            <i class="material-icons">choose_your_material_icon</i>
        </a>
    </ul>
    ```

2.  **Now go to js/toolbar.js, find init(activity){...}**

    There will be 4 arrays named string (two in an if statement, rest two in the else statement).
    Add your theme's name to the bottom of the pre-existing themes.

    ```javascript
    string = [[...],
        ["light", _("Light Mode")],
        ["dark", _("Dark Mode")],
        ["custom", _("Custom Theme")]];
    ```

    ```javascript
    string = [_(...),
    _("Light Mode"),
    _("Dark Mode"),
    _("Custom Theme")];
    ```

    There will be two same arrays in the else statement, repeat the process. This is to display your theme's name in the dropdown menu item you created in Step 1.

3.  **Understanding the process a little bit**

    There is a renderThemeSelectIcon function in js/toolbar.js

    ```javascript
    renderThemeSelectIcon(themeBox, themes) {
        const themeSelectIcon = docById("themeSelectIcon");
        let themeList = themes;
        themeSelectIcon.onclick = () => {
            themeList.forEach((theme) => {
                docById(theme).onclick = () => themeBox[`${theme}_onclick`](this.activity);
            });
        };
    }
    ```

    and it is called in js/activity.js

    ```javascript
    this.toolbar.renderThemeSelectIcon(this.themeBox, this.themes);
    ```

    This adds functionality to our options of themes using the themeBox object but leave themeBox for now. Let's get to the this.themes part which is an array in the Activity class in js/activity.js.

    ```javascript
    class Activity {
        constructor(
            ...
            this.themes = ["light", "dark", "custom"];
            ...
        )
    }
    ```

    Add your theme here too. In activity.js, you will find just below there is this "for" loop, this checks for all the themes in the themes array we just saw above and then add the theme class in themes.css (which you will add in later steps) which matches the themePreference object in localStorage.

    ```javascript
    for (let i = 0; i < this.themes.length; i++) {
        if (this.themes[i] === this.storage.themePreference) {
            body.classList.add(this.themes[i]);
        } else {
            body.classList.remove(this.themes[i]);
        }
    }
    ```

    If no theme has been selected (i.e., themePreference has not been defined in localStorage), the styles will default to "light". Otherwise, the theme defined in themePreference will be applied.

4.  **Adding your theme to the planet page**

    Go to planet/js/Planet.js and look for

    ```javascript
    document.addEventListener("DOMContentLoaded", function () {
        let themes = ["light", "dark", "custom"];
        for (let i = 0; i < themes.length; i++) {
            if (themes[i] === localStorage.getItem("themePreference")) {
                document.body.classList.add(themes[i]);
            } else {
                document.body.classList.remove(themes[i]);
            }
        }
    });
    ```

    Add your theme here as well. The "for" loop shown above checks (after the DOM is loaded) for all themes in themes array to add the class in planetThemes.css (which you will add in later steps) which match themePreference in localStorage to the elements on planet/index.html. That is why the changes happen after the reload.
    If no theme has been selected (i.e., themePreference has not been defined in localStorage), the styles will default to "light". Otherwise, the theme defined in themePreference will be applied.

5.  **Using themeBox to add functionality to your options in the dropdown menu**

    Go to js/themebox.js,

    ```javascript
    class ThemeBox {
    ...
    /**
     * @public
     * @returns {void}
     */
    light_onclick() {
        this._theme = "light";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    dark_onclick() {
        this._theme = "dark";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    custom_onclick() {
        this._theme = "custom";
        this.setPreference();
    }
    ...
    }
    ```

    Add your function about your theme just like the example shown above. renderSelectThemeIcon function in step 3 will call this theme function, setPreference function will set themepreference in localStorage and then reload the page

6.  **Now to add styling for your theme**

    The design token system in `css/tokens.css` is the primary place for defining colour, spacing, and typography values. Component-level CSS files (`css/themes.css`, `planet/css/planetThemes.css`) reference these tokens using `var(--token-name)`.

    You have to add styling in the following places:

    1. css/tokens.css (central design token file)
       Add your theme's token overrides using a body class selector (e.g. `body.custom { --color-bg-primary: ...; }`). Use the existing `body.dark` and `body.highcontrast` blocks as templates.

    2. css/themes.css (external styling used for floating windows, search bar, etc.)
       If you go here, you will find styling for dark mode, just write your css using them as a template below the last theme's CSS. There is no light mode here because it is the default.

    3. planet/css/planetThemes.css (styling used for planet page)
       Add your theme class styles here, following the same pattern as `css/themes.css`.

    > **Note on `js/utils/platformstyle.js`** (legacy): This file still exposes a `window.platformColor` compatibility object for JS code that has not yet migrated to CSS tokens. If your theme needs to work with existing JS that reads `platformColor`, add an entry to the `platformThemes` object. However, **new code should read CSS custom properties** via `getComputedStyle(document.body).getPropertyValue('--token-name')` instead.

## And you are done. Good luck creating your theme!
