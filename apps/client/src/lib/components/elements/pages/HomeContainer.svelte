<script>
import { beforeNavigate } from "$app/navigation";
import BaseCard from "$lib/components/elements/cards/BaseCard.svelte";
import { kickedReason } from "$lib/components/stores/kickedReason";

// Remove kicked reason if you leave the page
beforeNavigate(() => {
  $kickedReason = null;
});
</script>
  
<div style="width: 50%; height: 300px;">
  <BaseCard>
    {#if $kickedReason}
      <p class="kicked">{$kickedReason}</p>
    {/if}
    
    <p>Someone Says</p>
    <p><a href="/rooms/new">Play</a></p>
  </BaseCard>
</div>
  
  <style>
    .kicked {
      color: var(--error-button);
    }
  </style>
  