<script lang="ts">
import { beforeNavigate } from "$app/navigation";
import { isModalOpen } from "$lib/components/stores/modal";

let { children } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal" class:hidden={!$isModalOpen} onclick={() => $isModalOpen = false}>
	<div class="content">
		<div class="close-button-container">
			<button class="close-button" aria-label="Close popup" onclick={() => $isModalOpen = false}>&times;</button>
		</div>
    {@render children()}
	</div>
</div>

<style>
	.modal {
		background-color: rgba(0,0,0,0.4);
		position: fixed;
		z-index: 9999;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		overflow: auto;
	}
	.content {
		position: relative;
		background-color: var(--primary);
    color: var(--primary-text);
    border-radius: 6px;
		text-align: center;
		margin: 15% auto;
		padding: 20px;
    width: 50vh;
	}
	.close-button-container {
		padding: 0.5rem;
	}
	.close-button {
		position: absolute;
    background: none;
    border: none;
		top: 0.5rem;
		right: 0.5rem;
		color: var(--secondary-button);
		font-size: 28px;
		font-weight: bold;
		cursor: pointer;
	}
	.close-button:hover,
	.close-button:focus {
		color: black;
		text-decoration: none;
		cursor: pointer;
	}
	.hidden {
		display: none;	
	}
</style>
