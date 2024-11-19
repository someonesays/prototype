import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const port = Number(process.env.VITE_PORT ?? 3000);

export default defineConfig({
  envPrefix: "VITE_",
  server: {
    port,
    proxy: {
      "/api/rooms/000": {
        target: "http://localhost:3002/api/rooms",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.slice("/api/rooms/000".length),
      },
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  preview: { port },
  plugins: [sveltekit()],
});
