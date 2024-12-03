<script lang="ts">
import { isModalOpen } from "$lib/components/stores/modal";
import { clickOutside } from "$lib/utils/clickOutside";

let { children } = $props();
</script>

<div class="modal" class:hidden={!$isModalOpen}>
	<div class="content" use:clickOutside={() => $isModalOpen = false}>
		<div class="close-button-container">
			<button class="close-button" aria-label="Close popup" onclick={() => $isModalOpen = false}>&times;</button>
		</div>
    <br><br>
    {@render children()}
	</div>
</div>

<style>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .modal.hidden {
    display: none;
  }
  .content {
    background-color: var(--primary);
    color: var(--primary-text);
		margin: 12px;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
		text-align: center;
		justify-content: center;
  }
  .close-button-container {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--primary-text);
  }
  .close-button:focus {
    outline: none;
  }
  .close-button:hover {
    color: var(--primary-hover);
  }
</style>
