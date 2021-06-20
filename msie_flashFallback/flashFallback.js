/*
  A fallback to flash for wav-output (for IE 10)
  Please mind that wav data has to be copied to an ArrayBuffer object internally,
  since we may not send binary data to the swf.
  This may take some time and memory for longer utterances.
*/

var meSpeakFlashFallback = new function() {

var swfDefaultId='meSpeakFallback',
	swfDefaultUrl='meSpeakFallback.swf',
	swfElementId='', swfViaAX=false, swfInstalled=false, swfHasLoaded=false, swfVol=1;

// public

function swfInstallFallback(swfUrl, swfId, parentElementOrId) {
	var parentEl, url;
	if (swfInstalled) return true;
	if (!swfIsAvailable(10)) return false;
	swfInstalled=true;
	// set defaults
	swfElementId = (swfId && typeof swfId == 'string')? swfId:swfDefaultId;
	url = (swfUrl && typeof swfUrl == 'string')? swfUrl:swfDefaultUrl;
	if (parentElementOrId) {
		if (typeof parentElementOrId == 'string') {
			parentEl=document.getElementById(parentElementOrId);
		}
		else if (typeof parentElementOrId == 'object') {
			parentEl=parentElementOrId=null;
		}
	}
	if (!parentEl) parentEl=document.getElementsByTagName('body')[0];
	if (!parentEl) return false;
	// inject
	var obj = swfCreate(
		{
			'data': url,
			'width': '2',
			'height': '2',
			'id': swfElementId,
			'name': swfElementId,
			'align': 'top'
		},
		{
			'quality': 'low',
			'bgcolor': 'transparent',
			'allowscriptaccess': 'sameDomain',
			'allowfullscreen': 'false'
		}
	);
	parentEl.appendChild(obj);
	swfRegisterUnloadHandler();
	return true;
}

function swfReady() {
	return swfHasLoaded;
}

function swfSetVolume(v) {
	if (wfHasLoaded) {
		var obj=document.getElementById(swfElementId);
		if (obj) el.setVolume(v);
	}
	swfVol=v;
}

function swfSpeak(txt, options) {
	if (swfHasLoaded && window.meSpeak) {
		var obj=document.getElementById(swfElementId);
		if (obj) {
			if (!typeof options != 'object') options={};
			options.rawdata='array';
			obj.play( meSpeak.speak(txt, options) );
		}
	}
}

function swf10Available() {
	return swfIsAvailable(10);
}

function swfFallbackHandshake() {
	swfHasLoaded=true;
	if (swfVol!=1) swfSetVolume(swfVol);
	if (window.console) console.log('meSpeak-SWF-fallback available.');
}


// private: a stripped-down version of swfobject.js

function swfIsAvailable(leastMajorVersion) {
	// returns Boolean: flashplayer and version at least 10.x
	var sf='Shockwave Flash', sfm='application/x-shockwave-flash';
	if (navigator.plugins !== undefined && typeof navigator.plugins[sf] == 'object') {
		var d=navigator.plugins[sf].description;
		if (d && !(typeof navigator.mimeTypes !==undefined && navigator.mimeTypes[sfm] && !navigator.mimeTypes[sfm].enabledPlugin)) {
			d=d.replace(/^.*\s+(\S+\s+\S+$)/, '$1');
			if (leastMajorVersion<= parseInt(d.replace(/^(.*)\..*$/, '$1'), 10)) return true;
		}
	}
	else if (window.ActiveXObject) {
		try {
			var a=new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
			if (a) {
				swfViaAX=true;
				d=a.GetVariable('$version');
				if (d) {
					d=d.split(' ')[1].split(',');
					if (leastMajorVersion<= parseInt(d[0], 10)) return true;
				}
			}
		}
		catch(e) {}
	}
	return false;
}

function swfCreate(attributes, params) {
	if (swfViaAX) {
		var att='', par='', i;
		for (i in attributes) {
			var a=i.toLowerCase;
			if (a=='data') {
				params.movie=attributes[i];
			}
			else if (a=='styleclass') {
				att+=' class="'+attributes[i]+'"';
			}
			else if (a!='classid') {
				att+=' '+i+'="'+attributes[i]+'"';
			}
		}
		for (i in params) {
			if (params[i] != Object.prototype[i]) par+=' <param name="'+i+'" value="'+params[i]+'" />';
		}
		var el=document.createElement('div');
		el.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+att+'>'+par+'</object>';
		return el;
	}
	else {
		var o=document.createElement('object');
		o.setAttribute('type', 'application/x-shockwave-flash');
		for (var i in attributes) {
			if (attributes[i] != Object.prototype[i]) {
				var a=i.toLowerCase();
				if (a=='styleclass') {
					o.setAttribute('class', attributes[i]);
				}
				else if (a!='styleclass') {
					o.setAttribute(i, attributes[i]);
				}
			}
		}
		for (i in params) {
			if (attributes[i] != Object.prototype[i] && i.toLowerCase() != 'movie') {
				var p=document.createElement('param');
				p.setAttribute('name', i);
				p.setAttribute('value', attributes[i]);
				o.appendChild(p);
			}
		}
		return o;
	}
}

function swfRemove(obj) {
	try {
		if (typeof obj =='string') obj=document.getElementById(obj);
		if (!obj || typeof obj !='object') return;
		if (swfViaAX) {
			obj.style.display='none';
			swfRemoveObjectInIE(obj.id);
		}
		else if (obj.parentNode) {
			obj.parentNode.removeChild(obj);
		}
		swfInstalled=false;
	}
	catch(e) {}
}

function swfRemoveObjectInIE(id) {
	var obj=document.getElementById(obj);
	if (obj) {
		if (obj.readyState==4) {
			for (var i in obj) {
				if (typeof obj[i] =='function') obj[i] = null;
			}
			if (obj.parentNode) obj.parentNode.removeChild(obj);
		}
		else {
			setTimeout(function() {swfRemoveObjectInIE(id)}, 10);
		}
	}
}

function swfUnloadHandler() {
	if (swfElementId) swfRemove(swfElementId);
	if (!window.addEventListener && window.detachEvent) window.detachEvent('onunload', swfUnloadHandler);
}

function swfRegisterUnloadHandler() {
	if (window.addEventListener) {
		window.addEventListener('unload', swfUnloadHandler, false);
	}
	else if (window.attachEvent) {
		window.attachEvent('onunload', swfUnloadHandler);
	}
}

return {
	'install': swfInstallFallback,
	'isAvailable': swf10Available,
	'ready': swfReady,
	'speak': swfSpeak,
	'setVolume': swfSetVolume,
	'swfFallbackHandshake': swfFallbackHandshake
}

};

function meSpeakFallbackHandshake() {
	// handshake handler with swf external interface
	meSpeakFlashFallback.swfFallbackHandshake();
}

	