<script lang="ts">
import { VITE_BASE_API } from "$lib/utils/env";

import { onMount } from "svelte";
import { beforeNavigate, goto } from "$app/navigation";
import { page } from "$app/stores";

import { kickedReason } from "$lib/components/stores/kickedReason";

import { MessageCodesToText, RoomWebsocket, ParentSdk, ServerOpcodes, type APIResponse } from "@/public";

import MinigameContainer from "$lib/components/elements/rooms/RoomMinigameContainer.svelte";
import LobbyContainer from "$lib/components/elements/rooms/RoomLobbyContainer.svelte";

// States
let connected = $state(false);
let scene = $state<"lobby" | "minigame">("lobby");
let minigameId = $state<string | null>(null);
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
    // Get room from matchmaking
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

    if (!success) return kick(`Failed to connect to matchmaking: ${MessageCodesToText[code]}`);

    if (closed) return; // Prevent race-condition isssue.

    // Change route to /room/:roomId
    goto(`/rooms/${encodeURIComponent(matchmaking.data.room.id)}`);

    // Disallow changing page
    allowLeavingPage = false;

    // Connect to WebSocket

    // TODO: Refactor WebSocket to either a state or class which has event handlers and keeps the room state

    const ws = new RoomWebsocket({
      debug: true, // TODO: Disable this.
      url: matchmaking.data.room.server.url,
      authorization: matchmaking.authorization,
      messageType: "Oppack",
    });

    ws.once(ServerOpcodes.GetInformation, (evt) => {
      connected = true;

      scene = "lobby";
      // minigameId = "1";
      // scene = "minigame";
    });

    ws.onclose = (evt) => {
      if (!connected) {
        try {
          const { code } = JSON.parse(evt.reason) as APIResponse;
          return kick(`Failed to connect to server: ${MessageCodesToText[code]}`);
        } catch (err) {
          console.error("[WEBSOCKET] Failed to get WebSocket closure error.", evt);
          return kick(`Failed to connect to server: ${evt.reason}`);
        }
      } else {
        return kick("Disconnected!");
      }
    };
  })();

  return () => {
    closed = true;
    ws?.close();
  };
});

function kick(reason: string) {
  allowLeavingPage = true;
  $kickedReason = reason;
  goto("/");
}
</script>

{#if scene === "lobby"}
  <LobbyContainer />
{:else if scene === "minigame" && minigameId}
  <MinigameContainer minigameId={minigameId} /> 
{/if}
