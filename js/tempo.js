function Tempo () {
	var canvas; 
    var ctx; 
    var x = 1287; 
    var y = 500; 
    var mx = 1; 
    var my = 4; 
	var tempmx = -1;
    var WIDTH = 1287; 
    var HEIGHT = 500; 
	var sound = document.getElementById("myAudio"); 

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
  		ctx.arc(x, y, r, 0, Math.PI*2, true); 
		ctx.fill(); 
	}; 

	this.draw = function () { 
  		ctx.clearRect(0, 0, WIDTH, HEIGHT);
  		this.circle(x,250, 30); 
  		if (x + mx > WIDTH || x + mx < 0) {	
			if(x+mx>WIDTH)
				tempmx=-1;	
			else
				tempmx=1;
	    	mx = -mx;
			//sound.play(); 
			var letters = '0123456789ABCDEF'.split('');
    		var color = '#';
    		for (var i = 0; i < 6; i++ ) {
        		color += letters[Math.floor(Math.random() * 16)];
			}

			ctx.fillStyle = color; 
			document.getElementById("TempoHeader").style.background = color;
			var colorC = '#';
    
    		for (var i = 0; i < 6; i++ ) {
        		colorC += letters[Math.floor(Math.random() * 16)];
			}

			document.getElementById("TempoCanvas").style.background = colorC;
			document.getElementById("TempoDiv").style.background = colorC;
		}

  		if (y + my > HEIGHT || y + my < 0) 
			my = -my; 
  		
  		x += mx; 
	};

	this.init = function () {
		var thisTempo = this;
		console.log("init tempo");
	    docById('TempoDiv').style.visibility = 'visible';
	    docById('TempoCanvas').style.visibility = 'visible';

        var w = window.innerWidth;
        docById('TempoDiv').style.width = Math.floor(w / 2) + 'px';
        docById('TempoCanvas').style.width = Math.floor(w / 2) + 'px';
        docById('TempoCanvas').style.height = Math.floor(w/2) + 'px';

        var TempoDiv = docById('TempoDiv');

        var speedUpButton = document.createElement("input");
        speedUpButton.type = "button";
        speedUpButton.value = "SpeedUp";
        TempoDiv.appendChild(speedUpButton);


	    canvas = document.getElementById("TempoCanvas"); 
		ctx = canvas.getContext("2d"); 
  		return setInterval(thisTempo.draw(), 5);
	};

};