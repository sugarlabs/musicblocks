// Copyright (c) 2024 Ajeet Pratap Singh
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// CollaborationSpace

class CollaborationSpace {
    constructor(Planet) {
        this.planet = Planet;
    }

    renderNavbar() {

        // Hide buttons in navbar that will not be used in collaboration

        const globalTab = document.getElementById("global-tab");
        globalTab.style.display = "none";

        const localTab = document.getElementById("local-tab");
        localTab.style.display = "none";

        const searchContainer = document.getElementById("searchcontainer-one");
        searchContainer.style.display = "none";

        const newProjectButton = document.getElementById("planet-new-project");
        newProjectButton.style.display = "none";

        const openFileButton = document.getElementById("planet-open-file");
        openFileButton.style.display = "none";

        const closePlanetButton = document.getElementById("close-planet");
        closePlanetButton.style.display = "none";

        // Add exit button in the navbar

        const planetNav = document.getElementById("planetNavWrapper");

        const exitBtn = document.createElement("ul");
        exitBtn.id = "exitCollabRoom";
        exitBtn.classList.add("right");
        exitBtn.textContent = "Exit";
        exitBtn.style.cursor = "pointer";
        exitBtn.style.padding = "3px";
        exitBtn.href = "#global";
        
        planetNav.appendChild(exitBtn);
        exitBtn.addEventListener("click", this.exitSpace);

        // Add a note of under construction
        const note = document.createElement("ul");
        note.id = "constructionNote";
        note.classList.add("right");
        note.textContent = "(Under Construction)";
        note.style.color = "black";
        note.style.position = "relative";
        note.style.top = "13px";
        note.style.left = "35vh";


        planetNav.appendChild(note);

    }
    
    renderCommonSpace(){
    
        // Hide global and local tabs
        const globalPage = document.getElementById("global");
        globalPage.style.visibility = "hidden";

        const localPage = document.getElementById("local");
        localPage.style.visibility = "hidden";
    }

    // Prepare the room by adding/hiding elements

    prepareRoom(){
        this.renderNavbar();
        this.renderCommonSpace();
    }

    // Exit the collaboration space
    exitSpace(){

        const exitButton = document.getElementById("exitCollabRoom");
        exitButton.remove();

        const constructionNote = document.getElementById("constructionNote");
        constructionNote.remove();
        
        const globalTab = document.getElementById("global-tab");
        globalTab.style.display = "";

        const localTab = document.getElementById("local-tab");
        localTab.style.display = "";

        const searchContainer = document.getElementById("searchcontainer-one");
        searchContainer.style.display = "block";

        const newProjectButton = document.getElementById("planet-new-project");
        newProjectButton.style.display = "";

        const openFileButton = document.getElementById("planet-open-file");
        openFileButton.style.display = "";

        const closePlanetButton = document.getElementById("close-planet");
        closePlanetButton.style.display = "";


        const globalPage = document.getElementById("global");
        globalPage.style.visibility = "visible";

        const localPage = document.getElementById("local");
        localPage.style.visibility = "visible";

    }
    
    // Render the room
    renderRoom(){
        this.prepareRoom();
    }

    initiate() {
        this.renderRoom();
    }
}
