const { format } = require("../utils");

describe("format utility function", () => {
  test("replaces simple placeholders", () => {
    const template = "Hello {name}";
    const result = format(template, { name: "Mishti" });
    expect(result).toBe("Hello Mishti");
  });

  test("replaces nested placeholders", () => {
    const template = "User: {user.name}";
    const result = format(template, { user: { name: "GSoC" } });
    expect(result).toBe("User: GSoC");
  });

  test("returns empty string for undefined value", () => {
    const template = "Value: {missing}";
    const result = format(template, {});
    expect(result).toBe("Value: ");
  });

  test("returns original string if no placeholders", () => {
    const template = "No placeholders here";
    const result = format(template, { name: "Test" });
    expect(result).toBe(template);
  });
});