<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
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
	import Gedit from '$lib/components/Gedit.svelte';
	import GnomePanel from '$lib/components/GnomePanel.svelte';
	import LockScreen from '$lib/components/LockScreen.svelte';
	import NativeWindow from '$lib/components/NativeWindow.svelte';
	import SetupDialog from '$lib/components/SetupDialog.svelte';
	import '$lib/styles/style.css';

	let { children } = $props();
	let showAboutComputer = $state(false);
	let showStickyNote = $state(true);
	let bootStatus = $state<'booting' | 'ready' | 'error'>('booting');
	let bootStep = $state('Loading database');
	let bootError = $state<string | null>(null);
	let cacheDisabled = $state(false);

	const windowTitle = $derived(
		accountSetup.isConfigured ? 'AT Protocol Collections - Intrepid Ibex' : 'AT Protocol Account Setup'
	);
	const windowIcon = $derived(
		accountSetup.isConfigured ? '/icons/humanity/apps/internet-feed-reader.svg' : '/icons/humanity/places/user-home.svg'
	);
	const mainWindow = $derived(windowManager.getWindow('main'));
	const aboutWindow = $derived(windowManager.getWindow('about-computer'));
	const geditWindow = $derived(windowManager.getWindow('gedit'));
	const documentViewerWindow = $derived(windowManager.getWindow('document-viewer'));

	const shortcuts = $derived([
		{
			label: 'ibex Home',
			icon: '/icons/humanity/places/user-home.svg',
			selected: false,
			onactivate: () => windowManager.restore('main')
		},
		{
			label: 'Collections',
			icon: '/icons/humanity/places/folder.svg',
			onactivate: () => windowManager.restore('main')
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
			selected: documentViewerWindow?.isOpen && !documentViewerWindow.isMinimized,
			onactivate: () => windowManager.open('document-viewer')
		},
		{
			label: 'Trash',
			icon: '/icons/humanity/places/user-trash.svg',
			onactivate: () => window.open('https://tangled.org/desertthunder.dev/ibex', '_blank', 'noopener,noreferrer')
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
	<title>Intrepid Ibex ATProto Browser</title>
	<meta name="description" content="An AT Protocol browser styled after Ubuntu 8.10 and classic GNOME." />
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
					<AppWindow
						windowId="main"
						title={windowTitle}
						icon={windowIcon}
						maximized={mainWindow.isMaximized}
						onfocus={() => windowManager.focus('main')}
						onminimize={() => windowManager.minimize('main')}
						onmaximize={() => windowManager.toggleMaximize('main')}>
						{#if accountSetup.isConfigured}
							{@render children()}
						{:else}
							<SetupDialog />
						{/if}
					</AppWindow>
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
						title="CHANGELOG.md - Document Viewer"
						icon="/icons/humanity/mimes/gnome-mime-application-pdf.svg"
						address="/docs/changelog"
						maximized={documentViewerWindow.isMaximized}
						onfocus={() => windowManager.focus('document-viewer')}
						onminimize={() => windowManager.minimize('document-viewer')}
						onmaximize={() => windowManager.toggleMaximize('document-viewer')}
						onclose={() => windowManager.close('document-viewer')}>
						<DocumentViewer slug="changelog" />
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

			{#if showStickyNote}
				<aside class="sticky-note" aria-label="Design note">
					<button type="button" aria-label="Close note" onclick={() => (showStickyNote = false)}>×</button>
					<h2>Intrepid Ibex</h2>
					<p>This app is a recreation of the spirit of Ubuntu 8.10</p>
				</aside>
			{/if}
		</main>

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
	.gedit-window.maximized {
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
	.gedit-window {
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

	.about-window :global(.app-window),
	.document-viewer-window :global(.app-window),
	.gedit-window :global(.app-window) {
		height: 100%;
	}

	.sticky-note {
		position: relative;
		align-self: end;
		width: min(18rem, 100%);
		margin-bottom: var(--space-8);
		padding: var(--space-4);
		transform: rotate(1.2deg);
		color: #3a250e;
		background: linear-gradient(135deg, #fff1a9, #e9bf51);
		border: 1px solid #946b19;
		border-radius: var(--radius-2);
		box-shadow:
			0 12px 24px rgb(0 0 0 / 0.25),
			0 1px 0 rgb(255 255 255 / 0.72) inset;
	}

	.sticky-note button {
		position: absolute;
		top: var(--space-1);
		right: var(--space-1);
		width: 1.25rem;
		height: 1.25rem;
		color: #6b4a12;
		font-weight: 700;
		cursor: default;
	}

	.sticky-note h2 {
		font-size: var(--text-4);
		line-height: var(--leading-tight);
	}

	.sticky-note p {
		margin-top: var(--space-2);
		font-size: var(--text-2);
	}

	@media (max-width: 1000px) {
		.desktop-stage {
			grid-template-columns: 6.5rem minmax(0, 1fr);
			padding: var(--space-3);
		}

		.about-window,
		.gedit-window {
			left: auto;
			right: var(--space-3);
		}

		.sticky-note {
			display: none;
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
		.gedit-window {
			top: var(--space-3);
			right: var(--space-3);
			left: var(--space-3);
			width: auto;
			height: min(28rem, calc(100vh - 6rem));
		}
	}
</style>
