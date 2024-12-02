<script lang="ts">
import Logo from "$lib/components/icons/Logo.svelte";
import BaseCard from "../cards/BaseCard.svelte";

import { launcher, launcherDiscordSdk } from "$lib/components/stores/launcher";
import { room, roomWs } from "$lib/components/stores/roomState";
import { ClientOpcodes } from "@/public";
import { Permissions, PermissionUtils } from "@discord/embedded-app-sdk";

function setSettings(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  const form = new FormData(evt.target as HTMLFormElement);
  const packId = (form.get("pack_id") as string) || null;
  const minigameId = (form.get("minigame_id") as string) || null;

  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: {
      packId,
      minigameId,
    },
  });
}

function kickPlayer(user: string) {
  $roomWs?.send({
    opcode: ClientOpcodes.KICK_PLAYER,
    data: { user },
  });
}

function transferHost(user: string) {
  $roomWs?.send({
    opcode: ClientOpcodes.TRANSFER_HOST,
    data: { user },
  });
}

async function copyInviteLink() {
  try {
    switch ($launcher) {
      case "normal": {
        navigator.clipboard.writeText(`${location.origin}/join/${$room?.room.id}`);
        break;
      }
      case "discord": {
        if (!$launcherDiscordSdk) throw new Error("Missing DiscordSDK. This should never happen.");

        const { permissions } = await $launcherDiscordSdk.commands.getChannelPermissions();
        if (PermissionUtils.can(Permissions.CREATE_INSTANT_INVITE, permissions)) {
          await $launcherDiscordSdk.commands.openInviteDialog();
        } else {
          console.warn("User doesn't have CREATE_INSTANT_INVITE permissions!");
        }

        break;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function startGame() {
  $roomWs?.send({ opcode: ClientOpcodes.BEGIN_GAME, data: {} });
}

function leaveGame() {
  return $roomWs?.close();
}
</script>

{#if $room}
  <div class="main-container">
    <div class="nav-container desktop-width">
      <div class="left">
        {#if $launcher === "normal"}
          <button onclick={leaveGame}>Leave room</button>
        {/if}
      </div>
      <div class="center">
        <div class="logo">
          <Logo />
        </div>
      </div>
      <div class="right">
        settings button
      </div>
    </div>
  </div>

  <div class="main-container content-container">
    <div class="left">
      <BaseCard>
        <h2>Players</h2>
        {#each $room.players.sort((a, b) => b.points - a.points) as player}
            <p>
              <img src={player.avatar} width="50" height="50" alt="{player.displayName}'s avatar" />
              {player.displayName}{$room.room.host === player.id ? " [HOST]" : ""}:
              {player.points} point{player.points === 1 ? "": "s"}
        
              {#if $room.room.host === $room.user && $room.user !== player.id}
                <button onclick={() => kickPlayer(player.id)}>
                  Kick
                </button>
                <button onclick={() => transferHost(player.id)}>
                  Transfer Host
                </button>
              {/if}
            </p>
        {/each}
      </BaseCard>
    </div>
    <div class="right options-container">
      <div class="minigame-container">
        <BaseCard>
          <h2>Minigame information</h2>
          <p>Pack: {$room.pack ? JSON.stringify($room.pack) : "None"}</p>
          <p>Minigame: {$room.minigame ? JSON.stringify($room.minigame) : "None"}</p>
        
          {#if $room.pack?.iconImage}
            <p>Pack icon image:</p>
            <p>
              <img alt="pack preview" src={
                $launcher === "normal"
                  ? $room.pack.iconImage.normal
                  : $room.pack.iconImage.discord
              } width="100" height="100" />
            </p>
          {/if}
        
          {#if $room.minigame?.previewImage}
            <p>Minigame preview image:</p>
            <p>
              <img alt="minigame preview" src={
                $launcher === "normal"
                  ? $room.minigame.previewImage.normal
                  : $room.minigame.previewImage.discord
              } width="100" height="100" />
            </p>
          {/if}

          {#if $room.room.host === $room.user}
            <form onsubmit={setSettings}>
              <input type="text" name="pack_id" placeholder="Pack ID">
              <input type="text" name="minigame_id" placeholder="Minigame ID">
              <input type="submit" value="Set pack/minigame">
            </form>
          {/if}

          {#if $room.minigame && !$room.minigame.supportsMobile && $room.players.find(p => p.mobile)}
            <p>WARNING: There is at least one mobile player in this lobby and this minigame doesn't support mobile devices!</p>
          {/if}
        </BaseCard>
      </div>
      <div>
        <button onclick={copyInviteLink}>Invite</button>
        <button onclick={startGame} disabled={$room.room.host !== $room.user}>Start</button>
      </div>
    </div>
  </div>
{:else}
  <p>TODO: Make a loading screen animation of the lobby here!</p>
{/if}

<style>
.desktop-width {
  width: 90%;
}
.main-container {
  display: flex;
  justify-content: center;
}
.nav-container {
  display: flex;
}
.nav-container > .left {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.nav-container > .center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.nav-container > .right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.content-container {
  margin-top: calc(12px + 2vh);
  column-gap: 2vh;
}
.options-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  row-gap: 2vh;
}
.minigame-container {
  width: 100vh; /* todo: this is bad do not keep this get a proper ui designer */
}

.logo {
  width: calc(120px + 4vh);
}

@media only screen and (max-width: 480px) {
  .desktop-width {
    width: 100%;
  }
  .logo {
    display :none;
  }
}
</style>
