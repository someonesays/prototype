export default {
  VITE_IS_PROD: import.meta.env.PROD,
  VITE_MODE: import.meta.env.MODE,

  VITE_BASE_FRONTEND: import.meta.env.VITE_BASE_FRONTEND as string,
  VITE_BASE_API: import.meta.env.VITE_BASE_API as string,
  VITE_DISCORD_CLIENT_ID: import.meta.env.VITE_DISCORD_CLIENT_ID as string,
  VITE_TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY as string,
  VITE_TURNSTILE_SITE_KEY_INVISIBLE: import.meta.env.VITE_TURNSTILE_SITE_KEY_INVISIBLE as string,
  VITE_TURNSTILE_BYPASS_SECRET: import.meta.env.VITE_TURNSTILE_BYPASS_SECRET as string | undefined,
};
