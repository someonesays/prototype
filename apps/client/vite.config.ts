import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const port = Number(env.VITE_PORT ?? 3000);
  return {
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
          target: env.VITE_PROXY_BASE_API,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    preview: { port },
    plugins: [sveltekit()],
  };
});
