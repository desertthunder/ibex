<script lang="ts">
	import type { LexiconTrace } from '$lib/atproto/lexicon';

	type Props = { trace: LexiconTrace | null };

	let { trace }: Props = $props();
	const traceRows = $derived.by(() => rowsForTrace(trace));

	function rowsForTrace(currentTrace: LexiconTrace | null) {
		if (!currentTrace) return [];

		return [
			{ step: 'DNS name', value: currentTrace.dnsName ?? 'Not attempted' },
			{
				step: 'TXT records',
				value:
					currentTrace.txtRecords.length > 0 ? currentTrace.txtRecords.map((record) => record.data).join('\n') : 'None'
			},
			{ step: 'Selected DID', value: currentTrace.selectedDid ?? 'None' },
			{
				step: 'DID document',
				value: currentTrace.didDocument.url
					? `${currentTrace.didDocument.url} (${currentTrace.didDocument.status ?? 'unknown'})`
					: 'Not fetched'
			},
			{ step: 'PDS endpoint', value: currentTrace.pdsEndpoint ?? 'None' },
			{
				step: 'Record fetch',
				value: currentTrace.repoGetRecord.url
					? `${currentTrace.repoGetRecord.url} (${currentTrace.repoGetRecord.status ?? 'unknown'})`
					: 'Not fetched'
			},
			{ step: 'Final', value: currentTrace.final.message }
		];
	}
</script>

<div class="trace-view">
	{#each traceRows as row (row.step)}
		<section>
			<h2>{row.step}</h2>
			<pre>{row.value}</pre>
		</section>
	{:else}
		<section>
			<h2>Trace</h2>
			<pre>No resolution trace is available.</pre>
		</section>
	{/each}
</div>

<style>
	.trace-view {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-4);
	}

	.trace-view section {
		border: 1px solid #b89a70;
		background: #fffdf7;
	}

	.trace-view h2 {
		padding: var(--space-2) var(--space-3);
		background: linear-gradient(#f2ead9, #dfcfaf);
		border-bottom: 1px solid #b89a70;
		font-size: var(--text-2);
	}

	pre {
		margin: 0;
		padding: var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--text-1);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
</style>
