<script lang="ts">
	import { recordPath } from '$lib/atproto/routes';
	import type { ResolvedLexicon } from '$lib/atproto/lexicon';

	type Props = { result: ResolvedLexicon | null; error: string | null };

	let { result, error }: Props = $props();

	function sourceRecordPath(sourceUrl: string) {
		if (!sourceUrl.startsWith('at://')) return sourceUrl;
		const [did, collection, rkey] = sourceUrl.slice('at://'.length).split('/');
		if (!did || !collection || !rkey) return sourceUrl;
		return recordPath({ did, collection, rkey: decodeURIComponent(rkey) });
	}
</script>

<aside class="page-summary" aria-label="Lexicon summary">
	<img src="/icons/humanity/apps/web-browser.svg" alt="" width="48" height="48" />
	{#if result}
		<h2>{result.nsid}</h2>
		<dl>
			<div>
				<dt>Authority</dt>
				<dd>{result.parsed.authority}</dd>
			</div>
			<div>
				<dt>DNS</dt>
				<dd>{result.parsed.dnsName}</dd>
			</div>
			<div>
				<dt>Cache</dt>
				<dd>{result.cache}</dd>
			</div>
			<div>
				<dt>Fetched</dt>
				<dd>{new Date(result.fetchedAt).toLocaleString()}</dd>
			</div>
		</dl>
		<a href={result._links.self.href} target="_blank" rel="external noreferrer">lexdns API</a>
		<a href={sourceRecordPath(result.source.url)}>AT URI</a>
	{:else if error}
		<h2>Lookup failed</h2>
		<p>{error}</p>
	{:else}
		<h2>Lexicon Browser</h2>
		<p>Enter an NSID or Lexicon schema record URL.</p>
	{/if}
</aside>

<style>
	.page-summary {
		display: grid;
		align-content: start;
		gap: var(--space-3);
		min-height: 0;
		padding: var(--space-3);
		overflow: auto;
		background: linear-gradient(90deg, #cdb690, #e8d9bf);
		border-right: 1px solid #9f835d;
	}

	.page-summary h2 {
		overflow-wrap: anywhere;
		font-size: var(--text-4);
		line-height: var(--leading-tight);
	}

	.page-summary p {
		color: #5f4d3b;
		font-size: var(--text-1);
	}

	dl {
		display: grid;
		gap: 1px;
		margin: 0;
		background: #a58a63;
		border: 1px solid #a58a63;
	}

	dl div {
		display: grid;
		gap: 1px;
		background: #fff8ed;
	}

	dt,
	dd {
		margin: 0;
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-1);
	}

	dt {
		color: #4b3824;
		font-weight: 700;
	}

	dd {
		overflow-wrap: anywhere;
		font-family: var(--font-mono);
	}

	a {
		color: #235a97;
		font-size: var(--text-1);
		font-weight: 700;
		text-decoration: underline;
	}

	@media (max-width: 760px) {
		.page-summary {
			display: none;
		}
	}
</style>
