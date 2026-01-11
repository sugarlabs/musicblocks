const { app, BrowserWindow } = require("electron");
const path = require("path");

require("./index.js");

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "Music Blocks",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            enableRemoteModule: false
        }
    });

    setTimeout(() => {
        win.loadURL("http://127.0.0.1:3000");
    }, 1000);
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
