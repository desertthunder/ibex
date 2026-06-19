<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { repoSession } from '$lib/atproto/session.svelte';
	import { accountSetup } from '$lib/atproto/setup.svelte';
	import { repoBrowser } from '$lib/atproto/repo.svelte';
	import { blobsPath, collectionPath, identityPath } from '$lib/atproto/routes';
	import { REPO_URL } from '$lib/constants';
	import { desktopLaunchers, type DesktopLauncherId } from '$lib/launcher';
	import { desktopSession } from '$lib/desktop-session.svelte';
	import { windowManager } from '$lib/window-manager.svelte';
	import GnomeTray from '$lib/components/GnomeTray.svelte';

	type RepoPathname = `/repos/${string}`;
	type AppPathname = '/' | '/browse' | '/docs' | '/lexicons' | RepoPathname;
	const navigateTo = goto as (url: string, options?: Parameters<typeof goto>[1]) => ReturnType<typeof goto>;

	function changeAccount() {
		windowManager.close('gedit');
		repoBrowser.reset();
		repoSession.clear();
		accountSetup.reset();
		void goto(resolve('/browse'));
	}

	function openCollection(collectionName: string) {
		const identity = repoSession.identity ?? accountSetup.identity;
		if (!identity) return;

		void navigateTo(resolve(collectionPath({ did: identity.did, collection: collectionName }) as RepoPathname));
	}

	function openPath(path: AppPathname) {
		void navigateTo(resolve(path), { keepFocus: true, noScroll: true });
	}

	function openIdentityInspector() {
		const identity = repoSession.identity ?? accountSetup.identity;
		if (!identity) {
			openPath('/browse');
			return;
		}

		openPath(identityPath(identity.did) as RepoPathname);
	}

	function openImageViewer() {
		const identity = repoSession.identity ?? accountSetup.identity;
		if (!identity) {
			openPath('/browse');
			return;
		}

		openPath(blobsPath(identity.did) as RepoPathname);
	}

	function openAboutComputer() {
		windowManager.open('about-computer');
	}

	function openLauncher(id: DesktopLauncherId) {
		if (id === 'home') {
			openPath('/');
			return;
		}

		if (id === 'collections') {
			openPath('/browse');
			return;
		}

		if (id === 'identity-inspector') {
			openIdentityInspector();
			return;
		}

		if (id === 'image-viewer') {
			openImageViewer();
			return;
		}

		if (id === 'web-browser') {
			openPath('/lexicons');
			return;
		}

		if (id === 'about-computer') {
			openAboutComputer();
			return;
		}

		if (id === 'document-viewer') {
			openPath('/docs');
			return;
		}

		window.open(REPO_URL, '_blank', 'noopener,noreferrer');
	}
</script>

<nav class="panel-menus" aria-label="System menus">
	<details class="panel-menu applications-panel">
		<summary class="applications-menu">
			<img src="/icons/humanity/apps/system-file-manager.svg" alt="" width="20" height="20" />
			<span>Applications</span>
		</summary>
		<div class="menu-popover applications-popover">
			<p class="menu-heading">Applications</p>
			{#each desktopLaunchers as launcher (launcher.id)}
				<button type="button" onclick={() => openLauncher(launcher.id)}>
					<img src={launcher.icon} alt="" width="16" height="16" />
					<span>{launcher.label}</span>
				</button>
			{/each}
		</div>
	</details>

	<details class="panel-menu">
		<summary>Places</summary>
		<div class="menu-popover places-popover">
			<p class="menu-heading">Collections</p>
			{#if repoBrowser.collections.length > 0}
				{#each repoBrowser.collections.slice(0, 10) as collection (collection.name)}
					<button type="button" onclick={() => openCollection(collection.name)}>
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
			{#if repoSession.identity}
				<p class="menu-heading">Viewing @{repoSession.identity.handle}</p>
			{:else if accountSetup.identity}
				<p class="menu-heading">Default @{accountSetup.identity.handle}</p>
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

<GnomeTray />

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

	.system-popover,
	.applications-popover {
		min-width: 13rem;
	}

	.applications-menu {
		font-weight: 650;
	}

	@media (max-width: 760px) {
		.panel-menus .panel-menu:not(.applications-panel) {
			display: none;
		}
	}
</style>
