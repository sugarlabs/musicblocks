/*
 * Test the function
 */

describe("Testing async functions", function() {
  
  beforeEach(async function() {
    await delayExecution();
  });
  
  it('Give the palettes time to load', async function() {
    let completed = false;
    completed  = await delayExecution();
    expect(completed).toBeTruthy();
  });
  
});