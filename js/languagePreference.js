/**
 * Initializes language preference selection from the language dropdown.
 * Stores the selected language in localStorage and reloads the page on change.
 */
function initializeLanguagePreference() {
    const languageDropdown = document.getElementById("languagedropdown");
    if (languageDropdown) {
        const langLinks = languageDropdown.querySelectorAll("a");
        langLinks.forEach(link => {
            link.addEventListener("click", function (e) {
                e.preventDefault();
                const selectedLang = this.id;
                const currentLang = localStorage.getItem("languagePreference");
                if (currentLang !== selectedLang) {
                    localStorage.setItem("languagePreference", selectedLang);
                    location.reload();
                }
            });
        });
    }
}

if (typeof module !== "undefined") {
    module.exports = { initializeLanguagePreference };
}
