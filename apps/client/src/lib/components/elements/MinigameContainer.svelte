<script lang="ts">
import { onMount } from "svelte";
import { ParentSdk, MinigameOpcodes } from "@/sdk";

import GearIcon from "$lib/components/icons/GearIcon.svelte";

export let minigameId: string;

let container: HTMLDivElement;
let authorText = "Someone";
let minigamePromptText = "";
let minigameTextOpacity = 0;
$: volumeValue = 100;

onMount(() => {
  const iframe = document.createElement("iframe") as HTMLIFrameElement;
  iframe.referrerPolicy = "origin";
  iframe.allow = "autoplay; encrypted-media";
  iframe.sandbox.add("allow-pointer-lock", "allow-scripts", "allow-forms");
  container.appendChild(iframe);

  const sdk = new ParentSdk({ iframe });

  sdk.once(MinigameOpcodes.Handshake, () => {
    sdk.confirmHandshake({
      // WIP: Remove these placeholder messages
      started: false,
      settings: {
        language: "en-US",
        volume: 1,
      },
      user: "mock_user_id",
      room: {
        name: "mock room name",
        state: null,
      },
      players: [
        {
          id: "mock_user_id",
          displayName: "mock display name",
          state: null,
        },
      ],
    });
  });

  (async () => {
    const { success, minigame } = await ParentSdk.getMinigame(minigameId);
    if (!success || !minigame) throw new Error("The minigame with the given ID doesn't exist");

    authorText = minigame.author.name;
    minigamePromptText = minigame.prompt;
    minigameTextOpacity = 1;

    iframe.src = minigame.url;
  })();

  return () => {
    sdk.destroy();
    container.removeChild(iframe);
  };
});

let isSettingsOpen = false;
function openSettings() {
  isSettingsOpen = !isSettingsOpen;
}

function leaveGame() {
  alert("This is an unfinished button");
}
</script>

<div class="minigame-container">
  <div class="minigame-row">
    <div class="minigame-text" style="opacity:{minigameTextOpacity}">
      <p>{authorText} says <b>{minigamePromptText}</b></p>
    </div>
  </div>
  <div class="minigame-iframe" bind:this={container} />
  <div class="minigame-settings">
    <div class="minigame-settings-menu" class:minigame-settings-menu-active={isSettingsOpen}>
      <div>
        <div>
          <p style="float: left">Volume</p>
          <p style="float: right">{volumeValue}%</p>
        </div>
        <input type="range" min="0" max="100" bind:value={volumeValue} />
      </div>
      <div>
        <button class="leave-game" on:click={leaveGame}>Leave game</button>
      </div>
    </div>
    <button class="minigame-settings-button" class:minigame-settings-button-active={isSettingsOpen} on:click={openSettings}>
      <div><GearIcon /></div>
    </button>
  </div>
</div>

<style>
  .minigame-container {
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    flex-flow: column;
    align-items: stretch;
    overflow: hidden;
  }
  .minigame-row {
    background-color: black;
    color: white;
  }
  .minigame-text {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(4px + 0.5vh);
    opacity: 0;
    text-align: center;
    height: calc(40px + 0.5vh);
    max-height: calc(40px + 0.5vh);
    font-size: calc(16px + 0.25vh);
  }
  .minigame-iframe {
    background-color: black;
    flex: 1 1 auto;
  }
  :global(.minigame-iframe iframe) {
    border-width: 0;
    width: 100%;
    height: 100%;
  }
  .minigame-settings {
    position: absolute;
    color: white;
    right: calc(16px + 0.5vh);
    bottom: calc(16px + 0.5vh);
  }
  .minigame-settings-menu {
    display: none;
    margin-bottom: 12px;
  }
  .minigame-settings-menu p {
    margin: 0;
  }
  .minigame-settings-menu-active {
    display: block;
    border-radius: 2px;
    background-color: #1e1e1e;
    box-shadow: #64646f33 0px 7px 29px 0px;
    padding: 15px;
  }
  .minigame-settings-button {
    background-color: #343a40;
    border: 2px #4a5259 solid;
    border-radius: calc(4px + 0.5vh);
    box-shadow: #64646f33 0px 7px 29px 0px;
    padding: 0px;
    float: right;
    cursor: pointer;
    width: calc(40px + 0.5vh);
    height: calc(40px + 0.5vh);
    transition: box-shadow .5s ease-out;
  }
  .minigame-settings-button div {
    margin: 25%;
    width: 50%;
    height: 50%;
    transition: transform .5s ease-out;
  }
  .minigame-settings-button-active {
    background-color: #4a5259;
  }
  .leave-game {
    border: 2px #e03131 solid;
    border-radius: 2px;
    background-color: #ffc9c9;
    color: #e03131;
    text-align: right;
    cursor: pointer;
    margin-top: 12px;
    width: 100%;
    height: 30px;
    transition: border .5s ease-out;
  }
  @media (hover: hover) {
    .minigame-settings-button:hover {
      background-color: #4a5259;
      box-shadow: #64646f73 0px 7px 29px 0px;
    }
    .minigame-settings-button:hover > div {
      transform: rotate(90deg);
    }
    .leave-game:hover {
      background-color: #e03131;
      color: #ffc9c9;
    }
  }
</style>
