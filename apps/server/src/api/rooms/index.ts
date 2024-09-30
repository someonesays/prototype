import env from "@/env";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import {
  gameRooms,
  createWebSocketMiddleware,
  type MatchmakingDataJWT,
  type ServerRoom,
  type ServerPlayer,
  type WebSocketMiddlewareEvents,
} from "../../utils";
import { Screens } from "@/sdk";
import { ServerOpcodes } from "@/sdk";
import { broadcastMessage, recieveMessage, sendMessage } from "../../utils/messages";
import { transformToGamePlayerPrivate } from "../../utils/transform";

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

    const { user, room } = (await verify(
      authorization.trim(),
      env.JWTSecret,
      env.JWTAlgorithm,
    )) as MatchmakingDataJWT;
    if (room.server.id !== env.ServerId) return;

    const websocketEvents: WebSocketMiddlewareEvents = {
      async open({ ws }) {
        // Create state
        const state = {
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
            started: false,
            room: {
              id: room.id,
              name: `Room ${room.id}`,
              host: state.user.id,
              state: null,
            },
            screen: Screens.Lobby,
            minigame: null, // ex. await getMinigamePublic("1")
            players,
          };

          gameRooms.set(room.id, state.serverRoom);
        }

        // Create WebSocket events
        websocketEvents.message = ({ data: rawPayload, ws }) => {
          const { opcode, data } = recieveMessage({
            user: state.user,
            payload: rawPayload,
          });

          console.log("WebSocket message", opcode, data);
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

            if (state.serverRoom.started) {
              broadcastMessage({
                room: state.serverRoom,
                opcode: ServerOpcodes.UpdatedScreen,
                data: {
                  screen: Screens.Lobby,
                },
              });
            }
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
            players: [...state.serverRoom.players.values()].map((p) =>
              transformToGamePlayerPrivate(p),
            ),
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
