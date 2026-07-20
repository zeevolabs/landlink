import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", generate: "src/generate.ts" },
  format: ["esm"],
  target: "node18",
  clean: true,
  dts: false,
});
