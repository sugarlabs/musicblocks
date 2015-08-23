// Copyright (c) 2015 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// (at your option) any later version.
//
// You should have received a copy of the GNU General Public License
// along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
	FuturevFeature -> Assemble workspace is the area where chunks can be assembled
	The idea is to make chunks from matrix in the home page and assemble them in the dedicated workspace
*/

function Assemble(palettes, matrix, canvas, blocks, turtles, turtleContainer, prepareExport, saveLocally, menucontainer) {
	this.clearAll = function(){
		document.getElementById('matrix').style.display = 'none';
		palettes.hide();
		blocks.hide();

		for(var i = 0; i < turtles.turtleList.length; i++)
		{
			turtles.turtleList[i].container.visible = false;	
			
		}
		for (var blk in blocks.blockList) {
            var myBlock = blocks.blockList[blk];
            //var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);
            if (myBlock.name == 'start')
            {
            	myBlock.show();
            }

        }

		palettes.dict['assemble'].show();
	}
}