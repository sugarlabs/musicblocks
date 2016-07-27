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
		var input = document.getElementById("bpmnumber").value;
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
  		ctx.clearRect(0,0,canvas.width,canvas.height);
  	//	that.circle(x+10,y+20,30); 
  		ctx.beginPath(); 
		ctx.fillStyle = ""; 
  		ctx.arc(x, y, 30, 0, Math.PI*2); 
		ctx.fill(); 
		ctx.closePath();
		if (x + mx > canvas.width || x + mx < 0) {
	
	if(x+mx>canvas.width)
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
var colorC = '#';
    for (var i = 0; i < 6; i++ ) {
        colorC += letters[Math.floor(Math.random() * 16)];

}
document.getElementById("TempoCanvas").style.background = colorC;
document.getElementById("TempoDiv").style.background = colorC;

}
  if (y+ my > canvas.height || y+ my < 0) 

    my = -my; 

  x += mx; 


 // y += my; 



	};

	this.init = function () {
		var thisTempo = this;
		console.log("init tempo");
	    docById('TempoDiv').style.visibility = 'visible';
	    docById('TempoCanvas').style.visibility = 'visible';

        var w = window.innerWidth;
        docById('TempoDiv').style.width = Math.floor(w / 2) + 'px';
        docById('TempoCanvas').style.width = Math.floor(w / 2) + 'px';
        docById('TempoCanvas').style.height = Math.floor(w / 4) + 'px';

        WIDTH = Math.floor(w / 2) + 'px';
        HEIGHT = Math.floor(w / 4) + 'px';
 
        var TempoDiv = docById('TempoDiv');

	    canvas = document.getElementById("TempoCanvas"); 
		ctx = canvas.getContext("2d");
		console.log(ctx);
		var canvasRect = canvas.getBoundingClientRect();

		x = canvas.width;
		y = 100;
		console.log(x);
		console.log(y);
		console.log(canvas.getBoundingClientRect());
		setInterval(thisTempo.draw,5);

		var SpeedUpButton = document.createElement("BUTTON");
		SpeedUpButton.setAttribute('id','up');
		SpeedUpButton.textContent = "Speed Up";
		SpeedUpButton.onclick = thisTempo.speedUp;
		SpeedUpButton.className = 'black';
		TempoDiv.appendChild(SpeedUpButton); 

		var SpeedDownButton = document.createElement("BUTTON");
		SpeedDownButton.setAttribute('id', 'down');
		SpeedDownButton.textContent = "Speed Down";
		SpeedDownButton.onclick = thisTempo.speedDown;
		SpeedDownButton.className = 'black';
		TempoDiv.appendChild(SpeedDownButton);
//		ctx.clearRect(0,0,canvas.width,canvas.height);

		var BPMInput = document.createElement("input");
		BPMInput.setAttribute('id','bpmnumber');
		BPMInput.type = "number";
		TempoDiv.appendChild(BPMInput);

		var BPMButton = document.createElement("BUTTON");
		BPMButton.setAttribute('id', 'bpmchange');
		BPMButton.textContent = "Change BPM";
		BPMButton.onclick = thisTempo.useBPM;
		BPMButton.className = 'black';
		TempoDiv.appendChild(BPMButton);

		var StartButton = document.createElement("BUTTON");
		StartButton.setAttribute('id', 'start');
		StartButton.textContent = "Start";
		StartButton.onclick = thisTempo.start;
		StartButton.className = 'black';
		TempoDiv.appendChild(StartButton);

		var StopButton = document.createElement("BUTTON");
		StopButton.setAttribute('id', 'stop');
		StopButton.textContent = "Stop";
		StopButton.onclick = thisTempo.stop;
		StopButton.className = 'black';
		TempoDiv.appendChild(StopButton);
	};

};