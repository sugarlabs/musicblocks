/* eslint-disable no-undef */
// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget displays a read-only list of project snapshots.

/* global _ */

/* exported SnapshotHistory */
class SnapshotHistory {
    static OUTERWINDOWWIDTH = 620;
    static INNERWINDOWWIDTH = this.OUTERWINDOWWIDTH - 80;

    /**
     * Initialize the snapshot history widget
     */
    init(activity) {
        this.activity = activity;
        this.isOpen = true;
        this._cellScale = window.innerWidth / 1200;

        this.widgetWindow = window.widgetWindows.windowFor(
            this,
            "snapshot-history",
            "snapshot history"
        );
        this.widgetWindow.clear();
        this.widgetWindow.show();

        this.widgetWindow.onclose = () => {
            this.isOpen = false;
            this.widgetWindow.destroy();
        };

        // Create the main container
        this._container = document.createElement("div");
        this._container.style.padding = "20px";
        this._container.style.overflowY = "auto";
        this._container.style.maxHeight = "500px";
        this.widgetWindow.getWidgetBody().append(this._container);

        // Load and display snapshots
        this._loadSnapshots();

        this.widgetWindow.sendToCenter();
    }

    /**
     * Load snapshots from storage and display them
     */
    async _loadSnapshots() {
        if (!this.activity.snapshotStorage) {
            this._container.innerHTML = "<p>Snapshot storage not initialized.</p>";
            return;
        }

        const projectId = this.activity.planet.ProjectStorage.getCurrentProjectID();
        const snapshots = await this.activity.snapshotStorage.getSnapshots(projectId);

        if (snapshots.length === 0) {
            this._container.innerHTML =
                '<p style="color: #666;">No snapshots saved for this project.</p>';
            return;
        }

        // Sort snapshots by timestamp (newest first)
        snapshots.sort((a, b) => b.timestamp - a.timestamp);

        // Create a list of snapshots
        const list = document.createElement("div");

        for (const snapshot of snapshots) {
            const item = this._createSnapshotItem(snapshot);
            list.appendChild(item);
        }

        this._container.innerHTML = "";
        this._container.appendChild(list);
    }

    /**
     * Create a DOM element for a snapshot item
     */
    _createSnapshotItem(snapshot) {
        const item = document.createElement("div");
        item.style.border = "1px solid #ccc";
        item.style.borderRadius = "5px";
        item.style.padding = "15px";
        item.style.marginBottom = "10px";
        item.style.backgroundColor = "#f9f9f9";

        // Format timestamp
        const date = new Date(snapshot.timestamp);
        const formattedDate = date.toLocaleString();

        // Create content
        const timestampDiv = document.createElement("div");
        timestampDiv.style.fontWeight = "bold";
        timestampDiv.style.marginBottom = "5px";
        timestampDiv.innerHTML = `📅 ${formattedDate}`;

        const descriptionDiv = document.createElement("div");
        descriptionDiv.style.marginBottom = "10px";
        descriptionDiv.style.color = "#666";
        if (snapshot.description) {
            descriptionDiv.innerHTML = `📝 ${snapshot.description}`;
        } else {
            descriptionDiv.innerHTML = '<em style="color: #999;">No description</em>';
        }

        // View button
        const viewButton = document.createElement("button");
        viewButton.innerHTML = "View Details";
        viewButton.style.padding = "5px 15px";
        viewButton.style.backgroundColor = "#4CAF50";
        viewButton.style.color = "white";
        viewButton.style.border = "none";
        viewButton.style.borderRadius = "3px";
        viewButton.style.cursor = "pointer";
        viewButton.onclick = () => this._viewSnapshot(snapshot);

        item.appendChild(timestampDiv);
        item.appendChild(descriptionDiv);
        item.appendChild(viewButton);

        return item;
    }

    /**
     * View snapshot details (read-only)
     */
    _viewSnapshot(snapshot) {
        const date = new Date(snapshot.timestamp);
        const formattedDate = date.toLocaleString();

        let message = `Snapshot Details:\n\n`;
        message += `Date: ${formattedDate}\n`;
        message += `Description: ${snapshot.description || "(none)"}\n`;
        message += `Snapshot ID: ${snapshot.id}\n\n`;
        message += `This is a read-only view. The snapshot cannot be restored.`;

        // Use browser alert for simplicity (following minimal approach)
        alert(message);

        // eslint-disable-next-line no-console
        console.log("Snapshot data:", snapshot);
    }
}
