<script lang="ts">
	import { repoBlobs } from '$lib/atproto/blobs.svelte';
	import { repoSession } from '$lib/atproto/session.svelte';

	let previewMode = $state<'image' | 'video' | 'unsupported'>('image');
	let copied = $state(false);

	const selectedBlob = $derived(repoBlobs.selectedBlob);
	const identity = $derived(repoSession.identity);
	const canGoPrevious = $derived(repoBlobs.selectedIndex > 0);
	const canGoNext = $derived(repoBlobs.selectedIndex >= 0 && repoBlobs.selectedIndex < repoBlobs.blobs.length - 1);

	function selectBlob(cid: string) {
		if (!identity) return;
		repoBlobs.select(identity, cid);
		resetPreview();
	}

	function selectPrevious() {
		repoBlobs.selectPrevious();
		resetPreview();
	}

	function selectNext() {
		repoBlobs.selectNext();
		resetPreview();
	}

	function resetPreview() {
		previewMode = 'image';
		copied = false;
	}

	function loadMore() {
		if (!identity) return;
		void repoBlobs.loadMore(identity);
	}

	async function copyCid() {
		if (!selectedBlob) return;
		await navigator.clipboard.writeText(selectedBlob.cid);
		copied = true;
	}

	function openRawBlob() {
		if (!selectedBlob) return;
		window.open(selectedBlob.rawUrl, '_blank', 'noopener,noreferrer');
	}

	function openSourceUri() {
		if (!selectedBlob?.sourceUri) return;
		window.open(selectedBlob.sourceUri, '_blank', 'noopener,noreferrer');
	}
</script>

<div class="eog-viewer">
	<aside class="blob-sidebar" aria-label="Repository blobs">
		<header>
			<img src="/icons/humanity/apps/eog.svg" alt="" width="32" height="32" />
			<div>
				<h2>Image Viewer</h2>
				<p>{identity?.handle ?? 'at:// blobs'}</p>
			</div>
		</header>

		<div class="blob-list">
			{#if repoBlobs.isLoading}
				<p class="message">Loading blobs...</p>
			{:else if repoBlobs.blobs.length === 0}
				<p class="message">No public blobs found.</p>
			{:else}
				{#each repoBlobs.blobs as blob (blob.cid)}
					<button
						type="button"
						class:active={blob.cid === repoBlobs.selectedCid}
						aria-current={blob.cid === repoBlobs.selectedCid ? 'true' : undefined}
						onclick={() => selectBlob(blob.cid)}>
						<img src={blob.sourceIcon ?? '/icons/humanity/mimes/image-x-generic.svg'} alt="" width="24" height="24" />
						<span>{blob.cid}</span>
					</button>
				{/each}

				{#if repoBlobs.canLoadMore}
					<button class="load-more" type="button" disabled={repoBlobs.isLoadingMore} onclick={loadMore}>
						{repoBlobs.isLoadingMore ? 'Loading...' : 'Load more'}
					</button>
				{/if}
			{/if}
		</div>
	</aside>

	<section class="preview-pane" aria-label="Blob preview">
		<div class="eog-toolbar" aria-label="Image viewer controls">
			<button type="button" disabled={!canGoPrevious} onclick={selectPrevious}>
				<span aria-hidden="true">◀</span>
				Previous
			</button>
			<button type="button" disabled={!canGoNext} onclick={selectNext}>
				Next
				<span aria-hidden="true">▶</span>
			</button>
			<button type="button" disabled={!selectedBlob} onclick={copyCid}>{copied ? 'Copied' : 'Copy CID'}</button>
			<button type="button" disabled={!selectedBlob} onclick={openRawBlob}>Raw</button>
		</div>

		<div class="preview-stage">
			{#if repoBlobs.error}
				<p class="message error">{repoBlobs.error}</p>
			{/if}

			{#if selectedBlob}
				{#if previewMode === 'image'}
					<img
						class="blob-preview"
						src={selectedBlob.rawUrl}
						alt={`Blob ${selectedBlob.cid}`}
						onerror={() => (previewMode = 'video')} />
				{:else if previewMode === 'video'}
					<video class="blob-preview" src={selectedBlob.rawUrl} controls onerror={() => (previewMode = 'unsupported')}>
						<track kind="captions" />
					</video>
				{:else}
					<div class="unsupported-preview">
						<img src="/icons/humanity/status/image-missing.svg" alt="" width="48" height="48" />
						<h3>Preview unavailable</h3>
						<p>This blob could not be rendered as an image or video by the browser.</p>
						<button type="button" onclick={openRawBlob}>Open raw blob</button>
					</div>
				{/if}
			{:else if !repoBlobs.isLoading}
				<div class="unsupported-preview">
					<img src="/icons/humanity/apps/eog.svg" alt="" width="48" height="48" />
					<h3>No blob selected</h3>
					<p>Select a CID from the list to preview it.</p>
				</div>
			{/if}
		</div>

		<footer class="blob-status">
			{#if selectedBlob}
				<span>{selectedBlob.cid}</span>
				{#if selectedBlob.sourceUri}
					<button type="button" onclick={openSourceUri}>{selectedBlob.sourceUri}</button>
				{/if}
			{:else}
				<span>{repoBlobs.blobs.length} blobs</span>
			{/if}
		</footer>
	</section>
</div>

<style>
	.eog-viewer {
		display: grid;
		grid-template-columns: minmax(12rem, 17rem) minmax(0, 1fr);
		height: 100%;
		overflow: hidden;
		border: 1px solid #9f8158;
		background: #efe0c6;
	}

	.blob-sidebar {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		min-width: 0;
		min-height: 0;
		background: linear-gradient(90deg, #cbb28a, #e4d1b1);
		border-right: 1px solid #92724a;
	}

	.blob-sidebar header {
		display: grid;
		grid-template-columns: 32px minmax(0, 1fr);
		gap: var(--space-2);
		align-items: center;
		padding: var(--space-3);
		border-bottom: 1px solid #a88c62;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.45);
	}

	.blob-sidebar h2 {
		font-size: var(--text-3);
		line-height: var(--leading-tight);
	}

	.blob-sidebar p,
	.message,
	.unsupported-preview p,
	.blob-status {
		color: var(--text-muted);
		font-size: var(--text-1);
	}

	.blob-list {
		display: grid;
		align-content: start;
		gap: 1px;
		min-height: 0;
		overflow: auto;
		padding: var(--space-2);
	}

	.blob-list button {
		display: grid;
		grid-template-columns: 24px minmax(0, 1fr);
		gap: var(--space-2);
		align-items: center;
		width: 100%;
		padding: var(--space-2);
		color: #2c180d;
		background: rgb(255 255 255 / 0.28);
		border: 1px solid transparent;
		border-radius: var(--radius-2);
		font: inherit;
		font-size: var(--text-1);
		text-align: left;
		cursor: default;
	}

	.blob-list button:hover,
	.blob-list button.active {
		color: white;
		background: linear-gradient(#e48631, #b65312);
		border-color: #f4b46b #8d3c0b #713009 #f1a35e;
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.55);
	}

	.blob-list button:disabled {
		opacity: 0.62;
	}

	.blob-list span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.blob-list .load-more {
		display: block;
		grid-template-columns: 1fr;
		margin-top: var(--space-2);
		text-align: center;
	}

	.preview-pane {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		min-width: 0;
		min-height: 0;
		background: #fff8ec;
	}

	.eog-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		padding: var(--space-2);
		background: linear-gradient(#efe0c6, #ccb28a);
		border-bottom: 1px solid #96734a;
	}

	.eog-toolbar button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: 1.7rem;
		padding: 0 var(--space-3);
		color: #2c180d;
		background: linear-gradient(#fff8e8, #d3b17d);
		border: 1px solid #9d7a4b;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
		font: inherit;
		font-size: var(--text-1);
		font-weight: 700;
	}

	.eog-toolbar button:disabled {
		opacity: 0.55;
	}

	.preview-stage {
		display: grid;
		place-items: center;
		min-width: 0;
		min-height: 0;
		overflow: auto;
		padding: var(--space-3);
		background:
			linear-gradient(45deg, #e7d8bd 25%, transparent 25%), linear-gradient(-45deg, #e7d8bd 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #e7d8bd 75%), linear-gradient(-45deg, transparent 75%, #e7d8bd 75%),
			#f9efe0;
		background-position:
			0 0,
			0 10px,
			10px -10px,
			-10px 0;
		background-size: 20px 20px;
	}

	.blob-preview {
		display: block;
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		background: #fffdf8;
		border: 1px solid #8e7450;
		box-shadow: 0 1px 3px rgb(55 32 14 / 0.32);
	}

	.unsupported-preview,
	.message {
		max-width: 28rem;
		padding: var(--space-4);
		text-align: center;
		background: #fff8ec;
		border: 1px solid #b89564;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
	}

	.unsupported-preview h3 {
		margin-top: var(--space-2);
		font-size: var(--text-4);
	}

	.unsupported-preview button,
	.blob-status button {
		color: #8a3f0b;
		background: transparent;
		border: 0;
		font: inherit;
		font-weight: 700;
		text-decoration: underline;
	}

	.unsupported-preview button {
		margin-top: var(--space-2);
	}

	.message.error {
		color: #721c0d;
		background: #f7d6c9;
		border-color: #b55a38;
	}

	.blob-status {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		min-width: 0;
		padding: var(--space-1) var(--space-2);
		background: linear-gradient(#eadbbf, #cbb18a);
		border-top: 1px solid #a88b63;
	}

	.blob-status span,
	.blob-status button {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 760px) {
		.eog-viewer {
			grid-template-columns: 1fr;
		}

		.blob-sidebar {
			display: none;
		}
	}
</style>
