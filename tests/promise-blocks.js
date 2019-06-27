/*
 * Test the function
 */

describe("Testing async functions", function() {
  
  beforeEach(async function() {
    await Delay();
  });
  
  it('should delay for few seconds', async function() {
       // Arrange
    let flag = false;
      // Act
    flag  = await Delay();
       // Assert
    expect(flag).toBeTruthy();
  });
  
});