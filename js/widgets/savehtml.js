/**
 * MusicBlocks v3.6.2 (ADD THE UP-TO-DATE VERSION)
 *
 * @author Walter Bender (MODIFY THE AUTHOR AS NEEDED)
 *
 * @copyright 2025 Walter Bender (MODIFY THE AUTHOR AND YEAR AS NEEDED)
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

class SaveHTMLWidget {
    constructor(activity) {
        this.activity = activity;
        const widgetWindow = window.widgetWindows.windowFor(this, "savehtml", "savehtml");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.sendToCenter();
        widgetWindow.updateTitle(_("Save project as HTML"));
        const container = document.createElement("div");
        container.id = "saveHtmlBody";
        container.innerHTML = `
            <div class="save-row">
              <label>${_("Project name")}</label>
              <input id="saveHtmlName" type="text" />
            </div>
            <div class="save-row">
              <label>${_("Description")}</label>
              <textarea id="saveHtmlDesc" rows="3"></textarea>
            </div>
            <div class="save-row image-row">
              <img id="saveHtmlImage" alt="" />
            </div>
            <div class="save-row buttons">
              <button id="saveHtmlCancel" class="btn flat">${_("Cancel")}</button>
              <button id="saveHtmlSave" class="btn primary">${_("Save")}</button>
            </div>
        `;
        widgetWindow.getWidgetBody().append(container);
        const nameInput = container.querySelector("#saveHtmlName");
        const descInput = container.querySelector("#saveHtmlDesc");
        const img = container.querySelector("#saveHtmlImage");
        const cancel = container.querySelector("#saveHtmlCancel");
        const save = container.querySelector("#saveHtmlSave");
        const defaultName = this.activity.PlanetInterface
            ? this.activity.PlanetInterface.getCurrentProjectName()
            : _("My Project");
        const defaultDesc = this.activity.PlanetInterface
            ? this.activity.PlanetInterface.getCurrentProjectDescription()
            : _("No description provided");
        nameInput.value = defaultName;
        descInput.value = defaultDesc;
        img.src =
            (this.activity.PlanetInterface &&
                this.activity.PlanetInterface.getCurrentProjectImage()) ||
            "";
        cancel.onclick = () => widgetWindow.close();
        save.onclick = () => {
            const name = nameInput.value.trim() || defaultName;
            const desc = descInput.value.trim() || defaultDesc;
            const data =
                typeof this.activity.prepareExport === "function"
                    ? this.activity.prepareExport()
                    : "";
            const image =
                (this.activity.PlanetInterface &&
                    this.activity.PlanetInterface.getCurrentProjectImage()) ||
                "";
            const html =
                "data:text/plain;charset=utf-8," +
                encodeURIComponent(this.activity.save.prepareHTML(name, desc, data, image));
            this.activity.save.downloadURL(name + ".html", html);
            widgetWindow.close();
        };
    }

    static open(activity) {
        let attempts = 0;
        const maxAttempts = 30; // ~1.5s with 50ms interval
        const tryCreate = () => {
            attempts += 1;
            if (
                typeof window.widgetWindows === "undefined" ||
                typeof window.widgetWindows.windowFor !== "function"
            ) {
                if (attempts >= maxAttempts) {
                    console.warn(
                        "SaveHTMLWidget.open: widget system unavailable, using DOM fallback"
                    );
                    SaveHTMLWidget._openFallback(activity);
                    return;
                }
                setTimeout(tryCreate, 50);
                return;
            }

            try {
                new SaveHTMLWidget(activity);
            } catch (e) {
                console.warn("SaveHTMLWidget.open: constructor threw, retrying", e);
                if (attempts >= maxAttempts) {
                    console.warn(
                        "SaveHTMLWidget.open: constructor repeatedly failed, using DOM fallback"
                    );
                    SaveHTMLWidget._openFallback(activity);
                    return;
                }
                setTimeout(tryCreate, 50);
            }
        };
        tryCreate();
    }

    static _openFallback(activity) {
        // Minimal fallback UI for environments where the widget system is unavailable
        const existing = document.getElementById("saveHtmlFallback");
        if (existing) {
            existing.style.display = "flex";
            return;
        }
        const overlay = document.createElement("div");
        overlay.id = "saveHtmlFallback";
        overlay.style.position = "fixed";
        overlay.style.left = 0;
        overlay.style.top = 0;
        overlay.style.right = 0;
        overlay.style.bottom = 0;
        overlay.style.background = "rgba(0,0,0,0.4)";
        overlay.style.zIndex = 9999;
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";

        const dialog = document.createElement("div");
        dialog.style.background = "#fff";
        dialog.style.padding = "12px";
        dialog.style.width = "320px";
        dialog.style.borderRadius = "6px";
        dialog.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

        dialog.innerHTML = `
            <h3 style="margin-top:0">${_("Save project as HTML")}</h3>
            <label>${_("Project name")}</label>
            <input id="saveHtmlFallbackName" type="text" style="width:100%; margin-bottom:8px" />
            <label>${_("Description")}</label>
            <textarea id="saveHtmlFallbackDesc" rows="3" style="width:100%; margin-bottom:8px"></textarea>
            <div style="display:flex; justify-content:flex-end; gap:8px;">
              <button id="saveHtmlFallbackCancel" class="btn flat">${_("Cancel")}</button>
              <button id="saveHtmlFallbackSave" class="btn primary">${_("Save")}</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const defaultName = activity.PlanetInterface
            ? activity.PlanetInterface.getCurrentProjectName()
            : _("My Project");
        const defaultDesc = activity.PlanetInterface
            ? activity.PlanetInterface.getCurrentProjectDescription()
            : "";
        const nameInput = document.getElementById("saveHtmlFallbackName");
        const descInput = document.getElementById("saveHtmlFallbackDesc");
        nameInput.value = defaultName;
        descInput.value = defaultDesc;

        document.getElementById("saveHtmlFallbackCancel").onclick = () => {
            overlay.style.display = "none";
        };

        document.getElementById("saveHtmlFallbackSave").onclick = () => {
            const name = (nameInput.value || "").trim() || defaultName;
            const desc = (descInput.value || "").trim() || defaultDesc;
            const data =
                typeof activity.prepareExport === "function" ? activity.prepareExport() : "";
            const image =
                (activity.PlanetInterface && activity.PlanetInterface.getCurrentProjectImage()) ||
                "";
            const html =
                "data:text/plain;charset=utf-8," +
                encodeURIComponent(activity.save.prepareHTML(name, desc, data, image));
            activity.save.downloadURL(name + ".html", html);
            overlay.style.display = "none";
        };
    }

    static attach() {
        document.addEventListener("DOMContentLoaded", () => {
            const bind = id => {
                const el = document.getElementById(id);
                if (!el) return;
                el.addEventListener("click", e => {
                    e.preventDefault();
                    const activity =
                        window.activity || window.currentActivity || window.__activity || null;
                    SaveHTMLWidget.open(
                        activity || {
                            prepareExport: () => "",
                            PlanetInterface: undefined,
                            save: new SaveInterface({})
                        }
                    );
                });
            };
            bind("save-html");
            bind("save-html-beg");
        });
    }
}
SaveHTMLWidget.attach();