import env from "@/env";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import {
  gameRooms,
  createWebSocketMiddleware,
  broadcastMessage,
  recieveMessage,
  sendMessage,
  transformToGamePlayerLeaderboards,
  transformToGamePlayerPrivate,
  isNotHost,
  isNotStarted,
  isNotUserOrHost,
  isNotUserWithStatePermissionOrHost,
  isReady,
  isStartedOrStarting,
  type MatchmakingDataJWT,
  type ServerRoom,
  type ServerPlayer,
  type WebSocketMiddlewareEvents,
  type WSState,
} from "../../utils";
import { ClientOpcodes, Screens } from "@/sdk";
import { ServerOpcodes } from "@/sdk";
import { getMinigamePublic } from "@/db";

export const rooms = new Hono();

rooms.get(
  "/",
  createWebSocketMiddleware(async (c) => {
    const origin = c.req.header("origin");
    if (origin && !env.AllowedWsOrigins.includes(origin)) return;

    const protocol = c.req.header("sec-websocket-protocol");
    if (!protocol) return;

    const [messageType, authorization] = protocol.split(",");
    if (messageType !== "Json" && messageType !== "Oppack") return;

    const { user, room } = (await verify(authorization.trim(), env.JWTSecret, env.JWTAlgorithm)) as MatchmakingDataJWT;
    if (room.server.id !== env.ServerId) return;

    const websocketEvents: WebSocketMiddlewareEvents = {
      async open({ ws }) {
        // Create state
        const state: WSState = {
          messageType,
          user: {
            id: user.id,
            ws,
            messageType,
            displayName: user.displayName,
            ready: false,
            state: null,
            points: 0,
          } as ServerPlayer,
          serverRoom: gameRooms.get(room.id) as ServerRoom,
        };

        if (state.serverRoom) {
          // Check if the player with the given user ID is already in the room
          if (state.serverRoom.players.get(user.id)) {
            return ws.close(1003, "A player with the given ID is already in the game");
          }

          // Disallow over 25 people in a game
          if (state.serverRoom.players.size >= 25) {
            return ws.close(1003, "Reached maximum player limit in this room");
          }

          // Join room
          state.serverRoom.players.set(state.user.id, state.user);
        } else {
          // If the server is full, disallow the creation of new rooms
          if (gameRooms.size > env.MaxRooms) {
            return ws.close(1003, "Server is full");
          }

          // Create room
          const players = new Map();
          players.set(state.user.id, state.user);

          state.serverRoom = {
            starting: false,
            started: false,
            room: {
              id: room.id,
              name: `Room ${room.id}`,
              host: state.user.id,
              state: null,
            },
            screen: Screens.Lobby,
            minigame: null,
            players,
          };

          gameRooms.set(room.id, state.serverRoom);
        }

        // Create WebSocket events
        websocketEvents.message = async ({ data: rawPayload, ws }) => {
          const { opcode, data } = recieveMessage({
            user: state.user,
            payload: rawPayload,
          });

          console.log("WebSocket message", opcode, data);
          switch (opcode) {
            case ClientOpcodes.KickPlayer: {
              if (isNotHost(state)) return;

              // Kick player from room (if exists)
              state.serverRoom.players.get(data.player)?.ws.close();
              return;
            }
            case ClientOpcodes.TransferHost: {
              if (isNotHost(state) || isStartedOrStarting(state)) return;

              // Get the player (if not exists, ignore transfer host request)
              const player = state.serverRoom.players.get(data.player);
              if (player?.ws.readyState !== 1) return;

              // Set the new host
              state.serverRoom.room.host = data.player;

              // WIP: Alert every client that there is a new host

              return;
            }
            case ClientOpcodes.SetRoomSettings: {
              if (isNotHost(state)) return;

              // Set room name
              state.serverRoom.room.name = data.name;
              return;
            }
            case ClientOpcodes.BeginGame: {
              if (isNotHost(state) || isStartedOrStarting(state)) return;

              // Set the room's state as starting
              state.serverRoom.starting = true;

              // Get the minigame
              // TODO: Remove placeholder minigame and allow selecting custom ones
              const minigame = await getMinigamePublic("1");
              if (!minigame) {
                // On failure, cancel start request
                console.error("Failed to find minigame");
                state.serverRoom.starting = false;
                return;
              }

              // Set the minigame
              state.serverRoom.minigame = minigame;

              // Set everyone's ready state to false
              for (const player of state.serverRoom.players.values()) {
                player.ready = false;
              }

              // Start the game and toggle off the starting start
              state.serverRoom.started = true;
              state.serverRoom.starting = false;

              // Broadcast to every client that the game has started
              return broadcastMessage({
                room: state.serverRoom,
                opcode: ServerOpcodes.UpdatedScreen,
                data: {
                  screen: Screens.Minigame,
                  players: [...state.serverRoom.players.values()].map((p) => transformToGamePlayerLeaderboards(p)),
                  minigame,
                },
              });
            }
            case ClientOpcodes.MinigameHandshake: {
              // Disallow if the game hasn't started or if the user is already ready
              if (isNotStarted(state) || isReady(state)) return;

              // Set the user's ready state to true
              state.user.ready = true;

              // Broadcast to everyone that the player is ready
              broadcastMessage({
                room: state.serverRoom,
                opcode: ServerOpcodes.PlayerReady,
                data: { user: state.user.id },
              });

              // TODO: Start game if everyone is ready.

              return;
            }
            case ClientOpcodes.MinigameEndGame: {
              if (isNotStarted(state) || !isReady(state) || isNotHost(state)) return;

              // WIP MinigameEndGame
              break;
            }
            case ClientOpcodes.MinigameSetGameState: {
              if (isNotStarted(state) || !isReady(state) || isNotHost(state)) return;

              // WIP MinigameSetGameState
              break;
            }
            case ClientOpcodes.MinigameSetPlayerState: {
              if (isNotStarted(state) || !isReady(state) || isNotUserWithStatePermissionOrHost(state, data.user)) return;

              // TODO: Check if the player being modified is ready as well

              // WIP MinigameSetPlayerState
              break;
            }
            case ClientOpcodes.MinigameSendGameMessage: {
              if (isNotStarted(state) || !isReady(state) || isNotHost(state)) return;

              // WIP MinigameSendGameMessage
              break;
            }
            case ClientOpcodes.MinigameSendPlayerMessage: {
              if (isNotStarted(state) || !isReady(state) || isNotUserOrHost(state, data.user)) return;

              // TODO: Check if the player being modified is ready as well

              // WIP MinigameSendPlayerMessage
              break;
            }
            case ClientOpcodes.MinigameSendPrivateMessage: {
              if (isNotStarted(state) || !isReady(state) || isNotUserOrHost(state, data.user)) return;

              // TODO: Check if the player being modified is ready as well

              // WIP MinigameSendPrivateMessage
              break;
            }
          }
        };

        websocketEvents.close = ({ ws }) => {
          // Remove player from room
          state.serverRoom.players.delete(state.user.id);

          // Delete the room if there's no more players in it
          if (!state.serverRoom.players.size) {
            return gameRooms.delete(state.serverRoom.room.id);
          }

          // If host left, assign new host
          if (state.serverRoom.room.host === state.user.id) {
            state.serverRoom.room.host = [...state.serverRoom.players.keys()][0];

            broadcastMessage({
              room: state.serverRoom,
              opcode: ServerOpcodes.TransferHost,
              data: {
                user: state.serverRoom.room.host,
              },
            });

            // if (state.serverRoom.started) {
            //   broadcastMessage({
            //     room: state.serverRoom,
            //     opcode: ServerOpcodes.UpdatedScreen,
            //     data: {
            //       screen: Screens.Lobby,
            //     },
            //   });
            // }
          }

          // Send to everyone that the player left
          broadcastMessage({
            room: state.serverRoom,
            opcode: ServerOpcodes.PlayerLeft,
            data: {
              user: state.user.id,
            },
          });
        };
        websocketEvents.error = ({ ws }) => {
          ws.close(1002, "A WebSocket error has occurred");
        };

        // Send join messages
        sendMessage({
          user: state.user,
          opcode: ServerOpcodes.GetInformation,
          data: {
            started: state.serverRoom.started,
            user: state.user.id,
            room: state.serverRoom.room,
            screen: state.serverRoom.screen,
            minigame: state.serverRoom.minigame,
            players: [...state.serverRoom.players.values()].map((p) => transformToGamePlayerPrivate(p)),
          },
        });
        broadcastMessage({
          room: state.serverRoom,
          ignoreUsers: [state.user],
          opcode: ServerOpcodes.PlayerJoin,
          data: {
            player: transformToGamePlayerPrivate(state.user),
          },
        });
      },
    };

    return websocketEvents;
  }),
);
