<script lang="ts">
import { VITE_BASE_API } from "$lib/utils/env";

import { onMount } from "svelte";
import { beforeNavigate, goto } from "$app/navigation";
import { page } from "$app/stores";

import { MessageCodesToText, ParentSdk, ServerOpcodes, type APIResponse } from "@/public";
import { createSendMessage, parseMessage } from "$lib/utils/messages";

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

    const messageType: "Json" | "Oppack" = "Oppack";
    ws = new WebSocket(matchmaking.data.room.server.url, [matchmaking.authorization, messageType]);

    // Create send message function
    const send = createSendMessage({ ws, messageType });

    // Other variables
    let successfullyConnected = false;

    // Handle WebSocket
    ws.onopen = () => {
      console.debug("[WEBSOCKET] Connected to the WebSocket!");
    };

    ws.onmessage = async ({ data: payload }) => {
      const { opcode, data } = await parseMessage({ messageType, payload });
      console.debug(
        "[WEBSOCKET] Recieved message:",
        `ServerOpcodes.${Object.entries(ServerOpcodes).find(([_, k]) => k === opcode)?.[0]} (${opcode})`,
        data,
      );

      switch (opcode) {
        case ServerOpcodes.Error: {
          console.error("[WEBSOCKET] An error has occurred:");

          // TODO: Make this popup the error to the user.

          break;
        }
        case ServerOpcodes.GetInformation: {
          successfullyConnected = true;

          // TODO: Save all of the information here and actually make the game ykyk

          scene = "lobby";
          // minigameId = "1";
          // scene = "minigame";

          break;
        }
        case ServerOpcodes.PlayerJoin: {
          // TODO: Handle ServerOpcodes.PlayerJoin
          break;
        }
        case ServerOpcodes.PlayerLeft: {
          // TODO: Handle ServerOpcodes.PlayerLeft
          break;
        }
        case ServerOpcodes.TransferHost: {
          // TODO: Handle ServerOpcodes.TransferHost
          break;
        }
        case ServerOpcodes.UpdatedRoomSettings: {
          // TODO: Handle ServerOpcodes.UpdatedRoomSettings
          break;
        }
        case ServerOpcodes.LoadMinigame: {
          // TODO: Handle ServerOpcodes.LoadMinigame
          break;
        }
        case ServerOpcodes.EndMinigame: {
          // TODO: Handle ServerOpcodes.EndMinigame
          break;
        }
        case ServerOpcodes.MinigamePlayerReady: {
          // TODO: Handle ServerOpcodes.MinigamePlayerReady
          break;
        }
        case ServerOpcodes.MinigameStartGame: {
          // TODO: Handle ServerOpcodes.MinigameStartGame
          break;
        }
        case ServerOpcodes.MinigameSetGameState: {
          // TODO: Handle ServerOpcodes.MinigameSetGameState
          break;
        }
        case ServerOpcodes.MinigameSetPlayerState: {
          // TODO: Handle ServerOpcodes.MinigameSetPlayerState
          break;
        }
        case ServerOpcodes.MinigameSendGameMessage: {
          // TODO: Handle ServerOpcodes.MinigameSendGameMessage
          break;
        }
        case ServerOpcodes.MinigameSendPlayerMessage: {
          // TODO: Handle ServerOpcodes.MinigameSendPlayerMessage
          break;
        }
        case ServerOpcodes.MinigameSendPrivateMessage: {
          // TODO: Handle ServerOpcodes.MinigameSendPrivateMessage
          break;
        }
      }
    };

    ws.onclose = (evt) => {
      console.debug("[WEBSOCKET] WebSocket has been disconnected!");

      if (!successfullyConnected) {
        try {
          const { code } = JSON.parse(evt.reason) as APIResponse;
          kickReason = `Failed to connect to matchmaking: ${MessageCodesToText[code]}`;
        } catch (err) {
          kickReason = `Failed to connect to matchmaking: ${evt.reason}`;
        }
        scene = "kicked";
        return;
      }
    };
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
  