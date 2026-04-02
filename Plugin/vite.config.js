import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    lib: {
      entry: resolve(__dirname, "src/content.js"),
      name: "MercadonaInfoVisual",
      formats: ["iife"],
      fileName: () => "content.js",
    },
  },
});
