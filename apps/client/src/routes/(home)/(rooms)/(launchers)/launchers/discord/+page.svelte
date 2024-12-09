<script lang="ts">
import env from "$lib/utils/env";

import Logo from "$lib/components/icons/Logo.svelte";

import { onMount } from "svelte";
import { DiscordSDK, Platform, RPCCloseCodes } from "@discord/embedded-app-sdk";
import { MatchmakingType, ErrorMessageCodesToText, RoomWebsocket } from "@/public";

import { goto } from "$app/navigation";
import { launcher, launcherDiscordSdk, launcherMatchmaking } from "$lib/components/stores/launcher";

let failed = $state(false);
let transformScale = $state(1);

onMount(() => {
  const resize = () => {
    transformScale = Math.min(window.innerWidth / 350, window.innerHeight / 350);
  };
  window.addEventListener("resize", resize);
  resize();

  try {
    // Add Discord style
    document.body.classList.add("discord");

    // Set the launcher
    $launcher = "discord";

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
        } = await RoomWebsocket.getMatchmakingDiscord({
          instanceId,
          code,
          baseUrl: "/.proxy",
          mobile: discordSdk.platform === Platform.MOBILE,
        });
        if (!matchmakingSuccess) {
          console.error("[MATCHMAKING] Failed to connect to matchmaking:", ErrorMessageCodesToText[matchmakingCode]);
          return discordSdk.close(RPCCloseCodes.CLOSE_ABNORMAL, ErrorMessageCodesToText[matchmakingCode]);
        }

        // Set access_token
        if (matchmaking.data.metadata.type !== MatchmakingType.DISCORD)
          throw new Error("Metadata type is not 'discord'. This should never happen.");

        await discordSdk.commands.authenticate({ access_token: matchmaking.data.metadata.accessToken });

        // Set launcher information
        $launcherDiscordSdk = discordSdk;

        // Set matchmaking store
        $launcherMatchmaking = matchmaking;

        // Remove resizing loading
        window.removeEventListener("resize", resize);

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

<div class="loader-container">
  <div style="transform: scale({transformScale});">
    <div class="loader-section">
      <div style="width: 140px;"><Logo /></div>
      {#if !failed}
        <br>
        <div class="loading-animation"></div>
      {/if}
      <br>
      <span class="loading-text">
        {#if failed}
          Failed to load launcher.
        {:else}
          Loading...
        {/if}
      </span>
    </div>
  </div>
</div>

<style>
  .loader-container {
    display: flex;
    height: 100%;
    min-height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: safe center;
  }
  .loader-section {
    display: flex;
    flex-direction: column;
    align-items: center;

    color: var(--primary-text);
    padding: 50px;
    border-radius: 15px;

    user-select: none;

    animation-name: appear-animation;
    animation-duration: .7s;
    animation-timing-function: ease-out;
  }
  @keyframes appear-animation {
    0% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
  .loading-text {
    font-size: 14px;
  }
  .loading-animation {
    border: 3px solid #5812e2;
    border-top: 3px solid #fafafa;
    width: 25px;
    height: 25px;
  }
</style>
