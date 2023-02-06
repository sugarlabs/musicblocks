/**
 * @license RequireJS text 2.0.10 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, Components, FileUtils */

define(['module'], (module) => {
  'use strict'; var text, fs, Cc, Ci, xpcIsWindows, progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'], xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im, bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im, hasLocation = typeof location !== 'undefined' && location.href, defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''), defaultHostName = hasLocation && location.hostname, defaultPort = hasLocation && (location.port || undefined), buildMap = {}, masterConfig = (module.config && module.config()) || {}; text = {
    version: '2.0.10', strip: (content) => {
      if (content) { content = content.replace(xmlRegExp, ""); var matches = content.match(bodyRegExp); if (matches) { content = matches[1]; } } else { content = ""; }
      return content;
    }, jsEscape: (content) => { return content.replace(/(['\\])/g, '\\$1').replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r").replace(/[\u2028]/g, "\\u2028").replace(/[\u2029]/g, "\\u2029"); }, createXhr: masterConfig.createXhr || function () {
      var xhr, i, progId; if (typeof XMLHttpRequest !== "undefined") { return new XMLHttpRequest(); } else if (typeof ActiveXObject !== "undefined") {
        for (i = 0; i < 3; i += 1) {
          progId = progIds[i]; try { xhr = new ActiveXObject(progId); } catch (e) { }
          if (xhr) { progIds = [progId]; break; }
        }
      }
      return xhr;
    }, parseName: (name) => {
      var modName, ext, temp, strip = false, index = name.indexOf("."), isRelative = name.indexOf('./') === 0 || name.indexOf('../') === 0; if (index !== -1 && (!isRelative || index > 1)) { modName = name.substring(0, index); ext = name.substring(index + 1, name.length); } else { modName = name; }
      temp = ext || modName; index = temp.indexOf("!"); if (index !== -1) { strip = temp.substring(index + 1) === "strip"; temp = temp.substring(0, index); if (ext) { ext = temp; } else { modName = temp; } }
      return { moduleName: modName, ext: ext, strip: strip };
    }, xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/, useXhr: (url, protocol, hostname, port) => {
      var uProtocol, uHostName, uPort, match = text.xdRegExp.exec(url); if (!match) { return true; }
      uProtocol = match[2]; uHostName = match[3]; uHostName = uHostName.split(':'); uPort = uHostName[1]; uHostName = uHostName[0]; return (!uProtocol || uProtocol === protocol) && (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) && ((!uPort && !uHostName) || uPort === port);
    }, finishLoad: (name, strip, content, onLoad) => {
      content = strip ? text.strip(content) : content; if (masterConfig.isBuild) { buildMap[name] = content; }
      onLoad(content);
    }, load: (name, req, onLoad, config) => {
      if (config.isBuild && !config.inlineText) { onLoad(); return; }
      masterConfig.isBuild = config.isBuild; var parsed = text.parseName(name), nonStripName = parsed.moduleName + (parsed.ext ? '.' + parsed.ext : ''), url = req.toUrl(nonStripName), useXhr = (masterConfig.useXhr) || text.useXhr; if (url.indexOf('empty:') === 0) { onLoad(); return; }
      if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) { text.get(url, (content) => { text.finishLoad(name, parsed.strip, content, onLoad); }, (err) => { if (onLoad.error) { onLoad.error(err); } }); } else { req([nonStripName], (content) => { text.finishLoad(parsed.moduleName + '.' + parsed.ext, parsed.strip, content, onLoad); }); }
    }, write: (pluginName, moduleName, write, config) => { if (buildMap.hasOwnProperty(moduleName)) { var content = text.jsEscape(buildMap[moduleName]); write.asModule(pluginName + "!" + moduleName, "define(() => { return '" + content + "';});\n"); } }, writeFile: (pluginName, moduleName, req, write, config) => { var parsed = text.parseName(moduleName), extPart = parsed.ext ? '.' + parsed.ext : '', nonStripName = parsed.moduleName + extPart, fileName = req.toUrl(parsed.moduleName + extPart) + '.js'; text.load(nonStripName, req, (value) => { var textWrite = (contents) => { return write(fileName, contents); }; textWrite.asModule = (moduleName, contents) => { return write.asModule(moduleName, fileName, contents); }; text.write(pluginName, nonStripName, textWrite, config); }, config); }
  }; if (masterConfig.env === 'node' || (!masterConfig.env && typeof process !== "undefined" && process.versions && !!process.versions.node && !process.versions['node-webkit'])) {
    fs = require.nodeRequire('fs'); text.get = (url, callback, errback) => {
      try {
        var file = fs.readFileSync(url, 'utf8'); if (file.indexOf('\uFEFF') === 0) { file = file.substring(1); }
        callback(file);
      } catch (e) { errback(e); }
    };
  } else if (masterConfig.env === 'xhr' || (!masterConfig.env && text.createXhr())) {
    text.get = (url, callback, errback, headers) => {
      var xhr = text.createXhr(), header; xhr.open('GET', url, true); if (headers) { for (header in headers) { if (headers.hasOwnProperty(header)) { xhr.setRequestHeader(header.toLowerCase(), headers[header]); } } }
      if (masterConfig.onXhr) { masterConfig.onXhr(xhr, url); }
      xhr.onreadystatechange = (evt) => {
        var status, err; if (xhr.readyState === 4) {
          status = xhr.status; if (status > 399 && status < 600) { err = new Error(url + ' HTTP status: ' + status); err.xhr = xhr; errback(err); } else { callback(xhr.responseText); }
          if (masterConfig.onXhrComplete) { masterConfig.onXhrComplete(xhr, url); }
        }
      }; xhr.send(null);
    };
  } else if (masterConfig.env === 'rhino' || (!masterConfig.env && typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
    text.get = (url, callback) => {
      var stringBuffer, line, encoding = "utf-8", file = new java.io.File(url), lineSeparator = java.lang.System.getProperty("line.separator"), input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)), content = ''; try {
        stringBuffer = new java.lang.StringBuffer(); line = input.readLine(); if (line && line.length() && line.charAt(0) === 0xfeff) { line = line.substring(1); }
        if (line !== null) { stringBuffer.append(line); }
        while ((line = input.readLine()) !== null) { stringBuffer.append(lineSeparator); stringBuffer.append(line); }
        content = String(stringBuffer.toString());
      } finally { input.close(); }
      callback(content);
    };
  } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env && typeof Components !== 'undefined' && Components.classes && Components.interfaces)) {
    Cc = Components.classes, Ci = Components.interfaces; Components.utils['import']('resource://gre/modules/FileUtils.jsm'); xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc); text.get = (url, callback) => {
      var inStream, convertStream, fileObj, readData = {}; if (xpcIsWindows) { url = url.replace(/\//g, '\\'); }
      fileObj = new FileUtils.File(url); try { inStream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream); inStream.init(fileObj, 1, 0, false); convertStream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream); convertStream.init(inStream, "utf-8", inStream.available(), Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER); convertStream.readString(inStream.available(), readData); convertStream.close(); inStream.close(); callback(readData.value); } catch (e) { throw new Error((fileObj && fileObj.path || '') + ': ' + e); }
    };
  }
  return text;
});