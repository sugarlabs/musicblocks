window.onload = function()
{
  var userAgent = window.navigator.userAgent;

  // For IE 10 or older
  var MSIE = userAgent.indexOf('MSIE ');
  if (MSIE > 0) {
    DetectVersionOfIE = parseInt(userAgent.substring(MSIE + 5, userAgent.indexOf('.', MSIE)), 10);
  }

  // For IE 11
  var IETrident = userAgent.indexOf('Trident/');
  if (IETrident > 0) {
    var IERv = userAgent.indexOf('rv:');
    DetectVersionOfIE = parseInt(userAgent.substring(IERv + 3, userAgent.indexOf('.', IERv)), 10);
  }

  // For IE 12
  var IEEDGE = userAgent.indexOf('Edge/');
  if (IEEDGE > 0) {
    DetectVersionOfIE = parseInt(userAgent.substring(IEEDGE + 5, userAgent.indexOf('.', IEEDGE)), 10);
  }

  if (typeof DetectVersionOfIE != 'undefined') {
  	document.body.innerHTML =  "<div style='margin: 200px;'>";
	document.body.innerHTML += "<h1 style='font-size: 100px; font-family: Arial; text-align: center; color: #F00;'>Music Blocks</h1>";
	document.body.innerHTML += "<h3 style='font-size: 40px; font-family: Arial; text-align: center;'>Music Blocks will not work in Internet Explorer, you can use:</h3>";
	document.body.innerHTML += "<div style='width: 550px; margin: 0 auto;'><a href='https://www.chromium.org/getting-involved/download-chromium' style='float: left; display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Chromium</a>";
	document.body.innerHTML += "<a href='https://www.google.com/chrome/' style='float: left; margin-left: 40px;display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Chrome</a>";
	document.body.innerHTML += "<a href='https://support.apple.com/downloads/safari' style='float: left; margin-left: 40px;display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Safari</a>";
	document.body.innerHTML += "<a href='https://www.mozilla.org/en-US/firefox/new/' style='float: left; margin-left: 40px;display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Firefox</a>";
	document.body.innerHTML += "</div></div>";
  }

}