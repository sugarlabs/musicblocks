export async function ensureABCJS() {
    if (typeof window !== "undefined" && window.ABCJS) return;
    if (typeof window === "undefined") return;

    return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[src="lib/abc.min.js"]');
        if (existing) {
            if (existing.hasAttribute('data-loaded')) resolve();
            else existing.addEventListener('load', resolve);
            return;
        }

        const script = document.createElement("script");
        script.src = "lib/abc.min.js";
        script.onload = () => {
            script.setAttribute('data-loaded', 'true');
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
