document.querySelectorAll("#lang-switch a").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const lang = link.dataset.lang;

        if (lang === "en") {
            window.location.href = "/Docs/guide/index.html";
            return;
        }

        const target = `/Docs/guide-${lang}/index.html`;

        fetch(target, { method: "HEAD" })
            .then(res => {
                if (res.ok) {
                    window.location.href = target;
                } else {
                    window.location.href = "/Docs/guide/index.html";
                }
            })
            .catch(() => {
                window.location.href = "/Docs/guide/index.html";
            });
    });
});
