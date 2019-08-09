'use strict';

const electron = require("electron");
var nodeStatic = require('node-static');
const path = require('path')
const { app, globalShortcut, Menu, ipcMain} = require("electron");

var file = new nodeStatic.Server(__dirname + '/musicblocks');
var port = 0;

var server = require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    file.serve(request, response);
  }).resume();
}).listen(3000);

const BrowserWindow = electron.BrowserWindow;
let mainWindow;

app.on('window-all-closed', function () {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function () {

  var lang = app.getLocale();
  if(!localizedMenu[lang]){
    lang = "en"
  }
  mainWindow = new BrowserWindow({
    title: localizedMenu[lang]['Title'],
    show: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.setMenu(null)
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  
  var template = [
    {
      label: localizedMenu[lang]["Edit"],
      submenu: [
        {role: 'reload', label: localizedMenu[lang]["Reload"]},
        {role: 'forcereload', label: localizedMenu[lang]["ForceReload"]},
        {role: 'toggledevtools', label: localizedMenu[lang]["ToggleDevTools"]},
        {type: 'separator'},
        {role: 'resetzoom', label: localizedMenu[lang]["ResetZoom"]},
        {role: 'zoomin', label: localizedMenu[lang]["ZoomIn"]},
        {role: 'zoomout', label: localizedMenu[lang]["ZoomOut"]},
        {type: 'separator'},
        {role: 'togglefullscreen', label: localizedMenu[lang]["ToggleFullScreen"]}
      ]
    },
    {
      role: 'window', label: localizedMenu[lang]["Window"],
      submenu: [
        {role: 'minimize', label: localizedMenu[lang]["Minimize"]},
        {role: 'close', label:localizedMenu[lang]["Close"]}
      ]
    },
    {
      role: 'help', label: localizedMenu[lang]["Help"],
      submenu: [
        {
          label: localizedMenu[lang]["OpenHomepage"],
          click () { require('electron').shell.openExternal('https://musicblocks.net/') }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  mainWindow.maximize()
  mainWindow.setResizable(true)
  mainWindow.show()

  mainWindow.on('closed', function () {
    mainWindow = null;
    server.close()
  });

  mainWindow.on('page-title-updated', (evt) => {
    evt.preventDefault();
  });
});

const localizedMenu = {
  "en": {
    "Title": "MusicBlocks Offline Version",
    "Edit": "Edit",
    "Reload": "Reload",
    "ForceReload": "Force Reload",
    "ToggleDevTools": "Toggle Developer Tools",
    "ResetZoom": "Reset Zoom",
    "ZoomIn": "Zoom In",
    "ZoomOut": "Zoom Out",
    "ToggleFullScreen": "Toggle Fullscreen",
    "Window": "Window",
    "Minimize": "Minimize",
    "Close": "Close",
    "Help": "Help",
    "OpenHomepage": "Open Homepage"
   },
  "ja": {
    "Title": "ミュージックブロックス オフラインバージョン",
    "Edit": "編集",
    "Reload": "リロード",
    "ForceReload": "強制リロード",
    "ToggleDevTools": "開発者ツールを表示",
    "ResetZoom": "等倍にする",
    "ZoomIn": "拡大する",
    "ZoomOut": "縮小する",
    "ToggleFullScreen": "フルスクリーンの有効化/無効化",
    "Window": "ウィンドウ",
    "Minimize": "最小化",
    "Close": "閉じる",
    "Help": "ヘルプ",
    "OpenHomepage": "ホームページを開く"
  }
}