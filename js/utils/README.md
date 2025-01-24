# How to Customize Theme in Music Blocks?

This guide explains how themes are managed in Music Blocks (MB) and how you can customize them using both **internal** and **external** methods.

---

### Key Points on Theme Customization:

1. **Refresh Required for Theme Application**

   The site must be refreshed to apply a new theme in Music Blocks.

2. **Canvas and Palette Button Styles**

   Styles for the canvas and palette buttons are initialized at the time of loading MB.
   - These cannot be directly modified using CSS.

3. **Internal and External CSS**

   MB uses a combination of internal and external CSS:
   - **Internal CSS**: Block colors, pie menu, background, and other essential styles are defined in `js/utils/platformstyle.js`.
   - **External CSS**: Elements like the navbar and dropdown menu are styled using external CSS files.

4. **Saving Theme Name Locally**

   To persist a theme, save its name locally when toggled. For example, the **dark mode** implementation:
   ```javascript
    // Function to toggle theme mode
    this.toggleThemeMode = () => {
        if (this.storage.myThemeName === "darkMode") {
            // If currently in dark mode, remove the theme
            delete this.storage.myThemeName;
        } else {
            this.storage.myThemeName = "darkMode";
        }
        try {
            window.location.reload();
        } catch (e) {
            console.error("Error reloading the window:", e);
        }
    };
   ```

5. **Applying the Theme After Reload**

   Upon reloading, retrieve the theme name from local storage, and apply the corresponding class to the `<body>` element.
   - External CSS with the same class name will override the styles.
   - Ensure the external CSS file is linked **last** in the main HTML file.

   Example:
   ```javascript
    // If the theme is set to "darkMode", enable dark mode else diable
    try {
        if (this.storage.myThemeName === "darkMode") {
            body.classList.add("dark-mode");
        } else {
            body.classList.remove("dark-mode");
        }
    } catch (e) {
        console.error("Error accessing myThemeName storage:", e);
    }
   ```

6. **Theme Integration in `platformstyle.js`**

   Retrieve the saved theme name in `platformstyle.js`. Depending on the theme, initialize a different set of color variables that will affect multiple elements in MB.

---

#### Additional Notes:

- **Order of CSS Loading**: Always link your external CSS **after** the internal CSS to allow overriding.
- **Test Before Deployment**: Ensure theme persistence and compatibility with different features in Music Blocks.

By following these steps, you can efficiently manage and customize themes in Music Blocks to suit your preferences or design requirements.