// js/init/splash-screen.js
// Handles the loading/splash screen animation, language selection, and loading text rotation.
// Extracted from inline script in index.html for CSP compliance.
document.addEventListener("DOMContentLoaded", function () {
    window._ = window._ || (x => x);

    function loadL10nSplashScreen() {
        console.debug("The browser is set to " + navigator.language);
        let lang = navigator.language;
        if (localStorage.languagePreference) {
            console.debug("Music Blocks is set to " + localStorage.languagePreference);
            lang = localStorage.languagePreference;
        }

        console.debug("Using " + lang);
        if (lang === undefined) {
            lang = "enUS";
            console.debug("Reverting to " + lang);
        }

        const container = document.getElementById("loading-media");
        const content = lang.startsWith("ja")
            ? `<img src="loading-animation-ja.png" loading="eager" fetchpriority="high" style="width: 70%; height: 90%; object-fit: contain;" alt="Loading animation">`
            : `<video loop autoplay muted playsinline fetchpriority="high" style="width: 90%; height: 100%; object-fit: contain;">
                <source src="loading-animation.webm" type="video/webm">
                <source src="loading-animation.mp4" type="video/mp4">
               </video>`;
        container.innerHTML = `<div class="media-wrapper" style="width: 100%; aspect-ratio: 16/9; max-height: 500px; display: flex; justify-content: center; align-items: center;">${content}</div>`;
    }

    loadL10nSplashScreen();

    setTimeout(function () {
        const loadingText = document.getElementById("loadingText");
        const texts = [
            _("Do, Re, Mi, Fa, Sol, La, Ti, Do"),
            _("Loading Music Blocks..."),
            _("Reading Music...")
        ];
        let index = 0;

        window.intervalId = setInterval(function () {
            loadingText.textContent = texts[index];
            index = (index + 1) % texts.length;
        }, 1500);
    }, 3000);

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
});
