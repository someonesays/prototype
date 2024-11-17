<script>
import { VITE_DISCORD_CLIENT_ID } from "$lib/utils/env";

import { onMount } from "svelte";
import { DiscordSDK, RPCCloseCodes } from "@discord/embedded-app-sdk";
import { MessageCodesToText, ParentSdk } from "@/public";

import { goto } from "$app/navigation";
import { launcher, launcherDiscordSdk } from "$lib/components/stores/launcher";

onMount(() => {
  const discordSdk = new DiscordSDK(VITE_DISCORD_CLIENT_ID);

  (async () => {
    // Wait for Discord to be ready
    await discordSdk.ready();

    // OAuth2
    const { code } = await discordSdk.commands.authorize({
      client_id: VITE_DISCORD_CLIENT_ID,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["guilds.members.read", "identify"],
    });

    // Get instance ID
    const urlParams = new URLSearchParams(window.location.search);
    const instanceId = urlParams.get("instance_id");

    if (!instanceId) return discordSdk.close(RPCCloseCodes.CLOSE_ABNORMAL, "Missing instance ID");

    // Get token
    const matchmaking = await ParentSdk.getMatchmakingDiscord({ instanceId, code, baseUrl: "/.proxy" });
    if (!matchmaking.success) return discordSdk.close(RPCCloseCodes.CLOSE_ABNORMAL, MessageCodesToText[matchmaking.code]);

    // Set launcher information
    $launcher = "discord";
    $launcherDiscordSdk = discordSdk;

    // Set URL
    const authorization = matchmaking.data.authorization;
    const server = matchmaking.data.data.room.server;

    // TODO: Go to rooms page
    // goto(`/rooms/${encodeURIComponent(res.data.data.room.id)}`);
  })();
});
</script>

<p>Loading launcher...</p>
