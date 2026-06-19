import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: { entry: "src/index.ts" },
  clean: true,
  treeshake: true,
  external: ["@zeevolabs/landlink", "zod"],
});
