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
import Y, { Doc } from "yjs";
import SocketIOProvider from "y-socket.io";

// const Y = require("yjs");
// const SocketIOProvider = require("y-socket.io");

console.log(Y);
console.log(SocketIOProvider);

const doc = new Doc();
const yMap = doc.getMap();

const socketIOProvider = new SocketIOProvider("ws://localhost:5000", "testing-doc", doc, {
    autoConnect: true
});

socketIOProvider.awareness.on("change", () => console.log("connected from client"));