chrome.browserAction.onClicked.addListener(function(tab) {
  window.open(chrome.runtime.getURL("index.html"));
});

// Firefox
browser.browserAction.onClicked.addListener(function(tab) {
    browser.tabs.update({
        url: "index.html"
    });
});


chrome.runtime.onInstalled.addListener(function (tab) {
  window.open(chrome.runtime.getURL("index.html"));
});

//Firefox
browser.runtime.onInstalled.addListener(function (tab) {
  browser.tabs.update({
      url: "index.html"
  });
});