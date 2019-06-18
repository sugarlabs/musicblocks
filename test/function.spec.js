/*
 * Test the function
 */

describe("Drag Drop widget", function() {
  it("Draggable has fout items", function() {
    expect(dragDrop.draggable.length).toBe(4);
  });
  it("This widget has two properties", function() {
    expect(Object.keys(dragDrop).length).toBe(2);
  });
});
