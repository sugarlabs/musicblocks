/*
 * Test the function
 */

describe("Testing async functions", function() {
  
  beforeEach(async function() {
    await delay();
  });
  
  it('should delay for few seconds', async function() {
       // Arrange
    let flag = false;
      // Act
    flag  = await delay();
       // Assert
    expect(flag).toBeTruthy();
  });
  
});