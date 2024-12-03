<script>
import "$lib/styles/index.css";
</script>

<svelte:head>
  <title>Someone Says</title>
</svelte:head>

<slot />

<style>
  :root {
    --primary: #ece2fc;
    --secondary: #fafafa;
    
    --primary-button: #5812e2;
    --success-button: #23a55a;
    --error-button: #aa0e32;
    --secondary-button: #4c5660;
    --leave-button: #f23f43;

    --error-button-hover: #850725;
    --secondary-button-hover: #6d7781;

    --primary-text: #000000;
    --secondary-text: #242424;
    
    --card-stroke: #b3b3b3; 
    --settings-button: #343a40;
    --report-flag: #ff0000;

    --bg-gradient-primary-1: #611ded;
    --bg-gradient-primary-2: #89cad9;
    --bg-gradient-secondary: #000000;
    --bg-checkers: #ffffff14;
    --bg-glow: #ff93f880;
  }
  :global(body) {
    background-color: #000000;
    color: var(--secondary);
  }
</style>
