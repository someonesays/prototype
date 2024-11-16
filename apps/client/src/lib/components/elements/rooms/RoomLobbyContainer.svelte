<script lang="ts">
import { room, roomWs } from "$lib/components/stores/roomState";
import { ClientOpcodes } from "@/public";

function setSettings(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  const form = new FormData(evt.target as HTMLFormElement);
  const packId = (form.get("pack_id") as string) || null;
  const minigameId = (form.get("minigame_id") as string) || null;

  $roomWs?.send({
    opcode: ClientOpcodes.SetRoomSettings,
    data: {
      packId,
      minigameId,
    },
  });
}

function kickPlayer(user: string) {
  $roomWs?.send({
    opcode: ClientOpcodes.KickPlayer,
    data: { user },
  });
}

function copyInviteLink() {
  try {
    navigator.clipboard.writeText(`${location.origin}/join/${$room?.room.id}`);
  } catch (err) {
    console.error(err);
  }
}

function startGame() {
  $roomWs?.send({ opcode: ClientOpcodes.BeginGame, data: {} });
}
</script>

{#if $room}
  <h2>Players</h2>
  <ul>
    {#each $room.players.sort((a, b) => b.points - a.points) as player}
      <li>
        {player.displayName}{$room.room.host === player.id ? " [HOST]" : ""}:
        {player.points} point{player.points === 1 ? "": "s"}

        {#if $room.room.host === $room.user && $room.user !== player.id}
          <button onclick={() => kickPlayer(player.id)}>
            Kick
          </button>
        {/if}
      </li>
    {/each}
  </ul>

  <h2>Minigame information</h2>
  <p>Pack: {$room.pack ? JSON.stringify($room.pack) : "None"}</p>
  <p>Minigame: {$room.minigame ? JSON.stringify($room.minigame) : "None"}</p>

  {#if $room.room.host === $room.user}
    <form onsubmit={setSettings}>
      <input type="text" name="pack_id" placeholder="Pack ID">
      <input type="text" name="minigame_id" placeholder="Minigame ID">
      <input type="submit" value="Set pack/minigame">
    </form>
  {/if}

  <h2>Actions</h2>
  <p>
    <button onclick={() => copyInviteLink()}>Invite</button>
    <button onclick={() => startGame()} disabled={$room.room.host !== $room.user}>Start</button>
  </p>
{:else}
  <p>TODO: Make a loading screen animation of the lobby here!</p>
{/if}
