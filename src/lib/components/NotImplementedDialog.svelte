<script lang="ts">
	import { notImplemented } from '$lib/not-implemented.svelte';

	function closeFromBackdrop(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			notImplemented.close();
		}
	}
</script>

{#if notImplemented.message}
	<div class="dialog-backdrop" role="presentation" onclick={closeFromBackdrop}>
		<div
			class="not-implemented-dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="not-implemented-title"
			tabindex="-1">
			<header class="dialog-titlebar">
				<div>
					<img src="/icons/humanity/mimes/text-x-generic.svg" alt="" width="18" height="18" />
					<h2 id="not-implemented-title">Not Implemented</h2>
				</div>
				<button type="button" aria-label="Close" onclick={() => notImplemented.close()}></button>
			</header>

			<div class="dialog-body">
				<img src="/icons/humanity/devices/computer.svg" alt="" width="48" height="48" />
				<p>{notImplemented.message}</p>
			</div>

			<footer class="dialog-actions">
				<button type="button" onclick={() => notImplemented.close()}>OK</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.dialog-backdrop {
		position: fixed;
		inset: 1.75rem 0 0;
		display: grid;
		place-items: center;
		padding: var(--space-4);
		background: rgb(0 0 0 / 0.18);
		z-index: 10000;
	}

	.not-implemented-dialog {
		width: min(22rem, 100%);
		overflow: hidden;
		color: var(--text);
		background: #f4e6cc;
		border: 1px solid #2a170d;
		border-radius: var(--radius-3) var(--radius-3) var(--radius-2) var(--radius-2);
		box-shadow: var(--shadow-window);
	}

	.dialog-titlebar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 1.85rem;
		padding: 3px var(--space-2) 3px var(--space-3);
		color: #fff1d7;
		background:
			linear-gradient(rgb(255 255 255 / 0.14), transparent 45%),
			linear-gradient(var(--window-title-start), var(--window-title-end));
		border-bottom: 1px solid #1b0f09;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.9);
	}

	.dialog-titlebar div {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.dialog-titlebar h2 {
		font-size: var(--text-2);
	}

	.dialog-titlebar button {
		width: 14px;
		height: 14px;
		border: 1px solid #1e120a;
		border-radius: var(--radius-round);
		background: radial-gradient(circle at 35% 30%, #fff4d0, #cf7b1f 45%, #6d3412 78%);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.24) inset;
		cursor: default;
	}

	.dialog-titlebar button:hover {
		background: radial-gradient(circle at 35% 30%, #ffd6c9, #ef2929 42%, #660000 78%);
	}

	.dialog-body {
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr);
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-5);
		background: linear-gradient(#fff8ed, #e4cfad);
	}

	.dialog-body p {
		font-size: var(--text-3);
		font-weight: 700;
	}

	.dialog-actions {
		display: flex;
		justify-content: end;
		padding: var(--space-3);
		background: #d6bf99;
		border-top: 1px solid #a5875d;
	}

	.dialog-actions button {
		min-width: 5.5rem;
		height: 1.8rem;
		padding: 0 var(--space-4);
		background: linear-gradient(#fff9ec, #ceb48a);
		border: 1px solid #9b7d55;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
		font-weight: 700;
		cursor: default;
	}

	.dialog-actions button:active {
		box-shadow: var(--shadow-sunken);
	}
</style>
