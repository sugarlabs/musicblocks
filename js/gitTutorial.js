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
 *   1. Save a Spot       - creates a GitHub repo
 *   2. Mark this Moment  - commit / version snapshot
 *   3. Timeline          - commit history + time travel
 *   4. Fork from Planet  - copy a project from Planet
 *
 * Video behaviour:
 *   - Videos do NOT autoplay on open.
 *   - When a slide becomes active, its video resets to 0 and plays.
 *   - When leaving a slide, its video is paused.
 *   - Re-visiting a slide always restarts the video from the beginning.
 */
const GitTutorial = (() => {
    // ── Step definitions ──────────────────────────────────────────────────────
    const STEPS = [
        {
            chip: "📍 Save a Spot",
            title: "Save a Spot",
            heading: "Reserve your space for your music!",
            body: `Click <strong>Save a Spot</strong> in the Git menu and your project gets
                      its very own home on the internet, called a <strong>repository</strong>.<br><br>
                      It's like getting your own locker at school. Nobody else can touch it,
                      and everything you make lives there safely.`,
            tip: "You only need to do this once per project. After that, your spot is saved forever!",
            media: { type: "video", src: "videos/git-save-a-spot.mp4" }
        },
        {
            chip: "📸 Mark this Moment",
            title: "Mark this Moment",
            heading: "Snap a photo of your music right now!",
            body: `Made something you like? Click <strong>Mark this Moment</strong> to save
                      an exact copy of your music at this point in time.<br><br>
                      Even if you change things later, you can always come back to
                      <em>this exact version</em>.`,
            tip: 'Type a short note like "added drums" so you remember what you changed!',
            media: { type: "video", src: "videos/git-mark-this-moment.mp4" }
        },
        {
            chip: "⏳ Timeline",
            title: "Timeline",
            heading: "See every version of your music!",
            body: `Click <strong>Timeline</strong> to see all the moments you marked,
                      from newest to oldest.<br><br>
                      See something you want to go back to? Hit <strong>Jump back here</strong>
                      and your music goes right back to that version!`,
            tip: "You can never permanently break your music. The Timeline always has your back!",
            media: { type: "video", src: "videos/git-timeline.mp4" }
        },
        {
            chip: "🍴 Fork from Planet",
            title: "Fork from Planet",
            heading: "Make someone's project your own!",
            body: `Seen a cool project on the Planet gallery? Click <strong>Fork from Planet</strong>
                      on any card.<br><br>
                      You get your own <em>fresh copy</em> of that project that belongs only to
                      <strong>you</strong>. Change it, remix it, build on it however you want!`,
            tip: "The original project is safe. You are working on your own copy, not theirs.",
            media: { type: "image", src: "images/fork_planet.png", alt: "Fork from Planet" }
        }
    ];

    const TOTAL = STEPS.length;

    // ── State ─────────────────────────────────────────────────────────────────
    let current = 0;
    let overlayEl = null;
    let _activity = null;

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
                    <div class="gt-chip">${s.chip}</div>
                    <div class="gt-heading">${s.heading}</div>
                    <div class="gt-body-text">${s.body}</div>
                    <div class="gt-tip">
                        <span class="gt-tip-icon">💡</span>
                        <span>${s.tip}</span>
                    </div>
                </div>
                <div class="gt-right">
                    ${_mediaHTML(s.media)}
                </div>
            </div>`
        ).join("");

        return `
            <div id="gt-topbar">
                <div id="gt-topbar-left">
                    <span id="gt-bulb">💡</span>
                    <span>Git Tutorial</span>
                </div>
                <div id="gt-dots">${dotsHTML}</div>
                <div id="gt-close">✕ Close</div>
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

    function _mediaHTML(media) {
        if (media.type === "video") {
            // No autoplay - controlled manually via _activateStepMedia
            return `<video class="gt-video" muted playsinline preload="auto">
                        <source src="${media.src}" type="video/mp4">
                    </video>`;
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
        const msg = "Start by clicking Save a Spot in the Git menu!";
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

        // Pause outgoing video
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

        // Start incoming video from beginning
        _activateStepMedia(current);
    }

    // ── Video helpers ─────────────────────────────────────────────────────────
    function _activateStepMedia(stepIndex) {
        const stepEl = document.getElementById(`gt-step-${stepIndex}`);
        if (!stepEl) return;
        const video = stepEl.querySelector(".gt-video");
        if (!video) return;
        video.currentTime = 0;
        video.play().catch(() => {
            /* autoplay policy - silent fail */
        });
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
#gt-bulb { font-size: 1.3rem; }

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
.gt-tip-icon { flex-shrink: 0; margin-top: 1px; }

/* Right panel */
.gt-right {
    flex: 1;
    background: linear-gradient(155deg, #e3f2fd 0%, #f1f8ff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    overflow: hidden;
}

.gt-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 10px;
    display: block;
}

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
