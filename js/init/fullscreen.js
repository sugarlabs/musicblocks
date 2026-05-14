// js/init/fullscreen.js
// Handles fullscreen toggling and icon state updates.
// Extracted from inline script in index.html for CSP compliance.
var elem = document.documentElement;

function openFullscreen() {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullscreen) {
        elem.mozRequestFullscreen();
    }
}

function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else if (document.mozExitFullscreen) {
        document.mozExitFullscreen();
    }
}

function setIcon() {
    var iconCode = document.querySelector("#FullScrIcon");
    var isFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

    if (!isFullscreen) {
        openFullscreen();
        iconCode.textContent = "\ue5d1"; // fullscreen_exit icon
    } else {
        closeFullscreen();
        iconCode.textContent = "\ue5d0"; // fullscreen icon
    }
}

function handleFullscreenChange() {
    var iconCode = document.querySelector("#FullScrIcon");
    var fullScreenBtn = document.querySelector("#FullScreen");
    var isFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

    iconCode.textContent = isFullscreen ? "\ue5d1" : "\ue5d0";

    if (fullScreenBtn && typeof _ === "function") {
        var tooltipText = isFullscreen ? _("Exit Fullscreen") : _("Enter Fullscreen");
        fullScreenBtn.setAttribute("data-tooltip", tooltipText);
        if (window.jQuery) {
            window.jQuery(fullScreenBtn).tooltip({ html: true, delay: 100 });
        }
    }
}

document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("mozfullscreenchange", handleFullscreenChange);
document.addEventListener("MSFullscreenChange", handleFullscreenChange);
