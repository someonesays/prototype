<script lang="ts">
import { VITE_BASE_API } from "$lib/utils/env";

import { onMount } from "svelte";
import { beforeNavigate, goto } from "$app/navigation";
import { page } from "$app/stores";

import { ParentSdk } from "@/public";

import MinigameContainer from "$lib/components/elements/rooms/MinigameContainer.svelte";
import LobbyContainer from "../rooms/LobbyContainer.svelte";

// States
let scene = $state<"loading" | "kicked" | "lobby" | "minigame">("loading");
let minigameId = $state<string | null>(null);
let kickReason = $state("An unexpected error has occured.");
let allowLeavingPage = $state(false);

// Warning when you try to leave the page
beforeNavigate(({ cancel }) => {
  if (!allowLeavingPage) return cancel();
});

onMount(() => {
  let closed = false;
  let ws: WebSocket;
  const roomId = $page.params.roomId;

  (async () => {
    // Get room from matchmakign
    const { success, data: matchmaking } = await ParentSdk.getMatchmaking({
      roomId: roomId === "new" ? undefined : roomId,
      // TODO: Support displayName when you join a game.
      // displayName:
      baseUrl: VITE_BASE_API,
    });

    if (!success) {
      allowLeavingPage = true;
      kickReason = "Failed to connect to matchmaking";
      scene = "kicked";
      return;
    }

    if (closed) return; // Prevent race-condition isssue.

    // Change route to /room/:roomId
    goto(`/rooms/${encodeURIComponent(matchmaking.data.room.id)}`);

    // Connect to WebSocket
    const opcode: "Json" | "Oppack" = "Oppack";
    ws = new WebSocket(matchmaking.data.room.server.url, [matchmaking.authorization, opcode]);

    ws.onopen = () => {
      console.log("test websocket opened");
    };

    ws.onclose = () => {
      console.log("test websocket closed");
    };

    // TODO: Remove this testing code and actually finish implementing WebSockets and such
    scene = "lobby";
    // minigameId = "1";
    // scene = "minigame";
  })();

  return () => {
    closed = true;
    ws?.close();
  };
});
</script>
    
  <main>
    {#if scene === "loading"}
      <p>Loading...</p>
    {:else if scene === "kicked"}
      <p>{kickReason}</p>
    {:else if scene === "lobby"}
      <LobbyContainer />
    {:else if scene === "minigame"}
      {#if minigameId}
        <MinigameContainer minigameId={minigameId} />
      {:else}
        <p>Missing minigame ID.</p>
      {/if}
    {/if}
  </main>
  