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

function toggleSearch(on) {
    const displayValue = on ? "block" : "none";
    document.getElementById("searchcontainer").style.display = displayValue;
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

    document.getElementById("local-tab").addEventListener("click", evt => {
        toggleSearch(false);
    });

    document.getElementById("global-tab").addEventListener("click", evt => {
        toggleSearch(true);
    });

    document.getElementById("view-more-chips").addEventListener("click", evt => {
        const showMore = _("Show more tags") + " ▼";
        const showLess = _("Show fewer tags") + " ▲";
        toggleExpandable("morechips", "flexchips");
        toggleText("view-more-chips", showMore, showLess);
    });

    const updateNavbarTabSpacing = () => {
        const localSection = document.getElementById("local");
        const globalSection = document.getElementById("global");

        const activeSection =
            globalSection && getComputedStyle(globalSection).display !== "none"
                ? globalSection
                : localSection;

        const tabs = document.getElementById("localglobal");
        const globalTab = document.getElementById("global-tab");

        if (!activeSection || !tabs || !globalTab) return;

        const search = activeSection.querySelector(".project-search-preview");

        // Search is not in navbar -> restore normal tab position.
        if (!search || !search.classList.contains("project-search-floating")) {
            tabs.style.translate = "";
            return;
        }

        const input = search.querySelector("input");

        const isExpanded =
            search.matches(":hover") ||
            search.matches(":focus-within") ||
            (input && input.value.trim() !== "");

        // Search is docked but collapsed.
        if (!isExpanded) {
            tabs.style.translate = "";
            return;
        }

        const globalRect = globalTab.getBoundingClientRect();
        const searchRect = search.getBoundingClientRect();

        /*
         * Find the tab's real position before OUR extra translate.
         * This avoids the feedback/jumping problem while the tabs
         * themselves are animating.
         */
        const computedTranslate = getComputedStyle(tabs).translate;

        let currentTranslateX = 0;

        if (computedTranslate && computedTranslate !== "none") {
            currentTranslateX = parseFloat(computedTranslate.split(" ")[0]) || 0;
        }

        const originalGlobalRight = globalRect.right - currentTranslateX;

        /*
         * Search is right-anchored.
         * Its final expanded width is 230px.
         */
        const expandedSearchWidth = 230;
        const searchLeft = searchRect.right - expandedSearchWidth;

        // Keep a little breathing room between GLOBAL and search.
        const minimumGap = 12;

        const overlap = originalGlobalRight + minimumGap - searchLeft;

        const requiredShift = Math.max(0, overlap);

        tabs.style.translate = requiredShift > 0 ? `${-requiredShift}px 0` : "";
    };

    const updateTitleSearchSpacing = () => {
        const localSection = document.getElementById("local");
        const globalSection = document.getElementById("global");

        const activeSection =
            globalSection && getComputedStyle(globalSection).display !== "none"
                ? globalSection
                : localSection;

        if (!activeSection) return;

        const titleRow = activeSection.querySelector(".projects-title-row");
        const search = activeSection.querySelector(".project-search-preview");

        if (!titleRow || !search) return;

        const title = titleRow.querySelector("h3");

        if (!title) return;

        // The navbar has its own overlap handling.
        // Restore the title to its normal centered position while search is docked.
        if (search.classList.contains("project-search-floating")) {
            title.style.translate = "";
            return;
        }

        const input = search.querySelector("input");

        const isExpanded =
            search.matches(":hover") ||
            search.matches(":focus-within") ||
            (input && input.value.trim() !== "");

        // Collapsed search does not need extra title spacing.
        if (!isExpanded) {
            title.style.translate = "";
            return;
        }

        const titleRect = title.getBoundingClientRect();
        const searchRect = search.getBoundingClientRect();
        const rowRect = titleRow.getBoundingClientRect();

        /*
         * Recover the title's original centered position before our translate.
         * This prevents repeated measurements from making the title drift.
         */
        const computedTranslate = getComputedStyle(title).translate;

        let currentTranslateX = 0;

        if (computedTranslate && computedTranslate !== "none") {
            currentTranslateX = parseFloat(computedTranslate.split(" ")[0]) || 0;
        }

        const originalTitleLeft = titleRect.left - currentTranslateX;
        const originalTitleRight = titleRect.right - currentTranslateX;

        // Search expands toward the left and reaches 230px.
        const expandedSearchWidth = 230;
        const searchLeft = searchRect.right - expandedSearchWidth;

        // Keep visible breathing room between the heading and search.
        const minimumGap = 20;

        const overlap = originalTitleRight + minimumGap - searchLeft;

        /*
         * Never move the heading outside its title row.
         * Keep at least 12px available on the left.
         */
        const edgeGap = 12;
        const maxShift = Math.max(0, originalTitleLeft - (rowRect.left + edgeGap));

        const requiredShift = Math.min(Math.max(0, overlap), maxShift);

        title.style.translate = requiredShift > 0 ? `${-requiredShift}px 0` : "";
    };

    const updateSearchSpacing = () => {
        updateNavbarTabSpacing();
        updateTitleSearchSpacing();
    };

    const updateSearchDocking = () => {
        const localSection = document.getElementById("local");
        const globalSection = document.getElementById("global");

        const activeSection =
            globalSection && getComputedStyle(globalSection).display !== "none"
                ? globalSection
                : localSection;

        if (!activeSection) return;

        const titleRow = activeSection.querySelector(".projects-title-row");
        const search = activeSection.querySelector(".project-search-preview");
        const navbar = document.querySelector("nav");
        const tabs = document.getElementById("localglobal");
        const newProjectBtn = document.getElementById("planet-new-project");

        if (!titleRow || !search || !navbar || !tabs || !newProjectBtn) return;

        const navbarRect = navbar.getBoundingClientRect();
        const titleRect = titleRow.getBoundingClientRect();

        const shouldDock = titleRect.top <= navbarRect.bottom;
        const isDocked = search.classList.contains("project-search-floating");

        if (shouldDock === isDocked) return;

        const first = search.getBoundingClientRect();

        if (shouldDock) {
            const newBtnRect = newProjectBtn.getBoundingClientRect();

            search.classList.add("project-search-floating");

            search.style.top = `${navbarRect.top + (navbarRect.height - first.height) / 2}px`;

            search.style.left = "auto";
            search.style.right = `${window.innerWidth - (newBtnRect.left - 1)}px`;
            search.style.transform = "none";

            tabs.style.transform = "translateX(-40px)";
        } else {
            search.classList.remove("project-search-floating");

            search.style.top = "";
            search.style.left = "";
            search.style.right = "";
            search.style.transform = "";

            tabs.style.transform = "";
        }

        const last = search.getBoundingClientRect();

        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;

        const animation = search.animate(
            [
                {
                    transform: `translate(${deltaX}px, ${deltaY}px)`
                },
                {
                    transform: "translate(0, 0)"
                }
            ],
            {
                duration: 350,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)"
            }
        );

        requestAnimationFrame(updateSearchSpacing);

        animation.addEventListener("finish", updateSearchSpacing);
    };

    document.querySelectorAll(".project-search-preview").forEach(search => {
        const input = search.querySelector("input");

        search.addEventListener("mouseenter", () => {
            requestAnimationFrame(updateSearchSpacing);
        });

        search.addEventListener("mouseleave", () => {
            requestAnimationFrame(updateSearchSpacing);
        });

        search.addEventListener("focusin", () => {
            requestAnimationFrame(updateSearchSpacing);
        });

        search.addEventListener("focusout", () => {
            requestAnimationFrame(updateSearchSpacing);
        });

        if (input) {
            input.addEventListener("input", () => {
                requestAnimationFrame(updateSearchSpacing);
            });
        }

        search.addEventListener("transitionend", evt => {
            if (evt.propertyName === "width") {
                updateSearchSpacing();
            }
        });
    });

    window.addEventListener(
        "scroll",
        () => {
            requestAnimationFrame(updateSearchDocking);
        },
        { passive: true }
    );

    window.addEventListener(
        "resize",
        () => {
            requestAnimationFrame(() => {
                const localSection = document.getElementById("local");
                const globalSection = document.getElementById("global");

                const activeSection =
                    globalSection && getComputedStyle(globalSection).display !== "none"
                        ? globalSection
                        : localSection;

                if (!activeSection) return;

                const search = activeSection.querySelector(".project-search-preview");

                if (!search) return;

                if (!search.classList.contains("project-search-floating")) {
                    search.style.left = "";
                    search.style.right = "";

                    updateSearchSpacing();
                    return;
                }

                const newProjectBtn = document.getElementById("planet-new-project");

                if (!newProjectBtn) return;

                const newBtnRect = newProjectBtn.getBoundingClientRect();
                const searchRect = search.getBoundingClientRect();

                search.style.left = "auto";
                search.style.right = `${window.innerWidth - (newBtnRect.left - 1)}px`;
                updateSearchSpacing();
            });
        },
        { passive: true }
    );

    document.getElementById("local-tab").addEventListener("click", () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                updateSearchDocking();
                updateSearchSpacing();
            });
        });
    });

    document.getElementById("global-tab").addEventListener("click", () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                updateSearchDocking();
                updateSearchSpacing();
            });
        });
    });

    updateSearchDocking();
    requestAnimationFrame(updateSearchSpacing);
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
