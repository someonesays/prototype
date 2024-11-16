<script lang="ts">
import { VITE_BASE_API } from "$lib/utils/env";

import { onMount } from "svelte";
import { beforeNavigate, goto } from "$app/navigation";
import { page } from "$app/stores";

import { MessageCodesToText, RoomWebsocket, ParentSdk, ServerOpcodes, type APIResponse } from "@/public";

import MinigameContainer from "$lib/components/elements/rooms/MinigameContainer.svelte";
import LobbyContainer from "../rooms/LobbyContainer.svelte";

// States
let scene = $state<"loading" | "kicked" | "lobby" | "minigame">("loading");
let minigameId = $state<string | null>(null);
let kickReason = $state("An unexpected error has occured.");
let allowLeavingPage = $state(true);

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
    const {
      success,
      code,
      data: matchmaking,
    } = await ParentSdk.getMatchmaking({
      roomId: roomId === "new" ? undefined : roomId,
      // TODO: Support displayName when you join a game.
      // displayName:
      baseUrl: VITE_BASE_API,
    });

    if (!success) {
      kickReason = `Failed to connect to matchmaking: ${MessageCodesToText[code]}`;
      scene = "kicked";
      return;
    }

    if (closed) return; // Prevent race-condition isssue.

    // Change route to /room/:roomId
    goto(`/rooms/${encodeURIComponent(matchmaking.data.room.id)}`);

    // Disallow changing page
    allowLeavingPage = false;

    // Connect to WebSocket

    // TODO: Refactor WebSocket to either a state or class which has event handlers and keeps the room state

    let connected = false;
    const ws = new RoomWebsocket({
      debug: true, // TODO: Disable this.
      url: matchmaking.data.room.server.url,
      authorization: matchmaking.authorization,
      messageType: "Oppack",
    });

    ws.once(ServerOpcodes.GetInformation, (evt) => {
      scene = "lobby";
      // minigameId = "1";
      // scene = "minigame";
    });

    ws.once(ServerOpcodes.Disconnected, (evt) => {
      if (!connected) {
        try {
          const { code } = JSON.parse(evt.reason) as APIResponse;
          kickReason = `Failed to connect to matchmaking: ${MessageCodesToText[code]}`;
        } catch (err) {
          console.error("[WEBSOCKET] Failed to get WebSocket closure error.", evt);
          kickReason = `Failed to connect to matchmaking: ${evt.reason}`;
        }
        scene = "kicked";
        return;
      }
    });
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
  