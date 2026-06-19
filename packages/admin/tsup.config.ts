import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    ui: "src/ui/index.tsx",
    styles: "src/ui/styles.css",
  },
  format: ["esm", "cjs"],
  dts: { entry: { index: "src/index.ts", ui: "src/ui/index.tsx" } },
  clean: true,
  treeshake: true,
  external: ["@zeevolabs/landlink", "react", "react-dom", "zod"],
});
