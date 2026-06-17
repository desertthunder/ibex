<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { repoSession } from '$lib/atproto/session.svelte';
	import { accountSetup } from '$lib/atproto/setup.svelte';
	import { repoBrowser } from '$lib/atproto/repo.svelte';
	import { collectionPath, identityPath, recordPath } from '$lib/atproto/routes';
	import { isRecordValue } from '$lib/atproto/types';
	import type { CollectionSummary, RepoRecordSummary } from '$lib/atproto/types';
	import { SvelteMap } from 'svelte/reactivity';

	type PreviewField = 'summary' | 'text' | 'type' | 'createdAt' | 'uri' | 'cid';

	let searchQuery = $state('');
	let collectionFilter = $state('');
	let reverseRecords = $state(false);
	let previewField = $state<PreviewField>('summary');

	const filteredCollections = $derived.by(() => {
		const query = collectionFilter.trim().toLowerCase();
		if (!query) return repoBrowser.collections;

		return repoBrowser.collections.filter((collection) => {
			const label = collection.appLabel?.toLowerCase() ?? '';
			return collection.name.toLowerCase().includes(query) || label.includes(query);
		});
	});
	const collectionGroups = $derived.by(() => groupCollections(filteredCollections));
	const visibleRecords = $derived.by(() => {
		if (!reverseRecords) return repoBrowser.records;
		return [...repoBrowser.records].reverse();
	});
	const identity = $derived(repoSession.identity ?? (page.route.id === '/browse' ? accountSetup.identity : null));
	const canUseAsDefault = $derived(Boolean(identity && identity.did !== accountSetup.identity?.did));
	type RepoPathname = `/repos/${string}`;
	const navigateTo = goto as (url: string, options?: Parameters<typeof goto>[1]) => ReturnType<typeof goto>;

	onMount(() => {
		if (page.route.id === '/browse' && identity && repoBrowser.loadedDid !== identity.did) {
			repoSession.set(identity);
			repoBrowser.load(identity);
		}
	});

	function selectCollection(collectionName: string) {
		if (identity) {
			searchQuery = '';
			navigate(collectionPath({ did: identity.did, collection: collectionName }));
		}
	}

	function searchRecords() {
		if (identity) {
			repoBrowser.searchRecords(identity, searchQuery);
		}
	}

	function clearSearch() {
		searchQuery = '';
		searchRecords();
	}

	function openRecord(record: RepoRecordSummary) {
		repoBrowser.selectedRecord = record;

		if (identity) {
			navigate(recordPath({ did: identity.did, collection: record.collection, rkey: record.rkey }));
		}
	}

	function openIdentityInspector() {
		if (!identity) return;

		navigate(identityPath(identity.did));
	}

	function updatePageSize(event: Event) {
		const select = event.currentTarget;

		if (!(select instanceof HTMLSelectElement) || !identity) return;

		void repoBrowser.setRecordPageSize(identity, Number(select.value));
	}

	function updatePreviewField(event: Event) {
		const select = event.currentTarget;
		if (!(select instanceof HTMLSelectElement)) return;

		previewField = select.value as PreviewField;
	}

	function previewTitle(record: RepoRecordSummary) {
		if (previewField === 'summary') return record.title;
		if (previewField === 'text') return stringRecordField(record, 'text') ?? record.title;
		if (previewField === 'type') return stringRecordField(record, '$type') ?? record.collection;
		if (previewField === 'createdAt') return stringRecordField(record, 'createdAt') ?? record.modified;
		if (previewField === 'uri') return record.uri;
		if (previewField === 'cid') return record.cid || 'No CID';

		return record.title;
	}

	function previewBody(record: RepoRecordSummary) {
		if (previewField === 'summary') return record.body;
		if (previewField === 'text') return record.body;
		if (previewField === 'type') return `Collection: ${record.collection}`;
		if (previewField === 'createdAt') return `Indexed as ${record.modified}`;
		if (previewField === 'uri') return `${record.collection}/${record.rkey}`;
		if (previewField === 'cid') return record.cid ? `Record CID: ${record.cid}` : 'Record returned without a CID.';

		return record.body;
	}

	function stringRecordField(record: RepoRecordSummary, key: string) {
		if (!isRecordValue(record.value)) return null;

		const value = record.value[key];
		return typeof value === 'string' && value.length > 0 ? value : null;
	}

	function navigate(path: string) {
		void navigateTo(resolve(path as RepoPathname), { keepFocus: true, noScroll: true });
	}

	function useCurrentRepoAsDefault() {
		if (!identity) return;
		accountSetup.save(identity);
	}

	function groupCollections(collections: CollectionSummary[]) {
		type M = { namespace: string; label: string; icon: string; collections: CollectionSummary[] };
		const groups = new SvelteMap<string, M>();

		for (const collection of collections) {
			const namespace = namespaceForCollection(collection.name);
			const group = groups.get(namespace) ?? {
				namespace,
				label: collection.appLabel ?? namespace,
				icon: collection.icon,
				collections: []
			};

			if (!group.label || group.label === namespace) group.label = collection.appLabel ?? namespace;
			if (!group.icon) group.icon = collection.icon;
			group.collections.push(collection);
			groups.set(namespace, group);
		}

		return [...groups.values()].sort((a, b) => a.namespace.localeCompare(b.namespace));
	}

	function namespaceForCollection(collection: string) {
		const parts = collection.split('.');
		return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : collection;
	}
</script>

<div class="collection-browser">
	<aside class="sidebar" aria-label="Collections">
		<header>
			<h2>Collections</h2>
			<p>{identity?.handle ?? 'at:// repo folders'}</p>
		</header>

		<label class="collection-filter">
			<span>Filter</span>
			<input bind:value={collectionFilter} placeholder="Collection name" />
		</label>

		<div class="collection-tree" role="tree" aria-label="Repository namespaces">
			{#if repoBrowser.isLoadingCollections}
				<p class="empty-row">Loading collections…</p>
			{:else if filteredCollections.length === 0}
				<p class="empty-row">No collections match that filter.</p>
			{:else}
				{#each collectionGroups as group (group.namespace)}
					<details class="namespace-group" open>
						<summary aria-label={`${group.namespace} namespace`}>
							<span class="namespace-leading" aria-hidden="true">
								<span class="namespace-caret">▸</span>
								<img src={group.icon} alt="" width="22" height="22" />
							</span>
							<span class="namespace-name">{group.namespace}.* ({group.collections.length})</span>
						</summary>

						<ul role="group">
							{#each group.collections as collection (collection.name)}
								<li>
									<button
										role="treeitem"
										aria-selected={collection.name === repoBrowser.selectedCollection}
										class:active={collection.name === repoBrowser.selectedCollection}
										type="button"
										onclick={() => selectCollection(collection.name)}>
										<img src={collection.icon} alt="" width="22" height="22" />
										<span>{collection.name}</span>
										<small>{collection.loadedCount ?? 'repo'}</small>
									</button>
								</li>
							{/each}
						</ul>
					</details>
				{/each}
			{/if}
		</div>
	</aside>

	<section class="record-pane" aria-label="Collection records">
		<div class="summary-card">
			<img
				src={repoBrowser.selectedSummary?.icon ?? '/icons/humanity/apps/internet-feed-reader.svg'}
				alt=""
				width="48"
				height="48" />
			<div>
				<p class="eyebrow">Selected collection</p>
				<h2>{repoBrowser.selectedCollection ?? 'No collection selected'}</h2>
				{#if repoBrowser.selectedSummary?.appLabel}
					<p class="app-label">{repoBrowser.selectedSummary.appLabel}</p>
				{/if}
				<p>
					{#if repoBrowser.isLoadingRecords}
						Fetching public records from {identity?.pds ?? 'the public API'}…
					{:else if repoBrowser.searchQuery}
						Searching cached records for “{repoBrowser.searchQuery}”.
					{:else}
						Browse records as if they were tidy Nautilus files.
					{/if}
				</p>
			</div>
			<div class="summary-controls">
				<div class="collection-controls" aria-label="Collection controls">
					<label>
						<span>Page size</span>
						<select
							value={repoBrowser.recordPageSize}
							disabled={!repoBrowser.selectedCollection || repoBrowser.isLoadingRecords || repoBrowser.isSearching}
							onchange={updatePageSize}>
							<option value="10">10 records</option>
							<option value="25">25 records</option>
							<option value="50">50 records</option>
							<option value="100">100 records</option>
						</select>
					</label>
					<label>
						<span>Preview</span>
						<select value={previewField} onchange={updatePreviewField}>
							<option value="summary">Summary</option>
							<option value="text">Text</option>
							<option value="type">Schema type</option>
							<option value="createdAt">Created time</option>
							<option value="uri">AT URI</option>
							<option value="cid">CID</option>
						</select>
					</label>
					<label class="reverse-toggle">
						<input type="checkbox" bind:checked={reverseRecords} />
						<span>Reverse order</span>
					</label>
				</div>
				<form
					class="search-box"
					role="search"
					onsubmit={(event) => {
						event.preventDefault();
						searchRecords();
					}}>
					<label for="record-search">Search</label>
					<div>
						<input
							id="record-search"
							bind:value={searchQuery}
							placeholder="Search records"
							disabled={!repoBrowser.selectedCollection || repoBrowser.isLoadingRecords || repoBrowser.isSearching} />
						<button type="submit" disabled={!searchQuery.trim() || repoBrowser.isSearching}>Search</button>
						{#if repoBrowser.searchQuery}
							<button type="button" class="clear-search" onclick={clearSearch}>Clear</button>
						{/if}
					</div>
				</form>
				<button class="identity-launcher" type="button" disabled={!identity} onclick={openIdentityInspector}>
					<img src="/icons/humanity/apps/identity-inspector.svg" alt="" width="22" height="22" />
					<span>Identity</span>
				</button>
				{#if canUseAsDefault}
					<button class="identity-launcher" type="button" onclick={useCurrentRepoAsDefault}>
						<img src="/icons/humanity/places/user-home.svg" alt="" width="22" height="22" />
						<span>Use as default</span>
					</button>
				{/if}
			</div>
		</div>

		<div class="record-list">
			<header>
				<span>Name</span>
				<span>Author</span>
				<span>Modified</span>
			</header>

			{#if repoBrowser.error}
				<p class="message error">{repoBrowser.error}</p>
			{:else if repoBrowser.isLoadingRecords || repoBrowser.isSearching}
				<p class="message">{repoBrowser.isSearching ? 'Searching cached records…' : 'Loading records…'}</p>
			{:else if repoBrowser.records.length === 0}
				<p class="message">
					{#if repoBrowser.searchQuery}
						No cached records matched that search.
					{:else}
						No public records found for this collection.
					{/if}
				</p>
			{:else}
				{#each visibleRecords as record (record.uri)}
					<button class="record-row" type="button" onclick={() => openRecord(record)}>
						<img src={record.icon} alt="" width="32" height="32" />
						<div>
							<h3>{previewTitle(record)}</h3>
							<p>{previewBody(record)}</p>
						</div>
						<strong>{record.author}</strong>
						<time>{record.modified}</time>
					</button>
				{/each}

				{#if repoBrowser.canLoadMoreRecords && !repoBrowser.searchQuery}
					<button
						class="load-more-records"
						type="button"
						disabled={repoBrowser.isLoadingMoreRecords}
						onclick={() => identity && repoBrowser.loadNextRecordPage(identity)}>
						{repoBrowser.isLoadingMoreRecords ? 'Loading more records…' : 'Load more records'}
					</button>
				{/if}
			{/if}
		</div>
	</section>
</div>

<style>
	.collection-browser {
		display: grid;
		grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr);
		height: 100%;
		overflow: hidden;
		border: 1px solid #a58a63;
		background: #fff8ed;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.7) inset;
	}

	.sidebar {
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr);
		min-height: 0;
		background: linear-gradient(90deg, #cdb690, #e6d5b8);
		border-right: 1px solid #9e8057;
	}

	.sidebar header {
		padding: var(--space-3);
		border-bottom: 1px solid #a88c62;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.45);
	}

	.collection-filter {
		display: grid;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid #b89a70;
	}

	.collection-filter span,
	.collection-controls span {
		color: #4b3824;
		font-size: var(--text-0);
		font-weight: 700;
		text-transform: uppercase;
	}

	.collection-filter input,
	.collection-controls select {
		min-width: 0;
		padding: 0.3rem 0.4rem;
		color: var(--text);
		background: #fffdf8;
		border: 1px solid #a88b63;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-sunken);
		font: inherit;
		font-size: var(--text-1);
	}

	.sidebar h2,
	.summary-card h2 {
		font-size: var(--text-4);
		line-height: var(--leading-tight);
	}

	.sidebar p,
	.summary-card p,
	.record-list p {
		color: var(--text-muted);
		font-size: var(--text-1);
	}

	.collection-tree {
		min-height: 0;
		overflow: auto;
		padding: var(--space-2);
	}

	.namespace-group + .namespace-group {
		margin-top: var(--space-1);
	}

	.namespace-group summary,
	.sidebar button {
		display: grid;
		grid-template-columns: 22px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		border: 1px solid transparent;
		border-radius: var(--radius-2);
		font-size: var(--text-1);
		text-align: left;
		cursor: default;
	}

	.namespace-group summary {
		grid-template-columns: 3.4rem minmax(0, 1fr);
		padding: var(--space-2);
		color: #49321f;
		font-weight: 700;
		list-style: none;
		background: rgb(255 255 255 / 0.22);
		border-color: rgb(145 111 71 / 0.35);
	}

	.namespace-group summary::-webkit-details-marker {
		display: none;
	}

	.namespace-leading {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		min-width: 0;
	}

	.namespace-caret {
		width: 0.75rem;
		color: #6d4b2d;
		font-size: var(--text-0);
		line-height: 1;
	}

	.namespace-group[open] .namespace-caret {
		transform: rotate(90deg);
	}

	.namespace-name {
		justify-self: end;
	}

	.namespace-group ul {
		display: grid;
		gap: 1px;
		padding: var(--space-1) 0 var(--space-1) var(--space-3);
	}

	.sidebar button {
		padding: var(--space-1) var(--space-2);
	}

	.sidebar button.active,
	.sidebar button:hover,
	.namespace-group summary:hover {
		color: white;
		background: linear-gradient(#e48631, #b65312);
		border-color: #f4b46b #8d3c0b #713009 #f1a35e;
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.55);
	}

	.sidebar span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sidebar small {
		font-size: var(--text-0);
		opacity: 0.82;
	}

	.empty-row,
	.message {
		padding: var(--space-3);
		color: var(--text-muted);
		font-size: var(--text-1);
	}

	.message.error {
		color: #721c0d;
		background: #f7d6c9;
		border: 1px solid #b55a38;
		border-radius: var(--radius-2);
	}

	.record-pane {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		min-width: 0;
		min-height: 0;
		background: #fff9ef;
	}

	.summary-card {
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr) minmax(16rem, 22rem);
		gap: var(--space-3);
		align-items: center;
		padding: var(--space-4);
		background: linear-gradient(#fffaf1, #ead8b8);
		border-bottom: 1px solid #b29366;
	}

	.summary-controls,
	.search-box {
		display: grid;
		gap: var(--space-1);
		justify-self: end;
		width: 100%;
	}

	.collection-controls {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: var(--space-2);
		align-items: end;
		padding: var(--space-2);
		background: rgb(255 253 248 / 0.58);
		border: 1px solid #c0a47a;
		border-radius: var(--radius-2);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.5) inset;
	}

	.collection-controls label {
		display: grid;
		gap: var(--space-1);
	}

	.collection-controls .reverse-toggle {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 1.5rem;
	}

	.reverse-toggle input {
		width: 0.95rem;
		height: 0.95rem;
		margin: 0;
		accent-color: #c96c1c;
	}

	.search-box label {
		color: var(--text-muted);
		font-size: var(--text-0);
		font-weight: 700;
		text-transform: uppercase;
	}

	.search-box div {
		display: flex;
		gap: var(--space-1);
	}

	.search-box input {
		min-width: 0;
		flex: 1;
		padding: 0.35rem 0.45rem;
		color: var(--text);
		background: #fffdf8;
		border: 1px solid #a88b63;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-sunken);
		font: inherit;
		font-size: var(--text-1);
	}

	.search-box button,
	.identity-launcher {
		padding: 0.35rem 0.55rem;
		color: #2c180d;
		background: linear-gradient(#fff8e8, #d3b17d);
		border: 1px solid #9d7a4b;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
		font: inherit;
		font-size: var(--text-1);
		font-weight: 700;
	}

	.identity-launcher {
		display: inline-flex;
		align-items: center;
		justify-self: end;
		gap: var(--space-1);
		min-height: 1.9rem;
		cursor: default;
	}

	.identity-launcher:active {
		scale: 0.96;
	}

	.search-box button:disabled,
	.search-box input:disabled,
	.identity-launcher:disabled {
		opacity: 0.62;
	}

	.search-box .clear-search {
		font-weight: 500;
	}

	.eyebrow {
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.app-label {
		font-weight: 700;
	}

	.record-list {
		overflow: auto;
		padding: var(--space-3);
	}

	.record-list > header,
	.record-row {
		display: grid;
		grid-template-columns: minmax(14rem, 1fr) minmax(10rem, 14rem) 5rem;
		gap: var(--space-3);
		align-items: center;
	}

	.record-list > header {
		padding: var(--space-1) var(--space-3);
		color: var(--text-muted);
		background: linear-gradient(#eadbbf, #cbb18a);
		border: 1px solid #a88b63;
		border-radius: var(--radius-2) var(--radius-2) 0 0;
		font-size: var(--text-0);
		font-weight: 700;
		text-transform: uppercase;
	}

	.record-row {
		grid-template-columns: 32px minmax(14rem, 1fr) minmax(10rem, 14rem) 5rem;
		padding: var(--space-3);
		background: #fffdf8;
		border-right: 1px solid #d7c4a4;
		border-bottom: 1px solid #d7c4a4;
		border-left: 1px solid #d7c4a4;
	}

	.record-row:nth-child(odd) {
		background: #f7eddb;
	}

	.record-row:hover {
		background: #f1d09d;
	}

	.load-more-records {
		display: block;
		width: max-content;
		margin: var(--space-3) auto 0;
		padding: var(--space-2) var(--space-4);
		color: #2c180d;
		background: linear-gradient(#fff8e8, #d3b17d);
		border: 1px solid #9d7a4b;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
		font: inherit;
		font-size: var(--text-1);
		font-weight: 700;
	}

	.load-more-records:disabled {
		opacity: 0.62;
	}

	.record-row img,
	.sidebar img,
	.summary-card > img {
		object-fit: contain;
	}

	.record-list h3 {
		font-size: var(--text-2);
		line-height: var(--leading-tight);
	}

	.record-row {
		width: 100%;
		text-align: left;
		cursor: default;
	}

	.record-list strong,
	.record-list time {
		color: var(--text-muted);
		font-size: var(--text-1);
		font-weight: 500;
	}

	.record-list time {
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 800px) {
		.collection-browser {
			grid-template-columns: 1fr;
		}

		.sidebar {
			display: none;
		}

		.summary-card {
			grid-template-columns: 48px minmax(0, 1fr);
		}

		.search-box {
			grid-column: 1 / -1;
			justify-self: stretch;
		}

		.record-list > header,
		.record-row {
			grid-template-columns: 32px minmax(0, 1fr);
		}

		.record-list > header,
		.record-list strong,
		.record-list time {
			display: none;
		}
	}
</style>
