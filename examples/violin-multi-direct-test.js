// Violin Multi-Sample Direct Test
// This script tests the violin multi-sample system directly in the console
// to verify that the correct samples are being used for different note ranges

console.log("🎻 VIOLIN MULTI-SAMPLE DIRECT TEST 🎻");
console.log("Testing violin multi-sample note selection...");

// Test function to verify violin multi-sample behavior
async function testViolinMultiSamples() {
    try {
        // Wait for Tone.js to be ready
        await Tone.start();
        console.log("✅ Tone.js started successfully");
        
        // Create a violin multi-sample synth
        const violinSynth = new Tone.Sampler({
            urls: {
                "G3": VIOLIN_G3_SAMPLE(),
                "D4": VIOLIN_D4_SAMPLE(),
                "A4": VIOLIN_A4_SAMPLE(),
                "E5": VIOLIN_E5_SAMPLE(),
                "A5": VIOLIN_A5_SAMPLE(),
                "E6": VIOLIN_E6_SAMPLE()
            },
            baseUrl: "",
            onload: () => {
                console.log("✅ Violin multi-sample synth loaded successfully");
                runViolinTests();
            },
            onerror: (error) => {
                console.error("❌ Error loading violin multi-sample synth:", error);
            }
        }).toDestination();
        
        // Test different notes and verify sample selection
        function runViolinTests() {
            console.log("\n🎵 Testing violin multi-sample note selection...");
            
            const testCases = [
                { note: "G3", midi: 55, register: "low", expectedSample: "G3" },
                { note: "A3", midi: 57, register: "low", expectedSample: "G3" },
                { note: "C4", midi: 60, register: "low", expectedSample: "G3" },
                { note: "C#4", midi: 61, register: "low", expectedSample: "G3" },
                { note: "D4", midi: 62, register: "low", expectedSample: "D4" },
                { note: "E4", midi: 64, register: "low", expectedSample: "D4" },
                { note: "F#4", midi: 66, register: "low", expectedSample: "D4" },
                { note: "G4", midi: 67, register: "middle", expectedSample: "A4" },
                { note: "A4", midi: 69, register: "middle", expectedSample: "A4" },
                { note: "B4", midi: 71, register: "middle", expectedSample: "A4" },
                { note: "C#5", midi: 73, register: "middle", expectedSample: "A4" },
                { note: "D5", midi: 74, register: "middle", expectedSample: "E5" },
                { note: "E5", midi: 76, register: "middle", expectedSample: "E5" },
                { note: "F#5", midi: 78, register: "middle", expectedSample: "E5" },
                { note: "G#5", midi: 80, register: "middle", expectedSample: "E5" },
                { note: "A5", midi: 81, register: "high", expectedSample: "A5" },
                { note: "B5", midi: 83, register: "high", expectedSample: "A5" },
                { note: "C#6", midi: 85, register: "high", expectedSample: "A5" },
                { note: "D#6", midi: 87, register: "high", expectedSample: "A5" },
                { note: "E6", midi: 88, register: "high", expectedSample: "E6" },
                { note: "F6", midi: 89, register: "high", expectedSample: "E6" },
                { note: "G6", midi: 91, register: "high", expectedSample: "E6" }
            ];
            
            let passedTests = 0;
            let totalTests = testCases.length;
            
            testCases.forEach((testCase, index) => {
                setTimeout(() => {
                    console.log(`\n🎵 Playing ${testCase.note} (MIDI: ${testCase.midi}) in ${testCase.register} register...`);
                    
                    try {
                        // Play the note
                        violinSynth.triggerAttackRelease(testCase.note, "4n");
                        
                        // Determine which sample should be used based on MIDI note
                        let actualSample;
                        if (testCase.midi <= 61) { // Up to C#4
                            actualSample = "G3";
                        } else if (testCase.midi <= 66) { // Up to F#4
                            actualSample = "D4";
                        } else if (testCase.midi <= 73) { // Up to C#5
                            actualSample = "A4";
                        } else if (testCase.midi <= 80) { // Up to G#5
                            actualSample = "E5";
                        } else if (testCase.midi <= 87) { // Up to D#6
                            actualSample = "A5";
                        } else { // E6 and above
                            actualSample = "E6";
                        }
                        
                        // Check if the correct sample was used
                        const isCorrect = actualSample === testCase.expectedSample;
                        if (isCorrect) {
                            console.log(`✅ Used ${actualSample} sample (correct)`);
                            passedTests++;
                        } else {
                            console.log(`❌ Used ${actualSample} sample (incorrect - expected ${testCase.expectedSample})`);
                        }
                        
                        // Show progress
                        if (index === totalTests - 1) {
                            console.log(`\n📊 FINAL TEST RESULTS:`);
                            console.log(`Passed: ${passedTests}/${totalTests}`);
                            
                            if (passedTests === totalTests) {
                                console.log("🎉 ALL TESTS PASSED! Violin multi-sample system is working correctly.");
                            } else {
                                console.log("❌ SOME TESTS FAILED!");
                                console.log("⚠️ There may be an issue with the violin multi-sample implementation.");
                            }
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error playing ${testCase.note}:`, error);
                    }
                }, index * 1000); // Play each note with 1 second delay
            });
        }
        
    } catch (error) {
        console.error("❌ Error in violin multi-sample test:", error);
    }
}

// Run the test
console.log("Starting violin multi-sample test in 2 seconds...");
setTimeout(testViolinMultiSamples, 2000);

// Helper function to manually test specific notes
function testViolinNote(note, duration = "4n") {
    if (!window.violinSynth) {
        console.error("❌ Violin synth not available. Run testViolinMultiSamples() first.");
        return;
    }
    
    try {
        console.log(`🎵 Testing violin note: ${note}`);
        window.violinSynth.triggerAttackRelease(note, duration);
    } catch (error) {
        console.error(`❌ Error playing ${note}:`, error);
    }
}

console.log("\n📋 Available test functions:");
console.log("- testViolinMultiSamples(): Run the full test suite");
console.log("- testViolinNote(note, duration): Test a specific note");
console.log("- verifyViolinMultiSamples(): Verify sample integrity (from violin_multi.js)");
