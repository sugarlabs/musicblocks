'use strict';

const electron = require("electron");
var nodeStatic = require('node-static');
const path = require('path')
const { app, globalShortcut, Menu, ipcMain} = require("electron");

var file = new nodeStatic.Server(__dirname + '../../');
var port = 0;

const template = [
  {
    label: '表示',
    submenu: [
      {role: 'reload', label:"リロード"},
      {role: 'forcereload', label:"強制リロード"},
      {role: 'toggledevtools', label:"開発者ツールを表示"},
      {type: 'separator'},
      {role: 'resetzoom', label:"等倍にする"},
      {role: 'zoomin', label:"拡大する"},
      {role: 'zoomout', label:"縮小する"},
      {type: 'separator'},
      {role: 'togglefullscreen', label:"フルスクリーンの有効化/無効化"}
    ]
  },
  {
    role: 'window', label:"ウィンドウ",
    submenu: [
      {role: 'minimize', label:"最小化"},
      {role: 'close', label:"閉じる"}
    ]
  },
  {
    role: 'help', label:"ヘルプ",
    submenu: [
      {
        label: 'ホームページを開く',
        click () { require('electron').shell.openExternal('https://musicblocks.net/') }
      }
    ]
  }
]

var server = require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    file.serve(request, response);
  }).resume();
}).listen(port);

const BrowserWindow = electron.BrowserWindow;
let mainWindow;

app.on('window-all-closed', function () {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    title: "ミュージックブロックス オフラインバージョン",
    show: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.setMenu(null)
  mainWindow.loadURL('http://localhost:' + server.address().port + '/index.html');
  //mainWindow.webContents.openDevTools()
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

    // Register a 'CommandOrControl+Y' shortcut listener.
  globalShortcut.register('CommandOrControl+Y', () => {
    // Do stuff when Y and either Command/Control is pressed.
    console.log("pressed!")
  });
});