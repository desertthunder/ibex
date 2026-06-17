<!-- FIXME: this is becoming a "god" component, not an orchestrator
            like it should -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { repoBlobs } from '$lib/atproto/blobs.svelte';
	import { repoBrowser } from '$lib/atproto/repo.svelte';
	import { accountSetup } from '$lib/atproto/setup.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { desktopSession } from '$lib/desktop-session.svelte';
	import { errorMessage } from '$lib/utils/errors';
	import { windowManager } from '$lib/window-manager.svelte';
	import AboutComputer from '$lib/components/AboutComputer.svelte';
	import AppWindow from '$lib/components/AppWindow.svelte';
	import BootSplash from '$lib/components/BootSplash.svelte';
	import DesktopIcon from '$lib/components/DesktopIcon.svelte';
	import DocumentViewer from '$lib/components/DocumentViewer.svelte';
	import EyeOfGnome from '$lib/components/EyeOfGnome.svelte';
	import Gedit from '$lib/components/Gedit.svelte';
	import GnomePanel from '$lib/components/GnomePanel.svelte';
	import IdentityInspector from '$lib/components/IdentityInspector.svelte';
	import LockScreen from '$lib/components/LockScreen.svelte';
	import NativeWindow from '$lib/components/NativeWindow.svelte';
	import NotImplementedDialog from '$lib/components/NotImplementedDialog.svelte';
	import SetupDialog from '$lib/components/SetupDialog.svelte';
	import StickyNote from '$lib/components/StickyNote.svelte';
	import '$lib/styles/style.css';

	let { children } = $props();
	let showAboutComputer = $state(false);
	let showStickyNote = $state(true);
	let bootStatus = $state<'booting' | 'ready' | 'error'>('booting');
	let bootStep = $state('Loading database');
	let bootError = $state<string | null>(null);
	let cacheDisabled = $state(false);
	let handledRepoRoute = $state<string | null>(null);

	const routeRequiresSetup = $derived(page.route.id === '/browse' && !accountSetup.isConfigured);
	const routeUsesNativeWindow = $derived(page.route.id === '/' || page.route.id?.startsWith('/docs'));
	const windowTitle = $derived.by(() => {
		if (routeRequiresSetup) return 'AT Protocol Account Setup';
		if (page.route.id === '/') return 'Welcome to Intrepid Ibex';
		// TODO: this should be slug aware
		if (page.route.id?.startsWith('/docs')) return 'Document Viewer';
		return 'AT Protocol Collections - Intrepid Ibex';
	});

	const windowIcon = $derived.by(() => {
		if (routeRequiresSetup) return '/icons/humanity/places/user-home.svg';
		if (page.route.id === '/') return '/icons/humanity/devices/computer.svg';
		if (page.route.id?.startsWith('/docs')) return '/icons/humanity/mimes/gnome-mime-application-pdf.svg';
		return '/icons/humanity/apps/internet-feed-reader.svg';
	});

	const mainWindow = $derived(windowManager.getWindow('main'));
	const aboutWindow = $derived(windowManager.getWindow('about-computer'));
	const geditWindow = $derived(windowManager.getWindow('gedit'));
	const documentViewerWindow = $derived(windowManager.getWindow('document-viewer'));
	const identityInspectorWindow = $derived(windowManager.getWindow('identity-inspector'));
	const eogWindow = $derived(windowManager.getWindow('eog'));
	const shortcuts = $derived([
		{
			label: 'ibex Home',
			icon: '/icons/humanity/places/user-home.svg',
			selected: page.route.id === '/',
			onactivate: () => {
				windowManager.restore('main');
				void goto(resolve('/'));
			}
		},
		{
			label: 'Collections',
			icon: '/icons/humanity/places/folder.svg',
			selected: page.route.id === '/browse' || page.route.id?.startsWith('/repos'),
			onactivate: () => {
				windowManager.restore('main');
				void goto(resolve('/browse'));
			}
		},
		{
			label: 'Identity Inspector',
			icon: '/icons/humanity/apps/identity-inspector.svg',
			selected: identityInspectorWindow?.isOpen && !identityInspectorWindow.isMinimized,
			onactivate: () => {
				if (accountSetup.identity) {
					void goto(resolve(`/repos/${accountSetup.identity.did}/identity`), { keepFocus: true, noScroll: true });
					return;
				}

				windowManager.restore('main');
				void goto(resolve('/browse'));
			}
		},
		{
			label: 'Image Viewer',
			icon: '/icons/humanity/apps/eog.svg',
			selected: eogWindow?.isOpen && !eogWindow.isMinimized,
			onactivate: () => {
				if (accountSetup.identity) {
					void goto(resolve(`/repos/${accountSetup.identity.did}/blobs`), { keepFocus: true, noScroll: true });
					return;
				}

				windowManager.restore('main');
				void goto(resolve('/browse'));
			}
		},
		{
			label: 'Computer',
			icon: '/icons/humanity/devices/computer.svg',
			selected: showAboutComputer,
			onactivate: () => {
				showAboutComputer = true;
				windowManager.open('about-computer');
			}
		},
		{
			label: 'Document Viewer',
			icon: '/icons/humanity/mimes/gnome-mime-application-pdf.svg',
			selected:
				page.route.id?.startsWith('/docs') || (documentViewerWindow?.isOpen && !documentViewerWindow.isMinimized),
			onactivate: () => {
				windowManager.restore('main');
				void goto(resolve('/docs'));
			}
		},
		{
			label: 'Trash',
			icon: '/icons/humanity/places/user-trash.svg',
			onactivate: () => window.open('https://github.com/desertthunder.dev/ibex', '_blank', 'noopener,noreferrer')
		}
	]);

	$effect(() => {
		windowManager.setTitle('main', windowTitle, windowIcon);
		showAboutComputer = windowManager.getWindow('about-computer')?.isOpen ?? false;

		if (repoBrowser.selectedRecord) {
			windowManager.setTitle(
				'gedit',
				`${repoBrowser.selectedRecord.rkey}.json - gedit`,
				repoBrowser.selectedRecord.icon
			);
		}

		if (repoBlobs.selectedCid) {
			windowManager.setTitle('eog', `${repoBlobs.selectedCid} - Eye of GNOME`, '/icons/humanity/apps/eog.svg');
		}
	});

	$effect(() => {
		const route = repoRouteFromParams();
		if (bootStatus !== 'ready' || !route) return;

		const routeKey = [route.did, route.app, route.collection, route.rkey, route.cid].filter(Boolean).join('/');
		if (handledRepoRoute === routeKey) return;

		handledRepoRoute = routeKey;
		void openRepoRoute(route);
	});

	onMount(() => {
		void bootDesktop();
	});

	async function bootDesktop() {
		const bootStartedAt = performance.now();
		bootStatus = 'booting';
		bootError = null;

		try {
			const { getDatabase, getMigrationStatus, runMigrations } = await import('$lib/db');

			bootStep = 'Loading database';
			const db = await getDatabase();
			bootStep = 'Checking migrations';
			const migrationStatus = await getMigrationStatus(db);

			if (migrationStatus.pending.length > 0) {
				bootStep = 'Applying migrations';
				await runMigrations(db);
				bootStep = 'Starting desktop';
				await waitForMinimumBootTime(bootStartedAt);
			} else {
				bootStep = 'Starting desktop';
			}

			accountSetup.load();
			bootStatus = 'ready';
		} catch (error) {
			bootError = errorMessage(error, 'Could not start the local cache.');
			bootStatus = 'error';
		}
	}

	async function resetCacheAndRetry() {
		bootStatus = 'booting';
		bootStep = 'Resetting local cache';
		bootError = null;

		try {
			const { resetLocalDatabase } = await import('$lib/db');
			await resetLocalDatabase();
			await bootDesktop();
		} catch (error) {
			bootError = errorMessage(error, 'Could not reset the local cache.');
			bootStatus = 'error';
		}
	}

	function continueWithoutCache() {
		cacheDisabled = true;
		bootStatus = 'ready';
		accountSetup.load();
	}

	async function openRepoRoute(route: { did: string; app?: string; collection?: string; rkey?: string; cid?: string }) {
		try {
			const { hydratePublicIdentity } = await import('$lib/atproto/identity');
			const identity = await hydratePublicIdentity(route.did);

			accountSetup.save(identity);
			windowManager.restore('main');

			if (route.app === 'identity') {
				await repoBrowser.load(identity);
				windowManager.setTitle('identity-inspector', `${identity.handle} - Identity Inspector`);
				windowManager.open('identity-inspector');
				return;
			}

			if (route.app === 'blobs') {
				await repoBrowser.load(identity);
				await repoBlobs.load(identity, route.cid);
				windowManager.setTitle('eog', route.cid ? `${route.cid} - Eye of GNOME` : `${identity.handle} - Eye of GNOME`);
				windowManager.open('eog');
				return;
			}

			if (route.collection && route.rkey) {
				await repoBrowser.openRecordRoute(identity, route.collection, route.rkey);
				if (repoBrowser.selectedRecord) {
					windowManager.open('gedit');
				}
				return;
			}

			await repoBrowser.load(identity);

			if (route.collection) {
				await repoBrowser.selectCollection(identity, route.collection);
			}
		} catch (unknownError) {
			repoBrowser.error = errorMessage(unknownError, 'Could not open that repository route.');
		}
	}

	function repoRouteFromParams() {
		if (!page.route.id?.startsWith('/repos/[did]')) return null;

		const { did, collection, rkey } = page.params;

		if (!did) return null;
		return {
			did,
			app:
				page.route.id === '/repos/[did]/identity'
					? 'identity'
					: page.route.id?.startsWith('/repos/[did]/blobs')
						? 'blobs'
						: undefined,
			collection,
			rkey,
			cid: page.params.cid
		};
	}

	async function waitForMinimumBootTime(startedAt: number) {
		const minimumBootTimeMs = 2500;
		const remaining = minimumBootTimeMs - (performance.now() - startedAt);

		if (remaining > 0) {
			await new Promise((resolve) => setTimeout(resolve, remaining));
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if bootStatus !== 'ready'}
	<BootSplash
		step={bootStep}
		error={bootError}
		canReset={dev}
		onretry={bootDesktop}
		onreset={resetCacheAndRetry}
		oncontinue={continueWithoutCache} />
{:else}
	<div class="gnome-desktop" data-cache-disabled={cacheDisabled}>
		<GnomePanel />

		<main class="desktop-stage" aria-label="Ubuntu 8.10 inspired AT Protocol browser desktop">
			<section class="desktop-icons" aria-label="Desktop shortcuts">
				{#each shortcuts as shortcut (shortcut.label)}
					<DesktopIcon {...shortcut} />
				{/each}
			</section>

			{#if mainWindow?.isOpen && !mainWindow.isMinimized}
				<div class="primary-window" class:maximized={mainWindow.isMaximized} style:z-index={mainWindow.zIndex}>
					{#if routeUsesNativeWindow}
						<NativeWindow
							windowId="main"
							title={windowTitle}
							icon={windowIcon}
							maximized={mainWindow.isMaximized}
							onfocus={() => windowManager.focus('main')}
							onminimize={() => windowManager.minimize('main')}
							onmaximize={() => windowManager.toggleMaximize('main')}>
							{@render children()}
						</NativeWindow>
					{:else}
						<AppWindow
							windowId="main"
							title={windowTitle}
							icon={windowIcon}
							maximized={mainWindow.isMaximized}
							onfocus={() => windowManager.focus('main')}
							onminimize={() => windowManager.minimize('main')}
							onmaximize={() => windowManager.toggleMaximize('main')}>
							{#if routeRequiresSetup}
								<SetupDialog />
							{:else}
								{@render children()}
							{/if}
						</AppWindow>
					{/if}
				</div>
			{/if}

			{#if showAboutComputer && aboutWindow?.isOpen && !aboutWindow.isMinimized}
				<div class="about-window" class:maximized={aboutWindow.isMaximized} style:z-index={aboutWindow.zIndex}>
					<AppWindow
						windowId="about-computer"
						title="About This Computer"
						icon="/icons/humanity/devices/computer.svg"
						showMenubar={false}
						showToolbar={false}
						maximized={aboutWindow.isMaximized}
						onfocus={() => windowManager.focus('about-computer')}
						onminimize={() => windowManager.minimize('about-computer')}
						onmaximize={() => windowManager.toggleMaximize('about-computer')}
						onclose={() => windowManager.close('about-computer')}>
						<AboutComputer />
					</AppWindow>
				</div>
			{/if}

			{#if documentViewerWindow?.isOpen && !documentViewerWindow.isMinimized}
				<div
					class="document-viewer-window"
					class:maximized={documentViewerWindow.isMaximized}
					style:z-index={documentViewerWindow.zIndex}>
					<AppWindow
						windowId="document-viewer"
						title="Getting Started - Document Viewer"
						icon="/icons/humanity/mimes/gnome-mime-application-pdf.svg"
						address="/docs/getting-started"
						maximized={documentViewerWindow.isMaximized}
						onfocus={() => windowManager.focus('document-viewer')}
						onminimize={() => windowManager.minimize('document-viewer')}
						onmaximize={() => windowManager.toggleMaximize('document-viewer')}
						onclose={() => windowManager.close('document-viewer')}>
						<DocumentViewer slug="getting-started" />
					</AppWindow>
				</div>
			{/if}

			{#if repoBrowser.selectedRecord && geditWindow?.isOpen && !geditWindow.isMinimized}
				<div class="gedit-window" class:maximized={geditWindow.isMaximized} style:z-index={geditWindow.zIndex}>
					<NativeWindow
						windowId="gedit"
						title={`${repoBrowser.selectedRecord.rkey}.json - gedit`}
						icon={repoBrowser.selectedRecord.icon}
						address={repoBrowser.selectedRecord.uri}
						maximized={geditWindow.isMaximized}
						onfocus={() => windowManager.focus('gedit')}
						onminimize={() => windowManager.minimize('gedit')}
						onmaximize={() => windowManager.toggleMaximize('gedit')}
						onclose={() => windowManager.close('gedit')}>
						<Gedit record={repoBrowser.selectedRecord} />
					</NativeWindow>
				</div>
			{/if}

			{#if identityInspectorWindow?.isOpen && !identityInspectorWindow.isMinimized}
				<div
					class="identity-inspector-window"
					class:maximized={identityInspectorWindow.isMaximized}
					style:z-index={identityInspectorWindow.zIndex}>
					<AppWindow
						windowId="identity-inspector"
						title={identityInspectorWindow.title}
						icon="/icons/humanity/apps/identity-inspector.svg"
						address={accountSetup.identity ? `/repos/${accountSetup.identity.did}/identity` : undefined}
						maximized={identityInspectorWindow.isMaximized}
						onfocus={() => windowManager.focus('identity-inspector')}
						onminimize={() => windowManager.minimize('identity-inspector')}
						onmaximize={() => windowManager.toggleMaximize('identity-inspector')}
						onclose={() => windowManager.close('identity-inspector')}>
						<IdentityInspector />
					</AppWindow>
				</div>
			{/if}

			{#if eogWindow?.isOpen && !eogWindow.isMinimized}
				<div class="eog-window" class:maximized={eogWindow.isMaximized} style:z-index={eogWindow.zIndex}>
					<AppWindow
						windowId="eog"
						title={eogWindow.title}
						icon="/icons/humanity/apps/eog.svg"
						address={accountSetup.identity ? `/repos/${accountSetup.identity.did}/blobs` : undefined}
						showMenubar={false}
						showToolbar={false}
						maximized={eogWindow.isMaximized}
						onfocus={() => windowManager.focus('eog')}
						onminimize={() => windowManager.minimize('eog')}
						onmaximize={() => windowManager.toggleMaximize('eog')}
						onclose={() => windowManager.close('eog')}>
						<EyeOfGnome />
					</AppWindow>
				</div>
			{/if}

			{#if showStickyNote}
				<StickyNote onclose={() => (showStickyNote = false)} />
			{/if}
		</main>

		<NotImplementedDialog />

		{#if desktopSession.isLocked}
			<LockScreen identity={accountSetup.identity} onunlock={() => desktopSession.unlock()} />
		{/if}
	</div>
{/if}

<style>
	.gnome-desktop {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		min-height: 100vh;
		background:
			radial-gradient(circle at 20% 18%, rgb(255 191 92 / 0.22), transparent 22rem),
			radial-gradient(circle at 84% 75%, rgb(78 36 18 / 0.56), transparent 26rem),
			linear-gradient(rgb(45 23 14 / 0.08), rgb(45 23 14 / 0.12)),
			url('/ubuntu_810_wallpaper.jpg') center / cover;
	}

	.desktop-stage {
		position: relative;
		display: grid;
		grid-template-columns: 7rem minmax(20rem, 62rem) minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		gap: var(--space-5);
		min-height: 0;
		padding: var(--space-5);
	}

	.desktop-icons {
		display: grid;
		align-content: start;
		justify-items: center;
		gap: var(--space-4);
	}

	.primary-window {
		position: relative;
		align-self: center;
		height: min(42rem, calc(100vh - 6.5rem));
		min-height: 28rem;
	}

	.primary-window :global(.app-window) {
		height: 100%;
	}

	.primary-window.maximized,
	.about-window.maximized,
	.document-viewer-window.maximized,
	.gedit-window.maximized,
	.identity-inspector-window.maximized,
	.eog-window.maximized {
		position: fixed;
		top: 1.75rem;
		right: 0;
		bottom: 0;
		left: 0;
		width: auto;
		height: auto;
		min-height: 0;
	}

	.about-window,
	.document-viewer-window,
	.gedit-window,
	.identity-inspector-window,
	.eog-window {
		position: absolute;
		z-index: 3;
	}

	.about-window {
		top: min(8rem, 16vh);
		left: min(46rem, 52vw);
		width: min(34rem, calc(100vw - 2rem));
		height: min(28rem, calc(100vh - 5rem));
	}

	.document-viewer-window {
		top: min(5rem, 10vh);
		left: min(16rem, 18vw);
		width: min(48rem, calc(100vw - 2rem));
		height: min(38rem, calc(100vh - 5rem));
	}

	.gedit-window {
		top: min(6rem, 12vh);
		left: min(20rem, 24vw);
		width: min(44rem, calc(100vw - 2rem));
		height: min(34rem, calc(100vh - 5rem));
	}

	.identity-inspector-window {
		top: min(4.75rem, 9vh);
		left: min(13rem, 16vw);
		width: min(56rem, calc(100vw - 2rem));
		height: min(39rem, calc(100vh - 5rem));
	}

	.eog-window {
		top: min(5.5rem, 10vh);
		left: min(18rem, 22vw);
		width: min(54rem, calc(100vw - 2rem));
		height: min(38rem, calc(100vh - 5rem));
	}

	.about-window :global(.app-window),
	.document-viewer-window :global(.app-window),
	.gedit-window :global(.app-window),
	.identity-inspector-window :global(.app-window),
	.eog-window :global(.app-window) {
		height: 100%;
	}

	@media (max-width: 1000px) {
		.desktop-stage {
			grid-template-columns: 6.5rem minmax(0, 1fr);
			padding: var(--space-3);
		}

		.about-window,
		.gedit-window,
		.identity-inspector-window,
		.eog-window {
			left: auto;
			right: var(--space-3);
		}
	}

	@media (max-width: 640px) {
		.desktop-stage {
			grid-template-columns: 1fr;
		}

		.desktop-icons {
			display: none;
		}

		.primary-window {
			height: calc(100vh - 4.25rem);
			min-height: 0;
		}

		.about-window,
		.gedit-window,
		.identity-inspector-window,
		.eog-window {
			top: var(--space-3);
			right: var(--space-3);
			left: var(--space-3);
			width: auto;
			height: min(28rem, calc(100vh - 6rem));
		}
	}
</style>
