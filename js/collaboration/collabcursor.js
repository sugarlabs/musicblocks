/* eslint-disable no-unused-vars */
// Copyright (c) 2024 Ajeet Pratap Singh
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

class Cursor {
    constructor(activity) {
        this.activity = activity;
        this.cursorContainer = new Map();
        this.nameContainer = new Map();
    }

    createCursor(id) {
        const cursorDiv = document.createElement("div");
        const nameDiv = document.createElement("div");
        const name = document.createElement("h6");
        const collaboratorName = this.nameContainer.get(id);
        const arrowHtml = `<i class="material-icons" style="font-size: 25px; color: rgb(178, 190, 181); opacity: 0.8; margin-top: 1px;">navigation</i>`;

        cursorDiv.style.cssText = `
        display: flex;
        justify-content: center;
        left: 60vh;
        bottom: 60vh;
        position: absolute;
        background-color: rgba(0,0,0,0);
        padding: 5px;
        width: 80px;
        z-index: 1;
        height: 60px
        `;
        // eslint-disable-next-line quotes
        nameDiv.style.cssText = `
        position: absolute;
        background-color: rgb(178, 190, 181);
        opacity: 0.8;
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 50px;
        width: 70px;
        z-index: 1;
        height: 15px;
        display: flex;
        justify-content: center;
        top: 35px;
        `;

        name.textContent = collaboratorName;
        name.style.cssText = `
        position: absolute;
        font-size: 12px;
        color: black;
        z-index: 2;
        top: -22px;
        `;

        const arrowSign = document.createRange().createContextualFragment(arrowHtml);
        nameDiv.appendChild(name);
        cursorDiv.appendChild(arrowSign);
        cursorDiv.appendChild(nameDiv);
        document.body.appendChild(cursorDiv);
        this.cursorContainer.set(id, cursorDiv);
    }

    removeCursor(id) {
        const cursor = this.cursorContainer.get(id);
        if (cursor) {
            document.body.removeChild(cursor);
            this.nameContainer.delete(id);
            this.cursorContainer.delete(id);
        }
    }

    trackCursor() {
        if (this.activity.collaboration.hasCollaborationStarted) {
            let counter = 0
            const EMIT_THRESHOLD = 50;
            const emitMouseMove = (e) => {
                counter++;
                if (counter >= EMIT_THRESHOLD) {
                    const roomID = this.activity.room_id;
                    this.activity.collaboration.socket.emit("mouse-move", { room_id: roomID, x: e.clientX, y: e.clientY });
                    counter = 0;
                };
            };
            document.addEventListener("mousemove", emitMouseMove);
        }
    }

}