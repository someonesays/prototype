import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv, type UserConfig } from "vite";

export default ({ mode }: UserConfig) => {
  const env = loadEnv(mode as string, process.cwd());
  const port = Number(env.VITE_PORT ?? 3000);

  return defineConfig({
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
  });
};
