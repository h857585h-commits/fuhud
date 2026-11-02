import { describe, expect, it } from "vitest";
import { inlineParams } from "./index";

describe("inlineParams", () => {
  it("quotes values and doubles single quotes", () => {
    expect(inlineParams("select * from t where a = $1", ["it's"])).toBe("select * from t where a = 'it''s'");
  });
  it("never re-substitutes placeholders that appear inside values", () => {
    expect(inlineParams("insert into t values ($1, $2)", ["$2", "x"])).toBe("insert into t values ('$2', 'x')");
  });
  it("handles $10 separately from $1", () => {
    const params = Array.from({ length: 10 }, (_, i) => i + 1);
    expect(inlineParams("$1,$10", params)).toBe("'1','10'");
  });
  it("renders null and booleans as SQL keywords", () => {
    expect(inlineParams("$1 $2", [null, true])).toBe("NULL true");
  });
});
