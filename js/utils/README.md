# How to Customize Theme in Music Blocks?

This guide explains how you can add your own custom theme or customize an existing one in Music Blocks!

---

### How themes work in Music Blocks

1. When the page loads for the first time, the default theme of light mode is used.

2. When you choose a theme, an object stores inside the localStorage called themePreference.

3. As of now, all styling of Music Blocks happens at the time of loading. When we change themes, we reload the page.

4. Most of the Music Blocks theme styles are defined in two places:

    1. css/themes.css
    2. js/utils/platformstyle.js

5. The Plant theme styles are defined in:

    1. planet/css/planetThemes.css

6. The code to handle themes assignment (by looking at the themePreference object in localStorage) to their respective places is already done. You just have to follow the steps given below to add your theme.

---

### Steps on Theme Customization:

Note: If you want to customise an existing theme, just put your changes in the dark mode and choose dark mode from the theme dropdown. You can skip to step no. 6 if that is your goal.

1.  **Adding your theme's name to the list in index.html**

    Go to index.html from root, and add your theme to the list (please follow the conventions used by other themes for proper implementation)

    ```javascript
    <ul id="themedropdown" class="dropdown-content">
        <li>
            <a id="light"></a>
        </li>
        <li>
            <a id="dark"></a>
        </li>
        <li>
            <a id="custom"></a>
        </li>
    </ul>
    ```

2.  **Now go to js/toolbar.js, find init(activity){...}**

    There will be 4 arrays named string (two in an if statement, rest two in the else statement).
    Add your theme's name to the bottom of the array

    ```javascript
    string = [[...],
        ["light", _("Light Mode"), "innerHTML"],
        ["dark", _("Dark Mode"), "innerHTML"],
        ["custom", _("Custom Theme"), "innerHTML"]];
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

    (If you skipped to here, these are the files responsible for styling, the CSS is easy to understand and modify, but to change the color of elements in javascript files, look at the entire code base and search for "platformColor". You will find all the places where JS is used to style. You don't have to add your own theme, you can just change styling in dark mode CSS and JS, and then choose dark mode n the toolbar.)

    You have to add styling to three places,

    1. css/themes.css (this is external styling used for floating windows, search bar, etc.)
       If you go here, you will find styling for dark mode, just write your css using them as a template below the last theme's CSS. There is no light mode here because it is the default.

    2. js/utils/platformstyle.js (this is styling in JS, used to for the rest of the stuff not covered in themes.css)
       Find the platformThemes object and add your styling there using the dark and light themes as a template

        ```javascript
        let platformThemes = {
        dark: {...},
        light: {...},
        custom: {Your Styling}
        }
        ```

        There is a "for" loop below this

        ```javascript
        for (const theme in platformThemes) {
            if (themePreference === theme) {
                window.platformColor = platformThemes[theme];
                break;
            } else {
                window.platformColor = platformThemes["light"];
            }
        }
        ```

        This checks for keys (themes) in platformThemes, then assign the window.platformColor to that key(theme).
        Then platformColor is used to style things elsewhere. if there is no theme in themePreference, it will default to light mode.

    3. planet/css/planetThemes.css (this is styling used for planet page) you can do what you did in the first part of themes.css to add your styling

## And you are done. Good luck creating your theme!