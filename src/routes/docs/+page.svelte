<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const documents = [
		{
			title: 'Getting Started',
			slug: 'getting-started',
			description: 'A short guide to browsing public ATProto repos and sharing records.',
			icon: '/icons/humanity/mimes/gnome-mime-application-pdf.svg'
		},
		{
			title: 'Atmosphere',
			slug: 'atmosphere',
			description: 'A short note about portable accounts and the open social web.',
			icon: '/icons/humanity/apps/web-browser.svg'
		},
		{
			title: 'Changelog',
			slug: 'changelog',
			description: 'Release notes and recent project changes.',
			icon: '/icons/humanity/mimes/text-x-generic.svg'
		}
	];
</script>

<svelte:head>
	<title>Documents - Intrepid Ibex</title>
</svelte:head>

<section class="docs-index" aria-labelledby="docs-title">
	<header class="index-header">
		<img src="/icons/humanity/mimes/gnome-mime-application-pdf.svg" alt="" width="56" height="56" />
		<div>
			<p class="eyebrow">Document Viewer</p>
			<h2 id="docs-title">Documents</h2>
			<p>Open local project notes and help files.</p>
		</div>
	</header>

	<div class="document-list" aria-label="Available documents">
		{#each documents as document (document.slug)}
			<button type="button" class="document-row" onclick={() => goto(resolve('/docs/[slug]', { slug: document.slug }))}>
				<img src={document.icon} alt="" width="40" height="40" />
				<span>
					<strong>{document.title}</strong>
					<small>{document.description}</small>
				</span>
			</button>
		{/each}
	</div>
</section>

<style>
	.docs-index {
		display: grid;
		align-content: start;
		gap: var(--space-4);
		height: 100%;
		min-height: 0;
		overflow: auto;
		padding: var(--space-5);
		background:
			radial-gradient(circle at 18% 0%, rgb(233 84 32 / 0.12), transparent 15rem), linear-gradient(#d8c2a0, #9b7a51);
	}

	.index-header,
	.document-list {
		width: min(48rem, 100%);
		margin: 0 auto;
		background: #fff8ed;
		border: 1px solid #8e6d43;
		border-radius: var(--radius-2);
		box-shadow:
			0 1px 0 rgb(255 255 255 / 0.8) inset,
			0 1.25rem 2.5rem rgb(0 0 0 / 0.18);
	}

	.index-header {
		display: grid;
		grid-template-columns: 56px minmax(0, 1fr);
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-5);
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
		font-size: var(--text-6);
		line-height: var(--leading-tight);
	}

	.index-header p:last-child {
		margin-top: var(--space-2);
		color: var(--text-muted);
		font-size: var(--text-2);
	}

	.document-list {
		display: grid;
		gap: 1px;
		overflow: hidden;
		padding: var(--space-2);
	}

	.document-row {
		display: grid;
		grid-template-columns: 40px minmax(0, 1fr);
		gap: var(--space-3);
		align-items: center;
		width: 100%;
		padding: var(--space-3);
		text-align: left;
		border: 1px solid transparent;
		border-radius: var(--radius-2);
		cursor: default;
	}

	.document-row:hover {
		color: white;
		background: var(--selection);
	}

	.document-row span {
		display: grid;
		gap: 0.15rem;
	}

	.document-row strong {
		font-size: var(--text-2);
	}

	.document-row small {
		color: var(--text-muted);
		font-size: var(--text-1);
	}

	.document-row:hover small {
		color: rgb(255 255 255 / 0.82);
	}
</style>
