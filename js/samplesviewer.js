// Copyright (C) 2015 Sam Parkinson
// Copyright (C) 2016 Walter Bender

// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const APIKEY = '3tgTzMXbbw6xEKX7';
const EMPTYIMAGE = 'data:image/svg+xml;base64,' + btoa('<svg \
              xmlns="http://www.w3.org/2000/svg" width="320" height="240" \
              viewBox="0 0 320 240"></svg>')

const SERVER = 'https://turtle.sugarlabs.org/server/';
window.server = SERVER; 'https://turtle.sugarlabs.org/server/'; // '/server/';

const LOCAL_PROJECT_TEMPLATE = '\
<li data=\'{data}\' title="{title}" current="{current}"> \
    <img class="thumbnail" src="{img}" /> \
    <div class="options"> \
        <input type="text" value="{title}"/><br/> \
        <img class="open icon" title="' + _('Open') + '" alt="' + _('Open') + '" src="header-icons/edit.svg" /> \
        <img class="delete icon" title="' + _('Delete') + '" alt="' + _('Delete') + '" src="header-icons/delete.svg" /> \
        <img class="publish icon" title="' + _('Publish') + '" alt="' + _('Publish') + '" src="header-icons/publish.svg" /> \
        <img class="download icon" title="' + _('Download') + '" alt="' + _('Download') + '" src="header-icons/download.svg" /> \
    </div> \
</li>'

const GLOBAL_PROJECT_TEMPLATE = '\
<li url="{url}" title="{title}"> \
    <img class="thumbnail" src="{img}" /> \
    <div class="options"> \
        <span>{title}</span><br/> \
        <img class="download icon" title="' + _('Download') + '" alt="' + _('Download') + '" src="header-icons/download.svg" /> \
    </div> \
</li>';


function PlanetModel(controller) {
    this.controller = controller;
    this.localProjects = [];
    this.globalProjects = [];
    this.localChanged = false;
    this.globalImagesCache = {};
    this.updated = function () {};
    this.stop = false;
    var model = this;

    if (sugarizerCompatibility.isInsideSugarizer()) {
        storage = sugarizerCompatibility.data;
    } else {
        storage = localStorage;
    }

    this.start = function (cb) {
        model.updated = cb;
        model.stop = false;

        this.redoLocalStorageData();
        model.updated();

        this.downloadWorldWideProjects();
    };

    this.downloadWorldWideProjects = function () {
        jQuery.ajax({
            url: SERVER,
            headers: {
                'x-api-key' : APIKEY
            }
        }).done(function (l) {
            model.globalProjects = [];
            model.stop = false;

            var todo = [];
            l.forEach(function (name, i) {
                if (name.indexOf('.b64') !== -1) 	{
                    todo.push(name);
                }
            });

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
        var mbcheck=0;
        if(name.slice(0, 'MusicBlocks_'.length) === 'MusicBlocks_'){
        	name = name.substring('MusicBlocks_'.length);
        	mbcheck = 1;
        }

        if (model.globalImagesCache[image] !== undefined) {
            model.globalProjects.push({title: name,
                                    img: model.globalImagesCache[image]});
            model.updated();
            model.getImages(todo);
        } else {
            jQuery.ajax({
  	            url: SERVER + image,
                headers: {
                    'x-api-key' : '3tgTzMXbbw6xEKX7'
                },
                dataType: 'text'
            }).done(function (d) {
                if(!validateImageData(d)){
                    d = EMPTYIMAGE;
                }
                if(mbcheck) 
                	d = 'images/planetgraphic.png';
                model.globalImagesCache[image] = d;
                model.globalProjects.push({title: name, img: d, url: image});
                model.updated();
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
                img = EMPTYIMAGE;
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

        localStorage['SESSIONIMAGE' + newName] =
            localStorage['SESSIONIMAGE' + oldName];
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
            error: function(XMLHttpRequest, textStatus, errorThrown){
            	jQuery.ajax({
		            url: SERVER + 'MusicBlocks_' + name + '.tb',
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

    this.publish = function (name, data, image) {
        // Show busy cursor.
        document.body.style.cursor = 'wait';

        setTimeout(function () {
            name = name.replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^`{|}~']/g, '').replace(/ /g, '_');
            name = 'MusicBlocks_'+name;
            httpPost(name + '.tb', data);
            httpPost(name + '.b64', image);
            model.downloadWorldWideProjects();

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

        if (model.localChanged) {
            html = '';
            model.localProjects.forEach(function (project, i) {
                html = html + format(LOCAL_PROJECT_TEMPLATE, project);
            });

            document.querySelector('.planet .content.l').innerHTML = html;

            var eles = document.querySelectorAll('.planet .content.l li');
            Array.prototype.forEach.call(eles, function (ele, i) {
                ele.querySelector('.open')
                    .addEventListener('click', planet.open(ele));
                ele.querySelector('.publish')
                    .addEventListener('click', planet.publish(ele));
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

        html = '';
        model.globalProjects.forEach(function (project, i) {
            html += format(GLOBAL_PROJECT_TEMPLATE, project);
        });

        document.querySelector('.planet .content.w').innerHTML = html;

        var eles = document.querySelectorAll('.planet .content.w li');
        Array.prototype.forEach.call(eles, function (ele, i) {
            ele.addEventListener('click', planet.load(ele))
        });
    };

    this.load = function (ele) {
        return function () {
            document.querySelector('#loading-image-container')
                    .style.display = '';

            planet.model.load(ele.attributes.title.value);
            planet.controller.hide();
        }
    };

    this.publish = function (ele) {
        return function () {
            document.querySelector('#loading-image-container')
                    .style.display = '';
            planet.model.publish(ele.attributes.title.value,
                             ele.attributes.data.value,
                             ele.querySelector('img').src);
            document.querySelector('#loading-image-container')
                    .style.display = 'none';
        }
    };

    this.download = function (ele) {
        return function () {
            download(ele.attributes.title.value + '.tb',
                'data:text/plain;charset=utf-8,' + ele.attributes.data.value);
        }
    };

    this.open = function (ele) {
        return function () {
            document.getElementById('pitchtimematrix').style.visibility = localStorage.getItem('isMatrixHidden');
            document.getElementById('statusmatrix').style.visibility = localStorage.getItem('isStatusHidden');
            document.getElementById('pitchdrummatrix').style.visibility = localStorage.getItem('isPitchDrumMatrixHidden');
            document.getElementById('rulerbody').style.visibility = localStorage.getItem('isRhythmRulerHidden'); 
            document.getElementById('modewidget').style.visibility = localStorage.getItem('isModeWidgetHidden');

            if (ele.attributes.current.value === 'true') {
                planet.controller.hide();
                return;
            }
            
            planet.model.open(ele.attributes.title.value,
                          ele.attributes.data.value);
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
function SamplesViewer(canvas, stage, refreshCanvas, load, loadRawProject, trash) {
    this.stage = stage;
    this.sendAllToTrash = trash;
    this.loadProject = load;
    this.loadRawProject = loadRawProject;
    var samples = this;  // for future reference

    // i18n for section titles
    document.querySelector('#planetTitle').innerHTML = _('Planet');
    document.querySelector('#planetMyDevice').innerHTML = _('On my device');
    document.querySelector('#planetWorldwide').innerHTML = _('Worldwide');

    this.model = new PlanetModel(this);
    this.view = new PlanetView(this.model, this);

    this.setServer = function(server) {
        this.server = server;
    };

    this.hide = function() {
        document.querySelector('.planet').style.display = 'none';
        document.querySelector('body').classList.remove('samples-shown');
        document.querySelector('.canvasHolder').classList.remove('hide');
        document.querySelector('#theme-color').content = platformColor.header;
        samples.stage.enableDOMEvents(true);
        window.scroll(0, 0);
    };

    this.show = function() {
        document.querySelector('.planet').style.display = '';
        document.querySelector('body').classList.add('samples-shown');
        document.querySelector('.canvasHolder').classList.add('hide');
        document.querySelector('#theme-color').content = '#8bc34a';
        setTimeout(function () {
            // Time to release the mouse
            samples.stage.enableDOMEvents(false);
        }, 250);
        window.scroll(0, 0);

        this.model.start(this.view.update);
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
