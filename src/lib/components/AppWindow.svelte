<script lang="ts">
	import type { Snippet } from 'svelte';
	type Props = { title: string; icon: string };

	let { title, icon, children }: Props & { children: Snippet } = $props();
</script>

<section class="app-window" aria-label={title}>
	<header class="titlebar">
		<div class="window-title">
			<img src={icon} alt="" width="18" height="18" />
			<h1>{title}</h1>
		</div>
		<div class="window-controls" aria-hidden="true">
			<span></span>
			<span></span>
			<span></span>
		</div>
	</header>

	<nav class="menubar" aria-label="Application menu">
		<button type="button">Collection</button>
		<button type="button">Navigate</button>
		<button type="button">View</button>
		<button type="button">Bookmarks</button>
		<button type="button">Help</button>
	</nav>

	<div class="toolbar" aria-label="Application toolbar">
		<button type="button"><span aria-hidden="true">◀</span> Back</button>
		<button type="button"><span aria-hidden="true">▶</span> Forward</button>
		<button type="button"
			><img src="/icons/humanity/actions/mail-send-receive.svg" alt="" width="18" height="18" /> Sync</button>
		<label>
			<span class="sr-only">Address</span>
			<input value="at://ubuntu.example/app.bsky.feed.post" readonly />
		</label>
	</div>

	<div class="content">
		{@render children()}
	</div>
</section>

<style>
	.app-window {
		display: grid;
		grid-template-rows: auto auto auto minmax(0, 1fr);
		overflow: hidden;
		background: var(--window-surface);
		border: 1px solid #2a170d;
		border-radius: var(--radius-3) var(--radius-3) var(--radius-2) var(--radius-2);
		box-shadow: var(--shadow-window);
	}

	.titlebar {
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

	.window-title {
		display: flex;
		align-items: center;
		min-width: 0;
		gap: var(--space-2);
	}

	h1 {
		overflow: hidden;
		font-size: var(--text-2);
		font-weight: 700;
		line-height: var(--leading-tight);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.window-controls {
		display: flex;
		gap: 5px;
	}

	.window-controls span {
		width: 14px;
		height: 14px;
		border: 1px solid #1e120a;
		border-radius: var(--radius-round);
		background: radial-gradient(circle at 35% 30%, #fff4d0, #cf7b1f 45%, #6d3412 78%);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.24) inset;
	}

	.menubar,
	.toolbar {
		display: flex;
		align-items: center;
		background: linear-gradient(#f3e5ca, #d4bb91);
		border-bottom: 1px solid #9b805b;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.68) inset;
	}

	.menubar {
		gap: var(--space-1);
		padding: 2px var(--space-2);
		font-size: var(--text-1);
	}

	.menubar button {
		padding: 1px var(--space-2);
		border-radius: var(--radius-1);
		cursor: default;
	}

	.menubar button:hover {
		color: white;
		background: var(--selection);
	}

	.toolbar {
		gap: var(--space-2);
		padding: var(--space-2);
	}

	.toolbar button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 1.75rem;
		padding: 0 var(--space-3);
		background: linear-gradient(#fff9ec, #ceb48a);
		border: 1px solid #9b7d55;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
		font-size: var(--text-1);
		cursor: default;
	}

	.toolbar label {
		min-width: 8rem;
		flex: 1;
	}

	.toolbar input {
		width: 100%;
		height: 1.75rem;
		padding: 0 var(--space-2);
		color: var(--text-muted);
		background: #fffcf4;
		border: 1px solid #8e7654;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-sunken);
		font-family: var(--font-mono);
		font-size: var(--text-1);
	}

	.content {
		overflow: hidden;
		padding: var(--space-3);
		background: var(--window-surface);
	}

	@media (max-width: 760px) {
		.toolbar button:nth-of-type(2),
		.toolbar input {
			display: none;
		}
	}
</style>
