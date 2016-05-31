function RhythmRuler () {

	this.init = function(logo) {
		console.log("init RhythmRuler");
		this.logo = logo;
		docById('rulerbody').style.display = 'inline';
        console.log('setting RhythmRuler visible');
        docById('rulerbody').style.visibility = 'visible';
        docById('rulerbody').style.border = 2;

        var table = docById('myTable');

        if (table !== null) {
        	table.remove();
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'myTable');
        x.style.textAlign = 'center';

        var rulerbodyDiv = docById('rulerbody');
        rulerbodyDiv.style.paddingTop = 0 + 'px';
        rulerbodyDiv.style.paddingLeft = 0 + 'px';
        rulerbodyDiv.appendChild(x);
        rulerbodyDivPosition = rulerbodyDiv.getBoundingClientRect();

        var table = docById('myTable');
        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(rulerbodyDivPosition.left) + 'px';
        row.style.top = Math.floor(rulerbodyDivPosition.top) + 'px';

        var iconSize = 20 + 'px';


        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/close-button.svg" title="' + _('close') + '" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = 40 + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = 10 + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            docById('rulerbody').style.visibility = 'hidden';
            document.getElementsByClassName('hRule')[0].style.visibility = 'hidden';
            document.getElementsByClassName('mousePosBox')[0].style.visibility = 'hidden';
            docById('rulerbody').style.border = 0;
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

	}

}