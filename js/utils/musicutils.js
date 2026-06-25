const frequencyToPitch = (hz, temperament) => {
     return ["C", 10, 0];
     }
 
     const steps = currentEDO * (Math.log(hz / A0) / Math.log(2));
     const roundedSteps = Math.round(steps);
     let cents = (steps - roundedSteps) * centsPerStep;
     if (cents > centsPerStep / 2) {
         cents -= centsPerStep;
     } else if (cents <= -centsPerStep / 2) {
         cents += centsPerStep;
     }
     if (Math.abs(cents) < 0.5) {
         cents = 0;
     }
 
     const stepIndex = ((roundedSteps % currentEDO) + currentEDO) % currentEDO;
     const nameIndex = Math.round((stepIndex / currentEDO) * 12);
     const pitchName = PITCHES[(nameIndex + PITCHES.indexOf("A")) % PITCHES.length];
     const octaveNumber = Math.floor((roundedSteps + PITCHES.indexOf("A")) / currentEDO);
 
     return [pitchName, octaveNumber, cents];
 };

const numberToPitchSharp = (i, temperament) => {
     // numbertoPitch return only flats
     // This function will return sharps.
     const currentEDO = getCurrentEDO(temperament);
     if (i < 0) {
         let n = 0;
         while (i < 0) {
             i += currentEDO;
             n += 1;
         }
 
         const octave = Math.floor(i / currentEDO) - n;
         const nameIndex = Math.round(((i % currentEDO) / currentEDO) * 12);
         return [PITCHES2[(nameIndex + PITCHES2.indexOf("A")) % 12], octave];
     } else {
         const octave = Math.floor(i / currentEDO);
         const nameIndex = Math.round(((i % currentEDO) / currentEDO) * 12);
         return [PITCHES2[(nameIndex + PITCHES2.indexOf("A")) % 12], octave];
     }
 };

const getNumber = (notename, octave, temperament) => {
     // Converts a note, e.g., C, and octave to a number
     const currentEDO = getCurrentEDO(temperament);
     let num;
     if (octave < 0) {
         num = 0;
     } else if (octave > 10) {
         num = 9 * currentEDO;
     } else {
         num = currentEDO * (octave - 1);
     }
 
     notename = String(notename);
     if (notename.length === 1) {
         if (notename === "C") {
             return num;
         } else if (notename === "D") {
             return num + 2;
         } else if (notename === "E") {
             return num + 4;
         } else if (notename === "F") {
             return num + 5;
         } else if (notename === "G") {
             return num + 7;
         } else if (notename === "A") {
             return num + 9;
         } else if (notename === "B") {
             return num + 11;
         }
     } else if (notename.length === 2) {
         let mod = 0;
         if (notename.charAt(1) === "#") {
             mod = 1;
         } else if (notename.charAt(1) === "b") {
             mod = -1;
         }
 
         if (notename.charAt(0) === "C") {
             return num + mod;
         } else if (notename.charAt(0) === "D") {
             return num + 2 + mod;
         } else if (notename.charAt(0) === "E") {
             return num + 4 + mod;
         } else if (notename.charAt(0) === "F") {
             return num + 5 + mod;
         } else if (notename.charAt(0) === "G") {
             return num + 7 + mod;
         } else if (notename.charAt(0) === "A") {
             return num + 9 + mod;
         } else if (notename.charAt(0) === "B") {
             return num + 11 + mod;
         }
     }
 
     return num;
 };

const numberToPitch = (i, temperament, startPitch, offset, activity) => {
     if (temperament === undefined) {
         temperament = "equal";
     }
     const currentEDO = getCurrentEDO(temperament);
 
     let n = 0;
     let pitchNumber;
     if (i < 0) {
         while (i < 0) {
             i += currentEDO;
             n += 1; // Count octave bump ups.
         }
 
         if (temperament === "equal") {
             const nameIndex = Math.round(((i % currentEDO) / currentEDO) * 12);
             return [
                 PITCHES[(nameIndex + PITCHES.indexOf("A")) % 12],
                 Math.floor((i + PITCHES.indexOf("A")) / currentEDO) - n
             ];
         } else {
             pitchNumber = Math.floor(i - offset);
         }
     } else {
         if (temperament === "equal") {
             const nameIndex = Math.round(((i % currentEDO) / currentEDO) * 12);
             return [
                 PITCHES[(nameIndex + PITCHES.indexOf("A")) % 12],
                 Math.floor((i + PITCHES.indexOf("A")) / currentEDO)
             ];
         } else {
             pitchNumber = Math.floor(i - offset);
         }
     }

     const octaveLength = TEMPERAMENT[temperament].pitchNumber;
     if (TEMPERAMENT[temperament][pitchNumber] === undefined) {
         // If custom temperament is not defined, then it will
         // store equal temperament notes.
         for (let j = 0; j < octaveLength; j++) {
             const number = "" + j;
             const intervalIndex = Math.round((j * 12) / octaveLength) % 12;
             const interval = TEMPERAMENT["equal"]["interval"][intervalIndex];
             TEMPERAMENT[temperament][number] = [
                 Math.pow(2, j / octaveLength),
                 getNoteFromInterval(startPitch, interval)[0],
                 getNoteFromInterval(startPitch, interval)[1]
             ];
         }
     }

     return getNoteFromInterval(startPitch, TEMPERAMENT[temperament][pitchNumber][1]);
 };