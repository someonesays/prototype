import env from "@/env";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { getMinigamePublic, getPackPublic, isMinigameInPack } from "@/db";
import {
  ClientOpcodes,
  ServerOpcodes,
  GameStatus,
  MinigameEndReason,
  GamePrizeType,
  GamePrizePoints,
  ErrorMessageCodes,
  MatchmakingType,
  type GamePrize,
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
  isNotHost,
  isLobby,
  isUserReady,
  isReady,
  sendError,
  startGame,
  endGame,
  unreadyPlayersGame,
  isStarted,
  type ServerRoom,
  type ServerPlayer,
  type WebSocketMiddlewareEvents,
  type WSState,
  setCurrentRooms,
} from "../../utils";

export const websocket = new Hono();

websocket.get(
  "/",
  createWebSocketMiddleware(async (c) => {
    const origin = c.req.header("origin");
    if (origin && !env.ALLOWED_WS_ORIGINS.includes(origin)) return;

    const protocol = c.req.header("sec-websocket-protocol");
    if (!protocol) return;

    let [authorization, messageType = "Oppack"] = protocol.split(",").map((v) => v.trim());
    if (!["Json", "Oppack"].includes(messageType)) return;

    const { type, user, room, metadata } = (await verify(authorization.trim(), env.JWT_SECRET)) as MatchmakingDataJWT;
    if (type !== "matchmaking" || room.server.id !== env.SERVER_ID) return;

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
            ready: false,
            state: null,
            points: 0,
          } as ServerPlayer,
          serverRoom: rooms.get(room.id) as ServerRoom,
        };

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
            minigame: null,
            players,
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

          console.debug("WebSocket message", opcode, data);
          switch (opcode) {
            case ClientOpcodes.KICK_PLAYER: {
              if (isNotHost(state)) return sendError(state.user, "Only host can kick players");
              if (!isLobby(state)) return sendError(state.user, "Cannot kick players during game");
              if (state.user.id === data.user) return sendError(state.user, "Cannot kick yourself");

              state.serverRoom.players
                .get(data.user)
                ?.ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.KICKED_FROM_ROOM }));
              return;
            }
            case ClientOpcodes.TRANSFER_HOST: {
              if (isNotHost(state)) return sendError(state.user, "Only host can transfer host");
              if (!isLobby(state)) return sendError(state.user, "Cannot transfer host during game");
              if (state.user.id === data.user) return sendError(state.user, "Cannot transfer host to yourself");

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
              if (isNotHost(state)) return sendError(state.user, "Only host can change room settings");
              if (!isLobby(state)) return sendError(state.user, "Cannot set room settings during an ongoing game");
              if (data.minigameId === undefined && data.packId === undefined) {
                return sendError(state.user, "Missing options to change room settings");
              }

              const newSettings: { pack?: Pack | null; minigame?: Minigame | null } = {};

              if (data.packId) {
                // Get minigame pack
                const pack = await getPackPublic(data.packId);
                if (!pack) return sendError(state.user, "Failed to find pack");

                // Set pack in new settings
                newSettings.pack = pack;
              } else if (data.packId === null) {
                newSettings.pack = null;
              }

              if (data.minigameId) {
                // Get minigame
                const minigame = await getMinigamePublic(data.minigameId);
                if (!minigame) return sendError(state.user, "Failed to find minigame");

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
                return sendError(state.user, "Cannot select pack without a minigame");
              }

              if (
                pack &&
                minigame &&
                !(await isMinigameInPack({
                  packId: pack.id,
                  minigameId: minigame.id,
                }))
              ) {
                return sendError(state.user, "Failed to find minigame in pack");
              }

              // Recheck if the user is the host and there isn't an ongoing game (prevents any race-condition bug)
              if (isNotHost(state)) return sendError(state.user, "Only host can change room settings");
              if (!isLobby(state)) return sendError(state.user, "Cannot set room settings during an ongoing game");

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
              if (isNotHost(state)) return sendError(state.user, "Only host can begin game");
              if (!isLobby(state)) return sendError(state.user, "Cannot begin game during an ongoing game");

              // Cannot start game without a minigame selected
              if (!state.serverRoom.minigame) return sendError(state.user, "Cannot start game without selecting a minigame");

              // Check minigame's minimum players
              if (state.serverRoom.players.size < state.serverRoom.minigame.minimumPlayersToStart)
                return sendError(
                  state.user,
                  "Cannot start game that fails to satisfy the minigame's minimum players to start requirement",
                );

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
              if (isLobby(state)) return sendError(state.user, "Cannot handshake when a game is not ongoing");
              if (isReady(state)) return sendError(state.user, "Cannot handshake if already ready");

              // Set ready value of player to true
              state.user.ready = true;

              // Broadcast to everyone that the player is ready
              broadcastMessage({
                room: state.serverRoom,
                opcode: ServerOpcodes.MINIGAME_PLAYER_READY,
                data: { user: state.user.id },
              });

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
              if (isNotHost(state)) return sendError(state.user, "Only host can end game");
              if (isLobby(state)) return sendError(state.user, "Cannot end game in lobby");

              if (data.prizes) {
                if (!isReady(state)) return sendError(state.user, "Cannot end game and distribute prizes when not ready");

                // Filters prizes with valid user IDs
                const prizes = data.prizes.filter((p) => !!state.serverRoom.players.get(p.user));

                // Disallows duplicate user IDs
                if (prizes.length !== new Set(prizes.map(({ user }) => user)).size) {
                  return sendError(state.user, "Cannot have a user get multiple prizes");
                }

                // Check the length of the winner, second place and third place
                const winners = prizes.filter((p) => p.type === GamePrizeType.WINNER);
                const seconds = prizes.filter((p) => p.type === GamePrizeType.SECOND);
                const thirds = prizes.filter((p) => p.type === GamePrizeType.THIRD);

                if (winners.length > 1) return sendError(state.user, "Cannot be more than 1 winner");
                if (seconds.length > 1) return sendError(state.user, "Cannot be more than 1 second place");
                if (thirds.length > 1) return sendError(state.user, "Cannot be more than 1 third place");

                // Turns third place to second place if third place isn't set
                // Turns second place to winner if second place isn't set
                let winner: string | undefined = winners[0]?.user;
                let second: string | undefined = seconds[0]?.user;
                let third: string | undefined = thirds[0]?.user;

                if (third && !second) {
                  second = third;
                  third = undefined;
                }
                if (second && !winner) {
                  winner = second;
                  second = undefined;
                }

                // Transforms to the fixed prizes array
                const transformedPrizes: GamePrize[] = [];
                if (winner) transformedPrizes.push({ type: GamePrizeType.WINNER, user: winner });
                if (second) transformedPrizes.push({ type: GamePrizeType.SECOND, user: second });
                if (third) transformedPrizes.push({ type: GamePrizeType.THIRD, user: third });
                transformedPrizes.push(...prizes.filter((p) => p.type === GamePrizeType.PARTICIPATION));

                // Give prizes
                for (const { type, user } of transformedPrizes) {
                  const player = state.serverRoom.players.get(user);
                  if (player) {
                    player.points += GamePrizePoints[type];
                  }
                }

                // Broadcasts end game message
                return endGame({
                  room: state.serverRoom,
                  reason: MinigameEndReason.MINIGAME_ENDED,
                  prizes: transformedPrizes,
                });
              }

              // If there isn't prizes, the game was forcefully ended
              endGame({ room: state.serverRoom, reason: MinigameEndReason.FORCEFUL_END });

              return;
            }
            case ClientOpcodes.MINIGAME_SET_GAME_STATE: {
              if (isNotHost(state)) return sendError(state.user, "Only host can set game state");
              if (!isStarted(state)) return sendError(state.user, "Cannot set game state when game hasn't started");
              if (!isReady(state)) return sendError(state.user, "Must be ready to set game state");

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
              if (isNotHost(state)) return sendError(state.user, "Only host can set player state");
              if (!isStarted(state)) return sendError(state.user, "Cannot set player state when game hasn't started");
              if (!isUserReady(state, data.user))
                return sendError(state.user, "Cannot find ready player with given id to set player state");
              if (!isReady(state)) return sendError(state.user, "Must be ready to set player state");

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
              if (!isStarted(state)) return sendError(state.user, "Cannot send game message when game hasn't started");
              if (isNotHost(state)) return sendError(state.user, "Only host can send game message");
              if (!isReady(state)) return sendError(state.user, "Must be ready to send game message");

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
              if (!isStarted(state)) return sendError(state.user, "Cannot send game message when game hasn't started");
              if (!isReady(state)) return sendError(state.user, "Must be ready to send game message");

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

              if (!isStarted(state)) return sendError(state.user, "Cannot send private message when game hasn't started");
              if (!isReady(state)) return sendError(state.user, "Must be ready to send private message");
              if (isNotHost(state) && data.user !== state.serverRoom.room.host)
                return sendError(state.user, "Only host can set any toUser to send it to");
              if (!isUserReady(state, data.user))
                return sendError(state.user, "Cannot find ready player with given id to send a message to");

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
          // Remove player from room
          state.serverRoom.players.delete(state.user.id);

          // Delete the room if there's no more players in it
          if (!state.serverRoom.players.size) {
            rooms.delete(state.serverRoom.room.id);

            // Update the new room count (unnecessary to await)
            return setCurrentRooms(rooms.size);
          }

          // If host left, assign new host
          if (state.serverRoom.room.host === state.user.id) {
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
        websocketEvents.error = () => ws.close(1002, "A WebSocket error has occurred");

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
