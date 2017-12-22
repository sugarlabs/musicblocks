if (navigator.userAgent.search("Firefox") !== -1) {

  browser.browserAction.onClicked.addListener(function(tab) {
      browser.tabs.create({
          url: "index.html"
      });
  });

  browser.runtime.onInstalled.addListener(function (tab) {
    browser.tabs.create({
        url: "index.html"
    });
  });

} else {

  chrome.browserAction.onClicked.addListener(function(tab) {
      window.open(chrome.runtime.getURL("index.html"));
  });

  chrome.runtime.onInstalled.addListener(function (tab) {
      window.open(chrome.runtime.getURL("index.html"));
  });

}
