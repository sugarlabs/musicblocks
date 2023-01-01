/*
   global

   $
*/

$(document).ready(function () {
    var mode = localStorage.beginnerMode;

    var modeIcon = document.getElementById("mode");
    var modeText = document.getElementById("modeText");


    if (mode === null || mode === "true") {
        modeIcon.innerHTML = "star_border";
        modeText.setAttribute("data-tooltip", "Switch to advanced mode");
    } else {
        modeIcon.innerHTML = "star";
        modeText.setAttribute("data-tooltip", "Switch to beginner mode");
    }

    $(".tooltipped").tooltip();

    $(".materialize-iso, .dropdown-trigger").dropdown({
        constrainWidth: false,
        hover: false, // Activate on hover
        belowOrigin: true, // Displays dropdown below the button
    });
});
