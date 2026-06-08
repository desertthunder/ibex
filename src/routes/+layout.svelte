<script lang="ts">
	import { onMount } from 'svelte';
	import { accountSetup } from '$lib/atproto/setup.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import AboutComputer from '$lib/components/AboutComputer.svelte';
	import AppWindow from '$lib/components/AppWindow.svelte';
	import DesktopIcon from '$lib/components/DesktopIcon.svelte';
	import GnomePanel from '$lib/components/GnomePanel.svelte';
	import SetupDialog from '$lib/components/SetupDialog.svelte';
	import '$lib/styles/style.css';

	let { children } = $props();
	let showAboutComputer = $state(false);

	const shortcuts = $derived([
		{ label: 'ibex Home', icon: '/icons/humanity/places/user-home.svg', selected: true },
		{ label: 'Collections', icon: '/icons/humanity/places/folder.svg' },
		{
			label: 'Computer',
			icon: '/icons/humanity/devices/computer.svg',
			selected: showAboutComputer,
			onactivate: () => (showAboutComputer = true)
		},
		{ label: 'Trash', icon: '/icons/humanity/places/user-trash.svg' }
	]);

	const windowTitle = $derived(
		accountSetup.isConfigured ? 'AT Protocol Collections - Intrepid Ibex' : 'AT Protocol Account Setup'
	);
	const windowIcon = $derived(
		accountSetup.isConfigured ? '/icons/humanity/apps/internet-feed-reader.svg' : '/icons/humanity/places/user-home.svg'
	);

	onMount(() => {
		accountSetup.load();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Intrepid Ibex ATProto Browser</title>
	<meta name="description" content="An AT Protocol browser styled after Ubuntu 8.10 and classic GNOME." />
</svelte:head>

<div class="gnome-desktop">
	<GnomePanel />

	<main class="desktop-stage" aria-label="Ubuntu 8.10 inspired AT Protocol browser desktop">
		<section class="desktop-icons" aria-label="Desktop shortcuts">
			{#each shortcuts as shortcut (shortcut.label)}
				<DesktopIcon {...shortcut} />
			{/each}
		</section>

		<div class="primary-window">
			<AppWindow title={windowTitle} icon={windowIcon}>
				{#if accountSetup.isConfigured}
					{@render children()}
				{:else}
					<SetupDialog />
				{/if}
			</AppWindow>
		</div>

		{#if showAboutComputer}
			<div class="about-window">
				<AppWindow
					title="About This Computer"
					icon="/icons/humanity/devices/computer.svg"
					showMenubar={false}
					showToolbar={false}
					onclose={() => (showAboutComputer = false)}>
					<AboutComputer />
				</AppWindow>
			</div>
		{/if}

		<!-- TODO: make this closeable -->
		<aside class="sticky-note" aria-label="Design note">
			<h2>Intrepid Ibex</h2>
			<p>This app is a recreation of the spirit of Ubuntu 8.10</p>
		</aside>
	</main>
</div>

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
		align-self: center;
		height: min(42rem, calc(100vh - 6.5rem));
		min-height: 28rem;
	}

	.primary-window :global(.app-window) {
		height: 100%;
	}

	.about-window {
		position: absolute;
		top: min(8rem, 16vh);
		left: min(46rem, 52vw);
		z-index: 3;
		width: min(34rem, calc(100vw - 2rem));
		height: min(28rem, calc(100vh - 5rem));
	}

	.about-window :global(.app-window) {
		height: 100%;
	}

	.sticky-note {
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

		.about-window {
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

		.about-window {
			top: var(--space-3);
			right: var(--space-3);
			left: var(--space-3);
			width: auto;
			height: min(28rem, calc(100vh - 6rem));
		}
	}
</style>
