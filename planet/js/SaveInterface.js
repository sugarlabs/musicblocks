// Copyright (c) 2018 Euan Ong
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function SaveInterface(Planet) {
    this.htmlSaveTemplate = `<!DOCTYPE html><html lang="en"><head> <meta charset="utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="description" content="{{ project_description }}"> <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0"> <title>{{ project_name }}</title> <meta property="og:site_name" content="Music Blocks"/> <meta property="og:type" content="website"/> <meta property="og:title" content="Music Blocks Project- {{ project_name }}"/> <meta property="og:description" content="{{ project_description }}"/> <style>body{background-color: #dbf0fb;}#main{background-color: white; padding: 5%; position: fixed; width: 80vw; height: max-content; margin: auto; top: 0; left: 0; bottom: 0; right: 0; display: flex; flex-direction: column; justify-content: center; text-align: center; color: #424242; box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23); font-family: "Roboto", "Helvetica","Arial",sans-serif;}h3{font-weight: 400; font-size: 36px; margin-top: 10px;}hr{border-top: 0px solid #ccc; margin: 1em;}.btn{border: solid; border-color: #96D3F3; padding: 5px 10px; line-height: 50px; color: #0a3e58; text-decoration: none;}.btn:hover{transition: 0.4s; -webkit-transition: 0.3s; -moz-transition: 0.3s; background-color: #96D3F3;}.code{word-break: break-all; height: 15vh; background: #f6f8fa; color: #494949; text-align: justify; margin-right: 10vw; margin-left: 10vw; padding: 16px; overflow: auto; line-height: 1.45; background-color: #f6f8fa; border-radius: 3px; font-family: "SFMono-Regular",Consolas,"Liberation Mono",Menlo,Courier,monospace;}.image{border-radius: 2px 2px 0 0; position: relative; background-color: #96D3F3;}.image-div{margin-bottom: 10px;}.moreinfo-div{margin-top: 20px;}h4{font-weight: 500; font-size: 1.4em; margin-top: 10px; margin-bottom: 10px;}.tbcode{margin-bottom: 10px;}</style></head><body> <div id="main"> <div class="image-div"><img class="image" id="project-image" src="{{ project_image }}"></div><h3 id="title">Music Blocks Project - {{ project_name }}</h3> <p>{{ project_description }}</p><hr> <div>{{ project_button }}<div style="color: #9E9E9E"><p>This project was created in Music Blocks (<a href="https://musicblocks.sugarlabs.org/" target="_blank">https://musicblocks.sugarlabs.org/</a>), a collection of manipulative tools for exploring fundamental musical concepts in an integrative and fun way. Music Blocks is a Free/Libre Software application, whose source code can be accessed at <a href="https://github.com/sugarlabs/musicblocks" target="_blank">https://github.com/sugarlabs/musicblocks</a>. For more information, please consult the <a href="https://github.com/sugarlabs/musicblocks/tree/master/guide" target="_blank">Music Blocks guide</a>.</p><p>To open this project, visit Music Blocks and drag and drop this file into the application window. Alternatively, open the file in Music Blocks using the "Load project from files" button.</p></div><div class="moreinfo-div"> <div class="tbcode"><h4>Project Code</h4>This code stores data about the blocks in a project along with a compiled version of the project, if applicable.   <a href="javascript:toggle();" id="showhide">Show</a></div> <div class="code">{{ data }}</div></div></div></div><script type="text/javascript">function toggle(){if (document.getElementsByClassName("code")[0].style.display=="none"){document.getElementsByClassName("code")[0].style.display="flex";document.getElementById("showhide").textContent = "Hide";} else {document.getElementsByClassName("code")[0].style.display="none";document.getElementById("showhide").textContent = "Show";}} var name=decodeURIComponent(window.location.pathname.split("/").pop().slice(0, -5)); var prefix="Music Blocks Project - "; var title=prefix+name; document.querySelector('meta[property="og:title"]').content=title; document.title=name; document.getElementById("title").textContent=title; document.getElementsByClassName("code")[0].style.display = "none";</script></body></html>`;
    this.buttonTemplate = `<a class="btn" href="https://musicblocks.sugarlabs.org/?id={{ project_id }}">Open in Music Blocks</a>`;
    this.downloadURL = function(filename, dataurl){
        var a = document.createElement('a');
        a.setAttribute('href', dataurl);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    this.prepareHTML = function(name, data, image, description, projectid) {
        var file = this.htmlSaveTemplate;
        if (description === null || description === undefined){
            description = _('No description provided');
        }

        var id = '';
        if (projectid!=undefined){
            id=this.buttonTemplate.replace(new RegExp('{{ project_id }}', 'g'), projectid);
        }

        file = file.replace(new RegExp('{{ project_description }}', 'g'), description)
            .replace(new RegExp('{{ project_name }}', 'g'), name)
            .replace(new RegExp('{{ data }}', 'g'), data)
            .replace(new RegExp('{{ project_image }}', 'g'), image)
            .replace(new RegExp('{{ project_button }}', 'g'), id);
        return file;
    };

    this.saveHTML = function(name, data, image, description, projectid) {
        var html = 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.prepareHTML(name, data, image, description, projectid));
        this.downloadURL(name + '.html', html);
    };

    this.init = function() {
    };
}
