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
//	var sound = document.getElementById("myAudio"); 

	this.stop = function () {
  		tempmx = mx;
  		mx=0;
  	};

  	this.start = function () {
  		if (tempmx<0)
  			mx=-1;
  		else
			mx=1;
  	};

  	this.useBPM = function () {
		var input = document.getElementById("myNumber").value;
		var temp;
	
		if(input<10)
			alert("BPM must be between 10-240");
	
		if(input>240) {
			alert("BPM must be between 10-240");	
		} else {
			temp = input*1287;
	
			if(mx<0){
				mx = (temp*5)/60000;
				mx = -mx;
			}

			if(mx>0)
				mx = (temp*5)/60000;
  		}
  	};

  	this.speedUp = function () {
		if(mx > 26 || mx < -26)	{
 			alert("You can not speed up anymore");
		} else{
			if (mx < 0) {
				mx--;
			}
			if (mx > 0) {
				mx++;
			}
		}
	};

	this.speedDown = function () {
		if (mx - 1 == 0 || mx + 1 == 0)	{
 			alert("You can not slow down anymore");
		} else {
			if (mx > 0) {
				mx--;
			}
			
			if (mx < 0) {
				mx++;
			}
		}
	};
 
	this.circle = function (x,y,r) { 
  		ctx.beginPath(); 
		ctx.fillStyle = ""; 
  		ctx.arc(x, y, r, 0, Math.PI*2); 
		ctx.fill(); 
	}; 

	this.draw = function () { 
		var that = this;
		var canvasRect = canvas.getBoundingClientRect();
  		ctx.clearRect(canvasRect.left,canvasRect.top, WIDTH, HEIGHT);
  		console.log(x);
  		this.circle(x+10,y+20,30); 
  		x += 1;
	};

	this.init = function () {
		var thisTempo = this;
		console.log("init tempo");
	    docById('TempoDiv').style.visibility = 'visible';
	    docById('TempoCanvas').style.visibility = 'visible';

        var w = window.innerWidth;
        docById('TempoDiv').style.width = Math.floor(w / 2) + 'px';
        docById('TempoCanvas').style.width = Math.floor(w / 2) + 'px';
        docById('TempoCanvas').style.height = Math.floor(w / 2) + 'px';

        WIDTH = Math.floor(w / 2) + 'px';
        HEIGHT = Math.floor(w / 2) + 'px';
 
        var TempoDiv = docById('TempoDiv');

	    canvas = document.getElementById("TempoCanvas"); 
		ctx = canvas.getContext("2d");
		console.log(ctx);
		var canvasRect = canvas.getBoundingClientRect();

		x = canvasRect.left;
		y = canvasRect.top;
		console.log(canvas.getBoundingClientRect());
		thisTempo.draw();
  		setInterval(thisTempo.draw(), 5);
	};

};