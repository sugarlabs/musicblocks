// js/init/prefetch-ja-lang.js
// Prefetches the Japanese loading animation if the user's language is Japanese.
// Extracted from inline script in index.html for CSP compliance.
(function () {
    try {
        var lang = navigator.language;
        if (localStorage.getItem("languagePreference")) {
            lang = localStorage.getItem("languagePreference");
        }
        if (lang && lang.startsWith("ja")) {
            var link = document.createElement("link");
            link.rel = "preload";
            link.as = "image";
            link.href = "loading-animation-ja.svg";
            document.head.appendChild(link);
        }
    } catch (e) {
        console.warn("Error checking language for prefetch", e);
    }
})();
