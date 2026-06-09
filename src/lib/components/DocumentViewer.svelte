<script lang="ts">
	import type { Component } from 'svelte';

	type DocumentModule = { default: Component; metadata?: { title?: string } };

	type Props = { slug?: string };

	let { slug = 'changelog' }: Props = $props();

	const documents = import.meta.glob('../../routes/docs/*.md', { eager: true }) as Record<string, DocumentModule>;

	const document = $derived(Object.entries(documents).find(([path]) => slugFromPath(path) === slug)?.[1] ?? null);
	const Document = $derived(document?.default);
	const title = $derived(document?.metadata?.title ?? titleFromSlug(slug));

	function slugFromPath(path: string) {
		return path
			.split('/')
			.at(-1)
			?.replace(/\.md$/, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function titleFromSlug(value: string) {
		return value
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<div class="document-viewer">
	{#if Document}
		<article class="document-page" aria-label={title}>
			<Document />
		</article>
	{:else}
		<div class="document-missing" role="status">
			<img src="/icons/humanity/mimes/gnome-mime-application-pdf.svg" alt="" width="48" height="48" />
			<h2>Document not found</h2>
			<p>Document Viewer could not open “{slug}”.</p>
		</div>
	{/if}
</div>

<style>
	.document-viewer {
		height: 100%;
		overflow: auto;
		padding: var(--space-5);
		color: #24170f;
		background:
			radial-gradient(circle at 20% 0%, rgb(233 84 32 / 0.08), transparent 18rem), linear-gradient(#d8c2a0, #9b7a51);
	}

	.document-page,
	.document-missing {
		width: min(48rem, 100%);
		margin: 0 auto;
		padding: clamp(var(--space-5), 5vw, var(--space-8));
		background: #fff8ed;
		border: 1px solid #8e6d43;
		border-radius: var(--radius-2);
		box-shadow:
			0 1px 0 rgb(255 255 255 / 0.8) inset,
			0 1.25rem 2.5rem rgb(0 0 0 / 0.28);
	}

	.document-missing {
		display: grid;
		justify-items: center;
		gap: var(--space-2);
		text-align: center;
	}

	.document-missing h2 {
		font-size: var(--text-5);
	}

	.document-missing p {
		color: var(--text-muted);
	}

	.document-page :global(h1) {
		font-size: clamp(2rem, 6vw, 3.2rem);
		line-height: var(--leading-tight);
	}

	.document-page :global(h2) {
		margin-top: var(--space-6);
		font-size: var(--text-5);
		line-height: var(--leading-tight);
	}

	.document-page :global(h3) {
		margin-top: var(--space-5);
		font-size: var(--text-4);
	}

	.document-page :global(h4) {
		margin-top: var(--space-4);
		font-size: var(--text-3);
	}

	.document-page :global(p),
	.document-page :global(li) {
		font-size: var(--text-2);
		line-height: var(--leading-roomy);
	}

	.document-page :global(p),
	.document-page :global(ul),
	.document-page :global(ol) {
		margin-top: var(--space-3);
	}

	.document-page :global(ul),
	.document-page :global(ol) {
		padding-left: var(--space-5);
	}

	.document-page :global(ul) {
		list-style: disc;
	}

	.document-page :global(ol) {
		list-style: decimal;
	}

	.document-page :global(a) {
		color: #164a8b;
		font-weight: 700;
		text-decoration-line: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 0.18em;
		background: linear-gradient(transparent 58%, rgb(114 159 207 / 0.28) 58%);
		border-radius: var(--radius-1);
	}

	.document-page :global(a:hover) {
		color: white;
		background: var(--selection);
		text-decoration-color: rgb(255 255 255 / 0.8);
	}

	.document-page :global(code) {
		padding: 0.08rem 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.9em;
		background: #ead7b8;
		border: 1px solid #d2b991;
		border-radius: var(--radius-1);
	}
</style>
