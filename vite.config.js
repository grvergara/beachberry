import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    open: false,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
