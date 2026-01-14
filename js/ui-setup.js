/**
 * Music Blocks UI Setup
 * Handles: Canvas Init, PWA, Loading Screens, Fullscreen, and Responsive Layout
 */

$(document).ready(function () {
    // 1. Initialize CreateJS Stage
    initCanvas();

    // 2. Service Worker (PWA) Registration
    registerServiceWorker();

    // 3. Loading Screen & Localization
    initLoadingScreen();

    // 4. Responsive "Play-Only" Mode Logic
    initResponsiveMode();

    // 5. Table Fixes & Scroll Events
    initTableFixes();

    // 6. Fullscreen API Setup
    window.toggleFullscreenIcon = setIcon; // Expose to HTML if needed
});

/** --- Logic Implementation Functions --- **/

function initCanvas() {
    const canvas = document.getElementById("canvas");
    if (canvas && window.createjs) {
        const stage = new createjs.Stage(canvas);
        createjs.Ticker.framerate = 60;
        createjs.Ticker.addEventListener("tick", stage);
    }
}

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        if (!navigator.serviceWorker.controller) {
            navigator.serviceWorker.register("/sw.js").then(function (reg) {
                console.debug("[PWA] Registered for scope: " + reg.scope);
            });
        }
    }
}

function initLoadingScreen() {
    const container = document.getElementById("loading-media");
    if (!container) return;

    let lang = localStorage.languagePreference || navigator.language || "enUS";
    
    const content = lang.startsWith("ja")
        ? `<img src="loading-animation-ja.svg" loading="eager" fetchpriority="high" style="width: 70%; height: 90%; object-fit: contain;" alt="Loading">`
        : `<video loop autoplay muted playsinline fetchpriority="high" style="width: 90%; height: 100%; object-fit: contain;">
            <source src="loading-animation.webm" type="video/webm">
            <source src="loading-animation.mp4" type="video/mp4">
           </video>`;

    container.innerHTML = `<div class="media-wrapper" style="width: 100%; aspect-ratio: 16/9; max-height: 500px; display: flex; justify-content: center; align-items: center;">${content}</div>`;

    // Helper for translation function if it doesn't exist
    const translate = (t) => (typeof _ === "function" ? _(t) : t);

    setTimeout(function () {
        const loadingText = document.getElementById("loadingText");
        if (!loadingText) return;

        const texts = [
            translate("Do, Re, Mi, Fa, Sol, La, Ti, Do"),
            translate("Loading Music Blocks..."),
            translate("Reading Music...")
        ];
        let index = 0;

        const intervalId = setInterval(function () {
            loadingText.textContent = texts[index];
            index = (index + 1) % texts.length;
        }, 1500);

        setTimeout(function () {
            clearInterval(intervalId);
            loadingText.textContent = translate("Loading Complete!");
            loadingText.style.opacity = 1;
        }, 6000);
    }, 3000);
}

function initTableFixes() {
    // Custom jQuery Plugin for fixed headers
    $.fn.fixMe = function () {
        return this.each(function () {
            let $this = $(this), $t_fixed;
            const init = () => {
                $this.wrap('<div class="container" />');
                $t_fixed = $this.clone().find("tbody").remove().end().addClass("fixed").insertBefore($this);
                resizeFixed();
            };
            const resizeFixed = () => {
                setTimeout(() => {
                    $t_fixed.find("th").each(function (index) {
                        $(this).css("width", $this.find("th").eq(index).outerWidth() + "px");
                    });
                }, 100);
            };
            const scrollFixed = () => {
                let offset = $(window).scrollTop();
                let tableTop = $this.offset().top;
                let tableBottom = tableTop + $this.height() - $this.find("thead").height();
                if (offset < tableTop || offset > tableBottom) $t_fixed.hide();
                else if ($t_fixed.is(":hidden")) $t_fixed.show();
            };
            $(window).resize(resizeFixed).scroll(scrollFixed);
            init();
        });
    };

    $("solfa").fixMe();
    $(".up").click(() => $("html, body").animate({ scrollTop: 0 }, 2000));
    
    if (typeof doSearch === "function") doSearch();
}

function initResponsiveMode() {
    const togglePlayOnlyMode = () => {
        const isSmall = window.innerWidth < 768 || window.innerHeight < 600;
        const ids = ["Show/hide blocks", "Expand/collapse blocks", "Decrease block size", "Increase block size", "grid", "palette"];
        
        if (isSmall) {
            document.body.classList.add("play-only");
            if (!document.getElementById("persistentNotification")) {
                const n = document.createElement("div");
                n.id = "persistentNotification";
                n.innerHTML = "Play only mode enabled. Use a larger display for full experience.";
                document.body.appendChild(n);
            }
            ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });
        } else {
            document.body.classList.remove("play-only");
            $("#persistentNotification").remove();
            ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = ""; });
        }
    };

    togglePlayOnlyMode();
    window.addEventListener("resize", togglePlayOnlyMode);
}

/** --- Fullscreen Logic --- **/
let fullScreenCount = 0;
function setIcon() {
    const iconCode = document.querySelector('#FullScrIcon');
    if (fullScreenCount == 0) {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        if (iconCode) iconCode.textContent = '\ue5d1';
        fullScreenCount = 1;
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        if (iconCode) iconCode.textContent = '\ue5d0';
        fullScreenCount = 0;
    }
}