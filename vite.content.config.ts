import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  publicDir: false,
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/content/contentScript.ts"),
      name: "DeSpoilerizeContentScript",
      formats: ["iife"],
      fileName: () => "assets/contentScript.js"
    }
  }
});
