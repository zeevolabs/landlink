import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", styles: "src/styles/base.css" },
  format: ["esm", "cjs"],
  dts: { entry: "src/index.ts" },
  clean: true,
  treeshake: true,
  external: ["react", "react-dom"],
});
