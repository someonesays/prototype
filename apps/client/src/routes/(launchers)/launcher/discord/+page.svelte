<script>
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { launcher } from "$lib/components/stores/launcher";

onMount(() => {
  launcher.set("discord");
  goto("/");
});
</script>

<p>Loading launcher...</p>
