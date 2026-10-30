// Copyright (c) 2017 Euan Ong
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// https://davidwalsh.name/javascript-debounce-function
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.

/*
   global

   _, $
*/
/*
   exported

   debounce, getCookie, setCookie, hideOnClickOutside,
   updateCheckboxes
*/

function debounce(func, wait, immediate) {
    let timeout;
    return () => {
        const context = this,
            args = arguments;

        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function getCookie(cname) {
    // from W3Schools
    const name = `${cname}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];

        while (c.charAt(0) === " ") c = c.substring(1);

        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    // from W3Schools
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    const expires = `expires=${d.toUTCString()}`;
    const isSecure = location.protocol === "https:";
    const flags = isSecure ? ";Secure;SameSite=Strict" : ";SameSite=Strict";
    document.cookie = `${cname}=${cvalue};${expires};path=/${flags}`;
}

function toggleText(id, a, b) {
    const el = document.getElementById(id);

    const currentText = el.textContent || "";
    const updatedText = currentText.includes(a)
        ? currentText.replace(a, b)
        : currentText.replace(b, a);

    el.textContent = updatedText;
}

function toggleExpandable(id, c) {
    const el = document.getElementById(id);
    el.className = el.className === `${c} open` ? c : `${c} open`;
}

const outsideClickListeners = new WeakMap();

function hideOnClickOutside(eles, other) {
    const validEles = (Array.isArray(eles) ? eles : [eles]).filter(Boolean);
    if (validEles.length === 0) return;

    const anchor = validEles[0];

    if (anchor && outsideClickListeners.has(anchor)) {
        const prevListener = outsideClickListeners.get(anchor);
        document.removeEventListener("click", prevListener);
        outsideClickListeners.delete(anchor);
    }

    // if click not in id, hide
    const outsideClickListener = event => {
        const path = event.path || (event.composedPath && event.composedPath()) || [];
        let ok = false;

        for (let i = 0; i < validEles.length; i++) {
            if (path.includes(validEles[i])) {
                ok = true;
                break;
            }
        }

        if (ok === false) {
            const otherEl = document.getElementById(other);
            if (otherEl) {
                otherEl.style.display = "none";
            }

            removeClickListener();
        }
    };

    const removeClickListener = () => {
        document.removeEventListener("click", outsideClickListener);
        if (anchor) {
            outsideClickListeners.delete(anchor);
        }
    };

    if (anchor) {
        outsideClickListeners.set(anchor, outsideClickListener);
    }

    document.addEventListener("click", outsideClickListener);
}

function updateCheckboxes(id) {
    const elements = document.getElementById(id).querySelectorAll("input:checked");
    const urlel = document.getElementById(id).querySelectorAll("input[type=text]")[0];
    let url = urlel.getAttribute("data-originalurl");

    for (let i = 0; i < elements.length; i++) url += `&${elements[i].name}=True`;

    urlel.value = url;
}

$(document).ready(() => {
    $("#publisher").modal();
    $("#deleter").modal();
    $("#projectviewer").modal();

    document.getElementById("global-search").addEventListener("input", evt => {
        document.getElementById("search-close").style.display =
            evt.target.value === "" ? "none" : "initial";
    });

    document.getElementById("view-more-chips").addEventListener("click", evt => {
        const showMore = _("Show more tags") + " ▼";
        const showLess = _("Show fewer tags") + " ▲";
        toggleExpandable("morechips", "flexchips");
        toggleText("view-more-chips", showMore, showLess);
    });

    const navbar = document.querySelector("nav");
    const searchSlot = document.getElementById("planet-search-slot");
    const localSection = document.getElementById("local");
    const globalSection = document.getElementById("global");

    const searchStates = [localSection, globalSection]
        .filter(Boolean)
        .map(section => {
            const titleRow = section.querySelector(".projects-title-row");
            const search = section.querySelector(".project-search-preview");

            return titleRow && search ? { section, titleRow, search } : null;
        })
        .filter(Boolean);

    const moveSearch = (search, destination, docked) => {
        if (typeof search.getAnimations === "function") {
            search.getAnimations().forEach(animation => animation.cancel());
        }
        const first = search.getBoundingClientRect();

        search.classList.toggle("project-search-docked", docked);
        destination.appendChild(search);

        const last = search.getBoundingClientRect();

        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;

        const prefersReducedMotion =
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (
            !prefersReducedMotion &&
            typeof search.animate === "function" &&
            (deltaX !== 0 || deltaY !== 0)
        ) {
            search.animate(
                [
                    {
                        transform: `translate(${deltaX}px, ${deltaY}px)`
                    },
                    {
                        transform: "translate(0, 0)"
                    }
                ],
                {
                    duration: 420,
                    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
                }
            );
        }
    };

    const restoreSearch = state => {
        if (!searchSlot || state.search.parentElement !== searchSlot) return;

        moveSearch(state.search, state.titleRow, false);
    };

    const updateSearchDocking = () => {
        if (!navbar || !searchSlot || searchStates.length === 0) return;

        const activeState = searchStates.find(
            state => getComputedStyle(state.section).display !== "none"
        );

        if (!activeState) return;

        searchStates.forEach(state => {
            if (state !== activeState) restoreSearch(state);
        });

        const navbarBottom = navbar.getBoundingClientRect().bottom;
        const titleTop = activeState.titleRow.getBoundingClientRect().top;
        const shouldDock = titleTop <= navbarBottom;
        const isDocked = activeState.search.parentElement === searchSlot;

        if (shouldDock && !isDocked) {
            moveSearch(activeState.search, searchSlot, true);
        } else if (!shouldDock && isDocked) {
            restoreSearch(activeState);
        }
    };

    let searchDockScheduled = false;

    const scheduleSearchDocking = () => {
        if (searchDockScheduled) return;

        searchDockScheduled = true;

        requestAnimationFrame(() => {
            searchDockScheduled = false;
            updateSearchDocking();
        });
    };

    window.addEventListener("scroll", scheduleSearchDocking, { passive: true });
    window.addEventListener("resize", scheduleSearchDocking, { passive: true });

    const scheduleAfterTabChange = () => {
        requestAnimationFrame(scheduleSearchDocking);
    };

    document.getElementById("local-tab")?.addEventListener("click", scheduleAfterTabChange);

    document.getElementById("global-tab")?.addEventListener("click", scheduleAfterTabChange);

    scheduleSearchDocking();
});

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        debounce,
        getCookie,
        setCookie,
        toggleText,
        toggleExpandable,
        hideOnClickOutside,
        updateCheckboxes
    };
}
