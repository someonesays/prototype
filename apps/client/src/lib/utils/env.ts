const envs = {
  development: {
    VITE_BASE_FRONTEND: import.meta.env.VITE_BASE_FRONTEND as string,
    VITE_BASE_API: import.meta.env.VITE_BASE_API as string,
    VITE_DISCORD_CLIENT_ID: import.meta.env.VITE_DISCORD_CLIENT_ID as string,
    VITE_TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY as string,
    VITE_TURNSTILE_BYPASS_SECRET: import.meta.env.VITE_TURNSTILE_BYPASS_SECRET as string | undefined,
  },
  staging: {
    VITE_BASE_FRONTEND: import.meta.env.VITE_BASE_FRONTEND ?? "https://staging.someonesays.io",
    VITE_BASE_API: import.meta.env.VITE_BASE_API ?? "https://staging-api.someonesays.io",
    VITE_DISCORD_CLIENT_ID: import.meta.env.VITE_DISCORD_CLIENT_ID ?? "1312178792256507924",
    VITE_TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "0x4AAAAAAA1Krb5_9TKRUaKy",
    VITE_TURNSTILE_BYPASS_SECRET: import.meta.env.VITE_TURNSTILE_BYPASS_SECRET as string | undefined,
  },
  production: {
    VITE_BASE_FRONTEND: "https://someonesays.io",
    VITE_BASE_API: "https://api.someonesays.io",
    VITE_DISCORD_CLIENT_ID: "1316295472121384991",
    VITE_TURNSTILE_SITE_KEY: "0x4AAAAAAA18iQyUa3nEBopk",
    VITE_TURNSTILE_BYPASS_SECRET: undefined,
  },
};

export default {
  VITE_IS_PROD: import.meta.env.PROD,
  VITE_MODE: import.meta.env.MODE,
  ...envs[import.meta.env.MODE as "development" | "staging" | "production"],
};
