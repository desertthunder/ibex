<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { accountSetup } from '$lib/atproto/setup.svelte';
	import AboutComputer from '$lib/components/AboutComputer.svelte';

	const quickLinks = [
		{
			label: 'Browse public repo',
			description: 'Open Nautilus and inspect public ATProto collections.',
			icon: '/icons/humanity/apps/system-file-manager.svg',
			href: '/browse',
			external: false
		},
		{
			label: 'Getting started',
			description: 'Read the short guide in Document Viewer.',
			icon: '/icons/humanity/mimes/gnome-mime-application-pdf.svg',
			href: '/docs/getting-started',
			external: false
		},
		{
			label: 'Project source',
			description: 'Visit the Tangled repo in a new tab.',
			icon: '/icons/humanity/apps/web-browser.svg',
			href: 'https://tangled.org/desertthunder.dev/ibex',
			external: true
		}
	] as const;

	function openLink(link: (typeof quickLinks)[number]) {
		if (link.external) {
			window.open(link.href, '_blank', 'noopener,noreferrer');
			return;
		}

		void goto(resolve(link.href));
	}
</script>

<section class="welcome-screen" aria-labelledby="welcome-title">
	<div class="welcome-banner">
		<div class="badge-stack" aria-hidden="true">
			<img src="/icons/humanity/devices/computer.svg" alt="" width="72" height="72" />
			<img src="/icons/humanity/apps/internet-feed-reader.svg" alt="" width="38" height="38" />
		</div>
		<div>
			<p class="eyebrow">Browse the ATmosphere</p>
			<h2 id="welcome-title">Welcome to Intrepid Ibex</h2>
			<p>Browse public AT Protocol repositories like it's 2008.</p>
		</div>
	</div>

	<div class="welcome-grid">
		<section class="start-panel" aria-labelledby="start-title">
			<div class="panel-titlebar">
				<img src="/icons/humanity/mimes/text-x-generic.svg" alt="" width="18" height="18" />
				<h3 id="start-title">What would you like to do?</h3>
			</div>

			<div class="repo-strip">
				<span>Browsing public repo</span>
				<strong>{accountSetup.identity ? `@${accountSetup.identity.handle}` : 'not configured'}</strong>
			</div>

			<div class="quick-links">
				{#each quickLinks as link (link.label)}
					<button type="button" class="quick-link" onclick={() => openLink(link)}>
						<img src={link.icon} alt="" width="36" height="36" />
						<span>
							<strong>{link.label}</strong>
							<small>{link.description}</small>
						</span>
					</button>
				{/each}
			</div>
		</section>

		<section class="notes-panel" aria-labelledby="notes-title">
			<div class="panel-titlebar">
				<img src="/icons/humanity/apps/accessories-text-editor.svg" alt="" width="18" height="18" />
				<h3 id="notes-title">Getting started</h3>
			</div>
			<ol>
				<li>Choose a public ATProto repo by handle.</li>
				<li>Open Nautilus to browse collections and records.</li>
				<li>Open records in gedit, then share stable DID-based URLs.</li>
			</ol>
			<p>
				Direct links look like
				<code>/records/:did/:collection/:rkey</code> and reopen the desktop around that record.
			</p>
		</section>
	</div>

	<div class="about-embed">
		<AboutComputer />
	</div>
</section>

<style>
	.welcome-screen {
		display: grid;
		grid-template-rows: auto auto auto;
		gap: var(--space-4);
		height: 100%;
		overflow: auto;
		padding: var(--space-5);
		color: #24170f;
		background:
			radial-gradient(circle at 12% 0%, rgb(233 84 32 / 0.16), transparent 15rem),
			linear-gradient(135deg, #fff6e4 0%, #e2cba8 48%, #b08a5c 100%);
	}

	.welcome-banner,
	.start-panel,
	.notes-panel,
	.about-embed {
		border: 1px solid #8e6d43;
		border-radius: var(--radius-3);
		box-shadow:
			0 1px 0 rgb(255 255 255 / 0.75) inset,
			0 0.65rem 1.4rem rgb(72 42 18 / 0.18);
	}

	.welcome-banner {
		display: grid;
		grid-template-columns: 5.5rem minmax(0, 1fr);
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-5);
		background:
			linear-gradient(90deg, rgb(255 255 255 / 0.68), rgb(255 255 255 / 0.18)), linear-gradient(#fffaf0, #ead5b4);
	}

	.badge-stack {
		position: relative;
		display: grid;
		place-items: center;
		width: 5rem;
		height: 5rem;
		background: linear-gradient(#fdf2d5, #c7955d);
		border: 1px solid #7b5632;
		border-radius: 0.55rem;
		box-shadow: var(--shadow-sunken);
	}

	.badge-stack img:first-child {
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.25));
	}

	.badge-stack img:last-child {
		position: absolute;
		right: -0.45rem;
		bottom: -0.35rem;
		padding: 0.25rem;
		background: #fff6df;
		border: 1px solid #8e6d43;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
	}

	.eyebrow {
		color: var(--orange-700);
		font-size: var(--text-0);
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	h2 {
		margin-top: var(--space-1);
		font-size: clamp(1.6rem, 4vw, 2.5rem);
		line-height: var(--leading-tight);
	}

	.welcome-banner p:last-child {
		max-width: 48rem;
		margin-top: var(--space-2);
		color: var(--text-muted);
		font-size: var(--text-2);
	}

	.welcome-grid {
		display: grid;
		grid-template-columns: minmax(18rem, 1.2fr) minmax(16rem, 0.8fr);
		gap: var(--space-4);
	}

	.start-panel,
	.notes-panel {
		overflow: hidden;
		background: #fff8ed;
	}

	.panel-titlebar {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 2rem;
		padding: var(--space-2) var(--space-3);
		color: white;
		background: linear-gradient(#6e4a2e, #3f2617);
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.65);
	}

	.panel-titlebar h3 {
		font-size: var(--text-1);
	}

	.repo-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		background: linear-gradient(#f5e4c7, #dcc19a);
		border-bottom: 1px solid #b29165;
		font-size: var(--text-1);
	}

	.repo-strip span {
		color: var(--text-muted);
		font-weight: 700;
	}

	.repo-strip strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.quick-links {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-3);
	}

	.quick-link {
		display: grid;
		grid-template-columns: 2.25rem minmax(0, 1fr);
		gap: var(--space-3);
		align-items: center;
		width: 100%;
		padding: var(--space-3);
		text-align: left;
		background: linear-gradient(#fffdf7, #ead7b8);
		border: 1px solid #b29165;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
		cursor: default;
	}

	.quick-link:hover {
		background: linear-gradient(#fff8e8, #dfc294);
		border-color: #835b32;
	}

	.quick-link:active {
		box-shadow: var(--shadow-sunken);
		transform: translateY(1px);
	}

	.quick-link span {
		display: grid;
		gap: 0.1rem;
	}

	.quick-link strong {
		font-size: var(--text-2);
	}

	.quick-link small,
	.notes-panel p,
	.notes-panel li {
		color: var(--text-muted);
		font-size: var(--text-1);
		line-height: var(--leading-roomy);
	}

	.notes-panel ol {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-5) var(--space-2);
		list-style: decimal;
	}

	.notes-panel p {
		padding: 0 var(--space-4) var(--space-4);
	}

	.notes-panel code {
		padding: 0.05rem 0.25rem;
		font-family: var(--font-mono);
		background: #ead7b8;
		border: 1px solid #d2b991;
		border-radius: var(--radius-1);
	}

	.about-embed {
		overflow: visible;
	}

	.about-embed :global(.about-computer) {
		height: auto;
		min-height: 0;
	}

	@media (max-width: 820px) {
		.welcome-screen {
			padding: var(--space-3);
		}

		.welcome-banner,
		.welcome-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
