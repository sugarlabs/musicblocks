/*
 * Test the function
 */

// describe("Testing async functions", function() {
  
//   it("Should delay for awhile", async function(){
//     let flag = false;
//     flag = await delayExecution();
//     expect(flag).toBeTruthy();
//   }); 
  
// });




// describe("Testing async functions", function() {
  
//   beforeEach(function() {
//     return new Promise(function(resolve, reject) {
//       // do something asynchronous
//       resolve();
//     });
//   });
  
//   it('does a thing', function() {
//     return someAsyncFunction().then(function (result) {
//       expect(result).toEqual(someExpectedValue);
//     });
//   });

// });


describe("Testing async functions", function() {
  
  beforeEach(async function() {
    await delayExecution();
  });
  
  it('it should delay for few minutes', async function() {
    let completed = false;
    completed  = await delayExecution();
    expect(completed).toEqual(true);
  });
  
});