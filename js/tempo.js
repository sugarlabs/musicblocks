
function Tempo () {
    var canvas; 
    var ctx; 
    var x; 
    var y; 
    var mx = 1; 
    var my = 4; 
    var tempmx = -1;
    var WIDTH; 
    var HEIGHT;
    this.isMoving = 1; 
    this.Previousmx;
    this.Previoustempx;
    this.velocity = 0;
    this.BPM = 60;
    var sound = document.getElementById("TempoAudio");

    this.stop = function () {
          tempmx = mx;
          mx=0;
    };

    this.start = function () {
        tempx = this.Previoustempx;
        mx = this.Previousmx;
    };

    this.useBPM = function () {
        console.log("hello");
        this.BPM = document.getElementById("BPMNUMBER").value
        this.velocity = parseFloat(WIDTH) / 60 * this.BPM;
        mx = parseFloat(this.velocity) / 200;
        console.log(WIDTH);
        console.log(this.velocity);
        console.log(mx);
        // this.stop();
        //this.start();

        // var input = document.getElementById("BPMNUMBER").value;
        // var temp;

        // if(input<10)
        //         alert("BPM must be between 10-240");

        // if(input>240) {
        //         alert("BPM must be between 10-240");
        // } else {
        //         temp = input*1287;

        //         if(mx<0){
        //                 mx = (temp*5)/60000;
        //                 mx = -mx;
        //         }

        //         if(mx>0)
        //                 mx = (temp*5)/60000;
        //                 }
    };

    this.speedUp = function () {
        // if(mx > 26 || mx < -26)        {
        //      alert("You can not speed up anymore");
        // } else{
        //     if (mx < 0) {
        //         mx--;
        //     }
        //     if (mx > 0) {
        //         mx++;
        //     }
        // }
        this.BPM += 5;
        this.velocity = parseFloat(this.BPM) / 60 * WIDTH;
        mx = parseFloat(this.velocity) / 200;
        document.getElementById("BPMNUMBER").value = this.BPM;
    };

    this.slowDown = function () {
        // if (mx - 1 == 0 || mx + 1 == 0)        {
        //      alert("You can not slow down anymore");
        // } else {
        //     if (mx > 0) {
        //         mx--;
        //     }
        
        //     if (mx < 0) {
        //         mx++;
        //     }
        // }

        this.BPM-= 5;
        this.velocity = parseFloat(this.BPM) / 60 * WIDTH;
        mx = parseFloat(this.velocity) / 200;
        document.getElementById("BPMNUMBER").value = this.BPM;
    };

    this.circle = function (x,y,r) { 
          ctx.beginPath(); 
        ctx.fillStyle = ""; 
          ctx.arc(x, y, r, 0, Math.PI*2); 
        ctx.fill(); 
    }; 

    this.draw = function() { 
        var that = this;
        var canvasRect = canvas.getBoundingClientRect();
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.beginPath(); 
        ctx.fillStyle = ""; 
          ctx.arc(x, y, 30, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.closePath();
        // console.log(that.logo.turtleDelay);
        if (x + mx > canvas.width || x + mx < 0) {
            if(x + mx > canvas.width) {
                tempmx = -1;
            } else {
                tempmx = 1;
            }
            mx = -mx;
            sound.play();
        }
        if (y + my > canvas.height || y + my < 0) {
            my = -my; 
        }

        x += mx; 
    };

    this._addButton = function(row, colIndex, icon, iconSize, label) {
        var cell = row.insertCell();
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this.init = function (logo) {
        var that = this;
        that.logo = logo;
        console.log("init tempo");
        docById('TempoDiv').style.visibility = 'visible';
        docById('TempoCanvas').style.visibility = 'visible';
        docById('TempoCanvas').style.backgroundColor = 'white';

        var w = window.innerWidth;
        docById('TempoDiv').style.width = Math.floor(w / 2) + 'px';
        docById('TempoCanvas').style.width = Math.floor(w / 2) + 'px';
        docById('TempoCanvas').style.height = Math.floor(w / 4) + 'px';

        WIDTH = Math.floor(w / 2);
        HEIGHT = Math.floor(w / 4);

        this.cellScale = w / 1200;

        var TempoDiv = docById('TempoDiv');

        canvas = document.getElementById("TempoCanvas"); 
        ctx = canvas.getContext("2d");
        console.log(ctx);
        var canvasRect = canvas.getBoundingClientRect();

        var iconSize = Math.floor(this.cellScale * 24);

        x = canvas.width;
        y = 100;

        var tables = document.getElementsByTagName('TABLE');
        var noofTables = tables.length;

        for (var i = 0; i < noofTables; i++) {
            tables[0].parentNode.removeChild(tables[0]);
        }

        var t = document.createElement('TABLE');
        t.setAttribute('id', 'buttonDiv');
        t.style.textAlign = 'center';
        t.style.borderCollapse = 'collapse';
        t.cellSpacing = 0;
        t.cellPadding = 0;

        var TempoDiv = docById('TempoDiv');
        TempoDiv.style.paddingTop = 0 + 'px';
        TempoDiv.style.paddingLeft = 0 + 'px';
        TempoDiv.appendChild(t);
        TempoDivPosition = TempoDiv.getBoundingClientRect();

        var table = docById('buttonDiv');
        var header = table.createTHead();
        var row = header.insertRow(-1);
        row.style.left = Math.floor(TempoDivPosition.left) + 'px';
        row.style.top = Math.floor(TempoDivPosition.top) + 'px';
        row.setAttribute('id', 'buttons');

        var cell = this._addButton(row, -1, 'pause-button.svg', iconSize, _('pause'));
        cell.onclick=function() {
            if(that.isMoving) {
                that.Previoustempx = tempmx;
                that.Previousmx = mx;
                that.stop();
                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                that.isMoving = 0;
            } else {
                that.start();
                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                that.isMoving = 1;
            }
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = this._addButton(row, 1, 'up.svg', iconSize, _('speed up'));
        cell.onclick=function() {
            that.speedUp();
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = this._addButton(row, 2, 'down.svg', iconSize, _('slow down'));
        cell.onclick=function() {
            that.slowDown();
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = row.insertCell(3);
        cell.style.top = 0;
        cell.style.left = 0;
        cell.innerHTML = '<input id="BPMNUMBER" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="BPMNUMBER" type="BPMNUMBER" value="' + 60 + '" />';
        cell.style.width = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;  
        docById('BPMNUMBER').classList.add('hasKeyboard');

        var cell = this._addButton(row, 4, 'apply.svg', iconSize, _('apply BPM'));
        cell.onclick=function() {
            that.useBPM();
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = this._addButton(row, 5, 'close-button.svg', iconSize, _('close'));
        cell.onclick=function() {
            docById('TempoDiv').style.visibility = 'hidden';
            docById('TempoCanvas').style.visibility = 'hidden';
            clearInterval(that._intervalID);
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        this.velocity = parseFloat(WIDTH) / 60 * this.BPM;
        mx = parseFloat(that.velocity) / 200;

        this._intervalID = setInterval(function() {
            that.draw();
        }, 5);
    };

};
