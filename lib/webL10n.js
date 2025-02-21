/**
 * Copyright (c) 2011-2013 Fabien Cazenave, Mozilla.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

/*jshint browser: true, devel: true, es5: true, globalstrict: true */

'use strict';


document.webL10n = (
    function (window, document, undefined) {
        var gL10nData = {};
        var gTextData = '';
        var gTextProp = 'textContent';
        var gLanguage = '';
        var gMacros = {};
        var gReadyState = 'loading';
        var gAsyncResourceLoading = true;
        var gDEBUG = 0;


        function consoleLog(message) {
            if (gDEBUG >= 2) {
                console.log('[l10n] ' + message);
            }
        };

        function consoleWarn(message) {
            if (gDEBUG) {
                console.warn('[l10n] ' + message);
            }
        };

        function getL10nResourceLinks() {
            return document.querySelectorAll('link[type="application/l10n"]');
        }

        function getL10nDictionary() {
            var script = document.querySelector('script[type="application/l10n"]');
            return script ? JSON.parse(script.innerHTML) : null;
        }

        function getTranslatableChildren(element) {
            return element ? element.querySelectorAll('*[data-l10n-id]') : [];
        }

        function getL10nAttributes(element) {
            if (!element)
                return {};

            var l10nId = element.getAttribute('data-l10n-id');
            var l10nArgs = element.getAttribute('data-l10n-args');
            var args = {};
            if (l10nArgs) {
                try {
                    args = JSON.parse(l10nArgs);
                }
                catch (e) {
                    consoleWarn('could not parse arguments for #' + l10nId);
                }
            }
            return { id: l10nId, args: args };
        }

        function fireL10nReadyEvent(lang) {
            var evtObject = document.createEvent('Event');
            evtObject.initEvent('localized', true, false);
            evtObject.language = lang;
            document.dispatchEvent(evtObject);
        }

        function xhrLoadText(url, onSuccess, onFailure, asynchronous) {
            onSuccess = onSuccess || function _onSuccess(data) { };
            onFailure = onFailure || function _onFailure() {
                consoleWarn(url + ' not found.');
            };
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, asynchronous);
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=utf-8');
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200 || xhr.status === 0) {
                        onSuccess(xhr.responseText);
                    }
                    else { onFailure(); }
                }
            };
            xhr.onerror = onFailure;
            xhr.ontimeout = onFailure;
            try {
                xhr.send(null);
            }
            catch (e) {
                onFailure();
            }
        }

        function parseResource(href, lang, successCallback, failureCallback) {
            var baseURL = href.replace(/[^\/]*$/, '') || './'; function evalString(text) {
                if (text.lastIndexOf('\\') < 0)
                    return text;
                return text.replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\b/g, '\b').replace(/\\f/g, '\f').replace(/\\{/g, '{').replace(/\\}/g, '}').replace(/\\"/g, '"').replace(/\\'/g, "'");
            }

            function parseProperties(text) {
                var dictionary = [];
                var reBlank = /^\s*|\s*$/;
                var reComment = /^\s*#|^\s*$/;
                var reSection = /^\s*\[(.*)\]\s*$/;
                var reImport = /^\s*@import\s+url\((.*)\)\s*$/i;
                var reSplit = /^([^=\s]*)\s*=\s*(.+)$/;

                function parseRawLines(rawText, extendedSyntax) {
                    var entries = rawText.replace(reBlank, '').split(/[\r\n]+/); var currentLang = '*';
                    var genericLang = lang.replace(/-[a-z]+$/i, '');
                    var skipLang = false;
                    var match = '';

                    for (var i = 0; i < entries.length; i++) {
                        var line = entries[i];
                        if (reComment.test(line))
                            continue;
                        if (extendedSyntax) {
                            if (reSection.test(line)) {
                                match = reSection.exec(line);
                                currentLang = match[1];
                                skipLang = (currentLang !== '*') && (currentLang !== lang) && (currentLang !== genericLang);
                                continue;
                            }
                            else if (skipLang) {
                                continue;
                            }
                            if (reImport.test(line)) {
                                match = reImport.exec(line);
                                loadImport(baseURL + match[1]);
                            }
                        }
                        var tmp = line.match(reSplit);
                        if (tmp && tmp.length == 3) {
                            dictionary[tmp[1]] = evalString(tmp[2]);
                        }
                    }
                }

                function loadImport(url) {
                    xhrLoadText(url, function (content) {
                        parseRawLines(content, false);
                    }, null, false);
                }

                parseRawLines(text, true); return dictionary;
            }

            xhrLoadText(href, function (response) {
                gTextData += response;
                var data = parseProperties(response);
                for (var key in data) {
                    var id, prop, index = key.lastIndexOf('.');
                    if (index > 0) {
                        id = key.substring(0, index);
                        prop = key.substr(index + 1);
                    }
                    else {
                        id = key;
                        prop = gTextProp;
                    }
                    if (!gL10nData[id]) {
                        gL10nData[id] = {};
                    }
                    gL10nData[id][prop] = data[key];
                }

                if (successCallback) { successCallback(); }

            }, failureCallback, gAsyncResourceLoading);
        };

        function loadLocale(lang, callback) {
            callback = callback || function _callback() { };
            clear();
            gLanguage = lang;
            var langLinks = getL10nResourceLinks();
            var langCount = langLinks.length;
            if (langCount == 0) {
                var dict = getL10nDictionary();
                if (dict && dict.locales && dict.default_locale) {
                    consoleLog('using the embedded JSON directory, early way out');
                    gL10nData = dict.locales[lang] || dict.locales[dict.default_locale];
                    callback();
                }
                else {
                    consoleLog('no resource to load, early way out');
                }
                fireL10nReadyEvent(lang);
                gReadyState = 'complete';
                return;
            }

            var onResourceLoaded = null;
            var gResourceCount = 0;
            onResourceLoaded = function () {
                gResourceCount++;
                if (gResourceCount >= langCount) {
                    callback();
                    fireL10nReadyEvent(lang);
                    gReadyState = 'complete';
                }
            };

            function l10nResourceLink(link) {
                var href = link.href;
                var type = link.type;
                this.load = function (lang, callback) {
                    var applied = lang;
                    parseResource(href, lang, callback, function () { consoleWarn(href + ' not found.'); applied = ''; });
                    return applied;
                };
            }

            for (var i = 0; i < langCount; i++) 
                { 
                    var resource = new l10nResourceLink(langLinks[i]); 
                    var rv = resource.load(lang, onResourceLoaded); 
                    if (rv != lang) 
                        { 
                            consoleWarn('"' + lang + '" resource not found'); 
                            gLanguage = ''; 
                        } 
                }
        }

        function clear() 
        { 
            gL10nData = {}; 
            gTextData = ''; 
            gLanguage = ''; 
        }

        function getPluralRules(lang) {

            var locales2rules = 
                { 
                    'af': 3, 'ak': 4, 'am': 4,
                    'ar': 1, 'asa': 3, 'az': 0, 
                    'be': 11, 'bem': 3, 'bez': 3, 
                    'bg': 3, 'bh': 4, 'bm': 0, 'bn': 3, 
                    'bo': 0, 'br': 20, 'brx': 3, 'bs': 11, 
                    'ca': 3, 'cgg': 3, 'chr': 3, 'cs': 12, 
                    'cy': 17, 'da': 3, 'de': 3, 'dv': 3, 
                    'dz': 0, 'ee': 3, 'el': 3, 'en': 3, 
                    'eo': 3, 'es': 3, 'et': 3, 'eu': 3, 
                    'fa': 0, 'ff': 5, 'fi': 3, 'fil': 4, 
                    'fo': 3, 'fr': 5, 'fur': 3, 'fy': 3, 
                    'ga': 8, 'gd': 24, 'gl': 3, 'gsw': 3, 
                    'gu': 3, 'guw': 4, 'gv': 23, 'ha': 3, 
                    'haw': 3, 'he': 2, 'hi': 4, 'hr': 11, 
                    'hu': 0, 'id': 0, 'ig': 0, 'ii': 0, 
                    'is': 3, 'it': 3, 'iu': 7, 'ja': 0, 
                    'jmc': 3, 'jv': 0, 'ka': 0, 'kab': 5, 
                    'kaj': 3, 'kcg': 3, 'kde': 0, 'kea': 0, 
                    'kk': 3, 'kl': 3, 'km': 0, 'kn': 0, 
                    'ko': 0, 'ksb': 3, 'ksh': 21, 'ku': 3, 
                    'kw': 7, 'lag': 18, 'lb': 3, 'lg': 3, 
                    'ln': 4, 'lo': 0, 'lt': 10, 'lv': 6, 
                    'mas': 3, 'mg': 4, 'mk': 16, 'ml': 3, 
                    'mn': 3, 'mo': 9, 'mr': 3, 'ms': 0, 
                    'mt': 15, 'my': 0, 'nah': 3, 'naq': 7, 
                    'nb': 3, 'nd': 3, 'ne': 3, 'nl': 3, 
                    'nn': 3, 'no': 3, 'nr': 3, 'nso': 4, 
                    'ny': 3, 'nyn': 3, 'om': 3, 'or': 3, 
                    'pa': 3, 'pap': 3, 'pl': 13, 'ps': 3, 
                    'pt': 3, 'rm': 3, 'ro': 9, 'rof': 3, 
                    'ru': 11, 'rwk': 3, 'sah': 0, 'saq': 3, 
                    'se': 7, 'seh': 3, 'ses': 0, 'sg': 0, 
                    'sh': 11, 'shi': 19, 'sk': 12, 'sl': 14, 
                    'sma': 7, 'smi': 7, 'smj': 7, 'smn': 7, 
                    'sms': 7, 'sn': 3, 'so': 3, 'sq': 3, 
                    'sr': 11, 'ss': 3, 'ssy': 3, 'st': 3, 
                    'sv': 3, 'sw': 3, 'syr': 3, 'ta': 3, 
                    'te': 3, 'teo': 3, 'th': 0, 'ti': 4, 
                    'tig': 3, 'tk': 3, 'tl': 4, 'tn': 3, 
                    'to': 0, 'tr': 0, 'ts': 3, 'tzm': 22, 
                    'uk': 11, 'ur': 3, 've': 3, 'vi': 0, 
                    'vun': 3, 'wa': 4, 'wae': 3, 'wo': 0, 
                    'xh': 3, 'xog': 3, 'yo': 0, 'zh': 0, 'zu': 3 
                };

                function isIn(n, list) 
                { 
                    return list.indexOf(n) !== -1; 
                }

                function isBetween(n, start, end) 
                { 
                    return start <= n && n <= end; 
                }

                var pluralRules = 
                {
                    '0': function (n) 
                        { 
                            return 'other'; 
                        }, 
                    '1': function (n) 
                        {
                            if ((isBetween((n % 100), 3, 10)))
                                return 'few'; 
                            if (n === 0)
                                return 'zero';
                            if ((isBetween((n % 100), 11, 99)))
                                return 'many'; 
                            if (n == 2)
                                return 'two'; 
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '2': function (n) 
                        {
                            if (n !== 0 && (n % 10) === 0)
                                return 'many'; 
                            if (n == 2)
                                return 'two'; 
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '3': function (n) 
                        {
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '4': function (n) 
                        {
                            if ((isBetween(n, 0, 1)))
                                return 'one'; 
                            return 'other';
                        }, 
                    '5': function (n) 
                        {
                            if ((isBetween(n, 0, 2)) && n != 2)
                                return 'one'; 
                            return 'other';
                        }, 
                    '6': function (n) 
                        {
                            if (n === 0)
                                return 'zero'; 
                            if ((n % 10) == 1 && (n % 100) != 11)
                                return 'one'; 
                            return 'other';
                        }, 
                    '7': function (n) 
                        {
                            if (n == 2)
                                return 'two'; 
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        },
                    '8': function (n) 
                        {
                            if ((isBetween(n, 3, 6)))
                                return 'few'; 
                            if ((isBetween(n, 7, 10)))
                                return 'many'; 
                            if (n == 2)
                                return 'two'; 
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '9': function (n) 
                        {
                            if (n === 0 || n != 1 && (isBetween((n % 100), 1, 19)))
                                return 'few'; 
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '10': function (n) 
                        {
                            if ((isBetween((n % 10), 2, 9)) && !(isBetween((n % 100), 11, 19)))
                                return 'few'; 
                            if ((n % 10) == 1 && !(isBetween((n % 100), 11, 19)))
                                return 'one'; 
                            return 'other';
                        }, 
                    '11': function (n) 
                        {
                            if ((isBetween((n % 10), 2, 4)) && !(isBetween((n % 100), 12, 14)))
                                return 'few'; 
                            if ((n % 10) === 0 || (isBetween((n % 10), 5, 9)) || (isBetween((n % 100), 11, 14)))
                                return 'many'; 
                            if ((n % 10) == 1 && (n % 100) != 11)
                                return 'one'; 
                            return 'other';
                        }, 
                    '12': function (n) 
                        {
                            if ((isBetween(n, 2, 4)))
                                return 'few'; 
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '13': function (n) 
                        {
                            if ((isBetween((n % 10), 2, 4)) && !(isBetween((n % 100), 12, 14)))
                                return 'few'; 
                            if (n != 1 && (isBetween((n % 10), 0, 1)) || (isBetween((n % 10), 5, 9)) || (isBetween((n % 100), 12, 14)))
                                return 'many'; 
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '14': function (n) 
                        {
                            if ((isBetween((n % 100), 3, 4)))
                                return 'few'; 
                            if ((n % 100) == 2)
                                return 'two'; 
                            if ((n % 100) == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '15': function (n) 
                        {
                            if (n === 0 || (isBetween((n % 100), 2, 10)))
                                return 'few'; 
                            if ((isBetween((n % 100), 11, 19)))
                                return 'many'; 
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '16': function (n) 
                        {
                            if ((n % 10) == 1 && n != 11)
                                return 'one'; 
                            return 'other';
                        }, 
                    '17': function (n) 
                        {
                            if (n == 3)
                                return 'few'; 
                            if (n === 0)
                                return 'zero'; 
                            if (n == 6)
                                return 'many';
                            if (n == 2)
                                return 'two'; 
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '18': function (n) 
                        {
                            if (n === 0)
                                return 'zero'; 
                            if ((isBetween(n, 0, 2)) && n !== 0 && n != 2)
                                return 'one'; 
                            return 'other';
                        }, 
                    '19': function (n) 
                        {
                            if ((isBetween(n, 2, 10)))
                                return 'few'; 
                            if ((isBetween(n, 0, 1)))
                                return 'one'; 
                            return 'other';
                        }, 
                    '20': function (n) 
                        {
                            if ((isBetween((n % 10), 3, 4) || ((n % 10) == 9)) && !(isBetween((n % 100), 10, 19) || isBetween((n % 100), 70, 79) || isBetween((n % 100), 90, 99)))
                                return 'few'; 
                            if ((n % 1000000) === 0 && n !== 0)
                                return 'many'; 
                            if ((n % 10) == 2 && !isIn((n % 100), [12, 72, 92]))
                                return 'two'; 
                            if ((n % 10) == 1 && !isIn((n % 100), [11, 71, 91]))
                                return 'one'; 
                            return 'other';
                        }, 
                    '21': function (n) 
                        {
                            if (n === 0)
                                return 'zero'; 
                            if (n == 1)
                                return 'one'; 
                            return 'other';
                        }, 
                    '22': function (n) 
                        {
                            if ((isBetween(n, 0, 1)) || (isBetween(n, 11, 99)))
                                return 'one'; 
                            return 'other';
                        }, 
                    '23': function (n) 
                        {
                            if ((isBetween((n % 10), 1, 2)) || (n % 20) === 0)
                                return 'one'; 
                            return 'other';
                        }, 
                    '24': function (n) 
                        {
                            if ((isBetween(n, 3, 10) || isBetween(n, 13, 19)))
                                return 'few'; 
                            if (isIn(n, [2, 12]))
                                return 'two'; 
                            if (isIn(n, [1, 11]))
                                return 'one'; 
                            return 'other';
                        }
                };
                var index = locales2rules[lang.replace(/-.*$/, '')]; 
                if (!(index in pluralRules)) 
                    { 
                        consoleWarn('plural form unknown for [' + lang + ']'); 
                        return function () { return 'other'; }; 
                    }
                return pluralRules[index];
            }

            gMacros.plural = function (str, param, key, prop) 
                {
                    var n = parseFloat(param); if (isNaN(n))
                        return str; 
                    if (prop != gTextProp)
                        return str; 
                    if (!gMacros._pluralRules) 
                        { 
                            gMacros._pluralRules = getPluralRules(gLanguage); 
                        }
                    var index = '[' + gMacros._pluralRules(n) + ']'; 
                    if (n === 0 && (key + '[zero]') in gL10nData) 
                        { 
                            str = gL10nData[key + '[zero]'][prop]; 
                        } 
                    else if (n == 1 && (key + '[one]') in gL10nData) 
                        { 
                            str = gL10nData[key + '[one]'][prop]; 
                        } 
                    else if (n == 2 && (key + '[two]') in gL10nData) 
                        { 
                            str = gL10nData[key + '[two]'][prop]; 
                        } 
                    else if ((key + index) in gL10nData) 
                        { 
                            str = gL10nData[key + index][prop]; 
                        } 
                    else if ((key + '[other]') in gL10nData) 
                        { 
                            str = gL10nData[key + '[other]'][prop]; 
                        }
                    return str;
                };

            function getL10nData(key, args) 
                {
                    var data = gL10nData[key]; 
                    if (!data) 
                        { 
                            consoleWarn('#' + key + ' is undefined.'); 
                        }
                    var rv = {}; 
                    for (var prop in data) 
                        { 
                            var str = data[prop]; 
                            str = substIndexes(str, args, key, prop); 
                            str = substArguments(str, args, key); 
                            rv[prop] = str; 
                        }
                    return rv;
                } 

            function substIndexes(str, args, key, prop) 
                {
                    var reIndex = /\{\[\s*([a-zA-Z]+)\(([a-zA-Z]+)\)\s*\]\}/; 
                    var reMatch = reIndex.exec(str); 
                    if (!reMatch || !reMatch.length)
                        return str; 
                    var macroName = reMatch[1];
                    var paramName = reMatch[2]; 
                    var param; 
                    if (args && paramName in args) 
                        { 
                            param = args[paramName]; 
                        } 
                    else if (paramName in gL10nData) 
                        { 
                            param = gL10nData[paramName]; 
                        }
                    if (macroName in gMacros) 
                        { 
                            var macro = gMacros[macroName]; 
                            str = macro(str, param, key, prop); 
                        }
                    return str;
                }

            function substArguments(str, args, key) 
                {
                    var reArgs = /\{\{\s*(.+?)\s*\}\}/; 
                    var match = reArgs.exec(str); 
                    while (match)
                        {
                            if (!match || match.length < 2)
                                return str; 
                            var arg = match[1]; 
                            var sub = ''; 
                            if (args && arg in args) 
                                { 
                                    sub = args[arg]; 
                                } 
                            else if (arg in gL10nData) 
                                { 
                                    sub = gL10nData[arg][gTextProp]; 
                                } 
                            else 
                                { 
                                    consoleLog('argument {{' + arg + '}} for #' + key + ' is undefined.'); 
                                    return str; 
                                }
                            str = str.substring(0, match.index) + sub + str.substr(match.index + match[0].length); 
                            match = reArgs.exec(str);
                        }
                    return str;
                }

            function translateElement(element) 
                {
                    var l10n = getL10nAttributes(element); 
                    if (!l10n.id)
                        return; 
                    var data = getL10nData(l10n.id, l10n.args); 
                    if (!data) 
                        { 
                            consoleWarn('#' + l10n.id + ' is undefined.'); 
                            return; 
                        }
                    if (data[gTextProp]) 
                        {
                            if (getChildElementCount(element) === 0) 
                                { 
                                    element[gTextProp] = data[gTextProp]; 
                                } 
                            else 
                                {
                                    var children = element.childNodes; 
                                    var found = false; 
                                    for (var i = 0, l = children.length; i < l; i++) 
                                        { 
                                            if (children[i].nodeType === 3 && /\S/.test(children[i].nodeValue)) 
                                                { 
                                                    if (found) 
                                                        { 
                                                            children[i].nodeValue = ''; 
                                                        } 
                                                    else 
                                                        { 
                                                            children[i].nodeValue = data[gTextProp]; 
                                                            found = true; 
                                                        } 
                                                }
                                        }
                                    if (!found) 
                                        { 
                                            var textNode = document.createTextNode(data[gTextProp]); 
                                            element.insertBefore(textNode, element.firstChild); 
                                        }
                                }
                            delete data[gTextProp];
                        }
                    for (var k in data) { element[k] = data[k]; }
                }

            function getChildElementCount(element) 
                {
                    if (element.children) 
                        { 
                            return element.children.length; 
                        }
                    if (typeof element.childElementCount !== 'undefined') 
                        { 
                            return element.childElementCount; 
                        }
                    var count = 0; for (var i = 0; i < element.childNodes.length; i++) { count += element.nodeType === 1 ? 1 : 0; }
                    return count;
                }
        
            function translateFragment(element) 
                {
                    element = element || document.documentElement; 
                    var children = getTranslatableChildren(element); 
                    var elementCount = children.length; 
                    for (var i = 0; i < elementCount; i++) 
                        { 
                            translateElement(children[i]); 
                        }
                    translateElement(element);
                }
        
            function l10nStartup() 
                { 
                    gReadyState = 'interactive'; 
                    var userLocale = navigator.language || navigator.userLanguage; 
                    consoleLog('loading [' + userLocale + '] resources, ' + (gAsyncResourceLoading ? 'asynchronously.' : 'synchronously.')); 
                    if (document.documentElement.lang === userLocale) 
                        { 
                            loadLocale(userLocale); 
                        } 
                    else 
                        { 
                            loadLocale(userLocale, translateFragment); 
                        } 
                }
                
                if (document.addEventListener) 
                    { 
                        if (document.readyState === 'loading') 
                            { 
                                document.addEventListener('DOMContentLoaded', l10nStartup); 
                            } 
                        else 
                            { 
                                window.setTimeout(l10nStartup); 
                            } 
                    } 
                else if (window.attachEvent) 
                    {
                        if (!window.console) 
                            { 
                                consoleLog = function (message) { }; 
                                consoleWarn = function (message) 
                                    { 
                                        if (gDEBUG) 
                                            { 
                                                alert('[l10n] ' + message);
                                            }
                                    }; 
                            }

                if (!window.XMLHttpRequest) 
                    { 
                        xhrLoadText = function (url, onSuccess, onFailure, asynchronous) 
                        { 
                            onSuccess = onSuccess || function _onSuccess(data) { }; 
                            onFailure = onFailure || function _onFailure() { consoleWarn(url + ' not found.'); }; 
                            var xhr = new ActiveXObject('Microsoft.XMLHTTP'); 
                            xhr.open('GET', url, asynchronous); 
                            xhr.onreadystatechange = function () 
                                { 
                                    if (xhr.readyState == 4) 
                                        { 
                                            if (xhr.status == 200) 
                                                { 
                                                    onSuccess(xhr.responseText); 
                                                } 
                                            else 
                                                { 
                                                    onFailure(); 
                                                } 
                                        } 
                                }; 
                            xhr.send(null); 
                        } 
                    }

            if (!window.JSON) 
                {
                    getL10nAttributes = function (element) 
                        {
                            if (!element)
                                return {}; 
                            var l10nId = element.getAttribute('data-l10n-id'), 
                                l10nArgs = element.getAttribute('data-l10n-args'), 
                                args = {}; 
                            if (l10nArgs) 
                                try 
                                    { 
                                        args = eval(l10nArgs); 
                                    } 
                                catch (e) 
                                    { 
                                        consoleWarn('could not parse arguments for #' + l10nId); 
                                    }
                            return { id: l10nId, args: args };
                        };
                }

            if (!document.querySelectorAll) 
                {
                    getTranslatableChildren = function (element) 
                        {
                            if (!element)
                                return []; 
                            var nodes = element.getElementsByTagName('*'), 
                                l10nElements = [],
                                n = nodes.length; 
                            for (var i = 0; i < n; i++) 
                                {
                                    if (nodes[i].getAttribute('data-l10n-id'))
                                        l10nElements.push(nodes[i]);
                                }
                            return l10nElements;
                        }; 
                    getL10nResourceLinks = function () 
                        {
                            var links = document.getElementsByTagName('link'), 
                                l10nLinks = [], 
                                n = links.length; 
                            for (var i = 0; i < n; i++) 
                                {
                                    if (links[i].type == 'application/l10n')
                                    l10nLinks.push(links[i]);
                                }
                            return l10nLinks;
                        };
                }

            if (!window.JSON || !document.querySelectorAll) 
                {
                    getL10nDictionary = function () 
                        {
                            var scripts = document.getElementsByName('script');
                            for (var i = 0; i < scripts.length; i++) 
                                { 
                                    if (scripts[i].type == 'application/l10n') 
                                        { 
                                            return eval(scripts[i].innerHTML); 
                                        } 
                                }
                            return null;
                        };
                }
            
            if (document.createEventObject && !document.createEvent) 
                { 
                    fireL10nReadyEvent = function (lang) { document.documentElement.localized = 1; };
                }
            window.attachEvent('onload', function () { gTextProp = document.body.textContent ? 'textContent' : 'innerText'; l10nStartup(); });
        }
        return {
            get: function (key, args, fallback) 
                {
                    var data = getL10nData(key, args) || fallback; 
                    if (data) 
                        { 
                            return gTextProp in data ? data[gTextProp] : ''; 
                        }
                    return '{{' + key + '}}';
                }, 
            getData: function () 
                { 
                    return gL10nData; 
                }, 
            getText: function () 
                { 
                    return gTextData; 
                }, 
            getLanguage: function () 
                { 
                    return gLanguage; 
                }, 
            setLanguage: function (lang) 
                { 
                    loadLocale(lang, translateFragment); 
                }, 
            getDirection: function () 
                { 
                    var rtlList = ['ar', 'he', 'fa', 'ps', 'ur']; 
                    return (rtlList.indexOf(gLanguage) >= 0) ? 'rtl' : 'ltr'; 
                }, 
            translate: translateFragment, getReadyState: function () 
                { return gReadyState; }, 
            ready: function (callback) 
                { 
                    if (!callback) 
                        { return; } 
                    else if (gReadyState == 'complete' || gReadyState == 'interactive') 
                        { window.setTimeout(callback); } 
                    else if (document.addEventListener) 
                        { document.addEventListener('localized', callback); } 
                    else if (document.attachEvent) 
                        { document.documentElement.attachEvent('onpropertychange', function (e) 
                                { 
                                    if (e.propertyName === 'localized') { callback(); } 
                                }
                            ); 
                        } 
                }
        };
    }
)(window, document); 
if (window._ === undefined) 
    { 
        var _ = document.webL10n.get; 
    }






