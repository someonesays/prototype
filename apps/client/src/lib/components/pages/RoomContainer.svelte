<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { beforeNavigate, goto } from "$app/navigation";
import { page } from "$app/state";

import { audio } from "$lib/utils/audio";
import { getMinigameStore } from "$lib/utils/store";

import {
  ErrorMessageCodesToText,
  RoomWebsocket,
  ClientOpcodes,
  ParentOpcodes,
  ServerOpcodes,
  GameStatus,
  MinigameEndReason,
  ErrorMessageCodes,
  type ApiErrorResponse,
  type ParentTypes,
} from "@/public";

import {
  room,
  roomWs,
  roomHandshakeCount,
  roomRequestedToChangeSettings,
  roomRequestedToStartGame,
  roomRequestedToLeave,
  roomParentSdk,
  roomMinigameReady,
  roomJoinedLate,
  roomLobbyPopupMessage,
  roomFeaturedMinigames,
  roomMinigameIdOnJoin,
} from "$lib/stores/home/roomState";
import { launcher, launcherDiscordSdk, launcherMatchmaking } from "$lib/stores/home/launcher";
import { kickedReason } from "$lib/stores/home/lobby";
import { volumeValue } from "$lib/stores/home/settings";
import { isModalOpen } from "$lib/stores/home/modal";

import MinigameContainer from "$lib/components/elements/rooms/scenes/RoomMinigameContainer.svelte";
import LobbyContainer from "$lib/components/elements/rooms/scenes/RoomLobbyContainer.svelte";

import { RPCCloseCodes } from "@discord/embedded-app-sdk";

// Get params
const roomId = page.params.roomId;

// States
let connected = $state(false);
let allowExitingPage = $state(true);
let exitedPage = $state(false);

// Warning when you try to leave the page
beforeNavigate(({ cancel }) => {
  if (!allowExitingPage && env.VITE_IS_PROD) return cancel();
});

// On load tasks
onMount(() => {
  // Reset $roomRequestedToLeave variable to false
  $roomRequestedToLeave = false;

  // Join if no launcher is present (aka normal or discord)
  if (!$launcherMatchmaking) return goto(roomId === "new" ? "/" : `/join/${encodeURIComponent(roomId)}`);

  // Change route to /room/:roomId
  if (roomId === "new") {
    goto(`/rooms/${encodeURIComponent($launcherMatchmaking.data.room.id)}`);
  }

  // Disallow changing page
  allowExitingPage = false;

  // Handle the WebSocket
  $roomWs = new RoomWebsocket({
    url: $launcherMatchmaking.data.room.server.url,
    authorization: $launcherMatchmaking.authorization,
    messageType: env.VITE_IS_PROD ? "Oppack" : "Json",
  });

  // Handle error
  $roomWs.on(ServerOpcodes.ERROR, (evt) => {
    if ($room?.status !== GameStatus.LOBBY) return;

    const code = evt as ErrorMessageCodes;

    if (
      ![
        ErrorMessageCodes.WS_CANNOT_FIND_MINIGAME,
        ErrorMessageCodes.WS_MINIGAME_MISSING_PROXY_URL,
        ErrorMessageCodes.WS_CANNOT_START_WITHOUT_MINIGAME,
        ErrorMessageCodes.WS_CANNOT_START_FAILED_REQUIREMENTS,
      ].includes(code)
    )
      return;

    if ([ErrorMessageCodes.WS_CANNOT_FIND_MINIGAME, ErrorMessageCodes.WS_MINIGAME_MISSING_PROXY_URL].includes(code)) {
      $roomRequestedToChangeSettings = false;
    }

    if (
      [ErrorMessageCodes.WS_CANNOT_START_WITHOUT_MINIGAME, ErrorMessageCodes.WS_CANNOT_START_FAILED_REQUIREMENTS].includes(
        code,
      )
    ) {
      $roomRequestedToStartGame = false;
    }

    $isModalOpen = true;
    $roomLobbyPopupMessage = { type: "warning", message: ErrorMessageCodesToText[code] };
  });

  // Handle room store value
  $roomWs.once(ServerOpcodes.GET_INFORMATION, (evt) => {
    connected = true;
    $room = evt;

    if ($roomMinigameIdOnJoin && $room.room.host === $room.user) {
      $roomRequestedToChangeSettings = true;
      $roomWs?.send({
        opcode: ClientOpcodes.SET_ROOM_SETTINGS,
        data: { minigameId: $roomMinigameIdOnJoin },
      });
    }
    $roomMinigameIdOnJoin = null;
  });
  $roomWs.on(ServerOpcodes.PLAYER_JOIN, (player) => {
    $room?.players.push(player);
  });
  $roomWs.on(ServerOpcodes.PLAYER_LEFT, (user) => {
    const player = $room?.players.find((p) => p.id === user);
    if (!player) return; // !player will be true when the host leaves the room during a game

    if ($roomMinigameReady) {
      // If the host leave, sending remove player is unnecessary because the game will end anyways
      $roomParentSdk?.removePlayer({ user });
    }

    $room?.players.splice($room?.players.indexOf(player), 1);
  });
  $roomWs.on(ServerOpcodes.TRANSFER_HOST, (user) => {
    if (!$room) throw new Error("Cannot find $room on transfer host event");

    if ($room.user === $room.room.host) {
      $roomRequestedToChangeSettings = false;
    }

    $room.room.host = user;
  });
  $roomWs.on(ServerOpcodes.UPDATED_ROOM_SETTINGS, ({ minigame }) => {
    if (!$room) throw new Error("Cannot find $room on updated room settings event");

    $roomRequestedToChangeSettings = false;
    if (["credits", "select-minigame", "select-minigame-search"].includes($roomLobbyPopupMessage?.type ?? "")) {
      $roomLobbyPopupMessage = null;
      $isModalOpen = false;
    }

    const gameSectionDiv = document.querySelector(".game-section");
    if (gameSectionDiv) {
      let scrollPercentage = gameSectionDiv.scrollTop / (gameSectionDiv.scrollHeight - gameSectionDiv.clientHeight);
      if (scrollPercentage > 0.999) scrollPercentage = 1;

      setTimeout(() => {
        gameSectionDiv.scrollTop = scrollPercentage * (gameSectionDiv.scrollHeight - gameSectionDiv.clientHeight);
      }, 0);
    }

    const oldMinigameId = $room.minigame?.id;

    $room.minigame = minigame;

    if ($room.minigame && $room.minigame.id !== oldMinigameId) {
      const minigameIconImage = $room.minigame.iconImage;
      const minigamePreviewImage = $room.minigame.previewImage;

      $room.minigame.iconImage = null;
      $room.minigame.previewImage = null;

      setTimeout(() => {
        if (!$room?.minigame) return;

        $room.minigame.iconImage = minigameIconImage;
        $room.minigame.previewImage = minigamePreviewImage;
      }, 0);
    }
  });

  // Handle minigame
  $roomWs.on(ServerOpcodes.LOAD_MINIGAME, (evt) => {
    if (!$room) throw new Error("Cannot find $room on load minigame");

    $room.players = evt.players;
    $roomHandshakeCount = evt.roomHandshakeCount;

    $room.status = GameStatus.WAITING_PLAYERS_TO_LOAD_MINIGAME;

    audio.start.play();
  });
  $roomWs.on(ServerOpcodes.END_MINIGAME, ({ players, reason }) => {
    if (!$room) throw new Error("Cannot find $room on end minigame");

    $roomParentSdk?.destroy();

    const forcefullyEndedAfterStarted = $room.status === GameStatus.STARTED;

    $room.status = GameStatus.LOBBY;
    $room.room.state = null;
    $room.players = players;

    $roomMinigameReady = false;

    setTimeout(() => {
      switch (reason) {
        case MinigameEndReason.FORCEFUL_END: {
          if (forcefullyEndedAfterStarted && $room?.user !== $room?.room.host) {
            $isModalOpen = true;
            $roomLobbyPopupMessage = { type: "warning", message: "The host has forcefully ended the minigame." };
          }
          break;
        }
        case MinigameEndReason.HOST_LEFT: {
          $isModalOpen = true;
          $roomLobbyPopupMessage = {
            type: "warning",
            message: "The minigame has forcefully ended because the host has left the game.",
          };
          break;
        }
        case MinigameEndReason.FAILED_TO_SATISFY_MINIMUM_PLAYERS_TO_START: {
          if ($room?.user === $room?.room.host) {
            $isModalOpen = true;
            $roomLobbyPopupMessage = {
              type: "warning",
              message: ErrorMessageCodesToText[ErrorMessageCodes.WS_CANNOT_START_FAILED_REQUIREMENTS],
            };
          }
          break;
        }
      }
    }, 0);
  });
  $roomWs.on(ServerOpcodes.MINIGAME_PLAYER_READY, async (user) => {
    if (!$room) throw new Error("Cannot find $room on player ready");
    if (!$room.minigame?.id) throw new Error("Cannot find $room.minigame?.id on player ready");

    const player = $room.players.find((p) => p.id === user);
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
            data: await getMinigameStore($room.minigame.id),
            players: $room.players
              .filter((p) => p.ready)
              .map((p) => ({
                id: p.id,
                displayName: p.displayName,
                mobile: p.mobile,
                avatar: p.avatar,
                state: p.state,
              })),
          } as ParentTypes[ParentOpcodes.READY]),
        ),
      );

      // Send minigame start game with joinedLate if it already started
      if ($room.status === GameStatus.STARTED) {
        $roomJoinedLate = true;
        $roomParentSdk?.setGameStarted({ joinedLate: true });
      }

      // Set $roomMinigameReady = true to start recieving events through the SDK
      $roomMinigameReady = true;
    } else {
      // Sends to minigame that the player is ready
      // You should never recieve a readyPlayer event of yourself
      // Also, the point of the JSON.parse(JSON.stringify()) is because Svelte uses proxies so it'll break without that
      $roomJoinedLate = $room.status === GameStatus.STARTED;
      $roomParentSdk?.readyPlayer(
        JSON.parse(
          JSON.stringify({
            player: {
              id: player.id,
              displayName: player.displayName,
              avatar: player.avatar,
              mobile: player.mobile,
              state: player.state,
            },
            joinedLate: $room.status === GameStatus.STARTED,
          } as ParentTypes[ParentOpcodes.MINIGAME_PLAYER_READY]),
        ),
      );
    }
  });
  $roomWs.on(ServerOpcodes.MINIGAME_START_GAME, () => {
    if (!$room) throw new Error("Cannot find $room on start minigame");

    $roomRequestedToStartGame = false;
    $room.status = GameStatus.STARTED;

    if (!$roomMinigameReady) return;

    $roomJoinedLate = false;
    $roomParentSdk?.setGameStarted({ joinedLate: false });
  });
  $roomWs.on(ServerOpcodes.MINIGAME_SET_GAME_STATE, (state) => {
    if (!$room) throw new Error("Cannot find $room on start minigame");

    $room.room.state = state;

    if (!$roomMinigameReady) return;
    $roomParentSdk?.updateGameState({ state });
  });
  $roomWs.on(ServerOpcodes.MINIGAME_SET_PLAYER_STATE, ([user, state]) => {
    if (!$room) throw new Error("Cannot find $room on start minigame");

    const player = $room.players.find((p) => p.id === user);
    if (!player) throw new Error("Cannot find the player who set player state");

    player.state = state;

    if (!$roomMinigameReady) return;
    $roomParentSdk?.updatePlayerState({ user, state });
  });
  $roomWs.on(ServerOpcodes.MINIGAME_SEND_GAME_MESSAGE, (message) => {
    if (!$roomMinigameReady) return;
    $roomParentSdk?.sendGameMessage({ message });
  });
  $roomWs.on(ServerOpcodes.MINIGAME_SEND_PLAYER_MESSAGE, ([user, message]) => {
    if (!$roomMinigameReady) return;
    $roomParentSdk?.sendPlayerMessage({ user, message });
  });
  $roomWs.on(ServerOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE, ([fromUser, toUser, message]) => {
    if (!$roomMinigameReady) return;
    $roomParentSdk?.sendPrivateMessage({ fromUser, toUser, message });
  });
  $roomWs.on(ServerOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE, (message) => {
    if (!$roomMinigameReady) return;
    $roomParentSdk?.sendBinaryGameMessage(message);
  });
  $roomWs.on(ServerOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE, ([user, message]) => {
    if (!$roomMinigameReady) return;
    $roomParentSdk?.sendBinaryPlayerMessage({ user, message });
  });
  $roomWs.on(ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE, ([fromUser, toUser, message]) => {
    if (!$roomMinigameReady) return;
    $roomParentSdk?.sendBinaryPrivateMessage({ fromUser, toUser, message });
  });

  // Handles WebSocket closure
  $roomWs.onclose = (evt) => {
    if ($roomRequestedToLeave) return kick();

    try {
      const { code } = JSON.parse(evt.reason) as ApiErrorResponse;
      return kick(ErrorMessageCodesToText[code]);
    } catch (err) {
      console.error("[WEBSOCKET] Failed to get WebSocket closure error.", evt);

      if (connected) return kick("You've been disconnected from the server!");
      return kick(`Failed to connect to server!`);
    }
  };

  // Audio
  const clickButton = (evt: MouseEvent) => {
    let targetElement = evt.target;
    while (targetElement) {
      if (
        targetElement &&
        "tagName" in targetElement &&
        typeof targetElement.tagName === "string" &&
        ["A", "BUTTON"].includes(targetElement.tagName)
      ) {
        if (
          "dataset" in targetElement &&
          targetElement.dataset &&
          typeof targetElement.dataset === "object" &&
          "audioType" in targetElement.dataset &&
          typeof targetElement.dataset.audioType === "string" &&
          targetElement.dataset.audioType === "close"
        ) {
          return audio.close.play();
        }

        return audio.press.play();
      }

      if (!("parentElement" in targetElement)) break;
      targetElement = targetElement.parentElement as EventTarget | null;
    }
  };
  window.addEventListener("click", clickButton);

  return () => {
    // Make exitedPage = true for additional race-condition prevention checks
    exitedPage = true;

    // Remove room from stores
    $room = null;
    $roomHandshakeCount = 0;
    $roomFeaturedMinigames = null;
    $launcherMatchmaking = null;
    $roomMinigameReady = false;
    $roomJoinedLate = false;
    $roomRequestedToChangeSettings = false;
    $roomLobbyPopupMessage = null;

    // Close WebSocket and remove it from stores
    $roomWs?.close();
    $roomWs = null;
    $roomParentSdk = null;

    // Remove audio
    window.removeEventListener("click", clickButton);
  };
});

function kick(reason?: string) {
  if (exitedPage) return;

  allowExitingPage = true;

  if (reason) {
    $kickedReason = reason;

    if ($launcher === "discord") {
      if (!$launcherDiscordSdk) throw new Error("Missing DiscordSDK. This should never happen.");
      return $launcherDiscordSdk.close(RPCCloseCodes.CLOSE_ABNORMAL, $kickedReason);
    }
  }

  goto("/");
}
</script>
  
{#if !$room || $room.status === GameStatus.LOBBY}
  <LobbyContainer />
{:else if $room.status === GameStatus.STARTED || $room.status === GameStatus.WAITING_PLAYERS_TO_LOAD_MINIGAME}
  <MinigameContainer /> 
{/if}
