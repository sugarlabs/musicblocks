// Copyright (c) 2014,2015 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function format(str, data) {
  str = str.replace(/{([a-zA-Z0-9.]*)}/g,
                     function (match, name) {
    x = data;
    name.split('.').forEach(function (v) {
      if (x === undefined) {
        console.log('Undefined value in template string', str, name, x, v);
      }
      x = x[v];
    });
    return x;
  });
  return str.replace(/{_([a-zA-Z0-9]+)}/g,
                     function (match, item) {
    return _(item);
  });
};


function canvasPixelRatio() {
    var devicePixelRatio = window.devicePixelRatio || 1;
    var context = document.querySelector('#myCanvas').getContext('2d');
    var backingStoreRatio = context.webkitBackingStorePixelRatio ||
                            context.mozBackingStorePixelRatio ||
                            context.msBackingStorePixelRatio ||
                            context.oBackingStorePixelRatio ||
                            context.backingStorePixelRatio || 1;
    return devicePixelRatio / backingStoreRatio;
};


function windowHeight() {
    var onAndroid = /Android/i.test(navigator.userAgent);
    if (onAndroid) {
        return window.outerHeight;
    } else {
        return window.innerHeight;
    }
};


function httpGet(projectName) {
    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();

    if (projectName === null) {
        xmlHttp.open("GET", window.server, false);
        xmlHttp.setRequestHeader('x-api-key', '3tgTzMXbbw6xEKX7');
    } else {
        xmlHttp.open("GET", window.server + projectName, false);
        xmlHttp.setRequestHeader('x-api-key', '3tgTzMXbbw6xEKX7');
    }
    xmlHttp.send();
    if (xmlHttp.status > 299) {
        throw 'Error from server';
    }
    return xmlHttp.responseText;
};


function httpPost(projectName, data) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", window.server + projectName, false);
    xmlHttp.setRequestHeader('x-api-key', '3tgTzMXbbw6xEKX7');
    xmlHttp.send(data);
    // return xmlHttp.responseText;
    return 'https://apps.facebook.com/turtleblocks/?file=' + projectName;
};


function HttpRequest(url, loadCallback, userCallback) {
    // userCallback is an optional callback-handler.
    var req = this.request = new XMLHttpRequest();
    this.handler = loadCallback;
    this.url = url;
    this.localmode = Boolean(self.location.href.search(/^file:/i) === 0);
    this.userCallback = userCallback;

    var objref = this;
    try {
        req.open('GET', url);
        req.onreadystatechange = function() { objref.handler(); };
        req.send('');
    }
    catch(e) {
        if (self.console) console.log('Failed to load resource from ' + url + ': Network error.');
        if (typeof userCallback === 'function') userCallback(false, 'network error');
        this.request = this.handler = this.userCallback = null;
    }
};


function docByTagName(tag) {
    document.getElementsByTagName(tag);
};


function docById(id) {
    return document.getElementById(id);
};


function last(myList) {
    var i = myList.length;
    if (i === 0) {
        return null;
    } else {
        return myList[i - 1];
    }
};


function doSVG(canvas, logo, turtles, width, height, scale) {
    // Aggregate SVG output from each turtle. If there is none, use
    // the MUSICICON.
    var MUSICICON = '<g transform="matrix(20,0,0,20,-2500,-200)"> <g style="font-size:20px;font-family:Sans;text-anchor:end;fill:#000000" transform="translate(0.32906,-0.2)"> <path d="m 138.47094,26.82 q 0,-1.16 1.24,-2.02 0.96,-0.64 1.94,-0.64 0.68,0.02 1.18,0.34 l 0,-11.84 0.44,0 0,12.94 q 0,1.32 -1.34,2.1 -0.86,0.5 -1.8,0.5 -0.98,0 -1.44,-0.7 -0.22,-0.32 -0.22,-0.68 z" /> </g> <g transform="translate(-12.52094,4.8)" style="font-size:20px;font-family:Sans;text-anchor:end;fill:#000000"> <path d="m 138.47094,26.82 q 0,-1.16 1.24,-2.02 0.96,-0.64 1.94,-0.64 0.68,0.02 1.18,0.34 l 0,-11.84 0.44,0 0,12.94 q 0,1.32 -1.34,2.1 -0.86,0.5 -1.8,0.5 -0.98,0 -1.44,-0.7 -0.22,-0.32 -0.22,-0.68 z" /> </g> <path style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 130.81346,17 12.29007,-5 0,2 -12.29007,5 z" /> </g>';

    var turtleSVG = '';
    for (var turtle in turtles.turtleList) {
        turtles.turtleList[turtle].closeSVG();
        turtleSVG += turtles.turtleList[turtle].svgOutput;
    }

    var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">\n';
    svg += '<g transform="scale(' + scale + ',' + scale + ')">\n';
    svg += logo.svgOutput;
    svg += '</g>';
    if (turtleSVG === '') {
        svg += MUSICICON;
    } else {
        svg += turtleSVG;
    }
    svg += '</svg>';
    return svg;
};


function isSVGEmpty(turtles) {
    for (var turtle in turtles.turtleList) {
        turtles.turtleList[turtle].closeSVG();
        if (turtles.turtleList[turtle].svgOutput !== '') {
            return false;
        }
    }
    return true;
};


function fileExt(file) {
    var parts = file.split('.');
    if (parts.length === 1 || (parts[0] === '' && parts.length === 2)) {
        return '';
    }
    return parts.pop();
};


function fileBasename(file) {
    var parts = file.split('.');
    if (parts.length === 1) {
        return parts[0];
    } else if (parts[0] === '' && parts.length === 2) {
        return file;
    } else {
        parts.pop(); // throw away suffix
        return parts.join('.');
    }
};


// Needed to generate new data for localization.ini
// var translated = "";
function _(text) {
    replaced = text;
    replace = [",", "(", ")", "?", "¿", "<", ">", ".", '"\n', '"', ":", "%s", "%d", "/", "'", ";", "×", "!", "¡"];
    for (var p = 0; p < replace.length; p++) {
        replaced = replaced.replace(replace[p], "");
    }
    replaced = replaced.replace(/ /g, '-');
    // Needed to generate new data for localization.ini
    // txt = "\n" + replaced + " = " + text;
    // if (translated.lastIndexOf(txt) === -1) {
    //     translated = translated + txt;
    //  }
    // You can log translated in console.log(translated)
    try {
        translation = document.webL10n.get(replaced);
        if (translation === '') {
            translation = text;
        };
        return translation;
    } catch (e) {
        console.log('i18n error: ' + text);
        return text;
    }
};


function processRawPluginData(rawData, palettes, blocks, errorMsg, evalFlowDict, evalArgDict, evalParameterDict, evalSetterDict, evalOnStartList, evalOnStopList) {
    // console.log(rawData);
    var lineData = rawData.split('\n');
    var cleanData = '';

    // We need to remove blank lines and comments and then
    // join the data back together for processing as JSON.
    for (var i = 0; i < lineData.length; i++) {
        if (lineData[i].length === 0) {
            continue;
        }
        if (lineData[i][0] === '/') {
            continue;
        }
        cleanData += lineData[i];
    }

    // Note to plugin developers: You may want to comment out this
    // try/catch while debugging your plugin.
    //try {
        var obj = processPluginData(cleanData.replace(/\n/g,''), palettes, blocks, evalFlowDict, evalArgDict, evalParameterDict, evalSetterDict, evalOnStartList, evalOnStopList);
    //} catch (e) {
    //    var obj = null;
    //    errorMsg('Error loading plugin: ' + e);
    //}
    return obj;
};


function processPluginData(pluginData, palettes, blocks, evalFlowDict, evalArgDict, evalParameterDict, evalSetterDict, evalOnStartList, evalOnStopList) {
    // Plugins are JSON-encoded dictionaries.
    // console.log(pluginData);
    var obj = JSON.parse(pluginData);

    // Create a palette entry.
    var newPalette = false;
    if ('PALETTEPLUGINS' in obj) {
        for (var name in obj['PALETTEPLUGINS']) {
            PALETTEICONS[name] = obj['PALETTEPLUGINS'][name];
            var fillColor = '#ff0066';
            if ('PALETTEFILLCOLORS' in obj) {
                if (name in obj['PALETTEFILLCOLORS']) {
                    var fillColor = obj['PALETTEFILLCOLORS'][name];
                    // console.log(fillColor);
                }
            }
            PALETTEFILLCOLORS[name] = fillColor;

            var strokeColor = '#ef003e';
            if ('PALETTESTROKECOLORS' in obj) {
                if (name in obj['PALETTESTROKECOLORS']) {
                    var strokeColor = obj['PALETTESTROKECOLORS'][name];
                    // console.log(strokeColor);
                }
            }
            PALETTESTROKECOLORS[name] = strokeColor;

            var highlightColor = '#ffb1b3';
            if ('PALETTEHIGHLIGHTCOLORS' in obj) {
                if (name in obj['PALETTEHIGHLIGHTCOLORS']) {
                    var highlightColor = obj['PALETTEHIGHLIGHTCOLORS'][name];
                    // console.log(highlightColor);
                }
            }
            PALETTEHIGHLIGHTCOLORS[name] = highlightColor;

            var strokeHighlightColor = '#404040';
            if ('HIGHLIGHTSTROKECOLORS' in obj) {
                if (name in obj['HIGHLIGHTSTROKECOLORS']) {
                    var strokeHighlightColor = obj['HIGHLIGHTSTROKECOLORS'][name];
                    // console.log(highlightColor);
                }
            }
            HIGHLIGHTSTROKECOLORS[name] = strokeHighlightColor;

            if (name in palettes.buttons) {
                console.log('palette ' + name + ' already exists');
            } else {
                console.log('adding palette ' + name);
                palettes.add(name);
                newPalette = true;
            }
        }
    }

    if (newPalette) {
        try {
            palettes.makePalettes();
        } catch (e) {
            console.log('makePalettes: ' + e);
        }
    }

    // Define the image blocks
    if ('IMAGES' in obj)  {
        for (var blkName in obj['IMAGES'])  {
            pluginsImages[blkName] = obj['IMAGES'][blkName];
        }
    }

    // Populate the flow-block dictionary, i.e., the code that is
    // eval'd by this block.
    if ('FLOWPLUGINS' in obj) {
        for (var flow in obj['FLOWPLUGINS']) {
            evalFlowDict[flow] = obj['FLOWPLUGINS'][flow];
        }
    }

    // Populate the arg-block dictionary, i.e., the code that is
    // eval'd by this block.
    if ('ARGPLUGINS' in obj) {
        for (var arg in obj['ARGPLUGINS']) {
            evalArgDict[arg] = obj['ARGPLUGINS'][arg];
        }
    }

    // Populate the setter dictionary, i.e., the code that is
    // used to set a value block.
    if ('SETTERPLUGINS' in obj) {
        for (var setter in obj['SETTERPLUGINS']) {
            evalSetterDict[setter] = obj['SETTERPLUGINS'][setter];
        }
    }

    // Create the plugin protoblocks.
    if ('BLOCKPLUGINS' in obj) {
        for (var block in obj['BLOCKPLUGINS']) {
            console.log('adding plugin block ' + block);
            try {
                eval(obj['BLOCKPLUGINS'][block]);
            } catch (e) {
                console.log('Failed to load plugin for ' + block + ': ' + e);
            }
        }
    }

    // Create the globals.
    if ('GLOBALS' in obj) {
        eval(obj['GLOBALS']);
    }

    if ('PARAMETERPLUGINS' in obj) {
        for (var parameter in obj['PARAMETERPLUGINS']) {
            evalParameterDict[parameter] = obj['PARAMETERPLUGINS'][parameter];
        }
    }

    // Code to execute when plugin is loaded
    if ('ONLOAD' in obj) {
        for (var arg in obj['ONLOAD']) {
            eval(obj['ONLOAD'][arg]);
        }
    }

    // Code to execute when turtle code is started
    if ('ONSTART' in obj) {
        for (var arg in obj['ONSTART']) {
            evalOnStartList[arg] = obj['ONSTART'][arg];
        }
    }

    // Code to execute when turtle code is stopped
    if ('ONSTOP' in obj) {
        for (var arg in obj['ONSTOP']) {
            evalOnStopList[arg] = obj['ONSTOP'][arg];
        }
    }

    // Push the protoblocks onto their palettes.
    for (var protoblock in blocks.protoBlockDict) {
        if (blocks.protoBlockDict[protoblock].palette === undefined) {
            console.log('Cannot find palette for protoblock ' + protoblock);
        } else {
            blocks.protoBlockDict[protoblock].palette.add(blocks.protoBlockDict[protoblock]);
        }
    }

    palettes.updatePalettes();

    // Populate the lists of block types.
    blocks.findBlockTypes();

    // Return the object in case we need to save it to local storage.
    return obj;
};


function updatePluginObj(obj) {
    for (var name in obj['PALETTEPLUGINS']) {
        pluginObjs['PALETTEPLUGINS'][name] = obj['PALETTEPLUGINS'][name];
    }

    for (var name in obj['PALETTEFILLCOLORS']) {
        pluginObjs['PALETTEFILLCOLORS'][name] = obj['PALETTEFILLCOLORS'][name];
    }

    for (var name in obj['PALETTESTROKECOLORS']) {
        pluginObjs['PALETTESTROKECOLORS'][name] = obj['PALETTESTROKECOLORS'][name];
    }

    for (var name in obj['PALETTEHIGHLIGHTCOLORS']) {
        pluginObjs['PALETTEHIGHLIGHTCOLORS'][name] = obj['PALETTEHIGHLIGHTCOLORS'][name];
    }

    for (var flow in obj['FLOWPLUGINS']) {
        pluginObjs['FLOWPLUGINS'][flow] = obj['FLOWPLUGINS'][flow];
    }

    for (var arg in obj['ARGPLUGINS']) {
        pluginObjs['ARGPLUGINS'][arg] = obj['ARGPLUGINS'][arg];
    }

    for (var block in obj['BLOCKPLUGINS']) {
        pluginObjs['BLOCKPLUGINS'][block] = obj['BLOCKPLUGINS'][block];
    }

    if ('GLOBALS' in obj) {
        if (!('GLOBALS' in pluginObjs)) {
            pluginObjs['GLOBALS'] = '';
        }
        pluginObjs['GLOBALS'] += obj['GLOBALS'];
    }

    if ('IMAGES' in obj) {
        pluginObjs['IMAGES'] = obj['IMAGES'];
    }

    for (var name in obj['ONLOAD']) {
        pluginObjs['ONLOAD'][name] = obj['ONLOAD'][name];
    }

    for (var name in obj['ONSTART']) {
        pluginObjs['ONSTART'][name] = obj['ONSTART'][name];
    }

    for (var name in obj['ONSTOP']) {
        pluginObjs['ONSTOP'][name] = obj['ONSTOP'][name];
    }
};


function preparePluginExports(obj) {
    // add obj to plugin dictionary and return as JSON encoded text
    updatePluginObj(obj);

    return JSON.stringify(pluginObjs);
};


function processMacroData(macroData, palettes, blocks, macroDict) {
    // Macros are stored in a JSON-encoded dictionary.
    if (macroData !== '{}') {
        var obj = JSON.parse(macroData);
        palettes.add('myblocks', 'black', '#a0a0a0');

        for (var name in obj) {
            console.log('adding ' + name + ' to macroDict');
            macroDict[name] = obj[name];
            blocks.addToMyPalette(name, macroDict[name]);
        }

        palettes.makePalettes();
    }
};


function prepareMacroExports(name, stack, macroDict) {
    if (name !== null) {
        macroDict[name] = stack;
    }

    return JSON.stringify(macroDict);
};


function doSaveSVG(logo, desc) {
    var svg = doSVG(logo.canvas, logo, logo.turtles, logo.canvas.width, logo.canvas.height, 1.0);
    download(desc, 'data:image/svg+xml;utf8,' + svg, desc, '"width=' + logo.canvas.width + ', height=' + logo.canvas.height + '"');
};


function doSaveLilypond(logo, desc) {
    download(desc, 'data:text;utf8,' + encodeURIComponent(logo.lilypondOutput), desc, '"width=' + logo.canvas.width + ', height=' + logo.canvas.height + '"');
};


function download(filename, data) {
    var a = document.createElement('a');
    a.setAttribute('href', data);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// Some block-specific code

// Publish to FB
function doPublish(desc) {
    var url = doSave();
    console.log('push ' + url + ' to FB');
    var descElem = docById("description");
    var msg = desc + ' ' + descElem.value + ' ' + url;
    console.log('comment: ' + msg);
    var post_cb = function() {
        FB.api('/me/feed', 'post', {
            message: msg
        });
    };

    FB.login(post_cb, {
        scope: 'publish_actions'
    });
};


// TODO: Move to camera plugin
var hasSetupCamera = false;
function doUseCamera(args, turtles, turtle, isVideo, cameraID, setCameraID, errorMsg) {
    var w = 320;
    var h = 240;

    var streaming = false;
    var video = document.querySelector('#camVideo');
    var canvas = document.querySelector('#camCanvas');
    navigator.getMedia = (navigator.getUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.msGetUserMedia);
    if (navigator.getMedia === undefined) {
        errorMsg('Your browser does not support the webcam');
    }

    if (!hasSetupCamera) {
        navigator.getMedia(
            {video: true, audio: false},
            function (stream) {
                if (navigator.mozGetUserMedia) {
                    video.mozSrcObject = stream;
                } else {
                    var vendorURL = window.URL || window.webkitURL;
                    video.src = vendorURL.createObjectURL(stream);
                }
                video.play();
                hasSetupCamera = true;
            }, function (error) {
                errorMsg('Could not connect to camera');
                console.log('Could not connect to camera', error);
        });
    } else {
        streaming = true;
        video.play();
        if (isVideo) {
            cameraID = window.setInterval(draw, 100);
            setCameraID(cameraID);
        } else {
            draw();
        }
    }

    video.addEventListener('canplay', function (event) {
        console.log('canplay', streaming, hasSetupCamera);
        if (!streaming) {
            video.setAttribute('width', w);
            video.setAttribute('height', h);
            canvas.setAttribute('width', w);
            canvas.setAttribute('height', h);
            streaming = true;

            if (isVideo) {
                cameraID = window.setInterval(draw, 100);
                setCameraID(cameraID);
            } else {
                draw();
            }
        }
    }, false);

    function draw() {
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(video, 0, 0, w, h);
        var data = canvas.toDataURL('image/png');
        turtles.turtleList[turtle].doShowImage(args[0], data);
    };
};


function doStopVideoCam(cameraID, setCameraID) {
    if (cameraID !== null) {
        window.clearInterval(cameraID);
    }

    setCameraID(null);
    document.querySelector('#camVideo').pause();
};


function hideDOMLabel() {
    var textLabel = docById('textLabel');
    if (textLabel !== null) {
        textLabel.style.display = 'none';
    }

    var numberLabel = docById('numberLabel');
    if (numberLabel !== null) {
        numberLabel.style.display = 'none';
    }

    var solfegeLabel = docById('solfegeLabel');
    if (solfegeLabel !== null) {
        solfegeLabel.style.display = 'none';
    }

    var notenameLabel = docById('notenameLabel');
    if (notenameLabel !== null) {
        notenameLabel.style.display = 'none';
    }

    var noteattrLabel = docById('noteattrLabel');
    if (noteattrLabel !== null) {
        noteattrLabel.style.display = 'none';
    }

    var drumnameLabel = docById('drumnameLabel');
    if (drumnameLabel !== null) {
        drumnameLabel.style.display = 'none';
    }

    var voicenameLabel = docById('voicenameLabel');
    if (voicenameLabel !== null) {
        voicenameLabel.style.display = 'none';
    }

    var modenameLabel = docById('modenameLabel');
    if (modenameLabel !== null) {
        modenameLabel.style.display = 'none';
    }
};


function displayMsg(blocks, text) {
    /*
    var msgContainer = blocks.msgText.parent;
    msgContainer.visible = true;
    blocks.msgText.text = text;
    msgContainer.updateCache();
    blocks.stage.setChildIndex(msgContainer, blocks.stage.getNumChildren() - 1);
    */
    return;
};
