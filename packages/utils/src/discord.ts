import env from "@/env";
import { fetchAndRetry } from "./rateLimits";

export async function verifyDiscordOAuth2Token({
  clientId,
  clientSecret,
  redirectUri,
  code,
}: { clientId: string; clientSecret: string; redirectUri: string; code: string }) {
  const res = await fetchAndRetry("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (res.status !== 200) {
    console.error("Failed to verify Discord OAuth2 token", await res.json());
    return null;
  }

  return (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
  };
}

export async function getDiscordUser(accessToken: string) {
  const res = await fetchAndRetry("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status !== 200) {
    console.error("Failed to get Discord user", await res.json());
    return null;
  }
  return (await res.json()) as {
    id: string;
    username: string;
    discriminator: string;
    global_name?: string;
    avatar?: string;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    banner?: string;
    accent_color?: number;
    locale?: string;
    verified?: boolean;
    email?: string;
    flags?: number;
    premium_type?: number;
    public_flags?: number;
    avatar_decoration_data?: {
      sku_id: string;
      asset: string;
    };
  };
}

export async function getDiscordMember({ guildId, accessToken }: { guildId: string; accessToken: string }) {
  const res = await fetchAndRetry(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status !== 200) {
    console.error("Failed to get Discord member", await res.json());
    return null;
  }
  return (await res.json()) as {
    user?: Awaited<ReturnType<typeof getDiscordUser>>;
    nick?: string;
    avatar?: string;
    banner?: string;
    roles: string[];
    joined_at: string;
    deaf: boolean;
    mute: boolean;
  };
}

export async function getActivityInstance(instanceId: string) {
  const res = await fetchAndRetry(
    `https://discord.com/api/applications/${env.DISCORD_CLIENT_ID}/activity-instances/${instanceId}`,
    {
      headers: {
        authorization: `Bot ${env.DISCORD_TOKEN}`,
        "content-type": "application/json",
      },
    },
  );
  if (res.status !== 200) {
    console.error("Failed to get Discord activity instance", await res.json());
    return null;
  }
  return (await res.json()) as {
    application_id: string;
    instance_id: string;
    launch_id: string;
    location: {
      id: string;
      kind: "gc" | "pc";
      channel_id: string;
      guild_id?: string;
    };
    users: string[];
  };
}
