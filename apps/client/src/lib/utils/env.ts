const envs = {
  development: {
    VITE_BASE_API: import.meta.env.VITE_BASE_API as string,
    VITE_DISCORD_CLIENT_ID: import.meta.env.VITE_DISCORD_CLIENT_ID as string,
    VITE_TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY as string,
    VITE_TURNSTILE_BYPASS_SECRET: import.meta.env.VITE_TURNSTILE_BYPASS_SECRET as string | undefined,
  },
  staging: {
    VITE_BASE_API: "https://staging-api.someonesays.io",
    VITE_DISCORD_CLIENT_ID: "1312178792256507924",
    VITE_TURNSTILE_SITE_KEY: "0x4AAAAAAA1Krb5_9TKRUaKy",
    VITE_TURNSTILE_BYPASS_SECRET: import.meta.env.VITE_TURNSTILE_BYPASS_SECRET as string | undefined,
  },
  production: {
    VITE_BASE_API: "",
    VITE_DISCORD_CLIENT_ID: "",
    VITE_TURNSTILE_SITE_KEY: "",
    VITE_TURNSTILE_BYPASS_SECRET: undefined,
  },
};

export default {
  VITE_IS_PROD: import.meta.env.PROD,
  ...envs[import.meta.env.MODE as "development" | "staging" | "production"],
};
