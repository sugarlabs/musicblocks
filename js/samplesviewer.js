/*
Copyright (C) 2015 Sam Parkinson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

APIKEY = '3tgTzMXbbw6xEKX7';
EMPTYIMAGE = 'data:image/svg+xml;base64,' + btoa('<svg \
              xmlns="http://www.w3.org/2000/svg" width="320" height="240" \
              viewBox="0 0 320 240"></svg>')

window.server = '/server/';
jQuery.ajax('/server/').error(function () {
    server = 'https://turtle.sugarlabs.org/server/';
});

var LOCAL_PROJECT_TEMPLATE = '\
<li data=\'{data}\' title="{title}" current="{current}"> \
    <img class="thumbnail" src="{img}" /> \
    <div class="options"> \
        <input type="text" value="{title}"/><br/> \
        <img class="open icon" title="{_Open}" alt="{_Open}" src="header-icons/edit.svg" /> \
        <img class="delete icon" title="{_Delete}" alt="{_Delete}" src="header-icons/delete.svg" /> \
        <img class="publish icon" title="{_Publish}" alt="{_Publish}" src="header-icons/publish.svg" /> \
        <img class="download icon" title="{_Download}" alt="{_Download}" src="header-icons/download.svg" /> \
    </div> \
</li>'

var GLOBAL_PROJECT_TEMPLATE = '\
<li url="{url}" title="{title}"> \
    <img class="thumbnail" src="{img}" /> \
    <div class="options"> \
        <span>{title}</span><br/> \
        <img class="download icon" title="{_Download}" alt="{_Download}" src="header-icons/download.svg" /> \
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
    var me = this;

    this.start = function (cb) {
        me.updated = cb;
        me.stop = false;

        this.redoLocalStorageData();
        me.updated();

        this.downloadWorldWideProjects();
    }

    this.downloadWorldWideProjects = function () {
        jQuery.ajax({
            url: server,
            headers: {
                'x-api-key' : APIKEY
            }
        }).done(function (l) {
            me.globalProjects = [];
            me.stop = false;

            var todo = [];
            l.forEach(function (name, i) {
                if (name.indexOf('.b64') !== -1) 	{
                    todo.push(name);
                }
            });

            me.getImages(todo);
        });
    }

    this.getImages = function (todo) {
        if (me.stop === true) {
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

        if (me.globalImagesCache[image] !== undefined) {
            me.globalProjects.push({title: name,
                                    img: me.globalImagesCache[image]});
            me.updated();
            me.getImages(todo);
        } else {
            jQuery.ajax({
  	            url: server + image,
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
                me.globalImagesCache[image] = d;
                me.globalProjects.push({title: name, img: d, url: image});
                me.updated();
                me.getImages(todo);
            });
        }
    }

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
                me.localProjects.unshift(e);
            } else {
                me.localProjects.push(e);
            }
        });
        this.localChanged = true;
    }

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
    }

    this.newProject = function () {
        var name = this.uniqueName('My Project');
        me.prepLoadingProject(name);
        this.controller.sendAllToTrash(true, true);
        me.stop = true;
    }

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

        me.redoLocalStorageData();
    }

    this.delete = function (name) {
        var l = JSON.parse(localStorage.allProjects);
        l.splice(l.indexOf(name), 1);
        localStorage.allProjects = JSON.stringify(l);

        localStorage['SESSIONIMAGE' + name] = undefined;
        localStorage['SESSION' + name] = undefined;

        me.redoLocalStorageData();
        me.updated();
    }

    //Opens up projects in the "On my device" section
    this.open = function (name, data) {
        localStorage.currentProject = name;
        me.controller.sendAllToTrash(false, true);
        me.controller.loadRawProject(data);
        me.stop = true;
    }

    //Adds the project from "Worldwide" to the "On my deivce" 
    //section when download button is clicked
    this.prepLoadingProject = function (name) {
        localStorage.currentProject = name;

        var l = JSON.parse(localStorage.allProjects);
        l.push(name);
        localStorage.allProjects = JSON.stringify(l);
    }

    this.load = function (name) {
        me.prepLoadingProject(name);
        me.controller.sendAllToTrash(false, false);

        jQuery.ajax({
            url: server + name + ".tb",
            headers: {
                'x-api-key' : '3tgTzMXbbw6xEKX7'
            },
            dataType: 'text',
            error: function(XMLHttpRequest, textStatus, errorThrown){
            	jQuery.ajax({
		            url: server + "MusicBlocks_" + name + ".tb",
		            headers: {
		                'x-api-key' : '3tgTzMXbbw6xEKX7'
		            },
		            dataType: 'text',
		        }).done(function (d) {
		            me.controller.loadRawProject(d);
		            me.stop = true;
		        });
            }
        }).done(function (d) {
            me.controller.loadRawProject(d);
            me.stop = true;
        });
    }

    this.publish = function (name, data, image) {
        name = name.replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^`{|}~']/g,
                            '').replace(/ /g, '_');
        name = 'MusicBlocks_'+name;
        httpPost(name + '.tb', data);
        httpPost(name + '.b64', image);
        me.downloadWorldWideProjects();
    }
}

function PlanetView(model, controller) {
    this.model = model;
    this.controller = controller;
    var me = this;  // for future reference

    document.querySelector('.planet .new')
            .addEventListener('click', function () {
        me.model.newProject();
        me.controller.hide();
    });

    document.querySelector('#myOpenFile')
            .addEventListener('change', function(event) {
        me.controller.hide();
    });
    document.querySelector('.planet .open')
            .addEventListener('click', function () {
        document.querySelector('#myOpenFile').focus();
        document.querySelector('#myOpenFile').click();
        window.scroll(0, 0);
    });

    document.querySelector('.planet .back')
            .addEventListener('click', function () {
        me.controller.hide();
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
                    .addEventListener('click', me.open(ele));
                ele.querySelector('.publish')
                    .addEventListener('click', me.publish(ele));
                ele.querySelector('.download')
                   .addEventListener('click', me.download(ele));
                ele.querySelector('.delete')
                   .addEventListener('click', me.delete(ele));
                ele.querySelector('input')
                   .addEventListener('change', me.input(ele));
                ele.querySelector('.thumbnail')
                   .addEventListener('click', me.open(ele));
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
            ele.addEventListener('click', me.load(ele))
        });
    }

    this.load = function (ele) {
        return function () {
            document.querySelector('#loading-image-container')
                    .style.display = '';

            me.model.load(ele.attributes.title.value);
            me.controller.hide();
        }
    }

    this.publish = function (ele) {
        return function () {
            document.querySelector('#loading-image-container')
                    .style.display = '';
            me.model.publish(ele.attributes.title.value,
                             ele.attributes.data.value,
                             ele.querySelector('img').src);
            document.querySelector('#loading-image-container')
                    .style.display = 'none';
        }
    }

    this.download = function (ele) {
        return function () {
            download(ele.attributes.title.value + '.tb',
                'data:text/plain;charset=utf-8,' + ele.attributes.data.value);
        }
    }

    this.open = function (ele) {
        return function () {
            document.getElementById('matrix').style.visibility = localStorage.getItem("isMatrixHidden");
            if (ele.attributes.current.value === 'true') {
                me.controller.hide();
                return;
            }
            
            me.model.open(ele.attributes.title.value,
                          ele.attributes.data.value);
            me.controller.hide();
        }
    }

    this.delete = function (ele) {
        return function () {
            var title = ele.attributes.title.value;
            me.model.delete(title);
        }
    }

    this.input = function (ele) {
        return function () {
            var newName = ele.querySelector('input').value;
            var oldName = ele.attributes.title.value;
            var current = ele.attributes.current.value === 'true';
            me.model.renameProject(oldName, newName, current);
            ele.attributes.title.value = newName;
        }
    }
}

// A viewer for sample projects
function SamplesViewer(canvas, stage, refreshCanvas, load, loadRawProject, trash) {
    this.stage = stage;
    this.sendAllToTrash = trash;
    this.loadProject = load;
    this.loadRawProject = loadRawProject;
    var me = this;  // for future reference

    // i18n for section titles
    document.querySelector("#planetTitle").innerHTML = _("Planet");
    document.querySelector("#planetMyDevice").innerHTML = _("On my device");
    document.querySelector("#planetWorldwide").innerHTML = _("Worldwide");

    this.model = new PlanetModel(this);
    this.view = new PlanetView(this.model, this);

    this.setServer = function(server) {
        this.server = server;
    }

    this.hide = function() {
        document.querySelector('.planet').style.display = 'none';
        document.querySelector('body').classList.remove('samples-shown');
        document.querySelector('.canvasHolder').classList.remove('hide');
        document.querySelector('#theme-color').content = platformColor.header;
        me.stage.enableDOMEvents(true);
        window.scroll(0, 0);
    }

    this.show = function() {
        document.querySelector('.planet').style.display = '';
        document.querySelector('body').classList.add('samples-shown');
        document.querySelector('.canvasHolder').classList.add('hide');
        document.querySelector('#theme-color').content = '#8bc34a';
        setTimeout(function () {
            // Time to release the mouse
            me.stage.enableDOMEvents(false);
        }, 250);
        window.scroll(0, 0);

        this.model.start(this.view.update);
        return true;
    }
}
function validateImageData(d) {
    if(d === undefined) {
        return false;
    }
    
    if(d.indexOf('data:image') !== 0){
        return false;
    }
    else {
        var data = d.split(",");
        if(data[1].length == 0){
            return false;
        }
    }
    return true;
}
