<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { lexiconBrowser } from '$lib/atproto/lexicon.svelte';
	import { lexiconPath } from '$lib/atproto/lexicon';
	import BrowserSummary from '$lib/components/browser/BrowserSummary.svelte';
	import BrowserTabs, { type BrowserTab } from '$lib/components/browser/BrowserTabs.svelte';
	import BrowserToolbar from '$lib/components/browser/BrowserToolbar.svelte';
	import SchemaDocument from '$lib/components/browser/SchemaDocument.svelte';
	import TraceView from '$lib/components/browser/TraceView.svelte';

	let { children } = $props();
	let activeTab = $state<BrowserTab>('schema');
	let handledRouteInput = $state<string | null>(null);
	const routeInput = $derived.by(() => page.params.nsid ?? page.url.searchParams.get('q') ?? '');
	const rawJson = $derived.by(() => {
		if (!lexiconBrowser.result) return '';
		return JSON.stringify(lexiconBrowser.result.lexicon, null, 2);
	});
	const statusText = $derived.by(() => {
		if (lexiconBrowser.isLoading) return `Contacting ${lexiconBrowser.address || 'lexdns'}...`;
		if (lexiconBrowser.error) return lexiconBrowser.error;
		if (lexiconBrowser.result)
			return `${lexiconBrowser.result.nsid} resolved from ${lexiconBrowser.result.source.name}`;
		return 'Ready';
	});
	const currentTrace = $derived(lexiconBrowser.result?.trace ?? lexiconBrowser.errorTrace);

	onMount(() => {
		openRouteInput();
	});

	$effect(() => {
		if (routeInput !== handledRouteInput) openRouteInput();
	});

	function openRouteInput() {
		handledRouteInput = routeInput;
		if (!routeInput) {
			if (!lexiconBrowser.result && !lexiconBrowser.error) lexiconBrowser.address = 'app.bsky.feed.post';
			return;
		}

		void lexiconBrowser.open(routeInput, { recordHistory: false });
	}

	function submitAddress() {
		const target = lexiconBrowser.address.trim();
		if (!target) return;

		void goto(resolve(lexiconPath(target) as `/lexicons/${string}`), { keepFocus: true, noScroll: true });
	}

	function openHome() {
		lexiconBrowser.address = 'app.bsky.feed.post';
		submitAddress();
	}

	function openReference(nsid: string) {
		lexiconBrowser.address = nsid;
		submitAddress();
	}
</script>

<section class="web-browser" aria-label="Lexicon Web Browser">
	<div class="browser-menubar" role="menubar" aria-label="Browser menus">
		<span role="menuitem">File</span>
		<span role="menuitem">Edit</span>
		<span role="menuitem">View</span>
		<span role="menuitem">Go</span>
		<span role="menuitem">Bookmarks</span>
		<span role="menuitem">Help</span>
	</div>

	<BrowserToolbar
		address={lexiconBrowser.address}
		isLoading={lexiconBrowser.isLoading}
		canGoBack={lexiconBrowser.canGoBack}
		canGoForward={lexiconBrowser.canGoForward}
		canReload={Boolean(lexiconBrowser.activeNsid)}
		onaddress={(address) => (lexiconBrowser.address = address)}
		onsubmit={submitAddress}
		onback={() => void lexiconBrowser.goBack()}
		onforward={() => void lexiconBrowser.goForward()}
		onreload={() => void lexiconBrowser.reload()}
		onhome={openHome} />

	<div class="browser-content">
		<BrowserSummary result={lexiconBrowser.result} error={lexiconBrowser.error} />

		<section class="page-view" aria-label="Lexicon document">
			<BrowserTabs {activeTab} onselect={(tab) => (activeTab = tab)} />

			<div class="browser-page">
				{#if lexiconBrowser.isLoading}
					<div class="empty-state">
						<img src="/icons/humanity/apps/web-browser.svg" alt="" width="54" height="54" />
						<h2>Resolving Lexicon schema...</h2>
						<p>{lexiconBrowser.address}</p>
					</div>
				{:else if lexiconBrowser.error}
					<div class="empty-state error">
						<img src="/icons/humanity/status/image-missing.svg" alt="" width="54" height="54" />
						<h2>{lexiconBrowser.errorCode ?? 'Lookup error'}</h2>
						<p>{lexiconBrowser.error}</p>
					</div>
				{:else if !lexiconBrowser.result}
					<div class="empty-state">
						<img src="/icons/humanity/apps/web-browser.svg" alt="" width="54" height="54" />
						<h2>No page loaded</h2>
						<p>Try app.bsky.feed.post or com.atproto.repo.getRecord.</p>
					</div>
				{:else if activeTab === 'schema'}
					<SchemaDocument lexicon={lexiconBrowser.result.lexicon} onreference={openReference} />
				{:else if activeTab === 'json'}
					<pre class="json-view"><code>{rawJson}</code></pre>
				{:else}
					<TraceView trace={currentTrace} />
				{/if}
			</div>
		</section>
	</div>

	<footer class="browser-statusbar" aria-live="polite">
		<span>{statusText}</span>
		{#if lexiconBrowser.result}
			<span>{lexiconBrowser.result.source.url}</span>
		{:else}
			<span>lex.desertthunder.dev</span>
		{/if}
	</footer>
</section>

{@render children()}

<style>
	.web-browser {
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr) auto;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		color: #201d1a;
		background: #d8c7ab;
	}

	.browser-menubar {
		display: flex;
		gap: var(--space-3);
		padding: 0.2rem var(--space-2);
		background: linear-gradient(#f5efe4, #d4c1a0);
		border-bottom: 1px solid #9f835d;
		font-size: var(--text-1);
	}

	.browser-menubar span {
		padding: 0.05rem var(--space-1);
	}

	.browser-content {
		display: grid;
		grid-template-columns: minmax(12rem, 17rem) minmax(0, 1fr);
		min-height: 0;
		overflow: hidden;
	}

	.page-view {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		min-width: 0;
		min-height: 0;
		background: #fff8ed;
	}

	.browser-page {
		min-height: 0;
		overflow: auto;
		background: #fffaf0;
	}

	.empty-state {
		display: grid;
		place-items: center;
		align-content: center;
		gap: var(--space-2);
		min-height: 100%;
		padding: var(--space-5);
		text-align: center;
	}

	.empty-state h2 {
		font-size: var(--text-5);
	}

	.empty-state p {
		max-width: 34rem;
		color: #67594c;
		overflow-wrap: anywhere;
	}

	.empty-state.error h2 {
		color: #9d2516;
	}

	.json-view {
		min-height: 100%;
		margin: 0;
		padding: var(--space-4);
		color: #eeeeec;
		background: #300a24;
		font-family: var(--font-mono);
		font-size: var(--text-1);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.browser-statusbar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1px;
		padding: 1px;
		background: #9f835d;
		border-top: 1px solid #8d704b;
		font-size: var(--text-1);
	}

	.browser-statusbar span {
		min-width: 0;
		overflow: hidden;
		padding: 0.2rem var(--space-2);
		background: #e6d5b8;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 760px) {
		.browser-content,
		.browser-statusbar {
			grid-template-columns: 1fr;
		}
	}
</style>
