// Copyright (C) 2015 Sam Parkinson
// Copyright (C) 2016-17 Walter Bender

// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const MUSICBLOCKSPREFIX = 'MusicBlocks_';

const APIKEY = '3tgTzMXbbw6xEKX7';
const EMPTYIMAGE = 'data:image/svg+xml;base64,' + btoa('<svg \
              xmlns="http://www.w3.org/2000/svg" width="320" height="240" \
              viewBox="0 0 320 240"></svg>')

const SERVER = 'https://turtle.sugarlabs.org/server/';
window.server = SERVER; 'https://turtle.sugarlabs.org/server/'; // '/server/';

//{NAME} will be replaced with project name
if (_THIS_IS_MUSIC_BLOCKS_) {
    var SHAREURL = 'https://walterbender.github.io/musicblocks/index.html?file={name}&run=True';
} else {
    var SHAREURL = 'https://walterbender.github.io/turtleblocksjs/index.html?file={name}&run=True';
}

const NAMESUBTEXT = '{name}';

const LOCAL_PROJECT_STYLE ='\
<style> \
.shareurlspan { \
    position: relative; \
} \
.shareurlspan .shareurltext { \
    visibility: hidden; \
    background-color: black; \
    color: #fff; \
    text-align: center; \
    padding: 10px; \
    margin-top; 5px; \
    border-radius: 6px; \
    position: absolute; \
    z-index: 1; \
    text-align: left; \
} \
.shareurltext{ \
    top: 25px; \
    left: -200px; \
    visibility: hidden; \
} \
.tooltiptriangle{ \
    position: absolute; \
    visibility: hidden; \
    top: 15px; \
    left: 0px; \
    width: 0; \
    height: 0; \
    border-style: solid; \
    border-width: 0 15px 15px 15px; \
    border-color: transparent transparent black transparent; \
} \
</style>';

//style block is for the tooltip. _NUM_ will be replaced with a unique number
const LOCAL_PROJECT_TEMPLATE ='\
<li data=\'{data}\' title="{title}" current="{current}"> \
    <img class="thumbnail" src="{img}" /> \
    <div class="options"> \
        <input type="text" value="{title}"/><br/> \
        <img class="open icon" title="' + _('Open') + '" alt="' + _('Open') + '" src="header-icons/edit.svg" /> \
        <img class="delete icon" title="' + _('Delete') + '" alt="' + _('Delete') + '" src="header-icons/delete.svg" /> \
        <img class="publish icon" title="' + _('Publish') + '" alt="' + _('Publish') + '" src="header-icons/publish.svg" /> \
        <span class="shareurlspan"> \
        <img class="share icon" title="' + _('Share') + '" alt="' + _('Share') + '" src="header-icons/share.svg" /> \
        <div class="tooltiptriangle" id="shareurltri_NUM_"></div> \
        <div class="shareurltext" id="shareurldiv_NUM_"> \
            Copy the link to share your project:\
            <input type="text" name="shareurl" id="shareurlbox_NUM_" value="url here" style="margin-top:5px;width: 350px;text-align:left;" onblur="document.getElementById(\'shareurldiv_NUM_\').style.visibility = \'hidden\';document.getElementById(\'shareurlbox_NUM_\').style.visibility = \'hidden\';document.getElementById(\'shareurltri_NUM_\').style.visibility = \'hidden\';"/> \
        </div> \
        </span> \
        <img class="download icon" title="' + _('Download') + '" alt="' + _('Download') + '" src="header-icons/download.svg" /> \
    </div> \
</li>'

const GLOBAL_PROJECT_TEMPLATE = '\
<img class="thumbnail" src="{img}" /> \
<div class="options"> \
    <span>{title}</span><br/> \
    <span class="shareurlspan"> \
    <img class="share icon" title="' + _('Share') + '" alt="' + _('Share') + '" src="header-icons/share.svg" /> \
    <div class="tooltiptriangle" id="plshareurltri_NUM_"></div> \
    <div class="shareurltext" id="plshareurldiv_NUM_"> \
        Copy the link to share your project:\
        <input type="text" name="shareurl" id="plshareurlbox_NUM_" value="url here" style="margin-top:5px;width: 350px;text-align:left;" onblur="document.getElementById(\'plshareurldiv_NUM_\').style.visibility = \'hidden\';document.getElementById(\'plshareurlbox_NUM_\').style.visibility = \'hidden\';document.getElementById(\'plshareurltri_NUM_\').style.visibility = \'hidden\';"/> \
    </div> \
    </span> \
    <img class="download icon" title="' + _('Download') + '" alt="' + _('Download') + '" src="header-icons/download.svg" /> \
</div>';


function PlanetModel(controller) {
    this.controller = controller;
    this.localProjects = [];
    this.globalProjects = [];
    this.localChanged = false;
    this.globalImagesCache = {};
    this.updated = function () {};
    this.addGlobalElement = function () {};
    this.stop = false;
    this.count = 0;
    var model = this;

    if (sugarizerCompatibility.isInsideSugarizer()) {
        storage = sugarizerCompatibility.data;
    } else {
        storage = localStorage;
    }

    this.start = function (cb,glo) {
        model.updated = cb;
        model.addGlobalElement = glo;
        model.stop = false;
        var myNode = document.querySelector('.planet .content.w');
        while (myNode.firstChild) {
            myNode.removeChild(myNode.firstChild);
        } 
        this.redoLocalStorageData();
        model.updated();
        this.downloadWorldWideProjects();
    };

    this.downloadWorldWideProjects = function () {
        jQuery.ajax({
            url: SERVER,
            headers: {
                'x-api-key': APIKEY
            }
        }).done(function (l) {
            model.globalProjects = [];
            model.stop = false;

            var todo = [];
            l.forEach(function (name, i) {
                if (name.indexOf('.b64') !== -1) {
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        todo.push(name);
                    } else if (!(name.slice(0, MUSICBLOCKSPREFIX.length) == MUSICBLOCKSPREFIX)) {
                        todo.push(name);
                    }
                }
            });

            model.count = 0;
            model.getImages(todo);
        });
    };

    this.getImages = function (todo) {
        if (model.stop === true) {
            return;
        }

        var image = todo.pop();
        if (image === undefined) {
            return;
        }

        var name = image.replace('.b64', '');

        var mbcheck = false;
        if (_THIS_IS_MUSIC_BLOCKS_) {
            if (name.slice(0, MUSICBLOCKSPREFIX.length) === MUSICBLOCKSPREFIX){
                name = name.substring(MUSICBLOCKSPREFIX.length);
                mbcheck = true;
            }
        }

        if (model.globalImagesCache[image] !== undefined) {
            model.globalProjects.push({title: name, img: model.globalImagesCache[image], musicblocks: mbcheck});
            model.addGlobalElement(model.globalProjects[model.globalProjects.length-1], model.count);
            model.count++;
            model.getImages(todo);
        } else {
            jQuery.ajax({
                  url: SERVER + image,
                headers: {
                    'x-api-key' : '3tgTzMXbbw6xEKX7'
                },
                dataType: 'text'
            }).done(function (d) {
                if (!validateImageData(d)) {
                    d = 'images/planetgraphic.png'; // EMPTYIMAGE;
                }

                if (mbcheck) {
                    d = 'images/planetgraphic.png';
                }

                model.globalImagesCache[image] = d;
                model.globalProjects.push({title: name, img: d, url: image, musicblocks: mbcheck});
                model.addGlobalElement(model.globalProjects[model.globalProjects.length-1], model.count);
                model.count++;
                model.getImages(todo);
            });
        }
    };

    this.redoLocalStorageData = function () {
        this.localProjects = [];
        var l = JSON.parse(localStorage.allProjects);
        l.forEach(function (p, i) {
            var img = localStorage['SESSIONIMAGE' + p];
            if (img === 'undefined') {
                img = 'images/planetgraphic.png'; // EMPTYIMAGE;
            }

            var e = {
                title: p,
                img: img,
                data: localStorage['SESSION' + p],
                current: p === localStorage.currentProject
            }

            if (e.current) {
                model.localProjects.unshift(e);
            } else {
                model.localProjects.push(e);
            }
        });
        this.localChanged = true;
    };

    this.uniqueName = function (base) {
        var l = JSON.parse(localStorage.allProjects);
        if (l.indexOf(base) === -1) {
            return base;
        }

        var i = 1;
        while (true) {
            var name = base + ' '  + i;
            if (l.indexOf(name) === -1) {
                return name;
            }
            i++;
        }
    };

    this.newProject = function () {
        var name = this.uniqueName('My Project');
        model.prepLoadingProject(name);
        this.controller.sendAllToTrash(true, true);
        model.stop = true;
    };

    this.renameProject = function (oldName, newName, current) {
        if (current) {
            localStorage.currentProject = newName;
        }

        var l = JSON.parse(localStorage.allProjects);
        l[l.indexOf(oldName)] = newName;
        localStorage.allProjects = JSON.stringify(l);

        localStorage['SESSIONIMAGE' + newName] = localStorage['SESSIONIMAGE' + oldName];
        localStorage['SESSION' + newName] = localStorage['SESSION' + oldName];

        localStorage['SESSIONIMAGE' + oldName] = undefined;
        localStorage['SESSION' + oldName] = undefined;

        model.redoLocalStorageData();
    };

    this.delete = function (name) {
        var l = JSON.parse(localStorage.allProjects);
        l.splice(l.indexOf(name), 1);
        localStorage.allProjects = JSON.stringify(l);

        localStorage['SESSIONIMAGE' + name] = undefined;
        localStorage['SESSION' + name] = undefined;

        model.redoLocalStorageData();
        model.updated();
    };

    //Opens up projects in the "On my device" section
    this.open = function (name, data) {
        localStorage.currentProject = name;
        model.controller.sendAllToTrash(false, true);
        model.controller.loadRawProject(data);
        model.stop = true;
    };

    //Adds the project from "Worldwide" to the "On my deivce" 
    //section when download button is clicked
    this.prepLoadingProject = function (name) {
        localStorage.currentProject = name;

        var l = JSON.parse(localStorage.allProjects);
        l.push(name);
        localStorage.allProjects = JSON.stringify(l);
    };

    this.load = function (name) {
        model.prepLoadingProject(name);
        model.controller.sendAllToTrash(false, false);

        jQuery.ajax({
            url: SERVER + name + '.tb',
            headers: {
                'x-api-key' : '3tgTzMXbbw6xEKX7'
            },
            dataType: 'text',
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                jQuery.ajax({
                    url: SERVER + MUSICBLOCKSPREFIX + name + '.tb',
                    headers: {
                        'x-api-key' : '3tgTzMXbbw6xEKX7'
                    },
                    dataType: 'text',
                }).done(function (d) {
                    model.controller.loadRawProject(d);
                    model.stop = true;
                });
            }
        }).done(function (d) {
            model.controller.loadRawProject(d);
            model.stop = true;
        });
    };

    this.getPublishableName = function (name) {
        return name.replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^`{|}~']/g, '').replace(/ /g, '_');
    };

    this.publish = function (name, data, image) {
        // Show busy cursor.
        document.body.style.cursor = 'wait';

        setTimeout(function () {
            name = model.getPublishableName(name);
            if (_THIS_IS_MUSIC_BLOCKS_) {
                name = MUSICBLOCKSPREFIX + name;
            }
            httpPost(name + '.tb', data);
            httpPost(name + '.b64', image);
            //TODO: append project at beginning
            //model.downloadWorldWideProjects();

            // Restore default cursor.
            document.body.style.cursor = 'default';
        }, 250);
    };
};


function PlanetView(model, controller) {
    this.model = model;
    this.controller = controller;
    var planet = this;  // for future reference

    document.querySelector('.planet .new')
            .addEventListener('click', function () {
        planet.model.newProject();
        planet.controller.hide();
    });

    document.querySelector('#myOpenFile')
            .addEventListener('change', function(event) {
        planet.controller.hide();
    });

    document.querySelector('.planet .open')
            .addEventListener('click', function () {
        document.querySelector('#myOpenFile').focus();
        document.querySelector('#myOpenFile').click();
        window.scroll(0, 0);
    });

    document.querySelector('.planet .back')
            .addEventListener('click', function () {
        planet.controller.hide();
    });

    this.update = function () {
        // This is werid
        var model = this;

        // console.log('update');
        if (model.localChanged) {
            html = '';
            html = html + LOCAL_PROJECT_STYLE;
            model.localProjects.forEach(function (project, i) {
                html = html + format(LOCAL_PROJECT_TEMPLATE, project).replace(new RegExp('_NUM_', 'g'), i.toString());
                // console.log(i);
                // console.log(project);
            });
            document.querySelector('.planet .content.l').innerHTML = html;

            var eles = document.querySelectorAll('.planet .content.l li');
            Array.prototype.forEach.call(eles, function (ele, i) {
                // console.log(i);
                // console.log(ele);
                ele.querySelector('.open')
                    .addEventListener('click', planet.open(ele));
                ele.querySelector('.publish')
                    .addEventListener('click', planet.publish(ele));
                ele.querySelector('.share')
                    .addEventListener('click', planet.share(ele,i));
                ele.querySelector('.download')
                   .addEventListener('click', planet.download(ele));
                ele.querySelector('.delete')
                   .addEventListener('click', planet.delete(ele));
                ele.querySelector('input')
                   .addEventListener('change', planet.input(ele));
                ele.querySelector('.thumbnail')
                   .addEventListener('click', planet.open(ele));
            });
            model.localChanged = false;
        }
    };

    this.addGlobalElement = function (glob, i){
        var d = document.createElement('li');
        d.setAttribute('url', glob.url);
        d.setAttribute('title', glob.title);
        d.setAttribute('data-ismb', glob.musicblocks.toString());
        html = '';
        html += format(GLOBAL_PROJECT_TEMPLATE, glob).replace(new RegExp('_NUM_', 'g'), i.toString());
        d.innerHTML = html;
        var htmldata = d;
        // console.log(htmldata);
        htmldata.querySelector('.thumbnail')
            .addEventListener('click', planet.load(htmldata));
        htmldata.querySelector('.download')
            .addEventListener('click', planet.load(htmldata));
        htmldata.querySelector('.share')
            .addEventListener('click', planet.planetshare(htmldata,i));
        document.querySelector('.planet .content.w').appendChild(htmldata);
    }

    this.load = function (ele) {
        return function () {
            planet.model.load(ele.attributes.title.value);
            planet.controller.hide();
        }
    };

    this.publish = function (ele) {
        return function () {
            planet.model.publish(ele.attributes.title.value,
                             ele.attributes.data.value,
                             ele.querySelector('img').src);
        }
    };

    this.share = function (ele, i) {
        return function () {
            planet.model.publish(ele.attributes.title.value, ele.attributes.data.value, ele.querySelector('img').src);
            if (_THIS_IS_MUSIC_BLOCKS_) {
                var url = SHAREURL.replace(NAMESUBTEXT, MUSICBLOCKSPREFIX + planet.model.getPublishableName(ele.attributes.title.value) + '.tb');
            } else {
                var url = SHAREURL.replace(NAMESUBTEXT, planet.model.getPublishableName(ele.attributes.title.value) + '.tb');
            }
            var n = i.toString();
            docById('shareurldiv'+n).style.visibility = 'visible';
            docById('shareurlbox'+n).style.visibility = 'visible';
            docById('shareurltri'+n).style.visibility = 'visible';
            docById('shareurlbox'+n).value = url;
            docById('shareurlbox'+n).focus();
            docById('shareurlbox'+n).select();
        };
    };

    this.planetshare = function (ele, i) {
        return function () {
            if (_THIS_IS_MUSIC_BLOCKS_&&ele.attributes["data-ismb"].value=="true") {
                var url = SHAREURL.replace(NAMESUBTEXT, MUSICBLOCKSPREFIX + planet.model.getPublishableName(ele.attributes.title.value) + '.tb');
            } else {
                var url = SHAREURL.replace(NAMESUBTEXT, planet.model.getPublishableName(ele.attributes.title.value) + '.tb');
            }
            var n = i.toString();
            docById('plshareurldiv'+n).style.visibility = 'visible';
            docById('plshareurlbox'+n).style.visibility = 'visible';
            docById('plshareurltri'+n).style.visibility = 'visible';
            docById('plshareurlbox'+n).value = url;
            docById('plshareurlbox'+n).focus();
            docById('plshareurlbox'+n).select();
        };
    };

    this.download = function (ele) {
        return function () {
            download(ele.attributes.title.value + '.tb',
                'data:text/plain;charset=utf-8,' + ele.attributes.data.value);
        }
    };

    this.open = function (ele) {
        return function () {
            docById('statusDiv').style.visibility = localStorage.getItem('isStatusHidden');
            docById('statusButtonsDiv').style.visibility = localStorage.getItem('isStatusHidden');
            docById('statusTableDiv').style.visibility = localStorage.getItem('isStatusHidden');

            if (_THIS_IS_MUSIC_BLOCKS_) {
                docById('ptmDiv').style.visibility = localStorage.getItem('isMatrixHidden');
                docById('ptmButtonsDiv').style.visibility = localStorage.getItem('isMatrixHidden'); 
                docById('ptmTableDiv').style.visibility = localStorage.getItem('isMatrixHidden'); 
                docById('pscDiv').style.visibility = localStorage.getItem('isStaircaseHidden');
                docById('pscButtonsDiv').style.visibility = localStorage.getItem('isStaircaseHidden'); 
                docById('pscTableDiv').style.visibility = localStorage.getItem('isStaircaseHidden'); 
                docById('timbreDiv').style.visibility = localStorage.getItem('isTimbreHidden');
                docById('timbreButtonsDiv').style.visibility = localStorage.getItem('isTimbreHidden'); 
                docById('timbreTableDiv').style.visibility = localStorage.getItem('isTimbreHidden'); 
                docById('sliderDiv').style.visibility = localStorage.getItem('isSliderHidden');
                docById('sliderButtonsDiv').style.visibility = localStorage.getItem('isSliderHidden');
                docById('sliderTableDiv').style.visibility = localStorage.getItem('isSliderHidden');
                docById('pdmDiv').style.visibility = localStorage.getItem('isPitchDrumMatrixHidden');
                docById('pdmButtonsDiv').style.visibility = localStorage.getItem('isPitchDrumMatrixHidden');
                docById('pdmTableDiv').style.visibility = localStorage.getItem('isPitchDrumMatrixHidden');
                docById('rulerDiv').style.visibility = localStorage.getItem('isRhythmRulerHidden'); 
                docById('rulerButtonsDiv').style.visibility = localStorage.getItem('isRhythmRulerHidden'); 
                docById('rulerTableDiv').style.visibility = localStorage.getItem('isRhythmRulerHidden'); 
                docById('modeDiv').style.visibility = localStorage.getItem('isModeWidgetHidden');
                docById('modeButtonsDiv').style.visibility = localStorage.getItem('isModeWidgetHidden');
                docById('modeTableDiv').style.visibility = localStorage.getItem('isModeWidgetHidden');
                // Don't reopen the tempo widget since we didn't just hide it, but also closed it.
                // docById('tempoDiv').style.visibility = localStorage.getItem('isTempoHidden');
                // docById('tempoButtonsDiv').style.visibility = localStorage.getItem('isTempoHidden');
            }

            if (ele.attributes.current.value === 'true') {
                planet.controller.hide();
                return;
            }
            
            planet.model.open(ele.attributes.title.value, ele.attributes.data.value);
            planet.controller.hide();
        }
    };

    this.delete = function (ele) {
        return function () {
            var title = ele.attributes.title.value;
            planet.model.delete(title);
        }
    };

    this.input = function (ele) {
        return function () {
            var newName = ele.querySelector('input').value;
            var oldName = ele.attributes.title.value;
            var current = ele.attributes.current.value === 'true';
            planet.model.renameProject(oldName, newName, current);
            ele.attributes.title.value = newName;
        }
    };
};


// A viewer for sample projects
function SamplesViewer () {
    this.stage = null;
    this.sendAllToTrash = null;
    this.loadProject = null;
    this.loadRawProject = null;

    this.init = function () {
        this.samples = this;  // for future reference

        // i18n for section titles
        document.querySelector('#planetTitle').innerHTML = _('Planet');
        document.querySelector('#planetMyDevice').innerHTML = _('On my device');
        document.querySelector('#planetWorldwide').innerHTML = _('Worldwide');

        this.model = new PlanetModel(this);
        this.view = new PlanetView(this.model, this);
    }

    this.setClear = function (trash) {
        this.sendAllToTrash = trash;
        return this;
    }

    this.setLoad = function (load) {
        this.loadProject = load;
        return this;
    };

    this.setStage = function (stage) {
        this._stage = stage;
        return this;
    };

    this.setLoadRaw = function (loadRawProject) {
        this.loadRawProject = loadRawProject;
        return this;
    };

    this.setRefreshCanvas = function (refreshCanvas) {
        this._refreshCanvas = refreshCanvas;
        return this;
    };


    this.setServer = function (server) {
        this.server = server;
    };

    this.hide = function () {
        document.querySelector('.planet').style.display = 'none';
        document.querySelector('body').classList.remove('samples-shown');
        document.querySelector('.canvasHolder').classList.remove('hide');
        document.querySelector('#canvas').style.display = '';
        document.querySelector('#theme-color').content = platformColor.header;
        this.samples._stage.enableDOMEvents(true);
        window.scroll(0, 0);
    };

    this.show = function () {
        document.querySelector('.planet').style.display = '';
        document.querySelector('body').classList.add('samples-shown');
        document.querySelector('.canvasHolder').classList.add('hide');
        document.querySelector('#canvas').style.display = 'none';
        document.querySelector('#theme-color').content = '#8bc34a';
        var that = this;

        setTimeout(function () {
            // Time to release the mouse
            that.samples._stage.enableDOMEvents(false);
        }, 250);

        window.scroll(0, 0);

        this.model.start(this.view.update,this.view.addGlobalElement);
        return true;
    };
};


function validateImageData(d) {
    if(d === undefined) {
        return false;
    }
    
    if(d.indexOf('data:image') !== 0){
        return false;
    } else {
        var data = d.split(',');
        if(data[1].length == 0){
            return false;
        }
    }
    return true;
};
