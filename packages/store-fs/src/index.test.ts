import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createFileStore } from "./index";

const TEST_DIR = join(import.meta.dirname, "..", ".tmp-test");
const TEST_PATH = join(TEST_DIR, "config.json");

afterEach(async () => {
  if (existsSync(TEST_DIR)) await rm(TEST_DIR, { recursive: true });
});

describe("createFileStore", () => {
  it("returns null when file does not exist", async () => {
    const store = createFileStore({ path: TEST_PATH });
    expect(await store.get()).toBeNull();
  });

  it("writes and reads config", async () => {
    const store = createFileStore({ path: TEST_PATH });
    const config = { profile: { name: "Test" }, blocks: [] };
    await store.put(config);
    expect(await store.get()).toEqual(config);
  });

  it("creates directories automatically", async () => {
    const deep = join(TEST_DIR, "nested", "deep", "config.json");
    const store = createFileStore({ path: deep });
    await store.put({ profile: { name: "Deep" }, blocks: [] });
    const raw = await readFile(deep, "utf-8");
    expect(JSON.parse(raw)).toEqual({ profile: { name: "Deep" }, blocks: [] });
  });

  it("overwrites existing config", async () => {
    const store = createFileStore({ path: TEST_PATH });
    await store.put({ profile: { name: "V1" }, blocks: [] });
    await store.put({ profile: { name: "V2" }, blocks: [] });
    expect(await store.get()).toEqual({ profile: { name: "V2" }, blocks: [] });
  });
});
