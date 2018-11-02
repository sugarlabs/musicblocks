$(document).ready(function () {
    var mode = localStorage.beginnerMode;

    var modeIcon = document.getElementById('mode');
    var modeText = document.getElementById('modeText');


    if (mode === null || mode === 'true') {
        modeIcon.innerHTML = 'star_border';
        modeText.setAttribute('data-tooltip', 'Switch to advanced mode');
    } else {
        modeIcon.innerHTML = 'star';
        modeText.setAttribute('data-tooltip', 'Switch to beginner mode');
    }

    $('.tooltipped').tooltip();

    $('.materialize-iso, .dropdown-trigger').dropdown({
        constrainWidth: false,
        hover: false, // Activate on hover
        belowOrigin: true, // Displays dropdown below the button
    });

});

var logoIcon = document.getElementById('mb-logo');
logoIcon.onmouseenter = function () {
    document.body.style.cursor = "pointer";
};
logoIcon.onmouseleave = function () {
    document.body.style.cursor = "default";
};
logoIcon.onclick = function () {
    _showAboutPage();
};

var playIcon = document.getElementById('play');
playIcon.onclick = function () {
    _doFastButton();
};

var stopIcon = document.getElementById('stop');
stopIcon.onclick = function () {
    _doStopButton();
};

var newProjectIcon = document.getElementById('new-project');
newProjectIcon.onclick = function () {
    _afterDelete();
}

var loadIcon = document.getElementById('load');
loadIcon.onclick = function () {
    loadProject();
}

var saveSVG = document.getElementById('save-svg');
saveSVG.onclick = function () {
    save.saveSVG();
}

var savePNG = document.getElementById('save-png');
savePNG.onclick = function () {
    save.savePNG();
}

var saveWAV = document.getElementById('save-wav');
saveWAV.onclick = function () {
    save.saveWAV();
}

var saveLY = document.getElementById('save-ly');
saveLY.onclick = function () {
    save.saveLilypond();
}

var saveABC = document.getElementById('save-abc');
saveABC.onclick = function () {
    save.saveAbc();
}

var saveABC = document.getElementById('save-abc');
saveABC.onclick = function () {
    save.saveAbc();
}

var planetIcon = document.getElementById('planetIcon');
planetIcon.onclick = function () {
    document.getElementById('toolbars').style.display = "none";
    _doOpenSamples();
}


var menuIcon = document.getElementById('menu');
var auxToolbar = document.getElementById('aux-toolbar');
menuIcon.onclick = function () {
    if (auxToolbar.style.display == '' || auxToolbar.style.display == 'none') {
        _showHideAuxMenu(false);
        auxToolbar.style.display = 'block';
        menuIcon.innerHTML = 'more_vert';
        document.getElementById('toggleAuxBtn').className = 'blue darken-1';
        // $('.tooltipped').tooltip();
    } else {
        _showHideAuxMenu(true);
        auxToolbar.style.display = 'none';
        menuIcon.innerHTML = 'menu';
        document.getElementById('toggleAuxBtn').className -= 'blue darken-1';
    }
}

var helpIcon = document.getElementById('helpIcon');
helpIcon.onclick = function () {
    _showHelp();
}

modeText.onclick = function () {
    doSwitchMode();
}
// $('.tooltipped').tooltip();

var runSlowlyIcon = document.getElementById('runSlowlyIcon');
runSlowlyIcon.onclick = function () {
    _doSlowButton();
}

var runStepByStepIcon = document.getElementById('runStepByStepIcon');
runStepByStepIcon.onclick = function () {
    _doStepButton();
}
var displayStatsIcon = document.getElementById('displayStatsIcon');
var loadPluginIcon = document.getElementById('loadPluginIcon');
var delPluginIcon = document.getElementById('delPluginIcon');
var enableHorizScrollIcon = document.getElementById('enableHorizScrollIcon');

if (!beginnerMode) {
    displayStatsIcon.onclick = function () {
        doAnalytics();
    }

    loadPluginIcon.onclick = function () {
        doOpenPlugin();
    }

    delPluginIcon.onclick = function () {
        deletePlugin();
    }

    enableHorizScrollIcon.onclick = function () {
        setScroller();
    }
} else {
    displayStatsIcon.style.display = "none";
    loadPluginIcon.style.display = "none";
    delPluginIcon.style.display = "none";
    enableHorizScrollIcon.style.display = "none";
}

var mergeWithCurrentIcon = document.getElementById('mergeWithCurrentIcon');
mergeWithCurrentIcon.onclick = function () {
    doLoad();
}

var restoreIcon = document.getElementById('restoreIcon');
restoreIcon.onclick = function () {
    _restoreTrash();
}

var languageSelectIcon = document.getElementById('languageSelectIcon');
languageSelectIcon.onclick = function () {
    doLanguageBox();
}