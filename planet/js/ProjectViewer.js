// Copyright (c) 2017 Euan Ong
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function ProjectViewer(Planet) {
	this.ProjectCache = Planet.GlobalPlanet.cache;
	this.PlaceholderMBImage = "images/mbgraphic.png";
	this.PlaceholderTBImage = "images/tbgraphic.png";
	this.id = null;

	this.open = function(id){
		this.id = id;
		var proj = this.ProjectCache[id];
		document.getElementById("projectviewer-title").textContent = proj.ProjectName;
		document.getElementById("projectviewer-last-updated").textContent = proj.ProjectLastUpdated;
		document.getElementById("projectviewer-date").textContent = proj.ProjectCreatedDate;
		document.getElementById("projectviewer-downloads").textContent = proj.ProjectDownloads;
		document.getElementById("projectviewer-likes").textContent = proj.ProjectLikes;
		var img = proj.ProjectImage;
		if (img==""||img==null){
			if (proj.ProjectIsMusicBlocks==1){
				img=this.PlaceholderMBImage;
			} else {
				img=this.PlaceholderTBImage;
			}
		}
		document.getElementById("projectviewer-image").src=img;
		document.getElementById("projectviewer-description").textContent = proj.ProjectDescription;
		var tagcontainer = document.getElementById("projectviewer-tags");
		tagcontainer.innerHTML = "";
		for (var i = 0; i<proj.ProjectTags.length; i++){
			var chip = document.createElement("div");
			chip.classList.add("chipselect");
			chip.textContent = Planet.TagsManifest[proj.ProjectTags[i]].TagName;
			tagcontainer.appendChild(chip);
		}
		jQuery('#projectviewer').modal('open');
	};

	this.download = function(){
		var t= this;
		Planet.GlobalPlanet.getData(this.id,function(data){downloadTB(t.ProjectCache[t.id].ProjectName,data)});
	};

	this.openProject = function(){
		Planet.GlobalPlanet.openGlobalProject(this.id);
	}

	this.init = function(){
		var t = this;
		document.getElementById("projectviewer-download-file").addEventListener('click', function (evt) {
			t.download();
		});
		document.getElementById("projectviewer-open-mb").addEventListener('click', function (evt) {
			t.openProject();
		});
	};
};