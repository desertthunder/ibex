<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { notImplemented } from '$lib/not-implemented.svelte';
	import { windowManager } from '$lib/window-manager.svelte';
	import GnomeMenuBar from '$lib/components/GnomeMenuBar.svelte';

	const launchers = [
		{ label: 'Browser', icon: '/icons/humanity/apps/web-browser.svg', path: '/lexicons' },
		{ label: 'Mail', icon: '/icons/humanity/apps/evolution-mail.svg' },
		{ label: 'Terminal', icon: '/icons/humanity/apps/utilities-terminal.svg' }
	];

	function openLauncher(launcher: (typeof launchers)[number]) {
		if (launcher.path) {
			void goto(resolve(launcher.path as '/lexicons'));
			return;
		}

		notImplemented.show();
	}
</script>

<header class="gnome-panel" aria-label="GNOME top panel">
	<GnomeMenuBar />

	<div class="panel-launchers" aria-label="Launchers">
		{#each launchers as launcher (launcher.label)}
			<button type="button" title={launcher.label} onclick={() => openLauncher(launcher)}>
				<img src={launcher.icon} alt="" width="22" height="22" />
			</button>
		{/each}
	</div>

	<div class="panel-spacer" aria-hidden="true"></div>

	<section class="window-list" aria-label="Open windows">
		{#each windowManager.openWindows as window (window.id)}
			<button
				class="active-window"
				class:minimized={window.isMinimized}
				type="button"
				onclick={() => windowManager.restore(window.id)}>
				<img src={window.icon} alt="" width="16" height="16" />
				<span>{window.title}</span>
			</button>
		{/each}
	</section>
</header>

<style>
	.gnome-panel {
		position: relative;
		z-index: 9000;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		height: 1.75rem;
		padding: 2px var(--space-2);
		color: #fff5df;
		background:
			linear-gradient(rgb(255 255 255 / 0.11), transparent 42%),
			linear-gradient(90deg, var(--panel-start), var(--panel-end));
		border-top: 1px solid var(--panel-border-light);
		border-bottom: 1px solid var(--panel-border-dark);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
		font-size: var(--text-1);
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.75);
	}

	.panel-launchers,
	.window-list {
		display: flex;
		align-items: center;
	}

	.panel-launchers button,
	.active-window {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 1.35rem;
		padding: 0 var(--space-2);
		border: 1px solid transparent;
		border-radius: var(--radius-1);
		cursor: default;
	}

	.panel-launchers button:hover {
		background: rgb(255 238 203 / 0.16);
		border-color: rgb(255 255 255 / 0.18) rgb(0 0 0 / 0.35) rgb(0 0 0 / 0.45) rgb(255 255 255 / 0.16);
	}

	.panel-launchers {
		gap: 1px;
		padding-left: var(--space-1);
		border-left: 1px solid rgb(255 255 255 / 0.13);
	}

	.panel-launchers button {
		width: 1.55rem;
		justify-content: center;
		padding: 0;
	}

	.panel-spacer {
		flex: 1;
	}

	.window-list {
		gap: var(--space-1);
		min-width: min(32vw, 24rem);
	}

	.active-window {
		min-width: 8rem;
		max-width: 13rem;
		color: #23170f;
		background: linear-gradient(#f5e7cb, #b99d78);
		border-color: #fff3dc #755232 #4b2e19 #e8d3b4;
		box-shadow: var(--shadow-sunken);
		text-shadow: 0 1px 0 rgb(255 255 255 / 0.65);
	}

	.active-window.minimized {
		opacity: 0.72;
	}

	.active-window span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 760px) {
		.window-list {
			display: none;
		}
	}
</style>
