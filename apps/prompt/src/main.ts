import "./style.css";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupCounter } from "./counter.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);

import { MinigameSdk, ParentOpcodes } from "@/public";

window.oncontextmenu = (evt) => evt.preventDefault();

(async () => {
  const sdk = new MinigameSdk();
  console.debug("[PROMPT] SDK", sdk);

  const minigame = await sdk.ready();
  console.debug("[PROMPT] Ready", minigame);

  sdk.on(ParentOpcodes.UpdateSettings, (evt) => {
    console.debug("[PROMPT] UpdateSettings", evt);
  });

  sdk.on(ParentOpcodes.StartGame, (evt) => {
    console.debug("[PROMPT] StartGame", evt);
  });

  sdk.on(ParentOpcodes.MinigamePlayerReady, (evt) => {
    console.debug("[PROMPT] MinigamePlayerReady", evt);
  });

  sdk.on(ParentOpcodes.PlayerLeft, (evt) => {
    console.debug("[PROMPT] PlayerLeft", evt);
  });

  sdk.on(ParentOpcodes.UpdatedGameState, (evt) => {
    console.debug("[PROMPT] UpdatedGameState", evt);
  });

  sdk.on(ParentOpcodes.UpdatedPlayerState, (evt) => {
    console.debug("[PROMPT] UpdatedPlayerState", evt);
  });

  sdk.on(ParentOpcodes.ReceivedGameMessage, (evt) => {
    console.debug("[PROMPT] ReceivedGameMessage", evt);
  });

  sdk.on(ParentOpcodes.ReceivedPrivateMessage, (evt) => {
    console.debug("[PROMPT] ReceivedPrivateMessage", evt);
  });
})();
