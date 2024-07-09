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

const RETRIES = 5;
const DELAY_DURATION = 2000;
let attempts = 0;

function stopConnection(socket) {
    if(attempts >= RETRIES){
        console.log("Maximum calls to make connection exceeded. Stopped making calls");
        socket.disconnect();
    }
}

function makeConnection(){

    // connect to the local server
    const socket = io("http://localhost:8080/");
    socket.on("connect", () => {
        try{
            console.log("connected to the server");
        } catch(error){
            console.log("Connection failed", error);
        }
    });

    socket.on("connect_error", (error) => {
        attempts++;
        console.log("Failed to connect to the socket server. Retrying in few seconds...");
        setTimeout(stopConnection(socket), DELAY_DURATION);
    });
}

function startCollaboration(){
    document.addEventListener("DOMContentLoaded", () => {
        makeConnection();
        // initialiseDoc();
    });
}

startCollaboration();

