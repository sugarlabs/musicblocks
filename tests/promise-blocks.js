/*
 * Test the function
 */

describe("Testing async functions", () => {
  
  it("delay after few seconds", done => {
    // Arrange
    let flag = false;

    // Act
    flag = Delay()
      .then(() => {
        // Assert
        expect(flag).toBeTruthy();
        done();
    });
  }); 
  
});