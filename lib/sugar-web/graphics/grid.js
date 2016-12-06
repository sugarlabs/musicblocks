define(function () {

    'use strict';

    var grid = {};

    // Add a grid overlay with lines spaced by subcellSize, for visual
    // debugging.  This is useful while doing the activity layout or
    // while developing widgets.
    grid.addGrid = function (subcellSize) {
        var canvas = document.createElement('canvas');
        canvas.className = "grid";
        document.body.appendChild(canvas);

        var updateGrid = function () {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            var ctx = canvas.getContext("2d");
            ctx.strokeStyle = "#00FFFF";

            var subcellsVertical = window.innerHeight / subcellSize;
            for (i = 0; i < subcellsVertical; i++) {
                if ((i + 1) % 5 === 0) {
                    ctx.lineWidth = 1;
                } else {
                    ctx.lineWidth = 0.5;
                }
                ctx.beginPath();
                ctx.moveTo(0, subcellSize * (i + 1));
                ctx.lineTo(canvas.width, subcellSize * (i + 1));
                ctx.stroke();
            }

            var subcellsHorizontal = window.innerWidth / subcellSize;
            for (i = 0; i < subcellsHorizontal; i++) {
                if ((i + 1) % 5 === 0) {
                    ctx.lineWidth = 1;
                } else {
                    ctx.lineWidth = 0.5;
                }
                ctx.beginPath();
                ctx.moveTo(subcellSize * (i + 1), 0);
                ctx.lineTo(subcellSize * (i + 1), canvas.height);
                ctx.stroke();
            }
        };

        updateGrid();

        window.onresize = function (event) {
            updateGrid();
        };
    };

    return grid;
});
