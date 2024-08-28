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


// Collaboration

/* eslint-disable no-undef */


class Collaboration {
    constructor(activity) {
        this.activity = activity;
        this.RETRIES = 5;
        this.DELAY_DURATION = 2000;
        this.attempts = 0;
        this.socket = null;
        this.blockList = this.activity.blocks.blockList;
        this.PORT = "http://localhost:8080/";
        this.hasCollaborationStarted = false;
        this.updatedProjectHtml = null;
    }

    // Convert the blockList into html
    convertBlockListToHtml = () => {
        this.updatedProjectHtml = this.activity.prepareExport();
        return this.updatedProjectHtml;
    };

    // Stop making calls to the socket server
    stopConnection = (socket) => {
        if (this.attempts >= this.RETRIES) {
            console.log("Maximum calls to make connection exceeded. Stopped making calls");
            socket.disconnect();
        }
    };

    // Make calls to the socket server
    makeConnection = (room_id, name) => {
        // connect to the local server
        const socket = io(this.PORT);
        socket.on("connect", () => {
            this.socket = socket;
            try {
                console.log("connected to the server");
                this.hasCollaborationStarted = true;
                socket.emit("joinRoom", {room_id, name});
                this.activity.collabCursor.trackCursor();
            } catch (error) {
                console.log("Connection failed", error);
            }
        });

        socket.on("existing-cursor", (cursorArray) => {
            if (cursorArray.length > 1) {
                cursorArray.forEach(({id}) => {
                    const ID = id[0];
                    if (ID !== this.socket.id){
                        this.activity.collabCursor.createCursor(ID);
                    }
                });
            }
        });

        socket.on("new-cursor", ({id}) => {
            this.activity.collabCursor.createCursor(id);
        });

        socket.on("remove-cursor", (id) => {
            this.activity.collabCursor.removeCursor(id);
        })

        socket.on("mouse-move", (data) => {
            const {socket_id, x, y} = data;
            const cursor = this.activity.collabCursor.cursorContainer.get(socket_id);
            if (cursor) {
                cursor.style.left = `${x}px`;
                cursor.style.top = `${y}px`;
            }
        });

        socket.on("add-new-name", ({id, name}) => {
            this.activity.collabCursor.nameContainer.set(id, name);
        })

        socket.on("add-existing-names", ((namesArray) => {
            if (namesArray.length > 1) {
                namesArray.forEach(({id, name}) => {
                    this.activity.collabCursor.nameContainer.set(id, name);
                });
            }
        }));
        
        socket.on("connect_error", () => {
            this.attempts++;
            console.log("Failed to connect to the socket server. Retrying in few seconds...");
            setTimeout(this.stopConnection(socket), this.DELAY_DURATION);
        });

        socket.on("new-block-added", (update) => {
            this.activity.renderProjectFromData(update);
        });

        socket.on("new-block-deleted", (update) => {
            this.activity.renderProjectFromData(update);
        });

        socket.on("block-moved/connected/disconnected", (update) => {
            this.activity.renderProjectFromData(update);
        });

        socket.on("block-value-updated", (update) => {
            this.activity.renderProjectFromData(update);
        });
    };

    // Start the collaboration
    startCollaboration = (ID) => {
        this.makeConnection(ID);
    };
}

