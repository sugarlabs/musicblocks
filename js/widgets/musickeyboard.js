// Copyright (c) 2015 Jefferson Lee
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

var afaf = [];
var bfbf = [];

function MusicKeyboard() {
    const BUTTONDIVWIDTH = 295;  // 5 buttons
    const DRUMNAMEWIDTH = 50;
    const OUTERWINDOWWIDTH = 128;
    const INNERWINDOWWIDTH = 50;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    

    var keyboard = document.getElementById("keyboard");
    var keyboardHolder = document.getElementById("keyboardHolder");
    var firstOctave = document.getElementById("firstOctave");
    var firstNote = document.getElementById("firstNote");
    var secondOctave = document.getElementById("secondOctave");
    var secondNote = document.getElementById("secondNote");
    var whiteKeys = document.getElementById("white");
    var blackKeys = document.getElementById("black");

    var whiteNoteEnums = ['C','D','E','F','G','A','B'];
    var blackNoteEnums = ['C♯', 'D♯', 'SKIP', 'F♯', 'G♯', 'A♯', 'SKIP'];

    var noteConversion2 = {'do': 'C', 're': 'D', 'mi': 'E', 'fa': 'F', 'sol': 'G', 'la': 'A', 'ti': 'B', 'do♯': 'C♯', 're♯': 'D♯', 'mi♯': 'E♯', 'fa♯': 'F♯', 'sol♯': 'G♯', 'la♯': 'A♯', 'ti♯': 'B♯', 'rest': 'R'};

    var selected = [];
    var selected1 = [];
    var customKeyboard = 0;
    var standardKeyboard = 0;

    this._rowBlocks1 = [];
    this.rowLabels1 = [];
    this.rowArgs1 = [];
    //configure defaults


    

    this.init = function(logo) {
        // Initializes the pitch/drum matrix. First removes the
        // previous matrix and them make another one in DOM (document
        // object model)
        this._logo = logo; 
        
        if(this.rowLabels1.length == 0){
            document.getElementById("keyboardHolder").style.display = "block";
            standardKeyboard = 1;
        } else {
            document.getElementById("keyboardHolder2").style.display = "block";
            customKeyboard = 1;

            var idContainer = [];
            var idContainer2 = [];


            for(var p = 0; p<this.rowLabels1.length;p++){
                // if(this.rowLabels1[p][2] != '♯' & this.rowLabels1[p][3] != '♯'){
                //     var parenttbl = document.getElementById("myrow");
                //     var newel = document.createElement('td');
                //     var elementid = document.getElementsByTagName("td").length
                //     idContainer.push(elementid);
                //     newel.setAttribute('id',elementid);
                //     newel.innerHTML = this.rowLabels1[p] + this.rowArgs1[p];
                //     parenttbl.appendChild(newel);
                // }
                //  else {
                //     var parenttbl2 = document.getElementById("myrow2");
                //     var newel2 = document.createElement('td');
                //     var elementid2 = document.getElementsByTagName("td").length
                //     idContainer.push(elementid2);
                //     newel2.setAttribute('id',elementid);
                //     newel2.innerHTML = this.rowLabels1[p] + this.rowArgs1[p];
                //     parenttbl2.appendChild(newel2);

                // }

                if(this.rowLabels1[p][2] == '♯' || this.rowLabels1[p][3] == '♯'){
                    var parenttbl2 = document.getElementById("myrow2");
                    var newel2 = document.createElement('td');
                    var elementid2 = document.getElementsByTagName("td").length
                    
                    newel2.setAttribute('id',elementid2);
                    idContainer.push(elementid2);
                    newel2.innerHTML = this.rowLabels1[p] + this.rowArgs1[p];
                    parenttbl2.appendChild(newel2);

                } else {
                    var parenttbl = document.getElementById("myrow");
                    var newel = document.createElement('td');
                    var elementid = document.getElementsByTagName("td").length
                
                    newel.setAttribute('id',elementid);
                    idContainer.push(elementid);
                    newel.innerHTML = this.rowLabels1[p] + this.rowArgs1[p];
                    parenttbl.appendChild(newel);

                }
            }

            // for(var p = 0; p<this.rowLabels1.length;p++){
            //     if(this.rowLabels1[p][1] == '♯' || this.rowLabels1[p][2] == '♯'){
            //         var parenttbl2 = document.getElementById("myrow2");
            //         var newel2 = document.createElement('td');
            //         var elementid2 = document.getElementsByTagName("td").length
            //         idContainer2.push(elementid2);
            //         newel2.setAttribute('id',elementid);
            //         newel2.innerHTML = this.rowLabels1[p] + this.rowArgs1[p];
            //         parenttbl2.appendChild(newel2);
            //     }
            // }



            // var caremn = [440, 493, 554, 587, 659, 739, 830, 880];
            // console.log( "Converted note \x5BMini\x5D");
            // console.log("B "+this.rowLabels1[0]);
            // console.log("C "+this.rowArgs1[0]);
            //       // console.log("D "+document.getElementById(this.rowLabels1[0]+this.rowArgs1[0]).id);
            // console.log("E "+document.getElementById(this.rowLabels1[1]+this.rowArgs1[1]));
            //       //  console.log("F " +noteConversion2['do']);
            //       //    console.log("G " +getTheValues("do4");
            //       //  console.log("H " +noteConversion2['sol']);
            // var yy = caremn[6];
            // console.log(yy);
            // console.log(idContainer);
            // newel.onclick = function(){synth.triggerAttackRelease(yy, '8n')};



            afaf = this.rowLabels1;
            bfbf = this.rowArgs1;

            console.log("idContainer " +idContainer);
            console.log("idContainer2 " +idContainer2) ;
            console.log("afaf " +afaf);
            console.log("bfbf " +bfbf);
            // if(afaf[1][2] == '♯' || afaf[1][3] == '♯'){
            //     console.log("Sharp found")
            // }

        //    document.getElementById(idContainer[0]).onclick = function(){synth.triggerAttackRelease('C4', '8n')};

            document.getElementById(idContainer[0]).onclick = function(){
                var temp1 = afaf[0];
                var temp2 = noteConversion2[temp1]+bfbf[0];
                console.log("onkeypress " +temp2) ;
                selected1.push(temp2);
                if(afaf[0] == "do" & bfbf[0] == 1){
                    synth.triggerAttackRelease('C1', '8n');
                } if(afaf[0] == "do" & bfbf[0] == 2){
                    synth.triggerAttackRelease('C2', '8n');
                } if(afaf[0] == "do" & bfbf[0] == 3){
                    synth.triggerAttackRelease('C3', '8n');
                } if(afaf[0] == "do" & bfbf[0] == 4){
                    synth.triggerAttackRelease('C4', '8n');
                } if(afaf[0] == "do" & bfbf[0] == 5){
                    synth.triggerAttackRelease('C5', '8n');
                } if(afaf[0] == "do" & bfbf[0] == 6){
                    synth.triggerAttackRelease('C6', '8n');
                } if(afaf[0] == "do" & bfbf[0] == 7){
                    synth.triggerAttackRelease('C7', '8n');
                } if(afaf[0] == "do" & bfbf[0] == 8){
                    synth.triggerAttackRelease('C8', '8n');
                }

                if(afaf[0] == "do♯" & bfbf[0] == 1){
                    synth.triggerAttackRelease('C#1', '8n');
                } if(afaf[0] == "do♯" & bfbf[0] == 2){
                    synth.triggerAttackRelease('C#2', '8n');
                } if(afaf[0] == "do♯" & bfbf[0] == 3){
                    synth.triggerAttackRelease('C#3', '8n');
                } if(afaf[0] == "do♯" & bfbf[0] == 4){
                    synth.triggerAttackRelease('C#4', '8n');
                } if(afaf[0] == "do♯" & bfbf[0] == 5){
                    synth.triggerAttackRelease('C#5', '8n');
                } if(afaf[0] == "do♯" & bfbf[0] == 6){
                    synth.triggerAttackRelease('C#6', '8n');
                } if(afaf[0] == "do♯" & bfbf[0] == 7){
                    synth.triggerAttackRelease('C#7', '8n');
                } if(afaf[0] == "do♯" & bfbf[0] == 8){
                    synth.triggerAttackRelease('C#8', '8n');
                }

                if(afaf[0] == "re" & bfbf[0] == 1){
                    synth.triggerAttackRelease('D1', '8n');
                } if(afaf[0] == "re" & bfbf[0] == 2){
                    synth.triggerAttackRelease('D2', '8n');
                } if(afaf[0] == "re" & bfbf[0] == 3){
                    synth.triggerAttackRelease('D3', '8n');
                } if(afaf[0] == "re" & bfbf[0] == 4){
                    synth.triggerAttackRelease('D4', '8n');
                } if(afaf[0] == "re" & bfbf[0] == 5){
                    synth.triggerAttackRelease('D5', '8n');
                } if(afaf[0] == "re" & bfbf[0] == 6){
                    synth.triggerAttackRelease('D6', '8n');
                } if(afaf[0] == "re" & bfbf[0] == 7){
                    synth.triggerAttackRelease('D7', '8n');
                } if(afaf[0] == "re" & bfbf[0] == 8){
                    synth.triggerAttackRelease('D8', '8n');
                }

                if(afaf[0] == "re♯" & bfbf[0] == 1){
                    synth.triggerAttackRelease('D#1', '8n');
                } if(afaf[0] == "re♯" & bfbf[0] == 2){
                    synth.triggerAttackRelease('D#2', '8n');
                } if(afaf[0] == "re♯" & bfbf[0] == 3){
                    synth.triggerAttackRelease('D#3', '8n');
                } if(afaf[0] == "re♯" & bfbf[0] == 4){
                    synth.triggerAttackRelease('D#4', '8n');
                } if(afaf[0] == "re♯" & bfbf[0] == 5){
                    synth.triggerAttackRelease('D#5', '8n');
                } if(afaf[0] == "re♯" & bfbf[0] == 6){
                    synth.triggerAttackRelease('D#6', '8n');
                } if(afaf[0] == "re♯" & bfbf[0] == 7){
                    synth.triggerAttackRelease('D#7', '8n');
                } if(afaf[0] == "re♯" & bfbf[0] == 8){
                    synth.triggerAttackRelease('D#8', '8n');
                }

                if(afaf[0] == "mi" & bfbf[0] == 1){
                    synth.triggerAttackRelease('E1', '8n');
                } if(afaf[0] == "mi" & bfbf[0] == 2){
                    synth.triggerAttackRelease('E2', '8n');
                } if(afaf[0] == "mi" & bfbf[0] == 3){
                    synth.triggerAttackRelease('E3', '8n');
                } if(afaf[0] == "mi" & bfbf[0] == 4){
                    synth.triggerAttackRelease('E4', '8n');
                } if(afaf[0] == "mi" & bfbf[0] == 5){
                    synth.triggerAttackRelease('E5', '8n');
                } if(afaf[0] == "mi" & bfbf[0] == 6){
                    synth.triggerAttackRelease('E6', '8n');
                } if(afaf[0] == "mi" & bfbf[0] == 7){
                    synth.triggerAttackRelease('E7', '8n');
                } if(afaf[0] == "mi" & bfbf[0] == 8){
                    synth.triggerAttackRelease('E8', '8n');
                }

                if(afaf[0] == "mi♯" & bfbf[0] == 1){
                    synth.triggerAttackRelease('E#1', '8n');
                } if(afaf[0] == "mi♯" & bfbf[0] == 2){
                    synth.triggerAttackRelease('E#2', '8n');
                } if(afaf[0] == "mi♯" & bfbf[0] == 3){
                    synth.triggerAttackRelease('E#3', '8n');
                } if(afaf[0] == "mi♯" & bfbf[0] == 4){
                    synth.triggerAttackRelease('E#4', '8n');
                } if(afaf[0] == "mi♯" & bfbf[0] == 5){
                    synth.triggerAttackRelease('E#5', '8n');
                } if(afaf[0] == "mi♯" & bfbf[0] == 6){
                    synth.triggerAttackRelease('E#6', '8n');
                } if(afaf[0] == "mi♯" & bfbf[0] == 7){
                    synth.triggerAttackRelease('E#7', '8n');
                } if(afaf[0] == "mi♯" & bfbf[0] == 8){
                    synth.triggerAttackRelease('E#8', '8n');
                }

                if(afaf[0] == "fa" & bfbf[0] == 1){
                    synth.triggerAttackRelease('F1', '8n');
                } if(afaf[0] == "fa" & bfbf[0] == 2){
                    synth.triggerAttackRelease('F2', '8n');
                } if(afaf[0] == "fa" & bfbf[0] == 3){
                    synth.triggerAttackRelease('F3', '8n');
                } if(afaf[0] == "fa" & bfbf[0] == 4){
                    synth.triggerAttackRelease('F4', '8n');
                } if(afaf[0] == "fa" & bfbf[0] == 5){
                    synth.triggerAttackRelease('F5', '8n');
                } if(afaf[0] == "fa" & bfbf[0] == 6){
                    synth.triggerAttackRelease('F6', '8n');
                } if(afaf[0] == "fa" & bfbf[0] == 7){
                    synth.triggerAttackRelease('F7', '8n');
                } if(afaf[0] == "fa" & bfbf[0] == 8){
                    synth.triggerAttackRelease('8', '8n');
                }

                if(afaf[0] == "fa♯" & bfbf[0] == 1){
                    synth.triggerAttackRelease('F#1', '8n');
                } if(afaf[0] == "fa♯" & bfbf[0] == 2){
                    synth.triggerAttackRelease('F#2', '8n');
                } if(afaf[0] == "fa♯" & bfbf[0] == 3){
                    synth.triggerAttackRelease('F#3', '8n');
                } if(afaf[0] == "fa♯" & bfbf[0] == 4){
                    synth.triggerAttackRelease('F#4', '8n');
                } if(afaf[0] == "fa♯" & bfbf[0] == 5){
                    synth.triggerAttackRelease('F#5', '8n');
                } if(afaf[0] == "fa♯" & bfbf[0] == 6){
                    synth.triggerAttackRelease('F#6', '8n');
                } if(afaf[0] == "fa♯" & bfbf[0] == 7){
                    synth.triggerAttackRelease('F#7', '8n');
                } if(afaf[0] == "fa♯" & bfbf[0] == 8){
                    synth.triggerAttackRelease('F#8', '8n');
                }

                if(afaf[0] == "sol" & bfbf[0] == 1){
                    synth.triggerAttackRelease('G1', '8n');
                } if(afaf[0] == "sol" & bfbf[0] == 2){
                    synth.triggerAttackRelease('G2', '8n');
                } if(afaf[0] == "sol" & bfbf[0] == 3){
                    synth.triggerAttackRelease('G3', '8n');
                } if(afaf[0] == "sol" & bfbf[0] == 4){
                    synth.triggerAttackRelease('G4', '8n');
                } if(afaf[0] == "sol" & bfbf[0] == 5){
                    synth.triggerAttackRelease('G5', '8n');
                } if(afaf[0] == "sol" & bfbf[0] == 6){
                    synth.triggerAttackRelease('G6', '8n');
                } if(afaf[0] == "sol" & bfbf[0] == 7){
                    synth.triggerAttackRelease('G7', '8n');
                } if(afaf[0] == "sol" & bfbf[0] == 8){
                    synth.triggerAttackRelease('G8', '8n');
                }

                if(afaf[0] == "sol♯" & bfbf[0] == 1){
                    synth.triggerAttackRelease('G#1', '8n');
                } if(afaf[0] == "sol♯" & bfbf[0] == 2){
                    synth.triggerAttackRelease('G#2', '8n');
                } if(afaf[0] == "sol♯" & bfbf[0] == 3){
                    synth.triggerAttackRelease('G#3', '8n');
                } if(afaf[0] == "sol♯" & bfbf[0] == 4){
                    synth.triggerAttackRelease('G#4', '8n');
                } if(afaf[0] == "sol♯" & bfbf[0] == 5){
                    synth.triggerAttackRelease('G#5', '8n');
                } if(afaf[0] == "sol♯" & bfbf[0] == 6){
                    synth.triggerAttackRelease('G#6', '8n');
                } if(afaf[0] == "sol♯" & bfbf[0] == 7){
                    synth.triggerAttackRelease('G#7', '8n');
                } if(afaf[0] == "sol♯" & bfbf[0] == 8){
                    synth.triggerAttackRelease('G#8', '8n');
                }

                if(afaf[0] == "la" & bfbf[0] == 1){
                    synth.triggerAttackRelease('A1', '8n');
                } if(afaf[0] == "la" & bfbf[0] == 2){
                    synth.triggerAttackRelease('A2', '8n');
                } if(afaf[0] == "la" & bfbf[0] == 3){
                    synth.triggerAttackRelease('A3', '8n');
                } if(afaf[0] == "la" & bfbf[0] == 4){
                    synth.triggerAttackRelease('A4', '8n');
                } if(afaf[0] == "la" & bfbf[0] == 5){
                    synth.triggerAttackRelease('A5', '8n');
                } if(afaf[0] == "la" & bfbf[0] == 6){
                    synth.triggerAttackRelease('A6', '8n');
                } if(afaf[0] == "la" & bfbf[0] == 7){
                    synth.triggerAttackRelease('A7', '8n');
                } if(afaf[0] == "la" & bfbf[0] == 8){
                    synth.triggerAttackRelease('A8', '8n');
                }

                if(afaf[0] == "la♯" & bfbf[0] == 1){
                    synth.triggerAttackRelease('A#1', '8n');
                } if(afaf[0] == "la♯" & bfbf[0] == 2){
                    synth.triggerAttackRelease('A#2', '8n');
                } if(afaf[0] == "la♯" & bfbf[0] == 3){
                    synth.triggerAttackRelease('A#3', '8n');
                } if(afaf[0] == "la♯" & bfbf[0] == 4){
                    synth.triggerAttackRelease('A#4', '8n');
                } if(afaf[0] == "la♯" & bfbf[0] == 5){
                    synth.triggerAttackRelease('A#5', '8n');
                } if(afaf[0] == "la♯" & bfbf[0] == 6){
                    synth.triggerAttackRelease('A#6', '8n');
                } if(afaf[0] == "la♯" & bfbf[0] == 7){
                    synth.triggerAttackRelease('A#7', '8n');
                } if(afaf[0] == "la♯" & bfbf[0] == 8){
                    synth.triggerAttackRelease('A#8', '8n');
                }

                if(afaf[0] == "ti" & bfbf[0] == 1){
                    synth.triggerAttackRelease('B1', '8n');
                } if(afaf[0] == "ti" & bfbf[0] == 2){
                    synth.triggerAttackRelease('B2', '8n');
                } if(afaf[0] == "ti" & bfbf[0] == 3){
                    synth.triggerAttackRelease('B3', '8n');
                } if(afaf[0] == "ti" & bfbf[0] == 4){
                    synth.triggerAttackRelease('B4', '8n');
                } if(afaf[0] == "ti" & bfbf[0] == 5){
                    synth.triggerAttackRelease('B5', '8n');
                } if(afaf[0] == "ti" & bfbf[0] == 6){
                    synth.triggerAttackRelease('B6', '8n');
                } if(afaf[0] == "ti" & bfbf[0] == 7){
                    synth.triggerAttackRelease('B7', '8n');
                } if(afaf[0] == "ti" & bfbf[0] == 8){
                    synth.triggerAttackRelease('B8', '8n');
                }

                if(afaf[0] == "ti♯" & bfbf[0] == 1){
                    synth.triggerAttackRelease('B#1', '8n');
                } if(afaf[0] == "ti♯" & bfbf[0] == 2){
                    synth.triggerAttackRelease('B#2', '8n');
                } if(afaf[0] == "ti♯" & bfbf[0] == 3){
                    synth.triggerAttackRelease('B#3', '8n');
                } if(afaf[0] == "ti♯" & bfbf[0] == 4){
                    synth.triggerAttackRelease('B#4', '8n');
                } if(afaf[0] == "ti♯" & bfbf[0] == 5){
                    synth.triggerAttackRelease('B#5', '8n');
                } if(afaf[0] == "ti♯" & bfbf[0] == 6){
                    synth.triggerAttackRelease('B#6', '8n');
                } if(afaf[0] == "ti♯" & bfbf[0] == 7){
                    synth.triggerAttackRelease('B#7', '8n');
                } if(afaf[0] == "ti♯" & bfbf[0] == 8){
                    synth.triggerAttackRelease('B#8', '8n');
                }
            };

            if(idContainer.length > 1){

                document.getElementById(idContainer[1]).onclick = function(){
                    var temp1 = afaf[1];
                    var temp2 = noteConversion2[temp1]+bfbf[1];
                    console.log("onkeypress " +temp2) ;
                    selected1.push(temp2);

                    if(afaf[1] == "do" & bfbf[1] == 1){
                        synth.triggerAttackRelease('C1', '8n');
                    } if(afaf[1] == "do" & bfbf[1] == 2){
                        synth.triggerAttackRelease('C2', '8n');
                    } if(afaf[1] == "do" & bfbf[1] == 3){
                        synth.triggerAttackRelease('C3', '8n');
                    } if(afaf[1] == "do" & bfbf[1] == 4){
                        synth.triggerAttackRelease('C4', '8n');
                    } if(afaf[1] == "do" & bfbf[1] == 5){
                        synth.triggerAttackRelease('C5', '8n');
                    } if(afaf[1] == "do" & bfbf[1] == 6){
                        synth.triggerAttackRelease('C6', '8n');
                    } if(afaf[1] == "do" & bfbf[1] == 7){
                        synth.triggerAttackRelease('C7', '8n');
                    } if(afaf[1] == "do" & bfbf[1] == 8){
                        synth.triggerAttackRelease('C8', '8n');
                    }

                    if(afaf[1] == "do♯" & bfbf[1] == 1){
                        synth.triggerAttackRelease('C#1', '8n');
                    } if(afaf[1] == "do♯" & bfbf[1] == 2){
                        synth.triggerAttackRelease('C#2', '8n');
                    } if(afaf[1] == "do♯" & bfbf[1] == 3){
                        synth.triggerAttackRelease('C#3', '8n');
                    } if(afaf[1] == "do♯" & bfbf[1] == 4){
                        synth.triggerAttackRelease('C#4', '8n');
                    } if(afaf[1] == "do♯" & bfbf[1] == 5){
                        synth.triggerAttackRelease('C#5', '8n');
                    } if(afaf[1] == "do♯" & bfbf[1] == 6){
                        synth.triggerAttackRelease('C#6', '8n');
                    } if(afaf[1] == "do♯" & bfbf[1] == 7){
                        synth.triggerAttackRelease('C#7', '8n');
                    } if(afaf[1] == "do♯" & bfbf[1] == 8){
                        synth.triggerAttackRelease('C#8', '8n');
                    }


                    if(afaf[1] == "re" & bfbf[1] == 1){
                        synth.triggerAttackRelease('D1', '8n');
                    } if(afaf[1] == "re" & bfbf[1] == 2){
                        synth.triggerAttackRelease('D2', '8n');
                    } if(afaf[1] == "re" & bfbf[1] == 3){
                        synth.triggerAttackRelease('D3', '8n');
                    } if(afaf[1] == "re" & bfbf[1] == 4){
                        synth.triggerAttackRelease('D4', '8n');
                    } if(afaf[1] == "re" & bfbf[1] == 5){
                        synth.triggerAttackRelease('D5', '8n');
                    } if(afaf[1] == "re" & bfbf[1] == 6){
                        synth.triggerAttackRelease('D6', '8n');
                    } if(afaf[1] == "re" & bfbf[1] == 7){
                        synth.triggerAttackRelease('D7', '8n');
                    } if(afaf[1] == "re" & bfbf[1] == 8){
                        synth.triggerAttackRelease('D8', '8n');
                    }

                    if(afaf[1] == "re♯" & bfbf[1] == 1){
                        synth.triggerAttackRelease('D#1', '8n');
                    } if(afaf[1] == "re♯" & bfbf[1] == 2){
                        synth.triggerAttackRelease('D#2', '8n');
                    } if(afaf[1] == "re♯" & bfbf[1] == 3){
                        synth.triggerAttackRelease('D#3', '8n');
                    } if(afaf[1] == "re♯" & bfbf[1] == 4){
                        synth.triggerAttackRelease('D#4', '8n');
                    } if(afaf[1] == "re♯" & bfbf[1] == 5){
                        synth.triggerAttackRelease('D#5', '8n');
                    } if(afaf[1] == "re♯" & bfbf[1] == 6){
                        synth.triggerAttackRelease('D#6', '8n');
                    } if(afaf[1] == "re♯" & bfbf[1] == 7){
                        synth.triggerAttackRelease('D#7', '8n');
                    } if(afaf[1] == "re♯" & bfbf[1] == 8){
                        synth.triggerAttackRelease('D#8', '8n');
                    }

                    if(afaf[1] == "mi" & bfbf[1] == 1){
                        synth.triggerAttackRelease('E1', '8n');
                    } if(afaf[1] == "mi" & bfbf[1] == 2){
                        synth.triggerAttackRelease('E2', '8n');
                    } if(afaf[1] == "mi" & bfbf[1] == 3){
                        synth.triggerAttackRelease('E3', '8n');
                    } if(afaf[1] == "mi" & bfbf[1] == 4){
                        synth.triggerAttackRelease('E4', '8n');
                    } if(afaf[1] == "mi" & bfbf[1] == 5){
                        synth.triggerAttackRelease('E5', '8n');
                    } if(afaf[1] == "mi" & bfbf[1] == 6){
                        synth.triggerAttackRelease('E6', '8n');
                    } if(afaf[1] == "mi" & bfbf[1] == 7){
                        synth.triggerAttackRelease('E7', '8n');
                    } if(afaf[1] == "mi" & bfbf[1] == 8){
                        synth.triggerAttackRelease('E8', '8n');
                    }

                    if(afaf[1] == "mi♯" & bfbf[1] == 1){
                        synth.triggerAttackRelease('E#1', '8n');
                    } if(afaf[1] == "mi♯" & bfbf[1] == 2){
                        synth.triggerAttackRelease('E#2', '8n');
                    } if(afaf[1] == "mi♯" & bfbf[1] == 3){
                        synth.triggerAttackRelease('E#3', '8n');
                    } if(afaf[1] == "mi♯" & bfbf[1] == 4){
                        synth.triggerAttackRelease('E#4', '8n');
                    } if(afaf[1] == "mi♯" & bfbf[1] == 5){
                        synth.triggerAttackRelease('E#5', '8n');
                    } if(afaf[1] == "mi♯" & bfbf[1] == 6){
                        synth.triggerAttackRelease('E#6', '8n');
                    } if(afaf[1] == "mi♯" & bfbf[1] == 7){
                        synth.triggerAttackRelease('E#7', '8n');
                    } if(afaf[1] == "mi♯" & bfbf[1] == 8){
                        synth.triggerAttackRelease('E#8', '8n');
                    }

                    if(afaf[1] == "fa" & bfbf[1] == 1){
                        synth.triggerAttackRelease('F1', '8n');
                    } if(afaf[1] == "fa" & bfbf[1] == 2){
                        synth.triggerAttackRelease('F2', '8n');
                    } if(afaf[1] == "fa" & bfbf[1] == 3){
                        synth.triggerAttackRelease('F3', '8n');
                    } if(afaf[1] == "fa" & bfbf[1] == 4){
                        synth.triggerAttackRelease('F4', '8n');
                    } if(afaf[1] == "fa" & bfbf[1] == 5){
                        synth.triggerAttackRelease('F5', '8n');
                    } if(afaf[1] == "fa" & bfbf[1] == 6){
                        synth.triggerAttackRelease('F6', '8n');
                    } if(afaf[1] == "fa" & bfbf[1] == 7){
                        synth.triggerAttackRelease('F7', '8n');
                    } if(afaf[1] == "fa" & bfbf[1] == 8){
                        synth.triggerAttackRelease('F8', '8n');
                    }

                    if(afaf[1] == "fa♯" & bfbf[1] == 1){
                        synth.triggerAttackRelease('F#1', '8n');
                    } if(afaf[1] == "fa♯" & bfbf[1] == 2){
                        synth.triggerAttackRelease('F#2', '8n');
                    } if(afaf[1] == "fa♯" & bfbf[1] == 3){
                        synth.triggerAttackRelease('F#3', '8n');
                    } if(afaf[1] == "fa♯" & bfbf[1] == 4){
                        synth.triggerAttackRelease('F#4', '8n');
                    } if(afaf[1] == "fa♯" & bfbf[1] == 5){
                        synth.triggerAttackRelease('F#5', '8n');
                    } if(afaf[1] == "fa♯" & bfbf[1] == 6){
                        synth.triggerAttackRelease('F#6', '8n');
                    } if(afaf[1] == "fa♯" & bfbf[1] == 7){
                        synth.triggerAttackRelease('F#7', '8n');
                    } if(afaf[1] == "fa♯" & bfbf[1] == 8){
                        synth.triggerAttackRelease('F#8', '8n');
                    }

                    if(afaf[1] == "sol" & bfbf[1] == 1){
                        synth.triggerAttackRelease('G1', '8n');
                    } if(afaf[1] == "sol" & bfbf[1] == 2){
                        synth.triggerAttackRelease('G2', '8n');
                    } if(afaf[1] == "sol" & bfbf[1] == 3){
                        synth.triggerAttackRelease('G3', '8n');
                    } if(afaf[1] == "sol" & bfbf[1] == 4){
                        synth.triggerAttackRelease('G4', '8n');
                    } if(afaf[1] == "sol" & bfbf[1] == 5){
                        synth.triggerAttackRelease('G5', '8n');
                    } if(afaf[1] == "sol" & bfbf[1] == 6){
                        synth.triggerAttackRelease('G6', '8n');
                    } if(afaf[1] == "sol" & bfbf[1] == 7){
                        synth.triggerAttackRelease('G7', '8n');
                    } if(afaf[1] == "sol" & bfbf[1] == 8){
                        synth.triggerAttackRelease('G8', '8n');
                    }

                    if(afaf[1] == "sol♯" & bfbf[1] == 1){
                        synth.triggerAttackRelease('G#1', '8n');
                    } if(afaf[1] == "sol♯" & bfbf[1] == 2){
                        synth.triggerAttackRelease('G#2', '8n');
                    } if(afaf[1] == "sol♯" & bfbf[1] == 3){
                        synth.triggerAttackRelease('G#3', '8n');
                    } if(afaf[1] == "sol♯" & bfbf[1] == 4){
                        synth.triggerAttackRelease('G#4', '8n');
                    } if(afaf[1] == "sol♯" & bfbf[1] == 5){
                        synth.triggerAttackRelease('G#5', '8n');
                    } if(afaf[1] == "sol♯" & bfbf[1] == 6){
                        synth.triggerAttackRelease('G#6', '8n');
                    } if(afaf[1] == "sol♯" & bfbf[1] == 7){
                        synth.triggerAttackRelease('G#7', '8n');
                    } if(afaf[1] == "sol♯" & bfbf[1] == 8){
                        synth.triggerAttackRelease('G#8', '8n');
                    }

                    if(afaf[1] == "la" & bfbf[1] == 1){
                        synth.triggerAttackRelease('A1', '8n');
                    } if(afaf[1] == "la" & bfbf[1] == 2){
                        synth.triggerAttackRelease('A2', '8n');
                    } if(afaf[1] == "la" & bfbf[1] == 3){
                        synth.triggerAttackRelease('A3', '8n');
                    } if(afaf[1] == "la" & bfbf[1] == 4){
                        synth.triggerAttackRelease('A4', '8n');
                    } if(afaf[1] == "la" & bfbf[1] == 5){
                        synth.triggerAttackRelease('A5', '8n');
                    } if(afaf[1] == "la" & bfbf[1] == 6){
                        synth.triggerAttackRelease('A6', '8n');
                    } if(afaf[1] == "la" & bfbf[1] == 7){
                        synth.triggerAttackRelease('A7', '8n');
                    } if(afaf[1] == "la" & bfbf[1] == 8){
                        synth.triggerAttackRelease('A8', '8n');
                    }

                    if(afaf[1] == "la♯" & bfbf[1] == 1){
                        synth.triggerAttackRelease('A#1', '8n');
                    } if(afaf[1] == "la♯" & bfbf[1] == 2){
                        synth.triggerAttackRelease('A#2', '8n');
                    } if(afaf[1] == "la♯" & bfbf[1] == 3){
                        synth.triggerAttackRelease('A#3', '8n');
                    } if(afaf[1] == "la♯" & bfbf[1] == 4){
                        synth.triggerAttackRelease('A#4', '8n');
                    } if(afaf[1] == "la♯" & bfbf[1] == 5){
                        synth.triggerAttackRelease('A#5', '8n');
                    } if(afaf[1] == "la♯" & bfbf[1] == 6){
                        synth.triggerAttackRelease('A#6', '8n');
                    } if(afaf[1] == "la♯" & bfbf[1] == 7){
                        synth.triggerAttackRelease('A#7', '8n');
                    } if(afaf[1] == "la♯" & bfbf[1] == 8){
                        synth.triggerAttackRelease('A#8', '8n');
                    }

                    if(afaf[1] == "ti" & bfbf[1] == 1){
                        synth.triggerAttackRelease('B1', '8n');
                    } if(afaf[1] == "ti" & bfbf[1] == 2){
                        synth.triggerAttackRelease('B2', '8n');
                    } if(afaf[1] == "ti" & bfbf[1] == 3){
                        synth.triggerAttackRelease('B3', '8n');
                    } if(afaf[1] == "ti" & bfbf[1] == 4){
                        synth.triggerAttackRelease('B4', '8n');
                    } if(afaf[1] == "ti" & bfbf[1] == 5){
                        synth.triggerAttackRelease('B5', '8n');
                    } if(afaf[1] == "ti" & bfbf[1] == 6){
                        synth.triggerAttackRelease('B6', '8n');
                    } if(afaf[1] == "ti" & bfbf[1] == 7){
                        synth.triggerAttackRelease('B7', '8n');
                    } if(afaf[1] == "ti" & bfbf[1] == 8){
                        synth.triggerAttackRelease('B8', '8n');
                    }

                    if(afaf[1] == "ti♯" & bfbf[1] == 1){
                        synth.triggerAttackRelease('B#1', '8n');
                    } if(afaf[1] == "ti♯" & bfbf[1] == 2){
                        synth.triggerAttackRelease('B#2', '8n');
                    } if(afaf[1] == "ti♯" & bfbf[1] == 3){
                        synth.triggerAttackRelease('B#3', '8n');
                    } if(afaf[1] == "ti♯" & bfbf[1] == 4){
                        synth.triggerAttackRelease('B#4', '8n');
                    } if(afaf[1] == "ti♯" & bfbf[1] == 5){
                        synth.triggerAttackRelease('B#5', '8n');
                    } if(afaf[1] == "ti♯" & bfbf[1] == 6){
                        synth.triggerAttackRelease('B#6', '8n');
                    } if(afaf[1] == "ti♯" & bfbf[1] == 7){
                        synth.triggerAttackRelease('B#7', '8n');
                    } if(afaf[1] == "ti♯" & bfbf[1] == 8){
                        synth.triggerAttackRelease('B#8', '8n');
                    }
                };
            }


            if(idContainer.length > 2){

                document.getElementById(idContainer[2]).onclick = function(){

                    var temp1 = afaf[2];
                    var temp2 = noteConversion2[temp1]+bfbf[2];
                    console.log("onkeypress " +temp2) ;
                    selected1.push(temp2);
                    
                    if(afaf[2] == "do" & bfbf[2] == 1){
                        synth.triggerAttackRelease('C1', '8n');
                    } if(afaf[2] == "do" & bfbf[2] == 2){
                        synth.triggerAttackRelease('C2', '8n');
                    } if(afaf[2] == "do" & bfbf[2] == 3){
                        synth.triggerAttackRelease('C3', '8n');
                    } if(afaf[2] == "do" & bfbf[2] == 4){
                        synth.triggerAttackRelease('C4', '8n');
                    } if(afaf[2] == "do" & bfbf[2] == 5){
                        synth.triggerAttackRelease('C5', '8n');
                    } if(afaf[2] == "do" & bfbf[2] == 6){
                        synth.triggerAttackRelease('C6', '8n');
                    } if(afaf[2] == "do" & bfbf[2] == 7){
                        synth.triggerAttackRelease('C7', '8n');
                    } if(afaf[2] == "do" & bfbf[2] == 8){
                        synth.triggerAttackRelease('C8', '8n');
                    }
                    if(afaf[2] == "re" & bfbf[2] == 1){
                        synth.triggerAttackRelease('D1', '8n');
                    } if(afaf[2] == "re" & bfbf[2] == 2){
                        synth.triggerAttackRelease('D2', '8n');
                    } if(afaf[2] == "re" & bfbf[2] == 3){
                        synth.triggerAttackRelease('D3', '8n');
                    } if(afaf[2] == "re" & bfbf[2] == 4){
                        synth.triggerAttackRelease('D4', '8n');
                    } if(afaf[2] == "re" & bfbf[2] == 5){
                        synth.triggerAttackRelease('D5', '8n');
                    } if(afaf[2] == "re" & bfbf[2] == 6){
                        synth.triggerAttackRelease('D6', '8n');
                    } if(afaf[2] == "re" & bfbf[2] == 7){
                        synth.triggerAttackRelease('D7', '8n');
                    } if(afaf[2] == "re" & bfbf[2] == 8){
                        synth.triggerAttackRelease('D8', '8n');
                    }
                    if(afaf[2] == "mi" & bfbf[2] == 1){
                        synth.triggerAttackRelease('E1', '8n');
                    } if(afaf[2] == "mi" & bfbf[2] == 2){
                        synth.triggerAttackRelease('E2', '8n');
                    } if(afaf[2] == "mi" & bfbf[2] == 3){
                        synth.triggerAttackRelease('E3', '8n');
                    } if(afaf[2] == "mi" & bfbf[2] == 4){
                        synth.triggerAttackRelease('E4', '8n');
                    } if(afaf[2] == "mi" & bfbf[2] == 5){
                        synth.triggerAttackRelease('E5', '8n');
                    } if(afaf[2] == "mi" & bfbf[2] == 6){
                        synth.triggerAttackRelease('E6', '8n');
                    } if(afaf[2] == "mi" & bfbf[2] == 7){
                        synth.triggerAttackRelease('E7', '8n');
                    } if(afaf[2] == "mi" & bfbf[2] == 8){
                        synth.triggerAttackRelease('E8', '8n');
                    }
                    if(afaf[2] == "fa" & bfbf[2] == 1){
                        synth.triggerAttackRelease('F1', '8n');
                    } if(afaf[2] == "fa" & bfbf[2] == 2){
                        synth.triggerAttackRelease('F2', '8n');
                    } if(afaf[2] == "fa" & bfbf[2] == 3){
                        synth.triggerAttackRelease('F3', '8n');
                    } if(afaf[2] == "fa" & bfbf[2] == 4){
                        synth.triggerAttackRelease('F4', '8n');
                    } if(afaf[2] == "fa" & bfbf[2] == 5){
                        synth.triggerAttackRelease('F5', '8n');
                    } if(afaf[2] == "fa" & bfbf[2] == 6){
                        synth.triggerAttackRelease('F6', '8n');
                    } if(afaf[2] == "fa" & bfbf[2] == 7){
                        synth.triggerAttackRelease('F7', '8n');
                    } if(afaf[2] == "fa" & bfbf[2] == 8){
                        synth.triggerAttackRelease('8', '8n');
                    }
                    if(afaf[2] == "sol" & bfbf[2] == 1){
                        synth.triggerAttackRelease('G1', '8n');
                    } if(afaf[2] == "sol" & bfbf[2] == 2){
                        synth.triggerAttackRelease('G2', '8n');
                    } if(afaf[2] == "sol" & bfbf[2] == 3){
                        synth.triggerAttackRelease('G3', '8n');
                    } if(afaf[2] == "sol" & bfbf[2] == 4){
                        synth.triggerAttackRelease('G4', '8n');
                    } if(afaf[2] == "sol" & bfbf[2] == 5){
                        synth.triggerAttackRelease('G5', '8n');
                    } if(afaf[2] == "sol" & bfbf[2] == 6){
                        synth.triggerAttackRelease('G6', '8n');
                    } if(afaf[2] == "sol" & bfbf[2] == 7){
                        synth.triggerAttackRelease('G7', '8n');
                    } if(afaf[2] == "sol" & bfbf[2] == 8){
                        synth.triggerAttackRelease('G8', '8n');
                    }
                    if(afaf[2] == "la" & bfbf[2] == 1){
                        synth.triggerAttackRelease('A1', '8n');
                    } if(afaf[2] == "la" & bfbf[2] == 2){
                        synth.triggerAttackRelease('A2', '8n');
                    } if(afaf[2] == "la" & bfbf[2] == 3){
                        synth.triggerAttackRelease('A3', '8n');
                    } if(afaf[2] == "la" & bfbf[2] == 4){
                        synth.triggerAttackRelease('A4', '8n');
                    } if(afaf[2] == "la" & bfbf[2] == 5){
                        synth.triggerAttackRelease('A5', '8n');
                    } if(afaf[2] == "la" & bfbf[2] == 6){
                        synth.triggerAttackRelease('A6', '8n');
                    } if(afaf[2] == "la" & bfbf[2] == 7){
                        synth.triggerAttackRelease('A7', '8n');
                    } if(afaf[2] == "la" & bfbf[2] == 8){
                        synth.triggerAttackRelease('A8', '8n');
                    }
                    if(afaf[2] == "ti" & bfbf[2] == 1){
                        synth.triggerAttackRelease('B1', '8n');
                    } if(afaf[2] == "ti" & bfbf[2] == 2){
                        synth.triggerAttackRelease('B2', '8n');
                    } if(afaf[2] == "ti" & bfbf[2] == 3){
                        synth.triggerAttackRelease('B3', '8n');
                    } if(afaf[2] == "ti" & bfbf[2] == 4){
                        synth.triggerAttackRelease('B4', '8n');
                    } if(afaf[2] == "ti" & bfbf[2] == 5){
                        synth.triggerAttackRelease('B5', '8n');
                    } if(afaf[2] == "ti" & bfbf[2] == 6){
                        synth.triggerAttackRelease('B6', '8n');
                    } if(afaf[2] == "ti" & bfbf[2] == 7){
                        synth.triggerAttackRelease('B7', '8n');
                    } if(afaf[2] == "ti" & bfbf[2] == 8){
                        synth.triggerAttackRelease('B8', '8n');
                    }



                    if(afaf[2] == "do♯" & bfbf[2] == 1){
                        synth.triggerAttackRelease('C#1', '8n');
                    } if(afaf[2] == "do♯" & bfbf[2] == 2){
                        synth.triggerAttackRelease('C#2', '8n');
                    } if(afaf[2] == "do♯" & bfbf[2] == 3){
                        synth.triggerAttackRelease('C#3', '8n');
                    } if(afaf[2] == "do♯" & bfbf[2] == 4){
                        synth.triggerAttackRelease('C#4', '8n');
                    } if(afaf[2] == "do♯" & bfbf[2] == 5){
                        synth.triggerAttackRelease('C#5', '8n');
                    } if(afaf[2] == "do♯" & bfbf[2] == 6){
                        synth.triggerAttackRelease('C#6', '8n');
                    } if(afaf[2] == "do♯" & bfbf[2] == 7){
                        synth.triggerAttackRelease('C#7', '8n');
                    } if(afaf[2] == "do♯" & bfbf[2] == 8){
                        synth.triggerAttackRelease('C#8', '8n');
                    }
                    if(afaf[2] == "re♯" & bfbf[2] == 1){
                        synth.triggerAttackRelease('D#1', '8n');
                    } if(afaf[2] == "re♯" & bfbf[2] == 2){
                        synth.triggerAttackRelease('D#2', '8n');
                    } if(afaf[2] == "re♯" & bfbf[2] == 3){
                        synth.triggerAttackRelease('D#3', '8n');
                    } if(afaf[2] == "re♯" & bfbf[2] == 4){
                        synth.triggerAttackRelease('D#4', '8n');
                    } if(afaf[2] == "re♯" & bfbf[2] == 5){
                        synth.triggerAttackRelease('D#5', '8n');
                    } if(afaf[2] == "re♯" & bfbf[2] == 6){
                        synth.triggerAttackRelease('D#6', '8n');
                    } if(afaf[2] == "re♯" & bfbf[2] == 7){
                        synth.triggerAttackRelease('D#7', '8n');
                    } if(afaf[2] == "re♯" & bfbf[2] == 8){
                        synth.triggerAttackRelease('D#8', '8n');
                    }
                    if(afaf[2] == "mi♯" & bfbf[2] == 1){
                        synth.triggerAttackRelease('E#1', '8n');
                    } if(afaf[2] == "mi♯" & bfbf[2] == 2){
                        synth.triggerAttackRelease('E#2', '8n');
                    } if(afaf[2] == "mi♯" & bfbf[2] == 3){
                        synth.triggerAttackRelease('E#3', '8n');
                    } if(afaf[2] == "mi♯" & bfbf[2] == 4){
                        synth.triggerAttackRelease('E#4', '8n');
                    } if(afaf[2] == "mi♯" & bfbf[2] == 5){
                        synth.triggerAttackRelease('E#5', '8n');
                    } if(afaf[2] == "mi♯" & bfbf[2] == 6){
                        synth.triggerAttackRelease('E#6', '8n');
                    } if(afaf[2] == "mi♯" & bfbf[2] == 7){
                        synth.triggerAttackRelease('E#7', '8n');
                    } if(afaf[2] == "mi♯" & bfbf[2] == 8){
                        synth.triggerAttackRelease('E#8', '8n');
                    }
                    if(afaf[2] == "fa♯" & bfbf[2] == 1){
                        synth.triggerAttackRelease('F#1', '8n');
                    } if(afaf[2] == "fa♯" & bfbf[2] == 2){
                        synth.triggerAttackRelease('F#2', '8n');
                    } if(afaf[2] == "fa♯" & bfbf[2] == 3){
                        synth.triggerAttackRelease('F#3', '8n');
                    } if(afaf[2] == "fa♯" & bfbf[2] == 4){
                        synth.triggerAttackRelease('F#4', '8n');
                    } if(afaf[2] == "fa♯" & bfbf[2] == 5){
                        synth.triggerAttackRelease('F#5', '8n');
                    } if(afaf[2] == "fa♯" & bfbf[2] == 6){
                        synth.triggerAttackRelease('F#6', '8n');
                    } if(afaf[2] == "fa♯" & bfbf[2] == 7){
                        synth.triggerAttackRelease('F#7', '8n');
                    } if(afaf[2] == "fa♯" & bfbf[2] == 8){
                        synth.triggerAttackRelease('F#8', '8n');
                    }
                    if(afaf[2] == "sol♯" & bfbf[2] == 1){
                        synth.triggerAttackRelease('G#1', '8n');
                    } if(afaf[2] == "sol♯" & bfbf[2] == 2){
                        synth.triggerAttackRelease('G#2', '8n');
                    } if(afaf[2] == "sol♯" & bfbf[2] == 3){
                        synth.triggerAttackRelease('G#3', '8n');
                    } if(afaf[2] == "sol♯" & bfbf[2] == 4){
                        synth.triggerAttackRelease('G#4', '8n');
                    } if(afaf[2] == "sol♯" & bfbf[2] == 5){
                        synth.triggerAttackRelease('G#5', '8n');
                    } if(afaf[2] == "sol♯" & bfbf[2] == 6){
                        synth.triggerAttackRelease('G#6', '8n');
                    } if(afaf[2] == "sol♯" & bfbf[2] == 7){
                        synth.triggerAttackRelease('G#7', '8n');
                    } if(afaf[2] == "sol♯" & bfbf[2] == 8){
                        synth.triggerAttackRelease('G#8', '8n');
                    }
                    if(afaf[2] == "la♯" & bfbf[2] == 1){
                        synth.triggerAttackRelease('A#1', '8n');
                    } if(afaf[2] == "la♯" & bfbf[2] == 2){
                        synth.triggerAttackRelease('A#2', '8n');
                    } if(afaf[2] == "la♯" & bfbf[2] == 3){
                        synth.triggerAttackRelease('A#3', '8n');
                    } if(afaf[2] == "la♯" & bfbf[2] == 4){
                        synth.triggerAttackRelease('A#4', '8n');
                    } if(afaf[2] == "la♯" & bfbf[2] == 5){
                        synth.triggerAttackRelease('A#5', '8n');
                    } if(afaf[2] == "la♯" & bfbf[2] == 6){
                        synth.triggerAttackRelease('A#6', '8n');
                    } if(afaf[2] == "la♯" & bfbf[2] == 7){
                        synth.triggerAttackRelease('A#7', '8n');
                    } if(afaf[2] == "la♯" & bfbf[2] == 8){
                        synth.triggerAttackRelease('A#8', '8n');
                    }
                    if(afaf[2] == "ti♯" & bfbf[2] == 1){
                        synth.triggerAttackRelease('B#1', '8n');
                    } if(afaf[2] == "ti♯" & bfbf[2] == 2){
                        synth.triggerAttackRelease('B#2', '8n');
                    } if(afaf[2] == "ti♯" & bfbf[2] == 3){
                        synth.triggerAttackRelease('B#3', '8n');
                    } if(afaf[2] == "ti♯" & bfbf[2] == 4){
                        synth.triggerAttackRelease('B#4', '8n');
                    } if(afaf[2] == "ti♯" & bfbf[2] == 5){
                        synth.triggerAttackRelease('B#5', '8n');
                    } if(afaf[2] == "ti♯" & bfbf[2] == 6){
                        synth.triggerAttackRelease('B#6', '8n');
                    } if(afaf[2] == "ti♯" & bfbf[2] == 7){
                        synth.triggerAttackRelease('B#7', '8n');
                    } if(afaf[2] == "ti♯" & bfbf[2] == 8){
                        synth.triggerAttackRelease('B#8', '8n');
                    }
                };
            }

            if(idContainer.length > 3){

                document.getElementById(idContainer[3]).onclick = function(){

                    var temp1 = afaf[3];
                    var temp2 = noteConversion2[temp1]+bfbf[3];
                    console.log("onkeypress " +temp2) ;
                    selected1.push(temp2);

                    if(afaf[3] == "do" & bfbf[3] == 1){
                        synth.triggerAttackRelease('C1', '8n');
                    } if(afaf[3] == "do" & bfbf[3] == 2){
                        synth.triggerAttackRelease('C2', '8n');
                    } if(afaf[3] == "do" & bfbf[3] == 3){
                        synth.triggerAttackRelease('C3', '8n');
                    } if(afaf[3] == "do" & bfbf[3] == 4){
                        synth.triggerAttackRelease('C4', '8n');
                    } if(afaf[3] == "do" & bfbf[3] == 5){
                        synth.triggerAttackRelease('C5', '8n');
                    } if(afaf[3] == "do" & bfbf[3] == 6){
                        synth.triggerAttackRelease('C6', '8n');
                    } if(afaf[3] == "do" & bfbf[3] == 7){
                        synth.triggerAttackRelease('C7', '8n');
                    } if(afaf[3] == "do" & bfbf[3] == 8){
                        synth.triggerAttackRelease('C8', '8n');
                    }
                    if(afaf[3] == "re" & bfbf[3] == 1){
                        synth.triggerAttackRelease('D1', '8n');
                    } if(afaf[3] == "re" & bfbf[3] == 2){
                        synth.triggerAttackRelease('D2', '8n');
                    } if(afaf[3] == "re" & bfbf[3] == 3){
                        synth.triggerAttackRelease('D3', '8n');
                    } if(afaf[3] == "re" & bfbf[3] == 4){
                        synth.triggerAttackRelease('D4', '8n');
                    } if(afaf[3] == "re" & bfbf[3] == 5){
                        synth.triggerAttackRelease('D5', '8n');
                    } if(afaf[3] == "re" & bfbf[3] == 6){
                        synth.triggerAttackRelease('D6', '8n');
                    } if(afaf[3] == "re" & bfbf[3] == 7){
                        synth.triggerAttackRelease('D7', '8n');
                    } if(afaf[3] == "re" & bfbf[3] == 8){
                        synth.triggerAttackRelease('D8', '8n');
                    }
                    if(afaf[3] == "mi" & bfbf[3] == 1){
                        synth.triggerAttackRelease('E1', '8n');
                    } if(afaf[3] == "mi" & bfbf[3] == 2){
                        synth.triggerAttackRelease('E2', '8n');
                    } if(afaf[3] == "mi" & bfbf[3] == 3){
                        synth.triggerAttackRelease('E3', '8n');
                    } if(afaf[3] == "mi" & bfbf[3] == 4){
                        synth.triggerAttackRelease('E4', '8n');
                    } if(afaf[3] == "mi" & bfbf[3] == 5){
                        synth.triggerAttackRelease('E5', '8n');
                    } if(afaf[3] == "mi" & bfbf[3] == 6){
                        synth.triggerAttackRelease('E6', '8n');
                    } if(afaf[3] == "mi" & bfbf[3] == 7){
                        synth.triggerAttackRelease('E7', '8n');
                    } if(afaf[3] == "mi" & bfbf[3] == 8){
                        synth.triggerAttackRelease('E8', '8n');
                    }
                    if(afaf[3] == "fa" & bfbf[3] == 1){
                        synth.triggerAttackRelease('F1', '8n');
                    } if(afaf[3] == "fa" & bfbf[3] == 2){
                        synth.triggerAttackRelease('F2', '8n');
                    } if(afaf[3] == "fa" & bfbf[3] == 3){
                        synth.triggerAttackRelease('F3', '8n');
                    } if(afaf[3] == "fa" & bfbf[3] == 4){
                        synth.triggerAttackRelease('F4', '8n');
                    } if(afaf[3] == "fa" & bfbf[3] == 5){
                        synth.triggerAttackRelease('F5', '8n');
                    } if(afaf[3] == "fa" & bfbf[3] == 6){
                        synth.triggerAttackRelease('F6', '8n');
                    } if(afaf[3] == "fa" & bfbf[3] == 7){
                        synth.triggerAttackRelease('F7', '8n');
                    } if(afaf[3] == "fa" & bfbf[3] == 8){
                        synth.triggerAttackRelease('8', '8n');
                    }
                    if(afaf[3] == "sol" & bfbf[3] == 1){
                        synth.triggerAttackRelease('G1', '8n');
                    } if(afaf[3] == "sol" & bfbf[3] == 2){
                        synth.triggerAttackRelease('G2', '8n');
                    } if(afaf[3] == "sol" & bfbf[3] == 3){
                        synth.triggerAttackRelease('G3', '8n');
                    } if(afaf[3] == "sol" & bfbf[3] == 4){
                        synth.triggerAttackRelease('G4', '8n');
                    } if(afaf[3] == "sol" & bfbf[3] == 5){
                        synth.triggerAttackRelease('G5', '8n');
                    } if(afaf[3] == "sol" & bfbf[3] == 6){
                        synth.triggerAttackRelease('G6', '8n');
                    } if(afaf[3] == "sol" & bfbf[3] == 7){
                        synth.triggerAttackRelease('G7', '8n');
                    } if(afaf[3] == "sol" & bfbf[3] == 8){
                        synth.triggerAttackRelease('G8', '8n');
                    }
                    if(afaf[3] == "la" & bfbf[3] == 1){
                        synth.triggerAttackRelease('A1', '8n');
                    } if(afaf[3] == "la" & bfbf[3] == 2){
                        synth.triggerAttackRelease('A2', '8n');
                    } if(afaf[3] == "la" & bfbf[3] == 3){
                        synth.triggerAttackRelease('A3', '8n');
                    } if(afaf[3] == "la" & bfbf[3] == 4){
                        synth.triggerAttackRelease('A4', '8n');
                    } if(afaf[3] == "la" & bfbf[3] == 5){
                        synth.triggerAttackRelease('A5', '8n');
                    } if(afaf[3] == "la" & bfbf[3] == 6){
                        synth.triggerAttackRelease('A6', '8n');
                    } if(afaf[3] == "la" & bfbf[3] == 7){
                        synth.triggerAttackRelease('A7', '8n');
                    } if(afaf[3] == "la" & bfbf[3] == 8){
                        synth.triggerAttackRelease('A8', '8n');
                    }
                    if(afaf[3] == "ti" & bfbf[3] == 1){
                        synth.triggerAttackRelease('B1', '8n');
                    } if(afaf[3] == "ti" & bfbf[3] == 2){
                        synth.triggerAttackRelease('B2', '8n');
                    } if(afaf[3] == "ti" & bfbf[3] == 3){
                        synth.triggerAttackRelease('B3', '8n');
                    } if(afaf[3] == "ti" & bfbf[3] == 4){
                        synth.triggerAttackRelease('B4', '8n');
                    } if(afaf[3] == "ti" & bfbf[3] == 5){
                        synth.triggerAttackRelease('B5', '8n');
                    } if(afaf[3] == "ti" & bfbf[3] == 6){
                        synth.triggerAttackRelease('B6', '8n');
                    } if(afaf[3] == "ti" & bfbf[3] == 7){
                        synth.triggerAttackRelease('B7', '8n');
                    } if(afaf[3] == "ti" & bfbf[3] == 8){
                        synth.triggerAttackRelease('B8', '8n');
                    }


                    if(afaf[3] == "do♯" & bfbf[3] == 1){
                        synth.triggerAttackRelease('C#1', '8n');
                    } if(afaf[3] == "do♯" & bfbf[3] == 2){
                        synth.triggerAttackRelease('C#2', '8n');
                    } if(afaf[3] == "do♯" & bfbf[3] == 3){
                        synth.triggerAttackRelease('C#3', '8n');
                    } if(afaf[3] == "do♯" & bfbf[3] == 4){
                        synth.triggerAttackRelease('C#4', '8n');
                    } if(afaf[3] == "do♯" & bfbf[3] == 5){
                        synth.triggerAttackRelease('C#5', '8n');
                    } if(afaf[3] == "do♯" & bfbf[3] == 6){
                        synth.triggerAttackRelease('C#6', '8n');
                    } if(afaf[3] == "do♯" & bfbf[3] == 7){
                        synth.triggerAttackRelease('C#7', '8n');
                    } if(afaf[3] == "do♯" & bfbf[3] == 8){
                        synth.triggerAttackRelease('C#8', '8n');
                    }
                    if(afaf[3] == "re♯" & bfbf[3] == 1){
                        synth.triggerAttackRelease('D#1', '8n');
                    } if(afaf[3] == "re♯" & bfbf[3] == 2){
                        synth.triggerAttackRelease('D#2', '8n');
                    } if(afaf[3] == "re♯" & bfbf[3] == 3){
                        synth.triggerAttackRelease('D#3', '8n');
                    } if(afaf[3] == "re♯" & bfbf[3] == 4){
                        synth.triggerAttackRelease('D#4', '8n');
                    } if(afaf[3] == "re♯" & bfbf[3] == 5){
                        synth.triggerAttackRelease('D#5', '8n');
                    } if(afaf[3] == "re♯" & bfbf[3] == 6){
                        synth.triggerAttackRelease('D#6', '8n');
                    } if(afaf[3] == "re♯" & bfbf[3] == 7){
                        synth.triggerAttackRelease('D#7', '8n');
                    } if(afaf[3] == "re♯" & bfbf[3] == 8){
                        synth.triggerAttackRelease('D#8', '8n');
                    }
                    if(afaf[3] == "mi♯" & bfbf[3] == 1){
                        synth.triggerAttackRelease('E#1', '8n');
                    } if(afaf[3] == "mi♯" & bfbf[3] == 2){
                        synth.triggerAttackRelease('E#2', '8n');
                    } if(afaf[3] == "mi♯" & bfbf[3] == 3){
                        synth.triggerAttackRelease('E#3', '8n');
                    } if(afaf[3] == "mi♯" & bfbf[3] == 4){
                        synth.triggerAttackRelease('E#4', '8n');
                    } if(afaf[3] == "mi♯" & bfbf[3] == 5){
                        synth.triggerAttackRelease('E#5', '8n');
                    } if(afaf[3] == "mi♯" & bfbf[3] == 6){
                        synth.triggerAttackRelease('E#6', '8n');
                    } if(afaf[3] == "mi♯" & bfbf[3] == 7){
                        synth.triggerAttackRelease('E#7', '8n');
                    } if(afaf[3] == "mi♯" & bfbf[3] == 8){
                        synth.triggerAttackRelease('E#8', '8n');
                    }
                    if(afaf[3] == "fa♯" & bfbf[3] == 1){
                        synth.triggerAttackRelease('F#1', '8n');
                    } if(afaf[3] == "fa♯" & bfbf[3] == 2){
                        synth.triggerAttackRelease('F#2', '8n');
                    } if(afaf[3] == "fa♯" & bfbf[3] == 3){
                        synth.triggerAttackRelease('F#3', '8n');
                    } if(afaf[3] == "fa♯" & bfbf[3] == 4){
                        synth.triggerAttackRelease('F#4', '8n');
                    } if(afaf[3] == "fa♯" & bfbf[3] == 5){
                        synth.triggerAttackRelease('F#5', '8n');
                    } if(afaf[3] == "fa♯" & bfbf[3] == 6){
                        synth.triggerAttackRelease('F#6', '8n');
                    } if(afaf[3] == "fa♯" & bfbf[3] == 7){
                        synth.triggerAttackRelease('F#7', '8n');
                    } if(afaf[3] == "fa♯" & bfbf[3] == 8){
                        synth.triggerAttackRelease('F#8', '8n');
                    }
                    if(afaf[3] == "sol♯" & bfbf[3] == 1){
                        synth.triggerAttackRelease('G#1', '8n');
                    } if(afaf[3] == "sol♯" & bfbf[3] == 2){
                        synth.triggerAttackRelease('G#2', '8n');
                    } if(afaf[3] == "sol♯" & bfbf[3] == 3){
                        synth.triggerAttackRelease('G#3', '8n');
                    } if(afaf[3] == "sol♯" & bfbf[3] == 4){
                        synth.triggerAttackRelease('G#4', '8n');
                    } if(afaf[3] == "sol♯" & bfbf[3] == 5){
                        synth.triggerAttackRelease('G#5', '8n');
                    } if(afaf[3] == "sol♯" & bfbf[3] == 6){
                        synth.triggerAttackRelease('G#6', '8n');
                    } if(afaf[3] == "sol♯" & bfbf[3] == 7){
                        synth.triggerAttackRelease('G#7', '8n');
                    } if(afaf[3] == "sol♯" & bfbf[3] == 8){
                        synth.triggerAttackRelease('G#8', '8n');
                    }
                    if(afaf[3] == "la♯" & bfbf[3] == 1){
                        synth.triggerAttackRelease('A#1', '8n');
                    } if(afaf[3] == "la♯" & bfbf[3] == 2){
                        synth.triggerAttackRelease('A#2', '8n');
                    } if(afaf[3] == "la♯" & bfbf[3] == 3){
                        synth.triggerAttackRelease('A#3', '8n');
                    } if(afaf[3] == "la♯" & bfbf[3] == 4){
                        synth.triggerAttackRelease('A#4', '8n');
                    } if(afaf[3] == "la♯" & bfbf[3] == 5){
                        synth.triggerAttackRelease('A#5', '8n');
                    } if(afaf[3] == "la♯" & bfbf[3] == 6){
                        synth.triggerAttackRelease('A#6', '8n');
                    } if(afaf[3] == "la♯" & bfbf[3] == 7){
                        synth.triggerAttackRelease('A#7', '8n');
                    } if(afaf[3] == "la♯" & bfbf[3] == 8){
                        synth.triggerAttackRelease('A#8', '8n');
                    }
                    if(afaf[3] == "ti♯" & bfbf[3] == 1){
                        synth.triggerAttackRelease('B#1', '8n');
                    } if(afaf[3] == "ti♯" & bfbf[3] == 2){
                        synth.triggerAttackRelease('B#2', '8n');
                    } if(afaf[3] == "ti♯" & bfbf[3] == 3){
                        synth.triggerAttackRelease('B#3', '8n');
                    } if(afaf[3] == "ti♯" & bfbf[3] == 4){
                        synth.triggerAttackRelease('B#4', '8n');
                    } if(afaf[3] == "ti♯" & bfbf[3] == 5){
                        synth.triggerAttackRelease('B#5', '8n');
                    } if(afaf[3] == "ti♯" & bfbf[3] == 6){
                        synth.triggerAttackRelease('B#6', '8n');
                    } if(afaf[3] == "ti♯" & bfbf[3] == 7){
                        synth.triggerAttackRelease('B#7', '8n');
                    } if(afaf[3] == "ti♯" & bfbf[3] == 8){
                        synth.triggerAttackRelease('B#8', '8n');
                    }
                };
            }

            if(idContainer.length > 4){

                document.getElementById(idContainer[4]).onclick = function(){


                    var temp1 = afaf[4];
                    var temp2 = noteConversion2[temp1]+bfbf[4];
                    console.log("onkeypress " +temp2) ;
                    selected1.push(temp2);

                    if(afaf[4] == "do" & bfbf[4] == 1){
                        synth.triggerAttackRelease('C1', '8n');
                    } if(afaf[4] == "do" & bfbf[4] == 2){
                        synth.triggerAttackRelease('C2', '8n');
                    } if(afaf[4] == "do" & bfbf[4] == 3){
                        synth.triggerAttackRelease('C3', '8n');
                    } if(afaf[4] == "do" & bfbf[4] == 4){
                        synth.triggerAttackRelease('C4', '8n');
                    } if(afaf[4] == "do" & bfbf[4] == 5){
                        synth.triggerAttackRelease('C5', '8n');
                    } if(afaf[4] == "do" & bfbf[4] == 6){
                        synth.triggerAttackRelease('C6', '8n');
                    } if(afaf[4] == "do" & bfbf[4] == 7){
                        synth.triggerAttackRelease('C7', '8n');
                    } if(afaf[4] == "do" & bfbf[4] == 8){
                        synth.triggerAttackRelease('C8', '8n');
                    }
                    if(afaf[4] == "re" & bfbf[4] == 1){
                        synth.triggerAttackRelease('D1', '8n');
                    } if(afaf[4] == "re" & bfbf[4] == 2){
                        synth.triggerAttackRelease('D2', '8n');
                    } if(afaf[4] == "re" & bfbf[4] == 3){
                        synth.triggerAttackRelease('D3', '8n');
                    } if(afaf[4] == "re" & bfbf[4] == 4){
                        synth.triggerAttackRelease('D4', '8n');
                    } if(afaf[4] == "re" & bfbf[4] == 5){
                        synth.triggerAttackRelease('D5', '8n');
                    } if(afaf[4] == "re" & bfbf[4] == 6){
                        synth.triggerAttackRelease('D6', '8n');
                    } if(afaf[4] == "re" & bfbf[4] == 7){
                        synth.triggerAttackRelease('D7', '8n');
                    } if(afaf[4] == "re" & bfbf[4] == 8){
                        synth.triggerAttackRelease('D8', '8n');
                    }
                    if(afaf[4] == "mi" & bfbf[4] == 1){
                        synth.triggerAttackRelease('E1', '8n');
                    } if(afaf[4] == "mi" & bfbf[4] == 2){
                        synth.triggerAttackRelease('E2', '8n');
                    } if(afaf[4] == "mi" & bfbf[4] == 3){
                        synth.triggerAttackRelease('E3', '8n');
                    } if(afaf[4] == "mi" & bfbf[4] == 4){
                        synth.triggerAttackRelease('E4', '8n');
                    } if(afaf[4] == "mi" & bfbf[4] == 5){
                        synth.triggerAttackRelease('E5', '8n');
                    } if(afaf[4] == "mi" & bfbf[4] == 6){
                        synth.triggerAttackRelease('E6', '8n');
                    } if(afaf[4] == "mi" & bfbf[4] == 7){
                        synth.triggerAttackRelease('E7', '8n');
                    } if(afaf[4] == "mi" & bfbf[4] == 8){
                        synth.triggerAttackRelease('E8', '8n');
                    }
                    if(afaf[4] == "fa" & bfbf[4] == 1){
                        synth.triggerAttackRelease('F1', '8n');
                    } if(afaf[4] == "fa" & bfbf[4] == 2){
                        synth.triggerAttackRelease('F2', '8n');
                    } if(afaf[4] == "fa" & bfbf[4] == 3){
                        synth.triggerAttackRelease('F3', '8n');
                    } if(afaf[4] == "fa" & bfbf[4] == 4){
                        synth.triggerAttackRelease('F4', '8n');
                    } if(afaf[4] == "fa" & bfbf[4] == 5){
                        synth.triggerAttackRelease('F5', '8n');
                    } if(afaf[4] == "fa" & bfbf[4] == 6){
                        synth.triggerAttackRelease('F6', '8n');
                    } if(afaf[4] == "fa" & bfbf[4] == 7){
                        synth.triggerAttackRelease('F7', '8n');
                    } if(afaf[4] == "fa" & bfbf[4] == 8){
                        synth.triggerAttackRelease('8', '8n');
                    }
                    if(afaf[4] == "sol" & bfbf[4] == 1){
                        synth.triggerAttackRelease('G1', '8n');
                    } if(afaf[4] == "sol" & bfbf[4] == 2){
                        synth.triggerAttackRelease('G2', '8n');
                    } if(afaf[4] == "sol" & bfbf[4] == 3){
                        synth.triggerAttackRelease('G3', '8n');
                    } if(afaf[4] == "sol" & bfbf[4] == 4){
                        synth.triggerAttackRelease('G4', '8n');
                    } if(afaf[4] == "sol" & bfbf[4] == 5){
                        synth.triggerAttackRelease('G5', '8n');
                    } if(afaf[4] == "sol" & bfbf[4] == 6){
                        synth.triggerAttackRelease('G6', '8n');
                    } if(afaf[4] == "sol" & bfbf[4] == 7){
                        synth.triggerAttackRelease('G7', '8n');
                    } if(afaf[4] == "sol" & bfbf[4] == 8){
                        synth.triggerAttackRelease('G8', '8n');
                    }
                    if(afaf[4] == "la" & bfbf[4] == 1){
                        synth.triggerAttackRelease('A1', '8n');
                    } if(afaf[4] == "la" & bfbf[4] == 2){
                        synth.triggerAttackRelease('A2', '8n');
                    } if(afaf[4] == "la" & bfbf[4] == 3){
                        synth.triggerAttackRelease('A3', '8n');
                    } if(afaf[4] == "la" & bfbf[4] == 4){
                        synth.triggerAttackRelease('A4', '8n');
                    } if(afaf[4] == "la" & bfbf[4] == 5){
                        synth.triggerAttackRelease('A5', '8n');
                    } if(afaf[4] == "la" & bfbf[4] == 6){
                        synth.triggerAttackRelease('A6', '8n');
                    } if(afaf[4] == "la" & bfbf[4] == 7){
                        synth.triggerAttackRelease('A7', '8n');
                    } if(afaf[4] == "la" & bfbf[4] == 8){
                        synth.triggerAttackRelease('A8', '8n');
                    }
                    if(afaf[4] == "ti" & bfbf[4] == 1){
                        synth.triggerAttackRelease('B1', '8n');
                    } if(afaf[4] == "ti" & bfbf[4] == 2){
                        synth.triggerAttackRelease('B2', '8n');
                    } if(afaf[4] == "ti" & bfbf[4] == 3){
                        synth.triggerAttackRelease('B3', '8n');
                    } if(afaf[4] == "ti" & bfbf[4] == 4){
                        synth.triggerAttackRelease('B4', '8n');
                    } if(afaf[4] == "ti" & bfbf[4] == 5){
                        synth.triggerAttackRelease('B5', '8n');
                    } if(afaf[4] == "ti" & bfbf[4] == 6){
                        synth.triggerAttackRelease('B6', '8n');
                    } if(afaf[4] == "ti" & bfbf[4] == 7){
                        synth.triggerAttackRelease('B7', '8n');
                    } if(afaf[4] == "ti" & bfbf[4] == 8){
                        synth.triggerAttackRelease('B8', '8n');
                    }


                    if(afaf[4] == "do♯" & bfbf[4] == 1){
                        synth.triggerAttackRelease('C#1', '8n');
                    } if(afaf[4] == "do♯" & bfbf[4] == 2){
                        synth.triggerAttackRelease('C#2', '8n');
                    } if(afaf[4] == "do♯" & bfbf[4] == 3){
                        synth.triggerAttackRelease('C#3', '8n');
                    } if(afaf[4] == "do♯" & bfbf[4] == 4){
                        synth.triggerAttackRelease('C#4', '8n');
                    } if(afaf[4] == "do♯" & bfbf[4] == 5){
                        synth.triggerAttackRelease('C#5', '8n');
                    } if(afaf[4] == "do♯" & bfbf[4] == 6){
                        synth.triggerAttackRelease('C#6', '8n');
                    } if(afaf[4] == "do♯" & bfbf[4] == 7){
                        synth.triggerAttackRelease('C#7', '8n');
                    } if(afaf[4] == "do♯" & bfbf[4] == 8){
                        synth.triggerAttackRelease('C#8', '8n');
                    }
                    if(afaf[4] == "re♯" & bfbf[4] == 1){
                        synth.triggerAttackRelease('D#1', '8n');
                    } if(afaf[4] == "re♯" & bfbf[4] == 2){
                        synth.triggerAttackRelease('D#2', '8n');
                    } if(afaf[4] == "re♯" & bfbf[4] == 3){
                        synth.triggerAttackRelease('D#3', '8n');
                    } if(afaf[4] == "re♯" & bfbf[4] == 4){
                        synth.triggerAttackRelease('D#4', '8n');
                    } if(afaf[4] == "re♯" & bfbf[4] == 5){
                        synth.triggerAttackRelease('D#5', '8n');
                    } if(afaf[4] == "re♯" & bfbf[4] == 6){
                        synth.triggerAttackRelease('D#6', '8n');
                    } if(afaf[4] == "re♯" & bfbf[4] == 7){
                        synth.triggerAttackRelease('D#7', '8n');
                    } if(afaf[4] == "re♯" & bfbf[4] == 8){
                        synth.triggerAttackRelease('D#8', '8n');
                    }
                    if(afaf[4] == "mi♯" & bfbf[4] == 1){
                        synth.triggerAttackRelease('E#1', '8n');
                    } if(afaf[4] == "mi♯" & bfbf[4] == 2){
                        synth.triggerAttackRelease('E#2', '8n');
                    } if(afaf[4] == "mi♯" & bfbf[4] == 3){
                        synth.triggerAttackRelease('E#3', '8n');
                    } if(afaf[4] == "mi♯" & bfbf[4] == 4){
                        synth.triggerAttackRelease('E#4', '8n');
                    } if(afaf[4] == "mi♯" & bfbf[4] == 5){
                        synth.triggerAttackRelease('E#5', '8n');
                    } if(afaf[4] == "mi♯" & bfbf[4] == 6){
                        synth.triggerAttackRelease('E#6', '8n');
                    } if(afaf[4] == "mi♯" & bfbf[4] == 7){
                        synth.triggerAttackRelease('E#7', '8n');
                    } if(afaf[4] == "mi♯" & bfbf[4] == 8){
                        synth.triggerAttackRelease('E#8', '8n');
                    }
                    if(afaf[4] == "fa♯" & bfbf[4] == 1){
                        synth.triggerAttackRelease('F#1', '8n');
                    } if(afaf[4] == "fa♯" & bfbf[4] == 2){
                        synth.triggerAttackRelease('F#2', '8n');
                    } if(afaf[4] == "fa♯" & bfbf[4] == 3){
                        synth.triggerAttackRelease('F#3', '8n');
                    } if(afaf[4] == "fa♯" & bfbf[4] == 4){
                        synth.triggerAttackRelease('F#4', '8n');
                    } if(afaf[4] == "fa♯" & bfbf[4] == 5){
                        synth.triggerAttackRelease('F#5', '8n');
                    } if(afaf[4] == "fa♯" & bfbf[4] == 6){
                        synth.triggerAttackRelease('F#6', '8n');
                    } if(afaf[4] == "fa♯" & bfbf[4] == 7){
                        synth.triggerAttackRelease('F#7', '8n');
                    } if(afaf[4] == "fa♯" & bfbf[4] == 8){
                        synth.triggerAttackRelease('F#8', '8n');
                    }
                    if(afaf[4] == "sol♯" & bfbf[4] == 1){
                        synth.triggerAttackRelease('G#1', '8n');
                    } if(afaf[4] == "sol♯" & bfbf[4] == 2){
                        synth.triggerAttackRelease('G#2', '8n');
                    } if(afaf[4] == "sol♯" & bfbf[4] == 3){
                        synth.triggerAttackRelease('G#3', '8n');
                    } if(afaf[4] == "sol♯" & bfbf[4] == 4){
                        synth.triggerAttackRelease('G#4', '8n');
                    } if(afaf[4] == "sol♯" & bfbf[4] == 5){
                        synth.triggerAttackRelease('G#5', '8n');
                    } if(afaf[4] == "sol♯" & bfbf[4] == 6){
                        synth.triggerAttackRelease('G#6', '8n');
                    } if(afaf[4] == "sol♯" & bfbf[4] == 7){
                        synth.triggerAttackRelease('G#7', '8n');
                    } if(afaf[4] == "sol♯" & bfbf[4] == 8){
                        synth.triggerAttackRelease('G#8', '8n');
                    }
                    if(afaf[4] == "la♯" & bfbf[4] == 1){
                        synth.triggerAttackRelease('A#1', '8n');
                    } if(afaf[4] == "la♯" & bfbf[4] == 2){
                        synth.triggerAttackRelease('A#2', '8n');
                    } if(afaf[4] == "la♯" & bfbf[4] == 3){
                        synth.triggerAttackRelease('A#3', '8n');
                    } if(afaf[4] == "la♯" & bfbf[4] == 4){
                        synth.triggerAttackRelease('A#4', '8n');
                    } if(afaf[4] == "la♯" & bfbf[4] == 5){
                        synth.triggerAttackRelease('A#5', '8n');
                    } if(afaf[4] == "la♯" & bfbf[4] == 6){
                        synth.triggerAttackRelease('A#6', '8n');
                    } if(afaf[4] == "la♯" & bfbf[4] == 7){
                        synth.triggerAttackRelease('A#7', '8n');
                    } if(afaf[4] == "la♯" & bfbf[4] == 8){
                        synth.triggerAttackRelease('A#8', '8n');
                    }
                    if(afaf[4] == "ti♯" & bfbf[4] == 1){
                        synth.triggerAttackRelease('B#1', '8n');
                    } if(afaf[4] == "ti♯" & bfbf[4] == 2){
                        synth.triggerAttackRelease('B#2', '8n');
                    } if(afaf[4] == "ti♯" & bfbf[4] == 3){
                        synth.triggerAttackRelease('B#3', '8n');
                    } if(afaf[4] == "ti♯" & bfbf[4] == 4){
                        synth.triggerAttackRelease('B#4', '8n');
                    } if(afaf[4] == "ti♯" & bfbf[4] == 5){
                        synth.triggerAttackRelease('B#5', '8n');
                    } if(afaf[4] == "ti♯" & bfbf[4] == 6){
                        synth.triggerAttackRelease('B#6', '8n');
                    } if(afaf[4] == "ti♯" & bfbf[4] == 7){
                        synth.triggerAttackRelease('B#7', '8n');
                    } if(afaf[4] == "ti♯" & bfbf[4] == 8){
                        synth.triggerAttackRelease('B#8', '8n');
                    }
                };
            }

            if(idContainer.length > 5){

                document.getElementById(idContainer[5]).onclick = function(){

                    var temp1 = afaf[5];
                    var temp2 = noteConversion2[temp1]+bfbf[5];
                    console.log("onkeypress " +temp2) ;
                    selected1.push(temp2);

                    if(afaf[5] == "do" & bfbf[5] == 1){
                        synth.triggerAttackRelease('C1', '8n');
                    } if(afaf[5] == "do" & bfbf[5] == 2){
                        synth.triggerAttackRelease('C2', '8n');
                    } if(afaf[5] == "do" & bfbf[5] == 3){
                        synth.triggerAttackRelease('C3', '8n');
                    } if(afaf[5] == "do" & bfbf[5] == 4){
                        synth.triggerAttackRelease('C4', '8n');
                    } if(afaf[5] == "do" & bfbf[5] == 5){
                        synth.triggerAttackRelease('C5', '8n');
                    } if(afaf[5] == "do" & bfbf[5] == 6){
                        synth.triggerAttackRelease('C6', '8n');
                    } if(afaf[5] == "do" & bfbf[5] == 7){
                        synth.triggerAttackRelease('C7', '8n');
                    } if(afaf[5] == "do" & bfbf[5] == 8){
                        synth.triggerAttackRelease('C8', '8n');
                    }
                    if(afaf[5] == "re" & bfbf[5] == 1){
                        synth.triggerAttackRelease('D1', '8n');
                    } if(afaf[5] == "re" & bfbf[5] == 2){
                        synth.triggerAttackRelease('D2', '8n');
                    } if(afaf[5] == "re" & bfbf[5] == 3){
                        synth.triggerAttackRelease('D3', '8n');
                    } if(afaf[5] == "re" & bfbf[5] == 4){
                        synth.triggerAttackRelease('D4', '8n');
                    } if(afaf[5] == "re" & bfbf[5] == 5){
                        synth.triggerAttackRelease('D5', '8n');
                    } if(afaf[5] == "re" & bfbf[5] == 6){
                        synth.triggerAttackRelease('D6', '8n');
                    } if(afaf[5] == "re" & bfbf[5] == 7){
                        synth.triggerAttackRelease('D7', '8n');
                    } if(afaf[5] == "re" & bfbf[5] == 8){
                        synth.triggerAttackRelease('D8', '8n');
                    }
                    if(afaf[5] == "mi" & bfbf[5] == 1){
                        synth.triggerAttackRelease('E1', '8n');
                    } if(afaf[5] == "mi" & bfbf[5] == 2){
                        synth.triggerAttackRelease('E2', '8n');
                    } if(afaf[5] == "mi" & bfbf[5] == 3){
                        synth.triggerAttackRelease('E3', '8n');
                    } if(afaf[5] == "mi" & bfbf[5] == 4){
                        synth.triggerAttackRelease('E4', '8n');
                    } if(afaf[5] == "mi" & bfbf[5] == 5){
                        synth.triggerAttackRelease('E5', '8n');
                    } if(afaf[5] == "mi" & bfbf[5] == 6){
                        synth.triggerAttackRelease('E6', '8n');
                    } if(afaf[5] == "mi" & bfbf[5] == 7){
                        synth.triggerAttackRelease('E7', '8n');
                    } if(afaf[5] == "mi" & bfbf[5] == 8){
                        synth.triggerAttackRelease('E8', '8n');
                    }
                    if(afaf[5] == "fa" & bfbf[5] == 1){
                        synth.triggerAttackRelease('F1', '8n');
                    } if(afaf[5] == "fa" & bfbf[5] == 2){
                        synth.triggerAttackRelease('F2', '8n');
                    } if(afaf[5] == "fa" & bfbf[5] == 3){
                        synth.triggerAttackRelease('F3', '8n');
                    } if(afaf[5] == "fa" & bfbf[5] == 4){
                        synth.triggerAttackRelease('F4', '8n');
                    } if(afaf[5] == "fa" & bfbf[5] == 5){
                        synth.triggerAttackRelease('F5', '8n');
                    } if(afaf[5] == "fa" & bfbf[5] == 6){
                        synth.triggerAttackRelease('F6', '8n');
                    } if(afaf[5] == "fa" & bfbf[5] == 7){
                        synth.triggerAttackRelease('F7', '8n');
                    } if(afaf[5] == "fa" & bfbf[5] == 8){
                        synth.triggerAttackRelease('8', '8n');
                    }
                    if(afaf[5] == "sol" & bfbf[5] == 1){
                        synth.triggerAttackRelease('G1', '8n');
                    } if(afaf[5] == "sol" & bfbf[5] == 2){
                        synth.triggerAttackRelease('G2', '8n');
                    } if(afaf[5] == "sol" & bfbf[5] == 3){
                        synth.triggerAttackRelease('G3', '8n');
                    } if(afaf[5] == "sol" & bfbf[5] == 4){
                        synth.triggerAttackRelease('G4', '8n');
                    } if(afaf[5] == "sol" & bfbf[5] == 5){
                        synth.triggerAttackRelease('G5', '8n');
                    } if(afaf[5] == "sol" & bfbf[5] == 6){
                        synth.triggerAttackRelease('G6', '8n');
                    } if(afaf[5] == "sol" & bfbf[5] == 7){
                        synth.triggerAttackRelease('G7', '8n');
                    } if(afaf[5] == "sol" & bfbf[5] == 8){
                        synth.triggerAttackRelease('G8', '8n');
                    }
                    if(afaf[5] == "la" & bfbf[5] == 1){
                        synth.triggerAttackRelease('A1', '8n');
                    } if(afaf[5] == "la" & bfbf[5] == 2){
                        synth.triggerAttackRelease('A2', '8n');
                    } if(afaf[5] == "la" & bfbf[5] == 3){
                        synth.triggerAttackRelease('A3', '8n');
                    } if(afaf[5] == "la" & bfbf[5] == 4){
                        synth.triggerAttackRelease('A4', '8n');
                    } if(afaf[5] == "la" & bfbf[5] == 5){
                        synth.triggerAttackRelease('A5', '8n');
                    } if(afaf[5] == "la" & bfbf[5] == 6){
                        synth.triggerAttackRelease('A6', '8n');
                    } if(afaf[5] == "la" & bfbf[5] == 7){
                        synth.triggerAttackRelease('A7', '8n');
                    } if(afaf[5] == "la" & bfbf[5] == 8){
                        synth.triggerAttackRelease('A8', '8n');
                    }
                    if(afaf[5] == "ti" & bfbf[5] == 1){
                        synth.triggerAttackRelease('B1', '8n');
                    } if(afaf[5] == "ti" & bfbf[5] == 2){
                        synth.triggerAttackRelease('B2', '8n');
                    } if(afaf[5] == "ti" & bfbf[5] == 3){
                        synth.triggerAttackRelease('B3', '8n');
                    } if(afaf[5] == "ti" & bfbf[5] == 4){
                        synth.triggerAttackRelease('B4', '8n');
                    } if(afaf[5] == "ti" & bfbf[5] == 5){
                        synth.triggerAttackRelease('B5', '8n');
                    } if(afaf[5] == "ti" & bfbf[5] == 6){
                        synth.triggerAttackRelease('B6', '8n');
                    } if(afaf[5] == "ti" & bfbf[5] == 7){
                        synth.triggerAttackRelease('B7', '8n');
                    } if(afaf[5] == "ti" & bfbf[5] == 8){
                        synth.triggerAttackRelease('B8', '8n');
                    }


                    if(afaf[5] == "do♯" & bfbf[5] == 1){
                        synth.triggerAttackRelease('C#1', '8n');
                    } if(afaf[5] == "do♯" & bfbf[5] == 2){
                        synth.triggerAttackRelease('C#2', '8n');
                    } if(afaf[5] == "do♯" & bfbf[5] == 3){
                        synth.triggerAttackRelease('C#3', '8n');
                    } if(afaf[5] == "do♯" & bfbf[5] == 4){
                        synth.triggerAttackRelease('C#4', '8n');
                    } if(afaf[5] == "do♯" & bfbf[5] == 5){
                        synth.triggerAttackRelease('C#5', '8n');
                    } if(afaf[5] == "do♯" & bfbf[5] == 6){
                        synth.triggerAttackRelease('C#6', '8n');
                    } if(afaf[5] == "do♯" & bfbf[5] == 7){
                        synth.triggerAttackRelease('C#7', '8n');
                    } if(afaf[5] == "do♯" & bfbf[5] == 8){
                        synth.triggerAttackRelease('C#8', '8n');
                    }
                    if(afaf[5] == "re♯" & bfbf[5] == 1){
                        synth.triggerAttackRelease('D#1', '8n');
                    } if(afaf[5] == "re♯" & bfbf[5] == 2){
                        synth.triggerAttackRelease('D#2', '8n');
                    } if(afaf[5] == "re♯" & bfbf[5] == 3){
                        synth.triggerAttackRelease('D#3', '8n');
                    } if(afaf[5] == "re♯" & bfbf[5] == 4){
                        synth.triggerAttackRelease('D#4', '8n');
                    } if(afaf[5] == "re♯" & bfbf[5] == 5){
                        synth.triggerAttackRelease('D#5', '8n');
                    } if(afaf[5] == "re♯" & bfbf[5] == 6){
                        synth.triggerAttackRelease('D#6', '8n');
                    } if(afaf[5] == "re♯" & bfbf[5] == 7){
                        synth.triggerAttackRelease('D#7', '8n');
                    } if(afaf[5] == "re♯" & bfbf[5] == 8){
                        synth.triggerAttackRelease('D#8', '8n');
                    }
                    if(afaf[5] == "mi♯" & bfbf[5] == 1){
                        synth.triggerAttackRelease('E#1', '8n');
                    } if(afaf[5] == "mi♯" & bfbf[5] == 2){
                        synth.triggerAttackRelease('E#2', '8n');
                    } if(afaf[5] == "mi♯" & bfbf[5] == 3){
                        synth.triggerAttackRelease('E#3', '8n');
                    } if(afaf[5] == "mi♯" & bfbf[5] == 4){
                        synth.triggerAttackRelease('E#4', '8n');
                    } if(afaf[5] == "mi♯" & bfbf[5] == 5){
                        synth.triggerAttackRelease('E#5', '8n');
                    } if(afaf[5] == "mi♯" & bfbf[5] == 6){
                        synth.triggerAttackRelease('E#6', '8n');
                    } if(afaf[5] == "mi♯" & bfbf[5] == 7){
                        synth.triggerAttackRelease('E#7', '8n');
                    } if(afaf[5] == "mi♯" & bfbf[5] == 8){
                        synth.triggerAttackRelease('E#8', '8n');
                    }
                    if(afaf[5] == "fa♯" & bfbf[5] == 1){
                        synth.triggerAttackRelease('F#1', '8n');
                    } if(afaf[5] == "fa♯" & bfbf[5] == 2){
                        synth.triggerAttackRelease('F#2', '8n');
                    } if(afaf[5] == "fa♯" & bfbf[5] == 3){
                        synth.triggerAttackRelease('F#3', '8n');
                    } if(afaf[5] == "fa♯" & bfbf[5] == 4){
                        synth.triggerAttackRelease('F#4', '8n');
                    } if(afaf[5] == "fa♯" & bfbf[5] == 5){
                        synth.triggerAttackRelease('F#5', '8n');
                    } if(afaf[5] == "fa♯" & bfbf[5] == 6){
                        synth.triggerAttackRelease('F#6', '8n');
                    } if(afaf[5] == "fa♯" & bfbf[5] == 7){
                        synth.triggerAttackRelease('F#7', '8n');
                    } if(afaf[5] == "fa♯" & bfbf[5] == 8){
                        synth.triggerAttackRelease('F#8', '8n');
                    }
                    if(afaf[5] == "sol♯" & bfbf[5] == 1){
                        synth.triggerAttackRelease('G#1', '8n');
                    } if(afaf[5] == "sol♯" & bfbf[5] == 2){
                        synth.triggerAttackRelease('G#2', '8n');
                    } if(afaf[5] == "sol♯" & bfbf[5] == 3){
                        synth.triggerAttackRelease('G#3', '8n');
                    } if(afaf[5] == "sol♯" & bfbf[5] == 4){
                        synth.triggerAttackRelease('G#4', '8n');
                    } if(afaf[5] == "sol♯" & bfbf[5] == 5){
                        synth.triggerAttackRelease('G#5', '8n');
                    } if(afaf[5] == "sol♯" & bfbf[5] == 6){
                        synth.triggerAttackRelease('G#6', '8n');
                    } if(afaf[5] == "sol♯" & bfbf[5] == 7){
                        synth.triggerAttackRelease('G#7', '8n');
                    } if(afaf[5] == "sol♯" & bfbf[5] == 8){
                        synth.triggerAttackRelease('G#8', '8n');
                    }
                    if(afaf[5] == "la♯" & bfbf[5] == 1){
                        synth.triggerAttackRelease('A#1', '8n');
                    } if(afaf[5] == "la♯" & bfbf[5] == 2){
                        synth.triggerAttackRelease('A#2', '8n');
                    } if(afaf[5] == "la♯" & bfbf[5] == 3){
                        synth.triggerAttackRelease('A#3', '8n');
                    } if(afaf[5] == "la♯" & bfbf[5] == 4){
                        synth.triggerAttackRelease('A#4', '8n');
                    } if(afaf[5] == "la♯" & bfbf[5] == 5){
                        synth.triggerAttackRelease('A#5', '8n');
                    } if(afaf[5] == "la♯" & bfbf[5] == 6){
                        synth.triggerAttackRelease('A#6', '8n');
                    } if(afaf[5] == "la♯" & bfbf[5] == 7){
                        synth.triggerAttackRelease('A#7', '8n');
                    } if(afaf[5] == "la♯" & bfbf[5] == 8){
                        synth.triggerAttackRelease('A#8', '8n');
                    }
                    if(afaf[5] == "ti♯" & bfbf[5] == 1){
                        synth.triggerAttackRelease('B#1', '8n');
                    } if(afaf[5] == "ti♯" & bfbf[5] == 2){
                        synth.triggerAttackRelease('B#2', '8n');
                    } if(afaf[5] == "ti♯" & bfbf[5] == 3){
                        synth.triggerAttackRelease('B#3', '8n');
                    } if(afaf[5] == "ti♯" & bfbf[5] == 4){
                        synth.triggerAttackRelease('B#4', '8n');
                    } if(afaf[5] == "ti♯" & bfbf[5] == 5){
                        synth.triggerAttackRelease('B#5', '8n');
                    } if(afaf[5] == "ti♯" & bfbf[5] == 6){
                        synth.triggerAttackRelease('B#6', '8n');
                    } if(afaf[5] == "ti♯" & bfbf[5] == 7){
                        synth.triggerAttackRelease('B#7', '8n');
                    } if(afaf[5] == "ti♯" & bfbf[5] == 8){
                        synth.triggerAttackRelease('B#8', '8n');
                    }
                };
            }

            if(idContainer.length > 6){

                document.getElementById(idContainer[6]).onclick = function(){

                    var temp1 = afaf[6];
                    var temp2 = noteConversion2[temp1]+bfbf[6];
                    console.log("onkeypress " +temp2) ;
                    selected1.push(temp2);

                    if(afaf[6] == "do" & bfbf[6] == 1){
                        synth.triggerAttackRelease('C1', '8n');
                    } if(afaf[6] == "do" & bfbf[6] == 2){
                        synth.triggerAttackRelease('C2', '8n');
                    } if(afaf[6] == "do" & bfbf[6] == 3){
                        synth.triggerAttackRelease('C3', '8n');
                    } if(afaf[6] == "do" & bfbf[6] == 4){
                        synth.triggerAttackRelease('C4', '8n');
                    } if(afaf[6] == "do" & bfbf[6] == 5){
                        synth.triggerAttackRelease('C5', '8n');
                    } if(afaf[6] == "do" & bfbf[6] == 6){
                        synth.triggerAttackRelease('C6', '8n');
                    } if(afaf[6] == "do" & bfbf[6] == 7){
                        synth.triggerAttackRelease('C7', '8n');
                    } if(afaf[6] == "do" & bfbf[6] == 8){
                        synth.triggerAttackRelease('C8', '8n');
                    }
                    if(afaf[6] == "re" & bfbf[6] == 1){
                        synth.triggerAttackRelease('D1', '8n');
                    } if(afaf[6] == "re" & bfbf[6] == 2){
                        synth.triggerAttackRelease('D2', '8n');
                    } if(afaf[6] == "re" & bfbf[6] == 3){
                        synth.triggerAttackRelease('D3', '8n');
                    } if(afaf[6] == "re" & bfbf[6] == 4){
                        synth.triggerAttackRelease('D4', '8n');
                    } if(afaf[6] == "re" & bfbf[6] == 5){
                        synth.triggerAttackRelease('D5', '8n');
                    } if(afaf[6] == "re" & bfbf[6] == 6){
                        synth.triggerAttackRelease('D6', '8n');
                    } if(afaf[6] == "re" & bfbf[6] == 7){
                        synth.triggerAttackRelease('D7', '8n');
                    } if(afaf[6] == "re" & bfbf[6] == 8){
                        synth.triggerAttackRelease('D8', '8n');
                    }
                    if(afaf[6] == "mi" & bfbf[6] == 1){
                        synth.triggerAttackRelease('E1', '8n');
                    } if(afaf[6] == "mi" & bfbf[6] == 2){
                        synth.triggerAttackRelease('E2', '8n');
                    } if(afaf[6] == "mi" & bfbf[6] == 3){
                        synth.triggerAttackRelease('E3', '8n');
                    } if(afaf[6] == "mi" & bfbf[6] == 4){
                        synth.triggerAttackRelease('E4', '8n');
                    } if(afaf[6] == "mi" & bfbf[6] == 5){
                        synth.triggerAttackRelease('E5', '8n');
                    } if(afaf[6] == "mi" & bfbf[6] == 6){
                        synth.triggerAttackRelease('E6', '8n');
                    } if(afaf[6] == "mi" & bfbf[6] == 7){
                        synth.triggerAttackRelease('E7', '8n');
                    } if(afaf[6] == "mi" & bfbf[6] == 8){
                        synth.triggerAttackRelease('E8', '8n');
                    }
                    if(afaf[6] == "fa" & bfbf[6] == 1){
                        synth.triggerAttackRelease('F1', '8n');
                    } if(afaf[6] == "fa" & bfbf[6] == 2){
                        synth.triggerAttackRelease('F2', '8n');
                    } if(afaf[6] == "fa" & bfbf[6] == 3){
                        synth.triggerAttackRelease('F3', '8n');
                    } if(afaf[6] == "fa" & bfbf[6] == 4){
                        synth.triggerAttackRelease('F4', '8n');
                    } if(afaf[6] == "fa" & bfbf[6] == 5){
                        synth.triggerAttackRelease('F5', '8n');
                    } if(afaf[6] == "fa" & bfbf[6] == 6){
                        synth.triggerAttackRelease('F6', '8n');
                    } if(afaf[6] == "fa" & bfbf[6] == 7){
                        synth.triggerAttackRelease('F7', '8n');
                    } if(afaf[6] == "fa" & bfbf[6] == 8){
                        synth.triggerAttackRelease('8', '8n');
                    }
                    if(afaf[6] == "sol" & bfbf[6] == 1){
                        synth.triggerAttackRelease('G1', '8n');
                    } if(afaf[6] == "sol" & bfbf[6] == 2){
                        synth.triggerAttackRelease('G2', '8n');
                    } if(afaf[6] == "sol" & bfbf[6] == 3){
                        synth.triggerAttackRelease('G3', '8n');
                    } if(afaf[6] == "sol" & bfbf[6] == 4){
                        synth.triggerAttackRelease('G4', '8n');
                    } if(afaf[6] == "sol" & bfbf[6] == 5){
                        synth.triggerAttackRelease('G5', '8n');
                    } if(afaf[6] == "sol" & bfbf[6] == 6){
                        synth.triggerAttackRelease('G6', '8n');
                    } if(afaf[6] == "sol" & bfbf[6] == 7){
                        synth.triggerAttackRelease('G7', '8n');
                    } if(afaf[6] == "sol" & bfbf[6] == 8){
                        synth.triggerAttackRelease('G8', '8n');
                    }
                    if(afaf[6] == "la" & bfbf[6] == 1){
                        synth.triggerAttackRelease('A1', '8n');
                    } if(afaf[6] == "la" & bfbf[6] == 2){
                        synth.triggerAttackRelease('A2', '8n');
                    } if(afaf[6] == "la" & bfbf[6] == 3){
                        synth.triggerAttackRelease('A3', '8n');
                    } if(afaf[6] == "la" & bfbf[6] == 4){
                        synth.triggerAttackRelease('A4', '8n');
                    } if(afaf[6] == "la" & bfbf[6] == 5){
                        synth.triggerAttackRelease('A5', '8n');
                    } if(afaf[6] == "la" & bfbf[6] == 6){
                        synth.triggerAttackRelease('A6', '8n');
                    } if(afaf[6] == "la" & bfbf[6] == 7){
                        synth.triggerAttackRelease('A7', '8n');
                    } if(afaf[6] == "la" & bfbf[6] == 8){
                        synth.triggerAttackRelease('A8', '8n');
                    }
                    if(afaf[6] == "ti" & bfbf[6] == 1){
                        synth.triggerAttackRelease('B1', '8n');
                    } if(afaf[6] == "ti" & bfbf[6] == 2){
                        synth.triggerAttackRelease('B2', '8n');
                    } if(afaf[6] == "ti" & bfbf[6] == 3){
                        synth.triggerAttackRelease('B3', '8n');
                    } if(afaf[6] == "ti" & bfbf[6] == 4){
                        synth.triggerAttackRelease('B4', '8n');
                    } if(afaf[6] == "ti" & bfbf[6] == 5){
                        synth.triggerAttackRelease('B5', '8n');
                    } if(afaf[6] == "ti" & bfbf[6] == 6){
                        synth.triggerAttackRelease('B6', '8n');
                    } if(afaf[6] == "ti" & bfbf[6] == 7){
                        synth.triggerAttackRelease('B7', '8n');
                    } if(afaf[6] == "ti" & bfbf[6] == 8){
                        synth.triggerAttackRelease('B8', '8n');
                    }


                    if(afaf[6] == "do♯" & bfbf[6] == 1){
                        synth.triggerAttackRelease('C#1', '8n');
                    } if(afaf[6] == "do♯" & bfbf[6] == 2){
                        synth.triggerAttackRelease('C#2', '8n');
                    } if(afaf[6] == "do♯" & bfbf[6] == 3){
                        synth.triggerAttackRelease('C#3', '8n');
                    } if(afaf[6] == "do♯" & bfbf[6] == 4){
                        synth.triggerAttackRelease('C#4', '8n');
                    } if(afaf[6] == "do♯" & bfbf[6] == 5){
                        synth.triggerAttackRelease('C#5', '8n');
                    } if(afaf[6] == "do♯" & bfbf[6] == 6){
                        synth.triggerAttackRelease('C#6', '8n');
                    } if(afaf[6] == "do♯" & bfbf[6] == 7){
                        synth.triggerAttackRelease('C#7', '8n');
                    } if(afaf[6] == "do♯" & bfbf[6] == 8){
                        synth.triggerAttackRelease('C#8', '8n');
                    }
                    if(afaf[6] == "re♯" & bfbf[6] == 1){
                        synth.triggerAttackRelease('D#1', '8n');
                    } if(afaf[6] == "re♯" & bfbf[6] == 2){
                        synth.triggerAttackRelease('D#2', '8n');
                    } if(afaf[6] == "re♯" & bfbf[6] == 3){
                        synth.triggerAttackRelease('D#3', '8n');
                    } if(afaf[6] == "re♯" & bfbf[6] == 4){
                        synth.triggerAttackRelease('D#4', '8n');
                    } if(afaf[6] == "re♯" & bfbf[6] == 5){
                        synth.triggerAttackRelease('D#5', '8n');
                    } if(afaf[6] == "re♯" & bfbf[6] == 6){
                        synth.triggerAttackRelease('D#6', '8n');
                    } if(afaf[6] == "re♯" & bfbf[6] == 7){
                        synth.triggerAttackRelease('D#7', '8n');
                    } if(afaf[6] == "re♯" & bfbf[6] == 8){
                        synth.triggerAttackRelease('D#8', '8n');
                    }
                    if(afaf[6] == "mi♯" & bfbf[6] == 1){
                        synth.triggerAttackRelease('E#1', '8n');
                    } if(afaf[6] == "mi♯" & bfbf[6] == 2){
                        synth.triggerAttackRelease('E#2', '8n');
                    } if(afaf[6] == "mi♯" & bfbf[6] == 3){
                        synth.triggerAttackRelease('E#3', '8n');
                    } if(afaf[6] == "mi♯" & bfbf[6] == 4){
                        synth.triggerAttackRelease('E#4', '8n');
                    } if(afaf[6] == "mi♯" & bfbf[6] == 5){
                        synth.triggerAttackRelease('E#5', '8n');
                    } if(afaf[6] == "mi♯" & bfbf[6] == 6){
                        synth.triggerAttackRelease('E#6', '8n');
                    } if(afaf[6] == "mi♯" & bfbf[6] == 7){
                        synth.triggerAttackRelease('E#7', '8n');
                    } if(afaf[6] == "mi♯" & bfbf[6] == 8){
                        synth.triggerAttackRelease('E#8', '8n');
                    }
                    if(afaf[6] == "fa♯" & bfbf[6] == 1){
                        synth.triggerAttackRelease('F#1', '8n');
                    } if(afaf[6] == "fa♯" & bfbf[6] == 2){
                        synth.triggerAttackRelease('F#2', '8n');
                    } if(afaf[6] == "fa♯" & bfbf[6] == 3){
                        synth.triggerAttackRelease('F#3', '8n');
                    } if(afaf[6] == "fa♯" & bfbf[6] == 4){
                        synth.triggerAttackRelease('F#4', '8n');
                    } if(afaf[6] == "fa♯" & bfbf[6] == 5){
                        synth.triggerAttackRelease('F#5', '8n');
                    } if(afaf[6] == "fa♯" & bfbf[6] == 6){
                        synth.triggerAttackRelease('F#6', '8n');
                    } if(afaf[6] == "fa♯" & bfbf[6] == 7){
                        synth.triggerAttackRelease('F#7', '8n');
                    } if(afaf[6] == "fa♯" & bfbf[6] == 8){
                        synth.triggerAttackRelease('F#8', '8n');
                    }
                    if(afaf[6] == "sol♯" & bfbf[6] == 1){
                        synth.triggerAttackRelease('G#1', '8n');
                    } if(afaf[6] == "sol♯" & bfbf[6] == 2){
                        synth.triggerAttackRelease('G#2', '8n');
                    } if(afaf[6] == "sol♯" & bfbf[6] == 3){
                        synth.triggerAttackRelease('G#3', '8n');
                    } if(afaf[6] == "sol♯" & bfbf[6] == 4){
                        synth.triggerAttackRelease('G#4', '8n');
                    } if(afaf[6] == "sol♯" & bfbf[6] == 5){
                        synth.triggerAttackRelease('G#5', '8n');
                    } if(afaf[6] == "sol♯" & bfbf[6] == 6){
                        synth.triggerAttackRelease('G#6', '8n');
                    } if(afaf[6] == "sol♯" & bfbf[6] == 7){
                        synth.triggerAttackRelease('G#7', '8n');
                    } if(afaf[6] == "sol♯" & bfbf[6] == 8){
                        synth.triggerAttackRelease('G#8', '8n');
                    }
                    if(afaf[6] == "la♯" & bfbf[6] == 1){
                        synth.triggerAttackRelease('A#1', '8n');
                    } if(afaf[6] == "la♯" & bfbf[6] == 2){
                        synth.triggerAttackRelease('A#2', '8n');
                    } if(afaf[6] == "la♯" & bfbf[6] == 3){
                        synth.triggerAttackRelease('A#3', '8n');
                    } if(afaf[6] == "la♯" & bfbf[6] == 4){
                        synth.triggerAttackRelease('A#4', '8n');
                    } if(afaf[6] == "la♯" & bfbf[6] == 5){
                        synth.triggerAttackRelease('A#5', '8n');
                    } if(afaf[6] == "la♯" & bfbf[6] == 6){
                        synth.triggerAttackRelease('A#6', '8n');
                    } if(afaf[6] == "la♯" & bfbf[6] == 7){
                        synth.triggerAttackRelease('A#7', '8n');
                    } if(afaf[6] == "la♯" & bfbf[6] == 8){
                        synth.triggerAttackRelease('A#8', '8n');
                    }
                    if(afaf[6] == "ti♯" & bfbf[6] == 1){
                        synth.triggerAttackRelease('B#1', '8n');
                    } if(afaf[6] == "ti♯" & bfbf[6] == 2){
                        synth.triggerAttackRelease('B#2', '8n');
                    } if(afaf[6] == "ti♯" & bfbf[6] == 3){
                        synth.triggerAttackRelease('B#3', '8n');
                    } if(afaf[6] == "ti♯" & bfbf[6] == 4){
                        synth.triggerAttackRelease('B#4', '8n');
                    } if(afaf[6] == "ti♯" & bfbf[6] == 5){
                        synth.triggerAttackRelease('B#5', '8n');
                    } if(afaf[6] == "ti♯" & bfbf[6] == 6){
                        synth.triggerAttackRelease('B#6', '8n');
                    } if(afaf[6] == "ti♯" & bfbf[6] == 7){
                        synth.triggerAttackRelease('B#7', '8n');
                    } if(afaf[6] == "ti♯" & bfbf[6] == 8){
                        synth.triggerAttackRelease('B#8', '8n');
                    }
                };
            }

            if(idContainer.length > 7){

                document.getElementById(idContainer[7]).onclick = function(){

                    var temp1 = afaf[7];
                    var temp2 = noteConversion2[temp1]+bfbf[7];
                    console.log("onkeypress " +temp2) ;
                    selected1.push(temp2);

                    if(afaf[7] == "do" & bfbf[7] == 1){
                        synth.triggerAttackRelease('C1', '8n');
                    } if(afaf[7] == "do" & bfbf[7] == 2){
                        synth.triggerAttackRelease('C2', '8n');
                    } if(afaf[7] == "do" & bfbf[7] == 3){
                        synth.triggerAttackRelease('C3', '8n');
                    } if(afaf[7] == "do" & bfbf[7] == 4){
                        synth.triggerAttackRelease('C4', '8n');
                    } if(afaf[7] == "do" & bfbf[7] == 5){
                        synth.triggerAttackRelease('C5', '8n');
                    } if(afaf[7] == "do" & bfbf[7] == 6){
                        synth.triggerAttackRelease('C6', '8n');
                    } if(afaf[7] == "do" & bfbf[7] == 7){
                        synth.triggerAttackRelease('C7', '8n');
                    } if(afaf[7] == "do" & bfbf[7] == 8){
                        synth.triggerAttackRelease('C8', '8n');
                    }
                    if(afaf[7] == "re" & bfbf[7] == 1){
                        synth.triggerAttackRelease('D1', '8n');
                    } if(afaf[7] == "re" & bfbf[7] == 2){
                        synth.triggerAttackRelease('D2', '8n');
                    } if(afaf[7] == "re" & bfbf[7] == 3){
                        synth.triggerAttackRelease('D3', '8n');
                    } if(afaf[7] == "re" & bfbf[7] == 4){
                        synth.triggerAttackRelease('D4', '8n');
                    } if(afaf[7] == "re" & bfbf[7] == 5){
                        synth.triggerAttackRelease('D5', '8n');
                    } if(afaf[7] == "re" & bfbf[7] == 6){
                        synth.triggerAttackRelease('D6', '8n');
                    } if(afaf[7] == "re" & bfbf[7] == 7){
                        synth.triggerAttackRelease('D7', '8n');
                    } if(afaf[7] == "re" & bfbf[7] == 8){
                        synth.triggerAttackRelease('D8', '8n');
                    }
                    if(afaf[7] == "mi" & bfbf[7] == 1){
                        synth.triggerAttackRelease('E1', '8n');
                    } if(afaf[7] == "mi" & bfbf[7] == 2){
                        synth.triggerAttackRelease('E2', '8n');
                    } if(afaf[7] == "mi" & bfbf[7] == 3){
                        synth.triggerAttackRelease('E3', '8n');
                    } if(afaf[7] == "mi" & bfbf[7] == 4){
                        synth.triggerAttackRelease('E4', '8n');
                    } if(afaf[7] == "mi" & bfbf[7] == 5){
                        synth.triggerAttackRelease('E5', '8n');
                    } if(afaf[7] == "mi" & bfbf[7] == 6){
                        synth.triggerAttackRelease('E6', '8n');
                    } if(afaf[7] == "mi" & bfbf[7] == 7){
                        synth.triggerAttackRelease('E7', '8n');
                    } if(afaf[7] == "mi" & bfbf[7] == 8){
                        synth.triggerAttackRelease('E8', '8n');
                    }
                    if(afaf[7] == "fa" & bfbf[7] == 1){
                        synth.triggerAttackRelease('F1', '8n');
                    } if(afaf[7] == "fa" & bfbf[7] == 2){
                        synth.triggerAttackRelease('F2', '8n');
                    } if(afaf[7] == "fa" & bfbf[7] == 3){
                        synth.triggerAttackRelease('F3', '8n');
                    } if(afaf[7] == "fa" & bfbf[7] == 4){
                        synth.triggerAttackRelease('F4', '8n');
                    } if(afaf[7] == "fa" & bfbf[7] == 5){
                        synth.triggerAttackRelease('F5', '8n');
                    } if(afaf[7] == "fa" & bfbf[7] == 6){
                        synth.triggerAttackRelease('F6', '8n');
                    } if(afaf[7] == "fa" & bfbf[7] == 7){
                        synth.triggerAttackRelease('F7', '8n');
                    } if(afaf[7] == "fa" & bfbf[7] == 8){
                        synth.triggerAttackRelease('8', '8n');
                    }
                    if(afaf[7] == "sol" & bfbf[7] == 1){
                        synth.triggerAttackRelease('G1', '8n');
                    } if(afaf[7] == "sol" & bfbf[7] == 2){
                        synth.triggerAttackRelease('G2', '8n');
                    } if(afaf[7] == "sol" & bfbf[7] == 3){
                        synth.triggerAttackRelease('G3', '8n');
                    } if(afaf[7] == "sol" & bfbf[7] == 4){
                        synth.triggerAttackRelease('G4', '8n');
                    } if(afaf[7] == "sol" & bfbf[7] == 5){
                        synth.triggerAttackRelease('G5', '8n');
                    } if(afaf[7] == "sol" & bfbf[7] == 6){
                        synth.triggerAttackRelease('G6', '8n');
                    } if(afaf[7] == "sol" & bfbf[7] == 7){
                        synth.triggerAttackRelease('G7', '8n');
                    } if(afaf[7] == "sol" & bfbf[7] == 8){
                        synth.triggerAttackRelease('G8', '8n');
                    }
                    if(afaf[7] == "la" & bfbf[7] == 1){
                        synth.triggerAttackRelease('A1', '8n');
                    } if(afaf[7] == "la" & bfbf[7] == 2){
                        synth.triggerAttackRelease('A2', '8n');
                    } if(afaf[7] == "la" & bfbf[7] == 3){
                        synth.triggerAttackRelease('A3', '8n');
                    } if(afaf[7] == "la" & bfbf[7] == 4){
                        synth.triggerAttackRelease('A4', '8n');
                    } if(afaf[7] == "la" & bfbf[7] == 5){
                        synth.triggerAttackRelease('A5', '8n');
                    } if(afaf[7] == "la" & bfbf[7] == 6){
                        synth.triggerAttackRelease('A6', '8n');
                    } if(afaf[7] == "la" & bfbf[7] == 7){
                        synth.triggerAttackRelease('A7', '8n');
                    } if(afaf[7] == "la" & bfbf[7] == 8){
                        synth.triggerAttackRelease('A8', '8n');
                    }
                    if(afaf[7] == "ti" & bfbf[7] == 1){
                        synth.triggerAttackRelease('B1', '8n');
                    } if(afaf[7] == "ti" & bfbf[7] == 2){
                        synth.triggerAttackRelease('B2', '8n');
                    } if(afaf[7] == "ti" & bfbf[7] == 3){
                        synth.triggerAttackRelease('B3', '8n');
                    } if(afaf[7] == "ti" & bfbf[7] == 4){
                        synth.triggerAttackRelease('B4', '8n');
                    } if(afaf[7] == "ti" & bfbf[7] == 5){
                        synth.triggerAttackRelease('B5', '8n');
                    } if(afaf[7] == "ti" & bfbf[7] == 6){
                        synth.triggerAttackRelease('B6', '8n');
                    } if(afaf[7] == "ti" & bfbf[7] == 7){
                        synth.triggerAttackRelease('B7', '8n');
                    } if(afaf[7] == "ti" & bfbf[7] == 8){
                        synth.triggerAttackRelease('B8', '8n');
                    }


                    if(afaf[7] == "do♯" & bfbf[7] == 1){
                        synth.triggerAttackRelease('C#1', '8n');
                    } if(afaf[7] == "do♯" & bfbf[7] == 2){
                        synth.triggerAttackRelease('C#2', '8n');
                    } if(afaf[7] == "do♯" & bfbf[7] == 3){
                        synth.triggerAttackRelease('C#3', '8n');
                    } if(afaf[7] == "do♯" & bfbf[7] == 4){
                        synth.triggerAttackRelease('C#4', '8n');
                    } if(afaf[7] == "do♯" & bfbf[7] == 5){
                        synth.triggerAttackRelease('C#5', '8n');
                    } if(afaf[7] == "do♯" & bfbf[7] == 6){
                        synth.triggerAttackRelease('C#6', '8n');
                    } if(afaf[7] == "do♯" & bfbf[7] == 7){
                        synth.triggerAttackRelease('C#7', '8n');
                    } if(afaf[7] == "do♯" & bfbf[7] == 8){
                        synth.triggerAttackRelease('C#8', '8n');
                    }
                    if(afaf[7] == "re♯" & bfbf[7] == 1){
                        synth.triggerAttackRelease('D#1', '8n');
                    } if(afaf[7] == "re♯" & bfbf[7] == 2){
                        synth.triggerAttackRelease('D#2', '8n');
                    } if(afaf[7] == "re♯" & bfbf[7] == 3){
                        synth.triggerAttackRelease('D#3', '8n');
                    } if(afaf[7] == "re♯" & bfbf[7] == 4){
                        synth.triggerAttackRelease('D#4', '8n');
                    } if(afaf[7] == "re♯" & bfbf[7] == 5){
                        synth.triggerAttackRelease('D#5', '8n');
                    } if(afaf[7] == "re♯" & bfbf[7] == 6){
                        synth.triggerAttackRelease('D#6', '8n');
                    } if(afaf[7] == "re♯" & bfbf[7] == 7){
                        synth.triggerAttackRelease('D#7', '8n');
                    } if(afaf[7] == "re♯" & bfbf[7] == 8){
                        synth.triggerAttackRelease('D#8', '8n');
                    }
                    if(afaf[7] == "mi♯" & bfbf[7] == 1){
                        synth.triggerAttackRelease('E#1', '8n');
                    } if(afaf[7] == "mi♯" & bfbf[7] == 2){
                        synth.triggerAttackRelease('E#2', '8n');
                    } if(afaf[7] == "mi♯" & bfbf[7] == 3){
                        synth.triggerAttackRelease('E#3', '8n');
                    } if(afaf[7] == "mi♯" & bfbf[7] == 4){
                        synth.triggerAttackRelease('E#4', '8n');
                    } if(afaf[7] == "mi♯" & bfbf[7] == 5){
                        synth.triggerAttackRelease('E#5', '8n');
                    } if(afaf[7] == "mi♯" & bfbf[7] == 6){
                        synth.triggerAttackRelease('E#6', '8n');
                    } if(afaf[7] == "mi♯" & bfbf[7] == 7){
                        synth.triggerAttackRelease('E#7', '8n');
                    } if(afaf[7] == "mi♯" & bfbf[7] == 8){
                        synth.triggerAttackRelease('E#8', '8n');
                    }
                    if(afaf[7] == "fa♯" & bfbf[7] == 1){
                        synth.triggerAttackRelease('F#1', '8n');
                    } if(afaf[7] == "fa♯" & bfbf[7] == 2){
                        synth.triggerAttackRelease('F#2', '8n');
                    } if(afaf[7] == "fa♯" & bfbf[7] == 3){
                        synth.triggerAttackRelease('F#3', '8n');
                    } if(afaf[7] == "fa♯" & bfbf[7] == 4){
                        synth.triggerAttackRelease('F#4', '8n');
                    } if(afaf[7] == "fa♯" & bfbf[7] == 5){
                        synth.triggerAttackRelease('F#5', '8n');
                    } if(afaf[7] == "fa♯" & bfbf[7] == 6){
                        synth.triggerAttackRelease('F#6', '8n');
                    } if(afaf[7] == "fa♯" & bfbf[7] == 7){
                        synth.triggerAttackRelease('F#7', '8n');
                    } if(afaf[7] == "fa♯" & bfbf[7] == 8){
                        synth.triggerAttackRelease('F#8', '8n');
                    }
                    if(afaf[7] == "sol♯" & bfbf[7] == 1){
                        synth.triggerAttackRelease('G#1', '8n');
                    } if(afaf[7] == "sol♯" & bfbf[7] == 2){
                        synth.triggerAttackRelease('G#2', '8n');
                    } if(afaf[7] == "sol♯" & bfbf[7] == 3){
                        synth.triggerAttackRelease('G#3', '8n');
                    } if(afaf[7] == "sol♯" & bfbf[7] == 4){
                        synth.triggerAttackRelease('G#4', '8n');
                    } if(afaf[7] == "sol♯" & bfbf[7] == 5){
                        synth.triggerAttackRelease('G#5', '8n');
                    } if(afaf[7] == "sol♯" & bfbf[7] == 6){
                        synth.triggerAttackRelease('G#6', '8n');
                    } if(afaf[7] == "sol♯" & bfbf[7] == 7){
                        synth.triggerAttackRelease('G#7', '8n');
                    } if(afaf[7] == "sol♯" & bfbf[7] == 8){
                        synth.triggerAttackRelease('G#8', '8n');
                    }
                    if(afaf[7] == "la♯" & bfbf[7] == 1){
                        synth.triggerAttackRelease('A#1', '8n');
                    } if(afaf[7] == "la♯" & bfbf[7] == 2){
                        synth.triggerAttackRelease('A#2', '8n');
                    } if(afaf[7] == "la♯" & bfbf[7] == 3){
                        synth.triggerAttackRelease('A#3', '8n');
                    } if(afaf[7] == "la♯" & bfbf[7] == 4){
                        synth.triggerAttackRelease('A#4', '8n');
                    } if(afaf[7] == "la♯" & bfbf[7] == 5){
                        synth.triggerAttackRelease('A#5', '8n');
                    } if(afaf[7] == "la♯" & bfbf[7] == 6){
                        synth.triggerAttackRelease('A#6', '8n');
                    } if(afaf[7] == "la♯" & bfbf[7] == 7){
                        synth.triggerAttackRelease('A#7', '8n');
                    } if(afaf[7] == "la♯" & bfbf[7] == 8){
                        synth.triggerAttackRelease('A#8', '8n');
                    }
                    if(afaf[7] == "ti♯" & bfbf[7] == 1){
                        synth.triggerAttackRelease('B#1', '8n');
                    } if(afaf[7] == "ti♯" & bfbf[7] == 2){
                        synth.triggerAttackRelease('B#2', '8n');
                    } if(afaf[7] == "ti♯" & bfbf[7] == 3){
                        synth.triggerAttackRelease('B#3', '8n');
                    } if(afaf[7] == "ti♯" & bfbf[7] == 4){
                        synth.triggerAttackRelease('B#4', '8n');
                    } if(afaf[7] == "ti♯" & bfbf[7] == 5){
                        synth.triggerAttackRelease('B#5', '8n');
                    } if(afaf[7] == "ti♯" & bfbf[7] == 6){
                        synth.triggerAttackRelease('B#6', '8n');
                    } if(afaf[7] == "ti♯" & bfbf[7] == 7){
                        synth.triggerAttackRelease('B#7', '8n');
                    } if(afaf[7] == "ti♯" & bfbf[7] == 8){
                        synth.triggerAttackRelease('B#8', '8n');
                    }
                };
            }

            if(idContainer.length > 8){

                document.getElementById(idContainer[8]).onclick = function(){

                    var temp1 = afaf[8];
                    var temp2 = noteConversion2[temp1]+bfbf[8];
                    console.log("onkeypress " +temp2) ;
                    selected1.push(temp2);

                    if(afaf[8] == "do" & bfbf[8] == 1){
                        synth.triggerAttackRelease('C1', '8n');
                    } if(afaf[8] == "do" & bfbf[8] == 2){
                        synth.triggerAttackRelease('C2', '8n');
                    } if(afaf[8] == "do" & bfbf[8] == 3){
                        synth.triggerAttackRelease('C3', '8n');
                    } if(afaf[8] == "do" & bfbf[8] == 4){
                        synth.triggerAttackRelease('C4', '8n');
                    } if(afaf[8] == "do" & bfbf[8] == 5){
                        synth.triggerAttackRelease('C5', '8n');
                    } if(afaf[8] == "do" & bfbf[8] == 6){
                        synth.triggerAttackRelease('C6', '8n');
                    } if(afaf[8] == "do" & bfbf[8] == 7){
                        synth.triggerAttackRelease('C7', '8n');
                    } if(afaf[8] == "do" & bfbf[8] == 8){
                        synth.triggerAttackRelease('C8', '8n');
                    }
                    if(afaf[8] == "re" & bfbf[8] == 1){
                        synth.triggerAttackRelease('D1', '8n');
                    } if(afaf[8] == "re" & bfbf[8] == 2){
                        synth.triggerAttackRelease('D2', '8n');
                    } if(afaf[8] == "re" & bfbf[8] == 3){
                        synth.triggerAttackRelease('D3', '8n');
                    } if(afaf[8] == "re" & bfbf[8] == 4){
                        synth.triggerAttackRelease('D4', '8n');
                    } if(afaf[8] == "re" & bfbf[8] == 5){
                        synth.triggerAttackRelease('D5', '8n');
                    } if(afaf[8] == "re" & bfbf[8] == 6){
                        synth.triggerAttackRelease('D6', '8n');
                    } if(afaf[8] == "re" & bfbf[8] == 7){
                        synth.triggerAttackRelease('D7', '8n');
                    } if(afaf[8] == "re" & bfbf[8] == 8){
                        synth.triggerAttackRelease('D8', '8n');
                    }
                    if(afaf[8] == "mi" & bfbf[8] == 1){
                        synth.triggerAttackRelease('E1', '8n');
                    } if(afaf[8] == "mi" & bfbf[8] == 2){
                        synth.triggerAttackRelease('E2', '8n');
                    } if(afaf[8] == "mi" & bfbf[8] == 3){
                        synth.triggerAttackRelease('E3', '8n');
                    } if(afaf[8] == "mi" & bfbf[8] == 4){
                        synth.triggerAttackRelease('E4', '8n');
                    } if(afaf[8] == "mi" & bfbf[8] == 5){
                        synth.triggerAttackRelease('E5', '8n');
                    } if(afaf[8] == "mi" & bfbf[8] == 6){
                        synth.triggerAttackRelease('E6', '8n');
                    } if(afaf[8] == "mi" & bfbf[8] == 7){
                        synth.triggerAttackRelease('E7', '8n');
                    } if(afaf[8] == "mi" & bfbf[8] == 8){
                        synth.triggerAttackRelease('E8', '8n');
                    }
                    if(afaf[8] == "fa" & bfbf[8] == 1){
                        synth.triggerAttackRelease('F1', '8n');
                    } if(afaf[8] == "fa" & bfbf[8] == 2){
                        synth.triggerAttackRelease('F2', '8n');
                    } if(afaf[8] == "fa" & bfbf[8] == 3){
                        synth.triggerAttackRelease('F3', '8n');
                    } if(afaf[8] == "fa" & bfbf[8] == 4){
                        synth.triggerAttackRelease('F4', '8n');
                    } if(afaf[8] == "fa" & bfbf[8] == 5){
                        synth.triggerAttackRelease('F5', '8n');
                    } if(afaf[8] == "fa" & bfbf[8] == 6){
                        synth.triggerAttackRelease('F6', '8n');
                    } if(afaf[8] == "fa" & bfbf[8] == 7){
                        synth.triggerAttackRelease('F7', '8n');
                    } if(afaf[8] == "fa" & bfbf[8] == 8){
                        synth.triggerAttackRelease('8', '8n');
                    }
                    if(afaf[8] == "sol" & bfbf[8] == 1){
                        synth.triggerAttackRelease('G1', '8n');
                    } if(afaf[8] == "sol" & bfbf[8] == 2){
                        synth.triggerAttackRelease('G2', '8n');
                    } if(afaf[8] == "sol" & bfbf[8] == 3){
                        synth.triggerAttackRelease('G3', '8n');
                    } if(afaf[8] == "sol" & bfbf[8] == 4){
                        synth.triggerAttackRelease('G4', '8n');
                    } if(afaf[8] == "sol" & bfbf[8] == 5){
                        synth.triggerAttackRelease('G5', '8n');
                    } if(afaf[8] == "sol" & bfbf[8] == 6){
                        synth.triggerAttackRelease('G6', '8n');
                    } if(afaf[8] == "sol" & bfbf[8] == 7){
                        synth.triggerAttackRelease('G7', '8n');
                    } if(afaf[8] == "sol" & bfbf[8] == 8){
                        synth.triggerAttackRelease('G8', '8n');
                    }
                    if(afaf[8] == "la" & bfbf[8] == 1){
                        synth.triggerAttackRelease('A1', '8n');
                    } if(afaf[8] == "la" & bfbf[8] == 2){
                        synth.triggerAttackRelease('A2', '8n');
                    } if(afaf[8] == "la" & bfbf[8] == 3){
                        synth.triggerAttackRelease('A3', '8n');
                    } if(afaf[8] == "la" & bfbf[8] == 4){
                        synth.triggerAttackRelease('A4', '8n');
                    } if(afaf[8] == "la" & bfbf[8] == 5){
                        synth.triggerAttackRelease('A5', '8n');
                    } if(afaf[8] == "la" & bfbf[8] == 6){
                        synth.triggerAttackRelease('A6', '8n');
                    } if(afaf[8] == "la" & bfbf[8] == 7){
                        synth.triggerAttackRelease('A7', '8n');
                    } if(afaf[8] == "la" & bfbf[8] == 8){
                        synth.triggerAttackRelease('A8', '8n');
                    }
                    if(afaf[8] == "ti" & bfbf[8] == 1){
                        synth.triggerAttackRelease('B1', '8n');
                    } if(afaf[8] == "ti" & bfbf[8] == 2){
                        synth.triggerAttackRelease('B2', '8n');
                    } if(afaf[8] == "ti" & bfbf[8] == 3){
                        synth.triggerAttackRelease('B3', '8n');
                    } if(afaf[8] == "ti" & bfbf[8] == 4){
                        synth.triggerAttackRelease('B4', '8n');
                    } if(afaf[8] == "ti" & bfbf[8] == 5){
                        synth.triggerAttackRelease('B5', '8n');
                    } if(afaf[8] == "ti" & bfbf[8] == 6){
                        synth.triggerAttackRelease('B6', '8n');
                    } if(afaf[8] == "ti" & bfbf[8] == 7){
                        synth.triggerAttackRelease('B7', '8n');
                    } if(afaf[8] == "ti" & bfbf[8] == 8){
                        synth.triggerAttackRelease('B8', '8n');
                    }


                    if(afaf[8] == "do♯" & bfbf[8] == 1){
                        synth.triggerAttackRelease('C#1', '8n');
                    } if(afaf[8] == "do♯" & bfbf[8] == 2){
                        synth.triggerAttackRelease('C#2', '8n');
                    } if(afaf[8] == "do♯" & bfbf[8] == 3){
                        synth.triggerAttackRelease('C#3', '8n');
                    } if(afaf[8] == "do♯" & bfbf[8] == 4){
                        synth.triggerAttackRelease('C#4', '8n');
                    } if(afaf[8] == "do♯" & bfbf[8] == 5){
                        synth.triggerAttackRelease('C#5', '8n');
                    } if(afaf[8] == "do♯" & bfbf[8] == 6){
                        synth.triggerAttackRelease('C#6', '8n');
                    } if(afaf[8] == "do♯" & bfbf[8] == 7){
                        synth.triggerAttackRelease('C#7', '8n');
                    } if(afaf[8] == "do♯" & bfbf[8] == 8){
                        synth.triggerAttackRelease('C#8', '8n');
                    }
                    if(afaf[8] == "re♯" & bfbf[8] == 1){
                        synth.triggerAttackRelease('D#1', '8n');
                    } if(afaf[8] == "re♯" & bfbf[8] == 2){
                        synth.triggerAttackRelease('D#2', '8n');
                    } if(afaf[8] == "re♯" & bfbf[8] == 3){
                        synth.triggerAttackRelease('D#3', '8n');
                    } if(afaf[8] == "re♯" & bfbf[8] == 4){
                        synth.triggerAttackRelease('D#4', '8n');
                    } if(afaf[8] == "re♯" & bfbf[8] == 5){
                        synth.triggerAttackRelease('D#5', '8n');
                    } if(afaf[8] == "re♯" & bfbf[8] == 6){
                        synth.triggerAttackRelease('D#6', '8n');
                    } if(afaf[8] == "re♯" & bfbf[8] == 7){
                        synth.triggerAttackRelease('D#7', '8n');
                    } if(afaf[8] == "re♯" & bfbf[8] == 8){
                        synth.triggerAttackRelease('D#8', '8n');
                    }
                    if(afaf[8] == "mi♯" & bfbf[8] == 1){
                        synth.triggerAttackRelease('E#1', '8n');
                    } if(afaf[8] == "mi♯" & bfbf[8] == 2){
                        synth.triggerAttackRelease('E#2', '8n');
                    } if(afaf[8] == "mi♯" & bfbf[8] == 3){
                        synth.triggerAttackRelease('E#3', '8n');
                    } if(afaf[8] == "mi♯" & bfbf[8] == 4){
                        synth.triggerAttackRelease('E#4', '8n');
                    } if(afaf[8] == "mi♯" & bfbf[8] == 5){
                        synth.triggerAttackRelease('E#5', '8n');
                    } if(afaf[8] == "mi♯" & bfbf[8] == 6){
                        synth.triggerAttackRelease('E#6', '8n');
                    } if(afaf[8] == "mi♯" & bfbf[8] == 7){
                        synth.triggerAttackRelease('E#7', '8n');
                    } if(afaf[8] == "mi♯" & bfbf[8] == 8){
                        synth.triggerAttackRelease('E#8', '8n');
                    }
                    if(afaf[8] == "fa♯" & bfbf[8] == 1){
                        synth.triggerAttackRelease('F#1', '8n');
                    } if(afaf[8] == "fa♯" & bfbf[8] == 2){
                        synth.triggerAttackRelease('F#2', '8n');
                    } if(afaf[8] == "fa♯" & bfbf[8] == 3){
                        synth.triggerAttackRelease('F#3', '8n');
                    } if(afaf[8] == "fa♯" & bfbf[8] == 4){
                        synth.triggerAttackRelease('F#4', '8n');
                    } if(afaf[8] == "fa♯" & bfbf[8] == 5){
                        synth.triggerAttackRelease('F#5', '8n');
                    } if(afaf[8] == "fa♯" & bfbf[8] == 6){
                        synth.triggerAttackRelease('F#6', '8n');
                    } if(afaf[8] == "fa♯" & bfbf[8] == 7){
                        synth.triggerAttackRelease('F#7', '8n');
                    } if(afaf[8] == "fa♯" & bfbf[8] == 8){
                        synth.triggerAttackRelease('F#8', '8n');
                    }
                    if(afaf[8] == "sol♯" & bfbf[8] == 1){
                        synth.triggerAttackRelease('G#1', '8n');
                    } if(afaf[8] == "sol♯" & bfbf[8] == 2){
                        synth.triggerAttackRelease('G#2', '8n');
                    } if(afaf[8] == "sol♯" & bfbf[8] == 3){
                        synth.triggerAttackRelease('G#3', '8n');
                    } if(afaf[8] == "sol♯" & bfbf[8] == 4){
                        synth.triggerAttackRelease('G#4', '8n');
                    } if(afaf[8] == "sol♯" & bfbf[8] == 5){
                        synth.triggerAttackRelease('G#5', '8n');
                    } if(afaf[8] == "sol♯" & bfbf[8] == 6){
                        synth.triggerAttackRelease('G#6', '8n');
                    } if(afaf[8] == "sol♯" & bfbf[8] == 7){
                        synth.triggerAttackRelease('G#7', '8n');
                    } if(afaf[8] == "sol♯" & bfbf[8] == 8){
                        synth.triggerAttackRelease('G#8', '8n');
                    }
                    if(afaf[8] == "la♯" & bfbf[8] == 1){
                        synth.triggerAttackRelease('A#1', '8n');
                    } if(afaf[8] == "la♯" & bfbf[8] == 2){
                        synth.triggerAttackRelease('A#2', '8n');
                    } if(afaf[8] == "la♯" & bfbf[8] == 3){
                        synth.triggerAttackRelease('A#3', '8n');
                    } if(afaf[8] == "la♯" & bfbf[8] == 4){
                        synth.triggerAttackRelease('A#4', '8n');
                    } if(afaf[8] == "la♯" & bfbf[8] == 5){
                        synth.triggerAttackRelease('A#5', '8n');
                    } if(afaf[8] == "la♯" & bfbf[8] == 6){
                        synth.triggerAttackRelease('A#6', '8n');
                    } if(afaf[8] == "la♯" & bfbf[8] == 7){
                        synth.triggerAttackRelease('A#7', '8n');
                    } if(afaf[8] == "la♯" & bfbf[8] == 8){
                        synth.triggerAttackRelease('A#8', '8n');
                    }
                    if(afaf[8] == "ti♯" & bfbf[8] == 1){
                        synth.triggerAttackRelease('B#1', '8n');
                    } if(afaf[8] == "ti♯" & bfbf[8] == 2){
                        synth.triggerAttackRelease('B#2', '8n');
                    } if(afaf[8] == "ti♯" & bfbf[8] == 3){
                        synth.triggerAttackRelease('B#3', '8n');
                    } if(afaf[8] == "ti♯" & bfbf[8] == 4){
                        synth.triggerAttackRelease('B#4', '8n');
                    } if(afaf[8] == "ti♯" & bfbf[8] == 5){
                        synth.triggerAttackRelease('B#5', '8n');
                    } if(afaf[8] == "ti♯" & bfbf[8] == 6){
                        synth.triggerAttackRelease('B#6', '8n');
                    } if(afaf[8] == "ti♯" & bfbf[8] == 7){
                        synth.triggerAttackRelease('B#7', '8n');
                    } if(afaf[8] == "ti♯" & bfbf[8] == 8){
                        synth.triggerAttackRelease('B#8', '8n');
                    }
                };
            }

            if(idContainer.length > 9){

                document.getElementById(idContainer[9]).onclick = function(){

                    var temp1 = afaf[9];
                    var temp2 = noteConversion2[temp1]+bfbf[9];
                    console.log("onkeypress " +temp2) ;
                    selected1.push(temp2);

                    if(afaf[9] == "do" & bfbf[9] == 1){
                        synth.triggerAttackRelease('C1', '8n');
                    } if(afaf[9] == "do" & bfbf[9] == 2){
                        synth.triggerAttackRelease('C2', '8n');
                    } if(afaf[9] == "do" & bfbf[9] == 3){
                        synth.triggerAttackRelease('C3', '8n');
                    } if(afaf[9] == "do" & bfbf[9] == 4){
                        synth.triggerAttackRelease('C4', '8n');
                    } if(afaf[9] == "do" & bfbf[9] == 5){
                        synth.triggerAttackRelease('C5', '8n');
                    } if(afaf[9] == "do" & bfbf[9] == 6){
                        synth.triggerAttackRelease('C6', '8n');
                    } if(afaf[9] == "do" & bfbf[9] == 7){
                        synth.triggerAttackRelease('C7', '8n');
                    } if(afaf[9] == "do" & bfbf[9] == 8){
                        synth.triggerAttackRelease('C8', '8n');
                    }
                    if(afaf[9] == "re" & bfbf[9] == 1){
                        synth.triggerAttackRelease('D1', '8n');
                    } if(afaf[9] == "re" & bfbf[9] == 2){
                        synth.triggerAttackRelease('D2', '8n');
                    } if(afaf[9] == "re" & bfbf[9] == 3){
                        synth.triggerAttackRelease('D3', '8n');
                    } if(afaf[9] == "re" & bfbf[9] == 4){
                        synth.triggerAttackRelease('D4', '8n');
                    } if(afaf[9] == "re" & bfbf[9] == 5){
                        synth.triggerAttackRelease('D5', '8n');
                    } if(afaf[9] == "re" & bfbf[9] == 6){
                        synth.triggerAttackRelease('D6', '8n');
                    } if(afaf[9] == "re" & bfbf[9] == 7){
                        synth.triggerAttackRelease('D7', '8n');
                    } if(afaf[9] == "re" & bfbf[9] == 8){
                        synth.triggerAttackRelease('D8', '8n');
                    }
                    if(afaf[9] == "mi" & bfbf[9] == 1){
                        synth.triggerAttackRelease('E1', '8n');
                    } if(afaf[9] == "mi" & bfbf[9] == 2){
                        synth.triggerAttackRelease('E2', '8n');
                    } if(afaf[9] == "mi" & bfbf[9] == 3){
                        synth.triggerAttackRelease('E3', '8n');
                    } if(afaf[9] == "mi" & bfbf[9] == 4){
                        synth.triggerAttackRelease('E4', '8n');
                    } if(afaf[9] == "mi" & bfbf[9] == 5){
                        synth.triggerAttackRelease('E5', '8n');
                    } if(afaf[9] == "mi" & bfbf[9] == 6){
                        synth.triggerAttackRelease('E6', '8n');
                    } if(afaf[9] == "mi" & bfbf[9] == 7){
                        synth.triggerAttackRelease('E7', '8n');
                    } if(afaf[9] == "mi" & bfbf[9] == 8){
                        synth.triggerAttackRelease('E8', '8n');
                    }
                    if(afaf[9] == "fa" & bfbf[9] == 1){
                        synth.triggerAttackRelease('F1', '8n');
                    } if(afaf[9] == "fa" & bfbf[9] == 2){
                        synth.triggerAttackRelease('F2', '8n');
                    } if(afaf[9] == "fa" & bfbf[9] == 3){
                        synth.triggerAttackRelease('F3', '8n');
                    } if(afaf[9] == "fa" & bfbf[9] == 4){
                        synth.triggerAttackRelease('F4', '8n');
                    } if(afaf[9] == "fa" & bfbf[9] == 5){
                        synth.triggerAttackRelease('F5', '8n');
                    } if(afaf[9] == "fa" & bfbf[9] == 6){
                        synth.triggerAttackRelease('F6', '8n');
                    } if(afaf[9] == "fa" & bfbf[9] == 7){
                        synth.triggerAttackRelease('F7', '8n');
                    } if(afaf[9] == "fa" & bfbf[9] == 8){
                        synth.triggerAttackRelease('8', '8n');
                    }
                    if(afaf[9] == "sol" & bfbf[9] == 1){
                        synth.triggerAttackRelease('G1', '8n');
                    } if(afaf[9] == "sol" & bfbf[9] == 2){
                        synth.triggerAttackRelease('G2', '8n');
                    } if(afaf[9] == "sol" & bfbf[9] == 3){
                        synth.triggerAttackRelease('G3', '8n');
                    } if(afaf[9] == "sol" & bfbf[9] == 4){
                        synth.triggerAttackRelease('G4', '8n');
                    } if(afaf[9] == "sol" & bfbf[9] == 5){
                        synth.triggerAttackRelease('G5', '8n');
                    } if(afaf[9] == "sol" & bfbf[9] == 6){
                        synth.triggerAttackRelease('G6', '8n');
                    } if(afaf[9] == "sol" & bfbf[9] == 7){
                        synth.triggerAttackRelease('G7', '8n');
                    } if(afaf[9] == "sol" & bfbf[9] == 8){
                        synth.triggerAttackRelease('G8', '8n');
                    }
                    if(afaf[9] == "la" & bfbf[9] == 1){
                        synth.triggerAttackRelease('A1', '8n');
                    } if(afaf[9] == "la" & bfbf[9] == 2){
                        synth.triggerAttackRelease('A2', '8n');
                    } if(afaf[9] == "la" & bfbf[9] == 3){
                        synth.triggerAttackRelease('A3', '8n');
                    } if(afaf[9] == "la" & bfbf[9] == 4){
                        synth.triggerAttackRelease('A4', '8n');
                    } if(afaf[9] == "la" & bfbf[9] == 5){
                        synth.triggerAttackRelease('A5', '8n');
                    } if(afaf[9] == "la" & bfbf[9] == 6){
                        synth.triggerAttackRelease('A6', '8n');
                    } if(afaf[9] == "la" & bfbf[9] == 7){
                        synth.triggerAttackRelease('A7', '8n');
                    } if(afaf[9] == "la" & bfbf[9] == 8){
                        synth.triggerAttackRelease('A8', '8n');
                    }
                    if(afaf[9] == "ti" & bfbf[9] == 1){
                        synth.triggerAttackRelease('B1', '8n');
                    } if(afaf[9] == "ti" & bfbf[9] == 2){
                        synth.triggerAttackRelease('B2', '8n');
                    } if(afaf[9] == "ti" & bfbf[9] == 3){
                        synth.triggerAttackRelease('B3', '8n');
                    } if(afaf[9] == "ti" & bfbf[9] == 4){
                        synth.triggerAttackRelease('B4', '8n');
                    } if(afaf[9] == "ti" & bfbf[9] == 5){
                        synth.triggerAttackRelease('B5', '8n');
                    } if(afaf[9] == "ti" & bfbf[9] == 6){
                        synth.triggerAttackRelease('B6', '8n');
                    } if(afaf[9] == "ti" & bfbf[9] == 7){
                        synth.triggerAttackRelease('B7', '8n');
                    } if(afaf[9] == "ti" & bfbf[9] == 8){
                        synth.triggerAttackRelease('B8', '8n');
                    }


                    if(afaf[9] == "do♯" & bfbf[9] == 1){
                        synth.triggerAttackRelease('C#1', '8n');
                    } if(afaf[9] == "do♯" & bfbf[9] == 2){
                        synth.triggerAttackRelease('C#2', '8n');
                    } if(afaf[9] == "do♯" & bfbf[9] == 3){
                        synth.triggerAttackRelease('C#3', '8n');
                    } if(afaf[9] == "do♯" & bfbf[9] == 4){
                        synth.triggerAttackRelease('C#4', '8n');
                    } if(afaf[9] == "do♯" & bfbf[9] == 5){
                        synth.triggerAttackRelease('C#5', '8n');
                    } if(afaf[9] == "do♯" & bfbf[9] == 6){
                        synth.triggerAttackRelease('C#6', '8n');
                    } if(afaf[9] == "do♯" & bfbf[9] == 7){
                        synth.triggerAttackRelease('C#7', '8n');
                    } if(afaf[9] == "do♯" & bfbf[9] == 8){
                        synth.triggerAttackRelease('C#8', '8n');
                    }
                    if(afaf[9] == "re♯" & bfbf[9] == 1){
                        synth.triggerAttackRelease('D#1', '8n');
                    } if(afaf[9] == "re♯" & bfbf[9] == 2){
                        synth.triggerAttackRelease('D#2', '8n');
                    } if(afaf[9] == "re♯" & bfbf[9] == 3){
                        synth.triggerAttackRelease('D#3', '8n');
                    } if(afaf[9] == "re♯" & bfbf[9] == 4){
                        synth.triggerAttackRelease('D#4', '8n');
                    } if(afaf[9] == "re♯" & bfbf[9] == 5){
                        synth.triggerAttackRelease('D#5', '8n');
                    } if(afaf[9] == "re♯" & bfbf[9] == 6){
                        synth.triggerAttackRelease('D#6', '8n');
                    } if(afaf[9] == "re♯" & bfbf[9] == 7){
                        synth.triggerAttackRelease('D#7', '8n');
                    } if(afaf[9] == "re♯" & bfbf[9] == 8){
                        synth.triggerAttackRelease('D#8', '8n');
                    }
                    if(afaf[9] == "mi♯" & bfbf[9] == 1){
                        synth.triggerAttackRelease('E#1', '8n');
                    } if(afaf[9] == "mi♯" & bfbf[9] == 2){
                        synth.triggerAttackRelease('E#2', '8n');
                    } if(afaf[9] == "mi♯" & bfbf[9] == 3){
                        synth.triggerAttackRelease('E#3', '8n');
                    } if(afaf[9] == "mi♯" & bfbf[9] == 4){
                        synth.triggerAttackRelease('E#4', '8n');
                    } if(afaf[9] == "mi♯" & bfbf[9] == 5){
                        synth.triggerAttackRelease('E#5', '8n');
                    } if(afaf[9] == "mi♯" & bfbf[9] == 6){
                        synth.triggerAttackRelease('E#6', '8n');
                    } if(afaf[9] == "mi♯" & bfbf[9] == 7){
                        synth.triggerAttackRelease('E#7', '8n');
                    } if(afaf[9] == "mi♯" & bfbf[9] == 8){
                        synth.triggerAttackRelease('E#8', '8n');
                    }
                    if(afaf[9] == "fa♯" & bfbf[9] == 1){
                        synth.triggerAttackRelease('F#1', '8n');
                    } if(afaf[9] == "fa♯" & bfbf[9] == 2){
                        synth.triggerAttackRelease('F#2', '8n');
                    } if(afaf[9] == "fa♯" & bfbf[9] == 3){
                        synth.triggerAttackRelease('F#3', '8n');
                    } if(afaf[9] == "fa♯" & bfbf[9] == 4){
                        synth.triggerAttackRelease('F#4', '8n');
                    } if(afaf[9] == "fa♯" & bfbf[9] == 5){
                        synth.triggerAttackRelease('F#5', '8n');
                    } if(afaf[9] == "fa♯" & bfbf[9] == 6){
                        synth.triggerAttackRelease('F#6', '8n');
                    } if(afaf[9] == "fa♯" & bfbf[9] == 7){
                        synth.triggerAttackRelease('F#7', '8n');
                    } if(afaf[9] == "fa♯" & bfbf[9] == 8){
                        synth.triggerAttackRelease('F#8', '8n');
                    }
                    if(afaf[9] == "sol♯" & bfbf[9] == 1){
                        synth.triggerAttackRelease('G#1', '8n');
                    } if(afaf[9] == "sol♯" & bfbf[9] == 2){
                        synth.triggerAttackRelease('G#2', '8n');
                    } if(afaf[9] == "sol♯" & bfbf[9] == 3){
                        synth.triggerAttackRelease('G#3', '8n');
                    } if(afaf[9] == "sol♯" & bfbf[9] == 4){
                        synth.triggerAttackRelease('G#4', '8n');
                    } if(afaf[9] == "sol♯" & bfbf[9] == 5){
                        synth.triggerAttackRelease('G#5', '8n');
                    } if(afaf[9] == "sol♯" & bfbf[9] == 6){
                        synth.triggerAttackRelease('G#6', '8n');
                    } if(afaf[9] == "sol♯" & bfbf[9] == 7){
                        synth.triggerAttackRelease('G#7', '8n');
                    } if(afaf[9] == "sol♯" & bfbf[9] == 8){
                        synth.triggerAttackRelease('G#8', '8n');
                    }
                    if(afaf[9] == "la♯" & bfbf[9] == 1){
                        synth.triggerAttackRelease('A#1', '8n');
                    } if(afaf[9] == "la♯" & bfbf[9] == 2){
                        synth.triggerAttackRelease('A#2', '8n');
                    } if(afaf[9] == "la♯" & bfbf[9] == 3){
                        synth.triggerAttackRelease('A#3', '8n');
                    } if(afaf[9] == "la♯" & bfbf[9] == 4){
                        synth.triggerAttackRelease('A#4', '8n');
                    } if(afaf[9] == "la♯" & bfbf[9] == 5){
                        synth.triggerAttackRelease('A#5', '8n');
                    } if(afaf[9] == "la♯" & bfbf[9] == 6){
                        synth.triggerAttackRelease('A#6', '8n');
                    } if(afaf[9] == "la♯" & bfbf[9] == 7){
                        synth.triggerAttackRelease('A#7', '8n');
                    } if(afaf[9] == "la♯" & bfbf[9] == 8){
                        synth.triggerAttackRelease('A#8', '8n');
                    }
                    if(afaf[9] == "ti♯" & bfbf[9] == 1){
                        synth.triggerAttackRelease('B#1', '8n');
                    } if(afaf[9] == "ti♯" & bfbf[9] == 2){
                        synth.triggerAttackRelease('B#2', '8n');
                    } if(afaf[9] == "ti♯" & bfbf[9] == 3){
                        synth.triggerAttackRelease('B#3', '8n');
                    } if(afaf[9] == "ti♯" & bfbf[9] == 4){
                        synth.triggerAttackRelease('B#4', '8n');
                    } if(afaf[9] == "ti♯" & bfbf[9] == 5){
                        synth.triggerAttackRelease('B#5', '8n');
                    } if(afaf[9] == "ti♯" & bfbf[9] == 6){
                        synth.triggerAttackRelease('B#6', '8n');
                    } if(afaf[9] == "ti♯" & bfbf[9] == 7){
                        synth.triggerAttackRelease('B#7', '8n');
                    } if(afaf[9] == "ti♯" & bfbf[9] == 8){
                        synth.triggerAttackRelease('B#8', '8n');
                    }
                };
            }
            

            

     //       document.getElementById(this.rowLabels1[1]+this.rowArgs1[1]).onclick = function(){synth.triggerAttackRelease('C4'   , '8n')};


        }

        

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var mkbDiv = docById('mkbDiv');
        mkbDiv.style.visibility = 'visible';
        mkbDiv.setAttribute('draggable', 'true');
        mkbDiv.style.left = '200px';
        mkbDiv.style.top = '150px';

    


        // The mkb buttons
        var mkbButtonsDiv = docById('mkbButtonsDiv');
        mkbButtonsDiv.style.display = 'inline';
        mkbButtonsDiv.style.visibility = 'visible';
        mkbButtonsDiv.style.width = BUTTONDIVWIDTH;
        mkbButtonsDiv.innerHTML = '<table cellpadding="0px" id="mkbButtonTable"></table>';

        var buttonTable1 = docById('mkbButtonTable');           //doubt
        var header1 = buttonTable1.createTHead();
        var row1 = header1.insertRow(0);

        // For the button callbacks
        var that = this;

        var cell1 = this._addButton(row1, 'play-button.svg', ICONSIZE, _('play'));

        cell1.onclick=function() {
            that._logo.setTurtleDelay(0);
            that._playAll();
        }

        var cell1 = this._addButton(row1, 'export-chunk.svg', ICONSIZE, _('save'));

        cell1.onclick=function() {
            if(standardKeyboard == 1){
                that._save1(selected);    
            } else if(customKeyboard == 1){
                that._save1(selected1);
            }
            console.log("Selected " +selected);
      //      handleKeyboardPitches (selected);
        }

        var cell1 = this._addButton(row1, 'erase-button.svg', ICONSIZE, _('clear'));

        cell1.onclick=function() {
            selected = [];
            selected1 = [];
        }

        var cell1 = this._addButton(row1,'close-button.svg', ICONSIZE, _('close'));

        cell1.onclick=function() {
            mkbDiv.style.visibility = 'hidden';
            mkbButtonsDiv.style.visibility = 'hidden';
        //    mkbTableDiv.style.visibility = 'hidden';
            document.getElementById("keyboardHolder").style.display = "none";
            document.getElementById("keyboardHolder2").style.display = "none";
            var myNode = document.getElementById("myrow");
            myNode.innerHTML = '';
            var myNode = document.getElementById("myrow2");
            myNode.innerHTML = '';
            selected = [];
            selected1 = [];
        }




        var dragCell = this._addButton(row1, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - mkbDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - mkbDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function(e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
            dragCell.innerHTML = '';
        };

        dragCell.onmouseout = function(e) {
            if (!that._dragging) {
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                mkbDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                mkbDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        mkbDiv.ondragover = function(e) {
            e.preventDefault();
        };

        mkbDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                mkbDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                mkbDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        mkbDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        mkbDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };
    };

    changeKeys();

    function changeKeys() {
        whiteKeys.innerHTML = "";
        blackKeys.innerHTML = "";
        var note1 = firstNote.value;
        var note2 = secondNote.value;
        var oct1 = firstOctave.value;
        var oct2 = secondOctave.value;
        //sanity checks
        //missing values
        if(note1 == "" || note2 == "" || oct1 == "" || oct2 == "") {
            return;
        }
        //2nd octave < 1st octave
        if(oct2 < oct1) {
            var tmp = oct1;
            oct1 = oct2;
            oct2 = tmp;
        }
        //2nd key comes before 1st key on same octave
        if(oct1 == oct2 && whiteNoteEnums.indexOf(note1) > whiteNoteEnums.indexOf(note2)) {
            var tmp = note1;
            note1 = note2;
            note2 = tmp;
        }
        //reflect sanity changes
        firstNote.value = note1;
        secondNote.value = note2;
        firstOctave.value = oct1;
        secondOctave.value = oct2;
        
        //first key -> end of first octave
        for(var j = whiteNoteEnums.indexOf(note1); j < whiteNoteEnums.length; j++) {
            whiteKeys.innerHTML += "<td>"+whiteNoteEnums[j]+oct1+"</td>";
        }
        for(var j = whiteNoteEnums.indexOf(note1); j < blackNoteEnums.length; j++) {
            if(blackNoteEnums[j] != 'SKIP') {
                blackKeys.innerHTML += "<td>"+blackNoteEnums[j]+oct1+"</td>";
            }
            else {
                blackKeys.innerHTML += "<td style='visibility: hidden'></td>";
            }
        }
        //2nd octave -> second to last octave
        for(var i = parseInt(oct1)+1; i <= oct2-1; i++) {
            for(var j = 0; j < whiteNoteEnums.length; j++) {
                whiteKeys.innerHTML += "<td>"+whiteNoteEnums[j]+i+"</td>";
            }
            for(var j = 0; j < blackNoteEnums.length; j++) {
                if(blackNoteEnums[j] != 'SKIP') {
                    blackKeys.innerHTML += "<td>"+blackNoteEnums[j]+i+"</td>";
                }
                else {
                blackKeys.innerHTML += "<td style='visibility: hidden'></td>";
                }
            }
        }
        //last octave -> last key
        for(var j = 0; j < whiteNoteEnums.indexOf(note2)+1; j++) {
            whiteKeys.innerHTML += "<td>"+whiteNoteEnums[j]+oct2+"</td>";
        }
        for(var j = 0; j < whiteNoteEnums.indexOf(note2); j++) {
            if(blackNoteEnums[j] != 'SKIP') {
                blackKeys.innerHTML += "<td>"+blackNoteEnums[j]+oct2+"</td>";
            }
            else {
                blackKeys.innerHTML += "<td style='visibility: hidden'></td>";
            }
        }
        //assign the IDs (for clearing)
        for(var i = 0; i < whiteKeys.children.length; i++) {
            whiteKeys.children[i].id = whiteKeys.children[i].textContent;
        }
        for(var i = 0; i < blackKeys.children.length; i++) {
            blackKeys.children[i].id = blackKeys.children[i].textContent;
        }
        console.log('HHHiii ' +note1+oct1+"-"+note2+oct2);
    }

    keyboard.addEventListener("mousedown", function (e) {
        var target = e.target;
        if(target.tagName == "TD") {
            if((target.style.backgroundColor != "lightgrey") && (target.style.backgroundColor != "rgb(72,72,72)")) {
                selected.push(target.textContent);
                if(target.parentNode == whiteKeys) {
                    target.style.backgroundColor = "lightgrey";
                }
                else {
                    target.style.backgroundColor = "rgb(72,72,72)";
                }
            }
            handleKeyboard(target.textContent);
        }
    });

    keyboard.addEventListener("mouseup", function (f) {
        var target = f.target;
        if(target.tagName == "TD") {   
                if(target.parentNode == whiteKeys) {
                    target.style.backgroundColor = "white";
                }
                else {
                    target.style.backgroundColor = "black";
                }
        }
        
    });

    function deselect () {
        for(var i = 0; i < selected.length; i++) {
            var tmp = document.getElementById(selected[i]);
            if (tmp.parentElement == whiteKeys) {
                tmp.style.backgroundColor = "white";
            }
            else {
                tmp.style.backgroundColor = "black";
            }
        }
        selected = [];
    }

    var keyboardShown = true;

    function toggleKeyboard() {
        if(keyboardShown) {
            keyboardHolder.style.display = 'none';
        }
        else {
            keyboardHolder.style.display = 'inline';
        }
     
        keyboardShown = !keyboardShown;
    }

    function handleKeyboard (key) {
        //Tone can't do special sharps, need # isntead of ♯
        var noSharp = key;
        if(key[1] == "♯") {
            noSharp = key[0]+"#"+key[2];
        }
        synth.triggerAttackRelease(noSharp, "8n");
    }   

    this._save1 = function(pitches){

        console.log("generating keyboard pitches for: " + pitches);
        var noteConversion = {'C': 'do', 'D': 're', 'E': 'mi', 'F': 'fa', 'G': 'sol', 'A': 'la', 'B': 'ti', 'R': 'rest'};
        var newStack = [[0, ["action", {"collapsed":false}], 100, 100, [null, 1, null, null]], [1, ["text", {"value":"chunk"}], 0, 0, [0]]];
        var endOfStackIdx = 0;
        for (var i = 0; i < pitches.length; i++) {
        // We want all of the notes in a column.
        // console.log(this.notesToPlay[i]);
            var note = pitches[i].slice(0);
     
        // Add the Note block and its value
            var idx = newStack.length;
            newStack.push([idx, 'note', 0, 0, [endOfStackIdx, idx + 1, idx + 2, null]]);
            var n = newStack[idx][4].length;
            if (i == 0) {  // the action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } 
            else { // the previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }
            var endOfStackIdx = idx;
            newStack.push([idx + 1, ['number', {'value': "4"}], 0, 0, [idx]]);
            // Add the pitch blocks to the Note block
            var  notePitch = note.substring(0,note.length-1);  //i.e. D or D# not D#1
            var thisBlock = idx + 2;
     
            // We need to point to the previous note or pitch block.
            var previousBlock = idx;  // Note block
      
      
            // The last connection in last pitch block is null.
            var lastConnection = null;

            newStack.push([thisBlock, 'pitch', 0, 0, [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]]);
            if(['♯', '♭'].indexOf(notePitch[1]) != -1) {
                newStack.push([thisBlock + 1, ['solfege', {'value': noteConversion[note[0]] + note[1]}], 0, 0, [thisBlock]]);
                newStack.push([thisBlock + 2, ['number', {'value': note[note.length-1]}], 0, 0, [thisBlock]]);
            } 
            else {
                newStack.push([thisBlock + 1, ['solfege', {'value': noteConversion[notePitch[0]]}], 0, 0, [thisBlock]]);
                newStack.push([thisBlock + 2, ['number', {'value': note[note.length-1]}], 0, 0, [thisBlock]]);
            }
        }
        console.log(newStack);
        this._logo.blocks.loadNewBlocks(newStack);
    }

    this.clearBlocks = function() {
        this._rowBlocks1 = [];
        this._colBlocks1 = [];

    };

    this.addRowBlock = function(pitchBlock) {
        this._rowBlocks1.push(pitchBlock);
    };

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };
     
    var synth = new Tone.Synth().toMaster();
    
}


