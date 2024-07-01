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