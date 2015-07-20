/*______________________________________________
  |Developed By Yash Khandelwal GSoC'15         |
  |												|
  |_____________________________________________|
*/

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
}