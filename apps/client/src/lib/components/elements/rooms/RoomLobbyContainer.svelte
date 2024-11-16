<script lang="ts">
import { room } from "$lib/components/stores/roomState";
</script>

{#if $room}
  <p>Players</p>
  <ul>
    {#each $room.players.sort((a, b) => b.points - a.points) as player}
      <li>
        {player.displayName}{$room.room.host === player.id ? " [HOST]" : ""}:
        {player.points} point{player.points === 1 ? "": "s"}
      </li>
    {/each}
  </ul>
{:else}
  <p>TODO: Make a loading screen animation of the lobby here!</p>
{/if}
