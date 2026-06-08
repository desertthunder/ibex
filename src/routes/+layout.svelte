<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import AppWindow from '$lib/components/AppWindow.svelte';
	import DesktopIcon from '$lib/components/DesktopIcon.svelte';
	import GnomePanel from '$lib/components/GnomePanel.svelte';
	import '$lib/styles/style.css';

	let { children } = $props();

	const shortcuts = [
		{ label: 'ibex Home', icon: '/icons/humanity/places/user-home.svg', selected: true },
		{ label: 'Collections', icon: '/icons/humanity/places/folder.svg' },
		{ label: 'Computer', icon: '/icons/humanity/devices/computer.svg' },
		{ label: 'Trash', icon: '/icons/humanity/places/user-trash.svg' }
	];
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
			<AppWindow title="AT Protocol Collections - Intrepid Ibex" icon="/icons/humanity/apps/internet-feed-reader.svg">
				{@render children()}
			</AppWindow>
		</div>

		<aside class="sticky-note" aria-label="Design note">
			<h2>Intrepid Ibex</h2>
			<p>Static GNOME recreation: top panel, Humanity icons, tan window chrome, and collection folders.</p>
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
	}
</style>
