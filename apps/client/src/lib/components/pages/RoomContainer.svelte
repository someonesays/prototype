<script lang="ts">
import { onMount } from "svelte";
import { beforeNavigate, goto } from "$app/navigation";
import { page } from "$app/stores";

import { room, roomParentSdk, roomWs } from "$lib/components/stores/roomState";
import { kickedReason } from "$lib/components/stores/lobby";

import { MessageCodesToText, RoomWebsocket, ServerOpcodes, GameStatus, MinigameEndReason, type APIResponse } from "@/public";

import MinigameContainer from "$lib/components/elements/rooms/RoomMinigameContainer.svelte";
import LobbyContainer from "$lib/components/elements/rooms/RoomLobbyContainer.svelte";
import { volumeValue } from "$lib/components/stores/settings";
import { launcher, launcherDiscordSdk, launcherMatchmaking } from "$lib/components/stores/launcher";
import { RPCCloseCodes } from "@discord/embedded-app-sdk";

// Get params
const roomId = $page.params.roomId;

// States
let connected = $state(false);
let minigameReady = $state(false);
let allowExitingPage = $state(true);
let exitedPage = $state(false);

// Warning when you try to leave the page
beforeNavigate(({ cancel }) => {
  if (!allowExitingPage) return cancel();
});

// On load tasks
onMount(() => {
  if (!$launcherMatchmaking) return goto(roomId === "new" ? "/" : `/join/${encodeURIComponent(roomId)}`);

  // Change route to /room/:roomId
  if (roomId === "new") {
    goto(`/rooms/${encodeURIComponent($launcherMatchmaking.data.room.id)}`);
  }

  // Disallow changing page
  allowExitingPage = false;

  // Handle the WebSocket
  $roomWs = new RoomWebsocket({
    debug: true,
    url: $launcherMatchmaking.data.room.server.url,
    authorization: $launcherMatchmaking.authorization,
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
    if (!player) return; // !player will be true when the host leaves the room during a game

    if (minigameReady) {
      // If the host leave, sending remove player is unnecessary because the game will end anyways
      $roomParentSdk?.removePlayer(evt);
    }

    $room?.players.splice($room?.players.indexOf(player), 1);
  });
  $roomWs.on(ServerOpcodes.TransferHost, (evt) => {
    if (!$room) throw new Error("Cannot find $room on transfer host event");

    $room.room.host = evt.user;
  });
  $roomWs.on(ServerOpcodes.UpdatedRoomSettings, (evt) => {
    if (!$room) throw new Error("Cannot find $room on updated room settings event");

    $room.minigame = evt.minigame;
    $room.pack = evt.pack;
  });

  // Handle minigame
  $roomWs.on(ServerOpcodes.LoadMinigame, (evt) => {
    if (!$room) throw new Error("Cannot find $room on load minigame");
    $room.status = GameStatus.WaitingForPlayersToLoadMinigame;
    $room.players = evt.players;
  });
  $roomWs.on(ServerOpcodes.EndMinigame, (evt) => {
    if (!$room) throw new Error("Cannot find $room on end minigame");

    $room.status = GameStatus.Lobby;
    $room.room.state = null;
    $room.players = evt.players;

    minigameReady = false;

    // TODO: Do something with evt.reason
    switch (evt.reason) {
      case MinigameEndReason.MinigameEnded: {
        // TODO: Do something with evt.prizes
        break;
      }
      case MinigameEndReason.ForcefulEnd: {
        break;
      }
      case MinigameEndReason.HostLeft: {
        break;
      }
      case MinigameEndReason.FailedToSatisfyMinimumPlayersToStart: {
        break;
      }
    }
  });
  $roomWs.on(ServerOpcodes.MinigamePlayerReady, (evt) => {
    if (!$room) throw new Error("Cannot find $room on end minigame");

    const player = $room.players.find((p) => p.id === evt.user);
    if (!player) throw new Error("Cannot find the player who readied up");

    player.ready = true;

    if ($room.user === player.id) {
      // Confirm the handshake
      // The point of the JSON.parse(JSON.stringify()) is because Svelte uses proxies so it'll break without that
      $roomParentSdk?.confirmHandshake(
        JSON.parse(
          JSON.stringify({
            settings: {
              language: "en-US",
              volume: $volumeValue,
            },
            user: $room.user,
            room: {
              host: $room.room.host,
              state: $room.room.state,
            },
            players: $room.players
              .filter((p) => p.ready)
              .map((p) => ({
                id: p.id,
                displayName: p.displayName,
                state: p.state,
              })),
          }),
        ),
      );

      // Send minigame start game with joined_late if it already started
      if ($room.status === GameStatus.Started) {
        $roomParentSdk?.setGameStarted({ joined_late: true });
      }

      // Set minigameReady = true to start recieving events through the SDK
      minigameReady = true;
    } else {
      // Sends to minigame that the player is ready
      // You should never recieve a readyPlayer event of yourself
      // Also, the point of the JSON.parse(JSON.stringify()) is because Svelte uses proxies so it'll break without that
      $roomParentSdk?.readyPlayer(
        JSON.parse(
          JSON.stringify({
            player: {
              id: player.id,
              displayName: player.displayName,
              state: player.state,
            },
            joined_late: $room.status === GameStatus.Started,
          }),
        ),
      );
    }
  });
  $roomWs.on(ServerOpcodes.MinigameStartGame, () => {
    if (!$room) throw new Error("Cannot find $room on start minigame");

    $room.status = GameStatus.Started;

    if (!minigameReady) return;
    $roomParentSdk?.setGameStarted({ joined_late: false });
  });
  $roomWs.on(ServerOpcodes.MinigameSetGameState, (evt) => {
    if (!$room) throw new Error("Cannot find $room on start minigame");

    $room.room.state = evt.state;

    if (!minigameReady) return;
    $roomParentSdk?.updateGameState(evt);
  });
  $roomWs.on(ServerOpcodes.MinigameSetPlayerState, (evt) => {
    if (!$room) throw new Error("Cannot find $room on start minigame");

    const player = $room.players.find((p) => p.id === evt.user);
    if (!player) throw new Error("Cannot find the player who set player state");

    player.state = evt.state;

    if (!minigameReady) return;
    $roomParentSdk?.updatePlayerState(evt);
  });
  $roomWs.on(ServerOpcodes.MinigameSendGameMessage, (evt) => {
    if (!minigameReady) return;
    $roomParentSdk?.sendGameMessage(evt);
  });
  $roomWs.on(ServerOpcodes.MinigameSendPrivateMessage, (evt) => {
    if (!minigameReady) return;
    $roomParentSdk?.sendPrivateMessage(evt);
  });

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

  return () => {
    // Make exitedPage = true for additional race-condition prevention checks
    exitedPage = true;

    // Remove room from stores
    $room = null;
    $launcherMatchmaking = null;

    // Close WebSocket and remove it from stores
    $roomWs?.close();
    $roomWs = null;
    $roomParentSdk = null;
  };
});

function kick(reason: string) {
  if (exitedPage) return;

  allowExitingPage = true;
  $kickedReason = reason;

  if ($launcher === "discord") {
    if (!$launcherDiscordSdk) throw new Error("Missing DiscordSDK. This should never happen.");
    return $launcherDiscordSdk.close(RPCCloseCodes.CLOSE_ABNORMAL, $kickedReason);
  }

  goto("/");
}
</script>
  
{#if !$room || $room.status === GameStatus.Lobby}
  <LobbyContainer />
{:else if $room.status === GameStatus.Started || $room.status === GameStatus.WaitingForPlayersToLoadMinigame}
  <MinigameContainer /> 
{/if}
