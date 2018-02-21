const { notImplementedMethods } = require("../not-implemented-methods");

describe("notImplementedMethods", () => {
  it("should return hapi route object", () => {
    expect(notImplementedMethods("/")).toMatchSnapshot();
  });
});
