<script lang="ts">
	import { goto } from '$app/navigation';
	import { accountSetup } from '$lib/atproto/setup.svelte';
	import { repoBrowser } from '$lib/atproto/repo.svelte';
	import { desktopSession } from '$lib/desktop-session.svelte';
	import { windowManager } from '$lib/window-manager.svelte';
	import GnomeTry from '$lib/components/GnomeTry.svelte';

	function changeAccount() {
		windowManager.close('gedit');
		repoBrowser.reset();
		accountSetup.reset();
		void goto('/browse');
	}

	function openCollection(collectionName: string) {
		if (!accountSetup.identity) return;

		void goto('/browse');
		repoBrowser.selectCollection(accountSetup.identity, collectionName);
	}
</script>

<nav class="panel-menus" aria-label="System menus">
	<button class="applications-menu" type="button" onclick={() => goto('/')}>
		<img src="/icons/humanity/apps/system-file-manager.svg" alt="" width="20" height="20" />
		<span>Applications</span>
	</button>

	<details class="panel-menu">
		<summary>Places</summary>
		<div class="menu-popover places-popover">
			<p class="menu-heading">Collections</p>
			{#if repoBrowser.collections.length > 0}
				{#each repoBrowser.collections.slice(0, 10) as collection (collection.name)}
					<button
						type="button"
						onclick={() => openCollection(collection.name)}>
						<img src={collection.icon} alt="" width="16" height="16" />
						<span>{collection.name}</span>
					</button>
				{/each}
			{:else}
				<span class="menu-empty">Collections appear here after setup.</span>
			{/if}
		</div>
	</details>

	<details class="panel-menu">
		<summary>System</summary>
		<div class="menu-popover system-popover">
			{#if accountSetup.identity}
				<p class="menu-heading">Browsing @{accountSetup.identity.handle}</p>
			{/if}
			<button type="button" onclick={() => desktopSession.lock()}>
				<img src="/icons/humanity/status/network-wireless-encrypted.svg" alt="" width="16" height="16" />
				<span>Lock Screen</span>
			</button>
			<button type="button" onclick={changeAccount}>
				<img src="/icons/humanity/places/user-home.svg" alt="" width="16" height="16" />
				<span>Change Repo…</span>
			</button>
		</div>
	</details>
</nav>

<GnomeTry />

<style>
	.panel-menus {
		display: flex;
		align-items: center;
		gap: 1px;
	}

	.panel-menus button,
	.panel-menus summary {
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
	.panel-menus summary:hover,
	.panel-menu[open] summary {
		background: rgb(255 238 203 / 0.16);
		border-color: rgb(255 255 255 / 0.18) rgb(0 0 0 / 0.35) rgb(0 0 0 / 0.45) rgb(255 255 255 / 0.16);
	}

	.panel-menu {
		position: relative;
	}

	.panel-menu summary {
		list-style: none;
	}

	.panel-menu summary::-webkit-details-marker {
		display: none;
	}

	.menu-popover {
		position: absolute;
		top: calc(100% + 3px);
		left: 0;
		display: grid;
		gap: 1px;
		min-width: 17rem;
		padding: var(--space-1);
		color: var(--text);
		background: linear-gradient(#f4e6cc, #cfb58c);
		border: 1px solid #4d2c17;
		z-index: 1;
		box-shadow: 0 10px 22px rgb(0 0 0 / 0.42);
		text-shadow: none;
	}

	.menu-popover button {
		justify-content: flex-start;
		width: 100%;
		height: 1.6rem;
		color: var(--text);
	}

	.menu-popover button:hover {
		color: white;
		background: var(--selection);
		border-color: transparent;
	}

	.menu-popover span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.menu-heading,
	.menu-empty {
		padding: var(--space-1) var(--space-2);
		color: var(--text-muted);
		font-size: var(--text-0);
		font-weight: 700;
	}

	.system-popover {
		min-width: 13rem;
	}

	.applications-menu {
		font-weight: 650;
	}

	@media (max-width: 760px) {
		.panel-menus .panel-menu {
			display: none;
		}
	}
</style>
