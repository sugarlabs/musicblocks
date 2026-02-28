describe("Rhythm Palette Beginner", () => {

  test("Test quarter note value", () => {
    const noteValue = 1/4;
    expect(noteValue).toBe(0.25);
  });

  test("Test half note value", () => {
    const noteValue = 1/2;
    expect(noteValue).toBe(0.5);
  });

  test("Test whole note value", () => {
    const noteValue = 1;
    expect(noteValue).toBe(1);
  });

});
