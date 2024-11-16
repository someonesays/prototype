<script lang="ts">
import { VITE_BASE_API } from "$lib/utils/env";

import { onMount } from "svelte";
import { beforeNavigate, goto } from "$app/navigation";
import { page } from "$app/stores";

import { displayName } from "$lib/components/stores/displayName";
import { kickedReason } from "$lib/components/stores/kickedReason";

import {
  MessageCodesToText,
  RoomWebsocket,
  ParentSdk,
  ServerOpcodes,
  GameStatus,
  type APIResponse,
  type ServerTypes,
} from "@/public";

import MinigameContainer from "$lib/components/elements/rooms/RoomMinigameContainer.svelte";
import LobbyContainer from "$lib/components/elements/rooms/RoomLobbyContainer.svelte";

// Get params
const roomId = $page.params.roomId;

// Connection states
let connected = $state(false);
let ws = $state<WebSocket>();
let room = $state<ServerTypes[ServerOpcodes.GetInformation]>();

// Scene states
let scene = $state<"lobby" | "minigame">("lobby");
let minigameId = $state<string | null>(null);

// Page states
let allowExitingPage = $state(true);
let exitedPage = $state(false);

// Warning when you try to leave the page
beforeNavigate(({ cancel }) => {
  if (!allowExitingPage) return cancel();
});

// On load tasks
onMount(() => {
  if (!$displayName) {
    return goto(roomId === "new" ? "/" : `/join/${encodeURIComponent(roomId)}`);
  }

  (async () => {
    // Get room from matchmaking
    const {
      success,
      code,
      data: matchmaking,
    } = await ParentSdk.getMatchmaking({
      roomId: roomId === "new" ? undefined : roomId,
      displayName: $displayName,
      baseUrl: VITE_BASE_API,
    });

    if (!success) return kick(`Failed to connect to matchmaking: ${MessageCodesToText[code]}`);
    if (exitedPage) return; // Prevent race-condition isssue.

    // Change route to /room/:roomId
    goto(`/rooms/${encodeURIComponent(matchmaking.data.room.id)}`);

    // Disallow changing page
    allowExitingPage = false;

    // Handle the WebSocket
    const ws = new RoomWebsocket({
      debug: true, // TODO: Disable this.
      url: matchmaking.data.room.server.url,
      authorization: matchmaking.authorization,
      messageType: "Json", // TODO: Make this "Oppack" after debugging is finished
    });

    ws.once(ServerOpcodes.GetInformation, (evt) => {
      connected = true;
      room = evt;

      scene = "lobby";
      // minigameId = "1";
      // scene = "minigame";
    });

    ws.onclose = (evt) => {
      try {
        const { code } = JSON.parse(evt.reason) as APIResponse;

        if (connected) return kick(MessageCodesToText[code]);
        return kick(`Failed to connect to server: ${MessageCodesToText[code]}`);
      } catch (err) {
        if (connected) return kick("Disconnected!");

        console.error("[WEBSOCKET] Failed to get WebSocket closure error.", evt);
        return kick(`Failed to connect to server: ${evt.reason}`);
      }
    };
  })();

  return () => {
    exitedPage = true;
    ws?.close();
  };
});

function kick(reason: string) {
  allowExitingPage = true;
  $kickedReason = reason;
  goto("/");
}
</script>

{#if !room || room.status === GameStatus.Lobby}
  <LobbyContainer />
{:else if room.status === GameStatus.WaitingForPlayersToLoadMinigame || room.status === GameStatus.Started}
  {#if minigameId}
    <MinigameContainer minigameId={minigameId} /> 
  {:else}
    <p>Missing minigame ID.</p>
  {/if}
{/if}
