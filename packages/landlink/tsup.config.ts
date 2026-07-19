import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";

async function prependUseClient() {
  for (const file of ["dist/client.js", "dist/client.cjs"]) {
    const content = await readFile(file, "utf-8");
    if (!content.startsWith('"use client"')) {
      await writeFile(file, `"use client";\n${content}`);
    }
  }
}

export default defineConfig([
  {
    entry: { index: "src/index.ts", styles: "src/styles/base.css" },
    format: ["esm", "cjs"],
    dts: { entry: "src/index.ts" },
    clean: true,
    treeshake: true,
    external: ["react", "react-dom"],
  },
  {
    entry: { client: "src/client.ts" },
    format: ["esm", "cjs"],
    dts: { entry: "src/client.ts" },
    clean: false,
    treeshake: true,
    external: ["react", "react-dom"],
    async onSuccess() {
      await prependUseClient();
    },
  },
]);
