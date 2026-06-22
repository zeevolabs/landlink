import { describe, expect, it } from "vitest";
import { buildMeta } from "./build-meta";
import type { Config } from "../config/types";

const minimal: Config = {
  profile: { name: "Test User" },
  blocks: [],
};

const full: Config = {
  profile: { name: "Test User", bio: "A bio", avatar: "/avatar.jpg" },
  meta: {
    title: "Custom Title",
    description: "Custom description",
    image: "/og.jpg",
    url: "https://example.com",
    locale: "pt-BR",
    twitterHandle: "testuser",
    keywords: ["test", "seo"],
  },
  blocks: [],
};

describe("buildMeta", () => {
  it("produces valid metadata from minimal config", () => {
    const result = buildMeta(minimal);
    expect(result.title).toBe("Test User");
    expect(result.description).toBe("");
    expect(result.openGraph.type).toBe("website");
    expect(result.twitter.card).toBe("summary");
  });

  it("populates all fields from full config", () => {
    const result = buildMeta(full);
    expect(result.title).toBe("Custom Title");
    expect(result.description).toBe("Custom description");
    expect(result.keywords).toEqual(["test", "seo"]);
    expect(result.alternates?.canonical).toBe("https://example.com");
    expect(result.openGraph.url).toBe("https://example.com");
    expect(result.openGraph.locale).toBe("pt-BR");
    expect(result.openGraph.images![0]!.url).toBe("/og.jpg");
    expect(result.twitter.card).toBe("summary_large_image");
    expect(result.twitter.site).toBe("@testuser");
    expect(result.twitter.creator).toBe("@testuser");
    expect(result.twitter.images).toEqual(["/og.jpg"]);
  });

  it("adds @ prefix to twitterHandle if missing", () => {
    const result = buildMeta(full);
    expect(result.twitter.site).toBe("@testuser");
  });

  it("preserves @ prefix if already present", () => {
    const config: Config = {
      ...full,
      meta: { ...full.meta, twitterHandle: "@already" },
    };
    const result = buildMeta(config);
    expect(result.twitter.site).toBe("@already");
  });

  it("falls back to profile.avatar when meta.image is not set", () => {
    const config: Config = {
      profile: { name: "Test", avatar: "/fallback.jpg" },
      blocks: [],
    };
    const result = buildMeta(config);
    expect(result.openGraph.images).toBeDefined();
    expect(result.openGraph.images![0]!.url).toBe("/fallback.jpg");
    expect(result.twitter.card).toBe("summary_large_image");
  });

  it("uses summary card when no image is available", () => {
    const result = buildMeta(minimal);
    expect(result.twitter.card).toBe("summary");
    expect(result.openGraph.images).toBeUndefined();
  });
});
