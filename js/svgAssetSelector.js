/**
 * SVG Asset Selector
 *
 * Provides a modal UI for selecting built-in SVG images from the
 * project's asset directories (images/ and mouse-art/) or uploading
 * from the local file system.
 *
 * @module svgAssetSelector
 * @see {@link https://github.com/sugarlabs/musicblocks/issues/1291}
 */

// Built-in SVG assets are loaded dynamically from js/svgAssets.json

/**
 * Opens the SVG asset selector modal.
 *
 * Presents two tabs:
 *   1. "Built-in Images" — a grid of selectable SVG previews
 *   2. "Upload from Device" — triggers the existing file-upload flow
 *
 * @param {Function} onSelectBuiltIn - Called with the data-URL of the
 *     chosen built-in SVG when the user confirms a selection.
 * @param {Function} onUploadFromDevice - Called (with no args) when
 *     the user chooses to upload a local file instead.
 */
function openSvgAssetSelector(onSelectBuiltIn, onUploadFromDevice) {
    // Prevent duplicate modals
    const existing = document.getElementById("svgAssetSelectorOverlay");
    if (existing) existing.remove();

    fetch("./js/svgAssets.json")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            const BUILTIN_SVG_ASSETS = data.svgs;

            // ── Build DOM ────────────────────────────────────────────────
            const overlay = document.createElement("div");
            overlay.id = "svgAssetSelectorOverlay";

            const modal = document.createElement("div");
            modal.id = "svgAssetSelectorModal";

            // Header
            const header = document.createElement("div");
            header.className = "svg-selector-header";
            header.innerHTML =
                "<h3>Choose an Image</h3>" +
                '<button class="svg-selector-close" aria-label="Close">&times;</button>';
            modal.appendChild(header);

            // Tabs
            const tabBar = document.createElement("div");
            tabBar.className = "svg-selector-tabs";

            const tabBuiltIn = document.createElement("button");
            tabBuiltIn.className = "svg-selector-tab active";
            tabBuiltIn.id = "svgTabBuiltIn";
            tabBuiltIn.innerHTML =
                '<span class="tab-icon material-icons">collections</span> Built-in Images';

            const tabUpload = document.createElement("button");
            tabUpload.className = "svg-selector-tab";
            tabUpload.id = "svgTabUpload";
            tabUpload.innerHTML =
                '<span class="tab-icon material-icons">file_upload</span> Upload from Device';

            tabBar.appendChild(tabBuiltIn);
            tabBar.appendChild(tabUpload);
            modal.appendChild(tabBar);

            // ── Built-in panel ──────────────────────────────────────────
            const gridContainer = document.createElement("div");
            gridContainer.className = "svg-selector-grid-container";
            gridContainer.id = "svgGridPanel";

            const grid = document.createElement("div");
            grid.className = "svg-selector-grid";

            let selectedAssetPath = null;

            BUILTIN_SVG_ASSETS.forEach(function (asset) {
                const item = document.createElement("div");
                item.className = "svg-asset-item";
                item.dataset.path = asset.path;

                const img = document.createElement("img");
                img.src = asset.path;
                img.alt = asset.name;
                img.loading = "lazy";
                // Graceful fallback for missing images
                img.onerror = function () {
                    this.style.display = "none";
                };

                const label = document.createElement("span");
                label.className = "asset-name";
                label.textContent = asset.name;

                item.appendChild(img);
                item.appendChild(label);

                item.addEventListener("click", function () {
                    // Deselect previous
                    const prev = grid.querySelector(".svg-asset-item.selected");
                    if (prev) prev.classList.remove("selected");
                    item.classList.add("selected");
                    selectedAssetPath = asset.path;
                    applyBtn.disabled = false;
                });

                grid.appendChild(item);
            });

            gridContainer.appendChild(grid);
            modal.appendChild(gridContainer);

            // ── Upload panel (hidden by default) ────────────────────────
            const uploadPanel = document.createElement("div");
            uploadPanel.className = "svg-selector-upload";
            uploadPanel.id = "svgUploadPanel";
            uploadPanel.style.display = "none";

            const uploadBtn = document.createElement("button");
            uploadBtn.className = "svg-upload-btn";
            uploadBtn.innerHTML = '<span class="material-icons">cloud_upload</span> Choose File';

            const uploadHint = document.createElement("span");
            uploadHint.className = "svg-upload-hint";
            uploadHint.textContent = "Supports PNG, JPG, SVG, GIF and other image formats";

            uploadPanel.appendChild(uploadBtn);
            uploadPanel.appendChild(uploadHint);
            modal.appendChild(uploadPanel);

            // ── Footer ──────────────────────────────────────────────────
            const footer = document.createElement("div");
            footer.className = "svg-selector-footer";

            const cancelBtn = document.createElement("button");
            cancelBtn.className = "svg-cancel-btn";
            cancelBtn.textContent = "Cancel";

            const applyBtn = document.createElement("button");
            applyBtn.className = "svg-apply-btn";
            applyBtn.textContent = "Apply";
            applyBtn.disabled = true;

            footer.appendChild(cancelBtn);
            footer.appendChild(applyBtn);
            modal.appendChild(footer);

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Trigger enter animation
            requestAnimationFrame(function () {
                overlay.classList.add("visible");
            });

            // ── Event handlers ──────────────────────────────────────────
            function closeModal() {
                overlay.classList.remove("visible");
                setTimeout(function () {
                    overlay.remove();
                }, 250);
            }

            // Close button
            header.querySelector(".svg-selector-close").addEventListener("click", closeModal);
            cancelBtn.addEventListener("click", closeModal);

            // Click outside modal to close
            overlay.addEventListener("click", function (e) {
                if (e.target === overlay) closeModal();
            });

            // Tab switching
            tabBuiltIn.addEventListener("click", function () {
                tabBuiltIn.classList.add("active");
                tabUpload.classList.remove("active");
                gridContainer.style.display = "";
                uploadPanel.style.display = "none";
                footer.style.display = "";
            });

            tabUpload.addEventListener("click", function () {
                tabUpload.classList.add("active");
                tabBuiltIn.classList.remove("active");
                gridContainer.style.display = "none";
                uploadPanel.style.display = "";
                footer.style.display = "none";
            });

            // Upload button → close modal and delegate to existing upload flow
            uploadBtn.addEventListener("click", function () {
                closeModal();
                if (typeof onUploadFromDevice === "function") {
                    onUploadFromDevice();
                }
            });

            // Apply selected built-in image
            applyBtn.addEventListener("click", function () {
                if (!selectedAssetPath) return;

                // Fetch the SVG/image and convert to data URL
                _fetchAsDataURL(selectedAssetPath, function (dataURL) {
                    closeModal();
                    if (typeof onSelectBuiltIn === "function") {
                        onSelectBuiltIn(dataURL);
                    }
                });
            });
        })
        .catch(function (error) {
            console.error("Failed to load SVG assets:", error);
            // Fallback to upload from device if built-in fails to load
            if (typeof onUploadFromDevice === "function") {
                onUploadFromDevice();
            }
        });
}

/**
 * Fetches an asset file and converts it to a data-URL string.
 *
 * Works entirely offline because it reads from the project's own
 * static assets via a relative path.
 *
 * @param {string} path - Relative path to the asset file.
 * @param {Function} callback - Called with the resulting data-URL.
 * @private
 */
function _fetchAsDataURL(path, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", path, true);
    xhr.responseType = "blob";
    xhr.onload = function () {
        if (xhr.status === 200 || xhr.status === 0) {
            var reader = new FileReader();
            reader.onloadend = function () {
                callback(reader.result);
            };
            reader.readAsDataURL(xhr.response);
        } else {
            console.error("Failed to load built-in asset: " + path);
        }
    };
    xhr.onerror = function () {
        console.error("Network error loading built-in asset: " + path);
    };
    xhr.send();
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { openSvgAssetSelector };
}
