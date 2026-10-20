import { describe, it, expect } from "vitest";
import { isValidPhone, optionalPhoneSchema, phoneSchema } from "./phone";

describe("phone validation", () => {
  it("accepts Israeli 05X numbers with separators", () => {
    expect(phoneSchema.parse("050-915-1878")).toBe("0509151878");
  });
  it("accepts international + numbers", () => {
    expect(isValidPhone("+972 50 915 1878")).toBe(true);
    expect(isValidPhone("+12125551234")).toBe(true);
  });
  it("accepts 972 prefix without +", () => {
    expect(isValidPhone("972509151878")).toBe(true);
  });
  it("rejects landlines, short numbers and text", () => {
    expect(isValidPhone("02-1234567")).toBe(false);
    expect(isValidPhone("05012")).toBe(false);
    expect(isValidPhone("<script>")).toBe(false);
    expect(isValidPhone("12125551234")).toBe(false);
  });
  it("optional: empty becomes null", () => {
    expect(optionalPhoneSchema.parse("")).toBeNull();
    expect(optionalPhoneSchema.safeParse("abc").success).toBe(false);
  });
});
