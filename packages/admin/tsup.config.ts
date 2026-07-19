import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    next: "src/next.ts",
    ui: "src/ui/index.tsx",
    styles: "src/ui/styles.css",
  },
  format: ["esm", "cjs"],
  dts: { entry: { index: "src/index.ts", next: "src/next.ts", ui: "src/ui/index.tsx" } },
  clean: true,
  treeshake: true,
  external: ["@zeevolabs/landlink", "@zeevolabs/landlink-booking", "@vercel/blob", "react", "react-dom", "zod"],
});
