import env from "@/env";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import {
  gameRooms,
  createWebSocketMiddleware,
  type MatchmakingDataJWT,
  type ServerRoom,
  type ServerPlayer,
} from "../../utils";
import { decodeJsonClient, Screens } from "@/sdk";
import { ServerOpcodes } from "@/sdk";
import { getMinigamePublic } from "@/db";
import { recieveMessage, sendMessage } from "../../utils/messages";

export const rooms = new Hono();

// biome-ignore format: It looks prettier if this isn't seperated
rooms.get('/', createWebSocketMiddleware(async (c) => {
  const protocol = c.req.header('sec-websocket-protocol');
  if (!protocol) return;

  const [ messageType, authorization ] = protocol.split(",");
  if (messageType !== "Json" && messageType !== "Oppack") return;

  const { user, room } = (await verify(authorization.trim(), env.JWTSecret, env.JWTAlgorithm)) as MatchmakingDataJWT;
  if (room.server.id !== "test_server_id") return;

  // Make sure 2 clients cannot join with the same user ID
  // Make functions for finding rooms and make sure to check if a room has to be created or not
  // Make sure to check if the server is full and if it is, disallow the room from being created in the first place

  const state = {
    connected: false,
    messageType,
    userId: user.id,
    user: null as ServerPlayer | null,
    serverRoom: null as ServerRoom | null,
  };
  
  return {
    async open({ ws }) {
      state.connected = true;

      const serverRoom = gameRooms.get(room.id);
      if (!serverRoom) {
        // WIP: Remove placeholder miniga,e
        const minigame = await getMinigamePublic("1");
        if (!minigame) return ws.close();

        state.user = {
          id: user.id,
          ws,
          messageType,
          displayName: user.displayName,
          ready: false,
          state: null,
          points: 0,
        }

        state.serverRoom = {
          started: false,
          room: {
            id: room.id,
            name: `Room ${room.id}`,
            host: state.userId,
            state: null
          },
          screen: Screens.Lobby,
          minigame, // Can be null
          players: [state.user],
        }
        gameRooms.set(room.id, state.serverRoom);
      } else {
        state.serverRoom = serverRoom;
        if (state.serverRoom.players.find(p => p.id === user.id)) {
          return ws.close(1003, "A player with the given ID is already in the game");
        }

        state.user = {
          id: user.id,
          ws,
          messageType,
          displayName: user.displayName,
          ready: false,
          state: null,
          points: 0,
        };
        state.serverRoom.players.push(state.user);
      }
      
      sendMessage({
        user: state.user,
        opcode: ServerOpcodes.GetInformation,
        data: {
          started: state.serverRoom.started,
          user: state.userId,
          room: state.serverRoom.room,
          screen: state.serverRoom.screen,
          minigame: state.serverRoom.minigame,
          players: state.serverRoom.players.map(p => ({...p, ws: undefined, messageType: undefined })),
        },
      });

      console.log('WebSocket connected');
    },
    message({ data: rawPayload, ws }) {
      if (!state.serverRoom) return;

      const { opcode, data } = recieveMessage({
        user: state.user!,
        payload: rawPayload,
      });

      console.log('WebSocket message', opcode, data);

      if (opcode === 3) {
        data;
      }
    },
    close({ ws }) {
      state.connected = false;

      console.log('WebSocket closed');
    },
    error({ ws }) {
      state.connected = false;

      console.log('WebSocket errored');
    },
  };
}));
