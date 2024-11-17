import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const port = Number(process.env.VITE_PORT ?? 3000);

export default defineConfig({
  envDir: "../../",
  envPrefix: "VITE_",
  server: {
    port,
    proxy: {
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
