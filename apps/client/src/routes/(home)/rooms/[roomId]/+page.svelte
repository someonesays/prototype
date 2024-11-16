<script lang="ts">
import { VITE_BASE_API } from "$lib/utils/env";

import { onMount } from "svelte";
import { beforeNavigate, goto } from "$app/navigation";
import { page } from "$app/stores";

import { room, roomWs } from "$lib/components/stores/roomState";
import { displayName } from "$lib/components/stores/displayName";
import { kickedReason } from "$lib/components/stores/kickedReason";

import { MessageCodesToText, RoomWebsocket, ParentSdk, ServerOpcodes, GameStatus, type APIResponse } from "@/public";

import MinigameContainer from "$lib/components/elements/rooms/RoomMinigameContainer.svelte";
import LobbyContainer from "$lib/components/elements/rooms/RoomLobbyContainer.svelte";

// Get params
const roomId = $page.params.roomId;

// States
let connected = $state(false);
let minigameId = $state<string | null>(null);
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

    if (exitedPage) return; // Prevent race-condition isssue.
    if (!success) return kick(`Failed to connect to matchmaking: ${MessageCodesToText[code]}`);

    // Change route to /room/:roomId
    goto(`/rooms/${encodeURIComponent(matchmaking.data.room.id)}`);

    // Disallow changing page
    allowExitingPage = false;

    // Handle the WebSocket
    $roomWs = new RoomWebsocket({
      debug: true, // TODO: Disable this.
      url: matchmaking.data.room.server.url,
      authorization: matchmaking.authorization,
      messageType: "Json", // TODO: Make this "Oppack" after debugging is finished
    });

    // TODO: Handle error
    $roomWs.on(ServerOpcodes.Error, (evt) => {});

    // Handle room store value
    $roomWs.once(ServerOpcodes.GetInformation, (evt) => {
      connected = true;
      $room = evt;
    });
    $roomWs.on(ServerOpcodes.PlayerJoin, (evt) => {
      $room?.players.push(evt.player);
    });
    $roomWs.on(ServerOpcodes.PlayerLeft, (evt) => {
      const player = $room?.players.find((p) => p.id === evt.user);
      if (!player) throw new Error("Cannot find the player who left the room");
      $room?.players.splice($room?.players.indexOf(player), 1);
    });
    $roomWs.on(ServerOpcodes.TransferHost, (evt) => {
      if (!$room) throw new Error("Cannot find $room on transfer host event");
      $room.room.host = evt.user;
    });
    $roomWs.on(ServerOpcodes.UpdatedRoomSettings, (evt) => {
      if (!$room) throw new Error("Cannot find $room on transfer host event");
      $room.minigame = evt.minigame;
      $room.pack = evt.pack;
    });

    // TODO: Handle minigame
    $roomWs.on(ServerOpcodes.LoadMinigame, (evt) => {});
    $roomWs.on(ServerOpcodes.EndMinigame, (evt) => {});
    $roomWs.on(ServerOpcodes.MinigamePlayerReady, (evt) => {});
    $roomWs.on(ServerOpcodes.MinigameStartGame, (evt) => {});
    $roomWs.on(ServerOpcodes.MinigameSetGameState, (evt) => {});
    $roomWs.on(ServerOpcodes.MinigameSetPlayerState, (evt) => {});
    $roomWs.on(ServerOpcodes.MinigameSendGameMessage, (evt) => {});
    $roomWs.on(ServerOpcodes.MinigameSendPlayerMessage, (evt) => {});
    $roomWs.on(ServerOpcodes.MinigameSendPrivateMessage, (evt) => {});

    // Handles WebSocket closure
    $roomWs.onclose = (evt) => {
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
    // Make exitedPage = true for additional race-condition prevention checks
    exitedPage = true;

    // Remove room from stores
    $room = null;

    // Close WebSocket and remove it from stores
    $roomWs?.close();
    $roomWs = null;
  };
});

function kick(reason: string) {
  if (exitedPage) return;

  allowExitingPage = true;
  $kickedReason = reason;
  goto("/");
}
</script>

{#if !$room || $room.status === GameStatus.Lobby}
  <LobbyContainer />
{:else if $room.status === GameStatus.Started || $room.status === GameStatus.WaitingForPlayersToLoadMinigame}
  {#if minigameId}
    <MinigameContainer minigameId={minigameId} /> 
  {:else}
    <p>Missing minigame ID.</p>
  {/if}
{/if}
