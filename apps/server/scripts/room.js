// Get matchmaking information
const {
  authorization,
  data: {
    room: {
      server: { url },
    },
  },
} = await (await fetch("http://localhost:3001/api/matchmaking")).json();

// Connect to the WebSocket
const ws = new WebSocket(url, [authorization, "Json"]);

// Opcodes and other enums
const ClientOpcodes = {
  Ping: 0,
  KickPlayer: 1,
  TransferHost: 2, // (Disallow running this mid-game)
  SetRoomSettings: 3,
  BeginGame: 4, // Actually begins the game (not a minigame)
  MinigameHandshake: 5,
  MinigameEndGame: 6, // End the minigame game
  MinigameSetGameState: 7,
  MinigameSetPlayerState: 8,
  MinigameSendGameMessage: 9,
  MinigameSendPlayerMessage: 10,
  MinigameSendPrivateMessage: 11, // Player message to host only
};

const ServerOpcodes = {
  Error: 1,
  GetInformation: 2, // Send the room and player information, along with the room and player states.
  PlayerJoin: 3, // Player joined the room
  PlayerLeft: 4, // Player left or got kicked out of the room (no need for a MinigamePlayerLeft)
  TransferHost: 5, // Transferred host to another player
  UpdatedRoomSettings: 6, // Updated room settings
  LoadMinigame: 7, // Load a minigame
  EndMinigame: 8, // End a minigame
  MinigamePlayerReady: 9, // Send that a player has loaded a minigame (player ready event for minigames)
  MinigameStartGame: 10, // Start the minigame's game (host has to be ready then it gives everyone else 30 more seconds to load the minigame iframe as well)
  MinigameSetGameState: 11,
  MinigameSetPlayerState: 12,
  MinigameSendGameMessage: 13,
  MinigameSendPlayerMessage: 14,
  MinigameSendPrivateMessage: 15,
};

const GamePrizeType = {
  Participation: 0,
  Winner: 1,
  Second: 2,
  Third: 3,
};

// Function to send messages
const send = ({ opcode, data = {} }) => ws.send(JSON.stringify({ opcode, data }));

// Handle messages
ws.onmessage = ({ data: payload }) => {
  const data = JSON.parse(payload);

  const opcodeName = Object.entries(ServerOpcodes).find(([_, v]) => v === data.opcode);
  console.log(opcodeName[0], data);
};

// Ping to stay connected
const interval = setInterval(() => {
  send({ opcode: ClientOpcodes.Ping });
}, 60000);

// Handle close
ws.onclose = () => {
  console.log("WebSocket disconnected");
  clearInterval(interval);
};

// Testing code
send({ opcode: ClientOpcodes.KickPlayer, data: { user: "player id" } });
send({ opcode: ClientOpcodes.TransferHost, data: { user: "player id" } });
send({ opcode: ClientOpcodes.SetRoomSettings, data: { name: "new room name", minigameId: "minigameId" } });
send({ opcode: ClientOpcodes.BeginGame });
send({ opcode: ClientOpcodes.MinigameHandshake });
send({
  opcode: ClientOpcodes.MinigameEndGame,
  data: {
    // "prizes" is optional - without prizes, it's a forceful end game
    prizes: [
      { user: "player id", type: GamePrizeType.Winner },
      { user: "player id 2", type: GamePrizeType.Second },
      { user: "player id 3", type: GamePrizeType.Third },
      { user: "player id 4", type: GamePrizeType.Participation },
    ],
  },
});
send({ opcode: ClientOpcodes.MinigameSetGameState, data: { state: "this is now the game's state!" } });
send({
  opcode: ClientOpcodes.MinigameSetPlayerState,
  data: {
    user: "player id", // "user" is optional and defaults to self
    state: "this is now the user's state!",
  },
});
send({ opcode: ClientOpcodes.MinigameSendGameMessage, data: { message: "this is a message the game sends to everyone" } });
send({ opcode: ClientOpcodes.MinigameSendPlayerMessage, data: { user: "player id", message: "this is a user message!" } });
send({
  opcode: ClientOpcodes.MinigameSendPrivateMessage,
  data: {
    message: "this is the message to send",
    toUser: "this is an optional variable (defaults to host) to set which user to send it to", // "toUser" is optional and defaults to host
  },
});
