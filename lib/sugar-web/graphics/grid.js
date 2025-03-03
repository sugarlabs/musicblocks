/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2015 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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