/*
 * Test the function
 */

describe("Testing async functions", function() {
  
  beforeEach(function() {
    return new Promise(function (resolve){
      setTimeout(function () {
          resolve(true);
      }, timeout);
  })
  });
  
  it('it should be able to delete action block without palette refresh race condition', function() {
    let action = false;
    action = deleteAction
    return deleteAction()
    .then(function () {
      expect(action).toBeTruthy;
    });
  });  

   
  beforeEach(function() {
    return new Promise(function (resolve){
      setTimeout(function () {
          resolve(true);
      }, duration);
  })
  });

  it('it should delay for a few seconds', function() {
    let action = false;
    action = Delay
    return Delay()
    .then(function () {
      expect(action).toBeTruthy;
    });
  });  

  
});


