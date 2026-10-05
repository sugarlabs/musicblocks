/**
 * MusicBlocks
 *
 * @copyright 2025-26 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global

   _, LegoWidget
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/widgets/legobricks.js
        LegoWidget
*/

/* exported LegoBricksMedia */

/**
 * @file LegoBricksMedia.js
 * @description LEGO Bricks media: image upload, the webcam, the offscreen canvas used for sampling,
 * and dragging the image.
 *
 * The methods are moved as they were from the LegoWidget constructor. LegoWidget calls this
 * function with the widget as `this` (see LegoWidget.installModules), so every method is still
 * set on the widget instance and `this` inside it is still the widget.
 */
function LegoBricksMedia() {
    /**
     * Uploads an image.
     * @private
     * @returns {void}
     */
    this._uploadImage = function () {
        this._fileInput.click();
    };

    /**
     * Handles image upload.
     * @private
     * @param {Event} event - The file input change event.
     * @returns {void}
     */
    this._handleImageUpload = function (event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = e => {
                // The image replaces a running webcam, so release the camera.
                this._stopWebcam();
                this.webcamVideo = null;
                this.imageDisplayArea.replaceChildren();

                this.imageWrapper = LegoWidget.createImageWrapper();

                const img = document.createElement("img");
                img.src = e.target.result;
                img.style.maxWidth = "100%";
                img.style.maxHeight = "100%";
                img.style.objectFit = "contain";
                img.style.borderRadius = "8px";
                img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                // Rebuild the off-screen canvas once natural dimensions are available.
                img.onload = () => this._buildOffscreenCanvas();

                this.imageWrapper.appendChild(img);
                this.imageDisplayArea.appendChild(this.imageWrapper);

                this._activateMediaDisplay();

                this.activity.textMsg(_("Image uploaded successfully"));
            };
            reader.readAsDataURL(file);
        }
    };

    /**
     * Starts webcam.
     * @private
     * @returns {void}
     */
    this._startWebcam = function () {
        // Release a camera that is already running before asking for a new one.
        this._stopWebcam();
        this.imageDisplayArea.replaceChildren();

        this._offscreenCanvas = null;
        this._offscreenCtx = null;
        this._offscreenIsVideo = false;
        this._offscreenMediaElement = null;

        this.imageWrapper = LegoWidget.createImageWrapper();

        this.webcamVideo = document.createElement("video");
        this.webcamVideo.autoplay = true;
        this.webcamVideo.playsInline = true;
        this.webcamVideo.style.maxWidth = "100%";
        this.webcamVideo.style.maxHeight = "100%";

        this.imageWrapper.appendChild(this.webcamVideo);
        this.imageDisplayArea.appendChild(this.imageWrapper);

        const video = this.webcamVideo;
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then(stream => {
                // The camera can take a while to open. If the widget was closed, or another
                // webcam or image took this one's place in the meantime, release the stream.
                if (this.webcamVideo !== video) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                this.webcamVideo.srcObject = stream;

                const captureBtn = document.createElement("button");
                captureBtn.textContent = " Capture";
                captureBtn.style.cssText =
                    "position:absolute;bottom:10px;left:50%;transform:translateX(-50%);" +
                    "padding:8px 16px;font-size:14px;cursor:pointer;z-index:30;" +
                    "background:#fff;border:2px solid #333;border-radius:6px;";
                captureBtn.onclick = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = this.webcamVideo.videoWidth;
                    canvas.height = this.webcamVideo.videoHeight;
                    canvas.getContext("2d").drawImage(this.webcamVideo, 0, 0);
                    this._stopWebcam();

                    const img = document.createElement("img");
                    img.src = canvas.toDataURL("image/png");
                    img.style.maxWidth = "100%";
                    img.style.maxHeight = "100%";
                    img.style.objectFit = "contain";
                    img.style.borderRadius = "8px";
                    img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                    // Rebuild off-screen canvas once photo dimensions are available.
                    img.onload = () => this._buildOffscreenCanvas();
                    this.imageWrapper.replaceChildren(img);
                    captureBtn.remove();

                    this._activateMediaDisplay();
                    this.activity.textMsg(_("Photo captured"));
                };
                this.imageWrapper.appendChild(captureBtn);

                this._activateMediaDisplay();
                this.activity.textMsg(_("Webcam started"));
            })
            .catch(err => {
                // Drop the empty video so the placeholder comes back, unless a newer webcam
                // or image has already replaced it.
                if (this.webcamVideo === video) {
                    this.webcamVideo = null;
                    if (this.imageWrapper && this.imageWrapper.contains(video)) {
                        this.imageWrapper.remove();
                        this.imageWrapper = null;
                    }
                    if (this.imagePlaceholder) {
                        this.imageDisplayArea.appendChild(this.imagePlaceholder);
                    }
                }
                this.activity.textMsg(_("Webcam access denied: %s").replace(/%s/g, err.message));
            });
    };

    /**
     * Stops webcam.
     * @private
     * @returns {void}
     */
    this._stopWebcam = function () {
        if (this.webcamVideo && this.webcamVideo.srcObject) {
            const tracks = this.webcamVideo.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.webcamVideo.srcObject = null;
        }
    };

    /**
     * Removes drag event listeners from document.
     * @private
     * @returns {void}
     */
    this._cleanupDragListeners = function () {
        if (this._dragMoveHandler) {
            document.removeEventListener("mousemove", this._dragMoveHandler);
            this._dragMoveHandler = null;
        }
        if (this._dragUpHandler) {
            document.removeEventListener("mouseup", this._dragUpHandler);
            this._dragUpHandler = null;
        }
    };

    /**
     * Builds (or rebuilds) the shared off-screen canvas used by _sampleAndDetectColor.
     *
     * For <img> elements the full image is drawn to the canvas once here and the
     * canvas is reused for the entire scan — zero per-frame allocations.
     * For <video> elements only the canvas object is created here; pixels are
     * redrawn into it each animation tick because the webcam frame changes.
     *
     * Call this whenever a new media element is set (image upload, webcam capture).
     * It is also called lazily from _sampleAndDetectColor as a safety fallback.
     * @private
     * @returns {void}
     */
    this._buildOffscreenCanvas = function () {
        let mediaElement = null;
        if (this.imageWrapper) {
            mediaElement =
                this.imageWrapper.querySelector("img") || this.imageWrapper.querySelector("video");
        }

        if (!mediaElement) {
            this._offscreenCanvas = null;
            this._offscreenCtx = null;
            this._offscreenIsVideo = false;
            this._offscreenMediaElement = null;
            return;
        }

        const isVideo = mediaElement.tagName === "VIDEO";
        const w = isVideo
            ? mediaElement.videoWidth || mediaElement.clientWidth
            : mediaElement.naturalWidth || mediaElement.clientWidth;
        const h = isVideo
            ? mediaElement.videoHeight || mediaElement.clientHeight
            : mediaElement.naturalHeight || mediaElement.clientHeight;

        if (w === 0 || h === 0) {
            // Dimensions not available yet (image still decoding); the img.onload
            // callback registered in _handleImageUpload will call us again.
            this._offscreenCanvas = null;
            this._offscreenCtx = null;
            this._offscreenIsVideo = false;
            this._offscreenMediaElement = null;
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!isVideo) {
            // Static image — draw once, reuse across every animation frame.
            try {
                ctx.drawImage(mediaElement, 0, 0, w, h);
            } catch (e) {
                console.warn("Could not draw media element to off-screen canvas:", e);
                this._offscreenCanvas = null;
                this._offscreenCtx = null;
                this._offscreenIsVideo = false;
                this._offscreenMediaElement = null;
                return;
            }
        }
        // For video the canvas dimensions are set but pixels are drawn per-frame
        // in _sampleAndDetectColor to capture the live webcam feed.

        this._offscreenCanvas = canvas;
        this._offscreenCtx = ctx;
        this._offscreenIsVideo = isVideo;
        this._offscreenMediaElement = mediaElement;
    };

    /**
     * Activates the image/webcam display area: makes it draggable and
     * refreshes the zoom controls and grid overlay for the new media.
     * @private
     * @returns {void}
     */
    this._activateMediaDisplay = function () {
        this._makeImageDraggable(this.imageWrapper);
        this._showZoomControls();
        this._drawGridLines();
        // Pre-build the off-screen sampling canvas for the newly loaded media.
        // img.onload in _handleImageUpload will rebuild if dimensions are not
        // yet available at this point (data-URL decode is typically synchronous,
        // but we defend against the async case).
        this._buildOffscreenCanvas();
    };

    /**
     * Makes image draggable.
     * @private
     * @param {HTMLElement} wrapper - The image wrapper element.
     * @returns {void}
     */
    this._makeImageDraggable = function (wrapper) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        // Set fixed dimensions for the wrapper
        wrapper.style.width = "100%";
        wrapper.style.height = "100%";
        wrapper.style.overflow = "hidden";

        wrapper.onmousedown = e => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = parseFloat(wrapper.style.left) || 0;
            initialY = parseFloat(wrapper.style.top) || 0;
            wrapper.style.cursor = "grabbing";
            e.preventDefault();
        };

        // Remove old listeners if they exist (prevents accumulation)
        this._cleanupDragListeners();

        // Store handlers as instance properties for later cleanup
        this._dragMoveHandler = e => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            wrapper.style.left = `${initialX + dx}px`;
            wrapper.style.top = `${initialY + dy}px`;
        };

        this._dragUpHandler = () => {
            if (isDragging) {
                isDragging = false;
                wrapper.style.cursor = "grab";
            }
        };

        // Use addEventListener instead of direct property assignment
        document.addEventListener("mousemove", this._dragMoveHandler);
        document.addEventListener("mouseup", this._dragUpHandler);
    };
}

if (typeof module !== "undefined") {
    module.exports = LegoBricksMedia;
}
