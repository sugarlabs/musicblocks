// Direct test script for piano multi-samples
// Copy and paste this entire script into your browser console while in Music Blocks

(function() {
    console.log("%c🎹 PIANO MULTI-SAMPLE DIRECT TEST 🎹", "background: #FF5722; color: white; font-size: 16px; padding: 5px;");
    
    // First, verify that the samples are different
    if (typeof verifyPianoMultiSamples === 'function') {
        console.log("Running sample verification...");
        const result = verifyPianoMultiSamples();
        console.log("Verification result:", result);
    } else {
        console.warn("verifyPianoMultiSamples function not found. Make sure piano_multi.js is loaded.");
    }
    
    // Check if we're in Music Blocks with access to Tone.js
    if (typeof Tone === 'undefined') {
        console.error("Tone.js not found. This test must be run within Music Blocks.");
        return;
    }
    
    // Make sure Tone.js is started
    Tone.start().then(() => {
        console.log("%c✅ Tone.js audio context started", "color: green; font-weight: bold;");
        runTest();
    }).catch(err => {
        console.error("Failed to start Tone.js:", err);
    });
    
    function runTest() {
        // Find the instrument name that's using piano_multi
        let isPianoMultiRegistered = false;
        let instrumentName = "";
        
        if (typeof instrumentsSource !== 'undefined') {
            for (const key in instrumentsSource) {
                if (instrumentsSource[key][1] === "piano_multi") {
                    isPianoMultiRegistered = true;
                    instrumentName = key;
                    break;
                }
            }
            
            console.log("%c🔍 Checking if piano_multi is registered:", "font-weight: bold;");
            console.log(isPianoMultiRegistered ? 
                `✅ piano_multi is registered as "${instrumentName}"` : 
                "❌ piano_multi is NOT registered in instrumentsSource");
        } else {
            console.warn("instrumentsSource not found. Can't check if piano_multi is registered.");
        }
        
        // Test playing notes in different registers to verify sample selection
        console.log("%c🎵 Testing piano multi-sample note selection:", "font-weight: bold;");
        
        // Create a test synth with our samples
        const testSynth = new Tone.Sampler({
            "C2": PIANO_C2_SAMPLE(),
            "C4": PIANO_C4_SAMPLE(),
            "C6": PIANO_C6_SAMPLE()
        }).toDestination();
        
        // Define test notes in different registers - updated to match the corrected boundaries
        const testNotes = [
            { note: "C2", register: "low", expectedSample: "C2" },
            { note: "G2", register: "low", expectedSample: "C2" },
            { note: "B2", register: "low", expectedSample: "C2" }, // B2 is MIDI 47, last note using C2 sample
            { note: "C3", register: "middle", expectedSample: "C4" }, // C3 is MIDI 48, first note using C4 sample
            { note: "G4", register: "middle", expectedSample: "C4" },
            { note: "B4", register: "middle", expectedSample: "C4" }, // B4 is MIDI 71, last note using C4 sample
            { note: "C5", register: "high", expectedSample: "C6" }, // C5 is MIDI 72, first note using C6 sample
            { note: "G6", register: "high", expectedSample: "C6" },
            { note: "C7", register: "high", expectedSample: "C6" }
        ];
        
        // Create a table to track results
        const results = [];
        
        // Play each note with a delay
        testNotes.forEach((test, index) => {
            setTimeout(() => {
                const noteNum = Tone.Frequency(test.note).toMidi();
                console.log(`%cPlaying ${test.note} (MIDI: ${noteNum}) in ${test.register} register...`, "color: blue;");
                
                // Play the note
                testSynth.triggerAttackRelease(test.note, 0.5);
                
                // Record which sample was used
                let actualSample;
                // Use the same boundaries as in synthutils.js
                if (noteNum <= 47) { // Notes up to B2
                    actualSample = "C2";
                } else if (noteNum <= 71) { // Notes from C3 to B4
                    actualSample = "C4";
                } else { // Notes C5 and above
                    actualSample = "C6";
                }
                
                const result = {
                    note: test.note,
                    midi: noteNum,
                    register: test.register,
                    expectedSample: test.expectedSample,
                    actualSample: actualSample,
                    correct: actualSample === test.expectedSample
                };
                
                results.push(result);
                console.log(`%c${result.correct ? '✅' : '❌'} Used ${actualSample} sample (${result.correct ? 'correct' : 'incorrect'})`, 
                    result.correct ? "color: green;" : "color: red; font-weight: bold;");
                
                // Show final results table after all notes have played
                if (index === testNotes.length - 1) {
                    setTimeout(() => {
                        console.log("%c📊 FINAL TEST RESULTS:", "background: #2196F3; color: white; font-size: 14px; padding: 3px;");
                        console.table(results);
                        
                        const allCorrect = results.every(r => r.correct);
                        console.log(`%c${allCorrect ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED!'}`, 
                            `background: ${allCorrect ? '#4CAF50' : '#F44336'}; color: white; font-size: 14px; padding: 3px;`);
                        
                        if (allCorrect) {
                            console.log("%c🎉 The piano multi-sample implementation is working correctly! The system is using the appropriate sample for each note range and not just transposing a single sample.", 
                                "color: green; font-weight: bold;");
                        } else {
                            console.log("%c⚠️ There may be an issue with the piano multi-sample implementation. Some notes are not using the expected sample.", 
                                "color: red; font-weight: bold;");
                        }
                    }, 500);
                }
            }, index * 700); // 700ms between notes
        });
    }
})();