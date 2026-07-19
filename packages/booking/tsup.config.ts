import { defineConfig } from "tsup";
import { readFileSync, writeFileSync } from "node:fs";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    client: "src/client.ts",
    styles: "src/block/booking.css",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  external: ["@zeevolabs/landlink", "react", "react-dom", "zod", "@upstash/redis"],
  async onSuccess() {
    for (const file of ["dist/client.js", "dist/client.cjs"]) {
      const content = readFileSync(file, "utf-8");
      writeFileSync(file, `"use client";\n${content}`);
    }
  },
});
