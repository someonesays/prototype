<script lang="ts">
let { children, style = "" } = $props();
</script>

<div class="card" style={style}>
  {@render children()}
</div>

<style>
  .card {
    background-color: var(--primary);
    color: var(--primary-text);
    border-radius: 15px;
    padding: 15px;
    overflow: auto;
  }
</style>