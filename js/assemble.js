function workspacea (palettes, matrix, canvas, blocks, turtles, turtleContainer, prepareExport, saveLocally, menucontainer) {
	this.clearAll = function(){
		document.getElementById('matrix').style.display = 'none';
		palettes.hide();
		blocks.hide();

		for(var i = 0; i < turtles.turtleList.length; i++)
		{
			    turtles.turtleList[i].container.visible = false;	
			
		}

		palettes.dict['assemble'].show();
	}

	this.makeBlocks = function(){
		

	}
}