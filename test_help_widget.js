// Simple test to verify help widget can access documentation
function testHelpWidget() {
    // Test if the Docs folder exists
    if (!window.fetch) {
        console.log("fetch API not available, skipping test");
        return;
    }
    
    // Test if we can access a documentation file
    fetch('Docs/documentation/action_block.svg')
        .then(response => {
            if (response.ok) {
                console.log('? Help widget can access documentation files');
            } else {
                console.log('? Help widget cannot access documentation files');
            }
        })
        .catch(error => {
            console.log('? Error accessing documentation:', error);
        });
}

// Run the test
testHelpWidget();
