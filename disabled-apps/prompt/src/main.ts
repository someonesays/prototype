import "./style.css";
import { MinigameSdk, ParentOpcodes } from "@/public";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing app");

app.innerHTML = `
  <div>
    <h2>This is a test minigame intended to show what you can do with the MinigameSDK.</h2>
    <p>I recommend having DevTools → Console open when playing this "minigame".</p>
    <div class="card">
      Send event:<br>
      <select id="event">
        <option value=""></option>
        <option value="endGame">endGame</option>
        <option value="setGameState">setGameState</option>
        <option value="setPlayerState">setPlayerState</option>
        <option value="sendGameMessage">sendGameMessage</option>
        <option value="sendPlayerMessage">sendPlayerMessage</option>
        <option value="sendPrivateMessage">sendPrivateMessage</option>
      </select><br>
      <span id="options"></span><br>
      <button id="send" style="display:none">Send</button><br>
      <br>
      Event logs:<br>
      <textarea id="logs" rows="10" cols="75" disabled></textarea><br><br>
      Data:<br>
      <p><textarea id="data" disabled></textarea></p>

    </div>
  </div>
`;

// Get textarea and make a logEvent function
const logsTextarea = document.getElementById("logs") as HTMLTextAreaElement;
function logEvent(event: string, value: object) {
  console.debug("[MINIGAME]", event, value);
  logsTextarea.value += `${event}: ${JSON.stringify(value)}\n\n`;
}

// Initialize MinigameSdk
const sdk = new MinigameSdk();
console.debug("[MINIGAME] SDK", sdk);

// Handle events
const eventSelect = document.getElementById("event") as HTMLSelectElement;
const optionsSpan = document.getElementById("options") as HTMLSpanElement;
const sendButton = document.getElementById("send") as HTMLButtonElement;

// Set the data
const dataDiv = document.getElementById("data");
if (!dataDiv) throw new Error("Missing data div");

setInterval(() => {
  if (!sdk.data) return;
  dataDiv.innerHTML = JSON.stringify(sdk.data, null, 2);
}, 100);

// Handles SDK logic
sdk.ready();

sdk.on(ParentOpcodes.READY, (evt) => {
  logEvent("Ready", evt);
});

sdk.on(ParentOpcodes.UPDATE_SETTINGS, (evt) => {
  logEvent("UpdateSettings", evt);
});

sdk.on(ParentOpcodes.START_GAME, (evt) => {
  logEvent("StartGame", evt);
});

sdk.on(ParentOpcodes.MINIGAME_PLAYER_READY, (evt) => {
  logEvent("MinigamePlayerReady", evt);
});

sdk.on(ParentOpcodes.PLAYER_LEFT, (evt) => {
  logEvent("PlayerLeft", evt);
});

sdk.on(ParentOpcodes.UPDATED_GAME_STATE, (evt) => {
  logEvent("UpdatedGameState", evt);
});

sdk.on(ParentOpcodes.UPDATED_PLAYER_STATE, (evt) => {
  logEvent("UpdatedPlayerState", evt);
});

sdk.on(ParentOpcodes.RECEIVED_GAME_MESSAGE, (evt) => {
  logEvent("ReceivedGameMessage", evt);
});

sdk.on(ParentOpcodes.RECEIVED_PLAYER_MESSAGE, (evt) => {
  logEvent("ReceivedPlayerMessage", evt);
});

sdk.on(ParentOpcodes.RECEIVED_PRIVATE_MESSAGE, (evt) => {
  logEvent("ReceivedPrivateMessage", evt);
});

eventSelect.onchange = () => {
  if (!eventSelect.value) {
    sendButton.style.display = "none";
    optionsSpan.innerHTML = "";
    return;
  }

  sendButton.style.display = "";

  switch (eventSelect.value) {
    case "endGame":
      optionsSpan.innerHTML = `
          Prizes:<br><textarea id="prizes">${JSON.stringify([{ user: "", type: 0 }])}</textarea>
        `;
      break;
    case "setGameState":
      optionsSpan.innerHTML = `State: <input id="state">`;
      break;
    case "setPlayerState":
      optionsSpan.innerHTML = `
          Player ID / User: <input id="user"><br>
          State: <input id="state">
        `;
      break;
    case "sendGameMessage":
      optionsSpan.innerHTML = `Message: <input id="message">`;
      break;
    case "sendPlayerMessage":
      optionsSpan.innerHTML = `Message: <input id="message">`;
      break;
    case "sendPrivateMessage":
      optionsSpan.innerHTML = `
          To player ID / user: <input id="user"><br>
          Message: <input id="message">
        `;
      break;
  }
};

sendButton.onclick = () => {
  switch (eventSelect.value) {
    case "endGame": {
      const prizes = JSON.parse((document.getElementById("prizes") as HTMLTextAreaElement)?.value);
      return sdk.endGame({ prizes });
    }
    case "setGameState": {
      let state = (document.getElementById("state") as HTMLInputElement).value;
      try {
        state = JSON.parse(state);
      } catch (err) {}
      return sdk.setGameState({ state });
    }
    case "setPlayerState": {
      const user = (document.getElementById("user") as HTMLInputElement).value;
      let state = (document.getElementById("state") as HTMLInputElement).value;
      try {
        state = JSON.parse(state);
      } catch (err) {}
      return sdk.setPlayerState({ user, state });
    }
    case "sendGameMessage": {
      let message = (document.getElementById("message") as HTMLInputElement).value;
      try {
        message = JSON.parse(message);
      } catch (err) {}
      return sdk.sendGameMessage({ message });
    }
    case "sendPlayerMessage": {
      let message = (document.getElementById("message") as HTMLInputElement).value;
      try {
        message = JSON.parse(message);
      } catch (err) {}
      return sdk.sendPlayerMessage({ message });
    }
    case "sendPrivateMessage": {
      const user = (document.getElementById("user") as HTMLInputElement).value || undefined;
      let message = (document.getElementById("message") as HTMLInputElement).value;
      try {
        message = JSON.parse(message);
      } catch (err) {}
      return sdk.sendPrivateMessage({ user, message });
    }
  }
};
