<script lang="ts">
	const launchers = [
		{ label: 'Browser', icon: '/icons/humanity/apps/web-browser.svg' },
		{ label: 'Mail', icon: '/icons/humanity/apps/evolution-mail.svg' },
		{ label: 'Terminal', icon: '/icons/humanity/apps/utilities-terminal.svg' }
	];
</script>

<header class="gnome-panel" aria-label="GNOME top panel">
	<nav class="panel-menus" aria-label="System menus">
		<button class="applications-menu" type="button">
			<img src="/icons/humanity/apps/system-file-manager.svg" alt="" width="20" height="20" />
			<span>Applications</span>
		</button>
		<button type="button">Places</button>
		<button type="button">System</button>
	</nav>

	<div class="panel-launchers" aria-label="Launchers">
		{#each launchers as launcher (launcher.label)}
			<button type="button" title={launcher.label}>
				<img src={launcher.icon} alt="" width="22" height="22" />
			</button>
		{/each}
	</div>

	<div class="panel-spacer" aria-hidden="true"></div>

	<section class="window-list" aria-label="Open windows">
		<button class="active-window" type="button">
			<img src="/icons/humanity/apps/internet-feed-reader.svg" alt="" width="16" height="16" />
			<span>AT Protocol Collections</span>
		</button>
	</section>

	<aside class="panel-tray" aria-label="Status tray">
		<img src="/icons/humanity/status/network-wireless-encrypted.svg" alt="Network connected" width="16" height="16" />
		<img src="/icons/humanity/status/audio-volume-medium.svg" alt="Volume" width="16" height="16" />
		<time datetime="2008-10-30T10:10">Thu Oct 30, 10:10 AM</time>
	</aside>
</header>

<style>
	.gnome-panel {
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

	.panel-menus,
	.panel-launchers,
	.panel-tray,
	.window-list {
		display: flex;
		align-items: center;
	}

	.panel-menus {
		gap: 1px;
	}

	.panel-menus button,
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

	.panel-menus button:hover,
	.panel-launchers button:hover {
		background: rgb(255 238 203 / 0.16);
		border-color: rgb(255 255 255 / 0.18) rgb(0 0 0 / 0.35) rgb(0 0 0 / 0.45) rgb(255 255 255 / 0.16);
	}

	.applications-menu {
		font-weight: 650;
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
		min-width: min(28vw, 19rem);
	}

	.active-window {
		width: 100%;
		color: #23170f;
		background: linear-gradient(#f5e7cb, #b99d78);
		border-color: #fff3dc #755232 #4b2e19 #e8d3b4;
		box-shadow: var(--shadow-sunken);
		text-shadow: 0 1px 0 rgb(255 255 255 / 0.65);
	}

	.active-window span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.panel-tray {
		gap: var(--space-2);
	}

	.panel-tray time {
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 760px) {
		.panel-menus button:not(.applications-menu),
		.window-list {
			display: none;
		}
	}
</style>
