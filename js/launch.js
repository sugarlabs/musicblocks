chrome.app.runtime.onLaunched.addListener(function() {
	// Create window
	var mainwin = chrome.app.window.create('../index.html', {
		id: "mainwin",
	},function(created) {
	});
});
