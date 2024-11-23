import env from "@/env";

export async function verifyDiscordOAuth2Token(code: string) {
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "post",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.DiscordClientId,
      client_secret: env.DiscordClientSecret,
      redirect_uri: env.DiscordRedirectUri,
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
  const res = await fetch("https://discord.com/api/users/@me", {
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
  const res = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
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
  const res = await fetch(`https://discord.com/api/applications/${env.DiscordClientId}/activity-instances/${instanceId}`, {
    headers: {
      authorization: `Bot ${env.DiscordToken}`,
      "content-type": "application/json",
    },
  });
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
