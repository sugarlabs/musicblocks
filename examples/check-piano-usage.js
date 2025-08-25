// Utility to check if piano_multi is actually being used
// Copy and paste this into your browser console while in Music Blocks

(function() {
    console.log("%c🔍 CHECKING PIANO USAGE IN MUSIC BLOCKS 🔍", "background: #2196F3; color: white; font-size: 16px; padding: 5px;");
    
    // Check if instrumentsSource is available in global scope
    if (typeof instrumentsSource !== 'undefined') {
        console.log("Found instrumentsSource object:");
        console.log(instrumentsSource);
        
        // Check if piano_multi is being used
        const pianoMultiUsed = Object.values(instrumentsSource).some(source => source[1] === "piano_multi");
        
        if (pianoMultiUsed) {
            console.log("%c✅ piano_multi is being used in your project!", "background: #4CAF50; color: white; font-size: 14px; padding: 3px;");
            
            // Find which instrument is using piano_multi
            const instrumentsUsingPianoMulti = Object.entries(instrumentsSource)
                .filter(([_, source]) => source[1] === "piano_multi")
                .map(([name, _]) => name);
            
            console.log("Instruments using piano_multi:", instrumentsUsingPianoMulti);
        } else {
            console.log("%c❌ piano_multi is NOT being used in your project!", "background: #F44336; color: white; font-size: 14px; padding: 3px;");
            console.log("You might be using the regular piano sample instead.");
            
            // Check if regular piano is being used
            const regularPianoUsed = Object.values(instrumentsSource).some(source => source[1] === "piano");
            if (regularPianoUsed) {
                console.log("%c⚠️ Regular piano sample is being used instead of piano_multi", "background: #FF9800; color: white; font-size: 14px; padding: 3px;");
                
                const instrumentsUsingPiano = Object.entries(instrumentsSource)
                    .filter(([_, source]) => source[1] === "piano")
                    .map(([name, _]) => name);
                
                console.log("Instruments using regular piano:", instrumentsUsingPiano);
            }
        }
    } else {
        console.error("instrumentsSource not found. Are you running this in Music Blocks?");
    }
    
    // Check if we can access the synth objects
    if (typeof instruments !== 'undefined') {
        console.log("Found instruments object:");
        
        // Count how many instruments are available
        let instrumentCount = 0;
        let samplerCount = 0;
        
        for (const turtleId in instruments) {
            for (const instrumentName in instruments[turtleId]) {
                instrumentCount++;
                const synth = instruments[turtleId][instrumentName];
                if (synth && synth.name === "Sampler") {
                    samplerCount++;
                    console.log(`Found Sampler: ${instrumentName} for turtle ${turtleId}`);
                    
                    // Check if this sampler has multiple buffers (indicating multi-sample)
                    if (synth._buffers) {
                        const bufferKeys = Array.from(synth._buffers.keys());
                        console.log(`Sampler buffers: ${bufferKeys.join(", ")}`);
                        
                        if (bufferKeys.includes("C2") && bufferKeys.includes("C4") && bufferKeys.includes("C6")) {
                            console.log("%c✅ This sampler has C2, C4, and C6 buffers - it's using multi-samples!", 
                                "background: #4CAF50; color: white; font-size: 14px; padding: 3px;");
                        } else if (bufferKeys.length === 1 && bufferKeys[0] === "C4") {
                            console.log("%c❌ This sampler only has a C4 buffer - it's using a single sample", 
                                "background: #F44336; color: white; font-size: 14px; padding: 3px;");
                        }
                    }
                }
            }
        }
        
        console.log(`Total instruments: ${instrumentCount}, Samplers: ${samplerCount}`);
    } else {
        console.error("instruments object not found. Are you running this in Music Blocks?");
    }
    
    console.log("%c💡 SOLUTION: If piano_multi is not being used, try selecting 'piano multi' in the Set Timbre block", 
        "background: #673AB7; color: white; font-size: 14px; padding: 3px;");
})();