import { describe, expect, it } from "vitest";
import { SUPPORTED_TOOLKITS } from "../src/toolkits/index.js";

describe("toolkit metadata", () => {
  it("defines curated featured actions for every supported toolkit", () => {
    for (const toolkit of SUPPORTED_TOOLKITS) {
      expect(toolkit.featuredActions.length, `${toolkit.cliName} should define exactly 10 featuredActions`).toBe(10);
      expect(new Set(toolkit.featuredActions.map(entry => entry.canonical)).size).toBe(
        toolkit.featuredActions.length
      );
      expect(toolkit.examples.length, `${toolkit.cliName} should define fallback examples`).toBeGreaterThan(0);
    }
  });
});
