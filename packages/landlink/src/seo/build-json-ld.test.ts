import { describe, expect, it } from "vitest";
import { buildJsonLd } from "./build-json-ld";
import type { Config } from "../config/types";

const minimal: Config = {
  profile: { name: "Test User" },
  blocks: [],
};

describe("buildJsonLd", () => {
  it("produces valid ProfilePage from minimal config", () => {
    const result = buildJsonLd(minimal);
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("ProfilePage");
    expect(result.name).toBe("Test User");
    expect(result.mainEntity["@type"]).toBe("Person");
    expect(result.mainEntity.name).toBe("Test User");
  });

  it("includes description from meta with fallback to bio", () => {
    const config: Config = {
      profile: { name: "Test", bio: "Bio text" },
      blocks: [],
    };
    const result = buildJsonLd(config);
    expect(result.description).toBe("Bio text");
    expect(result.mainEntity.description).toBe("Bio text");
  });

  it("collects sameAs from social blocks", () => {
    const config: Config = {
      profile: { name: "Test" },
      blocks: [
        {
          type: "social",
          items: [
            { url: "https://instagram.com/test" },
            { url: "https://tiktok.com/@test" },
          ],
        },
      ],
    };
    const result = buildJsonLd(config);
    expect(result.mainEntity.sameAs).toEqual([
      "https://instagram.com/test",
      "https://tiktok.com/@test",
    ]);
  });

  it("omits sameAs when no social blocks exist", () => {
    const result = buildJsonLd(minimal);
    expect(result.mainEntity.sameAs).toBeUndefined();
  });

  it("includes image from meta with fallback to avatar", () => {
    const config: Config = {
      profile: { name: "Test", avatar: "/avatar.jpg" },
      blocks: [],
    };
    const result = buildJsonLd(config);
    expect(result.mainEntity.image).toBe("/avatar.jpg");
  });
});
