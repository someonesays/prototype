<script>
import "$lib/styles/index.css";
import { preloadData } from "$app/navigation";

preloadData("/rooms/new");
</script>

<svelte:head>
  <title>Someone Says</title>
</svelte:head>

<slot />
