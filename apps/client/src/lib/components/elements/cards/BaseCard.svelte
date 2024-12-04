<script lang="ts">
let { children } = $props();
</script>

<div class="card">
  {@render children()}
</div>

<style>
  .card {
    background-color: var(--primary);
    color: var(--primary-text);
    border-radius: 15px;
    padding: 5px;
  }
</style>