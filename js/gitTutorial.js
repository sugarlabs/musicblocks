// Copyright (c) 2026 Harihara Vardhan K
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* exported GitTutorial */

/**
 * GitTutorial
 *
 * A 4-step interactive tutorial panel that teaches kids about the Git
 * features in Music Blocks. Opens as a floating overlay triggered
 * from the Help (?) dropdown.
 *
 * Steps:
 *   1. Track my project  - creates a GitHub repo
 *   2. Mark this moment  - commit / version snapshot
 *   3. Time travel       - commit history + time travel
 *   4. Remix from Planet - copy a project from Planet
 *
 * Video behaviour:
 *   - Videos loop continuously while the slide is active (loop attribute).
 *   - Each video has clean overlay controls: play/pause button + scrubber timeline.
 *   - Controls are wired per-step and fully torn down when leaving a slide.
 *   - Re-visiting a slide always restarts the video from the beginning.
 */
const GitTutorial = (() => {
    // ── Phosphor icon SVGs (only the 5 used in this tutorial) ────────────────────────
    // Source: https://phosphoricons.com  (MIT licence)
    // Each helper returns a self-contained <svg> string at 1em × 1em.
    const ICONS = {
        /** MapPin — “Track my project” */
        mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M128 16a96 96 0 1 0 96 96A96.11 96.11 0 0 0 128 16Zm0 56a40 40 0 1 1-40 40 40 40 0 0 1 40-40Zm0 176a95.61 95.61 0 0 1-64-24.44V216a8 8 0 0 0 8 8h112a8 8 0 0 0 8-8v-12.44A95.61 95.61 0 0 1 128 248Z"/>
        </svg>`,
        /** Camera — “Mark this moment” */
        camera: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M208 56h-27.31l-14.73-22.09A8 8 0 0 0 160 32H96a8 8 0 0 0-6.68 3.57L74.06 56H48a24 24 0 0 0-24 24v112a24 24 0 0 0 24 24h160a24 24 0 0 0 24-24V80a24 24 0 0 0-24-24Zm8 136a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V80a8 8 0 0 1 8-8h32a8 8 0 0 0 6.68-3.57L101.06 48h53.88l14.38 20.43A8 8 0 0 0 176 72h32a8 8 0 0 1 8 8ZM128 88a44 44 0 1 0 44 44 44.05 44.05 0 0 0-44-44Zm0 72a28 28 0 1 1 28-28 28 28 0 0 1-28 28Z"/>
        </svg>`,
        /** ClockCounterClockwise — “Time travel” */
        clock: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M136 80v43.47l36.12 21.67a8 8 0 0 1-8.24 13.72l-40-24A8 8 0 0 1 120 128V80a8 8 0 0 1 16 0Zm-8-48A96 96 0 0 0 47.08 60H32a8 8 0 0 0 0 16H72a8 8 0 0 0 8-8V28a8 8 0 0 0-16 0v13.22A80 80 0 1 1 48 128a8 8 0 0 0-16 0 96 96 0 1 0 96-96Z"/>
        </svg>`,
        /** GitFork — “Remix from Planet” */
        gitFork: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M236 64a28 28 0 1 0-36 26.87V96a20 20 0 0 1-20 20h-44V90.87a28 28 0 1 0-16 0V116H76a20 20 0 0 1-20-20v-5.13a28 28 0 1 0-16 0V96a36 36 0 0 0 36 36h44v33.13a28 28 0 1 0 16 0V132h44a36 36 0 0 0 36-36v-5.13A28 28 0 0 0 236 64ZM56 64a12 12 0 1 1 12 12 12 12 0 0 1-12-12Zm72 128a12 12 0 1 1-12-12 12 12 0 0 1 12 12ZM116 64a12 12 0 1 1 12 12 12 12 0 0 1-12-12Zm72 12a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z"/>
        </svg>`,
        /** Lightbulb — tips & header */
        lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M176 232a8 8 0 0 1-8 8H88a8 8 0 0 1 0-16h80a8 8 0 0 1 8 8Zm40-128a88 88 0 0 1-32.63 68.78C179.74 177.42 176 188.21 176 200v4a16 16 0 0 1-16 16H96a16 16 0 0 1-16-16v-4c0-11.72-3.56-22.41-7.11-27.34A88 88 0 1 1 216 104Zm-16 0a72 72 0 1 0-124.57 48.8C80.14 159.69 85 173.05 96 200h64c11-26.91 15.88-40.21 20.6-47.25A71.74 71.74 0 0 0 200 104Z"/>
        </svg>`
    };

    // ── Step definitions ──────────────────────────────────────────────────────
    const STEPS = [
        {
            chipIcon: "mapPin",
            chip: "Track my project",
            title: "Track my project",
            heading: "Save your project!",
            body: `Click <strong>Track my project</strong> in the Git menu to save your project.
                      Think of it like a <strong>scrapbook</strong> that remembers everything you do.<br><br>
                      Each time you save a moment, it gets kept forever.
                      When you are ready, you can share your project with others and even work on it together!`,
            tip: "You only need to do this once per project. After that, every moment you save is kept forever!",
            media: { type: "video", src: "videos/git-save-a-spot.mp4" }
        },
        {
            chipIcon: "camera",
            chip: "Mark this moment",
            title: "Mark this moment",
            heading: "Take a snapshot of your project right now!",
            body: `Made something you like? Click <strong>Mark this moment</strong> to save
                      a copy of your project at this point in time.<br><br>
                      Write a short note about what you did. That note helps you remember your changes,
                      and helps you figure out what went wrong if something breaks later. That is how programmers find and fix bugs!`,
            tip: 'Type a short note like "added drums" so you remember what you changed!',
            media: { type: "video", src: "videos/git-mark-this-moment.mp4" }
        },
        {
            chipIcon: "clock",
            chip: "Time travel",
            title: "Time travel",
            heading: "Travel back to any saved moment of your project!",
            body: `Click <strong>Time travel</strong> to see every moment you have saved,
                      from most recent to oldest.<br><br>
                      See a version you want to go back to? Click <strong>Go back to this version</strong>
                      and your project jumps right back to that moment. This is how programmers find and fix mistakes: they go back in time to see what changed!`,
            tip: "Every saved moment is stored. Go back, compare, and figure out what changed and why!",
            media: { type: "video", src: "videos/git-timeline.mp4" }
        },
        {
            chipIcon: "gitFork",
            chip: "Remix from Planet",
            title: "Remix from Planet",
            heading: "Learn from others. Build something new together.",
            body: `Seen a cool project on Planet? Click <strong>Remix project</strong>
                      on any card to get your own copy.<br><br>
                      Study how they built it. Remix it with your own ideas. Change the melody, add new instruments, take it somewhere new. This is how programmers work together: they learn from each other and build something even better!`,
            tip: "The original project is always safe. Share what you make back to Planet so others can learn from you too!",
            media: { type: "image", src: "images/fork_planet.png", alt: "Remix from Planet" }
        }
    ];

    const TOTAL = STEPS.length;

    // ── State ─────────────────────────────────────────────────────────────────
    let current = 0;
    let overlayEl = null;
    let _activity = null;

    /**
     * Per-video cleanup registry.
     * Maps stepIndex → { rafHandle, listener refs } so we can tear down
     * the timeline rAF loop and event listeners cleanly when leaving a slide.
     */
    const _videoCleanup = new Map();

    // ── Public API ────────────────────────────────────────────────────────────
    function open(activity) {
        if (overlayEl) return;
        _activity = activity || null;
        current = 0;
        _render();
    }

    function close() {
        if (!overlayEl) return;
        _pauseAllVideos();
        _teardownAllVideoPlayers();
        document.removeEventListener("keydown", _onKey);
        overlayEl.remove();
        overlayEl = null;
    }

    // ── Build DOM ─────────────────────────────────────────────────────────────
    function _render() {
        // Inject styles once
        if (!document.getElementById("git-tutorial-styles")) {
            const s = document.createElement("style");
            s.id = "git-tutorial-styles";
            s.textContent = _css();
            document.head.appendChild(s);
        }

        overlayEl = document.createElement("div");
        overlayEl.id = "git-tutorial-overlay";
        overlayEl.addEventListener("click", e => {
            if (e.target === overlayEl) close();
        });

        const shell = document.createElement("div");
        shell.id = "git-tutorial-shell";
        shell.innerHTML = _shellHTML();
        overlayEl.appendChild(shell);
        document.body.appendChild(overlayEl);

        _wireAll();
        _updateUI();

        // Play first slide video
        _activateStepMedia(0);
    }

    // ── HTML ──────────────────────────────────────────────────────────────────
    function _shellHTML() {
        const dotsHTML = Array.from(
            { length: TOTAL },
            (_, i) => `<span class="gt-dot" data-i="${i}"></span>`
        ).join("");

        const stepsHTML = STEPS.map(
            (s, i) => `
            <div class="gt-step" id="gt-step-${i}" aria-hidden="${i !== 0}">
                <div class="gt-left">
                    <div class="gt-chip">${ICONS[s.chipIcon]}${s.chip}</div>
                    <div class="gt-heading">${s.heading}</div>
                    <div class="gt-body-text">${s.body}</div>
                    <div class="gt-tip">
                        <span class="gt-tip-icon">${ICONS.lightbulb}</span>
                        <span>${s.tip}</span>
                    </div>
                </div>
                <div class="gt-right">
                    ${_mediaHTML(s.media, i)}
                </div>
            </div>`
        ).join("");

        return `
            <div id="gt-topbar">
                <div id="gt-topbar-left">
                    <span id="gt-bulb">${ICONS.lightbulb}</span>
                    <span>Git Tutorial</span>
                </div>
                <div id="gt-dots">${dotsHTML}</div>
                <div id="gt-close">&#10005; Close</div>
            </div>

            <div id="gt-title-bar">
                <div id="gt-step-num">Step 1 of ${TOTAL}</div>
                <div id="gt-step-title"></div>
            </div>

            <div id="gt-body">
                <button id="gt-prev" aria-label="Previous">&#8592;</button>
                <div id="gt-steps-wrap">${stepsHTML}</div>
                <button id="gt-next-arrow" aria-label="Next">&#8594;</button>
            </div>

            <div id="gt-footer">
                <div id="gt-prog-label">1 / ${TOTAL}</div>
                <div id="gt-prog-track"><div id="gt-prog-fill"></div></div>
                <button id="gt-next-btn">Next &#8594;</button>
            </div>`;
    }

    /**
     * Returns the HTML for a step's media area.
     * For videos, wraps the <video> in a .gt-player container with custom
     * overlay controls: a play/pause button and a scrubber timeline.
     *
     * @param {object} media  - { type, src, alt? }
     * @param {number} stepIndex - used to give controls unique IDs
     * @returns {string} HTML string
     */
    function _mediaHTML(media, stepIndex) {
        if (media.type === "video") {
            // loop attribute → video replays automatically.
            // Controls are rendered below the video (not native browser controls).
            return `
                <div class="gt-player" id="gt-player-${stepIndex}">
                    <video class="gt-video" id="gt-video-${stepIndex}"
                           muted playsinline preload="auto" loop>
                        <source src="${media.src}" type="video/mp4">
                    </video>
                    <div class="gt-controls" id="gt-controls-${stepIndex}">
                        <button class="gt-play-btn" id="gt-play-btn-${stepIndex}"
                                aria-label="Play / Pause">
                            <svg class="gt-icon-play"  viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                            <svg class="gt-icon-pause" viewBox="0 0 24 24" style="display:none">
                                <rect x="5" y="3" width="4" height="18"/>
                                <rect x="15" y="3" width="4" height="18"/>
                            </svg>
                        </button>
                        <div class="gt-timeline" id="gt-timeline-${stepIndex}" role="slider"
                             aria-label="Video timeline" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                            <div class="gt-timeline-fill" id="gt-fill-${stepIndex}"></div>
                            <div class="gt-timeline-thumb" id="gt-thumb-${stepIndex}"></div>
                        </div>
                    </div>
                </div>`;
        }
        return `<img class="gt-img" src="${media.src}" alt="${media.alt || ""}">`;
    }

    // ── Wire all events ────────────────────────────────────────────────────────
    function _wireAll() {
        document.getElementById("gt-prev").addEventListener("click", () => _go(-1));
        document.getElementById("gt-next-arrow").addEventListener("click", () => _go(1));
        document.getElementById("gt-close").addEventListener("click", close);
        document.getElementById("gt-next-btn").addEventListener("click", _onNextBtn);

        document.querySelectorAll(".gt-dot").forEach(dot => {
            dot.addEventListener("click", () => _goTo(parseInt(dot.dataset.i, 10)));
        });

        document.addEventListener("keydown", _onKey);
    }

    function _onNextBtn() {
        if (current < TOTAL - 1) {
            _go(1);
        } else {
            close();
            _showCompletionToast();
        }
    }

    function _showCompletionToast() {
        const msg = 'Ready! Click "Track my project" in the Git menu to save your project!';
        if (_activity && typeof _activity.textMsg === "function") {
            _activity.textMsg(msg, 4000);
            return;
        }
        if (window.gitDropdownUI && typeof window.gitDropdownUI._showToast === "function") {
            window.gitDropdownUI._showToast(msg, "info");
            return;
        }
        const printText = document.getElementById("printText");
        const printTextContent = document.getElementById("printTextContent");
        if (printText && printTextContent) {
            printTextContent.textContent = msg;
            printText.classList.add("show");
            setTimeout(() => {
                printText.classList.remove("show");
            }, 4000);
        }
    }

    function _onKey(e) {
        if (!overlayEl) {
            document.removeEventListener("keydown", _onKey);
            return;
        }
        if (e.key === "Escape") close();
        if (e.key === "ArrowRight") _go(1);
        if (e.key === "ArrowLeft") _go(-1);
    }

    // ── Navigation ────────────────────────────────────────────────────────────
    function _go(dir) {
        const next = current + dir;
        if (next < 0 || next >= TOTAL) return;
        _goTo(next);
    }

    function _goTo(n) {
        if (n === current) return;
        const dir = n > current ? 1 : -1;

        // Teardown outgoing video player controls, then pause
        _teardownVideoPlayer(current);
        _pauseStepMedia(current);

        const from = document.getElementById(`gt-step-${current}`);
        const to = document.getElementById(`gt-step-${n}`);

        from.classList.add(dir > 0 ? "gt-exit-left" : "gt-exit-right");
        from.classList.remove("gt-active");
        from.setAttribute("aria-hidden", "true");
        setTimeout(() => from.classList.remove("gt-exit-left", "gt-exit-right"), 350);

        to.classList.add(dir > 0 ? "gt-enter-right" : "gt-enter-left");
        to.setAttribute("aria-hidden", "false");
        to.getBoundingClientRect(); // force reflow
        to.classList.remove("gt-enter-right", "gt-enter-left");
        to.classList.add("gt-active");

        current = n;
        _updateUI();

        // Start incoming video from beginning and wire its controls
        _activateStepMedia(current);
    }

    // ── Video helpers ─────────────────────────────────────────────────────────

    /**
     * Reset and play the video for a step, then wire up its custom player controls.
     * @param {number} stepIndex
     */
    function _activateStepMedia(stepIndex) {
        const stepEl = document.getElementById(`gt-step-${stepIndex}`);
        if (!stepEl) return;
        const video = stepEl.querySelector(".gt-video");
        if (!video) return;

        // Always restart from the beginning (loop handles the replay after that)
        video.currentTime = 0;
        video.play().catch(() => {
            /* autoplay policy — silent fail */
        });

        _setupVideoPlayer(stepIndex, video);
    }

    /**
     * Wire the play/pause button and scrubber timeline for a video slide.
     * All listener references and the rAF handle are stored in _videoCleanup
     * so they can be fully removed by _teardownVideoPlayer.
     *
     * @param {number} stepIndex
     * @param {HTMLVideoElement} video
     */
    function _setupVideoPlayer(stepIndex, video) {
        // Guard: already set up, or this is an image slide (no controls)
        if (_videoCleanup.has(stepIndex)) return;
        const playBtn = document.getElementById(`gt-play-btn-${stepIndex}`);
        const timelineTrack = document.getElementById(`gt-timeline-${stepIndex}`);
        const fill = document.getElementById(`gt-fill-${stepIndex}`);
        const thumb = document.getElementById(`gt-thumb-${stepIndex}`);
        if (!playBtn || !timelineTrack || !fill || !thumb) return;

        const iconPlay = playBtn.querySelector(".gt-icon-play");
        const iconPause = playBtn.querySelector(".gt-icon-pause");

        // ── Play / Pause sync ─────────────────────────────────────────────────
        function syncIcons() {
            iconPlay.style.display = video.paused ? "block" : "none";
            iconPause.style.display = video.paused ? "none" : "block";
        }
        syncIcons(); // match initial state

        function onPlayBtnClick() {
            video.paused ? video.play().catch(() => {}) : video.pause();
        }
        function onVideoPlay() {
            syncIcons();
        }
        function onVideoPause() {
            syncIcons();
        }

        playBtn.addEventListener("click", onPlayBtnClick);
        video.addEventListener("play", onVideoPlay);
        video.addEventListener("pause", onVideoPause);

        // ── Scrubber timeline (rAF-driven for real-time smoothness) ───────────
        // We store the rAF handle inside the registry object so patchedTick
        // can keep it up to date on every frame.
        const reg = {
            rafHandle: null,
            onPlayBtnClick,
            onVideoPlay,
            onVideoPause,
            onTimelinePointerDown: null,
            onTimelinePointerMove: null,
            onTimelinePointerUp: null,
            playBtn,
            video,
            timelineTrack,
            cancelRaf() {
                if (this.rafHandle !== null) {
                    cancelAnimationFrame(this.rafHandle);
                    this.rafHandle = null;
                }
            }
        };
        _videoCleanup.set(stepIndex, reg);

        function patchedTick() {
            if (video.duration && isFinite(video.duration)) {
                const pct = (video.currentTime / video.duration) * 100;
                fill.style.width = `${pct}%`;
                thumb.style.left = `${pct}%`;
                timelineTrack.setAttribute("aria-valuenow", Math.round(pct));
            }
            reg.rafHandle = requestAnimationFrame(patchedTick);
        }
        reg.rafHandle = requestAnimationFrame(patchedTick);

        // ── Timeline seek (click + drag via Pointer Events API) ───────────────
        function seekFromPointer(e) {
            const rect = timelineTrack.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const ratio = x / rect.width;
            if (video.duration && isFinite(video.duration)) {
                video.currentTime = ratio * video.duration;
            }
        }

        let dragging = false;

        function onTimelinePointerDown(e) {
            dragging = true;
            timelineTrack.setPointerCapture(e.pointerId);
            seekFromPointer(e);
        }
        function onTimelinePointerMove(e) {
            if (dragging) seekFromPointer(e);
        }
        function onTimelinePointerUp(e) {
            if (!dragging) return;
            dragging = false;
            timelineTrack.releasePointerCapture(e.pointerId);
            seekFromPointer(e);
        }

        reg.onTimelinePointerDown = onTimelinePointerDown;
        reg.onTimelinePointerMove = onTimelinePointerMove;
        reg.onTimelinePointerUp = onTimelinePointerUp;

        timelineTrack.addEventListener("pointerdown", onTimelinePointerDown);
        timelineTrack.addEventListener("pointermove", onTimelinePointerMove);
        timelineTrack.addEventListener("pointerup", onTimelinePointerUp);
    }

    /**
     * Cancel the rAF loop and remove all event listeners for a video player.
     * @param {number} stepIndex
     */
    function _teardownVideoPlayer(stepIndex) {
        const reg = _videoCleanup.get(stepIndex);
        if (!reg) return;

        reg.cancelRaf();

        reg.playBtn.removeEventListener("click", reg.onPlayBtnClick);
        reg.video.removeEventListener("play", reg.onVideoPlay);
        reg.video.removeEventListener("pause", reg.onVideoPause);

        reg.timelineTrack.removeEventListener("pointerdown", reg.onTimelinePointerDown);
        reg.timelineTrack.removeEventListener("pointermove", reg.onTimelinePointerMove);
        reg.timelineTrack.removeEventListener("pointerup", reg.onTimelinePointerUp);

        _videoCleanup.delete(stepIndex);
    }

    /** Tear down all registered video players (called on close). */
    function _teardownAllVideoPlayers() {
        _videoCleanup.forEach((_, idx) => _teardownVideoPlayer(idx));
    }

    function _pauseStepMedia(stepIndex) {
        const stepEl = document.getElementById(`gt-step-${stepIndex}`);
        if (!stepEl) return;
        const video = stepEl.querySelector(".gt-video");
        if (video) video.pause();
    }

    function _pauseAllVideos() {
        if (!overlayEl) return;
        overlayEl.querySelectorAll(".gt-video").forEach(v => v.pause());
    }

    // ── UI sync ───────────────────────────────────────────────────────────────
    function _updateUI() {
        // Step visibility
        document.querySelectorAll(".gt-step").forEach((el, i) => {
            el.classList.toggle("gt-active", i === current);
            el.setAttribute("aria-hidden", i === current ? "false" : "true");
        });

        // Dots
        document
            .querySelectorAll(".gt-dot")
            .forEach((d, i) => d.classList.toggle("gt-dot-active", i === current));

        // Title bar
        document.getElementById("gt-step-num").textContent = `Step ${current + 1} of ${TOTAL}`;
        document.getElementById("gt-step-title").textContent = STEPS[current].title;

        // Progress
        document.getElementById("gt-prog-label").textContent = `${current + 1} / ${TOTAL}`;
        document.getElementById("gt-prog-fill").style.width = `${((current + 1) / TOTAL) * 100}%`;

        // Prev arrow
        const prevBtn = document.getElementById("gt-prev");
        prevBtn.style.opacity = current === 0 ? "0.3" : "1";
        prevBtn.style.pointerEvents = current === 0 ? "none" : "auto";

        // Next arrow
        const nextArrow = document.getElementById("gt-next-arrow");
        nextArrow.style.opacity = current === TOTAL - 1 ? "0.3" : "1";
        nextArrow.style.pointerEvents = current === TOTAL - 1 ? "none" : "auto";

        // Footer button
        const footBtn = document.getElementById("gt-next-btn");
        if (current === TOTAL - 1) {
            footBtn.textContent = "Done";
            footBtn.classList.add("gt-btn-done");
        } else {
            footBtn.textContent = "Next →";
            footBtn.classList.remove("gt-btn-done");
        }
    }

    // ── CSS ───────────────────────────────────────────────────────────────────
    function _css() {
        return `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap');

@keyframes gt-fade-in  { from { opacity:0 } to { opacity:1 } }
@keyframes gt-slide-up { from { opacity:0; transform:translateY(28px) scale(0.97) } to { opacity:1; transform:none } }
@keyframes gt-done-in  { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
@keyframes gt-confetti { 0%,100%{ transform:translateY(0) rotate(0) } 50%{ transform:translateY(-8px) rotate(5deg) } }

/* Overlay */
#git-tutorial-overlay {
    position: fixed;
    inset: 0;
    z-index: 15000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.45);
    font-family: 'Nunito', sans-serif;
    animation: gt-fade-in 0.2s ease;
}

/* Shell */
#git-tutorial-shell {
    width: 960px;
    max-width: 96vw;
    background: #fff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 0 0 5px rgba(33,150,243,0.15), 0 24px 80px rgba(33,150,243,0.28);
    display: flex;
    flex-direction: column;
    position: relative;
    animation: gt-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1);
}

/* Top bar */
#gt-topbar {
    background: #2196F3;
    padding: 13px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #fff;
    flex-shrink: 0;
}
#gt-topbar-left {
    display: flex;
    align-items: center;
    gap: 9px;
    font-weight: 800;
    font-size: 0.98rem;
}
#gt-bulb { display: flex; align-items: center; }
#gt-bulb svg { width: 1.3rem; height: 1.3rem; color: #fff; }

#gt-dots { display: flex; gap: 8px; align-items: center; }
.gt-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255,255,255,0.35);
    cursor: pointer;
    transition: all 0.3s;
}
.gt-dot-active {
    background: #fff;
    transform: scale(1.25);
}

#gt-close {
    font-size: 0.82rem;
    font-weight: 800;
    opacity: 0.85;
    cursor: pointer;
}
#gt-close:hover { opacity: 1; }

/* Title bar */
#gt-title-bar {
    padding: 14px 24px 12px;
    text-align: center;
    border-bottom: 1.5px solid #e3f2fd;
    flex-shrink: 0;
}
#gt-step-num {
    font-size: 0.7rem;
    font-weight: 800;
    color: #64b5f6;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 3px;
}
#gt-step-title {
    font-family: 'Fredoka One', cursive;
    font-size: 1.6rem;
    color: #0d47a1;
}

/* Body */
#gt-body {
    display: flex;
    height: 400px;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
}

/* Arrows - sit inside the body, centered vertically */
#gt-prev, #gt-next-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: none;
    background: #2196F3;
    color: #fff;
    font-size: 1.15rem;
    font-weight: 900;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 14px rgba(33,150,243,0.6);
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
    flex-shrink: 0;
}
#gt-prev       { left: 10px; }
#gt-next-arrow { right: 10px; }
#gt-prev:hover, #gt-next-arrow:hover {
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 5px 20px rgba(33,150,243,0.7);
}
#gt-prev:active, #gt-next-arrow:active {
    transform: translateY(-50%) scale(0.93);
}

/* Steps viewport */
#gt-steps-wrap {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.gt-step {
    position: absolute;
    inset: 0;
    display: flex;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.32s ease, transform 0.32s ease;
}
.gt-step.gt-active {
    opacity: 1;
    pointer-events: all;
    transform: translateX(0) !important;
}
.gt-step.gt-enter-right { transform: translateX(50px); }
.gt-step.gt-enter-left  { transform: translateX(-50px); }
.gt-step.gt-exit-left   { opacity: 0 !important; transform: translateX(-50px) !important; }
.gt-step.gt-exit-right  { opacity: 0 !important; transform: translateX(50px) !important; }

/* Left panel */
.gt-left {
    width: 40%;
    padding: 26px 24px 26px 58px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 13px;
    border-right: 1.5px solid #e3f2fd;
    overflow: hidden;
    flex-shrink: 0;
}

.gt-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #2196F3;
    color: #fff;
    padding: 6px 16px;
    border-radius: 30px;
    font-size: 0.8rem;
    font-weight: 800;
    width: fit-content;
    white-space: nowrap;
}
/* Phosphor SVG inside chip pill */
.gt-chip svg {
    width: 1.1em;
    height: 1.1em;
    flex-shrink: 0;
    vertical-align: middle;
}

.gt-heading {
    font-family: 'Fredoka One', cursive;
    font-size: 1.3rem;
    color: #0d47a1;
    line-height: 1.25;
}

.gt-body-text {
    font-size: 0.91rem;
    color: #444;
    line-height: 1.65;
}
.gt-body-text strong { color: #1565c0; font-weight: 800; }
.gt-body-text em     { color: #1976d2; font-style: normal; font-weight: 700; }

.gt-tip {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    background: #e3f2fd;
    border-left: 4px solid #64b5f6;
    border-radius: 0 10px 10px 0;
    padding: 10px 13px;
    font-size: 0.81rem;
    color: #0d47a1;
    font-weight: 600;
    line-height: 1.45;
}
.gt-tip-icon {
    flex-shrink: 0;
    margin-top: 1px;
    display: flex;
    align-items: center;
}
/* Phosphor SVG inside tip icon */
.gt-tip-icon svg {
    width: 1.15em;
    height: 1.15em;
    color: #1565c0;
}

/* ── Right panel ── */
.gt-right {
    flex: 1;
    background: linear-gradient(155deg, #e3f2fd 0%, #f1f8ff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    overflow: hidden;
    position: relative;
}

/* ── Video player wrapper ── */
.gt-player {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.gt-video {
    width: 100%;
    height: calc(100% - 40px);  /* leave room for the controls row below */
    object-fit: contain;
    border-radius: 10px;
    display: block;
    flex-shrink: 0;
}

/* ── Video controls bar ── */
.gt-controls {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 4px 0;
    flex-shrink: 0;
}

/* Play / Pause toggle button */
.gt-play-btn {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: #2196F3;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s, transform 0.12s;
    box-shadow: 0 2px 8px rgba(33,150,243,0.45);
}
.gt-play-btn:hover  { background: #1976d2; transform: scale(1.08); }
.gt-play-btn:active { transform: scale(0.94); }

.gt-play-btn svg {
    width: 14px;
    height: 14px;
    fill: #fff;
    flex-shrink: 0;
    display: block;
    pointer-events: none;
}

/* Scrubber timeline track */
.gt-timeline {
    flex: 1;
    height: 6px;
    background: rgba(33,150,243,0.2);
    border-radius: 6px;
    position: relative;
    cursor: pointer;
    touch-action: none;     /* allow pointer capture for drag-to-seek */
    transition: height 0.15s;
}
.gt-timeline:hover { height: 8px; }

/* Filled (played) portion */
.gt-timeline-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #2196F3, #42a5f5);
    border-radius: 6px;
    pointer-events: none;
    transition: width 0.05s linear;
}

/* Draggable thumb — only visible on hover */
.gt-timeline-thumb {
    position: absolute;
    top: 50%;
    left: 0%;
    transform: translate(-50%, -50%);
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #2196F3;
    box-shadow: 0 0 0 3px rgba(33,150,243,0.3);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
}
.gt-timeline:hover .gt-timeline-thumb { opacity: 1; }

/* ── Static image ── */
.gt-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 10px;
}

/* Footer */
#gt-footer {
    padding: 12px 24px;
    border-top: 1.5px solid #e3f2fd;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
}
#gt-prog-label {
    font-size: 0.78rem;
    font-weight: 800;
    color: #64b5f6;
    white-space: nowrap;
}
#gt-prog-track {
    flex: 1;
    height: 6px;
    background: #e3f2fd;
    border-radius: 10px;
    overflow: hidden;
}
#gt-prog-fill {
    height: 100%;
    background: linear-gradient(90deg, #2196F3, #42a5f5);
    border-radius: 10px;
    transition: width 0.4s ease;
    width: 25%;
}
#gt-next-btn {
    background: #2196F3;
    color: #fff;
    border: none;
    border-radius: 20px;
    padding: 8px 22px;
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.2s, transform 0.15s;
}
#gt-next-btn:hover { background: #1976d2; transform: scale(1.04); }
#gt-next-btn.gt-btn-done { background: #43a047; }
#gt-next-btn.gt-btn-done:hover { background: #388e3c; }


`;
    }

    return { open, close };
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = GitTutorial;
}
