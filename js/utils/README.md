# How to Customize Theme in Music Blocks?

This guide explains how you can add your own custom theme in Music Blocks!

---

### How themes work in Music Blocks

1. When the page loads for the first time, the default theme of light mode is used. (because no themePreference has been set yet)

2. When you choose a theme, a Object stores inside the localStorage called themePreference.

3. As of now, all the styling of Music Blocks happens on the time of loading. So we will simply load the page.

4. The stylings on the main page happen due to two things:

    1. css/themes.css
    2. js/utils/platformstyle.js

5. the stylings on the planet page happens due to one file

    1. planet/css/planetThemes.css

6. The code to handle themes assignment to their respective places is already done. You just have to follow the steps given below to add your theme.

---

### Steps on Theme Customization:

1.  **Adding your themes name to the list in index.html**

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
            <a id="pastel"></a>
        </li>
        <li>
            <a id="your_theme"></a>
        </li>
    </ul>
    ```

2.  **Now go to js/toolbar.js, find init(activity){...}**

    There will be 4 arrays named string (two in an if statement, rest two in the else statement).
    Add your themes Name to the array's bottom

    ```javascript
    string = [[...],
        ["light", _("Light Mode"), "innerHTML"],
        ["dark", _("Dark Mode"), "innerHTML"],
        ["pastel", _("Pastel Theme"), "innerHTML"],
        ["your_theme", _("Your Theme's Name"), "innerHTML"]];
    ```

    ```javascript
    string = [_(...),
    _("Light Mode"),
    _("Dark Mode"),
    _("Pastel Theme"),
    _("Your Theme Name")];
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
            this.themes = ["light", "pastel", "dark", "your_theme"];
            ...
        )
    }
    ```

    Add your theme here too. In activity.js, you will find just below there is this for loop, this checks for all the themes in the themes array we just saw above and then add the theme class in themes.css (which you will add in later steps) ehich matches the themePreference object in localStorage.

    ```javascript
    for (let i = 0; i < this.themes.length; i++) {
        if (this.themes[i] === this.storage.themePreference) {
            body.classList.add(this.themes[i]);
        } else {
            body.classList.remove(this.themes[i]);
        }
    }
    ```

    If no theme is selected i.e there is no themePreference in localStorage. the styles will default to light mode because it is the base styling with no class in themes.css. But when there is a themePreference in localStorage, the class respective to the chosen theme will be added to the elements which will apply because of higher specificity.

4.  **Adding your theme to the planet page**

    Go to planet/js/Planet.js and look for

    ```javascript
    document.addEventListener("DOMContentLoaded", function () {
        let themes = ["light", "pastel", "dark", "your_theme"];
        for (let i = 0; i < themes.length; i++) {
            if (themes[i] === localStorage.getItem("themePreference")) {
                document.body.classList.add(themes[i]);
            } else {
                document.body.classList.remove(themes[i]);
            }
        }
    });
    ```

    Add your theme here too. And this for loop above checks (after the DOM is loaded) for all themes in themes array to add the class in planetThemes.css (which you will add in later steps) which match themePreference in localStorage to the elements on planet/index.html. That is why the changes happen after the reload.
    If no theme is selected i.e there is no themePreference in localStorage. the styles will default to light mode because it is the base styling with no class in planetThemes.css . But when there is a themePreference in localStorage, the class respective to the chosen theme will be added to the elements which will apply because of higher specificity.

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
    pastel_onclick() {
        this._theme = "pastel";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    your_theme_onclick() {
        this._theme = "your_theme";
        this.setPreference();
    }
    ...
    }
    ```

    Add your function about your theme just like the example shown above. renderSelectThemeIcon function in step 3 will call this theme function, setPreference function will set themepreference in localStorage and then reload the page

6.  **Now to add styling for your theme**

    You have to add styling to three places,

    1. css/themes.css (this is external styling used for floating windows, search bar, etc.)
       If you go here, you will find styling for dark mode, and pastel theme, just write your css using them as a template below the last theme's CSS. There is no light mode here because it is the default.

    2. js/utils/platformstyle.js (this is styling in JS, used to for the rest of the stuff not covered in themes.css)
       Find the platformThemes object and add your styling there using the dark, pastel, light themes as a template

        ```javascript
        let platformThemes = {
        dark: {...},
        light: {...},
        pastel: {...},
        your_theme: {your_styling}
        }
        ```

        There is a for loop below this

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

        This checks for keys(themes) in platformThemes, then assign the window.platformColor to that key(theme).
        Then platformColor is used to style things elsewhere. if there is no theme in themePreference, it will default to light mode.

    3. planet/css/planetThemes.css (this is styling used for planet page) you can do what you did in the first part of themes.css to add your styling

## And you are done. Good luck creating your theme!
