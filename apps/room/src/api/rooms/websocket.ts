import env from "@/env";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import {
  findBestTestingServerByHashAndLocation,
  getMinigameByIdAndTestingAccessCode,
  getMinigamePublic,
  getPackPublic,
  isMinigameInPack,
  transformMinigameToMinigamePublic,
} from "@/db";
import {
  ClientOpcodes,
  ServerOpcodes,
  GameStatus,
  MinigameEndReason,
  GamePrizePoints,
  ErrorMessageCodes,
  MatchmakingType,
  type MatchmakingDataJWT,
  type Pack,
  type Minigame,
} from "@/public";
import {
  rooms,
  maxRooms,
  createWebSocketMiddleware,
  broadcastMessage,
  recieveMessage,
  sendMessage,
  transformToGamePlayer,
  transformToGamePlayers,
  isHost,
  isLobby,
  isUserReady,
  isReady,
  sendError,
  startGame,
  endGame,
  unreadyPlayersGame,
  isStarted,
  setCurrentRooms,
  serverStarted,
  type ServerRoom,
  type ServerPlayer,
  type WebSocketMiddlewareEvents,
  type WSState,
} from "../../utils";

export const websocket = new Hono();

websocket.get(
  "/",
  createWebSocketMiddleware(async (c) => {
    const protocol = c.req.header("sec-websocket-protocol");
    if (!protocol) return;

    let [authorization, messageType = "Oppack"] = protocol.split(",").map((v) => v.trim());
    if (!["Json", "Oppack"].includes(messageType)) return;

    const { type, user, room, metadata, iat } = (await verify(authorization.trim(), env.JWT_SECRET)) as MatchmakingDataJWT;
    if (type !== "matchmaking" || room.server.id !== env.SERVER_ID || serverStarted > iat) return;

    // Double-checks the metadata for testing servers
    // This check if the minigame still exists, the testing access code matches and the minigame location is the same
    let defaultMinigame: Minigame | null = null;
    if (metadata.type === MatchmakingType.TESTING) {
      const minigame = await getMinigameByIdAndTestingAccessCode({
        id: metadata.minigameId,
        testingAccessCode: metadata.testingAccessCode,
      });
      if (!minigame) return;

      const bestServer = await findBestTestingServerByHashAndLocation({
        id: minigame.id,
        location: minigame.testingLocation,
      });
      if (bestServer?.id !== env.SERVER_ID) return;

      defaultMinigame = transformMinigameToMinigamePublic(minigame);
    } else {
      const origin = c.req.header("origin");
      if (
        // Allows if there is no origin
        origin &&
        // Allows localhost for development and staging
        (env.NODE_ENV !== "production" || !origin.startsWith("http://localhost")) &&
        // Allows anything in ALLOWED_WS_ORIGINS
        !env.ALLOWED_WS_ORIGINS.includes(origin)
      )
        return;
    }

    // Create WebSocket events
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
            avatar: user.avatar,
            mobile: "mobile" in metadata ? metadata.mobile : false,
            ready: false,
            state: null,
            points: 0,
          } as ServerPlayer,
          serverRoom: rooms.get(room.id) as ServerRoom,
        };

        // Disallow joining when it's about to shutdown
        if (state.serverRoom?.testingShutdown) {
          return ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.SERVERS_BUSY }));
        }

        if (state.serverRoom) {
          // If the matchmaking type is normal, check if the JWT was meant to create a room
          // This prevents a race-condition in matchmaking (36^9 chance) where 2 players are assigned the same room ID
          if (metadata.type === MatchmakingType.NORMAL && metadata.creating) {
            return ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.SERVERS_BUSY }));
          }

          // Check if the player with the given user ID is already in the room
          if (state.serverRoom.players.get(user.id)) {
            return ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.ALREADY_IN_GAME }));
          }

          // Disallow over 25 people in a game
          if (state.serverRoom.players.size >= 25) {
            return ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.REACHED_MAXIMUM_PLAYER_LIMIT }));
          }

          // Join room
          state.serverRoom.players.set(state.user.id, state.user);
        } else {
          // If the server is full, disallow the creation of new rooms
          if (rooms.size >= maxRooms) {
            return ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.SERVERS_BUSY }));
          }

          // Create room
          const players = new Map();
          players.set(state.user.id, state.user);

          state.serverRoom = {
            status: GameStatus.LOBBY,
            room: {
              id: room.id,
              host: state.user.id,
              state: null,
            },
            pack: null,
            minigame: defaultMinigame, // defaults as null, sets the minigame for testing rooms
            players,
            testingShutdown: false,
          };

          rooms.set(room.id, state.serverRoom);

          // Update the new room count (purposely not awaited)
          setCurrentRooms(rooms.size);
        }

        // Handle messages
        websocketEvents.message = async ({ data: rawPayload }) => {
          const { opcode, data } = recieveMessage({
            user: state.user,
            payload: rawPayload,
          });

          if (opcode === ClientOpcodes.PING) return;

          // Disallow opcdes for testing rooms
          if (
            [ClientOpcodes.KICK_PLAYER, ClientOpcodes.TRANSFER_HOST, ClientOpcodes.SET_ROOM_SETTINGS].includes(opcode) &&
            metadata.type === MatchmakingType.TESTING
          ) {
            return sendError(state.user, ErrorMessageCodes.WS_DISABLED_IN_TESTING_ROOM);
          }

          // Handle opcodes
          switch (opcode) {
            case ClientOpcodes.KICK_PLAYER: {
              if (!isHost(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_HOST);
              if (!isLobby(state)) return sendError(state.user, ErrorMessageCodes.WS_DISABLED_DURING_GAME);
              if (state.user.id === data.user) return sendError(state.user, ErrorMessageCodes.WS_CANNOT_KICK_SELF);

              state.serverRoom.players
                .get(data.user)
                ?.ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.KICKED_FROM_ROOM }));
              return;
            }
            case ClientOpcodes.TRANSFER_HOST: {
              if (!isHost(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_HOST);
              if (!isLobby(state)) return sendError(state.user, ErrorMessageCodes.WS_DISABLED_DURING_GAME);
              if (state.user.id === data.user) return sendError(state.user, ErrorMessageCodes.WS_CANNOT_TRANSFER_SELF);

              const player = state.serverRoom.players.get(data.user);
              if (player?.ws.readyState !== 1) return;

              state.serverRoom.room.host = data.user;

              broadcastMessage({
                room: state.serverRoom,
                opcode: ServerOpcodes.TRANSFER_HOST,
                data: {
                  user: data.user,
                },
              });

              return;
            }
            case ClientOpcodes.SET_ROOM_SETTINGS: {
              if (!isHost(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_HOST);
              if (!isLobby(state)) return sendError(state.user, ErrorMessageCodes.WS_DISABLED_DURING_GAME);
              if (data.minigameId === undefined && data.packId === undefined) return; // No error - pretend recieveMessage failed

              const newSettings: { pack?: Pack | null; minigame?: Minigame | null } = {};

              if (data.packId) {
                // Get minigame pack
                const pack = await getPackPublic(data.packId);
                if (!pack) return sendError(state.user, ErrorMessageCodes.WS_CANNOT_FIND_PACK);

                // Set pack in new settings
                newSettings.pack = pack;
              } else if (data.packId === null) {
                newSettings.pack = null;
              }

              if (data.minigameId) {
                // Get minigame
                const minigame = await getMinigamePublic(data.minigameId);
                if (!minigame) return sendError(state.user, ErrorMessageCodes.WS_CANNOT_FIND_MINIGAME);
                if (!minigame.proxies) return sendError(state.user, ErrorMessageCodes.WS_MINIGAME_MISSING_PROXY_URL);

                // Set pack in new settings
                newSettings.minigame = minigame;
              } else if (data.minigameId === null) {
                newSettings.minigame = null;
              }

              // Make sure a minigame and a pack both co-exist
              // Check if the minigame is in the pack
              const pack = newSettings.pack === undefined ? state.serverRoom.pack : newSettings.pack;
              const minigame = newSettings.minigame === undefined ? state.serverRoom.minigame : newSettings.minigame;

              if (pack && !minigame) {
                return sendError(state.user, ErrorMessageCodes.WS_CANNOT_SELECT_PACK_WITHOUT_MINIGAME);
              }

              if (
                pack &&
                minigame &&
                !(await isMinigameInPack({
                  packId: pack.id,
                  minigameId: minigame.id,
                }))
              ) {
                return sendError(state.user, ErrorMessageCodes.WS_CANNOT_FIND_MINIGAME_IN_PACK);
              }

              // Recheck if the user is the host and there isn't an ongoing game (prevents any race-condition bug)
              if (!isHost(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_HOST);
              if (!isLobby(state)) return sendError(state.user, ErrorMessageCodes.WS_DISABLED_DURING_GAME);

              // Set pack and minigame (!== undefined is necessary as they can be null)
              if (newSettings.pack !== undefined) state.serverRoom.pack = newSettings.pack;
              if (newSettings.minigame !== undefined) state.serverRoom.minigame = newSettings.minigame;

              broadcastMessage({
                room: state.serverRoom,
                opcode: ServerOpcodes.UPDATED_ROOM_SETTINGS,
                data: {
                  pack: state.serverRoom.pack,
                  minigame: state.serverRoom.minigame,
                },
              });

              return;
            }
            case ClientOpcodes.BEGIN_GAME: {
              if (!isHost(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_HOST);
              if (!isLobby(state)) return sendError(state.user, ErrorMessageCodes.WS_DISABLED_DURING_GAME);

              // Cannot start game without a minigame selected
              if (!state.serverRoom.minigame)
                return sendError(state.user, ErrorMessageCodes.WS_CANNOT_START_WITHOUT_MINIGAME);

              // Check minigame's minimum players
              if (state.serverRoom.players.size < state.serverRoom.minigame.minimumPlayersToStart)
                return sendError(state.user, ErrorMessageCodes.WS_CANNOT_START_FAILED_REQUIREMENTS);

              // Set everyone's ready state and user state as false
              unreadyPlayersGame(state.serverRoom);

              // Set status as waiting for players to load minigame
              state.serverRoom.status = GameStatus.WAITING_PLAYERS_TO_LOAD_MINIGAME;

              // Send to everyone to load the minigame
              broadcastMessage({
                room: state.serverRoom,
                opcode: ServerOpcodes.LOAD_MINIGAME,
                data: {
                  players: [...state.serverRoom.players.values()].map((p) => transformToGamePlayer(p)),
                },
              });

              return;
            }
            case ClientOpcodes.MINIGAME_HANDSHAKE: {
              if (isLobby(state)) return sendError(state.user, ErrorMessageCodes.WS_GAME_HAS_NOT_STARTED);
              if (isReady(state)) return sendError(state.user, ErrorMessageCodes.WS_CANNOT_HANDSHAKE_IF_READY);

              // Set ready value of player to true
              state.user.ready = true;

              // Broadcast to everyone that the player is ready
              broadcastMessage({
                room: state.serverRoom,
                opcode: ServerOpcodes.MINIGAME_PLAYER_READY,
                data: { user: state.user.id },
              });

              // If it's a testing server, start the game once the host does the handshake
              if (metadata.type === MatchmakingType.TESTING) {
                if (isHost(state)) startGame(state.serverRoom);
                return;
              }

              // Ignore actions below if game already started
              // If the user joined after the game already started, send the minigame start game event!
              if (state.serverRoom.status === GameStatus.STARTED) return;

              // Start game if everyone is ready.
              if (![...state.serverRoom.players.values()].some((p) => !p.ready)) {
                return startGame(state.serverRoom);
              }

              // Set ready timer (30 seconds to ready up) once host is ready
              if (
                state.serverRoom.minigame &&
                state.serverRoom.players.get(state.serverRoom.room.host)?.ready &&
                [...state.serverRoom.players.values()].filter((p) => p.ready).length >=
                  state.serverRoom.minigame.minimumPlayersToStart &&
                !state.serverRoom.readyTimer
              ) {
                state.serverRoom.readyTimer = setTimeout(() => startGame(state.serverRoom), 30000);
                return;
              }

              return;
            }
            case ClientOpcodes.MINIGAME_END_GAME: {
              if (!isHost(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_HOST);
              if (isLobby(state)) return sendError(state.user, ErrorMessageCodes.WS_GAME_HAS_NOT_STARTED);

              if (data.prizes) {
                if (!isReady(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_READY);

                // Filters prizes with valid user IDs
                const prizes = data.prizes.filter((p) => !!state.serverRoom.players.get(p.user));

                // Disallows duplicate user IDs
                if (prizes.length !== new Set(prizes.map(({ user }) => user)).size) {
                  return sendError(state.user, ErrorMessageCodes.WS_CANNOT_HAVE_MULTIPLE_PRIZES);
                }

                // Give prizes
                for (const { type, user } of prizes) {
                  const player = state.serverRoom.players.get(user);
                  if (player) {
                    player.points += GamePrizePoints[type];
                  }
                }

                // Broadcasts end game message
                endGame({
                  room: state.serverRoom,
                  reason: MinigameEndReason.MINIGAME_ENDED,
                  prizes,
                });
              } else {
                // If there isn't prizes, the game was forcefully ended
                endGame({ room: state.serverRoom, reason: MinigameEndReason.FORCEFUL_END });
              }

              // If it was a testing room, delete the room
              // When a host leaves the room on a testing room, everyone else should also be kicked and the room should be deleted
              // Additionally, the only user who can run this opcode is the host, so state.user is the host
              if (metadata.type === MatchmakingType.TESTING) {
                state.user.ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.TESTING_ENDED }));
              }

              return;
            }
            case ClientOpcodes.MINIGAME_SET_GAME_STATE: {
              if (!isHost(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_HOST);
              if (!isStarted(state)) return sendError(state.user, ErrorMessageCodes.WS_GAME_HAS_NOT_STARTED);
              if (!isReady(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_READY);

              state.serverRoom.room.state = data.state;

              broadcastMessage({
                room: state.serverRoom,
                readyOnly: false, // (client must keep track of states before player is ready as well)
                opcode: ServerOpcodes.MINIGAME_SET_GAME_STATE,
                data: {
                  state: data.state,
                },
              });

              return;
            }
            case ClientOpcodes.MINIGAME_SET_PLAYER_STATE: {
              if (!isHost(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_HOST);
              if (!isStarted(state)) return sendError(state.user, ErrorMessageCodes.WS_GAME_HAS_NOT_STARTED);
              if (!isUserReady(state, data.user))
                return sendError(state.user, ErrorMessageCodes.WS_CANNOT_FIND_READY_PLAYER);
              if (!isReady(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_READY);

              const player = state.serverRoom.players.get(data.user);
              if (!player?.ready) return; // (should never happen)

              player.state = data.state;

              broadcastMessage({
                room: state.serverRoom,
                readyOnly: false, // (client must keep track of states before player is ready as well)
                opcode: ServerOpcodes.MINIGAME_SET_PLAYER_STATE,
                data: {
                  user: data.user,
                  state: data.state,
                },
              });

              return;
            }
            case ClientOpcodes.MINIGAME_SEND_GAME_MESSAGE: {
              if (!isStarted(state)) return sendError(state.user, ErrorMessageCodes.WS_GAME_HAS_NOT_STARTED);
              if (!isHost(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_HOST);
              if (!isReady(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_READY);

              broadcastMessage({
                room: state.serverRoom,
                readyOnly: true,
                opcode: ServerOpcodes.MINIGAME_SEND_GAME_MESSAGE,
                data: {
                  message: data.message,
                },
              });

              return;
            }
            case ClientOpcodes.MINIGAME_SEND_PLAYER_MESSAGE: {
              if (!isStarted(state)) return sendError(state.user, ErrorMessageCodes.WS_GAME_HAS_NOT_STARTED);
              if (!isReady(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_READY);

              broadcastMessage({
                room: state.serverRoom,
                readyOnly: true,
                opcode: ServerOpcodes.MINIGAME_SEND_PLAYER_MESSAGE,
                data: {
                  user: state.user.id,
                  message: data.message,
                },
              });

              break;
            }
            case ClientOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE: {
              if (!data.user) data.user = state.serverRoom.room.host;

              if (!isStarted(state)) return sendError(state.user, ErrorMessageCodes.WS_GAME_HAS_NOT_STARTED);
              if (!isReady(state)) return sendError(state.user, ErrorMessageCodes.WS_NOT_READY);
              if (!isHost(state) && data.user !== state.serverRoom.room.host)
                return sendError(state.user, ErrorMessageCodes.WS_NOT_HOST_PRIVATE_MESSAGE);
              if (!isUserReady(state, data.user))
                return sendError(state.user, ErrorMessageCodes.WS_CANNOT_FIND_READY_PLAYER);

              // Get host and the toUser
              const host = state.serverRoom.players.get(state.serverRoom.room.host);
              const toUser = state.serverRoom.players.get(data.user);
              if (!host?.ready || !toUser?.ready) return;

              // Payload to send
              const payload = {
                fromUser: state.user.id,
                toUser: toUser.id,
                message: data.message,
              };

              // Send private message to self
              sendMessage({
                user: toUser,
                opcode: ServerOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE,
                data: payload,
              });

              if (state.user !== toUser) {
                sendMessage({
                  user: state.user,
                  opcode: ServerOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE,
                  data: payload,
                });

                if (state.user !== host && toUser !== host) {
                  sendMessage({
                    user: host,
                    opcode: ServerOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE,
                    data: payload,
                  });
                }
              }

              return;
            }
          }
        };

        // Handle disconnecting
        websocketEvents.close = () => {
          // If it's a testing room shutting down, delete it
          if (state.serverRoom.testingShutdown) return;

          // Remove player from room
          state.serverRoom.players.delete(state.user.id);

          // Delete the room if there's no more players in it
          if (!state.serverRoom.players.size) {
            // Delete the room
            rooms.delete(state.serverRoom.room.id);
            // Update the new room count (unnecessary to await)
            return setCurrentRooms(rooms.size);
          }

          // If host left, assign new host
          if (state.serverRoom.room.host === state.user.id) {
            if (metadata.type === MatchmakingType.TESTING) {
              // Set testing shutdown to true to disallow new people from joining and removing any leave events
              state.serverRoom.testingShutdown = true;
              // Kick all players
              for (const player of state.serverRoom.players.values()) {
                player.ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.TESTING_ENDED }));
              }
              // Delete the room
              rooms.delete(state.serverRoom.room.id);
              // Update the new room count (unnecessary to await)
              return setCurrentRooms(rooms.size);
            }

            state.serverRoom.room.host = [...state.serverRoom.players.keys()][0];

            broadcastMessage({
              room: state.serverRoom,
              opcode: ServerOpcodes.TRANSFER_HOST,
              data: {
                user: state.serverRoom.room.host,
              },
            });

            if (state.serverRoom.status !== GameStatus.LOBBY) {
              endGame({ room: state.serverRoom, reason: MinigameEndReason.HOST_LEFT });
            }
          }

          // Send to everyone that the player left
          broadcastMessage({
            room: state.serverRoom,
            opcode: ServerOpcodes.PLAYER_LEFT,
            data: {
              user: state.user.id,
            },
          });

          // Check minigame's minimum players if the game is still loading
          // Keep in mind minimumPlayersToStart will not be forced when the game actually starts
          if (state.serverRoom.status === GameStatus.WAITING_PLAYERS_TO_LOAD_MINIGAME && state.serverRoom.minigame) {
            if (state.serverRoom.players.size < state.serverRoom.minigame.minimumPlayersToStart) {
              return endGame({
                room: state.serverRoom,
                reason: MinigameEndReason.FAILED_TO_SATISFY_MINIMUM_PLAYERS_TO_START,
              });
            }

            if (
              state.serverRoom.readyTimer &&
              [...state.serverRoom.players.values()].filter((p) => p.ready).length <
                state.serverRoom.minigame.minimumPlayersToStart
            ) {
              clearTimeout(state.serverRoom.readyTimer);
              state.serverRoom.readyTimer = undefined;
              return;
            }
          }
        };
        websocketEvents.error = () => ws.close(1002, JSON.stringify({ code: ErrorMessageCodes.UNEXPECTED_ERROR }));

        // Give the new player room information
        sendMessage({
          user: state.user,
          opcode: ServerOpcodes.GET_INFORMATION,
          data: {
            status: state.serverRoom.status,
            user: state.user.id,
            room: state.serverRoom.room,
            pack: state.serverRoom.pack,
            minigame: state.serverRoom.minigame,
            players: transformToGamePlayers(state.serverRoom.players),
          },
        });

        // Broadcast join message
        broadcastMessage({
          room: state.serverRoom,
          ignoreUsers: [state.user],
          opcode: ServerOpcodes.PLAYER_JOIN,
          data: {
            player: transformToGamePlayer(state.user),
          },
        });
      },
    };

    return websocketEvents;
  }),
);
