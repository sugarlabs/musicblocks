function ensureABCJS() {
    if (typeof window !== "undefined" && window.ABCJS) {
        return Promise.resolve();
    }

    if (typeof window === "undefined") {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[src="lib/abc.min.js"]');

        if (existing) {
            if (existing.hasAttribute("data-loaded")) {
                resolve();
            } else {
                existing.addEventListener("load", resolve);
            }
            return;
        }

        const script = document.createElement("script");
        script.src = "lib/abc.min.js";

        script.onload = () => {
            script.setAttribute("data-loaded", "true");
            resolve();
        };

        script.onerror = reject;

        document.head.appendChild(script);
    });
}

if (typeof window !== "undefined") {
    window.ensureABCJS = ensureABCJS;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ensureABCJS;
}
