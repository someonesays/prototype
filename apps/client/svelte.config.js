import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: "../server/build",
      fallback: "index.html",
    }),
    env: {
      dir: "../../",
      publicPrefix: "VITE_",
    },
    csp: {
      directives: {
        "script-src": ["self"],
      },
      reportOnly: {
        "script-src": ["self"],
        "report-to": ["self"],
      },
    },
  },
};
