// preload.js

process.once('loaded', function() {
    window.isElectron = true
    console.log("loaded!!!")
});