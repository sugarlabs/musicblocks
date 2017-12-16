chrome.browserAction.onClicked.addListener(function(tab) {
  window.open(chrome.runtime.getURL("index.html"));
});

chrome.runtime.onInstalled.addListener(function (callback) {
  window.open(chrome.runtime.getURL("index.html"));

});