describe("Browser Action Behavior", () => {
  let mockBrowser;
  let mockChrome;

  beforeEach(() => {
    // Mock objects
    mockBrowser = {
      browserAction: {
        onClicked: { addListener: jest.fn() },
      },
      tabs: { create: jest.fn() },
      runtime: {
        onInstalled: { addListener: jest.fn() },
      },
    };

    mockChrome = {
      browserAction: {
        onClicked: { addListener: jest.fn() },
      },
      runtime: {
        onInstalled: { addListener: jest.fn() },
        getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
      },
      tabs: { create: jest.fn() },
    };

    global.browser = mockBrowser;
    global.chrome = mockChrome;

    Object.defineProperty(global.navigator, "userAgent", {
      writable: true,
      value: "",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.browser;
    delete global.chrome;
  });

  it("should set up Firefox-specific listeners when user agent is Firefox", () => {
    navigator.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0";

    jest.resetModules(); // Clear the module cache
    const { isFirefox, browserAction } = require("../background.js");

    expect(isFirefox).toBe(true);
    expect(browserAction.onClicked.addListener).toHaveBeenCalledTimes(1);
    expect(mockBrowser.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
  });

  it("should set up Chrome-specific listeners when user agent is not Firefox", () => {
    navigator.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

    jest.resetModules(); // Clear the module cache
    const { isFirefox, browserAction } = require("../background.js");

    expect(isFirefox).toBe(false);
    expect(browserAction.onClicked.addListener).toHaveBeenCalledTimes(1);
    expect(mockChrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
  });
});
