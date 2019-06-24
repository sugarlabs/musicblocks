/*
 * Test the function
 */

describe("Testing async functions", function() {
  
  beforeEach(async function() {
    await delayExecution();
  });
  
  it('Give the palettes time to load', async function() {
        // Arrange
    let completed = false;
    
    // Act
    completed  = await delayExecution();
      // Assert

    expect(completed).toBeTruthy();
  });
  
});

