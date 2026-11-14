import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative paths, so the build works at any address, including a GitHub Pages sub-path.
  base: "./",
  // three.js alone is ~1 MB minified (~350 kB gzipped); that is expected here.
  build: { chunkSizeWarningLimit: 1400 },
});
