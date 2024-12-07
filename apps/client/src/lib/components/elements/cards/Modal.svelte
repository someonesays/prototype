<script lang="ts">
import { isModalOpen } from "$lib/components/stores/modal";
import { clickOutside } from "$lib/utils/clickOutside";

let { children, cardStyle } = $props();
</script>

<div class="modal" class:hidden={!$isModalOpen} role="dialog">
	<div class="content" style={cardStyle} use:clickOutside={() => $isModalOpen = false}>
    {@render children()}
	</div>
</div>

<style>
  .modal {
    align-items: center;
    background: rgba(0, 0, 0, .4);
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 9999;
    opacity: 1;
    animation-name: card-fade-in;
    animation-duration: 0.1s;
  }
  @keyframes card-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .modal.hidden {
    display: none;
    opacity: 0;
  }
  .content {
    background-color: var(--primary);
    color: var(--primary-text);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    box-sizing: border-box;
    max-height: 100vh;
    max-width: 500px;
		text-align: center;
    overflow-y: auto;
    padding: 20px;
  }
  @media (max-width: 319px) {
    .content {
      transform: scale(0.9);
    }
  }

  @media (max-width: 140px) {
    .content {
      transform: scale(0.8);
    }
  }

  @media (max-width: 100px) {
    .content {
      overflow-x: hidden;
    }
  }
</style>
