// Copyright (c) 2026 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Single source of truth for the Turtle Blocks vs Music Blocks release.
// The flag is resolved from the URL first (so a single bundle can serve both
// apps from different hostnames), with DEFAULT_IS_MUSIC_BLOCKS as the fallback
// for localhost / file:// / unrecognized hosts.
//
// Resolution order:
//   1. ?turtle or ?music query param  (handy for local testing)
//   2. hostname contains "turtle" or "music"
//   3. DEFAULT_IS_MUSIC_BLOCKS (build-time default)
//
// The fallback is intentionally Music Blocks so local development and
// unrecognized hosts start in the Music Blocks experience by default.

/* exported
   THIS_IS_MUSIC_BLOCKS, THIS_IS_TURTLE_BLOCKS,
   getSplashScreenSrc, RELEASE_TAB_TITLE, LOADING_TEXTS
*/

const DEFAULT_IS_MUSIC_BLOCKS = true;

const setReleaseGlobals = () => {
    const isMusicBlocks = resolveIsMusicBlocks();
    const isTurtleBlocks = !isMusicBlocks;

    window._THIS_IS_MUSIC_BLOCKS_ = isMusicBlocks;
    window._THIS_IS_TURTLE_BLOCKS_ = isTurtleBlocks;
    window.THIS_IS_MUSIC_BLOCKS = isMusicBlocks;
    window.THIS_IS_TURTLE_BLOCKS = isTurtleBlocks;
};

function resolveIsMusicBlocks(loc) {
    try {
        const targetLocation =
            loc !== undefined ? loc : typeof window !== "undefined" ? window.location : null;
        if (targetLocation) {
            const search = targetLocation.search || "";
            const params = new URLSearchParams(search);
            if (params.has("turtle")) return false;
            if (params.has("music")) return true;

            const host = (targetLocation.hostname || "").toLowerCase();
            if (host.includes("turtle")) return false;
            if (host.includes("music")) return true;
        }
    } catch (e) {
        // Silently fallback to default if location access throws
    }

    return DEFAULT_IS_MUSIC_BLOCKS;
}

const THIS_IS_MUSIC_BLOCKS = resolveIsMusicBlocks();
const THIS_IS_TURTLE_BLOCKS = !THIS_IS_MUSIC_BLOCKS;

setReleaseGlobals();

// Turtle Blocks splash: inline base64 SVG of the Turtle Blocks logo — a turtle
// formed from four colored triangles (blue/yellow/green/red) whose fills cycle
// on a 4s animation loop. Inline (not a file path) so it has no asset
// dependency and travels with this config.
const TURTLE_SPLASH_SRC =
    "data:image/svg+xml;base64,PHN2ZyBzdHJva2Utd2lkdGg9IjEuNSIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDU1IDU1IiB3aWR0aD0iMTAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0ibTUzLjQ4IDI4LjMxYy0uMjA5LTEuNTQ0LS42ODQtMy45NjMtMi40MzUtNC43OTktMS4xMS0uNTI5LTcuMTguNTM2LTExLjMxNi45ODguMTQ1IDIuNDg4LS43NzggNS4xNTUtMy45NCA5LjgwOS0xLjg4NiAzLjI0Mi0xMC40MTEgMy41MTYtMTAuOCAzLjQ5NGwtMjMuNTU4LS4xMDNjMS4xNjkgMS42NDggMy42ODYgMy43NjIgNi40NjcgNC4xMTItLjc0Ni42NTgtMy4wOTggMy4yNzctMy4yNzMgNi42ODEtLjAwNS4wNzYuMDAyLjQwOSAwIC40MDloNy40MzRjLjI1NS0xLjg1My45NzYtNS4yNzMgMi44OTYtNi41MTQgMS40MzItLjAwOCAyLjczOC0uMTY3IDMuNzU3LS4xMTYgMi4zNTIuMTE3IDcuMTEzLS4wNDcgMTAuMzE1LS4yNzYuMDI0LjAxMy4wMzkuMjczLjA2NC4yODggMi4wOTMgMS4xMDcgMi44NTMgNC43NjYgMy4xMTkgNi42MTloNy40MzRjLS4wMDEgMCAuMDA2LS4zMzQuMDAxLS40MDktLjE3My0zLjM2Mi0zLjE0NC02LjU2OS00LjE0Ny03LjUxMyAyLjgzNy0xLjI2MSA3LjEyMy01LjQ1OSA4LjI0My02LjY3OC4yOTUtLjMxOSAxLjM5MS0xLjY3OSAyLjIyNi0yLjMwMy43ODMtLjU4NSAzLjMzOC0uODk0IDQuMjk3LS45MzYuOTYxLS4wNDIgMyAuNDA4IDMgLjQwOCAwIDAgLjMwNy0yLjA2LjIxLTIuNzYzeiIgc3Ryb2tlLXdpZHRoPSIxLjkyNSIvPjxjaXJjbGUgY3k9IjM3LjIyIiByPSIxLjEwOSIgc3Ryb2tlLXdpZHRoPSIxLjE4NyIgY3g9IjU5LjQ4IiB0cmFuc2Zvcm09Im1hdHJpeCguOTI2NCAwIDAgLjkyNjQtNi45MTUtOC4zMDkpIi8+PGcgc3Ryb2tlLXdpZHRoPSIxLjkyNSIgdHJhbnNmb3JtPSJtYXRyaXgoMS4wMzIwOSAwIDAgLjk5OTA1LS4xODQuMDI0KSI+PHBhdGggZD0ibTEwLjU3MiAzNi45Mmw1Ljc5OC0xNC4xNS01LjAxLTUuNTM1Yy0xLjQyMyAxLjcxOC0yLjQ4MSAzLjcxMS0yLjgxNSA1LjA1LS40NTEgMS43OTggMCA3Ljk2My41ODYgMTAuMTQ0bC0yLjgxOCA0LjU3MiA0LjA1MS0uMTQ4eiIgZmlsbD0iIzE4NmRlZSI+PGFuaW1hdGUgdmFsdWVzPSIjMTg2ZGVlOyNmZmI1MDQ7I2Q4NDMyZTsjMDA5YTU3OyMxODZkZWUiIGF0dHJpYnV0ZVR5cGU9IkNTUyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIGR1cj0iNHMiIGF0dHJpYnV0ZU5hbWU9ImZpbGwiLz48L3BhdGg+PHBhdGggZD0ibTE1LjgyNyAyMy4xNGwxMi42NDctLjMyNCAzLjExOS0zLjk3NmMtLjg3LTEuMjk5LTIuMDEtMi41NTgtMy40NzYtMy4zMTUtNC4zNTYtMi4yNTctOC4yNjktMy4xMS0xMy45NjYtLjI4MS0xLjMxMi42NTItMS45NjEgMS4xNTItMi43NzMgMS45MzV6IiBmaWxsPSIjZmZiNTA0Ij48YW5pbWF0ZSB2YWx1ZXM9IiNmZmI1MDQ7I2Q4NDMyZTsjMDA5YTU3OyMxODZkZWU7I2ZmYjUwNCIgYXR0cmlidXRlVHlwZT0iQ1NTIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgZHVyPSI0cyIgYXR0cmlidXRlTmFtZT0iZmlsbCIvPjwvcGF0aD48cGF0aCBkPSJtMjguODI4IDIyLjk0NWwtMTIuNDc3LjEwNS01LjY0NyAxNC4wOCAxOC4zOTEuMjA1YzMuNTA0LS4xMzUgNC41LTEuMDMyIDUuNDYyLTEuOTYzeiIgZmlsbD0iIzAwOWE1NyI+PGFuaW1hdGUgdmFsdWVzPSIjMDA5YTU3OyMxODZkZWU7I2ZmYjUwNDsjZDg0MzJlOyMwMDlhNTciIGF0dHJpYnV0ZVR5cGU9IkNTUyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIGR1cj0iNHMiIGF0dHJpYnV0ZU5hbWU9ImZpbGwiLz48L3BhdGg+PHBhdGggZD0ibTM0Ljk4MSAyMy43NjZjMCAwLTIuMDEtMi41MDUtMy4wOTgtNC40NDFsLTIuOTAyIDMuNzAxIDUuMzc1IDEyLjU1N2MuOTA4LS42MTYgMi4yNTYtMi41MTIgMi44OTgtMy40OTIgMi40MTktMy4yMzggMi42OTMtNy45OTkgMi42OTMtNy45OTl6IiBmaWxsPSIjZDg0MzJlIj48YW5pbWF0ZSB2YWx1ZXM9IiNkODQzMmU7IzAwOWE1NzsjMTg2ZGVlOyNmZmI1MDQ7I2Q4NDMyZSIgYXR0cmlidXRlVHlwZT0iQ1NTIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgZHVyPSI0cyIgYXR0cmlidXRlTmFtZT0iZmlsbCIvPjwvcGF0aD48L2c+PC9zdmc+";

// Music Blocks splash assets.
// Falls back to images/logo.svg if the file is missing.
const MUSIC_BLOCKS_SPLASH_SRC = "images/logo.svg";
// Special splash shown when the UI language is Japanese.
const MUSIC_BLOCKS_SPLASH_SRC_JA = "images/mb_logo_ja.svg";

// Mirror the app's language resolution (see turtledefs.js): explicit user
// preference first, then browser locale.
function resolveLanguage() {
    let language;
    try {
        if (typeof localStorage !== "undefined") {
            language = localStorage.languagePreference;
        }
    } catch (e) {
        language = undefined;
    }
    if (language === undefined || language === null) {
        language = (typeof navigator !== "undefined" && navigator.language) || "";
    }
    return language;
}

function getSplashScreenSrc(isTurtle = THIS_IS_TURTLE_BLOCKS) {
    if (isTurtle) return TURTLE_SPLASH_SRC;
    return resolveLanguage() === "ja" ? MUSIC_BLOCKS_SPLASH_SRC_JA : MUSIC_BLOCKS_SPLASH_SRC;
}

const RELEASE_TAB_TITLE = THIS_IS_TURTLE_BLOCKS ? "Turtle Blocks" : "Music Blocks";

const LOADING_TEXTS = THIS_IS_TURTLE_BLOCKS
    ? ["Loading Turtle Blocks...", "Stacking some blocks...", "Get ready to draw..."]
    : ["Do, Re, Mi, Fa, Sol, La, Ti, Do", "Loading Music Blocks...", "Reading Music..."];

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        resolveIsMusicBlocks,
        getSplashScreenSrc,
        RELEASE_TAB_TITLE,
        LOADING_TEXTS,
        TURTLE_SPLASH_SRC,
        MUSIC_BLOCKS_SPLASH_SRC,
        MUSIC_BLOCKS_SPLASH_SRC_JA
    };
}
