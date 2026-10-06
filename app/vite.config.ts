import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // .glb / .gltf are binary model files; without this Vite tries to parse
  // them as JavaScript and the build dies on the first null byte.
  assetsInclude: ["**/*.glb", "**/*.gltf"],
  build: {
    // This machine's safe-delete shim fails when Vite tries to empty outDir
    // (the trash step errors out and aborts the whole build). Writing over
    // the existing directory is harmless — stale hashed assets just linger
    // until the next clean. Delete this block if you build in a plain shell.
    emptyOutDir: false,
  },
});
