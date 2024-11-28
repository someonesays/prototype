<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { DiscordSDK, RPCCloseCodes } from "@discord/embedded-app-sdk";
import { MatchmakingType, ErrorMessageCodesToText, RoomWebsocket } from "@/public";

import { goto } from "$app/navigation";
import { launcher, launcherDiscordSdk, launcherMatchmaking } from "$lib/components/stores/launcher";

let failed = $state(false);

onMount(() => {
  try {
    // Load Discord SDK
    const discordSdk = new DiscordSDK(env.VITE_DISCORD_CLIENT_ID);

    (async () => {
      try {
        // Wait for Discord to be ready
        await discordSdk.ready();

        // OAuth2
        const { code } = await discordSdk.commands.authorize({
          client_id: env.VITE_DISCORD_CLIENT_ID,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify", "guilds", "guilds.members.read"],
        });

        // Get instance ID
        const urlParams = new URLSearchParams(window.location.search);
        const instanceId = urlParams.get("instance_id");

        if (!instanceId) return discordSdk.close(RPCCloseCodes.CLOSE_ABNORMAL, "Missing instance ID");

        // Get token
        const {
          success: matchmakingSuccess,
          code: matchmakingCode,
          data: matchmaking,
        } = await RoomWebsocket.getMatchmakingDiscord({ instanceId, code, baseUrl: "/.proxy" });
        if (!matchmakingSuccess) {
          console.error("[MATCHMAKING] Failed to connect to matchmaking:", ErrorMessageCodesToText[matchmakingCode]);
          return discordSdk.close(RPCCloseCodes.CLOSE_ABNORMAL, ErrorMessageCodesToText[matchmakingCode]);
        }

        // Set access_token
        if (matchmaking.data.metadata.type !== MatchmakingType.DISCORD)
          throw new Error("Metadata type is not 'discord'. This should never happen.");

        await discordSdk.commands.authenticate({ access_token: matchmaking.data.metadata.accessToken });

        // Set launcher information
        $launcher = "discord";
        $launcherDiscordSdk = discordSdk;

        // Set matchmaking store
        $launcherMatchmaking = matchmaking;

        // Go to rooms page
        goto(`/rooms/${encodeURIComponent(matchmaking.data.room.id)}`);
      } catch (err) {
        console.error(err);
        failed = true;

        // Close the activity
        return discordSdk.close(RPCCloseCodes.CLOSE_NORMAL, "Failed to load launcher");
      }
    })();
  } catch (err) {
    console.error(err);
    failed = true;
  }
});
</script>

{#if failed}
  <p>Failed to load launcher.</p>
{:else}
  <p>Loading launcher...</p>
{/if}
