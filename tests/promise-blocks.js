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


  it("it should delete action block and avoid palette refresh race condition ", done => {
    // Arrange
    let action = false;

    // Act
    flag = deleteAction()
      .then(() => {
        // Assert
        expect(action).toBeTruthy();
        done();
    });
  }); 
  
});